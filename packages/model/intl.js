// US waters and the northern Caribbean (Mapesca phase 1: California, US Gulf + Florida,
// Bahamas / Greater Antilles / Puerto Rico / Virgin Islands).
// Filled from the research in tools/research/<region>/ — every rule cites an official source.
//
// Season regions outside Mexico are STRICT: a species without a calendar there is not
// mapped (no fallback to the Los Cabos calendar).

/** Season regions: ocean and jurisdiction. */
export const INTL_REGIONS = {};
/** { species: { seasonRegion: '012233332100' | null } } */
export const INTL_SEASONS = {};
/** Jurisdictions other than Mexico: { j: { en, es, agency, url, license: {en, es}, neverKeep: {en: [], es: []}, read } } */
export const JURIS = {};
/** Per-jurisdiction limits: { j: { species: { en, es, src } } } */
export const INTL_LIMITS = {};
/** Full closed seasons (no retention): same shape as species-info.js CLOSURES. */
export const INTL_CLOSURES = [];
/** Info (spawning, sources) for species added for these waters. */
export const INTL_INFO = {};
