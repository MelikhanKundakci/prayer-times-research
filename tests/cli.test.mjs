import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {methodIds} from '../methods/index.mjs';

const runner = fileURLToPath(new URL('../scripts/run.mjs', import.meta.url));
const run = args => spawnSync(process.execPath, [runner, ...args], {encoding: 'utf8', timeout: 30000});
test('CLI lists exactly the registered methods', () => {
  const result = run(['--list']);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.stdout.trim().split('\n'), methodIds);
});
test('CLI previews annual output without calling it a complete year', () => {
  const result = run(['diyanet', '--example']);
  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.preview, true);
  assert.equal(output.totalDays, 365);
  assert.equal(output.days.length, 3);
});
test('CLI retains full year only when requested', () => {
  const result = run(['moonsighting-committee', '--example', '--full']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).length, 365);
});
test('CLI rejects missing and conflicting input choices', () => {
  for (const args of [['diyanet'], ['diyanet', '--example', '--input', 'x'], ['diyanet', '--input'], ['diyanet', '--example', '--typo']]) {
    const result = run(args);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Usage:/);
  }
});
