# Right-ascension alternatives: research code only

[`solar-coordinates.mjs`](solar-coordinates.mjs) exposes the four fixed astronomical approximations compared in the [noon transfer study](../../RA-SERIES.md). They are not prayer-time profiles and are not selected by the Diyanet public entry point.

```js
import {solarCoordinatesVariant} from './solar-coordinates.mjs';
const result = solarCoordinatesVariant(2461212.5, 'legacy-series');
// declination: degrees; rightAscension and equationOfTimeHours: hours.
```

The argument is a finite Julian date on the source's stated UTC scale. No timezone, prayer criterion, Temkin, location correction or calendar is loaded. There is no fitted parameter. The [NASA-hosted EVE explanation](https://soho.nascom.nasa.gov/solarsoft/sdo/eve/doc/eve_sun_almanac-code.html) describes a low-precision approximation with a stated 1950–2050 range; accepting a finite number does not certify accuracy outside it.

| Selector | Coefficients | Right ascension |
|---|---|---|
| `current-atan2` | Existing project USNO constants | Existing exact trigonometric transformation |
| `legacy-atan2` | Legacy almanac constants | Same trigonometric transformation; earlier coefficient-only control |
| `legacy-series` | Legacy almanac constants | Published two-term EVE series |
| `current-series` | Existing project USNO constants | Series hybrid for isolating its effect; not the published EVE recipe |

“Exact” in the transformation description refers to evaluating that geometric expression rather than truncating its series. It does not make the approximate solar ephemeris exact.

This is original equation-based implementation. Its mathematical fixtures are generated independently in Python and contain no institutional calendar observations. The arithmetic tests and the institutional comparison answer different questions. All four candidates and the negative result remain available so future contributors can reproduce the hypothesis without repeating its discovery.

To regenerate the model-only fixture file, run `python3 methods/diyanet/research/ra-series/generate_fixtures.py` from the repository root. `npm test` verifies the fixture source hashes and JavaScript/Python agreement. The [independent Python expressions](independent_solar.py) use radians for the series; the JavaScript implementation uses degree-valued right ascension.
