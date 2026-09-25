// Post-freeze metadata correction only. The frozen numerical recipe is untouched.
import { calculateDay as frozenDay, calculateYear as frozenYear } from './model.mjs';
export { EVENTS } from './model.mjs';
export const REVIEWED_PROFILE_VERSION='0.1.1-research';
const reviewed=day=>({...day,locationMode:'zone',profileVersion:REVIEWED_PROFILE_VERSION});
export function calculateDay(...args){return reviewed(frozenDay(...args));}
export function calculateYear(...args){const result=frozenYear(...args);return {...result,days:result.days.map(reviewed)};}
