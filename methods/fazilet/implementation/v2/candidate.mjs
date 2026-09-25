import{calculateRoundingExperiment}from'./model.mjs';
export function calculateFaziletV2(date,point){
 if(arguments.length!==2)throw new Error('Exactly date and point required.');
 const r=calculateRoundingExperiment(date,point,'outer-events-outward');
 return {...r,profile:{...r.profile,id:'fazilet-temkin-event-rounding-v2',version:'0.2.0-research'}};
}
