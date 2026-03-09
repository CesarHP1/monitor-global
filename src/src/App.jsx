// @ts-nocheck
// MONITOR GLOBAL v9 — voz consistente, termómetro Toluca, México prioritario en todas las vistas
import { useState, useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";

const W = 960, H = 480;
const TOLUCA_LAT = 19.2826, TOLUCA_LNG = -99.6557;

// ── SPEECH ENGINE v2 — voz única por sesión, sin cortes ───────────────────────
let _speechQueue = [];
let _isSpeaking = false;
let _sessionVoice = null; // UNA voz para toda la sesión
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
    _sessionVoice = pickVoice(); // ← elige UNA voz para TODA la locución
    const clean = txt
      .replace(/[🔴🟠🟡🟢⚠️☣️🦟🌋🌀🌊🔥🧊☀️🌪️❄️🛢️🏦🗳️📊📉₿🌐🛡️📰☠🚫🚢😢🇺🇸🇮🇷🇮🇱🇱🇧🇺🇦🇷🇺🇵🇰🇦🇫🇸🇦🇨🇾🇪🇸🇨🇳🇮🇳🇲🇽🇫🇷🇮🇹🇬🇧🇳🇱🇬🇷🇩🇪🇧🇷🇯🇵🇦🇺🇨🇦🇰🇷🇵🇭🇮🇩🇱🇷🇸🇩🇨🇩🇨🇱🇧🇩]/gu, "")
      .replace(/\n/g, ", ").replace(/\s+/g, " ").trim();
    // Divide en frases SIN cambiar de voz entre ellas
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
    if (_sessionVoice) u.voice = _sessionVoice; // ← MISMA voz siempre
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
  war: "Conflictos globales. Día ocho de la guerra entre Estados Unidos e Irán. Nueva fase: ataques a refinerías petroleras. Mojtaba Jamenei es el nuevo Líder Supremo. Todo el Golfo Pérsico bajo ataque con drones y misiles.",
  disease: "Modo enfermedades. Hay un brote activo de sarampión en México, en Ciudad de México, Jalisco y Nuevo León. El H cinco N uno está en alerta pandémica en Estados Unidos. Hay siete emergencias sanitarias activas en el mundo.",
  climate: "Modo clima. Frente frío 39 activo en México con posible nieve en zonas altas. Tornados en Estados Unidos. Ola de calor extrema en India. Los sismos de la USGS y los huracanes de la NOAA se muestran en tiempo real.",
  news: "Modo economía. Nueva fase de la guerra: Israel ataca refinerías iraníes. El petróleo subió veintisiete por ciento en una semana. Todo el Golfo Pérsico bajo ataque. China pide un cese inmediato de la guerra.",
};

// ── MEXICO ALERTS — por modo ──────────────────────────────────────────────────
function getMexicoAlert(mode, hurricanes, wlive, quakes) {
  if (mode === "war") return {
    icon: "🇲🇽",
    title: "IMPACTO EN MÉXICO — DÍA 8",
    color: "#ff6600",
    lines: [
      "⛽ Gasolina subió ~18% por Ormuz cerrado y petróleo a $91.",
      "💱 Peso devaluado frente al dólar por incertidumbre global.",
      "📦 Aranceles Trump del 35% en negociación — exportaciones en riesgo.",
      "🔴 Sarampión activo simultáneamente: doble presión sanitaria.",
    ],
    accion: "Revisa precios de combustible. Considera viajar menos o usar transporte público.",
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
    const hasFrio = true; // Frente frío 39 activo hoy
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
    title: "IMPACTO ECONÓMICO MÉXICO — MAR 2026",
    color: "#ffcc00",
    lines: [
      "🛢️ Gasolina más cara por petróleo a $91/barril — Ormuz.",
      "💵 Tipo de cambio presionado: dólar más caro por la incertidumbre.",
      "📊 Aranceles Trump del 35% a México en negociación — manufactureras en espera.",
      "📉 FMI alerta que México podría entrar en recesión en Q3 2026.",
    ],
    accion: "Evita cambiar dólares en este momento. Si exportas, cubre tu tipo de cambio.",
  };
  return null;
}

