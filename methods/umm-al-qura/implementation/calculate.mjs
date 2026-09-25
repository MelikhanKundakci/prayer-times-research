// Independent experimental Umm-al-Qura angle/interval reconstruction.
// No provider data or network access. Solar formulas are our USNO implementation.
import{solarCoordinatesUSNO}from'../../../core/astronomy/solar-usno.mjs';
const DAY=86400000,MIN=60000,RAD=Math.PI/180;
const hijri=new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn',{timeZone:'UTC',year:'numeric',month:'numeric',day:'numeric'});
export function hijriForDate(date){const parts=Object.fromEntries(hijri.formatToParts(new Date(date+'T12:00:00Z')).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));return{year:Number(parts.year),month:Number(parts.month),day:Number(parts.day)};}
export function calculateDay({date,latitude,longitude,timeZone,fajrAngle=18.5,dhuhrOffset=0,asrFactor=1,rounding='outward',solarEpoch='local-anchors',fajrEpoch='same'}){
 if(typeof date!=='string'||!/^20\d\d-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T00:00:00Z'))||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)throw new Error('Invalid Gregorian date');
 if(!Number.isFinite(latitude)||Math.abs(latitude)>90||!Number.isFinite(longitude)||Math.abs(longitude)>180)throw new Error('Invalid coordinates');
 if(!['nearest','up','outward'].includes(rounding)||!['local-anchors','utc-midnight','solar-noon'].includes(solarEpoch))throw new Error('Unknown geometry/rounding');
 if(!['same','utc-noon','local-solar-noon'].includes(fajrEpoch))throw new Error('Unknown Fajr epoch');
 if(![18,18.5,19].includes(fajrAngle)||![0,1,2].includes(dhuhrOffset)||![1,2].includes(asrFactor))throw new Error('Unsupported experimental parameter');
 const fmt=new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
 const parts=e=>Object.fromEntries(fmt.formatToParts(new Date(e)).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
 const localDate=e=>{const p=parts(e);return`${p.year}-${p.month}-${p.day}`;};
 const requestedEpoch=Date.parse(date+'T00:00:00Z');let epoch=requestedEpoch,jd,at,transit;
 for(let trial=0;trial<3;trial++){
  jd=epoch/DAY+2440587.5;
  at=hour=>solarCoordinatesUSNO(jd+(solarEpoch==='utc-midnight'?0:((solarEpoch==='solar-noon'?12:hour)-longitude/15)/24));
  transit=epoch+(12-longitude/15-at(12).equationOfTimeHours)*3600000;
  const actual=localDate(transit);if(actual===date)break;epoch+=requestedEpoch-Date.parse(actual+'T00:00:00Z');
 }
 if(localDate(transit)!==date)throw new Error('No matching civil date');
 const event=(altitude,after,anchor)=>{const s=altitude===-fajrAngle&&fajrEpoch!=='same'?solarCoordinatesUSNO(jd+(fajrEpoch==='utc-noon'?.5:(12-longitude/15)/24)):at(anchor);return epoch+(12-longitude/15-s.equationOfTimeHours+(after?1:-1)*Math.acos((Math.sin(altitude*RAD)-Math.sin(latitude*RAD)*Math.sin(s.declination*RAD))/(Math.cos(latitude*RAD)*Math.cos(s.declination*RAD)))/RAD/15)*3600000;};
 const asrAltitude=Math.atan(1/(asrFactor+Math.tan(Math.abs(latitude-at(13).declination)*RAD)))/RAD;
 const sunset=event(-.833,true,18),hijriDate=hijriForDate(date),ishaInterval=hijriDate.month===9?120:90;
 const raw={fajr:event(-fajrAngle,false,5),sunrise:event(-.833,false,6),dhuhr:transit+dhuhrOffset*MIN,asr:event(asrAltitude,true,13),maghrib:sunset,isha:sunset+ishaInterval*MIN};
 const events={};for(const[field,value]of Object.entries(raw)){if(!Number.isFinite(value)){events[field]={time:null,iso:null,localDate:null,status:'unavailable'};continue;}const instant=(rounding==='outward'?(field==='sunrise'?Math.floor(value/MIN):Math.ceil(value/MIN)):rounding==='up'?Math.ceil(value/MIN):Math.floor(value/MIN+.5))*MIN,p=parts(instant);events[field]={time:`${p.hour}:${p.minute}`,iso:new Date(instant).toISOString(),localDate:localDate(instant),status:'experimental-calculated'};}
 return{date,hijriDate,ishaInterval,solarCalculationDate:new Date(epoch).toISOString().slice(0,10),events};
}
export function calculateYear(options){if(!Number.isInteger(options.year)||options.year<2000||options.year>2099)throw new Error('Year must be2000..2099');const days=[];for(let epoch=Date.UTC(options.year,0,1);epoch<Date.UTC(options.year+1,0,1);epoch+=DAY)days.push(calculateDay({...options,date:new Date(epoch).toISOString().slice(0,10)}));return{version:'0.1.0-research',parameters:options,hijriCalendar:'ICU islamic-umalqura civil dates',days};}
