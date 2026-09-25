// Additive research candidate: existing continuous five-marker geometry, plus
// the separately declared instantaneous positive factor-1 Asr continuation.
// No calendars, network, fitted parameters or institutional replacement rules.
import {geometryDay} from '../../shia-angles/implementation/geometry.mjs';
import {solarCoordinatesUSNO} from '../../../core/astronomy/solar-usno-v2.mjs';
import {findPhysicalAsr} from '../../../core/astronomy/physical-asr-solver.mjs';
const DAY=86400000,HOUR=3600000;
export const CONTINUOUS_FIELDS=Object.freeze(['fajr','sunrise','dhuhr','asrTable','sunset','ishaTable']);
export const CONTINUOUS_RECIPE=Object.freeze({id:'continuous-usno-six-markers-nearest-v1',
  horizonDegrees:-5/6,fajrDegrees:18,ishaTableDegrees:18,
  rounding:'nearest-absolute-UTC-minute',asrShadowFactor:1,
  asrGeometry:'instantaneous-positive-physical-shadow-root',
  asrProvenance:'separate-research-continuation-not-institution-confirmed'});

function validate(input){
  if(input===null||typeof input!=='object'||![Object.prototype,null].includes(Object.getPrototypeOf(input)))throw new TypeError('Plain own-data input required');
  const d=Object.getOwnPropertyDescriptors(input),keys=Reflect.ownKeys(d),fields=['date','latitude','longitude','timeZone'];
  if(keys.length!==4||keys.some(k=>typeof k!=='string'||!fields.includes(k)||!d[k].enumerable||!Object.hasOwn(d[k],'value')))throw new TypeError('Exactly four enumerable own-data fields required');
  const {date,latitude,longitude,timeZone}=input;
  if(typeof date!=='string'||!/^20\d{2}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T00:00:00Z'))||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)throw new RangeError('Gregorian date2000–2099 required');
  for(const [key,value,bound] of [['latitude',latitude,90],['longitude',longitude,180]])if(typeof value!=='number'||!Number.isFinite(value)||Math.abs(value)>bound)throw new RangeError('Invalid '+key);
  if(typeof timeZone!=='string'||(timeZone!=='UTC'&&!timeZone.includes('/'))||/^[+-]/.test(timeZone))throw new RangeError('Explicit IANA timezone required');
  try{return new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});}catch{throw new RangeError('Explicit IANA timezone required');}
}
function parts(epoch,fmt){return Object.fromEntries(fmt.formatToParts(epoch).map(p=>[p.type,p.value]));}
function localDate(epoch,fmt){const p=parts(epoch,fmt);return `${p.year}-${p.month}-${p.day}`;}
function upperTransit(carrier,longitude){
  let t=carrier+(12-longitude/15)*HOUR;
  const next=x=>carrier+(12-longitude/15-solarCoordinatesUSNO(x/DAY+2440587.5).equationOfTimeHours)*HOUR;
  for(let i=0;i<12;i++)t=next(t);
  if(!Number.isFinite(t)||Math.abs(next(t)-t)>0.1)throw new Error('Unconverged model transit');
  return t;
}
const roles=Object.freeze({fajr:'hypothetical-dawn-table-marker',sunrise:'hypothetical-horizon-marker',
  dhuhr:'upper-meridian-marker',asrTable:'unconfirmed-asr-table-marker',
  sunset:'hypothetical-horizon-marker',ishaTable:'unconfirmed-isha-table-marker'});
function render(raw,reason,diagnostic,fmt,date,name){
  const qualityFlags=[{code:'experimental-table-marker-not-legal-window'}];
  if(name==='asrTable')qualityFlags.push({code:'physical-asr-continuation-not-institution-confirmed'});
  const common={role:roles[name],reason,diagnostic:{...diagnostic},notificationEligible:false,qualityFlags};
  if(raw===null)return {...common,status:'unavailable',rawEpoch:null,epoch:null,utc:null,rawLocalDate:null,localDate:null,time:null,utcOffsetMinutes:null,eventLocalDateDiffers:null};
  if(!Number.isFinite(raw))throw new Error('Nonfinite root');
  const epoch=Math.round(raw/60000)*60000,p=parts(epoch,fmt),d=`${p.year}-${p.month}-${p.day}`,rawDate=localDate(raw,fmt);
  if(d!==date)qualityFlags.push({code:'event-local-date-differs-from-requested-date',requestedDate:date,eventLocalDate:d});
  if(d!==rawDate)qualityFlags.push({code:'rounding-crosses-local-date',rawLocalDate:rawDate,eventLocalDate:d});
  return {...common,status:'experimental-astronomical-marker',rawEpoch:raw,epoch,utc:new Date(epoch).toISOString(),rawLocalDate:rawDate,localDate:d,time:`${p.hour}:${p.minute}`,utcOffsetMinutes:(Date.parse(`${d}T${p.hour}:${p.minute}:${p.second}Z`)-epoch)/60000,eventLocalDateDiffers:d!==date};
}

