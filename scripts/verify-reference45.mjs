#!/usr/bin/env node
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {calculateReferenceDay,calculateReferenceSchedule,LOCAL_REFERENCE_PROFILES} from '../core/local/sunni-reference.mjs';
import {calculateSunniDay} from '../core/local/sunni.mjs';

const HERE=dirname(fileURLToPath(import.meta.url));
const ROOT=resolve(HERE,'..');
const OUTPUT=join(ROOT,'core/local/verification/reference45-2026-09-27.json');
const DAY=86400000;
const events=['fajr','sunrise','dhuhr','asr','maghrib','isha'];
const points=[
  {id:'frankfurt',latitude:50.1109,longitude:8.6821,timeZone:'Europe/Berlin'},
  {id:'berlin',latitude:52.52,longitude:13.405,timeZone:'Europe/Berlin'},
  {id:'edinburgh',latitude:55.9533,longitude:-3.1883,timeZone:'Europe/London'},
  {id:'oslo',latitude:59.9139,longitude:10.7522,timeZone:'Europe/Oslo'},
  {id:'ushuaia',latitude:-54.8019,longitude:-68.303,timeZone:'America/Argentina/Ushuaia'},
];
const boundaryPoints=[
  {id:'lat47.99-n',latitude:47.99,longitude:10,timeZone:'Europe/Berlin'},
  {id:'lat48-n',latitude:48,longitude:10,timeZone:'Europe/Berlin'},
  {id:'lat66-n',latitude:66,longitude:10,timeZone:'Europe/Berlin'},
  {id:'lat66.01-n',latitude:66.01,longitude:10,timeZone:'Europe/Berlin'},
  {id:'lat47.99-s',latitude:-47.99,longitude:10,timeZone:'Europe/Berlin'},
  {id:'lat48-s',latitude:-48,longitude:10,timeZone:'Europe/Berlin'},
  {id:'lat66-s',latitude:-66,longitude:10,timeZone:'Europe/Berlin'},
  {id:'lat66.01-s',latitude:-66.01,longitude:10,timeZone:'Europe/Berlin'},
  {id:'tromso',latitude:69.6492,longitude:18.9553,timeZone:'Europe/Oslo'},
  {id:'ushuaia-summer',latitude:-54.8019,longitude:-68.303,timeZone:'America/Argentina/Ushuaia'},
  {id:'dst-berlin',latitude:52.52,longitude:13.405,timeZone:'Europe/Berlin'},
  {id:'dst-london',latitude:55.9533,longitude:-3.1883,timeZone:'Europe/London'},
];
const boundaryDates=['2027-03-28','2027-10-31','2027-06-21','2027-12-21'];
const families=['mwl','egyptian'];
const profiles=families.flatMap(f=>[1,2].map(k=>`sunni-${f}-shadow${k}-reference45-v1`));
const asMs=e=>e?.status==='calculated'&&Number.isFinite(e.rawEpochMilliseconds)?e.rawEpochMilliseconds:null;
const eventEpoch=(day,name)=>asMs(day?.events?.[name]);
const physicalCache=new Map();
function physical(input){
  const key=JSON.stringify([input.date,input.latitude,input.longitude,input.timeZone,input.profile]);
  if(!physicalCache.has(key))physicalCache.set(key,calculateSunniDay(input));
  return physicalCache.get(key);
}
function dateAt(offset){return new Date(Date.UTC(2027,0,1)+offset*DAY).toISOString().slice(0,10);}
function dateOffset(date,offset){return new Date(Date.parse(`${date}T00:00:00Z`)+offset*DAY).toISOString().slice(0,10);}
function inputFor(date,point,profile){return{date,latitude:point.latitude,longitude:point.longitude,timeZone:point.timeZone,profile};}
function abs(a,b){return Math.abs(a-b);}
function assertClose(actual,expected,message){assert.ok(Number.isFinite(actual)&&Number.isFinite(expected)&&abs(actual,expected)<=1,`${message}: ${actual} != ${expected}`);}
function modDayDelta(current,previous){let d=current-previous;while(d>DAY/2)d-=DAY;while(d< -DAY/2)d+=DAY;return d;}
function utcOffsetMinutes(epoch,timeZone){
  const name=new Intl.DateTimeFormat('en-US',{timeZone,timeZoneName:'longOffset'}).formatToParts(epoch).find(part=>part.type==='timeZoneName')?.value;
  if(name==='GMT'||name==='UTC')return 0;
  const match=/^GMT([+-])(\d{2}):(\d{2})$/.exec(name??'');
  if(!match)throw new Error(`Unexpected timezone offset ${name}`);
  return(match[1]==='-'?-1:1)*(Number(match[2])*60+Number(match[3]));
}

