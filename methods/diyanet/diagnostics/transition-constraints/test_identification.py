import unittest
from fractions import Fraction as F
from itertools import product
from affine_constraints import Interval, affine_value, intersection, transform
from identification import positive_ratio, affine_runs


def box(lo, hi, closed=False):
    return Interval(lower=F(lo), upper=F(hi), lower_closed=closed, upper_closed=closed)


class RatioTests(unittest.TestCase):
    def test_open_and_closed_extrema(self):
        for closed in (False, True):
            ratio = positive_ratio(box(9, 10, closed), box(10, 11, closed))
            self.assertEqual((ratio.lower, ratio.upper), (F(9, 11), F(1)))
            self.assertEqual(ratio.contains(F(9, 11)), closed)
            self.assertEqual(ratio.contains(1), closed)
            self.assertTrue(ratio.contains(F(19, 20)))

    def test_empty_inputs_stay_empty(self):
        for empty in (box(2, 1), box(1, 1)):
            for first in (True, False):
                args = (empty, box(1, 2)) if first else (box(1, 2), empty)
                self.assertEqual(positive_ratio(*args).status, empty.status)
        self.assertEqual(positive_ratio(box(2, 1), box(1, 1)).status, 'positive-conflict')

    def test_closed_singleton(self):
        v = positive_ratio(box(9, 9, True), box(8, 8, True))
        self.assertTrue(v.contains(F(9, 8)))
        self.assertFalse(v.contains(F(9, 8) + F(1, 10000)))

    def test_domain_and_no_mutation(self):
        for invalid in (box(0, 1), box(-1, 1), Interval(lower=F(1))):
            with self.assertRaises(ValueError):
                positive_ratio(invalid, box(1, 2))
            with self.assertRaises(ValueError):
                positive_ratio(box(1, 2), invalid)
        a, b = box(1, 2), box(3, 4)
        before = (a.as_dict(), b.as_dict())
        positive_ratio(a, b)
        self.assertEqual(before, (a.as_dict(), b.as_dict()))

    def test_independent_intersection_membership(self):
        checks = 0
        for ac, dc in product((False, True), repeat=2):
            a, d = box(9, 10, ac), box(10, 11, dc)
            ratio = positive_ratio(a, d)
            points = [F(n, 100) for n in range(75, 111)] + [F(9, 11)]
            for k in points:
                direct = intersection([a, transform(d, k)]).status == 'feasible'
                self.assertEqual(ratio.contains(k), direct)
                checks += 1
        self.assertEqual(checks, 148)


class RunTests(unittest.TestCase):
    def test_single_line_and_short_input(self):
        values = [(i, 20-i, str(i)) for i in range(12)]
        runs = affine_runs(values)
        self.assertEqual([(r['startIndex'], r['endIndex']) for r in runs], [(0, 11)])
        self.assertEqual(affine_runs(values[:6]), [])

    def test_tie_is_not_a_compatible_run(self):
        values = [(i, u, str(i)) for i, u in enumerate((0, 1, 0))]
        self.assertEqual(affine_runs(values, 3), [])

    def test_overlapping_alternatives_survive(self):
        values = [(i, u, str(i)) for i, u in enumerate((0, 0, 0, 1, 1, 0, 0))]
        runs = affine_runs(values, 3)
        self.assertGreater(len(runs), 1)
        self.assertTrue(any(a['startIndex'] < b['startIndex'] <= a['endIndex'] < b['endIndex']
                            for a in runs for b in runs))

    def test_input_contract(self):
        for values in ([], [(0, 0, 'a'), (0, 1, 'b')], [(1, 0, 'a'), (0, 1, 'b')]):
            with self.assertRaises(ValueError):
                affine_runs(values)
        for minimum in (True, 1, 3.5):
            with self.assertRaises(ValueError):
                affine_runs([(0, 0, 'a')], minimum)

    def test_exhaustive_independent_projection_oracle(self):
        # Projection eliminates slope at pivot 0; it does not use this scanner's
        # incremental pair-bound algorithm or right-maximal filtering.
        for clocks in product((-1, 0, 1), repeat=5):
            values = [(i, u, i) for i, u in enumerate(clocks)]
            feasible = set()
            for start in range(3):
                for end in range(start+2, 5):
                    if affine_value(values[start:end+1], 0).status == 'feasible':
                        feasible.add((start, end))
            expected = {pair for pair in feasible if not any(
                a <= pair[0] and b >= pair[1] and (a, b) != pair for a, b in feasible)}
            actual = {(r['startIndex'], r['endIndex']) for r in affine_runs(values, 3)}
            self.assertEqual(actual, expected, clocks)


if __name__ == '__main__':
    unittest.main()
