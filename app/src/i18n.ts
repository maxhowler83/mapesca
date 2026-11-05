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
  },
} as const;

export const t = T[LANG];
/** Picks the right language from an { en, es } object. */
export const L = (o: { en: string; es: string }) => o[LANG];
