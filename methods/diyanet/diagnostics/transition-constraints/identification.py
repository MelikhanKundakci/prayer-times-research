"""Source-free identification tools, not prayer-time calculation policies."""
from affine_constraints import Interval, cells, rational


def positive_ratio(numerator, denominator):
    """Exact image A/D for bounded positive intervals separated from zero.

    Empty inputs remain empty. Nonempty inputs require finite positive lower
    bounds; zero-touching/unbounded intervals are deliberately unsupported.
    The returned bounds preserve strictness, including closed singletons.
    """
    statuses = [v.status for v in (numerator, denominator)]
    if any(s != 'feasible' for s in statuses):
        rhs = -1 if 'positive-conflict' in statuses else 0
        return Interval().add_leq(0, rhs, False, ['empty-ratio-input', statuses])
    for v in (numerator, denominator):
        if v.lower is None or v.upper is None or v.lower <= 0:
            raise ValueError('bounded intervals with strictly positive lower bounds required')
    lo = rational(numerator.lower) / rational(denominator.upper)
    hi = rational(numerator.upper) / rational(denominator.lower)
    return Interval(lower=lo, upper=hi,
                    lower_closed=numerator.lower_closed and denominator.upper_closed,
                    upper_closed=numerator.upper_closed and denominator.lower_closed,
                    lower_witness=[numerator.lower_witness, denominator.upper_witness],
                    upper_witness=[numerator.upper_witness, denominator.lower_witness])


def affine_runs(values, minimum_length=7):
    """All inclusion-maximal contiguous affine-compatible observation runs.

    Values are increasing (x, minute, label) triples. Each minute constrains
    a line to [minute-1/2, minute+1/2). Caller must split unresolved/missing
    observations into separate calls; this function never infers their dates.
    Maximality means no strict containing compatible run, not a unique change
    point or the longest/preferred interval. Overlapping alternatives remain.
    """
    if isinstance(minimum_length, bool) or not isinstance(minimum_length, int) or minimum_length < 2:
        raise ValueError('minimum_length must be an integer of at least two')
    series = cells(values)
    candidates = []
    for start in range(len(series)):
        slope = Interval()
        last = None
        for end in range(start + 1, len(series)):
            xj, uj, lj = series[end]
            for k in range(start, end):
                xk, uk, lk = series[k]
                slope.add_leq(-(xj-xk), -(uj-uk-1), False, [lk, lj])
                slope.add_leq(xj-xk, uj-uk+1, False, [lk, lj])
            if slope.status != 'feasible':
                break
            if end - start + 1 >= minimum_length:
                last = {'startIndex': start, 'endIndex': end,
                        'startLabel': series[start][2], 'endLabel': lj,
                        'length': end-start+1, 'slope': slope.as_dict()}
        if last is not None:
            candidates.append(last)
    # Right-maximal candidates are ordered by starting index. A candidate
    # contained in an earlier one cannot be inclusion-maximal.
    result, furthest = [], -1
    for candidate in candidates:
        if candidate['endIndex'] > furthest:
            result.append(candidate)
            furthest = candidate['endIndex']
    return result
