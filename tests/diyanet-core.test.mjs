import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createDiyanetCalculator, EVENTS, PRAYERS} from '../core/diyanet/index.mjs';

const root=new URL('../',import.meta.url),file=p=>fileURLToPath(new URL(p,root));
const fixtures=JSON.parse(readFileSync(new URL('diyanet-core-model-fixtures.json',import.meta.url)));
const berlin={latitude:52.52,longitude:13.405,timeZone:'Europe/Berlin'};
const reykjavik={latitude:64.1289,longitude:-21.9082,timeZone:'Atlantic/Reykjavik'};

test('Unified core preserves frozen model instants, minutes and dates across all routes',()=>{
  const calculator=createDiyanetCalculator();
  assert.equal(fixtures.rows.length,36);
  for(const row of fixtures.rows){
    const result=calculator.calculateDay({date:row.date,...row.location});
    assert.equal(result.solarCalculationDate,row.carrier,row.id);
    for(const name of EVENTS){const event=result.events[name],label=`${row.id}/${name}`;
      assert.equal(event.rawEpochMilliseconds,row.rawEpochMilliseconds[name],label);
      assert.equal(event.roundedEpochMilliseconds,row.roundedEpochMilliseconds[name],label);
      assert.equal(event.calendarDate,row.localDates[name],label);
    }
  }
});

test('Civil-time rendering uses each event instant across DST and fractional-hour offsets',()=>{
  const calculator=createDiyanetCalculator();
  for(const [date,offset] of [['2026-03-28',60],['2026-03-29',120],['2026-10-25',60]]){
    const result=calculator.calculateDay({date,...berlin});
    const utc=calculator.calculateDay({date,...berlin,timeZone:'UTC'});
    for(const name of EVENTS){const e=result.events[name];
      assert.equal(e.rawEpochMilliseconds,utc.events[name].rawEpochMilliseconds);
      assert.equal(Date.parse(`${e.calendarDate}T${e.time}:00Z`)-e.roundedEpochMilliseconds,offset*60000);
    }
  }
  const nepal=calculator.calculateDay({date:'2027-06-21',latitude:27.70877,longitude:85.32716,timeZone:'Asia/Kathmandu'});
  const e=nepal.events.dhuhr;
  assert.equal(Date.parse(`${e.calendarDate}T${e.time}:00Z`)-e.roundedEpochMilliseconds,345*60000);
});

test('Second display and calendar minute derive independently from the adjusted model instant',()=>{
  const d=createDiyanetCalculator().calculateDay({date:'2026-09-26',latitude:50.1109,longitude:8.6821,timeZone:'Europe/Berlin'});
  assert.equal(d.events.fajr.seconds,'05:27:49');
  assert.equal(d.events.fajr.time,'05:28');
  for(const e of Object.values(d.events)){
    assert.ok(Math.abs(e.rawEpochMilliseconds-e.roundedEpochMilliseconds)<=30000);
    assert.equal(Date.parse(e.calendarUtc),e.roundedEpochMilliseconds);
    assert.equal(Date.parse(e.utc),e.epochMilliseconds);
    assert.ok(Math.abs(Date.parse(e.utc)-e.rawEpochMilliseconds)<1);
  }
  assert.equal(d.calculation.official,false);
  assert.equal(d.calculation.institutionalEquivalence,'not-established');
});

test('Next prayer retains prior prayer-day ownership after midnight',()=>{
  const c=createDiyanetCalculator(),day=c.calculateDay({date:'2026-06-15',...reykjavik});
  const isha=day.events.isha;
  assert.equal(isha.localDate,'2026-06-16');
  const next=c.nextPrayer({after:isha.epochMilliseconds-1,...reykjavik});
  assert.equal(next.name,'isha');assert.equal(next.prayerDate,'2026-06-15');
  assert.equal(next.rawEpochMilliseconds,isha.rawEpochMilliseconds);
  assert.deepEqual(next.location,reykjavik);
  assert.ok(next.qualityFlags.some(f=>f.code==='event-on-different-civil-date'&&f.event==='isha'));
  assert.ok(c.nextPrayer({after:isha.epochMilliseconds,...reykjavik}).epochMilliseconds>isha.epochMilliseconds);
});

