import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {calculateLocalDay,LOCAL_PROFILE,LOCAL_EVENTS} from '../core/local/index.mjs';

const root=new URL('../',import.meta.url),file=p=>fileURLToPath(new URL(p,root));
const base={date:'2027-03-20',latitude:41.0082,longitude:28.9784,timeZone:'Europe/Istanbul',profile:LOCAL_PROFILE};
const day=changes=>calculateLocalDay({...base,...changes});
const margins={fajr:0,sunrise:-7,dhuhr:5,asr:4,maghrib:7,isha:0};
const absentTimeFields=['rawEpochMilliseconds','epochMilliseconds','roundedEpochMilliseconds','utc','calendarUtc','localDate','calendarDate','time','seconds','secondsDate','dateOffset'];

test('Point profile applies published margins to distinct physical events without calendar inputs',()=>{
  const d=day({});
  assert.equal(d.profile.id,'diyanet-published-point-v1');
  assert.equal(d.profile.official,false);
  assert.equal(d.profile.institutionalEquivalence,'not-claimed');
  assert.equal(d.coverage.complete,true);
  assert.equal(d.astronomy.model.temkinApplied,false);
  for(const name of LOCAL_EVENTS){
    const selected=d.events[name],solar=d.astronomy.events[name];
    assert.equal(selected.status,'calculated');
    assert.equal(selected.adjustmentMinutes,margins[name]);
    assert.equal(selected.rawEpochMilliseconds-solar.epochMilliseconds,margins[name]*60000,name);
    assert.equal(Date.parse(selected.utc),selected.epochMilliseconds);
    assert.equal(Date.parse(selected.calendarUtc),selected.roundedEpochMilliseconds);
    assert.ok(Math.abs(selected.epochMilliseconds-selected.rawEpochMilliseconds)<=.5);
    assert.ok(Math.abs(selected.roundedEpochMilliseconds-selected.rawEpochMilliseconds)<=30000);
    assert.equal(selected.roundedEpochMilliseconds%60000,0);
    assert.match(selected.rule,new RegExp(`^${LOCAL_PROFILE}\\.${name}\\.`));
  }
  assert.equal(d.astronomy.events.fajr.thresholdDegrees,-18);
  assert.equal(d.astronomy.events.isha.thresholdDegrees,-17);
  assert.equal(d.events.sunrise.rule,`${LOCAL_PROFILE}.sunrise.altitude-50arcmin.temkin-minus7`);
});

test('Northern policy cannot be bypassed merely because a twilight crossing exists',()=>{
  const d=day({date:'2027-05-01',latitude:50.1109,longitude:8.6821,timeZone:'Europe/Berlin'});
  for(const name of ['fajr','isha']){
    assert.equal(d.astronomy.events[name].status,'calculated');
    assert.equal(d.events[name].status,'policy-blocked');
    assert.equal(d.events[name].reason,'northern-seasonal-policy-not-implemented');
    for(const field of absentTimeFields)assert.equal(d.events[name][field],null,`${name}/${field}`);
  }
  assert.equal(d.astronomy.events.isha.thresholdDegrees,-16);
  assert.equal(d.coverage.complete,false);
  assert.deepEqual(d.coverage.policyBlockedEvents,['fajr','isha']);
  assert.equal(day({latitude:44.4999}).events.fajr.status,'calculated');
  assert.equal(day({date:'2027-06-21',latitude:44.5}).events.fajr.status,'policy-blocked');
  assert.equal(day({latitude:-44.5}).events.fajr.status,'calculated');
});

test('Northern five-hour horizon policy blocks both missing and too-short days',()=>{
  for(const latitude of [65,80]){
    const d=day({date:'2027-12-21',latitude,longitude:0,timeZone:'UTC'});
    for(const name of ['sunrise','maghrib']){
      assert.equal(d.astronomy.events[name].status,latitude===65?'calculated':'unavailable');
      assert.equal(d.events[name].status,'policy-blocked');
      assert.equal(d.events[name].reason,'northern-horizon-policy-not-implemented');
      assert.equal(d.events[name].utc,null);
    }
  }
});

