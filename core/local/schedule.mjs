// Offline, explicitly dated schedule composition for the local point profiles.
import {fields} from '../input.mjs';
import {calculateLocalDay,LOCAL_VERSION,LOCAL_EVENTS} from './index.mjs';
import {getLocalProfile} from './profiles.mjs';

const DAY_MS=86_400_000;
const PRAYER_STARTS=Object.freeze(['fajr','dhuhr','asr','maghrib','isha']);
const EVENT_ORDER=Object.freeze(['fajr','sunrise','dhuhr','asr','maghrib','isha']);
const datePattern=/^\d{4}-\d{2}-\d{2}$/;
const dateFromEpoch=epoch=>new Date(epoch).toISOString().slice(0,10);
const epochFromDate=date=>Date.parse(`${date}T00:00:00Z`);
const normalizedLongitude=longitude=>longitude===180?-180:longitude;

function checkDate(value,name){
  if(typeof value!=='string'||!datePattern.test(value))throw new RangeError(`${name} must be a Gregorian YYYY-MM-DD date`);
  const epoch=epochFromDate(value);
  if(!Number.isFinite(epoch)||dateFromEpoch(epoch)!==value||value<'2001-01-01'||value>'2098-12-31')
    throw new RangeError(`${name} must be a valid date from 2001 through 2098`);
  return epoch;
}

function checkInput(input){
  fields(input,['startDate','dayCount','latitude','longitude','timeZone','profile']);
  const startEpoch=checkDate(input.startDate,'startDate');
  if(!Number.isInteger(input.dayCount)||input.dayCount<1||input.dayCount>31)throw new RangeError('dayCount must be an integer from 1 through 31');
  const lastDate=dateFromEpoch(startEpoch+(input.dayCount-1)*DAY_MS);
  checkDate(lastDate,'lastDate');
  if(!Number.isFinite(input.latitude)||input.latitude< -89||input.latitude>89)throw new RangeError('latitude must be from −89° through 89°');
  if(!Number.isFinite(input.longitude)||Math.abs(input.longitude)>180)throw new RangeError('longitude must be from −180° through 180°');
  if(typeof input.timeZone!=='string'||!(input.timeZone==='UTC'||input.timeZone.includes('/')))throw new RangeError('An explicit IANA timezone is required');
  try{new Intl.DateTimeFormat('en-US',{timeZone:input.timeZone}).format(0);}
  catch{throw new RangeError('timeZone must be a supported IANA identifier');}
  const profile=getLocalProfile(input.profile);
  const longitude=normalizedLongitude(input.longitude);
  if(profile.domain){
    if(input.latitude<profile.domain.latitude[0]||input.latitude>profile.domain.latitude[1]
      ||longitude<profile.domain.longitude[0]||longitude>profile.domain.longitude[1]
      ||!profile.domain.timeZones.includes(input.timeZone))throw new RangeError(`${profile.id}: location is outside the declared point domain`);
  }
  return{startEpoch,lastDate,latitude:input.latitude,longitude,timeZone:input.timeZone,profile};
}

function entryFromEvent(sourceDate,eventName,event){
  return{event:eventName,role:event.role,status:event.status,reason:event.reason??null,
    sourceDate,localDate:event.localDate,calendarDate:event.calendarDate,displaySecondsDate:event.secondsDate,
    epochMilliseconds:event.epochMilliseconds,rawEpochMilliseconds:event.rawEpochMilliseconds,
    utc:event.utc,displayTime:event.time,displaySeconds:event.seconds,
    rule:event.rule,resolution:event.resolution,ruleEvidence:structuredClone(event.ruleEvidence)};
}

function missingStart(sourceDate,eventName,event,reasonOverride=null,detail=null){
  const role=event?.role??null;
  const reason=reasonOverride??(role!=='prayer-start-model'?'profile-does-not-identify-prayer-start':event.reason);
  const status=reasonOverride?'unavailable':role!=='prayer-start-model'?'policy-blocked':event.status;
  return{event:eventName,role,status,reason,sourceDate,localDate:event?.localDate??null,
    rule:event?.rule??null,resolution:event?.resolution??null,sourceStatus:event?.status??null,
    sourceReason:event?.reason??null,detail};
}

function solarDateFailure(error){
  return error instanceof RangeError&&(/No apparent solar transit belongs to civil date|Ambiguous apparent solar transit for civil date/.test(error.message));
}

