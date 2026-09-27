import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {dirname,resolve} from 'node:path';
import {calculateDiyanetLocalDay,calculateDiyanetLocalSchedule} from '../core/local/diyanet-local.mjs';
import {calculateLocalSolarDay} from '../core/local/solar.mjs';
import {calculateLocalDay,LOCAL_DIYANET_SPA_PROFILE} from '../core/local/index.mjs';
import {buildNorthernContext} from '../core/local/northern.mjs';
import {admitDiyanetWinterContext} from '../core/local/diyanet-winter.mjs';
import {verifiedBundle} from '../core/timezones/bundle.mjs';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const PLAN=resolve(ROOT,'core/local/verification/diyanet-local-plan-2026-09-27.md');
const IMPL=resolve(ROOT,'core/local/diyanet-local.mjs');
const REPORT=resolve(ROOT,'core/local/verification/diyanet-local-2026-09-27.json');
const MIN=60_000,DAY=86_400_000,TOL=1_000,FACTOR=11/8,WIDTH=20*MIN;
const PROFILE='diyanet-local-seasonal-spa-v1';
const CITIES=[
  {id:'frankfurt',latitude:50.1109,longitude:8.6821,timeZone:'Europe/Berlin'},
  {id:'berlin',latitude:52.52,longitude:13.405,timeZone:'Europe/Berlin'},
  {id:'bordeaux',latitude:44.8378,longitude:-0.5792,timeZone:'Europe/Paris'},
  {id:'edinburgh',latitude:55.9533,longitude:-3.1883,timeZone:'Europe/London'},
];
const CONTROLS=[
  {id:'oslo',latitude:59.9139,longitude:10.7522,timeZone:'Europe/Oslo'},
  {id:'tromso',latitude:69.6492,longitude:18.9553,timeZone:'Europe/Oslo'},
  {id:'istanbul',latitude:41.0082,longitude:28.9784,timeZone:'Europe/Istanbul'},
];
const dateOf=t=>new Date(t).toISOString().slice(0,10);
function nextFloat64(value,step){
  const view=new DataView(new ArrayBuffer(8));view.setFloat64(0,value,false);
  let bits=view.getBigUint64(0,false);
  bits+=BigInt(value>=0?step:-step);
  view.setBigUint64(0,bits,false);return view.getFloat64(0,false);
}
const yearDates=y=>Array.from({length:(Date.UTC(y+1,0,1)-Date.UTC(y,0,1))/DAY},(_,i)=>dateOf(Date.UTC(y,0,1)+i*DAY));
const inputFor=(date,c)=>({date,...c,profile:PROFILE});
const locationOf=({id,...location})=>location;
const solarCache=new Map();
const NUMERICAL_FILES=[
  'scripts/verify-diyanet-local.mjs','core/local/verification/diyanet-local-plan-2026-09-27.md',
  'core/local/diyanet-local.mjs','core/local/diyanet-winter.mjs','core/local/index.mjs','core/local/profiles.mjs',
  'core/local/schedule.mjs','core/local/northern.mjs','core/local/summer.mjs','core/local/selection.mjs',
  'core/local/night-fraction.mjs','core/local/solar.mjs','core/input.mjs','core/astronomy/continuous-solver.mjs',
  'core/astronomy/solar-usno-v2.mjs','core/astronomy/spa-point.mjs','core/astronomy/spa-coefficients.json',
  'core/timezones/bundle.mjs','core/timezones/manifest.json',
];
function dependencyClosure(){
  const manifest=JSON.parse(readFileSync(resolve(ROOT,'core/timezones/manifest.json'),'utf8'));
  const files=[...NUMERICAL_FILES,...manifest.files.map(x=>`core/timezones/${x.file}`)].sort();
  const hashes=Object.fromEntries(files.map(path=>[path,sha(resolve(ROOT,path))]));
  return{files:files.length,hashes,closureSha256:createHash('sha256').update(JSON.stringify(hashes)).digest('hex')};
}
function solar(date,c){
  const key=`${date}|${c.latitude}|${c.longitude}|${c.timeZone}`;
  if(!solarCache.has(key))solarCache.set(key,calculateLocalSolarDay({date,...locationOf(c),fajrAngleDegrees:18,
    ishaAngleDegrees:c.latitude>=44.5?16:17,
    asrShadowFactor:1,horizonDepressionDegrees:50/60,solarModel:'spa'}));
  return solarCache.get(key);
}
function close(actual,expected,label,tolerance=TOL){
  assert.ok(Number.isFinite(actual)&&Number.isFinite(expected),`${label}: expected finite values`);
  const delta=Math.abs(actual-expected);assert.ok(delta<=tolerance,`${label}: ${delta} ms > ${tolerance} ms`);return delta;
}
function sha(path){return createHash('sha256').update(readFileSync(path)).digest('hex');}
function selectedSolar(solarDay,event){
  const margin={fajr:0,sunrise:-7,dhuhr:5,asr:4,maghrib:7,isha:0}[event];
  const value=solarDay.events[event];
  return value.status==='calculated'?value.epochMilliseconds+margin*MIN:null;
}
function smooth(event,raw,candidate){
  if(raw===null)return{selected:candidate,weight:1,mode:'night-fraction',status:'estimated'};
  if(event==='isha'){
    if(raw<=candidate-WIDTH)return{selected:raw,weight:0,mode:'ordinary',status:'calculated'};
    if(raw>=candidate)return{selected:candidate,weight:1,mode:'night-fraction',status:'estimated'};
    const x=(raw-candidate+WIDTH)/WIDTH,w=x*x*(3-2*x);
    return{selected:raw+(candidate-raw)*w,weight:w,mode:'transition',status:'estimated'};
  }
  if(raw>=candidate+WIDTH)return{selected:raw,weight:0,mode:'ordinary',status:'calculated'};
  if(raw<=candidate)return{selected:candidate,weight:1,mode:'night-fraction',status:'estimated'};
  const x=(candidate+WIDTH-raw)/WIDTH,w=x*x*(3-2*x);
  return{selected:raw+(candidate-raw)*w,weight:w,mode:'transition',status:'estimated'};
}
function assertSame(a,b,label){assert.equal(a,b,label);}

