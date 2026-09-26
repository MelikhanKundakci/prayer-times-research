// Continuous, source-free solar events for an explicitly supplied local point.
// This is a geometric reconstruction, not a Diyanet production implementation.
import {findLevelCrossings, solarAltitude} from '../astronomy/continuous-solver.mjs';
import {solarCoordinatesUSNO} from '../astronomy/solar-usno-v2.mjs';
import {solarCoordinatesSPA} from '../astronomy/spa-point.mjs';

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
  const allowed=['date','latitude','longitude','timeZone','fajrAngleDegrees','ishaAngleDegrees','asrShadowFactor','horizonDepressionDegrees','solarModel'];
  const descriptors=Object.getOwnPropertyDescriptors(input),keys=Reflect.ownKeys(descriptors);
  if(keys.some(key=>typeof key!=='string'||!allowed.includes(key)||!descriptors[key].enumerable||!Object.hasOwn(descriptors[key],'value'))
    ||['date','latitude','longitude','timeZone'].some(key=>!Object.hasOwn(descriptors,key)))throw new TypeError('Expected own data fields date, latitude, longitude, timeZone, and optional solar-rule parameters');
  const value=Object.fromEntries(keys.map(key=>[key,descriptors[key].value]));
  for(const key of ['fajrAngleDegrees','ishaAngleDegrees','asrShadowFactor','horizonDepressionDegrees','solarModel']){
    if(Object.hasOwn(value,key)&&value[key]===undefined)throw new TypeError(`${key} must be omitted or set to a valid value`);
  }
  if(!validDate(value.date)||value.date<'2001-01-01'||value.date>'2098-12-31')throw new RangeError('Date must be a valid Gregorian date from 2001 through 2098');
  if(!Number.isFinite(value.latitude)||value.latitude< -89||value.latitude>89)throw new RangeError('Latitude must be from −89° through 89°');
  if(!Number.isFinite(value.longitude)||Math.abs(value.longitude)>180)throw new RangeError('Longitude must be from −180° through 180°');
  if(typeof value.timeZone!=='string'||!(value.timeZone==='UTC'||value.timeZone.includes('/')))throw new RangeError('An explicit IANA time zone is required');
  let formatter;
  try{formatter=new Intl.DateTimeFormat('en-CA-u-ca-gregory-nu-latn',{timeZone:value.timeZone,year:'numeric',month:'2-digit',day:'2-digit'});}
  catch{throw new RangeError('A valid IANA time zone is required');}
  const fajrAngleDegrees=Object.hasOwn(value,'fajrAngleDegrees')?value.fajrAngleDegrees:18;
  const ishaAngleDegrees=Object.hasOwn(value,'ishaAngleDegrees')?value.ishaAngleDegrees:17;
  const asrShadowFactor=Object.hasOwn(value,'asrShadowFactor')?value.asrShadowFactor:1;
  const horizonDepressionDegrees=Object.hasOwn(value,'horizonDepressionDegrees')?value.horizonDepressionDegrees:50/60;
  if(!Number.isFinite(fajrAngleDegrees)||fajrAngleDegrees<=0||fajrAngleDegrees>30)throw new RangeError('fajrAngleDegrees must be greater than 0° and at most 30°');
  if(!Number.isFinite(ishaAngleDegrees)||ishaAngleDegrees<=0||ishaAngleDegrees>30)throw new RangeError('ishaAngleDegrees must be greater than 0° and at most 30°');
  if(asrShadowFactor!==1&&asrShadowFactor!==2)throw new RangeError('asrShadowFactor must be 1 or 2');
  if(!Number.isFinite(horizonDepressionDegrees)||horizonDepressionDegrees<=0||horizonDepressionDegrees>2)throw new RangeError('horizonDepressionDegrees must be greater than 0° and at most 2°');
  const solarModel=Object.hasOwn(value,'solarModel')?value.solarModel:'usno';
  if(!['usno','spa'].includes(solarModel))throw new RangeError('solarModel must be usno or spa');
  return{date:value.date,latitude:value.latitude,longitude:normalizeLongitude(value.longitude),timeZone:value.timeZone,
    fajrAngleDegrees,ishaAngleDegrees,asrShadowFactor,horizonDepressionDegrees,solarModel,formatter};
}

function localDateAt(epoch,formatter){
  const p=Object.fromEntries(formatter.formatToParts(epoch).map(part=>[part.type,part.value]));
  return`${p.year}-${p.month}-${p.day}`;
}

