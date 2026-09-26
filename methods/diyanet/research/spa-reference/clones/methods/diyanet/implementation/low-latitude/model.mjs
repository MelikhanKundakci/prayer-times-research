// One predeclared low-latitude research recipe. No location tables, originals or I/O.
import { solarCoordinatesUSNO } from '../../../../../adapter.mjs';

const DAY = 86400000, HOUR = 3600000, RAD = Math.PI / 180;
export const VERSION = '0.1.0-research';
export const EVENTS = Object.freeze(['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']);
export const ADJUSTMENTS = Object.freeze({ fajr: 0, sunrise: -7, dhuhr: 5, asr: 4, maghrib: 7, isha: 0 });
function exact(input, expected) {
  if (!input || Object.getPrototypeOf(input) !== Object.prototype) throw new TypeError('Plain own-data input required');
  const descriptors = Object.getOwnPropertyDescriptors(input), keys = Reflect.ownKeys(descriptors);
  if (keys.length !== expected.length || keys.some(k => typeof k !== 'string' || !expected.includes(k)
    || !descriptors[k].enumerable || !Object.hasOwn(descriptors[k], 'value')))
    throw new TypeError('Exactly the documented own enumerable data fields required');
}
function validate(input) {
  exact(input, ['date', 'latitude', 'longitude', 'timeZone']);
  if (typeof input.date !== 'string' || !/^20\d\d-\d\d-\d\d$/.test(input.date)) throw new RangeError('Civil date in2000–2099 required');
  const epoch = Date.parse(input.date + 'T00:00:00Z');
  if (!Number.isFinite(epoch) || new Date(epoch).toISOString().slice(0, 10) !== input.date) throw new RangeError('Invalid Gregorian date');
  if (typeof input.latitude !== 'number' || !Number.isFinite(input.latitude) || input.latitude < 0 || input.latitude >= 44.5)
    throw new RangeError('Explicit research domain: 0≤latitude<44.5');
  if (typeof input.longitude !== 'number' || !Number.isFinite(input.longitude) || Math.abs(input.longitude) > 180)
    throw new RangeError('Longitude in−180…180 required');
  if (typeof input.timeZone !== 'string' || (input.timeZone !== 'UTC' && !input.timeZone.includes('/')))
    throw new RangeError('Explicit IANA timezone required');
  const formatter = new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn', {
    timeZone: input.timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  });
  return { epoch, formatter };
}
function civil(epoch, formatter) {
  const p = Object.fromEntries(formatter.formatToParts(epoch).map(part => [part.type, part.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}
const sun = epoch => solarCoordinatesUSNO(epoch / DAY + 2440587.5);
function cycle(input, epoch, formatter) {
  let carrier = epoch;
  for (let attempt = 0; attempt < 4; attempt++) {
    const solar = sun(carrier), transit = carrier + (12 - input.longitude / 15 - solar.equationOfTimeHours) * HOUR;
    const actualDate = civil(transit, formatter).date;
    if (actualDate === input.date) return { carrier, transit, solar };
    carrier += epoch - Date.parse(actualDate + 'T00:00:00Z');
  }
  throw new RangeError('Requested civil date has no matching solar transit; possibly skipped by timezone');
}
export function calculateDay(input) {
  if (arguments.length !== 1) throw new TypeError('Exactly one day input required');
  const { epoch, formatter } = validate(input), { carrier, transit, solar } = cycle(input, epoch, formatter);
  const phi = input.latitude * RAD, delta = solar.declination * RAD;
  const crossing = (altitude, sign) => {
    const cosine = (Math.sin(altitude * RAD) - Math.sin(phi) * Math.sin(delta)) / (Math.cos(phi) * Math.cos(delta));
    if (!Number.isFinite(cosine) || Math.abs(cosine) >= 1) return { epoch: null, reason: 'no-crossing-in-fixed-daily-geometry' };
    return { epoch: transit + sign * Math.acos(cosine) / RAD / 15 * HOUR, reason: null };
  };
  const zenith = Math.abs(input.latitude - solar.declination);
  const asrAltitude = Math.atan(1 / (1 + Math.tan(zenith * RAD))) / RAD;
  const raw = { fajr: crossing(-18, -1), sunrise: crossing(-50 / 60, -1), dhuhr: { epoch: transit, reason: null },
    asr: zenith < 90 && asrAltitude > 0 ? crossing(asrAltitude, 1) : { epoch: null, reason: 'no-positive-shadow-target' },
    maghrib: crossing(-50 / 60, 1), isha: crossing(-17, 1) };
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
    profileId: 'diyanet-low-latitude-own-research', profileVersion: VERSION,
    official: false, productionReady: false, notificationEligible: false, solarTransitUtc: new Date(transit).toISOString(),
    parameters: { fajrAngle: 18, ishaAngle: 17, asrShadowFactor: 1, horizonAltitudeDegrees: -50 / 60,
      adjustments: { ...ADJUSTMENTS }, rounding: 'nearest', solar: 'independent-USNO',
      declinationEpoch: 'solar-carrier UTC00', equationOfTimeEpoch: 'solar-carrier UTC00',
      geometryBasis: 'fixed daily spherical geometry; not a guaranteed continuous-height crossing',
      highLatitudeReplacement: null, seasonalSubstitution: null, topocentricParallax: false, elevationCorrection: false },
    limitations: ['Northern low-latitude reconstruction is experimental, not an official production specification.',
      'A supplied point is not assumed to be the original city calculation point.',
      'Unavailable signs are not converted to00:00 or religious replacement times.',
      'UTC00 ephemerides, nearest rounding and conventional horizon are reconstruction hypotheses.',
      'IANA civil event dates are preserved; publisher HH:mm alone does not prove absolute event dates.',
      'Geocentric conventional horizon; no elevation, terrain or observational correction.'], events };
}
export function calculateYear(input) {
  if (arguments.length !== 1) throw new TypeError('Exactly one year input required');
  exact(input, ['year', 'latitude', 'longitude', 'timeZone']);
  const { year, ...location } = input;
  if (!Number.isInteger(year) || year < 2000 || year > 2099) throw new RangeError('Year2000–2099 required');
  validate({ date: `${year}-01-01`, ...location });
  const days = [];
  for (let epoch = Date.UTC(year, 0, 1); epoch < Date.UTC(year + 1, 0, 1); epoch += DAY)
    days.push(calculateDay({ date: new Date(epoch).toISOString().slice(0, 10), ...location }));
  return { year, ...location, profileId: 'diyanet-low-latitude-own-research', profileVersion: VERSION,
    official: false, productionReady: false, notificationEligible: false, days };
}
