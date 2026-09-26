import test from 'node:test';
import assert from 'node:assert/strict';
import {buildNorthernContext} from '../core/local/northern.mjs';

const base={year:2027,latitude:50.1109,longitude:8.6821,timeZone:'Europe/Berlin'};

test('Northern context rejects invalid inputs before attempting annual calculation',()=>{
  for(const changes of [{year:1e9},{year:2000},{year:2099},{year:2027.5},{latitude:44.49},{latitude:90},
    {longitude:181},{timeZone:'+01:00'},{timeZone:'Not/AZone'},{unknown:1}])
    assert.throws(()=>buildNorthernContext({...base,...changes}));
  let accessed=false;
  const getter=Object.defineProperty({...base},'year',{enumerable:true,get(){accessed=true;return 2027;}});
  assert.throws(()=>buildNorthernContext(getter),TypeError);assert.equal(accessed,false);
  let coerced=false;
  assert.throws(()=>buildNorthernContext({...base,latitude:{valueOf(){coerced=true;return 50;}}}),RangeError);
  assert.equal(coerced,false);
});

test('Unpadded boundary years remain explicitly blocked rather than borrowing a different year',()=>{
  for(const year of [2001,2098]){
    const result=buildNorthernContext({...base,year});
    assert.equal(result.status,'blocked');
    assert.equal(result.reason,'padded-year-outside-solar-domain');
    assert.equal(result.days[`${year}-01-01`].fajr.eligible,false);
    assert.equal(result.days[`${year}-12-31`].isha.eligible,false);
  }
});

test('One skipped dependency date invalidates the annual envelope without concealing the hole',()=>{
  const result=buildNorthernContext({year:2011,latitude:50,longitude:-171.75,timeZone:'Pacific/Apia'});
  assert.equal(result.status,'blocked');
  assert.equal(result.reason,'annual-solar-context-incomplete');
  assert.equal(result.metadata.horizonGatePassed,false);
  assert.ok(result.metadata.failures.some(f=>f.date==='2011-12-30'));
  assert.equal(result.days['2011-01-15'].fajr.eligible,false);
  assert.equal(result.days['2011-01-15'].isha.eligible,false);
  assert.equal(result.days['2011-12-29'].horizons.maghribEligible,false);
  assert.equal(result.days['2011-12-31'].horizons.sunriseEligible,false);
});

test('Annual candidates use the correct neighboring night and contain all year-boundary dependencies',()=>{
  const result=buildNorthernContext(base);
  assert.equal(result.status,'available');
  assert.equal(result.metadata.firstPaddedDate,'2026-12-31');
  assert.equal(result.metadata.lastPaddedDate,'2028-01-01');
  assert.equal(result.days['2027-01-01'].previousNight.startDate,'2026-12-31');
  assert.equal(result.days['2027-12-31'].nightToNext.endDate,'2028-01-01');
  for(const date of ['2027-03-27','2027-03-28','2027-10-30','2027-10-31']){
    const night=result.days[date].nightToNext;
    assert.equal(night.realFajr,true);
    const N=(night.rawFajrEpochMilliseconds-night.maghribSelectedEpochMilliseconds)/60000;
    assert.ok(Math.abs(night.oneThirdMinutes-N/3)<1e-8);
    assert.equal(night.ishaEstimateEpochMilliseconds,
      night.maghribSelectedEpochMilliseconds+night.oneThirdMinutes*60000);
    assert.ok(night.ishaEstimateEpochMilliseconds<night.rawFajrEpochMilliseconds);
  }
  const missing=result.days[result.metadata.missingFajrStartDate].previousNight;
  assert.equal(missing.realFajr,false);
  assert.equal(missing.rawFajrEpochMilliseconds,null);
  assert.ok(Math.abs(missing.oneThirdMinutes-result.metadata.q*missing.ordinaryHorizonNightMinutes)<1e-8);
  assert.equal(result.days[result.metadata.missingFajrStartDate].fajr.eligible,false);
});
