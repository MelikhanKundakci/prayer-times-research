"""Independent standard-library arithmetic oracle for solar-center.mjs.

Reads JSON Julian dates from stdin; writes coordinates in the provider's units.
This deliberately duplicates the stated equations in Python, not by importing
or translating the JavaScript provider at runtime.
"""

import json
import math
import sys


def wrap(value, period):
    return (value % period + period) % period


def evaluate(jd):
    days = jd - 2451545.0
    centuries = days / 36525.0
    anomaly = 357.52911 + centuries * (35999.05029 - 0.0001537 * centuries)
    m = math.radians(anomaly)
    center = (
        math.sin(m) * (1.914602 - centuries * (0.004817 + 0.000014 * centuries))
        + math.sin(2.0 * m) * (0.019993 - 0.000101 * centuries)
        + math.sin(3.0 * m) * 0.000289
    )

    mean_longitude = wrap(280.459 + 0.98564736 * days, 360.0)
    longitude = mean_longitude + center
    obliquity = 23.439 - 0.00000036 * days
    lam = math.radians(longitude)
    eps = math.radians(obliquity)
    ra = wrap(math.degrees(math.atan2(math.cos(eps) * math.sin(lam), math.cos(lam))) / 15.0, 24.0)
    dec = math.degrees(math.asin(math.sin(eps) * math.sin(lam)))
    eot = wrap(mean_longitude / 15.0 - ra + 12.0, 24.0) - 12.0
    return {"declination": dec, "equationOfTimeHours": eot, "rightAscension": ra}


dates = json.load(sys.stdin)
json.dump([evaluate(float(jd)) for jd in dates], sys.stdout, allow_nan=False)
