// Post-V1 known-data experiment. Only event rounding differs; all V1 geometry stays frozen.
import{calculateFaziletCandidate}from'../candidate.mjs';
export const RECIPES=Object.freeze(['nearest','outer-events-outward','all-events-outward']);
export function calculateRoundingExperiment(date,point,recipe){
 if(arguments.length!==3||!RECIPES.includes(recipe))throw new Error('Explicit known rounding recipe required.');
 const baseline=calculateFaziletCandidate(date,point),events={};
 const format=new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn',{timeZone:point.timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
 for(const key of ['imsak','sunrise','dhuhr','asr','maghrib','isha','sabah']){
   const e=baseline.events[key];if(e.utc===null){events[key]={...e};continue;}
   const raw=Date.parse(e.rawUtc)/60000;
   const rounding=recipe==='nearest'?'nearest':['imsak','sunrise'].includes(key)?'floor':recipe==='all-events-outward'||['maghrib','isha'].includes(key)?'ceil':'nearest';
   const value=key==='sabah'?Date.parse(events.imsak.utc)+20*60000:({nearest:Math.round,floor:Math.floor,ceil:Math.ceil}[rounding])(raw)*60000;
   const d=new Date(value),p=Object.fromEntries(format.formatToParts(d).map(p=>[p.type,p.value]));
   events[key]={...e,utc:d.toISOString(),time:`${p.hour}:${p.minute}`,localDate:`${p.year}-${p.month}-${p.day}`,rounding:key==='sabah'?'derived-rounded-imsak-plus20':rounding};
 }
 return {...baseline,profile:{...baseline.profile,id:'fazilet-event-rounding-experiment',version:'0.2.0-research',roundingRecipe:recipe,interpretation:'Global event rounding hypothesis; not an official Fazilet convention'},events};
}
