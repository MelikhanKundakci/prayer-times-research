// Own offline audit. Takes an existing local archive, never fetches references.
// The five manifest names are the historical provenance identifiers described
// in validation.json. No third-party calendar content is written in the report.
import {readFileSync, writeFileSync} from 'node:fs';
import {resolve, join} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {calculate} from '../index.mjs';

const [archive, output] = process.argv.slice(2);
if (!archive || !output) throw new Error('Usage: node compare-published-dhuhr.mjs ARCHIVE_DIRECTORY OUTPUT_JSON');
if (process.versions.tz !== '2026d') throw new Error('Use the repository timezone launcher (2026d)');
const fields = ['fajr', 'sunrise', 'dhuhr', 'asr_standard', 'asr_hanafi', 'maghrib', 'isha'];
const minutes = clock => { const [h, m] = clock.split(':').map(Number); return h * 60 + m; };
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const manifests = ['moonsighting-usno-manifest.json', 'moonsighting-geometry-manifest.json',
  'moonsighting-manifest.json', 'moonsighting-v4.2-manifest.json', 'moonsighting-stack-manifest.json'];
const modelFiles = ['methods/moonsighting-committee/index.mjs',
  'methods/moonsighting-committee/implementation/published-dhuhr.mjs',
  'methods/moonsighting-committee/implementation/moonsighting-usno-v4.2.mjs',
  'methods/moonsighting-committee/implementation/moonsighting-usno-v4.1.mjs',
  'methods/moonsighting-committee/implementation/msc-seasonal.mjs',
  'core/astronomy/solar-usno-v2.mjs'];
const modelHashes = Object.fromEntries(modelFiles.map(file => [file,
  sha256(readFileSync(new URL(file, new URL('../../../', import.meta.url))))]));
const parse = (html, year) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const rows = [];
  for (const match of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...match[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)]
      .map(m => m[1].replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim());
    if (!/^[A-Z][a-z]{2} \d{2} [A-Z][a-z]{2}$/.test(cells[0] || '')) continue;
    assert.equal(cells.length, 8);
    const [month, day] = cells[0].split(' ');
    assert.ok(months.includes(month));
    const date = `${year}-${String(months.indexOf(month) + 1).padStart(2, '0')}-${day}`;
    const values = cells.slice(1).map(clock => {
      assert.ok(clock === '-----' || /^([01]\d|2[0-3]):[0-5]\d$/.test(clock));
      return clock === '-----' ? null : clock;
    });
    rows.push({date, times: Object.fromEntries(fields.map((event, i) => [event, values[i]]))});
  }
  const expected = (Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / 86400000;
  assert.equal(rows.length, expected);
  rows.forEach((row, i) => assert.equal(row.date, new Date(Date.UTC(year, 0, i + 1)).toISOString().slice(0, 10)));
  return rows;
};
const empty = () => ({expected: 0, compared: 0, exact: 0, withinOne: 0, sourceMissing: 0,
  modelMissing: 0, bothMissing: 0, signedMinuteHistogram: {}, maxAbsoluteMinutes: 0});
const add = (stats, model, source) => {
  stats.expected++;
  if (model === null) stats.modelMissing++;
  if (source === null) stats.sourceMissing++;
  if (model === null && source === null) stats.bothMissing++;
  if (model === null || source === null) return;
  const delta = minutes(model) - minutes(source);
  stats.compared++;
  stats.exact += Number(delta === 0);
  stats.withinOne += Number(Math.abs(delta) <= 1);
  stats.maxAbsoluteMinutes = Math.max(stats.maxAbsoluteMinutes, Math.abs(delta));
  stats.signedMinuteHistogram[delta] = (stats.signedMinuteHistogram[delta] || 0) + 1;
};
const total = {baseline: empty(), candidate: empty(), exactGains: 0, exactLosses: 0, changedDhuhrMinutes: 0};
const cases = [], excluded = [], seen = new Set(), manifestHashes = {};
for (const filename of manifests) {
  const rawManifest = readFileSync(join(resolve(archive), filename));
  manifestHashes[filename] = sha256(rawManifest);
  for (const source of JSON.parse(rawManifest)) {
    if (source.error) { excluded.push({manifest: filename, city: source.city, reason: source.error}); continue; }
    assert.ok(!seen.has(source.file), `Duplicate archive source: ${source.file}`);
    seen.add(source.file);
    const raw = readFileSync(join(resolve(archive), source.file));
    assert.equal(sha256(raw), source.sha256, source.file);
    const reference = parse(raw.toString(), source.options.year);
    const baseline = calculate(source.options);
    const candidate = calculate({...source.options, variant: 'published-dhuhr-five-minutes'});
    const byEvent = Object.fromEntries(fields.map(field => [field, {baseline: empty(), candidate: empty()}]));
    let exactGains = 0, exactLosses = 0, changedDhuhrMinutes = 0;
    reference.forEach((row, i) => {
      assert.equal(baseline[i].date, row.date);
      assert.equal(candidate[i].date, row.date);
      for (const field of fields) {
        const old = baseline[i].times[field], next = candidate[i].times[field], original = row.times[field];
        add(byEvent[field].baseline, old, original); add(byEvent[field].candidate, next, original);
        add(total.baseline, old, original); add(total.candidate, next, original);
        if (field !== 'dhuhr') {
          assert.equal(next, old);
          assert.equal(candidate[i].instants[field], baseline[i].instants[field]);
          assert.equal(candidate[i].eventDates[field], baseline[i].eventDates[field]);
        } else {
          changedDhuhrMinutes += Number(old !== next);
          if (original !== null) {
            exactGains += Number(old !== original && next === original);
            exactLosses += Number(old === original && next !== original);
          }
        }
      }
    });
    total.exactGains += exactGains; total.exactLosses += exactLosses;
    total.changedDhuhrMinutes += changedDhuhrMinutes;
    cases.push({city: source.city, options: source.options, sourceUrl: source.url,
      sourceSha256: source.sha256, archiveManifest: filename, byEvent, exactGains, exactLosses, changedDhuhrMinutes});
  }
}
const report = {schemaVersion: 1, auditDate: '2026-09-25',
  exposure: 'Retrospective replay of previously archived comparisons; no new holdout or source retrieval',
  recipe: 'Dhuhr margin 300s, nearest UTC minute; baseline margin 298.8s. All other event formulas unchanged.',
  guidanceUrl: 'https://www.moonsighting.com/how-we.html',
  metric: 'Strict displayed HH:mm differences; missing values never exact; existing source date/DST disagreements retained',
  runtime: {node: process.version, icu: process.versions.icu, tzdb: process.versions.tz},
  modelHashes, evaluatorSha256: sha256(readFileSync(new URL(import.meta.url))), manifestHashes, total, cases, excluded};
writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({cases: cases.length, excluded, total}, null, 2));
