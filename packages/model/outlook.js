// Bite Map outlook: the next days' water, for the same zone scoring as today.
// Copy shared with tools/receipt-generator/src/captain/outlook.js (captain app) — keep the two in sync.
//
// How: today's NOAA satellite map keeps its detail (5 km temperature, breaks,
// water color); each square is moved by the change the Copernicus ocean model
// forecasts there between the satellite's day and the day you pick
// (temperature: + the model's warming or cooling; chlorophyll: × the model's
// ratio, kept between ⅓ and 3×). Breaks stay where the satellite saw them and
// only grow or fade, so the further ahead, the rougher the outlook.
// Data: /api/bookings/outlook (api/bookings/_outlook.js).

/** Confidence by days ahead of today (Cabo time). */
export const CONF = [
  { upTo: 3, k: 'good', en: 'Good confidence', es: 'Confianza buena' },
  { upTo: 6, k: 'fair', en: 'Fair confidence', es: 'Confianza regular' },
  { upTo: 99, k: 'low', en: 'Low confidence', es: 'Confianza baja' },
];
export const confFor = lead => CONF.find(c => lead <= c.upTo);

/** Today's date in Cabo (YYYY-MM-DD). */
export const caboToday = (now = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mazatlan' }).format(now);
const addDays = (iso, n) => new Date(Date.parse(iso + 'T12:00:00Z') + n * 864e5).toISOString().slice(0, 10);
const daysBetween = (a, b) => Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 864e5);

/** Days the outlook can show: [{ date, lead, conf }] after today, while the model has them. */
export function outlookDays(outlook, now = new Date()) {
  const dates = outlook?.sst?.dates || [], today = caboToday(now), out = [];
  for (const d of dates) { const lead = daysBetween(today, d); if (lead >= 1) out.push({ date: d, lead, conf: confFor(lead) }); }
  return out;
}

/** Bilinear value of a model grid (rows north first) at lat/lon; nearby squares fill in next to land. */
function sampleModel(g, f, la, lo) {
  const { lat, lon } = g, dla = lat[0] - lat[1], dlo = lon[1] - lon[0];
  const y = (lat[0] - la) / dla, x = (lo - lon[0]) / dlo;
  if (y < -1 || x < -1 || y > lat.length || x > lon.length) return null;
  const i0 = Math.floor(y), j0 = Math.floor(x), fy = y - i0, fx = x - j0;
  let s = 0, w = 0;
  for (const [di, dj, wt] of [[0, 0, (1 - fy) * (1 - fx)], [0, 1, (1 - fy) * fx], [1, 0, fy * (1 - fx)], [1, 1, fy * fx]]) {
    const v = f[i0 + di]?.[j0 + dj];
    if (v != null) { s += v * wt; w += wt; }
  }
  if (w > 0.05) return s / w;
  for (let r = 1; r <= 2; r++) { // coast: the nearest sea squares within 2 cells
    let s2 = 0, n = 0;
    for (let di = -r; di <= r + 1; di++) for (let dj = -r; dj <= r + 1; dj++) { const v = f[i0 + di]?.[j0 + dj]; if (v != null) { s2 += v; n++; } }
    if (n) return s2 / n;
  }
  return null;
}

/** Index of a date in a model grid, or the nearest day inside it. */
function dayIndex(g, iso) {
  const k = g.dates.indexOf(iso);
  if (k >= 0) return k;
  let best = 0;
  g.dates.forEach((d, i) => { if (Math.abs(daysBetween(d, iso)) < Math.abs(daysBetween(g.dates[best], iso))) best = i; });
  return best;
}

/** A satellite grid moved to another day: add (temperature) or multiply (chlorophyll) the model's change. */
function shift(sat, g, target, mode) {
  if (!sat?.v || !g?.v) return sat || null;
  const a = dayIndex(g, sat.date || target), b = dayIndex(g, target), fa = g.v[a], fb = g.v[b];
  const v = sat.v.map((row, i) => row.map((x, j) => {
    if (x == null) return null;
    const ma = sampleModel(g, fa, sat.lat[i], sat.lon[j]), mb = sampleModel(g, fb, sat.lat[i], sat.lon[j]);
    if (ma == null || mb == null) return x;
    if (mode === 'add') return Math.round((x + (mb - ma) / 100) * 100) / 100;
    const r = ma > 0 ? Math.min(3, Math.max(1 / 3, mb / ma)) : 1;
    return Math.round(x * r * 1000) / 1000;
  }));
  return { ...sat, v, date: target, from: sat.date };
}

/**
 * Conditions for another day, in the same shape the zone scoring takes
 * ({ sst, chl, ... }): today's satellite, shifted by the model's forecast change.
 * Cached per conditions/outlook/day, so switching days back and forth is instant.
 */
const CACHE = new WeakMap();
export function projectConditions(conditions, outlook, target) {
  if (!conditions?.sst || !outlook?.sst) return null;
  let m = CACHE.get(conditions); if (!m) CACHE.set(conditions, (m = new Map()));
  const key = `${outlook.fetchedAt}|${target}`;
  if (!m.has(key)) {
    m.set(key, {
      ...conditions,
      sst: shift(conditions.sst, outlook.sst, target, 'add'),
      chl: outlook.chl ? shift(conditions.chl, outlook.chl, target, 'mul') : conditions.chl,
      outlookDate: target,
    });
  }
  return m.get(key);
}

/** The model's own average change in °C between the satellite day and a target day, over a box (for the readout). */
export function modelTrend(outlook, from, to, box) {
  const g = outlook?.sst; if (!g) return null;
  const a = g.v[dayIndex(g, from)], b = g.v[dayIndex(g, to)];
  let s = 0, n = 0;
  g.lat.forEach((la, i) => { if (la < box.s || la > box.n) return; g.lon.forEach((lo, j) => { if (lo < box.w || lo > box.e) return; const x = a[i][j], y = b[i][j]; if (x != null && y != null) { s += y - x; n++; } }); });
  return n ? Math.round(s / n) / 100 : null;
}
export { addDays };
