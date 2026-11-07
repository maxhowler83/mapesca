import { getLocales } from 'expo-localization';

export type Lang = 'es' | 'en';
export const LANG: Lang = getLocales()[0]?.languageCode === 'en' ? 'en' : 'es';

const T = {
  es: {
    today: 'Hoy',
    pick: 'Elige especie',
    elite: 'Élite', priority: 'Prioridad', candidate: 'Candidato',
    score: 'Puntuación',
    water: 'Agua', color: 'Clorofila',
    noZone: 'Fuera de las mejores zonas de hoy',
    noData: 'Sin datos aquí',
    closed: 'Área protegida: no se permite pescar',
    rules: 'Área protegida: revisa las reglas antes de pescar',
    updated: 'Datos satelitales del',
    loading: 'Cargando el agua de hoy…',
    offline: 'No pudimos descargar los datos. Revisa tu conexión.',
    retry: 'Reintentar',
    about: 'Acerca de',
    close: 'Cerrar',
    by: 'Un regalo de',
    sources: 'Fuentes',
    free: 'Gratis para todos, para siempre.',
    season: ['Fuera de temporada', 'Temporada baja', 'Buena temporada', 'Temporada alta'],
    seasons: 'Temporadas', fishing: 'Pesca', spawning: 'Reproducción', peak: 'pico',
    noSpawnData: 'Aún no hay estudios de la región sobre su reproducción.',
    confidence: { high: 'confianza alta', medium: 'confianza media', low: 'confianza baja' },
    rulesTitle: 'Reglas', limit: 'Límite', reserved: 'Reservada a la pesca deportiva a menos de 50 mn de la costa.',
    vedaNow: 'Veda en curso: no se marcan zonas.', beta: 'Perfil en prueba: puede fallar más que las otras especies.',
    sharks: 'Tiburones', neverKeep: 'Nunca se retienen (siempre liberar):',
    checkRules: 'Revisa las reglas vigentes de', intlDisclaimer: 'Solo es un resumen. Mandan las reglas oficiales; revisa límites, tallas y temporadas antes de salir.', license: 'Licencia',
    months: ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
  },
  en: {
    today: 'Today',
    pick: 'Choose species',
    elite: 'Elite', priority: 'Priority', candidate: 'Candidate',
    score: 'Score',
    water: 'Water', color: 'Chlorophyll',
    noZone: 'Outside today\'s best zones',
    noData: 'No data here',
    closed: 'Protected area: no fishing allowed',
    rules: 'Protected area: check the rules before fishing',
    updated: 'Satellite data from',
    loading: 'Loading today\'s water…',
    offline: 'We couldn\'t download the data. Check your connection.',
    retry: 'Try again',
    about: 'About',
    close: 'Close',
    by: 'A gift from',
    sources: 'Sources',
    free: 'Free for everyone, forever.',
    season: ['Off season', 'Low season', 'Good season', 'Peak season'],
    seasons: 'Seasons', fishing: 'Fishing', spawning: 'Spawning', peak: 'peak',
    noSpawnData: 'No regional spawning studies yet.',
    confidence: { high: 'high confidence', medium: 'medium confidence', low: 'low confidence' },
    rulesTitle: 'Rules', limit: 'Limit', reserved: 'Reserved for sport fishing within 50 nm of the coast.',
    vedaNow: 'Closed season now: no zones are shown.', beta: 'Test profile: expect more misses than other species.',
    sharks: 'Sharks', neverKeep: 'Never kept (always release):',
    checkRules: 'Check the current rules of', intlDisclaimer: 'Summary only. The official rules always win; check limits, sizes and seasons before you go.', license: 'License',
    months: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
  },
} as const;

export const t = T[LANG];
/** Picks the right language from an { en, es } object. */
export const L = (o: { en: string; es: string }) => o[LANG];
