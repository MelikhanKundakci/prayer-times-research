// Private civil-row experiment; original daily geometry remains except ephemeris sampling date.
// Existing V5 USNO00 numerical recipe, expressed without its Adhan replay import.
import { solarCoordinatesUSNO } from '../../../../core/astronomy/solar-usno-v2.mjs';
export const DAY = 86400000, MINUTE = 60000;
const RAD = Math.PI / 180;
export function dailySolar(date, latitude, longitude, ephemerisDate = date) {
  const epoch = Date.parse(date + 'T00:00:00Z');
  if (!Number.isFinite(epoch) || new Date(epoch).toISOString().slice(0, 10) !== date) throw new RangeError('Invalid solar calculation date');
  const ephemerisEpoch = Date.parse(ephemerisDate + 'T00:00:00Z');
  if (!Number.isFinite(ephemerisEpoch) || new Date(ephemerisEpoch).toISOString().slice(0, 10) !== ephemerisDate) throw new RangeError('Invalid ephemeris date');
  const s = solarCoordinatesUSNO(ephemerisEpoch / DAY + 2440587.5);
  const phi = latitude * RAD, delta = s.declination * RAD;
  const event = (altitude, after) => {
    const cosine = (Math.sin(altitude * RAD) - Math.sin(phi) * Math.sin(delta)) / (Math.cos(phi) * Math.cos(delta));
    if (!Number.isFinite(cosine) || Math.abs(cosine) > 1) return null;
    return epoch + (12 - longitude / 15 - s.equationOfTimeHours + (after ? 1 : -1) * Math.acos(cosine) / RAD / 15) * 3600000;
  };
  const asrAltitude = Math.atan(1 / (1 + Math.tan(Math.abs(latitude - s.declination) * RAD))) / RAD;
  return { date, epoch, declination: s.declination, equationOfTimeHours: s.equationOfTimeHours,
    solarNoonAltitudeDegrees: 90 - Math.abs(latitude - s.declination), asrAltitudeDegrees: asrAltitude,
    events: { fajr: event(-18, false), sunrise: event(-50 / 60, false),
      dhuhr: epoch + (12 - longitude / 15 - s.equationOfTimeHours) * 3600000,
      asr: event(asrAltitude, true), sunset: event(-50 / 60, true), isha: event(-16, true) } };
}
export function localParts(epoch, formatter) {
  const p = Object.fromEntries(formatter.formatToParts(epoch).map(p => [p.type, p.value]));
  return { localDate: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}
export function anchoredSolar(date, latitude, longitude, formatter) {
  const requested = Date.parse(date + 'T00:00:00Z');
  let carrier = requested, solar;
  for (let attempt = 0; attempt < 4; attempt++) {
    solar = dailySolar(new Date(carrier).toISOString().slice(0, 10), latitude, longitude, date);
    const displayedNoon = Math.floor((solar.events.dhuhr + 5 * MINUTE) / MINUTE + .5) * MINUTE;
    const actual = localParts(displayedNoon, formatter).localDate;
    if (actual === date) return solar;
    carrier += requested - Date.parse(actual + 'T00:00:00Z');
  }
  throw new RangeError(`Requested civil date has no uniquely anchored solar noon: ${date}`);
}
