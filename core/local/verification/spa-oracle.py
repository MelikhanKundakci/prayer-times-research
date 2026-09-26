"""Offline independent pvlib SPA event roots. No production imports or fitting."""
from __future__ import annotations
import datetime as dt
from functools import lru_cache
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import sys
import time
from zoneinfo import ZoneInfo
import numpy as np

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
if len(sys.argv) != 2:
    raise SystemExit('Usage: python3 spa-oracle.py /path/to/pinned-pvlib-v0.13.1-spa.py')
VENDOR = Path(sys.argv[1]).resolve()
EXPECTED_SOURCE = 'ad7762ccca5fd9611ef9e2a9b1e37f95fe4c5b31628616b2ad3e84ea1e5f9202'
assert hashlib.sha256(VENDOR.read_bytes()).hexdigest() == EXPECTED_SOURCE
spec = importlib.util.spec_from_file_location('retained_pvlib_spa', VENDOR)
spa = importlib.util.module_from_spec(spec)
spec.loader.exec_module(spa)
UTC = dt.timezone.utc
RAD = math.pi / 180
DAY = 86400
EVENTS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']


def position(times, delta_t):
    """Apparent sidereal angle, geocentric RA/declination; pressure irrelevant in sst mode."""
    return spa.solar_position_numpy(np.asarray(times, dtype=np.float64), 0., 0., 0., 0., 0., delta_t, 0., 1, sst=True)


@lru_cache(maxsize=300000)
def scalar_position(t, delta_t):
    return tuple(float(x[0]) for x in position([t], delta_t))


def hour_angle(t, longitude, delta_t):
    sidereal, ra, _ = scalar_position(t, delta_t)
    return (sidereal + longitude - ra + 180) % 360 - 180


def sine_height_many(times, latitude, longitude, delta_t):
    sidereal, ra, decl = position(times, delta_t)
    h = np.radians(sidereal + longitude - ra)
    p, d = math.radians(latitude), np.radians(decl)
    return math.sin(p) * np.sin(d) + math.cos(p) * np.cos(d) * np.cos(h)


def sine_height(t, latitude, longitude, delta_t):
    sidereal, ra, decl = scalar_position(t, delta_t)
    h = math.radians(sidereal + longitude - ra)
    p, d = math.radians(latitude), math.radians(decl)
    return math.sin(p) * math.sin(d) + math.cos(p) * math.cos(d) * math.cos(h)


def bisect(fn, lo, hi, tolerance=.0005):
    fl, fh = fn(lo), fn(hi)
    if not all(math.isfinite(v) for v in [fl, fh]): raise ValueError('Nonfinite bracket')
    if fl == 0: return lo
    if fh == 0: return hi
    if fl * fh > 0: raise ValueError('Unbracketed root')
    while hi - lo > tolerance:
        mid = (lo + hi) / 2
        fm = fn(mid)
        if not math.isfinite(fm): raise ValueError('Nonfinite root function')
        if fm == 0: return mid
        if (fm > 0) == (fl > 0): lo, fl = mid, fm
        else: hi = mid
    return (lo + hi) / 2


def meridian_root(center, longitude, delta_t, target=0):
    # At these brackets the wrapped residual stays near the selected meridian.
    fn = lambda t: (hour_angle(t, longitude, delta_t) - target + 180) % 360 - 180
    return bisect(fn, center - 7200, center + 7200)


def nodes(start, end, latitude, longitude, delta_t, step):
    n = math.ceil((end - start) / step)
    times = np.linspace(start, end, n + 1)
    values = sine_height_many(times, latitude, longitude, delta_t)
    derivatives = (sine_height_many(times + 1, latitude, longitude, delta_t)
                   - sine_height_many(times - 1, latitude, longitude, delta_t)) / 2
    fn = lambda t: sine_height(t, latitude, longitude, delta_t)
    derivative = lambda t: (fn(t + 1) - fn(t - 1)) / 2
    result = [(float(t), float(v)) for t, v in zip(times, values)]
    for a, b, da, db in zip(times, times[1:], derivatives, derivatives[1:]):
        if da * db < 0:
            t = bisect(derivative, float(a), float(b))
            result.append((t, fn(t)))
    return sorted(set(result))


@lru_cache(maxsize=1000)
def cycle(date, latitude, longitude, zone_name, delta_t, step):
    midnight = dt.datetime.fromisoformat(date).replace(tzinfo=UTC).timestamp()
    zone, owner = ZoneInfo(zone_name), dt.date.fromisoformat(date)
    transits = []
    for offset in range(-2, 3):
        center = midnight + offset * DAY + (12 - longitude / 15) * 3600
        t = meridian_root(center, longitude, delta_t)
        if dt.datetime.fromtimestamp(t, zone).date() == owner:
            if not any(abs(t - old) < .001 for old in transits): transits.append(t)
    if len(transits) != 1:
        return {'status': 'ownership-unavailable', 'transitCount': len(transits), 'transits': transits}
    t = transits[0]
    start = meridian_root(t - DAY / 2, longitude, delta_t, 180)
    end = meridian_root(t + DAY / 2, longitude, delta_t, 180)
    decl = scalar_position(t, delta_t)[2]
    height = 90 - abs(latitude - decl)
    return {'status': 'calculated', 'transitEpochSeconds': t, 'startEpochSeconds': start,
            'endEpochSeconds': end, 'transitHeightDegrees': height, 'transitDeclinationDegrees': decl,
            'morningNodes': nodes(start, t, latitude, longitude, delta_t, step),
            'eveningNodes': nodes(t, end, latitude, longitude, delta_t, step)}


