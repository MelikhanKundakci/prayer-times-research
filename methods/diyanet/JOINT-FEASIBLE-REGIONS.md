# Joint autumn location, night quotient and Fajr factor

**Allowing the anchor and night quotient to vary together explains more endpoint constraints, but supplies no transferable prayer-time formula.** With `k=18/16`, 25 of the 28 already exposed city-years have some compatible autumn location and quotient under the stated assumptions, compared with 13 when the quotient is fixed. Berlin 2026, Berlin 2027 and the Helsinki 2026 Isha tie remain incompatible. No calculation, default, notification status or calendar accuracy score changes.

This is retrospective local research using the existing observations. No new prayer-calendar/API requests or institutional contact were made. These 28 cases are not a fresh holdout. See the preceding [joint-anchor study](JOINT-AUTUMN-ANCHORS.md) for the rejected complete-calendar candidates and the fixed-quotient control.

## What is now allowed to vary

For each case, `b` is its unchanged autumn anchor. Let `t` range continuously over the closed interval `[b−3,b+3]`. Adjusted sunrise `R(t)` and sunset `S(t)` are linearly interpolated between the existing model's daily values; the stored binary64 values become their exact binary rational numbers. Define:

```text
N(t) = 1440 + R(t) − S(t)
Bf(t) = R(t) − q N(t) k
Bi(t) = S(t) + q N(t)
0 < q < 1, k > 0
```

`Bf` and `Bi` may be the values at `t` of **independently sloped affine lines** compatible with the existing Fajr and Isha minute observations. These lines are not assumed to be the actual output of recomputed 20-minute outer crossings. A shared `t,q,k` must explain both events within a case; neither event gets its own quotient. Each city-year may have different `t,q` when projecting possible factors.

Two no-gap June 21 cases are deliberately included in this relaxed diagnosis; this does not authorize changing their calendar rules. The search is restricted to the same model horizons, minute-rounding cells and previously selected autumn runs. It does not identify production coordinates, true event seconds or institution-wide behavior.

## Exact feasible sets

| Separate sensitivity | Cases with some `t,q` at `k=18/16` / 28 | At original `b`, with free `q` / 28 | Cases allowing some `t,q,k` / 28 | Common displacement at `k=18/16` |
|---|---:|---:|---:|---|
| Full observation runs | 25 | 16 | 27 | None |
| Remove one observation at each end | 26 | 18 | 28 | None |
| Remove two observations at each end | 27 | 22 | 28 | None |

The full-run failures at `18/16` are Berlin 2026, Berlin 2027 and Helsinki 2026. With one-end trimming, both Berlin years remain incompatible; with two-end trimming, Berlin 2026 remains incompatible. Helsinki's full-run Isha observations do not admit any affine line under the declared half-open minute cells. That tie-only conflict remains visible and prevents a full-run all-case factor intersection regardless of endpoint freedom.

For each case we also project **all** possible factors over its entire searched location/quotient domain. After either separately reported trimming sensitivity, the intersection across all 28 factor projections is the same open interval:

```text
1.1186203705480322 < k < 1.1237882979270686
```

These decimals only display exact rational bounds, retained in the [complete feasible regions](research/joint-feasible-regions-2026-09-26.json). Bremen 2027 supplies the lower bound and Berlin 2026 the upper bound. This overlap permits a **different anchor and quotient in every case**. It does not establish a common displacement, an equation for choosing the quotient, or a correct replacement for `18/16 = 1.125`. No midpoint or other fitted value is selected. Removing endpoint observations is a sensitivity check, not a proposed rule for ignoring calendar errors.

The report retains coupled piecewise constraints, not only independent marginal ranges. With `A=R−Bf` and `D=Bi−S`, clip `A>0` and `0<D<N`; at any specified `t,k`, the permissible quotient is exactly:

```text
q ∈ (D ∩ (A/k)) / N
```

The [sampled quotient export](research/joint-quotient-samples-2026-09-26.json) records all 2,542 checked locations, including empty intervals. Independent choices from a factor range and a quotient range must not be combined without checking this coupling.

