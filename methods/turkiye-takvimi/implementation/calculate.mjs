// Independent, deliberately narrow expression of tr.1.pdf, pp. 12, 25–27, 31.
// No calendar files, city-specific fitted corrections, or network are read here.
import {solarCoordinatesUSNO} from '../../../core/astronomy/solar-usno.mjs';
import {solarCoordinatesNoaa} from '../../../core/astronomy/noaa-coordinates.mjs';

const RAD = Math.PI / 180, DAY = 86400000, HOUR = 3600000;
export const LOCATION = Object.freeze({cityId:'16741', latitude:41, longitude:29, timeZone:'Europe/Istanbul'});
export const CORE = Object.freeze(['fajr','sunrise','dhuhr','asr','maghrib','isha']);
export const VARIANTS = Object.freeze(['usno','noaa'].flatMap(ephemeris =>
  ['utc00','continuous'].flatMap(epoch => ['nearest','floor','ceil'].map(rounding => `${ephemeris}-${epoch}-${rounding}`))));
const formatter = new Intl.DateTimeFormat('en-GB', {timeZone:LOCATION.timeZone, year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hourCycle:'h23'});

export function solarAltitude(epochMs, coordinates) {
  const solar = coordinates(epochMs / DAY + 2440587.5);
  const hours = ((epochMs % DAY) + DAY) % DAY / HOUR;
  const hourAngle = (hours + LOCATION.longitude / 15 + solar.equationOfTimeHours - 12) * 15 * RAD;
  return Math.asin(Math.sin(LOCATION.latitude*RAD)*Math.sin(solar.declination*RAD)
    + Math.cos(LOCATION.latitude*RAD)*Math.cos(solar.declination*RAD)*Math.cos(hourAngle)) / RAD;
}

function crossing(transit, target, after, coordinates) {
  // Search exactly the relevant half solar day; never substitute another date.
  const start = transit + (after ? 0 : -12 * HOUR);
  const end = transit + (after ? 12 * HOUR : 0);
  let previous = start, fPrevious = solarAltitude(previous, coordinates) - target;
  for (let current = start + 5*60000; current <= end + 1; current += 5*60000) {
    current = Math.min(current, end);
    const fCurrent = solarAltitude(current, coordinates) - target;
    if (after ? fPrevious >= 0 && fCurrent < 0 : fPrevious <= 0 && fCurrent > 0) {
      let low = previous, high = current;
      for (let i=0; i<40; i++) {
        const middle = (low+high)/2, fMiddle = solarAltitude(middle, coordinates)-target;
        if (after ? fMiddle > 0 : fMiddle < 0) low=middle;
        else high=middle;
      }
      return (low+high)/2;
    }
    previous=current; fPrevious=fCurrent;
    if (current===end) break;
  }
  return null;
}

function validDate(date) {
  if (typeof date!=='string' || !/^20\d\d-\d\d-\d\d$/.test(date)) throw new TypeError('ISO date in 2000–2099 required');
  const epoch=Date.parse(`${date}T00:00:00Z`);
  if (!Number.isFinite(epoch) || new Date(epoch).toISOString().slice(0,10)!==date) throw new RangeError('Invalid civil date');
  return epoch;
}

function render(raw, adjustmentMinutes, rounding, date, basis) {
  if (raw===null) return {status:'unavailable', time:null, iso:null, reason:'No geometric crossing on this half solar day', ...basis};
  const unrounded=raw+adjustmentMinutes*60000;
  const roundingFunction={nearest:Math.round, floor:Math.floor, ceil:Math.ceil}[rounding];
  const epoch=roundingFunction(unrounded/60000)*60000;
  const parts=Object.fromEntries(formatter.formatToParts(epoch).map(x=>[x.type,x.value]));
  const eventDate=`${parts.year}-${parts.month}-${parts.day}`;
  const time=`${parts.hour}:${parts.minute}`;
  const localEpoch=Date.parse(`${eventDate}T${time}:00Z`);
  const offsetMinutes=(localEpoch-epoch)/60000;
  const offset=`${offsetMinutes<0?'-':'+'}${String(Math.floor(Math.abs(offsetMinutes)/60)).padStart(2,'0')}:${String(Math.abs(offsetMinutes)%60).padStart(2,'0')}`;
  return {status:'adjusted', time, eventDate, iso:`${eventDate}T${time}:00${offset}`, epochMs:epoch,
    dateOffset:(Date.parse(`${eventDate}T00:00:00Z`)-Date.parse(`${date}T00:00:00Z`))/DAY,
    rawEpochMs:raw, unroundedEpochMs:unrounded, temkinMinutes:adjustmentMinutes, rounding, ...basis};
}

