// Research geometry only. This calculator never reads original calendar values.
import {CalculationMethod,Coordinates,PrayerTimes} from 'adhan';
import {solarCoordinatesUSNO} from '../../../core/astronomy/solar-usno.mjs';
// Constant-only dependency extracted from the original references module; see provenance/source-map.json.
const EVENTS=['fajr','sunrise','dhuhr','asr','maghrib','isha'];
export const RECIPES={
  'adhan-egyptian':{name:'Adhan 4.4.6 Egyptian preset',fajrAngle:19.5,ishaAngle:17.5,asrFactor:1,dhuhrMinutes:1,rounding:'nearest',source:'https://github.com/batoulapps/adhan-js'},
  'usno-no-offset':{name:'Independent USNO geometry',fajrAngle:19.5,ishaAngle:17.5,asrFactor:1,horizonDegrees:-50/60,dhuhrMinutes:0,rounding:'nearest',source:'https://aa.usno.navy.mil/faq/sun_approx'},
  'usno-library-dhuhr':{name:'Independent USNO geometry + generic Adhan noon convention',fajrAngle:19.5,ishaAngle:17.5,asrFactor:1,horizonDegrees:-50/60,dhuhrMinutes:1,rounding:'nearest',source:'https://github.com/batoulapps/adhan-js'},
};
const RAD=Math.PI/180;
export function zonedParts(epoch,timeZone='Africa/Cairo'){
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(epoch).map(p=>[p.type,p.value]));
  return {date:`${parts.year}-${parts.month}-${parts.day}`,time:`${parts.hour}:${parts.minute}`};
}
export function calculateDay(date,location,id){
  const recipe=RECIPES[id];if(!recipe)throw new Error(`Unknown recipe ${id}`);
  const midnight=Date.parse(`${date}T00:00:00Z`);
  if(!Number.isFinite(midnight)||new Date(midnight).toISOString().slice(0,10)!==date)throw new Error('Invalid date');
  const{latitude,longitude}=location;let raw;
  if(id==='adhan-egyptian'){
    const [y,m,d]=date.split('-').map(Number);const p=new PrayerTimes(new Coordinates(latitude,longitude),new Date(y,m-1,d,12),CalculationMethod.Egyptian());
    raw=Object.fromEntries(EVENTS.map(event=>[event,+p[event]]));
  }else{
    const jd=midnight/86400000+2440587.5;
    const at=hour=>solarCoordinatesUSNO(jd+(hour-longitude/15)/24);
    const event=(altitude,after,anchor)=>{
      const solar=at(anchor),phi=latitude*RAD,delta=solar.declination*RAD;
      const cosine=(Math.sin(altitude*RAD)-Math.sin(phi)*Math.sin(delta))/(Math.cos(phi)*Math.cos(delta));
      if(Math.abs(cosine)>1)return NaN;
      return midnight+(12-longitude/15-solar.equationOfTimeHours+(after?1:-1)*Math.acos(cosine)/RAD/15)*3600000;
    };
    const shadow=Math.atan(1/(1+Math.tan(Math.abs(latitude-at(13).declination)*RAD)))/RAD;
    raw={fajr:event(-19.5,false,5),sunrise:event(-50/60,false,6),
      dhuhr:midnight+(12-longitude/15-at(12).equationOfTimeHours)*3600000+recipe.dhuhrMinutes*60000,
      asr:event(shadow,true,13),maghrib:event(-50/60,true,18),isha:event(-17.5,true,18)};
  }
  return {date,events:Object.fromEntries(EVENTS.map(event=>{
    const epoch=Math.round(raw[event]/60000)*60000;
    return [event,Number.isFinite(epoch)?{status:'calculated',epoch,...zonedParts(epoch,location.timeZone)}:{status:'unavailable',epoch:null,date:null,time:null}];
  }))};
}
