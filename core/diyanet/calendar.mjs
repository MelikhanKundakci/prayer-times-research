import { solarCoordinatesUSNO } from '../astronomy/solar-usno-v2.mjs';
import { DAY_MS, MINUTE_MS } from './astronomy.mjs';
import { dailyGeometry, EVENT_NAMES, roundAdjustedEpoch } from './horizons.mjs';
import { applyNorthernSeason } from './seasonal.mjs';

const ADJUST = Object.freeze({ fajr: 0, sunrise: -7, dhuhr: 5, asr: 4, maghrib: 7, isha: 0 });
const RAD = Math.PI / 180;
const dateOf = epoch => new Date(epoch).toISOString().slice(0, 10);
const formatterFor = zone => new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn', {
  timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});
const localDate = (epoch, fmt) => {
  const p = Object.fromEntries(fmt.formatToParts(epoch).map(x => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
};

function validate({ year, latitude, longitude, timeZone }) {
  if (!Number.isInteger(year) || year < 2001 || year > 2098) throw new RangeError('Supported calendar years are 2001 through 2098');
  if (!Number.isFinite(latitude) || latitude < -60 || latitude > 75) throw new RangeError('Supported latitude is −60 through 75 degrees');
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) throw new RangeError('Longitude must be −180 through 180 degrees');
  if (typeof timeZone !== 'string') throw new TypeError('IANA timeZone is required');
  return formatterFor(timeZone);
}
function datesInYear(year) {
  const result = [];
  for (let epoch = Date.UTC(year, 0, 1); epoch < Date.UTC(year + 1, 0, 1); epoch += DAY_MS) result.push(dateOf(epoch));
  return result;
}
function anchoredDay(date, latitude, longitude, fmt, provider, route) {
  const wanted = Date.parse(`${date}T00:00:00Z`);
  let carrier = wanted;
  for (let i = 0; i < 5; i++) {
    const geometry = dailyGeometry(dateOf(carrier), latitude, longitude, provider, { rejectTangentCrossings: route !== 'north-missing-window', combinedHourCrossings: route === 'north-missing-window' });
    const dateAnchor = route === 'north-missing-window'
      ? roundAdjustedEpoch(geometry.transitEpoch, 'dhuhr', ADJUST.dhuhr)
      : geometry.transitEpoch;
    const shownDate = localDate(dateAnchor, fmt);
    if (shownDate === date) return geometry;
    const shift = wanted - Date.parse(`${shownDate}T00:00:00Z`);
    if (!Number.isFinite(shift) || shift === 0) break;
    carrier += shift;
  }
  throw new RangeError(`Could not anchor calculation to civil date ${date}`);
}
function asrAt(latitude, declination) {
  return Math.atan(1 / (1 + Math.tan(Math.abs(latitude - declination) * RAD))) / RAD;
}
function lowLatitudeRaw(geometry, latitude) {
  const transit = geometry.transitEpoch;
  const sun = geometry.declinationDegrees * RAD, phi = latitude * RAD;
  const crossing = altitude => {
    const c = (Math.sin(altitude * RAD) - Math.sin(phi) * Math.sin(sun)) / (Math.cos(phi) * Math.cos(sun));
    return Number.isFinite(c) && Math.abs(c) < 1 ? transit + Math.acos(c) / RAD / 15 * 3_600_000 : null;
  };
  // Low-latitude daily model uses the UTC-00 ephemeris and −17° Isha threshold.
  const ishaC = (Math.sin(-17 * RAD) - Math.sin(phi) * Math.sin(sun)) / (Math.cos(phi) * Math.cos(sun));
  return { ...geometry.raw, asr: crossing(asrAt(latitude, geometry.declinationDegrees)), isha: Number.isFinite(ishaC) && Math.abs(ishaC) < 1 ? transit + Math.acos(ishaC) / RAD / 15 * 3_600_000 : null };
}
function boundHorizons(sunrise, sunset, dhuhr, polarDay) {
  if (sunrise === null || sunset === null) return { sunrise: dhuhr - (polarDay ? 570 : 150), maghrib: dhuhr + (polarDay ? 570 : 150), rule: polarDay ? 'polar-day-5h-night' : 'polar-night-5h-day', estimated: true };
  const rise = Math.min(dhuhr - 150, Math.max(sunrise, dhuhr - 570));
  const set = Math.max(dhuhr + 150, Math.min(sunset, dhuhr + 570));
  const changed = rise !== sunrise || set !== sunset;
  return { sunrise: rise, maghrib: set, rule: changed ? 'five-hour-horizon-clamp' : 'adjusted-geometric-horizons', estimated: changed };
}
function northernRows(geometries, dates, latitude) {
  const rows = geometries.map(g => {
    const minute = (epoch, adjustment = 0) => epoch === null ? null : (epoch - g.midnightEpoch) / MINUTE_MS + adjustment;
    const raw = g.raw;
    const sunrise = minute(raw.sunrise, -7), maghrib = minute(raw.maghrib, 7), dhuhr = minute(raw.dhuhr, 5);
    const polar = raw.sunrise === null || raw.maghrib === null;
    const polarDay = polar ? latitude * g.declinationDegrees > 0 : undefined;
    const asr = raw.asr === null || g.solarNoonAltitudeDegrees <= 0 || (polar && !polarDay) ? null : minute(raw.asr, 4);
    const bounded = boundHorizons(sunrise, maghrib, dhuhr, polarDay);
    return { fajr: minute(raw.fajr), sunrise: bounded.sunrise, dhuhr, asr, maghrib: bounded.maghrib,
      isha: minute(raw.isha), _estimatedHorizons: bounded.estimated, _horizonRule: bounded.rule,
      _polarDay: polarDay, _rawAsr: raw.asr };
  });
  const solstice = dates.findIndex(d => d.endsWith('-06-21'));
  if (solstice < 0) throw new RangeError('Northern annual calendar requires June 21');
  const solsticeNoon = rows[solstice].dhuhr;
  const above60 = latitude >= 60;
  if (above60) {
    rows.forEach(row => {
      const beforeRise = row.sunrise, beforeSet = row.maghrib;
      row.sunrise = Math.max(row.sunrise, solsticeNoon - 570);
      row.maghrib = Math.min(row.maghrib, solsticeNoon + 570);
      if (row.sunrise !== beforeRise || row.maghrib !== beforeSet) { row._estimatedHorizons = true; row._horizonRule += '-solstice-bound'; }
    });
    for (let i = solstice + 1; i < rows.length; i++) {
      const value = Math.max(rows[i].sunrise, rows[i - 1].sunrise);
      if (value !== rows[i].sunrise) { rows[i]._estimatedHorizons = true; rows[i]._horizonRule += '-monotonic-envelope'; }
      rows[i].sunrise = value;
    }
    for (let i = solstice - 1; i >= 0; i--) {
      const value = Math.min(rows[i].maghrib, rows[i + 1].maghrib);
      if (value !== rows[i].maghrib) { rows[i]._estimatedHorizons = true; rows[i]._horizonRule += '-monotonic-envelope'; }
      rows[i].maghrib = value;
    }
  }
  const seasonal = applyNorthernSeason(rows, dates, { missingWindow: true });
  const twilightEnvelopeApplied = { fajr: dates.map(() => false), isha: dates.map(() => false) };
  if (above60) {
    for (const name of ['fajr', 'isha']) {
      const bound = seasonal.values[name][solstice];
      seasonal.values[name] = seasonal.values[name].map((v, i) => {
        if (v === null) return null;
        const adjusted = name === 'fajr' ? Math.max(v, bound) : Math.min(v, bound);
        twilightEnvelopeApplied[name][i] = adjusted !== v;
        return adjusted;
      });
    }
  }
  return { rows, seasonal, solsticeIndex: solstice, above60, twilightEnvelopeApplied };
}

/** Calculate the frozen Diyanet baseline for one complete Gregorian year. */
export function calculateAnnualRaw(input, astronomy = solarCoordinatesUSNO) {
  if (!input || Object.getPrototypeOf(input) !== Object.prototype) throw new TypeError('Plain options object required');
  const { year, latitude, longitude, timeZone } = input;
  const formatter = validate(input);
  if (!Number.isFinite(latitude)) throw new TypeError('Latitude must be finite');
  const route = latitude < 0 ? 'south' : latitude < 44.5 ? 'low-latitude' : 'north-missing-window';
  const dates = datesInYear(year);
  const geometries = dates.map(date => anchoredDay(date, latitude, longitude, formatter, astronomy, route));
  let seasonalMetadata = null, seasonalRows = null;
  if (route === 'north-missing-window') {
    const result = northernRows(geometries, dates, latitude);
    seasonalRows = result;
    seasonalMetadata = { ...result.seasonal.metadata, variant: 'missing-window', solsticeClockEnvelopeApplied: result.above60 };
  }
  const days = dates.map((date, index) => {
    const geometry = geometries[index];
    const events = {};
    if (route === 'north-missing-window') {
      const { rows, seasonal, twilightEnvelopeApplied } = seasonalRows;
      const row = rows[index];
      for (const name of EVENT_NAMES) {
        let minutes, rule, estimated = false;
        if (name === 'fajr' || name === 'isha') {
          minutes = seasonal.values[name][index]; rule = seasonal.rules[name][index];
          if (twilightEnvelopeApplied[name][index]) rule += '-solstice-clock-envelope';
          estimated = rule !== 'angle';
        } else if (name === 'sunrise' || name === 'maghrib') {
          minutes = row[name]; rule = row._horizonRule; estimated = row._estimatedHorizons;
        } else if (name === 'dhuhr') { minutes = row.dhuhr; rule = 'solar-transit-plus-5'; }
        else {
          const fallback = row.asr === null;
          minutes = fallback ? row.dhuhr : row.asr;
          rule = fallback ? 'missing-shadow-use-dhuhr' : 'daily-declination-shadow-1-plus-4'; estimated = fallback;
        }
        const adjustedEpoch = minutes === null ? null : geometry.midnightEpoch + minutes * MINUTE_MS;
        events[name] = { rawEpoch: adjustedEpoch, rule: rule ?? 'unavailable-no-geometric-crossing', estimated };
      }
    } else {
      const model = lowLatitudeRaw(geometry, latitude);
      for (const name of EVENT_NAMES) {
        const adjustment = ADJUST[name];
        const rawEpoch = name === 'maghrib' ? model.maghrib : model[name];
        events[name] = { rawEpoch: rawEpoch === null ? null : rawEpoch + adjustment * MINUTE_MS,
          rule: rawEpoch === null ? 'unavailable-no-geometric-crossing' : `daily-utc00-${name}-adjustment-${adjustment}m`, estimated: false };
      }
    }
    return { date, solarCalculationDate: geometry.calculationDate, events };
  });
  return { year, latitude, longitude, timeZone, route, seasonal: seasonalMetadata, days };
}

export { DAY_MS, MINUTE_MS };
