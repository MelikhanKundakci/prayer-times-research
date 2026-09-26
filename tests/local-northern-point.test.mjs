import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {calculateLocalDay,LOCAL_PROFILE,LOCAL_EVENTS} from '../core/local/index.mjs';

const input={date:'2027-01-15',latitude:50.1109,longitude:8.6821,timeZone:'Europe/Berlin',profile:LOCAL_PROFILE};
const calculate=changes=>calculateLocalDay({...input,...changes});
const root=new URL('../',import.meta.url),file=p=>fileURLToPath(new URL(p,root));

test('Northern ordinary winter selection returns true -18/-16 crossings under the explicit annual guard',()=>{
  for(const latitude of [44.84,50.1109,52.52,55.95]){
    const d=calculate({latitude});
    assert.equal(d.calculation.northernPolicy.status,'available');
    assert.equal(d.coverage.complete,true);
    for(const [event,angle] of [['fajr',18],['isha',16]]){
      assert.equal(d.events[event].status,'calculated');
      assert.equal(d.events[event].rawEpochMilliseconds,d.astronomy.events[event].epochMilliseconds);
      assert.equal(d.events[event].adjustmentMinutes,0);
      assert.equal(d.astronomy.events[event].thresholdDegrees,-angle);
      assert.equal(d.events[event].rule,`${LOCAL_PROFILE}.${event}.northern-ordinary-${angle}.annual-guard`);
      assert.equal(d.calculation.northernPolicy.day[event].eligible,true);
    }
    assert.equal(d.profile.official,false);
    for(let i=1;i<LOCAL_EVENTS.length;i++)assert.ok(d.events[LOCAL_EVENTS[i]].epochMilliseconds>d.events[LOCAL_EVENTS[i-1]].epochMilliseconds);
  }
});

test('Existing twilight signs near summer remain blocked by the northern ordinary-domain guard',()=>{
  const d=calculate({date:'2027-05-01'});
  assert.equal(d.calculation.northernPolicy.status,'available');
  for(const event of ['fajr','isha']){
    assert.equal(d.astronomy.events[event].status,'calculated');
    assert.equal(d.events[event].status,'policy-blocked');
    assert.equal(d.calculation.northernPolicy.day[event].eligible,false);
    assert.equal(d.events[event].utc,null);
  }
  const june=calculate({date:'2027-06-21'});
  assert.equal(june.astronomy.events.fajr.status,'unavailable');
  assert.equal(june.events.fajr.status,'policy-blocked');
  assert.equal(june.events.isha.status,'policy-blocked');
});

test('Incomplete annual horizon policy cannot silently omit summer rows to release winter twilight',()=>{
  const d=calculate({latitude:59.91,longitude:10.75,timeZone:'Europe/Oslo'});
  assert.equal(d.calculation.northernPolicy.status,'blocked');
  assert.ok(d.calculation.northernPolicy.reason);
  for(const event of ['fajr','isha']){
    assert.equal(d.astronomy.events[event].status,'calculated');
    assert.equal(d.events[event].status,'policy-blocked');
  }
  // Current-day horizon signs remain independently usable even though another
  // season prevents the full-year twilight eligibility proof.
  assert.equal(d.events.sunrise.status,'calculated');
  assert.equal(d.events.maghrib.status,'calculated');
});

test('Five-hour horizons use actual adjacent nights rather than the complement of daylight',()=>{
  const location={latitude:65.0212,longitude:10,timeZone:'Europe/Berlin'};
  const d=calculate({date:'2027-05-15',...location}),next=calculate({date:'2027-05-16',...location});
  const rise=d.astronomy.events.sunrise.epochMilliseconds,set=d.astronomy.events.maghrib.epochMilliseconds;
  const nextRise=next.astronomy.events.sunrise.epochMilliseconds;
  const complement=1440-(set-rise)/60000-14,actualNight=(nextRise-set)/60000-14;
  assert.ok(complement>303&&complement<304);
  assert.ok(actualNight>299&&actualNight<300);
  assert.equal(d.events.sunrise.status,'calculated');
  assert.equal(d.events.maghrib.status,'policy-blocked');
  assert.equal(next.events.sunrise.status,'policy-blocked');
  assert.ok(Math.abs(d.calculation.northernPolicy.day.horizons.nextSelectedNightMinutes-actualNight)<1e-8);
});

