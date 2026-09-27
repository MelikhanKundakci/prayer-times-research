// Versioned MWL-labelled local composition of the 2009 local-relative policy.
// Astronomy, clock frame, year ownership and overlap handling are explicit
// software conventions; institutional timetable equivalence is not claimed.
import {fields} from '../input.mjs';
import {calculateLocalSolarDay} from './solar.mjs';
import {calculateSunniDay,getSunniProfile} from './sunni.mjs';
import {createLocalScheduleCalculator} from './schedule.mjs';
import {selectLocalRelativeSegment} from './local-relative-policy.mjs';

const DAY=86_400_000,MINUTE=60_000,EVENTS=['fajr','sunrise','dhuhr','asr','maghrib','isha'];
const MIN_DATE='2001-01-01',MAX_DATE='2098-12-31';
const SOURCE='https://astronomycenter.net/latitude.html?l=ar';
const phaseFrame='raw UTC epoch minus UTC midnight of the source civil date; unwrapped, without DST offset';
export const LOCAL_RELATIVE_VERSION='0.1.0-local-relative';
const midnight=date=>Date.parse(`${date}T00:00:00Z`);
const offset=(date,n)=>new Date(midnight(date)+n*DAY).toISOString().slice(0,10);
const inRange=date=>date>=MIN_DATE&&date<=MAX_DATE;
const phase=(date,epoch)=>epoch-midnight(date);
const ownershipError=error=>error instanceof RangeError&&/No apparent solar transit belongs to civil date|Ambiguous apparent solar transit for civil date/.test(error.message);

function freeze(value){
  if(value&&typeof value==='object'&&!Object.isFrozen(value)){
    Object.values(value).forEach(freeze);Object.freeze(value);
  }return value;
}
const definitions=[1,2].map(factor=>{
  const base=structuredClone(getSunniProfile(`sunni-mwl-shadow${factor}-physical-v1`));
  return freeze({...base,id:`sunni-mwl-shadow${factor}-local-relative-v1`,label:`MWL · Asr ${factor} · local relative estimate`,
    sources:{...base.sources,localRelative:SOURCE},
    sourceScope:base.sourceScope+' Optional interpretation of the 2009 local-relative high-latitude criteria, with declared UTC phase, union-episode mean year, signed-latitude scope and conservative bidirectional ramps; not the issuing body’s complete production implementation.',
    composition:{...base.composition,highLatitudeMode:'local-relative'},
    relativePolicy:{minimumAbsoluteLatitude:48.6,maximumAbsoluteLatitude:66.6,minimumPolicyYear:2002,maximumPolicyYear:2097,
      hemispherePolicy:'Both hemispheres are an explicit local extension of the European source account.',
      phaseFrame,meanYear:'Gregorian year of the first source date in the complete union episode where either Fajr or Isha needs replacement; each prayer keeps its own segment anchors',
      ratio:'arithmetic mean of (actual Isha minus actual sunset)/(next actual sunrise minus actual sunset), present undisturbed Isha days only',
      sharedFajrIshaRatio:true,disturbanceThresholdMinutes:10,disturbanceOperator:'strictly greater; predecessor OR successor when present',
      rampMinutesPerSourceDay:5,transition:'Isha max(candidate,left ramp,right ramp); Fajr min(candidate,left ramp,right ramp)',
      sourceJoinDifference:'Conservative envelope reaches the candidate without the source’s within-five-minute snap; overlapping ramps use the same envelope.',
      solarAngles:{fajr:18,isha:17},official:false,institutionalEquivalence:'not-claimed'}});
});
const registry=new Map(definitions.map(value=>[value.id,value]));
export const LOCAL_RELATIVE_PROFILES=Object.freeze([...registry.keys()]);
export function getRelativeProfile(id){
  if(typeof id!=='string'||!registry.has(id))throw new RangeError('Unknown local-relative profile');
  return registry.get(id);
}
export function listRelativeProfiles(){return definitions.map(value=>structuredClone(value));}

