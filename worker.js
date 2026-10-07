const EURO_MD = "https://euro.md/en/curs-valutar/";
const CURRENCIES = ["EUR","USD","RON","GBP","CHF","UAH","RUB"];
const BANKS = [
  "MAIB","Victoriabank","Moldindconbank","OTP Bank Mobiasbanca",
  "Eximbank","ProCredit Bank","FinComBank","Energbank","EuroCreditBank"
];

const headers = {
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Methods":"GET,OPTIONS",
  "Access-Control-Allow-Headers":"Content-Type",
  "Content-Type":"application/json; charset=utf-8"
};

function n(s){ return parseFloat(String(s).replace(/\s/g,"").replace(",", ".")); }

function clean(html){
  return html
    .replace(/<script[\s\S]*?<\/script>/gi," ")
    .replace(/<style[\s\S]*?<\/style>/gi," ")
    .replace(/<[^>]+>/g," ")
    .replace(/&nbsp;/gi," ")
    .replace(/&amp;/gi,"&")
    .replace(/\s+/g," ")
    .trim();
}

function extract(text, bank){
  const escaped=bank.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  const re=new RegExp(escaped+"\\s+([0-9]+[.,][0-9]+)\\s+([0-9]+[.,][0-9]+)","i");
  const m=text.match(re);
  return m ? [n(m[1]),n(m[2])] : null;
}

async function getCurrency(code){
  const r=await fetch(EURO_MD+code+"/",{headers:{"User-Agent":"ValutaCash/4"}});
  if(!r.ok) throw new Error("euro.md "+code+" HTTP "+r.status);
  return clean(await r.text());
}

async function getBanks(){
  const out={};
  const pages=await Promise.all(CURRENCIES.map(async code=>[code,await getCurrency(code)]));
  for(const [code,text] of pages){
    for(const bank of BANKS){
      const pair=extract(text,bank);
      if(pair){
        out[bank] ||= {};
        out[bank][code]=pair;
      }
    }
  }
  return out;
}

export default {
  async fetch(request){
    if(request.method==="OPTIONS") return new Response("",{headers});
    try{
      const banks=await getBanks();
      return new Response(JSON.stringify({
        updated:new Date().toLocaleString("ru-RU",{timeZone:"Europe/Chisinau"}),
        banks
      }),{headers});
    }catch(e){
      return new Response(JSON.stringify({error:String(e)}),{status:500,headers});
    }
  }
};