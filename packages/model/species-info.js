import { INTL_REGIONS, INTL_SEASONS, JURIS as INTL_JURIS, INTL_LIMITS, INTL_CLOSURES, INTL_INFO, INTL_OCEAN } from './intl.js';
// Seasons, spawning and sport-fishing rules per species, for Mapesca.
//
// spawn: Jan…Dec, 0 = no spawning reported, 1 = within the reported range, 2 = peak.
//        null = no regional data — the app says so instead of guessing.
// conf:  'high' | 'medium' | 'low' — how well the spawning months are supported
//        for southern Baja / Gulf of California waters.
// limit: daily bag limit key (see LIMITS), from NOM-017-PESC-1994 as modified in 2013, §4.9.
// reserved50nm: reserved for sport fishing within 50 nm of the coast (NOM-017 §0.3).
// closed: official closed season (veda) — scores are set to 0 inside it.
//
// Sources are listed per species so anyone can check them. Months are only as
// precise as the studies; several important species have no regional data yet.

export const LIMITS = {
  billfish: { n: 1, en: '1 per angler per day (counts as 5 of the 10-fish total)', es: '1 por pescador al día (cuenta como 5 del total de 10)' },
  two: { n: 2, en: '2 per angler per day (each counts as 5 of the 10-fish total)', es: '2 por pescador al día (cada uno cuenta como 5 del total de 10)' },
  shark: { n: 1, en: '1 per angler per day (counts as 5 of the 10-fish total); none from May 1 to Jul 31', es: '1 por pescador al día (cuenta como 5 del total de 10); ninguno del 1 de mayo al 31 de julio' },
  general: { n: 5, en: 'Up to 10 fish per angler per day, no more than 5 of one species', es: 'Hasta 10 peces por pescador al día, no más de 5 de una especie' },
};
export const LIMITS_SOURCE = 'NOM-017-PESC-1994 (modificación DOF 2013), §4.9 · https://dof.gob.mx/nota_detalle_popup.php?codigo=5323155';

export const SHARK_VEDA = {
  from: [5, 1], to: [7, 31],
  en: 'Shark and ray closed season in the Mexican Pacific: May 1 – July 31 every year. Sport anglers may not keep sharks in this period.',
  es: 'Veda de tiburones y rayas en el Pacífico mexicano: del 1 de mayo al 31 de julio de cada año. En ese periodo no se pueden retener tiburones en pesca deportiva.',
  source: 'Acuerdo DOF, 5 jun 2012 (vigente 2026) · https://faolex.fao.org/docs/pdf/mex113933.pdf',
};

/** Species that may never be kept — always release (NOM-029-PESC-2006 §4.2.2). */
export const NEVER_KEEP = {
  en: ['Whale shark', 'White shark', 'Basking shark', 'Sawfish', 'Giant manta and mobula rays'],
  es: ['Tiburón ballena', 'Tiburón blanco', 'Tiburón peregrino', 'Pez sierra (Pristis)', 'Manta gigante y mantarrayas (Mobula)'],
  note: {
    en: 'Hammerhead sharks are not mapped: the scalloped hammerhead is critically endangered and its pups use Baja\'s coasts from May to August. Please release them.',
    es: 'Los tiburones martillo no aparecen en el mapa: el martillo común está en peligro crítico y sus crías usan las costas de Baja de mayo a agosto. Por favor, libéralos.',
  },
  source: 'NOM-029-PESC-2006 §4.2.2',
};

