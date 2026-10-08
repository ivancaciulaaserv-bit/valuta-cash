const API_URL = "https://valuta-cash-api.ivan-caciula-aserv.workers.dev";

const FALLBACK = {
  updated:"2026-10-07",
  deghest:{
    USD:[17.70,18.05], EUR:[19.94,20.03], RON:[3.68,3.83],
    UAH:[0.37,0.39], CHF:[21.25,21.78], GBP:[23.44,23.93], RUB:[0.19,0.21]
  },
  maib:{
    EUR:[19.90,20.18], USD:[17.70,17.99], GBP:[23.40,23.80],
    RON:[3.70,3.82], UAH:[0.33,0.39], CHF:[21.30,21.70]
  },
  bnm:{
    EUR:[20.0391,20.0391], USD:[17.8236,17.8236], RON:[3.7485,3.7485],
    UAH:[0.3963,0.3963], RUB:[0.2077,0.2077], CHF:[21.4382,21.4382],
    GBP:[23.6110,23.6110]
  },
  banks:{
    "MAIB":{EUR:[19.90,20.15],USD:[17.70,17.99],GBP:[23.40,23.80],RON:[3.70,3.82],UAH:[0.33,0.39],CHF:[21.30,21.70]},
    "Victoriabank":{EUR:[19.93,20.23],USD:[17.72,18.05],GBP:[23.44,23.93],RON:[3.68,3.83],CHF:[21.25,21.78]},
    "Moldindconbank":{EUR:[19.93,20.18],USD:[17.73,17.98],GBP:[23.20,23.70],RON:[3.68,3.80],CHF:[21.20,21.70]},
    "OTP Bank Mobiasbanca":{EUR:[19.95,20.20],USD:[17.75,17.99],GBP:[23.45,24.00],RON:[3.68,3.78],UAH:[0.33,0.39]},
    "Eximbank":{EUR:[19.93,20.13]},
    "ProCredit Bank":{EUR:[19.95,20.18]},
    "FinComBank":{EUR:[19.95,20.12]},
    "Energbank":{EUR:[19.95,20.14]},
    "EuroCreditBank":{EUR:[19.91,20.11]}
  }
};

const currencies = {
  EUR:"Евро", USD:"Доллар", RON:"Лей RON", GBP:"Фунт",
  CHF:"Франк", RUB:"Рубль", UAH:"Гривна", MDL:"Лей MDL"
};

let rates = JSON.parse(localStorage.getItem("vc_rates") || "null") || FALLBACK;
let operation = "sell";

const $ = id => document.getElementById(id);
const money = n => Number(n||0).toLocaleString("ru-RU",{maximumFractionDigits:2});
const num = n => Number(String(n).replace(",", "."));

function fillSelect(id){
  const s=$(id);
  s.innerHTML="";
  Object.entries(currencies).forEach(([code,name])=>{
    const o=document.createElement("option"); o.value=code; o.textContent=`${code} — ${name}`; s.appendChild(o);
  });
}
["from","to","customFrom","customTo"].forEach(fillSelect);
$("from").value="EUR"; $("to").value="MDL";
$("customFrom").value="EUR"; $("customTo").value="MDL";

function sourceRates(){
  const source=$("source").value;
  if(source==="bank") return (rates.banks||{})[$("bank").value] || {};
  return rates[source] || {};
}

function getPairRate(from,to){
  if(from===to) return 1;
  const sr=sourceRates();
  if(to==="MDL" && sr[from]) return operation==="sell" ? sr[from][0] : sr[from][1];
  if(from==="MDL" && sr[to]) {
    const r=operation==="sell" ? sr[to][1] : sr[to][0];
    return 1/r;
  }
  if(sr[from] && sr[to]){
    const fromMdl=operation==="sell" ? sr[from][0] : sr[from][1];
    const toMdl=operation==="sell" ? sr[to][0] : sr[to][1];
    return fromMdl/toMdl;
  }
  return null;
}

function calcOnline(){
  const from=$("from").value,to=$("to").value,amount=num($("amount").value);
  const rate=getPairRate(from,to);
  if(rate==null){
    $("result").textContent="Нет курса";
    $("rateLine").textContent="Для этой пары источник пока не дал данных.";
    return;
  }
  let result=amount*rate;
  if($("commissionEnabled").checked) result*=1-num($("commission").value)/100;
  $("result").textContent=`${money(result)} ${to}`;
  $("rateLine").textContent=`1 ${from} = ${rate.toFixed(6)} ${to}`;
}

