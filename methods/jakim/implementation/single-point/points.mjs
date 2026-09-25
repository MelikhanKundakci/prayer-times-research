// Transcribed from the public JUPEM 2025 Almanak, not fitted to prayer times.
const dms = (d, m, s = 0) => d + m / 60 + s / 3600;
const point = (d, m, s, ld, lm, ls) => Object.freeze({ latitude: dms(d, m, s), longitude: dms(ld, lm, ls) });
const zone = (ordinary, sunrise, printedPage, timeZone = 'Asia/Kuala_Lumpur') => Object.freeze({
  ordinary, sunrise, printedPage, pdfPage: printedPage + 8, timeZone,
});
export const POINT_SOURCE = 'https://www.jupem.gov.my/storage/upload/almanak/almanak2025-1732247258.pdf';
export const ZONES = Object.freeze({
  WLY01: zone(point(3,44,30,101,23,3), point(3,11,18,101,45,25), 174),
  WLY02: zone(point(5,13,35,115,7,42), point(5,16,32,115,18,50), 175, 'Asia/Kuching'),
  SGR02: zone(point(3,49,9,100,48,53), point(3,12,9,101,29,19), 173),
  SGR03: zone(point(3,1,6,101,15,11), point(2,48,10,101,39,18), 173),
  SGR01: zone(point(3,44,30,101,23,3), point(2,56,24,101,54,41), 173),
  PLS01: zone(point(6,25,22,100,7,15), point(6,25,22,100,7,15), 166),
  MLK01: zone(point(2,23,0,101,59,0), point(2,23,0,101,59,0), 178),
  JHR01: zone(point(2,35,0,104,19,0), point(2,35,0,104,19,0), 179),
});
