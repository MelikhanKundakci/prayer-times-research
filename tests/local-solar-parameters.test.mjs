import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateLocalSolarDay} from '../core/local/solar.mjs';

const base={date:'2027-03-20',latitude:40.7128,longitude:-74.006,timeZone:'America/New_York'};
const epochs=day=>Object.fromEntries(Object.entries(day.events).map(([name,event])=>[name,event.epochMilliseconds]));

test('explicit defaults reproduce the default event instants and default model conventions',()=>{
  const implicit=calculateLocalSolarDay(base);
  const explicit=calculateLocalSolarDay({...base,fajrAngleDegrees:18,ishaAngleDegrees:17,asrShadowFactor:1,horizonDepressionDegrees:50/60});
  assert.deepEqual(epochs(explicit),epochs(implicit));
  assert.equal(explicit.model.id,implicit.model.id);
  assert.equal(explicit.model.asrConvention,implicit.model.asrConvention);
  assert.equal(explicit.model.asrShadowFactor,1);
  assert.equal(explicit.model.horizonDepressionDegrees,50/60);
  const legacyIsha16=calculateLocalSolarDay({...base,ishaAngleDegrees:16});
  const explicit16=calculateLocalSolarDay({...base,fajrAngleDegrees:18,ishaAngleDegrees:16,asrShadowFactor:1,horizonDepressionDegrees:50/60});
  assert.deepEqual(epochs(explicit16),epochs(legacyIsha16));
});

test('each configurable solar rule changes only its corresponding event family',()=>{
  const baseline=calculateLocalSolarDay(base),baselineEpochs=epochs(baseline);
  const fajr=epochs(calculateLocalSolarDay({...base,fajrAngleDegrees:17}));
  assert.notEqual(fajr.fajr,baselineEpochs.fajr);
  for(const event of ['sunrise','dhuhr','asr','maghrib','isha'])assert.equal(fajr[event],baselineEpochs[event],event);

  const isha=epochs(calculateLocalSolarDay({...base,ishaAngleDegrees:16}));
  assert.notEqual(isha.isha,baselineEpochs.isha);
  for(const event of ['fajr','sunrise','dhuhr','asr','maghrib'])assert.equal(isha[event],baselineEpochs[event],event);

  const horizon=epochs(calculateLocalSolarDay({...base,horizonDepressionDegrees:.8}));
  for(const event of ['sunrise','maghrib'])assert.notEqual(horizon[event],baselineEpochs[event],event);
  for(const event of ['fajr','dhuhr','asr','isha'])assert.equal(horizon[event],baselineEpochs[event],event);

  const factorTwoDay=calculateLocalSolarDay({...base,asrShadowFactor:2}),factorTwo=epochs(factorTwoDay);
  assert.ok(factorTwo.asr>baselineEpochs.asr,'factor-two Asr occurs later than factor-one Asr');
  assert.equal(factorTwoDay.transit.asrThresholdDegrees<baseline.transit.asrThresholdDegrees,true);
  for(const event of ['fajr','sunrise','dhuhr','maghrib','isha'])assert.equal(factorTwo[event],baselineEpochs[event],event);
  assert.equal(factorTwoDay.model.asrShadowFactor,2);
  assert.match(factorTwoDay.model.asrConvention,/factor-two/);
});

test('parameter input remains strict about own data, explicit undefined, and domains',()=>{
  for(const key of ['fajrAngleDegrees','ishaAngleDegrees','asrShadowFactor','horizonDepressionDegrees','solarModel']){
    assert.throws(()=>calculateLocalSolarDay({...base,[key]:undefined}),/must be omitted or set/);
  }
  const getter={...base};Object.defineProperty(getter,'fajrAngleDegrees',{enumerable:true,get(){return 18;}});
  assert.throws(()=>calculateLocalSolarDay(getter),/Expected own data fields/);
  for(const value of [0,-1,30.01,NaN,Infinity])assert.throws(()=>calculateLocalSolarDay({...base,fajrAngleDegrees:value}),/fajrAngleDegrees/);
  for(const value of [0,-1,30.01,NaN,Infinity])assert.throws(()=>calculateLocalSolarDay({...base,ishaAngleDegrees:value}),/ishaAngleDegrees/);
  for(const value of [0,1.5,3,NaN,Infinity])assert.throws(()=>calculateLocalSolarDay({...base,asrShadowFactor:value}),/asrShadowFactor/);
  for(const value of [null,'unknown',0])assert.throws(()=>calculateLocalSolarDay({...base,solarModel:value}),/solarModel/);
  for(const value of [0,-1,2.01,NaN,Infinity])assert.throws(()=>calculateLocalSolarDay({...base,horizonDepressionDegrees:value}),/horizonDepressionDegrees/);
});

