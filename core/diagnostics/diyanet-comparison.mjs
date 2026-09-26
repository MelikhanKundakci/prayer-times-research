import {fields} from '../input.mjs';
import {createDiyanetCalculator} from '../diyanet/index.mjs';
import {calculateLocalDay,LOCAL_DIYANET_SPA_PROFILE} from '../local/index.mjs';

export const COMPARISON_EVENTS=Object.freeze(['fajr','sunrise','dhuhr','asr','maghrib','isha']);
const datePattern=/^\d{4}-\d{2}-\d{2}$/;
const available=event=>['calculated','estimated'].includes(event.status)
  &&Number.isFinite(event.rawEpochMilliseconds)&&Number.isFinite(event.epochMilliseconds);

function validateInput(input){
  fields(input,['date','latitude','longitude','timeZone']);
  if(typeof input.date!=='string'||!datePattern.test(input.date))throw new RangeError('date must be a Gregorian YYYY-MM-DD date');
  const dateEpoch=Date.parse(`${input.date}T00:00:00Z`);
  if(!Number.isFinite(dateEpoch)||new Date(dateEpoch).toISOString().slice(0,10)!==input.date)
    throw new RangeError('date must be a valid Gregorian date');
  const year=Number(input.date.slice(0,4));
  if(year<2001||year>2098)throw new RangeError('date must be from 2001 through 2098');
  if(!Number.isFinite(input.latitude)||input.latitude< -60||input.latitude>75)
    throw new RangeError('latitude must be from −60° through 75°, the shared comparison domain');
  if(!Number.isFinite(input.longitude)||Math.abs(input.longitude)>180)
    throw new RangeError('longitude must be from −180° through 180°');
  if(typeof input.timeZone!=='string'||!(input.timeZone==='UTC'||input.timeZone.includes('/')))
    throw new RangeError('An explicit IANA timezone is required');
  try{new Intl.DateTimeFormat('en-US',{timeZone:input.timeZone}).format(dateEpoch);}
  catch{throw new RangeError('timeZone must be a supported IANA identifier');}
  return{date:input.date,latitude:input.latitude,longitude:input.longitude,timeZone:input.timeZone};
}

function eventView(event){
  return{status:event.status,reason:event.reason??null,rule:event.rule??null,role:event.role??null,
    adjustmentMinutes:event.adjustmentMinutes??null,resolution:event.resolution??null,
    rawEpochMilliseconds:event.rawEpochMilliseconds??null,epochMilliseconds:event.epochMilliseconds??null,
    roundedEpochMilliseconds:event.roundedEpochMilliseconds??null,utc:event.utc??null,calendarUtc:event.calendarUtc??null,
    localDate:event.localDate??null,calendarDate:event.calendarDate??null,time:event.time??null,
    seconds:event.seconds??null,secondsDate:event.secondsDate??null,dateOffset:event.dateOffset??null,
    estimated:event.estimated??(event.status==='estimated')};
}

function compareEvent(local,calendar){
  const localAvailable=available(local),calendarAvailable=available(calendar);
  const paired=localAvailable&&calendarAvailable;
  return{local:eventView(local),calendar:eventView(calendar),
    statusesMatch:local.status===calendar.status,
    rawDifferenceSeconds:paired?(local.rawEpochMilliseconds-calendar.rawEpochMilliseconds)/1000:null,
    selectedEpochDifferenceMilliseconds:paired?local.epochMilliseconds-calendar.epochMilliseconds:null,
    roundedEpochDifferenceMilliseconds:paired?local.roundedEpochMilliseconds-calendar.roundedEpochMilliseconds:null,
    actualLocalDateChanged:paired?local.localDate!==calendar.localDate:null,
    roundedCalendarDateChanged:paired?local.calendarDate!==calendar.calendarDate:null,
    localAvailable,calendarAvailable};
}

