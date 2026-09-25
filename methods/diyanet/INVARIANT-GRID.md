# Global input-grid sanity check (2027)

This is a **source-free calculation check**, not a comparison with Diyanet calendars or proof of worldwide coverage. It asks whether the current low-latitude and southern routes return internally coherent event objects across many timezone shapes, latitude extremes and the date line. It cannot tell us whether an institution uses the supplied coordinates, formulas or event-date convention.

The [runnable scan](research/invariant-grid-2027.mjs) covers 18 illustrative points for all 365 dates of 2027 under each route's original and opt-in civil-row variant: **13,140 model-days and 78,840 planned event slots**. Inputs include city proxies in Africa, Asia, the Americas, Australia and the Pacific, half-hour and 45-minute timezones, DST zones, the UTC+14 date line, and synthetic points at 44.49°N and 59.9°S. They are explicitly **not verified Diyanet production points**. Northern seasonal routes are outside this scan and have separate audits.

The [complete result JSON](research/invariant-grid-2027.json) records every case and event's availability count. The scan checks that available ISO local offsets encode the same UTC instant; adjusted Dhuhr stays on the requested civil day; and adjacent raw and rounded event instants remain in order. It does not impose an event date from a publisher's `HH:mm` row.

| Check across the two variants | Count |
|---|---:|
| Model-days completed | 13,140 / 13,140 |
| Available event slots | 77,776 / 78,840 |
| Explicitly unavailable event slots | 1,064 / 78,840 |
| Raw or rounded adjacent-order reversals | 0 |
| UTC/ISO-offset or adjusted-noon-date mismatches | 0 |
| Exceptions thrown | 0 |

The **1,064 unavailable slots are not successful prayer times**. They are Fajr/Isha twilight crossings absent under these fixed daily geometries at Ushuaia, South Georgia and a synthetic 59.9°S point. Because each point is run twice, this total counts the same locations under both model variants; it is not 1,064 independent city/date observations. For Ushuaia, each variant leaves 83 Fajr and 75 Isha dates unavailable. No southern high-latitude religious replacement rule is implemented by these routes. Supplying an arbitrary zero or nearest clock would hide the gap rather than solve it.

An additional **retrospective** check against the already archived [Diyanet Ushuaia 2027 calendar](https://namazvakitleri.diyanet.gov.tr/es-ES/11195/tiempo-de-oracin-para-ushuaia) finds `00:00` in exactly those same **83 Fajr and 75 Isha date sets** using the earlier government-port proxy point. There are no source-only or model-only dates in those two sets. The archived 365-row response is pinned privately by SHA-256 `0687120c2498305793b5e12b94f9010f52d99adf41c36acbb54160fdd4e41d35`; it is not redistributed. This alignment supports treating the zeros as **unresolved source values rather than midnight alarms**, but Diyanet has not defined `00:00` as a missing-value sentinel in the inspected source. It cannot certify the model's astronomical or religious rule.

Run from the repository root with the bundled IANA timezone data:

```sh
node core/timezones/with-tzdata.mjs methods/diyanet/research/invariant-grid-2027.mjs
```

The script regenerates its JSON report in place. It uses only the exported offline model, chosen proxy points and local timezone rules; it never reads an official calendar. Its result should inform safety and future source selection, **not** be entered in an institutional accuracy denominator. To claim reliable high-southern coverage, we need a published Diyanet policy and a complete independent calendar at a suitable place, including the missing-twilight dates and explicit event-date semantics.