def crossing(knots, angle, direction, case, delta_t):
    target = math.sin(math.radians(angle))
    lat, lon = case['latitude'], case['longitude']
    fn = lambda t: sine_height(t, lat, lon, delta_t) - target
    roots = []
    for (left, lv), (right, rv) in zip(knots, knots[1:]):
        a, b = lv - target, rv - target
        if a * b < 0:
            found_direction = 'rising' if a < b else 'setting'
            if found_direction == direction:
                t = bisect(fn, left, right)
                if not any(abs(t - old) < .001 for old in roots): roots.append(t)
    epoch = roots[0] if len(roots) == 1 else None
    minimum = min(v - target for _, v in knots)
    maximum = max(v - target for _, v in knots)
    slope = None
    if epoch is not None:
        altitude = lambda t: math.degrees(math.asin(max(-1., min(1., sine_height(t, lat, lon, delta_t)))))
        slope = (altitude(epoch + 1) - altitude(epoch - 1)) / 2
    return {'epochSeconds': epoch, 'thresholdDegrees': angle, 'direction': direction,
            'rootCount': len(roots), 'rootsEpochSeconds': roots,
            'minimumSineResidual': minimum, 'maximumSineResidual': maximum,
            'altitudeSlopeDegreesPerSecond': slope}


def calculate(case, delta_t=69.184, step=300):
    c = cycle(case['date'], case['latitude'], case['longitude'], case['timeZone'], delta_t, step)
    if c['status'] != 'calculated': return c
    base = {k: v for k, v in c.items() if not k.endswith('Nodes')}
    height = c['transitHeightDegrees']
    factor = case.get('asrShadowFactor', 1)
    asr = math.degrees(math.atan2(math.sin(math.radians(height)), math.cos(math.radians(height)) + factor * math.sin(math.radians(height)))) if height > 0 else None
    definitions = {'fajr': (-case.get('fajrAngleDegrees', 18), 'rising'),
                   'sunrise': (-case.get('horizonDepressionDegrees', 50 / 60), 'rising'),
                   'asr': (asr, 'setting'), 'maghrib': (-case.get('horizonDepressionDegrees', 50 / 60), 'setting'),
                   'isha': (-case.get('ishaAngleDegrees', 17), 'setting')}
    events = {'dhuhr': {'epochSeconds': c['transitEpochSeconds'], 'thresholdDegrees': None, 'direction': None, 'rootCount': 1}}
    for name, (angle, direction) in definitions.items():
        if angle is None:
            events[name] = {'epochSeconds': None, 'thresholdDegrees': None, 'direction': direction, 'rootCount': 0, 'reason': 'no-positive-transit-height'}
        else:
            events[name] = crossing(c['morningNodes'] if direction == 'rising' else c['eveningNodes'], angle, direction, case, delta_t)
    return {**base, 'events': {event: events[event] for event in EVENTS}}


def verify_reference():
    fixture = json.loads((ROOT / 'methods/diyanet/research/spa-reference/astronomy/pvlib-grid-fixture.json').read_text())
    maxima = {'rightAscension': 0., 'declination': 0.}
    for row in fixture['records']:
        _, ra, dec = scalar_position((row['jdUtc'] - 2440587.5) * DAY, row['deltaTSeconds'])
        for key, value in [('rightAscension', ra), ('declination', dec)]:
            maxima[key] = max(maxima[key], abs(value - row[key]))
    assert all(v < 2e-8 for v in maxima.values()), maxima
    # Official report Appendix A.5, printed geocentric RA/Dec rounded to 5 decimals.
    _, ra, dec = scalar_position((2452930.312847 - 2440587.5) * DAY, 67.)
    assert abs(ra - 202.22741) < 5e-6 and abs(dec + 9.31434) < 5e-6
    return {'savedCoordinateCases': 64, 'maximumDifferenceDegrees': maxima, 'officialWorkedExample': 'PASS',
            'referenceSourceSha256': EXPECTED_SOURCE, 'python': sys.version, 'numpy': np.__version__}


if __name__ == '__main__':
    verified = verify_reference()
    fixture = json.loads((HERE / 'spa-fixtures.json').read_text())
    maximum = 0.
    checked = missing = rejected = 0
    for row in fixture['rows']:
        fresh = calculate(row['input'])
        old = row['reference']
        assert fresh['status'] == old['status'], row['id']
        if fresh['status'] != 'calculated':
            assert fresh['transitCount'] == old['transitCount']
            rejected += 1
            continue
        for event in EVENTS:
            a, b = fresh['events'][event], old['events'][event]
            assert a['rootCount'] == b['rootCount'], (row['id'], event)
            assert (a['epochSeconds'] is None) == (b['epochSeconds'] is None)
            if a['epochSeconds'] is None:
                missing += 1
            else:
                difference = abs(a['epochSeconds'] - b['epochSeconds'])
                assert difference <= .001, (row['id'], event, difference)
                maximum = max(maximum, difference)
                checked += 1
    print(json.dumps({'result': 'PASS', 'cases': len(fixture['rows']),
        'eventTimestampsReproduced': checked, 'unavailableEventsReproduced': missing,
        'ownershipRejectionsReproduced': rejected, 'maximumDifferenceSeconds': maximum,
        'referenceVerification': verified}, indent=2))
