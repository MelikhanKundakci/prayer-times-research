import test from 'node:test';
import assert from 'node:assert/strict';
import {apparentGeocentricCoordinatesSPA} from '../core/astronomy/spa-point.mjs';
import {solarCoordinatesSPATopocentric} from '../core/astronomy/spa-topocentric.mjs';
import {calculateLocalSolarDay} from '../core/local/solar.mjs';
import {calculateLocalTopocentricSolarDay} from '../core/local/solar-topocentric.mjs';

const RAD=Math.PI/180,DAY=86_400_000;
const julian=epoch=>epoch/DAY+2440587.5;
const base={date:'2027-03-20',latitude:41.01,longitude:28.97,timeZone:'Europe/Istanbul'};
const names=['fajr','sunrise','dhuhr','asr','maghrib','isha'];

// A Cartesian observer-to-Sun vector independently checks the angular adapter.
// The observer sits on SPA's flattened reference surface, at fixed height zero.
function observerVectorAltitude(epoch,latitude,longitude){
  const sun=apparentGeocentricCoordinatesSPA(julian(epoch));
  const phi=latitude*RAD,delta=sun.declination*RAD;
  const h=(sun.apparentSiderealTime+longitude-sun.rightAscension)*RAD;
  const u=Math.atan(0.99664719*Math.tan(phi));
  const scale=Math.sin(8.794/(3600*sun.earthSunDistanceAu)*RAD);
  const x=Math.cos(delta)*Math.cos(h)-Math.cos(u)*scale;
  const y=Math.cos(delta)*Math.sin(h);
  const z=Math.sin(delta)-0.99664719*Math.sin(u)*scale;
  return Math.asin((x*Math.cos(phi)+z*Math.sin(phi))/Math.hypot(x,y,z))/RAD;
}

test('topocentric coordinates agree with the observer-to-Sun vector and explicit conventions',()=>{
  for(const latitude of [-89,-50,0,41.01,67.28324,89]){
    for(const hour of [0,6,12,18]){
      const epoch=Date.parse(`2027-03-20T${String(hour).padStart(2,'0')}:00:00Z`);
      const longitude=28.97,sun=solarCoordinatesSPATopocentric(julian(epoch),latitude,longitude);
      const height=Math.asin(Math.sin(latitude*RAD)*Math.sin(sun.declination*RAD)
        +Math.cos(latitude*RAD)*Math.cos(sun.declination*RAD)*Math.cos(sun.topocentricHourAngleDegrees*RAD))/RAD;
      assert.ok(Math.abs(height-observerVectorAltitude(epoch,latitude,longitude))<1e-10);
      const utcHours=hour,adapted=(utcHours+longitude/15+sun.equationOfTimeHours-12)*15;
      const phaseError=((adapted-sun.topocentricHourAngleDegrees+540)%360)-180;
      assert.ok(Math.abs(phaseError)<1e-10);
      assert.equal(sun.observerElevationMetres,0);
      assert.equal(sun.topocentricParallax,true);
      assert.equal(sun.atmosphericRefractionApplied,false);
      assert.equal(sun.deltaTSeconds,69.184);
      assert.equal(sun.assumedUt1MinusUtcSeconds,0);
    }
  }
});

test('corrected roots satisfy all thresholds and the corrected fixed-noon shadow',()=>{
  for(const date of ['2027-03-20','2027-06-21','2027-09-23','2027-12-21']){
    for(const asrShadowFactor of [1,2]){
      const day=calculateLocalTopocentricSolarDay({...base,date,asrShadowFactor});
      let previous=-Infinity;
      for(const name of names){
        const event=day.events[name];
        assert.equal(event.status,'calculated',`${date}/${name}`);
        assert.ok(event.epochMilliseconds>previous,`${date}/${name} order`);
        previous=event.epochMilliseconds;
        if(name!=='dhuhr'){
          const physical=observerVectorAltitude(event.epochMilliseconds,base.latitude,base.longitude);
          assert.ok(Math.abs(physical-event.thresholdDegrees)<1e-6,`${date}/${name} altitude`);
        }
      }
      const noon=observerVectorAltitude(day.transit.epochMilliseconds,base.latitude,base.longitude);
      const asr=observerVectorAltitude(day.events.asr.epochMilliseconds,base.latitude,base.longitude);
      const addedShadow=1/Math.tan(asr*RAD)-1/Math.tan(noon*RAD);
      assert.ok(Math.abs(addedShadow-asrShadowFactor)<1e-6,`${date} factor ${asrShadowFactor}`);
      assert.equal(day.model.temkinApplied,false);
    }
  }
});

