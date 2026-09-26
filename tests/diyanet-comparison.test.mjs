import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {compareDiyanetPointDay,COMPARISON_EVENTS} from '../core/diagnostics/diyanet-comparison.mjs';
import {calculateLocalDay,LOCAL_DIYANET_SPA_PROFILE} from '../core/local/index.mjs';
import {createDiyanetCalculator} from '../core/diyanet/index.mjs';

const frankfurt={date:'2026-09-26',latitude:50.1109,longitude:8.6821,timeZone:'Europe/Berlin'};
const available=e=>['calculated','estimated'].includes(e.status);
const script=fileURLToPath(new URL('../scripts/compare-diyanet.mjs',import.meta.url));
const root=new URL('../',import.meta.url),file=path=>fileURLToPath(new URL(path,root));

test('Frankfurt reports absolute model deltas and keeps both event traces',()=>{
  const result=compareDiyanetPointDay(frankfurt);
  assert.equal(result.schema,'diyanet-point-model-comparison/v1');
  assert.match(result.meaning,/Model-to-model/);
  assert.equal(result.models.local.profileId,LOCAL_DIYANET_SPA_PROFILE);
  assert.equal(result.models.local.astronomyProvider,'SPA-continuous-point-v1');
  assert.equal(result.models.calendar.dateBasis,'civil-date');
  assert.equal(result.models.calendar.solarModel,'USNO-daily-civil-UTC00');
  assert.equal(result.models.local.official,false);assert.equal(result.models.calendar.official,false);
  assert.deepEqual(Object.keys(result.events),COMPARISON_EVENTS);
  assert.equal(result.summary.pairedAvailable,6);assert.equal(result.summary.pairedAbsent,0);
  assert.equal(result.summary.localOnly,0);assert.equal(result.summary.calendarOnly,0);

  const local=calculateLocalDay({...frankfurt,profile:LOCAL_DIYANET_SPA_PROFILE});
  const calendar=createDiyanetCalculator({cacheSize:0,dateBasis:'civil-date'}).calculateDay(frankfurt);
  for(const name of COMPARISON_EVENTS){
    const compared=result.events[name],a=local.events[name],b=calendar.events[name];
    assert.equal(compared.local.rawEpochMilliseconds,a.rawEpochMilliseconds);
    assert.equal(compared.calendar.rawEpochMilliseconds,b.rawEpochMilliseconds);
    assert.equal(compared.rawDifferenceSeconds,(a.rawEpochMilliseconds-b.rawEpochMilliseconds)/1000);
    assert.equal(compared.selectedEpochDifferenceMilliseconds,a.epochMilliseconds-b.epochMilliseconds);
    assert.equal(compared.roundedEpochDifferenceMilliseconds,a.roundedEpochMilliseconds-b.roundedEpochMilliseconds);
    assert.equal(compared.actualLocalDateChanged,a.localDate!==b.localDate);
    assert.equal(compared.roundedCalendarDateChanged,a.calendarDate!==b.calendarDate);
  }
  assert.equal(result.events.asr.local.time,'16:35');
  assert.equal(result.events.asr.calendar.time,'16:36');
  assert.equal(result.events.asr.roundedEpochDifferenceMilliseconds,-60_000);
});

test('summer status disagreements remain explicit and receive no replacement delta',()=>{
  const result=compareDiyanetPointDay({date:'2027-06-21',latitude:50.11,longitude:8.68,timeZone:'Europe/Berlin'});
  assert.equal(result.events.fajr.local.status,'policy-blocked');
  assert.equal(result.events.fajr.calendar.status,'estimated');
  assert.equal(result.events.isha.local.status,'policy-blocked');
  assert.equal(result.events.isha.calendar.status,'estimated');
  for(const name of ['fajr','isha']){
    assert.equal(result.events[name].local.rawEpochMilliseconds,null);
    assert.equal(result.events[name].rawDifferenceSeconds,null);
    assert.equal(result.events[name].selectedEpochDifferenceMilliseconds,null);
    assert.equal(result.events[name].roundedEpochDifferenceMilliseconds,null);
  }
  assert.deepEqual(result.summary.statusMismatches,['fajr','isha']);
  assert.equal(result.summary.localOnly,0);assert.equal(result.summary.calendarOnly,2);
  assert.equal(result.summary.statusCounts.local['policy-blocked'],2);
  assert.equal(result.summary.statusCounts.calendar.estimated,2);
});

test('dateline point retains different rounded event dates and absolute epoch difference',()=>{
  const result=compareDiyanetPointDay({date:'2027-06-20',latitude:50,longitude:170,timeZone:'America/Adak'});
  const maghrib=result.events.maghrib;
  assert.equal(maghrib.local.status,'calculated');assert.equal(maghrib.calendar.status,'calculated');
  assert.equal(maghrib.local.localDate,'2027-06-20');assert.equal(maghrib.calendar.localDate,'2027-06-20');
  assert.equal(maghrib.local.calendarDate,'2027-06-21');assert.equal(maghrib.calendar.calendarDate,'2027-06-20');
  assert.equal(maghrib.roundedCalendarDateChanged,true);
  assert.equal(maghrib.roundedEpochDifferenceMilliseconds,
    maghrib.local.roundedEpochMilliseconds-maghrib.calendar.roundedEpochMilliseconds);
  assert.notEqual(maghrib.rawDifferenceSeconds,0);
});

