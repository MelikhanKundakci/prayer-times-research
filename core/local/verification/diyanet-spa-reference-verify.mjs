import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {calculateLocalSolarDay} from '../solar.mjs';
import {calculateLocalDay} from '../index.mjs';

const EVENTS=['fajr','sunrise','dhuhr','asr','maghrib','isha'];
const MARGINS={fajr:0,sunrise:-7,dhuhr:5,asr:4,maghrib:7,isha:0};
const TOLERANCE_SECONDS=.01;

/** Independent 18°/16° northern SPA roots; no institutional-calendar observations. */
export function verifyDiyanetSPAReference(){
  const bytes=readFileSync(new URL('./diyanet-spa-reference-fixtures.json',import.meta.url));
  const fixture=JSON.parse(bytes);
  assert.equal(fixture.schema,'independent-diyanet-spa-reference/v1');
  assert.equal(fixture.caseCount,22);assert.equal(fixture.rows.length,22);
  const stats={cases:22,northernCases:0,ordinaryCases:0,eventTimestampComparisons:0,
    unavailableEventComparisons:0,cycleBoundaryComparisons:0,ordinaryMarginComparisons:0,
    maximumRootDifferenceSeconds:0,maximumCycleBoundaryDifferenceSeconds:0,
    maximumOrdinaryMarginDifferenceSeconds:0,rootToleranceSeconds:TOLERANCE_SECONDS,
    fixtureSha256:createHash('sha256').update(bytes).digest('hex'),
    runtime:{node:process.version,icu:process.versions.icu,tzdb:process.versions.tz}};
  const close=(a,b,label)=>{
    assert.ok(Number.isFinite(a)&&Number.isFinite(b),`${label}: finite timestamps`);
    const d=Math.abs(a-b);assert.ok(d<=TOLERANCE_SECONDS,`${label}: difference ${d}`);return d;
  };
  for(const {id,input,reference} of fixture.rows){
    assert.equal(input.fajrAngleDegrees,18);assert.equal(input.asrShadowFactor,1);
    assert.equal(input.horizonDepressionDegrees,50/60);
    const northern=input.latitude>=44.5;
    assert.equal(input.ishaAngleDegrees,northern?16:17);
    if(northern)stats.northernCases++;else stats.ordinaryCases++;
    const actual=calculateLocalSolarDay({...input,solarModel:'spa'});
    assert.equal(reference.status,'calculated');
    assert.equal(actual.transit.localDate,input.date);
    for(const [key,expected] of [['startEpochMilliseconds',reference.startEpochSeconds],['endEpochMilliseconds',reference.endEpochSeconds]]){
      stats.maximumCycleBoundaryDifferenceSeconds=Math.max(stats.maximumCycleBoundaryDifferenceSeconds,
        close(actual.solarCycle[key]/1000,expected,`${id}: ${key}`));
      stats.cycleBoundaryComparisons++;
    }
    for(const event of EVENTS){
      const expected=reference.events[event],emitted=actual.events[event];
      if(expected.epochSeconds===null){
        assert.equal(emitted.status,'unavailable',`${id}: ${event}`);
        assert.equal(emitted.epochMilliseconds,null);assert.ok(emitted.reason);
        stats.unavailableEventComparisons++;continue;
      }
      assert.equal(emitted.status,'calculated',`${id}: ${event}`);
      assert.equal(emitted.rootDirection,expected.direction);
      stats.maximumRootDifferenceSeconds=Math.max(stats.maximumRootDifferenceSeconds,
        close(emitted.epochMilliseconds/1000,expected.epochSeconds,`${id}: ${event}`));
      if(expected.thresholdDegrees===null)assert.equal(emitted.thresholdDegrees,null);
      else assert.ok(Math.abs(emitted.thresholdDegrees-expected.thresholdDegrees)<=1e-8);
      stats.eventTimestampComparisons++;
    }
    if(!northern){
      const {date,latitude,longitude,timeZone}=input;
      const day=calculateLocalDay({date,latitude,longitude,timeZone,profile:'diyanet-published-spa-point-v1'});
      assert.equal(day.calculation.northernPolicy,null);
      assert.equal(day.calculation.seasonalPolicy,null);
      for(const event of EVENTS){
        const emitted=day.events[event],expected=reference.events[event].epochSeconds+60*MARGINS[event];
        assert.equal(emitted.status,'calculated');
        assert.equal(emitted.adjustmentMinutes,MARGINS[event]);
        stats.maximumOrdinaryMarginDifferenceSeconds=Math.max(stats.maximumOrdinaryMarginDifferenceSeconds,
          close(emitted.rawEpochMilliseconds/1000,expected,`${id}: ${event} margin`));
        assert.equal(emitted.roundedEpochMilliseconds,Math.floor(expected/60+.5)*60000);
        stats.ordinaryMarginComparisons++;
      }
    }
  }
  assert.equal(stats.northernCases,18);assert.equal(stats.ordinaryCases,4);
  assert.equal(stats.eventTimestampComparisons,116);assert.equal(stats.unavailableEventComparisons,16);
  assert.equal(stats.ordinaryMarginComparisons,24);
  return{result:'PASS',...stats};
}

if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url)
  console.log(JSON.stringify(verifyDiyanetSPAReference(),null,2));
