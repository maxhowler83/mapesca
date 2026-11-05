import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Map, Camera, GeoJSONSource, Layer, UserLocation, StaticMapImageManager, type CameraRef } from '@maplibre/maplibre-react-native';
import * as Location from 'expo-location';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import {
  loadInputs, loadCoast, compute, explain, pinText, AREAS, AREAS_BY_K, areaFor, PORTS, SPECIES_BY_K, outlookDays, caboToday,
  nmBetween, bearing, minutesAt, fmtDuration, crossesLand, NM_TO_MI, NM_TO_KM, parseCoords, areaAt,
  type Inputs, type Result,
} from './src/engine';
import type { Manifest, SpeciesInfo } from './src/data';
import { t, L, LANG } from './src/i18n';
import { C } from './src/theme';

const ES = LANG === 'es';
// Free vector map, no key or per-use fees (OpenFreeMap, © OpenStreetMap contributors).
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';
// The map can't pan or zoom out past the data area (plus a small margin).
const PAN_BOUNDS: [number, number, number, number] = [-116.6, 21.4, -107.8, 29.0];
function fitZoom() {
  const { width, height } = Dimensions.get('window');
  const mercY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
  const zx = Math.log2((width * 360) / ((PAN_BOUNDS[2] - PAN_BOUNDS[0]) * 512));
  const zy = Math.log2((height * 2 * Math.PI) / ((mercY(PAN_BOUNDS[3]) - mercY(PAN_BOUNDS[1])) * 512));
  return Math.min(zx, zy);
}
const MIN_ZOOM = fitZoom();
const rgb = (c: number[]) => `rgb(${c[0]},${c[1]},${c[2]})`;
const TIER_COLOR: any = ['match', ['get', 'tier'], 'elite', 'rgb(214,40,57)', 'priority', 'rgb(244,125,32)', 'rgb(242,184,64)'];
const TIER_OPACITY: any = ['match', ['get', 'tier'], 'elite', 0.75, 'priority', 0.55, 0.38];
const boundsOf = (b: { w: number; e: number; s: number; n: number }): [number, number, number, number] => [b.w, b.s, b.e, b.n];
const PAD = { top: 190, bottom: 210, left: 24, right: 24 };
const wd = (iso: string, opt: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(ES ? 'es-MX' : 'en-US', { timeZone: 'UTC', ...opt }).format(new Date(`${iso}T12:00:00Z`));
type Pt = { lat: number; lon: number; name?: string };

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Main />
    </SafeAreaProvider>
  );
}