test('Documented northern absent-shadow Asr uses selected Dhuhr without adding a second margin',()=>{
  const d=day({date:'2027-12-21',latitude:80,longitude:0,timeZone:'UTC'});
  assert.equal(d.astronomy.events.asr.status,'unavailable');
  assert.equal(d.events.asr.status,'estimated');
  assert.equal(d.events.asr.reason,'sun-not-above-geometric-horizon-at-transit');
  assert.equal(d.events.asr.rule,`${LOCAL_PROFILE}.asr.no-daylight-shadow.use-dhuhr`);
  assert.equal(d.events.asr.rawEpochMilliseconds,d.events.dhuhr.rawEpochMilliseconds);
  assert.equal(d.events.asr.rawEpochMilliseconds-d.astronomy.events.dhuhr.epochMilliseconds,5*60000);
  assert.equal(d.events.asr.adjustmentMinutes,5);
  assert.deepEqual(d.qualityFlags,[]);
  const southern=day({date:'2027-06-21',latitude:-80,longitude:0,timeZone:'UTC'});
  assert.equal(southern.events.asr.status,'unavailable');
  assert.equal(southern.events.asr.utc,null);
});

test('Unavailable southern twilight stays absent and a real margin-induced Asr reversal is blocked',()=>{
  const summer=day({date:'2027-12-21',latitude:-60,longitude:0,timeZone:'UTC'});
  for(const name of ['fajr','isha']){
    assert.equal(summer.events[name].status,'unavailable');
    for(const field of absentTimeFields)assert.equal(summer.events[name][field],null);
  }
  const winter=day({date:'2027-06-21',latitude:-66.5,longitude:0,timeZone:'UTC'});
  assert.equal(winter.astronomy.events.asr.status,'calculated');
  assert.ok(winter.astronomy.events.asr.epochMilliseconds>winter.astronomy.events.dhuhr.epochMilliseconds);
  assert.ok(winter.astronomy.events.asr.epochMilliseconds+4*60000<winter.events.dhuhr.rawEpochMilliseconds);
  assert.equal(winter.events.asr.status,'policy-blocked');
  assert.equal(winter.events.asr.reason,'published-margins-conflict-with-event-order');
  assert.deepEqual(winter.qualityFlags,[{code:'selected-event-order-conflict',earlier:'dhuhr',later:'asr'}]);
});

test('After-midnight Isha retains its actual date and remains before the following Fajr',()=>{
  const location={latitude:43.825,longitude:87.61,timeZone:'Asia/Shanghai'};
  const d=day({date:'2027-06-21',...location}),next=day({date:'2027-06-22',...location});
  assert.equal(d.events.isha.localDate,'2027-06-22');
  assert.equal(d.events.isha.calendarDate,'2027-06-22');
  assert.equal(d.events.isha.secondsDate,'2027-06-22');
  assert.equal(d.events.isha.dateOffset,1);
  assert.ok(d.events.isha.epochMilliseconds<next.events.fajr.epochMilliseconds);
  assert.deepEqual(d.qualityFlags,[{code:'event-on-different-civil-date',event:'isha',date:'2027-06-22'}]);
});

test('Selected clocks retain UTC ownership across DST, fractional zones and year boundaries',()=>{
  const cases=[
    ['2027-03-13',40.7,-74,'America/New_York',-5*60],
    ['2027-03-14',40.7,-74,'America/New_York',-4*60],
    ['2027-11-06',40.7,-74,'America/New_York',-4*60],
    ['2027-11-07',40.7,-74,'America/New_York',-5*60],
    ['2027-04-03',-31.55,159.08,'Australia/Lord_Howe',11*60],
    ['2027-04-04',-31.55,159.08,'Australia/Lord_Howe',10.5*60],
    ['2027-03-20',27.7,85.3,'Asia/Kathmandu',5.75*60],
    ['2027-12-31',-43,-150,'Pacific/Honolulu',-10*60],
  ];
  for(const [date,latitude,longitude,timeZone,offsetMinutes] of cases){
    const d=day({date,latitude,longitude,timeZone});
    assert.equal(d.coverage.complete,true);
    for(const name of LOCAL_EVENTS){const e=d.events[name];
      const displayedUtc=Date.parse(`${e.calendarDate}T${e.time}:00Z`)-offsetMinutes*60000;
      assert.equal(displayedUtc,e.roundedEpochMilliseconds,`${date}/${timeZone}/${name}`);
      assert.equal(Date.parse(`${e.secondsDate}T${e.seconds}Z`)-offsetMinutes*60000,Math.round(e.rawEpochMilliseconds/1000)*1000);
    }
    if(timeZone==='Pacific/Honolulu'){
      assert.match(d.events.isha.utc,/^2028-01-01/);
      assert.equal(d.events.isha.localDate,'2027-12-31');
    }
  }
});

