#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const src=path.resolve('dist/webdesign3-offline'),out=path.resolve('dist/webdesign3-pwa');
const files=["textbook-original.html","homework-drill.html","materials/textbook-original.js","materials/homework-drill.js",'index.html','textbook.html','additional-materials.html','materials/question-sets-03-04.js','materials/lesson-01.pdf','materials/lesson-02.pdf',...['lesson-03.pdf','lesson-04.pdf','homework-03.pdf','homework-04.pdf','review-01-04-questions.pdf','review-01-04-answers.pdf','review-03-04-questions.pdf','review-03-04-answers.pdf'].map(x=>'materials/'+x)];
fs.mkdirSync(path.join(out,'materials'),{recursive:true});
for(const name of files){const from=path.join(src,name);if(!fs.existsSync(from))throw Error('Missing offline asset: '+name);fs.copyFileSync(from,path.join(out,name));}
let html=fs.readFileSync(path.join(out,'index.html'),'utf8');
if(!html.includes('id="offline-tailwind"'))throw Error('PWA requires self-contained compiled CSS');
const register=`<link rel="manifest" href="./manifest.webmanifest"><meta name="theme-color" content="#0f172a"><script>
if('serviceWorker' in navigator && location.protocol==='https:'){
window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(e=>console.warn('Offline installation unavailable',e)));
}
</script>`;
html=html.replace('</head>',register+'</head>');
fs.writeFileSync(path.join(out,'index.html'),html);
const version=crypto.createHash('sha256').update(html).digest('hex').slice(0,16);
const manifest={id:'./',name:'Webデザイン技能検定3級 学科試験対策',short_name:'Webデザイン3級',lang:'ja',start_url:'./index.html',scope:'./',display:'standalone',background_color:'#0f172a',theme_color:'#0f172a'};
fs.writeFileSync(path.join(out,'manifest.webmanifest'),JSON.stringify(manifest,null,2));
const assets=['./',...files.map(x=>'./'+x),'./manifest.webmanifest'];
const sw=`'use strict';
const CACHE='webdesign3-pwa-${version}';
const ASSETS=${JSON.stringify(assets)};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('webdesign3-pwa-')&&key!==CACHE).map(key=>caches.delete(key)))),self.clients.claim()])));
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
 event.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(req,copy));}return response;})));
});
`;
fs.writeFileSync(path.join(out,'sw.js'),sw);
if(!sw.includes('cache.addAll(ASSETS)')||!html.includes('manifest.webmanifest'))throw Error('PWA integrity failed');
console.log('PASS: PWA staged with offline pre-cache, version '+version);
console.log('Note: Service workers require HTTPS hosting; local content:// and file:// cannot install a PWA.');
