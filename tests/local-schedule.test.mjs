import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateLocalSchedule,enforceCrossDayPrayerOrder,nextLocalPrayer,PRAYER_STARTS} from '../core/local/schedule.mjs';
import {LOCAL_PROFILE,LOCAL_SEASONAL_PROFILE} from '../core/local/profiles.mjs';

const base={startDate:'2027-03-26',dayCount:5,latitude:50.11,longitude:8.68,timeZone:'Europe/Berlin',profile:LOCAL_PROFILE};

test('schedule returns chronologically sorted prayer starts across a DST change with source-day ownership',()=>{
  const schedule=calculateLocalSchedule(base);
  assert.equal(schedule.status,'complete');assert.equal(schedule.complete,true);assert.equal(schedule.partial,false);
  assert.equal(schedule.days.length,5);assert.equal(schedule.entries.length,25);assert.equal(schedule.missing.length,0);
  for(let i=1;i<schedule.entries.length;i++)assert.ok(schedule.entries[i].epochMilliseconds>=schedule.entries[i-1].epochMilliseconds);
  assert.ok(schedule.entries.every(entry=>PRAYER_STARTS.includes(entry.event)&&entry.role==='prayer-start-model'));
  const dhuhr26=schedule.entries.find(entry=>entry.sourceDate==='2027-03-26'&&entry.event==='dhuhr');
  const dhuhr28=schedule.entries.find(entry=>entry.sourceDate==='2027-03-28'&&entry.event==='dhuhr');
  assert.equal(dhuhr26.localDate,dhuhr26.sourceDate);assert.equal(dhuhr28.localDate,dhuhr28.sourceDate);
  const solarElapsed=dhuhr28.epochMilliseconds-dhuhr26.epochMilliseconds;
  assert.ok(Math.abs(solarElapsed-48*60*60_000)<2*60_000);
  const displayedDelta=(Number(dhuhr28.displayTime.slice(0,2))*60+Number(dhuhr28.displayTime.slice(3)))
    -(Number(dhuhr26.displayTime.slice(0,2))*60+Number(dhuhr26.displayTime.slice(3)));
  assert.ok(displayedDelta>=58&&displayedDelta<=60,'civil display advances by the DST offset while UTC solar instants stay continuous');
  assert.ok(Number.isFinite(dhuhr26.rawEpochMilliseconds));
  assert.ok(Math.abs(dhuhr26.epochMilliseconds-dhuhr26.rawEpochMilliseconds)<=.5);
  assert.equal(schedule.signature,schedule.context&&JSON.stringify(schedule.context));
  assert.ok(schedule.id.includes(schedule.signature));
  assert.ok(schedule.entries.every(entry=>entry.id.includes(entry.sourceDate)&&entry.id.includes(entry.event)));
});

test('after-midnight Isha keeps its actual local date and next-prayer uses an explicit UTC epoch',()=>{
  const schedule=calculateLocalSchedule({startDate:'2027-06-20',dayCount:3,latitude:50.11,longitude:-20,
    timeZone:'Europe/Berlin',profile:LOCAL_SEASONAL_PROFILE});
  const isha=schedule.entries.find(entry=>entry.event==='isha'&&entry.sourceDate==='2027-06-20');
  assert.ok(isha);assert.equal(isha.localDate,'2027-06-21');assert.equal(isha.sourceDate,'2027-06-20');
  assert.equal(new Date(isha.epochMilliseconds).toISOString(),isha.utc);
  assert.equal(nextLocalPrayer(schedule,isha.epochMilliseconds).event,'isha');
  const following=nextLocalPrayer(schedule,isha.epochMilliseconds+1);
  assert.equal(following.event,'fajr');assert.equal(following.sourceDate,'2027-06-21');
  assert.equal(nextLocalPrayer(schedule,schedule.entries.at(-1).epochMilliseconds+1),null);
  following.event='mutated';
  assert.equal(nextLocalPrayer(schedule,isha.epochMilliseconds+1).event,'fajr');
});

test('schedule preserves the seconds-display date when nearest-minute date differs',()=>{
  const schedule=calculateLocalSchedule({startDate:'2027-06-20',dayCount:1,latitude:50,longitude:170,
    timeZone:'America/Adak',profile:LOCAL_PROFILE});
  const maghrib=schedule.entries.find(entry=>entry.event==='maghrib');
  assert.ok(maghrib);
  assert.equal(maghrib.displayTime,'00:00');
  assert.equal(maghrib.calendarDate,'2027-06-21');
  assert.equal(maghrib.displaySeconds,'23:59:49');
  assert.equal(maghrib.displaySecondsDate,'2027-06-20');
});

