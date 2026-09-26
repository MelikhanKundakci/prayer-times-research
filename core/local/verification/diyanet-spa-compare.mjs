import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {calculateLocalDay} from '../index.mjs';

export const DIYANET_SPA_GRID=Object.freeze([
  {id:'istanbul-2027',year:2027,latitude:41.0082,longitude:28.9784,timeZone:'Europe/Istanbul'},
  {id:'frankfurt-2027',year:2027,latitude:50.11,longitude:8.68,timeZone:'Europe/Berlin'},
  {id:'frankfurt-2028',year:2028,latitude:50.11,longitude:8.68,timeZone:'Europe/Berlin'},
  {id:'oslo-2027',year:2027,latitude:59.91,longitude:10.75,timeZone:'Europe/Oslo'},
  {id:'tromso-2027',year:2027,latitude:69.65,longitude:18.96,timeZone:'Europe/Oslo'},
  {id:'tokyo-2027',year:2027,latitude:35.6762,longitude:139.6503,timeZone:'Asia/Tokyo'},
  {id:'sydney-2027',year:2027,latitude:-33.8688,longitude:151.2093,timeZone:'Australia/Sydney'},
  {id:'synthetic-antimeridian-2027',year:2027,latitude:50,longitude:180,timeZone:'Asia/Anadyr'},
].map(Object.freeze));
const PROFILES=Object.freeze({usno:'diyanet-published-point-v1',spa:'diyanet-published-spa-point-v1'});
const EVENTS=['fajr','sunrise','dhuhr','asr','maghrib','isha'];
const DAY=86400000;
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const declaration=()=>({schema:'diyanet-spa-annual-declaration/v1',profiles:PROFILES,grid:DIYANET_SPA_GRID,
  meaning:'Predeclared source-free comparison of physical-model choices under the same declared local Diyanet rules; not a comparison to institutional calendars',
  events:EVENTS,expectedPointDays:2921,expectedFieldsPerProfile:17526,
  primary:'selected profile events including blocked/unavailable states',secondary:'unadjusted physical events and northern guard metadata',
  differenceSign:'SPA minus USNO; absolute elapsed UTC seconds, never wrapped clock subtraction'});
export const DIYANET_SPA_DECLARATION_SHA256=hash(JSON.stringify(declaration()));

function dates(year){
  const result=[];
  for(let t=Date.UTC(year,0,1);t<Date.UTC(year+1,0,1);t+=DAY)result.push(new Date(t).toISOString().slice(0,10));
  return result;
}
function tally(){return{fields:0,status:{usno:{},spa:{}},bothAvailable:0,bothAbsent:0,usnoOnly:0,spaOnly:0,
  sameAvailableStatus:0,sameNearestMinute:0,deltas:[],extremes:[]};}
