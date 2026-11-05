# Bathymetry and land grids

These scripts build the depth grids and land outlines in `packages/model/data/`:

| File | What it holds |
|---|---|
| `bathy-<name>.json` | Grid with 0.025° cells. Each cell has the median sea depth and the depth range (relief) within about 8 km |
| `bathy-<name>-coast.json` | Sparse grid with 30″ cells (about 0.9 km). It holds coastal water up to 150 m deep. Relief is the depth range within about 1 km |
| `land-<name>.json` | Land outlines from Natural Earth 1:10m, as outer rings of `[lon, lat]` points, clipped to the box plus 0.1° |

## Regions

| Name | Box (N, S, W, E) | Area | Main grid | Coast cells |
|---|---|---|---|---|
| `baja` (default) | 32.75, 22.0, -118.6, -105.4 | Baja California, both coasts, and the Gulf of California | 430×528 | 157,872 |
| `pacsur` | 23.2, 14.3, -107.5, -92.0 | Mexican Pacific from Mazatlán to the Guatemala border | 356×620 | 119,265 |
| `golfo` | 26.1, 17.8, -98.0, -86.3 | Gulf of Mexico and the Mexican Caribbean, Tamaulipas to Quintana Roo (Cozumel, Banco Chinchorro) | 332×468 | 283,598 |

The old BCS box was N 28.1, S 22.3, W -115.4, E -109.0. Built with `--no-pad`, these scripts recreate `bathy-bcs.json`, `bathy-bcs-coast.json` and `land-bcs.json` byte for byte.

Boxes overlap. `pacsur` crosses the Isthmus of Tehuantepec, so its box also holds the southern Gulf of Mexico (Bay of Campeche west of -92°, about 38,000 water cells). That water is not connected to the Pacific inside the grid. `golfo` covers the same water, so prefer `golfo` there. `pacsur` and `baja` overlap around Mazatlán, and `golfo` reaches into Belize waters south of Chinchorro.

## Rebuild

Needs Python 3 with numpy, scipy and shapely.

```sh
W=/tmp/grids-work            # any scratch dir
mkdir -p $W/ne && for f in ne_10m_land ne_10m_minor_islands; do
  curl -sSL -o $W/ne/$f.geojson https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/$f.geojson
done

# baja (the default box; ~35 MB of ETOPO)
python3 tools/grids/fetch_etopo.py $W                                # writes $W/etopo15_baja.npy
python3 tools/grids/build_bathy.py $W packages/model/data            # bathy-baja.json + bathy-baja-coast.json
python3 tools/grids/build_land.py  $W/ne packages/model/data/land-baja.json
python3 tools/grids/validate.py packages/model/data                  # compare with the BCS files and spot-check depths

# pacsur (~33 MB of ETOPO, tiles N15W120 N15W105 N30W120 N30W105)
BOX="23.2 14.3 -107.5 -92.0"
python3 tools/grids/fetch_etopo.py $W --box $BOX --name pacsur
python3 tools/grids/build_bathy.py $W packages/model/data --box $BOX --name pacsur
python3 tools/grids/build_land.py  $W/ne packages/model/data/land-pacsur.json --box $BOX

# golfo (~23 MB of ETOPO, tiles N30W105 N30W090)
BOX="26.1 17.8 -98.0 -86.3"
python3 tools/grids/fetch_etopo.py $W --box $BOX --name golfo
python3 tools/grids/build_bathy.py $W packages/model/data --box $BOX --name golfo
python3 tools/grids/build_land.py  $W/ne packages/model/data/land-golfo.json --box $BOX

python3 tools/grids/validate_regions.py packages/model/data          # spot-check depths, islands and sizes for pacsur and golfo
```

`fetch_etopo.py --box N S W E --name X` works out which ETOPO 15×15° tiles cover the box plus 0.1°, and joins them north to south and west to east. It writes `etopo15_X.npy`. `build_bathy.py --name X` reads `etopo15_X.npy` when that file exists, and otherwise reads `etopo15_baja.npy`, so the `bcs` build still reads the Baja subset. Use `--etopo` to choose the file yourself.

To recreate the old BCS files exactly:
`build_bathy.py $W OUT --box 28.1 22.3 -115.4 -109.0 --name bcs --no-pad`
and `build_land.py $W/ne OUT/land-bcs.json --box 28.1 22.3 -115.4 -109.0`.

## Rules

The docstring of each script has the full rules.

- **Main grid**: each cell is 6×6 ETOPO pixels. A cell is water when at least 18 of its 36 pixels are below 0 m. Depth is the median of the sea pixels, rounded half-to-even. Relief is the maximum minus the minimum sea depth in an 18×20 pixel window centred on the cell.
- **Coast grid**: each cell is 2×2 pixels. A cell is kept when at least 2 of its 4 pixels are sea and the median depth is 150 m or less. Depth is `max(1, round(median))`. Relief is taken over a 5×5 pixel window.
- **Land**: shapely `simplify(0.004, preserve_topology=True)` is applied to each clipped polygon. Only outer rings are kept, and coordinates are rounded to 4 decimals.
- **Edges**: the relief windows read real data up to 0.1° outside the box. The original BCS build clipped its windows at the box edge, so only relief on the outermost cells differs.

## Known limits of the source data

- **Coastal lagoons**: ETOPO 2022 puts false depths in some shallow lagoons. The rules keep these depths, because they treat any pixel below 0 m as sea. Cells affected:
  - Laguna Madre, Tamaulipas: about 60 cells inside Natural Earth land show more than 50 m.
  - Laguna de Tamiahua: up to 170 m.
  - The Tampico lagoons: up to 137 m.
  - Laguna de Tres Palos, Acapulco: 9 isolated cells of 300–440 m.
  - Laguna Superior, Laguna Inferior and Mar Muerto, Oaxaca/Chiapas: up to 74 m.
  - Huizache-Caimanero, Sinaloa, in `baja` already: up to 136 m.
- **Banco Chinchorro**: ETOPO mixes land and 100–200 m pixels across the reef bank. The main grid shows the lagoon at a median of about 60 m, but it is really only a few metres deep.
- **Small islands**: Natural Earth 1:10m leaves out small islands, so they are water in `land-*.json`. These include Isla Isabel, Islas Marietas, Isla Lobos and the Veracruz reef cays. Isla Mujeres is a coarse polygon of 7 points.