// Eight point contexts; independent of Asr choice. Each internal map is bounded.
const contexts=new Map();
function remember(map,key,value,limit){
  if(map.has(key))map.delete(key);map.set(key,value);
  while(map.size>limit)map.delete(map.keys().next().value);
  return value;
}
function cached(map,key){
  if(!map.has(key))return null;
  const value=map.get(key);map.delete(key);map.set(key,value);return value;
}
function context(location){
  const key=JSON.stringify([location.latitude,location.longitude,location.timeZone]);
  return cached(contexts,key)??remember(contexts,key,{location:{...location},rows:new Map(),classes:new Map(),annual:new Map(),segments:new Map(),episodes:new Map()},8);
}
function row(ctx,date){
  const known=cached(ctx.rows,date);if(known)return known;
  if(!inRange(date))return{date,status:'invalid',reason:'local-relative-adjacent-date-outside-core-range'};
  let result;
  try{
    const solar=calculateLocalSolarDay({date,...ctx.location,fajrAngleDegrees:18,ishaAngleDegrees:17,
      asrShadowFactor:1,horizonDepressionDegrees:50/60,solarModel:'spa'});
    result={date,status:'available',events:Object.fromEntries(['fajr','sunrise','maghrib','isha'].map(name=>[name,{...solar.events[name]}]))};
  }catch(error){
    if(!ownershipError(error))throw error;
    result={date,status:'invalid',reason:'local-relative-solar-date-ownership-unavailable'};
  }
  return remember(ctx.rows,date,result,1500);
}
const actual=(r,event)=>r?.status==='available'&&r.events[event].status==='calculated'?r.events[event].epochMilliseconds:null;
function classify(ctx,date,event){
  const key=`${date}:${event}`,known=cached(ctx.classes,key);if(known)return known;
  const current=row(ctx,date);
  if(current.status!=='available')return{kind:'unsafe',reason:current.reason};
  const raw=current.events[event];
  if(raw.status!=='calculated'){
    const absence=raw.status==='unavailable'&&raw.reason==='sun-continuously-above-threshold'&&raw.diagnosticStatus==='continuously-above';
    return remember(ctx.classes,key,{kind:absence?'missing':'unsafe',reason:raw.reason,rawEpochMilliseconds:null},3000);
  }
  const deltas=[];
  for(const direction of [-1,1]){
    const neighborDate=offset(date,direction),neighbor=row(ctx,neighborDate);
    if(neighbor.status!=='available')return{kind:'unsafe',reason:'local-relative-disturbance-neighbor-unavailable',rawEpochMilliseconds:raw.epochMilliseconds};
    const value=actual(neighbor,event);
    if(value!==null)deltas.push(Math.abs(phase(neighborDate,value)-phase(date,raw.epochMilliseconds)));
    else{
      const n=neighbor.events[event];
      if(!(n.reason==='sun-continuously-above-threshold'&&n.diagnosticStatus==='continuously-above'))
        return{kind:'unsafe',reason:'local-relative-disturbance-neighbor-ambiguous',rawEpochMilliseconds:raw.epochMilliseconds};
    }
  }
  return remember(ctx.classes,key,{kind:deltas.some(delta=>delta>10*MINUTE)?'disturbed':'ordinary',reason:null,
    rawEpochMilliseconds:raw.epochMilliseconds,maximumAdjacentPhaseChangeMilliseconds:Math.max(0,...deltas)},3000);
}
function night(ctx,date,event){
  const startDate=event==='fajr'?offset(date,-1):date,endDate=event==='fajr'?date:offset(date,1);
  const start=actual(row(ctx,startDate),'maghrib'),end=actual(row(ctx,endDate),'sunrise');
  if(!Number.isFinite(start)||!Number.isFinite(end)||!(end>start&&end-start<DAY))return null;
  return{startDate,endDate,start,end,duration:end-start};
}
function mean(ctx,year){
  const known=cached(ctx.annual,year);if(known)return known;
  const statistics={year,expectedDays:(midnight(`${year+1}-01-01`)-midnight(`${year}-01-01`))/DAY,
    eligibleDays:0,excludedMissingDays:0,excludedDisturbedDays:0,unresolvedDays:0};
  let sum=0,reason=null;
  for(let date=`${year}-01-01`;date<`${year+1}-01-01`;date=offset(date,1)){
    const classification=classify(ctx,date,'isha');
    if(classification.kind==='missing'){statistics.excludedMissingDays++;continue;}
    if(classification.kind==='disturbed'){statistics.excludedDisturbedDays++;continue;}
    const n=classification.kind==='ordinary'?night(ctx,date,'isha'):null;
    if(!n||!(n.start<classification.rawEpochMilliseconds&&classification.rawEpochMilliseconds<n.end)){
      statistics.unresolvedDays++;reason='local-relative-annual-ratio-context-unavailable';continue;
    }
    sum+=(classification.rawEpochMilliseconds-n.start)/n.duration;statistics.eligibleDays++;
  }
  const q=statistics.eligibleDays?sum/statistics.eligibleDays:null;
  if(q===null||!(q>0&&q<.5))reason='local-relative-annual-ratio-invalid';
  return remember(ctx.annual,year,{...statistics,sumOfDailyIshaNightFractions:sum,status:reason?'policy-blocked':'available',reason,
    fraction:reason?null:q,phaseFrame,ratioSourceEvent:'isha'},4);
}
function episode(ctx,date){
  for(const value of ctx.episodes.values())if(value.firstReplacementDate<=date&&date<=value.lastReplacementDate)return value;
  const kind=d=>{
    const values=['fajr','isha'].map(event=>classify(ctx,d,event).kind);
    return values.includes('unsafe')?'unsafe':values.some(value=>value==='missing'||value==='disturbed')?'replacement':'ordinary';
  };
  if(kind(date)==='unsafe')return{status:'policy-blocked',reason:'local-relative-union-episode-boundary-unavailable'};
  let first=date,last=date,left=null,right=null;
  for(let count=0;count<367;count++){
    const prior=offset(first,-1),value=kind(prior);
    if(value==='ordinary'){left=prior;break;}
    if(value==='unsafe')return{status:'policy-blocked',reason:'local-relative-union-episode-boundary-unavailable'};
    first=prior;
  }
  for(let count=0;count<367;count++){
    const next=offset(last,1),value=kind(next);
    if(value==='ordinary'){right=next;break;}
    if(value==='unsafe')return{status:'policy-blocked',reason:'local-relative-union-episode-boundary-unavailable'};
    last=next;
  }
  if(!left||!right)return{status:'policy-blocked',reason:'local-relative-complete-union-episode-not-found'};
  return remember(ctx.episodes,first,{status:'available',reason:null,firstReplacementDate:first,lastReplacementDate:last,
    precedingOrdinaryDate:left,followingOrdinaryDate:right,meanYear:Number(first.slice(0,4))},8);
}
function makeSegment(ctx,date,event){
  const center=classify(ctx,date,event);
  if(!['missing','disturbed'].includes(center.kind))return{status:'policy-blocked',reason:center.reason??'local-relative-no-replacement-segment'};
  let first=date,last=date,left,right;
  for(let count=0;count<367;count++){
    const prior=offset(first,-1),kind=classify(ctx,prior,event);
    if(kind.kind==='ordinary'){left={date:prior,epochMilliseconds:kind.rawEpochMilliseconds};break;}
    if(!['missing','disturbed'].includes(kind.kind))return{status:'policy-blocked',reason:'local-relative-left-physical-anchor-unavailable'};
    first=prior;
  }
  for(let count=0;count<367;count++){
    const next=offset(last,1),kind=classify(ctx,next,event);
    if(kind.kind==='ordinary'){right={date:next,epochMilliseconds:kind.rawEpochMilliseconds};break;}
    if(!['missing','disturbed'].includes(kind.kind))return{status:'policy-blocked',reason:'local-relative-right-physical-anchor-unavailable'};
    last=next;
  }
  if(!left||!right)return{status:'policy-blocked',reason:'local-relative-complete-segment-not-found'};
  const key=`${event}:${first}:${last}`,known=cached(ctx.segments,key);if(known)return known;
  const unionEpisode=episode(ctx,date);
  if(unionEpisode.status!=='available')return remember(ctx.segments,key,{status:'policy-blocked',reason:unionEpisode.reason,unionEpisode},16);
  const year=unionEpisode.meanYear,annual=mean(ctx,year);
  const metadata={event,firstReplacementDate:first,lastReplacementDate:last,meanYear:year,annualRatio:annual,
    unionEpisode,leftAnchor:left,rightAnchor:right,phaseFrame};
  if(annual.status!=='available')return remember(ctx.segments,key,{...metadata,status:'policy-blocked',reason:annual.reason},16);
  const candidates=[];
  for(let d=first;d<=last;d=offset(d,1)){
    const n=night(ctx,d,event);
    if(!n)return remember(ctx.segments,key,{...metadata,status:'policy-blocked',reason:'local-relative-actual-night-unavailable'},16);
    candidates.push({date:d,nightStartEpochMilliseconds:n.start,nightEndEpochMilliseconds:n.end,
      candidateEpochMilliseconds:event==='isha'?n.start+annual.fraction*n.duration:n.end-annual.fraction*n.duration});
  }
  const selected=selectLocalRelativeSegment({event,leftAnchor:left,rightAnchor:right,candidates});
  return remember(ctx.segments,key,{...metadata,...selected},16);
}
function select(ctx,date,event){
  const classification=classify(ctx,date,event);
  if(classification.kind==='ordinary')return{status:'calculated',reason:null,rawEpochMilliseconds:classification.rawEpochMilliseconds,
    selectedEpochMilliseconds:classification.rawEpochMilliseconds,classification,mode:'physical'};
  if(classification.kind==='unsafe')return{status:'policy-blocked',reason:classification.reason,classification,selectedEpochMilliseconds:null};
  const segment=makeSegment(ctx,date,event);
  if(segment.status!=='available')return{status:'policy-blocked',reason:segment.reason,classification,segment,selectedEpochMilliseconds:null};
  const selected=segment.selections.find(item=>item.date===date);
  const {selections,...segmentMetadata}=segment;
  return{status:'estimated',reason:'local-relative-seasonal-replacement',classification,...selected,
    rawEpochMilliseconds:classification.rawEpochMilliseconds??null,segment:segmentMetadata};
}
function parts(epoch,timeZone){
  const p=Object.fromEntries(new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',
    hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(epoch).map(x=>[x.type,x.value]));
  return{date:`${p.year}-${p.month}-${p.day}`,time:`${p.hour}:${p.minute}`,seconds:`${p.hour}:${p.minute}:${p.second}`};
}
function block(event,reason,selection){
  delete event.basis;
  for(const key of ['rawEpochMilliseconds','epochMilliseconds','roundedEpochMilliseconds','utc','calendarUtc','localDate','calendarDate','time','seconds','secondsDate','dateOffset'])event[key]=null;
  Object.assign(event,{status:'policy-blocked',reason,selection});
}
function selectedPairSafe(ctx,eveningDate){
  const morningDate=offset(eveningDate,1),i=select(ctx,eveningDate,'isha'),f=select(ctx,morningDate,'fajr');
  const n=night(ctx,eveningDate,'isha');
  const valid=x=>['calculated','estimated'].includes(x.status)&&Number.isFinite(x.selectedEpochMilliseconds);
  if(!valid(i)||!valid(f)||!n)return{safe:false,reason:'local-relative-adjacent-twilight-unavailable'};
  return{safe:n.start<i.selectedEpochMilliseconds&&i.selectedEpochMilliseconds<f.selectedEpochMilliseconds&&f.selectedEpochMilliseconds<n.end,
    reason:'local-relative-cross-night-order-conflict'};
}

