import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { solarCoordinates } from './spa.mjs';

const near = (actual, expected, tolerance, label) => {
  assert.ok(Math.abs(actual - expected) <= tolerance,
    `${label}: expected ${expected} ± ${tolerance}, got ${actual}`);
};

// Reda & Andreas (2008), Appendix A.5: 2003-10-17 19:30:30 UT, ΔT=67s.
// The printed JD and table values are rounded by the report.
const example = solarCoordinates(2452930.312847, { deltaTSeconds: 67 });
near(example.heliocentricLongitude, 24.0182616917, 5e-7, 'worked-example heliocentric longitude');
near(example.heliocentricLatitude, -0.0001011219, 5e-10, 'worked-example heliocentric latitude');
near(example.earthSunDistanceAu, 0.9965422974, 5e-10, 'worked-example Earth-Sun distance');
near(example.nutationLongitude, -0.00399840, 5e-9, 'worked-example longitude nutation');
near(example.nutationObliquity, 0.00166657, 5e-9, 'worked-example obliquity nutation');
near(example.apparentSolarLongitude, 204.0085519281, 3e-7, 'worked-example apparent longitude');
near(example.rightAscension, 202.22741, 5e-6, 'worked-example right ascension');
near(example.declination, -9.31434, 5e-6, 'worked-example declination');
near(example.equationOfTime, 14.641503, 1e-5, 'worked-example equation of time minutes');
near(example.equationOfTimeDegrees, example.equationOfTime / 4, 1e-14, 'equation of time degrees/minutes conversion');
assert.equal(example.nutationArgumentsDegrees.length, 5);
assert.equal(example.deltaTSeconds, 67);
assert.equal(example.assumedUt1MinusUtcSeconds, 0);

// Cross-check against an independently executed pvlib-python v0.13.1 grid.
const fixture = JSON.parse(await readFile(new URL('./pvlib-grid-fixture.json', import.meta.url)));
assert.equal(fixture.sampleCount, fixture.records.length);
assert.equal(fixture.sampleCount, 64);
let maxDifference = { rightAscension: 0, declination: 0, equationOfTime: 0 };
for (const row of fixture.records) {
  const actual = solarCoordinates(row.jdUtc, { deltaTSeconds: row.deltaTSeconds });
  for (const key of Object.keys(maxDifference)) {
    const difference = Math.abs(actual[key] - row[key]);
    maxDifference[key] = Math.max(maxDifference[key], difference);
    near(actual[key], row[key], 2e-10, `pvlib ${row.utc} ${key}`);
  }
}

assert.throws(() => solarCoordinates(Number.NaN), /finite number/);
assert.throws(() => solarCoordinates(2451545, { deltaTSeconds: Number.NaN }), /finite number/);
console.log(JSON.stringify({ reportExample: 'pass', pvlibGridSamples: fixture.sampleCount, maxDifference }));
