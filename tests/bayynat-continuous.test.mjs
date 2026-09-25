import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {calculateContinuousCandidate,CONTINUOUS_FIELDS} from '../methods/bayynat/implementation/continuous-candidate.mjs';
import {solarAltitude} from '../core/astronomy/continuous-solver.mjs';
import {asrGeometry} from '../core/astronomy/physical-asr-solver.mjs';

// Source-free outputs of the previous five-marker continuous wrapper.
// Algorithm parity fixtures only; these are not institutional observations.
const parity=[
 {input:{date:'2031-04-05',latitude:35.68,longitude:139.68,timeZone:'Asia/Tokyo'},raw:[1933095347049.7778,1933100591413.0977,1933123449074.944,1933146342063.193,1933151602279.5483]},
 {input:{date:'2024-04-15',latitude:-6.17797994918,longitude:106.774887126,timeZone:'Asia/Jakarta'},raw:[1713131035947.959,1713135231732.7283,1713156773861.806,1713178311370.0515,1713182508807.4976]},
 {input:{date:'2028-03-26',latitude:51.5,longitude:-.12,timeZone:'Europe/London'},raw:[1837655569092.7563,1837662510606.3066,1837685159335.9905,1837707870471.856,1837714848721.656]},
 {input:{date:'2031-12-31',latitude:1.87,longitude:-157.43,timeZone:'Pacific/Kiritimati'},raw:[1956410217746.2803,1956414705974.6655,1956436338896.3,1956457972066.1094,1956462458909.9673]},
];
const ordinary=parity[0].input;
function rendering(result,input){
 const fmt=new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn',{timeZone:input.timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
 for(const e of Object.values(result.events)){
  if(e.rawEpoch===null)continue;
  assert.equal(e.epoch,Math.round(e.rawEpoch/60000)*60000);
  const p=Object.fromEntries(fmt.formatToParts(e.epoch).map(x=>[x.type,x.value]));
  assert.equal(e.localDate,`${p.year}-${p.month}-${p.day}`);assert.equal(e.time,`${p.hour}:${p.minute}`);
  assert.equal(e.utc,new Date(e.epoch).toISOString());assert.equal(e.eventLocalDateDiffers,e.localDate!==input.date);
  assert.equal(e.utcOffsetMinutes,(Date.parse(`${e.localDate}T${p.hour}:${p.minute}:${p.second}Z`)-e.epoch)/60000);
 }
}

test('Bayynat continuous preserves five raw events and applies uniform nearest rounding',()=>{
 const names=['fajr','sunrise','dhuhr','sunset','ishaTable'];
 for(const {input,raw} of parity){
  const result=calculateContinuousCandidate(input);assert.deepEqual(Object.keys(result.events),CONTINUOUS_FIELDS);
  names.forEach((name,index)=>assert(Math.abs(result.events[name].rawEpoch-raw[index])<.01,name));rendering(result,input);
  for(const [name,target,direction] of [['fajr',-18,1],['sunrise',-5/6,1],['sunset',-5/6,-1],['ishaTable',-18,-1]]){
   const t=result.events[name].rawEpoch;assert(Math.abs(solarAltitude(t,input.latitude,input.longitude)-target)<1e-6);
   assert(direction*(solarAltitude(t+1000,input.latitude,input.longitude)-solarAltitude(t-1000,input.latitude,input.longitude))>0,name);
  }
  for(const flag of ['official','productionReady','notificationEligible','legalWindowInterpretation'])assert.equal(result[flag],false);
  assert(result.qualityFlags.some(f=>f.code==='physical-asr-is-separate-sixth-marker-continuation'));
  for(const e of Object.values(result.events))assert.equal(e.notificationEligible,false);
 }
});

test('Bayynat sixth marker is a positive instantaneous factor-1 Asr root',()=>{
 for(const input of [ordinary,parity[1].input,{date:'2031-07-15',latitude:-33.9249,longitude:18.4241,timeZone:'Africa/Johannesburg'},
  {date:'2031-10-15',latitude:-.1807,longitude:-78.4678,timeZone:'America/Guayaquil'}]){
  const result=calculateContinuousCandidate(input),event=result.events.asrTable,transit=result.diagnostic.transitRawEpoch;
  assert(event.rawEpoch>transit&&event.rawEpoch<transit+12*3600000);
  const options={latitude:input.latitude,longitude:input.longitude,asrFactor:1,ephemeris:'usno'},at=asrGeometry(event.rawEpoch,options);
  assert(at.physical&&at.altitude>0&&at.continuedTarget>0&&at.margin>0);assert(Math.abs(at.residual)<1e-6);
  assert(asrGeometry(event.rawEpoch-1000,options).residual>0);assert(asrGeometry(event.rawEpoch+1000,options).residual<0);
  assert.equal(event.diagnostic.asrShadowFactor,1);assert(event.qualityFlags.some(f=>f.code==='physical-asr-continuation-not-institution-confirmed'));
 }
});

