// @ts-nocheck
// MONITOR GLOBAL v13 — 20 MAR 2026 — DÍA 21 — ICONOS TIEMPO REAL — FIXED
import { useState, useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";

const W = 960, H = 480;
const FALLBACK_LAT = 19.2826, FALLBACK_LNG = -99.6557;

// ═══════════════════════════════════════════════════════════════════
// ICONOS DINÁMICOS
// ═══════════════════════════════════════════════════════════════════
const getWeatherIcon = (code, hour = new Date().getHours()) => {
  const isNight = hour < 6 || hour > 20;
  const base = {0:isNight?"🌙":"☀️",1:isNight?"🌙":"🌤️",2:isNight?"☁️":"⛅",3:"☁️",45:"🌫️",48:"🌫️",51:"🌦️",53:"🌦️",55:"🌦️",56:"🌨️",57:"🌨️",61:"🌧️",63:"🌧️",65:"🌧️",66:"🌨️",67:"🌨️",71:"❄️",73:"❄️",75:"❄️",77:"❄️",80:"🌦️",81:"🌧️",82:"⛈️",85:"🌨️",86:"🌨️",95:"⛈️",96:"⛈️",99:"⛈️"};
  return base[code] || "🌡️";
};
const getHurricaneIcon = (kts) => { const c=parseInt(kts)||0; return c>=137?"🌀":c>=113?"🌀🟠":c>=96?"🌀🟡":c>=64?"🌀🟢":"🌀⚪"; };
const getQuakeIcon = (mag) => mag>=8?"🌋🔴":mag>=7?"🌋🟠":mag>=6?"🌋🟡":mag>=5.5?"🌋🟢":"🌋";
const getDiseaseIcon = (cases, trend) => { const num=parseInt((cases||"").replace(/[^0-9]/g,""))||0; if(trend.includes("+")&&num>1000)return"🦠🔴"; if(num>500)return"🦠🟠"; if(num>100)return"🦠🟡"; return"🦠"; };
const getMarketIcon = (change) => { const p=parseFloat(change)||0; return p>=5?"📈":p>=2?"📈🟢":p>=-2?"📊⚪":p>=-5?"📉🟠":"📉"; };
const getTimeIcon = () => { const h=new Date().getHours(); return h>=5&&h<12?"🌅":h>=12&&h<18?"☀️":h>=18&&h<21?"🌆":"🌙"; };
const getDayIcon = (day) => day<=7?"📅 Semana 1":day<=14?"📅 Semana 2":day<=21?"📅 Semana 3":"📅 Semana 4+";

// ═══════════════════════════════════════════════════════════════════
// SPEECH ENGINE
// ═══════════════════════════════════════════════════════════════════
let _sq=[], _spk=false, _voice=null, _kat=null, _rate=1.05;
function pickVoice(){
  const vs=window.speechSynthesis?.getVoices()||[];
  if(!vs.length) return null;
  const rx=/monica|paulina|lucia|sabina|rosa|elena|conchita|angelica|lupe|paloma|susana|pilar|maria|fernanda|valeria|camila|andrea|sofia|isabel|beatriz/i;
  const fem=vs.filter(v=>v.lang?.startsWith("es")&&rx.test(v.name));
  return fem.length?fem[Math.floor(Math.random()*fem.length)]:vs.find(v=>v.lang?.startsWith("es"))||vs[0];
}
function speakText(txt,rate=1.05){
  if(!window.speechSynthesis) return;
  try{
    stopSpeech(); _rate=rate; _voice=pickVoice();
    const clean=txt.replace(/[\u{1F300}-\u{1FAFF}]/gu,"").replace(/\n/g,", ").replace(/\s+/g," ").trim();
    _sq=(clean.match(/[^.!?]+[.!?]*/g)||[clean]).filter(s=>s.trim().length>1);
    setTimeout(_pq,100);
  }catch(e){}
}
function _pq(){
  if(!_sq.length||_spk) return;
  const s=_sq.shift(); if(!s?.trim()){_pq();return;}
  try{
    const u=new SpeechSynthesisUtterance(s.trim());
    u.lang="es-MX"; u.rate=_rate; u.pitch=1.2; u.volume=0.95;
    if(_voice) u.voice=_voice;
    u.onstart=()=>{_spk=true;};
    u.onend=()=>{_spk=false;setTimeout(_pq,60);};
    u.onerror=()=>{_spk=false;setTimeout(_pq,60);};
    window.speechSynthesis.speak(u);
  }catch(e){_spk=false;}
}
function stopSpeech(){
  _sq=[];_spk=false;
  if(_kat){clearInterval(_kat);_kat=null;}
  try{window.speechSynthesis?.cancel();}catch(e){}
}

// ═══════════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════
const MODES=["war","disease","climate","news"];
const ACC={war:"#ff2020",disease:"#ff6600",climate:"#00aaff",news:"#ffcc00"};
const BG={war:"#020508",disease:"#020a05",climate:"#020810",news:"#050400"};
const GRID={war:"#ff202008",disease:"#ff660008",climate:"#00aaff08",news:"#ffcc0008"};
const TITLES={
  war:"⚔️  CONFLICTOS GLOBALES — DÍA 21 — 20 MAR 2026",
  disease:"🦠  BROTES GLOBALES — OMS — 20 MAR 2026",
  climate:"🌍  CLIMA · SISMOS USGS · NOAA · NASA EONET — 20 MAR 2026",
  news:"📰  ECONOMÍA & MERCADOS — 20 MAR 2026"
};
const NEXT={war:"🦠 ENFERMEDADES",disease:"🌍 CLIMA",climate:"📰 ECONOMÍA",news:"⚔️ CONFLICTOS"};
const STATUS_L={guerra:"EN GUERRA",atacado:"BAJO ATAQUE",activo:"EN CURSO",tension:"EN TENSIÓN",critico:"CRÍTICO",alerta:"EN ALERTA",extremo:"EXTREMO"};
const MODE_VOICE={
  war:`Conflictos globales. Día veintiuno. Israel atacó South Pars, el mayor campo de gas del mundo. Irán respondió con misiles. Brent en ciento quince dólares. Un F-35 fue dañado por primera vez en la historia. Joe Kent, funcionario de inteligencia de Trump, renunció diciendo que la guerra empezó por presión israelí sin inteligencia real.`,
  disease:`Modo enfermedades. Sarampión en México: nueve mil setenta y cuatro casos. Mpox clade Ib activo globalmente. H5N1 en 47 estados de EE.UU. Nipah en India con mortalidad del setenta por ciento.`,
  climate:`Modo clima y desastres. Sismos USGS en tiempo real. Frente Frío 39 activo en México. Ola de calor en India hasta 51 grados. Tornados activos en EE.UU.`,
  news:`Modo economía. Brent a ciento quince dólares. Bitcoin en vivo. Peso mexicano rebasa diecinueve por dólar. Costo de la guerra supera veinte mil millones de dólares. FMI confirma recesión en México para Q3.`,
};

// ═══════════════════════════════════════════════════════════════════
// COLOR HELPERS
// ═══════════════════════════════════════════════════════════════════
const hurCol=k=>{k=parseInt(k)||0;return k>=137?"#ff0000":k>=113?"#ff4400":k>=96?"#ff8800":k>=64?"#8844ff":"#6666ff";};
const hurCat=k=>{k=parseInt(k)||0;return k>=137?"CAT5":k>=113?"CAT4":k>=96?"CAT3":k>=64?"CAT2":"T.TROP";};
const magCol=m=>m>=7?"#ff0000":m>=6?"#ff4400":"#ff8800";
function haversine(la1,lo1,la2,lo2){const R=6371,dL=(la2-la1)*Math.PI/180,dl=(lo2-lo1)*Math.PI/180,a=Math.sin(dL/2)**2+Math.cos(la1*Math.PI/180)*Math.cos(la2*Math.PI/180)*Math.sin(dl/2)**2;return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));}

// ═══════════════════════════════════════════════════════════════════
// ISO COLOR MAPS
// ═══════════════════════════════════════════════════════════════════
const ISO_COL={
  war:{"840":"#ff2020","364":"#ff1a1a","376":"#ff1a1a","422":"#ff4444","804":"#ff8800","643":"#ff4400","586":"#ff5500","4":"#ff5500","784":"#ff8800","634":"#ff8800","48":"#ff8800","414":"#ff8800","682":"#ff9900","196":"#ff8800","724":"#ffcc00","156":"#ffcc00","356":"#ffaa44","484":"#88cc00","368":"#ff6600","792":"#ffcc00","818":"#ffcc00","250":"#4466ff","380":"#4466ff","528":"#4466ff","826":"#4466ff","300":"#4466ff"},
  disease:{"156":"#ff4400","180":"#ff6600","840":"#ffaa00","729":"#ff8800","76":"#ff6600","430":"#cc0000","356":"#ff4400","484":"#ff2200","710":"#ff8800","410":"#ffcc00","360":"#ff9900","608":"#ff7733","270":"#ff6600","404":"#ff8800"},
  climate:{"356":"#ff2200","840":"#aa44ff","50":"#6633ff","124":"#00ccff","36":"#ff3300","76":"#0055ff","392":"#ffaa00","360":"#ff9900","608":"#7733ff","724":"#ff5500","250":"#0066ff","152":"#ffbb00","484":"#8844ff","704":"#ff8800"},
  news:{"840":"#ff6600","276":"#4488ff","250":"#4488ff","156":"#ffcc00","364":"#ff4444","643":"#ff7700","76":"#44ffaa","826":"#4466ff","724":"#ff6600","380":"#4466ff","392":"#ff3344","682":"#ffaa00","484":"#ffaa44","528":"#4466ff","356":"#ffaa44"},
};

