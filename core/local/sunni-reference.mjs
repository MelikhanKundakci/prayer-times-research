// Opt-in local application of the cited reference-45 proportional-night rule.
// This composes the source's limited Fajr/Isha guidance with the existing
// point profiles; it does not reproduce an institution's complete calendar.
import {fields} from '../input.mjs';
import {calculateSunniDay,getSunniProfile} from './sunni.mjs';
import {createLocalScheduleCalculator} from './schedule.mjs';

const DAY_MS=86_400_000;
const SEASONAL_ABSENCE='sun-continuously-above-threshold';
const MIN_LATITUDE=48,MAX_LATITUDE=66,REFERENCE_LATITUDE=45;
export const LOCAL_REFERENCE_VERSION='0.1.0-reference45';

const definitions=[];
for(const family of ['mwl','egyptian'])for(const factor of [1,2]){
  const baseProfileId=`sunni-${family}-shadow${factor}-physical-v1`;
  const base=getSunniProfile(baseProfileId);
  const id=`sunni-${family}-shadow${factor}-reference45-v1`;
  const suffix=`Same-longitude ±45° reference-night proportions are applied only to missing Fajr/Isha crossings within 48°–66° absolute latitude. Ordinary crossings and all other events retain the corresponding physical profile. This is an explicit local composition, not an institutional calendar algorithm.`;
  const definition={...structuredClone(base),id,label:`${base.label} · reference 45° estimate`,
    sourceScope:`${base.sourceScope} ${suffix}`,
    sources:{...base.sources,referenceCouncil:'https://www.spa.gov.sa/497737?lang=ar&newsid=497737',
      referenceClarification:'https://www.dar-alifta.org/ar/fatwa/details/13433/حكم-الجمع-في-البلاد-التي-تنعدم-فيها-العلامات'},
    domain:null,referenceLatitudeDegrees:REFERENCE_LATITUDE,
    referencePolicy:{minimumAbsoluteLatitude:MIN_LATITUDE,maximumAbsoluteLatitude:MAX_LATITUDE,
      missingReason:SEASONAL_ABSENCE,events:['fajr','isha'],nightBasis:'actual previous sunset to current sunrise for Fajr; current sunset to next sunrise for Isha',
      longitudePolicy:'same longitude at signed 45° reference latitude',timezonePolicy:'same IANA time zone',
      official:false,institutionalEquivalence:'not-claimed'},
    composition:{...base.composition,highLatitudeMode:'reference45-absence-only'},
  };
  definitions.push(definition);
}

