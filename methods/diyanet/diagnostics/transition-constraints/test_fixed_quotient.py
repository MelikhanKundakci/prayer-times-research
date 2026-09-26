from fractions import Fraction as F
import unittest
from joint_space import band
from fixed_quotient import projected_fixed_quotient


class FixedQuotientTests(unittest.TestCase):
    def test_unshifted_formula_and_common_translation(self):
        f=band((1,0),(2,0),True,False);i=band((5,0),(6,0),True,False)
        # R=3,S=3,N=10,q=.2,k=1 => endpoints1 and5.
        v=projected_fixed_quotient(f,i,(3,0),(3,0),(10,0),F(1,5),1,1,1,0,1)
        self.assertEqual((v.lower,v.upper,v.lower_closed,v.upper_closed),(0,1,True,False))

    def test_halfspan_changes_both_night_terms(self):
        # h=1: R'=4,S'=1,N'=8,q=.25,k=2 =>Fajr0,Isha3.
        f=band((0,0),(0,0),True,True);i=band((3,0),(3,0),True,True)
        v=projected_fixed_quotient(f,i,(5,0),(0,0),(10,0),F(1,4),2,-1,1,0,1)
        self.assertEqual((v.lower,v.upper,v.lower_closed,v.upper_closed),(1,1,True,True))
        # q=.5,k=1 makes both coefficients vanish; an algebraic match
        # does not allow h>=5, where the perturbed night vanishes/reverses.
        z=band((0,0),(0,0),True,True)
        v=projected_fixed_quotient(z,z,(5,0),(-5,0),(10,0),F(1,2),1,-1,1,0,1)
        self.assertEqual((v.lower,v.upper,v.upper_closed),(None,5,False))

    def test_exact_open_time_and_invalid_quotient(self):
        f=band((1,1),(1,1),True,True);i=band((5,1),(5,1),True,True)
        v=projected_fixed_quotient(f,i,(3,0),(3,0),(10,0),F(1,5),1,1,1,0,1)
        self.assertEqual((v.lower,v.upper,v.lower_closed,v.upper_closed),(0,1,False,False))
        with self.assertRaises(ValueError):projected_fixed_quotient(f,i,(3,0),(3,0),(10,0),1,1,1,1,0,1)


if __name__=='__main__':unittest.main()
