import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateLocalSolarDay } from '../core/local/solar.mjs';
import { verifyLocalSolar } from '../core/local/verification/verify.mjs';

const EVENTS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
const BASE = Object.freeze({ date: '2026-03-20', latitude: 52.52, longitude: 13.405, timeZone: 'Europe/Berlin' });
const DEG = Math.PI / 180;

// Independent direct shadow-length check from the published USNO equations.
// Do not reuse kernel altitude, declination, or returned Asr threshold here.
function shadowLength(epoch, latitude, longitude) {
  const d = epoch / 86400000 + 2440587.5 - 2451545;
  const g = ((357.529 + .98560028 * d) % 360) * DEG;
  const L = ((280.459 + .98564736 * d) % 360 + 360) % 360;
  const lambda = (L + 1.915 * Math.sin(g) + .020 * Math.sin(2 * g)) * DEG;
  const epsilon = (23.439 - .00000036 * d) * DEG;
  const rightAscension = ((Math.atan2(Math.cos(epsilon) * Math.sin(lambda), Math.cos(lambda)) / DEG / 15) % 24 + 24) % 24;
  const declination = Math.asin(Math.sin(epsilon) * Math.sin(lambda));
  const equationOfTime = ((L / 15 - rightAscension + 12) % 24 + 24) % 24 - 12;
  const hourAngle = ((epoch % 86400000) / 3600000 + longitude / 15 + equationOfTime - 12) * 15 * DEG;
  const sineAltitude = Math.sin(latitude * DEG) * Math.sin(declination) +
    Math.cos(latitude * DEG) * Math.cos(declination) * Math.cos(hourAngle);
  assert.ok(sineAltitude > 0, 'A finite positive solar height is required for a shadow');
  return Math.sqrt(Math.max(0, 1 - sineAltitude ** 2)) / sineAltitude;
}

test('local solar kernel agrees with the independently frozen Python grid', () => {
  const report = verifyLocalSolar();
  assert.equal(report.result, 'PASS');
  assert.equal(report.cases, 139);
  assert.equal(report.calculatedCycles, 136);
  assert.equal(report.calculatedEvents, 723);
  assert.equal(report.unavailableEvents, 93);
  assert.equal(report.expectedOwnershipRejections, 3);
  assert.ok(report.maximumRootDifferenceSeconds <= .1);
});

test('Asr adds one object height to the shadow fixed at upper transit', () => {
  const cases = [
    { date: '2026-06-21', latitude: 52.52, longitude: 13.405, timeZone: 'Europe/Berlin' },
    { date: '2026-03-08', latitude: 40.7128, longitude: -74.006, timeZone: 'America/New_York' },
    { date: '2026-09-23', latitude: -33.8688, longitude: 151.2093, timeZone: 'Australia/Sydney' },
    { date: '2026-03-20', latitude: 21.4225, longitude: 39.8262, timeZone: 'Asia/Riyadh' },
    { date: '2026-12-21', latitude: 0, longitude: 0, timeZone: 'UTC' },
    { date: '2028-02-29', latitude: 64.1466, longitude: -21.9426, timeZone: 'Atlantic/Reykjavik' },
  ];
  for (const input of cases) {
    const result = calculateLocalSolarDay(input);
    assert.equal(result.events.asr.status, 'calculated');
    const noonShadow = shadowLength(result.transit.epochMilliseconds, input.latitude, input.longitude);
    const asrShadow = shadowLength(result.events.asr.epochMilliseconds, input.latitude, input.longitude);
    assert.ok(Math.abs(asrShadow - noonShadow - 1) < 1e-6,
      `${input.timeZone} ${input.date}: fixed-noon extra shadow is ${asrShadow - noonShadow}`);
    assert.ok(result.events.asr.epochMilliseconds > result.transit.epochMilliseconds);
    assert.equal(result.events.asr.rootDirection, 'setting');
  }
  const polarNight = calculateLocalSolarDay({ date: '2026-12-21', latitude: 89, longitude: 0, timeZone: 'UTC' });
  assert.ok(polarNight.transit.geometricAltitudeDegrees < 0);
  assert.equal(polarNight.events.asr.status, 'unavailable');
  assert.equal(polarNight.events.asr.epochMilliseconds, null);
});

test('raw solar times respond continuously to small GPS movements', () => {
  const center = calculateLocalSolarDay(BASE);
  const east = calculateLocalSolarDay({ ...BASE, longitude: BASE.longitude + .0001 });
  const north = calculateLocalSolarDay({ ...BASE, latitude: BASE.latitude + .0001 });
  for (const name of EVENTS) {
    const deltaSeconds = (east.events[name].epochMilliseconds - center.events[name].epochMilliseconds) / 1000;
    assert.ok(deltaSeconds < 0 && deltaSeconds > -.1, `${name}: a small eastward move gives a small earlier instant`);
    const latitudeDeltaSeconds = (north.events[name].epochMilliseconds - center.events[name].epochMilliseconds) / 1000;
    assert.ok(Math.abs(latitudeDeltaSeconds) < .2, `${name}: latitude movement remains continuous`);
  }
  const transitMove = (east.transit.epochMilliseconds - center.transit.epochMilliseconds) / 1000;
  // 360 degrees / 24 hours gives 240 seconds per degree; changing EOT adds
  // only a small correction over this tiny shift. No source clocks are fitted.
  assert.ok(Math.abs(transitMove + .024) < .001);
  assert.notEqual(north.events.asr.epochMilliseconds, center.events.asr.epochMilliseconds);
  const oneDegreeEast = calculateLocalSolarDay({ ...BASE, longitude: BASE.longitude + 1 });
  assert.ok(Math.abs((oneDegreeEast.transit.epochMilliseconds - center.transit.epochMilliseconds) / 1000 + 240) < 1);
});

