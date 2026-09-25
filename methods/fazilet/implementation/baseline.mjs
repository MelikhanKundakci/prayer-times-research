// Source-angle diagnostics only, NOT an operational Fazilet reconstruction.
import { solarCoordinatesUSNO } from '../../../core/astronomy/solar-usno-v2.mjs';
const RAD=Math.PI/180;
export function calculateBaseline(date, point, recipe) {
  if(arguments.length!==3||!['angles-only','historical-ten-minute-test','split-horizon-seven-test'].includes(recipe))throw new Error('Explicit diagnostic recipe required.');
  if(typeof date!=='string'||!/^20\d\d-\d\d-\d\d$/.test(date))throw new Error('YYYY-MM-DD in2000–2099 required.');
  const epoch=Date.parse(date+'T00:00:00Z');
  if(!Number.isFinite(epoch)||new Date(epoch).toISOString().slice(0,10)!==date)throw new Error('Invalid date.');
  if(!point||Object.getPrototypeOf(point)!==Object.prototype)throw new Error('Plain point required.');
  const ds=Object.getOwnPropertyDescriptors(point),keys=Reflect.ownKeys(ds);
  if(keys.length!==3||!keys.every(k=>typeof k==='string'&&['latitude','longitude','timeZone'].includes(k)&&Object.hasOwn(ds[k],'value')&&ds[k].enumerable))throw new Error('Exactly own latitude/longitude/timeZone data fields required.');
  const {latitude,longitude,timeZone}=point;
  if(!Number.isFinite(latitude)||latitude<32||latitude>45||!Number.isFinite(longitude)||longitude<25||longitude>45||timeZone!=='Europe/Istanbul')throw new Error('Regional Turkey diagnostic point with Europe/Istanbul required.');
  const at=h=>solarCoordinatesUSNO(epoch/864e5+2440587.5+(h-longitude/15)/24);
  const event=(altitude,sign,anchor)=>{const s=at(anchor),q=(Math.sin(altitude*RAD)-Math.sin(latitude*RAD)*Math.sin(s.declination*RAD))/(Math.cos(latitude*RAD)*Math.cos(s.declination*RAD));return Math.abs(q)>1?NaN:epoch+(12-longitude/15-s.equationOfTimeHours+sign*Math.acos(q)/RAD/15)*36e5;};
  const asrAltitude=Math.atan(1/(1+Math.tan(Math.abs(latitude-at(13).declination)*RAD)))/RAD;
  const times={imsak:event(-19,-1,5),sunrise:event(-1,-1,6),dhuhr:epoch+(12-longitude/15-at(12).equationOfTimeHours)*36e5,asr:event(asrAltitude,1,13),maghrib:event(-1,1,18),isha:event(-17,1,18)};
  if(recipe==='historical-ten-minute-test')for(const k of Object.keys(times))times[k]+=(['imsak','sunrise'].includes(k)?-10:10)*60000;
  if(recipe==='split-horizon-seven-test')for(const k of Object.keys(times))times[k]+=(['imsak','sunrise'].includes(k)?-1:1)*(['sunrise','maghrib'].includes(k)?7:10)*60000;
  times.sabah=times.imsak+20*60000;
  const formatter=new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
  const events=Object.fromEntries(Object.entries(times).map(([key,value])=>{
    if(!Number.isFinite(value))return [key,{status:'unavailable',time:null,utc:null,reason:'no-angle-solution-no-replacement'}];
    const d=new Date(Math.round(value/60000)*60000),p=Object.fromEntries(formatter.formatToParts(d).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
    return [key,{status:'diagnostic-only',time:`${p.hour}:${p.minute}`,localDate:`${p.year}-${p.month}-${p.day}`,utc:d.toISOString(),rawUtc:new Date(value).toISOString()}];
  }));
  return {date,point:{...point},recipe,official:false,productionReady:false,notificationEligible:false,
    rules:{imsakAngle:19,ishaAngle:17,horizonAngle:1,asrFactor:1,sabahAfterImsakMinutes:20},
    limitations:['Not a complete Fazilet calculation: city extent, atmosphere and active temkin rule unresolved.','Historical10-minute illustration is not confirmed as a modern uniform rule; horizon7 is a declared global empirical hypothesis.','Height537m is documented for Istanbul but not applied without unambiguous correction formula.','Angles-only Dhuhr is geometric transit; not a valid published prayer-start assertion.'],events};
}