function verifyWinter(city,year){
  const input={year,...locationOf(city),solarModel:'spa'};
  const northern=buildNorthernContext(input),admission=admitDiyanetWinterContext(northern);
  assert.equal(admission.sourceContextReason,'annual-five-hour-horizon-gate-not-met',`${city.id} ${year}: explicit winter trigger`);
  const dates=[dateOf(Date.UTC(year-1,11,31)),...yearDates(year),dateOf(Date.UTC(year+1,0,1))];
  const sourceRaw=new Map(dates.map(date=>[date,solar(date,city)]));
  const missing=yearDates(year).filter(date=>sourceRaw.get(date).events.fajr.status!=='calculated');
  for(const date of missing){
    const e=sourceRaw.get(date).events.fajr;
    assert.equal(e.status,'unavailable',`${city.id} ${date}: Fajr absence status`);
    assert.equal(e.reason,'sun-continuously-above-threshold',`${city.id} ${date}: Fajr absence is not a tangent`);
    assert.equal(e.diagnosticStatus,'continuously-above',`${city.id} ${date}: continuous-above diagnostic`);
  }
  const missingIsha=yearDates(year).filter(date=>sourceRaw.get(date).events.isha.status!=='calculated');
  for(const date of missingIsha){
    const e=sourceRaw.get(date).events.isha;
    assert.equal(e.status,'unavailable',`${city.id} ${date}: Isha absence status`);
    assert.equal(e.reason,'sun-continuously-above-threshold',`${city.id} ${date}: Isha absence is not a tangent`);
    assert.equal(e.diagnosticStatus,'continuously-above',`${city.id} ${date}: Isha continuous-above diagnostic`);
  }
  const gapIsContiguous=missing.length===0||yearDates(year).slice(yearDates(year).indexOf(missing[0]),yearDates(year).indexOf(missing.at(-1))+1).every(d=>missing.includes(d));
  assert.ok(gapIsContiguous,`${city.id} ${year}: winter source Fajr missing window contiguous`);
  const anchorDate=missing.length?dateOf(Date.parse(`${missing[0]}T00:00:00Z`)-DAY):`${year}-06-21`;
  const anchorF=sourceRaw.get(anchorDate)?.events.fajr.epochMilliseconds;
  const anchorM=selectedSolar(sourceRaw.get(dateOf(Date.parse(`${anchorDate}T00:00:00Z`)-DAY)),'maghrib');
  const anchorR=selectedSolar(sourceRaw.get(anchorDate),'sunrise');
  const q=(anchorF-anchorM)/(3*(anchorR-anchorM));
  close(northern.metadata.q,q,`${city.id} ${year}: independently anchored annual q`,1e-10);
  const nights=[];
  for(let i=0;i<dates.length-1;i++){
    const start=dates[i],end=dates[i+1],a=sourceRaw.get(start),b=sourceRaw.get(end);
    const M=selectedSolar(a,'maghrib'),R=selectedSolar(b,'sunrise'),F=b.events.fajr.status==='calculated'?b.events.fajr.epochMilliseconds:null;
    const H=R-M,S=F===null?q*H:(F-M)/3;
    assert.ok([M,R,H,S].every(Number.isFinite)&&M<R&&H>0&&S>0&&S<H,`${city.id} ${start}: finite ordered annual horizon candidate`);
    const iEst=M+S,fUpper=R-S;
    nights.push({start,end,M,R,H,F,S,iEst,fUpper,
      ishaPhase:(iEst-a.transit.epochMilliseconds)/MIN,
      fajrPhase:(fUpper-b.transit.epochMilliseconds)/MIN});
  }
  const annualIsha=Math.min(...nights.map(n=>n.ishaPhase-20));
  const annualFajr=Math.max(...nights.map(n=>n.fajrPhase+20));
  close(northern.metadata.annualIshaTransitionLowerPhaseMinutes,annualIsha,`${city.id} ${year}: independent annual Isha envelope`,1e-6);
  close(northern.metadata.annualFajrTransitionUpperPhaseMinutes,annualFajr,`${city.id} ${year}: independent annual Fajr envelope`,1e-6);
  const summaries=[],admitted={fajr:0,isha:0};
  for(const date of yearDates(year)){
    const source=sourceRaw.get(date),nextDate=dateOf(Date.parse(`${date}T00:00:00Z`)+DAY),previousDate=dateOf(Date.parse(`${date}T00:00:00Z`)-DAY);
    const out=calculateDiyanetLocalDay(inputFor(date,locationOf(city))),provided=out.calculation.winterAdmission;
    const strict=calculateLocalDay({date,...locationOf(city),profile:LOCAL_DIYANET_SPA_PROFILE});
    assert.equal(provided.policy,'local-daily-horizon-envelope-v1');
    assert.equal(provided.sourceContextReason,northern.reason);
    assert.equal(out.calculation.seasonalPolicy.status,'blocked',`${city.id} ${date}: failed annual gate blocks summer selector`);
    const perEvent={};
    for(const name of ['fajr','isha']){
      const rawEvent=source.events[name],raw=rawEvent.status==='calculated'?rawEvent.epochMilliseconds:null;
      const night=name==='fajr'?nights.find(n=>n.start===previousDate):nights.find(n=>n.start===date);
      const startRaw=sourceRaw.get(night.start),endRaw=sourceRaw.get(night.end);
      const dayMargins=x=>({rawDay:(x.events.maghrib.epochMilliseconds-x.events.sunrise.epochMilliseconds)/MIN,
        selectedDay:(selectedSolar(x,'maghrib')-selectedSolar(x,'sunrise'))/MIN});
      const da=dayMargins(startRaw),db=dayMargins(endRaw);
      const rawNight=(endRaw.events.sunrise.epochMilliseconds-startRaw.events.maghrib.epochMilliseconds)/MIN;
      const selectedNight=(selectedSolar(endRaw,'sunrise')-selectedSolar(startRaw,'maghrib'))/MIN;
      const horizon=[da.rawDay,da.selectedDay,db.rawDay,db.selectedDay,rawNight,selectedNight];
      const horizonOk=horizon.every(v=>Number.isFinite(v)&&v>300);
      const M=selectedSolar(startRaw,'maghrib'),R=selectedSolar(endRaw,'sunrise'),inside=raw!==null&&M<raw&&raw<R;
      const phase=raw===null?null:(raw-source.transit.epochMilliseconds)/MIN;
      const directBound=name==='fajr'?night.fUpper+20*MIN:night.iEst-20*MIN;
      const directOk=raw!==null&&(name==='fajr'?raw>directBound:raw<directBound);
      const annualBound=name==='fajr'?annualFajr:annualIsha;
      const annualOk=phase!==null&&(name==='fajr'?phase>annualBound:phase<annualBound);
      const followingFajrReal=night.F!==null;
      const priorFajrOk=name==='fajr'||(followingFajrReal&&raw!==null&&raw<night.F);
      const expected=horizonOk&&inside&&directOk&&annualOk&&priorFajrOk;
      const proof=provided.day[name];
      assert.equal(proof.eligible,expected,`${city.id} ${date} ${name}: independently reconstructed winter admission`);
      assert.equal(proof.rawEpochMilliseconds,raw,`${city.id} ${date} ${name}: raw-event dependency`);
      if(proof.proof){
        for(const [i,key] of ['startRawDayMinutes','startSelectedDayMinutes','endRawDayMinutes','endSelectedDayMinutes','rawNightMinutes','selectedNightMinutes'].entries())
          close(proof.proof.horizons[key],horizon[i],`${city.id} ${date} ${name}: ${key}`,1e-7);
        assert.equal(proof.proof.horizons.strictlyAboveBound,horizonOk,`${city.id} ${date} ${name}: strict 300-minute gates`);
        assert.equal(proof.proof.horizons.matchingNight,
          Math.abs(horizon[5]-night.H/MIN)<1e-8,
          `${city.id} ${date} ${name}: adjoining night identity`);
        assert.equal(proof.proof.horizons.eligible,horizonOk,`${city.id} ${date} ${name}: all six horizon gates`);
        assert.equal(proof.proof.insideSelectedNight,inside,`${city.id} ${date} ${name}: selected-night envelope`);
        assert.equal(proof.proof.outsideAnnualEnvelope,annualOk,`${city.id} ${date} ${name}: annual phase envelope`);
        assert.equal(proof.proof.outsideDirectTransition,directOk,`${city.id} ${date} ${name}: direct transition envelope`);
      }
      if(expected){admitted[name]++;assert.equal(out.events[name].status,'calculated',`${city.id} ${date} ${name}: admitted event remains real`);
        close(out.events[name].rawEpochMilliseconds,raw,`${city.id} ${date} ${name}: released raw event`);}
      else{
        assert.equal(out.events[name].status,strict.events[name].status,`${city.id} ${date} ${name}: denied admission preserves strict status`);
        assert.equal(out.events[name].rawEpochMilliseconds,strict.events[name].rawEpochMilliseconds,`${city.id} ${date} ${name}: denied admission preserves strict instant`);
      }
      perEvent[name]={eligible:expected,reason:proof.reason,raw:proof.rawEpochMilliseconds,horizonMinutes:horizon,
        annualEnvelope:annualOk,directEnvelope:directOk,insideSelectedNight:inside};
    }
    summaries.push({date,events:perEvent});
  }
  assert.ok(admitted.fajr>0&&admitted.isha>0,`${city.id} ${year}: winter control must demonstrate both real-event releases`);
  return{city:city.id,year,annualContextStatus:northern.status,annualContextReason:northern.reason,
    originalAnnualContextRemainsBlocked:northern.status==='blocked',ratio:q,anchorDate,
    ratioNumeratorMilliseconds:anchorF-anchorM,ratioDenominatorMilliseconds:3*(anchorR-anchorM),
    annualIshaTransitionLowerPhaseMinutes:annualIsha,annualFajrTransitionUpperPhaseMinutes:annualFajr,
    rawMissingFajrDates:missing,rawMissingIshaDates:missingIsha,eligible:admitted,
    eligibleDatesByEvent:Object.fromEntries(['fajr','isha'].map(e=>[e,summaries.filter(s=>s.events[e].eligible).map(s=>s.date)])),
    verificationDenominators:{ownedDays:yearDates(year).length,annualPaddedNightCandidates:nights.length,
      winterEventAdmissionChecks:2*yearDates(year).length,horizonGateComparisons:6*2*yearDates(year).length},days:summaries};
}

