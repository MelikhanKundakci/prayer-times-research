import unittest
from fractions import Fraction as F
from itertools import product
from affine_constraints import Interval, anchored_slope
from moving_anchor import moving_anchor_set, normalize, intersect_sets


class MovingAnchorTests(unittest.TestCase):
    def test_union_preserves_open_hole_and_singleton_fills_it(self):
        a, b = Interval(lower=F(0),upper=F(1)), Interval(lower=F(1),upper=F(2))
        self.assertEqual(len(normalize([a,b])),2)
        filled=normalize([a,b,Interval(lower=F(1),upper=F(1),lower_closed=True,upper_closed=True)])
        self.assertEqual(len(filled),1)
        self.assertTrue(filled[0].contains(1))
        self.assertFalse(filled[0].contains(0))

    def test_exact_observation_point_and_half_open_rounding(self):
        values=[(0,0,'a'),(1,0,'b'),(2,0,'c')]
        lower=moving_anchor_set(values,[(0,F(-1,2)),(2,F(-1,2))])
        upper=moving_anchor_set(values,[(0,F(1,2)),(2,F(1,2))])
        self.assertTrue(any(i.contains(1) for i in lower))
        self.assertEqual(upper,[])

    def test_infeasible_source_remains_empty(self):
        self.assertEqual(moving_anchor_set([(0,0,'a'),(1,1,'b'),(2,0,'c')],[(-1,0),(3,0)]),[])

    def test_singular_observation_creates_a_real_hole(self):
        result=moving_anchor_set([(0,0,'a')],[(-1,1),(1,1)])
        self.assertEqual(len(result),2)
        for t,expected in ((F(-1),True),(F(-1,1000),True),(F(0),False),(F(1,1000),True),(F(1),True)):
            self.assertEqual(any(i.contains(t) for i in result),expected)

    def test_exact_grid_against_fixed_point_slope_oracle(self):
        checked=0
        for clocks in product((0,1),repeat=3):
            values=[(i,u,str(i)) for i,u in enumerate(clocks)]
            for heights in product((F(-1,2),F(0),F(1,2)),repeat=3):
                anchors=list(zip((F(-1),F(1),F(3)),heights))
                result=moving_anchor_set(values,anchors)
                for j in range(-4,13):
                    t=F(j,4);a,b=(anchors[:2] if t<=1 else anchors[1:])
                    h=a[1]+(b[1]-a[1])*(t-a[0])/(b[0]-a[0])
                    self.assertEqual(any(i.contains(t) for i in result),anchored_slope(values,t,h).status=='feasible',(clocks,heights,t))
                    checked+=1
        self.assertEqual(checked,3672)

    def test_intersection_retains_excluded_endpoints(self):
        left=[Interval(lower=F(0),upper=F(1),lower_closed=True)]
        right=[Interval(lower=F(1),upper=F(2),lower_closed=True)]
        self.assertEqual(intersect_sets(left,right),[])

    def test_input_contract(self):
        for anchors in ([],[(0,0)],[(0,0),(0,1)],[(1,0),(0,1)]):
            with self.assertRaises(ValueError):moving_anchor_set([(0,0,'a')],anchors)


if __name__=='__main__':unittest.main()
