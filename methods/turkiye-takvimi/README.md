# Türkiye Takvimi / namazvakti.com — retained negative reconstruction

A deliberately unsuccessful, bounded reconstruction of Türkiye Takvimi’s published Istanbul method. This family is retained to expose the unresolved technical problem, not advertised as an accurate alternative calendar.

**Deferred as of 26 September 2026.** Active implementation effort is directed to Diyanet and broad community coverage in the [delivery roadmap](../../docs/ROADMAP.md#active-delivery-priorities--26-september-2026). The existing code and research record are retained for provenance.

**Research only — no official endorsement, universal religious coverage or production-ready accuracy is claimed.**

The [rule-evidence audit](RULE-EVIDENCE.md) maps the publisher's ephemeris and Temkin statements to the current reconstruction and its unresolved assumptions.

## Run the selected example

Run from the repository root:

```sh
node scripts/run.mjs turkiye-takvimi --example
```

The checked-in [example input](examples/input.json) and [computed output](examples/output.json) are numerical examples, not original publisher reference data.

```json
{
  "date": "2026-06-21",
  "variant": "noaa-continuous-nearest"
}
```

The uniform entry is [`calculate(options)`](index.mjs). **Default:** noaa-continuous-nearest, retained negative hypothesis.

The method index calls the declared selected entry. Use the example command for a complete valid input; method-specific fields are not silently inferred from religious labels.

### Runnable implementations

The underlying signatures remain method-specific. These links point to the code shipped in this snapshot.

| Variant | Module / export |
|---|---|
| `istanbul` | [`calculateIstanbul`](implementation/calculate.mjs) |

### Inputs and boundaries

- **default noaa-continuous-nearest; twelve predeclared diagnostics:** `calculateIstanbul(input)`. Input: date; variant: usno|noaa combined with utc00|continuous and nearest|floor|ceil; see exact enum in code. Limits: 2000–2099; fixed Istanbul 41°N/29°E, Europe/Istanbul, city 16741; no arbitrary geography.

A supported input range is a mathematical contract, not a statement that every location/year in it has been institutionally validated. Check event status, reason and date as well as the clock.

## How the calculation works

For fixed declination δ, cos(H)=(sin(h)−sin(φ)sin(δ))/(cos(φ)cos(δ)); transit±H/15 hours gives a height marker. Transit uses the equation of time and longitude. Continuous variants instead solve h_sun(t)−h_target(t)=0 with direction/domain checks. Asr shadow targets and ephemeris epochs differ by recipe.

- Primary material gives Imsak 19°, first Isha 17°, second Isha 19° and Asr shadow factors 1/2; the scored annual sheet contains the first Asr/Isha values.
- The default uses own continuous NOAA/Meeus coordinates at each event and a transit-declination noon-shadow target. Own USNO and fixed UTC00 variants are declared counterprobes, not MICA, which the publisher names.
- Geometric solar-center horizon 0° plus an Istanbul 10-minute Temkin: subtract before noon and add after noon. No additional−0.833° horizon is stacked onto this interpretation.
- A later source-motivated variable-Temkin counterhypothesis replaced 600 seconds with the evening crossing difference from 0° to−1°29′6.2″ plus 120 seconds. That later known-data study was negative too and is not the exported default.

## Special rules and unresolved semantics

- All twelve frozen variants fail the predeclared one-minute maximum objective. A best-looking percentage was not chosen after viewing the seasonal results.
- The publisher describes MICA and historical elevation/Temkin examples; the exact production horizon, seconds rounding and current point/height are unresolved.
- Sabah is a later recommendation rather than Imsak; auxiliary avoidance times, both Asr/Isha alternatives and night fractions must keep their own semantics.
- There is no geographic validation outside Istanbul and no selected polar replacement.

## Historical validation

These are archived research comparisons, **not results of the public snapshot test suite**. Exact means the displayed minute matches under the stated date interpretation. “Non-exact” is the fraction of comparable values that differ at all; “>1 min” is the fraction outside ±1 minute. Neither is a measured error rate of religious observance. Missing or ambiguous values are excluded from these percentages and remain visible in the last column.

| Study / recipe | Exposure | Exact / comparable | Non-exact | Within ±1 min | >1 min | Max | Excluded / planned |
|---|---|---:|---:|---:|---:|---:|---:|
| new-season-default | new 11months after all twelve variants were frozen | 0/2,010 (0.00%) | 100.00% | 935/2,010 (46.52%) | 53.48% | 4 min | 0/2,010 |
| variable-temkin-known | known-data diagnosis only; no new sources | 480/2,190 (21.92%) | 78.08% | 1,408/2,190 (64.29%) | 35.71% | 4 min | 0/2,190 |

The [default failure diagnosis](DEFAULT-FAILURE.md) separates the seasonal multi-minute bias from date/zone errors, rounding alternatives and unresolved Temkin/horizon assumptions. It also records why the much stronger table-plus-caution counterfactual is not promoted without a fresh holdout.

### new-season-default

**Recipe:** noaa-continuous-nearest, fixed 10min. **Sample:** Istanbul 2026 excluding already-known September;335 days.

**Compared markers:** Fajr, sunrise, Dhuhr, Asr, Maghrib/sunset, Isha. **Date treatment:** Printed Gregorian date and source clock, no modulo-day reduction.

- All twelve remain unsuccessful: exact counts range 0…231; maximum errors 4…5 minutes. The default’s zero exact count is real: its Fajr is 1–2min later, sunrise 2–3min later, Dhuhr/Asr/Isha 1–2min earlier and Maghrib 2–4min earlier in these new months.
- For example NOAA-continuous-ceil has 207 exact/1070 within 1/max 4; it was not promoted posthoc.

### variable-temkin-known

**Recipe:** NOT exported default: variable-Temkin NOAA continuous counterhypothesis. **Sample:** All 365 Istanbul 2026 days.

**Compared markers:** Fajr, sunrise, Dhuhr, Asr, Maghrib/sunset, Isha. **Date treatment:** Printed date plus source +03 offset, matching Europe/Istanbul 2026.

- 553 of 1460 same-sign event-pair intervals contradict a single shared daily Temkin under the declared geometry/rounding.
- No new production recipe was selected; all sunrise/sunset values remain inexact.

Counts, definitions and SHA-256 evidence pins are recorded in [`validation.json`](validation.json). Historical `research/...` strings there are provenance identifiers, not links to files included in this public package. Raw reference calendars are deliberately not bundled; these hashes alone do not let a new reader independently rerun publisher accuracy. Contributions that add lawfully redistributable fixtures or reproducible, authorized acquisition procedures are welcome.

A later [shared-horizon feasibility diagnostic](COMMON-HORIZON.md) allows arbitrary daily common Temkin and arbitrary daily common sunrise/Maghrib horizon. Even this broader family is infeasible on at least **62/365** known days under nearest rounding (2 non-horizon failures plus 60 horizon exclusions). The result is conditional on the existing fixed point, NOAA geometry and uniform rounding; it identifies no replacement formula.

An [exhaustive event-specific rounding follow-up](ROUNDING-POLICIES.md) then tests all **729** globally fixed nearest/floor/ceil policies. None satisfies every known day in that relaxed family; each retains at least three exclusions. The closest cases include two fragile sub-1.3-second discrepancies and a December 17 shared-horizon separation of about 0.109°. No rounding policy or daily correction is selected, and the exported clocks remain unchanged.

A later [conditional table-plus-caution interpretation](TABLE-COMPONENT.md) raises known Istanbul 2026 agreement to **1,423/2,190 exact and 1,830 within one minute**, with a three-minute maximum. It derives one common 679.16-second value from the published table and historical 267 m example, then applies the separately stated caution. None of the fixed-ten-minute baseline's values worsens, but eleven worsen against the earlier variable experiment. Table caution inclusion and current production height remain unconfirmed, sunrise/Maghrib mismatches persist, and no fresh validation was obtained. This is a separate private diagnostic; the public default stays unchanged.

## Sources

- [Primary calculation book](https://namazvakti.com/documents/tr.1.pdf)
- [Primary technical explanation naming MICA](https://namazvakti.com/documents/Son_Teknoloji.pdf)
- [Primary Temkin derivation and Istanbul mean rule](https://namazvakti.com/documents/Temkin.MuddetiNV.pdf)
- [Primary definitions of distinct calendar markers](https://namazvakti.com/documents/VakitlerinAciklamalari.pdf)
- [Original Istanbul annual calendar endpoint observed in the research](https://namazvakti.com/Yearly.php?cityID=16741)

Source websites and institution names are cited for attribution, not affiliation. Public access does not automatically allow redistribution. The repository license covers only material identified by its license notices.

- Failed reconstructions are published as research evidence, not as a supported production prayer-time source. Raw publisher calendars are excluded from the code license and public snapshot.

## Useful contributions

- How exactly are MICA coordinates, apparent/true horizons and the historical 10-minute mean combined?
- What is the current Istanbul operational elevation/point and exact seconds-rounding sequence?
- Can a source-authorized reference with intermediate solar coordinates resolve the systematic morning/evening differences?

For a proposed numerical change, document the primary rule or bounded hypothesis, preserve the previous results, freeze the recipe and full forecasts before reading new references, and report every planned date, missing value and regression. Keep coordinate/height provenance independent of timing residuals. Do not promote a city-specific fit to a universal method.
