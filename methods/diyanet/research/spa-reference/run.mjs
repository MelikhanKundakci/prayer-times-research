import {calculateCalendar,EVENTS,ADJUSTMENTS} from './calendar.mjs';
const [date,lat,lon,timeZone,solarModel,...extra]=process.argv.slice(2);
if(extra.length||!/^20\d{2}-\d{2}-\d{2}$/.test(date??''))throw new Error('Usage: run.mjs YYYY-MM-DD latitude longitude IANA-zone baseline|spa-utc00');
const requested=Date.parse(date+'T00:00:00Z');
if(!Number.isFinite(requested)||new Date(requested).toISOString().slice(0,10)!==date)throw new RangeError('Valid Gregorian date required');
const result=calculateCalendar({year:Number(date.slice(0,4)),latitude:Number(lat),longitude:Number(lon),timeZone},solarModel);
const day=result.annual.days.find(d=>d.date===date);
if(!day)throw new Error('Requested date unavailable');
const events=Object.fromEntries(EVENTS.map((name,index)=>{
  const e=day.events[name],adjusted=e.rawEpoch===null?null:e.rawEpoch+(result.route==='north'?0:ADJUSTMENTS[index]*60000);
  return[name,{rawAdjustedUtc:adjusted===null?null:new Date(adjusted).toISOString(),roundedUtc:e.utc,
    localDate:e.localDate??e.date??null,clock:e.time,status:e.status}];
}));
console.log(JSON.stringify({experiment:'SPA daily-coordinate substitution',solarModel:result.solarModel,
  official:false,notificationEligible:false,sourceIndependent:true,route:result.route,
  location:{latitude:Number(lat),longitude:Number(lon),timeZone},date,
  solarCarrierDate:day.solarCalculationDate,timeConvention:result.timeConvention,events},null,2));
