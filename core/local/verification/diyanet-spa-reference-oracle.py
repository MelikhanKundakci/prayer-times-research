"""Recompute the separate 22-case Diyanet SPA fixture with pinned upstream pvlib.

Usage: python3 diyanet-spa-reference-oracle.py /path/to/pvlib-v0.13.1/spa.py
No network or file writes unless an explicit --output destination is supplied.
The old 348-case fixture is never modified.
"""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import sys

HERE=Path(__file__).resolve().parent
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('pvlib_source',type=Path,help='Exact pvlib-python v0.13.1 spa.py; SHA-256 is enforced')
parser.add_argument('--output',type=Path,help='Optional destination for independently recomputed fixture; existing fixtures are protected')
args=parser.parse_args()
protected=[HERE/'diyanet-spa-reference-fixtures.json',HERE/'spa-fixtures.json']
if args.output and args.output.resolve() in [p.resolve() for p in protected]:
    parser.error('Choose a separate output path; frozen fixtures are not overwritten')

# Reuse only the independent Python reference equations/root finder, not JS.
# The inherited module requires and hashes this explicit upstream source path.
original_argv=sys.argv
sys.argv=[str(HERE/'spa-oracle.py'),str(args.pvlib_source)]
try:
    spec=importlib.util.spec_from_file_location('independent_spa_events',HERE/'spa-oracle.py')
    oracle=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(oracle)
finally:
    sys.argv=original_argv

fixture=json.loads(protected[0].read_text())
assert fixture['schema']=='independent-diyanet-spa-reference/v1'
assert fixture['caseCount']==len(fixture['rows'])==22
assert fixture['sourceSha256']==oracle.EXPECTED_SOURCE
reference_check=oracle.verify_reference()
rows=[]
maximum=0.
calculated=absent=boundaries=0
for row in fixture['rows']:
    fresh=oracle.calculate(row['input'])
    original=row['reference']
    assert fresh['status']==original['status']=='calculated',row['id']
    for key in ['startEpochSeconds','endEpochSeconds']:
        assert abs(fresh[key]-original[key])<=.001,(row['id'],key)
        boundaries+=1
    for event in oracle.EVENTS:
        a,b=fresh['events'][event],original['events'][event]
        assert a['rootCount']==b['rootCount'],(row['id'],event)
        assert (a['epochSeconds'] is None)==(b['epochSeconds'] is None)
        if a['epochSeconds'] is None:
            absent+=1
        else:
            difference=abs(a['epochSeconds']-b['epochSeconds'])
            assert difference<=.001,(row['id'],event,difference)
            maximum=max(maximum,difference)
            calculated+=1
    rows.append({**row,'reference':fresh})
assert calculated==116 and absent==16 and boundaries==44
if args.output:
    args.output.write_text(json.dumps({**fixture,'rows':rows},indent=2,allow_nan=False)+'\n')
print(json.dumps({'result':'PASS','caseCount':22,'eventTimestampsReproduced':calculated,
    'unavailableEventsReproduced':absent,'cycleBoundariesReproduced':boundaries,
    'maximumDifferenceSeconds':maximum,'referenceSourceSha256':oracle.EXPECTED_SOURCE,
    'fixtureSha256':hashlib.sha256(protected[0].read_bytes()).hexdigest(),
    'referenceCheck':reference_check,'wroteRecomputedFixture':bool(args.output)},indent=2))
