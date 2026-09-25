# Moonsighting Committee — own USNO V4.2

Reconstruction of the public MSC calculator, with separately selectable general, ahmar and abyad twilight settings. It is not a definition of every Muslim community’s practice.

**Research only — no official endorsement, universal religious coverage or production-ready accuracy is claimed.**

## Run the selected example

Run from the repository root:

```sh
node scripts/run.mjs moonsighting-committee --example
```

The checked-in [example input](examples/input.json) and [computed output](examples/output.json) are numerical examples, not original publisher reference data.

```json
{
  "year": 2026,
  "latitude": 52.5,
  "longitude": 13.4,
  "timeZone": "Europe/Berlin"
}
```

The uniform entry is [`calculate(options)`](index.mjs). **Default:** V4.2 annual rows; shafaq=general unless explicitly supplied. The explicit `published-dhuhr-five-minutes` variant applies the primary page's 300-second Dhuhr margin; it is a narrow alternative, not a complete new MSC specification. It worsens archived calendar matching and does not replace the default; see the [paired rule audit](RULE-EVIDENCE.md).

The method index calls the declared selected entry. Use the example command for a complete valid input; method-specific fields are not silently inferred from religious labels.

### Runnable implementations

The underlying signatures remain method-specific. These links point to the code shipped in this snapshot.

| Variant | Module / export |
|---|---|
| `usno-v4.2` | [`calculateGeometry`](implementation/moonsighting-usno-v4.2.mjs) |
| `published-dhuhr-five-minutes` | [`calculatePublishedDhuhr`](implementation/published-dhuhr.mjs) |

### Inputs and boundaries

- **V4.2; general/ahmar/abyad; returns both standard and Hanafi Asr:** `calculateGeometry(options)`. Input: year, latitude, longitude, timeZone; shafaq: general|ahmar|abyad; fixed selected night convention is same-day. Limits: 2000–2099; latitude −90…90, longitude −180…180; explicit IANA zone; unavailable solar events and quality flags must be respected.

A supported input range is a mathematical contract, not a statement that every location/year in it has been institutionally validated. Check event status, reason and date as well as the clock.

## How the calculation works

For fixed declination δ, cos(H)=(sin(h)−sin(φ)sin(δ))/(cos(φ)cos(δ)); transit±H/15 hours gives a height marker. Transit uses the equation of time and longitude. Continuous variants instead solve h_sun(t)−h_target(t)=0 with direction/domain checks. Asr shadow targets and ephemeris epochs differ by recipe.

- Own USNO solar coordinates and spherical hour-angle geometry. Coordinates are sampled at local solar-hour anchors: Fajr 5, sunrise 6, noon 12, Asr 13, sunset/Isha 18.
- Nominal Fajr/Isha depression 18°; horizon is the literal −0.833°, not exact −50′. Seasonal twilight bounds use the separately attributed MIT-derived MSC coefficient functions.
- V4.2 applies Dhuhr +0.083 decimal hours (4 min 58.8 s), Maghrib +3 min, then nearest absolute UTC minute. The precise Dhuhr constant is an empirical compatibility hypothesis, not a provider-confirmed rule.
- The opt-in published-margin alternative uses Dhuhr +300 seconds with the same nearest-minute convention and all other reconstructed events unchanged. Its unrounded `dhuhrCalculation.adjustedEpochMs` is a model value, not certified institutional seconds.
- Asr shadow factors 1 and 2 are returned separately. There is no city-specific timing table or residual correction in the calculation.

## Special rules and unresolved semantics

- At northern latitude ≥55°, the model uses a seventh of the night computed from the same calendar row’s sunrise and sunset; this is not silently mirrored to the southern hemisphere.
- Seasonal safe bounds may replace the angle event. Polar missing events, nonpositive shadow geometry and Asr-before-adjusted-Dhuhr are explicit quality issues, not certified prayer starts.
- Use current timezone data. The historically tested Node/ICU stack was pinned to tzdb 2026d; mathematical year support is not a guarantee against later timezone-law changes.
- Two archived source calendars display Sydney 2027 and Wellington 2028 DST offsets one civil date before the legal transition. The model follows the IANA zone rules; see [the boundary investigation](DST-SOURCE-DISCREPANCIES.md). This is unresolved publisher-output behavior, not a reason to shift local prayer events.

## Historical validation

