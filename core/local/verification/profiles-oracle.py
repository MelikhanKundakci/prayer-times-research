"""Independent parameterized point-profile expectations; no JavaScript imports.

This reuses only the existing independent Python physical functions. It does
not alter the old oracle or fixtures. Run with Python 3.9+ and system ZoneInfo.
The generated values test declared equations and conventions, not calendars.
"""
from __future__ import annotations
import datetime as dt
import hashlib
import importlib.util
import json
import math
from pathlib import Path
from zoneinfo import ZoneInfo

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('independent_physical_oracle', HERE / 'oracle.py')
physical = importlib.util.module_from_spec(spec)
spec.loader.exec_module(physical)
EVENTS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']
PROFILES = {
    'egypt-published-angles-point-v1': {'fajrAngleDegrees': 19.5, 'ishaAngleDegrees': 17.5, 'asrShadowFactor': 1, 'horizonDepressionDegrees': 50 / 60},
    'fcna-usa-2017-point-v1': {'fajrAngleDegrees': 15, 'ishaAngleDegrees': 15, 'asrShadowFactor': 1, 'horizonDepressionDegrees': 50 / 60},
    'fcna-canada-2017-point-v1': {'fajrAngleDegrees': 13, 'ishaAngleDegrees': 13, 'asrShadowFactor': 1, 'horizonDepressionDegrees': 50 / 60},
    'kemenag-worked-example-point-v1': {'fajrAngleDegrees': 20, 'ishaAngleDegrees': 18, 'asrShadowFactor': 1, 'horizonDepressionDegrees': 1},
}


def calculate(case, step=600):
    """Independent event assembly with parameterized altitude/shadow targets."""
    date = dt.date.fromisoformat(case['date'])
    midnight = dt.datetime.combine(date, dt.time(), physical.UTC).timestamp()
    lat, lon = case['latitude'], case['longitude']
    zone = ZoneInfo(case['timeZone'])
    phases = [physical.meridian(midnight - 2 * physical.DAY, lon), physical.meridian(midnight + 3 * physical.DAY, lon)]
    candidates = []
    for k in range(math.floor(phases[0] / 360), math.ceil(phases[1] / 360) + 1):
        t = physical.phase_root(k * 360, lon)
        if dt.datetime.fromtimestamp(t, zone).date() == date:
            candidates.append((k, t))
    if len(candidates) != 1:
        return {'status': 'ownership-unavailable', 'transitCount': len(candidates), 'transits': [t for _, t in candidates]}
    k, transit = candidates[0]
    start, end = physical.phase_root(k * 360 - 180, lon), physical.phase_root(k * 360 + 180, lon)
    dec = physical.coordinates(transit)[0]
    noon_height = 90 - abs(lat - math.degrees(dec))
    factor = case.get('asrShadowFactor', 1)
    # Cot(h_Asr) = factor + cot(h_transit), fixed at the upper transit.
    asr_target = math.degrees(math.atan2(math.sin(math.radians(noon_height)), math.cos(math.radians(noon_height)) + factor * math.sin(math.radians(noon_height)))) if noon_height > 0 else None
    horizon = case.get('horizonDepressionDegrees', 50 / 60)
    angles = {'fajr': (-case.get('fajrAngleDegrees', 18), 'rising'), 'sunrise': (-horizon, 'rising'), 'maghrib': (-horizon, 'setting'), 'isha': (-case.get('ishaAngleDegrees', 17), 'setting'), 'asr': (asr_target, 'setting')}
    events = {'dhuhr': {'epochSeconds': transit, 'thresholdDegrees': None, 'rootDirection': None, 'rootCount': 1}}
    for event, (angle, direction) in angles.items():
        if angle is None:
            events[event] = {'epochSeconds': None, 'thresholdDegrees': None, 'rootDirection': direction, 'rootCount': 0, 'reason': 'no-positive-transit-height'}
            continue
        fn = lambda t: physical.sine_altitude(t, lat, lon) - math.sin(math.radians(angle))
        scan_start, scan_end = (start, transit) if direction == 'rising' else (transit, end)
        scan = physical.crossings(fn, scan_start, scan_end, step)
        roots = [r for r in scan['roots'] if r['direction'] == direction]
        events[event] = {'epochSeconds': roots[0]['epochSeconds'] if len(roots) == 1 else None, 'thresholdDegrees': angle, 'rootDirection': direction, 'rootCount': len(roots), 'minimumSineResidual': scan['minimum'], 'maximumSineResidual': scan['maximum']}
    return {'status': 'calculated', 'transitCount': 1, 'transitEpochSeconds': transit, 'startEpochSeconds': start, 'endEpochSeconds': end, 'transitHeightDegrees': noon_height, 'events': events}


