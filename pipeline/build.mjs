// Mapesca daily data build.
// For each data region (areas.js REGIONS: Baja & Sea of Cortez, Pacific south,
// Gulf of Mexico & Caribbean) downloads today's satellite water temperature and
// chlorophyll from NOAA, scores every species with the shared model, closes
// no-take protected areas, and writes small static files to ./out/v1 that the
// app and mapesca.org read. Run by .github/workflows/data.yml twice a day and
// published as static files, so any number of users costs NOAA nothing extra.
//
//   node pipeline/build.mjs            → fetch from NOAA and build
//   node pipeline/build.mjs --offline  → reuse ./out/cache (for development)
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SPECIES, GROUPS, TIERS, scoreZones, coastGrid, reachFromPorts } from '../packages/model/zones.js';
import { prepareAreas, maskProtected } from '../packages/model/protected.js';
import { AREAS, REGIONS, COVERAGE } from '../packages/model/areas.js';
import { existsSync } from 'node:fs';
import { seasonFor, oceanOf } from '../packages/model/species-info.js';
import { INFO, LIMITS, LIMITS_SOURCE, SHARK_VEDA, NEVER_KEEP, closureFor, CLOSURES, JURIS, LIMITS_BY_J } from '../packages/model/species-info.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'out', 'v1');
const CACHE = join(ROOT, 'out', 'cache');
const readJson = async p => JSON.parse(await readFile(join(ROOT, p), 'utf8'));

const CW = 'https://coastwatch.noaa.gov/erddap/griddap';
// NOAA renamed the blended SST dataset on Nov 2, 2026; the old id stays as a fallback.
const SST_IDS = ['noaacwBLENDEDsstDNDaily', 'noaacwBLENDEDCsstDaily'];
const CHL_ID = 'noaacwNPPN20VIIRSDINEOFDaily';
// Next days: the Copernicus Marine ocean forecast, as already prepared for the
// Cabo Bite Map (public endpoint). TODO: fetch Copernicus directly with Mapesca's
// own (free) account so Mapesca depends on nothing else.
const OUTLOOK_URL = 'https://receipt-generator-phi-bice.vercel.app/api/bookings/outlook';
const UA = { 'User-Agent': 'Mapesca/0.1 (mapesca.org; free public fishing-zone map)' };

const q = s => encodeURIComponent(s).replace(/%3A/g, ':').replace(/%2C/g, ',');
const round = (v, d) => (v == null || !Number.isFinite(v) ? null : Math.round(v * 10 ** d) / 10 ** d);

async function erddap(url, tries = 3) {
  let last;
  for (let n = 0; n < tries; n++) {
    try {
      const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(90_000) });
      if (!r.ok) throw new Error(`HTTP ${r.status} ${url.split('?')[0]}`);
      return (await r.json()).table;
    } catch (e) { last = e; await new Promise(res => setTimeout(res, 5000 * (n + 1))); }
  }
  throw last;
}
/** ERDDAP table → { date, lat[] (north first), lon[], v[][] }. */
function toGrid(t, vname, digits) {
  const ix = n => t.columnNames.indexOf(n);
  const it = ix('time'), ila = ix('latitude'), ilo = ix('longitude'), iv = ix(vname);
  const lats = [...new Set(t.rows.map(r => r[ila]))].sort((a, b) => b - a);
  const lons = [...new Set(t.rows.map(r => r[ilo]))].sort((a, b) => a - b);
  const li = new Map(lats.map((x, i) => [x, i])), lo = new Map(lons.map((x, i) => [x, i]));
  const v = lats.map(() => lons.map(() => null));
  for (const r of t.rows) if (r[iv] != null && Number.isFinite(r[iv])) v[li.get(r[ila])][lo.get(r[ilo])] = round(r[iv], digits);
  return { date: t.rows[0] ? String(t.rows[0][it]).slice(0, 10) : null, lat: lats.map(x => round(x, 3)), lon: lons.map(x => round(x, 3)), v };
}
const latlon = b => `[(${b.s}):(${b.n})][(${b.w}):(${b.e})]`;
// Backup when NOAA's CoastWatch server is down (it returned 502 for hours on Nov 2
// and Nov 4, 2026): NASA JPL MUR SST from NOAA's other ERDDAP server, sampled
// every 5th 0.01° pixel = the same 0.05° grid.
const PFEG = 'https://coastwatch.pfeg.noaa.gov/erddap/griddap';
async function fetchSst(b) {
  const one = id => erddap(`${CW}/${id}.json?${q(`analysed_sst[(last)]${latlon(b)}`)}`, 2).then(t => toGrid(t, 'analysed_sst', 2));
  try { return await Promise.any(SST_IDS.map(one)); }
  catch {
    const t = await erddap(`${PFEG}/jplMURSST41.json?${q(`analysed_sst[(last)][(${b.s}):5:(${b.n})][(${b.w}):5:(${b.e})]`)}`);
    return { ...toGrid(t, 'analysed_sst', 2), source: 'NASA JPL MUR SST (backup)' };
  }
}
/** Last good published file for a region (when every satellite source fails). */
async function lastPublished(path) {
  try {
    const r = await fetch(`https://data.mapesca.org/v1/${path}`, { headers: UA, signal: AbortSignal.timeout(60_000) });
    return r.ok ? { ...(await r.json()), stale: true } : null;
  } catch { return null; }
}
async function fetchChl(b) {
  const t = await erddap(`${CW}/${CHL_ID}.json?${q(`chlor_a[(last)][(0.0)]${latlon(b)}`)}`);
  return toGrid(t, 'chlor_a', 3);
}

