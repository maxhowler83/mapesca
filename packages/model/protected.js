// Marine protected areas for Mapesca.
// rule 'no-take'  → fishing is not allowed anywhere in the area: scores are set to 0
//                   and the map shows the area as closed.
// rule 'rules'    → fishing is allowed in parts, with zoning and permits: scores are
//                   kept, the boundary is drawn and the app tells people to check the rules.
// Boundaries: CONANP (sig.conanp.gob.mx), simplified. They are approximate — the
// official decree and management program always win.

/** Ray-casting point-in-ring test ([lon, lat] pairs). */
function inRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function inPolygon(lon, lat, rings) {
  if (!inRing(lon, lat, rings[0])) return false;
  for (let k = 1; k < rings.length; k++) if (inRing(lon, lat, rings[k])) return false; // holes
  return true;
}
function polygonsOf(geom) {
  if (geom.type === 'Polygon') return [geom.coordinates];
  if (geom.type === 'MultiPolygon') return geom.coordinates;
  return [];
}
function bboxOf(polys) {
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  for (const p of polys) for (const [x, y] of p[0]) { w = Math.min(w, x); e = Math.max(e, x); s = Math.min(s, y); n = Math.max(n, y); }
  return [w, s, e, n];
}

/** Prepared areas: [{ name, rule, polys, bbox }]. */
export function prepareAreas(fc) {
  return (fc?.features || []).map(f => {
    const polys = polygonsOf(f.geometry);
    return { name: f.properties.name, rule: f.properties.rule, category: f.properties.category, note: f.properties.note || null, species: f.properties.species || null, polys, bbox: bboxOf(polys) };
  });
}

/** The protected area a point falls in (no-take first), or null. */
export function areaAt(areas, lat, lon) {
  let hit = null;
  for (const a of areas) {
    const [w, s, e, n] = a.bbox;
    if (lon < w || lon > e || lat < s || lat > n) continue;
    if (a.polys.some(p => inPolygon(lon, lat, p))) {
      if (a.rule === 'no-take') return a;
      hit = hit || a;
    }
  }
  return hit;
}

/**
 * species: optional list on a "rules" area — those species may not be taken there.
 * Sets every square whose centre is inside a no-take area to 0 (ruled out),
 * in place, and returns how many squares were closed. Works on any scoreZones()
 * result ({ lat[], lon[], v[][] }).
 */
export function maskProtected(z, areas, speciesK = null) {
  // No-take areas, plus "rules" areas that ban this species only (e.g. California groundfish
  // exclusion areas: no rockfish or lingcod, pelagics allowed).
  const noTake = areas.filter(a => a.rule === 'no-take' || (speciesK && a.species && a.species.includes(speciesK)))
    .map(a => (a.rule === 'no-take' ? a : { ...a, rule: 'no-take' }));
  let closed = 0;
  z.lat.forEach((la, i) => z.lon.forEach((lo, j) => {
    if (z.v[i][j] == null || z.v[i][j] === 0) return;
    if (areaAt(noTake, la, lo)) { z.v[i][j] = 0; closed++; }
  }));
  return closed;
}
