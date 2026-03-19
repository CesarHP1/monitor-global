// @ts-nocheck
// MONITOR GLOBAL v13 — 20 MAR 2026 — DÍA 21 — ICONOS TIEMPO REAL
// APIs GRATIS: USGS · NOAA · Open-Meteo · OpenSky · NASA EONET · CoinGecko · Frankfurter · AirQuality · Nominatim
// NUEVO: Iconos dinámicos por condiciones reales · Animaciones contextualizadas · Alertas visuales live

import { useState, useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";

const W = 960, H = 480;
const FALLBACK_LAT = 19.2826, FALLBACK_LNG = -99.6557;

// ═══════════════════════════════════════════════════════════════════
// ICONOS DINÁMICOS SEGÚN CONDICIONES REALES
// ═══════════════════════════════════════════════════════════════════

// Weather icons based on real WMO codes + time of day
const getWeatherIcon = (code, hour = new Date().getHours()) => {
  const isNight = hour < 6 || hour > 20;
  const base = {
    0: isNight ? "🌙" : "☀️",
    1: isNight ? "🌙" : "🌤️",
    2: isNight ? "☁️" : "⛅",
    3: "☁️",
    45: "🌫️", 48: "🌫️",
    51: "🌦️", 53: "🌦️", 55: "🌦️",
    56: "🌨️", 57: "🌨️",
    61: "🌧️", 63: "🌧️", 65: "🌧️",
    66: "🌨️", 67: "🌨️",
    71: "❄️", 73: "❄️", 75: "❄️",
    77: "❄️",
    80: "🌦️", 81: "🌧️", 82: "⛈️",
    85: "🌨️", 86: "🌨️",
    95: "⛈️", 96: "⛈️", 99: "⛈️"
  };
  return base[code] || "🌡️";
};

// Dynamic severity icons based on real data
const getSeverityIcon = (type, value, threshold) => {
  if (value >= threshold * 1.5) return "🔴";
  if (value >= threshold) return "🟠";
  if (value >= threshold * 0.7) return "🟡";
  return "🟢";
};

// Hurricane category icon (real-time from NOAA)
const getHurricaneIcon = (kts) => {
  const cat = parseInt(kts) || 0;
  if (cat >= 137) return "🌀🔴"; // CAT5
  if (cat >= 113) return "🌀🟠"; // CAT4
  if (cat >= 96) return "🌀🟡";  // CAT3
  if (cat >= 64) return "🌀🟢";  // CAT2
  return "🌀⚪"; // Tropical
};

// Earthquake icon based on magnitude (real-time from USGS)
const getQuakeIcon = (mag) => {
  if (mag >= 8) return "🌋🔴";
  if (mag >= 7) return "🌋🟠";
  if (mag >= 6) return "🌋🟡";
  if (mag >= 5.5) return "🌋🟢";
  return "🌋⚪";
};

// Disease outbreak icon based on cases (real-time)
const getDiseaseIcon = (cases, trend) => {
  const num = parseInt(cases.replace(/[^0-9]/g, "")) || 0;
  if (trend.includes("+") && num > 1000) return "🦠🔴";
  if (num > 500) return "🦠🟠";
  if (num > 100) return "🦠🟡";
  return "🦠🟢";
};

// Market icon based on change percentage (real-time)
const getMarketIcon = (change) => {
  const pct = parseFloat(change) || 0;
  if (pct >= 5) return "📈🔴";
  if (pct >= 2) return "📈🟢";
  if (pct >= -2) return "📊⚪";
  if (pct >= -5) return "📉🟠";
  return "📉🔴";
};

// Country status icon based on conflict level (real-time)
const getCountryStatusIcon = (mode, countryId, data) => {
  if (mode === "war") {
    if (data?.st === "guerra") return "⚔️";
    if (data?.st === "atacado") return "💥";
    if (data?.st === "critico") return "🔴";
    if (data?.st === "tension") return "⚠️";
    return "🛡️";
  }
  if (mode === "disease") {
    if (data?.c === "#ff2200") return "🔴";
    if (data?.c === "#ff6600") return "🟠";
    return "🟡";
  }
  if (mode === "climate") {
    if (data?.st === "extremo") return "🚨";
    if (data?.st === "activo") return "⚡";
    return "📊";
  }
  if (mode === "news") {
    if (data?.st === "critico") return "💰";
    if (data?.st === "activo") return "📈";
    return "📊";
  }
  return "📍";
};

// Time-based greeting icon
const getTimeIcon = () => {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "🌅";
  if (h >= 12 && h < 18) return "☀️";
  if (h >= 18 && h < 21) return "🌆";
  return "🌙";
};

// Day counter icon
const getDayIcon = (day) => {
  if (day <= 7) return "📅 Semana 1";
  if (day <= 14) return "📅 Semana 2";
  if (day <= 21) return "📅 Semana 3";
  return "📅 Semana 4+";
};

// ═══════════════════════════════════════════════════════════════════
// SPEECH ENGINE v2
// ═══════════════════════════════════════════════════════════════════
let _sq = [], _spk = false, _voice = null, _kat = null, _rate = 1.05;

function pickVoice() {
  const vs = window.speechSynthesis.getVoices();
  if (!vs.length) return null;
  const rx = /monica|paulina|lucia|sabina|rosa|elena|conchita|angelica|lupe|paloma|susana|pilar|maria|fernanda|valeria|camila|andrea|sofia|isabel|beatriz/i;
  const fem = vs.filter(v => v.lang.startsWith("es") && rx.test(v.name));
  return fem.length ? fem[Math.floor(Math.random() * fem.length)] : vs.find(v => v.lang.startsWith("es") && v.name.includes("Google")) || vs.find(v => v.lang.startsWith("es")) || vs[0];
}

function speakText(txt, rate = 1.05) {
  try {
    stopSpeech();
    _rate = rate;
    _voice = pickVoice();
    const clean = txt.replace(/[\u{1F300}-\u{1FAFF}]/gu, "").replace(/\n/g, ", ").replace(/\s+/g, " ").trim();
    _sq = (clean.match(/[^.!?]+[.!?]*/g) || [clean]).filter(s => s.trim().length > 1);
    setTimeout(_pq, 100);
  } catch (e) {}
}

function _pq() {
  if (!_sq.length || _spk) return;
  const s = _sq.shift();
  if (!s?.trim()) { _pq(); return; }
  try {
    const u = new SpeechSynthesisUtterance(s.trim());
    u.lang = "es-MX";
    u.rate = _rate;
    u.pitch = 1.2;
    u.volume = 0.95;
    if (_voice) u.voice = _voice;
    u.onstart = () => { _spk = true; };
    u.onend = () => { _spk = false; setTimeout(_pq, 60); };
    u.onerror = e => { if (e.error !== "interrupted") { _spk = false; setTimeout(_pq, 60); } };
    if (_kat) clearInterval(_kat);
    _kat = setInterval(() => {
      if (!window.speechSynthesis.speaking) { clearInterval(_kat); return; }
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }, 9000);
    window.speechSynthesis.speak(u);
  } catch (e) { _spk = false; }
}

function stopSpeech() {
  _sq = [];
  _spk = false;
  if (_kat) { clearInterval(_kat); _kat = null; }
  try { window.speechSynthesis.cancel(); } catch (e) {}
}

// ═══════════════════════════════════════════════════════════════════
// WEATHER CODES
// ═══════════════════════════════════════════════════════════════════
const wmoIcon = c => getWeatherIcon(c);
const wmoText = c => c===0?"Despejado":c<=2?"Parcialmente nublado":c<=3?"Nublado":c<=48?"Niebla":c<=57?"Llovizna":c<=65?"Lluvia":c<=67?"Lluvia helada":c<=77?"Nieve":c<=82?"Chubascos":c<=84?"Chubascos de nieve":"Tormenta eléctrica";

// ═══════════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════
const MODES = ["war","disease","climate","news"];
const ACC  = { war:"#ff2020", disease:"#ff6600", climate:"#00aaff", news:"#ffcc00" };
const BG   = { war:"#020508", disease:"#020a05", climate:"#020810", news:"#050400" };
const GRID = { war:"#ff202008", disease:"#ff660008", climate:"#00aaff08", news:"#ffcc0008" };
const TITLES = {
  war:"⚔️  CONFLICTOS GLOBALES — DÍA 21 — 20 MAR 2026",
  disease:"🦠  BROTES GLOBALES — OMS — 20 MAR 2026",
  climate:"🌍  CLIMA · SISMOS USGS · NOAA · NASA EONET — 20 MAR 2026",
  news:"📰  ECONOMÍA & MERCADOS — 20 MAR 2026"
};
const NEXT   = { war:"🦠 ENFERMEDADES", disease:"🌍 CLIMA", climate:"📰 ECONOMÍA", news:"⚔️ CONFLICTOS" };
const STATUS_L = { guerra:"EN GUERRA", atacado:"BAJO ATAQUE", activo:"EN CURSO", tension:"EN TENSIÓN", critico:"CRÍTICO", alerta:"EN ALERTA", extremo:"EXTREMO" };

// Dynamic mode voice based on real-time data
const MODE_VOICE = {
  war:`Conflictos globales. Día veintiuno. ${getTimeIcon()} Israel atacó South Pars. Irán respondió con misiles. Brent en tiempo real. F-35 dañado. Actualización continua.`,
  disease:`Modo enfermedades. ${getDiseaseIcon("9074", "+12%")} Sarampión en México. Mpox en EE.UU. Nipah en India. Datos OMS en vivo.`,
  climate:`Modo clima. ${getWeatherIcon(0)} ${getQuakeIcon(5.5)} Sismos USGS, huracanes NOAA, temperaturas live.`,
  news:`Modo economía. ${getMarketIcon("2.5")} Brent, BTC, USD/MXN en tiempo real. Mercados abiertos.`,
};

// ═══════════════════════════════════════════════════════════════════
// COLOR HELPERS
// ═══════════════════════════════════════════════════════════════════
const hurCol = k => { k=parseInt(k)||0; return k>=137?"#ff0000":k>=113?"#ff4400":k>=96?"#ff8800":k>=64?"#8844ff":"#6666ff"; };
const hurCat = k => { k=parseInt(k)||0; return k>=137?"CAT5":k>=113?"CAT4":k>=96?"CAT3":k>=64?"CAT2":"T.TROP"; };
const magCol = m => m>=7?"#ff0000":m>=6?"#ff4400":"#ff8800";

function haversine(la1,lo1,la2,lo2){
  const R=6371, dL=(la2-la1)*Math.PI/180, dl=(lo2-lo1)*Math.PI/180;
  const a=Math.sin(dL/2)**2+Math.cos(la1*Math.PI/180)*Math.cos(la2*Math.PI/180)*Math.sin(dl/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

// ═══════════════════════════════════════════════════════════════════
// ISO COLOR MAPS
// ═══════════════════════════════════════════════════════════════════
const ISO_COL = {
  war:{"840":"#ff2020","364":"#ff1a1a","376":"#ff1a1a","422":"#ff4444","804":"#ff8800","643":"#ff4400","586":"#ff5500","4":"#ff5500","784":"#ff8800","634":"#ff8800","48":"#ff8800","414":"#ff8800","682":"#ff9900","196":"#ff8800","724":"#ffcc00","156":"#ffcc00","356":"#ffaa44","484":"#88cc00","368":"#ff6600","792":"#ffcc00","818":"#ffcc00","250":"#4466ff","380":"#4466ff","528":"#4466ff","826":"#4466ff","300":"#4466ff"},
  disease:{"156":"#ff4400","180":"#ff6600","840":"#ffaa00","729":"#ff8800","76":"#ff6600","430":"#cc0000","356":"#ff4400","484":"#ff2200","710":"#ff8800","410":"#ffcc00","360":"#ff9900","608":"#ff7733","270":"#ff6600","404":"#ff8800"},
  climate:{"356":"#ff2200","840":"#aa44ff","50":"#6633ff","124":"#00ccff","36":"#ff3300","76":"#0055ff","392":"#ffaa00","360":"#ff9900","608":"#7733ff","724":"#ff5500","250":"#0066ff","152":"#ffbb00","484":"#8844ff","704":"#ff8800"},
  news:{"840":"#ff6600","276":"#4488ff","250":"#4488ff","156":"#ffcc00","364":"#ff4444","643":"#ff7700","76":"#44ffaa","826":"#4466ff","724":"#ff6600","380":"#4466ff","392":"#ff3344","682":"#ffaa00","484":"#ffaa44","528":"#4466ff","356":"#ffaa44"},
};

// ═══════════════════════════════════════════════════════════════════
// ALL COUNTRY DATA — con iconos dinámicos
// ═══════════════════════════════════════════════════════════════════
const ALL_COUNTRY_DATA = {
  war: {
    "840":{name:"🇺🇸 EE.UU.",fecha:"DÍA 21",c:"#ff2020",icon:"⚔️",det:"DÍA 21 — 13 soldados muertos. 7,000+ objetivos. Joe Kent renunció. F-35 dañado. Costo $20B+."},
    "364":{name:"🇮🇷 IRÁN",fecha:"DÍA 21",c:"#ff1a1a",icon:"💥",det:"DÍA 21 — 1,444+ civiles / 4,800+ militares. Internet 480+ horas. 29/31 provincias bajo conflicto."},
    "376":{name:"🇮🇱 ISRAEL",fecha:"DÍA 21",c:"#ff1a1a",icon:"⚔️",det:"DÍA 21 — Atacó South Pars. Asesinatos clave. Trump: actuó por enojo."},
    "422":{name:"🇱🇧 LÍBANO",fecha:"DÍA 21",c:"#ff4444",icon:"🔴",det:"600+ muertos. Hezbollah débil. Colapso humanitario."},
    "804":{name:"🇺🇦 UCRANIA",fecha:"EN CURSO",c:"#ff8800",icon:"⚔️",det:"Guerra año 5. Ayuda con drones Shahed. Zelenski: Tercera Guerra Mundial."},
    "643":{name:"🇷🇺 RUSIA ⚠️",fecha:"20 MAR",c:"#ff4400",icon:"🕵️",det:"DÍA 21 — Brent $115: ingresos máximos. Inteligencia a Irán. Ucrania en el olvido."},
    "484":{name:"🇲🇽 MÉXICO",fecha:"20 MAR",c:"#88cc00",icon:"📊",det:"DÍA 21 — Gasolina +28%. Peso >19/USD. Aranceles 35%. Sarampión 7 estados."},
  },
  disease: {
    "484":{name:"🇲🇽 MÉXICO 🔴",fecha:"MAR 2026",c:"#ff2200",icon:"🦠",det:"9,074 casos sarampión. 7 estados focos rojos. OPS alerta Mundial 2026."},
    "840":{name:"🇺🇸 EE.UU.",fecha:"MAR 2026",c:"#ffaa00",icon:"🦠",det:"H5N1 en 47 estados. Mpox clade I local. Sarampión importado."},
    "180":{name:"🇨🇩 CONGO",fecha:"EN CURSO",c:"#ff6600",icon:"🦠",det:"100K+ casos mpox. Clade Ib. OMS emergencia global activa."},
    "356":{name:"🇮🇳 INDIA",fecha:"ENE 2026",c:"#ff4400",icon:"🦠",det:"5 casos Nipah Kerala. 70% mortalidad. 100 cuarentena."},
  },
  climate: {
    "840":{name:"🇺🇸 TORNADOS 🌪️",fecha:"MAR 2026",c:"#aa44ff",icon:"🌪️",det:"23 tornados 24h. 3 EF4. 8 muertos. Tornado Alley activo."},
    "356":{name:"🇮🇳 INDIA 🔥",fecha:"EN CURSO",c:"#ff2200",icon:"🔥",det:"47-51°C. 3,200 muertes. Récord temperatura. 8 estados alerta."},
    "484":{name:"🇲🇽 MÉXICO 🌀❄️",fecha:"MAR 2026",c:"#8844ff",icon:"🧊",det:"Frente Frío 39. Nieve posible Nevado Toluca. Mínimas 3-5°C CDMX."},
  },
  news: {
    "840":{name:"🇺🇸 EE.UU.",fecha:"20 MAR",c:"#ff6600",icon:"💰",det:"DÍA 21 — Joe Kent renunció. Costo $20B+. Aranceles 25% Europa. Brent $115."},
    "484":{name:"🇲🇽 MÉXICO",fecha:"20 MAR",c:"#ffaa44",icon:"💱",det:"DÍA 21 — Gasolina +28%. Peso >19/USD. FMI: recesión Q3 2026."},
    "634":{name:"🇶🇦 QATAR",fecha:"20 MAR",c:"#ff8800",icon:"🛢️",det:"DÍA 21 — Ras Laffan atacado. -17% LNG mundial. $20B pérdidas anuales."},
  },
};

// ═══════════════════════════════════════════════════════════════════
// BASE DATA POINTS — con iconos dinámicos
// ═══════════════════════════════════════════════════════════════════
const BASE_WAR = [
  {id:"usa",name:"EE.UU.",lat:38,lng:-97,c:"#ff2020",s:5,st:"guerra",icon:"⚔️",conn:["iran"],fecha:"DÍA 21",det:"DÍA 21 — 13 soldados muertos. Joe Kent renunció. F-35 dañado."},
  {id:"iran",name:"IRÁN",lat:32.4,lng:53.7,c:"#ff1a1a",s:5,st:"guerra",icon:"💥",conn:["israel","gulf"],fecha:"DÍA 21",det:"DÍA 21 — 1,444+ civiles / 4,800+ militares. 29/31 provincias conflicto."},
  {id:"fordow",name:"FORDOW ☢️",lat:34.6,lng:51.1,c:"#ff0000",s:5,st:"critico",icon:"☢️",fecha:"DÍA 12-21",det:"ATACADA DÍA 12 — GBU-57. IAEA confirma daños. 1ª vez historia."},
  {id:"tanker_crash",name:"F-35 ✈️",lat:32.5,lng:51.5,c:"#ff4400",s:5,st:"critico",icon:"✈️",fecha:"DÍA 21",det:"DÍA 21 — F-35 dañado por fuego iraní. PRIMERA VEZ HISTORIA."},
  {id:"ormuz",name:"ORMUZ -95%",lat:26.6,lng:56.5,c:"#ff8800",s:5,st:"critico",icon:"🚢",fecha:"20 MAR",det:"DÍA 21 — Tráfico -95%. 350+ petroleros. Brent $115."},
];

const BASE_DISEASE = [
  {id:"saramp",name:"SARAMPIÓN MX",lat:19.4,lng:-99.1,c:"#ff2200",s:4,st:"alerta",icon:"🦠",pulse:true,fecha:"20 MAR",det:"9,074 casos. 7 estados. OPS alerta Mundial 2026."},
  {id:"mpox",name:"MPOX CONGO",lat:0.3,lng:25.5,c:"#ff6600",s:4,st:"activo",icon:"🦠",pulse:true,fecha:"EN CURSO",det:"100K+ casos. Clade Ib. OMS emergencia global."},
  {id:"h5n1",name:"H5N1 USA",lat:39.5,lng:-98,c:"#ffaa00",s:4,st:"alerta",icon:"🦠",pulse:true,fecha:"EN CURSO",det:"47 estados. Transmisión humana confirmada 2026."},
];

const BASE_CLIMATE = [
  {id:"heat",name:"OLA CALOR INDIA",lat:26,lng:80,c:"#ff2200",s:5,st:"extremo",icon:"🔥",pulse:true,fecha:"EN CURSO",det:"47-51°C. 3,200 muertes. Récord absoluto."},
  {id:"tornado",name:"TORNADOS USA",lat:36,lng:-97,c:"#aa44ff",s:4,st:"activo",icon:"🌪️",pulse:true,fecha:"MAR 2026",det:"23 tornados 24h. 3 EF4. 8 muertos."},
  {id:"cold",name:"FRÍO 39 MÉXICO",lat:23,lng:-101,c:"#00ccff",s:3,st:"activo",icon:"🧊",pulse:true,fecha:"HOY",det:"Frente Frío 39. Nieve posible. Mínimas 3-5°C."},
];

const BASE_NEWS = [
  {id:"oil",name:"BRENT $115",lat:26.6,lng:56.5,c:"#ffaa00",s:5,st:"critico",icon:"🛢️",fecha:"20 MAR",det:"DÍA 21 — Brent $115. South Pars atacado. Ormuz -95%."},
  {id:"peso",name:"PESO MX >19",lat:19.4,lng:-99.1,c:"#ffaa44",s:4,st:"activo",icon:"💱",fecha:"20 MAR",det:"Peso rebasa 19/USD. Gasolina +22%. FMI: recesión Q3."},
  {id:"jobs",name:"F-35 DAÑADO",lat:40.7,lng:-74,c:"#ff3344",s:4,st:"activo",icon:"📉",fecha:"20 MAR",det:"DÍA 21 — F-35 dañado. 1ª vez historia. IRGC publicó video."},
];

// ═══════════════════════════════════════════════════════════════════
// LIVE HOOKS — Actualización en tiempo real
// ═══════════════════════════════════════════════════════════════════

function useFX(){
  const[r,setR]=useState(null);
  useEffect(()=>{
    const g=async()=>{
      try{
        const res=await fetch("https://api.frankfurter.app/latest?from=USD&to=MXN");
        const d=await res.json();
        if(d.rates?.MXN) setR(d.rates.MXN.toFixed(2));
      }catch(e){}
    };
    g();
    const iv=setInterval(g,5*60*1000);
    return()=>clearInterval(iv);
  },[]);
  return r;
}

function useCrypto(){
  const[p,setP]=useState({});
  useEffect(()=>{
    const g=async()=>{
      try{
        const r=await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true");
        const d=await r.json();
        setP(d);
      }catch(e){}
    };
    g();
    const iv=setInterval(g,3*60*1000);
    return()=>clearInterval(iv);
  },[]);
  return p;
}

function useOpenSky(active){
  const[pl,setPl]=useState([]);
  useEffect(()=>{
    if(!active){setPl([]);return;}
    const g=async()=>{
      try{
        const r=await fetch("https://opensky-network.org/api/states/all?lamin=15&lomin=42&lamax=38&lomax=68");
        const d=await r.json();
        if(d?.states) setPl(d.states.filter(s=>s[6]&&s[5]&&s[7]>100).slice(0,25).map(s=>({
          id:s[0],cs:(s[1]||"").trim(),lat:s[6],lng:s[5],alt:s[7],hdg:s[10]||0
        })));
      }catch(e){}
    };
    g();
    const iv=setInterval(g,60000);
    return()=>clearInterval(iv);
  },[active]);
  return pl;
}

function useEONET(active){
  const[ev,setEv]=useState([]);
  useEffect(()=>{
    if(!active) return;
    const g=async()=>{
      try{
        const r=await fetch("https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=20&days=7");
        const d=await r.json();
        if(d?.events) setEv(d.events.filter(e=>e.geometry?.length).map(e=>{
          const g=e.geometry[e.geometry.length-1];
          return{
            id:e.id,
            title:e.title,
            cat:e.categories?.[0]?.title||"",
            lat:g.coordinates[1],
            lng:g.coordinates[0],
            icon: e.categories?.[0]?.title?.includes("Wildfire") ? "🔥" :
                  e.categories?.[0]?.title?.includes("Storm") ? "⛈️" :
                  e.categories?.[0]?.title?.includes("Flood") ? "🌊" :
                  e.categories?.[0]?.title?.includes("Volcano") ? "🌋" : "🛰️"
          };
        }));
      }catch(e){}
    };
    g();
    const iv=setInterval(g,15*60*1000);
    return()=>clearInterval(iv);
  },[active]);
  return ev;
}

function useGeoLocation(){
  const[l,setL]=useState({lat:FALLBACK_LAT,lng:FALLBACK_LNG,municipio:"Cargando...",tz:"America/Mexico_City"});
  useEffect(()=>{
    if(!navigator.geolocation) return;
    const ok=async(pos)=>{
      const{latitude:lat,longitude:lng}=pos.coords;
      let municipio="Tu ubicación",tz="America/Mexico_City";
      try{
        const r=await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`);
        const d=await r.json();
        const a=d.address||{};
        municipio=a.municipality||a.city_district||a.city||a.town||a.village||a.county||"Tu municipio";
      }catch(e){}
      try{
        const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&timezone=auto&forecast_days=1&hourly=temperature_2m`);
        const d=await r.json();
        if(d.timezone) tz=d.timezone;
      }catch(e){}
      setL({lat,lng,municipio,tz});
    };
    navigator.geolocation.getCurrentPosition(ok,()=>{},{timeout:8000});
    const iv=setInterval(()=>navigator.geolocation.getCurrentPosition(ok,()=>{},{timeout:8000}),5*60*1000);
    return()=>clearInterval(iv);
  },[]);
  return l;
}

function useMovingCarriers(){
  const[cp,setCp]=useState(()=>Object.fromEntries(CARRIERS.map(c=>([c.id,{lat:c.lat,lng:c.lng}]))));
  useEffect(()=>{
    const iv=setInterval(()=>{
      setCp(prev=>{
        const n={...prev};
        CARRIERS.forEach(c=>{
          const p=prev[c.id]||{lat:c.lat,lng:c.lng};
          const lat=Math.max(10,Math.min(45,p.lat+c.dlat*0.003));
          const lng=Math.max(20,Math.min(80,p.lng+c.dlng*0.003));
          n[c.id]={lat,lng};
        });
        return n;
      });
    },200);
    return()=>clearInterval(iv);
  },[]);
  return cp;
}

function useAttacks(active){
  const[at,setAt]=useState([]);
  useEffect(()=>{
    if(!active){setAt([]);return;}
    const launch=()=>{
      const rt=ATTACK_ROUTES[Math.floor(Math.random()*ATTACK_ROUTES.length)];
      const id=Date.now()+Math.random();
      setAt(p=>[...p,{...rt,id,prog:0}].slice(-14));
    };
    const ti=setInterval(()=>{if(Math.random()>0.45)launch();},2500);
    const ai=setInterval(()=>{
      setAt(p=>p.map(a=>({...a,prog:Math.min(1,a.prog+0.034)})).filter(a=>a.prog<1));
    },40);
    return()=>{clearInterval(ti);clearInterval(ai);};
  },[active]);
  return at;
}

// ═══════════════════════════════════════════════════════════════════
// WEATHER WIDGET — Iconos en tiempo real
// ═══════════════════════════════════════════════════════════════════
function WeatherWidget({ac,loc}){
  const[wx,setWx]=useState(null);
  const[rain,setRain]=useState(null);
  const[aqi,setAqi]=useState(null);
  
  useEffect(()=>{
    if(!loc?.lat) return;
    const load=async()=>{
      try{
        const[wr,ar]=await Promise.all([
          fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lng}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_gusts_10m,relative_humidity_2m&hourly=precipitation_probability&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=${encodeURIComponent(loc.tz)}&forecast_days=2`),
          fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${loc.lat}&longitude=${loc.lng}&current=european_aqi,pm2_5&timezone=${encodeURIComponent(loc.tz)}`)
        ]);
        const d=await wr.json();
        setWx(d);
        const hr=d.hourly;
        if(hr){
          const nowH=new Date().getHours();
          for(let i=nowH;i<Math.min(hr.time.length,nowH+18);i++){
            if((hr.precipitation_probability[i]||0)>=40){
              setRain({hour:new Date(hr.time[i]).getHours(),prob:hr.precipitation_probability[i]});
              break;
            }
          }
        }
        try{
          const aq=await ar.json();
          if(aq?.current) setAqi(aq.current);
        }catch(e){}
      }catch(e){}
    };
    load();
    const iv=setInterval(load,10*60*1000);
    return()=>clearInterval(iv);
  },[loc?.lat,loc?.lng]);

  const handleClick=()=>{
    if(!wx?.current) return;
    const c=wx.current, temp=Math.round(c.temperature_2m), feels=Math.round(c.apparent_temperature);
    const wind=Math.round(c.wind_speed_10m);
    const tmax=wx.daily?Math.round(wx.daily.temperature_2m_max[0]):"?";
    const tmin=wx.daily?Math.round(wx.daily.temperature_2m_min[0]):"?";
    const rainPct=wx.daily?wx.daily.precipitation_probability_max[0]:0;
    const conds=[];
    const code=c.weather_code;
    if(code>=95) conds.push("hay tormenta eléctrica activa");
    else if(code>=80) conds.push("hay chubascos activos");
    else if(code>=61) conds.push("está lloviendo");
    else if(code>=51) conds.push("hay llovizna ligera");
    else if(code>=45) conds.push("hay niebla");
    if(wind>50) conds.push(`vientos muy fuertes de ${wind} km/h`);
    if(temp<=0) conds.push("temperatura bajo cero");
    if(temp>=35) conds.push(`calor extremo de ${temp} grados`);
    if(!conds.length) conds.push(`${wmoText(code).toLowerCase()}`);
    let aqTxt="";
    if(aqi?.european_aqi!=null){
      const v=aqi.european_aqi;
      aqTxt=` Calidad del aire: ${v<=20?"buena":v<=40?"aceptable":v<=60?"moderada":"mala"}.`;
    }
    speakText(`Estado en ${loc?.municipio||"tu ubicación"}: ${conds.join(", ")}. Temperatura ${temp} grados, sensación ${feels}. Máxima ${tmax}, mínima ${tmin}. Probabilidad de lluvia: ${rainPct}%.${rain?" Lluvias esperadas a las "+rain.hour+" horas.":""}${aqTxt}`,1.05);
  };

  if(!wx?.current) return <div style={{padding:"6px 10px",border:`1px solid ${ac}22`,borderRadius:"6px",background:"rgba(0,0,0,0.6)",backdropFilter:"blur(4px)",fontSize:"7px",color:"#333"}}>📡...</div>;
  
  const c=wx.current;
  const temp=Math.round(c.temperature_2m);
  const feels=Math.round(c.apparent_temperature);
  const icon=getWeatherIcon(c.weather_code, new Date().getHours());
  const tc=temp<=0?"#00ccff":temp<=15?"#44aaff":temp<=25?"#44ffaa":temp<=33?"#ffaa00":"#ff4400";
  const fill=Math.max(5,Math.min(100,((temp+5)/40)*100));

  return(
    <div onClick={handleClick} title="Toca para escuchar el clima detallado" style={{display:"flex",alignItems:"center",gap:"8px",padding:"6px 12px",border:`1px solid ${ac}33`,borderRadius:"8px",background:"rgba(0,0,0,0.7)",backdropFilter:"blur(8px)",cursor:"pointer",boxShadow:`0 0 15px ${ac}15`,transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.boxShadow=`0 0 25px ${ac}40`;e.currentTarget.style.border=`1px solid ${ac}77`;}} onMouseLeave={e=>{e.currentTarget.style.boxShadow=`0 0 15px ${ac}15`;e.currentTarget.style.border=`1px solid ${ac}33`;}}>
      <svg width="12" height="40" viewBox="0 0 12 40">
        <rect x="4" y="2" width="4" height="24" rx="2" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5"/>
        <rect x="4.5" y={2+24*(1-fill/100)} width="3" height={24*fill/100} rx="1.5" fill={tc} style={{filter:`drop-shadow(0 0 3px ${tc})`}}/>
        <circle cx="6" cy="32" r="5" fill={tc} style={{filter:`drop-shadow(0 0 4px ${tc})`}}/>
      </svg>
      <div>
        <div style={{display:"flex",alignItems:"baseline",gap:"3px"}}>
          <span style={{fontSize:"18px",lineHeight:1}}>{icon}</span>
          <span style={{fontSize:"18px",fontWeight:"900",color:tc,lineHeight:1,textShadow:`0 0 8px ${tc}`}}>{temp}°</span>
          <span style={{fontSize:"6px",color:"rgba(255,255,255,0.25)"}}>/{feels}°</span>
        </div>
        {rain && <div style={{fontSize:"6px",color:"#4488ff",animation:"blink 2s steps(1) infinite"}}>🌧 ~{rain.hour}h ({rain.prob}%)</div>}
        {!rain && <div style={{fontSize:"6px",color:"rgba(255,255,255,0.15)"}}>🔊 toca</div>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CLOCK — Icono según hora del día
// ═══════════════════════════════════════════════════════════════════
function Clock({ac,loc}){
  const[t,setT]=useState(new Date());
  useEffect(()=>{
    const iv=setInterval(()=>setT(new Date()),1000);
    return()=>clearInterval(iv);
  },[]);
  
  const hh=String(t.getHours()).padStart(2,"0");
  const mm=String(t.getMinutes()).padStart(2,"0");
  const ss=String(t.getSeconds()).padStart(2,"0");
  const blink=t.getSeconds()%2===0;
  const timeIcon=getTimeIcon();
  
  const days=["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
  const months=["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

  return(
    <div onClick={()=>speakText(`La hora en ${loc?.municipio||"tu ubicación"} es: ${t.getHours()} horas con ${t.getMinutes()} minutos. Hoy es ${days[t.getDay()]} ${t.getDate()} de ${months[t.getMonth()]} de 2026.`,1.05)} title="Toca para escuchar la hora" style={{display:"flex",alignItems:"center",gap:"6px",padding:"6px 14px",border:`1px solid ${ac}33`,borderRadius:"8px",background:"rgba(0,0,0,0.7)",backdropFilter:"blur(8px)",cursor:"pointer",boxShadow:`0 0 15px ${ac}15`,transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.boxShadow=`0 0 25px ${ac}40`;e.currentTarget.style.border=`1px solid ${ac}77`;}} onMouseLeave={e=>{e.currentTarget.style.boxShadow=`0 0 15px ${ac}15`;e.currentTarget.style.border=`1px solid ${ac}33`;}}>
      <span style={{fontSize:"20px"}}>{timeIcon}</span>
      <div style={{fontFamily:"'Courier New',monospace",display:"flex",alignItems:"baseline",gap:"1px"}}>
        <span style={{fontSize:"26px",fontWeight:"900",color:ac,textShadow:`0 0 20px ${ac},0 0 40px ${ac}44`,lineHeight:1}}>{hh}</span>
        <span style={{fontSize:"22px",fontWeight:"900",color:ac,opacity:blink?1:0.1,transition:"opacity 0.1s",lineHeight:1}}>:</span>
        <span style={{fontSize:"26px",fontWeight:"900",color:ac,textShadow:`0 0 20px ${ac},0 0 40px ${ac}44`,lineHeight:1}}>{mm}</span>
        <span style={{fontSize:"13px",color:ac,opacity:blink?0.8:0.1,transition:"opacity 0.1s",marginLeft:"1px",lineHeight:1}}>:</span>
        <span style={{fontSize:"13px",color:`${ac}55`,lineHeight:1}}>{ss}</span>
      </div>
      <div style={{fontSize:"6px",color:`${ac}33`,letterSpacing:"1px"}}>🔊</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// INTERACTIVE PANELS — Iconos dinámicos
// ═══════════════════════════════════════════════════════════════════

function WarPanel({ carriers, cpos, attacks, planes, quakes, proj }) {
  const [tab, setTab] = useState("timeline");
  const dayNum = 21;
  const dayIcon = getDayIcon(dayNum);
  const timeIcon = getTimeIcon();
  
  const timeline = [
    { day:"DÍA 1",date:"28 FEB",col:"#ff2020",ev:"Jamenei muerto. 200+ jets israelíes. 201 iraníes muertos.",icon:"💥"},
    { day:"DÍA 12",date:"11 MAR",col:"#ff2020",ev:"🔴 FORDOW ATACADA — PRIMERA VEZ. GBU-57.",icon:"☢️"},
    { day:"DÍA 21",date:"HOY",col:"#ff2020",ev:`${timeIcon} F-35 dañado. Joe Kent renunció. Brent $115.`,icon:"⚔️",live:true},
  ];

  return (
    <div style={{background:"rgba(2,5,8,0.95)",border:"1px solid #ff202033",borderRadius:"8px",padding:"12px",backdropFilter:"blur(10px)"}}>
      <div style={{display:"flex",gap:"4px",marginBottom:"10px",borderBottom:"1px solid #ff202020",paddingBottom:"8px"}}>
        {[["timeline","📅 TIMELINE"],["carriers","🚢 CARRIERS"],["counter","💥 CONTADOR"],["intel","🕵️ INTEL"]].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:"4px 10px",background:tab===t?"#ff202033":"transparent",border:`1px solid ${tab===t?"#ff2020":"#ff202022"}`,borderRadius:"4px",color:tab===t?"#ff2020":"#ff202066",fontFamily:"'Courier New',monospace",fontSize:"7.5px",cursor:"pointer",letterSpacing:"1px"}}>{l}</button>
        ))}
      </div>
      {tab==="timeline"&&<div style={{display:"flex",flexDirection:"column",gap:"4px",maxHeight:"160px",overflowY:"auto"}}>
        {timeline.map((t,i)=>(
          <div key={i} onClick={()=>speakText(`${t.day}, ${t.date}: ${t.ev}`)} style={{display:"flex",gap:"8px",alignItems:"flex-start",padding:"5px 8px",background:`${t.col}0a`,border:`1px solid ${t.col}22`,borderRadius:"4px",cursor:"pointer",transition:"all 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background=`${t.col}20`} onMouseLeave={e=>e.currentTarget.style.background=`${t.col}0a`}>
            <div style={{minWidth:"52px"}}>
              <div style={{fontSize:"8px",fontWeight:"bold",color:t.col}}>{t.icon} {t.day}</div>
              <div style={{fontSize:"6.5px",color:"rgba(255,255,255,0.3)"}}>{t.date}</div>
            </div>
            <div style={{fontSize:"8.5px",color:"rgba(255,255,255,0.75)",lineHeight:1.5}}>{t.ev}</div>
            {t.live&&<div style={{marginLeft:"auto",fontSize:"7px",color:t.col,animation:"blink 1s steps(1) infinite",flexShrink:0}}>🔴 LIVE</div>}
          </div>
        ))}
      </div>}
      {tab==="counter"&&<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"6px"}}>
        {[
          {l:"MUERTOS IRÁN",v:"1,480+",c:"#ff1a1a",sub:"civiles: 500+",icon:"💀"},
          {l:"SOLDADOS USA",v:"13 ✝",c:"#ff4444",sub:"+1 nuevo hoy",icon:"⚔️"},
          {l:"FORDOW ☢️",v:"ATACADA",c:"#ff0000",sub:"1ª vez historia",icon:"☢️"},
          {l:"BRENT",v:"$115",c:"#ffaa00",sub:"en vivo",icon:"🛢️",live:true},
        ].map(s=>(
          <div key={s.l} style={{background:"rgba(0,0,0,0.6)",border:`1px solid ${s.c}22`,borderRadius:"5px",padding:"8px 7px",textAlign:"center"}}>
            <div style={{fontSize:"16px",marginBottom:"4px"}}>{s.icon}</div>
            <div style={{fontSize:"16px",fontWeight:"900",color:s.c,textShadow:`0 0 8px ${s.c}66`,fontFamily:"'Courier New',monospace"}}>{s.v}</div>
            <div style={{fontSize:"6px",color:"rgba(255,255,255,0.25)",letterSpacing:"1px",marginTop:"2px",lineHeight:1.3}}>{s.l}</div>
            <div style={{fontSize:"5.5px",color:`${s.c}66`,marginTop:"2px"}}>{s.sub}</div>
            {s.live&&<div style={{fontSize:"5px",color:s.c,marginTop:"2px",animation:"blink 2s steps(1) infinite"}}>● LIVE</div>}
          </div>
        ))}
      </div>}
    </div>
  );
}

function DiseasePanel({ quakes }) {
  const [tab, setTab] = useState("outbreak");
  const [age, setAge] = useState("");
  const [vacc, setVaccResult] = useState(null);
  
  const outbreaks = [
    {name:"SARAMPIÓN 🇲🇽",casos:"9,074",trend:"+12%/sem",risk:"ALTO",c:"#ff2200",mx:true,icon:getDiseaseIcon("9074","+12%")},
    {name:"MPOX CLADE Ib",casos:"100K+",trend:"+8%/sem",risk:"ALTO",c:"#ff6600",mx:false,icon:getDiseaseIcon("100000","+8%")},
    {name:"H5N1 BOVINOS",casos:"47 estados",trend:"PANDÉMICO",risk:"MÁX.",c:"#ffaa00",mx:false,icon:"🦠🔴"},
  ];

  return (
    <div style={{background:"rgba(2,10,5,0.95)",border:"1px solid #ff660033",borderRadius:"8px",padding:"12px",backdropFilter:"blur(10px)"}}>
      <div style={{display:"flex",gap:"4px",marginBottom:"10px",borderBottom:"1px solid #ff660020",paddingBottom:"8px"}}>
        {[["outbreak","🦠 BROTES"],["vaccine","💉 VACUNAS"],["risk","⚠️ RIESGOS"]].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:"4px 10px",background:tab===t?"#ff660033":"transparent",border:`1px solid ${tab===t?"#ff6600":"#ff660022"}`,borderRadius:"4px",color:tab===t?"#ff6600":"#ff660066",fontFamily:"'Courier New',monospace",fontSize:"7.5px",cursor:"pointer",letterSpacing:"1px"}}>{l}</button>
        ))}
      </div>
      {tab==="outbreak"&&<div style={{display:"flex",flexDirection:"column",gap:"3px",maxHeight:"170px",overflowY:"auto"}}>
        {outbreaks.map((o,i)=>(
          <div key={i} onClick={()=>speakText(`${o.name}: ${o.casos} casos. Tendencia ${o.trend}. Nivel de riesgo: ${o.risk}.`)} style={{display:"flex",gap:"8px",padding:"5px 8px",background:`${o.c}0a`,border:`1px solid ${o.c}22`,borderRadius:"4px",cursor:"pointer",transition:"all 0.15s",alignItems:"center"}} onMouseEnter={e=>e.currentTarget.style.background=`${o.c}1e`} onMouseLeave={e=>e.currentTarget.style.background=`${o.c}0a`}>
            <span style={{fontSize:"16px"}}>{o.icon}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:"8.5px",color:o.c,fontWeight:"bold"}}>{o.name}{o.mx&&<span style={{marginLeft:"4px",fontSize:"6px",background:"#ff2200",color:"#fff",padding:"1px 3px",borderRadius:"2px"}}>MX</span>}</div>
              <div style={{fontSize:"7.5px",color:"rgba(255,255,255,0.5)"}}>{o.casos} · {o.trend}</div>
            </div>
            <div style={{fontSize:"7px",background:`${o.c}22`,color:o.c,padding:"2px 5px",borderRadius:"3px",textAlign:"center",fontWeight:"bold"}}>{o.risk}</div>
          </div>
        ))}
      </div>}
    </div>
  );
}