/** Grid of scores → compact file: row-major Int8 values, -1 = no data/land. */
function packDense(z) {
  const flat = [];
  for (const row of z.v) for (const x of row) flat.push(x == null ? -1 : x);
  return {
    kind: 'dense', cut: z.cut, nlat: z.lat.length, nlon: z.lon.length,
    lat0: z.lat[0], dlat: round(z.lat[1] - z.lat[0], 5), lon0: z.lon[0], dlon: round(z.lon[1] - z.lon[0], 5),
    v: flat,
  };
}
/** Coastal (inshore) grid is mostly empty → [row, col, score] for scored squares only. */
function packSparse(z) {
  const cells = [];
  z.v.forEach((row, i) => row.forEach((x, j) => { if (x != null) cells.push([i, j, x]); }));
  return {
    kind: 'sparse', cut: z.cut, nlat: z.lat.length, nlon: z.lon.length,
    lat0: z.lat[0], dlat: round(z.lat[1] - z.lat[0], 5), lon0: z.lon[0], dlon: round(z.lon[1] - z.lon[0], 5),
    cells,
  };
}

/** One data region: satellite → zones (website) + inputs for the phone. */
async function buildRegion(reg, dir, areas, now, offline) {
  const D = f => join(ROOT, 'packages/model/data', f);
  const files = { bathy: `bathy-${reg.k}.json`, coast: `bathy-${reg.k}-coast.json`, land: `land-${reg.k}.json` };
  if (!Object.values(files).every(f => existsSync(D(f)))) { console.warn(`${reg.k}: grids not built yet, skipped`); return null; }
  await mkdir(join(OUT, dir, 'zones'), { recursive: true });
  let sst, chl;
  const cache = n => join(CACHE, `${reg.k}-${n}.json`);
  if (offline) {
    sst = JSON.parse(await readFile(cache('sst'), 'utf8'));
    chl = await readFile(cache('chl'), 'utf8').then(JSON.parse, () => null);
  } else {
    const [s, c] = await Promise.allSettled([fetchSst(reg.box), fetchChl(reg.box)]);
    const last = (s.status !== 'fulfilled' || c.status !== 'fulfilled') ? await lastPublished(`${dir ? dir + '/' : ''}conditions.json`) : null;
    sst = s.status === 'fulfilled' ? s.value : last?.sst ? { ...last.sst, stale: true } : null;
    if (!sst) { console.warn(`${reg.k}: no water temperature (${s.reason?.message || s.reason}) and nothing published before, skipped`); return null; }
    // The model works without color, just less sharply; reuse the last published color if NOAA is down.
    chl = c.status === 'fulfilled' ? c.value : last?.chl ? { ...last.chl, stale: true } : null;
    if (c.status !== 'fulfilled') console.warn(`${reg.k}: chlorophyll unavailable (${c.reason?.message}), ${chl ? 'using the last published' : 'none'}`);
    if (sst.source || sst.stale) console.warn(`${reg.k}: water temperature from ${sst.stale ? 'the last published data' : sst.source}`);
    await writeFile(cache('sst'), JSON.stringify(sst));
    if (chl) await writeFile(cache('chl'), JSON.stringify(chl));
  }
  console.log(`${reg.k}: SST ${sst.date} (${sst.lat.length}×${sst.lon.length}), chlorophyll ${chl?.date ?? 'none'}`);
  const bathy = JSON.parse(await readFile(D(files.bathy), 'utf8'));
  const coast = coastGrid(JSON.parse(await readFile(D(files.coast), 'utf8')));
  const conditions = { sst, chl };
  // Website overview season: Baja uses the Los Cabos calendar; other regions their main season region.
  const overview = AREAS.find(a => a.d === reg.k && (a.big || a.r == null))?.r ?? null;
  const species = {};
  for (const sp of SPECIES) {
    const season = seasonFor(sp, overview);
    if (!season) continue; // not found in this region
    const inshore = sp.g === 'inshore';
    const z = scoreZones({ ...sp, season }, conditions, null, now, { bathy: inshore ? coast : bathy, reach: reachFromPorts });
    const closed = maskProtected(z, areas, sp.k);
    const vedaNow = !!closureFor(sp.k, now, overview);
    if (vedaNow) z.v = z.v.map(row => row.map(x => (x == null ? null : 0)));
    const counts = { elite: 0, priority: 0, candidate: 0 };
    for (const row of z.v) for (const x of row) { if (!x) continue; const t = TIERS.find(t => x >= z.cut[t.k]); if (t) counts[t.k]++; }
    const file = `${dir ? dir + '/' : ''}zones/${sp.k}.json`;
    await writeFile(join(OUT, file), JSON.stringify(inshore ? packSparse(z) : packDense(z)));
    species[sp.k] = { file, cut: z.cut, counts, seasonLevel: z.seasonLevel, closedByProtection: closed, closedSeason: vedaNow };
  }
  const pre = dir ? dir + '/' : '';
  await writeFile(join(OUT, `${pre}conditions.json`), JSON.stringify(conditions));
  for (const f of Object.values(files)) await copyFile(D(f), join(OUT, `${pre}${f}`));
  console.log(`${reg.k}: ${Object.keys(species).length} species`);
  return {
    k: reg.k, en: reg.en, es: reg.es, ocean: reg.ocean, box: reg.box,
    data: { sstDate: sst.date, chlDate: chl?.date ?? null, sstSource: sst.source || null, stale: !!(sst.stale || chl?.stale) },
    files: { conditions: `${pre}conditions.json`, bathy: `${pre}${files.bathy}`, coast: `${pre}${files.coast}`, land: `${pre}${files.land}` },
    species,
  };
}

