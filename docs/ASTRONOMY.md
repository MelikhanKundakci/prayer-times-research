# Astronomical conventions

This page explains the shared concepts. Each method's README and implementation define the actual parameters used; the equations below are not a universal prayer-time recipe.

## Solar coordinates and hour angles

For latitude `φ`, solar declination `δ`, altitude `h`, and hour angle `H`:

```text
sin(h) = sin(φ) sin(δ) + cos(φ) cos(δ) cos(H)
cos(H) = [sin(h) − sin(φ) sin(δ)] / [cos(φ) cos(δ)]
```

A real crossing requires an appropriate finite solution. A cosine outside `[-1, 1]` is not a time to clamp into existence. Tangencies and polar singularities need explicit treatment.

With east-positive longitude `λ` and the equation of time `E` expressed in hours, a fixed-coordinate approximation to meridian transit is:

```text
transit in UTC hours = 12 − λ / 15 − E
crossing in UTC hours ≈ transit ± H / 15
```

The solar coordinates themselves change during a day. Some institutional reconstructions evaluate them at fixed daily anchors; others solve the evolving altitude continuously. These are separate algorithms, not interchangeable precision settings.

The own implementations refer to the [US Naval Observatory's approximate solar coordinates](https://aa.usno.navy.mil/faq/sun_approx) and the [NOAA solar-calculation description](https://gml.noaa.gov/grad/solcalc/calcdetails.html). Source attribution and inherited implementation details are recorded in the module map and license notices.

## Continuous local point profile

The app's primary point path is [`core/local/`](../core/local/README.md). It evaluates the chosen coordinates at trial event instants and numerically solves continuous altitude crossings for the caller's supplied coordinates. The six original profiles use USNO; the sixteen new [complete local compositions](../core/local/COMPOSED.md) explicitly use the [SPA provider](../core/astronomy/SPA-POINT.md) with its sidereal hour angle and declared offline time-scale conventions. The returned `astronomy.events` are raw geometry; the separate `events` are selected values after the explicitly named profile rules, margins and rounding. For example, the Diyanet point profiles' sunrise marker applies the documented −7-minute margin to the model's apparent-horizon crossing. That marker is not a prayer-start event. GPS does not automatically remove Temkin; Diyanet describes those margins as part of producing published locality times.

The [profile registry](../core/local/PROFILES.md) supplies twilight angles and a horizon depression to the shared engine. The Diyanet, Egyptian and FCNA point profiles use the conventional −50′ horizon; the Kemenag worked-example profile uses −1°. Kemenag selects whole-minute values with its documented rounding and margins, while Egypt and FCNA currently supply prayer-start rules only for Fajr/Isha. The other events in those two source families are geometric markers. Their presence does not constitute a complete five-prayer prescription.

The six original named point profiles use the shadow-factor-1 target referenced to solar altitude at that day's upper meridian transit. The complete compositions explicitly select factor 1 or 2 independently of the twilight pair. The point model keeps that noon-shadow reference fixed while solving the afternoon crossing. Selecting a factor does not automatically create another institution's complete profile. The factor-1 construction expresses the documented Asr-i evvel convention; it is a model implementation, not a claim that every operational detail is independently specified.

In the original `diyanet-published-point-v1` profile, at **44.5° north and above**, raw −18°/−16° twilight crossings become selected events only when the [declared ordinary-event annual guard](../core/local/NORTHERN-ORDINARY.md) admits them. Seasonal substitution and transition rules are not fully implemented, so the remaining northern twilight events stay policy-blocked. Selected sunrise/Maghrib are also blocked when a crossing is absent or the five-hour horizon rule would require an estimate. A proven northern no-daylight-shadow Asr case may use the documented Dhuhr substitute with `estimated` status; unresolved crossings are not silently substituted. These northern policies are not mirrored into the south. See the [local rule contract](../core/local/RULES.md) and [independent local validation contract](LOCAL-VALIDATION.md).

The supplied time zone selects which solar transit belongs to the requested civil date and renders the event clocks; it does not alter the solar equations. A separate zone resolver is needed to obtain it from GPS coordinates. The model has no observer-height, terrain, skyline or topocentric-parallax input, so its unobstructed flat-horizon events may differ from what is locally observed. Continuous root precision and `seconds` output are model precision, not demonstrated accuracy to the second. The selected times are point-specific predictions under a named rule profile, not proof of observed or religious superiority, a certified local timetable, or notification eligibility. Existing [city-calendar reconstructions](../core/diyanet/README.md) remain a distinct research path.

## Twilight

Fajr and Isha profiles often specify a solar depression angle. A nominal 18° criterion searches for a center altitude of −18°, but institutions can add observation, seasonal, or high-latitude policies. An angle alone does not specify those policies.

## Asr

A common geometric expression for shadow factor `k` is:

```text
h_asr = atan(1 / [k + tan(|φ − δ|)])
```

The implementations distinguish `k = 1` and `k = 2` where the selected source supports that choice. Near polar conditions, blindly using a fixed daily declination can produce an unphysical branch. The reviewed physical solver checks the relevant afternoon crossing and preserves unavailability where it cannot establish one.

## Horizon, refraction, height, and Temkin

Sunrise and sunset depend on what is being modeled: solar center versus limb, atmospheric refraction, observer elevation, terrain, and possibly a geographic zone's extremal point. A conventional −50 arcminute horizon is not a complete terrain or elevation model.

Temkin and other institutional adjustments are explicit model parameters. Their historical or empirical use must be separated from a confirmed current operational specification. Do not add a second refraction or horizon-dip correction when the cited adjustment already includes it.

## Civil dates and rounding

An astronomical event carries an instant and an actual local date. Isha can occur after midnight. A source may place that clock in the previous day's prayer row without specifying an absolute timestamp. Comparison must state how that ambiguity was interpreted.

Rounding is part of a published calendar's algorithm: nearest minute, upward rounding, downward rounding, and intermediate second rounding can differ at boundaries. A whole-minute offset commutes with a fixed, translation-invariant minute-rounding rule: for integer `n`, `R(t + n minutes) = R(t) + n minutes`. Fractional-minute offsets, different tie rules and intermediate rounding can change the result. This identity assumes the same absolute-time scale and does not justify editing a local clock string across midnight or an offset transition.

Keep the unrounded solar event, any method-specific adjustment, and the final rounded result distinct. A calendar match at minute resolution does not establish second-level accuracy; see the [rule-evidence and display guidance](METHOD-EVIDENCE.md#location-and-seconds-in-the-future-app).

The CLI uses pinned IANA/ICU timezone data, including actual offset changes. Fixed UTC offsets are used only where a method explicitly models a source convention; they are never a silent replacement for the caller's named timezone.

The opt-in [local seasonal profile](../core/local/SEASONAL.md) adds a fully specified source-inspired northern night-fraction policy. It leaves the solar equations unchanged. Estimated or blended Fajr/Isha values describe that selected policy, not new physical twilight roots or a reconstructed missing-Fajr angle conversion.
