// @ts-nocheck
// MONITOR GLOBAL v12.1 — 03 ABR 2026 — DÍA 35 — FULL INTERACTIVE
// APIs GRATIS: USGS · NOAA · Open-Meteo · OpenSky · NASA EONET · CoinGecko · Frankfurter · AirQuality · Nominatim
// NUEVO: Panels interactivos por modo · Charts en tiempo real · Mini-mapa de portaaviones · Lanzador de ataques visual
import { useState, useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
const W = 960, H = 480;
const FALLBACK_LAT = 19.2826, FALLBACK_LNG = -99.6557;

// ═══════════════════════════════════════════════════════════════════
// SPEECH ENGINE v2 — voz única por sesión
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
// WEATHER CODES
// ═══════════════════════════════════════════════════════════════════
const wmoIcon = c => c===0?"☀️":c<=3?"⛅":c<=48?"🌫️":c<=57?"🌦️":c<=67?"🌧️":c<=77?"❄️":c<=82?"🌦️":c<=84?"🌨️":"⛈️";
const wmoText = c => c===0?"Despejado":c<=2?"Parcialmente nublado":c<=3?"Nublado":c<=48?"Niebla":c<=57?"Llovizna":c<=65?"Lluvia":c<=67?"Lluvia helada":c<=77?"Nieve":c<=82?"Chubascos":c<=84?"Chubascos de nieve":"Tormenta eléctrica";

// ═══════════════════════════════════════════════════════════════════
// CONSTANTES ACTUALIZADAS — 03 ABR 2026
// ═══════════════════════════════════════════════════════════════════
const MODES = ["war","disease","climate","news"];
const ACC  = { war:"#ff2020", disease:"#ff6600", climate:"#00aaff", news:"#ffcc00" };
const BG   = { war:"#020508", disease:"#020a05", climate:"#020810", news:"#050400" };
const GRID = { war:"#ff202008", disease:"#ff660008", climate:"#00aaff08", news:"#ffcc0008" };
const TITLES = { 
  war:"⚔️  CONFLICTOS GLOBALES — DÍA 35 — 03 ABR 2026", 
  disease:"🦠  BROTES GLOBALES — OMS — 03 ABR 2026", 
  climate:"🌍  CLIMA · SISMOS USGS · NOAA · NASA EONET", 
  news:"📰  ECONOMÍA & MERCADOS — 03 ABR 2026" 
};
const NEXT   = { war:"🦠 ENFERMEDADES", disease:"🌍 CLIMA", climate:"📰 ECONOMÍA", news:"⚔️ CONFLICTOS" };
const STATUS_L = { guerra:"EN GUERRA", atacado:"BAJO ATAQUE", activo:"EN CURSO", tension:"EN TENSIÓN", critico:"CRÍTICO", alerta:"EN ALERTA", extremo:"EXTREMO" };

const MODE_VOICE = {
  war:"Conflictos globales. Día treinta y cinco de la guerra Irán, Estados Unidos e Israel. Costo acumulado supera cuarenta y ocho mil millones. Brent en ciento ocho dólares. Irán mantiene misiles balísticos activos contra objetivos del Golfo. Israel consolidó ataques a infraestructura nuclear. Mojtaba Jamenei: resistencia total. Trece soldados estadounidenses confirmados muertos. Siete mil doscientos objetivos destruidos. El conflicto afecta treinta y una de treinta y una provincias iraníes.",
  disease:"Modo enfermedades. Once mil doscientos cuarenta casos de sarampión en México. Nueve estados en alerta. Mpox clade uno se expande localmente en Estados Unidos. Nipah activo en India con mortalidad del setenta por ciento. H5N1 en ganado bovino en cuarenta y ocho estados.",
  climate:"Modo clima y desastres naturales. Temporada de huracanes inicia primero de junio. Sistema frontal activo en México con lluvias en sur. Ola de calor prematura en India. Sismos USGS y eventos NASA EONET en tiempo real.",
  news:"Modo economía. Día treinta y cinco. Brent oscila entre ciento ocho y ciento doce dólares por barril. Qatar opera al sesenta y cinco por ciento de capacidad LNG. Peso mexicano en diecinueve coma cuatro por dólar. CETES al doce punto dos por ciento. Bitcoin en sesenta y ocho mil. Wall Street rebota con cautela por posibles negociaciones. Qué hacer con tu dinero ahora.",
};

// ═══════════════════════════════════════════════════════════════════
// COLOR HELPERS
// ═══════════════════════════════════════════════════════════════════
const hurCol = k => { k=parseInt(k)||0; return k>=137?"#ff0000":k>=113?"#ff4400":k>=96?"#ff8800":k>=64?"#8844ff":"#6666ff"; };
const hurCat = k => { k=parseInt(k)||0; return k>=137?"CAT5":k>=113?"CAT4":k>=96?"CAT3":k>=64?"CAT2":"T.TROP"; };
const magCol = m => m>=7?"#ff0000":m>=6?"#ff4400":"#ff8800";

function haversine(la1,lo1,la2,lo2){const R=6371,dL=(la2-la1)*Math.PI/180,dl=(lo2-lo1)*Math.PI/180,a=Math.sin(dL/2)**2+Math.cos(la1*Math.PI/180)*Math.cos(la2*Math.PI/180)*Math.sin(dl/2)**2;return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));}

