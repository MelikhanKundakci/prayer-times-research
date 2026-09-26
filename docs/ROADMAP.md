# Research roadmap

The app's primary calculation direction is now a documented local-point model in [`core/local/`](../core/local/README.md), separate from reconstruction of institution-published city calendars. Its first named profile applies documented event criteria and Temkin margins to continuously solved solar crossings. It returns point-specific model estimates, not proof of observed or religious superiority, exact-second accuracy, or notification readiness. See the [rule contract](../core/local/RULES.md) and [independent validation contract](LOCAL-VALIDATION.md).

The next work on that path is to validate each raw solar event independently, preserve the boundary between raw astronomy and selected prayer events, and keep unsupported cases explicit. At 44.5° north and above, selected Fajr/Isha and horizon events requiring seasonal or five-hour replacement rules remain blocked; only the documented northern no-daylight-shadow Asr substitute may be estimated. Do not fill these gaps with generic polar estimates or mirror northern rules into the south. GPS provides coordinates, while the caller must supply an appropriate IANA time zone; elevation, terrain, skyline, and topocentric parallax are outside the current point model.

The research track below remains useful, but it addresses a different question: how closely specified methods reconstruct supplied city calendars. It must not be used to tune or silently correct point-model outputs. Broader method coverage still requires independently verified rules and explicit religious and institutional scope; there is no claim that the remaining work is only a matter of adding more preset angles.

## City-calendar reconstruction questions

| Area | What would move the research forward |
|---|---|
| Diyanet | Confirm production coordinates, seasonal transition anchors, rounding, and the absolute-date meaning of post-midnight Isha and `00:00`. Explain local regressions such as Bremen as well as improvements. |
| JAKIM / Selangor / Kedah | Confirm operational point sets, the interpretation of the R19 map/table discrepancy, and the applicable 2027 district/zone changes. |
| Shia profiles and Bayynat | Confirm event roles, shared/exclusive windows, missing Asr/Isha specifications, and source timezone behavior without reproducing unphysical calendar bugs as religious rules. |
| Türkiye Takvimi / Fazilet | Obtain complete operational horizon/Temkin, altitude, rounding, and point specifications; expand season/year coverage for hypotheses with limited validation. |
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
