import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LOCAL_REFERENCE_PROFILES,LOCAL_REFERENCE_VERSION,listReferenceProfiles,getReferenceProfile,
  calculateReferenceDay,calculateReferenceSchedule,
} from '../core/local/sunni-reference.mjs';
import {calculateSunniDay} from '../core/local/sunni.mjs';

const physicalId=(family,factor)=>`sunni-${family}-shadow${factor}-physical-v1`;
const referenceId=(family,factor)=>`sunni-${family}-shadow${factor}-reference45-v1`;
const point={longitude:0,timeZone:'Europe/London'};

test('reference profiles are opt-in, versioned, frozen, and limited to MWL/Egyptian angle families',()=>{
  assert.equal(LOCAL_REFERENCE_VERSION,'0.1.0-reference45');
  assert.deepEqual(LOCAL_REFERENCE_PROFILES,[
    referenceId('mwl',1),referenceId('mwl',2),referenceId('egyptian',1),referenceId('egyptian',2),
  ]);
  assert.equal(listReferenceProfiles().length,4);
  assert.equal(getReferenceProfile(referenceId('mwl',1)).referencePolicy.minimumAbsoluteLatitude,48);
  assert.equal(getReferenceProfile(referenceId('mwl',1)).referencePolicy.maximumAbsoluteLatitude,66);
  assert.equal(getReferenceProfile(referenceId('mwl',1)).referenceLatitudeDegrees,45);
  assert.match(getReferenceProfile(referenceId('mwl',1)).sources.referenceClarification,/dar-alifta\.org/);
  assert.match(getReferenceProfile(referenceId('mwl',1)).sources.referenceCouncil,/spa\.gov\.sa/);
  const copy=listReferenceProfiles();copy[0].astronomy.fajrAngleDegrees=2;
  assert.equal(getReferenceProfile(referenceId('mwl',1)).astronomy.fajrAngleDegrees,18);
  assert.throws(()=>{getReferenceProfile(referenceId('mwl',1)).astronomy.fajrAngleDegrees=2;},TypeError);
  assert.throws(()=>getReferenceProfile('sunni-isna-shadow1-reference45-v1'),RangeError);
});

test('ordinary real crossings and non-twilight events exactly retain their physical profile instants',()=>{
  for(const [date,latitude] of [['2026-06-21',40],['2026-12-21',60],['2026-06-21',-60]]){
    const reference=calculateReferenceDay({date,latitude,...point,profile:referenceId('egyptian',2)});
    const physical=calculateSunniDay({date,latitude,...point,profile:physicalId('egyptian',2)});
    assert.equal(reference.profile.id,referenceId('egyptian',2));
    assert.equal(reference.calculation.version,LOCAL_REFERENCE_VERSION);
    assert.equal(reference.calculation.referencePolicy.status,'not-triggered');
    for(const name of ['fajr','sunrise','dhuhr','asr','maghrib','isha']){
      assert.equal(reference.events[name].rawEpochMilliseconds,physical.events[name].rawEpochMilliseconds,`${date} ${latitude} ${name}`);
      assert.equal(reference.events[name].status,physical.events[name].status,`${date} ${latitude} ${name}`);
      assert.equal(reference.events[name].rule,physical.events[name].rule,`${date} ${latitude} ${name} rule`);
    }
  }
});

