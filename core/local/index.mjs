import {fields} from '../input.mjs';
import {calculateLocalSolarDay} from './solar.mjs';
import {buildNorthernContext} from './northern.mjs';
import {buildLocalSummerContext} from './summer.mjs';

export const LOCAL_VERSION='0.3.0';
export const LOCAL_EVENTS=Object.freeze(['fajr','sunrise','dhuhr','asr','maghrib','isha']);
export const LOCAL_PROFILE='diyanet-published-point-v1';
export const LOCAL_SEASONAL_PROFILE='local-northern-seasonal-v1';
export const LOCAL_PROFILES=Object.freeze([LOCAL_PROFILE,LOCAL_SEASONAL_PROFILE]);
const MINUTE=60000,DAY=86400000;
const MARGINS=Object.freeze({fajr:0,sunrise:-7,dhuhr:5,asr:4,maghrib:7,isha:0});
const RULES=Object.freeze({fajr:'fajr.altitude-18.temkin-0',sunrise:'sunrise.altitude-50arcmin.temkin-minus7',
  dhuhr:'dhuhr.transit.temkin-5',asr:'asr.fixed-noon-shadow-1.temkin-4',
  maghrib:'maghrib.altitude-50arcmin.temkin-7',isha:'isha.altitude-17.temkin-0'});
const SOURCES=Object.freeze({
  twilight:'https://www.diyanet.gov.tr/tr-TR/Kurumsal/Detay/2921/basin-aciklamasi',
  temkin:'https://vakithesaplama.diyanet.gov.tr/temkin.php',
  asr:'https://kurul.diyanet.gov.tr/tr/fetva/asr-i-evvel-ve-asr-i-sani-ne-demektir/0193c42d-4d64-7acf-2961-12b0db4e1723',
  north:'https://www.awqatsalah.com/sub/34/tespit-kriterleri',
});
// A point's annual guard is shared by its day queries, with a bounded cache.
// Only copies of the exposed diagnostics leave this module.
const northernContexts=new Map();
function northernContext(input){
  const key=JSON.stringify([input.year,input.latitude,input.longitude,input.timeZone]);
  if(northernContexts.has(key)){
    const value=northernContexts.get(key);northernContexts.delete(key);northernContexts.set(key,value);return value;
  }
  const value={northern:buildNorthernContext(input),summer:null};
  northernContexts.set(key,value);
  if(northernContexts.size>4)northernContexts.delete(northernContexts.keys().next().value);
  return value;
}
function localParts(epoch,formatter){
  const p=Object.fromEntries(formatter.formatToParts(epoch).map(x=>[x.type,x.value]));
  return {date:`${p.year}-${p.month}-${p.day}`,time:`${p.hour}:${p.minute}`,seconds:`${p.hour}:${p.minute}:${p.second}`};
}
function empty(name,status,reason,rule){
  return {status,reason,rule,adjustmentMinutes:MARGINS[name],rawEpochMilliseconds:null,epochMilliseconds:null,
    roundedEpochMilliseconds:null,utc:null,calendarUtc:null,localDate:null,calendarDate:null,
    time:null,seconds:null,secondsDate:null,dateOffset:null};
}
function render(name,raw,date,formatter,rule,status='calculated'){
  if(!Number.isFinite(raw))throw new RangeError('A selected local event must have a finite instant');
  const epoch=Math.round(raw),rounded=Math.floor(raw/MINUTE+.5)*MINUTE;
  const point=localParts(epoch,formatter),calendar=localParts(rounded,formatter),second=localParts(Math.round(raw/1000)*1000,formatter);
  return {status,reason:null,rule,adjustmentMinutes:MARGINS[name],rawEpochMilliseconds:raw,epochMilliseconds:epoch,
    roundedEpochMilliseconds:rounded,utc:new Date(epoch).toISOString(),calendarUtc:new Date(rounded).toISOString(),
    localDate:point.date,calendarDate:calendar.date,time:calendar.time,seconds:second.seconds,secondsDate:second.date,
    dateOffset:(Date.parse(point.date+'T00:00:00Z')-Date.parse(date+'T00:00:00Z'))/DAY};
}

