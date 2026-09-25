import {solarCoordinatesUSNO} from '../../../core/astronomy/solar-usno-v2.mjs';
import {solarCoordinatesNoaa} from '../../../core/astronomy/noaa-coordinates.mjs';
import {findLevelCrossings} from '../../../core/astronomy/continuous-solver.mjs';
const DAY=86400000,HOUR=3600000,RAD=Math.PI/180;
export class CivilDayError extends RangeError {constructor(reason){super(reason);this.reason=reason;}}
const cache=new Map(); // Bounded ephemeral geometry cache, never reference values.
const formatter=timeZone=>new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
export function partsAt(epoch,fmt){return Object.fromEntries(fmt.formatToParts(epoch).map(p=>[p.type,p.value]));}
export function localDateAt(epoch,fmt){const p=partsAt(epoch,fmt);return`${p.year}-${p.month}-${p.day}`;}

function civilBounds(date,fmt){
 const middle=Date.parse(date+'T00:00:00Z'),first=middle-36*HOUR,last=middle+36*HOUR,step=15*60000;
 const runs=[];let start=null,previous=first,inside=localDateAt(first,fmt)===date;
 if(inside)throw new CivilDayError('civil-day-search-boundary-insufficient');
 const boundary=(left,right,targetInside)=>{while(right-left>1){const m=Math.floor((left+right)/2);if((localDateAt(m,fmt)===date)===targetInside)right=m;else left=m;}return right;};
 for(let epoch=first+step;epoch<=last;epoch+=step){
  const now=localDateAt(epoch,fmt)===date;
  if(now&&!inside)start=boundary(previous,epoch,true);
  if(!now&&inside){runs.push({startEpoch:start,endEpoch:boundary(previous,epoch,false)});start=null;}
  inside=now;previous=epoch;
 }
 if(inside)throw new CivilDayError('civil-day-search-boundary-insufficient');
 if(runs.length===0)throw new CivilDayError('civil-date-does-not-exist');
 if(runs.length!==1)throw new CivilDayError('discontinuous-civil-date-unsupported');
 const b=runs[0];if(b.endEpoch-b.startEpoch>2*DAY)throw new CivilDayError('civil-day-longer-than-supported-solver');
 return b;
}

export function geometryDay({date,latitude,longitude,timeZone,engine}){
 const key=JSON.stringify([date,latitude,longitude,timeZone,engine]);if(cache.has(key))return cache.get(key);
 const coordinates=engine==='usno'?solarCoordinatesUSNO:solarCoordinatesNoaa,fmt=formatter(timeZone),bounds=civilBounds(date,fmt);
 let carrier=Date.parse(date+'T00:00:00Z'),transit;
 for(let attempt=0;attempt<5;attempt++){
  transit=carrier+(12-longitude/15)*HOUR;
  for(let i=0;i<12;i++)transit=carrier+(12-longitude/15-coordinates(transit/DAY+2440587.5).equationOfTimeHours)*HOUR;
  const actual=localDateAt(transit,fmt);if(actual===date)break;
  carrier+=Date.parse(date+'T00:00:00Z')-Date.parse(actual+'T00:00:00Z');
 }
 if(transit<bounds.startEpoch||transit>=bounds.endEpoch||localDateAt(transit,fmt)!==date)throw new CivilDayError('solar-transit-cannot-anchor-civil-date');
 const upperAt=dayCarrier=>{let t=dayCarrier+(12-longitude/15)*HOUR;for(let i=0;i<12;i++)t=dayCarrier+(12-longitude/15-coordinates(t/DAY+2440587.5).equationOfTimeHours)*HOUR;return t;};
 const previousTransit=upperAt(carrier-DAY),nextTransit=upperAt(carrier+DAY);
 const samples=new Map(),levels=new Map();
 const altitudeAt=epoch=>{
  if(samples.has(epoch))return samples.get(epoch);
  const s=coordinates(epoch/DAY+2440587.5),ut=((epoch%DAY)+DAY)%DAY/HOUR,h=(ut+longitude/15+s.equationOfTimeHours-12)*15*RAD;
  const sine=Math.sin(latitude*RAD)*Math.sin(s.declination*RAD)+Math.cos(latitude*RAD)*Math.cos(s.declination*RAD)*Math.cos(h);
  const altitude=Math.asin(Math.max(-1,Math.min(1,sine)))/RAD;samples.set(epoch,altitude);return altitude;
 };
 const crossing=(threshold,direction)=>{
  if(Math.abs(latitude)===90)return{epoch:null,reason:'geographic-pole-has-no-daily-solar-cycle',diagnostic:{thresholdDegrees:threshold,direction,solverStatus:'unsupported-solar-cycle',crossings:0,tangencies:0}};
  const levelKey=JSON.stringify([threshold,direction]);
  const interval=direction==='rising'?{startEpoch:previousTransit,endEpoch:transit}:{startEpoch:transit,endEpoch:nextTransit};
  if(!levels.has(levelKey))levels.set(levelKey,findLevelCrossings({...interval,valueAt:epoch=>altitudeAt(epoch)-threshold}));
  const d=levels.get(levelKey),matches=d.crossings.filter(c=>c.direction===direction);
  const diagnostic={thresholdDegrees:threshold,direction,solverStatus:d.status,crossings:matches.length,tangencies:d.tangencies.length,searchStartUtc:new Date(interval.startEpoch).toISOString(),searchEndUtc:new Date(interval.endEpoch).toISOString()};
  if(matches.length!==1)return{epoch:null,reason:matches.length>1?'multiple-directional-crossings-in-solar-cycle':d.status==='crossings'?'no-required-direction-in-solar-cycle':d.status,diagnostic};
  return{epoch:matches[0].epoch,reason:null,diagnostic};
 };
 const result={date,formatter:fmt,bounds,transit:Math.abs(latitude)===90?null:transit,transitUnavailableReason:Math.abs(latitude)===90?'geographic-pole-has-no-unique-local-meridian':null,transitAltitudeDegrees:altitudeAt(transit),altitudeAt,crossing};
 cache.set(key,result);while(cache.size>24)cache.delete(cache.keys().next().value);return result;
}
