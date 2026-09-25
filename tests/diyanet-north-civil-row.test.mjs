import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {
  calculate, calculateMissingWindowCalendar, calculateNorthernCivilRow,
  calculateNorthernCivilRowRaw,
} from '../methods/diyanet/index.mjs';
import {solarCoordinatesUSNO} from '../core/astronomy/solar-usno-v2.mjs';

const root = new URL('../', import.meta.url);
const file = path => fileURLToPath(new URL(path, root));
const read = path => JSON.parse(readFileSync(file(path), 'utf8'));
const events = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
const seam = {year: 2027, latitude: 60, longitude: -180, timeZone: 'Asia/Anadyr'};
const hash = value => createHash('sha256').update(value).digest('hex');

test('Northern civil-row extraction reconstructs all three frozen source hashes', () => {
  const manifest = read('methods/diyanet/research/north-civil-row-relocation-2026-09-25.json');
  assert.equal(manifest.files.length, 3);
  for (const record of manifest.files) {
    const bytes = readFileSync(file(record.destination));
    assert.equal(hash(bytes), record.destinationSha256);
    let original = bytes.toString('utf8');
    for (const {before, after} of record.imports) {
      assert.equal(original.split(`'${after}'`).length, 2);
      original = original.replace(`'${after}'`, `'${before}'`);
    }
    assert.equal(hash(original), record.sourceSha256);
  }
});

test('Both antimeridian representations and nearby positions stay continuous in regular and leap years', () => {
  for (const year of [2027, 2028]) for (const magnitude of [180, 179.999999]) {
    const west = calculateNorthernCivilRow({...seam, year, longitude: -magnitude});
    const east = calculateNorthernCivilRow({...seam, year, longitude: magnitude});
    assert.equal(west.days.length, year === 2028 ? 366 : 365);
    assert.equal(east.days.length, west.days.length);
    for (let i = 0; i < west.days.length; i++) for (const event of events) {
      const a = west.days[i].events[event], b = east.days[i].events[event];
      assert.equal(a.utc, b.utc);
      assert.equal(a.localDate, b.localDate);
      assert.ok(Number.isFinite(a.rawEpoch) && Number.isFinite(b.rawEpoch));
      assert.ok(Math.abs(a.rawEpoch - b.rawEpoch) <= (magnitude === 180 ? 0 : .481));
    }
  }
});

test('All 28 archived input years preserve 61320 raw baseline event objects', () => {
  const cases = read('tests/diyanet-north-civil-row-inputs.json').cases;
  assert.equal(cases.length, 28);
  let count = 0;
  for (const c of cases) {
    const before = calculateMissingWindowCalendar(c.input), after = calculateNorthernCivilRowRaw(c.input);
    assert.equal(after.days.length, before.days.length);
    for (let i = 0; i < before.days.length; i++) {
      assert.equal(before.days[i].solarCalculationDate, before.days[i].date);
      assert.deepEqual(after.days[i].events, before.days[i].events, `${c.id}/${before.days[i].date}`);
      assert.deepEqual(after.days[i].diagnostics, before.days[i].diagnostics);
      count += events.length;
    }
  }
  assert.equal(count, 61320);
});

test('Civil ephemeris date and civil June21 remain distinct from absolute time carrier', () => {
  const input = {...seam, year: 2028};
  const result = calculate({variant: 'north-civil-row', ...input});
  assert.deepEqual(result, calculateNorthernCivilRow(input));
  assert.equal(result.variant, 'north-civil-row');
  assert.equal(result.reconstruction.solsticeCivilDate, '2028-06-21');
  assert.equal(result.reconstruction.solsticeCalculationDate, '2028-06-20');
  assert.equal(result.reconstruction.solsticeAnchorBasis, 'requested civil June21');
  for (const day of result.days) {
    const epoch = Date.parse(day.solarTimeCarrierDate + 'T00:00:00Z');
    const row = Date.parse(day.date + 'T00:00:00Z');
    assert.equal(day.ephemerisDate, day.date);
    assert.equal(day.solarCalculationDate, day.solarTimeCarrierDate);
    assert.equal(epoch, row - 86400000);
    const solar = solarCoordinatesUSNO(row / 86400000 + 2440587.5);
    const transit = epoch + (12 - input.longitude / 15 - solar.equationOfTimeHours) * 3600000;
    assert.equal(day.events.dhuhr.rawEpoch, transit + 300000);
    assert.equal(day.events.dhuhr.localDate, day.date);
  }
  assert.equal(result.official, false);
  assert.equal(result.appReady, false);
  assert.equal(result.eligibleForAutomaticNotifications, false);
  assert.ok(result.qualityFlags.includes('civil-row-ephemeris-unconfirmed'));
});

