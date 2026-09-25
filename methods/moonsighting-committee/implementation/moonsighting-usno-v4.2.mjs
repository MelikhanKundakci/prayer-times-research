// Experimental Dhuhr precision hypothesis, inferred before fresh v4.2 holdouts.
// 0.083 decimal hours = 4.98 minutes; this is NOT a confirmed provider constant.
import { calculateGeometry as previous, geometryDay } from './moonsighting-usno-v4.1.mjs';
export { geometryDay };

export function calculateGeometry(options) {
  const rows = previous(options);
  const formatter = new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn', {
    timeZone: options.timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  });
  if (options.dhuhrRounding !== undefined) throw new Error('Version4.2 has a fixed Dhuhr rounding hypothesis');
  return rows.map(row => {
    const solar = geometryDay(Date.parse(row.solarCalculationDate + 'T00:00:00Z'), options.latitude, options.longitude);
    const rounded = Math.floor((solar.transit + 0.083 * 3600000 + 30000) / 60000) * 60000;
    const p = Object.fromEntries(formatter.formatToParts(rounded).filter(p => p.type !== 'literal').map(p => [p.type, p.value]));
    row.times.dhuhr = `${p.hour}:${p.minute}`;
    row.eventDates.dhuhr = `${p.year}-${p.month}-${p.day}`;
    row.instants.dhuhr = new Date(rounded).toISOString();
    row.qualityFlags = row.qualityFlags.filter(f => f.code !== 'before-adjusted-dhuhr');
    for (const field of ['asr_standard', 'asr_hanafi']) {
      if (row.eventStatus[field] === 'ordering-exception') row.eventStatus[field] = 'calculated';
      if (row.instants[field] !== null && row.instants[field] < row.instants.dhuhr) {
        row.qualityFlags.push({ event: field, code: 'before-adjusted-dhuhr' });
        if (row.eventStatus[field] === 'calculated') row.eventStatus[field] = 'ordering-exception';
      }
    }
    return row;
  });
}
