// Fixed development-selected hypothesis. No reference-calendar access.
import {calculateCandidateDay,CANDIDATES} from './candidate-model.mjs';
export const RECIPE=CANDIDATES['utc12-h5over6-ceil'];
export function calculateDay(input){
 if(arguments.length!==1)throw new TypeError('Only date,latitude,longitude,timeZone input accepted');
 const r=calculateCandidateDay(input,RECIPE.id);
 return{...r,profileId:'bayynat-point-approximation-utc12-h5over6-ceil',profileVersion:'0.1.0',qualityFlags:[...r.qualityFlags,{code:'selected-on-known-data-not-exact-provider-recipe'},{code:'fixed-horizon-does-not-establish-elevation-match'}]};
}
