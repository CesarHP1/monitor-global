// @ts-nocheck
// MONITOR GLOBAL v7 — all countries clickable, carrier flags, better clock, mode voices, dynamic icons
import { useState, useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";

const W = 960, H = 480;

// ── ISO → country name ────────────────────────────────────────────────────────
const ISO_NAMES = {"4":"Afganistán","8":"Albania","12":"Argelia","24":"Angola","32":"Argentina","36":"Australia","40":"Austria","50":"Bangladesh","56":"Bélgica","64":"Bután","68":"Bolivia","76":"Brasil","100":"Bulgaria","104":"Myanmar","116":"Camboya","120":"Camerún","124":"Canadá","152":"Chile","156":"China","170":"Colombia","178":"Rep. del Congo","180":"R.D. Congo","188":"Costa Rica","191":"Croacia","192":"Cuba","196":"Chipre","203":"Rep. Checa","208":"Dinamarca","214":"Rep. Dominicana","218":"Ecuador","818":"Egipto","231":"Etiopía","246":"Finlandia","250":"Francia","276":"Alemania","288":"Ghana","300":"Grecia","320":"Guatemala","324":"Guinea","332":"Haití","340":"Honduras","356":"India","360":"Indonesia","364":"Irán","368":"Iraq","372":"Irlanda","376":"Israel","380":"Italia","388":"Jamaica","392":"Japón","400":"Jordania","398":"Kazajistán","404":"Kenia","408":"Corea del Norte","410":"Corea del Sur","414":"Kuwait","418":"Laos","422":"Líbano","430":"Liberia","434":"Libia","484":"México","504":"Marruecos","508":"Mozambique","516":"Namibia","524":"Nepal","528":"Países Bajos","554":"Nueva Zelanda","558":"Nicaragua","566":"Nigeria","578":"Noruega","586":"Pakistán","591":"Panamá","598":"Papúa Nueva Guinea","600":"Paraguay","604":"Perú","608":"Filipinas","616":"Polonia","620":"Portugal","630":"Puerto Rico","634":"Qatar","642":"Rumanía","643":"Rusia","682":"Arabia Saudita","686":"Senegal","694":"Sierra Leona","703":"Eslovaquia","706":"Somalia","710":"Sudáfrica","724":"España","729":"Sudán","752":"Suecia","756":"Suiza","760":"Siria","762":"Tayikistán","764":"Tailandia","792":"Turquía","800":"Uganda","804":"Ucrania","784":"Emiratos Árabes","826":"Reino Unido","840":"Estados Unidos","858":"Uruguay","860":"Uzbekistán","862":"Venezuela","704":"Vietnam","887":"Yemen","894":"Zambia","716":"Zimbabue"};

// ── COUNTRY DATA — ALL modes, ALL colored ISO ─────────────────────────────────
const ALL_COUNTRY_DATA = {
  // ── WAR mode ──────────────────────────────────────────────────────────────
  war: {
    "840":{name:"🇺🇸 EE.UU.",fecha:"EN CURSO 6 MAR",c:"#ff2020",det:"EE.UU. en guerra activa contra Irán. Operación Epic Fury, día 7. 3000+ objetivos atacados. Trump exige rendición incondicional. Cuatro portaaviones en zona de guerra. Sin declaración formal de guerra del Congreso."},
    "364":{name:"🇮🇷 IRÁN",fecha:"EN CURSO 6 MAR",c:"#ff1a1a",det:"1332 muertos confirmados, 181 niños (UNICEF). Marina destruida. Misiles agotados al 90%, drones al 83%. Mojtaba Jamenei elegido nuevo líder por la Guardia Revolucionaria. Trump lo rechaza."},
    "376":{name:"🇮🇱 ISRAEL",fecha:"EN CURSO 6 MAR",c:"#ff1a1a",det:"Israel logró superioridad aérea casi completa. 2500 ataques, 80% de defensas iraníes destruidas. Más de 400 objetivos el viernes solo. Operaciones terrestres en el sur del Líbano."},
    "422":{name:"🇱🇧 LÍBANO",fecha:"EN CURSO 6 MAR",c:"#ff4444",det:"123 muertos y 600+ heridos. 95000 libaneses desplazados. Hezbollah activo contra Israel. Beirut sur bombardeada. Gobierno prohibió actividades militares de Hezbollah en su territorio."},
    "804":{name:"🇺🇦 UCRANIA",fecha:"EN CURSO 2026",c:"#ff8800",det:"Guerra con Rusia año 5. Zelenski acepta ayudar a EE.UU. con drones Shahed iraníes. Negociaciones de paz al 95% pero sin acuerdo final. Zelenski declaró que ya es la Tercera Guerra Mundial."},
    "643":{name:"🇷🇺 RUSIA ⚠️",fecha:"6 MAR 2026",c:"#ff4400",det:"NUEVO 6 MAR: Rusia proporcionando inteligencia a Irán sobre posiciones exactas de tropas y barcos de EE.UU. Primera señal de intervención directa de Moscú. Putin y Pezeshkian acordaron continuar contactos."},
    "586":{name:"🇵🇰 PAKISTÁN",fecha:"EN CURSO 6 MAR",c:"#ff5500",det:"Operación Ghazab Lil Haq, día 7. 481 afganos muertos. Base Bagram destruida. Potencia nuclear en guerra activa. Rechaza negociaciones con el régimen Taliban."},
    "4":  {name:"🇦🇫 AFGANISTÁN",fecha:"EN CURSO 6 MAR",c:"#ff5500",det:"Bajo bombardeo pakistaní intenso. 21.9 millones necesitan ayuda urgente. 2.7 millones de afganos deportados atrapados en la frontera. Taliban pide diálogo, Pakistán se niega."},
    "784":{name:"🇦🇪 EMIRATOS",fecha:"EN CURSO 2026",c:"#ff8800",det:"Emiratos alberga bases militares de EE.UU. y aliados. Bajo presión iraní. Infraestructura estratégica en alerta máxima. Relaciones con Irán deterioradas al mínimo histórico."},
    "634":{name:"🇶🇦 QATAR",fecha:"EN CURSO 2026",c:"#ff8800",det:"Qatar aloja la base aérea Al Udeid, la más grande de EE.UU. en Medio Oriente. Ha servido de canal de comunicación entre Washington y Teherán. En alerta por misiles iraníes."},
    "48": {name:"🇧🇭 BAHREIN",fecha:"EN CURSO 2026",c:"#ff8800",det:"Sede de la V Flota de EE.UU. en el Golfo. Bajo amenaza directa de misiles iraníes. Evacuación parcial de civiles en zonas próximas a instalaciones militares."},
    "414":{name:"🇰🇼 KUWAIT",fecha:"EN CURSO 2026",c:"#ff8800",det:"Primer soldado estadounidense muerto en Kuwait en el día 1 de la guerra. Bases de EE.UU. atacadas. Gobierno suspendió vuelos civiles al espacio aéreo de la región."},
    "682":{name:"🇸🇦 ARABIA SAUDITA",fecha:"5 MAR 2026",c:"#ff9900",det:"Refinería Ras Tanura atacada por misiles iraníes. Embajada de EE.UU. en Riad bajo drones. Con Ormuz cerrado el petróleo saudí no puede exportarse. En alerta máxima."},
    "196":{name:"🇨🇾 CHIPRE ⚠️",fecha:"4 MAR 2026",c:"#ff8800",det:"Base RAF Akrotiri atacada por drones iraníes — primer ataque de Irán a suelo OTAN. Italia, Países Bajos, España, Francia y Grecia enviaron buques a defender la isla."},
    "724":{name:"🇪🇸 ESPAÑA",fecha:"4 MAR 2026",c:"#ffcc00",det:"España niega cooperar militarmente con EE.UU. pero envió la fragata Cristóbal Colón al Mediterráneo. Trump amenaza cortar el comercio. Único miembro OTAN que rechazó el 5% en defensa."},
    "156":{name:"🇨🇳 CHINA",fecha:"EN CURSO 2026",c:"#ffcc00",det:"China aumenta presencia en el Estrecho de Taiwán aprovechando que EE.UU. tiene 4 portaaviones en el Golfo. Evacúa ciudadanos de Irán urgente. Suministra petróleo iraní burlando sanciones."},
    "356":{name:"🇮🇳 INDIA",fecha:"EN CURSO 2026",c:"#ffaa44",det:"India trata de mantenerse neutral. Importa petróleo iraní con descuento. 18000 ciudadanos indios en Irán evacuando. Bajo presión de EE.UU. para sumarse a sanciones."},
    "484":{name:"🇲🇽 MÉXICO",fecha:"EN CURSO 2026",c:"#88cc00",det:"México rechaza cualquier participación en la guerra. Impactado por precio del petróleo y el peso devaluado. Trump amenaza aranceles del 35%. Brote de sarampión activo simultáneamente."},
    "368":{name:"🇮🇶 IRAQ",fecha:"EN CURSO 2026",c:"#ff6600",det:"Iraq en posición delicada con bases de EE.UU. en su territorio y milicias pro-iraníes activas. 13 bases atacadas. El Parlamento exige la retirada de tropas americanas."},
    "400":{name:"🇯🇴 JORDANIA",fecha:"EN CURSO 2026",c:"#ffcc00",det:"Jordania interceptó drones y misiles iraníes en su espacio aéreo. Trabaja con EE.UU. e Israel en defensa aérea regional. Bajo presión interna por opinión pública pro-palestina."},
    "792":{name:"🇹🇷 TURQUÍA",fecha:"4 MAR 2026",c:"#ffcc00",det:"Turquía interceptó un misil iraní sobre su territorio el 4 de marzo — primer ataque a miembro OTAN. Erdogan convocó el Artículo 4 de la OTAN. Mediador entre Irán y Occidente."},
    "818":{name:"🇪🇬 EGIPTO",fecha:"EN CURSO 2026",c:"#ffcc00",det:"Egipto cierra parcialmente el Canal de Suez al tráfico vinculado a Israel. Mediador entre Hamas e Israel. Bajo presión económica por caída del turismo y el petróleo."},
    "250":{name:"🇫🇷 FRANCIA",fecha:"5 MAR 2026",c:"#4466ff",det:"Macron envió el portaaviones Charles de Gaulle con escolta completa al Mediterráneo. Francia condena la guerra pero actúa militarmente para defender a sus aliados europeos y Chipre."},
    "380":{name:"🇮🇹 ITALIA",fecha:"5 MAR 2026",c:"#4466ff",det:"Italia envió fragatas al Mediterráneo para defender Chipre. Da apoyo logístico desde sus bases en Sicilia. Bajo presión por aranceles de Trump del 25% desde el 15 de marzo."},
    "528":{name:"🇳🇱 PAÍSES BAJOS",fecha:"5 MAR 2026",c:"#4466ff",det:"Países Bajos envió fragata HNLMS a defender Chipre junto a Francia, Italia y España. Bajo los aranceles de Trump del 25% junto a toda la Unión Europea."},
    "826":{name:"🇬🇧 REINO UNIDO",fecha:"5 MAR 2026",c:"#4466ff",det:"Reino Unido autorizó el uso de sus bases en Chipre (RAF Akrotiri) para operaciones contra Irán. Base atacada por drones iraníes el 4 de marzo. Fragatas enviadas al Mediterráneo oriental."},
    "300":{name:"🇬🇷 GRECIA",fecha:"5 MAR 2026",c:"#4466ff",det:"Grecia envió buques de guerra al Mediterráneo para defender Chipre. Colabora en defensa aérea con Francia, Italia y España. Preocupada por posible desestabilización del Mediterráneo oriental."},
  },
  // ── DISEASE mode ──────────────────────────────────────────────────────────
  disease: {
    "484":{name:"🇲🇽 MÉXICO 🔴",fecha:"MAR 2026",c:"#ff2200",det:"Brote activo de sarampión, marzo 2026. Casos confirmados en CDMX, Jalisco y Nuevo León. Vinculado a casos importados de Texas. Cobertura de vacunación bajó post-COVID. SSA emitió alerta epidemiológica nacional. Verifica tu cartilla."},
    "840":{name:"🇺🇸 EE.UU.",fecha:"EN CURSO 2026",c:"#ffaa00",det:"H5N1 en ganado bovino activo en 47 estados. Primera transmisión humana a humano confirmada en 2026. OMS en alerta pandémica máxima. Candidatos de vacuna en fase 3. Sarampión también vinculado con México."},
    "180":{name:"🇨🇩 R.D. CONGO",fecha:"EN CURSO 2026",c:"#ff6600",det:"Epicentro del mpox. Variante clade Ib más transmisible y grave. 100K+ casos confirmados. OMS mantiene emergencia global desde 2024. Acceso humanitario limitado por conflicto armado en el este."},
    "76": {name:"🇧🇷 BRASIL",fecha:"EN CURSO 2026",c:"#ff6600",det:"Año récord de dengue 2025-2026. 5 millones de casos activos, 5 mil muertes. Serotipo DENV-3 reemergente por primera vez en décadas. Colapso hospitalario en São Paulo, Río y Brasilia."},
    "430":{name:"🇱🇷 LIBERIA",fecha:"FEB 2026",c:"#cc0000",det:"Nuevo brote de Ébola detectado en febrero 2026. 300+ contactos bajo rastreo urgente. Tasa de mortalidad del 65%. OMS desplegó equipo de emergencia. Brote contenido en zona de selva pero en expansión."},
    "729":{name:"🇸🇩 SUDÁN",fecha:"EN CURSO 2026",c:"#ff8800",det:"Cólera activo en plena guerra civil. 200 mil casos y 3 mil muertes en 2026. Sin agua potable en zonas de conflicto. Ayuda humanitaria bloqueada completamente. La peor crisis humanitaria del mundo."},
    "356":{name:"🇮🇳 INDIA",fecha:"EN CURSO 2026",c:"#ff4400",det:"India con varios brotes simultáneos. Dengue activo en el sur. Ola de calor matando más de 3200 personas. Sistema hospitalario bajo presión extrema por la temperatura y las enfermedades vectoriales."},
    "156":{name:"🇨🇳 CHINA",fecha:"MAR 2026",c:"#ff4400",det:"Subvariante COVID XEC detectada en China, marzo 2026. OMS monitorea. Además de COVID, influenza H3N2 en circulación intensa. Sistema de vigilancia epidemiológica reforzado post-pandemia."},
    "710":{name:"🇿🇦 SUDÁFRICA",fecha:"EN CURSO 2026",c:"#ff8800",det:"Mpox clade Ib presente en Sudáfrica. Además, tuberculosis resistente a antibióticos en aumento. Sistema de salud pública bajo presión. Mayor país afectado de África Subsahariana por VIH."},
    "410":{name:"🇰🇷 COREA DEL SUR",fecha:"MAR 2026",c:"#ffcc00",det:"COVID subvariante XEC detectada. Corea del Sur tiene uno de los mejores sistemas de rastreo del mundo. Aplicó restricciones leves. Vacunación al 94% de la población adulta."},
    "360":{name:"🇮🇩 INDONESIA",fecha:"EN CURSO 2026",c:"#ff9900",det:"Dengue activo en Yakarta y Java. 800 mil casos en 2026. Rabia activa en varias provincias. H5N1 en aves sin transmisión humana confirmada aún. Sistema de salud rural con cobertura limitada."},
    "608":{name:"🇵🇭 FILIPINAS",fecha:"EN CURSO 2026",c:"#ff7733",det:"Dengue y leptospirosis activos tras inundaciones. Polio detectado en zonas rurales. Mpox clade II presente. Filipinas bajo vigilancia epidemiológica reforzada de OMS."},
  },
  // ── CLIMATE mode ──────────────────────────────────────────────────────────
  climate: {
    "840":{name:"🇺🇸 EE.UU. 🌪️",fecha:"MAR 2026",c:"#aa44ff",det:"23 tornados en 24 horas en Tornado Alley. Oklahoma, Kansas y Texas afectados. Tres tornados EF4 con vientos de 280 km/h. 8 muertos, 140 heridos. Simultáneamente frente frío ártico de -35°C en el norte."},
    "356":{name:"🇮🇳 INDIA 🔥",fecha:"EN CURSO 2026",c:"#ff2200",det:"Ola de calor histórica en norte de India. Temperatura de 47 a 51°C, récord absoluto. 3200 muertes por golpe de calor en 2026. Alerta roja en 8 estados simultáneamente. Escasez de agua crítica."},
    "36": {name:"🇦🇺 AUSTRALIA 🔥",fecha:"EN CURSO 2026",c:"#ff3300",det:"Mega incendios en Nueva Gales del Sur. 2.1 millones de hectáreas quemadas. 12 muertos. Calidad del aire en Sídney en nivel peligroso. Vientos de 80 km/h sin posibilidad de control."},
    "76": {name:"🇧🇷 BRASIL 🌊",fecha:"EN CURSO 2026",c:"#0055ff",det:"Inundaciones en el sur de Brasil, segunda temporada consecutiva. Ríos desbordados en Rio Grande do Sul y Santa Catarina. 200 mil evacuados. Pérdidas en cosechas de soja y maíz."},
    "392":{name:"🇯🇵 JAPÓN 🌋",fecha:"EN CURSO 2026",c:"#ffaa00",det:"Japón en alerta sísmica permanente. Múltiples sismos M5+ registrados por USGS. Sistema de alerta temprana de tsunamis activo. Volcán Sakurajima en actividad elevada. Evacuaciones en Kyushu."},
    "360":{name:"🇮🇩 INDONESIA 🌋",fecha:"EN CURSO 2026",c:"#ff9900",det:"Indonesia: anillo de fuego del Pacífico. Volcán Merapi en alerta naranja. Sismos M5+ frecuentes. Tsunamis locales monitoreados. País con más actividad volcánica del mundo: 127 volcanes activos."},
    "608":{name:"🇵🇭 FILIPINAS 🌀",fecha:"EN CURSO 2026",c:"#7733ff",det:"Filipinas en temporada de tifones. Mar de Filipinas con temperatura superficial 2°C sobre lo normal. Amenaza activa de ciclones. País más afectado por tifones en el mundo: 20 por año en promedio."},
    "724":{name:"🇪🇸 ESPAÑA 🔥",fecha:"EN CURSO 2026",c:"#ff5500",det:"España bajo ola de calor prematura en primavera 2026. Temperaturas de 38°C en marzo, récord histórico. Riesgo de incendios forestales muy alto en toda la Península. Sequía estructural en el mediterráneo."},
    "250":{name:"🇫🇷 FRANCIA 🌊",fecha:"MAR 2026",c:"#0066ff",det:"Francia parte de las inundaciones de Europa Central. Ríos Rin y Saona desbordados. 25000 evacuados en el norte y este. Temperaturas invernales en marzo con nieve tardía en los Alpes."},
    "152":{name:"🇨🇱 CHILE 🌋",fecha:"EN CURSO 2026",c:"#ffbb00",det:"Chile en alerta por volcán Villarrica en actividad. Sismos frecuentes en la zona de subducción. Alerta de tsunami preventiva activa en zonas costeras. Sistema de alerta más avanzado de Sudamérica."},
    "484":{name:"🇲🇽 MÉXICO 🌀",fecha:"TEMPORADA 2026",c:"#8844ff",det:"México entrando en temporada de lluvias. Golfo de México con temperatura del mar 2°C sobre lo normal, favorece ciclones. Veracruz, Tabasco y Campeche en mayor riesgo. Temporada atlántica predicha como muy activa."},
    "50": {name:"🇧🇩 BANGLADÉS 🌊",fecha:"EN CURSO 2026",c:"#6633ff",det:"Bangladés bajo inundaciones crónicas. Nivel del mar sube 3.7mm/año, el doble del promedio global. 17 millones de personas en riesgo de desplazamiento climático para 2050. Ciclones activos en el Golfo de Bengala."},
    "124":{name:"🇨🇦 CANADÁ 🧊",fecha:"MAR 2026",c:"#00ccff",det:"Frente frío ártico sobre Canadá y norte de EE.UU. Temperaturas de -35°C en Manitoba y Saskatchewan. Récord de nieve en Alberta. Vórtice polar desestabilizado por cambio climático."},
  },
  // ── NEWS mode ──────────────────────────────────────────────────────────────
  news: {
    "840":{name:"🇺🇸 EE.UU.",fecha:"MAR 2026",c:"#ff6600",det:"EE.UU. en guerra contra Irán + aranceles al mundo. Wall Street cayó 6.2%. Costo de la guerra: $891 millones por día sin presupuestar. Trump firmó aranceles del 25% a Europa y 145% a China. Sin aprobación del Congreso."},
    "276":{name:"🇩🇪 ALEMANIA",fecha:"23 FEB 2026",c:"#4488ff",det:"CDU de Merz ganó elecciones con 29%. AfD obtuvo 20%, resultado histórico. Merz negocia coalición con SPD. Alemania rechaza los aranceles de Trump. Aumentará defensa al 3% del PIB."},
    "250":{name:"🇫🇷 FRANCIA",fecha:"MAY 2026",c:"#4488ff",det:"Elecciones anticipadas en mayo 2026. Le Pen lidera con 34%. Macron se retiró. Francia también afectada por aranceles Trump del 25%. Economía bajo presión por guerra en Medio Oriente y energía cara."},
    "156":{name:"🇨🇳 CHINA",fecha:"MAR 2026",c:"#ffcc00",det:"China afectada por aranceles Trump del 145%. Menor crecimiento en 30 años: 3.8% del PIB. Crisis inmobiliaria con Evergrande liquidada. Yuan perdió 8% frente al dólar. BRICS propone alternativa al dólar."},
    "364":{name:"🇮🇷 IRÁN",fecha:"EN CURSO 2026",c:"#ff4444",det:"Economía iraní en colapso total. Rial sin valor. Ormuz cerrado corta exportaciones de petróleo. Nuevas sanciones, las más duras de la historia. Nuevo líder elegido, rechazado por Occidente."},
    "643":{name:"🇷🇺 RUSIA",fecha:"EN CURSO 2026",c:"#ff7700",det:"Rusia en guerra con Ucrania año 5 y apoyando a Irán con inteligencia. PIB estancado. Reservas de divisas cayendo. Rublo en mínimos históricos. Expulsada del G20. BRICS lidera desde Moscú."},
    "76": {name:"🇧🇷 BRASIL",fecha:"EN CURSO 2026",c:"#44ffaa",det:"Brasil intenta mediar en conflictos globales. Exportaciones de petróleo y soja aumentan por crisis de suministro. Real brasileño subió 4%. Lula propuso reunión de emergencia del G20 por la guerra."},
    "826":{name:"🇬🇧 REINO UNIDO",fecha:"MAR 2026",c:"#4466ff",det:"Reino Unido bajo aranceles de Trump del 25% como parte de Europa. Libra esterlina perdió 3.5%. Gobierno de Starmer busca acuerdo bilateral con EE.UU. Brexit complicó las represalias coordinadas con la UE."},
    "724":{name:"🇪🇸 ESPAÑA",fecha:"MAR 2026",c:"#ff6600",det:"España bajo aranceles de Trump del 25%. Ibex 35 cayó 8% en la semana. Gobierno Sánchez prepara represalias junto a la UE. España también afectada por subida del petróleo y la guerra en Medio Oriente."},
    "380":{name:"🇮🇹 ITALIA",fecha:"MAR 2026",c:"#4466ff",det:"Italia bajo aranceles de Trump del 25%. Meloni busca excepción por su apoyo político a Trump. Turismo bajo presión por inseguridad regional. Fiat y Ferrari con incertidumbre sobre el mercado americano."},
    "392":{name:"🇯🇵 JAPÓN",fecha:"MAR 2026",c:"#ff3344",det:"Tokio cayó 9.1% en la semana, peor caída desde 2020. Yen se depreció frente al dólar. Japón importa el 90% de su petróleo del Golfo — Ormuz cerrado es crítico. Sony y Toyota en alerta."},
    "682":{name:"🇸🇦 ARABIA SAUDITA",fecha:"EN CURSO 2026",c:"#ffaa00",det:"Arabia Saudita bajo ataque pero sigue produciendo petróleo. Con Ormuz cerrado, el crudo saudí no puede exportarse. OPEP convocó reunión de emergencia. Proyecto NEOM en pausa por la guerra."},
    "484":{name:"🇲🇽 MÉXICO",fecha:"MAR 2026",c:"#ffaa44",det:"México en triple crisis: guerra eleva gasolina, peso se devalúa, Trump amenaza aranceles del 35%. Brote de sarampión activo. FMI alerta recesión para Q3. Exportaciones industriales en riesgo por la incertidumbre."},
    "528":{name:"🇳🇱 PAÍSES BAJOS",fecha:"MAR 2026",c:"#4466ff",det:"Países Bajos bajo aranceles de Trump. Puerto de Rotterdam, el mayor de Europa, ve caída del tráfico del 12%. Economía muy dependiente del comercio internacional. Shell reporta pérdidas por caída en el precio de sus acciones."},
  },
};

// ── POINT DATA ────────────────────────────────────────────────────────────────
const BASE_WAR = [
  {id:"usa",name:"EE.UU.",lat:38,lng:-97,c:"#ff2020",s:5,st:"guerra",conn:["iran"],fecha:"6 MAR 2026",det:"EE.UU. atacando Irán. Operación Epic Fury, día 7. 3000+ objetivos. Trump exige rendición incondicional. Cuatro portaaviones en el Golfo."},
  {id:"iran",name:"IRÁN",lat:32.4,lng:53.7,c:"#ff1a1a",s:5,st:"guerra",conn:["israel","saudi"],fecha:"6 MAR 2026",det:"1332 muertos, 181 niños (UNICEF). Marina destruida. Misiles agotados al 90%. Mojtaba Jamenei elegido nuevo líder, rechazado por Trump."},
  {id:"israel",name:"ISRAEL",lat:31,lng:34.9,c:"#ff1a1a",s:5,st:"guerra",conn:["lebanon"],fecha:"6 MAR 2026",det:"Superioridad aérea casi completa. 2500 ataques, 80% defensas iraníes destruidas. 400 objetivos el viernes. Tropas terrestres en el Líbano."},
  {id:"lebanon",name:"LÍBANO",lat:33.9,lng:35.5,c:"#ff4444",s:4,st:"guerra",fecha:"6 MAR 2026",det:"123 muertos, 600+ heridos. 95000 desplazados. Hezbollah activo. Beirut sur bombardeada."},
  {id:"ukraine",name:"UCRANIA",lat:48.4,lng:31.2,c:"#ff8800",s:4,st:"guerra",conn:["russia"],fecha:"EN CURSO",det:"Guerra con Rusia año 5. Zelenski acepta ayudar a EE.UU. con drones Shahed. Negociaciones de paz al 95%."},
  {id:"russia",name:"RUSIA\n⚠️INTEL",lat:61.5,lng:105,c:"#ff4400",s:4,st:"activo",fecha:"6 MAR 2026",det:"Rusia dando inteligencia a Irán sobre posiciones de tropas y barcos de EE.UU. Primera señal de intervención directa."},
  {id:"pak",name:"PAKISTÁN",lat:30.4,lng:69.3,c:"#ff5500",s:4,st:"guerra",conn:["afg"],fecha:"6 MAR 2026",det:"Operación Ghazab Lil Haq, día 7. 481 afganos muertos. Base Bagram destruida. Potencia nuclear en guerra."},
  {id:"afg",name:"AFGANISTÁN",lat:33.9,lng:67.7,c:"#ff5500",s:4,st:"guerra",fecha:"6 MAR 2026",det:"Bajo bombardeo pakistaní. 21.9M necesitan ayuda. 2.7M afganos deportados atrapados en frontera."},
  {id:"cyprus",name:"CHIPRE ⚠️",lat:35,lng:33,c:"#ff8800",s:4,st:"atacado",fecha:"4 MAR 2026",det:"RAF Akrotiri atacada por drones iraníes — primer ataque a suelo OTAN. Francia, Italia, España, Países Bajos y Grecia enviaron buques a defender la isla."},
  {id:"saudi",name:"ARABIA SAU.",lat:23.9,lng:45.1,c:"#ff9900",s:3,st:"atacado",fecha:"5 MAR 2026",det:"Refinería Ras Tanura atacada. Embajada de EE.UU. en Riad bajo drones. Petróleo a $91, no puede exportar con Ormuz cerrado."},
  {id:"ormuz",name:"ORMUZ 🚫",lat:26.6,lng:56.5,c:"#ff0000",s:5,st:"critico",fecha:"EN CURSO",det:"Estrecho cerrado. 20% del petróleo mundial bloqueado. $91/barril +31%. 1100+ barcos GPS interferido."},
  {id:"spain",name:"ESPAÑA 🚫",lat:40.5,lng:-3.7,c:"#ffcc00",s:2,st:"tension",fecha:"4 MAR 2026",det:"Niega cooperar con EE.UU. Fragata Cristóbal Colón a Chipre. Trump amenaza cortar comercio."},
];

const CARRIERS = [
  {id:"ford",name:"USS FORD",flag:"🇺🇸",pais:"EE.UU.",lat:22.4,lng:62.8,fecha:"EN CURSO",det:"🇺🇸 USS Gerald R. Ford CVN-78 — ARMADA DE EE.UU. Mar Arábigo occidental. Clase Ford, el portaaviones más avanzado del mundo. 90 aeronaves F-35C. Atacando objetivos en Irán en tiempo real. Desplazado desde Norfolk, Virginia."},
  {id:"ike",name:"USS IKE",flag:"🇺🇸",pais:"EE.UU.",lat:14.2,lng:55.5,fecha:"EN CURSO",det:"🇺🇸 USS Eisenhower CVN-69 — ARMADA DE EE.UU. Golfo de Adén. Clase Nimitz. 600+ misiles Tomahawk lanzados en 7 días. Interceptando drones y misiles iraníes desde posición sur."},
  {id:"tr",name:"USS ROSVLT",flag:"🇺🇸",pais:"EE.UU.",lat:17.8,lng:59.2,fecha:"EN CURSO",det:"🇺🇸 USS Theodore Roosevelt CVN-71 — ARMADA DE EE.UU. Mar de Omán. Clase Nimitz. Bloquea salidas iraníes al Océano Índico. Tercer portaaviones en zona sin precedente reciente."},
  {id:"linc",name:"USS LINCOLN",flag:"🇺🇸",pais:"EE.UU.",lat:12.5,lng:50.1,fecha:"EN CURSO",det:"🇺🇸 USS Lincoln CVN-72 — ARMADA DE EE.UU. Mar Rojo sur. Enviado tras la muerte de soldados en Kuwait. Cuarto portaaviones en zona, sin precedente en 40 años de historia naval."},
  {id:"degaulle",name:"CHARLES D.G.",flag:"🇫🇷",pais:"FRANCIA",lat:35.5,lng:24,fecha:"5 MAR 2026",det:"🇫🇷 Charles de Gaulle R91 — MARINE NATIONALE FRANÇAISE. Mediterráneo oriental. Único portaaviones de propulsión nuclear fuera de EE.UU. Enviado por Macron para defender Chipre y disuadir a Irán. Escoltado por fragatas y submarino nuclear."},
];

const BASE_DISEASE = [
  {id:"saramp",name:"SARAMPIÓN\nMÉXICO",lat:19.4,lng:-99.1,c:"#ff2200",s:3,st:"alerta",fecha:"MAR 2026",det:"Brote activo en México. Casos en CDMX, Jalisco y Nuevo León. Vinculado a Texas. SSA emitió alerta nacional. Verifica tu cartilla de vacunación."},
  {id:"mpox",name:"MPOX\nCONGO",lat:0.3,lng:25.5,c:"#ff6600",s:4,st:"activo",fecha:"EN CURSO 2026",det:"Emergencia global OMS. 100K+ casos. Variante clade Ib más transmisible. Congo, Uganda y Kenia afectados."},
  {id:"h5n1",name:"H5N1\nUSA",lat:37.1,lng:-95.7,c:"#ffaa00",s:4,st:"alerta",fecha:"EN CURSO 2026",det:"H5N1 en ganado bovino de EE.UU. Primera transmisión humana confirmada. OMS en alerta pandémica máxima."},
  {id:"dengue",name:"DENGUE\nBRASIL",lat:-10,lng:-55,c:"#ff6600",s:3,st:"activo",fecha:"EN CURSO 2026",det:"Año récord. 5 millones de casos, 5 mil muertes. Serotipo DENV-3 reemergente. Colapso hospitalario."},
  {id:"ebola",name:"ÉBOLA\nLIBERIA",lat:6.3,lng:-10.8,c:"#cc0000",s:4,st:"alerta",fecha:"FEB 2026",det:"Nuevo brote en Liberia. 300+ contactos bajo rastreo. Mortalidad 65%. OMS en emergencia."},
  {id:"cholera",name:"CÓLERA\nSUDÁN",lat:15.6,lng:32.5,c:"#ff8800",s:3,st:"activo",fecha:"EN CURSO 2026",det:"200K casos, 3K muertes. Sin agua potable. Ayuda bloqueada por la guerra civil."},
  {id:"covid",name:"COVID XEC\nASIA",lat:30.6,lng:114.3,c:"#ff4400",s:2,st:"activo",fecha:"MAR 2026",det:"Subvariante XEC detectada en Asia. OMS monitoreando en China, Corea del Sur y Japón."},
];

const BASE_CLIMATE = [
  {id:"heat",name:"OLA CALOR\nINDIA",lat:26,lng:80,c:"#ff2200",s:5,st:"extremo",icon:"🔥",pulse:true,fecha:"EN CURSO 2026",det:"47 a 51°C. 3200 muertes. Récord histórico. Alerta roja en 8 estados."},
  {id:"flood",name:"INUNDACIONES\nEUROPA",lat:47,lng:16,c:"#0066ff",s:4,st:"activo",icon:"🌊",pulse:true,fecha:"MAR 2026",det:"Danubio +8.4m. 45K evacuados en Austria, Hungría y Eslovaquia. 12 muertos."},
  {id:"fire",name:"INCENDIOS\nAUSTRALIA",lat:-33,lng:149,c:"#ff3300",s:4,st:"extremo",icon:"🔥",pulse:true,fecha:"EN CURSO 2026",det:"2.1M ha quemadas en NSW. 12 muertos. Aire peligroso en Sídney."},
  {id:"tornado",name:"TORNADOS\nUSA",lat:36,lng:-97,c:"#aa44ff",s:4,st:"activo",icon:"🌪️",pulse:true,fecha:"MAR 2026",det:"23 tornados en 24h. Tres EF4 a 280 km/h. 8 muertos, 140 heridos."},
  {id:"cold",name:"FRENTE FRÍO\nN. USA",lat:45,lng:-90,c:"#00ccff",s:3,st:"activo",icon:"🧊",pulse:false,fecha:"MAR 2026",det:"Vórtice polar. -35°C. Nieve de 120cm en 48h. Emergencia en Wisconsin, Michigan y Minnesota."},
];

const BASE_NEWS = [
  {id:"oil",name:"CRISIS\nPETRÓLEO",lat:26,lng:50,c:"#ffaa00",s:5,st:"critico",icon:"🛢️",fecha:"EN CURSO 6 MAR",det:"Ormuz cerrado → $91/barril +31%. OPEP en emergencia. Proyección $150 si dura dos semanas. Maersk suspendió operaciones."},
  {id:"trump_t",name:"ARANCELES\nTRUMP",lat:38,lng:-97,c:"#ff6600",s:4,st:"activo",icon:"📊",fecha:"15 MAR 2026",det:"25% a Europa, 145% a China, 35% amenaza a México. UE prepara represalias por 45 mil millones de euros."},
  {id:"ger",name:"ALEMANIA\nCDU GANA",lat:51.2,lng:10.5,c:"#4488ff",s:3,st:"activo",icon:"🗳️",fecha:"23 FEB 2026",det:"CDU 29%, AfD 20% histórico. Merz busca coalición con SPD. Alemania bajo aranceles de Trump desde el 15 de marzo."},
  {id:"iran_f",name:"SUCESOR\nIRÁN",lat:32.4,lng:53.7,c:"#ff4444",s:5,st:"critico",icon:"🗳️",fecha:"6 MAR 2026",det:"Mojtaba Jamenei, hijo del ayatolá, elegido nuevo líder por la Guardia Revolucionaria. Trump lo rechaza. Oposición pide elecciones."},
  {id:"stocks",name:"BOLSAS\nCRASH",lat:40.7,lng:-74,c:"#ff3344",s:4,st:"activo",icon:"📉",fecha:"6 MAR 2026",det:"Wall St -6.2%. Ibex -8%. Tokio -9.1%. Oro a $3,200 récord. Bitcoin $62K. FMI alerta recesión global."},
  {id:"nato",name:"OTAN\nCUMBRE",lat:50.9,lng:4.4,c:"#4466ff",s:3,st:"activo",icon:"🛡️",fecha:"12 MAR 2026",det:"Cumbre extraordinaria en Bruselas el 12 de marzo. Solo 8/32 miembros cumplen el 2% del PIB. Trump exige 5%."},
  {id:"imf",name:"FMI\nRECESIÓN",lat:38.9,lng:-77,c:"#ffee00",s:4,st:"activo",icon:"📊",fecha:"5 MAR 2026",det:"FMI alerta recesión global. Guerra + Ormuz + aranceles reducirán crecimiento en 2.1 puntos. América Latina en riesgo Q3."},
  {id:"france_e",name:"ELECCIONES\nFRANCIA",lat:46.2,lng:2.2,c:"#4488ff",s:2,st:"alerta",icon:"🗳️",fecha:"MAY 2026",det:"Elecciones anticipadas en mayo 2026. Le Pen lidera con 34%. Macron se retiró. Inestabilidad política en Francia."},
];

// ── CONSTANTS ──────────────────────────────────────────────────────────────────
const STATUS_L={guerra:"EN GUERRA",atacado:"BAJO ATAQUE",activo:"EN CURSO",tension:"EN TENSIÓN",critico:"PUNTO CRÍTICO",alerta:"EN ALERTA",extremo:"EVENTO EXTREMO"};
const SCALES={war:[220,246,261,293,311,349,415,440,466,493],disease:[196,220,246,261,293,329,349,392,440,493],climate:[261,293,329,349,392,440,493,523,587,659],news:[293,329,369,392,440,493,523,587,659,698]};
const MODES=["war","disease","climate","news"];
const TITLES={war:"⚔️  CONFLICTOS GLOBALES",disease:"🦠  BROTES GLOBALES — OMS",climate:"🌍  CLIMA + SISMOS + HURACANES",news:"📰  ECONOMÍA & POLÍTICA"};
const NEXT={war:"🦠 ENFERMEDADES",disease:"🌍 CLIMA",climate:"📰 ECONOMÍA",news:"⚔️ CONFLICTOS"};
const ACC={war:"#ff2020",disease:"#ff6600",climate:"#00aaff",news:"#ffcc00"};
const BG={war:"#040810",disease:"#04080a",climate:"#030c10",news:"#080804"};
const ISO_COL={
  war:{"840":"#ff2020","364":"#ff1a1a","376":"#ff1a1a","422":"#ff4444","804":"#ff8800","643":"#ff4400","586":"#ff5500","4":"#ff5500","784":"#ff8800","634":"#ff8800","48":"#ff8800","414":"#ff8800","682":"#ff9900","196":"#ff8800","724":"#ffcc00","156":"#ffcc00","356":"#ffaa44","484":"#88cc00","368":"#ff6600","400":"#ffcc00","792":"#ffcc00","818":"#ffcc00","250":"#4466ff","380":"#4466ff","528":"#4466ff","826":"#4466ff","300":"#4466ff"},
  disease:{"156":"#ff4400","180":"#ff6600","840":"#ffaa00","729":"#ff8800","76":"#ff6600","430":"#cc0000","356":"#ff4400","484":"#ff2200","710":"#ff8800","410":"#ffcc00","360":"#ff9900","608":"#ff7733"},
  climate:{"356":"#ff2200","840":"#aa44ff","50":"#6633ff","124":"#00ccff","36":"#ff3300","76":"#0055ff","392":"#ffaa00","360":"#ff9900","608":"#7733ff","724":"#ff5500","250":"#0066ff","152":"#ffbb00","484":"#8844ff"},
  news:{"840":"#ff6600","276":"#4488ff","250":"#4488ff","156":"#ffcc00","364":"#ff4444","643":"#ff7700","76":"#44ffaa","826":"#4466ff","724":"#ff6600","380":"#4466ff","392":"#ff3344","682":"#ffaa00","484":"#ffaa44","528":"#4466ff"},
};

// ── MODE VOICE ANNOUNCEMENTS ───────────────────────────────────────────────────
const MODE_VOICE = {
  war:"Cambiando a modo conflictos globales. Actualmente hay guerra activa entre Estados Unidos e Irán, en el día siete de la Operación Epic Fury. Hay cinco portaaviones desplegados y más de mil trescientas personas muertas.",
  disease:"Cambiando a modo brotes de enfermedades. Hay un brote activo de sarampión en México. El virus H cinco N uno está en alerta pandémica máxima en Estados Unidos. El mundo enfrenta siete emergencias sanitarias simultáneas.",
  climate:"Cambiando a modo clima. Hay tornados activos en Estados Unidos, ola de calor de cincuenta y un grados en India, incendios en Australia, e inundaciones en Europa. Sismos y huracanes monitoreados en tiempo real por USGS y NOAA.",
  news:"Cambiando a modo economía y noticias. El petróleo está a noventa y un dólares el barril, subió treinta y uno por ciento en la semana. El Fondo Monetario Internacional alerta sobre una posible recesión global. Wall Street cayó seis punto dos por ciento.",
};

function hurCol(k){k=parseInt(k)||0;if(k>=137)return"#ff0000";if(k>=113)return"#ff4400";if(k>=96)return"#ff8800";if(k>=64)return"#8844ff";return"#6666ff";}
function hurCat(k){k=parseInt(k)||0;if(k>=137)return"CAT5";if(k>=113)return"CAT4";if(k>=96)return"CAT3";if(k>=64)return"CAT1-2";return"T.TROP";}
function magCol(m){if(m>=7)return"#ff0000";if(m>=6)return"#ff4400";return"#ff8800";}

function speakText(txt,rate=1.05){
  try{
    window.speechSynthesis.cancel();
    const c=txt.replace(/[🔴🟠🟡🟢⚠️☣️🦟🌋🌀🌊🔥🧊☀️🌪️❄️🛢️🏦🗳️📊📉₿🌐🛡️📰☠🚫🚢😢🇺🇸🇮🇷🇮🇱🇱🇧🇺🇦🇷🇺🇵🇰🇦🇫🇸🇦🇨🇾🇪🇸🇨🇳🇮🇳🇲🇽🇫🇷🇮🇹🇬🇧🇳🇱🇬🇷🇩🇪🇧🇷🇯🇵🇦🇺🇨🇦🇰🇷🇵🇭🇮🇩🇱🇷🇸🇩🇨🇩🇨🇱🇧🇩]/gu,"").replace(/\n/g,". ").replace(/\s+/g," ").trim();
    const u=new SpeechSynthesisUtterance(c);u.lang="es-MX";u.rate=rate;u.pitch=1.3;u.volume=0.95;
    const vs=window.speechSynthesis.getVoices();
    // Pick from a list of female Spanish voices, rotating
    const femaleNames=/monica|paulina|lucia|sabina|rosa|elena|conchita|angelica|lupe|paloma|susana|pilar|maria|fernanda|valeria|camila|andrea|sofia|isabel|beatriz/i;
    const femVoices=vs.filter(v=>v.lang.startsWith("es")&&femaleNames.test(v.name));
    const esGoogle=vs.find(v=>v.lang.startsWith("es")&&v.name.includes("Google"));
    const fallback=vs.find(v=>v.lang.startsWith("es"));
    const v=femVoices.length>0?femVoices[Math.floor(Math.random()*femVoices.length)]:esGoogle||fallback||vs[0];
    if(v)u.voice=v;
    window.speechSynthesis.speak(u);
  }catch(e){}
}

// ── CLOCK ──────────────────────────────────────────────────────────────────────
function Clock({ac}){
  const[t,setT]=useState(new Date());
  useEffect(()=>{const iv=setInterval(()=>setT(new Date()),1000);return()=>clearInterval(iv);},[]);
  const hh=String(t.getHours()).padStart(2,"0");
  const mm=String(t.getMinutes()).padStart(2,"0");
  const ss=String(t.getSeconds()).padStart(2,"0");
  const blink=t.getSeconds()%2===0;
  const days=["DOM","LUN","MAR","MIÉ","JUE","VIE","SÁB"];
  const months=["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];
  const day=days[t.getDay()],date=t.getDate(),month=months[t.getMonth()];
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"2px",padding:"6px 14px",border:`1px solid ${ac}22`,borderRadius:"4px",background:"#0a0a0a"}}>
      <div style={{fontSize:"8px",color:"#333",letterSpacing:"3px"}}>{day} {date} {month} 2026</div>
      <div style={{display:"flex",alignItems:"baseline",gap:"2px",fontFamily:"'Courier New',monospace"}}>
        <span style={{fontSize:"26px",fontWeight:"900",color:ac,textShadow:`0 0 16px ${ac}`,lineHeight:1,letterSpacing:"2px"}}>{hh}</span>
        <span style={{fontSize:"22px",fontWeight:"900",color:ac,opacity:blink?1:0.15,transition:"opacity 0.1s",lineHeight:1}}>:</span>
        <span style={{fontSize:"26px",fontWeight:"900",color:ac,textShadow:`0 0 16px ${ac}`,lineHeight:1,letterSpacing:"2px"}}>{mm}</span>
        <span style={{fontSize:"16px",fontWeight:"900",color:ac,opacity:blink?1:0.15,transition:"opacity 0.1s",lineHeight:1}}>:</span>
        <span style={{fontSize:"16px",fontWeight:"700",color:`${ac}aa`,lineHeight:1,letterSpacing:"1px"}}>{ss}</span>
      </div>
      <div style={{fontSize:"6px",color:"#2a2a2a",letterSpacing:"3px"}}>TOLUCA • MÉXICO</div>
    </div>
  );
}