// Compute the declared ratio from independently selected physical-profile event epochs;
// this deliberately does not consume the implementation's selection trace.
function deriveCandidate(name,day,prev,next,refDay,refPrev,refNext){
  const localStart=name==='fajr'?eventEpoch(prev,'maghrib'):eventEpoch(day,'maghrib');
  const localEnd=name==='fajr'?eventEpoch(day,'sunrise'):eventEpoch(next,'sunrise');
  const refStart=name==='fajr'?eventEpoch(refPrev,'maghrib'):eventEpoch(refDay,'maghrib');
  const refEnd=name==='fajr'?eventEpoch(refDay,'sunrise'):eventEpoch(refNext,'sunrise');
  const anchor=eventEpoch(refDay,name);
  if(![localStart,localEnd,refStart,refEnd,anchor].every(Number.isFinite)||localEnd<=localStart||refEnd<=refStart||anchor<=refStart||anchor>=refEnd)return null;
  const fraction=name==='fajr'?(refEnd-anchor)/(refEnd-refStart):(anchor-refStart)/(refEnd-refStart);
  if(!(fraction>0&&fraction<1))return null;
  return{name,fraction,candidate:name==='fajr'?localEnd-fraction*(localEnd-localStart):localStart+fraction*(localEnd-localStart),
    localStart,localEnd,refStart,refEnd,anchor};
}

function profileFamily(profile){return profile.split('-')[1];}
function profileFactor(profile){return Number(profile.match(/shadow(\d)/)[1]);}
function physicalProfile(profile){return `sunni-${profileFamily(profile)}-shadow${profileFactor(profile)}-physical-v1`;}
function refProfile(family,factor){return `sunni-${family}-shadow${factor}-reference45-v1`;}
async function hashClosure(entry){
  const seen=new Set(),queue=[entry];
  while(queue.length){
    const file=resolve(queue.pop());if(seen.has(file))continue;seen.add(file);
    const source=await readFile(file,'utf8');
    for(const match of source.matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g)){
      const target=resolve(dirname(file),match[1]);
      try{await readFile(target);queue.push(target);}catch{}
    }
  }
  return Object.fromEntries(await Promise.all([...seen].sort().map(async file=>[
    file.slice(ROOT.length+1),createHash('sha256').update(await readFile(file)).digest('hex')])));
}