export const INFO = {
  'striped-marlin': { spawn: [0, 0, 0, 1, 1, 1, 2, 2, 2, 2, 1, 0], conf: 'medium', limit: 'billfish', reserved50nm: true,
    src: ['Sevilla-Rodríguez 2013, CICIMAR (Cabo San Lucas)', 'Bull. Mar. Sci. 79(3) 2006 (larvae, mouth of the Gulf)'] },
  'blue-marlin': { spawn: null, conf: 'low', limit: 'billfish', reserved50nm: true, src: ['No regional study found (W. Pacific spawns May–Sep)'] },
  'black-marlin': { spawn: null, conf: 'low', limit: 'billfish', reserved50nm: true, src: ['No eastern Pacific study found'] },
  'pacific-sailfish': { spawn: [0, 0, 0, 0, 0, 2, 2, 1, 1, 1, 1, 0], conf: 'medium', limit: 'billfish', reserved50nm: true,
    src: ['Hernández-Herrera et al. 2000, Pacific Science'] },
  'yellowfin-tuna': { spawn: [0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 2, 1], conf: 'medium', limit: 'general',
    src: ['Schaefer 1998, IATTC Bull. 21(5)', 'Klawe 1963, IATTC'] },
  dorado: { spawn: [0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 1, 1], conf: 'medium', limit: 'two', reserved50nm: true,
    src: ['Zúñiga-Flores et al. 2011, Marine Biology Research (southern Gulf of California)'] },
  wahoo: { spawn: null, conf: 'low', limit: 'general', src: ['No eastern Pacific study found'] },
  'skipjack-tuna': { spawn: [1, 0, 0, 2, 2, 2, 1, 1, 1, 1, 1, 1], conf: 'low', limit: 'general', src: ['Klawe 1963, IATTC (Revillagigedo)'] },
  'black-skipjack': { spawn: null, conf: 'low', limit: 'general', src: ['No usable month data'] },
  'striped-bonito': { spawn: null, conf: 'low', limit: 'general', src: ['No eastern Pacific study found'] },
  'pacific-bonito': { spawn: [0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0], conf: 'low', limit: 'general',
    src: ['CDFG 1978 monograph — "spring–summer", Pacific side of Baja'] },
  roosterfish: { spawn: null, conf: 'low', limit: 'two', reserved50nm: true, src: ['No published spawning study'] },
  sierra: { spawn: [0, 0, 0, 1, 2, 0, 0, 0, 0, 0, 0, 0], conf: 'medium', limit: 'general',
    src: ['Aguirre-Villaseñor et al. 2006, Ciencias Marinas (Mazatlán)'] },
  'jack-crevalle': { spawn: [0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 2, 0], conf: 'low', limit: 'general',
    src: ['Espino-Barr et al. 2008, Rev. Biol. Trop. (Colima)'] },
  yellowtail: { spawn: [0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0], conf: 'low', limit: 'general',
    src: ['Crooke 1983, CalCOFI Rep. 24 (Pacific Baja; no Gulf data)'] },
  'almaco-jack': { spawn: null, conf: 'low', limit: 'general', src: ['No wild study found'] },
  'pacific-dog-snapper': { spawn: null, conf: 'low', limit: 'general', src: ['López-Cardiel et al. 2026: season not yet described'] },
  'yellow-snapper': { spawn: [0, 0, 0, 0, 1, 1, 2, 2, 2, 1, 0, 0], conf: 'high', limit: 'general',
    src: ['Aburto-Oropeza et al. 2009, Marine Biology (Gulf of California)'] },
  'barred-pargo': { spawn: [0, 0, 0, 1, 2, 1, 2, 0, 0, 0, 0, 0], conf: 'medium', limit: 'general',
    src: ['Villalejo-Fuerte et al. 2025, LAJAR (Santa Rosalía, BCS)'] },
  'leopard-grouper': { spawn: [0, 0, 0, 1, 2, 1, 0, 0, 0, 0, 0, 0], conf: 'high', limit: 'general',
    src: ['Erisman et al. 2007, Marine Biology (central Gulf of California)'] },
  'mexican-barracuda': { spawn: null, conf: 'low', limit: 'general', src: ['No accessible study'] },
  'shortfin-mako': { spawn: [1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1], conf: 'low', limit: 'shark', closed: 'shark-veda', beta: true,
    src: ['Salomón-Aguilar et al. 2009, Ciencias Marinas', 'Conde-Moreno & Galván-Magaña 2006 (SW Baja nursery)'] },
  'blue-shark': { spawn: [0, 0, 0, 0, 2, 2, 2, 2, 2, 0, 0, 0], conf: 'medium', limit: 'shark', closed: 'shark-veda', beta: true,
    src: ['Carrera-Fernández 2004, CICIMAR (W coast BCS): pupping May–Jul, mating Aug–Sep'] },
  'silky-shark': { spawn: [0, 0, 0, 0, 0, 2, 1, 0, 0, 0, 0, 0], conf: 'low', limit: 'shark', closed: 'shark-veda', beta: true,
    src: ['Hoyos-Padilla et al. 2012 (W coast BCS)'] },
  'pelagic-thresher': { spawn: [1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1], conf: 'low', limit: 'shark', closed: 'shark-veda', beta: true,
    src: ['Salomón-Aguilar et al. 2009, Ciencias Marinas'] },
};

