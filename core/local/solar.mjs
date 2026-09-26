// Continuous, source-free solar events for an explicitly supplied local point.
// This is a geometric reconstruction, not a Diyanet production implementation.
import {findLevelCrossings, solarAltitude} from '../astronomy/continuous-solver.mjs';
import {solarCoordinatesUSNO} from '../astronomy/solar-usno-v2.mjs';

const DAY_MS=86_400_000,HOUR_MS=3_600_000,RAD=Math.PI/180;
const JD_UNIX=2_440_587.5;
const MODEL='USNO-continuous-point-v1';
const EVENT_ORDER=Object.freeze(['fajr','sunrise','dhuhr','asr','maghrib','isha']);

const jd=epoch=>epoch/DAY_MS+JD_UNIX;
const normalizeLongitude=x=>x===180?-180:x;
const validDate=date=>typeof date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(date)
  &&Number.isFinite(Date.parse(`${date}T00:00:00Z`))
  &&new Date(Date.parse(`${date}T00:00:00Z`)).toISOString().slice(0,10)===date;

function checkedInput(input){
  if(!input||Object.getPrototypeOf(input)!==Object.prototype)throw new TypeError('Plain input object required');
  const allowed=['date','latitude','longitude','timeZone','ishaAngleDegrees'];
  const descriptors=Object.getOwnPropertyDescriptors(input),keys=Reflect.ownKeys(descriptors);
  if(keys.some(key=>typeof key!=='string'||!allowed.includes(key)||!descriptors[key].enumerable||!Object.hasOwn(descriptors[key],'value'))
    ||['date','latitude','longitude','timeZone'].some(key=>!Object.hasOwn(descriptors,key)))throw new TypeError('Expected own data fields date, latitude, longitude, timeZone, and optional ishaAngleDegrees');
  const value=Object.fromEntries(keys.map(key=>[key,descriptors[key].value]));
  if(Object.hasOwn(value,'ishaAngleDegrees')&&value.ishaAngleDegrees===undefined)throw new TypeError('ishaAngleDegrees must be omitted or set to 16 or 17');
  if(!validDate(value.date)||value.date<'2001-01-01'||value.date>'2098-12-31')throw new RangeError('Date must be a valid Gregorian date from 2001 through 2098');
  if(!Number.isFinite(value.latitude)||value.latitude< -89||value.latitude>89)throw new RangeError('Latitude must be from −89° through 89°');
  if(!Number.isFinite(value.longitude)||Math.abs(value.longitude)>180)throw new RangeError('Longitude must be from −180° through 180°');
  if(typeof value.timeZone!=='string'||!(value.timeZone==='UTC'||value.timeZone.includes('/')))throw new RangeError('An explicit IANA time zone is required');
  let formatter;
  try{formatter=new Intl.DateTimeFormat('en-CA-u-ca-gregory-nu-latn',{timeZone:value.timeZone,year:'numeric',month:'2-digit',day:'2-digit'});}
  catch{throw new RangeError('A valid IANA time zone is required');}
  const ishaAngleDegrees=Object.hasOwn(value,'ishaAngleDegrees')?value.ishaAngleDegrees:17;
  if(ishaAngleDegrees!==16&&ishaAngleDegrees!==17)throw new RangeError('ishaAngleDegrees must be 16 or 17');
  return{date:value.date,latitude:value.latitude,longitude:normalizeLongitude(value.longitude),timeZone:value.timeZone,ishaAngleDegrees,formatter};
}

function localDateAt(epoch,formatter){
  const p=Object.fromEntries(formatter.formatToParts(epoch).map(part=>[part.type,part.value]));
  return`${p.year}-${p.month}-${p.day}`;
}

function apparentTransitOnUtcDate(utcDate,longitude){
  const midnight=Date.parse(`${utcDate}T00:00:00Z`);
  let epoch=midnight+(12-longitude/15)*HOUR_MS;
  for(let i=0;i<12;i++)epoch=midnight+(12-longitude/15-solarCoordinatesUSNO(jd(epoch)).equationOfTimeHours)*HOUR_MS;
  const sun=solarCoordinatesUSNO(jd(epoch));
  const hourAngleHours=((epoch-midnight)/HOUR_MS+longitude/15+sun.equationOfTimeHours-12);
  return{epoch,declinationDegrees:sun.declination,equationOfTimeHours:sun.equationOfTimeHours,residualHours:hourAngleHours};
}

