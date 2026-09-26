// Explicit local night-fraction policy. This is a standalone interpretation,
// not a claim that it reproduces a publisher's complete seasonal algorithm.
import {fields} from '../input.mjs';

const MINUTE_MS=60_000,TRANSITION_MS=20*MINUTE_MS,FAJR_FACTOR=11/8;
const MISSING_REASONS=new Set(['sun-continuously-above-threshold','tangent-without-directed-crossing']);
const dateOf=epoch=>new Date(epoch).toISOString().slice(0,10);
const midnight=date=>Date.parse(`${date}T00:00:00Z`);
const isFiniteNumber=Number.isFinite;

function datesOfYear(year){
  const out=[];
  for(let t=Date.UTC(year,0,1);t<Date.UTC(year+1,0,1);t+=86_400_000)out.push(dateOf(t));
  return out;
}

/** Select raw versus candidate twilight with an exact 20-minute smooth band. */
export function selectSeasonalTwilight(input){
  fields(input,['event','rawEpochMilliseconds','candidateEpochMilliseconds'],['absenceReason']);
  const {event,rawEpochMilliseconds:raw,candidateEpochMilliseconds:candidate,absenceReason}=input;
  if(event!=='fajr'&&event!=='isha')throw new RangeError('event must be fajr or isha');
  if(raw!==null&&!isFiniteNumber(raw))throw new TypeError('rawEpochMilliseconds must be finite or null');
  if(!isFiniteNumber(candidate))throw new TypeError('candidateEpochMilliseconds must be finite');
  if(raw===null){
    if(!MISSING_REASONS.has(absenceReason))throw new RangeError('A missing raw event requires a proven continuous-above or tangent reason');
    return{status:'estimated',reason:'raw-seasonal-crossing-unavailable',rawEpochMilliseconds:null,
      candidateEpochMilliseconds:candidate,selectedEpochMilliseconds:candidate,weight:1,mode:'night-fraction'};
  }
  if(Object.hasOwn(input,'absenceReason'))throw new TypeError('absenceReason is only valid when the raw event is unavailable');
  let x,ordinary;
  if(event==='isha'){
    ordinary=raw<=candidate-TRANSITION_MS;
    if(ordinary)return{status:'calculated',reason:null,rawEpochMilliseconds:raw,candidateEpochMilliseconds:candidate,
      selectedEpochMilliseconds:raw,weight:0,mode:'ordinary'};
    if(raw>=candidate)return{status:'estimated',reason:'night-fraction-candidate-selected',rawEpochMilliseconds:raw,
      candidateEpochMilliseconds:candidate,selectedEpochMilliseconds:candidate,weight:1,mode:'night-fraction'};
    x=(raw-candidate+TRANSITION_MS)/TRANSITION_MS;
  }else{
    ordinary=raw>=candidate+TRANSITION_MS;
    if(ordinary)return{status:'calculated',reason:null,rawEpochMilliseconds:raw,candidateEpochMilliseconds:candidate,
      selectedEpochMilliseconds:raw,weight:0,mode:'ordinary'};
    if(raw<=candidate)return{status:'estimated',reason:'night-fraction-candidate-selected',rawEpochMilliseconds:raw,
      candidateEpochMilliseconds:candidate,selectedEpochMilliseconds:candidate,weight:1,mode:'night-fraction'};
    x=(candidate+TRANSITION_MS-raw)/TRANSITION_MS;
  }
  const weight=x*x*(3-2*x);
  return{status:'estimated',reason:'night-fraction-transition',rawEpochMilliseconds:raw,
    candidateEpochMilliseconds:candidate,selectedEpochMilliseconds:raw+(candidate-raw)*weight,weight,mode:'transition'};
}

function blocked(reason,raw=null,candidate=null){
  return{status:'policy-blocked',reason,rawEpochMilliseconds:raw,candidateEpochMilliseconds:candidate,
    selectedEpochMilliseconds:null,weight:null,mode:'unavailable'};
}

function ownYearDates(year){return datesOfYear(year);}

