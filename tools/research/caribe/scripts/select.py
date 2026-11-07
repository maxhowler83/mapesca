"""Build tnc_select.json: which TNC protected areas go into protected-areas-caribe.json, with rule and notes.
Usage: python3 -I select.py <dl_dir>"""
import json, os, sys

DL = sys.argv[1]
TNC = 'TNC Insular Caribbean Protected Areas 2025 (government submissions) · https://services.arcgis.com/F7DSX1DSNSiWmOqh/arcgis/rest/services/Caribbean_Protected_Areas_2023/FeatureServer'
attrs = {f['attributes']['OBJECTID']: f['attributes'] for f in json.load(open(os.path.join(DL, 'tnc_attrs.json')))['features']}

N = {
 'bnt_notake': ({'en': 'No-take park: no fishing of any kind; nothing may be removed (Bahamas National Trust).',
                 'es': 'Parque sin captura: prohibida toda pesca; no se puede extraer nada (Bahamas National Trust).'}, 'https://bnt.bs/storage/2020/01/Exuma-Cays-Land-and-Sea-Park-Rules.pdf'),
 'bnt_notake_wdpa': ({'en': 'Reported as fully no-take (WDPA/BNT). Do not fish; confirm with the Bahamas National Trust.',
                      'es': 'Reportado como zona sin captura total (WDPA/BNT). No pesques; confirma con el Bahamas National Trust.'}, 'https://www.protectedplanet.net/'),
 'bs_park': ({'en': 'Bahamas national park / marine park: fishing restricted or prohibited in parts. Check BNT/DMR rules before fishing.',
              'es': 'Parque nacional o marino de Bahamas: pesca restringida o prohibida en partes. Revisa las reglas del BNT/DMR antes de pescar.'}, 'https://bnt.bs/'),
 'bs_reserve': ({'en': 'Bahamas marine (fishery) reserve: fishing prohibited or restricted. Confirm with the Department of Marine Resources.',
                 'es': 'Reserva marina (pesquera) de Bahamas: pesca prohibida o restringida. Confirma con el Department of Marine Resources.'}, 'https://www.bahamas.gov.bs/marineresources'),
 'bs_reserve_nt': ({'en': 'Bahamas marine (fishery) reserve, reported as fully no-take (WDPA). Do not fish; confirm with DMR.',
                    'es': 'Reserva marina (pesquera) de Bahamas, reportada como sin captura total (WDPA). No pesques; confirma con el DMR.'}, 'https://www.protectedplanet.net/'),
 'bs_spagg': ({'en': 'Yellowtail snapper spawning aggregation site (2021 designation). Rules not published online — check with DMR.',
               'es': 'Sitio de agregación de desove de rubia (designado en 2021). Reglas no publicadas en línea: consulta al DMR.'}, 'https://www.bahamas.gov.bs/marineresources'),
 'ky_mr': ({'en': 'Marine Reserve zone: no taking of any marine life (catch-and-release of tarpon, bonefish and permit only); no anchoring.',
            'es': 'Zona de reserva marina: prohibido extraer cualquier especie (solo captura y liberación de sábalo, macabí y palometa); no anclar.'}, 'https://cnslibrary.com/wp-content/uploads/National-Conservation-Marine-Parks-Regulations-2021-1.pdf'),
 'ky_lfz': ({'en': 'Line Fishing zone: hook-and-line fishing only (no spear, nets or traps); no anchoring except small boats in sand.',
             'es': 'Zona de pesca con línea: solo anzuelo y línea (sin arpón, redes ni trampas); no anclar salvo embarcaciones pequeñas en arena.'}, 'https://cnslibrary.com/wp-content/uploads/National-Conservation-Marine-Parks-Regulations-2021-1.pdf'),
 'ky_slfz': ({'en': 'Shore Line Fishing zone: hook-and-line only from shore, a dock or wading (≤4 ft). No fishing from boats.',
              'es': 'Zona de pesca desde la orilla: solo anzuelo y línea desde la orilla, un muelle o vadeando (≤4 pies). Prohibido pescar desde embarcación.'}, 'https://cnslibrary.com/wp-content/uploads/National-Conservation-Marine-Parks-Regulations-2021-1.pdf'),
 'ky_ez': ({'en': 'Environmental zone: no taking, no entering the water, no anchoring, 5 mph limit.',
            'es': 'Zona ambiental: prohibido extraer, entrar al agua y anclar; límite de 5 mph.'}, 'https://cnslibrary.com/wp-content/uploads/National-Conservation-Marine-Parks-Regulations-2021-1.pdf'),
 'ky_wiz': ({'en': 'Wildlife Interaction zone (Stingray City): no taking of any marine life.',
             'es': 'Zona de interacción con fauna (Stingray City): prohibido extraer cualquier especie.'}, 'https://cnslibrary.com/wp-content/uploads/National-Conservation-Marine-Parks-Regulations-2021-1.pdf'),
 'ky_spagg': ({'en': 'Spawning Aggregation zone: Dec 1 – Apr 30 no fishing, anchoring or entering the water between the 50 ft and 200 ft contours.',
               'es': 'Zona de agregación de desove: del 1 dic al 30 abr prohibido pescar, anclar o entrar al agua entre las isóbatas de 50 y 200 pies.'}, 'https://cnslibrary.com/wp-content/uploads/National-Conservation-Marine-Parks-Regulations-2021-1.pdf'),
 'vg_fpa': ({'en': 'BVI Fisheries Protected Area: all fishing prohibited (Fisheries Regulations 2003, reg. 51(5)).',
             'es': 'Área de protección pesquera de las BVI: prohibida toda pesca (Fisheries Regulations 2003, reg. 51(5)).'}, 'https://bvi.gov.vg/media-centre/speargun-fishing-strictly-prohibited'),
 'vg_mp': ({'en': 'BVI National Parks Trust marine park: fishing not allowed.',
            'es': 'Parque marino del BVI National Parks Trust: no se permite pescar.'}, 'https://www.protectedplanet.net/'),
 'vg_other': ({'en': 'BVI protected area: rules not confirmed online — check with the Ministry/National Parks Trust.',
               'es': 'Área protegida de las BVI: reglas no confirmadas en línea; consulta al Ministerio o al National Parks Trust.'}, TNC),
 'vi_buck': ({'en': 'Buck Island Reef National Monument: all fishing and fishing gear prohibited (36 CFR 7.73).',
              'es': 'Monumento Nacional Buck Island Reef: prohibida toda pesca y portar equipo de pesca (36 CFR 7.73).'}, 'https://www.law.cornell.edu/cfr/text/36/7.73'),
 'vi_vicrnm': ({'en': 'VI Coral Reef National Monument: all fishing prohibited (permit exceptions: bait in Hurricane Hole, blue runner at Cabritte Horn).',
                'es': 'Monumento Nacional de Arrecifes de las Islas Vírgenes: prohibida toda pesca (excepciones con permiso: carnada en Hurricane Hole, cojinúa en Cabritte Horn).'}, 'https://dpnr.vi.gov/wp-content/uploads/2024/02/Fisher-Handbook-2023_Website.pdf'),
 'vi_np': ({'en': 'VI National Park: rod-and-reel and handline allowed; no spearfishing; no fishing in swim zones or while tied to a mooring (36 CFR 7.74).',
            'es': 'Parque Nacional de las Islas Vírgenes: se permite caña y línea de mano; prohibido el arpón; no pescar en zonas de baño ni amarrado a una boya (36 CFR 7.74).'}, 'https://dpnr.vi.gov/wp-content/uploads/2024/02/Fisher-Handbook-2023_Website.pdf'),
 'vi_steer': ({'en': 'St. Thomas East End Reserves: territorial marine reserve with gear and area rules. Check DPNR.',
               'es': 'Reservas del East End de St. Thomas: reserva marina territorial con reglas de equipo y zonas. Consulta al DPNR.'}, 'https://dpnr.vi.gov/wp-content/uploads/2024/02/Fisher-Handbook-2023_Website.pdf'),
 'vi_eemp': ({'en': 'St. Croix East End Marine Park: zoned park that includes a no-take area (zone boundaries not mapped here). Check DPNR.',
              'es': 'Parque Marino East End de St. Croix: parque zonificado que incluye un área sin captura (las zonas no están dibujadas aquí). Consulta al DPNR.'}, 'https://dpnr.vi.gov/wp-content/uploads/2024/02/Fisher-Handbook-2023_Website.pdf'),
 'vi_other': ({'en': 'USVI protected area: check DPNR/NPS rules.', 'es': 'Área protegida de USVI: revisa las reglas del DPNR/NPS.'}, TNC),
 'pr_notake': ({'en': 'Puerto Rico marine reserve reported as no-take: no fishing.',
                'es': 'Reserva marina de Puerto Rico reportada como sin captura: prohibido pescar.'}, 'https://www.protectedplanet.net/'),
 'pr_mona': ({'en': 'Isla de Mona y Monito reserve: fishing restricted, with a no-take zone. Check DRNA.',
              'es': 'Reserva de Isla de Mona y Monito: pesca restringida, con una zona sin captura. Consulta al DRNA.'}, 'https://www.drna.pr.gov/'),
 'pr_rn': ({'en': 'Puerto Rico natural reserve (DRNA): fishing allowed with restrictions. Check DRNA rules.',
            'es': 'Reserva natural de Puerto Rico (DRNA): pesca permitida con restricciones. Revisa las reglas del DRNA.'}, 'https://www.drna.pr.gov/'),
 'jm_sfca': ({'en': 'Jamaica fish sanctuary (Special Fishery Conservation Area): fishing prohibited (Fisheries Act 2018, s. 94).',
              'es': 'Santuario de peces de Jamaica (Área Especial de Conservación Pesquera): prohibido pescar (Fisheries Act 2018, s. 94).'}, 'https://faolex.fao.org/docs/pdf/jam189032.pdf'),
 'jm_park': ({'en': 'Jamaica marine park / protected area: zoned, with no-fishing zones. Check NEPA/NFA rules.',
              'es': 'Parque marino o área protegida de Jamaica: zonificado, con zonas sin pesca. Revisa las reglas de NEPA/NFA.'}, TNC),
 'do_park': ({'en': 'Dominican protected area (Ley 202-04): extraction restricted. Sport-fishing rules not confirmed online — check the Ministerio de Medio Ambiente.',
              'es': 'Área protegida dominicana (Ley 202-04): extracción restringida. Reglas de pesca deportiva no confirmadas en línea; consulta al Ministerio de Medio Ambiente.'}, TNC),
 'cu_jdlr': ({'en': 'Jardines de la Reina National Park: commercial fishing banned; sport fishing only catch-and-release through the authorized operator.',
              'es': 'Parque Nacional Jardines de la Reina: pesca comercial prohibida; pesca deportiva solo de captura y liberación con el operador autorizado.'}, TNC),
 'cu_park': ({'en': 'Cuban protected area: fishing restricted; recreational fishing for visitors is normally catch-and-release with authorized operators. Check locally.',
              'es': 'Área protegida cubana: pesca restringida; la pesca recreativa de visitantes normalmente es de captura y liberación con operadores autorizados. Verifica localmente.'}, TNC),
 'tc_np': ({'en': 'Turks & Caicos national park: fishing prohibited.',
            'es': 'Parque nacional de Turks y Caicos: prohibido pescar.'}, 'https://www.visittci.com/things-to-do/fishing-licenses-and-regulations'),
 'tc_nr': ({'en': 'Turks & Caicos nature reserve / sanctuary: fishing restricted. Check DECR.',
            'es': 'Reserva natural o santuario de Turks y Caicos: pesca restringida. Consulta al DECR.'}, TNC),
}

