// Exactly one source-motivated hypothesis. No reference calendars, I/O or tuning.
import { pointHours } from '../multipoint/model.mjs';
import { POINTS } from './points.mjs';
const DAY=86400000,HOUR=3600000;
export const EVENTS=Object.freeze(['fajr','sunrise','dhuhr','asr','maghrib','isha']);
function ownFields(input,expected){
 if(!input||Object.getPrototypeOf(input)!==Object.prototype)throw new TypeError('Plain own-data object required');
 const ds=Object.getOwnPropertyDescriptors(input),keys=Reflect.ownKeys(ds);
 if(keys.length!==expected.length||!keys.every(k=>typeof k==='string'&&expected.includes(k)&&Object.hasOwn(ds[k],'value')&&ds[k].enumerable))throw new TypeError('Only exact own-data fields accepted');
}
function validate(input){
 ownFields(input,['date','zone','timeZone']);
 if(typeof input.date!=='string'||!/^20\d\d-\d\d-\d\d$/.test(input.date))throw new RangeError('Civil date required');
 const epoch=Date.parse(input.date+'T00:00:00Z');
 if(!Number.isFinite(epoch)||new Date(epoch).toISOString().slice(0,10)!==input.date||Number(input.date.slice(0,4))>2026)throw new RangeError('Valid civil date in2000–2026 required; later zone contract unresolved');
 if(input.zone!=='SGR01'||input.timeZone!=='Asia/Kuala_Lumpur')throw new RangeError('Explicit SGR01 and Asia/Kuala_Lumpur required');
 return epoch;
}
export function calculateDay(input){
 if(arguments.length!==1)throw new TypeError('Exactly one input required');
 const carrier=validate(input);
 const calculate=p=>({point:p,hours:pointHours({date:input.date,latitude:p.latitude,longitude:p.longitude})});
 const starts=[calculate(POINTS.gedangsa),calculate(POINTS.tanjungRhu)],sunrise=calculate(POINTS.broga);
 const formatter=new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn',{timeZone:input.timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
 const events=Object.fromEntries(EVENTS.map(event=>{
  const options=event==='sunrise'?[sunrise]:starts;
  if(options.some(v=>!Number.isFinite(v.hours[event])))return[event,{status:'unavailable',date:null,time:null,utc:null,iso:null,reason:'a-required-point-unavailable',notificationEligible:false}];
  const selected=options.reduce((a,b)=>b.hours[event]>a.hours[event]?b:a);
  const hours=selected.hours[event],adjusted=carrier+Math.floor(hours*3600)*1000+(event==='dhuhr'?64000:0);
  const rounded=(event==='sunrise'?Math.floor(adjusted/60000):Math.ceil(adjusted/60000))*60000;
  const p=Object.fromEntries(formatter.formatToParts(rounded).map(x=>[x.type,x.value])),date=`${p.year}-${p.month}-${p.day}`,time=`${p.hour}:${p.minute}`;
  if(date!==input.date||(Date.parse(`${date}T${time}:00Z`)-rounded)/60000!==480)throw new Error('Unexpected civil date/offset');
  return[event,{status:'estimated-unconfirmed',date,time,utc:new Date(rounded).toISOString(),iso:`${date}T${time}:00+08:00`,pointId:selected.point.id,
   rawEpoch:carrier+hours*HOUR,adjustedIntegerSecondEpoch:adjusted,contributingRawHours:Object.fromEntries(options.map(v=>[v.point.id,v.hours[event]])),
   qualityFlags:['independent-reconstruction','institutional-production-point-set-unconfirmed',...(selected.point.id==='tanjung-rhu-village-proxy'?['unconfirmed-village-proxy-used']:[])],notificationEligible:false}];
 }));
 return{date:input.date,zone:input.zone,timeZone:input.timeZone,locationMode:'region',profileId:'jakim-sgr01-two-point-village-proxy',profileVersion:'0.1.0-research',
  official:false,productionReady:false,notificationEligible:false,points:Object.fromEntries(Object.entries(POINTS).map(([k,p])=>[k,{...p}])),
  qualityFlags:['village-proxy-not-verified-prayer-point','historical-interview-not-current-production-spec','gdm2000-used-without-datum-transformation'],
  recipe:{solar:'own-USNO-fixed-anchors',startAggregation:'max raw hours over Gedangsa and KgTanjungRhu village proxy',sunrise:'unchanged Broga point',fajrAngle:18,ishaAngle:18,horizonAltitudeDegrees:-50/60,asrShadowFactor:1,dhuhrSeconds:64,intermediateSeconds:'floor',rounding:'ceil starts; floor sunrise',elevationCorrection:false,highLatitudeReplacement:false},events};
}
export function calculateYear(input){
 if(arguments.length!==1)throw new TypeError('Exactly one year input required');
 ownFields(input,['year','zone','timeZone']);const{year,zone,timeZone}=input;
 if(!Number.isInteger(year)||year<2000||year>2026)throw new RangeError('Integer year in2000–2026 required');
 validate({date:`${year}-01-01`,zone,timeZone});const days=[];
 for(let e=Date.UTC(year,0,1);e<Date.UTC(year+1,0,1);e+=DAY)days.push(calculateDay({date:new Date(e).toISOString().slice(0,10),zone,timeZone}));
 return{year,zone,timeZone,candidate:'usno-fixed-two-point-sgr01-village-proxy',days};
}
