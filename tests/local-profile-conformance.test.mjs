import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateLocalDay,getLocalProfile,LOCAL_PROFILES,LOCAL_EVENTS} from '../core/local/index.mjs';

function conform(day){
  const profile=getLocalProfile(day.profile.id);
  const formatter=new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn',{
    timeZone:day.location.timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
  const parts=epoch=>Object.fromEntries(formatter.formatToParts(epoch).map(p=>[p.type,p.value]));
  const label=p=>`${p.year}-${p.month}-${p.day}`;
  let previous=null;
  for(const name of LOCAL_EVENTS){
    const e=day.events[name],rule=profile.events[name];
    assert.ok(['calculated','estimated','unavailable','policy-blocked'].includes(e.status));
    assert.equal(e.role,rule.role);assert.equal(e.resolution,rule.resolution);
    for(const key of e.ruleEvidence.sourceKeys)assert.ok(Object.hasOwn(profile.sources,key));
    if(['unavailable','policy-blocked'].includes(e.status)){
      for(const key of ['rawEpochMilliseconds','epochMilliseconds','roundedEpochMilliseconds','utc','calendarUtc','localDate','calendarDate','time','seconds','secondsDate','dateOffset'])
        assert.equal(e[key],null,`${day.profile.id}/${name}/${key}`);
      assert.ok(e.reason);continue;
    }
    assert.equal(Date.parse(e.utc),e.epochMilliseconds);
    assert.equal(e.epochMilliseconds,Math.round(e.rawEpochMilliseconds));
    assert.equal(Date.parse(e.calendarUtc),e.roundedEpochMilliseconds);
    assert.equal(e.roundedEpochMilliseconds,Math.floor(e.rawEpochMilliseconds/60000+.5)*60000);
    const actual=parts(e.epochMilliseconds),shown=parts(e.roundedEpochMilliseconds);
    assert.equal(e.localDate,label(actual));assert.equal(e.calendarDate,label(shown));
    assert.equal(e.time,`${shown.hour}:${shown.minute}`);
    assert.equal(e.dateOffset,(Date.parse(e.localDate)-Date.parse(day.date))/86400000);
    if(e.resolution==='minute'){
      assert.equal(e.epochMilliseconds%60000,0);assert.equal(e.seconds,null);assert.equal(e.secondsDate,null);
    }else{
      const second=parts(Math.round(e.rawEpochMilliseconds/1000)*1000);
      assert.equal(e.seconds,`${second.hour}:${second.minute}:${second.second}`);assert.equal(e.secondsDate,label(second));
    }
    if(previous){
      const equalAllowed=previous.name==='dhuhr'&&name==='asr'&&e.status==='estimated'&&e.rule.endsWith('.asr.no-daylight-shadow.use-dhuhr');
      assert.ok(e.rawEpochMilliseconds>previous.epoch||equalAllowed&&e.rawEpochMilliseconds===previous.epoch);
    }
    previous={name,epoch:e.rawEpochMilliseconds};
  }
  const available=n=>['calculated','estimated'].includes(day.events[n].status);
  assert.equal(day.coverage.complete,LOCAL_EVENTS.every(available));
  assert.equal(day.coverage.prayerStartsComplete,LOCAL_EVENTS.filter(n=>n!=='sunrise').every(n=>available(n)&&day.events[n].role==='prayer-start-model'));
  for(const [field,status] of [['estimatedEvents','estimated'],['unavailableEvents','unavailable'],['policyBlockedEvents','policy-blocked']])
    assert.deepEqual(day.coverage[field],LOCAL_EVENTS.filter(n=>day.events[n].status===status));
}

test('every registered local profile obeys the shared UTC, role, precision, availability and chronology contract',()=>{
  const dates=['2027-03-14','2027-06-21','2027-11-07','2027-12-31','2028-02-29'];
  const world=[[41.0082,28.9784,'Europe/Istanbul'],[50.11,8.68,'Europe/Berlin'],[40.7128,-74.006,'America/New_York'],
    [-33.87,151.21,'Australia/Sydney'],[-13.83,-171.75,'Pacific/Apia'],[1.87,-157.43,'Pacific/Kiritimati'],[80,0,'UTC']];
  const indonesia=[[-6.2,106.8,'Asia/Jakarta'],[-.02,109.34,'Asia/Pontianak'],[-5.15,119.43,'Asia/Makassar'],[-2.53,140.72,'Asia/Jayapura']];
  let cases=0;
  for(const profile of LOCAL_PROFILES)for(const [latitude,longitude,timeZone] of profile==='kemenag-worked-example-point-v1'?indonesia:world)
    for(const date of dates){conform(calculateLocalDay({date,latitude,longitude,timeZone,profile}));cases++;}
  assert.equal(cases,195);
});
