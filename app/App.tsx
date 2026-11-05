import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Map, Camera, GeoJSONSource, Layer, UserLocation } from '@maplibre/maplibre-react-native';
import * as Location from 'expo-location';
import { prepareAreas, areaAt } from '../packages/model/protected.js';
import { nearestPort } from '../packages/model/zones.js';
import {
  loadManifest, loadConditions, loadProtected, loadZones, zonesToGeoJSON, scoreAt, tierOf, gridAt,
  type Manifest, type Conditions, type ZoneGrid, type SpeciesInfo,
} from './src/data';
import { t, L, LANG } from './src/i18n';
import { C } from './src/theme';

// Free vector map, no key or per-use fees (OpenFreeMap, © OpenStreetMap contributors).
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';
const BCS_BOUNDS: [number, number, number, number] = [-115.4, 22.3, -109.0, 28.1];
// The map can't pan or zoom out past southern Baja: a small margin around the data box.
const PAN_BOUNDS: [number, number, number, number] = [-116.6, 21.4, -107.8, 29.0];
// Furthest zoom-out: the whole margin box fits on screen, no further (MapLibre: 512-pt tiles).
function fitZoom() {
  const { width, height } = Dimensions.get('window');
  const mercY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
  const zx = Math.log2((width * 360) / ((PAN_BOUNDS[2] - PAN_BOUNDS[0]) * 512));
  const zy = Math.log2((height * 2 * Math.PI) / ((mercY(PAN_BOUNDS[3]) - mercY(PAN_BOUNDS[1])) * 512));
  return Math.min(zx, zy); // the whole box fits; any closer and part of it is cut off
}
const MIN_ZOOM = fitZoom();
const rgb = (c: number[]) => `rgb(${c[0]},${c[1]},${c[2]})`;

type Readout = { lat: number; lon: number };

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Main />
    </SafeAreaProvider>
  );
}

