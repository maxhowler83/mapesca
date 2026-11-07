"""Write areas.json, ports.json, seasons.json, new-species.json for the caribe data region.
Usage: python3 -I write_json.py <out_dir>"""
import json, os, sys
OUT = sys.argv[1]
def dump(name, obj):
    with open(os.path.join(OUT, name), 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)
        f.write('\n')

# ── Areas ────────────────────────────────────────────────────────────────
A = lambda k, r, j, en, es, w, e, s, n, why, **kw: dict(k=k, d='caribe', r=r, j=j, en=en, es=es, box=dict(w=w, e=e, s=s, n=n), why=why, **kw)
areas = [
 A('bimini', 'bahamas', 'bs', 'Bimini & Cat Cay', 'Bimini y Cat Cay', -79.55, -78.85, 25.3, 26.1,
   'Bimini, Gun & Cat Cay, Great Isaac and the eastern edge of the Gulf Stream; shallow Great Bahama Bank flats to the east.'),
 A('abaco', 'bahamas', 'bs', "Abaco & Walker's Cay", "Ábaco y Walker's Cay", -78.6, -76.75, 25.85, 27.4,
   "Walker's & Grand Cay, Green Turtle, Treasure Cay, Marsh Harbour, the Abaco canyons and drop-off to Hole in the Wall."),
 A('nassau', 'bahamas', 'bs', 'Nassau, Berry Islands & Eleuthera', 'Nassau, islas Berry y Eleuthera', -78.1, -76.3, 24.5, 25.95,
   'New Providence, Chub Cay and the Berry Islands, north Tongue of the Ocean, Harbour Island/Eleuthera and north Exuma Sound.'),
 A('havana', 'cuba', 'cu', 'Havana & Varadero', 'La Habana y Varadero', -82.75, -81.05, 22.95, 23.6,
   'Marina Hemingway to Varadero along the Straits of Florida edge (Gulf Stream current close to shore).'),
 A('jardines', 'cuba', 'cu', 'Jardines de la Reina', 'Jardines de la Reina', -79.6, -77.9, 20.35, 21.65,
   'Júcaro, the Jardines de la Reina cays, flats and outer reef drop-off (national park — see rules).'),
 A('cayman', 'carib-west', 'ky', 'Grand Cayman', 'Gran Caimán', -81.75, -80.9, 19.05, 19.65,
   'Grand Cayman wall and North Sound, 12-Mile Bank to the west and the East End drop-off.'),
 A('portantonio', 'carib-west', 'jm', 'Port Antonio (Jamaica)', 'Port Antonio (Jamaica)', -77.0, -76.1, 17.85, 18.55,
   'Port Antonio and the northeast coast of Jamaica to Morant Point; deep water close to shore.'),
 A('puntacana', 'carib-east', 'do', 'Punta Cana & Cap Cana', 'Punta Cana y Cap Cana', -68.95, -67.95, 18.1, 19.0,
   'Cap Cana, Punta Cana and La Romana/Casa de Campo, west side of the Mona Passage.'),
 A('prwest', 'carib-east', 'us-pr', 'West & south Puerto Rico', 'Oeste y sur de Puerto Rico', -67.98, -66.45, 17.55, 18.65,
   'Rincón, Mayagüez, Boquerón, La Parguera and Ponce; Desecheo, Mona Passage banks (Bajo de Sico, Tourmaline, Abrir la Sierra) and Mona Island at the edge.'),
 A('prnorth', 'carib-east', 'us-pr', 'San Juan, Fajardo & Culebra', 'San Juan, Fajardo y Culebra', -66.3, -65.15, 18.0, 18.85,
   'San Juan, Fajardo/Puerto del Rey, Culebra and Vieques; the drop-off to the Puerto Rico Trench north of San Juan.'),
 A('stthomas', 'carib-east', 'us-vi', 'St. Thomas & St. John', 'St. Thomas y St. John', -65.15, -64.6, 17.95, 18.85,
   'St. Thomas and St. John, the North Drop and South Drop, Hind Bank and Grammanik Bank.'),
 A('bvi', 'carib-east', 'vg', 'British Virgin Islands', 'Islas Vírgenes Británicas', -64.75, -64.2, 18.2, 18.9,
   'Tortola, Virgin Gorda and Anegada; the eastern North Drop and Anegada flats.'),
 A('caribe-all', 'carib-east', None, 'All of the northern Caribbean', 'Todo el Caribe norte', -85.2, -64.2, 17.4, 27.4,
   'Big view of the whole data region.', big=True),
]
dump('areas.json', areas)

