import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyObserverSPA} from '../core/local/verification/observer-verify.mjs';

test('zero-elevation topocentric SPA events match independent pinned pvlib roots',()=>{
  const result=verifyObserverSPA();
  assert.equal(result.result,'PASS');
  assert.equal(result.cases,371);
  assert.equal(result.calculatedCycles,362);
  assert.equal(result.ownershipRejections,9);
  assert.equal(result.eventTimestampComparisons,1999);
  assert.ok(result.maxReferenceDifferenceSeconds<.01);
  assert.equal(result.geocentric.onlyTopocentricAvailable,3);
  assert.equal(result.geocentric.onlyGeocentricAvailable,0);
  assert.equal(result.diagnostics.bodo.events.dhuhr.differenceSeconds,0);
});
