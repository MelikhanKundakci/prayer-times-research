// Experimental source-led reconstruction. No official calendar values or network I/O.
// Vendor location column interpretation and production settings remain unconfirmed.
import { solarCoordinatesUSNO } from '../../../core/astronomy/solar-usno-v2.mjs';

const RAD = Math.PI / 180, HOUR = 3600000, EARTH_METERS = 6371000;
export const EVENTS = Object.freeze(['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']);
export const DEFAULTS = Object.freeze({ angle: 18, asrOffsetMinutes: 0, dhuhrOffsetMinutes: 2,
  asrRefraction: 'noon-and-event', atmosphere: 'scaled-standard', geometry: 'width-and-height' });
const KEYS = new Set(Object.keys(DEFAULTS));

export function refractionDegrees(geometricAltitude) {
  // NOAA's documented optical solar-position approximation, not IAC's Hohenkerk/Sinclair implementation.
  if (!Number.isFinite(geometricAltitude) || geometricAltitude < 0 || geometricAltitude > 90) throw new Error('Refraction diagnostic requires altitude 0..90.');
  if (geometricAltitude >= 85) return 0;
  const tangent = Math.tan(geometricAltitude * RAD);
  if (geometricAltitude >= 5) return (58.1 / tangent - .07 / tangent ** 3 + .000086 / tangent ** 5) / 3600;
  const h = geometricAltitude;
  return (1735 - 518.2 * h + 103.4 * h ** 2 - 12.79 * h ** 3 + .711 * h ** 4) / 3600;
}

