#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const out=path.resolve('dist/webdesign3-offline');
fs.mkdirSync(path.join(out,'materials'),{recursive:true});
const source=fs.readFileSync('index.html','utf8');
if(!source.includes('https://cdn.tailwindcss.com'))throw Error('Tailwind CDN script not found');
let html=source.replace(/<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>/,'<link rel="stylesheet" href="./offline.css">');
html=html.replace(/<script>\s*tailwind\.config\s*=\s*\{[\s\S]*?<\/script>/,'');
html=html.replace(/<link href="https:\/\/fonts\.googleapis\.com[^"]*" rel="stylesheet">/,'');
if(html.includes('cdn.tailwindcss.com')||html.includes('fonts.googleapis.com'))throw Error('Online style dependency remains');
// file:// and Android content:// URLs cannot reliably resolve sibling HTML files.
// Embed the reader in the entrypoint and show it in a sandboxed same-origin iframe.
const readerHtml=fs.readFileSync('textbook.html','utf8');
if(!html.includes('href="./textbook.html"'))throw Error('Reader navigation link missing');
const linkStart=html.indexOf('<a href="./textbook.html"');
if(linkStart<0)throw Error('Actual textbook anchor not found');
html=html.slice(0,linkStart)+html.slice(linkStart).replace('<a href="./textbook.html"','<a id="offline-textbook-link" href="#offline-textbook"');
const embeddedReader=JSON.stringify(Buffer.from(readerHtml,'utf8').toString('base64'));
const offlineUI=`<div id="offline-reader-overlay" hidden style="position:fixed;inset:0;z-index:99999;background:#0f172a;display:none;flex-direction:column">
<button id="offline-reader-back" type="button" style="flex:0 0 auto;padding:12px;background:#1e293b;color:white;font-size:16px;text-align:left">← 問題演習に戻る</button>
<iframe id="offline-reader-frame" title="オフライン教科書" style="width:100%;flex:1;border:0;background:white"></iframe></div>
<script>
(function(){
const bytes=Uint8Array.from(atob(${embeddedReader}),c=>c.charCodeAt(0));
const readerSource=new TextDecoder('utf-8').decode(bytes);
const overlay=document.getElementById('offline-reader-overlay');
const frame=document.getElementById('offline-reader-frame');
const open=document.getElementById('offline-textbook-link');
const back=document.getElementById('offline-reader-back');
if(!open||!overlay||!frame||!back)return;
open.addEventListener('click',function(e){e.preventDefault();frame.srcdoc=readerSource;overlay.hidden=false;overlay.style.display='flex';document.body.style.overflow='hidden'});
back.addEventListener('click',function(){overlay.style.display='none';overlay.hidden=true;frame.removeAttribute('srcdoc');document.body.style.overflow=''});
})();
</script>`;
html=html.replace('</body>',offlineUI+'</body>');
// Build first; after Tailwind compilation inline all CSS into this same HTML.
fs.writeFileSync(path.join(out,'index.html'),html);
fs.copyFileSync('textbook.html',path.join(out,'textbook.html'));
const manifest=JSON.parse(fs.readFileSync('materials/SOURCE_MANIFEST.json','utf8'));
for(const item of manifest.source_files){
  const p=item.expected_repository_path;
  const bytes=fs.readFileSync(p);
  const actual=crypto.createHash('sha256').update(bytes).digest('hex');
  if(actual!==item.sha256)throw Error('PDF checksum mismatch: '+p);
  fs.copyFileSync(p,path.join(out,p));
}
console.log('Offline HTML and original PDFs staged:',out);

function inlineCompiledStyles(){
  const cssPath=path.join(out,'offline.css');
  if(!fs.existsSync(cssPath)||fs.statSync(cssPath).size<1000)throw Error('Compiled CSS missing');
  let page=fs.readFileSync(path.join(out,'index.html'),'utf8');
  const css=fs.readFileSync(cssPath,'utf8');
  if(!page.includes('<link rel="stylesheet" href="./offline.css">'))throw Error('CSS link missing');
  page=page.replace('<link rel="stylesheet" href="./offline.css">','<style id="offline-tailwind">'+css+'</style>');
  fs.writeFileSync(path.join(out,'index.html'),page);
  fs.unlinkSync(cssPath);
  if(page.includes('href="./offline.css"'))throw Error('CSS not embedded');
  console.log('PASS: compiled CSS inlined into standalone index.html');
}
if(process.argv.includes('--inline-css'))inlineCompiledStyles();