/** Continuous point astronomy with an explicitly selected, source-attributed rule profile. */
export function calculateLocalDay(input){
  fields(input,['date','latitude','longitude','timeZone','profile']);
  if(!LOCAL_PROFILES.includes(input.profile))throw new RangeError(`Supported local profiles: ${LOCAL_PROFILES.join(', ')}`);
  const {date,latitude,longitude,timeZone,profile}=input;
  const seasonal=profile===LOCAL_SEASONAL_PROFILE;
  if(!Number.isFinite(latitude))throw new RangeError('Finite numeric latitude required');
  const north=latitude>=44.5;
  const astronomy=calculateLocalSolarDay({date,latitude,longitude,timeZone,ishaAngleDegrees:north?16:17});
  const context=north?northernContext({year:Number(date.slice(0,4)),latitude,
    longitude:astronomy.location.longitude,timeZone}):null;
  const northern=context?.northern??null;
  if(seasonal&&context&&!context.summer)context.summer=buildLocalSummerContext(northern);
  const summer=seasonal?context?.summer??null:null;
  const northernDay=northern?.days[date]??null;
  const summerDay=summer?.days[date]??null;
  const formatter=new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn',{
    timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23',
  });
  const events={};
  for(const name of LOCAL_EVENTS){
    const event=astronomy.events[name];
    const rule=`${profile}.${RULES[name]}`;
    if(north&&(name==='fajr'||name==='isha')){
      if(seasonal){
        const selection=summerDay?.[name];
        const selectedRule=`${profile}.${name}.${selection?.mode??'unavailable'}`;
        if(summer?.status==='available'&&['calculated','estimated'].includes(selection?.status)){
          events[name]={...render(name,selection.selectedEpochMilliseconds,date,formatter,selectedRule,selection.status),
            reason:selection.reason,selection:structuredClone(selection)};
        }else events[name]=empty(name,'policy-blocked',summer?.reason??selection?.reason??'local-seasonal-context-unavailable',selectedRule);
      }else if(northern?.status==='available'&&northernDay?.[name].eligible&&event.status==='calculated'){
        events[name]=render(name,event.epochMilliseconds,date,formatter,
          `${profile}.${name}.northern-ordinary-${name==='fajr'?18:16}.annual-guard`);
      }else{
        events[name]=empty(name,'policy-blocked','northern-seasonal-policy-not-implemented',`${profile}.${name}.northern-seasonal-policy`);
      }
    }else if(north&&name==='asr'&&event.reason==='sun-not-above-geometric-horizon-at-transit'){
      events[name]={...render(name,events.dhuhr.rawEpochMilliseconds,date,formatter,
        `${profile}.asr.no-daylight-shadow.use-dhuhr`,'estimated'),adjustmentMinutes:MARGINS.dhuhr,
        reason:'sun-not-above-geometric-horizon-at-transit'};
    }else if(north&&name==='asr'&&event.status!=='calculated'){
      events[name]=empty(name,'policy-blocked','northern-asr-substitution-not-resolved',`${profile}.asr.northern-substitution-policy`);
    }else if(event.status!=='calculated'){
      events[name]=empty(name,'unavailable',event.reason,rule);
    }else{
      events[name]=render(name,event.epochMilliseconds+MARGINS[name]*MINUTE,date,formatter,rule);
    }
  }
  // Use actual adjacent nights, not 24 hours minus the same day's daylight.
  // This ordinary-domain check does not construct five-hour replacement times.
  if(north){
    for(const name of ['sunrise','maghrib'])if(!northernDay?.horizons[`${name}Eligible`])
      events[name]=empty(name,'policy-blocked','northern-horizon-policy-not-implemented',`${profile}.${name}.five-hour-horizon-policy`);
  }
  // Check the selected instants before returning them; no silent chronological clamp.
  const qualityFlags=[];
  let priorName=null;
  for(const name of LOCAL_EVENTS){
    const event=events[name];
    if(event.rawEpochMilliseconds===null)continue;
    const prior=priorName===null?null:events[priorName];
    const permittedEquality=priorName==='dhuhr'&&name==='asr'&&event.status==='estimated'
      &&event.rule===`${profile}.asr.no-daylight-shadow.use-dhuhr`;
    if(prior&&event.rawEpochMilliseconds<=prior.rawEpochMilliseconds
      &&!(permittedEquality&&event.rawEpochMilliseconds===prior.rawEpochMilliseconds)){
      qualityFlags.push({code:'selected-event-order-conflict',earlier:priorName,later:name});
      events[name]=empty(name,'policy-blocked','published-margins-conflict-with-event-order',event.rule);
    }else priorName=name;
  }
  for(const name of LOCAL_EVENTS){
    const event=events[name];
    if(event.dateOffset!==null&&event.dateOffset!==0)qualityFlags.push({code:'event-on-different-civil-date',event:name,date:event.localDate});
  }
  return {date,location:{latitude,longitude,timeZone},
    profile:{id:profile,authority:seasonal?'Local seasonal policy inspired by published Diyanet criteria; transition and summer conventions are project-defined':'Published Diyanet criteria with explicitly declared local point conventions',official:false,
      institutionalEquivalence:'not-claimed',sources:{...SOURCES},northernPolicyThresholdDegrees:44.5},
    calculation:{version:LOCAL_VERSION,kind:'continuous-local-point',astronomicalModel:astronomy.model,
      secondsMeaning:'model precision, not guaranteed observed or institutional seconds',
      horizon:'level unobstructed horizon; standard 50-arcminute convention; no terrain or observer-height model',
      northernPolicy:northern?structuredClone({status:northern.status,reason:northern.reason,
        metadata:northern.metadata,day:northernDay}):null,
      seasonalPolicy:summer?structuredClone({status:summer.status,reason:summer.reason,metadata:summer.metadata,day:summerDay}):null},
    astronomy,events,qualityFlags,
    coverage:{complete:LOCAL_EVENTS.every(name=>events[name].status==='calculated'||events[name].status==='estimated'),
      estimatedEvents:LOCAL_EVENTS.filter(name=>events[name].status==='estimated'),
      unavailableEvents:LOCAL_EVENTS.filter(name=>events[name].status==='unavailable'),
      policyBlockedEvents:LOCAL_EVENTS.filter(name=>events[name].status==='policy-blocked')},
  };
}
