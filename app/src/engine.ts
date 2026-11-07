// Scoring on the phone, exactly like the Cabo Bite Map does in the browser:
// today's satellite water (or the next days' outlook) + depth + season → zones,
// ranked inside the area on screen, with protected areas and closed seasons applied.
// @ts-nocheck — the shared model is plain JavaScript.
import { scoreZones, explainAt, tierOf, TIERS, SPECIES_BY_K, coastGrid, reachFromPorts, nearestPort, PORTS } from '../../packages/model/zones.js';
import { prepareAreas, maskProtected, areaAt } from '../../packages/model/protected.js';
import { projectConditions, outlookDays, caboToday } from '../../packages/model/outlook.js';
import { closureFor, INFO, seasonFor, CLOSURES, JURIS, jurisOf } from '../../packages/model/species-info.js';
import { AREAS, AREAS_BY_K, areaFor, COVERAGE, REGIONS_BY_K } from '../../packages/model/areas.js';
import { nmBetween, bearing, minutesAt, fmtDuration, crossesLand, NM_TO_MI, NM_TO_KM } from '../../packages/model/route.js';
import { parseCoords } from '../../packages/model/coords.js';
import { DATA_URL, type Manifest } from './data';

export { TIERS, SPECIES_BY_K, PORTS, AREAS, AREAS_BY_K, areaFor, COVERAGE, seasonFor, closureFor, CLOSURES, nearestPort, outlookDays, caboToday, nmBetween, bearing, minutesAt, fmtDuration, crossesLand, NM_TO_MI, NM_TO_KM, parseCoords, areaAt, INFO, JURIS, jurisOf };

export type Box = { w: number; e: number; s: number; n: number };
/** One data region's inputs (Baja & Sea of Cortez, Pacific south, Gulf & Caribbean). */
export type RegionData = { k: string; conditions: any; bathy: any; land: any; coast?: any; files: any; data?: any };
export type Inputs = {
  manifest: Manifest; protectedFc: any; areas: any[]; outlook: any | null;
  regions: Record<string, RegionData>;
};

