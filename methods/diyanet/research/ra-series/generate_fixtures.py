"""Model-only independent numerical fixtures; no institutional observations."""
import datetime as dt
import hashlib
import json
from pathlib import Path
from independent_solar import VARIANTS, coordinates

HERE = Path(__file__).resolve().parent
dates = ('2000-01-01', '2000-03-20', '2026-03-20', '2026-06-21',
         '2026-09-23', '2026-12-21', '2027-12-31', '2049-12-31')
cases = []
for date in dates:
    instant = dt.datetime.fromisoformat(date + 'T00:00:00+00:00')
    jd = instant.timestamp() / 86400 + 2440587.5
    cases.append({'date': date, 'utc': date + 'T00:00:00Z', 'julianDate': jd,
                  'variants': {variant: coordinates(jd, variant) for variant in VARIANTS}})
result = {
    'schemaVersion': 1,
    'evidenceType': 'independent-model-only-numerical-fixtures',
    'sourceObservationsUsed': False,
    'scope': 'Independent Python calculation of documented solar equations and declared hybrid control, not Diyanet prayer times, source measurements, or institutional validation.',
    'units': {'julianDate': 'UTC Julian days', 'declination': 'degrees',
              'rightAscension': 'hours in [0,24)', 'equationOfTimeHours': 'signed hours'},
    'suggestedAbsoluteTolerance': {'declination': 1e-10,
                                   'rightAscension': 1e-10,
                                   'equationOfTimeHours': 1e-10},
    'independentImplementationSha256': hashlib.sha256((HERE / 'independent_solar.py').read_bytes()).hexdigest(),
    'generatorSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
    'variants': list(VARIANTS), 'cases': cases,
}
(HERE / 'model-only-fixtures.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({'cases': len(cases), 'variantCoordinates': len(cases) * len(VARIANTS)}))
