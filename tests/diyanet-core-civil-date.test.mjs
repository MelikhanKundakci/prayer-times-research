import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createDiyanetCalculator,EVENTS} from '../core/diyanet/index.mjs';
import {calculateAnnualRaw} from '../core/diyanet/calendar.mjs';
import {solarCoordinatesUSNO} from '../core/astronomy/solar-usno-v2.mjs';
import {calculateMissingWindowCalendar,calculateNorthernCivilRowRaw} from '../methods/diyanet/index.mjs';
import {calculateLowLatitudeYear,calculateSouthYear} from '../methods/diyanet/implementation/civil-ephemeris/candidate.mjs';

const root=new URL('../',import.meta.url),file=p=>fileURLToPath(new URL(p,root));
const civil=()=>createDiyanetCalculator({dateBasis:'civil-date'});
const adjustments={fajr:0,sunrise:-7,dhuhr:5,asr:4,maghrib:7,isha:0};
const seam={year:2027,latitude:60,longitude:-180,timeZone:'Asia/Anadyr'};
const tonga={latitude:-21.1345386521,longitude:-175.223892147,timeZone:'Pacific/Tongatapu'};

test('Civil-date core reproduces the existing regional recipes for complete years',()=>{
  const cases=[
    [calculateNorthernCivilRowRaw,seam,false],
    [calculateNorthernCivilRowRaw,{...seam,year:2028,latitude:70},false],
    [calculateLowLatitudeYear,{year:2027,latitude:1.87,longitude:-157.43,timeZone:'Pacific/Kiritimati'},true],
    [calculateSouthYear,{year:2027,...tonga},true],
    [calculateSouthYear,{year:2027,latitude:-60,longitude:0,timeZone:'UTC'},true],
  ];
  for(const [legacy,input,preAdjustment] of cases){
    const before=legacy(input),after=civil().calculateYear(input);
    assert.equal(after.days.length,before.days.length);
    for(let i=0;i<before.days.length;i++){
      const a=before.days[i],b=after.days[i];
      assert.equal(b.solarTimeCarrierDate,a.solarCalculationDate);
      assert.equal(b.ephemerisDate,b.date);
      for(const name of EVENTS){const e=a.events[name],v=b.events[name];
        const expected=e.rawEpoch===null?null:e.rawEpoch+(preAdjustment?adjustments[name]*60000:0);
        assert.equal(v.rawEpochMilliseconds,expected,`${input.latitude}/${b.date}/${name}`);
        assert.equal(v.calendarUtc,e.utc);
      }
    }
  }
});

test('Explicit solar-carrier preserves historical carrier-solstice semantics away from C=D',()=>{
  const old=calculateMissingWindowCalendar(seam),fresh=createDiyanetCalculator({dateBasis:'solar-carrier'}).calculateYear(seam);
  assert.equal(fresh.calculation.dateBasis,'solar-carrier');
  for(let i=0;i<old.days.length;i++)for(const name of EVENTS)
    assert.equal(fresh.days[i].events[name].rawEpochMilliseconds,old.days[i].events[name].rawEpoch,`${fresh.days[i].date}/${name}`);
  assert.equal(fresh.calculation.seasonal.solsticeCarrierDate,'2027-06-21');
  assert.equal(fresh.calculation.seasonal.solsticeCivilDate,'2027-06-22');
  const improved=civil().calculateYear(seam);
  assert.equal(improved.calculation.seasonal.solsticeCivilDate,'2027-06-21');
  assert.equal(improved.calculation.seasonal.solsticeCarrierDate,'2027-06-20');
  assert.equal(improved.calculation.seasonal.solsticeEphemerisDate,'2027-06-21');
});

test('Default calculation keeps both sides of the antimeridian consistent in all three routes',()=>{
  const c=createDiyanetCalculator();
  for(const latitude of [-45,0,60])for(const year of [2027,2028])for(const magnitude of [180,179.999999]){
    const west=c.calculateYear({year,latitude,longitude:-magnitude,timeZone:'Asia/Anadyr'});
    const east=c.calculateYear({year,latitude,longitude:magnitude,timeZone:'Asia/Anadyr'});
    assert.equal(west.days.length,year===2028?366:365);
    for(let i=0;i<west.days.length;i++)for(const name of EVENTS){
      const a=west.days[i].events[name],b=east.days[i].events[name];
      if(a.rawEpochMilliseconds===null||b.rawEpochMilliseconds===null)assert.equal(a.rawEpochMilliseconds,b.rawEpochMilliseconds);
      else assert.ok(Math.abs(a.rawEpochMilliseconds-b.rawEpochMilliseconds)<=(magnitude===180?.001:.482),`${latitude}/${year}/${name}`);
      assert.equal(a.calendarUtc,b.calendarUtc);
      assert.equal(a.calendarDate,b.calendarDate);
    }
  }
});

