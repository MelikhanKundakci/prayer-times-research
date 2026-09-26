import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {calculateLocalSolarDay} from '../solar.mjs';

const EVENTS=['fajr','sunrise','dhuhr','asr','maghrib','isha'];
const TOLERANCE_SECONDS=0.01;
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');

/** Verify SPA event solving against independent pvlib roots, retaining the USNO comparison. */
export function verifyLocalSPA(){
  const bytes=readFileSync(new URL('./spa-fixtures.json',import.meta.url));
  const fixture=JSON.parse(bytes);
  assert.equal(fixture.schema,'independent-local-spa-events/v1');
  assert.equal(fixture.caseCount,348);assert.equal(fixture.rows.length,348);
  const stats={cases:348,calculatedCycles:0,expectedOwnershipRejections:0,
    eventTimestampComparisons:0,unavailableEventComparisons:0,cycleBoundaryComparisons:0,
    nearestMinuteMatches:0,maximumRootDifferenceSeconds:0,maximumCycleBoundaryDifferenceSeconds:0,
    medianAbsoluteRootDifferenceSeconds:null,p95AbsoluteRootDifferenceSeconds:null,
    maximumThresholdDifferenceDegrees:0,rootToleranceSeconds:TOLERANCE_SECONDS,
    usno:{sharedEvents:0,bothUnavailable:0,modelOnly:0,referenceOnly:0,nearestMinuteMatches:0,
      maximumAbsoluteSeconds:0,medianAbsoluteSeconds:null,p95AbsoluteSeconds:null},
    fixtureSha256:digest(bytes),runtime:{node:process.version,icu:process.versions.icu,tzdb:process.versions.tz}};
  const differences=[],spaDifferences=[],seen=new Set(),byCohort={};
  function close(a,b,tolerance,label){
    assert.ok(Number.isFinite(a)&&Number.isFinite(b),`${label}: finite values required`);
    const delta=Math.abs(a-b);assert.ok(delta<=tolerance,`${label}: difference ${delta} exceeds ${tolerance}`);
    return delta;
  }
  for(const {id,cohort,input,reference} of fixture.rows){
    assert.ok(!seen.has(id),`Duplicate case ${id}`);seen.add(id);
    if(reference.status==='ownership-unavailable'){
      assert.throws(()=>calculateLocalSolarDay({...input,solarModel:'spa'}),RangeError,`${id}: SPA ownership`);
      assert.throws(()=>calculateLocalSolarDay(input),RangeError,`${id}: unchanged USNO ownership`);
      stats.expectedOwnershipRejections++;continue;
    }
    assert.equal(reference.status,'calculated');
    const actual=calculateLocalSolarDay({...input,solarModel:'spa'});
    const old=calculateLocalSolarDay(input);
    assert.match(actual.model.id,/SPA/);assert.match(old.model.id,/USNO/);
    assert.equal(actual.model.topocentricParallax,false);
    assert.equal(actual.model.temkinApplied,false);
    assert.deepEqual(actual.model.timeScale,{ut1MinusUtcSeconds:0,deltaTSeconds:69.184,
      convention:'fixed offline approximation, not a future Earth-orientation or leap-second prediction'});
    assert.equal(actual.transit.localDate,input.date);
    stats.calculatedCycles++;
    byCohort[cohort]??={cases:0,comparedEvents:0,unavailableEvents:0,maximumRootDifferenceSeconds:0};
    byCohort[cohort].cases++;
    for(const [key,expected] of [['startEpochMilliseconds',reference.startEpochSeconds],['endEpochMilliseconds',reference.endEpochSeconds]]){
      stats.maximumCycleBoundaryDifferenceSeconds=Math.max(stats.maximumCycleBoundaryDifferenceSeconds,
        close(actual.solarCycle[key]/1000,expected,TOLERANCE_SECONDS,`${id}: ${key}`));
      stats.cycleBoundaryComparisons++;
    }
    for(const event of EVENTS){
      const expected=reference.events[event],now=actual.events[event],prior=old.events[event],label=`${id}:${event}`;
      if(expected.epochSeconds===null){
        assert.equal(now.status,'unavailable',`${label}: SPA absence`);
        assert.equal(now.epochMilliseconds,null);assert.ok(now.reason);
        stats.unavailableEventComparisons++;byCohort[cohort].unavailableEvents++;
        if(prior.epochMilliseconds===null)stats.usno.bothUnavailable++;else stats.usno.modelOnly++;
        continue;
      }
      assert.equal(now.status,'calculated',`${label}: reference crossing exists`);
      assert.equal(now.reason,null);
      const delta=close(now.epochMilliseconds/1000,expected.epochSeconds,TOLERANCE_SECONDS,label);
      spaDifferences.push(delta);
      stats.maximumRootDifferenceSeconds=Math.max(stats.maximumRootDifferenceSeconds,delta);
      byCohort[cohort].maximumRootDifferenceSeconds=Math.max(byCohort[cohort].maximumRootDifferenceSeconds,delta);
      if(expected.thresholdDegrees===null)assert.equal(now.thresholdDegrees,null);
      else stats.maximumThresholdDifferenceDegrees=Math.max(stats.maximumThresholdDifferenceDegrees,
        close(now.thresholdDegrees,expected.thresholdDegrees,1e-8,`${label}: altitude threshold`));
      assert.equal(now.rootDirection,expected.direction);
      stats.eventTimestampComparisons++;byCohort[cohort].comparedEvents++;
      if(Math.floor(now.epochMilliseconds/60000+.5)===Math.floor(expected.epochSeconds/60+.5))stats.nearestMinuteMatches++;
      if(prior.epochMilliseconds===null)stats.usno.referenceOnly++;
      else{
        const oldDelta=Math.abs(prior.epochMilliseconds/1000-expected.epochSeconds);
        differences.push(oldDelta);stats.usno.sharedEvents++;
        stats.usno.maximumAbsoluteSeconds=Math.max(stats.usno.maximumAbsoluteSeconds,oldDelta);
        if(Math.floor(prior.epochMilliseconds/60000+.5)===Math.floor(expected.epochSeconds/60+.5))stats.usno.nearestMinuteMatches++;
      }
    }
  }
  differences.sort((a,b)=>a-b);
  const middle=Math.floor(differences.length/2);
  stats.usno.medianAbsoluteSeconds=differences.length%2?differences[middle]:(differences[middle-1]+differences[middle])/2;
  stats.usno.p95AbsoluteSeconds=differences[Math.ceil(.95*differences.length)-1];
  spaDifferences.sort((a,b)=>a-b);
  const spaMiddle=Math.floor(spaDifferences.length/2);
  stats.medianAbsoluteRootDifferenceSeconds=spaDifferences.length%2?spaDifferences[spaMiddle]:(spaDifferences[spaMiddle-1]+spaDifferences[spaMiddle])/2;
  stats.p95AbsoluteRootDifferenceSeconds=spaDifferences[Math.ceil(.95*spaDifferences.length)-1];
  assert.equal(stats.calculatedCycles,339);assert.equal(stats.expectedOwnershipRejections,9);
  assert.equal(stats.eventTimestampComparisons,1874);assert.equal(stats.unavailableEventComparisons,160);
  assert.equal(stats.nearestMinuteMatches,1874);
  assert.equal(stats.usno.modelOnly,2);assert.equal(stats.usno.referenceOnly,0);
  assert.equal(stats.usno.nearestMinuteMatches,1849);
  return {result:'PASS',...stats,byCohort};
}

if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url)
  console.log(JSON.stringify(verifyLocalSPA(),null,2));