def select_minute(event, raw_ms, kemenag=False):
    if not kemenag:
        return {'selectedEpochMilliseconds': raw_ms, 'roundedEpochMilliseconds': math.floor(raw_ms / 60000 + .5) * 60000}
    selected = ((math.floor(raw_ms / 60000) - 2) if event == 'sunrise' else
                (math.ceil(raw_ms / 60000) + (3 if event == 'dhuhr' else 2))) * 60000
    return {'selectedEpochMilliseconds': selected, 'roundedEpochMilliseconds': selected}


def selected_events(oracle, profile):
    if oracle['status'] != 'calculated':
        return None
    kemenag = profile == 'kemenag-worked-example-point-v1'
    selected = {}
    prior = None
    for event in EVENTS:
        raw = oracle['events'][event]['epochSeconds']
        if raw is None:
            selected[event] = {'status': 'unavailable', 'selectedEpochMilliseconds': None, 'roundedEpochMilliseconds': None}
            continue
        value = select_minute(event, raw * 1000, kemenag)
        if prior is not None and value['selectedEpochMilliseconds'] <= prior:
            selected[event] = {'status': 'policy-blocked', 'selectedEpochMilliseconds': None, 'roundedEpochMilliseconds': None}
        else:
            selected[event] = {'status': 'calculated', **value}
            prior = value['selectedEpochMilliseconds']
    return selected


def grid():
    dates = ['2027-03-20', '2027-06-21', '2027-09-23', '2027-12-21', '2028-02-29']
    points = [
        ('cairo', 30.0444, 31.2357, 'Africa/Cairo'),
        ('new-york', 40.7128, -74.006, 'America/New_York'),
        ('edmonton', 53.5461, -113.4938, 'America/Edmonton'),
        ('jakarta', -6.2, 106.8, 'Asia/Jakarta'),
        ('sydney', -33.8688, 151.2093, 'Australia/Sydney'),
        ('oslo', 59.91, 10.75, 'Europe/Oslo'),
        ('tromso', 69.65, 18.96, 'Europe/Oslo'),
        ('equator', 0, 0, 'UTC'),
        ('mcmurdo', -77.85, 166.67, 'Antarctica/McMurdo'),
        ('east-antimeridian', 0, 180, 'Pacific/Kiritimati'),
        ('west-antimeridian', 0, -180, 'Pacific/Kiritimati'),
        ('tonga', -21.13, -175.22, 'Pacific/Tongatapu'),
    ]
    boundary = [
        ('cairo-dst-start-before', 30.0444, 31.2357, 'Africa/Cairo', '2027-04-29'),
        ('cairo-dst-start', 30.0444, 31.2357, 'Africa/Cairo', '2027-04-30'),
        ('cairo-dst-end-before', 30.0444, 31.2357, 'Africa/Cairo', '2027-10-28'),
        ('cairo-dst-end', 30.0444, 31.2357, 'Africa/Cairo', '2027-10-29'),
        ('ny-dst-start', 40.7128, -74.006, 'America/New_York', '2027-03-14'),
        ('ny-dst-end', 40.7128, -74.006, 'America/New_York', '2027-11-07'),
        ('toronto-dst-start', 43.6532, -79.3832, 'America/Toronto', '2027-03-14'),
        ('toronto-dst-end', 43.6532, -79.3832, 'America/Toronto', '2027-11-07'),
        ('year-end', 30.0444, 31.2357, 'Africa/Cairo', '2027-12-31'),
        ('year-start', 30.0444, 31.2357, 'Africa/Cairo', '2028-01-01'),
        ('apia-skipped', -13.8333, -171.75, 'Pacific/Apia', '2011-12-30'),
        ('ny-zero-transit', 0, 115, 'America/New_York', '2026-03-08'),
        ('ny-two-transits', 0, 115, 'America/New_York', '2026-11-01'),
    ]
    cases = []
    for profile in list(PROFILES)[:3]:
        for name, lat, lon, zone in points:
            for date in dates:
                cases.append({'id': f'{profile}:{name}:{date}', 'date': date, 'latitude': lat, 'longitude': lon, 'timeZone': zone, 'profile': profile})
        for name, lat, lon, zone, date in boundary:
            cases.append({'id': f'{profile}:{name}', 'date': date, 'latitude': lat, 'longitude': lon, 'timeZone': zone, 'profile': profile})
    indonesia = [
        ('jakarta', -6.2, 106.8, 'Asia/Jakarta'),
        ('pontianak', -.0263, 109.3425, 'Asia/Pontianak'),
        ('makassar', -5.1477, 119.4327, 'Asia/Makassar'),
        ('jayapura', -2.5337, 140.7181, 'Asia/Jayapura'),
        ('southwest-box-corner', -12, 94, 'Asia/Jakarta'),
        ('northwest-box-corner', 8, 94, 'Asia/Jakarta'),
        ('southeast-box-corner', -12, 142, 'Asia/Jayapura'),
        ('northeast-box-corner', 8, 142, 'Asia/Jayapura'),
    ]
    for name, lat, lon, zone in indonesia:
        for date in dates:
            cases.append({'id': f'kemenag:{name}:{date}', 'date': date, 'latitude': lat, 'longitude': lon, 'timeZone': zone, 'profile': 'kemenag-worked-example-point-v1'})
    # Geometry-only cases explicitly keep factor two outside institution profiles.
    for name, lat, lon, zone in [points[i] for i in [0, 2, 4, 6, 8]]:
        for date in dates:
            cases.append({'id': f'factor-two:{name}:{date}', 'date': date, 'latitude': lat, 'longitude': lon, 'timeZone': zone, 'asrShadowFactor': 2, 'fajrAngleDegrees': 18, 'ishaAngleDegrees': 17, 'horizonDepressionDegrees': 50 / 60})
    return cases