test('Bounded ordinary-point seasonal sequences preserve within-day and cross-night order',()=>{
  const points=[[41,29,'Europe/Istanbul'],[40.7,-74,'America/New_York'],[-33.87,151.21,'Australia/Sydney'],
    [1.87,-157.43,'Pacific/Kiritimati'],[-13.83,-171.75,'Pacific/Apia'],[21.4,39.8,'Asia/Riyadh']];
  for(const [latitude,longitude,timeZone] of points)for(const date of ['2027-03-20','2027-06-21','2027-09-23','2027-12-31','2028-02-29']){
    const d=day({date,latitude,longitude,timeZone});
    const nextDate=new Date(Date.parse(date+'T12:00:00Z')+86400000).toISOString().slice(0,10);
    const next=day({date:nextDate,latitude,longitude,timeZone});
    assert.equal(d.coverage.complete,true,`${date}/${timeZone}`);
    for(let i=1;i<LOCAL_EVENTS.length;i++)assert.ok(d.events[LOCAL_EVENTS[i]].rawEpochMilliseconds>d.events[LOCAL_EVENTS[i-1]].rawEpochMilliseconds);
    assert.ok(d.events.isha.rawEpochMilliseconds<next.events.fajr.rawEpochMilliseconds);
  }
});

test('Point profile requires an explicit known rule and rejects accidental or executable inputs',()=>{
  const {profile,...missing}=base;
  assert.throws(()=>calculateLocalDay(missing),TypeError);
  for(const value of [undefined,null,'auto','Diyanet',{},0])assert.throws(()=>day({profile:value}));
  for(const field of ['latitude','longitude','date','timeZone','profile']){
    let touched=false;
    const input={...base};Object.defineProperty(input,field,{enumerable:true,get(){touched=true;return base[field];}});
    assert.throws(()=>calculateLocalDay(input),TypeError);assert.equal(touched,false);
  }
  let coerced=false;
  assert.throws(()=>day({latitude:{valueOf(){coerced=true;return 41;}}}),RangeError);
  assert.equal(coerced,false);
  assert.throws(()=>day({city:'Istanbul'}),TypeError);
  assert.throws(()=>day({timeZone:'+01:00'}),RangeError);
  assert.throws(()=>day({date:'2011-12-30',latitude:-13.8,longitude:-171.75,timeZone:'Pacific/Apia'}),RangeError);
});

test('Point API runs with network, calendars, legacy models and verification fixtures inaccessible',()=>{
  const permitted=['package.json','core/local/index.mjs','core/local/solar.mjs','core/local/northern.mjs','core/local/summer.mjs','core/local/profiles.mjs','core/local/selection.mjs','core/input.mjs','core/astronomy/','core/timezones/'];
  const denied=['core/local/verification/oracle-fixtures.json','core/diyanet/index.mjs','methods/diyanet/index.mjs','tests/model-snapshots.json','node_modules/adhan/package.json'];
  const program=`
    import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {get} from 'node:https';
    import {calculateLocalDay} from ${JSON.stringify(new URL('core/local/index.mjs',root).href)};
    assert.equal(process.versions.tz,'2026d');
    assert.equal(process.permission.has('net'),false);
    await assert.rejects(new Promise((resolve,reject)=>get('https://example.invalid/',resolve).on('error',reject)),{code:'ERR_ACCESS_DENIED'});
    for(const path of ${JSON.stringify(denied.map(file))})assert.throws(()=>readFileSync(path),{code:'ERR_ACCESS_DENIED'});
    console.log(JSON.stringify(calculateLocalDay(${JSON.stringify(base)})));
  `;
  for(const hostZone of ['UTC','Pacific/Honolulu']){
    const child=spawnSync(process.execPath,['--permission',...permitted.map(p=>`--allow-fs-read=${file(p)}`),'--input-type=module','--eval',program],{
      cwd:file('.'),env:{...process.env,TZ:hostZone},encoding:'utf8',timeout:10000});
    assert.ifError(child.error);assert.equal(child.status,0,child.stderr);
    assert.deepEqual(JSON.parse(child.stdout),day({}));
  }
});

test('Local CLI preserves the API contract and refuses implicit or unknown profiles',()=>{
  const args=[file('scripts/calculate-local.mjs'),base.date,String(base.latitude),String(base.longitude),base.timeZone,base.profile];
  const good=spawnSync(process.execPath,[...args,'--json'],{encoding:'utf8',timeout:10000});
  assert.ifError(good.error);assert.equal(good.status,0,good.stderr);assert.deepEqual(JSON.parse(good.stdout),day({}));
  for(const badArgs of [args.slice(0,-1),[...args.slice(0,-1),'auto'],[...args,'--unknown']]){
    const bad=spawnSync(process.execPath,badArgs,{encoding:'utf8',timeout:10000});
    assert.equal(bad.status,1);assert.equal(bad.stdout,'');assert.ok(bad.stderr.length>0);
  }
});
