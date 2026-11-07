import json
D='/tmp/claude-0/-home-claude/69c61f75-c416-5a6a-bc48-87f52ddc8247/scratchpad/expansion/uspac/'
def W(n,o): json.dump(o,open(D+n,'w'),ensure_ascii=False,indent=1)
BOOK='https://nrm.dfg.ca.gov/FileHandler.ashx?DocumentID=239985'
GF='https://wildlife.ca.gov/Fishing/Ocean/Regulations/Groundfish-Summary'
# ---------- areas ----------
A=lambda k,r,en,es,w,e,s,n,why:{'k':k,'d':'uspac','r':r,'j':'us-ca','en':en,'es':es,'box':{'w':w,'e':e,'s':s,'n':n},'why':why}
areas=[
A('sandiego','us-socal','San Diego','San Diego',-118.1,-117.1,32.45,33.3,'Point Loma and La Jolla kelp, Mission Bay, 9-Mile Bank, 182/302/371 spots, 43-Fathom Spot; Coronado Islands are Mexican waters'),
A('clemente','us-socal','San Clemente Island','Isla San Clemente',-118.75,-118.2,32.7,33.15,'San Clemente Island kelp and banks fished from San Diego, Dana Point and Long Beach (Navy closure zones apply)'),
A('catalina','us-socal','Catalina Island','Isla Catalina',-118.7,-118.2,33.2,33.6,'Catalina Island, its backside, the Slide and the Avalon bank'),
A('orangecounty','us-socal','Orange County','Orange County',-118.15,-117.3,33.1,33.75,'Huntington Flats, Newport, Laguna, Dana Point and Oceanside grounds, Box Canyon'),
A('losangeles','us-socal','Los Angeles','Los Ángeles',-118.95,-118.05,33.55,34.1,'Santa Monica Bay, Redondo Canyon, Palos Verdes, Horseshoe Kelp, Long Beach breakwater'),
A('ventura','us-socal','Ventura & Channel Islands','Ventura e Islas del Canal',-119.95,-118.85,33.4,34.35,'Anacapa, Santa Cruz, Santa Rosa and Santa Barbara islands, Hidden Reef and Osborn Bank from Ventura/Oxnard'),
A('santabarbara','us-socal','Santa Barbara','Santa Barbara',-120.7,-119.4,33.85,34.5,'Santa Barbara Channel, Point Conception, San Miguel Island'),
A('morrobay','us-central','Morro Bay & Port San Luis','Morro Bay y Port San Luis',-121.45,-120.55,34.85,35.75,'Piedras Blancas to Point Sal, Santa Lucia Bank side, Avila and Morro Bay reefs'),
A('monterey','us-central','Monterey Bay','Bahía de Monterey',-122.5,-121.75,36.4,37.15,'Monterey canyon, Carmel, Point Pinos, Soquel Hole and Santa Cruz reefs'),
A('halfmoonbay','us-norcal','Half Moon Bay','Half Moon Bay',-123.0,-122.35,37.1,37.65,'Pillar Point reefs, Pescadero and Pigeon Point, Montara'),
A('sanfrancisco','us-norcal','San Francisco & Farallones','San Francisco y Farallones',-123.3,-122.3,37.45,38.05,'Golden Gate, SF Bay halibut/striper flats, Farallon Islands, Duxbury and Pacifica'),
A('bodega','us-norcal','Bodega Bay & Cordell Bank','Bodega Bay y Cordell Bank',-123.65,-122.85,37.85,38.6,'Bodega Head, Point Reyes, Tomales Point and offshore Cordell Bank/edge'),
]
W('areas.json',areas)
# ---------- ports ----------
P=lambda name,lat,lon,src:{'name':name,'lat':lat,'lon':lon,'region':'uspac','src':src}
O='OSM '
ports=[
P('San Diego – Shelter Island / Point Loma landings',32.7145,-117.2281,O+'way 415327253 (Shelter Island marina); sportfishing landings ~0.4 km NE (OSM way 474295047)'),
P('San Diego – Mission Bay (Quivira Basin)',32.7625,-117.2389,O+'node 369165144 Quivira Basin'),
P('San Diego – Harbor Island',32.7259,-117.2009,O+'node 12339783502 Safe Harbor Cabrillo Isle'),
P('Chula Vista (South Bay)',32.6219,-117.1002,O+'node 13424117201 Safe Harbor South Bay'),
P('Oceanside Harbor',33.2078,-117.395,O+'node 358789993 Oceanside Harbor'),
P('Dana Point Harbor',33.4603,-117.7017,O+'node 358829720 West Basin'),
P('Newport Beach (Balboa)',33.6099,-117.915,O+'node 11914390437 (Lido/Newport Harbor); Balboa landings ~1 km E'),
P('Long Beach – Alamitos Bay',33.7515,-118.1125,O+'way 1460939373 Alamitos Bay Marina'),
P('Long Beach (Pierpoint Landing)',33.7609,-118.1965,O+'node 10278977653 Pierpoint Landing'),
P('San Pedro (22nd Street Landing)',33.7242,-118.2807,O+'way 670347082 22nd Street Landing'),
P('Redondo Beach (King Harbor)',33.8459,-118.3962,O+'way 854335933 King Harbor Marina'),
P('Marina del Rey',33.9724,-118.4511,O+'way 27624580 Marina del Rey'),
P('Avalon (Catalina)',33.3462,-118.3247,'Avalon Harbor basin, from nautical chart position (approximate, ±200 m)'),
P('Two Harbors (Catalina)',33.443,-118.4985,'Isthmus Cove, from nautical chart position (approximate, ±300 m)'),
P('Channel Islands Harbor (Oxnard)',34.1642,-119.2243,O+'node 358796410 Channel Islands Harbor'),
P('Ventura Harbor',34.2461,-119.2624,O+'way 1531568909 Ventura Harbor'),
P('Santa Barbara Harbor',34.4058,-119.6913,O+'way 452370893 Santa Barbara Harbor'),
P('Port San Luis (Avila)',35.172,-120.741,'Harford Pier hoist, Port San Luis Harbor District (approximate, ±300 m; OSM way 202499335 is the district office)'),
P('Morro Bay',35.37,-120.859,'Morro Bay Embarcadero (approximate, ±300 m)'),
P('Monterey',36.6033,-121.891,O+'way 35878154 Monterey Marina'),
P('Moss Landing',36.8037,-121.7895,O+'node 358795481 Moss Landing Harbor'),
P('Santa Cruz Harbor',36.9682,-122.001,O+'relation 9458343 Santa Cruz Small Craft Harbor'),
P('Pillar Point Harbor (Half Moon Bay)',37.5007,-122.4823,O+'node 358795791 Pillar Point Harbor'),
P('San Francisco (Fisherman\'s Wharf)',37.8095,-122.4191,O+'relation 14551822 Hyde Street Harbor'),
P('Sausalito',37.8705,-122.4981,O+'way 1310839271 Clipper Yacht Harbor'),
P('Emeryville',37.8402,-122.311,O+'node 3396258623 Emeryville Marina'),
P('Berkeley Marina',37.8665,-122.315,O+'way 117767451 Berkeley Marina'),
P('Richmond (Marina Bay)',37.9106,-122.3521,O+'node 358796100 Marina Bay'),
P('Bodega Bay (Spud Point)',38.3287,-123.0572,O+'way 1190045625 Spud Point Marina'),
]
W('ports.json',ports)
# ---------- seasons ----------
R=('us-socal','us-central','us-norcal')
def s(*v): return dict(zip(R,v))
NULL3=s(None,None,None)
seasons={
 'yellowtail':s('111233333211','000000111000',None),
 'white-seabass':s('112333322111','000122333210','000012332100'),
 'calico-bass':s('111223333211',None,None),
 'barred-sand-bass':s('000123332100',None,None),
 'california-halibut':s('112233332111','001223332110','001233332110'),
 'pacific-bluefin':s('001233333221','000001221000',None),
 'yellowfin-tuna':s('000001233210',None,None),
 'dorado':s('000000233210',None,None),
 'striped-marlin':s('000000123321',None,None),
 'swordfish':s('000000123321','000000011100',None),
 'shortfin-mako':s('000123332100','000001221000','000000111000'),
 'blue-shark':s('111233322111','000122221000','000012221000'),
 'pacific-bonito':s('112233332211','000012221000',None),
 'skipjack-tuna':s('000000122100',None,None),
 'giant-sea-bass':NULL3, 'pelagic-thresher':NULL3,
 'albacore':s('000000122210','000000123321','000000123320'),
 'california-barracuda':s('001233332100',None,None),
 'rockfish':s('222333332211','222333333222','222333333222'),
 'lingcod':s('222233322233','222233322233','222233322233'),
 'california-sheephead':s('222233333222','111111111111',None),
 'common-thresher':s('112333322111','000122221000','000123332100'),
}
# every other existing zones.js species: not found / not fished in California
OTHER=['blue-marlin','black-marlin','pacific-sailfish','wahoo','black-skipjack','striped-bonito','roosterfish','sierra','jack-crevalle','almaco-jack','pacific-dog-snapper','yellow-snapper','barred-pargo','leopard-grouper','mexican-barracuda','gulf-corvina','gulf-grouper','pacific-snook','pacific-goliath','pacific-red-snapper','spotted-rose-snapper','bull-shark','silky-shark']
for k in OTHER: seasons[k]=NULL3
seasons['_sources']={
 '_regions':'us-socal = Mexico border to Point Conception (34°27\'N) incl. Channel Islands = CDFW Southern Groundfish Management Area; us-central = Point Conception to Pigeon Point (37°11\'N) = Central GMA; us-norcal = Pigeon Point to the box edge at 38.6°N (Bodega) = southern part of the San Francisco GMA (Point Arena 38°57.5\'N). Boundaries chosen so groundfish closures map 1:1 to season regions.',
 '_method':'LOW confidence overall: built from well-documented fishery patterns (CDFW species accounts in "California\'s Living Marine Resources" and Review of Selected California Fisheries/CalCOFI reports; PFMC HMS SAFE descriptions; CDFW CRFS sampling) rather than a per-month catch dataset. No monthly RecFIN/CRFS series was downloaded. Calibrate with RecFIN CTE estimates (https://www.recfin.org) or CPFV logbooks before trusting fine month differences.',
 'yellowtail':'SoCal spring–fall run at the islands and coast; warm years reach Monterey (rare). medium/low',
 'white-seabass':'SoCal spring squid-spawn peak Mar–Jun (note 1-fish limit Mar 15–Jun 15 south of Pt Conception), Monterey/SF summer–fall in recent years. CDFW WSB Enhanced Status Report. low',
 'calico-bass':'Kelp bass are a SoCal species (rare north of Pt Conception); best in warm months. low',
 'barred-sand-bass':'Summer spawning aggregations (Jun–Aug) on sand flats (Huntington Flats, Silver Strand); CDFW barred sand bass ESR. medium',
 'california-halibut':'Spring–summer inshore movement; SF Bay summer fishery. CDFW California halibut ESR. low',
 'pacific-bluefin':'2012–2025 SoCal sport fishery near year-round offshore, peak May–Oct; occasional central coast. low',
 'yellowfin-tuna':'Warm-water summer/fall visitor, mainly Jul–Oct in SoCal; very variable year to year. low',
 'dorado':'Late summer–early fall on kelp paddies in warm years. low',
 'striped-marlin':'SoCal season Aug–Oct (peak Sep–Oct) off San Diego/Catalina. low',
 'swordfish':'Late summer–fall (harpoon and deep-drop) in SoCal; occasional central coast. low',
 'shortfin-mako':'Summer peak, SoCal Bight is a mako nursery (NOAA SWFSC juvenile shark survey). low',
 'blue-shark':'Present most of the year offshore; best spring–summer. low',
 'pacific-bonito':'SoCal mostly year-round, best summer–fall; reaches Monterey in warm years. low',
 'skipjack-tuna':'Only in warm summers/falls in SoCal. low',
 'giant-sea-bass':'Occurs in SoCal but take is prohibited in California (14 CCR §28.10) → null so it is never mapped as a target.',
 'pelagic-thresher':'Alopias pelagicus is essentially absent from California sport catches; the California thresher is the common thresher (new species "common-thresher").',
 'albacore':'Offshore, irregular: in the 2020s mostly Aug–Oct off central/northern California, some summers off SoCal. PFMC HMS SAFE. low',
 'california-barracuda':'Spring–summer schools in SoCal (CDFW barracuda species account). low',
 'rockfish':'Available year-round; Jan–Mar boat closure handled by closures; SoCal Oct–Dec nearshore closed (limits text). low',
 'lingcod':'Year-round availability, larger fish shallower in late fall–winter before nesting; Jan–Mar boat closure handled by closures. low',
 'california-sheephead':'SoCal reef species, rare north of Pt Conception (range to Monterey Bay); Jan–Feb boat closure. low',
 'common-thresher':'Spring–early summer coastal run in SoCal (Santa Monica Bay, San Diego), summer in SF Bay/Monterey (Cartamil et al. 2010; NOAA SWFSC). low',
 '_others':'All other existing zones.js species are tropical/Gulf of California species not caught (or extremely rare) in California → null.',
}
W('seasons.json',seasons)
# ---------- new species ----------
new=[
 {'k':'albacore','g':'tuna','en':'Albacore','es':'Albacora','temp':[13,15,19.5,22],'depth':[200,1000,5000,9000],'chl':[0.1,0.3],'season':[0]*12,
  'info':{'spawn':None,'conf':'medium','src':['Laurs, Fiedler & Montgomery 1984, Deep-Sea Res. 31: troll catches at 15–19.5 °C SST off California','Polovina et al. 2001, Prog. Oceanogr. 49: albacore along the 0.2 mg/m³ chlorophyll front','FishBase (10–25 °C, 0–600 m); spawns in subtropical central Pacific, not off California']}},
 {'k':'california-barracuda','g':'inshore','en':'California barracuda','es':'Barracuda de California','temp':[13,16,22,26],'depth':[1,3,30,60],'chl':[0.2,3],'season':[0]*12,
  'info':{'spawn':[0,0,0,0,1,2,2,2,1,0,0,0],'conf':'low','src':['FishBase: pelagic-neritic, 0–18 m (ours widened to 60 m for boat fishing)','CDFW species account (California\'s Living Marine Resources 2001): spawns Apr–Sep, peak Jun–Aug','Temperatures estimated (warm-water, enters SoCal when SST rises)']}},
 {'k':'rockfish','g':'inshore','en':'Rockfish (Sebastes)','es':'Rocotes (Sebastes)','temp':[7,9,16,21],'depth':[3,15,180,400],'chl':[0.3,5],'season':[0]*12,
  'info':{'spawn':None,'conf':'low','src':['Group of ~60 Sebastes species; live-bearing with species-specific winter/spring release — no single calendar','Depths: CDFW nearshore/shelf/slope groups; most sport fishing 10–100 fathoms (18–180 m)','Temperatures estimated from the California Current range']}},
 {'k':'lingcod','g':'inshore','en':'Lingcod','es':'Lingcod','temp':[6,8,14,18],'depth':[3,10,150,475],'chl':[0.3,5],'season':[0]*12,
  'info':{'spawn':[2,2,1,0,0,0,0,0,0,0,0,1],'conf':'medium','src':['FishBase: 0–475 m','Spawning/nest guarding Dec–Mar (CDFW species account; PFMC lingcod assessment)','Temperatures estimated']}},
 {'k':'california-sheephead','g':'inshore','en':'California sheephead','es':'Vieja de California','temp':[12,15,22,26],'depth':[1,3,30,87],'chl':[0.2,3],'season':[0]*12,
  'info':{'spawn':[0,0,0,0,0,1,2,2,1,0,0,0],'conf':'medium','src':['FishBase (Bodianus pulcher): 0–150 m, usually 3–30 m','Spawns Jul–Sep (Warner 1975; CDFW sheephead ESR)','Temperatures estimated']}},
 {'k':'common-thresher','g':'shark','en':'Common thresher','es':'Tiburón zorro común','temp':[12,14,20,24],'depth':[10,20,500,9000],'chl':[0.2,3],'season':[0]*12,
  'info':{'spawn':[0,0,1,2,2,1,0,0,0,0,0,0],'conf':'low','src':['FishBase: 0–650 m, usually 0–200 m','Cartamil et al. 2010, Mar. Biol.: SoCal Bight tagging (shelf and slope, mostly upper 100 m); temperature values here are estimates','Pupping spring in the SoCal Bight nursery (NOAA SWFSC)']}},
]
W('new-species.json',new)
# ---------- rules ----------
GB='General bag limit: 20 finfish total, max 10 of one species unless stated (14 CCR §27.60).'
L=lambda en,es,src=BOOK:{'en':en,'es':es,'src':src}
GFS_EN='Boat anglers: closed Jan 1–Mar 31; Apr 1–Dec 31 open all depths. 10 rockfish/cabezon/greenling combined (max 1 copper, 2 vermilion/sunset, 2 canary). Never keep cowcod, yelloweye, quillback, bronzespotted. Descending device required. Shore anglers and divers exempt from season/depth.'
GFS_ES='Desde embarcación: cerrado del 1 ene al 31 mar; del 1 abr al 31 dic abierto a toda profundidad. 10 rocotes/cabezón/greenling combinados (máx. 1 copper, 2 vermilion/sunset, 2 canary). Nunca retener cowcod, yelloweye, quillback ni bronzespotted. Obligatorio llevar dispositivo de descenso. Pesca desde orilla y buceo exentos de temporada y profundidad.'
rules={
 'juris':{'us-ca':{'en':'California (state and federal waters)','es':'California (aguas estatales y federales)','agency':'California Department of Fish and Wildlife (CDFW) / Fish and Game Commission; federal groundfish and HMS rules by NOAA Fisheries & PFMC (California adopts them in state rules)',
   'url':'https://wildlife.ca.gov/Fishing/Ocean/Regulations',
   'license':{'en':'California sport fishing license required from age 16 (not needed on public piers); buy online at wildlife.ca.gov/Licensing. Fishing in Mexican waters (e.g. Coronado Islands) needs a Mexican license.','es':'Se requiere licencia de pesca deportiva de California desde los 16 años (no en muelles públicos); se compra en línea en wildlife.ca.gov/Licensing. En aguas mexicanas (p. ej. Islas Coronado) se necesita permiso mexicano.'},
   'neverKeep':{'en':['Giant (black) sea bass','White shark','Garibaldi','Cowcod','Yelloweye rockfish','Quillback rockfish','Bronzespotted rockfish','Gulf and broomtail grouper','Green sturgeon','Coho salmon','Steelhead (in the ocean)'],
                'es':['Mero gigante / pescada (giant sea bass)','Tiburón blanco','Garibaldi','Cowcod (rocote vaca)','Rocote yelloweye','Rocote quillback','Rocote bronzespotted','Baya y garropa (gulf/broomtail grouper)','Esturión verde','Salmón coho','Trucha arcoíris anádroma (steelhead) en el mar']},
   'read':'2026-11-06','version':'2026 Ocean Sport Fishing Regulations booklet, last updated Jul 17, 2026 ('+BOOK+'); Groundfish Summary updated Jun 23, 2026 ('+GF+')'}},
 'limits':{'us-ca':{
  '_general':L(GB,'Límite general: 20 peces en total, máx. 10 de una especie salvo indicación (14 CCR §27.60).'),
  'yellowtail':L('10 per day; minimum 24 in fork length, except 5 may be smaller (§28.37). Fillets ≥17 in with skin.','10 al día; mínimo 24 pulgadas a la horquilla, salvo 5 que pueden ser menores (§28.37). Filetes ≥17 pulgadas con piel.'),
  'white-seabass':L('3 per day; minimum 28 in total length. Only 1 per day south of Point Conception from Mar 15 to Jun 15 (§28.35).','3 al día; mínimo 28 pulgadas de largo total. Solo 1 al día al sur de Point Conception del 15 mar al 15 jun (§28.35).'),
  'calico-bass':L('Kelp, barred sand and spotted sand bass: 5 combined per day, minimum 14 in total length (§28.30).','Calico, cabrilla de arena y spotted sand bass: 5 combinados al día, mínimo 14 pulgadas (§28.30).'),
  'barred-sand-bass':L('Max 4 barred sand bass within the 5-bass combined limit; minimum 14 in total length (§28.30, in force until Jun 1, 2028).','Máx. 4 cabrillas de arena dentro del límite de 5 combinadas; mínimo 14 pulgadas (§28.30, vigente hasta el 1 jun 2028).'),
  'california-halibut':L('Minimum 22 in total length. 5 per day south of Point Sur, 2 per day north of Point Sur (§28.15).','Mínimo 22 pulgadas. 5 al día al sur de Point Sur y 2 al norte de Point Sur (§28.15).'),
  'pacific-bluefin':L('2 per day, in addition to the 20-fish general limit; no size limit (§28.38(b)).','2 al día, aparte del límite general de 20; sin talla mínima (§28.38(b)).'),
  'yellowfin-tuna':L('10 per day (yellowfin, bigeye and other tunas), within the 20-fish general limit (§28.38(d)).','10 al día (aleta amarilla, patudo y otros atunes), dentro del límite general de 20 (§28.38(d)).'),
  'skipjack-tuna':L('No limit (§28.38(c)).','Sin límite (§28.38(c)).'),
  'dorado':L('10 per day within the 20-fish general limit (§27.60(a)).','10 al día dentro del límite general de 20 (§27.60(a)).'),
  'striped-marlin':L('1 marlin per day (striped, blue, black) (§28.50).','1 marlín al día (rayado, azul o negro) (§28.50).'),
  'swordfish':L('2 per day (§28.40).','2 al día (§28.40).'),
  'shortfin-mako':L('2 per day of each species (mako, thresher, blue) (§28.42).','2 al día de cada especie (mako, zorro, azul) (§28.42).'),
  'blue-shark':L('2 per day (§28.42).','2 al día (§28.42).'),
  'common-thresher':L('2 per day (§28.42). Common thresher is a federally managed HMS species.','2 al día (§28.42). Especie altamente migratoria de manejo federal.'),
  'pacific-bonito':L('10 per day; minimum 24 in fork length or 5 lb, except 5 may be smaller (§28.32).','10 al día; mínimo 24 pulgadas a la horquilla o 5 libras, salvo 5 menores (§28.32).'),
  'albacore':L('10 per day south of Point Conception, 25 per day north of it; in addition to the 20-fish general limit; no size limit (§28.38(a)).','10 al día al sur de Point Conception y 25 al norte; aparte del límite general de 20; sin talla mínima (§28.38(a)).'),
  'california-barracuda':L('10 per day within the general limit; minimum 28 in total length (§28.25).','10 al día dentro del límite general; mínimo 28 pulgadas (§28.25).'),
  'california-sheephead':L('2 per day; minimum 12 in total length. Boat anglers: closed Jan 1–end of Feb; shore anglers and divers year-round (§28.26).','2 al día; mínimo 12 pulgadas. Desde embarcación: cerrado del 1 ene a fin de febrero; orilla y buceo todo el año (§28.26).'),
  'giant-sea-bass':L('May not be taken off California; release immediately (§28.10).','Prohibido capturarla en California; liberarla de inmediato (§28.10).'),
 }},
 'closures':[
  {'k':'groundfish-winter-ca','species':['rockfish','lingcod'],'regions':['us-socal','us-central','us-norcal'],'periods':[[1,1,3,31]],
   'en':'Groundfish closed to boat anglers Jan 1 – Mar 31 (rockfish, lingcod, cabezon, greenlings). Shore anglers and divers exempt.',
   'es':'Peces de fondo cerrados para embarcaciones del 1 ene al 31 mar (rocotes, lingcod, cabezón, greenling). Pesca desde orilla y buceo exentos.',
   'source':GF+' (updated Jun 23, 2026; 14 CCR §§27.35, 27.40, 27.45)','conf':'high'},
  {'k':'sheephead-winter-ca','species':['california-sheephead'],'regions':['us-socal','us-central','us-norcal'],'periods':[[1,1,2,29]],
   'en':'California sheephead closed to boat anglers Jan 1 – end of February (shore anglers and divers exempt).',
   'es':'Vieja de California cerrada para embarcaciones del 1 ene a fin de febrero (orilla y buceo exentos).',
   'source':BOOK+' (14 CCR §28.26)','conf':'high'},
 ],
}
SOC_RF_EN='Southern area (Point Conception–Mexico): closed Jan 1–Mar 31; Apr 1–Jun 30 all depths; Jul 1–Sep 30 only inside 50 fathoms (300 ft); Oct 1–Dec 31 nearshore rockfish closed, shelf/slope rockfish only outside 50 fathoms. 10 RCG combined (max 1 copper, 2 vermilion/sunset, 2 canary). Closed year-round in the 8 Groundfish Exclusion Areas. Never keep cowcod, yelloweye, quillback, bronzespotted. Descending device required.'
SOC_RF_ES='Zona sur (Point Conception–México): cerrado del 1 ene al 31 mar; 1 abr–30 jun toda profundidad; 1 jul–30 sep solo dentro de 50 brazas (300 pies); 1 oct–31 dic rocotes costeros cerrados y de plataforma/talud solo fuera de 50 brazas. 10 RCG combinados (máx. 1 copper, 2 vermilion/sunset, 2 canary). Cerrado todo el año en las 8 zonas de exclusión. Nunca retener cowcod, yelloweye, quillback ni bronzespotted. Dispositivo de descenso obligatorio.'
rules['limits']['us-ca']['rockfish']=L('Central & San Francisco areas (north of Point Conception): '+GFS_EN+' Cordell Bank: no groundfish. — '+SOC_RF_EN,
  'Zonas Central y San Francisco (al norte de Point Conception): '+GFS_ES+' Cordell Bank: sin peces de fondo. — '+SOC_RF_ES, GF)
rules['limits']['us-ca']['lingcod']=L('2 per day, minimum 22 in total length (§28.27). North of Point Conception: closed Jan 1–Mar 31, open all depths Apr 1–Dec 31. Southern area: closed Jan 1–Mar 31; all depths Apr 1–Jun 30; inside 50 fathoms only Jul 1–Sep 30; outside 50 fathoms only Oct 1–Dec 31. Closed in Groundfish Exclusion Areas and Cordell Bank.',
  '2 al día, mínimo 22 pulgadas (§28.27). Al norte de Point Conception: cerrado 1 ene–31 mar, abierto a toda profundidad 1 abr–31 dic. Zona sur: cerrado 1 ene–31 mar; toda profundidad 1 abr–30 jun; solo dentro de 50 brazas 1 jul–30 sep; solo fuera de 50 brazas 1 oct–31 dic. Cerrado en zonas de exclusión y Cordell Bank.', GF)
W('rules.json',rules)