/** Compare two named local models for one explicit point and date, without reference data. */
export function compareDiyanetPointDay(input){
  const point=validateInput(input);
  const local=calculateLocalDay({...point,profile:LOCAL_DIYANET_SPA_PROFILE});
  const calendar=createDiyanetCalculator({cacheSize:0,dateBasis:'civil-date'}).calculateDay(point);
  const events=Object.fromEntries(COMPARISON_EVENTS.map(name=>[name,compareEvent(local.events[name],calendar.events[name])]));
  const statusCounts=model=>Object.fromEntries(['calculated','estimated','unavailable','policy-blocked']
    .map(status=>[status,COMPARISON_EVENTS.filter(name=>model[name].status===status).length]));
  const pairedAvailable=COMPARISON_EVENTS.filter(name=>events[name].localAvailable&&events[name].calendarAvailable).length;
  const pairedAbsent=COMPARISON_EVENTS.filter(name=>!events[name].localAvailable&&!events[name].calendarAvailable).length;
  const localOnly=COMPARISON_EVENTS.filter(name=>events[name].localAvailable&&!events[name].calendarAvailable).length;
  const calendarOnly=COMPARISON_EVENTS.filter(name=>!events[name].localAvailable&&events[name].calendarAvailable).length;
  const dateComparable=COMPARISON_EVENTS.filter(name=>events[name].actualLocalDateChanged!==null);
  return{schema:'diyanet-point-model-comparison/v1',
    meaning:'Model-to-model comparison for one explicit point and date. Neither output is asserted to be an official timetable or observed prayer onset.',
    differenceBasis:'rawDifferenceSeconds compares each model’s margin-adjusted rawEpochMilliseconds before display rounding; roundedEpochDifferenceMilliseconds compares independently rounded UTC-minute instants.',
    input:point,
    models:{local:{profileId:local.profile.id,calculationVersion:local.calculation.version,
      astronomyProvider:local.calculation.astronomicalModel.id,dateConvention:'solar cycle anchored by the upper transit on the requested IANA civil date',
      official:false,institutionalEquivalence:'not-claimed'},
    calendar:{calculationVersion:calendar.calculation.version,dateBasis:calendar.calculation.dateBasis,
      solarModel:calendar.calculation.solarModel,route:calendar.calculation.route,
      official:false,institutionalEquivalence:calendar.calculation.institutionalEquivalence}},
    events,
    summary:{eventCount:COMPARISON_EVENTS.length,pairedAvailable,pairedAbsent,localOnly,calendarOnly,
      availableEvents:{local:COMPARISON_EVENTS.filter(name=>events[name].localAvailable),
        calendar:COMPARISON_EVENTS.filter(name=>events[name].calendarAvailable)},
      statusCounts:{local:statusCounts(local.events),calendar:statusCounts(calendar.events)},
      statusMismatches:COMPARISON_EVENTS.filter(name=>!events[name].statusesMatch),
      rawComparableEventCount:pairedAvailable,
      actualLocalDateMismatches:dateComparable.filter(name=>events[name].actualLocalDateChanged).length,
      roundedCalendarDateMismatches:dateComparable.filter(name=>events[name].roundedCalendarDateChanged).length,
      deltaSign:'local SPA selected instant minus civil-date reconstruction selected instant; elapsed UTC time, not wrapped clock difference'},
    diagnostics:{localNorthernPolicy:local.calculation.northernPolicy?{
      status:local.calculation.northernPolicy.status,reason:local.calculation.northernPolicy.reason,
      solarModel:local.calculation.northernPolicy.metadata.solarModel,
      solarProvider:local.calculation.northernPolicy.metadata.solarProvider,
      anchorDate:local.calculation.northernPolicy.metadata.anchorDate,
      q:local.calculation.northernPolicy.metadata.q,
    }:null,
    localQualityFlags:structuredClone(local.qualityFlags),calendarQualityFlags:structuredClone(calendar.qualityFlags)}};
}
