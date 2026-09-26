"""Independent annual northern guard oracle. Synthetic model inputs only.

Imports the sibling Python physical oracle, never JavaScript or calendar data.
Run to regenerate northern-fixtures.json using the system ZoneInfo database.
"""
from pathlib import Path
import datetime as dt
import importlib.util
import json
import math

HERE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location('independent_solar_oracle', HERE / 'oracle.py')
PHYSICAL = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(PHYSICAL)
MINUTE = 60.0
MARGIN = 7 * MINUTE
FIVE_HOURS = 300 * MINUTE

CASES = [
    {'id': 'bordeaux-2027', 'year': 2027, 'latitude': 44.84, 'longitude': -.58, 'timeZone': 'Europe/Paris'},
    {'id': 'frankfurt-2027', 'year': 2027, 'latitude': 50.11, 'longitude': 8.68, 'timeZone': 'Europe/Berlin'},
    {'id': 'frankfurt-2028', 'year': 2028, 'latitude': 50.11, 'longitude': 8.68, 'timeZone': 'Europe/Berlin'},
    {'id': 'berlin-2027', 'year': 2027, 'latitude': 52.52, 'longitude': 13.405, 'timeZone': 'Europe/Berlin'},
    {'id': 'edinburgh-2027', 'year': 2027, 'latitude': 55.95, 'longitude': -3.19, 'timeZone': 'Europe/London'},
    {'id': 'oslo-2027', 'year': 2027, 'latitude': 59.91, 'longitude': 10.75, 'timeZone': 'Europe/Oslo'},
    {'id': 'east-antimeridian-2027', 'year': 2027, 'latitude': 50, 'longitude': 180, 'timeZone': 'Asia/Anadyr'},
    {'id': 'west-antimeridian-2027', 'year': 2027, 'latitude': 50, 'longitude': -180, 'timeZone': 'Asia/Anadyr'},
    {'id': 'synthetic-new-york-zone-2027', 'year': 2027, 'latitude': 50, 'longitude': -74, 'timeZone': 'America/New_York'},
]

def date_range(first, last):
    while first <= last:
        yield first.isoformat()
        first += dt.timedelta(days=1)

def ms(value):
    return None if value is None else value * 1000

def real_night(maghrib, sunrise, fajr):
    ordinary = sunrise - maghrib
    religious = None if fajr is None else fajr - maghrib
    return ordinary, religious

def ordinary_eligibility(raw_fajr, raw_isha, next_raw_fajr, transit,
                         morning_upper, evening_estimate, global_fajr, global_isha):
    fajr = raw_fajr is not None and (raw_fajr - transit) / MINUTE > global_fajr and raw_fajr > morning_upper + 20 * MINUTE
    isha = raw_isha is not None and next_raw_fajr is not None and (raw_isha - transit) / MINUTE < global_isha and raw_isha < evening_estimate - 20 * MINUTE and raw_isha < next_raw_fajr
    return fajr, isha

