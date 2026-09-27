import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const REPORT=resolve(ROOT,'core/local/verification/diyanet-local-2026-09-27.json');
const REPORT_SHA256='87f6fc5d6ea84313ba0e9b7fbdb66a12a2d9cb3afd839c29edafae8760619f48';

test('Diyanet local seasonal/winter report is pinned to its full verified input closure',()=>{
  const bytes=readFileSync(REPORT),actualHash=createHash('sha256').update(bytes).digest('hex');
  assert.equal(actualHash,REPORT_SHA256,'Pinned numerical report changed; rerun the independent verifier and review the new closure');
  const report=JSON.parse(bytes);
  assert.equal(report.schema,'diyanet-local-independent-behavior-verification/v1');
  assert.equal(report.result,'PASS');
  assert.equal(report.profile,'diyanet-local-seasonal-spa-v1');
  assert.equal(report.runtime.tzdb,'2026d');
  assert.equal(report.runtime.tzdataBundleVerified,true);
  assert.deepEqual(report.hashes.dependencyClosureBefore,report.hashes.dependencyClosureAfter);
  const closure=report.hashes.dependencyClosureAfter;
  assert.equal(Object.keys(closure.hashes).length,closure.files);
  assert.equal(createHash('sha256').update(JSON.stringify(closure.hashes)).digest('hex'),closure.closureSha256);
  for(const [relative,expected] of Object.entries(closure.hashes)){
    const path=resolve(ROOT,relative);assert(path.startsWith(`${ROOT}/`),`Unexpected closure path ${relative}`);
    assert.equal(createHash('sha256').update(readFileSync(path)).digest('hex'),expected,`Changed numerical input ${relative}`);
  }
});

test('independent annual cases retain the predeclared smoothness, horizon and provenance checks',()=>{
  const report=JSON.parse(readFileSync(REPORT,'utf8'));
  assert.equal(report.annual.length,12);
  assert.deepEqual(new Set(report.annual.map(x=>x.city)),new Set(['frankfurt','berlin','bordeaux','edinburgh']));
  for(const row of report.annual){
    assert(row.annualHorizonGatePassed,`${row.city} ${row.year}: annual horizon gate`);
    assert.equal(row.ratioAnchorCount,1);
    assert.equal(row.ratioExcludedCandidateNightCount,0);
    assert.equal(row.verificationDenominators.ownedDays,row.rows.length);
    assert.equal(row.verificationDenominators.twilightTraceComparisons,2*row.rows.length);
    assert(row.maxCandidateDeltaMilliseconds<=1000);
    assert(row.maxSelectedDeltaMilliseconds<=1000);
    assert(row.maxQDelta<1e-9);
    assert(Math.abs(row.maxAdjacentEventPhaseChange.minutes)<=10);
    const rawMissingFajr=row.rows.filter(day=>day.events.fajr.raw===null).map(day=>day.date);
    assert.deepEqual(rawMissingFajr,row.sourceMissingFajrDates,`${row.city} ${row.year}: raw absence denominator`);
    for(const date of row.sourceMissingFajrDates){
      const day=row.rows.find(candidate=>candidate.date===date);
      assert.equal(day.events.fajr.status,'estimated',`${row.city} ${date}: absent raw Fajr is explicitly estimated`);
    }
    assert.equal(row.missingDatesByEvent.fajr.length,0,`${row.city} ${row.year}: no hidden or silently missing Fajr`);
    assert.equal(row.crossNight.checkedNights,row.rows.length+1);
    assert(row.crossNight.completeNights>0);
  }
  for(const seam of report.scope.yearSeams)assert(Math.abs(seam.minutes)<=10);
});

test('Oslo winter release remains a bounded real-event admission and unavailable controls preserve horizons',()=>{
  const report=JSON.parse(readFileSync(REPORT,'utf8'));
  assert.equal(report.winter.annualContextStatus,'blocked');
  assert.equal(report.winter.originalAnnualContextRemainsBlocked,true);
  assert.equal(report.winter.eligible.fajr,report.winter.eligibleDatesByEvent.fajr.length);
  assert.equal(report.winter.eligible.isha,report.winter.eligibleDatesByEvent.isha.length);
  assert(report.winter.eligible.fajr>0&&report.winter.eligible.isha>0);
  assert.equal(report.winter.verificationDenominators.winterEventAdmissionChecks,730);
  assert(report.scope.controls.some(x=>x.city==='tromso'&&x.unavailableDates.sunrise.length>0));
  assert(report.scope.controls.some(x=>x.city==='istanbul'&&x.days===365));
  assert(report.scope.latitudeBoundary[0].status==='blocked');
  assert(report.scope.latitudeBoundary[1].status==='available');
});
