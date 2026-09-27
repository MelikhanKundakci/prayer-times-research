#!/usr/bin/env node
// Source-free, declared coverage/invariant checks. This is not a calendar oracle.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {relative,resolve,dirname} from 'node:path';
import {calculateSunniDay,calculateSunniSchedule,listSunniMethods,listSunniProfiles} from '../core/local/sunni.mjs';
import {verifiedBundle} from '../core/timezones/bundle.mjs';

const ROOT=fileURLToPath(new URL('../',import.meta.url));
const REPORT=new URL('../core/local/verification/sunni-grid-2026-09-27.json',import.meta.url);
const DAY=86400000,MINUTE=60000,EVENTS=['fajr','sunrise','dhuhr','asr','maghrib','isha'];
const PRAYERS=EVENTS.filter(name=>name!=='sunrise');
const hash=value=>createHash('sha256').update(value).digest('hex');
const shift=(date,n)=>new Date(Date.parse(date+'T00:00:00Z')+n*DAY).toISOString().slice(0,10);
const point=(id,latitude,longitude,timeZone)=>({id,latitude,longitude,timeZone});
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const annuals=[
  {...point('frankfurt',50.11,8.68,'Europe/Berlin'),method:'mwl'},
  {...point('karachi',24.86,67.01,'Asia/Karachi'),method:'karachi'},
  {...point('cairo',30.04,31.24,'Africa/Cairo'),method:'egyptian'},
  {...point('mecca',21.42,39.83,'Asia/Riyadh'),method:'umm-al-qura'},
  {...point('new-york',40.71,-74.01,'America/New_York'),method:'isna'},
  {...point('istanbul',41.0082,28.9784,'Europe/Istanbul'),method:'diyanet'},
  {...point('jakarta',-6.2,106.8,'Asia/Jakarta'),method:'kemenag'},
  {...point('kuala-lumpur',3.14,101.69,'Asia/Kuala_Lumpur'),method:'jakim'},
].map(x=>({...x,year:2027}));
const boundaries=[
  {...point('lower-date-bound',0,0,'UTC'),date:'2001-01-01',windowStart:'2001-01-01',windowDays:3},
  {...point('upper-date-bound-sydney',-33.87,151.21,'Australia/Sydney'),date:'2098-12-24',windowStart:'2098-12-24',windowDays:8},
  {...point('leap-day-frankfurt',50.11,8.68,'Europe/Berlin'),date:'2024-02-29',windowStart:'2024-02-28',windowDays:3},
  {...point('new-york-spring-dst',40.71,-74.01,'America/New_York'),date:'2027-03-14',windowStart:'2027-03-13',windowDays:3},
  {...point('new-york-autumn-dst',40.71,-74.01,'America/New_York'),date:'2027-11-07',windowStart:'2027-11-06',windowDays:3},
  {...point('berlin-spring-dst',52.52,13.405,'Europe/Berlin'),date:'2027-03-28',windowStart:'2027-03-27',windowDays:3},
  {...point('berlin-autumn-dst',52.52,13.405,'Europe/Berlin'),date:'2027-10-31',windowStart:'2027-10-30',windowDays:3},
  {...point('cape-town-june',-33.92,18.42,'Africa/Johannesburg'),date:'2027-06-21',windowStart:'2027-06-20',windowDays:3},
  {...point('cape-town-december',-33.92,18.42,'Africa/Johannesburg'),date:'2027-12-21',windowStart:'2027-12-20',windowDays:3},
  {...point('tromso-june',69.65,18.96,'Europe/Oslo'),date:'2027-06-21',windowStart:'2027-06-20',windowDays:3},
  {...point('tromso-december',69.65,18.96,'Europe/Oslo'),date:'2027-12-21',windowStart:'2027-12-20',windowDays:3},
  {...point('antimeridian-plus',50,180,'Asia/Anadyr'),date:'2027-09-23',windowStart:'2027-09-22',windowDays:3},
  {...point('antimeridian-minus',50,-180,'Asia/Anadyr'),date:'2027-09-23',windowStart:'2027-09-22',windowDays:3},
  {...point('apia-skipped-date',-13.83,-171.75,'Pacific/Apia'),date:'2011-12-30',windowStart:'2011-12-29',windowDays:3,expectedRejection:'no-transit-civil-date'},
];
const malaysia=[
  {...point('jakim-lower-box',0,99,'Asia/Kuala_Lumpur'),date:'2001-01-01'},
  {...point('jakim-upper-box',8,120,'Asia/Kuching'),date:'2098-12-24'},
  {...point('jakim-leap',3.14,101.69,'Asia/Kuala_Lumpur'),date:'2024-02-29'},
  {...point('jakim-borneo',1.55,110.34,'Asia/Kuching'),date:'2027-06-21'},
];
export const SUNNI_GRID_DECLARATION=freeze({schema:'sunni-invariant-grid-declaration/v1',declaredDate:'2026-09-27',
  purpose:'Implementation, coverage and UTC/date/order consistency only; no independent astronomy or prayer-calendar accuracy claim.',
  annuals,boundaries,malaysia,variants:{expectedNewProfiles:23,date:'2027-06-21',
    globalPoint:point('frankfurt',50.11,8.68,'Europe/Berlin'),malaysiaPoint:point('kuala-lumpur',3.14,101.69,'Asia/Kuala_Lumpur')},
  annualSchedules:'Prior Dec31 through next Jan1; 31-day windows advancing30 days, with one overlapping source date.',
  sampling:'All declared cases are retained. Every new unrestricted profile uses every boundary; Malaysia profile uses its own four in-domain cases.',
  checks:['finite numerical output','six-event status and five-prayer roles','typed UTC and local date/clock consistency',
    'minute-defined values omit seconds','daily selected order and coverage','all annual adjacent-day Isha/Fajr pairs',
    'schedule accounting and per-source-date status','schedule UTC sorting and cross-day reconciliation','positive actual horizon nights for estimates',
    'Umm al-Qura physical-sunset interval','JAKIM margin-before-rounding basis','unchanged dependencies during run']});
