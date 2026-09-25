"""Exact source-free affine feasibility for half-open quantized observations.

Each (x, u) constrains a line to [u - 1/2, u + 1/2). Stored float
endpoints become their exact binary rational values, never rounded decimals.
No optimizer, epsilon, clock source, ephemeris, or prayer policy is used.
Public diagnostic V2 preserves positive-over-tie conflict precedence.
"""
from __future__ import annotations
from dataclasses import dataclass, field
from fractions import Fraction
import math


def rational(value):
    if isinstance(value, bool) or not isinstance(value, (int, float, Fraction)):
        raise TypeError('finite int, float, or Fraction required')
    if isinstance(value, float) and not math.isfinite(value):
        raise ValueError('finite value required')
    return Fraction(value)


def encoded(value):
    if value is None:
        return None
    return {'numerator': str(value.numerator), 'denominator': str(value.denominator),
            'approximate': float(value)}


@dataclass
class Interval:
    lower: Fraction | None = None
    upper: Fraction | None = None
    lower_closed: bool = False
    upper_closed: bool = False
    lower_witness: object = None
    upper_witness: object = None
    contradictions: list = field(default_factory=list)

    def add_leq(self, coefficient, rhs, closed=True, witness=None):
        """Intersect coefficient * value <= rhs, or < when closed=False."""
        coefficient, rhs = rational(coefficient), rational(rhs)
        if coefficient == 0:
            if rhs < 0 or (rhs == 0 and not closed):
                self.contradictions.append({'rhs': encoded(rhs), 'closed': closed,
                                            'witness': witness})
            return self
        bound = rhs / coefficient
        if coefficient > 0:
            if self.upper is None or bound < self.upper:
                self.upper, self.upper_closed, self.upper_witness = bound, closed, witness
            elif bound == self.upper and not closed:
                self.upper_closed, self.upper_witness = False, witness
        else:
            if self.lower is None or bound > self.lower:
                self.lower, self.lower_closed, self.lower_witness = bound, closed, witness
            elif bound == self.lower and not closed:
                self.lower_closed, self.lower_witness = False, witness
        return self

    @property
    def status(self):
        # A strict tie conflict and a positive contradiction can coexist.
        # Preserve the stronger positive classification regardless of order.
        constant_positive = any(Fraction(int(c['rhs']['numerator']), int(c['rhs']['denominator'])) < 0
                                for c in self.contradictions)
        bounds_positive = self.lower is not None and self.upper is not None and self.lower > self.upper
        if constant_positive or bounds_positive:
            return 'positive-conflict'
        if self.contradictions:
            return 'tie-only-conflict'
        if self.lower is None or self.upper is None or self.lower < self.upper:
            return 'feasible'
        return 'feasible' if self.lower_closed and self.upper_closed else 'tie-only-conflict'

    def contains(self, value):
        value = rational(value)
        return (self.status == 'feasible'
                and (self.lower is None or value > self.lower or value == self.lower and self.lower_closed)
                and (self.upper is None or value < self.upper or value == self.upper and self.upper_closed))

    def as_dict(self):
        return {'status': self.status, 'lower': encoded(self.lower), 'upper': encoded(self.upper),
                'lowerClosed': self.lower_closed, 'upperClosed': self.upper_closed,
                'lowerWitness': self.lower_witness, 'upperWitness': self.upper_witness,
                'contradictions': self.contradictions}


def cells(values):
    """Convert (x,u,label) triples, rejecting duplicates or unordered abscissae."""
    result = [(rational(x), rational(u), label) for x, u, label in values]
    if not result or any(a[0] >= b[0] for a, b in zip(result, result[1:])):
        raise ValueError('nonempty strictly increasing x values required')
    return result


