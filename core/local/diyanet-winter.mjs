// Additional ordinary-event eligibility under an explicitly local policy.
// This never changes the frozen annual context or enables its summer solver.
const MINUTE=60_000,DAY=86_400_000,TRANSITION=20*MINUTE;
const SOURCE_REASON='annual-five-hour-horizon-gate-not-met';
export const DIYANET_WINTER_POLICY='local-daily-horizon-envelope-v1';
const finite=Number.isFinite;
const dateOf=epoch=>new Date(epoch).toISOString().slice(0,10);
const offset=(date,days)=>dateOf(Date.parse(`${date}T00:00:00Z`)+days*DAY);
const close=(a,b,tolerance=0.002)=>finite(a)&&finite(b)&&Math.abs(a-b)<=tolerance;

function yearDates(year){
  const dates=[];
  for(let epoch=Date.UTC(year,0,1);epoch<Date.UTC(year+1,0,1);epoch+=DAY)dates.push(dateOf(epoch));
  return dates;
}

function noEvent(reason,source){
  return{eligible:false,reason,rawEpochMilliseconds:finite(source?.rawEpochMilliseconds)?source.rawEpochMilliseconds:null,proof:null};
}

// The input is the full result of the unchanged buildNorthernContext, not a
// user-supplied substitute for astronomy. Check that its proof dependencies
// really survived the annual horizon-only rejection before considering dates.
function validateDependencies(northern,dates){
  const m=northern.metadata,days=northern.days;
  if(m.guardId!=='northern-ordinary-annual-envelope-v1'||m.horizonGatePassed!==false
    ||m.ownedDateCount!==dates.length||!Array.isArray(m.failures)||m.failures.length
    ||!finite(m.q)||!(m.q>0&&m.q<1/3)||m.transitionMarginMinutes!==20
    ||!finite(m.annualIshaTransitionLowerPhaseMinutes)||!finite(m.annualFajrTransitionUpperPhaseMinutes)
    ||m.firstPaddedDate!==offset(dates[0],-1)||m.lastPaddedDate!==offset(dates.at(-1),1))
    return'annual-proof-metadata-incomplete';
  const paddedDates=[m.firstPaddedDate,...dates,m.lastPaddedDate],nightDates=paddedDates.slice(0,-1);
  if(paddedDates.some(date=>!days?.[date]))return'padded-day-dependency-unavailable';
  const candidates=[],missing=[];
  for(const date of nightDates){
    const nextDate=offset(date,1),night=days[date].nightToNext,previous=days[nextDate].previousNight;
    if(!night||!previous||night.startDate!==date||night.endDate!==nextDate
      ||previous.startDate!==date||previous.endDate!==nextDate)return'padded-night-dependency-unavailable';
    const M=night.maghribSelectedEpochMilliseconds,R=night.sunriseEndSelectedEpochMilliseconds;
    const H=night.ordinaryHorizonNightMinutes,S=night.oneThirdMinutes;
    if(![M,R,H,S,night.ishaEstimatePhaseMinutes,night.fajrUpperPhaseMinutes].every(finite)
      ||!(M<R&&H>0&&S>0&&S<H)||!close(R-M,H*MINUTE)
      ||!close(night.ishaEstimateEpochMilliseconds,M+S*MINUTE)
      ||!close(night.fajrUpperEpochMilliseconds,R-S*MINUTE))return'annual-candidate-invalid';
    // Both references to a physical night must describe exactly the same
    // dependency; comparisons use numbers, never formatted local clock times.
    for(const key of Object.keys(night))if(previous[key]!==night[key])return'adjacent-night-dependency-mismatch';
    if(night.realFajr===true){
      const F=night.rawFajrEpochMilliseconds;
      if(!finite(F)||!(M<F&&F<R)||night.nextRawFajrEpochMilliseconds!==F
        ||!close(night.religiousNightMinutes,(F-M)/MINUTE,1e-8)
        ||!close(S,(F-M)/(3*MINUTE),1e-8))return'annual-real-fajr-candidate-invalid';
    }else if(night.realFajr===false){
      if(night.rawFajrEpochMilliseconds!==null||night.nextRawFajrEpochMilliseconds!==null
        ||night.religiousNightMinutes!==null||!close(S,m.q*H,1e-8))return'annual-missing-fajr-candidate-invalid';
      missing.push(nextDate);
    }else return'annual-fajr-state-unavailable';
    const nextF=days[nextDate].fajr,dayI=days[date].isha;
    if(nextF?.rawEpochMilliseconds!==night.rawFajrEpochMilliseconds
      ||dayI?.rawEpochMilliseconds!==night.rawIshaEpochMilliseconds)return'raw-event-dependency-mismatch';
    const sourcePhase=finite(dayI.rawEpochMilliseconds)?dayI.phaseMinutes:null;
    const targetPhase=finite(nextF.rawEpochMilliseconds)?nextF.phaseMinutes:null;
    if(sourcePhase!==null&&!close(night.ishaEstimatePhaseMinutes,
      sourcePhase+(night.ishaEstimateEpochMilliseconds-dayI.rawEpochMilliseconds)/MINUTE,1e-7))return'candidate-transit-phase-mismatch';
    if(targetPhase!==null&&!close(night.fajrUpperPhaseMinutes,
      targetPhase+(night.fajrUpperEpochMilliseconds-nextF.rawEpochMilliseconds)/MINUTE,1e-7))return'candidate-transit-phase-mismatch';
    candidates.push(night);
  }
  if(m.missingFajrDayCount!==missing.length
    ||(missing.length&&(m.missingFajrStartDate!==missing[0]||m.missingFajrEndDate!==missing.at(-1)
      ||missing.some((date,i)=>i>0&&date!==offset(missing[i-1],1))))
    ||(!missing.length&&(m.missingFajrStartDate!==null||m.missingFajrEndDate!==null)))return'annual-fajr-absence-proof-incomplete';
  const expectedAnchor=missing.length?offset(missing[0],-1):`${m.year}-06-21`;
  const anchor=days[expectedAnchor]?.previousNight;
  if(m.anchorDate!==expectedAnchor||anchor?.realFajr!==true
    ||!close(m.q,anchor.oneThirdMinutes/anchor.ordinaryHorizonNightMinutes,1e-12))return'annual-anchor-proof-invalid';
  const minI=Math.min(...candidates.map(n=>n.ishaEstimatePhaseMinutes-20));
  const maxF=Math.max(...candidates.map(n=>n.fajrUpperPhaseMinutes+20));
  if(!close(m.annualIshaTransitionLowerPhaseMinutes,minI,1e-9)
    ||!close(m.annualFajrTransitionUpperPhaseMinutes,maxF,1e-9))return'annual-transition-envelope-mismatch';
  return null;
}