async function main() {
  const offline = process.argv.includes('--offline');
  await mkdir(join(OUT, 'zones'), { recursive: true });
  await mkdir(CACHE, { recursive: true });
  const now = new Date();

  // Protected areas of every region in one file (small).
  const areasFc = await readJson('packages/model/data/protected-areas.json');
  for (const r of REGIONS) {
    const f = join(ROOT, `packages/model/data/protected-areas-${r.k}.json`);
    if (existsSync(f)) areasFc.features.push(...JSON.parse(await readFile(f, 'utf8')).features);
  }
  const areas = prepareAreas(areasFc);
  await writeFile(join(OUT, 'protected-areas.json'), JSON.stringify(areasFc));

  // Baja keeps its files at the top level (apps already installed read them there).
  const regions = [];
  for (const reg of REGIONS) {
    const out = await buildRegion(reg, reg.k === 'baja' ? '' : reg.k, areas, now, offline);
    if (out) regions.push(out);
  }
  const baja = regions.find(r => r.k === 'baja');
  if (!baja) throw new Error('Baja region failed: keeping the previous published data');

  let outlookOk = false;
  try {
    const r = await fetch(OUTLOOK_URL, { headers: UA, signal: AbortSignal.timeout(60_000) });
    const j = r.ok ? await r.json() : null;
    if (j?.ok && j.outlook?.sst?.dates?.length) { await writeFile(join(OUT, 'outlook.json'), JSON.stringify(j.outlook)); outlookOk = true; }
  } catch (e) { console.warn('outlook unavailable:', e.message); }
  console.log('outlook', outlookOk ? 'ok' : 'missing');

  // Species list: every species found in at least one region, with its info.
  const species = [];
  for (const sp of SPECIES) {
    // Listed if it lives in any area of a published region (zone files exist only for each region's overview).
    const where = regions.filter(r => r.species[sp.k] || AREAS.some(a => a.d === r.k && seasonFor(sp, a.r)));
    if (!where.length) continue;
    const info = INFO[sp.k] || {}, bz = baja.species[sp.k];
    const anyZ = bz || where.map(r => r.species[sp.k]).find(Boolean) || { file: null, cut: null, counts: { elite: 0, priority: 0, candidate: 0 }, seasonLevel: 0, closedSeason: false };
    species.push({
      k: sp.k, g: sp.g, en: sp.en, es: sp.es, ocean: oceanOf(sp.k), regions: where.map(r => r.k),
      // Top-level fields for apps already installed (Baja files):
      file: anyZ.file, cut: anyZ.cut, counts: anyZ.counts,
      seasonLevel: anyZ.seasonLevel, closedByProtection: bz?.closedByProtection ?? 0, closedSeason: anyZ.closedSeason,
      season: sp.season, spawn: info.spawn ?? null, spawnConfidence: info.conf ?? 'low', spawnSources: info.src ?? [],
      limit: info.limit ? LIMITS[info.limit] : LIMITS.general, reserved50nm: !!info.reserved50nm, beta: !!info.beta,
      // Outside Mexico: limits per jurisdiction (intl.js); the app picks the one of the area on screen.
      limits: Object.fromEntries(Object.entries(LIMITS_BY_J).filter(([, m]) => m[sp.k]).map(([j, m]) => [j, m[sp.k]])),
    });
    const c = anyZ.counts;
    console.log(`${sp.k.padEnd(22)} ${where.map(r => r.k).join(',').padEnd(18)} elite ${String(c.elite).padStart(5)}`);
  }
  const manifest = {
    version: 1,
    updatedAt: now.toISOString(),
    area: { name: 'Mexico: Pacific, Gulf of Mexico and Caribbean', box: COVERAGE },
    areas: AREAS,
    regions: regions.map(({ species: sp, ...r }) => ({ ...r, species: Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, v.file])) })),
    files: { ...baja.files, protected: 'protected-areas.json', outlook: outlookOk ? 'outlook.json' : null },
    data: baja.data,
    tiers: TIERS.map(t => ({ k: t.k, en: t.en, es: t.es, color: t.color })),
    groups: GROUPS.map(([k, en, es]) => ({ k, en, es })),
    species,
    notice: {
      en: 'Scores rate how well today\'s water fits each species. They are not a catch forecast. Check the weather and port status before going out, and follow protected-area rules.',
      es: 'La puntuación indica qué tan bien el agua de hoy le queda a cada especie. No es un pronóstico de captura. Revisa el clima y el estado del puerto antes de salir, y respeta las reglas de las áreas protegidas.',
    },
    rules: { source: LIMITS_SOURCE, sharkVeda: SHARK_VEDA, closures: CLOSURES, neverKeep: NEVER_KEEP, juris: JURIS,
      reserved50nm: { en: 'Billfish, dorado, roosterfish and tarpon are reserved for sport fishing within 50 nautical miles of the coast.', es: 'Picudos, dorado, pez gallo y sábalo están reservados a la pesca deportiva dentro de 50 millas náuticas de la costa.' },
      disclaimer: { en: 'Summary only. Official NOM and DOF texts always win; you need a valid sport-fishing license.', es: 'Solo es un resumen. Mandan los textos oficiales de las NOM y el DOF; necesitas un permiso de pesca deportiva vigente.' } },
    attribution: [
      'Water temperature: NOAA Geo-polar Blended SST (NOAA CoastWatch); backup: NASA JPL MUR SST',
      'Water color: NOAA VIIRS DINEOF chlorophyll-a (NOAA CoastWatch)',
      'Depth: NOAA NCEI ETOPO 2022 · Coastline: Natural Earth',
      'Protected areas: CONANP; DOF/SIDOF agreements; © OpenStreetMap contributors',
      'Next days: Copernicus Marine Service ocean forecast',
    ],
    by: ['Top Anglers Sportfishing Charters', 'Asociación Sudcaliforniana de Pesca Deportiva', 'Federación Nacional de Pesca Deportiva'],
  };
  await writeFile(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1));
  console.log(`Wrote ${species.length} species in ${regions.length} regions to out/v1`);
}

main().catch(e => { console.error(e); process.exit(1); });