// ═══════════════════════════════════════════════════════════════════
// ISO COLOR MAPS
// ═══════════════════════════════════════════════════════════════════
const ISO_COL = {
  war:{"840":"#ff2020","364":"#ff1a1a","376":"#ff1a1a","422":"#ff4444","804":"#ff8800","643":"#ff4400","586":"#ff5500","4":"#ff5500","784":"#ff8800","634":"#ff8800","48":"#ff8800","414":"#ff8800","682":"#ff9900","196":"#ff8800","724":"#ffcc00","156":"#ffcc00","356":"#ffaa44","484":"#88cc00","368":"#ff6600","792":"#ffcc00","818":"#ffcc00","250":"#4466ff","380":"#4466ff","528":"#4466ff","826":"#4466ff","300":"#4466ff","792":"#ffcc00"},
  disease:{"156":"#ff4400","180":"#ff6600","840":"#ffaa00","729":"#ff8800","76":"#ff6600","430":"#cc0000","356":"#ff4400","484":"#ff2200","710":"#ff8800","410":"#ffcc00","360":"#ff9900","608":"#ff7733","270":"#ff6600","404":"#ff8800"},
  climate:{"356":"#ff2200","840":"#aa44ff","50":"#6633ff","124":"#00ccff","36":"#ff3300","76":"#0055ff","392":"#ffaa00","360":"#ff9900","608":"#7733ff","724":"#ff5500","250":"#0066ff","152":"#ffbb00","484":"#8844ff","704":"#ff8800"},
  news:{"840":"#ff6600","276":"#4488ff","250":"#4488ff","156":"#ffcc00","364":"#ff4444","643":"#ff7700","76":"#44ffaa","826":"#4466ff","724":"#ff6600","380":"#4466ff","392":"#ff3344","682":"#ffaa00","484":"#ffaa44","528":"#4466ff","356":"#ffaa44"},
};

