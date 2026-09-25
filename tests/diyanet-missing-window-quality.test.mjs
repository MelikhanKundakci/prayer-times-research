import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate, calculateMissingWindowCalendar, calculateMissingWindowReviewed } from '../methods/diyanet/index.mjs';

const bodo = { year: 2026, latitude: 67.28324, longitude: 14.38305, timeZone: 'Europe/Oslo' };
const rovaniemi = { year: 2027, latitude: 66.49897, longitude: 25.68867, timeZone: 'Europe/Helsinki' };
const day = (calendar, date) => calendar.days.find(x => x.date === date);

test('Default missing-window reports a rounded Asr reversal without changing its time', () => {
  const before = structuredClone(bodo), raw = calculateMissingWindowCalendar(bodo), reviewed = calculate(bodo);
  assert.deepEqual(bodo, before);
  assert.deepEqual(reviewed, calculate({ variant: 'north-missing-window', ...bodo }));
  const original = day(raw, '2026-01-05').events.asr;
  const value = day(reviewed, '2026-01-05').events.asr;
  assert.equal(value.status, 'ordering-exception');
  assert.equal(value.statusBeforeQualityReview, original.status);
  const flag = value.qualityFlags.find(x => x.code === 'adjusted-event-ordering-exception');
  assert.equal(flag.previousEvent, 'dhuhr');
  assert.ok(flag.rawGapSeconds < 0);
  assert.equal(flag.roundedGapMinutes, -1);
  assert.equal(flag.modelTimeAltered, false);
  assert.equal(value.eligibleForAutomaticNotifications, false);
  assert.equal(reviewed.qualityReview.rawOrderingExceptions, 2);
  assert.equal(reviewed.qualityReview.roundedOrderingExceptions, 2);
});

test('Raw reversals remain visible when nearest-minute rounding hides them', () => {
  const result = calculateMissingWindowReviewed(rovaniemi);
  assert.equal(result.qualityReview.rawOrderingExceptions, 7);
  assert.equal(result.qualityReview.roundedOrderingExceptions, 0);
  const value = day(result, '2027-12-22').events.asr;
  assert.equal(value.status, 'ordering-exception');
  const flag = value.qualityFlags.at(-1);
  assert.ok(flag.rawGapSeconds < -23 && flag.rawGapSeconds > -24);
  assert.equal(flag.roundedGapMinutes, 0);
});

test('Quality adaptation preserves all event instants and all unaffected event objects', () => {
  for (const options of [bodo, rovaniemi, { year: 2026, latitude: 52.5, longitude: 13.4, timeZone: 'Europe/Berlin' }]) {
    const raw = calculateMissingWindowCalendar(options), reviewed = calculateMissingWindowReviewed(options);
    assert.equal(reviewed.eligibleForAutomaticNotifications, false);
    assert.equal(reviewed.official, false);
    for (let i = 0; i < raw.days.length; i++) for (const [name, original] of Object.entries(raw.days[i].events)) {
      const actual = reviewed.days[i].events[name];
      for (const key of ['rawEpoch','utc','iso','localDate','time','diagnostic','reasons','basis'])
        assert.deepEqual(actual[key], original[key], `${options.latitude}/${raw.days[i].date}/${name}/${key}`);
      assert.equal(actual.eligibleForAutomaticNotifications, false);
      if (actual.status !== 'ordering-exception') assert.deepEqual(actual, original);
      else {
        const restored = { ...actual, status: actual.statusBeforeQualityReview };
        delete restored.statusBeforeQualityReview;
        const flags = restored.qualityFlags.filter(f => f.code !== 'adjusted-event-ordering-exception');
        if (flags.length) restored.qualityFlags = flags; else delete restored.qualityFlags;
        assert.deepEqual(restored, original);
      }
    }
  }
});

test('Explicit Dhuhr-equal fallback is not reported as reversed order; inputs remain strict', () => {
  const result = calculateMissingWindowReviewed(bodo);
  const value = day(result, '2026-01-01');
  assert.equal(value.events.asr.rawEpoch, value.events.dhuhr.rawEpoch);
  assert.equal(value.events.asr.status, 'estimated');
  assert.equal(value.qualityFlags, undefined);
  assert.throws(() => calculateMissingWindowReviewed(bodo, 'extra'), /Exactly one/);
  assert.throws(() => calculateMissingWindowReviewed({ ...bodo, latitude: 80 }), /latitude/i);
  let called = false;
  assert.throws(() => calculateMissingWindowReviewed(Object.defineProperty({}, 'year', { enumerable: true,
    get() { called = true; return 2026; } })), /own-data/);
  assert.equal(called, false);
});
