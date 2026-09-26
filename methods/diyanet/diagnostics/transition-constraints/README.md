# Exact affine feasibility for minute observations

This small Python diagnostic asks whether a straight line can pass through half-open rounding cells:

```text
u - 1/2 <= line(x) < u + 1/2.
```

It contains **no prayer calendars, fitted city parameters, astronomical model or institutional rules**. It does not calculate prayer times. A feasible line means only that these conditional rounding constraints are consistent.

[affine_constraints.py](affine_constraints.py) provides:

- `anchored_slope`: the possible slopes through one fixed `(x,y)` point.
- `affine_slope`: the possible slopes of any compatible affine line.
- `affine_value`: the possible line values at a chosen abscissa, using exact elimination of the slope.
- `transform` and `intersection`: affine interval mapping and intersection with preserved open/closed endpoints.

Use integer day indices and integer minute observations, or explicit `Fraction` values. Finite Python floats are converted to their exact binary rational values; a stored `0.1` is therefore not silently replaced by `1/10`. No epsilon or numeric optimizer enlarges the feasible sets. Exact arithmetic describes the supplied numbers and assumptions, not the precision of the physical event.

```python
from affine_constraints import anchored_slope

observations = [(1, 2, "first"), (2, 4, "second")]
possible = anchored_slope(observations, anchor_x=0, anchor_y=0)
assert possible.contains(2)
print(possible.as_dict())  # slope in [7/4, 9/4)
```

`as_dict()` preserves rational numerators and denominators as strings, approximate display values, endpoint inclusion, and constraint witnesses. `feasible` includes accepted closed singletons. `tie-only-conflict` indicates incompatible strictness at an otherwise touching bound; `positive-conflict` takes precedence whenever a positive contradiction is also present. An empty set does not establish which input assumption is wrong.

Requires Python 3.9 or later, with no third-party dependencies. Run the source-free tests from this directory:

```sh
python3 -m unittest discover -s . -p 'test_*.py' -v
```

Nine tests cover endpoint reversal, ties, positive contradictions, projections, exact float conversion, fractional anchors, global-shift covariance and compound-conflict precedence. An exact synthetic grid includes **1,485** comparisons between projected-value membership and independently expressed fixed-point slope feasibility.

This is the additive V2 diagnostic. Its compound-conflict classification correction leaves every interval and classification in the associated frozen endpoint and quotient studies unchanged. Those reused study results are identification evidence, not fresh accuracy validation or production timing recommendations.

## Segment discovery and positive interval ratios

[identification.py](identification.py) adds two source-free helpers covered by ten identification tests, alongside the original nine. With the moving-anchor, envelope, joint-space, sensitivity and noon-shift tests below, the complete suite has **61 tests**.

- `affine_runs(values, minimum_length=7)` returns **all inclusion-maximal** contiguous compatible intervals, preserving overlapping alternatives. Inputs are ordered `(x, minute, label)` triples with strictly increasing finite `x`. The minimum must be an integer at least two. Split missing/unresolved observations into separate calls before invoking it; no calendar dates, institutional transition days or date interpretations are inferred. A compatible line need not be the generating rule.
- `positive_ratio(numerator, denominator)` returns the exact interval image of all independently possible `A / D`, retaining open/closed bounds and empty-input conflicts. Nonempty input intervals must be bounded with strictly positive lower bounds. Zero-touching, sign-changing and unbounded domains reject explicitly. This restricted contract covers the reviewed factor intervals; it is not unrestricted interval division.

```python
from fractions import Fraction
from affine_constraints import Interval
from identification import affine_runs, positive_ratio

runs = affine_runs([(day, 20-day, str(day)) for day in range(12)])
assert [(r['startIndex'], r['endIndex']) for r in runs] == [(0, 11)]

a = Interval(lower=Fraction(9), upper=Fraction(10))
d = Interval(lower=Fraction(10), upper=Fraction(11))
possible = positive_ratio(a, d)  # (9/11, 1), both ends open
assert possible.contains(Fraction(19, 20))
```

The new tests include an exhaustive projection-based oracle over 243 synthetic sequences, a separate ratio/intersection comparison, strict ties, closed singletons, domain errors and empty-set propagation. See the [study](../../AUTUMN-IDENTIFICATION.md) for reference-derived research uses and their limits. None of these helpers is called by the prayer-time runtime.

