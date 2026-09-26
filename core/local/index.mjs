import {fields} from '../input.mjs';
import {calculateLocalSolarDay} from './solar.mjs';
import {buildNorthernContext} from './northern.mjs';
import {buildLocalSummerContext} from './summer.mjs';
import {selectRuleInstant} from './selection.mjs';
import {getLocalProfile,LOCAL_PROFILE,LOCAL_SEASONAL_PROFILE,LOCAL_PROFILES} from './profiles.mjs';
export {getLocalProfile,listLocalProfiles,LOCAL_PROFILE,LOCAL_SEASONAL_PROFILE,LOCAL_PROFILES} from './profiles.mjs';

export const LOCAL_VERSION='0.4.0';
export const LOCAL_EVENTS=Object.freeze(['fajr','sunrise','dhuhr','asr','maghrib','isha']);
const PRAYERS=LOCAL_EVENTS.filter(name=>name!=='sunrise');
const MINUTE=60000,DAY=86400000;
const LEGACY_RULES=Object.freeze({fajr:'fajr.altitude-18.temkin-0',sunrise:'sunrise.altitude-50arcmin.temkin-minus7',
  dhuhr:'dhuhr.transit.temkin-5',asr:'asr.fixed-noon-shadow-1.temkin-4',
  maghrib:'maghrib.altitude-50arcmin.temkin-7',isha:'isha.altitude-17.temkin-0'});
// Bounded annual contexts are computed only for profiles declaring this policy.
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
function empty(status,reason,rule,eventRule){
  return {status,reason,rule,adjustmentMinutes:eventRule.marginMinutes,rawEpochMilliseconds:null,epochMilliseconds:null,
    roundedEpochMilliseconds:null,utc:null,calendarUtc:null,localDate:null,calendarDate:null,
    time:null,seconds:null,secondsDate:null,dateOffset:null};
}
function render(raw,date,formatter,rule,eventRule,status='calculated'){
  if(!Number.isFinite(raw))throw new RangeError('A selected local event must have a finite instant');
  const epoch=Math.round(raw),rounded=Math.floor(raw/MINUTE+.5)*MINUTE;
  const point=localParts(epoch,formatter),calendar=localParts(rounded,formatter),second=localParts(Math.round(raw/1000)*1000,formatter);
  return {status,reason:null,rule,adjustmentMinutes:eventRule.marginMinutes,rawEpochMilliseconds:raw,epochMilliseconds:epoch,
    roundedEpochMilliseconds:rounded,utc:new Date(epoch).toISOString(),calendarUtc:new Date(rounded).toISOString(),
    localDate:point.date,calendarDate:calendar.date,time:calendar.time,
    seconds:eventRule.resolution==='minute'?null:second.seconds,secondsDate:eventRule.resolution==='minute'?null:second.date,
    dateOffset:(Date.parse(point.date+'T00:00:00Z')-Date.parse(date+'T00:00:00Z'))/DAY};
}
function validateDomain(definition,location){
  const domain=definition.domain;
  if(!domain)return;
  for(const name of ['latitude','longitude'])if(location[name]<domain[name][0]||location[name]>domain[name][1])
    throw new RangeError(`${definition.id}: ${name} is outside the declared worked-example coordinate domain`);
  if(!domain.timeZones.includes(location.timeZone))throw new RangeError(`${definition.id}: an explicitly supported Indonesian IANA zone is required`);
}

