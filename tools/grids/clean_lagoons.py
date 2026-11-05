"""Remove water that isn't connected to the open sea from the depth grids.

ETOPO 2022 holds impossible depths inside some closed coastal lagoons (Laguna
Madre 108 m, Tamiahua 170 m, Tres Palos 440 m, Huizache-Caimanero 136 m…), and
the Pacific-south box crosses the Isthmus of Tehuantepec into Gulf water. Both
would score as offshore water. This keeps only water connected to the open sea:

  main grid  (0.025°): 4-connected flood fill from cells >= SEED_DEPTH m deep
                       that touch the open ocean of this region (the largest deep component).
  coast grid (30″):    8-connected flood fill from coast cells whose main-grid cell was kept.

Run after build_bathy.py:  python3 tools/grids/clean_lagoons.py packages/model/data baja pacsur golfo
"""
import json, sys
from collections import deque
from pathlib import Path

SEED_DEPTH = 200


def flood(n_i, n_j, ok, seeds, diag=False):
    seen = set(seeds)
    q = deque(seeds)
    steps = [(1, 0), (-1, 0), (0, 1), (0, -1)] + ([(1, 1), (1, -1), (-1, 1), (-1, -1)] if diag else [])
    while q:
        i, j = q.popleft()
        for di, dj in steps:
            a, b = i + di, j + dj
            if 0 <= a < n_i and 0 <= b < n_j and (a, b) not in seen and ok(a, b):
                seen.add((a, b)); q.append((a, b))
    return seen


def clean(d: Path, name: str):
    mp, cp = d / f'bathy-{name}.json', d / f'bathy-{name}-coast.json'
    m = json.loads(mp.read_text())
    D, R = m['depth'], m['relief']
    ni, nj = len(D), len(D[0])
    water = lambda i, j: D[i][j] is not None
    # Deep components; the open ocean of this region is the largest one.
    deep = {(i, j) for i in range(ni) for j in range(nj) if D[i][j] is not None and D[i][j] >= SEED_DEPTH}
    comps, left = [], set(deep)
    while left:
        s = left.pop()
        c = flood(ni, nj, lambda a, b: (a, b) in deep, [s])
        left -= c; comps.append(c)
    comps.sort(key=len, reverse=True)
    ocean = comps[0] if comps else set()
    keep = flood(ni, nj, water, list(ocean))
    removed_main = [(i, j, D[i][j]) for i in range(ni) for j in range(nj) if water(i, j) and (i, j) not in keep]
    for i, j, _ in removed_main:
        D[i][j] = None; R[i][j] = None
    mp.write_text(json.dumps(m, separators=(',', ':')))

    c = json.loads(cp.read_text())
    lat0, lon0 = m['lat'][0], m['lon'][0]
    dla, dlo = m['lat'][1] - m['lat'][0], m['lon'][1] - m['lon'][0]
    cells = {(ci, cj): k for k, (ci, cj, _, _) in enumerate(c['cells'])}

    def main_of(ci, cj):
        la = c['n'] - c['step'] * (ci + 0.5); lo = c['w'] + c['step'] * (cj + 0.5)
        return round((la - lat0) / dla), round((lo - lon0) / dlo)
    seeds = [k for k in cells if main_of(*k) in keep]
    ckeep = flood(c['nlat'], c['nlon'], lambda a, b: (a, b) in cells, seeds, diag=True)
    before = len(c['cells'])
    c['cells'] = [x for x in c['cells'] if (x[0], x[1]) in ckeep]
    cp.write_text(json.dumps(c, separators=(',', ':')))
    deepest = sorted(removed_main, key=lambda x: -x[2])[:5]
    print(f"{name}: main grid removed {len(removed_main)} cells (deepest: {[(round(m['lat'][i],2), round(m['lon'][j],2), dd) for i, j, dd in deepest]}); "
          f"coast grid removed {before - len(c['cells'])} of {before}")


if __name__ == '__main__':
    d = Path(sys.argv[1])
    for name in sys.argv[2:]:
        clean(d, name)
