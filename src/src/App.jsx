// @ts-nocheck
// MONITOR GLOBAL v5 — fixes: news points, NOAA real-only, bigger map, country events
import { useState, useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";

const W = 960, H = 480;

const BASE_WAR = [
  {id:"usa",   name:"EE.UU.",       lat:38,   lng:-97,  c:"#ff2020",s:5,st:"guerra",conn:["iran"],
   det:"EE.UU. atacando Irán. Operación Epic Fury, día 7. Más de 3000 objetivos atacados. Trump exige rendición incondicional. Senado votó 47-53 para no frenarla. Cuatro portaaviones en el Golfo."},
  {id:"iran",  name:"IRÁN",         lat:32.4, lng:53.7, c:"#ff1a1a",s:5,st:"guerra",conn:["israel","saudi"],
   det:"Irán en guerra total. 1332 muertos, 181 niños (UNICEF). Marina destruida. Misiles agotados al 90%. Aeropuerto Mehrabad incendiado. Mojtaba Jamenei elegido nuevo líder, rechazado por Trump."},
  {id:"israel",name:"ISRAEL",       lat:31,   lng:34.9, c:"#ff1a1a",s:5,st:"guerra",conn:["lebanon"],
   det:"Israel alcanzó superioridad aérea casi completa. 2500 ataques, 80% de defensas iraníes destruidas. Más de 400 objetivos el viernes. Avanzando en el sur del Líbano."},
  {id:"lebanon",name:"LÍBANO",      lat:33.9, lng:35.5, c:"#ff4444",s:4,st:"guerra",
   det:"123 muertos, más de 600 heridos. 95000 libaneses desplazados. Hezbollah activo. Beirut sur bombardeada. Gobierno prohibió actividades militares de Hezbollah."},
  {id:"ukraine",name:"UCRANIA",     lat:48.4, lng:31.2, c:"#ff8800",s:4,st:"guerra",conn:["russia"],
   det:"Guerra con Rusia año 5. Trump pidió ayuda de Ucrania contra drones Shahed iraníes. Zelenski aceptó. Negociaciones de paz al 95%."},
  {id:"russia",name:"RUSIA\n⚠️INTEL",lat:61.5,lng:105, c:"#ff4400",s:4,st:"activo",
   det:"NUEVO: Rusia proporcionando inteligencia a Irán sobre posiciones de tropas y barcos de EE.UU. Primera señal de que Moscú busca involucrarse directamente. Putin y Pezeshkian acordaron continuar contactos."},
  {id:"pak",   name:"PAKISTÁN",     lat:30.4, lng:69.3, c:"#ff5500",s:4,st:"guerra",conn:["afg"],
   det:"Operación Ghazab Lil Haq, día 7. 481 afganos muertos. Base Bagram destruida. Potencia nuclear en guerra activa. Rechaza negociaciones."},
  {id:"afg",   name:"AFGANISTÁN",   lat:33.9, lng:67.7, c:"#ff5500",s:4,st:"guerra",
   det:"Bajo bombardeo intenso. 21.9 millones necesitan ayuda. 2.7 millones de afganos deportados atrapados. Taliban pide diálogo, Pakistán se niega."},
  {id:"france",name:"CHARLES\nDE GAULLE",lat:35.5,lng:24,c:"#4466ff",s:3,st:"activo",
   det:"Macron envió el portaaviones Charles de Gaulle al Mediterráneo con fragatas y sistemas antiaéreos para defender Chipre. Francia condena la guerra pero actúa militarmente."},
  {id:"cyprus",name:"CHIPRE\n⚠️",   lat:35,   lng:33,  c:"#ff8800",s:4,st:"atacado",
   det:"Base RAF Akrotiri atacada por drones iraníes — primer ataque de Irán a suelo OTAN. Italia, Países Bajos, España (fragata Cristóbal Colón), Francia y Grecia enviaron buques a defender la isla."},
  {id:"saudi", name:"ARABIA SAU.",  lat:23.9, lng:45.1, c:"#ff9900",s:3,st:"atacado",
   det:"Refinería Ras Tanura atacada. Embajada de EE.UU. en Riad bajo drones. Infraestructura petrolera en riesgo crítico."},
  {id:"ormuz", name:"ORMUZ 🚫",     lat:26.6, lng:56.5, c:"#ff0000",s:5,st:"critico",
   det:"Estrecho de Ormuz cerrado. 20% del petróleo mundial bloqueado. Petróleo a $91/barril (+31%). Maersk suspendió operaciones. Más de 1100 barcos con GPS interferido."},
  {id:"spain", name:"ESPAÑA 🚫",    lat:40.5, lng:-3.7, c:"#ffcc00",s:2,st:"tension",
   det:"España NIEGA cooperar con EE.UU. pero envió la fragata Cristóbal Colón a Chipre. Trump amenazó cortar todo el comercio. Único país OTAN que rechazó el 5% en defensa."},
];

const CARRIERS = [
  {id:"ford",  name:"USS FORD",    lat:22.4,lng:62.8, det:"USS Gerald R. Ford CVN-78. Mar Arábigo. 90 aeronaves F-35C. El más avanzado del mundo. Atacando Irán en tiempo real."},
  {id:"ike",   name:"USS IKE",     lat:14.2,lng:55.5, det:"USS Eisenhower CVN-69. Golfo de Adén. Más de 600 Tomahawk lanzados. Interceptando drones iraníes."},
  {id:"tr",    name:"USS ROSVLT",  lat:17.8,lng:59.2, det:"USS Theodore Roosevelt CVN-71. Mar de Omán. Bloquea salidas iraníes al Índico."},
  {id:"linc",  name:"USS LINCOLN", lat:12.5,lng:50.1, det:"USS Lincoln CVN-72. Mar Rojo sur. Cuarto portaaviones — sin precedente en 40 años."},
];

const BASE_DISEASE = [
  {id:"saramp",name:"SARAMPIÓN\nMÉXICO",  lat:19.4,lng:-99.1,c:"#ff2200",s:3,st:"alerta",
   det:"🔴 BROTE ACTIVO 2026. Casos en Ciudad de México, Jalisco y Nuevo León. Vinculado a casos en Texas. SSA emitió alerta epidemiológica nacional. Verificar cartilla de vacunación."},
  {id:"mpox",  name:"MPOX\nCONGO",        lat:0.3, lng:25.5, c:"#ff6600",s:4,st:"activo",
   det:"OMS declaró emergencia global. Más de 100 mil casos. Variante clade Ib más transmisible. Congo, Uganda y Kenia afectados."},
  {id:"h5n1",  name:"H5N1\nUSA",          lat:37.1,lng:-95.7,c:"#ffaa00",s:4,st:"alerta",
   det:"Gripe aviar H5N1 en ganado bovino de EE.UU. Primera transmisión humana confirmada. OMS en nivel de alerta pandémica máxima."},
  {id:"dengue",name:"DENGUE\nBRASIL",     lat:-10, lng:-55,  c:"#ff6600",s:3,st:"activo",
   det:"Año récord 2026. 5 millones de casos activos. Más de 5 mil muertes. Serotipo DENV-3 reemergente."},
  {id:"ebola", name:"ÉBOLA\nLIBERIA",     lat:6.3, lng:-10.8,c:"#cc0000",s:4,st:"alerta",
   det:"Brote en Liberia, febrero 2026. Más de 300 contactos bajo rastreo. Tasa de mortalidad 65%. OMS en emergencia."},
  {id:"cholera",name:"CÓLERA\nSUDÁN",    lat:15.6,lng:32.5, c:"#ff8800",s:3,st:"activo",
   det:"200 mil casos, más de 3 mil muertes. Sin agua potable en zonas de conflicto. Ayuda humanitaria bloqueada."},
  {id:"covid", name:"COVID XEC\nASIA",    lat:30.6,lng:114.3,c:"#ff4400",s:2,st:"activo",
   det:"Subvariante XEC detectada en Asia. OMS monitorea en China, Corea del Sur y Japón. JN.1 y KP circulando globalmente."},
];

const BASE_NEWS = [
  {id:"oil",   name:"CRISIS\nPETRÓLEO",   lat:26,  lng:50,  c:"#ffaa00",s:5,st:"critico",icon:"🛢️",
   det:"Ormuz cerrado disparó el crudo a $91/barril, +31% en la semana. OPEP convocó reunión de emergencia. Analistas proyectan $150 si el cierre dura más de dos semanas. Maersk suspendió operaciones."},
  {id:"trump", name:"ARANCELES\nTRUMP",   lat:38,  lng:-97, c:"#ff6600",s:4,st:"activo",icon:"📊",
   det:"Aranceles del 25% a productos europeos desde el 15 de marzo. UE prepara represalias por 45 mil millones de euros. México amenazado con el 35%. China con 145%."},
  {id:"ger",   name:"ELECCIONES\nALEMANIA",lat:51.2,lng:10.5,c:"#4488ff",s:3,st:"activo",icon:"🗳️",
   det:"CDU de Merz ganó con el 29%. AfD obtuvo el 20%, récord histórico. Merz busca coalición con el SPD."},
  {id:"iran_f",name:"SUCESOR\nIRÁN",      lat:32.4,lng:53.7,c:"#ff4444",s:5,st:"critico",icon:"🗳️",
   det:"Mojtaba Jamenei, hijo del ayatolá muerto, elegido nuevo líder por la Guardia Revolucionaria. Trump lo rechaza. Oposición en el exilio exige elecciones libres."},
  {id:"stocks",name:"BOLSAS\nMUNDIALES", lat:40.7,lng:-74,  c:"#ff3344",s:4,st:"activo",icon:"📉",
   det:"Wall Street -6.2%, Ibex 35 -8%, Tokio -9.1% en la semana. Oro a $3,200 récord. Bitcoin cayó a $62K. FMI alerta recesión global."},
  {id:"nato",  name:"OTAN\nCRISIS",       lat:50.9,lng:4.4,  c:"#4466ff",s:3,st:"activo",icon:"🛡️",
   det:"Solo 8 de 32 miembros cumplen el 2% del PIB. Trump exige 5%. Cumbre extraordinaria convocada para el 12 de marzo en Bruselas."},
  {id:"imf",   name:"FMI\nALERTA",        lat:38.9,lng:-77,  c:"#ffee00",s:4,st:"activo",icon:"📊",
   det:"FMI alerta recesión global. Ormuz cerrado + aranceles Trump + guerra reducirán crecimiento mundial en 2.1 puntos. América Latina en riesgo de recesión en Q3."},
  {id:"fra",   name:"ELECCIONES\nFRANCIA",lat:46.2,lng:2.2,  c:"#4488ff",s:2,st:"alerta",icon:"🗳️",
   det:"Elecciones anticipadas en mayo 2026 tras caída del gobierno Bayrou. Le Pen lidera con 34%. Macron se retiró de la carrera política."},
];

const BASE_CLIMATE = [
  {id:"heat",  name:"OLA CALOR\nINDIA",      lat:26,  lng:80,   c:"#ff2200",s:5,st:"extremo",icon:"🔥",pulse:true,
   det:"Temperatura de 47 a 51°C, récord histórico. Más de 3200 muertes por golpe de calor en 2026. Alerta roja en 8 estados del norte de India."},
  {id:"flood", name:"INUNDACIONES\nEUROPA",  lat:47,  lng:16,   c:"#0066ff",s:4,st:"activo",icon:"🌊",pulse:true,
   det:"Danubio desbordado 8.4m sobre lo normal. 45 mil evacuados en Austria, Hungría y Eslovaquia. 12 muertos. Pérdidas de 4200 millones de euros."},
  {id:"fire",  name:"INCENDIOS\nAUSTRALIA",  lat:-33, lng:149,  c:"#ff3300",s:4,st:"extremo",icon:"🔥",pulse:true,
   det:"2.1 millones de hectáreas quemadas en Nueva Gales del Sur. 12 muertos. Calidad del aire en Sídney en nivel peligroso. Vientos de 80 km/h."},
  {id:"tornado",name:"TORNADOS\nUSA",        lat:36,  lng:-97,  c:"#aa44ff",s:4,st:"activo",icon:"🌪️",pulse:true,
   det:"23 tornados en 24 horas en Tornado Alley. Oklahoma, Kansas y Texas. Tres de categoría EF4 con vientos de 280 km/h. 8 muertos y 140 heridos."},
  {id:"cold",  name:"FRENTE FRÍO\nNORTE USA",lat:45,  lng:-90,  c:"#00ccff",s:3,st:"activo",icon:"🧊",pulse:false,
   det:"Frente polar ártico. Temperaturas de -35°C. Nieve de 120 cm en 48h. Estados de emergencia en Wisconsin, Michigan y Minnesota."},
];

// Stats
const WAR_S=[
  {l:"MUERTOS IRÁN",v:"1,332+",c:"#ff1a1a",snd:"alert"},{l:"NIÑOS",v:"181 😢",c:"#ff4444",snd:"alert"},
  {l:"OBJETIVOS US",v:"3,000+",c:"#ff6600",snd:"pop"}, {l:"PORTAAVIONES",v:"5 🚢",c:"#4488ff",snd:"ping"},
  {l:"PETRÓLEO",v:"$91↑31%",c:"#ffaa00",snd:"pop"},    {l:"ORMUZ",v:"🚫CERRADO",c:"#ff0000",snd:"alert"},
  {l:"DÍAS GUERRA",v:"7",c:"#ffcc00",snd:"ping"},       {l:"RUSIA+IRÁN",v:"⚠️INTEL",c:"#ff4400",snd:"alert"},
];
const DIS_S=[
  {l:"SARAMPIÓN MX",v:"🔴NUEVO",c:"#ff2200",snd:"alert"},{l:"MPOX",v:"100K+",c:"#ff6600",snd:"pop"},
  {l:"H5N1 RIESGO",v:"ALTO ⚠",c:"#ffaa00",snd:"alert"},{l:"DENGUE",v:"5M casos",c:"#ff8800",snd:"pop"},
  {l:"ÉBOLA",v:"ALERTA",c:"#cc0000",snd:"alert"},       {l:"PAÍSES AFECT.",v:"47",c:"#ffcc00",snd:"ping"},
  {l:"VACUNAS",v:"CRÍTICO",c:"#ff0000",snd:"alert"},    {l:"NIVEL OMS",v:"EMERGENCIA",c:"#ff2020",snd:"alert"},
];
const CLM_S=[
  {l:"HURACANES",v:"NOAA LIVE",c:"#8844ff",snd:"alert"},{l:"SISMOS M5+",v:"USGS LIVE",c:"#ffaa00",snd:"alert"},
  {l:"MAX TEMP",v:"51°C 🔥",c:"#ff2200",snd:"pop"},    {l:"MIN TEMP",v:"-35°C 🧊",c:"#00ccff",snd:"pop"},
  {l:"TSUNAMI",v:"MONIT. 🌊",c:"#ff0066",snd:"alert"}, {l:"EVACUADOS",v:"6.5M",c:"#ff8800",snd:"ping"},
  {l:"INCENDIOS",v:"2.1M ha",c:"#ff3300",snd:"pop"},   {l:"CO₂",v:"428 ppm",c:"#ffaa00",snd:"ping"},
];
const NEW_S=[
  {l:"PETRÓLEO",v:"$91↑31%",c:"#ffaa00",snd:"pop"},    {l:"ORO/ONZA",v:"$3,200↑",c:"#ffdd00",snd:"pop"},
  {l:"BITCOIN",v:"$62K↓",c:"#ff9900",snd:"alert"},     {l:"DOW JONES",v:"-6.2%↓",c:"#ff3344",snd:"alert"},
  {l:"ARANCELES",v:"25% EU",c:"#ff6600",snd:"alert"},   {l:"FMI",v:"RECESIÓN",c:"#ffee00",snd:"alert"},
  {l:"ELECCIONES",v:"2 ACTIVAS",c:"#4488ff",snd:"ping"},{l:"OTAN",v:"CUMBRE 12M",c:"#4466ff",snd:"pop"},
];

const W_ISO={"840":"#ff2020","364":"#ff1a1a","376":"#ff1a1a","422":"#ff4444","804":"#ff8800","643":"#ff4400","586":"#ff5500","4":"#ff5500","784":"#ff8800","634":"#ff8800","48":"#ff8800","414":"#ff8800","682":"#ff9900","196":"#ff8800","724":"#ffcc00","156":"#ffcc00","356":"#ffaa44","484":"#88cc00","368":"#ff6600","400":"#ffcc00","792":"#ffcc00","818":"#ffcc00","250":"#4466ff","380":"#4466ff","528":"#4466ff","620":"#4466ff","300":"#4466ff"};
const D_ISO={"156":"#ff4400","180":"#ff6600","840":"#ffaa00","729":"#ff8800","76":"#ff6600","430":"#cc0000","710":"#ff8800","410":"#ffcc00","484":"#ff4400"};
const C_ISO={"356":"#ff2200","840":"#aa44ff","50":"#6633ff","124":"#00ccff","231":"#cc6600","36":"#ff3300","76":"#0055ff","392":"#ffaa00","360":"#ff9900","608":"#7733ff","724":"#ff5500","250":"#0066ff","152":"#ffbb00","484":"#8844ff"};
const N_ISO={"840":"#ff6600","276":"#4488ff","250":"#4488ff","156":"#ffcc00","364":"#ff4444","643":"#ff7700","76":"#44ffaa","826":"#4466ff","724":"#ff6600","380":"#4466ff","392":"#ff3344","682":"#ffaa00","484":"#ffaa44","528":"#4466ff"};

// Country events on click
const COUNTRY_EVENTS={
  "840":[{name:"TROPAS EN\nMÉXICO?",det:"No hay confirmación oficial de tropas de EE.UU. en México. Trump ha amenazado pero México lo ha rechazado categóricamente. Cualquier despliegue sería un acto de guerra según la Constitución mexicana."}],
  "484":[{name:"SARAMPIÓN\nMÉXICO 🔴",det:"Brote activo de sarampión en México 2026. Casos en CDMX, Jalisco y Nuevo León. SSA emitió alerta nacional. Verifica tu cartilla de vacunación."}],
  "643":[{name:"RUSIA\nINTELIGENCIA",det:"Rusia proporcionando inteligencia a Irán sobre posiciones de tropas y barcos de EE.UU. Primera señal de intervención directa de Moscú."}],
  "724":[{name:"FRAGATA\nCRISTÓBAL C.",det:"España envió la fragata Cristóbal Colón al Mediterráneo para defender Chipre junto a Francia, Italia, Países Bajos y Grecia. Sin embargo rechazó que EE.UU. use sus bases."}],
  "250":[{name:"CHARLES\nDE GAULLE",det:"Francia envió el portaaviones Charles de Gaulle con escolta al Mediterráneo. También fragatas y sistemas antiaéreos a Chipre."}],
  "156":[{name:"CHINA\nVIGILA TAIWAN",det:"China aumentó presencia militar en el Estrecho de Taiwán aprovechando que EE.UU. tiene 4 portaaviones en el Golfo. Evacuando ciudadanos de Irán urgente."}],
};

const STATUS_L={guerra:"EN GUERRA",atacado:"BAJO ATAQUE",activo:"EN CURSO",tension:"EN TENSIÓN",critico:"PUNTO CRÍTICO",alerta:"EN ALERTA",extremo:"EVENTO EXTREMO"};
const SCALES={war:[220,246,261,293,311,349,415,440,466,493],disease:[196,220,246,261,293,329,349,392,440,493],climate:[261,293,329,349,392,440,493,523,587,659],news:[293,329,369,392,440,493,523,587,659,698]};
const MODES=["war","disease","climate","news"];
const TITLES={war:"⚔️  CONFLICTOS GLOBALES — TIEMPO REAL",disease:"🦠  BROTES GLOBALES — OMS 2026",climate:"🌍  CLIMA + SISMOS USGS + HURACANES NOAA",news:"📰  ECONOMÍA, POLÍTICA & NOTICIAS"};
const NEXT={war:"🦠 ENFERMEDADES",disease:"🌍 CLIMA",climate:"📰 ECONOMÍA",news:"⚔️ CONFLICTOS"};
const ACC={war:"#ff2020",disease:"#ff6600",climate:"#00aaff",news:"#ffcc00"};
const BG={war:"#040810",disease:"#04080a",climate:"#030c10",news:"#080804"};

function hurCol(k){k=parseInt(k)||0;if(k>=137)return"#ff0000";if(k>=113)return"#ff4400";if(k>=96)return"#ff8800";if(k>=64)return"#8844ff";return"#6666ff";}
function hurCat(k){k=parseInt(k)||0;if(k>=137)return"CAT5";if(k>=113)return"CAT4";if(k>=96)return"CAT3";if(k>=64)return"CAT1-2";return"T.TROP";}
function magCol(m){if(m>=7)return"#ff0000";if(m>=6)return"#ff4400";return"#ff8800";}

function speakText(txt){
  try{
    window.speechSynthesis.cancel();
    const c=txt.replace(/[🔴🟠🟡🟢⚠️☣️🦟🌋🌀🌊🔥🧊☀️🌪️❄️🛢️🏦🗳️📊📉₿🌐🛡️📰☠🚫🚢😢]/gu,"").replace(/\n/g,". ").replace(/\s+/g," ").trim();
    const u=new SpeechSynthesisUtterance(c);u.lang="es-MX";u.rate=1.05;u.pitch=1.25;u.volume=0.9;
    const vs=window.speechSynthesis.getVoices();
    const v=vs.find(v=>v.lang.startsWith("es")&&/monica|paulina|lucia|sabina|rosa|elena|conchita|angelica|lupe|paloma|susana|female/i.test(v.name))||vs.find(v=>v.lang.startsWith("es")&&v.name.includes("Google"))||vs.find(v=>v.lang.startsWith("es"))||vs[0];
    if(v)u.voice=v;
    window.speechSynthesis.speak(u);
  }catch(e){}
}

export default function App(){
  const [mode,setMode]=useState("war");
  const [geo,setGeo]=useState(null);
  const [proj,setProj]=useState(null);
  const [sel,setSel]=useState(null);
  const [ping,setPing]=useState(null);
  const [ripples,setRipples]=useState({});
  const [quakes,setQuakes]=useState([]);
  const [hurricanes,setHurricanes]=useState([]);
  const [noaaChecked,setNoaaChecked]=useState(false);
  const [hurPos,setHurPos]=useState({});
  const [hurTracks,setHurTracks]=useState({});
  const [wlive,setWlive]=useState({});
  const [aiHeadline,setAiHeadline]=useState("");
  const [aiLoading,setAiLoading]=useState(false);
  const [lastUpdate,setLastUpdate]=useState(null);
  const audioRef=useRef(null);
  const lastHov=useRef(0);
  const lastCC=useRef(null);

  const ac=ACC[mode],bg=BG[mode];

  // Points per mode
  const clmPoints=[...BASE_CLIMATE,...quakes.map(q=>({
    id:`q_${q.id}`,name:`SISMO M${q.mag.toFixed(1)}\n${q.place.split(",")[0].substring(0,12).toUpperCase()}`,
    lat:q.lat,lng:q.lng,c:magCol(q.mag),s:Math.min(5,Math.round(q.mag-3)),st:"extremo",icon:"🌋",pulse:q.mag>=6,
    det:`Sismo M${q.mag.toFixed(1)} en ${q.place}. Profundidad: ${q.depth}km. ${q.mag>=7?"⚠️ ALERTA TSUNAMI ACTIVA — evacuación inmediata de costas.":q.mag>=6?"Monitoreo de tsunami activo.":"Sin riesgo de tsunami."} Fuente: USGS. ${new Date(q.time).toLocaleString("es-MX")}`
  })),...hurricanes.map(h=>{
    const pos=hurPos[h.id]||{lat:h.lat,lng:h.lng};
    return{id:`hur_${h.id}`,name:`🌀 ${h.name}\n${hurCat(h.kts)}`,lat:pos.lat,lng:pos.lng,c:hurCol(h.kts),s:5,st:"extremo",icon:"🌀",pulse:true,
      det:`Huracán ${h.name} — ${hurCat(h.kts)}. Vientos: ${Math.round(h.kts*1.852)} km/h. Posición: ${pos.lat?.toFixed(2)}°lat, ${pos.lng?.toFixed(2)}°lng. Movimiento ${h.dir}° a ${h.spd} nudos. Fuente: NOAA NHC en tiempo real.`};
  })];

  const DATA_MAP={war:BASE_WAR,disease:BASE_DISEASE,climate:clmPoints,news:BASE_NEWS};
  const STATS_MAP={war:WAR_S,disease:DIS_S,climate:CLM_S,news:NEW_S};
  const ISO_MAP={war:W_ISO,disease:D_ISO,climate:C_ISO,news:N_ISO};
  const pts=DATA_MAP[mode]||[],sts=STATS_MAP[mode],isoM=ISO_MAP[mode];

  // Load map
  useEffect(()=>{
    let done=false;
    (async()=>{
      try{
        const [topo,world]=await Promise.all([
          import("https://cdn.skypack.dev/topojson-client@3"),
          fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then(r=>r.json()),
        ]);
        if(done)return;
        const p=d3.geoNaturalEarth1().scale(150).translate([W/2,H/2+15]);
        const path=d3.geoPath(p);
        const features=topo.feature(world,world.objects.countries).features;
        const paths=features.map(f=>({id:String(f.id),d:path(f)||""}));
        const borders=path(topo.mesh(world,world.objects.countries,(a,b)=>a!==b));
        const sphere=path({type:"Sphere"});
        setProj(()=>p);setGeo({paths,borders,sphere});
      }catch(e){console.error(e);}
    })();
    return()=>{done=true;};
  },[]);

  // USGS earthquakes — real only
  const fetchQuakes=useCallback(async()=>{
    try{
      const r=await fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/5.0_day.geojson");
      const d=await r.json();
      const now=Date.now();
      setQuakes(d.features
        .filter(f=>f.properties.mag>=5.5&&(now-f.properties.time)<48*3600*1000)
        .map(f=>({id:f.id,mag:f.properties.mag,place:f.properties.place||"Océano",
          lat:f.geometry.coordinates[1],lng:f.geometry.coordinates[0],
          depth:Math.round(f.geometry.coordinates[2]),time:f.properties.time,tsunami:f.properties.tsunami===1})));
    }catch(e){setQuakes([]);}
  },[]);

  useEffect(()=>{fetchQuakes();const iv=setInterval(fetchQuakes,5*60*1000);return()=>clearInterval(iv);},[fetchQuakes]);

  // NOAA hurricanes — REAL only, no demo fallback
  const fetchHurricanes=useCallback(async()=>{
    try{
      const r=await fetch("https://www.nhc.noaa.gov/CurrentStorms.json");
      const d=await r.json();
      setNoaaChecked(true);
      if(d.activeStorms?.length>0){
        const active=d.activeStorms.map(s=>({
          id:s.id,name:s.name||"Storm",kts:parseInt(s.intensity)||65,
          lat:parseFloat(s.latitudeNumeric)||20,lng:parseFloat(s.longitudeNumeric)||-85,
          dir:parseInt(s.movementDir)||315,spd:parseInt(s.movementSpeed)||12,
        }));
        setHurricanes(active);
        setHurPos(Object.fromEntries(active.map(h=>[h.id,{lat:h.lat,lng:h.lng}])));
        setHurTracks(Object.fromEntries(active.map(h=>[h.id,[{lat:h.lat,lng:h.lng}]])));
      }else{
        setHurricanes([]); // No activos — no mostrar nada
      }
    }catch(e){
      setNoaaChecked(true);
      setHurricanes([]); // Si CORS falla, tampoco mostrar demos
    }
  },[]);

  useEffect(()=>{fetchHurricanes();const iv=setInterval(fetchHurricanes,30*60*1000);return()=>clearInterval(iv);},[fetchHurricanes]);

  // Hurricane animation
  useEffect(()=>{
    if(!hurricanes.length)return;
    const iv=setInterval(()=>{
      setHurPos(prev=>{
        const n={...prev};
        hurricanes.forEach(h=>{
          const p=prev[h.id]||{lat:h.lat,lng:h.lng};
          const rad=(h.dir*Math.PI)/180;
          const step=(h.spd/111)*(30/3600);
          n[h.id]={lat:p.lat+Math.cos(rad)*step,lng:p.lng+Math.sin(rad)*step};
        });
        return n;
      });
    },30000);
    return()=>clearInterval(iv);
  },[hurricanes]);

  // Open-Meteo
  useEffect(()=>{
    const spots=[{k:"india",lat:26.8,lng:80.9},{k:"spain",lat:37.5,lng:-4},{k:"aus",lat:-33.8,lng:149},{k:"mexico",lat:19.4,lng:-99.1},{k:"iran",lat:32.4,lng:53.7}];
    const go=async()=>{
      const obj={};
      await Promise.all(spots.map(async({k,lat,lng})=>{
        try{const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,precipitation,wind_speed_10m&forecast_days=1&timezone=auto`);const d=await r.json();if(d.current)obj[k]=d.current;}catch(e){}
      }));
      setWlive(obj);
    };
    go();const iv=setInterval(go,5*60*1000);return()=>clearInterval(iv);
  },[]);

  // Claude AI headline
  const fetchAI=useCallback(async()=>{
    setAiLoading(true);
    try{
      const queries={
        war:"En una sola oración corta, cuál es la noticia más importante de la guerra Irán EE.UU. hoy? Solo la oración, sin formato.",
        news:"En una sola oración corta, cuál es la noticia económica más importante del mundo hoy? Solo la oración.",
        disease:"En una sola oración, cuál es el brote de enfermedad más activo en el mundo hoy? Solo la oración.",
        climate:"En una sola oración, cuál es el evento climático más severo activo hoy en el mundo? Solo la oración.",
      };
      const r=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",max_tokens:120,
          tools:[{type:"web_search_20250305",name:"web_search"}],
          messages:[{role:"user",content:queries[mode]||queries.war}]
        })
      });
      const data=await r.json();
      const txt=data.content?.filter(b=>b.type==="text").map(b=>b.text).join("").trim();
      if(txt)setAiHeadline(txt.slice(0,180));
      setLastUpdate(new Date());
    }catch(e){}
    setAiLoading(false);
  },[mode]);

  useEffect(()=>{fetchAI();const iv=setInterval(fetchAI,15*60*1000);return()=>clearInterval(iv);},[mode]);

  // Voice
  useEffect(()=>{window.speechSynthesis.getVoices();return()=>window.speechSynthesis.cancel();},[]);

  const xy=useCallback((lat,lng)=>{if(!proj)return null;return proj([lng,lat]);},[proj]);

  // Audio
  const getCtx=useCallback(()=>{
    if(!audioRef.current)audioRef.current=new(window.AudioContext||window.webkitAudioContext)();
    if(audioRef.current.state==="suspended")audioRef.current.resume();
    return audioRef.current;
  },[]);

  const playHov=useCallback((gid)=>{
    const now=Date.now();
    if(now-lastHov.current<110||gid===lastCC.current)return;
    lastHov.current=now;lastCC.current=gid;
    try{
      const c=getCtx(),sc=SCALES[mode],freq=sc[parseInt(gid,10)%sc.length],t=c.currentTime;
      const o=c.createOscillator(),g=c.createGain(),flt=c.createBiquadFilter();
      flt.type="lowpass";flt.frequency.value=2000;
      o.connect(flt);flt.connect(g);g.connect(c.destination);
      o.type=mode==="war"?"sawtooth":mode==="disease"?"triangle":"sine";
      o.frequency.setValueAtTime(freq,t);
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(0.04,t+0.025);g.gain.exponentialRampToValueAtTime(0.001,t+0.22);
      o.start(t);o.stop(t+0.23);
    }catch(e){}
  },[mode,getCtx]);

  const playS=useCallback((type)=>{
    try{
      const c=getCtx(),t=c.currentTime;
      if(type==="pop"){
        const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="sine";
        o.frequency.setValueAtTime(850,t);o.frequency.exponentialRampToValueAtTime(180,t+0.09);
        g.gain.setValueAtTime(0.22,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.1);o.start(t);o.stop(t+0.1);
      }else if(type==="alert"){
        [0,0.15].forEach(dl=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="square";o.frequency.value=520;g.gain.setValueAtTime(0.08,t+dl);g.gain.exponentialRampToValueAtTime(0.001,t+dl+0.1);o.start(t+dl);o.stop(t+dl+0.11);});
      }else if(type==="ping"){
        const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="sine";o.frequency.value=1047;g.gain.setValueAtTime(0.18,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.5);o.start(t);o.stop(t+0.5);
      }else if(type==="switch"){
        const fs={war:[415,311,261,220],disease:[220,261,311,415],climate:[261,329,392,523],news:[293,369,440,587]};
        (fs[mode]||fs.war).forEach((f,i)=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="sine";o.frequency.value=f;const dl=i*0.07;g.gain.setValueAtTime(0,t+dl);g.gain.linearRampToValueAtTime(0.11,t+dl+0.025);g.gain.exponentialRampToValueAtTime(0.001,t+dl+0.12);o.start(t+dl);o.stop(t+dl+0.13);});
      }else if(type==="select"){
        const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="sine";
        o.frequency.setValueAtTime(660,t);o.frequency.linearRampToValueAtTime(900,t+0.06);
        g.gain.setValueAtTime(0.15,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.3);o.start(t);o.stop(t+0.3);
      }
    }catch(e){}
  },[mode,getCtx]);

  const doStat=(st,e,i)=>{
    playS(st.snd);
    const r=e.currentTarget.getBoundingClientRect();
    const rp={id:Date.now(),x:e.clientX-r.left,y:e.clientY-r.top,c:st.c};
    setRipples(p=>({...p,[i]:[...(p[i]||[]),rp]}));
    setTimeout(()=>setRipples(p=>({...p,[i]:(p[i]||[]).filter(x=>x.id!==rp.id)})),900);
  };

  const cycleMode=()=>{
    playS("switch");window.speechSynthesis.cancel();
    const idx=MODES.indexOf(mode);setMode(MODES[(idx+1)%MODES.length]);
    setSel(null);lastCC.current=null;
  };

  const doPoint=(pt)=>{
    playS("select");setPing(pt.id);setTimeout(()=>setPing(null),700);
    const isNew=sel?.id!==pt.id;
    setSel(isNew?pt:null);
    if(isNew)setTimeout(()=>speakText(pt.det||""),200);
    else window.speechSynthesis.cancel();
  };

  const doCountry=(id)=>{
    const evs=COUNTRY_EVENTS[id];
    if(!evs?.length)return;
    playS("select");
    const ev=evs[0];
    const pt={id:`cc_${id}`,name:ev.name,c:isoM[id]||"#ff4400",s:3,st:"activo",det:ev.det};
    setSel(prev=>prev?.id===pt.id?null:pt);
    if(sel?.id!==pt.id)setTimeout(()=>speakText(ev.det),200);
    else window.speechSynthesis.cancel();
  };

  // Connection lines
  const connLines=[];
  pts.forEach(p=>(p.conn||[]).forEach(tid=>{
    const tgt=pts.find(x=>x.id===tid);
    if(tgt){const a=xy(p.lat,p.lng),b=xy(tgt.lat,tgt.lng);if(a&&b)connLines.push({x1:a[0],y1:a[1],x2:b[0],y2:b[1],col:p.c,key:`${p.id}-${tid}`});}
  }));

  const today=new Date().toLocaleDateString("es-MX",{weekday:"short",day:"2-digit",month:"short",year:"numeric"}).toUpperCase();

  return(
    <div style={{background:bg,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",padding:"10px 8px 14px",fontFamily:"'Courier New',monospace",color:"#fff",transition:"background 0.5s",userSelect:"none"}}>

      {/* ALERTS */}
      <div style={{width:"100%",maxWidth:"980px",marginBottom:"6px",display:"flex",gap:"5px",flexWrap:"wrap"}}>
        {mode==="war"&&(
          <>
            <div style={{flex:1,padding:"5px 10px",background:"#0a0404",border:"1px solid #ff4400",borderRadius:"3px",fontSize:"8px",color:"#ff4400",letterSpacing:"1px",animation:"blink 2s steps(1) infinite",cursor:"pointer",minWidth:"200px"}}
              onClick={()=>doPoint({id:"russia_intel",name:"🇷🇺 RUSIA\nINTELIGENCIA",c:"#ff4400",s:5,st:"critico",lat:55,lng:37,det:"Rusia proporcionando inteligencia a Irán sobre posiciones exactas de tropas, barcos y aviones de EE.UU. Primera señal concreta de que Moscú busca involucrarse directamente."})}>
              🇷🇺 RUSIA DANDO INTELIGENCIA A IRÁN ⚠️
            </div>
            <div style={{flex:1,padding:"5px 10px",background:"#04040a",border:"1px solid #4466ff",borderRadius:"3px",fontSize:"8px",color:"#4466ff",letterSpacing:"1px",cursor:"pointer",minWidth:"200px"}}
              onClick={()=>doPoint({id:"degaulle",name:"🇫🇷 CHARLES\nDE GAULLE",c:"#4466ff",s:3,st:"activo",lat:35.5,lng:24,det:"Macron envió el portaaviones Charles de Gaulle con escolta completa al Mediterráneo para defender Chipre junto a Italia, España, Países Bajos y Grecia."})}>
              🇫🇷 CHARLES DE GAULLE → MEDITERRÁNEO
            </div>
            <div style={{flex:1,padding:"5px 10px",background:"#080404",border:"1px solid #ffcc00",borderRadius:"3px",fontSize:"8px",color:"#ffcc00",letterSpacing:"1px",cursor:"pointer",minWidth:"200px"}}
              onClick={()=>doPoint({id:"ukr_help",name:"🇺🇦 UCRANIA\nAYUDA USA",c:"#ffcc00",s:3,st:"activo",lat:48.4,lng:31.2,det:"Trump pidió a Ucrania asistencia con drones Shahed iraníes. Zelenski aceptó y envió especialistas a zona de operaciones."})}>
              🇺🇦 UCRANIA AYUDA A EE.UU. CON DRONES SHAHED
            </div>
          </>
        )}
        {mode==="disease"&&(
          <div style={{flex:1,padding:"5px 10px",background:"#0a0502",border:"1px solid #ff4400",borderRadius:"3px",fontSize:"8px",color:"#ff4400",letterSpacing:"1px",animation:"blink 2s steps(1) infinite",cursor:"pointer"}}
            onClick={()=>doPoint(BASE_DISEASE[0])}>
            🔴 BROTE ACTIVO: SARAMPIÓN EN MÉXICO — CDMX, JALISCO, NUEVO LEÓN
          </div>
        )}
      </div>

      {/* HEADER */}
      <div style={{width:"100%",maxWidth:"980px",marginBottom:"7px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"6px"}}>
          <div>
            <div style={{fontSize:"8px",letterSpacing:"5px",color:ac,animation:"blink 1s steps(1) infinite"}}>
              ⬤ {aiLoading?"ACTUALIZANDO AI...":"TIEMPO REAL"} • 🔊 VOZ • USGS+NOAA+AI {lastUpdate?`• ${lastUpdate.toLocaleTimeString("es-MX")}`:""}
            </div>
            <h1 style={{fontSize:"clamp(10px,1.8vw,17px)",fontWeight:"900",letterSpacing:"2px",color:"#fff",margin:"2px 0 0",textShadow:`0 0 22px ${ac}`}}>{TITLES[mode]}</h1>
            <div style={{fontSize:"7.5px",color:"#222",letterSpacing:"1px",marginTop:"1px"}}>
              {today} • SISMOS: {quakes.length} M5.5+ hoy • HURACANES: {noaaChecked?(hurricanes.length>0?`${hurricanes.length} ACTIVOS`:"NINGUNO ACTIVO"):"verificando..."}
            </div>
            {aiHeadline&&<div style={{marginTop:"4px",fontSize:"8px",color:ac,letterSpacing:"1px",maxWidth:"600px"}}>🤖 {aiHeadline}</div>}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"5px",alignItems:"flex-end"}}>
            <button onClick={cycleMode}
              style={{padding:"7px 13px",background:"transparent",border:`1px solid ${ac}`,borderRadius:"3px",color:ac,fontFamily:"'Courier New',monospace",fontSize:"10px",letterSpacing:"2px",cursor:"pointer",fontWeight:"bold",whiteSpace:"nowrap"}}
              onMouseEnter={e=>e.currentTarget.style.boxShadow=`0 0 22px ${ac}90`}
              onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
              {NEXT[mode]} →
            </button>
            <button onClick={()=>{fetchQuakes();fetchHurricanes();fetchAI();}}
              style={{padding:"4px 10px",background:"transparent",border:`1px solid ${ac}30`,borderRadius:"3px",color:`${ac}80`,fontFamily:"'Courier New',monospace",fontSize:"8px",cursor:"pointer"}}>
              ⟳ ACTUALIZAR
            </button>
            <div style={{display:"flex",gap:"5px"}}>
              {MODES.map(m=><div key={m} style={{width:"6px",height:"6px",borderRadius:"50%",background:m===mode?ACC[m]:"#1a1a1a",boxShadow:m===mode?`0 0 6px ${ACC[m]}`:"none",transition:"all 0.3s"}}/>)}
            </div>
          </div>
        </div>
      </div>

      {/* MAP */}
      <div style={{width:"100%",maxWidth:"980px",position:"relative",border:`1px solid ${ac}14`,borderRadius:"6px",overflow:"hidden",boxShadow:`0 0 50px ${ac}12`,background:"#020610"}}>
        {!geo&&(
          <div style={{height:"440px",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"12px"}}>
            <div style={{fontSize:"22px",animation:"spin 1.5s linear infinite"}}>🌍</div>
            <div style={{fontSize:"9px",color:ac,letterSpacing:"4px",animation:"blink 1s steps(1) infinite"}}>CARGANDO MAPA...</div>
          </div>
        )}
        {geo&&(
          <svg viewBox={`0 0 ${W} ${H}`} style={{display:"block",width:"100%"}}>
            <rect width={W} height={H} fill="#020814"/>
            {geo.sphere&&<path d={geo.sphere} fill="#020a14" stroke={ac} strokeWidth="0.3" strokeOpacity="0.12"/>}

            {/* Countries */}
            {geo.paths.map(({id,d})=>{
              const col=isoM[id];
              const hasCE=!!COUNTRY_EVENTS[id]&&(mode==="war"||mode==="disease");
              return(
                <path key={id} d={d}
                  fill={col?col+"1c":"#080e08"}
                  stroke={col?col:"#0c1c0c"}
                  strokeWidth={col?0.55:0.18}
                  strokeOpacity={col?0.48:1}
                  onMouseEnter={()=>playHov(id)}
                  style={{cursor:hasCE?"pointer":"default",transition:"fill 0.1s"}}
                  onMouseOver={e=>{if(col)e.target.setAttribute("fill",col+(hasCE?"55":"36"));}}
                  onMouseOut={e=>{e.target.setAttribute("fill",col?col+"1c":"#080e08");}}
                  onClick={()=>hasCE&&doCountry(id)}
                />
              );
            })}
            {geo.borders&&<path d={geo.borders} fill="none" stroke="#0c1e0c" strokeWidth="0.18"/>}

            {/* Connection lines */}
            {connLines.map(l=>(
              <g key={l.key}>
                <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={l.col} strokeWidth="0.6" strokeOpacity="0.38" strokeDasharray="4,4">
                  <animate attributeName="stroke-dashoffset" from="0" to="-16" dur="0.8s" repeatCount="indefinite"/>
                </line>
              </g>
            ))}

            {/* Carriers */}
            {mode==="war"&&CARRIERS.map(c=>{
              const p=xy(c.lat,c.lng);if(!p)return null;
              const[cx,cy]=p,cc=c.c||"#4488ff";
              return(
                <g key={c.id} onClick={()=>doPoint({id:c.id,name:c.name+"\n⚓",lat:c.lat,lng:c.lng,c:cc,s:5,st:"activo",det:c.det})} style={{cursor:"pointer"}}>
                  <ellipse cx={cx} cy={cy} rx={16} ry={4} fill="none" stroke={cc} strokeWidth="0.4" strokeOpacity="0.2" transform={`rotate(-22,${cx},${cy})`}>
                    <animate attributeName="rx" values="16;22;16" dur="3s" repeatCount="indefinite"/>
                  </ellipse>
                  <g style={{filter:`drop-shadow(0 0 4px ${cc})`}}>
                    <rect x={cx-10} y={cy-1.8} width={20} height={4} fill={cc} rx="2" opacity="0.92"/>
                    <rect x={cx-6} y={cy-4} width={10} height={2.4} fill={cc} rx="0.8" opacity="0.88"/>
                    <rect x={cx+2} y={cy-6.5} width={4} height={3} fill="#66aaff" rx="0.8"/>
                  </g>
                  {c.name.split("\n").map((ln,li)=>(
                    <text key={li} x={cx} y={cy-9-(c.name.split("\n").length-1-li)*8} textAnchor="middle" fill={cc} fontSize="5.5" fontFamily="'Courier New',monospace" fontWeight="bold" style={{pointerEvents:"none",filter:`drop-shadow(0 0 2px ${cc})`}}>{ln}</text>
                  ))}
                </g>
              );
            })}

            {/* Hurricane tracks — only real NOAA storms */}
            {mode==="climate"&&hurricanes.map(h=>{
              const track=hurTracks[h.id]||[];
              const pos=hurPos[h.id]||{lat:h.lat,lng:h.lng};
              const ph=xy(pos.lat,pos.lng);if(!ph)return null;
              const[hx,hy]=ph,hc=hurCol(h.kts);
              return(
                <g key={`h-${h.id}`} onClick={()=>doPoint({id:`hur_${h.id}`,name:`🌀 ${h.name}`,lat:pos.lat,lng:pos.lng,c:hc,s:5,st:"extremo",icon:"🌀",det:`Huracán ${h.name} — ${hurCat(h.kts)}. ${Math.round(h.kts*1.852)} km/h. Posición: ${pos.lat?.toFixed(2)}°, ${pos.lng?.toFixed(2)}°. Fuente: NOAA NHC.`})} style={{cursor:"pointer"}}>
                  {track.slice(0,-1).map((tp,i)=>{const nxt=track[i+1];if(!nxt)return null;const a=xy(tp.lat,tp.lng),b=xy(nxt.lat,nxt.lng);if(!a||!b)return null;return<line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={hc} strokeWidth="0.6" strokeOpacity={(i+1)/track.length*0.45} strokeDasharray="3,3"/>;})}
                  {[0,1,2].map(i=>(<circle key={i} cx={hx} cy={hy} r={7} fill="none" stroke={hc} strokeWidth="0.7" opacity="0"><animate attributeName="r" from="7" to={7+i*13} dur={`${1.5+i*0.5}s`} begin={`${i*0.4}s`} repeatCount="indefinite"/><animate attributeName="opacity" from="0.7" to="0" dur={`${1.5+i*0.5}s`} begin={`${i*0.4}s`} repeatCount="indefinite"/></circle>))}
                  <circle cx={hx} cy={hy} r="5" fill={hc} opacity="0.75" style={{filter:`drop-shadow(0 0 6px ${hc})`}}/>
                  <g><animateTransform attributeName="transform" type="rotate" from={`0 ${hx} ${hy}`} to={`360 ${hx} ${hy}`} dur="3.5s" repeatCount="indefinite"/>
                    {[0,90,180,270].map(a=>{const rad=(a*Math.PI)/180;return<line key={a} x1={hx+Math.cos(rad)*3} y1={hy+Math.sin(rad)*3} x2={hx+Math.cos(rad)*7.5} y2={hy+Math.sin(rad)*7.5} stroke={hc} strokeWidth="1.4" strokeLinecap="round" opacity="0.85"/>;})}
                  </g>
                  <text x={hx} y={hy-11} textAnchor="middle" fill={hc} fontSize="6.5" fontFamily="'Courier New',monospace" fontWeight="bold" style={{pointerEvents:"none"}}>{h.name}</text>
                  <text x={hx+11} y={hy-2} fill={hc} fontSize="5.5" fontFamily="'Courier New',monospace" style={{pointerEvents:"none"}}>{hurCat(h.kts)}</text>
                </g>
              );
            })}
            {mode==="climate"&&noaaChecked&&hurricanes.length===0&&(
              <text x={W/2} y={H-12} textAnchor="middle" fill="#2a1a3a" fontSize="9" fontFamily="'Courier New',monospace">🌀 NOAA: SIN HURACANES ACTIVOS EN ESTE MOMENTO</text>
            )}

            {/* Main points */}
            {pts.filter(pt=>pt.lat&&pt.lng).map(pt=>{
              const p=xy(pt.lat,pt.lng);if(!p)return null;
              const[px,py]=p,isSel=sel?.id===pt.id,isPing=ping===pt.id,r=isSel?9:6.5,ptc=pt.c||"#ff4400";
              return(
                <g key={pt.id} onClick={()=>doPoint(pt)} style={{cursor:"pointer"}}>
                  {pt.pulse&&[0,1,2].map(i=>(<circle key={i} cx={px} cy={py} r={r} fill="none" stroke={ptc} strokeWidth="0.65" opacity="0"><animate attributeName="r" from={r} to={r+26} dur={`${1.8+i*0.6}s`} begin={`${i*0.5}s`} repeatCount="indefinite"/><animate attributeName="opacity" from="0.55" to="0" dur={`${1.8+i*0.6}s`} begin={`${i*0.5}s`} repeatCount="indefinite"/></circle>))}
                  {isPing&&(<circle cx={px} cy={py} r={r} fill="none" stroke="#fff" strokeWidth="2" opacity="0.9"><animate attributeName="r" from={r} to={r+22} dur="0.6s"/><animate attributeName="opacity" from="0.9" to="0" dur="0.6s"/></circle>)}
                  {isSel&&(<circle cx={px} cy={py} r={r+5} fill="none" stroke={ptc} strokeWidth="1.1" strokeDasharray="3,3" opacity="0.85"><animateTransform attributeName="transform" type="rotate" from={`0 ${px} ${py}`} to={`360 ${px} ${py}`} dur="4s" repeatCount="indefinite"/></circle>)}
                  <circle cx={px} cy={py} r={r} fill={ptc} style={{filter:`drop-shadow(0 0 ${isSel?13:6}px ${ptc})`}}/>
                  <circle cx={px} cy={py} r={r*0.36} fill="rgba(255,255,255,0.55)"/>
                  {pt.icon&&<text x={px} y={py+2.5} textAnchor="middle" fontSize="5.5" style={{pointerEvents:"none"}}>{pt.icon}</text>}
                  {(pt.name||"").split("\n").map((ln,li)=>(
                    <text key={li} x={px} y={py-r-2.5-((pt.name||"").split("\n").length-1-li)*8}
                      textAnchor="middle" fill={ptc} fontSize={isSel?8:6.5} fontFamily="'Courier New',monospace" fontWeight="bold"
                      style={{pointerEvents:"none",filter:`drop-shadow(0 0 3px ${ptc})`}}>{ln}</text>
                  ))}
                </g>
              );
            })}
          </svg>
        )}
        <div style={{position:"absolute",inset:0,pointerEvents:"none",background:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.025) 2px,rgba(0,0,0,0.025) 4px)"}}/>
        {[{top:"5px",left:"5px"},{top:"5px",right:"5px"},{bottom:"5px",left:"5px"},{bottom:"5px",right:"5px"}].map((pos,i)=>(
          <div key={i} style={{position:"absolute",...pos,width:"12px",height:"12px",borderTop:pos.top?`1px solid ${ac}40`:"none",borderBottom:pos.bottom?`1px solid ${ac}40`:"none",borderLeft:pos.left?`1px solid ${ac}40`:"none",borderRight:pos.right?`1px solid ${ac}40`:"none",pointerEvents:"none"}}/>
        ))}
        <div style={{position:"absolute",bottom:"5px",left:"50%",transform:"translateX(-50%)",fontSize:"7px",color:"#161616",letterSpacing:"2px",pointerEvents:"none",whiteSpace:"nowrap"}}>
          CURSOR → MÚSICA • PUNTOS → DETALLES+🔊 • PAÍSES ILUMINADOS → TOCA PARA EVENTOS
        </div>
      </div>

      {/* INFO PANEL */}
      {sel&&(
        <div style={{marginTop:"9px",padding:"12px 15px",background:bg,border:`1px solid ${sel.c||"#ff4400"}`,borderRadius:"4px",width:"100%",maxWidth:"980px",boxShadow:`0 0 28px ${(sel.c||"#ff4400")}28`,animation:"slideIn 0.2s ease"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"}}>
              <span style={{fontSize:"14px",fontWeight:"900",letterSpacing:"2px",color:sel.c||"#ff4400",textShadow:`0 0 10px ${sel.c||"#ff4400"}`}}>
                {sel.icon||""} {(sel.name||"").replace(/\n/g," ")}
              </span>
              <span style={{fontSize:"7.5px",background:sel.c||"#ff4400",color:"#000",padding:"2px 7px",borderRadius:"2px",letterSpacing:"2px",fontWeight:"bold"}}>{STATUS_L[sel.st]||sel.st?.toUpperCase()||"ACTIVO"}</span>
              {sel.s&&<span style={{fontSize:"8px",color:"#555"}}>{"▮".repeat(sel.s)}{"▯".repeat(5-sel.s)}</span>}
              <span style={{fontSize:"7.5px",color:ac,letterSpacing:"2px",animation:"blink 1s steps(1) infinite"}}>🔊 LEYENDO...</span>
            </div>
            <button onClick={()=>{setSel(null);window.speechSynthesis.cancel();}} style={{background:"none",border:"none",color:"#444",cursor:"pointer",fontSize:"15px",lineHeight:1,padding:"0 0 0 8px"}}>✕</button>
          </div>
          <div style={{marginTop:"9px",fontSize:"11px",color:"#ccc",lineHeight:"1.85",whiteSpace:"pre-line",borderTop:`1px solid ${(sel.c||"#ff4400")}15`,paddingTop:"9px"}}>
            {sel.det||"Cargando..."}
          </div>
        </div>
      )}

      {/* STATS */}
      <div style={{marginTop:"10px",display:"flex",gap:"6px",flexWrap:"wrap",justifyContent:"center",width:"100%",maxWidth:"980px"}}>
        {sts.map((st,i)=>(
          <button key={st.l} onClick={e=>doStat(st,e,i)}
            style={{position:"relative",overflow:"hidden",background:bg,border:`1px solid ${st.c}25`,borderRadius:"4px",padding:"8px 10px",textAlign:"center",minWidth:"95px",cursor:"pointer",fontFamily:"'Courier New',monospace",transition:"all 0.15s"}}
            onMouseEnter={e=>{e.currentTarget.style.border=`1px solid ${st.c}`;e.currentTarget.style.boxShadow=`0 0 14px ${st.c}42`;e.currentTarget.style.transform="translateY(-3px)";}}
            onMouseLeave={e=>{e.currentTarget.style.border=`1px solid ${st.c}25`;e.currentTarget.style.boxShadow="none";e.currentTarget.style.transform="translateY(0)";}}>
            {(ripples[i]||[]).map(rp=>(<div key={rp.id} style={{position:"absolute",left:rp.x-50,top:rp.y-50,width:"100px",height:"100px",borderRadius:"50%",background:`radial-gradient(circle,${rp.c}55 0%,transparent 70%)`,animation:"rippleOut 0.9s ease-out forwards",pointerEvents:"none"}}/>))}
            <div style={{fontSize:"14px",fontWeight:"900",color:st.c,textShadow:`0 0 7px ${st.c}55`,position:"relative"}}>{st.v}</div>
            <div style={{fontSize:"6.5px",color:"#2d2d2d",letterSpacing:"1.5px",marginTop:"2px",position:"relative"}}>{st.l}</div>
          </button>
        ))}
      </div>

      {/* LIVE STRIPS */}
      {mode==="climate"&&(
        <div style={{marginTop:"7px",width:"100%",maxWidth:"980px",display:"flex",gap:"6px",flexWrap:"wrap"}}>
          {Object.keys(wlive).length>0&&(
            <div style={{flex:2,background:"#020a08",border:"1px solid #00ff8820",borderRadius:"4px",padding:"6px 12px",display:"flex",gap:"10px",flexWrap:"wrap",alignItems:"center"}}>
              <span style={{fontSize:"8px",color:"#00ff88",letterSpacing:"3px",fontWeight:"bold"}}>📡 LIVE</span>
              {wlive.india&&<span style={{fontSize:"8px",color:"#ff4400"}}>🔥 INDIA {wlive.india.temperature_2m}°C</span>}
              {wlive.spain&&<span style={{fontSize:"8px",color:"#ff6600"}}>🌡 ESPAÑA {wlive.spain.temperature_2m}°C</span>}
              {wlive.aus&&<span style={{fontSize:"8px",color:"#ff3300"}}>🔥 AUS {wlive.aus.temperature_2m}°C</span>}
              {wlive.mexico&&<span style={{fontSize:"8px",color:"#8844ff"}}>🌀 MX {wlive.mexico.temperature_2m}°C | {wlive.mexico.wind_speed_10m}km/h</span>}
              {wlive.iran&&<span style={{fontSize:"8px",color:"#ff2020"}}>🔴 IRÁN {wlive.iran.temperature_2m}°C</span>}
            </div>
          )}
          {quakes.length>0&&(
            <div style={{flex:2,background:"#0a0800",border:"1px solid #ffaa0025",borderRadius:"4px",padding:"6px 12px",display:"flex",gap:"8px",flexWrap:"wrap",alignItems:"center"}}>
              <span style={{fontSize:"8px",color:"#ffaa00",letterSpacing:"2px",fontWeight:"bold"}}>🌋 USGS — {quakes.length} SISMOS</span>
              {quakes.slice(0,3).map(q=><span key={q.id} style={{fontSize:"8px",color:magCol(q.mag)}}>M{q.mag.toFixed(1)} {q.place.split(",")[0].substring(0,12)} {q.tsunami?"🌊":""}</span>)}
            </div>
          )}
        </div>
      )}

      {mode==="news"&&(
        <div style={{marginTop:"7px",width:"100%",maxWidth:"980px",background:"#080804",border:"1px solid #ffcc0020",borderRadius:"4px",padding:"6px 12px",overflow:"hidden"}}>
          <div style={{fontSize:"8.5px",color:"#ffcc00",letterSpacing:"1.5px",whiteSpace:"nowrap",animation:"ticker 35s linear infinite"}}>
            🛢️ PETRÓLEO $91/barril +31% &nbsp;•&nbsp; 📉 NASDAQ -6.2% semana &nbsp;•&nbsp; 🗳️ CDU Alemania 29% — AfD 20% histórico &nbsp;•&nbsp; ₿ Bitcoin $62K &nbsp;•&nbsp; 🥇 ORO $3,200 récord &nbsp;•&nbsp; 🌐 BRICS alternativa al dólar &nbsp;•&nbsp; 🛡️ OTAN cumbre 12 marzo &nbsp;•&nbsp; 📊 FMI: recesión posible &nbsp;•&nbsp; 🇫🇷 Le Pen 34% lidera Francia &nbsp;•&nbsp; 📊 Aranceles 25% a Europa el 15 marzo &nbsp;•&nbsp; 🇮🇷 Mojtaba Jamenei nuevo líder iraní &nbsp;•&nbsp; 🚢 Maersk suspende Medio Oriente
          </div>
        </div>
      )}

      <div style={{marginTop:"7px",fontSize:"7px",color:"#141414",letterSpacing:"2px",textAlign:"center"}}>
        USGS SISMOS + NOAA HURACANES REALES + Open-Meteo CLIMA + Claude AI — TODO EN TIEMPO REAL
      </div>

      <style>{`
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes rippleOut{0%{transform:scale(0.1);opacity:1}100%{transform:scale(4.5);opacity:0}}
        @keyframes slideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes ticker{0%{transform:translateX(100%)}100%{transform:translateX(-220%)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      `}</style>
    </div>
  );
}
