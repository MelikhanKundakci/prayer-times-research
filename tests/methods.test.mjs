import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {methodIds, loadMethod} from '../methods/index.mjs';
import {renderedProjection, preview} from '../scripts/output.mjs';

const read = path => JSON.parse(fs.readFileSync(new URL(path, import.meta.url), 'utf8'));
const cases = read('./cases.json').cases;
const snapshots = read('./model-snapshots.json').cases;

test('Pinned timezone runtime is loaded', () => assert.equal(process.versions.tz, '2026d'));
for (const item of cases) {
  test(`Rendered regression: ${item.id}`, async () => {
    const before = structuredClone(item.input);
    const {calculate} = await loadMethod(item.family);
    const result = calculate(item.input);
    assert.deepEqual(item.input, before, 'Public calculation must not mutate caller input');
    const projected = renderedProjection(result);
    const snapshot = snapshots.find(x => x.id === item.id);
    assert.ok(snapshot);
    assert.ok(projected.length > 0);
    assert.equal(projected.length, snapshot.projectedFields);
    assert.equal(createHash('sha256').update(JSON.stringify(projected)).digest('hex'), snapshot.sha256);
  });
}
for (const id of methodIds) {
  test(`Runnable documented example: ${id}`, async () => {
    const input = read(`../methods/${id}/examples/input.json`);
    const saved = read(`../methods/${id}/examples/output.json`);
    const result = (await loadMethod(id)).calculate(input);
    assert.equal(saved.evidenceType, 'generated-model-example-not-institutional-reference');
    assert.deepEqual(input, saved.input);
    assert.deepEqual(renderedProjection(preview(result)), renderedProjection(saved.output));
  });
}
test('Unknown method cannot escape the method registry', async () => {
  await assert.rejects(loadMethod('../core/input'), /Unknown method/);
});
test('All public wrappers reject getters and inherited records', async () => {
  for (const id of methodIds) {
    const {calculate} = await loadMethod(id);
    let invoked = false;
    const options = Object.defineProperty({}, 'date', {enumerable: true, get() { invoked = true; return '2026-01-01'; }});
    assert.throws(() => calculate(options), /own data/);
    assert.equal(invoked, false);
    assert.throws(() => calculate(Object.create({date: '2026-01-01'})), /plain input/);
  }
});
test('Diyanet requires explicit supported variant and keeps regional constraints', async () => {
  const {calculate} = await loadMethod('diyanet');
  const input = {variant: 'low-latitude', date: '2026-06-21', latitude: 41, longitude: 29, timeZone: 'Europe/Istanbul'};
  assert.throws(() => calculate({...input, variant: 'automatically-best'}), /Unknown variant/);
  assert.throws(() => calculate({...input, latitude: 52}), /latitude/);
  assert.throws(() => calculate({...input, offset: 4}), /Unknown|Unexpected|fields/i);
});
test('Egypt wrapper cannot silently apply a Cairo day model globally', async () => {
  const {calculate} = await loadMethod('egyptian-survey');
  const input = read('../methods/egyptian-survey/examples/input.json');
  assert.throws(() => calculate({...input, latitude: -30}), /rectangle/);
  assert.throws(() => calculate({...input, timeZone: 'UTC'}), /Africa\/Cairo/);
  assert.throws(() => calculate({...input, date: '2026-02-30'}), /Invalid date/);
  assert.throws(() => calculate({...input, recipe: 'adhan-egyptian'}), /Unknown field/);
});
test('JAKIM does not silently change zone variants or ignore a recipe override', async () => {
  const {calculate} = await loadMethod('jakim');
  const input = read('../methods/jakim/examples/input.json');
  assert.throws(() => calculate({...input, variant: 'unknown'}), /Unknown variant/);
  assert.throws(() => calculate({...input, candidate: 'noaa'}), /fixes/);
  assert.throws(() => calculate({date: '2027-06-21', variant: 'sgr01-two-point', zone: 'SGR01', timeZone: 'Asia/Kuala_Lumpur'}), /2024|2026|year|date/i);
});
test('UAE requires environmental inputs instead of silently choosing a site', async () => {
  const {calculate} = await loadMethod('uae-awqaf');
  const {cityWidthKm, ...missingWidth} = read('../methods/uae-awqaf/examples/input.json');
  assert.throws(() => calculate(missingWidth), /cityWidthKm/);
});

test('Roseville experiment is opt-in, fixed to its declared point, and limited to two starts', async () => {
  const fcna = await loadMethod('fcna');
  const input = read('../methods/fcna/examples/roseville-input.json');
  const expected = read('../methods/fcna/examples/roseville-output.json');
  const actual = fcna.calculate(input);
  assert.deepEqual(actual, fcna.calculateRosevilleStartTimes(input.date));
  assert.deepEqual(actual, expected.output);
  assert.equal(expected.evidenceType, 'generated-model-example-not-institutional-reference');
  assert.deepEqual(Object.keys(actual.events).sort(), ['fajr', 'isha']);
  assert.equal(actual.official, false);
  assert.equal(actual.notificationEligible, false);
  assert.throws(() => fcna.calculate({...input, latitude: 38.7}), /Unknown field/);
  assert.throws(() => fcna.calculate({...input, numerical: {ephemeris: 'usno', rounding: 'nearest'}}), /Unknown field/);
  assert.throws(() => fcna.calculate({...input, date: '2026-02-30'}), /Invalid Gregorian date/);
});

test('Geographic and seasonal publication matrix retains all 163 rendered results', async () => {
  const matrix = read('../provenance/wrapper-parity.json');
  assert.equal(matrix.cases, matrix.checks.length);
  for (const row of matrix.checks) {
    const family = row.id.split('/')[0];
    const result = (await loadMethod(family)).calculate(row.input);
    const projection = renderedProjection(result);
    assert.equal(projection.length, row.renderedFields, row.id);
    assert.equal(createHash('sha256').update(JSON.stringify(projection)).digest('hex'), row.renderedSha256,
      `${row.id}: ${JSON.stringify(row.input)}`);
  }
});
