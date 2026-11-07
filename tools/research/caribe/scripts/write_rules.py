"""Write rules.json for the caribe data region. Usage: python3 -I write_rules.py <out_dir>"""
import json, os, sys
OUT = sys.argv[1]
READ = '2026-11-06'
E = 'https://www.ecfr.gov/current/title-50/chapter-VI/part-622'
ePR, eSTX, eSTT = E + '/subpart-S', E + '/subpart-T', E + '/subpart-U'
HMS = 'https://www.fisheries.noaa.gov/s3/2026-02/HMS-Recreational-Compliance-Guide-2026-020325-Final.pdf'
PR7949 = 'https://www.drna.pr.gov/wp-content/uploads/2018/07/Resumen-7949.pdf'
VIHB = 'https://dpnr.vi.gov/wp-content/uploads/2024/02/Fisher-Handbook-2023_Website.pdf'
BMOT = 'https://www.bahamas.com/fishing-permit'
BHS25 = 'https://www.bahamascustoms.gov.bs/wp-content/uploads/2025/07/Fisheries-Resources-Jurisdiction-And-Conservation-Amendment-Regulations-2025.pdf'
BHSNG = 'https://www.bahamas.gov.bs/wps/wcm/connect/mof_content/internet/all+notices/nassau+grouper+season+closure+2021'
KYMP = 'https://cnslibrary.com/wp-content/uploads/National-Conservation-Marine-Parks-Regulations-2021-1.pdf'
KYCL = 'https://caymanresident.com/things-to-do/boating/marine-rules-regulations/catch-limits'
TC = 'https://www.visittci.com/things-to-do/fishing-licenses-and-regulations'
TCNG = 'https://www.gov.tc/pressoffice/latest?start=286'
VGPR = 'https://bvi.gov.vg/media-centre/speargun-fishing-strictly-prohibited'
VGNS = 'https://v2.noonsite.com/place/british-virgin-islands/view/restrictions'
JM = 'https://faolex.fao.org/docs/pdf/jam189032.pdf'
CU = 'https://faolex.fao.org/docs/pdf/cub194447.pdf'
VIDP = 'https://dpnr.vi.gov/wp-content/uploads/2025/10/Seasonal-Closures-2025.pdf'

def L(en, es, src): return {'en': en, 'es': es, 'src': src}
HMS_BILL = {
 'blue-marlin': L('Federal HMS: min 99 in LJFL; HMS Angling (or Charter/Headboat) permit required; report every landing. Applies in federal and territorial waters for permit holders.', 'HMS federal: mínimo 99 pulg. LJFL; se requiere permiso HMS Angling (o Charter/Headboat); reportar cada captura retenida. Aplica en aguas federales y territoriales para quien tiene el permiso.', HMS),
 'white-marlin': L('Federal HMS: min 66 in LJFL; HMS permit required.', 'HMS federal: mínimo 66 pulg. LJFL; se requiere permiso HMS.', HMS),
 'pacific-sailfish': L('Atlantic sailfish, federal HMS: min 63 in LJFL; HMS permit required.', 'Pez vela del Atlántico, HMS federal: mínimo 63 pulg. LJFL; se requiere permiso HMS.', HMS),
 'swordfish': L('Federal HMS: min 47 in LJFL; 1 per person, max 4 per vessel per trip (private); HMS permit required.', 'HMS federal: mínimo 47 pulg. LJFL; 1 por persona, máximo 4 por embarcación por viaje (privadas); se requiere permiso HMS.', HMS),
 'yellowfin-tuna': L('Federal HMS: min 27 in CFL; 3 per person per day; HMS permit required.', 'HMS federal: mínimo 27 pulg. CFL; 3 por persona al día; se requiere permiso HMS.', HMS),
 'skipjack-tuna': L('Federal HMS: no size or bag limit, but an HMS permit is required.', 'HMS federal: sin talla ni límite, pero se requiere permiso HMS.', HMS),
 'bull-shark': L('Federal HMS: min 54 in FL, 1 shark per vessel per trip; HMS permit with shark endorsement; non-stainless circle hooks with natural bait.', 'HMS federal: mínimo 54 pulg. FL, 1 tiburón por embarcación por viaje; permiso HMS con endoso de tiburón; anzuelo circular no inoxidable con carnada natural.', HMS),
 'silky-shark': L('Retention prohibited (federal HMS). Release.', 'Prohibido retener (HMS federal). Liberar.', HMS),
 'shortfin-mako': L('Retention prohibited in the Atlantic (federal HMS). Release in the water.', 'Prohibido retener en el Atlántico (HMS federal). Liberar sin sacarlo del agua.', HMS),
}