// ── Closed seasons (vedas) by region ────────────────────────────────────────
// NOM-017 §4.10: no sport fishing for a species in its closed season and zone.
// periods: [[fromMonth, fromDay, toMonth, toDay], …]; regions: season-region keys; areas: map-area keys.
const SHARKS = ['shortfin-mako', 'blue-shark', 'silky-shark', 'pelagic-thresher', 'bull-shark'];
const PACIFIC_REGIONS = ['cabo', 'pac-north', 'pac-central', 'pac-south', 'gulf-south', 'gulf-central', 'gulf-north', 'pac-mx-central', 'pac-mx-south', null];
export const CLOSURES = [
  { k: 'shark-pac', species: SHARKS, regions: PACIFIC_REGIONS, periods: [[5, 1, 7, 31]],
    en: 'Shark and ray closed season (Pacific): May 1 – Jul 31.', es: 'Veda de tiburones y rayas (Pacífico): 1 de mayo al 31 de julio.', source: 'Acuerdo DOF 2012 (vigente 2026)' },
  { k: 'shark-gom-west', species: SHARKS, regions: ['gom-west', 'caribe'], periods: [[5, 1, 6, 30]],
    en: 'Shark closed season (Tamaulipas, Veracruz, Quintana Roo): May 1 – Jun 30.', es: 'Veda de tiburón (Tamaulipas, Veracruz, Quintana Roo): 1 de mayo al 30 de junio.', source: 'Acuerdo DOF 15/05/2014' },
  { k: 'shark-gom-south', species: SHARKS, regions: ['gom-south'], periods: [[5, 15, 6, 15], [8, 1, 8, 29]],
    en: 'Shark closed season (Tabasco, Campeche, Yucatán): May 15 – Jun 15 and Aug 1 – 29.', es: 'Veda de tiburón (Tabasco, Campeche, Yucatán): 15 de mayo al 15 de junio y 1 al 29 de agosto.', source: 'Acuerdo DOF 15/05/2014' },
  { k: 'mero', species: ['red-grouper', 'black-grouper', 'goliath-grouper'], regions: ['gom-south', 'caribe'], periods: [[2, 1, 3, 31]],
    en: 'Grouper (mero) closed season, Tabasco to Quintana Roo: Feb 1 – Mar 31.', es: 'Veda de mero, de Tabasco a Quintana Roo: 1 de febrero al 31 de marzo.', source: 'Acuerdo DOF 24/02/2015 (mod. 2016, 2017)' },
  { k: 'snook-north', species: ['common-snook'], areas: ['tampico', 'tuxpan'], periods: [[5, 15, 6, 30]],
    en: 'Snook closed season, Soto la Marina to Chachalacas: May 15 – Jun 30.', es: 'Veda de robalo, de Soto la Marina a Chachalacas: 15 de mayo al 30 de junio.', source: 'Aviso DOF 16/03/1994' },
  { k: 'snook-south', species: ['common-snook'], areas: ['veracruz'], periods: [[7, 1, 8, 15]],
    en: 'Snook closed season, Chachalacas to Tonalá: Jul 1 – Aug 15.', es: 'Veda de robalo, de Chachalacas a Tonalá: 1 de julio al 15 de agosto.', source: 'Aviso DOF 16/03/1994' },
];
const md = (when, tz = 'America/Mazatlan') => { const [m, d] = new Intl.DateTimeFormat('en-US', { timeZone: tz, month: 'numeric', day: 'numeric' }).format(when).split('/').map(Number); return m * 100 + d; };
/** The closure in force for a species on a date in a region/area, or null. */
export function closureFor(k, when = new Date(), region = 'cabo', area = null) {
  // Full closures first; cr (catch-and-release only) closures don't remove zones.
  const hits = CLOSURES.filter(c => c.species.includes(k)
    && (c.areas ? c.areas.includes(area) : c.regions.includes(region))
    && c.periods.some(([fm, fd, tm, td]) => { const today = md(when, c.tz); return today >= fm * 100 + fd && today <= tm * 100 + td; }));
  return hits.find(c => !c.cr) || hits[0] || null;
}
/** Kept for older callers: Pacific rules. */
export function isClosed(k, when = new Date(), region = 'cabo', area = null) { const c = closureFor(k, when, region, area); return !!c && !c.cr; }

