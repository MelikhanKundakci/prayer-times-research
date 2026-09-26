# Validating local prayer calculations

The app's primary target is **local astronomical events under explicitly documented prayer rules**. A user supplies a point, date, IANA timezone and named profile. The calculation must implement that profile correctly and identify events for which its rules are incomplete. Reproducing a city's printed calendar is a separate compatibility target.

The first [point API](../core/local/) implements continuous solar geometry and a partial `diyanet-published-point-v1` profile. Its [rule contract](../core/local/RULES.md) distinguishes primary publications from implementation choices. Its [verification record](../core/local/verification.json) states exactly what has been tested. None of these documents declares worldwide notification readiness.

## Four independent acceptance questions

| Question | Required evidence | What does not establish it |
|---|---|---|
| Does the solver compute its specified solar model correctly? | Independently implemented coordinates, transit and crossing equations; directional roots; absent-event handling; boundary and continuity tests. | Agreement between two wrappers calling the same implementation. |
| Does the selected time follow the named religious profile? | Event-specific primary sources; explicit angles, shadow convention, margins and replacement rules; rule and regression tests. | One similar Fajr/Isha angle or a fitted city correction. |
| Is it an actual dated instant? | UTC epoch, date ownership and IANA rendering checked at midnight, DST, the date line and year boundaries. | A plausible `HH:mm` string or an unverified next-day assumption. |
| Is the model adequate for the claimed real-world scope? | A stated accuracy budget and independent astronomical references or observations with compatible horizon, refraction and coordinate definitions. A release review for each supported profile and event. | A tiny root residual, extra displayed seconds or a good city-calendar percentage. |

## The first numerical check

The [public independent oracle](../core/local/verification/) implements the published USNO approximate solar equations in Python without importing the JavaScript solver. It solves meridian phases and sine-altitude roots using a different search implementation. The frozen grid has 139 inputs: 136 unique solar cycles, 723 calculated events, 93 unavailable events, and three expected civil-date ownership rejections. It also checks 272 lower-meridian boundaries. The JavaScript comparison must stay within **0.1 seconds of the independent model calculation**, with identical declared availability and crossing direction.

The two implementations share the same published solar approximation. Their much smaller measured differences establish arithmetic consistency on these cases, not physical accuracy to that difference. The grid is bounded and its extremum search is not an analytic proof covering all possible inputs. The oracle documents the Python timezone database separately from the pinned JavaScript database; future timezone updates require review of affected date-ownership expectations.

The [profile tests](../tests/local-point.test.mjs) separately exercise published margins, high-latitude policy gates, the documented absent-shadow Asr substitution, actual order conflicts, post-midnight dates, DST, fractional offsets and cross-night ordering on declared ordinary-point cases. An operating-system permission test denies network access and access to calendars, legacy reconstruction modules and verification fixtures while calculating the same output. The [solar tests](../tests/local-solar.test.mjs) check location sensitivity, date-line equivalence, fixed-noon-shadow geometry and strict input validation.

The [northern independent oracle](../core/local/verification/northern-README.md) additionally compares 6,572 Fajr/Isha eligibility decisions across nine complete point-years under the declared ordinary-event guard. It checks 3,295 padded-night candidates and sampled UTC arithmetic through an independent Python implementation. This verifies that local guard and its explicit conventions; it does not reconstruct an undisclosed transition algorithm. The [northern integration tests](../tests/local-northern-point.test.mjs) retain a concrete five-hour regression where the same-day complement suggests over 303 minutes of night but the actual following selected night is under 300 minutes.

## Accuracy and display precision

USNO describes its [approximate solar coordinates](https://aa.usno.navy.mil/faq/sun_approx) as accurate to about one arcminute within two centuries of 2000. That angular description cannot be converted into one global time-error bound: a shallow crossing at high latitude can amplify a small angular error into a much larger time shift.

The conventional rise/set threshold is −50 arcminutes, combining approximate solar semidiameter and standard refraction. [USNO's rise/set definitions](https://aa.usno.navy.mil/faq/RST_defs) explain that changing atmospheric conditions can change actual times by a minute or more even under otherwise favorable conditions. Terrain and observer height add different effects. This first point model does not include those effects or topocentric solar parallax.

Keep these quantities distinct:

- **Raw solar instant:** the numerical event in the chosen astronomical model.
- **Selected prayer instant:** the raw event plus the documented rule or a named substitution.
- **Displayed clock:** rounding of that selected instant for the interface. Model seconds may be shown, but do not imply observed or religious certainty to the second.

GPS improves the specificity of the input point relative to a city representative. It does not itself validate an ephemeris, a dawn criterion, local weather or the chosen religious policy. Published Temkin margins remain explicit; a point input does not silently remove them.

## Coverage before scheduling

Northern seasonal selection remains incomplete. From local core 0.2.0, the [declared annual guard](../core/local/NORTHERN-ORDINARY.md) admits a bounded subset of true northern Fajr/Isha events. It uses explicitly chosen physical-night endpoints and a transit-relative UTC frame, without selecting a Fajr extra-angle conversion or an interpolation. This verifies a named local ordinary-domain policy, not the undisclosed publisher algorithm. Invalid annual dependencies and unresolved summer/transition cases remain `policy-blocked`, even if a diagnostic crossing exists. Northern horizon substitutions also remain blocked where required; ordinary horizon eligibility now checks actual adjacent nights rather than subtracting daylight from 24 hours. The implemented north-polar-winter Asr substitute is identified as `estimated`; it does not make the whole day complete. Southern missing signs are not assigned a mirrored northern rule.

`coverage.complete` only means that all six selected fields have a result under implemented rules. A daily output does not by itself check the next day's Fajr against Isha. A schedule consumer must check that cross-night boundary and follow the [notification release criteria](NOTIFICATION-READINESS.md), including location/timezone updates and platform alarm behavior. Unsupported events remain null rather than acquiring an invented clock.

## Optional comparison with published calendars

Existing calendars remain useful for investigating rule interpretations and regression patterns. The [calendar validation protocol](VALIDATION.md) still governs claims about publisher agreement. Compare like with like: calculation point, horizon, rule version, timezone, rounding and row-date meaning must be stated. A difference caused by a different legitimate point is not automatically a solver error. Conversely, a GPS calculation cannot dismiss a discrepancy as a location effect without checking it.

Official city coordinates and newly acquired city calendars are **not prerequisites** for implementing a documented local-point profile. They are needed when a claim specifically depends on reproducing that publisher's city output. Preserve this distinction in bug reports, benchmarks and app descriptions.
