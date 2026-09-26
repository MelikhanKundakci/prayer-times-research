import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateLocalDay} from '../core/local/index.mjs';
const day=(changes={})=>calculateLocalDay({date:'2027-03-20',latitude:30.0444,longitude:31.2357,timeZone:'Africa/Cairo',profile:'local-18-17-shadow1-physical-v1',...changes});
const prayers=['fajr','dhuhr','asr','maghrib','isha'];

test('complete compositions explicitly select twilight pair and Asr without importing institutional margins',()=>{
  for(const [pair,fajr,isha] of [['18-17',18,17],['19p5-17p5',19.5,17.5],['15-15',15,15],['13-13',13,13]]){
    const one=day({profile:`local-${pair}-shadow1-physical-v1`}),two=day({profile:`local-${pair}-shadow2-physical-v1`});
    assert.equal(one.coverage.prayerStartsComplete,true);assert.equal(two.coverage.prayerStartsComplete,true);
    assert.equal(one.astronomy.model.id,'SPA-continuous-point-v1');
    assert.equal(one.astronomy.events.fajr.thresholdDegrees,-fajr);assert.equal(one.astronomy.events.isha.thresholdDegrees,-isha);
    assert.equal(one.events.dhuhr.rawEpochMilliseconds-one.astronomy.events.dhuhr.epochMilliseconds,60000);
    assert.equal(one.events.maghrib.rawEpochMilliseconds,one.astronomy.events.maghrib.epochMilliseconds);
    assert.ok(two.events.asr.epochMilliseconds>one.events.asr.epochMilliseconds);
    for(const event of prayers.filter(n=>n!=='asr'))assert.equal(one.events[event].epochMilliseconds,two.events[event].epochMilliseconds);
    assert.equal(one.events.sunrise.role,'sunrise-marker');assert.equal(one.profile.official,false);
  }
});

test('optional adjacent-night estimates complete summer Frankfurt and Oslo without changing the physical-only profile',()=>{
  for(const [latitude,longitude,timeZone] of [[50.1109,8.6821,'Europe/Berlin'],[59.9139,10.7522,'Europe/Oslo']]){
    const point={date:'2027-06-21',latitude,longitude,timeZone};
    const physical=day(point),estimated=day({...point,profile:'local-18-17-shadow1-angle-night-v1'});
    assert.equal(physical.coverage.prayerStartsComplete,false);
    assert.equal(estimated.coverage.prayerStartsComplete,true);
    for(const event of ['fajr','isha']){
      assert.equal(estimated.events[event].status,'estimated');
      assert.equal(estimated.events[event].ruleEvidence.classification,'software-estimate');
      const selection=estimated.events[event].selection;
      assert.ok(selection.sunsetEpochMilliseconds<selection.selectedEpochMilliseconds);
      assert.ok(selection.selectedEpochMilliseconds<selection.sunriseEpochMilliseconds);
      assert.ok(selection.horizonNightMilliseconds>0);
    }
    for(const event of ['sunrise','dhuhr','asr','maghrib'])assert.equal(physical.events[event].epochMilliseconds,estimated.events[event].epochMilliseconds);
    const tomorrow=day({...point,date:'2027-06-22',profile:'local-18-17-shadow1-angle-night-v1'});
    assert.ok(estimated.events.maghrib.epochMilliseconds<estimated.events.isha.epochMilliseconds);
    assert.ok(estimated.events.isha.epochMilliseconds<tomorrow.events.fajr.epochMilliseconds);
    assert.ok(tomorrow.events.fajr.epochMilliseconds<tomorrow.events.sunrise.epochMilliseconds);
  }
});

test('angle-night is explicit software selection in both hemispheres and preserves polar absence',()=>{
  const south=day({date:'2027-12-21',latitude:-55,longitude:-68.3,timeZone:'America/Argentina/Ushuaia',profile:'local-18-17-shadow1-angle-night-v1'});
  assert.equal(south.coverage.prayerStartsComplete,true);
  assert.ok(south.coverage.estimatedEvents.length>0);
  for(const latitude of [-80,80]){
    const polar=day({date:'2027-06-21',latitude,longitude:0,timeZone:'UTC',profile:'local-18-17-shadow1-angle-night-v1'});
    assert.equal(polar.coverage.prayerStartsComplete,false);
    for(const event of ['fajr','isha']){assert.equal(polar.events[event].epochMilliseconds,null);assert.equal(polar.events[event].status,'policy-blocked');}
  }
});

test('a missing adjacent civil day cannot be replaced by a fabricated 24-hour night',()=>{
  const d=day({date:'2011-12-29',latitude:-13.83,longitude:-171.75,timeZone:'Pacific/Apia',profile:'local-18-17-shadow1-angle-night-v1'});
  assert.equal(d.events.isha.status,'policy-blocked');assert.equal(d.events.isha.epochMilliseconds,null);
  assert.equal(d.events.isha.reason,'required-horizon-event-unavailable');
  assert.equal(d.events.maghrib.status,'calculated');
});
