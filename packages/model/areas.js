// Map areas. Each area ranks ITS OWN best water (top 3 / 10 / 25 % of the
// squares inside its box), so Loreto or Mulegé show their best spots instead
// of being outranked by a better day somewhere else — same as the Cabo Bite Map.
// box: { w, e, s, n } in degrees (W negative). Order = order of the chips.
export const AREAS = [
  { k: 'cabo', en: 'Los Cabos', es: 'Los Cabos', box: { w: -110.6, e: -109.3, s: 22.55, n: 23.3 } },
  { k: 'todos', en: 'Todos Santos', es: 'Todos Santos', box: { w: -110.8, e: -109.85, s: 22.85, n: 23.95 } },
  { k: 'eastcape', en: 'East Cape', es: 'East Cape', box: { w: -110.05, e: -109.25, s: 23.0, n: 23.95 } },
  { k: 'lapaz', en: 'La Paz', es: 'La Paz', box: { w: -110.85, e: -109.6, s: 23.85, n: 24.75 } },
  { k: 'magbay', en: 'Magdalena Bay', es: 'Bahía Magdalena', box: { w: -113.2, e: -111.45, s: 23.95, n: 25.5 } },
  { k: 'loreto', en: 'Loreto', es: 'Loreto', box: { w: -111.75, e: -110.7, s: 25.35, n: 26.45 } },
  { k: 'mulege', en: 'Mulegé', es: 'Mulegé', box: { w: -112.6, e: -111.45, s: 26.45, n: 27.6 } },
  { k: 'pacnorth', en: 'Pacific north', es: 'Pacífico norte', box: { w: -115.4, e: -112.4, s: 26.0, n: 28.1 } },
  { k: 'all', en: 'All of Baja California Sur', es: 'Todo Baja California Sur', box: { w: -115.4, e: -109.0, s: 22.3, n: 28.1 } },
];
export const AREAS_BY_K = Object.fromEntries(AREAS.map(a => [a.k, a]));

/** Smallest area that contains a point (for "go to coordinates" and GPS), or null. */
export function areaFor(lat, lon) {
  const inside = a => lat >= a.box.s && lat <= a.box.n && lon >= a.box.w && lon <= a.box.e;
  const hits = AREAS.filter(inside);
  if (!hits.length) return null;
  const size = a => (a.box.e - a.box.w) * (a.box.n - a.box.s);
  return hits.sort((a, b) => size(a) - size(b))[0];
}