test('seasonally missing Fajr and Isha use same-longitude signed-45 proportional nights with full trace',()=>{
  for(const [date,latitude] of [['2026-06-21',60],['2026-12-21',-60]]){
    const result=calculateReferenceDay({date,latitude,...point,profile:referenceId('mwl',1)});
    const referenceLatitude=Math.sign(latitude)*45;
    for(const name of ['fajr','isha']){
      const event=result.events[name],trace=event.selection;
      assert.equal(event.status,'estimated',`${date} ${latitude} ${name}`);
      assert.equal(event.ruleEvidence.classification,'software-estimate');
      assert.equal(trace.referenceLatitudeDegrees,referenceLatitude);
      assert.equal(trace.referenceLongitudeDegrees,point.longitude);
      assert.equal(trace.referenceTimeZone,point.timeZone);
      assert.equal(trace.rawStatus,'unavailable');
      assert.equal(trace.rawEpochMilliseconds,null);
      assert.ok(trace.referenceFraction>0&&trace.referenceFraction<1);
      const referenceFraction=name==='fajr'
        ?(trace.referenceNightEndEpochMilliseconds-trace.referenceRawEpochMilliseconds)/trace.referenceNightMilliseconds
        :(trace.referenceRawEpochMilliseconds-trace.referenceNightStartEpochMilliseconds)/trace.referenceNightMilliseconds;
      assert.ok(Math.abs(trace.referenceFraction-referenceFraction)<1e-12);
      assert.ok(trace.nightStartEpochMilliseconds<trace.candidateEpochMilliseconds);
      assert.ok(trace.candidateEpochMilliseconds<trace.nightEndEpochMilliseconds);
      const expected=name==='fajr'
        ?trace.nightEndEpochMilliseconds-trace.referenceFraction*trace.localNightMilliseconds
        :trace.nightStartEpochMilliseconds+trace.referenceFraction*trace.localNightMilliseconds;
      assert.ok(Math.abs(trace.candidateEpochMilliseconds-expected)<0.001);
      assert.equal(event.rawEpochMilliseconds,trace.selectedEpochMilliseconds);
      assert.equal(event.epochMilliseconds,Math.round(trace.selectedEpochMilliseconds));
      assert.equal(event.calendarDate,result.events[name].calendarDate);
      assert.ok(Number.isFinite(event.roundedEpochMilliseconds));
    }
    assert.equal(result.calculation.referencePolicy.status,'estimated');
    assert.equal(result.astronomy.events.fajr.status,'unavailable');
    assert.equal(result.astronomy.events.isha.status,'unavailable');
  }
});

test('outside 48°–66° the rule blocks absent twilight and never invents a polar horizon',()=>{
  const result=calculateReferenceDay({date:'2026-06-21',latitude:70,...point,profile:referenceId('mwl',1)});
  assert.equal(result.events.fajr.status,'policy-blocked');
  assert.equal(result.events.fajr.reason,'reference45-outside-supported-48-to-66-degree-band');
  assert.equal(result.events.fajr.selection.rawReason,'sun-continuously-above-threshold');
  assert.equal(result.events.sunrise.status,'unavailable');
  assert.equal(result.events.maghrib.status,'unavailable');
  assert.equal(result.calculation.referencePolicy.status,'blocked');
});

test('valid winter crossings outside the reference band stay physical, while unavailable padded nights block',()=>{
  const winter=calculateReferenceDay({date:'2026-12-21',latitude:70,...point,profile:referenceId('mwl',1)});
  const physical=calculateSunniDay({date:'2026-12-21',latitude:70,...point,profile:physicalId('mwl',1)});
  assert.equal(winter.events.fajr.status,'calculated');assert.equal(winter.events.isha.status,'calculated');
  assert.equal(winter.events.fajr.rawEpochMilliseconds,physical.events.fajr.rawEpochMilliseconds);
  assert.equal(winter.events.isha.rawEpochMilliseconds,physical.events.isha.rawEpochMilliseconds);
  const northLimit=calculateReferenceDay({date:'2026-06-21',latitude:66,...point,profile:referenceId('mwl',1)});
  assert.equal(northLimit.events.fajr.status,'policy-blocked');
  assert.equal(northLimit.events.fajr.selection.reason,'reference45-night-or-anchor-unavailable');
  assert.equal(northLimit.events.sunrise.status,'unavailable');
  assert.equal(northLimit.events.maghrib.status,'unavailable');
  const firstSupported=calculateReferenceDay({date:'2001-01-01',latitude:-60,...point,profile:referenceId('mwl',1)});
  const lastSupported=calculateReferenceDay({date:'2098-12-31',latitude:-60,...point,profile:referenceId('mwl',1)});
  assert.equal(firstSupported.events.fajr.status,'policy-blocked');
  assert.equal(firstSupported.events.fajr.selection.reason,'reference45-night-or-anchor-unavailable');
  assert.equal(lastSupported.events.isha.status,'policy-blocked');
  assert.equal(lastSupported.events.isha.selection.reason,'reference45-night-or-anchor-unavailable');
});

