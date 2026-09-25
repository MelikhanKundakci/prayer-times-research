import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root = new URL('../', import.meta.url);
const file = relative => fileURLToPath(new URL(relative, root));
const read = relative => JSON.parse(readFileSync(file(relative), 'utf8'));

test('Every Diyanet variant computes offline without reference tables or external libraries', () => {
  const cases = read('tests/cases.json').cases.filter(c => c.family === 'diyanet');
  const snapshots = read('tests/model-snapshots.json').cases;
  assert.equal(cases.length, 5);
  const expected = cases.map(c => {
    const snapshot = snapshots.find(s => s.id === c.id);
    assert.ok(snapshot);
    return {id:c.id, fields:snapshot.projectedFields, sha256:snapshot.sha256};
  });
  const permitted = [
    'package.json', 'methods/diyanet/index.mjs', 'methods/diyanet/implementation/',
    'core/input.mjs', 'core/astronomy/', 'core/timezones/', 'scripts/output.mjs',
  ];
  const denied = ['tests/model-snapshots.json', 'methods/diyanet/examples/output.json', 'node_modules/adhan/package.json'];
  const program = `
    import assert from 'node:assert/strict';
    import {readFileSync} from 'node:fs';
    import {createHash} from 'node:crypto';
    import {get} from 'node:https';
    import {calculate} from ${JSON.stringify(new URL('methods/diyanet/index.mjs', root).href)};
    import {renderedProjection} from ${JSON.stringify(new URL('scripts/output.mjs', root).href)};
    assert.equal(process.versions.tz, '2026d');
    assert.equal(process.permission.has('net'), false);
    // The attempt must be rejected by Node before opening a socket.
    await assert.rejects(new Promise((resolve, reject) => {
      get('https://example.invalid/', resolve).on('error', reject);
    }), {code:'ERR_ACCESS_DENIED'});
    for (const path of ${JSON.stringify(denied.map(file))}) {
      assert.equal(process.permission.has('fs.read', path), false);
      assert.throws(() => readFileSync(path), {code:'ERR_ACCESS_DENIED'});
    }
    const result = ${JSON.stringify(cases)}.map(c => {
      const projection = renderedProjection(calculate(c.input));
      return {id:c.id, fields:projection.length,
        sha256:createHash('sha256').update(JSON.stringify(projection)).digest('hex')};
    });
    process.stdout.write(JSON.stringify(result));
  `;
  for (const hostTimeZone of ['UTC', 'Pacific/Honolulu']) {
    const child = spawnSync(process.execPath, ['--permission',
      ...permitted.map(p => `--allow-fs-read=${file(p)}`), '--input-type=module', '--eval', program], {
      cwd:file('.'), env:{...process.env, TZ:hostTimeZone}, encoding:'utf8', timeout:30000,
    });
    assert.ifError(child.error);
    assert.equal(child.status, 0, child.stderr);
    assert.deepEqual(JSON.parse(child.stdout), expected, hostTimeZone);
  }
});
