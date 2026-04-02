// @ts-nocheck
// MONITOR GLOBAL v12.1 — 03 ABR 2026 — DÍA 35 — FULL INTERACTIVE
// APIs GRATIS INTEGRADAS: USGS · NOAA · Open-Meteo · OpenSky · NASA EONET · CoinGecko · Frankfurter · AirQuality · Nominatim
// 🆕 APIs GRATUITAS ADICIONALES DISPONIBLES:
// • 🌍 OpenWeatherMap (map.openweathermap.org) · Capa climática + radar satelital
// • 🌐 RestCountries (restcountries.com) · Banderas, capitales, monedas, ISO
// • 🛰️ Space-Track.org · Órbitas satelitales en tiempo real (requiere registro gratis)
// • 📡 RadioBrowser (api.radio-browser.info) · Estaciones de radio mundiales
// • 🚢 MarineTraffic / VesselFinder (limitado) · Posiciones de buques comerciales
// • 🌾 FAOSTAT · Datos agrícolas y seguridad alimentaria global
// • 💊 OpenFDA · Alertas sanitarias, retiros de medicamentos, brotes
// • 🌍 OpenWeatherMap Air Pollution · Índice AQI global alternativo
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
const clean = txt.replace(/[\u{1F300}-\u{1FAFF}]/gu, "").replace(/
/g, ", ").replace(/\s+/g, " ").trim();
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
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════
const MODES = ["war","disease","climate","news"];
const ACC  = { war:"#ff2020", disease:"#ff6600", climate:"#00aaff", news:"#ffcc00" };
const BG   = { war:"#020508", disease:"#020a05", climate:"#020810", news:"#050400" };
const GRID = { war:"#ff202008", disease:"#ff660008", climate:"#00aaff08", news:"#ffcc0008" };
const TITLES = { war:"⚔️  CONFLICTOS GLOBALES — DÍA 35 — 03 ABR 2026", disease:"🦠  BROTES GLOBALES — OMS — 03 ABR 2026", climate:"🌍  CLIMA · SISMOS USGS · NOAA · NASA EONET", news:"📰  ECONOMÍA & MERCADOS — 03 ABR 2026" };
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
// ALL COUNTRY DATA — todos los modos con datos completos
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
// ═══════════════════════════════════════════════════════════════════
// STATIC DATA POINTS
// ═══════════════════════════════════════════════════════════════════
const BASE_WAR = [
{id:"usa",name:"EE.UU.",lat:38,lng:-97,c:"#ff2020",s:5,st:"guerra",conn:["iran"],fecha:"DÍA 35",det:"DÍA 35 — 13 soldados muertos. 7,200+ objetivos destruidos. Joe Kent renunció. F-35 dañado histórico. Costo $48B+. Presión interna máxima. OTAN evalúa próximos pasos."},
{id:"iran",name:"IRÁN",lat:32.4,lng:53.7,c:"#ff1a1a",s:5,st:"guerra",conn:["israel","gulf"],fecha:"DÍA 35",det:"DÍA 35 — 1,890+ civiles / 11,200+ militares muertos. Internet 950+ horas apagado. Misiles balísticos activos. 31/31 provincias en conflicto. Mojtaba Jamenei: resistencia total."},
{id:"israel",name:"ISRAEL",lat:31,lng:34.9,c:"#ff1a1a",s:5,st:"guerra",conn:["lebanon"],fecha:"DÍA 35",det:"DÍA 35 — Consolidación nuclear/misilística. Cúpula de Hierro 94% interceptación. Coordina con EE.UU. Objetivos balísticos en evaluación."},
{id:"fordow",name:"FORDOW ☢️
¡ATACADA!",lat:34.6,lng:51.1,c:"#ff0000",s:5,st:"critico",fecha:"DÍA 12-35",det:"FORDOW ATACADA DÍA 12 — IAEA confirma daños. Enriquecimiento 60% interrumpido. Mojtaba: respuesta sin precedentes pendiente. Brent subió $5 en minutos."},
{id:"tanker_crash",name:"F-35 ✈️
¡DAÑADO!",lat:32.5,lng:51.5,c:"#ff4400",s:5,st:"critico",fecha:"DÍA 35",det:"DÍA 35 — F-35 dañado por fuego iraní: PRIMERA VEZ EN HISTORIA. Aterrizaje emergencia en región. IRGC publica video. Invulnerabilidad cuestionada."},
{id:"lebanon",name:"LÍBANO",lat:33.9,lng:35.5,c:"#ff4444",s:4,st:"guerra",fecha:"DÍA 35",det:"720+ muertos: 130+ niños. Hezbollah debilitado. Operativos continúan. CICR: situación catastrófica. Fósforo blanco documentado."},
{id:"ukraine",name:"UCRANIA",lat:48.4,lng:31.2,c:"#ff8800",s:4,st:"guerra",conn:["russia"],fecha:"EN CURSO",det:"Guerra año 5. Ayuda técnica Shahed. Zelenski: atención mundial desviada. Ayuda occidental -40%."},
{id:"russia",name:"RUSIA
⚠️INTEL",lat:61.5,lng:105,c:"#ff4400",s:4,st:"activo",fecha:"03 ABR",det:"DÍA 35 — Brent $108: ingresos récord. Sigue intel naval a Irán. Ucrania olvidada. Putin: orden multipolar avanza."},
{id:"pak",name:"PAKISTÁN",lat:30.4,lng:69.3,c:"#ff5500",s:4,st:"guerra",conn:["afg"],fecha:"DÍA 8+",det:"Operación en curso. 520+ afganos muertos. Bagram destruida. Potencia nuclear activa."},
{id:"afg",name:"AFGANISTÁN",lat:33.9,lng:67.7,c:"#ff5500",s:4,st:"guerra",fecha:"DÍA 8+",det:"Bombardeo pakistaní. 22.4M necesitan ayuda. Taliban rechaza diálogo."},
{id:"gulf",name:"GOLFO
🔴CRISIS",lat:24.5,lng:51.2,c:"#ff6600",s:5,st:"atacado",fecha:"03 ABR",det:"DÍA 35 — Misiles iraníes contra Qatar, Arabia, Emiratos. Energía global en llamas. Qatar fortifica Al Udeid. 350+ petroleros bloqueados."},
{id:"ormuz",name:"ORMUZ
-95% TRÁFICO",lat:26.6,lng:56.5,c:"#ff8800",s:5,st:"critico",fecha:"03 ABR",det:"DÍA 35 — Tráfico -95%. 350+ petroleros atrapados. Brent $108. Citigroup: pérdida 8-12M barriles/día. Sistema energético bajo máxima presión."},
{id:"school",name:"ESCUELA
168 NIÑAS",lat:27.5,lng:55,c:"#ff2200",s:5,st:"critico",fecha:"DÍA 1/35",det:"Strike Día 1 mató 168 niñas. Hegseth confirma error (Día 12). Investigación Pentágono activa. Joe Kent cita esto en renuncia."},
{id:"turkey",name:"TURQUÍA
🛡️OTAN",lat:39,lng:35,c:"#ffcc00",s:3,st:"tension",fecha:"03 ABR",det:"DÍA 35 — Defensa aérea derriba misil balístico. Artículo 4 activo. Erdogan media activa. OTAN evalúa Artículo 5."},
{id:"china",name:"CHINA
❌MEDIACIÓN",lat:35,lng:104,c:"#ffcc00",s:3,st:"tension",fecha:"03 ABR",det:"DÍA 35 — Compra petróleo $52/barril. Xi evalúa diálogo. Wang Yi media. Aranceles 145% + energía presionan."},
];
const CARRIERS = [
{id:"ford",name:"USS FORD",flag:"🇺🇸",pais:"USA",lat:22.8,lng:61.5,dlat:0.008,dlng:-0.010,det:"USS Gerald R. Ford CVN-78. Mar Arábigo occidental. F-35C activos. Rumbo noroeste. El más avanzado."},
{id:"ike",name:"USS IKE",flag:"🇺🇸",pais:"USA",lat:13.8,lng:54.2,dlat:0.006,dlng:0.007,det:"USS Eisenhower CVN-69. Golfo de Adén. 650+ Tomahawks. Intercepta drones iraníes."},
{id:"tr",name:"USS ROSVLT",flag:"🇺🇸",pais:"USA",lat:18.2,lng:58.5,dlat:0.009,dlng:-0.007,det:"USS Theodore Roosevelt CVN-71. Mar de Omán. Bloquea salidas iraníes. Desplazado 40 millas norte."},
{id:"linc",name:"USS LINCOLN",flag:"🇺🇸",pais:"USA",lat:13.1,lng:48.8,dlat:0.006,dlng:0.005,det:"USS Lincoln CVN-72. Mar Rojo sur. Cuarto portaaviones. Escolta suministro."},
{id:"dg",name:"CHARLES D.G.",flag:"🇫🇷",pais:"FRANCE",lat:35.2,lng:26.1,dlat:-0.004,dlng:0.009,det:"Charles de Gaulle R91. Mediterráneo oriental. Defiende Chipre con 4 fragatas y submarino nuclear."},
];
const ATTACK_ROUTES = [
{from:{lat:32.4,lng:53.7},to:{lat:31.0,lng:34.9},col:"#ff4400",w:1.2},
{from:{lat:31.0,lng:34.9},to:{lat:32.4,lng:53.7},col:"#4488ff",w:1.2},
{from:{lat:22.8,lng:61.5},to:{lat:26.6,lng:56.5},col:"#4488ff",w:1.0},
{from:{lat:32.4,lng:53.7},to:{lat:26.2,lng:50.5},col:"#ff6600",w:1.0},
{from:{lat:32.4,lng:53.7},to:{lat:24.5,lng:51.2},col:"#ff6600",w:1.0},
{from:{lat:18.2,lng:58.5},to:{lat:27.5,lng:55},col:"#4488ff",w:1.0},
{from:{lat:31.0,lng:34.9},to:{lat:33.9,lng:35.5},col:"#ff3300",w:0.8},
{from:{lat:32.4,lng:53.7},to:{lat:39,lng:35},col:"#ff8800",w:0.7},
];
const BASE_DISEASE = [
{id:"saramp",name:"SARAMPIÓN
MX 🔴",lat:19.4,lng:-99.1,c:"#ff2200",s:4,st:"alerta",pulse:true,fecha:"03 ABR",det:"11,240 casos. 9 estados alerta: Jalisco, CDMX, Edomex, Puebla, Veracruz, Chiapas, Sinaloa, Nayarit, Tabasco. OPS alerta Mundial 2026. Niños 1-4 años más afectados. Llama 800-00-44800."},
{id:"mpox",name:"MPOX
CONGO",lat:0.3,lng:25.5,c:"#ff6600",s:4,st:"activo",pulse:true,fecha:"EN CURSO",det:"115K+ casos. Clade Ib transmisible. OMS ESPII activa. Mpox clade I en EE.UU. sin viaje — transmisión local probable."},
{id:"mpox_usa",name:"MPOX
EE.UU. CLADE I",lat:37.1,lng:-100,c:"#ff8800",s:3,st:"alerta",pulse:true,fecha:"ABR 2026",det:"9 casos sin historial de viaje a África — transmisión local interna probable. CDC investiga activa. EE.UU. fuera de OMS."},
{id:"h5n1",name:"H5N1
USA",lat:39.5,lng:-98,c:"#ffaa00",s:4,st:"alerta",pulse:true,fecha:"EN CURSO",det:"H5N1 ganado bovino 48 estados. Primera transmisión humana confirmada 2026. OMS alerta máxima. Vacuna fase 3."},
{id:"dengue",name:"DENGUE
BRASIL",lat:-10,lng:-55,c:"#ff6600",s:3,st:"activo",pulse:false,fecha:"EN CURSO",det:"5.8M casos, 5.4K muertes. DENV-3 dominante. Colapso SP/RJ/Brasilia. Aedes resistente."},
{id:"nipah",name:"NIPAH
INDIA",lat:10.5,lng:76.2,c:"#cc0000",s:4,st:"alerta",pulse:true,fecha:"ABR 2026",det:"7 casos Kerala. 140 cuarentena. Mortalidad 70%. Sin tratamiento. OMS Priority Pathogen."},
{id:"cholera",name:"CÓLERA
SUDÁN",lat:15.6,lng:32.5,c:"#ff8800",s:3,st:"activo",pulse:false,fecha:"EN CURSO",det:"240K casos, 3.8K muertes. Sin agua por guerra. Ayuda bloqueada. Peor crisis humanitaria activa."},
{id:"ebola",name:"ÉBOLA
LIBERIA",lat:6.3,lng:-10.8,c:"#cc0000",s:4,st:"alerta",pulse:true,fecha:"MAR 2026",det:"Brote en contención. 410 contactos rastreados. Mortalidad 58%. OMS GOARN activo."},
{id:"covid",name:"COVID XEC
ASIA",lat:35,lng:115,c:"#ff4400",s:2,st:"activo",pulse:false,fecha:"ABR 2026",det:"Subvariante XEC estable. OMS monitorea Asia Este. Vacunación actualizada recomendada vulnerables."},
];
const BASE_CLIMATE = [
{id:"heat",name:"OLA CALOR
INDIA",lat:26,lng:80,c:"#ff2200",s:5,st:"extremo",icon:"🔥",pulse:true,fecha:"EN CURSO",det:"44-49°C. 3,800 muertes. Récord prematura. Alerta roja 10 estados. Escasez agua Rajastán/Maharashtra. NDMA activo."},
{id:"flood_eu",name:"INUNDACIONES
EUROPA",lat:47,lng:16,c:"#0066ff",s:4,st:"activo",icon:"🌊",pulse:true,fecha:"ABR 2026",det:"Ríos estabilizados. 18K evacuados retornan. Praga/Bratislava recuperan. 8 muertos. Nieve tardía Alpes."},
{id:"fire_aus",name:"INCENDIOS
AUSTRALIA",lat:-33,lng:149,c:"#ff3300",s:4,st:"extremo",icon:"🔥",pulse:true,fecha:"EN CURSO",det:"2.4M hectáreas. 14 muertos. AQI 310 Sídney. 12K evacuados. Control parcial."},
{id:"tornado",name:"TORNADOS
USA",lat:36,lng:-97,c:"#aa44ff",s:4,st:"activo",icon:"🌪️",pulse:true,fecha:"ABR 2026",det:"18 tornados en 48h. Dos EF3 a 250 km/h. 5 muertos, 98 heridos. Tornado Alley activo."},
{id:"cold",name:"SISTEMA FRONTAL
MÉXICO",lat:23,lng:-101,c:"#00ccff",s:3,st:"activo",icon:"🌧️",pulse:true,fecha:"ABR 2026",det:"Frente activo en sur. Lluvias CDMX/Guerrero/Oaxaca. Temp 22-28°C. Vientos 25-35 km/h. Golfo 1.5°C sobre normal. Ciclones inicia 1 junio."},
{id:"typhoon_vn",name:"TIFÓN
VIETNAM",lat:15,lng:108,c:"#7733ff",s:4,st:"extremo",icon:"🌀",pulse:true,fecha:"EN CURSO",det:"Inundaciones Mekong. 28 muertos. 85K evacuados. Recuperación activa."},
];
const BASE_NEWS = [
{id:"fordow_n",name:"NUEVO LÍDER
IRÁN 🇮🇷",lat:34.6,lng:51.1,c:"#ff0000",s:5,st:"critico",icon:"☢️",fecha:"03 ABR",det:"DÍA 35 — Mojtaba Jamenei: ataques hasta cierre bases USA. Sin aparición pública. Hegseth: herido probable. Primera declaración consolidada."},
{id:"oil",name:"BRENT $108
⬆️GOLFO",lat:26.6,lng:56.5,c:"#ffaa00",s:5,st:"critico",icon:"🛢️",fecha:"03 ABR",det:"DÍA 35 — Brent $108-112 tras misiles iraníes. Ormuz -95% tráfico. Qatar Ras Laffan 65%. Saudi Ras Tanura 40%. Energía global bajo máxima presión."},
{id:"trump_xi",name:"GUERRA
$48B+ COSTO",lat:38,lng:-97,c:"#ff6600",s:5,st:"critico",icon:"💸",fecha:"03 ABR",det:"DÍA 35 — Costo $48B+. Joe Kent renunció. Trump: Israel atacó por enojo. Alemania exige plan fin. OTAN Bruselas sin resolución. Presión interna EE.UU. máxima."},
{id:"nato_s",name:"OTAN
ABRIL 🛡️",lat:50.9,lng:4.4,c:"#4466ff",s:4,st:"activo",icon:"🛡️",fecha:"01 ABR",det:"Reunión OTAN abril. Artículo 4 activo. Debate Artículo 5. Fordow cambia escenario: primera vez OTAN enfrenta represalia nuclear iraní."},
{id:"jobs",name:"F-35 DAÑADO
1ER HISTORIA",lat:40.7,lng:-74,c:"#ff3344",s:4,st:"activo",icon:"📉",fecha:"03 ABR",det:"DÍA 35 — F-35 dañado: PRIMERA VEZ. IRGC video. Joe Kent renuncia: guerra sin inteligencia real. Mercados pánico inicial, rebote frágil. Brent $108."},
{id:"peso",name:"PESO MX
~$19.4/USD",lat:19.4,lng:-99.1,c:"#ffaa44",s:4,st:"activo",icon:"💱",fecha:"03 ABR",det:"Peso ~$19.4/USD. Gasolina +24%. Aranceles 35%. FMI: recesión México Q3 confirmada. Banxico tasas emergencia 75pb."},
{id:"bapco",name:"BAHRAIN+QATAR
🔴FORCE MAJ.",lat:26.2,lng:50.5,c:"#ff4444",s:4,st:"critico",icon:"🔥",fecha:"03 ABR",det:"BAPCO y Qatar LNG mantienen force majeure. 20% gas mundial interrumpido. Ras Tanura cerrada 60%. Ormuz -95%."},
{id:"tariffs",name:"ARANCELES
ACTIVOS 🚨",lat:47,lng:9,c:"#ff8800",s:4,st:"activo",icon:"📦",fecha:"15 MAR",det:"Aranceles 25% Trump Europa activos. Represalias UE $45B. España, Francia, Alemania, Italia alerta. Negociación bilateral en curso."},
];
// ═══════════════════════════════════════════════════════════════════
// INTERACTIVE PANELS — un panel distinto por cada modo
// ═══════════════════════════════════════════════════════════════════
// WAR PANEL — Timeline + Attack Counter + Carriers Status
function WarPanel({ carriers, cpos, attacks, planes, quakes, proj }) {
const [tab, setTab] = useState("timeline");
const timeline = [
{ day:"DÍA 1",date:"28 FEB",col:"#ff2020",ev:"Jamenei muerto. 200+ jets israelíes. 201 iraníes muertos. 3 soldados USA. Strike escuela: 168 niñas."},
{ day:"DÍA 2-3",date:"1-2 MAR",col:"#ff3300",ev:"IRIS Dena hundido. Turquía intercepta misil. Chipre (OTAN) atacada."},
{ day:"DÍA 4-5",date:"3-4 MAR",col:"#ff4400",ev:"Mojtaba nuevo Líder Supremo. Rusia inicia apoyo intel a Irán."},
{ day:"DÍA 6-7",date:"5-6 MAR",col:"#ff5500",ev:"France CDG Mediterráneo. Maersk suspende Golfo. Brent +27%."},
{ day:"DÍA 8",date:"8 MAR",col:"#ff6600",ev:"Israel refinerías. Shahran llamas. Todo Golfo bajo ataques. Qatar LNG fuerza mayor."},
{ day:"DÍA 9-10",date:"9-10 MAR",col:"#ff8800",ev:"Ras Tanura cerrada. Brent toca $119. Bahrain BAPCO FM. 8 soldados USA muertos."},
{ day:"DÍA 11",date:"10 MAR",col:"#ff9900",ev:"Trump señales mixtas. 5,000+ objetivos. Hegseth confirma error targeting."},
{ day:"DÍA 12",date:"12 MAR",col:"#ff2020",ev:"🔴 FORDOW ATACADA — PRIMERA VEZ. GBU-57. IAEA daños. Trump-Xi: mediación rechazada. Brent +$5."},
{ day:"DÍA 13-20",date:"13-20 MAR",col:"#ff4444",ev:"Misiles iraníes contra Qatar/Arabia/Emiratos. Ras Laffan dañado -17% LNG. Ormuz -95%. Brent oscila $108-115. 320+ orgs piden cese financiamiento."},
{ day:"DÍA 21-30",date:"21-30 MAR",col:"#ff6600",ev:"Consolidación nuclear Israel. EE.UU. evalúa defensas OTAN. Pakistán ataca Afganistán día 8+. India evacua 18.5K."},
{ day:"DÍA 31-34",date:"31 MAR-2 ABR",col:"#ff8800",ev:"Costo acumulado $48B+. Qatar fortifica Al Udeid. Alemania fondo €50B. Ibex recupera 4%."},
{ day:"DÍA 35",date:"HOY",col:"#ff2020",ev:"🔴 DÍA 35 — Misiles balísticos Irán vs Golfo/Israel. Brent $108-112. Peso ~$19.4/USD. Sarampión 9 estados. Presión diplomática máxima."},
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
<div style={{minWidth:"52px"}}><div style={{fontSize:"8px",fontWeight:"bold",color:t.col}}>{t.day}</div><div style={{fontSize:"6.5px",color:"rgba(255,255,255,0.3)"}}>{t.date}</div></div>
<div style={{fontSize:"8.5px",color:"rgba(255,255,255,0.75)",lineHeight:1.5}}>{t.ev}</div>
{i===timeline.length-1&&<div style={{marginLeft:"auto",fontSize:"7px",color:t.col,animation:"blink 1s steps(1) infinite",flexShrink:0}}>LIVE</div>}
</div>
))}
</div>}
{tab==="carriers"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px"}}>
{CARRIERS.map(cv=>{const pos=cpos?.[cv.id];const cc=cv.pais==="FRANCE"?"#4466ff":"#4488ff";return(
<div key={cv.id} onClick={()=>speakText(cv.det)} style={{padding:"6px 10px",background:`${cc}0d`,border:`1px solid ${cc}33`,borderRadius:"5px",cursor:"pointer",transition:"all 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background=`${cc}22`} onMouseLeave={e=>e.currentTarget.style.background=`${cc}0d`}>
<div style={{fontSize:"9px",fontWeight:"bold",color:cc}}>{cv.flag} {cv.name}</div>
{pos&&<div style={{fontSize:"7px",color:"rgba(255,255,255,0.4)",marginTop:"2px"}}>📍 {pos.lat?.toFixed(1)}°, {pos.lng?.toFixed(1)}°</div>}
<div style={{fontSize:"7px",color:"rgba(255,255,255,0.25)",marginTop:"1px",lineHeight:1.4}}>{cv.det.substring(0,60)}...</div>
<div style={{display:"flex",gap:"3px",marginTop:"4px"}}>{["F/A-18","E-2C","F-35C","EA-18G"].map(a=><span key={a} style={{fontSize:"5.5px",background:`${cc}22`,color:`${cc}aa`,padding:"1px 4px",borderRadius:"2px"}}>{a}</span>)}</div>
</div>
);})}
</div>}
{tab==="counter"&&<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"6px"}}>
{[{l:"MUERTOS IRÁN",v:"1,890+",c:"#ff1a1a",sub:"civiles: 650+"},{l:"SOLDADOS USA",v:"13 ✝",c:"#ff4444",sub:"confirmados"},{l:"MISILES IRÁN",v:"780+",c:"#ff6600",sub:"35 días"},{l:"DRONES IRÁN",v:"3,100+",c:"#ff8800",sub:"shahed + A"},{l:"OBJETIVOS
DESTRUIDOS",v:"7,200+",c:"#ffaa00",sub:"incluye Fordow"},{l:"FORDOW ☢️",v:"ATACADA",c:"#ff0000",sub:"1ª vez historia"},{l:"ORMUZ
TRÁFICO",v:"-95%",c:"#ff8800",sub:"350 barcos bloq."},{l:"COSTO/DÍA",v:"$1.37B",c:"#ffcc00",sub:"no presupuestado"}].map(s=>(
<div key={s.l} style={{background:"rgba(0,0,0,0.6)",border:`1px solid ${s.c}22`,borderRadius:"5px",padding:"8px 7px",textAlign:"center"}}>
<div style={{fontSize:"16px",fontWeight:"900",color:s.c,textShadow:`0 0 8px ${s.c}66`,fontFamily:"'Courier New',monospace"}}>{s.v}</div>
<div style={{fontSize:"6px",color:"rgba(255,255,255,0.25)",letterSpacing:"1px",marginTop:"2px",lineHeight:1.3}}>{s.l}</div>
<div style={{fontSize:"5.5px",color:`${s.c}66`,marginTop:"2px"}}>{s.sub}</div>
</div>
))}
</div>}
{tab==="intel"&&<div style={{display:"flex",flexDirection:"column",gap:"5px",maxHeight:"160px",overflowY:"auto"}}>
{[{t:"RUSIA→IRÁN",col:"#ff4400",i:"🕵️",txt:"Rusia provee coordenadas GPS buques/aviones USA. Confirmado 3 fuentes occidentales. Kremlin niega.",src:"CIA/NSA"},
{t:"IRÁN CIA",col:"#ff6600",i:"📞",txt:"Irán contactó CIA día 8. Liderazgo en disarray. Sin respuesta Washington. Posible apertura discreta.",src:"WSJ"},
{t:"ISRAEL↔USA",col:"#4488ff",i:"🔬",txt:"Operación especial uranio 90% Natanz/Fordow en evaluación. IAEA monitorea daños centrifugadoras.",src:"NYT"},
{t:"TRUMP TRUTH",col:"#ff8800",i:"📱",txt:"Trump: 'no habrá deal sin rendición'. CBS: 'guerra muy completa'. Señales mixtas deliberadas presión interna.",src:"TruthSocial/CBS"},
{t:"CHINA COMPRAS",col:"#ffcc00",i:"🛢️",txt:"China compra petróleo iraní $52/barril (descuento 50%). Yuanes. EE.UU. amenaza sanciones secundarias.",src:"Reuters"},
{t:"PAKISTÁN/AFGAN",col:"#ff5500",i:"⚛️",txt:"Guerra potencias nucleares (informal). IAEA monitorea arsenales. 520+ muertos. Sin uso armas atómicas.",src:"IAEA"},
].map((it,i)=>(
<div key={i} onClick={()=>speakText(`${it.t}: ${it.txt}`)} style={{display:"flex",gap:"8px",padding:"6px 10px",background:"rgba(0,0,0,0.5)",border:`1px solid ${it.col}22`,borderRadius:"4px",cursor:"pointer",transition:"all 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.04)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(0,0,0,0.5)"}>
<span style={{fontSize:"14px",flexShrink:0}}>{it.i}</span>
<div style={{flex:1}}><div style={{fontSize:"8px",fontWeight:"bold",color:it.col,marginBottom:"2px"}}>{it.t} <span style={{fontSize:"6.5px",background:`${it.col}22`,padding:"1px 5px",borderRadius:"2px",color:`${it.col}aa`}}>{it.src}</span></div><div style={{fontSize:"8px",color:"rgba(255,255,255,0.6)",lineHeight:1.5}}>{it.txt}</div></div>
</div>
))}
</div>}
</div>
);
}
// DISEASE PANEL — Vaccine checker + Outbreak tracker + Risk calculator
function DiseasePanel({ quakes }) {
const [tab, setTab] = useState("outbreak");
const [age, setAge] = useState("");
const [vacc, setVaccResult] = useState(null);
const checkVacc = () => {
const a = parseInt(age);
if (isNaN(a)) return;
const res = [];
if (a < 1) res.push({v:"SRP (sarampión)",rec:"No aplicable — menor de 12 meses",c:"#ffcc00"});
else if (a <= 4) res.push({v:"SRP (sarampión)",rec:"⚠️ URGENTE — grupo más afectado. 2 dosis obligatorias.",c:"#ff2200"});
else if (a <= 17) res.push({v:"SRP (sarampión)",rec:"Verifica 2 dosis cartilla. Si faltan: llama 800-00-44800",c:"#ff6600"});
else res.push({v:"SRP (sarampión)",rec:"Adultos: 1 dosis naciste después 1982 sin 2 dosis.",c:"#ffaa00"});
if (a >= 6) res.push({v:"Influenza",rec:"Vacuna anual recomendada — H5N1 alerta máxima.",c:"#ffaa00"});
if (a >= 18) res.push({v:"COVID actualizado",rec:"Dosis XEC recomendada — grupos vulnerables.",c:"#ff8800"});
if (a >= 60 || a < 5) res.push({v:"Neumococo",rec:"Alta prioridad menores 5 y mayores 60.",c:"#ff6600"});
setVaccResult(res);
speakText(`Para persona ${a} años: ${res.map(r=>r.v+". "+r.rec).join(". ")}`);
};
const outbreaks = [
{name:"SARAMPIÓN 🇲🇽",casos:"11,240",trend:"+8%/sem",risk:"ALTO",c:"#ff2200",mx:true},
{name:"MPOX CLADE Ib",casos:"115K+",trend:"+6%/sem",risk:"ALTO",c:"#ff6600",mx:false},
{name:"MPOX CLADE I USA",casos:"9 (local)",trend:"NUEVO",risk:"⚠️CRÍTICO",c:"#ff8800",mx:false},
{name:"H5N1 BOVINOS",casos:"48 estados",trend:"PANDÉMICO",risk:"MÁX.",c:"#ffaa00",mx:false},
{name:"NIPAH INDIA",casos:"7",trend:"CONTENIDO",risk:"MUY ALTO",c:"#cc0000",mx:false},
{name:"DENGUE BRASIL",casos:"5.8M",trend:"+4%/sem",risk:"ALTO",c:"#ff7700",mx:false},
{name:"ÉBOLA LIBERIA",casos:"Contenido",trend:"ESTABLE",risk:"ALTO",c:"#cc0000",mx:false},
{name:"CÓLERA SUDÁN",casos:"240K",trend:"ACTIVO",risk:"SEVERO",c:"#ff8800",mx:false},
];
return (
<div style={{background:"rgba(2,10,5,0.95)",border:"1px solid #ff660033",borderRadius:"8px",padding:"12px",backdropFilter:"blur(10px)"}}>
<div style={{display:"flex",gap:"4px",marginBottom:"10px",borderBottom:"1px solid #ff660020",paddingBottom:"8px"}}>
{[["outbreak","🦠 BROTES"],["vaccine","💉 VACUNAS"],["risk","⚠️ RIESGOS"],["oms","🏥 OMS"]].map(([t,l])=>(
<button key={t} onClick={()=>setTab(t)} style={{padding:"4px 10px",background:tab===t?"#ff660033":"transparent",border:`1px solid ${tab===t?"#ff6600":"#ff660022"}`,borderRadius:"4px",color:tab===t?"#ff6600":"#ff660066",fontFamily:"'Courier New',monospace",fontSize:"7.5px",cursor:"pointer",letterSpacing:"1px"}}>{l}</button>
))}
</div>
{tab==="outbreak"&&<div style={{display:"flex",flexDirection:"column",gap:"3px",maxHeight:"170px",overflowY:"auto"}}>
<div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:"4px",marginBottom:"4px",padding:"0 4px"}}>
{["BROTE","CASOS","TENDENCIA","RIESGO"].map(h=><div key={h} style={{fontSize:"6px",color:"rgba(255,255,255,0.2)",letterSpacing:"1.5px"}}>{h}</div>)}
</div>
{outbreaks.map((o,i)=>(
<div key={i} onClick={()=>speakText(`${o.name}: ${o.casos} casos. Tendencia ${o.trend}. Nivel riesgo: ${o.risk}.`)} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:"4px",padding:"5px 8px",background:`${o.c}0a`,border:`1px solid ${o.c}22`,borderRadius:"4px",cursor:"pointer",transition:"all 0.15s",alignItems:"center"}} onMouseEnter={e=>e.currentTarget.style.background=`${o.c}1e`} onMouseLeave={e=>e.currentTarget.style.background=`${o.c}0a`}>
<div style={{fontSize:"8.5px",color:o.c,fontWeight:"bold"}}>{o.name}{o.mx&&<span style={{marginLeft:"4px",fontSize:"6px",background:"#ff2200",color:"#fff",padding:"1px 3px",borderRadius:"2px"}}>MX</span>}</div>
<div style={{fontSize:"8px",color:"rgba(255,255,255,0.7)"}}>{o.casos}</div>
<div style={{fontSize:"7.5px",color:o.c}}>{o.trend}</div>
<div style={{fontSize:"7px",background:`${o.c}22`,color:o.c,padding:"2px 5px",borderRadius:"3px",textAlign:"center",fontWeight:"bold"}}>{o.risk}</div>
</div>
))}
</div>}
{tab==="vaccine"&&<div>
<div style={{marginBottom:"10px",padding:"8px",background:"rgba(255,34,0,0.06)",border:"1px solid #ff220022",borderRadius:"5px"}}>
<div style={{fontSize:"8px",color:"#ff6600",marginBottom:"6px"}}>💉 Verifica vacunas — introduce edad:</div>
<div style={{display:"flex",gap:"6px",alignItems:"center"}}>
<input type="number" placeholder="Edad (años)" value={age} onChange={e=>setAge(e.target.value)} style={{background:"rgba(0,0,0,0.6)",border:"1px solid #ff660044",borderRadius:"4px",color:"#fff",fontFamily:"'Courier New',monospace",fontSize:"10px",padding:"5px 10px",width:"100px",outline:"none"}}/>
<button onClick={checkVacc} style={{padding:"5px 14px",background:"#ff660022",border:"1px solid #ff6600",borderRadius:"4px",color:"#ff6600",fontFamily:"'Courier New',monospace",fontSize:"9px",cursor:"pointer",fontWeight:"bold"}}>VERIFICAR →</button>
<span style={{fontSize:"7px",color:"rgba(255,255,255,0.2)"}}>📞 800-00-44800 (gratis)</span>
</div>
</div>
{vacc&&<div style={{display:"flex",flexDirection:"column",gap:"4px"}}>
{vacc.map((v,i)=>(
<div key={i} style={{padding:"6px 10px",background:`${v.c}0d`,border:`1px solid ${v.c}33`,borderRadius:"4px"}}>
<div style={{fontSize:"9px",fontWeight:"bold",color:v.c,marginBottom:"2px"}}>💉 {v.v}</div>
<div style={{fontSize:"8px",color:"rgba(255,255,255,0.7)",lineHeight:1.5}}>{v.rec}</div>
</div>
))}
<div style={{fontSize:"7px",color:"rgba(255,255,255,0.2)",marginTop:"4px"}}>⚠️ Orientativo. Consulta médico o SSA.</div>
</div>}
{!vacc&&<div style={{fontSize:"8px",color:"rgba(255,255,255,0.2)",textAlign:"center",padding:"20px"}}>Introduce edad para ver vacunas necesarias</div>}
</div>}
{tab==="risk"&&<div style={{display:"flex",flexDirection:"column",gap:"5px",maxHeight:"170px",overflowY:"auto"}}>
{[{region:"México",risks:["Sarampión activo (11.2K)","Mpox clade I EE.UU. frontera","H5N1 ganado USA 48 estados"],level:"ALTO",c:"#ff2200"},
{region:"EE.UU.",risks:["H5N1 48 estados","Mpox clade I local","Sarampión importado"],level:"MUY ALTO",c:"#ff4400"},
{region:"África Central",risks:["Mpox Ib epidemia","Ébola Liberia contenido","Cólera Sudán activo"],level:"CRÍTICO",c:"#cc0000"},
{region:"Asia Sur",risks:["Nipah India Kerala","H5N1 aves","COVID XEC estable"],level:"ALTO",c:"#ff8800"},
{region:"Brasil/LAT",risks:["Dengue 5.8M casos","DENV-3 dominante","Chikungunya activo"],level:"ALTO",c:"#ff6600"},
].map((r,i)=>(
<div key={i} onClick={()=>speakText(`Región ${r.region}: nivel riesgo ${r.level}. Amenazas: ${r.risks.join(", ")}.`)} style={{padding:"7px 10px",background:`${r.c}0a`,border:`1px solid ${r.c}22`,borderRadius:"5px",cursor:"pointer",transition:"all 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background=`${r.c}20`} onMouseLeave={e=>e.currentTarget.style.background=`${r.c}0a`}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"3px"}}>
<span style={{fontSize:"9px",fontWeight:"bold",color:r.c}}>{r.region}</span>
<span style={{fontSize:"7px",background:`${r.c}22`,color:r.c,padding:"2px 7px",borderRadius:"3px",fontWeight:"bold"}}>{r.level}</span>
</div>
<div style={{display:"flex",gap:"4px",flexWrap:"wrap"}}>{r.risks.map((rk,j)=><span key={j} style={{fontSize:"6.5px",color:"rgba(255,255,255,0.5)",background:"rgba(255,255,255,0.04)",padding:"1px 5px",borderRadius:"2px"}}>• {rk}</span>)}</div>
</div>
))}
</div>}
{tab==="oms"&&<div style={{display:"flex",flexDirection:"column",gap:"4px",maxHeight:"170px",overflowY:"auto"}}>
{[{t:"EMERGENCIA GLOBAL ACTIVA",d:"Mpox clade Ib — OMS ESPII. Declarada ago 2024, aún activa.",c:"#ff6600",icon:"🔴"},
{t:"ALERTA PANDÉMICA MÁXIMA",d:"H5N1 — Primera transmisión humana 2026. OMS máxima preparación.",c:"#ffaa00",icon:"🟠"},
{t:"POLIOVIRUS CIRCULANTE",d:"cVDPV en 15 países. Emergencia OMS desde 2014 prorrogada.",c:"#ff8800",icon:"🟠"},
{t:"VIGILANCIA REDUCIDA",d:"EE.UU. salió OMS. Retiro fondos reduce alerta temprana global 15-20%.",c:"#ffcc00",icon:"🟡"},
{t:"NIPAH MONITOREO",d:"Kerala India. OMS protocolo IHR activo. 140 contactos cuarentena.",c:"#cc0000",icon:"🔴"},
].map((item,i)=>(
<div key={i} onClick={()=>speakText(`${item.t}: ${item.d}`)} style={{padding:"6px 10px",background:`${item.c}0a`,border:`1px solid ${item.c}22`,borderRadius:"4px",cursor:"pointer",transition:"all 0.15s",display:"flex",gap:"8px"}} onMouseEnter={e=>e.currentTarget.style.background=`${item.c}1e`} onMouseLeave={e=>e.currentTarget.style.background=`${item.c}0a`}>
<span style={{fontSize:"14px",flexShrink:0}}>{item.icon}</span>
<div><div style={{fontSize:"8px",fontWeight:"bold",color:item.c,marginBottom:"2px"}}>{item.t}</div><div style={{fontSize:"7.5px",color:"rgba(255,255,255,0.6)",lineHeight:1.5}}>{item.d}</div></div>
</div>
))}
</div>}
</div>
);
}
// CLIMATE PANEL — Earthquake depth chart + Hurricane tracker + Forecast
function ClimatePanel({ quakes, hurricanes, hurPos, eonet }) {
const [tab, setTab] = useState("quakes");
const maxMag = quakes.length ? Math.max(...quakes.map(q=>q.mag)) : 7;
return (
<div style={{background:"rgba(2,8,16,0.95)",border:"1px solid #00aaff33",borderRadius:"8px",padding:"12px",backdropFilter:"blur(10px)"}}>
<div style={{display:"flex",gap:"4px",marginBottom:"10px",borderBottom:"1px solid #00aaff20",paddingBottom:"8px"}}>
{[["quakes","🌋 SISMOS"],["hurr","🌀 HURACANES"],["eonet","🛰️ NASA EONET"],["extremos","🔥 EXTREMOS"]].map(([t,l])=>(
<button key={t} onClick={()=>setTab(t)} style={{padding:"4px 10px",background:tab===t?"#00aaff33":"transparent",border:`1px solid ${tab===t?"#00aaff":"#00aaff22"}`,borderRadius:"4px",color:tab===t?"#00aaff":"#00aaff66",fontFamily:"'Courier New',monospace",fontSize:"7.5px",cursor:"pointer",letterSpacing:"1px"}}>{l}</button>
))}
</div>
{tab==="quakes"&&<div>
{quakes.length===0&&<div style={{textAlign:"center",color:"rgba(255,255,255,0.2)",fontSize:"8px",padding:"20px"}}>✅ Sin sismos M5.5+ en últimas 48h según USGS</div>}
{quakes.length>0&&<div>
<div style={{display:"flex",gap:"4px",marginBottom:"6px",alignItems:"center"}}>
<div style={{fontSize:"8px",color:"#00aaff"}}>{quakes.length} sismos M5.5+ en 48h</div>
<div style={{fontSize:"7px",background:"#ff000022",color:"#ff4400",padding:"2px 7px",borderRadius:"3px",marginLeft:"auto"}}>Max: M{maxMag.toFixed(1)}</div>
</div>
<div style={{display:"flex",flexDirection:"column",gap:"3px",maxHeight:"140px",overflowY:"auto"}}>
{quakes.sort((a,b)=>b.mag-a.mag).map(q=>{const mc=magCol(q.mag);const pct=((q.mag-5.5)/2.5)*100;return(
<div key={q.id} onClick={()=>speakText(`Sismo magnitud ${q.mag.toFixed(1)} en ${q.place}. Profundidad ${q.depth} kilómetros.`)} style={{display:"flex",gap:"8px",alignItems:"center",padding:"4px 8px",background:`${mc}0a`,border:`1px solid ${mc}22`,borderRadius:"4px",cursor:"pointer",transition:"all 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background=`${mc}1e`} onMouseLeave={e=>e.currentTarget.style.background=`${mc}0a`}>
<div style={{minWidth:"32px",fontSize:"11px",fontWeight:"900",color:mc,textShadow:`0 0 6px ${mc}66`}}>M{q.mag.toFixed(1)}</div>
<div style={{flex:1}}>
<div style={{width:`${pct}%`,minWidth:"2px",height:"3px",background:mc,borderRadius:"2px",marginBottom:"2px"}}/>
<div style={{fontSize:"7.5px",color:"rgba(255,255,255,0.6)",lineHeight:1.3}}>{q.place.substring(0,45)}</div>
</div>
<div style={{fontSize:"6px",color:"rgba(255,255,255,0.25)",textAlign:"right",minWidth:"36px"}}>Prof<br/>{q.depth}km</div>
</div>
);})}
</div>
</div>}
</div>}
{tab==="hurr"&&<div>
{hurricanes.length===0&&<div style={{textAlign:"center",color:"rgba(255,255,255,0.2)",fontSize:"8px",padding:"20px"}}>🌊 NOAA: Temporada inicia 1 de junio. Sin ciclones activos en Atlántico.</div>}
{hurricanes.map(h=>{const pos=hurPos[h.id]||{lat:h.lat,lng:h.lng};const hc=hurCol(h.kts);const dist=haversine(pos.lat,pos.lng,23.6,-102.5);return(
<div key={h.id} onClick={()=>speakText(`Huracán ${h.name}, ${hurCat(h.kts)}, vientos ${Math.round(h.kts*1.852)} km/h. Distancia a México: ${Math.round(dist)} km.`)} style={{padding:"10px",background:`${hc}0d`,border:`1px solid ${hc}44`,borderRadius:"6px",cursor:"pointer",marginBottom:"6px"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
<div style={{fontSize:"14px",fontWeight:"900",color:hc}}>🌀 {h.name} — {hurCat(h.kts)}</div>
<div style={{fontSize:"7px",background:`${hc}22`,color:hc,padding:"3px 8px",borderRadius:"3px"}}>{Math.round(dist)}km de México</div>
</div>
<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"5px",marginTop:"8px"}}>
{[["VIENTOS",`${Math.round(h.kts*1.852)} km/h`],["POSICIÓN",`${pos.lat?.toFixed(1)}°, ${pos.lng?.toFixed(1)}°`],["RUMBO",`${h.dir}°`],["VELOCIDAD",`${h.spd} km/h`]].map(([l,v])=>(
<div key={l} style={{background:"rgba(0,0,0,0.4)",padding:"4px 6px",borderRadius:"3px",textAlign:"center"}}>
<div style={{fontSize:"9px",color:hc,fontWeight:"bold"}}>{v}</div>
<div style={{fontSize:"6px",color:"rgba(255,255,255,0.2)"}}>{l}</div>
</div>
))}
</div>
{dist<1800&&<div style={{marginTop:"6px",padding:"4px 8px",background:"rgba(255,0,0,0.15)",border:"1px solid #ff000044",borderRadius:"3px",fontSize:"7.5px",color:"#ff4444",animation:"blink 1.5s steps(1) infinite"}}>⚠️ AMENAZA MÉXICO RANGO ALERTA</div>}
</div>
);})}
</div>}
{tab==="eonet"&&<div>
{eonet.length===0&&<div style={{textAlign:"center",color:"rgba(255,255,255,0.2)",fontSize:"8px",padding:"20px"}}>🛰️ Cargando eventos NASA EONET...</div>}
<div style={{display:"flex",flexDirection:"column",gap:"3px",maxHeight:"160px",overflowY:"auto"}}>
{eonet.map((e,i)=>(
<div key={e.id} onClick={()=>speakText(`Evento NASA EONET: ${e.title}. Categoría: ${e.cat}.`)} style={{display:"flex",gap:"8px",padding:"5px 8px",background:"rgba(255,119,0,0.07)",border:"1px solid rgba(255,119,0,0.2)",borderRadius:"4px",cursor:"pointer",transition:"all 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,119,0,0.15)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(255,119,0,0.07)"}>
<span style={{fontSize:"14px"}}>{e.cat?.includes("ildfir")||e.cat?.includes("ire")?"🔥":e.cat?.includes("torm")?"⛈️":e.cat?.includes("lood")?"🌊":e.cat?.includes("olcano")?"🌋":"🛰️"}</span>
<div><div style={{fontSize:"8px",color:"#ff7700",fontWeight:"bold"}}>{e.title}</div><div style={{fontSize:"7px",color:"rgba(255,255,255,0.3)"}}>{e.cat} · {e.lat?.toFixed(1)}°, {e.lng?.toFixed(1)}°</div></div>
</div>
))}
</div>
</div>}
{tab==="extremos"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"5px",maxHeight:"160px",overflowY:"auto"}}>
{[{n:"INDIA 🔥",t:"49°C",sub:"3,800 muertes",c:"#ff2200"},{n:"CANADÁ 🧊",t:"-18°C",sub:"Manitoba/Sask",c:"#00ccff"},{n:"AUSTRALIA 🔥",t:"2.4M ha",sub:"quemadas NSW/VI",c:"#ff3300"},{n:"EUROPA 🌊",t:"18K",sub:"evacuados retornan",c:"#0055ff"},{n:"TORNADOS USA",t:"18 en 48h",sub:"2 EF3 activos",c:"#aa44ff"},{n:"VIETNAM 🌀",t:"28 muertos",sub:"Mekong inunda",c:"#7733ff"},{n:"BRASIL 🌊",t:"180K",sub:"evacuados RS/SC",c:"#0066ff"},{n:"ESPAÑA 🔥",t:"36°C",sub:"récord abril",c:"#ff5500"}].map((s,i)=>(
<div key={i} onClick={()=>speakText(`${s.n}: ${s.t}. ${s.sub}`)} style={{padding:"8px",background:`${s.c}0d`,border:`1px solid ${s.c}22`,borderRadius:"5px",cursor:"pointer",transition:"all 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background=`${s.c}22`} onMouseLeave={e=>e.currentTarget.style.background=`${s.c}0d`}>
<div style={{fontSize:"10px",fontWeight:"bold",color:s.c}}>{s.n}</div>
<div style={{fontSize:"15px",fontWeight:"900",color:s.c,marginTop:"2px",textShadow:`0 0 6px ${s.c}55`}}>{s.t}</div>
<div style={{fontSize:"6.5px",color:"rgba(255,255,255,0.3)",marginTop:"2px"}}>{s.sub}</div>
</div>
))}
</div>}
</div>
);
}
// NEWS PANEL — Live prices, charts, market sentiment
function NewsPanel({ fx, crypto, quakes }) {
const [tab, setTab] = useState("markets");
const [conv, setConv] = useState({ mxn:"", usd:"" });
const convertMXN = val => {
if (!fx) return;
const n = parseFloat(val);
if (isNaN(n)) return;
setConv({ mxn: val, usd: (n / parseFloat(fx)).toFixed(2) });
};
const convertUSD = val => {
if (!fx) return;
const n = parseFloat(val);
if (isNaN(n)) return;
setConv({ usd: val, mxn: (n * parseFloat(fx)).toFixed(2) });
};
const sentiment = 34; // Fear index 0-100
const sentimentLabel = sentiment < 20 ? "PÁNICO EXTREMO" : sentiment < 40 ? "MIEDO" : sentiment < 60 ? "NEUTRAL" : sentiment < 80 ? "CODICIA" : "CODICIA EXTREMA";
const sentimentColor = sentiment < 20 ? "#ff0000" : sentiment < 40 ? "#ff6600" : sentiment < 60 ? "#ffcc00" : "#44ff88";
return (
<div style={{background:"rgba(5,4,0,0.95)",border:"1px solid #ffcc0033",borderRadius:"8px",padding:"12px",backdropFilter:"blur(10px)"}}>
<div style={{display:"flex",gap:"4px",marginBottom:"10px",borderBottom:"1px solid #ffcc0020",paddingBottom:"8px"}}>
{[["markets","📊 MERCADOS"],["energy","🛢️ ENERGÍA"],["conversor","💱 CONVERSOR"],["invertir","📈 INVERTIR"],["agenda","📅 AGENDA"]].map(([t,l])=>(
<button key={t} onClick={()=>setTab(t)} style={{padding:"4px 10px",background:tab===t?"#ffcc0033":"transparent",border:`1px solid ${tab===t?"#ffcc00":"#ffcc0022"}`,borderRadius:"4px",color:tab===t?"#ffcc00":"#ffcc0066",fontFamily:"'Courier New',monospace",fontSize:"7.5px",cursor:"pointer",letterSpacing:"1px"}}>{l}</button>
))}
</div>
{tab==="markets"&&<div>
<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"5px",marginBottom:"8px"}}>
{[{l:"USD/MXN",v:fx?`$${fx}`:"...",c:"#88cc00",sub:fx?">19 VOLÁTIL":"cargando",live:!!fx},
{l:"BITCOIN",v:crypto?.bitcoin?`$${Math.round(crypto.bitcoin.usd/1000)}K`:"...",c:"#ffdd00",sub:crypto?.bitcoin?`${crypto.bitcoin.usd_24h_change>0?"+":""}${crypto.bitcoin.usd_24h_change?.toFixed(1)}% 24h`:"cargando",live:!!crypto?.bitcoin},
{l:"ETHEREUM",v:crypto?.ethereum?`$${Math.round(crypto.ethereum.usd)}`:"...",c:"#8888ff",sub:crypto?.ethereum?`${crypto.ethereum.usd_24h_change>0?"+":""}${crypto.ethereum.usd_24h_change?.toFixed(1)}% 24h`:"cargando",live:!!crypto?.ethereum},
{l:"BRENT EST.",v:"~$108",c:"#ffaa00",sub:"rango $108-112",live:false},
].map(s=>(
<div key={s.l} onClick={()=>speakText(`${s.l}: ${s.v}. ${s.sub}`)} style={{background:"rgba(0,0,0,0.5)",border:`1px solid ${s.c}22`,borderRadius:"5px",padding:"8px 7px",textAlign:"center",cursor:"pointer",transition:"all 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.04)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(0,0,0,0.5)"}>
<div style={{fontSize:"15px",fontWeight:"900",color:s.c,textShadow:`0 0 8px ${s.c}55`}}>{s.v}</div>
<div style={{fontSize:"6px",color:"rgba(255,255,255,0.25)",letterSpacing:"1px"}}>{s.l}</div>
<div style={{fontSize:"6.5px",color:`${s.c}88`,marginTop:"2px"}}>{s.sub}</div>
{s.live&&<div style={{fontSize:"5px",color:s.c,marginTop:"2px",animation:"blink 2s steps(1) infinite"}}>● LIVE</div>}
</div>
))}
</div>
<div style={{display:"flex",gap:"8px",alignItems:"center",padding:"8px",background:"rgba(0,0,0,0.4)",borderRadius:"5px",border:"1px solid rgba(255,255,255,0.05)"}}>
<div style={{fontSize:"7px",color:"rgba(255,255,255,0.3)"}}>ÍNDICE DE<br/>MIEDO/CODICIA</div>
<div style={{flex:1,height:"8px",background:"rgba(255,255,255,0.05)",borderRadius:"4px",overflow:"hidden"}}>
<div style={{width:`${sentiment}%`,height:"100%",background:`linear-gradient(to right,#ff0000,#ff6600,#ffcc00,#44ff88)`,borderRadius:"4px"}}/>
</div>
<div style={{textAlign:"right"}}>
<div style={{fontSize:"12px",fontWeight:"900",color:sentimentColor}}>{sentiment}</div>
<div style={{fontSize:"6.5px",color:sentimentColor}}>{sentimentLabel}</div>
</div>
</div>
<div style={{display:"flex",flexDirection:"column",gap:"3px",marginTop:"7px"}}>
{[{m:"Wall St.",v:"REBOTE +1.2%",c:"#44ff88",n:"Optimismo cauteloso negociaciones."},{m:"Tokio Nikkei",v:"-4.8% ↓",c:"#ff3344",n:"Recuperación parcial post shock."},{m:"Ibex 35",v:"+4% ↑",c:"#ff6600",n:"Anuncio G7 + reservas estratégicas."},{m:"Shanghái",v:"+0.5% ↑",c:"#ffcc00",n:"Compra petróleo barato. Estable."}].map((m,i)=>(
<div key={i} onClick={()=>speakText(`${m.m}: ${m.v}. ${m.n}`)} style={{display:"flex",gap:"8px",alignItems:"center",padding:"4px 8px",background:`${m.c}0a`,border:`1px solid ${m.c}18`,borderRadius:"3px",cursor:"pointer",transition:"all 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background=`${m.c}1e`} onMouseLeave={e=>e.currentTarget.style.background=`${m.c}0a`}>
<div style={{minWidth:"80px",fontSize:"8px",color:m.c,fontWeight:"bold"}}>{m.m}</div>
<div style={{minWidth:"60px",fontSize:"9px",fontWeight:"900",color:m.c}}>{m.v}</div>
<div style={{fontSize:"7.5px",color:"rgba(255,255,255,0.5)"}}>{m.n}</div>
</div>
))}
</div>
</div>}
{tab==="energy"&&<div style={{display:"flex",flexDirection:"column",gap:"5px",maxHeight:"200px",overflowY:"auto"}}>
{[{n:"BRENT (EUROPA)",v:"~$108/barril",chg:"+48% vs 28 feb",c:"#ffaa00",d:"Oscila $108-112. Qatar 65% LNG. Volatilidad extrema."},
{n:"WTI (USA)",v:"~$103/barril",chg:"+45% vs 28 feb",c:"#ff8800",d:"Sigue Brent. Gas USA $3.95/galón (+22%)."},
{n:"GAS NATURAL",v:"x2.8 spot",chg:"Qatar 65%",c:"#ff6600",d:"Qatar interrumpe 20% LNG. Europa/Asia alternativas."},
{n:"RAS TANURA",v:"🟠 40% CAP",chg:"Saudi Aramco",c:"#ff2200",d:"Mayor refinería mundo limitada. 300K barriles/día."},
{n:"ORMUZ",v:"-95% tráfico",chg:"350 barcos",c:"#ff8800",d:"Tráfico petroleros -95%. 350+ atrapados. Citigroup: -8-12M barriles/día."},
{n:"GASOLINA MX",v:"+24%",chg:"crisis Golfo",c:"#88cc00",d:"Precio México subió ~24% desde inicio guerra. Mezcla Mex +6%."},
{n:"RESERVAS G7",v:"LIBERACIÓN",chg:"200M barriles",c:"#4488ff",d:"Mayor liberación historia. Estabiliza precios temporalmente."},
].map((e,i)=>(
<div key={i} onClick={()=>speakText(`${e.n}: ${e.v}. ${e.d}`)} style={{display:"flex",gap:"10px",alignItems:"center",padding:"7px 10px",background:`${e.c}0a`,border:`1px solid ${e.c}22`,borderRadius:"5px",cursor:"pointer",transition:"all 0.15s"}} onMouseEnter={el=>el.currentTarget.style.background=`${e.c}1e`} onMouseLeave={el=>el.currentTarget.style.background=`${e.c}0a`}>
<div style={{minWidth:"90px"}}><div style={{fontSize:"8px",color:e.c,fontWeight:"bold"}}>{e.n}</div><div style={{fontSize:"6.5px",color:`${e.c}88`,marginTop:"1px"}}>{e.chg}</div></div>
<div style={{minWidth:"70px",fontSize:"13px",fontWeight:"900",color:e.c,textShadow:`0 0 6px ${e.c}55`}}>{e.v}</div>
<div style={{fontSize:"7.5px",color:"rgba(255,255,255,0.5)",lineHeight:1.4}}>{e.d}</div>
</div>
))}
</div>}
{tab==="conversor"&&<div>
<div style={{marginBottom:"8px",padding:"6px 8px",background:"rgba(255,200,0,0.07)",border:"1px solid #ffcc0022",borderRadius:"5px"}}>
<div style={{fontSize:"8px",color:"#ffcc00",marginBottom:"6px"}}>💱 Tipo de cambio {fx?`LIVE: $${fx} MXN/USD`:"(cargando...)"}</div>
<div style={{display:"flex",gap:"10px",alignItems:"center",flexWrap:"wrap"}}>
<div><div style={{fontSize:"6.5px",color:"rgba(255,255,255,0.3)",marginBottom:"3px"}}>PESOS MEXICANOS (MXN)</div><input type="number" placeholder="0.00" value={conv.mxn} onChange={e=>{setConv({...conv,mxn:e.target.value});convertMXN(e.target.value);}} style={{background:"rgba(0,0,0,0.6)",border:"1px solid #ffcc0044",borderRadius:"4px",color:"#fff",fontFamily:"'Courier New',monospace",fontSize:"13px",padding:"6px 10px",width:"130px",outline:"none"}}/></div>
<div style={{fontSize:"16px",color:"#ffcc0055"}}>⇄</div>
<div><div style={{fontSize:"6.5px",color:"rgba(255,255,255,0.3)",marginBottom:"3px"}}>DÓLARES USA (USD)</div><input type="number" placeholder="0.00" value={conv.usd} onChange={e=>{setConv({...conv,usd:e.target.value});convertUSD(e.target.value);}} style={{background:"rgba(0,0,0,0.6)",border:"1px solid #ffcc0044",borderRadius:"4px",color:"#fff",fontFamily:"'Courier New',monospace",fontSize:"13px",padding:"6px 10px",width:"130px",outline:"none"}}/></div>
</div>
{fx&&<div style={{marginTop:"6px",fontSize:"7.5px",color:"#ffcc0077"}}>💡 Peso volátil. Espera antes de cambiar dólares si es posible.</div>}
</div>
<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"5px"}}>
{[["$100 USD",fx?`$${(100*parseFloat(fx)).toFixed(0)} MXN`:"..."],["$500 USD",fx?`$${(500*parseFloat(fx)).toFixed(0)} MXN`:"..."],["$1,000 MXN",fx?`$${(1000/parseFloat(fx)).toFixed(2)} USD`:"..."],["$5,000 MXN",fx?`$${(5000/parseFloat(fx)).toFixed(2)} USD`:"..."],["$10,000 MXN",fx?`$${(10000/parseFloat(fx)).toFixed(2)} USD`:"..."],["$1 BTC",crypto?.bitcoin?`$${Math.round(crypto.bitcoin.usd).toLocaleString()} USD`:"..."]].map(([q,r],i)=>(
<div key={i} style={{padding:"6px 8px",background:"rgba(255,200,0,0.05)",border:"1px solid #ffcc0015",borderRadius:"4px",textAlign:"center"}}>
<div style={{fontSize:"7px",color:"rgba(255,255,255,0.3)"}}>{q}</div>
<div style={{fontSize:"11px",fontWeight:"bold",color:"#ffcc00",marginTop:"2px"}}>{r}</div>
</div>
))}
</div>
</div>}
{tab==="invertir"&&<div style={{display:"flex",flexDirection:"column",gap:"5px",maxHeight:"220px",overflowY:"auto"}}>
<div style={{padding:"6px 10px",background:"rgba(255,200,0,0.08)",border:"1px solid #ffcc0030",borderRadius:"5px",marginBottom:"2px"}}>
<div style={{fontSize:"7.5px",color:"#ffcc00",marginBottom:"2px",fontWeight:"bold"}}>📈 ANÁLISIS INVERSIÓN — CRISIS GOLFO · 03 ABR 2026</div>
<div style={{fontSize:"7px",color:"rgba(255,255,255,0.35)",lineHeight:1.6}}>⚠️ Orientativo, no asesoría certificada. Consulta profesional antes de invertir.</div>
</div>
<div style={{fontSize:"7px",color:"#44ff88",letterSpacing:"2px",fontWeight:"bold",padding:"2px 4px"}}>✅ COMPRAR / MANTENER</div>
{[
{tick:"XOM / CVX",n:"Exxon & Chevron",cat:"🛢️ PETRÓLEO USA",c:"#44ff88",risk:"MEDIO",hor:"CORTO",txt:"Brent $108. Fordow/Ormuz presionan. Ganancias récord por cada $1 crudo. ETF: XLE."},
{tick:"GLD / IAU",n:"Oro (ETF/físico)",cat:"🥇 REFUGIO",c:"#ffdd00",risk:"BAJO",hor:"CORTO/MED",txt:"Oro $3,250/oz. Guerra/devaluación refugio clásico. Onzas Libertad disponibles."},
{tick:"CETES",n:"CETES México",cat:"🇲🇽 RENTA FIJA",c:"#88cc00",risk:"MUY BAJO",hor:"28/91 DÍAS",txt:"Rendimiento ~12.2% anual. Protege inflación/devaluación. Desde $100. Opción segura."},
{tick:"SLV / AG",n:"Plata",cat:"🥈 METAL",c:"#aaaaff",risk:"MEDIO",hor:"MEDIANO",txt:"Volátil pero mayor potencial. Uso industrial estratégico (solares, chips). Sube con oro."},
{tick:"PBR",n:"Petrobras Brasil",cat:"🛢️ LATAM",c:"#44ffaa",risk:"MEDIO-ALTO",hor:"CORTO",txt:"Exporta petróleo/soja. Real +5%. Alternativa latinoamericana Brent alto."},
{tick:"BTC",n:"Bitcoin",cat:"₿ CRIPTO",c:"#ffdd00",risk:"ALTO",hor:"ESPECULATIVO",txt:"Sube en crisis severas. ~$68K. Solo alta tolerancia riesgo. Máx 5-10% portafolio."},
].map((inv,i)=>(
<div key={i} onClick={()=>speakText(`${inv.n}: ${inv.txt} Riesgo: ${inv.risk}. Horizonte: ${inv.hor}.`)} style={{display:"flex",gap:"10px",padding:"7px 10px",background:`${inv.c}08`,border:`1px solid ${inv.c}22`,borderRadius:"5px",cursor:"pointer",transition:"all 0.15s",alignItems:"flex-start"}} onMouseEnter={e=>e.currentTarget.style.background=`${inv.c}1e`} onMouseLeave={e=>e.currentTarget.style.background=`${inv.c}08`}>
<div style={{minWidth:"68px"}}>
<div style={{fontSize:"9px",fontWeight:"900",color:inv.c,fontFamily:"'Courier New',monospace"}}>{inv.tick}</div>
<div style={{fontSize:"6px",color:"rgba(255,255,255,0.35)",marginTop:"1px"}}>{inv.cat}</div>
<div style={{display:"flex",flexDirection:"column",gap:"2px",marginTop:"4px"}}>
<span style={{fontSize:"5.5px",background:`${inv.c}22`,color:inv.c,padding:"1px 4px",borderRadius:"2px",textAlign:"center"}}>⚡ {inv.risk}</span>
<span style={{fontSize:"5.5px",background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.3)",padding:"1px 4px",borderRadius:"2px",textAlign:"center"}}>⏱ {inv.hor}</span>
</div>
</div>
<div style={{flex:1}}>
<div style={{fontSize:"8.5px",color:"#fff",fontWeight:"bold",marginBottom:"3px"}}>{inv.n}</div>
<div style={{fontSize:"7.5px",color:"rgba(255,255,255,0.6)",lineHeight:1.6}}>{inv.txt}</div>
</div>
<div style={{fontSize:"11px",opacity:0.4,flexShrink:0}}>🔊</div>
</div>
))}
<div style={{fontSize:"7px",color:"#ff4444",letterSpacing:"2px",fontWeight:"bold",padding:"4px 4px 2px"}}>❌ EVITAR / PRECAUCIÓN</div>
{[
{tick:"PEMEX",n:"Pemex",cat:"🇲🇽 PETRÓLEO MX",c:"#ff4444",txt:"Alto endeudamiento. Problemas estructurales persisten. No defensiva."},
{tick:"USD→MXN",n:"Cambiar dólares",cat:"💱 DIVISAS",c:"#ff6600",txt:"Peso mínimos/volátil. Espera recuperación tensión geopolítica."},
{tick:"AIRLINES",n:"Aerolíneas globales",cat:"✈️ TRANSPORTE",c:"#ff4400",txt:"Combustible +24%. Pasajeros menos por miedo. Márgenes aplastados."},
{tick:"BONDS EU",n:"Bonos europeos",cat:"🇪🇺 RENTA FIJA",c:"#ff8800",txt:"Aranceles 25% + incertidumbre. Esperar resultado negociaciones."},
].map((inv,i)=>(
<div key={i} onClick={()=>speakText(`${inv.n}: ${inv.txt}`)} style={{display:"flex",gap:"10px",padding:"6px 10px",background:`${inv.c}08`,border:`1px solid ${inv.c}22`,borderRadius:"5px",cursor:"pointer",transition:"all 0.15s",alignItems:"flex-start"}} onMouseEnter={e=>e.currentTarget.style.background=`${inv.c}1e`} onMouseLeave={e=>e.currentTarget.style.background=`${inv.c}08`}>
<div style={{minWidth:"68px"}}><div style={{fontSize:"9px",fontWeight:"900",color:inv.c}}>{inv.tick}</div><div style={{fontSize:"6px",color:"rgba(255,255,255,0.3)",marginTop:"1px"}}>{inv.cat}</div></div>
<div style={{flex:1}}><div style={{fontSize:"8px",color:"#ff8888",fontWeight:"bold",marginBottom:"2px"}}>{inv.n}</div><div style={{fontSize:"7.5px",color:"rgba(255,255,255,0.55)",lineHeight:1.5}}>{inv.txt}</div></div>
</div>
))}
<div onClick={()=>speakText("Estrategia México crisis. Uno: CETES 28d al 12.2%. Dos: no cambies dólares, espera recuperación peso. Tres: posición pequeña oro/ETF energía USA. Cuatro: espera bolsa mexicana hasta bajen aranceles 35%.")} style={{padding:"8px 12px",background:"rgba(136,204,0,0.08)",border:"1px solid #88cc0033",borderRadius:"5px",cursor:"pointer",transition:"all 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(136,204,0,0.18)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(136,204,0,0.08)"}>
<div style={{fontSize:"8px",fontWeight:"bold",color:"#88cc00",marginBottom:"5px"}}>🇲🇽 ESTRATEGIA MEXICANOS — CRISIS ACTUAL</div>
<div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:"4px"}}>
{[["1️⃣ CETES 28d","~12.2% anual. Seguro, líquido. cetesdirecto.com.mx"],["2️⃣ NO cambies USD","Espera recuperación peso. Volatilidad >19."],["3️⃣ ORO pequeño","5-10% portafolio. Refugio clásico."],["4️⃣ Espera bolsa","Aranceles 35% + guerra = incertidumbre máxima."]].map(([t,d],i)=>(
<div key={i} style={{background:"rgba(136,204,0,0.05)",borderRadius:"3px",padding:"5px 7px"}}>
<div style={{fontSize:"8px",color:"#88cc00",fontWeight:"bold"}}>{t}</div>
<div style={{fontSize:"6.5px",color:"rgba(255,255,255,0.5)",marginTop:"1px",lineHeight:1.5}}>{d}</div>
</div>
))}
</div>
<div style={{fontSize:"6px",color:"rgba(136,204,0,0.5)",marginTop:"5px"}}>🔊 Toca para escuchar estrategia · ⚠️ No asesoría certificada</div>
</div>
</div>}
{tab==="agenda"&&<div style={{display:"flex",flexDirection:"column",gap:"4px",maxHeight:"200px",overflowY:"auto"}}>
{[{d:"03 ABR",ev:"Reunión G7 energía telemática — reservas liberadas",c:"#4488ff",icon:"🛢️"},
{d:"05 ABR",ev:"OTAN Bruselas segundo día — debate Artículo 5",c:"#4466ff",icon:"🛡️"},
{d:"08 ABR",ev:"Datos inflación USA — IPC marzo esperado",c:"#ffcc00",icon:"📊"},
{d:"10 ABR",ev:"Reunión Fed: ¿pausa tasas por energía?",c:"#ffaa00",icon:"🏦"},
{d:"15 ABR",ev:"Revisión aranceles 145% China — posible ajuste",c:"#ffcc00",icon:"🇨🇳"},
{d:"MAY 2026",ev:"Elecciones Francia — Le Pen 34% lidera",c:"#4488ff",icon:"🗳️"},
{d:"JUN 2026",ev:"Copa del Mundo 2026 — México, USA, Canadá",c:"#88cc00",icon:"⚽"},
{d:"01 JUN",ev:"Inicio temporada huracanes Atlántico",c:"#00aaff",icon:"🌀"},
].map((ag,i)=>(
<div key={i} onClick={()=>speakText(`${ag.d}: ${ag.ev}`)} style={{display:"flex",gap:"8px",padding:"6px 10px",background:`${ag.c}0a`,border:`1px solid ${ag.c}22`,borderRadius:"4px",cursor:"pointer",transition:"all 0.15s",alignItems:"center"}} onMouseEnter={e=>e.currentTarget.style.background=`${ag.c}1e`} onMouseLeave={e=>e.currentTarget.style.background=`${ag.c}0a`}>
<span style={{fontSize:"14px",flexShrink:0}}>{ag.icon}</span>
<div style={{minWidth:"55px",fontSize:"8px",fontWeight:"bold",color:ag.c}}>{ag.d}</div>
<div style={{fontSize:"8.5px",color:"rgba(255,255,255,0.7)",lineHeight:1.4}}>{ag.ev}</div>
</div>
))}
</div>}
</div>
);
}
// ═══════════════════════════════════════════════════════════════════
// LIVE HOOKS
// ═══════════════════════════════════════════════════════════════════
function useFX(){const[r,setR]=useState(null);useEffect(()=>{const g=async()=>{try{const res=await fetch("https://api.frankfurter.app/latest?from=USD&to=MXN");const d=await res.json();if(d.rates?.MXN)setR(d.rates.MXN.toFixed(2));}catch(e){}};g();const iv=setInterval(g,5*60*1000);return()=>clearInterval(iv);},[]);return r;}
function useCrypto(){const[p,setP]=useState({});useEffect(()=>{const g=async()=>{try{const r=await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true");const d=await r.json();setP(d);}catch(e){}};g();const iv=setInterval(g,3*60*1000);return()=>clearInterval(iv);},[]);return p;}
function useOpenSky(active){const[pl,setPl]=useState([]);useEffect(()=>{if(!active){setPl([]);return;}const g=async()=>{try{const r=await fetch("https://opensky-network.org/api/states/all?lamin=15&lomin=42&lamax=38&lomax=68");const d=await r.json();if(d?.states)setPl(d.states.filter(s=>s[6]&&s[5]&&s[7]>100).slice(0,25).map(s=>({id:s[0],cs:(s[1]||"").trim(),lat:s[6],lng:s[5],alt:s[7],hdg:s[10]||0})));}catch(e){}};g();const iv=setInterval(g,60000);return()=>clearInterval(iv);},[active]);return pl;}
function useEONET(active){const[ev,setEv]=useState([]);useEffect(()=>{if(!active)return;const g=async()=>{try{const r=await fetch("https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=20&days=7");const d=await r.json();if(d?.events)setEv(d.events.filter(e=>e.geometry?.length).map(e=>{const g=e.geometry[e.geometry.length-1];return{id:e.id,title:e.title,cat:e.categories?.[0]?.title||"",lat:g.coordinates[1],lng:g.coordinates[0]};}));}catch(e){}};g();const iv=setInterval(g,15*60*1000);return()=>clearInterval(iv);},[active]);return ev;}
function useGeoLocation(){const[l,setL]=useState({lat:FALLBACK_LAT,lng:FALLBACK_LNG,municipio:"Cargando...",tz:"America/Mexico_City"});useEffect(()=>{if(!navigator.geolocation)return;const ok=async(pos)=>{const{latitude:lat,longitude:lng}=pos.coords;let municipio="Tu ubicación",tz="America/Mexico_City";try{const r=await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`);const d=await r.json();const a=d.address||{};municipio=a.municipality||a.city_district||a.city||a.town||a.village||a.county||"Tu municipio";}catch(e){}try{const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&timezone=auto&forecast_days=1&hourly=temperature_2m`);const d=await r.json();if(d.timezone)tz=d.timezone;}catch(e){}setL({lat,lng,municipio,tz});};navigator.geolocation.getCurrentPosition(ok,()=>{},{timeout:8000});const iv=setInterval(()=>navigator.geolocation.getCurrentPosition(ok,()=>{},{timeout:8000}),5*60*1000);return()=>clearInterval(iv);},[]);return l;}
function useMovingCarriers(){const[cp,setCp]=useState(()=>Object.fromEntries(CARRIERS.map(c=>([c.id,{lat:c.lat,lng:c.lng}]))));useEffect(()=>{const iv=setInterval(()=>{setCp(prev=>{const n={...prev};CARRIERS.forEach(c=>{const p=prev[c.id]||{lat:c.lat,lng:c.lng};const lat=Math.max(10,Math.min(45,p.lat+c.dlat*0.003));const lng=Math.max(20,Math.min(80,p.lng+c.dlng*0.003));n[c.id]={lat,lng};});return n;});},200);return()=>clearInterval(iv);},[]);return cp;}
function useAttacks(active){const[at,setAt]=useState([]);useEffect(()=>{if(!active){setAt([]);return;}const launch=()=>{const rt=ATTACK_ROUTES[Math.floor(Math.random()*ATTACK_ROUTES.length)];const id=Date.now()+Math.random();setAt(p=>[...p,{...rt,id,prog:0}].slice(-14));};const ti=setInterval(()=>{if(Math.random()>0.45)launch();},2500);const ai=setInterval(()=>{setAt(p=>p.map(a=>({...a,prog:Math.min(1,a.prog+0.034)})).filter(a=>a.prog<1));},40);return()=>{clearInterval(ti);clearInterval(ai);};},[active]);return at;}
// ═══════════════════════════════════════════════════════════════════
// WEATHER & CLOCK
// ═══════════════════════════════════════════════════════════════════
function WeatherWidget({ac,loc}){
const[wx,setWx]=useState(null);const[rain,setRain]=useState(null);const[aqi,setAqi]=useState(null);
useEffect(()=>{if(!loc?.lat)return;const load=async()=>{try{const[wr,ar]=await Promise.all([fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lng}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_gusts_10m,relative_humidity_2m&hourly=precipitation_probability&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=${encodeURIComponent(loc.tz)}&forecast_days=2`),fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${loc.lat}&longitude=${loc.lng}&current=european_aqi,pm2_5&timezone=${encodeURIComponent(loc.tz)}`)]);const d=await wr.json();setWx(d);const hr=d.hourly;if(hr){const nowH=new Date().getHours();for(let i=nowH;i<Math.min(hr.time.length,nowH+18);i++){if((hr.precipitation_probability[i]||0)>=40){setRain({hour:new Date(hr.time[i]).getHours(),prob:hr.precipitation_probability[i]});break;}}}try{const aq=await ar.json();if(aq?.current)setAqi(aq.current);}catch(e){}}catch(e){}};load();const iv=setInterval(load,10*60*1000);return()=>clearInterval(iv);},[loc?.lat,loc?.lng]);
const handleClick=()=>{if(!wx?.current)return;const c=wx.current,temp=Math.round(c.temperature_2m),feels=Math.round(c.apparent_temperature),wind=Math.round(c.wind_speed_10m),tmax=wx.daily?Math.round(wx.daily.temperature_2m_max[0]):"?",tmin=wx.daily?Math.round(wx.daily.temperature_2m_min[0]):"?",rainPct=wx.daily?wx.daily.precipitation_probability_max[0]:0;const conds=[];const code=c.weather_code;if(code>=95)conds.push("hay tormenta eléctrica activa");else if(code>=80)conds.push("hay chubascos activos");else if(code>=61)conds.push("está lloviendo");else if(code>=51)conds.push("hay llovizna ligera");else if(code>=45)conds.push("hay niebla");if(wind>50)conds.push(`vientos muy fuertes de ${wind} km/h`);if(temp<=0)conds.push("temperatura bajo cero");if(temp>=35)conds.push(`calor extremo de ${temp} grados`);if(!conds.length)conds.push(`${wmoText(code).toLowerCase()}`);let aqTxt="";if(aqi?.european_aqi!=null){const v=aqi.european_aqi;aqTxt=` Calidad del aire: ${v<=20?"buena":v<=40?"aceptable":v<=60?"moderada":"mala"}.`;}speakText(`Estado en ${loc?.municipio||"tu ubicación"}: ${conds.join(", ")}. Temperatura ${temp} grados, sensación ${feels}. Máxima ${tmax}, mínima ${tmin}. Probabilidad de lluvia: ${rainPct}%.${rain?" Lluvias esperadas a las "+rain.hour+" horas.":""}${aqTxt}`,1.05);};
if(!wx?.current)return<div style={{padding:"6px 10px",border:`1px solid ${ac}22`,borderRadius:"6px",background:"rgba(0,0,0,0.6)",backdropFilter:"blur(4px)",fontSize:"7px",color:"#333"}}>📡...</div>;
const c=wx.current,temp=Math.round(c.temperature_2m),feels=Math.round(c.apparent_temperature),icon=wmoIcon(c.weather_code),tc=temp<=0?"#00ccff":temp<=15?"#44aaff":temp<=25?"#44ffaa":temp<=33?"#ffaa00":"#ff4400",fill=Math.max(5,Math.min(100,((temp+5)/40)*100));
return(<div onClick={handleClick} title="Toca para escuchar clima detallado" style={{display:"flex",alignItems:"center",gap:"8px",padding:"6px 12px",border:`1px solid ${ac}33`,borderRadius:"8px",background:"rgba(0,0,0,0.7)",backdropFilter:"blur(8px)",cursor:"pointer",boxShadow:`0 0 15px ${ac}15`,transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.boxShadow=`0 0 25px ${ac}40`;e.currentTarget.style.border=`1px solid ${ac}77`;}} onMouseLeave={e=>{e.currentTarget.style.boxShadow=`0 0 15px ${ac}15`;e.currentTarget.style.border=`1px solid ${ac}33`;}}>
<svg width="12" height="40" viewBox="0 0 12 40"><rect x="4" y="2" width="4" height="24" rx="2" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5"/><rect x="4.5" y={2+24*(1-fill/100)} width="3" height={24*fill/100} rx="1.5" fill={tc} style={{filter:`drop-shadow(0 0 3px ${tc})`}}/><circle cx="6" cy="32" r="5" fill={tc} style={{filter:`drop-shadow(0 0 4px ${tc})`}}/></svg>
<div><div style={{display:"flex",alignItems:"baseline",gap:"3px"}}><span style={{fontSize:"18px",lineHeight:1}}>{icon}</span><span style={{fontSize:"18px",fontWeight:"900",color:tc,lineHeight:1,textShadow:`0 0 8px ${tc}`}}>{temp}°</span><span style={{fontSize:"6px",color:"rgba(255,255,255,0.25)"}}>/{feels}°</span></div>{rain&&<div style={{fontSize:"6px",color:"#4488ff",animation:"blink 2s steps(1) infinite"}}>🌧 ~{rain.hour}h ({rain.prob}%)</div>}{!rain&&<div style={{fontSize:"6px",color:"rgba(255,255,255,0.15)"}}>🔊 toca</div>}</div>
</div>);}
function Clock({ac,loc}){
const[t,setT]=useState(new Date());useEffect(()=>{const iv=setInterval(()=>setT(new Date()),1000);return()=>clearInterval(iv);},[]);
const hh=String(t.getHours()).padStart(2,"0"),mm=String(t.getMinutes()).padStart(2,"0"),ss=String(t.getSeconds()).padStart(2,"0"),blink=t.getSeconds()%2===0;
const days=["domingo","lunes","martes","miércoles","jueves","viernes","sábado"],months=["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
return(<div onClick={()=>speakText(`Hora en ${loc?.municipio||"tu ubicación"}: ${t.getHours()} horas ${t.getMinutes()} minutos. Hoy ${days[t.getDay()]} ${t.getDate()} de ${months[t.getMonth()]} 2026.`,1.05)} title="Toca para escuchar hora" style={{display:"flex",alignItems:"center",gap:"6px",padding:"6px 14px",border:`1px solid ${ac}33`,borderRadius:"8px",background:"rgba(0,0,0,0.7)",backdropFilter:"blur(8px)",cursor:"pointer",boxShadow:`0 0 15px ${ac}15`,transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.boxShadow=`0 0 25px ${ac}40`;e.currentTarget.style.border=`1px solid ${ac}77`;}} onMouseLeave={e=>{e.currentTarget.style.boxShadow=`0 0 15px ${ac}15`;e.currentTarget.style.border=`1px solid ${ac}33`;}}>
<div style={{fontFamily:"'Courier New',monospace",display:"flex",alignItems:"baseline",gap:"1px"}}><span style={{fontSize:"26px",fontWeight:"900",color:ac,textShadow:`0 0 20px ${ac},0 0 40px ${ac}44`,lineHeight:1}}>{hh}</span><span style={{fontSize:"22px",fontWeight:"900",color:ac,opacity:blink?1:0.1,transition:"opacity 0.1s",lineHeight:1}}>:</span><span style={{fontSize:"26px",fontWeight:"900",color:ac,textShadow:`0 0 20px ${ac},0 0 40px ${ac}44`,lineHeight:1}}>{mm}</span><span style={{fontSize:"13px",color:ac,opacity:blink?0.8:0.1,transition:"opacity 0.1s",marginLeft:"1px",lineHeight:1}}>:</span><span style={{fontSize:"13px",color:`${ac}55`,lineHeight:1}}>{ss}</span></div>
<div style={{fontSize:"6px",color:`${ac}33`,letterSpacing:"1px"}}>🔊</div>
</div>);}
// ═══════════════════════════════════════════════════════════════════
// EMERGENCY ALERTS
// ═══════════════════════════════════════════════════════════════════
const ALERT_LEVELS={ROJO:{label:"🔴 MÁXIMA ALERTA",color:"#ff0000",bg:"rgba(40,0,0,0.97)"},NARANJA:{label:"🟠 ALERTA CRÍTICA",color:"#ff6600",bg:"rgba(35,10,0,0.97)"},AMARILLO:{label:"🟡 ALERTA URGENTE",color:"#ffcc00",bg:"rgba(30,25,0,0.97)"}};
const TSUNAMI_ZONES=[{lat:17.5,lng:-101},{lat:15.9,lng:-97},{lat:19.1,lng:-104},{lat:38,lng:143},{lat:-30,lng:-71},{lat:5,lng:95}];
function isTsunami(lat,lng,mag){return mag>=7.5&&TSUNAMI_ZONES.some(z=>haversine(lat,lng,z.lat,z.lng)<400);}
function useEmergencyAlerts(quakes,hurricanes){
const[alerts,setAlerts]=useState([]);const shown=useRef(new Set());const acRef=useRef(null);
const getCtx=useCallback(()=>{if(!acRef.current)acRef.current=new(window.AudioContext||window.webkitAudioContext)();if(acRef.current.state==="suspended")acRef.current.resume();return acRef.current;},[]);
const siren=useCallback((level)=>{try{const c=getCtx(),t=c.currentTime,fs=level==="ROJO"?[880,1047,880,1320,880]:[660,880,660];fs.forEach((f,i)=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="square";o.frequency.value=f;const d=i*0.22;g.gain.setValueAtTime(0,t+d);g.gain.linearRampToValueAtTime(0.18,t+d+0.05);g.gain.exponentialRampToValueAtTime(0.001,t+d+0.2);o.start(t+d);o.stop(t+d+0.21);});}catch(e){}},[getCtx]);
const push=useCallback((a)=>{if(shown.current.has(a.id))return;shown.current.add(a.id);siren(a.level);setTimeout(()=>speakText(a.voice,1.1),400);setAlerts(p=>[{...a,ts:Date.now()},...p].slice(0,3));},[siren]);
const dismiss=useCallback(id=>setAlerts(p=>p.filter(a=>a.id!==id)),[]);
useEffect(()=>{const iv=setInterval(()=>setAlerts(p=>p.filter(a=>(Date.now()-a.ts)<5*60*1000)),10000);return()=>clearInterval(iv);},[]);
useEffect(()=>{const check=async()=>{try{const r=await fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_day.geojson");const d=await r.json();const now=Date.now();d.features.forEach(f=>{const mag=f.properties.mag,place=f.properties.place||"zona",lat=f.geometry.coordinates[1],lng=f.geometry.coordinates[0],age=(now-f.properties.time)/60000;if(age>120||mag<7)return;const id=`q_${f.id}`;const ts=isTsunami(lat,lng,mag);const lv=mag>=8?"ROJO":mag>=7.5?"NARANJA":"AMARILLO";push({id,level:lv,icon:ts?"🌊🌋":"🌋",title:`SISMO M${mag.toFixed(1)} — ${place.toUpperCase().substring(0,40)}`,detail:`M${mag.toFixed(1)} hace ${Math.round(age)} min. Prof: ${Math.round(f.geometry.coordinates[2])}km.${ts?" ⚠️ ALERTA TSUNAMI.":""}`,voice:ts?`Alerta máxima. Sismo magnitud ${mag.toFixed(1)} en ${place}. Alerta tsunami activa. Aléjate costas inmediatamente.`:`Alerta sísmica. Magnitud ${mag.toFixed(1)} en ${place}.`});});}catch(e){}};check();const iv=setInterval(check,60000);return()=>clearInterval(iv);},[push]);
useEffect(()=>{hurricanes.forEach(h=>{if(h.kts<96)return;const dist=haversine(h.lat,h.lng,23.6,-102.5);if(dist>1800)return;const id=`h_${h.id}_${hurCat(h.kts)}`;const lv=h.kts>=137?"ROJO":h.kts>=113?"NARANJA":"AMARILLO";push({id,level:lv,icon:"🌀",title:`HURACÁN ${h.name} ${hurCat(h.kts)} AMENAZA MÉXICO`,detail:`${hurCat(h.kts)}, ${Math.round(h.kts*1.852)} km/h. A ${Math.round(dist)} km de México.`,voice:`Alerta. Huracán ${h.name} ${hurCat(h.kts).replace("CAT","")} amenaza México. Prepara mochila emergencia.`});});},[hurricanes,push]);
useEffect(()=>{const check=async(m)=>{const prompts={war:`¿Uso arma nuclear/química/biológica, o nuevo país grande entrando guerra Irán EE.UU. últimos 30 min? Solo JSON: {"alert":false} o {"alert":true,"level":"ROJO","title":"8 palabras","detail":"20 palabras","voice":"25 palabras"}`,news:`¿Circuit breaker NYSE, devaluación MXN >8%, petróleo +15% 1h, o quiebra banco sistémico últimos 30 min? Solo JSON: {"alert":false} o {"alert":true,"level":"NARANJA","title":"8 palabras","detail":"20 palabras","voice":"25 palabras"}`,disease:`¿Nueva pandemia OMS, ébola ciudad 1M+, o nueva variante resistente vacunas últimas 12h? Solo JSON: {"alert":false} o {"alert":true,"level":"ROJO","title":"8 palabras","detail":"20 palabras","voice":"25 palabras"}`};try{const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:160,tools:[{type:"web_search_20250305",name:"web_search"}],messages:[{role:"user",content:prompts[m]}]})});const data=await r.json();const raw=data.content?.filter(b=>b.type==="text").map(b=>b.text).join("").trim();if(!raw)return;const p=JSON.parse(raw.replace(/```json|```/g,"").trim());if(!p.alert)return;push({id:`ai_${m}_${Date.now().toString(36)}`,level:p.level||"NARANJA",icon:m==="war"?"💥":m==="disease"?"☣️":"📉",title:p.title||"ALERTA",detail:p.detail||"",voice:p.voice||p.title||"Alerta crítica."});}catch(e){}};const modes=["war","news","disease"];let i=0;check(modes[0]);const iv=setInterval(()=>{i=(i+1)%modes.length;check(modes[i]);},8*60*1000);return()=>clearInterval(iv);},[push]);
return{alerts,dismiss};
}
function EmergencyBanner({alerts,dismiss}){
const[tick,setTick]=useState(0);useEffect(()=>{const iv=setInterval(()=>setTick(t=>t+1),1000);return()=>clearInterval(iv);},[]);
if(!alerts.length)return null;
return(<div style={{position:"fixed",top:0,left:0,right:0,zIndex:9999,display:"flex",flexDirection:"column",pointerEvents:"none"}}>
{alerts.map(a=>{const lv=ALERT_LEVELS[a.level]||ALERT_LEVELS.NARANJA;const rem=Math.max(0,300-Math.floor((Date.now()-a.ts)/1000));const pulse=tick%2===0;return(<div key={a.id} style={{background:lv.bg,borderBottom:`2px solid ${lv.color}`,padding:"10px 16px",display:"flex",alignItems:"center",gap:"12px",pointerEvents:"all",boxShadow:`0 0 40px ${lv.color}88`,backdropFilter:"blur(8px)",animation:"slideDown 0.3s ease"}}>
<span style={{fontSize:"26px",opacity:pulse?1:0.4,transition:"opacity 0.5s",flexShrink:0}}>{a.icon}</span>
<div style={{flex:1}}><div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"}}><span style={{fontSize:"7px",background:lv.color,color:"#000",padding:"2px 8px",borderRadius:"2px",fontWeight:"900",letterSpacing:"2px"}}>{lv.label}</span><span style={{fontSize:"12px",fontWeight:"900",color:lv.color,fontFamily:"'Courier New',monospace",letterSpacing:"1px",textShadow:`0 0 10px ${lv.color}`}}>{a.title}</span></div><div style={{fontSize:"9px",color:"#ddd",marginTop:"3px",lineHeight:1.5}}>{a.detail}</div></div>
<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"4px",flexShrink:0}}>
<button onClick={()=>dismiss(a.id)} style={{background:"none",border:`1px solid ${lv.color}55`,borderRadius:"3px",color:lv.color,cursor:"pointer",fontSize:"14px",padding:"2px 8px",fontFamily:"'Courier New',monospace"}}>✕</button>
<div style={{fontSize:"8px",color:`${lv.color}99`,fontFamily:"'Courier New',monospace"}}>{Math.floor(rem/60)}:{String(rem%60).padStart(2,"0")}</div>
<button onClick={()=>speakText(a.voice,1.1)} style={{background:"none",border:`1px solid ${lv.color}22`,borderRadius:"2px",color:`${lv.color}77`,cursor:"pointer",fontSize:"7px",padding:"1px 5px"}}>🔊</button>
</div>
</div>);})}
</div>);}
// ═══════════════════════════════════════════════════════════════════
// AUDIO ENGINE
// ═══════════════════════════════════════════════════════════════════
function useAudio(){
const ref=useRef(null);
const getCtx=useCallback(()=>{if(!ref.current)ref.current=new(window.AudioContext||window.webkitAudioContext)();if(ref.current.state==="suspended")ref.current.resume();return ref.current;},[]);
const SCALES={war:[220,246,261,293,311,349,415,440],disease:[196,220,246,261,293,329,349,392],climate:[261,293,329,349,392,440,493,523],news:[293,329,369,392,440,493,523,587]};
const playHover=useCallback((gid,mode)=>{try{const c=getCtx(),sc=SCALES[mode]||SCALES.war,f=sc[Math.abs(parseInt(gid,36)||0)%sc.length],t=c.currentTime;const o=c.createOscillator(),g=c.createGain(),flt=c.createBiquadFilter();flt.type="lowpass";flt.frequency.value=2000;o.connect(flt);flt.connect(g);g.connect(c.destination);o.type=mode==="war"?"sawtooth":"sine";o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(0.02,t+0.03);g.gain.exponentialRampToValueAtTime(0.001,t+0.22);o.start(t);o.stop(t+0.23);}catch(e){}},[getCtx]);
const playUI=useCallback((type,mode="war")=>{try{const c=getCtx(),t=c.currentTime;if(type==="select"){[1,1.5].forEach((m,i)=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="sine";o.frequency.setValueAtTime(660*m,t);o.frequency.exponentialRampToValueAtTime(880*m,t+0.08);g.gain.setValueAtTime(0.1/(i+1),t);g.gain.exponentialRampToValueAtTime(0.001,t+0.3);o.start(t);o.stop(t+0.31);});}else if(type==="switch"){const fs={war:[415,311,261],disease:[220,261,311],climate:[261,329,392],news:[293,369,440]};(fs[mode]||fs.war).forEach((f,i)=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="sine";o.frequency.value=f;const dl=i*0.09;g.gain.setValueAtTime(0,t+dl);g.gain.linearRampToValueAtTime(0.12,t+dl+0.03);g.gain.exponentialRampToValueAtTime(0.001,t+dl+0.13);o.start(t+dl);o.stop(t+dl+0.14);});}else if(type==="close"){const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="sine";o.frequency.setValueAtTime(440,t);o.frequency.exponentialRampToValueAtTime(220,t+0.1);g.gain.setValueAtTime(0.1,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.12);o.start(t);o.stop(t+0.12);}else if(type==="pop"){const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="sine";o.frequency.setValueAtTime(900,t);o.frequency.exponentialRampToValueAtTime(200,t+0.08);g.gain.setValueAtTime(0.14,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.09);o.start(t);o.stop(t+0.1);}}catch(e){};},[getCtx]);
return{playHover,playUI};
}
// ═══════════════════════════════════════════════════════════════════
// MEXICO PRIORITY ALERT
// ═══════════════════════════════════════════════════════════════════
function getMexicoAlert(mode,hurricanes,fx){
const mxHur=hurricanes.filter(h=>h.lat>10&&h.lat<30&&h.lng>-120&&h.lng<-75);
if(mode==="war")return{icon:"🇲🇽",title:"IMPACTO MÉXICO — DÍA 35",color:"#ff6600",lines:["⛽ Gasolina +24% — Ormuz -95%.","💱 Peso ~$19.4/USD — volátil.",fx?`💵 LIVE: $${fx} MXN/USD`:"💵 Dólar máximos crisis energética.","📦 Aranceles Trump 35% — manufactura pausa."],accion:"Llena tanque. No cambies dólares ahora. Verifica vacunas sarampión."};
if(mode==="disease")return{icon:"🇲🇽",title:"ALERTA SANITARIA — ABR 2026",color:"#ff2200",lines:["🔴 Sarampión ACTIVO — 11,240 casos, 9 estados.","🌍 OPS alerta Mundial 2026.","⚠️ Mpox clade I EE.UU. (frontera).","👶 Niños 1-4 años: más afectados (69%)."],accion:"Llama 800-00-44800 para vacunarte gratis hoy."};
if(mode==="climate")return{icon:"🇲🇽",title:mxHur.length?"🌀 HURACÁN AMENAZA MÉXICO":"CLIMA MÉXICO — ABR 2026",color:"#00aaff",lines:mxHur.length?[`🌀 ${mxHur[0].name} a menos de 1,800km.`,"📦 Prepara mochila: agua, comida 3 días.","🏠 Refuerza ventanas. Conoce evacuación.","📲 Activa alertas CENAPRED."]:"🌧️ Frente activo en sur. Lluvias CDMX/Guerrero/Oaxaca. Temp 22-28°C. Vientos 25-35 km/h. Golfo 1.5°C sobre normal. Temporada ciclones inicia 1 junio.".split(". ").map(l=>l.trim()).filter(Boolean),accion:mxHur.length?"Si costa Golfo: prepara evacuación preventiva.":"Abrígate. Ropa térmica zonas altas. Cuidado carreteras."};
if(mode==="news")return{icon:"🇲🇽",title:"ECONOMÍA MÉXICO — 03 ABR 2026",color:"#ffcc00",lines:["🛢️ Gasolina +24% petróleo máximos.",fx?`💱 USD/MXN LIVE: $${fx}`:"💱 Peso MXN ~$19.4/USD — inflación importada.",`📦 Aranceles 35% Trump — exportaciones riesgo.`,"📉 FMI: recesión Q3 confirmada."],accion:"Invierte CETES proteger ahorros. Evita cambiar dólares ahora."};
return null;
}
// ═══════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════
export default function App(){
const[mode,setMode]=useState("war");
const[geo,setGeo]=useState(null);const[proj,setProj]=useState(null);
const[sel,setSel]=useState(null);const[ping,setPing]=useState(null);
const[quakes,setQuakes]=useState([]);const[hurricanes,setHurricanes]=useState([]);
const[noaaChecked,setNoaaChecked]=useState(false);const[hurPos,setHurPos]=useState({});
const[wlive,setWlive]=useState({});const[aiHeadline,setAiHeadline]=useState("");const[aiLoading,setAiLoading]=useState(false);
const[radarAngle,setRadarAngle]=useState(0);const[showInfo,setShowInfo]=useState(false);
const[ripples,setRipples]=useState({});
const loc=useGeoLocation();const fx=useFX();const crypto=useCrypto();
const cpos=useMovingCarriers();const attacks=useAttacks(mode==="war");
const planes=useOpenSky(mode==="war");const eonet=useEONET(mode==="climate");
const{alerts,dismiss}=useEmergencyAlerts(quakes,hurricanes);
const lastHov=useRef(0);const lastHovId=useRef(null);
const{playHover,playUI}=useAudio();
const ac=ACC[mode],bg=BG[mode],isoM=ISO_COL[mode]||{},mcd=ALL_COUNTRY_DATA[mode]||{};
// Radar
useEffect(()=>{const iv=setInterval(()=>setRadarAngle(a=>(a+1.5)%360),30);return()=>clearInterval(iv);},[]);
// World map
useEffect(()=>{let done=false;(async()=>{try{const[topo,world]=await Promise.all([import("https://cdn.skypack.dev/topojson-client@3"),fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then(r=>r.json())]);if(done)return;const p=d3.geoNaturalEarth1().scale(150).translate([W/2,H/2+15]);const path=d3.geoPath(p);const features=topo.feature(world,world.objects.countries).features;setProj(()=>p);setGeo({paths:features.map(f=>({id:String(f.id),d:path(f)||""})),borders:path(topo.mesh(world,world.objects.countries,(a,b)=>a!==b)),sphere:path({type:"Sphere"})});}catch(e){}})();return()=>{done=true;};},[]);
// USGS
const fetchQ=useCallback(async()=>{try{const r=await fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/5.0_day.geojson");const d=await r.json();const now=Date.now();setQuakes(d.features.filter(f=>f.properties.mag>=5.5&&(now-f.properties.time)<48*3600*1000).map(f=>({id:f.id,mag:f.properties.mag,place:f.properties.place||"Océano",lat:f.geometry.coordinates[1],lng:f.geometry.coordinates[0],depth:Math.round(f.geometry.coordinates[2]),time:f.properties.time})));}catch(e){}},[]);
useEffect(()=>{fetchQ();const iv=setInterval(fetchQ,5*60*1000);return()=>clearInterval(iv);},[fetchQ]);
// NOAA
const fetchH=useCallback(async()=>{try{const r=await fetch("https://www.nhc.noaa.gov/CurrentStorms.json");const d=await r.json();setNoaaChecked(true);if(d.activeStorms?.length){const a=d.activeStorms.map(s=>({id:s.id,name:s.name||"Storm",kts:parseInt(s.intensity)||65,lat:parseFloat(s.latitudeNumeric)||20,lng:parseFloat(s.longitudeNumeric)||-85,dir:parseInt(s.movementDir)||315,spd:parseInt(s.movementSpeed)||12}));setHurricanes(a);setHurPos(Object.fromEntries(a.map(h=>[h.id,{lat:h.lat,lng:h.lng}])));}else setHurricanes([]);}catch(e){setNoaaChecked(true);setHurricanes([]);}},[]);
useEffect(()=>{fetchH();const iv=setInterval(fetchH,30*60*1000);return()=>clearInterval(iv);},[fetchH]);
useEffect(()=>{if(!hurricanes.length)return;const iv=setInterval(()=>{setHurPos(prev=>{const n={...prev};hurricanes.forEach(h=>{const p=prev[h.id]||{lat:h.lat,lng:h.lng};const rad=h.dir*Math.PI/180;n[h.id]={lat:p.lat+Math.cos(rad)*(h.spd/111)*(30/3600),lng:p.lng+Math.sin(rad)*(h.spd/111)*(30/3600)};});return n;});},30000);return()=>clearInterval(iv);},[hurricanes]);
// Live weather spots
useEffect(()=>{const spots=[{k:"india",lat:26.8,lng:80.9},{k:"aus",lat:-33.8,lng:149},{k:"mexico",lat:19.4,lng:-99.1},{k:"iran",lat:32.4,lng:53.7},{k:"usa",lat:37,lng:-95}];const go=async()=>{const obj={};await Promise.all(spots.map(async({k,lat,lng})=>{try{const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,wind_speed_10m&forecast_days=1&timezone=auto`);const d=await r.json();if(d.current)obj[k]=d.current;}catch(e){}}));setWlive(obj);};go();const iv=setInterval(go,10*60*1000);return()=>clearInterval(iv);},[]);
// AI headline
const fetchAI=useCallback(async()=>{setAiLoading(true);try{const qs={war:"Una noticia urgente sobre guerra Irán EE.UU. hoy en máximo 20 palabras.",news:"Una noticia económica global importante hoy en máximo 20 palabras.",disease:"Un brote enfermedad crítico actualmente en máximo 20 palabras.",climate:"Un evento climático severo activo ahora en máximo 20 palabras."};const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:90,tools:[{type:"web_search_20250305",name:"web_search"}],messages:[{role:"user",content:qs[mode]||qs.war}]})});const data=await r.json();const txt=data.content?.filter(b=>b.type==="text").map(b=>b.text).join("").trim();if(txt)setAiHeadline(txt.slice(0,200));}catch(e){}setAiLoading(false);},[mode]);
useEffect(()=>{fetchAI();const iv=setInterval(fetchAI,15*60*1000);return()=>clearInterval(iv);},[mode]);
useEffect(()=>{window.speechSynthesis.getVoices();return()=>stopSpeech();},[]);
const xy=useCallback((lat,lng)=>{if(!proj)return null;return proj([lng,lat]);},[proj]);
const doHover=useCallback((gid)=>{const now=Date.now();if(now-lastHov.current<80||gid===lastHovId.current)return;lastHov.current=now;lastHovId.current=gid;playHover(gid,mode);},[mode,playHover]);
const doPoint=useCallback((pt)=>{playUI("select",mode);setPing(pt.id);setTimeout(()=>setPing(null),700);setSel(p=>p?.id===pt.id?null:pt);if(sel?.id!==pt.id)setTimeout(()=>speakText(pt.det||""),200);else stopSpeech();},[mode,playUI,sel]);
const doCountry=useCallback((id)=>{const data=mcd[id];if(!data)return;playUI("pop",mode);const pt={id:`cc_${mode}_${id}`,name:data.name,c:data.c,s:3,st:"activo",det:data.det,fecha:data.fecha};setSel(p=>p?.id===pt.id?null:pt);if(sel?.id!==pt.id)setTimeout(()=>speakText(data.det),200);else stopSpeech();},[mode,playUI,mcd,sel]);
const cycleMode=()=>{playUI("switch",mode);stopSpeech();const nm=MODES[(MODES.indexOf(mode)+1)%MODES.length];setMode(nm);setSel(null);lastHovId.current=null;setTimeout(()=>speakText(MODE_VOICE[nm],1.0),350);};
// Build points
const clmPts=[...BASE_CLIMATE,...quakes.map(q=>({id:`q_${q.id}`,name:`M${q.mag.toFixed(1)}
${q.place.split(",")[0].substring(0,12).toUpperCase()}`,lat:q.lat,lng:q.lng,c:magCol(q.mag),s:Math.min(5,Math.round(q.mag-3)),st:"extremo",icon:"🌋",pulse:q.mag>=6,fecha:new Date(q.time).toLocaleDateString("es-MX",{day:"2-digit",month:"short"}).toUpperCase(),det:`Sismo M${q.mag.toFixed(1)} en ${q.place}. Prof: ${q.depth}km. ${q.mag>=7?"⚠️ ALERTA TSUNAMI POSIBLE.":q.mag>=6?"Monitoreo tsunami activo.":"Sin riesgo tsunami."} USGS ${new Date(q.time).toLocaleString("es-MX")}.`})),...hurricanes.map(h=>{const pos=hurPos[h.id]||{lat:h.lat,lng:h.lng};return{id:`hur_${h.id}`,name:`🌀${h.name}
${hurCat(h.kts)}`,lat:pos.lat,lng:pos.lng,c:hurCol(h.kts),s:5,st:"extremo",icon:"🌀",pulse:true,fecha:"NOAA LIVE",det:`Huracán ${h.name} — ${hurCat(h.kts)}. ${Math.round(h.kts*1.852)} km/h. Pos: ${pos.lat?.toFixed(2)}°, ${pos.lng?.toFixed(2)}°. NOAA NHC tiempo real.`};}),
...eonet.map(e=>({id:`eon_${e.id}`,name:`NASA
${e.cat.substring(0,10).toUpperCase()}`,lat:e.lat,lng:e.lng,c:"#ff7700",s:3,st:"activo",icon:e.cat?.includes("ire")?"🔥":e.cat?.includes("torm")?"⛈️":e.cat?.includes("lood")?"🌊":"🛰️",pulse:false,fecha:"NASA EONET",det:`${e.title}. Evento activo detectado NASA EONET. Tipo: ${e.cat}.`}))];
const DATA_MAP={war:BASE_WAR,disease:BASE_DISEASE,climate:clmPts,news:BASE_NEWS};
const STATS={
war:[{l:"MUERTOS IRÁN",v:"1,890+",c:"#ff1a1a"},{l:"SOLDADOS USA",v:"13 ✝",c:"#ff4444"},{l:"OBJETIVOS",v:"7,200+",c:"#ff6600"},{l:"BRENT",v:"~$108 ↑",c:"#ffaa00"},{l:"ORMUZ",v:"-95%",c:"#ff8800"},{l:"DÍA GUERRA",v:"35",c:"#ffcc00"},{l:"PORTAAVIONES",v:"5 🚢",c:"#4488ff"},{l:"USD/MXN",v:fx?`$${fx}`:"...",c:"#88cc00"}],
disease:[{l:"SARAMPIÓN MX",v:"11,240",c:"#ff2200"},{l:"ESTADOS MX",v:"9 ALERTA",c:"#ff4400"},{l:"MPOX",v:"115K+",c:"#ff6600"},{l:"H5N1",v:"⚠️PANDEMIA",c:"#ffaa00"},{l:"NIPAH",v:"7 CASOS",c:"#cc0000"},{l:"DENGUE",v:"5.8M casos",c:"#ff8800"},{l:"ÉBOLA",v:"58% MORT",c:"#cc0000"},{l:"NIVEL OMS",v:"EMERGENCIA",c:"#ff2020"}],
climate:[{l:"HURACANES",v:"NOAA JUN",c:"#8844ff"},{l:"SISMOS M5.5+",v:`${quakes.length} USGS`,c:"#ffaa00"},{l:"NASA EONET",v:`${eonet.length} ACTIVOS`,c:"#ff7700"},{l:"INDIA MAX",v:wlive.india?`${wlive.india.temperature_2m}°C`:"49°C",c:"#ff2200"},{l:"TORNADOS",v:"USA EF3",c:"#aa44ff"},{l:"AVIONES",v:planes.length>0?`${planes.length} LIVE`:"OPENSKY",c:"#00cc88"},{l:"CLIMA MX",v:"FRENTE SUR",c:"#00aaff"},{l:"CO₂",v:"429 ppm",c:"#ffaa00"}],
news:[{l:"BRENT",v:"~$108 ↑",c:"#ffaa00"},{l:"BTC",v:crypto?.bitcoin?`$${Math.round(crypto.bitcoin.usd/1000)}K`:"...",c:"#ffdd00"},{l:"USD/MXN",v:fx?`$${fx}`:"...",c:"#88cc00"},{l:"NASDAQ",v:"+1.2%",c:"#44ff88"},{l:"EMPLEOS",v:"-88K MAR",c:"#ff3344"},{l:"QATAR LNG",v:"🟠65%",c:"#ff4444"},{l:"ORMUZ",v:"-95%",c:"#ff6600"},{l:"OTAN",v:"ABRIL🛡️",c:"#4466ff"}],
};
// Connection lines
const connLines=[];
if(mode==="war")BASE_WAR.forEach(p=>(p.conn||[]).forEach(tid=>{const tgt=BASE_WAR.find(x=>x.id===tid);if(tgt){const a=xy(p.lat,p.lng),b=xy(tgt.lat,tgt.lng);if(a&&b)connLines.push({x1:a[0],y1:a[1],x2:b[0],y2:b[1],col:p.c,key:`${p.id}-${tid}`});}}));
const pts=DATA_MAP[mode]||[];const sts=STATS[mode]||[];
const mxAlert=getMexicoAlert(mode,hurricanes,fx);
return(
<div style={{background:bg,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",padding:"10px 8px 16px",fontFamily:"'Courier New',monospace",color:"#fff",transition:"background 0.6s",userSelect:"none",position:"relative",overflow:"hidden"}}>
{/* BACKGROUND GRID */}
<div style={{position:"fixed",inset:0,backgroundImage:`linear-gradient(${GRID[mode]} 1px,transparent 1px),linear-gradient(90deg,${GRID[mode]} 1px,transparent 1px)`,backgroundSize:"40px 40px",pointerEvents:"none",zIndex:0}}/>
{/* EMERGENCY */}
<EmergencyBanner alerts={alerts} dismiss={dismiss}/>
{/* TOP BAR */}
<div style={{width:"100%",maxWidth:"980px",marginBottom:"8px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"8px",position:"relative",zIndex:1}}>
<div style={{flex:1,minWidth:"200px"}}>
<div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"2px"}}>
<div style={{width:"6px",height:"6px",borderRadius:"50%",background:ac,boxShadow:`0 0 8px ${ac}`,animation:"pulse 1s ease infinite"}}/>
<span style={{fontSize:"7px",letterSpacing:"3px",color:ac}}>{aiLoading?"AI BUSCANDO...":"TIEMPO REAL"} · USGS · NOAA · OPENSKY · NASA · AI</span>
</div>
<h1 style={{fontSize:"clamp(10px,1.8vw,16px)",fontWeight:"900",letterSpacing:"2px",color:"#fff",margin:"0 0 3px",textShadow:`0 0 30px ${ac}88,0 0 60px ${ac}33`}}>{TITLES[mode]}</h1>
{aiHeadline&&<div style={{fontSize:"8px",color:ac,maxWidth:"520px",lineHeight:1.5,background:`${ac}10`,padding:"3px 8px",borderRadius:"3px",border:`1px solid ${ac}20`}}>🤖 {aiHeadline}</div>}
<div style={{fontSize:"6px",color:"rgba(255,255,255,0.1)",marginTop:"3px",cursor:"pointer"}} onClick={()=>setShowInfo(p=>!p)}>⟳ USGS 5min · NOAA 30min · TEMP 10min · AI 15min · FX 5min · BTC 3min {showInfo?"▲":"▼"}</div>
{showInfo&&<div style={{fontSize:"6.5px",color:"rgba(255,255,255,0.2)",marginTop:"2px",lineHeight:1.7,background:"rgba(0,0,0,0.5)",padding:"4px 8px",borderRadius:"3px",border:"1px solid rgba(255,255,255,0.05)"}}>APIs GRATIS: USGS Earthquakes · NOAA NHC · Open-Meteo · Air Quality API · OpenSky Network · NASA EONET · CoinGecko · Frankfurter · Nominatim · Anthropic Claude AI</div>}
</div>
<div style={{display:"flex",gap:"8px",alignItems:"flex-start",flexWrap:"wrap"}}><Clock ac={ac} loc={loc}/><WeatherWidget ac={ac} loc={loc}/></div>
<div style={{display:"flex",flexDirection:"column",gap:"5px",alignItems:"flex-end"}}>
<button onClick={cycleMode} style={{padding:"8px 14px",background:`${ac}15`,border:`1px solid ${ac}`,borderRadius:"6px",color:ac,fontFamily:"'Courier New',monospace",fontSize:"10px",letterSpacing:"2px",cursor:"pointer",fontWeight:"bold",backdropFilter:"blur(4px)",boxShadow:`0 0 15px ${ac}25`,transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.background=`${ac}30`;e.currentTarget.style.boxShadow=`0 0 30px ${ac}66`;}} onMouseLeave={e=>{e.currentTarget.style.background=`${ac}15`;e.currentTarget.style.boxShadow=`0 0 15px ${ac}25`;}}>{NEXT[mode]} →</button>
<button onClick={()=>{fetchQ();fetchH();fetchAI();}} style={{padding:"4px 10px",background:"transparent",border:`1px solid ${ac}20`,borderRadius:"4px",color:`${ac}55`,fontFamily:"'Courier New',monospace",fontSize:"7px",cursor:"pointer",letterSpacing:"1px",transition:"all 0.2s"}} onMouseEnter={e=>e.currentTarget.style.color=ac} onMouseLeave={e=>e.currentTarget.style.color=`${ac}55`}>⟳ ACTUALIZAR TODO</button>
<div style={{display:"flex",gap:"5px"}}>{MODES.map(m=><div key={m} onClick={()=>{stopSpeech();setMode(m);setSel(null);setTimeout(()=>speakText(MODE_VOICE[m]),300);}} style={{width:"7px",height:"7px",borderRadius:"50%",background:m===mode?ACC[m]:"rgba(255,255,255,0.07)",boxShadow:m===mode?`0 0 10px ${ACC[m]},0 0 20px ${ACC[m]}55`:"none",transition:"all 0.3s",cursor:"pointer"}}/>)}</div>
</div>
</div>
{/* TICKER */}
<div style={{width:"100%",maxWidth:"980px",marginBottom:"6px",overflow:"hidden",background:"rgba(0,0,0,0.6)",border:`1px solid ${ac}15`,borderRadius:"4px",padding:"4px 0",backdropFilter:"blur(4px)",position:"relative",zIndex:1}}>
<div style={{fontSize:"7.5px",color:ac,letterSpacing:"1px",whiteSpace:"nowrap",animation:"ticker 55s linear infinite",display:"inline-block",paddingLeft:"100%"}}>
{fx&&`💱 USD/MXN LIVE: $${fx}  •  `}{crypto?.bitcoin&&`₿ BTC: $${Math.round(crypto.bitcoin.usd/1000)}K (${crypto.bitcoin.usd_24h_change>0?"+":""}${crypto.bitcoin.usd_24h_change?.toFixed(1)}%)  •  `}🔴 IRÁN MISILES BALÍSTICOS CONTRA GOLFO/ISRAEL — DÍA 35  •  💥 BRENT OSCILA $108-112 — CRISIS ENERGÉTICA  •  🛡️ OTAN BRUSELAS ABRIL — ARTÍCULO 4 Y 5 MESA  •  🗣️ TRUMP-XI EVALÚAN DIÁLOGO — MEDIACIÓN ACTIVA  •  🦠 SARAMPIÓN MX: 11,240 CASOS — 9 ESTADOS  •  💼 EMPLEOS USA -88K MAR — NASDAQ +1.2%  •  ⚔️ 13 SOLDADOS USA MUERTOS — 1,890+ IRANÍES  •  🔴 QATAR 65% LNG — ORMUZ -95%  •  {quakes.length>0?`🌋 ${quakes.length} SISMOS M5.5+ ACTIVOS  •  `:""}✈️ {planes.length>0?`${planes.length} AVIONES MEDIO ORIENTE  •  `:"OPENSKY ACTIVO  •  "}{fx&&`💱 USD/MXN LIVE: $${fx}  •  `}
</div>
</div>
{/* TOP ALERT BANNERS */}
{mode==="war"&&<div style={{width:"100%",maxWidth:"980px",marginBottom:"6px",display:"flex",gap:"4px",flexWrap:"wrap",position:"relative",zIndex:1}}>
{[{txt:"🔴 FORDOW DAÑADA — IAEA CONFIRMA INTERRUPCIÓN ENRIQUECIMIENTO 60%",c:"#ff2020",det:"DÍA 35 — IAEA reporta daños centrifugadoras. Irán acusa EE.UU. complicidad. Brent +$5 minutos. Mojtaba: respuesta sin precedentes pendiente."},
{txt:"🗣️ TRUMP-XI EVALÚAN DIÁLOGO — MEDIACIÓN ACTIVA GOLFO",c:"#ffaa00",det:"Trump y Xi hablan. China propone cese fuego 72h. Condición: EE.UU. retira Ford. Negociaciones en curso. Segunda llamada posible."},
{txt:"🛡️ OTAN BRUSELAS ABRIL — 32 PAÍSES — ARTÍCULO 4 Y 5 MESA",c:"#4466ff",det:"Cumbre OTAN abril. Artículo 4 activo Turquía/Chipre. Se discute Artículo 5. 12/32 cumplen 2% PIB defensa. Trump exige 5%."},
].map((a,i)=><div key={i} onClick={()=>doPoint({id:`top_${i}`,name:a.txt.split(":")[0],c:a.c,s:5,st:"critico",fecha:"03 ABR 2026",det:a.det})} style={{flex:1,padding:"5px 10px",background:`${a.c}10`,border:`1px solid ${a.c}`,borderRadius:"4px",fontSize:"7.5px",color:a.c,cursor:"pointer",minWidth:"150px",backdropFilter:"blur(4px)",transition:"all 0.2s",animation:i===0?"warningPulse 2s ease infinite":"none"}} onMouseEnter={e=>e.currentTarget.style.background=`${a.c}25`} onMouseLeave={e=>e.currentTarget.style.background=`${a.c}10`}>{a.txt}</div>)}
</div>}
{mode==="disease"&&<div onClick={()=>doPoint(BASE_DISEASE[0])} style={{width:"100%",maxWidth:"980px",marginBottom:"6px",padding:"6px 14px",background:"rgba(255,34,0,0.08)",border:"1px solid #ff4400",borderRadius:"4px",fontSize:"8px",color:"#ff4400",cursor:"pointer",animation:"warningPulse 2.5s ease infinite",backdropFilter:"blur(4px)",position:"relative",zIndex:1}}>🔴 SARAMPIÓN MÉXICO: 11,240 CASOS — 9 ESTADOS ALERTA — OPS ALERTA MUNDIAL 2026 — ⚠️ MPOX CLADE I EE.UU. SIN VIAJE — LLAMA 800-00-44800</div>}
{/* MAP */}
<div style={{width:"100%",maxWidth:"980px",position:"relative",border:`1px solid ${ac}18`,borderRadius:"10px",overflow:"hidden",boxShadow:`0 0 60px ${ac}15,inset 0 0 30px rgba(0,0,0,0.5)`,background:"#010610",zIndex:1}}>
{[{top:"0",left:"0"},{top:"0",right:"0"},{bottom:"0",left:"0"},{bottom:"0",right:"0"}].map((pos,i)=><div key={i} style={{position:"absolute",...pos,width:"20px",height:"20px",borderTop:pos.top!==undefined?`2px solid ${ac}55`:"none",borderBottom:pos.bottom!==undefined?`2px solid ${ac}55`:"none",borderLeft:pos.left!==undefined?`2px solid ${ac}55`:"none",borderRight:pos.right!==undefined?`2px solid ${ac}55`:"none",zIndex:10,pointerEvents:"none"}}/>)}
{!geo&&<div style={{height:"440px",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"12px"}}><div style={{fontSize:"24px",animation:"spin 1.5s linear infinite"}}>🌍</div><div style={{fontSize:"8px",color:ac,letterSpacing:"4px",animation:"blink 1s steps(1) infinite"}}>CARGANDO MAPA GLOBAL...</div></div>}
{geo&&<svg viewBox={`0 0 ${W} ${H}`} style={{display:"block",width:"100%"}}>
<defs>
<filter id="glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="glow2"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<rect width={W} height={H} fill="#010610"/>
{geo.sphere&&<path d={geo.sphere} fill="#010c1a" stroke={ac} strokeWidth="0.4" strokeOpacity="0.12"/>}
{/* COUNTRIES — dibujados ANTES del radar para que el radar quede encima */}
{geo.paths.map(({id,d})=>{const col=isoM[id],hasCE=!!mcd[id];return<path key={id} d={d} fill={col?`${col}1e`:"#0a0e1a"} stroke={col?col:"#0c1428"} strokeWidth={col?0.6:0.15} strokeOpacity={col?0.5:1} onMouseEnter={()=>doHover(id)} style={{cursor:hasCE?"pointer":"default",transition:"fill 0.2s"}} onMouseOver={e=>{if(col)e.target.setAttribute("fill",col+(hasCE?"55":"2a"));}} onMouseOut={e=>e.target.setAttribute("fill",col?`${col}1e`:"#0a0e1a")} onClick={()=>hasCE&&doCountry(id)}/>;
})}
{geo.borders&&<path d={geo.borders} fill="none" stroke="#0c1428" strokeWidth="0.2"/>}
{/* RADAR SWEEP — después de países para quedar ENCIMA de todo el continente */}
{mode==="war"&&(()=>{const center=xy(26.6,50);if(!center)return null;const[cx,cy]=center,r=115,rad1=radarAngle*Math.PI/180,rad2=(radarAngle-35)*Math.PI/180;return(<g style={{pointerEvents:"none"}}><circle cx={cx} cy={cy} r={r} fill={`${ac}06`}/>{[0.25,0.5,0.75,1].map(f=><circle key={f} cx={cx} cy={cy} r={r*f} fill="none" stroke={ac} strokeWidth="0.4" opacity="0.15"/>)}<path d={`M${cx},${cy} L${cx+Math.cos(rad1)*r},${cy+Math.sin(rad1)*r} A${r},${r} 0 0,0 ${cx+Math.cos(rad2)*r},${cy+Math.sin(rad2)*r} Z`} fill={ac} opacity="0.12"/><line x1={cx} y1={cy} x2={cx+Math.cos(rad1)*r} y2={cy+Math.sin(rad1)*r} stroke={ac} strokeWidth="1.4" opacity="0.6" style={{filter:`drop-shadow(0 0 3px ${ac})`}}/></g>);})()}
{/* CONN LINES */}
{connLines.map(l=><g key={l.key}><line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={l.col} strokeWidth="0.7" strokeOpacity="0.3" strokeDasharray="5,5"><animate attributeName="stroke-dashoffset" from="0" to="-20" dur="0.8s" repeatCount="indefinite"/></line></g>)}
{/* ATTACKS */}
{attacks.map(atk=>{const fr=xy(atk.from.lat,atk.from.lng),to=xy(atk.to.lat,atk.to.lng);if(!fr||!to)return null;const cx=fr[0]+(to[0]-fr[0])*atk.prog,cy=fr[1]+(to[1]-fr[1])*atk.prog;const trail=[];for(let i=0;i<7;i++){const tp=Math.max(0,atk.prog-i*0.04);trail.push([fr[0]+(to[0]-fr[0])*tp,fr[1]+(to[1]-fr[1])*tp]);}
return<g key={atk.id} filter="url(#glow)">{trail.map((tp,i)=><circle key={i} cx={tp[0]} cy={tp[1]} r={Math.max(0.3,2.5-i*0.35)} fill={atk.col} opacity={Math.max(0,(7-i)/7*0.8)}/>)}<circle cx={cx} cy={cy} r={2.5} fill={atk.col} opacity="0.95"/>{atk.prog>0.95&&<><circle cx={cx} cy={cy} r={0} fill={atk.col} opacity="0.8"><animate attributeName="r" from="0" to="20" dur="0.5s" fill="freeze"/><animate attributeName="opacity" from="0.8" to="0" dur="0.5s" fill="freeze"/></circle></>}</g>;
})}
{/* REAL PLANES */}
{mode==="war"&&planes.map(p=>{const pos=xy(p.lat,p.lng);if(!pos)return null;const[px,py]=pos;return<g key={p.id}><g transform={`translate(${px},${py}) rotate(${p.hdg||0})`}><polygon points="0,-4 -2,2 0,1 2,2" fill="#00ff88" opacity="0.85" style={{filter:"drop-shadow(0 0 2px #00ff88)"}}/></g><text x={px} y={py-6} textAnchor="middle" fill="#00ff8866" fontSize="3.5" fontFamily="'Courier New',monospace">{p.cs?.substring(0,5)}</text></g>;})}
{/* CARRIERS */}
{mode==="war"&&CARRIERS.map(cv=>{const pos=cpos[cv.id];if(!pos)return null;const p=xy(pos.lat,pos.lng);if(!p)return null;const[cx,cy]=p,cc=cv.pais==="FRANCE"?"#4466ff":"#4488ff";return<g key={cv.id} onClick={()=>doPoint({id:cv.id,name:`${cv.flag} ${cv.name}`,lat:pos.lat,lng:pos.lng,c:cc,s:5,st:"activo",fecha:"POSICIÓN LIVE",det:cv.det})} style={{cursor:"pointer"}} filter="url(#glow)">
<ellipse cx={cx} cy={cy} rx={16} ry={3.5} fill="none" stroke={cc} strokeWidth="0.4" strokeOpacity="0.2" transform={`rotate(-22,${cx},${cy})`}><animate attributeName="rx" values="16;22;16" dur="3.5s" repeatCount="indefinite"/></ellipse>
<rect x={cx-11} y={cy-2} width={22} height={4.5} fill={cc} rx="2.2" opacity="0.9" style={{filter:`drop-shadow(0 0 5px ${cc})`}}/>
<rect x={cx-7} y={cy-5} width={11} height={3} fill={cc} rx="1" opacity="0.85"/>
<text x={cx} y={cy-11} textAnchor="middle" fill={cc} fontSize="5.5" fontFamily="'Courier New',monospace" fontWeight="bold" style={{filter:`drop-shadow(0 0 4px ${cc})`}}>{cv.flag} {cv.name}</text>
<text x={cx} y={cy-19} textAnchor="middle" fill={`${cc}77`} fontSize="4">📍LIVE</text>
</g>;})}
{/* HURRICANES */}
{mode==="climate"&&hurricanes.map(h=>{const pos=hurPos[h.id]||{lat:h.lat,lng:h.lng};const ph=xy(pos.lat,pos.lng);if(!ph)return null;const[hx,hy]=ph,hc=hurCol(h.kts);return<g key={`h-${h.id}`} onClick={()=>doPoint({id:`hur_${h.id}`,name:`🌀${h.name}`,lat:pos.lat,lng:pos.lng,c:hc,s:5,st:"extremo",icon:"🌀",fecha:"NOAA LIVE",det:`Huracán ${h.name} — ${hurCat(h.kts)}. ${Math.round(h.kts*1.852)} km/h. Pos: ${pos.lat?.toFixed(2)}°, ${pos.lng?.toFixed(2)}°. NOAA NHC live.`})} style={{cursor:"pointer"}}>
{[0,1,2].map(i=><circle key={i} cx={hx} cy={hy} r={7} fill="none" stroke={hc} strokeWidth="0.8" opacity="0"><animate attributeName="r" from="7" to={7+i*16} dur={`${1.8+i*0.5}s`} begin={`${i*0.45}s`} repeatCount="indefinite"/><animate attributeName="opacity" from="0.7" to="0" dur={`${1.8+i*0.5}s`} begin={`${i*0.45}s`} repeatCount="indefinite"/></circle>)}
<circle cx={hx} cy={hy} r="5.5" fill={hc} opacity="0.8" style={{filter:`drop-shadow(0 0 6px ${hc})`}}/>
<g><animateTransform attributeName="transform" type="rotate" from={`0 ${hx} ${hy}`} to={`360 ${hx} ${hy}`} dur="3s" repeatCount="indefinite"/>{[0,90,180,270].map(a=>{const r=a*Math.PI/180;return<line key={a} x1={hx+Math.cos(r)*3} y1={hy+Math.sin(r)*3} x2={hx+Math.cos(r)*8} y2={hy+Math.sin(r)*8} stroke={hc} strokeWidth="1.5" strokeLinecap="round" opacity="0.9"/>;})}</g>
<text x={hx} y={hy-13} textAnchor="middle" fill={hc} fontSize="6.5" fontWeight="bold">{h.name}</text>
</g>;})}
{mode==="climate"&&noaaChecked&&!hurricanes.length&&<text x={W/2} y={H-10} textAnchor="middle" fill="#1a2030" fontSize="8" fontFamily="'Courier New',monospace">🌀 NOAA: TEMPORADA INICIA 1 JUNIO. SIN CICLONES ACTIVOS.</text>}
{/* DATA POINTS */}
{pts.filter(pt=>pt.lat&&pt.lng).map(pt=>{
const p=xy(pt.lat,pt.lng);if(!p)return null;
const[px,py]=p,isSel=sel?.id===pt.id,isPing=ping===pt.id,r=isSel?10:7,ptc=pt.c||"#ff4400";
return<g key={pt.id} onClick={()=>doPoint(pt)} style={{cursor:"pointer"}}>
{pt.pulse&&[0,1,2].map(i=><circle key={i} cx={px} cy={py} r={r} fill="none" stroke={ptc} strokeWidth="0.7" opacity="0"><animate attributeName="r" from={r} to={r+32} dur={`${2+i*0.6}s`} begin={`${i*0.6}s`} repeatCount="indefinite"/><animate attributeName="opacity" from="0.6" to="0" dur={`${2+i*0.6}s`} begin={`${i*0.6}s`} repeatCount="indefinite"/></circle>)}
{isPing&&<circle cx={px} cy={py} r={r} fill="none" stroke="#ffffff" strokeWidth="2.5" opacity="0"><animate attributeName="r" from={r} to={r+28} dur="0.6s"/><animate attributeName="opacity" from="0.9" to="0" dur="0.6s"/></circle>}
{isSel&&<circle cx={px} cy={py} r={r+6} fill="none" stroke={ptc} strokeWidth="1.2" strokeDasharray="3,3" opacity="0.9"><animateTransform attributeName="transform" type="rotate" from={`0 ${px} ${py}`} to={`360 ${px} ${py}`} dur="4s" repeatCount="indefinite"/></circle>}
<circle cx={px} cy={py} r={r} fill={ptc} style={{filter:`drop-shadow(0 0 ${isSel?18:7}px ${ptc})`}}/>
<circle cx={px} cy={py} r={r*0.38} fill="rgba(255,255,255,0.6)"/>
{pt.icon&&<text x={px} y={py+2.5} textAnchor="middle" fontSize="5.5" style={{pointerEvents:"none"}}>{pt.icon}</text>}
{(pt.name||"").split("
").map((ln,li)=><text key={li} x={px} y={py-r-3-((pt.name||"").split("
").length-1-li)*9} textAnchor="middle" fill={ptc} fontSize={isSel?8.5:7} fontFamily="'Courier New',monospace" fontWeight="bold" style={{pointerEvents:"none",filter:`drop-shadow(0 0 4px ${ptc})`}}>{ln}</text>)}
</g>;
})}
{/* SCANLINES */}
<rect width={W} height={H} fill="none" opacity="0.03" style={{backgroundImage:"repeating-linear-gradient(0deg,rgba(0,0,0,0.5),rgba(0,0,0,0.5) 1px,transparent 1px,transparent 4px)",pointerEvents:"none"}}/>
</svg>}
<div style={{position:"absolute",bottom:"4px",left:"50%",transform:"translateX(-50%)",fontSize:"6px",color:"rgba(255,255,255,0.08)",letterSpacing:"2px",pointerEvents:"none",whiteSpace:"nowrap"}}>HOVER→MÚSICA · PUNTOS→VOZ+DETALLE · PAÍSES→TOCA · CARRIERS→POSICIÓN LIVE</div>
</div>
{/* DETAIL PANEL */}
{sel&&<div style={{marginTop:"8px",padding:"14px 16px",background:`${bg}ee`,border:`1px solid ${sel.c||"#ff4400"}`,borderRadius:"8px",width:"100%",maxWidth:"980px",boxShadow:`0 0 40px ${sel.c||"#ff4400"}22,inset 0 0 20px rgba(0,0,0,0.3)`,backdropFilter:"blur(10px)",animation:"slideIn 0.2s ease",position:"relative",zIndex:1}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
<div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"}}>
<span style={{fontSize:"14px",fontWeight:"900",letterSpacing:"2px",color:sel.c||"#ff4400",textShadow:`0 0 15px ${sel.c||"#ff4400"}`}}>{sel.icon||""} {(sel.name||"").replace(/
/g," ")}</span>
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
{sts.map((st,i)=>{const rp=ripples[i]||[];return<button key={st.l} onClick={e=>{playUI("pop",mode);const r2=e.currentTarget.getBoundingClientRect();const rp2={id:Date.now(),x:e.clientX-r2.left,y:e.clientY-r2.top,c:st.c};setRipples(p=>({...p,[i]:[...(p[i]||[]),rp2]}));setTimeout(()=>setRipples(p=>({...p,[i]:(p[i]||[]).filter(x=>x.id!==rp2.id)})),900);speakText(`${st.l}: ${st.v}`);}} style={{position:"relative",overflow:"hidden",background:`${st.c}0c`,border:`1px solid ${st.c}22`,borderRadius:"6px",padding:"8px 10px",textAlign:"center",minWidth:"90px",cursor:"pointer",fontFamily:"'Courier New',monospace",transition:"all 0.15s",backdropFilter:"blur(4px)"}} onMouseEnter={e=>{e.currentTarget.style.border=`1px solid ${st.c}`;e.currentTarget.style.background=`${st.c}22`;e.currentTarget.style.boxShadow=`0 0 20px ${st.c}44`;e.currentTarget.style.transform="translateY(-4px)";}} onMouseLeave={e=>{e.currentTarget.style.border=`1px solid ${st.c}22`;e.currentTarget.style.background=`${st.c}0c`;e.currentTarget.style.boxShadow="none";e.currentTarget.style.transform="translateY(0)";}}>
{rp.map(r=><div key={r.id} style={{position:"absolute",left:r.x-50,top:r.y-50,width:"100px",height:"100px",borderRadius:"50%",background:`radial-gradient(circle,${r.c}55 0%,transparent 70%)`,animation:"rippleOut 0.9s ease-out forwards",pointerEvents:"none"}}/>)}
<div style={{fontSize:"13px",fontWeight:"900",color:st.c,textShadow:`0 0 8px ${st.c}66`,position:"relative"}}>{st.v}</div>
<div style={{fontSize:"6px",color:"rgba(255,255,255,0.2)",letterSpacing:"1.5px",marginTop:"2px",position:"relative"}}>{st.l}</div>
</button>;})}
</div>
{/* INTERACTIVE PANELS — uno por modo */}
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
{wlive.aus&&<span style={{fontSize:"8px",color:"#ff3300"}}>🔥 AUSTRALIA {wlive.aus.temperature_2m}°C</span>}
{wlive.iran&&<span style={{fontSize:"8px",color:"#ff2020"}}>⚔️ IRÁN {wlive.iran.temperature_2m}°C</span>}
{wlive.usa&&<span style={{fontSize:"8px",color:"#ff6600"}}>🇺🇸 USA {wlive.usa.temperature_2m}°C</span>}
{wlive.mexico&&<span style={{fontSize:"8px",color:"#8844ff"}}>🇲🇽 MÉXICO {wlive.mexico.temperature_2m}°C · {wlive.mexico.wind_speed_10m}km/h</span>}
{planes.length>0&&<span style={{fontSize:"8px",color:"#00cc88"}}>✈️ {planes.length} aviones reales en Medio Oriente</span>}
{eonet.length>0&&<span style={{fontSize:"8px",color:"#ff7700"}}>🛰️ {eonet.length} eventos NASA EONET activos</span>}
</div>}
{/* MEXICO ALERT */}
{mxAlert&&<div style={{marginTop:"8px",width:"100%",maxWidth:"980px",padding:"10px 14px",background:"rgba(0,0,0,0.8)",border:`1px solid ${mxAlert.color}`,borderRadius:"8px",boxShadow:`0 0 25px ${mxAlert.color}18`,backdropFilter:"blur(8px)",position:"relative",zIndex:1}}>
<div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"7px"}}><span style={{fontSize:"16px"}}>{mxAlert.icon}</span><span style={{fontSize:"10px",fontWeight:"900",color:mxAlert.color,letterSpacing:"2px",textShadow:`0 0 10px ${mxAlert.color}`}}>{mxAlert.title}</span><span style={{fontSize:"7px",background:mxAlert.color,color:"#000",padding:"2px 7px",borderRadius:"2px",fontWeight:"bold",letterSpacing:"1px"}}>IMPACTO DIRECTO</span></div>
<div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginBottom:"7px"}}>{mxAlert.lines.map((l,i)=><div key={i} style={{fontSize:"9px",color:"rgba(255,255,255,0.8)",background:`${mxAlert.color}10`,padding:"5px 10px",borderRadius:"4px",border:`1px solid ${mxAlert.color}20`,flex:"1",minWidth:"180px",lineHeight:1.6}}>{l}</div>)}</div>
<div style={{fontSize:"8px",color:mxAlert.color,borderTop:`1px solid ${mxAlert.color}15`,paddingTop:"6px"}}>💡 <strong>QUÉ HACER:</strong> {mxAlert.accion}</div>
</div>}
{/* NEWS TICKER */}
{mode==="news"&&<div style={{marginTop:"7px",width:"100%",maxWidth:"980px",background:"rgba(10,8,0,0.8)",border:"1px solid rgba(255,200,0,0.1)",borderRadius:"4px",padding:"5px 0",overflow:"hidden",backdropFilter:"blur(4px)",position:"relative",zIndex:1}}>
<div style={{fontSize:"8.5px",color:"#ffcc00",letterSpacing:"1.5px",whiteSpace:"nowrap",animation:"ticker 55s linear infinite",display:"inline-block",paddingLeft:"100%"}}>
🔴 IRÁN MISILES BALÍSTICOS CONTRA GOLFO/ISRAEL — DÍA 35 &nbsp;•&nbsp; 🗣️ TRUMP-XI EVALÚAN DIÁLOGO — MEDIACIÓN ACTIVA &nbsp;•&nbsp; 🛡️ OTAN BRUSELAS ABRIL — ARTÍCULO 4 Y 5 MESA &nbsp;•&nbsp; 🛢️ BRENT $108-112 — VOLATILIDAD EXTREMA &nbsp;•&nbsp; 📉 NASDAQ +1.2% — REBOTE CAUTELOSO &nbsp;•&nbsp; 🔴 QATAR 65% LNG — ORMUZ -95% &nbsp;•&nbsp; 🛢️ RAS TANURA 40% CAP &nbsp;•&nbsp; 💼 EMPLEOS USA -88K MAR &nbsp;•&nbsp; 💱 PESO MX {fx?`$${fx}/USD`:"PRESIONADO"} &nbsp;•&nbsp; ₿ BTC {crypto?.bitcoin?`$${Math.round(crypto.bitcoin.usd/1000)}K`:"..."} &nbsp;•&nbsp; 🇨🇳 CHINA COMPRA PETRÓLEO $52/BARRIL &nbsp;•&nbsp; ☢️ IAEA CONFIRMA DAÑOS FORDOW
</div>
</div>}
<div style={{marginTop:"8px",fontSize:"6px",color:"rgba(255,255,255,0.07)",letterSpacing:"2px",textAlign:"center",position:"relative",zIndex:1}}>MONITOR GLOBAL v12.1 FULL · USGS · NOAA · OPEN-METEO · OPENSKY · NASA EONET · COINGECKO · FRANKFURTER · CLAUDE AI · 03 ABR 2026 · DÍA 35</div>
<style>{`
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.8)}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
@keyframes slideIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideDown{from{opacity:0;transform:translateY(-100%)}to{opacity:1;transform:translateY(0)}}
@keyframes rippleOut{0%{transform:scale(0.1);opacity:1}100%{transform:scale(5);opacity:0}}
@keyframes warningPulse{0%,100%{opacity:1;box-shadow:none}50%{opacity:0.75;box-shadow:0 0 20px currentColor}}
* { box-sizing: border-box; }
::-webkit-scrollbar{width:3px;background:#010610}
::-webkit-scrollbar-thumb{background:#1a2a3a;border-radius:2px}
`}</style>
</div>
);
}
