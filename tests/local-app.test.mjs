import test from 'node:test';
import assert from 'node:assert/strict';
import {get} from 'node:http';
import {createLocalAppServer} from '../scripts/local-app.mjs';
import {compareDiyanetPointDay} from '../core/diagnostics/diyanet-comparison.mjs';

test('Sunni family catalogue and every family default produce matching day/schedule results',async t=>{
  const server=createLocalAppServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const base=`http://127.0.0.1:${server.address().port}`;
  const catalog=await(await fetch(base+'/api/profiles')).json();
  assert.deepEqual(catalog.methods.map(m=>m.id),['mwl','karachi','egyptian','umm-al-qura','isna','diyanet','kemenag','jakim']);
  assert.equal(catalog.profiles.length,69);
  assert.equal(new Set(catalog.profiles.map(p=>p.id)).size,69);
  for(const method of catalog.methods){
    assert.ok(method.profiles.every(id=>catalog.profiles.some(p=>p.id===id)));
    const location=method.id==='kemenag'?{latitude:-6.2,longitude:106.8,timeZone:'Asia/Jakarta'}
      :method.id==='jakim'?{latitude:3.139,longitude:101.6869,timeZone:'Asia/Kuala_Lumpur'}
      :{latitude:21.4225,longitude:39.8262,timeZone:'Asia/Riyadh'};
    const response=await fetch(base+'/api/calculate',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({date:'2027-03-20',...location,profile:method.defaultProfile})});
    assert.equal(response.status,200,method.id);
    const {day,schedule}=await response.json();
    assert.equal(day.profile.id,method.defaultProfile);
    assert.equal(day.coverage.prayerStartsComplete,true,method.id);
    assert.equal(schedule.context.calculationVersion,day.calculation.version);
    assert.equal(schedule.entries.length,40);
    for(const entry of schedule.entries.filter(e=>e.sourceDate===day.date))
      assert.equal(entry.epochMilliseconds,day.events[entry.event].epochMilliseconds);
  }
});

test('reference-night option is limited to the sourced families and stays estimated through the schedule',async t=>{
  const server=createLocalAppServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const base=`http://127.0.0.1:${server.address().port}`;
  const catalog=await(await fetch(base+'/api/profiles')).json();
  assert.deepEqual(catalog.methods.filter(m=>m.nightModes.includes('reference45')).map(m=>m.id),['mwl','egyptian']);
  for(const family of ['mwl','egyptian']){
    const profile=`sunni-${family}-shadow2-reference45-v1`;
    const response=await fetch(base+'/api/calculate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
      date:'2027-06-21',latitude:50.1109,longitude:8.6821,timeZone:'Europe/Berlin',profile})});
    assert.equal(response.status,200);
    const {day,schedule}=await response.json();
    assert.equal(day.profile.id,profile);assert.equal(day.profile.official,false);
    assert.equal(day.coverage.prayerStartsComplete,true);assert.equal(schedule.complete,true);
    assert.deepEqual(day.coverage.estimatedEvents,['fajr','isha']);
    assert.equal(schedule.context.calculationVersion,day.calculation.version);
    assert.equal(schedule.entries.length,40);
    for(const entry of schedule.entries.filter(e=>e.sourceDate===day.date)){
      assert.equal(entry.epochMilliseconds,day.events[entry.event].epochMilliseconds);
      assert.equal(entry.status,day.events[entry.event].status);
    }
  }
});

test('local relative summer transitions are an explicit MWL option with consistent schedule instants',async t=>{
  const server=createLocalAppServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const base=`http://127.0.0.1:${server.address().port}`;
  const catalog=await(await fetch(base+'/api/profiles')).json();
  assert.deepEqual(catalog.methods.filter(m=>m.nightModes.includes('local-relative')).map(m=>m.id),['mwl']);
  assert.equal(catalog.methods.find(m=>m.id==='mwl').defaultProfile,'sunni-mwl-shadow1-physical-v1');
  const profile='sunni-mwl-shadow2-local-relative-v1';
  const response=await fetch(base+'/api/calculate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
    date:'2027-06-21',latitude:50.1109,longitude:8.6821,timeZone:'Europe/Berlin',profile})});
  assert.equal(response.status,200);
  const {day,schedule}=await response.json();
  assert.equal(day.profile.id,profile);assert.equal(day.profile.official,false);
  assert.equal(day.coverage.prayerStartsComplete,true);assert.equal(schedule.complete,true);
  assert.deepEqual(day.coverage.estimatedEvents,['fajr','isha']);
  assert.equal(schedule.context.calculationVersion,day.calculation.version);
  for(const entry of schedule.entries.filter(e=>e.sourceDate===day.date)){
    assert.equal(entry.epochMilliseconds,day.events[entry.event].epochMilliseconds);
    assert.equal(entry.status,day.events[entry.event].status);
  }
});

