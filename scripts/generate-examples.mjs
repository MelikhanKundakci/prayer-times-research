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
const rosevilleInput = JSON.parse(fs.readFileSync(new URL('methods/fcna/examples/roseville-input.json', root), 'utf8'));
write('methods/fcna/examples/roseville-output.json', {
  evidenceType: 'generated-model-example-not-institutional-reference',
  runtime: {node: process.versions.node, icu: process.versions.icu, tz: process.versions.tz},
  input: rosevilleInput,
  output: (await loadMethod('fcna')).calculate(rosevilleInput),
});
const rayInput = JSON.parse(fs.readFileSync(new URL('methods/uae-awqaf/examples/own-ray-input.json', root), 'utf8'));
write('methods/uae-awqaf/examples/own-ray-output.json', {
  evidenceType: 'generated-model-example-not-institutional-reference',
  runtime: {node: process.versions.node, icu: process.versions.icu, tz: process.versions.tz},
  input: rayInput,
  output: (await loadMethod('uae-awqaf')).calculate(rayInput),
});
const arcInput = JSON.parse(fs.readFileSync(new URL('methods/shia-angles/examples/arc-compatibility-input.json', root), 'utf8'));
write('methods/shia-angles/examples/arc-compatibility-output.json', {
  evidenceType: 'generated-model-example-not-institutional-reference',
  runtime: {node: process.versions.node, icu: process.versions.icu, tz: process.versions.tz},
  input: arcInput,
  output: (await loadMethod('shia-angles')).calculate(arcInput),
});
const bayynatInput = JSON.parse(fs.readFileSync(new URL('methods/bayynat/examples/nearest-input.json', root), 'utf8'));
write('methods/bayynat/examples/nearest-output.json', {
  evidenceType: 'generated-model-example-not-institutional-reference',
  runtime: {node: process.versions.node, icu: process.versions.icu, tz: process.versions.tz},
  input: bayynatInput,
  output: (await loadMethod('bayynat')).calculate(bayynatInput),
});
const continuousBayynatInput = JSON.parse(fs.readFileSync(new URL('methods/bayynat/examples/continuous-input.json', root), 'utf8'));
write('methods/bayynat/examples/continuous-output.json', {
  evidenceType: 'generated-model-example-not-institutional-reference',
  runtime: {node: process.versions.node, icu: process.versions.icu, tz: process.versions.tz},
  input: continuousBayynatInput,
  output: (await loadMethod('bayynat')).calculate(continuousBayynatInput),
});
const cases = JSON.parse(fs.readFileSync(new URL('tests/cases.json', root), 'utf8')).cases;
for (const [family, name] of [['banuri-town', 'zawal-plus-five'], ['moonsighting-committee', 'published-dhuhr']]) {
  const input = JSON.parse(fs.readFileSync(new URL(`methods/${family}/examples/${name}-input.json`, root), 'utf8'));
  write(`methods/${family}/examples/${name}-output.json`, {
    evidenceType: 'generated-model-example-not-institutional-reference',
    runtime: {node: process.versions.node, icu: process.versions.icu, tz: process.versions.tz},
    input,
    output: preview((await loadMethod(family)).calculate(input)),
  });
}
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