def anchored_slope(values, anchor_x, anchor_y):
    """All slopes for y = anchor_y + slope*(x-anchor_x)."""
    anchor_x, anchor_y = rational(anchor_x), rational(anchor_y)
    result = Interval()
    for x, u, label in cells(values):
        z = x - anchor_x
        result.add_leq(-z, anchor_y - u + Fraction(1, 2), True, [label, 'lower-cell'])
        result.add_leq(z, u + Fraction(1, 2) - anchor_y, False, [label, 'upper-cell'])
    return result


def affine_slope(values):
    """Projection of all feasible free affine lines onto their slope."""
    converted = cells(values)
    result = Interval()
    for i, (x, u, label) in enumerate(converted):
        for xx, uu, other in converted[i + 1:]:
            distance = xx - x
            result.add_leq(-distance, -(uu - u - 1), False, [label, other, 'lower-pair'])
            result.add_leq(distance, uu - u + 1, False, [label, other, 'upper-pair'])
    return result


def affine_value(values, pivot_x):
    """Projection onto the line value at pivot_x, by exact elimination.

    Write line(x)=v+s*(x-pivot_x). Each nonzero displacement supplies one
    lower and upper bound on s, each affine in v. Every lower/upper pair
    must intersect; their comparison is strict if either bound is open.
    Eliminating s yields necessary and sufficient interval constraints on v.
    """
    pivot_x = rational(pivot_x)
    result, lowers, uppers = Interval(), [], []
    for x, u, label in cells(values):
        z, low, high = x - pivot_x, u - Fraction(1, 2), u + Fraction(1, 2)
        if z == 0:
            result.add_leq(-1, -low, True, [label, 'direct-lower'])
            result.add_leq(1, high, False, [label, 'direct-upper'])
        elif z > 0:
            lowers.append((low / z, -1 / z, True, [label, 'lower-cell']))
            uppers.append((high / z, -1 / z, False, [label, 'upper-cell']))
        else:
            lowers.append((high / z, -1 / z, False, [label, 'upper-cell']))
            uppers.append((low / z, -1 / z, True, [label, 'lower-cell']))
    for intercept_l, coefficient_l, closed_l, witness_l in lowers:
        for intercept_u, coefficient_u, closed_u, witness_u in uppers:
            result.add_leq(coefficient_l - coefficient_u, intercept_u - intercept_l,
                           closed_l and closed_u, [witness_l, witness_u])
    return result


def transform(interval, scale=1, offset=0):
    """Affine image of a feasible interval; empty input stays empty."""
    scale, offset = rational(scale), rational(offset)
    result = Interval()
    if interval.status != 'feasible':
        result.add_leq(0, -1 if interval.status == 'positive-conflict' else 0,
                       False, ['empty-input', interval.status])
        return result
    if scale == 0:
        result.add_leq(-1, -offset).add_leq(1, offset)
        return result
    if interval.lower is not None:
        value = scale * interval.lower + offset
        result.add_leq(-1 if scale > 0 else 1, -value if scale > 0 else value,
                       interval.lower_closed, interval.lower_witness)
    if interval.upper is not None:
        value = scale * interval.upper + offset
        result.add_leq(1 if scale > 0 else -1, value if scale > 0 else -value,
                       interval.upper_closed, interval.upper_witness)
    return result


def intersection(intervals):
    result = Interval()
    for index, interval in enumerate(intervals):
        if interval.status != 'feasible':
            result.add_leq(0, -1 if interval.status == 'positive-conflict' else 0,
                           False, ['empty-input', index, interval.status])
        if interval.lower is not None:
            result.add_leq(-1, -interval.lower, interval.lower_closed, [index, interval.lower_witness])
        if interval.upper is not None:
            result.add_leq(1, interval.upper, interval.upper_closed, [index, interval.upper_witness])
    return result


def witness(interval):
    """A rational interior/accepted point for verification, not a model fit."""
    if interval.status != 'feasible':
        raise ValueError('empty interval')
    if interval.lower is None and interval.upper is None:
        return Fraction(0)
    if interval.lower is None:
        return interval.upper - 1
    if interval.upper is None:
        return interval.lower + 1
    return (interval.lower + interval.upper) / 2
