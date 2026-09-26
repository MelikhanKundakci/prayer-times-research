# Research roadmap

## Active delivery priorities — 26 September 2026

**Diyanet and broad community coverage are the active priorities. Türkiye Takvimi is deferred.** Its existing studies stay available for provenance, but its discrepancies do not determine the next implementation work.

This is a product scope decision, not a measured worldwide popularity ranking. The [Adhan method catalogue](https://github.com/batoulapps/adhan-js/blob/develop/METHODS.md) and [AlAdhan method catalogue](https://aladhan.com/calculation-methods) identify software interoperability targets; inclusion does not prove an institution's complete specification, endorsement, or user count. Research continues from public explanatory publications and retained evidence, without institutional contact or new prayer-calendar/API acquisition. Runtime calculations remain offline.

| Priority | Target | Concrete remaining work |
|---|---|---|
| First | **Diyanet** | The optional SPA point profile now applies the same published criteria, margins and ordinary-only northern guard with one provider across daily and annual calculations. Next resolve supported summer/transition behavior and actual event dates. Keep local point rules distinct from the older city-calendar reconstruction. |
| First expansion | **MWL, Karachi, Egyptian criteria, ISNA and FCNA** | Complete per-prayer rule contracts and trace each convention to its actual source. Add missing method support only under an honest scope label. A matching twilight pair does not establish MWL=Diyanet, ISNA=FCNA, or Karachi=Banuri Town. Keep the Asr choice explicit. |
| First expansion | **Umm al-Qura** | Add a dated interval-based Isha rule for the explicitly attributed software reconstruction, with an offline Ramadan-calendar convention and month-boundary tests. The [source audit](../methods/umm-al-qura/RULE-EVIDENCE.md) does not establish the complete official numerical recipe; retain that distinction. Do not represent an interval method as another twilight angle. |
| First expansion | **Kemenag / Indonesia** | Extend the bounded worked-example evidence toward a complete local rule contract; retain its stated minute arithmetic and domain. Do not turn an alternative dawn angle into a complete community-specific method. |
| Regional expansion | **JAKIM, MUIS, UAE/Awqaf** | Preserve each method's zone/point, horizon and margin semantics. Verify complete local profiles before presenting them as national-calendar equivalents. |
| Community coverage | **Named Ja'fari/Tehran and other Shia profiles** | Specify Maghrib, prayer windows, combined-prayer semantics and missing event rules for the named source. One generic “Shia” angle preset does not cover these differences. |
| Reuse existing work | **Moonsighting Committee** | Evaluate its existing reconstruction for the local schedule interface while preserving seasonal rules, both Asr choices, unavailable events and legal event-time timezone handling. Historical clock-match scores alone do not authorize an automatic migration. |

The first expansion items can be investigated in parallel, but each is delivered as a complete, independently checked rule package for a stated domain. Expanding the selector is not the acceptance criterion.

The starting evidence differs: [FCNA](../methods/fcna/RULE-EVIDENCE.md) and [Egypt](../methods/egyptian-survey/RULE-EVIDENCE.md) have direct institutional twilight-angle statements, while MWL/Karachi catalogue parameters alone are software attributions. [Kemenag](../methods/kemenag/RULE-EVIDENCE.md) has a bounded worked example. [Shia sources](../methods/shia-angles/RULE-EVIDENCE.md) also require legal-window semantics that cannot be reduced to another Sunni-style five-angle preset.

### Acceptance for each local rule package

1. **All five prayer starts are defined.** Record each event's sign, angle or interval, Asr interpretation, horizon assumptions, margin, rounding order and evidence. Any project convention is visible. Geometric markers cannot silently stand in for missing institutional prayer-start rules.
2. **A reproducible offline calculation is independently checked.** Compare unrounded instants and availability states against a separate implementation of the declared equations. This verifies arithmetic, not observed dawn or religious endorsement.
3. **A predeclared whole-year and boundary grid passes.** Exercise the intended geographical domain, both hemispheres where claimed, leap days, timezone changes, date-line cases, Ramadan boundaries where applicable, and transitions into/out of missing twilight. Preserve chronological event dates across midnight and adjacent days.
4. **Unsupported situations remain explicit.** A complete ordinary-day profile is useful within its stated domain; an unresolved polar or seasonal rule does not justify fabricating a time. An optional substitute is named and marked as an estimate.
5. **Any calendar-compatibility claim has its own evidence.** Compare the same point/date and event meaning where these are known; report signed errors per prayer, worst cases, exclusions and regressions. Existing calendars are retrospective evidence, not new unseen validation. A broad one-minute claim cannot be inferred from selected cities or a good aggregate.

The optional [`diyanet-published-spa-point-v1`](../core/local/README.md) profile is now part of the local API. It is a second astronomy-provider choice, not a correction to the existing USNO point profile: both preserve the selected published angles and margins, while the SPA profile uses its provider consistently for daily roots and its annual northern guard. Unsupported summer transitions remain blocked. Any future report of calendar-comparison results must come from the separately frozen replay; the new model alone establishes neither closer Diyanet agreement nor the unpublished transition rule.

## Current implementation

The app's primary calculation direction is a documented local-point model in [`core/local/`](../core/local/README.md), separate from reconstruction of institution-published city calendars. Version 0.6.0 provides 23 profiles: six original profiles, one optional Diyanet SPA point profile, and 16 software compositions combining four Fajr/Isha angle pairs, Asr shadow factors 1/2 and physical-only or opt-in angle/night twilight handling. The SPA profile and compositions use the SPA point provider; the six original profiles retain USNO. These are outputs under declared rules, not proof of observed or religious superiority, exact-second accuracy, or notification readiness. The [local browser prototype](../examples/local-app/README.md) presents one-day results, a seven-day schedule, next available prayer, rule sources and JSON export.

The 16 new compositions use the Reda–Andreas SPA point model; the six earlier profiles retain their prior USNO model. Both preserve the boundary between raw astronomy and profile-selected prayer events. Unsupported cases remain explicit. Existing northern policies apply only to the profiles that declare them; compositions use their own optional angle/night rule and do not inherit Diyanet's northern substitutions. Profiles without a supported polar replacement leave twilight unavailable. GPS provides coordinates; the user must confirm an appropriate IANA timezone. Elevation, terrain, skyline and local obstructions are outside the current point model.

The research track below remains useful, but it addresses a different question: how closely specified methods reconstruct supplied city calendars. It must not be used to tune or silently correct point-model outputs. Broader method coverage still requires independently verified rules and explicit religious and institutional scope; there is no claim that the remaining work is only a matter of adding more preset angles.

## City-calendar reconstruction questions

| Area | What would move the research forward |
|---|---|
| Diyanet | Confirm production coordinates, seasonal transition anchors, rounding, and the absolute-date meaning of post-midnight Isha and `00:00`. Explain local regressions such as Bremen as well as improvements. |
| JAKIM / Selangor / Kedah | Confirm operational point sets, the interpretation of the R19 map/table discrepancy, and the applicable 2027 district/zone changes. |
| Shia profiles and Bayynat | Confirm event roles, shared/exclusive windows, missing Asr/Isha specifications, and source timezone behavior without reproducing unphysical calendar bugs as religious rules. |
| Fazilet | Confirm operational horizon/Temkin, altitude, rounding, and point specifications; expand season/year coverage for hypotheses with limited validation. Türkiye Takvimi work is deferred under the active priorities above. |
| FCNA / North America | Obtain calendars explicitly tied to the cited recommendation version, particularly the historical Canada profile, and clarify auxiliary event conventions. |
| UAE / Oman / Egypt | Confirm production points and operational geometry; distinguish a close empirical fit from a sourced institutional implementation. |
| Indonesia | Validate the worked-example reconstruction against a fully identified central calendar service and document complete community-specific procedures beyond a Fajr-angle override. |
| High latitudes globally | Add named, sourced replacement rules and verify actual event dates, missing signs, and southern-hemisphere behavior. |

## Coverage still to establish

The current 15 families are a research starting point. Other commonly named profiles, such as Muslim World League, ISNA, Karachi, and local mosque conventions, need separately verified specifications and source-calendar evidence before we claim their behavior. Matching the Fajr/Isha angles of another included profile is not enough to establish equivalence. Observation-based practices, congregation times, lunar-calendar announcements, and legally defined shared prayer windows also require their own data and semantics.

## Contributor-sized tasks

- Check one method's documented parameter against a primary publication and propose a precise correction with a page/section link.
- Add one new lawful reference dataset with complete provenance and a predeclared comparison plan.
- Port a small solar helper to a second language and compare intermediate values, including polar and date-line cases.
- Review one output field's religious meaning, explaining whether it is a beginning, table marker, precaution, transit, or congregation time.
- Add a targeted regression for an actual timezone transition, skipped civil date, missing event, or rounding boundary.
- Improve an example or method explanation while preserving the evidence and uncertainty labels.

## Longer-term engineering

- A versioned, documented interchange format for research predictions and reference calendars.
- Independent astronomy and interval-boundary checks beyond published minute stamps, linked to the [local point validation contract](LOCAL-VALIDATION.md).
- Carefully reviewed mobile ports and offline timezone handling for Android and iOS.
- A separately reviewed geographic-zone resolver; coordinates alone do not identify an IANA time zone.
- Elevation and local-horizon inputs only with a documented model and suitable validation.
- Notification behavior only after each supported profile's selected-event and chronology rules are validated; a calculated point time alone is not notification approval.

Adding a new community or method requires its own specification and evidence. Existing city-years are useful regression data but cannot be presented again as newly unseen validation.

The optional [local summer profile](../core/local/SEASONAL.md) now defines the night-ratio, interpolation and boundary conventions for a complete northern seasonal calculation on its real-horizon domain. Next work should evaluate the suitability of those explicit conventions and define a separately reviewed minimum-day/night horizon policy before extending coverage to short-horizon or polar locations. Do not describe these project choices as a recovered institutional algorithm.

The shared local registry keeps the Egypt/FCNA angle-only profiles and bounded Kemenag worked-example adaptation alongside the new complete compositions; the former retain marker roles where their remaining prayer rules are not specified. Next work should focus on independently reviewing selected rule suitability and supported domains, improving horizon/location inputs, and testing schedule behavior before considering mobile background alarms. Interval, legal-window and polar policies need explicit event semantics rather than being forced into angle presets. Calendar-reconstruction evidence remains separate and cannot silently tune point results.
