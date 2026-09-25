// Independent empirical experiment. No MARA method certification or source lookup.
import { solarCoordinatesUSNO } from '../../../core/astronomy/solar-usno-v2.mjs';
import { solarCoordinatesNoaa } from '../../../core/astronomy/noaa-coordinates.mjs';

const EVENTS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
const RAD = Math.PI / 180;
const DAY = 86400000;
const OFFSET_VECTORS = [[0, 0, 0, 0, 0, 0], [0, 0, 5, 5, 5, 0], [1, 1, 6, 6, 6, 1]];
const CONFIG_KEYS = ['anchors', 'asrFactor', 'ephemeris', 'fajrAngle', 'ishaAngle', 'offsets', 'rounding'];
function record(value, keys, name) {
  if (!value || Object.getPrototypeOf(value) !== Object.prototype || Object.keys(value).sort().join(',') !== [...keys].sort().join(',')) throw new TypeError(`Exactly ${keys.join(', ')} required for ${name}`);
}
function validateConfig(config) {
  record(config, CONFIG_KEYS, 'configuration');
  if (!['usno', 'noaa'].includes(config.ephemeris) || !['local-solar', 'utc-noon'].includes(config.anchors)
    || ![1, 2].includes(config.asrFactor) || !['nearest', 'ceil'].includes(config.rounding)
    || ![[18, 18], [18, 17], [19, 17]].some(([a, b]) => config.fajrAngle === a && config.ishaAngle === b)
    || !Array.isArray(config.offsets) || !OFFSET_VECTORS.some(v => JSON.stringify(v) === JSON.stringify(config.offsets))) throw new RangeError('Configuration outside declared exploratory grid');
}

export function calculateExperimentalDay(input, config) {
  record(input, ['date', 'latitude', 'longitude', 'timeZone'], 'input');
  validateConfig(config);
  const { date, latitude, longitude, timeZone } = input;
  if (typeof date !== 'string' || !/^20(?:2[1-9]|3[01])-\d{2}-\d{2}$/.test(date)) throw new RangeError('Gregorian date in 2021–2031 required');
  const epoch = Date.parse(`${date}T00:00:00Z`);
  if (!Number.isFinite(epoch) || new Date(epoch).toISOString().slice(0, 10) !== date) throw new RangeError('Invalid Gregorian date');
  if (!Number.isFinite(latitude) || latitude < 16 || latitude > 27 || !Number.isFinite(longitude) || longitude < 51 || longitude > 60) throw new RangeError('Finite regional test point required: 16..27 N, 51..60 E');
  if (timeZone !== 'Asia/Muscat') throw new RangeError('Only Asia/Muscat is within this experiment');
  const coordinates = config.ephemeris === 'usno' ? solarCoordinatesUSNO : solarCoordinatesNoaa;
  const at = anchor => coordinates(epoch / DAY + 2440587.5 + (config.anchors === 'utc-noon' ? 12 : anchor - longitude / 15) / 24);
  const event = (altitude, after, anchor) => {
    const solar = at(anchor);
    const cosH = (Math.sin(altitude * RAD) - Math.sin(latitude * RAD) * Math.sin(solar.declination * RAD)) / (Math.cos(latitude * RAD) * Math.cos(solar.declination * RAD));
    if (!Number.isFinite(cosH) || Math.abs(cosH) > 1) return NaN;
    const hourAngle = Math.acos(cosH) / RAD;
    return epoch + (12 - longitude / 15 - solar.equationOfTimeHours + (after ? 1 : -1) * hourAngle / 15) * 3600000;
  };
  const asrAltitude = Math.atan(1 / (config.asrFactor + Math.tan(Math.abs(latitude - at(13).declination) * RAD))) / RAD;
  const raw = {
    fajr: event(-config.fajrAngle, false, 5),
    sunrise: event(-50 / 60, false, 6),
    dhuhr: epoch + (12 - longitude / 15 - at(12).equationOfTimeHours) * 3600000,
    asr: asrAltitude > 0 ? event(asrAltitude, true, 13) : NaN,
    maghrib: event(-50 / 60, true, 18),
    isha: event(-config.ishaAngle, true, 18),
  };
  const round = config.rounding === 'ceil' ? Math.ceil : Math.round;
  const events = Object.fromEntries(EVENTS.map((name, index) => {
    if (!Number.isFinite(raw[name])) return [name, { status: 'unavailable', time: null, instant: null, rawInstant: null, reason: 'No finite positive-altitude/rising/setting solution; no fallback' }];
    const rounded = (round(raw[name] / 60000) + config.offsets[index]) * 60000;
    // These 2021–2031 regional experiments use Oman standard time UTC+04:00.
    // No host TZ or locale-dependent string parsing enters the calculation.
    const local = new Date(rounded + 4 * 3600000).toISOString();
    if (local.slice(0, 10) !== date) throw new Error('Calculated event outside requested local date');
    return [name, { status: 'experimental', time: local.slice(11, 16), instant: new Date(rounded).toISOString(), localIso: `${local.slice(0, 19)}+04:00`, rawInstant: new Date(raw[name]).toISOString(), unconfirmedOffsetMinutes: config.offsets[index] }];
  }));
  const finite = EVENTS.filter(e => events[e].instant !== null).map(e => Date.parse(events[e].instant));
  if (finite.some((t, i) => i > 0 && t <= finite[i - 1])) throw new Error('Invalid event ordering');
  return {
    date, location: { latitude, longitude, timeZone, elevationMeters: 0, coordinatesStatus: 'caller supplied; official MARA production point and height unknown' },
    model: { id: 'oman-mara-empirical-experiment', version: '0.1.0', officialMethod: false, religiousTraditionCertification: null, config: { ...config, offsets: [...config.offsets] }, horizonDegrees: -50 / 60, asrAltitudeDegrees: asrAltitude },
    events,
  };
}
