import {createDiyanetCalculator, EVENTS} from '../core/diyanet/index.mjs';

const usage='Usage: npm run calculate:diyanet -- YYYY-MM-DD LATITUDE LONGITUDE IANA_TIME_ZONE [--json]';
const args=process.argv.slice(2);
if(args.length===1&&args[0]==='--help')console.log(usage);
else {
  try {
    if(!(args.length===4||args.length===5&&args[4]==='--json'))throw new TypeError(usage);
    const [date,lat,lon,timeZone]=args;
    if(!lat.trim()||!lon.trim())throw new TypeError('Coordinates cannot be empty');
    const result=createDiyanetCalculator().calculateDay({date,latitude:Number(lat),longitude:Number(lon),timeZone});
    if(args[4]==='--json')console.log(JSON.stringify(result,null,2));
    else {
      console.log(`Diyanet reconstruction · ${date} · ${timeZone}`);
      console.log(`Point: ${lat}, ${lon} · ${result.calculation.route}`);
      console.log('Event     Minute  Model seconds  Actual local date');
      for(const name of EVENTS){const e=result.events[name];
        console.log(`${name.padEnd(10)}${(e.time??'—').padEnd(8)}${(e.seconds??'—').padEnd(15)}${e.secondsDate??'unavailable'}${e.estimated?' · estimated rule':''}`);
      }
      console.log('Seconds describe the model; official Diyanet equivalence is not established.');
      if(result.qualityFlags.length)console.log(`Quality flags: ${JSON.stringify(result.qualityFlags)}`);
    }
  }catch(error){console.error(error.message);process.exitCode=1;}
}