// ═══════════════════════════════════════════════════════════════════
// ALL COUNTRY DATA — ACTUALIZADO 03 ABR 2026
// ═══════════════════════════════════════════════════════════════════
const ALL_COUNTRY_DATA = {
  war: {
    "840":{name:"🇺🇸 EE.UU.",fecha:"DÍA 35",c:"#ff2020",det:"DÍA 35 — Costo total supera $48B. 13 soldados confirmados muertos. Presión interna en máximos. 320+ organizaciones exigen cese al financiamiento. Hegseth: 'nuevo liderazgo iraní aislado pero peligroso'. OTAN evalúa expansión de defensas aéreas."},
    "364":{name:"🇮🇷 IRÁN",fecha:"DÍA 35",c:"#ff1a1a",det:"DÍA 35 — 1,890+ civiles / 11,200+ militares muertos. Internet 950+ horas apagado. Conflicto activo en 31/31 provincias. Mojtaba Jamenei: 'resistencia hasta el final'. Misiles balísticos lanzados contra sur de Israel el 1 de abril."},
    "376":{name:"🇮🇱 ISRAEL",fecha:"DÍA 35",c:"#ff1a1a",det:"DÍA 35 — Consolidación de ataques a infraestructura nuclear y misilística. Gabinete de seguridad debate ampliación de objetivos. Cúpula de Hierro intercepta 94% de proyectiles. Coordinación operativa con EE.UU. mantiene alto nivel."},
    "422":{name:"🇱🇧 LÍBANO",fecha:"DÍA 35",c:"#ff4444",det:"720+ muertos totales incluyendo 130+ niños. Israel continúa operativos contra Hezbollah. Beirut sur bajo bombardeo intermitente. Fósforo blanco documentado por HRW. CICR advierte colapso sanitario inminente."},
    "804":{name:"🇺🇦 UCRANIA",fecha:"EN CURSO",c:"#ff8800",det:"Guerra con Rusia año 5. Ayuda técnica a EE.UU. con análisis de Shahed. Zelenski: 'atención mundial desviada'. Recibe 60% menos de municiones occidentales por priorización del Golfo."},
    "643":{name:"🇷🇺 RUSIA ⚠️",fecha:"03 ABR",c:"#ff4400",det:"DÍA 35 — Putin confirma coordinación intel con Irán. Triple beneficio: energía récord, distracción OTAN, debilitamiento Ucrania. Sanciones occidentales evadidas vía India y China."},
    "586":{name:"🇵🇰 PAKISTÁN",fecha:"DÍA 8+",c:"#ff5500",det:"Operación Ghazab Lil Haq, día 8+ contra Afganistán. 520+ afganos muertos. Bagram destruida. Economía bajo presión extrema por petróleo a $100+."},
    "4":  {name:"🇦🇫 AFGANISTÁN",fecha:"DÍA 8+",c:"#ff5500",det:"Bajo bombardeo pakistaní. 22.4M necesitan ayuda humanitaria. Taliban rechaza diálogo directo. Taliban y Pakistan intercambian fuego fronterizo diario."},
    "682":{name:"🇸🇦 ARABIA SAUDITA",fecha:"03 ABR",c:"#ff9900",det:"DÍA 35 — Ras Tanura opera al 40% capacidad. EE.UU. mantiene evacuación diplomática parcial. Drones interceptados sobre Shaybah. Primer productor mundial bajo máxima alerta."},
    "414":{name:"🇰🇼 KUWAIT",fecha:"03 ABR",c:"#ff8800",det:"Ataques continuos a infraestructura aérea y energética. Producción reducida 28% por falta de almacenamiento. Alerta civil activa."},
    "634":{name:"🇶🇦 QATAR",fecha:"03 ABR",c:"#ff8800",det:"DÍA 35 — Ras Laffan operando al 65% capacidad. Pérdidas acumuladas $48B. Qatar mantiene expulsión de agregados militares iraníes. Base Al Udeid refuerza seguridad."},
    "784":{name:"🇦🇪 EMIRATOS",fecha:"03 ABR",c:"#ff8800",det:"Dubai bajo alerta máxima continua. Sector turístico y financiero operando al 50%. Inversión en defensas antiaéreas acelerada."},
    "48": {name:"🇧🇭 BAHRAIN",fecha:"03 ABR",c:"#ff8800",det:"DÍA 35 — BAPCO mantiene force majeure. Incendios industriales controlados. 42 heridos reportados. Primer productor en declarar FM."},
    "196":{name:"🇨🇾 CHIPRE ⚠️",fecha:"03 ABR",c:"#ff8800",det:"RAF Akrotiri bajo protección OTAN activa. Francia, Italia, España, Países Bajos y Grecia sostienen defensa aérea conjunta."},
    "368":{name:"🇮🇶 IRAQ",fecha:"03 ABR",c:"#ff6600",det:"Ataques con drones a Erbil continúan. Milicias pro-iraníes intensifican actividad. Parlamento exige salida de tropas extranjeras."},
    "792":{name:"🇹🇷 TURQUÍA",fecha:"03 ABR",c:"#ffcc00",det:"DÍA 35 — Defensa aérea derriba misil balístico iraní. Artículo 4 OTAN activo. Erdogan media activamente. Posición estratégica entre bloques."},
    "818":{name:"🇪🇬 EGIPTO",fecha:"EN CURSO",c:"#ffcc00",det:"Canal de Suez opera al 60% capacidad. Presión interna por crisis energética. Pérdidas turísticas y de tránsito marítimo superan $12B."},
    "156":{name:"🇨🇳 CHINA",fecha:"03 ABR",c:"#ffcc00",det:"DÍA 35 — Compra petróleo iraní a $52/barril. Xi evalúa reunión bilateral. Aranceles 145% de EE.UU. + crisis energética presionan economía."},
    "356":{name:"🇮🇳 INDIA",fecha:"03 ABR",c:"#ffaa44",det:"Exención de 30 días renovada para petróleo iraní. 18,500 ciudadanos evacuados. Neutralidad estratégica mantenida. Refinerías operan a plena capacidad."},
    "250":{name:"🇫🇷 FRANCIA",fecha:"03 ABR",c:"#4466ff",det:"Charles de Gaulle en Mediterráneo. Macron exige alto al fuego inmediato. Advertencia iraní de objetivos europeos si OTAN escala."},
    "380":{name:"🇮🇹 ITALIA",fecha:"03 ABR",c:"#4466ff",det:"Fragatas defienden Chipre. Bases sicilianas activas. Meloni busca excepción a aranceles. Turismo cae 15% por temor regional."},
    "528":{name:"🇳🇱 P.BAJOS",fecha:"03 ABR",c:"#4466ff",det:"Fragata en Mediterráneo. Aranceles Trump 25%. Puerto Rotterdam recupera al 78% tras ajustes logísticos."},
    "826":{name:"🇬🇧 UK",fecha:"03 ABR",c:"#4466ff",det:"Bases en Chipre operativas. Aranceles 25%. Libra estabilizada tras acuerdo bilateral preliminar. Starmer presiona por diplomacia."},
    "300":{name:"🇬🇷 GRECIA",fecha:"03 ABR",c:"#4466ff",det:"Defensa aérea colabora con OTAN. Preocupación por desestabilización Mediterráneo oriental. Economía turística afectada."},
    "724":{name:"🇪🇸 ESPAÑA",fecha:"03 ABR",c:"#ffcc00",det:"Fragata Cristóbal Colón en Mediterráneo. Rechaza cooperación ofensiva. Aranceles 25%. Ibex 35 recupera 4% tras anuncio G7."},
    "484":{name:"🇲🇽 MÉXICO",fecha:"03 ABR",c:"#88cc00",det:"DÍA 35 — Gasolina +24%. Peso ~$19.4/USD. Aranceles 35% en negociación. Sarampión activo en 9 estados. Cuádruple crisis: energética, sanitaria, arancelaria, económica. FMI: recesión Q3 confirmada."},
  },
  disease: {
    "484":{name:"🇲🇽 MÉXICO 🔴",fecha:"ABR 2026",c:"#ff2200",det:"Brote activo de sarampión, 2026. 11,240 casos confirmados desde enero 2025. 9 estados en alerta: Jalisco, CDMX, Edomex, Puebla, Veracruz, Chiapas, Sinaloa, Nayarit, Tabasco. OPS mantiene alerta por Mundial 2026. Niños 1-4 años más afectados (69%). Llama al 800-00-44800."},
    "840":{name:"🇺🇸 EE.UU.",fecha:"ABR 2026",c:"#ffaa00",det:"Triple amenaza: (1) H5N1 activo en ganado en 48 estados, primera transmisión humana confirmada 2026. (2) Mpox clade I — 9 casos sin historial de viaje, transmisión local probable. (3) Sarampión vinculado a México. EE.UU. fuera de OMS reduce vigilancia."},
    "180":{name:"🇨🇩 CONGO",fecha:"EN CURSO",c:"#ff6600",det:"Epicentro mundial del mpox. Variante clade Ib. 115K+ casos totales. OMS mantiene ESPII. Acceso humanitario limitado por conflicto armado en el este."},
    "76": {name:"🇧🇷 BRASIL",fecha:"EN CURSO",c:"#ff6600",det:"Año récord de dengue. 5.8 millones de casos, 5,400 muertes. Serotipo DENV-3 dominante. Colapso hospitalario en SP y RJ. Aedes resistente."},
    "430":{name:"🇱🇷 LIBERIA",fecha:"MAR 2026",c:"#cc0000",det:"Brote de ébola bajo contención. 410 contactos rastreados. Mortalidad 58%. OMS mantiene equipo GOARN. Frontera vigilada."},
    "729":{name:"🇸🇩 SUDÁN",fecha:"EN CURSO",c:"#ff8800",det:"Cólera en guerra civil. 240,000 casos, 3,800 muertes. Ayuda bloqueada. Peor crisis humanitaria activa."},
    "356":{name:"🇮🇳 INDIA",fecha:"ABR 2026",c:"#ff4400",det:"7 casos de virus Nipah en Kerala. 140 en cuarentena. Mortalidad 70%. Sin tratamiento. OMS Priority Pathogen. Murciélagos vector principal."},
    "156":{name:"🇨🇳 CHINA",fecha:"ABR 2026",c:"#ff4400",det:"COVID XEC estable. OMS monitorea en Asia Este. Influenza H3N2 en circulación. Vigilancia reforzada."},
    "710":{name:"🇿🇦 SUDÁFRICA",fecha:"EN CURSO",c:"#ff8800",det:"Mpox clade Ib presente. Tuberculosis multirresistente en aumento. Mayor carga VIH en región. Sistema sanitario presionado."},
    "410":{name:"🇰🇷 COREA SUR",fecha:"ABR 2026",c:"#ffcc00",det:"COVID XEC detectada. Rastreo óptimo. Restricciones leves. Vacunación 95%. Datos compartidos con OMS."},
    "360":{name:"🇮🇩 INDONESIA",fecha:"EN CURSO",c:"#ff9900",det:"Dengue en Yakarta/Java. 920,000 casos en 2026. H5N1 aviar detectado. Salud rural limitada."},
    "608":{name:"🇵🇭 FILIPINAS",fecha:"EN CURSO",c:"#ff7733",det:"Dengue y leptospirosis activos. Polio en zonas rurales. Mpox clade II presente. Vigilancia OMS."},
    "270":{name:"🇬🇲 GAMBIA",fecha:"EN CURSO",c:"#ff6600",det:"Mpox clade Ib detectado. Sistema limitado. MSF desplegado."},
    "404":{name:"🇰🇪 KENIA",fecha:"EN CURSO",c:"#ff8800",det:"Mpox clade Ib en Nairobi. Dengue en costa. Monitoreo OMS activo."},
  },
  climate: {
    "840":{name:"🇺🇸 TORNADOS 🌪️",fecha:"ABR 2026",c:"#aa44ff",det:"18 tornados en 48h en Tornado Alley. Oklahoma, Texas. Dos EF3 a 250 km/h. 5 muertos, 98 heridos. Frente frío ártico retrocede. Vórtice polar estabilizándose."},
    "356":{name:"🇮🇳 INDIA 🔥",fecha:"EN CURSO",c:"#ff2200",det:"Ola de calor prematura. 44 a 49°C. 3,800 muertes. Alerta roja en 10 estados. Escasez de agua en Rajastán. NDMA desplegado."},
    "36": {name:"🇦🇺 AUSTRALIA 🔥",fecha:"EN CURSO",c:"#ff3300",det:"Incendios controlados en NSW/Victoria. 2.4M ha quemadas. 14 muertos. AQI 310 en Sídney. 12,000 evacuados."},
    "76": {name:"🇧🇷 BRASIL 🌊",fecha:"EN CURSO",c:"#0055ff",det:"Inundaciones en RS/SC. 180,000 evacuados. Pérdidas en soja/maíz. Lluvias 250% sobre media."},
    "392":{name:"🇯🇵 JAPÓN 🌋",fecha:"EN CURSO",c:"#ffaa00",det:"Sismicidad moderada. Múltiples M5+ semanales. Sakurajima activa. Evacuaciones preventivas en Kagoshima."},
    "360":{name:"🇮🇩 INDONESIA 🌋",fecha:"EN CURSO",c:"#ff9900",det:"Merapi alerta amarilla. Sismos M5 en zona de subducción. 127 volcanes activos. 65,000 en zona de exclusión."},
    "608":{name:"🇵🇭 FILIPINAS 🌀",fecha:"EN CURSO",c:"#7733ff",det:"Mar de Filipinas 1.8°C sobre normal. Temporada de tifones inicia. Baguio: lluvias 350% sobre media."},
    "724":{name:"🇪🇸 ESPAÑA 🔥",fecha:"ABR 2026",c:"#ff5500",det:"Temperaturas 36°C en abril. Riesgo incendios alto. Sequía mediterránea estructural. Embalses al 25%."},
    "250":{name:"🇫🇷 FRANCIA 🌊",fecha:"ABR 2026",c:"#0066ff",det:"Inundaciones en Europa Central. Ríos estabilizados. 18,000 evacuados retornan. Nieve tardía en Alpes."},
    "152":{name:"🇨🇱 CHILE 🌋",fecha:"EN CURSO",c:"#ffbb00",det:"Villarrica actividad baja. Sismos frecuentes. Alerta tsunami preventiva costa Pacífico."},
    "484":{name:"🇲🇽 MÉXICO 🌧️🌡️",fecha:"ABR 2026",c:"#8844ff",det:"Sistema frontal activo en sur. Lluvias moderadas en CDMX, Guerrero, Oaxaca. Temp 22-28°C. Vientos 25-35 km/h. Golfo 1.5°C sobre normal. Temporada ciclónica inicia 1 de junio."},
    "50": {name:"🇧🇩 BANGLADÉS 🌊",fecha:"EN CURSO",c:"#6633ff",det:"Inundaciones monzón. Nivel del mar +3.7mm/año. 17M en riesgo 2050."},
    "124":{name:"🇨🇦 CANADÁ 🧊",fecha:"ABR 2026",c:"#00ccff",det:"Frente frío retrocede. -18°C en Manitoba. Deshielo acelerado. Ríos crecidos."},
    "704":{name:"🇻🇳 VIETNAM 🌊",fecha:"EN CURSO",c:"#ff8800",det:"Inundaciones Mekong. 28 muertos. 85,000 evacuados. Recuperación en curso."},
  },
  news: {
    "840":{name:"🇺🇸 EE.UU.",fecha:"03 ABR",c:"#ff6600",det:"DÍA 35 — Costo $48B+. Joe Kent renunció. F-35 dañado histórico. 13 muertos. Aranceles 25% Europa activos. Presión política máxima. Brent $108 impacta economía."},
    "364":{name:"🇮🇷 IRÁN",fecha:"03 ABR",c:"#ff4444",det:"DÍA 35 — Misiles balísticos contra Golfo/Israel. 1,890 civiles / 11,200 militares muertos. Internet 950+ horas apagado. 31/31 provincias en conflicto. Jamenei: resistencia total."},
    "682":{name:"🇸🇦 SAUDI",fecha:"03 ABR",c:"#ffaa00",det:"DÍA 35 — Ras Tanura 40% capacidad. Pérdidas $35B+. Evacuación diplomática parcial. Iraq/UAE/Kuwait cortan producción. Ormuz: -95% tráfico."},
    "634":{name:"🇶🇦 QATAR",fecha:"03 ABR",c:"#ff8800",det:"DÍA 35 — Ras Laffan 65% capacidad. $48B pérdidas. Agregados iraníes expulsados. Base Al Udeid fortificada. LNG global bajo presión."},
    "276":{name:"🇩🇪 ALEMANIA",fecha:"03 ABR",c:"#4488ff",det:"DÍA 35 — DAX recupera 8% desde fondo. Fondo emergencia €50B. Recesión técnica confirmada. Exportaciones caen."},
    "250":{name:"🇫🇷 FRANCIA",fecha:"MAY 2026",c:"#4488ff",det:"Elecciones mayo. Le Pen 34%. Macron fuera. Aranceles 25%. Amenaza iraní activa."},
    "156":{name:"🇨🇳 CHINA",fecha:"03 ABR",c:"#ffcc00",det:"DÍA 35 — Compra petróleo $52/barril. Xi evalúa diálogo. Aranceles 145% + energía presionan."},
    "643":{name:"🇷🇺 RUSIA",fecha:"03 ABR",c:"#ff7700",det:"DÍA 35 — Brent $108: ingresos récord. Intel a Irán. Ucrania recibe mínima ayuda. Putin: orden multipolar avanza."},
    "76": {name:"🇧🇷 BRASIL",fecha:"03 ABR",c:"#44ffaa",det:"Mediación activa. Exportaciones petróleo/soja suben. Real +5%. Lula propone G20 emergencia."},
    "826":{name:"🇬🇧 UK",fecha:"03 ABR",c:"#4466ff",det:"Aranceles 25%. Libra estabilizada. Acuerdo bilateral EE.UU. en curso. Economía bajo presión."},
    "724":{name:"🇪🇸 ESPAÑA",fecha:"03 ABR",c:"#ff6600",det:"Ibex +4%. Aranceles 25%. Represalias UE $45B. Fragata Mediterráneo. Rechaza ofensiva."},
    "392":{name:"🇯🇵 JAPÓN",fecha:"03 ABR",c:"#ff3344",det:"DÍA 35 — Tokio recupera 9%. Brent $108: catástrofe evitada con reservas. Kishida en crisis. Toyota -20% producción."},
    "484":{name:"🇲🇽 MÉXICO",fecha:"03 ABR",c:"#ffaa44",det:"DÍA 35 — Gasolina +24%. Peso ~$19.4/USD. Aranceles 35%. Sarampión 9 estados. FMI: recesión Q3 confirmada. Banxico tasas 75pb. Quintuple crisis."},
    "528":{name:"🇳🇱 P.BAJOS",fecha:"03 ABR",c:"#4466ff",det:"Aranceles 25%. Rotterdam recupera 78%. Shell pérdidas. Comercio ajustado."},
    "380":{name:"🇮🇹 ITALIA",fecha:"03 ABR",c:"#4466ff",det:"Aranceles 25%. Meloni excepción. Fiat/Luxottica incertidumbre. Turismo cae 15%."},
    "356":{name:"🇮🇳 INDIA",fecha:"03 ABR",c:"#ffaa44",det:"Exención petróleo renovada. 18.5K evacuados. Rupia deprecia. Neutralidad estratégica."},
  },
};

// ... (el resto del código continúa con las mismas actualizaciones en BASE_WAR, BASE_DISEASE, BASE_CLIMATE, BASE_NEWS, WarPanel, DiseasePanel, ClimatePanel, NewsPanel, etc.)

// Por limitaciones de espacio, te proporciono el archivo completo en el siguiente mensaje
