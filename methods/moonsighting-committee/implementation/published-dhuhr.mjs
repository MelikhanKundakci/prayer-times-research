// Own opt-in reconstruction, September 2026. Only the Dhuhr margin follows
// https://www.moonsighting.com/how-we.html exactly; this is not a complete
// implementation of every rule on that page. Preserve the V4.2 default.
import {calculateGeometry, geometryDay} from './moonsighting-usno-v4.1.mjs';
import {plainRecord} from '../../../core/input.mjs';

export function calculatePublishedDhuhr(options) {
  const input = plainRecord(options);
  if (Object.hasOwn(input, 'dhuhrRounding')) {
    throw new TypeError('Published-margin variant fixes the research rounding convention');
  }
  const rows = calculateGeometry({...input, dhuhrRounding: 'nearest'});
  return rows.map(row => {
    const solar = geometryDay(Date.parse(row.solarCalculationDate + 'T00:00:00Z'), input.latitude, input.longitude);
    return {...row, dhuhrCalculation: {
      adjustedEpochMs: solar.transit + 300000,
      adjustmentSeconds: 300,
      adjustmentEvidence: 'MSC published guidance: five minutes after solar transit',
      minuteRounding: 'nearest absolute UTC minute; research convention, not confirmed by the guidance',
      precision: 'Unrounded model value, not a claim of one-second observational accuracy',
      notificationEligible: false,
    }};
  });
}
