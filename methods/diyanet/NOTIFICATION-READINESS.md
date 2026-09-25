# Chronology checks and notification readiness

**The default northern calculator now flags reversed event order without changing any calculated time. It remains research-only and notification eligibility stays false.** This closes a quality-reporting gap; it is not an improvement in institutional minute agreement.

## What changed in the public entry

`calculate(options)` with the default or explicit `north-missing-window` variant now calls [`calculateMissingWindowReviewed`](implementation/missing-window/quality-model.mjs). The adapter checks adjacent events within each returned row, using both raw epochs and rounded UTC instants. Equality is allowed, including the inherited Asr=Dhuhr substitute.

A reversal adds an `adjusted-event-ordering-exception` quality flag to the later-named event and its day. The event's `status` becomes `ordering-exception`; `statusBeforeQualityReview` preserves the original value. The flag includes both UTC instants and signed raw/rounded gaps, with `modelTimeAltered: false`. The annual `qualityReview` counts checked/unavailable pairs and exceptions. An unavailable pair is not treated as a pass.

The mapped [`calculateMissingWindowCalendar`](implementation/missing-window/model.mjs) remains available as the unchanged named research entry. No mapped astronomical or seasonal module changed. The quality adapter neither clamps Asr to Dhuhr nor enables a notification. Callers should retain UTC/ISO dates and inspect quality metadata rather than scheduling from `HH:mm` alone.

## Complete known-year audit

The audit covers the same **28 already exposed northern city-years**, with **61,320 planned event fields**. It finds **17 raw Dhuhr→Asr reversals**; **eight** remain a one-minute reversal after rounding. The existing `north-reviewed` variant flagged this class of issue on its older seasonal recipe, but the selected missing-window route previously lacked that adapter. All 17 are now reported by the default route.

Seven raw-only cases occur in Rovaniemi on 19–25 December 2027. They are easy to miss because Dhuhr and Asr display the same minute. A rounded example is Bodø on 5 January 2026: Asr displays one minute before Dhuhr. These are generated model examples, not new publisher observations or proof of an institutional correction.

The public-to-archive bridge checks **every one of the 61,320 event objects**: raw epochs, UTC/ISO timestamps, civil dates, clocks, astronomical diagnostics and existing reasons remain identical after removing only the documented quality additions. All unaffected objects remain identical in full. The focused tests also check the default route, raw-only reversals, allowed fallback equality, unchanged values and strict inputs; the existing offline test still passes without network/reference access.

## The large Isha differences are a separate source-date question

The [official Diyanet explanation of Isha's period](https://kurul.diyanet.gov.tr/tr/fetva/yatsi-namazi-ne-zamana-kadar-kilinabilir/0193c42d-4da2-7455-c923-9bdbc23c351c), dated 12 July 2017, places it after the evening period and before imsak. That supports a necessary sequence check. It does **not** specify how a calendar row serializes a time after midnight, or whether a source `00:00` can mean something other than literal midnight.

Our generated calendars contain **85 Isha events on the following civil date**: 44 in Reykjavík 2026 and 41 in Bergen 2027. Every generated Isha is after its row's Maghrib and before the following Fajr, including 28 year-end checks using an explicitly synthetic next-year model output. This verifies model chronology; it does not validate the publisher's intended date.

For the source calendars, 10,184 night-order triples can be compared. Eight Isha values remain ambiguous `00:00`; 28 final rows lack a following source-year Fajr and remain unchecked. The primary printed-date interpretation has 77 order conflicts: 38 in Reykjavík and 39 in Bergen. The separately declared next-day interpretation has none. That is supporting consistency evidence for the existing interpretation, not a newly confirmed timestamp contract or a new accuracy gain.

| Existing source comparison | Exact / 61,312 | Within ±1 minute | Maximum |
|---|---:|---:|---:|
| Primary printed-date actual IANA | 53,215 | 61,190 | 1,441 min |
| Conditional Isha next day | 53,291 | 61,267 | 2 min |

Both scores and the eight unresolved fields remain unchanged. Under the conditional interpretation, 45 two-minute differences remain: 29 in Narvik, ten in Frankfurt, and one each in six other city-years. Of these, 38 are autumn transitions. Neither the ordering flags nor shifting a date resolves those numerical differences.

## Remaining limits

No new numerical candidate was selected in this audit. Previously rejected adjustments remain rejected. Production coordinates, exact seasonal interpolation/rounding, source event-date semantics and high-latitude replacement policies are still incompletely established.

The added public adapter checks **within-row reversed order only**. It does not independently certify a prayer's physical occurrence, accuracy, appropriate religious policy, adjacent-year scheduling or notification readiness. The broader historical overnight check is separate research evidence. Passing an ordering check must not be interpreted as authorization to enable notifications.

[Aggregate evidence and private artifact hashes](research/notification-readiness-2026-09-25.json) retain both date interpretations, all city totals, unresolved counts and verification scope. The same author performed the audit and public bridge; no independent-person review is claimed. Source calendars are not redistributed. The historical extraction/parity records remain preserved: their native missing-window entry is still checked, while new tests cover the intentionally added quality metadata.
