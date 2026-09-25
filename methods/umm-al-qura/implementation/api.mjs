// Strict public entry point around the unchanged frozen research kernel.
import{calculateDay as kernelDay}from'./calculate.mjs';import{solarCoordinatesUSNO}from'../../../core/astronomy/solar-usno.mjs';
export const SELECTED=Object.freeze({fajrAngle:18.5,dhuhrOffset:0,asrFactor:1,rounding:'outward',solarEpoch:'local-anchors',fajrEpoch:'utc-noon'});
function validate(options,period){
 if(!options||typeof options!=='object'||Array.isArray(options))throw new Error('Options object required');
 const allowed=new Set([period,'latitude','longitude','timeZone',...Object.keys(SELECTED)]);for(const key of Object.keys(options))if(!allowed.has(key))throw new Error('Unknown option: '+key);
 for(const key of Object.keys(SELECTED))if(Object.hasOwn(options,key)&&options[key]===undefined)throw new Error('Explicit undefined is not a valid option: '+key);
 if(typeof options.timeZone!=='string'||(options.timeZone!=='UTC'&&!options.timeZone.includes('/')))throw new Error('Explicit IANA timezone required');
 new Intl.DateTimeFormat('en-GB',{timeZone:options.timeZone});
}
function checkedDay(options){
 const parameters={...SELECTED,...options},day=kernelDay(parameters),epoch=Date.parse(day.solarCalculationDate+'T00:00:00Z'),jd=epoch/86400000+2440587.5;
 const offset=parameters.solarEpoch==='utc-midnight'?0:((parameters.solarEpoch==='solar-noon'?12:13)-options.longitude/15)/24;
 const declination=solarCoordinatesUSNO(jd+offset).declination,altitude=Math.atan(1/(parameters.asrFactor+Math.tan(Math.abs(options.latitude-declination)*Math.PI/180)))*180/Math.PI;
 day.qualityFlags=[];
 if(day.events.asr.time!==null&&altitude<=0){day.events.asr={...day.events.asr,referenceModelTime:day.events.asr.time,referenceModelIso:day.events.asr.iso,time:null,iso:null,localDate:null,status:'nonphysical-shadow'};day.qualityFlags.push({event:'asr',code:'shadow-angle-below-horizon',altitudeDegrees:altitude});}
 if(day.events.asr.iso&&day.events.asr.iso<day.events.dhuhr.iso){day.events.asr.status='ordering-exception';day.qualityFlags.push({event:'asr',code:'before-adjusted-dhuhr'});}
 return day;
}
function result(options,days){return{schemaVersion:1,profile:{id:'umm-al-qura-reconstructed',version:'0.1.1-strict-wrapper',official:false,parameters:{...SELECTED,...Object.fromEntries(Object.entries(options).filter(([k])=>k in SELECTED))}},location:{latitude:options.latitude,longitude:options.longitude,timeZone:options.timeZone},limitations:['Geometry and rounding are experimental reconstruction, not a confirmed institutional specification.','Ramadan uses ICU islamic-umalqura civil dates; future lunar announcements may differ.','No high-latitude religious replacement is selected; unavailable/nonphysical events must not be offered as valid prayer starts.','Institutional API offset/date anomalies are not copied.'],days};}
export function calculateDay(options){validate(options,'date');return result(options,[checkedDay(options)]);}
export function calculateYear(options){validate(options,'year');if(!Number.isInteger(options.year)||options.year<2000||options.year>2099)throw new Error('Year must be2000..2099');const{year,...parameters}=options,days=[];for(let epoch=Date.UTC(year,0,1);epoch<Date.UTC(year+1,0,1);epoch+=86400000)days.push(checkedDay({...parameters,date:new Date(epoch).toISOString().slice(0,10)}));return result(options,days);}
