import test from 'node:test';
import assert from 'node:assert/strict';
import {get} from 'node:http';
import {createLocalAppServer} from '../scripts/local-app.mjs';

test('local app exposes complete dated point schedules without external services or arbitrary files',async t=>{
  const server=createLocalAppServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const base=`http://127.0.0.1:${server.address().port}`;
  const page=await fetch(base+'/');assert.equal(page.status,200);assert.match(await page.text(),/Gebetszeiten berechnen/);
  assert.match(page.headers.get('content-security-policy'),/connect-src 'self'/);
  const profiles=await(await fetch(base+'/api/profiles')).json();
  assert.ok(profiles.profiles.some(p=>p.id==='local-18-17-shadow1-physical-v1'));
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
