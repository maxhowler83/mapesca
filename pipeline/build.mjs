// Mapesca daily data build.
// Downloads today's satellite water temperature and chlorophyll for Baja
// California Sur from NOAA, scores every species with the shared model, closes
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
import { AREAS } from '../packages/model/areas.js';
import { seasonFor } from '../packages/model/species-info.js';
import { INFO, LIMITS, LIMITS_SOURCE, SHARK_VEDA, NEVER_KEEP, isClosed } from '../packages/model/species-info.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'out', 'v1');
const CACHE = join(ROOT, 'out', 'cache');
const readJson = async p => JSON.parse(await readFile(join(ROOT, p), 'utf8'));

// The whole Baja peninsula and Sea of Cortez (incl. Sonora/Sinaloa to Mazatlán).
const BCS = { lat: [22.0, 32.75], lon: [-118.6, -105.4] };
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
async function fetchSst() {
  const one = id => erddap(`${CW}/${id}.json?${q(`analysed_sst[(last)][(${BCS.lat[0]}):(${BCS.lat[1]})][(${BCS.lon[0]}):(${BCS.lon[1]})]`)}`).then(t => toGrid(t, 'analysed_sst', 2));
  return Promise.any(SST_IDS.map(one));
}
async function fetchChl() {
  const t = await erddap(`${CW}/${CHL_ID}.json?${q(`chlor_a[(last)][(0.0)][(${BCS.lat[0]}):(${BCS.lat[1]})][(${BCS.lon[0]}):(${BCS.lon[1]})]`)}`);
  return toGrid(t, 'chlor_a', 3);
}

/** Grid of scores → compact file: row-major Int8 values, -1 = no data/land. */
function packDense(z) {
  const flat = [];
  for (const row of z.v) for (const x of row) flat.push(x == null ? -1 : x);
  return {
    kind: 'dense', nlat: z.lat.length, nlon: z.lon.length,
    lat0: z.lat[0], dlat: round(z.lat[1] - z.lat[0], 5), lon0: z.lon[0], dlon: round(z.lon[1] - z.lon[0], 5),
    v: flat,
  };
}
/** Coastal (inshore) grid is mostly empty → [row, col, score] for scored squares only. */
function packSparse(z) {
  const cells = [];
  z.v.forEach((row, i) => row.forEach((x, j) => { if (x != null) cells.push([i, j, x]); }));
  return {
    kind: 'sparse', nlat: z.lat.length, nlon: z.lon.length,
    lat0: z.lat[0], dlat: round(z.lat[1] - z.lat[0], 5), lon0: z.lon[0], dlon: round(z.lon[1] - z.lon[0], 5),
    cells,
  };
}

