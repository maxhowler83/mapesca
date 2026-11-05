#!/usr/bin/env python3
"""Build the Mapesca bathymetry grids from the ETOPO 2022 15" subset made by fetch_etopo.py.

  python3 build_bathy.py WORK_DIR OUT_DIR [--box N S W E] [--name baja] [--etopo baja] [--no-pad]

Writes OUT_DIR/bathy-<name>.json and OUT_DIR/bathy-<name>-coast.json.

Rules (reverse-engineered from bathy-bcs*.json; interior cells reproduce them exactly):
 main grid, 0.025 deg = 6x6 ETOPO pixels:
   water  if >= 18 of the 36 pixels are below 0 m
   depth  = median of the sea pixels (positive m, float64), rounded half-to-even; null on land
   relief = max - min sea depth over an 18 (lat) x 20 (lon) pixel window centred on the
            cell (~8 km), rounded; null on land
 coast grid, 1/120 deg = 2x2 pixels, sparse:
   kept   if >= 2 of 4 pixels are sea and the (unrounded) median depth <= 150 m
   depth  = max(1, round(median)); relief = max - min sea depth over a 5x5 pixel window
            (~1 km) centred on the cell
The windows use real data beyond the box edge (fetch_etopo.py adds a 0.1 deg pad); --no-pad
clips at the box like the original BCS build did (only edge cells differ).
"""
import argparse, json
from pathlib import Path
import numpy as np
from scipy import ndimage as ndi

MAIN_SRC = 'NOAA NCEI ETOPO 2022 15 arc-second (public domain), median sea depth per 0.025° cell; relief = depth range within ~8 km'
COAST_SRC = ('NOAA NCEI ETOPO 2022 15 arc-second (public domain): coastal water up to 150 m deep on a 30 arc-second '
             '(~0.9 km) grid; median sea depth per cell; relief = depth range within ~1 km. Used for inshore species.')
PX = 240

def blocks(a, f):
    h, w = a.shape[0] // f, a.shape[1] // f
    return a[:h * f, :w * f].reshape(h, f, w, f).transpose(0, 2, 1, 3).reshape(h, w, f * f)

def sea_median(b):
    sea = b < 0
    with np.errstate(all='ignore'):
        import warnings
        with warnings.catch_warnings():
            warnings.simplefilter('ignore')
            med = np.nanmedian(np.where(sea, -b.astype(np.float64), np.nan), axis=-1)
    return sea.sum(-1), med

def relief_at(z, size, rows, cols):
    sea = z < 0; d = -z.astype(np.float64)
    mx = ndi.maximum_filter(np.where(sea, d, -1e9), size=size)
    mn = ndi.minimum_filter(np.where(sea, d, 1e9), size=size)
    return np.round((mx - mn)[np.ix_(rows, cols)])

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('work'); ap.add_argument('out')
    ap.add_argument('--box', nargs=4, type=float, metavar=('N', 'S', 'W', 'E'), default=[32.75, 22.0, -118.6, -105.4])
    ap.add_argument('--name', default='baja')
    ap.add_argument('--etopo', help='subset made by fetch_etopo.py --name X (default: <name> if '
                    'WORK_DIR/etopo15_<name>.npy exists, else baja)')
    ap.add_argument('--no-pad', action='store_true')
    a = ap.parse_args()
    N, S, W, E = a.box
    work, out = Path(a.work), Path(a.out); out.mkdir(parents=True, exist_ok=True)
    src = a.etopo or (a.name if (work / f'etopo15_{a.name}.npy').exists() else 'baja')
    z = np.load(work / f'etopo15_{src}.npy'); g = json.loads((work / f'etopo15_{src}.json').read_text())
    r0, c0 = round((g['n'] - N) * PX), round((W - g['w']) * PX)
    H, Wd = round((N - S) * PX), round((E - W) * PX)
    assert r0 >= 0 and c0 >= 0 and r0 + H <= z.shape[0] and c0 + Wd <= z.shape[1], 'box outside downloaded data'
    box = z[r0:r0 + H, c0:c0 + Wd]
    if a.no_pad: z, r0, c0 = box, 0, 0

    # main 0.025 deg grid
    nlat, nlon = H // 6, Wd // 6
    cnt, med = sea_median(blocks(box, 6))
    water = cnt >= 18
    rel = relief_at(z, (18, 20), r0 + 6 * np.arange(nlat) + 3, c0 + 6 * np.arange(nlon) + 3)
    dep = np.round(med)
    lat = [round(N - 0.025 * (i + 0.5), 4) for i in range(nlat)]
    lon = [round(W + 0.025 * (j + 0.5), 4) for j in range(nlon)]
    depth = [[int(dep[i, j]) if water[i, j] else None for j in range(nlon)] for i in range(nlat)]
    relief = [[int(rel[i, j]) if water[i, j] else None for j in range(nlon)] for i in range(nlat)]
    (out / f'bathy-{a.name}.json').write_text(json.dumps(
        {'source': MAIN_SRC, 'lat': lat, 'lon': lon, 'depth': depth, 'relief': relief}, separators=(',', ':')))

    # sparse coastal 30" grid
    cl, cw = H // 2, Wd // 2
    cnt, med = sea_median(blocks(box, 2))
    keep = (cnt >= 2) & (med <= 150)
    rel = relief_at(z, 5, r0 + 2 * np.arange(cl) + 1, c0 + 2 * np.arange(cw) + 1)
    ii, jj = np.nonzero(keep)
    cells = [[int(i), int(j), int(max(1, np.round(med[i, j]))), int(rel[i, j])] for i, j in zip(ii, jj)]
    (out / f'bathy-{a.name}-coast.json').write_text(json.dumps(
        {'source': COAST_SRC, 'n': N, 'w': W, 'step': 1 / 120, 'nlat': cl, 'nlon': cw, 'cells': cells}, separators=(',', ':')))
    print(f'main {nlat}x{nlon}, water {int(water.sum())}; coast {cl}x{cw}, cells {len(cells)}')

if __name__ == '__main__':
    main()
