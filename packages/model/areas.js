// Map areas. Each area ranks ITS OWN best water (top 3 / 10 / 25 % of the
// squares inside its box), so Loreto or Mulegé show their best spots instead
// of being outranked by a better day somewhere else — same as the Cabo Bite Map.
// box: { w, e, s, n } in degrees (W negative). Order = order of the chips.
// r: season region (species-info.js SEASONS); null = big view, uses the Los Cabos calendar.
export const AREAS = [
  // Baja California Sur
  { k: 'cabo', r: 'cabo', en: 'Los Cabos', es: 'Los Cabos', box: { w: -110.6, e: -109.3, s: 22.55, n: 23.3 } },
  { k: 'todos', r: 'cabo', en: 'Todos Santos', es: 'Todos Santos', box: { w: -110.8, e: -109.85, s: 22.85, n: 23.95 } },
  { k: 'eastcape', r: 'cabo', en: 'East Cape', es: 'East Cape', box: { w: -110.05, e: -109.25, s: 23.0, n: 23.95 } },
  { k: 'lapaz', r: 'gulf-south', en: 'La Paz', es: 'La Paz', box: { w: -110.85, e: -109.6, s: 23.85, n: 24.75 } },
  { k: 'magbay', r: 'pac-south', en: 'Magdalena Bay', es: 'Bahía Magdalena', box: { w: -113.2, e: -111.45, s: 23.95, n: 25.5 } },
  { k: 'loreto', r: 'gulf-south', en: 'Loreto', es: 'Loreto', box: { w: -111.75, e: -110.7, s: 25.35, n: 26.45 } },
  { k: 'mulege', r: 'gulf-central', en: 'Mulegé', es: 'Mulegé', box: { w: -112.6, e: -111.45, s: 26.45, n: 27.6 } },
  { k: 'pacnorth', r: 'pac-south', en: 'Pacific BCS north', es: 'Pacífico norte BCS', box: { w: -115.4, e: -112.4, s: 26.0, n: 28.1 } },
  // Baja California (Pacific)
  { k: 'cedros', r: 'pac-central', en: 'Cedros & Vizcaíno', es: 'Cedros y Vizcaíno', box: { w: -115.8, e: -113.9, s: 27.6, n: 29.2 } },
  { k: 'guadalupe', r: 'pac-central', en: 'Isla Guadalupe', es: 'Isla Guadalupe', box: { w: -118.6, e: -117.9, s: 28.7, n: 29.4 } },
  { k: 'sanquintin', r: 'pac-north', en: 'San Quintín', es: 'San Quintín', box: { w: -116.6, e: -115.6, s: 29.9, n: 30.9 } },
  { k: 'ensenada', r: 'pac-north', en: 'Ensenada', es: 'Ensenada', box: { w: -117.5, e: -116.3, s: 31.3, n: 32.6 } },
  // Sea of Cortez north and mainland side
  { k: 'sanfelipe', r: 'gulf-north', en: 'San Felipe', es: 'San Felipe', box: { w: -115.0, e: -114.0, s: 30.2, n: 31.5 } },
  { k: 'penasco', r: 'gulf-north', en: 'Puerto Peñasco', es: 'Puerto Peñasco', box: { w: -114.6, e: -112.9, s: 30.8, n: 31.8 } },
  { k: 'bahiaangeles', r: 'gulf-central', en: 'Bahía de los Ángeles', es: 'Bahía de los Ángeles', box: { w: -113.9, e: -112.8, s: 28.5, n: 29.6 } },
  { k: 'guaymas', r: 'gulf-central', en: 'Kino & Guaymas', es: 'Kino y Guaymas', box: { w: -112.5, e: -110.6, s: 27.6, n: 29.1 } },
  { k: 'topolobampo', r: 'gulf-south', en: 'Topolobampo', es: 'Topolobampo', box: { w: -109.6, e: -108.6, s: 25.0, n: 25.9 } },
  { k: 'mazatlan', r: 'gulf-south', en: 'Mazatlán', es: 'Mazatlán', box: { w: -107.2, e: -105.9, s: 22.7, n: 23.7 } },
  // Big views: seasons there come from the Los Cabos calendar (the app says so)
  { k: 'all', r: null, en: 'All of Baja California Sur', es: 'Todo Baja California Sur', box: { w: -115.4, e: -109.0, s: 22.3, n: 28.1 } },
  { k: 'region', r: null, en: 'All of Baja & Sea of Cortez', es: 'Toda Baja y el Mar de Cortés', box: { w: -118.6, e: -105.4, s: 22.0, n: 32.75 } },
];
export const AREAS_BY_K = Object.fromEntries(AREAS.map(a => [a.k, a]));

/** Smallest area that contains a point (for "go to coordinates" and GPS), or null. */
export function areaFor(lat, lon) {
  const inside = a => lat >= a.box.s && lat <= a.box.n && lon >= a.box.w && lon <= a.box.e;
  const hits = AREAS.filter(a => a.r && inside(a));
  if (!hits.length) return AREAS.find(a => !a.r && inside(a)) || null;
  const size = a => (a.box.e - a.box.w) * (a.box.n - a.box.s);
  return hits.sort((a, b) => size(a) - size(b))[0];
}

/** Whole data box (the map can't pan or zoom out past it). */
export const COVERAGE = { w: -118.6, e: -105.4, s: 22.0, n: 32.75 };
