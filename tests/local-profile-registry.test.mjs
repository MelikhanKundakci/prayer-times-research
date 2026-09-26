import test from 'node:test';
import assert from 'node:assert/strict';
import {LOCAL_PROFILE,LOCAL_SEASONAL_PROFILE,LOCAL_PROFILES,getLocalProfile,listLocalProfiles} from '../core/local/profiles.mjs';

const EXPECTED=[
  'diyanet-published-point-v1','local-northern-seasonal-v1','egypt-published-angles-point-v1',
  'fcna-usa-2017-point-v1','fcna-canada-2017-point-v1','kemenag-worked-example-point-v1',
];
const EVENTS=['fajr','sunrise','dhuhr','asr','maghrib','isha'];

test('registry has the six stable unique profile IDs and returns detached ID lists',()=>{
  assert.deepEqual(LOCAL_PROFILES,EXPECTED);
  assert.equal(new Set(LOCAL_PROFILES).size,LOCAL_PROFILES.length);
  const first=listLocalProfiles();
  assert.deepEqual(first.map(profile=>profile.id),EXPECTED);
  first.reverse();first[0].astronomy.fajrAngleDegrees=3;
  assert.deepEqual(listLocalProfiles().map(profile=>profile.id),EXPECTED);
  assert.equal(getLocalProfile('kemenag-worked-example-point-v1').astronomy.fajrAngleDegrees,20);
  assert.equal(LOCAL_PROFILE,'diyanet-published-point-v1');
  assert.equal(LOCAL_SEASONAL_PROFILE,'local-northern-seasonal-v1');
  assert.throws(()=>getLocalProfile('not-a-profile'),/Unknown local profile/);
  const unsafe={toString(){throw new Error('should not run');}};
  assert.throws(()=>getLocalProfile(unsafe),/Unknown local profile/);
});

test('definitions and every nested parameter/source/event record are deeply frozen',()=>{
  const seen=new WeakSet();
  const visit=value=>{
    if(!value||typeof value!=='object'||seen.has(value))return;
    seen.add(value);assert.equal(Object.isFrozen(value),true);
    for(const child of Object.values(value))visit(child);
  };
  for(const id of EXPECTED){
    const definition=getLocalProfile(id);
    visit(definition);
    assert.equal(definition.id,id);
    assert.equal(definition.official,false);
    assert.equal(definition.institutionalEquivalence,'not-claimed');
    assert.ok(Object.hasOwn(definition,'domain'));
    assert.deepEqual(Object.keys(definition.events).sort(),EVENTS.slice().sort());
    for(const event of Object.values(definition.events)){
      assert.ok(Array.isArray(event.sourceKeys));
      for(const key of event.sourceKeys)assert.equal(typeof definition.sources[key],'string',`${id} references source ${key}`);
    }
  }
});

test('published angle and worked-example profiles retain explicit scope and parameters',()=>{
  const byId=Object.fromEntries(EXPECTED.map(id=>[id,getLocalProfile(id)]));
  assert.deepEqual(byId['diyanet-published-point-v1'].astronomy,{fajrAngleDegrees:18,ishaAngleDegrees:17,asrShadowFactor:1,horizonDepressionDegrees:50/60});
  assert.deepEqual(byId['diyanet-published-point-v1'].northern,{thresholdLatitude:44.5,ishaAngleDegrees:16,mode:'ordinary-guard'});
  assert.equal(byId['local-northern-seasonal-v1'].northern.mode,'local-seasonal');
  for(const id of ['diyanet-published-point-v1','local-northern-seasonal-v1']){
    const events=byId[id].events;
    for(const name of ['dhuhr','asr','maghrib'])assert.equal(events[name].role,'prayer-start-model');
  }
  for(const name of ['fajr','isha'])assert.equal(byId['local-northern-seasonal-v1'].events[name].evidence,'local-convention');
  assert.deepEqual([byId['egypt-published-angles-point-v1'].astronomy.fajrAngleDegrees,
    byId['egypt-published-angles-point-v1'].astronomy.ishaAngleDegrees],[19.5,17.5]);
  assert.deepEqual([byId['fcna-usa-2017-point-v1'].astronomy.fajrAngleDegrees,
    byId['fcna-usa-2017-point-v1'].astronomy.ishaAngleDegrees],[15,15]);
  assert.deepEqual([byId['fcna-canada-2017-point-v1'].astronomy.fajrAngleDegrees,
    byId['fcna-canada-2017-point-v1'].astronomy.ishaAngleDegrees],[13,13]);
  const k=byId['kemenag-worked-example-point-v1'];
  assert.deepEqual(k.astronomy,{fajrAngleDegrees:20,ishaAngleDegrees:18,asrShadowFactor:1,horizonDepressionDegrees:1});
  assert.deepEqual(k.domain.latitude,[-12,8]);
  assert.deepEqual(k.domain.longitude,[94,142]);
  assert.equal(k.events.fajr.rounding,'ceil-minute');
  assert.equal(k.events.sunrise.rounding,'floor-minute');
  assert.equal(k.events.dhuhr.marginMinutes,3);
  assert.equal(k.events.asr.marginMinutes,2);
  assert.match(k.sourceScope,/Imsak and Dhuha are not implemented/);
});