// ── DYNAMIC WORLD ICON BAR ────────────────────────────────────────────────────
function IconBar({quakes,hurricanes,noaaChecked,wlive,mode,ac}){
  const icons=[];
  if(mode==="climate"||mode==="news"){
    if(hurricanes.length>0) hurricanes.forEach(h=>icons.push({icon:"🌀",label:`${h.name} ${hurCat(h.kts)}`,c:hurCol(h.kts),note:"NOAA LIVE"}));
    if(noaaChecked&&hurricanes.length===0) icons.push({icon:"🌀",label:"SIN HURACANES",c:"#333",note:"NOAA"});
    quakes.filter(q=>q.mag>=6).slice(0,3).forEach(q=>icons.push({icon:"🌋",label:`M${q.mag.toFixed(1)} ${q.place.split(",")[0].substring(0,10)}`,c:magCol(q.mag),note:"USGS"}));
    if(wlive.india?.temperature_2m>44) icons.push({icon:"🔥",label:`INDIA ${wlive.india.temperature_2m}°C`,c:"#ff2200",note:"LIVE"});
    if(wlive.mexico?.wind_speed_10m>60) icons.push({icon:"🌪️",label:`MX ${wlive.mexico.wind_speed_10m}km/h`,c:"#8844ff",note:"LIVE"});
  }
  if(mode==="war"){
    icons.push({icon:"🚢",label:"5 PORTAAVIONES",c:"#4488ff",note:"EN GUERRA"});
    icons.push({icon:"🚫",label:"ORMUZ CERRADO",c:"#ff0000",note:"6 MAR"});
    icons.push({icon:"⚠️",label:"RUSIA+IRÁN",c:"#ff4400",note:"INTEL"});
  }
  if(mode==="disease"){
    icons.push({icon:"🔴",label:"SARAMPIÓN MX",c:"#ff2200",note:"ACTIVO"});
    icons.push({icon:"⚠️",label:"H5N1 USA",c:"#ffaa00",note:"PANDÉMICO"});
    icons.push({icon:"☣️",label:"ÉBOLA LIBERIA",c:"#cc0000",note:"FEB 2026"});
  }
  if(mode==="news"){
    icons.push({icon:"📉",label:"BOLSAS -6%",c:"#ff3344",note:"HOY"});
    icons.push({icon:"🛢️",label:"$91/BARRIL",c:"#ffaa00",note:"+31%"});
    icons.push({icon:"🥇",label:"ORO $3200",c:"#ffdd00",note:"RÉCORD"});
  }
  if(!icons.length)return null;
  return(
    <div style={{width:"100%",maxWidth:"980px",marginBottom:"6px",display:"flex",gap:"4px",flexWrap:"wrap"}}>
      {icons.map((ic,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:"4px",padding:"3px 8px",background:"#0a0a0a",border:`1px solid ${ic.c}30`,borderRadius:"3px",cursor:"default"}}>
          <span style={{fontSize:"12px"}}>{ic.icon}</span>
          <div>
            <div style={{fontSize:"7.5px",color:ic.c,letterSpacing:"1px",fontFamily:"'Courier New',monospace",lineHeight:1.2}}>{ic.label}</div>
            <div style={{fontSize:"6px",color:"#333",letterSpacing:"1px"}}>{ic.note}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── MAIN APP ───────────────────────────────────────────────────────────────────
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
  const audioRef=useRef(null);
  const lastHov=useRef(0);
  const lastCC=useRef(null);
  const ac=ACC[mode],bg=BG[mode],isoM=ISO_COL[mode]||{};
  const modeCountryData=ALL_COUNTRY_DATA[mode]||{};

  const clmPoints=[...BASE_CLIMATE,...quakes.map(q=>({id:`q_${q.id}`,name:`SISMO M${q.mag.toFixed(1)}\n${q.place.split(",")[0].substring(0,12).toUpperCase()}`,lat:q.lat,lng:q.lng,c:magCol(q.mag),s:Math.min(5,Math.round(q.mag-3)),st:"extremo",icon:"🌋",pulse:q.mag>=6,fecha:new Date(q.time).toLocaleDateString("es-MX",{day:"2-digit",month:"short"}).toUpperCase()+" 2026",det:`Sismo M${q.mag.toFixed(1)} en ${q.place}. Profundidad: ${q.depth}km. ${q.mag>=7?"⚠️ ALERTA TSUNAMI ACTIVA.":q.mag>=6?"Monitoreo de tsunami activo.":"Sin riesgo de tsunami."} USGS, ${new Date(q.time).toLocaleString("es-MX")}`})),...hurricanes.map(h=>{const pos=hurPos[h.id]||{lat:h.lat,lng:h.lng};return{id:`hur_${h.id}`,name:`🌀 ${h.name}\n${hurCat(h.kts)}`,lat:pos.lat,lng:pos.lng,c:hurCol(h.kts),s:5,st:"extremo",icon:"🌀",pulse:true,fecha:"NOAA LIVE",det:`Huracán ${h.name} — ${hurCat(h.kts)}. Vientos: ${Math.round(h.kts*1.852)} km/h. Posición: ${pos.lat?.toFixed(2)}°lat, ${pos.lng?.toFixed(2)}°lng. Fuente: NOAA NHC en tiempo real.`};})];

  const DATA_MAP={war:BASE_WAR,disease:BASE_DISEASE,climate:clmPoints,news:BASE_NEWS};
  const STATS_MAP={
    war:[{l:"MUERTOS IRÁN",v:"1,332+",c:"#ff1a1a",snd:"alert"},{l:"NIÑOS",v:"181 😢",c:"#ff4444",snd:"alert"},{l:"OBJETIVOS US",v:"3,000+",c:"#ff6600",snd:"pop"},{l:"PORTAAVIONES",v:"5 🚢",c:"#4488ff",snd:"ping"},{l:"PETRÓLEO",v:"$91↑31%",c:"#ffaa00",snd:"pop"},{l:"ORMUZ",v:"🚫CERRADO",c:"#ff0000",snd:"alert"},{l:"DÍA GUERRA",v:"7",c:"#ffcc00",snd:"ping"},{l:"RUSIA+IRÁN",v:"⚠️INTEL",c:"#ff4400",snd:"alert"}],
    disease:[{l:"SARAMPIÓN MX",v:"🔴ACTIVO",c:"#ff2200",snd:"alert"},{l:"MPOX",v:"100K+",c:"#ff6600",snd:"pop"},{l:"H5N1",v:"⚠️ALTO",c:"#ffaa00",snd:"alert"},{l:"DENGUE",v:"5M casos",c:"#ff8800",snd:"pop"},{l:"ÉBOLA",v:"ALERTA",c:"#cc0000",snd:"alert"},{l:"PAÍSES AFECT.",v:"47",c:"#ffcc00",snd:"ping"},{l:"COVID XEC",v:"MONIT.",c:"#ff4400",snd:"pop"},{l:"NIVEL OMS",v:"EMERGENCIA",c:"#ff2020",snd:"alert"}],
    climate:[{l:"HURACANES",v:"NOAA LIVE",c:"#8844ff",snd:"alert"},{l:"SISMOS M5.5+",v:"USGS LIVE",c:"#ffaa00",snd:"alert"},{l:"INDIA MAX",v:"51°C 🔥",c:"#ff2200",snd:"pop"},{l:"USA MIN",v:"-35°C 🧊",c:"#00ccff",snd:"pop"},{l:"EVACUADOS",v:"6.5M",c:"#ff8800",snd:"ping"},{l:"INCENDIOS",v:"2.1M ha",c:"#ff3300",snd:"pop"},{l:"INUNDAC.",v:"EUROPA",c:"#0066ff",snd:"alert"},{l:"CO₂",v:"428 ppm",c:"#ffaa00",snd:"ping"}],
    news:[{l:"PETRÓLEO",v:"$91↑31%",c:"#ffaa00",snd:"pop"},{l:"ORO/ONZA",v:"$3,200↑",c:"#ffdd00",snd:"pop"},{l:"BITCOIN",v:"$62K↓",c:"#ff9900",snd:"alert"},{l:"DOW JONES",v:"-6.2%↓",c:"#ff3344",snd:"alert"},{l:"ARANCELES",v:"25% EU",c:"#ff6600",snd:"alert"},{l:"FMI",v:"RECESIÓN",c:"#ffee00",snd:"alert"},{l:"ELECCIONES",v:"2 ACTIVAS",c:"#4488ff",snd:"ping"},{l:"OTAN CUMBRE",v:"12 MAR",c:"#4466ff",snd:"pop"}],
  };
  const pts=DATA_MAP[mode]||[],sts=STATS_MAP[mode];

  // Map
  useEffect(()=>{
    let done=false;
    (async()=>{try{const[topo,world]=await Promise.all([import("https://cdn.skypack.dev/topojson-client@3"),fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then(r=>r.json())]);if(done)return;const p=d3.geoNaturalEarth1().scale(150).translate([W/2,H/2+15]);const path=d3.geoPath(p);const features=topo.feature(world,world.objects.countries).features;const paths=features.map(f=>({id:String(f.id),d:path(f)||""}));setProj(()=>p);setGeo({paths,borders:path(topo.mesh(world,world.objects.countries,(a,b)=>a!==b)),sphere:path({type:"Sphere"})});}catch(e){console.error(e);}})();
    return()=>{done=true;};
  },[]);

  // USGS
  const fetchQuakes=useCallback(async()=>{try{const r=await fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/5.0_day.geojson");const d=await r.json();const now=Date.now();setQuakes(d.features.filter(f=>f.properties.mag>=5.5&&(now-f.properties.time)<48*3600*1000).map(f=>({id:f.id,mag:f.properties.mag,place:f.properties.place||"Océano",lat:f.geometry.coordinates[1],lng:f.geometry.coordinates[0],depth:Math.round(f.geometry.coordinates[2]),time:f.properties.time})));}catch(e){setQuakes([]);}},[]);
  useEffect(()=>{fetchQuakes();const iv=setInterval(fetchQuakes,5*60*1000);return()=>clearInterval(iv);},[fetchQuakes]);

  // NOAA
  const fetchHurricanes=useCallback(async()=>{try{const r=await fetch("https://www.nhc.noaa.gov/CurrentStorms.json");const d=await r.json();setNoaaChecked(true);if(d.activeStorms?.length>0){const a=d.activeStorms.map(s=>({id:s.id,name:s.name||"Storm",kts:parseInt(s.intensity)||65,lat:parseFloat(s.latitudeNumeric)||20,lng:parseFloat(s.longitudeNumeric)||-85,dir:parseInt(s.movementDir)||315,spd:parseInt(s.movementSpeed)||12}));setHurricanes(a);setHurPos(Object.fromEntries(a.map(h=>[h.id,{lat:h.lat,lng:h.lng}])));setHurTracks(Object.fromEntries(a.map(h=>[h.id,[{lat:h.lat,lng:h.lng}]])));}else setHurricanes([]);}catch(e){setNoaaChecked(true);setHurricanes([]);}},[]);
  useEffect(()=>{fetchHurricanes();const iv=setInterval(fetchHurricanes,30*60*1000);return()=>clearInterval(iv);},[fetchHurricanes]);

  useEffect(()=>{if(!hurricanes.length)return;const iv=setInterval(()=>{setHurPos(prev=>{const n={...prev};hurricanes.forEach(h=>{const p=prev[h.id]||{lat:h.lat,lng:h.lng};const rad=(h.dir*Math.PI)/180;const step=(h.spd/111)*(30/3600);n[h.id]={lat:p.lat+Math.cos(rad)*step,lng:p.lng+Math.sin(rad)*step};});return n;});},30000);return()=>clearInterval(iv);},[hurricanes]);

  // Open-Meteo
  useEffect(()=>{
    const spots=[{k:"india",lat:26.8,lng:80.9},{k:"spain",lat:37.5,lng:-4},{k:"aus",lat:-33.8,lng:149},{k:"mexico",lat:19.4,lng:-99.1},{k:"iran",lat:32.4,lng:53.7}];
    const go=async()=>{const obj={};await Promise.all(spots.map(async({k,lat,lng})=>{try{const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,wind_speed_10m&forecast_days=1&timezone=auto`);const d=await r.json();if(d.current)obj[k]=d.current;}catch(e){}}));setWlive(obj);};
    go();const iv=setInterval(go,5*60*1000);return()=>clearInterval(iv);
  },[]);

  // Claude AI
  const fetchAI=useCallback(async()=>{
    setAiLoading(true);
    try{const qs={war:"En máximo 18 palabras, cuál es la noticia más urgente hoy sobre la guerra Irán EE.UU.? Solo la oración.",news:"En máximo 18 palabras, cuál es la noticia económica más importante hoy? Solo la oración.",disease:"En máximo 18 palabras, cuál es el brote de enfermedad más crítico hoy? Solo la oración.",climate:"En máximo 18 palabras, cuál es el evento climático más severo activo hoy? Solo la oración."};const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:80,tools:[{type:"web_search_20250305",name:"web_search"}],messages:[{role:"user",content:qs[mode]||qs.war}]})});const data=await r.json();const txt=data.content?.filter(b=>b.type==="text").map(b=>b.text).join("").trim();if(txt)setAiHeadline(txt.slice(0,160));}catch(e){}
    setAiLoading(false);
  },[mode]);
  useEffect(()=>{fetchAI();const iv=setInterval(fetchAI,15*60*1000);return()=>clearInterval(iv);},[mode]);

  useEffect(()=>{window.speechSynthesis.getVoices();return()=>window.speechSynthesis.cancel();},[]);
  const xy=useCallback((lat,lng)=>{if(!proj)return null;return proj([lng,lat]);},[proj]);
  const getCtx=useCallback(()=>{if(!audioRef.current)audioRef.current=new(window.AudioContext||window.webkitAudioContext)();if(audioRef.current.state==="suspended")audioRef.current.resume();return audioRef.current;},[]);

  const playHov=useCallback((gid)=>{const now=Date.now();if(now-lastHov.current<110||gid===lastCC.current)return;lastHov.current=now;lastCC.current=gid;try{const c=getCtx(),sc=SCALES[mode],freq=sc[parseInt(gid,10)%sc.length],t=c.currentTime;const o=c.createOscillator(),g=c.createGain(),flt=c.createBiquadFilter();flt.type="lowpass";flt.frequency.value=2000;o.connect(flt);flt.connect(g);g.connect(c.destination);o.type=mode==="war"?"sawtooth":mode==="disease"?"triangle":"sine";o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(0.04,t+0.025);g.gain.exponentialRampToValueAtTime(0.001,t+0.22);o.start(t);o.stop(t+0.23);}catch(e){}},[mode,getCtx]);

  const playS=useCallback((type)=>{try{const c=getCtx(),t=c.currentTime;if(type==="pop"){const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="sine";o.frequency.setValueAtTime(850,t);o.frequency.exponentialRampToValueAtTime(180,t+0.09);g.gain.setValueAtTime(0.22,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.1);o.start(t);o.stop(t+0.1);}else if(type==="alert"){[0,0.15].forEach(dl=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="square";o.frequency.value=520;g.gain.setValueAtTime(0.08,t+dl);g.gain.exponentialRampToValueAtTime(0.001,t+dl+0.1);o.start(t+dl);o.stop(t+dl+0.11);});}else if(type==="ping"){const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="sine";o.frequency.value=1047;g.gain.setValueAtTime(0.18,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.5);o.start(t);o.stop(t+0.5);}else if(type==="switch"){const fs={war:[415,311,261,220],disease:[220,261,311,415],climate:[261,329,392,523],news:[293,369,440,587]};(fs[mode]||fs.war).forEach((f,i)=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="sine";o.frequency.value=f;const dl=i*0.07;g.gain.setValueAtTime(0,t+dl);g.gain.linearRampToValueAtTime(0.11,t+dl+0.025);g.gain.exponentialRampToValueAtTime(0.001,t+dl+0.12);o.start(t+dl);o.stop(t+dl+0.13);});}else if(type==="select"){const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type="sine";o.frequency.setValueAtTime(660,t);o.frequency.linearRampToValueAtTime(900,t+0.06);g.gain.setValueAtTime(0.15,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.3);o.start(t);o.stop(t+0.3);}}catch(e){}},[mode,getCtx]);

  const doStat=(st,e,i)=>{playS(st.snd);const r=e.currentTarget.getBoundingClientRect();const rp={id:Date.now(),x:e.clientX-r.left,y:e.clientY-r.top,c:st.c};setRipples(p=>({...p,[i]:[...(p[i]||[]),rp]}));setTimeout(()=>setRipples(p=>({...p,[i]:(p[i]||[]).filter(x=>x.id!==rp.id)})),900);};

  const cycleMode=()=>{
    playS("switch");window.speechSynthesis.cancel();
    const idx=MODES.indexOf(mode);const nextMode=MODES[(idx+1)%MODES.length];setMode(nextMode);setSel(null);lastCC.current=null;
    setTimeout(()=>speakText(MODE_VOICE[nextMode],1.0),300);
  };

  const doPoint=(pt)=>{playS("select");setPing(pt.id);setTimeout(()=>setPing(null),700);const isNew=sel?.id!==pt.id;setSel(isNew?pt:null);if(isNew)setTimeout(()=>speakText(pt.det||""),200);else window.speechSynthesis.cancel();};

  const doCountry=(id)=>{
    const data=modeCountryData[id];if(!data)return;
    playS("select");
    const pt={id:`cc_${mode}_${id}`,name:data.name,c:data.c||isoM[id]||"#ff4400",s:3,st:"activo",det:data.det,fecha:data.fecha};
    const isNew=sel?.id!==pt.id;setSel(isNew?pt:null);
    if(isNew)setTimeout(()=>speakText(data.det),200);else window.speechSynthesis.cancel();
  };

  const connLines=[];
  if(mode==="war")BASE_WAR.forEach(p=>(p.conn||[]).forEach(tid=>{const tgt=BASE_WAR.find(x=>x.id===tid);if(tgt){const a=xy(p.lat,p.lng),b=xy(tgt.lat,tgt.lng);if(a&&b)connLines.push({x1:a[0],y1:a[1],x2:b[0],y2:b[1],col:p.c,key:`${p.id}-${tid}`});}}));

  return(
    <div style={{background:bg,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",padding:"10px 8px 14px",fontFamily:"'Courier New',monospace",color:"#fff",transition:"background 0.5s",userSelect:"none"}}>

      {/* TOP */}
      <div style={{width:"100%",maxWidth:"980px",marginBottom:"7px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"8px"}}>
        <div style={{flex:1,minWidth:"220px"}}>
          <div style={{fontSize:"8px",letterSpacing:"4px",color:ac,animation:"blink 1s steps(1) infinite"}}>⬤ {aiLoading?"AI BUSCANDO...":"TIEMPO REAL"} • 🔊 VOZ • USGS+NOAA+AI</div>
          <h1 style={{fontSize:"clamp(10px,1.7vw,16px)",fontWeight:"900",letterSpacing:"2px",color:"#fff",margin:"2px 0 0",textShadow:`0 0 20px ${ac}`}}>{TITLES[mode]}</h1>
          <div style={{fontSize:"7px",color:"#252525",letterSpacing:"1px",marginTop:"1px"}}>SISMOS: {quakes.length} M5.5+ • HURACANES: {noaaChecked?(hurricanes.length>0?`${hurricanes.length} ACTIVOS`:"NINGUNO"):"..."}</div>
          {aiHeadline&&<div style={{marginTop:"4px",fontSize:"8px",color:ac,maxWidth:"500px",lineHeight:"1.4"}}>🤖 {aiHeadline}</div>}
        </div>
        <Clock ac={ac}/>
        <div style={{display:"flex",flexDirection:"column",gap:"5px",alignItems:"flex-end"}}>
          <button onClick={cycleMode} style={{padding:"7px 13px",background:"transparent",border:`1px solid ${ac}`,borderRadius:"3px",color:ac,fontFamily:"'Courier New',monospace",fontSize:"10px",letterSpacing:"2px",cursor:"pointer",fontWeight:"bold",whiteSpace:"nowrap"}} onMouseEnter={e=>e.currentTarget.style.boxShadow=`0 0 22px ${ac}90`} onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>{NEXT[mode]} →</button>
          <button onClick={()=>{fetchQuakes();fetchHurricanes();fetchAI();}} style={{padding:"4px 10px",background:"transparent",border:`1px solid ${ac}25`,borderRadius:"3px",color:`${ac}70`,fontFamily:"'Courier New',monospace",fontSize:"8px",cursor:"pointer",letterSpacing:"1px"}}>⟳ ACTUALIZAR</button>
          <div style={{display:"flex",gap:"5px",marginTop:"2px"}}>{MODES.map(m=><div key={m} style={{width:"6px",height:"6px",borderRadius:"50%",background:m===mode?ACC[m]:"#1a1a1a",boxShadow:m===mode?`0 0 6px ${ACC[m]}`:"none",transition:"all 0.3s"}}/>)}</div>
        </div>
      </div>

      {/* DYNAMIC ICON BAR */}
      <IconBar quakes={quakes} hurricanes={hurricanes} noaaChecked={noaaChecked} wlive={wlive} mode={mode} ac={ac}/>

      {/* ALERTS */}
      {mode==="war"&&(
        <div style={{width:"100%",maxWidth:"980px",marginBottom:"6px",display:"flex",gap:"4px",flexWrap:"wrap"}}>
          {[{txt:"🇷🇺 RUSIA → INTELIGENCIA A IRÁN — 6 MAR",c:"#ff4400",id:"ra",name:"RUSIA ⚠️INTEL",det:"Rusia proporcionando inteligencia a Irán sobre posiciones exactas de tropas y barcos de EE.UU. Primera señal de intervención directa de Moscú en la guerra."},
            {txt:"🇫🇷 CHARLES DE GAULLE → MEDITERRÁNEO — 5 MAR",c:"#4466ff",id:"cg",name:"CHARLES D.G.",det:"Macron envió el portaaviones Charles de Gaulle al Mediterráneo para defender Chipre junto a Italia, España, Países Bajos y Grecia."},
            {txt:"🇺🇦 UCRANIA AYUDA A EE.UU. CON DRONES — 5 MAR",c:"#ffcc00",id:"uh",name:"UCRANIA AYUDA",det:"Trump pidió a Zelenski asistencia con drones Shahed iraníes. Zelenski aceptó y envió especialistas ucranianos a la zona de operaciones."},
          ].map((a,i)=>(<div key={i} style={{flex:1,padding:"4px 9px",background:"#08040a",border:`1px solid ${a.c}`,borderRadius:"3px",fontSize:"7.5px",color:a.c,cursor:"pointer",minWidth:"180px",animation:i===0?"blink 2.2s steps(1) infinite":"none"}} onClick={()=>doPoint({id:a.id,name:a.name,c:a.c,s:5,st:"critico",fecha:"6 MAR 2026",det:a.det})}>{a.txt}</div>))}
        </div>
      )}
      {mode==="disease"&&(<div style={{width:"100%",maxWidth:"980px",marginBottom:"6px",padding:"5px 12px",background:"#0a0402",border:"1px solid #ff4400",borderRadius:"3px",fontSize:"8px",color:"#ff4400",letterSpacing:"1px",animation:"blink 2.2s steps(1) infinite",cursor:"pointer"}} onClick={()=>doPoint(BASE_DISEASE[0])}>🔴 BROTE ACTIVO: SARAMPIÓN EN MÉXICO — CDMX, JALISCO, NUEVO LEÓN — MAR 2026</div>)}

      {/* MAP */}
      <div style={{width:"100%",maxWidth:"980px",position:"relative",border:`1px solid ${ac}14`,borderRadius:"6px",overflow:"hidden",boxShadow:`0 0 40px ${ac}10`,background:"#020610"}}>
        {!geo&&(<div style={{height:"440px",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"12px"}}><div style={{fontSize:"22px",animation:"spin 1.5s linear infinite"}}>🌍</div><div style={{fontSize:"9px",color:ac,letterSpacing:"4px",animation:"blink 1s steps(1) infinite"}}>CARGANDO MAPA...</div></div>)}
        {geo&&(
          <svg viewBox={`0 0 ${W} ${H}`} style={{display:"block",width:"100%"}}>
            <rect width={W} height={H} fill="#020814"/>
            {geo.sphere&&<path d={geo.sphere} fill="#020a14" stroke={ac} strokeWidth="0.3" strokeOpacity="0.1"/>}
            {geo.paths.map(({id,d})=>{
              const col=isoM[id];
              const hasCE=!!modeCountryData[id];
              return(<path key={id} d={d} fill={col?col+"1c":"#080e08"} stroke={col?col:"#0c1c0c"} strokeWidth={col?0.55:0.18} strokeOpacity={col?0.48:1} onMouseEnter={()=>playHov(id)} style={{cursor:hasCE?"pointer":"default",transition:"fill 0.1s"}} onMouseOver={e=>{if(col)e.target.setAttribute("fill",col+(hasCE?"66":"36"));}} onMouseOut={e=>{e.target.setAttribute("fill",col?col+"1c":"#080e08");}} onClick={()=>hasCE&&doCountry(id)}/>);
            })}
            {geo.borders&&<path d={geo.borders} fill="none" stroke="#0c1e0c" strokeWidth="0.18"/>}
            {connLines.map(l=>(<g key={l.key}><line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={l.col} strokeWidth="0.6" strokeOpacity="0.38" strokeDasharray="4,4"><animate attributeName="stroke-dashoffset" from="0" to="-16" dur="0.8s" repeatCount="indefinite"/></line></g>))}
            {/* CARRIERS with flag labels */}
            {mode==="war"&&CARRIERS.map(cv=>{const p=xy(cv.lat,cv.lng);if(!p)return null;const[cx,cy]=p,cc=cv.pais==="FRANCIA"?"#4466ff":"#4488ff";return(<g key={cv.id} onClick={()=>doPoint({id:cv.id,name:`${cv.flag} ${cv.name}`,lat:cv.lat,lng:cv.lng,c:cc,s:5,st:"activo",fecha:cv.fecha,det:cv.det})} style={{cursor:"pointer"}}><ellipse cx={cx} cy={cy} rx={15} ry={3.5} fill="none" stroke={cc} strokeWidth="0.4" strokeOpacity="0.2" transform={`rotate(-22,${cx},${cy})`}><animate attributeName="rx" values="15;21;15" dur="3s" repeatCount="indefinite"/></ellipse><g style={{filter:`drop-shadow(0 0 4px ${cc})`}}><rect x={cx-10} y={cy-1.8} width={20} height={4} fill={cc} rx="2" opacity="0.92"/><rect x={cx-6} y={cy-4} width={10} height={2.4} fill={cc} rx="0.8" opacity="0.88"/><rect x={cx+2} y={cy-6.5} width={4} height={3} fill={cc==="#4466ff"?"#8899ff":"#66aaff"} rx="0.8"/></g><text x={cx} y={cy-9} textAnchor="middle" fill={cc} fontSize="5.5" fontFamily="'Courier New',monospace" fontWeight="bold" style={{pointerEvents:"none"}}>{cv.flag} {cv.name}</text><text x={cx} y={cy-17} textAnchor="middle" fill={`${cc}99`} fontSize="4.5" fontFamily="'Courier New',monospace" style={{pointerEvents:"none"}}>{cv.pais}</text></g>);})}
            {/* Hurricanes */}
            {mode==="climate"&&hurricanes.map(h=>{const pos=hurPos[h.id]||{lat:h.lat,lng:h.lng};const ph=xy(pos.lat,pos.lng);if(!ph)return null;const[hx,hy]=ph,hc=hurCol(h.kts);return(<g key={`h-${h.id}`} onClick={()=>doPoint({id:`hur_${h.id}`,name:`🌀 ${h.name}`,lat:pos.lat,lng:pos.lng,c:hc,s:5,st:"extremo",icon:"🌀",fecha:"NOAA LIVE",det:`Huracán ${h.name} — ${hurCat(h.kts)}. ${Math.round(h.kts*1.852)} km/h. ${pos.lat?.toFixed(2)}°, ${pos.lng?.toFixed(2)}°. Fuente: NOAA NHC.`})} style={{cursor:"pointer"}}>{[0,1,2].map(i=>(<circle key={i} cx={hx} cy={hy} r={7} fill="none" stroke={hc} strokeWidth="0.7" opacity="0"><animate attributeName="r" from="7" to={7+i*13} dur={`${1.5+i*0.5}s`} begin={`${i*0.4}s`} repeatCount="indefinite"/><animate attributeName="opacity" from="0.7" to="0" dur={`${1.5+i*0.5}s`} begin={`${i*0.4}s`} repeatCount="indefinite"/></circle>))}<circle cx={hx} cy={hy} r="5" fill={hc} opacity="0.75"/><g><animateTransform attributeName="transform" type="rotate" from={`0 ${hx} ${hy}`} to={`360 ${hx} ${hy}`} dur="3.5s" repeatCount="indefinite"/>{[0,90,180,270].map(a=>{const rad=(a*Math.PI)/180;return<line key={a} x1={hx+Math.cos(rad)*3} y1={hy+Math.sin(rad)*3} x2={hx+Math.cos(rad)*7.5} y2={hy+Math.sin(rad)*7.5} stroke={hc} strokeWidth="1.4" strokeLinecap="round" opacity="0.85"/>;})}</g><text x={hx} y={hy-11} textAnchor="middle" fill={hc} fontSize="6.5" fontFamily="'Courier New',monospace" fontWeight="bold" style={{pointerEvents:"none"}}>{h.name}</text></g>);})}
            {mode==="climate"&&noaaChecked&&hurricanes.length===0&&(<text x={W/2} y={H-12} textAnchor="middle" fill="#2a1a3a" fontSize="9" fontFamily="'Courier New',monospace">🌀 NOAA: SIN HURACANES ACTIVOS AHORA</text>)}
            {/* Points */}
            {pts.filter(pt=>pt.lat&&pt.lng).map(pt=>{const p=xy(pt.lat,pt.lng);if(!p)return null;const[px,py]=p,isSel=sel?.id===pt.id,isPing=ping===pt.id,r=isSel?9:6.5,ptc=pt.c||"#ff4400";return(<g key={pt.id} onClick={()=>doPoint(pt)} style={{cursor:"pointer"}}>{pt.pulse&&[0,1,2].map(i=>(<circle key={i} cx={px} cy={py} r={r} fill="none" stroke={ptc} strokeWidth="0.65" opacity="0"><animate attributeName="r" from={r} to={r+26} dur={`${1.8+i*0.6}s`} begin={`${i*0.5}s`} repeatCount="indefinite"/><animate attributeName="opacity" from="0.55" to="0" dur={`${1.8+i*0.6}s`} begin={`${i*0.5}s`} repeatCount="indefinite"/></circle>))}{isPing&&(<circle cx={px} cy={py} r={r} fill="none" stroke="#fff" strokeWidth="2" opacity="0.9"><animate attributeName="r" from={r} to={r+22} dur="0.6s"/><animate attributeName="opacity" from="0.9" to="0" dur="0.6s"/></circle>)}{isSel&&(<circle cx={px} cy={py} r={r+5} fill="none" stroke={ptc} strokeWidth="1.1" strokeDasharray="3,3" opacity="0.85"><animateTransform attributeName="transform" type="rotate" from={`0 ${px} ${py}`} to={`360 ${px} ${py}`} dur="4s" repeatCount="indefinite"/></circle>)}<circle cx={px} cy={py} r={r} fill={ptc} style={{filter:`drop-shadow(0 0 ${isSel?13:6}px ${ptc})`}}/><circle cx={px} cy={py} r={r*0.36} fill="rgba(255,255,255,0.55)"/>{pt.icon&&<text x={px} y={py+2.5} textAnchor="middle" fontSize="5.5" style={{pointerEvents:"none"}}>{pt.icon}</text>}{(pt.name||"").split("\n").map((ln,li)=>(<text key={li} x={px} y={py-r-2.5-((pt.name||"").split("\n").length-1-li)*8} textAnchor="middle" fill={ptc} fontSize={isSel?8:6.5} fontFamily="'Courier New',monospace" fontWeight="bold" style={{pointerEvents:"none",filter:`drop-shadow(0 0 3px ${ptc})`}}>{ln}</text>))}</g>);})}
          </svg>
        )}
        <div style={{position:"absolute",inset:0,pointerEvents:"none",background:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.02) 2px,rgba(0,0,0,0.02) 4px)"}}/>
        {[{top:"5px",left:"5px"},{top:"5px",right:"5px"},{bottom:"5px",left:"5px"},{bottom:"5px",right:"5px"}].map((pos,i)=>(<div key={i} style={{position:"absolute",...pos,width:"12px",height:"12px",borderTop:pos.top?`1px solid ${ac}40`:"none",borderBottom:pos.bottom?`1px solid ${ac}40`:"none",borderLeft:pos.left?`1px solid ${ac}40`:"none",borderRight:pos.right?`1px solid ${ac}40`:"none",pointerEvents:"none"}}/>))}
        <div style={{position:"absolute",bottom:"4px",left:"50%",transform:"translateX(-50%)",fontSize:"6.5px",color:"#141414",letterSpacing:"2px",pointerEvents:"none",whiteSpace:"nowrap"}}>CURSOR→MÚSICA • PUNTOS→DETALLES+🔊 • PAÍSES ILUMINADOS=TOCA • PORTAAVIONES→TOCA</div>
      </div>

      {/* INFO PANEL */}
      {sel&&(
        <div style={{marginTop:"9px",padding:"12px 15px",background:bg,border:`1px solid ${sel.c||"#ff4400"}`,borderRadius:"4px",width:"100%",maxWidth:"980px",boxShadow:`0 0 28px ${(sel.c||"#ff4400")}22`,animation:"slideIn 0.2s ease"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"}}>
              <span style={{fontSize:"13px",fontWeight:"900",letterSpacing:"2px",color:sel.c||"#ff4400",textShadow:`0 0 10px ${sel.c||"#ff4400"}`}}>{sel.icon||""} {(sel.name||"").replace(/\n/g," ")}</span>
              <span style={{fontSize:"7px",background:sel.c||"#ff4400",color:"#000",padding:"2px 7px",borderRadius:"2px",letterSpacing:"2px",fontWeight:"bold"}}>{STATUS_L[sel.st]||"ACTIVO"}</span>
              {sel.fecha&&<span style={{fontSize:"7px",color:"#444",border:`1px solid ${sel.c||"#ff4400"}30`,padding:"2px 6px",borderRadius:"2px",letterSpacing:"1px"}}>{sel.fecha}</span>}
              {sel.s&&<span style={{fontSize:"8px",color:"#333"}}>{"▮".repeat(sel.s)}{"▯".repeat(5-sel.s)}</span>}
              <span style={{fontSize:"7px",color:ac,letterSpacing:"2px",animation:"blink 1s steps(1) infinite"}}>🔊 VOZ</span>
            </div>
            <button onClick={()=>{setSel(null);window.speechSynthesis.cancel();}} style={{background:"none",border:"none",color:"#444",cursor:"pointer",fontSize:"15px",lineHeight:1,padding:"0 0 0 8px",flexShrink:0}}>✕</button>
          </div>
          <div style={{marginTop:"8px",fontSize:"11px",color:"#ccc",lineHeight:"1.85",borderTop:`1px solid ${(sel.c||"#ff4400")}15`,paddingTop:"8px"}}>{sel.det||"Cargando..."}</div>
        </div>
      )}

      {/* STATS */}
      <div style={{marginTop:"10px",display:"flex",gap:"5px",flexWrap:"wrap",justifyContent:"center",width:"100%",maxWidth:"980px"}}>
        {sts.map((st,i)=>(<button key={st.l} onClick={e=>doStat(st,e,i)} style={{position:"relative",overflow:"hidden",background:bg,border:`1px solid ${st.c}22`,borderRadius:"4px",padding:"7px 9px",textAlign:"center",minWidth:"88px",cursor:"pointer",fontFamily:"'Courier New',monospace",transition:"all 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.border=`1px solid ${st.c}`;e.currentTarget.style.boxShadow=`0 0 12px ${st.c}42`;e.currentTarget.style.transform="translateY(-3px)";}} onMouseLeave={e=>{e.currentTarget.style.border=`1px solid ${st.c}22`;e.currentTarget.style.boxShadow="none";e.currentTarget.style.transform="translateY(0)";}}>
          {(ripples[i]||[]).map(rp=>(<div key={rp.id} style={{position:"absolute",left:rp.x-50,top:rp.y-50,width:"100px",height:"100px",borderRadius:"50%",background:`radial-gradient(circle,${rp.c}55 0%,transparent 70%)`,animation:"rippleOut 0.9s ease-out forwards",pointerEvents:"none"}}/>))}
          <div style={{fontSize:"13px",fontWeight:"900",color:st.c,textShadow:`0 0 7px ${st.c}55`,position:"relative"}}>{st.v}</div>
          <div style={{fontSize:"6px",color:"#2d2d2d",letterSpacing:"1.5px",marginTop:"2px",position:"relative"}}>{st.l}</div>
        </button>))}
      </div>

      {/* BOTTOM STRIPS */}
      {mode==="climate"&&(
        <div style={{marginTop:"7px",width:"100%",maxWidth:"980px",display:"flex",gap:"5px",flexWrap:"wrap"}}>
          {Object.keys(wlive).length>0&&(<div style={{flex:2,background:"#020a08",border:"1px solid #00ff8818",borderRadius:"4px",padding:"5px 12px",display:"flex",gap:"10px",flexWrap:"wrap",alignItems:"center"}}><span style={{fontSize:"7.5px",color:"#00ff88",letterSpacing:"3px",fontWeight:"bold"}}>📡 LIVE</span>{wlive.india&&<span style={{fontSize:"8px",color:"#ff4400"}}>🔥 INDIA {wlive.india.temperature_2m}°C</span>}{wlive.spain&&<span style={{fontSize:"8px",color:"#ff6600"}}>☀️ ESPAÑA {wlive.spain.temperature_2m}°C</span>}{wlive.aus&&<span style={{fontSize:"8px",color:"#ff3300"}}>🔥 AUS {wlive.aus.temperature_2m}°C</span>}{wlive.mexico&&<span style={{fontSize:"8px",color:"#8844ff"}}>🌀 MX {wlive.mexico.temperature_2m}°C {wlive.mexico.wind_speed_10m}km/h</span>}{wlive.iran&&<span style={{fontSize:"8px",color:"#ff2020"}}>🔴 IRÁN {wlive.iran.temperature_2m}°C</span>}</div>)}
          {quakes.length>0&&(<div style={{flex:2,background:"#0a0800",border:"1px solid #ffaa0018",borderRadius:"4px",padding:"5px 12px",display:"flex",gap:"8px",flexWrap:"wrap",alignItems:"center"}}><span style={{fontSize:"7.5px",color:"#ffaa00",letterSpacing:"2px",fontWeight:"bold"}}>🌋 USGS {quakes.length}</span>{quakes.slice(0,4).map(q=><span key={q.id} style={{fontSize:"8px",color:magCol(q.mag)}}>M{q.mag.toFixed(1)} {q.place.split(",")[0].substring(0,10)}</span>)}</div>)}
        </div>
      )}
      {mode==="news"&&(<div style={{marginTop:"7px",width:"100%",maxWidth:"980px",background:"#080804",border:"1px solid #ffcc0018",borderRadius:"4px",padding:"5px 12px",overflow:"hidden"}}><div style={{fontSize:"8.5px",color:"#ffcc00",letterSpacing:"1.5px",whiteSpace:"nowrap",animation:"ticker 38s linear infinite"}}>🛢️ PETRÓLEO $91 +31% — 6 MAR &nbsp;•&nbsp; 📉 NASDAQ -6.2% &nbsp;•&nbsp; 🗳️ CDU 29% AfD 20% ALEMANIA — 23 FEB &nbsp;•&nbsp; ₿ $62K — 6 MAR &nbsp;•&nbsp; 🥇 ORO $3,200 RÉCORD — 6 MAR &nbsp;•&nbsp; 🛡️ OTAN CUMBRE 12 MAR &nbsp;•&nbsp; 📊 FMI: RECESIÓN GLOBAL POSIBLE &nbsp;•&nbsp; 🇫🇷 LE PEN 34% — MAY 2026 &nbsp;•&nbsp; 📊 ARANCELES 25% EU 15 MAR &nbsp;•&nbsp; 🇮🇷 JAMENEI HIJO NUEVO LÍDER — 6 MAR &nbsp;•&nbsp; 🚢 MAERSK SUSPENDE MEDIO ORIENTE &nbsp;•&nbsp; 🌐 BRICS ALTERNATIVA AL DÓLAR</div></div>)}

      <div style={{marginTop:"6px",fontSize:"6.5px",color:"#111",letterSpacing:"2px",textAlign:"center"}}>USGS+NOAA+Open-Meteo+Claude AI — TIEMPO REAL — MONITOR GLOBAL 2026</div>

      <style>{`
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes rippleOut{0%{transform:scale(0.1);opacity:1}100%{transform:scale(4.5);opacity:0}}
        @keyframes slideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes ticker{0%{transform:translateX(100%)}100%{transform:translateX(-240%)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      `}</style>
    </div>
  );
}
