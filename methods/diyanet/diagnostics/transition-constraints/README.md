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
python3 -m unittest discover -s . -p test_affine_constraints.py -v
```

Nine tests cover endpoint reversal, ties, positive contradictions, projections, exact float conversion, fractional anchors, global-shift covariance and compound-conflict precedence. An exact synthetic grid includes **1,485** comparisons between projected-value membership and independently expressed fixed-point slope feasibility.

This is the additive V2 diagnostic. Its compound-conflict classification correction leaves every interval and classification in the associated frozen endpoint and quotient studies unchanged. Those reused study results are identification evidence, not fresh accuracy validation or production timing recommendations.