test('schedule keeps estimates as prayer starts and preserves cross-day chronology',()=>{
  const schedule=calculateReferenceSchedule({startDate:'2026-06-20',dayCount:3,latitude:60,...point,profile:referenceId('mwl',1)});
  assert.equal(schedule.context.profileId,referenceId('mwl',1));
  assert.equal(schedule.context.calculationVersion,LOCAL_REFERENCE_VERSION);
  assert.equal(schedule.entries.some(entry=>entry.event==='fajr'&&entry.status==='estimated'),true);
  assert.equal(schedule.entries.some(entry=>entry.event==='isha'&&entry.status==='estimated'),true);
  for(let i=1;i<schedule.entries.length;i++)assert.ok(schedule.entries[i-1].epochMilliseconds<schedule.entries[i].epochMilliseconds);
  const estimated=schedule.entries.find(entry=>entry.event==='fajr'&&entry.status==='estimated');
  assert.equal(estimated.ruleEvidence.classification,'software-estimate');
  assert.ok(estimated.rawEpochMilliseconds<estimated.epochMilliseconds+0.5);
});

test('a missing-twilight estimate uses elapsed night duration across a clock rollback',()=>{
  // Synthetic coordinate/zone pairing deliberately puts a summer twilight gap
  // across Morocco's July 2013 clock change; this is a time-arithmetic test.
  const timeZone='Africa/Casablanca';
  const day=calculateReferenceDay({date:'2013-07-07',latitude:60,longitude:10,timeZone,profile:referenceId('mwl',1)});
  const event=day.events.fajr,trace=event.selection;
  assert.equal(event.status,'estimated');assert.equal(event.localDate,'2013-07-07');
  const formatter=new Intl.DateTimeFormat('en-GB',{timeZone,timeZoneName:'longOffset',hour:'numeric'});
  assert.match(formatter.format(trace.nightStartEpochMilliseconds),/GMT\+01:00/);
  const endOffset=formatter.formatToParts(trace.nightEndEpochMilliseconds).find(part=>part.type==='timeZoneName').value;
  assert.match(endOffset,/^GMT(?:\+00:00)?$/);
  const utcDuration=trace.nightEndEpochMilliseconds-trace.nightStartEpochMilliseconds;
  const wrongClockDuration=utcDuration-3600000;
  assert.ok(utcDuration>5*3600000&&utcDuration<6*3600000);
  assert.ok(Math.abs(event.rawEpochMilliseconds-(trace.nightEndEpochMilliseconds-trace.referenceFraction*wrongClockDuration))>15*60000);
  assert.equal(trace.localNightMilliseconds,utcDuration);
});

test('strict profile input rejects unknown ids, getters, explicit undefined and malformed records',()=>{
  assert.throws(()=>calculateReferenceDay({date:'2026-06-21',latitude:60,...point,profile:'unknown'}),RangeError);
  const getter={date:'2026-06-21',latitude:60,...point,profile:referenceId('mwl',1)};
  Object.defineProperty(getter,'other',{enumerable:true,get(){throw Error('must not run');}});
  assert.throws(()=>calculateReferenceDay(getter),TypeError);
  assert.throws(()=>calculateReferenceDay({date:'2026-06-21',latitude:60,...point,profile:referenceId('mwl',1),extra:undefined}),TypeError);
  assert.throws(()=>calculateReferenceSchedule({startDate:'2026-06-21',dayCount:1,latitude:60,...point,
    profile:referenceId('mwl',1),extra:undefined}),TypeError);
});
