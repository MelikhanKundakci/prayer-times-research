import unittest
from fractions import Fraction

from noon_shift import analyze_noon_shift, exact_interval_object


def record(record_id, raw, target):
    return {'id': record_id, 'rawEpochMilliseconds': raw,
            'referenceEpochMilliseconds': target}


def fraction(value):
    return Fraction(int(value['numerator']), int(value['denominator']))


class NoonShiftTests(unittest.TestCase):
    def test_lower_tie_is_included_and_upper_tie_excluded(self):
        interval = exact_interval_object([record('edge', 0.0, 0)])
        self.assertTrue(interval.contains(Fraction(-30_000)))
        self.assertFalse(interval.contains(Fraction(30_000)))
        round_minute = lambda x: (x + 30_000) // 60_000
        self.assertEqual(round_minute(Fraction(-30_000)), 0)
        self.assertEqual(round_minute(Fraction(30_000)), 1)

    def test_closed_offset_bound_may_create_valid_singleton(self):
        result = analyze_noon_shift([record('point', -30_000.0, 60_000)])
        bounded = result['bounded']
        self.assertEqual(bounded['status'], 'feasible')
        self.assertEqual(fraction(bounded['lowerMilliseconds']), Fraction(60_000))
        self.assertEqual(fraction(bounded['upperMilliseconds']), Fraction(60_000))
        self.assertTrue(bounded['lowerClosed'] and bounded['upperClosed'])

    def test_missing_rows_never_produce_partial_feasibility(self):
        missing = [record('resolved', 0.0, 0), record('missing', None, 60_000)]
        with self.assertRaisesRegex(ValueError, 'unresolved'):
            analyze_noon_shift(missing)
        result = analyze_noon_shift(missing, allow_incomplete=True)
        self.assertEqual(result['status'], 'insufficient-data')
        self.assertIsNone(result['unbounded'])
        self.assertEqual(result['bounded']['status'], 'insufficient-data')
        self.assertEqual(result['resolved'], 1)
        missing_reference = analyze_noon_shift(
            [record('missing-reference', 0.0, None)], allow_incomplete=True)
        self.assertEqual(missing_reference['status'], 'insufficient-data')
        self.assertIsNone(missing_reference['unbounded'])

    def test_empty_input_rejected(self):
        with self.assertRaisesRegex(ValueError, 'at least one'):
            analyze_noon_shift([])

    def test_duplicate_ids_rejected(self):
        with self.assertRaisesRegex(ValueError, 'duplicate'):
            analyze_noon_shift([record('same', 0.0, 0), record('same', 1.0, 60_000)])

    def test_nonfinite_and_boolean_inputs_rejected(self):
        for raw in (float('nan'), float('inf'), float('-inf'), True):
            with self.subTest(raw=raw), self.assertRaises((TypeError, ValueError)):
                analyze_noon_shift([record('bad', raw, 0)])
        with self.assertRaises(TypeError):
            analyze_noon_shift([record('bad-reference', 0.0, True)])
        with self.assertRaises(ValueError):
            analyze_noon_shift([record('bad-minute', 0.0, 1)])
        for flag in ('false', 0, None):
            with self.subTest(allow_incomplete=flag), self.assertRaises(TypeError):
                analyze_noon_shift([record('bad-flag', 0.0, 0)], allow_incomplete=flag)

    def test_translation_shifts_interval_without_changing_shape(self):
        records = [record('a', 1000.125, 60_000), record('b', 12_345.5, 60_000)]
        moved = [record(r['id'], r['rawEpochMilliseconds'] + 123.25,
                        r['referenceEpochMilliseconds']) for r in records]
        before = analyze_noon_shift(records, bound_milliseconds=None)['unbounded']
        after = analyze_noon_shift(moved, bound_milliseconds=None)['unbounded']
        self.assertEqual(before['status'], after['status'])
        self.assertEqual(fraction(after['lowerMilliseconds']), fraction(before['lowerMilliseconds']) - Fraction(493, 4))
        self.assertEqual(fraction(after['upperMilliseconds']), fraction(before['upperMilliseconds']) - Fraction(493, 4))
        self.assertEqual(fraction(after['signedWidthMilliseconds']), fraction(before['signedWidthMilliseconds']))

    def test_two_witnesses_certify_minimal_touching_conflict(self):
        left = [record('left', 0.0, 0)]
        right = [record('right', 0.0, 60_000)]
        self.assertEqual(analyze_noon_shift(left)['unbounded']['status'], 'feasible')
        self.assertEqual(analyze_noon_shift(right)['unbounded']['status'], 'feasible')
        result = analyze_noon_shift(left + right)['unbounded']
        self.assertEqual(result['status'], 'tie-only-conflict')
        self.assertEqual(fraction(result['lowerMilliseconds']), Fraction(30_000))
        self.assertEqual(fraction(result['upperMilliseconds']), Fraction(30_000))
        self.assertEqual(result['lowerWitness'], 'right')
        self.assertEqual(result['upperWitness'], 'left')


if __name__ == '__main__':
    unittest.main()
