# Published rules and reconstruction evidence

Review date: **2026-09-25**. This audit covers all 15 method families currently in the repository. It reviews rule publications and existing research evidence; it does not acquire new prayer-time calendars or turn a software preset into an institutional specification. All calculations remain local.

Focused update **2026-09-26**: the prayer-by-prayer distinction below was checked against the existing code and primary explanatory sources. This update changes evidence attribution and documentation, not calculated times or validation scores.

The linked audits separate three kinds of evidence:

- **Published rule:** a named primary source explicitly describes the criterion. Its institution, publication date, geographical scope and wording matter.
- **Implementation hypothesis:** our choice of ephemeris, reference point, rounding, margin or missing-event policy where the source does not completely specify it.
- **Measured agreement:** a comparison with particular calendar fields, documented in the method's validation record. Matching a minute does not prove the hypothesis is the publisher's actual formula.

## Rules differ by prayer, not only by method name

A calculation profile must specify each event separately. An institution, a school of jurisprudence, a named religious authority and a software parameter set are different kinds of attribution. None is a safe alias for all the others.

| Event or marker | What needs its own rule | Example and evidence boundary |
|---|---|---|
| Fajr / Imsak | Dawn criterion, any precaution, and a policy when the criterion does not occur | Diyanet's [2013 statement](https://www.diyanet.gov.tr/tr-TR/Kurumsal/Detay/2921/basin-aciklamasi) names 18° for Imsak and 17° for Isha. Its later northern criteria use 16° for Isha; see the dated [Diyanet audit](../methods/diyanet/RULE-EVIDENCE.md). |
| Sunrise | Horizon definition, geographical scope and any end-of-Fajr adjustment | This is an astronomical/calendar marker, not a sixth obligatory daily prayer. Diyanet's published adjustment is distinct from its Maghrib adjustment. |
| Dhuhr | Midday definition, margin and legal-window semantics | Diyanet publishes transit plus five minutes; another authority's legal-midday or table marker must retain its own meaning. |
| Asr | Shadow factor where applicable, or an authority-specific legal window | Diyanet explicitly chooses the first shadow rule; a generic school-name override must not silently replace that institutional choice. |
| Maghrib | Sunset criterion versus an additional redness criterion or precaution | [Sistani's ruling 722](https://www.sistani.org/english/book/48/2212/) requires waiting for eastern redness to pass overhead as obligatory precaution. It supplies no universal fixed angle or minute delay. Other named authorities can differ; see [Bayynat](../methods/bayynat/RULE-EVIDENCE.md). |
| Isha | Twilight criterion, any supported interval prescription, seasonal substitution and event-date ownership | An angle, a fixed elapsed interval and a high-latitude night fraction are distinct rule types. Their numerical values and applicability need separate evidence. |

For Asr, the [Diyanet explanation](https://kurul.diyanet.gov.tr/tr/fetva/asr-i-evvel-ve-asr-i-sani-ne-demektir/0193c42d-4d64-7acf-2961-12b0db4e1723) distinguishes one and two object-lengths **in addition to the noon shadow**, and explicitly states its calendar uses the first rule. It also records differences among Hanafi jurists. Consequently, “Hanafi” does not automatically mean that every Turkish or Diyanet timetable uses factor two.

Legal windows, earliest beginnings, recommended performance times and mosque congregation times are not interchangeable target columns. [Sistani's ruling 717](https://www.sistani.org/english/book/48/2209/) describes Dhuhr/Asr within a legal window and an ordering requirement; it is not a prescription for a separate shadow-factor Asr column. Existing Shia profiles and Bayynat table markers preserve that distinction. Likewise, [Fazilet's separate Sabah marker](../methods/fazilet/RULE-EVIDENCE.md) must not be imported into Diyanet's Imsak meaning.

## What this means for the current calculation work

The offline Diyanet core already uses separate Fajr, horizon, Dhuhr, Asr and Isha rules, separate minute adjustments, and northern seasonal branches. It does not apply one twilight angle to every prayer. The low/southern route uses an Isha angle of 17° while the northern route uses 16°; this is not an accidental inconsistency to repair by making them equal. Published criteria support the distinction in their stated scopes, while the exact worldwide production recipe remains unverified.

Keep a shared, explicitly named astronomical calculation separate from these event rules. Different prayers naturally occur at different solar positions; a model may evaluate solar coordinates at an event's time or at a declared daily approximation. That numerical choice is not itself a religious rule. The [solar-channel experiment](../methods/diyanet/NOON-SHAPE-TRANSFER.md) does not justify selecting a different ephemeris output for each prayer merely because a particular calendar score improves.

For contributors, every proposed event rule should state its authority and source date, applicable geography/season, marker meaning, parameters, fallback, adjustments, and display/date convention. Do not add a value for an unspecified field simply to fill a universal six-column table. Profile overrides must remain explicit custom choices rather than silently retaining an institutional-equivalence label.

## Family-by-family review

| Family and detailed audit | What the review helps resolve | Main remaining implementation question |
|---|---|---|
| [Diyanet](../methods/diyanet/RULE-EVIDENCE.md) | Published criteria versus the northern, southern and low-latitude reconstructions | Production points, seasonal transitions and exact rounding; see the existing worldwide studies |
| [Moonsighting Committee](../methods/moonsighting-committee/RULE-EVIDENCE.md) | Explicit five-minute Dhuhr margin versus the empirical 4.98-minute default | Seasonal/high-latitude implementation details and minute-rounding convention |
| [Umm al-Qura](../methods/umm-al-qura/RULE-EVIDENCE.md) | Scope of published explanations and the current angle/interval recipe | Full operational parameters and Ramadan date-boundary convention |
| [Egyptian Survey](../methods/egyptian-survey/RULE-EVIDENCE.md) | Egyptian Dar al-Ifta angle evidence, distinguished from ESA production details | Horizon, ephemeris anchors, reference points and rounding |
| [UAE / Awqaf](../methods/uae-awqaf/RULE-EVIDENCE.md) | Institutional methodology versus our atmosphere/horizon reconstruction | Production height, width and refraction inputs |
| [Kemenag](../methods/kemenag/RULE-EVIDENCE.md) | Published margins and rounding instructions | Transfer from a worked example to regional production settings |
| [Oman / MARA](../methods/oman-mara/RULE-EVIDENCE.md) | Limits of the evidence for the existing empirical recipe | Primary confirmation of angles, margins and reference points |
| [Banuri Town](../methods/banuri-town/RULE-EVIDENCE.md) | Five-minute wait after the **printed Zawal** marker | Whether rounded model transit reproduces that calendar marker |
| [JAKIM](../methods/jakim/RULE-EVIDENCE.md) | Zone/reference-point rules and their dated applicability | Current point sets and state-specific changes |
| [MUIS](../methods/muis-singapore/RULE-EVIDENCE.md) | Institutional publications versus secondary software parameters | Unverified operational angles, margins and future-year behavior |
| [FCNA](../methods/fcna/RULE-EVIDENCE.md) | Named USA/Canada recommendations, with dates and scope | A complete timetable engine is not specified by twilight angles |
| [Shia angle profiles](../methods/shia-angles/RULE-EVIDENCE.md) | Separately attributed institutional and jurisprudential criteria | Original Tehran/Leva specifications and absent-event policies |
| [Bayynat](../methods/bayynat/RULE-EVIDENCE.md) | Legal prayer windows versus numerical table markers | Meaning of individual columns and publisher date/timezone behavior |
| [Fazilet](../methods/fazilet/RULE-EVIDENCE.md) | Primary support for the Imsak-to-Sabah interval and solar criteria | Height/extent treatment, Temkin and exact rounding |
| [Türkiye Takvimi](../methods/turkiye-takvimi/RULE-EVIDENCE.md) | Published Temkin explanations versus unsuccessful reconstructions | Operational interpretation of the table, horizon and caution |

## Two explicit rule alternatives

The Moonsighting Committee entry accepts `variant: "published-dhuhr-five-minutes"`. It uses a 300-second Dhuhr margin instead of the default reconstruction's 298.8 seconds. The other calculations remain the existing reconstruction, including an unconfirmed nearest-minute convention. The rule publication supports the margin, not every detail of this variant. Replaying 27 archived calendars gives two newly exact Dhuhr minutes and 191 lost exact matches: this is **not a calendar-matching improvement**. See its audit for the paired comparison and denominators.

The Banuri Town entry accepts `variant: "zawal-plus-five"`. It adds five minutes to the model's rounded transit as an explicitly **unconfirmed proxy for printed Zawal**. The resulting Dhuhr marker has minute resolution and `rawUtc: null`; no independent Dhuhr accuracy percentage is inferred from a calendar containing only Zawal. The default retains unresolved Dhuhr semantics.

Neither addition changes the existing default calculation or promotes a research result to notification readiness. No numerical change is justified merely by finding another article that repeats an angle already implemented.

## Location and seconds in the future app

A user-location result and an institution's city/zone result can be different products. A GPS point must not silently replace a published zone's extremal points while the output is still described as that zone's official time. Record which location policy a profile implements before comparing errors.

An unrounded astronomical instant, a margin-adjusted model instant and a published rounded minute are also different values. Native result fields in this repository do not yet share a universal seconds-display contract. A field called `rawEpoch` must be interpreted through its method; some profiles apply adjustments separately. App adapters must retain each profile's adjustments, event dates, rounding and missing-event status.

Only show computed seconds where an unrounded, fully adjusted model instant is actually available, and identify them as **calculated seconds**, not verified institutional precision. Never append `:00` to a published minute and treat it as a measured second. A minute-resolution rule can support a useful calculation without supporting a claim of second-level religious or observational accuracy.

## What justifies the next formula change

Translate a specific source claim into a bounded hypothesis, keep the previous calculation, compare the same locations/dates/markers, and report gains **and** regressions. Keep previously exposed data distinct from a genuinely unseen holdout. If only existing material is available, label the result as retrospective; do not invent independent validation. The [validation protocol](VALIDATION.md), [accuracy priorities](ACCURACY-PRIORITIES.md) and [notification criteria](NOTIFICATION-READINESS.md) define the next steps.
