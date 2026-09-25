# Indonesia — Kemenag worked-example reconstruction

Own astronomy following the worked recipe in a Kemenag Ephemeris Hisab Rukyat book. It is not a verified reproduction of the entire central Bimas Islam service, nor a universal Indonesian or Muhammadiyah profile.

**Research only — no official endorsement, universal religious coverage or production-ready accuracy is claimed.**

## Run the selected example

Run from the repository root:

```sh
node scripts/run.mjs kemenag --example
```

The checked-in [example input](examples/input.json) and [computed output](examples/output.json) are numerical examples, not original publisher reference data.

```json
{
  "date": "2026-06-21",
  "latitude": -6.2,
  "longitude": 106.8,
  "timeZone": "Asia/Jakarta",
  "preset": "kemenag-2026-book-example"
}
```

The uniform entry is [`calculate(options)`](index.mjs). **Default:** strict Kemenag book-example recipe.

The method index calls the declared selected entry. Use the example command for a complete valid input; method-specific fields are not silently inferred from religious labels.

### Runnable implementations

The underlying signatures remain method-specific. These links point to the code shipped in this snapshot.

| Variant | Module / export |
|---|---|
| `strict` | [`calculateIndonesiaStrict`](implementation/api.mjs) |

### Inputs and boundaries

- **book-example strict wrapper:** `calculateIndonesiaStrict(input)`. Input: date,latitude,longitude,timeZone,preset: kemenag-2026-book-example. Limits: 2000–2099; −12…8° latitude,94…142° longitude; Asia/Jakarta, Asia/Makassar or Asia/Jayapura.

A supported input range is a mathematical contract, not a statement that every location/year in it has been institutionally validated. Check event status, reason and date as well as the clock.

## How the calculation works

For fixed declination δ, cos(H)=(sin(h)−sin(φ)sin(δ))/(cos(φ)cos(δ)); transit±H/15 hours gives a height marker. Transit uses the equation of time and longitude. Continuous variants instead solve h_sun(t)−h_target(t)=0 with direction/domain checks. Asr shadow targets and ephemeris epochs differ by recipe.

- Daily own USNO declination/equation of time replace the book’s ephemeris lookup: UTC05 for WIB, UTC04 for WITA and UTC03 for WIT.
- Fajr 20°, Isha 18°, sunrise/sunset−1°, Duha+4.5°, Asr shadow factor 1.
- The documented operation order is ceil the raw minute then +2 for Fajr, Asr, Maghrib, Isha and Duha; Dhuhr ceil+3; sunrise floor−2; Imsak is the published Fajr minus 10 minutes.
- Muhammadiyah’s primary explanation adopts Fajr 18°. A numerical 18° sensitivity is not a complete Muhammadiyah implementation or an alias for every Indonesian calendar.

## Special rules and unresolved semantics

- The book’s worked recipe is better evidenced than its identity with current production software. Local markaz, point selection, heights and regional policy remain unknown.
- The two regional calendar comparisons were reconstructed from indexed official-PDF text transcripts; raw PDF bytes and visual verification were unavailable. The book PDF itself was obtained and visually checked.
- BauBau Gregorian dates were tied to the published Ramadan-start decision; do not treat that mapping as an unspecified perpetual-calendar rule.

## Historical validation

These are archived research comparisons, **not results of the public snapshot test suite**. Exact means the displayed minute matches under the stated date interpretation. “Non-exact” is the fraction of comparable values that differ at all; “>1 min” is the fraction outside ±1 minute. Neither is a measured error rate of religious observance. Missing or ambiguous values are excluded from these percentages and remain visible in the last column.

| Study / recipe | Exposure | Exact / comparable | Non-exact | Within ±1 min | >1 min | Max | Excluded / planned |
|---|---|---:|---:|---:|---:|---:|---:|
| book-example | published worked example | 8/8 (100.00%) | 0.00% | 8/8 (100.00%) | 0.00% | 0 min | 0/8 |
| pekanbaru-development | known development transcript | 212/240 (88.33%) | 11.67% | 240/240 (100.00%) | 0.00% | 1 min | 0/240 |
| baubau-new-transcript | new official-source text after freeze; weaker original-artifact provenance | 220/240 (91.67%) | 8.33% | 240/240 (100.00%) | 0.00% | 1 min | 0/240 |

### book-example

**Recipe:** book-example strict wrapper. **Sample:** Jakarta 17 August 2026.

**Compared markers:** Eight book markers including Imsak and Duha; Imsak is derived. **Date treatment:** Displayed-minute comparison; source does not supply event-specific UTC instants.

### pekanbaru-development

**Recipe:** book-example strict wrapper. **Sample:** Pekanbaru 30 days.

**Compared markers:** Eight markers including derived Imsak and Duha. **Date treatment:** Displayed-minute comparison; source does not supply event-specific UTC instants.

- Indexed official text, not a verified original PDF binary.

### baubau-new-transcript

**Recipe:** book-example strict wrapper. **Sample:** BauBau March 2025,30 days.

**Compared markers:** Eight markers including derived Imsak and Duha. **Date treatment:** Displayed-minute comparison; source does not supply event-specific UTC instants.

- Do not describe this as a visually verified original-PDF holdout.

Counts, definitions and SHA-256 evidence pins are recorded in [`validation.json`](validation.json). Historical `research/...` strings there are provenance identifiers, not links to files included in this public package. Raw reference calendars are deliberately not bundled; these hashes alone do not let a new reader independently rerun publisher accuracy. Contributions that add lawfully redistributable fixtures or reproducible, authorized acquisition procedures are welcome.

## Sources

- [Primary Kemenag ephemeris book and worked calculation](https://gerubok.kemenagbelitungtimur.id/uploads/ebook/1790043937_ebook_ephemeris_hisab_rukyat_2026_69566ee622db8.pdf)
- [Primary Muhammadiyah explanation of its different Fajr criterion](https://muhammadiyah.or.id/2021/03/waktu-subuh-muhammadiyah-kriteria-18-derajat/)

Source websites and institution names are cited for attribution, not affiliation. Public access does not automatically allow redistribution. The repository license covers only material identified by its license notices.

## Useful contributions

- Can Kemenag provide current production ephemerides, point/height definitions and rounding order as a reusable specification?
- Can original regional PDF bytes be secured with clear reuse rights and independent date verification?
- Which additional Muhammadiyah rules are needed beyond a Fajr angle change?

For a proposed numerical change, document the primary rule or bounded hypothesis, preserve the previous results, freeze the recipe and full forecasts before reading new references, and report every planned date, missing value and regression. Keep coordinate/height provenance independent of timing residuals. Do not promote a city-specific fit to a universal method.
