// Isolated research baseline. This is not an official Bimas/SIHAT implementation.
import{solarCoordinatesUSNO}from'../../../core/astronomy/solar-usno-v2.mjs';
const DAY=86400000,HOUR=3600000,RAD=Math.PI/180;
export const VERSION='indonesia-research-1.0.0';
export const PRESETS=Object.freeze({
 'unadjusted-angles':Object.freeze({solarBasis:'actual-event',horizonAltitude:-50/60,rounding:'nearest',ihtiyatMinutes:0,dhuhrMinutes:0,sunriseMinutes:0,description:'Angle-only astronomy; no publisher offset assumptions.'}),
 'kemenag-2026-book-example':Object.freeze({solarBasis:'daily-zone-noon',horizonAltitude:-1,rounding:'outward',ihtiyatMinutes:2,dhuhrMinutes:3,sunriseMinutes:-2,description:'Kemenag Ephemeris2026 worked example pp439–443: one daily solar coordinate at05/04/03UTC for WIB/WITA/WIT; −1° horizon, ceil+2min starts, ceil+3min Dhuhr, floor−2min sunrise. Independent USNO ephemeris replaces the printed tables.'}),
});
function validate(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw new TypeError('Options object required');
 for(const k of Object.keys(input))if(!['date','latitude','longitude','timeZone','fajrAngle','preset'].includes(k))throw new TypeError('Unknown option: '+k);
 const{date,latitude,longitude,timeZone,fajrAngle=20,preset='unadjusted-angles'}=input;
 if(typeof date!=='string'||!/^20\d{2}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T00:00Z'))||new Date(date+'T00:00Z').toISOString().slice(0,10)!==date)throw new RangeError('Real date in 2000–2099 required');
 if(typeof latitude!=='number'||!Number.isFinite(latitude)||latitude < -12||latitude > 8)throw new RangeError('Experimental Indonesian latitude box is −12…8');
 if(typeof longitude!=='number'||!Number.isFinite(longitude)||longitude<94||longitude>142)throw new RangeError('Experimental Indonesian longitude box is 94…142');
 if(!['Asia/Jakarta','Asia/Pontianak','Asia/Makassar','Asia/Jayapura'].includes(timeZone))throw new RangeError('An explicit Indonesian IANA timezone is required');
 if(![18,20].includes(fajrAngle))throw new RangeError('Fajr angle must explicitly be18 or20 degrees');
 if(!Object.hasOwn(PRESETS,preset))throw new RangeError('Unknown experimental preset');
 return{date,latitude,longitude,timeZone,fajrAngle,preset};
}
export function calculateIndonesia(input){
 const x=validate(input),p=PRESETS[x.preset],epoch=Date.parse(x.date+'T00:00Z');
 const zonePart=new Intl.DateTimeFormat('en',{timeZone:x.timeZone,timeZoneName:'longOffset'}).formatToParts(epoch+12*HOUR).find(v=>v.type==='timeZoneName').value;
 const zoneMatch=zonePart.match(/^GMT\+(\d{2}):(\d{2})$/);if(!zoneMatch)throw new RangeError('Unsupported Indonesian timezone offset');
 const zoneOffsetHours=Number(zoneMatch[1])+Number(zoneMatch[2])/60;
 const at=hours=>solarCoordinatesUSNO((epoch+(p.solarBasis==='daily-zone-noon'?12-zoneOffsetHours:hours)*HOUR)/DAY+2440587.5);
 const transit=12-x.longitude/15-at(12-x.longitude/15).equationOfTimeHours;
 const angle=(s,altitude,after)=>{const phi=x.latitude*RAD,d=s.declination*RAD,c=(Math.sin(altitude*RAD)-Math.sin(phi)*Math.sin(d))/(Math.cos(phi)*Math.cos(d));return !Number.isFinite(c)||Math.abs(c)>1?null:12-x.longitude/15-s.equationOfTimeHours+(after?1:-1)*Math.acos(c)/RAD/15;};
 const event=(altitude,after,anchor)=>{let hours=anchor-x.longitude/15;for(let i=0;i<6;i++){const s=at(hours);hours=angle(s,typeof altitude==='function'?altitude(s):altitude,after);if(hours===null)return null;}return epoch+hours*HOUR;};
 const raw={fajr:event(-x.fajrAngle,false,5),sunrise:event(p.horizonAltitude,false,6),duha:event(4.5,false,7),dhuhr:epoch+transit*HOUR,asr:event(s=>Math.atan(1/(1+Math.tan(Math.abs(x.latitude-s.declination)*RAD)))/RAD,true,15),maghrib:event(p.horizonAltitude,true,18),isha:event(-18,true,19)};
 const fmt=new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn',{timeZone:x.timeZone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
 const events=Object.fromEntries(Object.entries(raw).map(([name,value])=>{
  const offset=name==='sunrise'?p.sunriseMinutes:name==='dhuhr'?p.dhuhrMinutes:p.ihtiyatMinutes;
  const round=p.rounding==='nearest'?Math.round:name==='sunrise'?Math.floor:Math.ceil;
  const instant=value===null?null:(round(value/60000)+offset)*60000;
  return[name,{status:instant===null?'unavailable':'experimental',time:instant===null?null:fmt.format(instant),isoUtc:instant===null?null:new Date(instant).toISOString(),rawEpochMilliseconds:value}];
 }));
 const fajr=events.fajr.isoUtc===null?null:Date.parse(events.fajr.isoUtc),imsak=fajr===null?null:fajr-600000;
 events.imsak={status:imsak===null?'unavailable':'experimental',time:imsak===null?null:fmt.format(imsak),isoUtc:imsak===null?null:new Date(imsak).toISOString(),rawEpochMilliseconds:null};
 return{date:x.date,location:{latitude:x.latitude,longitude:x.longitude,timeZone:x.timeZone},model:{version:VERSION,preset:x.preset,fajrAngle:x.fajrAngle,ishaAngle:18,asrShadowFactor:1,...p,tzdb:process.versions.tz,officialImplementation:false,elevationMetres:null,fajrAngle18IsComparisonOnly:x.fajrAngle===18,warning:'Independent implementation of a worked example, not verified Bimas/SIHAT source code. A fixed −1° horizon is not an elevation model. A18° override tests only the documented Muhammadiyah Fajr distinction; it is not a verified full Muhammadiyah timetable.'},events};
}