S = {}  # objectid -> (rule, category, kind, notekey, conf, nameOverride)
def add(ids, rule, cat, kind, nk, conf, name=None):
    for i in ids: S[i] = (rule, cat, kind, nk, conf, name)

# Bahamas
add([1731], 'no-take', 'Land and Sea Park', 'national-park', 'bnt_notake', 'high')
add([811], 'no-take', 'Land and Sea Park', 'national-park', 'bnt_notake_wdpa', 'medium')
add([538, 545], 'no-take', 'Marine Reserve', 'fishery-reserve', 'bs_reserve_nt', 'low')
add([130, 551, 550], 'rules', 'Marine Reserve', 'fishery-reserve', 'bs_reserve', 'low')
add([1498, 541, 97, 98, 401, 1321, 1302, 1303, 552, 556, 1061, 1331, 1318, 1319, 1322, 1060, 1057, 1352, 1351, 1332, 1301], 'rules', 'National Park', 'national-park', 'bs_park', 'low')
add([1337], 'rules', 'Spawning aggregation site', 'spawning-site', 'bs_spagg', 'low')
# Cayman: classify by the Rules text (2021 regulations)
for oid, a in attrs.items():
    if a['COUNTRY'] != 'Cayman Islands': continue
    r = (a['Rules'] or '')
    if not r: continue
    if 'Line Fishing from shore only' in r: add([oid], 'no-take', 'Shore Line Fishing Zone', 'marine-park', 'ky_slfz', 'high')
    elif 'Take of fish by hook and line only' in r: add([oid], 'rules', 'Line Fishing Zone', 'marine-park', 'ky_lfz', 'high')
    elif r.startswith('No taking of any marine life, alive or dead, except: fry'): add([oid], 'no-take', 'Marine Reserve Zone', 'marine-reserve', 'ky_mr', 'high')
    elif 'No in-water activities' in r: add([oid], 'no-take', 'Environmental Zone', 'marine-reserve', 'ky_ez', 'high')
    elif r.startswith('No taking any marine life'): add([oid], 'no-take', 'Wildlife Interaction Zone', 'marine-park', 'ky_wiz', 'high')
    elif r.startswith('1 December to 30 April'): add([oid], 'rules', 'Spawning Aggregation Zone', 'seasonal-closure', 'ky_spagg', 'high')
