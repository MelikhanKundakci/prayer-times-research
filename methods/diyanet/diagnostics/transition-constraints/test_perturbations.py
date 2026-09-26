from fractions import Fraction as F
import unittest
from affine_constraints import Interval, intersection
from joint_space import band
from perturbations import project_second, projected_correction, nearest_zero


class PerturbationTests(unittest.TestCase):
    def test_exact_elimination_and_open_boundary(self):
        # x>=0, x+y<1 imply y<1, with no lower bound on y.
        result=project_second([(-1,0,0,True,'x lower'),(1,1,1,False,'sum upper')])
        self.assertEqual((result.lower,result.upper,result.upper_closed),(None,F(1),False))

    def test_no_constraint_on_eliminated_direction(self):
        result=project_second([(1,1,1,False,'upper x'),(0,-1,0,True,'positive y')])
        self.assertEqual((result.lower,result.upper,result.lower_closed),(0,None,True))
        self.assertNotEqual(project_second([(0,0,0,False,'strict impossible')]).status,'feasible')

    def test_touching_strict_constraints_stay_empty(self):
        constraints=[(-1,0,0,True,'x>=0'),(1,0,0,False,'x<0')]
        self.assertEqual(project_second(constraints).status,'tie-only-conflict')

    def test_exhaustive_point_oracle(self):
        checked=0
        for a in (-2,-1,0,1,2):
            for b in (-2,-1,0,1,2):
                for closed in (False,True):
                    rows=[(-1,0,1,True,'x>=-1'),(1,0,2,False,'x<2'),(a,b,F(1,3),closed,'probe')]
                    projected=project_second(rows)
                    for j in range(-12,13):
                        y=F(j,4);actual=Interval()
                        for aa,bb,rhs,cc,label in rows:actual.add_leq(aa,rhs-bb*y,cc,label)
                        self.assertEqual(projected.contains(y),actual.status=='feasible')
                        checked+=1
        self.assertEqual(checked,1250)

    def test_coupled_horizons_and_physical_night(self):
        f=band((0,0),(0,0),True,True);i=band((4,0),(4,0),True,True)
        # R=3, S=1, k=1 => c=0; D=3, N=10 is physical.
        c=projected_correction(f,i,(3,0),(1,0),(10,0),1,1,1,0,1)
        self.assertEqual((c.lower,c.upper,c.lower_closed,c.upper_closed),(0,0,True,True))
        # Same algebraic match but D>N: retain physical infeasibility.
        bad=projected_correction(f,i,(3,0),(1,0),(2,0),1,1,1,0,1)
        self.assertNotEqual(bad.status,'feasible')
        relaxed=projected_correction(f,i,(3,0),(1,0),(2,0),1,1,1,0,1,physical=False)
        self.assertTrue(relaxed.contains(0))

    def test_horizon_span_scaling_at_nonunit_factor(self):
        f=band((0,0),(0,0),True,True);i=band((4,0),(4,0),True,True)
        # Bf+2Bi=8; R+2S=5 => c=1 or h=3.
        c=projected_correction(f,i,(5,0),(0,0),(20,0),2,1,1,0,1)
        h=projected_correction(f,i,(5,0),(0,0),(20,0),2,-1,1,0,1)
        self.assertTrue(c.contains(1));self.assertTrue(h.contains(3))
        self.assertEqual((c.lower,c.upper,h.lower,h.upper),(1,1,3,3))

    def test_point_domains_and_piece_boundary(self):
        f=band((0,1),(0,1),True,True);i=band((4,0),(4,0),True,True)
        open_piece=projected_correction(f,i,(3,0),(1,0),(20,0),1,1,1,0,1)
        self.assertEqual((open_piece.lower,open_piece.upper,open_piece.lower_closed,open_piece.upper_closed),(0,F(1,2),False,False))
        knot=projected_correction(f,i,(3,0),(1,0),(20,0),1,1,1,0,0,closed=True)
        self.assertTrue(knot.contains(0))

    def test_infimum_is_not_an_attained_minimum(self):
        p=nearest_zero([Interval(lower=F(0),upper=F(1))])
        self.assertEqual((p['absoluteInfimum'],p['attained']),(0,False))
        p=nearest_zero([Interval(lower=F(-2),upper=F(-1),upper_closed=True),Interval(lower=F(1),upper=F(2))])
        self.assertEqual((p['absoluteInfimum'],p['attained'],p['signedBoundary']),(1,True,-1))
        self.assertEqual(nearest_zero([])['status'],'empty')


if __name__=='__main__':unittest.main()
