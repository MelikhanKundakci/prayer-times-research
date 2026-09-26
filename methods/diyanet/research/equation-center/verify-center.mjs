// Cross-language arithmetic check only; does not evaluate prayer calendars.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { noaaEquationOfCenter, solarCoordinatesCenterHybrid } from './solar-center.mjs';

const dates = [];
for (let year = 1800; year <= 2200; year += 4) {
  for (const dayOfYear of [1, 32, 80, 172, 266, 355, 366]) {
    dates.push(2451545 + (Date.UTC(year, 0, dayOfYear) - Date.UTC(2000, 0, 1, 12)) / 86400000);
  }
}
dates.push(2451545, 2451545 - 36525 * 3, 2451545 + 36525 * 3);

const oraclePath = fileURLToPath(new URL('./center-oracle.py', import.meta.url));
const oracle = spawnSync('python3', [oraclePath], {
  input: JSON.stringify(dates),
  encoding: 'utf8',
});
assert.equal(oracle.status, 0, oracle.stderr || 'Python oracle failed');
const expected = JSON.parse(oracle.stdout);
assert.equal(expected.length, dates.length);

const tolerances = {
  declination: 2e-12,
  equationOfTimeHours: 2e-13,
  rightAscension: 2e-13,
};
for (let index = 0; index < dates.length; index += 1) {
  const actual = solarCoordinatesCenterHybrid(dates[index]);
  for (const [field, tolerance] of Object.entries(tolerances)) {
    assert.ok(Number.isFinite(actual[field]), `${field} finite at sample ${index}`);
    assert.ok(
      Math.abs(actual[field] - expected[index][field]) <= tolerance,
      `${field} differs at sample ${index}: ${actual[field]} vs ${expected[index][field]}`,
    );
  }
}

assert.throws(() => solarCoordinatesCenterHybrid(Number.NaN), /Finite Julian date/);
assert.throws(() => solarCoordinatesCenterHybrid(Infinity), /Finite Julian date/);
assert.throws(() => solarCoordinatesCenterHybrid('2451545'), /Finite Julian date/);
assert.throws(() => noaaEquationOfCenter(Number.NaN), /Finite Julian centuries/);
console.log(`Independent Python arithmetic oracle passed for ${dates.length} Julian dates.`);
