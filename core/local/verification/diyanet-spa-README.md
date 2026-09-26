# Diyanet point profile with SPA: numerical evidence

This report compares `diyanet-published-spa-point-v1` with the existing USNO point profile on a fixed, source-free grid. Both use the same named Diyanet criteria and local conventions; only the solar-position implementation changes. It is **not** a comparison with Diyanet calendars, observed prayer onsets, or evidence that this profile is more accurate in use.

## Fixed annual grid

The frozen grid contains 2,921 civil days across eight declared point/year cases (Istanbul 2027; Frankfurt 2027 and 2028; Oslo, Tromsø, Tokyo, Sydney and a synthetic antimeridian point in 2027). It compares six events per day, or 17,526 event fields for each profile. The selected-event status counts are identical for both:

| Status | Fields |
| --- | ---: |
| Calculated | 14,697 |
| Estimated (the documented Asr substitution) | 56 |
| Policy-blocked | 2,773 |

Thus 14,753 fields have selected instants and 2,773 remain blocked. No event changed status or reason, and northern eligibility, annual anchors and missing-twilight gap boundaries did not change.

For the 14,753 selected instants, SPA-versus-USNO absolute elapsed-time difference has a median of **0.489174 s**, a nearest-rank 95th percentile of **1.401830 s**, and a maximum of **3.918885 s**. The nearest-minute label differs on 135 available fields. These statistics compare two model outputs; they are not errors against an independent prayer-time truth. All 135 changed labels count in these totals rather than being excluded.

Among unadjusted physical crossings, the maximum difference is **56.428393 s** for Tromsø Isha on 31 March 2027. The selected Isha is policy-blocked on that date. The raw crossing difference therefore does not represent a selected prayer time or a changed policy decision.

## Independent implementation check

A separate frozen fixture checks SPA events against a Python reference that directly evaluates pvlib-python 0.13.1 SPA coordinates and independently solves continuous crossings. In 22 synthetic cases it compares 116 event roots, 16 absent events, 44 solar-cycle boundaries and 24 ordinary-profile margin applications at Istanbul. Maximum absolute event-root difference is **0.000208855 s**; the cycle-boundary maximum is **0.000217438 s**. This is numerical consistency between implementations of the same SPA coordinate model and declared conventions, not observed astronomical precision or a religious-rule validation. The prior, distinct 348-case SPA reference sample remains unchanged; see [the general SPA verification report](spa-README.md).

## Reproduce

From the repository root, using the pinned timezone wrapper:

```sh
TZ=UTC node core/timezones/with-tzdata.mjs core/local/verification/diyanet-spa-compare.mjs
TZ=UTC node core/timezones/with-tzdata.mjs core/local/verification/diyanet-spa-reference-verify.mjs
TZ=UTC node core/timezones/with-tzdata.mjs --test tests/local-diyanet-spa.test.mjs tests/local-diyanet-spa-comparison.test.mjs tests/local-spa-reference.test.mjs
```

The annual comparison recomputes its declared grid without network access, source calendars, or result-file reads, checks implementation hashes during the run, and writes `diyanet-spa-comparison.json`. The recorded run took approximately 104 seconds. The independent reference verifier consumes the frozen synthetic fixture. The original 348-case SPA tests remain a separate check. The release test record in `verification.json` includes the local browser prototype's loopback check.

To recompute the independent reference itself, use Python with NumPy and the pinned upstream `spa.py` identified in [the SPA source notes](../../astronomy/SPA-POINT.md):

```sh
python3 core/local/verification/diyanet-spa-reference-oracle.py /path/to/pvlib-v0.13.1/spa.py
```

The [reference script](diyanet-spa-reference-oracle.py) checks the upstream source hash, independently recalculates all 22 declared cases, and compares them with the frozen fixture. It makes no network requests. It writes no files unless a separate `--output` path is supplied, and refuses to overwrite either frozen SPA fixture.

The retained results and declarations are in [`diyanet-spa-comparison.json`](diyanet-spa-comparison.json), [`diyanet-spa-reference-fixtures.json`](diyanet-spa-reference-fixtures.json), and [`verification.json`](../verification.json). No conclusion here establishes agreement with any institution's production calendar or a guarantee of prayer onset to the second.
