import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {calculateLocalDay} from '../index.mjs';

const plan=Object.freeze([
  {id:'frankfurt-2028',year:2028,latitude:50.1109,longitude:8.6821,timeZone:'Europe/Berlin'},
  {id:'oslo-2027',year:2027,latitude:59.9139,longitude:10.7522,timeZone:'Europe/Oslo'},
  {id:'new-york-2027',year:2027,latitude:40.7128,longitude:-74.006,timeZone:'America/New_York'},
  {id:'sydney-2027',year:2027,latitude:-33.8688,longitude:151.2093,timeZone:'Australia/Sydney'},
]);
/** Predeclared annual output/chronology check, not an observed-accuracy test. */
export function verifyUsableAnnualGrid(onProgress=()=>{}){
  const profile='local-18-17-shadow1-angle-night-v1',summaries=[];
  for(const point of plan){
    const summary={id:point.id,days:0,completeDays:0,estimatedFajr:0,estimatedIsha:0,crossNightChecks:0};
    let previous=null;
    const first=Date.UTC(point.year,0,1),last=Date.UTC(point.year+1,0,1);
    for(let epoch=first-86400000;epoch<=last;epoch+=86400000){
      const date=new Date(epoch).toISOString().slice(0,10);
      const day=calculateLocalDay({date,latitude:point.latitude,longitude:point.longitude,timeZone:point.timeZone,profile});
      assert.equal(day.coverage.prayerStartsComplete,true,`${point.id}/${date}`);
      let earlier=null;
      for(const name of ['fajr','sunrise','dhuhr','asr','maghrib','isha']){
        const current=day.events[name].epochMilliseconds;
        assert.ok(Number.isFinite(current));if(earlier!==null)assert.ok(earlier<current,`${point.id}/${date}/${name}`);earlier=current;
      }
      if(previous){assert.ok(previous.events.isha.epochMilliseconds<day.events.fajr.epochMilliseconds,`${point.id}/${date}/cross-night`);summary.crossNightChecks++;}
      if(epoch>=first&&epoch<last){summary.days++;summary.completeDays++;for(const name of ['fajr','isha'])if(day.events[name].status==='estimated')summary[name==='fajr'?'estimatedFajr':'estimatedIsha']++;}
      previous=day;
    }
    summaries.push(summary);onProgress(summary);
  }
  assert.equal(summaries.reduce((sum,p)=>sum+p.days,0),1461);
  return{result:'PASS',profile,meaning:'Complete five-prayer outputs and dated chronology under the selected composition; not observed timing accuracy or institutional agreement',summaries};
}
if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
  const result=verifyUsableAnnualGrid(item=>console.error(`${item.id}: ${item.completeDays}/${item.days} complete`));
  console.log(JSON.stringify(result,null,2));
}
