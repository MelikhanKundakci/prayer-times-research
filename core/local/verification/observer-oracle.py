"""Independent zero-elevation topocentric SPA event roots using pinned pvlib.

No imports from the production JavaScript solar provider or event solver.
The source-free cases come from the already-declared SPA engineering grids;
this script acquires no calendars or network data.
"""
from __future__ import annotations
import datetime as dt
import argparse
from functools import lru_cache
import hashlib
import importlib.util
import json
import math
from pathlib import Path
from zoneinfo import ZoneInfo
import numpy as np

HERE = Path(__file__).resolve().parent
PUBLIC = HERE.parents[2]
SOURCE_SHA256 = 'ad7762ccca5fd9611ef9e2a9b1e37f95fe4c5b31628616b2ad3e84ea1e5f9202'
EVENTS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']
DAY = 86400.0
DELTA_T = 69.184
UTC = dt.timezone.utc

def load_vendor(path):
    global spa
    vendor = Path(path).resolve()
    assert hashlib.sha256(vendor.read_bytes()).hexdigest() == SOURCE_SHA256
    spec = importlib.util.spec_from_file_location('pinned_pvlib_spa_observer_oracle', vendor)
    spa = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(spa)


spa = None


def bisect(fn, lo, hi, tolerance=0.0002):
    flo, fhi = fn(lo), fn(hi)
    if not all(math.isfinite(v) for v in (flo, fhi)) or flo * fhi > 0:
        raise ValueError('Invalid root bracket')
    while hi - lo > tolerance:
        mid = (lo + hi) / 2
        fm = fn(mid)
        if fm == 0:
            return mid
        if (fm > 0) == (flo > 0):
            lo, flo = mid, fm
        else:
            hi, fhi = mid, fm
    return (lo + hi) / 2


def position(times, latitude, longitude):
    # pvlib output row 3 is topocentric geometric elevation, with no
    # refraction because pressure is zero. Observer elevation is explicitly 0 m.
    return spa.solar_position_numpy(np.asarray(times, dtype=np.float64), latitude,
                                    longitude, 0., 0., 0., DELTA_T, 0., 1)


@lru_cache(maxsize=200000)
def scalar_position(t, latitude, longitude):
    return tuple(float(row[0]) for row in position([t], latitude, longitude))


def topocentric_hour_angle(t, latitude, longitude):
    # Derive H' independently from SPA's geocentric sidereal coordinates and
    # published parallax subroutines, rather than infer it from altitude.
    geocentric = spa.solar_position_numpy(
        np.asarray([t], dtype=np.float64), 0., 0., 0., 0., 0., DELTA_T, 0., 1, sst=True
    )
    sidereal, alpha, delta = (float(row[0]) for row in geocentric)
    radius = float(spa.solar_position_numpy(
        np.asarray([t], dtype=np.float64), 0., 0., 0., 0., 0., DELTA_T, 0., 1, esd=True
    )[0][0])
    H = (float(sidereal) + longitude - float(alpha) + 180) % 360 - 180
    u = float(spa.uterm(latitude))
    x = float(spa.xterm(u, latitude, 0.))
    xi = float(spa.equatorial_horizontal_parallax(radius))
    da = float(spa.parallax_sun_right_ascension(x, xi, H, float(delta)))
    return H - da


def transit_root(center, latitude, longitude):
    return bisect(lambda t: topocentric_hour_angle(t, latitude, longitude),
                  center - 7200, center + 7200)


def solar_cycle(input):
    date = dt.date.fromisoformat(input['date'])
    zone = ZoneInfo(input['timeZone'])
    midnight = dt.datetime.combine(date, dt.time(), UTC).timestamp()
    transits = []
    for offset in range(-2, 3):
        candidate_midnight = midnight + offset * DAY
        center = candidate_midnight + (12 - input['longitude'] / 15) * 3600
        t = transit_root(center, input['latitude'], input['longitude'])
        if dt.datetime.fromtimestamp(t, zone).date() == date:
            if not any(abs(t - old) < 0.001 for old in transits):
                transits.append(t)
    if len(transits) != 1:
        return None, {'status': 'ownership-unavailable', 'transitCount': len(transits)}
    transit = transits[0]

    # sin(H') changes sign at each lower meridian. These brackets are a full
    # ten to fourteen hours from H'=0, so they exclude the upper transit and
    # are short enough to exclude the next sign-changing root.
    def lower_residual(t):
        return math.sin(math.radians(topocentric_hour_angle(t, input['latitude'], input['longitude'])))
    start = bisect(lower_residual, transit - 14 * 3600, transit - 10 * 3600)
    end = bisect(lower_residual, transit + 10 * 3600, transit + 14 * 3600)
    noon_altitude = scalar_position(transit, input['latitude'], input['longitude'])[3]
    return (start, transit, end, noon_altitude), None


def nodes(start, end, latitude, longitude, step=300):
    count = math.ceil((end - start) / step)
    times = np.linspace(start, end, count + 1)
    elevations = position(times, latitude, longitude)[3]
    plus = position(times + 1, latitude, longitude)[3]
    minus = position(times - 1, latitude, longitude)[3]
    slopes = (plus - minus) / 2
    at = lambda t: scalar_position(t, latitude, longitude)[3]
    deriv = lambda t: (at(t + 1) - at(t - 1)) / 2
    values = [(float(t), float(v)) for t, v in zip(times, elevations)]
    for a, b, da, db in zip(times, times[1:], slopes, slopes[1:]):
        if da * db < 0:
            root = bisect(deriv, float(a), float(b))
            values.append((root, at(root)))
    return sorted(set(values))


