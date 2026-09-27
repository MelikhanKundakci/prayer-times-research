import test from 'node:test';
import assert from 'node:assert/strict';
import {diyanetComparisonRows} from '../examples/local-app/comparison-view.mjs';

function comparison(){
  const event={status:'calculated',time:'19:22',seconds:'19:21:48',calendarDate:'2026-09-26',secondsDate:'2026-09-26'};
  const pair={local:{...event},calendar:{...event,time:'19:23',seconds:'19:23:23'},localAvailable:true,calendarAvailable:true,
    roundedEpochDifferenceMilliseconds:-60000,rawDifferenceSeconds:-95.24};
  return{events:Object.fromEntries(['fajr','sunrise','dhuhr','asr','maghrib','isha'].map(name=>[name,structuredClone(pair)]))};
}

test('browser comparison separates rounded-minute difference from unrounded seconds',()=>{
  const input=comparison(),unchanged=structuredClone(input);
  const row=diyanetComparisonRows(input,{language:'de'}).find(row=>row.event==='maghrib');
  assert.equal(row.local.clock,'19:22');assert.equal(row.calendar.clock,'19:23');
  assert.equal(row.difference,'−1 Min.');assert.equal(row.rawDifference,'Vor Minutenrundung: −95,2 Sek.');
  const seconds=diyanetComparisonRows(input,{seconds:true,language:'de'}).find(row=>row.event==='maghrib');
  assert.equal(seconds.local.clock,'19:21:48');assert.equal(seconds.calendar.clock,'19:23:23');
  assert.equal(seconds.difference,'−1 Min.');assert.deepEqual(input,unchanged);
});

test('browser comparison preserves blocked local events and estimated reconstruction without substitution',()=>{
  const input=comparison(),pair=input.events.isha;
  pair.local={status:'policy-blocked',time:null,calendarDate:null,seconds:null,secondsDate:null};
  pair.localAvailable=false;pair.rawDifferenceSeconds=null;pair.roundedEpochDifferenceMilliseconds=null;
  pair.calendar.status='estimated';
  const row=diyanetComparisonRows(input,{language:'de'}).find(row=>row.event==='isha');
  assert.deepEqual(row.local,{available:false,clock:'—',date:null,status:'Regel ungeklärt'});
  assert.equal(row.calendar.status,'Geschätzt');assert.equal(row.calendar.clock,'19:23');
  assert.equal(row.difference,'—');assert.equal(row.rawDifference,'Kein gemeinsamer Zeitwert');
});

test('browser comparison retains cross-date differences and seconds-rounding date ownership',()=>{
  const input=comparison(),pair=input.events.isha;
  pair.local={status:'calculated',time:'00:00',calendarDate:'2026-09-27',seconds:'23:59:40',secondsDate:'2026-09-26'};
  pair.calendar={...pair.local,calendarDate:'2026-09-26',secondsDate:'2026-09-25'};
  pair.roundedEpochDifferenceMilliseconds=86400000;pair.rawDifferenceSeconds=86400;
  const minute=diyanetComparisonRows(input,{language:'de'}).find(row=>row.event==='isha');
  const second=diyanetComparisonRows(input,{seconds:true,language:'de'}).find(row=>row.event==='isha');
  assert.equal(minute.local.date,'2026-09-27');assert.equal(second.local.date,'2026-09-26');
  assert.equal(minute.calendar.date,'2026-09-26');assert.equal(second.calendar.date,'2026-09-25');
  assert.equal(minute.difference,'+1.440 Min.');
});
