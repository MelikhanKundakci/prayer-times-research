import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeRows,EVENTS} from '../scripts/oss-relative/analyze.mjs';
const options={years:[2027],cities:['test']};
function row(date,offset=0){return{city:'test',date,error:null,events:Object.fromEntries(EVENTS.map((name,i)=>[name,
  new Date(Date.parse(date+'T00:00:00Z')+(i+1)*3600000+offset).toISOString()]))};}
test('comparison keeps absent days and missing signs in the planned denominator',()=>{
  const first=row('2027-01-01');first.events.fajr=null;
  const summary=analyzeRows([first],options).groups[0];
  assert.equal(summary.plannedDays,365);assert.equal(summary.absentRows,364);assert.equal(summary.completeDays,0);
  assert.equal(summary.missing.fajr,365);assert.equal(summary.missing.isha,364);
});
test('comparison detects day-carry errors without hiding them behind modulo arithmetic',()=>{
  const a=row('2027-03-27'),b=row('2027-03-28',86400000);
  const summary=analyzeRows([a,b],options).groups[0];
  assert.equal(summary.changes.fajr.maximumAbsoluteSeconds,86400);
  assert.equal(summary.changes.isha.overTenMinutes,1);
  assert.throws(()=>analyzeRows([a,a],options),/duplicate/);
});
test('comparison checks chronology even when another event is unavailable',()=>{
  const a=row('2027-01-01'),b=row('2027-01-02');a.events.sunrise=null;a.events.asr=a.events.dhuhr;
  a.events.isha=b.events.fajr;
  const summary=analyzeRows([a,b],options).groups[0];
  assert.equal(summary.withinDayOrderViolations,1);assert.equal(summary.crossNightViolations,1);
});
test('comparison follows elapsed UTC values across a daylight-saving display boundary',()=>{
  const a=row('2027-03-27'),b=row('2027-03-28',-120000);
  const summary=analyzeRows([a,b],options).groups[0];
  assert.equal(summary.changes.fajr.maximumAbsoluteSeconds,120);
  assert.equal(summary.changes.fajr.overFiveMinutes,0);
});
