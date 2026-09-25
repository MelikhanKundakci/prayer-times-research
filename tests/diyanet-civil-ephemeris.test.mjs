import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {calculateLowLatitudeDay as lowDay, calculateLowLatitudeYear as lowYear,
  calculateSouthDay as southDay, calculateSouthYear as southYear} from '../methods/diyanet/implementation/civil-ephemeris/candidate.mjs';
import {calculateYear as baselineLowYear} from '../methods/diyanet/implementation/low-latitude/model.mjs';
import {calculateYear as baselineSouthYear} from '../methods/diyanet/implementation/south/candidate.mjs';
import {solarCoordinatesUSNO} from '../core/astronomy/solar-usno-v2.mjs';
const root=new URL('../',import.meta.url),file=p=>fileURLToPath(new URL(p,root));
const fixture=JSON.parse(readFileSync(new URL('./diyanet-civil-ephemeris-snapshots.json',import.meta.url)));
const dayInput={date:'2027-01-01',latitude:-21.1345386521,longitude:-175.223892147,timeZone:'Pacific/Tongatapu'};

test('Opt-ins preserve full-year original events when UTC carrier equals row date',()=>{
  for(const[calculate,baseline,location]of[
    [lowYear,baselineLowYear,{latitude:35.68,longitude:139.69,timeZone:'Asia/Tokyo'}],
    [southYear,baselineSouthYear,{latitude:-33.8688,longitude:151.2093,timeZone:'Australia/Sydney'}],
  ]){
    const input={year:2027,...location},a=baseline(input),b=calculate(input);
    assert.equal(a.days.length,365);assert.equal(b.days.length,365);
    for(let i=0;i<a.days.length;i++){
      assert.equal(a.days[i].solarCalculationDate,a.days[i].date);
      assert.equal(b.days[i].solarCalculationDate,a.days[i].solarCalculationDate);
      assert.equal(b.days[i].solarTransitUtc,a.days[i].solarTransitUtc);
      assert.deepEqual(b.days[i].events,a.days[i].events);
    }
    assert.deepEqual(baseline(input),a,'Opt-in does not mutate subsequent default output');
  }
});

test('Apia and Tonga examples retain frozen candidate UTC times and original carriers',()=>{
  for(const c of fixture.cases){
    const day=southDay(c.input);
    assert.deepEqual(fixture.events.map(e=>day.events[e].utc),c.utc,c.id);
    assert.equal(day.solarCalculationDate,c.carrier);assert.equal(day.solarTimeCarrierDate,c.carrier);
    assert.equal(day.ephemerisDate,c.input.date);assert.notEqual(day.ephemerisDate,c.carrier);
    assert.equal(day.parameters.equationOfTimeEpoch,'requested civil row UTC00');
    assert.equal(day.variant,'south-civil-row');assert.equal(day.researchOnly,true);
    assert.equal(day.official,false);assert.equal(day.productionReady,false);assert.equal(day.notificationEligible,false);
    for(const e of Object.values(day.events))assert.equal(e.notificationEligible,false);
    assert(day.qualityFlags.includes('civil-row-ephemeris-unconfirmed'));
  }
});

test('Row UTC00 sampling preserves earlier and later absolute time carriers',()=>{
  // Synthetic longitude/zone pairs check mechanism, not institutional accuracy.
  for(const[calculate,input,offset]of[
    [lowDay,{date:'2027-03-20',latitude:1.87,longitude:-157.43,timeZone:'Pacific/Kiritimati'},-1],
    [southDay,dayInput,-1],
    [lowDay,{date:'2027-03-20',latitude:20,longitude:175,timeZone:'Etc/GMT+12'},1],
    [southDay,{date:'2027-03-20',latitude:-20,longitude:175,timeZone:'Etc/GMT+12'},1],
  ]){
    const result=calculate(input),row=Date.parse(input.date+'T00:00:00Z');
    const carrier=Date.parse(result.solarTimeCarrierDate+'T00:00:00Z');assert.equal((carrier-row)/86400000,offset);
    const solar=solarCoordinatesUSNO(row/86400000+2440587.5);
    const transit=carrier+(12-input.longitude/15-solar.equationOfTimeHours)*3600000;
    assert.equal(result.events.dhuhr.rawEpoch,transit);
    assert.equal(Date.parse(result.events.dhuhr.utc),Math.round(transit/60000+5)*60000);
    assert.equal(result.events.dhuhr.date,input.date);
  }
});

