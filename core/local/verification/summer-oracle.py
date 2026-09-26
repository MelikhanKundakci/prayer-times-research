"""Independent frozen-contract summer oracle; no JavaScript imports."""
from pathlib import Path
import importlib.util
import datetime as dt
import hashlib
import json
import math

HERE = Path(__file__).resolve().parent
NORTH_PATH = HERE / 'northern-oracle.py'
SPEC = importlib.util.spec_from_file_location('independent_north', NORTH_PATH)
NORTH = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(NORTH)
PHYSICAL = NORTH.PHYSICAL
MINUTE, MARGIN, BAND = 60.0, 420.0, 1200.0
CASES = NORTH.CASES + [
    {'id': 'northern-threshold-2027', 'year': 2027, 'latitude': 44.5, 'longitude': 15, 'timeZone': 'Europe/Berlin'},
    {'id': 'frankfurt-2002', 'year': 2002, 'latitude': 50.11, 'longitude': 8.68, 'timeZone': 'Europe/Berlin'},
    {'id': 'frankfurt-2097', 'year': 2097, 'latitude': 50.11, 'longitude': 8.68, 'timeZone': 'Europe/Berlin'},
]
MODE = {'ordinary': 0, 'transition': 1, 'night-fraction': 2, 'unavailable': 3}

def select(event, raw, candidate, absent_allowed=False):
    if raw is None:
        return {'value': candidate if absent_allowed else None, 'weight': 1 if absent_allowed else None,
                'mode': 'night-fraction' if absent_allowed else 'unavailable'}
    distance = raw - candidate if event == 'fajr' else candidate - raw
    if distance >= BAND: return {'value': raw, 'weight': 0, 'mode': 'ordinary'}
    if distance <= 0: return {'value': candidate, 'weight': 1, 'mode': 'night-fraction'}
    x = 1 - distance / BAND
    weight = x * x * (3 - 2 * x)
    return {'value': raw + (candidate - raw) * weight, 'weight': weight, 'mode': 'transition'}

def allowed_absence(event):
    if event['epochSeconds'] is not None: return False
    if event['rootCount'] != 0: return False
    minimum = event.get('minimumSineResidual')
    # An independent near-zero minimum with no directed root is the numerical
    # tangent case; strictly positive minimum is continuous-above-threshold.
    return minimum is not None and minimum >= -2e-12

def blocked_rows(dates):
    return [[date, None, None, 3, 3, None, None, None, None] for date in dates]

def groups(indices):
    result = []
    for i in indices:
        if not result or i != result[-1][-1] + 1: result.append([i])
        else: result[-1].append(i)
    return result

