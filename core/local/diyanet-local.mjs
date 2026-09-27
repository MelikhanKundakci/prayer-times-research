// Independent local seasonal composition of published Diyanet point criteria.
// This extension keeps the frozen strict SPA profile intact and does not claim
// to recover Diyanet's unpublished transition or calendar implementation.
import {fields} from '../input.mjs';
import {calculateLocalDay,LOCAL_DIYANET_SPA_PROFILE,LOCAL_EVENTS,getLocalProfile} from './index.mjs';
import {calculateLocalSolarDay} from './solar.mjs';
import {buildNorthernContext} from './northern.mjs';
import {buildLocalSummerContext} from './summer.mjs';
import {admitDiyanetWinterContext} from './diyanet-winter.mjs';
import {createLocalScheduleCalculator} from './schedule.mjs';

const DAY=86_400_000,MINUTE=60_000,TWILIGHT=['fajr','isha'];
const ID='diyanet-local-seasonal-spa-v1';
export const LOCAL_DIYANET_LOCAL_VERSION='0.1.0-diyanet-local-spa';
export const LOCAL_DIYANET_LOCAL_PROFILES=Object.freeze([ID]);
const available=event=>['calculated','estimated'].includes(event.status);
function freeze(value){
  if(value&&typeof value==='object'&&!Object.isFrozen(value)){
    Object.values(value).forEach(freeze);Object.freeze(value);
  }return value;
}
const baseDefinition=getLocalProfile(LOCAL_DIYANET_SPA_PROFILE);
const definition=freeze({...structuredClone(baseDefinition),id:ID,
  label:'Diyanet criteria · local seasonal rule · SPA',
  authority:'Independent local software composition inspired by published Diyanet criteria',
  sourceScope:'The strict SPA point profile is retained wherever it already returns an event. Additional northern Fajr/Isha use a project-defined annual night ratio and smooth seasonal transition when the complete annual horizon and event-order gates pass. A separate local ordinary-night proof can admit real winter crossings when only the annual five-hour horizon gate failed. This is a local interpretation, not Diyanet’s complete institutional calendar algorithm.',
  northern:{...baseDefinition.northern,mode:'local-seasonal-extension'},
  composition:{asrShadowFactor:1,highLatitudeMode:'local-seasonal-spa',baseProfileId:LOCAL_DIYANET_SPA_PROFILE},
  localSeasonalPolicy:{id:'local-night-fraction-smooth-spa-v1',minimumLatitude:44.5,
    minimumYear:2002,maximumYear:2097,northernHemisphereOnly:true,
    annualHorizonGateRequired:true,tangentPolicy:'block-extension-context',
    baseAvailableEvents:'retained unchanged',official:false,institutionalEquivalence:'not-claimed'},
  official:false,institutionalEquivalence:'not-claimed'});

export function getDiyanetLocalProfile(id){
  if(id!==ID)throw new RangeError('Unknown Diyanet local seasonal profile');
  return definition;
}
export function listDiyanetLocalProfiles(){return[structuredClone(definition)];}

// Separate bounded contexts avoid changing or exposing the frozen core cache.
const contexts=new Map();
const ownershipError=error=>error instanceof RangeError
  &&/No apparent solar transit belongs to civil date|Ambiguous apparent solar transit for civil date/.test(error.message);

/** Missing signs must be proved absent, never inferred from a grazing root. */
function inspectAbsences(northern,location){
  for(const [date,day] of Object.entries(northern.days)){
    const absent=TWILIGHT.filter(name=>day[name]?.rawEpochMilliseconds===null);
    if(!absent.length)continue;
    let solar;
    try{solar=calculateLocalSolarDay({date,...location,...baseDefinition.astronomy,ishaAngleDegrees:16});}
    catch(error){
      if(!ownershipError(error))throw error;
      return{status:'blocked',reason:'local-seasonal-solar-date-ownership-unavailable',date};
    }
    for(const name of absent){
      const event=solar.events[name];
      if(event.status==='calculated')continue;
      if(event.status==='unavailable'&&event.reason==='sun-continuously-above-threshold'
        &&event.diagnosticStatus==='continuously-above')continue;
      return{status:'blocked',reason:event.reason==='tangent-without-directed-crossing'
        ?'local-seasonal-tangent-context-unresolved':'local-seasonal-absence-not-proven',
        date,event:name,rawReason:event.reason,diagnosticStatus:event.diagnosticStatus};
    }
  }
  return{status:'available',reason:null};
}
function context(year,location){
  const key=JSON.stringify([year,location.latitude,location.longitude,location.timeZone,'spa']);
  if(contexts.has(key)){
    const known=contexts.get(key);contexts.delete(key);contexts.set(key,known);return known;
  }
  const northern=buildNorthernContext({year,...location,solarModel:'spa'});
  const absenceGuard=inspectAbsences(northern,location);
  const summer=absenceGuard.status==='available'?buildLocalSummerContext(northern):null;
  const winter=absenceGuard.status==='available'?admitDiyanetWinterContext(northern):null;
  const value={northern,absenceGuard,summer,winter};
  contexts.set(key,value);
  while(contexts.size>4)contexts.delete(contexts.keys().next().value);
  return value;
}

