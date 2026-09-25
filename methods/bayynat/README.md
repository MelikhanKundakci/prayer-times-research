# Bayynat / Fadlallah — empirical point-table recipe

A selected astronomical compatibility candidate for Bayynat point-calendar table markers. Numerical table columns and the institution’s legal prayer windows remain separate concepts.

**Research only — no official endorsement, universal religious coverage or production-ready accuracy is claimed.**

## Run the selected example

Run from the repository root:

```sh
node scripts/run.mjs bayynat --example
```

The checked-in [example input](examples/input.json) and [computed output](examples/output.json) are numerical examples, not original publisher reference data.

```json
{
  "date": "2026-06-21",
  "latitude": 52.5,
  "longitude": 13.4,
  "timeZone": "Europe/Berlin"
}
```

The uniform entry is [`calculate(options)`](index.mjs). **Default:** fixed point utc 12-h 5over 6-ceil.

The method index calls the declared selected entry. Use the example command for a complete valid input; method-specific fields are not silently inferred from religious labels.

### Runnable implementations

The underlying signatures remain method-specific. These links point to the code shipped in this snapshot.

| Variant | Module / export |
|---|---|
| `point-utc12-h5over6-ceil` | [`calculateDay`](implementation/selected-model.mjs) |
| `point-utc12-h5over6-nearest` — rejected general replacement, research only | [`calculateNearestCandidate`](implementation/nearest-candidate.mjs) |

### Inputs and boundaries

- **utc 12-h 5over 6-ceil; fixed empirical point recipe:** `calculateDay(input)`. Input: date,latitude,longitude,timeZone; exactly four fields. Limits: 2000–2099; global geographic bounds; explicit IANA; unique solar transit on requested civil day; poles/tangencies unavailable.

A supported input range is a mathematical contract, not a statement that every location/year in it has been institutionally validated. Check event status, reason and date as well as the clock.

## How the calculation works

For fixed declination δ, cos(H)=(sin(h)−sin(φ)sin(δ))/(cos(φ)cos(δ)); transit±H/15 hours gives a height marker. Transit uses the equation of time and longitude. Continuous variants instead solve h_sun(t)−h_target(t)=0 with direction/domain checks. Asr shadow targets and ephemeris epochs differ by recipe.

- Own USNO declination/equation of time sampled at UTC12 of the selected solar carrier; Fajr/Isha-table depression 18°, exact−5/6° sunrise/sunset horizon, Asr-table shadow factor 1.
- Ceil absolute UTC minutes for all six markers. The exact−5/6° (−50′) convention is distinct from the literal−0.833° used elsewhere. No coordinates or source clocks are adjusted to fit.
- Primary legal text describes true dawn, ordered shared Dhuhr/Asr and sunset-based Maghrib/Isha windows, and night-midpoint semantics. It does not confirm the candidate’s 18° angles or the meaning of unique Asr/Isha table columns.
- The PDF’s eastern-redness explanation is 13 minutes after sunset, not 13 degrees. Imsak and that derived redness marker are not independent angle observations.

## Special rules and unresolved semantics

- Selecting a point recipe followed a known-source timezone compatibility diagnosis; the selection is empirical, not a discovered official algorithm.
- Known Beirut March 2024 shows a printed clock jump onMarch 25 instead of the actual March 31 DST transition; September has a contradictory Hijri header and only 29 days. These source defects remain in historical records.
- Known Berlin March 2026 point data behaves compatibly with fixed UTC+2. Subsequent UTC-versus-Europe/Berlin frontend requests returned identical source clocks, so the backend mechanism is unproven. Do not silently reinterpret those clocks as provider-asserted UTC instants.
- The comparison maps source Maghrib to model sunset as an explicit assumption; this does not prove identical institutional production geometry or legal onset.

## Historical validation

These are archived research comparisons, **not results of the public snapshot test suite**. Exact means the displayed minute matches under the stated date interpretation. “Non-exact” is the fraction of comparable values that differ at all; “>1 min” is the fraction outside ±1 minute. Neither is a measured error rate of religious observance. Missing or ambiguous values are excluded from these percentages and remain visible in the last column.

| Study / recipe | Exposure | Exact / comparable | Non-exact | Within ±1 min | >1 min | Max | Excluded / planned |
|---|---|---:|---:|---:|---:|---:|---:|
| three-point-months | three new point-month originals after complete forecasts/model freeze | 238/546 (43.59%) | 56.41% | 545/546 (99.82%) | 0.18% | 2 min | 0/546 |

### three-point-months

**Recipe:** utc 12-h 5over 6-ceil. **Sample:** Jakarta April 2024, Singapore July 2024, Tokyo November 2024;91 days.

**Compared markers:** Fajr, sunrise, Dhuhr, Asr table, Maghrib compared to sunset, Isha table. **Date treatment:** Actual IANA zone at each 2024date; full printed dates retained.

- All residuals are 0,+1,+2 model minutes.
- This does not validate the source timezone behavior in other locations or seasons.
- A later moving-coordinate five-marker comparison uses known data and is not an additional fresh accuracy sample.

Counts, definitions and SHA-256 evidence pins are recorded in [`validation.json`](validation.json). Historical `research/...` strings there are provenance identifiers, not links to files included in this public package. Raw reference calendars are deliberately not bundled; these hashes alone do not let a new reader independently rerun publisher accuracy. Contributions that add lawfully redistributable fixtures or reproducible, authorized acquisition procedures are welcome.

## Rounding counterexperiment

The [uniform nearest-minute experiment](NEAREST-MINUTE.md) is retained as a **rejected general replacement**, with the ceiling default unchanged. It improves 238→482/546 exact on known source months. On three new 2031 point-months frozen before source acquisition, it improves 299→454/552 exact but worsens 62 individual differences and creates **three new two-minute errors**; ceiling stays within one minute on all 552. Tokyo Fajr exposes a mismatch already present in the unrounded calculation. Both datasets and the older timezone-conflicted counterevidence remain separate in the [aggregate report](research/nearest-2026-09-25.json).

## Sources

- [Primary public calendar frontend](https://www.bayynat.org.lb/prayer-time)
- [Original March 2024 rules and calendar](https://prayertime.bayynat.org.lb/uploadImages/MawaKitAlSalatImages/Mawakit-1105481..pdf)
- [Original September 2024 rules and calendar](https://prayertime.bayynat.org.lb/uploadImages/MawaKitAlSalatImages/Mawakit-3662407..pdf)
- [Primary discussion of sunset/Maghrib; distinguish quoted scholarly positions](https://www.bayynat.org.lb/article/مقالات-فقهية-حول-الصوم/28345/رأي-العلم-والعلماء-في-دخول-وقت-المغرب/ar)

Source websites and institution names are cited for attribution, not affiliation. Public access does not automatically allow redistribution. The repository license covers only material identified by its license notices.

- The export supplies numerical table markers, not a fatwa or a full legal-windows engine. Uncertain source clocks were never repaired in place.

## Useful contributions

- What are the operational definitions of the separate Asr and Isha table columns?
- How does the frontend/backend interpret requested dates, IANA zone strings and DST?
- Are the chosen solar epoch, horizon and rounding convention part of the original generator?

For a proposed numerical change, document the primary rule or bounded hypothesis, preserve the previous results, freeze the recipe and full forecasts before reading new references, and report every planned date, missing value and regression. Keep coordinate/height provenance independent of timing residuals. Do not promote a city-specific fit to a universal method.