function buildIndependentYear(year,city){
  const dates=[dateOf(Date.UTC(year-1,11,31)),...yearDates(year),dateOf(Date.UTC(year+1,0,1))];
  const raw=new Map(dates.map(date=>[date,solar(date,city)]));
  const owned=yearDates(year);
  const missing=owned.filter(date=>raw.get(date).events.fajr.status!=='calculated');
  for(const date of missing){
    const event=raw.get(date).events.fajr;
    assert.equal(event.status,'unavailable',`${city.id} ${date}: Fajr absence status`);
    assert.equal(event.reason,'sun-continuously-above-threshold',`${city.id} ${date}: only continuous-above absence is admissible`);
    assert.equal(event.diagnosticStatus,'continuously-above',`${city.id} ${date}: continuous-above diagnostic`);
  }
  for(const date of owned.filter(date=>raw.get(date).events.isha.status!=='calculated')){
    const event=raw.get(date).events.isha;
    assert.equal(event.status,'unavailable',`${city.id} ${date}: Isha absence status`);
    assert.equal(event.reason,'sun-continuously-above-threshold',`${city.id} ${date}: Isha absence is not a tangent`);
    assert.equal(event.diagnosticStatus,'continuously-above',`${city.id} ${date}: Isha continuous-above diagnostic`);
  }
  const contiguous=missing.length===0||owned.slice(owned.indexOf(missing[0]),owned.indexOf(missing.at(-1))+1).every(d=>missing.includes(d));
  assert.ok(contiguous,`${city.id} ${year}: raw Fajr absence must form one contiguous interval`);
  const anchor=missing.length?dateOf(Date.parse(`${missing[0]}T00:00:00Z`)-DAY):`${year}-06-21`;
  const anchorSolar=raw.get(anchor),previousDate=dateOf(Date.parse(`${anchor}T00:00:00Z`)-DAY),previous=raw.get(previousDate);
  assert.ok(anchorSolar&&previous,`${city.id} ${year}: raw anchor and preceding dusk`);
  const F=anchorSolar.events.fajr.epochMilliseconds,M=selectedSolar(previous,'maghrib');
  const R=selectedSolar(anchorSolar,'sunrise'),H=R-M;
  assert.ok([F,M,R,H].every(Number.isFinite)&&F>M&&F<R,`${city.id} ${year}: valid independent q anchor`);
  const q=(F-M)/(3*H);
  assert.ok(q>0&&q<1/3,`${city.id} ${year}: q in physical range`);
  return{year,city,dates,raw,owned,missing,anchor,q};
}

