# Independent local solar verification

This directory checks the local solar kernel against a separate Python implementation of the published USNO approximate solar equations. It contains **synthetic point/date inputs and calculated model values only**. No institutional prayer calendar, source-clock row, API response, or fitted city correction is included.

The Python implementation does not import the JavaScript kernel. It solves a continuously unwrapped meridian equation and uses a sine-altitude residual, ten-minute samples, independently refined derivative extrema, and bisection. The JavaScript kernel uses a different event search and inverse-trigonometric altitude path. Agreement verifies that both implementations solve the chosen equations consistently; they share the published coordinate approximation and therefore do **not** establish independently observed physical accuracy or religious approval.

## Coverage

The frozen fixture contains 139 cases:

- Equinoxes, solstices and leap day across 22 points, including both hemispheres, ±180° longitude, ±89° latitude and high latitudes with absent crossings.
- Twenty additional cases using a 16° Isha threshold instead of the 17° default.
- Nine date-boundary cases, including 23/25-hour New York and Berlin days, 23.5/24.5-hour Lord Howe days and Pacific/Apia's skipped 30 December 2011.
- Deliberately mismatched New York longitude/timezone cases with no upper transit on a short civil day and two on a long civil day. These test explicit ownership rejection; they are not recommendations for choosing a user's timezone.

Of the 139 cases, 136 own a unique solar cycle. Their 816 event fields comprise **723 calculated timestamps and 93 explicitly unavailable events**. The other three inputs must throw `RangeError` because the requested civil date does not own a unique transit. An unavailable twilight crossing is not replaced by an estimate in this physical layer.

The requested civil date owns the upper-meridian transit. Rising events belong to the preceding lower-meridian-to-transit half-cycle, and setting events to transit-to-following-lower-meridian. The fixture preserves absolute timestamps and does not clip them to the requested civil day. Asr's factor-one target is fixed from the declination at upper transit and requires positive transit height.

## Run and regenerate

From the repository root, use the repository's pinned timezone wrapper:

```sh
TZ=UTC node core/timezones/with-tzdata.mjs core/local/verification/verify.mjs
```

The module also exports synchronous `verifyLocalSolar()`. It returns compact statistics and throws on any event availability, timestamp, cycle-boundary, direction, threshold or expected ownership-rejection mismatch. The timestamp tolerance is **0.1 seconds**, a numerical consistency threshold rather than a claimed physical accuracy bound. The published check matched the independently calculated timestamps within 0.000027 seconds.

To regenerate the synthetic fixture without JavaScript or private files:

```sh
python3 core/local/verification/oracle.py
```

The generator uses the operating system's Python `zoneinfo` database. The retained fixture was generated using system tzdb **2026c.1.0**, and the JavaScript comparison used ICU 78.3 with the repository's **2026d** bundle. All declared ownership cases agree between those environments. The generator does not itself pin or download timezone data. Regenerating on another database can legitimately change date ownership if civil-time rules change; inspect such changes before replacing the fixture. UTC timestamp calculations themselves do not apply timezone offsets to the solar equations.

This is a bounded numerical grid, not an analytic proof that every possible root is found. The independent derivative-extremum search helps expose short intervals that coarse level samples could miss, but cannot certify arbitrary functions. The fixture also does not prove accuracy throughout the API's full year range, near every tangency, for topocentric parallax, terrain, weather-dependent refraction, or observer elevation. Those are separate model and policy questions.

The kernel applies the declared −50 arcminute horizon threshold as a convention. This verification does not validate a physical atmosphere or local horizon by reproducing that threshold, and it does not certify notification readiness.