/** Calculate 1–31 explicitly dated local point days without using a clock or network. */
export function calculateLocalSchedule(input){
  const x=checkInput(input),entries=[],missing=[],days=[],dateFingerprints=[];
  const location={latitude:x.latitude,longitude:x.longitude,timeZone:x.timeZone};
  const sourceDates=[];
  for(let index=0;index<input.dayCount;index++)sourceDates.push(dateFromEpoch(x.startEpoch+index*DAY_MS));

  for(const sourceDate of sourceDates){
    let day;
    try{day=calculateLocalDay({date:sourceDate,...location,profile:x.profile.id});}
    catch(error){
      if(!solarDateFailure(error))throw error;
      const detail=error.message;
      const dayMissing=PRAYER_STARTS.map(name=>missingStart(sourceDate,name,null,'solar-date-unavailable',detail));
      missing.push(...dayMissing);
      days.push({sourceDate,status:'unavailable',complete:false,entryCount:0,missingCount:dayMissing.length,
        reason:'solar-date-unavailable',detail,qualityFlags:[]});
      dateFingerprints.push({sourceDate,status:'unavailable',reason:'solar-date-unavailable',detail});
      continue;
    }
    dateFingerprints.push({sourceDate,status:'calculated',events:Object.fromEntries(LOCAL_EVENTS.map(name=>{
      const event=day.events[name];
      return[name,{status:event.status,reason:event.reason,epochMilliseconds:event.epochMilliseconds,
        localDate:event.localDate,calendarDate:event.calendarDate,dateOffset:event.dateOffset}];
    }))});
    const dayEntries=[],dayMissing=[];
    for(const eventName of PRAYER_STARTS){
      const event=day.events[eventName];
      if(event.role==='prayer-start-model'&&['calculated','estimated'].includes(event.status)){
        const entry=entryFromEvent(sourceDate,eventName,event);
        entries.push(entry);dayEntries.push(entry);
      }else{
        const absent=missingStart(sourceDate,eventName,event);
        missing.push(absent);dayMissing.push(absent);
      }
    }
    days.push({sourceDate,status:dayMissing.length?'partial':'complete',complete:dayMissing.length===0,
      entryCount:dayEntries.length,missingCount:dayMissing.length,reason:null,
      qualityFlags:structuredClone(day.qualityFlags)});
  }
  const reconciled=enforceCrossDayPrayerOrder({sourceDates,entries,missing,days});
  entries.splice(0,entries.length,...reconciled.entries);
  missing.splice(0,missing.length,...reconciled.missing);
  days.splice(0,days.length,...reconciled.days);
  const eventIndex=new Map(EVENT_ORDER.map((name,index)=>[name,index]));
  entries.sort((a,b)=>a.epochMilliseconds-b.epochMilliseconds
    ||a.sourceDate.localeCompare(b.sourceDate)||(eventIndex.get(a.event)-eventIndex.get(b.event)));
  const context={formatVersion:'local-schedule-v1',calculationVersion:LOCAL_VERSION,
    profileId:x.profile.id,profile:x.profile,location,startDate:input.startDate,lastDate:x.lastDate,dayCount:input.dayCount,
    localDateFingerprint:'selected-dated-event-instants-and-local-date-offsets-v1',dateFingerprints};
  const signature=JSON.stringify(context);
  for(const entry of entries)entry.id=`local-prayer-entry-v1:${JSON.stringify([
    LOCAL_VERSION,x.profile.id,x.latitude,x.longitude,x.timeZone,entry.sourceDate,entry.event,
  ])}`;
  const complete=days.every(day=>day.complete);
  return{id:`local-schedule-v1:${signature}`,signature,context,status:complete?'complete':'partial',complete,partial:!complete,
    entries,missing,days,coverage:{plannedDays:days.length,completeDays:days.filter(day=>day.complete).length,
      partialDays:days.filter(day=>day.status==='partial').length,unavailableDays:days.filter(day=>day.status==='unavailable').length,
      prayerStartEntries:entries.length,missingPrayerStarts:missing.length,expectedPrayerStarts:days.length*PRAYER_STARTS.length}};
}