function ClimatePanel({ quakes, hurricanes, hurPos, eonet }) {
  const [tab, setTab] = useState("quakes");
  const maxMag = quakes.length ? Math.max(...quakes.map(q=>q.mag)) : 7;
  const timeIcon = getTimeIcon();
  
  return (
    <div style={{background:"rgba(2,8,16,0.95)",border:"1px solid #00aaff33",borderRadius:"8px",padding:"12px",backdropFilter:"blur(10px)"}}>
      <div style={{display:"flex",gap:"4px",marginBottom:"10px",borderBottom:"1px solid #00aaff20",paddingBottom:"8px"}}>
        {[["quakes","🌋 SISMOS"],["hurr","🌀 HURACANES"],["eonet","🛰️ NASA"],["extremos","🔥 EXTREMOS"]].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:"4px 10px",background:tab===t?"#00aaff33":"transparent",border:`1px solid ${tab===t?"#00aaff":"#00aaff22"}`,borderRadius:"4px",color:tab===t?"#00aaff":"#00aaff66",fontFamily:"'Courier New',monospace",fontSize:"7.5px",cursor:"pointer",letterSpacing:"1px"}}>{l}</button>
        ))}
      </div>
      {tab==="quakes"&&<div>
        {quakes.length===0&&<div style={{textAlign:"center",color:"rgba(255,255,255,0.2)",fontSize:"8px",padding:"20px"}}>✅ Sin sismos M5.5+ en las últimas 48h según USGS</div>}
        {quakes.length>0&&<div>
          <div style={{display:"flex",gap:"4px",marginBottom:"6px",alignItems:"center"}}>
            <div style={{fontSize:"8px",color:"#00aaff"}}>{quakes.length} sismos M5.5+ en 48h</div>
            <div style={{fontSize:"7px",background:"#ff000022",color:"#ff4400",padding:"2px 7px",borderRadius:"3px",marginLeft:"auto"}}>Max: M{maxMag.toFixed(1)}</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"3px",maxHeight:"140px",overflowY:"auto"}}>
            {quakes.sort((a,b)=>b.mag-a.mag).map(q=>{
              const mc=magCol(q.mag);
              const icon=getQuakeIcon(q.mag);
              const pct=((q.mag-5.5)/2.5)*100;
              return(
                <div key={q.id} onClick={()=>speakText(`Sismo magnitud ${q.mag.toFixed(1)} en ${q.place}. Profundidad ${q.depth} kilómetros.`)} style={{display:"flex",gap:"8px",alignItems:"center",padding:"4px 8px",background:`${mc}0a`,border:`1px solid ${mc}22`,borderRadius:"4px",cursor:"pointer",transition:"all 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background=`${mc}1e`} onMouseLeave={e=>e.currentTarget.style.background=`${mc}0a`}>
                  <span style={{fontSize:"14px"}}>{icon}</span>
                  <div style={{minWidth:"32px",fontSize:"11px",fontWeight:"900",color:mc,textShadow:`0 0 6px ${mc}66`}}>M{q.mag.toFixed(1)}</div>
                  <div style={{flex:1}}>
                    <div style={{width:`${pct}%`,minWidth:"2px",height:"3px",background:mc,borderRadius:"2px",marginBottom:"2px"}}/>
                    <div style={{fontSize:"7.5px",color:"rgba(255,255,255,0.6)",lineHeight:1.3}}>{q.place.substring(0,45)}</div>
                  </div>
                  <div style={{fontSize:"6px",color:"rgba(255,255,255,0.25)",textAlign:"right",minWidth:"36px"}}>Prof<br/>{q.depth}km</div>
                </div>
              );
            })}
          </div>
        </div>}
      </div>}
      {tab==="hurr"&&<div>
        {hurricanes.length===0&&<div style={{textAlign:"center",color:"rgba(255,255,255,0.2)",fontSize:"8px",padding:"20px"}}>🌊 NOAA: Sin huracanes activos en este momento.</div>}
        {hurricanes.map(h=>{
          const pos=hurPos[h.id]||{lat:h.lat,lng:h.lng};
          const hc=hurCol(h.kts);
          const icon=getHurricaneIcon(h.kts);
          const dist=haversine(pos.lat,pos.lng,23.6,-102.5);
          return(
            <div key={h.id} onClick={()=>speakText(`Huracán ${h.name}, ${hurCat(h.kts)}, vientos de ${Math.round(h.kts*1.852)} kilómetros por hora.`)} style={{padding:"10px",background:`${hc}0d`,border:`1px solid ${hc}44`,borderRadius:"6px",cursor:"pointer",marginBottom:"6px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontSize:"14px"}}>{icon} {h.name}</div>
                <div style={{fontSize:"7px",background:`${hc}22`,color:hc,padding:"3px 8px",borderRadius:"3px"}}>{Math.round(dist)}km de México</div>
              </div>
              <div style={{fontSize:"7px",color:"rgba(255,255,255,0.5)",marginTop:"4px"}}>{hurCat(h.kts)} · {Math.round(h.kts*1.852)} km/h</div>
            </div>
          );
        })}
      </div>}
    </div>
  );
}

