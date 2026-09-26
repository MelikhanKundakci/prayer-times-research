import {calculateLocalDay,LOCAL_EVENTS,LOCAL_PROFILE} from '../core/local/index.mjs';

const usage=`Usage: npm run calculate:local -- YYYY-MM-DD LATITUDE LONGITUDE IANA_TIME_ZONE ${LOCAL_PROFILE} [--json]`;
const args=process.argv.slice(2);
if(args.length===1&&args[0]==='--help')console.log(usage);
else{
  try{
    if(args.length<5||args.length>6||(args.length===6&&args[5]!=='--json'))throw new TypeError(usage);
    const [date,lat,lon,timeZone,profile]=args;
    if(!lat.trim()||!lon.trim())throw new TypeError('Coordinates cannot be empty');
    const result=calculateLocalDay({date,latitude:Number(lat),longitude:Number(lon),timeZone,profile});
    if(args[5]==='--json')console.log(JSON.stringify(result,null,2));
    else{
      console.log(`Local point calculation · ${date} · ${timeZone}`);
      console.log(`Point: ${lat}, ${lon} · ${profile}`);
      console.log('Event     Minute  Model seconds  Status');
      for(const name of LOCAL_EVENTS){const e=result.events[name];
        console.log(`${name.padEnd(10)}${(e.time??'—').padEnd(8)}${(e.seconds??'—').padEnd(15)}${e.status}${e.reason?` · ${e.reason}`:''}`);
      }
      console.log('Level-horizon model with published margins; seconds are model precision.');
      console.log('Blocked or unavailable events have no selected prayer time.');
    }
  }catch(error){console.error(error.message);process.exitCode=1;}
}
