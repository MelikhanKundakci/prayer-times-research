// Numerical continuation only. No religious high-latitude replacement rule.
import {solarCoordinatesUSNO} from './solar-usno-v2.mjs';
import {solarCoordinatesNoaa} from './noaa-coordinates.mjs';
import {findLevelCrossings} from './continuous-solver.mjs';
const RAD=Math.PI/180,DAY=86400000,HOUR=3600000;
export function asrGeometry(epoch,{latitude,longitude,asrFactor,ephemeris}){
 if(![epoch,latitude,longitude,asrFactor].every(Number.isFinite)||Math.abs(latitude)>90||Math.abs(longitude)>180||![1,2].includes(asrFactor)||!['usno','noaa'].includes(ephemeris))throw new RangeError('Finite prescribed astronomical inputs required');
 const coordinates=ephemeris==='usno'?solarCoordinatesUSNO:solarCoordinatesNoaa;
 const solar=coordinates(epoch/DAY+2440587.5),utcHours=((epoch%DAY)+DAY)%DAY/HOUR;
 const ha=(utcHours+longitude/15+solar.equationOfTimeHours-12)*15*RAD;
 const sine=Math.sin(latitude*RAD)*Math.sin(solar.declination*RAD)+Math.cos(latitude*RAD)*Math.cos(solar.declination*RAD)*Math.cos(ha);
 const altitude=Math.asin(Math.max(-1,Math.min(1,sine)))/RAD;
 const margin=90-Math.abs(latitude-solar.declination),m=margin*RAD;
 // For margin>0: tan(zenith)=cot(margin). Multiplication by sin(margin)
 // gives the same target without a tan singularity at the polar boundary.
 // Else the finite value is used to search only, never emitted as an event.
 const continuedTarget=Math.atan2(Math.sin(m),Math.cos(m)+asrFactor*Math.sin(m))/RAD;
 return {altitude,margin,continuedTarget,residual:altitude-continuedTarget,physical:margin>0&&continuedTarget>0&&altitude>0};
}
export function findPhysicalAsr({transit,latitude,longitude,asrFactor,ephemeris}){
 const parameters={latitude,longitude,asrFactor,ephemeris},at=t=>asrGeometry(t,parameters);
 const initial=at(transit),end=transit+12*HOUR;
 if(initial.margin<=0||initial.altitude<=0)return {rawEpoch:null,reason:'no-positive-sun-height-at-transit',rejected:[],search:null};
 const search=findLevelCrossings({startEpoch:transit,endEpoch:end,valueAt:t=>at(t).residual});
 if(search.status==='unavailable')return {rawEpoch:null,reason:'nonfinite-asr-continuation',rejected:[],search};
 const setting=search.crossings.filter(c=>c.direction==='setting'&&c.epoch>=transit&&c.epoch<end);
 const physical=setting.filter(c=>at(c.epoch).physical),rejected=setting.filter(c=>!at(c.epoch).physical).map(c=>({...c,geometry:at(c.epoch)}));
 return {rawEpoch:physical.length===1?physical[0].epoch:null,reason:physical.length===1?null:physical.length>1?'multiple-physical-asr-crossings-not-resolved':'no-positive-physical-asr-crossing',rejected,search,atRoot:physical.length===1?at(physical[0].epoch):null};
}
export function solarTransit(carrierDate,longitude,ephemeris){
 const midnight=Date.parse(carrierDate+'T00:00:00Z');
 if(!Number.isFinite(midnight)||!Number.isFinite(longitude)||Math.abs(longitude)>180||!['usno','noaa'].includes(ephemeris))throw new RangeError('Valid carrier, longitude and engine required');
 const coordinates=ephemeris==='usno'?solarCoordinatesUSNO:solarCoordinatesNoaa;
 let transit=midnight+(12-longitude/15)*HOUR;
 for(let i=0;i<12;i++)transit=midnight+(12-longitude/15-coordinates(transit/DAY+2440587.5).equationOfTimeHours)*HOUR;
 return transit;
}
