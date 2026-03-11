Aquí tienes el código completo y sin interrupciones. He integrado las mejoras de **movimiento en tiempo real** para los portaaviones, animaciones de ataque y la API de **OpenSky** para tráfico aéreo real, todo sin eliminar tu estructura original.

Copia y pega esto tal cual:

```javascript
// @ts-nocheck
// MONITOR GLOBAL v9.2 — ACTUALIZADO 10 MAR 2026 — DÍA 11 DE LA GUERRA
// MEJORADO: Movimiento naval dinámico, API OpenSky (aviones), Animaciones de ataque
import { useState, useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";

const W = 960, H = 480;
const TOLUCA_LAT = 19.2826, TOLUCA_LNG = -99.6557;

// ── SPEECH ENGINE v2 — voz única por sesión, sin cortes ───────────────────────
let _speechQueue = [];
let _isSpeaking = false;
let _sessionVoice = null;
let _keepAliveTimer = null;
let _speechRate = 1.05;

function pickVoice() {
  const vs = window.speechSynthesis.getVoices();
  if (!vs.length) return null;
  const femRx = /monica|paulina|lucia|sabina|rosa|elena|conchita|angelica|lupe|paloma|susana|pilar|maria|fernanda|valeria|camila|andrea|sofia|isabel|beatriz/i;
  const fem = vs.filter(v => v.lang.startsWith("es") && femRx.test(v.name));
  const goog = vs.find(v => v.lang.startsWith("es") && v.name.includes("Google"));
  const any = vs.find(v => v.lang.startsWith("es")) || vs[0];
  return fem.length > 0 ? fem[Math.floor(Math.random() * fem.length)] : goog || any;
}

function speakText(txt, rate = 1.05) {
  try {
    stopSpeech();
    _speechRate = rate;
    _sessionVoice = pickVoice();
    const clean = txt
      .replace(/[🔴🟠🟡🟢⚠️☣️🦟🌋🌀🌊🔥🧊☀️🌪️❄️🛢️🏦🗳️📊📉₿🌐🛡️📰☠🚫🚢😢🇺🇸🇮🇷🇮🇱🇱🇧🇺🇦🇷🇺🇵🇰🇦🇫🇸🇦🇨🇾🇪🇸🇨🇳🇮🇳🇲🇽🇫🇷🇮🇹🇬🇧🇳🇱🇬🇷🇩🇪🇧🇷🇯🇵🇦🇺🇨🇦🇰🇷🇵🇭🇮🇩🇱🇷🇸🇩🇨🇩🇨🇱🇧🇩]/gu, "")
      .replace(/\n/g, ", ").replace(/\s+/g, " ").trim();
    const chunks = clean.match(/[^.!?]+[.!?]*/g) || [clean];
    _speechQueue = chunks.filter(s => s.trim().length > 1);
    setTimeout(() => _processQueue(), 100);
  } catch (e) {}
}

function _processQueue() {
  if (!_speechQueue.length || _isSpeaking) return;
  const sentence = _speechQueue.shift();
  if (!sentence?.trim()) { _processQueue(); return; }
  try {
    const u = new SpeechSynthesisUtterance(sentence.trim());
    u.lang = "es-MX"; u.rate = _speechRate; u.pitch = 1.25; u.volume = 0.95;
    if (_sessionVoice) u.voice = _sessionVoice;
    u.onstart = () => { _isSpeaking = true; };
    u.onend = () => { _isSpeaking = false; setTimeout(_processQueue, 60); };
    u.onerror = (e) => { if (e.error !== "interrupted") { _isSpeaking = false; setTimeout(_processQueue, 60); } };
    if (_keepAliveTimer) clearInterval(_keepAliveTimer);
    _keepAliveTimer = setInterval(() => {
      if (!window.speechSynthesis.speaking) { clearInterval(_keepAliveTimer); return; }
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }, 9000);
    window.speechSynthesis.speak(u);
  } catch (e) { _isSpeaking = false; }
}

function stopSpeech() {
  _speechQueue = [];
  _isSpeaking = false;
  if (_keepAliveTimer) { clearInterval(_keepAliveTimer); _keepAliveTimer = null; }
  try { window.speechSynthesis.cancel(); } catch (e) {}
}

// ── WMO WEATHER CODES ─────────────────────────────────────────────────────────
function wmoIcon(code) {
  if (code === 0) return "☀️";
  if (code <= 3) return "⛅";
  if (code <= 48) return "🌫️";
  if (code <= 57) return "🌦️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "❄️";
  if (code <= 82) return "🌦️";
  if (code <= 84) return "🌨️";
  if (code <= 94) return "⛈️";
  return "⛈️";
}
function wmoText(code) {
  if (code === 0) return "Despejado";
  if (code <= 2) return "P. nublado";
  if (code <= 3) return "Nublado";
  if (code <= 48) return "Niebla";
  if (code <= 57) return "Llovizna";
  if (code <= 65) return "Lluvia";
  if (code <= 67) return "Lluvia helada";
  if (code <= 77) return "Nieve";
  if (code <= 82) return "Chubascos";
  if (code <= 84) return "Chubascos nieve";
  return "Tormenta";
}

// ── MODE VOICES ───────────────────────────────────────────────────────────────
const MODE_VOICE = {
  war: "Conflictos globales. Día once de la guerra entre Estados Unidos e Irán. Hoy es el día más intenso de ataques según el Secretario de Defensa Hegseth. Irán amenaza con no dejar salir ni un litro de petróleo. El Brent tocó ciento diecinueve dólares.",
  disease: "Modo enfermedades. Brote activo de sarampión en México. Mpox clade uno con casos locales en Estados Unidos. EE.UU. se retira de la OMS reduciendo la vigilancia pandémica global. Poliovirus sigue en emergencia internacional.",
  climate: "Modo clima. Tornados activos en Estados Unidos. Ola de calor extrema en India. Los sismos de la USGS y los huracanes de la NOAA se muestran en tiempo real.",
  news: "Modo economía. Día once de guerra: Brent tocó ciento diecinueve dólares. Qatar declaró fuerza mayor en gas licuado. Saudi Aramco cerró Ras Tanura. Más de ciento cincuenta tanqueros varados. G7 negocia la mayor liberación de reservas de petróleo de la historia.",
};

// ── MEXICO ALERTS — por modo ──────────────────────────────────────────────────
function getMexicoAlert(mode, hurricanes, wlive, quakes) {
  if (mode === "war") return {
    icon: "🇲🇽",
    title: "IMPACTO EN MÉXICO — DÍA 11",
    color: "#ff6600",
    lines: [
      "⛽ Gasolina subió ~22% por Ormuz bloqueado 95% y petróleo a $110+.",
      "💱 Peso muy presionado — dólar en máximos por crisis energética global.",
      "📦 Aranceles Trump 35% a México en negociación — manufacturas en espera.",
      "🔴 Sarampión activo + mpox clade I en USA: doble presión sanitaria.",
    ],
    accion: "Llena el tanque antes de que suban más. Evita cambiar dólares ahora. Revisa vacunas.",
  };
  if (mode === "disease") return {
    icon: "🇲🇽",
    title: "ALERTA SANITARIA MÉXICO — MAR 2026",
    color: "#ff2200",
    lines: [
      "🔴 Sarampión ACTIVO: CDMX, Jalisco y Nuevo León.",
      "📋 Verifica tu cartilla de vacunación. Necesitas 2 dosis de SRP.",
      "🏫 SSA recomienda evitar eventos masivos sin estar vacunado.",
      "👶 Niños 12-15 meses y adultos sin vacunar: riesgo alto.",
    ],
    accion: "Llama al 800-00-44800 (SSA) para saber dónde vacunarte gratis.",
  };
  if (mode === "climate") {
    const mexHur = hurricanes.filter(h => {
      const pos = h;
      return pos.lat > 10 && pos.lat < 30 && pos.lng > -120 && pos.lng < -75;
    });
    const hasFrio = true;
    return {
      icon: "🇲🇽",
      title: hasFrio ? "FRENTE FRÍO 39 — ACTIVO HOY" : "CLIMA EN MÉXICO",
      color: "#00aaff",
      lines: mexHur.length > 0
        ? [
          `🌀 ${mexHur[0].name} amenaza México. Zonas de mayor riesgo: Veracruz, Tabasco, Campeche, Yucatán.`,
          "📦 Prepara mochila de emergencia: agua, comida 3 días, documentos, radio.",
          "🏠 Refuerza ventanas y puertas. Conoce tu ruta de evacuación.",
          "📲 Activa alertas CENAPRED en tu celular.",
        ]
        : [
          "🧊 Frente frío 39 activo hoy domingo 8 de marzo 2026.",
          "❄️ Posible nieve en zonas altas: Toluca, Nevado de Toluca, Sierra Nevada.",
          "🌬️ Vientos fuertes en Estado de México, Puebla, Tlaxcala.",
          "🌧️ Lluvias y chubascos en CDMX por la tarde. Temperatura mínima 3-5°C.",
        ],
      accion: mexHur.length > 0
        ? "Si estás en zona costera del Golfo: prepárate para posible evacuación preventiva."
        : "Abrígate bien hoy. Si vas a zonas altas, lleva ropa térmica. Cuidado con carreteras heladas.",
    };
  }
  if (mode === "news") return {
    icon: "🇲🇽",
    title: "IMPACTO ECONÓMICO MÉXICO — 10 MAR 2026",
    color: "#ffcc00",
    lines: [
      "🛢️ Gasolina +22% en México — petróleo Brent tocó $119, ahora $110+.",
      "💵 Peso en mínimos — dólar caro, inflación importada en camino.",
      "📦 Exportaciones a EE.UU. en riesgo: aranceles 35% + recesión global Q3.",
      "⚓ Qatar LNG fuerza mayor — 20% del gas mundial interrumpido.",
    ],
    accion: "Llena el tanque ya. Evita cambiar dólares. Considera invertir en CETES para proteger ahorros.",
  };
  return null;
}

// ── ALL COUNTRY DATA ──────────────────────────────────────────────────────────
const ALL_COUNTRY_DATA = {
  war: {
    "840":{name:"🇺🇸 EE.UU.",fecha:"DÍA 11 — 10 MAR",c:"#ff2020",det:"DÍA 11: El día más intenso de ataques según Hegseth. 5,000+ objetivos destruidos, 50+ buques iraníes. 8 soldados muertos — el último Sgt. Pennington, 26 años, Kentucky. Trump da mensajes contradictorios: dice guerra corta pero también busca victoria absoluta. Irán amenaza bloquear todo el petróleo del Medio Oriente. Trump responde: los golpearemos 20 veces más fuerte."},
    "364":{name:"🇮🇷 IRÁN",fecha:"DÍA 11 — 10 MAR",c:"#ff1a1a",det:"DÍA 11: IRGC declara que Irán, no EE.UU., decidirá cuándo termina la guerra. FM Araghchi: negociar con EE.UU. no está sobre la mesa. Internet de Irán bloqueado 240+ horas — el apagón más severo de la historia. Ataque en edificios residenciales en Teherán: 40 muertos. 1,255+ muertos totales, 10,000 heridos. Cientos de miles se manifestaron apoyando al nuevo Líder Supremo Mojtaba."},
    "376":{name:"🇮🇱 ISRAEL",fecha:"DÍA 11 — 10 MAR",c:"#ff1a1a",det:"DÍA 11: Israel ataca infraestructura financiera de Hezbollah en Beirut — Al-Qard Al-Hassan. Nuevo bombardeo en Arak: 5 muertos en edificio residencial. HRW: Israel usó fósforo blanco en zonas residenciales del sur del Líbano. Discute con EE.UU. posible operación especial para incautar reservas iraníes de uranio enriquecido."},
    "422":{name:"🇱🇧 LÍBANO",fecha:"DÍA 11",c:"#ff4444",det:"394 muertos en Líbano incluyendo 83 niños y 42 mujeres en la primera semana. Israel continúa atacando infraestructura de Hezbollah. Beirut sur bombardeado. Fósforo blanco confirmado por HRW."},
    "804":{name:"🇺🇦 UCRANIA",fecha:"EN CURSO",c:"#ff8800",det:"Guerra con Rusia año 5. Ucrania ayuda a EE.UU. con drones Shahed iraníes. Zelenski declaró que esto ya es la Tercera Guerra Mundial."},
    "643":{name:"🇷🇺 RUSIA ⚠️",fecha:"8 MAR",c:"#ff4400",det:"DÍA 11: Putin habló con Trump — discutieron la guerra en Irán y paz en Ucrania. Kremlin: demanda de energía rusa aumentó significativamente por la crisis. Rusia se beneficia triple: ingresos energéticos, distracción militar occidental, menos ayuda a Ucrania."},
    "586":{name:"🇵🇰 PAKISTÁN",fecha:"DÍA 8",c:"#ff5500",det:"Operación Ghazab Lil Haq, día 8. 481 afganos muertos. Bagram destruida. Potencia nuclear en guerra activa. Teme que el petróleo caro colapse su economía."},
    "4":  {name:"🇦🇫 AFGANISTÁN",fecha:"DÍA 8",c:"#ff5500",det:"Bajo bombardeo pakistaní día 8. 21.9 millones necesitan ayuda. Taliban pide diálogo. Pakistán continúa los ataques."},
    "682":{name:"🇸🇦 ARABIA SAUDITA",fecha:"10 MAR — DÍA 11",c:"#ff9900",det:"DÍA 11: Saudi Aramco cerró la refinería Ras Tanura — la mayor del mundo. EE.UU. ordenó salida de diplomáticos no esenciales de Arabia Saudita por riesgos de seguridad. Drones interceptados sobre Rub al-Khali rumbo al campo Shaybah. Irán sigue atacando a pesar de promesas."},
    "414":{name:"🇰🇼 KUWAIT",fecha:"8 MAR — NUEVO",c:"#ff8800",det:"NUEVO 8 MAR: Drones iraníes atacaron almacenamiento de combustible del Aeropuerto Internacional. Operaciones afectadas. Segundo ataque a Kuwait en la guerra."},
    "634":{name:"🇶🇦 QATAR",fecha:"8 MAR",c:"#ff8800",det:"DÍA 11: Qatar declaró fuerza mayor en sus exportaciones de gas natural licuado por ataques iraníes. Qatar suministra el 20% del LNG mundial — impacto global masivo. Podría tardar un mes en normalizar producción. Base Al Udeid sigue activa pero bajo amenaza constante."},
    "784":{name:"🇦🇪 EMIRATOS",fecha:"8 MAR",c:"#ff8800",det:"Drones iraníes en Abu Dhabi y aeropuerto de Dubai. Pezeshkian prometió parar, pero los ataques continuaron horas después. Dubai bajo alerta máxima."},
    "48": {name:"🇧🇭 BAHREIN",fecha:"8 MAR",c:"#ff8800",det:"Planta desalinizadora dañada por drones iraníes. Bahrein reportó daños materiales. Irán acusó a EE.UU. de destruir su planta en Qeshm."},
    "196":{name:"🇨🇾 CHIPRE ⚠️",fecha:"4 MAR",c:"#ff8800",det:"RAF Akrotiri fue el primer suelo OTAN atacado por Irán. Francia, Italia, España, Países Bajos y Grecia enviaron buques. Cinco países defendiendo Chipre."},
    "368":{name:"🇮🇶 IRAQ",fecha:"8 MAR",c:"#ff6600",det:"Drone iraní golpeó hotel Erbil Arjaan en Kurdistan iraquí. Embajada de EE.UU. advirtió el ataque. Milicias pro-iraníes activas. Parlamento iraquí exige retirada de tropas americanas."},
    "724":{name:"🇪🇸 ESPAÑA",fecha:"4 MAR",c:"#ffcc00",det:"España envió fragata Cristóbal Colón al Mediterráneo pero rechaza cooperación ofensiva. Aranceles Trump 25% desde el 15 de marzo. Único miembro OTAN que rechazó el 5% en defensa."},
    "156":{name:"🇨🇳 CHINA",fecha:"8 MAR",c:"#ffcc00",det:"DÍA 11: China compra petróleo iraní por debajo del mercado aprovechando la crisis. Xi prepara reunión con Trump. Wang Yi: cese inmediato. Aranceles 145% de EE.UU. más crisis energética: doble presión sobre economía china."},
    "356":{name:"🇮🇳 INDIA",fecha:"8 MAR",c:"#ffaa44",det:"EE.UU. dio a India exención de 30 días para seguir comprando petróleo iraní. 18 mil ciudadanos indios evacuando desde Irán. Intenta mantenerse neutral."},
    "792":{name:"🇹🇷 TURQUÍA",fecha:"4 MAR",c:"#ffcc00",det:"DÍA 11: Defensa aérea OTAN de Turquía derribó misil balístico iraní al entrar en su espacio aéreo. Erdogan convocó el Artículo 4. Mediador activo. Turquía en posición delicada: miembro OTAN pero relaciones con Irán."},
    "818":{name:"🇪🇬 EGIPTO",fecha:"EN CURSO",c:"#ffcc00",det:"Canal de Suez parcialmente bloqueado. Bajo presión interna pro-palestina. Pérdidas millonarias por caída del turismo."},
    "250":{name:"🇫🇷 FRANCIA",fecha:"5 MAR",c:"#4466ff",det:"Charles de Gaulle en Mediterráneo oriental. Macron condenó ataques a civiles. Canciller iraní advirtió que Europa puede ser objetivo legítimo."},
    "380":{name:"🇮🇹 ITALIA",fecha:"5 MAR",c:"#4466ff",det:"Fragatas enviadas para defender Chipre. Bases en Sicilia dando apoyo logístico. Bajo amenaza iraní de ser objetivo legítimo si Europa se une al conflicto."},
    "528":{name:"🇳🇱 PAÍSES BAJOS",fecha:"5 MAR",c:"#4466ff",det:"Fragata enviada al Mediterráneo. Aranceles Trump 25% más amenaza iraní de objetivo legítimo si Europa se une al conflicto."},
    "826":{name:"🇬🇧 REINO UNIDO",fecha:"5 MAR",c:"#4466ff",det:"Autorizó uso de bases en Chipre. Akrotiri atacada por drones. Misma advertencia iraní sobre Europa como objetivo legítimo."},
    "300":{name:"🇬🇷 GRECIA",fecha:"5 MAR",c:"#4466ff",det:"Buques de guerra al Mediterráneo. Colabora en defensa aérea de Chipre. Preocupada por desestabilización del Mediterráneo oriental."},
    "484":{name:"🇲🇽 MÉXICO",fecha:"EN CURSO",c:"#88cc00",det:"DÍA 11: Gasolina en México subió ~22% por petróleo a $110+. Peso en mínimos. Aranceles Trump 35% en negociación. Sarampión activo + mpox clade I en EE.UU. — riesgo de cruce fronterizo. Cuádruple crisis: energética, sanitaria, arancelaria y económica."},
  },
  disease: {
    "484":{name:"🇲🇽 MÉXICO 🔴",fecha:"MAR 2026",c:"#ff2200",det:"Brote activo de sarampión, marzo 2026. Casos en CDMX, Jalisco y Nuevo León. Vinculado a Texas. Cobertura de vacunación bajó post-COVID. SSA emitió alerta nacional. Llama al 800-00-44800 para vacunarte gratis."},
    "840":{name:"🇺🇸 EE.UU.",fecha:"MAR 2026",c:"#ffaa00",det:"H5N1 activo en ganado bovino 47 estados, primera transmisión humana confirmada. NUEVO: Mpox clade I — 4 casos sin historial de viaje a África, posible transmisión local. EE.UU. se retiró de la OMS reduciendo vigilancia pandémica. Sarampión vinculado con México. Triple amenaza virológica activa."},
    "180":{name:"🇨🇩 R.D. CONGO",fecha:"EN CURSO",c:"#ff6600",det:"Epicentro del mpox. Variante clade Ib más transmisible. 100K casos. OMS emergencia global desde 2024. Acceso humanitario limitado por conflicto armado."},
    "76": {name:"🇧🇷 BRASIL",fecha:"EN CURSO",c:"#ff6600",det:"Año récord de dengue. 5 millones de casos, 5 mil muertes. Serotipo DENV-3 reemergente. Colapso hospitalario en São Paulo, Río y Brasilia."},
    "430":{name:"🇱🇷 LIBERIA",fecha:"FEB 2026",c:"#cc0000",det:"Ébola detectado febrero 2026. 300 contactos bajo rastreo. Mortalidad 65%. OMS desplegó equipo de emergencia."},
    "729":{name:"🇸🇩 SUDÁN",fecha:"EN CURSO",c:"#ff8800",det:"Cólera en guerra civil. 200 mil casos, 3 mil muertes. Sin agua potable. Ayuda bloqueada. La peor crisis humanitaria del mundo."},
    "356":{name:"🇮🇳 INDIA",fecha:"EN CURSO",c:"#ff4400",det:"Varios brotes simultáneos. Dengue en el sur. Ola de calor matando 3200 personas. Sistema hospitalario bajo presión extrema."},
    "156":{name:"🇨🇳 CHINA",fecha:"MAR 2026",c:"#ff4400",det:"COVID XEC detectada marzo 2026. OMS monitorea. Influenza H3N2 en circulación intensa. Vigilancia epidemiológica reforzada."},
    "710":{name:"🇿🇦 SUDÁFRICA",fecha:"EN CURSO",c:"#ff8800",det:"Mpox clade Ib presente. Tuberculosis resistente en aumento. Mayor país afectado de África Subsahariana por VIH."},
    "410":{name:"🇰🇷 COREA DEL SUR",fecha:"MAR 2026",c:"#ffcc00",det:"COVID XEC detectada. Mejor sistema de rastreo del mundo. Restricciones leves. Vacunación al 94% de adultos."},
    "360":{name:"🇮🇩 INDONESIA",fecha:"EN CURSO",c:"#ff9900",det:"Dengue activo en Yakarta y Java. 800 mil casos en 2026. H5N1 en aves. Sistema de salud rural limitado."},
    "608":{name:"🇵🇭 FILIPINAS",fecha:"EN CURSO",c:"#ff7733",det:"Dengue y leptospirosis activos. Polio en zonas rurales. Mpox clade II presente. Bajo vigilancia reforzada OMS."},
  },
  climate: {
    "840":{name:"🇺🇸 EE.UU. 🌪️",fecha:"MAR 2026",c:"#aa44ff",det:"23 tornados en 24 horas en Tornado Alley. Oklahoma, Kansas y Texas. Tres EF4 a 280 km/h. 8 muertos, 140 heridos. Frente frío ártico de -35°C en el norte simultáneamente."},
    "356":{name:"🇮🇳 INDIA 🔥",fecha:"EN CURSO",c:"#ff2200",det:"Ola de calor histórica. 47 a 51 grados. 3200 muertes. Récord absoluto. Alerta roja en 8 estados. Escasez de agua crítica."},
    "36": {name:"🇦🇺 AUSTRALIA 🔥",fecha:"EN CURSO",c:"#ff3300",det:"Mega incendios en Nueva Gales del Sur. 2.1 millones de hectáreas quemadas. 12 muertos. Aire peligroso en Sídney."},
    "76": {name:"🇧🇷 BRASIL 🌊",fecha:"EN CURSO",c:"#0055ff",det:"Inundaciones en Rio Grande do Sul y Santa Catarina. 200 mil evacuados. Pérdidas en cosechas de soja y maíz."},
    "392":{name:"🇯🇵 JAPÓN 🌋",fecha:"EN CURSO",c:"#ffaa00",det:"Sismicidad activa. Múltiples M5 registrados USGS. Alerta temprana de tsunamis activa. Volcán Sakurajima en actividad elevada."},
    "360":{name:"🇮🇩 INDONESIA 🌋",fecha:"EN CURSO",c:"#ff9900",det:"Volcán Merapi en alerta naranja. Sismos M5 frecuentes. 127 volcanes activos. País con más actividad volcánica del mundo."},
    "608":{name:"🇵🇭 FILIPINAS 🌀",fecha:"EN CURSO",c:"#7733ff",det:"Temporada de tifones. Mar de Filipinas 2 grados sobre lo normal. Amenaza activa de ciclones."},
    "724":{name:"🇪🇸 ESPAÑA 🔥",fecha:"EN CURSO",c:"#ff5500",det:"Ola de calor prematura. 38 grados en marzo, récord histórico. Riesgo de incendios muy alto. Sequía estructural en el mediterráneo."},
    "250":{name:"🇫🇷 FRANCIA 🌊",fecha:"MAR 2026",c:"#0066ff",det:"Inundaciones Europa Central. Ríos Rin y Saona desbordados. 25 mil evacuados. Nieve tardía en los Alpes."},
    "152":{name:"🇨🇱 CHILE 🌋",fecha:"EN CURSO",c:"#ffbb00",det:"Volcán Villarrica en actividad. Sismos frecuentes en zona de subducción. Alerta tsunami preventiva activa en costas."},
    "484":{name:"🇲🇽 MÉXICO 🌀❄️",fecha:"8 MAR — HOY",c:"#8844ff",det:"Frente Frío 39 activo hoy domingo 8 de marzo 2026. Posible nieve en Nevado de Toluca, Sierra Nevada y zonas altas. Lluvias y chubascos en CDMX por la tarde. Temperatura mínima 3 a 5 grados en el Valle de Toluca. Temporada de ciclones atlánticos se acerca: Golfo de México 2 grados sobre lo normal."},
    "50": {name:"🇧🇩 BANGLADÉS 🌊",fecha:"EN CURSO",c:"#6633ff",det:"Inundaciones crónicas. Nivel del mar sube 3.7mm por año. 17 millones en riesgo de desplazamiento para 2050."},
    "124":{name:"🇨🇦 CANADÁ 🧊",fecha:"MAR 2026",c:"#00ccff",det:"Frente frío ártico. -35°C en Manitoba y Saskatchewan. Récord de nieve en Alberta. Vórtice polar desestabilizado."},
  },
  news: {
    "840":{name:"🇺🇸 EE.UU.",fecha:"10 MAR 2026",c:"#ff6600",det:"Día 11: El día más intenso de ataques. Brent tocó $119. Gas en EE.UU.: $3.48/galón (+17% desde inicio guerra). Trump: guerra corta, pero también busca victoria absoluta. 8 soldados muertos. Aranceles 25% a Europa entran el 15 de marzo."},
    "364":{name:"🇮🇷 IRÁN",fecha:"8 MAR",c:"#ff4444",det:"Día 11: IRGC decide cuándo termina la guerra. FM Araghchi: no habrá negociaciones. Internet apagado 240+ horas, récord mundial. 1,255+ muertos, 10,000 heridos. Qatar LNG fuerza mayor — 20% del LNG global interrumpido."},
    "682":{name:"🇸🇦 ARABIA SAUDITA",fecha:"10 MAR — DÍA 11",c:"#ffaa00",det:"DÍA 11: Saudi Aramco cerró Ras Tanura — mayor refinería del mundo. EE.UU. evacuó diplomáticos no esenciales de Riad. Iraq, UAE y Kuwait cortaron producción por almacenamiento lleno. Hormuz: caída del 95% en tráfico de buques."},
    "276":{name:"🇩🇪 ALEMANIA",fecha:"23 FEB — EN VIGOR",c:"#4488ff",det:"CDU de Merz ganó con 29%. AfD 20% histórico. Merz negocia coalición. Alemania rechaza aranceles Trump del 25% que entran el 15 de marzo."},
    "250":{name:"🇫🇷 FRANCIA",fecha:"MAY 2026",c:"#4488ff",det:"Elecciones anticipadas en mayo. Le Pen lidera con 34%. Macron fuera. Francia bajo aranceles Trump 25% y amenaza iraní de ser objetivo si se une al conflicto."},
    "156":{name:"🇨🇳 CHINA",fecha:"8 MAR",c:"#ffcc00",det:"DÍA 11: China compra petróleo iraní con gran descuento. Xi prepara reunión con Trump. Aranceles 145% más crisis energética. Qatari Energy Minister: precios podrían llegar a $150/barril."},
    "643":{name:"🇷🇺 RUSIA",fecha:"8 MAR",c:"#ff7700",det:"Rusia: aumento significativo en demanda de su energía por la guerra. Putin llamó a Pezeshkian. Dando inteligencia a Irán confirmado."},
    "76": {name:"🇧🇷 BRASIL",fecha:"EN CURSO",c:"#44ffaa",det:"Brasil intenta mediar. Exportaciones de petróleo y soja aumentan. Real subió 4%. Lula propuso reunión de emergencia del G20."},
    "826":{name:"🇬🇧 REINO UNIDO",fecha:"MAR 2026",c:"#4466ff",det:"Aranceles Trump 25%. Libra perdió 3.5%. Starmer busca acuerdo bilateral con EE.UU. Bases en Chipre usadas y atacadas."},
    "724":{name:"🇪🇸 ESPAÑA",fecha:"MAR 2026",c:"#ff6600",det:"Ibex 35 cayó 8%. Aranceles Trump 25%. Prepara represalias con la UE. Fragata en Mediterráneo. Rechazó cooperación militar ofensiva."},
    "392":{name:"🇯🇵 JAPÓN",fecha:"MAR 2026",c:"#ff3344",det:"Tokio cayó 9.1%, peor desde 2020. Importa 90% de su petróleo del Golfo. Ormuz peligroso. Sony y Toyota en alerta."},
    "484":{name:"🇲🇽 MÉXICO",fecha:"MAR 2026",c:"#ffaa44",det:"Cuádruple crisis: petróleo $110+ (+22% gasolina), peso en mínimos, aranceles 35% Trump, sarampión activo. Qatar LNG fuerza mayor impacta precios de energía en México. FMI: recesión Q3 si la guerra dura más de 4 semanas."},
    "528":{name:"🇳🇱 PAÍSES BAJOS",fecha:"MAR 2026",c:"#4466ff",det:"Aranceles Trump 25%. Puerto Rotterdam cayó 12% en tráfico. Economía dependiente del comercio. Shell reporta pérdidas."},
    "380":{name:"🇮🇹 ITALIA",fecha:"MAR 2026",c:"#4466ff",det:"Aranceles Trump 25%. Meloni busca excepción por apoyo político a Trump. Fiat y Ferrari en incertidumbre."},
  },
};

// ── POINTS ────────────────────────────────────────────────────────────────────
const BASE_WAR=[
  {id:"usa",name:"EE.UU.",lat:38,lng:-97,c:"#ff2020",s:5,st:"guerra",conn:["iran"],fecha:"DÍA 11",det:"5,000+ objetivos destruidos en Irán. Trump da señales mixtas: a CBS dijo 'la guerra está muy completa', pero luego dijo que falta 'la victoria total'. EE.UU. y Israel discuten operación especial para incautar el uranio altamente enriquecido de Irán. 7 soldados muertos. Gobierno ordenó salida de diplomáticos no esenciales de Arabia Saudita."},
  {id:"iran",name:"IRÁN",lat:32.4,lng:53.7,c:"#ff1a1a",s:5,st:"guerra",conn:["israel","saudi"],fecha:"DÍA 11",det:"IRGC: 'Irán determinará cuándo termina la guerra.' FM Araghchi: negociar con EE.UU. ya no está sobre la mesa. Kamal Kharazi: la guerra terminará por el dolor económico. Iran lanzó 500+ misiles y 2,000+ drones desde el 28 de febrero. Gobierno preparado para guerra larga."},
  {id:"israel",name:"ISRAEL",lat:31,lng:34.9,c:"#ff1a1a",s:5,st:"guerra",conn:["lebanon"],fecha:"DÍA 11",det:"Israel ataca infraestructura financiera de Hezbollah en Beirut. Jefe del ejército: 'la guerra durará mucho tiempo'. HRW reporta uso de fósforo blanco en el sur del Líbano. 82% de israelíes apoya las operaciones según encuesta IDI. Netanyahu planeaba el ataque desde noviembre 2025."},
  {id:"lebanon",name:"LÍBANO",lat:33.9,lng:35.5,c:"#ff4444",s:4,st:"guerra",fecha:"DÍA 11",det:"486+ muertos en Líbano. Hotel en Beirut atacado: 4 muertos, 10 heridos. Israel ataca asociación Al-Qard Al-Hassan ligada a Hezbollah. Israel usó fósforo blanco en el sur del Líbano según HRW."},
  {id:"ukraine",name:"UCRANIA",lat:48.4,lng:31.2,c:"#ff8800",s:4,st:"guerra",conn:["russia"],fecha:"EN CURSO",det:"Guerra con Rusia año 5. Zelenski: esto ya es la Tercera Guerra Mundial. Ucrania ayuda a EE.UU. con análisis de drones Shahed iraníes."},
  {id:"russia",name:"RUSIA\n⚠️INTEL",lat:61.5,lng:105,c:"#ff4400",s:4,st:"activo",fecha:"10 MAR",det:"Rusia provee a Irán con información de localización de buques de guerra y aviones de EE.UU. en el Medio Oriente. Confirmado por 3 fuentes de inteligencia. Rusia se beneficia económicamente: alta demanda de su energía por el cierre de Ormuz."},
  {id:"pak",name:"PAKISTÁN",lat:30.4,lng:69.3,c:"#ff5500",s:4,st:"guerra",conn:["afg"],fecha:"DÍA 11",det:"Operación en curso. 481+ afganos muertos. Bagram destruida. Potencia nuclear en guerra activa. Economía bajo presión por petróleo caro."},
  {id:"afg",name:"AFGANISTÁN",lat:33.9,lng:67.7,c:"#ff5500",s:4,st:"guerra",fecha:"DÍA 11",det:"Bajo bombardeo pakistaní. 21.9M necesitan ayuda humanitaria. Taliban abierto a diálogo. Pakistán continúa ataques."},
  {id:"gulf",name:"GOLFO\n🔴ATAQUES",lat:24.5,lng:51.2,c:"#ff6600",s:5,st:"atacado",fecha:"10 MAR — DÍA 11",det:"Bahrain: 32 heridos en zona residencial, BAPCO declara force majeure. Saudi Arabia: 2 muertos bangladesíes en Kharj. Qatar: docena de explosiones. UAE: defensas activas. Kuwait: 2 guardias fronterizos muertos. Turquía: defensa OTAN derribó misil balístico iraní. Decenas de muertos extranjeros en toda la región."},
  {id:"school",name:"ESCUELA\nGUERRAS CRIME?",lat:27.5,lng:52.5,c:"#ff2200",s:5,st:"critico",fecha:"10 MAR",det:"EE.UU. bajo investigación: strike en escuela primaria de niñas en el sureste de Irán el 28 de febrero mató 168 niños. Senadores demócratas calificaron a Hegseth de 'cavalier'. Bellingcat y NPR verificaron que el misil estadounidense impactó cerca de un compuesto militar con posible información de objetivo desactualizada. Trump culpa a Irán."},
  {id:"ormuz",name:"ORMUZ\n⚠️-90% TRÁFICO",lat:26.6,lng:56.5,c:"#ff8800",s:5,st:"critico",fecha:"10 MAR",det:"Tráfico de petroleros cayó 90% desde el inicio de la guerra. 300 petroleros atrapados dentro del estrecho. Citigroup: mercado perdiendo 7-11 millones de barriles diarios. Kuwait redujo producción por falta de almacenamiento. Saudi Aramco redujo en dos yacimientos. Brent tocó $116 el lunes, ahora ~$90 con señales de Trump."},
  {id:"soccer",name:"FÚTBOL IRANÍ\n🇮🇷ASILO",lat:-33.8,lng:151,c:"#ff9900",s:3,st:"activo",fecha:"10 MAR — NUEVO",det:"NUEVO: 5 jugadoras del equipo femenil de fútbol de Irán pidieron asilo en Australia donde juegan la Copa Asiática Femenina. No quieren regresar a Irán por temor a persecución. Australia confirmó que están seguras con la policía."},
  {id:"hegseth",name:"EE.UU.\nINVESTIGACIÓN",lat:38.9,lng:-77,c:"#ffaa00",s:3,st:"tension",fecha:"10 MAR",det:"Senado demócrata exige investigación sobre Secretario Hegseth. Strike en escuela iraní mató 168 niños el día 1. NPR e imágenes satelitales sugieren error de inteligencia. Trump dice que Irán es culpable. Investigación del Pentágono en curso."},
];

const CARRIERS = [
  { id: "ford", name: "USS FORD", flag: "🇺🇸", pais: "EE.UU.", lat: 22.8, lng: 61.5, fecha: "DÍA 8", det: "USS Gerald R. Ford CVN-78. Armada de EE.UU. Mar Arábigo occidental, posición día 8. El más avanzado del mundo. F-35C atacando refinerías iraníes en la nueva fase. Rumbo norte.", route: [{ lat: 22.8, lng: 61.5 }, { lat: 24.5, lng: 60.0 }, { lat: 26.0, lng: 58.0 }] },
  { id: "ike", name: "USS IKE", flag: "🇺🇸", pais: "EE.UU.", lat: 13.8, lng: 54.2, fecha: "DÍA 8", det: "USS Eisenhower CVN-69. Armada de EE.UU. Golfo de Adén, día 8. 600 Tomahawks lanzados. Interceptando drones iraníes hacia el Golfo.", route: [{ lat: 13.8, lng: 54.2 }, { lat: 15.5, lng: 55.0 }, { lat: 17.0, lng: 56.0 }] },
  { id: "tr", name: "USS ROSVLT", flag: "🇺🇸", pais: "EE.UU.", lat: 18.2, lng: 58.5, fecha: "DÍA 8", det: "USS Theodore Roosevelt CVN-71. Armada de EE.UU. Mar de Omán, día 8. Bloquea salidas iraníes al Índico. Se desplazó 40 millas al norte desde ayer.", route: [{ lat: 18.2, lng: 58.5 }, { lat: 20.0, lng: 59.5 }, { lat: 22.0, lng: 60.5 }] },
  { id: "linc", name: "USS LINCOLN", flag: "🇺🇸", pais: "EE.UU.", lat: 13.1, lng: 48.8, fecha: "DÍA 8", det: "USS Lincoln CVN-72. Armada de EE.UU. Mar Rojo sur, día 8. Cuarto portaaviones en zona. Escoltando rutas de suministro.", route: [{ lat: 13.1, lng: 48.8 }, { lat: 14.5, lng: 50.2 }, { lat: 16.0, lng: 52.0 }] },
  { id: "degaulle", name: "CHARLES D.G.", flag: "🇫🇷", pais: "FRANCIA", lat: 35.2, lng: 26.1, fecha: "8 MAR", det: "Charles de Gaulle R91. Marine Nationale Française. Mediterráneo oriental, día 8. Único portaaviones nuclear fuera de EE.UU. Defiende Chipre con 4 fragatas y submarino nuclear.", route: [{ lat: 35.2, lng: 26.1 }, { lat: 34.5, lng: 28.5 }, { lat: 33.8, lng: 31.0 }] },
];

const BASE_DISEASE=[
  {id:"saramp",name:"SARAMPIÓN\nMÉXICO 🔴",lat:19.4,lng:-99.1,c:"#ff2200",s:4,st:"alerta",fecha:"10 MAR 2026",det:"9,074 casos confirmados desde enero 2025. En 2026 ya van 2,000+ casos. 7 estados en focos rojos: Jalisco, Colima, Chiapas, Sinaloa, Nayarit, Tabasco y CDMX. OPS emitió alerta por Mundial 2026 con sedes en México, EE.UU. y Canadá. Niños de 1-4 años los más afectados. Llama al 800-00-44800 para vacunarte gratis."},
  {id:"mpox",name:"MPOX\nCONGO",lat:0.3,lng:25.5,c:"#ff6600",s:4,st:"activo",fecha:"EN CURSO",det:"Emergencia global OMS activa. 100K+ casos. Variante clade Ib más transmisible. Congo, Uganda y Kenia. Acceso limitado a vacunas sigue siendo el principal obstáculo."},
  {id:"h5n1",name:"H5N1\nUSA",lat:37.1,lng:-95.7,c:"#ffaa00",s:4,st:"alerta",fecha:"EN CURSO",det:"H5N1 activo en ganado bovino en 47 estados de EE.UU. Primera transmisión humana confirmada 2026. OMS en alerta pandémica máxima. Vacuna en fase 3."},
  {id:"dengue",name:"DENGUE\nBRASIL",lat:-10,lng:-55,c:"#ff6600",s:3,st:"activo",fecha:"EN CURSO",det:"5 millones de casos, 5 mil muertes en Brasil. Serotipo DENV-3 reemergente. Colapso hospitalario en São Paulo, Río y Brasilia."},
  {id:"nipah",name:"NIPAH\nINDIA",lat:10.5,lng:76.2,c:"#cc0000",s:4,st:"alerta",fecha:"ENE 2026",det:"5 casos de virus Nipah en India. 100 personas en cuarentena. Mortalidad hasta 70%. Sin tratamiento específico disponible. OMS lo tiene en lista de patógenos prioritarios. Murciélagos frugívoros como vector principal."},
  {id:"cholera",name:"CÓLERA\nSUDÁN",lat:15.6,lng:32.5,c:"#ff8800",s:3,st:"activo",fecha:"EN CURSO",det:"200 mil casos, 3 mil muertes. Sin agua potable por guerra civil. Ayuda bloqueada. La peor crisis humanitaria del mundo."},
  {id:"covid",name:"COVID XEC\nASIA",lat:30.6,lng:114.3,c:"#ff4400",s:2,st:"activo",fecha:"MAR 2026",det:"Subvariante XEC. OMS monitoreando en China, Corea del Sur y Japón. Vacunación actualizada recomendada para grupos vulnerables."},
];

const BASE_CLIMATE=[
  {id:"heat",name:"OLA CALOR\nINDIA",lat:26,lng:80,c:"#ff2200",s:5,st:"extremo",icon:"🔥",pulse:true,fecha:"EN CURSO",det:"47 a 51 grados. 3200 muertes. Récord histórico. Alerta roja en 8 estados."},
  {id:"flood",name:"INUNDACIONES\nEUROPA",lat:47,lng:16,c:"#0066ff",s:4,st:"activo",icon:"🌊",pulse:true,fecha:"MAR 2026",det:"Danubio 8.4 metros. 45 mil evacuados en Austria, Hungría y Eslovaquia. 12 muertos."},
  {id:"fire",name:"INCENDIOS\nAUSTRALIA",lat:-33,lng:149,c:"#ff3300",s:4,st:"extremo",icon:"🔥",pulse:true,fecha:"EN CURSO",det:"2.1 millones de hectáreas quemadas. 12 muertos. Aire peligroso en Sídney."},
  {id:"tornado",name:"TORNADOS\nUSA",lat:36,lng:-97,c:"#aa44ff",s:4,st:"activo",icon:"🌪️",pulse:true,fecha:"MAR 2026",det:"23 tornados en 24 horas. Tres EF4 a 280 km/h. 8 muertos, 140 heridos."},
  {id:"cold",name:"FRENTE FRÍO 39\nMÉXICO-USA",lat:28,lng:-100,c:"#00ccff",s:3,st:"activo",icon:"🧊",pulse:true,fecha:"8 MAR — HOY",det:"Frente Frío 39 activo hoy en México. Posible nieve en Nevado de Toluca y zonas altas. Mínima 3 a 5 grados en Toluca. Lluvias en CDMX por la tarde. Vientos fuertes en Estado de México."},
];

const BASE_NEWS=[
  {id:"oil",name:"BRENT ~$90\n⬆️VOLÁTIL",lat:26.6,lng:56.5,c:"#ffaa00",s:5,st:"critico",icon:"🛢️",fecha:"10 MAR — HOY",det:"HOY: Brent cayó de $116 el lunes de vuelta a ~$90 tras señales mixtas de Trump. WTI a $85. Brent ha subido 66%+ desde el 28 de feb. Ormuz -90% tráfico. Citigroup: pérdida de 7-11 millones barriles diarios. Goldman Sachs advierte $100+ si el conflicto continúa. Qatar: riesgo de $150 si Ormuz sigue cerrado."},
  {id:"trump_mixed",name:"TRUMP\nSEÑALES MIXTAS",lat:38,lng:-97,c:"#ff6600",s:5,st:"critico",icon:"🗣️",fecha:"10 MAR — HOY",det:"HOY: Trump a CBS 'la guerra está muy completa', pero luego en Miami con legisladores republicanos dijo 'aún no hemos ganado suficiente, necesitamos victoria total'. Amenazó a Irán: si toca el Estrecho de Ormuz, EE.UU. golpeará 'VEINTE VECES MÁS FUERTE'. Señales confusas hunden y suben los mercados el mismo día."},
  {id:"jobs",name:"EMPLEOS USA\n-92K FEB",lat:38,lng:-97,c:"#ff3344",s:4,st:"activo",icon:"📊",fecha:"7 MAR",det:"EE.UU. perdió 92,000 empleos en febrero, muy por debajo de las estimaciones de +55,000. Desempleo subió a 4.4%. Bono del Tesoro a 10 años subió a 4.13%. La Fed podría mantener tasas altas más tiempo. Peor reporte laboral desde el inicio de la pandemia."},
  {id:"bahrain",name:"BAHRAIN\n🔴FORCE MAJEURE",lat:26.2,lng:50.5,c:"#ff4444",s:4,st:"critico",icon:"🔥",fecha:"10 MAR — NUEVO",det:"NUEVO: BAPCO (compañía nacional de petróleo de Bahrain) declaró force majeure en toda su operación. Drone iraní causó incendio en zona industrial Riffa. 32 heridos en zona residencial. Primer grande productor de petróleo del Golfo en declarar force majeure."},
  {id:"stocks",name:"BOLSAS\nREBOTE +GUERRA",lat:40.7,lng:-74,c:"#44cc88",s:3,st:"activo",icon:"📈",fecha:"10 MAR — HOY",det:"HOY: Acciones globales rebotan siguiendo el rally de Wall Street mientras el petróleo baja de $116 a ~$90. Pero el contexto sigue siendo frágil: empleos cayeron, la guerra continúa, Ormuz sigue cerrado. Wells Fargo: si petróleo se mantiene en $100, la economía global no lo aguanta."},
  {id:"mexico_eco",name:"MÉXICO\nPESO >18/USD",lat:19.4,lng:-99.1,c:"#ffaa44",s:4,st:"activo",icon:"💱",fecha:"10 MAR",det:"Peso mexicano rompió la barrera de 18 pesos por dólar por primera vez desde principios de 2026. Gasolina en México subió por guerra. Mezcla mexicana de exportación repuntó 5%. 32 estados tienen semáforo verde para deuda por nearshoring. Aranceles Trump 35% siguen en negociación."},
  {id:"nato",name:"OTAN\nCUMBRE 12 MAR",lat:50.9,lng:4.4,c:"#4466ff",s:3,st:"activo",icon:"🛡️",fecha:"12 MAR 2026",det:"Cumbre extraordinaria OTAN en Bruselas el 12 de marzo — 2 días. Solo 8 de 32 miembros cumplen el 2% del PIB. Trump exige 5%. Turquía derribó misil iraní con defensas OTAN — primer incidente del artículo colectivo en la guerra."},
  {id:"iran_soccer",name:"IRAN SOCCER\nASILO AUSTRALIA",lat:-33.8,lng:151,c:"#ff9900",s:2,st:"activo",icon:"⚽",fecha:"10 MAR — NUEVO",det:"NUEVO: 5 jugadoras del equipo femenil iraní de fútbol pidieron asilo en Australia durante la Copa Asiática Femenina. Llaman a no bloquear su regreso. Australia confirmó que están bajo protección policial y seguros."},
];

// ── CONSTANTS ──────────────────────────────────────────────────────────────────
const STATUS_L={guerra:"EN GUERRA",atacado:"BAJO ATAQUE",activo:"EN CURSO",tension:"EN TENSIÓN",critico:"PUNTO CRÍTICO",alerta:"EN ALERTA",extremo:"EXTREMO"};
const MODES=["war","disease","climate","news"];
const TITLES={war:"⚔️  CONFLICTOS — DÍA 11 — 10 MAR 2026",disease:"🦠  BROTES GLOBALES — OMS — 10 MAR 2026",climate:"🌍  CLIMA + SISMOS USGS + NOAA",news:"📰  ECONOMÍA & NOTICIAS — 10 MAR 2026"};
const NEXT={war:"🦠 ENFERMEDADES",disease:"🌍 CLIMA",climate:"📰 ECONOMÍA",news:"⚔️ CONFLICTOS"};
const ACC={war:"#ff2020",disease:"#ff6600",climate:"#00aaff",news:"#ffcc00"};
const BG={war:"#040810",disease:"#04080a",climate:"#030c10",news:"#080804"};
const ISO_COL={
  war:{"840":"#ff2020","364":"#ff1a1a","376":"#ff1a1a","422":"#ff4444","804":"#ff8800","643":"#ff4400","586":"#ff5500","4":"#ff5500","784":"#ff8800","634":"#ff8800","48":"#ff8800","414":"#ff8800","682":"#ff9900","196":"#ff8800","724":"#ffcc00","156":"#ffcc00","356":"#ffaa44","484":"#88cc00","368":"#ff6600","400":"#ffcc00","792":"#ffcc00","818":"#ffcc00","250":"#4466ff","380":"#4466ff","528":"#4466ff","826":"#4466ff","300":"#4466ff"},
  disease:{"156":"#ff4400","180":"#ff6600","840":"#ffaa00","729":"#ff8800","76":"#ff6600","430":"#cc0000","356":"#ff4400","484":"#ff2200","710":"#ff8800","410":"#ffcc00","360":"#ff9900","608":"#ff7733"},
  climate:{"356":"#ff2200","840":"#aa44ff","50":"#6633ff","124":"#00ccff","36":"#ff3300","76":"#0055ff","392":"#ffaa00","360":"#ff9900","608":"#7733ff","724":"#ff5500","250":"#0066ff","152":"#ffbb00","484":"#8844ff"},
  news:{"840":"#ff6600","276":"#4488ff","250":"#4488ff","156":"#ffcc00","364":"#ff4444","643":"#ff7700","76":"#44ffaa","826":"#4466ff","724":"#ff6600","380":"#4466ff","392":"#ff3344","682":"#ffaa00","484":"#ffaa44","528":"#4466ff"},
};

function hurCol(k){k=parseInt(k)||0;if(k>=137)return"#ff0000";if(k>=113)return"#ff4400";if(k>=96)return"#ff8800";if(k>=64)return"#8844ff";return"#6666ff";}
function hurCat(k){k=parseInt(k)||0;if(k>=137)return"CAT5";if(k>=113)return"CAT4";if(k>=96)return"CAT3";if(k>=64)return"CAT1-2";return"T.TROP";}
function magCol(m){if(m>=7)return"#ff0000";if(m>=6)return"#ff4400";return"#ff8800";}

// ── REAL-TIME MOVEMENT HOOKS (NEW) ─────────────────────────────────────────────

// Hook para mover portaaviones automáticamente
function useMovingCarriers(initialCarriers) {
  const [carriers, setCarriers] = useState(initialCarriers);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCarriers(prev => prev.map(c => {
        if (!c.route || c.route.length < 2) return c;
        
        // Lógica simple de movimiento en bucle
        let progress = (c.progress || 0) + 0.002; // Velocidad
        if (progress > 1) progress = 0;
        
        // Interpolación entre puntos
        const from = c.route[0];
        const to = c.route[1];
        const lat = from.lat + (to.lat - from.lat) * progress;
        const lng = from.lng + (to.lng - from.lng) * progress;
        
        return { ...c, lat, lng, progress };
      }));
    }, 50); // 50ms para suavidad
    return () => clearInterval(interval);
  }, []);

  return carriers;
}

// Hook para simulación de ataques visuales
function useAttackSimulations(isWarMode) {
  const [attacks, setAttacks] = useState([]);

  useEffect(() => {
    if (!isWarMode) { setAttacks([]); return; }
    
    const launchAttack = () => {
      const targets = [
        { from: { lat: 32.4, lng: 53.7 }, to: { lat: 31.0, lng: 34.9 } }, // Iran -> Israel
        { from: { lat: 31.0, lng: 34.9 }, to: { lat: 32.4, lng: 53.7 } }, // Israel -> Iran
        { from: { lat: 22.8, lng: 61.5 }, to: { lat: 27.5, lng: 52.5 } }, // Carrier -> Iran
        { from: { lat: 32.4, lng: 53.7 }, to: { lat: 26.2, lng: 50.5 } }, // Iran -> Bahrain
      ];
      const target = targets[Math.floor(Math.random() * targets.length)];
      const id = Date.now();
      
      setAttacks(prev => [...prev, { ...target, id, progress: 0 }]);
      
      // Animar el ataque
      const animInterval = setInterval(() => {
        setAttacks(prev => prev.map(a => {
          if (a.id !== id) return a;
          const newProg = a.progress + 0.04;
          if (newProg >= 1) {
            clearInterval(animInterval);
            return null; // Eliminar
          }
          return { ...a, progress: newProg };
        }).filter(Boolean));
      }, 30);
    };

    // Lanzar ataques aleatorios
    const interval = setInterval(() => {
      if (Math.random() > 0.7) launchAttack(); // 30% probabilidad cada 3s
    }, 3000);
    
    return () => clearInterval(interval);
  }, [isWarMode]);

  return attacks;
}

// Hook para datos de aviones reales (OpenSky Network - GRATIS)
function useOpenSkyPlanes(isWarMode) {
  const [planes, setPlanes] = useState([]);
  
  useEffect(() => {
    if (!isWarMode) { setPlanes([]); return; }
    
    // Bounding box del Medio Oriente (Golfo Pérsico)
    const url = 'https://opensky-network.org/api/states/all?lamin=10&lomin=40&lamax=40&lomax=70';
    
    const fetchPlanes = async () => {
      try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.states) {
          const formatted = data.states.slice(0, 20).map(s => ({
            icao: s[0],
            callsign: s[1]?.trim() || 'N/A',
            lat: s[6],
            lng: s[5],
            alt: s[7],
            vel: s[9],
            hdg: s[10],
          })).filter(p => p.lat && p.lng);
          setPlanes(formatted);
        }
      } catch (e) { console.log("OpenSky error", e); }
    };
    
    fetchPlanes();
    const interval = setInterval(fetchPlanes, 60000); // Cada minuto
    return () => clearInterval(interval);
  }, [isWarMode]);

  return planes;
}

// ── GEOLOCATION HOOK — municipio en tiempo real ───────────────────────────────
function useGeoLocation() {
  const [loc, setLoc] = useState({ lat: TOLUCA_LAT, lng: TOLUCA_LNG, municipio: "Cargando...", pais: "MX", tz: "America/Mexico_City" });
  useEffect(() => {
    if (!navigator.geolocation) return;
    const onOk = async (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      let municipio = "Tu ubicación", pais = "MX", tz = "America/Mexico_City";
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`);
        const d = await r.json();
        const a = d.address || {};
        municipio = a.municipality || a.city_district || a.city || a.town || a.village || a.county || a.state_district || "Tu municipio";
        pais = a.country_code?.toUpperCase() || "MX";
        const tz_r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&timezone=auto&forecast_days=1&hourly=temperature_2m`);
        const tz_d = await tz_r.json();
        if (tz_d.timezone) tz = tz_d.timezone;
      } catch (e) {}
      setLoc({ lat, lng, municipio, pais, tz });
    };
    const onErr = () => {};
    navigator.geolocation.getCurrentPosition(onOk, onErr, { timeout: 8000 });
    const iv = setInterval(() => navigator.geolocation.getCurrentPosition(onOk, onErr, { timeout: 8000 }), 5 * 60 * 1000);
    return () => clearInterval(iv);
  }, []);
  return loc;
}

// ── WEATHER WIDGET — solo icono+temp, clic para hablar ───────────────────────
function WeatherWidget({ ac, loc }) {
  const [wx, setWx] = useState(null);
  const [rain, setRain] = useState(null);
  const [aqi, setAqi] = useState(null);

  useEffect(() => {
    if (!loc?.lat) return;
    const load = async () => {
      try {
        const [wxR, aqR] = await Promise.all([
          fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lng}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_gusts_10m,relative_humidity_2m,precipitation,rain,showers,snowfall&hourly=precipitation_probability,precipitation&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=${encodeURIComponent(loc.tz)}&forecast_days=2`),
          fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${loc.lat}&longitude=${loc.lng}&current=european_aqi,pm10,pm2_5&timezone=${encodeURIComponent(loc.tz)}`),
        ]);
        const d = await wxR.json();
        setWx(d);
        setRain(null);
        const hr = d.hourly;
        if (hr) {
          const nowH = new Date().getHours();
          for (let i = nowH; i < Math.min(hr.time.length, nowH + 18); i++) {
            if ((hr.precipitation_probability[i] || 0) >= 40) {
              const t = new Date(hr.time[i]);
              setRain({ hour: t.getHours(), prob: hr.precipitation_probability[i] });
              break;
            }
          }
        }
        try {
          const aq = await aqR.json();
          if (aq?.current) setAqi(aq.current);
        } catch (e) {}
      } catch (e) {}
    };
    load();
    const iv = setInterval(load, 10 * 60 * 1000);
    return () => clearInterval(iv);
  }, [loc?.lat, loc?.lng]);

  const handleClick = () => {
    if (!wx?.current) return;
    const c = wx.current;
    const temp = Math.round(c.temperature_2m);
    const feels = Math.round(c.apparent_temperature);
    const desc = wmoText(c.weather_code);
    const hum = c.relative_humidity_2m;
    const wind = Math.round(c.wind_speed_10m);
    const gusts = Math.round(c.wind_gusts_10m || 0);
    const code = c.weather_code;
    const tmax = wx.daily ? Math.round(wx.daily.temperature_2m_max[0]) : "?";
    const tmin = wx.daily ? Math.round(wx.daily.temperature_2m_min[0]) : "?";
    const rainPct = wx.daily ? wx.daily.precipitation_probability_max[0] : 0;
    const mun = loc?.municipio || "tu ubicación";
    const txt = `Clima actual en ${mun}: ${temp} grados, sensación térmica de ${feels}. ${desc}. Humedad: ${hum}%. Viento: ${wind} km/h. Máxima: ${tmax}, Mínima: ${tmin}. Probabilidad de lluvia: ${rainPct}%.`;
    speakText(txt, 1.05);
  };

  if (!wx?.current) return <div style={{ padding: "6px 10px", border: `1px solid ${ac}22`, borderRadius: "4px", background: "#0a0a0a", fontSize: "7px", color: "#333" }}>📡...</div>;

  const c = wx.current;
  const temp = Math.round(c.temperature_2m);
  const icon = wmoIcon(c.weather_code);

  return (
    <div onClick={handleClick} title="Toca para escuchar el clima" style={{ display: "flex", alignItems: "center", gap: "6px", padding: "5px 10px", border: `1px solid ${ac}22`, borderRadius: "4px", background: "#0a0a0a", cursor: "pointer" }}>
      <div style={{ fontSize: "16px" }}>{icon}</div>
      <div style={{ fontSize: "14px", fontWeight: "900", color: ac }}>{temp}°</div>
      <div style={{ fontSize: "6px", color: "#1a1a1a" }}>🔊</div>
    </div>
  );
}

// ── CLOCK — solo hora, clic para hablar ───────────────────────────────────────
function Clock({ ac, loc }) {
  const [t, setT] = useState(new Date());
  useEffect(() => { const iv = setInterval(() => setT(new Date()), 1000); return () => clearInterval(iv); }, []);

  const hh = String(t.getHours()).padStart(2, "0");
  const mm = String(t.getMinutes()).padStart(2, "0");
  const ss = String(t.getSeconds()).padStart(2, "0");

  const handleClick = () => {
    const now = new Date();
    const txt = `La hora actual es: ${now.getHours()} horas, ${now.getMinutes()} minutos.`;
    speakText(txt, 1.05);
  };

  return (
    <div onClick={handleClick} title="Toca para escuchar la hora" style={{ display: "flex", alignItems: "center", gap: "2px", padding: "5px 12px", border: `1px solid ${ac}22`, borderRadius: "4px", background: "#0a0a0a", cursor: "pointer" }}>
      <span style={{ fontSize: "24px", fontWeight: "900", color: ac }}>{hh}:{mm}</span>
      <span style={{ fontSize: "12px", color: `${ac}88` }}>{ss}</span>
    </div>
  );
}

// ── AUDIO ─────────────────────────────────────────────────────────────────────
function useAudio(){
  const ref=useRef(null);
  const getCtx=useCallback(()=>{if(!ref.current)ref.current=new(window.AudioContext||window.webkitAudioContext)();if(ref.current.state==="suspended")ref.current.resume();return ref.current;},[]);
  const playHover=useCallback((gid,mode)=>{},[getCtx]);
  const playUI=useCallback((type,mode)=>{},[getCtx]);
  return{playHover,playUI};
}

// ── UPDATE INFO TOOLTIP ───────────────────────────────────────────────────────
const UPDATE_INFO = "⟳ SISMOS USGS: cada 5 min  •  HURACANES NOAA: cada 30 min  •  TEMPERATURA: cada 10 min  •  AI NOTICIAS: cada 15 min  •  DATOS GEOPOLÍTICOS: actualizados manualmente por evento";

// ── MAIN APP ──────────────────────────────────────────────────────────────────
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
  const[aiHeadline,setAiHeadline]=useState("");
  const[aiLoading,setAiLoading]=useState(false);
  const[showUpdateInfo,setShowUpdateInfo]=useState(false);
  
  // --- HOOKS EN TIEMPO REAL (NUEVOS) ---
  const movingCarriers = useMovingCarriers(CARRIERS); // Portaaviones se mueven
  const attacks = useAttackSimulations(mode === "war"); // Líneas de ataque
  const planes = useOpenSkyPlanes(mode === "war"); // Aviones reales

  const loc=useGeoLocation();
  const{playHover,playUI}=useAudio();
  const ac=ACC[mode],bg=BG[mode],isoM=ISO_COL[mode]||{};
  const modeCountryData=ALL_COUNTRY_DATA[mode]||{};

  const clmPoints=[...BASE_CLIMATE,...quakes.map(q=>({id:`q_${q.id}`,name:`SISMO M${q.mag.toFixed(1)}\n${q.place.split(",")[0].substring(0,12).toUpperCase()}`,lat:q.lat,lng:q.lng,c:magCol(q.mag),s:Math.min(5,Math.round(q.mag-3)),st:"extremo",icon:"🌋",pulse:q.mag>=6,fecha:new Date(q.time).toLocaleDateString("es-MX",{day:"2-digit",month:"short"}).toUpperCase(),det:`Sismo M${q.mag.toFixed(1)} en ${q.place}. Profundidad: ${q.depth}km.`})),...hurricanes.map(h=>{const pos=hurPos[h.id]||{lat:h.lat,lng:h.lng};return{id:`hur_${h.id}`,name:`🌀 ${h.name}\n${hurCat(h.kts)}`,lat:pos.lat,lng:pos.lng,c:hurCol(h.kts),s:5,st:"extremo",icon:"🌀",pulse:true,fecha:"NOAA LIVE",det:`Huracán ${h.name} — ${hurCat(h.kts)}. ${Math.round(h.kts*1.852)} km/h.`};})];

  const DATA_MAP={war:BASE_WAR,disease:BASE_DISEASE,climate:clmPoints,news:BASE_NEWS};
  const STATS_MAP={
    war:[{l:"MUERTOS IRÁN",v:"1,200+",c:"#ff1a1a"},{l:"SOLDADOS USA",v:"7 ✝",c:"#ff4444"},{l:"OBJETIVOS",v:"5,000+",c:"#ff6600"},{l:"PORTAAVIONES",v:"5 🚢",c:"#4488ff"}],
    disease:[{l:"SARAMPIÓN MX",v:"9,074",c:"#ff2200"},{l:"MPOX",v:"100K+",c:"#ff6600"},{l:"H5N1",v:"⚠️PANDEMIA",c:"#ffaa00"}],
    climate:[{l:"HURACANES",v:"NOAA LIVE",c:"#8844ff"},{l:"SISMOS",v:"USGS LIVE",c:"#ffaa00"}],
    news:[{l:"BRENT",v:"~$90",c:"#ffaa00"},{l:"BOLSAS",v:"↑REBOTE",c:"#44ff88"}],
  };
  const pts=DATA_MAP[mode]||[],sts=STATS_MAP[mode];

  useEffect(()=>{let done=false;(async()=>{try{const[topo,world]=await Promise.all([import("https://cdn.skypack.dev/topojson-client@3"),fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then(r=>r.json())]);if(done)return;const p=d3.geoNaturalEarth1().scale(150).translate([W/2,H/2+15]);const path=d3.geoPath(p);const features=topo.feature(world,world.objects.countries).features;const paths=features.map(f=>({id:String(f.id),d:path(f)||""}));setProj(()=>p);setGeo({paths,borders:path(topo.mesh(world,world.objects.countries,(a,b)=>a!==b)),sphere:path({type:"Sphere"})});}catch(e){}})();return()=>{done=true;};},[]);
  
  const fetchQuakes=useCallback(async()=>{try{const r=await fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/5.0_day.geojson");const d=await r.json();const now=Date.now();setQuakes(d.features.filter(f=>f.properties.mag>=5.5&&(now-f.properties.time)<48*3600*1000).map(f=>({id:f.id,mag:f.properties.mag,place:f.properties.place||"Océano",lat:f.geometry.coordinates[1],lng:f.geometry.coordinates[0],depth:Math.round(f.geometry.coordinates[2]),time:f.properties.time})));}catch(e){}},[]);
  useEffect(()=>{fetchQuakes();const iv=setInterval(fetchQuakes,5*60*1000);return()=>clearInterval(iv);},[fetchQuakes]);
  
  const fetchHurricanes=useCallback(async()=>{try{const r=await fetch("https://www.nhc.noaa.gov/CurrentStorms.json");const d=await r.json();setNoaaChecked(true);if(d.activeStorms?.length>0){const a=d.activeStorms.map(s=>({id:s.id,name:s.name||"Storm",kts:parseInt(s.intensity)||65,lat:parseFloat(s.latitudeNumeric)||20,lng:parseFloat(s.longitudeNumeric)||-85,dir:parseInt(s.movementDir)||315,spd:parseInt(s.movementSpeed)||12}));setHurricanes(a);setHurPos(Object.fromEntries(a.map(h=>[h.id,{lat:h.lat,lng:h.lng}])));}else setHurricanes([]);}catch(e){setNoaaChecked(true);setHurricanes([]);}},[]);
  useEffect(()=>{fetchHurricanes();const iv=setInterval(fetchHurricanes,30*60*1000);return()=>clearInterval(iv);},[fetchHurricanes]);
  
  useEffect(()=>{if(!hurricanes.length)return;const iv=setInterval(()=>{setHurPos(prev=>{const n={...prev};hurricanes.forEach(h=>{const p=prev[h.id]||{lat:h.lat,lng:h.lng};const rad=(h.dir*Math.PI)/180;n[h.id]={lat:p.lat+Math.cos(rad)*(h.spd/111)*(30/3600),lng:p.lng+Math.sin(rad)*(h.spd/111)*(30/3600)};});return n;});},30000);return()=>clearInterval(iv);},[hurricanes]);
  
  useEffect(()=>{const spots=[{k:"india",lat:26.8,lng:80.9},{k:"mexico",lat:19.4,lng:-99.1}];const go=async()=>{const obj={};await Promise.all(spots.map(async({k,lat,lng})=>{try{const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m&forecast_days=1&timezone=auto`);const d=await r.json();if(d.current)obj[k]=d.current;}catch(e){}}));setWlive(obj);};go();const iv=setInterval(go,10*60*1000);return()=>clearInterval(iv);},[]);
  
  const fetchAI=useCallback(async()=>{setAiLoading(true);try{const qs={war:"Noticia urgente guerra Irán EE.UU. hoy en 15 palabras.",news:"Noticia económica global importante hoy en 15 palabras.",disease:"Noticia brote enfermedad crítico hoy en 15 palabras.",climate:"Noticia clima severo hoy en 15 palabras."};const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:80,messages:[{role:"user",content:qs[mode]||qs.war}]})});const data=await r.json();const txt=data.content?.filter(b=>b.type==="text").map(b=>b.text).join("").trim();if(txt)setAiHeadline(txt.slice(0,180));}catch(e){}setAiLoading(false);},[mode]);
  useEffect(()=>{fetchAI();const iv=setInterval(fetchAI,15*60*1000);return()=>clearInterval(iv);},[mode]);
  
  useEffect(()=>{window.speechSynthesis.getVoices();return()=>stopSpeech();},[]);
  
  const xy=useCallback((lat,lng)=>{if(!proj)return null;return proj([lng,lat]);},[proj]);
  const cycleMode=()=>{stopSpeech();const idx=MODES.indexOf(mode);const nm=MODES[(idx+1)%MODES.length];setMode(nm);setSel(null);setTimeout(()=>speakText(MODE_VOICE[nm],1.0),350);};
  const doPoint=(pt)=>{setSel(pt);if(pt.det)speakText(pt.det);};

  const connLines=[];
  if(mode==="war")BASE_WAR.forEach(p=>(p.conn||[]).forEach(tid=>{const tgt=BASE_WAR.find(x=>x.id===tid);if(tgt){const a=xy(p.lat,p.lng),b=xy(tgt.lat,tgt.lng);if(a&&b)connLines.push({x1:a[0],y1:a[1],x2:b[0],y2:b[1],col:p.c,key:`${p.id}-${tid}`});}}));

  const mxAlert = getMexicoAlert(mode, hurricanes, wlive, quakes);

  return(
    <div style={{background:bg,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",padding:"10px 8px 14px",fontFamily:"'Courier New',monospace",color:"#fff",transition:"background 0.5s",userSelect:"none"}}>
      {/* TOP */}
      <div style={{width:"100%",maxWidth:"980px",marginBottom:"7px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"8px"}}>
        <div style={{flex:1,minWidth:"200px"}}>
          <div style={{fontSize:"8px",letterSpacing:"4px",color:ac,animation:"blink 1s steps(1) infinite"}}>⬤ {aiLoading?"AI...":"TIEMPO REAL"} • 🔊 VOZ • USGS+NOAA+AI</div>
          <h1 style={{fontSize:"clamp(10px,1.7vw,15px)",fontWeight:"900",letterSpacing:"2px",color:"#fff",margin:"2px 0 0",textShadow:`0 0 20px ${ac}`}}>{TITLES[mode]}</h1>
          {aiHeadline&&<div style={{marginTop:"4px",fontSize:"8px",color:ac,maxWidth:"500px",lineHeight:"1.4"}}>🤖 {aiHeadline}</div>}
        </div>
        <div style={{display:"flex",gap:"8px",alignItems:"flex-start",flexWrap:"wrap"}}>
          <Clock ac={ac} loc={loc}/>
          <WeatherWidget ac={ac} loc={loc}/>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:"5px",alignItems:"flex-end"}}>
          <button onClick={cycleMode} style={{padding:"7px 13px",background:"transparent",border:`1px solid ${ac}`,borderRadius:"3px",color:ac,fontFamily:"'Courier New',monospace",fontSize:"10px",letterSpacing:"2px",cursor:"pointer",fontWeight:"bold"}}>{NEXT[mode]} →</button>
        </div>
      </div>

      {/* MAP */}
      <div style={{width:"100%",maxWidth:"980px",position:"relative",border:`1px solid ${ac}14`,borderRadius:"6px",overflow:"hidden",boxShadow:`0 0 40px ${ac}10`,background:"#020610"}}>
        {!geo&&(<div style={{height:"440px",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{fontSize:"22px",animation:"spin 1.5s linear infinite"}}>🌍</div></div>)}
        {geo&&(<svg viewBox={`0 0 ${W} ${H}`} style={{display:"block",width:"100%"}}>
          <rect width={W} height={H} fill="#020814"/>
          {geo.sphere&&<path d={geo.sphere} fill="#020a14" stroke={ac} strokeWidth="0.3" strokeOpacity="0.1"/>}
          {geo.paths.map(({id,d})=>{const col=isoM[id];const hasCE=!!modeCountryData[id];return(<path key={id} d={d} fill={col?col+"1c":"#080e08"} stroke={col?col:"#0c1c0c"} strokeWidth={col?0.55:0.18} style={{cursor:hasCE?"pointer":"default"}}/>);})}
          {geo.borders&&<path d={geo.borders} fill="none" stroke="#0c1e0c" strokeWidth="0.18"/>}
          
          {/* Líneas de conexión animadas */}
          {connLines.map(l=>(<g key={l.key}><line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={l.col} strokeWidth="0.6" strokeOpacity="0.35" strokeDasharray="4,4"><animate attributeName="stroke-dashoffset" from="0" to="-16" dur="0.8s" repeatCount="indefinite"/></line></g>))}
          
          {/* ATAQUES ANIMADOS (NUEVO) */}
          {attacks.map(atk => {
             const from = xy(atk.from.lat, atk.from.lng);
             const to = xy(atk.to.lat, atk.to.lng);
             if(!from || !to) return null;
             const cx = from[0] + (to[0] - from[0]) * atk.progress;
             const cy = from[1] + (to[1] - from[1]) * atk.progress;
             return (
               <g key={atk.id}>
                 <circle cx={cx} cy={cy} r="2" fill="#ff0000" opacity="0.8">
                   <animate attributeName="r" values="2;4;2" dur="0.2s" repeatCount="indefinite"/>
                 </circle>
                 <line x1={from[0]} y1={from[1]} x2={cx} y2={cy} stroke="#ff4400" strokeWidth="1" strokeOpacity="0.5"/>
               </g>
             )
          })}
          
          {/* AVIONES EN TIEMPO REAL (NUEVO) */}
          {planes.map(p => {
             const pos = xy(p.lat, p.lng);
             if(!pos) return null;
             return (
               <g key={p.icao}>
                 <circle cx={pos[0]} cy={pos[1]} r="1.5" fill="#00ff00" opacity="0.7"/>
                 <text x={pos[0]} y={pos[1]-3} fontSize="3" fill="#00ff00" textAnchor="middle">{p.callsign}</text>
               </g>
             )
          })}
          
          {/* PORTAAVIONES CON MOVIMIENTO (MODIFICADO) */}
          {mode==="war"&&movingCarriers.map(cv=>{
            const p=xy(cv.lat,cv.lng);
            if(!p)return null;
            const[cx,cy]=p,cc=cv.pais==="FRANCIA"?"#4466ff":"#4488ff";
            return(
              <g key={cv.id} onClick={()=>doPoint({id:cv.id,name:`${cv.flag} ${cv.name}`,lat:cv.lat,lng:cv.lng,c:cc,s:5,st:"activo",fecha:"POSICIÓN LIVE",det:`${cv.det} Ubicación actualizada.`})} style={{cursor:"pointer"}}>
                <ellipse cx={cx} cy={cy} rx={14} ry={3.2} fill="none" stroke={cc} strokeWidth="0.4" strokeOpacity="0.2" transform={`rotate(-22,${cx},${cy})`}>
                  <animate attributeName="rx" values="14;20;14" dur="3s" repeatCount="indefinite"/>
                </ellipse>
                <rect x={cx-10} y={cy-1.8} width={20} height={4} fill={cc} rx="2" opacity="0.92"/>
                <rect x={cx-6} y={cy-4} width={10} height={2.4} fill={cc} rx="0.8" opacity="0.88"/>
                <text x={cx} y={cy-9} textAnchor="middle" fill={cc} fontSize="5.5" fontFamily="'Courier New',monospace" fontWeight="bold">{cv.flag} {cv.name}</text>
              </g>
            );
          })}
          
          {/* HURACANES ANIMADOS */}
          {mode==="climate"&&hurricanes.map(h=>{
            const pos=hurPos[h.id]||{lat:h.lat,lng:h.lng};
            const ph=xy(pos.lat,pos.lng);
            if(!ph)return null;
            const[hx,hy]=ph,hc=hurCol(h.kts);
            return(
              <g key={`h-${h.id}`} onClick={()=>doPoint({id:`hur_${h.id}`,name:`🌀 ${h.name}`,lat:pos.lat,lng:pos.lng,c:hc,s:5,st:"extremo",icon:"🌀",fecha:"NOAA LIVE",det:`Huracán ${h.name} — ${hurCat(h.kts)}.`})} style={{cursor:"pointer"}}>
                <circle cx={hx} cy={hy} r="5" fill={hc} opacity="0.75"/>
                <text x={hx} y={hy-11} textAnchor="middle" fill={hc} fontSize="6.5" fontWeight="bold">{h.name}</text>
              </g>
            );
          })}
          
          {/* PUNTOS DE INTERÉS */}
          {pts.filter(pt=>pt.lat&&pt.lng).map(pt=>{
            const p=xy(pt.lat,pt.lng);
            if(!p)return null;
            const[px,py]=p,isSel=sel?.id===pt.id,r=isSel?9:6.5,ptc=pt.c||"#ff4400";
            return(
              <g key={pt.id} onClick={()=>doPoint(pt)} style={{cursor:"pointer"}}>
                {pt.pulse&&<circle cx={px} cy={py} r={r} fill="none" stroke={ptc} strokeWidth="0.65" opacity="0"><animate attributeName="r" from={r} to={r+26} dur="1.8s" repeatCount="indefinite"/><animate attributeName="opacity" from="0.55" to="0" dur="1.8s" repeatCount="indefinite"/></circle>}
                <circle cx={px} cy={py} r={r} fill={ptc} style={{filter:`drop-shadow(0 0 ${isSel?13:6}px ${ptc})`}}/>
                {pt.icon&&<text x={px} y={py+2.5} textAnchor="middle" fontSize="5.5">{pt.icon}</text>}
                {(pt.name||"").split("\n").map((ln,li)=>(<text key={li} x={px} y={py-r-2.5-((pt.name||"").split("\n").length-1-li)*8} textAnchor="middle" fill={ptc} fontSize={isSel?8:6.5} fontWeight="bold">{ln}</text>))}
              </g>
            );
          })}
        </svg>)}
      </div>

      {/* INFO PANEL */}
      {sel&&(<div style={{marginTop:"9px",padding:"12px 15px",background:bg,border:`1px solid ${sel.c||"#ff4400"}`,borderRadius:"4px",width:"100%",maxWidth:"980px",boxShadow:`0 0 28px ${(sel.c||"#ff4400")}22`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
            <span style={{fontSize:"13px",fontWeight:"900",letterSpacing:"2px",color:sel.c||"#ff4400"}}>{(sel.name||"").replace(/\n/g," ")}</span>
            <span style={{fontSize:"7px",background:sel.c||"#ff4400",color:"#000",padding:"2px 7px",borderRadius:"2px"}}>{STATUS_L[sel.st]||"ACTIVO"}</span>
            <span style={{fontSize:"7px",color:ac,animation:"blink 1s steps(1) infinite"}}>🔊</span>
          </div>
          <button onClick={()=>{setSel(null);stopSpeech();}} style={{background:"none",border:"none",color:"#444",cursor:"pointer",fontSize:"15px"}}>✕</button>
        </div>
        <div style={{marginTop:"8px",fontSize:"11px",color:"#ccc",lineHeight:"1.85",borderTop:`1px solid ${(sel.c||"#ff4400")}15`,paddingTop:"8px"}}>{sel.det||""}</div>
      </div>)}

      {/* STATS */}
      <div style={{marginTop:"10px",display:"flex",gap:"5px",flexWrap:"wrap",justifyContent:"center",width:"100%",maxWidth:"980px"}}>
        {sts.map((st,i)=>(
          <button key={st.l} style={{background:bg,border:`1px solid ${st.c}22`,borderRadius:"4px",padding:"7px 9px",textAlign:"center",minWidth:"88px",cursor:"pointer"}}>
            <div style={{fontSize:"13px",fontWeight:"900",color:st.c}}>{st.v}</div>
            <div style={{fontSize:"6px",color:"#2d2d2d"}}>{st.l}</div>
          </button>
        ))}
      </div>

      <div style={{marginTop:"6px",fontSize:"6.5px",color:"#111",letterSpacing:"2px",textAlign:"center"}}>USGS+NOAA+Open-Meteo+Claude AI — TIEMPO REAL — v9.2 MOVEMENT</div>
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
```