function Main() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [conditions, setConditions] = useState<Conditions | null>(null);
  const [protectedFc, setProtectedFc] = useState<GeoJSON.FeatureCollection | null>(null);
  const [error, setError] = useState(false);
  const [speciesK, setSpeciesK] = useState('striped-marlin');
  const [zones, setZones] = useState<ZoneGrid | null>(null);
  const [zonesLoading, setZonesLoading] = useState(false);
  const [picker, setPicker] = useState(false);
  const [about, setAbout] = useState(false);
  const [detail, setDetail] = useState(false);
  const [readout, setReadout] = useState<Readout | null>(null);
  const [showUser, setShowUser] = useState(false);

  const load = useCallback(() => {
    setError(false);
    Promise.all([loadManifest(), loadProtected()])
      .then(([m, p]) => { setManifest(m); setProtectedFc(p); })
      .catch(() => setError(true));
    loadConditions().then(setConditions).catch(() => {}); // only for the tap readout
  }, []);
  useEffect(load, [load]);

  useEffect(() => {
    Location.getForegroundPermissionsAsync().then(r => setShowUser(r.granted)).catch(() => {});
  }, []);

  const species = manifest?.species.find(s => s.k === speciesK) || null;
  useEffect(() => {
    if (!species) return;
    setZonesLoading(true); setZones(null);
    loadZones(species.file).then(setZones).catch(() => setError(true)).finally(() => setZonesLoading(false));
  }, [species?.file]);

  const areas = useMemo(() => prepareAreas(protectedFc), [protectedFc]);
  const shapes = useMemo(() => (zones && species && manifest ? zonesToGeoJSON(zones, species, manifest.tiers) : null), [zones, species, manifest]);

  if (error && !manifest) {
    return (
      <SafeAreaView style={s.center}>
        <Text style={s.body}>{t.offline}</Text>
        <Pressable style={s.button} onPress={load}><Text style={s.buttonText}>{t.retry}</Text></Pressable>
      </SafeAreaView>
    );
  }

  const tierColor = (k: string) => rgb(manifest?.tiers.find(x => x.k === k)?.color || [0, 0, 0]);

  return (
    <View style={s.fill}>
      <Map
        style={s.fill}
        mapStyle={MAP_STYLE}
        logo={false}
        attribution
        attributionPosition={{ bottom: 8, left: 8 }}
        compass={false}
        onPress={e => { const { lngLat } = e.nativeEvent; setReadout({ lon: lngLat[0], lat: lngLat[1] }); }}
      >
        <Camera
          initialViewState={{ bounds: BCS_BOUNDS, padding: { top: 120, bottom: 160, left: 20, right: 20 } }}
          minZoom={MIN_ZOOM}
          maxZoom={14}
          maxBounds={PAN_BOUNDS}
        />
        {shapes && (
          <GeoJSONSource id="zones" data={shapes}>
            <Layer
              type="fill"
              id="zones-fill"
              paint={{
                'fill-color': ['match', ['get', 'tier'], 'elite', tierColor('elite'), 'priority', tierColor('priority'), tierColor('candidate')],
                'fill-opacity': ['match', ['get', 'tier'], 'elite', 0.75, 'priority', 0.55, 0.35],
              }}
            />
          </GeoJSONSource>
        )}
        {protectedFc && (
          <GeoJSONSource id="protected" data={protectedFc}>
            <Layer type="fill" id="protected-fill" filter={['==', ['get', 'rule'], 'no-take']} paint={{ 'fill-color': C.closed, 'fill-opacity': 0.25 }} />
            <Layer type="line" id="protected-line" paint={{ 'line-color': ['match', ['get', 'rule'], 'no-take', C.closed, C.rules], 'line-width': 1.5, 'line-dasharray': [2, 2] }} />
            <Layer
              type="symbol"
              id="protected-label"
              minzoom={6.5}
              layout={{ 'text-field': ['get', 'name'], 'text-size': 12, 'text-max-width': 10, 'text-font': ['Noto Sans Bold'] }}
              paint={{ 'text-color': ['match', ['get', 'rule'], 'no-take', C.closed, C.rules], 'text-halo-color': '#fff', 'text-halo-width': 1.5 }}
            />
          </GeoJSONSource>
        )}
        {showUser && <UserLocation />}
      </Map>

      {/* Top: species pill and info, like a search bar */}
      <SafeAreaView edges={['top']} style={s.top} pointerEvents="box-none">
        <View style={s.topRow}>
          <Pressable style={s.pill} onPress={() => setPicker(true)} accessibilityRole="button" accessibilityLabel={t.pick}>
            <Text style={s.pillLabel}>{t.today}</Text>
            <Text style={s.pillTitle} numberOfLines={1}>{species ? L(species) : t.loading}</Text>
            {species && <Text style={s.pillSub}>{t.season[species.seasonLevel] ?? ''}</Text>}
          </Pressable>
          <Pressable style={s.round} onPress={() => setAbout(true)} accessibilityLabel={t.about}>
            <Text style={s.roundText}>i</Text>
          </Pressable>
        </View>
        {species && (
          <View style={s.subRow}>
            <Pressable style={s.smallPill} onPress={() => setDetail(true)} accessibilityRole="button">
              <Text style={s.smallPillText}>{t.seasons} · {t.rulesTitle}</Text>
            </Pressable>
            {species.closedSeason && <Text style={[s.flag, { backgroundColor: C.closed }]}>{t.vedaNow}</Text>}
            {!species.closedSeason && species.beta && <Text style={[s.flag, { backgroundColor: C.muted }]}>Beta</Text>}
          </View>
        )}
      </SafeAreaView>

      {/* Bottom: legend or tapped-square card */}
      <SafeAreaView edges={['bottom']} style={s.bottom} pointerEvents="box-none">
        {readout && species && manifest ? (
          <ReadoutCard readout={readout} species={species} manifest={manifest} zones={zones} conditions={conditions} areas={areas} onClose={() => setReadout(null)} />
        ) : (
          <View style={s.legend}>
            {manifest?.tiers.map(x => (
              <View key={x.k} style={s.legendItem}>
                <View style={[s.dot, { backgroundColor: rgb(x.color) }]} />
                <Text style={s.legendText}>{L(x)}</Text>
              </View>
            ))}
            {(zonesLoading || !manifest) && <ActivityIndicator style={{ marginLeft: 8 }} />}
          </View>
        )}
        {manifest && <Text style={s.updated}>{t.updated} {manifest.data.sstDate}</Text>}
      </SafeAreaView>

      <Modal visible={picker} animationType="slide" transparent onRequestClose={() => setPicker(false)}>
        <Pressable style={s.scrim} onPress={() => setPicker(false)} />
        <View style={s.sheet}>
          <View style={s.grabber} />
          <Text style={s.sheetTitle}>{t.pick}</Text>
          <ScrollView>
            {manifest?.groups.map(g => (
              <View key={g.k} style={{ marginBottom: 16 }}>
                <Text style={s.groupTitle}>{L(g)}</Text>
                <View style={s.chips}>
                  {manifest.species.filter(x => x.g === g.k).map(x => (
                    <Pressable key={x.k} style={[s.chip, x.k === speciesK && s.chipOn]} onPress={() => { setSpeciesK(x.k); setPicker(false); setReadout(null); }}>
                      <Text style={[s.chipText, x.k === speciesK && s.chipTextOn]}>{L(x)}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={detail} animationType="slide" transparent onRequestClose={() => setDetail(false)}>
        <Pressable style={s.scrim} onPress={() => setDetail(false)} />
        <View style={s.sheet}>
          <View style={s.grabber} />
          {species && manifest && <SpeciesDetail species={species} manifest={manifest} />}
          <Pressable style={[s.button, { marginTop: 16 }]} onPress={() => setDetail(false)}><Text style={s.buttonText}>{t.close}</Text></Pressable>
        </View>
      </Modal>

      <Modal visible={about} animationType="slide" transparent onRequestClose={() => setAbout(false)}>
        <Pressable style={s.scrim} onPress={() => setAbout(false)} />
        <View style={s.sheet}>
          <View style={s.grabber} />
          <Text style={s.sheetTitle}>Mapesca</Text>
          <ScrollView>
            <Text style={s.body}>{t.free}</Text>
            {manifest && <Text style={[s.body, { marginTop: 12 }]}>{L(manifest.notice)}</Text>}
            <Text style={s.groupTitle}>{t.by}</Text>
            {manifest?.by.map(b => <Text key={b} style={s.body}>{b}</Text>)}
            {manifest && (
              <>
                <Text style={s.groupTitle}>{t.sharks}</Text>
                <Text style={s.body}>{L(manifest.rules.sharkVeda)}</Text>
                <Text style={[s.body, { marginTop: 8, fontWeight: '600' }]}>{t.neverKeep}</Text>
                {manifest.rules.neverKeep[LANG].map(n => <Text key={n} style={s.body}>· {n}</Text>)}
                <Text style={[s.body, { marginTop: 8 }]}>{L(manifest.rules.neverKeep.note)}</Text>
              </>
            )}
            <Text style={s.groupTitle}>{t.sources}</Text>
            {manifest?.attribution.map(a => <Text key={a} style={s.small}>{a}</Text>)}
            <Text style={s.small}>© OpenStreetMap contributors · OpenFreeMap</Text>
          </ScrollView>
          <Pressable style={[s.button, { marginTop: 16 }]} onPress={() => setAbout(false)}><Text style={s.buttonText}>{t.close}</Text></Pressable>
        </View>
      </Modal>
    </View>
  );
}

function ReadoutCard({ readout, species, manifest, zones, conditions, areas, onClose }: {
  readout: Readout; species: SpeciesInfo; manifest: Manifest; zones: ZoneGrid | null; conditions: Conditions | null;
  areas: ReturnType<typeof prepareAreas>; onClose: () => void;
}) {
  const { lat, lon } = readout;
  const area = areaAt(areas, lat, lon);
  const score = zones ? scoreAt(zones, lat, lon) : null;
  const tier = tierOf(species, manifest.tiers, score);
  const sst = gridAt(conditions?.sst, lat, lon), chl = gridAt(conditions?.chl, lat, lon);
  const port = nearestPort(lat, lon);
  return (
    <View style={s.card}>
      <View style={s.cardHead}>
        <Text style={s.cardTitle}>{tier ? L(tier) : score == null ? t.noData : t.noZone}</Text>
        <Pressable onPress={onClose} hitSlop={12}><Text style={s.closeX}>✕</Text></Pressable>
      </View>
      {area && <Text style={[s.badge, { color: area.rule === 'no-take' ? C.closed : C.rules }]}>{area.rule === 'no-take' ? t.closed : t.rules} · {area.name}</Text>}
      <View style={s.stats}>
        <Stat label={t.score} value={score == null ? '—' : String(score)} />
        <Stat label={t.water} value={sst == null ? '—' : `${sst.toFixed(1)}°C · ${(sst * 9 / 5 + 32).toFixed(0)}°F`} />
        <Stat label={t.color} value={chl == null ? '—' : chl.toFixed(2)} />
      </View>
      {port && <Text style={s.small}>{port.name} · {Math.round(port.nm)} nm</Text>}
    </View>
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
      <View style={s.months}>
        {vals.map((v, i) => <View key={i} style={[s.month, { backgroundColor: color(v) }, i === now && s.monthNow]} />)}
      </View>
    </View>
  );
  return (
    <ScrollView>
      <Text style={s.sheetTitle}>{L(species)}</Text>
      <Text style={s.groupTitle}>{t.seasons}</Text>
      <View style={s.months}>{t.months.map((m, i) => <Text key={i} style={[s.monthLabel, i === now && { color: C.ink, fontWeight: '800' }]}>{m}</Text>)}</View>
      <Row label={t.fishing} vals={species.season} color={fishColor} />
      {species.spawn ? (
        <>
          <Row label={`${t.spawning} (${t.confidence[species.spawnConfidence]})`} vals={species.spawn} color={spawnColor} />
          <Text style={s.small}>■ {t.peak}</Text>
        </>
      ) : (
        <Text style={[s.body, { color: C.muted }]}>{t.spawning}: {t.noSpawnData}</Text>
      )}
      {species.spawnSources.map(x => <Text key={x} style={s.small}>{x}</Text>)}

      <Text style={s.groupTitle}>{t.rulesTitle}</Text>
      <Text style={s.body}>{t.limit}: {L(species.limit)}</Text>
      {species.reserved50nm && <Text style={[s.body, { marginTop: 6 }]}>{t.reserved}</Text>}
      {species.g === 'shark' && <Text style={[s.body, { marginTop: 6 }]}>{L(manifest.rules.sharkVeda)}</Text>}
      {species.beta && <Text style={[s.body, { marginTop: 6, color: C.muted }]}>{t.beta}</Text>}
      <Text style={[s.small, { marginTop: 8 }]}>{L(manifest.rules.disclaimer)}</Text>
      <Text style={s.small}>{manifest.rules.source}</Text>
    </ScrollView>
  );
}

const Stat = ({ label, value }: { label: string; value: string }) => (
  <View style={{ flex: 1 }}>
    <Text style={s.statLabel}>{label}</Text>
    <Text style={s.statValue}>{value}</Text>
  </View>
);

const shadow = { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 };
const s = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: C.bg },
  top: { position: 'absolute', top: 0, left: 0, right: 0 },
  topRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, gap: 10 },
  pill: { flex: 1, backgroundColor: C.surface, borderRadius: 32, paddingVertical: 10, paddingHorizontal: 20, ...shadow },
  pillLabel: { fontSize: 12, color: C.muted, fontWeight: '600' },
  pillTitle: { fontSize: 17, color: C.ink, fontWeight: '700' },
  pillSub: { fontSize: 12, color: C.muted },
  round: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', ...shadow },
  roundText: { fontSize: 18, fontWeight: '700', color: C.ink, fontStyle: 'italic' },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, marginTop: 8 },
  smallPill: { backgroundColor: C.surface, borderRadius: 18, paddingVertical: 7, paddingHorizontal: 14, ...shadow },
  smallPillText: { fontSize: 13, fontWeight: '600', color: C.ink },
  flag: { color: '#fff', fontSize: 12, fontWeight: '700', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 12, overflow: 'hidden' },
  months: { flexDirection: 'row', gap: 3, marginTop: 4 },
  month: { flex: 1, height: 18, borderRadius: 4 },
  monthNow: { borderWidth: 2, borderColor: C.ink },
  monthLabel: { flex: 1, textAlign: 'center', fontSize: 11, color: C.muted },
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingBottom: 8 },
  legend: { flexDirection: 'row', alignSelf: 'center', backgroundColor: C.surface, borderRadius: 24, paddingVertical: 10, paddingHorizontal: 16, gap: 14, alignItems: 'center', ...shadow },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 12, height: 12, borderRadius: 3 },
  legendText: { fontSize: 13, fontWeight: '600', color: C.ink },
  updated: { alignSelf: 'center', marginTop: 6, fontSize: 11, color: C.muted, backgroundColor: 'rgba(255,255,255,0.85)', paddingHorizontal: 8, borderRadius: 8, overflow: 'hidden' },
  card: { backgroundColor: C.surface, borderRadius: 20, padding: 18, ...shadow },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 20, fontWeight: '700', color: C.ink },
  closeX: { fontSize: 18, color: C.muted },
  badge: { marginTop: 6, fontSize: 13, fontWeight: '600' },
  stats: { flexDirection: 'row', marginVertical: 12, gap: 8 },
  statLabel: { fontSize: 12, color: C.muted },
  statValue: { fontSize: 15, fontWeight: '600', color: C.ink, marginTop: 2 },
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36, maxHeight: '75%' },
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
});