function verifyYear(context){
  const {year,city,dates,raw,owned,missing,anchor,q}=context;
  const scheduleDays=[],scheduleEntries=[];
  for(let i=0;i<owned.length;i+=31){
    const chunk=calculateDiyanetLocalSchedule({startDate:owned[i],dayCount:Math.min(31,owned.length-i),...locationOf(city),profile:PROFILE});
    scheduleDays.push(...chunk.days);
    scheduleEntries.push(...chunk.entries);
  }
  assert.equal(scheduleDays.length,owned.length,`${city.id} ${year}: schedule count`);
  assert.equal(new Set(scheduleDays.map(day=>day.sourceDate)).size,owned.length,`${city.id} ${year}: duplicate schedule date`);
  const byDate=new Map(owned.map(date=>[date,calculateDiyanetLocalDay(inputFor(date,locationOf(city)))]));
  const baseByDate=new Map(owned.map(date=>[date,calculateLocalDay({date,...locationOf(city),profile:LOCAL_DIYANET_SPA_PROFILE})]));
  assert.equal(byDate.size,owned.length,`${city.id} ${year}: direct day count`);
  const entriesByDate=new Map();
  for(const entry of scheduleEntries){const list=entriesByDate.get(entry.sourceDate)??[];list.push(entry);entriesByDate.set(entry.sourceDate,list);}
  for(const date of owned){
    const day=byDate.get(date),summary=scheduleDays.find(x=>x.sourceDate===date),entries=entriesByDate.get(date)??[];
    const prayerEvents=['fajr','dhuhr','asr','maghrib','isha'].filter(e=>day.events[e].role==='prayer-start-model'
      &&['calculated','estimated'].includes(day.events[e].status));
    assert.ok(summary,`${city.id} ${date}: schedule summary exists`);
    assert.equal(summary.entryCount,prayerEvents.length,`${city.id} ${date}: schedule event count`);
    assert.equal(summary.complete,prayerEvents.length===5,`${city.id} ${date}: schedule completeness`);
    assert.equal(entries.length,prayerEvents.length,`${city.id} ${date}: entries match daily output`);
    for(const entry of entries){
      const event=day.events[entry.event];assert.ok(prayerEvents.includes(entry.event),`${city.id} ${date} ${entry.event}: expected schedule event`);
      close(entry.rawEpochMilliseconds,event.rawEpochMilliseconds,`${city.id} ${date} ${entry.event}: schedule raw value`);
      assert.equal(entry.epochMilliseconds,event.epochMilliseconds,`${city.id} ${date} ${entry.event}: schedule rounded instant`);
    }
  }
  const paddedDates=context.dates;
  const annualGate=paddedDates.every(date=>{
    const d=raw.get(date),dayRaw=(d.events.maghrib.epochMilliseconds-d.events.sunrise.epochMilliseconds)/MIN;
    const daySelected=(selectedSolar(d,'maghrib')-selectedSolar(d,'sunrise'))/MIN;
    return dayRaw>300&&daySelected>300;
  })&&paddedDates.slice(0,-1).every((date,i)=>{
    const next=raw.get(paddedDates[i+1]),start=raw.get(date);
    return(next.events.sunrise.epochMilliseconds-start.events.maghrib.epochMilliseconds)/MIN>300
      &&(selectedSolar(next,'sunrise')-selectedSolar(start,'maghrib'))/MIN>300;
  });
  const rows=[],count={complete:0,estimated:{fajr:0,isha:0},calculated:{fajr:0,isha:0},unavailable:{fajr:0,isha:0},blocked:{fajr:0,isha:0}};
  let maxCandidateDelta=0,maxSelectedDelta=0,maxQDelta=0,maxOtherDelta=0;
  const phase={fajr:[],isha:[]};
  for(const date of owned){
    const out=byDate.get(date);assert.ok(out,`${city.id} ${date}: missing schedule day`);
    const metadata=out.calculation.seasonalPolicy;
    assert.equal(metadata.metadata.annualHorizonGatePassed,annualGate,`${city.id} ${date}: independent annual horizon gate`);
    close(metadata.metadata.q,q,`${city.id} ${date}: annual q`,1e-9);maxQDelta=Math.max(maxQDelta,Math.abs(metadata.metadata.q-q));
    assertSame(metadata.metadata.anchorDate,anchor,`${city.id} ${date}: q anchor`);
    assertSame(metadata.status,'available',`${city.id} ${date}: annual context`);
    const prev=dateOf(Date.parse(`${date}T00:00:00Z`)-DAY),next=dateOf(Date.parse(`${date}T00:00:00Z`)+DAY);
    const s=raw.get(date),sp=raw.get(prev),sn=raw.get(next);assert.ok(sp&&sn,`${city.id} ${date}: padding solar rows`);
    for(const e of ['fajr','sunrise','dhuhr','asr','maghrib','isha']){
      const base=baseByDate.get(date).events[e];
      if(['calculated','estimated'].includes(base.status))assert.deepEqual(out.events[e],base,
        `${city.id} ${date} ${e}: every strict-available event remains unchanged`);
    }
    for(const e of ['sunrise','dhuhr','asr','maghrib']){
      const expected=selectedSolar(s,e),actual=out.events[e].rawEpochMilliseconds;
      if(expected===null){assert.equal(actual,null,`${city.id} ${date} ${e}: absent raw event`);}
      else maxOtherDelta=Math.max(maxOtherDelta,close(actual,expected,`${city.id} ${date} ${e}: independent published-margin event`));
    }
    for(const e of ['fajr','isha']){
      const rawEpoch=s.events[e].status==='calculated'?s.events[e].epochMilliseconds:null;
      const startDate=e==='fajr'?prev:date,endDate=e==='fajr'?date:next;
      const dusk=selectedSolar(raw.get(startDate),'maghrib'),dawn=selectedSolar(raw.get(endDate),'sunrise');
      assert.ok(Number.isFinite(dusk)&&Number.isFinite(dawn)&&dawn>dusk,`${city.id} ${date} ${e}: selected night endpoints`);
      const H=dawn-dusk,candidate=e==='isha'?dusk+q*H:dawn-FACTOR*q*H;
      const expected=smooth(e,rawEpoch,candidate),trace=metadata.day[e],actual=out.events[e];
      assert.ok(trace,`${city.id} ${date} ${e}: trace missing`);
      maxCandidateDelta=Math.max(maxCandidateDelta,close(trace.candidateEpochMilliseconds,candidate,`${city.id} ${date} ${e}: independent candidate`));
      maxSelectedDelta=Math.max(maxSelectedDelta,close(trace.selectedEpochMilliseconds,expected.selected,`${city.id} ${date} ${e}: independent smoothstep`));
      close(trace.weight,expected.weight,`${city.id} ${date} ${e}: independent weight`,1e-10);
      assertSame(trace.mode,expected.mode,`${city.id} ${date} ${e}: selection mode`);
      assertSame(trace.status,expected.status,`${city.id} ${date} ${e}: trace status`);
      // Strict point-profile events stay untouched when their physical raw
      // crossing exists. The independent smooth selector is exposed as a
      // trace, and is rendered only when the strict event is unavailable.
      const baseEvent=baseByDate.get(date).events[e];
      const baseAvailable=['calculated','estimated'].includes(baseEvent.status);
      const winterEvent=out.calculation.winterAdmission?.day?.[e];
      const useSummer=!baseAvailable&&metadata.status==='available'&&['calculated','estimated'].includes(trace.status);
      const useWinter=!baseAvailable&&!useSummer&&winterEvent?.eligible===true;
      const outputInstant=baseAvailable?baseEvent.rawEpochMilliseconds:useSummer?expected.selected:useWinter?rawEpoch:null;
      const outputStatus=baseAvailable?baseEvent.status:useSummer?expected.status:useWinter?'calculated':baseEvent.status;
      assertSame(actual.status,outputStatus,`${city.id} ${date} ${e}: event status`);
      if(outputInstant===null)assert.equal(actual.rawEpochMilliseconds,null,`${city.id} ${date} ${e}: null event remains null`);
      else close(actual.rawEpochMilliseconds,outputInstant,`${city.id} ${date} ${e}: rendered event`);
      if(['calculated','estimated'].includes(outputStatus)){
        const expectedClass=baseAvailable?baseEvent.ruleEvidence.classification:outputStatus==='estimated'?'software-estimate':'published-criterion';
        assertSame(actual.ruleEvidence.classification,expectedClass,`${city.id} ${date} ${e}: provenance`);
      }
      count[outputStatus==='policy-blocked'?'blocked':outputStatus][e]++;
      if(['calculated','estimated'].includes(outputStatus)){
        const transit=s.transit.epochMilliseconds;
        phase[e].push({date,event:e,phaseMinutes:(outputInstant-transit)/MIN});
      }
    }
    const order=['fajr','sunrise','dhuhr','asr','maghrib','isha'];
    const vals=order.map(e=>out.events[e].rawEpochMilliseconds);
    const complete=vals.every(Number.isFinite)&&vals.every((v,i)=>i===0||vals[i-1]<v);
    if(complete)count.complete++;
    for(let i=1;i<vals.length;i++)if(Number.isFinite(vals[i-1])&&Number.isFinite(vals[i]))assert.ok(vals[i-1]<vals[i],`${city.id} ${date}: order ${order[i-1]} < ${order[i]}`);
    rows.push({date,status:metadata.status,reason:metadata.reason,statusByEvent:Object.fromEntries(
      ['fajr','sunrise','dhuhr','asr','maghrib','isha'].map(e=>[e,out.events[e].status])),events:Object.fromEntries(['fajr','isha'].map(e=>{
      const t=metadata.day[e];return[e,{status:out.events[e].status,outputEpochMilliseconds:out.events[e].rawEpochMilliseconds,
        outputReason:out.events[e].reason,mode:t.mode,raw:t.rawEpochMilliseconds,candidate:t.candidateEpochMilliseconds,
        seasonalSelected:t.selectedEpochMilliseconds,weight:t.weight,reason:t.reason}];
    }))});
  }
  const changes=Object.values(phase).flatMap(series=>series.slice(1).flatMap((item,i)=>
    Date.parse(item.date)-Date.parse(series[i].date)===DAY?[{event:item.event,from:series[i].date,to:item.date,
      minutes:item.phaseMinutes-series[i].phaseMinutes}]:[]));
  const maxPhaseChange=changes.reduce((best,item)=>Math.abs(item.minutes)>Math.abs(best.minutes)?item:best,{minutes:0});
  assert.ok(Math.abs(maxPhaseChange.minutes)<=10,`${city.id} ${year}: phase delta ${maxPhaseChange.minutes} minutes > 10`);
  const expectedMissing=missing;
  assert.equal(rows.filter(r=>r.events.fajr.status==='estimated'&&r.events.fajr.raw===null).length,expectedMissing.length,
    `${city.id} ${year}: all raw-absent Fajr rows estimated`);
  assert.equal(count.calculated.fajr+count.estimated.fajr+count.unavailable.fajr+count.blocked.fajr,owned.length);
  assert.equal(count.calculated.isha+count.estimated.isha+count.unavailable.isha+count.blocked.isha,owned.length);
  const anchorF=raw.get(anchor).events.fajr.epochMilliseconds,anchorM=selectedSolar(raw.get(dateOf(Date.parse(`${anchor}T00:00:00Z`)-DAY)),'maghrib');
  const anchorR=selectedSolar(raw.get(anchor),'sunrise');
  const baselineDays=[...baseByDate.values()];
  const baseline={completeDays:baselineDays.filter(d=>d.coverage.complete).length,
    prayerStartsCompleteDays:baselineDays.filter(d=>d.coverage.prayerStartsComplete).length,
    newlySuppliedEvents:Object.fromEntries(['fajr','isha'].map(e=>[e,owned.filter(date=>
      !['calculated','estimated'].includes(baseByDate.get(date).events[e].status)
      &&['calculated','estimated'].includes(byDate.get(date).events[e].status)).length]))};
  const neighborDay=date=>calculateDiyanetLocalDay(inputFor(date,locationOf(city)));
  const crossNight=[];
  for(const date of [dateOf(Date.UTC(year-1,11,31)),...owned]){
    const nextDate=dateOf(Date.parse(`${date}T00:00:00Z`)+DAY);
    const a=byDate.get(date)??neighborDay(date),b=byDate.get(nextDate)??neighborDay(nextDate);
    const seq=['maghrib','isha','fajr','sunrise'].map(name=>(name==='maghrib'||name==='isha'?a.events[name]:b.events[name]).rawEpochMilliseconds);
    const complete=seq.every(Number.isFinite);
    if(complete)assert.ok(seq[0]<seq[1]&&seq[1]<seq[2]&&seq[2]<seq[3],`${city.id} ${date}: cross-night Maghrib < Isha < Fajr < sunrise`);
    crossNight.push({startDate:date,nextDate,complete,events:seq});
  }
  return{city:city.id,year,q,anchor,ratioDefinition:'(anchor Fajr - preceding selected Maghrib) / (3 × selected anchor night)',
    ratioNumeratorMilliseconds:anchorF-anchorM,ratioDenominatorMilliseconds:3*(anchorR-anchorM),
    ratioAnchorCount:1,ratioExcludedCandidateNightCount:0,ratioPopulation:'one source-defined anchor night, not an annual mean',
    anchorSelectedNightMinutes:(anchorR-anchorM)/MIN,annualHorizonGatePassed:annualGate,
    sourceMissingFajrDates:missing,counts:count,maxCandidateDeltaMilliseconds:maxCandidateDelta,
    maxSelectedDeltaMilliseconds:maxSelectedDelta,maxQDelta,maxOtherEventDeltaMilliseconds:maxOtherDelta,
    verificationDenominators:{ownedDays:owned.length,twilightTraceComparisons:2*owned.length,
      unchangedEventMarginComparisons:4*owned.length,adjacentPhaseComparisons:changes.length,
      crossNightChecks:crossNight.length,completeCrossNights:crossNight.filter(n=>n.complete).length},
    missingDatesByEvent:Object.fromEntries(['fajr','sunrise','dhuhr','asr','maghrib','isha'].map(e=>[e,
      rows.filter(row=>['unavailable','policy-blocked'].includes(row.statusByEvent[e])).map(row=>row.date)])),
    maxAdjacentEventPhaseChange:maxPhaseChange,phaseChanges:changes,phaseSeries:phase,
    baseline, crossNight:{completeNights:crossNight.filter(n=>n.complete).length,checkedNights:crossNight.length,rows:crossNight},rows};
}

