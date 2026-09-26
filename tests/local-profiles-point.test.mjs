import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {calculateLocalDay,LOCAL_PROFILE,LOCAL_SEASONAL_PROFILE,LOCAL_PROFILES} from '../core/local/index.mjs';
import {selectRuleInstant} from '../core/local/selection.mjs';
const base={date:'2027-03-20',latitude:30.0444,longitude:31.2357,timeZone:'Africa/Cairo'};
const EGYPT='egypt-published-angles-point-v1',USA='fcna-usa-2017-point-v1',CANADA='fcna-canada-2017-point-v1',KEMENAG='kemenag-worked-example-point-v1';
const calculate=(profile,changes={})=>calculateLocalDay({...base,profile,...changes});
const names=['fajr','sunrise','dhuhr','asr','maghrib','isha'];
const root=new URL('../',import.meta.url),file=p=>fileURLToPath(new URL(p,root));

test('shared profile selection uses exact authority angles without importing Diyanet margins',()=>{
  for(const [profile,fajr,isha] of [[EGYPT,19.5,17.5],[USA,15,15],[CANADA,13,13]]){
    const d=calculate(profile);
    assert.equal(d.astronomy.events.fajr.thresholdDegrees,-fajr);
    assert.equal(d.astronomy.events.isha.thresholdDegrees,-isha);
    for(const name of names){
      assert.equal(d.events[name].rawEpochMilliseconds,d.astronomy.events[name].epochMilliseconds);
      assert.equal(d.events[name].adjustmentMinutes,0);
      assert.equal(d.events[name].resolution,'model-instant');
    }
    assert.equal(d.coverage.complete,true);
    assert.equal(d.coverage.prayerStartsComplete,false);
    assert.deepEqual(d.coverage.nonPrayerStartEvents,['dhuhr','asr','maghrib']);
    for(const name of ['fajr','isha'])assert.equal(d.events[name].role,'prayer-start-model');
    assert.equal(d.events.dhuhr.role,'solar-noon-marker');
    assert.equal(d.events.asr.role,'shadow-marker');
    assert.equal(d.events.maghrib.role,'sunset-marker');
    assert.equal(d.events.asr.ruleEvidence.classification,'local-convention');
    assert.equal(d.profile.official,false);
    assert.equal(d.calculation.northernPolicy,null);
  }
  const usa=calculate(USA),canada=calculate(CANADA);
  assert.ok(usa.events.fajr.rawEpochMilliseconds<canada.events.fajr.rawEpochMilliseconds);
  assert.ok(usa.events.isha.rawEpochMilliseconds>canada.events.isha.rawEpochMilliseconds);
});

test('angle profiles neither acquire a northern seasonal replacement nor erase geometric absence',()=>{
  const location={date:'2027-06-21',latitude:52.52,longitude:13.405,timeZone:'Europe/Berlin'};
  const egypt=calculate(EGYPT,location),diyanet=calculate(LOCAL_SEASONAL_PROFILE,location);
  assert.equal(egypt.astronomy.events.fajr.status,'unavailable');
  assert.equal(egypt.events.fajr.status,'unavailable');
  assert.equal(egypt.events.fajr.epochMilliseconds,null);
  assert.equal(egypt.calculation.northernPolicy,null);
  assert.equal(egypt.calculation.seasonalPolicy,null);
  assert.equal(diyanet.events.fajr.status,'estimated');
  for(const profile of [EGYPT,USA,CANADA]){
    const south=calculate(profile,{date:'2027-12-21',latitude:-80,longitude:0,timeZone:'UTC'});
    assert.equal(south.events.sunrise.status,'unavailable');
    assert.equal(south.calculation.northernPolicy,null);
  }
});

test('Kemenag continuous-point adaptation quantizes before margins and retains minute-only meaning',()=>{
  for(const [latitude,longitude,timeZone] of [[-6.2,106.8,'Asia/Jakarta'],[-.02,109.34,'Asia/Pontianak'],[-5.15,119.43,'Asia/Makassar'],[-2.53,140.72,'Asia/Jayapura']]){
    const d=calculate(KEMENAG,{latitude,longitude,timeZone});
    assert.equal(d.coverage.complete,true);assert.equal(d.coverage.prayerStartsComplete,true);
    assert.deepEqual(d.coverage.nonPrayerStartEvents,[]);
    for(const name of names){
      const e=d.events[name],raw=d.astronomy.events[name].epochMilliseconds;
      const margin=name==='sunrise'?-2:name==='dhuhr'?3:2;
      const basis=(name==='sunrise'?Math.floor(raw/60000):Math.ceil(raw/60000))*60000;
      assert.equal(e.basis.roundedBasisEpochMilliseconds,basis);
      assert.equal(e.epochMilliseconds,basis+margin*60000);
      assert.equal(e.rawEpochMilliseconds,e.roundedEpochMilliseconds);
      assert.equal(e.seconds,null);assert.equal(e.secondsDate,null);
      assert.equal(e.resolution,'minute');
      assert.equal(e.ruleEvidence.classification,'worked-example');
      assert.equal(Date.parse(e.utc),e.epochMilliseconds);
    }
    assert.equal(d.astronomy.events.sunrise.thresholdDegrees,-1);
  }
  for(const changes of [{latitude:8.01},{longitude:93.99},{timeZone:'UTC'},{timeZone:'Asia/Singapore'}])
    assert.throws(()=>calculate(KEMENAG,{latitude:-6.2,longitude:106.8,timeZone:'Asia/Jakarta',...changes}),RangeError);
});