def calculate_case(case):
    prerequisite = NORTH.annual(case)
    year = case['year']
    owned = list(NORTH.date_range(dt.date(year, 1, 1), dt.date(year, 12, 31)))
    if prerequisite['status'] != 'ready':
        return {'status': 'blocked', 'reasonClass': 'northern-context-unavailable', 'q': None,
                'rows': blocked_rows(owned), 'counts': {'fajr': {'unavailable': len(owned)}, 'isha': {'unavailable': len(owned)}},
                'gapPreflight': [], 'paddingPreflight': [], 'nightChecks': 0, 'cycleChecks': 0, 'maxDailyPhaseJumps': None}
    labels = list(NORTH.date_range(dt.date(year - 1, 12, 31), dt.date(year + 1, 1, 1)))
    solar = [PHYSICAL.calculate({'date': d, 'latitude': case['latitude'], 'longitude': case['longitude'], 'timeZone': case['timeZone'], 'ishaAngleDegrees': 16}) for d in labels]
    assert all(d['status'] == 'calculated' for d in solar)
    missing = [i for i, d in enumerate(solar) if d['events']['fajr']['epochSeconds'] is None]
    anchor = missing[0] - 1 if missing else labels.index(f'{year}-06-21')
    m_anchor = solar[anchor - 1]['events']['maghrib']['epochSeconds'] + MARGIN
    r_anchor = solar[anchor]['events']['sunrise']['epochSeconds'] - MARGIN
    q = (solar[anchor]['events']['fajr']['epochSeconds'] - m_anchor) / (3 * (r_anchor - m_anchor))
    assert 0 < q < 1 / 3
    choices = {'fajr': {}, 'isha': {}}
    candidates = {'fajr': {}, 'isha': {}}
    night_data = []
    for j in range(1, len(labels)):
        previous, ending = solar[j-1], solar[j]
        m = previous['events']['maghrib']['epochSeconds'] + MARGIN
        r = ending['events']['sunrise']['epochSeconds'] - MARGIN
        h = r - m
        assert h > 300 * MINUTE
        third = q * h
        i_candidate, f_candidate = m + third, r - 11 * third / 8
        candidates['isha'][j-1] = i_candidate
        candidates['fajr'][j] = f_candidate
        choices['isha'][j-1] = select('isha', previous['events']['isha']['epochSeconds'], i_candidate, allowed_absence(previous['events']['isha']))
        choices['fajr'][j] = select('fajr', ending['events']['fajr']['epochSeconds'], f_candidate, allowed_absence(ending['events']['fajr']))
        night_data.append({'startIndex': j-1, 'endIndex': j, 'm': m, 'r': r, 'H': h, 'third': third,
                           'ishaCandidate': i_candidate, 'fajrCandidate': f_candidate})
    gap_preflight, padding_preflight, failures = [], [], []
    for event in ['fajr', 'isha']:
        absent = [i for i, d in enumerate(solar) if d['events'][event]['epochSeconds'] is None]
        for gap in groups(absent):
            before, after = gap[0]-1, gap[-1]+1
            bounded = before >= 0 and after < len(labels)
            neighbors_capped = bounded and all(i in choices[event] and choices[event][i]['mode'] == 'night-fraction'
                                              and solar[i]['events'][event]['epochSeconds'] is not None for i in [before, after])
            absence_proven = all(allowed_absence(solar[i]['events'][event]) for i in gap)
            row = {'event': event, 'firstMissingDate': labels[gap[0]], 'lastMissingDate': labels[gap[-1]],
                   'beforeDate': labels[before] if bounded else None, 'afterDate': labels[after] if bounded else None,
                   'neighborsFullyCapped': bool(neighbors_capped), 'absenceProven': absence_proven,
                   'neighborModes': [choices[event].get(i, {}).get('mode') for i in [before, after]]}
            gap_preflight.append(row)
            if not neighbors_capped or not absence_proven: failures.append('gap-boundary-preflight')
    for event, i in [('isha', 0), ('fajr', 1), ('isha', len(labels)-2), ('fajr', len(labels)-1)]:
        selected = choices[event][i]
        raw = solar[i]['events'][event]['epochSeconds']
        raw_unchanged = selected['mode'] == 'ordinary' and selected['value'] == raw and raw is not None
        padding_preflight.append({'event': event, 'date': labels[i], 'ordinaryAndUnchanged': raw_unchanged})
        if not raw_unchanged: failures.append('year-boundary-preflight')
    night_checks, cycle_checks, minimum_night_gap = 0, 0, math.inf
    for night in night_data:
        j, k = night['startIndex'], night['endIndex']
        i, f = choices['isha'][j]['value'], choices['fajr'][k]['value']
        valid = i is not None and f is not None and night['m'] < i < f < night['r']
        if not valid: failures.append('night-chronology')
        else:
            assert i <= night['ishaCandidate'] + 1e-7
            assert f >= night['fajrCandidate'] - 1e-7
            assert f - i > 5 * night['H'] / 24 - 1e-7
            minimum_night_gap = min(minimum_night_gap, f-i)
        night_checks += 1
    for j in range(1, len(labels)-1):
        physical = solar[j]
        f, i = choices['fajr'][j]['value'], choices['isha'][j]['value']
        asr = physical['events']['asr']['epochSeconds']
        chain = [f, physical['events']['sunrise']['epochSeconds']-MARGIN, physical['transitEpochSeconds']+300,
                 None if asr is None else asr+240, physical['events']['maghrib']['epochSeconds']+MARGIN, i]
        if any(v is None for v in chain) or not all(a < b for a,b in zip(chain,chain[1:])): failures.append('cycle-chronology')
        cycle_checks += 1
    counts = {e: {m: 0 for m in MODE} for e in ['fajr','isha']}
    rows = []
    for j, date in enumerate(labels[1:-1], 1):
        f, i = choices['fajr'][j], choices['isha'][j]
        counts['fajr'][f['mode']] += 1; counts['isha'][i['mode']] += 1
        rows.append([date, None if f['value'] is None else f['value']*1000, None if i['value'] is None else i['value']*1000,
                     MODE[f['mode']], MODE[i['mode']], f['weight'], i['weight'], candidates['fajr'][j]*1000, candidates['isha'][j]*1000])
    jumps = {}
    for event in ['fajr','isha']:
        available_indices = sorted(choices[event])
        records = []
        for a,b in zip(available_indices, available_indices[1:]):
            left,right = choices[event][a],choices[event][b]
            if left['value'] is None or right['value'] is None: continue
            p = (left['value']-solar[a]['transitEpochSeconds'])/MINUTE
            s = (right['value']-solar[b]['transitEpochSeconds'])/MINUTE
            records.append({'fromDate': labels[a], 'toDate': labels[b], 'signedChangeMinutes': s-p,
                            'absoluteChangeMinutes': abs(s-p), 'fromMode': left['mode'], 'toMode': right['mode']})
        jumps[event] = max(records,key=lambda r:r['absoluteChangeMinutes'])
    samples = []
    indices = {1, len(labels)-2, anchor, labels.index(f'{year}-06-21')}
    for gap in gap_preflight:
        for key in ['beforeDate','firstMissingDate','lastMissingDate','afterDate']:
            if gap[key] is not None: indices.add(labels.index(gap[key]))
    for j in sorted(indices):
        if j not in choices['fajr'] or j not in choices['isha']: continue
        samples.append({'date': labels[j], 'transitEpochMilliseconds': solar[j]['transitEpochSeconds']*1000,
                        'rawFajrEpochMilliseconds': None if solar[j]['events']['fajr']['epochSeconds'] is None else solar[j]['events']['fajr']['epochSeconds']*1000,
                        'rawIshaEpochMilliseconds': None if solar[j]['events']['isha']['epochSeconds'] is None else solar[j]['events']['isha']['epochSeconds']*1000})
    return {'status': 'blocked' if failures else 'available', 'reasonClass': sorted(set(failures)) or None,
            'q': q, 'anchorDate': labels[anchor], 'rows': rows if not failures else blocked_rows(owned), 'counts': counts,
            'gapPreflight': gap_preflight, 'paddingPreflight': padding_preflight, 'nightChecks': night_checks,
            'cycleChecks': cycle_checks, 'minimumIshaToNextFajrMinutes': minimum_night_gap / MINUTE,
            'maxDailyPhaseJumps': jumps, 'physicalSamples': samples}

