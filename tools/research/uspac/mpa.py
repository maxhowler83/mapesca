import json, re, sys
from shapely.geometry import shape, mapping, Polygon, box
from shapely.validation import make_valid
from shapely.ops import unary_union
D='/tmp/claude-0/-home-claude/69c61f75-c416-5a6a-bc48-87f52ddc8247/scratchpad/expansion/uspac/'
src=json.load(open(D+'dl/mpa582.geojson'))
BOX=box(-125.0,32.3,-117.0,38.6)
SRC_STATE='CDFW California Marine Protected Areas [ds582], services2.arcgis.com/Uq9r85Potqm3MfRV/.../biosds582_fpu (boundaries as of 2019; unchanged through 14 CCR 632 history read 2026-11-06) · rules: 14 CCR §632(b) https://www.law.cornell.edu/regulations/california/14-CCR-632'
SRC_FED='Channel Islands NMS marine reserves/conservation area, 15 CFR 922.73 https://www.ecfr.gov/current/title-15/part-922/section-922.73 (geometry from CDFW ds582)'
N=lambda en,es:{'en':en,'es':es}
SMR=N('State marine reserve: no fishing or take of any kind.','Reserva marina estatal: prohibida toda pesca y extracción.')
NT=N('No-take conservation area: no recreational fishing.','Área de conservación sin extracción: no se permite la pesca deportiva.')
FMR=N('Federal marine reserve (Channel Islands sanctuary): no fishing; gear must be stowed.','Reserva marina federal (santuario de las Islas del Canal): prohibida la pesca; el equipo debe ir guardado.')
SMCA={
35:N('Recreational finfish allowed.','Se permite la pesca deportiva de peces.'),
38:N('No hook-and-line fishing: only Dungeness crab by trap and smelt by dip/beach net.','No se permite pescar con anzuelo: solo cangrejo Dungeness con trampa y eperlano con red de mano.'),
40:N('Only trolling for pelagic fish (salmon, tunas, etc.), Dungeness crab by trap and squid by dip net.','Solo curricán para pelágicos (salmón, atunes, etc.), cangrejo Dungeness con trampa y calamar con red de mano.'),
44:N('Only salmon by trolling and Dungeness crab by trap.','Solo salmón al curricán y cangrejo Dungeness con trampa.'),
47:N('Only clams may be taken; no fishing.','Solo se permite sacar almejas; no se permite pescar.'),
50:N('Finfish from shore only (no boat fishing).','Peces solo desde la orilla (no desde embarcación).'),
54:N('Only salmon by trolling.','Solo salmón al curricán.'),
61:N('Finfish by hook and line allowed.','Se permite pescar peces con anzuelo.'),
66:N('Only trolling for pelagic fish, Dungeness crab by trap and squid by dip net.','Solo curricán para pelágicos, cangrejo Dungeness con trampa y calamar con red de mano.'),
68:N('Salmon and squid allowed; other finfish from shore only.','Se permite salmón y calamar; otros peces solo desde la orilla.'),
71:N('Finfish by hook and line allowed; clams on the north shore only.','Se permite pescar con anzuelo; almejas solo en la orilla norte.'),
73:N('Pelagic fish only (tunas, salmon, yellowtail, sharks, etc.); no bottom fishing.','Solo pelágicos (atunes, salmón, jurel, tiburones, etc.); no pesca de fondo.'),
74:N('Pelagic fish only (tunas, salmon, yellowtail, sharks, etc.); no bottom fishing.','Solo pelágicos (atunes, salmón, jurel, tiburones, etc.); no pesca de fondo.'),
75:N('Finfish by hook and line allowed.','Se permite pescar peces con anzuelo.'),
77:N('Recreational finfish allowed.','Se permite la pesca deportiva de peces.'),
80:N('Recreational finfish allowed.','Se permite la pesca deportiva de peces.'),
82:N('Only salmon and albacore.','Solo salmón y albacora.'),
84:N('Only salmon and albacore.','Solo salmón y albacora.'),
86:N('Only salmon and albacore.','Solo salmón y albacora.'),
88:N('Only salmon and albacore.','Solo salmón y albacora.'),
89:N('All recreational take allowed (normal rules).','Se permite toda la pesca deportiva (reglas generales).'),
94:N('Only salmon and albacore.','Solo salmón y albacora.'),
97:N('Recreational finfish allowed (some invertebrates excluded).','Se permite la pesca deportiva de peces (con excepciones para invertebrados).'),
98:N('No hook-and-line fishing: only spearfishing for white seabass and pelagic fish.','No se permite pescar con anzuelo: solo pesca submarina de corvina blanca y pelágicos.'),
108:N('Only spiny lobster and pelagic fish.','Solo langosta y peces pelágicos.'),
112:N('Only spiny lobster and pelagic fish.','Solo langosta y peces pelágicos.'),
117:N('No hook-and-line fishing: only spearfishing for white seabass and pelagic fish.','No se permite pescar con anzuelo: solo pesca submarina de corvina blanca y pelágicos.'),
120:N('No hook-and-line fishing: only spearfishing for white seabass and pelagic fish, and squid by dip net.','No se permite pescar con anzuelo: solo pesca submarina de corvina blanca y pelágicos, y calamar con red de mano.'),
121:N('Finfish from shore in designated spots only; no boats.','Peces solo desde la orilla en sitios señalados; sin embarcaciones.'),
123:N('All recreational fishing allowed; no take of invertebrates.','Se permite toda la pesca deportiva; prohibido sacar invertebrados.'),
125:N('Pelagic fish by hook and line or spear; white seabass by spear only; squid by dip net.','Pelágicos con anzuelo o arpón; corvina blanca solo con arpón; calamar con red de mano.'),
128:N('Hook and line only from the Cabrillo Mole.','Solo con anzuelo desde el muelle Cabrillo Mole.'),
129:N('Only trolling for marlin, tunas and dorado; spearfishing for white seabass and pelagics; squid by dip net.','Solo curricán para marlín, atunes y dorado; pesca submarina de corvina blanca y pelágicos; calamar con red de mano.'),
130:N('Pelagic fish by hook and line; marlin, tunas and dorado by trolling; white seabass by spear only; no bottom fishing.','Pelágicos con anzuelo; marlín, atunes y dorado al curricán; corvina blanca solo con arpón; no pesca de fondo.'),
131:N('Finfish by hook and line or spear, lobster and urchin allowed.','Se permite pescar peces con anzuelo o arpón, langosta y erizo.'),
132:N('Finfish from shore only.','Peces solo desde la orilla.'),
133:N('Finfish by hook and line or spear, lobster and urchin allowed.','Se permite pescar peces con anzuelo o arpón, langosta y erizo.'),
136:N('Finfish by hook and line or spear, lobster and urchin allowed.','Se permite pescar peces con anzuelo o arpón, langosta y erizo.'),
138:N('Hook and line from shore only; spearfishing for white seabass and pelagics.','Anzuelo solo desde la orilla; pesca submarina de corvina blanca y pelágicos.'),
140:N('Finfish from shore only; no boats.','Peces solo desde la orilla; sin embarcaciones.'),
141:N('Only anchovy, sardine and mackerels by hook and line.','Solo anchoveta, sardina y macarelas con anzuelo.'),
144:N('Pelagic fish by hook and line only; no bottom fishing.','Solo pelágicos con anzuelo; no pesca de fondo.'),
147:N('No hook-and-line fishing: only anchovy/sardine/mackerel by dip net.','No se permite pescar con anzuelo: solo anchoveta, sardina o macarela con red de mano.'),
}
NOTAKE_SMCA={90:N('No recreational take (only permitted commercial kelp harvest).','Sin pesca deportiva (solo cosecha comercial de sargazo con permiso).')}
SMP=N('State marine park (SF Bay): recreational hook and line only; some from shore only.','Parque marino estatal (bahía de SF): solo pesca deportiva con anzuelo; en algunos solo desde la orilla.')
SMRMA_NT=N('No take of marine life (waterfowl hunting only).','Prohibido sacar vida marina (solo caza de aves acuáticas).')
MORRO=N('Recreational finfish allowed only north of 35°19.7\' N.','Pesca deportiva de peces solo al norte de 35°19.7\' N.')
SC_NOENTRY=N('Special closure: no entry (seabird/marine mammal rocks).','Cierre especial: prohibido entrar (rocas de aves y mamíferos marinos).')
SC={55:N('Special closure: no boats within 300 ft of Southeast Farallon (parts seasonal, Dec 1–Sep 14).','Cierre especial: sin embarcaciones a menos de 300 pies de Farallón Sureste (partes de temporada, 1 dic–14 sep).'),
102:N('Special closure: boats no closer than 300 yd to shore on the west end (100 yd in some months); 5 mph within 300 yd.','Cierre especial: sin embarcaciones a menos de 300 yardas de la costa oeste (100 en algunos meses); 5 mph dentro de 300 yardas.'),
111:N('Special closure: no nets or traps under 20 ft; pelican area on West Anacapa closed Jan 1–Oct 31.','Cierre especial: sin redes ni trampas a menos de 20 pies; zona de pelícanos en Anacapa Oeste cerrada del 1 ene al 31 oct.'),
52:N('Special closure: no boats within 1,000 ft of North Farallon and 300 ft of nearby islets.','Cierre especial: sin embarcaciones a menos de 1,000 pies de Farallón Norte y 300 pies de los islotes.')}
feats=[]
def ccrn(p):
    m=re.search(r'\((\d+)\)\s*$',p['CCR'] or '');return int(m.group(1)) if m else None
