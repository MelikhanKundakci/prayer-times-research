// Synchronous research context; state cannot escape the declared calculation.
import {solarCoordinatesUSNO as usno} from '../../../../core/astronomy/solar-usno-v2.mjs';
import {solarCoordinates as spa} from './astronomy/spa.mjs';
let mode = null;
export function withSolarMode(selected, calculate) {
  if (!['baseline', 'spa-utc00'].includes(selected)) throw new RangeError('Declared solar mode required');
  if (mode !== null) throw new Error('Nested solar context is not allowed');
  mode = selected;
  try {
    const result = calculate();
    if (result?.then) throw new TypeError('Solar context must be synchronous');
    return result;
  } finally { mode = null; }
}
export function solarCoordinatesUSNO(jd) {
  if (mode === null) throw new Error('Explicit solar context required');
  return coordinatesFor(mode, jd);
}
export function coordinatesFor(selected, jd) {
  if (selected === 'baseline') return usno(jd);
  if (selected !== 'spa-utc00') throw new RangeError('Declared solar mode required');
  const value = spa(jd, {deltaTSeconds: 69.184});
  return {declination: value.declination,
    equationOfTimeHours: value.equationOfTime / 60,
    rightAscension: value.rightAscension / 15};
}
