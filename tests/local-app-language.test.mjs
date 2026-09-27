import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {localizedError} from '../examples/local-app/i18n.mjs';
import {localizedFamilyName,localizedFamilyScope,localizedProfileScope,localizedReason,localizedRuleDescription,normalizeLanguage,readLanguage,resolveMethodProfile,setLanguagePresentation,translate,writeLanguage,LANGUAGE_STORAGE_KEY} from '../examples/local-app/i18n.mjs';
import {listAvailableMethods} from '../core/local/methods.mjs';
import {listSunniMethods} from '../core/local/sunni-profiles.mjs';
import {diyanetComparisonRows} from '../examples/local-app/comparison-view.mjs';

const root=new URL('../examples/local-app/',import.meta.url);

test('Diyanet local summer settings remain distinct from the strict published-rule profile',()=>{
  const method=listAvailableMethods().find(m=>m.id==='diyanet');
  assert.equal(resolveMethodProfile(method),method.defaultProfile);
  assert.equal(resolveMethodProfile(method,{nightMode:'local-seasonal'}),'diyanet-local-seasonal-spa-v1');
  assert.equal(resolveMethodProfile(method,{nightMode:'physical'}),'diyanet-published-spa-point-v1');
  for(const lang of ['en','de','tr']){
    for(const key of ['night.local-seasonal','night.mode.local-seasonal','scope.diyanetLocal','rule.diyanetLocalEstimated','rule.diyanetLocalRaw'])
      assert.notEqual(translate(key,lang),key);
    const profile={id:'diyanet-local-seasonal-spa-v1'};
    assert.equal(localizedProfileScope(profile,lang),translate('scope.diyanetLocal',lang));
    const day={profile,location:{latitude:50.11},events:{fajr:{status:'estimated'}}};
    assert.equal(localizedRuleDescription(day,'fajr',lang),translate('rule.diyanetLocalEstimated',lang));
    day.events.fajr.status='policy-blocked';
    assert.equal(localizedRuleDescription(day,'fajr',lang),translate('rule.missing',lang));
  }
});

test('local relative selection is restricted to MWL and explained in all three languages',()=>{
  const methods=listAvailableMethods(),mwl=methods.find(m=>m.id==='mwl');
  for(const factor of [1,2])assert.equal(resolveMethodProfile(mwl,{asrFactor:factor,nightMode:'local-relative'}),`sunni-mwl-shadow${factor}-local-relative-v1`);
  for(const method of methods.filter(m=>m.id!=='mwl'))assert.ok(!resolveMethodProfile(method,{nightMode:'local-relative'}).includes('local-relative'));
  for(const lang of ['en','de','tr']){
    for(const key of ['night.local-relative','night.mode.local-relative','night.relativeSummary','rule.relative','source.localrelative'])assert.notEqual(translate(key,lang),key);
    assert.equal(localizedReason('local-relative-seasonal-replacement',lang),translate('reason.relativeEstimated',lang));
    assert.equal(localizedReason('local-relative-actual-night-unavailable',lang),translate('reason.relativeBlocked',lang));
    assert.match(localizedProfileScope({id:'sunni-mwl-shadow1-local-relative-v1',family:'mwl'},lang),/2009/);
    assert.equal(localizedRuleDescription({profile:{id:'sunni-mwl-shadow1-local-relative-v1'},events:{fajr:{status:'estimated'}}},'fajr',lang),translate('rule.relative',lang));
  }
});

test('English is the safe default and only the language preference is persisted',()=>{
  assert.equal(readLanguage({getItem:()=>null}),'en');
  assert.equal(normalizeLanguage('TR-tr'),'tr');
  assert.equal(normalizeLanguage('fr'),'en');
  const values=new Map([['latitude','50.11'],['date','2026-09-27'],['profile','diyanet-published-spa-point-v1'],['namazVaktiLanguage','de']]);
  const storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
  assert.equal(writeLanguage('tr',storage),'tr');
  assert.deepEqual([...values.entries()],[['latitude','50.11'],['date','2026-09-27'],['profile','diyanet-published-spa-point-v1'],[LANGUAGE_STORAGE_KEY,'tr']]);
  assert.equal(readLanguage({getItem(){throw new Error('storage disabled');}}),'en');
  assert.equal(writeLanguage('de',{setItem(){throw new Error('storage disabled');}}),'de');
  const prior=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw new Error('blocked storage accessor');}});
  try{assert.equal(readLanguage(),'en');assert.equal(writeLanguage('tr'),'tr');}finally{if(prior)Object.defineProperty(globalThis,'localStorage',prior);else delete globalThis.localStorage;}
});