test('the two ±180 degree representations select identical physical events', () => {
  for (const [date, latitude] of [['2026-03-20', 0], ['2026-06-21', 55], ['2026-12-21', -35]]) {
    const a = calculateLocalSolarDay({ date, latitude, longitude: 180, timeZone: 'UTC' });
    const b = calculateLocalSolarDay({ date, latitude, longitude: -180, timeZone: 'UTC' });
    assert.deepEqual(a.events, b.events);
    assert.deepEqual(a.solarCycle, b.solarCycle);
    assert.equal(a.transit.epochMilliseconds, b.transit.epochMilliseconds);
  }
});

test('timezone changes date ownership without shifting the same solar cycle', () => {
  const berlin = calculateLocalSolarDay(BASE);
  const utcBerlin = calculateLocalSolarDay({ ...BASE, timeZone: 'UTC' });
  assert.deepEqual(berlin.events, utcBerlin.events);
  assert.deepEqual(berlin.solarCycle, utcBerlin.solarCycle);

  const apia = calculateLocalSolarDay({ date: '2026-03-20', latitude: -13.8333, longitude: -171.75, timeZone: 'Pacific/Apia' });
  const utcApia = calculateLocalSolarDay({ date: '2026-03-19', latitude: -13.8333, longitude: -171.75, timeZone: 'UTC' });
  assert.equal(apia.transit.localDate, '2026-03-20');
  assert.equal(utcApia.transit.localDate, '2026-03-19');
  assert.deepEqual(apia.events, utcApia.events);
  assert.deepEqual(apia.solarCycle, utcApia.solarCycle);
  assert.equal(new Date(apia.transit.epochMilliseconds).toISOString().slice(0, 10), '2026-03-19');
});

test('kernel rejects invalid records and accessors without coercing values', () => {
  for (const value of [null, undefined, [], 'input', 1, Object.create(BASE), Object.assign(Object.create(null), BASE)]) {
    assert.throws(() => calculateLocalSolarDay(value), TypeError);
  }
  for (const field of Object.keys(BASE)) {
    const input = { ...BASE };
    delete input[field];
    assert.throws(() => calculateLocalSolarDay(input), TypeError, `missing ${field}`);
  }
  assert.throws(() => calculateLocalSolarDay({ ...BASE, unknown: 1 }), TypeError);
  assert.throws(() => calculateLocalSolarDay({ ...BASE, [Symbol('hidden')]: 1 }), TypeError);
  assert.throws(() => calculateLocalSolarDay(Object.defineProperty({ ...BASE }, 'hidden', { value: 1 })), TypeError);
  let getterCalls = 0;
  const accessor = Object.defineProperty({ ...BASE }, 'latitude', { enumerable: true, get() { getterCalls++; return 52; } });
  assert.throws(() => calculateLocalSolarDay(accessor), TypeError);
  assert.equal(getterCalls, 0);
  let coercionCalls = 0;
  const coercible = { valueOf() { coercionCalls++; return 0; }, toString() { coercionCalls++; return 'UTC'; } };
  for (const field of ['latitude', 'longitude', 'date', 'timeZone', 'ishaAngleDegrees']) {
    assert.throws(() => calculateLocalSolarDay({ ...BASE, [field]: coercible }), RangeError);
  }
  assert.equal(coercionCalls, 0);
  assert.throws(() => calculateLocalSolarDay({ ...BASE, latitude: '52.52' }), RangeError);
  assert.throws(() => calculateLocalSolarDay({ ...BASE, longitude: '-74' }), RangeError);
  assert.throws(() => calculateLocalSolarDay({ ...BASE, ishaAngleDegrees: undefined }), TypeError);
  for (const angle of [null, 18, '17', false, NaN]) {
    assert.throws(() => calculateLocalSolarDay({ ...BASE, ishaAngleDegrees: angle }), RangeError);
  }
});

test('kernel enforces explicit date, coordinate and IANA timezone domains', () => {
  for (const date of ['2000-12-31', '2099-01-01', '2027-02-29', '2026-13-01', '2026-1-01', '2026-03-20T00:00:00Z']) {
    assert.throws(() => calculateLocalSolarDay({ ...BASE, date }), RangeError, date);
  }
  for (const date of ['2001-01-01', '2098-12-31', '2028-02-29']) {
    assert.equal(calculateLocalSolarDay({ ...BASE, date }).transit.localDate, date);
  }
  for (const latitude of [-90, 90, NaN, Infinity, null, undefined]) {
    assert.throws(() => calculateLocalSolarDay({ ...BASE, latitude }), RangeError);
  }
  for (const longitude of [-180.001, 180.001, NaN, Infinity, null, undefined]) {
    assert.throws(() => calculateLocalSolarDay({ ...BASE, longitude }), RangeError);
  }
  for (const timeZone of ['+03:00', '-0500', 'GMT+3', 'CET', 'Not/A_Zone', '', null, 3]) {
    assert.throws(() => calculateLocalSolarDay({ ...BASE, timeZone }), RangeError);
  }
  // A named IANA Etc zone remains an explicit identifier even when its offset
  // is constant; it is distinct from an unversioned numeric offset argument.
  assert.equal(calculateLocalSolarDay({ ...BASE, timeZone: 'Etc/GMT+3' }).transit.localDate, BASE.date);
});
