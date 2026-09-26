// Source-free intermediate reconstruction for already computed Diyanet recipe
// outputs. This helper does not calculate or mutate the annual result.
const DAY = 86_400_000, MINUTE = 60_000, RAD = Math.PI / 180;
const EVENT_ORDER = Object.freeze(['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']);
const ADJUSTMENTS = Object.freeze({fajr: 0, sunrise: -7, dhuhr: 5, asr: 4, maghrib: 7, isha: 0});

function requireRecord(value, name) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(`${name} must be an object`);
  return value;
}
function iso(epoch) { return Number.isFinite(epoch) ? new Date(epoch).toISOString() : null; }
function eventEpoch(event, key = 'rawEpoch') {
  const value = event?.[key];
  return Number.isFinite(value) ? value : null;
}
function cloneWithoutContinuousAsr(value) {
  if (Array.isArray(value)) return value.map(cloneWithoutContinuousAsr);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => key !== 'continuousAsr')
    .map(([key, item]) => [key, cloneWithoutContinuousAsr(item)]));
}
function solarEvents({date, epoch, latitude, longitude, declination, equationOfTimeHours, transitEpoch, route}) {
  if (!Number.isFinite(transitEpoch)) return {date, epoch, equationOfTimeHours, asrAltitudeDegrees: null,
    events: Object.fromEntries(EVENT_ORDER.map(name => [name, null]))};
  const phi = latitude * RAD, delta = declination * RAD;
  const atAltitude = (altitude, sign) => {
    const cosine = (Math.sin(altitude * RAD) - Math.sin(phi) * Math.sin(delta)) /
      (Math.cos(phi) * Math.cos(delta));
    if (!Number.isFinite(cosine) || (route === 'north' ? Math.abs(cosine) > 1 : Math.abs(cosine) >= 1)) return null;
    return transitEpoch + sign * Math.acos(cosine) / RAD / 15 * 3_600_000;
  };
  const asrAltitude = Math.atan(1 / (1 + Math.tan(Math.abs(latitude - declination) * RAD))) / RAD;
  const out = {
    fajr: atAltitude(-18, -1),
    sunrise: atAltitude(-50 / 60, -1),
    dhuhr: transitEpoch,
    asr: Math.abs(latitude - declination) < 90 && asrAltitude > 0 ? atAltitude(asrAltitude, 1) : null,
    maghrib: atAltitude(-50 / 60, 1),
    isha: atAltitude(route === 'north' ? -16 : -17, 1),
  };
  return {date, epoch, equationOfTimeHours, asrAltitudeDegrees: asrAltitude, events: out};
}
function seasonBranch(event) {
  const rule = event?.diagnostic?.seasonalRule ?? event?.reasons?.find?.(x => x?.rule)?.rule ?? null;
  return rule;
}
function unadjustedEventEpoch(route, name, event, geometry) {
  if (route !== 'north') return geometry.events[name];
  const d = event?.diagnostic ?? {};
  if (name === 'fajr' || name === 'isha') return Object.hasOwn(d, 'rawAngleEpoch') ? d.rawAngleEpoch : geometry.events[name];
  if (name === 'sunrise' || name === 'maghrib') return Object.hasOwn(d, 'rawHorizonEpoch') ? d.rawHorizonEpoch : geometry.events[name];
  if (name === 'dhuhr') return Object.hasOwn(d, 'rawTransitEpoch') ? d.rawTransitEpoch : geometry.events[name];
  if (name === 'asr') return Object.hasOwn(d, 'rawFixedEpochAsr') ? d.rawFixedEpochAsr : geometry.events[name];
  return geometry.events[name];
}
function effectiveAdjustment(route, name, event) {
  if (route !== 'north') return Number.isFinite(event?.minuteAdjustment) ? event.minuteAdjustment : ADJUSTMENTS[name];
  if (name === 'sunrise') return -7;
  if (name === 'maghrib') return 7;
  if (name === 'dhuhr') return 5;
  if (name === 'asr') return event?.diagnostic?.physicalFixedEpochShadowSelected === false ? 0 : 4;
  return 0;
}

/**
 * Build a per-day trace from an existing annual result.
 *
 * @param {{id?:string,caseId?:string,route:'north'|'low'|'south',year?:number,latitude?:number,longitude?:number,timeZone?:string,location?:object}} caseDefinition
 * @param {object} annualResult Result from calculateMissingWindowCalendar or calculateYear.
 * @param {(julianDate:number)=>{declination:number,equationOfTimeHours:number}} solarCoordinatesAtJD
 * @returns {{caseId:string|null,route:string,location:object,annualReconstruction:unknown,days:Array<object>}}
 */