export const SUNNI_GRID_DECLARATION_SHA256=hash(JSON.stringify(SUNNI_GRID_DECLARATION));

function pins(){
  const found=new Set();
  function add(path){
    const absolute=resolve(ROOT,path);if(found.has(absolute))return;found.add(absolute);
    const text=readFileSync(absolute,'utf8');if(!absolute.endsWith('.mjs'))return;
    for(const match of text.matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g))add(relative(ROOT,resolve(dirname(absolute),match[1])));
  }
  add('core/local/sunni.mjs');add('core/timezones/bundle.mjs');add('core/timezones/manifest.json');
  return [...found].sort().map(path=>({path:relative(ROOT,path),sha256:hash(readFileSync(path))}));
}
const available=event=>['calculated','estimated'].includes(event.status);
function blank(){return{pointDays:0,completeDays:0,prayerStartsCompleteDays:0,fields:0,status:{calculated:0,estimated:0,unavailable:0,'policy-blocked':0},
  byEvent:Object.fromEntries(EVENTS.map(name=>[name,{calculated:0,estimated:0,unavailable:0,'policy-blocked':0}])),
  reasons:{},qualityFlags:{},minuteDefinedAvailable:0,nonzeroDateOffsets:0};}
const count=(object,key)=>object[key]=(object[key]??0)+1;
function accumulate(total,day){
  total.pointDays++;total.completeDays+=Number(day.coverage.complete);total.prayerStartsCompleteDays+=Number(day.coverage.prayerStartsComplete);
  for(const name of EVENTS){const event=day.events[name];total.fields++;count(total.status,event.status);count(total.byEvent[name],event.status);
    if(event.reason)count(total.reasons,event.reason);if(available(event)&&event.resolution==='minute')total.minuteDefinedAvailable++;
    if(event.dateOffset!==null&&event.dateOffset!==0)total.nonzeroDateOffsets++;}
  for(const flag of day.qualityFlags)count(total.qualityFlags,flag.code);
}
function finiteTree(value,path){
  if(typeof value==='number')assert(Number.isFinite(value),`${path}: nonfinite number`);
  else if(value&&typeof value==='object')for(const [key,item] of Object.entries(value))finiteTree(item,`${path}.${key}`);
}
function display(epoch,zone){
  const fields=Object.fromEntries(new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn',{
    timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23',
  }).formatToParts(epoch).map(part=>[part.type,part.value]));
  return{date:`${fields.year}-${fields.month}-${fields.day}`,time:`${fields.hour}:${fields.minute}`,seconds:`${fields.hour}:${fields.minute}:${fields.second}`};
}
function checkDay(day,input){
  const label=`${input.profile}/${input.date}`;finiteTree(day,label);assert.equal(day.date,input.date);
  assert.deepEqual(Object.keys(day.events),EVENTS);let prior=-Infinity;
  for(const name of EVENTS){
    const event=day.events[name],tag=`${label}/${name}`;
    assert(['calculated','estimated','unavailable','policy-blocked'].includes(event.status),tag);
    assert.equal(event.role,name==='sunrise'?'sunrise-marker':'prayer-start-model',`${tag}: role`);
    if(available(event)){
      assert(Number.isFinite(event.rawEpochMilliseconds),tag);assert(Number.isSafeInteger(event.epochMilliseconds),tag);
      assert(event.epochMilliseconds>prior,`${tag}: selected integer UTC order`);prior=event.epochMilliseconds;
      assert.equal(event.epochMilliseconds,Math.round(event.rawEpochMilliseconds),tag);
      assert.equal(event.utc,new Date(event.epochMilliseconds).toISOString(),tag);
      assert.equal(event.roundedEpochMilliseconds,Math.floor(event.rawEpochMilliseconds/MINUTE+.5)*MINUTE,tag);
      assert.equal(event.calendarUtc,new Date(event.roundedEpochMilliseconds).toISOString(),tag);
      const local=display(event.epochMilliseconds,input.timeZone),calendar=display(event.roundedEpochMilliseconds,input.timeZone);
      assert.equal(event.localDate,local.date,tag);assert.equal(event.calendarDate,calendar.date,tag);assert.equal(event.time,calendar.time,tag);
      assert.equal(event.dateOffset,(Date.parse(local.date+'T00:00:00Z')-Date.parse(input.date+'T00:00:00Z'))/DAY,tag);
      if(event.resolution==='minute'){
        assert.equal(event.seconds,null,tag);assert.equal(event.secondsDate,null,tag);assert.equal(event.epochMilliseconds%MINUTE,0,tag);
      }else{const second=display(Math.round(event.rawEpochMilliseconds/1000)*1000,input.timeZone);
        assert.equal(event.seconds,second.seconds,tag);assert.equal(event.secondsDate,second.date,tag);}
      if(event.status==='estimated'&&event.selection?.policy==='angle-over-60-night'){
        const s=event.selection;assert(s.sunsetEpochMilliseconds<event.rawEpochMilliseconds&&event.rawEpochMilliseconds<s.sunriseEpochMilliseconds,tag);
        assert(s.horizonNightMilliseconds>0&&s.horizonNightMilliseconds<DAY,tag);
      }
      if(event.basis?.operationOrder==='add-elapsed-margin-then-quantize'){
        const b=event.basis;assert.equal(b.adjustedBasisEpochMilliseconds,b.solarEpochMilliseconds+64000,tag);
        assert.equal(event.epochMilliseconds,Math.ceil(b.adjustedBasisEpochMilliseconds/MINUTE)*MINUTE,tag);
      }
      if(event.basis?.operationOrder==='physical-sunset-plus-elapsed-interval'){
        assert.equal(event.rawEpochMilliseconds,day.astronomy.events.maghrib.epochMilliseconds+event.basis.intervalMinutes*MINUTE,tag);
        assert([90,120].includes(event.basis.intervalMinutes),tag);
      }
    }else for(const key of ['rawEpochMilliseconds','epochMilliseconds','roundedEpochMilliseconds','utc','calendarUtc','localDate','calendarDate','time','seconds','secondsDate','dateOffset'])assert.equal(event[key],null,`${tag}/${key}`);
  }
  assert.equal(day.coverage.complete,EVENTS.every(name=>available(day.events[name])),label);
  assert.equal(day.coverage.prayerStartsComplete,PRAYERS.every(name=>available(day.events[name])),label);
  for(const [key,status] of [['estimatedEvents','estimated'],['unavailableEvents','unavailable'],['policyBlockedEvents','policy-blocked']])
    assert.deepEqual(day.coverage[key],EVENTS.filter(name=>day.events[name].status===status),`${label}/${key}`);
}
function scheduleBlank(){return{windows:0,sourceDaysWithOverlap:0,entries:0,missing:0,completeDays:0,unavailableDays:0,crossDayBlocked:0,checkedAdjacentPairs:0,missingReasons:{}};}
function checkSchedule(schedule,input,lookup){
  finiteTree(schedule,'schedule');assert.equal(schedule.days.length,input.dayCount);
  const seen=new Set(),entryMap=new Map(),missingMap=new Map();let previous=-Infinity;
  for(const entry of schedule.entries){
    assert(entry.epochMilliseconds>=previous);previous=entry.epochMilliseconds;
    assert.equal(entry.utc,new Date(entry.epochMilliseconds).toISOString());assert.equal(entry.role,'prayer-start-model');
    const key=`${entry.sourceDate}/${entry.event}`;assert(!seen.has(key));seen.add(key);entryMap.set(key,entry);
    const day=lookup(entry.sourceDate);assert(day);assert.equal(entry.epochMilliseconds,day.events[entry.event].epochMilliseconds);
  }
  for(const absent of schedule.missing){const key=`${absent.sourceDate}/${absent.event}`;assert(!seen.has(key));seen.add(key);missingMap.set(key,absent);}
  let pairs=0;
  for(let i=0;i<input.dayCount;i++){
    const date=shift(input.startDate,i),day=lookup(date),summary=schedule.days[i];assert.equal(summary.sourceDate,date);
    let n=0,m=0;
    for(const name of PRAYERS){
      const key=`${date}/${name}`;assert(seen.has(key));
      const e=entryMap.get(key),missing=missingMap.get(key);if(e)n++;else m++;
      if(!day){assert(!e);assert.equal(missing.reason,'solar-date-unavailable');}
      else if(available(day.events[name])){
        if(!e){assert.equal(name,'fajr');assert.equal(missing.reason,'cross-day-event-order-conflict');
          const priorIsha=lookup(shift(date,-1))?.events.isha;assert(priorIsha&&available(priorIsha));
          assert(priorIsha.epochMilliseconds>=day.events.fajr.epochMilliseconds);}
      }else{assert(!e);assert.equal(missing.status,day.events[name].status);assert.equal(missing.reason,day.events[name].reason);}
    }
    assert.equal(summary.entryCount,n);assert.equal(summary.missingCount,m);assert.equal(summary.complete,m===0);
    if(i){const isha=entryMap.get(`${shift(date,-1)}/isha`),fajr=entryMap.get(`${date}/fajr`);
      if(isha&&fajr){pairs++;assert(isha.epochMilliseconds<fajr.epochMilliseconds);}}
  }
  const c=schedule.coverage;assert.equal(c.expectedPrayerStarts,input.dayCount*5);assert.equal(c.prayerStartEntries,schedule.entries.length);
  assert.equal(c.missingPrayerStarts,schedule.missing.length);assert.equal(c.expectedPrayerStarts,c.prayerStartEntries+c.missingPrayerStarts);
  assert.equal(c.completeDays,schedule.days.filter(day=>day.complete).length);assert.equal(c.partialDays,schedule.days.filter(day=>day.status==='partial').length);
  assert.equal(c.unavailableDays,schedule.days.filter(day=>day.status==='unavailable').length);assert.equal(c.plannedDays,input.dayCount);
  assert.equal(schedule.complete,schedule.days.every(day=>day.complete));assert.equal(schedule.partial,!schedule.complete);
  return pairs;
}

