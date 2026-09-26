import { solarAt, DAY_MS, HOUR_MS, MINUTE_MS } from './astronomy.mjs';

const RAD = Math.PI / 180;
export const BASE_ADJUSTMENTS_MINUTES = Object.freeze({ fajr: 0, sunrise: -7, dhuhr: 5, asr: 4, maghrib: 7, isha: 0 });
export const EVENT_NAMES = Object.freeze(['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']);

export function dailyGeometry(calculationDate, latitude, longitude, provider, { rejectTangentCrossings = false, combinedHourCrossings = false } = {}) {
  const midnight = Date.parse(`${calculationDate}T00:00:00Z`);
  if (!Number.isFinite(midnight) || new Date(midnight).toISOString().slice(0, 10) !== calculationDate) throw new RangeError('Invalid Gregorian solar calculation date');
  const sun = solarAt(midnight, provider), phi = latitude * RAD, delta = sun.declinationDegrees * RAD;
  const transitHours = 12 - longitude / 15 - sun.equationOfTimeHours;
  const transit = midnight + transitHours * HOUR_MS;
  const crossing = (altitudeDegrees, morning) => {
    const h = altitudeDegrees * RAD;
    const cosine = (Math.sin(h) - Math.sin(phi) * Math.sin(delta)) / (Math.cos(phi) * Math.cos(delta));
    if (!Number.isFinite(cosine) || Math.abs(cosine) > 1 || (rejectTangentCrossings && Math.abs(cosine) === 1)) return null;
    const hourAngleHours = (morning ? -1 : 1) * Math.acos(cosine) / RAD / 15;
    return combinedHourCrossings ? midnight + (transitHours + hourAngleHours) * HOUR_MS
      : transit + hourAngleHours * HOUR_MS;
  };
  const asrAltitude = Math.atan(1 / (1 + Math.tan(Math.abs(latitude - sun.declinationDegrees) * RAD))) / RAD;
  return {
    calculationDate, midnightEpoch: midnight, transitEpoch: transit,
    declinationDegrees: sun.declinationDegrees, equationOfTimeHours: sun.equationOfTimeHours,
    solarNoonAltitudeDegrees: 90 - Math.abs(latitude - sun.declinationDegrees),
    raw: {
      fajr: crossing(-18, true), sunrise: crossing(-50 / 60, true), dhuhr: transit,
      asr: asrAltitude > 0 ? crossing(asrAltitude, false) : null,
      maghrib: crossing(-50 / 60, false), isha: crossing(-16, false),
    },
  };
}

export function roundAdjustedEpoch(rawEpoch, event, adjustmentMinutes = BASE_ADJUSTMENTS_MINUTES[event]) {
  if (rawEpoch === null) return null;
  if (!Number.isFinite(rawEpoch) || !Number.isFinite(adjustmentMinutes)) throw new TypeError('Finite raw epoch and minute adjustment required');
  return Math.floor((rawEpoch + adjustmentMinutes * MINUTE_MS) / MINUTE_MS + 0.5) * MINUTE_MS;
}

export function localDateAt(epochMs, formatter) {
  return Object.fromEntries(formatter.formatToParts(epochMs).map(({ type, value }) => [type, value]));
}