juris = {
 'bs': {'en': 'The Bahamas', 'es': 'Bahamas', 'agency': 'Department of Marine Resources (DMR); Bahamas National Trust (parks)', 'url': 'https://www.bahamas.gov.bs/marineresources',
        'license': {'en': 'Non-Bahamian-owned boats need a sport fishing permit, issued when clearing customs at a port of entry (US$100 up to 34 ft, US$300 over 34 ft since 1 Jul 2025). Fishing from shore or a Bahamian-owned boat needs no permit; flats fly fishing needs its own licence.',
                    'es': 'Las embarcaciones de propiedad no bahameña necesitan un permiso de pesca deportiva, que se emite al hacer aduana en un puerto de entrada (US$100 hasta 34 pies, US$300 más de 34 pies desde el 1 jul 2025). Pescar desde la orilla o en un barco bahameño no requiere permiso; la pesca con mosca en bajos requiere licencia aparte.'},
        'neverKeep': {'en': ['All sharks (protected since 2011)', 'Billfish: marlin, sailfish, swordfish (release unless in an approved tournament)', 'Nassau grouper from Dec 1 to Feb 28', 'Sea turtles'],
                      'es': ['Todos los tiburones (protegidos desde 2011)', 'Picudos: marlín, pez vela, pez espada (liberar salvo en torneo aprobado)', 'Cherna (mero de Nassau) del 1 dic al 28 feb', 'Tortugas marinas']},
        'sources': [BMOT, BHS25, BHSNG], 'read': READ, 'conf': 'medium'},
 'tc': {'en': 'Turks and Caicos Islands', 'es': 'Islas Turcas y Caicos', 'agency': 'Department of Environment and Coastal Resources (DECR)', 'url': 'https://www.gov.tc/decr/',
        'license': {'en': 'Fishing licence required for everyone except under-16s and TCI Islanders (1 day $10, 30 days $30). No fishing in national parks. Spearfishing and scuba fishing banned. (Unofficial summary — DECR page not reachable.)',
                    'es': 'Licencia de pesca obligatoria salvo menores de 16 e isleños de TCI (1 día $10, 30 días $30). Prohibido pescar en parques nacionales. Prohibido el arpón y pescar con equipo de buceo. (Resumen no oficial: la página del DECR no estuvo disponible.)'},
        'neverKeep': {'en': ['Nassau grouper from Dec 1 to end of Feb'], 'es': ['Cherna (mero de Nassau) del 1 dic a fin de feb']},
        'sources': [TC, TCNG], 'read': READ, 'conf': 'low'},
 'cu': {'en': 'Cuba', 'es': 'Cuba', 'agency': 'Ministerio de la Industria Alimentaria (MINAL) — Dirección de Regulaciones Pesqueras', 'url': CU,
        'license': {'en': 'Recreational fishing only with rod, line and hook (cast net for bait); catch is for personal use and may not be sold (Decreto 1/2019). Species and bag limits are set by MINAL resolution — not found online. Visitors fish through authorized marinas/operators.',
                    'es': 'Pesca recreativa solo con vara, cordel y anzuelo (atarraya solo para carnada); la captura es para consumo personal y no puede venderse (Decreto 1/2019). Especies y cantidades las fija una resolución del MINAL que no se encontró en línea. Los visitantes pescan con marinas u operadores autorizados.'},
        'neverKeep': {'en': [], 'es': []}, 'sources': [CU, 'https://faolex.fao.org/docs/pdf/cub215371.pdf'], 'read': READ, 'conf': 'low'},
 'ky': {'en': 'Cayman Islands', 'es': 'Islas Caimán', 'agency': 'Department of Environment (DoE) / National Conservation Council', 'url': 'https://doe.ky/',
        'license': {'en': 'Hook-and-line fishing outside marine parks; Marine Parks Regulations 2021 zone the coast (marine reserve = no take; line-fishing zones = hook and line only). Licence rules for visitors not confirmed online — check DoE.',
                    'es': 'Pesca con anzuelo y línea fuera de los parques marinos; el Reglamento de Parques Marinos 2021 zonifica la costa (reserva marina = sin captura; zonas de pesca con línea = solo anzuelo y línea). Requisitos de licencia para visitantes no confirmados en línea: consulta al DoE.'},
        'neverKeep': {'en': ['Goliath grouper (jewfish)', 'Nassau grouper from Dec 1 to Apr 30'], 'es': ['Mero guasa (cherna)', 'Cherna (mero de Nassau) del 1 dic al 30 abr']},
        'sources': [KYMP, KYCL], 'read': READ, 'conf': 'medium'},
 'jm': {'en': 'Jamaica', 'es': 'Jamaica', 'agency': 'National Fisheries Authority (NFA); NEPA (protected areas)', 'url': JM,
        'license': {'en': 'Recreational and tournament boats need a recreational fishing vessel licence from the National Fisheries Authority (Fisheries Act 2018, s. 46). No fishing in fish sanctuaries.',
                    'es': 'Las embarcaciones recreativas y de torneo necesitan una licencia de embarcación de pesca recreativa de la National Fisheries Authority (Fisheries Act 2018, s. 46). Prohibido pescar en santuarios de peces.'},
        'neverKeep': {'en': [], 'es': []}, 'sources': [JM], 'read': READ, 'conf': 'medium'},
 'do': {'en': 'Dominican Republic', 'es': 'República Dominicana', 'agency': 'CODOPESCA (Ley 307-04); Ministerio de Medio Ambiente (áreas protegidas, Ley 202-04)', 'url': 'https://leap.unep.org/en/countries/do/national-legislation/ley-no-307-04-crea-el-consejo-dominicano-de-pesca-y-acuicultura',
        'license': {'en': 'Sport fishing is regulated by CODOPESCA; licence and bag-limit details were not found online. Billfish are released by local custom (Cap Cana, Casa de Campo) — not confirmed as law.',
                    'es': 'La pesca deportiva la regula CODOPESCA; no se encontraron en línea los requisitos de licencia ni los límites. Por costumbre local se liberan los picudos (Cap Cana, Casa de Campo); no confirmado como ley.'},
        'neverKeep': {'en': [], 'es': []}, 'sources': ['https://leap.unep.org/en/countries/do/national-legislation/ley-no-307-04-crea-el-consejo-dominicano-de-pesca-y-acuicultura'], 'read': READ, 'conf': 'low'},
 'us-pr': {'en': 'Puerto Rico (US)', 'es': 'Puerto Rico (EE. UU.)', 'agency': 'DRNA (state waters, 0–9 nm) + NOAA Fisheries / Caribbean Fishery Management Council (federal waters, 9–200 nm)', 'url': 'https://www.drna.pr.gov/',
        'license': {'en': 'DRNA recreational fishing licence in Puerto Rico waters (Reglamento 7949); NOAA HMS Angling or Charter/Headboat permit for tunas, billfish, swordfish and sharks. Federal and state rules differ — check which waters you are in.',
                    'es': 'Licencia de pesca recreativa del DRNA en aguas de Puerto Rico (Reglamento 7949); permiso HMS Angling o Charter/Headboat de NOAA para atunes, picudos, pez espada y tiburones. Las reglas federales y estatales difieren: verifica en qué aguas estás.'},
        'neverKeep': {'en': ['Goliath grouper', 'Nassau grouper', 'Blue, midnight and rainbow parrotfish (federal)', 'Giant manta, spotted eagle ray, southern stingray (federal)', 'Nurse shark (PR waters)', 'Shortfin mako, silky, oceanic whitetip, great/scalloped/smooth hammerhead and other prohibited sharks', 'Tarpon, bonefish, permit and palometa: catch-and-release only in PR waters'],
                      'es': ['Mero guasa (cherna)', 'Cherna (mero de Nassau)', 'Loros azul, de medianoche y arcoíris (federal)', 'Manta gigante, chucho pintado y raya del sur (federal)', 'Tiburón gata (aguas de PR)', 'Mako, piloto (sedoso), oceánico de puntas blancas, martillos y otros tiburones prohibidos', 'Sábalo, macabí, palometa y pámpano: solo captura y liberación en aguas de PR']},
        'sources': [PR7949, ePR, HMS], 'read': READ, 'conf': 'medium',
        'note': {'en': 'PR summary is DRNA\'s guide to Reglamento 7949 (2010); confirm current state rules with DRNA.', 'es': 'El resumen de PR es la guía del DRNA del Reglamento 7949 (2010); confirma las reglas estatales vigentes con el DRNA.'}},
 'us-vi': {'en': 'US Virgin Islands', 'es': 'Islas Vírgenes de EE. UU.', 'agency': 'DPNR Division of Fish & Wildlife / Environmental Enforcement (0–3 nm) + NOAA Fisheries (federal waters); NPS (national park and monuments)', 'url': 'https://dpnr.vi.gov/fish-and-wildlife/',
        'license': {'en': 'USVI recreational fishing licence (gooutdoorsusvi.com, V.I.R.R. Title 12 Subchapter 106); NOAA HMS permit for tunas, billfish, swordfish and sharks.',
                    'es': 'Licencia de pesca recreativa de USVI (gooutdoorsusvi.com, V.I.R.R. Título 12, Subcapítulo 106); permiso HMS de NOAA para atunes, picudos, pez espada y tiburones.'},
        'neverKeep': {'en': ['Goliath grouper', 'Nassau grouper', 'Blue, midnight and rainbow parrotfish (federal)', 'Tarpon and bonefish (catch-and-release only)', 'Shortfin mako, silky, oceanic whitetip, hammerheads and other prohibited sharks'],
                      'es': ['Mero guasa (cherna)', 'Cherna (mero de Nassau)', 'Loros azul, de medianoche y arcoíris (federal)', 'Sábalo y macabí (solo captura y liberación)', 'Mako, piloto (sedoso), oceánico de puntas blancas, martillos y otros tiburones prohibidos']},
        'sources': [VIHB, VIDP, eSTT, eSTX, HMS], 'read': READ, 'conf': 'high'},
 'vg': {'en': 'British Virgin Islands', 'es': 'Islas Vírgenes Británicas', 'agency': 'Ministry of Environment, Natural Resources & Climate Change — Conservation & Fisheries Department; National Parks Trust', 'url': VGPR,
        'license': {'en': 'Non-belongers need a recreational fishing licence (30-day pleasure licence) to take any marine life. Spearguns and scuba fishing banned (Fisheries Act 1997 s. 50). No fishing in marine parks or the 14 Fisheries Protected Areas.',
                    'es': 'Los no residentes necesitan una licencia de pesca recreativa (licencia temporal de 30 días) para extraer cualquier especie. Prohibido el arpón con fusil y pescar con equipo de buceo (Fisheries Act 1997, s. 50). Prohibido pescar en parques marinos y en las 14 áreas de protección pesquera.'},
        'neverKeep': {'en': ['Billfish: blue and white marlin, sailfish, swordfish (possession illegal — unofficial source)'], 'es': ['Picudos: marlín azul y blanco, pez vela, pez espada (posesión ilegal; fuente no oficial)']},
        'sources': [VGPR, VGNS], 'read': READ, 'conf': 'low'},
}

