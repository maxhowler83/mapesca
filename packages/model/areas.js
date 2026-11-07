// Data regions and map areas.
//
// DATA REGIONS: each has its own satellite download, depth/coast/land grids and
// zone files, so the phone only downloads the region you're looking at.
// ocean: which species can live there (species-info.js OCEAN).
export const REGIONS = [
  { k: 'baja', ocean: 'pac', en: 'Baja & Sea of Cortez', es: 'Baja y Mar de Cortés', box: { w: -118.6, e: -105.4, s: 22.0, n: 32.75 } },
  { k: 'pacsur', ocean: 'pac', en: 'Mexican Pacific south', es: 'Pacífico sur de México', box: { w: -107.5, e: -92.0, s: 14.3, n: 23.2 } },
  { k: 'golfo', ocean: 'atl', en: 'Gulf of Mexico & Caribbean', es: 'Golfo de México y Caribe', box: { w: -98.0, e: -86.3, s: 17.8, n: 26.1 } },
];
export const REGIONS_BY_K = Object.fromEntries(REGIONS.map(r => [r.k, r]));

// MAP AREAS. Each area ranks ITS OWN best water (top 3 / 10 / 25 % of the
// squares inside its box), so Loreto or Mulegé show their best spots instead
// of being outranked by a better day somewhere else — same as the Cabo Bite Map.
// box: { w, e, s, n } in degrees (W negative). Order = order of the chips.
// d: data region. r: season region (species-info.js SEASONS); null = big view.
export const AREAS = [
  // Baja California Sur
  // Los Cabos includes the Pacific grounds the Cabo fleet fishes (Golden Gate, San Jaime, Cabo Falso and offshore).
  { k: 'cabo', d: 'baja', r: 'cabo', en: 'Los Cabos', es: 'Los Cabos', box: { w: -110.9, e: -109.3, s: 22.3, n: 23.3 } },
  { k: 'todos', d: 'baja', r: 'cabo', en: 'Todos Santos', es: 'Todos Santos', box: { w: -110.8, e: -109.85, s: 22.85, n: 23.95 } },
  { k: 'eastcape', d: 'baja', r: 'cabo', en: 'East Cape', es: 'East Cape', box: { w: -110.05, e: -109.25, s: 23.0, n: 23.95 } },
  { k: 'lapaz', d: 'baja', r: 'gulf-south', en: 'La Paz', es: 'La Paz', box: { w: -110.85, e: -109.6, s: 23.85, n: 24.75 } },
  { k: 'magbay', d: 'baja', r: 'pac-south', en: 'Magdalena Bay', es: 'Bahía Magdalena', box: { w: -113.2, e: -111.45, s: 23.95, n: 25.5 } },
  { k: 'loreto', d: 'baja', r: 'gulf-south', en: 'Loreto', es: 'Loreto', box: { w: -111.75, e: -110.7, s: 25.35, n: 26.45 } },
  { k: 'mulege', d: 'baja', r: 'gulf-central', en: 'Mulegé', es: 'Mulegé', box: { w: -112.6, e: -111.45, s: 26.45, n: 27.6 } },
  { k: 'pacnorth', d: 'baja', r: 'pac-south', en: 'Pacific BCS north', es: 'Pacífico norte BCS', box: { w: -115.4, e: -112.4, s: 26.0, n: 28.1 } },
  // Baja California (Pacific)
  { k: 'cedros', d: 'baja', r: 'pac-central', en: 'Cedros & Vizcaíno', es: 'Cedros y Vizcaíno', box: { w: -115.8, e: -113.9, s: 27.6, n: 29.2 } },
  { k: 'guadalupe', d: 'baja', r: 'pac-central', en: 'Isla Guadalupe', es: 'Isla Guadalupe', box: { w: -118.6, e: -117.9, s: 28.7, n: 29.4 } },
  { k: 'sanquintin', d: 'baja', r: 'pac-north', en: 'San Quintín', es: 'San Quintín', box: { w: -116.6, e: -115.6, s: 29.9, n: 30.9 } },
  { k: 'ensenada', d: 'baja', r: 'pac-north', en: 'Ensenada', es: 'Ensenada', box: { w: -117.5, e: -116.3, s: 31.3, n: 32.6 } },
  // Sea of Cortez north and mainland side
  { k: 'sanfelipe', d: 'baja', r: 'gulf-north', en: 'San Felipe', es: 'San Felipe', box: { w: -115.0, e: -114.0, s: 30.2, n: 31.5 } },
  { k: 'penasco', d: 'baja', r: 'gulf-north', en: 'Puerto Peñasco', es: 'Puerto Peñasco', box: { w: -114.6, e: -112.9, s: 30.8, n: 31.8 } },
  { k: 'bahiaangeles', d: 'baja', r: 'gulf-central', en: 'Bahía de los Ángeles', es: 'Bahía de los Ángeles', box: { w: -113.9, e: -112.8, s: 28.5, n: 29.6 } },
  { k: 'guaymas', d: 'baja', r: 'gulf-central', en: 'Kino & Guaymas', es: 'Kino y Guaymas', box: { w: -112.5, e: -110.6, s: 27.6, n: 29.1 } },
  { k: 'topolobampo', d: 'baja', r: 'gulf-south', en: 'Topolobampo', es: 'Topolobampo', box: { w: -109.6, e: -108.6, s: 25.0, n: 25.9 } },
  { k: 'mazatlan', d: 'baja', r: 'gulf-south', en: 'Mazatlán', es: 'Mazatlán', box: { w: -107.2, e: -105.9, s: 22.7, n: 23.7 } },
  // Mexican Pacific south (Nayarit → Chiapas)
  { k: 'sanblas', d: 'pacsur', r: 'pac-mx-central', en: 'San Blas', es: 'San Blas', box: { w: -105.9, e: -104.9, s: 21.1, n: 22.0 } },
  { k: 'vallarta', d: 'pacsur', r: 'pac-mx-central', en: 'Puerto Vallarta', es: 'Puerto Vallarta', box: { w: -106.0, e: -105.15, s: 20.25, n: 21.05 } },
  { k: 'manzanillo', d: 'pacsur', r: 'pac-mx-central', en: 'Manzanillo', es: 'Manzanillo', box: { w: -105.0, e: -103.9, s: 18.6, n: 19.5 } },
  { k: 'ixtapa', d: 'pacsur', r: 'pac-mx-south', en: 'Ixtapa-Zihuatanejo', es: 'Ixtapa-Zihuatanejo', box: { w: -102.0, e: -101.2, s: 17.2, n: 17.85 } },
  { k: 'acapulco', d: 'pacsur', r: 'pac-mx-south', en: 'Acapulco', es: 'Acapulco', box: { w: -100.3, e: -99.5, s: 16.4, n: 17.0 } },
  { k: 'escondido', d: 'pacsur', r: 'pac-mx-south', en: 'Puerto Escondido', es: 'Puerto Escondido', box: { w: -97.5, e: -96.7, s: 15.4, n: 16.0 } },
  { k: 'huatulco', d: 'pacsur', r: 'pac-mx-south', en: 'Huatulco', es: 'Huatulco', box: { w: -96.6, e: -95.7, s: 15.2, n: 15.9 } },
  { k: 'chiapas', d: 'pacsur', r: 'pac-mx-south', en: 'Puerto Chiapas', es: 'Puerto Chiapas', box: { w: -93.2, e: -92.0, s: 14.3, n: 15.2 } },
  // Gulf of Mexico and Caribbean
  { k: 'tampico', d: 'golfo', r: 'gom-west', en: 'Tampico', es: 'Tampico', box: { w: -97.95, e: -97.0, s: 21.8, n: 22.9 } },
  { k: 'tuxpan', d: 'golfo', r: 'gom-west', en: 'Tuxpan & Lobos', es: 'Tuxpan y Lobos', box: { w: -97.5, e: -96.7, s: 20.6, n: 21.6 } },
  { k: 'veracruz', d: 'golfo', r: 'gom-west', en: 'Veracruz', es: 'Veracruz', box: { w: -96.4, e: -95.6, s: 18.75, n: 19.5 } },
  { k: 'carmen', d: 'golfo', r: 'gom-south', en: 'Ciudad del Carmen', es: 'Ciudad del Carmen', box: { w: -92.4, e: -91.2, s: 18.5, n: 19.4 } },
  { k: 'campeche', d: 'golfo', r: 'gom-south', en: 'Campeche', es: 'Campeche', box: { w: -91.4, e: -90.3, s: 19.5, n: 20.5 } },
  { k: 'progreso', d: 'golfo', r: 'gom-south', en: 'Progreso & Alacranes', es: 'Progreso y Alacranes', box: { w: -90.3, e: -89.2, s: 21.2, n: 22.7 } },
  { k: 'holbox', d: 'golfo', r: 'caribe', en: 'Holbox & Río Lagartos', es: 'Holbox y Río Lagartos', box: { w: -88.3, e: -87.1, s: 21.4, n: 22.0 } },
  { k: 'cancun', d: 'golfo', r: 'caribe', en: 'Isla Mujeres & Cancún', es: 'Isla Mujeres y Cancún', box: { w: -87.0, e: -86.45, s: 20.85, n: 21.6 } },
  { k: 'cozumel', d: 'golfo', r: 'caribe', en: 'Cozumel & Playa del Carmen', es: 'Cozumel y Playa del Carmen', box: { w: -87.2, e: -86.6, s: 20.15, n: 20.85 } },
  { k: 'siankaan', d: 'golfo', r: 'caribe', en: 'Sian Ka’an & Ascensión', es: 'Sian Ka’an y Ascensión', box: { w: -87.8, e: -87.2, s: 19.3, n: 20.2 } },
  { k: 'chinchorro', d: 'golfo', r: 'caribe', en: 'Mahahual & Chinchorro', es: 'Mahahual y Chinchorro', box: { w: -87.9, e: -87.1, s: 18.0, n: 18.95 } },
  // Big views: Baja uses the Los Cabos calendar; the others their main season region.
  { k: 'all', d: 'baja', r: null, en: 'All of Baja California Sur', es: 'Todo Baja California Sur', box: { w: -115.4, e: -109.0, s: 22.3, n: 28.1 } },
  { k: 'region', d: 'baja', r: null, en: 'All of Baja & Sea of Cortez', es: 'Toda Baja y el Mar de Cortés', box: { w: -118.6, e: -105.4, s: 22.0, n: 32.75 } },
  { k: 'pacsur-all', d: 'pacsur', r: 'pac-mx-south', big: true, en: 'All of the Pacific south', es: 'Todo el Pacífico sur', box: { w: -107.5, e: -92.0, s: 14.3, n: 23.2 } },
  { k: 'golfo-all', d: 'golfo', r: 'gom-south', big: true, en: 'All of the Gulf & Caribbean', es: 'Todo el Golfo y Caribe', box: { w: -98.0, e: -86.3, s: 17.8, n: 26.1 } },
];
export const AREAS_BY_K = Object.fromEntries(AREAS.map(a => [a.k, a]));
const isBig = a => !a.r || a.big;

/** Smallest area that contains a point (for "go to coordinates" and GPS), or null. */
export function areaFor(lat, lon) {
  const inside = a => lat >= a.box.s && lat <= a.box.n && lon >= a.box.w && lon <= a.box.e;
  const hits = AREAS.filter(a => !isBig(a) && inside(a));
  if (!hits.length) return AREAS.find(a => isBig(a) && inside(a)) || null;
  const size = a => (a.box.e - a.box.w) * (a.box.n - a.box.s);
  return hits.sort((a, b) => size(a) - size(b))[0];
}

/** Everything the map covers (the map can't pan or zoom out past it). */
export const COVERAGE = {
  w: Math.min(...REGIONS.map(r => r.box.w)), e: Math.max(...REGIONS.map(r => r.box.e)),
  s: Math.min(...REGIONS.map(r => r.box.s)), n: Math.max(...REGIONS.map(r => r.box.n)),
};