export function verifySunniGrid({progress=()=>{}}={}){
  const bundle=verifiedBundle();assert.equal(process.versions.tz,bundle.version,'Use the pinned ICU wrapper');
  const modelPins=pins(),runnerSha256=hash(readFileSync(fileURLToPath(import.meta.url)));
  const methods=listSunniMethods(),profiles=listSunniProfiles();assert.equal(profiles.length,23);assert.equal(methods.length,8);
  const cache=new Map(),evaluated=blank();let rejectedPointDays=0,calendarCalls=0;
  function get(date,x,profile){
    const input={date,latitude:x.latitude,longitude:x.longitude,timeZone:x.timeZone,profile},key=JSON.stringify(input);
    if(cache.has(key))return cache.get(key);
    let day;
    try{day=calculateSunniDay(input);}catch(error){
      assert.equal(date,'2011-12-30');assert.equal(x.timeZone,'Pacific/Apia');
      assert(error instanceof RangeError&&/No apparent solar transit belongs to civil date/.test(error.message));
      rejectedPointDays++;cache.set(key,null);return null;
    }
    checkDay(day,input);accumulate(evaluated,day);cache.set(key,day);return day;
  }
  function schedule(x,profile,startDate,dayCount,total){
    const input={startDate,dayCount,latitude:x.latitude,longitude:x.longitude,timeZone:x.timeZone,profile};
    for(let i=0;i<dayCount;i++)get(shift(startDate,i),x,profile);
    const result=calculateSunniSchedule(input);calendarCalls++;
    const pairs=checkSchedule(result,input,date=>get(date,x,profile));
    total.windows++;total.sourceDaysWithOverlap+=dayCount;total.entries+=result.entries.length;total.missing+=result.missing.length;
    total.completeDays+=result.coverage.completeDays;total.unavailableDays+=result.coverage.unavailableDays;total.checkedAdjacentPairs+=pairs;
    for(const absent of result.missing){count(total.missingReasons,absent.reason);if(absent.reason==='cross-day-event-order-conflict')total.crossDayBlocked++;}
  }
  const annualReports=[];
  for(const x of annuals){
    const profile=methods.find(method=>method.id===x.method).defaultProfile,coverage=blank(),schedules=scheduleBlank();
    let comparableAdjacentPairs=0,rawCrossDayConflicts=0,minGap=null;
    for(let i=0;i<365;i++){
      const date=shift('2027-01-01',i),day=get(date,x,profile);assert(day);accumulate(coverage,day);
      const next=get(shift(date,1),x,profile);assert(next);
      if(available(day.events.isha)&&available(next.events.fajr)){
        comparableAdjacentPairs++;const gap=next.events.fajr.epochMilliseconds-day.events.isha.epochMilliseconds;
        minGap=minGap===null?gap:Math.min(minGap,gap);if(gap<=0)rawCrossDayConflicts++;
      }
    }
    for(let i=0;i<367;i+=30)schedule(x,profile,shift('2026-12-31',i),Math.min(31,367-i),schedules);
    annualReports.push({input:x,profile,coverage,crossDay:{comparableAdjacentPairs,rawCrossDayConflicts,minimumIshaToNextFajrSeconds:minGap===null?null:minGap/1000},schedules});
    progress(`${x.method}/${x.id}: 365 days and ${schedules.windows} overlap windows passed`);
  }
  const variants=[],boundaryReports=[];
  for(const profile of profiles){
    const x=profile.family==='jakim'?SUNNI_GRID_DECLARATION.variants.malaysiaPoint:SUNNI_GRID_DECLARATION.variants.globalPoint;
    const day=get(SUNNI_GRID_DECLARATION.variants.date,x,profile.id);const coverage=blank();accumulate(coverage,day);
    variants.push({profile:profile.id,input:{...x,date:SUNNI_GRID_DECLARATION.variants.date},coverage});
    const cases=profile.family==='jakim'?malaysia:boundaries;
    for(const sample of cases){
      const selected=get(sample.date,sample,profile.id),coverage=blank(),schedules=scheduleBlank();
      if(selected)accumulate(coverage,selected);else assert.equal(sample.expectedRejection,'no-transit-civil-date');
      schedule(sample,profile.id,sample.windowStart??sample.date,sample.windowDays??3,schedules);
      boundaryReports.push({profile:profile.id,input:sample,expectedOwnershipRejection:!selected,coverage,schedules});
    }
    progress(`${profile.id}: variant and ${cases.length} boundary cases passed`);
  }
  assert.deepEqual(pins(),modelPins,'Implementation changed during this run');assert.equal(hash(readFileSync(fileURLToPath(import.meta.url))),runnerSha256);
  return{schema:'sunni-invariant-grid-report/v1',status:'PASS',declarationSha256:SUNNI_GRID_DECLARATION_SHA256,declaration:SUNNI_GRID_DECLARATION,
    runnerSha256,implementationPins:modelPins,runtime:{node:process.versions.node,icu:process.versions.icu,cldr:process.versions.cldr,tz:process.versions.tz},
    scope:'Synthetic public demonstration points and offline implementation invariants; not an independent physical oracle, observed accuracy test or publisher calendar comparison.',
    accounting:{annualCases:annualReports.length,annualOwnedPointDays:annualReports.length*365,annualOwnedFields:annualReports.length*365*6,
      newVariants:variants.length,boundaryCases:boundaryReports.length,uniqueCalculatedPointDays:evaluated.pointDays,uniqueExpectedOwnershipRejections:rejectedPointDays,
      scheduleCalls:calendarCalls,uniqueDayCoverage:evaluated,scheduleCountsIncludeOverlappingDates:true},
    annualReports,variants,boundaryReports};
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
  const mode=process.argv[2]??'--check';
  assert(process.argv.length<=3&&['--write','--check'].includes(mode),
    'Usage: node core/timezones/with-tzdata.mjs scripts/verify-sunni-grid.mjs [--check|--write] (default: non-writing check)');
  const started=performance.now(),report=verifySunniGrid({progress:message=>process.stderr.write(message+'\n')});
  if(mode==='--write')writeFileSync(REPORT,JSON.stringify(report,null,2)+'\n');
  else assert.deepEqual(report,JSON.parse(readFileSync(REPORT,'utf8')),'Stored report differs from the declared replay');
  console.log(JSON.stringify({status:report.status,mode,declarationSha256:report.declarationSha256,
    annualCases:report.accounting.annualCases,annualOwnedPointDays:report.accounting.annualOwnedPointDays,
    newVariants:report.accounting.newVariants,boundaryCases:report.accounting.boundaryCases,
    uniqueCalculatedPointDays:report.accounting.uniqueCalculatedPointDays,expectedOwnershipRejections:report.accounting.uniqueExpectedOwnershipRejections,
    scheduleCalls:report.accounting.scheduleCalls,seconds:(performance.now()-started)/1000},null,2));
}
