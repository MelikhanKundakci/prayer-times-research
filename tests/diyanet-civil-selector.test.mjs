import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculate, calculateLowLatitudeCivilRow, calculateSouthCivilRow,
} from '../methods/diyanet/index.mjs';

test('Diyanet uniform entry exposes both opt-in civil-row variants without changing their inputs', () => {
  const low = {date: '2027-01-01', latitude: 35.68, longitude: 139.69, timeZone: 'Asia/Tokyo'};
  const south = {date: '2027-01-01', latitude: -21.1345386521, longitude: -175.223892147, timeZone: 'Pacific/Tongatapu'};
  assert.deepEqual(calculate({variant: 'low-latitude-civil-row', ...low}), calculateLowLatitudeCivilRow(low));
  assert.deepEqual(calculate({variant: 'south-civil-row', ...south}), calculateSouthCivilRow(south));
  assert.equal(calculate({variant: 'south-civil-row', ...south}).notificationEligible, false);
});
