import {getProfile,listProfiles} from './profiles.mjs';
import {geometryDay,CivilDayError,partsAt,localDateAt} from './geometry.mjs';
export {listProfiles};
export const ENGINES=Object.freeze(['usno','noaa']);
export const EVENTS=Object.freeze(['fajr','sunrise','dhuhr','sunset','maghrib','asr','isha','midnight']);
const DAY=86400000;
function fields(input){
 const expected=['date','latitude','longitude','timeZone','profileId','engine'];
 if(!input||Object.getPrototypeOf(input)!==Object.prototype)throw new TypeError('Plain own-data input required');
 const d=Object.getOwnPropertyDescriptors(input),keys=Reflect.ownKeys(d);
 if(keys.length!==expected.length||!keys.every(k=>typeof k==='string'&&expected.includes(k)&&Object.hasOwn(d[k],'value')&&d[k].enumerable))throw new TypeError('Exactly the six documented own-data fields are required');
}
function validate(input){
 fields(input);const{date,latitude,longitude,timeZone,engine}=input;
 if(typeof date!=='string'||!/^20\d\d-\d\d-\d\d$/.test(date)||!Number.isFinite(Date.parse(date+'T00:00:00Z'))||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)throw new RangeError('Valid Gregorian date in2000–2099 required');
 for(const[name,value,limit]of[['latitude',latitude,90],['longitude',longitude,180]])if(typeof value!=='number'||!Number.isFinite(value)||Math.abs(value)>limit)throw new RangeError('Invalid '+name);
 if(typeof timeZone!=='string'||(timeZone!=='UTC'&&!timeZone.includes('/'))||/^[+−-]/.test(timeZone))throw new RangeError('Explicit IANA timezone required');
 try{new Intl.DateTimeFormat('en',{timeZone});}catch{throw new RangeError('Explicit valid IANA timezone required');}
 if(!ENGINES.includes(engine))throw new RangeError('Explicit usno/noaa engine required');
 return getProfile(input.profileId);
}
const missing=(status,reason)=>({status,reason,localDate:null,time:null,iso:null,utc:null,rawEpoch:null,notificationEligible:false});
function event(value,geometry,role){
 if(value.epoch===null)return{...missing('unavailable',value.reason),role,...(value.diagnostic?{diagnostic:{...value.diagnostic}}:{})};
 if(!Number.isFinite(value.epoch))throw new Error('Nonfinite event must never be rendered');
 const rounded=Math.floor((value.epoch+30000)/60000)*60000,p=partsAt(rounded,geometry.formatter),localDate=`${p.year}-${p.month}-${p.day}`,time=`${p.hour}:${p.minute}`;
 const offsetMinutes=(Date.parse(`${localDate}T${time}:00Z`)-rounded)/60000;
 return{status:'experimental-astronomical-marker',reason:null,role,localDate,time,iso:new Date(rounded).toISOString(),utc:new Date(rounded).toISOString(),utcOffsetMinutes:offsetMinutes,rawEpoch:value.epoch,
  qualityFlags:localDate!==localDateAt(value.epoch,geometry.formatter)?['rounding-crosses-local-date']:[],...(value.diagnostic?{diagnostic:{...value.diagnostic}}:{}),notificationEligible:false};
}
export function calculateDay(input){
 if(arguments.length!==1)throw new TypeError('Exactly one input object required');
 const profile=validate(input),g=geometryDay(input),raw={fajr:g.crossing(-profile.fajrAngle,'rising'),sunrise:g.crossing(-50/60,'rising'),dhuhr:{epoch:g.transit,reason:g.transitUnavailableReason},sunset:g.crossing(-50/60,'setting'),maghrib:g.crossing(-profile.maghribAngle,'setting')};
 if(profile.ishaAngle!==null)raw.isha=g.crossing(-profile.ishaAngle,'setting');
 const events=Object.fromEntries(Object.entries(raw).map(([name,v])=>[name,event(v,g,name==='dhuhr'?'solar-meridian-transit-marker':name==='sunrise'||name==='sunset'?'standard-horizon-marker':'published-angle-marker')]));
 events.asr={...missing('unspecified','no-asr-marker-or-legal-window-specified-by-this-profile'),role:'not-specified'};
 if(profile.ishaAngle===null)events.isha={...missing('unspecified','no-separate-isha-angle-in-ARC-source'),role:'not-specified'};
 let midnight={epoch:null,reason:'sunset-unavailable'},end=null;
 if(raw.sunset.epoch!==null){
  const nextDate=new Date(Date.parse(input.date+'T00:00:00Z')+DAY).toISOString().slice(0,10);
  try{const tomorrow=geometryDay({...input,date:nextDate}),next=tomorrow.crossing(-profile.fajrAngle,'rising');
   if(next.epoch===null)midnight={epoch:null,reason:'next-civil-day-fajr-unavailable:'+next.reason};
   else if(next.epoch<=raw.sunset.epoch)midnight={epoch:null,reason:'end-fajr-not-after-sunset'};
   else{end=next.epoch;midnight={epoch:(raw.sunset.epoch+next.epoch)/2,reason:null};}
  }catch(error){if(!(error instanceof CivilDayError))throw error;midnight={epoch:null,reason:'next-civil-day-unavailable:'+error.reason};}
 }
 events.midnight={...event(midnight,g,'sunset-to-next-fajr-midpoint-marker'),basis:{sunsetRawEpoch:raw.sunset.epoch,nextFajrRawEpoch:end}};
 return{date:input.date,location:{latitude:input.latitude,longitude:input.longitude,timeZone:input.timeZone},locationMode:'point',profile,
  engine:{name:input.engine,version:'0.1.0-research',continuous:true,tzdb:process.versions.tz},official:false,productionReady:false,notificationEligible:false,
  assumptions:{fajrAngle:profile.fajrAngle,maghribAngle:profile.maghribAngle,ishaAngle:profile.ishaAngle,horizonAltitudeDegrees:-50/60,offsetMinutes:0,rounding:'nearest UTCminute directly from continuous epoch',solarCoordinates:'approximate geocentric solar coordinates; no extra topocentric parallax, observer elevation or atmospheric model',eventDateContract:'rising since previous solar transit; setting until next solar transit; anchored transit on requested civil date',extremeLatitudeFallback:'none',midnight:'raw sunset to actual raw Fajr of next civil date; not same-row+24h',sourceBugCompatibility:false,legalWindowsComputed:false},
  diagnostics:{civilStartUtc:new Date(g.bounds.startEpoch).toISOString(),civilEndUtc:new Date(g.bounds.endEpoch).toISOString(),civilDayHours:(g.bounds.endEpoch-g.bounds.startEpoch)/3600000,transitAltitudeDegrees:g.transitAltitudeDegrees},
  qualityFlags:['independent-research-geometry','parameter-publication-not-authority-certification','not-eligible-for-automatic-notifications',...(g.transitAltitudeDegrees<0?['solar-transit-below-horizon']:[])],events:Object.fromEntries(EVENTS.map(e=>[e,events[e]]))};
}