## Continuously moving anchors

[moving_anchor.py](moving_anchor.py) adds `moving_anchor_set(values, anchors)`, where `values` are the same strictly increasing `(x, minute, label)` triples and `anchors` are at least two strictly increasing finite `(x, y)` points. Their continuous piecewise-linear interpolant defines `H(t)`. The result is the exact union of locations `t` for which some compatible affine line passes through `(t,H(t))`. It searches only the domain spanned by the anchors, with no extrapolation or automatic missing-event handling. Split missing source observations as appropriate for the intended experiment before using these mathematical tools.

The module also provides `normalize` and `intersect_sets` for finite interval unions. Empty sets remain empty; open touching intervals are not merged across an excluded point. Accepted singleton points can join neighboring pieces. The functions do not choose a best anchor, slope or prayer time.

```python
from moving_anchor import moving_anchor_set

# A single observed zero-minute cell and a constant height H(t)=1.
# Any location except the observation's own x=0 admits a line through both.
possible = moving_anchor_set([(0, 0, 'observation')], [(-1, 1), (1, 1)])
assert len(possible) == 2       # [-1, 0) and (0, 1]
assert not any(i.contains(0) for i in possible)
```

Seven additional source-free tests brought the total at this stage to **26**. They include 3,672 fixed-point slope comparisons, direct tests at observation abscissae, empty source constraints, exact open/closed boundaries and genuine disconnected solutions. The [joint-anchor study](../../JOINT-AUTUMN-ANCHORS.md) states the additional assumptions needed to apply this helper to existing reference-derived constraints. It does not improve the prayer-time runtime by itself.

## Joint endpoint envelopes and ratio constraints

[affine_envelope.py](affine_envelope.py) provides `affine_envelope(values, lower, upper)` for at least two strictly increasing observations and a finite closed search domain. It returns exact rational partition knots, open pieces whose `lower`/`upper` coefficients are `(intercept, slope)`, and a point `Interval` at every knot. Piece flags describe whether the projected value bound is attained inside the open temporal piece. Empty source sets retain their positive/tie-only status. Optimizing faces are checked against all strict constraints; an excluded vertex does not imply that the entire face is excluded.

[joint_space.py](joint_space.py) combines supplied affine endpoint bands. It does not obtain horizons, interpret dates or choose a prayer rule. Its named `A,D,N` quantities are inputs to the conditional algebra `A=q*N*k`, `D=q*N`, with `A>0`, `0<D<N`:

- `band((c0,c1), (d0,d1), lower_closed, upper_closed)` describes affine bounds on an open temporal piece. Both coefficient pairs must be finite; callers must pass complete pieces on which the bound formulas and attainment flags are constant.
- `split_physical(lo, hi, A, D, night)` partitions and clips those bands, returning valid open pieces and all additional knots. Supply `night` as an exact `(intercept, slope)` pair of integers or `Fraction` values; `lin(pair)` converts finite float coefficients to exact binary rationals if needed. The caller **must evaluate every knot separately** using the original endpoint constraints. Do not extrapolate an open-piece attainment flag to a knot.
- `fixed_factor_locations(piece, k)` gives the possible locations for one positive factor on a valid clipped piece.
- `projected_factors(piece)` gives the exact factor interval over a valid clipped open piece. Positive-denominator limits may create an unbounded upper factor interval; constant extrema can be attained even though the temporal piece is open.
- `factor_interval(A, D, night)` and `quotient_interval(A, D, night, k)` operate on pointwise `Interval` inputs. The latter preserves coupling between both events at the supplied positive `k` and night length; it is not a product of independent parameter ranges.
- This module's `normalize` and `intersect_sets` support infinite interval ends as well as strict touching holes. Unlike the finite-only versions in `moving_anchor.py`, they can represent an unbounded factor projection.

Six envelope tests and ten joint-space tests brought the suite at this stage to **42**. They check exact point-oracle agreement, optimizing-face attainment, strict physical limits, zero-denominator limits, constant-ratio extrema, isolated boundaries, disconnected unions and the difference between a common factor and a common time. See the [joint feasible-region study](../../JOINT-FEASIBLE-REGIONS.md) for research inputs and limitations. None of these helpers runs inside the prayer-time calculator.

