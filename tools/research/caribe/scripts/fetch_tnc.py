"""Fetch selected protected-area polygons from TNC 'Insular Caribbean Protected Areas 2025'
(compiled by TNC with submissions from Caribbean governments), simplified server-side.
Usage: python3 -I fetch_tnc.py <dl_dir>"""
import json, sys, urllib.parse, urllib.request, os

DL = sys.argv[1]
URL = "https://services.arcgis.com/F7DSX1DSNSiWmOqh/arcgis/rest/services/Caribbean_Protected_Areas_2023/FeatureServer/0/query"

def ids_from_attrs():
    d = json.load(open(os.path.join(DL, 'tnc_attrs.json')))
    return {f['attributes']['OBJECTID']: f['attributes'] for f in d['features']}

def fetch(ids):
    out = []
    for i in range(0, len(ids), 25):
        q = {
            'objectIds': ','.join(map(str, ids[i:i + 25])), 'outFields': 'OBJECTID,AREANAM,COUNTRY,DESGNTN,Rules',
            'returnGeometry': 'true', 'outSR': '4326', 'maxAllowableOffset': '0.0009', 'geometryPrecision': '5', 'f': 'geojson',
        }
        req = urllib.request.Request(URL + '?' + urllib.parse.urlencode(q))
        with urllib.request.urlopen(req, timeout=180) as r:
            fc = json.load(r)
        out += fc['features']
    return out

if __name__ == '__main__':
    sel = json.load(open(os.path.join(DL, 'tnc_select.json')))
    ids = sorted({int(k) for k in sel})
    feats = fetch(ids)
    json.dump({'type': 'FeatureCollection', 'features': feats}, open(os.path.join(DL, 'tnc_geoms.json'), 'w'))
    print(len(ids), 'requested', len(feats), 'received')