export function extractAnnualTrace(caseDefinition, annualResult, solarCoordinatesAtJD) {
  requireRecord(caseDefinition, 'caseDefinition');
  requireRecord(annualResult, 'annualResult');
  if (typeof solarCoordinatesAtJD !== 'function') throw new TypeError('solarCoordinatesAtJD function required');
  const route = caseDefinition.route;
  if (!['north', 'low', 'south'].includes(route)) throw new RangeError('route must be north, low, or south');
  const caseId = caseDefinition.caseId ?? caseDefinition.id ?? null;
  const location = annualResult.location ?? caseDefinition.location ?? {
    latitude: annualResult.latitude ?? caseDefinition.latitude,
    longitude: annualResult.longitude ?? caseDefinition.longitude,
    timeZone: annualResult.timeZone ?? caseDefinition.timeZone,
  };
  requireRecord(location, 'location');
  for (const field of ['latitude', 'longitude', 'timeZone']) if (location[field] === undefined)
    throw new TypeError(`Missing location.${field}`);
  if (!Array.isArray(annualResult.days)) throw new TypeError('annualResult.days must be an array');
  const days = annualResult.days.map(day => {
    requireRecord(day, 'day');
    if (typeof day.date !== 'string') throw new TypeError('Each day requires a date');
    const carrierDate = day.solarCalculationDate ?? day.date;
    const carrierEpoch = Date.parse(`${carrierDate}T00:00:00Z`);
    if (!Number.isFinite(carrierEpoch)) throw new RangeError(`Invalid carrier date: ${carrierDate}`);
    const julianDate = carrierEpoch / DAY + 2_440_587.5;
    const solar = solarCoordinatesAtJD(julianDate);
    requireRecord(solar, 'solar coordinates');
    if (![solar.declination, solar.equationOfTimeHours].every(Number.isFinite))
      throw new TypeError('Solar coordinates must contain finite declination and equationOfTimeHours');
    const events = day.events ?? {};
    const dhuhrEvent = events.dhuhr ?? {};
    const transitEpoch = route === 'north'
      ? (Object.hasOwn(dhuhrEvent.diagnostic ?? {}, 'rawTransitEpoch') ? dhuhrEvent.diagnostic.rawTransitEpoch : eventEpoch(dhuhrEvent))
      : Date.parse(day.solarTransitUtc);
    const geometry = solarEvents({date: day.date, epoch: carrierEpoch, latitude: location.latitude,
      longitude: location.longitude, declination: solar.declination,
      equationOfTimeHours: solar.equationOfTimeHours, transitEpoch, route});
    const finalEpoch = name => eventEpoch(events[name]);
    const rawHorizonSunriseEpoch = route === 'north' && Object.hasOwn(events.sunrise?.diagnostic ?? {}, 'rawHorizonEpoch')
      ? events.sunrise.diagnostic.rawHorizonEpoch : geometry.events.sunrise;
    const rawHorizonSunsetEpoch = route === 'north' && Object.hasOwn(events.maghrib?.diagnostic ?? {}, 'rawHorizonEpoch')
      ? events.maghrib.diagnostic.rawHorizonEpoch : geometry.events.maghrib;
    const adjustedHorizonSunriseEpoch = rawHorizonSunriseEpoch === null ? null : rawHorizonSunriseEpoch - 7 * MINUTE;
    const adjustedHorizonSunsetEpoch = rawHorizonSunsetEpoch === null ? null : rawHorizonSunsetEpoch + 7 * MINUTE;
    const adjustedBoundSunriseEpoch = route === 'north' ? finalEpoch('sunrise') : adjustedHorizonSunriseEpoch;
    const adjustedBoundSunsetEpoch = route === 'north' ? finalEpoch('maghrib') : adjustedHorizonSunsetEpoch;
    const horizon = {
      rawSunriseEpoch: rawHorizonSunriseEpoch, rawSunriseUtc: iso(rawHorizonSunriseEpoch),
      rawSunsetEpoch: rawHorizonSunsetEpoch, rawSunsetUtc: iso(rawHorizonSunsetEpoch),
      adjustedSunriseEpoch: adjustedHorizonSunriseEpoch, adjustedSunriseUtc: iso(adjustedHorizonSunriseEpoch),
      adjustedSunsetEpoch: adjustedHorizonSunsetEpoch, adjustedSunsetUtc: iso(adjustedHorizonSunsetEpoch),
      finalBoundSunriseEpoch: adjustedBoundSunriseEpoch, finalBoundSunriseUtc: iso(adjustedBoundSunriseEpoch),
      finalBoundSunsetEpoch: adjustedBoundSunsetEpoch, finalBoundSunsetUtc: iso(adjustedBoundSunsetEpoch),
      daylightDurationMinutes: Number.isFinite(adjustedBoundSunriseEpoch) && Number.isFinite(adjustedBoundSunsetEpoch)
        ? (adjustedBoundSunsetEpoch - adjustedBoundSunriseEpoch) / MINUTE : null,
      adjustmentRule: route === 'north' ? (day.diagnostics?.horizonRule ?? events.sunrise?.reasons?.[0]?.rule ?? 'northern-horizon-policy')
        : 'raw-solar-horizon-plus-minus-7-minutes',
      clampApplied: route === 'north' ? Boolean(events.sunrise?.diagnostic?.horizonEnvelopeApplied ||
        events.maghrib?.diagnostic?.horizonEnvelopeApplied || day.diagnostics?.horizonEstimated) : false,
      applicable: true,
    };
    const eventTraces = Object.fromEntries(EVENT_ORDER.map(name => {
      const event = events[name] ?? {}, rawGeometryEpoch = geometry.events[name];
      const unadjustedEpoch = route === 'north' ? unadjustedEventEpoch(route, name, event, geometry)
        : (eventEpoch(event) ?? rawGeometryEpoch);
      const adjustmentMinutes = effectiveAdjustment(route, name, event);
      const adjustedRawEpoch = route === 'north' ? finalEpoch(name)
        : unadjustedEpoch === null ? null : unadjustedEpoch + adjustmentMinutes * MINUTE;
      return [name, {
        rawGeometryEpoch, rawGeometryUtc: iso(rawGeometryEpoch),
        unadjustedEpoch, unadjustedUtc: iso(unadjustedEpoch),
        minuteAdjustment: adjustmentMinutes,
        temkinAdjustedRawEpoch: adjustedRawEpoch, temkinAdjustedRawUtc: iso(adjustedRawEpoch),
        roundedEpoch: event.utc ? Date.parse(event.utc) : null, roundedUtc: event.utc ?? null,
        localDate: event.localDate ?? event.date ?? null, time: event.time ?? null,
        status: event.status ?? null, reason: event.reason ?? event.reasons?.[0]?.code ?? null,
        seasonalBranch: route === 'north' && ['fajr', 'isha'].includes(name) ? seasonBranch(event) : null,
        diagnostics: cloneWithoutContinuousAsr(event.diagnostic ?? {}),
      }];
    }));
    const reconstruction = annualResult.reconstruction ?? {};
    return {
      caseId, date: day.date, carrierDate, carrierEpoch, carrierUtc: iso(carrierEpoch), carrierJulianDate: julianDate,
      location: {...location}, astronomy: {declinationDegrees: solar.declination,
        equationOfTimeHours: solar.equationOfTimeHours},
      geometry: {transitEpoch, transitUtc: iso(transitEpoch), rawEvents: geometry.events},
      horizon: route === 'north' ? horizon : {...horizon, applicable: false,
        adjustmentRule: 'no-northern-seasonal-horizon-bound'},
      nightDurationMinutes: Number.isFinite(adjustedBoundSunriseEpoch) && Number.isFinite(adjustedBoundSunsetEpoch)
        ? 1440 + (adjustedBoundSunriseEpoch - carrierEpoch - (adjustedBoundSunsetEpoch - carrierEpoch)) / MINUTE : null,
      seasonal: route === 'north' ? {branchByEvent: {fajr: eventTraces.fajr.seasonalBranch, isha: eventTraces.isha.seasonalBranch},
      } : null,
      events: eventTraces,
    };
  });
  return {caseId, route, location: {...location}, annualReconstruction: cloneWithoutContinuousAsr(annualResult.reconstruction ?? null), days};
}

// Stable entry point for the corpus driver. `annualResult` is the raw
// `.annual` member returned by research/calendar.mjs.
export function traceCalendar(caseDefinition, annualResult, solarCoordinatesAtJD) {
  const trace = extractAnnualTrace(caseDefinition, annualResult, solarCoordinatesAtJD);
  return {days: trace.days, reconstruction: trace.annualReconstruction};
}
