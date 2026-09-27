import {fields} from '../input.mjs';
import {calculateLocalDay} from './index.mjs';
import {calculateLocalSolarDay} from './solar.mjs';
import {calculateLocalSchedule,createLocalScheduleCalculator} from './schedule.mjs';
import {selectRuleInstant} from './selection.mjs';
import {selectNightFraction} from './night-fraction.mjs';
import {getSunniProfile,LOCAL_SUNNI_PROFILES} from './sunni-profiles.mjs';
export {getSunniProfile,LOCAL_SUNNI_PROFILES,listSunniProfiles,listSunniMethods} from './sunni-profiles.mjs';

export const LOCAL_SUNNI_VERSION='0.1.0-sunni';
const EVENTS=['fajr','sunrise','dhuhr','asr','maghrib','isha'];
const DAY=86400000,MINUTE=60000;
function parts(epoch,formatter){
  const p=Object.fromEntries(formatter.formatToParts(epoch).map(part=>[part.type,part.value]));
  return{date:`${p.year}-${p.month}-${p.day}`,time:`${p.hour}:${p.minute}`,seconds:`${p.hour}:${p.minute}:${p.second}`};
}
function empty(status,reason,rule,eventRule){return{
  status,reason,rule,adjustmentMinutes:eventRule.marginMinutes,rawEpochMilliseconds:null,epochMilliseconds:null,
  roundedEpochMilliseconds:null,utc:null,calendarUtc:null,localDate:null,calendarDate:null,time:null,seconds:null,secondsDate:null,dateOffset:null,
};}
function render(raw,date,formatter,rule,eventRule,status='calculated'){
  if(!Number.isFinite(raw))throw new RangeError('A selected event must be a finite instant');
  const epoch=Math.round(raw),rounded=Math.floor(raw/MINUTE+.5)*MINUTE;
  const point=parts(epoch,formatter),calendar=parts(rounded,formatter),second=parts(Math.round(raw/1000)*1000,formatter);
  return{status,reason:null,rule,adjustmentMinutes:eventRule.marginMinutes,rawEpochMilliseconds:raw,epochMilliseconds:epoch,
    roundedEpochMilliseconds:rounded,utc:new Date(epoch).toISOString(),calendarUtc:new Date(rounded).toISOString(),
    localDate:point.date,calendarDate:calendar.date,time:calendar.time,
    seconds:eventRule.resolution==='minute'?null:second.seconds,secondsDate:eventRule.resolution==='minute'?null:second.date,
    dateOffset:(Date.parse(point.date+'T00:00:00Z')-Date.parse(date+'T00:00:00Z'))/DAY};
}
function solar(date,location,definition){
  // The shared solver also evaluates an unused Isha root for interval recipes.
  // Remove it from the exported result: it is not this recipe's Isha definition.
  const result=calculateLocalSolarDay({date,...location,...definition.astronomy,
    ishaAngleDegrees:definition.astronomy.ishaAngleDegrees??18});
  if(definition.intervalPolicy){
    result.model.ishaAngleDegrees=null;
    result.events.isha={status:'not-applicable',reason:'isha-selected-by-sunset-interval',epochMilliseconds:null,
      thresholdDegrees:null,rootDirection:null,residualDegrees:null,diagnosticStatus:null};
  }
  return result;
}
function neighbor(date,offset,location,definition){
  const adjacent=new Date(Date.parse(date+'T00:00:00Z')+offset*DAY).toISOString().slice(0,10);
  if(adjacent<'2001-01-01'||adjacent>'2098-12-31')return null;
  try{return solar(adjacent,location,definition);}
  catch(error){
    if(error instanceof RangeError&&/No apparent solar transit belongs to civil date|Ambiguous apparent solar transit for civil date/.test(error.message))return null;
    throw error;
  }
}
function intervalContext(date,policy){
  let month=null;
  if(policy.mode==='calendar'){
    const formatter=new Intl.DateTimeFormat('en-US-u-nu-latn',{calendar:policy.calendar,timeZone:'UTC',month:'numeric'});
    if(formatter.resolvedOptions().calendar!==policy.calendar)throw new RangeError('The offline Umm al-Qura calendar is unavailable');
    month=Number(formatter.formatToParts(Date.parse(date+'T12:00:00Z')).find(part=>part.type==='month')?.value);
    if(!Number.isInteger(month)||month<1||month>12)throw new RangeError('The offline Umm al-Qura month is invalid');
  }
  const ramadan=policy.mode==='ramadan'||(policy.mode==='calendar'&&month===9);
  return{...policy,sourceDate:date,calendarMonth:month,ramadan,minutes:ramadan?policy.ramadanMinutes:policy.ordinaryMinutes,
    calendarRuntime:policy.mode==='calendar'?{icu:process.versions.icu,cldr:process.versions.cldr}:null,
    institutionalAnnouncement:false};
}

