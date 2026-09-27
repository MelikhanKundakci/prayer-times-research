// Versioned observer-position compositions. Historical geocentric profiles stay unchanged.
import {fields} from '../input.mjs';
import {listLocalProfiles} from './profiles.mjs';
import {calculateLocalTopocentricSolarDay} from './solar-topocentric.mjs';
import {selectNightFraction} from './night-fraction.mjs';
import {selectRuleInstant} from './selection.mjs';
import {createLocalScheduleCalculator} from './schedule.mjs';

export const LOCAL_OBSERVER_VERSION='0.1.0-observer';
const EVENTS=Object.freeze(['fajr','sunrise','dhuhr','asr','maghrib','isha']);
const PRAYERS=EVENTS.filter(name=>name!=='sunrise');
const DAY=86400000,MINUTE=60000;
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
const registry=new Map(listLocalProfiles().filter(profile=>profile.composition).map(base=>{
  const profile={...base,id:base.id.replace(/-v1$/,'-observer-v1'),
    label:base.label+' · observer position',
    sourceScope:base.sourceScope+' Observer-position SPA correction uses an explicit 0 m reference elevation. No measured height, terrain or extra atmospheric refraction is applied. This does not establish improved agreement with an institutional calendar.',
    sources:{...base.sources,observer:'https://docs.nlr.gov/docs/fy08osti/34302.pdf'},
    astronomy:{...base.astronomy,solarModel:'spa-topocentric'},
    composition:{...base.composition,astronomy:'observer-position'},
  };
  return[profile.id,freeze(profile)];
}));
export const LOCAL_OBSERVER_PROFILES=Object.freeze([...registry.keys()]);
export function getObserverProfile(id){
  if(typeof id!=='string'||!registry.has(id))throw new RangeError('Unknown observer-position profile');
  return registry.get(id);
}
export const listObserverProfiles=()=>[...registry.values()].map(profile=>structuredClone(profile));

function parts(epoch,formatter){
  const p=Object.fromEntries(formatter.formatToParts(epoch).map(part=>[part.type,part.value]));
  return{date:`${p.year}-${p.month}-${p.day}`,time:`${p.hour}:${p.minute}`,seconds:`${p.hour}:${p.minute}:${p.second}`};
}
function empty(status,reason,rule,eventRule){
  return{status,reason,rule,adjustmentMinutes:eventRule.marginMinutes,rawEpochMilliseconds:null,epochMilliseconds:null,
    roundedEpochMilliseconds:null,utc:null,calendarUtc:null,localDate:null,calendarDate:null,time:null,seconds:null,secondsDate:null,dateOffset:null};
}
function render(raw,date,formatter,rule,eventRule,status='calculated'){
  if(!Number.isFinite(raw))throw new RangeError('A selected observer event must be a finite instant');
  const epoch=Math.round(raw),rounded=Math.floor(raw/MINUTE+.5)*MINUTE;
  const point=parts(epoch,formatter),calendar=parts(rounded,formatter),second=parts(Math.round(raw/1000)*1000,formatter);
  return{status,reason:null,rule,adjustmentMinutes:eventRule.marginMinutes,rawEpochMilliseconds:raw,epochMilliseconds:epoch,
    roundedEpochMilliseconds:rounded,utc:new Date(epoch).toISOString(),calendarUtc:new Date(rounded).toISOString(),
    localDate:point.date,calendarDate:calendar.date,time:calendar.time,seconds:second.seconds,secondsDate:second.date,
    dateOffset:(Date.parse(point.date+'T00:00:00Z')-Date.parse(date+'T00:00:00Z'))/DAY};
}
function solar(date,location,definition){
  const {fajrAngleDegrees,ishaAngleDegrees,asrShadowFactor,horizonDepressionDegrees}=definition.astronomy;
  return calculateLocalTopocentricSolarDay({date,...location,fajrAngleDegrees,ishaAngleDegrees,asrShadowFactor,horizonDepressionDegrees});
}
function neighboringSolarDay(date,offset,location,definition){
  const neighbor=new Date(Date.parse(date+'T00:00:00Z')+offset*DAY).toISOString().slice(0,10);
  if(neighbor<'2001-01-01'||neighbor>'2098-12-31')return null;
  try{return solar(neighbor,location,definition);}
  catch(error){if(error instanceof RangeError)return null;throw error;}
}