function anchoredTransit(date,longitude,formatter){
  const day=Date.parse(`${date}T00:00:00Z`),found=[];
  for(let offset=-2;offset<=2;offset++){
    const utcDate=new Date(day+offset*DAY_MS).toISOString().slice(0,10);
    const transit=apparentTransitOnUtcDate(utcDate,longitude);
    if(localDateAt(transit.epoch,formatter)===date&&found.every(item=>Math.abs(item.epoch-transit.epoch)>1))found.push(transit);
  }
  if(found.length===0)throw new RangeError(`No apparent solar transit belongs to civil date ${date} in ${formatter.resolvedOptions().timeZone}`);
  if(found.length!==1)throw new RangeError(`Ambiguous apparent solar transit for civil date ${date}`);
  return found[0];
}

function lowerMeridian(transitEpoch,longitude,direction){
  // Solve local apparent hour angle −180°/+180°; solar-cycle bounds therefore
  // follow the changing equation of time rather than assuming exactly 24 hours.
  const targetCycles=direction/2;
  const residual=epoch=>{
    const eot=solarCoordinatesUSNO(jd(epoch)).equationOfTimeHours;
    const transitEot=solarCoordinatesUSNO(jd(transitEpoch)).equationOfTimeHours;
    const transitPhase=transitEpoch/DAY_MS+longitude/360+transitEot/24-0.5;
    const phase=epoch/DAY_MS+longitude/360+eot/24-0.5;
    return phase-transitPhase-targetCycles;
  };
  let lo=transitEpoch+(direction<0?-15:0)*HOUR_MS;
  let hi=transitEpoch+(direction>0?15:0)*HOUR_MS;
  let flo=residual(lo),fhi=residual(hi);
  if(!(flo<=0&&fhi>=0))throw new Error('Could not bracket lower-meridian solar-cycle boundary');
  while(hi-lo>0.01){const mid=(lo+hi)/2,fm=residual(mid);if(fm<0){lo=mid;flo=fm;}else{hi=mid;fhi=fm;}}
  const epoch=(lo+hi)/2;
  return{epoch,residualHours:residual(epoch)*24};
}

function unavailable(reason,thresholdDegrees=null,diagnosticStatus=null){
  return{status:'unavailable',reason,epochMilliseconds:null,thresholdDegrees:Number.isFinite(thresholdDegrees)?thresholdDegrees:null,rootDirection:null,residualDegrees:null,diagnosticStatus};
}

function selectCrossing(diagnostic,direction,thresholdDegrees,side){
  const matches=diagnostic.crossings.filter(root=>root.direction===direction
    &&(side==='before'?root.epoch<diagnostic.transitEpoch:root.epoch>diagnostic.transitEpoch));
  if(matches.length>1)return unavailable('ambiguous-solar-crossing',thresholdDegrees,diagnostic.status);
  if(matches.length===0){
    const sameDirection=diagnostic.crossings.some(root=>root.direction===direction);
    const reason=diagnostic.status==='unavailable'?'nonfinite-solar-altitude'
      :diagnostic.status==='grazing'?'tangent-without-directed-crossing'
      :diagnostic.status==='continuously-above'?'sun-continuously-above-threshold'
      :diagnostic.status==='continuously-below'?'sun-continuously-below-threshold'
      :sameDirection?'crossing-outside-solar-cycle':`no-${direction}-crossing`;
    return unavailable(reason,thresholdDegrees,diagnostic.status);
  }
  const root=matches[0];
  return{status:'calculated',reason:null,epochMilliseconds:root.epoch,thresholdDegrees,rootDirection:root.direction,
    residualDegrees:solarAltitude(root.epoch,diagnostic.latitude,diagnostic.longitude)-thresholdDegrees,diagnosticStatus:diagnostic.status};
}

function eventCrossing({startEpoch,endEpoch,transitEpoch,latitude,longitude,thresholdDegrees,direction,side}){
  const startEpochForSide=side==='before'?startEpoch:transitEpoch;
  const endEpochForSide=side==='before'?transitEpoch:endEpoch;
  const crossings=findLevelCrossings({startEpoch:startEpochForSide,endEpoch:endEpochForSide,
    valueAt:epoch=>solarAltitude(epoch,latitude,longitude)-thresholdDegrees});
  crossings.transitEpoch=transitEpoch;crossings.latitude=latitude;crossings.longitude=longitude;
  return selectCrossing(crossings,direction,thresholdDegrees,side);
}

