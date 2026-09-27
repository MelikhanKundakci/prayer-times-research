// Pure, conservative interpretation of the published entry/return ramps.
// This envelope does not implement the source's optional <=5-minute snap.
import {fields} from '../input.mjs';

const DAY=86_400_000,STEP=300_000,EPSILON=0.001;
const midnight=date=>Date.parse(`${date}T00:00:00Z`);
function dateEpoch(date){
  const t=typeof date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(date)?midnight(date):NaN;
  if(!Number.isFinite(t)||new Date(t).toISOString().slice(0,10)!==date)throw new RangeError('Valid Gregorian source date required');
  return t;
}
function array(values){
  if(!Array.isArray(values)||Object.getPrototypeOf(values)!==Array.prototype||values.length===0)
    throw new TypeError('A nonempty dense candidate array is required');
  const keys=Reflect.ownKeys(values);
  if(keys.length!==values.length+1||keys.some(key=>key!=='length'&&(!/^(0|[1-9]\d*)$/.test(String(key))||Number(key)>=values.length)))
    throw new TypeError('Only dense array elements are accepted');
  for(let i=0;i<values.length;i++){
    const d=Object.getOwnPropertyDescriptor(values,String(i));
    if(!d||!d.enumerable||!Object.hasOwn(d,'value'))throw new TypeError('Only own data array elements are accepted');
  }
}
const blocked=(reason,detail=null)=>({status:'policy-blocked',reason,detail,selections:[]});

/** Select one complete replacement segment; all clock phases are unwrapped UTC. */
export function selectLocalRelativeSegment(input){
  fields(input,['event','leftAnchor','rightAnchor','candidates']);
  if(!['fajr','isha'].includes(input.event))throw new RangeError('The event must be fajr or isha');
  for(const anchor of [input.leftAnchor,input.rightAnchor]){
    fields(anchor,['date','epochMilliseconds']);dateEpoch(anchor.date);
    if(!Number.isFinite(anchor.epochMilliseconds))throw new TypeError('A finite actual anchor is required');
  }
  array(input.candidates);
  const rows=input.candidates.map(row=>{
    fields(row,['date','nightStartEpochMilliseconds','nightEndEpochMilliseconds','candidateEpochMilliseconds']);
    const day=dateEpoch(row.date);
    if(![row.nightStartEpochMilliseconds,row.nightEndEpochMilliseconds,row.candidateEpochMilliseconds].every(Number.isFinite))
      throw new TypeError('Finite actual nights and candidates are required');
    return{...row,day};
  });
  const leftDay=dateEpoch(input.leftAnchor.date),rightDay=dateEpoch(input.rightAnchor.date);
  if(rows.some((row,i)=>row.day!==leftDay+(i+1)*DAY)||rightDay!==leftDay+(rows.length+1)*DAY)
    throw new RangeError('Anchors and candidate source dates must be consecutive');
  const left=input.leftAnchor.epochMilliseconds-leftDay,right=input.rightAnchor.epochMilliseconds-rightDay;
  if(Math.abs(right-left)>STEP*(rows.length+1)+EPSILON)
    return blocked('local-relative-anchor-ramp-unreachable');
  const sign=input.event==='isha'?-1:1,selections=[];
  let previous=left,maximumStep=0;
  for(let i=0;i<rows.length;i++){
    const row=rows[i],length=row.nightEndEpochMilliseconds-row.nightStartEpochMilliseconds;
    if(!(length>0&&length<DAY&&row.nightStartEpochMilliseconds<row.candidateEpochMilliseconds
      &&row.candidateEpochMilliseconds<row.nightEndEpochMilliseconds))
      return blocked('local-relative-candidate-outside-actual-night',{date:row.date});
    const candidate=row.candidateEpochMilliseconds-row.day;
    const leftRamp=left+sign*STEP*(i+1),rightRamp=right+sign*STEP*(rows.length-i);
    const phase=input.event==='isha'?Math.max(candidate,leftRamp,rightRamp):Math.min(candidate,leftRamp,rightRamp);
    const selected=phase+row.day;
    if(!(row.nightStartEpochMilliseconds<selected&&selected<row.nightEndEpochMilliseconds))
      return blocked('local-relative-ramp-outside-actual-night',{date:row.date});
    const step=Math.abs(phase-previous);maximumStep=Math.max(maximumStep,step);
    if(step>STEP+EPSILON)return blocked('local-relative-selected-step-exceeds-five-minutes',{date:row.date,stepMilliseconds:step});
    const constrainedLeft=input.event==='isha'?leftRamp>candidate:leftRamp<candidate;
    const constrainedRight=input.event==='isha'?rightRamp>candidate:rightRamp<candidate;
    const mode=phase===candidate?'annual-ratio':constrainedLeft&&constrainedRight?'overlap-ramp'
      :phase===leftRamp?'entry-ramp':'return-ramp';
    selections.push({date:row.date,selectedEpochMilliseconds:selected,candidateEpochMilliseconds:row.candidateEpochMilliseconds,
      nightStartEpochMilliseconds:row.nightStartEpochMilliseconds,nightEndEpochMilliseconds:row.nightEndEpochMilliseconds,
      selectedPhaseMilliseconds:phase,leftRampPhaseMilliseconds:leftRamp,rightRampPhaseMilliseconds:rightRamp,mode});
    previous=phase;
  }
  const lastStep=Math.abs(right-previous);maximumStep=Math.max(maximumStep,lastStep);
  if(lastStep>STEP+EPSILON)return blocked('local-relative-selected-step-exceeds-five-minutes',{date:input.rightAnchor.date,stepMilliseconds:lastStep});
  return{status:'available',reason:null,detail:null,selections,
    maximumPhaseStepMilliseconds:maximumStep,stepLimitMilliseconds:STEP,numericalToleranceMilliseconds:EPSILON,
    targetReachedCount:selections.filter(row=>row.mode==='annual-ratio').length,
    overlapCount:selections.filter(row=>row.mode==='overlap-ramp').length};
}
