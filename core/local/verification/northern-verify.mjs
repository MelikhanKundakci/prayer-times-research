import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { buildNorthernContext } from '../northern.mjs';
import { calculateLocalSolarDay } from '../solar.mjs';

const fixtureUrl = new URL('./northern-fixtures.json', import.meta.url);
const TOLERANCE_SECONDS = .1;
const MINUTE = 60000;

/** Verify every annual eligibility bit and independent sampled UTC arithmetic. */
export function verifyLocalNorthern() {
  const bytes = readFileSync(fixtureUrl);
  const fixture = JSON.parse(bytes);
  assert.equal(fixture.schema, 'independent-local-northern-oracle/v1');
  assert.equal(fixture.caseCount, 9);
  assert.equal(fixture.cases.length, fixture.caseCount);
  const stats = {
    result: 'PASS', cases: 0, readyContexts: 0, blockedContexts: 0, ownedDays: 0,
    eligibilityComparisons: 0, eligibleFajrDays: 0, eligibleIshaDays: 0,
    paddingGuardChecks: 0, annualNightCandidateChecks: 0,
    sampledNights: 0, sampledTimestampComparisons: 0,
    maximumTimestampDifferenceSeconds: 0, maximumThresholdDifferenceSeconds: 0,
    maximumRatioDifference: 0, toleranceSeconds: TOLERANCE_SECONDS,
    fixtureSha256: createHash('sha256').update(bytes).digest('hex'),
    runtime: { node: process.version, icu: process.versions.icu, tzdb: process.versions.tz },
  };
  const summaries = [];
  function close(actual, expected, tolerance, label) {
    assert.ok(Number.isFinite(actual) && Number.isFinite(expected), `${label}: finite values required`);
    const error = Math.abs(actual - expected);
    assert.ok(error <= tolerance, `${label}: ${error} exceeds ${tolerance}`);
    return error;
  }
  function instant(actual, expected, label) {
    if (expected === null) { assert.equal(actual, null, label); return; }
    stats.sampledTimestampComparisons++;
    const delta = close(actual, expected, TOLERANCE_SECONDS * 1000, label) / 1000;
    stats.maximumTimestampDifferenceSeconds = Math.max(stats.maximumTimestampDifferenceSeconds, delta);
  }
  for (const { input, expected } of fixture.cases) {
    const { id, ...parameters } = input;
    const actual = buildNorthernContext(parameters);
    stats.cases++;
    const paddedDates = Object.keys(actual.days).sort();
    assert.equal(paddedDates.length, expected.paddedDays, `${id}: all padded diagnostic rows`);
    assert.equal(paddedDates[0], `${input.year - 1}-12-31`);
    assert.equal(paddedDates.at(-1), `${input.year + 1}-01-01`);
    for (const date of [paddedDates[0], paddedDates.at(-1)]) {
      for (const event of ['fajr', 'isha']) {
        assert.equal(actual.days[date][event].eligible, false, `${id}: padding is not a selected event`);
        assert.equal(actual.days[date][event].reason, 'outside-requested-year');
        stats.paddingGuardChecks++;
      }
    }
    const candidates = paddedDates.slice(0, -1).map((date, index) => {
      const c = actual.days[date].nightToNext;
      assert.ok(c, `${id}: no omitted annual night candidate`);
      assert.equal(c.startDate, date);
      assert.equal(c.endDate, paddedDates[index + 1]);
      const horizon = (c.sunriseEndSelectedEpochMilliseconds - c.maghribSelectedEpochMilliseconds) / MINUTE;
      close(c.ordinaryHorizonNightMinutes, horizon, 1e-8, `${id}: full-year actual-night identity`);
      const religious = c.rawFajrEpochMilliseconds === null ? null : (c.rawFajrEpochMilliseconds - c.maghribSelectedEpochMilliseconds) / MINUTE;
      if (religious !== null) assert.ok(religious > 0 && religious < horizon, `${id}: true Fajr inside actual horizon night`);
      const third = religious === null ? actual.metadata.q * horizon : religious / 3;
      close(c.oneThirdMinutes, third, 1e-8, `${id}: full-year real/frozen third`);
      assert.ok(third > 0 && third < horizon, `${id}: physical night-third interval`);
      close(c.ishaEstimateEpochMilliseconds, c.maghribSelectedEpochMilliseconds + third * MINUTE, .001, `${id}: full-year Isha arithmetic`);
      close(c.fajrUpperEpochMilliseconds, c.sunriseEndSelectedEpochMilliseconds - third * MINUTE, .001, `${id}: full-year Fajr upper-bound arithmetic`);
      stats.annualNightCandidateChecks++;
      return c;
    });
    assert.equal(candidates.length, expected.adjacentNights);
    const fullHorizonGate = paddedDates.every(date => {
      const h = actual.days[date].horizons;
      return h.rawDayMinutes > 300 && h.selectedDayMinutes > 300;
    }) && candidates.every(c => c.ordinaryHorizonNightMinutes > 300 && c.ordinaryHorizonNightMinutes + 14 > 300);
    assert.equal(actual.metadata.horizonGatePassed, fullHorizonGate, `${id}: all padded horizon dependencies retained`);
    close(actual.metadata.annualIshaTransitionLowerPhaseMinutes,
      Math.min(...candidates.map(c => c.ishaEstimatePhaseMinutes - 20)), 1e-8, `${id}: full padded Isha envelope`);
    close(actual.metadata.annualFajrTransitionUpperPhaseMinutes,
      Math.max(...candidates.map(c => c.fajrUpperPhaseMinutes + 20)), 1e-8, `${id}: full padded Fajr envelope`);
    const dates = paddedDates.filter(date => date.startsWith(`${input.year}-`));
    assert.equal(dates.length, expected.days, `${id}: full owned year`);
    assert.equal(dates[0], `${input.year}-01-01`);
    assert.equal(dates.at(-1), `${input.year}-12-31`);
    stats.ownedDays += dates.length;
    assert.equal(actual.status, expected.status === 'ready' ? 'available' : 'blocked', `${id}: annual dependency status`);
    if (expected.status === 'ready') stats.readyContexts++; else stats.blockedContexts++;
    const fajrBits = dates.map(date => Number(actual.days[date].fajr.eligible)).join('');
    const ishaBits = dates.map(date => Number(actual.days[date].isha.eligible)).join('');
    assert.equal(fajrBits, expected.fajrEligibleBits, `${id}: every Fajr eligibility decision`);
    assert.equal(ishaBits, expected.ishaEligibleBits, `${id}: every Isha eligibility decision`);
    stats.eligibilityComparisons += 2 * dates.length;
    stats.eligibleFajrDays += fajrBits.split('1').length - 1;
    stats.eligibleIshaDays += ishaBits.split('1').length - 1;
    summaries.push({ id, status: actual.status, fajrOrdinaryDays: fajrBits.split('1').length - 1,
      ishaOrdinaryDays: ishaBits.split('1').length - 1 });
    if (expected.status === 'blocked') {
      assert.equal(actual.metadata.horizonGatePassed, false, `${id}: retain the annual horizon failure`);
      assert.ok(actual.reason, `${id}: explicit annual blocking reason`);
      continue;
    }
    assert.equal(actual.metadata.firstPaddedDate, `${input.year - 1}-12-31`);
    assert.equal(actual.metadata.lastPaddedDate, `${input.year + 1}-01-01`);
    assert.equal(actual.metadata.missingFajrDayCount, expected.missingFajrNights);
    for (const [key, field] of [
      ['ishaMinutesFromTransit', 'annualIshaTransitionLowerPhaseMinutes'],
      ['fajrMinutesFromTransit', 'annualFajrTransitionUpperPhaseMinutes'],
    ]) {
      const delta = close(actual.metadata[field], expected.thresholds[key], TOLERANCE_SECONDS / 60, `${id}: ${key}`) * 60;
      stats.maximumThresholdDifferenceSeconds = Math.max(stats.maximumThresholdDifferenceSeconds, delta);
    }
    if (expected.frozenRatio !== null) {
      const delta = close(actual.metadata.q, expected.frozenRatio, 1e-8, `${id}: last-real-night quotient`);
      stats.maximumRatioDifference = Math.max(stats.maximumRatioDifference, delta);
      assert.equal(actual.metadata.anchorDate, expected.missingWindow.ratioAnchorEndingDate);
      assert.equal(actual.metadata.missingFajrStartDate, expected.missingWindow.firstEndingDate);
      assert.equal(actual.metadata.missingFajrEndDate, expected.missingWindow.lastEndingDate);
    }
    for (const sample of expected.samples) {
      stats.sampledNights++;
      const solarInput = { latitude: input.latitude, longitude: input.longitude, timeZone: input.timeZone, ishaAngleDegrees: 16 };
      const before = calculateLocalSolarDay({ ...solarInput, date: sample.eveningOwnerDate });
      const after = calculateLocalSolarDay({ ...solarInput, date: sample.endingDate });
      const m = before.events.maghrib.epochMilliseconds + 7 * MINUTE;
      const r = after.events.sunrise.epochMilliseconds - 7 * MINUTE;
      const f = after.events.fajr.epochMilliseconds;
      instant(m, sample.selectedMaghribEpochMilliseconds, `${id}: selected previous Maghrib`);
      instant(r, sample.selectedSunriseEpochMilliseconds, `${id}: selected ending sunrise`);
      instant(f, sample.rawFajrEpochMilliseconds, `${id}: next real Fajr`);
      instant(before.transit.epochMilliseconds, sample.eveningTransitEpochMilliseconds, `${id}: evening owning transit`);
      instant(after.transit.epochMilliseconds, sample.morningTransitEpochMilliseconds, `${id}: morning owning transit`);
      close((r - m) / 1000, sample.ordinaryNightSeconds, TOLERANCE_SECONDS, `${id}: actual selected horizon night`);
      if (f !== null) close((f - m) / 1000, sample.religiousNightSeconds, TOLERANCE_SECONDS, `${id}: actual religious night`);
      const third = f === null ? actual.metadata.q * (r - m) : (f - m) / 3;
      close(third / 1000, sample.thirdSeconds, TOLERANCE_SECONDS, `${id}: real or frozen third`);
      const evening = actual.days[sample.eveningOwnerDate];
      const morning = actual.days[sample.endingDate];
      const candidate = evening?.nightToNext ?? morning?.previousNight;
      assert.ok(candidate, `${id}: retained night candidate including year boundaries`);
      instant(candidate.ishaEstimateEpochMilliseconds, sample.ishaEstimateEpochMilliseconds, `${id}: exposed Isha estimate`);
      instant(candidate.fajrUpperEpochMilliseconds, sample.fajrUpperEpochMilliseconds, `${id}: exposed Fajr upper bound`);
      close(candidate.oneThirdMinutes * 60, sample.thirdSeconds, TOLERANCE_SECONDS, `${id}: exposed real or frozen third`);
      if (evening && sample.eveningOwnerDate.startsWith(`${input.year}-`)) {
        close(evening.horizons.nextSelectedNightMinutes * 60, sample.ordinaryNightSeconds, TOLERANCE_SECONDS, `${id}: exposed adjacent night`);
      }
      if (morning && sample.endingDate.startsWith(`${input.year}-`)) {
        close(morning.horizons.previousSelectedNightMinutes * 60, sample.ordinaryNightSeconds, TOLERANCE_SECONDS, `${id}: exposed previous night`);
      }
    }
  }
  return { ...stats, summaries };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  console.log(JSON.stringify(verifyLocalNorthern(), null, 2));
}
