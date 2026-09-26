import test from 'node:test';
import assert from 'node:assert/strict';
import {buildLocalSummerContext,selectSeasonalTwilight} from '../core/local/summer.mjs';

const MIN=60_000,DAY=86_400_000;
const iso=epoch=>new Date(epoch).toISOString().slice(0,10);
const utc=date=>Date.parse(`${date}T00:00:00Z`);

function northernFixture(year=2027,{missingFajr=[],missingIsha=[],nonseasonalFajr=[],ordinaryFajrDates=[],ordinaryIshaDates=[],badIshaDates=[],removeNightDates=[],forceJanFirstFajrCandidate=false}={}){
  const dates=[];
  for(let t=Date.UTC(year,0,1)-DAY;t<=Date.UTC(year+1,0,1);t+=DAY)dates.push(iso(t));
  const days={};
  const forceFraction=new Set();
  for(const date of missingFajr){const t=utc(date);forceFraction.add(iso(t-DAY));forceFraction.add(iso(t+DAY));}
  for(const date of missingIsha){const t=utc(date);forceFraction.add(iso(t-DAY));forceFraction.add(iso(t+DAY));}
  const forceIshaFraction=new Set();
  for(const date of missingIsha){const t=utc(date);forceIshaFraction.add(iso(t-DAY));forceIshaFraction.add(iso(t+DAY));}
  for(const date of dates){
    const midnight=utc(date),previousDate=iso(midnight-DAY),nextDate=iso(midnight+DAY);
    const previousStart=utc(previousDate);
    const prevNight={startDate:previousDate,endDate:date,ordinaryHorizonNightMinutes:720,
      maghribSelectedEpochMilliseconds:previousStart+18*60*MIN,sunriseEndSelectedEpochMilliseconds:midnight+6*60*MIN};
    const M=midnight+18*60*MIN,R=midnight+30*60*MIN;
    const nightToNext=date===dates.at(-1)||removeNightDates.includes(date)?null:{startDate:date,endDate:nextDate,
      ordinaryHorizonNightMinutes:720,maghribSelectedEpochMilliseconds:M,sunriseEndSelectedEpochMilliseconds:R};
    const fajrCandidate=prevNight.sunriseEndSelectedEpochMilliseconds-(11/8)*.1*720*MIN;
    const ishaCandidate=M+.1*720*MIN;
    let fajrRaw=fajrCandidate+30*MIN;
    if(forceFraction.has(date))fajrRaw=fajrCandidate;
    if(ordinaryFajrDates.includes(date))fajrRaw=fajrCandidate+30*MIN;
    if(forceJanFirstFajrCandidate&&date===`${year}-01-01`)fajrRaw=fajrCandidate;
    let ishaRaw=forceIshaFraction.has(date)?ishaCandidate:ishaCandidate-30*MIN;
    if(ordinaryIshaDates.includes(date))ishaRaw=ishaCandidate-30*MIN;
    if(badIshaDates.includes(date))ishaRaw=M-1;
    const fajrMissing=missingFajr.includes(date)||nonseasonalFajr.includes(date);
    const ishaMissing=missingIsha.includes(date);
    days[date]={fajr:{rawEpochMilliseconds:fajrMissing?null:fajrRaw,rawReason:fajrMissing
      ?nonseasonalFajr.includes(date)?'crossing-outside-solar-cycle':'sun-continuously-above-threshold':null},
      isha:{rawEpochMilliseconds:ishaMissing?null:ishaRaw,rawReason:ishaMissing?'tangent-without-directed-crossing':null},
      previousNight:date===dates[0]?null:prevNight,nightToNext};
  }
  // The boundary rows use exact candidate geometry as the builder expects.
  return{status:'available',reason:null,metadata:{year,q:.1,anchorDate:`${year}-05-01`,horizonGatePassed:true},days};
}