# ── Ports ────────────────────────────────────────────────────────────────
OSM = 'OSM leisure=marina'
P = lambda name, lat, lon, src: dict(name=name, lat=lat, lon=lon, region='caribe', src=src)
ports = [
 P('Bimini (Alice Town)', 25.7263, -79.2955, f'{OSM} w963456316 (Bimini Big Game Club)'),
 P("Walker's Cay", 27.2593, -78.4024,"OSM Nominatim islet centroid; marina on the south shore — approx"),
 P('Spanish Cay', 26.9388, -77.5249, f'{OSM} n4773917095'),
 P('Green Turtle Cay', 26.7738, -77.3268, 'OSM Nominatim island (White Sound / Black Sound marinas) — approx'),
 P('Treasure Cay', 26.6725, -77.2789, 'OSM Nominatim Marina Drive, Treasure Cay marina basin — approx'),
 P('Marsh Harbour', 26.5465, -77.0515, f'{OSM} n3425101793 (Conch Inn & Marina)'),
 P('West End (Grand Bahama)', 26.7006, -78.9909, 'OSM Nominatim Old Bahama Bay resort & marina — approx'),
 P('Harbour Island', 25.4976, -76.6384, f'{OSM} w731586056 (Valentines)'),
 P('Chub Cay (Berry Islands)', 25.4109, -77.9048, f'{OSM} w622118104'),
 P('Nassau (East Bay St.)', 25.0749, -77.313, f'{OSM} w522613051 (Nassau Harbour Club)'),
 P('Lyford Cay', 25.0339, -77.5201, f'{OSM} r6861829'),
 P('Marina Hemingway (La Habana)', 23.0862, -82.5006, f'{OSM} n2652786655'),
 P('Varadero (Marina Gaviota)', 23.1916, -81.1274, f'{OSM} r5875987'),
 P('Júcaro', 21.6208, -78.8528, f'{OSM} n13699357942 (Marina Júcaro)'),
 P('Grand Cayman (North Sound)', 19.3571, -81.3775, 'OSM Nominatim Cayman Islands Yacht Club'),
 P("Morgan's Harbour (Grand Cayman)", 19.3767, -81.3807, f'{OSM} n775748060'),
 P('Port Antonio (Errol Flynn Marina)', 18.1806, -76.4533, f'{OSM} n2865075662'),
 P('Cap Cana', 18.5026, -68.3819, f'{OSM} w238836079'),
 P('Casa de Campo (La Romana)', 18.4005, -68.9008, f'{OSM} n3213289768'),
 P('San Juan (Club Náutico)', 18.4598, -66.0876, f'{OSM} n2080483222'),
 P('Cangrejos (Carolina)', 18.4558, -65.9917, f'{OSM} n3475180044'),
 P('Fajardo (Villa Marina)', 18.3431, -65.638, 'OSM Nominatim Villa Marina Yacht Basin'),
 P('Puerto del Rey', 18.2851, -65.6353, f'{OSM} r2720614 (unnamed marina polygon at Puerto del Rey)'),
 P('Palmas del Mar', 18.0776, -65.7986, f'{OSM} n1576343818'),
 P('Salinas', 17.9591, -66.2945, f'{OSM} n1382988171'),
 P('La Parguera', 17.9726, -67.039, f'{OSM} w474942781 (Club Náutico La Parguera)'),
 P('Boquerón', 18.0265, -67.1762, f'{OSM} w333977232'),
 P('Puerto Real (Cabo Rojo)', 18.0745, -67.1889, f'{OSM} w663043197 (Marina Pescadería)'),
 P('Red Hook (St. Thomas)', 18.3253, -64.8521, f'{OSM} n453040017 (American Yacht Harbor)'),
 P('Charlotte Amalie (Crown Bay)', 18.334, -64.9522, f'{OSM} n452129995'),
 P('Green Cay (St. Croix)', 17.7591, -64.6687, f'{OSM} w1319827232'),
 P('Road Town (Tortola)', 18.4233, -64.6172, f'{OSM} n2286686410 (Village Cay)'),
 P('Nanny Cay (Tortola)', 18.3986, -64.6363, f'{OSM} n2286707319'),
 P('Virgin Gorda Yacht Harbour', 18.4487, -64.4364, f'{OSM} n2537963597'),
 P('Providenciales (Turtle Cove)', 21.7852, -72.2256, f'{OSM} r7551045'),
]
dump('ports.json', ports)

