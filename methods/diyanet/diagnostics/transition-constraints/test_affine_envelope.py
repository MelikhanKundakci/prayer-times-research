"""Synthetic checks against the existing exact point-projection oracle."""
from fractions import Fraction as F
from itertools import product
import unittest
from affine_constraints import Interval, affine_value
from affine_envelope import affine_envelope, _constraints, _closure_vertices, _strictly_feasible_face


def at(result, t):
    for point in result['points']:
        if point['x'] == t:
            return point['interval']
    for piece in result['pieces']:
        if piece['lo'] < t < piece['hi']:
            lo0, lm = piece['lower']; hi0, hm = piece['upper']
            return Interval(lower=lo0+lm*t, upper=hi0+hm*t,
                            lower_closed=piece['lower_closed'], upper_closed=piece['upper_closed'])
    raise AssertionError(f'no envelope piece contains {t}')


def sig(interval):
    return (interval.status, interval.lower, interval.upper,
            interval.lower_closed, interval.upper_closed)


class AffineEnvelopeTests(unittest.TestCase):
    def test_closed_lower_and_open_upper_extrema(self):
        result=affine_envelope([(0,0,'a'),(1,0,'b')],F(0),F(1))
        self.assertEqual(result['status'],'feasible')
        self.assertEqual(result['knots'],[F(0),F(1)])
        for t in (F(0),F(1,2),F(1)):
            actual=at(result,t); expected=affine_value([(0,0,'a'),(1,0,'b')],t)
            self.assertEqual(sig(actual),sig(expected))
        self.assertTrue(at(result,F(0)).lower_closed)
        self.assertFalse(at(result,F(0)).upper_closed)

    def test_global_tie_only_and_positive_conflicts_remain_distinct(self):
        tie=affine_envelope([(0,-2,'a'),(1,-2,'b'),(2,0,'c')],F(0),F(2))
        positive=affine_envelope([(0,0,'a'),(1,2,'b'),(2,0,'c')],F(0),F(2))
        self.assertEqual(tie['status'],'tie-only-conflict')
        self.assertEqual(positive['status'],'positive-conflict')
        for result in (tie,positive):
            self.assertEqual(result['knots'],[])
            self.assertEqual(result['pieces'],[])
            self.assertEqual(result['points'],[])

    def test_tied_extreme_face_can_be_attained_between_excluded_vertices(self):
        # At t=1 the lower envelope is supported by two closure vertices.
        # Each endpoint violates a different strict upper-cell constraint,
        # while an interior point on the optimizing face is feasible.
        values=[(0,-2,'a'),(1,-1,'b'),(2,-1,'c')]
        result=affine_envelope(values,F(0),F(2))
        point=next(p['interval'] for p in result['points'] if p['x']==F(1))
        self.assertEqual((point.lower,point.lower_closed),(F(-3,2),True))
        constraints=_constraints([(F(x),F(u),label) for x,u,label in values])
        strict=[c for c in constraints if not c.closed]
        vertices=_closure_vertices(constraints)
        face=[v for v in vertices if v.value(F(1))==F(-3,2)]
        self.assertEqual(len(face),2)
        self.assertTrue(_strictly_feasible_face(face,strict))
        self.assertFalse(any(all(c.value(v)<c.rhs for c in strict) for v in face))
        self.assertEqual(sig(point),sig(affine_value(values,F(1))))

    def test_observation_singularities_and_envelope_knots(self):
        values=[(0,0,'a'),(2,0,'b')]
        result=affine_envelope(values,F(-1),F(3))
        self.assertEqual(result['status'],'feasible')
        self.assertTrue({F(-1),F(0),F(2),F(3)}.issubset(set(result['knots'])))
        for t in result['knots']:
            self.assertEqual(sig(at(result,t)),sig(affine_value(values,t)),t)

    def test_fractional_grid_matches_point_oracle(self):
        checked=0
        for ys in product((-1,0,1),repeat=4):
            values=[(x,y,str(x)) for x,y in enumerate(ys)]
            result=affine_envelope(values,F(0),F(3))
            from affine_constraints import affine_slope
            self.assertEqual(result['status'],affine_slope(values).status,ys)
            if result['status']!='feasible':
                self.assertIn(result['status'],('tie-only-conflict','positive-conflict'))
                continue
            for num in range(0,13):
                t=F(num,4)
                self.assertEqual(sig(at(result,t)),sig(affine_value(values,t)),(ys,t))
                checked+=1
        self.assertGreater(checked,0)

    def test_contract(self):
        with self.assertRaises(ValueError): affine_envelope([(0,0,'a')],F(0),F(1))
        with self.assertRaises(ValueError): affine_envelope([(0,0,'a'),(1,1,'b')],F(1),F(0))


if __name__=='__main__': unittest.main()
