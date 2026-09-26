// Full-year source-free experiment; not registered as an app method.
import {withSolarMode} from './adapter.mjs';
import {calculateYear as low} from './clones/methods/diyanet/implementation/low-latitude/model.mjs';
import {calculateYear as south} from './clones/methods/diyanet/implementation/south/model.mjs';
import {calculateMissingWindowCalendar as north} from './clones/methods/diyanet/implementation/missing-window/model.mjs';
export const EVENTS = Object.freeze(['fajr','sunrise','dhuhr','asr','maghrib','isha']);
export const ADJUSTMENTS = Object.freeze([0,-7,5,4,7,0]);
export function calculateCalendar(input, solarModel) {
  return withSolarMode(solarModel, () => {
    const route = input.latitude < 0 ? 'south' : input.latitude < 44.5 ? 'low' : 'north';
    const annual = route === 'north' ? north(input)
      : route === 'low' ? low(input) : south({...input,variant:'usno-daily-utc0'});
    // Original result metadata is retained privately for audit by the driver.
    // Only the following experiment-level identity is authoritative here.
    return {route, solarModel, official:false, notificationEligible:false,
      timeConvention: solarModel === 'spa-utc00'
        ? {sample:'existing solar carrier UTC00',ut1MinusUtcSeconds:0,deltaTSeconds:69.184}
        : {sample:'existing solar carrier UTC00',recipe:'unchanged USNO approximation'},
      annual};
  });
}