# ── Seasons ──────────────────────────────────────────────────────────────
R = ['bahamas', 'cuba', 'carib-west', 'carib-east']
def s(b, c, w, e): return dict(zip(R, [b, c, w, e]))
seasons = {
 'blue-marlin':      s('001233321100', '000123333210', '111222223321', '122223333221'),
 'white-marlin':     s('001232100000', '001232100000', '001110000000', '002332100000'),
 'pacific-sailfish': s('332110000123', '222210000122', '222210000112', '332110000112'),
 'swordfish':        s('111111111111', '111111111111', '111111111111', '111111111111'),
 'yellowfin-tuna':   s('111233221111', '111122221111', '222332111222', '111222111111'),
 'blackfin-tuna':    s('222332222222', '222222222222', '222222222222', '222222222222'),
 'skipjack-tuna':    s('222222222222', '222222222222', '222222222222', '222222222222'),
 'dorado':           s('123332111111', '123332111111', '233321111122', '233321111112'),
 'wahoo':            s('333211111233', '332111111233', '333211111233', '333211111233'),
 'king-mackerel':    s('222222222222', '222222222222', '111111111111', '222222222222'),
 'cero':             s('222222222222', '222222222222', '222222222222', '222222222222'),
 'tarpon':           s('111222222111', '112333332211', '111222222111', '222222222222'),
 'common-snook':     s('111111111111', '222222222222', '111111111111', '222222222222'),
 'permit':           s('222222222222', '222333322222', '222222222222', '111111111111'),
 'bonefish':         s('233332223332', '233333333332', '222222222222', '222222222222'),
 'great-barracuda':  s('222222222222', '222222222222', '222222222222', '222222222222'),
 'mutton-snapper':   s('222333222222', '222333222222', '222222222222', '222222222222'),
 'black-grouper':    s('222222222222', '222222222222', '222222222222', '222222222222'),
 'red-grouper':      s('111111111111', '222222222222', '111111111111', '111111111111'),
 'goliath-grouper':  s('111111111111', '111111111111', '111111111111', '111111111111'),
 'greater-amberjack':s('222222222222', '222222222222', '111111111111', '111111111111'),
 'almaco-jack':      s('222222222222', '222222222222', '222222222222', '222222222222'),
 'atlantic-jack':    s('222222222222', '222222222222', '222222222222', '222222222222'),
 'cobia':            s('111111111111', '111111111111', None, None),
 'bull-shark':       s('222222222222', '111111111111', '111111111111', '111111111111'),
 'silky-shark':      s('111111111111', '111111111111', '111111111111', '111111111111'),
 'shortfin-mako':    s(None, None, None, None),
 'blue-shark':       s(None, None, None, None),
 'spanish-mackerel': s(None, None, None, None),
 'red-drum':         s(None, None, None, None),
 'red-snapper':      s(None, None, None, None),
 'yellowtail-snapper': s('222333332222', '222333222222', '222222222222', '222333222222'),
}
seasons['_regions'] = {
 'bahamas': 'Bahamas (Bimini, Abaco, Nassau/Berry Islands/Eleuthera). Gulf Stream and Tongue of the Ocean pelagics; spring billfish run.',
 'cuba': 'Cuba north coast (Havana–Varadero) and Jardines de la Reina. Summer blue marlin on the north coast; flats/tarpon in the south.',
 'carib-west': 'Western Caribbean islands: Cayman Islands and Jamaica. Spring and autumn blue marlin, winter wahoo/dolphin.',
 'carib-east': 'Mona Passage and Virgin Islands: eastern Dominican Republic, Puerto Rico, USVI, BVI. Summer blue marlin (North Drop Aug), spring white marlin (Cap Cana Apr–May), winter dolphin/wahoo/sailfish.',
}
seasons['_sources'] = {
 '_all': 'LOW confidence overall: built from tournament calendars, charter/fishing-press reports and general knowledge; no published monthly catch-rate data were found for these islands. Tune with captains\' reports.',
 'blue-marlin': 'Bahamas: bluewater season Mar–early Jul (Sport Fishing Mag, Bimini: https://www.sportfishingmag.com/story/travel/bimini-the-original-island-in-the-stream/). Cuba: Hemingway tournament held May/June (https://en.wikipedia.org/wiki/Ernest_Hemingway_International_Billfishing_Tournament), north-coast peak Aug–Sep (low). Jamaica: Port Antonio International Marlin Tournament Sep/Oct (Jamaica Gleaner 2024/2025, e.g. https://web4.jamaica-gleaner.com/article/sports/20240914/all-set-september-23-28-port-antonio-international-marlin-tournament). East: Cap Cana peak Jun–Aug, Casa de Campo Feb–Apr (Marlin Mag https://www.marlinmag.com/travel/marlin-fishing-in-dominican-republic-cap-cana-casa-de-campo/); USVI North Drop: big tournaments on the July and August full moons (https://virginislandsthisweek.com/st-thomas/st-thomas-water-activities/summer-sportfishing-season/); San Juan International Billfish Tournament late Aug/Sep (low).',
 'white-marlin': 'Cap Cana: Mar–Jun, best Apr–May (Marlin Mag, above). Bahamas spring (low). Rare in Cayman/Jamaica (low).',
 'pacific-sailfish': 'Atlantic sailfish (the app uses one key for both oceans). DR: Jan–Feb excellent (Marlin Mag). Bahamas/Cuba: winter along the Gulf Stream/Straits (low).',
 'swordfish': 'Deep-drop daytime fishery exists (Bahamas, Cuba, PR) but little documented — flat 1 (low).',
 'yellowfin-tuna': 'Bahamas spring run May–Jun (Bimini/Cat Cay, low); Cayman spring and Jamaica winter (low).',
 'dorado': 'Winter–spring peak Jan–May across the region (PR/USVI/DR charter reports; low).',
 'wahoo': 'Bimini: Nov–Mar run (Sport Fishing Mag). Same winter peak used elsewhere (low).',
 'tarpon': 'Jardines de la Reina: spring–summer (low). San Juan lagoons year-round (low).',
 'bonefish': 'Bahamas flats year-round (Sport Fishing Mag, Bimini); spring/fall peaks (low).',
 'mutton-snapper': 'Seasons are availability only; closures are applied separately (USVI Apr–Jun, PR Apr–May territorial / Apr–Jun federal).',
 'black-grouper': 'Availability only; USVI closure Feb–Apr applied separately; PR closure is federal-only (see rules.json limits).',
 'cobia': 'Listed by the Bahamas Ministry of Tourism as a flats species; occasional elsewhere (low).',
 'bull-shark': 'Bahamas: all shark fishing banned — closure in rules.json zeroes it there.',
 'shortfin-mako': 'null: retention prohibited in US Caribbean waters (NOAA HMS 2026), sharks fully protected in The Bahamas, ICCAT North Atlantic non-retention; rare in these warm surface waters. Recommend not mapping here.',
 'blue-shark': 'null: rare in warm Caribbean surface waters; not a sport target here.',
 'spanish-mackerel': 'null: S. maculatus is a US/Gulf species; island "sierras" here are cero and king mackerel.',
 'red-drum': 'null: not found in the islands.',
 'red-snapper': 'null: Lutjanus campechanus is a Gulf/US species; the islands\' "red snappers" are other species (silk, blackfin).',
 'yellowtail-snapper': 'New species. Year-round reef staple; spring–summer spawning peaks (SEDAR 64; FishBase). Bahamas has a designated yellowtail snapper spawning site (Steven\'s Rock).',
}
dump('seasons.json', seasons)

