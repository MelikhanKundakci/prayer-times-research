import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {calculateRelativeDay,calculateRelativeSchedule,LOCAL_RELATIVE_PROFILES} from '../core/local/sunni-relative.mjs';
import {calculateSunniDay} from '../core/local/sunni.mjs';
import {calculateLocalSolarDay} from '../core/local/solar.mjs';
import {verifiedBundle} from '../core/timezones/bundle.mjs';
import {POINTS,EVENTS,datesInYear,analyzeRows} from './oss-relative/analyze.mjs';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..'),DAY=86400000,MINUTE=60000;
const years=[2026,2027,2028],rows=[],stats={days:0,estimated:0,blocked:0,unavailable:0,nonTwilightComparisons:0,unchangedPhysicalTwilight:0,
  independentEstimateChecks:0,independentAnnualChecks:0,maxArithmeticErrorMilliseconds:0,estimatedTransitionPairs:0,maxEstimatedStepMilliseconds:0,scheduleChecks:0};
const midnight=date=>Date.parse(date+'T00:00:00Z');
const offset=(date,n)=>new Date(midnight(date)+n*DAY).toISOString().slice(0,10);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
async function closure(entry){
  const pending=[resolve(ROOT,entry)],files=new Map();
  while(pending.length){const path=pending.pop();if(files.has(path))continue;const bytes=await readFile(path);files.set(path,sha(bytes));
    for(const match of bytes.toString().matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g))pending.push(resolve(dirname(path),match[1]));}
  return Object.fromEntries([...files].sort().map(([path,hash])=>[path.slice(ROOT.length+1),hash]));
}
const hashes=await closure('core/local/sunni-relative.mjs'),started=Date.now();
for(const point of POINTS){
  const location={latitude:point.latitude,longitude:point.longitude,timeZone:point.timeZone};
  const raw=new Map(),dayResults=[],annual=new Map();
  const getRaw=date=>{
    if(!raw.has(date))raw.set(date,calculateLocalSolarDay({date,...location,fajrAngleDegrees:18,ishaAngleDegrees:17,asrShadowFactor:1,horizonDepressionDegrees:50/60,solarModel:'spa'}).events);
    return raw.get(date);
  };
  const epoch=(date,name)=>{const e=getRaw(date)[name];return e.status==='calculated'?e.epochMilliseconds:null;};
  function ordinary(date,name){
    const current=epoch(date,name);if(current===null)return false;
    return[-1,1].every(n=>{const adjacent=offset(date,n),neighbor=epoch(adjacent,name);return neighbor===null||Math.abs((current-midnight(date))-(neighbor-midnight(adjacent)))<=10*MINUTE;});
  }
  function independentMean(year){
    if(annual.has(year))return annual.get(year);
    let total=0,count=0;
    for(const date of datesInYear(year))if(ordinary(date,'isha')){
      const i=epoch(date,'isha'),s=epoch(date,'maghrib'),r=epoch(offset(date,1),'sunrise');
      if([i,s,r].every(Number.isFinite)&&s<i&&i<r&&r-s<DAY){total+=(i-s)/(r-s);count++;}
    }
    const value={fraction:total/count,count};assert.ok(count>0&&Number.isFinite(value.fraction));annual.set(year,value);stats.independentAnnualChecks++;return value;
  }
  for(const profile of LOCAL_RELATIVE_PROFILES)for(const year of years){
    const factor=Number(profile.match(/shadow([12])/)[1]);
    for(const date of datesInYear(year)){
      const day=calculateRelativeDay({date,...location,profile});stats.days++;
      raw.set(date,day.astronomy.events);dayResults.push({day,profile});
      for(const name of EVENTS){const e=day.events[name];
        if(e.status==='estimated')stats.estimated++;if(e.status==='policy-blocked')stats.blocked++;if(e.status==='unavailable')stats.unavailable++;
        if(['fajr','isha'].includes(name)&&e.status==='calculated'){
          assert.equal(e.rawEpochMilliseconds,day.astronomy.events[name].epochMilliseconds);stats.unchangedPhysicalTwilight++;
        }
      }
      // Compare unchanged events with the independently requested physical API each month.
      if(date.endsWith('-15')){
        const base=calculateSunniDay({date,...location,profile:`sunni-mwl-shadow${factor}-physical-v1`});
        for(const name of ['sunrise','dhuhr','asr','maghrib']){assert.deepEqual(day.events[name],base.events[name]);stats.nonTwilightComparisons++;}
      }
      rows.push({city:point.id,date,profile,events:Object.fromEntries(EVENTS.map(name=>[name,day.events[name].utc])),
        statuses:Object.fromEntries(EVENTS.map(name=>[name,day.events[name].status])),error:null});
    }
    const schedule=calculateRelativeSchedule({startDate:`${year}-06-15`,dayCount:10,...location,profile});
    for(let i=1;i<schedule.entries.length;i++)assert.ok(schedule.entries[i-1].epochMilliseconds<schedule.entries[i].epochMilliseconds);
    stats.scheduleChecks++;
    process.stderr.write(`${point.id} ${year} Asr ${factor} complete\n`);
  }
  // Independently reconstruct the annual mean, target and both ramp bounds from raw astronomy.
  for(const {day} of dayResults)for(const name of ['fajr','isha']){
    const e=day.events[name];if(e.status!=='estimated')continue;
    assert.equal(ordinary(day.date,name),false);
    const t=e.selection,segment=t.segment,m=independentMean(segment.meanYear);
    assert.ok(Math.abs(m.fraction-segment.annualRatio.fraction)<1e-12);
    assert.equal(m.count,segment.annualRatio.eligibleDays);
    const s=epoch(name==='fajr'?offset(day.date,-1):day.date,'maghrib');
    const r=epoch(name==='isha'?offset(day.date,1):day.date,'sunrise');
    assert.ok([s,r].every(Number.isFinite)&&r>s&&r-s<DAY);
    const candidate=name==='isha'?s+m.fraction*(r-s):r-m.fraction*(r-s);
    const left=segment.leftAnchor,right=segment.rightAnchor;
    assert.ok(ordinary(left.date,name)&&ordinary(right.date,name));
    const a=epoch(left.date,name)-midnight(left.date),b=epoch(right.date,name)-midnight(right.date);
    const direction=name==='isha'?-1:1,k=(midnight(day.date)-midnight(left.date))/DAY,n=(midnight(right.date)-midnight(day.date))/DAY;
    const leftRamp=a+direction*k*5*MINUTE,rightRamp=b+direction*n*5*MINUTE;
    const expected=(name==='isha'?Math.max:Math.min)(candidate-midnight(day.date),leftRamp,rightRamp)+midnight(day.date);
    const error=Math.abs(expected-e.rawEpochMilliseconds);assert.ok(error<=.001);stats.independentEstimateChecks++;
    stats.maxArithmeticErrorMilliseconds=Math.max(stats.maxArithmeticErrorMilliseconds,error);
    assert.ok(s<expected&&expected<r);assert.equal(e.ruleEvidence.classification,'software-estimate');
  }
  for(const profile of LOCAL_RELATIVE_PROFILES){
    const series=dayResults.filter(x=>x.profile===profile).map(x=>x.day).sort((a,b)=>a.date.localeCompare(b.date));
    for(let i=1;i<series.length;i++)for(const name of ['fajr','isha']){
      const previous=series[i-1],current=series[i],a=previous.events[name],b=current.events[name];
      if((a.status==='estimated'||b.status==='estimated')&&Number.isFinite(a.rawEpochMilliseconds)&&Number.isFinite(b.rawEpochMilliseconds)){
        const step=Math.abs((b.rawEpochMilliseconds-midnight(current.date))-(a.rawEpochMilliseconds-midnight(previous.date)));
        assert.ok(step<=5*MINUTE+.001,`${point.id}/${profile}/${current.date}/${name}: transition ${step}`);
        stats.estimatedTransitionPairs++;stats.maxEstimatedStepMilliseconds=Math.max(stats.maxEstimatedStepMilliseconds,step);
      }
    }
  }
}
assert.deepEqual(await closure('core/local/sunni-relative.mjs'),hashes,'Numerical code changed during verification');
const profileReports=Object.fromEntries(LOCAL_RELATIVE_PROFILES.map(profile=>[profile,analyzeRows(rows.filter(row=>row.profile===profile))]));
for(const report of Object.values(profileReports))for(const group of report.groups){
  assert.equal(group.absentRows,0);assert.equal(group.withinDayOrderViolations,0);assert.equal(group.crossNightViolations,0);
  if(group.city!=='tromso'){assert.equal(group.completeDays,group.plannedDays,`${group.city}/${group.year}: incomplete local series`);
    for(const name of ['fajr','isha'])assert.equal(group.changes[name].overTenMinutes,0);}
}
const report={result:'PASS',limits:'Implementation and behavior verification only; not official-calendar or observed prayer-time accuracy.',
  years,points:POINTS,profiles:LOCAL_RELATIVE_PROFILES,statistics:stats,profileReports,
  runtime:{node:process.version,icu:process.versions.icu,tzdb:process.versions.tz,expectedTzdb:verifiedBundle().version},
  dependencies:hashes,runnerSha256:sha(await readFile(fileURLToPath(import.meta.url))),analyzerSha256:sha(await readFile(resolve(ROOT,'scripts/oss-relative/analyze.mjs'))),
  elapsedMilliseconds:Date.now()-started};
assert.equal(report.runtime.tzdb,report.runtime.expectedTzdb);
const rowsPath=process.argv[2]??'/tmp/namaz-local-relative-2026-2028.jsonl';
await writeFile(rowsPath,rows.map(row=>JSON.stringify(row)).join('\n')+'\n');
await writeFile(resolve(ROOT,'core/local/verification/local-relative-2026-09-27.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({result:report.result,statistics:stats,elapsedMilliseconds:report.elapsedMilliseconds}));
