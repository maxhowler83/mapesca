#!/usr/bin/env python3
"""Spot-check the pacsur and golfo grids: depths at known places, shelf statistics,
islands as land (land-<name>.json polygons and the main grid), and file sizes.
  python3 validate_regions.py DATA_DIR"""
import gzip, json, math, sys
from pathlib import Path
import numpy as np
from shapely.geometry import Point, Polygon

D = Path(sys.argv[1] if len(sys.argv) > 1 else 'packages/model/data')
A = lambda g, k: np.array([[np.nan if v is None else v for v in r] for r in g[k]], float)

def load(name):
    g = json.loads((D / f'bathy-{name}.json').read_text())
    c = json.loads((D / f'bathy-{name}-coast.json').read_text())
    land = [Polygon(r) for r in json.loads((D / f'land-{name}.json').read_text())]
    return g, A(g, 'depth'), A(g, 'relief'), np.array(g['lat']), np.array(g['lon']), c, land

def report(name, pts, areas, radii, islands):
    g, dep, rel, lat, lon, c, land = load(name)
    cd = {(i, j): d for i, j, d, _ in c['cells']}
    def at(la, lo):
        i, j = int(np.argmin(abs(lat - la))), int(np.argmin(abs(lon - lo))); v = dep[i, j]
        return 'land' if np.isnan(v) else int(v)
    def coast_at(la, lo):
        i, j = int((c['n'] - la) * 120), int((lo - c['w']) * 120)
        return cd.get((i, j), '-')
    on_land = lambda la, lo: any(p.contains(Point(lo, la)) for p in land)
    def area(s, n, w, e):
        m = (lat[:, None] >= s) & (lat[:, None] <= n) & (lon[None] >= w) & (lon[None] <= e)
        v = dep[m]; return v[~np.isnan(v)]
    print(f'== {name}: main {dep.shape[0]}x{dep.shape[1]}, water {int((~np.isnan(dep)).sum())}, max depth {int(np.nanmax(dep))} m; '
          f'coast cells {len(c["cells"])}; land rings {len(land)}')
    print(f'  {"place":38s} {"lat":>7s} {"lon":>9s}  main  coast  onLand')
    for nm, la, lo in pts:
        print(f'  {nm:38s} {la:7.3f} {lo:9.3f}  {str(at(la, lo)):>5s} {str(coast_at(la, lo)):>6s}  {on_land(la, lo)}')
    for nm, (s, n, w, e) in areas:
        v = area(s, n, w, e)
        print(f'  {nm}: {v.size} water cells, <50 m {100 * (v < 50).mean():.1f}%, <100 m {100 * (v < 100).mean():.1f}%, '
              f'<200 m {100 * (v < 200).mean():.1f}%, median {int(np.median(v))} m, max {int(v.max())} m')
    for nm, la, lo, km in radii:
        dy = km / 111.0; dx = km / (111.0 * math.cos(math.radians(la)))
        m = (abs(lat[:, None] - la) <= dy) & (abs(lon[None] - lo) <= dx)
        m &= ((lat[:, None] - la) / dy) ** 2 + ((lon[None] - lo) / dx) ** 2 <= 1
        v = dep[m]; v = v[~np.isnan(v)]
        i, j = np.unravel_index(np.nanargmax(np.where(m, dep, np.nan)), dep.shape)
        print(f'  max within {km} km of {nm}: {int(v.max())} m at {lat[i]:.3f}, {lon[j]:.3f}')
    for nm, la, lo in islands:
        print(f'  island {nm:24s} polygon {on_land(la, lo)}  main {at(la, lo)}')
    for f in (f'bathy-{name}.json', f'bathy-{name}-coast.json', f'land-{name}.json'):
        b = (D / f).read_bytes()
        print(f'  {f:26s} {len(b) / 1e6:6.2f} MB raw  {len(gzip.compress(b, 9)) / 1e6:6.2f} MB gzip')

