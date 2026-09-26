# Independent northern ordinary-guard verification

This fixture verifies a **declared conservative local model**, not an institution's complete seasonal algorithm. It contains nine synthetic point/year inputs and independent Python calculations. No prayer-calendar rows, API responses, fitted city corrections or public-clock accuracy scores are included.

The generator imports the sibling independent Python [physical oracle](oracle.py). It does not import JavaScript. Every required solar cycle is calculated from December 31 of the preceding year through January 1 of the following year. Both raw and selected daylight and every consecutive raw and selected horizon night must exceed five elapsed hours. Missing or invalid annual dependencies block the whole context; they are never omitted to obtain a smaller transition envelope.

## Exact modeled guard

Each night pairs selected Maghrib of cycle `D` with selected sunrise and real Fajr of cycle `D+1`, using UTC instants. With real Fajr present, the night-third is `(real Fajr − selected Maghrib)/3`. A single bounded missing-Fajr interval uses the last real night's frozen quotient times the current selected-horizon night. Selected Maghrib and sunrise retain the declared +7/−7-minute margins.

The Isha estimate is Maghrib plus this third. The Fajr **upper bound** is sunrise minus this third; the unknown additional positive Fajr duration is not selected. The candidate times are expressed in elapsed minutes from their own upper transits. Both annual envelopes include **all padded consecutive-night candidates**, including candidates just outside the owned year:

```text
Isha outer threshold = minimum(Isha estimate phase − 20 minutes)
Fajr outer threshold = maximum(Fajr upper-bound phase + 20 minutes)
```

Only true angle events strictly outside their respective outer envelope and their daily UTC bound qualify. Isha must also precede the next **real** Fajr. Equal boundaries and absent real signs do not qualify. This selects no estimated summer prayer time and no seasonal interpolation. The transit-relative frame and conservative envelope are explicit profile conventions; the verification does not prove that the publisher uses them.

## Fixture coverage

| Synthetic point/year label | Latitude / longitude | Purpose |
| --- | --- | --- |
| Bordeaux 2027 | 44.84 / −0.58 | All-year real Fajr and ordinary-rule envelope |
| Frankfurt 2027 and 2028 | 50.11 / 8.68 | Missing summer Fajr, frozen ratio and leap year |
| Berlin 2027 | 52.52 / 13.405 | Longer missing-sign interval |
| Edinburgh 2027 | 55.95 / −3.19 | Higher latitude with ordinary horizons |
| Oslo 2027 | 59.91 / 10.75 | Entire annual context blocked by short selected summer nights |
| Two antimeridian representations, 2027 | 50 / ±180 | Physical alias and Asia/Anadyr date ownership |
| Synthetic New York-zone point, 2027 | 50 / −74 | DST timezone with a northern mathematical point |

These coordinates are declared mathematical inputs, not verified production points. Full-year Fajr/Isha eligibility bitstrings retain every owned date. Annual extrema, quotient and a small set of independent UTC night samples are stored without dumping every event timestamp. Ordinary eligibility is not an accuracy percentage or a statement of religious approval.

The generator also checks synthetic arithmetic identities: the 280-second change in a one-third boundary when the start changes from raw sunset to selected Maghrib +7 minutes; elapsed UTC thirds across both DST directions; strict five-hour millisecond boundaries; ordinary threshold equality and neighboring values; and Isha-before-next-real-Fajr chronology. These arithmetic self-checks do not by themselves exercise private JavaScript branches; the full-year verifier tests the public implementation against the independently generated decisions.

## Run and regenerate

From the repository root:

```sh
TZ=UTC node core/timezones/with-tzdata.mjs core/local/verification/northern-verify.mjs
python3 core/local/verification/northern-oracle.py
```

The JavaScript verifier exports synchronous `verifyLocalNorthern()` and supports direct CLI output. It compares every eligibility decision, annual threshold, used frozen quotient, interval identity and sampled UTC timestamp. The timestamp tolerance is 0.1 seconds, a numerical consistency threshold rather than a physical timing guarantee.

The retained comparison passes all **6,572 Fajr/Isha decisions over 3,286 owned days**, all 3,295 padded night candidates, 36 guards preventing padding rows from becoming selected dates, and 490 sampled UTC timestamps from 71 nights. Eight annual contexts are available; Oslo is wholly blocked by the annual horizon gate. The largest sampled timestamp difference is below 0.000026 seconds and the largest threshold difference below 0.000023 seconds. These are implementation differences within the chosen equations, not real-world accuracy claims. The public Node test invokes the same verifier without regenerating or changing the fixture.

Python regeneration uses the operating system's `zoneinfo`; the retained fixture used system tzdb 2026c.1.0. The JavaScript comparison should run with the repository's pinned ICU 78.3/tzdb 2026d wrapper. No timezone database is downloaded by the generator. Investigate changes in ownership if regenerating with another timezone database.

Both implementations share the published USNO approximate coordinate equations. Their independent code paths and searches can find implementation errors, but agreement is not independently observed astronomical truth. The numerical root search is bounded, not an analytic all-roots proof. The grid does not establish every supported year, latitude, horizon, refraction condition or ambiguous seasonal-source convention.
