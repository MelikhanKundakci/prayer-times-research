# Diyanet — own regional reconstructions and northern experiments

Distinct reconstructions of published Diyanet/Awqat criteria and sampled institutional calendars. Northern, low-latitude and southern routes have different declared domains. A country, legal school and institutional calendar are not interchangeable labels.

**Research only — no official endorsement, universal religious coverage or production-ready accuracy is claimed.**

[Further residual and source diagnosis (25 September 2026)](RESEARCH-NOTES-2026-09-25.md) explains why tested global rounding changes were not adopted and identifies the official API fields needed for the next targeted comparison.

## Run the selected example

Run from the repository root:

```sh
node scripts/run.mjs diyanet --example
```

The checked-in [example input](examples/input.json) and [computed output](examples/output.json) are numerical examples, not original publisher reference data.

```json
{
  "variant": "north-missing-window",
  "year": 2026,
  "latitude": 52.5,
  "longitude": 13.4,
  "timeZone": "Europe/Berlin"
}
```

The uniform entry is [`calculate(options)`](index.mjs). **Default:** north-missing-window (annual); this is an explicit experimental default, not automatic religious or latitude-based method selection.

Public options.variant selects north-missing-window, north-reviewed, north-baseline, low-latitude or south. Northern inputs use year; low-latitude/south use date. The default is an experiment, not a certification.

### Runnable implementations

The underlying signatures remain method-specific. These links point to the code shipped in this snapshot.

| Variant | Module / export |
|---|---|
| `north-reviewed` | [`calculateNorthernReviewed`](implementation/north/quality-model.mjs) |
| `north-baseline` | [`calculateNorthernCalendar`](implementation/north/model.mjs) |
| `north-missing-window` | [`calculateMissingWindowCalendar`](implementation/missing-window/model.mjs) |
| `low-latitude` | [`calculateDay`](implementation/low-latitude/model.mjs) |
| `south` | [`calculateDay`](implementation/south/candidate.mjs) |

### Inputs and boundaries

- **low-latitude own USNO UTC00:** `calculateDay(input), calculateYear(input)`. Input: date or year, latitude, longitude, timeZone. Limits: 2000–2099; 0≤latitude<44.5; explicit IANA zone; one solar transit must match the requested civil day.
- **southern own USNO UTC00:** `calculateDay(input), calculateYear(input)`. Input: date or year, latitude, longitude, timeZone. Limits: 2000–2099; −60≤latitude<0; explicit IANA zone; no northern seasonal rule mirrored south.
- **reviewed northern V5:** `calculateNorthernReviewed(options)`. Input: year, latitude, longitude, timeZone. Limits: 2001–2098; 44.5≤latitude≤75; complete civil year needed for seasonal state.
- **missing-window experiment; not an automatic replacement for reviewed V5:** `calculateMissingWindowCalendar(options)`. Input: year, latitude, longitude, timeZone. Limits: Same northern mathematical domain; unsupported seasonal/civil cases remain explicit.

A supported input range is a mathematical contract, not a statement that every location/year in it has been institutionally validated. Check event status, reason and date as well as the clock.

## How the calculation works

For fixed declination δ, cos(H)=(sin(h)−sin(φ)sin(δ))/(cos(φ)cos(δ)); transit±H/15 hours gives a height marker. Transit uses the equation of time and longitude. Continuous variants instead solve h_sun(t)−h_target(t)=0 with direction/domain checks. Asr shadow targets and ephemeris epochs differ by recipe.

- Low-latitude/southern routes use own USNO declination/equation of time at the selected solar carrier’s UTC00, Fajr −18°, Isha −17°, horizon −50′, shadow factor 1 and nearest UTC minute.
- The corresponding minute adjustments are Fajr 0, sunrise −7, Dhuhr +5, Asr +4, Maghrib +7 and Isha 0. Published Temkin evidence is kept separate from inferred ephemeris/rounding details.
- Northern routes instead use the high-latitude 18°/16° criteria, the 44.5° boundary, five-hour minimum day/night, a ratio anchored at the last real Fajr day and transitions around ±20-minute differences. The implementation’s exact season construction and ≥60° solstice envelope remain reconstructions.
- The missing-window experiment retains the same ratio anchor, but bounds the estimated seasonal phase by the first and last missing-Fajr calendar days rather than including the adjacent real-angle days. It does not add the separate inner-angle, moving-ephemeris or Asr-ordering experiments.

## Special rules and unresolved semantics

- Northern replacement horizons and Asr=Dhuhr fallback are model policies with unresolved religious/operational details; do not relabel them as physical sunrise, sunset or shadow roots.
- The reviewed northern entry retains physical-Asr diagnostics and quality flags. Historical low-latitude Adhan branches are not part of the own low-latitude implementation.
- Source 00:00 is ambiguous, never an exact hit. Primary comparisons bind the printed Gregorian date to actual IANA time. A separate conditional comparison assigns nonzero Isha before Maghrib to the next Gregorian date; it is not a provider assertion of that event date.
- Published example/UNGEGN coordinates are proxies, not certified production locations or elevations. No exact worldwide reproduction is established.

## Historical validation

These are archived research comparisons, **not results of the public snapshot test suite**. Exact means the displayed minute matches under the stated date interpretation. “Non-exact” is the fraction of comparable values that differ at all; “>1 min” is the fraction outside ±1 minute. Neither is a measured error rate of religious observance. Missing or ambiguous values are excluded from these percentages and remain visible in the last column.

