# Equation-of-center component experiment

Research-only, rejected candidate. Read the [full comparison and limitations](../../EQUATION-OF-CENTER.md) before using the code. It is not exported by the standalone Diyanet calculator.

- `solar-center.mjs`: one unfitted USNO/NOAA hybrid provider, taking UTC Julian date and returning declination in degrees, right ascension in hours, and equation of time in hours.
- `center-oracle.py`: a separate standard-library Python expression of the same declared mathematics.
- `verify-center.mjs`: cross-language arithmetic check over 710 Julian dates and invalid-input checks.
- `comparison.json`: source-free aggregates, provenance hashes and failed replacement conditions. It contains no official calendar clocks.
- `noon-comparison.json` and `noon-verification.json`: the secondary retrospective noon diagnostic and its independent check. City terms are source-fitted nuisance parameters, never runtime coordinates or GPS corrections.

From the repository root, with Node.js and Python 3 installed:

```sh
node methods/diyanet/research/equation-center/verify-center.mjs
```

`npm test` also runs this arithmetic check. It covers samples from 1800 through 2200 and J2000 ±3 centuries; this is a numerical check of the expressions, not a claim of astronomical accuracy over that range. The standalone prayer core retains its existing 2001–2098 domain.

For source-free calendar experiments, pass `solarCoordinatesCenterHybrid` as the explicit second argument to `calculateAnnualRaw` from `core/diyanet/calendar.mjs`, with `{dateBasis: 'civil-date'}` as its third argument. The raw calculator is a research boundary, not the validated app-facing API. Do not apply additional Temkin margins: its returned `rawEpoch` values already include them. The compared minute rule is `Math.floor(rawEpoch / 60000 + 0.5) * 60000`, preserving `null` for missing events.

This hybrid retains USNO mean longitude and obliquity while replacing the complete NOAA equation-of-center function, including NOAA's mean anomaly. Its constants are unmodified published coefficients; there are no source-fitted city presets. Passing arithmetic checks does not make this rejected candidate a validated prayer-time method.
