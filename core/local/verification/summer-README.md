# Independent optional summer-profile verification

This directory contains synthetic model fixtures for the explicit opt-in profile `local-northern-seasonal-v1`. It verifies the declared local calculation; it does **not** measure agreement with an institution's calendars or establish religious approval. No prayer-calendar clock rows, API responses, production coordinates or fitted corrections are included. The existing profile remains separate.

## Independent implementation and frozen values

The [Python generator](summer-oracle.py) uses the independently written sibling physical and northern oracles. It imports no JavaScript. It calculates actual neighboring UTC horizons, the anchor quotient, fixed annual night-fraction candidates, the one-sided 20-minute smoothstep, missing-sign preflight, year-boundary preflight and chronology.

The twelve complete annual fixtures were frozen **before the new JavaScript summer implementation was inspected or compared**. The public [fixture](summer-fixtures.json) preserves those exact bytes, SHA-256 `be6bd66341d1d5e4f4a133453741519dbb2ea42d666614ba999100c02b8ab803`. Its rows include selected Fajr/Isha instants, mode, weight and candidate for every owned date, including explicitly blocked cases. Numeric mode codes are defined in the file; a transition or night-fraction value is an estimate, not a raw calculated crossing.

The development generator's SHA-256 was `5996ffec89bb4233d24cdad71e6412b2b654155d8cd75fa9fe346ec9cad61a4b`. The public generator has SHA-256 `2ec63e235913f3ba5ae6924a5745f06d1145166157e503f7143effb5c219a185`: only dependency/output paths and removal of the private freeze-manifest writer differ. All Python function ASTs are identical. The public verifier's exported function body is also unchanged from the successful development comparison; only imports, fixture name and private report-file output were adapted. No numerical function or expected value was retuned during publication.

## Cases and results

The twelve cases are Bordeaux 2027; Frankfurt 2027 and leap year 2028; Berlin 2027; Edinburgh 2027; Oslo 2027 as an annual horizon-failure control; both ±180° representations at 50°N in Asia/Anadyr; a synthetic 50°N/−74° point in America/New_York; exactly 44.5°N/15°E in Europe/Berlin; and the Frankfurt point in supported edge years 2002 and 2097. The labels identify mathematical inputs, not official calculation points.

The retained comparison passes:

| Check | Count |
| --- | ---: |
| Owned days across all twelve cases | 4,381 |
| Compared selected Fajr/Isha timestamps | 8,032 |
| Compared candidate timestamps | 8,032 |
| Explicitly blocked twilight fields, all in Oslo | 730 |
| Synthetic blend endpoint/midpoint/±1 ms cases | 14 |
| Raw, unmodified year-boundary events | 44 |
| Fully capped real neighbors of missing-sign windows | 22 |
| Full-night UTC-order checks | 4,027 |
| Full six-event UTC-order checks | 4,016 |

Eleven annual contexts are available; Oslo remains blocked because its annual selected-horizon nights fail the five-hour requirement. The largest selected-time difference between the independent implementations is below **0.000043 seconds**, and the largest candidate difference below **0.000037 seconds**. These are numerical consistency differences within shared equations, not observed timing accuracy. The verifier uses a 0.1-second timestamp tolerance and a `1e-7` blend-weight tolerance.

The verifier also reproduces each case's largest consecutive daily change measured relative to its own upper transit, including the exact date pair and branch types. It reports these changes without inventing a post-comparison acceptance threshold. For example, Frankfurt 2027 Fajr's largest change is approximately −4.037 minutes from April 23 to 24, and Isha's is approximately +3.094 minutes from April 6 to 7; both are within the declared smooth transition. A daily phase change is not an error against an external clock.

## What the checks establish

Every night uses real adjacent UTC instants, not a same-row clock plus 24 hours. The fixed quotient is taken from the source-inspired anchor convention. Its use throughout the year and the effective-night Fajr factor `11/8` are explicit local-model choices; `11/8` is not claimed to implement an unspecified two-degree time conversion.

The one-sided blend keeps selected Isha no later than its candidate and selected Fajr no earlier than its candidate. With `0 < q < 1/3` and selected horizon-night duration `H > 5 hours`, the candidate gap is:

```text
Fajr candidate − Isha candidate = H × [1 − (19/8)q] > (5/24)H
```

Thus the model's candidate gap exceeds 62.5 minutes. The verifier independently checks the premises and full selected night order, rather than relying on that inequality alone. It also checks every owned cycle's six selected events after the existing minute margins.

The preceding December 31 Isha, owned January 1 Fajr, owned December 31 Isha and following January 1 Fajr must all remain raw and unmodified. Each Fajr and Isha missing-root window is checked separately; its neighboring real roots must already be fully capped. This prevents switching from an unfinished blend directly to an absent-sign estimate.

## Run and regenerate

From the repository root:

```sh
TZ=UTC node core/timezones/with-tzdata.mjs core/local/verification/summer-verify.mjs
python3 core/local/verification/summer-oracle.py
```

The JavaScript module exports synchronous `verifyLocalSummer()`. Its returned object contains compact totals plus per-case mode counts and maximum daily phase changes. Direct CLI use prints only the totals and does not rewrite the fixture. The public oracle test imports that same verifier.

Python regeneration uses the system `zoneinfo` database; the frozen values used tzdb 2026c.1.0. The JavaScript check used Node 26.7.0 / ICU 78.3 with pinned tzdb 2026d. Neither generator nor verifier requests prayer calendars or downloads timezone data. Investigate legitimate timezone-rule differences before replacing a regenerated fixture.

Both implementations use the published USNO approximation. Independent code and root searches detect implementation errors but are not independent observations of the Sun. A bounded numerical grid is not an all-roots proof, a physical atmosphere/terrain model, a guarantee over every supported input, or a completed specification of an institution's seasonal policy.