## A specific angle-to-time interpretation fails the endpoint screen

The archived Turkish/English criteria name the last real Fajr day, a night ratio and a two-degree difference, but do not unambiguously specify its conversion to clock minutes. Existing [rule evidence](RULE-EVIDENCE.md) separates those textual criteria from our numerical reconstructions.

A local evidence audit identified one distinct boundary interpretation to screen. It keeps the original reference-day quotient `q0`, takes the descending physical Fajr-availability boundary `δ(t)=72°−latitude`, and converts the altitude difference between −18° and −16° at that boundary into a solar hour-angle duration:

```text
H16 = acos((sin(−16°) − sin(latitude) sin(δ))
           / (cos(latitude) cos(δ)))
Δ2 = 4 × (180° − H16) minutes
Bi = S(t) + q0 N(t)
Bf = R(t) − q0 N(t) − Δ2
k = 1 + Δ2 / (q0 N(t))
```

This is a conjectural reading, not a published production equation. Its screen was separately frozen **after** the joint-region results. Of the original 28 cases, 26 have this gap boundary; Zagreb and Vienna 2027 remain explicitly outside this interpretation's scope.

| Boundary interpretation, full runs | Compatible Fajr / 26 | Compatible Isha / 26 | Both / 26 |
|---|---:|---:|---:|
| New angular-duration reading, original quotient | 0 | 5 | 0 |
| Earlier fractional-boundary control, original quotient and `18/16` | 8 | 5 | 2 |

The new interpretation still has zero Fajr/joint compatibility in both trimming sensitivities. Its factors range approximately **1.849–1.959**, outside every case's corresponding relaxed factor projection. Its extra angular duration is about 77–101 minutes in these inputs. [All screen results and the frozen plan](research/angular-boundary-screen-2026-09-26.json).

It also fails to define a continuous complete calendar if the preceding frozen-night branch remains unchanged: the endpoint mismatch `q0 N/8−Δ2` is approximately −87 to −67 minutes. The source does not supply a taper or another rule closing that mismatch. We therefore retain this as an unsuccessful boundary interpretation, not a new full-calendar candidate. No arbitrary continuation or per-city correction is added. This rejects that particular reading under the declared assumptions; it does not establish the intended meaning of the institution's two-degree rule.

## Mathematics, review and reproducibility

The source-free [affine envelope helper](diagnostics/transition-constraints/affine_envelope.py) builds the bounded closure polygon of compatible affine lines. It evaluates whether an optimizing face actually contains a line satisfying every strict upper-cell constraint; a closure vertex alone is not sufficient. Lower and upper endpoint projections are piecewise affine in `t`.

The [joint-space helper](diagnostics/transition-constraints/joint_space.py) partitions those envelopes at horizon knots and physical clipping intersections. Fixed-factor feasibility reduces to affine inequalities in `t`. Each extremal factor ratio is linear-fractional, so its extrema on an open piece occur at limits or are constant and potentially attained throughout the interior. Knots are checked separately. Exact unions preserve excluded touching points and disconnected alternatives; a sampled grid is not used to claim nonexistence.

Six envelope tests and ten joint-space tests bring the public diagnostic suite to **42 Python tests**. The existing **141 Node tests** remain unchanged. The research driver replays all **588** earlier integer-shift factor intervals, checks **2,542** exact point memberships and **695** joint quotient witnesses, and verifies that all previously feasible fixed-quotient location intervals remain included. These are software and reused-data checks, not new accuracy observations. Independent review and publication hashes are recorded in the [verification bundle](research/joint-feasible-verification-2026-09-26.json).

Review noticed that the initial report validated non-knot quotient samples without serializing all of them, despite the frozen plan requesting their retention. A separately hashed supplemental export now retains every sampled quotient interval. The original report and its results are unchanged; this correction is recorded rather than rewriting the plan.

The next numerical improvement needs an independently motivated equation for the coupled quotient/conversion and a complete, continuous transition rule. The feasible interval above supplies a constraint on such a rule, not evidence for a new fitted factor. No universal Diyanet equivalence or notification readiness follows from this study.
