/** Offline Diyanet reconstruction: public, defensive, location-explicit API. */
import {calculateAnnualRaw} from './calendar.mjs';

export const VERSION='1.0.0-reconstruction';
export const EVENTS=Object.freeze(['fajr','sunrise','dhuhr','asr','maghrib','isha']);
export const PRAYERS=Object.freeze(['fajr','dhuhr','asr','maghrib','isha']);
const DAY=86400000,MINUTE=60000;
const clone=value=>Array.isArray(value)?value.map(clone):value&&typeof value==='object'
  ?Object.fromEntries(Object.entries(value).map(([k,v])=>[k,clone(v)])):value;
function freeze(value){
  if(value&&typeof value==='object'){for(const v of Object.values(value))freeze(v);Object.freeze(value);}
  return value;
}
function record(value,keys){
  if(!value||Object.getPrototypeOf(value)!==Object.prototype)throw new TypeError('Plain input object required');
  const descriptors=Object.getOwnPropertyDescriptors(value),actual=Reflect.ownKeys(descriptors);
  if(actual.length!==keys.length||actual.some(k=>typeof k!=='string'||!keys.includes(k)
    ||!descriptors[k].enumerable||!Object.hasOwn(descriptors[k],'value')))
    throw new TypeError(`Exactly these own data fields are required: ${keys.join(', ')}`);
}
function yearValue(year){
  if(!Number.isInteger(year)||year<2001||year>2098)throw new RangeError('Supported years: 2001–2098');
}
function civilDate(date){
  if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new RangeError('Date must be YYYY-MM-DD');
  const epoch=Date.parse(date+'T00:00:00Z');
  if(!Number.isFinite(epoch)||new Date(epoch).toISOString().slice(0,10)!==date)throw new RangeError('Valid Gregorian date required');
  yearValue(Number(date.slice(0,4)));return epoch;
}
function location(input){
  const {latitude,longitude,timeZone}=input;
  if(!Number.isFinite(latitude)||latitude< -60||latitude>75)throw new RangeError('Supported latitude: −60° through 75°');
  if(!Number.isFinite(longitude)||Math.abs(longitude)>180)throw new RangeError('Longitude must be within −180° through 180°');
  if(typeof timeZone!=='string'||!(timeZone==='UTC'||timeZone.includes('/')))throw new RangeError('Explicit IANA time zone required');
  let formatter;
  try{formatter=new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});}
  catch{throw new RangeError('Valid IANA time zone required');}
  return {latitude,longitude,timeZone,formatter};
}
function parts(epoch,formatter){
  const p=Object.fromEntries(formatter.formatToParts(epoch).map(x=>[x.type,x.value]));
  return {date:`${p.year}-${p.month}-${p.day}`,time:`${p.hour}:${p.minute}`,seconds:`${p.hour}:${p.minute}:${p.second}`};
}
function metadata(annual){return {version:VERSION,method:'diyanet-reconstruction',solarModel:'USNO-daily-carrier-UTC00',route:annual.route,
  official:false,institutionalEquivalence:'not-established',secondsMeaning:'computed model precision, not verified institutional seconds',
  seasonal:clone(annual.seasonal??null)};}
function renderDay(day,annual,where){
  const events=Object.fromEntries(EVENTS.map(name=>{
    const source=day.events[name],raw=source.rawEpoch;
    if(raw===null)return [name,{status:'unavailable',rule:source.rule,estimated:source.estimated,
      rawEpochMilliseconds:null,epochMilliseconds:null,roundedEpochMilliseconds:null,utc:null,calendarUtc:null,
      localDate:null,calendarDate:null,time:null,seconds:null,secondsDate:null,dateOffset:null}];
    if(!Number.isFinite(raw))throw new Error(`Nonfinite ${name} cannot be published`);
    const epoch=Math.round(raw),rounded=Math.floor(raw/MINUTE+.5)*MINUTE;
    const at=parts(epoch,where.formatter),printed=parts(rounded,where.formatter),second=parts(Math.round(raw/1000)*1000,where.formatter);
    return[name,{status:source.estimated?'estimated':'calculated',rule:source.rule,estimated:source.estimated,
      rawEpochMilliseconds:raw,epochMilliseconds:epoch,roundedEpochMilliseconds:rounded,utc:new Date(epoch).toISOString(),calendarUtc:new Date(rounded).toISOString(),
      localDate:at.date,calendarDate:printed.date,time:printed.time,seconds:second.seconds,secondsDate:second.date,
      dateOffset:(Date.parse(at.date+'T00:00:00Z')-Date.parse(day.date+'T00:00:00Z'))/DAY}];
  }));
  const qualityFlags=[];
  for(let i=1;i<EVENTS.length;i++){
    const prior=events[EVENTS[i-1]],current=events[EVENTS[i]];
    if(prior.rawEpochMilliseconds!==null&&current.rawEpochMilliseconds!==null&&current.rawEpochMilliseconds<prior.rawEpochMilliseconds)
      qualityFlags.push({code:'event-order-reversal',earlier:EVENTS[i-1],later:EVENTS[i]});
  }
  for(const name of EVENTS)if(events[name].dateOffset!==null&&events[name].dateOffset!==0)
    qualityFlags.push({code:'event-on-different-civil-date',event:name,date:events[name].localDate});
  return {date:day.date,solarCalculationDate:day.solarCalculationDate,
    location:{latitude:where.latitude,longitude:where.longitude,timeZone:where.timeZone},
    calculation:metadata(annual),qualityFlags,events};
}

