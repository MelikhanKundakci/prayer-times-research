"""Exact nearest-minute feasibility after eliminating one constant time shift.

This module accepts caller-supplied records only; it does not load calendars,
locations, reference sources, or prayer-time policy. Float raw epochs are
converted to their exact IEEE-754 rational values by affine_constraints.rational.
"""
from __future__ import annotations

from fractions import Fraction
from typing import Any

from affine_constraints import Interval, encoded, rational

HALF_MINUTE_MS = 30_000
REQUIRED_FIELDS = {'id', 'rawEpochMilliseconds', 'referenceEpochMilliseconds'}


def _validate_records(records, *, allow_incomplete: bool):
    if isinstance(records, (str, bytes)):
        raise TypeError('records must be a nonempty iterable of record dictionaries')
    try:
        values = list(records)
    except TypeError as exc:
        raise TypeError('records must be a nonempty iterable of record dictionaries') from exc
    if not values:
        raise ValueError('at least one record is required')
    normalized = []
    seen = set()
    unresolved = []
    for index, item in enumerate(values):
        if not isinstance(item, dict) or not REQUIRED_FIELDS.issubset(item):
            raise TypeError(f'record {index} must contain {sorted(REQUIRED_FIELDS)}')
        record_id = item['id']
        if not isinstance(record_id, str) or not record_id.strip():
            raise TypeError(f'record {index} id must be a nonempty string')
        if record_id in seen:
            raise ValueError(f'duplicate record id: {record_id}')
        seen.add(record_id)
        raw = item['rawEpochMilliseconds']
        reference = item['referenceEpochMilliseconds']
        raw_value = None
        reference_value = None
        if raw is not None:
            try:
                raw_value = rational(raw)
            except (TypeError, ValueError) as exc:
                raise type(exc)(f'invalid rawEpochMilliseconds for {record_id}: {exc}') from exc
        if reference is not None:
            if isinstance(reference, bool) or not isinstance(reference, int):
                raise TypeError(f'referenceEpochMilliseconds for {record_id} must be an integer')
            if reference % 60_000:
                raise ValueError(f'referenceEpochMilliseconds for {record_id} must be minute-aligned')
            reference_value = Fraction(reference)
        if raw_value is None or reference_value is None:
            if not allow_incomplete:
                raise ValueError(f'record {record_id} is unresolved; use allow_incomplete=True for insufficient status')
            unresolved.append(record_id)
        normalized.append((record_id, raw_value, reference_value))
    return normalized, unresolved


def _exact_interval(rows, bound: Fraction | None):
    interval = Interval()
    residual_min = residual_max = None
    for record_id, raw, reference in rows:
        residual = reference - raw
        residual_min = residual if residual_min is None else min(residual_min, residual)
        residual_max = residual if residual_max is None else max(residual_max, residual)
        lo, hi = residual - HALF_MINUTE_MS, residual + HALF_MINUTE_MS
        interval.add_leq(-1, -lo, closed=True, witness=record_id)
        interval.add_leq(1, hi, closed=False, witness=record_id)
    if bound is not None:
        interval.add_leq(-1, bound, closed=True, witness='offset-bound:lower')
        interval.add_leq(1, bound, closed=True, witness='offset-bound:upper')
    width = None if interval.lower is None or interval.upper is None else interval.upper - interval.lower
    span = None if residual_min is None else residual_max - residual_min
    result = {
        'status': interval.status,
        'lowerMilliseconds': encoded(interval.lower),
        'upperMilliseconds': encoded(interval.upper),
        'lowerClosed': interval.lower_closed,
        'upperClosed': interval.upper_closed,
        'signedWidthMilliseconds': encoded(width),
        'residualSpanMilliseconds': encoded(span),
        'lowerWitness': interval.lower_witness,
        'upperWitness': interval.upper_witness,
        'offsetSelected': False,
    }
    # Keep an internal exact object only for synthetic/API callers that need
    # direct membership queries; it is not part of serialized result fields.
    return result, interval


def analyze_noon_shift(records, *, bound_milliseconds: Any = 60_000,
                       allow_incomplete: bool = False) -> dict:
    """Find the exact common-shift interval for complete nearest-minute cells.

    Each reference must be a UTC epoch millisecond integer on a minute boundary.
    Each raw value may be an int, finite float, or Fraction, but not bool. With
    the default bound, also return the intersection with closed ±60,000 ms.
    Missing values are rejected unless explicitly allowed; if any are allowed,
    the return status is ``insufficient-data`` and no partial feasibility result
    is exposed.
    """
    if not isinstance(allow_incomplete, bool):
        raise TypeError('allow_incomplete must be a boolean')
    if bound_milliseconds is None:
        bound = None
    else:
        try:
            bound = rational(bound_milliseconds)
        except (TypeError, ValueError) as exc:
            raise type(exc)(f'invalid bound_milliseconds: {exc}') from exc
        if bound < 0:
            raise ValueError('bound_milliseconds must be nonnegative')
    normalized, unresolved = _validate_records(records, allow_incomplete=allow_incomplete)
    if unresolved:
        return {
            'status': 'insufficient-data',
            'planned': len(normalized),
            'resolved': len(normalized) - len(unresolved),
            'unresolvedIds': unresolved,
            'unbounded': None,
            'bounded': None if bound is None else {'boundMilliseconds': encoded(bound), 'status': 'insufficient-data'},
            'offsetSelected': False,
        }
    rows = [(record_id, raw, reference) for record_id, raw, reference in normalized]
    unbounded, _ = _exact_interval(rows, None)
    bounded_result = None
    if bound is not None:
        bounded_result, _ = _exact_interval(rows, bound)
        bounded_result['boundMilliseconds'] = encoded(bound)
    return {
        'status': 'complete',
        'planned': len(rows),
        'resolved': len(rows),
        'unbounded': unbounded,
        'bounded': bounded_result,
        'offsetSelected': False,
    }


def exact_interval_object(records):
    """Testing/helper surface: return Interval for already-validated complete rows."""
    normalized, unresolved = _validate_records(records, allow_incomplete=False)
    assert not unresolved
    _, interval = _exact_interval([(record_id, raw, reference)
                                   for record_id, raw, reference in normalized], None)
    return interval
