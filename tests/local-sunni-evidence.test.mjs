import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {listSunniProfiles,getSunniProfile} from '../core/local/sunni.mjs';
import {SUNNI_GRID_DECLARATION,SUNNI_GRID_DECLARATION_SHA256} from '../scripts/verify-sunni-grid.mjs';

const root=new URL('../',import.meta.url);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');

test('Sunni rule evidence resolves to the intended source without institutional equivalence claims',()=>{
  for(const definition of listSunniProfiles()){
    assert.equal(definition.official,false);
    assert.equal(definition.institutionalEquivalence,'not-claimed');
    for(const rule of Object.values(definition.events))for(const key of rule.sourceKeys)
      assert.match(definition.sources[key],/^https:\/\//,`${definition.id}: ${key}`);
  }
  const jakim=getSunniProfile('sunni-jakim-shadow1-physical-v1');
  assert.ok(jakim.events.asr.sourceKeys.includes('jakim'));
  assert.match(jakim.sources.jakim,/mufti\.pahang\.gov\.my/);
  assert.ok(jakim.events.maghrib.sourceKeys.includes('malaysiaHorizon'));
  assert.match(jakim.sources.malaysiaHorizon,/islam\.gov\.my/);
  assert.match(jakim.sources.malaysiaRounding,/muftiselangor\.gov\.my/);
  for(const family of ['mwl','karachi','isna'])
    assert.equal(getSunniProfile(`sunni-${family}-shadow1-physical-v1`).events.fajr.evidence,'software-convention');
});

test('Published Sunni invariant grid is tied to its declared cases and exact implementation',()=>{
  const report=JSON.parse(readFileSync(new URL('core/local/verification/sunni-grid-2026-09-27.json',root),'utf8'));
  assert.equal(report.status,'PASS');
  assert.deepEqual(report.declaration,SUNNI_GRID_DECLARATION);
  assert.equal(report.declarationSha256,SUNNI_GRID_DECLARATION_SHA256);
  assert.equal(report.runnerSha256,sha(readFileSync(new URL('scripts/verify-sunni-grid.mjs',root))));
  for(const pin of report.implementationPins)
    assert.equal(pin.sha256,sha(readFileSync(new URL(pin.path,root))),pin.path);
  for(const required of ['core/local/sunni.mjs','core/local/sunni-profiles.mjs','core/local/solar.mjs',
    'core/astronomy/spa-point.mjs','core/astronomy/spa-coefficients.json','core/timezones/manifest.json'])
    assert.ok(report.implementationPins.some(pin=>pin.path===required),required);
  assert.equal(report.accounting.annualCases,8);
  assert.equal(report.accounting.annualOwnedPointDays,2920);
  assert.equal(report.accounting.annualOwnedFields,17520);
  assert.equal(report.accounting.newVariants,23);
  assert.equal(report.accounting.boundaryCases,312);
  assert.equal(report.accounting.uniqueExpectedOwnershipRejections,22);
  assert.equal(report.annualReports.length,8);
  assert.equal(report.variants.length,23);
  assert.equal(report.boundaryReports.length,312);
  for(const annual of report.annualReports){
    assert.equal(annual.coverage.pointDays,365);
    assert.equal(annual.coverage.fields,2190);
    assert.equal(Object.values(annual.coverage.status).reduce((a,b)=>a+b,0),2190);
  }
});
