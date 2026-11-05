// Fishing zones ("Zonas"): a 0–100 score per ~2.7 km square of how well
// today's conditions match what each species likes, from the same data the
// map already shows. It rates conditions; it is NOT a catch probability and
// has not been checked against catches yet (planned: calibrate with the
// captains' reports after a season).
//
// Signals per square (each 0–1), weighted per species group:
//   temp       sea-surface temperature vs. the species' range (NOAA blended SST, 5 km)
//   break      temperature break: how fast SST changes nearby (°C per km)
//   color      water color: chlorophyll vs. the species' preference, plus color edges
//   depth      bottom depth vs. the species' range (NOAA ETOPO 2022, bathy-cabo.json)
//   structure  bottom relief within ~8 km (banks, seamounts, drop-offs)
//   current    surface current speed (Copernicus), mostly as a structure/upwelling helper
//   bait       billfish only: how good the square is for their food — skipjack,
//              black skipjack and bonitos (the best of the four bait scores)
// Season multiplies the result (the website's month-by-month calendar, 0–3),
// and so does reach: full value within 25 nm of the Cabo marina, easing to
// ×0.6 at 60 nm, so the best squares are ones a charter can actually fish.
// Hard limits: wrong depth for the species, or water far outside its range, → 0.
//
// Mapesca copy of the Cabo Bite Map model (top-anglers-mahi website/src/lib/zones.js).
// Differences: no built-in Cabo grid — pass { bathy, reach } to scoreZones()
// (the pipeline uses bathy-bcs.json and reach from the nearest port), and
// protected areas are applied with maskProtected() from ./protected.js.
const BATHY = null;

// Tiers are the day's best squares (top 3 / 10 / 25 %), but never below a
// floor score, so a poor day shows few or no zones instead of fake "elite" ones.
export const TIERS = [
  { k: 'elite', top: 0.03, floor: 62, color: [214, 40, 57], en: 'Elite', es: 'Élite' },
  { k: 'priority', top: 0.10, floor: 52, color: [244, 125, 32], en: 'Priority', es: 'Prioridad' },
  { k: 'candidate', top: 0.25, floor: 42, color: [242, 184, 64], en: 'Candidate', es: 'Candidato' },
];
/** Tier of a score within a zones result (uses that day's cut-offs). */
export const tierOf = (z, s) => (s == null ? null : TIERS.find(x => s >= z.cut[x.k]) || null);

// Weights per group (sum 1).
const W = {
  billfish: { temp: 0.3, break: 0.15, color: 0.1, structure: 0.1, depth: 0.1, current: 0.05, bait: 0.2 },
  bait:     { temp: 0.3, break: 0.2, color: 0.25, structure: 0.1, depth: 0.1, current: 0.05 },
  tuna:     { temp: 0.3, break: 0.2, color: 0.15, structure: 0.2, depth: 0.1, current: 0.05 },
  dorado:   { temp: 0.35, break: 0.25, color: 0.2, structure: 0.05, depth: 0.1, current: 0.05 },
  wahoo:    { temp: 0.3, break: 0.15, color: 0.05, structure: 0.3, depth: 0.15, current: 0.05 },
  inshore:  { temp: 0.25, break: 0.1, color: 0.1, structure: 0.2, depth: 0.35, current: 0 },
  // Mapesca: pelagic sharks follow temperature and fronts; no sourced chlorophyll preference.
  shark:    { temp: 0.4, break: 0.25, color: 0.05, structure: 0.1, depth: 0.1, current: 0.1 },
};