test('The date-basis choice changes no instants on complete C=D calendars',()=>{
  for(const location of [
    {latitude:52.52,longitude:13.405,timeZone:'Europe/Berlin'},
    {latitude:41.012,longitude:28.974,timeZone:'Europe/Istanbul'},
    {latitude:-33.92888,longitude:18.41722,timeZone:'Africa/Johannesburg'},
  ]){
    const a=createDiyanetCalculator({dateBasis:'solar-carrier'}).calculateYear({year:2027,...location}),b=createDiyanetCalculator().calculateYear({year:2027,...location});
    for(let i=0;i<a.days.length;i++){
      assert.equal(a.days[i].solarCalculationDate,a.days[i].date);
      for(const name of EVENTS)assert.deepEqual(b.days[i].events[name],a.days[i].events[name]);
    }
  }
});

test('Default calculation preserves civil-date Pacific model snapshots and sampling dates',()=>{
  const fixture=JSON.parse(readFileSync(new URL('diyanet-civil-ephemeris-snapshots.json',import.meta.url)));
  for(const sample of fixture.cases){
    const d=createDiyanetCalculator().calculateDay(sample.input);
    assert.deepEqual(fixture.events.map(name=>d.events[name].calendarUtc),sample.utc);
    assert.equal(d.solarCalculationDate,sample.carrier);assert.equal(d.solarTimeCarrierDate,sample.carrier);
    assert.equal(d.ephemerisDate,sample.input.date);
    assert.equal(d.calculation.official,false);
    assert.equal(d.calculation.solarModel,'USNO-daily-civil-UTC00');
  }
});

test('An injected solar provider is sampled on D even when the absolute carrier is D−1',()=>{
  const seen=[];
  const provider=jd=>{seen.push(jd);return solarCoordinatesUSNO(jd);};
  const result=calculateAnnualRaw({year:2027,...tonga},provider,{dateBasis:'civil-date'});
  const start=Date.parse('2027-01-01T00:00:00Z')/86400000+2440587.5;
  assert.equal(new Set(seen).size,365);
  assert.ok(seen.every(jd=>jd>=start&&jd<start+365));
  assert.equal(result.days[0].ephemerisDate,'2027-01-01');
  assert.equal(result.days[0].solarTimeCarrierDate,'2026-12-31');
});

test('The opposite carrier direction retains D geometry without adding a day to the event',()=>{
  const d=civil().calculateDay({date:'2027-03-20',latitude:20,longitude:175,timeZone:'Etc/GMT+12'});
  assert.equal(d.ephemerisDate,'2027-03-20');assert.equal(d.solarTimeCarrierDate,'2027-03-21');
  const s=solarCoordinatesUSNO(Date.parse(d.ephemerisDate+'T00:00:00Z')/86400000+2440587.5);
  const expected=Date.parse(d.solarTimeCarrierDate+'T00:00:00Z')+(12-175/15-s.equationOfTimeHours)*3600000+300000;
  assert.equal(d.events.dhuhr.rawEpochMilliseconds,expected);assert.equal(d.events.dhuhr.calendarDate,d.date);
});

test('Civil-date resolves the synthetic UTC noon seam while still rejecting skipped civil dates',()=>{
  const result=createDiyanetCalculator().calculateYear({...seam,longitude:180,timeZone:'UTC'});
  assert.equal(result.days.length,365);
  assert.ok(result.days.every(d=>d.events.dhuhr.calendarDate===d.date));
  assert.throws(()=>civil().calculateDay({date:'2011-12-29',latitude:-13.83,longitude:-171.77,timeZone:'Pacific/Apia'}),/civil date 2011-12-30/);
});