export function calculateIstanbul({date, variant='noaa-continuous-nearest', ...unknown}={}) {
  if (Object.keys(unknown).length) throw new TypeError(`Unknown arguments: ${Object.keys(unknown).join(', ')}`);
  const midnight=validDate(date);
  if (typeof variant!=='string' || !VARIANTS.includes(variant)) throw new TypeError('Unknown calculation variant');
  const [ephemeris, epochMode, rounding]=variant.split('-');
  const coordinates=ephemeris==='usno'?solarCoordinatesUSNO:solarCoordinatesNoaa;
  const at=epoch=>coordinates(epoch/DAY+2440587.5);
  let transit=midnight+(12-LOCATION.longitude/15-at(midnight).equationOfTimeHours)*HOUR;
  if (epochMode==='continuous') for(let i=0;i<8;i++) transit=midnight+(12-LOCATION.longitude/15-at(transit).equationOfTimeHours)*HOUR;
  const declination=at(epochMode==='utc00'?midnight:transit).declination;
  const geometric=(altitude,after)=>{
    if(epochMode==='continuous') return crossing(transit,altitude,after,coordinates);
    const cosine=(Math.sin(altitude*RAD)-Math.sin(LOCATION.latitude*RAD)*Math.sin(declination*RAD))
      /(Math.cos(LOCATION.latitude*RAD)*Math.cos(declination*RAD));
    if(cosine < -1 || cosine > 1) return null;
    return transit+(after?1:-1)*Math.acos(cosine)/RAD/15*HOUR;
  };
  const asrAltitude=factor=>Math.atan(1/(factor+Math.tan(Math.abs(LOCATION.latitude-declination)*RAD)))/RAD;
  const specifications={fajr:[-19,false,-10],sunrise:[0,false,-10],asr:[asrAltitude(1),true,10],
    asrHanafi:[asrAltitude(2),true,10],maghrib:[0,true,10],isha:[-17,true,10],ishaSecond:[-19,true,10]};
  const events={};
  for(const [name,[altitude,after,temkin]] of Object.entries(specifications)) {
    events[name]=render(geometric(altitude,after),temkin,rounding,date,{targetAltitudeDegrees:altitude,
      crossingDirection:after?'descending':'ascending', geometricHorizon:'true solar centre, no additional refraction or elevation'});
  }
  events.dhuhr=render(transit,10,rounding,date,{basis:'solar transit'});
  return {date, location:{...LOCATION}, events, profile:{id:'turkiye-takvimi-istanbul-research', version:'1.0.0-development', variant,
    institutionalEndorsement:false, temkinMinutes:10, temkinSource:'tr.1.pdf p.12, Istanbul mean plus stated caution',
    astronomy:ephemeris, epochMode, asrShadowTarget:'declination at transit for continuous; UTC00 for fixed diagnostic',
    roundingProvenance:'diagnostic hypothesis; primary minute-rounding rule not found',
    scope:'Only published Istanbul point 41°N 29°E; no high-latitude replacement or other-city Temkin inferred'},
    unsupportedMarkers:{sabah:'Recommended later morning-prayer marker; first start is imsak, exact operational rule unverified',
      ishraq:'Book: ascending +5 degrees plus Temkin; marker not part of this six-prayer comparison',
      karahat:'Avoidance interval marker; daily display and literal 2×Temkin description need separate reconciliation',
      isfirar:'Descending +5-degree caution marker, not another prayer start',
      ishtibak:'Star visibility marker with a separate horizon/limb definition',
      dahwa:'Fasting-day midpoint marker, separate from Dhuhr',
      midnight:'Religious night midpoint requires next-day dawn and explicit event date',
      tahajjud:'Night fraction marker, separate from Isha', sahar:'Last-sixth night marker, separate from Fajr'}};
}
