import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {calculateLocalSolarDay} from '../solar.mjs';
import {calculateLocalDay} from '../index.mjs';
import {selectRuleInstant} from '../selection.mjs';

const fixtureUrl=new URL('./profiles-fixtures.json',import.meta.url);
const EVENTS=['fajr','sunrise','dhuhr','asr','maghrib','isha'];
const KEMENAG='kemenag-worked-example-point-v1';
const ROOT_TOLERANCE_SECONDS=0.1;
const THRESHOLD_TOLERANCE_DEGREES=1e-8;
const ROLES={fajr:'prayer-start-model',sunrise:'sunrise-marker',dhuhr:'solar-noon-marker',
  asr:'shadow-marker',maghrib:'sunset-marker',isha:'prayer-start-model'};
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');

/** Independent frozen Python roots and explicit rule arithmetic, not observed accuracy. */
export function verifyLocalProfiles(){
  const bytes=readFileSync(fixtureUrl),fixture=JSON.parse(bytes);
  assert.equal(fixture.schema,'independent-local-profiles-oracle/v1');
  assert.equal(fixture.caseCount,284);
  assert.equal(fixture.rows.length,fixture.caseCount);
  assert.equal(fixture.baselineParity.cases,139);
  assert.equal(fixture.baselineParity.allNumericFieldsIdentical,true);
  assert.equal(hash(readFileSync(new URL('./oracle.py',import.meta.url))),fixture.baselineParity.originalOracleSha256);
  assert.equal(hash(readFileSync(new URL('./oracle-fixtures.json',import.meta.url))),fixture.baselineParity.originalFixtureSha256);
  const stats={cases:fixture.caseCount,baselinePythonParityCases:139,calculatedCycles:0,
    profileCases:0,factorTwoCases:0,expectedOwnershipRejections:0,physicalEventComparisons:0,
    unavailablePhysicalEvents:0,cycleBoundaryComparisons:0,selectedEventComparisons:0,
    unavailableSelectedEvents:0,blockedSelectedEvents:0,calendarMinuteComparisons:0,
    kemenagMinuteComparisons:0,minuteArithmeticComparisons:0,roleComparisons:0,
    maximumRootDifferenceSeconds:0,maximumCycleBoundaryDifferenceSeconds:0,
    maximumSelectedDifferenceSeconds:0,maximumThresholdDifferenceDegrees:0,
    rootToleranceSeconds:ROOT_TOLERANCE_SECONDS,fixtureSha256:hash(bytes),
    runtime:{node:process.version,icu:process.versions.icu,tzdb:process.versions.tz}};
  function close(a,b,tolerance,label){
    assert.ok(Number.isFinite(a)&&Number.isFinite(b),`${label}: finite numbers required`);
    const difference=Math.abs(a-b);
    assert.ok(difference<=tolerance,`${label}: difference ${difference} exceeds ${tolerance}`);
    return difference;
  }
  const ids=new Set();
  for(const row of fixture.rows){
    const {input,geometryParameters:parameters,oracle,selected}=row;
    const {id,...profileInput}=input;
    assert.ok(!ids.has(id),`${id}: duplicate fixture ID`);ids.add(id);
    const hasProfile=Object.hasOwn(input,'profile');
    if(hasProfile)stats.profileCases++;else stats.factorTwoCases++;
    if(oracle.status==='ownership-unavailable'){
      assert.ok(oracle.transitCount===0||oracle.transitCount===2,`${id}: explicit absent/ambiguous transit`);
      assert.throws(()=>calculateLocalSolarDay(parameters),RangeError,`${id}: geometry ownership`);
      if(hasProfile)assert.throws(()=>calculateLocalDay(profileInput),RangeError,`${id}: profile ownership`);
      stats.expectedOwnershipRejections++;continue;
    }
    assert.equal(oracle.status,'calculated');
    const solar=calculateLocalSolarDay(parameters);
    stats.calculatedCycles++;
    assert.equal(solar.transit.localDate,input.date,`${id}: transit civil-date owner`);
    assert.equal(solar.model.temkinApplied,false,`${id}: no physical-layer margins`);
    for(const parameter of ['fajrAngleDegrees','ishaAngleDegrees','asrShadowFactor','horizonDepressionDegrees'])
      assert.equal(solar.model[parameter],parameters[parameter],`${id}: ${parameter}`);
    for(const [actualKey,expectedKey] of [['startEpochMilliseconds','startEpochSeconds'],['endEpochMilliseconds','endEpochSeconds']]){
      stats.maximumCycleBoundaryDifferenceSeconds=Math.max(stats.maximumCycleBoundaryDifferenceSeconds,
        close(solar.solarCycle[actualKey]/1000,oracle[expectedKey],ROOT_TOLERANCE_SECONDS,`${id}: ${actualKey}`));
      stats.cycleBoundaryComparisons++;
    }
    assert.deepEqual(Object.keys(solar.events).sort(),[...EVENTS].sort());
    for(const event of EVENTS){
      const expected=oracle.events[event],actual=solar.events[event],label=`${id}:${event}`;
      if(expected.epochSeconds===null){
        assert.equal(actual.status,'unavailable',`${label}: unavailable physical crossing`);
        assert.equal(actual.epochMilliseconds,null);
        assert.ok(actual.reason,`${label}: absence reason retained`);
        stats.unavailablePhysicalEvents++;continue;
      }
      assert.equal(actual.status,'calculated',`${label}: physical crossing exists`);
      assert.equal(actual.reason,null);
      assert.equal(actual.rootDirection,expected.rootDirection);
      stats.maximumRootDifferenceSeconds=Math.max(stats.maximumRootDifferenceSeconds,
        close(actual.epochMilliseconds/1000,expected.epochSeconds,ROOT_TOLERANCE_SECONDS,label));
      if(expected.thresholdDegrees===null)assert.equal(actual.thresholdDegrees,null);
      else stats.maximumThresholdDifferenceDegrees=Math.max(stats.maximumThresholdDifferenceDegrees,
        close(actual.thresholdDegrees,expected.thresholdDegrees,THRESHOLD_TOLERANCE_DEGREES,`${label}: target`));
      stats.physicalEventComparisons++;
    }
    if(!hasProfile)continue;
    const day=calculateLocalDay(profileInput),kemenag=input.profile===KEMENAG;
    assert.equal(day.profile.id,input.profile);
    assert.equal(day.profile.official,false);
    assert.equal(day.profile.institutionalEquivalence,'not-claimed');
    assert.equal(day.calculation.northernPolicy,null,`${id}: no inherited northern substitution`);
    assert.equal(day.calculation.seasonalPolicy,null,`${id}: no inherited summer policy`);
    assert.deepEqual(Object.keys(day.events).sort(),[...EVENTS].sort(),`${id}: exactly six named events`);
    let previous=null;
    for(const event of EVENTS){
      const expected=selected[event],actual=day.events[event],label=`${id}:${event}`;
      const raw=solar.events[event].epochMilliseconds;
      assert.equal(day.astronomy.events[event].epochMilliseconds,raw,`${label}: raw geometry is retained unchanged`);
      assert.equal(actual.status,expected.status,`${label}: selected status`);
      const role=kemenag&&event!=='sunrise'?'prayer-start-model':ROLES[event];
      assert.equal(actual.role,role,`${label}: explicit event role`);stats.roleComparisons++;
      if(expected.status!=='calculated'){
        assert.equal(actual.rawEpochMilliseconds,null);
        assert.equal(actual.epochMilliseconds,null);
        assert.equal(actual.roundedEpochMilliseconds,null);
        assert.ok(actual.reason,`${label}: selected failure reason`);
        if(expected.status==='unavailable')stats.unavailableSelectedEvents++;else stats.blockedSelectedEvents++;
        continue;
      }
      stats.maximumSelectedDifferenceSeconds=Math.max(stats.maximumSelectedDifferenceSeconds,
        close(actual.rawEpochMilliseconds/1000,expected.selectedEpochMilliseconds/1000,
          kemenag?0:ROOT_TOLERANCE_SECONDS,`${label}: selected instant`));
      assert.equal(actual.epochMilliseconds,Math.round(actual.rawEpochMilliseconds));
      assert.equal(actual.roundedEpochMilliseconds,expected.roundedEpochMilliseconds,`${label}: calendar minute`);
      assert.equal(Date.parse(actual.calendarUtc),expected.roundedEpochMilliseconds);
      assert.equal(actual.basis.solarEpochMilliseconds,raw,`${label}: retained physical basis`);
      assert.equal(actual.basis.operationOrder,'quantize-then-add-elapsed-margin');
      assert.ok(previous===null||actual.rawEpochMilliseconds>previous,`${label}: strict selected order`);
      previous=actual.rawEpochMilliseconds;
      if(kemenag){
        assert.equal(actual.seconds,null);assert.equal(actual.secondsDate,null);
        assert.equal(actual.resolution,'minute');stats.kemenagMinuteComparisons++;
      }else{
        assert.equal(actual.rawEpochMilliseconds,raw,`${label}: no hidden Temkin`);
        assert.equal(actual.resolution,'model-instant');
        assert.ok(typeof actual.seconds==='string');
      }
      stats.selectedEventComparisons++;stats.calendarMinuteComparisons++;
    }
    assert.equal(day.coverage.estimatedEvents.length,0,`${id}: no absent-event estimates`);
    assert.equal(day.coverage.complete,EVENTS.every(e=>selected[e].status==='calculated'));
    assert.equal(day.coverage.prayerStartsComplete,kemenag&&EVENTS.every(e=>selected[e].status==='calculated'));
  }
  for(const expected of fixture.minuteArithmetic){
    const {event,rawEpochMilliseconds:raw,kemenag}=expected;
    const margin=kemenag?(event==='sunrise'?-2:event==='dhuhr'?3:2):0;
    const rounding=kemenag?(event==='sunrise'?'floor-minute':'ceil-minute'):'none';
    const actual=selectRuleInstant({epochMilliseconds:raw,rounding,marginMinutes:margin});
    assert.equal(actual.selectedEpochMilliseconds,expected.selectedEpochMilliseconds,`${event}: arithmetic at ${raw}`);
    assert.equal(actual.solarEpochMilliseconds,raw);
    assert.equal(actual.operationOrder,'quantize-then-add-elapsed-margin');
    // JavaScript may retain -0 after ceil of a tiny negative epoch. Both zero
    // signs denote the same UTC instant; Python/JSON serializes integer zero.
    assert.ok(actual.roundedBasisEpochMilliseconds===(kemenag?expected.selectedEpochMilliseconds-margin*60000:null));
    stats.minuteArithmeticComparisons++;
  }
  assert.equal(stats.calculatedCycles,275);assert.equal(stats.expectedOwnershipRejections,9);
  assert.equal(stats.profileCases,259);assert.equal(stats.factorTwoCases,25);
  assert.equal(stats.physicalEventComparisons,1558);assert.equal(stats.unavailablePhysicalEvents,92);
  assert.equal(stats.selectedEventComparisons,1430);assert.equal(stats.kemenagMinuteComparisons,240);
  assert.equal(stats.minuteArithmeticComparisons,228);
  assert.equal(stats.physicalEventComparisons+stats.unavailablePhysicalEvents,stats.calculatedCycles*6);
  return {result:'PASS',...stats};
}

if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url)
  console.log(JSON.stringify(verifyLocalProfiles(),null,2));
