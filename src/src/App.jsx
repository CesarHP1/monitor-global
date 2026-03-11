// @ts-nocheck
// MONITOR GLOBAL v10 — 10 MAR 2026 — DÍA 11
// APIs GRATIS: USGS · NOAA · Open-Meteo · OpenSky · NASA EONET · CoinGecko · Frankfurter · AirQuality
// EFECTOS: Glassmorphism · Neon Glow · Missile Trails · Moving Carriers · Real Planes · Radar Sweep
import { useState, useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";

const W = 960, H = 480;
const FALLBACK_LAT = 19.2826, FALLBACK_LNG = -99.6557;

// ═══════════════════════════════════════════════════════════════════
// SPEECH ENGINE v2 — voz única, sin cambios entre frases
// ═══════════════════════════════════════════════════════════════════
let _sq = [], _spk = false, _voice = null, _kat = null, _rate = 1.05;

function pickVoice() {
  const vs = window.speechSynthesis.getVoices(); if (!vs.length) return null;
  const rx = /monica|paulina|lucia|sabina|rosa|elena|conchita|angelica|lupe|paloma|susana|pilar|maria|fernanda|valeria|camila|andrea|sofia|isabel|beatriz/i;
  const fem = vs.filter(v => v.lang.startsWith("es") && rx.test(v.name));
  return fem.length ? fem[Math.floor(Math.random() * fem.length)] : vs.find(v => v.lang.startsWith("es") && v.name.includes("Google")) || vs.find(v => v.lang.startsWith("es")) || vs[0];
}

function speakText(txt, rate = 1.05) {
  try {
    stopSpeech(); _rate = rate; _voice = pickVoice();
    const clean = txt.replace(/[\u{1F300}-\u{1FAFF}]/gu, "").replace(/\n/g, ", ").replace(/\s+/g, " ").trim();
    _sq = (clean.match(/[^.!?]+[.!?]*/g) || [clean]).filter(s => s.trim().length > 1);
    setTimeout(_pq, 100);
  } catch (e) {}
}
function _pq() {
  if (!_sq.length || _spk) return;
  const s = _sq.shift(); if (!s?.trim()) { _pq(); return; }
  try {
    const u = new SpeechSynthesisUtterance(s.trim());
    u.lang = "es-MX"; u.rate = _rate; u.pitch = 1.2; u.volume = 0.95;
    if (_voice) u.voice = _voice;
    u.onstart = () => { _spk = true; };
    u.onend = () => { _spk = false; setTimeout(_pq, 60); };
    u.onerror = e => { if (e.error !== "interrupted") { _spk = false; setTimeout(_pq, 60); } };
    if (_kat) clearInterval(_kat);
    _kat = setInterval(() => { if (!window.speechSynthesis.speaking) { clearInterval(_kat); return; } window.speechSynthesis.pause(); window.speechSynthesis.resume(); }, 9000);
    window.speechSynthesis.speak(u);
  } catch (e) { _spk = false; }
}
function stopSpeech() {
  _sq = []; _spk = false;
  if (_kat) { clearInterval(_kat); _kat = null; }
  try { window.speechSynthesis.cancel(); } catch (e) {}
}

// ═══════════════════════════════════════════════════════════════════
// WMO CODES
// ═══════════════════════════════════════════════════════════════════
const wmoIcon = c => c===0?"☀️":c<=3?"⛅":c<=48?"🌫️":c<=57?"🌦️":c<=67?"🌧️":c<=77?"❄️":c<=82?"🌦️":c<=84?"🌨️":"⛈️";
const wmoText = c => c===0?"Despejado":c<=2?"P. nublado":c<=3?"Nublado":c<=48?"Niebla":c<=57?"Llovizna":c<=65?"Lluvia":c<=67?"Lluvia helada":c<=77?"Nieve":c<=82?"Chubascos":c<=84?"Chubascos nieve":"Tormenta";

// ═══════════════════════════════════════════════════════════════════
// CONSTANTES GLOBALES
// ═══════════════════════════════════════════════════════════════════
const MODES = ["war","disease","climate","news"];
const ACC = { war:"#ff2020", disease:"#ff6600", climate:"#00aaff", news:"#ffcc00" };
const BG  = { war:"#020508", disease:"#020a05", climate:"#020810", news:"#050400" };
const TITLES = { war:"⚔️  CONFLICTOS — DÍA 11 — 10 MAR 2026", disease:"🦠  BROTES GLOBALES — OMS — 10 MAR 2026", climate:"🌍  CLIMA · SISMOS USGS · NOAA LIVE", news:"📰  ECONOMÍA & MERCADOS — 10 MAR 2026" };
const NEXT = { war:"🦠 ENFERMEDADES", disease:"🌍 CLIMA", climate:"📰 ECONOMÍA", news:"⚔️ CONFLICTOS" };
const STATUS_L = { guerra:"EN GUERRA", atacado:"BAJO ATAQUE", activo:"EN CURSO", tension:"EN TENSIÓN", critico:"CRÍTICO", alerta:"EN ALERTA", extremo:"EXTREMO" };

const ISO_COL = {
  war:{"840":"#ff2020","364":"#ff1a1a","376":"#ff1a1a","422":"#ff4444","804":"#ff8800","643":"#ff4400","586":"#ff5500","4":"#ff5500","784":"#ff8800","634":"#ff8800","48":"#ff8800","414":"#ff8800","682":"#ff9900","196":"#ff8800","724":"#ffcc00","156":"#ffcc00","356":"#ffaa44","484":"#88cc00","368":"#ff6600","792":"#ffcc00","818":"#ffcc00","250":"#4466ff","380":"#4466ff","528":"#4466ff","826":"#4466ff","300":"#4466ff"},
  disease:{"156":"#ff4400","180":"#ff6600","840":"#ffaa00","729":"#ff8800","76":"#ff6600","430":"#cc0000","356":"#ff4400","484":"#ff2200","710":"#ff8800","410":"#ffcc00","360":"#ff9900","608":"#ff7733"},
  climate:{"356":"#ff2200","840":"#aa44ff","50":"#6633ff","124":"#00ccff","36":"#ff3300","76":"#0055ff","392":"#ffaa00","360":"#ff9900","608":"#7733ff","724":"#ff5500","250":"#0066ff","152":"#ffbb00","484":"#8844ff"},
  news:{"840":"#ff6600","276":"#4488ff","250":"#4488ff","156":"#ffcc00","364":"#ff4444","643":"#ff7700","76":"#44ffaa","826":"#4466ff","724":"#ff6600","380":"#4466ff","392":"#ff3344","682":"#ffaa00","484":"#ffaa44","528":"#4466ff"},
};

const hurCol = k => { k=parseInt(k)||0; return k>=137?"#ff0000":k>=113?"#ff4400":k>=96?"#ff8800":k>=64?"#8844ff":"#6666ff"; };
const hurCat = k => { k=parseInt(k)||0; return k>=137?"CAT5":k>=113?"CAT4":k>=96?"CAT3":k>=64?"CAT2":"T.TROP"; };
const magCol = m => m>=7?"#ff0000":m>=6?"#ff4400":"#ff8800";

// ═══════════════════════════════════════════════════════════════════
// DATOS ESTÁTICOS — DÍA 11
// ═══════════════════════════════════════════════════════════════════
const ALL_COUNTRY_DATA = {
  war: {
    "840":{name:"🇺🇸 EE.UU.",fecha:"DÍA 11",c:"#ff2020",det:"5,000+ objetivos destruidos. 8 soldados muertos. Trump: 'guerra muy completa' y luego 'victoria total' en el mismo día. EE.UU. e Israel discuten operación para incautar uranio iraní enriquecido. Hegseth: el día más intenso de ataques hasta ahora."},
    "364":{name:"🇮🇷 IRÁN",fecha:"DÍA 11",c:"#ff1a1a",det:"IRGC: 'Irán decide cuándo termina'. FM Araghchi: no habrá negociación con EE.UU. Internet apagado 240+ horas, récord mundial. 1,255+ muertos. Mojtaba Jamenei, hijo, es el nuevo Líder Supremo. 500+ misiles y 2,000+ drones lanzados desde el día 1."},
    "376":{name:"🇮🇱 ISRAEL",fecha:"DÍA 11",c:"#ff1a1a",det:"Ataca infraestructura financiera Hezbollah en Beirut. Usa fósforo blanco en sur del Líbano (HRW). 82% israelíes apoya las operaciones. Discute con EE.UU. operación para incautar reservas de uranio iraní enriquecido."},
    "422":{name:"🇱🇧 LÍBANO",fecha:"DÍA 11",c:"#ff4444",det:"486+ muertos: 83 niños, 42 mujeres. Beirut sur bajo bombardeo. Israel atacó red financiera Al-Qard Al-Hassan (Hezbollah). Fósforo blanco confirmado por HRW."},
    "804":{name:"🇺🇦 UCRANIA",fecha:"EN CURSO",c:"#ff8800",det:"Guerra con Rusia año 5. Ucrania ayuda a EE.UU. analizando drones Shahed iraníes. Zelenski: esto es la Tercera Guerra Mundial."},
    "643":{name:"🇷🇺 RUSIA",fecha:"10 MAR",c:"#ff4400",det:"Putin habló con Trump sobre Irán y Ucrania. Rusia da a Irán coordenadas de buques y aviones de EE.UU. Triple beneficio: energía cara, distracción occidental, menos ayuda a Ucrania."},
    "682":{name:"🇸🇦 SAUDI",fecha:"10 MAR",c:"#ff9900",det:"Saudi Aramco cerró Ras Tanura, mayor refinería del mundo. EE.UU. evacuó diplomáticos no esenciales. Drones sobre el campo Shaybah interceptados."},
    "634":{name:"🇶🇦 QATAR",fecha:"10 MAR",c:"#ff8800",det:"Qatar declaró fuerza mayor en exportaciones de LNG — 20% del gas mundial interrumpido. Un mes para normalizar producción. Precio podría llegar a $150/barril."},
    "48": {name:"🇧🇭 BAHRAIN",fecha:"10 MAR",c:"#ff8800",det:"BAPCO declaró force majeure. Drone iraní causó incendio en Riffa. 32 heridos en zona residencial. Primer gran productor del Golfo en colapso operativo."},
    "792":{name:"🇹🇷 TURQUÍA",fecha:"10 MAR",c:"#ffcc00",det:"Defensa aérea OTAN derribó misil balístico iraní en su espacio aéreo. Erdogan convocó el Artículo 4. Mediador activo."},
    "156":{name:"🇨🇳 CHINA",fecha:"10 MAR",c:"#ffcc00",det:"Compra petróleo iraní con descuento. Xi prepara reunión con Trump. Aranceles 145% + crisis energética: doble presión. Wang Yi: cese inmediato."},
    "356":{name:"🇮🇳 INDIA",fecha:"10 MAR",c:"#ffaa44",det:"Exención 30 días para comprar petróleo iraní. 18K ciudadanos evacuando Irán."},
    "484":{name:"🇲🇽 MÉXICO",fecha:"10 MAR",c:"#88cc00",det:"Gasolina +22%. Peso en mínimos. Aranceles 35% Trump. Sarampión activo. Cuádruple crisis: energética, sanitaria, arancelaria, económica."},
    "250":{name:"🇫🇷 FRANCIA",fecha:"10 MAR",c:"#4466ff",det:"Charles de Gaulle en Mediterráneo oriental. Macron condenó ataques a civiles. Canciller iraní advirtió que Europa puede ser objetivo legítimo."},
    "826":{name:"🇬🇧 UK",fecha:"10 MAR",c:"#4466ff",det:"Autorizó bases en Chipre. Akrotiri atacada. Aranceles Trump 25% — Libra perdió 3.5%."},
    "196":{name:"🇨🇾 CHIPRE",fecha:"10 MAR",c:"#ff8800",det:"RAF Akrotiri, primer suelo OTAN atacado por Irán. 5 países defienden Chipre."},
  },
  disease: {
    "484":{name:"🇲🇽 MÉXICO",fecha:"MAR 2026",c:"#ff2200",det:"9,074 casos sarampión desde ene 2025. 7 estados focos rojos: Jalisco, Colima, Chiapas, Sinaloa, Nayarit, Tabasco y CDMX. OPS alerta por Mundial 2026. Llama 800-00-44800."},
    "840":{name:"🇺🇸 EE.UU.",fecha:"MAR 2026",c:"#ffaa00",det:"H5N1 en 47 estados. Primera transmisión humana confirmada. Mpox clade I: 4 casos sin viaje a África, posible transmisión local. EE.UU. se retiró de la OMS."},
    "180":{name:"🇨🇩 CONGO",fecha:"EN CURSO",c:"#ff6600",det:"Epicentro mpox. Variante clade Ib. 100K+ casos. OMS emergencia global desde 2024."},
    "76": {name:"🇧🇷 BRASIL",fecha:"EN CURSO",c:"#ff6600",det:"5M casos dengue, 5K muertes. DENV-3 reemergente. Colapso hospitalario."},
    "430":{name:"🇱🇷 LIBERIA",fecha:"FEB 2026",c:"#cc0000",det:"Ébola detectado febrero 2026. 300 contactos. Mortalidad 65%."},
    "729":{name:"🇸🇩 SUDÁN",fecha:"EN CURSO",c:"#ff8800",det:"Cólera en guerra civil. 200K casos, 3K muertes. Ayuda bloqueada."},
    "356":{name:"🇮🇳 INDIA",fecha:"EN CURSO",c:"#ff4400",det:"Nipah 5 casos, 100 en cuarentena. Mortalidad 70%. Dengue activo."},
    "156":{name:"🇨🇳 CHINA",fecha:"MAR 2026",c:"#ff4400",det:"COVID XEC detectada. Influenza H3N2 intensa. Vigilancia reforzada."},
  },
  climate: {
    "840":{name:"🇺🇸 TORNADOS",fecha:"MAR 2026",c:"#aa44ff",det:"23 tornados en 24h en Tornado Alley. 3 EF4 a 280 km/h. 8 muertos, 140 heridos. Frente ártico -35°C simultáneo."},
    "356":{name:"🇮🇳 CALOR",fecha:"EN CURSO",c:"#ff2200",det:"47-51°C. 3,200 muertes. Récord absoluto. Alerta roja en 8 estados."},
    "484":{name:"🇲🇽 CLIMA",fecha:"MAR 2026",c:"#8844ff",det:"Frente Frío 39 activo. Nieve posible en Nevado de Toluca. Mínimas 3-5°C en el Valle. Golfo de México 2°C sobre lo normal — temporada ciclones."},
    "36": {name:"🇦🇺 INCENDIOS",fecha:"EN CURSO",c:"#ff3300",det:"2.1M hectáreas quemadas. 12 muertos. Aire peligroso en Sídney."},
    "76": {name:"🇧🇷 INUNDACIONES",fecha:"EN CURSO",c:"#0055ff",det:"200K evacuados en Rio Grande do Sul. Pérdidas en soja y maíz."},
    "392":{name:"🇯🇵 SISMOS",fecha:"EN CURSO",c:"#ffaa00",det:"Alta sismicidad. Múltiples M5 USGS. Sakurajima en actividad elevada."},
    "360":{name:"🇮🇩 VOLCANES",fecha:"EN CURSO",c:"#ff9900",det:"Merapi alerta naranja. 127 volcanes activos. País más volcánico del mundo."},
    "124":{name:"🇨🇦 FRÍO",fecha:"MAR 2026",c:"#00ccff",det:"-35°C en Manitoba y Saskatchewan. Récord de nieve en Alberta."},
  },
  news: {
    "840":{name:"🇺🇸 EE.UU.",fecha:"10 MAR",c:"#ff6600",det:"Brent tocó $119. Gas: $3.48/galón (+17%). 8 soldados muertos. Empleos -92K en febrero. Desempleo 4.4%. Aranceles 25% a Europa el 15 marzo."},
    "364":{name:"🇮🇷 IRÁN",fecha:"10 MAR",c:"#ff4444",det:"IRGC decide fin de la guerra. Internet apagado récord. Qatar LNG fuerza mayor — 20% gas mundial."},
    "682":{name:"🇸🇦 SAUDI",fecha:"10 MAR",c:"#ffaa00",det:"Aramco cierra Ras Tanura. Iraq, UAE, Kuwait cortaron producción. Ormuz -95% tráfico."},
    "156":{name:"🇨🇳 CHINA",fecha:"10 MAR",c:"#ffcc00",det:"Compra petróleo iraní barato. Exportaciones suben pese a aranceles 145%."},
    "484":{name:"🇲🇽 MÉXICO",fecha:"10 MAR",c:"#ffaa44",det:"Peso >18/USD. Gasolina +22%. Aranceles 35% Trump. FMI: recesión Q3 si guerra dura 4+ semanas."},
    "276":{name:"🇩🇪 ALEMANIA",fecha:"10 MAR",c:"#4488ff",det:"CDU 29%, AfD 20% histórico. Merz negocia coalición. Rechaza aranceles 25%."},
    "826":{name:"🇬🇧 UK",fecha:"10 MAR",c:"#4466ff",det:"Libra -3.5%. Starmer busca acuerdo bilateral con EE.UU."},
    "392":{name:"🇯🇵 JAPÓN",fecha:"10 MAR",c:"#ff3344",det:"Tokio -9.1%. Importa 90% petróleo del Golfo. Sony y Toyota en alerta."},
    "643":{name:"🇷🇺 RUSIA",fecha:"10 MAR",c:"#ff7700",det:"Demanda de energía rusa aumentó significativamente. Beneficio triple por la guerra."},
  },
};

const BASE_WAR = [
  {id:"usa",name:"EE.UU.",lat:38,lng:-97,c:"#ff2020",s:5,st:"guerra",conn:["iran"],fecha:"DÍA 11",det:"5,000+ objetivos destruidos. 8 soldados muertos. Trump: señales mixtas entre 'guerra completa' y 'victoria total'. Operación para incautar uranio iraní en discusión."},
  {id:"iran",name:"IRÁN",lat:32.4,lng:53.7,c:"#ff1a1a",s:5,st:"guerra",conn:["israel"],fecha:"DÍA 11",det:"IRGC decide cuándo termina la guerra. Internet apagado 240+ horas récord. 1,255+ muertos. 500+ misiles y 2,000+ drones lanzados desde el día 1."},
  {id:"israel",name:"ISRAEL",lat:31,lng:34.9,c:"#ff1a1a",s:5,st:"guerra",conn:["lebanon"],fecha:"DÍA 11",det:"Ataca infraestructura Hezbollah en Beirut. Fósforo blanco en sur del Líbano (HRW). Discute con EE.UU. incautación de uranio iraní."},
  {id:"lebanon",name:"LÍBANO",lat:33.9,lng:35.5,c:"#ff4444",s:4,st:"guerra",fecha:"DÍA 11",det:"486+ muertos. 83 niños, 42 mujeres. Fósforo blanco confirmado por HRW."},
  {id:"ukraine",name:"UCRANIA",lat:48.4,lng:31.2,c:"#ff8800",s:4,st:"guerra",conn:["russia"],fecha:"EN CURSO",det:"Guerra con Rusia año 5. Ayuda a EE.UU. con análisis de drones Shahed iraníes. Zelenski: ya es la Tercera Guerra Mundial."},
  {id:"russia",name:"RUSIA\n⚠️INTEL",lat:61.5,lng:105,c:"#ff4400",s:4,st:"activo",fecha:"10 MAR",det:"Da a Irán coordenadas de buques y aviones de EE.UU. Confirmado por 3 fuentes. Putin habló con Trump sobre Irán y Ucrania."},
  {id:"gulf",name:"GOLFO\n🔴CRISIS",lat:24.5,lng:51.2,c:"#ff6600",s:5,st:"atacado",fecha:"10 MAR",det:"Bahrain BAPCO force majeure. Saudi Aramco cierra Ras Tanura. Qatar LNG fuerza mayor. Ormuz: -95% tráfico. 300 petroleros atrapados."},
  {id:"ormuz",name:"ORMUZ\n-95% TRÁFICO",lat:26.6,lng:56.5,c:"#ff8800",s:5,st:"critico",fecha:"10 MAR",det:"Tráfico de petroleros cayó 95%. 300+ barcos atrapados. Citigroup: pérdida de 7-11 millones barriles/día. Brent tocó $119 el lunes."},
  {id:"school",name:"ESCUELA\n168 NIÑOS",lat:27.5,lng:55,c:"#ff2200",s:5,st:"critico",fecha:"10 MAR",det:"Strike de EE.UU. el día 1 mató 168 niñas en escuela primaria en el sureste de Irán. Bellingcat y NPR lo verificaron. Pentágono investiga. Trump culpa a Irán."},
  {id:"turkey",name:"TURQUÍA\n🛡️OTAN",lat:39,lng:35,c:"#ffcc00",s:3,st:"tension",fecha:"10 MAR",det:"Turquía derribó misil balístico iraní con defensa OTAN. Primer incidente colectivo de la guerra. Erdogan convocó el Artículo 4."},
];

const CARRIERS = [
  {id:"ford",name:"USS FORD",flag:"🇺🇸",pais:"USA",lat:22.8,lng:61.5,dlat:0.008,dlng:-0.012,fecha:"DÍA 11",det:"USS Gerald R. Ford CVN-78. Mar Arábigo occidental. F-35C activos. Día más intenso de ataques según Hegseth. Rumbo noroeste."},
  {id:"ike",name:"USS IKE",flag:"🇺🇸",pais:"USA",lat:13.8,lng:54.2,dlat:0.006,dlng:0.009,fecha:"DÍA 11",det:"USS Eisenhower CVN-69. Golfo de Adén. 600+ Tomahawks lanzados. Interceptando drones iraníes."},
  {id:"tr",name:"USS ROSVLT",flag:"🇺🇸",pais:"USA",lat:18.2,lng:58.5,dlat:0.01,dlng:-0.008,fecha:"DÍA 11",det:"USS Theodore Roosevelt CVN-71. Mar de Omán. Bloquea salidas iraníes al Índico."},
  {id:"linc",name:"USS LINCOLN",flag:"🇺🇸",pais:"USA",lat:13.1,lng:48.8,dlat:0.007,dlng:0.006,fecha:"DÍA 11",det:"USS Lincoln CVN-72. Mar Rojo sur. Cuarto portaaviones. Escoltando suministros."},
  {id:"dg",name:"CHARLES D.G.",flag:"🇫🇷",pais:"FRANCE",lat:35.2,lng:26.1,dlat:-0.004,dlng:0.011,fecha:"DÍA 11",det:"Charles de Gaulle R91. Mediterráneo oriental. Único portaaviones nuclear no estadounidense. Defiende Chipre con 4 fragatas."},
];

const ATTACK_ROUTES = [
  {from:{lat:32.4,lng:53.7},to:{lat:31.0,lng:34.9},col:"#ff4400",label:"misil"},
  {from:{lat:31.0,lng:34.9},to:{lat:32.4,lng:53.7},col:"#4488ff",label:"strike"},
  {from:{lat:22.8,lng:61.5},to:{lat:26.6,lng:56.5},col:"#4488ff",label:"tomahawk"},
  {from:{lat:32.4,lng:53.7},to:{lat:26.2,lng:50.5},col:"#ff6600",label:"drone"},
  {from:{lat:32.4,lng:53.7},to:{lat:24.5,lng:51.2},col:"#ff6600",label:"drone"},
  {from:{lat:18.2,lng:58.5},to:{lat:27.5,lng:55},col:"#4488ff",label:"strike"},
];

const BASE_DISEASE = [
  {id:"saramp",name:"SARAMPIÓN\nMX 🔴",lat:19.4,lng:-99.1,c:"#ff2200",s:4,st:"alerta",pulse:true,fecha:"10 MAR",det:"9,074 casos. 7 estados focos rojos. OPS alerta por Mundial 2026. Llama 800-00-44800."},
  {id:"mpox",name:"MPOX\nCONGO",lat:0.3,lng:25.5,c:"#ff6600",s:4,st:"activo",pulse:true,fecha:"EN CURSO",det:"100K+ casos. Clade Ib. OMS emergencia global. Mpox clade I ya en EE.UU. sin historial de viaje."},
  {id:"h5n1",name:"H5N1\nUSA",lat:37.1,lng:-95.7,c:"#ffaa00",s:4,st:"alerta",pulse:true,fecha:"EN CURSO",det:"47 estados, primera transmisión humana 2026. OMS alerta pandémica máxima."},
  {id:"dengue",name:"DENGUE\nBRASIL",lat:-10,lng:-55,c:"#ff6600",s:3,st:"activo",pulse:false,fecha:"EN CURSO",det:"5M casos, 5K muertes. DENV-3 reemergente. Colapso hospitalario."},
  {id:"nipah",name:"NIPAH\nINDIA",lat:10.5,lng:76.2,c:"#cc0000",s:4,st:"alerta",pulse:true,fecha:"ENE 2026",det:"5 casos. 100 en cuarentena. Mortalidad 70%. Sin tratamiento específico."},
  {id:"cholera",name:"CÓLERA\nSUDÁN",lat:15.6,lng:32.5,c:"#ff8800",s:3,st:"activo",pulse:false,fecha:"EN CURSO",det:"200K casos, 3K muertes. Sin agua potable. Ayuda bloqueada."},
  {id:"ebola",name:"ÉBOLA\nLIBERIA",lat:6.3,lng:-10.8,c:"#cc0000",s:4,st:"alerta",pulse:true,fecha:"FEB 2026",det:"Nuevo brote. Mortalidad 65%. 300 contactos bajo rastreo."},
];

const BASE_CLIMATE = [
  {id:"heat",name:"OLA CALOR\nINDIA",lat:26,lng:80,c:"#ff2200",s:5,st:"extremo",icon:"🔥",pulse:true,fecha:"EN CURSO",det:"47-51°C. 3,200 muertes. Récord absoluto. Alerta roja 8 estados."},
  {id:"flood",name:"INUNDACIONES\nEUROPA",lat:47,lng:16,c:"#0066ff",s:4,st:"activo",icon:"🌊",pulse:true,fecha:"MAR 2026",det:"Danubio 8.4m. 45K evacuados en Austria, Hungría y Eslovaquia."},
  {id:"fire",name:"INCENDIOS\nAUSTRALIA",lat:-33,lng:149,c:"#ff3300",s:4,st:"extremo",icon:"🔥",pulse:true,fecha:"EN CURSO",det:"2.1M hectáreas quemadas. 12 muertos. Aire peligroso en Sídney."},
  {id:"tornado",name:"TORNADOS\nUSA",lat:36,lng:-97,c:"#aa44ff",s:4,st:"activo",icon:"🌪️",pulse:true,fecha:"MAR 2026",det:"23 tornados en 24h. 3 EF4 a 280 km/h. 8 muertos, 140 heridos."},
  {id:"cold",name:"FRÍO 39\nMÉXICO",lat:28,lng:-100,c:"#00ccff",s:3,st:"activo",icon:"🧊",pulse:true,fecha:"MAR 2026",det:"Frente Frío 39. Nieve en Nevado de Toluca. Mínimas 3-5°C en Valle de México."},
];

const BASE_NEWS = [
  {id:"oil",name:"BRENT ~$90\n⬆️VOLÁTIL",lat:26.6,lng:56.5,c:"#ffaa00",s:5,st:"critico",icon:"🛢️",fecha:"10 MAR",det:"Brent tocó $119 el lunes, regresa a ~$90. Ormuz -95% tráfico. Citigroup: pérdida 7-11M barriles/día. Qatar: riesgo $150 si Ormuz sigue."},
  {id:"trump",name:"TRUMP\nSEÑALES MIXTAS",lat:38,lng:-97,c:"#ff6600",s:5,st:"critico",icon:"🗣️",fecha:"10 MAR",det:"'Guerra muy completa' y luego 'victoria total' el mismo día. Amenaza a Irán: 'golpearemos 20 veces más fuerte' si toca Ormuz. Mercados suben y bajan con cada declaración."},
  {id:"jobs",name:"EMPLEOS\n-92K FEB",lat:38,lng:-95,c:"#ff3344",s:4,st:"activo",icon:"📊",fecha:"7 MAR",det:"EE.UU. perdió 92K empleos en febrero. Peor desde COVID. Desempleo 4.4%. Bono a 10 años: 4.13%. Fed: tasas altas más tiempo."},
  {id:"bapco",name:"BAHRAIN\n🔴FORCE MAJ.",lat:26.2,lng:50.5,c:"#ff4444",s:4,st:"critico",icon:"🔥",fecha:"10 MAR",det:"BAPCO declaró force majeure. Primer gran productor del Golfo en colapso operativo por la guerra."},
  {id:"stocks",name:"BOLSAS\nREBOTE",lat:40.7,lng:-74,c:"#44cc88",s:3,st:"activo",icon:"📈",fecha:"10 MAR",det:"Rebote global mientras el petróleo baja de $119 a $90. Frágil: empleos caídos, guerra activa, Ormuz cerrado."},
  {id:"peso",name:"MÉXICO\nPESO >18",lat:19.4,lng:-99.1,c:"#ffaa44",s:4,st:"activo",icon:"💱",fecha:"10 MAR",det:"Peso rompió barrera de 18/USD. Gasolina +22%. FMI: recesión México Q3 si la guerra dura 4+ semanas."},
  {id:"nato_s",name:"OTAN\n12 MAR BRUSELAS",lat:50.9,lng:4.4,c:"#4466ff",s:3,st:"activo",icon:"🛡️",fecha:"12 MAR",det:"Cumbre extraordinaria el 12 de marzo. Solo 8/32 cumplen 2% del PIB. Trump exige 5%. Turquía derribó misil iraní — primer incidente colectivo."},
  {id:"soccer",name:"FÚTBOL IRANÍ\nASILO AUSTRALIA",lat:-33.8,lng:151,c:"#ff9900",s:2,st:"activo",icon:"⚽",fecha:"10 MAR",det:"5 jugadoras del equipo femenil iraní pidieron asilo en Australia durante la Copa Asiática. Australia confirmó protección policial."},
];

// ═══════════════════════════════════════════════════════════════════
// MODE VOICE ANNOUNCEMENTS
// ═══════════════════════════════════════════════════════════════════
const MODE_VOICE = {
  war: "Conflictos globales. Día once de la guerra. EE.UU. destruyó cinco mil objetivos. Brent tocó ciento diecinueve dólares. Bahrain declaró fuerza mayor. Qatar interrumpió el veinte por ciento del gas mundial.",
  disease: "Modo enfermedades. Nueve mil setenta y cuatro casos de sarampión en México. Mpox clade uno ya en EE.UU. sin historial de viaje. Nipah activo en India con mortalidad del setenta por ciento.",
  climate: "Modo clima. Frente Frío treinta y nueve activo en México hoy. Tornados EF cuatro activos en Estados Unidos. Ola de calor histórica en India con cincuenta y un grados. Sismos y huracanes en tiempo real.",
  news: "Modo economía. El Brent tocó ciento diecinueve dólares el lunes. Bahrain y Qatar declararon fuerza mayor. Ormuz al noventa y cinco por ciento menos tráfico. Empleos de EE.UU. cayeron noventa y dos mil en febrero.",
};

// ═══════════════════════════════════════════════════════════════════
// EMERGENCY ALERT SYSTEM
// ═══════════════════════════════════════════════════════════════════
function haversine(la1,lo1,la2,lo2){const R=6371,dL=(la2-la1)*Math.PI/180,dl=(lo2-lo1)*Math.PI/180,a=Math.sin(dL/2)**2+Math.cos(la1*Math.PI/180)*Math.cos(la2*Math.PI/180)*Math.sin(dl/2)**2;return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));}
const TSUNAMI_ZONES=[{lat:17.5,lng:-101},{lat:15.9,lng:-97},{lat:19.1,lng:-104},{lat:18.1,lng:-102},{lat:38,lng:143},{lat:-30,lng:-71},{lat:5,lng:95}];
function isTsunamiRisk(lat,lng,mag){if(mag<7.5)return false;return TSUNAMI_ZONES.some(z=>haversine(lat,lng,z.lat,z.lng)<400);}
const ALERT_LEVELS={ROJO:{label:"🔴 MÁXIMA ALERTA",color:"#ff0000",bg:"rgba(40,0,0,0.97)"},NARANJA:{label:"🟠 ALERTA CRÍTICA",color:"#ff6600",bg:"rgba(35,10,0,0.97)"},AMARILLO:{label:"🟡 ALERTA URGENTE",color:"#ffcc00",bg:"rgba(30,25,0,0.97)"}};