function parts(epoch,formatter){
  const p=Object.fromEntries(formatter.formatToParts(epoch).map(part=>[part.type,part.value]));
  return{date:`${p.year}-${p.month}-${p.day}`,time:`${p.hour}:${p.minute}`,seconds:`${p.hour}:${p.minute}:${p.second}`};
}
function selectEvent(original,selection,name,date,formatter){
  const raw=selection.selectedEpochMilliseconds;
  if(!Number.isFinite(raw))throw new RangeError('Local seasonal selection must have a finite instant');
  const epoch=Math.round(raw),rounded=Math.floor(raw/MINUTE+.5)*MINUTE;
  const local=parts(epoch,formatter),calendar=parts(rounded,formatter),second=parts(Math.round(raw/1000)*1000,formatter);
  return{...original,status:selection.status,reason:selection.reason??null,
    rule:`${ID}.${name}.${selection.mode}`,rawEpochMilliseconds:raw,epochMilliseconds:epoch,
    roundedEpochMilliseconds:rounded,utc:new Date(epoch).toISOString(),calendarUtc:new Date(rounded).toISOString(),
    localDate:local.date,calendarDate:calendar.date,time:calendar.time,seconds:second.seconds,secondsDate:second.date,
    dateOffset:(Date.parse(`${local.date}T00:00:00Z`)-Date.parse(`${date}T00:00:00Z`))/DAY,
    selection:structuredClone(selection),ruleEvidence:selection.status==='estimated'
      ?{classification:'software-estimate',sourceKeys:['north'],description:'Project-defined annual q night fraction with a 20-minute cubic smooth transition using SPA astronomy; not Diyanet’s complete institutional summer algorithm.'}
      :{...structuredClone(original.ruleEvidence),description:'Unchanged SPA twilight crossing admitted by the explicitly selected local seasonal or ordinary-night policy.'}};
}
function blank(event,reason){
  const value={...event,status:'policy-blocked',reason};
  for(const key of ['rawEpochMilliseconds','epochMilliseconds','roundedEpochMilliseconds','utc','calendarUtc',
    'localDate','calendarDate','time','seconds','secondsDate','dateOffset'])value[key]=null;
  if(value.selection)value.selection={...value.selection,status:'policy-blocked',reason,selectedEpochMilliseconds:null};
  return value;
}

