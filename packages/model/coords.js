// Copy of tools/receipt-generator/src/captain/coords.js (captain app). Keep the two in sync.
// Typed GPS coordinates → { lat, lon }, for "Go to coordinates" on the map.
// Accepts the ways captains write them:
//   22°52.91'N 109°54.57'W     22 52.91 N 109 54.57 W     N22 52.910 W109 54.570
//   22°52'54"N 109°54'34"W     22.8818, -109.9095        22,8818 -109,9095
//   22 52.91 109 54.57         (no letters: north and west assumed)
// "O" / "OESTE" counts as west. A longitude written without a sign or a
// letter is taken as west, since our waters are all west of Greenwich.
// Returns null when it can't be read.

const toDec = (nums) => {
  if (!nums.length || nums.length > 3) return null;
  const [d, m = 0, s = 0] = nums;
  if (nums.length > 1 && (m < 0 || m >= 60 || s < 0 || s >= 60)) return null;
  const sign = d < 0 || Object.is(d, -0) ? -1 : 1;
  return sign * (Math.abs(d) + m / 60 + s / 3600);
};

export function parseCoords(input) {
  let s = String(input || '').toUpperCase().trim();
  if (!s) return null;
  s = s.replace(/OESTE|WEST/g, ' W ').replace(/NORTE|NORTH/g, ' N ').replace(/\bSUR\b|SOUTH/g, ' S ').replace(/\bESTE\b|EAST/g, ' E ');
  // Decimal commas (22,8818) only when the text has no dots at all.
  if (!s.includes('.')) s = s.replace(/(\d),(\d)/g, '$1.$2');
  s = s.replace(/[°º˚′'’″"”,;/]/g, ' ');
  const tokens = s.match(/-?\d+(?:\.\d+)?|(?<![A-Z])[NSEWO](?![A-Z])/g) || [];
  const groups = []; // { nums: [], hemi }
  const lettersFirst = /^[NSEWO]$/.test(tokens[0] || '');
  let cur = { nums: [], hemi: null };
  for (const t of tokens) {
    if (/^[NSEWO]$/.test(t)) {
      const h = t === 'O' ? 'W' : t;
      if (lettersFirst) { if (cur.nums.length || cur.hemi) groups.push(cur); cur = { nums: [], hemi: h }; }
      else { cur.hemi = h; groups.push(cur); cur = { nums: [], hemi: null }; }
    } else cur.nums.push(Number(t));
  }
  if (cur.nums.length || cur.hemi) groups.push(cur);

  let latG, lonG;
  if (groups.length === 2) [latG, lonG] = groups;
  else if (groups.length === 1 && !groups[0].hemi) {
    const n = groups[0].nums; // no letters: split the numbers in half
    if (![2, 4, 6].includes(n.length)) return null;
    latG = { nums: n.slice(0, n.length / 2), hemi: null }; lonG = { nums: n.slice(n.length / 2), hemi: null };
  } else return null;
  // Letters can put longitude first ("W109 54.5 N22 52.9").
  if (latG.hemi && /[EW]/.test(latG.hemi) && lonG.hemi && /[NS]/.test(lonG.hemi)) [latG, lonG] = [lonG, latG];
  if ((latG.hemi && !/[NS]/.test(latG.hemi)) || (lonG.hemi && !/[EW]/.test(lonG.hemi))) return null;

  let lat = toDec(latG.nums), lon = toDec(lonG.nums);
  if (lat == null || lon == null) return null;
  if (latG.hemi === 'S') lat = -Math.abs(lat);
  if (latG.hemi === 'N') lat = Math.abs(lat);
  if (lonG.hemi === 'W') lon = -Math.abs(lon);
  else if (lonG.hemi === 'E') lon = Math.abs(lon);
  else if (lon > 0) lon = -lon; // no sign, no letter: west
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return { lat, lon };
}
