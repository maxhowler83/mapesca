"""Assemble protected-areas-caribe.json from TNC polygons + eCFR coordinate polygons.
Usage: python3 -I build_pa.py <dl_dir> <out_file>"""
import json, os, sys
from shapely.geometry import shape, mapping, Polygon, MultiPolygon, box
from shapely.validation import make_valid
from shapely.ops import unary_union

DL, OUT = sys.argv[1], sys.argv[2]
BOX = box(-85.2, 17.4, -64.2, 27.4)
TOL = 0.0009  # ~100 m

def dm(d, m):  # degrees + decimal minutes
    return d + m / 60

ECFR = 'https://www.ecfr.gov/current/title-50/chapter-VI/part-622'
FED = [
    # name, section, points (N lat, W long) as (deg, min), rule, note en/es
    ('Hind Bank Marine Conservation District', '622.514(a)(2)', [((18, 13.2), (65, 6.0)), ((18, 13.2), (64, 59.0)), ((18, 11.8), (64, 59.0)), ((18, 10.7), (65, 6.0))],
     'no-take', 'Federal no-take reserve: fishing for any species and anchoring by fishing vessels prohibited year-round.',
     'Reserva federal sin captura: prohibido pescar cualquier especie y anclar embarcaciones de pesca todo el año.'),
    ('Grammanik Bank', '622.514(a)(1)', [((18, 11.898), (64, 56.328)), ((18, 11.645), (64, 56.225)), ((18, 11.058), (64, 57.810)), ((18, 11.311), (64, 57.913))],
     'rules', 'Feb 1 – Apr 30: no fishing for or possession of any fish except highly migratory species (tunas, billfish, swordfish, sharks). Pots, traps, bottom longlines and nets banned year-round.',
     '1 feb – 30 abr: prohibido pescar o tener cualquier pez excepto especies altamente migratorias (atunes, picudos, pez espada, tiburones). Nasas, trampas, palangre de fondo y redes prohibidos todo el año.'),
    ('Mutton Snapper Spawning Aggregation Area (St. Croix)', '622.479(a)(1)', [((17, 37.8), (64, 53.0)), ((17, 39.0), (64, 53.0)), ((17, 39.0), (64, 50.5)), ((17, 38.1), (64, 50.5)), ((17, 37.8), (64, 52.5))],
     'rules', 'Mar 1 – Jun 30: all fishing prohibited. Pots, traps, bottom longlines and nets banned year-round.',
     '1 mar – 30 jun: prohibida toda pesca. Nasas, trampas, palangre de fondo y redes prohibidos todo el año.'),
    ('Red Hind Spawning Aggregation Area East of St. Croix (Lang Bank)', '622.479(a)(2)', [((17, 50.2), (64, 27.9)), ((17, 50.1), (64, 26.1)), ((17, 49.2), (64, 25.8)), ((17, 48.6), (64, 25.8)), ((17, 48.1), (64, 26.1)), ((17, 47.5), (64, 26.9))],
     'rules', 'Dec 1 – end of Feb: all fishing prohibited. Pots, traps, bottom longlines and nets banned year-round.',
     '1 dic – fin de feb: prohibida toda pesca. Nasas, trampas, palangre de fondo y redes prohibidos todo el año.'),
    ('Abrir La Sierra Bank', '622.439(a)(1)', [((18, 6.5), (67, 26.9)), ((18, 6.5), (67, 23.9)), ((18, 3.5), (67, 23.9)), ((18, 3.5), (67, 26.9))],
     'rules', 'Dec 1 – end of Feb: all fishing prohibited (red hind spawning). Pots, traps, bottom longlines and nets banned year-round.',
     '1 dic – fin de feb: prohibida toda pesca (desove de mero cabrilla). Nasas, trampas, palangre de fondo y redes prohibidos todo el año.'),
    ('Tourmaline Bank', '622.439(a)(2)', [((18, 11.2), (67, 22.4)), ((18, 11.2), (67, 19.2)), ((18, 8.2), (67, 19.2)), ((18, 8.2), (67, 22.4))],
     'rules', 'Dec 1 – end of Feb: all fishing prohibited in the federal part (red hind spawning). Pots, traps, bottom longlines and nets banned year-round.',
     '1 dic – fin de feb: prohibida toda pesca en la parte federal (desove de mero cabrilla). Nasas, trampas, palangre de fondo y redes prohibidos todo el año.'),
    ('Bajo de Sico', '622.439(a)(3)', [((18, 15.7), (67, 26.4)), ((18, 15.7), (67, 23.2)), ((18, 12.7), (67, 23.2)), ((18, 12.7), (67, 26.4))],
     'rules', 'Oct 1 – Mar 31: no fishing for or possession of reef fish (federal part); trolling for pelagics still allowed. Anchoring by fishing vessels banned year-round.',
     '1 oct – 31 mar: prohibido pescar o tener peces de arrecife (parte federal); se permite el curricán de pelágicos. Prohibido anclar embarcaciones de pesca todo el año.'),
]

