"""Reproduce the published Awqaf February 2027 comparison from original PDFs.

Usage: python3 score-february-2027.py /path/to/downloaded/pdfs
Requires pdfplumber. No network calls or institutional PDF redistribution.
"""
import argparse
import datetime as dt
import hashlib
import json
import re
from collections import Counter
from pathlib import Path
from zoneinfo import ZoneInfo

import pdfplumber

HERE = Path(__file__).resolve().parent
EVENTS = ('fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha')
ROW = re.compile(r'^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday) '
                 r'(\d{1,2}/\d{1,2}/2027) (\S+) ((?:\d\d:\d\d [AP]M ?){6})$', re.M)


def parse_pdf(directory, source):
    file = directory / f"awqaf-{source['city']}-2027-02.pdf"
    assert hashlib.sha256(file.read_bytes()).hexdigest() == source['pdfSha256'], file
    with pdfplumber.open(file) as pdf:
        assert len(pdf.pages) == 1, file
        text = pdf.pages[0].extract_text() or ''
    assert 'Day Date Hijri Date Fajr Shurooq Duhur Asr Maghrib Isha' in text
    rows = {}
    for match in ROW.finditer(text):
        date = dt.datetime.strptime(match[2], '%m/%d/%Y').date()
        assert date.strftime('%A') == match[1]
        clocks = re.findall(r'(\d\d:\d\d) ([AP]M)', match[4])
        assert len(clocks) == len(EVENTS)
        times = [dt.datetime.strptime(f'{clock} {ap}', '%I:%M %p').strftime('%H:%M')
                 for clock, ap in clocks]
        assert times == sorted(times)
        assert date.isoformat() not in rows
        rows[date.isoformat()] = dict(zip(EVENTS, times))
    assert list(rows) == [f'2027-02-{d:02d}' for d in range(1, 29)], (file, len(rows))
    return rows


def minutes(clock):
    hour, minute = map(int, clock.split(':'))
    return hour * 60 + minute


def metrics(cells, model):
    deltas = [c[model] for c in cells]
    return {
        'n': len(deltas),
        'exact': sum(x == 0 for x in deltas),
        'within1': sum(abs(x) <= 1 for x in deltas),
        'max': max(map(abs, deltas)),
        'signedMinutes': {str(delta): count for delta, count in sorted(Counter(deltas).items())},
    }


def score(directory):
    summary = json.loads((HERE / 'own-ray-feb-2027-summary.json').read_text())
    forecast_file = HERE / summary['forecastFile']
    assert hashlib.sha256(forecast_file.read_bytes()).hexdigest() == summary['forecastSha256']
    forecast = json.loads(forecast_file.read_text())
    assert len(forecast['rows']) == 84
    sources = {s['city']: s for s in summary['sources']}
    assert set(sources) == {'abu-dhabi', 'al-ain', 'zayed-city'}
    refs = {city: parse_pdf(directory, s) for city, s in sources.items()}
    cells = []
    for row in forecast['rows']:
        city, date = row['city'], row['date']
        assert row['websiteCityId'] == sources[city]['websiteCityId']
        for event in EVENTS:
            reference = refs[city][date][event]
            cell = {'city': city, 'event': event}
            for model in ('v2', 'ownRay'):
                prediction = row['models'][model]['events'][event]
                local = dt.datetime.fromisoformat(prediction['utc'].replace('Z', '+00:00')).astimezone(ZoneInfo('Asia/Dubai'))
                assert local.date().isoformat() == date == prediction['date']
                assert local.strftime('%H:%M') == prediction['time']
                cell[model] = minutes(prediction['time']) - minutes(reference)
            cells.append(cell)
    assert len(cells) == summary['comparedFields'] == 504
    totals = {model: metrics(cells, model) for model in ('v2', 'ownRay')}
    groups = {}
    for city in sources:
        for event in EVENTS:
            selected = [c for c in cells if c['city'] == city and c['event'] == event]
            groups[f'{city}/{event}'] = {model: metrics(selected, model) for model in ('v2', 'ownRay')}
    corrected = sum(abs(c['ownRay']) < abs(c['v2']) for c in cells)
    regressed = sum(abs(c['ownRay']) > abs(c['v2']) for c in cells)
    gains = sum(c['v2'] != 0 and c['ownRay'] == 0 for c in cells)
    losses = sum(c['v2'] == 0 and c['ownRay'] != 0 for c in cells)
    assert totals == summary['totals']
    assert groups == summary['cityEventGroups']
    assert (corrected, regressed, gains, losses) == (
        summary['correctedCount'], summary['regressedCount'], summary['exactGains'], summary['exactLosses'])
    assert all(g['ownRay']['exact'] >= g['v2']['exact'] and
               g['ownRay']['within1'] >= g['v2']['within1'] for g in groups.values())
    return {'fields': len(cells), 'totals': totals, 'corrected': corrected,
            'regressed': regressed, 'exactGains': gains, 'exactLosses': losses,
            'all18GroupsPass': True}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('pdf_directory', type=Path)
    print(json.dumps(score(parser.parse_args().pdf_directory), indent=2))
