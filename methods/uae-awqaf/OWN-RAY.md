# Own dry-atmosphere ray integration

**The opt-in `own-ray` experiment removes every two-minute discrepancy in the 9,684 already exposed comparison fields, using only our own JavaScript runtime.** It reproduces the earlier separate PAL experiment's rounded results without shipping or calling PAL. This is an independent implementation and retrospective comparison, not a new institutional holdout or a complete official UAE algorithm.

## Run it

```sh
node scripts/run.mjs uae-awqaf --input methods/uae-awqaf/examples/own-ray-input.json
```

The [example input](examples/own-ray-input.json) and [output](examples/own-ray-output.json) are generated model examples, not official coordinates or calendar observations. The uniform `calculate` entry accepts `variant: "own-ray"`; omission or `variant: "v2"` retains the earlier V2 recipe. The named export is `calculateOwnRayCandidate(date, point)`.

The existing explicit point contract and UAE domain apply: Gregorian dates 2000–2099, latitude 22–27°, longitude 51–57°, elevation 0–1,500 m, city width 0–100 km and `Asia/Dubai`. Pressure and temperature fields remain required for input provenance but this candidate explicitly lists them as **unused**: it fixes a dry standard atmosphere of 1010 mbar and 283.15 K, wavelength 0.55 μm and temperature lapse 0.0065 K/m. These are the experiment's assumptions, not observed weather or confirmed publisher settings.

Only sunrise and Maghrib change. Fajr, Dhuhr, Asr and Isha retain their complete V2 event objects. The apparent upper solar limb is placed at minus the unchanged geometric horizon dip; refraction is evaluated at that observed angle. The geometric solar-center threshold is minus the sum of dip, 16′ semidiameter and computed refraction. The own USNO event solver retains the existing east/west point construction and nearest-minute rounding.

## Independent numerical method

The new [refraction module](implementation/own-ray/refraction.mjs) solves the spherical Snell invariant `b = n(r) r sin(z)`. Define `q = n(r) r`. Differentiating that invariant and the angular bending gives the smooth integrand

```text
R = integral from z_top to z_observed of -r*n'(r)/(n(r)+r*n'(r)) dz
```

For each quadrature sample, solve `q(r) = b/sin(z)` with a bracketed Newton method. Split the integration at the tropopause and horizontal ray. A negative observed altitude has an initial descending branch; the same invariant includes the turning point without dividing by `cos(z)` at 90°. Simpson quadrature uses 256 segments per interval. A final Snell interface connects the finite 80 km atmosphere to vacuum.

The declared dry atmosphere follows hydrostatic balance and a refractivity proportional to pressure/temperature. Temperature decreases linearly up to an absolute 11 km tropopause and is constant above it. With `C = g*M/R_gas` and lapse `L`, refractivity excess in the lower layer varies as `(T/T_observer)^(C/L - 1)`; above the tropopause it decays exponentially. The model uses a 6,378,120 m atmospheric Earth radius, dry molar mass 28.9644, gas constant 8314.32, the documented latitude/height gravity approximation and a dry optical dispersion coefficient. Constants are model assumptions, not fitted calendar corrections.

This is original code derived from the ray invariant, not a translation of a library implementation. The [IAC documentation](https://astronomycenter.net/accut.html?l=en) motivates investigating near-horizon refraction. [Auer and Standish's primary publication record](https://ntrs.nasa.gov/citations/20060040430) describes the nonsingular-quadrature approach generally. The atmospheric family and its limitations are described by [Hohenkerk and Sinclair](https://assets.admiralty.co.uk/public/documents/2025-08/naotn63.pdf?VersionId=yR9m_ZlDi5p7I9mQjnBLr5NWfotPx064). No external implementation source or reference calendar is read by the runtime.

The geometric versus optically refracted terrestrial horizon remains an unresolved physical/institutional convention. This formal atmospheric ray calculation does not model terrain obstruction, measured weather, humidity or a validated visibility boundary below the local horizon. Do not interpret its numerical integration accuracy as observational or religious accuracy.

## Comparison against every previously exposed cohort

| Existing reference cohort | V2 exact | Own ray exact | V2 more than 1 minute | Own ray more than 1 minute | Compared |
|---|---:|---:|---:|---:|---:|
| SZGMC 1445 calendars | 4,492 | 4,760 | 252 | 0 | 6,372 |
| Awqaf January 2027 / July 2026 | 779 | 832 | 53 | 0 | 1,116 |
| Former V2 holdout: April 2025 / October 2026 | 778 | 822 | 44 | 0 | 1,098 |
| Former V3 holdout: January 2025 / November 2026 | 791 | 825 | 49 | 0 | 1,098 |
| **Total, 1,614 unique city-days** | **6,840** | **7,239** | **398** | **0** | **9,684** |

The three regions are Abu Dhabi, Al Ain and Zayed City. Every observation was already known before this implementation. Earlier source acquisition histories are retained, but those old holdouts are **development data for this new candidate**. No new city or original calendar was acquired. Actual UTC instants agree with the displayed-minute comparison in these UAE dates; no modulo-day error reduction or missing-event hits are used.

Compared with V2, **883** previously unequal values become exact and **484** exact values become unequal. All 398 two-minute differences disappear, but **2,445 one-minute differences remain**. Sunrise and Maghrib each improve in aggregate; individual clocks and some regional exact-match totals regress. The four other events are unchanged. See [all cohort, city and event aggregates](research/own-ray-2026-09-25.json), including evidence identifiers and hashes; original reference rows are not redistributed.

A separate fixed follow-up used a varying solar semidiameter and first-order parallax. It improved the total from 7,239 to 7,251 exact but worsened sunrise exactness in Al Ain and Zayed. It failed its predeclared no-city/event-loss gate and is not selected. A more detailed physical model does not necessarily better reproduce the publisher's recipe.

## Verification and reproducibility

- A separate Python radial-coordinate integral with adaptive quadrature checks **108** ray cases. Its largest difference from the JavaScript zenith-angle integral is below **0.000003 arcseconds**. It uses the same assumed atmosphere, so it is an alternate numerical formulation, not independent atmospheric truth.
- Doubling the JS quadrature resolution changes these results by less than **0.000003 arcseconds**. A private black-box PAL benchmark differs by at most **0.00330 arcseconds**; the explicit finite-top interface is one model distinction. No bit identity is claimed.
- The new runtime and the older PAL candidate have identical minute outputs for all **9,684** comparison fields. The maximum recorded difference of their raw timestamps is about **0.00115 seconds**, including millisecond timestamp serialization. This is implementation agreement, not calendar accuracy at subsecond precision.
- Public tests verify input rejection, all four unchanged events, date/rounding behavior, and operation with network, subprocesses, external libraries and reference fixtures inaccessible. The same results hold under UTC and Honolulu host timezones.

```sh
node core/timezones/with-tzdata.mjs --test tests/uae-own-ray.test.mjs
python3 scripts/verify-uae-radial.py
```

The [Python verifier](../../scripts/verify-uae-radial.py) and [numerical fixtures](../../tests/uae-radial-fixtures.json) contain only our own mathematics and generated ray values. They require no publisher data or PAL build. Python is optional for this alternate verification; the calculator itself is JavaScript only.
