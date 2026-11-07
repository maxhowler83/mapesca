// Reads the static files the daily pipeline publishes (see ../pipeline/build.mjs).
import Constants from 'expo-constants';

export const DATA_URL: string =
  process.env.EXPO_PUBLIC_DATA_URL || (Constants.expoConfig?.extra?.dataUrl as string) || 'https://data.mapesca.org/v1';

type Txt = { en: string; es: string };
export type Tier = { k: 'elite' | 'priority' | 'candidate'; en: string; es: string; color: [number, number, number] };
export type SpeciesInfo = {
  k: string; g: string; en: string; es: string; seasonLevel: number;
  cut: Record<Tier['k'], number>; counts: Record<Tier['k'], number>; file: string;
  season: number[]; spawn: number[] | null; spawnConfidence: 'high' | 'medium' | 'low'; spawnSources: string[];
  limit: { n: number; en: string; es: string }; limits?: Record<string, Txt & { src?: string }>; reserved50nm: boolean; closedSeason: boolean; beta: boolean;
};
export type Rules = {
  source: string; reserved50nm: Txt; disclaimer: Txt;
  sharkVeda: Txt & { source: string };
  neverKeep: { en: string[]; es: string[]; note: Txt; source: string };
  juris?: Record<string, Txt & { agency: string; url: string; license?: Txt; neverKeep?: { en: string[]; es: string[]; note?: Txt } }>;
};
export type Manifest = {
  updatedAt: string;
  data: { sstDate: string | null; chlDate: string | null };
  tiers: Tier[];
  groups: { k: string; en: string; es: string }[];
  species: SpeciesInfo[];
  notice: Txt;
  rules: Rules;
  attribution: string[];
  by: string[];
};
type GridMeta = { nlat: number; nlon: number; lat0: number; dlat: number; lon0: number; dlon: number };
export type ZoneGrid = GridMeta & ({ kind: 'dense'; v: number[] } | { kind: 'sparse'; cells: [number, number, number][] });
export type Grid = { date: string | null; lat: number[]; lon: number[]; v: (number | null)[][] };
export type Conditions = { sst: Grid; chl: Grid | null };

async function getJson<T>(path: string): Promise<T> {
  const r = await fetch(`${DATA_URL}/${path}`);
  if (!r.ok) throw new Error(`HTTP ${r.status} ${path}`);
  return r.json() as Promise<T>;
}
export const loadManifest = () => getJson<Manifest>('manifest.json');
export const loadConditions = () => getJson<Conditions>('conditions.json');
export const loadProtected = () => getJson<GeoJSON.FeatureCollection>('protected-areas.json');
export const loadZones = (file: string) => getJson<ZoneGrid>(file);

/** Score of the square containing a point (null = land/no data). */
export function scoreAt(z: ZoneGrid, lat: number, lon: number): number | null {
  const i = Math.round((lat - z.lat0) / z.dlat), j = Math.round((lon - z.lon0) / z.dlon);
  if (i < 0 || j < 0 || i >= z.nlat || j >= z.nlon) return null;
  if (z.kind === 'dense') { const x = z.v[i * z.nlon + j]; return x < 0 ? null : x; }
  const c = z.cells.find(([a, b]) => a === i && b === j);
  return c ? c[2] : null;
}

export const tierOf = (sp: SpeciesInfo, tiers: Tier[], s: number | null) =>
  s == null || s <= 0 ? null : tiers.find(t => s >= sp.cut[t.k]) || null;

/** Only the squares in a tier, as GeoJSON squares coloured by tier. */
export function zonesToGeoJSON(z: ZoneGrid, sp: SpeciesInfo, tiers: Tier[]): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];
  const hla = Math.abs(z.dlat) / 2, hlo = Math.abs(z.dlon) / 2;
  const add = (i: number, j: number, s: number) => {
    const tier = tierOf(sp, tiers, s);
    if (!tier) return;
    const la = z.lat0 + i * z.dlat, lo = z.lon0 + j * z.dlon;
    features.push({
      type: 'Feature',
      properties: { s, tier: tier.k },
      geometry: { type: 'Polygon', coordinates: [[[lo - hlo, la - hla], [lo + hlo, la - hla], [lo + hlo, la + hla], [lo - hlo, la + hla], [lo - hlo, la - hla]]] },
    });
  };
  if (z.kind === 'dense') {
    for (let i = 0; i < z.nlat; i++) for (let j = 0; j < z.nlon; j++) { const s = z.v[i * z.nlon + j]; if (s > 0) add(i, j, s); }
  } else for (const [i, j, s] of z.cells) if (s > 0) add(i, j, s);
  return { type: 'FeatureCollection', features };
}

/** Nearest value in a condition grid (north-first lat). */
export function gridAt(g: Grid | null | undefined, lat: number, lon: number): number | null {
  if (!g?.lat?.length) return null;
  const dla = (g.lat[g.lat.length - 1] - g.lat[0]) / (g.lat.length - 1);
  const dlo = (g.lon[g.lon.length - 1] - g.lon[0]) / (g.lon.length - 1);
  const i = Math.round((lat - g.lat[0]) / dla), j = Math.round((lon - g.lon[0]) / dlo);
  return g.v[i]?.[j] ?? null;
}