test('partial angle profiles expose only prayer starts and retain omitted-marker reasons',()=>{
  const schedule=calculateLocalSchedule({...base,startDate:'2027-03-20',dayCount:2,latitude:40.7128,longitude:-74.006,
    timeZone:'America/New_York',profile:'fcna-usa-2017-point-v1'});
  assert.equal(schedule.status,'partial');assert.equal(schedule.complete,false);
  assert.equal(schedule.entries.length,4);
  assert.ok(schedule.entries.every(entry=>entry.event==='fajr'||entry.event==='isha'));
  assert.equal(schedule.missing.length,6);
  assert.deepEqual([...new Set(schedule.missing.map(item=>item.event))].sort(),['asr','dhuhr','maghrib']);
  assert.ok(schedule.missing.every(item=>item.reason==='profile-does-not-identify-prayer-start'
    &&item.status==='policy-blocked'&&item.sourceStatus==='calculated'));
});

test('polar policy-blocked starts stay explicit and do not become entries',()=>{
  const schedule=calculateLocalSchedule({startDate:'2027-06-20',dayCount:1,latitude:80,longitude:0,timeZone:'UTC',profile:LOCAL_PROFILE});
  assert.equal(schedule.status,'partial');
  assert.deepEqual(schedule.entries.map(entry=>entry.event),['dhuhr','asr']);
  assert.ok(schedule.missing.some(item=>item.event==='fajr'&&item.status==='policy-blocked'));
  assert.ok(schedule.missing.some(item=>item.event==='maghrib'&&item.status==='policy-blocked'));
});

test('skipped civil dates are visible as unavailable source days in a partial schedule',()=>{
  const schedule=calculateLocalSchedule({startDate:'2011-12-29',dayCount:3,latitude:-13.83,longitude:-171.75,
    timeZone:'Pacific/Apia',profile:LOCAL_PROFILE});
  assert.equal(schedule.status,'partial');
  const skipped=schedule.days.find(day=>day.sourceDate==='2011-12-30');
  assert.equal(skipped.status,'unavailable');assert.equal(skipped.reason,'solar-date-unavailable');
  assert.equal(schedule.missing.filter(item=>item.sourceDate==='2011-12-30').length,5);
  assert.ok(schedule.missing.filter(item=>item.sourceDate==='2011-12-30').every(item=>item.status==='unavailable'));
});

test('schedule signatures change with profile, coordinates, timezone, dates and calculation context',()=>{
  const first=calculateLocalSchedule(base);
  for(const change of [
    {profile:'egypt-published-angles-point-v1'},
    {latitude:50.12},
    {longitude:8.69},
    {timeZone:'Europe/Paris'},
    {startDate:'2027-03-27'},
    {dayCount:4},
  ])assert.notEqual(calculateLocalSchedule({...base,...change}).signature,first.signature);
  assert.ok(first.context.dateFingerprints.every(day=>day.status==='calculated'
    ?Object.values(day.events).every(event=>Object.hasOwn(event,'dateOffset')):day.status==='unavailable'));
});

test('overlapping windows produce the same compact source-owner event IDs',()=>{
  const earlier=calculateLocalSchedule({...base,startDate:'2027-03-25',dayCount:7});
  const later=calculateLocalSchedule({...base,startDate:'2027-03-26',dayCount:6});
  for(const event of PRAYER_STARTS){
    const a=earlier.entries.find(item=>item.sourceDate==='2027-03-28'&&item.event===event);
    const b=later.entries.find(item=>item.sourceDate==='2027-03-28'&&item.event===event);
    assert.ok(a&&b);assert.equal(a.id,b.id);
    assert.ok(a.id.length<250,'entry IDs remain compact and independent of window signature');
  }
  assert.notEqual(earlier.signature,later.signature);
});