report('pacsur',
    [('Mazatlan offshore 10 km', 23.15, -106.50), ('Bahia de Banderas centre', 20.65, -105.40),
     ('Puerto Vallarta (land)', 20.62, -105.22), ('Manzanillo 15 km offshore', 18.95, -104.45),
     ('Zihuatanejo 20 km offshore', 17.45, -101.70), ('Acapulco bay', 16.84, -99.88), ('Acapulco 60 km S', 16.30, -99.88),
     ('Middle America Trench off Acapulco', 16.00, -99.80), ('Puerto Escondido 5 km', 15.82, -97.07),
     ('Trench off Oaxaca', 15.20, -97.20), ('Huatulco 10 km', 15.65, -96.13), ('Gulf of Tehuantepec shelf', 15.80, -94.80),
     ('Salina Cruz 10 km', 16.08, -95.20), ('Puerto Chiapas 10 km', 14.62, -92.48), ('Guatemala City area (land)', 14.6, -92.1)],
    [('Gulf of Tehuantepec shelf (15.6-16.2N, -95.2..-94.0)', (15.6, 16.2, -95.2, -94.0)),
     ('Bahia de Banderas (20.5-20.8N, -105.7..-105.25)', (20.5, 20.8, -105.7, -105.25)),
     ('Gulf of Mexico water inside the pacsur box (N of 17.8, E of -98)', (17.8, 23.2, -98.0, -92.0))],
    [('Acapulco', 16.85, -99.90, 100), ('Puerto Escondido', 15.86, -97.07, 100), ('Huatulco', 15.75, -96.13, 100),
     ('Bahia de Banderas centre', 20.65, -105.45, 15)],
    [('Maria Madre', 21.62, -106.55), ('Maria Magdalena', 21.45, -106.42), ('Maria Cleofas', 21.31, -106.25),
     ('Isla Isabel', 21.845, -105.885), ('Islas Marietas', 20.70, -105.58)])

report('golfo',
    [('Laguna Madre (Tamaulipas)', 24.60, -97.65), ('Tampico 20 km offshore', 22.25, -97.65),
     ('Tuxpan 30 km offshore', 21.00, -97.10), ('Sistema Arrecifal Veracruzano', 19.18, -95.95),
     ('SAV Anegada de Afuera', 19.16, -95.86), ('Coatzacoalcos 20 km', 18.30, -94.45), ('Sigsbee Deep', 23.50, -93.00),
     ('Ciudad del Carmen (Isla del Carmen)', 18.64, -91.80), ('Campeche Bank mid-shelf', 21.80, -90.50),
     ('Arrecife Alacranes', 22.50, -89.70), ('Progreso 20 km', 21.45, -89.65), ('Campeche escarpment foot', 23.00, -92.40),
     ('Cozumel channel (W of Cozumel)', 20.45, -87.02), ('Cozumel channel S', 20.30, -87.05),
     ('E of Cozumel 10 km', 20.40, -86.65), ('E of Cozumel 25 km', 20.40, -86.50), ('Cancun 10 km E', 21.15, -86.65),
     ('Banco Chinchorro lagoon', 18.60, -87.35), ('W of Chinchorro (channel)', 18.60, -87.55),
     ('E of Chinchorro', 18.60, -87.10), ('Holbox', 21.55, -87.30), ('Merida (land)', 20.97, -89.62)],
    [('Campeche Bank N of Yucatan (21.5-23.5N, -91..-87.5)', (21.5, 23.5, -91.0, -87.5)),
     ('Sistema Arrecifal Veracruzano box (19.0-19.3N, -96.1..-95.7)', (19.0, 19.3, -96.1, -95.7)),
     ('Cozumel channel (20.2-20.6N, -87.1..-86.95)', (20.2, 20.6, -87.1, -86.95)),
     ('E of Cozumel (20.2-20.6N, -86.75..-86.3)', (20.2, 20.6, -86.75, -86.3))],
    [('Cozumel W coast', 20.45, -86.98, 20), ('Cozumel E coast', 20.40, -86.75, 40)],
    [('Isla Cozumel', 20.42, -86.92), ('Isla Mujeres', 21.235, -86.735), ('Isla del Carmen', 18.64, -91.80),
     ('Isla Contoy', 21.50, -86.80), ('Isla Holbox', 21.55, -87.25), ('Cayo Centro (Chinchorro)', 18.58, -87.32),
     ('Isla Arena', 20.70, -90.45), ('Isla Lobos (Veracruz)', 21.465, -97.225)])