test('Date-basis option is strict, immutable per calculator and preserved by next-prayer queries',()=>{
  for(const dateBasis of ['auto','Civil-Date',null,0])assert.throws(()=>createDiyanetCalculator({dateBasis}),RangeError);
  let touched=false;const getter={get dateBasis(){touched=true;return 'civil-date';}};
  assert.throws(()=>createDiyanetCalculator(getter),TypeError);assert.equal(touched,false);
  const options={dateBasis:'civil-date',cacheSize:1},c=createDiyanetCalculator(options);options.dateBasis='solar-carrier';
  const d=c.calculateDay({date:'2027-01-01',...tonga});
  const n=c.nextPrayer({after:Date.parse(d.events.isha.utc),...tonga});
  assert.equal(n.name,'fajr');assert.equal(n.prayerDate,'2027-01-02');
  assert.equal(n.calculation.dateBasis,'civil-date');assert.equal(c.cacheInfo().capacity,1);
});

test('Unified civil-date runs with legacy modules and reference tables inaccessible',()=>{
  const input={date:'2027-01-01',...tonga},expected=civil().calculateDay(input);
  const program=`
    import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
    import {createDiyanetCalculator} from ${JSON.stringify(new URL('core/diyanet/index.mjs',root).href)};
    assert.equal(process.permission.has('net'),false);
    assert.throws(()=>readFileSync(${JSON.stringify(file('methods/diyanet/index.mjs'))}),{code:'ERR_ACCESS_DENIED'});
    assert.throws(()=>readFileSync(${JSON.stringify(file('tests/diyanet-civil-ephemeris-snapshots.json'))}),{code:'ERR_ACCESS_DENIED'});
    console.log(JSON.stringify(createDiyanetCalculator({dateBasis:'civil-date'}).calculateDay(${JSON.stringify(input)})));
  `;
  const child=spawnSync(process.execPath,['--permission',...['package.json','core/diyanet/','core/astronomy/solar-usno-v2.mjs','core/timezones/'].map(p=>`--allow-fs-read=${file(p)}`),'--input-type=module','--eval',program],{cwd:file('.'),env:{...process.env,TZ:'Pacific/Honolulu'},encoding:'utf8',timeout:10000});
  assert.ifError(child.error);assert.equal(child.status,0,child.stderr);assert.deepEqual(JSON.parse(child.stdout),expected);
});

test('Command line defaults to civil-date and keeps explicit legacy replay',()=>{
  const args=[file('scripts/calculate-diyanet.mjs'),'2027-01-01',String(tonga.latitude),String(tonga.longitude),tonga.timeZone];
  for(const [flags,basis] of [[[],'civil-date'],[['--civil-date'],'civil-date'],[['--solar-carrier'],'solar-carrier']]){
    const good=spawnSync(process.execPath,[...args,'--json',...flags],{encoding:'utf8',timeout:10000});
    assert.equal(good.status,0,good.stderr);
    const actual=JSON.parse(good.stdout);
    const expected=createDiyanetCalculator({dateBasis:basis}).calculateDay({date:'2027-01-01',...tonga});
    assert.deepEqual(actual,expected);
  }
  for(const flags of [['--civil-date','--civil-date'],['--solar-carrier','--solar-carrier'],['--civil-date','--solar-carrier']]){
    const bad=spawnSync(process.execPath,[...args,...flags],{encoding:'utf8',timeout:10000});
    assert.equal(bad.status,1);assert.equal(bad.stdout,'');
  }
});

test('No-option API uses the improved recipe for day, year and next-prayer queries',()=>{
  const expected=civil(),input={date:'2027-01-01',...tonga};
  for(const options of [undefined,{}, {cacheSize:0}, {dateBasis:undefined}]){
    const actual=createDiyanetCalculator(options),day=actual.calculateDay(input);
    assert.deepEqual(day,expected.calculateDay(input));
    assert.equal(day.calculation.dateBasis,'civil-date');
    assert.equal(day.calculation.official,false);
    assert.equal(day.calculation.institutionalEquivalence,'not-established');
    const after=Date.parse(day.events.isha.utc);
    assert.deepEqual(actual.nextPrayer({after,...tonga}),expected.nextPrayer({after,...tonga}));
  }
  assert.deepEqual(createDiyanetCalculator().calculateYear({year:2027,...tonga}),expected.calculateYear({year:2027,...tonga}));
});