test('cross-day Isha/Fajr reversals block the later source-owned Fajr and update counts',()=>{
  const sourceDates=['2027-01-01','2027-01-02','2027-01-03','2027-01-04'];
  const entry=(sourceDate,event,epoch)=>({sourceDate,event,role:'prayer-start-model',status:'calculated',
    epochMilliseconds:epoch,utc:new Date(epoch).toISOString(),localDate:sourceDate,rule:'test',resolution:'model-instant'});
  const original=[entry(sourceDates[0],'isha',100),entry(sourceDates[1],'fajr',90),
    entry(sourceDates[1],'dhuhr',110),entry(sourceDates[1],'asr',110),
    entry(sourceDates[1],'isha',200),entry(sourceDates[2],'fajr',190),
    entry(sourceDates[2],'isha',300),entry(sourceDates[3],'fajr',310)];
  const days=sourceDates.map(sourceDate=>({sourceDate,status:'complete',complete:true,entryCount:5,missingCount:0}));
  const result=enforceCrossDayPrayerOrder({sourceDates,entries:original,missing:[],days});
  assert.equal(result.entries.some(item=>item.sourceDate===sourceDates[1]&&item.event==='fajr'),false);
  assert.equal(result.entries.some(item=>item.sourceDate===sourceDates[2]&&item.event==='fajr'),false);
  assert.equal(result.entries.some(item=>item.sourceDate===sourceDates[1]&&item.event==='isha'),true);
  assert.equal(result.entries.some(item=>item.sourceDate===sourceDates[1]&&item.event==='asr'),true,
    'cross-day guard does not reject the documented same-day Dhuhr/Asr equality');
  assert.deepEqual(result.missing.map(item=>[item.event,item.sourceDate,item.reason]),[
    ['fajr','2027-01-02','cross-day-event-order-conflict'],['fajr','2027-01-03','cross-day-event-order-conflict'],
  ]);
  assert.equal(result.missing[0].detail.includes('2027-01-01'),true);
  assert.deepEqual(result.days.slice(0,3).map(day=>[day.status,day.complete,day.entryCount,day.missingCount]),[
    ['partial',false,1,0],['partial',false,3,1],['partial',false,1,1],
  ]);
  assert.deepEqual(original.map(item=>item.event),['isha','fajr','dhuhr','asr','isha','fajr','isha','fajr'],
    'pure reconciliation leaves its caller data untouched');
});

test('schedule input and next-prayer selection reject malformed, executable, and invalid values',()=>{
  for(const bad of [
    {...base,dayCount:0},{...base,dayCount:32},{...base,dayCount:1.5},
    {...base,startDate:'2098-12-31',dayCount:2},{...base,startDate:'2027-02-30'},
    {...base,latitude:90},{...base,longitude:181},{...base,timeZone:'+01:00'},
    {...base,timeZone:'Mars/Phobos'},{...base,profile:'unknown'},
  ])assert.throws(()=>calculateLocalSchedule(bad),RangeError);
  assert.throws(()=>calculateLocalSchedule({...base,extra:true}),TypeError);
  assert.throws(()=>calculateLocalSchedule({...base,profile:undefined}),TypeError);
  const getter={...base};Object.defineProperty(getter,'latitude',{enumerable:true,get(){throw new Error('must not execute');}});
  assert.throws(()=>calculateLocalSchedule(getter),TypeError);
  const schedule=calculateLocalSchedule(base);
  for(const now of [NaN,Infinity,1.5,'2027-01-01T00:00:00Z',8.64e15+1])assert.throws(()=>nextLocalPrayer(schedule,now),RangeError);
  const malicious={entries:[]};Object.defineProperty(malicious,'entries',{enumerable:true,get(){throw new Error('must not execute');}});
  assert.throws(()=>nextLocalPrayer(malicious,0),TypeError);
  const badEntry={};Object.defineProperty(badEntry,'epochMilliseconds',{enumerable:true,get(){throw new Error('must not execute');}});
  assert.throws(()=>nextLocalPrayer({entries:[badEntry]},0),TypeError);
  const marker={...schedule.entries[0],role:'sunrise-marker'};
  assert.throws(()=>nextLocalPrayer({entries:[marker]},0),TypeError);
  const reversed={entries:[schedule.entries[1],schedule.entries[0]]};
  assert.throws(()=>nextLocalPrayer(reversed,0),TypeError);
});

test('separate schedule calls and next-prayer results do not share mutable entries',()=>{
  const one=calculateLocalSchedule(base),two=calculateLocalSchedule(base);
  one.entries[0].event='changed';one.missing.push({event:'fake'});
  assert.notEqual(two.entries[0].event,'changed');assert.equal(two.missing.length,0);
  const upcoming=nextLocalPrayer(two,-8.64e15);
  upcoming.rule='changed';
  assert.notEqual(nextLocalPrayer(two,-8.64e15).rule,'changed');
});