// ═══════════════════════════════════════════════════════════════════
// ALL COUNTRY DATA
// ═══════════════════════════════════════════════════════════════════
const ALL_COUNTRY_DATA={
  war:{
    "840":{name:"🇺🇸 EE.UU.",fecha:"DÍA 21",c:"#ff2020",icon:"⚔️",det:"DÍA 21 — 13 soldados muertos. 7,000+ objetivos destruidos en Irán. Joe Kent, alto funcionario de inteligencia nombrado por Trump, renunció: 'Empezamos esta guerra por presión de Israel y su poderoso lobby americano — no había inteligencia real de un gran ataque'. Trump dijo que Israel atacó South Pars por 'enojo' y que no lo hará de nuevo. Fuentes israelíes a CNN: el ataque fue coordinado con EE.UU. Un F-35 dañado — primera vez en la historia. Costo total $20B+. Crisis política interna creciente."},
    "364":{name:"🇮🇷 IRÁN",fecha:"DÍA 21",c:"#ff1a1a",icon:"💥",det:"DÍA 21 — 1,444+ civiles muertos / 4,800+ militares del IRGC asesinados. Internet apagado 480+ horas, récord mundial absoluto. Irán respondió al ataque de South Pars con misiles contra Qatar, Arabia Saudita y Emiratos. Mojtaba Jamenei prometió 'respuesta sin precedentes'. 29 de 31 provincias iraníes afectadas por el conflicto. Ormuz -95% tráfico."},
    "376":{name:"🇮🇱 ISRAEL",fecha:"DÍA 21",c:"#ff1a1a",icon:"⚔️",det:"DÍA 21 — Atacó South Pars, el MAYOR CAMPO DE GAS DEL MUNDO. Asesinó a Ali Larijani (17 mar), Ministro de Inteligencia Khatib y comandante Basij Soleimani. Trump: Israel actuó por enojo. Fuentes israelíes: ataque fue coordinado con EE.UU. Netanyahu evalúa próximo paso."},
    "422":{name:"🇱🇧 LÍBANO",fecha:"DÍA 21",c:"#ff4444",icon:"🔴",det:"600+ muertos: 100+ niños. Hezbollah en su punto más débil desde 2006. Israel continúa operaciones. Colapso humanitario confirmado. CICR: situación catastrófica."},
    "804":{name:"🇺🇦 UCRANIA",fecha:"EN CURSO",c:"#ff8800",icon:"⚔️",det:"Guerra con Rusia año 5. Ucrania ayuda a EE.UU. con análisis técnico de drones Shahed iraníes. Zelenski: ya es la Tercera Guerra Mundial. Recibe mínima ayuda occidental."},
    "643":{name:"🇷🇺 RUSIA ⚠️",fecha:"19 MAR",c:"#ff4400",icon:"🕵️",det:"DÍA 21 — Brent $115: ingresos máximos históricos. Sigue suministrando inteligencia a Irán sobre posiciones navales de EE.UU. Ucrania en el olvido. Putin: orden multipolar avanza."},
    "682":{name:"🇸🇦 ARABIA SAUDITA",fecha:"19 MAR",c:"#ff9900",icon:"🛢️",det:"DÍA 21 — Misiles iraníes atacaron instalaciones energéticas saudíes en respuesta a South Pars. Ras Tanura sigue cerrada. Campo Shaybah bajo amenaza directa. Pérdidas económicas superan los $30B."},
    "634":{name:"🇶🇦 QATAR",fecha:"19 MAR",c:"#ff8800",icon:"🛢️",det:"DÍA 21 — Irán atacó Ras Laffan. 17% de capacidad LNG dañada: $20B pérdidas anuales. Qatar EXPULSÓ agregados militares iraníes (24h para salir). Mayor escalada diplomática del Golfo en décadas."},
    "156":{name:"🇨🇳 CHINA",fecha:"19 MAR",c:"#ffcc00",icon:"⚠️",det:"DÍA 21 — Alarmada por ataque a South Pars: China es el mayor comprador de gas iraní. Xi convocó reunión de emergencia. Wang Yi medía activamente. Sigue comprando petróleo con descuento."},
    "792":{name:"🇹🇷 TURQUÍA",fecha:"19 MAR",c:"#ffcc00",icon:"🛡️",det:"DÍA 21 — Erdogan intensificó esfuerzos mediadores. Única vía de diálogo con Irán tras expulsión de embajadores de Qatar. OTAN: Artículo 4 activo, Artículo 5 en debate."},
    "356":{name:"🇮🇳 INDIA",fecha:"19 MAR",c:"#ffaa44",icon:"⚠️",det:"DÍA 21 — 24,000+ ciudadanos evacuados de Irán y el Golfo. Rupia en mínimos históricos. Brent $115: India importa 80% de su petróleo. Modi llamó a Trump pidiendo corredor humanitario."},
    "484":{name:"🇲🇽 MÉXICO",fecha:"19 MAR",c:"#88cc00",icon:"📊",det:"DÍA 21 — Gasolina +28% (Brent $115). Peso >19/USD. Aranceles Trump 35%. Sarampión 7 estados. South Pars elevó precios energéticos adicional 8%. FMI: recesión confirmada Q3 2026. Banxico subió tasas emergencia 75 puntos base."},
    "826":{name:"🇬🇧 UK",fecha:"19 MAR",c:"#4466ff",icon:"💷",det:"Aranceles Trump 25%. Libra perdió 3.5%. Starmer busca acuerdo bilateral urgente. Bases en Chipre usadas. Economía bajo doble presión."},
    "250":{name:"🇫🇷 FRANCIA",fecha:"19 MAR",c:"#4466ff",icon:"⚔️",det:"Charles de Gaulle reposicionado al Mediterráneo oriental. Macron propuso reunión de emergencia del G7. Elecciones anticipadas en mayo con Le Pen liderando al 36%."},
    "276":{name:"🇩🇪 ALEMANIA",fecha:"19 MAR",c:"#4488ff",icon:"📉",det:"DAX cayó 17% acumulado. Brent $115 agrava crisis energética. Merz propone fondo de emergencia €50B. Recesión técnica confirmada. Exportaciones de manufactura en caída libre."},
    "392":{name:"🇯🇵 JAPÓN",fecha:"19 MAR",c:"#ff3344",icon:"📉",det:"Tokio cayó 16% acumulado. Importa 90% del Golfo. South Pars atacado amenaza el LNG japonés. Toyota redujo producción 30%. Kishida convocó reunión de crisis."},
  },
  disease:{
    "484":{name:"🇲🇽 MÉXICO 🔴",fecha:"MAR 2026",c:"#ff2200",icon:"🦠",det:"9,074 casos sarampión. 7 estados focos rojos: Jalisco, Colima, Chiapas, Sinaloa, Nayarit, Tabasco y CDMX. OPS alerta especial por Mundial 2026. Niños 1-4 años los más afectados (71%). Llama al 800-00-44800."},
    "840":{name:"🇺🇸 EE.UU.",fecha:"MAR 2026",c:"#ffaa00",icon:"🦠",det:"Triple amenaza: H5N1 en 47 estados bovinos, primera transmisión humana confirmada 2026. Mpox clade I — 4 casos sin historial de viaje. Sarampión vinculado al brote de México."},
    "180":{name:"🇨🇩 CONGO",fecha:"EN CURSO",c:"#ff6600",icon:"🦠",det:"Epicentro mundial mpox. Clade Ib más transmisible. 100K+ casos totales. OMS emergencia global activa 2024, aún vigente."},
    "356":{name:"🇮🇳 INDIA",fecha:"ENE 2026",c:"#ff4400",icon:"🦠",det:"5 casos Nipah en Kerala. 100 en cuarentena. Mortalidad hasta 70%. Sin tratamiento específico. OMS Priority Pathogen."},
    "76":{name:"🇧🇷 BRASIL",fecha:"EN CURSO",c:"#ff6600",icon:"🦠",det:"Año récord dengue. 5M casos, 5,000 muertes. Serotipo DENV-3 reemergente. Colapso hospitalario en São Paulo y Río."},
    "156":{name:"🇨🇳 CHINA",fecha:"MAR 2026",c:"#ff4400",icon:"🦠",det:"COVID XEC detectada. OMS monitorea. Influenza H3N2 en circulación intensa. Vigilancia epidemiológica reforzada."},
  },
  climate:{
    "840":{name:"🇺🇸 TORNADOS 🌪️",fecha:"MAR 2026",c:"#aa44ff",icon:"🌪️",det:"23 tornados en 24 horas en Tornado Alley. Oklahoma, Kansas y Texas. Tres EF4 a 280 km/h. 8 muertos, 140 heridos. Vórtice polar desestabilizado."},
    "356":{name:"🇮🇳 INDIA 🔥",fecha:"EN CURSO",c:"#ff2200",icon:"🔥",det:"Ola de calor histórica. 47 a 51 grados Celsius. 3,200 muertes. Récord absoluto de temperatura. Alerta roja en 8 estados. Escasez de agua crítica."},
    "36":{name:"🇦🇺 AUSTRALIA 🔥",fecha:"EN CURSO",c:"#ff3300",icon:"🔥",det:"Mega incendios en Nueva Gales del Sur y Victoria. 2.1 millones de hectáreas quemadas. 12 muertos. AQI 380 en Sídney. 15,000 evacuados."},
    "76":{name:"🇧🇷 BRASIL 🌊",fecha:"EN CURSO",c:"#0055ff",icon:"🌊",det:"Inundaciones devastadoras en Rio Grande do Sul. 200,000 evacuados. Lluvias 300% sobre lo normal."},
    "392":{name:"🇯🇵 JAPÓN 🌋",fecha:"EN CURSO",c:"#ffaa00",icon:"🌋",det:"Alta sismicidad activa. Múltiples M5+ esta semana. Volcán Sakurajima en actividad elevada. Evacuaciones preventivas."},
    "484":{name:"🇲🇽 MÉXICO 🌀❄️",fecha:"MAR 2026",c:"#8844ff",icon:"🧊",det:"Frente Frío 39 activo. Nieve posible en Nevado de Toluca y Sierra Nevada. Temperatura mínima 3-5°C en el Valle de México. Vientos fuertes."},
    "124":{name:"🇨🇦 CANADÁ 🧊",fecha:"MAR 2026",c:"#00ccff",icon:"🧊",det:"Frente frío ártico. -35°C en Manitoba y Saskatchewan. Vórtice polar activo. Autopistas cerradas."},
  },
  news:{
    "840":{name:"🇺🇸 EE.UU.",fecha:"19 MAR",c:"#ff6600",icon:"💰",det:"DÍA 21 — Joe Kent renunció: guerra empezó por presión israelí sin inteligencia real. F-35 dañado. 13 soldados muertos. Costo $20B+. Aranceles 25% a Europa en vigor. Brent $115 golpea economía."},
    "364":{name:"🇮🇷 IRÁN",fecha:"19 MAR",c:"#ff4444",icon:"💥",det:"DÍA 21 — Respondió South Pars con misiles al Golfo. 4,800+ militares + 1,444+ civiles. Internet 480+ horas. 29/31 provincias bajo conflicto activo."},
    "682":{name:"🇸🇦 SAUDI",fecha:"19 MAR",c:"#ffaa00",icon:"🛢️",det:"Misiles iraníes atacaron instalaciones energéticas. Ras Tanura cerrada. Shaybah bajo amenaza. Pérdidas $30B+."},
    "634":{name:"🇶🇦 QATAR",fecha:"19 MAR",c:"#ff8800",icon:"🛢️",det:"Ras Laffan atacado. -17% LNG mundial: $20B pérdidas anuales. Qatar expulsó agregados militares iraníes en 24 horas."},
    "276":{name:"🇩🇪 ALEMANIA",fecha:"19 MAR",c:"#4488ff",icon:"📉",det:"DAX -17% acumulado. Brent $115 agrava crisis. Fondo de emergencia €50B. Recesión técnica confirmada."},
    "156":{name:"🇨🇳 CHINA",fecha:"19 MAR",c:"#ffcc00",icon:"⚠️",det:"Alarmada por South Pars: mayor comprador gas iraní. Xi reunión emergencia. Wang Yi media activamente."},
    "643":{name:"🇷🇺 RUSIA",fecha:"19 MAR",c:"#ff7700",icon:"📈",det:"Brent $115: ingresos máximos históricos. Inteligencia a Irán. Ucrania olvidada por occidente."},
    "76":{name:"🇧🇷 BRASIL",fecha:"19 MAR",c:"#44ffaa",icon:"🌿",det:"Brasil intenta mediar. Exportaciones de petróleo y soja aumentan. Real subió 4%. Lula propuso G20 emergencia."},
    "826":{name:"🇬🇧 UK",fecha:"19 MAR",c:"#4466ff",icon:"💷",det:"Aranceles Trump 25%. Libra -3.5%. Starmer busca acuerdo bilateral urgente con EE.UU."},
    "392":{name:"🇯🇵 JAPÓN",fecha:"19 MAR",c:"#ff3344",icon:"📉",det:"Tokio -16% acumulado. South Pars amenaza LNG japonés. Toyota -30% producción. Catástrofe energética."},
    "484":{name:"🇲🇽 MÉXICO",fecha:"19 MAR",c:"#ffaa44",icon:"💱",det:"Gasolina +28%. Peso >19/USD. Aranceles 35% Trump. Sarampión 7 estados. FMI: recesión Q3 2026 confirmada. Banxico +75bp emergencia."},
    "356":{name:"🇮🇳 INDIA",fecha:"19 MAR",c:"#ffaa44",icon:"⚠️",det:"24K ciudadanos evacuados. Rupia mínimos. Brent $115 impacto devastador. Modi llamó a Trump."},
  },
};