test('Ordinary selected northern nights preserve dated UTC order over year, leap and DST boundaries',()=>{
  for(const date of ['2027-12-31','2028-02-28','2028-02-29','2027-03-27','2027-03-28','2027-10-30','2027-10-31']){
    const d=calculate({date});
    const nextDate=new Date(Date.parse(date+'T12:00:00Z')+86400000).toISOString().slice(0,10);
    const next=calculate({date:nextDate});
    assert.equal(d.events.isha.status,'calculated',date);
    assert.equal(next.events.fajr.status,'calculated',nextDate);
    assert.ok(d.events.maghrib.epochMilliseconds<d.events.isha.epochMilliseconds);
    assert.ok(d.events.isha.epochMilliseconds<next.events.fajr.epochMilliseconds);
    assert.ok(next.events.fajr.epochMilliseconds<next.events.sunrise.epochMilliseconds);
    assert.equal(Date.parse(d.events.isha.utc),d.events.isha.epochMilliseconds);
  }
});

test('Returned northern evidence cannot mutate cached decisions',()=>{
  const before=calculate({}),mutated=calculate({});
  mutated.calculation.northernPolicy.status='blocked';
  mutated.calculation.northernPolicy.day.fajr.eligible=false;
  mutated.calculation.northernPolicy.day.horizons.sunriseEligible=false;
  mutated.calculation.northernPolicy.metadata.injected='caller value';
  mutated.events.fajr.rawEpochMilliseconds=0;
  assert.deepEqual(calculate({}),before);
});

test('Annual edge-year restriction does not suppress independently valid daily horizons',()=>{
  for(const year of [2001,2098]){
    const d=calculate({date:`${year}-06-01`});
    assert.equal(d.calculation.northernPolicy.reason,'padded-year-outside-solar-domain');
    assert.equal(d.events.fajr.status,'policy-blocked');
    assert.equal(d.events.isha.status,'policy-blocked');
    assert.equal(d.events.sunrise.status,'calculated');
    assert.equal(d.events.maghrib.status,'calculated');
  }
  const first=calculate({date:'2001-01-01'}),last=calculate({date:'2098-12-31'});
  assert.equal(first.events.sunrise.status,'policy-blocked');
  assert.equal(first.events.maghrib.status,'calculated');
  assert.equal(last.events.sunrise.status,'calculated');
  assert.equal(last.events.maghrib.status,'policy-blocked');
});

test('Northern guard remains local with calendar data, oracle fixtures, legacy modules and network denied',()=>{
  const allowed=['package.json','core/local/index.mjs','core/local/solar.mjs','core/local/northern.mjs','core/input.mjs','core/astronomy/','core/timezones/'];
  const program=`
    import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
    import {calculateLocalDay} from ${JSON.stringify(new URL('core/local/index.mjs',root).href)};
    assert.equal(process.permission.has('net'),false);
    for(const p of ${JSON.stringify(['core/local/verification/northern-fixtures.json','methods/diyanet/index.mjs','core/diyanet/calendar.mjs'].map(file))})
      assert.throws(()=>readFileSync(p),{code:'ERR_ACCESS_DENIED'});
    console.log(JSON.stringify(calculateLocalDay(${JSON.stringify(input)})));
  `;
  const child=spawnSync(process.execPath,['--permission',...allowed.map(p=>`--allow-fs-read=${file(p)}`),'--input-type=module','--eval',program],{
    cwd:file('.'),env:{...process.env,TZ:'Pacific/Honolulu'},encoding:'utf8',timeout:15000});
  assert.ifError(child.error);assert.equal(child.status,0,child.stderr);
  assert.deepEqual(JSON.parse(child.stdout),calculate({}));
});
