import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveFamilySettings} from '../examples/local-app/method-settings.mjs';
import {listAvailableMethods} from '../core/local/methods.mjs';
import {listSunniMethods,calculateSunniDay} from '../core/local/sunni.mjs';
import {createLocalAppServer} from '../scripts/local-app.mjs';

const methods=listAvailableMethods();
const method=id=>methods.find(value=>value.id===id);
const frankfurt={latitude:50.1109,longitude:8.6821,timeZone:'Europe/Berlin'};
const events=['fajr','sunrise','dhuhr','asr','maghrib','isha'];

test('automatic app settings use each family’s declared Asr and enable only the validated MWL summer policy',()=>{
  const expected={
    mwl:{profile:'sunni-mwl-shadow1-local-relative-v1',asrFactor:1,nightMode:'local-relative',ramadanMode:null},
    karachi:{profile:'sunni-karachi-shadow2-physical-v1',asrFactor:2,nightMode:'physical',ramadanMode:null},
    egyptian:{profile:'sunni-egyptian-shadow1-physical-v1',asrFactor:1,nightMode:'physical',ramadanMode:null},
    'umm-al-qura':{profile:'sunni-umm-al-qura-shadow1-calendar-v1',asrFactor:1,nightMode:null,ramadanMode:'calendar'},
    isna:{profile:'sunni-isna-shadow1-physical-v1',asrFactor:1,nightMode:'physical',ramadanMode:null},
    diyanet:{profile:'diyanet-published-spa-point-v1',asrFactor:1,nightMode:'physical',ramadanMode:null},
    kemenag:{profile:'kemenag-worked-example-point-v1',asrFactor:1,nightMode:'physical',ramadanMode:null},
    jakim:{profile:'sunni-jakim-shadow1-physical-v1',asrFactor:1,nightMode:'physical',ramadanMode:null},
  };
  for(const entry of methods){
    const automatic=resolveFamilySettings(entry);
    assert.deepEqual(automatic,{automatic:true,...expected[entry.id]},entry.id);
    assert.ok(entry.profiles.includes(automatic.profile));
    assert.deepEqual(resolveFamilySettings(entry,{automatic:true,asrFactor:2,nightMode:'reference45',ramadanMode:'ramadan'}),automatic,
      `${entry.id}: stale manual values cannot change automatic settings`);
  }
});

test('manual Asr, night and Ramadan overrides resolve actual settings, then automatic restores family choices',()=>{
  for(const [family,options,profile] of [
    ['mwl',{asrFactor:2,nightMode:'physical'},'sunni-mwl-shadow2-physical-v1'],
    ['karachi',{asrFactor:1,nightMode:'angle-night'},'sunni-karachi-shadow1-angle-night-v1'],
    ['egyptian',{asrFactor:2,nightMode:'reference45'},'sunni-egyptian-shadow2-reference45-v1'],
    ['isna',{asrFactor:2,nightMode:'angle-night'},'sunni-isna-shadow2-angle-night-v1'],
    ['umm-al-qura',{asrFactor:2,ramadanMode:'ordinary'},'sunni-umm-al-qura-shadow2-ordinary-v1'],
  ]){
    const entry=method(family),selected=resolveFamilySettings(entry,{automatic:false,...options});
    assert.equal(selected.automatic,false);assert.equal(selected.profile,profile);
    assert.equal(selected.asrFactor,options.asrFactor);
    if(options.nightMode)assert.equal(selected.nightMode,options.nightMode);
    if(options.ramadanMode)assert.equal(selected.ramadanMode,options.ramadanMode);
    assert.deepEqual(resolveFamilySettings(entry,{automatic:true,...options}),resolveFamilySettings(entry));
  }
  for(const family of ['diyanet','kemenag','jakim']){
    const selected=resolveFamilySettings(method(family),{automatic:false,asrFactor:2,nightMode:'local-relative',ramadanMode:'ramadan'});
    assert.equal(selected.profile,method(family).defaultProfile);
    assert.equal(selected.asrFactor,1);assert.equal(selected.nightMode,'physical');assert.equal(selected.ramadanMode,null);
  }
  const invalid=resolveFamilySettings(method('isna'),{automatic:false,asrFactor:99,nightMode:'local-relative'});
  assert.equal(invalid.profile,method('isna').defaultProfile);
  assert.equal(invalid.asrFactor,1);assert.equal(invalid.nightMode,'physical');
});

test('automatic app policy does not mutate frozen catalogue choices or leak settings across families',()=>{
  const before=listAvailableMethods(),historical=listSunniMethods();
  const mwl=before.find(entry=>entry.id==='mwl');
  resolveFamilySettings(mwl);resolveFamilySettings(mwl,{automatic:false,asrFactor:2,nightMode:'angle-night'});
  for(const entry of before)resolveFamilySettings(entry,{automatic:true,asrFactor:2,nightMode:'local-relative'});
  assert.deepEqual(before,listAvailableMethods());assert.deepEqual(historical,listSunniMethods());
  assert.equal(mwl.defaultProfile,'sunni-mwl-shadow1-physical-v1');
  assert.equal(resolveFamilySettings(method('egyptian')).profile,'sunni-egyptian-shadow1-physical-v1');
  assert.equal(resolveFamilySettings(method('karachi')).asrFactor,2);
  assert.equal(resolveFamilySettings(method('isna')).asrFactor,1);
});