async function main() {
  const offline = process.argv.includes('--offline');
  await mkdir(join(OUT, 'zones'), { recursive: true });
  await mkdir(CACHE, { recursive: true });

  let sst, chl;
  if (offline) {
    sst = JSON.parse(await readFile(join(CACHE, 'sst.json'), 'utf8'));
    chl = await readFile(join(CACHE, 'chl.json'), 'utf8').then(JSON.parse, () => null);
  } else {
    const [s, c] = await Promise.allSettled([fetchSst(), fetchChl()]);
    if (s.status !== 'fulfilled') throw new Error(`No water temperature from NOAA: ${s.reason?.message || s.reason}`);
    sst = s.value;
    chl = c.status === 'fulfilled' ? c.value : null; // the model works without color, just less sharply
    if (!chl) console.warn('chlorophyll unavailable:', c.reason?.message);
    await writeFile(join(CACHE, 'sst.json'), JSON.stringify(sst));
    if (chl) await writeFile(join(CACHE, 'chl.json'), JSON.stringify(chl));
  }
  console.log(`SST ${sst.date} (${sst.lat.length}×${sst.lon.length}), chlorophyll ${chl?.date ?? 'none'}`);

  const bathy = await readJson('packages/model/data/bathy-baja.json');
  const coast = coastGrid(await readJson('packages/model/data/bathy-baja-coast.json'));
  const areasFc = await readJson('packages/model/data/protected-areas.json');
  const areas = prepareAreas(areasFc);
  const conditions = { sst, chl };
  const now = new Date();

  const species = [];
  for (const sp of SPECIES) {
    const inshore = sp.g === 'inshore';
    // Website overview: the Los Cabos calendar (northern-only species use their own).
    const z = scoreZones({ ...sp, season: seasonFor(sp, null) || sp.season }, conditions, null, now, { bathy: inshore ? coast : bathy, reach: reachFromPorts });
    const closed = maskProtected(z, areas);
    // Official closed season (shark veda): no zones at all, the app explains why.
    const vedaNow = isClosed(sp.k, now);
    if (vedaNow) z.v = z.v.map(row => row.map(x => (x == null ? null : 0)));
    // Recount tiers after closing protected squares (cut-offs stay as scored).
    const counts = { elite: 0, priority: 0, candidate: 0 };
    for (const row of z.v) for (const x of row) { if (!x) continue; const t = TIERS.find(t => x >= z.cut[t.k]); if (t) counts[t.k]++; }
    const file = `zones/${sp.k}.json`;
    await writeFile(join(OUT, file), JSON.stringify(inshore ? packSparse(z) : packDense(z)));
    const info = INFO[sp.k] || {};
    species.push({
      k: sp.k, g: sp.g, en: sp.en, es: sp.es, seasonLevel: z.seasonLevel, cut: z.cut, counts, closedByProtection: closed, file,
      season: sp.season, spawn: info.spawn ?? null, spawnConfidence: info.conf ?? 'low', spawnSources: info.src ?? [],
      limit: info.limit ? LIMITS[info.limit] : LIMITS.general, reserved50nm: !!info.reserved50nm,
      closedSeason: vedaNow, beta: !!info.beta,
    });
    console.log(`${sp.k.padEnd(22)} elite ${String(counts.elite).padStart(4)}  priority ${String(counts.priority).padStart(4)}  closed ${closed}`);
  }

  await writeFile(join(OUT, 'conditions.json'), JSON.stringify({ sst, chl }));
  // Inputs for scoring on the phone (same as the Bite Map does in the browser).
  for (const f of ['bathy-baja.json', 'bathy-baja-coast.json', 'land-baja.json']) await copyFile(join(ROOT, 'packages/model/data', f), join(OUT, f));
  let outlookOk = false;
  try {
    const r = await fetch(OUTLOOK_URL, { headers: UA, signal: AbortSignal.timeout(60_000) });
    const j = r.ok ? await r.json() : null;
    if (j?.ok && j.outlook?.sst?.dates?.length) { await writeFile(join(OUT, 'outlook.json'), JSON.stringify(j.outlook)); outlookOk = true; }
  } catch (e) { console.warn('outlook unavailable:', e.message); }
  console.log('outlook', outlookOk ? 'ok' : 'missing');
  await writeFile(join(OUT, 'protected-areas.json'), JSON.stringify(areasFc));
  const manifest = {
    version: 1,
    updatedAt: now.toISOString(),
    area: { name: 'Baja California, Baja California Sur and the Sea of Cortez', box: BCS },
    areas: AREAS,
    files: { conditions: 'conditions.json', bathy: 'bathy-baja.json', coast: 'bathy-baja-coast.json', land: 'land-baja.json', protected: 'protected-areas.json', outlook: outlookOk ? 'outlook.json' : null },
    data: { sstDate: sst.date, chlDate: chl?.date ?? null },
    tiers: TIERS.map(t => ({ k: t.k, en: t.en, es: t.es, color: t.color })),
    groups: GROUPS.map(([k, en, es]) => ({ k, en, es })),
    species,
    notice: {
      en: 'Scores rate how well today\'s water fits each species. They are not a catch forecast. Check the weather and port status before going out, and follow protected-area rules.',
      es: 'La puntuación indica qué tan bien el agua de hoy le queda a cada especie. No es un pronóstico de captura. Revisa el clima y el estado del puerto antes de salir, y respeta las reglas de las áreas protegidas.',
    },
    rules: { source: LIMITS_SOURCE, sharkVeda: SHARK_VEDA, neverKeep: NEVER_KEEP,
      reserved50nm: { en: 'Billfish, dorado, roosterfish and tarpon are reserved for sport fishing within 50 nautical miles of the coast.', es: 'Picudos, dorado, pez gallo y sábalo están reservados a la pesca deportiva dentro de 50 millas náuticas de la costa.' },
      disclaimer: { en: 'Summary only. Official NOM and DOF texts always win; you need a valid sport-fishing license.', es: 'Solo es un resumen. Mandan los textos oficiales de las NOM y el DOF; necesitas un permiso de pesca deportiva vigente.' } },
    attribution: [
      'Water temperature: NOAA Geo-polar Blended SST (NOAA CoastWatch)',
      'Water color: NOAA VIIRS DINEOF chlorophyll-a (NOAA CoastWatch)',
      'Depth: NOAA NCEI ETOPO 2022 · Coastline: Natural Earth',
      'Protected areas: CONANP; DOF/SIDOF agreements; © OpenStreetMap contributors',
      'Next days: Copernicus Marine Service ocean forecast',
    ],
    by: ['Top Anglers Sportfishing Charters', 'Asociación Sudcaliforniana de Pesca Deportiva', 'Federación Nacional de Pesca Deportiva'],
  };
  await writeFile(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1));
  console.log(`Wrote ${species.length} species to out/v1`);
}

main().catch(e => { console.error(e); process.exit(1); });