// ── ALL COUNTRY DATA ──────────────────────────────────────────────────────────
const ALL_COUNTRY_DATA = {
  war: {
    "840":{name:"🇺🇸 EE.UU.",fecha:"DÍA 8 — 8 MAR",c:"#ff2020",det:"EE.UU. en guerra activa contra Irán, día 8. Trump: Irán será golpeado muy duro hoy. Ataques a refinerías y petroleras — nueva fase. Séptimo soldado americano muerto. $891 millones por día sin presupuestar. Aranceles a Europa el 15 de marzo."},
    "364":{name:"🇮🇷 IRÁN",fecha:"DÍA 8 — 8 MAR",c:"#ff1a1a",det:"Mojtaba Jamenei confirmado oficialmente como nuevo Líder Supremo el 8 de marzo. Shahran en llamas. IRGC aeroespacial destruido. Larijani: Trump pagará el precio. Pezeshkian prometió parar ataques al Golfo, pero continuaron horas después."},
    "376":{name:"🇮🇱 ISRAEL",fecha:"DÍA 8 — 8 MAR",c:"#ff1a1a",det:"Nueva fase: ataques a refinerías e instalaciones petroleras iraníes. IRGC aeroespacial destruido. 16 aviones militares destruidos en Mehrabad. Misiles desde Irán impactaron en Tel Aviv este domingo."},
    "422":{name:"🇱🇧 LÍBANO",fecha:"DÍA 8",c:"#ff4444",det:"300 muertos en Líbano. Hotel Ramada en zona costera Raouche destruido. 4 muertos. Primera vez Israel ataca esa zona turística. Hezbollah sigue disparando cohetes hacia el norte de Israel."},
    "804":{name:"🇺🇦 UCRANIA",fecha:"EN CURSO",c:"#ff8800",det:"Guerra con Rusia año 5. Ucrania ayuda a EE.UU. con drones Shahed iraníes. Zelenski declaró que esto ya es la Tercera Guerra Mundial."},
    "643":{name:"🇷🇺 RUSIA ⚠️",fecha:"8 MAR",c:"#ff4400",det:"Rusia dando inteligencia a Irán. Putin llamó a Pezeshkian. Kremlin reporta aumento significativo en demanda de energía rusa por la guerra. Canciller iraní confirmó ayuda rusa en muchas direcciones."},
    "586":{name:"🇵🇰 PAKISTÁN",fecha:"DÍA 8",c:"#ff5500",det:"Operación Ghazab Lil Haq, día 8. 481 afganos muertos. Bagram destruida. Potencia nuclear en guerra activa. Teme que el petróleo caro colapse su economía."},
    "4":  {name:"🇦🇫 AFGANISTÁN",fecha:"DÍA 8",c:"#ff5500",det:"Bajo bombardeo pakistaní día 8. 21.9 millones necesitan ayuda. Taliban pide diálogo. Pakistán continúa los ataques."},
    "682":{name:"🇸🇦 ARABIA SAUDITA",fecha:"8 MAR — NUEVO",c:"#ff9900",det:"NUEVO 8 MAR: 2 muertos y 12 heridos tras proyectil iraní en instalación residencial. Primeras muertes civiles en Arabia Saudita. 16 drones cerca del campo petrolero Shaybah interceptados."},
    "414":{name:"🇰🇼 KUWAIT",fecha:"8 MAR — NUEVO",c:"#ff8800",det:"NUEVO 8 MAR: Drones iraníes atacaron almacenamiento de combustible del Aeropuerto Internacional. Operaciones afectadas. Segundo ataque a Kuwait en la guerra."},
    "634":{name:"🇶🇦 QATAR",fecha:"8 MAR",c:"#ff8800",det:"Qatar reportó fuertes explosiones. Base Al Udeid, la mayor de EE.UU. en Medio Oriente, bajo amenaza constante. Sistema THAAD dañado en Qatar durante la guerra."},
    "784":{name:"🇦🇪 EMIRATOS",fecha:"8 MAR",c:"#ff8800",det:"Drones iraníes en Abu Dhabi y aeropuerto de Dubai. Pezeshkian prometió parar, pero los ataques continuaron horas después. Dubai bajo alerta máxima."},
    "48": {name:"🇧🇭 BAHREIN",fecha:"8 MAR",c:"#ff8800",det:"Planta desalinizadora dañada por drones iraníes. Bahrein reportó daños materiales. Irán acusó a EE.UU. de destruir su planta en Qeshm."},
    "196":{name:"🇨🇾 CHIPRE ⚠️",fecha:"4 MAR",c:"#ff8800",det:"RAF Akrotiri fue el primer suelo OTAN atacado por Irán. Francia, Italia, España, Países Bajos y Grecia enviaron buques. Cinco países defendiendo Chipre."},
    "368":{name:"🇮🇶 IRAQ",fecha:"8 MAR",c:"#ff6600",det:"Drone iraní golpeó hotel Erbil Arjaan en Kurdistan iraquí. Embajada de EE.UU. advirtió el ataque. Milicias pro-iraníes activas. Parlamento iraquí exige retirada de tropas americanas."},
    "724":{name:"🇪🇸 ESPAÑA",fecha:"4 MAR",c:"#ffcc00",det:"España envió fragata Cristóbal Colón al Mediterráneo pero rechaza cooperación ofensiva. Aranceles Trump 25% desde el 15 de marzo. Único miembro OTAN que rechazó el 5% en defensa."},
    "156":{name:"🇨🇳 CHINA",fecha:"8 MAR",c:"#ffcc00",det:"Wang Yi exigió cese inmediato de la guerra. Dijo que las llamas no deben extenderse. Xi Jinping prepara reunión con Trump en Beijing para negociar."},
    "356":{name:"🇮🇳 INDIA",fecha:"8 MAR",c:"#ffaa44",det:"EE.UU. dio a India exención de 30 días para seguir comprando petróleo iraní. 18 mil ciudadanos indios evacuando desde Irán. Intenta mantenerse neutral."},
    "792":{name:"🇹🇷 TURQUÍA",fecha:"4 MAR",c:"#ffcc00",det:"Turquía interceptó misil iraní el 4 de marzo. Primer ataque a miembro OTAN. Erdogan convocó el Artículo 4. Mediador activo entre Irán y Occidente."},
    "818":{name:"🇪🇬 EGIPTO",fecha:"EN CURSO",c:"#ffcc00",det:"Canal de Suez parcialmente bloqueado. Bajo presión interna pro-palestina. Pérdidas millonarias por caída del turismo."},
    "250":{name:"🇫🇷 FRANCIA",fecha:"5 MAR",c:"#4466ff",det:"Charles de Gaulle en Mediterráneo oriental. Macron condenó ataques a civiles. Canciller iraní advirtió que Europa puede ser objetivo legítimo."},
    "380":{name:"🇮🇹 ITALIA",fecha:"5 MAR",c:"#4466ff",det:"Fragatas enviadas para defender Chipre. Bases en Sicilia dando apoyo logístico. Bajo amenaza iraní de ser objetivo legítimo."},
    "528":{name:"🇳🇱 PAÍSES BAJOS",fecha:"5 MAR",c:"#4466ff",det:"Fragata enviada al Mediterráneo. Aranceles Trump 25% más amenaza iraní de objetivo legítimo si Europa se une al conflicto."},
    "826":{name:"🇬🇧 REINO UNIDO",fecha:"5 MAR",c:"#4466ff",det:"Autorizó uso de bases en Chipre. Akrotiri atacada por drones. Misma advertencia iraní sobre Europa como objetivo legítimo."},
    "300":{name:"🇬🇷 GRECIA",fecha:"5 MAR",c:"#4466ff",det:"Buques de guerra al Mediterráneo. Colabora en defensa aérea de Chipre. Preocupada por desestabilización del Mediterráneo oriental."},
    "484":{name:"🇲🇽 MÉXICO",fecha:"EN CURSO",c:"#88cc00",det:"México rechaza participar en la guerra. Gasolina +18% por Ormuz. Peso devaluado. Trump amenaza aranceles 35%. Sarampión activo. Triple crisis: económica, sanitaria y diplomática."},
  },
  disease: {
    "484":{name:"🇲🇽 MÉXICO 🔴",fecha:"MAR 2026",c:"#ff2200",det:"Brote activo de sarampión, marzo 2026. Casos en CDMX, Jalisco y Nuevo León. Vinculado a Texas. Cobertura de vacunación bajó post-COVID. SSA emitió alerta nacional. Llama al 800-00-44800 para vacunarte gratis."},
    "840":{name:"🇺🇸 EE.UU.",fecha:"EN CURSO",c:"#ffaa00",det:"H5N1 activo en ganado bovino en 47 estados. Primera transmisión humana confirmada 2026. OMS en alerta pandémica máxima. Vacuna en fase 3. Sarampión también vinculado con México."},
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
    "840":{name:"🇺🇸 EE.UU.",fecha:"8 MAR 2026",c:"#ff6600",det:"Día 8: Trump dice la guerra continúa hasta rendición incondicional de Irán. Nueva fase: ataques a refinerías. Séptimo soldado muerto. 891 millones de dólares por día. Aranceles 25% a Europa el 15 de marzo."},
    "364":{name:"🇮🇷 IRÁN",fecha:"8 MAR",c:"#ff4444",det:"Mojtaba Jamenei confirmado nuevo Líder Supremo. Refinerías en llamas. Larijani: Trump pagará el precio. Canciller confirmó ayuda rusa en muchas direcciones. Economía en colapso."},
    "682":{name:"🇸🇦 ARABIA SAUDITA",fecha:"8 MAR — NUEVO",c:"#ffaa00",det:"NUEVO 8 MAR: Primeras muertes en Arabia Saudita. 2 muertos, 12 heridos por proyectil iraní. OPEP en reunión de emergencia. Petróleo a 91 dólares con Ormuz técnicamente abierto pero sin tráfico."},
    "276":{name:"🇩🇪 ALEMANIA",fecha:"23 FEB — EN VIGOR",c:"#4488ff",det:"CDU de Merz ganó con 29%. AfD 20% histórico. Merz negocia coalición. Alemania rechaza aranceles Trump del 25% que entran el 15 de marzo."},
    "250":{name:"🇫🇷 FRANCIA",fecha:"MAY 2026",c:"#4488ff",det:"Elecciones anticipadas en mayo. Le Pen lidera con 34%. Macron fuera. Francia bajo aranceles Trump 25% y amenaza iraní de ser objetivo si se une al conflicto."},
    "156":{name:"🇨🇳 CHINA",fecha:"8 MAR",c:"#ffcc00",det:"Wang Yi exige cese inmediato. Xi Jinping prepara reunión con Trump. Aranceles 145%. Menor crecimiento en 30 años: 3.8% del PIB."},
    "643":{name:"🇷🇺 RUSIA",fecha:"8 MAR",c:"#ff7700",det:"Rusia: aumento significativo en demanda de su energía por la guerra. Putin llamó a Pezeshkian. Dando inteligencia a Irán confirmado."},
    "76": {name:"🇧🇷 BRASIL",fecha:"EN CURSO",c:"#44ffaa",det:"Brasil intenta mediar. Exportaciones de petróleo y soja aumentan. Real subió 4%. Lula propuso reunión de emergencia del G20."},
    "826":{name:"🇬🇧 REINO UNIDO",fecha:"MAR 2026",c:"#4466ff",det:"Aranceles Trump 25%. Libra perdió 3.5%. Starmer busca acuerdo bilateral con EE.UU. Bases en Chipre usadas y atacadas."},
    "724":{name:"🇪🇸 ESPAÑA",fecha:"MAR 2026",c:"#ff6600",det:"Ibex 35 cayó 8%. Aranceles Trump 25%. Prepara represalias con la UE. Fragata en Mediterráneo. Rechazó cooperación militar ofensiva."},
    "392":{name:"🇯🇵 JAPÓN",fecha:"MAR 2026",c:"#ff3344",det:"Tokio cayó 9.1%, peor desde 2020. Importa 90% de su petróleo del Golfo. Ormuz peligroso. Sony y Toyota en alerta."},
    "484":{name:"🇲🇽 MÉXICO",fecha:"MAR 2026",c:"#ffaa44",det:"Triple crisis: gasolina cara por Ormuz, peso devaluado, aranceles Trump 35% en negociación. Sarampión activo. FMI alerta recesión Q3. Exportaciones industriales en riesgo."},
    "528":{name:"🇳🇱 PAÍSES BAJOS",fecha:"MAR 2026",c:"#4466ff",det:"Aranceles Trump 25%. Puerto Rotterdam cayó 12% en tráfico. Economía dependiente del comercio. Shell reporta pérdidas."},
    "380":{name:"🇮🇹 ITALIA",fecha:"MAR 2026",c:"#4466ff",det:"Aranceles Trump 25%. Meloni busca excepción por apoyo político a Trump. Fiat y Ferrari en incertidumbre."},
  },
};

// ── POINTS ────────────────────────────────────────────────────────────────────
const BASE_WAR=[
  {id:"usa",name:"EE.UU.",lat:38,lng:-97,c:"#ff2020",s:5,st:"guerra",conn:["iran"],fecha:"DÍA 8",det:"EE.UU. atacando refinerías iraníes — nueva fase. Día 8. Trump: Irán será golpeado muy duro. Séptimo soldado muerto."},
  {id:"iran",name:"IRÁN",lat:32.4,lng:53.7,c:"#ff1a1a",s:5,st:"guerra",conn:["israel","saudi"],fecha:"DÍA 8",det:"Mojtaba Jamenei nuevo Líder Supremo confirmado. Shahran en llamas. IRGC aeroespacial destruido. Larijani: Trump pagará el precio."},
  {id:"israel",name:"ISRAEL",lat:31,lng:34.9,c:"#ff1a1a",s:5,st:"guerra",conn:["lebanon"],fecha:"DÍA 8",det:"Nueva fase: ataca refinerías iraníes. IRGC aeroespacial destruido. 16 aviones militares en Mehrabad. Misiles en Tel Aviv este domingo."},
  {id:"lebanon",name:"LÍBANO",lat:33.9,lng:35.5,c:"#ff4444",s:4,st:"guerra",fecha:"DÍA 8",det:"300 muertos. Hotel Ramada en Raouche destruido. 4 muertos. Primera vez Israel ataca esa zona turística. Hezbollah activo."},
  {id:"ukraine",name:"UCRANIA",lat:48.4,lng:31.2,c:"#ff8800",s:4,st:"guerra",conn:["russia"],fecha:"EN CURSO",det:"Guerra con Rusia año 5. Ayuda a EE.UU. con drones Shahed. Zelenski: es la Tercera Guerra Mundial."},
  {id:"russia",name:"RUSIA\n⚠️INTEL",lat:61.5,lng:105,c:"#ff4400",s:4,st:"activo",fecha:"8 MAR",det:"Dando inteligencia a Irán sobre posiciones de EE.UU. Canciller iraní confirmó ayuda rusa en muchas direcciones."},
  {id:"pak",name:"PAKISTÁN",lat:30.4,lng:69.3,c:"#ff5500",s:4,st:"guerra",conn:["afg"],fecha:"DÍA 8",det:"Operación día 8. 481 afganos muertos. Bagram destruida. Potencia nuclear en guerra."},
  {id:"afg",name:"AFGANISTÁN",lat:33.9,lng:67.7,c:"#ff5500",s:4,st:"guerra",fecha:"DÍA 8",det:"Bajo bombardeo día 8. 21.9M necesitan ayuda. Taliban pide diálogo. Pakistán continúa."},
  {id:"gulf",name:"GOLFO\n🔴ATAQUES",lat:24.5,lng:51.2,c:"#ff6600",s:5,st:"atacado",fecha:"8 MAR — NUEVO",det:"NUEVO 8 MAR: Kuwait airport atacado. 2 muertos en Saudi Arabia. Explosiones en Qatar, Bahrain y Abu Dhabi. Pezeshkian prometió parar pero los ataques continuaron horas después."},
  {id:"tehran_oil",name:"REFINERÍAS\nEN LLAMAS",lat:35.7,lng:51.4,c:"#ff2200",s:5,st:"critico",fecha:"8 MAR — NUEVO",det:"NUEVO 8 MAR: Israel ataca instalaciones petroleras iraníes — nueva fase. Depósito Shahran en llamas. Lluvia negra sobre Teherán. Brent subió 27% en la semana."},
  {id:"ormuz",name:"ORMUZ\n⚠️PELIGROSO",lat:26.6,lng:56.5,c:"#ff8800",s:5,st:"critico",fecha:"8 MAR",det:"Irán dice que Ormuz está abierto pero amenaza atacar cualquier barco de EE.UU. o Israel. Sin tráfico real. Petróleo a 91 dólares."},
  {id:"spain",name:"ESPAÑA",lat:40.5,lng:-3.7,c:"#ffcc00",s:2,st:"tension",fecha:"4 MAR",det:"Fragata Cristóbal Colón en Mediterráneo. Rechaza cooperación ofensiva. Aranceles Trump 25% desde el 15 de marzo."},
];

