import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LOCAL_SUNNI_VERSION, LOCAL_SUNNI_PROFILES, listSunniMethods, listSunniProfiles,
  getSunniProfile, calculateSunniDay, calculateSunniSchedule,
} from '../core/local/sunni.mjs';
import {calculateLocalDay} from '../core/local/index.mjs';

const point={latitude:40.7128,longitude:-74.006,timeZone:'America/New_York'};
const date='2026-06-21';
const uqMonth=date=>Number(new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura-nu-latn',{
  timeZone:'UTC',month:'numeric'}).formatToParts(new Date(`${date}T12:00:00Z`)).find(part=>part.type==='month').value);

test('Sunni registry exposes the declared eight method families and immutable profile identities',()=>{
  assert.equal(LOCAL_SUNNI_VERSION,'0.1.0-sunni');
  assert.equal(LOCAL_SUNNI_PROFILES.length,23);
  assert.equal(listSunniProfiles().length,23);
  assert.deepEqual(listSunniMethods().map(method=>method.id),[
    'mwl','karachi','egyptian','umm-al-qura','isna','diyanet','kemenag','jakim',
  ]);
  assert.equal(listSunniMethods().length,8);
  assert.equal(getSunniProfile('sunni-mwl-shadow1-physical-v1').astronomy.fajrAngleDegrees,18);
  assert.equal(getSunniProfile('sunni-mwl-shadow1-physical-v1').astronomy.ishaAngleDegrees,17);
  assert.equal(getSunniProfile('sunni-karachi-shadow2-angle-night-v1').astronomy.asrShadowFactor,2);
  assert.equal(getSunniProfile('sunni-egyptian-shadow1-physical-v1').events.fajr.evidence,'published-criterion');
  assert.equal(getSunniProfile('sunni-isna-shadow1-physical-v1').astronomy.fajrAngleDegrees,15);
  assert.throws(()=>getSunniProfile('mwl'),RangeError);
  const listed=listSunniProfiles();
  listed[0].astronomy.fajrAngleDegrees=1;
  assert.equal(getSunniProfile('sunni-mwl-shadow1-physical-v1').astronomy.fajrAngleDegrees,18);
  assert.throws(()=>{getSunniProfile('sunni-mwl-shadow1-physical-v1').astronomy.fajrAngleDegrees=1;},TypeError);
});

test('Asr factor changes only the Asr geometry in a composed profile',()=>{
  const one=calculateSunniDay({date,...point,profile:'sunni-karachi-shadow1-physical-v1'});
  const two=calculateSunniDay({date,...point,profile:'sunni-karachi-shadow2-physical-v1'});
  assert.notEqual(one.events.asr.rawEpochMilliseconds,two.events.asr.rawEpochMilliseconds);
  for(const name of ['fajr','sunrise','dhuhr','maghrib','isha'])
    assert.equal(one.events[name].rawEpochMilliseconds,two.events[name].rawEpochMilliseconds,name);
  assert.equal(one.profile.official,false);
  assert.equal(one.profile.institutionalEquivalence,'not-claimed');
});

