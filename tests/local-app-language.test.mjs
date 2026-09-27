import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {localizedProfileScope,localizedReason,localizedRuleDescription,normalizeLanguage,readLanguage,setLanguagePresentation,translate,writeLanguage,LANGUAGE_STORAGE_KEY} from '../examples/local-app/i18n.mjs';
import {diyanetComparisonRows} from '../examples/local-app/comparison-view.mjs';

const root=new URL('../examples/local-app/',import.meta.url);

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
  const values=new Map([['date','2026-09-27'],['latitude','50.11'],['timeZone','Europe/Berlin'],['profile','diyanet-published-spa-point-v1'],['result','kept']]);
  const storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
  const doc={documentElement:{lang:'en'},title:'',querySelectorAll:()=>[]};let renders=0;
  const selected=setLanguagePresentation('de',{storage,document:doc,render:()=>renders++});
  assert.equal(selected,'de');assert.equal(doc.documentElement.lang,'de');assert.equal(doc.title,'Lokale Gebetszeiten');
  assert.equal(renders,1);assert.equal(values.get('date'),'2026-09-27');assert.equal(values.get('latitude'),'50.11');
  assert.equal(values.get('timeZone'),'Europe/Berlin');assert.equal(values.get('profile'),'diyanet-published-spa-point-v1');assert.equal(values.get('result'),'kept');
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