// ── Regional fishing seasons (Mapesca) ─────────────────────────────────────
// Jan…Dec on the 0–3 scale; null = the species isn't found / fished there (no zones).
// 'cabo' (Los Cabos, Todos Santos, East Cape) uses each species' own calendar in zones.js.
// Mostly LOW confidence: built from monthly fishing reports and local calendars, plus
// Guaymas yellowtail logbooks (Flores-Guzmán & Fernández-Rivera Melo 2019) and Mazatlán
// sailfish (Ramírez-Pérez et al. 2011). Tune with local captains' reports.
const S = str => (str == null ? null : [...str].map(Number));
const SNAPPER = { 'pac-north': null, 'pac-central': null, 'pac-south': S('111222222111'), 'gulf-south': S('111222332111'), 'gulf-central': S('000122221000'), 'gulf-north': S('000012221000') };
export const SEASONS = {
  'striped-marlin': { 'pac-north': S('000000122100'), 'pac-central': S('000000122100'), 'pac-south': S('100000012333'), 'gulf-south': S('221122111122'), 'gulf-central': S('000012332100'), 'gulf-north': null },
  'blue-marlin': { 'pac-north': null, 'pac-central': null, 'pac-south': S('000001232100'), 'gulf-south': S('000012333210'), 'gulf-central': S('000001232100'), 'gulf-north': null },
  'black-marlin': { 'pac-north': null, 'pac-central': null, 'pac-south': S('000000011100'), 'gulf-south': S('000011222100'), 'gulf-central': S('000000121100'), 'gulf-north': null },
  'pacific-sailfish': { 'pac-north': null, 'pac-central': null, 'pac-south': S('000000011100'), 'gulf-south': S('000012333321'), 'gulf-central': S('000001232100'), 'gulf-north': null },
  'yellowfin-tuna': { 'pac-north': S('000001223210'), 'pac-central': S('000001232100'), 'pac-south': S('211122333332'), 'gulf-south': S('111122333221'), 'gulf-central': S('000012332100'), 'gulf-north': S('000001110000') },
  dorado: { 'pac-north': S('000001223100'), 'pac-central': S('000001232100'), 'pac-south': S('100001233332'), 'gulf-south': S('000013333321'), 'gulf-central': S('000013333210'), 'gulf-north': S('000012333100') },
  wahoo: { 'pac-north': null, 'pac-central': null, 'pac-south': S('000000123321'), 'gulf-south': S('000012232100'), 'gulf-central': S('000000121000'), 'gulf-north': null },
  'skipjack-tuna': { 'pac-north': S('000001221000'), 'pac-central': S('000001221000'), 'pac-south': S('000012333210'), 'gulf-south': S('111123333211'), 'gulf-central': S('000123332100'), 'gulf-north': S('000001221000') },
  roosterfish: { 'pac-north': null, 'pac-central': null, 'pac-south': S('000012332100'), 'gulf-south': S('111233332111'), 'gulf-central': S('000012221000'), 'gulf-north': S('000001221000') },
  sierra: { 'pac-north': null, 'pac-central': null, 'pac-south': S('222111112222'), 'gulf-south': S('333221111233'), 'gulf-central': S('222211000122'), 'gulf-north': S('122100000022') },
  'jack-crevalle': { 'pac-north': null, 'pac-central': null, 'pac-south': S('111122222111'), 'gulf-south': S('222222222222'), 'gulf-central': S('111122222111'), 'gulf-north': S('000012221000') },
  yellowtail: { 'pac-north': S('222333333322'), 'pac-central': S('122333333221'), 'pac-south': S('333333222333'), 'gulf-south': S('333332111123'), 'gulf-central': S('233333332223'), 'gulf-north': S('223332101232') },
  'almaco-jack': { 'pac-north': null, 'pac-central': null, 'pac-south': S('111112222111'), 'gulf-south': S('222222222222'), 'gulf-central': S('111122222111'), 'gulf-north': S('111111111111') },
  'leopard-grouper': { 'pac-north': null, 'pac-central': null, 'pac-south': S('111111111111'), 'gulf-south': S('333322222233'), 'gulf-central': S('222333333222'), 'gulf-north': S('322332222333') },
  'pacific-dog-snapper': SNAPPER, 'yellow-snapper': SNAPPER, 'barred-pargo': SNAPPER,
  'mexican-barracuda': { 'pac-north': null, 'pac-central': null },
  // New northern species: not found around Los Cabos.
  'pacific-bluefin': { cabo: null, 'pac-north': S('001233333221'), 'pac-central': S('000123333210'), 'pac-south': S('001221000000'), 'gulf-south': null, 'gulf-central': null, 'gulf-north': null },
  'white-seabass': { cabo: null, 'pac-north': S('011233332111'), 'pac-central': S('222221112222'), 'pac-south': null, 'gulf-south': null, 'gulf-central': null, 'gulf-north': null },
  'calico-bass': { cabo: null, 'pac-north': S('112233333221'), 'pac-central': S('112233333221'), 'pac-south': S('222233333222'), 'gulf-south': null, 'gulf-central': null, 'gulf-north': null },
  'barred-sand-bass': { cabo: null, 'pac-north': S('000123332100'), 'pac-central': null, 'pac-south': null, 'gulf-south': null, 'gulf-central': null, 'gulf-north': null },
  'california-halibut': { cabo: null, 'pac-north': S('112233332111'), 'pac-central': null, 'pac-south': null, 'gulf-south': null, 'gulf-central': null, 'gulf-north': null },
  'gulf-corvina': { cabo: null, 'pac-north': null, 'pac-central': null, 'pac-south': null, 'gulf-south': null, 'gulf-central': null, 'gulf-north': S('013320000110') },
  'gulf-grouper': { cabo: null, 'pac-north': null, 'pac-central': null, 'pac-south': null, 'gulf-south': null, 'gulf-central': S('333222222233'), 'gulf-north': S('333222222233') },
};
/**
 * The season to score a species with in a region: the regional calendar when there
 * is one, the species' own (Los Cabos) calendar otherwise; null = not found there.
 * region null (big views) = the Los Cabos calendar, but never for northern-only species.
 */