/** Source-attributed criteria plus explicit local choices; no external prayer data. */
export function calculateSunniDay(input){
  fields(input,['date','latitude','longitude','timeZone','profile']);
  const definition=getSunniProfile(input.profile);
  if(!LOCAL_SUNNI_PROFILES.includes(input.profile))return calculateLocalDay(input);
  const {date,profile,latitude,longitude,timeZone}=input;
  const astronomy=solar(date,{latitude,longitude,timeZone},definition),location=astronomy.location;
  if(definition.domain){
    const domain=definition.domain;
    if(location.latitude<domain.latitude[0]||location.latitude>domain.latitude[1]
      ||location.longitude<domain.longitude[0]||location.longitude>domain.longitude[1]
      ||!domain.timeZones.includes(timeZone))throw new RangeError(`${profile}: location is outside the declared Malaysian point domain`);
  }
  const formatter=new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn',{
    timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
  const neighbors=definition.nightPolicy?{previous:neighbor(date,-1,location,definition),next:neighbor(date,1,location,definition)}:null;
  const interval=definition.intervalPolicy?intervalContext(date,definition.intervalPolicy):null;
  const events={};
  for(const name of EVENTS){
    const raw=astronomy.events[name],declared=definition.events[name];
    const rule=`${profile}.${name}.${declared.kind}.${declared.rounding}.margin-${declared.marginMinutes}`;
    if(interval&&name==='isha'){
      const sunset=astronomy.events.maghrib;
      if(sunset.status!=='calculated')events[name]=empty('unavailable','sunset-unavailable-for-isha-interval',rule,declared);
      else{
        const selected=sunset.epochMilliseconds+interval.minutes*MINUTE;
        events[name]={...render(selected,date,formatter,rule,declared),
          basis:{sunsetEpochMilliseconds:sunset.epochMilliseconds,intervalMinutes:interval.minutes,selectedEpochMilliseconds:selected,
            operationOrder:'physical-sunset-plus-elapsed-interval'},selection:structuredClone(interval)};
      }
    }else if(neighbors&&(name==='fajr'||name==='isha')){
      const evening=name==='fajr'?neighbors.previous?.events.maghrib:astronomy.events.maghrib;
      const morning=name==='fajr'?astronomy.events.sunrise:neighbors.next?.events.sunrise;
      const selection=selectNightFraction({event:name,rawEpochMilliseconds:raw.epochMilliseconds,rawStatus:raw.status,rawReason:raw.reason,
        sunsetEpochMilliseconds:evening?.status==='calculated'?evening.epochMilliseconds:null,
        sunriseEpochMilliseconds:morning?.status==='calculated'?morning.epochMilliseconds:null,
        angleDegrees:definition.nightPolicy[`${name}AngleDegrees`]});
      const selectedRule=`${profile}.${name}.${selection.status==='estimated'?'angle-night-estimate':'angle-night-guard'}`;
      events[name]=['calculated','estimated'].includes(selection.status)
        ?{...render(selection.epochMilliseconds,date,formatter,selectedRule,declared,selection.status),reason:selection.reason,selection:selection.selection}
        :{...empty(selection.status,selection.reason,selectedRule,declared),selection:selection.selection};
    }else if(raw.status!=='calculated')events[name]=empty('unavailable',raw.reason,rule,declared);
    else{
      const before=declared.marginOrder==='before-rounding';
      const adjusted=raw.epochMilliseconds+(before?declared.marginMinutes*MINUTE:0);
      const selected=selectRuleInstant({epochMilliseconds:adjusted,rounding:declared.rounding,marginMinutes:before?0:declared.marginMinutes});
      const basis=before?{...selected,solarEpochMilliseconds:raw.epochMilliseconds,adjustedBasisEpochMilliseconds:adjusted,
        marginBeforeRoundingMilliseconds:declared.marginMinutes*MINUTE,operationOrder:'add-elapsed-margin-then-quantize'}:selected;
      events[name]={...render(selected.selectedEpochMilliseconds,date,formatter,rule,declared),basis};
    }
  }
  const qualityFlags=[];let priorName=null;
  for(const name of EVENTS){
    const event=events[name];if(event.rawEpochMilliseconds===null)continue;
    if(priorName!==null&&event.rawEpochMilliseconds<=events[priorName].rawEpochMilliseconds){
      qualityFlags.push({code:'selected-event-order-conflict',earlier:priorName,later:name});
      events[name]=empty('policy-blocked','selected-rules-conflict-with-event-order',event.rule,definition.events[name]);
    }else priorName=name;
  }
  for(const name of EVENTS){
    const event=events[name],declared=definition.events[name];
    Object.assign(event,{role:declared.role,resolution:declared.resolution,
      ruleEvidence:{classification:declared.evidence,sourceKeys:[...declared.sourceKeys],description:declared.description}});
    if(event.status==='estimated')event.ruleEvidence={classification:'software-estimate',sourceKeys:['night'],
      description:'Opt-in angle/60 limit inside the actual adjacent sunset-to-sunrise night; not a recovered institutional rule.'};
    if(event.dateOffset!==null&&event.dateOffset!==0)qualityFlags.push({code:'event-on-different-civil-date',event:name,date:event.localDate});
  }
  const available=name=>['calculated','estimated'].includes(events[name].status);
  return{date,location,
    profile:{id:profile,label:definition.label,family:definition.family,authority:definition.authority,official:false,institutionalEquivalence:'not-claimed',
      sources:{...definition.sources},sourceScope:definition.sourceScope,composition:structuredClone(definition.composition),northernPolicyThresholdDegrees:null},
    calculation:{version:LOCAL_SUNNI_VERSION,kind:'continuous-local-sunni-point',astronomicalModel:astronomy.model,
      secondsMeaning:'model precision where provided; minute-defined rules have no seconds field; not observed or institutional accuracy',
      horizon:astronomy.model.horizon,northernPolicy:null,seasonalPolicy:null,intervalPolicy:interval},
    astronomy,events,qualityFlags,
    coverage:{complete:EVENTS.every(available),prayerStartsComplete:EVENTS.filter(n=>n!=='sunrise').every(available),nonPrayerStartEvents:[],
      estimatedEvents:EVENTS.filter(n=>events[n].status==='estimated'),unavailableEvents:EVENTS.filter(n=>events[n].status==='unavailable'),
      policyBlockedEvents:EVENTS.filter(n=>events[n].status==='policy-blocked')},
  };
}
const compose=createLocalScheduleCalculator({calculateDay:calculateSunniDay,getProfile:getSunniProfile,version:LOCAL_SUNNI_VERSION});
export function calculateSunniSchedule(input){
  fields(input,['startDate','dayCount','latitude','longitude','timeZone','profile']);
  getSunniProfile(input.profile);
  return LOCAL_SUNNI_PROFILES.includes(input.profile)?compose(input):calculateLocalSchedule(input);
}
