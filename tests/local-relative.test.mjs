import test from 'node:test';
import assert from 'node:assert/strict';
import {selectLocalRelativeSegment} from '../core/local/local-relative-policy.mjs';
import {calculateRelativeDay,calculateRelativeSchedule,LOCAL_RELATIVE_PROFILES,getRelativeProfile,listRelativeProfiles} from '../core/local/sunni-relative.mjs';
import {calculateSunniDay} from '../core/local/sunni.mjs';

const DAY=86_400_000,MINUTE=60_000,HOUR=60*MINUTE;
const t=date=>Date.parse(`${date}T00:00:00Z`);
const date=(base,index)=>new Date(t(base)+index*DAY).toISOString().slice(0,10);
const profile=factor=>`sunni-mwl-shadow${factor}-local-relative-v1`;
const frankfurt={latitude:50.1109,longitude:8.6821,timeZone:'Europe/Berlin'};
function synthetic(event,count,left,right,candidate){
  const start='2027-05-01',leftAnchor={date:start,epochMilliseconds:t(start)+left};
  const end=date(start,count+1),rightAnchor={date:end,epochMilliseconds:t(end)+right};
  const candidates=Array.from({length:count},(_,i)=>{
    const d=date(start,i+1),day=t(d);
    return{date:d,nightStartEpochMilliseconds:day+(event==='isha'?20:-4)*HOUR,
      nightEndEpochMilliseconds:day+(event==='isha'?30:6)*HOUR,
      candidateEpochMilliseconds:day+(Array.isArray(candidate)?candidate[i]:candidate)};
  });
  return{event,leftAnchor,rightAnchor,candidates};
}

test('bidirectional ramps have opposite signs and meet the target without a snap',()=>{
  for(const [event,anchor,candidate,direction] of [['isha',24*HOUR,22*HOUR,-1],['fajr',HOUR,4*HOUR,1]]){
    const input=synthetic(event,80,anchor,anchor,candidate),output=selectLocalRelativeSegment(input);
    assert.equal(output.status,'available');assert.ok(output.targetReachedCount>0);
    assert.equal(output.selections[0].selectedPhaseMilliseconds,anchor+direction*5*MINUTE);
    assert.equal(output.selections.at(-1).selectedPhaseMilliseconds,anchor+direction*5*MINUTE);
    assert.ok(output.maximumPhaseStepMilliseconds<=5*MINUTE+.001);
    assert.ok(output.selections.every(row=>row.nightStartEpochMilliseconds<row.selectedEpochMilliseconds&&row.selectedEpochMilliseconds<row.nightEndEpochMilliseconds));
  }
});

test('short gaps use a declared overlap envelope; unreachable anchors and unsafe nights block',()=>{
  const i=selectLocalRelativeSegment(synthetic('isha',1,24*HOUR,24*HOUR+8*MINUTE,22*HOUR));
  assert.equal(i.status,'available');assert.equal(i.selections[0].mode,'overlap-ramp');
  assert.equal(i.selections[0].selectedPhaseMilliseconds,24*HOUR+3*MINUTE);assert.equal(i.targetReachedCount,0);
  const f=selectLocalRelativeSegment(synthetic('fajr',1,HOUR,HOUR+8*MINUTE,4*HOUR));
  assert.equal(f.selections[0].selectedPhaseMilliseconds,HOUR+5*MINUTE);
  assert.equal(selectLocalRelativeSegment(synthetic('isha',1,24*HOUR,24*HOUR+11*MINUTE,22*HOUR)).reason,'local-relative-anchor-ramp-unreachable');
  assert.equal(selectLocalRelativeSegment(synthetic('isha',3,23*HOUR,23*HOUR,[22*HOUR,24*HOUR,22*HOUR])).reason,'local-relative-selected-step-exceeds-five-minutes');
  const bad=synthetic('fajr',2,HOUR,HOUR,7*HOUR);
  assert.equal(selectLocalRelativeSegment(bad).reason,'local-relative-candidate-outside-actual-night');
  const outside=synthetic('isha',2,31*HOUR,31*HOUR,22*HOUR);
  assert.equal(selectLocalRelativeSegment(outside).reason,'local-relative-ramp-outside-actual-night');
});

