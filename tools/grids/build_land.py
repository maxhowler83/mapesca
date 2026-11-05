#!/usr/bin/env python3
"""Build land-<name>.json: Natural Earth 1:10m land + minor islands, clipped to the box
padded by 0.1 deg, simplified (Douglas-Peucker, 0.004 deg, topology-preserving), outer
rings only, [lon, lat] rounded to 4 decimals. Reproduces land-bcs.json exactly for the
old box.

  python3 build_land.py NE_DIR OUT_FILE [--box N S W E]
NE_DIR must hold ne_10m_land.geojson and ne_10m_minor_islands.geojson from
https://github.com/nvkelso/natural-earth-vector (geojson/ folder).
"""
import argparse, json, sys
from pathlib import Path
from shapely.geometry import shape, box
from shapely import get_parts

PAD, TOL = 0.1, 0.004

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('ne'); ap.add_argument('out')
    ap.add_argument('--box', nargs=4, type=float, metavar=('N', 'S', 'W', 'E'), default=[32.75, 22.0, -118.6, -105.4])
    a = ap.parse_args()
    N, S, W, E = a.box
    B = box(W - PAD, S - PAD, E + PAD, N + PAD)
    rings, holes = [], 0
    for f in ['ne_10m_land.geojson', 'ne_10m_minor_islands.geojson']:
        for ft in json.loads((Path(a.ne) / f).read_text())['features']:
            s = shape(ft['geometry'])
            if not s.intersects(B): continue
            for p in get_parts(s.intersection(B)):
                if p.geom_type != 'Polygon': continue
                for q in get_parts(p.simplify(TOL, preserve_topology=True)):
                    holes += len(q.interiors)
                    rings.append([[round(x, 4), round(y, 4)] for x, y in q.exterior.coords])
    Path(a.out).write_text(json.dumps(rings, separators=(',', ':')))
    print(f'{len(rings)} rings, {sum(map(len, rings))} points, {holes} holes dropped', file=sys.stderr)

if __name__ == '__main__':
    main()
