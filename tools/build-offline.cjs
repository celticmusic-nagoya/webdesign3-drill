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
const linkStart=html.indexOf('<a id="textbook-open-link" href="./textbook.html"');
if(linkStart<0)throw Error('Actual textbook anchor not found');
html=html.slice(0,linkStart)+html.slice(linkStart).replace('<a id="textbook-open-link" href="./textbook.html"','<a id="offline-textbook-link" href="#offline-textbook"');
const embeddedReader=JSON.stringify(Buffer.from(readerHtml,'utf8').toString('base64'));
const pdfData=JSON.stringify(['materials/lesson-01.pdf','materials/lesson-02.pdf'].map(p=>fs.readFileSync(p).toString('base64')));
const offlineUI=`<div id="offline-reader-overlay" hidden style="position:fixed;inset:0;z-index:99999;background:#0f172a;display:none;flex-direction:column">
<div style="display:flex;flex-wrap:wrap;gap:6px;padding:8px;background:#1e293b;color:white"><button id="offline-reader-back" type="button" style="padding:8px;background:#334155;color:white">← 戻る</button><button id="offline-pdf-1" type="button" style="padding:8px;background:#2563eb;color:white">第1回 PDF保存</button><button id="offline-pdf-2" type="button" style="padding:8px;background:#2563eb;color:white">第2回 PDF保存</button><span id="offline-pdf-help" role="status" aria-live="polite" style="font-size:12px;align-self:center;color:#cbd5e1">PDFは保存後、Androidの「ダウンロード」から開いてください</span></div>
<iframe id="offline-reader-frame" title="オフライン教科書" style="width:100%;flex:1;border:0;background:white"></iframe>
<div id="offline-pdf-viewer" hidden style="display:none;flex:1;min-height:0;flex-direction:column;background:#334155;color:white">
<div style="display:flex;align-items:center;justify-content:center;gap:10px;padding:7px;flex-wrap:wrap"><button id="offline-pdf-prev" type="button">前へ</button><span id="offline-pdf-page" role="status">PDF読み込み中</span><button id="offline-pdf-next" type="button">次へ</button><button id="offline-pdf-close" type="button">教科書に戻る</button></div>
<div id="offline-pdf-scroll" style="overflow:auto;flex:1;text-align:center;padding:12px"><canvas id="offline-pdf-canvas" style="max-width:100%;height:auto;background:white"></canvas></div>
</div></div>
<script>
(function(){
const bytes=Uint8Array.from(atob(${embeddedReader}),c=>c.charCodeAt(0));
const readerSource=new TextDecoder('utf-8').decode(bytes);
const embeddedPdfs=${pdfData};
let pdfDocument=null,pdfPage=1,pdfBusy=false;
const pdfView=document.getElementById('offline-pdf-viewer');
const pdfFrame=document.getElementById('offline-reader-frame');
const pdfLabel=document.getElementById('offline-pdf-page');
async function renderPdfPage(){
 if(!pdfDocument||pdfBusy)return;
 pdfBusy=true;
 try{
  const page=await pdfDocument.getPage(pdfPage);
  const container=document.getElementById('offline-pdf-scroll');
  const base=page.getViewport({scale:1});
  const scale=Math.min(2,Math.max(.5,(container.clientWidth-24)/base.width))*Math.min(2,window.devicePixelRatio||1);
  const viewport=page.getViewport({scale});
  const canvas=document.getElementById('offline-pdf-canvas');
  canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
  canvas.style.width=(viewport.width/Math.min(2,window.devicePixelRatio||1))+'px';
  await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
  pdfLabel.textContent=pdfPage+' / '+pdfDocument.numPages;
 }catch(e){pdfLabel.textContent='PDF表示エラー: '+e.message;}finally{pdfBusy=false;}
}
async function openOfflinePdf(i){
 pdfView.hidden=false;pdfView.style.display='flex';pdfFrame.style.display='none';
 pdfLabel.textContent='PDF読み込み中…';
 try{
  if(!window.pdfjsLib)throw Error('PDF描画ライブラリが読み込めません');
  const binary=atob(embeddedPdfs[i]);
  const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
  pdfDocument=await pdfjsLib.getDocument({data:bytes}).promise;
  pdfPage=1;
  await renderPdfPage();
 }catch(e){pdfLabel.textContent='PDF表示エラー: '+e.message;}
}
document.getElementById('offline-pdf-prev').addEventListener('click',()=>{if(pdfDocument&&pdfPage>1&&!pdfBusy){pdfPage--;renderPdfPage();}});
document.getElementById('offline-pdf-next').addEventListener('click',()=>{if(pdfDocument&&pdfPage<pdfDocument.numPages&&!pdfBusy){pdfPage++;renderPdfPage();}});
document.getElementById('offline-pdf-close').addEventListener('click',()=>{pdfView.style.display='none';pdfView.hidden=true;pdfFrame.style.display='block';});
document.getElementById('offline-pdf-1').addEventListener('click',()=>openOfflinePdf(0));
document.getElementById('offline-pdf-2').addEventListener('click',()=>openOfflinePdf(1));
const overlay=document.getElementById('offline-reader-overlay');
const frame=document.getElementById('offline-reader-frame');
const open=document.getElementById('offline-textbook-link');
const back=document.getElementById('offline-reader-back');
if(!open||!overlay||!frame||!back)return;
open.addEventListener('click',function(e){e.preventDefault();frame.srcdoc=readerSource;overlay.hidden=false;overlay.style.display='flex';document.body.style.overflow='hidden'});
back.addEventListener('click',function(){pdfView.style.display='none';pdfView.hidden=true;pdfFrame.style.display='block';overlay.style.display='none';overlay.hidden=true;frame.removeAttribute('srcdoc');document.body.style.overflow=''});
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
  const pdfjsPath=require.resolve('pdfjs-dist/build/pdf.min.js');
  const workerPath=require.resolve('pdfjs-dist/build/pdf.worker.min.js');
  const pdfjs=fs.readFileSync(pdfjsPath,'utf8');
  const worker=fs.readFileSync(workerPath,'utf8');
  const setup='<script>'+pdfjs+';pdfjsLib.GlobalWorkerOptions.workerSrc=URL.createObjectURL(new Blob(['+JSON.stringify(worker)+'],{type:"text/javascript"}));</script>';
  page=page.replace('</body>',setup+'</body>');
  fs.writeFileSync(path.join(out,'index.html'),page);
  fs.unlinkSync(cssPath);
  if(page.includes('href="./offline.css"'))throw Error('CSS not embedded');
  console.log('PASS: compiled CSS inlined into standalone index.html');
}
if(process.argv.includes('--inline-css'))inlineCompiledStyles();