function Main() {
  const [inp, setInp] = useState<Inputs | null>(null);
  const [error, setError] = useState(false);
  const [sp, setSp] = useState('striped-marlin');
  const [area, setArea] = useState('cabo');
  const [day, setDay] = useState('');
  const [res, setRes] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [pin, setPin] = useState<Pt | null>(null);
  // Route: A is a port (auto = nearest the pin), the GPS or a point tapped on the map.
  const [ptA, setPtA] = useState<Pt | null>(null);
  const [aAuto, setAAuto] = useState(true);
  const [pickA, setPickA] = useState(false);
  const [kt, setKt] = useState(20);
  const [sheet, setSheet] = useState<null | 'species' | 'about' | 'detail' | 'goto' | 'from'>(null);
  const [msg, setMsg] = useState('');
  const [showUser, setShowUser] = useState(false);
  const [sharing, setSharing] = useState(false);
  const cam = useRef<CameraRef>(null);

  const load = useCallback(() => {
    setError(false);
    loadInputs().then(setInp).catch(() => setError(true));
  }, []);
  useEffect(load, [load]);
  useEffect(() => { Location.getForegroundPermissionsAsync().then(r => setShowUser(r.granted)).catch(() => {}); }, []);

  // Score (on the phone) whenever species, area or day change.
  useEffect(() => {
    if (!inp) return;
    let alive = true;
    setBusy(true);
    (async () => {
      if (SPECIES_BY_K[sp].g === 'inshore') { try { await loadCoast(inp); } catch {} }
      await new Promise(r => setTimeout(r, 30)); // let the spinner paint
      if (!alive) return;
      try { setRes(compute(inp, sp, area, day)); } catch { setRes(null); }
      setBusy(false);
    })();
    return () => { alive = false; };
  }, [inp, sp, area, day]);

  const days = useMemo(() => (inp?.outlook ? outlookDays(inp.outlook) : []), [inp]);
  const species = inp?.manifest.species.find(s => s.k === sp) as SpeciesInfo | undefined;
  const spName = species ? L(species) : '';

  const goArea = (k: string) => { setArea(k); cam.current?.fitBounds(boundsOf(AREAS_BY_K[k].box), { padding: PAD, duration: 600 }); };
  const goTo = (p: Pt) => {
    const a = areaFor(p.lat, p.lon);
    if (!a) { setMsg(ES ? `${pinText(p)} está fuera del mapa.` : `${pinText(p)} is outside the map.`); return; }
    setPin(p); setMsg(''); setArea(a.k);
    cam.current?.flyTo({ center: [p.lon, p.lat], zoom: 9, duration: 700 });
  };
  const nearestA = (p: Pt) => { let bi = 0; PORTS.forEach((q: any, i: number) => { if (nmBetween(q, p) < nmBetween(PORTS[bi], p)) bi = i; }); return { ...PORTS[bi] }; };
  const A = pin ? (aAuto ? nearestA(pin) : ptA) : null;

  async function myLocation(then: (p: Pt) => void) {
    setMsg(ES ? 'Buscando tu ubicación…' : 'Finding your location…');
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) { setMsg(ES ? 'La ubicación está bloqueada para Mapesca.' : 'Location is blocked for Mapesca.'); return; }
      setShowUser(true);
      const g = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setMsg(''); then({ lat: g.coords.latitude, lon: g.coords.longitude });
    } catch { setMsg(ES ? 'No se pudo obtener tu ubicación.' : 'Couldn’t get your location.'); }
  }

  const onPress = (e: any) => {
    const [lon, lat] = e.nativeEvent.lngLat;
    if (pickA) { setPickA(false); setAAuto(false); setPtA({ lat, lon }); return; }
    setPin({ lat, lon }); setMsg('');
  };

  // Pin, A and the dashed line between them, as map layers (also used in the shared image).
  const marks = useMemo<GeoJSON.FeatureCollection>(() => {
    const f: GeoJSON.Feature[] = [];
    if (pin && A) f.push({ type: 'Feature', properties: { k: 'route' }, geometry: { type: 'LineString', coordinates: [[A.lon, A.lat], [pin.lon, pin.lat]] } });
    if (A && pin) f.push({ type: 'Feature', properties: { k: 'a' }, geometry: { type: 'Point', coordinates: [A.lon, A.lat] } });
    if (pin) f.push({ type: 'Feature', properties: { k: 'pin' }, geometry: { type: 'Point', coordinates: [pin.lon, pin.lat] } });
    return { type: 'FeatureCollection', features: f };
  }, [pin, A?.lat, A?.lon]);

  async function share() {
    if (!res || !inp) return;
    setSharing(true);
    try {
      const style = await fetch(MAP_STYLE).then(r => r.json());
      style.sources.zones = { type: 'geojson', data: res.geojson };
      style.sources.pa = { type: 'geojson', data: inp.protectedFc };
      style.sources.marks = { type: 'geojson', data: marks };
      style.layers.push(
        { id: 'zones', type: 'fill', source: 'zones', paint: { 'fill-color': TIER_COLOR, 'fill-opacity': TIER_OPACITY } },
        { id: 'pa', type: 'line', source: 'pa', paint: { 'line-color': ['match', ['get', 'rule'], 'no-take', C.closed, C.rules], 'line-width': 1.5, 'line-dasharray': [2, 2] } },
        { id: 'route', type: 'line', source: 'marks', filter: ['==', ['get', 'k'], 'route'], paint: { 'line-color': C.ink, 'line-width': 2.5, 'line-dasharray': [2, 1.5] } },
        { id: 'pts', type: 'circle', source: 'marks', filter: ['!=', ['get', 'k'], 'route'], paint: { 'circle-radius': 7, 'circle-color': ['match', ['get', 'k'], 'pin', C.ink, '#fff'], 'circle-stroke-color': C.ink, 'circle-stroke-width': 2.5 } },
      );
      const uri = await StaticMapImageManager.createImage({ mapStyle: style, bounds: boundsOf(AREAS_BY_K[area].box), width: 1080 / 3, height: 1350 / 3, output: 'file', logo: false });
      const url = uri.startsWith('file://') ? uri : `file://${uri}`;
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(url, { mimeType: 'image/png', dialogTitle: `${spName} · Mapesca`, UTI: 'public.png' });
      }
    } catch { setMsg(ES ? 'No se pudo compartir la imagen.' : 'Couldn’t share the image.'); }
    setSharing(false);
  }

  if (error && !inp) {
    return (
      <SafeAreaView style={s.center}>
        <Text style={s.body}>{t.offline}</Text>
        <Pressable style={s.button} onPress={load}><Text style={s.buttonText}>{t.retry}</Text></Pressable>
      </SafeAreaView>
    );
  }

  const sat = inp?.conditions?.sst?.date;
  const dayInfo: any = days.find((d: any) => d.date === day);
  const dateLine = !sat ? '' : dayInfo
    ? (ES ? `Pronóstico para el ${wd(day, { weekday: 'long', day: 'numeric', month: 'short' })} · ${dayInfo.conf.es.toLowerCase()}` : `Outlook for ${wd(day, { weekday: 'long', month: 'short', day: 'numeric' })} · ${dayInfo.conf.en.toLowerCase()}`)
    : (ES ? `Satélite NOAA del ${wd(sat, { day: 'numeric', month: 'short' })}` : `NOAA satellite of ${wd(sat, { month: 'short', day: 'numeric' })}`);
  const note = !res || !species ? '' : res.closedSeason ? t.vedaNow : !res.here
    ? (ES ? `${day ? 'Ese día no se ve' : 'Hoy no hay'} agua que destaque para ${spName.toLowerCase()} en esta área. Prueba otra área.` : `No water stands out for ${spName.toLowerCase()} in this area ${day ? 'that day' : 'today'}. Try another area.`)
    : species.g === 'bait' ? (ES ? 'Zonas de carnada: los picudos siguen a la carnada.' : 'Bait zones: billfish follow the bait.')
    : day ? (ES ? 'Pronóstico: el satélite de hoy movido con el pronóstico oceánico. Revisa otra vez la mañana de tu viaje.' : 'Outlook: today’s satellite moved forward with the ocean forecast. Check again the morning of your trip.')
    : (ES ? 'Guía de condiciones, no garantía de pesca.' : 'A guide to conditions, not a promise of fish.');

  return (
    <View style={s.fill}>
      <Map style={s.fill} mapStyle={MAP_STYLE} logo={false} attribution attributionPosition={{ bottom: 8, left: 8 }} compass={false} onPress={onPress}>
        <Camera ref={cam} initialViewState={{ bounds: boundsOf(AREAS_BY_K.cabo.box), padding: PAD }} minZoom={MIN_ZOOM} maxZoom={14} maxBounds={PAN_BOUNDS} />
        {res && (
          <GeoJSONSource id="zones" data={res.geojson}>
            <Layer type="fill" id="zones-fill" paint={{ 'fill-color': TIER_COLOR, 'fill-opacity': TIER_OPACITY }} />
          </GeoJSONSource>
        )}
        {inp && (
          <GeoJSONSource id="protected" data={inp.protectedFc}>
            <Layer type="fill" id="protected-fill" filter={['==', ['get', 'rule'], 'no-take']} paint={{ 'fill-color': C.closed, 'fill-opacity': 0.25 }} />
            <Layer type="line" id="protected-line" paint={{ 'line-color': ['match', ['get', 'rule'], 'no-take', C.closed, C.rules], 'line-width': 1.5, 'line-dasharray': [2, 2] }} />
            <Layer type="symbol" id="protected-label" minzoom={6.5}
              layout={{ 'text-field': ['get', 'name'], 'text-size': 12, 'text-max-width': 10, 'text-font': ['Noto Sans Bold'] }}
              paint={{ 'text-color': ['match', ['get', 'rule'], 'no-take', C.closed, C.rules], 'text-halo-color': '#fff', 'text-halo-width': 1.5 }} />
          </GeoJSONSource>
        )}
        <GeoJSONSource id="marks" data={marks}>
          <Layer type="line" id="route-halo" filter={['==', ['get', 'k'], 'route']} paint={{ 'line-color': '#fff', 'line-width': 5 }} />
          <Layer type="line" id="route" filter={['==', ['get', 'k'], 'route']} paint={{ 'line-color': C.ink, 'line-width': 2.5, 'line-dasharray': [2, 1.5] }} />
          <Layer type="circle" id="pts" filter={['!=', ['get', 'k'], 'route']} paint={{ 'circle-radius': ['match', ['get', 'k'], 'pin', 8, 9], 'circle-color': ['match', ['get', 'k'], 'pin', C.ink, '#fff'], 'circle-stroke-color': ['match', ['get', 'k'], 'pin', '#fff', C.ink], 'circle-stroke-width': 2.5 }} />
          <Layer type="symbol" id="pt-a" filter={['==', ['get', 'k'], 'a']} layout={{ 'text-field': 'A', 'text-size': 11, 'text-font': ['Noto Sans Bold'], 'text-allow-overlap': true }} paint={{ 'text-color': C.ink }} />
        </GeoJSONSource>
        {showUser && <UserLocation />}
      </Map>

      {/* Top: species, areas, days */}
      <SafeAreaView edges={['top']} style={s.top} pointerEvents="box-none">
        <View style={s.topRow}>
          <Pressable style={s.pill} onPress={() => setSheet('species')} accessibilityRole="button" accessibilityLabel={t.pick}>
            <Text style={s.pillLabel}>{day ? (ES ? 'Pronóstico' : 'Outlook') : t.today}</Text>
            <Text style={s.pillTitle} numberOfLines={1}>{species ? spName : t.loading}</Text>
          </Pressable>
          <Pressable style={s.round} onPress={() => setSheet('detail')} accessibilityLabel={`${t.seasons} · ${t.rulesTitle}`}><Text style={s.roundText}>📅</Text></Pressable>
          <Pressable style={s.round} onPress={() => setSheet('about')} accessibilityLabel={t.about}><Text style={[s.roundText, { fontStyle: 'italic' }]}>i</Text></Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
          {AREAS.map((a: any) => (
            <Pressable key={a.k} onPress={() => goArea(a.k)} style={[s.mchip, area === a.k && s.mchipOn]}>
              <Text style={[s.mchipText, area === a.k && s.mchipTextOn]}>{L(a)}</Text>
            </Pressable>
          ))}
        </ScrollView>
        {days.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
            <Pressable onPress={() => setDay('')} style={[s.dchip, !day && s.mchipOn]}>
              <Text style={[s.dTop, !day && s.mchipTextOn]}>{t.today}</Text>
              <Text style={[s.dSub, !day && s.mchipTextOn]}>{wd(caboToday(), { day: 'numeric', month: 'short' })}</Text>
            </Pressable>
            {days.map((d: any) => (
              <Pressable key={d.date} onPress={() => setDay(d.date)} style={[s.dchip, day === d.date && s.mchipOn]}>
                <Text style={[s.dTop, day === d.date && s.mchipTextOn]}>{wd(d.date, { weekday: 'short' })}</Text>
                <Text style={[s.dSub, day === d.date && s.mchipTextOn]}>{wd(d.date, { day: 'numeric', month: 'short' })}</Text>
                <View style={[s.confDot, { backgroundColor: d.conf.k === 'good' ? C.rules : d.conf.k === 'fair' ? '#E6A93C' : C.muted }]} />
              </Pressable>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>

      {/* Right: my location, go to coordinates, share */}
      <View style={s.fabs} pointerEvents="box-none">
        <Pressable style={s.fab} onPress={() => myLocation(goTo)} accessibilityLabel={ES ? 'Mi ubicación' : 'My location'}><Text style={s.fabText}>➤</Text></Pressable>
        <Pressable style={s.fab} onPress={() => setSheet('goto')} accessibilityLabel={ES ? 'Ir a coordenadas' : 'Go to coordinates'}><Text style={s.fabText}>⌖</Text></Pressable>
        <Pressable style={s.fab} onPress={share} disabled={sharing} accessibilityLabel={ES ? 'Compartir' : 'Share'}>{sharing ? <ActivityIndicator /> : <Text style={s.fabText}>⇪</Text>}</Pressable>
      </View>

      {/* Bottom: pin card, or legend + date + note */}
      <SafeAreaView edges={['bottom']} style={s.bottom} pointerEvents="box-none">
        {pickA ? (
          <View style={s.card}><Text style={s.body}>{ES ? 'Toca el mapa para poner el punto A.' : 'Tap the map to set point A.'}</Text></View>
        ) : pin && res ? (
          <PinCard res={res} pin={pin} A={A!} aAuto={aAuto} kt={kt} setKt={setKt} land={inp?.land} areas={inp?.areas || []} day={day}
            onFrom={() => setSheet('from')} onClear={() => setPin(null)} />
        ) : (
          <>
            {!!msg && <View style={[s.card, { marginBottom: 8 }]}><Text style={s.body}>{msg}</Text></View>}
            <View style={s.legend}>
              {inp?.manifest.tiers.map(x => (
                <View key={x.k} style={s.legendItem}><View style={[s.dot, { backgroundColor: rgb(x.color) }]} /><Text style={s.legendText}>{L(x)}</Text></View>
              ))}
              {(busy || !inp) && <ActivityIndicator style={{ marginLeft: 4 }} />}
            </View>
            {!!note && <Text style={s.note}>{note}</Text>}
            {!!dateLine && <Text style={s.updated}>{dateLine}</Text>}
          </>
        )}
      </SafeAreaView>

      {/* Sheets */}
      <Sheet open={sheet === 'species'} onClose={() => setSheet(null)} title={t.pick}>
        {inp?.manifest.groups.map(g => (
          <View key={g.k} style={{ marginBottom: 12 }}>
            <Text style={s.groupTitle}>{L(g)}</Text>
            <View style={s.chips}>
              {inp.manifest.species.filter(x => x.g === g.k).map(x => (
                <Pressable key={x.k} style={[s.chip, x.k === sp && s.chipOn]} onPress={() => { setSp(x.k); setSheet(null); }}>
                  <Text style={[s.chipText, x.k === sp && s.chipTextOn]}>{L(x)}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </Sheet>

      <Sheet open={sheet === 'detail'} onClose={() => setSheet(null)}>
        {species && inp && <SpeciesDetail species={species} manifest={inp.manifest} />}
      </Sheet>

      <GotoSheet open={sheet === 'goto'} onClose={() => setSheet(null)} onGo={p => { setSheet(null); goTo(p); }} />

      <Sheet open={sheet === 'from'} onClose={() => setSheet(null)} title={ES ? 'Desde (A)' : 'From (A)'}>
        <Pressable style={s.row} onPress={() => { setSheet(null); setAAuto(true); }}><Text style={s.body}>{ES ? 'Puerto más cercano al pin' : 'Port nearest the pin'}</Text></Pressable>
        <Pressable style={s.row} onPress={() => { setSheet(null); myLocation(p => { setAAuto(false); setPtA({ ...p, name: ES ? 'tu ubicación' : 'your location' }); }); }}><Text style={s.body}>{ES ? 'Mi ubicación (GPS)' : 'My location (GPS)'}</Text></Pressable>
        <Pressable style={s.row} onPress={() => { setSheet(null); setPickA(true); }}><Text style={s.body}>{ES ? 'Un punto en el mapa…' : 'A point on the map…'}</Text></Pressable>
        <Text style={s.groupTitle}>{ES ? 'Puertos' : 'Ports'}</Text>
        {PORTS.map((p: any) => (
          <Pressable key={p.name} style={s.row} onPress={() => { setSheet(null); setAAuto(false); setPtA({ ...p }); }}><Text style={s.body}>{p.name}</Text></Pressable>
        ))}
      </Sheet>

      <Sheet open={sheet === 'about'} onClose={() => setSheet(null)} title="Mapesca">
        <Text style={s.body}>{t.free}</Text>
        {inp && <Text style={[s.body, { marginTop: 12 }]}>{L(inp.manifest.notice)}</Text>}
        <Text style={s.groupTitle}>{t.by}</Text>
        {inp?.manifest.by.map(b => <Text key={b} style={s.body}>{b}</Text>)}
        {inp && (
          <>
            <Text style={s.groupTitle}>{t.sharks}</Text>
            <Text style={s.body}>{L(inp.manifest.rules.sharkVeda)}</Text>
            <Text style={[s.body, { marginTop: 8, fontWeight: '600' }]}>{t.neverKeep}</Text>
            {inp.manifest.rules.neverKeep[LANG].map(n => <Text key={n} style={s.body}>· {n}</Text>)}
            <Text style={[s.body, { marginTop: 8 }]}>{L(inp.manifest.rules.neverKeep.note)}</Text>
          </>
        )}
        <Text style={s.groupTitle}>{t.sources}</Text>
        {inp?.manifest.attribution.map(a => <Text key={a} style={s.small}>{a}</Text>)}
        <Text style={s.small}>© OpenStreetMap contributors · OpenFreeMap</Text>
        <Text style={[s.small, { marginTop: 8 }]}>{ES ? 'Solo para planear, no para navegar. Sigue siempre a la Capitanía de Puerto.' : 'For planning only, not for navigation. Always follow the Port Captain.'}</Text>
      </Sheet>
    </View>
  );
}

/** Pin readout (tier, facts, why) + distance and running time from A (Bite Map). */
function PinCard({ res, pin, A, aAuto, kt, setKt, land, areas, day, onFrom, onClear }: {
  res: Result; pin: Pt; A: Pt; aAuto: boolean; kt: number; setKt: (n: number) => void; land: any; areas: any[]; day: string; onFrom: () => void; onClear: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const x = useMemo(() => explain(res, pin.lat, pin.lon, ES), [res, pin]);
  const pa = areaAt(areas, pin.lat, pin.lon);
  const nm = nmBetween(A, pin), min = minutesAt(nm, kt), brg = bearing(A, pin);
  const crosses = useMemo(() => (land ? crossesLand(A, pin, land) : false), [A.lat, A.lon, pin, land]);
  const f1 = (v: number) => (v < 10 ? v.toFixed(1) : String(Math.round(v)));
  const aName = A.name || (ES ? 'el punto A' : 'point A');
  const txt = pinText(pin);
  return (
    <ScrollView style={s.cardScroll} contentContainerStyle={s.card} keyboardShouldPersistTaps="handled">
      <View style={s.cardHead}>
        <Text style={s.pinTxt}>📍 {txt}</Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <Pressable style={s.mini} onPress={() => Clipboard.setStringAsync(txt).then(() => setCopied(true))}><Text style={s.miniText}>{copied ? (ES ? 'Copiado' : 'Copied') : (ES ? 'Copiar' : 'Copy')}</Text></Pressable>
          <Pressable style={s.mini} onPress={onClear}><Text style={s.miniText}>✕</Text></Pressable>
        </View>
      </View>
      {pa && <Text style={[s.badge, { color: pa.rule === 'no-take' ? C.closed : C.rules }]}>{pa.rule === 'no-take' ? t.closed : t.rules} · {pa.name}</Text>}
      {x.kind === 'outside' && <Text style={s.body}>{ES ? 'Fuera del área del mapa.' : 'Outside the map area.'}</Text>}
      {x.kind === 'land' && <Text style={s.body}>{x.inshore ? (ES ? 'Tierra, o agua de más de 150 m: muy hondo para peces costeros.' : 'Land, or water deeper than 150 m: too deep for inshore fish.') : (ES ? 'Eso es tierra. Toca el agua.' : 'That’s land. Tap the water.')}</Text>}
      {x.kind === 'cloud' && <Text style={s.body}>{ES ? 'El satélite no vio este punto (nubes). Prueba otro.' : 'The satellite couldn’t see this spot (clouds). Try another.'}</Text>}
      {x.kind === 'ok' && (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <Text style={[s.tier, { backgroundColor: x.tier ? rgb(x.tier.color) : C.line, color: x.tier ? '#fff' : C.ink }]}>
              {x.tier ? L(x.tier) : (ES ? (day ? 'Menos probable ese día' : 'Menos probable hoy') : (day ? 'Less likely that day' : 'Less likely today'))}
            </Text>
          </View>
          <Text style={[s.body, { marginTop: 6 }]}>
            {[`${x.sst.toFixed(1)} °C · ${Math.round(x.sst * 9 / 5 + 32)} °F`,
              x.depth != null ? `${Math.round(x.depth).toLocaleString(ES ? 'es-MX' : 'en-US')} m · ${Math.round(x.depth * 3.281).toLocaleString(ES ? 'es-MX' : 'en-US')} ft` : null,
            ].filter(Boolean).join('  ·  ')}
          </Text>
          {x.why.length > 0 && <Text style={[s.small, { marginTop: 4 }]}>{ES ? 'Por qué' : 'Why'}: {x.why.join(', ')}.</Text>}
        </>
      )}
      <View style={s.divider} />
      <View style={s.cardHead}>
        <Pressable onPress={onFrom}><Text style={s.statLabel}>{ES ? 'Desde (A)' : 'From (A)'}</Text><Text style={s.link}>{aAuto ? `${A.name} ▾` : `${aName} ▾`}</Text></Pressable>
        <View style={s.stepper}>
          <Pressable style={s.step} onPress={() => setKt(Math.max(1, kt - 1))}><Text style={s.stepText}>−</Text></Pressable>
          <Text style={s.ktText}>{kt} {ES ? 'nudos' : 'kt'}</Text>
          <Pressable style={s.step} onPress={() => setKt(Math.min(60, kt + 1))}><Text style={s.stepText}>+</Text></Pressable>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
        <Text style={s.big}>{f1(nm)} {ES ? 'mn' : 'nm'}</Text>
        <Text style={s.big}>{fmtDuration(min)}</Text>
      </View>
      <Text style={s.small}>{f1(nm * NM_TO_MI)} {ES ? 'millas' : 'mi'} · {f1(nm * NM_TO_KM)} km · {ES ? 'rumbo' : 'heading'} {String(brg).padStart(3, '0')}° {ES ? 'verdadero' : 'true'}</Text>
      {crosses && <Text style={[s.small, { color: C.closed, fontWeight: '700' }]}>{ES ? 'La línea recta cruza tierra: la ruta real es más larga.' : 'The straight line crosses land: the real route is longer.'}</Text>}
      <Text style={s.small}>{ES ? 'En línea recta, sin corriente, viento ni oleaje. Para planear, no para navegar.' : 'Straight line, no current, wind or swell. For planning, not navigation.'}</Text>
    </ScrollView>
  );
}

function GotoSheet({ open, onClose, onGo }: { open: boolean; onClose: () => void; onGo: (p: Pt) => void }) {
  const [v, setV] = useState('');
  const [err, setErr] = useState('');
  const go = () => {
    const p = parseCoords(v);
    if (!p) { setErr(ES ? "No puedo leer esas coordenadas. Ejemplo: 22°52.9'N 109°54.5'W o 22.8818, -109.9095" : "Can’t read those coordinates. Example: 22°52.9'N 109°54.5'W or 22.8818, -109.9095"); return; }
    setErr(''); onGo(p);
  };
  return (
    <Sheet open={open} onClose={onClose} title={ES ? 'Ir a coordenadas' : 'Go to coordinates'}>
      <TextInput value={v} onChangeText={setV} placeholder="22°52.9'N 109°54.5'W" autoCapitalize="characters" autoCorrect={false}
        style={s.input} onSubmitEditing={go} returnKeyType="go" autoFocus />
      {!!err && <Text style={[s.small, { color: C.closed }]}>{err}</Text>}
      <Pressable style={s.button} onPress={go}><Text style={s.buttonText}>{ES ? 'Ir' : 'Go'}</Text></Pressable>
    </Sheet>
  );
}

function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: React.ReactNode }) {
  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={s.scrim} onPress={onClose} />
        <View style={s.sheet}>
          <View style={s.grabber} />
          {title && <Text style={s.sheetTitle}>{title}</Text>}
          <ScrollView keyboardShouldPersistTaps="handled">{children}</ScrollView>
          <Pressable style={[s.button, { marginTop: 12, backgroundColor: C.soft }]} onPress={onClose}><Text style={[s.buttonText, { color: C.ink }]}>{t.close}</Text></Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** Month strip: fishing season (0–3) and spawning (0/1/2), current month outlined. */
function SpeciesDetail({ species, manifest }: { species: SpeciesInfo; manifest: Manifest }) {
  const now = new Date().getMonth();
  const fishColor = (v: number) => ['#EEF1F4', '#CFE3F3', '#7FB3DD', '#1F6FB2'][v] ?? '#EEF1F4';
  const spawnColor = (v: number) => ['#EEF1F4', '#F6C9A9', '#E07A3F'][v] ?? '#EEF1F4';
  const Row = ({ label, vals, color }: { label: string; vals: number[]; color: (v: number) => string }) => (
    <View style={{ marginBottom: 10 }}>
      <Text style={s.statLabel}>{label}</Text>
      <View style={s.months}>{vals.map((v, i) => <View key={i} style={[s.month, { backgroundColor: color(v) }, i === now && s.monthNow]} />)}</View>
    </View>
  );
  return (
    <View>
      <Text style={s.sheetTitle}>{L(species)}</Text>
      <Text style={s.groupTitle}>{t.seasons}</Text>
      <View style={s.months}>{t.months.map((m, i) => <Text key={i} style={[s.monthLabel, i === now && { color: C.ink, fontWeight: '800' }]}>{m}</Text>)}</View>
      <Row label={t.fishing} vals={species.season} color={fishColor} />
      {species.spawn ? <Row label={`${t.spawning} (${t.confidence[species.spawnConfidence]})`} vals={species.spawn} color={spawnColor} />
        : <Text style={[s.body, { color: C.muted }]}>{t.spawning}: {t.noSpawnData}</Text>}
      {species.spawnSources.map(x => <Text key={x} style={s.small}>{x}</Text>)}
      <Text style={s.groupTitle}>{t.rulesTitle}</Text>
      <Text style={s.body}>{t.limit}: {L(species.limit)}</Text>
      {species.reserved50nm && <Text style={[s.body, { marginTop: 6 }]}>{t.reserved}</Text>}
      {species.g === 'shark' && <Text style={[s.body, { marginTop: 6 }]}>{L(manifest.rules.sharkVeda)}</Text>}
      {species.beta && <Text style={[s.body, { marginTop: 6, color: C.muted }]}>{t.beta}</Text>}
      <Text style={[s.small, { marginTop: 8 }]}>{L(manifest.rules.disclaimer)}</Text>
      <Text style={s.small}>{manifest.rules.source}</Text>
    </View>
  );
}

const shadow = { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 };
const s = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: C.bg },
  top: { position: 'absolute', top: 0, left: 0, right: 0 },
  topRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, gap: 8 },
  pill: { flex: 1, backgroundColor: C.surface, borderRadius: 32, paddingVertical: 9, paddingHorizontal: 20, ...shadow },
  pillLabel: { fontSize: 12, color: C.muted, fontWeight: '600' },
  pillTitle: { fontSize: 17, color: C.ink, fontWeight: '700' },
  round: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', ...shadow },
  roundText: { fontSize: 18, fontWeight: '700', color: C.ink },
  chipRow: { paddingHorizontal: 16, paddingTop: 8, gap: 8 },
  mchip: { backgroundColor: C.surface, borderRadius: 18, paddingVertical: 7, paddingHorizontal: 14, ...shadow },
  mchipOn: { backgroundColor: C.ink },
  mchipText: { fontSize: 13, fontWeight: '600', color: C.ink },
  mchipTextOn: { color: '#fff' },
  dchip: { backgroundColor: C.surface, borderRadius: 14, paddingVertical: 5, paddingHorizontal: 12, alignItems: 'center', minWidth: 58, ...shadow },
  dTop: { fontSize: 12, fontWeight: '700', color: C.ink, textTransform: 'capitalize' },
  dSub: { fontSize: 11, color: C.muted },
  confDot: { width: 6, height: 6, borderRadius: 3, marginTop: 2 },
  fabs: { position: 'absolute', right: 16, top: '42%', gap: 10 },
  fab: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', ...shadow },
  fabText: { fontSize: 20, color: C.ink, fontWeight: '700' },
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingBottom: 8 },
  legend: { flexDirection: 'row', alignSelf: 'center', backgroundColor: C.surface, borderRadius: 24, paddingVertical: 10, paddingHorizontal: 16, gap: 14, alignItems: 'center', ...shadow },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 12, height: 12, borderRadius: 3 },
  legendText: { fontSize: 13, fontWeight: '600', color: C.ink },
  note: { alignSelf: 'center', textAlign: 'center', marginTop: 6, fontSize: 12, color: C.ink, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, overflow: 'hidden', maxWidth: 360 },
  updated: { alignSelf: 'center', marginTop: 4, fontSize: 11, color: C.muted, backgroundColor: 'rgba(255,255,255,0.85)', paddingHorizontal: 8, borderRadius: 8, overflow: 'hidden' },
  cardScroll: { maxHeight: 340, borderRadius: 20, ...shadow },
  card: { backgroundColor: C.surface, borderRadius: 20, padding: 16 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pinTxt: { fontSize: 14, fontWeight: '700', color: C.ink, flexShrink: 1 },
  mini: { borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingVertical: 4, paddingHorizontal: 10 },
  miniText: { fontSize: 12, fontWeight: '600', color: C.ink },
  tier: { fontSize: 14, fontWeight: '800', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 10, overflow: 'hidden' },
  badge: { marginTop: 6, fontSize: 13, fontWeight: '600' },
  divider: { height: 1, backgroundColor: C.line, marginVertical: 12 },
  link: { fontSize: 15, fontWeight: '700', color: C.ink },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  step: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 18, color: C.ink },
  ktText: { fontSize: 14, fontWeight: '600', color: C.ink, minWidth: 64, textAlign: 'center' },
  big: { fontSize: 22, fontWeight: '800', color: C.ink },
  statLabel: { fontSize: 12, color: C.muted },
  row: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line },
  input: { borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 14, fontSize: 17, color: C.ink, marginBottom: 6 },
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 34, maxHeight: '80%' },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: C.line, marginBottom: 12 },
  sheetTitle: { fontSize: 22, fontWeight: '700', color: C.ink, marginBottom: 12 },
  groupTitle: { fontSize: 13, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 12, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: C.line, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14 },
  chipOn: { backgroundColor: C.ink, borderColor: C.ink },
  chipText: { fontSize: 15, color: C.ink },
  chipTextOn: { color: '#fff', fontWeight: '600' },
  body: { fontSize: 15, color: C.ink, lineHeight: 21 },
  small: { fontSize: 12, color: C.muted, lineHeight: 18 },
  button: { backgroundColor: C.ink, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center', marginTop: 12 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  months: { flexDirection: 'row', gap: 3, marginTop: 4 },
  month: { flex: 1, height: 18, borderRadius: 4 },
  monthNow: { borderWidth: 2, borderColor: C.ink },
  monthLabel: { flex: 1, textAlign: 'center', fontSize: 11, color: C.muted },
});