export async function verifyReference45(){
  assert.equal(LOCAL_REFERENCE_PROFILES.length,4);
  const byProfile={},started=Date.now(),scheduleChecks=[];
  const entryModule=join(ROOT,'core/local/sunni-reference.mjs');
  const hashesBefore=await hashClosure(entryModule);
  for(const profile of profiles){
    const family=profileFamily(profile),factor=profileFactor(profile),baseId=physicalProfile(profile);
    const stats={family,factor,plannedDays:0,events:0,calculated:0,estimated:0,unavailable:0,policyBlocked:0,
      estimatedFajr:0,estimatedIsha:0,rawTwilightMissing:0,rawMissingFajr:0,rawMissingIsha:0,
      nonTwilightBitIdentical:0,physicalTwilightBitIdentical:0,
      independentEstimateChecks:0,maxEstimateArithmeticErrorMilliseconds:0,maxAdjacentNormalizedChangeMilliseconds:0,
      crossNightChecks:0,orderChecks:0,transitionPairs:0,maxAdjacentNormalizedChangeInvolvingEstimateMilliseconds:0,transitionWitness:null,
      referenceFractions:[],perPoint:[]};
    for(const point of points){
      const days=[];
      for(let i=0;i<365;i++){
        const date=dateAt(i),input=inputFor(date,point,profile),baseInput={...input,profile:baseId};
        const day=calculateReferenceDay(input),base=physical(baseInput);
        const refPoint={...point,latitude:point.latitude<0?-45:45};
        let prev=null,next=null,reference=null,refPrev=null,refNext=null;
        const independentEstimate=(name)=>{
          prev??=physical(inputFor(dateAt(i-1),point,baseId));
          next??=physical(inputFor(dateAt(i+1),point,baseId));
          reference??=physical(inputFor(date,refPoint,baseId));
          refPrev??=physical(inputFor(dateAt(i-1),refPoint,baseId));
          refNext??=physical(inputFor(dateAt(i+1),refPoint,baseId));
          return deriveCandidate(name,base,prev,next,reference,refPrev,refNext);
        };
        stats.plannedDays++;
        for(const name of events){
          const actual=day.events[name],raw=base.events[name];stats.events++;
          if(actual.status==='calculated')stats.calculated++;else if(actual.status==='estimated')stats.estimated++;
          else if(actual.status==='unavailable')stats.unavailable++;else if(actual.status==='policy-blocked')stats.policyBlocked++;
          if(!['fajr','isha'].includes(name)){
            assert.deepEqual(actual,raw,`${profile}/${point.id}/${date}/${name}: non-twilight changed`);
            stats.nonTwilightBitIdentical++;
          }else if(raw.status==='calculated'){
            assert.deepEqual(actual,raw,`${profile}/${point.id}/${date}/${name}: physical crossing not retained exactly`);
            stats.physicalTwilightBitIdentical++;
          }else if(raw.status==='unavailable'&&raw.reason==='sun-continuously-above-threshold'){
            stats.rawTwilightMissing++;
            stats[name==='fajr'?'rawMissingFajr':'rawMissingIsha']++;
            if(Math.abs(point.latitude)>=48&&Math.abs(point.latitude)<=66){
              const derived=independentEstimate(name);
              assert.ok(derived,`${profile}/${point.id}/${date}/${name}: independent reference/night data unavailable`);
              assert.equal(actual.status,'estimated',`${profile}/${point.id}/${date}/${name}: eligible absence was not estimated`);
              const selected=actual.selection?.selectedEpochMilliseconds;
              assertClose(selected,derived.candidate,`${profile}/${point.id}/${date}/${name}: independent fraction result`);
              assertClose(actual.rawEpochMilliseconds,derived.candidate,`${profile}/${point.id}/${date}/${name}: selected event epoch`);
              assert.equal(actual.selection?.rawStatus,'unavailable');
              assert.equal(actual.selection?.rawReason,'sun-continuously-above-threshold');
              assert.ok(Math.abs(actual.selection.referenceFraction-derived.fraction)<1e-12,
                `${profile}/${point.id}/${date}/${name}: independent ratio ${actual.selection.referenceFraction} != ${derived.fraction}`);
              stats.independentEstimateChecks++;
              stats.maxEstimateArithmeticErrorMilliseconds=Math.max(stats.maxEstimateArithmeticErrorMilliseconds,Math.abs(selected-derived.candidate));
              stats[name==='fajr'?'estimatedFajr':'estimatedIsha']++;
              stats.referenceFractions.push(derived.fraction);
            }else{
              assert.equal(actual.status,'policy-blocked',`${profile}/${point.id}/${date}/${name}: out-of-band seasonal absence must block`);
            }
          }else if(raw.status==='unavailable'){
            assert.equal(actual.status,'policy-blocked',`${profile}/${point.id}/${date}/${name}: unsupported failure should be policy-blocked`);
          }
        }
        const selected=events.map(name=>day.events[name]).filter(e=>['calculated','estimated'].includes(e.status));
        for(let j=1;j<selected.length;j++)assert.ok(selected[j-1].epochMilliseconds<selected[j].epochMilliseconds,`${profile}/${point.id}/${date}: event chronology`);
        stats.orderChecks+=Math.max(0,selected.length-1);
        days.push({date,day,base});
      }
      for(let i=1;i<days.length;i++){
        const prior=days[i-1].day.events.isha,current=days[i].day.events.fajr;
        if(['calculated','estimated'].includes(prior.status)&&['calculated','estimated'].includes(current.status)){
          assert.ok(prior.epochMilliseconds<current.epochMilliseconds,`${profile}/${point.id}/${days[i].date}: Isha must precede next Fajr`);
          stats.crossNightChecks++;
        }
        for(const name of ['fajr','isha']){
          const a=days[i-1].day.events[name],b=days[i].day.events[name];
          if(['calculated','estimated'].includes(a.status)&&['calculated','estimated'].includes(b.status)){
            const change=modDayDelta(b.epochMilliseconds,a.epochMilliseconds);
            stats.maxAdjacentNormalizedChangeMilliseconds=Math.max(stats.maxAdjacentNormalizedChangeMilliseconds,Math.abs(change));
            if(a.status==='estimated'||b.status==='estimated'){
              stats.transitionPairs++;
              if(Math.abs(change)>stats.maxAdjacentNormalizedChangeInvolvingEstimateMilliseconds){stats.maxAdjacentNormalizedChangeInvolvingEstimateMilliseconds=Math.abs(change);stats.transitionWitness={point:point.id,event:name,
                from:days[i-1].date,to:days[i].date,changeMilliseconds:change,fromStatus:a.status,toStatus:b.status,
                fromUtc:a.utc,toUtc:b.utc,fromLocalTime:a.time,toLocalTime:b.time};}
            }
          }
        }
      }
      const pstats={point:point.id,latitude:point.latitude,longitude:point.longitude,timeZone:point.timeZone,
        days:days.length,completeDays:days.filter(x=>x.day.coverage.complete).length,
        basePhysicalCompleteDays:days.filter(x=>x.base.coverage.complete).length,
        estimates:days.reduce((n,x)=>n+['fajr','isha'].filter(k=>x.day.events[k].status==='estimated').length,0),
        blocked:days.reduce((n,x)=>n+['fajr','isha'].filter(k=>x.day.events[k].status==='policy-blocked').length,0)};
      stats.perPoint.push(pstats);
      const schedule=calculateReferenceSchedule({startDate:'2027-06-15',dayCount:10,latitude:point.latitude,
        longitude:point.longitude,timeZone:point.timeZone,profile});
      assert.equal(schedule.days.length,10,`${profile}/${point.id}: schedule day count`);
      let scheduleCrossNightChecks=0;
      for(let i=1;i<schedule.days.length;i++){
        const previous=schedule.days[i-1],current=schedule.days[i];
        const priorIsha=schedule.entries.find(entry=>entry.sourceDate===previous.sourceDate&&entry.event==='isha');
        const nextFajr=schedule.entries.find(entry=>entry.sourceDate===current.sourceDate&&entry.event==='fajr');
        if(priorIsha&&nextFajr){assert.ok(priorIsha.epochMilliseconds<nextFajr.epochMilliseconds,
          `${profile}/${point.id}/${current.sourceDate}: schedule Isha→Fajr`);scheduleCrossNightChecks++;}
      }
      if(schedule.complete)assert.equal(scheduleCrossNightChecks,9,`${profile}/${point.id}: complete schedule must check all adjacent Isha→Fajr pairs`);
      scheduleChecks.push({profile,point:point.id,dayCount:schedule.days.length,completeDays:schedule.coverage.completeDays,
        partialDays:schedule.coverage.partialDays,unavailableDays:schedule.coverage.unavailableDays,
        entries:schedule.entries.length,missing:schedule.missing.length,crossNightChecks:scheduleCrossNightChecks});
    }
    stats.referenceFractionRange=stats.referenceFractions.length?[
      Math.min(...stats.referenceFractions),Math.max(...stats.referenceFractions)]:null;
    delete stats.referenceFractions;
    byProfile[profile]=stats;
  }
  const boundaryResults=[];
  for(const point of boundaryPoints){
    for(const date of boundaryDates){
      for(const family of families)for(const factor of [1,2]){
        const profile=refProfile(family,factor),input=inputFor(date,point,profile),day=calculateReferenceDay(input);
        const base=physical({...input,profile:physicalProfile(profile)});
        for(const name of ['fajr','isha']){
          const raw=base.events[name],selected=day.events[name];
          if(raw.status==='calculated')assert.equal(selected.epochMilliseconds,raw.epochMilliseconds,`${point.id}/${date}/${profile}/${name}: ordinary crossing changed`);
          if(raw.status==='unavailable'&&raw.reason==='sun-continuously-above-threshold'){
            const eligible=Math.abs(point.latitude)>=48&&Math.abs(point.latitude)<=66;
            if(!eligible)assert.equal(selected.status,'policy-blocked',`${point.id}/${date}/${profile}/${name}: latitude band gate`);
            else{
              const prev=physical(inputFor(dateOffset(date,-1),point,physicalProfile(profile)));
              const next=physical(inputFor(dateOffset(date,1),point,physicalProfile(profile)));
              const refPoint={...point,latitude:point.latitude<0?-45:45};
              const ref=physical(inputFor(date,refPoint,physicalProfile(profile)));
              const refPrev=physical(inputFor(dateOffset(date,-1),refPoint,physicalProfile(profile)));
              const refNext=physical(inputFor(dateOffset(date,1),refPoint,physicalProfile(profile)));
              const expected=deriveCandidate(name,base,prev,next,ref,refPrev,refNext);
              assert.equal(selected.status,expected?'estimated':'policy-blocked',`${point.id}/${date}/${profile}/${name}: eligible latitude plus usable-night gate`);
            }
          }
        }
        boundaryResults.push({point:point.id,date,profile,events:Object.fromEntries(['fajr','isha'].map(name=>[name,{status:day.events[name].status,reason:day.events[name].reason}]))});
      }
    }
  }
  const hashesAfter=await hashClosure(entryModule);
  assert.deepEqual(hashesAfter,hashesBefore,'Dependency closure changed during verification; rerun against a stable tree.');
  const manifestBytes=await readFile(join(ROOT,'core/timezones/manifest.json'));
  const manifest=JSON.parse(manifestBytes);
  assert.equal(process.versions.tz,manifest.tzdbVersion,'Pinned timezone database was not active.');
  const dstChecks=[
    {id:'berlin-spring-2027',timeZone:'Europe/Berlin',date:'2027-03-28'},
    {id:'london-spring-2027',timeZone:'Europe/London',date:'2027-03-28'},
  ].map(check=>{
    const midnight=Date.parse(`${check.date}T00:00:00Z`),noon=midnight+12*60*60*1000;
    const before=utcOffsetMinutes(midnight,check.timeZone),after=utcOffsetMinutes(noon,check.timeZone);
    assert.notEqual(before,after,`${check.id}: fixture must straddle an actual DST transition`);
    return{...check,utcOffsetsMinutes:[before,after],dstTransitionExercised:true};
  });
  const result={result:'PASS',method:'Independent recomputation from physical-profile raw event instants; no use of reference45 selection trace for expected estimates.',
    transitionMetric:'Largest normalized UTC event-clock change between adjacent civil dates where either event is estimated; includes the ordinary day-to-day shift and is not a separate estimator-step size.',
    limits:'Source-free rule and chronology verification only. Not an observed-accuracy, timetable-parity, religious-validity, or institutional-equivalence study.',
    profiles,annual:{years:[2027],points:points.map(p=>p.id),plannedProfileDays:Object.values(byProfile).reduce((n,p)=>n+p.plannedDays,0),
      plannedEventRows:Object.values(byProfile).reduce((n,p)=>n+p.events,0),summaries:byProfile},
    schedules:{calls:scheduleChecks.length,plannedDays:scheduleChecks.reduce((n,s)=>n+s.dayCount,0),checks:scheduleChecks},
    boundary:{plannedRows:boundaryResults.length,points:boundaryPoints.map(p=>p.id),dates:boundaryDates,checks:boundaryResults},
    dependencies:hashesBefore,physicalCache:{uniqueEntries:physicalCache.size},dstChecks,
    timezoneRuntime:{node:process.version,icu:process.versions.icu,cldr:process.versions.cldr,
      tzdb:process.versions.tz,timezoneManifestSha256:createHash('sha256').update(manifestBytes).digest('hex')},
    runnerSha256:createHash('sha256').update(await readFile(fileURLToPath(import.meta.url))).digest('hex'),
    elapsedMilliseconds:Date.now()-started};
  return result;
}

function assertFiniteReport(value,path='$'){
  if(typeof value==='number')assert.ok(Number.isFinite(value),`${path} must be finite, got ${value}`);
  else if(Array.isArray(value))value.forEach((item,index)=>assertFiniteReport(item,`${path}[${index}]`));
  else if(value&&typeof value==='object')for(const [key,item] of Object.entries(value))assertFiniteReport(item,`${path}.${key}`);
}

if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
  const result=await verifyReference45();
  assertFiniteReport(result);
  await writeFile(OUTPUT,JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({result:result.result,days:result.annual.plannedProfileDays,eventRows:result.annual.plannedEventRows,
    boundaryRows:result.boundary.plannedRows,output:OUTPUT,elapsedMilliseconds:result.elapsedMilliseconds},null,2));
}
