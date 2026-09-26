import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {solarCoordinatesSPA,apparentGeocentricCoordinatesSPA,SPA_POINT_CONVENTIONS} from '../core/astronomy/spa-point.mjs';
import {verifyLocalSPA} from '../core/local/verification/spa-verify.mjs';

const signed=x=>((x+180)%360+360)%360-180;
const close=(a,b,tolerance)=>assert.ok(Math.abs(a-b)<=tolerance,`${a} differs from ${b}`);

test('SPA point coordinates match 80 independent pvlib samples and the published worked example',()=>{
  const fixture=JSON.parse(readFileSync(new URL('../core/astronomy/spa-point-fixtures.json',import.meta.url)));
  assert.equal(fixture.sampleCount,80);assert.equal(fixture.records.length,80);
  for(const row of fixture.records){
    const actual=solarCoordinatesSPA(row.jdUtc);
    close(actual.declination,row.declination,2e-8);
    close(actual.rightAscensionDegrees,row.rightAscensionDegrees,2e-8);
    close(signed(actual.apparentSiderealTimeDegrees-row.apparentSiderealTimeDegrees),0,2e-8);
    close(actual.equationOfTimeHours,row.effectiveEquationOfTimeHours,2e-9);
    assert.equal(actual.rightAscension,actual.rightAscensionDegrees/15);
  }
  const example=apparentGeocentricCoordinatesSPA(2452930.312847,{deltaTSeconds:67});
  close(example.rightAscension,202.22741,5e-6);
  close(example.declination,-9.31434,5e-6);
  close(example.equationOfTime,14.641503,1e-5);
  assert.equal(SPA_POINT_CONVENTIONS.deltaTSeconds,69.184);
  assert.equal(SPA_POINT_CONVENTIONS.assumedUt1MinusUtcSeconds,0);
  assert.equal(SPA_POINT_CONVENTIONS.topocentricParallax,false);
  assert.equal(SPA_POINT_CONVENTIONS.atmosphericRefractionApplied,false);
  assert.throws(()=>solarCoordinatesSPA(NaN),TypeError);
  assert.throws(()=>solarCoordinatesSPA('2451545'),TypeError);
});

test('effective SPA EOT retains sidereal hour angle across UTC midnight and longitude aliases',()=>{
  for(const midnight of ['2001-01-01','2027-06-21','2098-12-31'])for(const seconds of [-.1,0,.1,43200]){
    const epoch=Date.parse(midnight+'T00:00:00Z')+seconds*1000,jd=epoch/86400000+2440587.5;
    const solar=solarCoordinatesSPA(jd),utcPhase=((epoch%86400000)+86400000)%86400000/240000;
    for(const longitude of [-180,-73.25,0,142,180]){
      const adapted=utcPhase+longitude+15*solar.equationOfTimeHours-180;
      const sidereal=solar.apparentSiderealTimeDegrees+longitude-solar.rightAscensionDegrees;
      // JD's double-precision day fraction need not retain every epoch microsecond.
      close(signed(adapted-sidereal),0,2e-7);
    }
  }
});

test('SPA local events match independent continuous pvlib roots and correct the declared near-tangent discrepancies',()=>{
  const result=verifyLocalSPA();
  assert.equal(result.result,'PASS');assert.equal(result.cases,348);
  assert.equal(result.eventTimestampComparisons,1874);
  assert.equal(result.unavailableEventComparisons,160);
  assert.equal(result.nearestMinuteMatches,1874);
  assert.equal(result.usno.modelOnly,2);
  assert.ok(result.usno.maximumAbsoluteSeconds>100);
  assert.ok(result.maximumRootDifferenceSeconds<=.01);
  assert.equal(result.fixtureSha256,'9f0d6bd56cbf0e540b935b78d58ca8b9012e1986d1bee0867db816a1f684e904');
});
