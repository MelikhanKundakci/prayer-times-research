// Structural comparison of calculated series, not prayer-time accuracy evidence.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

export const EVENTS=['fajr','sunrise','dhuhr','asr','maghrib','isha'];
const DAY=86400000;
const midnight=date=>Date.parse(date+'T00:00:00Z');
export const POINTS=[
  {id:'frankfurt',latitude:50.1109,longitude:8.6821,timeZone:'Europe/Berlin'},
  {id:'berlin',latitude:52.52,longitude:13.405,timeZone:'Europe/Berlin'},
  {id:'edinburgh',latitude:55.9533,longitude:-3.1883,timeZone:'Europe/London'},
  {id:'oslo',latitude:59.9139,longitude:10.7522,timeZone:'Europe/Oslo'},
  {id:'ushuaia',latitude:-54.8019,longitude:-68.303,timeZone:'America/Argentina/Ushuaia'},
  {id:'tromso',latitude:69.6492,longitude:18.9553,timeZone:'Europe/Oslo'},
];
export function datesInYear(year){
  const days=[];for(let ms=Date.UTC(year,0,1);ms<Date.UTC(year+1,0,1);ms+=DAY)days.push(new Date(ms).toISOString().slice(0,10));return days;
}
export async function readRows(path){return(await readFile(path,'utf8')).trim().split('\n').filter(Boolean).map(line=>JSON.parse(line));}
function instant(value){
  if(value===null)return null;
  assert.equal(typeof value,'string','event must be UTC ISO text or null');
  assert.match(value,/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|\+00:00)$/);
  const ms=Date.parse(value);assert.ok(Number.isFinite(ms),'invalid event instant');return ms;
}
function blank(city,year){return{city,year,plannedDays:datesInYear(year).length,presentDays:0,absentRows:0,errorDays:0,completeDays:0,
  missing:Object.fromEntries(EVENTS.map(name=>[name,0])),withinDayOrderChecks:0,withinDayOrderViolations:0,orderWitnesses:[],
  crossNightChecks:0,crossNightViolations:0,crossNightWitnesses:[],
  changes:Object.fromEntries(['fajr','isha'].map(name=>[name,{pairs:0,overFiveMinutes:0,overTenMinutes:0,maximumAbsoluteSeconds:0,witness:null}]))};}

export function analyzeRows(rows,{years=[2026,2027,2028],cities=POINTS.map(p=>p.id)}={}){
  const keys=new Map(),groups=new Map();
  for(const city of cities)for(const year of years)groups.set(`${city}/${year}`,blank(city,year));
  for(const row of rows){
    assert.ok(cities.includes(row.city),'unexpected city');
    assert.match(row.date,/^\d{4}-\d\d-\d\d$/);
    assert.ok(years.includes(Number(row.date.slice(0,4))),'unexpected year');
    assert.ok(datesInYear(Number(row.date.slice(0,4))).includes(row.date),'invalid source date');
    const key=`${row.city}/${row.date}`;assert.ok(!keys.has(key),`duplicate row ${key}`);
    assert.ok(row.events&&typeof row.events==='object');
    keys.set(key,{...row,epochs:Object.fromEntries(EVENTS.map(name=>[name,instant(row.events[name])]))});
  }
  for(const city of cities)for(const year of years){
    const stats=groups.get(`${city}/${year}`);
    for(const date of datesInYear(year)){
      const row=keys.get(`${city}/${date}`);
      if(!row){stats.absentRows++;for(const name of EVENTS)stats.missing[name]++;continue;}
      stats.presentDays++;if(row.error)stats.errorDays++;
      for(const name of EVENTS)if(row.epochs[name]===null)stats.missing[name]++;
      const complete=EVENTS.every(name=>row.epochs[name]!==null);
      if(complete)stats.completeDays++;
      // Check every available ordered pair, so missing rows do not hide inversions.
      const available=EVENTS.filter(name=>row.epochs[name]!==null);
      for(let i=1;i<available.length;i++){
        const before=available[i-1],after=available[i];stats.withinDayOrderChecks++;
        if(row.epochs[before]>=row.epochs[after]){
          stats.withinDayOrderViolations++;
          if(stats.orderWitnesses.length<4)stats.orderWitnesses.push({date,before,after,first:row.events[before],second:row.events[after]});
        }
      }
      const previousDate=new Date(midnight(date)-DAY).toISOString().slice(0,10),previous=keys.get(`${city}/${previousDate}`);
      if(!previous)continue;
      if(previous.epochs.isha!==null&&row.epochs.fajr!==null){
        stats.crossNightChecks++;
        if(previous.epochs.isha>=row.epochs.fajr){stats.crossNightViolations++;
          if(stats.crossNightWitnesses.length<4)stats.crossNightWitnesses.push({from:previousDate,to:date,isha:previous.events.isha,fajr:row.events.fajr});}
      }
      for(const name of ['fajr','isha'])if(previous.epochs[name]!==null&&row.epochs[name]!==null){
        const change=(row.epochs[name]-midnight(date))-(previous.epochs[name]-midnight(previousDate));
        const event=stats.changes[name];event.pairs++;
        // One millisecond tolerance accommodates the public ISO millisecond carrier.
        if(Math.abs(change)>300001)event.overFiveMinutes++;
        if(Math.abs(change)>600001)event.overTenMinutes++;
        if(Math.abs(change)/1000>event.maximumAbsoluteSeconds){event.maximumAbsoluteSeconds=Math.abs(change)/1000;
          event.witness={from:previousDate,to:date,fromUtc:previous.events[name],toUtc:row.events[name],signedSeconds:change/1000,
            fromStatus:previous.statuses?.[name]??null,toStatus:row.statuses?.[name]??null};}
      }
    }
  }
  return{limits:'Behavior comparison only: coverage, chronology and unwrapped UTC phase changes. No official-calendar, observed-twilight or religious accuracy claim.',
    clockFrame:'epoch(event) minus UTC midnight of source date; adjacent phase differences without modulo; DST display changes excluded',
    years,cities,plannedDays:[...groups.values()].reduce((n,s)=>n+s.plannedDays,0),suppliedRows:rows.length,groups:[...groups.values()]};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const [input,output,...rest]=process.argv.slice(2);
  if(!input||rest.length)throw new Error('Usage: node scripts/oss-relative/analyze.mjs INPUT.jsonl [OUTPUT.json]');
  const rows=await readRows(input),years=[...new Set(rows.map(row=>Number(row.date.slice(0,4))))].sort();
  const report=analyzeRows(rows,{years});
  const json=JSON.stringify(report,null,2)+'\n';if(output)await writeFile(output,json);else process.stdout.write(json);
}
