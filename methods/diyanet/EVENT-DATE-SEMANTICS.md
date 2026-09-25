# Northern Isha: a clock is not yet an event date

**A source-table rule can identify an Isha instant conditionally, but the inspected publications do not establish a complete, universal event-date contract.** In 29 already exposed northern city-years, every nonzero Isha entry with a following source Fajr has exactly one occurrence between its row's Maghrib and the next row's Fajr. This requires an explicit assumption: the row identifies the evening prayer cycle. It does not turn a displayed `00:00` into a confirmed timestamp or resolve a missing next-year reference.

No calculator, default, original score denominator or notification flag changes in this study. No new calendar was acquired and no institution or authenticated API was contacted. This is a retrospective semantic audit, not an improvement in numerical accuracy. Machine-readable results are in [the aggregate](research/event-date-semantics-2026-09-25.json).

## What the published information supports

Diyanet's [Isha explanation](https://kurul.diyanet.gov.tr/tr/fetva/yatsi-namazi-ne-zamana-kadar-kilinabilir/0193c42d-4da2-7455-c923-9bdbc23c351c), dated 12 July 2017 and read again 25 September 2026, places its ordinary prayer period after the evening period and before dawn. This supports a night-order constraint. It does not state whether an annual table's date is the civil date of each event or the label of its evening cycle.

