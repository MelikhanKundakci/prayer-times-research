import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {calculateLocalDay,LOCAL_PROFILE,LOCAL_SEASONAL_PROFILE,LOCAL_PROFILES,LOCAL_EVENTS} from '../core/local/index.mjs';

const input={date:'2027-06-21',latitude:50.1109,longitude:8.6821,timeZone:'Europe/Berlin',profile:LOCAL_SEASONAL_PROFILE};
const calculate=changes=>calculateLocalDay({...input,...changes});
const root=new URL('../',import.meta.url),file=p=>fileURLToPath(new URL(p,root));
const nextDate=date=>new Date(Date.parse(date+'T12:00:00Z')+86400000).toISOString().slice(0,10);

test('Summer estimation requires the explicitly selected local profile',()=>{
  assert.ok(Object.isFrozen(LOCAL_PROFILES));
  const local=calculate({}),strict=calculate({profile:LOCAL_PROFILE});
  assert.equal(local.profile.id,LOCAL_SEASONAL_PROFILE);
  assert.equal(local.profile.official,false);
  assert.equal(local.profile.institutionalEquivalence,'not-claimed');
  assert.equal(local.coverage.complete,true);
  assert.deepEqual(local.coverage.estimatedEvents,['fajr','isha']);
  assert.equal(local.astronomy.events.fajr.status,'unavailable');
  for(const name of ['fajr','isha']){
    assert.equal(strict.events[name].status,'policy-blocked');
    assert.equal(strict.events[name].utc,null);
    assert.equal(local.events[name].status,'estimated');
    assert.match(local.events[name].rule,new RegExp(`^${LOCAL_SEASONAL_PROFILE}\\.${name}\\.`));
    assert.equal(local.events[name].adjustmentMinutes,0);
  }
  for(const name of ['sunrise','dhuhr','asr','maghrib'])
    assert.equal(local.events[name].rawEpochMilliseconds,strict.events[name].rawEpochMilliseconds);
  assert.deepEqual(local.astronomy,strict.astronomy);
  assert.equal(strict.calculation.seasonalPolicy,null);
});

test('Local seasonal profile covers complete central-European years with dated order across every night',()=>{
  for(const [latitude,longitude,timeZone,year] of [[50.1109,8.6821,'Europe/Berlin',2027],
    [52.52,13.405,'Europe/Berlin',2028],[44.84,-.58,'Europe/Paris',2027],[55.95,-3.19,'Europe/London',2027]]){
    let previous=null,estimated=0;
    for(let date=`${year}-01-01`;date<=`${year}-12-31`;date=nextDate(date)){
      const day=calculate({date,latitude,longitude,timeZone});
      assert.equal(day.calculation.seasonalPolicy.status,'available',`${latitude}/${date}`);
      assert.equal(day.coverage.complete,true,`${latitude}/${date}`);
      for(let i=1;i<LOCAL_EVENTS.length;i++)
        assert.ok(day.events[LOCAL_EVENTS[i]].rawEpochMilliseconds>day.events[LOCAL_EVENTS[i-1]].rawEpochMilliseconds,`${date}/${LOCAL_EVENTS[i]}`);
      if(previous)assert.ok(previous.events.isha.rawEpochMilliseconds<day.events.fajr.rawEpochMilliseconds,date);
      for(const name of ['fajr','isha']){
        const e=day.events[name];
        assert.equal(Date.parse(e.utc),e.epochMilliseconds);
        assert.ok(Math.abs(e.epochMilliseconds-e.rawEpochMilliseconds)<=.5);
        assert.ok(Math.abs(e.roundedEpochMilliseconds-e.rawEpochMilliseconds)<=30000);
        if(e.status==='estimated')estimated++;
        else assert.equal(e.rawEpochMilliseconds,day.astronomy.events[name].epochMilliseconds);
      }
      previous=day;
    }
    assert.ok(estimated>0);
    const next=calculate({date:`${year+1}-01-01`,latitude,longitude,timeZone});
    assert.equal(next.coverage.complete,true);
    assert.ok(previous.events.isha.rawEpochMilliseconds<next.events.fajr.rawEpochMilliseconds);
  }
});

