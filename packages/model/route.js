// Point A to point B for the Cabo Bite Map: straight-line (great-circle)
// distance, true bearing and running time at a given speed in knots.
// The line is "as the crow flies": it does not route around land, so we
// also check whether it crosses land (Natural Earth coastline, the same one
// the map draws) and say so.

export const NM_TO_MI = 1.150779, NM_TO_KM = 1.852;
const R_NM = 3440.065;
const rad = x => x * Math.PI / 180, deg = x => x * 180 / Math.PI;

/** Great-circle distance in nautical miles. */
export function nmBetween(a, b) {
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R_NM * Math.asin(Math.sqrt(h));
}

/** Initial true bearing from a to b, 0–359°. */
export function bearing(a, b) {
  const y = Math.sin(rad(b.lon - a.lon)) * Math.cos(rad(b.lat));
  const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lon - a.lon));
  return (Math.round(deg(Math.atan2(y, x))) + 360) % 360;
}

/** Minutes to run nm at kt knots. */
export const minutesAt = (nm, kt) => (kt > 0 ? (nm / kt) * 60 : null);

/** "1 h 25 min" / "55 min". */
export function fmtDuration(min) {
  if (min == null || !Number.isFinite(min)) return '';
  const m = Math.max(1, Math.round(min));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
}

function inRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
const boxes = new WeakMap();
function boxOf(ring) {
  let b = boxes.get(ring);
  if (!b) {
    b = [Infinity, Infinity, -Infinity, -Infinity];
    for (const [x, y] of ring) { if (x < b[0]) b[0] = x; if (y < b[1]) b[1] = y; if (x > b[2]) b[2] = x; if (y > b[3]) b[3] = y; }
    boxes.set(ring, b);
  }
  return b;
}
export function onLand(lat, lon, land) {
  for (const ring of land) {
    const b = boxOf(ring);
    if (lon < b[0] || lon > b[2] || lat < b[1] || lat > b[3]) continue;
    if (inRing(lon, lat, ring)) return true;
  }
  return false;
}

/** True when the straight line from a to b passes over land on the way.
 *  The coastline is coarse (Natural Earth 1:10m) and ports sit on or just
 *  inside it (a marina, a town up a river), so land right at either end is
 *  ignored, but only within ~2 nm of each end. */
export function crossesLand(a, b, land) {
  const nm = nmBetween(a, b);
  if (nm < 1) return false;
  const n = Math.min(1500, Math.ceil(nm / 0.2));
  const wet = [];
  for (let i = 0; i <= n; i++) { const t = i / n; wet.push(!onLand(a.lat + (b.lat - a.lat) * t, a.lon + (b.lon - a.lon) * t, land)); }
  // Land is forgiven only within ~2 nm of each end (the marina or a town up a
  // river); any other land on the line — including a long stretch right after
  // leaving port — means the straight line crosses land.
  // The coastline is coarse (~1 km), so a land blip under ~1.2 nm is ignored too.
  const step = nm / n, end = Math.ceil(2 / step), minRun = Math.ceil(1.2 / step);
  let run = 0;
  for (let i = end + 1; i < n - end; i++) { run = wet[i] ? 0 : run + 1; if (run >= minRun) return true; }
  if (wet.indexOf(true) < 0) return nm > 4; // all land: only fine if both ends are a short hop apart
  return false;
}