function apparentTransitOnUtcDate(utcDate,longitude,coordinates){
  const midnight=Date.parse(`${utcDate}T00:00:00Z`);
  let epoch=midnight+(12-longitude/15)*HOUR_MS;
  for(let i=0;i<12;i++)epoch=midnight+(12-longitude/15-coordinates(jd(epoch)).equationOfTimeHours)*HOUR_MS;
  const sun=coordinates(jd(epoch));
  const hourAngleHours=((epoch-midnight)/HOUR_MS+longitude/15+sun.equationOfTimeHours-12);
  return{epoch,declinationDegrees:sun.declination,equationOfTimeHours:sun.equationOfTimeHours,residualHours:hourAngleHours};
}

function anchoredTransit(date,longitude,formatter,coordinates){
  const day=Date.parse(`${date}T00:00:00Z`),found=[];
  for(let offset=-2;offset<=2;offset++){
    const utcDate=new Date(day+offset*DAY_MS).toISOString().slice(0,10);
    const transit=apparentTransitOnUtcDate(utcDate,longitude,coordinates);
    if(localDateAt(transit.epoch,formatter)===date&&found.every(item=>Math.abs(item.epoch-transit.epoch)>1))found.push(transit);
  }
  if(found.length===0)throw new RangeError(`No apparent solar transit belongs to civil date ${date} in ${formatter.resolvedOptions().timeZone}`);
  if(found.length!==1)throw new RangeError(`Ambiguous apparent solar transit for civil date ${date}`);
  return found[0];
}

