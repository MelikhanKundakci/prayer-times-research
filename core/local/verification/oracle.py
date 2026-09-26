"""Independent Python solar-cycle oracle. No JavaScript or calendar-data imports.

Run this file to regenerate oracle-fixtures.json using Python system ZoneInfo.
The published fixture was generated with system tzdb 2026c.1.0; the verifier
uses the executing Node runtime timezone database. These are declared model
checks, not independently observed solar or institution-approved times.
"""
from __future__ import annotations
import datetime as dt
import json
import math
from zoneinfo import ZoneInfo
from pathlib import Path

DAY = 86400.0
RAD = math.pi / 180
UTC = dt.timezone.utc

def coordinates(t):
    days = t / DAY + 2440587.5 - 2451545.0
    anomaly = math.radians((357.529 + .98560028 * days) % 360)
    mean = (280.459 + .98564736 * days) % 360
    ecliptic = math.radians(mean + 1.915 * math.sin(anomaly) + .020 * math.sin(2 * anomaly))
    obliquity = math.radians(23.439 - .00000036 * days)
    ra = math.degrees(math.atan2(math.cos(obliquity) * math.sin(ecliptic), math.cos(ecliptic))) / 15 % 24
    declination = math.asin(math.sin(obliquity) * math.sin(ecliptic))
    eot_hours = (mean / 15 - ra + 12) % 24 - 12
    return declination, eot_hours

def meridian(t, longitude):
    # Absolute unwrapped degrees, so no midnight discontinuity or false root.
    return t / 240 + longitude + 15 * coordinates(t)[1] - 180

def sine_altitude(t, latitude, longitude):
    dec, eot = coordinates(t)
    hour_angle = math.radians((t % DAY) / 240 + longitude + 15 * eot - 180)
    lat = math.radians(latitude)
    return math.sin(lat) * math.sin(dec) + math.cos(lat) * math.cos(dec) * math.cos(hour_angle)

def bisect(fn, lo, hi, tolerance=.00005):
    fl = fn(lo)
    if fl == 0: return lo
    if fn(hi) == 0: return hi
    if fl * fn(hi) > 0: raise ValueError('Not bracketed')
    while hi - lo > tolerance:
        mid = (lo + hi) / 2
        fm = fn(mid)
        if fm == 0: return mid
        if (fm > 0) == (fl > 0): lo, fl = mid, fm
        else: hi = mid
    return (lo + hi) / 2

def phase_root(level, longitude):
    # EOT is much smaller than this two-hour bracket for the accepted years.
    center = 240 * (level - longitude + 180)
    return bisect(lambda t: meridian(t, longitude) - level, center - 3600, center + 3600)

def crossings(fn, start, end, step=600):
    n = math.ceil((end - start) / step)
    times = [start + (end - start) * i / n for i in range(n + 1)]
    derivative = lambda t: (fn(t + 1) - fn(t - 1)) / 2
    knots = list(times)
    # Search stationary points independently of level sign changes, catching
    # short intervals above/below a level inside one coarse sample interval.
    for left, right in zip(times, times[1:]):
        dl, dr = derivative(left), derivative(right)
        if dl == 0: knots.append(left)
        elif dl * dr < 0: knots.append(bisect(derivative, left, right))
    knots = sorted(set(knots))
    found = []
    for left, right in zip(knots, knots[1:]):
        a, b = fn(left), fn(right)
        if a * b < 0:
            t = bisect(fn, left, right)
            direction = 'rising' if a < b else 'setting'
            if start <= t < end and not any(abs(t - x['epochSeconds']) < .001 for x in found):
                found.append({'epochSeconds': t, 'direction': direction})
        elif a == 0 and start <= left < end:
            pre, post = fn(left - .01), fn(left + .01)
            if pre * post < 0:
                found.append({'epochSeconds': left, 'direction': 'rising' if pre < post else 'setting'})
    return {'roots': found, 'minimum': min(map(fn, knots)), 'maximum': max(map(fn, knots)), 'knots': len(knots)}

def calculate(case, step=600):
    date = dt.date.fromisoformat(case['date'])
    midnight = dt.datetime.combine(date, dt.time(), UTC).timestamp()
    lat, lon = case['latitude'], case['longitude']
    zone = ZoneInfo(case['timeZone'])
    phases = [meridian(midnight - 2 * DAY, lon), meridian(midnight + 3 * DAY, lon)]
    candidates = []
    for k in range(math.floor(phases[0] / 360), math.ceil(phases[1] / 360) + 1):
        t = phase_root(k * 360, lon)
        if dt.datetime.fromtimestamp(t, zone).date() == date:
            candidates.append((k, t))
    if len(candidates) != 1:
        return {'status': 'ownership-unavailable', 'transitCount': len(candidates), 'transits': [t for _, t in candidates]}
    k, transit = candidates[0]
    start, end = phase_root(k * 360 - 180, lon), phase_root(k * 360 + 180, lon)
    dec = coordinates(transit)[0]
    noon_height = 90 - abs(lat - math.degrees(dec))
    asr_target = math.degrees(math.atan2(math.sin(math.radians(noon_height)), math.cos(math.radians(noon_height)) + math.sin(math.radians(noon_height)))) if noon_height > 0 else None
    angles = {'fajr': (-18, 'rising'), 'sunrise': (-50 / 60, 'rising'), 'maghrib': (-50 / 60, 'setting'), 'isha': (-case.get('ishaAngleDegrees', 17), 'setting'), 'asr': (asr_target, 'setting')}
    events = {'dhuhr': {'epochSeconds': transit, 'thresholdDegrees': None, 'rootDirection': None, 'rootCount': 1}}
    for event, (angle, direction) in angles.items():
        if angle is None:
            events[event] = {'epochSeconds': None, 'thresholdDegrees': None, 'rootDirection': direction, 'rootCount': 0, 'reason': 'no-positive-transit-height'}
            continue
        fn = lambda t: sine_altitude(t, lat, lon) - math.sin(math.radians(angle))
        # The declared prayer cycle assigns rising events to the morning
        # half-cycle, and setting events to the evening half-cycle.
        scan_start, scan_end = (start, transit) if direction == 'rising' else (transit, end)
        scan = crossings(fn, scan_start, scan_end, step)
        roots = [r for r in scan['roots'] if r['direction'] == direction]
        events[event] = {'epochSeconds': roots[0]['epochSeconds'] if len(roots) == 1 else None, 'thresholdDegrees': angle, 'rootDirection': direction, 'rootCount': len(roots), 'minimumSineResidual': scan['minimum'], 'maximumSineResidual': scan['maximum']}
    return {'status': 'calculated', 'transitCount': 1, 'transitEpochSeconds': transit, 'startEpochSeconds': start, 'endEpochSeconds': end, 'transitHeightDegrees': noon_height, 'events': events}