export function calculateRelativeDay(input){
  fields(input,['date','latitude','longitude','timeZone','profile']);
  const definition=getRelativeProfile(input.profile),factor=definition.composition.asrShadowFactor;
  const base=calculateSunniDay({...input,profile:`sunni-mwl-shadow${factor}-physical-v1`});
  const result=structuredClone(base),latitude=Math.abs(base.location.latitude),inBand=latitude>=48.6&&latitude<=66.6;
  const year=Number(input.date.slice(0,4)),supported=inBand&&year>=2002&&year<=2097;
  result.profile={...result.profile,id:definition.id,label:definition.label,sources:{...definition.sources},sourceScope:definition.sourceScope,
    composition:structuredClone(definition.composition),relativePolicy:structuredClone(definition.relativePolicy)};
  result.calculation.version=LOCAL_RELATIVE_VERSION;result.calculation.kind='continuous-local-relative-point';
  const policy={...structuredClone(definition.relativePolicy),status:supported?'not-triggered':inBand?'outside-estimation-year-range':'outside-estimation-band',events:{}};
  result.calculation.relativePolicy=policy;
  if(supported){
    const ctx=context(base.location);
    for(const name of ['fajr','isha']){
      const selection=select(ctx,input.date,name);policy.events[name]=structuredClone(selection);
      if(selection.status==='calculated')continue;
      const event=result.events[name];
      if(selection.status!=='estimated'){block(event,selection.reason,selection);continue;}
      const pair=selectedPairSafe(ctx,name==='fajr'?offset(input.date,-1):input.date);
      if(!pair.safe){
        block(event,pair.reason,{...selection,status:'policy-blocked',reason:pair.reason,selectedEpochMilliseconds:null});
        policy.events[name]=structuredClone(event.selection);continue;
      }
      const raw=selection.selectedEpochMilliseconds,epoch=Math.round(raw),rounded=Math.floor(raw/MINUTE+.5)*MINUTE;
      const local=parts(epoch,input.timeZone),calendar=parts(rounded,input.timeZone),seconds=parts(Math.round(raw/1000)*1000,input.timeZone);
      delete event.basis;
      Object.assign(event,{status:'estimated',reason:selection.reason,selection,rule:`${definition.id}.${name}.local-relative-${selection.mode}`,
        rawEpochMilliseconds:raw,epochMilliseconds:epoch,roundedEpochMilliseconds:rounded,utc:new Date(epoch).toISOString(),calendarUtc:new Date(rounded).toISOString(),
        localDate:local.date,calendarDate:calendar.date,time:calendar.time,seconds:seconds.seconds,secondsDate:seconds.date,
        dateOffset:(midnight(local.date)-midnight(input.date))/DAY,
        ruleEvidence:{classification:'software-estimate',sourceKeys:['localRelative'],description:'Source-inspired annual local night fraction and conservative bidirectional five-minute ramps; declared clock/year/overlap conventions.'}});
      result.qualityFlags.push({code:'local-relative-seasonal-estimate',event:name,mode:selection.mode,meanYear:selection.segment.meanYear});
      if(event.dateOffset!==0)result.qualityFlags.push({code:'event-on-different-civil-date',event:name,date:event.localDate});
    }
    let previous=null;
    for(const name of EVENTS){
      const event=result.events[name];if(!Number.isFinite(event.rawEpochMilliseconds))continue;
      if(previous&&event.rawEpochMilliseconds<=result.events[previous].rawEpochMilliseconds){
        result.qualityFlags.push({code:'selected-event-order-conflict',earlier:previous,later:name});
        const selection={...(event.selection??{}),status:'policy-blocked',reason:'local-relative-selection-conflicts-with-event-order',selectedEpochMilliseconds:null};
        block(event,selection.reason,selection);
        if(['fajr','isha'].includes(name))policy.events[name]=structuredClone(selection);
      }else previous=name;
    }
    policy.status=['fajr','isha'].some(name=>result.events[name].status==='policy-blocked')?'blocked'
      :['fajr','isha'].some(name=>result.events[name].status==='estimated')?'estimated':'not-triggered';
  }
  const available=name=>['calculated','estimated'].includes(result.events[name].status);
  Object.assign(result.coverage,{complete:EVENTS.every(available),prayerStartsComplete:EVENTS.filter(name=>name!=='sunrise').every(available),
    estimatedEvents:EVENTS.filter(name=>result.events[name].status==='estimated'),unavailableEvents:EVENTS.filter(name=>result.events[name].status==='unavailable'),
    policyBlockedEvents:EVENTS.filter(name=>result.events[name].status==='policy-blocked')});
  // Traces include cached annual/segment metadata. Never expose mutable cache objects.
  return structuredClone(result);
}
const schedule=createLocalScheduleCalculator({calculateDay:calculateRelativeDay,getProfile:getRelativeProfile,version:LOCAL_RELATIVE_VERSION});
export function calculateRelativeSchedule(input){
  fields(input,['startDate','dayCount','latitude','longitude','timeZone','profile']);getRelativeProfile(input.profile);return schedule(input);
}
