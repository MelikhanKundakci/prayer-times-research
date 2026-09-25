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

[identification.py](identification.py) adds two source-free helpers covered by ten identification tests, alongside the original nine. With the moving-anchor tests below, the complete suite has **26 tests**.

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

Seven additional source-free tests bring the total to **26**. They include 3,672 fixed-point slope comparisons, direct tests at observation abscissae, empty source constraints, exact open/closed boundaries and genuine disconnected solutions. The [joint-anchor study](../../JOINT-AUTUMN-ANCHORS.md) states the additional assumptions needed to apply this helper to existing reference-derived constraints. It does not improve the prayer-time runtime by itself.
