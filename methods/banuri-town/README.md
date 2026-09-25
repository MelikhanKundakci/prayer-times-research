# Banuri Town — own published-angle reconstruction

A reconstruction tied to Jamia Uloom Islamia Banuri Town’s explicit angle and shadow-factor explanations. It is not a generic Karachi, Pakistan or all-Hanafi preset.

**Research only — no official endorsement, universal religious coverage or production-ready accuracy is claimed.**

The [rule evidence audit](RULE-EVIDENCE.md) separates inspected institutional guidance from reconstruction assumptions and identifies the next mathematical gap.

## Run the selected example

Run from the repository root:

```sh
node scripts/run.mjs banuri-town --example
```

The checked-in [example input](examples/input.json) and [computed output](examples/output.json) are numerical examples, not original publisher reference data.

```json
{
  "date": "2026-06-21",
  "latitude": 24.9,
  "longitude": 67.1,
  "timeZone": "Asia/Karachi"
}
```

The uniform entry is [`calculate(options)`](index.mjs). **Default:** strict own regional recipe; transit is not certified Dhuhr. The opt-in `zawal-plus-five` variant adds a minute-scale Dhuhr estimate from a published five-minute wait after calendar Zawal; its calculated Zawal proxy remains unconfirmed.

The public wrapper converts its options into the unchanged (date, location) signature. Use `variant: "zawal-plus-five"` for the additive rule described in the [evidence audit](RULE-EVIDENCE.md); omit `variant` to retain the original output.

### Runnable implementations

The underlying signatures remain method-specific. These links point to the code shipped in this snapshot.

| Variant | Module / export |
|---|---|
| `strict` | [`calculateBanuriStrict`](implementation/strict-api.mjs) |
| `zawal-plus-five` | [`calculateBanuriZawalPlusFive`](implementation/zawal-plus-five.mjs), additive minute-scale Dhuhr estimate |

### Inputs and boundaries

- **own USNO regional recipe:** `calculateBanuriStrict(date, location)`. Input: ISO date and {latitude,longitude,timeZone}. Limits: 2000–2099;23–37°N,60–78°E; Asia/Karachi; strict own-data location.

A supported input range is a mathematical contract, not a statement that every location/year in it has been institutionally validated. Check event status, reason and date as well as the clock.

## How the calculation works

For fixed declination δ, cos(H)=(sin(h)−sin(φ)sin(δ))/(cos(φ)cos(δ)); transit±H/15 hours gives a height marker. Transit uses the equation of time and longitude. Continuous variants instead solve h_sun(t)−h_target(t)=0 with direction/domain checks. Asr shadow targets and ephemeris epochs differ by recipe.

- Primary source rules: Fajr 18°, Isha 18°, Asr shadow factor 2.
- Auxiliary own USNO geometry samples local solar-hour anchors 5/6/12/13/18; horizon literal−0.833°, nearest UTC minute, no fitted offsets.
- The source Zawal column is compared with solar transit. Dhuhr remains unresolved: the calculator does not promote transit to a certified Dhuhr start. Sunset and prayer-start semantics remain separately named.

## Special rules and unresolved semantics

- The angles, Asr factor and a five-minute wait after calendar Zawal have institutional evidence. Horizon, ephemeris, Zawal rounding and the correspondence of our transit proxy to the printed calendar remain assumptions. The wait is implemented only in the opt-in variant.
- The month form lacks a year.2026 is a retrieval-year comparison assumption, not independently verified calendar-year metadata. A perpetual calendar remains possible.
- No high-latitude replacement, current official point or source-data redistribution license is established.

## Historical validation

These are archived research comparisons, **not results of the public snapshot test suite**. Exact means the displayed minute matches under the stated date interpretation. “Non-exact” is the fraction of comparable values that differ at all; “>1 min” is the fraction outside ±1 minute. Neither is a measured error rate of religious observance. Missing or ambiguous values are excluded from these percentages and remain visible in the last column.

| Study / recipe | Exposure | Exact / comparable | Non-exact | Within ±1 min | >1 min | Max | Excluded / planned |
|---|---|---:|---:|---:|---:|---:|---:|
| new-months | six new monthly tables after freeze, year semantics unresolved | 946/1,098 (86.16%) | 13.84% | 1,098/1,098 (100.00%) | 0.00% | 1 min | 0/1,098 |

### new-months

**Recipe:** own USNO regional recipe. **Sample:** Three cities,183 city-days; comparison year assumed 2026.

**Compared markers:** Fajr, sunrise, transit compared to Zawal, Asr, sunset, Isha; not six certified prayer starts. **Date treatment:** Displayed-minute comparison; source does not supply event-specific UTC instants.

- Fresh month tables, not a verified annual/multiyear holdout.

Counts, definitions and SHA-256 evidence pins are recorded in [`validation.json`](validation.json). Historical `research/...` strings there are provenance identifiers, not links to files included in this public package. Raw reference calendars are deliberately not bundled; these hashes alone do not let a new reader independently rerun publisher accuracy. Contributions that add lawfully redistributable fixtures or reproducible, authorized acquisition procedures are welcome.

## Sources

- [Institutional Fajr/Isha 18° explanation](https://www.banuri.edu.pk/readquestion/144707100380/25-12-2025)
- [Institutional Asr factor 2 explanation](https://www.banuri.edu.pk/readquestion/143409200025/21-07-2013)
- [Institutional five-minute wait after calendar Zawal](https://www.banuri.edu.pk/readquestion/143406200082/20-04-2013)
- [Primary calendar publisher](https://www.banuri.edu.pk/namaz-times)
- [Primary published calculation/calendar material](https://www.banuri.edu.pk/assets/uploads/2020/04/1587988961_book_pdf.pdf)

Source websites and institution names are cited for attribution, not affiliation. Public access does not automatically allow redistribution. The repository license covers only material identified by its license notices.

## Useful contributions

- Which production point and rounding generate the Zawal calendar marker to which the published five-minute wait applies?
- Does the web calendar have an operational year or a perpetual month table?
- What official points, horizon and rounding rules should replace auxiliary assumptions?

For a proposed numerical change, document the primary rule or bounded hypothesis, preserve the previous results, freeze the recipe and full forecasts before reading new references, and report every planned date, missing value and regression. Keep coordinate/height provenance independent of timing residuals. Do not promote a city-specific fit to a universal method.
