from fractions import Fraction as F
import itertools
import unittest
from affine_constraints import (Interval, affine_slope, affine_value, anchored_slope,
                                intersection, rational, transform, witness)


class AffineConstraintsTests(unittest.TestCase):
    def test_half_open_single_cell_and_anchor_ties(self):
        values = [(1, 2, 'a')]
        slope = anchored_slope(values, 0, 0)
        self.assertEqual((slope.lower, slope.upper), (F(3, 2), F(5, 2)))
        self.assertTrue(slope.contains(F(3, 2)))
        self.assertFalse(slope.contains(F(5, 2)))
        self.assertEqual(anchored_slope(values, 1, F(3, 2)).status, 'feasible')
        self.assertEqual(anchored_slope(values, 1, F(5, 2)).status, 'tie-only-conflict')

    def test_inner_and_outer_anchor_reverse_endpoint_inclusion(self):
        values = [(1, 2, 'a'), (2, 4, 'b')]
        inner, outer = anchored_slope(values, 0, 0), anchored_slope(values, 3, 6)
        self.assertEqual((inner.lower, inner.upper), (F(7, 4), F(9, 4)))
        self.assertEqual((outer.lower, outer.upper), (F(7, 4), F(9, 4)))
        self.assertEqual((inner.lower_closed, inner.upper_closed), (True, False))
        self.assertEqual((outer.lower_closed, outer.upper_closed), (False, True))

    def test_free_affine_positive_and_tie_conflicts(self):
        tie = [(0, 0, 'a'), (1, 0, 'b'), (2, 2, 'c')]
        positive = [(0, 0, 'a'), (1, 0, 'b'), (2, 3, 'c')]
        self.assertEqual(affine_slope(tie).status, 'tie-only-conflict')
        self.assertEqual(affine_slope(positive).status, 'positive-conflict')
        for pivot in (F(-1, 2), 0, F(1, 2), 1, 3):
            self.assertNotEqual(affine_value(tie, pivot).status, 'feasible')
            self.assertNotEqual(affine_value(positive, pivot).status, 'feasible')

    def test_projected_endpoint_interior_and_extrapolation(self):
        values = [(1, 1, 'a'), (2, 2, 'b')]
        left = affine_value(values, 0)
        mid = affine_value(values, F(3, 2))
        at = affine_value(values, 1)
        self.assertEqual((left.lower, left.upper, left.lower_closed, left.upper_closed),
                         (F(-3, 2), F(3, 2), False, False))
        self.assertEqual((mid.lower, mid.upper, mid.lower_closed, mid.upper_closed),
                         (F(1), F(2), True, False))
        self.assertEqual((at.lower, at.upper, at.lower_closed, at.upper_closed),
                         (F(1, 2), F(3, 2), True, False))

    def test_binary_float_conversion_and_fractional_anchor(self):
        self.assertNotEqual(rational(0.1), F(1, 10))
        self.assertEqual(rational(0.1), F.from_float(0.1))
        values = [(1, 1, 'a'), (2, 2, 'b'), (3, 3, 'c')]
        slope = anchored_slope(values, F(7, 2), F(7, 2))
        self.assertTrue(slope.contains(1))
        self.assertTrue(affine_value(values, F(7, 2)).contains(F(7, 2)))

    def test_global_clock_shift_covariance(self):
        values = [(1, 2, 'a'), (2, 3, 'b'), (3, 4, 'c')]
        shift = F(7, 13)
        shifted = [(x, u + shift, label) for x, u, label in values]
        self.assertEqual(affine_slope(values).as_dict(), affine_slope(shifted).as_dict())
        for pivot in (0, F(3, 2), 4):
            original, changed = affine_value(values, pivot), affine_value(shifted, pivot)
            self.assertEqual(changed.lower, original.lower + shift)
            self.assertEqual(changed.upper, original.upper + shift)
            self.assertEqual(anchored_slope(values, pivot, 2).as_dict(),
                             anchored_slope(shifted, pivot, 2 + shift).as_dict())

    def test_interval_transform_and_closed_singleton(self):
        interval = Interval().add_leq(-1, 0).add_leq(1, 1, False)
        mapped = transform(interval, -2, 5)
        self.assertEqual((mapped.lower, mapped.upper, mapped.lower_closed, mapped.upper_closed),
                         (F(3), F(5), False, True))
        point = intersection([Interval().add_leq(-1, -1), Interval().add_leq(1, 1)])
        self.assertEqual(point.status, 'feasible')
        self.assertTrue(point.contains(1))
        self.assertFalse(point.contains(0))

    def test_compound_positive_conflict_takes_precedence_over_tie(self):
        tie_first = Interval().add_leq(0, 0, False).add_leq(-1, -1).add_leq(1, 0)
        tie_last = Interval().add_leq(-1, -1).add_leq(1, 0).add_leq(0, 0, False)
        constant_positive = Interval().add_leq(0, 0, False).add_leq(0, -1)
        for interval in (tie_first, tie_last, constant_positive):
            self.assertEqual(interval.status, 'positive-conflict')
            self.assertFalse(interval.contains(0))
        self.assertEqual(Interval().add_leq(0, 0, False).status, 'tie-only-conflict')

    def test_projection_equals_anchored_feasibility_on_exact_grid(self):
        # This compares different eliminations, including accepted/rejected ties.
        for targets in itertools.product(range(-1, 2), repeat=3):
            values = [(x, u, str(x)) for x, u in enumerate(targets)]
            for pivot in (F(-1, 2), 0, F(1, 2), 1, F(5, 2)):
                projected = affine_value(values, pivot)
                for y in (F(n, 2) for n in range(-5, 6)):
                    self.assertEqual(projected.contains(y), anchored_slope(values, pivot, y).status == 'feasible',
                                     (values, pivot, y))
                if projected.status == 'feasible':
                    self.assertEqual(anchored_slope(values, pivot, witness(projected)).status, 'feasible')


if __name__ == '__main__':
    unittest.main()
