// Source-free safety scan of the local low-latitude and southern research routes.
// Points are illustrative city proxies, not claimed Diyanet production points.
import fs from 'node:fs';
import {calculateLowLatitude, calculateSouth, calculateLowLatitudeCivilRow, calculateSouthCivilRow} from '../index.mjs';

if (process.versions.tz !== '2026d') throw new Error('Pinned tzdb 2026d required');
const cases = [
  ['Singapore',1.3521,103.8198,'Asia/Singapore'],
  ['Kiritimati',1.8721,-157.4278,'Pacific/Kiritimati'],
  ['Tokyo',35.6762,139.6503,'Asia/Tokyo'],
  ['Kathmandu',27.7172,85.3240,'Asia/Kathmandu'],
  ['Mexico City',19.4326,-99.1332,'America/Mexico_City'],
  ['Honolulu',21.3099,-157.8581,'Pacific/Honolulu'],
  ['Jerusalem',31.7683,35.2137,'Asia/Jerusalem'],
  ['Istanbul boundary proxy',41.0082,28.9784,'Europe/Istanbul'],
  ['Nairobi',-1.2864,36.8172,'Africa/Nairobi'],
  ['Quito',-0.1807,-78.4678,'America/Guayaquil'],
  ['Apia',-13.8333,-171.7667,'Pacific/Apia'],
  ['Hobart',-42.8821,147.3272,'Australia/Hobart'],
  ['Santiago',-33.4489,-70.6693,'America/Santiago'],
  ['Chatham Island',-43.95,-176.55,'Pacific/Chatham'],
  ['Ushuaia',-54.8019,-68.3030,'America/Argentina/Ushuaia'],
  ['South Georgia',-54.2811,-36.5092,'Atlantic/South_Georgia'],
  ['Southern boundary synthetic',-59.9,0,'UTC'],
  ['Northern low boundary synthetic',44.49,0,'UTC'],
];
const EVENTS=['fajr','sunrise','dhuhr','asr','maghrib','isha'];
const report={year:2027,tzdb:process.versions.tz,scope:'source-free model invariant scan; not institutional accuracy',
  plannedDays:cases.length*365*2,plannedSlots:cases.length*365*2*6,cases:[],overall:{rows:0,available:0,unavailable:0,
    rawOrderExceptions:0,roundedOrderExceptions:0,utcIsoMismatches:0,dateMismatches:0,throws:0},examples:[]};
for (const [name,latitude,longitude,timeZone] of cases){
 const variants=latitude>=0? [['baseline',calculateLowLatitude],['civil-row',calculateLowLatitudeCivilRow]]
   :[['baseline',calculateSouth],['civil-row',calculateSouthCivilRow]];
 for(const [variant,calculate] of variants){
  const summary={name,latitude,longitude,timeZone,variant,rows:0,available:0,unavailable:0,rawOrderExceptions:0,
    roundedOrderExceptions:0,utcIsoMismatches:0,dateMismatches:0,throws:0,unavailableByEvent:Object.fromEntries(EVENTS.map(e=>[e,0]))};
  for(let day=Date.UTC(2027,0,1);day<Date.UTC(2028,0,1);day+=86400000){
   const date=new Date(day).toISOString().slice(0,10);
   let result;
   try { result=calculate({date,latitude,longitude,timeZone}); }
   catch(error){summary.throws++;report.examples.push({name,variant,date,error:String(error)});continue;}
   summary.rows++;
   if(result.events.dhuhr.date!==date){summary.dateMismatches++;report.examples.push({name,variant,date,kind:'dhuhr-date',value:result.events.dhuhr.date});}
   for(const event of EVENTS){
    const value=result.events[event];
    if(value.utc===null){summary.unavailable++;summary.unavailableByEvent[event]++;continue;}
    summary.available++;
    if(Date.parse(value.iso)!==Date.parse(value.utc)){
      summary.utcIsoMismatches++;report.examples.push({name,variant,date,event,kind:'utc-iso',utc:value.utc,iso:value.iso});
    }
   }
   for(let i=1;i<EVENTS.length;i++){
    const a=result.events[EVENTS[i-1]],b=result.events[EVENTS[i]];
    if(a.utc===null||b.utc===null)continue;
    if(a.rawEpoch>b.rawEpoch){summary.rawOrderExceptions++;if(report.examples.length<100)report.examples.push({name,variant,date,kind:'raw-order',pair:[EVENTS[i-1],EVENTS[i]],gapSeconds:(b.rawEpoch-a.rawEpoch)/1000});}
    if(Date.parse(a.utc)>Date.parse(b.utc)){summary.roundedOrderExceptions++;if(report.examples.length<100)report.examples.push({name,variant,date,kind:'rounded-order',pair:[EVENTS[i-1],EVENTS[i]],gapMinutes:(Date.parse(b.utc)-Date.parse(a.utc))/60000});}
   }
  }
  report.cases.push(summary);
  for(const key of ['rows','available','unavailable','rawOrderExceptions','roundedOrderExceptions','utcIsoMismatches','dateMismatches','throws']) report.overall[key]+=summary[key];
 }
}
fs.writeFileSync(new URL('invariant-grid-2027.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({overall:report.overall,examples:report.examples.slice(0,12)},null,2));