function lowerMeridian(transitEpoch,longitude,direction,coordinates){
  // Solve local apparent hour angle −180°/+180°; solar-cycle bounds therefore
  // follow the changing equation of time rather than assuming exactly 24 hours.
  const targetCycles=direction/2;
  const residual=epoch=>{
    const eot=coordinates(jd(epoch)).equationOfTimeHours;
    const transitEot=coordinates(jd(transitEpoch)).equationOfTimeHours;
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

function selectCrossing(diagnostic,direction,thresholdDegrees,side,altitude){
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
    residualDegrees:altitude(root.epoch,diagnostic.latitude,diagnostic.longitude)-thresholdDegrees,diagnosticStatus:diagnostic.status};
}

function eventCrossing({startEpoch,endEpoch,transitEpoch,latitude,longitude,thresholdDegrees,direction,side,altitude}){
  const startEpochForSide=side==='before'?startEpoch:transitEpoch;
  const endEpochForSide=side==='before'?transitEpoch:endEpoch;
  const crossings=findLevelCrossings({startEpoch:startEpochForSide,endEpoch:endEpochForSide,
    valueAt:epoch=>altitude(epoch,latitude,longitude)-thresholdDegrees});
  crossings.transitEpoch=transitEpoch;crossings.latitude=latitude;crossings.longitude=longitude;
  return selectCrossing(crossings,direction,thresholdDegrees,side,altitude);
}

/**
 * Calculate one explicit local-point solar cycle with the selected coordinates.
 * Returned epochs are unrounded floating-point UTC milliseconds. This function
 * applies no Temkin, timezone offset arithmetic, terrain, elevation or fallback.
 */
export function calculateLocalSolarDay(input){
  const x=checkedInput(input),coordinateCache=new Map();
  const coordinates=x.solarModel==='usno'?solarCoordinatesUSNO:day=>{
    if(!coordinateCache.has(day))coordinateCache.set(day,solarCoordinatesSPA(day));
    return coordinateCache.get(day);
  };
  const altitude=x.solarModel==='usno'?solarAltitude:(epoch,latitude,longitude)=>{
    const sun=coordinates(jd(epoch)),utHours=((epoch%DAY_MS)+DAY_MS)%DAY_MS/HOUR_MS;
    const h=(utHours+longitude/15+sun.equationOfTimeHours-12)*15*RAD,phi=latitude*RAD,delta=sun.declination*RAD;
    return Math.asin(Math.max(-1,Math.min(1,Math.sin(phi)*Math.sin(delta)+Math.cos(phi)*Math.cos(delta)*Math.cos(h))))/RAD;
  };
  const transit=anchoredTransit(x.date,x.longitude,x.formatter,coordinates);
  const previous=lowerMeridian(transit.epoch,x.longitude,-1,coordinates),next=lowerMeridian(transit.epoch,x.longitude,1,coordinates);
  const sunAtTransit=coordinates(jd(transit.epoch));
  const noonAltitude=90-Math.abs(x.latitude-sunAtTransit.declination);
  const declinationDifference=Math.abs(x.latitude-sunAtTransit.declination);
  const asrDenominator=x.asrShadowFactor+Math.tan(declinationDifference*RAD);
  const asrAltitude=asrDenominator>0?Math.atan(1/asrDenominator)/RAD:NaN;
  const events={};
  events.fajr=eventCrossing({startEpoch:previous.epoch,endEpoch:transit.epoch,transitEpoch:transit.epoch,latitude:x.latitude,longitude:x.longitude,
    thresholdDegrees:-x.fajrAngleDegrees,direction:'rising',side:'before',altitude});
  events.sunrise=eventCrossing({startEpoch:previous.epoch,endEpoch:transit.epoch,transitEpoch:transit.epoch,latitude:x.latitude,longitude:x.longitude,
    thresholdDegrees:-x.horizonDepressionDegrees,direction:'rising',side:'before',altitude});
  events.dhuhr={status:'calculated',reason:null,epochMilliseconds:transit.epoch,thresholdDegrees:null,rootDirection:null,
    residualDegrees:null,diagnosticStatus:null};
  if(!(noonAltitude>0))events.asr=unavailable('sun-not-above-geometric-horizon-at-transit',asrAltitude);
  else if(!(asrDenominator>0)||!Number.isFinite(asrAltitude)||!(asrAltitude>0))events.asr=unavailable('nonphysical-asr-threshold',asrAltitude);
  else events.asr=eventCrossing({startEpoch:transit.epoch,endEpoch:next.epoch,transitEpoch:transit.epoch,latitude:x.latitude,longitude:x.longitude,
    thresholdDegrees:asrAltitude,direction:'setting',side:'after',altitude});
  events.maghrib=eventCrossing({startEpoch:transit.epoch,endEpoch:next.epoch,transitEpoch:transit.epoch,latitude:x.latitude,longitude:x.longitude,
    thresholdDegrees:-x.horizonDepressionDegrees,direction:'setting',side:'after',altitude});
  events.isha=eventCrossing({startEpoch:transit.epoch,endEpoch:next.epoch,transitEpoch:transit.epoch,latitude:x.latitude,longitude:x.longitude,
    thresholdDegrees:-x.ishaAngleDegrees,direction:'setting',side:'after',altitude});
  return{
    date:x.date,location:{latitude:x.latitude,longitude:x.longitude,timeZone:x.timeZone},
    model:{id:x.solarModel==='spa'?'SPA-continuous-point-v1':MODEL,
      coordinates:x.solarModel==='spa'?'SPA apparent geocentric solar coordinates with sidereal-time hour angle':'USNO approximate apparent geocentric solar coordinates',
      timeScale:x.solarModel==='spa'?{ut1MinusUtcSeconds:0,deltaTSeconds:69.184,convention:'fixed offline approximation, not a future Earth-orientation or leap-second prediction'}:null,
      horizon:x.horizonDepressionDegrees===50/60?'flat geometric horizon; −50 arcminutes encodes standard solar semidiameter/refraction convention':`flat geometric horizon; ${x.horizonDepressionDegrees}° depression`,
      horizonDepressionDegrees:x.horizonDepressionDegrees,observerElevationMetres:null,terrain:null,topocentricParallax:false,
      fajrAngleDegrees:x.fajrAngleDegrees,ishaAngleDegrees:x.ishaAngleDegrees,asrShadowFactor:x.asrShadowFactor,
      asrConvention:x.asrShadowFactor===1?'afternoon crossing of the factor-one shadow altitude computed from solar declination at transit'
        :'afternoon crossing of the factor-two shadow altitude computed from solar declination at transit',temkinApplied:false},
    solarCycle:{startEpochMilliseconds:previous.epoch,endEpochMilliseconds:next.epoch,
      startHourAngleResidualHours:previous.residualHours,endHourAngleResidualHours:next.residualHours},
    transit:{status:'calculated',epochMilliseconds:transit.epoch,localDate:x.date,declinationDegrees:sunAtTransit.declination,
      equationOfTimeHours:sunAtTransit.equationOfTimeHours,residualHourAngleHours:transit.residualHours,
      geometricAltitudeDegrees:noonAltitude,asrThresholdDegrees:Number.isFinite(asrAltitude)?asrAltitude:null},
    events:Object.fromEntries(EVENT_ORDER.map(name=>[name,events[name]])),
  };
}