// Starting profiles, to be tuned with the captains. Upper temperatures are
// wider than textbook ranges on purpose: our own reports show striped marlin
// and sailfish biting in 85–87°F water in October, and roosterfish and jack
// crevalle are caught along Cabo's beaches in the same warm water. temp °C and depth m are
// [hard min, ideal from, ideal to, hard max]; chl mg/m³ [ideal from, ideal to].
// season: Jan…Dec, 0–3, from the website's species calendar (species.json, marine-fish.json).
export const SPECIES = [
  { k: 'striped-marlin', g: 'billfish', en: 'Striped marlin', es: 'Marlín rayado', temp: [18, 20, 27, 31.5], depth: [50, 200, 4000, 9000], chl: [0.08, 0.3], season: [3, 3, 3, 3, 3, 2, 2, 1, 1, 3, 3, 3] },
  { k: 'blue-marlin', g: 'billfish', en: 'Blue marlin', es: 'Marlín azul', temp: [23, 26, 30.5, 32.5], depth: [100, 400, 5000, 9000], chl: [0.05, 0.2], season: [1, 0, 0, 1, 1, 1, 3, 3, 3, 3, 3, 1] },
  { k: 'black-marlin', g: 'billfish', en: 'Black marlin', es: 'Marlín negro', temp: [22, 25, 30.5, 32.5], depth: [30, 80, 1500, 6000], chl: [0.08, 0.35], season: [0, 0, 0, 0, 1, 1, 2, 3, 3, 2, 2, 1] },
  { k: 'pacific-sailfish', g: 'billfish', en: 'Sailfish', es: 'Pez vela', temp: [21, 24, 30, 32], depth: [30, 100, 3000, 9000], chl: [0.08, 0.35], season: [1, 0, 0, 0, 1, 1, 2, 3, 3, 3, 2, 1] },
  { k: 'yellowfin-tuna', g: 'tuna', en: 'Yellowfin tuna', es: 'Atún aleta amarilla', temp: [19, 22, 29.5, 32], depth: [80, 300, 5000, 9000], chl: [0.08, 0.3], season: [2, 2, 1, 1, 2, 3, 3, 3, 3, 3, 3, 2] },
  { k: 'dorado', g: 'dorado', en: 'Dorado', es: 'Dorado', temp: [19, 22, 30, 32], depth: [30, 150, 5000, 9000], chl: [0.1, 0.45], season: [2, 2, 1, 1, 2, 2, 2, 3, 3, 3, 3, 2] },
  { k: 'wahoo', g: 'wahoo', en: 'Wahoo', es: 'Wahoo', temp: [20, 23, 29.5, 31.5], depth: [30, 60, 600, 2500], chl: [0.08, 0.3], season: [2, 1, 1, 1, 2, 1, 1, 1, 2, 2, 3, 3] },
  // Bait for billfish (they also have their own zones). Productive, greener edges.
  { k: 'skipjack-tuna', g: 'bait', en: 'Skipjack tuna', es: 'Barrilete', temp: [18, 20, 29, 31.5], depth: [100, 300, 5000, 9000], chl: [0.12, 0.5], season: [1, 1, 1, 1, 1, 1, 2, 3, 3, 3, 3, 2] },
  { k: 'black-skipjack', g: 'bait', en: 'Black skipjack', es: 'Barrilete negro', temp: [21, 24, 30, 32], depth: [20, 50, 2000, 9000], chl: [0.12, 0.6], season: [2, 2, 2, 2, 3, 3, 3, 3, 3, 2, 2, 2] },
  { k: 'striped-bonito', g: 'bait', en: 'Striped bonito', es: 'Bonito', temp: [19, 22, 29, 31], depth: [10, 20, 600, 3000], chl: [0.15, 0.8], season: [2, 2, 3, 3, 2, 2, 2, 1, 1, 1, 2, 2] },
  { k: 'pacific-bonito', g: 'bait', en: 'Pacific bonito', es: 'Bonito del Pacífico', temp: [14, 16, 22, 26], depth: [10, 20, 600, 3000], chl: [0.2, 1.5], season: [2, 2, 2, 2, 1, 1, 0, 0, 0, 0, 1, 1] },
  { k: 'roosterfish', g: 'inshore', en: 'Roosterfish', es: 'Pez gallo', temp: [19, 22, 30.5, 33], depth: [1, 3, 25, 60], chl: [0.15, 2], season: [2, 2, 2, 2, 3, 3, 3, 2, 1, 1, 2, 2] },
  { k: 'sierra', g: 'inshore', en: 'Sierra', es: 'Sierra', temp: [18, 21, 28, 31], depth: [1, 3, 20, 50], chl: [0.15, 2], season: [3, 3, 3, 3, 2, 1, 1, 0, 0, 1, 2, 2] },
  { k: 'jack-crevalle', g: 'inshore', en: 'Jack crevalle', es: 'Toro', temp: [18, 22, 30.5, 33], depth: [2, 5, 45, 100], chl: [0.15, 2], season: [1, 2, 2, 2, 3, 3, 3, 2, 1, 1, 1, 1] },
  // More inshore and reef species (v136). Depths from the website's species pages (FishBase,
  // local studies); temperatures are starting profiles to tune with the captains' reports.
  { k: 'yellowtail', g: 'inshore', en: 'Yellowtail', es: 'Jurel', temp: [15, 17, 24, 27], depth: [5, 15, 120, 250], chl: [0.2, 2], season: [2, 3, 3, 3, 2, 2, 1, 0, 0, 0, 1, 1] },
  { k: 'almaco-jack', g: 'inshore', en: 'Almaco jack', es: 'Pez fuerte', temp: [18, 21, 29, 31.5], depth: [10, 30, 200, 340], chl: [0.1, 0.6], season: [2, 2, 3, 3, 3, 3, 3, 2, 2, 2, 2, 2] },
  { k: 'pacific-dog-snapper', g: 'inshore', en: 'Dog snapper', es: 'Pargo prieto', temp: [20, 23, 31, 33], depth: [1, 3, 30, 60], chl: [0.15, 2], season: [1, 1, 1, 2, 3, 3, 3, 3, 3, 2, 2, 1] },
  { k: 'yellow-snapper', g: 'inshore', en: 'Yellow snapper', es: 'Pargo amarillo', temp: [20, 23, 31, 33], depth: [2, 3, 60, 94], chl: [0.15, 2], season: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2] },
  { k: 'barred-pargo', g: 'inshore', en: 'Barred pargo', es: 'Pargo coconaco', temp: [20, 23, 31, 33], depth: [2, 3, 25, 100], chl: [0.15, 2], season: [2, 2, 2, 2, 3, 3, 2, 2, 2, 2, 2, 2] },
  { k: 'leopard-grouper', g: 'inshore', en: 'Leopard grouper', es: 'Cabrilla sardinera', temp: [15, 18, 28, 31], depth: [1, 3, 50, 100], chl: [0.15, 2], season: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2] },
  { k: 'mexican-barracuda', g: 'inshore', en: 'Mexican barracuda', es: 'Barracuda', temp: [20, 23, 31, 33], depth: [2, 10, 60, 100], chl: [0.15, 2], season: [1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2] },
  // Northern Baja and upper/central Gulf species (Mapesca). LOW-CONFIDENCE temperature
  // profiles: depth and seasons are sourced (species-info.js); several temperatures are
  // inferred. season here is the Los Cabos calendar: all 0 = not found there (regional
  // seasons in species-info.js decide where they show).
  { k: 'pacific-bluefin', g: 'tuna', en: 'Pacific bluefin tuna', es: 'Atún aleta azul', temp: [10, 15, 20, 24], depth: [80, 300, 5000, 9000], chl: [0.1, 0.5], season: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { k: 'white-seabass', g: 'inshore', en: 'White seabass', es: 'Corvina blanca', temp: [11, 13, 16, 24], depth: [2, 5, 30, 122], chl: [0.2, 2], season: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { k: 'calico-bass', g: 'inshore', en: 'Calico (kelp) bass', es: 'Cabrilla de roca (calico)', temp: [12, 15, 22, 26], depth: [1, 3, 25, 61], chl: [0.2, 3], season: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { k: 'barred-sand-bass', g: 'inshore', en: 'Barred sand bass', es: 'Cabrilla de arena', temp: [13, 16, 22, 26], depth: [1, 5, 30, 150], chl: [0.2, 3], season: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { k: 'california-halibut', g: 'inshore', en: 'California halibut', es: 'Lenguado de California', temp: [12, 15, 21, 25], depth: [1, 2, 30, 150], chl: [0.2, 3], season: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { k: 'gulf-corvina', g: 'inshore', en: 'Gulf corvina', es: 'Curvina golfina', temp: [16, 20, 28, 32], depth: [0, 1, 10, 30], chl: [0.5, 10], season: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { k: 'gulf-grouper', g: 'inshore', en: 'Gulf grouper (baya)', es: 'Baya (mero del Golfo)', temp: [14, 17, 27, 30], depth: [2, 5, 30, 100], chl: [0.15, 2], season: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  // ── Both coasts of Mexico (Mapesca). LOW-CONFIDENCE starting profiles: depth from FishBase/NOAA,
  // temperatures mostly estimated (see species-info.js for sources). season = Los Cabos calendar
  // (all 0 = not found there; the regional calendars in species-info.js decide where they show).
  { k: 'white-marlin', g: 'billfish', en: 'White marlin', es: 'Marlín blanco', temp: [21, 24, 29, 31], depth: [100, 200, 4000, 9000], chl: [0.05, 0.3], season: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { k: 'swordfish', g: 'billfish', en: 'Swordfish', es: 'Pez espada', temp: [12, 18, 26, 30], depth: [200, 500, 5000, 9000], chl: [0.08, 0.5], season: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
  { k: 'blackfin-tuna', g: 'tuna', en: 'Blackfin tuna', es: 'Atún aleta negra', temp: [20, 23, 29, 31], depth: [30, 80, 2000, 9000], chl: [0.08, 0.4], season: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { k: 'king-mackerel', g: 'wahoo', en: 'King mackerel', es: 'Peto', temp: [20, 23, 29, 31], depth: [5, 10, 60, 180], chl: [0.15, 1], season: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { k: 'tarpon', g: 'inshore', en: 'Tarpon', es: 'Sábalo', temp: [18, 24, 31, 36], depth: [0, 1, 15, 40], chl: [0.2, 5], season: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { k: 'common-snook', g: 'inshore', en: 'Common snook', es: 'Robalo blanco', temp: [16, 25, 31, 34], depth: [0, 1, 10, 30], chl: [0.3, 10], season: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { k: 'pacific-snook', g: 'inshore', en: 'Pacific snook', es: 'Robalo prieto', temp: [20, 24, 31, 34], depth: [0, 1, 10, 30], chl: [0.3, 10], season: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { k: 'permit', g: 'inshore', en: 'Permit', es: 'Palometa', temp: [20, 24, 30, 33], depth: [0, 1, 15, 36], chl: [0.1, 2], season: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { k: 'bonefish', g: 'inshore', en: 'Bonefish', es: 'Macabí', temp: [20, 24, 31, 34], depth: [0, 1, 3, 10], chl: [0.1, 3], season: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { k: 'great-barracuda', g: 'inshore', en: 'Great barracuda', es: 'Picuda (barracuda)', temp: [20, 24, 30, 32], depth: [0, 3, 30, 100], chl: [0.1, 2], season: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { k: 'spanish-mackerel', g: 'inshore', en: 'Spanish mackerel', es: 'Sierra del Golfo', temp: [19, 22, 29, 31], depth: [2, 5, 30, 50], chl: [0.3, 3], season: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { k: 'cero', g: 'inshore', en: 'Cero mackerel', es: 'Sierra pintada', temp: [22, 25, 30, 32], depth: [1, 2, 20, 40], chl: [0.1, 1.5], season: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { k: 'cobia', g: 'inshore', en: 'Cobia', es: 'Cobia', temp: [18, 21, 29, 32], depth: [1, 5, 50, 120], chl: [0.15, 2], season: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { k: 'greater-amberjack', g: 'inshore', en: 'Greater amberjack', es: 'Medregal', temp: [17, 20, 28, 31], depth: [10, 18, 72, 150], chl: [0.1, 1.5], season: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { k: 'atlantic-jack', g: 'inshore', en: 'Crevalle jack (Atlantic)', es: 'Jurel (Atlántico)', temp: [18, 22, 31, 33], depth: [1, 2, 100, 150], chl: [0.15, 3], season: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { k: 'red-drum', g: 'inshore', en: 'Red drum', es: 'Corvina roja', temp: [12, 16, 28, 32], depth: [0, 1, 10, 30], chl: [0.5, 15], season: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { k: 'red-snapper', g: 'inshore', en: 'Red snapper (Gulf)', es: 'Huachinango del Golfo', temp: [18, 20, 31, 33], depth: [10, 30, 130, 190], chl: [0.1, 2], season: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { k: 'mutton-snapper', g: 'inshore', en: 'Mutton snapper', es: 'Pargo criollo', temp: [20, 22, 30, 32], depth: [5, 25, 70, 95], chl: [0.1, 1.5], season: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { k: 'red-grouper', g: 'inshore', en: 'Red grouper', es: 'Mero rojo', temp: [18, 21, 30, 32], depth: [3, 10, 100, 150], chl: [0.1, 2], season: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { k: 'black-grouper', g: 'inshore', en: 'Black grouper', es: 'Negrillo', temp: [20, 23, 30, 32], depth: [10, 30, 120, 150], chl: [0.1, 1.5], season: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { k: 'goliath-grouper', g: 'inshore', en: 'Goliath grouper', es: 'Mero guasa (cherna)', temp: [20, 24, 30, 33], depth: [1, 5, 46, 100], chl: [0.2, 3], season: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { k: 'pacific-goliath', g: 'inshore', en: 'Pacific goliath grouper', es: 'Mero guasa del Pacífico', temp: [20, 24, 31, 33], depth: [1, 5, 40, 100], chl: [0.2, 3], season: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { k: 'giant-sea-bass', g: 'inshore', en: 'Giant sea bass', es: 'Pescada (mero gigante)', temp: [12, 15, 22, 26], depth: [5, 10, 40, 60], chl: [0.2, 3], season: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { k: 'pacific-red-snapper', g: 'inshore', en: 'Pacific red snapper', es: 'Huachinango del Pacífico', temp: [16, 20, 31, 33], depth: [10, 30, 90, 150], chl: [0.1, 2], season: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { k: 'spotted-rose-snapper', g: 'inshore', en: 'Spotted rose snapper', es: 'Flamenco (lunarejo)', temp: [18, 22, 31, 33], depth: [5, 10, 40, 60], chl: [0.15, 2], season: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { k: 'bull-shark', g: 'shark', en: 'Bull shark', es: 'Tiburón toro', temp: [20, 24, 31, 33], depth: [1, 1, 30, 164], chl: [0.1, 5], season: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  // Sharks (Mapesca). LOW-CONFIDENCE starting profiles, estimated from tagging and
  // fishery studies off Baja (see species-info.js); no published thresholds exist.
  // Closed every May 1–Jul 31 (shark veda, DOF 2012) — the pipeline zeroes them then.
  { k: 'shortfin-mako', g: 'shark', en: 'Shortfin mako', es: 'Tiburón mako', temp: [14, 17, 22, 26], depth: [10, 50, 5000, 9000], chl: [0.05, 2], season: [3, 3, 3, 3, 2, 1, 1, 0, 0, 1, 2, 3] },
  { k: 'blue-shark', g: 'shark', en: 'Blue shark', es: 'Tiburón azul', temp: [12, 16, 20, 24], depth: [10, 50, 5000, 9000], chl: [0.05, 2], season: [3, 3, 3, 3, 2, 1, 0, 0, 0, 1, 2, 3] },
  { k: 'silky-shark', g: 'shark', en: 'Silky shark', es: 'Tiburón piloto', temp: [22, 25, 30, 32], depth: [10, 50, 5000, 9000], chl: [0.05, 2], season: [0, 0, 0, 1, 2, 2, 3, 3, 3, 3, 2, 1] },
  { k: 'pelagic-thresher', g: 'shark', en: 'Pelagic thresher', es: 'Tiburón zorro', temp: [20, 23, 28, 31], depth: [10, 50, 5000, 9000], chl: [0.05, 2], season: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2] },
];
export const SPECIES_BY_K = Object.fromEntries(SPECIES.map(s => [s.k, s]));
export const SIGNALS = [
  ['temp', 'Temperature', 'Temperatura'], ['break', 'Temp. break', 'Corte de temp.'], ['color', 'Water color', 'Color del agua'],
  ['depth', 'Depth', 'Profundidad'], ['structure', 'Structure', 'Estructura'], ['current', 'Current', 'Corriente'],
  ['bait', 'Bait (skipjack, bonito)', 'Carnada (barrilete, bonito)'],
];
export const BAIT = SPECIES.filter(x => x.g === 'bait');
/** Species groups for the pickers, in this order. */
export const GROUPS = [
  ['billfish', 'Billfish', 'Picudos'], ['tuna', 'Tuna', 'Atún'], ['dorado', 'Dorado', 'Dorado'], ['wahoo', 'Wahoo', 'Wahoo'],
  ['bait', 'Bait for billfish', 'Carnada para picudos'], ['inshore', 'Inshore', 'Costeros'], ['shark', 'Sharks', 'Tiburones'],
];

const MARINA = { lat: 22.8815, lon: -109.9095 };
/** Nautical miles from the Cabo marina (straight line). */
export function nmFromMarina(lat, lon) {
  const r = x => x * Math.PI / 180, dLat = r(lat - MARINA.lat), dLon = r(lon - MARINA.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(lat)) * Math.cos(r(MARINA.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 3440.065 * Math.asin(Math.sqrt(h));
}
const reachMul = nm => (nm <= 25 ? 1 : Math.max(0.6, 1 - (nm - 25) / 35 * 0.4));
const nmBetween = (lat, lon, p) => {
  const r = x => x * Math.PI / 180, dLat = r(lat - p.lat), dLon = r(lon - p.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(lat)) * Math.cos(r(p.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 3440.065 * Math.asin(Math.sqrt(h));
};
// Where sport-fishing boats and pangas leave from in Baja California Sur (Cabo Bite Map reach).
// Ports of the Pacific south and the Gulf/Caribbean (ports-mx.js, built from data/ports-mx.json).
import { EXTRA_PORTS } from './ports-mx.js';
export const PORTS = [
  { name: 'Cabo San Lucas', lat: 22.8815, lon: -109.9095 },
  { name: 'San José del Cabo', lat: 23.017, lon: -109.677 },
  { name: 'Los Barriles', lat: 23.682, lon: -109.699 },
  { name: 'La Ventana', lat: 24.049, lon: -109.989 },
  { name: 'La Paz', lat: 24.2, lon: -110.305 },
  { name: 'Todos Santos', lat: 23.42, lon: -110.24 },
  { name: 'Puerto San Carlos', lat: 24.789, lon: -112.106 },
  { name: 'Puerto López Mateos', lat: 25.19, lon: -112.12 },
  { name: 'San Evaristo', lat: 24.91, lon: -110.71 },
  { name: 'Agua Verde', lat: 25.52, lon: -111.07 },
  { name: 'Puerto Escondido', lat: 25.81, lon: -111.31 },
  { name: 'Loreto', lat: 26.012, lon: -111.343 },
  { name: 'Mulegé', lat: 26.885, lon: -111.98 },
  { name: 'Santa Rosalía', lat: 27.338, lon: -112.267 },
  { name: 'San Juanico', lat: 26.255, lon: -112.476 },
  { name: 'Punta Abreojos', lat: 26.716, lon: -113.573 },
  { name: 'Bahía Asunción', lat: 27.142, lon: -114.295 },
  { name: 'Bahía Tortugas', lat: 27.692, lon: -114.895 },
  // Mapesca: Baja California and the mainland side of the Gulf (OpenStreetMap; San Felipe pier from the DOF 2026 agreement).
  { name: 'Guerrero Negro', lat: 27.971, lon: -114.036 },
  { name: 'Isla de Cedros', lat: 28.096, lon: -115.189 },
  { name: 'El Rosario', lat: 30.059, lon: -115.725 },
  { name: 'San Quintín', lat: 30.561, lon: -115.938 },
  { name: 'Ensenada', lat: 31.866, lon: -116.603 },
  { name: 'San Felipe', lat: 30.993, lon: -114.829 },
  { name: 'Puertecitos', lat: 30.349, lon: -114.637 },
  { name: 'Golfo de Santa Clara', lat: 31.688, lon: -114.494 },
  { name: 'Puerto Peñasco', lat: 31.317, lon: -113.532 },
  { name: 'Puerto Libertad', lat: 29.906, lon: -112.682 },
  { name: 'Bahía de los Ángeles', lat: 28.949, lon: -113.561 },
  { name: 'Bahía de Kino', lat: 28.825, lon: -111.937 },
  { name: 'Guaymas', lat: 27.922, lon: -110.899 },
  { name: 'Topolobampo', lat: 25.601, lon: -109.054 },
  { name: 'Altata', lat: 24.634, lon: -107.93 },
  { name: 'Mazatlán', lat: 23.204, lon: -106.421 },
  ...EXTRA_PORTS,
];
/** Nearest port and its straight-line distance (nm). */
export function nearestPort(lat, lon) {
  let best = null;
  for (const p of PORTS) { const nm = nmBetween(lat, lon, p); if (!best || nm < best.nm) best = { name: p.name, nm }; }
  return best;
}
/** Reach multiplier from the nearest port (same curve as from the Cabo marina). */
export const reachFromPorts = (lat, lon) => reachMul(nearestPort(lat, lon).nm);
const clamp01 = x => Math.max(0, Math.min(1, x));
/** 0 outside [a,d], 1 inside [b,c], straight lines between. */
function trap(x, [a, b, c, d]) {
  if (x == null || !Number.isFinite(x)) return null;
  if (x <= a || x >= d) return 0;
  if (x >= b && x <= c) return 1;
  return x < b ? (x - a) / (b - a) : (d - x) / (d - c);
}

/**
 * Inshore detail: the coastal bathymetry (public/data/bathy-bcs-coast.json, or
 * bathy-cabo-coast.json in the captain app) is a sparse list of ~0.9 km cells
 * [row, col, depth m, relief m] up to 150 m deep. This expands it into the same
 * regular grid shape as the main bathymetry, for scoreZones(…, { bathy }).
 * Use it for inshore species: on the 2.7 km grid most water along steep coasts
 * averages deeper than roosterfish, sierra and jack crevalle live.
 */
export function coastGrid(c) {
  if (cache.has(c)) return cache.get(c);
  const lat = Array.from({ length: c.nlat }, (_, i) => Math.round((c.n - c.step * (i + 0.5)) * 1e5) / 1e5);
  const lon = Array.from({ length: c.nlon }, (_, j) => Math.round((c.w + c.step * (j + 0.5)) * 1e5) / 1e5);
  const depth = lat.map(() => new Array(c.nlon).fill(null)), relief = lat.map(() => new Array(c.nlon).fill(null));
  for (const [i, j, d, r] of c.cells) { depth[i][j] = d; relief[i][j] = r; }
  const g = { lat, lon, depth, relief }; cache.set(c, g);
  return g;
}
const cache = new WeakMap();
/** Options for scoreZones: inshore species get the coastal grid when one is given. */
export const zoneOpts = (species, coast) => ((typeof species === 'string' ? SPECIES_BY_K[species] : species)?.g === 'inshore' && coast ? { bathy: coastGrid(coast) } : {});

/** Nearest valid cell of a regular grid ({lat[] north first, lon[], v[][]}), searching up to r cells away. */
function sampler(g, r = 2) {
  if (!g?.lat?.length || !g?.lon?.length) return () => null;
  const la0 = g.lat[0], dla = (g.lat[g.lat.length - 1] - la0) / Math.max(1, g.lat.length - 1);
  const lo0 = g.lon[0], dlo = (g.lon[g.lon.length - 1] - lo0) / Math.max(1, g.lon.length - 1);
  return (lat, lon, vv = g.v) => {
    const i0 = Math.round((lat - la0) / dla), j0 = Math.round((lon - lo0) / dlo);
    for (let rr = 0; rr <= r; rr++) {
      let best = null, bd = Infinity;
      for (let a = -rr; a <= rr; a++) for (let b = -rr; b <= rr; b++) {
        if (Math.max(Math.abs(a), Math.abs(b)) !== rr) continue;
        const x = vv[i0 + a]?.[j0 + b];
        if (x != null && Number.isFinite(x) && a * a + b * b < bd) { bd = a * a + b * b; best = x; }
      }
      if (best != null) return best;
    }
    return null;
  };
}

/** Steepest change to a neighbour, per km (for SST: °C/km; for chl: log10 units/km). */
function gradient(g, f = x => x) {
  if (!g?.v?.length) return null;
  const kmLat = 111.2 * Math.abs(g.lat[0] - g.lat[1] || 0.05), kmLon = 111.2 * Math.cos(23 * Math.PI / 180) * Math.abs(g.lon[1] - g.lon[0] || 0.05);
  return {
    lat: g.lat, lon: g.lon,
    v: g.v.map((row, i) => row.map((x, j) => {
      if (x == null) return null;
      const a = f(x); let m = 0;
      for (const [di, dj, km] of [[1, 0, kmLat], [-1, 0, kmLat], [0, 1, kmLon], [0, -1, kmLon]]) {
        const y = g.v[i + di]?.[j + dj];
        if (y != null) m = Math.max(m, Math.abs(f(y) - a) / km);
      }
      return m;
    })),
  };
}

/** Surface current speed (knots) grid from the currents upload, at the step nearest now. */
function currentGrid(cur) {
  if (!cur?.times?.length) return null;
  let k = 0, bd = Infinity;
  cur.times.forEach((t, n) => { const d = Math.abs(Date.parse(t) - Date.now()); if (d < bd) { bd = d; k = n; } });
  return { lat: cur.lat, lon: cur.lon, v: cur.u[k].map((r, i) => r.map((u, j) => (u == null || cur.v[k][i][j] == null ? null : Math.hypot(u, cur.v[k][i][j]) * 0.0194384))) };
}

const monthOf = when => Number(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Mazatlan', month: 'numeric' }).format(when)) - 1;
const SEASON_MUL = [0.45, 0.7, 0.88, 1];

/** Samplers for one set of conditions (built once, used for every square). */
// Contexts are reused while the conditions, currents, grid and reach stay the same, so switching
// species (and the billfish bait map) doesn't sample the satellite grids again for every square.
const CTX = new WeakMap(); // conditions → Map(key → context)
const MARINA_REACH = (la, lo) => reachMul(nmFromMarina(la, lo));
const ids = new WeakMap(); let nextId = 1;
const idOf = o => (o == null ? 0 : (ids.get(o) || (ids.set(o, nextId), nextId++)));
function context(conditions, currents, opts = {}) {
  const B = opts.bathy || BATHY, reach = opts.reach || MARINA_REACH;
  if (!conditions || typeof conditions !== 'object') return makeContext(conditions, currents, B, reach);
  let m = CTX.get(conditions); if (!m) CTX.set(conditions, (m = new Map()));
  const key = `${idOf(currents)}|${idOf(B)}|${idOf(reach)}`;
  if (!m.has(key)) m.set(key, makeContext(conditions, currents, B, reach));
  return m.get(key);
}
function makeContext(conditions, currents, B, reach) {
  return {
    B, reach, cache: new Array(B.lat.length * B.lon.length), baits: new Map(),
    fine: Math.abs((B.lat[0] - B.lat[1]) || 1) < 0.02,
    sst: sampler(conditions?.sst, 3), chl: sampler(conditions?.chl, 3),
    brk: sampler(gradient(conditions?.sst), 3), edge: sampler(gradient(conditions?.chl, x => Math.log10(Math.max(x, 0.01))), 3),
    cur: sampler(currentGrid(currents), 2),
  };
}

/** One square, one species: signals, values and the 0–1 fit (before reach). null = no data, 0 = ruled out. */
function cell(sp, ctx, i, j, month, bait) {
  const B0 = ctx.B, la = B0.lat[i], lo = B0.lon[j], depth = B0.depth[i][j];
  if (depth == null) return null;
  const key = i * B0.lon.length + j;
  let cv = ctx.cache[key];
  if (!cv) cv = ctx.cache[key] = [ctx.sst(la, lo), ctx.chl(la, lo), ctx.brk(la, lo), ctx.edge(la, lo), ctx.cur(la, lo)];
  const [T, C, B, E, kt] = cv;
  const relief = B0.relief[i][j] ?? 0, w = W[sp.g];
  const s = {};
  s.temp = trap(T, sp.temp);
  s.depth = trap(depth, sp.depth);
  s.break = B == null ? null : clamp01(B / 0.04); // ~0.04 °C/km on the 5 km satellite grid = a strong break
  const pref = C == null ? null : (C >= sp.chl[0] && C <= sp.chl[1] ? 1 : clamp01(1 - Math.abs(Math.log10(C / (C < sp.chl[0] ? sp.chl[0] : sp.chl[1]))) / 0.6));
  s.color = pref == null ? null : 0.65 * pref + 0.35 * (E == null ? 0 : clamp01(E / 0.03));
  // Bottom relief: banks and drop-offs offshore; reefs and rocky points inshore (finer grid, ~1 km window).
  s.structure = sp.g === 'inshore' ? clamp01(relief / (ctx.fine ? 15 : 40)) : clamp01(relief / 350);
  s.current = kt == null ? null : clamp01(kt / 1.2) * (0.5 + 0.5 * s.structure);
  if (w.bait) s.bait = bait ? bait[i][j] : null;
  const vals = { la, lo, depth, relief, sst: T, chl: C, brk: B, kt };
  // Hard limits: wrong depth, or water clearly outside the species' range.
  if (s.depth === 0 || s.temp === 0) return { fit: 0, s, vals };
  let sum = 0, wsum = 0;
  for (const [k] of SIGNALS) if (w[k] && s[k] != null) { sum += w[k] * s[k]; wsum += w[k]; }
  if (!wsum || s.temp == null) return { fit: null, s, vals }; // no water temperature here: don't guess
  return { fit: (sum / wsum) * SEASON_MUL[sp.season[month] ?? 2], s, vals };
}

/** Best bait fit per square (0–1), for the billfish "bait" signal. */
function baitGrid(ctx, month) {
  return ctx.B.lat.map((_, i) => ctx.B.lon.map((__, j) => {
    let best = null;
    for (const b of BAIT) { const c = cell(b, ctx, i, j, month, null); if (c && c.fit != null) best = Math.max(best ?? 0, c.fit); }
    return best;
  }));
}

/**
 * Score every bathymetry square for one species.
 * conditions: /api/bookings/conditions response (sst, chl grids); currents: /api/bookings/currents `currents` (optional).
 * Returns { lat, lon, v: score[][] (null = land or no data, 0 = ruled out), month, seasonLevel, counts, cut, species }.
 */
export function scoreZones(species, conditions, currents, when = new Date(), opts = {}) {
  const sp = typeof species === 'string' ? SPECIES_BY_K[species] : species;
  const ctx = context(conditions, currents, opts), month = monthOf(when), B0 = ctx.B;
  const bait = W[sp.g].bait ? (ctx.baits.get(month) || ctx.baits.set(month, baitGrid(ctx, month)).get(month)) : null;
  const counts = { elite: 0, priority: 0, candidate: 0 };
  const v = B0.lat.map((la, i) => B0.lon.map((lo, j) => {
    const c = cell(sp, ctx, i, j, month, bait);
    if (!c || c.fit == null) return null;
    return Math.round(100 * c.fit * ctx.reach(la, lo));
  }));
  const sorted = v.flat().filter(x => x > 0).sort((a, b) => b - a);
  const cut = Object.fromEntries(TIERS.map(t => [t.k, Math.max(t.floor, sorted[Math.max(0, Math.ceil(sorted.length * t.top) - 1)] ?? 101)]));
  const z = { lat: B0.lat, lon: B0.lon, v, month, seasonLevel: sp.season[month] ?? 2, counts, cut, species: sp, ctx, bait };
  for (const x of sorted) { const t = tierOf(z, x); if (t) counts[t.k]++; }
  return z;
}

/** Everything behind one square's score, for the tap readout. */
export function explainAt(z, conditions, currents, lat, lon) {
  const sp = z.species, w = W[sp.g];
  const dla = Math.abs(z.lat[0] - z.lat[1]), dlo = Math.abs(z.lon[1] - z.lon[0]);
  const i = Math.round((z.lat[0] - lat) / dla), j = Math.round((lon - z.lon[0]) / dlo);
  if (i < 0 || j < 0 || i >= z.lat.length || j >= z.lon.length) return null;
  const c = cell(sp, z.ctx || context(conditions, currents), i, j, z.month, z.bait);
  if (!c) return { land: true };
  const { la, lo, depth, relief, sst, chl, brk, kt } = c.vals;
  return {
    score: z.v[i][j], tier: tierOf(z, z.v[i][j]), nm: nmFromMarina(la, lo), sst, chl, depth, relief, brk, kt, season: z.seasonLevel,
    bars: SIGNALS.filter(([k]) => w[k]).map(([k, en, es]) => ({ k, en, es, weight: w[k], value: c.s[k] })),
  };
}
