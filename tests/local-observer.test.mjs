import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateObserverDay,calculateObserverSchedule,getObserverProfile,listObserverProfiles,LOCAL_OBSERVER_PROFILES,LOCAL_OBSERVER_VERSION} from '../core/local/observer.mjs';
import {calculateLocalDay,LOCAL_VERSION} from '../core/local/index.mjs';
import {getLocalProfile} from '../core/local/profiles.mjs';
import {calculateLocalSchedule,createLocalScheduleCalculator,nextLocalPrayer} from '../core/local/schedule.mjs';

const cairo={date:'2027-03-20',latitude:30.0444,longitude:31.2357,timeZone:'Africa/Cairo'};
const observer='local-18-17-shadow1-physical-observer-v1';

test('all 16 observer compositions retain explicit rule roles and margins with isolated identities',()=>{
  assert.equal(LOCAL_OBSERVER_PROFILES.length,16);
  for(const profile of listObserverProfiles()){
    const day=calculateObserverDay({...cairo,profile:profile.id});
    assert.equal(day.coverage.prayerStartsComplete,true);
    assert.equal(day.calculation.astronomicalModel.solarModel,'spa-topocentric');
    assert.equal(day.calculation.astronomicalModel.observerElevationMetres,0);
    assert.equal(day.profile.institutionalEquivalence,'not-claimed');
    assert.equal(day.calculation.northernPolicy,null);
    assert.equal(day.events.sunrise.role,'sunrise-marker');
    assert.equal(day.events.dhuhr.rawEpochMilliseconds-day.astronomy.events.dhuhr.epochMilliseconds,60000);
    for(const name of ['fajr','asr','maghrib','isha']){
      assert.equal(day.events[name].role,'prayer-start-model');
      assert.equal(day.events[name].rawEpochMilliseconds,day.astronomy.events[name].epochMilliseconds);
      assert.equal(day.events[name].calendarUtc,new Date(day.events[name].roundedEpochMilliseconds).toISOString());
    }
  }
  const definitions=listObserverProfiles();definitions[0].astronomy.fajrAngleDegrees=29;
  assert.notEqual(getObserverProfile(definitions[0].id).astronomy.fajrAngleDegrees,29);
  assert.ok(Object.isFrozen(getObserverProfile(observer).astronomy));
  assert.throws(()=>calculateLocalDay({...cairo,profile:observer}),/profile/i);
  assert.throws(()=>calculateObserverDay({...cairo,profile:'local-18-17-shadow1-physical-v1'}),/profile/i);
});

test('observer night estimates use the adjacent observer horizon and never invent polar endpoints',()=>{
  const input={date:'2027-06-21',latitude:50.1109,longitude:8.6821,timeZone:'Europe/Berlin',profile:'local-18-17-shadow1-angle-night-observer-v1'};
  const day=calculateObserverDay(input);
  const previous=calculateObserverDay({...input,date:'2027-06-20'});
  const next=calculateObserverDay({...input,date:'2027-06-22'});
  assert.deepEqual(day.coverage.estimatedEvents,['fajr','isha']);
  assert.equal(day.events.fajr.selection.sunsetEpochMilliseconds,previous.astronomy.events.maghrib.epochMilliseconds);
  assert.equal(day.events.isha.selection.sunriseEpochMilliseconds,next.astronomy.events.sunrise.epochMilliseconds);
  assert.equal(day.events.fajr.ruleEvidence.classification,'software-estimate');
  assert.ok(day.events.isha.epochMilliseconds<next.events.fajr.epochMilliseconds);
  const polar=calculateObserverDay({...input,latitude:78.2232,longitude:15.6469,timeZone:'Arctic/Longyearbyen'});
  for(const name of ['fajr','isha']){
    assert.equal(polar.events[name].status,'policy-blocked');
    assert.equal(polar.events[name].reason,'required-horizon-event-unavailable');
    assert.equal(polar.events[name].utc,null);
  }
  assert.equal(polar.coverage.prayerStartsComplete,false);
});

test('observer schedules preserve source-day ownership through DST and date-line cases',()=>{
  for(const point of [
    {startDate:'2027-03-27',latitude:50.1109,longitude:8.6821,timeZone:'Europe/Berlin'},
    {startDate:'2027-10-30',latitude:50.1109,longitude:8.6821,timeZone:'Europe/Berlin'},
    {startDate:'2027-03-20',latitude:1.8721,longitude:-157.4278,timeZone:'Pacific/Kiritimati'},
  ]){
    const schedule=calculateObserverSchedule({...point,dayCount:3,profile:observer});
    assert.equal(schedule.complete,true);
    assert.equal(schedule.entries.length,15);
    assert.equal(schedule.context.calculationVersion,LOCAL_OBSERVER_VERSION);
    assert.ok(schedule.entries.every((e,i,a)=>i===0||a[i-1].epochMilliseconds<e.epochMilliseconds));
    for(const {sourceDate} of schedule.days){
      const {startDate,...location}=point;
      const day=calculateObserverDay({...location,date:sourceDate,profile:observer});
      for(const event of schedule.entries.filter(e=>e.sourceDate===sourceDate))
        assert.equal(event.epochMilliseconds,day.events[event.event].epochMilliseconds);
    }
    const first=schedule.entries[0];
    assert.deepEqual(nextLocalPrayer(schedule,first.epochMilliseconds),first);
  }
  const skipped=calculateObserverSchedule({startDate:'2011-12-30',dayCount:2,latitude:-13.8333,longitude:-171.75,timeZone:'Pacific/Apia',profile:observer});
  assert.equal(skipped.days[0].reason,'solar-date-unavailable');
  assert.equal(skipped.days[1].complete,true);
});

test('new profile inputs reject undeclared adjustments and schedule reuse preserves legacy outputs',()=>{
  for(const extra of [{elevation:100},{solarModel:'spa'},{offsetMinutes:2},{language:'de'}])
    assert.throws(()=>calculateObserverDay({...cairo,profile:observer,...extra}));
  assert.throws(()=>calculateObserverSchedule({startDate:cairo.date,dayCount:0,latitude:cairo.latitude,longitude:cairo.longitude,timeZone:cairo.timeZone,profile:observer}));
  const reused=createLocalScheduleCalculator({calculateDay:calculateLocalDay,getProfile:getLocalProfile,version:LOCAL_VERSION});
  for(const profile of ['local-18-17-shadow1-physical-v1','local-15-15-shadow2-angle-night-v1']){
    const input={startDate:'2027-06-21',dayCount:2,latitude:50.1109,longitude:8.6821,timeZone:'Europe/Berlin',profile};
    assert.deepEqual(reused(input),calculateLocalSchedule(input));
  }
  assert.throws(()=>createLocalScheduleCalculator({calculateDay:null,getProfile:getLocalProfile,version:'x'}),TypeError);
});