test('Strict contracts, domain limits, leap years and unavailable signs are retained',()=>{
  assert.throws(()=>southDay({...dayInput,variant:'usno-continuous'}),TypeError);
  assert.throws(()=>southDay({...dayInput,sourceTimes:[]}),TypeError);
  assert.throws(()=>southDay(dayInput,{}),TypeError);
  assert.throws(()=>lowDay({...dayInput,latitude:44.5}),RangeError);
  assert.throws(()=>lowDay({...dayInput,latitude:-1}),RangeError);
  assert.throws(()=>southDay({...dayInput,latitude:-60.01}),RangeError);
  assert.throws(()=>southDay({...dayInput,latitude:0}),RangeError);
  assert.throws(()=>southDay({...dayInput,latitude:NaN}),RangeError);
  assert.throws(()=>southDay({...dayInput,date:'2027-02-29'}),RangeError);
  assert.throws(()=>southDay({...dayInput,timeZone:'Not/AZone'}),RangeError);
  assert.throws(()=>southDay({...dayInput,date:'2011-12-30',timeZone:'Pacific/Apia'}),RangeError);
  let read=false;const accessor={...dayInput};Object.defineProperty(accessor,'latitude',{enumerable:true,get(){read=true;return-21;}});
  assert.throws(()=>southDay(accessor),TypeError);assert.equal(read,false);
  const hidden={...dayInput};Object.defineProperty(hidden,'extra',{value:1});assert.throws(()=>southDay(hidden),TypeError);
  assert.throws(()=>southYear({year:2100,latitude:-20,longitude:10,timeZone:'UTC'}),RangeError);
  const leap=lowYear({year:2000,latitude:20,longitude:10,timeZone:'UTC'});assert.equal(leap.days.length,366);assert.equal(leap.days[59].date,'2000-02-29');
  const absent=southDay({date:'2027-12-21',latitude:-60,longitude:0,timeZone:'UTC'});
  assert.equal(absent.events.fajr.utc,null);assert.equal(absent.events.isha.utc,null);
  assert.equal(absent.events.fajr.status,'unavailable');assert.equal(absent.events.fajr.notificationEligible,false);
});

test('Both opt-ins compute with network and calendar reads denied under two host zones',()=>{
  const inputs=[{date:'2027-03-20',latitude:1.87,longitude:-157.43,timeZone:'Pacific/Kiritimati'},dayInput];
  const expected=inputs.map((input,i)=>(i?southDay:lowDay)(input));
  const denied=['tests/diyanet-civil-ephemeris-snapshots.json','methods/diyanet/research/civil-ephemeris-date-2026-09-25.json','node_modules/adhan/package.json'];
  const permitted=['package.json','methods/diyanet/implementation/civil-ephemeris/','core/astronomy/','core/timezones/'];
  const program=`
    import assert from'node:assert/strict';import{readFileSync}from'node:fs';import{get}from'node:https';
    import{calculateLowLatitudeDay,calculateSouthDay}from${JSON.stringify(new URL('methods/diyanet/implementation/civil-ephemeris/candidate.mjs',root).href)};
    assert.equal(process.versions.tz,'2026d');assert.equal(process.permission.has('net'),false);
    await assert.rejects(new Promise((resolve,reject)=>get('https://example.invalid/',resolve).on('error',reject)),{code:'ERR_ACCESS_DENIED'});
    for(const p of${JSON.stringify(denied.map(file))}){assert.equal(process.permission.has('fs.read',p),false);assert.throws(()=>readFileSync(p),{code:'ERR_ACCESS_DENIED'});}
    process.stdout.write(JSON.stringify(${JSON.stringify(inputs)}.map((input,i)=>(i?calculateSouthDay:calculateLowLatitudeDay)(input))));
  `;
  for(const zone of['UTC','Pacific/Honolulu']){
    const p=spawnSync(process.execPath,['--permission',...permitted.map(p=>'--allow-fs-read='+file(p)),'--input-type=module','--eval',program],{cwd:file('.'),env:{...process.env,TZ:zone},encoding:'utf8',timeout:30000});
    assert.ifError(p.error);assert.equal(p.status,0,p.stderr);assert.deepEqual(JSON.parse(p.stdout),expected);
  }
});
