// Own solar equations and event geometry. No calendar, Adhan, I/O or network.
// Research hypothesis: the complete institutional production recipe is unknown.
import { solarCoordinatesUSNO } from '../../../../core/astronomy/solar-usno-v2.mjs';
import { solarCoordinatesNoaa } from '../../../../core/astronomy/noaa-coordinates.mjs';
import { findLevelCrossings } from '../../../../core/astronomy/continuous-solver.mjs';
import { ZONES, POINT_SOURCE } from './points.mjs';

const DAY = 86400000, HOUR = 3600000, RAD = Math.PI / 180;
export const EVENTS = Object.freeze(['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']);
export const CANDIDATES = Object.freeze(['usno-fixed', 'noaa-fixed', 'usno-continuous', 'noaa-continuous']);

function fields(input, expected) {
  if (!input || Object.getPrototypeOf(input) !== Object.prototype) throw new TypeError('Plain own-data input required');
  const ds = Object.getOwnPropertyDescriptors(input), keys = Reflect.ownKeys(ds);
  if (keys.length !== expected.length || !keys.every(k => typeof k === 'string' && expected.includes(k)
      && Object.hasOwn(ds[k], 'value') && ds[k].enumerable)) throw new TypeError('Only the exact documented own-data fields are accepted');
}
function validate(input) {
  fields(input, ['date', 'zone', 'timeZone', 'candidate']);
  const { date, zone, timeZone, candidate } = input;
  if (typeof date !== 'string' || !/^20\d{2}-\d{2}-\d{2}$/.test(date)) throw new RangeError('Date in 2000–2099 required');
  const epoch = Date.parse(date + 'T00:00:00Z');
  if (!Number.isFinite(epoch) || new Date(epoch).toISOString().slice(0, 10) !== date) throw new RangeError('Invalid civil date');
  if (typeof zone !== 'string' || !Object.hasOwn(ZONES, zone) || timeZone !== ZONES[zone].timeZone) throw new RangeError('Explicit supported zone and its documented IANA timezone required');
  if (!CANDIDATES.includes(candidate)) throw new RangeError('Unknown solar candidate');
  return epoch;
}
function hourAngle(latitude, declination, altitude) {
  const phi = latitude * RAD, delta = declination * RAD;
  const cosine = (Math.sin(altitude * RAD) - Math.sin(phi) * Math.sin(delta)) / (Math.cos(phi) * Math.cos(delta));
  return Math.abs(cosine) > 1 ? NaN : Math.acos(cosine) / RAD / 15;
}
function shadowAltitude(latitude, declination) {
  return Math.atan(1 / (1 + Math.tan(Math.abs(latitude - declination) * RAD))) / RAD;
}
function fixedHours(carrier, point, coordinates) {
  const jd = carrier / DAY + 2440587.5;
  const at = hour => coordinates(jd + (hour - point.longitude / 15) / 24);
  const event = (altitude, after, anchor) => {
    const sun = at(anchor);
    return 12 - point.longitude / 15 - sun.equationOfTimeHours
      + (after ? 1 : -1) * hourAngle(point.latitude, sun.declination, altitude);
  };
  return { fajr: event(-18, false, 5), sunrise: event(-50 / 60, false, 6),
    dhuhr: 12 - point.longitude / 15 - at(12).equationOfTimeHours,
    asr: event(shadowAltitude(point.latitude, at(13).declination), true, 13),
    maghrib: event(-50 / 60, true, 18), isha: event(-18, true, 18) };
}
function continuousHours(carrier, point, coordinates) {
  const solar = epoch => coordinates(epoch / DAY + 2440587.5);
  let transit = carrier + (12 - point.longitude / 15) * HOUR;
  for (let i = 0; i < 12; i++) transit = carrier + (12 - point.longitude / 15 - solar(transit).equationOfTimeHours) * HOUR;
  // Every supported Malaysian zone is UTC+08 throughout the supported period.
  const startEpoch = carrier - 8 * HOUR, endEpoch = startEpoch + DAY;
  if (transit < startEpoch || transit >= endEpoch) throw new Error('Transit outside the requested local day');
  const altitude = epoch => {
    const sun = solar(epoch), ut = ((epoch % DAY) + DAY) % DAY / HOUR;
    const h = (ut + point.longitude / 15 + sun.equationOfTimeHours - 12) * 15 * RAD;
    const sine = Math.sin(point.latitude * RAD) * Math.sin(sun.declination * RAD)
      + Math.cos(point.latitude * RAD) * Math.cos(sun.declination * RAD) * Math.cos(h);
    return Math.asin(Math.max(-1, Math.min(1, sine))) / RAD;
  };
  const definitions = [[-18, 'fajr', 'rising'], [-50 / 60, 'sunrise', 'rising'],
    [-50 / 60, 'maghrib', 'setting'], [-18, 'isha', 'setting'],
    [shadowAltitude(point.latitude, solar(transit).declination), 'asr', 'setting']];
  const result = { dhuhr: (transit - carrier) / HOUR };
  for (const [threshold, event, direction] of definitions) {
    const roots = findLevelCrossings({ startEpoch: event === 'asr' ? transit : startEpoch, endEpoch,
      valueAt: epoch => altitude(epoch) - threshold }).crossings.filter(c => c.direction === direction);
    if (roots.length > 1) throw new Error('Multiple crossings require an explicit rule');
    result[event] = roots.length ? (roots[0].epoch - carrier) / HOUR : NaN;
  }
  return result;
}
function render(rounded, formatter) {
  const p = Object.fromEntries(formatter.formatToParts(rounded).map(part => [part.type, part.value]));
  const date = `${p.year}-${p.month}-${p.day}`, time = `${p.hour}:${p.minute}`;
  const offset = (Date.parse(`${date}T${time}:00Z`) - rounded) / 60000;
  if (offset !== 480) throw new Error('Unexpected Malaysian civil offset; recipe must be reviewed');
  return { date, time, iso: `${date}T${time}:00+08:00`, utc: new Date(rounded).toISOString() };
}
export function calculateDay(input) {
  if (arguments.length !== 1) throw new TypeError('Exactly one input object required');
  const carrier = validate(input), location = ZONES[input.zone];
  const coordinates = input.candidate.startsWith('usno-') ? solarCoordinatesUSNO : solarCoordinatesNoaa;
  const geometry = input.candidate.endsWith('-fixed') ? fixedHours : continuousHours;
  const ordinary = geometry(carrier, location.ordinary, coordinates);
  const sunrise = geometry(carrier, location.sunrise, coordinates).sunrise;
  const formatter = new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn', { timeZone: input.timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const events = Object.fromEntries(EVENTS.map(event => {
    const hours = event === 'sunrise' ? sunrise : ordinary[event];
    if (!Number.isFinite(hours)) return [event, { status: 'unavailable', date: null, time: null, iso: null, utc: null, notificationEligible: false }];
    // This integer-second convention preserves the historical own-USNO candidate.
    // It is not asserted to be an independently published JAKIM convention.
    const epoch = carrier + Math.floor(hours * 3600) * 1000 + (event === 'dhuhr' ? 64000 : 0);
    const rounded = (event === 'sunrise' ? Math.floor(epoch / 60000) : Math.ceil(epoch / 60000)) * 60000;
    const displayed = render(rounded, formatter);
    if (displayed.date !== input.date) throw new Error('Event outside the requested local day');
    return [event, { status: 'estimated-unconfirmed', ...displayed, rawEpoch: carrier + hours * HOUR,
      adjustedIntegerSecondEpoch: epoch, notificationEligible: false }];
  }));
  return { date: input.date, zone: input.zone, timeZone: input.timeZone, candidate: input.candidate,
    profileVersion: '0.1.0-research', locationMode: 'zone', official: false, productionReady: false, notificationEligible: false,
    points: { ordinary: { ...location.ordinary }, sunrise: { ...location.sunrise }, source: POINT_SOURCE,
      sourceYear: 2025, printedPage: location.printedPage, productionPointConfirmed: false },
    recipe: { fajrAngle: 18, ishaAngle: 18, horizonAltitudeDegrees: -50 / 60, asrShadowFactor: 1,
      asrTarget: input.candidate.endsWith('-fixed') ? 'declination at mean-solar 13:00' : 'declination at converged transit',
      dhuhrAdjustmentSeconds: 64, intermediateSeconds: 'floor', rounding: 'ceil starts; floor sunrise',
      elevationCorrection: false, topocentricParallax: false, highLatitudeRule: 'none' }, events };
}
export function calculateYear(input) {
  if (arguments.length !== 1) throw new TypeError('Exactly one year input required');
  fields(input, ['year', 'zone', 'timeZone', 'candidate']);
  const { year, zone, timeZone, candidate } = input;
  if (!Number.isInteger(year) || year < 2000 || year > 2099) throw new RangeError('Year in 2000–2099 required');
  validate({ date: `${year}-01-01`, zone, timeZone, candidate });
  const days = [];
  for (let epoch = Date.UTC(year, 0, 1); epoch < Date.UTC(year + 1, 0, 1); epoch += DAY)
    days.push(calculateDay({ date: new Date(epoch).toISOString().slice(0, 10), zone, timeZone, candidate }));
  return { year, zone, candidate, location: { ...ZONES[zone].ordinary, timeZone }, days };
}
