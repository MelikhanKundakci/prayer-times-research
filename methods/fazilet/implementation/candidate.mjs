import {calculateBaseline} from './baseline.mjs';
export const RECIPE='split-horizon-seven-test';
export function calculateFaziletCandidate(date,point){
  if(arguments.length!==2)throw new Error('Exactly date and point required.');
  const r=calculateBaseline(date,point,RECIPE);
  return {...r,profile:{id:'fazilet-global-temkin-10-horizon-7-experiment',version:'0.1.0-research',official:false,
    interpretation:'Empirical shared recipe selected on known Istanbul days; not an official Fazilet parameter set',
    offsetsMinutes:{imsak:-10,sunrise:-7,dhuhr:10,asr:10,maghrib:7,isha:10},sabahAfterPublishedImsakMinutes:20},
    events:Object.fromEntries(Object.entries(r.events).map(([k,e])=>[k,{...e,status:e.status==='unavailable'?'unavailable':'estimated-unconfirmed',notificationEligible:false}]))};
}
