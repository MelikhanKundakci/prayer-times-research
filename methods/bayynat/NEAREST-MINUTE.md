# Uniform nearest-minute Bayynat experiment

**Rejected as a general replacement.** Fresh validation improves exact-match counts but creates three new two-minute errors. The ceiling default is unchanged; this explicit export is retained only to reproduce the research and its counterexamples.

This opt-in candidate changes **only final minute rounding**. The selected point, UTC12 solar sample, own USNO equations, −50′ horizon, 18° Fajr/Isha table markers and factor-one Asr table marker are unchanged. Neither the former ceiling rule nor nearest rounding is a confirmed institutional specification. Numerical table columns remain distinct from legal prayer windows.

## Run it locally

```sh
node scripts/run.mjs bayynat --input methods/bayynat/examples/nearest-input.json
```

Use `variant: "point-utc12-h5over6-nearest"` with `date`, `latitude`, `longitude` and explicit IANA `timeZone`. The [input](examples/nearest-input.json) and [output](examples/nearest-output.json) are generated examples. The native export is [`calculateNearestCandidate`](implementation/nearest-candidate.mjs). Omitting the variant retains the old ceiling profile; `point-utc12-h5over6-ceil` explicitly selects it.

The existing mathematical domain and quality flags apply: 2000–2099, global coordinate bounds, a uniquely anchored solar carrier on the requested civil date, and explicit unavailable poles/tangencies. No high-latitude substitute is invented. Every unrounded event epoch and diagnostic is identical to the old recipe. Nearest-minute output is zero or one UTC minute earlier than ceiling; local date, clock and offset are recomputed from the resulting instant, including across DST or midnight. All outputs remain non-official, non-production and ineligible for automatic notifications.

The calculator needs no API, network, calendar file or external prayer library. It reuses the unchanged project [candidate model](implementation/candidate-model.mjs), with its numerical provenance intact.

## Known-data selection and counterevidence

Before this round's evaluation, the declared family was limited to ceiling, nearest and floor on the same raw geometry. The three already exposed constant-offset point-months give:

| Known source sample | Ceiling exact | Nearest exact | Nearest within ±1 minute |
|---|---:|---:|---:|
| Jakarta, April 2024 | 87 / 180 | 173 / 180 | 180 / 180 |
| Singapore, July 2024 | 82 / 186 | 183 / 186 | 186 / 186 |
| Tokyo, November 2024 | 69 / 180 | 126 / 180 | 180 / 180 |
| **Total** | **238 / 546** | **482 / 546** | **546 / 546** |

Nearest corrects 264 previously unequal values and regresses **20** exact ones. The remaining values are 44 one-minute-late and 20 one-minute-early. The single two-minute discrepancy becomes one minute, not exact. Floor instead gives 307 exact and regresses 238 exact values, so it is not selected.

**The older timezone-conflicted development set contradicts a universal improvement:** under its separately stated fixed-source-offset interpretation, ceiling has 153/210 exact and nearest only 129/210. Under actual IANA offsets the same older cells give 17 versus 21 exact, with a 61-minute maximum still present. These Berlin/New York observations are retained separately and never pooled into the 546-cell clean comparison. Neither source clocks nor their UTC interpretation are silently changed.

The [public calendar frontend](https://www.bayynat.org.lb/prayer-time) submits point information and displays server clocks; the inspected client does not specify a seconds-to-minutes rule. Its page is distinct from the login at the prayer-time PDF-hosting subdomain. This candidate is data-informed quantization research, not a newly discovered religious or official rule.

## Prospective check

Both profiles, the complete 2031 forecasts for three points, parsers, request forms and evaluator were frozen at **2026-09-25 13:05:34 UTC** before three ordinary public-frontend requests. All declared months were acquired once and accepted by both parsers; no additional cities or fitted exceptions were selected after exposure. The 1,095 forecast point-days are **not** 1,095 observed days: only the declared 92 days / 552 event slots per model have new reference data.

| Fresh source sample | Ceiling exact | Nearest exact | Ceiling within ±1 minute | Nearest within ±1 minute |
|---|---:|---:|---:|---:|
| Tokyo, April 2031 | 87 / 180 | 113 / 180 | 180 / 180 | 177 / 180 |
| Cape Town, July 2031 | 117 / 186 | 163 / 186 | 186 / 186 | 186 / 186 |
| Quito, October 2031 | 95 / 186 | 178 / 186 | 186 / 186 | 186 / 186 |
| **Total** | **299 / 552** | **454 / 552** | **552 / 552** | **549 / 552** |

Nearest corrects 214 previously unequal values, regresses **59** exact values and worsens **62** absolute differences. Total absolute difference falls from 253 to 101 minutes, but the maximum grows from **one to two minutes**. There are no missing comparisons or model local-date disagreements in these samples.

The three new two-minute differences are Tokyo Fajr on **April 2, 7 and 12, 2031**. Ceiling is one minute early; nearest is two minutes early. The unchanged raw calculation is approximately 92–94 seconds earlier than the displayed source minute. That shows why rounding alone cannot solve the underlying mismatch; it does not establish which ephemeris, epoch or production convention the source uses. No city-specific or Fajr-specific correction is introduced.

These constant-offset zones isolate rounding and do not resolve the older DST/source-clock issues. Each printed clock was assigned to its printed Gregorian date in the requested actual IANA zone, without modulo, date shifts or source repair. Publisher UTC/date semantics remain unconfirmed. Inputs were Tokyo 35.68/139.68, Cape Town −33.9249/18.4241 and Quito −0.1807/−78.4678, with source elevation input zero; these are controlled points, not discovered official calculation coordinates or terrain heights.

An independent Python audit reconstructed every one of the 552 comparisons and all 22 summary groups, checked 828 original markers across two parsers, verified 64 frozen files, and confirmed identical raw geometry across all 6,570 full-year forecast event pairs. Those checks validate this comparison, not the institution's undisclosed algorithm. The [aggregate report and provenance hashes](research/nearest-2026-09-25.json) preserve the favorable and unfavorable results separately from the 546 known cells.

**Decision:** retain the existing ceiling default. The nearest export is an unrecommended research candidate, not a verified replacement. This decision does not establish ceiling as an official or universally accurate rule either.

## Verification and remaining questions

Independent review confirms identical raw geometry and public/private event parity on all 91 exposed days. Eighty-four additional synthetic point-days cover poles, DST, fractional offsets, date-line and year boundaries; unavailable events remain unavailable. Strict validation rejects fitted offset controls, getters and unknown fields. Public permission tests run with network, subprocesses, external libraries and reference files inaccessible.

```sh
node core/timezones/with-tzdata.mjs --test tests/bayynat-nearest.test.mjs
```

The rounding rule, production solar epoch, horizon and coordinate interpretation remain unconfirmed. The institutional role of distinct Asr and Isha table columns also remains unresolved. Better printed-minute agreement alone does not establish physical accuracy or legal prayer-window boundaries.
