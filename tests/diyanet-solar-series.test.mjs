import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {solarCoordinatesUSNO} from '../core/astronomy/solar-usno-v2.mjs';
import {SOLAR_VARIANTS, solarCoordinatesVariant} from '../methods/diyanet/research/ra-series/solar-coordinates.mjs';

const base = new URL('../methods/diyanet/research/ra-series/', import.meta.url);
const fixtures = JSON.parse(readFileSync(new URL('model-only-fixtures.json', base), 'utf8'));

test('Research solar alternatives agree with independently generated Python fixtures', () => {
  assert.equal(fixtures.sourceObservationsUsed, false);
  assert.deepEqual(fixtures.variants, SOLAR_VARIANTS);
  for (const [name, key] of [['independent_solar.py', 'independentImplementationSha256'], ['generate_fixtures.py', 'generatorSha256']]) {
    assert.equal(createHash('sha256').update(readFileSync(new URL(name, base))).digest('hex'), fixtures[key]);
  }
  for (const fixture of fixtures.cases) for (const variant of SOLAR_VARIANTS) {
    const value = solarCoordinatesVariant(fixture.julianDate, variant);
    for (const key of ['declination', 'rightAscension', 'equationOfTimeHours']) {
      assert.ok(Math.abs(value[key] - fixture.variants[variant][key]) <= fixtures.suggestedAbsoluteTolerance[key],
        `${fixture.date} ${variant} ${key}`);
    }
  }
});

test('Current atan2 control exactly preserves the public solar formula', () => {
  for (let jd = 2433282.5; jd <= 2469807.5; jd += 3.125) {
    assert.deepEqual(solarCoordinatesVariant(jd, 'current-atan2'), solarCoordinatesUSNO(jd));
  }
});

test('A right-ascension-only series change preserves declination and changes noon on both sides', () => {
  for (const family of ['current', 'legacy']) {
    let min = Infinity, max = -Infinity;
    for (let epoch = Date.UTC(2026, 0, 1); epoch < Date.UTC(2027, 0, 1); epoch += 86400000) {
      const jd = epoch / 86400000 + 2440587.5;
      const exact = solarCoordinatesVariant(jd, `${family}-atan2`);
      const series = solarCoordinatesVariant(jd, `${family}-series`);
      assert.equal(series.declination, exact.declination);
      const changeSeconds = (exact.equationOfTimeHours - series.equationOfTimeHours) * 3600;
      min = Math.min(min, changeSeconds); max = Math.max(max, changeSeconds);
      assert.ok(Math.abs(changeSeconds) < 0.38, 'The omitted series tail is a sub-second numerical effect in this year');
    }
    assert.ok(min < -0.37 && max > 0.37, 'Both signs must remain visible; this is not a constant city offset');
  }
});

test('Research formula requires an explicit declared variant and finite Julian date', () => {
  for (const jd of [NaN, Infinity, '2461212.5', null]) assert.throws(() => solarCoordinatesVariant(jd, 'current-atan2'));
  for (const variant of [undefined, null, 'official-diyanet', 'auto']) assert.throws(() => solarCoordinatesVariant(2461212.5, variant));
  assert.ok(Object.isFrozen(SOLAR_VARIANTS));
});
