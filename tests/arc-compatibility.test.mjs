import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {calculate,calculateDay,calculateArcCompatibility} from '../methods/shia-angles/index.mjs';
import {julianMonthRoundingError} from '../methods/shia-angles/implementation/arc-compatibility/calculate.mjs';
const point={latitude:51.5,longitude:-.12,timeZone:'Europe/London',maghribAngle:3.75};
const input={...point,date:'2028-05-21'};

test('ARC compatibility is explicit and leaves the physical default unchanged',()=>{
 const physical={date:input.date,latitude:point.latitude,longitude:point.longitude,timeZone:point.timeZone,profileId:'arc-outside-iran-angles-own',engine:'usno'};
 assert.deepEqual(calculate(physical),calculateDay(physical));
 assert.deepEqual(calculate({...physical,variant:'own'}),calculateDay(physical));
 const result=calculate({...input,variant:'arc-publisher-compatibility'});
 assert.deepEqual(result,calculateArcCompatibility(input));
 assert.equal(result.model.mode,'publisher-compatibility');
 assert.equal(result.official,false);assert.equal(result.productionReady,false);assert.equal(result.notificationEligible,false);
 for(const e of Object.values(result.events)){assert.equal(e.notificationEligible,false);assert.equal(e.sourceEventDateConfirmed,false);}
 for(const e of ['asr','isha']){assert.equal(result.events[e].status,'unspecified');assert.equal(result.events[e].time,null);}
});

test('Julian-month hypothesis has a fixed arithmetic definition, not a residual lookup',()=>{
 const actual=Array.from({length:12},(_,i)=>julianMonthRoundingError(`2028-${String(i+1).padStart(2,'0')}-15`));
 assert.deepEqual(actual,[0,0,0,0,1,0,1,0,0,1,0,1]);
});

test('ARC midpoint uses unrounded same-row instants and never fills missing twilight',()=>{
 const result=calculateArcCompatibility(input),{fajr,sunset,midnight}=result.events;
 assert.equal(midnight.rawEpochMilliseconds,(fajr.rawEpochMilliseconds+86400000+sunset.rawEpochMilliseconds)/2);
 const summer=calculateArcCompatibility({...input,date:'2029-06-21',latitude:59.3293,longitude:18.0686,timeZone:'Europe/Stockholm'});
 for(const name of ['fajr','midnight']){const e=summer.events[name];assert.equal(e.status,'unavailable');for(const k of ['time','localDate','isoUtc','rawEpochMilliseconds'])assert.equal(e[k],null);}
 assert.equal(summer.events.sunrise.status,'experimental-compatibility');
});

test('Model-assigned dates retain local/UTC consistency across DST and date-line cases',()=>{
 const scenarios=[input,{...input,date:'2028-03-26'},{...input,date:'2028-10-29'},
 {...input,date:'2031-12-31',latitude:1.8721,longitude:-157.4278,timeZone:'Pacific/Kiritimati'},
 {...input,date:'2000-02-29',latitude:-36.8,longitude:174.7,timeZone:'Pacific/Auckland'},
 {...input,date:'2099-12-31',latitude:27.7,longitude:85.3,timeZone:'Asia/Kathmandu'}];
 for(const args of scenarios){const result=calculateArcCompatibility(args);const fmt=new Intl.DateTimeFormat('en-CA',{timeZone:args.timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
  for(const e of Object.values(result.events)){if(e.time===null)continue;
   assert.equal(Date.parse(e.isoUtc),Math.round(e.rawEpochMilliseconds/60000)*60000);
   const p=Object.fromEntries(fmt.formatToParts(Date.parse(e.isoUtc)).map(x=>[x.type,x.value]));
   assert.equal(e.localDate,`${p.year}-${p.month}-${p.day}`);assert.equal(e.time,`${p.hour}:${p.minute}`);
  }
 }
 const dateLine=calculateArcCompatibility(scenarios[3]);assert.equal(dateLine.events.dhuhr.localDate,'2031-12-31');assert(dateLine.events.dhuhr.isoUtc.startsWith('2031-12-30'));
 assert.throws(()=>calculateArcCompatibility({...input,date:'2011-12-30',latitude:-13.8,longitude:-171.75,timeZone:'Pacific/Apia'}));
});

test('ARC public entry rejects ambiguous profiles, hidden/getter inputs and invalid domains',()=>{
 for(const change of [{latitude:60.1},{longitude:181},{maghribAngle:4},{timeZone:'CET'},{timeZone:'+03:00'},{date:'2027-02-29'},{date:'2100-01-01'},{date:'1999-12-31'},{mode:'astronomical'},{engine:'noaa'},{offsetMinutes:1}])assert.throws(()=>calculateArcCompatibility({...input,...change}));
 for(const key of Object.keys(input)){const bad={...input};delete bad[key];assert.throws(()=>calculateArcCompatibility(bad));}
 assert.throws(()=>calculateArcCompatibility(input,{}));assert.throws(()=>calculateArcCompatibility(Object.create(input)));
 let called=false;const bad={...input};Object.defineProperty(bad,'latitude',{enumerable:true,get(){called=true;return 0;}});assert.throws(()=>calculateArcCompatibility(bad));assert.equal(called,false);
 const symbol={...input,[Symbol('hidden')]:1};assert.throws(()=>calculateArcCompatibility(symbol));
 const before=JSON.stringify(input);calculateArcCompatibility(Object.freeze({...input}));assert.equal(JSON.stringify(input),before);
 assert.throws(()=>calculate({...input,variant:'shia'}));
});

test('ARC compatibility computes with calendar files, network and subprocess access denied',()=>{
 const root=new URL('../',import.meta.url),file=p=>fileURLToPath(new URL(p,root));
 const url=new URL('methods/shia-angles/implementation/arc-compatibility/calculate.mjs',root).href;
 const code=`import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {spawnSync} from 'node:child_process';import {get} from 'node:https';
 import {calculateArcCompatibility} from ${JSON.stringify(url)};
 assert.equal(process.permission.has('net'),false);
 await assert.rejects(new Promise((resolve,reject)=>get('https://example.invalid/',resolve).on('error',reject)),{code:'ERR_ACCESS_DENIED'});
 assert.throws(()=>spawnSync(process.execPath,['--version']),{code:'ERR_ACCESS_DENIED'});
 assert.throws(()=>readFileSync(${JSON.stringify(file('tests/cases.json'))}),{code:'ERR_ACCESS_DENIED'});
 assert.throws(()=>readFileSync(${JSON.stringify(file('node_modules/adhan/package.json'))}),{code:'ERR_ACCESS_DENIED'});
 process.stdout.write(JSON.stringify(calculateArcCompatibility(${JSON.stringify(input)})));`;
 for(const TZ of ['UTC','Pacific/Honolulu']){
 const allow=['package.json','methods/shia-angles/implementation/arc-compatibility/','core/input.mjs','core/astronomy/solar-usno-v2.mjs'];
 const run=spawnSync(process.execPath,['--permission',...allow.map(p=>'--allow-fs-read='+file(p)),'--input-type=module','--eval',code],{encoding:'utf8',timeout:30000,env:{...process.env,TZ}});
 assert.ifError(run.error);assert.equal(run.status,0,run.stderr);assert.deepEqual(JSON.parse(run.stdout),calculateArcCompatibility(input));
 }
});