test('New summer rule preserves ordinary winter and lower-latitude selected instants',()=>{
  for(const changes of [{date:'2027-01-15'},{date:'2027-06-21',latitude:41.0082,longitude:28.9784,timeZone:'Europe/Istanbul'},
    {date:'2027-12-21',latitude:-33.87,longitude:151.21,timeZone:'Australia/Sydney'}]){
    const a=calculate(changes),b=calculate({...changes,profile:LOCAL_PROFILE});
    for(const name of LOCAL_EVENTS)assert.equal(a.events[name].rawEpochMilliseconds,b.events[name].rawEpochMilliseconds,name);
    assert.equal(a.coverage.complete,true);
  }
  const south=calculate({date:'2027-12-21',latitude:-60,longitude:0,timeZone:'UTC'});
  assert.equal(south.events.fajr.status,'unavailable');
  assert.equal(south.calculation.seasonalPolicy,null);
});

test('Unsupported summer horizons remain blocked and cannot be filled by the optional rule',()=>{
  for(const latitude of [59.91,80]){
    const day=calculate({latitude,longitude:10.75,timeZone:'Europe/Oslo'});
    assert.equal(day.calculation.seasonalPolicy.status,'blocked');
    assert.equal(day.coverage.complete,false);
    for(const name of ['fajr','isha']){
      assert.equal(day.events[name].status,'policy-blocked');
      assert.equal(day.events[name].epochMilliseconds,null);
    }
  }
  const edge=calculate({date:'2001-06-21'});
  assert.equal(edge.calculation.seasonalPolicy.status,'blocked');
  assert.equal(edge.events.sunrise.status,'calculated');
});

test('Seasonal cache stays isolated from result mutation and profile query order',()=>{
  const first=calculate({});
  const mutated=calculate({});
  mutated.calculation.seasonalPolicy.metadata.q=-100;
  mutated.calculation.seasonalPolicy.day.fajr.rawEpochMilliseconds=0;
  mutated.events.fajr.selection.weight=-1;
  calculate({profile:LOCAL_PROFILE});
  assert.deepEqual(calculate({}),first);
});

test('Local summer CLI and calculation run without calendars or network permission',()=>{
  const allowed=['package.json','core/local/index.mjs','core/local/solar.mjs','core/local/northern.mjs','core/local/summer.mjs','core/local/profiles.mjs','core/local/selection.mjs','core/input.mjs','core/astronomy/','core/timezones/'];
  const program=`
    import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
    import {calculateLocalDay} from ${JSON.stringify(new URL('core/local/index.mjs',root).href)};
    assert.equal(process.permission.has('net'),false);
    for(const p of ${JSON.stringify(['core/local/verification/northern-fixtures.json','core/local/verification/summer-fixtures.json','core/diyanet/calendar.mjs'].map(file))})
      assert.throws(()=>readFileSync(p),{code:'ERR_ACCESS_DENIED'});
    console.log(JSON.stringify(calculateLocalDay(${JSON.stringify(input)})));
  `;
  const child=spawnSync(process.execPath,['--permission',...allowed.map(p=>`--allow-fs-read=${file(p)}`),'--input-type=module','--eval',program],{
    cwd:file('.'),env:{...process.env,TZ:'Pacific/Honolulu'},encoding:'utf8',timeout:15000});
  assert.ifError(child.error);assert.equal(child.status,0,child.stderr);
  assert.deepEqual(JSON.parse(child.stdout),calculate({}));
  const cli=spawnSync(process.execPath,[file('scripts/calculate-local.mjs'),input.date,String(input.latitude),String(input.longitude),input.timeZone,input.profile,'--json'],{encoding:'utf8',timeout:15000});
  assert.ifError(cli.error);assert.equal(cli.status,0,cli.stderr);
  assert.deepEqual(JSON.parse(cli.stdout),calculate({}));
});
