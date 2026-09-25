// Experimental approximation of one publisher's 15°/15° Fajr/Isha table.
// This is not an FCNA calculation rule or a geographically general recipe.
import {solarCoordinatesUSNO} from '../../../core/astronomy/solar-usno-v2.mjs';

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const MINUTE_MS = 60_000;
const RAD = Math.PI / 180;
const JULIAN_UNIX_EPOCH = 2_440_587.5;
export const ROSEVILLE_POINT = Object.freeze({
  latitude: 38.748266781311,
  longitude: -121.291128181358,
  timeZone: 'America/Los_Angeles',
  provenance: 'US Census interpolation of publisher address; calendar calculation point unconfirmed',
});

const clock = new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn', {
  timeZone: ROSEVILLE_POINT.timeZone,
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

function formatEvent(rawEpoch) {
  if (!Number.isFinite(rawEpoch)) {
    return {time: null, localDate: null, utc: null, rawUtc: null, status: 'unavailable'};
  }
  const roundedEpoch = Math.ceil(rawEpoch / MINUTE_MS) * MINUTE_MS;
  const parts = Object.fromEntries(clock.formatToParts(roundedEpoch)
    .filter(({type}) => type !== 'literal').map(({type, value}) => [type, value]));
  return {
    time: `${parts.hour}:${parts.minute}`,
    localDate: `${parts.year}-${parts.month}-${parts.day}`,
    utc: new Date(roundedEpoch).toISOString(),
    rawUtc: new Date(rawEpoch).toISOString(),
    status: 'calculated-experimental',
  };
}

export function calculateRosevilleStartTimes(date) {
  if (arguments.length !== 1 || typeof date !== 'string' || !/^20\d{2}-\d{2}-\d{2}$/.test(date)) {
    throw new TypeError('Exactly one Gregorian date string in 2000–2099 is required');
  }
  const midnight = Date.parse(`${date}T00:00:00Z`);
  if (!Number.isFinite(midnight) || new Date(midnight).toISOString().slice(0, 10) !== date) {
    throw new RangeError('Invalid Gregorian date');
  }

  // Freeze declination and equation of time at 12:00 UTC of the printed row date.
  const solar = solarCoordinatesUSNO((midnight + 12 * HOUR_MS) / DAY_MS + JULIAN_UNIX_EPOCH);
  const latitude = ROSEVILLE_POINT.latitude * RAD;
  const declination = solar.declination * RAD;
  const cosine = (Math.sin(-15 * RAD) - Math.sin(latitude) * Math.sin(declination)) /
    (Math.cos(latitude) * Math.cos(declination));
  const hourAngleHours = Math.abs(cosine) <= 1 ? Math.acos(cosine) / RAD / 15 : NaN;
  const transitHours = 12 - ROSEVILLE_POINT.longitude / 15 - solar.equationOfTimeHours;

  return {
    date,
    point: ROSEVILLE_POINT,
    recipe: 'roseville-15-15-usno-utc12-ceil',
    events: {
      fajr: formatEvent(midnight + (transitHours - hourAngleHours) * HOUR_MS),
      isha: formatEvent(midnight + (transitHours + hourAngleHours) * HOUR_MS),
    },
    official: false,
    productionReady: false,
    notificationEligible: false,
  };
}