function horizonProof(start,end,night){
  const a=start?.horizons,b=end?.horizons;
  const values={startRawDayMinutes:a?.rawDayMinutes??null,startSelectedDayMinutes:a?.selectedDayMinutes??null,
    endRawDayMinutes:b?.rawDayMinutes??null,endSelectedDayMinutes:b?.selectedDayMinutes??null,
    rawNightMinutes:a?.nextRawNightMinutes??null,selectedNightMinutes:a?.nextSelectedNightMinutes??null};
  const matchingNight=close(values.rawNightMinutes,b?.previousRawNightMinutes,1e-8)
    &&close(values.selectedNightMinutes,b?.previousSelectedNightMinutes,1e-8)
    &&close(values.selectedNightMinutes,night?.ordinaryHorizonNightMinutes,1e-8);
  return{...values,boundMinutes:300,strictlyAboveBound:Object.values(values).every(value=>finite(value)&&value>300),
    matchingNight,sourceMaghribEligible:a?.maghribEligible===true,targetSunriseEligible:b?.sunriseEligible===true,
    eligible:matchingNight&&Object.values(values).every(value=>finite(value)&&value>300)
      &&a?.maghribEligible===true&&b?.sunriseEligible===true};
}

/**
 * Admit only real ordinary Fajr/Isha crossings after a horizon-only annual
 * rejection. The original context remains blocked and is never mutated.
 * This is a local availability rule, not an official Diyanet policy proof.
 */