function verifyBoundary(){
  const boundary=[];
  for(const lat of [nextFloat64(44.5,-1),44.5,nextFloat64(44.5,1)]){
    const d=calculateDiyanetLocalDay({date:'2027-06-21',latitude:lat,longitude:0,timeZone:'UTC',profile:PROFILE});
    boundary.push({latitude:lat,status:d.calculation.seasonalPolicy.status,reason:d.calculation.seasonalPolicy.reason,
      fajr:d.events.fajr.status,isha:d.events.isha.status});
  }
  assert.equal(boundary[0].status,'blocked');assert.equal(boundary[1].status,'available');assert.equal(boundary[2].status,'available');
  return boundary;
}

export function verifyDiyanetLocal(){
  const planBytes=readFileSync(PLAN),summaries=[],beforeClosure=dependencyClosure(),tzBundle=verifiedBundle();
  assert.equal(process.versions.tz,tzBundle.version,'Verifier must run under the repository-pinned timezone bundle');
  mkdirSync(dirname(REPORT),{recursive:true});
  writeFileSync(REPORT,JSON.stringify({schema:'diyanet-local-independent-behavior-verification/v1',result:'RUNNING',
    startedAt:new Date().toISOString(),initialDependencyClosure:beforeClosure},null,2)+'\n');
  const boundary=verifyBoundary();
  console.error('[verify] 44.5-degree immediate-neighbor boundary passed');
  const winter=verifyWinter(CONTROLS[0],2027);
  console.error(`[verify] Oslo 2027 independent winter proof passed (${winter.eligible.fajr} Fajr, ${winter.eligible.isha} Isha releases)`);
  for(const city of CITIES)for(const year of [2026,2027,2028]){
    summaries.push(verifyYear(buildIndependentYear(year,city)));
    console.error(`[verify] ${city.id} ${year} annual case passed`);
  }
  const controls=[];
  for(const city of CONTROLS){
    const year=city.id==='istanbul'?2027:2027;
    const days=yearDates(year).map(date=>calculateDiyanetLocalDay(inputFor(date,locationOf(city))));
    assert.equal(days.length,365,`${city.id}: full control-year day count`);
    const baseDays=yearDates(year).map(date=>calculateLocalDay({date,...locationOf(city),profile:LOCAL_DIYANET_SPA_PROFILE}));
    const controlledSchedules=[],entries=[];
    for(let i=0;i<365;i+=31){
      const schedule=calculateDiyanetLocalSchedule({startDate:yearDates(year)[i],dayCount:Math.min(31,365-i),...locationOf(city),profile:PROFILE});
      controlledSchedules.push(...schedule.days);
      entries.push(...schedule.entries);
    }
    const summaries=new Map(controlledSchedules.map(row=>[row.sourceDate,row]));
    assert.equal(summaries.size,365,`${city.id}: no missing or duplicate schedule summary`);
    const entriesByDay=new Map();
    for(const entry of entries){const list=entriesByDay.get(entry.sourceDate)??[];list.push(entry);entriesByDay.set(entry.sourceDate,list);}
    for(const day of days){
      const expected=['fajr','dhuhr','asr','maghrib','isha'].filter(e=>day.events[e].role==='prayer-start-model'
        &&['calculated','estimated'].includes(day.events[e].status));
      const actual=entriesByDay.get(day.date)??[];
      assert.equal(actual.length,expected.length,`${city.id} ${day.date}: schedule entry count matches independent day output`);
      assert.equal(summaries.get(day.date).entryCount,expected.length,`${city.id} ${day.date}: schedule day summary count`);
      assert.equal(summaries.get(day.date).complete,expected.length===5,`${city.id} ${day.date}: schedule complete coverage`);
      for(const entry of actual){
        const event=day.events[entry.event];close(entry.rawEpochMilliseconds,event.rawEpochMilliseconds,`${city.id} ${day.date} ${entry.event}: schedule raw value`);
        assert.equal(entry.epochMilliseconds,event.epochMilliseconds,`${city.id} ${day.date} ${entry.event}: schedule instant`);
      }
    }
    if(city.id==='istanbul'){
      for(const day of days)for(const e of ['fajr','isha'])if(day.events[e].status==='calculated'){
        const expected=selectedSolar(solar(day.date,city),e);
        close(day.events[e].rawEpochMilliseconds,expected,`${city.id} ${day.date} ordinary ${e}`);
      }
    }
    for(let i=0;i<days.length;i++){
      const day=days[i],base=baseDays[i];
      for(const e of ['sunrise','maghrib']){
        assert.equal(day.events[e].status,base.events[e].status,`${city.id} ${day.date} ${e}: preserve strict horizon status`);
        assert.equal(day.events[e].rawEpochMilliseconds,base.events[e].rawEpochMilliseconds,`${city.id} ${day.date} ${e}: preserve strict horizon instant`);
        if(base.events[e].status==='unavailable')assert.equal(day.events[e].rawEpochMilliseconds,null,`${city.id} ${day.date} ${e}: unavailable horizon stays null`);
      }
    }
    const unavailableDates=Object.fromEntries(['fajr','sunrise','dhuhr','asr','maghrib','isha'].map(e=>[e,
      days.filter(d=>['unavailable','policy-blocked'].includes(d.events[e].status)).map(d=>d.date)]));
    const baseline={completeDays:baseDays.filter(d=>d.coverage.complete).length,
      prayerStartsCompleteDays:baseDays.filter(d=>d.coverage.prayerStartsComplete).length,
      newlySuppliedEvents:Object.fromEntries(['fajr','isha'].map(e=>[e,days.filter((d,i)=>
        !['calculated','estimated'].includes(baseDays[i].events[e].status)
        &&['calculated','estimated'].includes(d.events[e].status)).length]))};
    const crossNight=[];
    const controlByDate=new Map(days.map(day=>[day.date,day]));
    for(const date of [dateOf(Date.UTC(year-1,11,31)),...yearDates(year)]){
      const nextDate=dateOf(Date.parse(`${date}T00:00:00Z`)+DAY),a=controlByDate.get(date)
        ??calculateDiyanetLocalDay(inputFor(date,locationOf(city))),b=controlByDate.get(nextDate)
        ??calculateDiyanetLocalDay(inputFor(nextDate,locationOf(city)));
      const values=[a.events.maghrib,a.events.isha,b.events.fajr,b.events.sunrise].map(e=>e.rawEpochMilliseconds);
      const complete=values.every(Number.isFinite);
      if(complete)assert.ok(values[0]<values[1]&&values[1]<values[2]&&values[2]<values[3],`${city.id} ${date}: control cross-night order`);
      crossNight.push({date,nextDate,complete,values});
    }
    controls.push({city:city.id,year,days:days.length,counts:Object.fromEntries(['fajr','sunrise','dhuhr','asr','maghrib','isha'].map(e=>[e,
      Object.fromEntries(['calculated','estimated','unavailable','policy-blocked'].map(status=>[status,days.filter(d=>d.events[e].status===status).length]))])),
      completeDays:days.filter(d=>d.coverage.complete).length,prayerStartsCompleteDays:days.filter(d=>d.coverage.prayerStartsComplete).length,
      unavailableDates,baseline,crossNight:{completeNights:crossNight.filter(n=>n.complete).length,checkedNights:crossNight.length,rows:crossNight},
      seasonalStatuses:Object.fromEntries([...new Set(days.map(d=>d.calculation.seasonalPolicy.status))].map(s=>[s,days.filter(d=>d.calculation.seasonalPolicy.status===s).length]))});
    console.error(`[verify] ${city.id} ${year} control passed`);
  }
  const seasonBoundaries=[];
  for(const s of summaries)for(const event of ['fajr','isha'])for(let i=1;i<s.rows.length;i++){
    const prior=s.rows[i-1],current=s.rows[i];
    if(prior.events[event].mode!==current.events[event].mode||prior.events[event].status!==current.events[event].status){
      const after=s.rows[i+1];
      seasonBoundaries.push({city:s.city,year:s.year,event,date:current.date,
        modes:[prior.events[event].mode,current.events[event].mode,after?.events[event].mode??null],
        statuses:[prior.events[event].status,current.events[event].status,after?.events[event].status??null]});
    }
  }
  const yearSeams=[];
  for(const city of CITIES)for(const event of ['fajr','isha']){
    const ordered=summaries.filter(s=>s.city===city.id).sort((a,b)=>a.year-b.year).flatMap(s=>s.phaseSeries[event]);
    for(let i=1;i<ordered.length;i++)if(Date.parse(ordered[i].date)-Date.parse(ordered[i-1].date)===DAY){
      const change=ordered[i].phaseMinutes-ordered[i-1].phaseMinutes;
      if(ordered[i].date.endsWith('-01-01'))yearSeams.push({city:city.id,event,from:ordered[i-1].date,to:ordered[i].date,minutes:change});
      assert.ok(Math.abs(change)<=10,`${city.id} ${event} ${ordered[i-1].date}->${ordered[i].date}: year seam >10 min`);
    }
  }
  const afterClosure=dependencyClosure();
  assert.deepEqual(afterClosure,beforeClosure,'All numerical inputs and timezone resources must retain their pinned hashes throughout verification');
  const reports={schema:'diyanet-local-independent-behavior-verification/v1',result:'PASS',profile:PROFILE,
    validationLimitations:['Behavior and implementation-conformance evidence only; it is not a Diyanet calendar comparison, institutional-equivalence claim, fiqh ruling, or measured real-world accuracy result.',
      'SPA uses the repository-declared offline time-scale assumptions and flat horizon; topography, elevation, local sighting, official rounding, and future Earth-orientation data are outside scope.'],
    scope:{completeAnnualCityYears:summaries.map(({city,year})=>({city,year})),controls,latitudeBoundary:boundary,
      seasonalBoundaries:seasonBoundaries,yearSeams},
    winter,
    annual:summaries,runtime:{node:process.version,icu:process.versions.icu,tzdb:process.versions.tz,
      tzdbSourceCommit:tzBundle.sourceCommit,tzdataBundleVerified:true,icuOverrideActive:process.env.ICU_TIMEZONE_FILES_DIR===tzBundle.directory},
    hashes:{dependencyClosureBefore:beforeClosure,dependencyClosureAfter:afterClosure,
      planSha256:createHash('sha256').update(planBytes).digest('hex'),verifierSha256:sha(fileURLToPath(import.meta.url))}};
  mkdirSync(dirname(REPORT),{recursive:true});writeFileSync(REPORT,JSON.stringify(reports,null,2)+'\n');
  return reports;
}