function deepFreeze(value){
  if(value&&typeof value==='object'&&!Object.isFrozen(value)){
    for(const child of Object.values(value))deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
const registry=new Map(definitions.map(definition=>[definition.id,deepFreeze(definition)]));
export const LOCAL_REFERENCE_PROFILES=Object.freeze([...registry.keys()]);

export function getReferenceProfile(id){
  if(typeof id!=='string'||!registry.has(id))throw new RangeError('Unknown reference-45 local profile');
  return registry.get(id);
}
export function listReferenceProfiles(){return [...registry.values()].map(value=>structuredClone(value));}

function dateOffset(date,offset){
  return new Date(Date.parse(`${date}T00:00:00Z`)+offset*DAY_MS).toISOString().slice(0,10);
}
function adjacent(date,offset,location,profile){
  const target=dateOffset(date,offset);
  if(target<'2001-01-01'||target>'2098-12-31')return null;
  try{return calculateSunniDay({date:target,...location,profile});}
  catch(error){
    if(error instanceof RangeError&&/No apparent solar transit belongs to civil date|Ambiguous apparent solar transit for civil date/.test(error.message))return null;
    throw error;
  }
}
const epoch=(day,event)=>day?.events?.[event]?.status==='calculated'
  ?day.events[event].rawEpochMilliseconds:null;

function traceBlocked(reason,rawReason,reference=null){
  return{status:'policy-blocked',reason,rawStatus:'unavailable',rawReason,
    referenceLatitudeDegrees:reference?.latitude??null,referenceLongitudeDegrees:reference?.longitude??null,
    referenceTimeZone:reference?.timeZone??null,nightStartEpochMilliseconds:null,nightEndEpochMilliseconds:null,
    referenceNightMilliseconds:null,localNightMilliseconds:null,referenceFraction:null,candidateEpochMilliseconds:null,
    selectedEpochMilliseconds:null};
}

function makeEstimate({eventName,localRaw,referenceDay,localNightStart,localNightEnd,referenceNightStart,referenceNightEnd,
  referenceLatitude,location,date,profile,ruleDefinition}){
  const refRaw=epoch(referenceDay,eventName),refFajrSunrise=eventName==='fajr'?epoch(referenceDay,'sunrise'):null;
  const refIshaSunset=eventName==='isha'?epoch(referenceDay,'maghrib'):null;
  const refPreviousSunset=eventName==='fajr'?referenceNightStart:null;
  const refNextSunrise=eventName==='isha'?referenceNightEnd:null;
  const refStart=eventName==='fajr'?refPreviousSunset:refIshaSunset;
  const refEnd=eventName==='fajr'?refFajrSunrise:refNextSunrise;
  const localDuration=localNightEnd-localNightStart,referenceDuration=refEnd-refStart;
  if(![refRaw,refStart,refEnd,localNightStart,localNightEnd,localDuration,referenceDuration].every(Number.isFinite)
    ||!(referenceDuration>0&&referenceDuration<DAY_MS&&localDuration>0&&localDuration<DAY_MS)
    ||(eventName==='fajr'&&!(refStart<refRaw&&refRaw<refEnd))
    ||(eventName==='isha'&&!(refStart<refRaw&&refRaw<refEnd))){
    return traceBlocked('reference45-night-or-anchor-unavailable',localRaw.reason,
      {latitude:referenceLatitude,longitude:location.longitude,timeZone:location.timeZone});
  }
  const portion=eventName==='fajr'?(refEnd-refRaw)/referenceDuration:(refRaw-refStart)/referenceDuration;
  if(!(portion>0&&portion<1))return traceBlocked('reference45-event-outside-reference-night',localRaw.reason,
    {latitude:referenceLatitude,longitude:location.longitude,timeZone:location.timeZone});
  const candidate=eventName==='fajr'?localNightEnd-portion*localDuration:localNightStart+portion*localDuration;
  if(!Number.isFinite(candidate)||(eventName==='fajr'&&!(localNightStart<candidate&&candidate<localNightEnd))
    ||(eventName==='isha'&&!(localNightStart<candidate&&candidate<localNightEnd)))
    return traceBlocked('reference45-candidate-outside-local-night',localRaw.reason,
      {latitude:referenceLatitude,longitude:location.longitude,timeZone:location.timeZone});
  const referencePoint=referenceDay.location;
  return{status:'estimated',reason:'missing-seasonal-crossing-estimated-from-reference45-night-fraction',
    rawStatus:localRaw.status,rawReason:localRaw.reason,rawEpochMilliseconds:null,
    referenceLatitudeDegrees:referenceLatitude,referenceLongitudeDegrees:referencePoint.longitude,
    referenceTimeZone:referencePoint.timeZone,referenceRawEpochMilliseconds:refRaw,
    referenceNightStartEpochMilliseconds:refStart,referenceNightEndEpochMilliseconds:refEnd,
    referenceNightMilliseconds:referenceDuration,nightStartEpochMilliseconds:localNightStart,
    nightEndEpochMilliseconds:localNightEnd,localNightMilliseconds:localDuration,referenceFraction:portion,
    candidateEpochMilliseconds:candidate,selectedEpochMilliseconds:candidate,
    referenceEventDate:referenceDay.date,sourceDate:date,operationOrder:eventName==='fajr'
      ?'reference-fajr-before-reference-sunrise fraction of previous-sunset-to-current-sunrise night; apply backward from local sunrise'
      :'reference-isha-after-reference-sunset fraction of current-sunset-to-next-sunrise night; apply forward from local sunset',
    rule:ruleDefinition.kind,profile,
  };
}

/** Calculate a physical family day with an opt-in absence-only reference-45 rule. */
export function calculateReferenceDay(input){
  fields(input,['date','latitude','longitude','timeZone','profile']);
  const definition=getReferenceProfile(input.profile),baseProfileId=`sunni-${definition.family}-shadow${definition.composition.asrShadowFactor}-physical-v1`;
  const base=calculateSunniDay({...input,profile:baseProfileId});
  const output=structuredClone(base),latitude=input.latitude,absoluteLatitude=Math.abs(latitude);
  output.profile={...output.profile,id:definition.id,label:definition.label,sourceScope:definition.sourceScope,
    sources:{...definition.sources},referencePolicy:structuredClone(definition.referencePolicy),
    composition:structuredClone(definition.composition),authority:definition.authority,official:false,institutionalEquivalence:'not-claimed'};
  output.calculation.version=LOCAL_REFERENCE_VERSION;
  output.calculation.kind='continuous-local-reference45-point';
  output.calculation.referencePolicy={...structuredClone(definition.referencePolicy),status:'not-needed',reason:null};
  let referenceDay=null,referenceFailure=null;
  const getReferenceDay=()=>{
    if(referenceDay||referenceFailure)return referenceDay;
    const refLatitude=referenceLatitudeFor(latitude);
    try{referenceDay=calculateSunniDay({date:input.date,latitude:refLatitude,longitude:base.location.longitude,
      timeZone:input.timeZone,profile:baseProfileId});}
    catch(error){
      if(error instanceof RangeError&&/No apparent solar transit belongs to civil date|Ambiguous apparent solar transit for civil date/.test(error.message))referenceFailure=error.message;
      else throw error;
    }
    return referenceDay;
  };
  const blankBlockedClock=event=>{
    for(const key of ['rawEpochMilliseconds','epochMilliseconds','roundedEpochMilliseconds','utc','calendarUtc','localDate','calendarDate','time','seconds','secondsDate','dateOffset'])event[key]=null;
  };
  for(const eventName of ['fajr','isha']){
    const event=output.events[eventName];
    if(event.status==='calculated')continue;
    const eligibleLatitude=absoluteLatitude>=MIN_LATITUDE&&absoluteLatitude<=MAX_LATITUDE;
    const provedAbsence=base.astronomy.events[eventName].status==='unavailable'
      &&base.astronomy.events[eventName].reason===SEASONAL_ABSENCE
      &&base.astronomy.events[eventName].diagnosticStatus==='continuously-above';
    if(!eligibleLatitude){
      if(provedAbsence){
        event.status='policy-blocked';event.reason='reference45-outside-supported-48-to-66-degree-band';
        event.selection=traceBlocked(event.reason,base.astronomy.events[eventName].reason);
      }
      continue;
    }
    if(!provedAbsence){
      if(event.status==='unavailable'){
        event.status='policy-blocked';event.reason='reference45-estimates-only-proven-seasonal-absence';
        event.selection=traceBlocked(event.reason,base.astronomy.events[eventName].reason);
      }
      continue;
    }
    const referenceLatitude=(latitude<0?-1:1)*REFERENCE_LATITUDE;
    const timeZone=input.timeZone;
    const reference=getReferenceDay();
    if(!reference){
      event.status='policy-blocked';event.reason='reference45-civil-transit-unavailable';
      event.selection=traceBlocked(event.reason,base.astronomy.events[eventName].reason,
        {latitude:referenceLatitude,longitude:base.location.longitude,timeZone:input.timeZone});
      event.selection.referenceFailure=referenceFailure;
      continue;
    }
    let localNightStart,localNightEnd,referenceNightStart,referenceNightEnd;
    if(eventName==='fajr'){
      const prev=adjacent(input.date,-1,base.location,baseProfileId),refPrev=adjacent(input.date,-1,reference.location,baseProfileId);
      localNightStart=epoch(prev,'maghrib');localNightEnd=epoch(base,'sunrise');
      referenceNightStart=epoch(refPrev,'maghrib');referenceNightEnd=epoch(reference,'sunrise');
    }else{
      const next=adjacent(input.date,1,base.location,baseProfileId),refNext=adjacent(input.date,1,reference.location,baseProfileId);
      localNightStart=epoch(base,'maghrib');localNightEnd=epoch(next,'sunrise');
      referenceNightStart=epoch(reference,'maghrib');referenceNightEnd=epoch(refNext,'sunrise');
    }
    const trace=makeEstimate({eventName,localRaw:base.astronomy.events[eventName],referenceDay:reference,
      localNightStart,localNightEnd,referenceNightStart,referenceNightEnd,referenceLatitude,location:base.location,
      date:input.date,profile:definition.id,ruleDefinition:definition.events[eventName]});
    event.selection=trace;
    if(trace.status!=='estimated'){
      event.status='policy-blocked';event.reason=trace.reason;blankBlockedClock(event);
      trace.status='policy-blocked';trace.selectedEpochMilliseconds=null;
      continue;
    }
    // Existing rawEpochMilliseconds names the selected model instant. Preserve the
    // physically missing input separately in selection and astronomy.events.
    const selected=trace.selectedEpochMilliseconds;
    const rounded=Math.floor(selected/60_000+.5)*60_000,selectedEpoch=Math.round(selected);
    const toParts=(instant)=>{
      const p=Object.fromEntries(new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(instant).map(x=>[x.type,x.value]));
      return{date:`${p.year}-${p.month}-${p.day}`,time:`${p.hour}:${p.minute}`,seconds:`${p.hour}:${p.minute}:${p.second}`};
    };
    const local=toParts(selectedEpoch),clock=toParts(rounded),seconds=toParts(Math.round(selected/1000)*1000);
    const selectedRule=`${definition.id}.${eventName}.reference45-proportional-night-estimate`;
    Object.assign(event,{status:'estimated',reason:trace.reason,rule:selectedRule,rawEpochMilliseconds:selected,
      epochMilliseconds:selectedEpoch,roundedEpochMilliseconds:rounded,utc:new Date(selectedEpoch).toISOString(),
      calendarUtc:new Date(rounded).toISOString(),localDate:local.date,calendarDate:clock.date,time:clock.time,
      seconds:seconds.seconds,secondsDate:seconds.date,
      dateOffset:(Date.parse(`${local.date}T00:00:00Z`)-Date.parse(`${input.date}T00:00:00Z`))/DAY_MS,
      ruleEvidence:{classification:'software-estimate',sourceKeys:['referenceClarification','referenceCouncil'],
        description:'A local same-longitude signed-45° reference-night proportion applied only to a proven missing seasonal Fajr/Isha crossing; not an institutional calendar recipe.'}});
  }
  output.qualityFlags.push(...['fajr','isha'].filter(name=>output.events[name].status==='estimated')
    .map(event=>({code:'reference45-seasonal-twilight-estimate',event,referenceLatitudeDegrees:referenceLatitudeFor(latitude)})));
  let previousName=null;
  for(const name of ['fajr','sunrise','dhuhr','asr','maghrib','isha']){
    const current=output.events[name];
    if(!Number.isFinite(current.rawEpochMilliseconds))continue;
    const previous=previousName===null?null:output.events[previousName];
    if(previous&&current.rawEpochMilliseconds<=previous.rawEpochMilliseconds){
      output.qualityFlags.push({code:'selected-event-order-conflict',earlier:previousName,later:name});
      current.status='policy-blocked';current.reason='reference45-selection-conflicts-with-event-order';
      if(current.selection)current.selection={...current.selection,status:'policy-blocked',reason:current.reason,selectedEpochMilliseconds:null};
      blankBlockedClock(current);
      continue;
    }
    previousName=name;
  }
  for(const name of ['fajr','isha']){
    const event=output.events[name];
    if(event.status==='estimated'&&event.dateOffset!==null&&event.dateOffset!==0)
      output.qualityFlags.push({code:'event-on-different-civil-date',event:name,date:event.localDate});
  }
  const unsupported=output.events.fajr.status==='policy-blocked'||output.events.isha.status==='policy-blocked';
  const estimatedCount=['fajr','isha'].filter(name=>output.events[name].status==='estimated').length;
  output.calculation.referencePolicy={...structuredClone(definition.referencePolicy),
    status:unsupported?'blocked':estimatedCount?'estimated':'not-triggered',
    reason:unsupported?'One or more twilight events are outside this policy or lack required physical/reference night data.':null};
  output.coverage.estimatedEvents=['fajr','sunrise','dhuhr','asr','maghrib','isha'].filter(name=>output.events[name].status==='estimated');
  output.coverage.unavailableEvents=['fajr','sunrise','dhuhr','asr','maghrib','isha'].filter(name=>output.events[name].status==='unavailable');
  output.coverage.policyBlockedEvents=['fajr','sunrise','dhuhr','asr','maghrib','isha'].filter(name=>output.events[name].status==='policy-blocked');
  output.coverage.complete=[...output.coverage.estimatedEvents,...['fajr','sunrise','dhuhr','asr','maghrib','isha'].filter(name=>output.events[name].status==='calculated')].length===6;
  output.coverage.prayerStartsComplete=['fajr','dhuhr','asr','maghrib','isha'].every(name=>['calculated','estimated'].includes(output.events[name].status));
  return output;
}
function referenceLatitudeFor(latitude){return(latitude<0?-1:1)*REFERENCE_LATITUDE;}

const composeSchedule=createLocalScheduleCalculator({calculateDay:calculateReferenceDay,getProfile:getReferenceProfile,version:LOCAL_REFERENCE_VERSION});
export function calculateReferenceSchedule(input){
  fields(input,['startDate','dayCount','latitude','longitude','timeZone','profile']);
  getReferenceProfile(input.profile);
  return composeSchedule(input);
}
