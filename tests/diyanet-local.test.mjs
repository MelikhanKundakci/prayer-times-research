import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {calculateDiyanetLocalDay,calculateDiyanetLocalSchedule,getDiyanetLocalProfile,
  listDiyanetLocalProfiles,LOCAL_DIYANET_LOCAL_PROFILES,LOCAL_DIYANET_LOCAL_VERSION} from '../core/local/diyanet-local.mjs';
import {calculateLocalDay,LOCAL_DIYANET_SPA_PROFILE,LOCAL_EVENTS} from '../core/local/index.mjs';
import {calculateLocalSolarDay} from '../core/local/solar.mjs';

const profile='diyanet-local-seasonal-spa-v1';
const point={latitude:50.1109,longitude:8.6821,timeZone:'Europe/Berlin'};
const input={date:'2027-06-21',...point,profile};
const local=(changes={})=>calculateDiyanetLocalDay({...input,...changes});
const strict=(changes={})=>calculateLocalDay({...input,...changes,profile:LOCAL_DIYANET_SPA_PROFILE});
const nextDate=date=>new Date(Date.parse(`${date}T00:00:00Z`)+86_400_000).toISOString().slice(0,10);

test('standalone SPA summer policy retains strict ordinary events and honest estimate provenance',()=>{
  const result=local(),base=strict();
  assert.equal(result.profile.id,profile);
  assert.equal(result.profile.official,false);
  assert.equal(result.profile.institutionalEquivalence,'not-claimed');
  assert.match(result.profile.authority,/Independent local software/);
  assert.equal(result.calculation.version,LOCAL_DIYANET_LOCAL_VERSION);
  assert.equal(result.calculation.astronomicalModel.id,'SPA-continuous-point-v1');
  assert.equal(result.calculation.seasonalPolicy.status,'available');
  assert.equal(result.calculation.seasonalPolicy.absenceGuard.status,'available');
  assert.equal(result.coverage.complete,true);
  assert.deepEqual(result.coverage.estimatedEvents,['fajr','isha']);
  assert.deepEqual(result.astronomy,base.astronomy);
  for(const name of ['sunrise','dhuhr','asr','maghrib'])assert.deepEqual(result.events[name],base.events[name]);
  for(const name of ['fajr','isha']){
    assert.equal(base.events[name].status,'policy-blocked');
    assert.equal(result.events[name].status,'estimated');
    assert.equal(result.events[name].ruleEvidence.classification,'software-estimate');
    assert.match(result.events[name].rule,new RegExp(`^${profile}\\.${name}\\.`));
    assert.equal(result.events[name].selection.selectedEpochMilliseconds,result.events[name].rawEpochMilliseconds);
  }
});

test('full SPA year preserves every strict available event and physical night order',()=>{
  let previous=null,estimated=0,transition=0;
  for(let date='2027-01-01';date<='2027-12-31';date=nextDate(date)){
    const day=local({date}),base=strict({date});
    assert.equal(day.coverage.complete,true,date);
    for(let i=1;i<LOCAL_EVENTS.length;i++)assert.ok(day.events[LOCAL_EVENTS[i-1]].rawEpochMilliseconds
      <day.events[LOCAL_EVENTS[i]].rawEpochMilliseconds,`${date}/${LOCAL_EVENTS[i]}`);
    if(previous)assert.ok(previous.events.isha.rawEpochMilliseconds<day.events.fajr.rawEpochMilliseconds,date);
    for(const name of LOCAL_EVENTS){
      const event=day.events[name];
      if(['calculated','estimated'].includes(base.events[name].status))assert.deepEqual(event,base.events[name],`${date}/${name}`);
      assert.equal(Date.parse(event.utc),event.epochMilliseconds);
      assert.ok(Math.abs(event.rawEpochMilliseconds-event.epochMilliseconds)<=.5);
      assert.ok(Math.abs(event.rawEpochMilliseconds-event.roundedEpochMilliseconds)<=30_000);
      if(event.status==='estimated')estimated++;
      if(event.selection?.mode==='transition')transition++;
    }
    previous=day;
  }
  assert.ok(estimated>0);assert.ok(transition>0);
  const january=local({date:'2028-01-01'});
  assert.ok(previous.events.isha.rawEpochMilliseconds<january.events.fajr.rawEpochMilliseconds);
});

test('local winter proof admits Oslo real crossings while preserving the blocked annual summer gate',()=>{
  const where={latitude:59.9139,longitude:10.7522,timeZone:'Europe/Oslo'};
  const winter=local({...where,date:'2027-01-15'}),base=strict({...where,date:'2027-01-15'});
  assert.equal(base.calculation.northernPolicy.reason,'annual-five-hour-horizon-gate-not-met');
  assert.equal(winter.calculation.northernPolicy.status,'blocked');
  assert.deepEqual(winter.calculation.northernPolicy,base.calculation.northernPolicy);
  assert.equal(winter.calculation.seasonalPolicy.status,'blocked');
  assert.equal(winter.calculation.winterAdmission.evaluated,true);
  for(const name of ['fajr','isha']){
    assert.equal(base.events[name].status,'policy-blocked');
    assert.equal(winter.events[name].status,'calculated');
    assert.equal(winter.events[name].rawEpochMilliseconds,winter.astronomy.events[name].epochMilliseconds);
    assert.equal(winter.events[name].selection.proof.horizons.eligible,true);
    assert.equal(winter.events[name].selection.proof.outsideAnnualEnvelope,true);
  }
  const summer=local({...where,date:'2027-06-21'});
  for(const name of ['fajr','isha']){
    assert.equal(summer.events[name].status,'policy-blocked');
    assert.equal(summer.events[name].epochMilliseconds,null);
  }
});

