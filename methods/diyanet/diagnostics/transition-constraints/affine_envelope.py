"""Exact projected envelopes for half-open rounded affine observations.

This module is source-free: it operates only on supplied (x, u, label) cells.
It uses the public exact-rational interval type, but computes a bounded closure
polygon in (intercept, slope) and handles strict upper facets explicitly.
"""
from __future__ import annotations
from dataclasses import dataclass
from fractions import Fraction as F
from itertools import combinations
from affine_constraints import Interval, cells, rational


@dataclass(frozen=True)
class _Vertex:
    intercept: F
    slope: F

    def value(self, t: F) -> F:
        return self.intercept + self.slope * t


@dataclass(frozen=True)
class _Constraint:
    a: F
    m: F
    rhs: F
    closed: bool
    witness: object

    def value(self, v: _Vertex) -> F:
        return self.a * v.intercept + self.m * v.slope


@dataclass(frozen=True)
class _Line:
    intercept: F
    slope: F
    vertex: _Vertex

    def value(self, t: F) -> F:
        return self.intercept + self.slope * t


def _constraints(source):
    result = []
    for x, u, label in source:
        low, high = u - F(1, 2), u + F(1, 2)
        # low <= a + m*x is closed; a + m*x < high is open.
        result.append(_Constraint(F(-1), -x, -low, True, [label, 'lower-cell']))
        result.append(_Constraint(F(1), x, high, False, [label, 'upper-cell']))
    return result


def _closure_vertices(constraints):
    points = set()
    for p, q in combinations(constraints, 2):
        det = p.a * q.m - q.a * p.m
        if det == 0:
            continue
        intercept = (p.rhs * q.m - q.rhs * p.m) / det
        slope = (p.a * q.rhs - q.a * p.rhs) / det
        vertex = _Vertex(intercept, slope)
        if all(c.value(vertex) <= c.rhs for c in constraints):
            points.add(vertex)
    return sorted(points, key=lambda v: (v.intercept, v.slope))


def _strictly_feasible_face(face, strict_constraints):
    """Whether the closure face contains a point satisfying every open facet.

    For each strict constraint, at least one face vertex must have slack.
    The average of the face vertices then has slack for all of them at once.
    This also handles a segment/point face, rather than checking vertices as
    if they alone were the feasible maximizers.
    """
    return all(any(c.value(v) < c.rhs for v in face) for c in strict_constraints)


def _face_witness(face):
    n = F(len(face))
    return _Vertex(sum((v.intercept for v in face), F(0)) / n,
                   sum((v.slope for v in face), F(0)) / n)


def _line_hull(vertices, lower):
    """Upper hull of lines, negating values for a lower envelope."""
    grouped = {}
    for v in vertices:
        sign = F(-1) if lower else F(1)
        c, m = sign * v.intercept, sign * v.slope
        grouped.setdefault((c, m), []).append(v)
    # For equal transformed slope, only the greatest intercept can be active.
    by_slope = {}
    for (c, m), vs in grouped.items():
        if m not in by_slope or c > by_slope[m][0]:
            by_slope[m] = (c, vs)
        elif c == by_slope[m][0]:
            by_slope[m][1].extend(vs)
    lines = [_Line(c, m, sorted(vs, key=lambda v: (v.intercept, v.slope))[0])
             for m, (c, vs) in sorted(by_slope.items())]
    hull, starts = [], []
    for line in lines:
        start = None
        while hull:
            prev = hull[-1]
            start = (prev.intercept - line.intercept) / (line.slope - prev.slope)
            if len(hull) == 1 or start > starts[-1]:
                break
            hull.pop(); starts.pop()
        if not hull:
            start = None  # -infinity
        hull.append(line); starts.append(start)
    return hull, starts


def _active_line(hull, starts, t):
    idx = 0
    for i in range(1, len(hull)):
        if starts[i] is not None and starts[i] <= t:
            idx = i
        else:
            break
    return hull[idx]


def _extreme(vertices, strict_constraints, t, lower):
    vals = [v.value(t) for v in vertices]
    bound = min(vals) if lower else max(vals)
    face = [v for v, value in zip(vertices, vals) if value == bound]
    attained = _strictly_feasible_face(face, strict_constraints)
    witness = _face_witness(face) if attained else None
    return bound, attained, witness