limits = {
 'bs': {
  'dorado': L('Visitors: 18 pelagic fish per vessel in total (dolphin, wahoo, kingfish, tuna combined); same limit when leaving.', 'Visitantes: 18 pelágicos por embarcación en total (dorado, wahoo, peto/sierra y atunes juntos); mismo límite al salir.', BMOT),
  'wahoo': L('Counts toward 18 pelagic fish per vessel.', 'Cuenta dentro de los 18 pelágicos por embarcación.', BMOT),
  'king-mackerel': L('Counts toward 18 pelagic fish per vessel.', 'Cuenta dentro de los 18 pelágicos por embarcación.', BMOT),
  'yellowfin-tuna': L('Counts toward 18 pelagic fish per vessel.', 'Cuenta dentro de los 18 pelágicos por embarcación.', BMOT),
  'blackfin-tuna': L('Counts toward 18 pelagic fish per vessel.', 'Cuenta dentro de los 18 pelágicos por embarcación.', BMOT),
  'skipjack-tuna': L('Counts toward 18 pelagic fish per vessel.', 'Cuenta dentro de los 18 pelágicos por embarcación.', BMOT),
  'mutton-snapper': L('Demersal fish (snappers, groupers): 20 fish or 60 lb per vessel, whichever is less.', 'Peces de fondo (pargos, meros): 20 peces o 60 lb por embarcación, lo que sea menor.', BMOT),
  'yellowtail-snapper': L('Counts toward 20 demersal fish / 60 lb per vessel.', 'Cuenta dentro de los 20 peces de fondo / 60 lb por embarcación.', BMOT),
  'black-grouper': L('Counts toward 20 demersal fish / 60 lb per vessel.', 'Cuenta dentro de los 20 peces de fondo / 60 lb por embarcación.', BMOT),
  'red-grouper': L('Counts toward 20 demersal fish / 60 lb per vessel.', 'Cuenta dentro de los 20 peces de fondo / 60 lb por embarcación.', BMOT),
  'blue-marlin': L('Release all billfish unless fishing in an approved tournament.', 'Liberar todos los picudos salvo en torneo aprobado.', BMOT),
  'white-marlin': L('Release all billfish unless fishing in an approved tournament.', 'Liberar todos los picudos salvo en torneo aprobado.', BMOT),
  'pacific-sailfish': L('Release all billfish unless fishing in an approved tournament.', 'Liberar todos los picudos salvo en torneo aprobado.', BMOT),
  'swordfish': L('Release all billfish unless fishing in an approved tournament.', 'Liberar todos los picudos salvo en torneo aprobado.', BMOT),
  'bonefish': L('No catch limit; catch-and-release strongly encouraged. Flats fly fishing needs a licence and Bahamian-registered boat.', 'Sin límite de captura; se recomienda captura y liberación. La pesca con mosca en bajos requiere licencia y barco registrado en Bahamas.', BMOT),
  'nassau-grouper': L('Not mapped. Closed Dec 1 – Feb 28 (annual DMR notice): no taking, landing or sale.', 'No se mapea. Veda del 1 dic al 28 feb (aviso anual del DMR): prohibido capturar, desembarcar o vender.', BHSNG),
 },
 'tc': {
  'nassau-grouper': L('Not mapped. Closed Dec 1 – end of Feb; open season 21–35 in (unofficial).', 'No se mapea. Veda del 1 dic a fin de feb; en temporada 21–35 pulg. (no oficial).', TCNG),
  'bonefish': L('Minimum 20 in (unofficial summary).', 'Mínimo 20 pulg. (resumen no oficial).', TC),
 },
 'ky': {
  'nassau-grouper': L('Not mapped. Closed Dec 1 – Apr 30; in season 5 per person or 5 per boat (whichever is less), 16–24 in.', 'No se mapea. Veda del 1 dic al 30 abr; en temporada 5 por persona o 5 por embarcación (lo que sea menor), 16–24 pulg.', KYCL),
  'tarpon': L('Catch-and-release is allowed even inside Marine Reserve zones (also bonefish and permit).', 'Se permite captura y liberación incluso dentro de las zonas de reserva marina (también macabí y palometa).', KYMP),
 },
 'us-pr': {**HMS_BILL,
  'dorado': L('PR waters: 10 per person, 30 per vessel. Federal: 5 per person, max 15 per vessel; min 24 in FL.', 'Aguas de PR: 10 por persona, 30 por embarcación. Federal: 5 por persona, máx. 15 por embarcación; mínimo 24 pulg. FL.', ePR + '/section-622.444'),
  'wahoo': L('PR waters ("peto"): 5 per person, 10 per vessel. Federal: 5 per person, max 10 per vessel; min 32 in FL.', 'Aguas de PR ("peto"): 5 por persona, 10 por embarcación. Federal: 5 por persona, máx. 10 por embarcación; mínimo 32 pulg. FL.', ePR + '/section-622.441'),
  'king-mackerel': L('PR waters ("sierra"): 5 per person, 10 per vessel; min 20 in.', 'Aguas de PR ("sierra"): 5 por persona, 10 por embarcación; mínimo 20 pulg.', PR7949),
  'cero': L('PR waters: min 16 in.', 'Aguas de PR: mínimo 16 pulg.', PR7949),
  'yellowfin-tuna': L('Federal HMS: min 27 in CFL; 3 per person per day (same quota in PR waters); HMS permit.', 'HMS federal: mínimo 27 pulg. CFL; 3 por persona al día (misma cuota en aguas de PR); permiso HMS.', HMS),
  'common-snook': L('PR waters: slot 22–38 in.', 'Aguas de PR: entre 22 y 38 pulg.', PR7949),
  'tarpon': L('Catch-and-release only in PR waters.', 'Solo captura y liberación en aguas de PR.', PR7949),
  'bonefish': L('Catch-and-release only in PR waters.', 'Solo captura y liberación en aguas de PR.', PR7949),
  'permit': L('Catch-and-release only in PR waters (also palometa).', 'Solo captura y liberación en aguas de PR (también la palometa).', PR7949),
  'mutton-snapper': L('Closed Apr 1 – May 30 in PR waters and Apr 1 – Jun 30 in federal waters. Federal: groupers + snappers + parrotfish 5 per person or 15 per vessel (3+ aboard).', 'Veda del 1 abr al 30 may en aguas de PR y del 1 abr al 30 jun en aguas federales. Federal: meros + pargos + loros 5 por persona o 15 por embarcación (3 o más a bordo).', ePR + '/section-622.439'),
  'yellowtail-snapper': L('Min 12 in TL (federal), 10.5 in (PR waters); counts toward the federal 5/15 snapper-grouper bag.', 'Mínimo 12 pulg. LT (federal), 10.5 pulg. (aguas de PR); cuenta dentro del límite federal de 5/15 de pargos y meros.', ePR + '/section-622.441'),
  'black-grouper': L('Closed Feb 1 – Apr 30 in FEDERAL waters only (not in PR waters, 0–9 nm). Federal bag: 5 per person / 15 per vessel with snappers.', 'Veda del 1 feb al 30 abr solo en aguas FEDERALES (no en aguas de PR, 0–9 mn). Límite federal: 5 por persona / 15 por embarcación junto con pargos.', ePR + '/section-622.439'),
  'red-grouper': L('Closed Feb 1 – Apr 30 in FEDERAL waters only. Federal bag: 5 per person / 15 per vessel with snappers.', 'Veda del 1 feb al 30 abr solo en aguas FEDERALES. Límite federal: 5 por persona / 15 por embarcación junto con pargos.', ePR + '/section-622.439'),
  'goliath-grouper': L('Prohibited in PR and federal waters. Release.', 'Prohibido en aguas de PR y federales. Liberar.', ePR + '/section-622.438'),
  'greater-amberjack': L('Federal: jacks count in a 5 per person / 15 per vessel aggregate.', 'Federal: los jureles cuentan dentro de un total de 5 por persona / 15 por embarcación.', ePR + '/section-622.444'),
  'almaco-jack': L('Federal: jacks count in a 5 per person / 15 per vessel aggregate.', 'Federal: los jureles cuentan dentro de un total de 5 por persona / 15 por embarcación.', ePR + '/section-622.444'),
  'atlantic-jack': L('Federal: jacks count in a 5 per person / 15 per vessel aggregate.', 'Federal: los jureles cuentan dentro de un total de 5 por persona / 15 por embarcación.', ePR + '/section-622.444'),
  'nassau-grouper': L('Not mapped. Prohibited year-round.', 'No se mapea. Prohibida todo el año.', ePR + '/section-622.438'),
 },
 'us-vi': {**HMS_BILL,
  'dorado': L('Federal: 10 per person, max 32 per vessel; min 24 in FL.', 'Federal: 10 por persona, máx. 32 por embarcación; mínimo 24 pulg. FL.', eSTT + '/section-622.519'),
  'wahoo': L('Federal: 2 per person, max 10 per vessel; min 32 in FL.', 'Federal: 2 por persona, máx. 10 por embarcación; mínimo 32 pulg. FL.', eSTT + '/section-622.519'),
  'mutton-snapper': L('Closed Apr 1 – Jun 30 in territorial and federal waters. Federal: groupers + snappers + parrotfish 5 per person or 15 per vessel.', 'Veda del 1 abr al 30 jun en aguas territoriales y federales. Federal: meros + pargos + loros 5 por persona o 15 por embarcación.', VIHB),
  'black-grouper': L('Closed Feb 1 – Apr 30 in territorial and federal waters.', 'Veda del 1 feb al 30 abr en aguas territoriales y federales.', VIHB),
  'red-grouper': L('Closed Feb 1 – Apr 30 in territorial and federal waters.', 'Veda del 1 feb al 30 abr en aguas territoriales y federales.', VIHB),
  'yellowtail-snapper': L('Min 12 in TL (federal); counts toward the 5/15 snapper-grouper bag.', 'Mínimo 12 pulg. LT (federal); cuenta dentro del límite de 5/15 de pargos y meros.', eSTT + '/section-622.516'),
  'goliath-grouper': L('Prohibited year-round (territorial and federal).', 'Prohibido todo el año (aguas territoriales y federales).', VIHB),
  'tarpon': L('No harvest: catch-and-release with hook and line only.', 'Sin retención: solo captura y liberación con anzuelo y línea.', VIHB),
  'bonefish': L('No harvest: catch-and-release with hook and line only.', 'Sin retención: solo captura y liberación con anzuelo y línea.', VIHB),
  'greater-amberjack': L('St. Thomas/St. John federal: jacks in a 5 per person / 15 per vessel aggregate (St. Croix federal list does not include jacks).', 'Federal St. Thomas/St. John: jureles dentro de un total de 5 por persona / 15 por embarcación (la lista federal de St. Croix no incluye jureles).', eSTT + '/section-622.519'),
  'almaco-jack': L('St. Thomas/St. John federal: jacks in a 5/15 aggregate.', 'Federal St. Thomas/St. John: jureles dentro de un total de 5/15.', eSTT + '/section-622.519'),
  'atlantic-jack': L('St. Thomas/St. John federal: jacks in a 5/15 aggregate.', 'Federal St. Thomas/St. John: jureles dentro de un total de 5/15.', eSTT + '/section-622.519'),
  'nassau-grouper': L('Not mapped. Prohibited year-round.', 'No se mapea. Prohibida todo el año.', VIHB),
 },
 'vg': {
  'blue-marlin': L('Possession of billfish reported illegal; release (unofficial source).', 'Se reporta ilegal poseer picudos; liberar (fuente no oficial).', VGNS),
  'white-marlin': L('Possession of billfish reported illegal; release (unofficial source).', 'Se reporta ilegal poseer picudos; liberar (fuente no oficial).', VGNS),
  'pacific-sailfish': L('Possession of billfish reported illegal; release (unofficial source).', 'Se reporta ilegal poseer picudos; liberar (fuente no oficial).', VGNS),
  'swordfish': L('Possession of billfish reported illegal; release (unofficial source).', 'Se reporta ilegal poseer picudos; liberar (fuente no oficial).', VGNS),
  'dorado': L('Reported limit: no more than 30 lb of fish on board (unofficial source).', 'Límite reportado: no más de 30 lb de pescado a bordo (fuente no oficial).', VGNS),
 },
 'jm': {}, 'do': {}, 'cu': {},
}