test('local app exposes complete dated point schedules without external services or arbitrary files',async t=>{
  const server=createLocalAppServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const base=`http://127.0.0.1:${server.address().port}`;
  const page=await fetch(base+'/');assert.equal(page.status,200);assert.match(await page.text(),/Calculate prayer times/);
  assert.match(page.headers.get('content-security-policy'),/connect-src 'self'/);
  const profiles=await(await fetch(base+'/api/profiles')).json();
  assert.ok(profiles.profiles.some(p=>p.id==='local-18-17-shadow1-physical-v1'));
  assert.ok(profiles.profiles.some(p=>p.id==='diyanet-published-spa-point-v1'));
  assert.ok(profiles.profiles.some(p=>p.id==='local-18-17-shadow1-physical-observer-v1'));
  assert.equal((await fetch(base+'/i18n.mjs')).status,200);
  const response=await fetch(base+'/api/calculate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
    date:'2027-03-20',latitude:30.0444,longitude:31.2357,timeZone:'Africa/Cairo',profile:'local-18-17-shadow1-physical-v1'})});
  assert.equal(response.status,200);const result=await response.json();
  assert.equal(result.day.coverage.prayerStartsComplete,true);assert.equal(result.schedule.entries.length,40);assert.equal(result.schedule.complete,true);
  assert.deepEqual(result.displayRange,{startDate:'2027-03-20',dayCount:7,precedingSolarDayIncluded:true});
  assert.equal(result.schedule.context.startDate,'2027-03-19');
  const overnight=await(await fetch(base+'/api/calculate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
    date:'2027-06-21',latitude:50.11,longitude:-20,timeZone:'Europe/Berlin',profile:'local-18-17-shadow1-angle-night-v1'})})).json();
  assert.ok(overnight.schedule.entries.some(e=>e.event==='isha'&&e.sourceDate==='2027-06-20'&&e.localDate==='2027-06-21'));
  assert.equal((await fetch(base+'/api/calculate',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,400);
  assert.equal((await fetch(base+'/api/calculate',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://example.com'},body:'{}'})).status,403);
  // Fetch normalizes Host; use the low-level client to send the hostile header.
  const hostileHostStatus=await new Promise((resolve,reject)=>{
    get(base+'/api/profiles',{headers:{Host:'attacker.example'}},res=>{res.resume();resolve(res.statusCode);}).on('error',reject);
  });
  assert.equal(hostileHostStatus,403);
  for(const path of ['/package.json','/.git/config','/core/local/index.mjs','/api/profiles?extra=1'])assert.equal((await fetch(base+path)).status,404);
});

test('local app exposes opt-in observer astronomy consistently in its day and schedule',async t=>{
  const server=createLocalAppServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const base=`http://127.0.0.1:${server.address().port}`;
  const input={date:'2027-03-20',latitude:30.0444,longitude:31.2357,timeZone:'Africa/Cairo',profile:'local-18-17-shadow1-physical-observer-v1'};
  const response=await fetch(base+'/api/calculate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});
  assert.equal(response.status,200);
  const {day,schedule}=await response.json();
  assert.equal(day.calculation.astronomicalModel.solarModel,'spa-topocentric');
  assert.equal(day.coverage.prayerStartsComplete,true);
  assert.equal(schedule.entries.length,40);
  assert.equal(schedule.context.calculationVersion,day.calculation.version);
  for(const event of schedule.entries.filter(e=>e.sourceDate===input.date))
    assert.equal(event.epochMilliseconds,day.events[event.event].epochMilliseconds);
});

test('local app calculates the opt-in Diyanet SPA profile through its day and schedule endpoints',async t=>{
  const server=createLocalAppServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const base=`http://127.0.0.1:${server.address().port}`;
  const response=await fetch(base+'/api/calculate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
    date:'2026-09-26',latitude:50.1109,longitude:8.6821,timeZone:'Europe/Berlin',profile:'diyanet-published-spa-point-v1'})});
  assert.equal(response.status,200);
  const {day,schedule}=await response.json();
  assert.equal(day.profile.id,'diyanet-published-spa-point-v1');
  assert.match(day.calculation.astronomicalModel.id,/SPA/);
  assert.equal(day.calculation.northernPolicy.metadata.solarModel,'spa');
  assert.equal(day.coverage.prayerStartsComplete,true);
  assert.equal(schedule.complete,true);
  assert.equal(schedule.entries.length,40);
  const today=schedule.entries.filter(e=>e.sourceDate==='2026-09-26');
  assert.equal(today.length,5);
  for(const event of today)assert.equal(event.epochMilliseconds,day.events[event.event].epochMilliseconds);
  assert.equal(day.profile.institutionalEquivalence,'not-claimed');
});

test('on-demand Diyanet comparison keeps source-free model results, domain failures and origin protections',async t=>{
  const server=createLocalAppServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const base=`http://127.0.0.1:${server.address().port}`;
  const input={date:'2026-09-26',latitude:50.1109,longitude:8.6821,timeZone:'Europe/Berlin'};
  const post=(path,value,headers={})=>fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(value)});
  const scheduleInput={...input,profile:'diyanet-published-spa-point-v1'};
  const before=await(await post('/api/calculate',scheduleInput)).json();
  const response=await post('/api/compare-diyanet',input);
  assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');
  const comparison=await response.json();assert.deepEqual(comparison,compareDiyanetPointDay(input));
  assert.equal(comparison.events.maghrib.roundedEpochDifferenceMilliseconds,-60000);
  assert.equal((await post('/api/compare-diyanet',{...input,latitude:80})).status,400);
  assert.equal((await post('/api/compare-diyanet',scheduleInput)).status,400);
  assert.equal((await post('/api/compare-diyanet',input,{Origin:'https://example.com'})).status,403);
  assert.equal((await fetch(base+'/api/compare-diyanet')).status,404);
  assert.deepEqual(await(await post('/api/calculate',scheduleInput)).json(),before);
  assert.equal((await fetch(base+'/comparison-view.mjs')).status,200);
});
