# Prayer Times Research

**Open, offline implementations and evidence for Islamic prayer-time calculations.**

We are building a transparent foundation for an ad-free, free-to-use prayer-time app and for anyone who wants to improve the underlying calculations. The long-term goal is reliable support for Muslim communities around the world, with documented differences between institutions, calculation conventions, and schools of jurisprudence.

This repository makes the research useful to contributors: readable calculation modules, runnable examples, per-method explanations, measured error rates, source references, and specific unanswered questions.

**Status: research preview.** Several implementations closely match the reference calendars tested so far. Others are exploratory or have known failures. Accuracy belongs to a particular method, parameter set, place, date range, and interpretation of the source. The project does not claim a perfect worldwide algorithm or endorsement by the institutions named here.

## Start here

- **Use a calculation:** choose a method below, read its input contract, and run its example.
- **Understand the mathematics:** [calculation architecture](docs/ARCHITECTURE.md) and [astronomical conventions](docs/ASTRONOMY.md).
- **Assess accuracy:** each method has a `validation.json` and a README explaining its denominators, limits, and source coverage. Read the [validation protocol](docs/VALIDATION.md) before comparing percentages.
- **Help improve a method:** start with its open questions and the [contribution guide](CONTRIBUTING.md).
- **Understand the religious scope:** read [methods, institutions, and jurisprudence](docs/SCOPE.md).

## Quick start

Use Node.js **26.7.0**, the runtime used for the published export checks, on a little-endian system. JavaScript modules use ESM. The repository includes a pinned ICU timezone bundle, version **2026d**, and the launchers verify that it was loaded.

```sh
git clone https://github.com/MelikhanKundakci/prayer-times-research.git
cd prayer-times-research
npm ci
npm test

# List the available method families.
node scripts/run.mjs --list

# Run a documented input using the bundled timezone data.
node scripts/run.mjs diyanet --example
node scripts/run.mjs moonsighting-committee --example
node scripts/run.mjs shia-angles --example

# Supply an explicit input object instead.
node scripts/run.mjs diyanet --input methods/diyanet/examples/input.json
```

The first dependency installation requires internet access. Calculations and the public test suite then run locally, without API keys, a server, or requests for prayer calendars. The Adhan dependency is retained only for explicitly identified historical comparison branches; see [third-party notices](THIRD_PARTY_NOTICES.md).

Examples return the native research result, including actual event dates, UTC instants where supplied by the method, missing-event reasons, and diagnostic metadata. An annual result is previewed by default; add `--full` for the entire result. Different methods deliberately retain different event names when the underlying religious or source meaning is unresolved.

## Methods

<!-- METHOD_TABLE_START -->
| Method family | What is included |
|---|---|
| [Moonsighting Committee](methods/moonsighting-committee/) | Own USNO solar geometry, seasonal twilight rules, both Asr shadow factors, and a tested rounding hypothesis. |
| [Diyanet](methods/diyanet/) | Separate northern seasonal, lower-latitude, and southern research models; the latest northern seasonal-anchor experiment. |
| [Umm al-Qura](methods/umm-al-qura/) | Angle-based Fajr and interval-based Isha, including the stated Ramadan-calendar convention. |
| [Egyptian Survey convention](methods/egyptian-survey/) | Own 19.5°/17.5° research geometry and an explicitly identified library baseline. |
| [UAE / Awqaf](methods/uae-awqaf/) | The permissively exportable V2 geometry experiment with width, height, atmosphere, and refraction assumptions. |
| [Indonesia / Kemenag](methods/kemenag/) | A published worked-example reconstruction; the scope of an 18° Fajr comparison is stated separately. |
| [Oman / MARA](methods/oman-mara/) | An empirical regional NOAA-based candidate, with its validation and unconfirmed parameters. |
| [Banuri Town](methods/banuri-town/) | Published 18°/18° and Hanafi Asr rules; unresolved Zawal/Dhuhr semantics remain explicit. |
| [Malaysia / JAKIM](methods/jakim/) | Single-point and multiple-point zone models, Selangor's two-point hypothesis, and a separate Kedah map interpretation. |
| [Singapore / MUIS](methods/muis-singapore/) | Own solar calculations at a representative point, with documented rounding and remaining discrepancies. |
| [FCNA recommendations](methods/fcna/) | Named 15°/15° and 13°/13° recommendation profiles, a physically reviewed Asr solver, and an opt-in two-event Roseville publisher experiment. |
| [Shia angle profiles](methods/shia-angles/) | Separately named Tehran, Leva, and ARC parameter profiles using own USNO or NOAA geometry. |
| [Bayynat / Fadlallah](methods/bayynat/) | A source-table reconstruction with explicit civil-date handling and unresolved marker meanings. |
| [Fazilet](methods/fazilet/) | A regional Temkin/horizon and event-rounding hypothesis, with independent comparisons. |
| [Türkiye Takvimi](methods/turkiye-takvimi/) | A deliberately narrow Istanbul experiment and its negative results, retained as an open research problem. |
<!-- METHOD_TABLE_END -->

