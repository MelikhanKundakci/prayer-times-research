// One uniform quantization change; raw geometry, points and source dates untouched.
import {calculateCandidateDay,CANDIDATES} from './candidate-model.mjs';
export const NEAREST_RECIPE=CANDIDATES['utc12-h5over6-nearest'];
export function calculateNearestCandidate(input) {
  if(arguments.length!==1)throw new TypeError('Exactly one input object required');
  const result=calculateCandidateDay(input,NEAREST_RECIPE.id);
  return {...result,profileId:'bayynat-point-approximation-utc12-h5over6-nearest',profileVersion:'0.2.0-research',
    qualityFlags:[...result.qualityFlags,{code:'uniform-nearest-rounding-not-institution-confirmed'},
      {code:'development-regressions-documented'},{code:'fixed-horizon-does-not-establish-elevation-match'}]};
}
