# Joint autumn anchors, Fajr factor and night definition

**Four new full-calendar hypotheses fail the replacement checks.** Additional exact diagnostics also show that changing the autumn anchor alone is insufficient under the current quotient and Fajr-factor assumptions. No timing formula, default or notification setting is changed. All 28 reference city-years were already exposed; this is retrospective research with no new prayer-calendar/API requests or institutional contact.

## Complete forecasts: use the preceding or following autumn row

The current seasonal model anchors its autumn estimate on the last row without real Fajr, `b`. Two separately frozen candidates use `t=b−1` or `t=b+1` in gap years. They jointly recompute:

```text
N(t) = 1440 + adjustedSunrise(t) − adjustedSunset(t)
Bf(t) = adjustedSunrise(t) − frozenQ × N(t) × 18/16
Bi(t) = adjustedSunset(t) + frozenQ × N(t)
Fajr threshold = Bf(t) + 20 minutes
Isha threshold = Bi(t) − 20 minutes
```

The normal-side angular crossings and autumn interpolation are recalculated from these values; this is not an additive clock correction. Spring, the original quotient day, four other events and the solstice-envelope rules remain unchanged. No-gap June 21 cases are identical to the baseline. Physical last-missing/first-returning metadata remains distinct from the experimental estimated anchor.

The reference criteria do not specify these adjacent-row conventions. They are bounded interpretations of an unresolved endpoint contract, not sourced Diyanet production equations. The physical criterion `declination = 72° − latitude` has already been tested as a fractional boundary on the current baseline and rejected. Repeating that earlier candidate would not be new evidence.

All variants retain **61,320 planned fields**, eight unresolved source zero clocks and **61,312 comparable fields**. The table uses the explicitly conditional, publisher-unconfirmed next-day interpretation for Isha printed before Maghrib:

| Formula | Exact | Within ±1 minute | Maximum |
|---|---:|---:|---:|
| Current baseline | 53,291 | 61,267 | 2 min |
| Autumn anchor one row earlier | 52,722 | 60,783 | 4 min |
| Autumn anchor one row later | 53,013 | 61,143 | 4 min |

The earlier row corrects 29 previously nonexact fields but loses 598 exact ones; the later row corrects 234 and loses 512. The earlier row worsens within-one counts in 45 city/event groups and increases the maximum in 42; the later row does so in 24 and 21 groups. Both fail the predeclared gate. No annual output becomes unavailable.

**Narvik 2027 is a useful counterexample to single-city selection:** the earlier row moves both Fajr and Isha to 365/365 within one minute there, while other cities regress. We do not install that correction specifically for Narvik. The [full case/event results](research/joint-autumn-rows-2026-09-25.json) retain losses, error fields and both date interpretations. Under primary printed dates, exact totals are 53,215 / 52,646 / 52,937, and the existing date-scale maximum remains 1,441 minutes. No modulo-day comparison hides it.

## Adaptive follow-up: combine the preceding night with the boundary change

After those results, a separately frozen follow-up tests exactly two new interactions. It first reproduces the previously rejected current-baseline preceding-evening quotient:

```text
qPrev = (rawFajr[r] + 1440 − adjustedSunset[r−1])
        / (3 × (1440 + adjustedSunrise[r] − adjustedSunset[r−1]))
```

`r` remains the last real spring-Fajr day, or June 21 without a gap. Both new variants combine `qPrev` with one of the two gap-year autumn shifts. All preceding-night variants also use `qPrev` in no-gap years, where their forecasts equal the control. Estimated daily nights remain same-row and `18/16` stays fixed. Spring/summer and Fajr/Isha envelopes may change through the different quotient; only the other four event objects are asserted unchanged.

| Formula, same conditional interpretation | Exact / 61,312 | Within ±1 minute | Maximum |
|---|---:|---:|---:|
| Previously tested preceding-night control | 51,005 | 61,159 | 3 min |
| Preceding night + earlier autumn row | 50,709 | 60,521 | 4 min |
| Preceding night + later autumn row | 51,276 | 61,189 | 4 min |

The later-row interaction improves the rejected control, but remains worse than the current baseline. Both new interactions fail; no further variants are selected after these results. This follow-up is explicitly adaptive, not retrospectively described as part of the first frozen plan. [Complete interaction scores](research/joint-night-boundary-2026-09-25.json).

## Discrete anchor shifts with an unknown Fajr factor

A separate necessary-condition diagnosis moves the affine projection point and its **model horizons** together through `b+d`, for each common integer `d ∈ {−3,…,+3}`. It allows an independently free night quotient per case and independently free event slopes, then projects:

```text
k = (R[b+d] − Bf[b+d]) / (Bi[b+d] − S[b+d])
```

