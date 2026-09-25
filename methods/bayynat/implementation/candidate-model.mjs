// Additive development matrix; all candidates are explicit, with no calendar access.
// No calendar, source file, preset library, network or location database access.
import {solarCoordinatesUSNO} from '../../../core/astronomy/solar-usno-v2.mjs';

const DAY=86400000,HOUR=3600000,RAD=Math.PI/180,TANGENCY_BAND=1e-12;
export const EVENTS=Object.freeze(['fajr','sunrise','dhuhr','asrTable','sunset','ishaTable']);
export const VERSION='0.1.0-development';
export const CANDIDATES=Object.freeze(Object.fromEntries([0,12,24].flatMap(epochHours=>[['h1',-1],['h5over6',-5/6]].flatMap(([horizonId,horizon])=>['nearest','floor','ceil','dhuhr-floor-others-nearest'].map(rounding=>{const id=`utc${epochHours}-${horizonId}-${rounding}`;return[id,Object.freeze({id,engine:'own-usno',epochHours,horizon,fajrDegrees:18,ishaTableDegrees:18,asrShadowFactor:1,rounding})];})))));
function recipeFor(id){if(typeof id!=='string'||!Object.hasOwn(CANDIDATES,id))throw new TypeError('One of the24 declared candidate IDs required');return CANDIDATES[id];}
export function roundEvent(rawEpoch,event,recipeId){
 const recipe=recipeFor(recipeId);if(typeof rawEpoch!=='number'||!Number.isFinite(rawEpoch)||!EVENTS.includes(event))throw new TypeError('Finite event epoch and known event required');
 const policy=recipe.rounding==='dhuhr-floor-others-nearest'?(event==='dhuhr'?'floor':'nearest'):recipe.rounding;
 return (policy==='floor'?Math.floor:policy==='ceil'?Math.ceil:Math.round)(rawEpoch/60000)*60000;
}

