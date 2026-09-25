"""Exact feasible moving-anchor locations for quantized affine observations."""
from fractions import Fraction as F
from affine_constraints import Interval, anchored_slope, cells, intersection, rational


def normalize(intervals):
    """Finite interval union; preserve holes where both touching ends are open."""
    good = [i for i in intervals if i.status == 'feasible']
    if any(i.lower is None or i.upper is None for i in good):
        raise ValueError('finite intervals required')
    good.sort(key=lambda i: (i.lower, not i.lower_closed, i.upper))
    out = []
    for i in good:
        if not out or i.lower > out[-1].upper or (i.lower == out[-1].upper and not (i.lower_closed or out[-1].upper_closed)):
            out.append(Interval(lower=i.lower, upper=i.upper, lower_closed=i.lower_closed, upper_closed=i.upper_closed))
            continue
        last = out[-1]
        if i.upper > last.upper:
            last.upper, last.upper_closed = i.upper, i.upper_closed
        elif i.upper == last.upper:
            last.upper_closed = last.upper_closed or i.upper_closed
    return out


def intersect_sets(left, right):
    return normalize([intersection([a, b]) for a in left for b in right])


def moving_anchor_set(values, anchors):
    """Return all t admitting a compatible source line through (t,H(t)).

    H is continuous piecewise linear through supplied (x,y) anchors. Anchor
    and observation x values must be strictly increasing. Output is an exact
    finite union, not a fitted t or a prayer-time policy.
    """
    source = cells(values)
    knots = [(rational(x), rational(y)) for x, y in anchors]
    if len(knots) < 2 or any(a[0] >= b[0] for a, b in zip(knots, knots[1:])):
        raise ValueError('at least two increasing finite anchors required')
    intervals, points = [], {}
    for (xa, ya), (xb, yb) in zip(knots, knots[1:]):
        m = (yb-ya)/(xb-xa)
        c = ya-m*xa
        cuts = sorted({xa, xb, *(x for x, _, _ in source if xa < x < xb)})
        for t in cuts:
            h = m*t+c
            if t in points:
                assert points[t] == h
            points[t] = h
        for lo, hi in zip(cuts, cuts[1:]):
            mid = (lo+hi)/2
            lowers, uppers = [], []
            for x, u, label in source:
                low, high = u-F(1, 2), u+F(1, 2)
                if x > mid:
                    lowers.append((low-c, -m, x, F(-1), True))
                    uppers.append((high-c, -m, x, F(-1), False))
                else:
                    lowers.append((c-high, m, -x, F(1), False))
                    uppers.append((c-low, m, -x, F(1), True))
            valid = Interval(lower=lo, upper=hi)
            for nl0, nl1, dl0, dl1, lc in lowers:
                for nu0, nu1, du0, du1, uc in uppers:
                    constant = nl0*du0-nu0*dl0
                    linear = nl1*du0+nl0*du1-nu1*dl0-nu0*dl1
                    assert nl1*du1-nu1*dl1 == 0
                    valid.add_leq(linear, -constant, lc and uc)
                if valid.status != 'feasible':
                    break
            intervals.append(valid)
    for t, h in points.items():
        if anchored_slope(source, t, h).status == 'feasible':
            intervals.append(Interval(lower=t, upper=t, lower_closed=True, upper_closed=True))
    return normalize(intervals)