/** Apply explicit local prayer criteria to observer-relative SPA solar events. */
export function calculateObserverDay(input){
  fields(input,['date','latitude','longitude','timeZone','profile']);
  const {date,latitude,longitude,timeZone,profile}=input,definition=getObserverProfile(profile);
  const location={latitude,longitude,timeZone};
  const astronomy=solar(date,location,definition);
  const formatter=new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn',{
    timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
  const neighbors=definition.nightPolicy?{
    previous:neighboringSolarDay(date,-1,location,definition),next:neighboringSolarDay(date,1,location,definition)}:null;
  const events={};
  for(const name of EVENTS){
    const raw=astronomy.events[name],eventRule=definition.events[name];
    const rule=`${profile}.${name}.${eventRule.kind}.${eventRule.rounding}.margin-${eventRule.marginMinutes}`;
    if(neighbors&&(name==='fajr'||name==='isha')){
      const evening=name==='fajr'?neighbors.previous?.events.maghrib:astronomy.events.maghrib;
      const morning=name==='fajr'?astronomy.events.sunrise:neighbors.next?.events.sunrise;
      const selection=selectNightFraction({event:name,rawEpochMilliseconds:raw.epochMilliseconds,rawStatus:raw.status,rawReason:raw.reason,
        sunsetEpochMilliseconds:evening?.status==='calculated'?evening.epochMilliseconds:null,
        sunriseEpochMilliseconds:morning?.status==='calculated'?morning.epochMilliseconds:null,
        angleDegrees:definition.nightPolicy[`${name}AngleDegrees`]});
      const selectedRule=`${profile}.${name}.${selection.status==='estimated'?'angle-night-estimate':'angle-night-guard'}`;
      events[name]=['calculated','estimated'].includes(selection.status)
        ?{...render(selection.epochMilliseconds,date,formatter,selectedRule,eventRule,selection.status),reason:selection.reason,selection:selection.selection}
        :{...empty(selection.status,selection.reason,selectedRule,eventRule),selection:selection.selection};
    }else if(raw.status!=='calculated')events[name]=empty('unavailable',raw.reason,rule,eventRule);
    else{
      const basis=selectRuleInstant({epochMilliseconds:raw.epochMilliseconds,rounding:eventRule.rounding,marginMinutes:eventRule.marginMinutes});
      events[name]={...render(basis.selectedEpochMilliseconds,date,formatter,rule,eventRule),basis};
    }
  }
  const qualityFlags=[];let priorName=null;
  for(const name of EVENTS){
    const event=events[name];if(event.rawEpochMilliseconds===null)continue;
    if(priorName!==null&&event.rawEpochMilliseconds<=events[priorName].rawEpochMilliseconds){
      qualityFlags.push({code:'selected-event-order-conflict',earlier:priorName,later:name});
      events[name]=empty('policy-blocked','published-margins-conflict-with-event-order',event.rule,definition.events[name]);
    }else priorName=name;
  }
  for(const name of EVENTS){
    const event=events[name],declared=definition.events[name];
    Object.assign(event,{role:declared.role,resolution:declared.resolution,
      ruleEvidence:{classification:declared.evidence,sourceKeys:[...declared.sourceKeys],description:declared.description}});
    if(definition.nightPolicy&&event.status==='estimated')event.ruleEvidence={classification:'software-estimate',sourceKeys:['night'],
      description:'Explicit angle/60 limit within the actual adjacent sunset-to-sunrise night; a selected software estimate, not a recovered institutional rule.'};
    if(event.dateOffset!==null&&event.dateOffset!==0)qualityFlags.push({code:'event-on-different-civil-date',event:name,date:event.localDate});
  }
  const available=name=>['calculated','estimated'].includes(events[name].status);
  return{date,location,
    profile:{id:profile,label:definition.label,authority:definition.authority,official:false,institutionalEquivalence:'not-claimed',
      sources:{...definition.sources},sourceScope:definition.sourceScope,composition:structuredClone(definition.composition),northernPolicyThresholdDegrees:null},
    calculation:{version:LOCAL_OBSERVER_VERSION,kind:'continuous-observer-point',astronomicalModel:astronomy.model,
      secondsMeaning:'model precision, not an observed or institutional seconds guarantee',horizon:astronomy.model.horizon,
      northernPolicy:null,seasonalPolicy:null},
    astronomy,events,qualityFlags,
    coverage:{complete:EVENTS.every(available),prayerStartsComplete:PRAYERS.every(available),nonPrayerStartEvents:[],
      estimatedEvents:EVENTS.filter(name=>events[name].status==='estimated'),unavailableEvents:EVENTS.filter(name=>events[name].status==='unavailable'),
      policyBlockedEvents:EVENTS.filter(name=>events[name].status==='policy-blocked')},
  };
}

export const calculateObserverSchedule=createLocalScheduleCalculator({calculateDay:calculateObserverDay,getProfile:getObserverProfile,version:LOCAL_OBSERVER_VERSION});