test('seasonal selector has exact one-sided 20-minute edges and a continuous smoothstep',()=>{
  const candidate=1_000_000;
  const iOrd=selectSeasonalTwilight({event:'isha',rawEpochMilliseconds:candidate-20*MIN,candidateEpochMilliseconds:candidate});
  const iEst=selectSeasonalTwilight({event:'isha',rawEpochMilliseconds:candidate,candidateEpochMilliseconds:candidate});
  const fOrd=selectSeasonalTwilight({event:'fajr',rawEpochMilliseconds:candidate+20*MIN,candidateEpochMilliseconds:candidate});
  const fEst=selectSeasonalTwilight({event:'fajr',rawEpochMilliseconds:candidate,candidateEpochMilliseconds:candidate});
  assert.deepEqual([iOrd.mode,iOrd.weight,iOrd.selectedEpochMilliseconds],['ordinary',0,candidate-20*MIN]);
  assert.deepEqual([iEst.mode,iEst.weight,iEst.selectedEpochMilliseconds],['night-fraction',1,candidate]);
  assert.deepEqual([fOrd.mode,fOrd.weight,fOrd.selectedEpochMilliseconds],['ordinary',0,candidate+20*MIN]);
  assert.deepEqual([fEst.mode,fEst.weight,fEst.selectedEpochMilliseconds],['night-fraction',1,candidate]);
  for(const event of ['fajr','isha']){
    const band=event==='isha'?[candidate-15*MIN,candidate-10*MIN,candidate-5*MIN]:[candidate+15*MIN,candidate+10*MIN,candidate+5*MIN];
    const selected=band.map(raw=>selectSeasonalTwilight({event,rawEpochMilliseconds:raw,candidateEpochMilliseconds:candidate}));
    assert.ok(selected.every(item=>item.mode==='transition'&&item.weight>0&&item.weight<1));
    assert.ok(selected[0].weight<selected[1].weight&&selected[1].weight<selected[2].weight);
    assert.ok(selected.every(item=>item.selectedEpochMilliseconds>=Math.min(item.rawEpochMilliseconds,candidate)
      &&item.selectedEpochMilliseconds<=Math.max(item.rawEpochMilliseconds,candidate)));
  }
  for(const event of ['fajr','isha']){
    const ordinaryRaw=event==='isha'?candidate-20*MIN:candidate+20*MIN;
    const innerRaw=event==='isha'?candidate-20*MIN+1:candidate+20*MIN-1;
    const justBeforeCandidate=event==='isha'?candidate-1:candidate+1;
    const outer=selectSeasonalTwilight({event,rawEpochMilliseconds:ordinaryRaw,candidateEpochMilliseconds:candidate});
    const inside=selectSeasonalTwilight({event,rawEpochMilliseconds:innerRaw,candidateEpochMilliseconds:candidate});
    const near=selectSeasonalTwilight({event,rawEpochMilliseconds:justBeforeCandidate,candidateEpochMilliseconds:candidate});
    const midpoint=selectSeasonalTwilight({event,rawEpochMilliseconds:event==='isha'?candidate-10*MIN:candidate+10*MIN,candidateEpochMilliseconds:candidate});
    assert.equal(outer.mode,'ordinary');
    assert.ok(inside.mode==='transition'&&inside.weight>0);
    assert.ok(near.mode==='transition'&&near.weight<1);
    assert.equal(midpoint.weight,.5);
  }
});

test('missing raw twilight is estimated only for the two proven seasonal absence reasons',()=>{
  for(const reason of ['sun-continuously-above-threshold','tangent-without-directed-crossing']){
    const result=selectSeasonalTwilight({event:'fajr',rawEpochMilliseconds:null,candidateEpochMilliseconds:42,absenceReason:reason});
    assert.deepEqual([result.status,result.mode,result.selectedEpochMilliseconds,result.weight],['estimated','night-fraction',42,1]);
  }
  assert.throws(()=>selectSeasonalTwilight({event:'isha',rawEpochMilliseconds:null,candidateEpochMilliseconds:42}),/requires a proven/);
  assert.throws(()=>selectSeasonalTwilight({event:'isha',rawEpochMilliseconds:null,candidateEpochMilliseconds:42,absenceReason:'no-crossing'}),/requires a proven/);
  assert.throws(()=>selectSeasonalTwilight({event:'fajr',rawEpochMilliseconds:42,candidateEpochMilliseconds:43,absenceReason:'sun-continuously-above-threshold'}),/only valid/);
});