function updateSourceUI(){
  $("bankBox").classList.toggle("hidden",$("source").value!=="bank");
  calcOnline();
}

function setCustomLabels(){
  $("customRatePrefix").textContent=`1 ${$("customFrom").value} =`;
  $("customRateSuffix").textContent=$("customTo").value;
  calcCustom();
}

function customKey(){return $("customFrom").value+"_"+$("customTo").value}
function getSaved(){return JSON.parse(localStorage.getItem("vc_custom_rates")||"{}")}
function saveSaved(obj){localStorage.setItem("vc_custom_rates",JSON.stringify(obj))}

function calcCustom(){
  const rate=num($("customRate").value), amount=num($("customAmount").value);
  const from=$("customFrom").value,to=$("customTo").value;
  if(!rate || rate<=0){$("customResult").textContent="—";$("customRateLine").textContent="";return}
  $("customResult").textContent=`${money(amount*rate)} ${to}`;
  $("customRateLine").textContent=`1 ${from} = ${rate} ${to}`;
}

function renderSaved(){
  const box=$("savedRates"); box.innerHTML="";
  const saved=getSaved();
  const entries=Object.entries(saved);
  if(!entries.length){box.innerHTML='<div class="muted">Пока ничего не сохранено.</div>';return}
  entries.forEach(([key,rate])=>{
    const [from,to]=key.split("_");
    const div=document.createElement("div");div.className="savedItem";
    div.innerHTML=`<span>1 ${from} = <b>${rate}</b> ${to}</span><button data-key="${key}">✕</button>`;
    div.querySelector("span").onclick=()=>{
      $("customFrom").value=from;$("customTo").value=to;$("customRate").value=rate;setCustomLabels();
    };
    div.querySelector("button").onclick=()=>{const s=getSaved();delete s[key];saveSaved(s);renderSaved()};
    box.appendChild(div);
  });
}

document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{
  document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
  document.querySelectorAll(".panel").forEach(x=>x.classList.remove("active"));
  b.classList.add("active");$(b.dataset.tab).classList.add("active");
});

document.querySelectorAll(".op").forEach(b=>b.onclick=()=>{
  document.querySelectorAll(".op").forEach(x=>x.classList.remove("active"));
  b.classList.add("active");operation=b.dataset.op;calcOnline();
});

["source","bank","from","to","amount","commission","commissionEnabled"].forEach(id=>$(id).addEventListener("input",updateSourceUI));
$("swap").onclick=()=>{const a=$("from").value;$("from").value=$("to").value;$("to").value=a;calcOnline()};
$("refreshBtn").onclick=refreshRates;

["customFrom","customTo"].forEach(id=>$(id).addEventListener("change",setCustomLabels));
["customRate","customAmount"].forEach(id=>$(id).addEventListener("input",calcCustom));
$("customSwap").onclick=()=>{const a=$("customFrom").value;$("customFrom").value=$("customTo").value;$("customTo").value=a;setCustomLabels()};
document.querySelectorAll(".quick button").forEach(b=>b.onclick=()=>{$("customRate").value=b.dataset.rate;calcCustom()});

$("saveCustom").onclick=()=>{
  const rate=num($("customRate").value);
  if(!rate || rate<=0){alert("Введите курс больше нуля.");return}
  const s=getSaved();s[customKey()]=rate;saveSaved(s);renderSaved();
};
$("clearCustom").onclick=()=>{localStorage.removeItem("vc_custom_rates");renderSaved()};

async function refreshRates(){
  $("status").textContent="Обновление…";
  if(!API_URL){$("status").textContent=`Данные сохранены ${rates.updated||"локально"}`;calcOnline();return}
  try{
    const r=await fetch(API_URL,{cache:"no-store"});
    if(!r.ok) throw new Error("HTTP "+r.status);
    const data=await r.json();
    rates={...rates,...data};
    localStorage.setItem("vc_rates",JSON.stringify(rates));
    $("status").textContent="Курсы обновлены: "+(rates.updated||new Date().toLocaleString("ru-RU"));
  }catch(e){
    $("status").textContent="Нет связи — использую последние сохранённые курсы";
  }
  calcOnline();
}

if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(()=>{});
renderSaved();setCustomLabels();refreshRates();
setInterval(()=>{if(API_URL) refreshRates()},10*60*1000);