const CARRIERS=[
  {id:"ford",name:"USS FORD",flag:"🇺🇸",pais:"EE.UU.",lat:22.8,lng:61.5,fecha:"DÍA 8",det:"USS Gerald R. Ford CVN-78. Armada de EE.UU. Mar Arábigo occidental, posición día 8. El más avanzado del mundo. F-35C atacando refinerías iraníes en la nueva fase. Rumbo norte."},
  {id:"ike",name:"USS IKE",flag:"🇺🇸",pais:"EE.UU.",lat:13.8,lng:54.2,fecha:"DÍA 8",det:"USS Eisenhower CVN-69. Armada de EE.UU. Golfo de Adén, día 8. 600 Tomahawks lanzados. Interceptando drones iraníes hacia el Golfo."},
  {id:"tr",name:"USS ROSVLT",flag:"🇺🇸",pais:"EE.UU.",lat:18.2,lng:58.5,fecha:"DÍA 8",det:"USS Theodore Roosevelt CVN-71. Armada de EE.UU. Mar de Omán, día 8. Bloquea salidas iraníes al Índico. Se desplazó 40 millas al norte desde ayer."},
  {id:"linc",name:"USS LINCOLN",flag:"🇺🇸",pais:"EE.UU.",lat:13.1,lng:48.8,fecha:"DÍA 8",det:"USS Lincoln CVN-72. Armada de EE.UU. Mar Rojo sur, día 8. Cuarto portaaviones en zona. Escoltando rutas de suministro."},
  {id:"degaulle",name:"CHARLES D.G.",flag:"🇫🇷",pais:"FRANCIA",lat:35.2,lng:26.1,fecha:"8 MAR",det:"Charles de Gaulle R91. Marine Nationale Française. Mediterráneo oriental, día 8. Único portaaviones nuclear fuera de EE.UU. Defiende Chipre con 4 fragatas y submarino nuclear."},
];

const BASE_DISEASE=[
  {id:"saramp",name:"SARAMPIÓN\nMÉXICO",lat:19.4,lng:-99.1,c:"#ff2200",s:3,st:"alerta",fecha:"MAR 2026",det:"Brote activo. CDMX, Jalisco y Nuevo León. Vinculado a Texas. SSA alerta nacional. Llama al 800-00-44800 para vacunarte gratis."},
  {id:"mpox",name:"MPOX\nCONGO",lat:0.3,lng:25.5,c:"#ff6600",s:4,st:"activo",fecha:"EN CURSO",det:"Emergencia global OMS. 100 mil casos. Variante clade Ib. Congo, Uganda y Kenia."},
  {id:"h5n1",name:"H5N1\nUSA",lat:37.1,lng:-95.7,c:"#ffaa00",s:4,st:"alerta",fecha:"EN CURSO",det:"H5N1 en ganado bovino. Primera transmisión humana confirmada. OMS en alerta pandémica máxima."},
  {id:"dengue",name:"DENGUE\nBRASIL",lat:-10,lng:-55,c:"#ff6600",s:3,st:"activo",fecha:"EN CURSO",det:"5 millones de casos, 5 mil muertes. Serotipo DENV-3. Colapso hospitalario."},
  {id:"ebola",name:"ÉBOLA\nLIBERIA",lat:6.3,lng:-10.8,c:"#cc0000",s:4,st:"alerta",fecha:"FEB 2026",det:"Nuevo brote en Liberia. 300 contactos. Mortalidad 65%. OMS en emergencia."},
  {id:"cholera",name:"CÓLERA\nSUDÁN",lat:15.6,lng:32.5,c:"#ff8800",s:3,st:"activo",fecha:"EN CURSO",det:"200 mil casos, 3 mil muertes. Sin agua potable. Ayuda bloqueada por la guerra civil."},
  {id:"covid",name:"COVID XEC\nASIA",lat:30.6,lng:114.3,c:"#ff4400",s:2,st:"activo",fecha:"MAR 2026",det:"Subvariante XEC. OMS monitoreando en China, Corea del Sur y Japón."},
];

const BASE_CLIMATE=[
  {id:"heat",name:"OLA CALOR\nINDIA",lat:26,lng:80,c:"#ff2200",s:5,st:"extremo",icon:"🔥",pulse:true,fecha:"EN CURSO",det:"47 a 51 grados. 3200 muertes. Récord histórico. Alerta roja en 8 estados."},
  {id:"flood",name:"INUNDACIONES\nEUROPA",lat:47,lng:16,c:"#0066ff",s:4,st:"activo",icon:"🌊",pulse:true,fecha:"MAR 2026",det:"Danubio 8.4 metros. 45 mil evacuados en Austria, Hungría y Eslovaquia. 12 muertos."},
  {id:"fire",name:"INCENDIOS\nAUSTRALIA",lat:-33,lng:149,c:"#ff3300",s:4,st:"extremo",icon:"🔥",pulse:true,fecha:"EN CURSO",det:"2.1 millones de hectáreas quemadas. 12 muertos. Aire peligroso en Sídney."},
  {id:"tornado",name:"TORNADOS\nUSA",lat:36,lng:-97,c:"#aa44ff",s:4,st:"activo",icon:"🌪️",pulse:true,fecha:"MAR 2026",det:"23 tornados en 24 horas. Tres EF4 a 280 km/h. 8 muertos, 140 heridos."},
  {id:"cold",name:"FRENTE FRÍO 39\nMÉXICO-USA",lat:28,lng:-100,c:"#00ccff",s:3,st:"activo",icon:"🧊",pulse:true,fecha:"8 MAR — HOY",det:"Frente Frío 39 activo hoy en México. Posible nieve en Nevado de Toluca y zonas altas. Mínima 3 a 5 grados en Toluca. Lluvias en CDMX por la tarde. Vientos fuertes en Estado de México."},
];

const BASE_NEWS=[
  {id:"oil",name:"REFINERÍAS\nEN LLAMAS",lat:35.7,lng:51.4,c:"#ff2200",s:5,st:"critico",icon:"🔥",fecha:"8 MAR — NUEVO",det:"NUEVO 8 MAR: Israel ataca instalaciones petroleras iraníes. Shahran en llamas. Brent subió 27% en la semana. Petróleo a 91 dólares. Proyección 130 si continúa dos semanas."},
  {id:"gulf_a",name:"GOLFO\n🔴ATAQUES",lat:24,lng:51,c:"#ff6600",s:5,st:"critico",icon:"🚨",fecha:"8 MAR — NUEVO",det:"NUEVO 8 MAR: Kuwait, Arabia Saudita, Qatar, Bahrain y UAE bajo ataques. 2 muertos en Saudi. Pezeshkian prometió parar, pero continuaron."},
  {id:"trump_t",name:"ARANCELES\nTRUMP",lat:38,lng:-97,c:"#ff6600",s:4,st:"activo",icon:"📊",fecha:"15 MAR 2026",det:"25% a Europa, 145% a China, 35% amenaza a México. Entran el 15 de marzo. UE prepara represalias por 45 mil millones de euros."},
  {id:"iran_f",name:"NUEVO LÍDER\nIRÁN",lat:32.4,lng:53.7,c:"#ff4444",s:5,st:"critico",icon:"🗳️",fecha:"8 MAR — NUEVO",det:"NUEVO 8 MAR: Mojtaba Jamenei confirmado nuevo Líder Supremo. Trump lo llamó lightweight. Larijani sigue amenazando con represalias."},
  {id:"stocks",name:"BOLSAS\nCRASH",lat:40.7,lng:-74,c:"#ff3344",s:4,st:"activo",icon:"📉",fecha:"8 MAR",det:"Wall Street menos 6.2% semanal. Tokio menos 9.1%. Ibex menos 8%. Brent más 27% en la semana. Oro a 3200 dólares récord. Bitcoin 62 mil."},
  {id:"nato",name:"OTAN\nCUMBRE",lat:50.9,lng:4.4,c:"#4466ff",s:3,st:"activo",icon:"🛡️",fecha:"12 MAR 2026",det:"Cumbre extraordinaria en Bruselas el 12 de marzo. Solo 8 de 32 miembros cumplen el 2% del PIB. Trump exige 5%."},
  {id:"china_w",name:"CHINA\nPIDE PAZ",lat:39.9,lng:116.4,c:"#ffcc00",s:3,st:"activo",icon:"🌐",fecha:"8 MAR — NUEVO",det:"NUEVO 8 MAR: Wang Yi exigió cese inmediato. Xi Jinping prepara reunión con Trump en Beijing para negociar."},
  {id:"imf",name:"FMI\nRECESIÓN",lat:38.9,lng:-77,c:"#ffee00",s:4,st:"activo",icon:"📊",fecha:"5 MAR",det:"FMI alerta recesión global. Guerra más Ormuz más aranceles reducirán crecimiento mundial en 2.1 puntos. América Latina en riesgo Q3 2026."},
];

// ── CONSTANTS ──────────────────────────────────────────────────────────────────
const STATUS_L={guerra:"EN GUERRA",atacado:"BAJO ATAQUE",activo:"EN CURSO",tension:"EN TENSIÓN",critico:"PUNTO CRÍTICO",alerta:"EN ALERTA",extremo:"EXTREMO"};
const MODES=["war","disease","climate","news"];
const TITLES={war:"⚔️  CONFLICTOS — DÍA 8 — 8 MAR 2026",disease:"🦠  BROTES GLOBALES — OMS 2026",climate:"🌍  CLIMA + SISMOS USGS + NOAA",news:"📰  ECONOMÍA & NOTICIAS — 8 MAR 2026"};
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