test('annual policy freezes q, preserves ordinary boundary events and selects full night-fraction at a seasonal gap',()=>{
  const year=2027,missing=`${year}-06-15`,source=northernFixture(year,{missingFajr:[missing]});
  const selected=buildLocalSummerContext(source);
  assert.equal(selected.status,'available');
  assert.equal(selected.metadata.q,.1);
  assert.equal(selected.metadata.qFrozenForWholeYear,true);
  assert.equal(Object.keys(selected.days).length,365);
  assert.equal(selected.days[missing].fajr.mode,'night-fraction');
  assert.equal(selected.days[`${year}-06-14`].fajr.mode,'night-fraction');
  assert.equal(selected.days[`${year}-06-16`].fajr.mode,'night-fraction');
  assert.equal(selected.days[`${year}-01-01`].fajr.mode,'ordinary');
  assert.equal(selected.days[`${year}-12-31`].isha.mode,'ordinary');
  assert.equal(selected.metadata.fajrFactor,11/8);
});

test('annual policy blocks a nonordinary year seam and unsupported padding year',()=>{
  const boundary=buildLocalSummerContext(northernFixture(2027,{forceJanFirstFajrCandidate:true}));
  assert.equal(boundary.status,'blocked');
  assert.equal(boundary.reason,'annual-boundary-event-not-ordinary');
  const edge=buildLocalSummerContext({status:'blocked',reason:'padded-year-outside-solar-domain',
    metadata:{year:2001,q:null,anchorDate:null,horizonGatePassed:false},days:{}});
  assert.equal(edge.status,'blocked');
  assert.equal(edge.reason,'padded-year-outside-solar-domain');
  assert.equal(Object.keys(edge.days).length,365);
});

test('annual policy rejects missing twilight on either outer padded edge',()=>{
  const prevIsha=buildLocalSummerContext(northernFixture(2027,{missingIsha:['2026-12-31']}));
  assert.equal(prevIsha.status,'blocked');
  assert.equal(prevIsha.reason,'seasonal-transition-not-complete-at-sign-boundary');
  const nextFajr=buildLocalSummerContext(northernFixture(2027,{missingFajr:['2028-01-01']}));
  assert.equal(nextFajr.status,'blocked');
  assert.equal(nextFajr.reason,'seasonal-transition-not-complete-at-sign-boundary');
});

test('annual policy rejects nonseasonal absence and unfinished transition at a raw-sign edge',()=>{
  const nonseasonal=buildLocalSummerContext(northernFixture(2027,{nonseasonalFajr:['2027-06-15']}));
  assert.equal(nonseasonal.status,'blocked');
  assert.equal(nonseasonal.reason,'raw-twilight-unavailable-for-nonseasonal-reason');
  const unfinished=buildLocalSummerContext(northernFixture(2027,{missingFajr:['2027-06-15'],ordinaryFajrDates:['2027-06-14']}));
  assert.equal(unfinished.status,'blocked');
  assert.equal(unfinished.reason,'seasonal-transition-not-complete-at-sign-boundary');
});

test('annual policy blocks incomplete padded nights and selected events outside dusk-to-dawn',()=>{
  const incomplete=buildLocalSummerContext(northernFixture(2027,{removeNightDates:['2027-04-11']}));
  assert.equal(incomplete.status,'blocked');
  assert.equal(incomplete.reason,'padded-night-candidate-unavailable');
  const outside=buildLocalSummerContext(northernFixture(2027,{badIshaDates:['2027-04-11']}));
  assert.equal(outside.status,'blocked');
  assert.equal(outside.reason,'selected-events-outside-physical-night');
});

test('independent Isha absence needs both neighboring rows fully on the night fraction',()=>{
  const gap=buildLocalSummerContext(northernFixture(2027,{missingIsha:['2027-06-15']}));
  assert.equal(gap.status,'available');
  assert.equal(gap.days['2027-06-15'].isha.mode,'night-fraction');
  assert.equal(gap.days['2027-06-14'].isha.mode,'night-fraction');
  assert.equal(gap.days['2027-06-16'].isha.mode,'night-fraction');
  const partial=buildLocalSummerContext(northernFixture(2027,{missingIsha:['2027-06-15'],ordinaryIshaDates:['2027-06-14']}));
  assert.equal(partial.status,'blocked');
  assert.equal(partial.reason,'seasonal-transition-not-complete-at-sign-boundary');
});
