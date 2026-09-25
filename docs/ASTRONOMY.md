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

Rounding is part of a published calendar's algorithm: nearest minute, upward rounding, downward rounding, and intermediate second rounding can differ at boundaries. Adding a minute after rounding is not always equivalent to changing a raw-time offset before rounding.

The CLI uses pinned IANA/ICU timezone data, including actual offset changes. Fixed UTC offsets are used only where a method explicitly models a source convention; they are never a silent replacement for the caller's named timezone.