def crossing(knots, target, direction, latitude, longitude):
    at = lambda t: scalar_position(t, latitude, longitude)[3]
    roots = []
    for (ta, va), (tb, vb) in zip(knots, knots[1:]):
        fa, fb = va - target, vb - target
        if fa * fb < 0:
            found = 'rising' if fa < fb else 'setting'
            if found == direction:
                root = bisect(lambda t: at(t) - target, ta, tb)
                if not roots or abs(root - roots[-1]) > 0.001:
                    roots.append(root)
    return roots


def calculate(input):
    cycle, failure = solar_cycle(input)
    if failure:
        return failure
    start, transit, end, noon_altitude = cycle
    lat, lon = input['latitude'], input['longitude']
    morning, evening = nodes(start, transit, lat, lon), nodes(transit, end, lat, lon)
    thresholds = {
        'fajr': (-input.get('fajrAngleDegrees', 18), 'rising', morning),
        'sunrise': (-input.get('horizonDepressionDegrees', 50/60), 'rising', morning),
        'maghrib': (-input.get('horizonDepressionDegrees', 50/60), 'setting', evening),
        'isha': (-input.get('ishaAngleDegrees', 17), 'setting', evening),
    }
    events = {}
    for name, (angle, direction, knotset) in thresholds.items():
        roots = crossing(knotset, angle, direction, lat, lon)
        events[name] = {'epochSeconds': roots[0] if len(roots) == 1 else None,
                        'thresholdDegrees': angle, 'direction': direction, 'rootCount': len(roots)}
    factor = input.get('asrShadowFactor', 1)
    if noon_altitude <= 0:
        events['asr'] = {'epochSeconds': None, 'thresholdDegrees': None,
                         'direction': 'setting', 'rootCount': 0,
                         'reason': 'no-positive-topocentric-noon-height'}
    else:
        m = math.radians(noon_altitude)
        target = math.degrees(math.atan2(math.sin(m), math.cos(m) + factor * math.sin(m)))
        roots = crossing(evening, target, 'setting', lat, lon)
        events['asr'] = {'epochSeconds': roots[0] if len(roots) == 1 else None,
                         'thresholdDegrees': target, 'direction': 'setting', 'rootCount': len(roots)}
    events['dhuhr'] = {'epochSeconds': transit, 'thresholdDegrees': None,
                       'direction': None, 'rootCount': 1}
    return {'status': 'calculated', 'startEpochSeconds': start,
            'transitEpochSeconds': transit, 'endEpochSeconds': end,
            'transitTopocentricAltitudeDegrees': noon_altitude, 'events': events}


INPUT_PINS = {
    'core/local/verification/spa-fixtures.json': '9f0d6bd56cbf0e540b935b78d58ca8b9012e1986d1bee0867db816a1f684e904',
    'core/local/verification/diyanet-spa-reference-fixtures.json': 'e1b1f1cfbccc271f244497a97cb4cb09b2d73133a846196e6fea67a97679b008',
}


def declared_cases():
    cases, seen_ids = [], set()
    for relative, expected_hash in INPUT_PINS.items():
        path = PUBLIC / relative
        source_bytes = path.read_bytes()
        assert hashlib.sha256(source_bytes).hexdigest() == expected_hash, f'Input fixture changed: {relative}'
        data = json.loads(source_bytes)
        for row in data['rows']:
            # The two frozen grids intentionally share two labels for different
            # Isha angles. Preserve every input; suffix only conflicting IDs.
            case_id = row['id']
            if case_id in seen_ids:
                case_id = f"{case_id}@{Path(relative).stem}"
            assert case_id not in seen_ids
            seen_ids.add(case_id)
            cases.append({'id': case_id, 'input': row['input']})
    cases.append({'id': 'bodo-noon-diagnostic-2027-12-08', 'input': {
        'date': '2027-12-08', 'latitude': 67.28324, 'longitude': 14.38305,
        'timeZone': 'Europe/Oslo', 'fajrAngleDegrees': 18, 'ishaAngleDegrees': 17,
        'asrShadowFactor': 1, 'horizonDepressionDegrees': 50/60,
    }})
    assert len(cases) == 371
    return cases


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', help='pinned pvlib v0.13.1 spa.py source; SHA-256 checked')
    parser.add_argument('--output', default=str(HERE / 'observer-reference-fixtures.json'))
    args = parser.parse_args()
    load_vendor(args.source)
    records = [{'id': case['id'], 'input': case['input'], 'reference': calculate(case['input'])}
               for case in declared_cases()]
    output = {'schema': 'independent-local-observer-spa-events/v1',
              'caseCount': len(records), 'observerElevationMetres': 0,
              'timeScale': {'deltaTSeconds': DELTA_T, 'UT1MinusUTCSeconds': 0},
              'refractionCorrectionDegrees': 0,
              'source': 'Retained pvlib-python v0.13.1 SPA, direct topocentric geometric altitude and parallax equations',
              'sourceSha256': SOURCE_SHA256,
              'inputFixtureSha256': INPUT_PINS,
              'rows': records}
    encoded = json.dumps(output, indent=2, sort_keys=True) + '\n'
    target = Path(args.output)
    target.write_text(encoded)
    print(json.dumps({'result': 'PASS', 'cases': len(records), 'path': str(target),
                      'sha256': hashlib.sha256(encoded.encode()).hexdigest()}, indent=2))


if __name__ == '__main__':
    main()