def _encoded_witness(v):
    if v is None:
        return None
    return {'intercept': v.intercept, 'slope': v.slope}


def affine_envelope(values, lower, upper):
    """Project the feasible affine-line set onto B(t)=a+m*t for t in [lower,upper].

    Input cells are ``(x, u, label)`` and impose the exact half-open condition
    ``u-1/2 <= a+m*x < u+1/2``. At least two strictly increasing, distinct x
    values are required so the closure polygon is bounded. Bounds may be any
    finite rational-compatible numbers with lower <= upper.

    Returns a dictionary with:
      * ``status``: feasible, tie-only-conflict, or positive-conflict;
      * ``knots``: exact rational partition boundaries, including in-domain
        observation abscissae and all lower/upper envelope crossovers;
      * ``pieces``: open intervals between consecutive knots, with affine
        ``(intercept, slope)`` coefficient tuples and booleans indicating
        whether each projected bound is attained inside that open interval;
      * ``points``: each knot with a public ``Interval`` for B(t), preserving
        whether its lower and upper endpoints are attained.

    Empty global source sets return no knots, pieces, or points while retaining
    the public interval status (notably tie-only-conflict).
    """
    source = cells(values)
    lo, hi = rational(lower), rational(upper)
    if lo > hi:
        raise ValueError('lower domain bound must not exceed upper bound')
    if len(source) < 2:
        raise ValueError('at least two rounded observations are required')
    if source[0][0] == source[-1][0]:
        raise ValueError('distinct observation abscissae required')

    constraints = _constraints(source)
    strict = [c for c in constraints if not c.closed]
    vertices = _closure_vertices(constraints)
    if not vertices:
        status = 'positive-conflict'
        return {'status': status, 'domain': (lo, hi), 'knots': [], 'pieces': [], 'points': [],
                'contradictions': [['empty-closure-polygon']]}
    if not _strictly_feasible_face(vertices, strict):
        # The closed relaxation exists, but all its points violate at least one
        # excluded upper-cell boundary. Keep the tie-only classification.
        witnesses = [c.witness for c in strict if all(c.value(v) == c.rhs for v in vertices)]
        return {'status': 'tie-only-conflict', 'domain': (lo, hi), 'knots': [], 'pieces': [], 'points': [],
                'contradictions': [['strict-upper-facets-exclude-closure', witnesses]]}

    lower_hull, lower_starts = _line_hull(vertices, lower=True)
    upper_hull, upper_starts = _line_hull(vertices, lower=False)
    candidate_knots = {lo, hi}
    candidate_knots.update(x for x, _, _ in source if lo <= x <= hi)
    for starts in (lower_starts, upper_starts):
        candidate_knots.update(x for x in starts if x is not None and lo < x < hi)
    knots = sorted(candidate_knots)

    pieces = []
    for a, b in zip(knots, knots[1:]):
        if a == b:
            continue
        mid = (a + b) / 2
        low_line = _active_line(lower_hull, lower_starts, mid)
        high_line = _active_line(upper_hull, upper_starts, mid)
        low_value, low_closed, _ = _extreme(vertices, strict, mid, True)
        high_value, high_closed, _ = _extreme(vertices, strict, mid, False)
        assert low_line.value(mid) == low_value or -low_line.value(mid) == low_value
        assert high_line.value(mid) == high_value or -high_line.value(mid) == high_value
        lower_coeff = (-low_line.intercept, -low_line.slope)
        upper_coeff = (high_line.intercept, high_line.slope)
        pieces.append({'lo': a, 'hi': b, 'lower': lower_coeff, 'upper': upper_coeff,
                       'lower_closed': low_closed, 'upper_closed': high_closed})

    points = []
    for t in knots:
        low, low_closed, low_witness = _extreme(vertices, strict, t, True)
        high, high_closed, high_witness = _extreme(vertices, strict, t, False)
        projected = Interval(lower=low, upper=high, lower_closed=low_closed,
                             upper_closed=high_closed,
                             lower_witness=_encoded_witness(low_witness),
                             upper_witness=_encoded_witness(high_witness))
        assert projected.status == 'feasible', (t, projected.as_dict())
        points.append({'x': t, 'interval': projected})
    return {'status': 'feasible', 'domain': (lo, hi), 'knots': knots,
            'pieces': pieces, 'points': points, 'contradictions': []}