const get = (f: string) => fetch(`${DATA_URL}/${f}`).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status} ${f}`); return r.json(); });
const regionFiles = (m: any, k: string) => (m.regions || []).find((r: any) => r.k === k) || (k === 'baja' ? { k, files: m.files, data: m.data } : null);
export const regionOfArea = (areaKey: string) => (AREAS_BY_K[areaKey] || AREAS_BY_K.cabo).d || 'baja';
/** Regions published today (a region missing from the manifest isn't available right now). */
export const availableRegions = (m: any) => new Set(((m.regions || []).map((r: any) => r.k)).concat(m.regions ? [] : ['baja']));

/** Manifest, protected areas and the outlook first; each region's data when it's first opened. */
export async function loadInputs(): Promise<Inputs> {
  const manifest: any = await get('manifest.json');
  const [protectedFc, outlook] = await Promise.all([
    get(manifest.files.protected), manifest.files.outlook ? get(manifest.files.outlook).catch(() => null) : Promise.resolve(null),
  ]);
  return { manifest, protectedFc, areas: prepareAreas(protectedFc), outlook, regions: {} };
}
export async function loadRegion(inp: Inputs, k: string): Promise<RegionData> {
  if (inp.regions[k]) return inp.regions[k];
  const r = regionFiles(inp.manifest, k);
  if (!r) throw new Error(`region ${k} not published`);
  const [conditions, bathy, land] = await Promise.all([get(r.files.conditions), get(r.files.bathy), get(r.files.land)]);
  return (inp.regions[k] = { k, conditions, bathy, land, files: r.files, data: r.data });
}
/** The ~0.9 km coastal grid for inshore species (1–4 MB), loaded the first time one is picked in a region. */
export async function loadCoast(inp: Inputs, k: string) {
  const r = await loadRegion(inp, k);
  if (!r.coast) r.coast = coastGrid(await get(r.files.coast));
  return r.coast;
}

/** Only the part of a grid around an area (plus a margin), so big regions score fast. */
const crops = new Map<string, any>();
function crop(B: any, box: Box, key: string) {
  const k = `${key}|${box.w},${box.e},${box.s},${box.n}`;
  if (crops.has(k)) return crops.get(k);
  // Wide margin (~45 nm): like the Bite Map, the water around the area is drawn too (ranked by the
  // area's own cut-offs), so Cabo shows its Pacific grounds, not only what fits in the box.
  const m = 0.75, rows: number[] = [], cols: number[] = [];
  B.lat.forEach((la: number, i: number) => { if (la >= box.s - m && la <= box.n + m) rows.push(i); });
  B.lon.forEach((lo: number, j: number) => { if (lo >= box.w - m && lo <= box.e + m) cols.push(j); });
  const out = { lat: rows.map(i => B.lat[i]), lon: cols.map(j => B.lon[j]), depth: rows.map(i => cols.map(j => B.depth[i][j])), relief: rows.map(i => cols.map(j => B.relief[i][j])) };
  crops.set(k, out);
  return out;
}

export const whenOf = (day: string) => (day ? new Date(`${day}T19:00:00Z`) : new Date()); // noon in Cabo

/** True when the ocean-forecast grid covers the whole box (the next-days outlook). */
export function outlookCovers(inp: Inputs, box: Box) {
  const g = inp.outlook?.sst; if (!g?.lat?.length) return false;
  const la = [Math.min(...g.lat), Math.max(...g.lat)], lo = [Math.min(...g.lon), Math.max(...g.lon)];
  return box.s >= la[0] - 0.1 && box.n <= la[1] + 0.1 && box.w >= lo[0] - 0.1 && box.e <= lo[1] + 0.1;
}

/** Tiers from the best water INSIDE the area (Bite Map rule). */
function areaZones(z: any, v: Box) {
  const vals: number[] = [];
  z.lat.forEach((la: number, i: number) => { if (la >= v.s && la <= v.n) z.lon.forEach((lo: number, j: number) => { const x = z.v[i][j]; if (x > 0 && lo >= v.w && lo <= v.e) vals.push(x); }); });
  vals.sort((a, b) => b - a);
  const cut = Object.fromEntries(TIERS.map((t: any) => [t.k, Math.max(t.floor, vals[Math.max(0, Math.ceil(vals.length * t.top) - 1)] ?? 101)]));
  const out = { ...z, cut }, counts: any = { elite: 0, priority: 0, candidate: 0 };
  for (const x of vals) { const t = tierOf(out, x); if (t) counts[t.k]++; }
  return { ...out, counts };
}

export type Result = { az: any; cond: any; closure: any | null; closedSeason: boolean; notHere: boolean; geojson: GeoJSON.FeatureCollection; here: number; land: any; data: any };

export function compute(inp: Inputs, sp: string, areaKey: string, day: string): Result {
  const area = AREAS_BY_K[areaKey] || AREAS_BY_K.cabo;
  const R = inp.regions[area.d || 'baja'];
  if (!R) throw new Error('region data not loaded');
  const S = SPECIES_BY_K[sp], inshore = S.g === 'inshore';
  const useCoast = inshore && R.coast;
  const B = crop(useCoast ? R.coast : R.bathy, area.box, `${R.k}|${useCoast ? 'coast' : 'bathy'}`);
  // Day outlook only where the ocean forecast covers the whole area; otherwise today's satellite.
  const cond = day && outlookCovers(inp, area.box) && inp.outlook ? (projectConditions(R.conditions, inp.outlook, day) || R.conditions) : R.conditions;
  const when = whenOf(day);
  // Regional season (null = not found in this area: no zones).
  const season = seasonFor(S, area.r);
  const z = scoreZones({ ...S, season: season || S.season }, cond, null, when, { bathy: B, reach: reachFromPorts });
  maskProtected(z, inp.areas, sp);
  const closure = closureFor(sp, when, area.r, area.k), notHere = !season;
  if (closure || notHere) z.v = z.v.map((row: any[]) => row.map(x => (x == null ? null : 0)));
  const az = areaZones(z, area.box);
  const here = az.counts.elite + az.counts.priority + az.counts.candidate;
  // Squares in a tier → GeoJSON (half a cell each way).
  const features: GeoJSON.Feature[] = [];
  const hla = Math.abs(az.lat[0] - az.lat[1]) / 2, hlo = Math.abs(az.lon[1] - az.lon[0]) / 2;
  az.lat.forEach((la: number, i: number) => az.lon.forEach((lo: number, j: number) => {
    const s = az.v[i][j]; if (!(s > 0)) return;
    const t = tierOf(az, s); if (!t) return;
    features.push({ type: 'Feature', properties: { tier: t.k }, geometry: { type: 'Polygon', coordinates: [[[lo - hlo, la - hla], [lo + hlo, la - hla], [lo + hlo, la + hla], [lo - hlo, la + hla], [lo - hlo, la - hla]]] } });
  }));
  return { az, cond, closure, closedSeason: !!closure, notHere, geojson: { type: 'FeatureCollection', features }, here, land: R.land, data: R.data };
}

const WHY: Record<string, [string, string]> = {
  temp: ['water temperature in its range', 'temperatura del agua en su rango'], break: ['a temperature break nearby', 'un corte de temperatura cerca'],
  color: ['good water color', 'buen color del agua'], depth: ['the right depth', 'la profundidad correcta'],
  structure: ['bottom structure (bank or drop-off)', 'estructura en el fondo (bajo o caída)'], bait: ['bait water nearby', 'agua de carnada cerca'],
};
export type Explain =
  | { kind: 'outside' } | { kind: 'land'; inshore: boolean } | { kind: 'cloud' }
  | { kind: 'ok'; tier: any; score: number | null; sst: number; depth: number | null; port: { name: string; nm: number }; why: string[] };

/** Why a spot scores the way it does (Bite Map readout). */
export function explain(r: Result, lat: number, lon: number, es: boolean): Explain {
  const x = explainAt(r.az, r.cond, null, lat, lon);
  if (!x) return { kind: 'outside' };
  if (x.land) return { kind: 'land', inshore: r.az.species.g === 'inshore' };
  if (x.sst == null) return { kind: 'cloud' };
  const why = !x.tier ? [] : x.bars.filter((b: any) => WHY[b.k] && b.value != null && b.value >= 0.6)
    .sort((a: any, b: any) => b.weight * b.value - a.weight * a.value).slice(0, 3).map((b: any) => WHY[b.k][es ? 1 : 0]);
  return { kind: 'ok', tier: x.tier, score: x.score, sst: x.sst, depth: x.depth, port: nearestPort(lat, lon), why };
}

const dm = (v: number, pos: string, neg: string) => { const a = Math.abs(v), d = Math.floor(a), m = (a - d) * 60; return `${d}°${m.toFixed(2)}'${v >= 0 ? pos : neg}`; };
export const pinText = (p: { lat: number; lon: number }) => `${dm(p.lat, 'N', 'S')} ${dm(p.lon, 'E', 'W')}`;

/** Does a closed season apply to this area? Big views include every closure of their data region. */
export function closureApplies(c: any, areaKey: string) {
  const A = AREAS_BY_K[areaKey] || AREAS_BY_K.cabo, big = !A.r || A.big;
  if (c.areas) return c.areas.includes(A.k) || (big && c.areas.some((k: string) => AREAS_BY_K[k]?.d === A.d));
  return c.regions.includes(A.r) || (big && AREAS.some((a: any) => a.d === A.d && c.regions.includes(a.r)));
}
/** Jurisdiction of an area (rules, licence, never-keep list). */
export const jurisOfArea = (areaKey: string) => jurisOf((AREAS_BY_K[areaKey] || AREAS_BY_K.cabo).r);