def grid():
    points = [
        ('equator', 0, 0, 'UTC'), ('berlin', 52.52, 13.405, 'Europe/Berlin'),
        ('new-york', 40.7128, -74.006, 'America/New_York'), ('makkah', 21.4225, 39.8262, 'Asia/Riyadh'),
        ('sydney', -33.8688, 151.2093, 'Australia/Sydney'), ('tromso', 69.65, 18.96, 'Europe/Oslo'),
        ('longyearbyen', 78.2232, 15.6469, 'Arctic/Longyearbyen'), ('north-limit', 89, 0, 'UTC'),
        ('south-limit', -89, 0, 'UTC'), ('arctic-circle', 66.56, 25, 'Europe/Helsinki'),
        ('antarctic-circle', -66.56, 25, 'UTC'), ('mcmurdo', -77.85, 166.67, 'Antarctica/McMurdo'),
        ('apia', -13.8333, -171.75, 'Pacific/Apia'), ('tonga', -21.13, -175.22, 'Pacific/Tongatapu'),
        ('kiritimati', 1.87, -157.43, 'Pacific/Kiritimati'), ('east-dateline', 0, 180, 'UTC'),
        ('west-dateline', 0, -180, 'UTC'), ('east-dateline-plus14', 0, 180, 'Pacific/Kiritimati'),
        ('west-dateline-minus12', 0, -180, 'Etc/GMT+12'), ('kathmandu', 27.7172, 85.324, 'Asia/Kathmandu'),
        ('lord-howe', -31.55, 159.083, 'Australia/Lord_Howe'), ('reykjavik', 64.1466, -21.9426, 'Atlantic/Reykjavik'),
    ]
    dates = ['2026-03-20', '2026-06-21', '2026-09-23', '2026-12-21', '2028-02-29']
    result = [{'id': f'{name}-{date}', 'date': date, 'latitude': lat, 'longitude': lon, 'timeZone': zone} for name, lat, lon, zone in points for date in dates]
    for name, lat, lon, zone, date in [
        ('ny-spring', 40.7128, -74.006, 'America/New_York', '2026-03-08'),
        ('ny-fall', 40.7128, -74.006, 'America/New_York', '2026-11-01'),
        ('berlin-spring', 52.52, 13.405, 'Europe/Berlin', '2026-03-29'),
        ('berlin-fall', 52.52, 13.405, 'Europe/Berlin', '2026-10-25'),
        ('lord-howe-short', -31.55, 159.083, 'Australia/Lord_Howe', '2026-10-04'),
        ('lord-howe-long', -31.55, 159.083, 'Australia/Lord_Howe', '2026-04-05'),
        ('apia-skipped', -13.8333, -171.75, 'Pacific/Apia', '2011-12-30'),
        ('ny-mismatched-zero', 0, 115, 'America/New_York', '2026-03-08'),
        ('ny-mismatched-multiple', 0, 115, 'America/New_York', '2026-11-01'),
    ]:
        result.append({'id': name, 'date': date, 'latitude': lat, 'longitude': lon, 'timeZone': zone})
    for case in list(result):
        if case['id'].startswith(('berlin-', 'tromso-', 'apia-', 'equator-')) and case['date'] in dates:
            result.append({**case, 'id': case['id'] + '-isha16', 'ishaAngleDegrees': 16})
    return result

if __name__ == '__main__':
    here = Path(__file__).resolve().parent
    cases = grid()
    output = {'schema': 'independent-local-solar-oracle/v1', 'caseCount': len(cases), 'model': 'Independent Python implementation of USNO approximate equations; not a physical accuracy certificate', 'rows': [{'input': x, 'oracle': calculate(x)} for x in cases]}
    (here / 'oracle-fixtures.json').write_text(json.dumps(output, indent=2) + '\n')
    print(json.dumps({'caseCount': len(cases), 'ownershipUnavailable': [{'id': r['input']['id'], 'transitCount': r['oracle']['transitCount']} for r in output['rows'] if r['oracle']['status'] != 'calculated']}))
