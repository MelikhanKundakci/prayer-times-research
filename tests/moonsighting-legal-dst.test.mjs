import test from 'node:test';
import assert from 'node:assert/strict';
import {calculate} from '../methods/moonsighting-committee/index.mjs';

// Legal transition days, not the Saturdays on which an archived publisher
// table changes its displayed offset:
// NSW: https://www.nsw.gov.au/about-nsw/daylight-saving/
// NZ: https://www.legislation.govt.nz/regulation/public/2007/0185/latest/whole.html
const cases = [
  {zone: 'Australia/Sydney', fixed: 'Etc/GMT-10', latitude: -33.8688, longitude: 151.2093, year: 2027,
    dates: [['2027-04-03', 60], ['2027-04-04', 0], ['2027-10-02', 0], ['2027-10-03', 60]]},
  {zone: 'Pacific/Auckland', fixed: 'Etc/GMT-12', latitude: -41.2865, longitude: 174.7767, year: 2028,
    dates: [['2028-04-01', 60], ['2028-04-02', 0], ['2028-09-23', 0], ['2028-09-24', 60]]},
];

function minutes(clock) {
  const [hour, minute] = clock.split(':').map(Number);
  return 60 * hour + minute;
}

for (const item of cases) {
  test(`${item.zone}: all seven UTC events retain legal DST offsets`, () => {
    const input = {year: item.year, latitude: item.latitude, longitude: item.longitude};
    const zoned = calculate({...input, timeZone: item.zone});
    const fixed = calculate({...input, timeZone: item.fixed});
    for (const [date, expectedOffsetMinutes] of item.dates) {
      const actual = zoned.find(row => row.date === date);
      const control = fixed.find(row => row.date === date);
      assert.ok(actual && control, date);
      for (const field of Object.keys(actual.times)) {
        assert.equal(actual.instants[field], control.instants[field], `${date} ${field}: UTC event`);
        assert.equal(actual.eventDates[field], date, `${date} ${field}: civil event date`);
        assert.equal(control.eventDates[field], date, `${date} ${field}: fixed-zone date`);
        assert.equal(minutes(actual.times[field]) - minutes(control.times[field]), expectedOffsetMinutes,
          `${date} ${field}: local offset`);
      }
    }
  });
}