// ── THERMOMETER WIDGET ────────────────────────────────────────────────────────
function ToluciWeather({ac}) {
  const [wx, setWx] = useState(null);
  const [rain, setRain] = useState(null); // próxima hora de lluvia

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${TOLUCA_LAT}&longitude=${TOLUCA_LNG}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m&hourly=precipitation_probability,precipitation&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=America%2FMexico_City&forecast_days=2`
        );
        const d = await r.json();
        setWx(d);
        // Busca la próxima hora con >40% de lluvia
        const hr = d.hourly;
        if (hr) {
          const now = new Date();
          const nowH = now.getHours();
          for (let i = nowH; i < Math.min(hr.time.length, nowH + 18); i++) {
            if ((hr.precipitation_probability[i] || 0) >= 40) {
              const t = new Date(hr.time[i]);
              setRain({ hour: t.getHours(), prob: hr.precipitation_probability[i], precip: hr.precipitation[i] });
              break;
            }
          }
        }
      } catch (e) {}
    };
    load();
    const iv = setInterval(load, 10 * 60 * 1000);
    return () => clearInterval(iv);
  }, []);

  if (!wx?.current) return (
    <div style={{ padding: "5px 10px", border: `1px solid ${ac}22`, borderRadius: "4px", background: "#0a0a0a", fontSize: "7px", color: "#333", minWidth: "120px", textAlign: "center" }}>
      📡 CARGANDO TOLUCA...
    </div>
  );

  const c = wx.current;
  const daily = wx.daily;
  const temp = Math.round(c.temperature_2m);
  const feels = Math.round(c.apparent_temperature);
  const code = c.weather_code;
  const icon = wmoIcon(code);
  const desc = wmoText(code);
  const hum = c.relative_humidity_2m;
  const wind = Math.round(c.wind_speed_10m);
  const tmax = daily ? Math.round(daily.temperature_2m_max[0]) : "?";
  const tmin = daily ? Math.round(daily.temperature_2m_min[0]) : "?";
  const rainPct = daily ? daily.precipitation_probability_max[0] : 0;

  // Thermometer fill: scale 0-30°C → 0-100%
  const fill = Math.max(5, Math.min(100, ((temp + 5) / 35) * 100));
  const tempColor = temp <= 5 ? "#00ccff" : temp <= 15 ? "#44aaff" : temp <= 25 ? "#ffaa00" : "#ff4400";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "5px 10px", border: `1px solid ${ac}22`, borderRadius: "4px", background: "#0a0a0a", minWidth: "170px" }}>
      {/* Thermometer SVG */}
      <svg width="16" height="48" viewBox="0 0 16 48" style={{ flexShrink: 0 }}>
        <rect x="6" y="4" width="4" height="30" rx="2" fill="#1a1a1a" stroke="#333" strokeWidth="0.5" />
        <rect x="6.5" y={4 + 30 * (1 - fill / 100)} width="3" height={30 * fill / 100} rx="1.5" fill={tempColor} />
        <circle cx="8" cy="38" r="6" fill={tempColor} />
        <circle cx="8" cy="38" r="3.5" fill={tempColor} opacity="0.7" />
      </svg>
      {/* Data */}
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
          <span style={{ fontSize: "11px" }}>{icon}</span>
          <span style={{ fontSize: "18px", fontWeight: "900", color: tempColor, fontFamily: "'Courier New',monospace", lineHeight: 1 }}>{temp}°</span>
          <span style={{ fontSize: "8px", color: "#444", fontFamily: "'Courier New',monospace" }}>ST {feels}°</span>
        </div>
        <div style={{ fontSize: "7px", color: "#555", letterSpacing: "0.5px", marginTop: "1px" }}>{desc} · {hum}% hum · {wind}km/h</div>
        <div style={{ fontSize: "7px", color: "#444", marginTop: "1px" }}>↑{tmax}° ↓{tmin}° · {rainPct}% lluvia</div>
        {rain && <div style={{ fontSize: "7px", color: "#4488ff", marginTop: "1px", animation: "blink 2s steps(1) infinite" }}>🌧 ~{rain.hour}:00h ({rain.prob}%)</div>}
        {!rain && rainPct < 20 && <div style={{ fontSize: "7px", color: "#336633", marginTop: "1px" }}>☀️ Sin lluvia esperada hoy</div>}
        <div style={{ fontSize: "5.5px", color: "#1a1a1a", letterSpacing: "1px", marginTop: "1px" }}>TOLUCA 2,667m • Open-Meteo</div>
      </div>
    </div>
  );
}

// ── CLOCK ──────────────────────────────────────────────────────────────────────
function Clock({ac}){
  const[t,setT]=useState(new Date());
  useEffect(()=>{const iv=setInterval(()=>setT(new Date()),1000);return()=>clearInterval(iv);},[]);
  const hh=String(t.getHours()).padStart(2,"0"),mm=String(t.getMinutes()).padStart(2,"0"),ss=String(t.getSeconds()).padStart(2,"0");
  const blink=t.getSeconds()%2===0;
  const days=["DOM","LUN","MAR","MIÉ","JUE","VIE","SÁB"];
  const months=["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];
  return(
    <div style={{display:"flex",alignItems:"center",gap:"8px",padding:"5px 12px",border:`1px solid ${ac}22`,borderRadius:"4px",background:"#0a0a0a"}}>
      <div style={{display:"flex",alignItems:"baseline",gap:"1px",fontFamily:"'Courier New',monospace"}}>
        <span style={{fontSize:"28px",fontWeight:"900",color:ac,textShadow:`0 0 16px ${ac}`,lineHeight:1}}>{hh}</span>
        <span style={{fontSize:"24px",fontWeight:"900",color:ac,opacity:blink?1:0.15,transition:"opacity 0.08s",lineHeight:1}}>:</span>
        <span style={{fontSize:"28px",fontWeight:"900",color:ac,textShadow:`0 0 16px ${ac}`,lineHeight:1}}>{mm}</span>
        <span style={{fontSize:"16px",fontWeight:"700",color:ac,opacity:blink?0.8:0.1,transition:"opacity 0.08s",lineHeight:1,marginLeft:"1px"}}>:</span>
        <span style={{fontSize:"16px",fontWeight:"700",color:`${ac}aa`,lineHeight:1}}>{ss}</span>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:"2px",borderLeft:`1px solid ${ac}15`,paddingLeft:"8px"}}>
        <div style={{fontSize:"8px",color:"#444",letterSpacing:"2px",fontFamily:"'Courier New',monospace"}}>{days[t.getDay()]} {t.getDate()} {months[t.getMonth()]} 2026</div>
        <div style={{fontSize:"6.5px",color:"#2a2a2a",letterSpacing:"2px",fontFamily:"'Courier New',monospace"}}>TOLUCA • MX</div>
      </div>
    </div>
  );
}

// ── ICON BAR ──────────────────────────────────────────────────────────────────
function IconBar({quakes,hurricanes,noaaChecked,wlive,mode,ac}){
  const icons=[];
  if(mode==="climate"||mode==="news"){
    if(hurricanes.length>0)hurricanes.forEach(h=>icons.push({icon:"🌀",label:`${h.name} ${hurCat(h.kts)}`,c:hurCol(h.kts),note:"NOAA LIVE"}));
    else if(noaaChecked)icons.push({icon:"🌀",label:"SIN HURACANES",c:"#333",note:"NOAA"});
    quakes.filter(q=>q.mag>=6).slice(0,3).forEach(q=>icons.push({icon:"🌋",label:`M${q.mag.toFixed(1)} ${q.place.split(",")[0].substring(0,10)}`,c:magCol(q.mag),note:"USGS LIVE"}));
    if(wlive.india?.temperature_2m>44)icons.push({icon:"🔥",label:`INDIA ${wlive.india.temperature_2m}°C`,c:"#ff2200",note:"LIVE"});
  }
  if(mode==="war"){
    icons.push({icon:"🔥",label:"REFINERÍAS EN LLAMAS",c:"#ff2200",note:"8 MAR"});
    icons.push({icon:"🚨",label:"TODO EL GOLFO BAJO ATAQUE",c:"#ff6600",note:"8 MAR"});
    icons.push({icon:"🚢",label:"5 PORTAAVIONES",c:"#4488ff",note:"DÍA 8"});
    icons.push({icon:"⚠️",label:"RUSIA+IRÁN CONFIRMADO",c:"#ff4400",note:"INTEL"});
  }
  if(mode==="disease"){
    icons.push({icon:"🔴",label:"SARAMPIÓN MX",c:"#ff2200",note:"ACTIVO"});
    icons.push({icon:"⚠️",label:"H5N1 USA",c:"#ffaa00",note:"PANDÉMICO"});
    icons.push({icon:"☣️",label:"ÉBOLA LIBERIA",c:"#cc0000",note:"FEB 2026"});
  }
  if(mode==="news"){
    icons.push({icon:"🔥",label:"REFINERÍAS IRANÍES",c:"#ff2200",note:"NUEVA FASE"});
    icons.push({icon:"📉",label:"TOKIO -9.1%",c:"#ff3344",note:"SEMANA"});
    icons.push({icon:"🛢️",label:"BRENT +27%",c:"#ffaa00",note:"7 DÍAS"});
    icons.push({icon:"🌐",label:"CHINA PIDE PAZ",c:"#ffcc00",note:"8 MAR"});
  }
  if(!icons.length)return null;
  return(
    <div style={{width:"100%",maxWidth:"980px",marginBottom:"5px",display:"flex",gap:"4px",flexWrap:"wrap"}}>
      {icons.map((ic,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:"4px",padding:"3px 8px",background:"#0a0a0a",border:`1px solid ${ic.c}30`,borderRadius:"3px"}}>
          <span style={{fontSize:"12px"}}>{ic.icon}</span>
          <div><div style={{fontSize:"7.5px",color:ic.c,letterSpacing:"0.5px",fontFamily:"'Courier New',monospace",lineHeight:1.2}}>{ic.label}</div><div style={{fontSize:"6px",color:"#333"}}>{ic.note}</div></div>
        </div>
      ))}
    </div>
  );
}

// ── AUDIO ─────────────────────────────────────────────────────────────────────
function useAudio(){
  const ref=useRef(null);
  const getCtx=useCallback(()=>{if(!ref.current)ref.current=new(window.AudioContext||window.webkitAudioContext)();if(ref.current.state==="suspended")ref.current.resume();return ref.current;},[]);
  const SCLS={war:[220,246,261,293,311,349,415,440,466,493],disease:[196,220,246,261,293,329,349,392,440,493],climate:[261,293,329,349,392,440,493,523,587,659],news:[293,329,369,392,440,493,523,587,659,698]};
  const playHover=useCallback((gid,mode)=>{try{const c=getCtx(),sc=SCLS[mode]||SCLS.war,freq=sc[parseInt(gid,10)%sc.length],t=c.currentTime;const o=c.createOscillator(),g=c.createGain(),flt=c.createBiquadFilter();flt.type="lowpass";flt.frequency.value=1800;flt.Q.value=0.8;o.connect(flt);flt.connect(g);g.connect(c.destination);o.type=mode==="war"?"sawtooth":mode==="disease"?"triangle":"sine";o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(0.032,t+0.03);g.gain.exponentialRampToValueAtTime(0.001,t+0.28);o.start(t);o.stop(t+0.3);}catch(e){}},[getCtx]);
  const playUI=useCallback((type,mode="war")=>{try{const c=getCtx(),t=c.currentTime;if(type==="select"){[1,1.5].forEach((mult,i)=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="sine";o.frequency.setValueAtTime(660*mult,t);o.frequency.exponentialRampToValueAtTime(900*mult,t+0.07);g.gain.setValueAtTime(0.12/(i+1),t);g.gain.exponentialRampToValueAtTime(0.001,t+0.35);o.start(t);o.stop(t+0.36);});}else if(type==="pop"){const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="sine";o.frequency.setValueAtTime(900,t);o.frequency.exponentialRampToValueAtTime(200,t+0.08);g.gain.setValueAtTime(0.2,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.09);o.start(t);o.stop(t+0.1);}else if(type==="alert"){[0,0.14,0.28].forEach((dl,i)=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="square";o.frequency.value=480+i*80;g.gain.setValueAtTime(0.06,t+dl);g.gain.exponentialRampToValueAtTime(0.001,t+dl+0.09);o.start(t+dl);o.stop(t+dl+0.1);});}else if(type==="ping"){const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="sine";o.frequency.value=1047;g.gain.setValueAtTime(0.18,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.6);o.start(t);o.stop(t+0.6);}else if(type==="switch"){const fs={war:[415,311,261,220],disease:[220,261,311,415],climate:[261,329,392,523],news:[293,369,440,587]};(fs[mode]||fs.war).forEach((f,i)=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="sine";o.frequency.value=f;const dl=i*0.075;g.gain.setValueAtTime(0,t+dl);g.gain.linearRampToValueAtTime(0.14,t+dl+0.025);g.gain.exponentialRampToValueAtTime(0.001,t+dl+0.14);o.start(t+dl);o.stop(t+dl+0.15);});setTimeout(()=>{try{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="sine";o.frequency.value=1200;const tt=c.currentTime;g.gain.setValueAtTime(0.07,tt);g.gain.exponentialRampToValueAtTime(0.001,tt+0.3);o.start(tt);o.stop(tt+0.3);}catch(e){}},325);}else if(type==="close"){const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="sine";o.frequency.setValueAtTime(440,t);o.frequency.exponentialRampToValueAtTime(220,t+0.1);g.gain.setValueAtTime(0.1,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.12);o.start(t);o.stop(t+0.12);}}catch(e){};},[getCtx]);
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
  const[ripples,setRipples]=useState({});
  const[quakes,setQuakes]=useState([]);
  const[hurricanes,setHurricanes]=useState([]);
  const[noaaChecked,setNoaaChecked]=useState(false);
  const[hurPos,setHurPos]=useState({});
  const[wlive,setWlive]=useState({});
  const[aiHeadline,setAiHeadline]=useState("");
  const[aiLoading,setAiLoading]=useState(false);
  const[showUpdateInfo,setShowUpdateInfo]=useState(false);
  const lastHov=useRef(0);
  const lastHovId=useRef(null);
  const{playHover,playUI}=useAudio();
  const ac=ACC[mode],bg=BG[mode],isoM=ISO_COL[mode]||{};
  const modeCountryData=ALL_COUNTRY_DATA[mode]||{};

  const clmPoints=[...BASE_CLIMATE,...quakes.map(q=>({id:`q_${q.id}`,name:`SISMO M${q.mag.toFixed(1)}\n${q.place.split(",")[0].substring(0,12).toUpperCase()}`,lat:q.lat,lng:q.lng,c:magCol(q.mag),s:Math.min(5,Math.round(q.mag-3)),st:"extremo",icon:"🌋",pulse:q.mag>=6,fecha:new Date(q.time).toLocaleDateString("es-MX",{day:"2-digit",month:"short"}).toUpperCase(),det:`Sismo M${q.mag.toFixed(1)} en ${q.place}. Profundidad: ${q.depth}km. ${q.mag>=7?"⚠️ ALERTA TSUNAMI ACTIVA.":q.mag>=6?"Monitoreo de tsunami activo.":"Sin riesgo de tsunami."} USGS ${new Date(q.time).toLocaleString("es-MX")}`})),...hurricanes.map(h=>{const pos=hurPos[h.id]||{lat:h.lat,lng:h.lng};return{id:`hur_${h.id}`,name:`🌀 ${h.name}\n${hurCat(h.kts)}`,lat:pos.lat,lng:pos.lng,c:hurCol(h.kts),s:5,st:"extremo",icon:"🌀",pulse:true,fecha:"NOAA LIVE",det:`Huracán ${h.name} — ${hurCat(h.kts)}. ${Math.round(h.kts*1.852)} km/h. Pos: ${pos.lat?.toFixed(2)}°, ${pos.lng?.toFixed(2)}°. NOAA NHC.`};})];

  const DATA_MAP={war:BASE_WAR,disease:BASE_DISEASE,climate:clmPoints,news:BASE_NEWS};
  const STATS_MAP={
    war:[{l:"MUERTOS IRÁN",v:"1,332+",c:"#ff1a1a",snd:"alert"},{l:"SOLDADOS USA",v:"7 ✝",c:"#ff4444",snd:"alert"},{l:"OBJETIVOS US",v:"3,000+",c:"#ff6600",snd:"pop"},{l:"PORTAAVIONES",v:"5 🚢",c:"#4488ff",snd:"ping"},{l:"BRENT",v:"$91 +27%",c:"#ffaa00",snd:"pop"},{l:"GOLFO",v:"🔴ATAQUES",c:"#ff6600",snd:"alert"},{l:"DÍA GUERRA",v:"8",c:"#ffcc00",snd:"ping"},{l:"COSTO/DÍA",v:"$891M",c:"#ff8800",snd:"pop"}],
    disease:[{l:"SARAMPIÓN MX",v:"🔴ACTIVO",c:"#ff2200",snd:"alert"},{l:"MPOX",v:"100K+",c:"#ff6600",snd:"pop"},{l:"H5N1",v:"⚠️PANDEMIA",c:"#ffaa00",snd:"alert"},{l:"DENGUE",v:"5M casos",c:"#ff8800",snd:"pop"},{l:"ÉBOLA",v:"65% MORT.",c:"#cc0000",snd:"alert"},{l:"PAÍSES",v:"47 AFECT.",c:"#ffcc00",snd:"ping"},{l:"COVID XEC",v:"MONIT.",c:"#ff4400",snd:"pop"},{l:"NIVEL OMS",v:"EMERGENCIA",c:"#ff2020",snd:"alert"}],
    climate:[{l:"HURACANES",v:"NOAA LIVE",c:"#8844ff",snd:"alert"},{l:"SISMOS M5.5+",v:"USGS LIVE",c:"#ffaa00",snd:"alert"},{l:"INDIA MAX",v:"51°C 🔥",c:"#ff2200",snd:"pop"},{l:"USA MIN",v:"-35°C 🧊",c:"#00ccff",snd:"pop"},{l:"EVACUADOS",v:"6.5M",c:"#ff8800",snd:"ping"},{l:"INCENDIOS",v:"2.1M ha",c:"#ff3300",snd:"pop"},{l:"FRÍO 39",v:"🇲🇽ACTIVO",c:"#00aaff",snd:"alert"},{l:"CO₂",v:"428 ppm",c:"#ffaa00",snd:"ping"}],
    news:[{l:"REFINERÍAS",v:"🔥LLAMAS",c:"#ff2200",snd:"alert"},{l:"BRENT",v:"+27% SEM",c:"#ffaa00",snd:"pop"},{l:"ORO/ONZA",v:"$3,200↑",c:"#ffdd00",snd:"pop"},{l:"TOKIO",v:"-9.1%↓",c:"#ff3344",snd:"alert"},{l:"ARANCELES",v:"25% UE",c:"#ff6600",snd:"alert"},{l:"FMI",v:"RECESIÓN",c:"#ffee00",snd:"alert"},{l:"CHINA",v:"🌐PIDE PAZ",c:"#ffcc00",snd:"ping"},{l:"NUEVO LÍDER",v:"🇮🇷CONFIRM.",c:"#ff4444",snd:"alert"}],
  };
  const pts=DATA_MAP[mode]||[],sts=STATS_MAP[mode];

  // ── FETCH FUNCTIONS ──────────────────────────────────────────────────────────
  useEffect(()=>{let done=false;(async()=>{try{const[topo,world]=await Promise.all([import("https://cdn.skypack.dev/topojson-client@3"),fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then(r=>r.json())]);if(done)return;const p=d3.geoNaturalEarth1().scale(150).translate([W/2,H/2+15]);const path=d3.geoPath(p);const features=topo.feature(world,world.objects.countries).features;const paths=features.map(f=>({id:String(f.id),d:path(f)||""}));setProj(()=>p);setGeo({paths,borders:path(topo.mesh(world,world.objects.countries,(a,b)=>a!==b)),sphere:path({type:"Sphere"})});}catch(e){}})();return()=>{done=true;};},[]);
  const fetchQuakes=useCallback(async()=>{try{const r=await fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/5.0_day.geojson");const d=await r.json();const now=Date.now();setQuakes(d.features.filter(f=>f.properties.mag>=5.5&&(now-f.properties.time)<48*3600*1000).map(f=>({id:f.id,mag:f.properties.mag,place:f.properties.place||"Océano",lat:f.geometry.coordinates[1],lng:f.geometry.coordinates[0],depth:Math.round(f.geometry.coordinates[2]),time:f.properties.time})));}catch(e){}},[]);
  useEffect(()=>{fetchQuakes();const iv=setInterval(fetchQuakes,5*60*1000);return()=>clearInterval(iv);},[fetchQuakes]);
  const fetchHurricanes=useCallback(async()=>{try{const r=await fetch("https://www.nhc.noaa.gov/CurrentStorms.json");const d=await r.json();setNoaaChecked(true);if(d.activeStorms?.length>0){const a=d.activeStorms.map(s=>({id:s.id,name:s.name||"Storm",kts:parseInt(s.intensity)||65,lat:parseFloat(s.latitudeNumeric)||20,lng:parseFloat(s.longitudeNumeric)||-85,dir:parseInt(s.movementDir)||315,spd:parseInt(s.movementSpeed)||12}));setHurricanes(a);setHurPos(Object.fromEntries(a.map(h=>[h.id,{lat:h.lat,lng:h.lng}])));}else setHurricanes([]);}catch(e){setNoaaChecked(true);setHurricanes([]);}},[]);
  useEffect(()=>{fetchHurricanes();const iv=setInterval(fetchHurricanes,30*60*1000);return()=>clearInterval(iv);},[fetchHurricanes]);
  useEffect(()=>{if(!hurricanes.length)return;const iv=setInterval(()=>{setHurPos(prev=>{const n={...prev};hurricanes.forEach(h=>{const p=prev[h.id]||{lat:h.lat,lng:h.lng};const rad=(h.dir*Math.PI)/180;n[h.id]={lat:p.lat+Math.cos(rad)*(h.spd/111)*(30/3600),lng:p.lng+Math.sin(rad)*(h.spd/111)*(30/3600)};});return n;});},30000);return()=>clearInterval(iv);},[hurricanes]);
  useEffect(()=>{const spots=[{k:"india",lat:26.8,lng:80.9},{k:"spain",lat:37.5,lng:-4},{k:"aus",lat:-33.8,lng:149},{k:"mexico",lat:19.4,lng:-99.1},{k:"iran",lat:32.4,lng:53.7}];const go=async()=>{const obj={};await Promise.all(spots.map(async({k,lat,lng})=>{try{const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,wind_speed_10m&forecast_days=1&timezone=auto`);const d=await r.json();if(d.current)obj[k]=d.current;}catch(e){}}));setWlive(obj);};go();const iv=setInterval(go,10*60*1000);return()=>clearInterval(iv);},[]);
  const fetchAI=useCallback(async()=>{setAiLoading(true);try{const qs={war:"En máximo 18 palabras, noticia más urgente hoy sobre la guerra Irán EE.UU.",news:"En máximo 18 palabras, noticia económica global más importante hoy.",disease:"En máximo 18 palabras, brote de enfermedad más crítico actualmente.",climate:"En máximo 18 palabras, evento climático o meteorológico más severo activo hoy."};const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:80,tools:[{type:"web_search_20250305",name:"web_search"}],messages:[{role:"user",content:qs[mode]||qs.war}]})});const data=await r.json();const txt=data.content?.filter(b=>b.type==="text").map(b=>b.text).join("").trim();if(txt)setAiHeadline(txt.slice(0,180));}catch(e){}setAiLoading(false);},[mode]);
  useEffect(()=>{fetchAI();const iv=setInterval(fetchAI,15*60*1000);return()=>clearInterval(iv);},[mode]);
  useEffect(()=>{window.speechSynthesis.getVoices();return()=>stopSpeech();},[]);
  const xy=useCallback((lat,lng)=>{if(!proj)return null;return proj([lng,lat]);},[proj]);

  const doHover=useCallback((gid)=>{const now=Date.now();if(now-lastHov.current<100||gid===lastHovId.current)return;lastHov.current=now;lastHovId.current=gid;playHover(gid,mode);},[mode,playHover]);
  const doStat=(st,e,i)=>{playUI(st.snd,mode);const r=e.currentTarget.getBoundingClientRect();const rp={id:Date.now(),x:e.clientX-r.left,y:e.clientY-r.top,c:st.c};setRipples(p=>({...p,[i]:[...(p[i]||[]),rp]}));setTimeout(()=>setRipples(p=>({...p,[i]:(p[i]||[]).filter(x=>x.id!==rp.id)})),900);};
  const cycleMode=()=>{playUI("switch",mode);stopSpeech();const idx=MODES.indexOf(mode);const nm=MODES[(idx+1)%MODES.length];setMode(nm);setSel(null);lastHovId.current=null;setTimeout(()=>speakText(MODE_VOICE[nm],1.0),350);};
  const doPoint=(pt)=>{playUI("select",mode);setPing(pt.id);setTimeout(()=>setPing(null),700);const isNew=sel?.id!==pt.id;setSel(isNew?pt:null);if(isNew)setTimeout(()=>speakText(pt.det||""),250);else stopSpeech();};
  const doCountry=(id)=>{const data=modeCountryData[id];if(!data)return;playUI("select",mode);const pt={id:`cc_${mode}_${id}`,name:data.name,c:data.c||isoM[id]||"#ff4400",s:3,st:"activo",det:data.det,fecha:data.fecha};const isNew=sel?.id!==pt.id;setSel(isNew?pt:null);if(isNew)setTimeout(()=>speakText(data.det),250);else stopSpeech();};

  const connLines=[];
  if(mode==="war")BASE_WAR.forEach(p=>(p.conn||[]).forEach(tid=>{const tgt=BASE_WAR.find(x=>x.id===tid);if(tgt){const a=xy(p.lat,p.lng),b=xy(tgt.lat,tgt.lng);if(a&&b)connLines.push({x1:a[0],y1:a[1],x2:b[0],y2:b[1],col:p.c,key:`${p.id}-${tid}`});}}));

  // Mexico alert for current mode
  const mxAlert = getMexicoAlert(mode, hurricanes, wlive, quakes);

  return(
    <div style={{background:bg,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",padding:"10px 8px 14px",fontFamily:"'Courier New',monospace",color:"#fff",transition:"background 0.5s",userSelect:"none"}}>

      {/* TOP */}
      <div style={{width:"100%",maxWidth:"980px",marginBottom:"7px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"8px"}}>
        <div style={{flex:1,minWidth:"200px"}}>
          <div style={{fontSize:"8px",letterSpacing:"4px",color:ac,animation:"blink 1s steps(1) infinite"}}>⬤ {aiLoading?"AI BUSCANDO...":"TIEMPO REAL"} • 🔊 VOZ • USGS+NOAA+AI</div>
          <h1 style={{fontSize:"clamp(10px,1.7vw,15px)",fontWeight:"900",letterSpacing:"2px",color:"#fff",margin:"2px 0 0",textShadow:`0 0 20px ${ac}`}}>{TITLES[mode]}</h1>
          <div style={{fontSize:"6.5px",color:"#252525",letterSpacing:"1px",marginTop:"1px",cursor:"pointer"}} onClick={()=>setShowUpdateInfo(p=>!p)}>SISMOS: {quakes.length} M5.5+ • HURACANES: {noaaChecked?(hurricanes.length>0?`${hurricanes.length} ACTIVOS`:"NINGUNO"):"..."} {showUpdateInfo?"▲":"▼ VER FRECUENCIAS"}</div>
          {showUpdateInfo&&<div style={{fontSize:"6.5px",color:"#336633",letterSpacing:"0.5px",marginTop:"2px",lineHeight:1.6,border:"1px solid #1a3a1a",padding:"3px 6px",borderRadius:"2px"}}>{UPDATE_INFO}</div>}
          {aiHeadline&&<div style={{marginTop:"4px",fontSize:"8px",color:ac,maxWidth:"500px",lineHeight:"1.4"}}>🤖 {aiHeadline}</div>}
        </div>
        <div style={{display:"flex",gap:"8px",alignItems:"flex-start",flexWrap:"wrap"}}>
          <Clock ac={ac}/>
          <ToluciWeather ac={ac}/>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:"5px",alignItems:"flex-end"}}>
          <button onClick={cycleMode} style={{padding:"7px 13px",background:"transparent",border:`1px solid ${ac}`,borderRadius:"3px",color:ac,fontFamily:"'Courier New',monospace",fontSize:"10px",letterSpacing:"2px",cursor:"pointer",fontWeight:"bold",whiteSpace:"nowrap"}} onMouseEnter={e=>e.currentTarget.style.boxShadow=`0 0 22px ${ac}90`} onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>{NEXT[mode]} →</button>
          <button onClick={()=>{fetchQuakes();fetchHurricanes();fetchAI();}} style={{padding:"4px 10px",background:"transparent",border:`1px solid ${ac}25`,borderRadius:"3px",color:`${ac}70`,fontFamily:"'Courier New',monospace",fontSize:"8px",cursor:"pointer",letterSpacing:"1px"}}>⟳ ACTUALIZAR</button>
          <div style={{display:"flex",gap:"5px",marginTop:"2px"}}>{MODES.map(m=><div key={m} style={{width:"6px",height:"6px",borderRadius:"50%",background:m===mode?ACC[m]:"#1a1a1a",boxShadow:m===mode?`0 0 6px ${ACC[m]}`:"none",transition:"all 0.3s"}}/>)}</div>
        </div>
      </div>

      {/* ICON BAR */}
      <IconBar quakes={quakes} hurricanes={hurricanes} noaaChecked={noaaChecked} wlive={wlive} mode={mode} ac={ac}/>

      {/* ALERTS */}
      {mode==="war"&&(<div style={{width:"100%",maxWidth:"980px",marginBottom:"5px",display:"flex",gap:"4px",flexWrap:"wrap"}}>
        {[{txt:"🔥 NUEVA FASE: ISRAEL ATACA REFINERÍAS IRANÍES — 8 MAR",c:"#ff2200",id:"ref",det:"Israel inició nueva fase atacando instalaciones petroleras iraníes. Shahran en llamas. Lluvia negra sobre Teherán. Brent subió 27% en la semana."},
          {txt:"🚨 TODO EL GOLFO BAJO ATAQUES: Kuwait, Saudi, Qatar, UAE, Bahrain — 8 MAR",c:"#ff6600",id:"gulf",det:"Kuwait airport atacado. 2 muertos en Arabia Saudita. Explosiones en Qatar, UAE y Bahrain. Pezeshkian prometió parar, pero continuaron horas después."},
          {txt:"🗳️ MOJTABA JAMENEI CONFIRMADO NUEVO LÍDER — 8 MAR",c:"#ff4444",id:"lider",det:"Mojtaba Jamenei, hijo del ayatolá Jamenei muerto el 28 de febrero, fue confirmado como nuevo Líder Supremo el 8 de marzo. Trump lo llamó lightweight. Canciller iraní dice que Trump pagará el precio."},
        ].map((a,i)=>(<div key={i} style={{flex:1,padding:"4px 9px",background:"#08040a",border:`1px solid ${a.c}`,borderRadius:"3px",fontSize:"7.5px",color:a.c,cursor:"pointer",minWidth:"160px",animation:i===0?"blink 2s steps(1) infinite":"none"}} onClick={()=>doPoint({id:a.id,name:a.txt.split(":")[0],c:a.c,s:5,st:"critico",fecha:"8 MAR 2026",det:a.det})}>{a.txt}</div>))}
      </div>)}
      {mode==="disease"&&(<div style={{width:"100%",maxWidth:"980px",marginBottom:"5px",padding:"5px 12px",background:"#0a0402",border:"1px solid #ff4400",borderRadius:"3px",fontSize:"8px",color:"#ff4400",animation:"blink 2.2s steps(1) infinite",cursor:"pointer"}} onClick={()=>doPoint(BASE_DISEASE[0])}>🔴 BROTE ACTIVO: SARAMPIÓN EN MÉXICO — CDMX, JALISCO, NUEVO LEÓN — LLAMA AL 800-00-44800 PARA VACUNARTE</div>)}

      {/* MAP */}
      <div style={{width:"100%",maxWidth:"980px",position:"relative",border:`1px solid ${ac}14`,borderRadius:"6px",overflow:"hidden",boxShadow:`0 0 40px ${ac}10`,background:"#020610"}}>
        {!geo&&(<div style={{height:"440px",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"12px"}}><div style={{fontSize:"22px",animation:"spin 1.5s linear infinite"}}>🌍</div><div style={{fontSize:"9px",color:ac,letterSpacing:"4px",animation:"blink 1s steps(1) infinite"}}>CARGANDO MAPA...</div></div>)}
        {geo&&(<svg viewBox={`0 0 ${W} ${H}`} style={{display:"block",width:"100%"}}>
          <rect width={W} height={H} fill="#020814"/>
          {geo.sphere&&<path d={geo.sphere} fill="#020a14" stroke={ac} strokeWidth="0.3" strokeOpacity="0.1"/>}
          {geo.paths.map(({id,d})=>{const col=isoM[id];const hasCE=!!modeCountryData[id];return(<path key={id} d={d} fill={col?col+"1c":"#080e08"} stroke={col?col:"#0c1c0c"} strokeWidth={col?0.55:0.18} strokeOpacity={col?0.48:1} onMouseEnter={()=>doHover(id)} style={{cursor:hasCE?"pointer":"default"}} onMouseOver={e=>{if(col)e.target.setAttribute("fill",col+(hasCE?"66":"36"));}} onMouseOut={e=>{e.target.setAttribute("fill",col?col+"1c":"#080e08");}} onClick={()=>hasCE&&doCountry(id)}/>);})}
          {geo.borders&&<path d={geo.borders} fill="none" stroke="#0c1e0c" strokeWidth="0.18"/>}
          {connLines.map(l=>(<g key={l.key}><line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={l.col} strokeWidth="0.6" strokeOpacity="0.35" strokeDasharray="4,4"><animate attributeName="stroke-dashoffset" from="0" to="-16" dur="0.8s" repeatCount="indefinite"/></line></g>))}
          {mode==="war"&&CARRIERS.map(cv=>{const p=xy(cv.lat,cv.lng);if(!p)return null;const[cx,cy]=p,cc=cv.pais==="FRANCIA"?"#4466ff":"#4488ff";return(<g key={cv.id} onClick={()=>doPoint({id:cv.id,name:`${cv.flag} ${cv.name}`,lat:cv.lat,lng:cv.lng,c:cc,s:5,st:"activo",fecha:cv.fecha,det:cv.det})} style={{cursor:"pointer"}}><ellipse cx={cx} cy={cy} rx={14} ry={3.2} fill="none" stroke={cc} strokeWidth="0.4" strokeOpacity="0.2" transform={`rotate(-22,${cx},${cy})`}><animate attributeName="rx" values="14;20;14" dur="3s" repeatCount="indefinite"/></ellipse><g style={{filter:`drop-shadow(0 0 4px ${cc})`}}><rect x={cx-10} y={cy-1.8} width={20} height={4} fill={cc} rx="2" opacity="0.92"/><rect x={cx-6} y={cy-4} width={10} height={2.4} fill={cc} rx="0.8" opacity="0.88"/><rect x={cx+2} y={cy-6.5} width={4} height={3} fill={cc==="4466ff"?"#8899ff":"#66aaff"} rx="0.8"/></g><text x={cx} y={cy-9} textAnchor="middle" fill={cc} fontSize="5.5" fontFamily="'Courier New',monospace" fontWeight="bold" style={{pointerEvents:"none"}}>{cv.flag} {cv.name}</text><text x={cx} y={cy-17} textAnchor="middle" fill={`${cc}88`} fontSize="4.5" fontFamily="'Courier New',monospace" style={{pointerEvents:"none"}}>{cv.pais}</text></g>);})}
          {mode==="climate"&&hurricanes.map(h=>{const pos=hurPos[h.id]||{lat:h.lat,lng:h.lng};const ph=xy(pos.lat,pos.lng);if(!ph)return null;const[hx,hy]=ph,hc=hurCol(h.kts);return(<g key={`h-${h.id}`} onClick={()=>doPoint({id:`hur_${h.id}`,name:`🌀 ${h.name}`,lat:pos.lat,lng:pos.lng,c:hc,s:5,st:"extremo",icon:"🌀",fecha:"NOAA LIVE",det:`Huracán ${h.name} — ${hurCat(h.kts)}. ${Math.round(h.kts*1.852)} km/h. Pos: ${pos.lat?.toFixed(2)}°, ${pos.lng?.toFixed(2)}°. NOAA NHC en tiempo real.`})} style={{cursor:"pointer"}}>{[0,1,2].map(i=>(<circle key={i} cx={hx} cy={hy} r={7} fill="none" stroke={hc} strokeWidth="0.7" opacity="0"><animate attributeName="r" from="7" to={7+i*13} dur={`${1.5+i*0.5}s`} begin={`${i*0.4}s`} repeatCount="indefinite"/><animate attributeName="opacity" from="0.7" to="0" dur={`${1.5+i*0.5}s`} begin={`${i*0.4}s`} repeatCount="indefinite"/></circle>))}<circle cx={hx} cy={hy} r="5" fill={hc} opacity="0.75"/><g><animateTransform attributeName="transform" type="rotate" from={`0 ${hx} ${hy}`} to={`360 ${hx} ${hy}`} dur="3.5s" repeatCount="indefinite"/>{[0,90,180,270].map(a=>{const rad=(a*Math.PI)/180;return<line key={a} x1={hx+Math.cos(rad)*3} y1={hy+Math.sin(rad)*3} x2={hx+Math.cos(rad)*7.5} y2={hy+Math.sin(rad)*7.5} stroke={hc} strokeWidth="1.4" strokeLinecap="round" opacity="0.85"/>;})}</g><text x={hx} y={hy-11} textAnchor="middle" fill={hc} fontSize="6.5" fontFamily="'Courier New',monospace" fontWeight="bold" style={{pointerEvents:"none"}}>{h.name}</text></g>);})}
          {mode==="climate"&&noaaChecked&&hurricanes.length===0&&(<text x={W/2} y={H-12} textAnchor="middle" fill="#2a1a3a" fontSize="9" fontFamily="'Courier New',monospace">🌀 NOAA: SIN HURACANES ACTIVOS AHORA</text>)}
          {pts.filter(pt=>pt.lat&&pt.lng).map(pt=>{const p=xy(pt.lat,pt.lng);if(!p)return null;const[px,py]=p,isSel=sel?.id===pt.id,isPing=ping===pt.id,r=isSel?9:6.5,ptc=pt.c||"#ff4400";return(<g key={pt.id} onClick={()=>doPoint(pt)} style={{cursor:"pointer"}}>{pt.pulse&&[0,1,2].map(i=>(<circle key={i} cx={px} cy={py} r={r} fill="none" stroke={ptc} strokeWidth="0.65" opacity="0"><animate attributeName="r" from={r} to={r+26} dur={`${1.8+i*0.6}s`} begin={`${i*0.5}s`} repeatCount="indefinite"/><animate attributeName="opacity" from="0.55" to="0" dur={`${1.8+i*0.6}s`} begin={`${i*0.5}s`} repeatCount="indefinite"/></circle>))}{isPing&&(<circle cx={px} cy={py} r={r} fill="none" stroke="#fff" strokeWidth="2" opacity="0.9"><animate attributeName="r" from={r} to={r+22} dur="0.6s"/><animate attributeName="opacity" from="0.9" to="0" dur="0.6s"/></circle>)}{isSel&&(<circle cx={px} cy={py} r={r+5} fill="none" stroke={ptc} strokeWidth="1.1" strokeDasharray="3,3" opacity="0.85"><animateTransform attributeName="transform" type="rotate" from={`0 ${px} ${py}`} to={`360 ${px} ${py}`} dur="4s" repeatCount="indefinite"/></circle>)}<circle cx={px} cy={py} r={r} fill={ptc} style={{filter:`drop-shadow(0 0 ${isSel?13:6}px ${ptc})`}}/><circle cx={px} cy={py} r={r*0.36} fill="rgba(255,255,255,0.55)"/>{pt.icon&&<text x={px} y={py+2.5} textAnchor="middle" fontSize="5.5" style={{pointerEvents:"none"}}>{pt.icon}</text>}{(pt.name||"").split("\n").map((ln,li)=>(<text key={li} x={px} y={py-r-2.5-((pt.name||"").split("\n").length-1-li)*8} textAnchor="middle" fill={ptc} fontSize={isSel?8:6.5} fontFamily="'Courier New',monospace" fontWeight="bold" style={{pointerEvents:"none",filter:`drop-shadow(0 0 3px ${ptc})`}}>{ln}</text>))}</g>);})}
        </svg>)}
        <div style={{position:"absolute",inset:0,pointerEvents:"none",background:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.02) 2px,rgba(0,0,0,0.02) 4px)"}}/>
        {[{top:"5px",left:"5px"},{top:"5px",right:"5px"},{bottom:"5px",left:"5px"},{bottom:"5px",right:"5px"}].map((pos,i)=>(<div key={i} style={{position:"absolute",...pos,width:"12px",height:"12px",borderTop:pos.top?`1px solid ${ac}40`:"none",borderBottom:pos.bottom?`1px solid ${ac}40`:"none",borderLeft:pos.left?`1px solid ${ac}40`:"none",borderRight:pos.right?`1px solid ${ac}40`:"none",pointerEvents:"none"}}/>))}
        <div style={{position:"absolute",bottom:"4px",left:"50%",transform:"translateX(-50%)",fontSize:"6.5px",color:"#141414",letterSpacing:"2px",pointerEvents:"none",whiteSpace:"nowrap"}}>HOVER→MÚSICA • PUNTOS→DETALLES+🔊 • PAÍSES ILUMINADOS→TOCA • PORTAAVIONES→TOCA</div>
      </div>

      {/* INFO PANEL */}
      {sel&&(<div style={{marginTop:"9px",padding:"12px 15px",background:bg,border:`1px solid ${sel.c||"#ff4400"}`,borderRadius:"4px",width:"100%",maxWidth:"980px",boxShadow:`0 0 28px ${(sel.c||"#ff4400")}22`,animation:"slideIn 0.2s ease"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"}}>
            <span style={{fontSize:"13px",fontWeight:"900",letterSpacing:"2px",color:sel.c||"#ff4400",textShadow:`0 0 10px ${sel.c||"#ff4400"}`}}>{sel.icon||""} {(sel.name||"").replace(/\n/g," ")}</span>
            <span style={{fontSize:"7px",background:sel.c||"#ff4400",color:"#000",padding:"2px 7px",borderRadius:"2px",letterSpacing:"2px",fontWeight:"bold"}}>{STATUS_L[sel.st]||"ACTIVO"}</span>
            {sel.fecha&&<span style={{fontSize:"7px",color:"#444",border:`1px solid ${sel.c||"#ff4400"}30`,padding:"2px 6px",borderRadius:"2px"}}>{sel.fecha}</span>}
            {sel.s&&<span style={{fontSize:"8px",color:"#333"}}>{"▮".repeat(sel.s)}{"▯".repeat(5-sel.s)}</span>}
            <span style={{fontSize:"7px",color:ac,animation:"blink 1s steps(1) infinite"}}>🔊 VOZ</span>
          </div>
          <button onClick={()=>{setSel(null);stopSpeech();playUI("close",mode);}} style={{background:"none",border:"none",color:"#444",cursor:"pointer",fontSize:"15px",lineHeight:1,padding:"0 0 0 8px",flexShrink:0}}>✕</button>
        </div>
        <div style={{marginTop:"8px",fontSize:"11px",color:"#ccc",lineHeight:"1.85",borderTop:`1px solid ${(sel.c||"#ff4400")}15`,paddingTop:"8px"}}>{sel.det||""}</div>
      </div>)}

      {/* STATS */}
      <div style={{marginTop:"10px",display:"flex",gap:"5px",flexWrap:"wrap",justifyContent:"center",width:"100%",maxWidth:"980px"}}>
        {sts.map((st,i)=>(<button key={st.l} onClick={e=>doStat(st,e,i)} style={{position:"relative",overflow:"hidden",background:bg,border:`1px solid ${st.c}22`,borderRadius:"4px",padding:"7px 9px",textAlign:"center",minWidth:"88px",cursor:"pointer",fontFamily:"'Courier New',monospace",transition:"all 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.border=`1px solid ${st.c}`;e.currentTarget.style.boxShadow=`0 0 12px ${st.c}42`;e.currentTarget.style.transform="translateY(-3px)";}} onMouseLeave={e=>{e.currentTarget.style.border=`1px solid ${st.c}22`;e.currentTarget.style.boxShadow="none";e.currentTarget.style.transform="translateY(0)";}}>
          {(ripples[i]||[]).map(rp=>(<div key={rp.id} style={{position:"absolute",left:rp.x-50,top:rp.y-50,width:"100px",height:"100px",borderRadius:"50%",background:`radial-gradient(circle,${rp.c}55 0%,transparent 70%)`,animation:"rippleOut 0.9s ease-out forwards",pointerEvents:"none"}}/>))}
          <div style={{fontSize:"13px",fontWeight:"900",color:st.c,textShadow:`0 0 7px ${st.c}55`,position:"relative"}}>{st.v}</div>
          <div style={{fontSize:"6px",color:"#2d2d2d",letterSpacing:"1.5px",marginTop:"2px",position:"relative"}}>{st.l}</div>
        </button>))}
      </div>

      {/* 🇲🇽 MÉXICO PRIORITY ALERT */}
      {mxAlert&&(<div style={{marginTop:"8px",width:"100%",maxWidth:"980px",padding:"10px 14px",background:bg,border:`1px solid ${mxAlert.color}`,borderRadius:"4px",boxShadow:`0 0 18px ${mxAlert.color}15`}}>
        <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"6px"}}>
          <span style={{fontSize:"14px"}}>{mxAlert.icon}</span>
          <span style={{fontSize:"9px",fontWeight:"900",color:mxAlert.color,letterSpacing:"2px",textShadow:`0 0 8px ${mxAlert.color}`}}>{mxAlert.title}</span>
          <span style={{fontSize:"7px",background:mxAlert.color,color:"#000",padding:"1px 6px",borderRadius:"2px",fontWeight:"bold",letterSpacing:"1px",marginLeft:"4px"}}>IMPACTO DIRECTO</span>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginBottom:"6px"}}>
          {mxAlert.lines.map((l,i)=>(<div key={i} style={{fontSize:"9px",color:"#ccc",background:"#0a0a0a",padding:"4px 8px",borderRadius:"3px",border:`1px solid ${mxAlert.color}20`,flex:"1",minWidth:"180px",lineHeight:"1.5"}}>{l}</div>))}
        </div>
        <div style={{fontSize:"8px",color:mxAlert.color,borderTop:`1px solid ${mxAlert.color}20`,paddingTop:"5px"}}>💡 <strong>QUÉ HACER:</strong> {mxAlert.accion}</div>
      </div>)}

      {/* BOTTOM STRIPS */}
      {mode==="climate"&&(<div style={{marginTop:"7px",width:"100%",maxWidth:"980px",display:"flex",gap:"5px",flexWrap:"wrap"}}>
        {Object.keys(wlive).length>0&&(<div style={{flex:2,background:"#020a08",border:"1px solid #00ff8818",borderRadius:"4px",padding:"5px 12px",display:"flex",gap:"10px",flexWrap:"wrap",alignItems:"center"}}><span style={{fontSize:"7.5px",color:"#00ff88",letterSpacing:"3px",fontWeight:"bold"}}>📡 LIVE</span>{wlive.india&&<span style={{fontSize:"8px",color:"#ff4400"}}>🔥 INDIA {wlive.india.temperature_2m}°C</span>}{wlive.spain&&<span style={{fontSize:"8px",color:"#ff6600"}}>☀️ ESPAÑA {wlive.spain.temperature_2m}°C</span>}{wlive.aus&&<span style={{fontSize:"8px",color:"#ff3300"}}>🔥 AUS {wlive.aus.temperature_2m}°C</span>}{wlive.mexico&&<span style={{fontSize:"8px",color:"#8844ff"}}>🌀 MX {wlive.mexico.temperature_2m}°C {wlive.mexico.wind_speed_10m}km/h</span>}{wlive.iran&&<span style={{fontSize:"8px",color:"#ff2020"}}>🔴 IRÁN {wlive.iran.temperature_2m}°C</span>}</div>)}
        {quakes.length>0&&(<div style={{flex:2,background:"#0a0800",border:"1px solid #ffaa0018",borderRadius:"4px",padding:"5px 12px",display:"flex",gap:"8px",flexWrap:"wrap",alignItems:"center"}}><span style={{fontSize:"7.5px",color:"#ffaa00",letterSpacing:"2px",fontWeight:"bold"}}>🌋 USGS {quakes.length}</span>{quakes.slice(0,4).map(q=><span key={q.id} style={{fontSize:"8px",color:magCol(q.mag)}}>M{q.mag.toFixed(1)} {q.place.split(",")[0].substring(0,10)}</span>)}</div>)}
      </div>)}
      {mode==="news"&&(<div style={{marginTop:"7px",width:"100%",maxWidth:"980px",background:"#080804",border:"1px solid #ffcc0018",borderRadius:"4px",padding:"5px 12px",overflow:"hidden"}}><div style={{fontSize:"8.5px",color:"#ffcc00",letterSpacing:"1.5px",whiteSpace:"nowrap",animation:"ticker 42s linear infinite"}}>🔥 NUEVA FASE: ISRAEL ATACA REFINERÍAS IRANÍES — 8 MAR &nbsp;•&nbsp; 🚨 KUWAIT, SAUDI, QATAR, UAE, BAHRAIN BAJO ATAQUES — 8 MAR &nbsp;•&nbsp; 🗳️ MOJTABA JAMENEI CONFIRMADO NUEVO LÍDER — 8 MAR &nbsp;•&nbsp; 🌐 WANG YI: CESE INMEDIATO — 8 MAR &nbsp;•&nbsp; 📉 BRENT +27% EN UNA SEMANA &nbsp;•&nbsp; 🥇 ORO $3,200 RÉCORD &nbsp;•&nbsp; 📊 ARANCELES 25% UE — 15 MAR &nbsp;•&nbsp; 🗳️ CDU 29% AfD 20% ALEMANIA &nbsp;•&nbsp; 🇫🇷 LE PEN 34% ELECCIONES MAY 2026 &nbsp;•&nbsp; 🛡️ OTAN CUMBRE 12 MAR &nbsp;•&nbsp; 📊 FMI: RECESIÓN Q3 2026 &nbsp;•&nbsp; 🇲🇽 GASOLINA +18% &nbsp;•&nbsp; 🇷🇺 RUSIA: DEMANDA ENERGÍA AUMENTÓ SIGNIFICATIVAMENTE</div></div>)}

      <div style={{marginTop:"6px",fontSize:"6.5px",color:"#111",letterSpacing:"2px",textAlign:"center"}}>USGS+NOAA+Open-Meteo+Claude AI — TIEMPO REAL — MONITOR GLOBAL v9</div>
      <style>{`
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes rippleOut{0%{transform:scale(0.1);opacity:1}100%{transform:scale(4.5);opacity:0}}
        @keyframes slideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes ticker{0%{transform:translateX(100%)}100%{transform:translateX(-270%)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      `}</style>
    </div>
  );
}
