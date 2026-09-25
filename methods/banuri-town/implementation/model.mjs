// Independent research implementation; no Banuri/GeoNames/calendar files loaded.
import { solarUSNODay } from '../../../core/astronomy/solar-usno-v2.mjs';

export const PROFILE = Object.freeze({
  id: 'banuri-18-18-hanafi-usno-research', version: '0.1.0-research',
  institution: 'Jamia Uloom Islamia Allama Muhammad Yusuf Banuri Town, Karachi',
  official: false, appReady: false,
  rules: Object.freeze({ fajrAngle: 18, ishaAngle: 18, asrShadowFactor: 2 }),
  ruleSources: Object.freeze([
    'https://www.banuri.edu.pk/readquestion/144707100380/25-12-2025',
    'https://www.banuri.edu.pk/readquestion/143409200025/21-07-2013',
  ]),
  inferredAstronomy: Object.freeze({ engine: 'own-USNO-v2', horizonDegrees: -.833,
    anchorsLocalSolarHours: 'Fajr5, Sunrise6, Transit12, Asr13, Sunset/Isha18',
    rounding: 'nearest-minute', offsetsMinutes: 0, highLatitudeRule: 'none', elevationCorrection: 'none' }),
});

function validate(date, location) {
  if (typeof date !== 'string' || !/^20\d{2}-\d{2}-\d{2}$/.test(date)) throw new Error('Date must be YYYY-MM-DD, 2000–2099.');
  const epoch = Date.parse(date + 'T00:00:00Z');
  if (!Number.isFinite(epoch) || new Date(epoch).toISOString().slice(0,10) !== date) throw new Error('Invalid civil date.');
  if (!location || typeof location !== 'object' || Array.isArray(location)) throw new Error('Explicit location required.');
  for (const k of Object.keys(location)) if (!['latitude','longitude','timeZone'].includes(k)) throw new Error(`Unknown location option: ${k}`);
  const { latitude, longitude, timeZone } = location;
  if (typeof latitude !== 'number' || !Number.isFinite(latitude) || latitude < 23 || latitude > 37) throw new Error('Research latitude domain: 23–37 N.');
  if (typeof longitude !== 'number' || !Number.isFinite(longitude) || longitude < 60 || longitude > 78) throw new Error('Research longitude domain: 60–78 E.');
  if (timeZone !== 'Asia/Karachi') throw new Error('Explicit Asia/Karachi required for this regional research profile.');
  return epoch;
}

/** Regional numerical domain is a bounding box, not a political border or approval. */
export function calculateBanuriCandidate(date, location) {
  if (arguments.length !== 2) throw new Error('Exactly date and location required.');
  const epoch = validate(date, location);
  const raw = solarUSNODay(epoch, location.latitude, location.longitude);
  const formatter = new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn', {
    timeZone: location.timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  });
  const event = (value, semanticRole) => {
    if (!Number.isFinite(value)) return { status:'unavailable', time:null, localDate:null, utc:null, reason:'solar-event-unavailable', eligibleForAutomaticNotifications:false };
    const rounded = new Date(Math.round(value / 60000) * 60000);
    const p = Object.fromEntries(formatter.formatToParts(rounded).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
    return { status:'estimated', semanticRole, time:`${p.hour}:${p.minute}`, localDate:`${p.year}-${p.month}-${p.day}`,
      utc:rounded.toISOString(), rawUtc:new Date(value).toISOString(), eligibleForAutomaticNotifications:false };
  };
  const events = {
    fajr:event(raw.fajr,'prayer-beginning-angle-model'),
    sunrise:event(raw.sunrise,'sunrise-model'),
    transit:event(raw.transit,'solar-transit-not-adhan-or-dhuhr-caution'),
    asr:event(raw.asr_hanafi,'prayer-beginning-shadow-factor-two'),
    sunset:event(raw.sunset,'sunset-model'),
    isha:event(raw.isha,'prayer-beginning-angle-model'),
    dhuhr:{ status:'unresolved',time:null,localDate:null,utc:null,reason:'zawal-column-compared-as-transit-post-transit-caution-unspecified',eligibleForAutomaticNotifications:false },
  };
  if (events.transit.localDate !== date) throw new Error('Solar transit did not anchor to requested local date.');
  return {date,location:{...location},profile:PROFILE,events,
    qualityFlags:['independent-unapproved-reconstruction','institutional-angles-and-asr-only',
      'astronomy-horizon-and-rounding-unconfirmed','official-city-reference-point-unknown',
      'dhuhr-not-mapped-from-ambiguous-zawal-column','no-jamaat-or-iqama-calculation'],
    runtime:{node:process.version,tzdb:process.versions.tz},
  };
}