These are **15 research families**, not 15 religions or a complete list of Islamic traditions. A family can contain several versions or parameter profiles; this export has 23 selected native entry points. Additional profiles still need independently verified specifications and evidence; see [coverage still to establish](docs/ROADMAP.md#coverage-still-to-establish).

## What the accuracy numbers mean

The strongest results are useful, but their scope matters. Examples from the research record include:

- **Moonsighting Committee:** 5,117/5,117 reference fields matched in two additional city-years obtained after fixing both the formula and timezone data. Both Asr variants are part of the seven-field reference set.
- **Diyanet northern seasonal candidate:** 6,145/6,568 compared fields matched exactly in three subsequently acquired 2027 calendars; all compared fields were within one minute **under the conditional next-day interpretation of Isha**. Two original `00:00` values remain unresolved. Bremen lost 34 exact matches relative to the baseline. A reused Vienna response is reported separately.
- **Selangor two-point hypothesis:** 1,922/2,020 previously unseen reference fields matched exactly, with all remaining fields within one minute. The 176 fields exposed before the formula freeze are excluded from this particular unseen-field result and reported separately.
- **Roseville-specific 15°/15° experiment:** an opt-in fixed-UTC12/ceil calculation raised exact agreement from 70/122 to 90/122 in two same-publisher months acquired after its separate freeze. All 122 were within one minute. It remains restricted to one unconfirmed address-proxy point and two twilight starts; [FCNA's method page](methods/fcna/) reports development regressions and the separate generic model.
- **Diyanet point diagnostic:** fitting one fixed point per city from selected 2026 observations improves the unchanged model's Berlin/Stockholm 2027 agreement from 3,862/4,380 to 4,257/4,380. This is retrospective transfer on already exposed calendars, not fresh validation or discovery of official coordinates; 69 previously exact values regress. See the [study and its remaining contradictions](methods/diyanet/RESEARCH-ROUND-2.md) and the [offline diagnostic tool](methods/diyanet/diagnostics/README.md).

These are historical research measurements, not results freshly downloaded by `npm test`. Original publisher calendars are not redistributed in this repository. Public tests cover the exported implementation, examples, structural invariants, and comparison semantics. The provenance and method documents distinguish those checks from institutional-calendar validation.

**“Exact” means the same published minute, not proven second-level accuracy.** A one-minute mismatch can arise from a different calculation point, ephemeris, rounding rule, horizon model, or institutional convention. An astronomically more precise solver can reproduce a publisher's calendar less accurately.

## Repository layout

```text
methods/<family>/
  README.md             Method, equations, rules, limits, evidence, and open questions
  index.mjs             Small public entry point; no new astronomical formula
  implementation/       The method's calculation modules and named variants
  validation.json       Machine-readable historical accuracy and provenance
  examples/             Runnable input and generated model-output example
core/                   Shared solar geometry and pinned timezone resources
validation/             Explicit wall-clock comparison utilities
tests/                  Public regression, invariant, and validation-contract tests
scripts/                CLI, test, comparison, and repository-integrity tools
docs/                   Architecture, scope, validation, and research roadmap
provenance/             Export mapping, hashes, and extraction verification
LICENSES/               Third-party license texts and attribution
.github/                CI and contributor issue/PR templates
```

The calculation code was extracted from a larger research workspace. Numerical modules are kept traceable through [source mapping](provenance/source-map.json); import-path changes and any small extraction adaptations are recorded. The original workspace's bulk calendars, downloaded pages, PDFs, HTTP headers, and internal work records are outside this public export.

## Help us close the remaining gaps

The most useful contributions combine a clear source, an explicit hypothesis, and a reproducible comparison:

1. Confirm **production coordinates, horizon settings, rounding, and seasonal transition rules** for a named institution.
2. Supply **lawfully shareable reference data** with complete dates, timezone meaning, event definitions, and provenance.
3. Explain **high-latitude and post-midnight conventions**, including what missing or `00:00` fields mean.
4. Review the **religious meaning** of markers such as Zawal, Maghrib, shared prayer windows, and observation-based Fajr.
5. Add independent numerical implementations or help port verified methods to mobile platforms while preserving the reference behavior.

See the [roadmap](docs/ROADMAP.md), [contribution guide](CONTRIBUTING.md), and each method's open questions. Contributions from astronomers, developers, mosque communities, scholars, and calendar publishers are welcome. Please keep discussions respectful and specific to the named evidence and convention.

## License and project direction

Original project code and documentation are available under the [MIT License](LICENSE), with separate [third-party notices](THIRD_PARTY_NOTICES.md). Original reference publications retain their respective rights; a publicly accessible calendar is not automatically an openly licensed dataset. The separate GPL-dependent UAE V3 experiment is described as historical research but is not included in this export's runtime or results claimed for V2.

The planned app is intended to be free, ad-free, and donation-supported. This repository currently focuses on transparent calculations and validation; it is not a finished Android/iOS app, a hosted API service, or a religious ruling.
