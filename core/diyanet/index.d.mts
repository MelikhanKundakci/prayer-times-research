export const VERSION: string;
export type EventName = 'fajr'|'sunrise'|'dhuhr'|'asr'|'maghrib'|'isha';
export type PrayerName = Exclude<EventName,'sunrise'>;
export type DateBasis = 'solar-carrier'|'civil-date';
export const EVENTS: readonly EventName[];
export const PRAYERS: readonly PrayerName[];
export interface Location { latitude:number; longitude:number; timeZone:string; }
export interface Calculation {
  version:string; method:'diyanet-reconstruction'; dateBasis:DateBasis;
  solarModel:'USNO-daily-carrier-UTC00'|'USNO-daily-civil-UTC00';
  route:'low-latitude'|'south'|'north-missing-window'; official:false;
  institutionalEquivalence:'not-established'; secondsMeaning:string;
  seasonal:Record<string,unknown>|null;
}
interface EventBase { rule:string; estimated:boolean; }
export interface AvailableEvent extends EventBase {
  status:'calculated'|'estimated'; rawEpochMilliseconds:number; epochMilliseconds:number; roundedEpochMilliseconds:number;
  utc:string; calendarUtc:string; localDate:string; calendarDate:string;
  time:string; seconds:string; secondsDate:string; dateOffset:number;
}
export interface UnavailableEvent extends EventBase {
  status:'unavailable'; rawEpochMilliseconds:null; epochMilliseconds:null; roundedEpochMilliseconds:null;
  utc:null; calendarUtc:null; localDate:null; calendarDate:null;
  time:null; seconds:null; secondsDate:null; dateOffset:null;
}
export type PrayerEvent = AvailableEvent|UnavailableEvent;
export type QualityFlag =
  {code:'event-order-reversal'; earlier:EventName; later:EventName}|
  {code:'event-on-different-civil-date'; event:EventName; date:string};
export interface Day {
  date:string; solarCalculationDate:string; solarTimeCarrierDate:string; ephemerisDate:string; location:Location;
  calculation:Calculation; qualityFlags:QualityFlag[]; events:Record<EventName,PrayerEvent>;
}
export interface Year { year:number; location:Location; calculation:Calculation; days:Day[]; }
export type NextPrayer = AvailableEvent & {
  name:PrayerName; prayerDate:string; location:Location;
  qualityFlags:QualityFlag[]; calculation:Calculation;
};
export interface DiyanetCalculator {
  calculateDay(input:Location & {date:string}):Day;
  calculateYear(input:Location & {year:number}):Year;
  /** First strictly later model event; does not grant notification eligibility. */
  nextPrayer(input:Location & {after:number}):NextPrayer|null;
  clearCache():void;
  cacheInfo():{size:number; capacity:number; annualCalculations:number};
}
export function createDiyanetCalculator(options?:{cacheSize?:number; dateBasis?:DateBasis}):Readonly<DiyanetCalculator>;
