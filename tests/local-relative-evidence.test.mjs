import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {LOCAL_RELATIVE_PROFILES} from '../core/local/sunni-relative.mjs';
import {verifiedBundle} from '../core/timezones/bundle.mjs';
import {buildReport} from '../scripts/oss-relative/report.mjs';

const root=new URL('../',import.meta.url),hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=path=>readFile(new URL(path,root));

test('annual local-relative evidence is pinned to numerical code and verifies its declared coverage',async()=>{
  const r=JSON.parse(await read('core/local/verification/local-relative-2026-09-27.json'));
  assert.equal(r.result,'PASS');assert.match(r.limits,/not official-calendar/);
  assert.deepEqual(r.profiles,LOCAL_RELATIVE_PROFILES);assert.deepEqual(r.years,[2026,2027,2028]);
  assert.equal(r.runtime.node,'v26.7.0');assert.equal(r.runtime.tzdb,verifiedBundle().version);
  assert.equal(r.runnerSha256,hash(await read('scripts/verify-local-relative.mjs')));
  assert.equal(r.analyzerSha256,hash(await read('scripts/oss-relative/analyze.mjs')));
  assert.ok(Object.hasOwn(r.dependencies,'core/local/sunni-relative.mjs'));
  assert.ok(Object.hasOwn(r.dependencies,'core/local/local-relative-policy.mjs'));
  for(const [path,expected] of Object.entries(r.dependencies))assert.equal(hash(await read(path)),expected,`${path}: replay annual evidence after numerical changes`);
  const s=r.statistics;
  assert.equal(s.days,13152);assert.equal(s.estimated,4958);assert.equal(s.independentEstimateChecks,s.estimated);
  assert.equal(s.independentAnnualChecks,16);assert.equal(s.maxArithmeticErrorMilliseconds,0);
  assert.equal(s.estimatedTransitionPairs,5014);assert.equal(s.maxEstimatedStepMilliseconds,300000);
  assert.equal(s.scheduleChecks,36);assert.equal(s.nonTwilightComparisons,1728);
  for(const profile of LOCAL_RELATIVE_PROFILES){
    const a=r.profileReports[profile];assert.equal(a.plannedDays,6576);assert.equal(a.suppliedRows,a.plannedDays);
    for(const g of a.groups){
      assert.equal(g.absentRows,0);assert.equal(g.withinDayOrderViolations,0);assert.equal(g.crossNightViolations,0);
      if(g.city==='tromso'){assert.ok(g.completeDays<g.plannedDays);continue;}
      assert.equal(g.completeDays,g.plannedDays);
      for(const event of ['fajr','isha'])assert.equal(g.changes[event].overTenMinutes,0);
    }
  }
  const guide=(await read('core/local/LOCAL-RELATIVE.md')).toString();
  assert.ok(guide.includes('13,152 profile-days'));assert.ok(guide.includes('5,014 adjacent pairs'));
});

test('retained OSS behavior evidence replays exactly, including failed dates and chronology defects',async()=>{
  const r=JSON.parse(await read('core/local/verification/oss-relative-2026-09-27.json'));
  assert.deepEqual(await buildReport(),r);
  const expected=[['go-prayer-v1.1.1',6576,5906,0],['mawaqit-v0.5.0',6576,5480,85],['mawaqit-v0.4.0',2190,1825,27]];
  for(const [id,days,complete,order] of expected){
    const a=r.implementations.find(p=>p.id===id).analysis;
    assert.equal(a.plannedDays,days);assert.equal(a.suppliedRows,days);
    assert.equal(a.groups.reduce((n,g)=>n+g.completeDays,0),complete);
    assert.equal(a.groups.reduce((n,g)=>n+g.withinDayOrderViolations,0),order);
    assert.equal(a.groups.reduce((n,g)=>n+g.absentRows,0),0);
  }
  const rust=r.implementations.find(p=>p.id==='mawaqit-v0.5.0').analysis.groups;
  const oslo=rust.find(g=>g.city==='oslo'&&g.year===2027);
  assert.equal(oslo.changes.fajr.maximumAbsoluteSeconds,5264);
  assert.equal(oslo.changes.isha.maximumAbsoluteSeconds,6101);
  const frankfurt=rust.find(g=>g.city==='frankfurt'&&g.year===2027);
  assert.equal(frankfurt.changes.fajr.maximumAbsoluteSeconds,86700);
  assert.equal(frankfurt.withinDayOrderViolations,3);
});
