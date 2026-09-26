import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { calculateLocalSolarDay } from '../solar.mjs';

const fixtureUrl = new URL('./oracle-fixtures.json', import.meta.url);
const ROOT_TOLERANCE_SECONDS = 0.1;
const THRESHOLD_TOLERANCE_DEGREES = 1e-8;
const EVENTS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

/**
 * Compare the local kernel with the frozen, independently implemented Python
 * USNO oracle. This verifies the selected equations, not observed accuracy.
 * Throws AssertionError on any timestamp, availability or ownership mismatch.
 */
export function verifyLocalSolar() {
  const bytes = readFileSync(fixtureUrl);
  const fixture = JSON.parse(bytes);
  assert.equal(fixture.schema, 'independent-local-solar-oracle/v1');
  assert.equal(fixture.caseCount, 139);
  assert.equal(fixture.rows.length, fixture.caseCount);
  const stats = {
    cases: fixture.caseCount,
    calculatedCycles: 0,
    expectedOwnershipRejections: 0,
    calculatedEvents: 0,
    unavailableEvents: 0,
    cycleBoundaryComparisons: 0,
    maximumRootDifferenceSeconds: 0,
    maximumCycleBoundaryDifferenceSeconds: 0,
    maximumTransitDifferenceSeconds: 0,
    maximumThresholdDifferenceDegrees: 0,
    rootToleranceSeconds: ROOT_TOLERANCE_SECONDS,
    oracleSha256: createHash('sha256').update(bytes).digest('hex'),
    runtime: { node: process.version, icu: process.versions.icu, tzdb: process.versions.tz },
  };
  const ids = new Set();
  function close(actual, expected, tolerance, label) {
    assert.ok(Number.isFinite(actual) && Number.isFinite(expected), `${label}: finite numbers required`);
    const difference = Math.abs(actual - expected);
    assert.ok(difference <= tolerance, `${label}: difference ${difference} exceeds ${tolerance}`);
    return difference;
  }
  for (const { input, oracle } of fixture.rows) {
    const { id, ...parameters } = input;
    assert.ok(typeof id === 'string' && !ids.has(id), 'Unique fixture case ID required');
    ids.add(id);
    if (oracle.status === 'ownership-unavailable') {
      assert.ok(oracle.transitCount === 0 || oracle.transitCount === 2, `${id}: declared absent/ambiguous transit`);
      assert.throws(() => calculateLocalSolarDay(parameters), RangeError, `${id}: cannot select a unique civil-date transit`);
      stats.expectedOwnershipRejections++;
      continue;
    }
    assert.equal(oracle.status, 'calculated');
    const actual = calculateLocalSolarDay(parameters);
    stats.calculatedCycles++;
    assert.equal(actual.date, input.date, `${id}: requested date`);
    assert.equal(actual.transit.localDate, input.date, `${id}: transit date ownership`);
    assert.equal(actual.transit.status, 'calculated', `${id}: transit status`);
    const transit = actual.transit.epochMilliseconds / 1000;
    stats.maximumTransitDifferenceSeconds = Math.max(stats.maximumTransitDifferenceSeconds,
      close(transit, oracle.transitEpochSeconds, ROOT_TOLERANCE_SECONDS, `${id}: upper transit`));
    for (const [actualKey, oracleKey] of [
      ['startEpochMilliseconds', 'startEpochSeconds'],
      ['endEpochMilliseconds', 'endEpochSeconds'],
    ]) {
      stats.cycleBoundaryComparisons++;
      stats.maximumCycleBoundaryDifferenceSeconds = Math.max(stats.maximumCycleBoundaryDifferenceSeconds,
        close(actual.solarCycle[actualKey] / 1000, oracle[oracleKey], ROOT_TOLERANCE_SECONDS, `${id}: ${actualKey}`));
    }
    assert.deepEqual(Object.keys(actual.events).sort(), [...EVENTS].sort(), `${id}: complete event fields`);
    for (const event of EVENTS) {
      const expected = oracle.events[event], emitted = actual.events[event];
      const label = `${id}: ${event}`;
      if (expected.epochSeconds === null) {
        assert.equal(emitted.status, 'unavailable', `${label}: no oracle crossing`);
        assert.equal(emitted.epochMilliseconds, null, `${label}: explicit absent instant`);
        assert.ok(typeof emitted.reason === 'string' && emitted.reason.length > 0, `${label}: explicit reason`);
        stats.unavailableEvents++;
        continue;
      }
      assert.equal(emitted.status, 'calculated', `${label}: oracle crossing exists`);
      assert.equal(emitted.reason, null, `${label}: no failure reason`);
      const epoch = emitted.epochMilliseconds / 1000;
      stats.maximumRootDifferenceSeconds = Math.max(stats.maximumRootDifferenceSeconds,
        close(epoch, expected.epochSeconds, ROOT_TOLERANCE_SECONDS, label));
      assert.ok(epoch >= actual.solarCycle.startEpochMilliseconds / 1000 &&
        epoch < actual.solarCycle.endEpochMilliseconds / 1000, `${label}: belongs to declared solar cycle`);
      assert.equal(emitted.rootDirection, expected.rootDirection, `${label}: crossing direction`);
      if (event === 'dhuhr') {
        assert.equal(emitted.thresholdDegrees, null, `${label}: meridian event has no altitude target`);
      } else {
        stats.maximumThresholdDifferenceDegrees = Math.max(stats.maximumThresholdDifferenceDegrees,
          close(emitted.thresholdDegrees, expected.thresholdDegrees, THRESHOLD_TOLERANCE_DEGREES, `${label}: altitude target`));
        assert.ok(expected.rootDirection === 'rising' ? epoch < transit : epoch > transit,
          `${label}: belongs to declared morning/evening half-cycle`);
      }
      stats.calculatedEvents++;
    }
    assert.equal(actual.model.temkinApplied, false, `${id}: physical layer applies no Temkin`);
  }
  assert.equal(stats.calculatedCycles, 136);
  assert.equal(stats.expectedOwnershipRejections, 3);
  assert.equal(stats.calculatedEvents, 723);
  assert.equal(stats.unavailableEvents, 93);
  assert.equal(stats.calculatedEvents + stats.unavailableEvents, stats.calculatedCycles * EVENTS.length);
  return { result: 'PASS', ...stats };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  console.log(JSON.stringify(verifyLocalSolar(), null, 2));
}
