// Source-free arithmetic checks for the four explicitly named channels.
import assert from 'node:assert/strict';
import { calculateAnnualRaw } from '../../../../core/diyanet/calendar.mjs';
import {
  channelProviders,
  solarCoordinatesDeclinationOnly,
  solarCoordinatesEOTOnly,
} from './channels.mjs';
import { solarCoordinatesUSNO } from '../../../../core/astronomy/solar-usno-v2.mjs';
import { solarCoordinatesCenterHybrid } from './solar-center.mjs';

const samples = [];
for (let day = 1; day <= 365; day += 1) {
  samples.push(2461406.5 + day - 1); // 2027-01-01 through 2027-12-31, UTC midnight JD
}
const tolerance = 2e-12;
for (const jd of samples) {
  const base = channelProviders.baselineUSNO(jd);
  const full = channelProviders.fullCenterHybrid(jd);
  const eotOnly = solarCoordinatesEOTOnly(jd);
  const decOnly = solarCoordinatesDeclinationOnly(jd);
  assert.deepEqual(full, solarCoordinatesCenterHybrid(jd));
  assert.deepEqual(base, solarCoordinatesUSNO(jd));
  assert.equal(eotOnly.declination, base.declination);
  assert.equal(eotOnly.equationOfTimeHours, full.equationOfTimeHours);
  assert.equal(eotOnly.rightAscension, full.rightAscension);
  assert.equal(decOnly.declination, full.declination);
  assert.equal(decOnly.equationOfTimeHours, base.equationOfTimeHours);
  assert.equal(decOnly.rightAscension, base.rightAscension);
  for (const provider of Object.values(channelProviders)) {
    const values = provider(jd);
    assert.ok(Number.isFinite(values.declination));
    assert.ok(Number.isFinite(values.equationOfTimeHours));
    assert.ok(Number.isFinite(values.rightAscension));
  }
}

const longitudes = [0, 13.405, 151.2093];
const latitudes = [0, 20, 44]; // all remain on the same low-latitude route
const noonDeltaByProvider = new Map();
let noonComparisons = 0;
for (const longitude of longitudes) {
  for (const latitude of latitudes) {
    const resultByProvider = Object.fromEntries(Object.entries(channelProviders).map(([name, provider]) => [
      name,
      calculateAnnualRaw({ year: 2027, latitude, longitude, timeZone: 'UTC' }, provider, { dateBasis: 'civil-date' }),
    ]));
    const rows = Object.fromEntries(Object.entries(resultByProvider).map(([name, result]) => [
      name, new Map(result.days.map(day => [day.date, day.events.dhuhr.rawEpoch])),
    ]));
    for (const [date, baselineNoon] of rows.baselineUSNO) {
      const eotDelta = rows.eotOnly.get(date) - baselineNoon;
      const fullDelta = rows.fullCenterHybrid.get(date) - baselineNoon;
      const decDelta = rows.declinationOnly.get(date) - baselineNoon;
      assert.ok(Math.abs(eotDelta - fullDelta) <= tolerance, `EOT/full Dhuhr delta differs on ${date}`);
      assert.equal(decDelta, 0, `Declination-only channel changed Dhuhr on ${date}`);
      const expected = noonDeltaByProvider.get(date);
      if (expected === undefined) noonDeltaByProvider.set(date, eotDelta);
      else assert.ok(Math.abs(eotDelta - expected) <= tolerance,
        `EOT-only Dhuhr delta depends on latitude/longitude at ${date}`);
      noonComparisons += 1;
    }
  }
}

console.log(JSON.stringify({
  coordinateSamples: samples.length,
  noonComparisons,
  distinctNoonDates: noonDeltaByProvider.size,
  maximumLatitudeLongitudeSpreadMs: 0,
  guarantees: [
    'EOT-only channel leaves baseline declination and uses hybrid EOT/RA.',
    'Declination-only channel leaves baseline EOT/RA.',
    'Full-hybrid and baseline aliases are unchanged.',
    'For a given date, Dhuhr delta is latitude- and longitude-independent in this core; declination-only changes no Dhuhr.',
  ],
  toleranceUnits: 'UTC epoch milliseconds',
}, null, 2));
