// One explicitly unconfirmed map/list hypothesis; no references are read here.
import {pointHours} from '../model.mjs';
import {ZONES} from '../points.mjs';
export const EVENTS=Object.freeze(['fajr','sunrise','dhuhr','asr','maghrib','isha']);
export const MODES=Object.freeze(['table-only','map-plus-r19']);
export const R19=Object.freeze({id:'r19',latitude:6+3/60,longitude:101+7/60+30/3600});
const DAY=86400000;
function data(input,fields){
  if(!input||Object.getPrototypeOf(input)!==Object.prototype)throw new TypeError('Plain own-data object required');
  const ds=Object.getOwnPropertyDescriptors(input),keys=Reflect.ownKeys(ds);
  if(keys.length!==fields.length||!keys.every(k=>typeof k==='string'&&fields.includes(k)&&ds[k].enumerable&&Object.hasOwn(ds[k],'value')))throw new TypeError('Exact own-data fields required');
}
function civil(date){
  if(typeof date!=='string'||!/^20\d\d-\d\d-\d\d$/.test(date))throw new RangeError('Date2000-2099required');
  const epoch=Date.parse(date+'T00:00:00Z');
  if(!Number.isFinite(epoch)||new Date(epoch).toISOString().slice(0,10)!==date)throw new RangeError('Invalid civil date');
  return epoch;
}
function validate(input){
  data(input,['date','zone','timeZone','mode']);
  const epoch=civil(input.date);
  if(input.zone!=='KDH03'||input.timeZone!=='Asia/Kuala_Lumpur'||!MODES.includes(input.mode))throw new RangeError('ExplicitKDH03,Asia/Kuala_Lumpur and supported mode required');
  return epoch;
}
export function calculateDay(input){
  if(arguments.length!==1)throw new TypeError('Exactly one input required');
  const carrier=validate(input),points=[...ZONES.KDH03.points,...(input.mode==='map-plus-r19'?[R19]:[])];
  const samples=points.map(point=>({point,hours:pointHours({date:input.date,latitude:point.latitude,longitude:point.longitude})}));
  const formatter=new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn',{timeZone:input.timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
  const events=Object.fromEntries(EVENTS.map(event=>{
    if(samples.some(s=>!Number.isFinite(s.hours[event])))return[event,{status:'unavailable',date:null,time:null,utc:null,iso:null,reason:'at-least-one-reference-point-unavailable',notificationEligible:false}];
    const sign=event==='sunrise'?-1:1;
    const selected=samples.reduce((a,b)=>sign*b.hours[event]>sign*a.hours[event]?b:a);
    const hour=selected.hours[event],epoch=carrier+Math.floor(hour*3600)*1000+(event==='dhuhr'?64000:0);
    const rounded=(event==='sunrise'?Math.floor:Math.ceil)(epoch/60000)*60000;
    const parts=Object.fromEntries(formatter.formatToParts(rounded).map(p=>[p.type,p.value]));
    const date=`${parts.year}-${parts.month}-${parts.day}`,time=`${parts.hour}:${parts.minute}`;
    if(date!==input.date||(Date.parse(`${date}T${time}:00Z`)-rounded)/60000!==480)throw new Error('Unexpected civil date or timezone offset');
    return[event,{status:'estimated-unconfirmed',date,time,utc:new Date(rounded).toISOString(),iso:`${date}T${time}:00+08:00`,pointId:selected.point.id,
      rawEpoch:carrier+hour*3600000,adjustedIntegerSecondEpoch:epoch,
      contributingRawHours:Object.fromEntries(samples.map(s=>[s.point.id,s.hours[event]])),notificationEligible:false}];
  }));
  return{date:input.date,zone:input.zone,timeZone:input.timeZone,mode:input.mode,profileVersion:'0.1.0-research-map',
    official:false,productionReady:false,notificationEligible:false,currentProductionPointSetConfirmed:false,
    locationMode:'zone',points:points.map(p=>({...p})),sourceCoordinateEdition:2025,
    hypothesis:input.mode==='map-plus-r19'?'R19belongs-toKDH03point-set-for-all-events-unconfirmed':'frozen-parent-table-point-set',
    recipe:{solar:'own-USNO-fixed-anchors',fajrAngle:18,ishaAngle:18,horizonAltitudeDegrees:-50/60,asrShadowFactor:1,
      aggregation:'maximum-entry-minimum-sunrise-all-listed-points',dhuhrSeconds:64,intermediateSeconds:'floor',
      rounding:'ceil starts; floor sunrise',elevationCorrection:false,highLatitudeReplacement:false},events};
}
export function calculateYear(input){
  if(arguments.length!==1)throw new TypeError('Exactly one input required');
  data(input,['year','zone','timeZone','mode']);
  const{year,zone,timeZone,mode}=input;
  if(!Number.isInteger(year)||year<2000||year>2099)throw new RangeError('Year2000-2099required');
  validate({date:`${year}-01-01`,zone,timeZone,mode});
  const days=[];
  for(let e=Date.UTC(year,0,1);e<Date.UTC(year+1,0,1);e+=DAY)days.push(calculateDay({date:new Date(e).toISOString().slice(0,10),zone,timeZone,mode}));
  return{year,zone,mode,location:{timeZone},official:false,productionReady:false,notificationEligible:false,days};
}
