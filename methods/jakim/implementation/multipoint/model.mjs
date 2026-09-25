import { solarCoordinatesUSNO } from '../../../../core/astronomy/solar-usno-v2.mjs';
import { ZONES } from './points.mjs';
const DAY=86400000,HOUR=3600000,RAD=Math.PI/180;
export const EVENTS=Object.freeze(['fajr','sunrise','dhuhr','asr','maghrib','isha']);
export const MODES=Object.freeze(['all-points-extrema','single-west-east-diagnostic']);
function ownFields(input,expected){
  if(!input||Object.getPrototypeOf(input)!==Object.prototype)throw new TypeError('Plain own-data object required');
  const ds=Object.getOwnPropertyDescriptors(input),keys=Reflect.ownKeys(ds);
  if(keys.length!==expected.length||!keys.every(k=>typeof k==='string'&&expected.includes(k)&&Object.hasOwn(ds[k],'value')&&ds[k].enumerable))throw new TypeError('Only exact documented own-data fields accepted');
}
function civilEpoch(date){
  if(typeof date!=='string'||!/^20\d\d-\d\d-\d\d$/.test(date))throw new RangeError('Civil date in2000–2099 required');
  const epoch=Date.parse(date+'T00:00:00Z');
  if(!Number.isFinite(epoch)||new Date(epoch).toISOString().slice(0,10)!==date)throw new RangeError('Invalid civil date');
  return epoch;
}
export function pointHours(input){
  if(arguments.length!==1)throw new TypeError('One point input required');
  ownFields(input,['date','latitude','longitude']);
  const carrier=civilEpoch(input.date),{latitude,longitude}=input;
  if(typeof latitude!=='number'||!Number.isFinite(latitude)||latitude<0||latitude>10||typeof longitude!=='number'||!Number.isFinite(longitude)||longitude<95||longitude>120)throw new RangeError('Research point geometry restricted to Malaysian-region rectangle');
  const jd=carrier/DAY+2440587.5,at=h=>solarCoordinatesUSNO(jd+(h-longitude/15)/24);
  const event=(altitude,after,anchor)=>{
    const sun=at(anchor),phi=latitude*RAD,delta=sun.declination*RAD;
    const cosine=(Math.sin(altitude*RAD)-Math.sin(phi)*Math.sin(delta))/(Math.cos(phi)*Math.cos(delta));
    return 12-longitude/15-sun.equationOfTimeHours+(after?1:-1)*Math.acos(cosine)/RAD/15;
  };
  const asrAltitude=Math.atan(1/(1+Math.tan(Math.abs(latitude-at(13).declination)*RAD)))/RAD;
  return {fajr:event(-18,false,5),sunrise:event(-50/60,false,6),dhuhr:12-longitude/15-at(12).equationOfTimeHours,
    asr:event(asrAltitude,true,13),maghrib:event(-50/60,true,18),isha:event(-18,true,18)};
}
function validate(input){
  ownFields(input,['date','zone','timeZone','mode']);
  const carrier=civilEpoch(input.date);
  if(typeof input.zone!=='string'||!Object.hasOwn(ZONES,input.zone)||input.timeZone!=='Asia/Kuala_Lumpur'||!MODES.includes(input.mode))throw new RangeError('Explicit supported zone, Asia/Kuala_Lumpur and mode required');
  return carrier;
}
export function calculateDay(input){
  if(arguments.length!==1)throw new TypeError('One zone input required');
  const carrier=validate(input),{points,printedPage}=ZONES[input.zone];
  const values=points.map(p=>({point:p,hours:pointHours({date:input.date,latitude:p.latitude,longitude:p.longitude})}));
  const west=values.reduce((a,b)=>b.point.longitude<a.point.longitude?b:a);
  const east=values.reduce((a,b)=>b.point.longitude>a.point.longitude?b:a);
  const formatter=new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn',{timeZone:input.timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
  const events=Object.fromEntries(EVENTS.map(event=>{
    // Do not silently discard an uncomputable vertex from an institutional zone.
    if(values.some(v=>!Number.isFinite(v.hours[event])))return[event,{status:'unavailable',time:null,date:null,iso:null,utc:null,reason:'at-least-one-reference-point-unavailable',notificationEligible:false}];
    const sign=event==='sunrise'?-1:1;
    const selected=input.mode==='all-points-extrema'?values.reduce((a,b)=>sign*b.hours[event]>sign*a.hours[event]?b:a):(event==='sunrise'?east:west);
    const hour=selected.hours[event],epoch=carrier+Math.floor(hour*3600)*1000+(event==='dhuhr'?64000:0);
    const rounded=(event==='sunrise'?Math.floor(epoch/60000):Math.ceil(epoch/60000))*60000;
    const p=Object.fromEntries(formatter.formatToParts(rounded).map(v=>[v.type,v.value]));
    const date=`${p.year}-${p.month}-${p.day}`,time=`${p.hour}:${p.minute}`;
    if(date!==input.date||(Date.parse(`${date}T${time}:00Z`)-rounded)/60000!==480)throw new Error('Unexpected Malaysian civil date/offset');
    return[event,{status:'estimated-unconfirmed',date,time,utc:new Date(rounded).toISOString(),iso:`${date}T${time}:00+08:00`,
      pointId:selected.point.id,rawEpoch:carrier+hour*HOUR,adjustedIntegerSecondEpoch:epoch,
      contributingRawHours:Object.fromEntries(values.map(v=>[v.point.id,v.hours[event]])),notificationEligible:false}];
  }));
  return {date:input.date,zone:input.zone,timeZone:input.timeZone,mode:input.mode,profileVersion:'0.1.0-research',
    official:false,productionReady:false,notificationEligible:false,locationMode:'zone',points:points.map(p=>({...p})),
    sourceCoordinateEdition:2025,printedPage,currentProductionPointSetConfirmed:false,
    recipe:{solar:'own-USNO-fixed-anchors',fajrAngle:18,ishaAngle:18,horizonAltitudeDegrees:-50/60,asrShadowFactor:1,
      aggregation:input.mode,selection:'raw hours before monotone integer-second and minute rounding; ties retain source order',
      dhuhrSeconds:64,intermediateSeconds:'floor',rounding:'ceil starts; floor sunrise',elevationCorrection:false,highLatitudeReplacement:false},events};
}
export function calculateYear(input){
  if(arguments.length!==1)throw new TypeError('One year input required');
  ownFields(input,['year','zone','timeZone','mode']);
  const {year,zone,timeZone,mode}=input;
  if(!Number.isInteger(year)||year<2000||year>2099)throw new RangeError('Year in2000–2099 required');
  validate({date:`${year}-01-01`,zone,timeZone,mode});
  const days=[];
  for(let epoch=Date.UTC(year,0,1);epoch<Date.UTC(year+1,0,1);epoch+=DAY)days.push(calculateDay({date:new Date(epoch).toISOString().slice(0,10),zone,timeZone,mode}));
  return {year,zone,mode,location:{timeZone},days};
}