export function calculateDay(date, point, options = {}) {
  if (typeof date !== 'string' || !/^20\d{2}-\d{2}-\d{2}$/.test(date)) throw new Error('Expected date 2000..2099, YYYY-MM-DD.');
  const epoch = Date.parse(date + 'T00:00:00Z');
  if (!Number.isFinite(epoch) || new Date(epoch).toISOString().slice(0, 10) !== date) throw new Error('Invalid civil date.');
  if (!point || typeof point !== 'object' || Array.isArray(point)) throw new Error('Explicit point required.');
  const { latitude, longitude, elevationMeters, cityWidthKm, pressureMillibars, temperatureCelsius, timeZone } = point;
  if (!Number.isFinite(latitude) || latitude < 22 || latitude > 27 || !Number.isFinite(longitude) || longitude < 51 || longitude > 57) throw new Error('Experimental domain: UAE numeric coordinates only.');
  for (const [name, value, low, high] of [['elevationMeters', elevationMeters, 0, 1500], ['cityWidthKm', cityWidthKm, 0, 100], ['pressureMillibars', pressureMillibars, 800, 1100], ['temperatureCelsius', temperatureCelsius, -10, 60]]) {
    if (!Number.isFinite(value) || value < low || value > high) throw new Error('Invalid explicit ' + name);
  }
  if (timeZone !== 'Asia/Dubai') throw new Error('Explicit Asia/Dubai required.');
  if (!options || typeof options !== 'object' || Array.isArray(options)) throw new Error('Invalid options.');
  for (const [key, value] of Object.entries(options)) if (!KEYS.has(key) || value === undefined) throw new Error('Unknown/undefined option: ' + key);
  const recipe = { ...DEFAULTS, ...options };
  if (![18, 18.2].includes(recipe.angle) || ![0, 1].includes(recipe.asrOffsetMinutes) || recipe.dhuhrOffsetMinutes !== 2 ||
      !['none', 'noon-only', 'noon-and-event'].includes(recipe.asrRefraction) || !['standard', 'scaled-standard'].includes(recipe.atmosphere) ||
      !['width-and-height', 'width-only', 'height-only', 'point-only'].includes(recipe.geometry)) throw new Error('Unsupported research variant.');
  const useWidth = ['width-and-height', 'width-only'].includes(recipe.geometry);
  const useHeight = ['width-and-height', 'height-only'].includes(recipe.geometry);
  const eastLongitude = longitude + (useWidth ? cityWidthKm * 1000 / (EARTH_METERS * Math.cos(latitude * RAD)) / RAD : 0);
  const dip = useHeight ? Math.acos(EARTH_METERS / (EARTH_METERS + elevationMeters)) / RAD : 0;
  const atmosphereScale = recipe.atmosphere === 'scaled-standard' ? pressureMillibars / 1010 * 283 / (273 + temperatureCelsius) : 1;
  const horizonAltitude = -(16 / 60 + 34 / 60 * atmosphereScale + dip);
  const jd = epoch / 86400000 + 2440587.5;
  const at = hour => solarCoordinatesUSNO(jd + hour / 24);
  const transit = lon => {
    let hour = 12 - lon / 15;
    for (let i = 0; i < 6; i++) hour = 12 - lon / 15 - at(hour).equationOfTimeHours;
    return hour;
  };
  const noon = transit(longitude);
  const event = (altitude, after, lon) => {
    let hour = transit(lon) + (after ? 6 : -6);
    for (let i = 0; i < 6; i++) {
      const s = at(hour);
      const cosine = (Math.sin(altitude * RAD) - Math.sin(latitude * RAD) * Math.sin(s.declination * RAD)) / (Math.cos(latitude * RAD) * Math.cos(s.declination * RAD));
      if (cosine < -1 || cosine > 1) return null;
      hour = 12 - lon / 15 - s.equationOfTimeHours + (after ? 1 : -1) * Math.acos(cosine) / RAD / 15;
    }
    return hour;
  };
  const noonAltitude = 90 - Math.abs(latitude - at(noon).declination);
  const noonApparentAltitude = noonAltitude + (recipe.asrRefraction !== 'none' ? refractionDegrees(noonAltitude) * atmosphereScale : 0);
  const asrApparentAltitude = Math.atan(1 / (1 + 1 / Math.tan(noonApparentAltitude * RAD))) / RAD;
  let asrGeometricAltitude = asrApparentAltitude;
  if (recipe.asrRefraction === 'noon-and-event') {
    for (let i = 0; i < 5; i++) asrGeometricAltitude = asrApparentAltitude - refractionDegrees(asrGeometricAltitude) * atmosphereScale;
  }
  const asrHour = event(asrGeometricAltitude, true, longitude);
  const hours = {
    fajr: event(-recipe.angle, false, eastLongitude), sunrise: event(horizonAltitude, false, eastLongitude),
    dhuhr: noon + recipe.dhuhrOffsetMinutes / 60, asr: asrHour === null ? null : asrHour + recipe.asrOffsetMinutes / 60,
    maghrib: event(horizonAltitude, true, longitude), isha: event(-recipe.angle, true, longitude),
  };
  const events = {}, times = {};
  for (const name of EVENTS) {
    const hour = hours[name];
    if (!Number.isFinite(hour)) { events[name] = { status: 'unavailable', utc: null, date: null, time: null }; times[name] = null; continue; }
    const unroundedEpoch = epoch + hour * HOUR, roundedEpoch = Math.round(unroundedEpoch / 60000) * 60000;
    const local = new Date(roundedEpoch + 4 * HOUR).toISOString();
    if (local.slice(0, 10) !== date) throw new Error('Unexpected local-date overflow in restricted UAE domain.');
    times[name] = local.slice(11, 16);
    events[name] = { status: 'unconfirmed-reconstruction', time: times[name], date, utc: new Date(roundedEpoch).toISOString(),
      unroundedUtc: new Date(unroundedEpoch).toISOString(), calculationLongitude: ['fajr', 'sunrise'].includes(name) ? eastLongitude : longitude,
      eligibleForAutomaticNotifications: false };
  }
  return { date, profile: 'uae-vendor-geometry-v2-experiment', official: false, appReady: false, timeZone, recipe, times, events,
    diagnostics: { eastLongitude, westLongitude: longitude, dipDegrees: dip, atmosphereScale, horizonAltitude, noonAltitude, noonApparentAltitude, asrApparentAltitude, asrGeometricAltitude },
    qualityFlags: ['independent-reconstruction', 'vendor-column-schema-inferred', 'official-production-configuration-unconfirmed', 'refraction-approximation-not-vendor-algorithm', 'research-only'] };
}
