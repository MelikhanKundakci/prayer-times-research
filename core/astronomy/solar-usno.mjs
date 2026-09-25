// Independent implementation of the published US Naval Observatory equations.
// Source: https://aa.usno.navy.mil/faq/sun_approx (accessed2026-09-24).
// Degrees externally, radians only for JavaScript trigonometric functions.
const RAD=Math.PI/180;
const wrap=(value,period)=>((value%period)+period)%period;
export function solarCoordinatesUSNO(julianDate){
 if(!Number.isFinite(julianDate))throw new Error('Finite Julian date required');
 const days=julianDate-2451545;
 const anomaly=wrap(357.529+.98560028*days,360);
 const meanLongitude=wrap(280.459+.98564736*days,360);
 const longitude=meanLongitude+1.915*Math.sin(anomaly*RAD)+.020*Math.sin(2*anomaly*RAD);
 const obliquity=23.439-.00000036*days;
 const rightAscension=wrap(Math.atan2(Math.cos(obliquity*RAD)*Math.sin(longitude*RAD),Math.cos(longitude*RAD))/RAD/15,24);
 const declination=Math.asin(Math.sin(obliquity*RAD)*Math.sin(longitude*RAD))/RAD;
 const equationOfTimeHours=wrap(meanLongitude/15-rightAscension+12,24)-12;
 return{declination,equationOfTimeHours,rightAscension};
}
export function solarUSNODay(epoch,latitude,longitude){
 const jd=epoch/86400000+2440587.5,rad=RAD;
 const at=localSolarHour=>solarCoordinatesUSNO(jd+(localSolarHour-longitude/15)/24);
 const noon=at(12),transit=12-longitude/15-noon.equationOfTimeHours;
 const event=(altitude,after,anchor)=>{const s=at(anchor);const hourAngle=Math.acos((Math.sin(altitude*rad)-Math.sin(latitude*rad)*Math.sin(s.declination*rad))/(Math.cos(latitude*rad)*Math.cos(s.declination*rad)))/rad;return epoch+(12-longitude/15-s.equationOfTimeHours+(after?1:-1)*hourAngle/15)*3600000;};
 const asrDeclination=at(13).declination;
 const asr=factor=>event(Math.atan(1/(factor+Math.tan(Math.abs(latitude-asrDeclination)*rad)))/rad,true,13);
 const utc=new Date(epoch),date=new Date(utc.getUTCFullYear(),utc.getUTCMonth(),utc.getUTCDate(),12);
 if(date.getFullYear()!==utc.getUTCFullYear()||date.getMonth()!==utc.getUTCMonth()||date.getDate()!==utc.getUTCDate())throw new Error('Host skipped date: use TZ=UTC');
 return{date,transit:epoch+transit*3600000,sunrise:event(-.833,false,6),sunset:event(-.833,true,18),fajr:event(-18,false,5),isha:event(-18,true,18),asr_standard:asr(1),asr_hanafi:asr(2),declination:noon.declination};
}