test('Umm al-Qura calendar selection follows the source civil date; explicit modes stay distinct',()=>{
  const yearDates=Array.from({length:366},(_,index)=>new Date(Date.UTC(2026,0,1+index)).toISOString().slice(0,10));
  const ramadanDates=yearDates.filter(value=>uqMonth(value)===9);
  const firstRamadan=ramadanDates[0],lastRamadan=ramadanDates.at(-1);
  const previousDate=new Date(Date.parse(`${firstRamadan}T00:00:00Z`)-86400000).toISOString().slice(0,10);
  const followingDate=new Date(Date.parse(`${lastRamadan}T00:00:00Z`)+86400000).toISOString().slice(0,10);
  const ordinary=Array.from({length:366},(_,index)=>new Date(Date.UTC(2026,0,1+index)).toISOString().slice(0,10))
    .find(value=>uqMonth(value)===8);
  assert.ok(firstRamadan&&lastRamadan&&ordinary);
  const input={...point,latitude:21.4225,longitude:39.8262,timeZone:'Europe/Berlin'};
  const calendarRamadan=calculateSunniDay({date:firstRamadan,...input,profile:'sunni-umm-al-qura-shadow1-calendar-v1'});
  const calendarOrdinary=calculateSunniDay({date:ordinary,...input,profile:'sunni-umm-al-qura-shadow1-calendar-v1'});
  const explicitRamadan=calculateSunniDay({date:ordinary,...input,profile:'sunni-umm-al-qura-shadow1-ramadan-v1'});
  const explicitOrdinary=calculateSunniDay({date:firstRamadan,...input,profile:'sunni-umm-al-qura-shadow1-ordinary-v1'});
  const calendarLastRamadan=calculateSunniDay({date:lastRamadan,...input,profile:'sunni-umm-al-qura-shadow1-calendar-v1'});
  const calendarAfterRamadan=calculateSunniDay({date:followingDate,...input,profile:'sunni-umm-al-qura-shadow1-calendar-v1'});
  const calendarBeforeRamadan=calculateSunniDay({date:previousDate,...input,profile:'sunni-umm-al-qura-shadow1-calendar-v1'});
  assert.equal(calendarRamadan.calculation.intervalPolicy.calendarMonth,9);
  assert.equal(calendarRamadan.calculation.intervalPolicy.minutes,120);
  assert.equal(calendarLastRamadan.calculation.intervalPolicy.calendarMonth,9);
  assert.equal(calendarLastRamadan.calculation.intervalPolicy.minutes,120);
  assert.equal(calendarBeforeRamadan.calculation.intervalPolicy.minutes,90);
  assert.equal(calendarAfterRamadan.calculation.intervalPolicy.minutes,90);
  assert.equal(calendarOrdinary.calculation.intervalPolicy.calendarMonth,8);
  assert.equal(calendarOrdinary.calculation.intervalPolicy.minutes,90);
  assert.equal(explicitRamadan.calculation.intervalPolicy.minutes,120);
  assert.equal(explicitOrdinary.calculation.intervalPolicy.minutes,90);
  for(const result of [calendarRamadan,calendarOrdinary,explicitRamadan,explicitOrdinary]){
    const isha=result.events.isha;
    assert.equal(isha.rawEpochMilliseconds-isha.basis.sunsetEpochMilliseconds,isha.basis.intervalMinutes*60000);
    assert.equal(isha.selection.institutionalAnnouncement,false);
    assert.equal(result.astronomy.events.isha.status,'not-applicable');
    assert.equal(result.astronomy.model.ishaAngleDegrees,null);
  }
});

test('Sunset interval remains 120 elapsed minutes across an actual IANA clock transition',()=>{
  // Deliberately mismatched solar point and civil zone place sunset/isha on opposite sides
  // of Berlin's spring clock change; it exercises zone conversion, not a plausible location.
  const result=calculateSunniDay({date:'2026-03-28',latitude:0,longitude:-100,timeZone:'Europe/Berlin',
    profile:'sunni-umm-al-qura-shadow1-ramadan-v1'});
  assert.equal(result.events.isha.rawEpochMilliseconds-result.events.maghrib.rawEpochMilliseconds,120*60000);
  assert.equal(result.events.isha.basis.operationOrder,'physical-sunset-plus-elapsed-interval');
  const offset=epoch=>new Intl.DateTimeFormat('en-US',{timeZone:'Europe/Berlin',timeZoneName:'shortOffset'})
    .formatToParts(epoch).find(part=>part.type==='timeZoneName').value;
  assert.notEqual(offset(result.events.maghrib.rawEpochMilliseconds),offset(result.events.isha.rawEpochMilliseconds));
  const wallMinute=event=>Date.parse(`${event.localDate}T${event.time}:00Z`)/60000;
  assert.equal(wallMinute(result.events.isha)-wallMinute(result.events.maghrib),180);
});