The inspected [Anchorage table](https://namazvakitleri.diyanet.gov.tr/tr-TR/8584/anchorage-namaz-vakitleri) and archived Bergen table give a Gregorian row date and six `HH:mm` labels without an individual Isha date, UTC offset or zero-status flag. The inspected [official API guide](https://awqatsalah.diyanet.gov.tr/files/56d83ac4-f7f5-4f6e-9b9e-b1ffeebf1b6a.pdf), printed pages 9–10, likewise illustrates clock strings and a row-level midnight date. It does not define after-midnight Isha ownership. See the broader [official-source audit](GLOBAL-SOURCES-2026-09-25.md).

There is a concrete reason not to treat that row-date offset as the event timezone: all 730 archived Reykjavík rows for 2026–2027 encode Gregorian midnight with `+03:00`, whereas their actual IANA local-midnight offset is `+00:00`. Their date labels and six clock fields agree with the previously verified fixtures. This is evidence about those exact response bodies, not a general claim that Diyanet uses an incorrect timezone. A row timestamp may serialize a calendar label; it is not a per-event instant.

The current publicly linked [home.js](https://namazvakitleri.diyanet.gov.tr/Assets/Themes/Diyanet/Scripts/home.js), retrieved 25 September 2026, parses clock labels into seconds and adds 24 hours only to the appended next-Imsak entry. Its current-day countdown uses browser-local clock fields; the inspected code has neither an Isha date-carry branch nor a `00:00` sentinel branch. This describes that widget only. It cannot certify annual-table date semantics or supply a reliable notification implementation.

## A precise conditional rule

For source row D and a supplied IANA timezone:

1. Treat Maghrib(D) and Fajr(D+1) as events on their printed civil dates. Require both to resolve uniquely.
2. Enumerate the Isha clock's UTC occurrences on nearby civil dates. This audit used D−1, D, D+1, D+2, retaining both occurrences of a folded local time.
3. Keep only occurrences strictly after source Maghrib(D) and strictly before source Fajr(D+1).
4. Report a conditional date only when one occurrence remains. Retain missing anchors, no occurrence, multiple occurrences and unresolved zero status explicitly.

This rule uses source rows alone after the stated timezone and evening-cycle assumptions. It uses no calculated prayer time, model error, fitted threshold or nearest-prediction choice. In this particular corpus, its nonzero results agree with the simpler rule “if Isha's clock precedes Maghrib's clock, use the next Gregorian date.” That simpler rule is not a general DST resolver.

## Complete source-only results

The corpus contains 29 annuals, 10,585 dates and 63,510 six-event clock fields. It extends the earlier [notification-readiness audit](NOTIFICATION-READINESS.md) with Anchorage and actual consecutive-year source joins; it is not 29 new validation sets.

| Case | Nonzero Isha with a complete source night | Conditional same date | Conditional next date | Unresolved `00:00` | Missing following source Fajr |
|---|---:|---:|---:|---:|---:|
| Reykjavík 2026 |359|321|38|6|0|
| Reykjavík 2027 |364|364|0|0|1|
| Bergen 2027 |362|323|39|2|1|
| Anchorage 2027 |363|290|73|1|1|
| Other 25 annuals |9,108|9,108|0|0|17|
| **Total** |**10,556**|**10,406**|**150**|**9**|**20**|

All 10,556 nonzero complete nights have exactly one surviving candidate. There are no contradictory or multiply resolved nights within this checked subset. All 63,510 original printed-date clock fields, including literal-clock resolution of the nine zeros solely for this mechanics check, have one IANA occurrence. This does not establish the publisher's intended date.

## What the public calendar page says about midnight and Asr order

The archived official [Bergen 2027 calendar page](https://namazvakitleri.diyanet.gov.tr/de-DE/15691/bergen-gebetszeiten) provides a useful direct check. Its annual HTML table has Gregorian and Hijri row labels followed by six plain `HH:mm` cells. It supplies no per-event date, timezone, status attribute, or documented sentinel meaning. For 5 June it prints Fajr `03:13`, Maghrib `23:02`, Isha `00:00`; 6 June prints Isha `00:01`. For 15–16 July it prints Isha `00:00` then `23:59`. These neighboring labels make literal midnight plausible under the evening-cycle interpretation, but the HTML does not distinguish literal midnight from a placeholder. No date carry or zero-status rule can be recovered from these rows.

The same-day source-clock order was also checked across all 17,155 city-days in the already exposed 47-annual Diyanet comparison corpus: no printed Asr clock precedes its row's Dhuhr clock, and 367 rows have equal displayed Dhuhr and Asr. Thus the 17 raw model reversals (eight still reversed after rounding) are not reproduced by the published minute labels. This separates a model chronology warning from source behavior; minute-resolution tables cannot reveal sub-minute source order or establish the underlying policy. The continuous-shadow Asr candidate reduced raw/rounded model reversals only to 13/3 while losing substantial clock agreement, so it remains rejected ([full diagnostic](GLOBAL-ASR-GEOMETRY.md)).

The 54 source night intervals crossing a DST offset transition also have unique conditional Isha occurrences. Nine available 2026/2027 source pairs close the December 31 → January 1 boundary for Berlin, Stockholm, Helsinki, Tromsø, Bodø, Kiruna, Reykjavík, Trondheim and Oulu. All nine Isha occurrences remain on December 31. The other 20 final rows lack next-year source Fajr and remain outside this complete-night test. No calculated January 1 value fills those gaps.

A separate literal-midnight branch places all nine `00:00` cells uniquely at next-day midnight. Their adjacent source labels progress through the midnight neighborhood; Reykjavík has a run of six such entries. The prospectively frozen Anchorage 2027 calendar adds a particularly clear bounded example: its official table gives Isha as `23:58` on 18 May, `00:00` on 19 May, then `00:02` on 20 May, while Maghrib progresses `22:53`, `22:55`, `22:58` ([official Anchorage table](https://namazvakitleri.diyanet.gov.tr/tr-TR/8584/anchorage-namaz-vakitleri); frozen comparison and provenance: [Anchorage 2027 report](ANCHORAGE-2027.md)). The forecast was frozen before those calendar rows were read; its hash is `d01c0cd2f361e1de9b7e8683b2d2ef40e814a831d74bdb3b66cf225141750b86`, and the acquired official page hash is `80a9406162bb9c46c9071526da3cd34dfba217827184202ddd45437714e10705`. This smooth, minute-by-minute neighborhood is consistent with literal midnight and shows why the available evidence cannot support treating every displayed `00:00` as a confirmed missing sentinel. It still does not prove the publisher's semantics: a placeholder could coincide with this sequence, and neither the HTML nor the forecast identifies the intended status of that cell. It remains excluded and unresolved in the primary interpretation and accuracy denominator.

Python fold-aware round trips and the public exhaustive minute resolver independently agree on 95,265 actual and hypothetical date-field resolutions under pinned Node 26.7 / ICU 78.3 / tzdb 2026d. This verifies the timezone arithmetic and enumeration, not the missing publisher contract.

## Why this is not an unconditional rule

These are **synthetic counterexamples**, not additional Diyanet observations:

- **Row association:** a table with dawn around 05:00, evening around 18:00 and Isha shortly after 00:00 can associate its Isha cell either with the morning of the printed date or with that row's evening and the following civil date. Varying the Isha clock between rows produces different schedules under those two interpretations. Both can respect evening-to-dawn order when attached to their respective nights. The date heading and `HH:mm` cell alone do not specify the association.
- **Zero meaning:** the exact same `00:00` string can serialize literal midnight or a missing-value placeholder. A smooth neighborhood supports the first interpretation but does not logically exclude the second. The inspected artifacts give no explicit Isha zero-status definition.
- **DST fold:** a hypothetical Anchorage evening on 6 November 2027 with Isha 01:30 on the following morning admits two instants, 09:30Z and 10:30Z. Both can lie between an evening 18:00 and following dawn 05:00. An evening-cycle assumption and clock order alone do not select one.
- **DST gap:** hypothetical Anchorage Isha 02:30 on 14 March 2027 has no local occurrence. Advancing a date cannot make an invalid clock valid without another policy.
- **Year boundary:** a hypothetical Isha 00:30 after 31 December 2027 belongs to 1 January 2028 under the evening-cycle rule. Gregorian date addition handles this; a calendar truncated at December 31 does not supply the next source Fajr needed to validate the whole night.

For a local app, keep a source row label, an event civil date, timezone, absolute UTC instant and interpretation status as separate concepts. Use actual local-time candidate resolution, not a copied row-level offset or a blanket 86,400-second adjustment. A table-derived conditional date can support diagnostics, but the present evidence does not justify automatically releasing all northern alarms or silently accepting every zero. Numerical agreement, source-date meaning and notification readiness remain separate checks.