function available(event,physical){return physical?event.status==='calculated':['calculated','estimated'].includes(event.status);}
function accumulate(target,old,current,label,physical=false){
  target.fields++;
  for(const [key,event] of [['usno',old],['spa',current]])target.status[key][event.status]=(target.status[key][event.status]??0)+1;
  const a=available(old,physical),b=available(current,physical);
  const x=physical?old.epochMilliseconds:old.rawEpochMilliseconds;
  const y=physical?current.epochMilliseconds:current.rawEpochMilliseconds;
  assert.equal(Number.isFinite(x),a,`${label}: baseline status/instant`);
  assert.equal(Number.isFinite(y),b,`${label}: SPA status/instant`);
  if(a&&b){
    target.bothAvailable++;
    if(old.status===current.status)target.sameAvailableStatus++;
    const delta=(y-x)/1000;
    target.deltas.push(delta);
    const oldMinute=physical?Math.floor(x/60000+.5)*60000:old.roundedEpochMilliseconds;
    const newMinute=physical?Math.floor(y/60000+.5)*60000:current.roundedEpochMilliseconds;
    if(oldMinute===newMinute)target.sameNearestMinute++;
    target.extremes.push({...label,differenceSeconds:delta});
  }else if(a)target.usnoOnly++;else if(b)target.spaOnly++;else target.bothAbsent++;
}
function summarize(t){
  const absolute=t.deltas.map(Math.abs).sort((a,b)=>a-b),n=absolute.length;
  return{fields:t.fields,status:t.status,bothAvailable:t.bothAvailable,bothAbsent:t.bothAbsent,
    usnoOnly:t.usnoOnly,spaOnly:t.spaOnly,sameAvailableStatus:t.sameAvailableStatus,sameNearestMinute:t.sameNearestMinute,
    changedNearestMinute:t.bothAvailable-t.sameNearestMinute,
    maximumAbsoluteSeconds:n?absolute.at(-1):null,
    medianAbsoluteSeconds:n?(n%2?absolute[(n-1)/2]:(absolute[n/2-1]+absolute[n/2])/2):null,
    p95AbsoluteSecondsNearestRank:n?absolute[Math.ceil(.95*n)-1]:null,
    minimumSignedSeconds:n?Math.min(...t.deltas):null,maximumSignedSeconds:n?Math.max(...t.deltas):null,
    largestDifferences:t.extremes.sort((a,b)=>Math.abs(b.differenceSeconds)-Math.abs(a.differenceSeconds)).slice(0,6)};
}
function metadata(northern){
  if(!northern)return null;
  const m=northern.metadata;
  return{status:northern.status,reason:northern.reason,solarModel:m.solarModel??null,solarProvider:m.solarProvider??null,
    anchorDate:m.anchorDate,q:m.q,missingFajrStartDate:m.missingFajrStartDate,missingFajrEndDate:m.missingFajrEndDate,
    missingFajrDayCount:m.missingFajrDayCount,horizonGatePassed:m.horizonGatePassed,
    annualIshaTransitionLowerPhaseMinutes:m.annualIshaTransitionLowerPhaseMinutes,
    annualFajrTransitionUpperPhaseMinutes:m.annualFajrTransitionUpperPhaseMinutes};
}
function guard(northern){
  if(!northern)return null;
  const d=northern.day;
  return{fajr:{eligible:d.fajr.eligible,reason:d.fajr.reason},isha:{eligible:d.isha.eligible,reason:d.isha.reason},
    sunrise:{eligible:d.horizons.sunriseEligible,reason:d.horizons.reason},
    maghrib:{eligible:d.horizons.maghribEligible,reason:d.horizons.reason}};
}
function pinFiles(){
  const files=['../index.mjs','../profiles.mjs','../solar.mjs','../northern.mjs',
    '../../astronomy/continuous-solver.mjs','../../astronomy/solar-usno-v2.mjs',
    '../../astronomy/spa-point.mjs','../../astronomy/spa-coefficients.json'];
  return files.map(path=>({path:new URL(path,import.meta.url).pathname.split('/core/').at(-1),sha256:hash(readFileSync(new URL(path,import.meta.url)))}));
}