function useEmergencyAlerts(quakes,hurricanes){
  const[alerts,setAlerts]=useState([]);
  const shown=useRef(new Set());
  const ac_ref=useRef(null);
  const getCtx=useCallback(()=>{if(!ac_ref.current)ac_ref.current=new(window.AudioContext||window.webkitAudioContext)();if(ac_ref.current.state==="suspended")ac_ref.current.resume();return ac_ref.current;},[]);

  const siren=useCallback((level)=>{try{const c=getCtx(),t=c.currentTime,fs=level==="ROJO"?[880,1047,880,1320,880]:[660,880,660];fs.forEach((f,i)=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="square";o.frequency.value=f;const d=i*0.2;g.gain.setValueAtTime(0,t+d);g.gain.linearRampToValueAtTime(0.2,t+d+0.05);g.gain.exponentialRampToValueAtTime(0.001,t+d+0.18);o.start(t+d);o.stop(t+d+0.19);});}catch(e){}},[getCtx]);

  const push=useCallback((a)=>{if(shown.current.has(a.id))return;shown.current.add(a.id);siren(a.level);setTimeout(()=>speakText(a.voice,1.1),400);setAlerts(p=>[{...a,ts:Date.now()},...p].slice(0,3));},[siren]);
  const dismiss=useCallback(id=>setAlerts(p=>p.filter(a=>a.id!==id)),[]);

  useEffect(()=>{const iv=setInterval(()=>{const now=Date.now();setAlerts(p=>p.filter(a=>(now-a.ts)<5*60*1000));},10000);return()=>clearInterval(iv);},[]);

  // USGS M7+ cada 60s
  useEffect(()=>{
    const check=async()=>{try{const r=await fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_day.geojson");const d=await r.json();const now=Date.now();
      d.features.forEach(f=>{const mag=f.properties.mag,place=f.properties.place||"zona",lat=f.geometry.coordinates[1],lng=f.geometry.coordinates[0],age=(now-f.properties.time)/60000;
        if(age>120||mag<7)return;const id=`q_${f.id}`;const ts=isTsunamiRisk(lat,lng,mag);const mx=haversine(lat,lng,23.6,-102.5)<2500;const lv=mag>=8?"ROJO":mag>=7.5?"NARANJA":"AMARILLO";
        push({id,level:lv,icon:ts?"🌊🌋":"🌋",title:`SISMO M${mag.toFixed(1)} — ${place.toUpperCase().substring(0,40)}`,detail:`Magnitud ${mag.toFixed(1)} hace ${Math.round(age)} min. Prof: ${Math.round(f.geometry.coordinates[2])}km.${ts?" ⚠️ ALERTA TSUNAMI.":""}${mx?" Posible impacto en México.":""}`,voice:ts?`Alerta máxima. Sismo de magnitud ${mag.toFixed(1)} en ${place}. Alerta de tsunami activa. Aléjate de las costas inmediatamente.`:`Alerta sísmica. Magnitud ${mag.toFixed(1)} en ${place}.${mx?" Posible impacto en México.":""}`});});
    }catch(e){}};
    check();const iv=setInterval(check,60000);return()=>clearInterval(iv);
  },[push]);

  // Huracanes Cat3+ cerca de México
  useEffect(()=>{
    hurricanes.forEach(h=>{if(h.kts<96)return;const dist=haversine(h.lat,h.lng,23.6,-102.5);if(dist>1800)return;const id=`h_${h.id}_${hurCat(h.kts)}`;const lv=h.kts>=137?"ROJO":h.kts>=113?"NARANJA":"AMARILLO";push({id,level:lv,icon:"🌀",title:`HURACÁN ${h.name} ${hurCat(h.kts)} AMENAZA MÉXICO`,detail:`${hurCat(h.kts)}, ${Math.round(h.kts*1.852)} km/h. A ${Math.round(dist)} km de México.`,voice:`Alerta máxima. Huracán ${h.name} categoría ${hurCat(h.kts).replace("CAT","")}. Prepara mochila de emergencia y sigue instrucciones de Protección Civil.`});});
  },[hurricanes,push]);

  // IA cada 8 min para guerra/economía/salud
  useEffect(()=>{
    const check=async(mode)=>{
      const prompts={war:`Últimos 30 minutos: ¿Hubo uso de arma nuclear, arma química/biológica, o nuevo país grande entrando en la guerra Irán EE.UU.? Solo JSON sin markdown: {"alert":false} o {"alert":true,"level":"ROJO","title":"8 palabras","detail":"20 palabras","voice":"25 palabras"}`,news:`Últimos 30 minutos: ¿Hubo circuit breaker en NYSE, devaluación peso MX mayor 8%, petróleo subió 15%+ en una hora, o quiebra de banco sistémico? Solo JSON: {"alert":false} o {"alert":true,"level":"NARANJA","title":"8 palabras","detail":"20 palabras","voice":"25 palabras"}`,disease:`Últimos 30 minutos: ¿Nueva pandemia declarada OMS, ébola en ciudad 1M+ habitantes, o nueva variante resistente a todas las vacunas? Solo JSON: {"alert":false} o {"alert":true,"level":"ROJO","title":"8 palabras","detail":"20 palabras","voice":"25 palabras"}`};
      try{const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:160,tools:[{type:"web_search_20250305",name:"web_search"}],messages:[{role:"user",content:prompts[mode]}]})});
        const data=await r.json();const raw=data.content?.filter(b=>b.type==="text").map(b=>b.text).join("").trim();if(!raw)return;
        const p=JSON.parse(raw.replace(/```json|```/g,"").trim());if(!p.alert)return;
        const icons={war:"💥⚔️",news:"📉💸",disease:"☣️🦠"};push({id:`ai_${mode}_${Date.now().toString(36)}`,level:p.level||"NARANJA",icon:icons[mode]||"⚠️",title:p.title||"ALERTA CRÍTICA",detail:p.detail||"",voice:p.voice||p.title||"Alerta crítica."});}catch(e){}};
    const modes=["war","news","disease"];let i=0;
    check(modes[0]);const iv=setInterval(()=>{i=(i+1)%modes.length;check(modes[i]);},8*60*1000);return()=>clearInterval(iv);
  },[push]);

  return{alerts,dismiss};
}

