"""Generate independent golden coordinates using pinned pvlib v0.13.1."""
import datetime as dt
import json
import pathlib
import sys

import numpy as np

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE / "vendor"))
import spa  # noqa: E402

records = []
for year in range(2000, 2031, 2):
    for month, day, hour in ((1, 1, 0), (4, 12, 13), (7, 1, 0), (10, 17, 19)):
        instant = dt.datetime(year, month, day, hour, 30, 30, tzinfo=dt.timezone.utc)
        timestamp = instant.timestamp()
        jd = timestamp / 86400 + 2440587.5
        jd_array = np.array([timestamp], dtype=np.float64)
        _, ra, dec = spa.solar_position(
            jd_array, 0.0, 0.0, 0.0, 0.0, 0.0, 69.184, 0.5667,
            numthreads=1, sst=True,
        )
        jde = spa.julian_ephemeris_day(np.array([jd]), 69.184)
        jce = spa.julian_ephemeris_century(jde)
        jme = spa.julian_ephemeris_millennium(jce)
        psi_eps = np.empty((2, 1), dtype=np.float64)
        spa.longitude_obliquity_nutation(
            jce,
            spa.mean_elongation(jce),
            spa.mean_anomaly_sun(jce),
            spa.mean_anomaly_moon(jce),
            spa.moon_argument_latitude(jce),
            spa.moon_ascending_longitude(jce),
            psi_eps,
        )
        epsilon = spa.true_ecliptic_obliquity(
            spa.mean_ecliptic_obliquity(jme), psi_eps[1]
        )
        mean_longitude = spa.sun_mean_longitude(jme)
        eot = spa.equation_of_time(mean_longitude, ra, psi_eps[0], epsilon)
        records.append({
            "utc": instant.isoformat(),
            "jdUtc": jd,
            "deltaTSeconds": 69.184,
            "rightAscension": float(ra[0]),
            "declination": float(dec[0]),
            "equationOfTime": float(eot[0]),
        })

(HERE / "pvlib-grid-fixture.json").write_text(
    json.dumps({
        "reference": "pvlib-python v0.13.1 spa.py (BSD-3-Clause)",
        "sampleCount": len(records),
        "purpose": "Independent regression check of apparent geocentric SPA quantities; topocentric values omitted.",
        "records": records,
    }, indent=2) + "\n"
)
