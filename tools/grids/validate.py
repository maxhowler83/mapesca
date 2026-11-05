#!/usr/bin/env python3
"""Compare bathy-baja*.json against bathy-bcs*.json inside the old box and spot-check depths.
  python3 validate.py DATA_DIR"""
import json, sys
from pathlib import Path
import numpy as np
D = Path(sys.argv[1] if len(sys.argv) > 1 else 'packages/model/data')
A = lambda g, k: np.array([[np.nan if v is None else v for v in r] for r in g[k]], float)
new, old = json.loads((D / 'bathy-baja.json').read_text()), json.loads((D / 'bathy-bcs.json').read_text())
i0 = new['lat'].index(old['lat'][0]); j0 = new['lon'].index(old['lon'][0])
nd, od = A(new, 'depth')[i0:i0 + 232, j0:j0 + 256], A(old, 'depth')
nr, orr = A(new, 'relief')[i0:i0 + 232, j0:j0 + 256], A(old, 'relief')
assert new['lat'][i0:i0 + 232] == old['lat'] and new['lon'][j0:j0 + 256] == old['lon']
both = ~np.isnan(nd) & ~np.isnan(od)
print(f'old box: land/water agree {100 * (np.isnan(nd) == np.isnan(od)).mean():.3f}% of {od.size} cells; '
      f'depth median|diff| {np.median(np.abs(nd - od)[both]):.1f} m, exact {100 * (nd == od)[both].mean():.3f}%; '
      f'relief exact {100 * (nr == orr)[both].mean():.2f}% (mismatch cells on box edge: '
      f'{int(((nr != orr) & both)[[0, -1], :].sum() + ((nr != orr) & both)[:, [0, -1]].sum())} of {int(((nr != orr) & both).sum())})')
cn, co = json.loads((D / 'bathy-baja-coast.json').read_text()), json.loads((D / 'bathy-bcs-coast.json').read_text())
oi, oj = round((cn['n'] - co['n']) * 120), round((co['w'] - cn['w']) * 120)
newc = {(i - oi, j - oj): (d, r) for i, j, d, r in cn['cells'] if 0 <= i - oi < co['nlat'] and 0 <= j - oj < co['nlon']}
oldc = {(i, j): (d, r) for i, j, d, r in co['cells']}
ks = set(newc) & set(oldc)
print(f'coast old box: cells new {len(newc)} old {len(oldc)} common {len(ks)}; depth equal '
      f'{100 * np.mean([newc[k][0] == oldc[k][0] for k in ks]):.3f}%, relief equal {100 * np.mean([newc[k][1] == oldc[k][1] for k in ks]):.2f}%')

dep, lat, lon = A(new, 'depth'), np.array(new['lat']), np.array(new['lon'])
def at(la, lo):
    i, j = int(np.argmin(abs(lat - la))), int(np.argmin(abs(lon - lo))); v = dep[i, j]
    return 'land' if np.isnan(v) else int(v)
def area(s, n, w, e):
    m = (lat[:, None] >= s) & (lat[:, None] <= n) & (lon[None] >= w) & (lon[None] <= e)
    v = dep[m]; v = v[~np.isnan(v)]; return v
pts = [('Cabo San Lucas arch', 22.88, -109.90), ('5 nm S of Cabo', 22.79, -109.92), ('off Cabo 30 nm S', 22.38, -109.9),
       ('Gorda Banks', 23.03, -109.43), ('Bahia de los Angeles (bay)', 28.95, -113.52), ('Canal de Ballenas', 29.0, -113.33),
       ('Ensenada / Bahia Todos Santos', 31.82, -116.68), ('Islas Todos Santos (W of)', 31.80, -116.85), ('Isla Guadalupe centre', 29.05, -118.28),
       ('W of Isla Guadalupe 20 km', 29.05, -118.55), ('San Felipe offshore', 31.0, -114.75), ('Colorado delta', 31.7, -114.7),
       ('Guaymas Basin', 27.0, -111.4), ('Isla Tiburon', 29.0, -112.4), ('Canal del Infiernillo', 28.85, -112.2),
       ('Mazatlan offshore 10 km', 23.15, -106.5), ('Topolobampo approach', 25.55, -109.15), ('San Diego (US land)', 32.72, -117.1),
       ('Coronado Islands area', 32.42, -117.25), ('Sebastian Vizcaino bay', 28.3, -114.6), ('Pescadero Basin', 23.95, -108.85)]
for nm, la, lo in pts: print(f'  {nm:32s} {la:7.3f} {lo:9.3f}  {at(la, lo)}')
for s_ in (30.5, 31.0):
    v = area(s_, 32.75, -115.2, -112.6)
    print(f'upper Gulf N of {s_} (lon -115.2..-112.6): {v.size} water cells, <50 m {100 * (v < 50).mean():.1f}%, <100 m {100 * (v < 100).mean():.1f}%, max {int(v.max())} m')
print(f'whole grid: max depth {int(np.nanmax(dep))} m, water cells {int((~np.isnan(dep)).sum())} of {dep.size}')
