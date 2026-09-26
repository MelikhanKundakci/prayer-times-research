import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { buildNorthernContext } from '../northern.mjs';
import { buildLocalSummerContext, selectSeasonalTwilight } from '../summer.mjs';
import { calculateLocalSolarDay } from '../solar.mjs';

const fixtureUrl = new URL('./summer-fixtures.json', import.meta.url);
const MODES = ['ordinary', 'transition', 'night-fraction', 'unavailable'];
const MINUTE = 60000;

export function verifyLocalSummer() {
  const bytes = fs.readFileSync(fixtureUrl), fixture = JSON.parse(bytes);
  assert.equal(fixture.schema, 'independent-local-summer-oracle/v1');
  assert.equal(fixture.caseCount, 12);
  const stats = { result: 'PASS', cases: 0, availableContexts: 0, blockedContexts: 0,
    ownedDays: 0, selectedTimestampComparisons: 0, candidateTimestampComparisons: 0,
    blockedEventComparisons: 0, blendArithmeticChecks: 0, paddingChecks: 0,
    gapNeighborChecks: 0, nightOrderChecks: 0, sixEventOrderChecks: 0,
    maximumSelectedDifferenceSeconds: 0, maximumCandidateDifferenceSeconds: 0,
    maximumWeightDifference: 0, maximumPhaseJumpDifferenceMinutes: 0,
    fixtureSha256: crypto.createHash('sha256').update(bytes).digest('hex'),
    runtime: { node: process.version, icu: process.versions.icu, tzdb: process.versions.tz }, summaries: [] };
  function close(a, b, tolerance, label) {
    assert.ok(Number.isFinite(a) && Number.isFinite(b), `${label}: finite values`);
    const difference = Math.abs(a-b);
    assert.ok(difference <= tolerance, `${label}: ${difference} > ${tolerance}`);
    return difference;
  }
  for (const row of fixture.blendArithmetic) {
    const value = selectSeasonalTwilight({ event: row.event, rawEpochMilliseconds: row.physicalEpochSeconds * 1000,
      candidateEpochMilliseconds: row.candidateEpochSeconds * 1000 });
    assert.equal(value.mode, row.mode);
    close(value.weight, row.weight, 1e-12, 'synthetic blend weight');
    close(value.selectedEpochMilliseconds, row.value * 1000, 1e-6, 'synthetic blend time');
    stats.blendArithmeticChecks++;
  }
  for (const { input, expected } of fixture.cases) {
    const { id, ...parameters } = input;
    const north = buildNorthernContext(parameters);
    const summer = buildLocalSummerContext(north);
    stats.cases++;
    assert.equal(summer.status, expected.status, `${id}: annual preflight`);
    const dates = Object.keys(summer.days).sort();
    assert.deepEqual(dates, expected.rows.map(row => row[0]), `${id}: full owned dates`);
    stats.ownedDays += dates.length;
    const counts = { fajr: Object.fromEntries(MODES.map(m => [m,0])), isha: Object.fromEntries(MODES.map(m => [m,0])) };
    const solar = new Map();
    for (const row of expected.rows) {
      const [date, f, i, fMode, iMode, fWeight, iWeight, fCandidate, iCandidate] = row;
      for (const [event, target, code, weight, candidate] of [['fajr',f,fMode,fWeight,fCandidate],['isha',i,iMode,iWeight,iCandidate]]) {
        const actual = summer.days[date][event];
        assert.equal(actual.mode, MODES[code], `${id} ${date} ${event}: mode`);
        counts[event][actual.mode]++;
        if (target === null) {
          assert.equal(actual.status, 'policy-blocked', `${id} ${date} ${event}: unavailable selection`);
          assert.equal(actual.selectedEpochMilliseconds, null);
          stats.blockedEventComparisons++;
          continue;
        }
        assert.equal(actual.status, code === 0 ? 'calculated' : 'estimated', `${id} ${date} ${event}: provenance status`);
        const difference = close(actual.selectedEpochMilliseconds, target, 100, `${id} ${date} ${event}: selected instant`) / 1000;
        stats.maximumSelectedDifferenceSeconds = Math.max(stats.maximumSelectedDifferenceSeconds,difference);
        stats.selectedTimestampComparisons++;
        const cd = close(actual.candidateEpochMilliseconds,candidate,100,`${id} ${date} ${event}: candidate`) / 1000;
        stats.maximumCandidateDifferenceSeconds = Math.max(stats.maximumCandidateDifferenceSeconds,cd);
        stats.candidateTimestampComparisons++;
        const wd = close(actual.weight,weight,1e-7,`${id} ${date} ${event}: weight`);
        stats.maximumWeightDifference = Math.max(stats.maximumWeightDifference,wd);
        assert.ok(actual.weight >= 0 && actual.weight <= 1);
        assert.ok(event === 'fajr' ? actual.selectedEpochMilliseconds >= actual.candidateEpochMilliseconds : actual.selectedEpochMilliseconds <= actual.candidateEpochMilliseconds);
        if (actual.rawEpochMilliseconds !== null) assert.ok(actual.selectedEpochMilliseconds >= Math.min(actual.rawEpochMilliseconds,actual.candidateEpochMilliseconds) && actual.selectedEpochMilliseconds <= Math.max(actual.rawEpochMilliseconds,actual.candidateEpochMilliseconds));
      }
    }
    for (const event of ['fajr','isha']) {
      for (const mode of MODES) assert.equal(counts[event][mode],expected.counts[event][mode] ?? 0,`${id} ${event}: all mode counts`);
    }
    if (expected.status === 'blocked') {
      stats.blockedContexts++;
      stats.summaries.push({ id, status: 'blocked', counts });
      continue;
    }
    stats.availableContexts++;
    close(summer.metadata.q,expected.q,1e-8,`${id}: q`);
    assert.equal(summer.metadata.anchorDate ?? summer.metadata.qAnchorDate,expected.anchorDate);
    const base = { latitude:input.latitude,longitude:input.longitude,timeZone:input.timeZone,ishaAngleDegrees:16 };
    const padded = [`${input.year-1}-12-31`,...dates,`${input.year+1}-01-01`];
    for (const date of padded) solar.set(date,calculateLocalSolarDay({ ...base,date }));
    const selections = new Map(dates.map(date => [date,summer.days[date]]));
    const firstDate=padded[0],lastDate=padded.at(-1);
    const firstNight=north.days[firstDate].nightToNext,lastNight=north.days[dates.at(-1)].nightToNext;
    const firstCandidate=firstNight.maghribSelectedEpochMilliseconds+summer.metadata.q*firstNight.ordinaryHorizonNightMinutes*MINUTE;
    const lastCandidate=lastNight.sunriseEndSelectedEpochMilliseconds-(11/8)*summer.metadata.q*lastNight.ordinaryHorizonNightMinutes*MINUTE;
    selections.set(firstDate,{isha:selectSeasonalTwilight({event:'isha',rawEpochMilliseconds:solar.get(firstDate).events.isha.epochMilliseconds,candidateEpochMilliseconds:firstCandidate})});
    selections.set(lastDate,{fajr:selectSeasonalTwilight({event:'fajr',rawEpochMilliseconds:solar.get(lastDate).events.fajr.epochMilliseconds,candidateEpochMilliseconds:lastCandidate})});
    for (const check of expected.paddingPreflight) {
      const selected=selections.get(check.date)[check.event],raw=solar.get(check.date).events[check.event].epochMilliseconds;
      assert.equal(check.ordinaryAndUnchanged,true);
      assert.equal(selected.mode,'ordinary');
      assert.equal(selected.selectedEpochMilliseconds,raw);
      stats.paddingChecks++;
    }
    for (const gap of expected.gapPreflight) {
      assert.equal(gap.neighborsFullyCapped,true);
      assert.equal(gap.absenceProven,true);
      for (const date of [gap.beforeDate,gap.afterDate]) {
        const selected=selections.get(date)[gap.event];
        assert.equal(selected.mode,'night-fraction',`${id} ${gap.event}: complete cap at geometry boundary`);
        assert.equal(selected.weight,1);
        assert.notEqual(selected.rawEpochMilliseconds,null);
        stats.gapNeighborChecks++;
      }
      for (const date of padded.filter(d => gap.firstMissingDate<=d && d<=gap.lastMissingDate)) {
        const actual=solar.get(date).events[gap.event];
        assert.equal(actual.status,'unavailable');
        assert.ok(['sun-continuously-above-threshold','tangent-without-directed-crossing'].includes(actual.reason));
        assert.equal(selections.get(date)[gap.event].mode,'night-fraction');
      }
    }
    for (const sample of expected.physicalSamples) {
      const s=solar.get(sample.date);
      close(s.transit.epochMilliseconds,sample.transitEpochMilliseconds,100,`${id}: sampled independent transit`);
      for (const [event,key] of [['fajr','rawFajrEpochMilliseconds'],['isha','rawIshaEpochMilliseconds']]) {
        if (sample[key]===null) assert.equal(s.events[event].epochMilliseconds,null);
        else close(s.events[event].epochMilliseconds,sample[key],100,`${id}: independent raw ${event}`);
      }
    }
    for (let j=0;j<padded.length-1;j++) {
      const a=padded[j],b=padded[j+1],m=solar.get(a).events.maghrib.epochMilliseconds+7*MINUTE,r=solar.get(b).events.sunrise.epochMilliseconds-7*MINUTE;
      const i=selections.get(a).isha.selectedEpochMilliseconds,f=selections.get(b).fajr.selectedEpochMilliseconds;
      assert.ok(m<i&&i<f&&f<r,`${id} ${a}: full-night UTC order`);
      assert.ok(f-i>(5/24)*(r-m)-.001,`${id} ${a}: fraction-model night-gap lower bound`);
      stats.nightOrderChecks++;
    }
    for (const date of dates) {
      const a=summer.days[date],s=solar.get(date);
      const chain=[a.fajr.selectedEpochMilliseconds,s.events.sunrise.epochMilliseconds-7*MINUTE,s.transit.epochMilliseconds+5*MINUTE,
        s.events.asr.epochMilliseconds+4*MINUTE,s.events.maghrib.epochMilliseconds+7*MINUTE,a.isha.selectedEpochMilliseconds];
      assert.equal(s.events.asr.status,'calculated');
      assert.ok(chain.every(Number.isFinite)&&chain.every((value,j)=>j===0||value>chain[j-1]),`${id} ${date}: six-event UTC order`);
      stats.sixEventOrderChecks++;
    }
    const jumps={};
    for (const event of ['fajr','isha']) {
      const eventDates=padded.filter(d=>selections.get(d)[event]);
      let maximum=null;
      for(let j=1;j<eventDates.length;j++){
        const a=eventDates[j-1],b=eventDates[j];
        const l=selections.get(a)[event],r=selections.get(b)[event];
        const change=((r.selectedEpochMilliseconds-solar.get(b).transit.epochMilliseconds)-(l.selectedEpochMilliseconds-solar.get(a).transit.epochMilliseconds))/MINUTE;
        const record={fromDate:a,toDate:b,signedChangeMinutes:change,absoluteChangeMinutes:Math.abs(change),fromMode:l.mode,toMode:r.mode};
        if(!maximum||record.absoluteChangeMinutes>maximum.absoluteChangeMinutes)maximum=record;
      }
      const wanted=expected.maxDailyPhaseJumps[event];
      assert.equal(maximum.fromDate,wanted.fromDate,`${id} ${event}: max phase-change date`);
      assert.equal(maximum.toDate,wanted.toDate);
      assert.equal(maximum.fromMode,wanted.fromMode);assert.equal(maximum.toMode,wanted.toMode);
      const difference=close(maximum.signedChangeMinutes,wanted.signedChangeMinutes,.1/60,`${id}: max phase change`);
      stats.maximumPhaseJumpDifferenceMinutes=Math.max(stats.maximumPhaseJumpDifferenceMinutes,difference);
      jumps[event]=maximum;
    }
    stats.summaries.push({id,status:'available',counts,maxDailyPhaseJumps:jumps});
  }
  return stats;
}

if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
  const result=verifyLocalSummer();
  console.log(JSON.stringify(Object.fromEntries(Object.entries(result).filter(([key])=>key!=='summaries')),null,2));
}
