import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {calculate} from '../methods/uae-awqaf/index.mjs';
import {dryRefraction} from '../methods/uae-awqaf/implementation/own-ray/refraction.mjs';
const root = new URL('../',import.meta.url);
const example = JSON.parse(readFileSync(new URL('methods/uae-awqaf/examples/own-ray-input.json',root)));
const fixtures = JSON.parse(readFileSync(new URL('tests/uae-radial-fixtures.json',root))).cases;

test('Own zenith-angle integral agrees with separate radial-coordinate quadrature',()=>{
  assert.equal(fixtures.length,108);
  for(const c of fixtures) {
    const result = dryRefraction(c.input), finer = dryRefraction({...c.input,segments:512});
    assert(Math.abs(result.refractionDegrees-c.refractionDegrees)*3600<.00001);
    assert(Math.abs(result.refractionDegrees-finer.refractionDegrees)*3600<.00001);
    assert(result.maximumInvariantErrorMeters<2e-8);
  }
  assert.equal(dryRefraction({latitude:24,elevationMeters:0,observedAltitudeDegrees:90}).refractionDegrees,0);
  const at=a=>dryRefraction({latitude:24,elevationMeters:230,observedAltitudeDegrees:a}).refractionDegrees;
  assert(at(-.5)>at(0)&&at(0)>at(5)&&at(5)>at(45));
  assert(Math.abs(at(-.00001)-at(.00001))<.00001,'Smooth through the horizontal ray');
});

test('Own-ray selection preserves V2 default and four non-horizon events exactly',()=>{
  const {variant,...baseInput}=example;
  assert.deepEqual(calculate(baseInput),calculate({...baseInput,variant:'v2'}));
  for(const date of ['2000-02-29','2025-01-15','2026-04-15','2026-06-21','2026-11-15','2099-12-31']) {
    const base=calculate({...baseInput,date}), own=calculate({...example,date});
    for(const e of ['fajr','dhuhr','asr','isha'])assert.deepEqual(own.events[e],base.events[e]);
    assert(Date.parse(own.events.sunrise.utc)<=Date.parse(base.events.sunrise.utc));
    assert(Date.parse(own.events.maghrib.utc)>=Date.parse(base.events.maghrib.utc));
    for(const e of Object.values(own.events)) {
      assert.equal(e.date,date); assert.equal(e.eligibleForAutomaticNotifications,false);
      assert.equal(Date.parse(e.utc),Math.round(Date.parse(e.unroundedUtc)/60000)*60000);
    }
    assert.equal(own.official,false); assert.equal(own.appReady,false);
  }
});

test('Ray and method contracts reject unknown atmosphere changes, getters and invalid domains',()=>{
  const input={latitude:24,elevationMeters:230,observedAltitudeDegrees:-.5};
  for(const change of [{latitude:28},{elevationMeters:-1},{observedAltitudeDegrees:-2},{segments:15},{segments:null},{pressureMillibars:900},{humidity:60}])
    assert.throws(()=>dryRefraction({...input,...change}));
  assert.throws(()=>dryRefraction(input,{}));
  let called=false;const bad={...input};Object.defineProperty(bad,'latitude',{enumerable:true,get(){called=true;return 24;}});
  assert.throws(()=>dryRefraction(bad));assert.equal(called,false);
  assert.throws(()=>calculate({...example,variant:'pal'}));
  assert.throws(()=>calculate({...example,offsetMinutes:1}));
  assert.throws(()=>calculate({...example,timeZone:'UTC'}));
  const before=JSON.stringify(example);calculate(Object.freeze({...example}));assert.equal(JSON.stringify(example),before);
});

test('Own-ray runs with network, child-process, libraries and reference files inaccessible',()=>{
  const file=p=>fileURLToPath(new URL(p,root));
  const url=new URL('methods/uae-awqaf/index.mjs',root).href;
  const code=`import assert from 'node:assert/strict'; import {readFileSync} from 'node:fs';
    import {get} from 'node:https'; import {spawnSync} from 'node:child_process';
    import {calculate} from ${JSON.stringify(url)};
    assert.equal(process.permission.has('net'),false);
    await assert.rejects(new Promise((resolve,reject)=>get('https://example.invalid/',resolve).on('error',reject)),{code:'ERR_ACCESS_DENIED'});
    assert.throws(()=>spawnSync(process.execPath,['--version']),{code:'ERR_ACCESS_DENIED'});
    for(const p of ${JSON.stringify(['tests/uae-radial-fixtures.json','node_modules/adhan/package.json','methods/uae-awqaf/examples/own-ray-input.json'].map(file))})
      assert.throws(()=>readFileSync(p),{code:'ERR_ACCESS_DENIED'});
    process.stdout.write(JSON.stringify(calculate(${JSON.stringify(example)})));`;
  const allow=['package.json','methods/uae-awqaf/index.mjs','methods/uae-awqaf/implementation/','core/input.mjs','core/astronomy/'];
  for(const TZ of ['UTC','Pacific/Honolulu']){
    const run=spawnSync(process.execPath,['--permission',...allow.map(p=>'--allow-fs-read='+file(p)),'--input-type=module','--eval',code],
      {env:{...process.env,TZ},encoding:'utf8',timeout:30000});
    assert.ifError(run.error);assert.equal(run.status,0,run.stderr);assert.deepEqual(JSON.parse(run.stdout),calculate(example));
  }
});