def annual(case):
    year = case['year']
    dates = list(date_range(dt.date(year - 1, 12, 31), dt.date(year + 1, 1, 1)))
    days = []
    horizon_failures = []
    for date in dates:
        physical = PHYSICAL.calculate({'date': date, 'latitude': case['latitude'], 'longitude': case['longitude'], 'timeZone': case['timeZone'], 'ishaAngleDegrees': 16})
        if physical['status'] != 'calculated':
            days.append({'date': date, 'unavailable': physical['status']})
            horizon_failures.append({'date': date, 'kind': 'transit-ownership'})
            continue
        events = physical['events']
        day = {'date': date, 'transit': physical['transitEpochSeconds'],
               'rise': events['sunrise']['epochSeconds'], 'set': events['maghrib']['epochSeconds'],
               'fajr': events['fajr']['epochSeconds'], 'isha': events['isha']['epochSeconds'],
               'fajrRootCount': events['fajr']['rootCount']}
        days.append(day)
        if day['rise'] is None or day['set'] is None:
            horizon_failures.append({'date': date, 'kind': 'absent-horizon'})
            continue
        raw_day = day['set'] - day['rise']
        selected_day = raw_day + 2 * MARGIN
        if not raw_day > FIVE_HOURS or not selected_day > FIVE_HOURS:
            horizon_failures.append({'date': date, 'kind': 'short-day', 'rawSeconds': raw_day, 'selectedSeconds': selected_day})
    nights = []
    for previous, current in zip(days, days[1:]):
        if 'unavailable' in previous or 'unavailable' in current or previous.get('set') is None or current.get('rise') is None:
            horizon_failures.append({'date': current['date'], 'kind': 'absent-adjacent-horizon'})
            continue
        m, r = previous['set'] + MARGIN, current['rise'] - MARGIN
        raw_night = current['rise'] - previous['set']
        h, n = real_night(m, r, current['fajr'])
        if not raw_night > FIVE_HOURS or not h > FIVE_HOURS:
            horizon_failures.append({'date': current['date'], 'kind': 'short-adjacent-night', 'rawSeconds': raw_night, 'selectedSeconds': h})
        nights.append({'endingDate': current['date'], 'eveningOwnerDate': previous['date'],
                       'eveningTransit': previous['transit'], 'morningTransit': current['transit'],
                       'maghrib': m, 'sunrise': r, 'fajr': current['fajr'], 'H': h, 'N': n})
    owned_dates = [x for x in dates if x.startswith(str(year) + '-')]
    common = {'days': len(owned_dates), 'paddedDays': len(days), 'adjacentNights': len(dates) - 1}
    if horizon_failures:
        return {**common, 'status': 'blocked', 'reasonClass': 'annual-horizon-dependency',
                'horizonFailureCount': len(horizon_failures), 'firstHorizonFailure': horizon_failures[0],
                'fajrEligibleBits': '0' * len(owned_dates), 'ishaEligibleBits': '0' * len(owned_dates),
                'thresholds': None, 'frozenRatio': None, 'samples': []}
    if len(nights) != len(days) - 1: raise AssertionError('Incomplete night table')
    if any(d['fajrRootCount'] > 1 for d in days): raise AssertionError('Ambiguous physical Fajr')
    missing = [i for i, night in enumerate(nights) if night['fajr'] is None]
    if missing and (missing != list(range(missing[0], missing[-1] + 1)) or missing[0] == 0 or missing[-1] == len(nights) - 1):
        raise AssertionError('Oracle case has multiple or unbounded missing-Fajr intervals')
    for night in nights:
        if night['N'] is not None and not 0 < night['N'] < night['H']:
            raise AssertionError('Real Fajr does not lie inside its selected horizon night')
    ratio = None
    if missing:
        anchor = nights[missing[0] - 1]
        ratio = anchor['N'] / (3 * anchor['H'])
        if not 0 < ratio < 1 / 3: raise AssertionError('Invalid last-real-night ratio')
    for night in nights:
        third = night['N'] / 3 if night['N'] is not None else ratio * night['H']
        night['third'] = third
        night['ishaEstimate'] = night['maghrib'] + third
        night['fajrUpper'] = night['sunrise'] - third
        night['ishaPhase'] = (night['ishaEstimate'] - night['eveningTransit']) / MINUTE
        night['fajrUpperPhase'] = (night['fajrUpper'] - night['morningTransit']) / MINUTE
    low = min(nights, key=lambda n: n['ishaPhase'])
    high = max(nights, key=lambda n: n['fajrUpperPhase'])
    isha_threshold, fajr_threshold = low['ishaPhase'] - 20, high['fajrUpperPhase'] + 20
    day_by_date = {d['date']: d for d in days}
    morning_by_date = {n['endingDate']: n for n in nights}
    evening_by_date = {n['eveningOwnerDate']: n for n in nights}
    fajr_bits, isha_bits = '', ''
    for date in owned_dates:
        d, morning, evening = day_by_date[date], morning_by_date[date], evening_by_date[date]
        f, i = ordinary_eligibility(d['fajr'], d['isha'], evening['fajr'], d['transit'],
                                   morning['fajrUpper'], evening['ishaEstimate'], fajr_threshold, isha_threshold)
        fajr_bits += str(int(f)); isha_bits += str(int(i))
    sample_dates = {f'{year}-01-01', f'{year}-03-28', f'{year}-06-21', f'{year}-09-23', f'{year}-12-31', f'{year+1}-01-01', low['endingDate'], high['endingDate']}
    if missing: sample_dates.add(nights[missing[0] - 1]['endingDate'])
    samples = []
    for n in nights:
        if n['endingDate'] not in sample_dates: continue
        samples.append({'endingDate': n['endingDate'], 'eveningOwnerDate': n['eveningOwnerDate'],
                        'selectedMaghribEpochMilliseconds': ms(n['maghrib']), 'selectedSunriseEpochMilliseconds': ms(n['sunrise']),
                        'rawFajrEpochMilliseconds': ms(n['fajr']), 'eveningTransitEpochMilliseconds': ms(n['eveningTransit']),
                        'morningTransitEpochMilliseconds': ms(n['morningTransit']), 'ordinaryNightSeconds': n['H'],
                        'religiousNightSeconds': n['N'], 'thirdSeconds': n['third'],
                        'ishaEstimateEpochMilliseconds': ms(n['ishaEstimate']), 'fajrUpperEpochMilliseconds': ms(n['fajrUpper']),
                        'ishaPhaseMinutes': n['ishaPhase'], 'fajrUpperPhaseMinutes': n['fajrUpperPhase']})
    return {**common, 'status': 'ready', 'reasonClass': None, 'horizonFailureCount': 0,
            'fajrEligibleBits': fajr_bits, 'ishaEligibleBits': isha_bits,
            'thresholds': {'ishaMinutesFromTransit': isha_threshold, 'fajrMinutesFromTransit': fajr_threshold},
            'frozenRatio': ratio, 'missingFajrNights': len(missing),
            'missingWindow': None if not missing else {'firstEndingDate': nights[missing[0]]['endingDate'], 'lastEndingDate': nights[missing[-1]]['endingDate'], 'ratioAnchorEndingDate': nights[missing[0]-1]['endingDate']},
            'samples': samples}

