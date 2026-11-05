#!/usr/bin/env python3
"""Download an ETOPO 2022 15" surface-elevation subset for a box (plus a 0.1 deg pad for
edge relief) from NOAA NCEI THREDDS via OPeNDAP, and save it as a single north-up float32
.npy with its georeference.

Usage: python3 fetch_etopo.py OUT_DIR [--box N S W E] [--name baja]
Writes OUT_DIR/etopo15_<name>.npy and OUT_DIR/etopo15_<name>.json.
Default box is Baja (N 32.75, S 22.0, W -118.6, E -105.4); the 15x15 deg source tiles
covering the padded box are worked out from it.
"""
import argparse, json, math, struct, sys, urllib.request
from pathlib import Path
import numpy as np

BASE = 'https://www.ngdc.noaa.gov/thredds/dodsC/global/ETOPO2022/15s/15s_surface_elev_netcdf/'
PX = 240                       # pixels per degree (15 arc-seconds)
PAD = 0.1

def tile_name(lat_top, lon_left):
    # Tiles are 15x15 deg named by their NW corner, e.g. N30W120 covers lat 15..30, lon -120..-105.
    ns = f"{'N' if lat_top >= 0 else 'S'}{abs(lat_top):02d}"
    ew = f"{'E' if lon_left >= 0 else 'W'}{abs(lon_left):03d}"
    return ns + ew

def fetch(tile, r0, r1, c0, c1):
    url = f'{BASE}ETOPO_2022_v1_15s_{tile}_surface.nc.dods?z.z[{r0}:1:{r1 - 1}][{c0}:1:{c1 - 1}]'
    print('GET', url, file=sys.stderr)
    raw = urllib.request.urlopen(url, timeout=600).read()
    k = raw.index(b'\nData:\n') + 7
    n1, n2 = struct.unpack('>II', raw[k:k + 8])
    assert n1 == n2 == (r1 - r0) * (c1 - c0), (n1, n2)
    a = np.frombuffer(raw[k + 8:k + 8 + 4 * n1], dtype='>f4').astype(np.float32)
    return a.reshape(r1 - r0, c1 - c0)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('out', nargs='?', default='work')
    ap.add_argument('--box', nargs=4, type=float, metavar=('N', 'S', 'W', 'E'), default=[32.75, 22.0, -118.6, -105.4])
    ap.add_argument('--name', default='baja')
    a = ap.parse_args()
    N, S, W, E = a.box
    s, n, w, e = S - PAD, N + PAD, W - PAD, E + PAD
    out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
    # Tile rows (south edges) and columns (west edges) touching the padded box.
    lat0s = range(int(math.floor(s / 15)) * 15, int(math.ceil(n / 15)) * 15, 15)
    lon0s = range(int(math.floor(w / 15)) * 15, int(math.ceil(e / 15)) * 15, 15)
    rows = []                  # lat ascending (tiles are stored south->north, pixel-is-area)
    for lat0 in lat0s:
        lo, hi = max(s, lat0), min(n, lat0 + 15)
        if lo >= hi: continue
        r0, r1 = round((lo - lat0) * PX), round((hi - lat0) * PX)
        cols = []
        for lon0 in lon0s:
            l, r = max(w, lon0), min(e, lon0 + 15)
            if l >= r: continue
            c0, c1 = round((l - lon0) * PX), round((r - lon0) * PX)
            cols.append(fetch(tile_name(lat0 + 15, lon0), r0, r1, c0, c1))
        rows.append(np.concatenate(cols, axis=1))
    z = np.concatenate(rows, axis=0)[::-1].copy()   # south->north  =>  north-up
    assert z.shape == (round((n - s) * PX), round((e - w) * PX)), z.shape
    np.save(out / f'etopo15_{a.name}.npy', z)
    (out / f'etopo15_{a.name}.json').write_text(json.dumps({'n': n, 's': s, 'w': w, 'e': e, 'px_per_deg': PX,
        'source': 'NOAA NCEI ETOPO 2022 v1 15s surface elevation (THREDDS OPeNDAP)'}))
    print(z.shape, float(np.nanmin(z)), float(np.nanmax(z)), file=sys.stderr)

if __name__ == '__main__':
    main()