test('No twilight or interval estimate is fabricated when the required solar horizon is absent',()=>{
  const location={date:'2027-06-21',latitude:69.65,longitude:18.96,timeZone:'Europe/Oslo'};
  const physical=calculateSunniDay({...location,profile:'sunni-mwl-shadow1-physical-v1'});
  const limited=calculateSunniDay({...location,profile:'sunni-mwl-shadow1-angle-night-v1'});
  const interval=calculateSunniDay({...location,profile:'sunni-umm-al-qura-shadow1-calendar-v1'});
  assert.equal(physical.events.maghrib.status,'unavailable');
  assert.equal(physical.events.isha.status,'unavailable');
  assert.equal(limited.events.isha.status,'policy-blocked');
  assert.equal(interval.events.isha.status,'unavailable');
  assert.equal(interval.events.isha.reason,'sunset-unavailable-for-isha-interval');
});

test('JAKIM is bounded, applies the transit margin before upward-minute selection, and omits seconds',()=>{
  const input={date:'2026-06-21',latitude:3.139,longitude:101.687,timeZone:'Asia/Kuala_Lumpur',profile:'sunni-jakim-shadow1-physical-v1'};
  const result=calculateSunniDay(input);
  assert.equal(result.events.dhuhr.basis.operationOrder,'add-elapsed-margin-then-quantize');
  assert.equal(result.events.dhuhr.basis.marginBeforeRoundingMilliseconds,64000);
  assert.equal(result.events.dhuhr.basis.adjustedBasisEpochMilliseconds,result.astronomy.events.dhuhr.epochMilliseconds+64000);
  assert.equal(result.events.dhuhr.rawEpochMilliseconds,Math.ceil((result.astronomy.events.dhuhr.epochMilliseconds+64000)/60000)*60000);
  assert.equal(result.events.dhuhr.resolution,'minute');
  assert.equal(result.events.dhuhr.seconds,null);
  assert.equal(result.events.sunrise.seconds,null);
  assert.throws(()=>calculateSunniDay({...input,longitude:140}),RangeError);
  assert.throws(()=>calculateSunniDay({...input,timeZone:'Asia/Jakarta'}),RangeError);
});

test('Diyanet and Kemenag method entries reuse their existing local calculators',()=>{
  const cases=[
    {profile:'diyanet-published-spa-point-v1',date:'2026-06-21',latitude:41.0082,longitude:28.9784,timeZone:'Europe/Istanbul'},
    {profile:'kemenag-worked-example-point-v1',date:'2026-06-21',latitude:-6.2,longitude:106.8,timeZone:'Asia/Jakarta'},
  ];
  for(const input of cases)assert.deepEqual(calculateSunniDay(input),calculateLocalDay(input),input.profile);
});

test('Existing supported year endpoints remain available to new physical profiles',()=>{
  for(const edgeDate of ['2001-01-15','2098-12-15']){
    const result=calculateSunniDay({date:edgeDate,...point,profile:'sunni-egyptian-shadow1-physical-v1'});
    assert.equal(result.date,edgeDate);
    assert.equal(result.profile.official,false);
    assert.ok(result.events.dhuhr.rawEpochMilliseconds);
  }
});

test('Sunni day and schedule inputs reject accidental profile/default selection',()=>{
  assert.throws(()=>calculateSunniDay({date, ...point}),TypeError);
  assert.throws(()=>calculateSunniDay({date,...point,profile:'unknown'}),RangeError);
  const schedule=calculateSunniSchedule({startDate:'2026-06-20',dayCount:2,...point,profile:'sunni-egyptian-shadow1-physical-v1'});
  assert.equal(schedule.context.profileId,'sunni-egyptian-shadow1-physical-v1');
  assert.equal(schedule.days.length,2);
});