for f in src['features']:
    p=f['properties'];t=p['Type'];n=ccrn(p);name=p['NAME']
    if t=='SMR': rule,note,cat,kind='no-take',SMR,'SMR','state-marine-reserve'
    elif t=='SMCA (No-Take)': rule,note,cat,kind='no-take',NT,'SMCA','state-marine-conservation-area'
    elif t=='FMR': rule,note,cat,kind='no-take',FMR,'FMR','federal-marine-reserve'
    elif t=='FMCA': rule,note,cat,kind='rules',N('Federal conservation area: only recreational pelagic fish and spiny lobster.','Área de conservación federal: solo pelágicos y langosta en pesca deportiva.'),'FMCA','federal-marine-conservation-area'
    elif t=='SMCA':
        cat,kind='SMCA','state-marine-conservation-area'
        if n in NOTAKE_SMCA: rule,note='no-take',NOTAKE_SMCA[n]
        elif n in SMCA: rule,note='rules',SMCA[n]
        else: print('MISSING',n,name); continue
    elif t=='SMP': rule,note,cat,kind='rules',SMP,'SMP','state-marine-park'
    elif t=='SMRMA':
        cat,kind='SMRMA','state-marine-recreational-management-area'
        rule,note=('rules',MORRO) if n==91 else ('no-take',SMRMA_NT)
    elif t=='Special Closure':
        cat,kind='Special Closure','special-closure'
        rule,note=('rules',SC[n]) if n in SC else ('no-take',SC_NOENTRY)
    else: print('?',t); continue
    g=make_valid(shape(f['geometry'])).intersection(BOX)
    g=g.simplify(0.0009,preserve_topology=True)
    g=make_valid(g)
    polys=[x for x in (g.geoms if hasattr(g,'geoms') else [g]) if x.geom_type=='Polygon' and not x.is_empty]
    if not polys: print('empty',name); continue
    feats.append(({'name':name,'category':cat,'kind':kind,'rule':rule,'source':SRC_FED if t in('FMR','FMCA') else SRC_STATE+(' §632(b)(%d)'%n if n else ''),'note':note},polys))
