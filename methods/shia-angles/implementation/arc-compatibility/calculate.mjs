// Experimental reconstruction, NOT an authority specification or religious ruling.
// The compatibility mode deliberately emulates a suspected calendar arithmetic bug.
// No reference calendar, city table, or per-date correction is read by this module.
import {solarCoordinatesUSNO} from '../../../../core/astronomy/solar-usno-v2.mjs';
import {fields} from '../../../../core/input.mjs';
const DAY=86400000,HOUR=3600000,RAD=Math.PI/180;
export const VERSION='arc-experiment-2.0.0';
export const EVENTS=Object.freeze(['fajr','sunrise','dhuhr','sunset','maghrib','midnight']);
export function julianMonthRoundingError(date){
  let month=Number(date.slice(5,7));if(month<=2)month+=12;
  const monthTerm=30.6001*(month+1);
  return Math.round(monthTerm)-Math.floor(monthTerm);
}
function validate(input){
  if(!input||typeof input!=='object'||Array.isArray(input))throw new TypeError('Options must be an object');
  const allowed=['date','latitude','longitude','timeZone','maghribAngle','mode'];
  for(const key of Object.keys(input))if(!allowed.includes(key))throw new TypeError(`Unknown option: ${key}`);
  const {date,latitude,longitude,timeZone,maghribAngle=3.75,mode='astronomical'}=input;
  if(typeof date!=='string'||!/^20\d{2}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T00:00:00Z'))||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)throw new RangeError('A real Gregorian date in 2000–2099 is required');
  if(typeof latitude!=='number'||!Number.isFinite(latitude)||Math.abs(latitude)>60)throw new RangeError('Experimental latitude domain is −60…60 degrees');
  if(typeof longitude!=='number'||!Number.isFinite(longitude)||Math.abs(longitude)>180)throw new RangeError('Longitude must be −180…180 degrees');
  if(typeof timeZone!=='string'||!timeZone||/^[+−-]/.test(timeZone))throw new RangeError('An IANA time zone is required');
  try{new Intl.DateTimeFormat('en',{timeZone});}catch{throw new RangeError('An IANA time zone is required');}
  if(![3.75,4.5].includes(maghribAngle))throw new RangeError('Explicit experimental Maghrib angle must be 3.75 or 4.5 degrees');
  if(!['astronomical','publisher-compatibility'].includes(mode))throw new RangeError('Unknown experiment mode');
  return{date,latitude,longitude,timeZone,maghribAngle,mode};
}
function civilDate(epoch,formatter){
  const p=Object.fromEntries(formatter.formatToParts(epoch).map(v=>[v.type,v.value]));return`${p.year}-${p.month}-${p.day}`;
}
function solarDay(options){
  const {date,latitude,longitude,timeZone,maghribAngle,mode}=options;
  const wanted=Date.parse(date+'T00:00:00Z');
  const shift=mode==='publisher-compatibility'?julianMonthRoundingError(date)*DAY:0;
  const formatter=new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'});
  let epoch=wanted;
  const at=hour=>solarCoordinatesUSNO((epoch+shift+hour*HOUR)/DAY+2440587.5);
  const transit=()=>12-longitude/15-at(12-longitude/15).equationOfTimeHours;
  for(let i=0;i<3;i++){
    const actual=civilDate(epoch+transit()*HOUR,formatter);
    if(actual===date)break;
    epoch+=wanted-Date.parse(actual+'T00:00:00Z');
  }
  if(civilDate(epoch+transit()*HOUR,formatter)!==date)throw new RangeError('Civil date does not exist or cannot be anchored in this zone');
  const clock=(solar,altitude,after)=>{
    const decl=solar.declination*RAD,phi=latitude*RAD;
    const cosH=(Math.sin(altitude*RAD)-Math.sin(phi)*Math.sin(decl))/(Math.cos(phi)*Math.cos(decl));
    return !Number.isFinite(cosH)||Math.abs(cosH)>1?null:12-longitude/15-solar.equationOfTimeHours+(after?1:-1)*Math.acos(cosH)/RAD/15;
  };
  const event=(altitude,after,anchor)=>{
    let hour=clock(at(anchor-longitude/15),altitude,after);
    for(let i=0;i<5&&hour!==null;i++)hour=clock(at(hour),altitude,after);
    return hour===null?null:epoch+hour*HOUR;
  };
  return{fajr:event(-18,false,5),sunrise:event(-50/60,false,6),dhuhr:epoch+transit()*HOUR+(mode==='publisher-compatibility'?60000:0),sunset:event(-50/60,true,18),maghrib:event(-maghribAngle,true,18)};
}
function calculateArcExperiment(input){
  const options=validate(input),raw=solarDay(options);
  let midnightEnd;
  if(options.mode==='publisher-compatibility')midnightEnd=raw.fajr===null?null:raw.fajr+DAY;
  else{
    const nextDate=new Date(Date.parse(options.date+'T00:00:00Z')+DAY).toISOString().slice(0,10);
    // Internal next-day calculation may cross the public 2099 limit.
    try{midnightEnd=solarDay({...options,date:nextDate}).fajr;}catch(e){if(e instanceof RangeError)midnightEnd=null;else throw e;}
  }
  raw.midnight=raw.sunset===null||midnightEnd===null?null:(raw.sunset+midnightEnd)/2;
  const clock=new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn',{timeZone:options.timeZone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
  const day=new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn',{timeZone:options.timeZone,year:'numeric',month:'2-digit',day:'2-digit'});
  const events=Object.fromEntries(EVENTS.map(name=>{
    const instant=raw[name]===null?null:Math.round(raw[name]/60000)*60000;
    return[name,{status:instant===null?'unavailable':options.mode==='publisher-compatibility'?'experimental-compatibility':'calculated',time:instant===null?null:clock.format(instant),localDate:instant===null?null:civilDate(instant,day),isoUtc:instant===null?null:new Date(instant).toISOString(),rawEpochMilliseconds:raw[name]}];
  }));
  return{date:options.date,location:{latitude:options.latitude,longitude:options.longitude,timeZone:options.timeZone},model:{version:VERSION,mode:options.mode,tzdb:process.versions.tz,maghribAngle:options.maghribAngle,fajrAngle:18,authorityConfirmed:false,calendarBugHypothesis:options.mode==='publisher-compatibility'?'nearest rounding instead of floor in Gregorian-to-Julian month term':null,dhuhrOffsetMinutes:options.mode==='publisher-compatibility'?1:0,midnightBasis:options.mode==='publisher-compatibility'?'same-row Fajr +24h (unconfirmed publisher behavior)':'next civil day astronomical Fajr',warning:'Research only: the ARC server implementation and religious approval are unknown. No Asr/Isha or high-latitude religious substitute is supplied.'},events};
}

// Explicit compatibility entry. Its model instants are not source-confirmed events.
export function calculateArcCompatibility(input) {
  if (arguments.length !== 1) throw new TypeError('Exactly one input record required');
  fields(input, ['date', 'latitude', 'longitude', 'timeZone', 'maghribAngle']);
  if (typeof input.timeZone !== 'string' || (input.timeZone !== 'UTC' && !input.timeZone.includes('/')))
    throw new RangeError('Explicit IANA time zone required');
  const result = calculateArcExperiment({...input, mode:'publisher-compatibility'});
  return {...result, official:false, productionReady:false, notificationEligible:false,
    qualityFlags:['unconfirmed-publisher-compatibility','hypothesized-calendar-arithmetic-error',
      'source-event-dates-unverified','source-DST-anomalies-not-emulated','not-eligible-for-automatic-notifications'],
    events:{...Object.fromEntries(Object.entries(result.events).map(([name,value])=>[name,{...value,
      reason:value.status==='unavailable'?'fixed-point-angle-or-midpoint-endpoint-unavailable':null,
      notificationEligible:false,sourceEventDateConfirmed:false,
      dateBasis:'model-assigned; source supplies clocks only'}])),
      asr:{status:'unspecified',reason:'ARC-source-does-not-specify-an-Asr-marker',time:null,localDate:null,isoUtc:null,rawEpochMilliseconds:null,notificationEligible:false,sourceEventDateConfirmed:false},
      isha:{status:'unspecified',reason:'ARC-source-does-not-specify-an-Isha-marker',time:null,localDate:null,isoUtc:null,rawEpochMilliseconds:null,notificationEligible:false,sourceEventDateConfirmed:false}}};
}