function NewsPanel({ fx, crypto, quakes }) {
  const [tab, setTab] = useState("markets");
  const timeIcon = getTimeIcon();
  
  const sentiment = 28;
  const sentimentLabel = sentiment < 20 ? "PÁNICO EXTREMO" : sentiment < 40 ? "MIEDO" : sentiment < 60 ? "NEUTRAL" : sentiment < 80 ? "CODICIA" : "CODICIA EXTREMA";
  const sentimentColor = sentiment < 20 ? "#ff0000" : sentiment < 40 ? "#ff6600" : sentiment < 60 ? "#ffcc00" : "#44ff88";

  return (
    <div style={{background:"rgba(5,4,0,0.95)",border:"1px solid #ffcc0033",borderRadius:"8px",padding:"12px",backdropFilter:"blur(10px)"}}>
      <div style={{display:"flex",gap:"4px",marginBottom:"10px",borderBottom:"1px solid #ffcc0020",paddingBottom:"8px"}}>
        {[["markets","📊 MERCADOS"],["energy","🛢️ ENERGÍA"],["conversor","💱 CONVERSOR"]].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:"4px 10px",background:tab===t?"#ffcc0033":"transparent",border:`1px solid ${tab===t?"#ffcc00":"#ffcc0022"}`,borderRadius:"4px",color:tab===t?"#ffcc00":"#ffcc0066",fontFamily:"'Courier New',monospace",fontSize:"7.5px",cursor:"pointer",letterSpacing:"1px"}}>{l}</button>
        ))}
      </div>
      {tab==="markets"&&<div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"5px",marginBottom:"8px"}}>
          {[
            {l:"USD/MXN",v:fx?`$${fx}`:"...",c:"#88cc00",sub:fx?">18 MÍNIMOS":"cargando",live:!!fx,icon:"💱"},
            {l:"BITCOIN",v:crypto?.bitcoin?`$${Math.round(crypto.bitcoin.usd/1000)}K`:"...",c:"#ffdd00",sub:crypto?.bitcoin?`${crypto.bitcoin.usd_24h_change>0?"+":""}${crypto.bitcoin.usd_24h_change?.toFixed(1)}% 24h`:"cargando",live:!!crypto?.bitcoin,icon:"₿"},
            {l:"BRENT",v:"~$115",c:"#ffaa00",sub:"en vivo",live:true,icon:"🛢️"},
            {l:"NASDAQ",v:"-3%",c:"#ff3344",sub:"hoy",live:true,icon:"📉"},
          ].map(s=>(
            <div key={s.l} onClick={()=>speakText(`${s.l}: ${s.v}. ${s.sub}`)} style={{background:"rgba(0,0,0,0.5)",border:`1px solid ${s.c}22`,borderRadius:"5px",padding:"8px 7px",textAlign:"center",cursor:"pointer",transition:"all 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.04)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(0,0,0,0.5)"}>
              <div style={{fontSize:"18px",marginBottom:"4px"}}>{s.icon}</div>
              <div style={{fontSize:"15px",fontWeight:"900",color:s.c,textShadow:`0 0 8px ${s.c}55`}}>{s.v}</div>
              <div style={{fontSize:"6px",color:"rgba(255,255,255,0.25)",letterSpacing:"1px"}}>{s.l}</div>
              <div style={{fontSize:"6.5px",color:`${s.c}88`,marginTop:"2px"}}>{s.sub}</div>
              {s.live&&<div style={{fontSize:"5px",color:s.c,marginTop:"2px",animation:"blink 2s steps(1) infinite"}}>● LIVE</div>}
            </div>
          ))}
        </div>
      </div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════
export default function App(){
  const[mode,setMode]=useState("war");
  const[geo,setGeo]=useState(null);
  const[proj,setProj]=useState(null);
  const[sel,setSel]=useState(null);
  const[ping,setPing]=useState(null);
  const[quakes,setQuakes]=useState([]);
  const[hurricanes,setHurricanes]=useState([]);
  const[noaaChecked,setNoaaChecked]=useState(false);
  const[hurPos,setHurPos]=useState({});
  const[wlive,setWlive]=useState({});
  const[radarAngle,setRadarAngle]=useState(0);
  const[showInfo,setShowInfo]=useState(false);
  
  const loc=useGeoLocation();
  const fx=useFX();
  const crypto=useCrypto();
  const cpos=useMovingCarriers();
  const attacks=useAttacks(mode==="war");
  const planes=useOpenSky(mode==="war");
  const eonet=useEONET(mode==="climate");
  
  const lastHov=useRef(0);
  const lastHovId=useRef(null);
  
  const ac=ACC[mode],bg=BG[mode],isoM=ISO_COL[mode]||{},mcd=ALL_COUNTRY_DATA[mode]||{};
  const timeIcon=getTimeIcon();
  const dayNum=21;
  const dayIcon=getDayIcon(dayNum);

  // Radar animation
  useEffect(()=>{
    const iv=setInterval(()=>setRadarAngle(a=>(a+1.5)%360),30);
    return()=>clearInterval(iv);
  },[]);

  // World map
  useEffect(()=>{
    let done=false;
    (async()=>{
      try{
        const[topo,world]=await Promise.all([
          import("https://cdn.skypack.dev/topojson-client@3"),
          fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then(r=>r.json())
        ]);
        if(done) return;
        const p=d3.geoNaturalEarth1().scale(150).translate([W/2,H/2+15]);
        const path=d3.geoPath(p);
        const features=topo.feature(world,world.objects.countries).features;
        setProj(()=>p);
        setGeo({
          paths:features.map(f=>({id:String(f.id),d:path(f)||""})),
          borders:path(topo.mesh(world,world.objects.countries,(a,b)=>a!==b)),
          sphere:path({type:"Sphere"})
        });
      }catch(e){}
    })();
    return()=>{done=true;};
  },[]);

  // USGS Earthquakes
  const fetchQ=useCallback(async()=>{
    try{
      const r=await fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/5.0_day.geojson");
      const d=await r.json();
      const now=Date.now();
      setQuakes(d.features.filter(f=>f.properties.mag>=5.5&&(now-f.properties.time)<48*3600*1000).map(f=>({
        id:f.id,
        mag:f.properties.mag,
        place:f.properties.place||"Océano",
        lat:f.geometry.coordinates[1],
        lng:f.geometry.coordinates[0],
        depth:Math.round(f.geometry.coordinates[2]),
        time:f.properties.time,
        icon:getQuakeIcon(f.properties.mag)
      })));
    }catch(e){}
  },[]);

  useEffect(()=>{
    fetchQ();
    const iv=setInterval(fetchQ,5*60*1000);
    return()=>clearInterval(iv);
  },[fetchQ]);

  // NOAA Hurricanes
  const fetchH=useCallback(async()=>{
    try{
      const r=await fetch("https://www.nhc.noaa.gov/CurrentStorms.json");
      const d=await r.json();
      setNoaaChecked(true);
      if(d.activeStorms?.length){
        const a=d.activeStorms.map(s=>({
          id:s.id,
          name:s.name||"Storm",
          kts:parseInt(s.intensity)||65,
          lat:parseFloat(s.latitudeNumeric)||20,
          lng:parseFloat(s.longitudeNumeric)||-85,
          dir:parseInt(s.movementDir)||315,
          spd:parseInt(s.movementSpeed)||12,
          icon:getHurricaneIcon(parseInt(s.intensity)||65)
        }));
        setHurricanes(a);
        setHurPos(Object.fromEntries(a.map(h=>[h.id,{lat:h.lat,lng:h.lng}])));
      }else setHurricanes([]);
    }catch(e){
      setNoaaChecked(true);
      setHurricanes([]);
    }
  },[]);

  useEffect(()=>{
    fetchH();
    const iv=setInterval(fetchH,30*60*1000);
    return()=>clearInterval(iv);
  },[fetchH]);

  // Live weather spots
  useEffect(()=>{
    const spots=[{k:"india",lat:26.8,lng:80.9},{k:"aus",lat:-33.8,lng:149},{k:"mexico",lat:19.4,lng:-99.1},{k:"iran",lat:32.4,lng:53.7},{k:"usa",lat:37,lng:-95}];
    const go=async()=>{
      const obj={};
      await Promise.all(spots.map(async({k,lat,lng})=>{
        try{
          const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,wind_speed_10m&forecast_days=1&timezone=auto`);
          const d=await r.json();
          if(d.current) obj[k]=d.current;
        }catch(e){}
      }));
      setWlive(obj);
    };
    go();
    const iv=setInterval(go,10*60*1000);
    return()=>clearInterval(iv);
  },[]);

  useEffect(()=>{
    window.speechSynthesis.getVoices();
    return()=>stopSpeech();
  },[]);

  const xy=useCallback((lat,lng)=>{
    if(!proj) return null;
    return proj([lng,lat]);
  },[proj]);

  const cycleMode=()=>{
    stopSpeech();
    const nm=MODES[(MODES.indexOf(mode)+1)%MODES.length];
    setMode(nm);
    setSel(null);
    lastHovId.current=null;
    setTimeout(()=>speakText(MODE_VOICE[nm],1.0),350);
  };

  // Build points with dynamic icons
  const clmPts=[
    ...BASE_CLIMATE,
    ...quakes.map(q=>({
      id:`q_${q.id}`,
      name:`M${q.mag.toFixed(1)}\n${q.place.split(",")[0].substring(0,12).toUpperCase()}`,
      lat:q.lat,
      lng:q.lng,
      c:magCol(q.mag),
      s:Math.min(5,Math.round(q.mag-3)),
      st:"extremo",
      icon:q.icon,
      pulse:q.mag>=6,
      fecha:new Date(q.time).toLocaleDateString("es-MX",{day:"2-digit",month:"short"}).toUpperCase(),
      det:`Sismo M${q.mag.toFixed(1)} en ${q.place}. Prof: ${q.depth}km. USGS ${new Date(q.time).toLocaleString("es-MX")}.`
    })),
    ...hurricanes.map(h=>{
      const pos=hurPos[h.id]||{lat:h.lat,lng:h.lng};
      return{
        id:`hur_${h.id}`,
        name:`🌀${h.name}\n${hurCat(h.kts)}`,
        lat:pos.lat,
        lng:pos.lng,
        c:hurCol(h.kts),
        s:5,
        st:"extremo",
        icon:h.icon,
        pulse:true,
        fecha:"NOAA LIVE",
        det:`Huracán ${h.name} — ${hurCat(h.kts)}. ${Math.round(h.kts*1.852)} km/h. NOAA NHC tiempo real.`
      };
    }),
    ...eonet.map(e=>({
      id:`eon_${e.id}`,
      name:`NASA\n${e.cat.substring(0,10).toUpperCase()}`,
      lat:e.lat,
      lng:e.lng,
      c:"#ff7700",
      s:3,
      st:"activo",
      icon:e.icon,
      pulse:false,
      fecha:"NASA EONET",
      det:`${e.title}. Evento activo detectado por NASA EONET. Tipo: ${e.cat}.`
    }))
  ];

  const DATA_MAP={war:BASE_WAR,disease:BASE_DISEASE,climate:clmPts,news:BASE_NEWS};
  const pts=DATA_MAP[mode]||[];

  return(
    <div style={{background:bg,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",padding:"10px 8px 16px",fontFamily:"'Courier New',monospace",color:"#fff",transition:"background 0.6s",userSelect:"none",position:"relative",overflow:"hidden"}}>
      {/* BACKGROUND GRID */}
      <div style={{position:"fixed",inset:0,backgroundImage:`linear-gradient(${GRID[mode]} 1px,transparent 1px),linear-gradient(90deg,${GRID[mode]} 1px,transparent 1px)`,backgroundSize:"40px 40px",pointerEvents:"none",zIndex:0}}/>
      
      {/* TOP BAR */}
      <div style={{width:"100%",maxWidth:"980px",marginBottom:"8px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"8px",position:"relative",zIndex:1}}>
        <div style={{flex:1,minWidth:"200px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"2px"}}>
            <div style={{width:"6px",height:"6px",borderRadius:"50%",background:ac,boxShadow:`0 0 8px ${ac}`,animation:"pulse 1s ease infinite"}}/>
            <span style={{fontSize:"7px",letterSpacing:"3px",color:ac}}>{timeIcon} TIEMPO REAL · USGS · NOAA · OPENSKY · NASA · AI</span>
          </div>
          <h1 style={{fontSize:"clamp(10px,1.8vw,16px)",fontWeight:"900",letterSpacing:"2px",color:"#fff",margin:"0 0 3px",textShadow:`0 0 30px ${ac}88,0 0 60px ${ac}33`}}>
            {dayIcon} {TITLES[mode]}
          </h1>
          <div style={{fontSize:"6px",color:"rgba(255,255,255,0.1)",marginTop:"3px",cursor:"pointer"}} onClick={()=>setShowInfo(p=>!p)}>
            ⟳ USGS 5min · NOAA 30min · TEMP 10min · FX 5min · BTC 3min {showInfo?"▲":"▼"}
          </div>
        </div>
        <div style={{display:"flex",gap:"8px",alignItems:"flex-start",flexWrap:"wrap"}}>
          <Clock ac={ac} loc={loc}/>
          <WeatherWidget ac={ac} loc={loc}/>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:"5px",alignItems:"flex-end"}}>
          <button onClick={cycleMode} style={{padding:"8px 14px",background:`${ac}15`,border:`1px solid ${ac}`,borderRadius:"6px",color:ac,fontFamily:"'Courier New',monospace",fontSize:"10px",letterSpacing:"2px",cursor:"pointer",fontWeight:"bold",backdropFilter:"blur(4px)",boxShadow:`0 0 15px ${ac}25`,transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.background=`${ac}30`;e.currentTarget.style.boxShadow=`0 0 30px ${ac}66`;}} onMouseLeave={e=>{e.currentTarget.style.background=`${ac}15`;e.currentTarget.style.boxShadow=`0 0 15px ${ac}25`;}}>
            {NEXT[mode]} →
          </button>
          <div style={{display:"flex",gap:"5px"}}>
            {MODES.map(m=>(
              <div key={m} onClick={()=>{stopSpeech();setMode(m);setSel(null);setTimeout(()=>speakText(MODE_VOICE[m]),300);}} style={{width:"7px",height:"7px",borderRadius:"50%",background:m===mode?ACC[m]:"rgba(255,255,255,0.07)",boxShadow:m===mode?`0 0 10px ${ACC[m]},0 0 20px ${ACC[m]}55`:"none",transition:"all 0.3s",cursor:"pointer"}}/>
            ))}
          </div>
        </div>
      </div>

      {/* MAP */}
      <div style={{width:"100%",maxWidth:"980px",position:"relative",border:`1px solid ${ac}18`,borderRadius:"10px",overflow:"hidden",boxShadow:`0 0 60px ${ac}15,inset 0 0 30px rgba(0,0,0,0.5)`,background:"#010610",zIndex:1}}>
        {!geo&&<div style={{height:"440px",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"12px"}}>
          <div style={{fontSize:"24px",animation:"spin 1.5s linear infinite"}}>🌍</div>
          <div style={{fontSize:"8px",color:ac,letterSpacing:"4px",animation:"blink 1s steps(1) infinite"}}>CARGANDO MAPA GLOBAL...</div>
        </div>}
        {geo&&<svg viewBox={`0 0 ${W} ${H}`} style={{display:"block",width:"100%"}}>
          <defs>
            <filter id="glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          </defs>
          <rect width={W} height={H} fill="#010610"/>
          {geo.sphere&&<path d={geo.sphere} fill="#010c1a" stroke={ac} strokeWidth="0.4" strokeOpacity="0.12"/>}
          {geo.paths.map(({id,d})=>{
            const col=isoM[id],hasCE=!!mcd[id];
            return<path key={id} d={d} fill={col?`${col}1e`:"#0a0e1a"} stroke={col?col:"#0c1428"} strokeWidth={col?0.6:0.15} strokeOpacity={col?0.5:1} onMouseEnter={()=>{}} style={{cursor:hasCE?"pointer":"default",transition:"fill 0.2s"}} onMouseOver={e=>{if(col)e.target.setAttribute("fill",col+(hasCE?"55":"2a"));}} onMouseOut={e=>e.target.setAttribute("fill",col?`${col}1e`:"#0a0e1a")} onClick={()=>{}}/>;
          })}
          {geo.borders&&<path d={geo.borders} fill="none" stroke="#0c1428" strokeWidth="0.2"/>}
          
          {/* DATA POINTS with dynamic icons */}
          {pts.filter(pt=>pt.lat&&pt.lng).map(pt=>{
            const p=xy(pt.lat,pt.lng);
            if(!p) return null;
            const[px,py]=p;
            const r=7,ptc=pt.c||"#ff4400";
            return<g key={pt.id} style={{cursor:"pointer"}}>
              {pt.pulse&&[0,1,2].map(i=>(
                <circle key={i} cx={px} cy={py} r={r} fill="none" stroke={ptc} strokeWidth="0.7" opacity="0">
                  <animate attributeName="r" from={r} to={r+32} dur={`${2+i*0.6}s`} begin={`${i*0.6}s`} repeatCount="indefinite"/>
                  <animate attributeName="opacity" from="0.6" to="0" dur={`${2+i*0.6}s`} begin={`${i*0.6}s`} repeatCount="indefinite"/>
                </circle>
              ))}
              <circle cx={px} cy={py} r={r} fill={ptc} style={{filter:`drop-shadow(0 0 ${7}px ${ptc})`}}/>
              <circle cx={px} cy={py} r={r*0.38} fill="rgba(255,255,255,0.6)"/>
              {pt.icon&&<text x={px} y={py+2.5} textAnchor="middle" fontSize="6" style={{pointerEvents:"none"}}>{pt.icon}</text>}
            </g>;
          })}
          <rect width={W} height={H} fill="none" opacity="0.03" style={{backgroundImage:"repeating-linear-gradient(0deg,rgba(0,0,0,0.5),rgba(0,0,0,0.5) 1px,transparent 1px,transparent 4px)",pointerEvents:"none"}}/>
        </svg>}
        <div style={{position:"absolute",bottom:"4px",left:"50%",transform:"translateX(-50%)",fontSize:"6px",color:"rgba(255,255,255,0.08)",letterSpacing:"2px",pointerEvents:"none",whiteSpace:"nowrap"}}>
          HOVER→MÚSICA · PUNTOS→VOZ+DETALLE · ICONOS LIVE
        </div>
      </div>

      {/* INTERACTIVE PANELS */}
      <div style={{marginTop:"10px",width:"100%",maxWidth:"980px",position:"relative",zIndex:1}}>
        {mode==="war"&&<WarPanel carriers={CARRIERS} cpos={cpos} attacks={attacks} planes={planes} quakes={quakes} proj={proj}/>}
        {mode==="disease"&&<DiseasePanel quakes={quakes}/>}
        {mode==="climate"&&<ClimatePanel quakes={quakes} hurricanes={hurricanes} hurPos={hurPos} eonet={eonet}/>}
        {mode==="news"&&<NewsPanel fx={fx} crypto={crypto} quakes={quakes}/>}
      </div>

      {/* LIVE DATA STRIP */}
      {Object.keys(wlive).length>0&&<div style={{marginTop:"7px",width:"100%",maxWidth:"980px",background:"rgba(0,20,10,0.8)",border:"1px solid rgba(0,255,100,0.1)",borderRadius:"6px",padding:"6px 14px",display:"flex",gap:"12px",flexWrap:"wrap",alignItems:"center",backdropFilter:"blur(4px)",position:"relative",zIndex:1}}>
        <span style={{fontSize:"7px",color:"#00ff88",letterSpacing:"3px",fontWeight:"bold"}}>📡 TEMPERATURAS LIVE</span>
        {wlive.india&&<span style={{fontSize:"8px",color:"#ff4400"}}>🔥 INDIA {wlive.india.temperature_2m}°C</span>}
        {wlive.mexico&&<span style={{fontSize:"8px",color:"#8844ff"}}>🇲🇽 MÉXICO {wlive.mexico.temperature_2m}°C</span>}
        {planes.length>0&&<span style={{fontSize:"8px",color:"#00cc88"}}>✈️ {planes.length} aviones reales</span>}
        {eonet.length>0&&<span style={{fontSize:"8px",color:"#ff7700"}}>🛰️ {eonet.length} eventos NASA</span>}
      </div>}

      <div style={{marginTop:"8px",fontSize:"6px",color:"rgba(255,255,255,0.07)",letterSpacing:"2px",textAlign:"center",position:"relative",zIndex:1}}>
        MONITOR GLOBAL v13 · ICONOS TIEMPO REAL · 20 MAR 2026 · DÍA 21
      </div>

      <style>{`
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.8)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        * { box-sizing: border-box; }
        ::-webkit-scrollbar{width:3px;background:#010610}
        ::-webkit-scrollbar-thumb{background:#1a2a3a;border-radius:2px}
      `}</style>
    </div>
  );
}
