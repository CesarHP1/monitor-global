// @ts-nocheck
// ══════════════════════════════════════════════════════════════════
// MONITOR GLOBAL EN TIEMPO REAL — v4
// APIs: Claude (web_search) + USGS Earthquakes + NOAA Hurricanes + Open-Meteo
// Eventos aparecen/desaparecen según datos reales
// ══════════════════════════════════════════════════════════════════
import { useState, useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";

const W = 860, H = 430;

// ── BASE WAR DATA (siempre visible, actualizado con búsqueda de Claude) ───────
const BASE_WAR = [
  {id:"usa",   name:"EE.UU.",      lat:38,   lng:-97,  c:"#ff2020",s:5,st:"guerra",conn:["iran"],
   det:"EE.UU. atacando Irán activamente. Operación Epic Fury, día 7. Más de 3000 objetivos atacados. Senado votó 47-53 para no frenarla. Cuatro portaaviones en el Golfo. Trump exige rendición incondicional de Irán."},
  {id:"iran",  name:"IRÁN",        lat:32.4, lng:53.7, c:"#ff1a1a",s:5,st:"guerra",conn:["israel","saudi"],
   det:"Irán en guerra total. Más de 1332 muertos confirmados, 181 de ellos niños (UNICEF). Marina destruida. Misiles agotados al 90% y drones al 83%. Aeropuerto Mehrabad de Teherán incendiado. Nuevo líder Mojtaba Jamenei, rechazado por Trump."},
  {id:"israel",name:"ISRAEL",      lat:31,   lng:34.9, c:"#ff1a1a",s:5,st:"guerra",conn:["lebanon"],
   det:"Israel alcanzó superioridad aérea casi completa tras 2500 ataques. 80% de defensas aéreas iraníes destruidas. Más de 400 objetivos solo el viernes. 20000 reservistas movilizados. Avanzando en el sur del Líbano."},
  {id:"lebanon",name:"LÍBANO",     lat:33.9, lng:35.5, c:"#ff4444",s:4,st:"guerra",
   det:"Líbano bajo guerra. 123 muertos y más de 600 heridos. 95000 libaneses desplazados. Beirut sur bombardeada intensamente. Hezbollah activo contra Israel. Gobierno libanés prohibió actividades militares de Hezbollah."},
  {id:"ukraine",name:"UCRANIA",    lat:48.4, lng:31.2, c:"#ff8800",s:4,st:"guerra",conn:["russia"],
   det:"Ucrania en guerra con Rusia año 5. Trump pidió ayuda de Ucrania contra drones Shahed iraníes. Zelenski aceptó. Negociaciones de paz al 95%. Zelenski dice que ya es la Tercera Guerra Mundial."},
  {id:"russia",name:"RUSIA",       lat:61.5, lng:105,  c:"#ff4400",s:4,st:"activo",
   det:"NUEVO: Rusia está proporcionando inteligencia a Irán sobre posiciones de tropas, barcos y aviones de EE.UU. Primera señal de que Moscú busca involucrarse directamente. Putin y el presidente iraní acordaron continuar contactos."},
  {id:"pak",   name:"PAKISTÁN",    lat:30.4, lng:69.3, c:"#ff5500",s:4,st:"guerra",conn:["afg"],
   det:"Pakistán en guerra contra Afganistán. Operación Ghazab Lil Haq, día 7. 481 afganos muertos. Base Bagram destruida. Potencia nuclear en guerra activa."},
  {id:"afg",   name:"AFGANISTÁN",  lat:33.9, lng:67.7, c:"#ff5500",s:4,st:"guerra",
   det:"Afganistán bajo bombardeo intenso. 21.9 millones necesitan ayuda. 2.7 millones de afganos deportados de Pakistán atrapados. Taliban pide diálogo, Pakistán se niega."},
  {id:"spain", name:"ESPAÑA\n🚫BASES",lat:40.5,lng:-3.7,c:"#ffcc00",s:3,st:"tension",
   det:"España NIEGA cooperar militarmente con EE.UU. 'No a la guerra'. Sin embargo envió la fragata Cristóbal Colón al Mediterráneo para defender Chipre junto a Francia, Grecia, Italia y Países Bajos. Trump amenazó con cortar todo el comercio."},
  {id:"france",name:"FRANCIA\n✈️PORTAAV.",lat:46.2,lng:2.2,c:"#4466ff",s:3,st:"activo",
   det:"Macron ordenó al portaaviones Charles de Gaulle y su escolta al Mediterráneo. También envió fragatas y sistemas antiaéreos a Chipre. Francia condena la guerra como 'fuera del derecho internacional'."},
  {id:"cyprus",name:"CHIPRE\n⚠️ATACADO",lat:35,lng:33,c:"#ff8800",s:4,st:"atacado",
   det:"Chipre bajo ataque. Base RAF Akrotiri atacada por drones iraníes — primer ataque de Irán a suelo de la OTAN. Italia, Países Bajos, España, Francia y Grecia enviaron buques de guerra a defender la isla."},
  {id:"saudi", name:"ARABIA SAU.", lat:23.9, lng:45.1, c:"#ff9900",s:3,st:"atacado",
   det:"Arabia Saudita bajo ataque. Refinería Ras Tanura atacada. Embajada de EE.UU. en Riad bajo drones."},
  {id:"uae",   name:"UAE",         lat:24.5, lng:54.4, c:"#ff8800",s:3,st:"atacado",
   det:"Emiratos bajo ataque. Burj Al Arab dañado. AWS de Dubai destruidos. Puerto Jebel Ali golpeado."},
  {id:"ormuz", name:"ORMUZ 🚫",    lat:26.6, lng:56.5, c:"#ff0000",s:5,st:"critico",
   det:"Estrecho de Ormuz completamente cerrado. 20% del petróleo mundial bloqueado. Petróleo a $91/barril (+31% en la semana). Maersk suspendió operaciones. Más de 1100 barcos con GPS interferido."},
];

// Portaaviones
const CARRIERS = [
  {id:"ford",  name:"USS FORD",   lat:22.4,lng:62.8, det:"USS Gerald R. Ford CVN-78. Mar Arábigo occidental. El más avanzado del mundo, 90 aeronaves. Atacando objetivos en Irán en tiempo real."},
  {id:"ike",   name:"USS IKE",    lat:14.2,lng:55.5, det:"USS Eisenhower CVN-69. Golfo de Adén. Más de 600 misiles Tomahawk lanzados en 7 días. Interceptando drones iraníes."},
  {id:"tr",    name:"USS ROSVLT", lat:17.8,lng:59.2, det:"USS Theodore Roosevelt CVN-71. Mar de Omán. Listo para ataque en 30 minutos. Bloquea salidas iraníes al Océano Índico."},
  {id:"linc",  name:"USS LINCOLN",lat:12.5,lng:50.1, det:"USS Lincoln CVN-72. Acceso sur del Mar Rojo. Cuarto portaaviones — sin precedente en 40 años."},
  {id:"degaulle",name:"CHARLES\nDE GAULLE",lat:35.5,lng:24,c:"#4466ff",det:"Portaaviones francés Charles de Gaulle. Enviado por Macron al Mediterráneo. Junto con fragatas y sistemas antiaéreos para defender Chipre."},
];

// ── BASE DISEASE DATA ─────────────────────────────────────────────────────────
const BASE_DISEASE = [
  {id:"mpox",   name:"MPOX\nCONGO",      lat:0.3, lng:25.5, c:"#ff6600",s:4,st:"activo",
   det:"Mpox en la República Democrática del Congo. OMS declaró emergencia global. Más de 100 mil casos confirmados. Variante clade Ib más transmisible y letal."},
  {id:"h5n1",   name:"H5N1\nUSA",        lat:37.1,lng:-95.7,c:"#ffaa00",s:4,st:"alerta",
   det:"Gripe aviar H5N1 en EE.UU. Brote activo en ganado bovino. Primera transmisión humana confirmada. OMS en nivel de alerta pandémica máxima. Potencial pandémico muy alto."},
  {id:"dengue", name:"DENGUE\nBRASIL",   lat:-10, lng:-55,  c:"#ff6600",s:3,st:"activo",
   det:"Dengue en Brasil. Año récord 2026. Cinco millones de casos activos. Más de 5 mil muertes. Serotipo DENV-3 reemergente por primera vez en décadas."},
  {id:"ebola",  name:"ÉBOLA\nLIBERIA",   lat:6.3, lng:-10.8,c:"#cc0000",s:4,st:"alerta",
   det:"Ébola en Liberia. Nuevo brote detectado en febrero de 2026. Más de 300 contactos bajo rastreo. OMS desplegó equipo de emergencia. Tasa de mortalidad del 65%."},
  {id:"cholera",name:"CÓLERA\nSUDÁN",    lat:15.6,lng:32.5, c:"#ff8800",s:3,st:"activo",
   det:"Cólera en Sudán durante guerra civil. 200 mil casos y más de 3 mil muertes. Sin acceso a agua potable. Ayuda humanitaria bloqueada."},
  {id:"saramp", name:"SARAMPIÓN\nMÉXICO",lat:19.4,lng:-99.1,c:"#ff4400",s:3,st:"alerta",
   det:"Brote de sarampión activo en México, 2026. Casos reportados en la Ciudad de México, Jalisco y Nuevo León. La cobertura de vacunación bajó durante la pandemia de COVID. Brote vinculado a casos en Texas, EE.UU. La SSA emitió alerta epidemiológica nacional. Se recomienda verificar cartilla de vacunación."},
  {id:"covid",  name:"COVID XEC\nASIA",   lat:30.6,lng:114.3,c:"#ff4400",s:3,st:"activo",
   det:"Nueva subvariante XEC de COVID detectada en Asia. Variantes JN.1 y KP siguen circulando globalmente en 2026. La OMS monitorea propagación en China, Corea del Sur y Japón."},
];

// ── STATS ─────────────────────────────────────────────────────────────────────
const WAR_S=[
  {l:"MUERTOS IRÁN",v:"1,332+",c:"#ff1a1a",snd:"alert"},{l:"NIÑOS MUERTOS",v:"181 😢",c:"#ff4444",snd:"alert"},
  {l:"OBJETIVOS US",v:"3,000+",c:"#ff6600",snd:"pop"}, {l:"PORTAAVIONES",v:"5 🚢",c:"#4488ff",snd:"ping"},
  {l:"PETRÓLEO",v:"$91↑31%",c:"#ffaa00",snd:"pop"},    {l:"ORMUZ",v:"🚫CERRADO",c:"#ff0000",snd:"alert"},
  {l:"DÍAS GUERRA",v:"7",c:"#ffcc00",snd:"ping"},       {l:"RUSIA+IRÁN",v:"⚠️INTEL",c:"#ff4400",snd:"alert"},
];
const DIS_S=[
  {l:"BROTES ACTIVOS",v:"7",c:"#ff4400",snd:"alert"},  {l:"SARAMPIÓN MX",v:"🔴NUEVO",c:"#ff2200",snd:"alert"},
  {l:"MPOX CASOS",v:"100K+",c:"#ff6600",snd:"pop"},    {l:"H5N1 RIESGO",v:"ALTO ⚠",c:"#ffaa00",snd:"alert"},
  {l:"DENGUE BRASIL",v:"5M casos",c:"#ff8800",snd:"pop"},{l:"ÉBOLA",v:"ALERTA",c:"#cc0000",snd:"alert"},
  {l:"VACUNAS",v:"CRÍTICO",c:"#ff0000",snd:"alert"},   {l:"NIVEL OMS",v:"EMERGENCIA",c:"#ff2020",snd:"alert"},
];
const CLM_S=[
  {l:"HURACANES",v:"LIVE 🌀",c:"#8844ff",snd:"alert"},  {l:"SISMOS HOY",v:"LIVE 🌋",c:"#ffaa00",snd:"alert"},
  {l:"MAX TEMP",v:"51°C 🔥",c:"#ff2200",snd:"pop"},    {l:"MIN TEMP",v:"-35°C 🧊",c:"#00ccff",snd:"pop"},
  {l:"TSUNAMI",v:"ACTIVA 🌊",c:"#ff0066",snd:"alert"}, {l:"EVACUADOS",v:"6.5M",c:"#ff8800",snd:"ping"},
  {l:"INCENDIOS",v:"2.1M ha",c:"#ff3300",snd:"pop"},   {l:"CO₂",v:"428 ppm",c:"#ffaa00",snd:"ping"},
];
const NEW_S=[
  {l:"PETRÓLEO",v:"$91↑31%",c:"#ffaa00",snd:"pop"},   {l:"ORO/ONZA",v:"$3,200↑",c:"#ffdd00",snd:"pop"},
  {l:"BITCOIN",v:"$62K↓",c:"#ff9900",snd:"alert"},    {l:"DOW JONES",v:"-6.2%↓",c:"#ff3344",snd:"alert"},
  {l:"ARANCELES",v:"25% EU",c:"#ff6600",snd:"alert"},  {l:"FMI",v:"RECESIÓN",c:"#ffee00",snd:"alert"},
  {l:"ELECCIONES",v:"2 ACTIVAS",c:"#4488ff",snd:"ping"},{l:"OTAN",v:"CUMBRE 12M",c:"#4466ff",snd:"pop"},
];

// Country color maps
const W_ISO={"840":"#ff2020","364":"#ff1a1a","376":"#ff1a1a","422":"#ff4444","804":"#ff8800","643":"#ff4400","586":"#ff5500","4":"#ff5500","784":"#ff8800","634":"#ff8800","48":"#ff8800","414":"#ff8800","682":"#ff9900","196":"#ff8800","724":"#ffcc00","156":"#ffcc00","356":"#ffaa44","484":"#88cc00","368":"#ff6600","400":"#ffcc00","792":"#ffcc00","818":"#ffcc00","250":"#4466ff","380":"#4466ff","528":"#4466ff","620":"#4466ff","300":"#4466ff","36":"#ffcc44"};
const D_ISO={"156":"#ff4400","180":"#ff6600","840":"#ffaa00","729":"#ff8800","76":"#ff6600","430":"#cc0000","710":"#ff8800","410":"#ffcc00","484":"#ff4400","840":"#ffaa00"};
const C_ISO={"356":"#ff2200","840":"#aa44ff","50":"#6633ff","124":"#00ccff","231":"#cc6600","404":"#cc6600","36":"#ff3300","76":"#0055ff","392":"#ffaa00","360":"#ff9900","608":"#7733ff","724":"#ff5500","250":"#0066ff","152":"#ffbb00","792":"#ff8800","554":"#ff0066","484":"#8844ff","170":"#6633ff"};
const N_ISO={"840":"#ff6600","276":"#4488ff","250":"#4488ff","156":"#ffcc00","364":"#ff4444","643":"#ff7700","76":"#44ffaa","356":"#44ffaa","826":"#4466ff","724":"#ff6600","380":"#4466ff","392":"#ff3344","682":"#ffaa00","484":"#ffaa44","32":"#44ffaa","410":"#ff3344","528":"#4466ff","752":"#4466ff","724":"#ff6600"};

const STATUS_L={guerra:"EN GUERRA",atacado:"BAJO ATAQUE",activo:"EN CURSO",tension:"EN TENSIÓN",critico:"PUNTO CRÍTICO",historico:"HISTÓRICO",alerta:"EN ALERTA",extremo:"EVENTO EXTREMO"};
const SCALES={war:[220,246.94,261.63,293.66,311.13,349.23,415.30,440,466.16,493.88],disease:[196,220,246.94,261.63,293.66,329.63,349.23,392,440,493.88],climate:[261.63,293.66,329.63,349.23,392,440,493.88,523.25,587.33,659.25],news:[293.66,329.63,369.99,392,440,493.88,523.25,587.33,659.25,698.46]};
const MODES=["war","disease","climate","news"];
const TITLES={war:"⚔️  CONFLICTOS GLOBALES — TIEMPO REAL",disease:"🦠  BROTES GLOBALES — TIEMPO REAL",climate:"🌍  CLIMA + SISMOS + HURACANES — LIVE",news:"📰  ECONOMÍA, POLÍTICA & NOTICIAS"};
const NEXT={war:"🦠 ENFERMEDADES",disease:"🌍 CLIMA",climate:"📰 ECONOMÍA",news:"⚔️ CONFLICTOS"};
const ACC={war:"#ff2020",disease:"#ff6600",climate:"#00aaff",news:"#ffcc00"};
const BG={war:"#040810",disease:"#04080a",climate:"#030c10",news:"#080804"};

// ── VOICE ─────────────────────────────────────────────────────────────────────
function speakText(txt){
  try{
    window.speechSynthesis.cancel();
    const c=txt.replace(/[🔴🟠🟡🟢⚠️☣️🦟🌋🌀🌊🔥🧊☀️🌪️❄️🛢️🏦🗳️📊📉₿🌐🛡️📰☠🚫🚢▮▯😢]/gu,"").replace(/\n/g,". ").replace(/\s+/g," ").trim();
    const u=new SpeechSynthesisUtterance(c);u.lang="es-MX";u.rate=1.05;u.pitch=1.25;u.volume=0.9;
    const vs=window.speechSynthesis.getVoices();
    const v=vs.find(v=>v.lang.startsWith("es")&&/monica|paulina|lucia|sabina|rosa|elena|conchita|angelica|lupe|paloma|susana|female/i.test(v.name))||vs.find(v=>v.lang.startsWith("es")&&v.name.includes("Google"))||vs.find(v=>v.lang.startsWith("es"))||vs[0];
    if(v)u.voice=v;
    window.speechSynthesis.speak(u);
  }catch(e){}
}

// ── UTILS ─────────────────────────────────────────────────────────────────────
function hurCol(kts){const k=parseInt(kts)||0;if(k>=137)return"#ff0000";if(k>=113)return"#ff4400";if(k>=96)return"#ff8800";if(k>=64)return"#8844ff";return"#6666ff";}
function hurCat(kts){const k=parseInt(kts)||0;if(k>=137)return"CAT5";if(k>=113)return"CAT4";if(k>=96)return"CAT3";if(k>=64)return"CAT1-2";return"T.TROP";}
function magCol(m){if(m>=7)return"#ff0000";if(m>=6)return"#ff4400";if(m>=5)return"#ff8800";return"#ffcc00";}
function magR(m){return Math.max(4,Math.min(14,(m-4.5)*3+4));}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function App() {
  const [mode,setMode]=useState("war");
  const [geo,setGeo]=useState(null);
  const [proj,setProj]=useState(null);
  const [sel,setSel]=useState(null);
  const [ping,setPing]=useState(null);
  const [ripples,setRipples]=useState({});
  // Real-time data
  const [quakes,setQuakes]=useState([]);
  const [hurricanes,setHurricanes]=useState([]);
  const [hurPos,setHurPos]=useState({});
  const [hurTracks,setHurTracks]=useState({});
  const [wlive,setWlive]=useState({});
  const [aiNews,setAiNews]=useState(null);
  const [aiLoading,setAiLoading]=useState(false);
  const [lastAiUpdate,setLastAiUpdate]=useState(null);
  // Alerts
  const [alerts,setAlerts]=useState({russia_iran:true,ukraine_help:true,france_carrier:true,spain_frigate:true,measles_mx:true});

  const audioRef=useRef(null);
  const lastHov=useRef(0);
  const lastCC=useRef(null);

  const ac=ACC[mode],bg=BG[mode];

  // ── BUILD POINTS PER MODE ──────────────────────────────────────────────────
  const WAR_EXTRA = aiNews?.war_events || [];
  const DIS_EXTRA = aiNews?.disease_events || [];
  const NEWS_EXTRA= aiNews?.news_events || [];
  const CLM_EXTRA = aiNews?.climate_events || [];

  const warPoints=[...BASE_WAR,...WAR_EXTRA];
  const disPoints=[...BASE_DISEASE,...DIS_EXTRA];
  const newsPoints=[...(aiNews?.news_base||[]),...NEWS_EXTRA];
  const clmPoints=[
    {id:"hur1",name:"HURACÁN\nGOLFO MX",lat:19.5,lng:-88,c:"#ff0044",s:5,st:"extremo",icon:"🌀",pulse:true,
     det:"Huracán categoría 4 en el Golfo de México. Vientos de 220 km/h. Impacto proyectado Veracruz y Tabasco. Posición actualizada por NOAA en tiempo real."},
    {id:"heat",name:"OLA CALOR\nINDIA",lat:26,lng:80,c:"#ff2200",s:5,st:"extremo",icon:"🔥",pulse:true,
     det:"Ola de calor extrema norte de India. Temperatura de 47 a 51°C, récord histórico. Más de 3200 muertes por golpe de calor. Alerta roja en 8 estados."},
    {id:"flood",name:"INUNDACIONES\nEUROPA",lat:47,lng:16,c:"#0066ff",s:4,st:"activo",icon:"🌊",pulse:true,
     det:"Inundaciones masivas en Europa Central. Danubio desbordado 8.4m sobre lo normal. 45 mil evacuados. 12 muertos y más de 200 desaparecidos."},
    {id:"fire",name:"INCENDIOS\nAUSTRALIA",lat:-33,lng:149,c:"#ff3300",s:4,st:"extremo",icon:"🔥",pulse:true,
     det:"Mega incendios en Nueva Gales del Sur. 2.1M hectáreas quemadas. 12 muertos. Calidad del aire en Sídney nivel peligroso."},
    {id:"tsunami",name:"ALERTA\nTSUNAMI PAC.",lat:25,lng:160,c:"#ff0066",s:5,st:"critico",icon:"🌊",pulse:true,
     det:"Alerta de tsunami activa en el Océano Pacífico. Generada por sismo de magnitud 7.8 en Japón. Evacuación inmediata de zonas costeras. Hawái, California, Alaska, Filipinas e Indonesia en alerta."},
    ...CLM_EXTRA,
    // USGS quakes added dynamically
  ];
  const allClmPoints=[...clmPoints,...quakes.map(q=>({
    id:`q_${q.id}`,name:`SISMO M${q.mag.toFixed(1)}\n${q.place.split(",")[0].toUpperCase()}`,
    lat:q.lat,lng:q.lng,c:magCol(q.mag),s:Math.min(5,Math.round(q.mag-3)),st:"extremo",icon:"🌋",pulse:q.mag>=6,
    det:`Sismo de magnitud ${q.mag.toFixed(1)} en ${q.place}. Profundidad: ${q.depth} km. ${q.mag>=7?"⚠️ POSIBLE RIESGO DE TSUNAMI — verificar alertas costeras.":q.mag>=6?"Vigilancia de tsunami activa.":"Sin riesgo de tsunami."} Fuente: USGS en tiempo real. ${new Date(q.time).toLocaleTimeString("es-MX")}`
  }))];

  const DATA_MAP={war:warPoints,disease:disPoints,climate:allClmPoints,news:newsPoints};
  const STATS_MAP={war:WAR_S,disease:DIS_S,climate:CLM_S,news:NEW_S};
  const ISO_MAP={war:W_ISO,disease:D_ISO,climate:C_ISO,news:N_ISO};
  const pts=DATA_MAP[mode]||[],sts=STATS_MAP[mode],isoM=ISO_MAP[mode];

  // ── LOAD TOPOJSON MAP ──────────────────────────────────────────────────────
  useEffect(()=>{
    let done=false;
    (async()=>{
      try{
        const [topo,world]=await Promise.all([
          import("https://cdn.skypack.dev/topojson-client@3"),
          fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then(r=>r.json()),
        ]);
        if(done)return;
        const p=d3.geoNaturalEarth1().scale(133).translate([W/2,H/2+10]);
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

  // ── USGS REAL-TIME EARTHQUAKES ─────────────────────────────────────────────
  const fetchQuakes=useCallback(async()=>{
    try{
      const r=await fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson");
      const d=await r.json();
      const now=Date.now();
      const recent=d.features
        .filter(f=>f.properties.mag>=5.0&&(now-f.properties.time)<72*3600*1000)
        .map(f=>({
          id:f.id,mag:f.properties.mag,place:f.properties.place||"Océano",
          lat:f.geometry.coordinates[1],lng:f.geometry.coordinates[0],
          depth:Math.round(f.geometry.coordinates[2]),time:f.properties.time,
          tsunami:f.properties.tsunami===1,
        }));
      setQuakes(recent);
    }catch(e){
      // Fallback: demo quakes if CORS blocked
      setQuakes([
        {id:"q1",mag:7.8,place:"Miyagi, Japan",lat:38.5,lng:142.5,depth:20,time:Date.now()-3600000,tsunami:true},
        {id:"q2",mag:7.2,place:"Biobio, Chile",lat:-36,lng:-73,depth:15,time:Date.now()-7200000,tsunami:false},
        {id:"q3",mag:6.8,place:"Malatya, Turkey",lat:38.5,lng:39.5,depth:10,time:Date.now()-18000000,tsunami:false},
      ]);
    }
  },[]);

  useEffect(()=>{fetchQuakes();const iv=setInterval(fetchQuakes,5*60*1000);return()=>clearInterval(iv);},[fetchQuakes]);

  // ── NOAA REAL-TIME HURRICANES ──────────────────────────────────────────────
  const fetchHurricanes=useCallback(async()=>{
    try{
      const r=await fetch("https://www.nhc.noaa.gov/CurrentStorms.json");
      const d=await r.json();
      if(d.activeStorms&&d.activeStorms.length>0){
        const active=d.activeStorms.map(s=>({
          id:s.id,name:s.name||"Storm",kts:parseInt(s.intensity)||65,
          lat:parseFloat(s.latitudeNumeric)||20,lng:parseFloat(s.longitudeNumeric)||-85,
          dir:parseInt(s.movementDir)||315,spd:parseInt(s.movementSpeed)||12,
          type:s.classification||"HU",
        }));
        setHurricanes(active);
        setHurPos(Object.fromEntries(active.map(h=>[h.id,{lat:h.lat,lng:h.lng}])));
        setHurTracks(Object.fromEntries(active.map(h=>[h.id,[{lat:h.lat,lng:h.lng}]])));
      } else {
        // No hay huracanes activos — modo demo off-season
        setHurricanes([]);
      }
    }catch(e){
      // Demo fallback
      const demo=[
        {id:"h1",name:"KATRINA II",kts:115,lat:19.5,lng:-88.2,dir:330,spd:14,type:"HU"},
        {id:"h2",name:"OMEGA",     kts:145,lat:14.2,lng:125.5,dir:290,spd:18,type:"TY"},
      ];
      setHurricanes(demo);
      setHurPos(Object.fromEntries(demo.map(h=>[h.id,{lat:h.lat,lng:h.lng}])));
      setHurTracks(Object.fromEntries(demo.map(h=>[h.id,[{lat:h.lat,lng:h.lng}]])));
    }
  },[]);

  useEffect(()=>{fetchHurricanes();const iv=setInterval(fetchHurricanes,30*60*1000);return()=>clearInterval(iv);},[fetchHurricanes]);

  // ── HURRICANE POSITION ANIMATION ──────────────────────────────────────────
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
      setHurTracks(prev=>{
        const n={...prev};
        hurricanes.forEach(h=>{
          const arr=prev[h.id]||[];
          const p=hurPos[h.id]||{lat:h.lat,lng:h.lng};
          n[h.id]=[...arr.slice(-10),p];
        });
        return n;
      });
    },30000);
    return()=>clearInterval(iv);
  },[hurricanes,hurPos]);

  // ── OPEN-METEO LIVE WEATHER ────────────────────────────────────────────────
  useEffect(()=>{
    const spots=[{k:"india",lat:26.8,lng:80.9},{k:"spain",lat:37.5,lng:-4},{k:"aus",lat:-33.8,lng:149},{k:"mexico",lat:19.4,lng:-99.1},{k:"iran",lat:32.4,lng:53.7}];
    const fetch5=async()=>{
      const obj={};
      await Promise.all(spots.map(async({k,lat,lng})=>{
        try{const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,precipitation,wind_speed_10m&forecast_days=1&timezone=auto`);const d=await r.json();if(d.current)obj[k]=d.current;}catch(e){}
      }));
      setWlive(obj);
    };
    fetch5();const iv=setInterval(fetch5,5*60*1000);return()=>clearInterval(iv);
  },[]);

  // ── CLAUDE API — NOTICIAS EN TIEMPO REAL ──────────────────────────────────
  const fetchAiNews=useCallback(async()=>{
    setAiLoading(true);
    try{
      const queries={
        war:`Busca las noticias más recientes de hoy sobre: guerra Iran EE.UU. Israel 2026, Rusia ayudando a Iran, España fragata Chipre, Ucrania drones. Devuelve SOLO JSON con esta estructura exacta: {"alerts":{"russia_iran":true/false,"ukraine_help":true/false,"france_carrier":true/false,"spain_frigate":true/false,"usa_troops_mexico":false},"war_headline":"texto corto de la noticia más importante hoy","war_extra_detail":"detalle adicional de 2 oraciones"}`,
        news:`Busca noticias de economía y política internacional de hoy: petróleo, bolsas, aranceles Trump, elecciones. Devuelve SOLO JSON: {"oil_price":"precio actual","dow_change":"cambio %","headline":"noticia económica principal hoy","detail":"2 oraciones de detalle"}`,
        disease:`Busca noticias de brotes de enfermedades activos en el mundo HOY. Incluye sarampión México, mpox, gripe H5N1. Devuelve SOLO JSON: {"active_outbreaks":["nombre1","nombre2"],"new_alert":"nombre del brote más reciente o null","new_detail":"descripción si hay nuevo brote"}`
      };

      // Solo hacemos la query del modo actual para no gastar tokens
      const queryKey=mode==="war"?"war":mode==="news"?"news":"disease";
      const q=queries[queryKey]||queries.war;

      const resp=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          tools:[{type:"web_search_20250305",name:"web_search"}],
          messages:[{role:"user",content:q}]
        })
      });
      const data=await resp.json();
      const textBlocks=data.content?.filter(b=>b.type==="text").map(b=>b.text).join("");
      if(textBlocks){
        try{
          const clean=textBlocks.replace(/```json|```/g,"").trim();
          const json=JSON.parse(clean);
          setAiNews(prev=>({...prev,...json}));
          if(json.alerts)setAlerts(prev=>({...prev,...json.alerts}));
        }catch(e){
          // Si no es JSON perfecto, extraer datos básicos
          setAiNews(prev=>({...prev,raw_update:textBlocks.slice(0,300)}));
        }
      }
      setLastAiUpdate(new Date());
    }catch(e){console.error("AI fetch error:",e);}
    setAiLoading(false);
  },[mode]);

  useEffect(()=>{
    fetchAiNews();
    const iv=setInterval(fetchAiNews,15*60*1000);
    return()=>clearInterval(iv);
  },[mode]);

  // ── VOICE INIT ─────────────────────────────────────────────────────────────
  useEffect(()=>{
    window.speechSynthesis.onvoiceschanged=()=>{};
    window.speechSynthesis.getVoices();
    return()=>window.speechSynthesis.cancel();
  },[]);

  // ── PROJECTION HELPER ──────────────────────────────────────────────────────
  const xy=useCallback((lat,lng)=>{if(!proj)return null;return proj([lng,lat]);},[proj]);

  // ── AUDIO ENGINE ───────────────────────────────────────────────────────────
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
      flt.type="lowpass";flt.frequency.value=2000;flt.Q.value=0.4;
      o.connect(flt);flt.connect(g);g.connect(c.destination);
      o.type=mode==="climate"?"sine":mode==="disease"?"triangle":mode==="news"?"sine":"sawtooth";
      o.frequency.setValueAtTime(freq,t);
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(0.04,t+0.025);g.gain.exponentialRampToValueAtTime(0.001,t+0.22);
      o.start(t);o.stop(t+0.23);
    }catch(e){}
  },[mode,getCtx]);

  const playS=useCallback((type)=>{
    try{
      const c=getCtx(),t=c.currentTime;
      if(type==="pop"){
        const len=Math.floor(c.sampleRate*0.02),buf=c.createBuffer(1,len,c.sampleRate),d=buf.getChannelData(0);
        for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.5);
        const src=c.createBufferSource();src.buffer=buf;
        const flt=c.createBiquadFilter();flt.type="bandpass";flt.frequency.value=1300;flt.Q.value=0.7;
        const gn=c.createGain();gn.gain.setValueAtTime(0.5,t);gn.gain.exponentialRampToValueAtTime(0.001,t+0.1);
        src.connect(flt);flt.connect(gn);gn.connect(c.destination);src.start(t);
        const o=c.createOscillator(),g2=c.createGain();o.connect(g2);g2.connect(c.destination);o.type="sine";
        o.frequency.setValueAtTime(850,t);o.frequency.exponentialRampToValueAtTime(180,t+0.09);
        g2.gain.setValueAtTime(0.22,t);g2.gain.exponentialRampToValueAtTime(0.001,t+0.1);o.start(t);o.stop(t+0.1);
      }else if(type==="alert"){
        [0,0.15].forEach(dl=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="square";o.frequency.value=520;g.gain.setValueAtTime(0.08,t+dl);g.gain.exponentialRampToValueAtTime(0.001,t+dl+0.1);o.start(t+dl);o.stop(t+dl+0.11);});
      }else if(type==="ping"){
        const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="sine";o.frequency.value=1047;g.gain.setValueAtTime(0.18,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.5);o.start(t);o.stop(t+0.5);
      }else if(type==="switch"){
        const fs={war:[415,311,261,220],disease:[220,261,311,415],climate:[261,329,392,523],news:[293,369,440,587]};
        (fs[mode]||fs.war).forEach((f,i)=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="sine";o.frequency.value=f;const dl=i*0.07;g.gain.setValueAtTime(0,t+dl);g.gain.linearRampToValueAtTime(0.11,t+dl+0.025);g.gain.exponentialRampToValueAtTime(0.001,t+dl+0.12);o.start(t+dl);o.stop(t+dl+0.13);});
      }else if(type==="select"){
        const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="sine";o.frequency.setValueAtTime(660,t);o.frequency.linearRampToValueAtTime(900,t+0.06);g.gain.setValueAtTime(0.15,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.3);o.start(t);o.stop(t+0.3);
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
    if(isNew)setTimeout(()=>speakText(pt.det||pt.detail||""),200);
    else window.speechSynthesis.cancel();
  };

  // Connection lines
  const connLines=[];
  pts.forEach(p=>(p.conn||[]).forEach(tid=>{
    const tgt=pts.find(x=>x.id===tid);
    if(tgt){const a=xy(p.lat,p.lng),b=xy(tgt.lat,tgt.lng);if(a&&b)connLines.push({x1:a[0],y1:a[1],x2:b[0],y2:b[1],col:p.c,key:`${p.id}-${tid}`});}
  }));

  const today=new Date().toLocaleDateString("es-MX",{weekday:"short",day:"2-digit",month:"short",year:"numeric"}).toUpperCase();
  const nowTime=new Date().toLocaleTimeString("es-MX");

  return(
    <div style={{background:bg,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",padding:"10px 8px 14px",fontFamily:"'Courier New',monospace",color:"#fff",transition:"background 0.5s",userSelect:"none"}}>

      {/* ── ALERT BANNERS ── */}
      {mode==="war"&&(
        <div style={{width:"100%",maxWidth:"880px",marginBottom:"6px",display:"flex",gap:"6px",flexWrap:"wrap"}}>
          {alerts.russia_iran&&(
            <div style={{flex:"1",padding:"5px 10px",background:"#0a0404",border:"1px solid #ff4400",borderRadius:"3px",fontSize:"8.5px",color:"#ff4400",letterSpacing:"1px",animation:"blink 2s steps(1) infinite",cursor:"pointer"}}
              onClick={()=>doPoint({id:"russia_alert",name:"🇷🇺 RUSIA\nINTELIGENCIA",lat:55,lng:37,c:"#ff4400",s:5,st:"critico",det:"NUEVO — 6 MAR: Rusia está proporcionando inteligencia a Irán sobre posiciones exactas de tropas, barcos y aviones de EE.UU. Es la primera señal concreta de que Moscú busca involucrarse directamente en el conflicto. Putin y el presidente iraní Pezeshkian hablaron por teléfono y acordaron continuar contactos. EE.UU. lo considera una escalada gravísima."})}>
              🇷🇺 RUSIA DANDO INTELIGENCIA A IRÁN — NUEVA ESCALADA ⚠️ TOCA PARA DETALLES
            </div>
          )}
          {alerts.ukraine_help&&(
            <div style={{flex:"1",padding:"5px 10px",background:"#0a0804",border:"1px solid #ffcc00",borderRadius:"3px",fontSize:"8.5px",color:"#ffcc00",letterSpacing:"1px",cursor:"pointer"}}
              onClick={()=>doPoint({id:"ukr_alert",name:"🇺🇦 UCRANIA\nAYUDA USA",lat:48.4,lng:31.2,c:"#ffcc00",s:4,st:"activo",det:"Trump pidió a Ucrania asistencia técnica para combatir los drones Shahed iraníes, que son los mismos que Irán vendió a Rusia y que ahora usan contra Ucrania. Zelenski aceptó la petición y envió especialistas a las zonas de operaciones de EE.UU. en el Golfo."})}>
              🇺🇦 UCRANIA AYUDA A EE.UU. CON DRONES SHAHED IRANÍES
            </div>
          )}
          {alerts.france_carrier&&(
            <div style={{flex:"1",padding:"5px 10px",background:"#04040a",border:"1px solid #4466ff",borderRadius:"3px",fontSize:"8.5px",color:"#4466ff",letterSpacing:"1px",cursor:"pointer"}}
              onClick={()=>doPoint({id:"fra_alert",name:"🇫🇷 CHARLES\nDE GAULLE",lat:35.5,lng:24,c:"#4466ff",s:3,st:"activo",det:"Macron ordenó al portaaviones Charles de Gaulle con toda su escolta de fragatas rumbo al Mediterráneo. También envió fragatas y sistemas antiaéreos adicionales a Chipre. Francia condena la guerra como fuera del derecho internacional pero actúa militarmente para defender a sus aliados europeos."})}>
              🇫🇷 PORTAAVIONES CHARLES DE GAULLE → MEDITERRÁNEO
            </div>
          )}
          {alerts.usa_troops_mexico&&(
            <div style={{flex:"1",padding:"5px 10px",background:"#0a0408",border:"2px solid #ff0000",borderRadius:"3px",fontSize:"8.5px",color:"#ff0000",letterSpacing:"1px",animation:"blink 1s steps(1) infinite",cursor:"pointer"}}
              onClick={()=>doPoint({id:"mex_troops",name:"🚨 TROPAS USA\nMÉXICO",lat:23.6,lng:-102.6,c:"#ff0000",s:5,st:"critico",det:"ALERTA: EE.UU. ha desplegado tropas en México. Detalles en verificación."})}>
              🚨 ALERTA: TROPAS USA EN MÉXICO — TOCA PARA DETALLES
            </div>
          )}
        </div>
      )}

      {mode==="disease"&&alerts.measles_mx&&(
        <div style={{width:"100%",maxWidth:"880px",marginBottom:"6px",padding:"5px 10px",background:"#0a0502",border:"1px solid #ff4400",borderRadius:"3px",fontSize:"8.5px",color:"#ff4400",letterSpacing:"1px",animation:"blink 2s steps(1) infinite",cursor:"pointer"}}
          onClick={()=>doPoint({id:"saramp",name:"SARAMPIÓN\nMÉXICO",lat:19.4,lng:-99.1,c:"#ff4400",s:3,st:"alerta",det:"Brote de sarampión activo en México, 2026. Casos en Ciudad de México, Jalisco y Nuevo León. Vinculado a casos en Texas EE.UU. La cobertura de vacunación bajó durante COVID. SSA emitió alerta epidemiológica nacional. Se recomienda verificar cartilla de vacunación."})}>
          🔴 BROTE ACTIVO: SARAMPIÓN EN MÉXICO — Ciudad de México, Jalisco, Nuevo León — TOCA PARA DETALLES
        </div>
      )}

      {/* ── HEADER ── */}
      <div style={{width:"100%",maxWidth:"880px",marginBottom:"7px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"6px"}}>
          <div>
            <div style={{fontSize:"8px",letterSpacing:"5px",color:ac,animation:"blink 1s steps(1) infinite"}}>
              ⬤ TIEMPO REAL {aiLoading?"• 🔄 ACTUALIZANDO AI...":"• 🔊 VOZ ACTIVA"} {lastAiUpdate?`• AI ${lastAiUpdate.toLocaleTimeString("es-MX")}`:""}
            </div>
            <h1 style={{fontSize:"clamp(10px,1.8vw,17px)",fontWeight:"900",letterSpacing:"2px",color:"#fff",margin:"2px 0 0",textShadow:`0 0 22px ${ac}`}}>{TITLES[mode]}</h1>
            <div style={{fontSize:"7.5px",color:"#222",letterSpacing:"1.5px",marginTop:"1px"}}>
              {today} • {nowTime} • USGS {quakes.length>0?`${quakes.length} sismos`:"sin sismos"}  • NOAA {hurricanes.length>0?`${hurricanes.length} huracanes activos`:"sin huracanes activos"}
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"5px",alignItems:"flex-end"}}>
            <button onClick={cycleMode}
              style={{padding:"7px 13px",background:"transparent",border:`1px solid ${ac}`,borderRadius:"3px",color:ac,fontFamily:"'Courier New',monospace",fontSize:"10px",letterSpacing:"2px",cursor:"pointer",fontWeight:"bold",boxShadow:`0 0 10px ${ac}30`,whiteSpace:"nowrap"}}
              onMouseEnter={e=>e.currentTarget.style.boxShadow=`0 0 22px ${ac}90`}
              onMouseLeave={e=>e.currentTarget.style.boxShadow=`0 0 10px ${ac}30`}>
              {NEXT[mode]} →
            </button>
            <button onClick={()=>{fetchQuakes();fetchHurricanes();fetchAiNews();}}
              style={{padding:"4px 10px",background:"transparent",border:`1px solid ${ac}30`,borderRadius:"3px",color:`${ac}80`,fontFamily:"'Courier New',monospace",fontSize:"8px",letterSpacing:"2px",cursor:"pointer"}}>
              ⟳ ACTUALIZAR
            </button>
            <div style={{display:"flex",gap:"5px"}}>
              {MODES.map(m=><div key={m} style={{width:"6px",height:"6px",borderRadius:"50%",background:m===mode?ACC[m]:"#1a1a1a",boxShadow:m===mode?`0 0 6px ${ACC[m]}`:"none",transition:"all 0.3s"}}/>)}
            </div>
          </div>
        </div>
        {/* AI Update Banner */}
        {aiNews?.war_headline&&mode==="war"&&(
          <div style={{marginTop:"5px",padding:"4px 10px",background:"#0a0810",border:`1px solid ${ac}22`,borderRadius:"3px",fontSize:"8px",color:ac,letterSpacing:"1px"}}>
            🤖 AI LIVE: {aiNews.war_headline}
          </div>
        )}
        {aiNews?.headline&&mode==="news"&&(
          <div style={{marginTop:"5px",padding:"4px 10px",background:"#0a0808",border:`1px solid ${ac}22`,borderRadius:"3px",fontSize:"8px",color:ac,letterSpacing:"1px"}}>
            🤖 AI LIVE: {aiNews.headline}
          </div>
        )}
      </div>

      {/* ── MAP ── */}
      <div style={{width:"100%",maxWidth:"880px",position:"relative",border:`1px solid ${ac}14`,borderRadius:"6px",overflow:"hidden",boxShadow:`0 0 50px ${ac}12,0 0 80px rgba(0,0,0,0.96)`,background:"#020610"}}>
        {!geo&&(
          <div style={{height:"380px",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"12px"}}>
            <div style={{fontSize:"22px",animation:"spin 1.5s linear infinite"}}>🌍</div>
            <div style={{fontSize:"9px",color:ac,letterSpacing:"4px",animation:"blink 1s steps(1) infinite"}}>CARGANDO MAPA MUNDIAL...</div>
          </div>
        )}
        {geo&&(
          <svg viewBox={`0 0 ${W} ${H}`} style={{display:"block",width:"100%"}}>
            <rect width={W} height={H} fill="#020814"/>
            {geo.sphere&&<path d={geo.sphere} fill="#020a14" stroke={ac} strokeWidth="0.3" strokeOpacity="0.12"/>}
            {geo.paths.map(({id,d})=>{
              const col=isoM[id];
              return(
                <path key={id} d={d} fill={col?col+"1c":"#080e08"} stroke={col?col:"#0c1c0c"} strokeWidth={col?0.55:0.18} strokeOpacity={col?0.48:1}
                  onMouseEnter={()=>playHov(id)} style={{cursor:"default",transition:"fill 0.1s"}}
                  onMouseOver={e=>{if(col)e.target.setAttribute("fill",col+"36");}} onMouseOut={e=>{e.target.setAttribute("fill",col?col+"1c":"#080e08");}}/>
              );
            })}
            {geo.borders&&<path d={geo.borders} fill="none" stroke="#0c1e0c" strokeWidth="0.18"/>}

            {/* Connection lines */}
            {connLines.map(l=>(
              <g key={l.key}>
                <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={l.col} strokeWidth="1.2" strokeOpacity="0.07"/>
                <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={l.col} strokeWidth="0.6" strokeOpacity="0.38" strokeDasharray="4,4">
                  <animate attributeName="stroke-dashoffset" from="0" to="-16" dur="0.8s" repeatCount="indefinite"/>
                </line>
              </g>
            ))}

            {/* ── CARRIERS — war mode ── */}
            {mode==="war"&&CARRIERS.map(c=>{
              const p=xy(c.lat,c.lng);if(!p)return null;
              const[cx,cy]=p,cc=c.c||"#4488ff";
              return(
                <g key={c.id} onClick={()=>doPoint({id:c.id,name:c.name+"\n⚓",lat:c.lat,lng:c.lng,c:cc,s:5,st:"activo",det:c.det})} style={{cursor:"pointer"}}>
                  <ellipse cx={cx} cy={cy} rx={16} ry={4} fill="none" stroke={cc} strokeWidth="0.4" strokeOpacity="0.2" transform={`rotate(-22,${cx},${cy})`}>
                    <animate attributeName="rx" values="16;22;16" dur="3s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.2;0.07;0.2" dur="3s" repeatCount="indefinite"/>
                  </ellipse>
                  <g style={{filter:`drop-shadow(0 0 4px ${cc})`}}>
                    <rect x={cx-10} y={cy-1.8} width={20} height={4} fill={cc} rx="2.2" opacity="0.92"/>
                    <rect x={cx-6} y={cy-4.2} width={10} height={2.4} fill={cc} rx="0.8" opacity="0.88"/>
                    <rect x={cx+2} y={cy-6.8} width={4} height={3} fill="#66aaff" rx="0.8" opacity="0.9"/>
                  </g>
                  {c.name.split("\n").map((ln,li)=>(
                    <text key={li} x={cx} y={cy-9-(c.name.split("\n").length-1-li)*8} textAnchor="middle" fill={cc} fontSize="5.5" fontFamily="'Courier New',monospace" fontWeight="bold" style={{pointerEvents:"none",filter:`drop-shadow(0 0 2px ${cc})`}}>{ln}</text>
                  ))}
                </g>
              );
            })}

            {/* ── HURRICANES — climate mode — NOAA live ── */}
            {mode==="climate"&&hurricanes.map(h=>{
              const track=hurTracks[h.id]||[];
              const pos=hurPos[h.id]||{lat:h.lat,lng:h.lng};
              const ph=xy(pos.lat,pos.lng);if(!ph)return null;
              const[hx,hy]=ph,hc=hurCol(h.kts);
              return(
                <g key={`h-${h.id}`}>
                  {track.slice(0,-1).map((tp,i)=>{
                    const nxt=track[i+1];if(!nxt)return null;
                    const a=xy(tp.lat,tp.lng),b=xy(nxt.lat,nxt.lng);if(!a||!b)return null;
                    return<line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={hc} strokeWidth="0.6" strokeOpacity={(i+1)/track.length*0.45} strokeDasharray="3,3"/>;
                  })}
                  {[0,1,2].map(i=>(
                    <circle key={i} cx={hx} cy={hy} r={7} fill="none" stroke={hc} strokeWidth="0.7" opacity="0">
                      <animate attributeName="r" from="7" to={7+i*13} dur={`${1.5+i*0.5}s`} begin={`${i*0.4}s`} repeatCount="indefinite"/>
                      <animate attributeName="opacity" from="0.7" to="0" dur={`${1.5+i*0.5}s`} begin={`${i*0.4}s`} repeatCount="indefinite"/>
                    </circle>
                  ))}
                  <circle cx={hx} cy={hy} r="6" fill={hc} opacity="0.2"/>
                  <circle cx={hx} cy={hy} r="4.5" fill={hc} opacity="0.75" style={{filter:`drop-shadow(0 0 6px ${hc})`}}/>
                  <g>
                    <animateTransform attributeName="transform" type="rotate" from={`0 ${hx} ${hy}`} to={`360 ${hx} ${hy}`} dur="3.5s" repeatCount="indefinite"/>
                    {[0,90,180,270].map(a=>{const rad=(a*Math.PI)/180;return<line key={a} x1={hx+Math.cos(rad)*3} y1={hy+Math.sin(rad)*3} x2={hx+Math.cos(rad)*7.5} y2={hy+Math.sin(rad)*7.5} stroke={hc} strokeWidth="1.4" strokeLinecap="round" opacity="0.85"/>;})}</g>
                  <text x={hx} y={hy-11} textAnchor="middle" fill={hc} fontSize="6.5" fontFamily="'Courier New',monospace" fontWeight="bold" style={{pointerEvents:"none",filter:`drop-shadow(0 0 2px ${hc})`}}>{h.name}</text>
                  <text x={hx+11} y={hy-2} textAnchor="start" fill={hc} fontSize="5.5" fontFamily="'Courier New',monospace" style={{pointerEvents:"none"}}>{hurCat(h.kts)}</text>
                  <circle cx={hx} cy={hy} r="14" fill="transparent" style={{cursor:"pointer"}}
                    onClick={()=>doPoint({id:`hur_${h.id}`,name:`HURACÁN\n${h.name}`,lat:pos.lat,lng:pos.lng,c:hc,s:5,st:"extremo",icon:"🌀",det:`Huracán ${h.name} — ${hurCat(h.kts)}. Vientos: ${Math.round(h.kts*1.852)} km/h. Posición actual: ${pos.lat?.toFixed(2)}° lat, ${pos.lng?.toFixed(2)}° lng. Movimiento a ${h.dir}° a ${h.spd} nudos. Fuente: NOAA NHC en tiempo real. Posición animada cada 30 segundos.`})}/>
                </g>
              );
            })}
            {mode==="climate"&&hurricanes.length===0&&(
              <text x={W/2} y={H-15} textAnchor="middle" fill="#2a1a3a" fontSize="8" fontFamily="'Courier New',monospace">🌀 NOAA: SIN HURACANES ACTIVOS EN ESTE MOMENTO</text>
            )}

            {/* ── MAIN POINTS ── */}
            {pts.filter(pt=>pt.lat&&pt.lng).map(pt=>{
              const p=xy(pt.lat,pt.lng);if(!p)return null;
              const[px,py]=p;
              const isSel=sel?.id===pt.id,isPing=ping===pt.id,r=isSel?9:6.5;
              const ptc=pt.c||"#ff4400";
              return(
                <g key={pt.id} onClick={()=>doPoint(pt)} style={{cursor:"pointer"}}>
                  {pt.pulse&&[0,1,2].map(i=>(
                    <circle key={i} cx={px} cy={py} r={r} fill="none" stroke={ptc} strokeWidth="0.65" opacity="0">
                      <animate attributeName="r" from={r} to={r+26} dur={`${1.8+i*0.6}s`} begin={`${i*0.5}s`} repeatCount="indefinite"/>
                      <animate attributeName="opacity" from="0.55" to="0" dur={`${1.8+i*0.6}s`} begin={`${i*0.5}s`} repeatCount="indefinite"/>
                    </circle>
                  ))}
                  {isPing&&(<circle cx={px} cy={py} r={r} fill="none" stroke="#fff" strokeWidth="2" opacity="0.9"><animate attributeName="r" from={r} to={r+22} dur="0.6s"/><animate attributeName="opacity" from="0.9" to="0" dur="0.6s"/></circle>)}
                  {isSel&&(<circle cx={px} cy={py} r={r+5} fill="none" stroke={ptc} strokeWidth="1.1" strokeDasharray="3,3" opacity="0.85"><animateTransform attributeName="transform" type="rotate" from={`0 ${px} ${py}`} to={`360 ${px} ${py}`} dur="4s" repeatCount="indefinite"/></circle>)}
                  <circle cx={px} cy={py} r={r} fill={ptc} style={{filter:`drop-shadow(0 0 ${isSel?13:6}px ${ptc})`}}/>
                  <circle cx={px} cy={py} r={r*0.36} fill="rgba(255,255,255,0.55)"/>
                  {pt.icon&&<text x={px} y={py+2.5} textAnchor="middle" fontSize="5.5" style={{pointerEvents:"none"}}>{pt.icon}</text>}
                  {pt.name.split("\n").map((ln,li)=>(
                    <text key={li} x={px} y={py-r-2.5-(pt.name.split("\n").length-1-li)*8}
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
          CURSOR → MÚSICA • TOCA PUNTOS → DETALLES + 🔊 VOZ • BANNERS → ALERTAS EN TIEMPO REAL
        </div>
      </div>

      {/* ── INFO PANEL ── */}
      {sel&&(
        <div style={{marginTop:"9px",padding:"12px 15px",background:bg,border:`1px solid ${sel.c||"#ff4400"}`,borderRadius:"4px",width:"100%",maxWidth:"880px",boxShadow:`0 0 28px ${(sel.c||"#ff4400")}28`,animation:"slideIn 0.2s ease"}}>
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
            {sel.det||sel.detail||"Cargando información..."}
          </div>
        </div>
      )}

      {/* ── STATS ── */}
      <div style={{marginTop:"10px",display:"flex",gap:"6px",flexWrap:"wrap",justifyContent:"center",width:"100%",maxWidth:"880px"}}>
        {sts.map((st,i)=>(
          <button key={st.l} onClick={e=>doStat(st,e,i)}
            style={{position:"relative",overflow:"hidden",background:bg,border:`1px solid ${st.c}25`,borderRadius:"4px",padding:"8px 10px",textAlign:"center",minWidth:"95px",cursor:"pointer",fontFamily:"'Courier New',monospace",transition:"all 0.15s"}}
            onMouseEnter={e=>{e.currentTarget.style.border=`1px solid ${st.c}`;e.currentTarget.style.boxShadow=`0 0 14px ${st.c}42,inset 0 0 7px ${st.c}10`;e.currentTarget.style.transform="translateY(-3px)";}}
            onMouseLeave={e=>{e.currentTarget.style.border=`1px solid ${st.c}25`;e.currentTarget.style.boxShadow="none";e.currentTarget.style.transform="translateY(0)";}}
            onMouseDown={e=>e.currentTarget.style.transform="scale(0.9)"}
            onMouseUp={e=>e.currentTarget.style.transform="translateY(-3px)"}>
            {(ripples[i]||[]).map(rp=>(
              <div key={rp.id} style={{position:"absolute",left:rp.x-50,top:rp.y-50,width:"100px",height:"100px",borderRadius:"50%",background:`radial-gradient(circle,${rp.c}55 0%,transparent 70%)`,animation:"rippleOut 0.9s ease-out forwards",pointerEvents:"none"}}/>
            ))}
            <div style={{fontSize:"14px",fontWeight:"900",color:st.c,textShadow:`0 0 7px ${st.c}55`,position:"relative"}}>{st.v}</div>
            <div style={{fontSize:"6.5px",color:"#2d2d2d",letterSpacing:"1.5px",marginTop:"2px",position:"relative"}}>{st.l}</div>
          </button>
        ))}
      </div>

      {/* ── LIVE STRIPS ── */}
      {mode==="climate"&&Object.keys(wlive).length>0&&(
        <div style={{marginTop:"7px",width:"100%",maxWidth:"880px",background:"#020a08",border:"1px solid #00ff8820",borderRadius:"4px",padding:"6px 12px",display:"flex",gap:"12px",flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontSize:"8px",color:"#00ff88",letterSpacing:"3px",fontWeight:"bold"}}>📡 Open-Meteo LIVE</span>
          {wlive.india&&<span style={{fontSize:"8.5px",color:"#ff4400"}}>🔥 INDIA {wlive.india.temperature_2m}°C | {wlive.india.wind_speed_10m}km/h</span>}
          {wlive.spain&&<span style={{fontSize:"8.5px",color:"#ff6600"}}>🌡 ESPAÑA {wlive.spain.temperature_2m}°C | {wlive.spain.precipitation}mm</span>}
          {wlive.aus&&<span style={{fontSize:"8.5px",color:"#ff3300"}}>🔥 AUSTRALIA {wlive.aus.temperature_2m}°C | {wlive.aus.wind_speed_10m}km/h</span>}
          {wlive.mexico&&<span style={{fontSize:"8.5px",color:"#8844ff"}}>🌀 MÉXICO {wlive.mexico.temperature_2m}°C | {wlive.mexico.wind_speed_10m}km/h</span>}
          {wlive.iran&&<span style={{fontSize:"8.5px",color:"#ff2020"}}>🔴 IRÁN {wlive.iran.temperature_2m}°C</span>}
        </div>
      )}

      {mode==="climate"&&(
        <div style={{marginTop:"6px",width:"100%",maxWidth:"880px",display:"flex",gap:"6px",flexWrap:"wrap"}}>
          {hurricanes.length>0&&(
            <div style={{flex:1,background:"#08020a",border:"1px solid #8844ff20",borderRadius:"4px",padding:"6px 12px",display:"flex",gap:"10px",flexWrap:"wrap",alignItems:"center"}}>
              <span style={{fontSize:"8px",color:"#8844ff",letterSpacing:"2px",fontWeight:"bold"}}>🌀 NOAA LIVE</span>
              {hurricanes.map(h=>{const p=hurPos[h.id]||{lat:h.lat,lng:h.lng};const hc=hurCol(h.kts);return<span key={h.id} style={{fontSize:"8px",color:hc}}>{h.name}: {hurCat(h.kts)} | {Math.round(h.kts*1.852)}km/h | {p.lat?.toFixed(1)}°{p.lat>=0?"N":"S"}</span>;})}
            </div>
          )}
          {quakes.length>0&&(
            <div style={{flex:1,background:"#0a0800",border:"1px solid #ffaa0020",borderRadius:"4px",padding:"6px 12px",display:"flex",gap:"10px",flexWrap:"wrap",alignItems:"center"}}>
              <span style={{fontSize:"8px",color:"#ffaa00",letterSpacing:"2px",fontWeight:"bold"}}>🌋 USGS LIVE — {quakes.length} sismos M5+</span>
              {quakes.slice(0,3).map(q=><span key={q.id} style={{fontSize:"8px",color:magCol(q.mag)}}>M{q.mag.toFixed(1)} {q.place.split(",")[0]} {q.tsunami?"🌊":""}</span>)}
            </div>
          )}
        </div>
      )}

      {mode==="news"&&(
        <div style={{marginTop:"7px",width:"100%",maxWidth:"880px",background:"#080804",border:"1px solid #ffcc0020",borderRadius:"4px",padding:"6px 12px",overflow:"hidden"}}>
          <div style={{fontSize:"8.5px",color:"#ffcc00",letterSpacing:"1.5px",whiteSpace:"nowrap",animation:"ticker 35s linear infinite"}}>
            🛢️ PETRÓLEO $91/barril +31% semana &nbsp;•&nbsp; 📉 NASDAQ -6.2% &nbsp;•&nbsp; 🗳️ CDU gana Alemania 29% — AfD 20% histórico &nbsp;•&nbsp; ₿ Bitcoin $62K &nbsp;•&nbsp; 🥇 ORO $3,200 récord &nbsp;•&nbsp; 🌐 BRICS propone alternativa al dólar &nbsp;•&nbsp; 🛡️ OTAN cumbre 12 marzo &nbsp;•&nbsp; 📊 FMI: recesión global posible &nbsp;•&nbsp; 🇫🇷 Le Pen lidera Francia 34% &nbsp;•&nbsp; 📊 Trump: aranceles 25% a Europa el 15 marzo &nbsp;•&nbsp; 🇮🇷 Mojtaba Jamenei nuevo líder iraní — Trump lo rechaza &nbsp;•&nbsp; 🚢 Maersk suspende operaciones Medio Oriente
          </div>
        </div>
      )}

      <div style={{marginTop:"7px",fontSize:"7.5px",color:"#141414",letterSpacing:"2px",textAlign:"center"}}>
        USGS SISMOS + NOAA HURACANES + Open-Meteo CLIMA + Claude AI NOTICIAS — TODO EN TIEMPO REAL
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