test('language choice translates and redraws without invoking a calculation or changing form state',()=>{
  const values=new Map([['date','2026-09-27'],['latitude','50.11'],['timeZone','Europe/Berlin'],['profile','sunni-karachi-shadow2-physical-v1'],['methodFamily','karachi'],['familyShadow','2'],['result','kept']]);
  const storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
  const doc={documentElement:{lang:'en'},title:'',querySelectorAll:()=>[]};let renders=0;
  const selected=setLanguagePresentation('de',{storage,document:doc,render:()=>renders++});
  assert.equal(selected,'de');assert.equal(doc.documentElement.lang,'de');assert.equal(doc.title,'Lokale Gebetszeiten');
  assert.equal(renders,1);assert.equal(values.get('date'),'2026-09-27');assert.equal(values.get('latitude'),'50.11');
  assert.equal(values.get('timeZone'),'Europe/Berlin');assert.equal(values.get('profile'),'sunni-karachi-shadow2-physical-v1');assert.equal(values.get('methodFamily'),'karachi');assert.equal(values.get('familyShadow'),'2');assert.equal(values.get('result'),'kept');
});

test('visible static translation keys in the app have English, German and Turkish values',async()=>{
  const html=await readFile(new URL('index.html',root),'utf8');
  const keys=[...html.matchAll(/data-i18n="([^"]+)"/g)].map(match=>match[1]);
  const aria=[...html.matchAll(/data-i18n-aria-label="([^"]+)"/g)].map(match=>match[1]);
  for(const language of ['en','de','tr'])for(const key of [...keys,...aria])assert.notEqual(translate(key,language),key,`${language}:${key}`);
});

function sampleComparison(){
  const event={status:'calculated',role:'prayer-start-model',time:'19:22',seconds:'19:21:48',calendarDate:'2026-09-26',secondsDate:'2026-09-26'};
  const pair={local:{...event},calendar:{...event,time:'19:23'},localAvailable:true,calendarAvailable:true,roundedEpochDifferenceMilliseconds:-60000,rawDifferenceSeconds:-95.24};
  return{events:Object.fromEntries(['fajr','sunrise','dhuhr','asr','maghrib','isha'].map(name=>[name,structuredClone(pair)]))};
}

test('comparison presentation defaults to English and changes labels without mutating data',()=>{
  const comparison=sampleComparison(),before=structuredClone(comparison);
  const english=diyanetComparisonRows(comparison).find(row=>row.event==='maghrib');
  const turkish=diyanetComparisonRows(comparison,{language:'tr'}).find(row=>row.event==='maghrib');
  const german=diyanetComparisonRows(comparison,{language:'de'}).find(row=>row.event==='maghrib');
  assert.equal(english.name,'Maghrib');assert.equal(english.difference,'−1 min');assert.equal(english.rawDifference,'Before minute rounding: −95.2 sec');
  assert.equal(turkish.name,'Akşam');assert.equal(turkish.difference,'−1 dk');assert.equal(german.name,'Maghrib');assert.equal(german.difference,'−1 Min.');
  assert.deepEqual(comparison,before);
});

test('rule explanations distinguish estimated twilight, Kemenag horizon and minute order, and observer model',()=>{
  const day={profile:{id:'local-18-17-shadow1-angle-night-v1',composition:{asrShadowFactor:1},northernPolicyThresholdDegrees:null},
    astronomy:{model:{fajrAngleDegrees:18,ishaAngleDegrees:17,horizonDepressionDegrees:0.833333}},calculation:{},events:{fajr:{status:'estimated',adjustmentMinutes:0}}};
  assert.match(localizedRuleDescription(day,'fajr','en'),/Estimated/);
  assert.equal(localizedReason('northern-horizon-policy-not-implemented','en'),'This profile does not provide this event under the selected policy');
  const kemenag={profile:{id:'kemenag-worked-example-point-v1',composition:null,northernPolicyThresholdDegrees:null},
    astronomy:{model:{fajrAngleDegrees:20,ishaAngleDegrees:18,horizonDepressionDegrees:1}},calculation:{},events:{
      sunrise:{status:'calculated',role:'sunrise-marker',adjustmentMinutes:-2,basis:{rounding:'floor-minute'}},
      maghrib:{status:'calculated',role:'prayer-start-model',adjustmentMinutes:2,basis:{rounding:'ceil-minute'}}}};
  assert.match(localizedRuleDescription(kemenag,'sunrise','en'),/−1°.*rounded down.*-2 minutes/);
  assert.match(localizedRuleDescription(kemenag,'maghrib','en'),/−1°.*rounded up.*2 minutes/);
  const observer={id:'local-18-17-shadow1-physical-observer-v1',composition:{},northernPolicyThresholdDegrees:null,sourceScope:'base'};
  assert.match(localizedProfileScope(observer,'en'),/0 m reference surface/);
});

