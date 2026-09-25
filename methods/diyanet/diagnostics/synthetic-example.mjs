#!/usr/bin/env node
// Synthetic observations from our own declared formula, not publisher data.
import { solarCoordinatesUSNO } from '../../../core/astronomy/solar-usno-v2.mjs';
const latitude = 52.52, longitude = 13.405, rad = Math.PI / 180;
const observations = [];
for (const date of ['2026-01-15', '2026-03-20', '2026-09-15', '2026-12-21']) {
  const epoch = Date.parse(`${date}T00:00:00Z`), s = solarCoordinatesUSNO(epoch / 86400000 + 2440587.5);
  const c = (Math.sin(-50 / 60 * rad) - Math.sin(latitude * rad) * Math.sin(s.declination * rad)) / (Math.cos(latitude * rad) * Math.cos(s.declination * rad));
  const halfDay = Math.acos(c) / rad * 240, noon = 43200 - 240 * longitude - s.equationOfTimeHours * 3600;
  for (const [event, seconds] of Object.entries({ sunrise: noon - halfDay - 420, dhuhr: noon + 300, maghrib: noon + halfDay + 420 })) {
    observations.push({ date, event, utc: new Date(epoch + Math.floor(seconds / 60 + .5) * 60000).toISOString() });
  }
}
process.stdout.write(JSON.stringify({ timeZone: 'Europe/Berlin', latitudeBounds: [52.27, 52.77], longitudeBounds: [13.155, 13.655], observations }, null, 2) + '\n');
