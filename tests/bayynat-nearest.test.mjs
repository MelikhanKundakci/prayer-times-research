import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {calculate,calculateDay,calculateNearestCandidate} from '../methods/bayynat/index.mjs';
const point={latitude:35.68,longitude:139.69,timeZone:'Asia/Tokyo'};
const input={...point,date:'2024-11-15'};

test('Bayynat nearest is opt-in and preserves all unrounded geometry',()=>{
 assert.deepEqual(calculate(input),calculateDay(input));
 assert.deepEqual(calculate({...input,variant:'point-utc12-h5over6-ceil'}),calculateDay(input));
 assert.deepEqual(calculate({...input,variant:'point-utc12-h5over6-nearest'}),calculateNearestCandidate(input));
 for(const date of ['2000-02-29','2024-04-15','2026-07-01','2099-12-31']){
 const a=calculateDay({...input,date}),b=calculateNearestCandidate({...input,date});
 assert.deepEqual(b.diagnostic,a.diagnostic);assert.deepEqual(b.location,a.location);
 for(const [name,x]of Object.entries(a.events)){const y=b.events[name];assert.equal(y.rawEpoch,x.rawEpoch);assert.deepEqual(y.diagnostic,x.diagnostic);assert.equal(y.status,x.status);assert.equal(y.reason,x.reason);assert.equal(y.notificationEligible,false);
  if(y.rawEpoch!==null){assert.equal(y.epoch,Math.round(y.rawEpoch/60000)*60000);assert([0,60000].includes(x.epoch-y.epoch));}
 }
 assert.equal(b.notificationEligible,false);assert.equal(b.official,false);assert.equal(b.productionReady,false);
 }
});

test('Bayynat nearest preserves unavailable polar events and IANA event dates',()=>{
 for(const latitude of [-90,90]){const result=calculateNearestCandidate({...input,latitude});for(const e of Object.values(result.events)){assert.equal(e.status,'unavailable');assert.equal(e.time,null);assert.equal(e.utc,null);}}
 for(const x of [{...input,date:'2028-03-26',latitude:51.5,longitude:-.12,timeZone:'Europe/London'},
 {...input,date:'2031-12-31',latitude:1.87,longitude:-157.43,timeZone:'Pacific/Kiritimati'},
 {...input,date:'2034-02-01',latitude:27.7,longitude:85.3,timeZone:'Asia/Kathmandu'}]){
 const a=calculateDay(x),b=calculateNearestCandidate(x);assert.deepEqual(a.diagnostic,b.diagnostic);
 const fmt=new Intl.DateTimeFormat('en-CA',{timeZone:x.timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
 for(const e of Object.values(b.events)){if(e.epoch===null)continue;const p=Object.fromEntries(fmt.formatToParts(e.epoch).map(x=>[x.type,x.value]));assert.equal(e.localDate,`${p.year}-${p.month}-${p.day}`);assert.equal(e.time,`${p.hour}:${p.minute}`);}
 }
 assert.throws(()=>calculateNearestCandidate({...input,date:'2011-12-30',latitude:-13.8,longitude:-171.75,timeZone:'Pacific/Apia'}));
});

test('Bayynat nearest retains strict inputs and cannot accept fitted offset controls',()=>{
 for(const change of [{offsetMinutes:-1},{rounding:'floor'},{date:'2027-02-29'},{latitude:91},{longitude:NaN},{timeZone:'CET'}])assert.throws(()=>calculateNearestCandidate({...input,...change}));
 assert.throws(()=>calculateNearestCandidate(input,{}));assert.throws(()=>calculate({...input,variant:'floor'}));
 let called=false;const bad={...input};Object.defineProperty(bad,'latitude',{enumerable:true,get(){called=true;return 0;}});assert.throws(()=>calculateNearestCandidate(bad));assert.equal(called,false);
 const before=JSON.stringify(input);calculateNearestCandidate(Object.freeze({...input}));assert.equal(JSON.stringify(input),before);
});

test('Bayynat nearest runs offline without references, libraries or subprocesses',()=>{
 const root=new URL('../',import.meta.url),file=p=>fileURLToPath(new URL(p,root));
 const code=`import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {get} from 'node:https';import {spawnSync} from 'node:child_process';
 import {calculateNearestCandidate} from ${JSON.stringify(new URL('methods/bayynat/implementation/nearest-candidate.mjs',root).href)};
 await assert.rejects(new Promise((resolve,reject)=>get('https://example.invalid/',resolve).on('error',reject)),{code:'ERR_ACCESS_DENIED'});
 assert.throws(()=>spawnSync(process.execPath,['--version']),{code:'ERR_ACCESS_DENIED'});
 for(const p of ${JSON.stringify(['tests/cases.json','node_modules/adhan/package.json'].map(file))})assert.throws(()=>readFileSync(p),{code:'ERR_ACCESS_DENIED'});
 process.stdout.write(JSON.stringify(calculateNearestCandidate(${JSON.stringify(input)})));`;
 for(const TZ of ['UTC','Pacific/Honolulu']){
 const allow=['package.json','methods/bayynat/implementation/','core/astronomy/solar-usno-v2.mjs'];
 const run=spawnSync(process.execPath,['--permission',...allow.map(p=>'--allow-fs-read='+file(p)),'--input-type=module','--eval',code],{encoding:'utf8',timeout:30000,env:{...process.env,TZ}});
 assert.ifError(run.error);assert.equal(run.status,0,run.stderr);assert.deepEqual(JSON.parse(run.stdout),calculateNearestCandidate(input));
 }
});