def r5(geom):
    def ring(c): return [[round(x, 5), round(y, 5)] for x, y in c]
    def poly(p): return [ring(p.exterior.coords)] + [ring(i.coords) for i in p.interiors]
    if geom.geom_type == 'Polygon': return {'type': 'Polygon', 'coordinates': poly(geom)}
    return {'type': 'MultiPolygon', 'coordinates': [poly(p) for p in geom.geoms]}

def clean(g, tol):
    g = make_valid(g)
    g = g.intersection(BOX)
    polys = [p for p in (g.geoms if hasattr(g, 'geoms') else [g]) if p.geom_type == 'Polygon']
    g = unary_union(polys) if polys else None
    if g is None or g.is_empty: return None
    s = g.simplify(tol, preserve_topology=True)
    s = make_valid(s)
    polys = [p for p in (s.geoms if hasattr(s, 'geoms') else [s]) if p.geom_type == 'Polygon' and p.area > 1e-7]
    if not polys: return None
    s = polys[0] if len(polys) == 1 else MultiPolygon(polys)
    # round, then re-validate
    s2 = shape(r5(s))
    if not s2.is_valid:
        s2 = make_valid(s2)
        polys = [p for p in (s2.geoms if hasattr(s2, 'geoms') else [s2]) if p.geom_type == 'Polygon' and p.area > 1e-7]
        s2 = polys[0] if len(polys) == 1 else MultiPolygon(polys)
        s2 = shape(r5(s2))
    return s2

sel = json.load(open(os.path.join(DL, 'tnc_select.json')))
geo = json.load(open(os.path.join(DL, 'tnc_geoms.json')))
feats = []
for f in geo['features']:
    oid = str(f['properties']['OBJECTID'])
    s = sel[oid]
    if not f.get('geometry'): print('no geometry', oid, s['name']); continue
    tol = TOL if s['rule'] == 'no-take' or shape(f['geometry']).area < 0.5 else TOL * 2  # big 'rules' areas a bit coarser
    g = clean(shape(f['geometry']), tol)
    if g is None: print('empty after clean', oid, s['name']); continue
    feats.append({'type': 'Feature', 'properties': {'name': s['name'], 'category': s['category'], 'kind': s['kind'], 'rule': s['rule'],
                  'source': s['source'], 'conf': s['conf'], 'country': s['country'], 'note': s['note']}, 'geometry': r5(g)})

for name, sec, pts, rule, en, es in FED:
    ring = [(-dm(*lo), dm(*la)) for la, lo in pts]
    g = Polygon(ring)
    assert g.is_valid, name
    feats.append({'type': 'Feature', 'properties': {'name': name, 'category': 'Federal area closure (50 CFR ' + sec + ')',
                  'kind': 'no-take-reserve' if rule == 'no-take' else 'seasonal-closure', 'rule': rule,
                  'source': f'eCFR 50 CFR {sec} (read 2026-11-06, up to date as of 2026-11-02) · {ECFR}', 'conf': 'high',
                  'country': 'Puerto Rico' if '622.439' in sec else 'US Virgin Islands', 'note': {'en': en, 'es': es}}, 'geometry': r5(g)})

# no-take first, then by country/name (stable, readable)
feats.sort(key=lambda f: (f['properties']['rule'] != 'no-take', f['properties']['country'], f['properties']['name']))
fc = {'type': 'FeatureCollection', 'features': feats}
s = json.dumps(fc, ensure_ascii=False, separators=(',', ':'))
open(OUT, 'w').write(s)
bad = [f['properties']['name'] for f in feats if not shape(f['geometry']).is_valid]
closed = all(r[0] == r[-1] for f in feats for poly in ([f['geometry']['coordinates']] if f['geometry']['type'] == 'Polygon' else f['geometry']['coordinates']) for r in poly)
print(len(feats), 'features', len(s), 'bytes; invalid:', bad, 'rings closed:', closed)
