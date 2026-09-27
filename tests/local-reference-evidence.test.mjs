import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {LOCAL_REFERENCE_PROFILES} from '../core/local/sunni-reference.mjs';
import {verifiedBundle} from '../core/timezones/bundle.mjs';

const root=new URL('../',import.meta.url);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');

test('published reference-night coverage evidence matches its implementation and verification runner',async()=>{
  const report=JSON.parse(await readFile(new URL('core/local/verification/reference45-2026-09-27.json',root),'utf8'));
  assert.equal(report.result,'PASS');
  assert.deepEqual(report.profiles,LOCAL_REFERENCE_PROFILES);
  assert.match(report.limits,/Not an observed-accuracy/);
  assert.equal(report.annual.plannedProfileDays,7300);
  assert.equal(report.annual.plannedEventRows,43800);
  assert.equal(report.boundary.plannedRows,192);
  assert.equal(report.schedules.calls,20);
  assert.equal(report.timezoneRuntime.node,'v26.7.0');
  assert.equal(report.timezoneRuntime.tzdb,verifiedBundle().version);
  assert.equal(report.timezoneRuntime.timezoneManifestSha256,hash(await readFile(new URL('core/timezones/manifest.json',root))));
  assert.equal(report.runnerSha256,hash(await readFile(new URL('scripts/verify-reference45.mjs',root))));
  assert.deepEqual(Object.keys(report.annual.summaries),LOCAL_REFERENCE_PROFILES);
  assert.equal(report.boundary.checks.length,192);
  assert.equal(report.schedules.checks.length,20);
  assert.ok(Object.keys(report.dependencies).includes('core/local/sunni-reference.mjs'));
  for(const [path,expected] of Object.entries(report.dependencies))
    assert.equal(hash(await readFile(new URL(path,root))),expected,`${path}: published report must be replayed after numerical changes`);
  for(const [profile,stats] of Object.entries(report.annual.summaries)){
    assert.equal(stats.plannedDays,1825,profile);
    assert.equal(stats.calculated+stats.estimated+stats.unavailable+stats.policyBlocked,stats.events,profile);
    assert.equal(stats.nonTwilightBitIdentical,1825*4,profile);
    assert.equal(stats.physicalTwilightBitIdentical+stats.rawTwilightMissing,1825*2,profile);
    assert.equal(stats.independentEstimateChecks,stats.estimated,profile);
    assert.equal(stats.crossNightChecks,5*364,profile);
    assert.ok(Number.isFinite(stats.maxEstimateArithmeticErrorMilliseconds)&&stats.maxEstimateArithmeticErrorMilliseconds<=1,profile);
    assert.ok(stats.referenceFractionRange.every(Number.isFinite),profile);
  }
  const guide=await readFile(new URL('core/local/REFERENCE45.md',root),'utf8');
  const points=[['frankfurt','Frankfurt',323,305],['berlin','Berlin',296,283],
    ['edinburgh','Edinburgh',269,259],['oslo','Oslo',244,235],['ushuaia','Ushuaia',283,273]];
  for(const [id,label,mwl,egyptian] of points){
    for(const family of ['mwl','egyptian'])for(const factor of [1,2]){
      const row=report.annual.summaries[`sunni-${family}-shadow${factor}-reference45-v1`].perPoint.find(p=>p.point===id);
      assert.equal(row.days,365);assert.equal(row.completeDays,365);
      assert.equal(row.basePhysicalCompleteDays,family==='mwl'?mwl:egyptian);
    }
    assert.ok(guide.includes(`| ${label} | ${mwl} / 365 | 365 / 365 | ${egyptian} / 365 | 365 / 365 |`));
  }
  assert.equal(Object.values(report.annual.summaries).reduce((total,stats)=>total+stats.estimated,0),3268);
  assert.ok(guide.includes('3,268 estimated event fields'));
  for(const [family,from,to,delta,text] of [
    ['mwl','2027-04-22','2027-04-23',9214277,'2 h 33 min 34 s'],
    ['egyptian','2027-08-25','2027-08-26',-9703858,'2 h 41 min 44 s'],
  ]){
    for(const factor of [1,2]){
      const stats=report.annual.summaries[`sunni-${family}-shadow${factor}-reference45-v1`];
      assert.equal(stats.transitionWitness.point,'oslo');
      assert.equal(stats.transitionWitness.from,from);assert.equal(stats.transitionWitness.to,to);
      assert.ok(Math.abs(stats.transitionWitness.changeMilliseconds-delta)<=1);
      assert.ok(Math.abs(stats.maxAdjacentNormalizedChangeInvolvingEstimateMilliseconds-Math.abs(delta))<=1);
    }
    assert.ok(guide.includes(text));
  }
});
