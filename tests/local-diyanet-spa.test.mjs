import test from 'node:test';
import assert from 'node:assert/strict';
import {buildNorthernContext} from '../core/local/northern.mjs';
import {calculateLocalDay,LOCAL_DIYANET_SPA_PROFILE,LOCAL_PROFILE,LOCAL_VERSION} from '../core/local/index.mjs';

const point={latitude:50.1109,longitude:8.6821,timeZone:'Europe/Berlin'};
const day=(date,profile,where=point)=>calculateLocalDay({date,...where,profile});
const rawEvents=result=>Object.fromEntries(Object.entries(result.events).map(([name,event])=>[name,event.rawEpochMilliseconds]));
const contextView=result=>({model:result.calculation.northernPolicy.metadata.solarModel,
  provider:result.calculation.northernPolicy.metadata.solarProvider,
  q:result.calculation.northernPolicy.metadata.q,
  anchor:result.calculation.northernPolicy.metadata.anchorDate,
  thresholds:[result.calculation.northernPolicy.metadata.annualIshaTransitionLowerPhaseMinutes,
    result.calculation.northernPolicy.metadata.annualFajrTransitionUpperPhaseMinutes]});

test('new Diyanet SPA profile preserves published parameters and labels its astronomy provider',()=>{
  const result=day('2026-09-26',LOCAL_DIYANET_SPA_PROFILE);
  assert.equal(LOCAL_VERSION,'0.6.0');
  assert.equal(result.profile.id,'diyanet-published-spa-point-v1');
  assert.equal(result.profile.official,false);
  assert.equal(result.profile.institutionalEquivalence,'not-claimed');
  assert.equal(result.calculation.astronomicalModel.id,'SPA-continuous-point-v1');
  assert.equal(result.calculation.northernPolicy.metadata.solarModel,'spa');
  assert.equal(result.calculation.northernPolicy.metadata.solarProvider,'SPA-continuous-point-v1');
  assert.equal(result.calculation.northernPolicy.status,'available');
  assert.equal(result.events.fajr.status,'calculated');
  assert.equal(result.events.isha.status,'calculated');
  assert.equal(result.astronomy.events.fajr.thresholdDegrees,-18);
  assert.equal(result.astronomy.events.isha.thresholdDegrees,-16);
  assert.equal(result.events.sunrise.adjustmentMinutes,-7);
  assert.equal(result.events.dhuhr.adjustmentMinutes,5);
  assert.equal(result.events.asr.adjustmentMinutes,4);
  assert.equal(result.events.maghrib.adjustmentMinutes,7);
  assert.equal(result.events.fajr.adjustmentMinutes,0);
  assert.equal(result.events.isha.adjustmentMinutes,0);
  assert.ok(Object.values(result.events).every(event=>event.status==='calculated'));
});

test('existing Diyanet USNO raw event values remain unchanged',()=>{
  const result=day('2026-09-26',LOCAL_PROFILE);
  assert.deepEqual(rawEvents(result),{
    fajr:1790393283618.7983,
    sunrise:1790399427578.8643,
    dhuhr:1790421695749.1086,
    asr:1790433294080.2227,
    maghrib:1790443308247.312,
    isha:1790448637175.3535,
  });
  assert.equal(result.calculation.astronomicalModel.id,'USNO-continuous-point-v1');
  assert.equal(result.calculation.northernPolicy.metadata.solarModel,'usno');
});

test('northern annual context uses one selected provider for every padded solar row',()=>{
  const input={year:2027,...point};
  const usno=buildNorthernContext(input);
  const spa=buildNorthernContext({...input,solarModel:'spa'});
  assert.equal(usno.metadata.solarModel,'usno');
  assert.equal(usno.metadata.solarProvider,'USNO-continuous-point-v1');
  assert.equal(spa.metadata.solarModel,'spa');
  assert.equal(spa.metadata.solarProvider,'SPA-continuous-point-v1');
  assert.notEqual(spa.metadata.q,usno.metadata.q);
  assert.notEqual(spa.days['2027-01-15'].fajr.rawEpochMilliseconds,usno.days['2027-01-15'].fajr.rawEpochMilliseconds);
  assert.equal(spa.days['2026-12-31'].nightToNext.startDate,'2026-12-31');
  assert.equal(spa.days['2028-01-01'].previousNight.endDate,'2028-01-01');
});

test('provider-aware northern cache remains isolated in both request orders',()=>{
  const first={date:'2026-09-26',...point};
  const u1=day(first.date,LOCAL_PROFILE,first),s1=day(first.date,LOCAL_DIYANET_SPA_PROFILE,first),u2=day(first.date,LOCAL_PROFILE,first);
  assert.deepEqual(rawEvents(u1),rawEvents(u2));
  assert.deepEqual(contextView(u1),contextView(u2));
  assert.equal(contextView(s1).model,'spa');
  assert.notEqual(contextView(s1).q,contextView(u1).q);

  const second={date:'2028-09-26',...point};
  const s2=day(second.date,LOCAL_DIYANET_SPA_PROFILE,second),u3=day(second.date,LOCAL_PROFILE,second),s3=day(second.date,LOCAL_DIYANET_SPA_PROFILE,second);
  assert.deepEqual(rawEvents(s2),rawEvents(s3));
  assert.deepEqual(contextView(s2),contextView(s3));
  assert.equal(contextView(u3).model,'usno');
  assert.notEqual(contextView(s2).q,contextView(u3).q);
});

test('SPA Diyanet profile does not invent summer twilight or polar horizons',()=>{
  const summer=day('2027-06-21',LOCAL_DIYANET_SPA_PROFILE);
  assert.equal(summer.calculation.northernPolicy.metadata.solarModel,'spa');
  assert.equal(summer.events.fajr.status,'policy-blocked');
  assert.equal(summer.events.isha.status,'policy-blocked');
  assert.equal(summer.events.fajr.epochMilliseconds,null);
  assert.equal(summer.events.isha.epochMilliseconds,null);

  const polar=day('2027-12-21',LOCAL_DIYANET_SPA_PROFILE,{latitude:80,longitude:0,timeZone:'UTC'});
  assert.equal(polar.calculation.northernPolicy.metadata.solarModel,'spa');
  assert.equal(polar.events.fajr.status,'policy-blocked');
  assert.equal(polar.events.sunrise.status,'policy-blocked');
  assert.equal(polar.events.maghrib.status,'policy-blocked');
  assert.equal(polar.events.dhuhr.status,'calculated');
});

test('optional northern provider is strict and the day API does not accept provider overrides',()=>{
  const base={year:2027,...point};
  assert.throws(()=>buildNorthernContext({...base,solarModel:undefined}),TypeError);
  assert.throws(()=>buildNorthernContext({...base,solarModel:null}),RangeError);
  assert.throws(()=>buildNorthernContext({...base,solarModel:'other'}),RangeError);
  let read=false;
  const getter={...base};Object.defineProperty(getter,'solarModel',{enumerable:true,get(){read=true;return'spa';}});
  assert.throws(()=>buildNorthernContext(getter),TypeError);assert.equal(read,false);
  assert.throws(()=>day('2027-01-15',LOCAL_DIYANET_SPA_PROFILE,{...point,solarModel:'usno'}),TypeError);
});
