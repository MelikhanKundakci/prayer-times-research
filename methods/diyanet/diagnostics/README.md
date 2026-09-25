# Offline point-consistency diagnostic

This tool asks a limited question: **can one latitude/longitude pair inside a small declared box explain all supplied minute observations under our fixed USNO00 reconstruction?** It performs the calculation locally and exposes contradictions. It contains no publisher calendars, official coordinate presets, network calls or new dependencies.

The resulting point is conditional on the model. It is **not an official Diyanet point, a GPS correction or a prayer-time profile**. In particular, longitude is indistinguishable from a common clock offset in these equations. Existing calculators and defaults are unchanged.

## Try the synthetic example

From the repository root:

```sh
node methods/diyanet/diagnostics/synthetic-example.mjs | \
  node core/timezones/with-tzdata.mjs methods/diyanet/diagnostics/cli.mjs -
```

The generator creates twelve rounded observations from our own formula at the synthetic input point 52.52° N / 13.405° E. This checks internal consistency; it is **not publisher accuracy evidence**. Rounded observations need not uniquely recover the generating point.

To analyze your own JSON file:

```sh
node core/timezones/with-tzdata.mjs methods/diyanet/diagnostics/cli.mjs observations.json
```

The CLI reads a named file or `-` for stdin and prints JSON to stdout. It does not write files. Invalid input produces an error on stderr and a nonzero exit code.

## Input contract

```js
import { fitPointConsistency } from './methods/diyanet/diagnostics/point-consistency.mjs';

const result = fitPointConsistency({
  timeZone: 'Europe/Berlin',
  latitudeBounds: [52.27, 52.77],
  longitudeBounds: [13.155, 13.655],
  observations: [
    // Supply independently resolved reference timestamps here:
    // { date: '2026-01-15', event: 'dhuhr', utc: '2026-01-15T11:00:00.000Z' }
  ],
  gridSegments: 10000
});
```

The illustrative empty array must be replaced with observations; use the synthetic generator for a complete runnable input. The commented timestamp only demonstrates syntax, not a verified time.

| Field | Accepted values |
| --- | --- |
| `timeZone` | Explicit valid IANA zone, or `UTC` |
| `latitudeBounds` | Increasing finite pair, at most 0.5° wide, entirely within 44.5° ≤ latitude < 60° N |
| `longitudeBounds` | Increasing finite pair, at most 0.5° wide, within −180°…180°; no wrapped interval |
| `observations` | 1–2,000 plain records, preserved in input order; unique date/event pairs |
| `date` | Valid local Gregorian row date, `YYYY-MM-DD`, years 2001–2098 |
| `event` | Exactly `sunrise`, `dhuhr` or `maghrib` |
| `utc` | Independently resolved UTC minute, `YYYY-MM-DDTHH:mm:00Z` or `YYYY-MM-DDTHH:mm:00.000Z`; must have the stated local row date |
| `gridSegments` | Optional integer 100–50,000; absent means 10,000; explicit null/undefined is invalid |

**Resolve source dates and timestamps independently before calling the tool.** It does not parse institutional calendars, infer post-midnight dates, or decide whether a publisher's `00:00` means midnight or unavailable data. Do not guess those meanings to create an input timestamp.

Extra fields, inherited records, getters, sparse arrays, non-finite numbers and duplicate observations are rejected. Inputs are not mutated. The entire coordinate box must have real, unclamped horizons on every observation date and use that date's UTC00 solar carrier. Cases needing the five-hour horizon policy, polar rules, or a different carrier date are rejected rather than silently converted to another method. The numerical year range is not an institutional validation claim.

## Fixed calculation and interval method

The existing [own USNO implementation](../../../core/astronomy/solar-usno-v2.mjs) supplies solar declination and equation of time at row-date UTC00. The diagnostic fixes the geometric horizon at −50′ and applies sunrise −7 minutes, Dhuhr +5 minutes and Maghrib +7 minutes. It uses nearest-minute rounding. These are the declared reconstruction assumptions; no angle, Temkin or day-specific parameter is fitted.

At a fixed latitude, raw event seconds relative to row-date UTC00 have the form

```text
t = B(latitude) − 240 × longitude
```

If the published UTC minute is `M` in the same coordinate system, exact agreement requires `M−30 ≤ t < M+30`. Therefore each observation gives a longitude interval:

```text
(B−M−30)/240 < longitude ≤ (B−M+30)/240
```

The lower endpoint is open and the upper endpoint is closed. Intersecting all source intervals with the user-specified longitude box tests exact feasibility at that latitude. A closed singleton at the box's lower boundary can be valid; an open endpoint is not silently accepted.

If the intervals conflict, the objective minimizes the largest required increase in their minute-cell half-width, in seconds. Every observation remains in the objective and output. This objective does not maximize the number of exact minutes or introduce per-event corrections.

A latitude grid covers the complete allowed interval. Golden-section refinement examines sampled local minima; a conservative bound on the latitude derivative gives the global lower bound `gridMinimum − K × gridStep/2`. The selected point gives an upper bound. Their bracket is the numerical claim; refinement alone does not prove an exact global minimizing coordinate. Deterministic ties favor sampled/refined latitudes nearest the latitude-box midpoint, then the lower latitude. For an exact feasible interval, its longitude midpoint is selected.

## Reading the output

- `status` distinguishes a found exact feasible point, a demonstrated contradiction inside the box, and unresolved exact feasibility. A zero closed-cell slack is not by itself a valid half-open solution.
- `minimax` gives lower/upper bounds on the additional half-width required by the constraints. These are not measured errors against unknown original seconds.
- `exactFeasibility.selectedLatitudeLongitudeInterval` describes only the selected latitude, including endpoint closure. Grid counts do not prove that a narrow feasible latitude region between grid points is absent.
- `activeConstraints` identifies the input observations giving the tightest opposing bounds.
- `agreementOnSuppliedData` and `residuals` retain every input observation, signed minute differences, and original-cell violations. Their agreement is on fitted data, not independent validation.
- `geometryChecks` records that the declared box stays inside the supported horizon and date-carrier regime.

Ordinary floating-point arithmetic is used, not outward-rounded formal interval arithmetic. Positive global gaps no larger than 10⁻⁷ seconds are treated as unresolved. Dhuhr-only constraints are independent of latitude, allowing their half-open feasibility to be decided directly even when closed slack is zero. Such data cannot constrain latitude.

Longitude is exactly confounded with a common raw-clock offset at −240 seconds per degree. Latitude may compensate for an incorrect horizon, refraction, ephemeris or other fixed assumption. Coordinate intervals are therefore model constraints, **not statistical confidence intervals for an institution's actual point**. The tool does not calculate Fajr/Asr/Isha, seasonal replacement or a complete calendar. Use separate, predeclared reference data to investigate whether a hypothesis transfers.

IANA date validation uses the host timezone database. The commands above use this repository's pinned timezone runner for reproducibility.

## Verification

```sh
node core/timezones/with-tzdata.mjs --test tests/diyanet-point-diagnostic.test.mjs
```

The focused tests cover immutable inputs, complete synthetic agreement, retained contradictions and minimax bounds, closed/open longitude contacts, invalid input and unsupported geometry, getter rejection, CLI behavior and host-timezone independence. No institutional reference calendars are bundled in these tests.
