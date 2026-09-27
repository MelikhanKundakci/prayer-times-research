import {calculateLocalDay,LOCAL_EVENTS,LOCAL_PROFILES,listLocalProfiles} from '../core/local/index.mjs';
import {calculateObserverDay,LOCAL_OBSERVER_PROFILES,listObserverProfiles} from '../core/local/observer.mjs';
import {calculateSunniDay,LOCAL_SUNNI_PROFILES,listSunniProfiles} from '../core/local/sunni.mjs';

const usage=`Usage: npm run calculate:local -- YYYY-MM-DD LATITUDE LONGITUDE IANA_TIME_ZONE ${[...LOCAL_PROFILES,...LOCAL_OBSERVER_PROFILES,...LOCAL_SUNNI_PROFILES].join('|')} [--json]`;
const args=process.argv.slice(2);
if(args.length===1&&args[0]==='--help')console.log(usage+'\nList documented profiles with --profiles');
else if(args.length===1&&args[0]==='--profiles'){
  for(const profile of [...listLocalProfiles(),...listObserverProfiles(),...listSunniProfiles()])console.log(`${profile.id} · ${profile.label}`);
}
else{
  try{
    if(args.length<5||args.length>6||(args.length===6&&args[5]!=='--json'))throw new TypeError(usage);
    const [date,lat,lon,timeZone,profile]=args;
    if(!lat.trim()||!lon.trim())throw new TypeError('Coordinates cannot be empty');
    const calculate=LOCAL_SUNNI_PROFILES.includes(profile)?calculateSunniDay:LOCAL_OBSERVER_PROFILES.includes(profile)?calculateObserverDay:calculateLocalDay;
    const result=calculate({date,latitude:Number(lat),longitude:Number(lon),timeZone,profile});
    if(args[5]==='--json')console.log(JSON.stringify(result,null,2));
    else{
      console.log(`Local point calculation · ${date} · ${timeZone}`);
      console.log(`Point: ${lat}, ${lon} · ${profile}`);
      console.log('Event     Minute  Model seconds  Status / role');
      for(const name of LOCAL_EVENTS){const e=result.events[name];
        console.log(`${name.padEnd(10)}${(e.time??'—').padEnd(8)}${(e.seconds??'—').padEnd(15)}${e.status} / ${e.role}${e.reason?` · ${e.reason}`:''}`);
      }
      console.log('Named local model with declared rules; seconds are model precision where provided.');
      if(!result.coverage.prayerStartsComplete)console.log('A complete set of five prayer-start models is not available; geometric markers are labeled separately.');
      console.log('Estimated events follow the named local policy; they are not observed signs or an official timetable.');
      console.log('Blocked or unavailable events have no selected prayer time.');
    }
  }catch(error){console.error(error.message);process.exitCode=1;}
}