// ═══════════════════════════════════════════════════════════════════
// ✅ CARRIERS Y ATTACK_ROUTES — ANTES DE LOS HOOKS (FIX CRÍTICO)
// ═══════════════════════════════════════════════════════════════════
const CARRIERS=[
  {id:"ford",name:"USS FORD",flag:"🇺🇸",pais:"USA",lat:22.8,lng:61.5,dlat:0.008,dlng:-0.010,det:"USS Gerald R. Ford CVN-78. Mar Arábigo occidental. F-35C activos contra objetivos iraníes. El más avanzado del mundo."},
  {id:"ike",name:"USS IKE",flag:"🇺🇸",pais:"USA",lat:13.8,lng:54.2,dlat:0.006,dlng:0.007,det:"USS Eisenhower CVN-69. Golfo de Adén. Interceptando drones iraníes."},
  {id:"tr",name:"USS ROSVLT",flag:"🇺🇸",pais:"USA",lat:18.2,lng:58.5,dlat:0.009,dlng:-0.007,det:"USS Theodore Roosevelt CVN-71. Mar de Omán. Bloquea salidas iraníes al Índico."},
  {id:"linc",name:"USS LINCOLN",flag:"🇺🇸",pais:"USA",lat:13.1,lng:48.8,dlat:0.006,dlng:0.005,det:"USS Lincoln CVN-72. Mar Rojo sur. Escoltando rutas de suministro."},
  {id:"dg",name:"CHARLES D.G.",flag:"🇫🇷",pais:"FRANCE",lat:35.2,lng:26.1,dlat:-0.004,dlng:0.009,det:"Charles de Gaulle R91. Mediterráneo oriental. Apoyo a defensa de Chipre."},
];

const ATTACK_ROUTES=[
  {from:{lat:32.4,lng:53.7},to:{lat:31.0,lng:34.9},col:"#ff4400",w:1.2},
  {from:{lat:31.0,lng:34.9},to:{lat:32.4,lng:53.7},col:"#4488ff",w:1.2},
  {from:{lat:22.8,lng:61.5},to:{lat:26.6,lng:56.5},col:"#4488ff",w:1.0},
  {from:{lat:32.4,lng:53.7},to:{lat:26.2,lng:50.5},col:"#ff6600",w:1.0},
  {from:{lat:32.4,lng:53.7},to:{lat:25.3,lng:51.5},col:"#ff6600",w:1.0},
  {from:{lat:38,lng:-97},to:{lat:32.4,lng:53.7},col:"#4488ff",w:0.8},
];