test('a genuine grazing twilight blocks local extensions without suppressing strict ordinary days',()=>{
  // This coordinate is an actual SPA grazing root, not a mocked missing event.
  const where={latitude:48.56323018835974,longitude:8.6821,timeZone:'Europe/Berlin'};
  const date='2027-06-22';
  const solar=calculateLocalSolarDay({date,...where,solarModel:'spa',ishaAngleDegrees:16});
  assert.equal(solar.events.fajr.reason,'tangent-without-directed-crossing');
  assert.equal(solar.events.fajr.diagnosticStatus,'grazing');
  const summer=local({...where,date});
  assert.equal(summer.calculation.seasonalPolicy.absenceGuard.status,'blocked');
  assert.equal(summer.calculation.seasonalPolicy.reason,'local-seasonal-tangent-context-unresolved');
  assert.equal(summer.events.fajr.status,'policy-blocked');
  assert.equal(summer.events.fajr.epochMilliseconds,null);
  const winter=local({...where,date:'2027-01-15'}),base=strict({...where,date:'2027-01-15'});
  for(const name of LOCAL_EVENTS)assert.deepEqual(winter.events[name],base.events[name]);
});

test('southern and lower latitude points and padding years keep strict base behavior',()=>{
  for(const changes of [
    {latitude:41.0082,longitude:28.9784,timeZone:'Europe/Istanbul'},
    {date:'2027-12-21',latitude:-60,longitude:0,timeZone:'UTC'},
    {date:'2001-06-21'},{date:'2098-06-21'},
  ]){
    const day=local(changes),base=strict(changes);
    for(const name of LOCAL_EVENTS)assert.deepEqual(day.events[name],base.events[name]);
    assert.equal(day.calculation.winterAdmission,null);
  }
  for(const date of ['2000-12-31','2099-01-01','2027-02-30'])assert.throws(()=>local({date}),RangeError);
  assert.throws(()=>local({solarModel:'usno'}),TypeError);
  assert.throws(()=>local({profile:'unregistered'}),RangeError);
});

test('polar gaps remain explicit and no local extension invents a horizon',()=>{
  const changes={date:'2027-06-21',latitude:69.6492,longitude:18.9553,timeZone:'Europe/Oslo'};
  const day=local(changes),base=strict(changes);
  assert.equal(day.coverage.complete,false);
  for(const name of LOCAL_EVENTS)assert.deepEqual(day.events[name],base.events[name]);
  assert.equal(day.events.sunrise.epochMilliseconds,null);
  assert.equal(day.events.maghrib.epochMilliseconds,null);
});

test('profile definitions and annual results cannot mutate shared cached state',()=>{
  assert.ok(Object.isFrozen(LOCAL_DIYANET_LOCAL_PROFILES));
  assert.ok(Object.isFrozen(getDiyanetLocalProfile(profile).localSeasonalPolicy));
  const catalog=listDiyanetLocalProfiles();catalog[0].astronomy.solarModel='usno';
  assert.equal(getDiyanetLocalProfile(profile).astronomy.solarModel,'spa');
  const first=local(),changed=local();
  changed.calculation.seasonalPolicy.metadata.q=-20;
  changed.calculation.seasonalPolicy.day.fajr.weight=-20;
  changed.events.fajr.selection.selectedEpochMilliseconds=0;
  assert.deepEqual(local(),first);
});

test('dated schedules retain estimated provenance and work over clock and year changes',()=>{
  for(const startDate of ['2027-03-27','2027-10-30','2027-06-20','2001-12-31']){
    const result=calculateDiyanetLocalSchedule({startDate,dayCount:3,...point,profile});
    assert.equal(result.context.profileId,profile);
    assert.equal(result.context.calculationVersion,LOCAL_DIYANET_LOCAL_VERSION);
    for(let i=1;i<result.entries.length;i++)assert.ok(result.entries[i-1].epochMilliseconds<result.entries[i].epochMilliseconds);
    if(startDate!=='2001-12-31')assert.equal(result.complete,true,startDate);
    if(startDate==='2027-06-20'){
      assert.equal(result.entries.filter(entry=>entry.status==='estimated').length,6);
      assert.ok(result.entries.filter(entry=>entry.status==='estimated').every(entry=>entry.ruleEvidence.classification==='software-estimate'));
    }
  }
});

test('calculation is reproducible with no network or timetable-file permissions',()=>{
  const root=new URL('../',import.meta.url),file=path=>fileURLToPath(new URL(path,root));
  const allowed=['package.json','core/input.mjs','core/local/index.mjs','core/local/solar.mjs','core/local/northern.mjs',
    'core/local/summer.mjs','core/local/profiles.mjs','core/local/selection.mjs','core/local/night-fraction.mjs',
    'core/local/schedule.mjs','core/local/diyanet-local.mjs','core/local/diyanet-winter.mjs','core/astronomy/','core/timezones/'];
  const source=`import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
    import {calculateDiyanetLocalDay} from ${JSON.stringify(new URL('core/local/diyanet-local.mjs',root).href)};
    assert.equal(process.permission.has('net'),false);
    assert.throws(()=>readFileSync(${JSON.stringify(file('core/local/verification/summer-fixtures.json'))}),{code:'ERR_ACCESS_DENIED'});
    console.log(JSON.stringify(calculateDiyanetLocalDay(${JSON.stringify(input)})));`;
  const child=spawnSync(process.execPath,['--permission',...allowed.map(path=>`--allow-fs-read=${file(path)}`),
    '--input-type=module','--eval',source],{encoding:'utf8',timeout:60_000,env:{...process.env,TZ:'Pacific/Honolulu'}});
  assert.ifError(child.error);assert.equal(child.status,0,child.stderr);
  assert.deepEqual(JSON.parse(child.stdout),local());
});