export class CivilDateError extends RangeError {
 constructor(reason){super(reason);this.reason=reason;}
}
function validate(input) {
 const fields=['date','latitude','longitude','timeZone'];
 if(input===null||typeof input!=='object'||![Object.prototype,null].includes(Object.getPrototypeOf(input)))throw new TypeError('Plain own-data input required');
 const d=Object.getOwnPropertyDescriptors(input),keys=Reflect.ownKeys(d);
 if(keys.length!==fields.length||keys.some(k=>typeof k!=='string'||!fields.includes(k)||!Object.hasOwn(d[k],'value')||!d[k].enumerable))throw new TypeError('Exactly date,latitude,longitude,timeZone as enumerable own data fields required');
 const{date,latitude,longitude,timeZone}=input;
 if(typeof date!=='string'||!/^20\d{2}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T00:00:00Z'))||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)throw new RangeError('Gregorian date2000–2099 required');
 for(const[k,v,limit]of[['latitude',latitude,90],['longitude',longitude,180]])if(typeof v!=='number'||!Number.isFinite(v)||Math.abs(v)>limit)throw new RangeError('Invalid '+k);
 if(typeof timeZone!=='string'||(timeZone!=='UTC'&&!timeZone.includes('/'))||timeZone.startsWith('+')||timeZone.startsWith('-'))throw new RangeError('Explicit valid IANA timezone required');
 let fmt;try{fmt=new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});}catch{throw new RangeError('Explicit valid IANA timezone required');}
 return fmt;
}
const parts=(epoch,fmt)=>Object.fromEntries(fmt.formatToParts(epoch).map(p=>[p.type,p.value]));
function dateAt(epoch,fmt){const p=parts(epoch,fmt);return`${p.year}-${p.month}-${p.day}`;}
function civilBounds(date,fmt) {
 const middle=Date.parse(date+'T00:00:00Z'),start=middle-36*HOUR,end=middle+36*HOUR,step=15*60000;
 let prior=start,inside=dateAt(start,fmt)===date,begin=null;const runs=[];
 if(inside)throw new CivilDateError('civil-search-boundary-insufficient');
 const refine=(left,right,wantInside)=>{while(right-left>1){const m=Math.floor((left+right)/2);if((dateAt(m,fmt)===date)===wantInside)right=m;else left=m;}return right;};
 for(let epoch=start+step;epoch<=end;epoch+=step){
  const now=dateAt(epoch,fmt)===date;
  if(now&&!inside)begin=refine(prior,epoch,true);
  if(!now&&inside){runs.push({startEpoch:begin,endEpoch:refine(prior,epoch,false)});begin=null;}
  inside=now;prior=epoch;
 }
 if(inside)throw new CivilDateError('civil-search-boundary-insufficient');
 if(runs.length===0)throw new CivilDateError('civil-date-does-not-exist');
 if(runs.length!==1)throw new CivilDateError('discontinuous-civil-date-unsupported');
 if(runs[0].endEpoch-runs[0].startEpoch>2*DAY)throw new CivilDateError('civil-date-too-long');
 return runs[0];
}
function selectCarrier(date,longitude,fmt,bounds,recipe) {
 const requested=Date.parse(date+'T00:00:00Z'),matches=[];
 for(let offset=-2;offset<=2;offset++){
  const carrier=requested+offset*DAY,sampleEpoch=carrier+recipe.epochHours*HOUR,s=solarCoordinatesUSNO(sampleEpoch/DAY+2440587.5);
  const transitHours=12-longitude/15-s.equationOfTimeHours,transit=carrier+transitHours*HOUR;
  if(transit>=bounds.startEpoch&&transit<bounds.endEpoch&&dateAt(transit,fmt)===date)matches.push({carrier,sampleEpoch,solar:s,transitHours,transit});
 }
 if(matches.length!==1)throw new CivilDateError(matches.length===0?'no-model-transit-on-civil-date':'multiple-model-transits-on-civil-date');
 return matches[0];
}
function crossing(latitude,declination,altitude,after,anchor) {
 const phi=latitude*RAD,dec=declination*RAD,denominator=Math.cos(phi)*Math.cos(dec);
 if(!Number.isFinite(denominator)||Math.abs(denominator)<1e-14)return{rawEpoch:null,reason:'singular-hour-angle-geometry',diagnostic:{altitudeDegrees:altitude}};
 const q=(Math.sin(altitude*RAD)-Math.sin(phi)*Math.sin(dec))/denominator;
 const diagnostic={altitudeDegrees:altitude,hourAngleCosine:q,direction:after?'setting':'rising'};
 if(!Number.isFinite(q))return{rawEpoch:null,reason:'nonfinite-hour-angle',diagnostic};
 if(Math.abs(Math.abs(q)-1)<=TANGENCY_BAND)return{rawEpoch:null,reason:'tangent-or-numerically-unresolved-crossing',diagnostic};
 if(q>1)return{rawEpoch:null,reason:'fixed-solar-cycle-below-target',diagnostic};
 if(q<-1)return{rawEpoch:null,reason:'fixed-solar-cycle-above-target',diagnostic};
 const hours=Math.acos(q)/RAD/15;
 const rawEpoch=anchor.carrier+(anchor.transitHours+(after?hours:-hours))*HOUR;
 return{rawEpoch,reason:null,diagnostic:{...diagnostic,hourAngleHours:hours}};
}
const roles={fajr:'hypothetical-dawn-table-marker',sunrise:'hypothetical-horizon-marker',dhuhr:'fixed-ephemeris-meridian-marker',asrTable:'unconfirmed-asr-table-marker',sunset:'hypothetical-horizon-marker',ishaTable:'unconfirmed-isha-table-marker'};
function render(value,fmt,name,date,recipe) {
 const common={role:roles[name],notificationEligible:false,qualityFlags:[{code:'experimental-table-marker-not-legal-window'},{code:'fixed-ephemeris-not-continuous-crossing-guarantee'}],...(value.diagnostic?{diagnostic:value.diagnostic}:{})};
 if(value.rawEpoch===null)return{status:'unavailable',rawEpoch:null,epoch:null,utc:null,localDate:null,time:null,utcOffsetMinutes:null,reason:value.reason,...common};
 if(!Number.isFinite(value.rawEpoch))throw new Error('Nonfinite event must not be rendered');
 const epoch=roundEvent(value.rawEpoch,name,recipe.id),p=parts(epoch,fmt),localDate=`${p.year}-${p.month}-${p.day}`,time=`${p.hour}:${p.minute}`,rawLocalDate=dateAt(value.rawEpoch,fmt);
 if(localDate!==date)common.qualityFlags.push({code:'event-local-date-differs-from-requested-date',requestedDate:date,eventLocalDate:localDate});
 if(localDate!==rawLocalDate)common.qualityFlags.push({code:'rounding-crosses-local-date',rawLocalDate,eventLocalDate:localDate});
 return{status:'experimental-astronomical-marker',rawEpoch:value.rawEpoch,epoch,utc:new Date(epoch).toISOString(),localDate,time,utcOffsetMinutes:(Date.parse(`${localDate}T${p.hour}:${p.minute}:${p.second}Z`)-epoch)/60000,reason:null,...common};
}