/** Pure cross-day source-order guard; a later source-day Fajr is blocked if it fails to follow prior Isha. */
export function enforceCrossDayPrayerOrder(input){
  fields(input,['sourceDates','entries','missing','days']);
  if(!Array.isArray(input.sourceDates)||!Array.isArray(input.entries)||!Array.isArray(input.missing)||!Array.isArray(input.days))
    throw new TypeError('Cross-day reconciliation expects sourceDates, entries, missing, and days arrays');
  const entries=structuredClone(input.entries),missing=structuredClone(input.missing),days=structuredClone(input.days);
  const sourceDates=input.sourceDates.slice(),byDate=new Map();
  for(const entry of entries){
    const events=byDate.get(entry.sourceDate)??new Map();events.set(entry.event,entry);byDate.set(entry.sourceDate,events);
  }
  for(let index=0;index<sourceDates.length-1;index++){
    const sourceDate=sourceDates[index],nextDate=sourceDates[index+1];
    const isha=byDate.get(sourceDate)?.get('isha'),fajr=byDate.get(nextDate)?.get('fajr');
    if(!isha||!fajr||!Number.isFinite(isha.epochMilliseconds)||!Number.isFinite(fajr.epochMilliseconds)
      ||isha.epochMilliseconds<fajr.epochMilliseconds)continue;
    byDate.get(nextDate).delete('fajr');
    const position=entries.findIndex(entry=>entry.sourceDate===nextDate&&entry.event==='fajr');
    if(position!==-1)entries.splice(position,1);
    missing.push({event:'fajr',role:'prayer-start-model',status:'policy-blocked',
      reason:'cross-day-event-order-conflict',sourceDate:nextDate,localDate:fajr.localDate??null,
      rule:fajr.rule??null,resolution:fajr.resolution??null,sourceStatus:fajr.status??null,sourceReason:fajr.reason??null,
      detail:`Isha owned by ${sourceDate} at ${isha.utc??isha.epochMilliseconds} is not before Fajr owned by ${nextDate} at ${fajr.utc??fajr.epochMilliseconds}.`});
  }
  const missingByDate=new Map();
  for(const item of missing){const list=missingByDate.get(item.sourceDate)??[];list.push(item);missingByDate.set(item.sourceDate,list);}
  for(const day of days){
    const dateEntries=entries.filter(entry=>entry.sourceDate===day.sourceDate);
    const dateMissing=missingByDate.get(day.sourceDate)??[];
    day.entryCount=dateEntries.length;day.missingCount=dateMissing.length;day.complete=dateMissing.length===0&&dateEntries.length===PRAYER_STARTS.length;
    if(day.status!=='unavailable')day.status=day.complete?'complete':'partial';
  }
  const eventIndex=new Map(EVENT_ORDER.map((name,index)=>[name,index]));
  missing.sort((a,b)=>a.sourceDate.localeCompare(b.sourceDate)
    ||(eventIndex.get(a.event)??99)-(eventIndex.get(b.event)??99));
  return{entries,missing,days};
}

/** Return the first scheduled prayer at or after the caller's explicit UTC instant. */
export function nextLocalPrayer(schedule,nowEpochMilliseconds){
  if(!schedule||Object.getPrototypeOf(schedule)!==Object.prototype)throw new TypeError('A plain local schedule is required');
  const descriptors=Object.getOwnPropertyDescriptors(schedule);
  if(Reflect.ownKeys(descriptors).some(key=>typeof key!=='string'||!descriptors[key].enumerable||!Object.hasOwn(descriptors[key],'value')))
    throw new TypeError('Schedule fields must be enumerable own data properties');
  if(!Array.isArray(schedule.entries))throw new TypeError('schedule.entries must be an array');
  if(!Number.isSafeInteger(nowEpochMilliseconds)||Math.abs(nowEpochMilliseconds)>8.64e15)throw new RangeError('nowEpochMilliseconds must be an integer UTC epoch in milliseconds');
  let previousEpoch=-Infinity;
  for(const entry of schedule.entries){
    if(!entry||Object.getPrototypeOf(entry)!==Object.prototype)throw new TypeError('Invalid prayer entry in schedule');
    const entryDescriptors=Object.getOwnPropertyDescriptors(entry);
    if(Reflect.ownKeys(entryDescriptors).some(key=>typeof key!=='string'||!entryDescriptors[key].enumerable||!Object.hasOwn(entryDescriptors[key],'value')))
      throw new TypeError('Prayer entry fields must be enumerable own data properties');
    if(!Number.isSafeInteger(entry.epochMilliseconds)||Math.abs(entry.epochMilliseconds)>8.64e15
      ||!PRAYER_STARTS.includes(entry.event)||entry.role!=='prayer-start-model'
      ||!['calculated','estimated'].includes(entry.status)||typeof entry.sourceDate!=='string')
      throw new TypeError('Invalid prayer entry in schedule');
    checkDate(entry.sourceDate,'entry.sourceDate');
    if(entry.utc!==new Date(entry.epochMilliseconds).toISOString())throw new TypeError('Prayer entry UTC does not match its epoch');
    if(entry.epochMilliseconds<previousEpoch)throw new TypeError('Prayer entries must be sorted by UTC epoch');
    previousEpoch=entry.epochMilliseconds;
  }
  const entry=schedule.entries.find(item=>item.epochMilliseconds>=nowEpochMilliseconds);
  return entry?structuredClone(entry):null;
}

export {PRAYER_STARTS};
