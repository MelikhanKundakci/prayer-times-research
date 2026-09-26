// Conservative ordinary-night eligibility for the documented northern rules.
// This module only identifies dates outside this declared ordinary-night
// candidate envelope. It does not prove a production publisher's unknown
// transition semantics, estimate summer prayer times, or interpolate gaps.
import {fields} from '../input.mjs';
import {calculateLocalSolarDay} from './solar.mjs';

const DAY_MS=86_400_000,MINUTE_MS=60_000;
const FAJR_TRANSITION_MS=20*MINUTE_MS,ISHA_TRANSITION_MS=20*MINUTE_MS;
const MARGIN={sunrise:-7*MINUTE_MS,maghrib:7*MINUTE_MS};
const dateOf=epoch=>new Date(epoch).toISOString().slice(0,10);
const midnight=date=>Date.parse(`${date}T00:00:00Z`);
const isReal=event=>event?.status==='calculated'&&Number.isFinite(event.epochMilliseconds);
const isMissingFajr=event=>event?.status==='unavailable'
  &&['sun-continuously-above-threshold','tangent-without-directed-crossing'].includes(event.reason);
const emptyGuard=(reason,rawEpochMilliseconds=null,phaseMinutes=null)=>({eligible:false,reason,
  rawEpochMilliseconds,phaseMinutes,guard:null});

function yearDates(year){
  const start=Date.UTC(year,0,1),end=Date.UTC(year+1,0,1),result=[];
  for(let epoch=start;epoch<end;epoch+=DAY_MS)result.push(dateOf(epoch));
  return result;
}

function phaseMinutes(epoch,transitEpoch){return(epoch-transitEpoch)/MINUTE_MS;}

function validate(input){
  fields(input,['year','latitude','longitude','timeZone'],['solarModel']);
  if(!Number.isInteger(input.year)||input.year<2001||input.year>2098)throw new RangeError('Northern context year must be 2001 through 2098');
  if(!Number.isFinite(input.latitude)||input.latitude<44.5||input.latitude>89)throw new RangeError('Northern context latitude must be 44.5° through 89°');
  if(!Number.isFinite(input.longitude)||Math.abs(input.longitude)>180)throw new RangeError('Longitude must be −180° through 180°');
  if(typeof input.timeZone!=='string'||!(input.timeZone==='UTC'||input.timeZone.includes('/')))throw new RangeError('An explicit IANA time zone is required');
  try{new Intl.DateTimeFormat('en-US',{timeZone:input.timeZone}).format(0);}
  catch{throw new RangeError('timeZone must be a supported IANA identifier');}
  const solarModel=Object.hasOwn(input,'solarModel')?input.solarModel:'usno';
  if(!['usno','spa'].includes(solarModel))throw new RangeError('solarModel must be usno or spa');
  return solarModel;
}

function nightDurations(start,end){
  const mRaw=start.events.maghrib.epochMilliseconds,rRaw=end.events.sunrise.epochMilliseconds;
  if(!Number.isFinite(mRaw)||!Number.isFinite(rRaw))return null;
  const mSelected=mRaw+MARGIN.maghrib,rSelected=rRaw+MARGIN.sunrise;
  return{rawMinutes:(rRaw-mRaw)/MINUTE_MS,selectedMinutes:(rSelected-mSelected)/MINUTE_MS,
    maghribRawEpochMilliseconds:mRaw,maghribSelectedEpochMilliseconds:mSelected,
    sunriseRawEpochMilliseconds:rRaw,sunriseSelectedEpochMilliseconds:rSelected};
}

function dayDurations(row){
  const rise=row.events.sunrise.epochMilliseconds,set=row.events.maghrib.epochMilliseconds;
  if(!Number.isFinite(rise)||!Number.isFinite(set))return null;
  return{rawMinutes:(set-rise)/MINUTE_MS,
    selectedMinutes:((set+MARGIN.maghrib)-(rise+MARGIN.sunrise))/MINUTE_MS};
}

/**
 * Build the year-local, source-constrained guard for ordinary northern Fajr
 * and Isha. Returned event flags are eligibility only; callers select and
 * render the raw event themselves.
 */