Both numerator and denominator must be positive, with the denominator less than the corresponding night length. Empty event constraints remain empty. No factor or shift is selected for deployment.

| Common shift, days | −3 | −2 | −1 | 0 | +1 | +2 | +3 |
|---|---:|---:|---:|---:|---:|---:|---:|
| Full-run cases compatible with `k=18/16`, out of 28 | 2 | 4 | 4 | 16 | 11 | 1 | 1 |

For **every** common shift, the intersection of possible factors across all 28 cases is empty. It remains empty in the separately reported one-/two-endpoint trimming sensitivities. This does not rule out a different compound rule that changes additional assumptions or uses distinct geometrically justified dates. The [aggregate](research/joint-anchor-factor-2026-09-25.json) retains all 588 case/shift/trim factor intervals, including the full-run Helsinki tie conflict.

## Continuous anchor locations, with the current quotient and factor fixed

An independent diagnostic gives the anchor **any real position in `[b−3,b+3]`**, not just an integer row. Model sunrise and sunset are linearly interpolated between stored daily values. For each case, its existing frozen `q0` and `k0=18/16` stay constant. These are different assumptions from the free-quotient factor diagnosis above.

For every candidate location `t`, ask whether a source-compatible affine line can pass through `(t,Hf(t))`, and likewise `(t,Hi(t))`, where `Hf/Hi` are the model formulas in the first section. The two lines may have independently free slopes. We solve for exact unions of feasible locations, retaining disconnected alternatives and excluded boundary points.

| Separate sensitivity | Cases with some joint location / 28 | Compatible at original anchor / 28 | One common displacement across all cases |
|---|---:|---:|---|
| Full runs | 13 | 3 | None |
| Remove one endpoint observation at each end | 16 | 5 | None |
| Remove two endpoint observations at each end | 19 | 7 | None |

The 13-case count allows **each case its own position**; it is not a discovered transferable correction. The other 15 full-run cases cannot be explained by moving this anchor within the searched window under the fixed quotient/factor/horizon assumptions, even with free slopes. Two no-gap cases are included as a deliberately relaxed diagnostic; the complete-calendar adjacent-row candidates preserve their June 21 rule.

Feasibility does not prove that recomputing the outer threshold crossing produces those slopes, or that the resulting full calendar agrees. No inferred date is installed. [All continuous feasible sets](research/continuous-autumn-anchor-2026-09-25.json).

## Exact mathematics and verification

On each linear model-horizon segment, split again at every observation day so denominator signs are known. Each rounded source minute bounds the slope of a line through `(t,H(t))`. Pairwise lower/upper comparisons have cancelling quadratic terms and reduce to affine inequalities in `t`. Exact cutpoints are checked separately; unions preserve half-open holes and closed singletons. The published [moving-anchor helper](diagnostics/transition-constraints/moving_anchor.py) contains no calendars, solar model or institutional policy.

Seven source-free tests cover this solver, including 3,672 rational grid comparisons against fixed-point slope feasibility and an excluded singular point between two valid intervals. The public diagnostic suite now has **26 Python tests**; the existing **141 Node tests** remain unchanged. The [diagnostic README](diagnostics/transition-constraints/README.md) documents the input contract.

Independent review of the first two full-calendar candidates reconstructed 56,940 seasonal values and branch labels, 936 transition numbers and 367,920 scoring decisions across both date interpretations. It verified 81,760 unchanged other-event objects. A separate replay of the four-model adaptive follow-up checked 81,760 helper values and branch labels, 1,344 transition numbers, 122,640 unchanged other-event objects and 490,560 scoring decisions; the earlier control's 61,320 event UTCs reproduce exactly. The continuous solver replays all 168 original fixed-endpoint statuses and agrees with fixed-point feasibility at 5,327 rational sample locations, including output boundaries and neighboring points. The discrete factor review independently rereads all 196 shifted horizon rows, checks all 588 factor intervals and replays all 84 zero-shift intervals. These are reused references and software checks, not new institutional accuracy observations. [Verification and publication hashes](research/joint-autumn-verification-2026-09-25.json).

Review caught an initial discrete diagnostic that moved the projected date but accidentally retained the old day's horizons. Its report remains marked superseded; the corrected calculation uses `R[b+d]` and `S[b+d]` and passes an explicit shifted-input regression check. Original input hashes were initially recorded after that draft calculation; a separately preserved input snapshot was validated before the corrected run. No invalid draft result or unfinished alternate continuous-solver draft is used here.

The adaptive preceding-night plan also retained an inconsistent sentence from the earlier experiment saying spring outputs would remain unchanged. Its explicit rule and preservation sections correctly state that changing the quotient can change spring. Implementation and independent verification follow that rule: only the interactions' spring helpers match the preceding-night control, not the original baseline. The exported plan is preserved with this erratum rather than silently rewritten.