/** Explicitly dated, offline SPA day with a separately named local seasonal rule. */
export function calculateDiyanetLocalDay(input){
  fields(input,['date','latitude','longitude','timeZone','profile']);
  getDiyanetLocalProfile(input.profile);
  const base=calculateLocalDay({...input,profile:LOCAL_DIYANET_SPA_PROFILE}),output=structuredClone(base);
  const {date}=input,year=Number(date.slice(0,4));
  const location={...base.astronomy.location};
  const withinLatitude=location.latitude>=definition.localSeasonalPolicy.minimumLatitude;
  const withinYear=year>=2002&&year<=2097;
  const ctx=withinLatitude&&withinYear?context(year,location):null;
  output.profile={...output.profile,id:ID,label:definition.label,authority:definition.authority,
    sourceScope:definition.sourceScope,composition:structuredClone(definition.composition),
    localSeasonalPolicy:structuredClone(definition.localSeasonalPolicy)};
  output.calculation.version=LOCAL_DIYANET_LOCAL_VERSION;
  output.calculation.kind='continuous-local-diyanet-seasonal-spa';
  const reason=!withinLatitude?'outside-northern-policy-latitude':!withinYear?'outside-local-extension-year-range'
    :ctx.absenceGuard.status!=='available'?ctx.absenceGuard.reason:ctx.summer?.reason??null;
  output.calculation.seasonalPolicy={status:ctx?.summer?.status??(reason?'blocked':'not-triggered'),reason,
    metadata:{...structuredClone(ctx?.summer?.metadata??{}),...structuredClone(definition.localSeasonalPolicy),
      solarModel:'spa',solarProvider:'SPA-continuous-point-v1',baseProfileId:LOCAL_DIYANET_SPA_PROFILE},
    absenceGuard:structuredClone(ctx?.absenceGuard??null),day:structuredClone(ctx?.summer?.days[date]??null)};
  output.calculation.winterAdmission=ctx?.winter?structuredClone({policy:ctx.winter.policy,
    sourceContextReason:ctx.winter.sourceContextReason,evaluated:ctx.winter.evaluated,
    reason:ctx.winter.reason,metadata:ctx.winter.metadata,day:ctx.winter.days[date]}):null;
  const formatter=new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn',{timeZone:input.timeZone,
    year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
  const replaced=new Set();
  for(const name of TWILIGHT){
    if(available(base.events[name]))continue;
    const summerSelection=ctx?.summer?.days[date]?.[name],winterSelection=ctx?.winter?.days[date]?.[name];
    const selection=ctx?.summer?.status==='available'&&['calculated','estimated'].includes(summerSelection?.status)
      ?summerSelection:ctx?.winter?.evaluated===true&&winterSelection?.eligible===true
        ?{status:'calculated',reason:null,mode:ctx.winter.policy,
          rawEpochMilliseconds:winterSelection.rawEpochMilliseconds,
          selectedEpochMilliseconds:winterSelection.rawEpochMilliseconds,
          proof:structuredClone(winterSelection.proof)}:null;
    if(!selection)continue;
    output.events[name]=selectEvent(base.events[name],selection,name,date,formatter);replaced.add(name);
  }
  // Guard only newly admitted events; an extension cannot suppress unchanged
  // strict-profile events if its candidate conflicts with their source order.
  for(const name of replaced){
    const index=LOCAL_EVENTS.indexOf(name),event=output.events[name],instant=event.rawEpochMilliseconds;
    const before=LOCAL_EVENTS.slice(0,index).map(other=>output.events[other]).filter(available).at(-1);
    const after=LOCAL_EVENTS.slice(index+1).map(other=>output.events[other]).find(available);
    if((before&&before.rawEpochMilliseconds>=instant)||(after&&after.rawEpochMilliseconds<=instant)){
      output.events[name]=blank(event,'local-seasonal-selection-conflicts-with-event-order');
      output.qualityFlags.push({code:'local-seasonal-event-order-conflict',event:name});
    }
  }
  output.qualityFlags=output.qualityFlags.filter(flag=>!(replaced.has(flag.event)&&flag.code==='event-on-different-civil-date'));
  for(const name of replaced){
    const event=output.events[name];
    if(event.status==='estimated')output.qualityFlags.push({code:'diyanet-local-seasonal-estimate',event:name});
    if(event.dateOffset!==null&&event.dateOffset!==0)
      output.qualityFlags.push({code:'event-on-different-civil-date',event:name,date:event.localDate});
  }
  output.coverage={...output.coverage,complete:LOCAL_EVENTS.every(name=>available(output.events[name])),
    prayerStartsComplete:LOCAL_EVENTS.filter(name=>name!=='sunrise').every(name=>available(output.events[name])
      &&output.events[name].role==='prayer-start-model'),
    estimatedEvents:LOCAL_EVENTS.filter(name=>output.events[name].status==='estimated'),
    unavailableEvents:LOCAL_EVENTS.filter(name=>output.events[name].status==='unavailable'),
    policyBlockedEvents:LOCAL_EVENTS.filter(name=>output.events[name].status==='policy-blocked')};
  return output;
}

const schedule=createLocalScheduleCalculator({calculateDay:calculateDiyanetLocalDay,
  getProfile:getDiyanetLocalProfile,version:LOCAL_DIYANET_LOCAL_VERSION});
export function calculateDiyanetLocalSchedule(input){
  fields(input,['startDate','dayCount','latitude','longitude','timeZone','profile']);
  getDiyanetLocalProfile(input.profile);
  return schedule(input);
}