# ── New species ──────────────────────────────────────────────────────────
new_species = [{
 'k': 'yellowtail-snapper', 'g': 'inshore', 'en': 'Yellowtail snapper', 'es': 'Rubia (pargo cola amarilla)',
 'temp': [19, 23, 30, 32], 'depth': [3, 10, 70, 180], 'chl': [0.08, 1.0], 'season': [0] * 12,
 'info': {
  'spawn': [0, 0, 1, 1, 2, 2, 2, 2, 1, 0, 0, 0], 'conf': 'low', 'limit': 'general', 'beta': True,
  'src': [
   'FishBase, Ocyurus chrysurus: reef-associated, depth 0–180 m, usually 10–70 m; most common in the Bahamas, south Florida and the Caribbean; spawns year-round with regional peaks (https://www.fishbase.se/summary/Ocyurus-chrysurus.html)',
   'SEDAR 64 Southeastern U.S. yellowtail snapper assessment (2020): spawning peaks late spring–summer in Florida (https://sedarweb.org/assessments/sedar-64/) — temperature profile ESTIMATED (tropical reef fish, cold-sensitive below ~19–20 °C); tune with catches',
  ],
  'oceans': 'atl',
 },
 'why': 'Most-landed reef sport/food fish in the Bahamas, Puerto Rico and the Virgin Islands; has its own size limit in US Caribbean federal waters (12 in TL) and Puerto Rico (10.5 in).',
}]
dump('new-species.json', new_species)
print('ok', len(areas), 'areas', len(ports), 'ports')
