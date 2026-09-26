# SPA point-coordinate provider

[spa-point.mjs](spa-point.mjs) implements the apparent geocentric part of the Reda–Andreas [Solar Position Algorithm](https://docs.nlr.gov/docs/fy08osti/34302.pdf), with an adapter for continuous local event solving. It is used only when a local calculation explicitly selects `solarModel: 'spa'`. Existing USNO defaults and the six earlier profile definitions retain their numerical model.

```js
import { solarCoordinatesSPA } from './spa-point.mjs';
const sun = solarCoordinatesSPA(2461587.5);
// declination: degrees; rightAscension and equationOfTimeHours: hours.
```

The provider includes the retained SPA Earth longitude, latitude and distance series, 63 nutation terms, aberration, apparent right ascension and declination. The equations are independently expressed JavaScript, reused from the repository's previously tested SPA research implementation. They were not copied from the NREL program source. No network service, city calendar or source timetable is loaded.

## Hour angle and time scales

The underlying equatorial hour angle is:

```text
H = GAST + east-positive longitude − apparent right ascension
```

The existing local solver expresses it using a UTC day phase and an equation-of-time term. The adapter therefore returns:

```text
UTCphase = 360 × fraction(JD_UTC + 0.5)
effectiveEOTDegrees = wrapToSigned180(GAST − RA − UTCphase + 180)
equationOfTimeHours = effectiveEOTDegrees / 15
```

This makes `UTCphase + longitude + 15 × equationOfTimeHours − 180` congruent to the direct sidereal hour angle. The adapter does **not** substitute SPA's conventional mean-longitude equation of time into that expression. That separate diagnostic is named `conventionalEquationOfTimeMinutes`. `rightAscensionDegrees` and `apparentSiderealTimeDegrees` expose the underlying quantities for inspection.

The current offline convention fixes **UT1=UTC** and **ΔT=TT−UT1=69.184 seconds**. It is an explicit approximation, not a prediction of future leap seconds or Earth orientation. `SPA_POINT_CONVENTIONS` exposes these assumptions. The lower-level `apparentGeocentricCoordinatesSPA(jd,{deltaTSeconds})` is available for declared sensitivity tests; the point adapter keeps the fixed convention.

The provider is geocentric. It does not add observer elevation, terrain, topocentric solar parallax or a weather-dependent refraction model. A profile's fixed horizon depression remains its own convention. The SPA report's stated angular uncertainty is not a guarantee of event-time accuracy: close to a tangent, small angular differences can substantially move an event or alter its existence. Actual atmospheric and horizon conditions introduce additional uncertainties.

## Independent evidence

The [80-coordinate fixture](spa-point-fixtures.json) was calculated by directly executing retained **pvlib-python v0.13.1**, independently of this JavaScript module. It includes the earlier 64 coordinate samples plus 16 UTC-midnight/noon range-edge samples in 2001 and 2098. Tests also check the SPA report's worked example and the effective hour-angle identity around UTC midnight and both longitude aliases.

The separate [continuous-event comparison](../local/verification/spa-README.md) solves all six events using pvlib coordinates and an independent Python root search. Across 348 declared cases, the new SPA path matches all 1,874 available reference timestamps within 0.000227 seconds and all 160 unavailable fields. These numbers measure implementation agreement under identical conventions, not observational truth or institution-approved prayer times.

## License and provenance

[spa-coefficients.json](spa-coefficients.json) is a byte-identical copy of the previously extracted tables from [pvlib-python v0.13.1 spa.py](https://github.com/pvlib/pvlib-python/blob/v0.13.1/pvlib/spa.py). The upstream source SHA-256 is:

```text
ad7762ccca5fd9611ef9e2a9b1e37f95fe4c5b31628616b2ad3e84ea1e5f9202
```

The coefficient tables retain the complete [BSD-3-Clause notice](LICENSE-pvlib-SPA), including attribution and redistribution conditions. Preserve that notice when distributing these files. The pre-existing extraction and provenance records remain in [the research implementation](../../methods/diyanet/research/spa-reference/README.md); they were not altered by this addition.

Run the provider and independent event tests from the repository root:

```sh
TZ=UTC node core/timezones/with-tzdata.mjs --test tests/local-spa-reference.test.mjs
```