function EmergencyBanner({alerts,dismiss}){
  const[tick,setTick]=useState(0);
  useEffect(()=>{const iv=setInterval(()=>setTick(t=>t+1),1000);return()=>clearInterval(iv);},[]);
  if(!alerts.length)return null;
  return(
    <div style={{position:"fixed",top:0,left:0,right:0,zIndex:9999,display:"flex",flexDirection:"column",pointerEvents:"none"}}>
      {alerts.map(a=>{const lv=ALERT_LEVELS[a.level]||ALERT_LEVELS.NARANJA;const rem=Math.max(0,300-Math.floor((Date.now()-a.ts)/1000));const pulse=tick%2===0;
        return(<div key={a.id} style={{background:lv.bg,borderBottom:`2px solid ${lv.color}`,padding:"10px 16px",display:"flex",alignItems:"center",gap:"12px",pointerEvents:"all",boxShadow:`0 0 40px ${lv.color}88`,backdropFilter:"blur(8px)",animation:"slideDown 0.3s ease"}}>
          <span style={{fontSize:"26px",opacity:pulse?1:0.4,transition:"opacity 0.5s",flexShrink:0}}>{a.icon}</span>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"}}>
              <span style={{fontSize:"7px",background:lv.color,color:"#000",padding:"2px 8px",borderRadius:"2px",fontWeight:"900",letterSpacing:"2px"}}>{lv.label}</span>
              <span style={{fontSize:"12px",fontWeight:"900",color:lv.color,textShadow:`0 0 10px ${lv.color}`,fontFamily:"'Courier New',monospace",letterSpacing:"1px"}}>{a.title}</span>
            </div>
            <div style={{fontSize:"9px",color:"#ddd",marginTop:"3px",lineHeight:1.5}}>{a.detail}</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"4px",flexShrink:0}}>
            <button onClick={()=>dismiss(a.id)} style={{background:"none",border:`1px solid ${lv.color}55`,borderRadius:"3px",color:lv.color,cursor:"pointer",fontSize:"14px",padding:"2px 8px",fontFamily:"'Courier New',monospace"}}>✕</button>
            <div style={{fontSize:"8px",color:`${lv.color}99`,fontFamily:"'Courier New',monospace"}}>{Math.floor(rem/60)}:{String(rem%60).padStart(2,"0")}</div>
            <button onClick={()=>speakText(a.voice,1.1)} style={{background:"none",border:`1px solid ${lv.color}22`,borderRadius:"2px",color:`${lv.color}77`,cursor:"pointer",fontSize:"7px",padding:"1px 5px"}}>🔊</button>
          </div>
        </div>);
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// LIVE DATA HOOKS
// ═══════════════════════════════════════════════════════════════════

// Tipo de cambio MXN/USD — Frankfurter (gratis, sin clave)
function useFX(){
  const[rate,setRate]=useState(null);
  useEffect(()=>{
    const go=async()=>{try{const r=await fetch("https://api.frankfurter.app/latest?from=USD&to=MXN");const d=await r.json();if(d.rates?.MXN)setRate(d.rates.MXN.toFixed(2));}catch(e){}};
    go();const iv=setInterval(go,5*60*1000);return()=>clearInterval(iv);
  },[]);
  return rate;
}

// Bitcoin / precio crypto — CoinGecko (gratis)
function useCrypto(){
  const[prices,setPrices]=useState({});
  useEffect(()=>{
    const go=async()=>{try{const r=await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,oil&vs_currencies=usd&include_24hr_change=true");const d=await r.json();setPrices(d);}catch(e){}};
    go();const iv=setInterval(go,3*60*1000);return()=>clearInterval(iv);
  },[]);
  return prices;
}

// Aviones reales OpenSky — Medio Oriente (gratis, sin clave)
function useOpenSky(active){
  const[planes,setPlanes]=useState([]);
  useEffect(()=>{
    if(!active){setPlanes([]);return;}
    const go=async()=>{try{const r=await fetch("https://opensky-network.org/api/states/all?lamin=15&lomin=42&lamax=38&lomax=68");const d=await r.json();if(d?.states){setPlanes(d.states.filter(s=>s[6]&&s[5]&&s[7]>100).slice(0,25).map(s=>({id:s[0],cs:(s[1]||"").trim(),lat:s[6],lng:s[5],alt:s[7],hdg:s[10]||0,vel:s[9]||0})));}}catch(e){}};
    go();const iv=setInterval(go,60*1000);return()=>clearInterval(iv);
  },[active]);
  return planes;
}

// NASA EONET — desastres naturales (gratis, sin clave)
function useEONET(active){
  const[events,setEvents]=useState([]);
  useEffect(()=>{
    if(!active)return;
    const go=async()=>{try{const r=await fetch("https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=20&days=7");const d=await r.json();if(d?.events){setEvents(d.events.filter(e=>e.geometry?.length).map(e=>{const g=e.geometry[e.geometry.length-1];return{id:e.id,title:e.title,cat:e.categories?.[0]?.title||"",lat:g.coordinates[1],lng:g.coordinates[0]};}).filter(e=>e.lat&&e.lng));}}catch(e){}};
    go();const iv=setInterval(go,15*60*1000);return()=>clearInterval(iv);
  },[active]);
  return events;
}

// ═══════════════════════════════════════════════════════════════════
// MOVING CARRIERS HOOK
// ═══════════════════════════════════════════════════════════════════
function useMovingCarriers(){
  const[cpos,setCpos]=useState(()=>Object.fromEntries(CARRIERS.map(c=>([c.id,{lat:c.lat,lng:c.lng,prog:0}]))));
  useEffect(()=>{
    const iv=setInterval(()=>{
      setCpos(prev=>{const n={...prev};CARRIERS.forEach(c=>{const p=prev[c.id]||{lat:c.lat,lng:c.lng,prog:0};const spd=0.003;const lat=p.lat+c.dlat*spd;const lng=p.lng+c.dlng*spd;
        const bounded={lat:Math.max(10,Math.min(45,lat)),lng:Math.max(20,Math.min(80,lng))};
        n[c.id]={...bounded,prog:(p.prog||0)+spd};});return n;});
    },200);
    return()=>clearInterval(iv);
  },[]);
  return cpos;
}

// ═══════════════════════════════════════════════════════════════════
// ATTACK ANIMATION HOOK
// ═══════════════════════════════════════════════════════════════════
function useAttacks(active){
  const[attacks,setAttacks]=useState([]);
  const timerRef=useRef(null);
  useEffect(()=>{
    if(!active){setAttacks([]);return;}
    const launch=()=>{
      const route=ATTACK_ROUTES[Math.floor(Math.random()*ATTACK_ROUTES.length)];
      const id=Date.now()+Math.random();
      setAttacks(p=>[...p,{...route,id,prog:0}].slice(-12));
    };
    timerRef.current=setInterval(()=>{if(Math.random()>0.45)launch();},2500);
    const anim=setInterval(()=>{setAttacks(p=>p.map(a=>({...a,prog:Math.min(1,a.prog+0.035)})).filter(a=>a.prog<1));},40);
    return()=>{clearInterval(timerRef.current);clearInterval(anim);};
  },[active]);
  return attacks;
}

// ═══════════════════════════════════════════════════════════════════
// GEOLOCATION
// ═══════════════════════════════════════════════════════════════════
function useGeoLocation(){
  const[loc,setLoc]=useState({lat:FALLBACK_LAT,lng:FALLBACK_LNG,municipio:"Cargando...",tz:"America/Mexico_City"});
  useEffect(()=>{
    if(!navigator.geolocation)return;
    const ok=async(pos)=>{
      const{latitude:lat,longitude:lng}=pos.coords;
      let municipio="Tu ubicación",tz="America/Mexico_City";
      try{const r=await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`);const d=await r.json();const a=d.address||{};municipio=a.municipality||a.city_district||a.city||a.town||a.village||a.county||"Tu municipio";}catch(e){}
      try{const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&timezone=auto&forecast_days=1&hourly=temperature_2m`);const d=await r.json();if(d.timezone)tz=d.timezone;}catch(e){}
      setLoc({lat,lng,municipio,tz});
    };
    navigator.geolocation.getCurrentPosition(ok,()=>{},{timeout:8000});
    const iv=setInterval(()=>navigator.geolocation.getCurrentPosition(ok,()=>{},{timeout:8000}),5*60*1000);
    return()=>clearInterval(iv);
  },[]);
  return loc;
}

// ═══════════════════════════════════════════════════════════════════
// WEATHER WIDGET
// ═══════════════════════════════════════════════════════════════════
function WeatherWidget({ac,loc}){
  const[wx,setWx]=useState(null);const[rain,setRain]=useState(null);const[aqi,setAqi]=useState(null);
  useEffect(()=>{
    if(!loc?.lat)return;
    const load=async()=>{try{
      const[wr,ar]=await Promise.all([fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lng}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_gusts_10m,relative_humidity_2m,precipitation,rain,snowfall&hourly=precipitation_probability,precipitation&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=${encodeURIComponent(loc.tz)}&forecast_days=2`),fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${loc.lat}&longitude=${loc.lng}&current=european_aqi,pm2_5&timezone=${encodeURIComponent(loc.tz)}`)]);
      const d=await wr.json();setWx(d);setRain(null);
      const hr=d.hourly;if(hr){const nowH=new Date().getHours();for(let i=nowH;i<Math.min(hr.time.length,nowH+18);i++){if((hr.precipitation_probability[i]||0)>=40){setRain({hour:new Date(hr.time[i]).getHours(),prob:hr.precipitation_probability[i]});break;}}}
      try{const aq=await ar.json();if(aq?.current)setAqi(aq.current);}catch(e){}
    }catch(e){}};
    load();const iv=setInterval(load,10*60*1000);return()=>clearInterval(iv);
  },[loc?.lat,loc?.lng]);

  const handleClick=()=>{
    if(!wx?.current)return;
    const c=wx.current,code=c.weather_code,temp=Math.round(c.temperature_2m),feels=Math.round(c.apparent_temperature),wind=Math.round(c.wind_speed_10m),gusts=Math.round(c.wind_gusts_10m||0),hum=c.relative_humidity_2m,tmax=wx.daily?Math.round(wx.daily.temperature_2m_max[0]):"?",tmin=wx.daily?Math.round(wx.daily.temperature_2m_min[0]):"?",rainPct=wx.daily?wx.daily.precipitation_probability_max[0]:0;
    const conds=[];
    if(code>=95)conds.push(`hay tormenta eléctrica activa con relámpagos y truenos`);
    else if(code>=80)conds.push(`hay chubascos activos ahora mismo`);
    else if(code>=61)conds.push(`está lloviendo en este momento`);
    else if(code>=51)conds.push(`hay llovizna ligera activa`);
    else if(code>=71)conds.push(`está nevando actualmente`);
    else if(code>=45)conds.push(`hay niebla con visibilidad reducida`);
    if(wind>50)conds.push(`vientos muy fuertes de ${wind} kilómetros por hora`);
    if(gusts>60)conds.push(`ráfagas de hasta ${gusts} kilómetros`);
    if(temp<=0)conds.push(`temperatura bajo cero, riesgo de heladas`);
    if(temp>=35)conds.push(`calor extremo de ${temp} grados`);
    if(!conds.length)conds.push(`cielo ${wmoText(code).toLowerCase()} sin eventos severos`);
    let aqTxt="";if(aqi?.european_aqi!=null){const v=aqi.european_aqi;const l=v<=20?"buena":v<=40?"aceptable":v<=60?"moderada":v<=80?"mala":"muy mala";aqTxt=` Calidad del aire: ${l}, índice ${v}.`;}
    speakText(`Estado actual en ${loc?.municipio||"tu ubicación"}: ${conds.join(". También, ")}. Temperatura ${temp} grados, sensación ${feels}. Humedad ${hum} por ciento, viento ${wind} kilómetros. Máxima ${tmax}, mínima ${tmin}. Probabilidad de lluvia hoy: ${rainPct} por ciento. ${rain?`Se esperan lluvias a las ${rain.hour} horas.`:""}${aqTxt}`,1.05);
  };

  if(!wx?.current)return(<div style={{padding:"6px 10px",border:`1px solid ${ac}22`,borderRadius:"6px",background:"rgba(0,0,0,0.6)",backdropFilter:"blur(4px)",fontSize:"7px",color:"#333"}}>📡...</div>);
  const c=wx.current,temp=Math.round(c.temperature_2m),feels=Math.round(c.apparent_temperature),icon=wmoIcon(c.weather_code);
  const fill=Math.max(5,Math.min(100,((temp+5)/35)*100));
  const tc=temp<=0?"#00ccff":temp<=10?"#44aaff":temp<=20?"#44ffaa":temp<=30?"#ffaa00":"#ff4400";
  return(
    <div onClick={handleClick} title="Toca para escuchar el clima" style={{display:"flex",alignItems:"center",gap:"8px",padding:"6px 12px",border:`1px solid ${ac}33`,borderRadius:"8px",background:"rgba(0,0,0,0.7)",backdropFilter:"blur(8px)",cursor:"pointer",boxShadow:`0 0 15px ${ac}15`,transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.boxShadow=`0 0 25px ${ac}40`;e.currentTarget.style.border=`1px solid ${ac}77`;}} onMouseLeave={e=>{e.currentTarget.style.boxShadow=`0 0 15px ${ac}15`;e.currentTarget.style.border=`1px solid ${ac}33`;}}>
      <svg width="12" height="40" viewBox="0 0 12 40"><rect x="4" y="2" width="4" height="24" rx="2" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5"/><rect x="4.5" y={2+24*(1-fill/100)} width="3" height={24*fill/100} rx="1.5" fill={tc} style={{filter:`drop-shadow(0 0 3px ${tc})`}}/><circle cx="6" cy="32" r="5" fill={tc} style={{filter:`drop-shadow(0 0 4px ${tc})`}}/></svg>
      <div>
        <div style={{display:"flex",alignItems:"baseline",gap:"3px"}}><span style={{fontSize:"20px",lineHeight:1}}>{icon}</span><span style={{fontSize:"18px",fontWeight:"900",color:tc,fontFamily:"'Courier New',monospace",lineHeight:1,textShadow:`0 0 8px ${tc}`}}>{temp}°</span><span style={{fontSize:"7px",color:"rgba(255,255,255,0.3)"}}>/{feels}°</span></div>
        {rain&&<div style={{fontSize:"6px",color:"#4488ff",animation:"blink 2s steps(1) infinite"}}>🌧 ~{rain.hour}h ({rain.prob}%)</div>}
        {!rain&&<div style={{fontSize:"6px",color:"rgba(255,255,255,0.15)"}}>🔊 toca</div>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CLOCK
// ═══════════════════════════════════════════════════════════════════
function Clock({ac,loc}){
  const[t,setT]=useState(new Date());
  useEffect(()=>{const iv=setInterval(()=>setT(new Date()),1000);return()=>clearInterval(iv);},[]);
  const hh=String(t.getHours()).padStart(2,"0"),mm=String(t.getMinutes()).padStart(2,"0"),ss=String(t.getSeconds()).padStart(2,"0"),blink=t.getSeconds()%2===0;
  const days=["domingo","lunes","martes","miércoles","jueves","viernes","sábado"],months=["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const onClick=()=>{const n=new Date();speakText(`La hora en ${loc?.municipio||"tu ubicación"} es: ${n.getHours()} horas con ${n.getMinutes()} minutos. Hoy es ${days[n.getDay()]} ${n.getDate()} de ${months[n.getMonth()]} de 2026.`,1.05);};
  return(
    <div onClick={onClick} title="Toca para escuchar la hora" style={{display:"flex",alignItems:"center",gap:"6px",padding:"6px 14px",border:`1px solid ${ac}33`,borderRadius:"8px",background:"rgba(0,0,0,0.7)",backdropFilter:"blur(8px)",cursor:"pointer",boxShadow:`0 0 15px ${ac}15`,transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.boxShadow=`0 0 25px ${ac}40`;e.currentTarget.style.border=`1px solid ${ac}77`;}} onMouseLeave={e=>{e.currentTarget.style.boxShadow=`0 0 15px ${ac}15`;e.currentTarget.style.border=`1px solid ${ac}33`;}}>
      <div style={{fontFamily:"'Courier New',monospace",display:"flex",alignItems:"baseline",gap:"1px"}}>
        <span style={{fontSize:"26px",fontWeight:"900",color:ac,textShadow:`0 0 20px ${ac},0 0 40px ${ac}55`,lineHeight:1}}>{hh}</span>
        <span style={{fontSize:"22px",fontWeight:"900",color:ac,opacity:blink?1:0.1,transition:"opacity 0.1s",lineHeight:1}}>:</span>
        <span style={{fontSize:"26px",fontWeight:"900",color:ac,textShadow:`0 0 20px ${ac},0 0 40px ${ac}55`,lineHeight:1}}>{mm}</span>
        <span style={{fontSize:"13px",fontWeight:"700",color:ac,opacity:blink?0.8:0.1,transition:"opacity 0.1s",lineHeight:1,marginLeft:"1px"}}>:</span>
        <span style={{fontSize:"13px",fontWeight:"700",color:`${ac}66`,lineHeight:1}}>{ss}</span>
      </div>
      <div style={{fontSize:"6px",color:`${ac}33`,letterSpacing:"1px"}}>🔊</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// LIVE TICKER — datos en tiempo real
// ═══════════════════════════════════════════════════════════════════
function LiveTicker({fx,crypto,quakes,mode,ac}){
  const items=[];
  if(fx)items.push(`💱 USD/MXN: $${fx}`);
  if(crypto?.bitcoin)items.push(`₿ BTC: $${Math.round(crypto.bitcoin.usd).toLocaleString()} (${crypto.bitcoin.usd_24h_change>0?"+":""}${crypto.bitcoin.usd_24h_change?.toFixed(1)}%)`);
  if(crypto?.ethereum)items.push(`Ξ ETH: $${Math.round(crypto.ethereum.usd).toLocaleString()}`);
  if(quakes.length)items.push(`🌋 ${quakes.length} sismos M5.5+ activos en USGS`);
  items.push(`⚔️ DÍA 11 — IRAN VS EE.UU. — BRENT ~$90 ↕ VOLÁTIL`);
  items.push(`🔴 BAHRAIN BAPCO FORCE MAJEURE — ORMUZ -95% TRÁFICO`);
  items.push(`🦠 SARAMPIÓN MX: 9,074 CASOS — 7 ESTADOS FOCOS ROJOS`);
  items.push(`💼 EMPLEOS USA: -92K FEB — DESEMPLEO 4.4%`);
  items.push(`🛡️ OTAN CUMBRE 12 MAR BRUSELAS`);
  const txt=items.join("   •   ");
  return(
    <div style={{width:"100%",maxWidth:"980px",marginBottom:"6px",overflow:"hidden",background:"rgba(0,0,0,0.6)",border:`1px solid ${ac}15`,borderRadius:"4px",padding:"4px 0",backdropFilter:"blur(4px)"}}>
      <div style={{fontSize:"7.5px",color:ac,letterSpacing:"1px",whiteSpace:"nowrap",animation:"ticker 50s linear infinite",display:"inline-block",paddingLeft:"100%"}}>{txt} &nbsp;&nbsp;&nbsp; {txt}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MEXICO PRIORITY ALERT
// ═══════════════════════════════════════════════════════════════════
function getMexicoAlert(mode,hurricanes,fx){
  const mxHur=hurricanes.filter(h=>h.lat>10&&h.lat<30&&h.lng>-120&&h.lng<-75);
  if(mode==="war")return{icon:"🇲🇽",title:"IMPACTO EN MÉXICO — DÍA 11",color:"#ff6600",lines:["⛽ Gasolina +22% por Ormuz bloqueado 95%.","💱 Peso en mínimos históricos — dólar caro.",fx?`💵 Tipo de cambio LIVE: $${fx} MXN/USD`:"💵 Dólar en máximos por crisis energética.","📦 Aranceles Trump 35% — manufacturas en espera."],accion:"Llena el tanque. No cambies dólares ahora. Revisa vacunas sarampión."};
  if(mode==="disease")return{icon:"🇲🇽",title:"ALERTA SANITARIA MÉXICO — MAR 2026",color:"#ff2200",lines:["🔴 Sarampión ACTIVO: 7 estados focos rojos.","📋 Necesitas 2 dosis SRP. Verifica cartilla.","⚠️ OPS alerta especial por Mundial 2026 en México.","👶 Niños 1-4 años: grupo más afectado."],accion:"Llama al 800-00-44800 para vacunarte gratis hoy."};
  if(mode==="climate")return{icon:"🇲🇽",title:mxHur.length?"🌀 HURACÁN AMENAZA MÉXICO":"CLIMA MÉXICO — MAR 2026",color:"#00aaff",lines:mxHur.length?[`🌀 ${mxHur[0].name} a menos de 1,800km. Costas del Golfo en riesgo.`,"📦 Prepara mochila: agua, comida 3 días, documentos.","🏠 Refuerza ventanas. Conoce tu ruta de evacuación.","📲 Activa alertas CENAPRED en tu celular."]:["🧊 Frente Frío 39 activo — Toluca y zonas altas.","❄️ Posible nieve en Nevado de Toluca y Sierra Nevada.","🌬️ Vientos fuertes: EdoMex, Puebla, Tlaxcala.","🌧️ Lluvias en CDMX. Mínimas 3-5°C en el Valle."],accion:mxHur.length?"Si estás en costa del Golfo: listo para evacuación preventiva.":"Abrígate. Lleva ropa térmica a zonas altas. Cuidado con carreteras heladas."};
  if(mode==="news")return{icon:"🇲🇽",title:"ECONOMÍA MÉXICO — 10 MAR 2026",color:"#ffcc00",lines:["🛢️ Gasolina +22% por petróleo en máximos.",fx?`💱 USD/MXN LIVE: $${fx} — peso en mínimos`:"💱 Peso MXN >18/USD — inflación importada.",`📦 Aranceles 35% Trump en negociación — manufactura en pausa.`,"📉 FMI: recesión México Q3 si guerra dura 4+ semanas."],accion:"Invierte en CETES para proteger ahorros. Evita cambiar dólares ahora."};
  return null;
}

// ═══════════════════════════════════════════════════════════════════
// AUDIO ENGINE
// ═══════════════════════════════════════════════════════════════════
function useAudio(){
  const ref=useRef(null);
  const getCtx=useCallback(()=>{if(!ref.current)ref.current=new(window.AudioContext||window.webkitAudioContext)();if(ref.current.state==="suspended")ref.current.resume();return ref.current;},[]);
  const SCALES={war:[220,246,261,293,311,349,415,440],disease:[196,220,246,261,293,329,349,392],climate:[261,293,329,349,392,440,493,523],news:[293,329,369,392,440,493,523,587]};
  const playHover=useCallback((gid,mode)=>{try{const c=getCtx(),sc=SCALES[mode]||SCALES.war,f=sc[Math.abs(parseInt(gid,36)||0)%sc.length],t=c.currentTime;const o=c.createOscillator(),g=c.createGain(),flt=c.createBiquadFilter();flt.type="lowpass";flt.frequency.value=2000;o.connect(flt);flt.connect(g);g.connect(c.destination);o.type=mode==="war"?"sawtooth":"sine";o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(0.025,t+0.03);g.gain.exponentialRampToValueAtTime(0.001,t+0.25);o.start(t);o.stop(t+0.26);}catch(e){}},[getCtx]);
  const playUI=useCallback((type,mode="war")=>{try{const c=getCtx(),t=c.currentTime;if(type==="select"){[1,1.5].forEach((m,i)=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="sine";o.frequency.setValueAtTime(660*m,t);o.frequency.exponentialRampToValueAtTime(880*m,t+0.08);g.gain.setValueAtTime(0.1/(i+1),t);g.gain.exponentialRampToValueAtTime(0.001,t+0.3);o.start(t);o.stop(t+0.31);});}else if(type==="switch"){const fs={war:[415,311,261],disease:[220,261,311],climate:[261,329,392],news:[293,369,440]};(fs[mode]||fs.war).forEach((f,i)=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="sine";o.frequency.value=f;const dl=i*0.08;g.gain.setValueAtTime(0,t+dl);g.gain.linearRampToValueAtTime(0.13,t+dl+0.03);g.gain.exponentialRampToValueAtTime(0.001,t+dl+0.12);o.start(t+dl);o.stop(t+dl+0.13);});}else if(type==="close"){const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="sine";o.frequency.setValueAtTime(440,t);o.frequency.exponentialRampToValueAtTime(220,t+0.1);g.gain.setValueAtTime(0.1,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.12);o.start(t);o.stop(t+0.12);}else if(type==="pop"){const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="sine";o.frequency.setValueAtTime(900,t);o.frequency.exponentialRampToValueAtTime(200,t+0.08);g.gain.setValueAtTime(0.15,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.09);o.start(t);o.stop(t+0.1);}}catch(e){};},[getCtx]);
  return{playHover,playUI};
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
  const[ripples,setRipples]=useState({});
  const[quakes,setQuakes]=useState([]);
  const[hurricanes,setHurricanes]=useState([]);
  const[noaaChecked,setNoaaChecked]=useState(false);
  const[hurPos,setHurPos]=useState({});
  const[wlive,setWlive]=useState({});
  const[aiHeadline,setAiHeadline]=useState("");
  const[aiLoading,setAiLoading]=useState(false);
  const[showInfo,setShowInfo]=useState(false);
  const[radarAngle,setRadarAngle]=useState(0);

  const loc=useGeoLocation();
  const fx=useFX();
  const crypto=useCrypto();
  const cpos=useMovingCarriers();
  const attacks=useAttacks(mode==="war");
  const planes=useOpenSky(mode==="war");
  const eonet=useEONET(mode==="climate");
  const{alerts,dismiss}=useEmergencyAlerts(quakes,hurricanes);
  const lastHov=useRef(0),lastHovId=useRef(null);
  const{playHover,playUI}=useAudio();

  const ac=ACC[mode],bg=BG[mode],isoM=ISO_COL[mode]||{},mcd=ALL_COUNTRY_DATA[mode]||{};

  // Radar sweep
  useEffect(()=>{const iv=setInterval(()=>setRadarAngle(a=>(a+1.5)%360),30);return()=>clearInterval(iv);},[]);

  // World map
  useEffect(()=>{let done=false;(async()=>{try{const[topo,world]=await Promise.all([import("https://cdn.skypack.dev/topojson-client@3"),fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then(r=>r.json())]);if(done)return;const p=d3.geoNaturalEarth1().scale(150).translate([W/2,H/2+15]);const path=d3.geoPath(p);const features=topo.feature(world,world.objects.countries).features;setProj(()=>p);setGeo({paths:features.map(f=>({id:String(f.id),d:path(f)||""})),borders:path(topo.mesh(world,world.objects.countries,(a,b)=>a!==b)),sphere:path({type:"Sphere"})});}catch(e){}})();return()=>{done=true;};},[]);

  // USGS
  const fetchQ=useCallback(async()=>{try{const r=await fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/5.0_day.geojson");const d=await r.json();const now=Date.now();setQuakes(d.features.filter(f=>f.properties.mag>=5.5&&(now-f.properties.time)<48*3600*1000).map(f=>({id:f.id,mag:f.properties.mag,place:f.properties.place||"Océano",lat:f.geometry.coordinates[1],lng:f.geometry.coordinates[0],depth:Math.round(f.geometry.coordinates[2]),time:f.properties.time})));}catch(e){}}, []);
  useEffect(()=>{fetchQ();const iv=setInterval(fetchQ,5*60*1000);return()=>clearInterval(iv);},[fetchQ]);

  // NOAA
  const fetchH=useCallback(async()=>{try{const r=await fetch("https://www.nhc.noaa.gov/CurrentStorms.json");const d=await r.json();setNoaaChecked(true);if(d.activeStorms?.length){const a=d.activeStorms.map(s=>({id:s.id,name:s.name||"Storm",kts:parseInt(s.intensity)||65,lat:parseFloat(s.latitudeNumeric)||20,lng:parseFloat(s.longitudeNumeric)||-85,dir:parseInt(s.movementDir)||315,spd:parseInt(s.movementSpeed)||12}));setHurricanes(a);setHurPos(Object.fromEntries(a.map(h=>[h.id,{lat:h.lat,lng:h.lng}])));}else setHurricanes([]);}catch(e){setNoaaChecked(true);setHurricanes([]);}},[]);
  useEffect(()=>{fetchH();const iv=setInterval(fetchH,30*60*1000);return()=>clearInterval(iv);},[fetchH]);
  useEffect(()=>{if(!hurricanes.length)return;const iv=setInterval(()=>{setHurPos(prev=>{const n={...prev};hurricanes.forEach(h=>{const p=prev[h.id]||{lat:h.lat,lng:h.lng};const rad=h.dir*Math.PI/180;n[h.id]={lat:p.lat+Math.cos(rad)*(h.spd/111)*(30/3600),lng:p.lng+Math.sin(rad)*(h.spd/111)*(30/3600)};});return n;});},30000);return()=>clearInterval(iv);},[hurricanes]);

  // Live weather spots
  useEffect(()=>{const spots=[{k:"india",lat:26.8,lng:80.9},{k:"aus",lat:-33.8,lng:149},{k:"mexico",lat:19.4,lng:-99.1},{k:"iran",lat:32.4,lng:53.7},{k:"spain",lat:37.5,lng:-4}];const go=async()=>{const obj={};await Promise.all(spots.map(async({k,lat,lng})=>{try{const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,wind_speed_10m&forecast_days=1&timezone=auto`);const d=await r.json();if(d.current)obj[k]=d.current;}catch(e){}}));setWlive(obj);};go();const iv=setInterval(go,10*60*1000);return()=>clearInterval(iv);},[]);

  // AI headline
  const fetchAI=useCallback(async()=>{setAiLoading(true);try{const qs={war:"Noticia urgente guerra Irán EE.UU. hoy en 18 palabras máximo.",news:"Noticia económica global más importante hoy en 18 palabras.",disease:"Brote enfermedad más crítico actualmente en 18 palabras.",climate:"Evento climático más severo activo ahora en 18 palabras."};const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:90,tools:[{type:"web_search_20250305",name:"web_search"}],messages:[{role:"user",content:qs[mode]}]})});const data=await r.json();const txt=data.content?.filter(b=>b.type==="text").map(b=>b.text).join("").trim();if(txt)setAiHeadline(txt.slice(0,200));}catch(e){}setAiLoading(false);},[mode]);
  useEffect(()=>{fetchAI();const iv=setInterval(fetchAI,15*60*1000);return()=>clearInterval(iv);},[mode]);

  useEffect(()=>{window.speechSynthesis.getVoices();return()=>stopSpeech();},[]);

  const xy=useCallback((lat,lng)=>{if(!proj)return null;return proj([lng,lat]);},[proj]);

  const doHover=useCallback((gid)=>{const now=Date.now();if(now-lastHov.current<80||gid===lastHovId.current)return;lastHov.current=now;lastHovId.current=gid;playHover(gid,mode);},[mode,playHover]);
  const doPoint=useCallback((pt)=>{playUI("select",mode);setPing(pt.id);setTimeout(()=>setPing(null),700);setSel(p=>p?.id===pt.id?null:pt);if(sel?.id!==pt.id){setTimeout(()=>speakText(pt.det||""),200);}else stopSpeech();},[mode,playUI,sel]);
  const doCountry=useCallback((id)=>{const data=mcd[id];if(!data)return;playUI("pop",mode);const pt={id:`cc_${mode}_${id}`,name:data.name,c:data.c,s:3,st:"activo",det:data.det,fecha:data.fecha};setSel(p=>p?.id===pt.id?null:pt);if(sel?.id!==pt.id)setTimeout(()=>speakText(data.det),200);else stopSpeech();},[mode,playUI,mcd,sel]);
  const cycleMode=()=>{playUI("switch",mode);stopSpeech();const nm=MODES[(MODES.indexOf(mode)+1)%MODES.length];setMode(nm);setSel(null);lastHovId.current=null;setTimeout(()=>speakText(MODE_VOICE[nm],1.0),350);};

  // Build climate points
  const clmPts=[...BASE_CLIMATE,...quakes.map(q=>({id:`q_${q.id}`,name:`M${q.mag.toFixed(1)}\n${q.place.split(",")[0].substring(0,10).toUpperCase()}`,lat:q.lat,lng:q.lng,c:magCol(q.mag),s:Math.min(5,Math.round(q.mag-3)),st:"extremo",icon:"🌋",pulse:q.mag>=6,fecha:new Date(q.time).toLocaleDateString("es-MX",{day:"2-digit",month:"short"}).toUpperCase(),det:`Sismo M${q.mag.toFixed(1)} en ${q.place}. Prof: ${q.depth}km. ${q.mag>=7?"⚠️ ALERTA TSUNAMI.":q.mag>=6?"Monitoreo tsunami activo.":"Sin riesgo tsunami."} USGS ${new Date(q.time).toLocaleString("es-MX")}`})),...hurricanes.map(h=>{const pos=hurPos[h.id]||{lat:h.lat,lng:h.lng};return{id:`hur_${h.id}`,name:`🌀 ${h.name}\n${hurCat(h.kts)}`,lat:pos.lat,lng:pos.lng,c:hurCol(h.kts),s:5,st:"extremo",icon:"🌀",pulse:true,fecha:"NOAA LIVE",det:`Huracán ${h.name} — ${hurCat(h.kts)}. ${Math.round(h.kts*1.852)} km/h. ${pos.lat?.toFixed(2)}°, ${pos.lng?.toFixed(2)}°. NOAA NHC live.`};}),
  ...eonet.map(e=>({id:`eon_${e.id}`,name:`NASA\n${e.cat.substring(0,10).toUpperCase()}`,lat:e.lat,lng:e.lng,c:"#ff7700",s:3,st:"activo",icon:"🛰️",pulse:false,fecha:"NASA EONET",det:`${e.title}. Evento activo detectado por NASA EONET.`}))];

  const DATA_MAP={war:BASE_WAR,disease:BASE_DISEASE,climate:clmPts,news:BASE_NEWS};
  const STATS={
    war:[{l:"MUERTOS IRÁN",v:"1,255+",c:"#ff1a1a"},{l:"SOLDADOS USA",v:"8 ✝",c:"#ff4444"},{l:"OBJETIVOS",v:"5,000+",c:"#ff6600"},{l:"BRENT",v:"~$90 ↕",c:"#ffaa00"},{l:"ORMUZ",v:"-95%",c:"#ff8800"},{l:"DÍA GUERRA",v:"11",c:"#ffcc00"},{l:"PORTAAVIONES",v:"5 🚢",c:"#4488ff"},{l:"USD/MXN",v:fx?`$${fx}`:"...",c:"#88cc00"}],
    disease:[{l:"SARAMPIÓN MX",v:"9,074",c:"#ff2200"},{l:"ESTADOS MX",v:"7 FOCOS",c:"#ff4400"},{l:"MPOX",v:"100K+",c:"#ff6600"},{l:"H5N1",v:"⚠️PANDEMIA",c:"#ffaa00"},{l:"NIPAH",v:"5 CASOS",c:"#cc0000"},{l:"DENGUE",v:"5M casos",c:"#ff8800"},{l:"ÉBOLA",v:"65% MORT",c:"#cc0000"},{l:"NIVEL OMS",v:"EMERGENCIA",c:"#ff2020"}],
    climate:[{l:"HURACANES",v:"NOAA LIVE",c:"#8844ff"},{l:"SISMOS M5.5+",v:`${quakes.length} USGS`,c:"#ffaa00"},{l:"NASA EONET",v:`${eonet.length} EVENTOS`,c:"#ff7700"},{l:"INDIA MAX",v:"51°C",c:"#ff2200"},{l:"TORNADOS",v:"USA EF4",c:"#aa44ff"},{l:"AVIONES",v:planes.length>0?`${planes.length} LIVE`:"OPENSKY",c:"#00cc88"},{l:"FRÍO MX",v:"FF39 ACTIVO",c:"#00aaff"},{l:"CO₂",v:"428 ppm",c:"#ffaa00"}],
    news:[{l:"BRENT",v:"~$90 ↕",c:"#ffaa00"},{l:"BTC",v:crypto?.bitcoin?`$${Math.round(crypto.bitcoin.usd/1000)}K`:"...",c:"#ffdd00"},{l:"USD/MXN",v:fx?`$${fx}`:"...",c:"#88cc00"},{l:"BOLSAS",v:"↑REBOTE",c:"#44ff88"},{l:"EMPLEOS",v:"-92K FEB",c:"#ff3344"},{l:"QATAR LNG",v:"🔴FM",c:"#ff4444"},{l:"ORMUZ",v:"-95%",c:"#ff6600"},{l:"FMI",v:"RECESIÓN",c:"#ffee00"}],
  };

  // Connection lines
  const connLines=[];
  if(mode==="war")BASE_WAR.forEach(p=>(p.conn||[]).forEach(tid=>{const tgt=BASE_WAR.find(x=>x.id===tid);if(tgt){const a=xy(p.lat,p.lng),b=xy(tgt.lat,tgt.lng);if(a&&b)connLines.push({x1:a[0],y1:a[1],x2:b[0],y2:b[1],col:p.c,key:`${p.id}-${tid}`});}}));

  const pts=DATA_MAP[mode]||[];
  const mxAlert=getMexicoAlert(mode,hurricanes,fx);

  const eonetIcon=cat=>{if(/wildfire|fire/i.test(cat))return"🔥";if(/storm/i.test(cat))return"⛈️";if(/flood/i.test(cat))return"🌊";if(/volcano/i.test(cat))return"🌋";return"🛰️";};

  return(
    <div style={{background:bg,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",padding:"10px 8px 16px",fontFamily:"'Courier New',monospace",color:"#fff",transition:"background 0.6s",userSelect:"none",position:"relative",overflow:"hidden"}}>

      {/* BACKGROUND GRID EFFECT */}
      <div style={{position:"fixed",inset:0,backgroundImage:`linear-gradient(${ac}05 1px,transparent 1px),linear-gradient(90deg,${ac}05 1px,transparent 1px)`,backgroundSize:"40px 40px",pointerEvents:"none",zIndex:0}}/>

      {/* EMERGENCY BANNER */}
      <EmergencyBanner alerts={alerts} dismiss={dismiss}/>

      {/* TOP BAR */}
      <div style={{width:"100%",maxWidth:"980px",marginBottom:"8px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"8px",position:"relative",zIndex:1}}>
        <div style={{flex:1,minWidth:"200px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"2px"}}>
            <div style={{width:"6px",height:"6px",borderRadius:"50%",background:ac,boxShadow:`0 0 8px ${ac}`,animation:"pulse 1s ease infinite"}}/>
            <span style={{fontSize:"7px",letterSpacing:"3px",color:ac}}>{aiLoading?"AI BUSCANDO NOTICIAS...":"TIEMPO REAL"} • 🔊 VOZ ACTIVA</span>
          </div>
          <h1 style={{fontSize:"clamp(10px,1.8vw,16px)",fontWeight:"900",letterSpacing:"2px",color:"#fff",margin:"0 0 3px",textShadow:`0 0 30px ${ac}88,0 0 60px ${ac}33`}}>{TITLES[mode]}</h1>
          {aiHeadline&&<div style={{fontSize:"8px",color:ac,maxWidth:"520px",lineHeight:1.5,background:`${ac}10`,padding:"3px 8px",borderRadius:"3px",border:`1px solid ${ac}20`}}>🤖 {aiHeadline}</div>}
          <div style={{fontSize:"6px",color:"rgba(255,255,255,0.12)",marginTop:"3px",cursor:"pointer"}} onClick={()=>setShowInfo(p=>!p)}>⟳ USGS 5min · NOAA 30min · TEMP 10min · AI 15min · FX 5min · BTC 3min {showInfo?"▲":"▼"}</div>
          {showInfo&&<div style={{fontSize:"6.5px",color:"rgba(255,255,255,0.25)",marginTop:"2px",lineHeight:1.7,background:"rgba(0,0,0,0.5)",padding:"4px 8px",borderRadius:"3px",border:"1px solid rgba(255,255,255,0.05)"}}>APIs GRATIS: USGS Earthquakes · NOAA NHC · Open-Meteo Weather · Air Quality API · OpenSky Network (aviones) · NASA EONET (desastres) · CoinGecko (crypto) · Frankfurter (divisas) · Nominatim (geocodificación) · Anthropic Claude (IA)</div>}
        </div>
        <div style={{display:"flex",gap:"8px",alignItems:"flex-start",flexWrap:"wrap"}}>
          <Clock ac={ac} loc={loc}/>
          <WeatherWidget ac={ac} loc={loc}/>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:"5px",alignItems:"flex-end"}}>
          <button onClick={cycleMode} style={{padding:"8px 14px",background:`${ac}15`,border:`1px solid ${ac}`,borderRadius:"6px",color:ac,fontFamily:"'Courier New',monospace",fontSize:"10px",letterSpacing:"2px",cursor:"pointer",fontWeight:"bold",backdropFilter:"blur(4px)",boxShadow:`0 0 15px ${ac}25`,transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.background=`${ac}30`;e.currentTarget.style.boxShadow=`0 0 30px ${ac}66`;}} onMouseLeave={e=>{e.currentTarget.style.background=`${ac}15`;e.currentTarget.style.boxShadow=`0 0 15px ${ac}25`;}}>{NEXT[mode]} →</button>
          <button onClick={()=>{fetchQ();fetchH();fetchAI();}} style={{padding:"4px 10px",background:"transparent",border:`1px solid ${ac}20`,borderRadius:"4px",color:`${ac}55`,fontFamily:"'Courier New',monospace",fontSize:"7px",cursor:"pointer",letterSpacing:"1px",transition:"all 0.2s"}} onMouseEnter={e=>e.currentTarget.style.color=ac} onMouseLeave={e=>e.currentTarget.style.color=`${ac}55`}>⟳ ACTUALIZAR TODO</button>
          <div style={{display:"flex",gap:"5px",marginTop:"2px"}}>{MODES.map(m=><div key={m} onClick={()=>{stopSpeech();setMode(m);setSel(null);setTimeout(()=>speakText(MODE_VOICE[m]),300);}} style={{width:"7px",height:"7px",borderRadius:"50%",background:m===mode?ACC[m]:"rgba(255,255,255,0.08)",boxShadow:m===mode?`0 0 10px ${ACC[m]},0 0 20px ${ACC[m]}55`:"none",transition:"all 0.3s",cursor:"pointer"}}/>)}</div>
        </div>
      </div>

      {/* LIVE TICKER */}
      <LiveTicker fx={fx} crypto={crypto} quakes={quakes} mode={mode} ac={ac}/>

      {/* TOP ALERTS BAR */}
      {mode==="war"&&<div style={{width:"100%",maxWidth:"980px",marginBottom:"6px",display:"flex",gap:"4px",flexWrap:"wrap",position:"relative",zIndex:1}}>
        {[{txt:"🗣️ TRUMP: 'GUERRA COMPLETA' Y 'VICTORIA TOTAL' — SEÑALES MIXTAS — 10 MAR",c:"#ff6600",det:"Trump a CBS: 'la guerra está muy completa'. Horas después: 'necesitamos victoria total'. Mercados suben y bajan con cada declaración. Amenazó con golpear a Irán 20 veces más fuerte si toca Ormuz."},
          {txt:"🛢️ BRENT TOCÓ $119 EL LUNES — REGRESA A ~$90 — MÁXIMA VOLATILIDAD",c:"#ffaa00",det:"Brent tocó máximo de $119 el lunes 9 de marzo. Hoy regresa a ~$90. Ormuz -95% tráfico. Qatar LNG: fuerza mayor. Saudi Aramco: Ras Tanura cerrada."},
          {txt:"🔴 BAHRAIN BAPCO FORCE MAJEURE — QATAR LNG INTERRUMPIDO — 10 MAR",c:"#ff4444",det:"BAPCO (petróleo Bahrain) declaró force majeure. Qatar interrumpió 20% del LNG mundial. Saudi Aramco cerró Ras Tanura. Primera vez desde la Guerra del Golfo que múltiples productores declaran force majeure simultáneamente."},
        ].map((a,i)=><div key={i} onClick={()=>doPoint({id:`alert_${i}`,name:a.txt.split(":")[0],c:a.c,s:5,st:"critico",fecha:"10 MAR 2026",det:a.det})} style={{flex:1,padding:"5px 10px",background:`${a.c}10`,border:`1px solid ${a.c}`,borderRadius:"4px",fontSize:"7.5px",color:a.c,cursor:"pointer",minWidth:"150px",backdropFilter:"blur(4px)",transition:"all 0.2s",animation:i===0?"warningPulse 2s ease infinite":"none"}} onMouseEnter={e=>e.currentTarget.style.background=`${a.c}25`} onMouseLeave={e=>e.currentTarget.style.background=`${a.c}10`}>{a.txt}</div>)}
      </div>}
      {mode==="disease"&&<div onClick={()=>doPoint(BASE_DISEASE[0])} style={{width:"100%",maxWidth:"980px",marginBottom:"6px",padding:"6px 14px",background:"rgba(255,34,0,0.1)",border:"1px solid #ff4400",borderRadius:"4px",fontSize:"8px",color:"#ff4400",cursor:"pointer",animation:"warningPulse 2.5s ease infinite",backdropFilter:"blur(4px)",position:"relative",zIndex:1}}>🔴 SARAMPIÓN MÉXICO: 9,074 CASOS — 7 ESTADOS FOCOS ROJOS — OPS ALERTA POR MUNDIAL 2026 — LLAMA 800-00-44800</div>}

      {/* MAP */}
      <div style={{width:"100%",maxWidth:"980px",position:"relative",border:`1px solid ${ac}18`,borderRadius:"10px",overflow:"hidden",boxShadow:`0 0 60px ${ac}15,inset 0 0 30px rgba(0,0,0,0.5)`,background:"#010610",zIndex:1}}>

        {/* CORNER BRACKETS */}
        {[{top:"0",left:"0"},{top:"0",right:"0"},{bottom:"0",left:"0"},{bottom:"0",right:"0"}].map((pos,i)=><div key={i} style={{position:"absolute",...pos,width:"20px",height:"20px",borderTop:pos.top!==undefined?`2px solid ${ac}55`:"none",borderBottom:pos.bottom!==undefined?`2px solid ${ac}55`:"none",borderLeft:pos.left!==undefined?`2px solid ${ac}55`:"none",borderRight:pos.right!==undefined?`2px solid ${ac}55`:"none",zIndex:10,pointerEvents:"none"}}/>)}

        {!geo&&<div style={{height:"440px",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"12px"}}><div style={{fontSize:"24px",animation:"spin 1.5s linear infinite"}}>🌍</div><div style={{fontSize:"8px",color:ac,letterSpacing:"4px",animation:"blink 1s steps(1) infinite"}}>CARGANDO MAPA GLOBAL...</div></div>}

        {geo&&<svg viewBox={`0 0 ${W} ${H}`} style={{display:"block",width:"100%"}}>
          <defs>
            <filter id="glow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <filter id="glow2"><feGaussianBlur stdDeviation="6" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <radialGradient id="radarGrad"><stop offset="0%" stopColor={ac} stopOpacity="0.15"/><stop offset="100%" stopColor={ac} stopOpacity="0"/></radialGradient>
            {/* Missile trail gradient */}
            <linearGradient id="missileTrail" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="transparent"/><stop offset="100%" stopColor="#ff4400" stopOpacity="0.9"/></linearGradient>
          </defs>

          <rect width={W} height={H} fill="#010610"/>
          {geo.sphere&&<path d={geo.sphere} fill="#010c1a" stroke={ac} strokeWidth="0.4" strokeOpacity="0.12"/>}

          {/* RADAR SWEEP — en modo guerra sobre el Golfo */}
          {mode==="war"&&(()=>{const center=xy(26.6,50);if(!center)return null;const[cx,cy]=center;const r=120;const rad1=radarAngle*Math.PI/180;const rad2=(radarAngle-30)*Math.PI/180;return(<g><circle cx={cx} cy={cy} r={r} fill={`url(#radarGrad)`} opacity="0.3"/>{[0.25,0.5,0.75,1].map(f=><circle key={f} cx={cx} cy={cy} r={r*f} fill="none" stroke={ac} strokeWidth="0.3" opacity="0.1"/>)}<path d={`M${cx},${cy} L${cx+Math.cos(rad1)*r},${cy+Math.sin(rad1)*r} A${r},${r} 0 0,0 ${cx+Math.cos(rad2)*r},${cy+Math.sin(rad2)*r} Z`} fill={ac} opacity="0.12"/><line x1={cx} y1={cy} x2={cx+Math.cos(rad1)*r} y2={cy+Math.sin(rad1)*r} stroke={ac} strokeWidth="1.2" opacity="0.5"/></g>);})()}

          {/* COUNTRY FILLS */}
          {geo.paths.map(({id,d})=>{const col=isoM[id];const hasCE=!!mcd[id];return<path key={id} d={d} fill={col?`${col}1e`:"#0a0e1a"} stroke={col?col:"#0c1428"} strokeWidth={col?0.6:0.15} strokeOpacity={col?0.5:1} onMouseEnter={()=>{doHover(id);}} style={{cursor:hasCE?"pointer":"default",transition:"fill 0.2s"}} onMouseOver={e=>{if(col)e.target.setAttribute("fill",col+(hasCE?"55":"2a"));}} onMouseOut={e=>{e.target.setAttribute("fill",col?`${col}1e`:"#0a0e1a");}} onClick={()=>hasCE&&doCountry(id)}/>;
          })}
          {geo.borders&&<path d={geo.borders} fill="none" stroke="#0c1428" strokeWidth="0.2"/>}

          {/* CONNECTION LINES */}
          {connLines.map(l=><g key={l.key}><line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={l.col} strokeWidth="0.7" strokeOpacity="0.3" strokeDasharray="5,5"><animate attributeName="stroke-dashoffset" from="0" to="-20" dur="0.8s" repeatCount="indefinite"/></line></g>)}

          {/* ATTACK MISSILES */}
          {attacks.map(atk=>{
            const fr=xy(atk.from.lat,atk.from.lng),to=xy(atk.to.lat,atk.to.lng);if(!fr||!to)return null;
            const cx=fr[0]+(to[0]-fr[0])*atk.prog,cy=fr[1]+(to[1]-fr[1])*atk.prog;
            // Trail points
            const trail=[];for(let i=0;i<6;i++){const tp=Math.max(0,atk.prog-i*0.04);trail.push([fr[0]+(to[0]-fr[0])*tp,fr[1]+(to[1]-fr[1])*tp]);}
            return<g key={atk.id} filter="url(#glow)">
              {trail.map((tp,i)=><circle key={i} cx={tp[0]} cy={tp[1]} r={Math.max(0.3,2-i*0.3)} fill={atk.col} opacity={Math.max(0,(6-i)/6*0.7)}/>)}
              <circle cx={cx} cy={cy} r={2.5} fill={atk.col} opacity="0.95"/>
              {atk.prog>0.95&&<circle cx={cx} cy={cy} r={0} fill={atk.col} opacity="0.8"><animate attributeName="r" from="0" to="18" dur="0.5s" fill="freeze"/><animate attributeName="opacity" from="0.8" to="0" dur="0.5s" fill="freeze"/></circle>}
            </g>;
          })}

          {/* REAL PLANES — OpenSky */}
          {mode==="war"&&planes.map(p=>{const pos=xy(p.lat,p.lng);if(!pos)return null;const[px,py]=pos;const rad=(p.hdg||0)*Math.PI/180;return<g key={p.id} title={p.cs}>
            <g transform={`translate(${px},${py}) rotate(${p.hdg||0})`}><polygon points="0,-4 -2,2 0,1 2,2" fill="#00ff88" opacity="0.8" style={{filter:"drop-shadow(0 0 2px #00ff88)"}}/></g>
            <text x={px} y={py-6} textAnchor="middle" fill="#00ff8866" fontSize="3.5" fontFamily="'Courier New',monospace">{p.cs?.substring(0,6)}</text>
          </g>;})}

          {/* CARRIERS */}
          {mode==="war"&&CARRIERS.map(cv=>{const pos=cpos[cv.id];if(!pos)return null;const p=xy(pos.lat,pos.lng);if(!p)return null;const[cx,cy]=p,cc=cv.pais==="FRANCE"?"#4466ff":"#4488ff";return<g key={cv.id} onClick={()=>doPoint({id:cv.id,name:`${cv.flag} ${cv.name}`,lat:pos.lat,lng:pos.lng,c:cc,s:5,st:"activo",fecha:cv.fecha,det:cv.det})} style={{cursor:"pointer"}} filter="url(#glow)">
            <ellipse cx={cx} cy={cy} rx={16} ry={3.5} fill="none" stroke={cc} strokeWidth="0.4" strokeOpacity="0.25" transform={`rotate(-20,${cx},${cy})`}><animate attributeName="rx" values="16;22;16" dur="3.5s" repeatCount="indefinite"/></ellipse>
            <rect x={cx-11} y={cy-2} width={22} height={4.5} fill={cc} rx="2.2" opacity="0.9" style={{filter:`drop-shadow(0 0 5px ${cc})`}}/>
            <rect x={cx-7} y={cy-5} width={11} height={3} fill={cc} rx="1" opacity="0.85"/>
            <rect x={cx+1} y={cy-7.5} width={3.5} height={3.5} fill={cc==="4466ff"?"#7799ff":"#66aaff"} rx="0.5"/>
            <text x={cx} y={cy-11} textAnchor="middle" fill={cc} fontSize="5.5" fontFamily="'Courier New',monospace" fontWeight="bold" style={{filter:`drop-shadow(0 0 4px ${cc})`}}>{cv.flag} {cv.name}</text>
            <text x={cx} y={cy-19} textAnchor="middle" fill={`${cc}77`} fontSize="4" fontFamily="'Courier New',monospace">LIVE</text>
          </g>;})}

          {/* HURRICANES */}
          {mode==="climate"&&hurricanes.map(h=>{const pos=hurPos[h.id]||{lat:h.lat,lng:h.lng};const ph=xy(pos.lat,pos.lng);if(!ph)return null;const[hx,hy]=ph,hc=hurCol(h.kts);return<g key={`h-${h.id}`} onClick={()=>doPoint({id:`hur_${h.id}`,name:`🌀 ${h.name}`,lat:pos.lat,lng:pos.lng,c:hc,s:5,st:"extremo",icon:"🌀",fecha:"NOAA LIVE",det:`Huracán ${h.name} — ${hurCat(h.kts)}. ${Math.round(h.kts*1.852)} km/h. Pos: ${pos.lat?.toFixed(2)}°, ${pos.lng?.toFixed(2)}°. NOAA NHC live.`})} style={{cursor:"pointer"}}>
            {[0,1,2].map(i=><circle key={i} cx={hx} cy={hy} r={7} fill="none" stroke={hc} strokeWidth="0.8" opacity="0"><animate attributeName="r" from="7" to={7+i*15} dur={`${1.8+i*0.5}s`} begin={`${i*0.45}s`} repeatCount="indefinite"/><animate attributeName="opacity" from="0.7" to="0" dur={`${1.8+i*0.5}s`} begin={`${i*0.45}s`} repeatCount="indefinite"/></circle>)}
            <circle cx={hx} cy={hy} r="5.5" fill={hc} opacity="0.8" style={{filter:`drop-shadow(0 0 6px ${hc})`}}/>
            <g><animateTransform attributeName="transform" type="rotate" from={`0 ${hx} ${hy}`} to={`360 ${hx} ${hy}`} dur="3s" repeatCount="indefinite"/>{[0,90,180,270].map(a=>{const r=a*Math.PI/180;return<line key={a} x1={hx+Math.cos(r)*3} y1={hy+Math.sin(r)*3} x2={hx+Math.cos(r)*8} y2={hy+Math.sin(r)*8} stroke={hc} strokeWidth="1.5" strokeLinecap="round" opacity="0.9"/>;})}</g>
            <text x={hx} y={hy-13} textAnchor="middle" fill={hc} fontSize="6.5" fontWeight="bold" style={{filter:`drop-shadow(0 0 3px ${hc})`}}>{h.name}</text>
          </g>;})}
          {mode==="climate"&&noaaChecked&&!hurricanes.length&&<text x={W/2} y={H-10} textAnchor="middle" fill="#1a2030" fontSize="8" fontFamily="'Courier New',monospace">🌀 NOAA: SIN HURACANES ACTIVOS AHORA</text>}

          {/* DATA POINTS */}
          {pts.filter(pt=>pt.lat&&pt.lng).map(pt=>{
            const p=xy(pt.lat,pt.lng);if(!p)return null;
            const[px,py]=p,isSel=sel?.id===pt.id,isPing=ping===pt.id,r=isSel?10:7,ptc=pt.c||"#ff4400";
            return<g key={pt.id} onClick={()=>doPoint(pt)} style={{cursor:"pointer"}}>
              {pt.pulse&&[0,1,2].map(i=><circle key={i} cx={px} cy={py} r={r} fill="none" stroke={ptc} strokeWidth="0.7" opacity="0"><animate attributeName="r" from={r} to={r+30} dur={`${2+i*0.6}s`} begin={`${i*0.55}s`} repeatCount="indefinite"/><animate attributeName="opacity" from="0.6" to="0" dur={`${2+i*0.6}s`} begin={`${i*0.55}s`} repeatCount="indefinite"/></circle>)}
              {isPing&&<circle cx={px} cy={py} r={r} fill="none" stroke="#ffffff" strokeWidth="2" opacity="0"><animate attributeName="r" from={r} to={r+25} dur="0.6s"/><animate attributeName="opacity" from="0.9" to="0" dur="0.6s"/></circle>}
              {isSel&&<circle cx={px} cy={py} r={r+6} fill="none" stroke={ptc} strokeWidth="1.2" strokeDasharray="3,3" opacity="0.9"><animateTransform attributeName="transform" type="rotate" from={`0 ${px} ${py}`} to={`360 ${px} ${py}`} dur="4s" repeatCount="indefinite"/></circle>}
              <circle cx={px} cy={py} r={r} fill={ptc} style={{filter:`drop-shadow(0 0 ${isSel?16:7}px ${ptc})`}}/>
              <circle cx={px} cy={py} r={r*0.35} fill="rgba(255,255,255,0.6)"/>
              {pt.icon&&<text x={px} y={py+2.5} textAnchor="middle" fontSize="5.5" style={{pointerEvents:"none"}}>{pt.icon}</text>}
              {(pt.name||"").split("\n").map((ln,li)=><text key={li} x={px} y={py-r-3-((pt.name||"").split("\n").length-1-li)*9} textAnchor="middle" fill={ptc} fontSize={isSel?8.5:7} fontFamily="'Courier New',monospace" fontWeight="bold" style={{pointerEvents:"none",filter:`drop-shadow(0 0 4px ${ptc})`}}>{ln}</text>)}
            </g>;
          })}

          {/* SCANLINE OVERLAY */}
          <rect width={W} height={H} fill="none" style={{backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.03) 3px,rgba(0,0,0,0.03) 4px)",pointerEvents:"none"}}/>
        </svg>}

        {/* STATUS BAR */}
        <div style={{position:"absolute",bottom:"4px",left:"50%",transform:"translateX(-50%)",fontSize:"6px",color:"rgba(255,255,255,0.1)",letterSpacing:"2px",pointerEvents:"none",whiteSpace:"nowrap"}}>HOVER→MÚSICA · PUNTOS→VOZ+DETALLE · PAÍSES→TOCA · CARRIERS→POSICIÓN LIVE</div>
      </div>

      {/* DETAIL PANEL */}
      {sel&&<div style={{marginTop:"8px",padding:"14px 16px",background:`${bg}ee`,border:`1px solid ${sel.c||"#ff4400"}`,borderRadius:"8px",width:"100%",maxWidth:"980px",boxShadow:`0 0 40px ${sel.c||"#ff4400"}22,inset 0 0 20px rgba(0,0,0,0.3)`,backdropFilter:"blur(10px)",animation:"slideIn 0.2s ease",position:"relative",zIndex:1}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"}}>
            <span style={{fontSize:"14px",fontWeight:"900",letterSpacing:"2px",color:sel.c||"#ff4400",textShadow:`0 0 15px ${sel.c||"#ff4400"}`}}>{sel.icon||""} {(sel.name||"").replace(/\n/g," ")}</span>
            <span style={{fontSize:"7px",background:sel.c||"#ff4400",color:"#000",padding:"2px 8px",borderRadius:"3px",letterSpacing:"2px",fontWeight:"bold"}}>{STATUS_L[sel.st]||"ACTIVO"}</span>
            {sel.fecha&&<span style={{fontSize:"7px",color:"rgba(255,255,255,0.3)",border:`1px solid ${sel.c||"#ff4400"}25`,padding:"2px 7px",borderRadius:"3px"}}>{sel.fecha}</span>}
            {sel.s&&<div style={{display:"flex",gap:"2px"}}>{[1,2,3,4,5].map(i=><div key={i} style={{width:"12px",height:"3px",borderRadius:"1px",background:i<=sel.s?sel.c||"#ff4400":"rgba(255,255,255,0.08)",boxShadow:i<=sel.s?`0 0 4px ${sel.c||"#ff4400"}`:"none"}}/>)}</div>}
            <span style={{fontSize:"7px",color:ac,animation:"blink 1s steps(1) infinite"}}>🔊 VOZ</span>
          </div>
          <button onClick={()=>{setSel(null);stopSpeech();playUI("close",mode);}} style={{background:"none",border:"none",color:"rgba(255,255,255,0.3)",cursor:"pointer",fontSize:"16px",lineHeight:1,padding:"0 0 0 10px",transition:"color 0.2s"}} onMouseEnter={e=>e.currentTarget.style.color="#fff"} onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.3)"}>✕</button>
        </div>
        <div style={{marginTop:"10px",fontSize:"11px",color:"rgba(255,255,255,0.8)",lineHeight:"1.9",borderTop:`1px solid ${sel.c||"#ff4400"}18`,paddingTop:"10px"}}>{sel.det||""}</div>
      </div>}

      {/* STATS */}
      <div style={{marginTop:"10px",display:"flex",gap:"5px",flexWrap:"wrap",justifyContent:"center",width:"100%",maxWidth:"980px",position:"relative",zIndex:1}}>
        {(STATS[mode]||[]).map((st,i)=>{const rp=ripples[i]||[];return<button key={st.l} onClick={e=>{playUI("pop",mode);const r=e.currentTarget.getBoundingClientRect();const rp={id:Date.now(),x:e.clientX-r.left,y:e.clientY-r.top,c:st.c};setRipples(p=>({...p,[i]:[...(p[i]||[]),rp]}));setTimeout(()=>setRipples(p=>({...p,[i]:(p[i]||[]).filter(x=>x.id!==rp.id)})),900);}} style={{position:"relative",overflow:"hidden",background:`${st.c}0c`,border:`1px solid ${st.c}22`,borderRadius:"6px",padding:"8px 10px",textAlign:"center",minWidth:"90px",cursor:"pointer",fontFamily:"'Courier New',monospace",transition:"all 0.15s",backdropFilter:"blur(4px)"}} onMouseEnter={e=>{e.currentTarget.style.border=`1px solid ${st.c}`;e.currentTarget.style.background=`${st.c}22`;e.currentTarget.style.boxShadow=`0 0 20px ${st.c}44`;e.currentTarget.style.transform="translateY(-4px)";}} onMouseLeave={e=>{e.currentTarget.style.border=`1px solid ${st.c}22`;e.currentTarget.style.background=`${st.c}0c`;e.currentTarget.style.boxShadow="none";e.currentTarget.style.transform="translateY(0)";}}>
          {rp.map(r=><div key={r.id} style={{position:"absolute",left:r.x-50,top:r.y-50,width:"100px",height:"100px",borderRadius:"50%",background:`radial-gradient(circle,${r.c}55 0%,transparent 70%)`,animation:"rippleOut 0.9s ease-out forwards",pointerEvents:"none"}}/>)}
          <div style={{fontSize:"13px",fontWeight:"900",color:st.c,textShadow:`0 0 8px ${st.c}66`,position:"relative"}}>{st.v}</div>
          <div style={{fontSize:"6px",color:"rgba(255,255,255,0.2)",letterSpacing:"1.5px",marginTop:"2px",position:"relative"}}>{st.l}</div>
        </button>;})}
      </div>

      {/* LIVE DATA STRIP */}
      {mode==="climate"&&Object.keys(wlive).length>0&&<div style={{marginTop:"7px",width:"100%",maxWidth:"980px",background:"rgba(0,20,10,0.8)",border:"1px solid rgba(0,255,100,0.1)",borderRadius:"6px",padding:"6px 14px",display:"flex",gap:"12px",flexWrap:"wrap",alignItems:"center",backdropFilter:"blur(4px)",position:"relative",zIndex:1}}>
        <span style={{fontSize:"7px",color:"#00ff88",letterSpacing:"3px",fontWeight:"bold"}}>📡 LIVE</span>
        {wlive.india&&<span style={{fontSize:"8px",color:"#ff4400"}}>🔥 INDIA {wlive.india.temperature_2m}°C</span>}
        {wlive.spain&&<span style={{fontSize:"8px",color:"#ff6600"}}>☀️ ESPAÑA {wlive.spain.temperature_2m}°C</span>}
        {wlive.aus&&<span style={{fontSize:"8px",color:"#ff3300"}}>🔥 AUSTRALIA {wlive.aus.temperature_2m}°C</span>}
        {wlive.mexico&&<span style={{fontSize:"8px",color:"#8844ff"}}>🌀 MÉXICO {wlive.mexico.temperature_2m}°C {wlive.mexico.wind_speed_10m}km/h</span>}
        {wlive.iran&&<span style={{fontSize:"8px",color:"#ff2020"}}>⚔️ IRÁN {wlive.iran.temperature_2m}°C</span>}
        {planes.length>0&&<span style={{fontSize:"8px",color:"#00cc88"}}>✈️ {planes.length} aviones OpenSky en Medio Oriente</span>}
        {eonet.length>0&&<span style={{fontSize:"8px",color:"#ff7700"}}>🛰️ {eonet.length} eventos NASA EONET activos</span>}
      </div>}

      {/* NEWS TICKER */}
      {mode==="news"&&<div style={{marginTop:"7px",width:"100%",maxWidth:"980px",background:"rgba(10,8,0,0.8)",border:"1px solid rgba(255,200,0,0.1)",borderRadius:"4px",padding:"5px 0",overflow:"hidden",backdropFilter:"blur(4px)",position:"relative",zIndex:1}}>
        <div style={{fontSize:"8.5px",color:"#ffcc00",letterSpacing:"1.5px",whiteSpace:"nowrap",animation:"ticker 50s linear infinite",display:"inline-block",paddingLeft:"100%"}}>
          🗣️ TRUMP SEÑALES MIXTAS: GUERRA COMPLETA Y VICTORIA TOTAL EL MISMO DÍA &nbsp;•&nbsp; 🛢️ BRENT TOCÓ $119, REGRESA $90 — VOLATILIDAD MÁXIMA &nbsp;•&nbsp; 🔴 BAHRAIN BAPCO + QATAR LNG FORCE MAJEURE &nbsp;•&nbsp; ⚽ 5 FUTBOLISTAS IRANÍES PIDEN ASILO EN AUSTRALIA &nbsp;•&nbsp; 💼 EMPLEOS USA -92K FEBRERO — DESEMPLEO 4.4% &nbsp;•&nbsp; 💱 PESO MX {fx?`$${fx}/USD`:"PRESIONADO"} &nbsp;•&nbsp; ₿ BTC {crypto?.bitcoin?`$${Math.round(crypto.bitcoin.usd/1000)}K`:"..."} &nbsp;•&nbsp; 🛡️ OTAN CUMBRE 12 MAR BRUSELAS &nbsp;•&nbsp; 🇹🇷 TURQUÍA DERRIBÓ MISIL IRANÍ CON OTAN &nbsp;•&nbsp; 🏥 168 NIÑAS MUERTAS EN ESCUELA IRANÍ — PENTÁGONO INVESTIGA &nbsp;•&nbsp; 🇨🇳 CHINA COMPRA PETRÓLEO IRANÍ CON DESCUENTO &nbsp;•&nbsp; 🛢️ SAUDI ARAMCO CERRÓ RAS TANURA — MAYOR REFINERÍA DEL MUNDO
        </div>
      </div>}

      {/* MEXICO ALERT */}
      {mxAlert&&<div style={{marginTop:"8px",width:"100%",maxWidth:"980px",padding:"10px 14px",background:`rgba(0,0,0,0.8)`,border:`1px solid ${mxAlert.color}`,borderRadius:"8px",boxShadow:`0 0 25px ${mxAlert.color}18`,backdropFilter:"blur(8px)",position:"relative",zIndex:1}}>
        <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"7px"}}>
          <span style={{fontSize:"16px"}}>{mxAlert.icon}</span>
          <span style={{fontSize:"10px",fontWeight:"900",color:mxAlert.color,letterSpacing:"2px",textShadow:`0 0 10px ${mxAlert.color}`}}>{mxAlert.title}</span>
          <span style={{fontSize:"7px",background:mxAlert.color,color:"#000",padding:"2px 7px",borderRadius:"2px",fontWeight:"bold",letterSpacing:"1px"}}>IMPACTO DIRECTO</span>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginBottom:"7px"}}>
          {mxAlert.lines.map((l,i)=><div key={i} style={{fontSize:"9px",color:"rgba(255,255,255,0.8)",background:`${mxAlert.color}10`,padding:"5px 10px",borderRadius:"4px",border:`1px solid ${mxAlert.color}20`,flex:"1",minWidth:"180px",lineHeight:1.6,backdropFilter:"blur(4px)"}}>{l}</div>)}
        </div>
        <div style={{fontSize:"8px",color:mxAlert.color,borderTop:`1px solid ${mxAlert.color}15`,paddingTop:"6px"}}>💡 <strong>QUÉ HACER:</strong> {mxAlert.accion}</div>
      </div>}

      <div style={{marginTop:"8px",fontSize:"6px",color:"rgba(255,255,255,0.08)",letterSpacing:"2px",textAlign:"center",position:"relative",zIndex:1}}>MONITOR GLOBAL v10 — USGS · NOAA · OPEN-METEO · OPENSKY · NASA EONET · COINGECKO · FRANKFURTER · CLAUDE AI — TIEMPO REAL</div>

      <style>{`
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.8)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        @keyframes slideIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-100%)}to{opacity:1;transform:translateY(0)}}
        @keyframes rippleOut{0%{transform:scale(0.1);opacity:1}100%{transform:scale(5);opacity:0}}
        @keyframes warningPulse{0%,100%{opacity:1;box-shadow:none}50%{opacity:0.7;box-shadow:0 0 15px currentColor}}
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; background: #010610; }
        ::-webkit-scrollbar-thumb { background: #1a2a3a; border-radius: 2px; }
      `}</style>
    </div>
  );
}