// Which ocean each season region is in, and which ocean each species lives in.
export const REGION_OCEAN = { 'gom-west': 'atl', 'gom-south': 'atl', caribe: 'atl' }; // everything else: Pacific
for (const [r, x] of Object.entries(INTL_REGIONS)) REGION_OCEAN[r] = x.ocean;
/** Season regions with no fallback calendar (outside Mexico). */
export const STRICT_REGIONS = new Set(Object.keys(INTL_REGIONS));
export const OCEAN = {
  // Both oceans (same species in the Pacific and the Atlantic)
  'blue-marlin': 'both', 'pacific-sailfish': 'both', 'yellowfin-tuna': 'both', dorado: 'both', wahoo: 'both',
  'skipjack-tuna': 'both', 'almaco-jack': 'both', 'shortfin-mako': 'both', 'blue-shark': 'both', 'silky-shark': 'both',
  swordfish: 'both', 'bull-shark': 'both',
  // Atlantic only
  'white-marlin': 'atl', 'blackfin-tuna': 'atl', 'king-mackerel': 'atl', tarpon: 'atl', 'common-snook': 'atl', permit: 'atl',
  bonefish: 'atl', 'great-barracuda': 'atl', 'spanish-mackerel': 'atl', cero: 'atl', cobia: 'atl', 'greater-amberjack': 'atl',
  'atlantic-jack': 'atl', 'red-drum': 'atl', 'red-snapper': 'atl', 'mutton-snapper': 'atl', 'red-grouper': 'atl',
  'black-grouper': 'atl', 'goliath-grouper': 'atl',
};
Object.assign(OCEAN, INTL_OCEAN);
export const oceanOf = k => OCEAN[k] || 'pac';
export const regionOcean = r => (r && REGION_OCEAN[r]) || 'pac';

export function seasonFor(sp, region) {
  const o = oceanOf(sp.k);
  if (o !== 'both' && o !== regionOcean(region)) return null; // lives in the other ocean
  const byR = SEASONS[sp.k];
  if (region == null || region === 'cabo') {
    if (o === 'atl') return byR ? firstSeason(byR) : sp.season;
    if (byR && byR.cabo === null) return region == null ? firstSeason(byR) : null;
    if (byR && Array.isArray(byR.cabo)) return byR.cabo;
    if (!sp.season.some(x => x > 0)) return region == null ? firstSeason(byR || {}) : null; // not found around Los Cabos
    return sp.season;
  }
  if (byR && region in byR) return byR[region];
  if (STRICT_REGIONS.has(region)) return null; // outside Mexico: only species with a local calendar
  // No regional calendar yet: Pacific species fall back on their own (Los Cabos)
  // calendar — unless they aren't found around Los Cabos at all (northern species);
  // in the Atlantic only species with an Atlantic calendar show.
  if (regionOcean(region) === 'atl') return null;
  return sp.season.some(x => x > 0) ? sp.season : null;
}
const firstSeason = byR => Object.values(byR).find(v => Array.isArray(v)) || null;

Object.assign(INFO, {
  'pacific-bluefin': { spawn: null, conf: 'low', limit: 'general', beta: true, src: ['Spawns in the western Pacific, not in Mexico', 'Block & Farwell; Boustany et al. 2010 (temperatures)'] },
  'white-seabass': { spawn: [0, 0, 1, 2, 2, 2, 1, 1, 1, 0, 0, 0], conf: 'medium', limit: 'general', beta: true, src: ['Fajardo-Yamamoto 2023, CICESE thesis', 'OPC California white seabass assessment'] },
  'calico-bass': { spawn: [0, 0, 0, 0, 1, 2, 2, 2, 1, 0, 0, 0], conf: 'low', limit: 'general', beta: true, src: ['FishBase (depth); summer spawning, Pacific Baja'] },
  'barred-sand-bass': { spawn: null, conf: 'low', limit: 'general', beta: true, src: ['FishBase (depth); no regional spawning study'] },
  'california-halibut': { spawn: [0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0], conf: 'low', limit: 'general', beta: true, src: ['Spring–summer, earliest in Mexico (California assessments)'] },
  'gulf-corvina': { spawn: [0, 1, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0], conf: 'medium', limit: 'general', beta: true, src: ['Erisman et al. 2012 (Colorado River delta aggregations)'] },
  'gulf-grouper': { spawn: [0, 0, 0, 1, 2, 1, 0, 0, 0, 0, 0, 0], conf: 'medium', limit: 'two', beta: true, src: ['Spawning aggregations Apr–Jun; IUCN Endangered — consider releasing'] },
});
NEVER_KEEP.en.push('Totoaba (endangered; closed since 1975)');
NEVER_KEEP.es.push('Totoaba (en peligro; veda total desde 1975)');