export function calculateContinuousCandidate(input){
  if(arguments.length!==1)throw new TypeError('Exactly one input object required');
  const fmt=validate(input),{date,latitude,longitude,timeZone}=input;
  const g=geometryDay({date,latitude,longitude,timeZone,engine:'usno'});
  const carriers=[];
  if(Math.abs(latitude)!==90){
    const base=Date.parse(date+'T00:00:00Z');
    for(let i=-2;i<=2;i++){
      const carrier=base+i*DAY,transit=upperTransit(carrier,longitude);
      if(transit>=g.bounds.startEpoch&&transit<g.bounds.endEpoch&&localDate(transit,fmt)===date)carriers.push({carrier,transit});
    }
    if(carriers.length!==1)throw new RangeError('Exactly one upper transit on requested civil date required');
    if(Math.abs(carriers[0].transit-g.transit)>1)throw new Error('Reusable geometry carrier disagrees with independent enumeration');
  }
  const values={dhuhr:{epoch:g.transit,reason:g.transitUnavailableReason,diagnostic:{kind:'upper-meridian-crossing-not-height-maximum'}}};
  for(const [field,altitude,direction] of [['fajr',-18,'rising'],['sunrise',-5/6,'rising'],['sunset',-5/6,'setting'],['ishaTable',-18,'setting']])values[field]=g.crossing(altitude,direction);
  if(g.transit===null){
    values.asrTable={epoch:null,reason:'geographic-pole-has-no-daily-solar-cycle',diagnostic:{kind:'instantaneous-positive-factor-1-shadow-root',asrShadowFactor:1}};
  }else{
    const asr=findPhysicalAsr({transit:g.transit,latitude,longitude,asrFactor:1,ephemeris:'usno'});
    values.asrTable={epoch:asr.rawEpoch,reason:asr.reason,diagnostic:{kind:'instantaneous-positive-factor-1-shadow-root',asrShadowFactor:1,
      solverStatus:asr.search?.status??null,rejectedCrossings:asr.rejected.length,atRoot:asr.atRoot?{...asr.atRoot}:null,
      searchStartUtc:new Date(g.transit).toISOString(),searchEndUtc:new Date(g.transit+12*HOUR).toISOString()}};
  }
  return {date,profileId:'bayynat-continuous-usno-nearest-research',profileVersion:'0.3.0-research',locationMode:'point',location:{latitude,longitude,timeZone},recipe:CONTINUOUS_RECIPE,
    events:Object.fromEntries(CONTINUOUS_FIELDS.map(field=>{const v=values[field];return [field,render(v.epoch,v.reason,v.diagnostic,fmt,date,field)];})),
    diagnostic:{carrierUtc:carriers.length?new Date(carriers[0].carrier).toISOString():null,transitRawEpoch:g.transit,civilStartUtc:new Date(g.bounds.startEpoch).toISOString(),civilEndUtc:new Date(g.bounds.endEpoch).toISOString(),civilDayHours:(g.bounds.endEpoch-g.bounds.startEpoch)/HOUR},
    runtime:{node:process.version,icu:process.versions.icu,tzdb:process.versions.tz},
    qualityFlags:[{code:'experimental-geographic-extension-not-institutionally-validated'},{code:'bayynat-production-coordinates-unknown'},
      {code:'uniform-nearest-rounding-not-institution-confirmed'},{code:'asr-isha-table-roles-not-legal-starts'},
      {code:'physical-asr-is-separate-sixth-marker-continuation'},{code:'fixed-horizon-does-not-establish-elevation-match'},
      {code:'no-high-latitude-substitution-rule'},{code:'source-event-dates-unconfirmed'},{code:'offline-local-calculation'}],
    official:false,productionReady:false,notificationEligible:false,legalWindowInterpretation:false};
}
