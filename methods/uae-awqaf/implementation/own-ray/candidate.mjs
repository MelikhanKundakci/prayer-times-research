import {calculateCandidateStrict} from '../api.mjs';
import {solarCoordinatesUSNO} from '../../../../core/astronomy/solar-usno-v2.mjs';
import {dryRefraction} from './refraction.mjs';
const RAD = Math.PI / 180;
const cache = new Map();

export function calculateOwnRayCandidate(date, point) {
  if (arguments.length !== 2) throw new TypeError('Exactly date and explicit point required');
  const baseline = calculateCandidateStrict(date, point);
  const dip = baseline.diagnostics.dipDegrees;
  const cacheKey = `${point.latitude}/${point.elevationMeters}/${dip}`;
  let refraction = cache.get(cacheKey);
  if (!refraction) {
    refraction = dryRefraction({latitude:point.latitude, elevationMeters:point.elevationMeters, observedAltitudeDegrees:-dip});
    if (cache.size >= 64) cache.delete(cache.keys().next().value);
    cache.set(cacheKey, Object.freeze(refraction));
  }
  const altitude = -(16 / 60 + dip + refraction.refractionDegrees);
  const epoch = Date.parse(date + 'T00:00:00Z'), jd = epoch / 86400000 + 2440587.5;
  const horizonEvent = (after, longitude) => {
    let hour = 12 - longitude / 15 + (after ? 6 : -6);
    for (let i = 0; i < 8; i++) {
      const s = solarCoordinatesUSNO(jd + hour / 24);
      const c = (Math.sin(altitude * RAD) - Math.sin(point.latitude * RAD) * Math.sin(s.declination * RAD)) /
        (Math.cos(point.latitude * RAD) * Math.cos(s.declination * RAD));
      if (!(c > -1 && c < 1)) throw new RangeError('Missing or tangential horizon in restricted UAE domain');
      hour = 12 - longitude / 15 - s.equationOfTimeHours + (after ? 1 : -1) * Math.acos(c) / RAD / 15;
    }
    return epoch + hour * 3600000;
  };
  const events = {...baseline.events}, times = {...baseline.times};
  for (const [event, after, longitude] of [['sunrise', false, baseline.diagnostics.eastLongitude], ['maghrib', true, point.longitude]]) {
    const raw = horizonEvent(after, longitude), rounded = Math.round(raw / 60000) * 60000;
    const local = new Date(rounded + 14400000).toISOString();
    if (local.slice(0, 10) !== date) throw new Error('Unexpected local-date overflow');
    times[event] = local.slice(11, 16);
    events[event] = {...events[event], time:times[event], date, utc:new Date(rounded).toISOString(), unroundedUtc:new Date(raw).toISOString()};
  }
  return {...baseline, profile:'uae-own-dry-ray-candidate', version:'0.4.0-research', events, times,
    recipe:{...baseline.recipe,horizonRefraction:'own-standard-dry-ray',observedRay:'upper-limb-at-negative-geometric-dip'},
    diagnostics:{...baseline.diagnostics, horizonAltitude:altitude},
    refraction:{method:'own-spherical-dry-ray-integral', pressureMillibars:1010, temperatureKelvin:283.15,
      wavelengthMicrometers:.55, lapseRate:.0065, observedUpperLimbAltitudeDegrees:-dip, ...refraction},
    unusedInputFields:['pressureMillibars','temperatureCelsius'],
    qualityFlags:['independent-reconstruction','vendor-column-schema-inferred','dry-standard-atmosphere-assumed','official-production-configuration-unconfirmed',
      'geometric-versus-refracted-terrestrial-horizon-unresolved','research-only']};
}
