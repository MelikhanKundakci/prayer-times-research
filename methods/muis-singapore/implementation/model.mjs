// Independent offline calculation; not an official MUIS algorithm.
import{solarCoordinatesUSNO}from'../../../core/astronomy/solar-usno-v2.mjs';
import{solarCoordinatesNoaa}from'../../../core/astronomy/noaa-coordinates.mjs';
import{findLevelCrossings}from'../../../core/astronomy/continuous-solver.mjs';
const DAY=86400000,HOUR=3600000,RAD=Math.PI/180;
export const ENGINES=Object.freeze(['usno-continuous','noaa-continuous']);
export const POINT=Object.freeze({latitude:1.28716598445,longitude:103.862396307});
export const EVENTS=Object.freeze(['fajr','sunrise','dhuhr','asr','maghrib','isha']);
function validate(input){
 if(!input||Object.getPrototypeOf(input)!==Object.prototype)throw new TypeError('Plain own-data object required.');
 const descriptors=Object.getOwnPropertyDescriptors(input),keys=Reflect.ownKeys(descriptors),expected=['date','region','timeZone','engine'];
 if(keys.length!==expected.length||!keys.every(k=>typeof k==='string'&&expected.includes(k)&&Object.hasOwn(descriptors[k],'value')&&descriptors[k].enumerable))throw new TypeError('Exactly date/region/timeZone/engine own data fields required. No GPS point override.');
 const {date,region,timeZone,engine}=input;
 if(typeof date!=='string'||!/^20\d\d-\d\d-\d\d$/.test(date))throw new RangeError('Explicit YYYY-MM-DD date in2000–2099 required.');
 const epoch=Date.parse(date+'T00:00:00Z');if(!Number.isFinite(epoch)||new Date(epoch).toISOString().slice(0,10)!==date)throw new RangeError('Invalid civil date.');
 if(region!=='SG'||timeZone!=='Asia/Singapore'||!ENGINES.includes(engine))throw new RangeError('Explicit SG/Asia-Singapore region and known engine required.');
 return epoch;
}
export function calculateDay(input){
 if(arguments.length!==1)throw new TypeError('Exactly one input object required.');
 const carrier=validate(input),coordinates=input.engine==='usno-continuous'?solarCoordinatesUSNO:solarCoordinatesNoaa;
 const solar=epoch=>coordinates(epoch/DAY+2440587.5),{latitude,longitude}=POINT;
 let transit=carrier+(12-longitude/15)*HOUR;
 for(let i=0;i<12;i++)transit=carrier+(12-longitude/15-solar(transit).equationOfTimeHours)*HOUR;
 const startEpoch=carrier-8*HOUR,endEpoch=startEpoch+DAY;
 if(transit<startEpoch||transit>=endEpoch)throw new Error('Transit does not belong to requested SG day.');
 const altitude=epoch=>{const s=solar(epoch),ut=((epoch%DAY)+DAY)%DAY/HOUR,h=(ut+longitude/15+s.equationOfTimeHours-12)*15*RAD;return Math.asin(Math.max(-1,Math.min(1,Math.sin(latitude*RAD)*Math.sin(s.declination*RAD)+Math.cos(latitude*RAD)*Math.cos(s.declination*RAD)*Math.cos(h))))/RAD;};
 const asrAltitude=Math.atan(1/(1+Math.tan(Math.abs(latitude-solar(transit).declination)*RAD)))/RAD;
 const definitions=[[-20,'fajr','rising'],[-50/60,'sunrise','rising'],[-50/60,'maghrib','setting'],[-18,'isha','setting'],[asrAltitude,'asr','setting']];
 const events={},diagnostics={};
 for(const[threshold,event,direction]of definitions){
   const d=findLevelCrossings({startEpoch:event==='asr'?transit:startEpoch,endEpoch,valueAt:epoch=>altitude(epoch)-threshold});
   const matches=d.crossings.filter(c=>c.direction===direction);if(matches.length>1)throw new Error('Multiple crossings require explicit policy.');
   events[event]={epoch:matches[0]?.epoch??null,unavailableReason:matches.length?null:d.status};diagnostics[event]={thresholdDegrees:threshold,status:d.status,crossings:d.crossings.length};
 }
 events.dhuhr={epoch:transit+60000,unavailableReason:null};
 const formatter=new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn',{timeZone:input.timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
 const normalized=Object.fromEntries(EVENTS.map(key=>{
  const e=events[key];if(e.epoch===null)return[key,{status:'unavailable',time:null,date:null,utc:null,rawUtc:null,reason:e.unavailableReason,notificationEligible:false}];
  const rounded=Math.ceil(e.epoch/60000)*60000,d=new Date(rounded),p=Object.fromEntries(formatter.formatToParts(d).map(p=>[p.type,p.value])),date=`${p.year}-${p.month}-${p.day}`;
  if(date!==input.date)throw new Error('Event moved outside requested regional date.');
  return[key,{status:'estimated-unconfirmed',time:`${p.hour}:${p.minute}`,date,utc:d.toISOString(),rawUtc:new Date(e.epoch).toISOString(),rawEpoch:e.epoch,notificationEligible:false}];
 }));
 return {date:input.date,region:'SG',timeZone:input.timeZone,locationMode:'region',point:{...POINT},pointStatus:'Independent representative city point; not verified MUIS point',engine:input.engine,profileVersion:'0.1.0-research',official:false,productionReady:false,notificationEligible:false,recipe:{fajrAngle:20,ishaAngle:18,horizonAltitudeDegrees:-50/60,asrShadowFactor:1,asrTarget:'noon-declination shadow',dhuhrAdjustmentMinutes:1,rounding:'ceil'},geometry:{transitUtc:new Date(transit).toISOString(),asrAltitudeDegrees:asrAltitude,topocentricParallax:false,elevationCorrection:false,atmosphere:'Fixed standard horizon assumption only'},diagnostics,events:normalized};
}
export function calculateYear(input){
 // Public year helper uses the same strict own-data contract, with year replacing date.
 if(arguments.length!==1)throw new TypeError('Exactly one year input required.');
 if(!input||typeof input!=='object')throw new TypeError('Year input required.');
 const ds=Object.getOwnPropertyDescriptors(input),keys=Reflect.ownKeys(ds);
 if(Object.getPrototypeOf(input)!==Object.prototype||keys.length!==4||!keys.every(k=>typeof k==='string'&&['year','region','timeZone','engine'].includes(k)&&Object.hasOwn(ds[k],'value')&&ds[k].enumerable))throw new TypeError('Exactly own year/region/timeZone/engine fields required.');
 const{year,region,timeZone,engine}=input;
 if(!Number.isInteger(year)||year<2000||year>2099)throw new RangeError('Year2000–2099 required.');
 validate({date:`${year}-01-01`,region,timeZone,engine});const days=[];
 for(let epoch=Date.UTC(year,0,1);epoch<Date.UTC(year+1,0,1);epoch+=DAY)days.push(calculateDay({date:new Date(epoch).toISOString().slice(0,10),region,timeZone,engine}));
 return {year,region,timeZone,engine,days};
}