test('Civil-row quality adapter preserves all instants and exposes known Asr reversals', () => {
  const input = {year: 2026, latitude: 67.28324, longitude: 14.38305, timeZone: 'Europe/Oslo'};
  const original = structuredClone(input), raw = calculateNorthernCivilRowRaw(input), reviewed = calculateNorthernCivilRow(input);
  assert.deepEqual(input, original);
  const value = reviewed.days.find(day => day.date === '2026-01-05').events.asr;
  assert.equal(value.status, 'ordering-exception');
  assert.equal(value.qualityFlags.at(-1).roundedGapMinutes, -1);
  assert.equal(value.qualityFlags.at(-1).modelTimeAltered, false);
  for (let i = 0; i < raw.days.length; i++) for (const event of events) {
    const before = raw.days[i].events[event], after = reviewed.days[i].events[event];
    for (const key of ['rawEpoch', 'utc', 'time', 'localDate', 'diagnostic']) assert.deepEqual(after[key], before[key]);
    assert.equal(after.eligibleForAutomaticNotifications, false);
    if (after.status !== 'ordering-exception') assert.deepEqual(after, before);
  }
  assert.equal(reviewed.qualityReview.rawOrderingExceptions, 2);
});

test('Strict northern input contracts reject invalid domains and accessors without invoking them', () => {
  assert.throws(() => calculateNorthernCivilRow(seam, {}), /Exactly one/);
  for (const change of [{latitude: 44.49}, {latitude: 75.01}, {longitude: 180.01}, {year: 2100}, {timeZone: 'Not/AZone'}])
    assert.throws(() => calculateNorthernCivilRow({...seam, ...change}));
  assert.throws(() => calculateNorthernCivilRow({...seam, sourceTimes: []}));
  let read = false;
  const accessor = {...seam};
  Object.defineProperty(accessor, 'latitude', {enumerable: true, get() { read = true; return 60; }});
  assert.throws(() => calculateNorthernCivilRow(accessor), /own-data/);
  assert.equal(read, false);
});

test('Northern civil-row computes offline without research evidence or calendars under two host zones', () => {
  const expected = hash(JSON.stringify(calculateNorthernCivilRow(seam)));
  const permitted = ['package.json', 'methods/diyanet/implementation/', 'core/astronomy/', 'core/timezones/'];
  const denied = ['tests/diyanet-north-civil-row-inputs.json', 'methods/diyanet/research/', 'node_modules/adhan/package.json'];
  const program = `
    import assert from 'node:assert/strict';
    import {readFileSync} from 'node:fs';
    import {createHash} from 'node:crypto';
    import {get} from 'node:https';
    import {calculateNorthernCivilRow} from ${JSON.stringify(new URL('methods/diyanet/implementation/north-civil-row/quality-model.mjs', root).href)};
    assert.equal(process.versions.tz, '2026d');
    assert.equal(process.permission.has('net'), false);
    await assert.rejects(new Promise((resolve, reject) => get('https://example.invalid/', resolve).on('error', reject)), {code: 'ERR_ACCESS_DENIED'});
    for (const path of ${JSON.stringify(denied.map(file))}) {
      assert.equal(process.permission.has('fs.read', path), false);
      assert.throws(() => readFileSync(path), {code: 'ERR_ACCESS_DENIED'});
    }
    const result = calculateNorthernCivilRow(${JSON.stringify(seam)});
    process.stdout.write(createHash('sha256').update(JSON.stringify(result)).digest('hex'));
  `;
  for (const zone of ['UTC', 'Pacific/Honolulu']) {
    const child = spawnSync(process.execPath, ['--permission', ...permitted.map(p => '--allow-fs-read=' + file(p)),
      '--input-type=module', '--eval', program], {cwd: file('.'), env: {...process.env, TZ: zone}, encoding: 'utf8', timeout: 30000});
    assert.ifError(child.error);
    assert.equal(child.status, 0, child.stderr);
    assert.equal(child.stdout, expected);
  }
});