closures = [
 {'k': 'bs-sharks', 'species': ['bull-shark', 'silky-shark', 'shortfin-mako'], 'regions': ['bahamas'], 'periods': [[1, 1, 12, 31]],
  'en': 'Sharks are protected in The Bahamas: no shark fishing; release any shark hooked.', 'es': 'Los tiburones están protegidos en Bahamas: prohibido pescarlos; libera cualquier tiburón enganchado.',
  'source': BMOT, 'conf': 'high'},
 {'k': 'usvi-grouper', 'species': ['black-grouper', 'red-grouper'], 'areas': ['stthomas'], 'periods': [[2, 1, 4, 30]],
  'en': 'Black and red grouper closed season (USVI territorial and federal waters): Feb 1 – Apr 30.', 'es': 'Veda de negrillo y mero rojo (aguas territoriales y federales de USVI): 1 feb – 30 abr.',
  'source': f'{VIHB} · {eSTT}/section-622.514', 'conf': 'high'},
 {'k': 'usvi-mutton', 'species': ['mutton-snapper'], 'areas': ['stthomas'], 'periods': [[4, 1, 6, 30]],
  'en': 'Mutton snapper closed season (USVI territorial and federal waters): Apr 1 – Jun 30.', 'es': 'Veda de pargo criollo (aguas territoriales y federales de USVI): 1 abr – 30 jun.',
  'source': f'{VIHB} · {eSTT}/section-622.514', 'conf': 'high'},
 {'k': 'pr-mutton', 'species': ['mutton-snapper'], 'areas': ['prwest', 'prnorth'], 'periods': [[4, 1, 5, 30]],
  'en': 'Mutton snapper closed season in Puerto Rico: Apr 1 – May 30 in all waters; federal waters stay closed to Jun 30.', 'es': 'Veda de pargo criollo en Puerto Rico: 1 abr – 30 may en todas las aguas; en aguas federales sigue cerrada hasta el 30 jun.',
  'source': f'{PR7949} · {ePR}/section-622.439', 'conf': 'medium'},
]

rules = {'juris': juris, 'limits': limits, 'closures': closures,
         '_notes': {
          'release_only': 'Several fisheries here are legal catch-and-release only (billfish in The Bahamas and BVI; tarpon/bonefish/permit in PR; tarpon/bonefish in USVI; Jardines de la Reina). They are NOT closures (fishing is legal), so they are in limits, not closures — the app needs a "release only" badge rather than zeroing scores.',
          'federal_vs_state': 'Puerto Rico: state waters 0–9 nm; USVI territorial waters 0–3 nm. The PR black/red grouper closure (Feb 1–Apr 30) and the Apr–Jun mutton snapper closure in June are federal-only, so they are in limits, not closures.',
          'nassau-grouper': 'nassau-grouper is not a mapped species key; it is listed in limits only so the app can show the rule. Recommend never mapping it (critically endangered; prohibited in PR/USVI).',
          'read': READ,
         }}
with open(os.path.join(OUT, 'rules.json'), 'w', encoding='utf-8') as f:
    json.dump(rules, f, ensure_ascii=False, indent=1); f.write('\n')
print('ok', len(juris), 'juris', sum(len(v) for v in limits.values()), 'limits', len(closures), 'closures')
