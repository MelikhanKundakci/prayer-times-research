# Why a shared horizon and Temkin adjustment still do not solve Istanbul

**The missing operational rule cannot be recovered merely by searching for a different common Temkin and a different common sunrise/sunset horizon within the current geometry.** A new conservative feasibility diagnostic excludes that entire model family on at least 62 of the 365 known Istanbul 2026 days under nearest-minute rounding. It does not establish which publisher rule differs, and it does not improve or replace any exported clock.

## Source interpretation

The publisher's [Temkin explanation](https://namazvakti.com/documents/Temkin.MuddetiNV.pdf), sections 1–3, describes one horizon and one common correction. Section 3a includes solar semidiameter in that correction. Page 6 states that the two-minute precaution is included when arriving at the mean ten-minute Istanbul value. Consequently, neither adding a second two minutes to ten nor adding a second solar semidiameter is supported by that example. The current [technical explanation](https://namazvakti.com/documents/Son_Teknoloji.pdf) names MICA; the exported own NOAA geometry is a separate approximation.

The historical worked example, geographic height interpretation and current production configuration remain unresolved. Source examples do not certify that the production calendar uses precisely the same point or sequence.

## A more permissive test than fitting another constant

Keep the published illustrative point 41°N / 29°E, current own continuous NOAA geometry, −19° Fajr, −17° Isha, true transit and factor-one Asr using transit declination. Allow an arbitrary shared correction `T(d)` and arbitrary shared geometric solar-center horizon `H(d)` **on each day**. No values are selected as a new algorithm.

For a printed minute with epoch `M`, use a closed outer rounding cell: nearest `M±30 seconds`, floor `[M,M+60 seconds]`, ceil `[M−60 seconds,M]`. Closing the normally half-open endpoints deliberately makes feasibility easier.

First intersect the four Temkin intervals implied by Fajr, Dhuhr, Asr and Isha. Fajr subtracts T; the three afternoon events add T. If the intersection is empty, the four events alone are impossible under that rule.

Otherwise propagate the whole surviving T interval through the printed sunrise and Maghrib cells. Sunrise's raw crossing must occur in the source interval plus T; Maghrib's raw crossing is in the source interval minus T. Conservative solar-altitude bounds over those two raw-time intervals must overlap for any shared horizon to exist. Each horizon is even allowed its own T within the common four-event interval, making this another conservative relaxation. Disjoint altitude bounds exclude the family; overlapping bounds are only inconclusive.

## All known days retained

| Uniform rounding | Four-event correction impossible | Additional shared-horizon exclusions | Inconclusive | Total days |
|---|---:|---:|---:|---:|
| Nearest | 2 | 60 | 303 | 365 |
| Floor | 267 | 87 | 11 | 365 |
| Ceil | 285 | 0 | 80 | 365 |

Each uniform-rounding family therefore fails as a full-year reconstruction despite the two arbitrary daily parameters. This strengthens the earlier fixed-zero-horizon contradiction; it does not rule out event-specific rounding, different operational points, MICA geometry or different event meanings.

On 3 April, the nearest-minute sunrise altitude enclosure is approximately −0.213416°…−0.007727°, while Maghrib requires −0.540156°…−0.334724°. Their 0.121308° separation survives the conservative numerical padding. The two non-horizon contradictions are below 1.3 seconds; those small cases should not be called robust against another solar ephemeris.

## Verification and scope

The interval calculation uses derivative envelopes for the implemented NOAA expressions, not sampled monotonicity: declination rate at most `1e−5 degree/second`, equation-of-time rate at most `2e−7 hour/second`, and `1e−7 degree` outward altitude padding. A separate coefficient-bound derivation for the 2026 domain gives smaller derivative limits, supporting those conservative enclosures.

Separate Python arithmetic reproduces all **1,095** day/rounding classifications; **35,706** interior numerical samples remain inside their bounds. Two agents reviewed the signs, relaxation and derivative envelopes. All 365 complete baseline results remain unchanged. These checks concern the stated mathematical model, not an error bound against MICA, observations or religious validity.

The [aggregate result and private evidence hashes](research/common-horizon-2026-09-25.json) preserve the counts and assumptions. Raw calendars and derived per-day reference intervals are not redistributed. There is no fresh institutional sample, selected correction, or improved-accuracy claim in this diagnostic.

The next useful evidence is a current worked calculation with intermediate coordinates and corrections, or explicit confirmation of event-specific rounding, production points and horizon conventions. Another fitted minute margin would leave the underlying contradiction unexplained.
