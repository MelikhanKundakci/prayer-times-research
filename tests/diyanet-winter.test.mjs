import test from 'node:test';
import assert from 'node:assert/strict';
import {buildNorthernContext} from '../core/local/northern.mjs';
import {calculateLocalSolarDay} from '../core/local/solar.mjs';
import {admitDiyanetWinterContext,DIYANET_WINTER_POLICY} from '../core/local/diyanet-winter.mjs';

const location={latitude:59.9139,longitude:10.7522,timeZone:'Europe/Oslo',solarModel:'spa'};
const oslo=buildNorthernContext({year:2027,...location});
const admitted=admitDiyanetWinterContext(oslo);

test('The local winter proof admits real Oslo winter crossings without changing the annual context',()=>{
  const before=JSON.stringify(oslo),result=admitDiyanetWinterContext(oslo);
  assert.equal(result.policy,DIYANET_WINTER_POLICY);
  assert.equal(result.evaluated,true);assert.equal(result.reason,null);
  assert.equal(oslo.reason,'annual-five-hour-horizon-gate-not-met');
  assert.equal(oslo.status,'blocked');assert.equal(oslo.days['2027-01-15'].fajr.eligible,false);
  const raw=calculateLocalSolarDay({date:'2027-01-15',...location,ishaAngleDegrees:16});
  for(const name of ['fajr','isha']){
    assert.equal(result.days['2027-01-15'][name].eligible,true);
    assert.equal(result.days['2027-01-15'][name].rawEpochMilliseconds,raw.events[name].epochMilliseconds);
  }
  assert.equal(JSON.stringify(oslo),before);
  result.days['2027-01-15'].fajr.eligible=false;
  assert.equal(admitted.days['2027-01-15'].fajr.eligible,true);
});

test('Summer absence and real transition crossings stay excluded from the winter proof',()=>{
  for(const name of ['fajr','isha']){
    assert.equal(admitted.days['2027-06-21'][name].eligible,false);
    assert.equal(admitted.days['2027-06-21'][name].rawEpochMilliseconds,null);
    // Real March events with valid local horizons do not suffice: the complete
    // annual envelope is deliberately more conservative than the direct bound.
    const transition=admitted.days['2027-03-28'][name];
    assert.equal(transition.proof.rawIsReal,true);
    assert.equal(transition.proof.horizons.eligible,true);
    assert.equal(transition.proof.outsideDirectTransition,true);
    assert.equal(transition.proof.outsideAnnualEnvelope,false);
    assert.equal(transition.eligible,false);
  }
});

test('Every admitted Oslo event satisfies strict UTC horizon, chronology and transition bounds',()=>{
  const totals={fajr:0,isha:0};
  for(const [date,day] of Object.entries(admitted.days))for(const name of ['fajr','isha']){
    const event=day[name];if(!event.eligible)continue;
    const p=event.proof,source=oslo.days[date],night=name==='fajr'?source.previousNight:source.nightToNext;
    totals[name]++;
    assert.ok(p.horizons.startRawDayMinutes>300&&p.horizons.startSelectedDayMinutes>300);
    assert.ok(p.horizons.endRawDayMinutes>300&&p.horizons.endSelectedDayMinutes>300);
    assert.ok(p.horizons.rawNightMinutes>300&&p.horizons.selectedNightMinutes>300);
    assert.ok(night.maghribSelectedEpochMilliseconds<event.rawEpochMilliseconds);
    assert.ok(event.rawEpochMilliseconds<night.sunriseEndSelectedEpochMilliseconds);
    if(name==='fajr'){
      assert.ok(source.fajr.phaseMinutes>oslo.metadata.annualFajrTransitionUpperPhaseMinutes);
      assert.ok(event.rawEpochMilliseconds>night.fajrUpperEpochMilliseconds+1_200_000);
    }else{
      assert.ok(source.isha.phaseMinutes<oslo.metadata.annualIshaTransitionLowerPhaseMinutes);
      assert.ok(event.rawEpochMilliseconds<night.ishaEstimateEpochMilliseconds-1_200_000);
      assert.equal(night.realFajr,true);
      assert.ok(event.rawEpochMilliseconds<night.nextRawFajrEpochMilliseconds);
    }
  }
  assert.deepEqual(totals,{fajr:152,isha:163});
});

