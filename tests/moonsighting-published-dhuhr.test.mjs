import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {calculate, calculateGeometry} from '../methods/moonsighting-committee/index.mjs';

const inputs = [
  {year: 2028, latitude: 33.5731, longitude: -7.5898, timeZone: 'Africa/Casablanca', shafaq: 'general'},
  {year: 2031, latitude: 27.7172, longitude: 85.324, timeZone: 'Asia/Kathmandu', shafaq: 'abyad'},
  {year: 2027, latitude: 69.6492, longitude: 18.9553, timeZone: 'Europe/Oslo', shafaq: 'ahmar'},
];

test('Published MSC margin runs offline with calendar reads and child processes denied', () => {
  const root = new URL('../', import.meta.url);
  const file = p => fileURLToPath(new URL(p, root));
  const input = {...inputs[0], variant: 'published-dhuhr-five-minutes'};
  const code = `import assert from 'node:assert/strict';
    import {readFileSync} from 'node:fs';
    import {spawnSync} from 'node:child_process';
    import {calculate} from ${JSON.stringify(new URL('methods/moonsighting-committee/index.mjs', root).href)};
    assert.equal(process.permission.has('net'), false);
    assert.throws(() => spawnSync(process.execPath, ['--version']), {code: 'ERR_ACCESS_DENIED'});
    for (const p of ${JSON.stringify(['methods/moonsighting-committee/validation.json', 'node_modules/adhan/package.json'].map(file))})
      assert.throws(() => readFileSync(p), {code: 'ERR_ACCESS_DENIED'});
    process.stdout.write(JSON.stringify(calculate(${JSON.stringify(input)})));`;
  const allow = ['package.json', 'methods/moonsighting-committee/index.mjs',
    'methods/moonsighting-committee/implementation/', 'core/input.mjs', 'core/astronomy/'];
  for (const TZ of ['UTC', 'Pacific/Honolulu']) {
    const run = spawnSync(process.execPath, ['--permission', ...allow.map(p => '--allow-fs-read=' + file(p)),
      '--input-type=module', '--eval', code], {encoding: 'utf8', timeout: 30000, env: {...process.env, TZ}});
    assert.ifError(run.error);
    assert.equal(run.status, 0, run.stderr);
    assert.deepEqual(JSON.parse(run.stdout), calculate(input));
  }
});

test('Published MSC Dhuhr margin is opt-in and default output is preserved', () => {
  const input = inputs[0];
  assert.deepEqual(calculate(input), calculateGeometry(input));
  assert.deepEqual(calculate({...input, variant: 'usno-v4.2'}), calculateGeometry(input));
  assert.throws(() => calculate({...input, variant: 'published'}), /Unknown variant/);
  assert.throws(() => calculate({...input, variant: 'published-dhuhr-five-minutes', dhuhrRounding: 'nearest'}), /fixes/);
});

test('Five-minute variant retains every non-Dhuhr event, civil date and missing-event status', () => {
  let changedDhuhr = 0, unavailable = 0;
  for (const input of inputs) {
    const before = structuredClone(input);
    const baseline = calculate(input);
    const candidate = calculate({...input, variant: 'published-dhuhr-five-minutes'});
    assert.deepEqual(input, before);
    assert.equal(candidate.length, baseline.length);
    candidate.forEach((row, index) => {
      const old = baseline[index];
      assert.equal(row.date, old.date);
      assert.equal(row.solarCalculationDate, old.solarCalculationDate);
      assert.equal(row.calculationLatitude, old.calculationLatitude);
      for (const event of Object.keys(row.times)) {
        if (event === 'dhuhr') continue;
        assert.equal(row.times[event], old.times[event], `${row.date} ${event}`);
        assert.equal(row.instants[event], old.instants[event], `${row.date} ${event}`);
        assert.equal(row.eventDates[event], old.eventDates[event], `${row.date} ${event}`);
        if (row.times[event] === null) {
          unavailable++;
          assert.equal(row.eventStatus[event], 'unavailable');
        }
      }
      const delta = Date.parse(row.instants.dhuhr) - Date.parse(old.instants.dhuhr);
      assert.ok(delta === 0 || delta === 60000, `Only a nearest-minute threshold may change: ${delta}`);
      changedDhuhr += Number(delta !== 0);
      assert.equal(row.dhuhrCalculation.adjustmentSeconds, 300);
      assert.equal(row.dhuhrCalculation.notificationEligible, false);
      assert.ok(Math.abs(Date.parse(row.instants.dhuhr) - row.dhuhrCalculation.adjustedEpochMs) <= 30000);
      // The old margin is exactly 1.2 s earlier before rounding. This must
      // reconstruct its output, including the narrow changed-minute cases.
      const baselineRounded = Math.floor((row.dhuhrCalculation.adjustedEpochMs - 1200 + 30000) / 60000) * 60000;
      assert.equal(baselineRounded, Date.parse(old.instants.dhuhr));
      for (const event of ['asr_standard', 'asr_hanafi']) {
        const beforeDhuhr = row.instants[event] !== null && row.instants[event] < row.instants.dhuhr;
        assert.equal(row.qualityFlags.some(f => f.event === event && f.code === 'before-adjusted-dhuhr'), beforeDhuhr);
      }
    });
  }
  assert.ok(changedDhuhr > 0, 'The sample exercises a changed rounding boundary');
  assert.ok(unavailable > 0, 'The sample retains polar unavailable events');
});
