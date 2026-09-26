import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {DIYANET_SPA_GRID,DIYANET_SPA_DECLARATION_SHA256} from '../core/local/verification/diyanet-spa-compare.mjs';
import {verifyDiyanetSPAReference} from '../core/local/verification/diyanet-spa-reference-verify.mjs';

test('Diyanet SPA geometry independently matches northern 18°/16° roots and ordinary 18°/17° margins',()=>{
  const result=verifyDiyanetSPAReference();
  assert.equal(result.result,'PASS');assert.equal(result.cases,22);
  assert.equal(result.eventTimestampComparisons,116);assert.equal(result.unavailableEventComparisons,16);
  assert.equal(result.ordinaryMarginComparisons,24);
  assert.equal(result.fixtureSha256,'e1b1f1cfbccc271f244497a97cb4cb09b2d73133a846196e6fea67a97679b008');
});

test('the published annual comparison accounts for every predeclared day, field and guard change',()=>{
  const report=JSON.parse(readFileSync(new URL('../core/local/verification/diyanet-spa-comparison.json',import.meta.url)));
  assert.equal(report.schema,'diyanet-spa-annual-comparison/v1');
  assert.equal(report.declarationSha256,DIYANET_SPA_DECLARATION_SHA256);
  assert.equal(createHash('sha256').update(readFileSync(new URL('../core/local/verification/diyanet-spa-compare.mjs',import.meta.url))).digest('hex'),report.evaluatorSha256);
  assert.ok(report.implementationPins.length>=8);
  const pinnedPaths=new Set();
  for(const pin of report.implementationPins){
    assert.ok(!pinnedPaths.has(pin.path));pinnedPaths.add(pin.path);
    assert.equal(createHash('sha256').update(readFileSync(new URL(`../core/${pin.path}`,import.meta.url))).digest('hex'),pin.sha256,
      `${pin.path}: regenerate the annual comparison after implementation changes`);
  }
  assert.equal(createHash('sha256').update(JSON.stringify(report.declaration)).digest('hex'),report.declarationSha256);
  assert.deepEqual(report.declaration.grid,DIYANET_SPA_GRID);
  assert.equal(report.pointDays,2921);assert.equal(report.groups.length,8);
  const count=t=>{
    assert.equal(t.bothAvailable+t.bothAbsent+t.usnoOnly+t.spaOnly,t.fields);
    for(const profile of ['usno','spa'])assert.equal(Object.values(t.status[profile]).reduce((a,b)=>a+b,0),t.fields);
    assert.equal(t.sameNearestMinute+t.changedNearestMinute,t.bothAvailable);
  };
  for(const summary of [report.selected,report.physical]){count(summary);assert.equal(summary.fields,17526);}
  for(const event of ['fajr','sunrise','dhuhr','asr','maghrib','isha']){
    count(report.byEvent[event]);count(report.physicalByEvent[event]);assert.equal(report.byEvent[event].fields,2921);
  }
  let days=0,selectedFields=0;
  for(const group of report.groups){
    assert.equal(group.dayCount,group.input.year===2028?366:365);days+=group.dayCount;
    count(group.selected);count(group.physical);assert.equal(group.selected.fields,group.dayCount*6);selectedFields+=group.selected.fields;
    const seen=new Set();
    for(const change of group.eligibilityChanges){
      assert.notEqual(change.usno.eligible,change.spa.eligible);
      assert.ok(change.date.startsWith(`${group.input.year}-`));
      const key=change.date+':'+change.event;assert.ok(!seen.has(key));seen.add(key);
    }
    if(group.northern){assert.equal(group.northern.usno.solarModel,'usno');assert.equal(group.northern.spa.solarModel,'spa');}
    else assert.ok(group.input.latitude<44.5);
  }
  assert.equal(days,2921);assert.equal(selectedFields,17526);
});