/** Create an isolated bounded annual cache; no persisted location or network I/O. */
export function createDiyanetCalculator(options={}){
  record(options,options&&Object.hasOwn(options,'cacheSize')?['cacheSize']:[]);
  const capacity=options.cacheSize===undefined?4:options.cacheSize;
  if(!Number.isInteger(capacity)||capacity<0||capacity>32)throw new RangeError('cacheSize must be an integer from 0 through 32');
  const cache=new Map();let annualCalculations=0;
  function annual(year,where){
    yearValue(year);
    const key=JSON.stringify([year,where.latitude,where.longitude,where.timeZone]);
    if(cache.has(key)){const value=cache.get(key);cache.delete(key);cache.set(key,value);return value;}
    const result=freeze(calculateAnnualRaw({year,latitude:where.latitude,longitude:where.longitude,timeZone:where.timeZone}));
    annualCalculations++;
    if(capacity){cache.set(key,result);while(cache.size>capacity)cache.delete(cache.keys().next().value);}
    return result;
  }
  function calculateDay(input){
    record(input,['date','latitude','longitude','timeZone']);civilDate(input.date);
    const where=location(input),result=annual(Number(input.date.slice(0,4)),where);
    const day=result.days.find(d=>d.date===input.date);
    if(!day)throw new RangeError('Requested date is unavailable');
    return renderDay(day,result,where);
  }
  function calculateYear(input){
    record(input,['year','latitude','longitude','timeZone']);yearValue(input.year);
    const where=location(input),result=annual(input.year,where);
    return {year:input.year,location:{latitude:where.latitude,longitude:where.longitude,timeZone:where.timeZone},
      calculation:metadata(result),days:result.days.map(d=>renderDay(d,result,where))};
  }
  function nextPrayer(input){
    record(input,['after','latitude','longitude','timeZone']);
    if(!Number.isFinite(input.after)||!Number.isFinite(new Date(input.after).getTime()))throw new RangeError('after must be a finite UTC epoch in milliseconds');
    const where=location(input),local=parts(input.after,where.formatter),epoch=civilDate(local.date),candidates=[],years=new Map();
    // Include prior row ownership for an Isha falling after local midnight.
    for(const offset of [-1,0,1,2]){
      const date=new Date(epoch+offset*DAY).toISOString().slice(0,10),year=Number(date.slice(0,4));
      if(year<2001||year>2098)continue;
      if(!years.has(year))years.set(year,annual(year,where));
      const result=years.get(year),day=result.days.find(d=>d.date===date);
      if(!day)continue;
      const rendered=renderDay(day,result,where);
      for(const name of PRAYERS){const event=rendered.events[name];
        if(event.epochMilliseconds!==null&&event.epochMilliseconds>input.after)
          candidates.push({name,prayerDate:date,...event,location:clone(rendered.location),qualityFlags:clone(rendered.qualityFlags),calculation:metadata(result)});
      }
    }
    candidates.sort((a,b)=>a.epochMilliseconds-b.epochMilliseconds||PRAYERS.indexOf(a.name)-PRAYERS.indexOf(b.name));
    return candidates[0]??null;
  }
  return Object.freeze({calculateDay,calculateYear,nextPrayer,
    clearCache(){cache.clear();},cacheInfo(){return {size:cache.size,capacity,annualCalculations};}});
}