test('skipped and ambiguous civil dates are explicit errors',()=>{
  assert.throws(()=>compareDiyanetPointDay({date:'2011-12-30',latitude:-13.83,longitude:-171.75,timeZone:'Pacific/Apia'}),
    /No apparent solar transit belongs to civil date 2011-12-30/);
  assert.throws(()=>compareDiyanetPointDay({date:'2026-11-01',latitude:50,longitude:115,timeZone:'America/New_York'}),
    /Ambiguous apparent solar transit for civil date 2026-11-01/);
});

test('comparison input is strict and limited to the engines’ shared supported domain',()=>{
  for(const bad of [
    {...frankfurt,date:'2027-02-30'},{...frankfurt,date:'2000-12-31'},{...frankfurt,date:'2099-01-01'},
    {...frankfurt,latitude:-60.01},{...frankfurt,latitude:75.01},{...frankfurt,longitude:181},
    {...frankfurt,timeZone:'+01:00'},{...frankfurt,timeZone:'Mars/Phobos'},
  ])assert.throws(()=>compareDiyanetPointDay(bad),RangeError);
  assert.throws(()=>compareDiyanetPointDay({...frankfurt,profile:LOCAL_DIYANET_SPA_PROFILE}),TypeError);
  assert.throws(()=>compareDiyanetPointDay({...frankfurt,latitude:undefined}),TypeError);
  let touched=false;
  const getter={...frankfurt};Object.defineProperty(getter,'latitude',{enumerable:true,get(){touched=true;return frankfurt.latitude;}});
  assert.throws(()=>compareDiyanetPointDay(getter),TypeError);assert.equal(touched,false);
});

test('offline CLI prints model labels, JSON deltas, and no external reference claim',()=>{
  const args=[script,'2027-03-20','41.0082','28.9784','Europe/Istanbul','--json'];
  const run=spawnSync(process.execPath,args,{encoding:'utf8',timeout:15000});
  assert.equal(run.status,0,run.stderr);
  const result=JSON.parse(run.stdout);
  assert.equal(result.models.local.astronomyProvider,'SPA-continuous-point-v1');
  assert.equal(result.models.calendar.dateBasis,'civil-date');
  assert.equal(result.summary.pairedAvailable,6);
  const help=spawnSync(process.execPath,[script,'--help'],{encoding:'utf8'});
  assert.equal(help.status,0);assert.match(help.stdout,/YYYY-MM-DD LATITUDE LONGITUDE IANA_TIME_ZONE/);
  const invalid=spawnSync(process.execPath,[script,'2027-03-20','41','28','Europe/Istanbul','--save'],{encoding:'utf8'});
  assert.notEqual(invalid.status,0);assert.match(invalid.stderr,/Usage:/);
});

test('comparison runs without network, write access, or reference-calendar and research files',()=>{
  const permitted=['package.json','core/input.mjs','core/diagnostics/diyanet-comparison.mjs',
    'core/local/index.mjs','core/local/solar.mjs','core/local/northern.mjs','core/local/summer.mjs',
    'core/local/profiles.mjs','core/local/selection.mjs','core/local/night-fraction.mjs',
    'core/diyanet/index.mjs','core/diyanet/calendar.mjs','core/diyanet/astronomy.mjs','core/diyanet/horizons.mjs','core/diyanet/seasonal.mjs',
    'core/astronomy/continuous-solver.mjs','core/astronomy/solar-usno-v2.mjs','core/astronomy/spa-point.mjs','core/astronomy/spa-coefficients.json'];
  const denied=['core/local/verification/diyanet-spa-comparison.json','core/local/verification/diyanet-spa-reference-fixtures.json',
    'methods/diyanet/README.md','tests/model-snapshots.json'];
  const input={date:'2027-03-20',latitude:41.0082,longitude:28.9784,timeZone:'Europe/Istanbul'};
  const program=`
    import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {get} from 'node:https';
    import {compareDiyanetPointDay} from ${JSON.stringify(new URL('../core/diagnostics/diyanet-comparison.mjs',import.meta.url).href)};
    assert.equal(process.versions.tz,'2026d');assert.equal(process.permission.has('net'),false);
    assert.equal(process.permission.has('fs.write'),false);
    await assert.rejects(new Promise((resolve,reject)=>get('https://example.invalid/',resolve).on('error',reject)),{code:'ERR_ACCESS_DENIED'});
    for(const path of ${JSON.stringify(denied.map(file))})assert.throws(()=>readFileSync(path),{code:'ERR_ACCESS_DENIED'});
    console.log(JSON.stringify(compareDiyanetPointDay(${JSON.stringify(input)})));
  `;
  const expected=compareDiyanetPointDay(input);
  for(const hostZone of ['UTC','Pacific/Honolulu']){
    const child=spawnSync(process.execPath,['--permission',...permitted.map(path=>`--allow-fs-read=${file(path)}`),
      '--input-type=module','--eval',program],{cwd:file('.'),env:{...process.env,TZ:hostZone},encoding:'utf8',timeout:10000});
    assert.ifError(child.error);assert.equal(child.status,0,child.stderr);
    assert.deepEqual(JSON.parse(child.stdout),expected);
  }
});

test('comparison results are detached from input and do not mutate later calculations',()=>{
  const input={...frankfurt},first=compareDiyanetPointDay(input);
  input.latitude=51;first.input.latitude=-100;first.events.asr.local.time='mutated';
  const next=compareDiyanetPointDay(frankfurt);
  assert.equal(next.input.latitude,frankfurt.latitude);
  assert.notEqual(next.events.asr.local.time,'mutated');
  assert.equal(next.events.asr.local.time,'16:35');
});