def blend_checks():
    records = []
    for event in ['fajr','isha']:
        direction = 1 if event == 'fajr' else -1
        for distance in [-.001, 0, .001, BAND/2, BAND-.001, BAND, BAND+.001]:
            raw = direction * distance
            out = select(event, raw, 0)
            assert 0 <= out['weight'] <= 1
            assert min(raw, 0) <= out['value'] <= max(raw, 0)
            assert out['value'] >= 0 if event == 'fajr' else out['value'] <= 0
            if distance >= BAND: assert out['mode'] == 'ordinary' and out['value'] == raw
            elif distance <= 0: assert out['mode'] == 'night-fraction' and out['value'] == 0
            else: assert out['mode'] == 'transition'
            records.append({'event':event,'physicalEpochSeconds':raw,'candidateEpochSeconds':0,**out})
        assert select(event,None,0,True)['mode']=='night-fraction'
        assert select(event,None,0,False)['mode']=='unavailable'
    return records

if __name__ == '__main__':
    arithmetic = blend_checks()
    results = []
    for case in CASES:
        result = calculate_case(case)
        results.append({'input':case,'expected':result})
        print(json.dumps({'case':case['id'],'status':result['status'],'counts':result['counts']}),flush=True)
    output = {'schema':'independent-local-summer-oracle/v1','profile':'local-northern-seasonal-v1',
              'sourceCalendarData':False,'modeCodes':MODE,
              'rowColumns':['date','fajrSelectedEpochMilliseconds','ishaSelectedEpochMilliseconds','fajrModeCode','ishaModeCode','fajrWeight','ishaWeight','fajrCandidateEpochMilliseconds','ishaCandidateEpochMilliseconds'],
              'blendArithmetic':arithmetic,'caseCount':len(results),'cases':results}
    target=HERE/'summer-fixtures.json'; target.write_text(json.dumps(output,indent=2)+'\n')
