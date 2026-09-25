import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { fitPointConsistency } from '../methods/diyanet/diagnostics/point-consistency.mjs';
import { solarCoordinatesUSNO } from '../core/astronomy/solar-usno-v2.mjs';

const cli = fileURLToPath(new URL('../methods/diyanet/diagnostics/cli.mjs', import.meta.url));
const generator = fileURLToPath(new URL('../methods/diyanet/diagnostics/synthetic-example.mjs', import.meta.url));
const exampleRun = spawnSync(process.execPath, [generator], { encoding: 'utf8' });
assert.equal(exampleRun.status, 0, exampleRun.stderr);
const example = JSON.parse(exampleRun.stdout);
const input = () => ({ ...structuredClone(example), gridSegments: 1000 });
const freeze = value => { if (value && typeof value === 'object') { for (const v of Object.values(value)) freeze(v); Object.freeze(value); } return value; };

test('Offline point diagnostic preserves immutable inputs and every synthetic observation', () => {
  const supplied = freeze(input()), before = JSON.stringify(supplied), result = fitPointConsistency(supplied);
  assert.equal(JSON.stringify(supplied), before);
  assert.equal(result.status, 'exact-feasible-point-found');
  assert.equal(result.agreementOnSuppliedData.exact, 12);
  assert.equal(result.residuals.length, supplied.observations.length);
  for (const [i, r] of result.residuals.entries()) {
    assert.equal(r.index, i); assert.equal(r.referenceUtc, supplied.observations[i].utc);
    assert.equal(r.event, supplied.observations[i].event); assert.equal(r.differenceMinutes, 0);
  }
  assert.equal(result.official, false); assert.equal(result.pointIsInstitutionalCoordinate, false);
  assert.equal(result.eligibleForAutomaticNotifications, false);
  assert.equal(result.minimax.lowerBoundSeconds, 0);
  assert.equal(result.minimax.selectedPointUpperBoundSeconds, 0);
  assert.equal(result.geometryChecks.noHorizonClampInBox, true);
});

test('Contradictory observations remain visible and yield a positive bounded minimax gap', () => {
  const supplied = input(), index = supplied.observations.findIndex(r => r.event === 'maghrib');
  supplied.observations[index].utc = new Date(Date.parse(supplied.observations[index].utc) + 10 * 60000).toISOString();
  const r = fitPointConsistency(supplied);
  assert.equal(r.status, 'exact-fit-infeasible-in-box');
  assert.equal(r.residuals.length, 12); assert.equal(r.residuals[index].referenceUtc, supplied.observations[index].utc);
  assert(r.minimax.lowerBoundSeconds > 0);
  assert(r.minimax.selectedPointUpperBoundSeconds >= r.minimax.lowerBoundSeconds);
  assert(r.minimax.selectedPointUpperBoundSeconds - r.minimax.lowerBoundSeconds <= r.minimax.gridErrorBoundSeconds + 1e-6);
  const actualSlack = Math.max(0, ...r.residuals.map(x => Math.abs(x.rawMinusReferenceMinuteCenterSeconds) - 30));
  assert(Math.abs(actualSlack - r.minimax.selectedPointUpperBoundSeconds) < 1e-7);
  assert(r.residuals.some(x => x.outsideOriginalHalfOpenCell));
});

test('Exact feasibility distinguishes a closed longitude singleton from an open contact', () => {
  const date = '2026-01-15', epoch = Date.parse(`${date}T00:00:00Z`);
  const s = solarCoordinatesUSNO(epoch / 86400000 + 2440587.5);
  const base = 43200 - s.equationOfTimeHours * 3600 + 300;
  const lower = (base - 43200 - 30) / 240, upper = (base - 43200 + 30) / 240;
  const common = { timeZone: 'Europe/Berlin', latitudeBounds: [52.5, 52.6], gridSegments: 100,
    observations: [{ date, event: 'dhuhr', utc: `${date}T12:00:00Z` }] };
  const closed = fitPointConsistency({ ...common, longitudeBounds: [upper, upper + .1] });
  assert.equal(closed.status, 'exact-feasible-point-found');
  assert.equal(closed.selectedDiagnosticPoint.longitude, upper);
  assert.equal(closed.exactFeasibility.selectedLatitudeLongitudeInterval.lowerClosed, true);
  assert.equal(closed.agreementOnSuppliedData.exact, 1);
  const open = fitPointConsistency({ ...common, longitudeBounds: [lower - .1, lower] });
  assert.equal(open.status, 'exact-fit-infeasible-in-box');
  assert.equal(open.minimax.lowerBoundSeconds, 0, 'Zero closed slack does not establish half-open feasibility');
  assert.equal(open.exactFeasibility.globalInfeasibilityBasis, 'latitude-independent-half-open-constraints');
  assert.equal(open.exactFeasibility.selectedLatitudeLongitudeInterval.empty, true);
  assert.equal(open.agreementOnSuppliedData.exact, 0);
});