export function admitDiyanetWinterContext(northern){
  if(!northern||Object.getPrototypeOf(northern)!==Object.prototype)throw new TypeError('Expected a full northern context record');
  const year=northern.metadata?.year;
  if(!Number.isInteger(year)||year<2001||year>2098)throw new RangeError('Northern context year must be 2001 through 2098');
  const dates=yearDates(year),sourceReason=northern.reason??null;
  let reason=year<2002||year>2097?'padded-year-outside-solar-domain'
    :northern.status!=='blocked'||sourceReason!==SOURCE_REASON?'source-context-not-horizon-only-blocked':null;
  if(!reason)reason=validateDependencies(northern,dates);
  const metadata={year,ordinaryOnly:true,estimatedEventsGenerated:false,institutionalEquivalence:'not-claimed',
    originalContextRetained:true,annualEnvelopeRequired:true,localHorizonBoundMinutes:300,
    transitionMarginMinutes:20,solarModel:northern.metadata.solarModel??null,
    annualIshaTransitionLowerPhaseMinutes:northern.metadata.annualIshaTransitionLowerPhaseMinutes??null,
    annualFajrTransitionUpperPhaseMinutes:northern.metadata.annualFajrTransitionUpperPhaseMinutes??null};
  const days={};
  for(const date of dates){
    const day=northern.days?.[date];
    days[date]={};
    for(const name of ['fajr','isha']){
      const event=day?.[name];
      if(reason){days[date][name]=noEvent(reason,event);continue;}
      const night=name==='fajr'?day.previousNight:day.nightToNext;
      const horizon=horizonProof(northern.days[night.startDate],northern.days[night.endDate],night);
      const raw=event.rawEpochMilliseconds,phase=event.phaseMinutes;
      const rawIsReal=finite(raw)&&finite(phase)&&(event.rawReason===undefined||event.rawReason===null);
      const M=night.maghribSelectedEpochMilliseconds,R=night.sunriseEndSelectedEpochMilliseconds;
      const insideSelectedNight=rawIsReal&&M<raw&&raw<R;
      const threshold=name==='fajr'?night.fajrUpperEpochMilliseconds+TRANSITION:night.ishaEstimateEpochMilliseconds-TRANSITION;
      const annualBound=name==='fajr'?metadata.annualFajrTransitionUpperPhaseMinutes:metadata.annualIshaTransitionLowerPhaseMinutes;
      const outsideAnnualEnvelope=rawIsReal&&(name==='fajr'?phase>annualBound:phase<annualBound);
      const outsideDirectTransition=rawIsReal&&(name==='fajr'?raw>threshold:raw<threshold);
      const followingFajrReal=night.realFajr===true&&finite(night.nextRawFajrEpochMilliseconds);
      const beforeNextRawFajr=rawIsReal&&followingFajrReal&&raw<night.nextRawFajrEpochMilliseconds;
      const eligible=horizon.eligible&&rawIsReal&&insideSelectedNight&&outsideAnnualEnvelope&&outsideDirectTransition
        &&(name==='fajr'||(followingFajrReal&&beforeNextRawFajr));
      const eventReason=eligible?null:!rawIsReal?'real-ordinary-event-unavailable'
        :!horizon.eligible?'local-five-hour-horizon-bound-not-met':!insideSelectedNight?'raw-event-outside-selected-night'
        :!outsideAnnualEnvelope?'inside-annual-transition-envelope':!outsideDirectTransition?'inside-direct-transition-band'
        :!followingFajrReal?'following-fajr-unavailable':'raw-isha-not-before-following-fajr';
      days[date][name]={eligible,reason:eventReason,rawEpochMilliseconds:finite(raw)?raw:null,
        proof:{nightStartDate:night.startDate,nightEndDate:night.endDate,horizons:horizon,rawIsReal,
          maghribSelectedEpochMilliseconds:M,sunriseSelectedEpochMilliseconds:R,insideSelectedNight,
          rawPhaseMinutes:phase,annualTransitionBoundPhaseMinutes:annualBound,outsideAnnualEnvelope,
          directTransitionBoundEpochMilliseconds:threshold,outsideDirectTransition,
          followingFajrReal,beforeNextRawFajr:name==='isha'?beforeNextRawFajr:null}};
    }
  }
  return{policy:DIYANET_WINTER_POLICY,sourceContextReason:sourceReason,evaluated:reason===null,reason,metadata,days};
}
