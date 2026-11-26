const CACHE_NAME='web3-study-reader-v9';
const ASSETS=["./","./index.html","./manifest.webmanifest","./exam-guide.html","./textbook.html","./textbook-original.html","./homework-drill.html","./materials/question-sets-03-04.js","./materials/textbook-original.js","./materials/homework-drill.js","./materials/攻略マニュアル.pdf"];
ASSETS.push("./reader-swipe.js","./additional-materials.html");
ASSETS.push(...Array.from({length:11},(_,i)=>'./materials/exam-guide-pages/page-'+String(i+1).padStart(2,'0')+'.webp'));
const PDFS=['./materials/lesson-01.pdf','./materials/lesson-02.pdf','./materials/lesson-03.pdf','./materials/lesson-04.pdf','./materials/homework-03.pdf','./materials/homework-04.pdf','./materials/review-01-04-questions.pdf','./materials/review-01-04-answers.pdf','./materials/review-03-04-questions.pdf','./materials/review-03-04-answers.pdf'];
const ENGINE=['https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js','https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'];
const OPTIONAL=[...PDFS,...ENGINE,'https://cdn.tailwindcss.com/'];
const scope=new URL(self.registration.scope);
self.addEventListener('install',e=>e.waitUntil((async()=>{const c=await caches.open(CACHE_NAME);await c.addAll(ASSETS);try{const u=new URL('./materials/textbook-pages/manifest.json',scope);const res=await fetch(u);if(res.ok){const data=await res.clone().json();const pages=Object.values(data).flatMap(b=>b.pages.map(p=>'./materials/textbook-pages/'+p.file));await c.addAll(pages);await c.put(u,res)}}catch(err){console.warn('Lecture page cache unavailable',err)}await Promise.allSettled(OPTIONAL.map(p=>c.add(p)));await self.skipWaiting()})()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith('web3-study-')&&k!==CACHE_NAME)await caches.delete(k);await self.clients.claim()})()));
async function cachedRange(c,q){
 const hit=await c.match(q.url);if(!hit)return new Response('Offline PDF unavailable',{status:503});
 const bytes=await hit.arrayBuffer(),length=bytes.byteLength,m=/^bytes=(\d*)-(\d*)$/.exec(q.headers.get('range'));
 const invalid=()=>new Response(null,{status:416,headers:{'Content-Range':'bytes */'+length}});
 if(!m||(!m[1]&&!m[2])||!length)return invalid();
 let start,end;if(!m[1]){const suffix=Number(m[2]);if(!Number.isSafeInteger(suffix)||suffix<1)return invalid();start=Math.max(0,length-suffix);end=length-1}else{start=Number(m[1]);end=m[2]?Math.min(Number(m[2]),length-1):length-1}
 if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>end||start>=length)return invalid();
 return new Response(bytes.slice(start,end+1),{status:206,headers:{'Content-Type':'application/pdf','Content-Range':'bytes '+start+'-'+end+'/'+length,'Content-Length':String(end-start+1),'Accept-Ranges':'bytes'}});
}
self.addEventListener('fetch',e=>{
 const q=e.request,u=new URL(q.url);if(q.method!=='GET')return;
 const local=u.origin===scope.origin&&u.pathname.startsWith(scope.pathname),external=ENGINE.includes(u.href)||u.href==='https://cdn.tailwindcss.com/';if(!local&&!external)return;
 e.respondWith((async()=>{const c=await caches.open(CACHE_NAME);
 if(q.headers.has('range')){try{return await fetch(q)}catch(err){return cachedRange(c,q)}}
 if(external){const hit=await c.match(q.url);if(hit)return hit}
 try{const r=await fetch(q);if(r.ok&&r.status===200){try{await c.put(q,r.clone())}catch(err){}}return r}catch(err){const hit=await c.match(q,{ignoreSearch:q.mode==='navigate'});return hit||new Response('Offline: resource unavailable',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}})}
 })());
});
