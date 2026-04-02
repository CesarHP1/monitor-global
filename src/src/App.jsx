// @ts-nocheck
import { useState, useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";

const W = 960, H = 480;

// 🌐 APIs
const API = {
  crypto: "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd",
  forex: "https://api.frankfurter.app/latest?from=USD&to=MXN",
  quakes: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"
};

// 🔁 fetch seguro
async function fetchJSON(url){
  try{
    const r = await fetch(url);
    return await r.json();
  }catch{
    return null;
  }
}
function useRealtime(){

  const [data,setData] = useState({
    btc:null,
    eth:null,
    usd_mxn:null,
    quakes:[]
  });

  const load = useCallback(async ()=>{
    const [crypto, forex, quakes] = await Promise.all([
      fetchJSON(API.crypto),
      fetchJSON(API.forex),
      fetchJSON(API.quakes)
    ]);

    setData({
      btc: crypto?.bitcoin?.usd,
      eth: crypto?.ethereum?.usd,
      usd_mxn: forex?.rates?.MXN,
      quakes: quakes?.features?.slice(0,15) || []
    });
  },[]);

  useEffect(()=>{
    load();

    const interval = setInterval(load, 60000);

    return ()=>clearInterval(interval);
  },[load]);

  return data;
}
// 🧠 alerta inteligente
function generateAlert(rt){
  if(!rt) return "Cargando...";

  let msg = [];

  if(rt.btc > 70000) msg.push("Bitcoin en subida");
  if(rt.btc < 60000) msg.push("Bitcoin en caída");

  if(rt.usd_mxn > 19.5) msg.push("Peso débil");
  if(rt.usd_mxn < 18.5) msg.push("Peso fuerte");

  if(rt.quakes?.length > 10) msg.push("Alta actividad sísmica");

  return msg.length ? msg.join(" • ") : "Sistema estable";
}

// 📊 panel
function RealtimePanel({rt}){
  return (
    <div style={{
      position:"absolute",
      top:10,
      right:10,
      background:"#000c",
      color:"#0f0",
      padding:10,
      fontSize:12
    }}>
      <div>BTC: {rt.btc ?? "--"}</div>
      <div>ETH: {rt.eth ?? "--"}</div>
      <div>USD/MXN: {rt.usd_mxn ?? "--"}</div>
      <div>Sismos: {rt.quakes?.length ?? 0}</div>
    </div>
  );
}

// 🚨 barra
function AlertBar({rt}){
  return (
    <div style={{
      position:"absolute",
      bottom:0,
      width:"100%",
      background:"#200",
      color:"#f00",
      padding:6,
      textAlign:"center"
    }}>
      ⚠️ {generateAlert(rt)}
    </div>
  );
}
function drawQuakes(rt){

  if(!rt?.quakes) return;

  const svg = d3.select("#map");
  svg.selectAll("*").remove();

  svg.selectAll("circle")
    .data(rt.quakes)
    .enter()
    .append("circle")
    .attr("cx", d => d.geometry.coordinates[0] + 480)
    .attr("cy", d => d.geometry.coordinates[1] + 240)
    .attr("r", d => d.properties.mag * 2)
    .attr("fill", d => 
      d.properties.mag >= 6 ? "#ff0000" :
      d.properties.mag >= 5 ? "#ff8800" :
      "#ffff00"
    )
    .attr("opacity",0.7);
}
export default function App(){

  const rt = useRealtime();
  const lastSpeech = useRef(0);

  // 🔊 voz controlada
  useEffect(()=>{
    if(!rt?.btc) return;

    const now = Date.now();

    if(now - lastSpeech.current > 60000){
      const msg = generateAlert(rt);
      const u = new SpeechSynthesisUtterance(msg);
      u.lang = "es-MX";
      speechSynthesis.speak(u);
      lastSpeech.current = now;
    }

  },[rt]);

  // 🛰️ dibujar sismos
  useEffect(()=>{
    drawQuakes(rt);
  },[rt]);

  return (
    <>
      <svg id="map" width={W} height={H}></svg>

      <RealtimePanel rt={rt}/>
      <AlertBar rt={rt}/>
    </>
  );
}
