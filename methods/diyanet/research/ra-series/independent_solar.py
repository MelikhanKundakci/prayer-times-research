"""Independent scalar expressions from the documented USNO and EVE equations.

Read the coefficient audit's source transcription before writing this module;
the candidate JavaScript implementation was not imported or copied.
All input epochs are UTC Julian dates. No prayer source data are read here.
"""

import datetime as dt
import math

VARIANTS = ('current-atan2', 'legacy-atan2', 'legacy-series', 'current-series')


def coordinates(julian_date, variant):
    if variant not in VARIANTS or not math.isfinite(julian_date):
        raise ValueError('finite Julian date and declared variant required')
    elapsed = julian_date - 2451545.0
    legacy = variant.startswith('legacy-')
    q0, q_rate = (280.460, 0.9856474) if legacy else (280.459, 0.98564736)
    g0, g_rate = (357.528, 0.9856003) if legacy else (357.529, 0.98560028)
    epsilon_rate = 0.0000004 if legacy else 0.00000036
    mean = (q0 + q_rate * elapsed) % 360
    anomaly = math.radians((g0 + g_rate * elapsed) % 360)
    longitude = math.radians(mean + 1.915 * math.sin(anomaly)
                             + 0.020 * math.sin(2 * anomaly))
    tilt = math.radians(23.439 - epsilon_rate * elapsed)
    declination = math.degrees(math.asin(math.sin(tilt) * math.sin(longitude)))
    if variant.endswith('-series'):
        t = math.tan(tilt / 2) ** 2
        # EVE's degree-valued expression is algebraically the following
        # radian-valued alpha, avoiding a shared JS expression implementation.
        alpha_radians = longitude - t * math.sin(2 * longitude)
        alpha_radians += t ** 2 * math.sin(4 * longitude) / 2
        right_ascension = (math.degrees(alpha_radians) / 15) % 24
    else:
        right_ascension = (math.degrees(math.atan2(
            math.cos(tilt) * math.sin(longitude), math.cos(longitude))) / 15) % 24
    eot_hours = (mean / 15 - right_ascension + 12) % 24 - 12
    return {'declination': declination, 'rightAscension': right_ascension,
            'equationOfTimeHours': eot_hours}


def raw_noon(carrier, longitude, variant):
    midnight = dt.datetime.fromisoformat(carrier + 'T00:00:00+00:00').timestamp() * 1000
    eot = coordinates(midnight / 86400000 + 2440587.5, variant)['equationOfTimeHours']
    return midnight + (12 - longitude / 15 - eot) * 3600000 + 300000


def nearest_minute(epoch_ms):
    # JS Math.round's positive-infinity tie convention, including negative
    # epoch values; Python's round would apply the wrong ties-to-even rule.
    return math.floor(epoch_ms / 60000 + 0.5) * 60000


def minimax_nuisance(target_minus_raw_seconds, limit=60):
    return max(-limit, min(limit, (min(target_minus_raw_seconds)
                                  + max(target_minus_raw_seconds)) / 2))


def feasible_nuisance(target_minus_raw_seconds):
    # source-30 <= raw+correction < source+30
    return (max(target_minus_raw_seconds) - 30,
            min(target_minus_raw_seconds) + 30)


def self_check():
    assert nearest_minute(30000) == 60000
    assert nearest_minute(29999.999) == 0
    assert nearest_minute(-30000) == 0
    assert nearest_minute(-30000.001) == -60000
    # Source zero with unadjusted raw = -10 seconds has residual +10.
    # Accepted nuisance is [-20,40); lower tie accepted, upper excluded.
    assert feasible_nuisance([10]) == (-20, 40)
    assert nearest_minute(-10000 + -20 * 1000) == 0
    assert nearest_minute(-10000 + 40 * 1000) == 60000
    # Contradictory quantization cells remain contradictory under a shift.
    assert feasible_nuisance([-30, 30]) == (0, 0)
    assert minimax_nuisance([10, 30]) == 20
    assert minimax_nuisance([100, 200]) == 60


if __name__ == '__main__':
    self_check()
    print('Independent solar and quantization self-checks passed.')
