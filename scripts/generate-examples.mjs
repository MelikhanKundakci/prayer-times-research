import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {methodIds, loadMethod} from '../methods/index.mjs';
import {preview, renderedProjection} from './output.mjs';

if (process.versions.tz !== '2026d') throw new Error('Use the pinned timezone launcher');
const root = new URL('../', import.meta.url);
const write = (path, value) => fs.writeFileSync(new URL(path, root), JSON.stringify(value, null, 2) + '\n');
for (const family of methodIds) {
  const input = JSON.parse(fs.readFileSync(new URL(`methods/${family}/examples/input.json`, root), 'utf8'));
  const result = (await loadMethod(family)).calculate(input);
  write(`methods/${family}/examples/output.json`, {
    evidenceType: 'generated-model-example-not-institutional-reference',
    runtime: {node: process.versions.node, icu: process.versions.icu, tz: process.versions.tz},
    input,
    output: preview(result),
  });
}
const cases = JSON.parse(fs.readFileSync(new URL('tests/cases.json', root), 'utf8')).cases;
const snapshots = [];
for (const item of cases) {
  const projection = renderedProjection((await loadMethod(item.family)).calculate(item.input));
  snapshots.push({id: item.id, projectedFields: projection.length,
    sha256: createHash('sha256').update(JSON.stringify(projection)).digest('hex')});
}
write('tests/model-snapshots.json', {
  evidenceType: 'generated-model-regression-not-institutional-validation',
  runtime: {node: process.versions.node, icu: process.versions.icu, tz: process.versions.tz},
  recipe: 'SHA256(JSON.stringify(renderedProjection(result))); see scripts/output.mjs',
  cases: snapshots,
});
console.log(`Generated ${methodIds.length} examples and ${snapshots.length} model regression snapshots.`);
