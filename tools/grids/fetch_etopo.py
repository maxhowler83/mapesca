#!/usr/bin/env python3
"""Download the ETOPO 2022 15" surface-elevation subset for the Baja box (plus a
0.1 deg pad for edge relief) from NOAA NCEI THREDDS via OPeNDAP, and save it as
a single north-up float32 .npy with its georeference.

Usage: python3 fetch_etopo.py OUT_DIR
Writes OUT_DIR/etopo15_baja.npy and OUT_DIR/etopo15_baja.json
"""
import json, struct, sys, urllib.request
from pathlib import Path
import numpy as np

BASE = 'https://www.ngdc.noaa.gov/thredds/dodsC/global/ETOPO2022/15s/15s_surface_elev_netcdf/'
PX = 240                       # pixels per degree (15 arc-seconds)
S, N, W, E = 22.0, 32.75, -118.6, -105.4
PAD = 0.1
s, n, w, e = S - PAD, N + PAD, W - PAD, E + PAD
# Tiles are 15x15 deg named by NW corner; lat ascending, lon ascending, pixel-is-area.
TILES = [('N30W120', 15.0, -120.0), ('N45W120', 30.0, -120.0)]

def fetch(tile, r0, r1, c0, c1):
    url = f'{BASE}ETOPO_2022_v1_15s_{tile}_surface.nc.dods?z.z[{r0}:1:{r1 - 1}][{c0}:1:{c1 - 1}]'
    print('GET', url, file=sys.stderr)
    raw = urllib.request.urlopen(url, timeout=600).read()
    k = raw.index(b'\nData:\n') + 7
    n1, n2 = struct.unpack('>II', raw[k:k + 8])
    assert n1 == n2 == (r1 - r0) * (c1 - c0), (n1, n2)
    a = np.frombuffer(raw[k + 8:k + 8 + 4 * n1], dtype='>f4').astype(np.float32)
    return a.reshape(r1 - r0, c1 - c0)

def main(out):
    out = Path(out); out.mkdir(parents=True, exist_ok=True)
    parts = []
    for tile, lat0, lon0 in TILES:
        lo, hi = max(s, lat0), min(n, lat0 + 15)
        if lo >= hi: continue
        r0, r1 = round((lo - lat0) * PX), round((hi - lat0) * PX)
        c0, c1 = round((w - lon0) * PX), round((e - lon0) * PX)
        parts.append(fetch(tile, r0, r1, c0, c1))
    z = np.concatenate(parts, axis=0)[::-1].copy()   # south->north  =>  north-up
    assert z.shape == (round((n - s) * PX), round((e - w) * PX)), z.shape
    np.save(out / 'etopo15_baja.npy', z)
    (out / 'etopo15_baja.json').write_text(json.dumps({'n': n, 's': s, 'w': w, 'e': e, 'px_per_deg': PX,
        'source': 'NOAA NCEI ETOPO 2022 v1 15s surface elevation (THREDDS OPeNDAP)'}))
    print(z.shape, float(np.nanmin(z)), float(np.nanmax(z)), file=sys.stderr)

if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'work')
