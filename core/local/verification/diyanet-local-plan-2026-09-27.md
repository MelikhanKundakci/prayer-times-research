# Diyanet-inspired local seasonal verifier plan — 2026-09-27

This verification is declared before inspecting or consuming output from the new seasonal implementation. It is a software behavior check against the repository's documented candidate equations and admission gates. It does not establish equivalence to Diyanet's complete calculator, current national calendars, fiqh authority, or observed accuracy.

## Fixed scope and inputs

- Candidate profile: `diyanet-local-seasonal-spa-v1`.
- Years: complete Gregorian years 2026, 2027, 2028 for Frankfurt (`50.1109, 8.6821`, `Europe/Berlin`), Berlin (`52.52, 13.405`, `Europe/Berlin`), Bordeaux (`44.8378, -0.5792`, `Europe/Paris`), and Edinburgh (`55.9533, -3.1883`, `Europe/London`). Bordeaux is above the 44.5°N threshold and is included as a full seasonal test point. Keep the exact 44.5°N policy boundary as a separate focused test.
- Oslo (`59.9139, 10.7522`, `Europe/Oslo`) is a winter-release control: assess only dates admitted by an explicit winter-release proof, and retain blocked/unsupported dates as reported outcomes. Do not infer a full-year winter policy from this bounded control.
- Tromsø (`69.6492, 18.9553`, `Europe/Oslo`) is an unavailable-horizon control. No absent sunrise/sunset or Maghrib may be synthesized.
- Istanbul (`41.0082, 28.9784`, `Europe/Istanbul`) is an ordinary Diyanet-method control for 2027; selected values must match the existing strict SPA point profile where the ordinary profile is available.
- Focus the exact 44.5° latitude boundary and immediately adjacent representable inputs, plus the dates immediately before, on, and after each reported seasonal-entry, seasonal-return, and annual seam boundary.
- Record runtime IANA timezone database version, implementation revision/hash, verifier revision/hash, and source profile ID in the JSON report.

## Independent summer oracle

The verifier may use the shared low-level SPA solar solver only to obtain raw physical roots and transit. It must independently reconstruct the annual ratio and candidate times from those roots; it must not call the seasonal replacement selector, the implementation's summer-context/annual-q helper, or its candidate/interpolation helper as the expected-value oracle.

For each complete source year and location, independently calculate the annual night fraction `q` from the last real Fajr before a single contiguous missing-Fajr interval, or from June 21 when no Fajr is missing. Specifically, `q = (F − M)/(3H)` where `M` is the preceding selected Maghrib and `H` is that selected sunset-to-following-sunrise night; this is an anchor ratio, not an annual average. Keep the anchor and all inclusion/exclusion counts and denominator visible. Independently reconstruct raw seasonal candidates as `I = M + qH` and `F = R − (11/8)qH`; use 20 minutes of cubic smoothstep (`3x² - 2x³`) from raw geometry for the seasonal selection. Check every candidate and selection trace against the independent calculation. Where the strict SPA point event already exists, separately assert it remains unchanged in the public day output; report its published-criterion provenance. Any actual replacement/blend output must match its independent event expectation and provenance.

The four unaffected selected events must be independently recalculated from raw SPA roots and the previously recorded Diyanet margins: sunrise −7 minutes, Dhuhr +5 minutes, factor-one Asr +4 minutes, Maghrib +7 minutes. Ordinary available Fajr/Isha must preserve their strict ordinary SPA point outputs unless a documented source incompatibility is surfaced as a failing result. Include the new seasonal event status, raw root, annual `q`, candidate, blend weight, selected instant, and reason for every tested date.

## Fixed acceptance measurements

- Daily chronology: check Fajr < sunrise < Dhuhr < Asr < Maghrib < Isha for complete same-day schedules, and check Maghrib < Isha < next Fajr < next sunrise for each complete night. Do not modulo times by 24 hours; compare absolute UTC instants.
- Coverage: report complete days, each event's calculated/estimated/unavailable/blocked counts, and the exact day list for every missing or blocked result. Tromsø must preserve unavailable horizons and expose incomplete coverage.
- Transition smoothness: for each Fajr and Isha seasonal event, measure the UTC event phase relative to that source date's raw solar transit, then compare consecutive source-date phases. The declared maximum absolute adjacent phase change is 10 minutes through seasonal entry/return and at the 2026→2027 and 2027→2028 seams. If it fails, investigate and report the failure; do not loosen this threshold to obtain a pass. Also publish the actual maxima and dates.
- Annual ratio: report q, eligible/excluded/unresolved counts and denominator per location/year. Ratios and candidates must match the independent reconstruction within 1 second after retaining full precision in diagnostics; selected event output must match independently applied 20-minute smoothstep within 1 second.
- Boundary behavior: assert the 44.5° policy boundary and neighboring values; report status immediately before, at, and after all detected entry/return boundaries. Ordinary available event outputs must be identical to the strict SPA point profile. Any eligible seasonal replacement must carry an estimated provenance; unavailable or blocked events remain null and explicitly labeled.
- Winter-release extension: verify only the separately proven trigger and permitted dates. Independently check the stated annual candidate/extrema proof and require every relevant raw/selected daylight and intervening adjacent-night gate to be strictly greater than five hours (300 minutes), using actual −18°/−16° twilight and strict event bounds. Preserve the annual and direct raw-event envelopes and verify their exact neighbor-date predicates. Do not treat winter release as available absent an independently verified proof object; preserve all other dates as unavailable/blocked. The implementation agent's proof is not the independent oracle.

## Predeclared plan clarification — 2026-09-27

Before inspecting implementation output, the parent clarified that its earlier shorthand “daily 3 horizon gates” meant the several relevant current/neighbor horizon checks, not a three-hour duration. The winter threshold is strictly greater than five hours, matching the proof API's documented 300-minute gate. This amendment corrects the duration while retaining the requirement to check every relevant raw and selected horizon and the annual/direct envelopes.

After identifying two planning-description mistakes, the parent clarified that Bordeaux at 44.8378°N is above the 44.5°N threshold and that `q` is the single anchor-night ratio described above, not a mean across annual days. This note records the corrections; the already declared city/year scope and independent verification intent are unchanged.

## Reproducibility and failure handling

The verifier writes `core/local/verification/diyanet-local-2026-09-27.json`, including all scope points, year/date counts, maximum phase changes with dates, chronology violations, missing/blocked event details, independent q/candidate deltas, winter proof status, runtime/tool/tzdata versions, and SHA-256 hashes of the numerical verifier, this plan, and the implementation file as consumed. A missing requested city-year row, calculation error, duplicate row, or hidden zero is a verification failure. Keep failures in the report with their details; do not replace failing values with successful fallbacks.