test('automatic MWL fails closed when its summer policy is absent from the supplied catalogue',()=>{
  const historical=listSunniMethods().find(entry=>entry.id==='mwl');
  assert.throws(()=>resolveFamilySettings(historical),/automatic MWL summer profile is unavailable/);
  const incomplete=structuredClone(method('mwl'));
  incomplete.profiles=incomplete.profiles.filter(id=>!id.endsWith('-local-relative-v1'));
  assert.throws(()=>resolveFamilySettings(incomplete),/automatic MWL summer profile is unavailable/);
  assert.equal(resolveFamilySettings(historical,{automatic:false}).profile,historical.defaultProfile);
  assert.equal(resolveFamilySettings(incomplete,{automatic:false,nightMode:'physical'}).profile,incomplete.defaultProfile);
});

test('automatic profiles reach the local API with marked MWL estimates, unchanged winter events and honest family limits',async t=>{
  const server=createLocalAppServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const base=`http://127.0.0.1:${server.address().port}`;
  const asset=await fetch(base+'/method-settings.mjs');assert.equal(asset.status,200);
  assert.match(asset.headers.get('content-type'),/javascript/);
  const calculate=async(family,date,location=frankfurt)=>{
    const profile=resolveFamilySettings(method(family)).profile;
    const response=await fetch(base+'/api/calculate',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({date,...location,profile})});
    assert.equal(response.status,200,`${family} ${date}`);
    const result=await response.json();assert.equal(result.day.profile.id,profile);return result;
  };
  const summer=await calculate('mwl','2027-06-21');
  assert.equal(summer.day.coverage.prayerStartsComplete,true);assert.equal(summer.schedule.complete,true);
  assert.deepEqual(summer.day.coverage.estimatedEvents,['fajr','isha']);
  for(const name of ['fajr','isha']){
    const event=summer.day.events[name];assert.equal(event.status,'estimated');
    const entry=summer.schedule.entries.find(value=>value.sourceDate===summer.day.date&&value.event===name);
    assert.equal(entry.status,'estimated');assert.equal(entry.epochMilliseconds,event.epochMilliseconds);
  }
  const winter=await calculate('mwl','2027-01-15');
  const physical=calculateSunniDay({date:winter.day.date,...frankfurt,profile:method('mwl').defaultProfile});
  for(const name of events){
    assert.equal(winter.day.events[name].status,'calculated',name);
    assert.equal(winter.day.events[name].rawEpochMilliseconds,physical.events[name].rawEpochMilliseconds,name);
  }
  const cairo={latitude:30.0444,longitude:31.2357,timeZone:'Africa/Cairo'};
  const egypt=await calculate('egyptian','2027-06-21',cairo);
  assert.equal(egypt.day.profile.id,method('egyptian').defaultProfile);
  assert.equal(egypt.day.coverage.prayerStartsComplete,true);assert.deepEqual(egypt.day.coverage.estimatedEvents,[]);
  const diyanet=await calculate('diyanet','2027-06-21');
  assert.equal(diyanet.day.coverage.prayerStartsComplete,false);
  for(const name of ['fajr','isha']){
    assert.equal(diyanet.day.events[name].status,'policy-blocked');
    assert.equal(diyanet.day.events[name].epochMilliseconds,null);
    assert.ok(!diyanet.schedule.entries.some(entry=>entry.sourceDate===diyanet.day.date&&entry.event===name));
  }
});

test('automatic Umm al-Qura resolves Ramadan from the date without a manual season switch',()=>{
  const calendar=new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura-nu-latn',{timeZone:'UTC',month:'numeric'});
  const month=date=>Number(calendar.formatToParts(new Date(`${date}T12:00:00Z`)).find(part=>part.type==='month').value);
  const dates=Array.from({length:365},(_,i)=>new Date(Date.UTC(2027,0,i+1)).toISOString().slice(0,10));
  const profile=resolveFamilySettings(method('umm-al-qura'),{ramadanMode:'ordinary'}).profile;
  for(const [calendarMonth,minutes] of [[8,90],[9,120]]){
    const date=dates.find(value=>month(value)===calendarMonth);assert.ok(date);
    const day=calculateSunniDay({date,latitude:21.4225,longitude:39.8262,timeZone:'Asia/Riyadh',profile});
    assert.equal(day.calculation.intervalPolicy.calendarMonth,calendarMonth);
    assert.equal(day.calculation.intervalPolicy.minutes,minutes);
    assert.equal(day.events.isha.rawEpochMilliseconds-day.events.maghrib.rawEpochMilliseconds,minutes*60_000);
  }
});
