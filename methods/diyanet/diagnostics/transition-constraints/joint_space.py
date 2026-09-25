"""Exact joint endpoint diagnostics; no solar or institutional policy.

An affine expression is (constant, slope). A band has lower/upper affine
expressions and bound-attainment flags, valid on an OPEN temporal piece.
Explicit temporal knots are evaluated separately by the caller.
"""
from fractions import Fraction as F
from affine_constraints import Interval, intersection, rational, transform


def lin(value):
    return tuple(rational(x) for x in value)


def at(expr, t):
    return expr[0] + expr[1] * t


def sub(a, b):
    return (a[0] - b[0], a[1] - b[1])


def mul(a, k):
    return (a[0] * k, a[1] * k)


def band(lower, upper, lower_closed=False, upper_closed=False):
    return {'lower': lin(lower), 'upper': lin(upper),
            'lower_closed': lower_closed, 'upper_closed': upper_closed}


def value_band(b, t):
    return Interval(lower=at(b['lower'], t), upper=at(b['upper'], t),
                    lower_closed=b['lower_closed'], upper_closed=b['upper_closed'])


def normalize(intervals):
    """Exact interval union including infinite ends and excluded point holes."""
    good = [i for i in intervals if i.status == 'feasible']
    good.sort(key=lambda i: (i.lower is not None, i.lower or F(0), not i.lower_closed))
    out = []
    for i in good:
        if not out or (out[-1].upper is not None and i.lower is not None and
                       (i.lower > out[-1].upper or
                        i.lower == out[-1].upper and not (i.lower_closed or out[-1].upper_closed))):
            out.append(Interval(lower=i.lower, upper=i.upper,
                                lower_closed=i.lower_closed, upper_closed=i.upper_closed))
        else:
            last = out[-1]
            if last.upper is not None and (i.upper is None or i.upper > last.upper):
                last.upper, last.upper_closed = i.upper, i.upper_closed
            elif last.upper == i.upper:
                last.upper_closed = last.upper_closed or i.upper_closed
    return out


def intersect_sets(a, b):
    return normalize([intersection([x, y]) for x in a for y in b])


def physical(A, D, night):
    """Exact pointwise clipping. A>0 and 0<D<N; emptiness is retained."""
    n = rational(night)
    return (intersection([A, Interval(lower=F(0))]),
            intersection([D, Interval(lower=F(0), upper=n)]))


def factor_interval(A, D, night):
    A, D = physical(A, D, night)
    if A.status != 'feasible' or D.status != 'feasible':
        statuses = [A.status, D.status]
        return Interval().add_leq(0, -1 if 'positive-conflict' in statuses else 0,
                                 False, ['empty-factor-input', statuses])
    if any(v is None for v in (A.lower, A.upper, D.lower, D.upper)):
        raise ValueError('bounded endpoint bands required')
    return Interval(lower=A.lower/D.upper,
                    upper=A.upper/D.lower if D.lower else None,
                    lower_closed=A.lower_closed and D.upper_closed,
                    upper_closed=A.upper_closed and D.lower_closed if D.lower else False)


def quotient_interval(A, D, night, k):
    """Coupled q interval at one t,k; never independent marginal products."""
    k, n = rational(k), rational(night)
    if k <= 0 or n <= 0:
        raise ValueError('positive factor and night required')
    A, D = physical(A, D, n)
    return transform(intersection([D, transform(A, 1/k)]), 1/n)


def _constrain(domain, expr, closed):
    domain.add_leq(expr[1], -expr[0], closed)


def split_physical(lo, hi, A, D, night):
    """Partition/clamp affine bands; returns valid open pieces and ALL knots.

    A and D before clipping may be negative, tied or disjoint. Splitting all
    candidate bound intersections keeps ordering/attainment fixed inside.
    """
    lo, hi = rational(lo), rational(hi)
    if not lo < hi:
        raise ValueError('nonempty finite temporal interval required')
    zero = (F(0), F(0))
    expressions = [A['lower'], A['upper'], D['lower'], D['upper'], zero, night]
    cuts = {lo, hi}
    for a in expressions:
        for b in expressions:
            c, m = sub(a, b)
            if m and lo < -c/m < hi:
                cuts.add(-c/m)
    cuts = sorted(cuts)
    pieces = []
    for x, y in zip(cuts, cuts[1:]):
        t = (x+y)/2
        def choose(options, maximum):
            z = (max if maximum else min)(at(expr, t) for expr, _ in options)
            active = [(expr, closed) for expr, closed in options if at(expr, t) == z]
            return active[0][0], all(closed for _, closed in active)
        al, alc = choose([(A['lower'], A['lower_closed']), (zero, False)], True)
        dl, dlc = choose([(D['lower'], D['lower_closed']), (zero, False)], True)
        du, duc = choose([(D['upper'], D['upper_closed']), (night, False)], False)
        aa = band(al, A['upper'], alc, A['upper_closed'])
        dd = band(dl, du, dlc, duc)
        valid = Interval(lower=x, upper=y)
        _constrain(valid, sub(aa['lower'], aa['upper']), aa['lower_closed'] and aa['upper_closed'])
        _constrain(valid, sub(dd['lower'], dd['upper']), dd['lower_closed'] and dd['upper_closed'])
        _constrain(valid, mul(night, -1), False)
        if valid.status == 'feasible':
            assert valid.lower == x and valid.upper == y
            pieces.append({'lo': x, 'hi': y, 'A': aa, 'D': dd, 'N': night})
    return pieces, cuts


def fixed_factor_locations(piece, k):
    """All t in this open physical piece permitting the given k and some q."""
    k = rational(k)
    if k <= 0:
        raise ValueError('positive factor required')
    A, D = piece['A'], piece['D']
    valid = Interval(lower=piece['lo'], upper=piece['hi'])
    _constrain(valid, sub(A['lower'], mul(D['upper'], k)), A['lower_closed'] and D['upper_closed'])
    _constrain(valid, sub(mul(D['lower'], k), A['upper']), D['lower_closed'] and A['upper_closed'])
    return valid


def _limit_ratio(num, den, x):
    n, d = at(num, x), at(den, x)
    if d:
        return n/d
    if n:
        return None  # positive infinity, approached from the physical interior
    if den[1]:
        return num[1]/den[1]
    return None  # identically zero lower denominator => unbounded upper ratio


def projected_factors(piece):
    """Exact union image in k of a connected open piece with free t,A,D.

    The physical set is convex and A/D continuous, hence its image is an
    interval. Each extremal ratio is linear-fractional and monotone/constant.
    Temporal endpoint extrema are not attained within this open piece.
    """
    A, D = piece['A'], piece['D']
    def extreme(num, den, closed, lower):
        if den == (F(0), F(0)):
            return None, False
        constant = num[1]*den[0] == num[0]*den[1]
        if constant:
            return at(num, (piece['lo']+piece['hi'])/2)/at(den, (piece['lo']+piece['hi'])/2), closed
        values = [_limit_ratio(num, den, x) for x in (piece['lo'], piece['hi'])]
        finite = [x for x in values if x is not None]
        return (min(finite) if lower else (None if None in values else max(finite))), False
    lower, lc = extreme(A['lower'], D['upper'], A['lower_closed'] and D['upper_closed'], True)
    upper, uc = extreme(A['upper'], D['lower'], A['upper_closed'] and D['lower_closed'], False)
    assert lower is not None and lower >= 0
    return Interval(lower=lower, upper=upper, lower_closed=lc, upper_closed=uc)