These are archived research comparisons, **not results of the public snapshot test suite**. Exact means the displayed minute matches under the stated date interpretation. “Non-exact” is the fraction of comparable values that differ at all; “>1 min” is the fraction outside ±1 minute. Neither is a measured error rate of religious observance. Missing or ambiguous values are excluded from these percentages and remain visible in the last column.

| Study / recipe | Exposure | Exact / comparable | Non-exact | Within ±1 min | >1 min | Max | Excluded / planned |
|---|---|---:|---:|---:|---:|---:|---:|
| full-stack-fresh | fresh after complete stack freeze | 5,117/5,117 (100.00%) | 0.00% | 5,117/5,117 (100.00%) | 0.00% | 0 min | 0/5,117 |
| formula-fresh-runtime-amended | new calendars after formula freeze; runtime correction was informed by one of them | 10,234/10,234 (100.00%) | 0.00% | 10,234/10,234 (100.00%) | 0.00% | 0 min | 0/10,234 |
| known-regression | known development/regression; not fresh | 52,248/52,905 (98.76%) | 1.24% | 52,876/52,905 (99.95%) | 0.05% | 60 min | 799/53,704 |

### full-stack-fresh

**Recipe:** V4.2, formula and tzdb 2026d frozen together. **Sample:** Casablanca 2028 and Kathmandu 2031, two complete calendars.

**Compared markers:** Seven columns: Fajr, sunrise, Dhuhr, standard Asr, Hanafi Asr, Maghrib, Isha. **Date treatment:** Displayed-minute comparison; source does not supply event-specific UTC instants.

- Casablanca 2029 had previously exposed stale tzdb 2026a. These later two calendars followed the separate complete-stack freeze.
- This exact sample does not establish universal or observational accuracy.

### formula-fresh-runtime-amended

**Recipe:** V4.2, final tzdb 2026d replay. **Sample:** Santiago 2028, Chicago 2025, Kuala Lumpur 2032, Casablanca 2029.

**Compared markers:** Seven columns including both Asr factors. **Date treatment:** Displayed-minute comparison; source does not supply event-specific UTC instants.

- Not a blind whole-stack result: Casablanca exposed a timezone database issue before the 2026d replay.

### known-regression

**Recipe:** V4.2 with final tzdb 2026d. **Sample:** 21previously inspected annual calendars.

**Compared markers:** Seven columns including both Asr factors. **Date treatment:** Displayed-minute comparison; source does not supply event-specific UTC instants.

- 799both-missing slots are not counted as hits.
- Sydney 2027 and Wellington 2028 each retain 14 one-hour source DST disagreements; the primary comparison is not corrected.
- Kiritimati 2027 retains 629nonexact clocks, one differing by 2 minutes; a source date-row issue is a separate hypothesis, not a hidden model correction.

Counts, definitions and SHA-256 evidence pins are recorded in [`validation.json`](validation.json). Historical `research/...` strings there are provenance identifiers, not links to files included in this public package. Raw reference calendars are deliberately not bundled; these hashes alone do not let a new reader independently rerun publisher accuracy. Contributions that add lawfully redistributable fixtures or reproducible, authorized acquisition procedures are welcome.

## Sources

The [rule evidence audit and retrospective comparison](RULE-EVIDENCE.md) separates primary guidance from minute-output compatibility, including unresolved seasonal and high-latitude details.

- [Primary MSC calculation explanation, updated 1 March 2024](https://www.moonsighting.com/how-we.html)
- [Institutional public calendar generator; primary output comparison](https://www.moonsighting.com/praytable.php)
- [Primary astronomical approximation](https://aa.usno.navy.mil/faq/sun_approx)
- [Secondary software provenance for seasonal MSC rules, not institutional certification](https://github.com/batoulapps/adhan-js/blob/v4.4.6/src/PrayerTimes.ts)

Source websites and institution names are cited for attribution, not affiliation. Public access does not automatically allow redistribution. The repository license covers only material identified by its license notices.

- The own solar engine has no Adhan runtime dependency; seasonal coefficients retain MIT attribution. The old research/msc-cli.mjs invokes V4.1, not this V4.2 recipe.

## Useful contributions

- Can MSC confirm the exact Dhuhr decimal-hour constant, rounding order and night convention?
- Which explicit southern and polar replacement rules are intended?
- Can source DST/date-row anomalies be resolved without copying them into astronomical defaults?

For a proposed numerical change, document the primary rule or bounded hypothesis, preserve the previous results, freeze the recipe and full forecasts before reading new references, and report every planned date, missing value and regression. Keep coordinate/height provenance independent of timing residuals. Do not promote a city-specific fit to a universal method.