export function buildNorthernContext(input){
  const solarModel=validate(input);
  const {year,latitude,longitude,timeZone}=input,ownedDates=yearDates(year);
  // In 2001/2098, the out-of-domain padding still blocks the annual twilight
  // guard. Calculate the valid rows so independent daily horizons are retained.
  const dates=[dateOf(Date.UTC(year,0,1)-DAY_MS),...ownedDates,dateOf(Date.UTC(year+1,0,1))];
  const rows=[],failures=[];
  for(const date of dates){
    try{rows.push({date,solar:calculateLocalSolarDay({date,latitude,longitude,timeZone,ishaAngleDegrees:16,solarModel})});}
    catch(error){rows.push({date,solar:null,error:error instanceof Error?error.message:String(error)});failures.push({date,reason:'solar-day-unavailable',detail:error instanceof Error?error.message:String(error)});}
  }
  const rowByDate=new Map(rows.map(row=>[row.date,row]));
  const days=Object.fromEntries(dates.map(date=>[date,{
    fajr:emptyGuard('annual-context-pending'),isha:emptyGuard('annual-context-pending'),
    horizons:{sunriseEligible:false,maghribEligible:false,reason:'annual-context-pending',
      rawDayMinutes:null,selectedDayMinutes:null,previousRawNightMinutes:null,previousSelectedNightMinutes:null,
      nextRawNightMinutes:null,nextSelectedNightMinutes:null},
  }]));

  // Populate independent day/night horizon eligibility first. The day is the
  // same transit row; the physical night pairs dusk D with dawn D+1 in UTC.
  const dayGeometry=new Map(),nightGeometry=new Map();
  for(let i=0;i<rows.length;i++){
    const row=rows[i];
    if(row.solar)dayGeometry.set(row.date,dayDurations(row.solar));
    if(i+1<rows.length&&row.solar&&rows[i+1].solar){
      const duration=nightDurations(row.solar,rows[i+1].solar);
      if(duration)nightGeometry.set(row.date,duration);
    }
  }
  for(let i=0;i<rows.length;i++){
    const date=rows[i].date,entry=days[date];
    const day=dayGeometry.get(date),previousNight=i>0?nightGeometry.get(rows[i-1].date):null,nextNight=nightGeometry.get(date);
    const rawDayMinutes=day?.rawMinutes??null,selectedDayMinutes=day?.selectedMinutes??null;
    const previousRawNightMinutes=previousNight?.rawMinutes??null,previousSelectedNightMinutes=previousNight?.selectedMinutes??null;
    const nextRawNightMinutes=nextNight?.rawMinutes??null,nextSelectedNightMinutes=nextNight?.selectedMinutes??null;
    const sunriseEligible=[rawDayMinutes,selectedDayMinutes,previousRawNightMinutes,previousSelectedNightMinutes].every(Number.isFinite)
      &&rawDayMinutes>300&&selectedDayMinutes>300&&previousRawNightMinutes>300&&previousSelectedNightMinutes>300;
    const maghribEligible=[rawDayMinutes,selectedDayMinutes,nextRawNightMinutes,nextSelectedNightMinutes].every(Number.isFinite)
      &&rawDayMinutes>300&&selectedDayMinutes>300&&nextRawNightMinutes>300&&nextSelectedNightMinutes>300;
    const reason=sunriseEligible&&maghribEligible?null:!day?'day-horizon-unavailable'
      :!previousNight||!nextNight?'adjacent-night-horizon-unavailable':'five-hour-horizon-bound-not-met';
    entry.horizons={sunriseEligible,maghribEligible,reason,rawDayMinutes,selectedDayMinutes,
      previousRawNightMinutes,previousSelectedNightMinutes,nextRawNightMinutes,nextSelectedNightMinutes};
  }

  const firstMissing=rows.flatMap((row,i)=>row.solar&&!isReal(row.solar.events.fajr)&&isMissingFajr(row.solar.events.fajr)?[i]:[]);
  const unknownFajr=rows.filter(row=>row.solar&&!isReal(row.solar.events.fajr)&&!isMissingFajr(row.solar.events.fajr));
  let contextReason=null,anchorIndex=null,anchorDate=null,q=null,missingStart=null,missingEnd=null;
  if(year<2002||year>2097)contextReason='padded-year-outside-solar-domain';
  else if(failures.length)contextReason='annual-solar-context-incomplete';
  else if(unknownFajr.length)contextReason='fajr-absence-not-a-proven-seasonal-gap';
  else if(firstMissing.length){
    const first=firstMissing[0],last=firstMissing.at(-1);
    if(last-first+1!==firstMissing.length)contextReason='disjoint-fajr-absence-windows';
    else if(first===0||last===rows.length-1)contextReason='fajr-gap-lacks-real-seasonal-anchor';
    else if(!isReal(rows[first-1].solar.events.fajr)||!isReal(rows[last+1].solar.events.fajr))contextReason='fajr-gap-lacks-real-seasonal-anchor';
    else{anchorIndex=first-1;anchorDate=rows[anchorIndex].date;missingStart=rows[first].date;missingEnd=rows[last].date;}
  }else{
    anchorIndex=rows.findIndex(row=>row.date===`${year}-06-21`);
    if(anchorIndex<0||!isReal(rows[anchorIndex].solar?.events.fajr))contextReason='june-21-real-fajr-anchor-unavailable';
    else anchorDate=rows[anchorIndex].date;
  }

  const anchorNight=anchorIndex===null?null:nightGeometry.get(rows[anchorIndex-1]?.date);
  const anchorFajr=anchorIndex===null?null:rows[anchorIndex].solar?.events.fajr.epochMilliseconds;
  if(!contextReason){
    if(!anchorNight||!Number.isFinite(anchorFajr))contextReason='anchor-night-incomplete';
    else{
      const religiousNightMinutes=(anchorFajr-anchorNight.maghribSelectedEpochMilliseconds)/MINUTE_MS;
      q=religiousNightMinutes/(3*anchorNight.selectedMinutes);
      if(!(religiousNightMinutes>0&&religiousNightMinutes<anchorNight.selectedMinutes&&Number.isFinite(q)&&q>0&&q<1/3))contextReason='invalid-anchor-night-ratio';
    }
  }

  const nightCandidates=new Map();
  if(!contextReason){
    for(let i=0;i<rows.length-1;i++){
      const start=rows[i],end=rows[i+1],geometry=nightGeometry.get(start.date);
      const endFajr=end.solar.events.fajr;
      if(!geometry){contextReason='annual-night-horizon-incomplete';break;}
      const realFajr=isReal(endFajr);
      const oneThirdMinutes=realFajr
        ?(endFajr.epochMilliseconds-geometry.maghribSelectedEpochMilliseconds)/3/MINUTE_MS
        :q*geometry.selectedMinutes;
      if(!(Number.isFinite(oneThirdMinutes)&&oneThirdMinutes>0&&oneThirdMinutes<geometry.selectedMinutes)){
        contextReason='night-estimate-outside-horizon-night';break;
      }
      const startTransit=start.solar.transit.epochMilliseconds,endTransit=end.solar.transit.epochMilliseconds;
      const ishaEstimate=geometry.maghribSelectedEpochMilliseconds+oneThirdMinutes*MINUTE_MS;
      const fajrUpper=end.solar.events.sunrise.epochMilliseconds+MARGIN.sunrise-oneThirdMinutes*MINUTE_MS;
      if(![startTransit,endTransit,ishaEstimate,fajrUpper].every(Number.isFinite)){
        contextReason='annual-seasonal-candidate-nonfinite';break;
      }
      nightCandidates.set(start.date,{startDate:start.date,endDate:end.date,realFajr,
        religiousNightMinutes:realFajr?(endFajr.epochMilliseconds-geometry.maghribSelectedEpochMilliseconds)/MINUTE_MS:null,
        ordinaryHorizonNightMinutes:geometry.selectedMinutes,oneThirdMinutes,
        maghribSelectedEpochMilliseconds:geometry.maghribSelectedEpochMilliseconds,
        sunriseEndSelectedEpochMilliseconds:geometry.sunriseSelectedEpochMilliseconds,
        ishaEstimateEpochMilliseconds:ishaEstimate,fajrUpperEpochMilliseconds:fajrUpper,
        ishaEstimatePhaseMinutes:phaseMinutes(ishaEstimate,startTransit),
        fajrUpperPhaseMinutes:phaseMinutes(fajrUpper,endTransit),
        rawIshaEpochMilliseconds:start.solar.events.isha.epochMilliseconds,
        rawFajrEpochMilliseconds:endFajr.epochMilliseconds,
        nextRawFajrEpochMilliseconds:endFajr.epochMilliseconds,
      });
    }
  }

  let annualIshaLowerPhase=null,annualFajrUpperPhase=null;
  const requiredPairs=rows.slice(0,-1).map(row=>nightGeometry.get(row.date));
  const requiredDays=dates.map(date=>dayGeometry.get(date));
  const horizonGatePassed=requiredDays.every(day=>day&&day.rawMinutes>300&&day.selectedMinutes>300)
    &&requiredPairs.every(night=>night&&night.rawMinutes>300&&night.selectedMinutes>300);
  if(!contextReason){
    const allPaddedNights=rows.slice(0,-1).map(row=>nightCandidates.get(row.date));
    const annualIsha=allPaddedNights;
    const annualFajr=allPaddedNights;
    if(annualIsha.some(candidate=>!candidate)||annualFajr.some(candidate=>!candidate))contextReason='annual-transition-envelope-incomplete';
    else{
      annualIshaLowerPhase=Math.min(...annualIsha.map(candidate=>candidate.ishaEstimatePhaseMinutes-20));
      annualFajrUpperPhase=Math.max(...annualFajr.map(candidate=>candidate.fajrUpperPhaseMinutes+20));
      if(!Number.isFinite(annualIshaLowerPhase)||!Number.isFinite(annualFajrUpperPhase))contextReason='annual-transition-envelope-nonfinite';
    }
  }
  if(!horizonGatePassed&&!contextReason)contextReason='annual-five-hour-horizon-gate-not-met';

  // Populate Fajr/Isha ordinary-only eligibility for the requested event dates.
  for(const date of dates){
    const entry=days[date],row=rowByDate.get(date),prevDate=dateOf(midnight(date)-DAY_MS);
    const previous=nightCandidates.get(prevDate),next=nightCandidates.get(date);
    const rawFajr=row.solar?.events.fajr,rawIsha=row.solar?.events.isha;
    const fajrPhase=isReal(rawFajr)&&row.solar?phaseMinutes(rawFajr.epochMilliseconds,row.solar.transit.epochMilliseconds):null;
    const ishaPhase=isReal(rawIsha)&&row.solar?phaseMinutes(rawIsha.epochMilliseconds,row.solar.transit.epochMilliseconds):null;
    entry.nightToNext=next??null;
    entry.previousNight=previous??null;
    if(!ownedDates.includes(date)){
      entry.fajr=emptyGuard('outside-requested-year',isReal(rawFajr)?rawFajr.epochMilliseconds:null,fajrPhase);
      entry.isha=emptyGuard('outside-requested-year',isReal(rawIsha)?rawIsha.epochMilliseconds:null,ishaPhase);
      continue;
    }
    if(contextReason){
      entry.fajr=emptyGuard(contextReason,isReal(rawFajr)?rawFajr.epochMilliseconds:null,fajrPhase);
      entry.isha=emptyGuard(contextReason,isReal(rawIsha)?rawIsha.epochMilliseconds:null,ishaPhase);
      continue;
    }
    const fajrUpper=previous?.fajrUpperEpochMilliseconds??null;
    const fajrTransitionUpper=previous?fajrUpper+FAJR_TRANSITION_MS:null;
    const ishaEstimate=next?.ishaEstimateEpochMilliseconds??null;
    const ishaTransitionLower=next?ishaEstimate-ISHA_TRANSITION_MS:null;
    const missingNight=next&&!next.realFajr;
    const fajrEligible=isReal(rawFajr)&&Number.isFinite(fajrTransitionUpper)
      &&fajrPhase>annualFajrUpperPhase
      &&rawFajr.epochMilliseconds>fajrTransitionUpper;
    const ishaEligible=isReal(rawIsha)&&Number.isFinite(ishaTransitionLower)&&!missingNight
      &&ishaPhase<annualIshaLowerPhase
      &&rawIsha.epochMilliseconds<ishaTransitionLower
      &&Number.isFinite(next?.nextRawFajrEpochMilliseconds)
      &&rawIsha.epochMilliseconds<next.nextRawFajrEpochMilliseconds;
    entry.fajr={eligible:fajrEligible,reason:fajrEligible?null:!isReal(rawFajr)?'real-fajr-unavailable'
      :fajrPhase<=annualFajrUpperPhase?'inside-or-before-annual-fajr-transition-envelope':'fails-direct-fajr-estimate-bound',
      rawEpochMilliseconds:isReal(rawFajr)?rawFajr.epochMilliseconds:null,rawReason:rawFajr?.reason??null,phaseMinutes:fajrPhase,
      upperEstimateEpochMilliseconds:fajrUpper,transitionUpperEpochMilliseconds:fajrTransitionUpper,
      annualTransitionUpperPhaseMinutes:annualFajrUpperPhase,
      directCondition:isReal(rawFajr)&&Number.isFinite(fajrTransitionUpper)?rawFajr.epochMilliseconds>fajrTransitionUpper:false};
    entry.isha={eligible:ishaEligible,reason:ishaEligible?null:!isReal(rawIsha)?'real-isha-unavailable'
      :missingNight?'following-fajr-is-seasonally-absent'
      :ishaPhase>=annualIshaLowerPhase?'inside-or-after-annual-isha-transition-envelope':'fails-direct-isha-estimate-bound',
      rawEpochMilliseconds:isReal(rawIsha)?rawIsha.epochMilliseconds:null,rawReason:rawIsha?.reason??null,phaseMinutes:ishaPhase,
      estimateEpochMilliseconds:ishaEstimate,transitionLowerEpochMilliseconds:ishaTransitionLower,
      annualTransitionLowerPhaseMinutes:annualIshaLowerPhase,
      directCondition:isReal(rawIsha)&&Number.isFinite(ishaTransitionLower)?rawIsha.epochMilliseconds<ishaTransitionLower:false,
      beforeNextRawFajr:isReal(rawIsha)&&Number.isFinite(next?.nextRawFajrEpochMilliseconds)
        ?rawIsha.epochMilliseconds<next.nextRawFajrEpochMilliseconds:false};
  }

  return{status:contextReason?'blocked':'available',reason:contextReason,
    metadata:{year,latitude,longitude,timeZone,firstPaddedDate:dates[0],lastPaddedDate:dates.at(-1),
      guardId:'northern-ordinary-annual-envelope-v1',phaseFrame:'elapsed UTC minutes from the event-owning upper-meridian transit',
      requiredYearRange:{minimum:2002,maximum:2097},
      ownedDateCount:ownedDates.length,anchorDate,q,missingFajrStartDate:missingStart,missingFajrEndDate:missingEnd,
      missingFajrDayCount:firstMissing.length,ratioDefinition:'(last-real-Fajr minus preceding selected Maghrib) / (3 × that actual selected-horizon night)',
      nightlyHorizonBasis:'UTC interval from Maghrib on solar-cycle date D to Sunrise on solar-cycle date D+1; no fixed 1440-minute day assumption',
      fajrEstimateBound:'selected next-cycle Sunrise minus one-third night; any positive 2-degree addition makes the actual determined Fajr no later than this upper bound',
      ishaEstimate:'selected Maghrib plus one-third night',transitionMarginMinutes:20,
      annualIshaTransitionLowerPhaseMinutes:annualIshaLowerPhase,annualFajrTransitionUpperPhaseMinutes:annualFajrUpperPhase,
      ordinaryOnly:true,interpolationApplied:false,sourceSemanticsFullyConfirmed:false,horizonGatePassed,
      horizonGate:'all padded-row raw and selected daylight and every consecutive padded raw and selected night are strictly greater than 300 minutes',
      transitionEnvelopeBasis:'minimum/maximum across every consecutive padded night, including previous-December-31 Isha and following-January-1 Fajr candidates',
      solarModel,solarProvider:solarModel==='spa'?'SPA-continuous-point-v1':'USNO-continuous-point-v1',
      failures},days};
}