def generate():
    # Exact replay compares every numeric field, including coarse-scan extrema.
    baseline_cases = physical.grid()
    for case in baseline_cases:
        if calculate(case) != physical.calculate(case):
            raise AssertionError(f'Default parameterization changed {case["id"]}')
    rows = []
    for case in grid():
        parameters = {k: v for k, v in case.items() if k not in ['id', 'profile']}
        if 'profile' in case:
            parameters.update(PROFILES[case['profile']])
        oracle = calculate(parameters)
        rows.append({'input': case, 'geometryParameters': parameters, 'oracle': oracle,
                     'selected': selected_events(oracle, case['profile']) if 'profile' in case else None})
    arithmetic = []
    # Exact boundaries, either side, signed instants, and nearest-half boundaries.
    for raw in [-120000.001, -120000, -119999.999, -60000.001, -60000, -59999.999,
                -.001, 0, .001, 29999.999, 30000, 30000.001, 59999.999, 60000,
                60000.001, 89999.999, 90000, 90000.001, 1810000000000]:
        for event in EVENTS:
            for kemenag in [False, True]:
                arithmetic.append({'event': event, 'rawEpochMilliseconds': raw, 'kemenag': kemenag, **select_minute(event, raw, kemenag)})
    return {'schema': 'independent-local-profiles-oracle/v1', 'model': 'Shared published USNO approximate equations, independently assembled and solved in Python; not observed or institutional accuracy',
            'profiles': PROFILES, 'baselineParity': {'cases': len(baseline_cases), 'allNumericFieldsIdentical': True,
            'originalOracleSha256': hashlib.sha256((HERE / 'oracle.py').read_bytes()).hexdigest(),
            'originalFixtureSha256': hashlib.sha256((HERE / 'oracle-fixtures.json').read_bytes()).hexdigest()},
            'caseCount': len(rows), 'rows': rows, 'minuteArithmetic': arithmetic}


if __name__ == '__main__':
    fixture = generate()
    (HERE / 'profiles-fixtures.json').write_text(json.dumps(fixture, indent=2, allow_nan=False) + '\n')
    print(json.dumps({'caseCount': fixture['caseCount'], 'baselineCases': fixture['baselineParity']['cases'],
                      'ownershipErrors': sum(r['oracle']['status'] != 'calculated' for r in fixture['rows']),
                      'minuteArithmeticCases': len(fixture['minuteArithmetic'])}))