test('source-defined prayer-start roles of existing Diyanet profiles remain intact',()=>{
  for(const profile of [LOCAL_PROFILE,LOCAL_SEASONAL_PROFILE]){
    const d=calculate(profile,{date:'2027-01-15',latitude:50.11,longitude:8.68,timeZone:'Europe/Berlin'});
    assert.equal(d.coverage.prayerStartsComplete,true);
    assert.deepEqual(d.coverage.nonPrayerStartEvents,[]);
    assert.equal(d.events.sunrise.role,'sunrise-marker');
    for(const name of names.filter(n=>n!=='sunrise'))assert.equal(d.events[name].role,'prayer-start-model');
  }
});

test('minute selection preserves exact boundaries, signed epochs and strict data-only inputs',()=>{
  for(const epochMilliseconds of [-60001,-60000,-59999,-1,0,1,59999,60000,60001]){
    const up=selectRuleInstant({epochMilliseconds,rounding:'ceil-minute',marginMinutes:2});
    const down=selectRuleInstant({epochMilliseconds,rounding:'floor-minute',marginMinutes:-2});
    assert.ok(up.selectedEpochMilliseconds-120000>=epochMilliseconds);
    assert.ok(down.selectedEpochMilliseconds+120000<=epochMilliseconds);
    if(epochMilliseconds%60000===0)assert.equal(up.selectedEpochMilliseconds,epochMilliseconds+120000);
  }
  assert.throws(()=>selectRuleInstant({epochMilliseconds:NaN,rounding:'none',marginMinutes:0}),RangeError);
  assert.throws(()=>selectRuleInstant({epochMilliseconds:0,rounding:'nearest',marginMinutes:0}),RangeError);
  assert.throws(()=>selectRuleInstant({epochMilliseconds:0,rounding:'none',marginMinutes:undefined}),TypeError);
  let touched=false;
  const x={rounding:'none',marginMinutes:0};Object.defineProperty(x,'epochMilliseconds',{enumerable:true,get(){touched=true;return 0;}});
  assert.throws(()=>selectRuleInstant(x),TypeError);assert.equal(touched,false);
});

test('CLI lists exact known profiles and labels geometry markers without automatic method inference',()=>{
  const listed=spawnSync(process.execPath,[file('scripts/calculate-local.mjs'),'--profiles'],{encoding:'utf8'});
  assert.equal(listed.status,0,listed.stderr);
  for(const profile of LOCAL_PROFILES)assert.ok(listed.stdout.includes(profile));
  const shown=spawnSync(process.execPath,[file('scripts/calculate-local.mjs'),base.date,String(base.latitude),String(base.longitude),base.timeZone,EGYPT],{encoding:'utf8'});
  assert.equal(shown.status,0,shown.stderr);
  assert.ok(shown.stdout.includes('solar-noon-marker'));
  assert.ok(shown.stdout.includes('complete set of five prayer-start models is not available'));
});

test('representative legacy and composed profiles run with no access to network, source calendars or legacy implementations',()=>{
  const inputCases=[{...base,profile:EGYPT},{...base,profile:USA},{...base,profile:CANADA},
    {...base,latitude:-6.2,longitude:106.8,timeZone:'Asia/Jakarta',profile:KEMENAG},
    {...base,profile:'local-18-17-shadow2-physical-v1'},
    {...base,date:'2027-06-21',latitude:59.9139,longitude:10.7522,timeZone:'Europe/Oslo',profile:'local-18-17-shadow1-angle-night-v1'}];
  const allowed=['package.json','core/local/index.mjs','core/local/solar.mjs','core/local/northern.mjs','core/local/summer.mjs','core/local/profiles.mjs','core/local/selection.mjs','core/local/night-fraction.mjs','core/input.mjs','core/astronomy/','core/timezones/'];
  const program=`
    import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
    import {calculateLocalDay} from ${JSON.stringify(new URL('core/local/index.mjs',root).href)};
    assert.equal(process.permission.has('net'),false);
    for(const p of ${JSON.stringify(['core/local/verification/profiles-fixtures.json','methods/kemenag/implementation/calculate.mjs'].map(file))})
      assert.throws(()=>readFileSync(p),{code:'ERR_ACCESS_DENIED'});
    console.log(JSON.stringify(${JSON.stringify(inputCases)}.map(calculateLocalDay)));
  `;
  const child=spawnSync(process.execPath,['--permission',...allowed.map(p=>`--allow-fs-read=${file(p)}`),'--input-type=module','--eval',program],{
    cwd:file('.'),env:{...process.env,TZ:'Pacific/Honolulu'},encoding:'utf8',timeout:15000});
  assert.ifError(child.error);assert.equal(child.status,0,child.stderr);
  assert.deepEqual(JSON.parse(child.stdout),inputCases.map(calculateLocalDay));
});