test('Next prayer crosses the year boundary and never selects sunrise',()=>{
  const c=createDiyanetCalculator(),last=c.calculateDay({date:'2026-12-31',...berlin});
  const next=c.nextPrayer({after:last.events.isha.epochMilliseconds,...berlin});
  assert.equal(next.name,'fajr');assert.equal(next.prayerDate,'2027-01-01');
  assert.equal(next.rawEpochMilliseconds,c.calculateDay({date:'2027-01-01',...berlin}).events.fajr.rawEpochMilliseconds);
  const afterFajr=c.nextPrayer({after:last.events.fajr.epochMilliseconds,...berlin});
  assert.equal(afterFajr.name,'dhuhr');assert.ok(PRAYERS.includes(afterFajr.name));
});

test('Absent southern twilight has a complete null result instead of a fabricated time',()=>{
  const c=createDiyanetCalculator(),d=c.calculateDay({date:'2027-12-21',latitude:-60,longitude:0,timeZone:'UTC'});
  for(const name of ['fajr','isha']){const e=d.events[name];
    assert.equal(e.status,'unavailable');assert.equal(e.estimated,false);
    for(const key of ['rawEpochMilliseconds','epochMilliseconds','roundedEpochMilliseconds','utc','calendarUtc','localDate','calendarDate','time','seconds','secondsDate','dateOffset'])assert.equal(e[key],null,key);
  }
  assert.ok(c.nextPrayer({after:Date.parse('2027-12-21T00:00:00Z'),latitude:-60,longitude:0,timeZone:'UTC'}));
});

test('Known polar ordering exceptions remain visible in the unified API',()=>{
  const c=createDiyanetCalculator();
  const d=c.calculateDay({date:'2026-01-05',latitude:67.28324,longitude:14.38305,timeZone:'Europe/Oslo'});
  assert.ok(d.events.asr.rawEpochMilliseconds<d.events.dhuhr.rawEpochMilliseconds);
  assert.ok(d.qualityFlags.some(f=>f.code==='event-order-reversal'&&f.earlier==='dhuhr'&&f.later==='asr'));
  const r=c.calculateDay({date:'2027-12-22',latitude:66.49897,longitude:25.68867,timeZone:'Europe/Helsinki'});
  assert.equal(r.events.asr.time,r.events.dhuhr.time);
  assert.ok(r.qualityFlags.some(f=>f.code==='event-order-reversal'&&f.later==='asr'));
});

test('The polar Dhuhr substitute is explicit and is not marked as reversed',()=>{
  const d=createDiyanetCalculator().calculateDay({date:'2026-01-01',latitude:67.28324,longitude:14.38305,timeZone:'Europe/Oslo'});
  assert.equal(d.events.asr.status,'estimated');
  assert.equal(d.events.asr.rule,'missing-shadow-use-dhuhr');
  assert.equal(d.events.asr.rawEpochMilliseconds,d.events.dhuhr.rawEpochMilliseconds);
  assert.ok(!d.qualityFlags.some(f=>f.code==='event-order-reversal'&&f.later==='asr'));
});

test('Annual calculations include leap days and reuse the bounded cache defensively',()=>{
  const c=createDiyanetCalculator({cacheSize:1});
  const year=c.calculateYear({year:2028,...berlin});
  assert.equal(year.days.length,366);
  assert.ok(year.days.some(d=>d.date==='2028-02-29'));
  const expected=year.days[0].events.fajr.rawEpochMilliseconds;
  year.days[0].events.fajr.rawEpochMilliseconds=0;
  year.days[0].calculation.seasonal.ratio=999;
  assert.equal(c.calculateDay({date:'2028-01-01',...berlin}).events.fajr.rawEpochMilliseconds,expected);
  assert.notEqual(c.calculateDay({date:'2028-01-01',...berlin}).calculation.seasonal.ratio,999);
  assert.deepEqual(c.cacheInfo(),{size:1,capacity:1,annualCalculations:1});
  c.calculateDay({date:'2027-01-01',...berlin});
  assert.deepEqual(c.cacheInfo(),{size:1,capacity:1,annualCalculations:2});
  c.clearCache();assert.equal(c.cacheInfo().size,0);
  c.calculateDay({date:'2028-01-01',...berlin});assert.equal(c.cacheInfo().annualCalculations,3);
  const uncached=createDiyanetCalculator({cacheSize:0});
  uncached.nextPrayer({after:Date.parse('2026-06-21T12:00:00Z'),...berlin});
  assert.deepEqual(uncached.cacheInfo(),{size:0,capacity:0,annualCalculations:1});
});

