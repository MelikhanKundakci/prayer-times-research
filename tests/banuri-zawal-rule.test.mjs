import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {calculate} from '../methods/banuri-town/index.mjs';
import {calculateBanuriStrict} from '../methods/banuri-town/implementation/strict-api.mjs';
import {dhuhrFromRoundedZawal, calculateBanuriZawalPlusFive} from '../methods/banuri-town/implementation/zawal-plus-five.mjs';

const point = {latitude:24.9, longitude:67.1, timeZone:'Asia/Karachi'};

test('Banuri sourced opt-in retains default and every previously compared event', () => {
  for (const date of ['2000-02-29','2008-06-21','2026-03-20','2026-06-21','2026-12-21','2099-12-31']) {
    for (const [latitude,longitude] of [[24.9,67.1],[23,60],[37,78]]) {
      const location = {...point,latitude,longitude};
      const input = {date,...location};
      const base = calculate(input), changed = calculate({...input,variant:'zawal-plus-five'});
      assert.deepEqual(base, calculateBanuriStrict(date,location));
      assert.deepEqual(base, calculate({...input,variant:'strict'}));
      assert.equal(base.events.dhuhr.status,'unresolved');
      for(const name of ['fajr','sunrise','transit','asr','sunset','isha']) {
        assert.deepEqual(changed.events[name],base.events[name]);
      }
      const dhuhr=changed.events.dhuhr;
      assert.equal(Date.parse(dhuhr.utc)-Date.parse(base.events.transit.utc),300000);
      assert.equal(dhuhr.basisUtc,base.events.transit.utc);
      assert.equal(dhuhr.rawUtc,null);
      assert.equal(dhuhr.resolution,'minute');
      assert.equal(dhuhr.localDate,date);
      assert.equal(dhuhr.eligibleForAutomaticNotifications,false);
      assert.equal(changed.profile.appReady,false);
      assert.equal(changed.profile.official,false);
    }
  }
});

test('Minute-scale adapter advances the absolute date rather than editing a clock string', () => {
  const result=dhuhrFromRoundedZawal('2026-12-31T18:58:00.000Z','Asia/Karachi');
  assert.equal(result.utc,'2026-12-31T19:03:00.000Z');
  assert.equal(result.localDate,'2027-01-01');
  assert.equal(result.time,'00:03');
  assert.equal(dhuhrFromRoundedZawal('2024-02-29T23:58:00.000Z','Asia/Karachi').utc,'2024-03-01T00:03:00.000Z');
});

test('Banuri adapter rejects invented fractional Zawal precision and input overrides', () => {
  for(const utc of ['2026-02-30T12:00:00.000Z','2026-06-21T12:00:30.000Z',null,'12:00']) {
    assert.throws(()=>dhuhrFromRoundedZawal(utc,'Asia/Karachi'));
  }
  assert.throws(()=>dhuhrFromRoundedZawal('2026-06-21T12:00:00.000Z','UTC'));
  assert.throws(()=>calculateBanuriZawalPlusFive('2026-06-21',point,{}));
  const input={date:'2026-06-21',...point,variant:'zawal-plus-five'};
  for(const change of [{variant:'unknown'},{variant:undefined},{offsetMinutes:4},{latitude:0},{timeZone:'UTC'}]) {
    assert.throws(()=>calculate({...input,...change}));
  }
  let invoked=false;
  const bad={...input};
  Object.defineProperty(bad,'variant',{enumerable:true,get(){invoked=true;return 'zawal-plus-five';}});
  assert.throws(()=>calculate(bad)); assert.equal(invoked,false);
  assert.doesNotThrow(()=>calculate(Object.freeze({...input})));
});

test('Banuri sourced adapter executes without network, calendars or dependencies', () => {
  const root = new URL('../',import.meta.url), file=p=>fileURLToPath(new URL(p,root));
  const input={date:'2026-06-21',...point,variant:'zawal-plus-five'};
  const code=`import assert from 'node:assert/strict';
    import {readFileSync} from 'node:fs';
    import {calculate} from ${JSON.stringify(new URL('methods/banuri-town/index.mjs',root).href)};
    assert.equal(process.permission.has('net'),false);
    for(const p of ${JSON.stringify(['methods/banuri-town/validation.json','node_modules/adhan/package.json'].map(file))})
      assert.throws(()=>readFileSync(p),{code:'ERR_ACCESS_DENIED'});
    process.stdout.write(JSON.stringify(calculate(${JSON.stringify(input)})));`;
  const allow=['package.json','methods/banuri-town/index.mjs','methods/banuri-town/implementation/',
    'core/input.mjs','core/astronomy/'];
  const result=spawnSync(process.execPath,['--permission',...allow.map(p=>'--allow-fs-read='+file(p)),
    '--input-type=module','--eval',code],{env:{...process.env,TZ:'Pacific/Honolulu'},encoding:'utf8',timeout:30000});
  assert.ifError(result.error); assert.equal(result.status,0,result.stderr);
  assert.deepEqual(JSON.parse(result.stdout),calculate(input));
});
