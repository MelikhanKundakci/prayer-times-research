import test from 'node:test';
import assert from 'node:assert/strict';
import {selectNightFraction} from '../core/local/night-fraction.mjs';

const H=12*60*60_000,M=Date.parse('2027-06-20T20:00:00Z'),R=M+H;
const select=(changes={})=>selectNightFraction({event:'fajr',rawEpochMilliseconds:M+9*60*60_000,
  rawStatus:'calculated',rawReason:null,sunsetEpochMilliseconds:M,sunriseEpochMilliseconds:R,
  angleDegrees:18,...changes});

test('Fajr keeps a raw crossing inside its angle/60 night limit',()=>{
  const raw=M+9*60*60_000,result=select({rawEpochMilliseconds:raw});
  assert.equal(result.status,'calculated');
  assert.equal(result.epochMilliseconds,raw);
  assert.equal(result.selection.mode,'raw');
  assert.equal(result.selection.nightFraction,.3);
  assert.equal(result.selection.candidateEpochMilliseconds,R-.3*H);
});

test('Fajr caps an overly early raw crossing at sunrise minus angle/60 of the actual night',()=>{
  const result=select({rawEpochMilliseconds:M+2*60*60_000});
  assert.equal(result.status,'estimated');
  assert.equal(result.reason,'angle-over-60-night-cap');
  assert.equal(result.epochMilliseconds,R-.3*H);
  assert.ok(result.epochMilliseconds> M+2*60*60_000);
  assert.equal(result.selection.rawEpochMilliseconds,M+2*60*60_000);
});

test('Isha caps a late raw crossing at sunset plus angle/60 of the actual night',()=>{
  const raw=M+10*60*60_000,result=select({event:'isha',angleDegrees:17,
    rawEpochMilliseconds:raw,sunriseEpochMilliseconds:R});
  const candidate=M+(17/60)*H;
  assert.equal(result.status,'estimated');
  assert.equal(result.epochMilliseconds,candidate);
  assert.equal(result.selection.candidateEpochMilliseconds,candidate);
  assert.equal(result.selection.mode,'night-fraction');
});

test('Isha keeps a raw crossing before its selected night limit',()=>{
  const raw=M+2*60*60_000,result=select({event:'isha',angleDegrees:17,rawEpochMilliseconds:raw});
  assert.equal(result.status,'calculated');
  assert.equal(result.epochMilliseconds,raw);
});

test('only the two proven seasonal absence reasons receive a candidate',()=>{
  for(const rawReason of ['sun-continuously-above-threshold','tangent-without-directed-crossing']){
    const result=select({rawEpochMilliseconds:null,rawStatus:'unavailable',rawReason});
    assert.equal(result.status,'estimated');
    assert.equal(result.epochMilliseconds,R-.3*H);
    assert.equal(result.selection.rawEpochMilliseconds,null);
  }
  for(const rawReason of ['sun-continuously-below-threshold','nonfinite-solar-altitude','ambiguous-solar-crossing']){
    const result=select({rawEpochMilliseconds:null,rawStatus:'unavailable',rawReason});
    assert.equal(result.status,'policy-blocked');
    assert.equal(result.epochMilliseconds,null);
    assert.equal(result.reason,'raw-crossing-unavailable-for-nonseasonal-reason');
  }
});

test('actual UTC endpoints work across midnight without clock wrapping',()=>{
  const sunset=Date.parse('2027-06-20T21:15:00Z'),sunrise=Date.parse('2027-06-21T03:45:00Z');
  const result=select({sunsetEpochMilliseconds:sunset,sunriseEpochMilliseconds:sunrise,
    rawEpochMilliseconds:sunset+60*60_000});
  const candidate=sunrise-.3*(sunrise-sunset);
  assert.equal(result.status,'estimated');
  assert.equal(result.epochMilliseconds,candidate);
  assert.equal(new Date(result.epochMilliseconds).toISOString(),'2027-06-21T01:48:00.000Z');
  assert.equal(result.selection.horizonNightMinutes,390);
});

test('missing horizon endpoints and nights outside the declared range are blocked',()=>{
  for(const changes of [
    {sunsetEpochMilliseconds:null},
    {sunriseEpochMilliseconds:NaN},
    {sunriseEpochMilliseconds:M},
    {sunriseEpochMilliseconds:M+24*60*60_000},
    {sunriseEpochMilliseconds:M-1},
  ]){
    const result=select(changes);
    assert.equal(result.status,'policy-blocked');
    assert.equal(result.epochMilliseconds,null);
  }
});

test('inconsistent raw status, event, angle and epochs are rejected or blocked safely',()=>{
  assert.throws(()=>select({event:'maghrib'}),/event must be fajr or isha/);
  assert.throws(()=>select({angleDegrees:30}),/angleDegrees/);
  assert.throws(()=>select({angleDegrees:0}),/angleDegrees/);
  assert.throws(()=>select({rawStatus:'calculated',rawEpochMilliseconds:null}),/calculated raw event/);
  assert.throws(()=>select({rawStatus:'unavailable',rawEpochMilliseconds:M}),/unavailable raw event/);
  assert.throws(()=>select({rawStatus:'failed',rawEpochMilliseconds:null,rawReason:'x'}),/rawStatus/);
  assert.equal(select({rawEpochMilliseconds:R+1}).reason,'raw-crossing-outside-horizon-night');
  assert.equal(select({rawEpochMilliseconds:M}).reason,'raw-crossing-outside-horizon-night');
});

test('input is strict and unknown or accessor fields are rejected',()=>{
  assert.throws(()=>select({extra:true}),/Unknown field/);
  const unsafe={event:'fajr',rawEpochMilliseconds:null,rawStatus:'unavailable',rawReason:'sun-continuously-above-threshold',
    sunsetEpochMilliseconds:M,sunriseEpochMilliseconds:R,angleDegrees:18};
  Object.defineProperty(unsafe,'angleDegrees',{enumerable:true,get(){throw new Error('not invoked');}});
  assert.throws(()=>selectNightFraction(unsafe),/data fields/);
});