test('Inputs reject invalid dates, unsupported domains and executable/accessor fields',()=>{
  const c=createDiyanetCalculator(),base={date:'2026-09-26',...berlin};
  for(const patch of [{date:'2026-02-29'},{date:'2000-01-01'},{date:'2099-01-01'},{latitude:NaN},{latitude:76},{latitude:-61},{longitude:Infinity},{longitude:181},{timeZone:'bad'},{timeZone:'Europe/Invalid'},{extra:true}])assert.throws(()=>c.calculateDay({...base,...patch}));
  let read=false;const input={...base};Object.defineProperty(input,'latitude',{enumerable:true,get(){read=true;return 52;}});
  assert.throws(()=>c.calculateDay(input),TypeError);assert.equal(read,false);
  assert.throws(()=>c.calculateDay(Object.create(base)),TypeError);
  for(const options of [{cacheSize:-1},{cacheSize:33},{cacheSize:null},{extra:1}])assert.throws(()=>createDiyanetCalculator(options));
  assert.equal(createDiyanetCalculator({}).cacheInfo().capacity,4);
  assert.throws(()=>c.nextPrayer({after:'2026-01-01',...berlin}),RangeError);
});

test('A civil year containing a skipped local day is explicitly rejected',()=>{
  assert.throws(()=>createDiyanetCalculator().calculateDay({date:'2011-12-29',latitude:-13.83,longitude:-171.77,timeZone:'Pacific/Apia'}),/civil date 2011-12-30/);
});

test('Reusing the returned ISO instant as a cursor never repeats a prayer',()=>{
  const c=createDiyanetCalculator();
  const isha=c.calculateDay({date:'2026-03-29',...berlin}).events.isha;
  const next=c.nextPrayer({after:Date.parse(isha.utc),...berlin});
  assert.equal(next.name,'fajr');assert.equal(next.prayerDate,'2026-03-30');
  assert.ok(next.epochMilliseconds>isha.epochMilliseconds);
});

test('A location/timezone pair with no anchorable noon fails explicitly',()=>{
  assert.throws(()=>createDiyanetCalculator().calculateYear({year:2026,latitude:60,longitude:180,timeZone:'UTC'}),/Could not anchor calculation to civil date/);
});

test('Core runs without network, calendars, legacy implementations or external dependencies',()=>{
  const input={date:'2026-06-21',...berlin};
  const expected=createDiyanetCalculator().calculateDay(input);
  const program=`
    import assert from 'node:assert/strict';
    import {readFileSync} from 'node:fs';
    import {get} from 'node:https';
    import {createDiyanetCalculator} from ${JSON.stringify(new URL('core/diyanet/index.mjs',root).href)};
    assert.equal(process.permission.has('net'),false);
    await assert.rejects(new Promise((resolve,reject)=>get('https://example.invalid/',resolve).on('error',reject)),{code:'ERR_ACCESS_DENIED'});
    for(const path of ${JSON.stringify(['methods/diyanet/index.mjs','tests/diyanet-core-model-fixtures.json','node_modules/adhan/package.json'].map(file))}){
      assert.equal(process.permission.has('fs.read',path),false);
      assert.throws(()=>readFileSync(path),{code:'ERR_ACCESS_DENIED'});
    }
    console.log(JSON.stringify(createDiyanetCalculator().calculateDay(${JSON.stringify(input)})));
  `;
  for(const TZ of ['UTC','Pacific/Honolulu']){
    const child=spawnSync(process.execPath,['--permission',...['package.json','core/diyanet/','core/astronomy/solar-usno-v2.mjs','core/timezones/'].map(p=>`--allow-fs-read=${file(p)}`),'--input-type=module','--eval',program],{cwd:file('.'),env:{...process.env,TZ},encoding:'utf8',timeout:10000});
    assert.ifError(child.error);assert.equal(child.status,0,child.stderr);
    assert.deepEqual(JSON.parse(child.stdout),expected);
  }
});

test('Day command produces machine-readable output and rejects malformed coordinates',()=>{
  const run=args=>spawnSync(process.execPath,[file('scripts/calculate-diyanet.mjs'),...args],{encoding:'utf8',timeout:10000});
  const good=run(['2026-09-26','50.1109','8.6821','Europe/Berlin','--json']);
  assert.equal(good.status,0,good.stderr);assert.equal(JSON.parse(good.stdout).events.fajr.time,'05:28');
  const bad=run(['2026-09-26','not-a-latitude','8.6821','Europe/Berlin']);
  assert.equal(bad.status,1);assert.equal(bad.stdout,'');
});
