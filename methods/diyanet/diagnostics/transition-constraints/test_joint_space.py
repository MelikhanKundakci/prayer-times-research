from fractions import Fraction as F
import unittest
from affine_constraints import Interval
from joint_space import (at, band, factor_interval, fixed_factor_locations,
                         intersect_sets, normalize, projected_factors,
                         quotient_interval, split_physical, value_band)


def singleton(v):
    return Interval(lower=F(v), upper=F(v), lower_closed=True, upper_closed=True)


class JointSpaceTests(unittest.TestCase):
    def test_quotient_is_coupled_to_both_events(self):
        a = Interval(lower=F(2), upper=F(3), lower_closed=True)
        d = Interval(lower=F(4), upper=F(5), lower_closed=True)
        self.assertNotEqual(quotient_interval(a, d, 10, 1).status, 'feasible')
        q = quotient_interval(a, d, 10, F(1, 2))
        self.assertEqual((q.lower, q.upper, q.lower_closed, q.upper_closed), (F(2, 5), F(1, 2), True, False))

    def test_q_one_and_zero_are_excluded(self):
        for d in (singleton(0), singleton(10)):
            self.assertNotEqual(factor_interval(singleton(2), d, 10).status, 'feasible')
        self.assertNotEqual(factor_interval(singleton(0), singleton(2), 10).status, 'feasible')

    def test_factor_half_open_endpoint(self):
        a = Interval(lower=F(2), upper=F(4), lower_closed=True)
        d = singleton(2)
        k = factor_interval(a, d, 10)
        self.assertTrue(k.contains(1))
        self.assertFalse(k.contains(2))

    def test_strict_touch_remains_infeasible(self):
        p = {'lo':F(0), 'hi':F(1), 'A':band((2,0),(2,0),True,True),
             'D':band((1,0),(2,0),True,False)}
        self.assertNotEqual(fixed_factor_locations(p, 1).status, 'feasible')

    def test_moving_ratio_and_isolated_endpoints(self):
        pieces, cuts = split_physical(0,1,band((1,1),(1,1),True,True),band((1,0),(1,0),True,True),(10,0))
        self.assertEqual(cuts,[0,1])
        p=projected_factors(pieces[0])
        self.assertEqual((p.lower,p.upper,p.lower_closed,p.upper_closed),(1,2,False,False))
        joined=normalize([p,singleton(1),singleton(2)])
        self.assertEqual(len(joined),1)
        self.assertTrue(joined[0].contains(1) and joined[0].contains(2))

    def test_flat_extremum_attained_inside_open_time(self):
        p={'lo':F(0),'hi':F(1),'A':band((2,2),(4,4),True,False),
           'D':band((1,1),(1,1),True,True)}
        k=projected_factors(p)
        self.assertEqual((k.lower,k.upper,k.lower_closed,k.upper_closed),(2,4,True,False))

    def test_zero_denominator_limits(self):
        p={'lo':F(0),'hi':F(1),'A':band((0,2),(0,3),True,True),
           'D':band((0,1),(0,1),True,True)}
        k=projected_factors(p)
        self.assertEqual((k.lower,k.upper,k.lower_closed,k.upper_closed),(2,3,True,True))
        p['A']=band((1,0),(2,0),True,True)
        k=projected_factors(p)
        self.assertEqual((k.lower,k.upper,k.lower_closed),(1,None,False))

    def test_physical_clipping_and_point_oracle(self):
        a=band((-1,2),(1,2),True,False)
        d=band((-1,1),(2,1),True,False)
        n=(2,0)
        pieces,cuts=split_physical(0,2,a,d,n)
        self.assertIn(F(1,2),cuts)
        for p in pieces:
            for j in range(1,8):
                t=p['lo']+(p['hi']-p['lo'])*F(j,8)
                direct=factor_interval(value_band(a,t),value_band(d,t),at(n,t))
                for k in (F(1,4),F(1),F(9,8),F(2),F(10)):
                    self.assertEqual(fixed_factor_locations(p,k).contains(t),direct.contains(k))
                    if direct.contains(k):
                        self.assertTrue(projected_factors(p).contains(k))

    def test_union_does_not_fill_excluded_point_or_disconnected_gap(self):
        parts=normalize([Interval(lower=F(0),upper=F(1)),Interval(lower=F(1),upper=F(2)),Interval(lower=F(3))])
        self.assertEqual(len(parts),3)
        self.assertFalse(any(i.contains(1) for i in parts))
        self.assertFalse(any(i.contains(F(5,2)) for i in parts))
        self.assertEqual(len(normalize(parts+[singleton(1)])),2)

    def test_common_factor_does_not_imply_common_time(self):
        left={'lo':F(0),'hi':F(1),'A':band((2,0),(2,0),True,True),'D':band((1,0),(1,0),True,True)}
        right=dict(left,lo=F(2),hi=F(3))
        self.assertTrue(intersect_sets([projected_factors(left)],[projected_factors(right)])[0].contains(2))
        self.assertEqual(intersect_sets([fixed_factor_locations(left,2)],[fixed_factor_locations(right,2)]),[])


if __name__=='__main__':
    unittest.main()
