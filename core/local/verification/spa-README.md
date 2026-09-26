# Independent SPA event comparison

This is a source-free astronomical check, not a prayer-calendar comparison. The reference directly executes the separately implemented **pvlib-python v0.13.1 SPA** coordinates and independently solves continuous events in Python. It uses apparent Greenwich sidereal time, geocentric right ascension and declination. The reference does not reuse the JavaScript point solver or its equation-of-time adapter.

Both sides use identical declared geometric conventions: the requested twilight and horizon angles, a unique civil-date-owned upper transit, its adjacent lower meridians, and a fixed-transit factor-one or factor-two Asr target. They use UT1=UTC and ΔT=69.184 seconds. Neither adds terrain, elevation, topocentric parallax or weather-dependent refraction. No institution timetable was obtained or used.

## Fixed sample and result

The [frozen fixture](spa-fixtures.json) contains every one of the earlier 284 synthetic profile cases, plus 64 declared boundary cases: 24 near-tangent solstice cases, 32 cases near the supported year limits 2001/2098, and eight Tromsø horizon-transition dates. The sample is intentionally rich in edge cases and is not a representative population error rate.

Nine cases reject absent or ambiguous civil-date transit ownership on both paths. The remaining 339 cycles contain 2,034 event fields.

| Comparison to independent reference | Existing USNO path | Explicit SPA path |
| --- | ---: | ---: |
| Available timestamps compared | 1,874 | 1,874 |
| Largest absolute difference | 104.695179 s | 0.000227 s |
| Median absolute difference | 0.483790 s | 0.000080 s |
| 95th-percentile absolute difference, nearest rank | 2.033617 s | 0.000171 s |
| Same nearest-minute label | 1,849 / 1,874 | 1,874 / 1,874 |
| Correct unavailable fields | 158 / 160 | 160 / 160 |
| Extra model crossings absent in reference | 2 | 0 |

The SPA maximum cycle-boundary discrepancy is 0.000230 seconds. Numerical root tolerance in the Python reference is 0.0005 seconds, and the JavaScript verifier permits at most 0.01 seconds. Agreement at this scale is implementation consistency, **not measured physical precision**. The SPA path uses the same coordinate algorithm family as its reference; it is a separate implementation check rather than a second independent observation of the Sun.

The ordinary engineering grid had substantially smaller USNO differences than the stress extension: across its 1,558 available events, median absolute difference was 0.435692 seconds, the 95th percentile 1.311912 seconds and the maximum 24.622249 seconds. The largest values there were FCNA Canada's 13° twilight at Edmonton on 21 June 2027: Fajr +24.622249 seconds and Isha −22.831018 seconds. Both are close to the seasonal limit of that twilight crossing.

The largest stress difference was sunrise at 65.73° N, longitude 0°, on 21 June 2027: USNO minus SPA was +104.695179 seconds. At that point/date, and at 65.73° S on 21 December 2027, the old model produced a sunset crossing absent in the geocentric SPA reference. The new SPA path agrees with the reference's absence. This is a conditional model distinction; it does not prove that a visible sunset can or cannot occur under actual atmospheric or horizon conditions. The northern absence margin is especially small.

All 20 largest difference records and both availability mismatches were re-solved with 30-second rather than five-minute reference brackets. Those records reduced to 15 distinct cases; all 90 event states were unchanged and the largest root drift was 0.000316 seconds. The root search also refines stationary points. This is a numerical check of this bounded sample, not a theorem that all crossings at every possible point are found.

## Time-scale sensitivity and limitations

A separate fixed eight-point/date sensitivity grid used ΔT values 9.184, 69.184 and 129.184 seconds. Changing ΔT by ±60 seconds altered the shared event times by at most 0.186682 seconds and changed no availability state in that sample. This result is not a universal uncertainty bound, especially at tangencies, and it does not remove the separate UT1−UTC approximation.

The old USNO path remains available and unchanged. SPA is explicitly selected for new local compositions; this comparison is not a reason to rewrite historical institution-calendar reconstructions. A better physical coordinate model does not resolve religious substitution rules, actual horizons, source-coordinate choices or institution-specific margins.

## Reproduce and inspect

```sh
TZ=UTC node core/timezones/with-tzdata.mjs core/local/verification/spa-verify.mjs
TZ=UTC node core/timezones/with-tzdata.mjs --test tests/local-spa-reference.test.mjs
```

[spa-verify.mjs](spa-verify.mjs) exports `verifyLocalSPA()`. It compares every declared input against the complete expected fixture, retains unavailable states and ownership errors, checks the old USNO baseline, and returns compact statistics. It writes no files. Python is unnecessary for consuming the frozen expectations. [spa-comparison.json](spa-comparison.json) records both the baseline and new verification aggregates, time conventions, source hashes and numerical-refinement evidence.

The event fixture SHA-256 is:

```text
9f0d6bd56cbf0e540b935b78d58ca8b9012e1986d1bee0867db816a1f684e904
```

The independently retained reference source and coefficient licensing are described in [SPA-POINT.md](../../astronomy/SPA-POINT.md). The reference generator used Python 3.12 with NumPy 2.3.5 and its installed ZoneInfo database. The consuming verification used Node 26.7.0 / ICU 78.3 / tzdb 2026d. The timezone agreement is checked for the declared cases rather than assumed globally.

To independently recompute the reference roots, install NumPy in a Python 3.9+ environment and supply the exact upstream `spa.py` linked in [SPA-POINT.md](../../astronomy/SPA-POINT.md). The optional [spa-oracle.py](spa-oracle.py) checks that file's SHA-256 before executing it, verifies the retained coordinate samples and worked example, and recomputes every event from the fixture's inputs:

```sh
python3 core/local/verification/spa-oracle.py /path/to/pvlib-v0.13.1/spa.py
```

This command makes no network requests and writes no files. It rejects source versions with a different hash and verifies all event states and timestamps against the frozen expectations. The upstream BSD license applies to that separately supplied reference source; no bulky upstream program or report PDF is copied into this verification package.
