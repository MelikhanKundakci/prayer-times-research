# Published rules and reconstruction evidence

Review date: **2026-09-25**. This audit covers all 15 method families currently in the repository. It reviews rule publications and existing research evidence; it does not acquire new prayer-time calendars or turn a software preset into an institutional specification. All calculations remain local.

The linked audits separate three kinds of evidence:

- **Published rule:** a named primary source explicitly describes the criterion. Its institution, publication date, geographical scope and wording matter.
- **Implementation hypothesis:** our choice of ephemeris, reference point, rounding, margin or missing-event policy where the source does not completely specify it.
- **Measured agreement:** a comparison with particular calendar fields, documented in the method's validation record. Matching a minute does not prove the hypothesis is the publisher's actual formula.

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
