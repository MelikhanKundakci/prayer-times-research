import {compareDiyanetPointDay} from '../core/diagnostics/diyanet-comparison.mjs';
import {COMPARISON_EVENTS} from '../core/diagnostics/diyanet-comparison.mjs';

const usage='Usage: npm run compare:diyanet -- YYYY-MM-DD LATITUDE LONGITUDE IANA_TIME_ZONE [--json]';
const args=process.argv.slice(2);
if(args.length===1&&args[0]==='--help')console.log(usage);
else try{
  if(args.length<4||args.length>5||(args.length===5&&args[4]!=='--json'))throw new TypeError(usage);
  const [date,lat,lon,timeZone]=args;
  if(!lat.trim()||!lon.trim())throw new TypeError('Coordinates cannot be empty');
  const result=compareDiyanetPointDay({date,latitude:Number(lat),longitude:Number(lon),timeZone});
  if(args[4]==='--json')console.log(JSON.stringify(result,null,2));
  else{
    console.log(`Diyanet point model comparison · ${date} · ${timeZone}`);
    console.log(`Coordinates supplied for this run: ${lat}, ${lon}`);
    console.log(`Local: ${result.models.local.profileId} · ${result.models.local.astronomyProvider}`);
    console.log(`Calendar reconstruction: ${result.models.calendar.dateBasis} · ${result.models.calendar.solarModel} · ${result.models.calendar.route}`);
    console.log('Event     Local time/status/date             Calendar time/status/date          Δ pre-round s   Δ rounded min');
    for(const name of COMPARISON_EVENTS){
      const e=result.events[name],local=e.local,calendar=e.calendar;
      const l=`${local.time??'—'} / ${local.status} / ${local.calendarDate??'—'}`;
      const c=`${calendar.time??'—'} / ${calendar.status} / ${calendar.calendarDate??'—'}`;
      const roundedMinutes=e.roundedEpochDifferenceMilliseconds===null?null:e.roundedEpochDifferenceMilliseconds/60000;
      console.log(`${name.padEnd(10)}${l.padEnd(36)}${c.padEnd(36)}${e.rawDifferenceSeconds===null?'—':e.rawDifferenceSeconds.toFixed(3).padStart(12)}   ${roundedMinutes??'—'}`);
    }
    console.log(`Available on both: ${result.summary.pairedAvailable}; neither available: ${result.summary.pairedAbsent}; local only: ${result.summary.localOnly}; calendar only: ${result.summary.calendarOnly}`);
    console.log('These are offline model outputs, not official timetable values or observed prayer onsets. Differences use absolute UTC instants; no clock-only subtraction is used.');
  }
}catch(error){console.error(error.message);process.exitCode=1;}
