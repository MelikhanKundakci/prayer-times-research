# Conservative local winter admission after an annual horizon rejection

The optional [`diyanet-winter.mjs`](diyanet-winter.mjs) helper recovers **ordinary real Fajr and Isha events only** under an explicitly local availability policy. It does not reproduce an unpublished Diyanet transition rule, estimate an absent crossing, or make the original annual context available. Existing profile IDs and the frozen [`northern.mjs`](northern.mjs) implementation retain their behavior.

The motivating case is Oslo: its selected summer horizon night can be shorter than five hours, which blocks the frozen ordinary northern policy for the entire year. In January, the Sun nevertheless crosses −18° before sunrise and −16° after sunset, while the adjoining days and night satisfy the declared five-hour bounds. The new helper checks those winter events individually **after retaining and checking the complete annual transition envelope**.

## Scope and interface

```js
import {buildNorthernContext} from './northern.mjs';
import {admitDiyanetWinterContext} from './diyanet-winter.mjs';

const northern = buildNorthernContext({
  year: 2027, latitude: 59.9139, longitude: 10.7522,
  timeZone: 'Europe/Oslo', solarModel: 'spa',
});
const winter = admitDiyanetWinterContext(northern);
console.log(northern.status); // blocked: retained without modification
console.log(winter.evaluated); // true: the narrow additional proof could run
console.log(winter.days['2027-01-15'].fajr.eligible); // true
console.log(winter.days['2027-06-21'].fajr.eligible); // false
```

Input must be the full result of `buildNorthernContext`. A caller must not manufacture that record to bypass astronomy. The result is a separate object with:

- `policy: 'local-daily-horizon-envelope-v1'`;
- `sourceContextReason`, retaining the original rejection;
- `evaluated`, meaning the narrow additional proof had sufficient dependencies, not that every day is available;
- a context `reason` when it cannot run;
- per-date `fajr` and `isha` records containing `eligible`, `reason`, `rawEpochMilliseconds` and `proof`;
- explicit metadata stating ordinary-only selection, no estimates and no institutional-equivalence claim.

Only `status: 'blocked'` with the exact reason `annual-five-hour-horizon-gate-not-met` is eligible for evaluation. Contexts with incomplete astronomy, absent horizons, missing or invalid anchors, disjoint Fajr absence windows, bad ratios, unavailable annual extrema or unsupported padding stay blocked. An already available context is handled by its existing policy; this helper does not reselect its events. Supported owned years remain 2002–2097 with previous-December-31 and following-January-1 dependencies.

## Retained annual evidence

For each physical night from solar-cycle date D to D+1, let M be selected Maghrib and R selected next sunrise. The existing selected margins are +7 minutes at sunset and −7 minutes at sunrise. Set H = R − M, measured in elapsed UTC time. The existing annual context defines a positive one-third-night interval S:

- where the following real Fajr F exists: S = (F − M) / 3;
- during the single proven seasonal Fajr gap: S = qH, using the existing last-real-Fajr annual anchor ratio q.

Its Isha estimate is I* = M + S. Its Fajr upper estimate is F* = R − S. For a time t, phase φ(t) is elapsed UTC minutes from the upper-meridian transit of the event-owning solar cycle. Across **all padded physical nights**, retain:

- the Isha lower transition envelope L = min(φ(I*) − 20 minutes);
- the Fajr upper transition envelope U = max(φ(F*) + 20 minutes).

The helper checks full padding, candidate algebra, adjacent-night cross-references, raw-event identity, finite-event transit phases, the contiguous missing-Fajr window, anchor q, and both recomputed extrema. This is an additional check on the unchanged source context, not a separate solar provider. The source context already distinguishes a proven seasonal Fajr absence from a numerical failure; the missing-event reason is not reconstructed from a null timestamp. Missing twilight is never admitted by this helper.

## Daily certificate

Each admitted event must have a finite real raw crossing and a finite transit-relative phase. Both bounding solar-cycle days must have raw and selected daylight **strictly longer than 300 minutes**. Their intervening physical night must have raw and selected length **strictly longer than 300 minutes**, and the same-night values in both adjacent records must agree. The existing start-day Maghrib and end-day Sunrise eligibility flags must also be true.

For Fajr on date D, the bounding night starts on D−1. All conditions are required:

1. M(D−1) < F(D) < R(D).
2. φ(F(D)) > U.
3. F(D) > F*(D) + 20 minutes.

For Isha on date D, the bounding night ends on D+1. All conditions are required:

1. M(D) < I(D) < R(D+1).
2. The following real Fajr exists, and I(D) < F(D+1).
3. φ(I(D)) < L.
4. I(D) < I*(D) − 20 minutes.

The inequalities are strict; equality never enables an event. A point inside the annual envelope remains excluded even when its direct nightly bound passes. Therefore relaxing the unrelated **annual minimum horizon duration** cannot by itself admit a transition event. An eligible result selects the unchanged real astronomical instant; it applies no city correction, calendar fit, interpolation or estimate.

This establishes consistency with the **declared local ordinary-event guard**. It is not a proof of Diyanet production behavior or of religious approval. The full day renderer must still check ordering against Dhuhr, Asr and the selected horizon events. The untouched blocked annual context must never be passed to the summer solver as though this additional certificate made it available.

## Regression evidence

[`tests/diyanet-winter.test.mjs`](../../tests/diyanet-winter.test.mjs) uses the SPA point provider and Oslo at 59.9139° N, 10.7522° E in 2027:

| Case | Result |
|---|---|
| January 15 Fajr / Isha | Admitted, exactly the existing raw −18° / −16° crossing instants |
| March 28 Fajr / Isha | Still excluded by the annual envelope although real crossings and direct bounds exist |
| June 21 Fajr / Isha | Still unavailable; no summer estimates generated |
| January 1 Fajr / December 31 Isha | Correct preceding/following-year physical-night dependencies retained |
| October 31 Fajr | Autumn DST handled using elapsed UTC night length |
| Five-hour equality on a bounding day | Excluded even if a stale eligibility flag says true |
| Annual holes, invalid q/extrema or mismatched dependencies | Entire additional proof rejected |

The 2027 Oslo annual result admits **152 Fajr events and 163 Isha events** that the frozen annual-only guard rejected. These counts describe availability under this policy, not calendar agreement, measured observational accuracy, complete days or year-round support. A separate verifier must assess the assembled profile and broader release matrix.

Run the focused regression with:

```sh
node core/timezones/with-tzdata.mjs --test tests/diyanet-winter.test.mjs
```