def arithmetic_checks():
    checks = []
    m, r, f = 0, 14 * 3600, 12 * 3600
    h, n = real_night(m, r, f)
    assert h == 14 * 3600 and n / 3 == 4 * 3600
    raw_third_boundary = m + n / 3
    selected_third_boundary = MARGIN + (f - MARGIN) / 3
    assert selected_third_boundary - raw_third_boundary == 280
    checks.append('selected-Maghrib versus raw sunset shifts third boundary by 280 seconds')
    # Artificial UTC operands crossing DST; no timetable values are used.
    for start, end, boundary in [('2026-03-28T17:00:00+00:00', '2026-03-29T03:00:00+00:00', '2026-03-28T20:20:00+00:00'), ('2026-10-24T16:00:00+00:00', '2026-10-25T05:00:00+00:00', '2026-10-24T20:20:00+00:00')]:
        a, b, target = (dt.datetime.fromisoformat(x).timestamp() for x in [start, end, boundary])
        assert a + (b - a) / 3 == target
    checks.append('elapsed UTC thirds across both DST directions')
    for duration, expected in [(FIVE_HOURS - .001, False), (FIVE_HOURS, False), (FIVE_HOURS + .001, True)]:
        assert (duration > FIVE_HOURS) == expected
    checks.append('five-hour boundary is strict at millisecond sides')
    # Isolate the two event guards with exact synthetic clock arithmetic.
    for delta, expected in [(-.001, False), (0, False), (.001, True)]:
        eligible, _ = ordinary_eligibility(1200 + delta, None, None, 0, 0, 0, 20, 0)
        assert eligible == expected
        _, eligible = ordinary_eligibility(None, -1200 - delta, 1, 0, 0, 0, 0, -20)
        assert eligible == expected
    assert ordinary_eligibility(None, -1201, -1202, 0, 0, 0, 0, -20)[1] is False
    checks.append('strict ordinary thresholds and next-real-Fajr chronology')
    return checks

if __name__ == '__main__':
    checks = arithmetic_checks()
    results = []
    for case in CASES:
        result = annual(case)
        results.append({'input': case, 'expected': result})
        print(json.dumps({'case': case['id'], 'status': result['status'], 'fajrOrdinaryDays': result['fajrEligibleBits'].count('1'), 'ishaOrdinaryDays': result['ishaEligibleBits'].count('1')}), flush=True)
    fixture = {'schema': 'independent-local-northern-oracle/v1', 'caseCount': len(results),
               'contract': 'Conservative ordinary-only annual guard, transit-relative elapsed UTC frames, all padded consecutive nights included in both envelopes',
               'sourceCalendarData': False, 'arithmeticChecks': checks, 'cases': results}
    (HERE / 'northern-fixtures.json').write_text(json.dumps(fixture, indent=2) + '\n')
