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

/** Is a date (Cabo time) inside this species' closed season? */
export function isClosed(k, when = new Date()) {
  if (INFO[k]?.closed !== 'shark-veda') return false;
  const [m, d] = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Mazatlan', month: 'numeric', day: 'numeric' })
    .format(when).split('/').map(Number);
  const md = m * 100 + d, a = SHARK_VEDA.from[0] * 100 + SHARK_VEDA.from[1], b = SHARK_VEDA.to[0] * 100 + SHARK_VEDA.to[1];
  return md >= a && md <= b;
}

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
export function seasonFor(sp, region) {
  const byR = SEASONS[sp.k];
  if (region == null || region === 'cabo') {
    if (byR && byR.cabo === null) return region == null ? firstSeason(byR) : null;
    return sp.season;
  }
  if (byR && region in byR) return byR[region];
  return sp.season;
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