test('Year boundaries retain their physical neighboring nights and autumn DST uses elapsed time',()=>{
  assert.equal(admitted.days['2027-01-01'].fajr.eligible,true);
  assert.equal(admitted.days['2027-01-01'].fajr.proof.nightStartDate,'2026-12-31');
  assert.equal(admitted.days['2027-12-31'].isha.eligible,true);
  assert.equal(admitted.days['2027-12-31'].isha.proof.nightEndDate,'2028-01-01');
  const event=admitted.days['2027-10-31'].fajr;
  assert.equal(event.eligible,true);
  const p=event.proof;
  assert.ok(Math.abs((p.sunriseSelectedEpochMilliseconds-p.maghribSelectedEpochMilliseconds)/60_000
    -p.horizons.selectedNightMinutes)<1e-8);
});

test('The five-hour boundary is strict and both bounding days must pass, even with stale eligibility flags',()=>{
  for(const [date,key,event] of [['2027-01-14','rawDayMinutes','fajr'],['2027-01-15','selectedDayMinutes','fajr'],
    ['2027-01-16','rawDayMinutes','isha']]){
    const source=structuredClone(oslo);source.days[date].horizons[key]=300;
    const result=admitDiyanetWinterContext(source);
    assert.equal(result.evaluated,true);
    assert.equal(result.days['2027-01-15'][event].eligible,false);
    assert.equal(result.days['2027-01-15'][event].reason,'local-five-hour-horizon-bound-not-met');
  }
  const mismatch=structuredClone(oslo);mismatch.days['2027-01-15'].horizons.previousSelectedNightMinutes-=1;
  assert.equal(admitDiyanetWinterContext(mismatch).days['2027-01-15'].fajr.eligible,false);
});

test('Incomplete annual evidence, malformed candidates and all other blocker reasons fail closed',()=>{
  const mutations=[
    n=>{n.reason='annual-night-horizon-incomplete';},
    n=>{n.status='available';n.reason=null;},
    n=>{n.metadata.failures.push({date:'2027-03-01',reason:'solar-day-unavailable'});},
    n=>{n.metadata.q=NaN;},
    n=>{n.metadata.q+=0.001;},
    n=>{n.metadata.annualIshaTransitionLowerPhaseMinutes+=1;},
    n=>{n.metadata.annualFajrTransitionUpperPhaseMinutes=Infinity;},
    n=>{delete n.days['2026-12-31'];},
    n=>{n.days['2027-03-01'].nightToNext=null;},
    n=>{n.days['2027-03-01'].previousNight={...n.days['2027-03-01'].previousNight,oneThirdMinutes:0};},
    n=>{n.metadata.missingFajrDayCount-=1;},
    n=>{n.days['2027-01-15'].fajr.rawEpochMilliseconds+=1;},
    n=>{n.days['2027-01-15'].isha.phaseMinutes=NaN;},
  ];
  for(const mutate of mutations){
    const n=structuredClone(oslo);mutate(n);const result=admitDiyanetWinterContext(n);
    assert.equal(result.evaluated,false,result.reason);
    assert.ok(result.reason);
    assert.ok(Object.values(result.days).every(day=>!day.fajr.eligible&&!day.isha.eligible));
  }
  const reason=structuredClone(oslo);reason.days['2027-01-15'].fajr.rawReason='root-search-incomplete';
  assert.equal(admitDiyanetWinterContext(reason).days['2027-01-15'].fajr.eligible,false);
});

test('Input validation and unsupported year padding cannot silently create eligibility',()=>{
  for(const value of [null,[],{}, {metadata:{year:2100}}])assert.throws(()=>admitDiyanetWinterContext(value));
  for(const year of [2001,2098]){
    const n=structuredClone(oslo);n.metadata.year=year;
    const result=admitDiyanetWinterContext(n);
    assert.equal(result.evaluated,false);assert.equal(result.reason,'padded-year-outside-solar-domain');
  }
});