test('pure selector rejects malformed/accessor inputs, missing dates and non-finite anchors',()=>{
  assert.throws(()=>selectLocalRelativeSegment({...synthetic('isha',1,24*HOUR,24*HOUR,22*HOUR),unknown:1}));
  const bad=synthetic('isha',1,24*HOUR,24*HOUR,22*HOUR);bad.leftAnchor.epochMilliseconds=NaN;
  assert.throws(()=>selectLocalRelativeSegment(bad));
  const gap=synthetic('isha',1,24*HOUR,24*HOUR,22*HOUR);gap.rightAnchor.date='2027-05-04';
  assert.throws(()=>selectLocalRelativeSegment(gap));
  const getter=synthetic('isha',1,24*HOUR,24*HOUR,22*HOUR);
  Object.defineProperty(getter.candidates,'0',{get(){throw new Error('Accessor must not run');},enumerable:true});
  assert.throws(()=>selectLocalRelativeSegment(getter),/own data/);
});

test('two strict profiles preserve ordinary physical outputs, including DST and out-of-scope dates',()=>{
  assert.equal(LOCAL_RELATIVE_PROFILES.length,2);
  assert.throws(()=>getRelativeProfile('sunni-egyptian-shadow1-local-relative-v1'));
  const mutable=listRelativeProfiles();mutable[0].relativePolicy.minimumAbsoluteLatitude=0;
  assert.equal(getRelativeProfile(profile(1)).relativePolicy.minimumAbsoluteLatitude,48.6);
  for(const [point,d] of [[frankfurt,'2027-03-27'],[frankfurt,'2027-03-28'],[frankfurt,'2001-01-01'],[frankfurt,'2098-12-31'],
    [{latitude:41.0082,longitude:28.9784,timeZone:'Europe/Istanbul'},'2027-06-21']]){
    const input={date:d,...point},base=calculateSunniDay({...input,profile:'sunni-mwl-shadow1-physical-v1'});
    assert.deepEqual(calculateRelativeDay({...input,profile:profile(1)}).events,base.events);
  }
  for(const bad of [{date:'2027-02-30'}, {latitude:NaN}, {timeZone:'+02:00'}, {extra:true}])
    assert.throws(()=>calculateRelativeDay({date:'2027-06-21',...frankfurt,profile:profile(1),...bad}));
});

test('Frankfurt summer uses one annual Isha ratio, real anchors and Asr-independent selections',()=>{
  const a=calculateRelativeDay({date:'2027-06-21',...frankfurt,profile:profile(1)});
  const b=calculateRelativeDay({date:'2027-06-21',...frankfurt,profile:profile(2)});
  assert.ok(a.coverage.prayerStartsComplete);
  for(const event of ['fajr','isha']){
    assert.equal(a.events[event].status,'estimated');assert.equal(a.events[event].rawEpochMilliseconds,b.events[event].rawEpochMilliseconds);
    const segment=a.events[event].selection.segment,annual=segment.annualRatio;
    assert.equal(annual.year,2027);assert.equal(annual.eligibleDays+annual.excludedMissingDays+annual.excludedDisturbedDays+annual.unresolvedDays,365);
    assert.equal(annual.unresolvedDays,0);assert.ok(annual.fraction>0&&annual.fraction<.5);
    assert.equal(annual.fraction,annual.sumOfDailyIshaNightFractions/annual.eligibleDays);
    assert.ok(segment.maximumPhaseStepMilliseconds<=300000.001);
    for(const anchor of [segment.leftAnchor,segment.rightAnchor]){
      const physical=calculateSunniDay({date:anchor.date,...frankfurt,profile:'sunni-mwl-shadow1-physical-v1'});
      const actual=calculateRelativeDay({date:anchor.date,...frankfurt,profile:profile(1)});
      assert.deepEqual(actual.events[event],physical.events[event]);
      assert.equal(anchor.epochMilliseconds,physical.events[event].rawEpochMilliseconds);
    }
  }
  assert.equal(a.events.fajr.selection.segment.annualRatio.fraction,a.events.isha.selection.segment.annualRatio.fraction);
  assert.ok(b.events.asr.rawEpochMilliseconds>a.events.asr.rawEpochMilliseconds);
  for(const event of ['sunrise','dhuhr','maghrib'])assert.equal(a.events[event].rawEpochMilliseconds,b.events[event].rawEpochMilliseconds);
  assert.ok(!Object.hasOwn(a.events.fajr,'basis'));
  const q=a.events.fajr.selection.segment.annualRatio.fraction;
  a.events.fajr.selection.segment.annualRatio.fraction=999;
  assert.equal(calculateRelativeDay({date:'2027-06-21',...frankfurt,profile:profile(1)}).events.fajr.selection.segment.annualRatio.fraction,q);
  const first=b.events.fajr.selection.segment.firstReplacementDate;
  const boundary=calculateRelativeDay({date:first,...frankfurt,profile:profile(1)});
  assert.equal(boundary.events.fajr.selection.classification.kind,'disturbed');
  assert.equal(boundary.astronomy.events.fajr.status,'calculated');
  const values=[-1,0,1].map(i=>{
    const d=date(first,i),r=calculateSunniDay({date:d,...frankfurt,profile:'sunni-mwl-shadow1-physical-v1'});
    return r.astronomy.events.fajr.epochMilliseconds===null?null:r.astronomy.events.fajr.epochMilliseconds-t(d);
  });
  assert.ok((values[0]!==null&&Math.abs(values[0]-values[1])>10*MINUTE)||(values[2]!==null&&Math.abs(values[2]-values[1])>10*MINUTE));
});

