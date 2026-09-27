import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {calculateLocalSolarDay} from '../solar.mjs';
import {calculateLocalTopocentricSolarDay} from '../solar-topocentric.mjs';

const EVENTS=['fajr','sunrise','dhuhr','asr','maghrib','isha'];
const TOLERANCE_SECONDS=.01;
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');

/** Verify topocentric six-event roots against independently executed pinned pvlib SPA. */
export function verifyObserverSPA(){
  const bytes=readFileSync(new URL('./observer-reference-fixtures.json',import.meta.url));
  const fixture=JSON.parse(bytes);
  assert.equal(fixture.schema,'independent-local-observer-spa-events/v1');
  assert.equal(fixture.caseCount,371);assert.equal(fixture.rows.length,371);
  assert.equal(fixture.sourceSha256,'ad7762ccca5fd9611ef9e2a9b1e37f95fe4c5b31628616b2ad3e84ea1e5f9202');
  assert.deepEqual(fixture.inputFixtureSha256,{
    'core/local/verification/spa-fixtures.json':'9f0d6bd56cbf0e540b935b78d58ca8b9012e1986d1bee0867db816a1f684e904',
    'core/local/verification/diyanet-spa-reference-fixtures.json':'e1b1f1cfbccc271f244497a97cb4cb09b2d73133a846196e6fea67a97679b008',
  });
  const stats={cases:fixture.caseCount,calculatedCycles:0,ownershipRejections:0,
    boundaryComparisons:0,eventTimestampComparisons:0,unavailableEvents:0,
    maxReferenceDifferenceSeconds:0,maxAngleDifferenceDegrees:0,
    geocentric:{pairedEventTimestamps:0,onlyTopocentricAvailable:0,onlyGeocentricAvailable:0,
      bothUnavailable:0,nearestMinuteLabelsChanged:0,
      maximumAbsoluteChangeSeconds:0,medianAbsoluteChangeSeconds:null,p95AbsoluteChangeSeconds:null,
      byEvent:{}},diagnostics:{},fixtureSha256:digest(bytes),toleranceSeconds:TOLERANCE_SECONDS};
  const differences=[];
  for(const event of EVENTS)stats.geocentric.byEvent[event]={paired:0,onlyTopocentricAvailable:0,
    onlyGeocentricAvailable:0,nearestMinuteLabelsChanged:0,maximumAbsoluteChangeSeconds:0};
  const close=(actual,expected,label)=>{
    assert.ok(Number.isFinite(actual)&&Number.isFinite(expected),`${label}: finite timestamps required`);
    const difference=Math.abs(actual-expected);
    assert.ok(difference<=TOLERANCE_SECONDS,`${label}: difference ${difference}s exceeds tolerance`);
    stats.maxReferenceDifferenceSeconds=Math.max(stats.maxReferenceDifferenceSeconds,difference);
    return difference;
  };
  const closeAngle=(actual,expected,label)=>{
    assert.ok(Number.isFinite(actual)&&Number.isFinite(expected),`${label}: finite angles required`);
    const difference=Math.abs(actual-expected);
    assert.ok(difference<=1e-8,`${label}: difference ${difference}° exceeds 1e-8°`);
    stats.maxAngleDifferenceDegrees=Math.max(stats.maxAngleDifferenceDegrees,difference);
    return difference;
  };
  for(const {id,input,reference} of fixture.rows){
    if(reference.status==='ownership-unavailable'){
      assert.throws(()=>calculateLocalTopocentricSolarDay(input),RangeError,`${id}: topocentric ownership`);
      stats.ownershipRejections++;
      continue;
    }
    assert.equal(reference.status,'calculated',`${id}: reference state`);
    const actual=calculateLocalTopocentricSolarDay(input);
    const geocentric=calculateLocalSolarDay({...input,solarModel:'spa'});
    assert.equal(actual.model.id,'SPA-topocentric-continuous-point-v1');
    assert.equal(actual.model.topocentricParallax,true);
    assert.equal(actual.model.observerElevationMetres,0);
    assert.equal(actual.model.atmosphericRefractionApplied,false);
    assert.deepEqual(actual.model.timeScale,{ut1MinusUtcSeconds:0,deltaTSeconds:69.184,
      convention:'fixed offline approximation, not a future Earth-orientation or leap-second prediction'});
    assert.equal(actual.transit.localDate,input.date);
    if(id==='bodo-noon-diagnostic-2027-12-08'){
      stats.diagnostics.bodo={date:input.date,latitude:input.latitude,longitude:input.longitude,events:{}};
      for(const event of EVENTS){
        const now=actual.events[event],old=geocentric.events[event];
        stats.diagnostics.bodo.events[event]={geocentricEpochMilliseconds:old.epochMilliseconds,
          topocentricEpochMilliseconds:now.epochMilliseconds,
          differenceSeconds:now.epochMilliseconds===null||old.epochMilliseconds===null?null:
            (now.epochMilliseconds-old.epochMilliseconds)/1000};
      }
    }
    stats.calculatedCycles++;
    for(const [key,expected] of [['startEpochMilliseconds',reference.startEpochSeconds],
      ['epochMilliseconds',reference.transitEpochSeconds],['endEpochMilliseconds',reference.endEpochSeconds]]){
      const value=key==='epochMilliseconds'?actual.transit[key]:actual.solarCycle[key];
      close(value/1000,expected,`${id}:${key}`);stats.boundaryComparisons++;
    }
    closeAngle(actual.transit.geometricAltitudeDegrees,reference.transitTopocentricAltitudeDegrees,
      `${id}: topocentric noon altitude`);
    for(const event of EVENTS){
      const expected=reference.events[event],selected=actual.events[event],old=geocentric.events[event];
      assert.equal(expected.rootCount===1,selected.epochMilliseconds!==null,`${id}:${event} availability`);
      if(expected.rootCount!==1){
        assert.equal(selected.status,'unavailable',`${id}:${event} unavailable status`);
        assert.ok(selected.reason,`${id}:${event} unavailable reason`);
        if(expected.rootCount>1)assert.equal(selected.reason,'ambiguous-solar-crossing',`${id}:${event} ambiguous roots`);
        stats.unavailableEvents++;
      }else{
        assert.equal(expected.rootCount,1,`${id}:${event} unique reference root`);
        assert.equal(selected.status,'calculated',`${id}:${event} selected status`);
        close(selected.epochMilliseconds/1000,expected.epochSeconds,`${id}:${event}`);
        if(event==='asr')closeAngle(selected.thresholdDegrees,expected.thresholdDegrees,`${id}:Asr threshold`);
        stats.eventTimestampComparisons++;
      }
      const newAvailable=selected.epochMilliseconds!==null,oldAvailable=old.epochMilliseconds!==null;
      const eventStats=stats.geocentric.byEvent[event];
      if(newAvailable&&oldAvailable){
        const delta=(selected.epochMilliseconds-old.epochMilliseconds)/1000;
        const absolute=Math.abs(delta);
        stats.geocentric.pairedEventTimestamps++;eventStats.paired++;
        differences.push(absolute);
        stats.geocentric.maximumAbsoluteChangeSeconds=Math.max(stats.geocentric.maximumAbsoluteChangeSeconds,absolute);
        eventStats.maximumAbsoluteChangeSeconds=Math.max(eventStats.maximumAbsoluteChangeSeconds,absolute);
        if(Math.floor(selected.epochMilliseconds/60000+.5)!==Math.floor(old.epochMilliseconds/60000+.5)){
          stats.geocentric.nearestMinuteLabelsChanged++;eventStats.nearestMinuteLabelsChanged++;
        }
      }else if(newAvailable){
        stats.geocentric.onlyTopocentricAvailable++;eventStats.onlyTopocentricAvailable++;
      }else if(oldAvailable){
        stats.geocentric.onlyGeocentricAvailable++;eventStats.onlyGeocentricAvailable++;
      }else{
        stats.geocentric.bothUnavailable++;
      }
    }
  }
  differences.sort((a,b)=>a-b);
  const middle=Math.floor(differences.length/2);
  stats.geocentric.medianAbsoluteChangeSeconds=differences.length%2?differences[middle]:(differences[middle-1]+differences[middle])/2;
  stats.geocentric.p95AbsoluteChangeSeconds=differences[Math.ceil(.95*differences.length)-1];
  assert.equal(stats.calculatedCycles,362);assert.equal(stats.ownershipRejections,9);
  assert.equal(stats.boundaryComparisons,1086);
  assert.equal(stats.geocentric.onlyTopocentricAvailable,3);assert.equal(stats.geocentric.onlyGeocentricAvailable,0);
  return{result:'PASS',...stats};
}

if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url)
  console.log(JSON.stringify(verifyObserverSPA(),null,2));
