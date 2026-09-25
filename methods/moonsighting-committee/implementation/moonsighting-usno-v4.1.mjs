// Experimental independent USNO solar equations and spherical geometry.
// Only the seasonal MSC functions come from MIT Adhan. Does not read calendars or access the network.
import{seasonMinutes}from'./msc-seasonal.mjs';
import{solarUSNODay}from'../../../core/astronomy/solar-usno-v2.mjs';
const DAY=86400000,MIN=60000,RAD=Math.PI/180;
export const geometryDay=solarUSNODay;
export function calculateGeometry(options){
 if(!options||typeof options!=='object'||Array.isArray(options))throw new Error('Options object required');
 const allowed=new Set(['year','latitude','longitude','timeZone','shafaq','night','solver','dhuhrRounding']);
 for(const key of Object.keys(options))if(!allowed.has(key))throw new Error('Unknown option: '+key);
 const {year,latitude,longitude,timeZone,shafaq='general',night='same-day',solver='usno',dhuhrRounding='seconds-half-down'}=options;
 if(typeof timeZone!=='string'||(timeZone!=='UTC'&&!timeZone.includes('/')))throw new Error('Explicit IANA timezone required');
 if(!Number.isInteger(year)||year<2000||year>2099||!Number.isFinite(latitude)||Math.abs(latitude)>90||!Number.isFinite(longitude)||Math.abs(longitude)>180)throw new Error('Invalid date/coordinates');
 const shafaqValue=['general','ahmar','abyad'].includes(shafaq);if(!shafaqValue||!['same-day','tomorrow'].includes(night)||!['usno'].includes(solver)||!['nearest','seconds-half-down'].includes(dhuhrRounding))throw new Error('Unknown rule');
 const fmt=new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
 const parts=e=>Object.fromEntries(fmt.formatToParts(new Date(e)).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
 const localDate=e=>{const p=parts(e);return `${p.year}-${p.month}-${p.day}`;};
 const rows=[];
 for(let epoch=Date.UTC(year,0,1);epoch<Date.UTC(year+1,0,1);epoch+=DAY){
  const date=new Date(epoch).toISOString().slice(0,10);let solarEpoch=epoch,solar;
  for(let attempt=0;attempt<3;attempt++){solar=geometryDay(solarEpoch,latitude,longitude,solver);const actual=localDate(solar.transit);if(actual===date)break;solarEpoch+=epoch-Date.parse(actual+'T00:00:00Z');}
  if(localDate(solar.transit)!==date)throw new Error('Local date unavailable');
  const solarYear=solar.date.getUTCFullYear(),dayNumber=(solarEpoch-Date.UTC(solarYear,0,1))/DAY+1;
  const nightLength=night==='same-day'?DAY+solar.sunrise-solar.sunset:geometryDay(solarEpoch+DAY,latitude,longitude,solver).sunrise-solar.sunset;
  let fajr=solar.fajr,isha=solar.isha;
  if(latitude>=55&&Number.isFinite(nightLength)){fajr=solar.sunrise-nightLength/7;isha=solar.sunset+nightLength/7;}
  const safeFajr=solar.sunrise-seasonMinutes(latitude,dayNumber,solarYear,'fajr',shafaq)*MIN;
  const safeIsha=solar.sunset+seasonMinutes(latitude,dayNumber,solarYear,'isha',shafaq)*MIN;
  if(Number.isFinite(safeFajr)&&(!Number.isFinite(fajr)||safeFajr>fajr))fajr=safeFajr;
  if(Number.isFinite(safeIsha)&&(!Number.isFinite(isha)||safeIsha<isha))isha=safeIsha;
  const values={fajr,sunrise:solar.sunrise,dhuhr:solar.transit+5*MIN,asr_standard:solar.asr_standard,asr_hanafi:solar.asr_hanafi,maghrib:solar.sunset+3*MIN,isha};
  const times={},eventDates={},instants={};
  for(const[k,value]of Object.entries(values)){if(!Number.isFinite(value)){times[k]=eventDates[k]=instants[k]=null;continue;}// Empirical Dhuhr-only rounding hypothesis; no city/day offsets.
   const rounded=k==='dhuhr'&&dhuhrRounding==='seconds-half-down'?Math.ceil((Math.floor(value/1000)-30)/60)*MIN:Math.floor((value+30000)/MIN)*MIN,p=parts(rounded);times[k]=`${p.hour}:${p.minute}`;eventDates[k]=localDate(rounded);instants[k]=new Date(rounded).toISOString();}
  const eventStatus=Object.fromEntries(Object.keys(times).map(k=>[k,times[k]===null?'unavailable':'calculated'])),qualityFlags=[];
  for(const key of ['asr_standard','asr_hanafi']){
   if(times[key]!==null&&solar.asrAltitudes[key]<=0){eventStatus[key]='nonphysical-shadow';qualityFlags.push({event:key,code:'shadow-angle-below-horizon',altitudeDegrees:solar.asrAltitudes[key]});}
   if(instants[key]!==null&&instants[key]<instants.dhuhr){qualityFlags.push({event:key,code:'before-adjusted-dhuhr'});if(eventStatus[key]==='calculated')eventStatus[key]='ordering-exception';}
  }
  rows.push({date,eventStatus,qualityFlags,solarCalculationDate:new Date(solarEpoch).toISOString().slice(0,10),calculationLatitude:latitude,times,eventDates,instants});
 }
 return rows;
}