/** Build the full-year opt-in local night-fraction selection from a northern context. */
export function buildLocalSummerContext(northern){
  if(!northern||Object.getPrototypeOf(northern)!==Object.prototype)throw new TypeError('Expected a northern context record');
  const year=northern.metadata?.year;
  if(!Number.isInteger(year)||year<2001||year>2098)throw new RangeError('Northern context year must be 2001 through 2098');
  const dates=ownYearDates(year),blockedDays=reason=>Object.fromEntries(dates.map(date=>[date,{
    fajr:blocked(reason),isha:blocked(reason),
  }]));
  const baseMetadata={year,policyId:'local-night-fraction-smooth-v1',q:northern.metadata.q,
    qAnchorDate:northern.metadata.anchorDate,ratioDefinition:'one annual q = anchor-night portion of shari night / 3 / selected actual horizon-night length',
    candidateRules:{isha:'selected Maghrib + q × selected actual horizon-night length',
      fajr:'selected Sunrise − (11/8) × q × selected actual horizon-night length'},
    fajrFactor:FAJR_FACTOR,transition:{widthMinutes:20,shape:'cubic smoothstep',endpoints:'ordinary at the outer raw boundary; candidate at the estimate boundary'},
    qFrozenForWholeYear:true,annualHorizonGateRequired:true,institutionalEquivalence:'not-claimed'};
  if(year<2002||year>2097){
    const reason=northern.reason??'padded-year-outside-solar-domain';
    return{status:'blocked',reason,metadata:{...baseMetadata,northernReason:reason},days:blockedDays(reason)};
  }
  if(northern.status!=='available'){
    const reason='northern-annual-context-unavailable';
    return{status:'blocked',reason,metadata:{...baseMetadata,northernReason:northern.reason??null},days:blockedDays(reason)};
  }
  const q=northern.metadata.q;
  if(northern.metadata.horizonGatePassed!==true){
    const reason='annual-five-hour-horizon-gate-not-met';
    return{status:'blocked',reason,metadata:baseMetadata,days:blockedDays(reason)};
  }
  if(!isFiniteNumber(q)||!(q>0&&q<1/3)){
    const reason='invalid-annual-night-ratio';
    return{status:'blocked',reason,metadata:baseMetadata,days:blockedDays(reason)};
  }
  const sourceDays=northern.days;
  const nightMap=new Map();
  for(const startDate of [...datesOfYear(year-1).slice(-1),...dates]){
    const night=sourceDays?.[startDate]?.nightToNext;
    if(night)nightMap.set(startDate,night);
  }
  const candidateMap=new Map();
  let contextReason=null;
  for(const [startDate,night] of nightMap){
    const H=night.ordinaryHorizonNightMinutes*MINUTE_MS;
    const M=night.maghribSelectedEpochMilliseconds,R=night.sunriseEndSelectedEpochMilliseconds;
    const i=M+q*H,f=R-FAJR_FACTOR*q*H;
    if(![H,M,R,i,f].every(isFiniteNumber)||!(H>0&&M<i&&i<f&&f<R)){
      contextReason='night-fraction-candidates-outside-physical-night';break;
    }
    candidateMap.set(startDate,{startDate,endDate:dateOf(midnight(startDate)+86_400_000),
      horizonNightMilliseconds:H,maghribSelectedEpochMilliseconds:M,sunriseSelectedEpochMilliseconds:R,
      ishaCandidateEpochMilliseconds:i,fajrCandidateEpochMilliseconds:f});
  }
  if(!contextReason&&candidateMap.size!==dates.length+1)contextReason='padded-night-candidate-unavailable';
  const eventRows=new Map();
  for(const date of dates){
    const day=sourceDays?.[date];
    const previous=day?.previousNight?.startDate?day.previousNight:candidateMap.get(dateOf(midnight(date)-86_400_000));
    const next=day?.nightToNext?.startDate?day.nightToNext:candidateMap.get(date);
    const fajrRaw=day?.fajr?.rawEpochMilliseconds??null,ishaRaw=day?.isha?.rawEpochMilliseconds??null;
    const fajrCandidate=previous?candidateMap.get(previous.startDate)?.fajrCandidateEpochMilliseconds:null;
    const ishaCandidate=next?candidateMap.get(next.startDate)?.ishaCandidateEpochMilliseconds:null;
    const fajrResult=eventResult('fajr',day?.fajr,fajrRaw,fajrCandidate);
    const ishaResult=eventResult('isha',day?.isha,ishaRaw,ishaCandidate);
    eventRows.set(date,{fajr:fajrResult,isha:ishaResult});
  }
  if(!contextReason){
    const allPaddedEvents=[];
    for(const date of [dateOf(Date.UTC(year-1,11,31)),...dates,dateOf(Date.UTC(year+1,0,1))]){
      const day=sourceDays?.[date];
      if(!day){contextReason='padded-event-row-unavailable';break;}
      for(const event of ['fajr','isha']){
        const raw=day[event]?.rawEpochMilliseconds??null;
        const candidate=event==='fajr'
          ?candidateMap.get(dateOf(midnight(date)-86_400_000))?.fajrCandidateEpochMilliseconds
          :candidateMap.get(date)?.ishaCandidateEpochMilliseconds;
        // The outermost padded row has one event outside the built night set:
        // previous Dec 31 Fajr and next Jan 1 Isha are not required.
        if(!isFiniteNumber(candidate))continue;
        const result=eventResult(event,day[event],raw,candidate);
        allPaddedEvents.push({date,event,result});
      }
    }
    if(!contextReason){
      const absent=new Map();
      for(const item of allPaddedEvents){
        if(item.result.status==='policy-blocked'){
          contextReason=item.result.reason==='raw-event-reason-not-seasonal'
            ?'raw-twilight-unavailable-for-nonseasonal-reason':'annual-candidate-or-source-event-unavailable';
          break;
        }
        const missing=item.result.rawEpochMilliseconds===null;
        if(missing){
          const key=item.event,group=absent.get(key)??[];group.push(item.date);absent.set(key,group);
        }
      }
      if(!contextReason){
        for(const [event,missingDates] of absent){
          const eventSequence=allPaddedEvents.filter(item=>item.event===event);
          const indices=missingDates.map(date=>eventSequence.findIndex(item=>item.date===date));
          const first=Math.min(...indices),last=Math.max(...indices);
          if(last-first+1!==indices.length){contextReason='disjoint-seasonal-twilight-absence';break;}
          for(const adjacent of [eventSequence[first-1],eventSequence[last+1]]){
            if(!adjacent||adjacent.result.mode!=='night-fraction'){
              contextReason='seasonal-transition-not-complete-at-sign-boundary';break;
            }
          }
          if(contextReason)break;
        }
      }
    }
    if(!contextReason){
      const boundaryChecks=[
        [dateOf(Date.UTC(year-1,11,31)),'isha'],[`${year}-01-01`,'fajr'],
        [dateOf(Date.UTC(year+1,0,1)),'fajr'],[`${year}-12-31`,'isha'],
      ];
      for(const [date,event] of boundaryChecks){
        const item=allPaddedEvents.find(row=>row.date===date&&row.event===event);
        if(!item||item.result.mode!=='ordinary'){
          contextReason='annual-boundary-event-not-ordinary';break;
        }
      }
    }
    if(!contextReason){
      for(const startDate of [...datesOfYear(year-1).slice(-1),...dates]){
        const night=candidateMap.get(startDate);
        if(!night)continue;
        const ishaDate=startDate,fajrDate=night.endDate;
        const selectedIsha=allPaddedEvents.find(row=>row.date===ishaDate&&row.event==='isha')?.result.selectedEpochMilliseconds;
        const selectedFajr=allPaddedEvents.find(row=>row.date===fajrDate&&row.event==='fajr')?.result.selectedEpochMilliseconds;
        if(![night.maghribSelectedEpochMilliseconds,selectedIsha,selectedFajr,night.sunriseSelectedEpochMilliseconds].every(isFiniteNumber)
          ||!(night.maghribSelectedEpochMilliseconds<selectedIsha&&selectedIsha<selectedFajr&&selectedFajr<night.sunriseSelectedEpochMilliseconds)){
          contextReason='selected-events-outside-physical-night';break;
        }
      }
    }
  }
  const days={};
  for(const date of dates){
    const row=eventRows.get(date);
    days[date]=contextReason?{fajr:blocked(contextReason,row?.fajr.rawEpochMilliseconds,row?.fajr.candidateEpochMilliseconds),
      isha:blocked(contextReason,row?.isha.rawEpochMilliseconds,row?.isha.candidateEpochMilliseconds)}:row;
  }
  return{status:contextReason?'blocked':'available',reason:contextReason,
    metadata:{...baseMetadata,anchorDate:northern.metadata.anchorDate,q,
      dateRange:{first:dates[0],last:dates.at(-1)},ownedDateCount:dates.length,
      annualHorizonGatePassed:northern.metadata.horizonGatePassed===true,
      candidateNightCount:candidateMap.size,absenceRowsByEvent:Object.fromEntries([...new Set(['fajr','isha'])].map(event=>[
        event,allMissingDates(event,dates,eventRows)])),
      availabilityReason:contextReason},days};
}

function eventResult(event,sourceEvent,raw,candidate){
  if(!sourceEvent||!isFiniteNumber(candidate))return blocked('candidate-or-source-event-unavailable',raw,candidate);
  if(raw===null){
    const reason=sourceEvent.rawReason;
    if(!MISSING_REASONS.has(reason))return blocked('raw-event-reason-not-seasonal',null,candidate);
    return selectSeasonalTwilight({event,rawEpochMilliseconds:null,candidateEpochMilliseconds:candidate,absenceReason:reason});
  }
  return selectSeasonalTwilight({event,rawEpochMilliseconds:raw,candidateEpochMilliseconds:candidate});
}

function allMissingDates(event,dates,eventRows){
  return dates.filter(date=>eventRows.get(date)?.[event]?.rawEpochMilliseconds===null);
}
