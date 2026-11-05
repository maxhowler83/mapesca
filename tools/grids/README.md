# Bathymetry and land grids

These scripts build the depth grids and land outlines in `packages/model/data/`:

| File | What it holds |
|---|---|
| `bathy-<name>.json` | Grid with 0.025° cells. Each cell has the median sea depth and the depth range (relief) within about 8 km |
| `bathy-<name>-coast.json` | Sparse grid with 30″ cells (about 0.9 km). It holds coastal water up to 150 m deep. Relief is the depth range within about 1 km |
| `land-<name>.json` | Land outlines from Natural Earth 1:10m, as outer rings of `[lon, lat]` points, clipped to the box plus 0.1° |

By default the box is lat 22.0 to 32.75 and lon -118.6 to -105.4 (`baja`). The old BCS box was N 28.1, S 22.3, W -115.4, E -109.0. Built with `--no-pad`, these scripts recreate `bathy-bcs.json`, `bathy-bcs-coast.json` and `land-bcs.json` byte for byte.

## Rebuild

Needs Python 3 with numpy, scipy and shapely.

```sh
W=/tmp/grids-work            # any scratch dir
python3 tools/grids/fetch_etopo.py $W          # ETOPO 2022 15" subset via NCEI THREDDS OPeNDAP (~35 MB)
mkdir -p $W/ne && for f in ne_10m_land ne_10m_minor_islands; do
  curl -sSL -o $W/ne/$f.geojson https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/$f.geojson
done
python3 tools/grids/build_bathy.py $W packages/model/data            # bathy-baja.json + bathy-baja-coast.json
python3 tools/grids/build_land.py  $W/ne packages/model/data/land-baja.json
python3 tools/grids/validate.py packages/model/data                  # compare with the BCS files and spot-check depths
```

To recreate the old BCS files exactly:
`build_bathy.py $W OUT --box 28.1 22.3 -115.4 -109.0 --name bcs --no-pad`
and `build_land.py $W/ne OUT/land-bcs.json --box 28.1 22.3 -115.4 -109.0`.

`fetch_etopo.py` only covers the Baja box plus 0.1°. For a box outside that area, edit `S N W E` and `TILES` in the script.

## Rules

The docstring of each script has the full rules.

- **Main grid**: each cell is 6×6 ETOPO pixels. A cell is water when at least 18 of its 36 pixels are below 0 m. Depth is the median of the sea pixels, rounded half-to-even. Relief is the maximum minus the minimum sea depth in an 18×20 pixel window centred on the cell.
- **Coast grid**: each cell is 2×2 pixels. A cell is kept when at least 2 of its 4 pixels are sea and the median depth is 150 m or less. Depth is `max(1, round(median))`. Relief is taken over a 5×5 pixel window.
- **Land**: shapely `simplify(0.004, preserve_topology=True)` is applied to each clipped polygon. Only outer rings are kept, and coordinates are rounded to 4 decimals.
- **Edges**: the relief windows read real data up to 0.1° outside the box. The original BCS build clipped its windows at the box edge, so only relief on the outermost cells differs.
