import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {compareCalendars} from '../validation/index.mjs';
import {syntheticExample} from '../validation/synthetic-example.mjs';
const dir=fileURLToPath(new URL('../',import.meta.url));
function one(date,clock,utc,timeZone='UTC',field='event') {
  return {plan:[{id:'case',timeZone,dates:[date],fields:[{reference:field,predicted:field}]}],
    references:[{id:'case',status:'parsed',days:[{date,events:{[field]:clock}}]}],
    predictions:[{id:'case',days:[{date,events:{[field]:{utc}}}]}],mode:'printed-date',zeroClockPolicy:'unresolved'};
}
function conditional(anchor='18:00') {
  const input=one('2026-01-01','00:30','2026-01-02T00:30:00Z','UTC','isha');
  input.mode='conditional-isha-after-maghrib';input.conditional={ishaField:'isha',maghribField:'maghrib'};
  input.references[0].days[0].events.maghrib=anchor;return input;
}
test('synthetic example preserves all planned slots and does not score paired nulls as exact',()=>{
  const result=compareCalendars(structuredClone(syntheticExample));
  assert.equal(result.overall.slots,2);assert.equal(result.overall.compared,1);assert.equal(result.overall.exact,0);assert.equal(result.overall.withinOneMinute,1);
  assert.deepEqual(result.rows[1].unavailableReasons,['source:explicit-null','model:synthetic-no-crossing']);
  assert.equal(result.rows[0].deltaMinutes,1);assert.equal(result.cases[0].byField.evening.slots,1);
});
test('absolute UTC delta exposes next-day errors rather than modulo24 agreement',()=>{
  const result=compareCalendars(one('2026-01-01','06:00','2026-01-02T06:00:00Z'));
  assert.equal(result.rows[0].deltaMinutes,1440);assert.equal(result.overall.predictedDateDiffers,1);assert.equal(result.overall.exact,0);
});
test('00:00 policy must be explicit; unresolved and literal differ without rewriting the clock',()=>{
  const input=one('2026-01-01','00:00','2026-01-01T00:00:00Z');
  assert.equal(compareCalendars(input).rows[0].sourceStatus,'zero-clock-unresolved');
  input.zeroClockPolicy='literal';assert.equal(compareCalendars(input).overall.exact,1);
  delete input.zeroClockPolicy;assert.throws(()=>compareCalendars(input),/missing/);
});
test('IANA fold retains two candidates and gap retains none',()=>{
  const fold=compareCalendars(one('2026-10-25','02:30','2026-10-25T00:30:00Z','Europe/Berlin')).rows[0];
  assert.equal(fold.sourceStatus,'ambiguous-local-clock');assert.deepEqual(fold.sourceUtcCandidates,['2026-10-25T00:30:00.000Z','2026-10-25T01:30:00.000Z']);assert.equal(fold.deltaMinutes,null);
  const gap=compareCalendars(one('2026-03-29','02:30','2026-03-29T01:30:00Z','Europe/Berlin')).rows[0];
  assert.equal(gap.sourceStatus,'nonexistent-local-clock');assert.deepEqual(gap.sourceUtcCandidates,[]);assert.equal(gap.deltaMinutes,null);
});
test('skipped civil date, fractional offset and date-line instant are resolved without timezone defaults',()=>{
  assert.equal(compareCalendars(one('2011-12-30','12:00','2011-12-30T12:00:00Z','Pacific/Apia')).rows[0].sourceStatus,'nonexistent-local-clock');
  assert.equal(compareCalendars(one('2026-01-01','06:00','2026-01-01T00:15:00Z','Asia/Kathmandu')).overall.exact,1);
  const line=compareCalendars(one('2026-01-01','00:30','2025-12-31T10:30:00Z','Pacific/Kiritimati'));
  assert.equal(line.overall.exact,1);assert.equal(line.rows[0].predictedLocalDate,'2026-01-01');
});
test('conditional Isha is an explicit separate scenario and requires an available Maghrib anchor',()=>{
  const secondary=conditional();assert.equal(compareCalendars(secondary).overall.exact,1);assert.equal(compareCalendars(secondary).rows[0].sourceDateInferred,true);
  const primary=structuredClone(secondary);primary.mode='printed-date';delete primary.conditional;delete primary.references[0].days[0].events.maghrib;
  assert.equal(compareCalendars(primary).rows[0].deltaMinutes,1440);
  secondary.references[0].days[0].events.maghrib=null;
  assert.equal(compareCalendars(secondary).rows[0].sourceStatus,'conditional-maghrib-anchor-unavailable');
  const zero=conditional('00:00');assert.equal(compareCalendars(zero).rows[0].deltaMinutes,null);
});
test('equal Isha and Maghrib clocks retain the printed date without an inferred day shift',()=>{
  const input=conditional('18:00');
  input.references[0].days[0].events.isha='18:00';
  input.predictions[0].days[0].events.isha.utc='2026-01-01T18:00:00Z';
  const result=compareCalendars(input),row=result.rows[0];
  assert.equal(row.sourceAssignedDate,'2026-01-01');
  assert.equal(row.sourceDateInferred,false);
  assert.equal(row.sourceUtc,'2026-01-01T18:00:00.000Z');
  assert.equal(row.deltaMinutes,0);assert.equal(result.overall.exact,1);
});
test('only Isha loses the conditional comparison when its anchor is missing; inferred next-day gap stays unavailable',()=>{
  const input=conditional(null);input.plan[0].fields.push({reference:'dhuhr',predicted:'dhuhr'});input.references[0].days[0].events.dhuhr='12:00';input.predictions[0].days[0].events.dhuhr={utc:'2026-01-01T12:00:00Z'};
  const r=compareCalendars(input);assert.equal(r.overall.slots,2);assert.equal(r.overall.exact,1);assert.equal(r.overall.notCompared,1);
  const gap=one('2026-03-28','02:30','2026-03-29T01:30:00Z','Europe/Berlin','isha');gap.mode='conditional-isha-after-maghrib';gap.conditional={ishaField:'isha',maghribField:'maghrib'};gap.references[0].days[0].events.maghrib='18:00';
  const e=compareCalendars(gap).rows[0];assert.equal(e.sourceAssignedDate,'2026-03-29');assert.equal(e.sourceStatus,'nonexistent-local-clock');assert.equal(e.deltaMinutes,null);
});
test('whole source failure and absent cases/days/fields keep the full planned denominator',()=>{
  const input=one('2026-01-01','06:00','2026-01-01T06:00:00Z');input.plan[0].dates.push('2026-01-02');
  input.references=[{id:'case',status:'unavailable',reason:'backend-error-no-calendar',days:[]}];
  let r=compareCalendars(input);assert.equal(r.overall.slots,2);assert.equal(r.overall.compared,0);assert.equal(r.rows[0].sourceFailureReason,'backend-error-no-calendar');
  input.references=[];input.predictions=[];r=compareCalendars(input);assert.deepEqual(r.rows[0].unavailableReasons,['source:missing-case','model:missing-case']);assert.equal(r.rows.length,2);
  input.references=[{id:'case',status:'parsed',days:[{date:'2026-01-01',events:{}}]}];input.predictions=[{id:'case',days:[{date:'2026-01-01',events:{}}]}];r=compareCalendars(input);assert.deepEqual(r.rows[0].unavailableReasons,['source:missing-field','model:missing-field']);assert.deepEqual(r.rows[1].unavailableReasons,['source:missing-day','model:missing-day']);
});
test('strict contract rejects unplanned data, duplicates, malformed clocks, offset ISO and accessors',()=>{
  for(const modify of [
    x=>x.references[0].days[0].events.event='24:00',
    x=>x.predictions[0].days[0].events.event.utc='2026-01-01T06:00:00+00:00',
    x=>x.predictions[0].days[0].events.event.utc='2026-01-01T06:00:30Z',
    x=>x.plan[0].dates.push('2026-01-01'),
    x=>x.references.push(structuredClone(x.references[0])),
    x=>x.references[0].days[0].events.unplanned='07:00',
    x=>x.references[0].days.push({date:'2026-01-02',events:{event:'06:00'}}),
    x=>x.plan[0].timeZone='+03:00',
    x=>x.mode='repair-offset',
    x=>Object.defineProperty(x.plan[0].dates,0,{get(){throw Error('array getter must not run');},enumerable:true}),
    x=>Object.defineProperty(x,'references',{get(){throw Error('getter must not run');},enumerable:true}),
  ]){const input=one('2026-01-01','06:00','2026-01-01T06:00:00Z');modify(input);assert.throws(()=>compareCalendars(input));}
});
test('host timezone does not change comparison; caller data is unchanged',()=>{
  const sample=structuredClone(syntheticExample),before=JSON.stringify(sample);compareCalendars(sample);assert.equal(JSON.stringify(sample),before);
  const code=`import {compareCalendars} from './validation/index.mjs';import {syntheticExample} from './validation/synthetic-example.mjs';console.log(JSON.stringify(compareCalendars(syntheticExample)));`;
  const results=['UTC','America/New_York','Pacific/Apia'].map(TZ=>{const r=spawnSync(process.execPath,['--input-type=module','-e',code],{cwd:dir,env:{...process.env,TZ},encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout;});
  assert.equal(results[0],results[1]);assert.equal(results[0],results[2]);
});
