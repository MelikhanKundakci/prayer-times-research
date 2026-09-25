// Separate southern research hypothesis. No calendars, location database or I/O.
import { solarCoordinatesUSNO } from '../../../../core/astronomy/solar-usno-v2.mjs';
import { findLevelCrossings, solarAltitude } from '../../../../core/astronomy/continuous-solver.mjs';

const DAY = 86400000, HOUR = 3600000, RAD = Math.PI / 180;
export const EVENTS = Object.freeze(['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']);
export const VARIANTS = Object.freeze(['usno-daily-utc0', 'usno-continuous']);
export const ADJUSTMENTS = Object.freeze({ fajr: 0, sunrise: -7, dhuhr: 5, asr: 4, maghrib: 7, isha: 0 });
const fields = (input, expected) => {
  if (!input || Object.getPrototypeOf(input) !== Object.prototype) throw new TypeError('Plain own-data input required');
  const descriptors = Object.getOwnPropertyDescriptors(input), keys = Reflect.ownKeys(descriptors);
  if (keys.length !== expected.length || keys.some(k => typeof k !== 'string' || !expected.includes(k)
    || !descriptors[k].enumerable || !Object.hasOwn(descriptors[k], 'value'))) throw new TypeError('Exactly the documented own enumerable data fields required');
};
function dateEpoch(date) {
  if (typeof date !== 'string' || !/^20\d\d-\d\d-\d\d$/.test(date)) throw new RangeError('Civil date in2000–2099 required');
  const epoch = Date.parse(date + 'T00:00:00Z');
  if (!Number.isFinite(epoch) || new Date(epoch).toISOString().slice(0, 10) !== date) throw new RangeError('Invalid Gregorian date');
  return epoch;
}
function validate(input) {
  fields(input, ['date', 'latitude', 'longitude', 'timeZone', 'variant']);
  const epoch = dateEpoch(input.date);
  if (typeof input.latitude !== 'number' || !Number.isFinite(input.latitude) || input.latitude < -60 || input.latitude >= 0)
    throw new RangeError('Explicit southern research domain: −60≤latitude<0');
  if (typeof input.longitude !== 'number' || !Number.isFinite(input.longitude) || Math.abs(input.longitude) > 180)
    throw new RangeError('Longitude in−180…180 required');
  if (typeof input.timeZone !== 'string' || (input.timeZone !== 'UTC' && !input.timeZone.includes('/'))) throw new RangeError('Explicit IANA timezone required');
  if (!VARIANTS.includes(input.variant)) throw new RangeError('Known southern numerical variant required');
  const formatter = new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn', {
    timeZone: input.timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  });
  return { epoch, formatter };
}
function civil(epoch, formatter) {
  const parts = Object.fromEntries(formatter.formatToParts(epoch).map(p => [p.type, p.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}
const sun = epoch => solarCoordinatesUSNO(epoch / DAY + 2440587.5);
function transitAt(carrier, longitude, variant) {
  if (variant === 'usno-daily-utc0') return carrier + (12 - longitude / 15 - sun(carrier).equationOfTimeHours) * HOUR;
  let transit = carrier + (12 - longitude / 15) * HOUR;
  for (let i = 0; i < 12; i++) transit = carrier + (12 - longitude / 15 - sun(transit).equationOfTimeHours) * HOUR;
  return transit;
}
function cycle(input, epoch, formatter) {
  let carrier = epoch;
  for (let attempt = 0; attempt < 4; attempt++) {
    const transit = transitAt(carrier, input.longitude, input.variant);
    const actualDate = civil(transit, formatter).date;
    if (actualDate === input.date) return { carrier, transit };
    carrier += epoch - Date.parse(actualDate + 'T00:00:00Z');
  }
  throw new RangeError('Requested civil date has no matching solar transit; possibly skipped by timezone');
}
function fixedEvents(input, carrier, transit) {
  const coordinates = sun(carrier), phi = input.latitude * RAD, delta = coordinates.declination * RAD;
  const event = (altitude, sign) => {
    const cosine = (Math.sin(altitude * RAD) - Math.sin(phi) * Math.sin(delta)) / (Math.cos(phi) * Math.cos(delta));
    if (!Number.isFinite(cosine) || Math.abs(cosine) >= 1) return { epoch: null, reason: 'no-crossing-in-fixed-daily-geometry' };
    return { epoch: transit + sign * Math.acos(cosine) / RAD / 15 * HOUR, reason: null };
  };
  const zenith = Math.abs(input.latitude - coordinates.declination);
  const asrAltitude = Math.atan(1 / (1 + Math.tan(zenith * RAD))) / RAD;
  return { fajr: event(-18, -1), sunrise: event(-50 / 60, -1), dhuhr: { epoch: transit, reason: null },
    asr: zenith < 90 && asrAltitude > 0 ? event(asrAltitude, 1) : { epoch: null, reason: 'no-positive-shadow-target' },
    maghrib: event(-50 / 60, 1), isha: event(-17, 1) };
}
function continuousEvents(input, transit) {
  const height = epoch => solarAltitude(epoch, input.latitude, input.longitude);
  const crossing = (event, threshold, rising) => {
    const startEpoch = rising ? transit - 12 * HOUR : transit, endEpoch = rising ? transit : transit + 12 * HOUR;
    const result = findLevelCrossings({ startEpoch, endEpoch, valueAt: epoch => height(epoch) - (typeof threshold === 'function' ? threshold(epoch) : threshold) });
    const found = result.crossings.filter(c => c.direction === (rising ? 'rising' : 'setting'));
    if (found.length > 1) return { epoch: null, reason: 'multiple-crossings-not-resolved', solverStatus: result.status };
    return { epoch: found[0]?.epoch ?? null, reason: found.length ? null : result.status, solverStatus: result.status };
  };
  const asr = epoch => Math.atan(1 / (1 + Math.tan(Math.abs(input.latitude - sun(epoch).declination) * RAD))) / RAD;
  // Within −60≤latitude<0 the declination never pushes this target outside its
  // positive domain; no polar noon substitute or northern seasonal rule exists.
  return { fajr: crossing('fajr', -18, true), sunrise: crossing('sunrise', -50 / 60, true), dhuhr: { epoch: transit, reason: null },
    asr: crossing('asr', asr, false), maghrib: crossing('maghrib', -50 / 60, false), isha: crossing('isha', -17, false) };
}

export function calculateDay(input) {
  if (arguments.length !== 1) throw new TypeError('Exactly one day input required');
  const { epoch, formatter } = validate(input), { carrier, transit } = cycle(input, epoch, formatter);
  const raw = input.variant === 'usno-daily-utc0' ? fixedEvents(input, carrier, transit) : continuousEvents(input, transit);
  const events = Object.fromEntries(EVENTS.map(event => {
    const value = raw[event];
    if (value.epoch === null) return [event, { status: 'unavailable', date: null, time: null, utc: null, iso: null,
      rawUtc: null, rawEpoch: null, reason: value.reason, highLatitudeReplacement: null, notificationEligible: false }];
    if (!Number.isFinite(value.epoch)) throw new Error('Nonfinite geometry cannot be rendered');
    const rounded = Math.round(value.epoch / 60000 + ADJUSTMENTS[event]) * 60000;
    const parts = civil(rounded, formatter), offsetMinutes = (Date.parse(`${parts.date}T${parts.time}:00Z`) - rounded) / 60000;
    if (!Number.isInteger(offsetMinutes)) throw new Error('Subminute historical civil offset unsupported');
    const offset = `${offsetMinutes < 0 ? '-' : '+'}${String(Math.floor(Math.abs(offsetMinutes) / 60)).padStart(2, '0')}:${String(Math.abs(offsetMinutes) % 60).padStart(2, '0')}`;
    return [event, { status: 'calculated-experimental', ...parts, utc: new Date(rounded).toISOString(), iso: `${parts.date}T${parts.time}:00${offset}`,
      rawUtc: new Date(value.epoch).toISOString(), rawEpoch: value.epoch, minuteAdjustment: ADJUSTMENTS[event],
      localDateOffset: (Date.parse(parts.date + 'T00:00:00Z') - epoch) / DAY, notificationEligible: false }];
  }));
  if (events.dhuhr.date !== input.date) throw new Error('Adjusted noon left requested civil day; location/timezone pairing outside this research recipe');
  return { date: input.date, solarCalculationDate: new Date(carrier).toISOString().slice(0, 10), location: {
    latitude: input.latitude, longitude: input.longitude, timeZone: input.timeZone },
    profileId: 'diyanet-south-own-research', profileVersion: '0.1.0-research', variant: input.variant,
    official: false, productionReady: false, notificationEligible: false,
    solarTransitUtc: new Date(transit).toISOString(),
    parameters: { fajrAngle: 18, ishaAngle: 17, asrShadowFactor: 1, horizonAltitudeDegrees: -50 / 60,
      adjustments: { ...ADJUSTMENTS }, rounding: 'nearest', solar: 'independent-USNO',
      declinationEpoch: input.variant === 'usno-daily-utc0' ? 'solar-carrier UTC00' : 'at event',
      geometryBasis: input.variant === 'usno-daily-utc0' ? 'fixed daily spherical geometry; not a guaranteed continuous-height crossing' : 'continuous approximate solar-height crossing',
      highLatitudeReplacement: null, seasonalSubstitution: null, topocentricParallax: false, elevationCorrection: false },
    limitations: ['Southern source-rule application is a research hypothesis, not an official production specification.',
      'Explicit point is not assumed to be the original city calculation point.',
      'Unavailable signs are not converted to00:00 or religious replacement times.',
      'Near a twilight boundary, fixed daily geometry can produce a time when the continuously changing-height model has no crossing; institutional compatibility is not proof of physical event existence.',
      'IANA civil event dates are preserved; original publisher HH:mm alone does not prove absolute event dates.',
      'Geocentric conventional horizon; no elevation, terrain or observational correction.'], events };
}

export function calculateYear(input) {
  if (arguments.length !== 1) throw new TypeError('Exactly one year input required');
  fields(input, ['year', 'latitude', 'longitude', 'timeZone', 'variant']);
  const { year, ...location } = input;
  if (!Number.isInteger(year) || year < 2000 || year > 2099) throw new RangeError('Year2000–2099 required');
  validate({ date: `${year}-01-01`, ...location });
  const days = [];
  for (let epoch = Date.UTC(year, 0, 1); epoch < Date.UTC(year + 1, 0, 1); epoch += DAY)
    days.push(calculateDay({ date: new Date(epoch).toISOString().slice(0, 10), ...location }));
  return { year, ...location, profileId: 'diyanet-south-own-research', official: false, productionReady: false, notificationEligible: false, days };
}