# groundfish exclusion areas
def dm(s):
    d,m=s.split('°');return int(d)+float(m)/60
GEA_SRC='14 CCR §27.50 https://www.law.cornell.edu/regulations/california/14-CCR-27.50 · 50 CFR 660.70(t) https://www.ecfr.gov/current/title-50/part-660/section-660.70'
GEA={
'Hidden Reef':[('33°46.14','119°10.45'),('33°46.14','119°05.96'),('33°41.40','119°05.96'),('33°41.40','119°10.45')],
'West of Santa Barbara Island':[('33°33.64','119°18.54'),('33°33.64','119°07.57'),('33°27.90','119°07.57'),('33°27.90','119°18.54')],
'Potato Bank':[('33°21.00','119°53.00'),('33°21.00','119°45.67'),('33°11.00','119°45.67'),('33°11.00','119°53.00')],
'107/118 Bank':[('33°05.51','119°41.29'),('33°08.64','119°36.71'),('33°03.50','119°31.69'),('33°00.36','119°36.27')],
'Cherry Bank':[('32°50.86','119°29.40'),('32°56.96','119°19.82'),('32°54.69','119°17.78'),('32°48.59','119°27.35')],
'Seamount 109':[('32°43.75','119°37.00'),('32°43.75','119°34.29'),('32°31.95','119°26.94'),('32°30.47','119°29.71'),('32°39.54','119°37.00')],
'43-Fathom Spot':[('32°42.00','118°00.05'),('32°42.00','117°50.00'),('32°36.70','117°50.00'),('32°36.18','117°50.27'),('32°36.18','118°00.05')],
'Northeast Bank':[('32°27.39','119°37.00'),('32°27.39','119°31.60'),('32°20.00','119°31.60'),('32°20.00','119°37.00')],
'Cordell Bank':[('37°57.62','123°24.22'),('37°57.70','123°25.25'),('37°59.47','123°26.63'),('38°00.24','123°27.87'),('38°00.98','123°27.65'),('38°02.81','123°28.75'),('38°04.26','123°29.25'),('38°04.55','123°28.32'),('38°03.87','123°27.69'),('38°04.27','123°26.68'),('38°02.67','123°24.17'),('38°00.87','123°23.15'),('37°59.32','123°22.52'),('37°58.24','123°23.16')],
}
for nm,pts in GEA.items():
    poly=Polygon([(-dm(lo),dm(la)) for la,lo in pts]).intersection(BOX)
    feats.append(({'name':nm+' Groundfish Exclusion Area','category':'GEA','kind':'groundfish-exclusion-area','rule':'rules','species':['rockfish','lingcod'],
      'source':GEA_SRC,'note':N('Groundfish Exclusion Area: no rockfish, lingcod or other groundfish year-round; tunas, yellowtail and other pelagics allowed.','Zona de exclusión de peces de fondo: prohibidos rocotes, lingcod y demás peces de fondo todo el año; se permiten atunes, jurel y otros pelágicos.')},[poly]))
out=[]
r=lambda c:[round(c[0],5),round(c[1],5)]
for props,polys in feats:
    cs=[]
    for p in polys:
        p=p.buffer(0) if not p.is_valid else p
        p=Polygon(p.exterior, p.interiors)
        from shapely.geometry.polygon import orient
        p=orient(p,1.0)
        rings=[[r(c) for c in p.exterior.coords]]+[[r(c) for c in i.coords] for i in p.interiors]
        rings=[x for x in rings if len(x)>=4]
        for x in rings:
            if x[0]!=x[-1]: x.append(x[0])
        cs.append(rings)
    geom={'type':'Polygon','coordinates':cs[0]} if len(cs)==1 else {'type':'MultiPolygon','coordinates':cs}
    assert shape(geom).is_valid, props['name']
    out.append({'type':'Feature','properties':props,'geometry':geom})
fc={'type':'FeatureCollection','features':out}
s=json.dumps(fc,ensure_ascii=False,separators=(',',':'))
open(D+'protected-areas-uspac.json','w').write(s)
import collections
print(len(out),len(s),collections.Counter(f['properties']['rule'] for f in out))
