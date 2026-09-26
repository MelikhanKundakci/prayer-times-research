import {fields} from '../input.mjs';

const MINUTE=60_000,DAY=86_400_000,MAX_DATE=8.64e15;
const SEASONAL_ABSENCE=new Set(['sun-continuously-above-threshold','tangent-without-directed-crossing']);
const validEpoch=value=>Number.isFinite(value)&&Math.abs(value)<=MAX_DATE;

function blocked(event,reason,evidence){
  return{event,status:'policy-blocked',reason,epochMilliseconds:null,selection:{...evidence,
    policy:'angle-over-60-night',mode:'unavailable',selectedEpochMilliseconds:null}};
}

/**
 * Apply the explicit angle/60 fraction-of-night rule to one twilight.
 * This is a selectable local software convention, not a universal religious
 * rule. The caller supplies the actual adjacent apparent-horizon endpoints.
 */
export function selectNightFraction(input){
  fields(input,['event','rawEpochMilliseconds','rawStatus','rawReason','sunsetEpochMilliseconds',
    'sunriseEpochMilliseconds','angleDegrees']);
  const {event,rawEpochMilliseconds:raw,rawStatus,rawReason,sunsetEpochMilliseconds:sunset,
    sunriseEpochMilliseconds:sunrise,angleDegrees}=input;
  if(event!=='fajr'&&event!=='isha')throw new RangeError('event must be fajr or isha');
  if(rawStatus!=='calculated'&&rawStatus!=='unavailable')throw new RangeError('rawStatus must be calculated or unavailable');
  if(!Number.isFinite(angleDegrees)||angleDegrees<=0||angleDegrees>=30)
    throw new RangeError('angleDegrees must be greater than 0° and less than 30°');
  if(rawStatus==='calculated'){
    if(!validEpoch(raw)||rawReason!==null)throw new TypeError('A calculated raw event requires a valid epoch and null reason');
  }else if(raw!==null||typeof rawReason!=='string'||rawReason.length===0){
    throw new TypeError('An unavailable raw event requires a null epoch and a reason');
  }

  const base={event,policy:'angle-over-60-night',mode:'unavailable',rawEpochMilliseconds:raw,
    rawStatus,rawReason,sunsetEpochMilliseconds:sunset,sunriseEpochMilliseconds:sunrise,
    angleDegrees,nightFraction:angleDegrees/60,candidateEpochMilliseconds:null,selectedEpochMilliseconds:null};
  if(!validEpoch(sunset)||!validEpoch(sunrise))return blocked(event,'required-horizon-event-unavailable',base);
  const night=sunrise-sunset;
  if(!(night>0&&night<DAY))return blocked(event,'actual-horizon-night-outside-supported-range',{
    ...base,horizonNightMilliseconds:night,horizonNightMinutes:night/MINUTE});
  const portion=angleDegrees/60,candidate=event==='fajr'?sunrise-portion*night:sunset+portion*night;
  const evidence={...base,horizonNightMilliseconds:night,horizonNightMinutes:night/MINUTE,
    candidateEpochMilliseconds:candidate};
  if(!(sunset<candidate&&candidate<sunrise))
    return blocked(event,'night-fraction-candidate-outside-horizon-night',evidence);

  if(rawStatus==='unavailable'){
    if(!SEASONAL_ABSENCE.has(rawReason))return blocked(event,'raw-crossing-unavailable-for-nonseasonal-reason',evidence);
    return{event,status:'estimated',reason:'angle-over-60-night-fallback',epochMilliseconds:candidate,
      selection:{...evidence,mode:'night-fraction',selectedEpochMilliseconds:candidate}};
  }
  if(!(sunset<raw&&raw<sunrise))return blocked(event,'raw-crossing-outside-horizon-night',evidence);
  const useCandidate=event==='fajr'?raw<candidate:raw>candidate;
  const selected=useCandidate?candidate:raw;
  return{event,status:useCandidate?'estimated':'calculated',
    reason:useCandidate?'angle-over-60-night-cap':null,epochMilliseconds:selected,
    selection:{...evidence,mode:useCandidate?'night-fraction':'raw',selectedEpochMilliseconds:selected}};
}