/** Continuous local astronomy followed by an explicitly selected event-rule profile. */
export function calculateLocalDay(input){
  fields(input,['date','latitude','longitude','timeZone','profile']);
  const {date,latitude,longitude,timeZone,profile}=input,definition=getLocalProfile(profile);
  if(!Number.isFinite(latitude))throw new RangeError('Finite numeric latitude required');
  const north=definition.northern!==null&&latitude>=definition.northern.thresholdLatitude;
  const seasonal=north&&definition.northern.mode==='local-seasonal';
  const astronomy=calculateLocalSolarDay({date,latitude,longitude,timeZone,...definition.astronomy,
    ishaAngleDegrees:north?definition.northern.ishaAngleDegrees:definition.astronomy.ishaAngleDegrees});
  validateDomain(definition,astronomy.location);
  const context=north?northernContext({year:Number(date.slice(0,4)),latitude,
    longitude:astronomy.location.longitude,timeZone}):null;
  const northern=context?.northern??null;
  if(seasonal&&context&&!context.summer)context.summer=buildLocalSummerContext(northern);
  const summer=seasonal?context?.summer??null:null;
  const northernDay=northern?.days[date]??null,summerDay=summer?.days[date]??null;
  const formatter=new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn',{
    timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23',
  });
  const events={};
  for(const name of LOCAL_EVENTS){
    const event=astronomy.events[name],eventRule=definition.events[name];
    const legacy=profile===LOCAL_PROFILE||profile===LOCAL_SEASONAL_PROFILE;
    const rule=`${profile}.${legacy?LEGACY_RULES[name]:`${name}.${eventRule.kind}.${eventRule.rounding}.margin-${eventRule.marginMinutes}`}`;
    if(north&&(name==='fajr'||name==='isha')){
      if(seasonal){
        const selection=summerDay?.[name];
        const selectedRule=`${profile}.${name}.${selection?.mode??'unavailable'}`;
        if(summer?.status==='available'&&['calculated','estimated'].includes(selection?.status)){
          events[name]={...render(selection.selectedEpochMilliseconds,date,formatter,selectedRule,eventRule,selection.status),
            reason:selection.reason,selection:structuredClone(selection)};
        }else events[name]=empty('policy-blocked',summer?.reason??selection?.reason??'local-seasonal-context-unavailable',selectedRule,eventRule);
      }else if(northern?.status==='available'&&northernDay?.[name].eligible&&event.status==='calculated'){
        events[name]=render(event.epochMilliseconds,date,formatter,
          `${profile}.${name}.northern-ordinary-${name==='fajr'?18:16}.annual-guard`,eventRule);
      }else events[name]=empty('policy-blocked','northern-seasonal-policy-not-implemented',`${profile}.${name}.northern-seasonal-policy`,eventRule);
    }else if(north&&name==='asr'&&event.reason==='sun-not-above-geometric-horizon-at-transit'){
      events[name]={...render(events.dhuhr.rawEpochMilliseconds,date,formatter,
        `${profile}.asr.no-daylight-shadow.use-dhuhr`,eventRule,'estimated'),adjustmentMinutes:definition.events.dhuhr.marginMinutes,
        reason:'sun-not-above-geometric-horizon-at-transit'};
    }else if(north&&name==='asr'&&event.status!=='calculated'){
      events[name]=empty('policy-blocked','northern-asr-substitution-not-resolved',`${profile}.asr.northern-substitution-policy`,eventRule);
    }else if(event.status!=='calculated'){
      events[name]=empty('unavailable',event.reason,rule,eventRule);
    }else{
      const basis=selectRuleInstant({epochMilliseconds:event.epochMilliseconds,rounding:eventRule.rounding,marginMinutes:eventRule.marginMinutes});
      events[name]={...render(basis.selectedEpochMilliseconds,date,formatter,rule,eventRule),basis};
    }
  }
  // Northern horizon replacement is enabled only by a profile declaring it.
  if(north){
    for(const name of ['sunrise','maghrib'])if(!northernDay?.horizons[`${name}Eligible`])
      events[name]=empty('policy-blocked','northern-horizon-policy-not-implemented',`${profile}.${name}.five-hour-horizon-policy`,definition.events[name]);
  }
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
      events[name]=empty('policy-blocked','published-margins-conflict-with-event-order',event.rule,definition.events[name]);
    }else priorName=name;
  }
  for(const name of LOCAL_EVENTS){
    const event=events[name],declared=definition.events[name];
    Object.assign(event,{role:declared.role,resolution:declared.resolution,
      ruleEvidence:{classification:declared.evidence,sourceKeys:[...declared.sourceKeys],description:declared.description}});
    if(event.dateOffset!==null&&event.dateOffset!==0)qualityFlags.push({code:'event-on-different-civil-date',event:name,date:event.localDate});
  }
  const available=name=>['calculated','estimated'].includes(events[name].status);
  return {date,location:{latitude,longitude,timeZone},
    profile:{id:profile,label:definition.label,authority:definition.authority,official:false,
      institutionalEquivalence:'not-claimed',sources:{...definition.sources},sourceScope:definition.sourceScope,
      northernPolicyThresholdDegrees:definition.northern?.thresholdLatitude??null},
    calculation:{version:LOCAL_VERSION,kind:'continuous-local-point',astronomicalModel:astronomy.model,
      secondsMeaning:'model precision where provided; minute-defined profile markers have no seconds field; no observed or institutional seconds guarantee',
      horizon:astronomy.model.horizon+'; no terrain or observer-height model',
      northernPolicy:northern?structuredClone({status:northern.status,reason:northern.reason,metadata:northern.metadata,day:northernDay}):null,
      seasonalPolicy:summer?structuredClone({status:summer.status,reason:summer.reason,metadata:summer.metadata,day:summerDay}):null},
    astronomy,events,qualityFlags,
    coverage:{complete:LOCAL_EVENTS.every(available),
      prayerStartsComplete:PRAYERS.every(name=>available(name)&&events[name].role==='prayer-start-model'),
      nonPrayerStartEvents:PRAYERS.filter(name=>events[name].role!=='prayer-start-model'),
      estimatedEvents:LOCAL_EVENTS.filter(name=>events[name].status==='estimated'),
      unavailableEvents:LOCAL_EVENTS.filter(name=>events[name].status==='unavailable'),
      policyBlockedEvents:LOCAL_EVENTS.filter(name=>events[name].status==='policy-blocked')},
  };
}