/**
 * Calculate one explicit local-point solar cycle from continuous USNO coordinates.
 * Returned epochs are unrounded floating-point UTC milliseconds. This function
 * applies no Temkin, timezone offset arithmetic, terrain, elevation or fallback.
 */
export function calculateLocalSolarDay(input){
  const x=checkedInput(input),transit=anchoredTransit(x.date,x.longitude,x.formatter);
  const previous=lowerMeridian(transit.epoch,x.longitude,-1),next=lowerMeridian(transit.epoch,x.longitude,1);
  const sunAtTransit=solarCoordinatesUSNO(jd(transit.epoch));
  const noonAltitude=90-Math.abs(x.latitude-sunAtTransit.declination);
  const declinationDifference=Math.abs(x.latitude-sunAtTransit.declination);
  const asrDenominator=1+Math.tan(declinationDifference*RAD);
  const asrAltitude=asrDenominator>0?Math.atan(1/asrDenominator)/RAD:NaN;
  const events={};
  events.fajr=eventCrossing({startEpoch:previous.epoch,endEpoch:transit.epoch,transitEpoch:transit.epoch,latitude:x.latitude,longitude:x.longitude,
    thresholdDegrees:-18,direction:'rising',side:'before'});
  events.sunrise=eventCrossing({startEpoch:previous.epoch,endEpoch:transit.epoch,transitEpoch:transit.epoch,latitude:x.latitude,longitude:x.longitude,
    thresholdDegrees:-50/60,direction:'rising',side:'before'});
  events.dhuhr={status:'calculated',reason:null,epochMilliseconds:transit.epoch,thresholdDegrees:null,rootDirection:null,
    residualDegrees:null,diagnosticStatus:null};
  if(!(noonAltitude>0))events.asr=unavailable('sun-not-above-geometric-horizon-at-transit',asrAltitude);
  else if(!(asrDenominator>0)||!Number.isFinite(asrAltitude)||!(asrAltitude>0))events.asr=unavailable('nonphysical-asr-threshold',asrAltitude);
  else events.asr=eventCrossing({startEpoch:transit.epoch,endEpoch:next.epoch,transitEpoch:transit.epoch,latitude:x.latitude,longitude:x.longitude,
    thresholdDegrees:asrAltitude,direction:'setting',side:'after'});
  events.maghrib=eventCrossing({startEpoch:transit.epoch,endEpoch:next.epoch,transitEpoch:transit.epoch,latitude:x.latitude,longitude:x.longitude,
    thresholdDegrees:-50/60,direction:'setting',side:'after'});
  events.isha=eventCrossing({startEpoch:transit.epoch,endEpoch:next.epoch,transitEpoch:transit.epoch,latitude:x.latitude,longitude:x.longitude,
    thresholdDegrees:-x.ishaAngleDegrees,direction:'setting',side:'after'});
  return{
    date:x.date,location:{latitude:x.latitude,longitude:x.longitude,timeZone:x.timeZone},
    model:{id:MODEL,coordinates:'USNO approximate apparent geocentric solar coordinates',horizon:'flat geometric horizon; −50 arcminutes encodes standard solar semidiameter/refraction convention',
      observerElevationMetres:null,terrain:null,topocentricParallax:false,asrShadowFactor:1,asrConvention:'afternoon crossing of the factor-one shadow altitude computed from solar declination at transit',
      ishaAngleDegrees:x.ishaAngleDegrees,temkinApplied:false},
    solarCycle:{startEpochMilliseconds:previous.epoch,endEpochMilliseconds:next.epoch,
      startHourAngleResidualHours:previous.residualHours,endHourAngleResidualHours:next.residualHours},
    transit:{status:'calculated',epochMilliseconds:transit.epoch,localDate:x.date,declinationDegrees:sunAtTransit.declination,
      equationOfTimeHours:sunAtTransit.equationOfTimeHours,residualHourAngleHours:transit.residualHours,
      geometricAltitudeDegrees:noonAltitude,asrThresholdDegrees:Number.isFinite(asrAltitude)?asrAltitude:null},
    events:Object.fromEntries(EVENT_ORDER.map(name=>[name,events[name]])),
  };
}