test('Unsupported data and geometry cannot silently select another calculation policy', () => {
  const changes = [
    x => { x.latitudeBounds = [60, 60.2]; }, x => { x.latitudeBounds = [44, 44.4]; },
    x => { x.latitudeBounds = [52, 53]; }, x => { x.longitudeBounds = [13.4, 13.4]; },
    x => { x.longitudeBounds = [179.9, 180.1]; }, x => { x.latitudeBounds[0] = NaN; },
    x => { x.gridSegments = 0; }, x => { x.gridSegments = 50001; }, x => { x.gridSegments = null; },
    x => { x.gridSegments = undefined; }, x => { x.timeZone = 'Invalid/Zone'; },
    x => { x.observations = []; }, x => { x.observations.push({ ...x.observations[0] }); },
    x => { x.observations[0].date = '2026-02-30'; }, x => { x.observations[0].event = 'fajr'; },
    x => { x.observations[0].utc = '2026-01-15T07:00:30Z'; },
    x => { x.observations[0].utc = '2026-01-15T07:00:00+00:00'; },
    x => { x.observations[0].utc = '2026-01-16T07:00:00Z'; }, x => { x.offsetSeconds = 1; },
    x => { x.observations[0].offset = 1; }, x => { delete x.observations[0]; },
    x => { x.latitudeBounds = [59.4, 59.8]; x.observations = [{ date: '2026-06-21', event: 'dhuhr', utc: '2026-06-21T11:00:00Z' }]; },
    x => { x.longitudeBounds = [179.5, 180]; x.timeZone = 'America/Adak'; x.observations = [{ date: '2026-01-15', event: 'dhuhr', utc: '2026-01-15T22:00:00Z' }]; }
  ];
  for (const change of changes) { const x = input(); change(x); assert.throws(() => fitPointConsistency(x)); }
});

test('Getters, inherited records and extra hidden/symbol fields are rejected without execution', () => {
  let called = false;
  const x = input(); Object.defineProperty(x.observations[0], 'event', { enumerable: true, get() { called = true; return 'sunrise'; } });
  assert.throws(() => fitPointConsistency(x), /own data/); assert.equal(called, false);
  const y = input(); Object.defineProperty(y.latitudeBounds, '0', { enumerable: true, get() { called = true; return 52; } });
  assert.throws(() => fitPointConsistency(y), /own data/); assert.equal(called, false);
  assert.throws(() => fitPointConsistency(Object.create(input())), /plain object/);
  const hidden = input(); Object.defineProperty(hidden, 'offset', { value: 1 });
  assert.throws(() => fitPointConsistency(hidden), /own data/);
  const symbol = input(); symbol[Symbol('offset')] = 1;
  assert.throws(() => fitPointConsistency(symbol), /own data/);
});

test('CLI reads stdin, produces only diagnostic JSON and is independent of host timezone', () => {
  const text = JSON.stringify(input());
  const runs = ['Pacific/Kiritimati', 'America/Los_Angeles'].map(TZ => spawnSync(process.execPath, [cli, '-'], { input: text, encoding: 'utf8', env: { ...process.env, TZ } }));
  for (const r of runs) { assert.equal(r.status, 0, r.stderr); assert.equal(r.stderr, ''); }
  assert.deepEqual(JSON.parse(runs[0].stdout), JSON.parse(runs[1].stdout));
  const invalid = spawnSync(process.execPath, [cli, '-'], { input: '{"bad":true}', encoding: 'utf8' });
  assert.equal(invalid.status, 1); assert.equal(invalid.stdout, ''); assert.match(invalid.stderr, /Point consistency diagnostic/);
});
