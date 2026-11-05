# Mapesca

Free daily fishing-zone map for everyone, forever — iOS, Android and mapesca.org.
A joint work of Top Anglers Sportfishing Charters, the Asociación Sudcaliforniana
de Pesca Deportiva and the Federación Nacional de Pesca Deportiva. Companion to
edupesca.org. Born from the Cabo Bite Map on topanglerscharters.com.

## How it works

```
NOAA satellites ──► pipeline/build.mjs (GitHub Actions, twice a day)
                      │  scores 21 species with packages/model
                      │  closes no-take protected areas (Cabo Pulmo, Revillagigedo)
                      ▼
              data.mapesca.org/v1  (static files on GitHub Pages — free, no keys)
                      │
          ┌───────────┴───────────┐
   app/ (Expo: iOS + Android)   mapesca.org (website, later)
```

- **packages/model**: the zone model (copy of the Bite Map's `zones.js`) plus
  protected areas. One source of truth for the app, the site and the pipeline.
- **pipeline**: `node pipeline/build.mjs` fetches NOAA data and writes `out/v1`.
- **app**: Expo (React Native) app with MapLibre and free OpenFreeMap tiles.
  Needs a development build (MapLibre is native code), not Expo Go.

Scores rate how well today's water fits each species. They are **not** a catch
forecast and haven't been calibrated against catches yet.

## Data and credits
NOAA CoastWatch (Geo-polar Blended SST, VIIRS DINEOF chlorophyll-a), NOAA NCEI
ETOPO 2022, CONANP protected areas (via the dafishr package, MIT),
© OpenStreetMap contributors / OpenFreeMap.