| Study / recipe | Exposure | Exact / comparable | Non-exact | Within ±1 min | >1 min | Max | Excluded / planned |
|---|---|---:|---:|---:|---:|---:|---:|
| low-latitude-fresh | fresh after model, point and complete forecast freeze | 3,443/4,380 (78.61%) | 21.39% | 4,380/4,380 (100.00%) | 0.00% | 1 min | 0/4,380 |
| north-four-primary | three fresh calendars plus one explicitly reused calendar | 8,053/8,758 (91.95%) | 8.05% | 8,719/8,758 (99.55%) | 0.45% | 1441 min | 2/8,760 |
| north-four-conditional | same three fresh plus one reused source cohort | 8,091/8,758 (92.38%) | 7.62% | 8,758/8,758 (100.00%) | 0.00% | 1 min | 2/8,760 |
| north-unseen-three-conditional | three new originals after unchanged model/forecast freeze | 6,145/6,568 (93.56%) | 6.44% | 6,568/6,568 (100.00%) | 0.00% | 1 min | 2/6,570 |

### low-latitude-fresh

**Recipe:** low-latitude own USNO UTC00. **Sample:** Mexico City and New Delhi, complete 2027 years.

**Compared markers:** Fajr, sunrise, Dhuhr, Asr, Maghrib/sunset, Isha. **Date treatment:** Printed date interpreted using the specified actual IANA zone.

- All nonexact differences are model +1 minute; no fitted correction was applied.
- Eight Turkey years were known parity/development data, not additional fresh accuracy.

### north-four-primary

**Recipe:** missing-window. **Sample:** Vienna, Bremen, Bergen and Rovaniemi 2027.

**Compared markers:** Fajr, sunrise, Dhuhr, Asr, Maghrib/sunset, Isha. **Date treatment:** Primary: actual IANA instants on the source printed date, no modulo-day correction.

- Two Bergen Isha 00:00 cells remain ambiguous.
- 39 Bergen Isha comparisons have a source/event-date ambiguity; the large primary maximum must not be hidden.
- Vienna was reused after a separately declared canonical-URL metadata amendment.

### north-four-conditional

**Recipe:** missing-window. **Sample:** Same four years, separately declared Isha-next-date interpretation.

**Compared markers:** Fajr, sunrise, Dhuhr, Asr, Maghrib/sunset, Isha. **Date treatment:** Conditional only: nonzero Isha earlier than source Maghrib is placed on the next civil date.

- The paired baseline is 8033 exact, 8733 within one minute, maximum 2.
- 204 rounded markers change: 122 improve absolute error, 62 worsen, 20 retain absolute error. Bremen loses 34 exact values.

### north-unseen-three-conditional

**Recipe:** missing-window. **Sample:** Bremen, Bergen and Rovaniemi 2027 only; Vienna excluded.

**Compared markers:** Fajr, sunrise, Dhuhr, Asr, Maghrib/sunset, Isha. **Date treatment:** Same explicitly conditional Isha-next-date interpretation.

- This is a subset of the four-year result, not an additional independent denominator.
- Bremen Fajr exactness falls 325→306 and Isha 334→319; geographic gains are not uniform.

Counts, definitions and SHA-256 evidence pins are recorded in [`validation.json`](validation.json). Historical `research/...` strings there are provenance identifiers, not links to files included in this public package. Raw reference calendars are deliberately not bundled; these hashes alone do not let a new reader independently rerun publisher accuracy. Contributions that add lawfully redistributable fixtures or reproducible, authorized acquisition procedures are welcome.

## Sources

- [Primary high-latitude criteria, English version describing application from 2023](https://www.awqatsalah.com/sub/18/calculation-criteria)
- [Primary Turkish criteria; wording differences retained](https://www.awqatsalah.com/sub/34/tespit-kriterleri)
- [Primary current Temkin explanation](https://vakithesaplama.diyanet.gov.tr/temkin.php)
- [Published example calculation points, not a current production-coordinate API](https://vakithesaplama.diyanet.gov.tr/vakit_kiyaslamalari.php)
- [Original institutional calendars](https://namazvakitleri.diyanet.gov.tr/)

Source websites and institution names are cited for attribution, not affiliation. Public access does not automatically allow redistribution. The repository license covers only material identified by its license notices.

- The public wrapper declares north-missing-window as its experimental default and accepts explicit alternative variants; it never infers religious affiliation or selects a method automatically from latitude. Southern 2028 requests failed with HTTP502 and produced no fresh accuracy result. Separate known-data diagnostics and unit-test counts are not additional accuracy samples.

## Useful contributions

- What are the current operational point coordinates, height, horizon and geographic coverage for each calendar location?
- Which ephemeris and daily/time-dependent epoch are used, and in what order are Temkin and rounding applied?
- Can Diyanet publish an exact machine-readable specification of northern ratio anchors, seasonal transitions and polar/Asr policies?
- Does the calendar row assign after-midnight Isha to the evening prayer cycle or to the printed civil date?

For a proposed numerical change, document the primary rule or bounded hypothesis, preserve the previous results, freeze the recipe and full forecasts before reading new references, and report every planned date, missing value and regression. Keep coordinate/height provenance independent of timing residuals. Do not promote a city-specific fit to a universal method.