test('ordinary parallax delays sunrise and advances sunset while retaining meridian ownership',()=>{
  const local=calculateLocalTopocentricSolarDay(base);
  const geocentric=calculateLocalSolarDay({...base,solarModel:'spa'});
  assert.ok(local.events.sunrise.epochMilliseconds>geocentric.events.sunrise.epochMilliseconds);
  assert.ok(local.events.maghrib.epochMilliseconds<geocentric.events.maghrib.epochMilliseconds);
  assert.ok(Math.abs(local.transit.epochMilliseconds-geocentric.transit.epochMilliseconds)<0.1);
  for(const field of ['startEpochMilliseconds','endEpochMilliseconds']){
    assert.ok(Math.abs(local.solarCycle[field]-geocentric.solarCycle[field])<0.1);
  }
  assert.equal(geocentric.model.topocentricParallax,false);
  assert.equal(local.model.id,'SPA-topocentric-continuous-point-v1');
});

test('date-line aliases, leap date and time-zone display preserve physical cycle identity',()=>{
  const input={date:'2028-02-29',latitude:50,longitude:180,timeZone:'Asia/Anadyr'};
  const east=calculateLocalTopocentricSolarDay(input);
  assert.deepEqual(east,calculateLocalTopocentricSolarDay({...input,longitude:-180}));
  const berlin={date:'2027-03-28',latitude:50.11,longitude:8.68,timeZone:'Europe/Berlin'};
  const a=calculateLocalTopocentricSolarDay(berlin);
  const b=calculateLocalTopocentricSolarDay({...berlin,timeZone:'UTC'});
  assert.deepEqual(a.events,b.events);
  assert.deepEqual(a.solarCycle,b.solarCycle);
  assert.throws(()=>calculateLocalTopocentricSolarDay({date:'2011-12-30',latitude:-13.83,longitude:-171.75,timeZone:'Pacific/Apia'}),RangeError);
});

test('polar unavailable geometry remains explicit without substitutions',()=>{
  const summer=calculateLocalTopocentricSolarDay({date:'2027-06-21',latitude:89,longitude:0,timeZone:'UTC'});
  for(const name of ['fajr','sunrise','maghrib','isha']){
    assert.equal(summer.events[name].status,'unavailable');
    assert.equal(summer.events[name].epochMilliseconds,null);
  }
  const winter=calculateLocalTopocentricSolarDay({date:'2027-12-21',latitude:89,longitude:0,timeZone:'UTC'});
  assert.equal(winter.events.asr.status,'unavailable');
  assert.equal(winter.events.asr.reason,'sun-not-above-geometric-horizon-at-transit');
});

test('observer entrypoint enforces explicit data and rejects model/elevation/coercion knobs',()=>{
  for(const extra of [{solarModel:'spa'},{observerElevationMetres:100},{elevation:0},{fajrAngleDegrees:undefined},
    {latitude:'41.01'},{longitude:Infinity},{date:'2027-02-29'},{timeZone:'+02:00'},{asrShadowFactor:1.5},
    {date:'2000-12-31'},{date:'2099-01-01'},{latitude:89.01},{horizonDepressionDegrees:0}]){
    assert.throws(()=>calculateLocalTopocentricSolarDay({...base,...extra}));
  }
  let getterCalls=0;
  const input={...base};Object.defineProperty(input,'latitude',{enumerable:true,get(){getterCalls++;return 41.01;}});
  assert.throws(()=>calculateLocalTopocentricSolarDay(input),TypeError);
  assert.equal(getterCalls,0);
  assert.throws(()=>calculateLocalTopocentricSolarDay(Object.assign(Object.create(null),base)),TypeError);
  assert.throws(()=>calculateLocalTopocentricSolarDay({...base,[Symbol('unknown')]:1}),TypeError);
  assert.throws(()=>solarCoordinatesSPATopocentric(2461500,41,29,0),TypeError);
  assert.throws(()=>solarCoordinatesSPATopocentric('2461500',41,29),TypeError);
  assert.throws(()=>solarCoordinatesSPATopocentric(2461500,91,29),RangeError);
});