test('Bayynat continuous preserves DST, dateline and actual event dates',()=>{
 for(const [date,hours] of [['2028-03-26',23],['2028-10-29',25]]){
  const input={date,latitude:51.5,longitude:-.12,timeZone:'Europe/London'},result=calculateContinuousCandidate(input);
  assert.equal(result.diagnostic.civilDayHours,hours);rendering(result,input);
 }
 for(const input of [parity[3].input,{date:'2000-01-01',latitude:27.7,longitude:85.3,timeZone:'Asia/Kathmandu'},
  {date:'2099-12-31',latitude:-.1807,longitude:-78.4678,timeZone:'America/Guayaquil'},
  {date:'2024-06-21',latitude:0,longitude:180,timeZone:'UTC'}]){
  const result=calculateContinuousCandidate(input);rendering(result,input);
  if(input.longitude===180){assert.equal(result.events.fajr.localDate,'2024-06-20');assert.equal(result.events.fajr.eventLocalDateDiffers,true);assert(result.events.fajr.qualityFlags.some(f=>f.code==='event-local-date-differs-from-requested-date'));}
 }
 assert.throws(()=>calculateContinuousCandidate({date:'2011-12-30',latitude:-13.8,longitude:-171.75,timeZone:'Pacific/Apia'}),/civil-date-does-not-exist/);
});

test('Bayynat continuous preserves polar unavailability without replacement clocks',()=>{
 for(const latitude of [-90,90]){
  const result=calculateContinuousCandidate({date:'2031-06-21',latitude,longitude:0,timeZone:'UTC'});
  for(const e of Object.values(result.events)){assert.equal(e.status,'unavailable');for(const key of ['rawEpoch','epoch','utc','localDate','time'])assert.equal(e[key],null);assert.match(e.reason,/geographic-pole/);}
 }
 const winter=calculateContinuousCandidate({date:'2031-12-21',latitude:78.2,longitude:15.6,timeZone:'Arctic/Longyearbyen'});
 assert.equal(winter.events.asrTable.rawEpoch,null);assert.equal(winter.events.asrTable.reason,'no-positive-sun-height-at-transit');assert.equal(winter.events.sunrise.rawEpoch,null);
 const summer=calculateContinuousCandidate({date:'2031-06-21',latitude:78.2,longitude:15.6,timeZone:'Arctic/Longyearbyen'});
 for(const key of ['fajr','sunrise','ishaTable'])assert.equal(summer.events[key].rawEpoch,null);
});

test('Bayynat continuous accepts exactly four own fields and no fitted controls',()=>{
 for(const input of [null,[],Object.create(ordinary),{...ordinary,offsetMinutes:1},{...ordinary,rounding:'ceil'},{...ordinary,asrFactor:2},
  {...ordinary,date:'1999-12-31'},{...ordinary,date:'2100-01-01'},{...ordinary,date:'2031-02-29'},{...ordinary,latitude:NaN},{...ordinary,longitude:181},{...ordinary,timeZone:'CET'}])assert.throws(()=>calculateContinuousCandidate(input));
 assert.throws(()=>calculateContinuousCandidate());assert.throws(()=>calculateContinuousCandidate(ordinary,{}));
 assert.throws(()=>calculateContinuousCandidate({...ordinary,[Symbol('hidden')]:1}));
 let called=false;const accessor={...ordinary};Object.defineProperty(accessor,'latitude',{enumerable:true,get(){called=true;return 0;}});assert.throws(()=>calculateContinuousCandidate(accessor));assert.equal(called,false);
 const hidden={...ordinary};Object.defineProperty(hidden,'latitude',{enumerable:false,value:ordinary.latitude});assert.throws(()=>calculateContinuousCandidate(hidden));
 const input=Object.freeze({...ordinary});calculateContinuousCandidate(input);assert.deepEqual(input,ordinary);
 const a=calculateContinuousCandidate(input);a.events.sunrise.diagnostic.thresholdDegrees=100;assert.equal(calculateContinuousCandidate(input).events.sunrise.diagnostic.thresholdDegrees,-5/6);
});

test('Bayynat continuous runs offline without references, libraries or subprocesses under either host zone',()=>{
 const root=new URL('../',import.meta.url),file=p=>fileURLToPath(new URL(p,root));
 const inputs=[ordinary,parity[3].input,{date:'2031-06-21',latitude:90,longitude:0,timeZone:'UTC'}];
 const program=`import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {get} from 'node:https';import {spawnSync} from 'node:child_process';
 import {calculateContinuousCandidate} from ${JSON.stringify(new URL('methods/bayynat/implementation/continuous-candidate.mjs',root).href)};
 assert.equal(process.permission.has('net'),false);
 await assert.rejects(new Promise((resolve,reject)=>get('https://example.invalid/',resolve).on('error',reject)),{code:'ERR_ACCESS_DENIED'});
 assert.throws(()=>spawnSync(process.execPath,['--version']),{code:'ERR_ACCESS_DENIED'});
 for(const path of ${JSON.stringify(['tests/cases.json','methods/bayynat/validation.json','node_modules/adhan/package.json'].map(file))})assert.throws(()=>readFileSync(path),{code:'ERR_ACCESS_DENIED'});
 process.stdout.write(JSON.stringify(${JSON.stringify(inputs)}.map(x=>calculateContinuousCandidate(x))));`;
 const allowed=['package.json','methods/bayynat/implementation/continuous-candidate.mjs','methods/shia-angles/implementation/geometry.mjs','core/astronomy/'];
 for(const TZ of ['UTC','Pacific/Honolulu']){
  const child=spawnSync(process.execPath,['--permission',...allowed.map(p=>'--allow-fs-read='+file(p)),'--input-type=module','--eval',program],{encoding:'utf8',env:{...process.env,TZ},timeout:30000});
  assert.ifError(child.error);assert.equal(child.status,0,child.stderr);assert.deepEqual(JSON.parse(child.stdout),inputs.map(x=>calculateContinuousCandidate(x)));
 }
});