// ═══════════════════════════════════════════════════════════════════
// BASE DATA POINTS
// ═══════════════════════════════════════════════════════════════════
const BASE_WAR=[
  {id:"usa",name:"EE.UU.",lat:38,lng:-97,c:"#ff2020",s:5,st:"guerra",icon:"⚔️",conn:["iran"],fecha:"DÍA 21",det:"DÍA 21 — 13 soldados muertos. 7,000+ objetivos destruidos. Joe Kent renunció. F-35 dañado — primera vez en la historia. Costo $20B+."},
  {id:"iran",name:"IRÁN",lat:32.4,lng:53.7,c:"#ff1a1a",s:5,st:"guerra",icon:"💥",conn:["israel","gulf"],fecha:"DÍA 21",det:"DÍA 21 — 1,444+ civiles / 4,800+ militares muertos. Internet 480+ horas apagado. Respondió South Pars con misiles al Golfo. 29/31 provincias bajo conflicto."},
  {id:"israel",name:"ISRAEL",lat:31,lng:34.9,c:"#ff1a1a",s:5,st:"guerra",icon:"⚔️",conn:["lebanon"],fecha:"DÍA 21",det:"DÍA 21 — Atacó South Pars. Asesinó a Larijani, Khatib y Soleimani. Trump: actuó por enojo. Fuentes israelíes: coordinado con EE.UU."},
  {id:"south_pars",name:"SOUTH PARS 🔥
¡ATACADO!",lat:27.7,lng:51.6,c:"#ff0000",s:5,st:"critico",icon:"🔥",pulse:true,fecha:"DÍA 20",det:"DÍA 20 — Israel atacó South Pars, el MAYOR CAMPO DE GAS DEL MUNDO. Trump: Israel actuó por enojo. Irán respondió con misiles contra Qatar, Arabia Saudita y Emiratos. Brent sube a $115. Qatar perdió 17% capacidad LNG — $20B pérdidas anuales."},
  {id:"fordow",name:"FORDOW ☢️
ATACADA",lat:34.6,lng:51.1,c:"#ff8800",s:4,st:"critico",icon:"☢️",fecha:"DÍA 12",det:"FORDOW ATACADA DÍA 12 — Primera vez en la historia. Israel usó GBU-57 a 80m de profundidad. IAEA confirmó daños. Enriquecimiento al 60% interrumpido."},
  {id:"f35",name:"F-35 ✈️
1ER DAÑADO",lat:30.5,lng:56.8,c:"#ff4400",s:5,st:"critico",icon:"✈️",pulse:true,fecha:"DÍA 20",det:"DÍA 20 — F-35 de EE.UU. dañado por fuego iraní durante misión de combate. PRIMERA VEZ EN LA HISTORIA que un F-35 es alcanzado en combate. IRGC publicó el video. Aterrizaje de emergencia exitoso."},
  {id:"lebanon",name:"LÍBANO",lat:33.9,lng:35.5,c:"#ff4444",s:4,st:"guerra",icon:"🔴",fecha:"DÍA 21",det:"600+ muertos: 100+ niños. Hezbollah en su punto más débil desde 2006. Colapso humanitario confirmado. CICR: situación catastrófica."},
  {id:"ukraine",name:"UCRANIA",lat:48.4,lng:31.2,c:"#ff8800",s:4,st:"guerra",icon:"⚔️",conn:["russia"],fecha:"EN CURSO",det:"Guerra con Rusia año 5. Zelenski: ya es la Tercera Guerra Mundial. Ayuda occidental en mínimos."},
  {id:"russia",name:"RUSIA
⚠️INTEL",lat:61.5,lng:105,c:"#ff4400",s:4,st:"activo",icon:"🕵️",fecha:"19 MAR",det:"DÍA 21 — Brent $115: ingresos máximos. Sigue dando coordenadas navales a Irán. Ucrania olvidada. Putin: orden multipolar avanza."},
  {id:"gulf",name:"GOLFO
🔴CRISIS",lat:24.5,lng:51.2,c:"#ff6600",s:5,st:"atacado",icon:"🚢",pulse:true,fecha:"19 MAR",det:"DÍA 21 — Irán lanzó misiles contra Qatar (Ras Laffan), Arabia Saudita y Emiratos en respuesta a South Pars. Qatar expulsa embajadores iraníes. 350+ petroleros atrapados."},
  {id:"ormuz",name:"ORMUZ
-95% TRÁFICO",lat:26.6,lng:56.5,c:"#ff8800",s:5,st:"critico",icon:"🚢",fecha:"19 MAR",det:"DÍA 21 — Tráfico -95%. 350+ petroleros atrapados. South Pars atacado: Brent $115. Analistas: guerra golpea la plomería del sistema energético global."},
  {id:"school",name:"ESCUELA
168 NIÑAS",lat:27.5,lng:55,c:"#ff2200",s:5,st:"critico",icon:"⚠️",fecha:"DÍA 1/12",det:"Strike del Día 1 mató 168 niñas. Hegseth confirmó error de targeting (Día 12). Pentágono investiga. Joe Kent citó esta acción en su renuncia."},
  {id:"turkey",name:"TURQUÍA
🛡️OTAN",lat:39,lng:35,c:"#ffcc00",s:3,st:"tension",icon:"🛡️",fecha:"19 MAR",det:"DÍA 21 — Erdogan intensificó mediación. Única vía de diálogo con Irán. OTAN: Artículo 4 activo, Artículo 5 en debate."},
  {id:"china",name:"CHINA
⚠️SOUTH PARS",lat:35,lng:104,c:"#ffcc00",s:3,st:"tension",icon:"⚠️",fecha:"19 MAR",det:"DÍA 21 — Alarmada: China es el mayor comprador de gas iraní. Xi convocó reunión emergencia. Wang Yi media activamente."},
  {id:"pak",name:"PAKISTÁN",lat:30.4,lng:69.3,c:"#ff5500",s:4,st:"guerra",icon:"⚔️",conn:["afg"],fecha:"DÍA 8+",det:"Operación Ghazab Lil Haq en curso. 481+ afganos muertos. Bagram destruida. Potencia nuclear en guerra activa."},
];

const BASE_DISEASE=[
  {id:"saramp",name:"SARAMPIÓN MX",lat:19.4,lng:-99.1,c:"#ff2200",s:4,st:"alerta",icon:"🦠",pulse:true,fecha:"20 MAR",det:"9,074 casos. 7 estados focos rojos. OPS alerta Mundial 2026. Llama 800-00-44800."},
  {id:"mpox",name:"MPOX CONGO",lat:0.3,lng:25.5,c:"#ff6600",s:4,st:"activo",icon:"🦠",pulse:true,fecha:"EN CURSO",det:"100K+ casos. Clade Ib. OMS emergencia global activa."},
  {id:"h5n1",name:"H5N1 USA",lat:39.5,lng:-98,c:"#ffaa00",s:4,st:"alerta",icon:"🦠",pulse:true,fecha:"EN CURSO",det:"47 estados bovinos. 1ra transmisión humana 2026 confirmada."},
  {id:"nipah",name:"NIPAH INDIA",lat:10.5,lng:76.2,c:"#cc0000",s:4,st:"critico",icon:"🦠",pulse:true,fecha:"ENE 2026",det:"5 casos Kerala. Mortalidad 70%. 100 cuarentena. Sin tratamiento específico."},
  {id:"dengue",name:"DENGUE BRASIL",lat:-15,lng:-55,c:"#ff6600",s:4,st:"activo",icon:"🦠",pulse:false,fecha:"EN CURSO",det:"5M casos, 5,000 muertes. Serotipo DENV-3. Colapso hospitalario São Paulo."},
];

const BASE_CLIMATE=[
  {id:"heat",name:"OLA CALOR
INDIA 🔥",lat:26,lng:80,c:"#ff2200",s:5,st:"extremo",icon:"🔥",pulse:true,fecha:"EN CURSO",det:"47-51°C. 3,200 muertes. Récord absoluto de temperatura. 8 estados alerta roja."},
  {id:"tornado",name:"TORNADOS
USA 🌪️",lat:36,lng:-97,c:"#aa44ff",s:4,st:"activo",icon:"🌪️",pulse:true,fecha:"MAR 2026",det:"23 tornados 24h. 3 EF4 a 280 km/h. 8 muertos, 140 heridos."},
  {id:"cold",name:"FRENTE FRÍO 39
MÉXICO 🧊",lat:23,lng:-101,c:"#00ccff",s:3,st:"activo",icon:"🧊",pulse:true,fecha:"HOY",det:"Frente Frío 39 activo hoy. Nieve posible Nevado de Toluca. Mínimas 3-5°C CDMX."},
  {id:"fire_aus",name:"INCENDIOS
AUSTRALIA 🔥",lat:-33,lng:149,c:"#ff3300",s:4,st:"extremo",icon:"🔥",pulse:false,fecha:"EN CURSO",det:"2.1M hectáreas. 12 muertos. AQI 380 Sídney. 15K evacuados."},
  {id:"flood_br",name:"INUNDACIONES
BRASIL 🌊",lat:-29,lng:-51,c:"#0055ff",s:4,st:"activo",icon:"🌊",pulse:false,fecha:"EN CURSO",det:"200,000 evacuados. Rio Grande do Sul. Lluvias 300% sobre normal."},
];

const BASE_NEWS=[
  {id:"south_pars_n",name:"SOUTH PARS
🔥 ATACADO",lat:27.7,lng:51.6,c:"#ff0000",s:5,st:"critico",icon:"🔥",pulse:true,fecha:"19 MAR",det:"DÍA 21 — Israel atacó South Pars, mayor campo de gas del mundo. Brent $115. Qatar -17% LNG. Irán respondió con misiles al Golfo. El sistema energético global bajo máxima presión."},
  {id:"oil",name:"BRENT $115
⬆️ RÉCORD",lat:26.6,lng:56.5,c:"#ffaa00",s:5,st:"critico",icon:"🛢️",fecha:"19 MAR",det:"DÍA 21 — Brent $115. South Pars atacado. Qatar Ras Laffan dañado. Saudi Aramco Ras Tanura cerrada. Ormuz -95%. Analistas: guerra golpea la plomería del sistema energético global."},
  {id:"peso",name:"PESO MX
>19/USD",lat:19.4,lng:-99.1,c:"#ffaa44",s:4,st:"activo",icon:"💱",fecha:"19 MAR",det:"Peso rebasa 19/USD. Gasolina +28%. FMI: recesión Q3 2026 confirmada. Banxico +75bp emergencia."},
  {id:"kent",name:"JOE KENT
RENUNCIÓ",lat:38.9,lng:-77,c:"#ff6600",s:4,st:"activo",icon:"🕵️",pulse:true,fecha:"19 MAR",det:"DÍA 21 — Joe Kent, alto funcionario de inteligencia nombrado por Trump, renunció: 'Empezamos esta guerra por presión de Israel y su poderoso lobby americano — no había inteligencia real de un gran ataque'."},
  {id:"f35_n",name:"F-35 ✈️
1ER DAÑADO",lat:30.5,lng:56.8,c:"#ff4400",s:4,st:"activo",icon:"✈️",fecha:"19 MAR",det:"DÍA 21 — F-35 dañado por fuego iraní. PRIMERA VEZ EN LA HISTORIA. IRGC publicó el video. Sacude la narrativa de superioridad aérea absoluta."},
  {id:"qatar_n",name:"QATAR
EXPULSA 🇶🇦",lat:25.3,lng:51.5,c:"#ff8800",s:4,st:"activo",icon:"🚫",pulse:true,fecha:"19 MAR",det:"Qatar expulsó a los agregados militares y de seguridad de la embajada iraní, dándoles 24 horas para salir. Ras Laffan dañado: -17% LNG mundial. $20B en pérdidas anuales."},
];

// ═══════════════════════════════════════════════════════════════════
// LIVE HOOKS — ✅ Después de CARRIERS y ATTACK_ROUTES
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
        if(d?.states) setPl(d.states.filter(s=>s[6]&&s[5]&&s[7]>100).slice(0,25).map(s=>({id:s[0],cs:(s[1]||"").trim(),lat:s[6],lng:s[5],alt:s[7],hdg:s[10]||0})));
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
          return{id:e.id,title:e.title,cat:e.categories?.[0]?.title||"",lat:g.coordinates[1],lng:g.coordinates[0],
            icon:e.categories?.[0]?.title?.includes("Wildfire")?"🔥":e.categories?.[0]?.title?.includes("Storm")?"⛈️":e.categories?.[0]?.title?.includes("Flood")?"🌊":e.categories?.[0]?.title?.includes("Volcano")?"🌋":"🛰️"};
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
  const[l,setL]=useState({lat:FALLBACK_LAT,lng:FALLBACK_LNG,municipio:"Ciudad de México",tz:"America/Mexico_City"});
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
      setL({lat,lng,municipio,tz});
    };
    navigator.geolocation.getCurrentPosition(ok,()=>{},{timeout:8000});
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
          n[c.id]={lat:Math.max(10,Math.min(45,p.lat+c.dlat*0.003)),lng:Math.max(20,Math.min(80,p.lng+c.dlng*0.003))};
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
      setAt(p=>[...p,{...rt,id:Date.now()+Math.random(),prog:0}].slice(-14));
    };
    const ti=setInterval(()=>{if(Math.random()>0.45)launch();},2500);
    const ai=setInterval(()=>{setAt(p=>p.map(a=>({...a,prog:Math.min(1,a.prog+0.034)})).filter(a=>a.prog<1));},40);
    return()=>{clearInterval(ti);clearInterval(ai);};
  },[active]);
  return at;
}

function useQuakes(){
  const[q,setQ]=useState([]);
  useEffect(()=>{
    const g=async()=>{
      try{
        const r=await fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/5.0_day.geojson");
        const d=await r.json();
        const now=Date.now();
        setQ(d.features.filter(f=>f.properties.mag>=5.5&&(now-f.properties.time)<48*3600*1000).map(f=>({
          id:f.id,mag:f.properties.mag,place:f.properties.place||"Océano",
          lat:f.geometry.coordinates[1],lng:f.geometry.coordinates[0],
          depth:Math.round(f.geometry.coordinates[2]),time:f.properties.time,
          icon:getQuakeIcon(f.properties.mag)
        })));
      }catch(e){}
    };
    g();
    const iv=setInterval(g,5*60*1000);
    return()=>clearInterval(iv);
  },[]);
  return q;
}

function useHurricanes(){
  const[h,setH]=useState([]);
  const[hp,setHp]=useState({});
  useEffect(()=>{
    const g=async()=>{
      try{
        const r=await fetch("https://www.nhc.noaa.gov/CurrentStorms.json");
        const d=await r.json();
        if(d.activeStorms?.length){
          const a=d.activeStorms.map(s=>({id:s.id,name:s.name||"Storm",kts:parseInt(s.intensity)||65,lat:parseFloat(s.latitudeNumeric)||20,lng:parseFloat(s.longitudeNumeric)||-85,icon:getHurricaneIcon(parseInt(s.intensity)||65)}));
          setH(a);
          setHp(Object.fromEntries(a.map(h=>[h.id,{lat:h.lat,lng:h.lng}])));
        }else{setH([]);setHp({});}
      }catch(e){setH([]);setHp({});}
    };
    g();
    const iv=setInterval(g,30*60*1000);
    return()=>clearInterval(iv);
  },[]);
  return [h,hp];
}

// ═══════════════════════════════════════════════════════════════════
// WEATHER WIDGET
// ═══════════════════════════════════════════════════════════════════
function WeatherWidget({ac,loc}){
  const[wx,setWx]=useState(null);
  useEffect(()=>{
    if(!loc?.lat) return;
    const load=async()=>{
      try{
        const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lng}&current=temperature_2m,weather_code&timezone=auto`);
        const d=await r.json();
        setWx(d);
      }catch(e){}
    };
    load();
    const iv=setInterval(load,10*60*1000);
    return()=>clearInterval(iv);
  },[loc?.lat,loc?.lng]);
  if(!wx?.current) return <div style={{padding:"6px 10px",border:`1px solid ${ac}22`,borderRadius:"6px",background:"rgba(0,0,0,0.6)",fontSize:"7px"}}>📡...</div>;
  const c=wx.current,temp=Math.round(c.temperature_2m),icon=getWeatherIcon(c.weather_code,new Date().getHours()),tc=temp<=0?"#00ccff":temp<=15?"#44aaff":temp<=25?"#44ffaa":temp<=33?"#ffaa00":"#ff4400";
  return(
    <div onClick={()=>speakText(`Temperatura ${temp} grados. ${icon}`)} style={{display:"flex",alignItems:"center",gap:"8px",padding:"6px 12px",border:`1px solid ${ac}33`,borderRadius:"8px",background:"rgba(0,0,0,0.7)",cursor:"pointer"}}>
      <span style={{fontSize:"18px"}}>{icon}</span>
      <span style={{fontSize:"18px",fontWeight:"900",color:tc}}>{temp}°</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CLOCK
// ═══════════════════════════════════════════════════════════════════
function Clock({ac}){
  const[t,setT]=useState(new Date());
  useEffect(()=>{const iv=setInterval(()=>setT(new Date()),1000);return()=>clearInterval(iv);},[]);
  const hh=String(t.getHours()).padStart(2,"0"),mm=String(t.getMinutes()).padStart(2,"0"),ss=String(t.getSeconds()).padStart(2,"0"),blink=t.getSeconds()%2===0;
  return(
    <div onClick={()=>speakText(`La hora es ${t.getHours()} horas con ${t.getMinutes()} minutos.`)} style={{display:"flex",alignItems:"center",gap:"6px",padding:"6px 14px",border:`1px solid ${ac}33`,borderRadius:"8px",background:"rgba(0,0,0,0.7)",cursor:"pointer"}}>
      <span style={{fontSize:"20px"}}>{getTimeIcon()}</span>
      <div style={{fontFamily:"'Courier New',monospace",display:"flex",alignItems:"baseline",gap:"1px"}}>
        <span style={{fontSize:"26px",fontWeight:"900",color:ac}}>{hh}</span>
        <span style={{fontSize:"22px",fontWeight:"900",color:ac,opacity:blink?1:0.1}}>:</span>
        <span style={{fontSize:"26px",fontWeight:"900",color:ac}}>{mm}</span>
        <span style={{fontSize:"13px",color:ac,opacity:blink?0.8:0.1}}>:</span>
        <span style={{fontSize:"13px",color:`${ac}55`}}>{ss}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// WAR PANEL
// ═══════════════════════════════════════════════════════════════════
function WarPanel({carriers,cpos,attacks,planes,quakes}){
  const[tab,setTab]=useState("timeline");
  const timeline=[
    {day:"DÍA 1",date:"28 FEB",col:"#ff2020",ev:"Jamenei muerto. 200+ jets israelíes. 201 iraníes muertos. Guerra comienza.",icon:"💥"},
    {day:"DÍA 12",date:"11 MAR",col:"#ff2020",ev:"🔴 FORDOW ATACADA — PRIMERA VEZ EN LA HISTORIA. GBU-57 bunker buster.",icon:"☢️"},
    {day:"DÍA 17",date:"16 MAR",col:"#ff4400",ev:"Ali Larijani asesinado. Ministro Khatib y Gral Soleimani también eliminados.",icon:"💀"},
    {day:"DÍA 20",date:"19 MAR",col:"#ff0000",ev:"🔥 SOUTH PARS atacado — mayor campo de gas del mundo. Brent $115.",icon:"🔥"},
    {day:"DÍA 21",date:"HOY",col:"#ff2020",ev:`${getTimeIcon()} F-35 dañado 1ª vez historia. Joe Kent renunció. Qatar expulsa iraníes.`,icon:"⚔️",live:true},
  ];
  return(
    <div style={{background:"rgba(2,5,8,0.95)",border:"1px solid #ff202033",borderRadius:"8px",padding:"12px",backdropFilter:"blur(10px)"}}>
      <div style={{display:"flex",gap:"4px",marginBottom:"10px",borderBottom:"1px solid #ff202020",paddingBottom:"8px"}}>
        {[["timeline","📅 TIMELINE"],["carriers","🚢 CARRIERS"],["counter","💥 CONTADOR"],["intel","🕵️ INTEL"]].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:"4px 10px",background:tab===t?"#ff202033":"transparent",border:`1px solid ${tab===t?"#ff2020":"#ff202022"}`,borderRadius:"4px",color:tab===t?"#ff2020":"#ff202066",fontFamily:"'Courier New',monospace",fontSize:"7.5px",cursor:"pointer",letterSpacing:"1px"}}>{l}</button>
        ))}
      </div>
      {tab==="timeline"&&<div style={{display:"flex",flexDirection:"column",gap:"4px",maxHeight:"180px",overflowY:"auto"}}>
        {timeline.map((t,i)=>(
          <div key={i} onClick={()=>speakText(`${t.day}, ${t.date}: ${t.ev}`)} style={{display:"flex",gap:"8px",alignItems:"flex-start",padding:"5px 8px",background:`${t.col}0a`,border:`1px solid ${t.col}22`,borderRadius:"4px",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background=`${t.col}20`} onMouseLeave={e=>e.currentTarget.style.background=`${t.col}0a`}>
            <div style={{minWidth:"52px"}}>
              <div style={{fontSize:"8px",fontWeight:"bold",color:t.col}}>{t.icon} {t.day}</div>
              <div style={{fontSize:"6.5px",color:"rgba(255,255,255,0.3)"}}>{t.date}</div>
            </div>
            <div style={{fontSize:"8.5px",color:"rgba(255,255,255,0.75)",lineHeight:1.5,flex:1}}>{t.ev}</div>
            {t.live&&<div style={{marginLeft:"auto",fontSize:"7px",color:t.col,flexShrink:0}}>🔴 LIVE</div>}
          </div>
        ))}
      </div>}
      {tab==="counter"&&<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"6px"}}>
        {[
          {l:"MUERTOS IRÁN",v:"6,244+",c:"#ff1a1a",sub:"civ+mil",icon:"💀"},
          {l:"SOLDADOS USA",v:"13 ✝",c:"#ff4444",sub:"confirmados",icon:"⚔️"},
          {l:"SOUTH PARS 🔥",v:"ATACADO",c:"#ff0000",sub:"DÍA 20",icon:"🔥"},
          {l:"BRENT",v:"$115",c:"#ffaa00",sub:"en vivo",icon:"🛢️",live:true},
        ].map(s=>(
          <div key={s.l} style={{background:"rgba(0,0,0,0.6)",border:`1px solid ${s.c}22`,borderRadius:"5px",padding:"8px 7px",textAlign:"center"}}>
            <div style={{fontSize:"16px",marginBottom:"4px"}}>{s.icon}</div>
            <div style={{fontSize:"15px",fontWeight:"900",color:s.c,fontFamily:"'Courier New',monospace"}}>{s.v}</div>
            <div style={{fontSize:"6px",color:"rgba(255,255,255,0.25)",letterSpacing:"1px",marginTop:"2px"}}>{s.l}</div>
            <div style={{fontSize:"5.5px",color:`${s.c}66`,marginTop:"2px"}}>{s.sub}</div>
            {s.live&&<div style={{fontSize:"5px",color:s.c,marginTop:"2px"}}>● LIVE</div>}
          </div>
        ))}
      </div>}
      {tab==="carriers"&&<div style={{display:"flex",flexDirection:"column",gap:"4px",maxHeight:"180px",overflowY:"auto"}}>
        {CARRIERS.map(cv=>{
          const pos=cpos[cv.id]||{lat:cv.lat,lng:cv.lng};
          const cc=cv.pais==="FRANCE"?"#4466ff":"#4488ff";
          return(
            <div key={cv.id} onClick={()=>speakText(cv.det)} style={{display:"flex",gap:"8px",alignItems:"center",padding:"5px 8px",background:`${cc}0a`,border:`1px solid ${cc}22`,borderRadius:"4px",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background=`${cc}20`} onMouseLeave={e=>e.currentTarget.style.background=`${cc}0a`}>
              <span style={{fontSize:"16px"}}>{cv.flag}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:"8.5px",fontWeight:"bold",color:cc}}>{cv.name}</div>
                <div style={{fontSize:"7px",color:"rgba(255,255,255,0.4)"}}>{cv.det.split(".")[1]?.trim()||""}</div>
              </div>
              <div style={{fontSize:"7px",color:"rgba(255,255,255,0.3)",fontFamily:"'Courier New',monospace"}}>
                {pos.lat.toFixed(1)}°N {pos.lng.toFixed(1)}°E
              </div>
            </div>
          );
        })}
        {planes.length>0&&<div style={{fontSize:"7px",color:"#00cc88",padding:"4px 8px",borderTop:"1px solid #00cc8822",marginTop:"4px"}}>✈️ {planes.length} aeronaves reales (OpenSky)</div>}
      </div>}
      {tab==="intel"&&<div style={{display:"flex",flexDirection:"column",gap:"4px",maxHeight:"180px",overflowY:"auto"}}>
        {[
          {t:"JOE KENT RENUNCIÓ",d:"Alto funcionario de inteligencia de Trump: 'Empezamos la guerra por presión de Israel sin inteligencia real de ataque'."},
          {t:"F-35 DAÑADO",d:"Primera vez en la historia que un F-35 es alcanzado en combate. IRGC publicó el video del impacto."},
          {t:"RUSIA DA COORDENADAS",d:"Confirmado por 3 fuentes occidentales: Rusia suministra a Irán coordenadas en tiempo real de buques y aviones de EE.UU."},
          {t:"QATAR EXPULSA IRANÍES",d:"Qatar dio 24h a los agregados militares y de seguridad de Irán para abandonar el país. Mayor escalada diplomática."},
        ].map((item,i)=>(
          <div key={i} onClick={()=>speakText(`${item.t}: ${item.d}`)} style={{padding:"6px 8px",background:"rgba(255,100,0,0.06)",border:"1px solid rgba(255,100,0,0.15)",borderRadius:"4px",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,100,0,0.12)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(255,100,0,0.06)"}>
            <div style={{fontSize:"8px",fontWeight:"bold",color:"#ff6600",marginBottom:"2px"}}>🕵️ {item.t}</div>
            <div style={{fontSize:"7.5px",color:"rgba(255,255,255,0.6)",lineHeight:1.4}}>{item.d}</div>
          </div>
        ))}
      </div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// DISEASE PANEL
// ═══════════════════════════════════════════════════════════════════
function DiseasePanel(){
  const[tab,setTab]=useState("outbreak");
  const outbreaks=[
    {name:"SARAMPIÓN 🇲🇽",casos:"9,074",trend:"+12%/sem",risk:"ALTO",c:"#ff2200",mx:true,icon:"🦠🔴"},
    {name:"MPOX CLADE Ib",casos:"100K+",trend:"+8%/sem",risk:"ALTO",c:"#ff6600",icon:"🦠🟠"},
    {name:"H5N1 BOVINOS USA",casos:"47 estados",trend:"PANDÉMICO",risk:"MÁX.",c:"#ffaa00",icon:"🦠"},
    {name:"NIPAH INDIA",casos:"5 confirmados",trend:"ACTIVO",risk:"CRÍTICO",c:"#cc0000",icon:"🦠🔴"},
    {name:"DENGUE BRASIL",casos:"5M+",trend:"+DENV-3",risk:"ALTO",c:"#ff6600",icon:"🦠🟠"},
  ];
  return(
    <div style={{background:"rgba(2,10,5,0.95)",border:"1px solid #ff660033",borderRadius:"8px",padding:"12px",backdropFilter:"blur(10px)"}}>
      <div style={{display:"flex",gap:"4px",marginBottom:"10px",borderBottom:"1px solid #ff660020",paddingBottom:"8px"}}>
        {[["outbreak","🦠 BROTES"],["vaccine","💉 VACUNAS"],["risk","⚠️ RIESGOS"]].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:"4px 10px",background:tab===t?"#ff660033":"transparent",border:`1px solid ${tab===t?"#ff6600":"#ff660022"}`,borderRadius:"4px",color:tab===t?"#ff6600":"#ff660066",fontFamily:"'Courier New',monospace",fontSize:"7.5px",cursor:"pointer",letterSpacing:"1px"}}>{l}</button>
        ))}
      </div>
      {tab==="outbreak"&&<div style={{display:"flex",flexDirection:"column",gap:"3px",maxHeight:"180px",overflowY:"auto"}}>
        {outbreaks.map((o,i)=>(
          <div key={i} onClick={()=>speakText(`${o.name}: ${o.casos} casos. Tendencia ${o.trend}. Nivel de riesgo: ${o.risk}.`)} style={{display:"flex",gap:"8px",padding:"5px 8px",background:`${o.c}0a`,border:`1px solid ${o.c}22`,borderRadius:"4px",cursor:"pointer",alignItems:"center"}} onMouseEnter={e=>e.currentTarget.style.background=`${o.c}1e`} onMouseLeave={e=>e.currentTarget.style.background=`${o.c}0a`}>
            <span style={{fontSize:"16px"}}>{o.icon}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:"8.5px",color:o.c,fontWeight:"bold"}}>{o.name}{o.mx&&<span style={{marginLeft:"4px",fontSize:"6px",background:"#ff2200",color:"#fff",padding:"1px 3px",borderRadius:"2px"}}>MX</span>}</div>
              <div style={{fontSize:"7.5px",color:"rgba(255,255,255,0.5)"}}>{o.casos} · {o.trend}</div>
            </div>
            <div style={{fontSize:"7px",background:`${o.c}22`,color:o.c,padding:"2px 5px",borderRadius:"3px",fontWeight:"bold"}}>{o.risk}</div>
          </div>
        ))}
      </div>}
      {tab==="vaccine"&&<div style={{display:"flex",flexDirection:"column",gap:"4px",maxHeight:"180px",overflowY:"auto"}}>
        {[
          {v:"Sarampión (SRP)",status:"DISPONIBLE MX",c:"#44ff88",det:"Triple viral. Gratis en centros de salud. Llama 800-00-44800."},
          {v:"Mpox (MVA-BN)",status:"LIMITADA",c:"#ffaa00",det:"Solo para grupos de alto riesgo. Prioridad personal de salud."},
          {v:"Influenza H5",status:"EN DESARROLLO",c:"#ff6600",det:"FDA en revisión acelerada. Estimado Q3 2026 si pandemia se confirma."},
          {v:"Nipah",status:"NO DISPONIBLE",c:"#ff2200",det:"Sin vacuna aprobada. Solo manejo de contactos y cuarentena."},
        ].map((item,i)=>(
          <div key={i} onClick={()=>speakText(`${item.v}: ${item.status}. ${item.det}`)} style={{padding:"6px 8px",background:`${item.c}0a`,border:`1px solid ${item.c}22`,borderRadius:"4px",cursor:"pointer"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"2px"}}>
              <div style={{fontSize:"8px",fontWeight:"bold",color:"rgba(255,255,255,0.8)"}}>💉 {item.v}</div>
              <div style={{fontSize:"6.5px",background:`${item.c}22`,color:item.c,padding:"1px 5px",borderRadius:"3px"}}>{item.status}</div>
            </div>
            <div style={{fontSize:"7px",color:"rgba(255,255,255,0.4)"}}>{item.det}</div>
          </div>
        ))}
      </div>}
      {tab==="risk"&&<div style={{display:"flex",flexDirection:"column",gap:"4px",maxHeight:"180px",overflowY:"auto"}}>
        <div style={{padding:"8px",background:"rgba(255,34,0,0.08)",border:"1px solid rgba(255,34,0,0.2)",borderRadius:"6px",marginBottom:"4px"}}>
          <div style={{fontSize:"8px",color:"#ff2200",fontWeight:"bold",marginBottom:"4px"}}>⚠️ RIESGO MUNDIAL 2026</div>
          <div style={{fontSize:"7.5px",color:"rgba(255,255,255,0.6)",lineHeight:1.5}}>México tiene sedes del Mundial 2026. Con 9,074 casos activos de sarampión, la OPS teme propagación internacional masiva durante el torneo. Se requiere vacunación antes de junio.</div>
        </div>
        {[
          {r:"PANDEMIA H5N1",pct:35,c:"#ffaa00",d:"47 estados en EE.UU. con brote bovino activo."},
          {r:"SARAMPIÓN GLOBAL",pct:55,c:"#ff2200",d:"México + Mundial 2026 = propagación masiva posible."},
          {r:"MPOX CLADE Ib",pct:42,c:"#ff6600",d:"Transmisión humana sostenida confirmada."},
        ].map((item,i)=>(
          <div key={i} style={{padding:"5px 8px",background:`${item.c}0a`,border:`1px solid ${item.c}22`,borderRadius:"4px"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"3px"}}>
              <span style={{fontSize:"7.5px",color:item.c,fontWeight:"bold"}}>{item.r}</span>
              <span style={{fontSize:"7px",color:item.c}}>{item.pct}%</span>
            </div>
            <div style={{background:"rgba(255,255,255,0.05)",borderRadius:"2px",height:"3px",marginBottom:"3px"}}>
              <div style={{width:`${item.pct}%`,height:"100%",background:item.c,borderRadius:"2px"}}/>
            </div>
            <div style={{fontSize:"6.5px",color:"rgba(255,255,255,0.4)"}}>{item.d}</div>
          </div>
        ))}
      </div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CLIMATE PANEL
// ═══════════════════════════════════════════════════════════════════
function ClimatePanel({quakes,hurricanes,hurPos,eonet}){
  const[tab,setTab]=useState("quakes");
  const maxMag=quakes.length?Math.max(...quakes.map(q=>q.mag)):7;
  return(
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
          <div style={{display:"flex",flexDirection:"column",gap:"3px",maxHeight:"150px",overflowY:"auto"}}>
            {quakes.sort((a,b)=>b.mag-a.mag).map(q=>{
              const mc=magCol(q.mag),icon=getQuakeIcon(q.mag),pct=((q.mag-5.5)/2.5)*100;
              return(
                <div key={q.id} onClick={()=>speakText(`Sismo magnitud ${q.mag.toFixed(1)} en ${q.place}. Profundidad ${q.depth} kilómetros.`)} style={{display:"flex",gap:"8px",alignItems:"center",padding:"4px 8px",background:`${mc}0a`,border:`1px solid ${mc}22`,borderRadius:"4px",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background=`${mc}1e`} onMouseLeave={e=>e.currentTarget.style.background=`${mc}0a`}>
                  <span style={{fontSize:"14px"}}>{icon}</span>
                  <div style={{minWidth:"32px",fontSize:"11px",fontWeight:"900",color:mc}}>M{q.mag.toFixed(1)}</div>
                  <div style={{flex:1}}>
                    <div style={{width:`${pct}%`,minWidth:"2px",height:"3px",background:mc,borderRadius:"2px",marginBottom:"2px"}}/>
                    <div style={{fontSize:"7.5px",color:"rgba(255,255,255,0.6)"}}>{q.place.substring(0,45)}</div>
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
          const pos=hurPos[h.id]||{lat:h.lat,lng:h.lng},hc=hurCol(h.kts),icon=getHurricaneIcon(h.kts),dist=haversine(pos.lat,pos.lng,23.6,-102.5);
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
      {tab==="eonet"&&<div>
        {eonet.length===0&&<div style={{textAlign:"center",color:"rgba(255,255,255,0.2)",fontSize:"8px",padding:"20px"}}>🛰️ Cargando datos NASA EONET...</div>}
        <div style={{display:"flex",flexDirection:"column",gap:"3px",maxHeight:"150px",overflowY:"auto"}}>
          {eonet.map((e,i)=>(
            <div key={i} onClick={()=>speakText(`${e.title}. Tipo: ${e.cat}.`)} style={{display:"flex",gap:"8px",padding:"5px 8px",background:"rgba(255,119,0,0.06)",border:"1px solid rgba(255,119,0,0.15)",borderRadius:"4px",cursor:"pointer",alignItems:"center"}} onMouseEnter={ev=>ev.currentTarget.style.background="rgba(255,119,0,0.12)"} onMouseLeave={ev=>ev.currentTarget.style.background="rgba(255,119,0,0.06)"}>
              <span style={{fontSize:"16px"}}>{e.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:"7.5px",color:"#ff7700",fontWeight:"bold"}}>{e.title.substring(0,45)}</div>
                <div style={{fontSize:"6.5px",color:"rgba(255,255,255,0.4)"}}>{e.cat}</div>
              </div>
            </div>
          ))}
        </div>
      </div>}
      {tab==="extremos"&&<div style={{display:"flex",flexDirection:"column",gap:"4px",maxHeight:"180px",overflowY:"auto"}}>
        {[
          {l:"🔥 INDIA OLA CALOR",v:"51°C",sub:"3,200 muertes. Récord mundial.",c:"#ff2200"},
          {l:"🌪️ TORNADOS USA",v:"23 en 24h",sub:"3 EF4. 8 muertos. Oklahoma.",c:"#aa44ff"},
          {l:"🔥 INCENDIOS AUS",v:"2.1M ha",sub:"AQI 380 Sídney. 15K evacuados.",c:"#ff3300"},
          {l:"🌊 INUNDACIONES BR",v:"200K evac.",sub:"Rio Grande do Sul. 300% lluvia.",c:"#0055ff"},
          {l:"🧊 FRENTE FRÍO MX",v:"3-5°C",sub:"Frente Frío 39 hoy. Nieve posible.",c:"#00ccff"},
        ].map((s,i)=>(
          <div key={i} onClick={()=>speakText(`${s.l}: ${s.v}. ${s.sub}`)} style={{display:"flex",gap:"8px",alignItems:"center",padding:"5px 8px",background:`${s.c}0a`,border:`1px solid ${s.c}22`,borderRadius:"4px",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background=`${s.c}1e`} onMouseLeave={e=>e.currentTarget.style.background=`${s.c}0a`}>
            <div style={{fontSize:"7.5px",color:s.c,fontWeight:"bold",flex:1}}>{s.l}</div>
            <div style={{fontSize:"11px",fontWeight:"900",color:s.c,minWidth:"50px",textAlign:"right"}}>{s.v}</div>
            <div style={{fontSize:"6.5px",color:"rgba(255,255,255,0.35)",minWidth:"90px"}}>{s.sub}</div>
          </div>
        ))}
      </div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// NEWS PANEL
// ═══════════════════════════════════════════════════════════════════
function NewsPanel({fx,crypto}){
  const[tab,setTab]=useState("markets");
  const[mxn,setMxn]=useState("");
  const[usdAmt,setUsdAmt]=useState("100");

  const invest=[
    {a:"✅ XOM/CVX — Exxon/Chevron",r:"COMPRAR",c:"#44ff88",d:"Petróleo a $115: subida directa"},
    {a:"✅ GLD/IAU — Oro físico",r:"COMPRAR",c:"#44ff88",d:"Máximo histórico. Refugio máximo"},
    {a:"✅ CETES 28d México",r:"GUARDAR",c:"#44ffaa",d:"12% TAE. Libre de riesgo en MXN"},
    {a:"✅ SLV — Plata",r:"COMPRAR",c:"#44ff88",d:"Sube con el oro en crisis"},
    {a:"⚠️ BTC",r:"ESPECULAR",c:"#ffaa00",d:"Solo si toleras -40% volatilidad"},
    {a:"❌ Cambiar USD→MXN ahora",r:"EVITAR",c:"#ff4400",d:"Peso en mínimos >19/USD"},
    {a:"❌ Pemex",r:"EVITAR",c:"#ff4400",d:"Alto riesgo. Deuda sistémica"},
    {a:"❌ Aerolíneas",r:"EVITAR",c:"#ff4400",d:"Combustible +28%. Rutas cerradas"},
  ];

  return(
    <div style={{background:"rgba(5,4,0,0.95)",border:"1px solid #ffcc0033",borderRadius:"8px",padding:"12px",backdropFilter:"blur(10px)"}}>
      <div style={{display:"flex",gap:"4px",marginBottom:"10px",borderBottom:"1px solid #ffcc0020",paddingBottom:"8px"}}>
        {[["markets","📊 MERCADOS"],["energy","🛢️ ENERGÍA"],["invertir","📈 INVERTIR"],["conversor","💱 CONVERSOR"]].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:"4px 10px",background:tab===t?"#ffcc0033":"transparent",border:`1px solid ${tab===t?"#ffcc00":"#ffcc0022"}`,borderRadius:"4px",color:tab===t?"#ffcc00":"#ffcc0066",fontFamily:"'Courier New',monospace",fontSize:"7.5px",cursor:"pointer",letterSpacing:"1px"}}>{l}</button>
        ))}
      </div>
      {tab==="markets"&&<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"5px"}}>
        {[
          {l:"USD/MXN",v:fx?`$${fx}`:"...",c:"#88cc00",sub:fx?`>${parseFloat(fx)>19?"RIESGO":"ESTABLE"}`:"cargando",live:!!fx,icon:"💱"},
          {l:"BITCOIN",v:crypto?.bitcoin?`$${Math.round(crypto.bitcoin.usd/1000)}K`:"...",c:"#ffdd00",sub:crypto?.bitcoin?`${crypto.bitcoin.usd_24h_change>0?"+":""}${crypto.bitcoin.usd_24h_change?.toFixed(1)}%`:"cargando",live:!!crypto?.bitcoin,icon:"₿"},
          {l:"BRENT",v:"~$115",c:"#ffaa00",sub:"South Pars+",live:true,icon:"🛢️"},
          {l:"NASDAQ",v:"-3%",c:"#ff3344",sub:"hoy",live:true,icon:"📉"},
        ].map(s=>(
          <div key={s.l} onClick={()=>speakText(`${s.l}: ${s.v}. ${s.sub}`)} style={{background:"rgba(0,0,0,0.5)",border:`1px solid ${s.c}22`,borderRadius:"5px",padding:"8px 7px",textAlign:"center",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.04)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(0,0,0,0.5)"}>
            <div style={{fontSize:"18px",marginBottom:"4px"}}>{s.icon}</div>
            <div style={{fontSize:"15px",fontWeight:"900",color:s.c}}>{s.v}</div>
            <div style={{fontSize:"6px",color:"rgba(255,255,255,0.25)",letterSpacing:"1px"}}>{s.l}</div>
            <div style={{fontSize:"6.5px",color:`${s.c}88`,marginTop:"2px"}}>{s.sub}</div>
            {s.live&&<div style={{fontSize:"5px",color:s.c,marginTop:"2px"}}>● LIVE</div>}
          </div>
        ))}
      </div>}
      {tab==="energy"&&<div style={{display:"flex",flexDirection:"column",gap:"4px",maxHeight:"180px",overflowY:"auto"}}>
        {[
          {n:"🛢️ BRENT",v:"~$115",c:"#ffaa00",d:"South Pars atacado + Ormuz -95%. Analistas: $130 si guerra escala más."},
          {n:"⛽ GAS NATURAL",v:"+180%",c:"#ff6600",d:"Qatar LNG force majeure. -17% capacidad Ras Laffan. Europa en crisis."},
          {n:"🏭 SAUDI ARAMCO",v:"CERRADA",c:"#ff8800",d:"Ras Tanura, la mayor refinería del mundo, sigue cerrada. Shaybah bajo amenaza."},
          {n:"🇮🇷 SOUTH PARS",v:"ATACADO",c:"#ff0000",d:"Mayor campo de gas del mundo. Israel lo atacó Día 20. Irán respondió con misiles."},
          {n:"🇲🇽 GASOLINA MX",v:"+28%",c:"#88cc00",d:"Precio más alto en la historia de México. Peso >19/USD agrava el impacto."},
        ].map((item,i)=>(
          <div key={i} onClick={()=>speakText(`${item.n}: ${item.v}. ${item.d}`)} style={{display:"flex",gap:"8px",alignItems:"center",padding:"5px 8px",background:`${item.c}0a`,border:`1px solid ${item.c}22`,borderRadius:"4px",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background=`${item.c}1e`} onMouseLeave={e=>e.currentTarget.style.background=`${item.c}0a`}>
            <div style={{flex:1}}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{fontSize:"8.5px",color:item.c,fontWeight:"bold"}}>{item.n}</span>
                <span style={{fontSize:"9px",fontWeight:"900",color:item.c}}>{item.v}</span>
              </div>
              <div style={{fontSize:"7px",color:"rgba(255,255,255,0.4)",marginTop:"2px"}}>{item.d}</div>
            </div>
          </div>
        ))}
      </div>}
      {tab==="invertir"&&<div style={{display:"flex",flexDirection:"column",gap:"3px",maxHeight:"180px",overflowY:"auto"}}>
        <div style={{fontSize:"7px",color:"rgba(255,204,0,0.6)",marginBottom:"4px",padding:"4px 8px",background:"rgba(255,204,0,0.05)",borderRadius:"4px"}}>💡 Estrategia para crisis energética — clic para escuchar análisis</div>
        {invest.map((item,i)=>(
          <div key={i} onClick={()=>speakText(`${item.a}: ${item.r}. ${item.d}`)} style={{display:"flex",gap:"8px",alignItems:"center",padding:"4px 8px",background:`${item.c}0a`,border:`1px solid ${item.c}1a`,borderRadius:"4px",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background=`${item.c}15`} onMouseLeave={e=>e.currentTarget.style.background=`${item.c}0a`}>
            <div style={{flex:1,fontSize:"7.5px",color:"rgba(255,255,255,0.75)"}}>{item.a}</div>
            <div style={{fontSize:"6.5px",background:`${item.c}22`,color:item.c,padding:"1px 5px",borderRadius:"3px",whiteSpace:"nowrap"}}>{item.r}</div>
          </div>
        ))}
      </div>}
      {tab==="conversor"&&<div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"8px"}}>
          <div>
            <div style={{fontSize:"7px",color:"rgba(255,255,255,0.4)",marginBottom:"3px"}}>💵 USD</div>
            <input type="number" value={usdAmt} onChange={e=>{setUsdAmt(e.target.value);setMxn("");}} placeholder="100" style={{width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,204,0,0.2)",borderRadius:"5px",padding:"7px 10px",color:"#ffcc00",fontFamily:"'Courier New',monospace",fontSize:"14px",outline:"none"}}/>
          </div>
          <div>
            <div style={{fontSize:"7px",color:"rgba(255,255,255,0.4)",marginBottom:"3px"}}>🇲🇽 MXN</div>
            <input type="number" value={mxn} onChange={e=>{setMxn(e.target.value);setUsdAmt("");}} placeholder={fx?`${(100*parseFloat(fx)).toFixed(0)}`:"1,900"} style={{width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(136,204,0,0.2)",borderRadius:"5px",padding:"7px 10px",color:"#88cc00",fontFamily:"'Courier New',monospace",fontSize:"14px",outline:"none"}}/>
          </div>
        </div>
        {fx&&<div style={{textAlign:"center",padding:"8px",background:"rgba(255,255,255,0.03)",borderRadius:"5px"}}>
          <div style={{fontSize:"11px",fontWeight:"900",color:"#ffcc00"}}>${usdAmt||Math.round(parseFloat(mxn||0)/parseFloat(fx))||0} USD = ${mxn||((parseFloat(usdAmt||0)*parseFloat(fx)).toFixed(2))} MXN</div>
          <div style={{fontSize:"7px",color:"rgba(255,255,255,0.3)",marginTop:"3px"}}>Tasa en vivo: 1 USD = ${fx} MXN · Frankfurter API</div>
        </div>}
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
  const[radarAngle,setRadarAngle]=useState(0);
  const[wlive,setWlive]=useState({});

  const loc=useGeoLocation();
  const fx=useFX();
  const crypto=useCrypto();
  const cpos=useMovingCarriers();
  const attacks=useAttacks(mode==="war");
  const planes=useOpenSky(mode==="war");
  const eonet=useEONET(mode==="climate");
  const quakesData=useQuakes();
  const[hurricanes,hurPos]=useHurricanes();

  const ac=ACC[mode],bg=BG[mode],isoM=ISO_COL[mode]||{},mcd=ALL_COUNTRY_DATA[mode]||{};

  // Radar
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
        setGeo({paths:features.map(f=>({id:String(f.id),d:path(f)||""})),borders:path(topo.mesh(world,world.objects.countries,(a,b)=>a!==b)),sphere:path({type:"Sphere"})});
      }catch(e){}
    })();
    return()=>{done=true;};
  },[]);

  // Live weather
  useEffect(()=>{
    const spots=[{k:"india",lat:26.8,lng:80.9},{k:"mexico",lat:19.4,lng:-99.1},{k:"iran",lat:32.4,lng:53.7},{k:"usa",lat:37,lng:-95}];
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

  useEffect(()=>{window.speechSynthesis?.getVoices();return()=>stopSpeech();},[]);

  const xy=useCallback((lat,lng)=>{
    if(!proj) return null;
    return proj([lng,lat]);
  },[proj]);

  const cycleMode=()=>{
    stopSpeech();
    const nm=MODES[(MODES.indexOf(mode)+1)%MODES.length];
    setMode(nm);
    setSel(null);
    setTimeout(()=>speakText(MODE_VOICE[nm],1.0),350);
  };

  const clmPts=[
    ...BASE_CLIMATE,
    ...quakesData.map(q=>({id:`q_${q.id}`,name:`M${q.mag.toFixed(1)}\n${q.place.split(",")[0].substring(0,12).toUpperCase()}`,lat:q.lat,lng:q.lng,c:magCol(q.mag),s:Math.min(5,Math.round(q.mag-3)),st:"extremo",icon:q.icon,pulse:q.mag>=6,fecha:new Date(q.time).toLocaleDateString("es-MX",{day:"2-digit",month:"short"}).toUpperCase(),det:`Sismo M${q.mag.toFixed(1)} en ${q.place}. Prof: ${q.depth}km. USGS.`})),
    ...hurricanes.map(h=>{const pos=hurPos[h.id]||{lat:h.lat,lng:h.lng};return{id:`hur_${h.id}`,name:`🌀${h.name}\n${hurCat(h.kts)}`,lat:pos.lat,lng:pos.lng,c:hurCol(h.kts),s:5,st:"extremo",icon:h.icon,pulse:true,fecha:"NOAA LIVE",det:`Huracán ${h.name} — ${hurCat(h.kts)}. ${Math.round(h.kts*1.852)} km/h. NOAA NHC.`};}),
    ...eonet.map(e=>({id:`eon_${e.id}`,name:`NASA\n${e.cat.substring(0,10).toUpperCase()}`,lat:e.lat,lng:e.lng,c:"#ff7700",s:3,st:"activo",icon:e.icon,pulse:false,fecha:"NASA EONET",det:`${e.title}. Tipo: ${e.cat}.`}))
  ];

  const DATA_MAP={war:BASE_WAR,disease:BASE_DISEASE,climate:clmPts,news:BASE_NEWS};
  const pts=DATA_MAP[mode]||[];

  const STATS={
    war:[{l:"MUERTOS IRÁN",v:"6,244+",c:"#ff1a1a"},{l:"SOLDADOS USA",v:"13 ✝",c:"#ff4444"},{l:"BRENT",v:"$115",c:"#ffaa00"},{l:"USD/MXN",v:fx?`$${fx}`:"$19+",c:"#88cc00"}],
    disease:[{l:"SARAMPIÓN MX",v:"9,074",c:"#ff2200"},{l:"MPOX",v:"100K+",c:"#ff6600"},{l:"H5N1",v:"47 EST",c:"#ffaa00"},{l:"NIPAH",v:"5 CASOS",c:"#cc0000"}],
    climate:[{l:"HURACANES",v:hurricanes.length,c:"#8844ff"},{l:"SISMOS",v:quakesData.length,c:"#ffaa00"},{l:"INDIA °C",v:wlive.india?`${wlive.india.temperature_2m}°C`:"51°C",c:"#ff2200"},{l:"TORNADOS",v:"23",c:"#aa44ff"}],
    news:[{l:"BRENT",v:"$115",c:"#ffaa00"},{l:"BTC",v:crypto?.bitcoin?`$${Math.round(crypto.bitcoin.usd/1000)}K`:"...",c:"#ffdd00"},{l:"USD/MXN",v:fx?`$${fx}`:"$19+",c:"#88cc00"},{l:"NASDAQ",v:"-3%",c:"#ff3344"}],
  };

  return(
    <div style={{background:bg,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",padding:"10px 8px 16px",fontFamily:"'Courier New',monospace",color:"#fff",transition:"background 0.6s",userSelect:"none",position:"relative",overflow:"hidden"}}>
      <div style={{position:"fixed",inset:0,backgroundImage:`linear-gradient(${GRID[mode]} 1px,transparent 1px),linear-gradient(90deg,${GRID[mode]} 1px,transparent 1px)`,backgroundSize:"40px 40px",pointerEvents:"none",zIndex:0}}/>

      {/* TOP BAR */}
      <div style={{width:"100%",maxWidth:"980px",marginBottom:"8px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"8px",position:"relative",zIndex:1}}>
        <div style={{flex:1,minWidth:"200px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"2px"}}>
            <div style={{width:"6px",height:"6px",borderRadius:"50%",background:ac,boxShadow:`0 0 8px ${ac}`,animation:"pulse 1s ease infinite"}}/>
            <span style={{fontSize:"7px",letterSpacing:"3px",color:ac}}>{getTimeIcon()} TIEMPO REAL · USGS · NOAA · OPENSKY · NASA · FRANKFURTER</span>
          </div>
          <h1 style={{fontSize:"clamp(10px,1.8vw,16px)",fontWeight:"900",letterSpacing:"2px",color:"#fff",margin:"0 0 3px",textShadow:`0 0 30px ${ac}88,0 0 60px ${ac}33`}}>
            {getDayIcon(21)} {TITLES[mode]}
          </h1>
        </div>
        <div style={{display:"flex",gap:"8px",alignItems:"flex-start",flexWrap:"wrap"}}>
          <Clock ac={ac}/>
          <WeatherWidget ac={ac} loc={loc}/>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:"5px",alignItems:"flex-end"}}>
          <button onClick={cycleMode} style={{padding:"8px 14px",background:`${ac}15`,border:`1px solid ${ac}`,borderRadius:"6px",color:ac,fontFamily:"'Courier New',monospace",fontSize:"10px",letterSpacing:"2px",cursor:"pointer",fontWeight:"bold",backdropFilter:"blur(4px)"}} onMouseEnter={e=>{e.currentTarget.style.background=`${ac}30`;}} onMouseLeave={e=>{e.currentTarget.style.background=`${ac}15`;}}>
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
      <div style={{width:"100%",maxWidth:"980px",position:"relative",border:`1px solid ${ac}18`,borderRadius:"10px",overflow:"hidden",boxShadow:`0 0 60px ${ac}15`,background:"#010610",zIndex:1}}>
        {!geo&&<div style={{height:"440px",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"12px"}}>
          <div style={{fontSize:"24px",animation:"spin 1.5s linear infinite"}}>🌍</div>
          <div style={{fontSize:"8px",color:ac,letterSpacing:"4px"}}>CARGANDO MAPA GLOBAL...</div>
        </div>}
        {geo&&<svg viewBox={`0 0 ${W} ${H}`} style={{display:"block",width:"100%"}}>
          <defs>
            <filter id="glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          </defs>
          <rect width={W} height={H} fill="#010610"/>
          {geo.sphere&&<path d={geo.sphere} fill="#010c1a" stroke={ac} strokeWidth="0.4" strokeOpacity="0.12"/>}
          {geo.paths.map(({id,d})=>{
            const col=isoM[id],hasCE=!!mcd[id];
            return<path key={id} d={d} fill={col?`${col}1e`:"#0a0e1a"} stroke={col?col:"#0c1428"} strokeWidth={col?0.6:0.15} strokeOpacity={col?0.5:1} style={{cursor:hasCE?"pointer":"default"}} onMouseOver={e=>{if(col)e.target.setAttribute("fill",col+(hasCE?"55":"2a"));}} onMouseOut={e=>e.target.setAttribute("fill",col?`${col}1e`:"#0a0e1a")} onClick={()=>hasCE&&setSel({id:`cc_${id}`,name:mcd[id].name,c:mcd[id].c,det:mcd[id].det,fecha:mcd[id].fecha,icon:mcd[id].icon})}/>;
          })}
          {geo.borders&&<path d={geo.borders} fill="none" stroke="#0c1428" strokeWidth="0.2"/>}

          {/* RADAR */}
          {mode==="war"&&(()=>{
            const center=xy(26.6,50);
            if(!center) return null;
            const[cx,cy]=center,r=115,rad1=radarAngle*Math.PI/180,rad2=(radarAngle-35)*Math.PI/180;
            return(<g style={{pointerEvents:"none"}}>
              <circle cx={cx} cy={cy} r={r} fill={`${ac}06`}/>
              {[0.25,0.5,0.75,1].map(f=><circle key={f} cx={cx} cy={cy} r={r*f} fill="none" stroke={ac} strokeWidth="0.4" opacity="0.15"/>)}
              <path d={`M${cx},${cy} L${cx+Math.cos(rad1)*r},${cy+Math.sin(rad1)*r} A${r},${r} 0 0,0 ${cx+Math.cos(rad2)*r},${cy+Math.sin(rad2)*r} Z`} fill={ac} opacity="0.12"/>
              <line x1={cx} y1={cy} x2={cx+Math.cos(rad1)*r} y2={cy+Math.sin(rad1)*r} stroke={ac} strokeWidth="1.4" opacity="0.6"/>
            </g>);
          })()}

          {/* DATA POINTS */}
          {pts.filter(pt=>pt.lat&&pt.lng).map(pt=>{
            const p=xy(pt.lat,pt.lng);
            if(!p) return null;
            const[px,py]=p,r=7,ptc=pt.c||"#ff4400";
            return<g key={pt.id} onClick={()=>{setSel(pt);speakText(pt.det);}} style={{cursor:"pointer"}}>
              {pt.pulse&&[0,1,2].map(i=>(
                <circle key={i} cx={px} cy={py} r={r} fill="none" stroke={ptc} strokeWidth="0.7" opacity="0">
                  <animate attributeName="r" from={r} to={r+32} dur={`${2+i*0.6}s`} begin={`${i*0.6}s`} repeatCount="indefinite"/>
                  <animate attributeName="opacity" from="0.6" to="0" dur={`${2+i*0.6}s`} begin={`${i*0.6}s`} repeatCount="indefinite"/>
                </circle>
              ))}
              <circle cx={px} cy={py} r={r} fill={ptc} style={{filter:`drop-shadow(0 0 ${r}px ${ptc})`}}/>
              <circle cx={px} cy={py} r={r*0.38} fill="rgba(255,255,255,0.6)"/>
              {pt.icon&&<text x={px} y={py+2.5} textAnchor="middle" fontSize="6" style={{pointerEvents:"none"}}>{pt.icon}</text>}
            </g>;
          })}

          {/* CARRIERS */}
          {mode==="war"&&CARRIERS.map(cv=>{
            const pos=cpos[cv.id];
            if(!pos) return null;
            const p=xy(pos.lat,pos.lng);
            if(!p) return null;
            const[cx,cy]=p,cc=cv.pais==="FRANCE"?"#4466ff":"#4488ff";
            return<g key={cv.id} onClick={()=>{setSel({id:cv.id,name:`${cv.flag} ${cv.name}`,det:cv.det,c:cc,fecha:"DÍA 21"});speakText(cv.det);}} style={{cursor:"pointer"}} filter="url(#glow)">
              <rect x={cx-11} y={cy-2} width={22} height={4.5} fill={cc} rx="2.2" opacity="0.9"/>
              <text x={cx} y={cy-11} textAnchor="middle" fill={cc} fontSize="5.5" fontFamily="'Courier New',monospace" fontWeight="bold">{cv.flag} {cv.name}</text>
            </g>;
          })}

          {/* PLANES */}
          {mode==="war"&&planes.map(p=>{
            const pos=xy(p.lat,p.lng);
            if(!pos) return null;
            const[px,py]=pos;
            return<g key={p.id}><g transform={`translate(${px},${py}) rotate(${p.hdg||0})`}><polygon points="0,-4 -2,2 0,1 2,2" fill="#00ff88" opacity="0.85" style={{filter:"drop-shadow(0 0 2px #00ff88)"}}/></g></g>;
          })}

          {/* ATTACKS */}
          {attacks.map(atk=>{
            const fr=xy(atk.from.lat,atk.from.lng),to=xy(atk.to.lat,atk.to.lng);
            if(!fr||!to) return null;
            const cx=fr[0]+(to[0]-fr[0])*atk.prog,cy=fr[1]+(to[1]-fr[1])*atk.prog;
            return<g key={atk.id} filter="url(#glow)"><circle cx={cx} cy={cy} r={2.5} fill={atk.col} opacity="0.95"/></g>;
          })}
        </svg>}
      </div>

      {/* DETAIL PANEL */}
      {sel&&<div style={{marginTop:"8px",padding:"14px 16px",background:`${bg}ee`,border:`1px solid ${sel.c||"#ff4400"}`,borderRadius:"8px",width:"100%",maxWidth:"980px",backdropFilter:"blur(10px)",position:"relative",zIndex:1}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"}}>
            <span style={{fontSize:"14px",fontWeight:"900",letterSpacing:"2px",color:sel.c||"#ff4400"}}>{sel.icon||""} {(sel.name||"").replace(/\n/g," ")}</span>
            {sel.fecha&&<span style={{fontSize:"7px",background:sel.c||"#ff4400",color:"#000",padding:"2px 8px",borderRadius:"3px"}}>{sel.fecha}</span>}
          </div>
          <button onClick={()=>{setSel(null);stopSpeech();}} style={{background:"none",border:"none",color:"rgba(255,255,255,0.3)",cursor:"pointer",fontSize:"16px"}}>✕</button>
        </div>
        <div style={{marginTop:"10px",fontSize:"11px",color:"rgba(255,255,255,0.8)",lineHeight:"1.9"}}>{sel.det||""}</div>
      </div>}

      {/* STATS */}
      <div style={{marginTop:"10px",display:"flex",gap:"5px",flexWrap:"wrap",justifyContent:"center",width:"100%",maxWidth:"980px",position:"relative",zIndex:1}}>
        {(STATS[mode]||[]).map((st)=>(
          <button key={st.l} onClick={()=>speakText(`${st.l}: ${st.v}`)} style={{background:`${st.c}0c`,border:`1px solid ${st.c}22`,borderRadius:"6px",padding:"8px 10px",textAlign:"center",minWidth:"90px",cursor:"pointer",fontFamily:"'Courier New',monospace",transition:"all 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.border=`1px solid ${st.c}`;e.currentTarget.style.background=`${st.c}22`;}} onMouseLeave={e=>{e.currentTarget.style.border=`1px solid ${st.c}22`;e.currentTarget.style.background=`${st.c}0c`;}}>
            <div style={{fontSize:"13px",fontWeight:"900",color:st.c}}>{st.v}</div>
            <div style={{fontSize:"6px",color:"rgba(255,255,255,0.2)",letterSpacing:"1.5px",marginTop:"2px"}}>{st.l}</div>
          </button>
        ))}
      </div>

      {/* PANELS */}
      <div style={{marginTop:"10px",width:"100%",maxWidth:"980px",position:"relative",zIndex:1}}>
        {mode==="war"&&<WarPanel carriers={CARRIERS} cpos={cpos} attacks={attacks} planes={planes} quakes={quakesData}/>}
        {mode==="disease"&&<DiseasePanel/>}
        {mode==="climate"&&<ClimatePanel quakes={quakesData} hurricanes={hurricanes} hurPos={hurPos} eonet={eonet}/>}
        {mode==="news"&&<NewsPanel fx={fx} crypto={crypto}/>}
      </div>

      {/* LIVE STRIP */}
      {Object.keys(wlive).length>0&&<div style={{marginTop:"7px",width:"100%",maxWidth:"980px",background:"rgba(0,20,10,0.8)",border:"1px solid rgba(0,255,100,0.1)",borderRadius:"6px",padding:"6px 14px",display:"flex",gap:"12px",flexWrap:"wrap",alignItems:"center",backdropFilter:"blur(4px)",position:"relative",zIndex:1}}>
        <span style={{fontSize:"7px",color:"#00ff88",letterSpacing:"3px",fontWeight:"bold"}}>📡 LIVE</span>
        {wlive.india&&<span style={{fontSize:"8px",color:"#ff4400"}}>🔥 INDIA {wlive.india.temperature_2m}°C</span>}
        {wlive.mexico&&<span style={{fontSize:"8px",color:"#8844ff"}}>🇲🇽 MÉXICO {wlive.mexico.temperature_2m}°C</span>}
        {wlive.iran&&<span style={{fontSize:"8px",color:"#ff1a1a"}}>🇮🇷 IRÁN {wlive.iran.temperature_2m}°C</span>}
        {planes.length>0&&<span style={{fontSize:"8px",color:"#00cc88"}}>✈️ {planes.length} aviones OpenSky</span>}
        {eonet.length>0&&<span style={{fontSize:"8px",color:"#ff7700"}}>🛰️ {eonet.length} eventos NASA</span>}
        {quakesData.length>0&&<span style={{fontSize:"8px",color:"#ffaa00"}}>🌋 {quakesData.length} sismos USGS 48h</span>}
        {hurricanes.length>0&&<span style={{fontSize:"8px",color:"#8844ff"}}>🌀 {hurricanes.length} huracanes NOAA</span>}
      </div>}

      <div style={{marginTop:"8px",fontSize:"6px",color:"rgba(255,255,255,0.07)",letterSpacing:"2px",textAlign:"center",position:"relative",zIndex:1}}>
        MONITOR GLOBAL v13 · DÍA 21 · 20 MAR 2026 · FIXED BUILD
      </div>

      <style>{`
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.8)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:3px;background:#010610}
        ::-webkit-scrollbar-thumb{background:#1a2a3a;border-radius:2px}
      `}</style>
    </div>
  );
}