# BVI: the 14 Fisheries Protected Areas named by the government (2020) + RMS Rhone
add([387, 383, 384, 353, 351, 389, 366, 402, 403, 375, 367, 388, 379, 356, 357], 'no-take', 'Fisheries Protected Area', 'fishery-reserve', 'vg_fpa', 'high')
add([404], 'no-take', 'Marine Park', 'marine-park', 'vg_mp', 'medium')
add([378, 377, 369, 370], 'rules', 'Protected area', 'other', 'vg_other', 'low')
# USVI (federal areas are built from eCFR separately)
add([1828], 'no-take', 'National Monument', 'national-monument', 'vi_buck', 'high')
add([1842], 'no-take', 'National Monument', 'national-monument', 'vi_vicrnm', 'high')
add([1841], 'rules', 'National Park', 'national-park', 'vi_np', 'high')
add([1839], 'rules', 'Marine Reserve', 'marine-reserve', 'vi_steer', 'medium')
add([1827], 'rules', 'Marine Park', 'marine-park', 'vi_eemp', 'medium')
add([1831], 'rules', 'National Historical Park', 'national-park', 'vi_other', 'low')
# Puerto Rico
add([861], 'no-take', 'Reserva Natural', 'marine-reserve', 'pr_notake', 'medium', 'Reserva Natural Canal Luis Peña')
add([863], 'no-take', 'Reserva Marina', 'marine-reserve', 'pr_notake', 'medium', 'Reserva Marina Tres Palmas de Rincón')
add([864], 'no-take', 'Reserva Marina', 'marine-reserve', 'pr_notake', 'medium', 'Reserva Marina Isla de Desecheo')
add([857], 'rules', 'Reserva Natural', 'marine-reserve', 'pr_mona', 'medium', 'Reserva Natural Isla de Mona y Monito (marina)')
add([881, 845, 858, 878, 880, 919, 920, 877, 859, 901, 893, 860, 862, 1052, 921], 'rules', 'Reserva Natural', 'natural-reserve', 'pr_rn', 'low')
# Jamaica
add([125, 1103, 1102, 59, 1305, 152, 1518, 15, 64, 159, 24, 153, 61, 106, 1304], 'no-take', 'Special Fishery Conservation Area', 'fishery-reserve', 'jm_sfca', 'medium')
add([1376, 1375, 1606, 1605, 1372, 1499], 'rules', 'Marine Park / Protected Area', 'marine-park', 'jm_park', 'low')
# Dominican Republic
add([1192, 1191, 1183, 1529, 1181, 1223, 1519, 1182, 1221, 1185], 'rules', 'Área protegida', 'national-park', 'do_park', 'low')
# Cuba
add([650], 'rules', 'Parque Nacional', 'national-park', 'cu_jdlr', 'medium')
add([644, 671, 648, 720, 661, 568, 653, 744, 729, 647, 707, 577, 1370], 'rules', 'Área protegida', 'national-park', 'cu_park', 'low')
# Turks & Caicos
add([1863, 1867, 1865, 41, 533, 1857, 42, 1860, 1861], 'no-take', 'National Park', 'national-park', 'tc_np', 'medium')
add([156, 83, 1859, 1864, 1866, 1858, 63, 1904], 'rules', 'Nature Reserve / Sanctuary', 'nature-reserve', 'tc_nr', 'low')

out = {}
for oid, (rule, cat, kind, nk, conf, name) in S.items():
    a = attrs[oid]
    note, src = N[nk]
    out[str(oid)] = {'name': name or (a['AREANAM'] or '').strip(), 'country': a['COUNTRY'], 'category': cat, 'kind': kind, 'rule': rule,
                     'note': note, 'source': src if src == TNC else f'{src} · boundary: {TNC}', 'conf': conf}
json.dump(out, open(os.path.join(DL, 'tnc_select.json'), 'w'), ensure_ascii=False, indent=1)
print(len(out), 'selected')
