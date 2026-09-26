import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyLocalProfiles} from '../core/local/verification/profiles-verify.mjs';
import {selectRuleInstant} from '../core/local/selection.mjs';

test('new local profiles and factor-two geometry match independently frozen Python roots and minute rules',()=>{
  const result=verifyLocalProfiles();
  assert.equal(result.result,'PASS');
  assert.equal(result.cases,284);
  assert.equal(result.baselinePythonParityCases,139);
  assert.equal(result.physicalEventComparisons,1558);
  assert.equal(result.unavailablePhysicalEvents,92);
  assert.equal(result.expectedOwnershipRejections,9);
  assert.equal(result.selectedEventComparisons,1430);
  assert.equal(result.kemenagMinuteComparisons,240);
  assert.equal(result.minuteArithmeticComparisons,228);
  assert.equal(result.fixtureSha256,'6ee2c65e77a1497713cfa178c6fc91a068d972f8adfe5c569ffca13514c6b250');
  assert.ok(result.maximumRootDifferenceSeconds<=0.1);
  assert.ok(result.maximumSelectedDifferenceSeconds<=0.1);
});

test('generic selection quantizes before a synthetic fractional margin',()=>{
  // Institutional margins here are integral minutes and commute with rounding.
  // These synthetic inputs distinguish API order without inventing a profile.
  const upward=selectRuleInstant({epochMilliseconds:1000,rounding:'ceil-minute',marginMinutes:.5});
  assert.equal(upward.roundedBasisEpochMilliseconds,60000);
  assert.equal(upward.selectedEpochMilliseconds,90000);
  assert.notEqual(upward.selectedEpochMilliseconds,Math.ceil((1000+30000)/60000)*60000);
  const downward=selectRuleInstant({epochMilliseconds:59000,rounding:'floor-minute',marginMinutes:-.5});
  assert.equal(downward.roundedBasisEpochMilliseconds,0);
  assert.equal(downward.selectedEpochMilliseconds,-30000);
  assert.notEqual(downward.selectedEpochMilliseconds,Math.floor((59000-30000)/60000)*60000);
});