export function calculateCandidateDay(input,recipeId) {
 if(arguments.length!==2)throw new TypeError('Input and declared recipe ID required');
 const recipe=recipeFor(recipeId);
 const fmt=validate(input),{date,latitude,longitude,timeZone}=input,bounds=civilBounds(date,fmt);
 let raw,diagnostic;
 if(Math.abs(latitude)===90){
  raw=Object.fromEntries(EVENTS.map(k=>[k,{rawEpoch:null,reason:k==='dhuhr'?'geographic-pole-no-unique-solar-transit':'geographic-pole-no-unique-diurnal-solar-cycle'}]));
  diagnostic={carrierUtc:null,sampleUtc:null,transitRawEpoch:null,declinationDegrees:null,noonSolarMarginDegrees:null,asrTargetAltitudeDegrees:null};
 }else{
  const a=selectCarrier(date,longitude,fmt,bounds,recipe),declination=a.solar.declination;
  const noonSolarMargin=90-Math.abs(latitude-declination);
  const asrTarget=noonSolarMargin>0?Math.atan(1/(1+Math.tan(Math.abs(latitude-declination)*RAD)))/RAD:null;
  const asr=noonSolarMargin<=0?{rawEpoch:null,reason:'asr-no-positive-noon-solar-margin'}:asrTarget===null||!Number.isFinite(asrTarget)||asrTarget<=0?{rawEpoch:null,reason:'asr-no-positive-target'}:crossing(latitude,declination,asrTarget,true,a);
  if(asr.rawEpoch!==null){
   const h=(asr.rawEpoch-a.transit)/HOUR*15*RAD,phi=latitude*RAD,dec=declination*RAD;
   const actual=Math.asin(Math.max(-1,Math.min(1,Math.sin(phi)*Math.sin(dec)+Math.cos(phi)*Math.cos(dec)*Math.cos(h))))/RAD;
   if(asr.rawEpoch<=a.transit||asr.rawEpoch>=a.transit+12*HOUR||actual<=0){asr.rawEpoch=null;asr.reason='asr-no-positive-post-transit-crossing';}
   else asr.diagnostic={...asr.diagnostic,fixedModelAltitudeDegrees:actual,positivePhysicalGeometry:true};
  }
  raw={fajr:crossing(latitude,declination,-18,false,a),sunrise:crossing(latitude,declination,recipe.horizon,false,a),dhuhr:{rawEpoch:a.transit,reason:null},asrTable:asr,sunset:crossing(latitude,declination,recipe.horizon,true,a),ishaTable:crossing(latitude,declination,-18,true,a)};
  diagnostic={carrierUtc:new Date(a.carrier).toISOString(),sampleUtc:new Date(a.sampleEpoch).toISOString(),transitRawEpoch:a.transit,declinationDegrees:declination,equationOfTimeHours:a.solar.equationOfTimeHours,noonSolarMarginDegrees:noonSolarMargin,asrTargetAltitudeDegrees:asrTarget,tangencyCosineBand:TANGENCY_BAND};
 }
 return{date,profileId:'bayynat-point-development-'+recipe.id,profileVersion:VERSION,locationMode:'point',location:{latitude,longitude,timeZone},recipe:{...recipe},events:Object.fromEntries(EVENTS.map(k=>[k,render(raw[k],fmt,k,date,recipe)])),diagnostic:{...diagnostic,civilStartUtc:new Date(bounds.startEpoch).toISOString(),civilEndUtc:new Date(bounds.endEpoch).toISOString(),civilDayHours:(bounds.endEpoch-bounds.startEpoch)/HOUR},runtime:{node:process.version,tzdb:process.versions.tz,icu:process.versions.icu},qualityFlags:[{code:'experimental-geographic-extension-not-institutionally-validated'},{code:'bayynat-production-coordinates-unknown'},{code:'asr-isha-table-roles-not-legal-starts'},{code:'no-high-latitude-substitution-rule'},{code:'source-event-dates-unconfirmed'}],official:false,productionReady:false,notificationEligible:false,legalWindowInterpretation:false};
}
