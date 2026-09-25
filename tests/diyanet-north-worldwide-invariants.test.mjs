import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {calculateNorthernCivilRow} from '../methods/diyanet/index.mjs';

const cases = JSON.parse(readFileSync(new URL('./diyanet-north-invariant-inputs.json', import.meta.url)));
const events = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

// Synthetic longitude/timezone combinations test software representation only.
// They do not establish institutional support or a real city's timezone.
for (const input of cases) test(`Civil-row representation: ${input.name}`, () => {
  const {year, latitude, longitude, timeZone} = input;
  const options = {year, latitude, longitude, timeZone};
  if (input.expect === 'unsupported') {
    assert.throws(() => calculateNorthernCivilRow(options), {name: 'RangeError'});
    return;
  }
  const result = calculateNorthernCivilRow(options);
  const formatter = new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'});
  const beginning = Date.UTC(year, 0, 1), end = Date.UTC(year+1, 0, 1);
  assert.equal(result.days.length, (end-beginning)/86400000);
  assert.equal(result.experiment.supported, true);
  let inspected = 0;
  for (let i=0; i<result.days.length; i++) {
    const day = result.days[i];
    assert.equal(day.date, new Date(beginning + i*86400000).toISOString().slice(0, 10));
    assert.deepEqual(Object.keys(day.events), events);
    for (const name of events) {
      const event = day.events[name];
      assert.notEqual(event.status, 'unavailable', `${day.date}/${name}`);
      assert.ok(Number.isFinite(event.rawEpoch));
      const instant = Date.parse(event.utc);
      assert.ok(Number.isFinite(instant));
      assert.equal(instant, Math.floor(event.rawEpoch / 60000 + .5) * 60000);
      assert.equal(Date.parse(event.iso), instant);
      const p = Object.fromEntries(formatter.formatToParts(instant).map(v => [v.type, v.value]));
      assert.equal(event.localDate, `${p.year}-${p.month}-${p.day}`);
      assert.equal(event.time, `${p.hour}:${p.minute}`);
      assert.equal(event.eligibleForAutomaticNotifications, false);
      inspected++;
    }
  }
  assert.equal(inspected, result.days.length * events.length);
});

for (const year of [2027, 2028]) test(`Civil-row 64.7-degree aliases preserve every instant in ${year}`, () => {
  const options = {year, latitude: 64.7, longitude: -180, timeZone: 'Asia/Anadyr'};
  const west = calculateNorthernCivilRow(options);
  const east = calculateNorthernCivilRow({...options, longitude: 180});
  assert.equal(west.days.length, year === 2028 ? 366 : 365);
  assert.equal(east.days.length, west.days.length);
  for (let i=0; i<west.days.length; i++) for (const name of events) {
    const a = west.days[i].events[name], b = east.days[i].events[name];
    assert.ok(Number.isFinite(a.rawEpoch) && Number.isFinite(b.rawEpoch));
    assert.equal(a.rawEpoch, b.rawEpoch);
    for (const key of ['utc', 'iso', 'localDate', 'time']) assert.equal(a[key], b[key]);
  }
});