test('leap-day ordinary output and exact ±180° aliases remain deterministic',()=>{
  const input={date:'2024-02-29',latitude:50,longitude:180,timeZone:'Asia/Anadyr',profile:profile(1)};
  const east=calculateRelativeDay(input),west=calculateRelativeDay({...input,longitude:-180});
  assert.deepEqual(east,west);
  const raw=calculateSunniDay({...input,profile:'sunni-mwl-shadow1-physical-v1'});
  assert.deepEqual(east.events,raw.events);
});

test('southern summer holds the union-episode mean year across January and schedules remain ordered',()=>{
  const point={latitude:-55,longitude:0,timeZone:'UTC'};
  const december=calculateRelativeDay({date:'2026-12-31',...point,profile:profile(1)});
  const january=calculateRelativeDay({date:'2027-01-01',...point,profile:profile(1)});
  for(const event of ['fajr','isha']){
    assert.equal(december.events[event].status,'estimated');assert.equal(january.events[event].status,'estimated');
    assert.equal(december.events[event].selection.segment.meanYear,2026);assert.equal(january.events[event].selection.segment.meanYear,2026);
    assert.equal(december.events[event].selection.segment.annualRatio.fraction,january.events[event].selection.segment.annualRatio.fraction);
    const delta=(january.events[event].rawEpochMilliseconds-december.events[event].rawEpochMilliseconds)-DAY;
    assert.ok(Math.abs(delta)<=5*MINUTE+.001);
  }
  assert.deepEqual(december.events.fajr.selection.segment.unionEpisode,december.events.isha.selection.segment.unionEpisode);
  for(const [location,startDate] of [[point,'2026-12-29'],[frankfurt,'2027-06-19']]){
    const schedule=calculateRelativeSchedule({startDate,dayCount:5,...location,profile:profile(1)});
    assert.ok(schedule.complete);
    for(let index=1;index<schedule.entries.length;index++)assert.ok(schedule.entries[index].epochMilliseconds>schedule.entries[index-1].epochMilliseconds);
    assert.equal(schedule.coverage.prayerStartEntries,25);
  }
});

test('missing polar horizons never become invented local-relative times',()=>{
  for(const latitude of [66.6,69.6492]){
    const result=calculateRelativeDay({date:'2027-06-21',latitude,longitude:18.9553,timeZone:'Europe/Oslo',profile:profile(1)});
    assert.equal(result.coverage.prayerStartsComplete,false);
    assert.ok(['unavailable','policy-blocked'].includes(result.events.isha.status));
    assert.equal(result.events.isha.rawEpochMilliseconds,null);
    assert.notEqual(result.events.maghrib.status,'estimated');
  }
});