if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
  try{
    if(process.argv.includes('--focused-smoke')){
      const boundary=verifyBoundary(),winter=verifyWinter(CONTROLS[0],2027);
      console.log(JSON.stringify({result:'FOCUSED_HELPERS_PASS',boundary,winter:{eligible:winter.eligible,
        reason:winter.annualContextReason,originalAnnualContextRemainsBlocked:winter.originalAnnualContextRemainsBlocked}},null,2));
      process.exit(0);
    }
    const report=verifyDiyanetLocal();
    console.log(JSON.stringify({result:report.result,annualCityYears:report.annual.length,controls:report.scope.controls},null,2));
  }catch(error){
    const failed={schema:'diyanet-local-independent-behavior-verification/v1',result:'FAIL',
      failedAt:new Date().toISOString(),error:error instanceof Error?{name:error.name,message:error.message,stack:error.stack}:String(error),
      runtime:{node:process.version,icu:process.versions.icu,tzdb:process.versions.tz},
      hashes:{dependencyClosure:dependencyClosure(),verifierSha256:sha(fileURLToPath(import.meta.url))}};
    mkdirSync(dirname(REPORT),{recursive:true});writeFileSync(REPORT,JSON.stringify(failed,null,2)+'\n');
    console.error(error);process.exitCode=1;
  }
}
