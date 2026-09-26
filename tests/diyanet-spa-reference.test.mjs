import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateCalendar,EVENTS,ADJUSTMENTS} from '../methods/diyanet/research/spa-reference/calendar.mjs';
import {solarCoordinatesUSNO,withSolarMode,coordinatesFor} from '../methods/diyanet/research/spa-reference/adapter.mjs';
import {calculateMissingWindowCalendar as north} from '../methods/diyanet/implementation/missing-window/model.mjs';
import {calculateYear as low} from '../methods/diyanet/implementation/low-latitude/model.mjs';
import {calculateYear as south} from '../methods/diyanet/implementation/south/model.mjs';
import {traceCalendar} from '../methods/diyanet/research/spa-reference/transition-audit/trace.mjs';

test('SPA geocentric intermediates match the official example and separate pvlib grid',async()=>{
  await import('../methods/diyanet/research/spa-reference/astronomy/spa.test.mjs');
});

test('solar provider requires a synchronous context and resets after failure',()=>{
  assert.throws(()=>solarCoordinatesUSNO(2461000),/context/);
  assert.throws(()=>withSolarMode('unknown',()=>null),/mode/);
  assert.throws(()=>withSolarMode('baseline',()=>withSolarMode('spa-utc00',()=>null)),/Nested/);
  assert.throws(()=>withSolarMode('baseline',()=>Promise.resolve(1)),/synchronous/);
  assert.throws(()=>solarCoordinatesUSNO(2461000),/context/);
  assert.deepEqual(withSolarMode('spa-utc00',()=>solarCoordinatesUSNO(2461000)),coordinatesFor('spa-utc00',2461000));
});

const inputs=[
  {year:2026,latitude:52.52,longitude:13.405,timeZone:'Europe/Berlin'},
  {year:2026,latitude:41.01,longitude:28.98,timeZone:'Europe/Istanbul'},
  {year:2026,latitude:-33.93,longitude:18.42,timeZone:'Africa/Johannesburg'},
];
test('baseline injection preserves all raw and rounded fields on all three complete-year routes',()=>{
  for(const input of inputs){
    const r=calculateCalendar(input,'baseline');
    const expected=r.route==='north'?north(input):r.route==='low'?low(input):south({...input,variant:'usno-daily-utc0'});
    assert.deepEqual(r.annual,expected);
    assert.equal(r.notificationEligible,false);
  }
});

test('SPA complete-year traces retain adjusted instants, rounding and disabled notification eligibility',()=>{
  const originalFetch=globalThis.fetch;
  globalThis.fetch=()=>{throw new Error('Network access is forbidden in calculation');};
  try{
    for(const input of inputs){
      const r=calculateCalendar(input,'spa-utc00');
      const traced=traceCalendar({route:r.route,location:input},r.annual,jd=>coordinatesFor('spa-utc00',jd));
      assert.equal(traced.days.length,365);
      assert.equal(r.official,false);assert.equal(r.notificationEligible,false);
      for(let i=0;i<365;i++)for(let j=0;j<EVENTS.length;j++){
        const e=EVENTS[j],out=r.annual.days[i].events[e],trace=traced.days[i].events[e];
        const raw=out.rawEpoch===null?null:out.rawEpoch+(r.route==='north'?0:ADJUSTMENTS[j]*60000);
        assert.equal(trace.temkinAdjustedRawEpoch,raw);
        assert.equal(trace.roundedEpoch,raw===null?null:Math.floor(raw/60000+.5)*60000);
        assert.equal(JSON.stringify(trace).includes('continuousAsr'),false);
      }
    }
  }finally{globalThis.fetch=originalFetch;}
});
