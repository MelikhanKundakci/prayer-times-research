import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {methodIds} from '../methods/index.mjs';
import {verifiedBundle} from '../core/timezones/bundle.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const sourceMap = JSON.parse(read('provenance/source-map.json'));
for (const file of sourceMap.files) {
  const digest = createHash('sha256').update(fs.readFileSync(path.join(root, file.destination))).digest('hex');
  assert.equal(digest, file.destinationSha256, `Extracted source changed: ${file.destination}. Document and review the change before updating provenance.`);
}
verifiedBundle();
for (const family of methodIds) {
  for (const file of ['README.md', 'RULE-EVIDENCE.md', 'index.mjs', 'validation.json', 'examples/input.json', 'examples/output.json']) {
    assert.ok(fs.existsSync(path.join(root, 'methods', family, file)), `Missing method artifact: ${family}/${file}`);
  }
  const validation = JSON.parse(read(`methods/${family}/validation.json`));
  assert.equal(validation.methodId, family);
  for (const study of validation.studies) {
    const {expectedSlots, comparedSlots, uncomparedSlots, exactCount, withinOneMinuteCount} = study;
    assert.ok([expectedSlots, comparedSlots, uncomparedSlots, exactCount, withinOneMinuteCount].every(n => Number.isInteger(n) && n >= 0), `Invalid study counts: ${family}/${study.id}`);
    assert.equal(expectedSlots, comparedSlots + uncomparedSlots);
    assert.ok(exactCount <= withinOneMinuteCount && withinOneMinuteCount <= comparedSlots);
    if (comparedSlots) {
      for (const [key, expected] of Object.entries({exactPercent: 100 * exactCount / comparedSlots,
        nonExactRatePercent: 100 * (comparedSlots - exactCount) / comparedSlots,
        withinOneMinutePercent: 100 * withinOneMinuteCount / comparedSlots,
        overOneMinuteRatePercent: 100 * (comparedSlots - withinOneMinuteCount) / comparedSlots})) {
        assert.ok(Math.abs(validation.studies.find(x => x.id === study.id)[key] - expected) < 0.0001, `Inconsistent ${key}: ${family}/${study.id}`);
      }
    }
  }
}
let linkCount = 0;
function walk(directory) {
  return fs.readdirSync(directory, {withFileTypes: true}).flatMap(entry => {
    if (['node_modules', '.git'].includes(entry.name)) return [];
    const name = path.join(directory, entry.name);
    assert.ok(!entry.isSymbolicLink(), `Unexpected symlink: ${name}`);
    return entry.isDirectory() ? walk(name) : [name];
  });
}
for (const file of walk(root)) {
  if (!file.endsWith('.md')) continue;
  const content = fs.readFileSync(file, 'utf8');
  for (const match of content.matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    const target = match[1];
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    const relative = decodeURIComponent(target.split('#')[0]);
    if (!relative) continue;
    const resolved = path.resolve(path.dirname(file), relative);
    assert.ok(resolved.startsWith(root), `Link leaves repository: ${target}`);
    assert.ok(fs.existsSync(resolved), `Broken local link in ${path.relative(root, file)}: ${target}`);
    linkCount++;
  }
}
console.log(`Verified ${sourceMap.files.length} extracted assets, ${methodIds.length} complete method folders, pinned timezone resources, and ${linkCount} local documentation links.`);