test('eight family selector profiles resolve defaults and independent controls from the method catalogue',()=>{
  const methods=listSunniMethods(),ids=['mwl','karachi','egyptian','umm-al-qura','isna','diyanet','kemenag','jakim'];
  assert.deepEqual(methods.map(method=>method.id),ids);
  for(const method of methods){
    assert.equal(resolveMethodProfile(method),method.defaultProfile);
    for(const language of ['en','de','tr']){
      assert.notEqual(localizedFamilyName(method.id,language),`family.${method.id}`);
      assert.ok(localizedFamilyScope(method.id,language).length>40);
    }
  }
  const karachi=methods.find(method=>method.id==='karachi');
  assert.match(karachi.defaultProfile,/shadow2-physical/);
  assert.equal(resolveMethodProfile(karachi,{asrFactor:1,nightMode:'angle-night'}),'sunni-karachi-shadow1-angle-night-v1');
  const mwl=methods.find(method=>method.id==='mwl');
  assert.equal(resolveMethodProfile(mwl,{asrFactor:2,nightMode:'angle-night'}),'sunni-mwl-shadow2-angle-night-v1');
  const umm=methods.find(method=>method.id==='umm-al-qura');
  assert.equal(resolveMethodProfile(umm,{asrFactor:2,ramadanMode:'ordinary'}),'sunni-umm-al-qura-shadow2-ordinary-v1');
  assert.match(localizedFamilyScope('umm-al-qura','en','ordinary'),/manual Ramadan\/ordinary-day choice/);
  assert.equal(resolveMethodProfile(methods.find(method=>method.id==='diyanet'),{asrFactor:2,nightMode:'angle-night'}),'diyanet-published-spa-point-v1');
  assert.equal(resolveMethodProfile(methods.find(method=>method.id==='kemenag'),{asrFactor:2,nightMode:'angle-night'}),'kemenag-worked-example-point-v1');
});

test('region-specific city choices and source labels are translated for all UI languages',async()=>{
  const html=await readFile(new URL('index.html',root),'utf8');
  for(const key of ['city.makkah','city.karachi','city.kuala-lumpur'])assert.ok(html.includes(`data-i18n="${key}"`));
  const {localizedSourceLabel}=await import('../examples/local-app/i18n.mjs');
  for(const language of ['en','de','tr']){
    assert.notEqual(localizedSourceLabel('catalog',language),'catalog');
    assert.notEqual(localizedSourceLabel('jakim',language),'jakim');
    assert.notEqual(localizedSourceLabel('malaysiaRounding',language),'malaysiaRounding');
    assert.match(localizedError('location is outside the declared Malaysian point domain',language),/Malaysia|Malezya/i);
  }
});

test('reference-night profile selection and explanation do not become a generic family fallback',()=>{
  const methods=listAvailableMethods();
  for(const family of ['mwl','egyptian']){
    const method=methods.find(m=>m.id===family);
    assert.equal(resolveMethodProfile(method),method.defaultProfile);
    for(const asrFactor of [1,2])assert.equal(resolveMethodProfile(method,{asrFactor,nightMode:'reference45'}),`sunni-${family}-shadow${asrFactor}-reference45-v1`);
  }
  for(const method of methods.filter(m=>!['mwl','egyptian'].includes(m.id)))
    assert.equal(resolveMethodProfile(method,{nightMode:'reference45'}),method.defaultProfile);
  const profile={id:'sunni-mwl-shadow1-reference45-v1',family:'mwl'};
  for(const lang of ['en','de','tr']){
    assert.match(localizedProfileScope(profile,lang),/1986\/2007/);
    assert.match(localizedRuleDescription({profile,events:{fajr:{status:'estimated'}},calculation:{}},'fajr',lang),/45°/);
    for(const key of ['night.reference45','night.mode.reference45','night.reference45Summary','source.referencecouncil','source.referenceclarification'])assert.notEqual(translate(key,lang),key);
  }
});