// ── Seasons for the Mexican Pacific south and the Gulf of Mexico / Caribbean ──
// Mostly LOW confidence: from tournament calendars and local reports (no published
// monthly catch data for these coasts). Higher-confidence anchors: Caribbean sailfish
// (Isla Mujeres winter run), Holbox tarpon (Apr–Sep), Pacific sailfish movements
// (Macías-Zamora et al. 2011), snook and grouper spawning (Perera-García 2011; Brulé 1999).
const NEW = {
  // existing species
  'pacific-sailfish': { 'pac-mx-central': '222222233332', 'pac-mx-south': '333332222333', 'gom-west': '000112222100', 'gom-south': '000111111000', caribe: '233322100011' },
  'blue-marlin': { 'pac-mx-central': '111122233332', 'pac-mx-south': '222222222222', 'gom-west': '000123332100', 'gom-south': '000122221000', caribe: '111233332100' },
  'black-marlin': { 'pac-mx-central': '322111111123', 'pac-mx-south': '211111111112' },
  'striped-marlin': { 'pac-mx-central': '233321000012', 'pac-mx-south': '111110000001' },
  'yellowfin-tuna': { 'pac-mx-central': '222233333332', 'pac-mx-south': '222222222222', 'gom-west': '111222222111', 'gom-south': '111222222111', caribe: '111222222111' },
  dorado: { 'pac-mx-central': '222222233333', 'pac-mx-south': '222222222222', 'gom-west': '112333222111', 'gom-south': '112222221111', caribe: '112333222111' },
  wahoo: { 'pac-mx-central': '222222222222', 'pac-mx-south': '222222222222', 'gom-west': '111111111111', 'gom-south': '111111111111', caribe: '222222222222' },
  'skipjack-tuna': { 'pac-mx-central': '222222222222', 'pac-mx-south': '222222222222', 'gom-west': '222222222222', 'gom-south': '222222222222', caribe: '222222222222' },
  'black-skipjack': { 'pac-mx-central': '222222222222', 'pac-mx-south': '222222222222' },
  'striped-bonito': { 'pac-mx-central': '111111111111', 'pac-mx-south': '111111111111' },
  'pacific-bonito': { 'pac-mx-central': null, 'pac-mx-south': null },
  roosterfish: { 'pac-mx-central': '222333332222', 'pac-mx-south': '222222222222' },
  sierra: { 'pac-mx-central': '333222111233', 'pac-mx-south': '222222222222' },
  'jack-crevalle': { 'pac-mx-central': '222222222222', 'pac-mx-south': '222222222222' },
  'almaco-jack': { 'pac-mx-central': '222222222222', 'pac-mx-south': '222222222222', 'gom-west': '111111111111', 'gom-south': '222222222222', caribe: '222222222222' },
  'pacific-dog-snapper': { 'pac-mx-central': '222222222222', 'pac-mx-south': '222222222222' },
  'yellow-snapper': { 'pac-mx-central': '222222222222', 'pac-mx-south': '222222222222' },
  'barred-pargo': { 'pac-mx-central': '222222222222', 'pac-mx-south': '222222222222' },
  'leopard-grouper': { 'pac-mx-central': '111111111111', 'pac-mx-south': null },
  'mexican-barracuda': { 'pac-mx-central': '222222222222', 'pac-mx-south': '222222222222' },
  yellowtail: { 'pac-mx-central': null, 'pac-mx-south': null },
  'shortfin-mako': { 'pac-mx-central': '111111111111', 'pac-mx-south': '111111111111', 'gom-west': '111111111111', 'gom-south': '111111111111', caribe: '111111111111' },
  'blue-shark': { 'pac-mx-central': '111111111111', 'pac-mx-south': '111111111111', 'gom-west': '111111111111', 'gom-south': '111111111111', caribe: '111111111111' },
  'silky-shark': { 'pac-mx-central': '222222222222', 'pac-mx-south': '222222222222', 'gom-west': '111111111111', 'gom-south': '111111111111', caribe: '111111111111' },
  'pelagic-thresher': { 'pac-mx-central': '111111111111', 'pac-mx-south': '111111111111' },
  // new species
  'white-marlin': { 'gom-west': '000122221000', 'gom-south': '000111110000', caribe: '001233221000' },
  swordfish: { 'pac-mx-central': '111111111111', 'pac-mx-south': '111111111111', 'gom-west': '111111111111', 'gom-south': '111111111111', caribe: '111111111111' },
  'blackfin-tuna': { 'gom-west': '111111111111', 'gom-south': '111111111111', caribe: '222333222222' },
  'king-mackerel': { 'gom-west': '333221112333', 'gom-south': '222222222222', caribe: '222222222333' },
  tarpon: { 'gom-west': '112333332111', 'gom-south': '222333332222', caribe: '111233332111' },
  'common-snook': { 'gom-west': '333222222333', 'gom-south': '333322222333', caribe: '222222222222' },
  'pacific-snook': { 'pac-mx-central': '222222222222', 'pac-mx-south': '222222222222', 'pac-south': '111111111111', 'gulf-south': '111111111111' },
  permit: { 'gom-west': '111111111111', 'gom-south': '111111111111', caribe: '222222222222' },
  bonefish: { 'gom-west': null, 'gom-south': '111111111111', caribe: '222222222222' },
  'great-barracuda': { 'gom-west': '111111111111', 'gom-south': '222222222222', caribe: '222222222222' },
  'spanish-mackerel': { 'gom-west': '333222111233', 'gom-south': '333222222233', caribe: '111111111111' },
  cero: { 'gom-west': null, 'gom-south': '111111111111', caribe: '222222222222' },
  cobia: { 'gom-west': '222111111222', 'gom-south': '222222222222', caribe: '111111111111' },
  'greater-amberjack': { 'gom-west': '222222222222', 'gom-south': '222222222222', caribe: '222222222222' },
  'atlantic-jack': { 'gom-west': '333222222333', 'gom-south': '222222222222', caribe: '222222222222' },
  'red-drum': { 'gom-west': '333111111333', 'gom-south': null, caribe: null },
  'red-snapper': { 'gom-west': '222222222222', 'gom-south': '333333333333', caribe: '111111111111' },
  'mutton-snapper': { 'gom-west': '111111111111', 'gom-south': '222222222222', caribe: '222222222222' },
  'red-grouper': { 'gom-west': '111111111111', 'gom-south': '333333333333', caribe: '222222222222' },
  'black-grouper': { 'gom-west': null, 'gom-south': '222222222222', caribe: '222222222222' },
  'goliath-grouper': { 'gom-west': '111111111111', 'gom-south': '111111111111', caribe: '111111111111' },
  'pacific-goliath': { 'pac-mx-central': '111111111111', 'pac-mx-south': '111111111111' },
  'giant-sea-bass': { 'pac-north': '111111111111', 'pac-central': '111111111111' },
  'pacific-red-snapper': { 'pac-mx-central': '222222222222', 'pac-mx-south': '222222222222', cabo: null },
  'spotted-rose-snapper': { 'pac-mx-central': '222222222222', 'pac-mx-south': '222222222222', cabo: null },
  'bull-shark': { 'pac-mx-central': '111111111111', 'pac-mx-south': '111111111111', 'gom-west': '222222222222', 'gom-south': '222222222222', caribe: '222222222222' },
};
for (const [k, byR] of Object.entries(NEW)) {
  SEASONS[k] = SEASONS[k] || {};
  for (const [r, str] of Object.entries(byR)) SEASONS[k][r] = S(str);
}

