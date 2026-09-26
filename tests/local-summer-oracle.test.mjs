import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { verifyLocalSummer } from '../core/local/verification/summer-verify.mjs';

test('optional local summer profile matches the independently frozen annual oracle and preserves chronology', () => {
  const file = new URL('../core/local/verification/summer-fixtures.json', import.meta.url);
  const before = createHash('sha256').update(readFileSync(file)).digest('hex');
  const report = verifyLocalSummer();
  assert.equal(report.result, 'PASS');
  assert.equal(report.cases, 12);
  assert.equal(report.availableContexts, 11);
  assert.equal(report.blockedContexts, 1);
  assert.equal(report.ownedDays, 4381);
  assert.equal(report.selectedTimestampComparisons, 8032);
  assert.equal(report.candidateTimestampComparisons, 8032);
  assert.equal(report.blockedEventComparisons, 730);
  assert.equal(report.blendArithmeticChecks, 14);
  assert.equal(report.paddingChecks, 44);
  assert.equal(report.gapNeighborChecks, 22);
  assert.equal(report.nightOrderChecks, 4027);
  assert.equal(report.sixEventOrderChecks, 4016);
  assert.ok(report.maximumSelectedDifferenceSeconds <= .1);
  assert.ok(report.maximumCandidateDifferenceSeconds <= .1);
  assert.ok(report.maximumWeightDifference <= 1e-7);
  assert.equal(report.fixtureSha256, before);
  assert.equal(createHash('sha256').update(readFileSync(file)).digest('hex'), before);
});