## Conditional horizon sensitivity

[perturbations.py](perturbations.py) provides exact elimination and sensitivity functions. It accepts the affine source bands described above; coefficients and scalar floats are converted to exact binary rationals. These are endpoint constraints with free source-line slopes, not complete prayer calendars.

- `project_second(inequalities)` existentially eliminates `x` from rows `(a, b, rhs, closed, label)` representing `a*x + b*y <= rhs`, or strict `<` when `closed=False`. It returns the exact interval for `y`, including unbounded directions and strict impossibility.
- `projected_correction(fajr, isha, R, S, N, k, alpha, beta, lo, hi, closed=False, physical=True)` projects the constant correction `z` for perturbed horizons `R+alpha*z`, `S+beta*z` over one temporal piece. Horizon and night inputs are `(intercept,slope)` pairs; source bands include their attainment flags. It requires positive `k` and an ordered finite domain. By default the temporal endpoints are open; evaluate knots separately with `lo=hi` and `closed=True`. With `physical=True`, the shared night duration obeys `0<D<N′`; `physical=False` is only a relaxed lower-bound control.
- `nearest_zero(intervals)` reports the infimum absolute correction and whether it is attained. An empty set is not a zero correction; an open zero boundary is not an accepted zero.

[fixed_quotient.py](fixed_quotient.py) supplies `projected_fixed_quotient` with an additional explicit `q` argument before `k`. It retains `0<q<1`, recomputes both endpoint responses to the perturbed night length, and requires `N′>0`. It does not recalculate a location-dependent solar model or quotient rule. Normalized unions can be built with the existing `joint_space.normalize` helper.

Eight perturbation tests and three fixed-quotient tests bring the public suite to **53**. They cover 1,250 elimination/point-oracle comparisons, open versus attained optima, physical-night exclusions, unchanged versus recomputed night terms, unbounded eliminated directions and isolated temporal knots. The [three-case study](../../THREE-CASE-CAUSES.md) explains why these sensitivities do not identify city coordinates or authorize clock offsets.

## Eliminate a constant noon shift

[noon_shift.py](noon_shift.py) reuses the exact interval kernel to ask whether one constant shift can make supplied raw noon values agree with every reference minute. It returns the complete interval and limiting record IDs; it never selects a shift or produces adjusted prayer times. The [noon-shape study](../../NOON-SHAPE-TRANSFER.md) explains the institutional inference limits.

```python
from noon_shift import analyze_noon_shift

# Synthetic epochs, not prayer observations.
result = analyze_noon_shift([
    {"id": "a", "rawEpochMilliseconds": 1_000.125,
     "referenceEpochMilliseconds": 60_000},
    {"id": "b", "rawEpochMilliseconds": 12_345.5,
     "referenceEpochMilliseconds": 60_000},
])
assert result["status"] == "complete"  # input completeness, not feasibility
print(result["unbounded"]["status"])
print(result["bounded"]["status"])    # closed ±60,000 ms bound by default
assert result["offsetSelected"] is False
```

Records must be nonempty, have distinct nonblank string IDs, finite numeric raw epochs (integers, floats or `Fraction`), and integer reference epochs aligned to UTC minutes. Booleans are rejected as numbers. Unresolved values reject by default. With `allow_incomplete=True`, any missing raw/reference value returns `insufficient-data`, without presenting the resolved subset as feasible. Empty inputs always reject. `bound_milliseconds=None` omits the bounded result; a finite nonnegative bound changes only that result.

Each row constrains the shift to `[reference − raw − 30,000, reference − raw + 30,000)` milliseconds. Endpoint closure, exact rational values, signed interval width and residual span remain explicit. A positive conflict gap is a constraint contradiction under the supplied assumptions, not an observed event-time error. Adding eight noon-shift tests brings the complete public suite to **61 tests**.

The caller must establish that one constant shift is a meaningful shared assumption for the supplied records. This helper does not identify the city, date, prayer, solar model or source, and cannot establish that two records belong to the same institutional calculation point.
