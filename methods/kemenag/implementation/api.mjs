// Strict post-freeze research interface. Frozen arithmetic and source files are unchanged.
import {calculateIndonesia, VERSION as CALCULATION_VERSION} from './calculate.mjs';

export const VERSION = 'indonesia-input-review-1.0.0';
const ALLOWED = new Set(['date', 'latitude', 'longitude', 'timeZone', 'fajrAngle', 'preset']);
const has = (object, key) => Object.hasOwn(object, key);

function civilDate(epoch, formatter) {
  const p = Object.fromEntries(formatter.formatToParts(epoch).map(v => [v.type, v.value]));
  return `${p.year}-${p.month}-${p.day}`;
}

export function calculateIndonesiaStrict(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)
    || ![Object.prototype, null].includes(Object.getPrototypeOf(input))) {
    throw new TypeError('Options must be a plain record');
  }
  for (const key of Reflect.ownKeys(input)) {
    if (!ALLOWED.has(key)) throw new TypeError('Unknown option: ' + String(key));
  }
  const options = {...input};
  if (has(options, 'preset') && typeof options.preset !== 'string') throw new TypeError('preset must be a string when supplied');
  if (has(options, 'fajrAngle') && typeof options.fajrAngle !== 'number') throw new TypeError('fajrAngle must be a number when supplied');
  // The frozen validator supplies the numeric/date/domain/known-preset restrictions.
  const result = calculateIndonesia(options);
  const formatter = new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn', {
    timeZone:result.location.timeZone, year:'numeric', month:'2-digit', day:'2-digit',
  });
  const book = result.model.preset === 'kemenag-2026-book-example';
  let solarCoordinatesEpochUtc = null;
  if (book) {
    const epoch = Date.parse(result.date + 'T00:00Z');
    const part = new Intl.DateTimeFormat('en', {timeZone:result.location.timeZone, timeZoneName:'longOffset'})
      .formatToParts(epoch + 12*3600000).find(v => v.type === 'timeZoneName').value;
    const match = part.match(/^GMT\+(\d{2}):(\d{2})$/);
    // calculateIndonesia already rejected unsupported offset formats.
    const offsetMinutes = +match[1]*60 + +match[2];
    solarCoordinatesEpochUtc = new Date(epoch + (12*60 - offsetMinutes)*60000).toISOString();
  }
  return {...result,
    model:{...result.model,
      inputContractVersion:VERSION,
      frozenCalculationVersion:CALCULATION_VERSION,
      solarCoordinatesEpochUtc,
      roundingDefinition:book
        ? {starts:'ceil(raw epoch minutes) + 2', dhuhr:'ceil(raw epoch minutes) + 3', sunrise:'floor(raw epoch minutes) - 2'}
        : {allSolarEvents:'nearest raw epoch minute'},
      imsakBasis:'10 minutes before rounded Fajr; informational marker, not a separate astronomical event or a claim about fasting start',
      geographicScope:'Coordinate box −12…8 latitude,94…142 longitude; not political-boundary or timezone inference',
      sourceClassification:book
        ? 'Independent reconstruction of the 2026 Kemenag book worked example, with USNO replacing printed solar tables'
        : 'Independent angle-only astronomy; no reconstructed publisher offsets',
      calendarValidationProvenance:book
        ? 'Worked-example PDF verified; additional city comparisons use indexed official-PDF transcriptions without acquired original calendar PDF bytes'
        : 'No publisher-calendar accuracy claim for this preset',
      warning:(book
        ? 'Research only, not official Bimas/SIHAT software or a verified nationwide calendar. A fixed −1° horizon is not an elevation model.'
        : 'Research-only angle calculation, not an official institutional timetable.')
        + (result.model.fajrAngle === 18 ? ' The 18° override compares a documented Fajr distinction only, not a full Muhammadiyah timetable.' : ''),
    },
    events:Object.fromEntries(Object.entries(result.events).map(([name, event]) => [name, {...event,
      localDate:event.isoUtc === null ? null : civilDate(Date.parse(event.isoUtc), formatter),
    }])),
  };
}