/** Recompute the complete fixed grid. No network, source calendars, or result-file reads. */
export function compareDiyanetSPA({onProgress}={}){
  const started=performance.now(),initialPins=pinFiles();
  const selected=tally(),physical=tally(),events=Object.fromEntries(EVENTS.map(e=>[e,tally()]));
  const physicalEvents=Object.fromEntries(EVENTS.map(e=>[e,tally()])),groups=[];
  let pointDays=0;
  for(const item of DIYANET_SPA_GRID){
    const groupStart=performance.now(),local=tally(),raw=tally();
    const eventTallies=Object.fromEntries(EVENTS.map(e=>[e,tally()]));
    const statusChanges=[],eligibilityChanges=[],guardReasonChanges=[];
    const availabilityDates={usno:{complete:[],incomplete:[]},spa:{complete:[],incomplete:[]}};
    let northern=null;
    for(const date of dates(item.year)){
      const input={date,latitude:item.latitude,longitude:item.longitude,timeZone:item.timeZone};
      const old=calculateLocalDay({...input,profile:PROFILES.usno});
      const current=calculateLocalDay({...input,profile:PROFILES.spa});
      assert.match(old.astronomy.model.id,/USNO/);assert.match(current.astronomy.model.id,/SPA/);
      for(const value of [old,current]){
        assert.equal(value.profile.official,false);
        assert.equal(value.profile.institutionalEquivalence,'not-claimed');
        assert.equal(value.calculation.seasonalPolicy,null,'This is not the opt-in summer profile');
      }
      const oldNorth=old.calculation.northernPolicy,newNorth=current.calculation.northernPolicy;
      if(oldNorth){
        assert.equal(oldNorth.metadata.solarModel,'usno');assert.equal(newNorth.metadata.solarModel,'spa');
        for(const event of ['fajr','isha']){
          assert.equal(oldNorth.day[event].rawEpochMilliseconds,old.astronomy.events[event].epochMilliseconds,`${date}: old annual/daily provider consistency`);
          assert.equal(newNorth.day[event].rawEpochMilliseconds,current.astronomy.events[event].epochMilliseconds,`${date}: SPA annual/daily provider consistency`);
        }
      }
      if(!northern&&oldNorth)northern={usno:metadata(oldNorth),spa:metadata(newNorth)};
      const aGuard=guard(oldNorth),bGuard=guard(newNorth);
      assert.equal(aGuard===null,bGuard===null);
      if(aGuard)for(const event of ['fajr','isha','sunrise','maghrib']){
        if(aGuard[event].eligible!==bGuard[event].eligible)eligibilityChanges.push({date,event,usno:aGuard[event],spa:bGuard[event]});
        else if(aGuard[event].reason!==bGuard[event].reason)guardReasonChanges.push({date,event,eligible:aGuard[event].eligible,
          usnoReason:aGuard[event].reason,spaReason:bGuard[event].reason});
      }
      for(const event of EVENTS){
        const label={caseId:item.id,date,event};
        const a=old.events[event],b=current.events[event];
        accumulate(selected,a,b,label);accumulate(local,a,b,label);accumulate(events[event],a,b,label);accumulate(eventTallies[event],a,b,label);
        accumulate(physical,old.astronomy.events[event],current.astronomy.events[event],label,true);
        accumulate(raw,old.astronomy.events[event],current.astronomy.events[event],label,true);
        accumulate(physicalEvents[event],old.astronomy.events[event],current.astronomy.events[event],label,true);
        if(a.status!==b.status||a.reason!==b.reason)statusChanges.push({date,event,usno:{status:a.status,reason:a.reason},spa:{status:b.status,reason:b.reason}});
      }
      for(const [key,value] of [['usno',old],['spa',current]])
        availabilityDates[key][value.coverage.complete?'complete':'incomplete'].push(date);
      pointDays++;
    }
    groups.push({input:item,dayCount:dates(item.year).length,selected:summarize(local),physical:summarize(raw),
      byEvent:Object.fromEntries(EVENTS.map(e=>[e,summarize(eventTallies[e])])),northern,
      eligibilityChanges,guardReasonChanges,statusChanges,
      completeDayCounts:{usno:availabilityDates.usno.complete.length,spa:availabilityDates.spa.complete.length},
      completeDayChanges:{newlyComplete:availabilityDates.spa.complete.filter(d=>!availabilityDates.usno.complete.includes(d)),
        newlyIncomplete:availabilityDates.usno.complete.filter(d=>!availabilityDates.spa.complete.includes(d))},
      elapsedMilliseconds:performance.now()-groupStart});
    onProgress?.({caseId:item.id,dayCount:dates(item.year).length,elapsedMilliseconds:performance.now()-groupStart,
      selectedMaximumAbsoluteSeconds:groups.at(-1).selected.maximumAbsoluteSeconds,eligibilityChanges:eligibilityChanges.length});
  }
  assert.deepEqual(pinFiles(),initialPins,'Implementation files changed during comparison');
  assert.equal(pointDays,2921);assert.equal(selected.fields,17526);assert.equal(physical.fields,17526);
  return{schema:'diyanet-spa-annual-comparison/v1',meaning:declaration().meaning,
    createdAt:new Date().toISOString(),declaration:declaration(),declarationSha256:DIYANET_SPA_DECLARATION_SHA256,
    runtime:{node:process.version,icu:process.versions.icu,tzdb:process.versions.tz},
    pointDays,selected:summarize(selected),physical:summarize(physical),
    byEvent:Object.fromEntries(EVENTS.map(e=>[e,summarize(events[e])])),
    physicalByEvent:Object.fromEntries(EVENTS.map(e=>[e,summarize(physicalEvents[e])])),groups,
    implementationPins:initialPins,evaluatorSha256:hash(readFileSync(new URL(import.meta.url))),
    elapsedMilliseconds:performance.now()-started};
}

if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
  if(process.argv.includes('--declare'))console.log(JSON.stringify({...declaration(),declarationSha256:DIYANET_SPA_DECLARATION_SHA256},null,2));
  else{
    const output=compareDiyanetSPA({onProgress:x=>console.error(JSON.stringify(x))});
    writeFileSync(new URL('./diyanet-spa-comparison.json',import.meta.url),JSON.stringify(output,null,2)+'\n');
    console.log(JSON.stringify({pointDays:output.pointDays,selected:output.selected,elapsedMilliseconds:output.elapsedMilliseconds},null,2));
  }
}