Object.assign(INFO, {
  'white-marlin': { spawn: null, conf: 'low', limit: 'billfish', reserved50nm: true, beta: true, src: ['No Mexican spawning study found', 'FishBase (depth); Caribbean tournament calendars (season)'] },
  swordfish: { spawn: null, conf: 'low', limit: 'billfish', reserved50nm: true, beta: true, src: ['Upper Caribbean spawning Dec–Mar (NOAA); rarely targeted in Mexico'] },
  'blackfin-tuna': { spawn: null, conf: 'low', limit: 'general', beta: true, src: ['FishBase (depth, temperature)'] },
  'king-mackerel': { spawn: [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0], conf: 'low', limit: 'general', beta: true, src: ['NOAA (US Gulf data): May–Oct'] },
  tarpon: { spawn: [0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0], conf: 'medium', limit: 'two', reserved50nm: true, beta: true, src: ['Bonefish & Tarpon Trust: spawns offshore late spring–summer', 'Holbox: big fish Apr–Sep (local reports)'] },
  'common-snook': { spawn: [0, 0, 0, 1, 1, 1, 2, 2, 1, 0, 0, 0], conf: 'high', limit: 'general', beta: true, src: ['Perera-García et al. 2011 (Tabasco)', 'Minimum sizes by state (Plan de manejo, DOF 2014): check before keeping'] },
  'pacific-snook': { spawn: null, conf: 'low', limit: 'general', beta: true, src: ['No regional spawning study found'] },
  permit: { spawn: null, conf: 'low', limit: 'general', beta: true, src: ['Ascension Bay flats (Bonefish & Tarpon Trust 2021); catch and release is the local custom'] },
  bonefish: { spawn: null, conf: 'low', limit: 'general', beta: true, src: ['Quintana Roo flats (Bonefish & Tarpon Trust 2021); catch and release is the local custom'] },
  'great-barracuda': { spawn: null, conf: 'low', limit: 'general', beta: true, src: ['FishBase (depth)'] },
  'spanish-mackerel': { spawn: [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0], conf: 'low', limit: 'general', beta: true, src: ['NOAA (US Gulf data): Apr–Sep'] },
  cero: { spawn: null, conf: 'low', limit: 'general', beta: true, src: ['FishBase (depth)'] },
  cobia: { spawn: [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0], conf: 'low', limit: 'general', beta: true, src: ['NOAA (Gulf): late summer–early fall'] },
  'greater-amberjack': { spawn: [0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0], conf: 'low', limit: 'general', beta: true, src: ['NOAA: Mar–Jun'] },
  'atlantic-jack': { spawn: null, conf: 'low', limit: 'general', beta: true, src: ['FishBase (depth)'] },
  'red-drum': { spawn: null, conf: 'low', limit: 'general', beta: true, src: ['Tamaulipas and north Veracruz only'] },
  'red-snapper': { spawn: [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0], conf: 'low', limit: 'general', beta: true, src: ['NOAA (US Gulf data): May–Oct'] },
  'mutton-snapper': { spawn: null, conf: 'low', limit: 'general', beta: true, src: ['FishBase (depth, temperature)'] },
  'red-grouper': { spawn: [2, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0], conf: 'high', limit: 'general', beta: true, src: ['Brulé et al. 1999 (Campeche Bank)', 'Minimum size 36.3 cm (NOM-065-SAG/PESC-2014)'] },
  'black-grouper': { spawn: [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0], conf: 'medium', limit: 'general', beta: true, src: ['Renán et al. 1999 (southern Gulf of Mexico)'] },
  'goliath-grouper': { spawn: null, conf: 'low', limit: 'general', beta: true, src: ['Vulnerable (IUCN); fully protected in the US — please release it', 'Included in the Yucatán mero closed season (NOM-065)'] },
  'pacific-goliath': { spawn: null, conf: 'low', limit: 'general', beta: true, src: ['FishBase (depth); data deficient (IUCN)'] },
  'giant-sea-bass': { spawn: [0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0], conf: 'low', limit: 'billfish', beta: true, src: ['NOM-017: "pescada", 1 per day', 'Critically endangered (IUCN) — please release it'] },
  'pacific-red-snapper': { spawn: [0, 0, 0, 0, 0, 0, 1, 2, 1, 0, 0, 0], conf: 'medium', limit: 'general', beta: true, src: ['Santamaría-Miranda et al. (Guerrero): 2–3 spawning periods a year, peak August'] },
  'spotted-rose-snapper': { spawn: null, conf: 'low', limit: 'general', beta: true, src: ['FishBase (depth)'] },
  'bull-shark': { spawn: null, conf: 'low', limit: 'shark', beta: true, src: ['FishBase (depth); Playa del Carmen winter aggregation'] },
});

// ── US waters and the northern Caribbean (intl.js) ──
for (const [k, byR] of Object.entries(INTL_SEASONS)) {
  SEASONS[k] = SEASONS[k] || {};
  for (const [r, str] of Object.entries(byR)) SEASONS[k][r] = S(str);
}
CLOSURES.push(...INTL_CLOSURES);
Object.assign(INFO, INTL_INFO);
/** Jurisdictions: Mexico (NOM-017) plus the ones in intl.js. */
export const JURIS = {
  mx: { en: 'Mexico', es: 'México', agency: 'CONAPESCA', url: 'https://www.gob.mx/conapesca',
    license: { en: 'Sport-fishing license required (CONAPESCA), also for boats.', es: 'Se necesita permiso de pesca deportiva (CONAPESCA), también para las embarcaciones.' },
    neverKeep: NEVER_KEEP, source: LIMITS_SOURCE },
  ...INTL_JURIS,
};
export const LIMITS_BY_J = INTL_LIMITS;
/** Jurisdiction of a season region (Mexico unless intl.js says otherwise). */
export const jurisOf = r => (r && INTL_REGIONS[r]?.j) || 'mx';
