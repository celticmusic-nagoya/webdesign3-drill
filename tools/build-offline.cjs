#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
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
const offlineUI=`<div id="offline-reader-overlay" hidden style="position:fixed;inset:0;z-index:99999;background:#0f172a;display:none;flex-direction:column">
<div style="display:flex;flex-wrap:wrap;gap:6px;padding:8px;background:#1e293b;color:white"><button id="offline-reader-back" type="button" style="padding:8px;background:#334155;color:white">← 戻る</button><button id="offline-pdf-1" type="button" style="padding:8px;background:#2563eb;color:white">第1回 PDFを開く</button><button id="offline-pdf-2" type="button" style="padding:8px;background:#2563eb;color:white">第2回 PDFを開く</button><span id="offline-pdf-help" role="status" aria-live="polite" style="font-size:12px;align-self:center;color:#cbd5e1">原資料をアプリ内で閲覧できます</span></div>
<iframe id="offline-reader-frame" title="オフライン教科書" style="width:100%;flex:1;border:0;background:white"></iframe>
<div id="offline-pdf-viewer" hidden style="display:none;flex:1;min-height:0;flex-direction:column;background:#334155;color:white">
<div style="display:flex;align-items:center;justify-content:center;gap:10px;padding:7px;flex-wrap:wrap"><button id="offline-pdf-prev" type="button">前へ</button><span id="offline-pdf-page" role="status">PDF読み込み中</span><button id="offline-pdf-next" type="button">次へ</button><button id="offline-pdf-zoom-in" type="button">拡大 ＋</button><button id="offline-pdf-zoom-out" type="button">縮小 −</button><button id="offline-pdf-zoom-reset" type="button">画面幅</button><span id="offline-pdf-zoom-label" role="status">100%</span><button id="offline-pdf-close" type="button">教科書の同じページへ</button></div>
<div id="offline-pdf-scroll" style="overflow:auto;flex:1;text-align:center;padding:12px"><canvas id="offline-pdf-canvas" style="max-width:100%;height:auto;background:white"></canvas></div>
</div></div>
<script>
(function(){
const bytes=Uint8Array.from(atob(${embeddedReader}),c=>c.charCodeAt(0));
const readerSource=new TextDecoder('utf-8').decode(bytes)
 .replace('図解・画像・レイアウトはテキスト抽出版では再現していません。','本文は検索可能なテキスト版です。各ページの下に原資料の図表・レイアウトを画像で掲載しています。')
 .replace('図表や元のレイアウトを確認する場合は原PDFを開いてください。','各ページ下部に原資料画像を表示します。全ページの確認は上部の「PDFを開く」を使用してください。')
 .replace('</head>','<style>header{position:static!important}header nav a{display:none!important}</style></head>');
const embeddedPageImages=__EMBEDDED_PDF_PAGE_IMAGES__;
let figureRenderToken=0;
async function attachTextbookFigures(){
 const doc=frame.contentDocument;
 if(!doc||doc.getElementById('original-figure-panel'))return;
 const pageText=doc.getElementById('page-text');
 if(!pageText)return;
 const panel=doc.createElement('section');
 panel.id='original-figure-panel';
 panel.style.cssText='margin:24px 0;padding:14px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;color:#1e293b';
 const heading=doc.createElement('h3');
 heading.textContent='原資料の図表・レイアウト';
 heading.style.cssText='margin:0 0 8px;font-size:1.05rem';
 const hint=doc.createElement('p');
 hint.style.cssText='margin:0 0 12px;font-size:.86rem;line-height:1.6';
 hint.textContent='本文と同じ原資料ページを表示します。図表の位置・内容は原本のままです。';
 const canvas=doc.createElement('img');
 canvas.id='original-figure-canvas';
 canvas.style.cssText='display:block;width:100%;height:auto;background:white;border-radius:6px';
 const status=doc.createElement('p');
 status.id='original-figure-status';
 status.style.cssText='font-size:.85rem;margin:8px 0 0';
 const zoomControls=doc.createElement('div');
 zoomControls.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin:8px 0';
 const zoomIn=doc.createElement('button');
 zoomIn.id='original-figure-zoom-in';zoomIn.type='button';zoomIn.textContent='図表を拡大 ＋';
 const zoomOut=doc.createElement('button');
 zoomOut.id='original-figure-zoom-out';zoomOut.type='button';zoomOut.textContent='縮小 −';
 const zoomReset=doc.createElement('button');
 zoomReset.id='original-figure-zoom-reset';zoomReset.type='button';zoomReset.textContent='画面幅に戻す';
 const zoomLabel=doc.createElement('span');
 zoomLabel.id='original-figure-zoom-label';zoomLabel.style.cssText='align-self:center;font-size:.85rem';
 zoomControls.append(zoomIn,zoomOut,zoomReset,zoomLabel);
 const scrollArea=doc.createElement('div');
 scrollArea.id='original-figure-scroll';
 scrollArea.style.cssText='overflow:auto;max-width:100%;overscroll-behavior:contain';
 scrollArea.append(canvas);
 const focusPanel=doc.createElement('section');
 focusPanel.id='original-figure-focus-panel';
 focusPanel.hidden=true;
 focusPanel.style.cssText='margin:12px 0;padding:12px;background:#fff;border:1px solid #cbd5e1;border-radius:8px';
 const focusHeading=doc.createElement('h4');
 focusHeading.textContent='重要図解を拡大して確認';
 focusHeading.style.cssText='margin:0 0 6px;font-size:1rem';
 const focusHint=doc.createElement('p');
 focusHint.textContent='原資料の一部を拡大表示しています。図全体は下の原資料ページで確認できます。';
 focusHint.style.cssText='font-size:.82rem;line-height:1.6;margin:0 0 8px';
 const focusImage=doc.createElement('img');
 focusImage.id='original-figure-focus-image';
 focusImage.alt='原資料の重要図解（拡大表示）';
 focusImage.style.cssText='display:block;width:100%;height:auto';
 focusPanel.append(focusHeading,focusHint,focusImage);
 panel.append(heading,hint,focusPanel,zoomControls,scrollArea,status);
 let zoom=1;
 const applyZoom=()=>{
  canvas.style.width=(zoom*100)+'%';
  canvas.style.maxWidth='none';
  zoomLabel.textContent=Math.round(zoom*100)+'%';
 };
 zoomIn.addEventListener('click',()=>{zoom=Math.min(3,Math.round((zoom+.25)*100)/100);applyZoom();});
 zoomOut.addEventListener('click',()=>{zoom=Math.max(1,Math.round((zoom-.25)*100)/100);applyZoom();});
 zoomReset.addEventListener('click',()=>{zoom=1;applyZoom();});
 canvas.addEventListener('click',()=>{zoom=zoom===1?2:1;applyZoom();});
 canvas.alt='原資料の図表（日本語文字を含むページ画像）';
 canvas.tabIndex=0;
 canvas.setAttribute('role','button');
 canvas.setAttribute('aria-label','図表をタップして拡大・縮小');
 canvas.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();zoom=zoom===1?2:1;applyZoom();}});
 applyZoom();
 pageText.insertAdjacentElement('afterend',panel);
 const getPage=()=>{
  const book=Number(doc.getElementById('book')?.value||0);
  const match=(doc.getElementById('page-label')?.textContent||'').match(/(\\d+)\\s*\\/\\s*\\d+/);
  return {book,page:match?Number(match[1]):1};
 };
 async function render(){
  const token=++figureRenderToken;
  const {book,page}=getPage();
  if(book<0||book>1)return;
  status.textContent='原資料の図表を読み込み中…';
  try{
   const image=embeddedPageImages[book]?.[page-1];
   if(!image)throw Error('原資料のページ画像がありません');
   await new Promise((resolve,reject)=>{
    const loaded=new Image();
    loaded.onload=()=>{if(token===figureRenderToken){canvas.src=image;}resolve();};
    loaded.onerror=()=>reject(new Error('ページ画像の読み込みに失敗'));
    loaded.src=image;
   });
   if(token===figureRenderToken){
    focusPanel.hidden=true;
    focusImage.removeAttribute('src');
    const region=book===1&&page===6?{x:.055,y:.158,w:.88,h:.81}:book===1&&page===7?{x:.058,y:.038,w:.88,h:.905}:null;
    if(region){
     const img=new Image();
     img.onload=()=>{
      if(token!==figureRenderToken)return;
      const crop=doc.createElement('canvas');
      crop.width=Math.round(img.naturalWidth*region.w);
      crop.height=Math.round(img.naturalHeight*region.h);
      crop.getContext('2d').drawImage(img,img.naturalWidth*region.x,img.naturalHeight*region.y,crop.width,crop.height,0,0,crop.width,crop.height);
      focusImage.src=crop.toDataURL('image/png');
      focusPanel.hidden=false;
     };
     img.src=image;
    }
    status.textContent='原資料 第'+(book+1)+'回・'+page+'ページ（日本語文字を画像として保持）';
   }
  }catch(err){if(token===figureRenderToken)status.textContent='図表を表示できません: '+err.message;}
 }
 const observer=new MutationObserver(()=>{render();});
 observer.observe(doc.getElementById('page-label'),{childList:true,characterData:true,subtree:true});
 doc.getElementById('book')?.addEventListener('change',()=>setTimeout(render,0));
 render();
}

let pdfBook=0,pdfPage=1;
const pdfView=document.getElementById('offline-pdf-viewer');
const pdfFrame=document.getElementById('offline-reader-frame');
const pdfLabel=document.getElementById('offline-pdf-page');
const pdfCanvas=document.getElementById('offline-pdf-canvas');
const pdfImage=document.createElement('img');
pdfImage.id='offline-pdf-image';
pdfImage.alt='原資料のPDFページ画像';
pdfImage.style.cssText='display:block;width:100%;max-width:none;height:auto;margin:auto;background:white';
let pdfZoom=1;
function applyPdfZoom(){pdfImage.style.width=(pdfZoom*100)+'%';document.getElementById('offline-pdf-zoom-label').textContent=Math.round(pdfZoom*100)+'%';}
document.getElementById('offline-pdf-zoom-in').addEventListener('click',()=>{pdfZoom=Math.min(3,Math.round((pdfZoom+.25)*100)/100);applyPdfZoom();});
document.getElementById('offline-pdf-zoom-out').addEventListener('click',()=>{pdfZoom=Math.max(1,Math.round((pdfZoom-.25)*100)/100);applyPdfZoom();});
document.getElementById('offline-pdf-zoom-reset').addEventListener('click',()=>{pdfZoom=1;applyPdfZoom();});
pdfCanvas.replaceWith(pdfImage);
function renderPdfPage(){
 const pages=embeddedPageImages[pdfBook]||[];
 if(pdfPage<1||pdfPage>pages.length){pdfLabel.textContent='原資料ページがありません';return;}
 pdfImage.src=pages[pdfPage-1];
 pdfLabel.textContent=pdfPage+' / '+pages.length;
}
function openOfflinePdf(i){
 pdfBook=i;pdfPage=1;
 try{
  const doc=frame.contentDocument;
  if(Number(doc?.getElementById('book')?.value)===i){
   const label=doc.getElementById('page-label')?.textContent||'';
   const match=label.match(/(\\d+)\\s*\\/\\s*\\d+/);
   if(match)pdfPage=Math.max(1,Math.min(embeddedPageImages[i].length,Number(match[1])));
  }
 }catch(e){}
 pdfZoom=1;applyPdfZoom();
 pdfView.hidden=false;pdfView.style.display='flex';pdfFrame.style.display='none';
 renderPdfPage();
}
document.getElementById('offline-pdf-prev').addEventListener('click',()=>{if(pdfPage>1){pdfPage--;renderPdfPage();}});
document.getElementById('offline-pdf-next').addEventListener('click',()=>{if(pdfPage<(embeddedPageImages[pdfBook]||[]).length){pdfPage++;renderPdfPage();}});
document.getElementById('offline-pdf-close').addEventListener('click',()=>{
 try{
  const doc=frame.contentDocument;
  const select=doc?.getElementById('book');
  if(select){
   if(Number(select.value)!==pdfBook){select.value=String(pdfBook);select.dispatchEvent(new Event('change',{bubbles:true}));}
   const button=doc.querySelector('#chapters button[data-page="'+(pdfPage-1)+'"]');
   button?.click();
  }
 }catch(e){console.warn('Reader page sync unavailable',e);}
 pdfView.style.display='none';pdfView.hidden=true;pdfFrame.style.display='block';
});
document.getElementById('offline-pdf-1').addEventListener('click',()=>openOfflinePdf(0));
document.getElementById('offline-pdf-2').addEventListener('click',()=>openOfflinePdf(1));
const overlay=document.getElementById('offline-reader-overlay');
const frame=document.getElementById('offline-reader-frame');
const open=document.getElementById('offline-textbook-link');
const back=document.getElementById('offline-reader-back');
if(!open||!overlay||!frame||!back)return;
frame.addEventListener('load',()=>attachTextbookFigures().catch(e=>console.warn('Original figures unavailable',e)));
open.addEventListener('click',function(e){e.preventDefault();frame.srcdoc=readerSource;overlay.hidden=false;overlay.style.display='flex';document.body.style.overflow='hidden'});
back.addEventListener('click',function(){pdfView.style.display='none';pdfView.hidden=true;pdfFrame.style.display='block';overlay.style.display='none';overlay.hidden=true;frame.removeAttribute('srcdoc');document.body.style.overflow=''});
})();
</script>`;
html=html.replace('</body>',offlineUI+'</body>');
// Build first; after Tailwind compilation inline all CSS into this same HTML.
fs.writeFileSync(path.join(out,'index.html'),html);
fs.copyFileSync('textbook.html',path.join(out,'textbook.html'));
fs.mkdirSync(path.join(out,'vendor/pdfjs'),{recursive:true});
for(const file of ['pdf.min.js','pdf.worker.min.js'])fs.copyFileSync(path.join('vendor/pdfjs',file),path.join(out,'vendor/pdfjs',file));
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
  const rasterized=['materials/lesson-01.pdf','materials/lesson-02.pdf'].map(file=>{
    const pdf=path.resolve(file);
    const info=execFileSync('pdfinfo',[pdf],{encoding:'utf8'});
    const count=Number(info.match(/^Pages:\s*(\d+)/m)?.[1]);
    if(!Number.isInteger(count)||count<1||count>100)throw Error('Invalid PDF page count: '+file);
    return Array.from({length:count},(_,i)=>{
      const output=path.join(out,'pdf-page-'+path.basename(file,'.pdf')+'-'+(i+1));
      execFileSync('pdftoppm',['-f',String(i+1),'-l',String(i+1),'-scale-to','1200','-png','-singlefile',pdf,output],{timeout:45000});
      const png=fs.readFileSync(output+'.png');
      fs.unlinkSync(output+'.png');
      if(png.length<1000)throw Error('PDF rasterization failed: '+file+' page '+(i+1));
      return 'data:image/png;base64,'+png.toString('base64');
    });
  });
  page=page.replace('__EMBEDDED_PDF_PAGE_IMAGES__',JSON.stringify(rasterized));
  if(page.includes('__EMBEDDED_PDF_PAGE_IMAGES__'))throw Error('PDF raster images not embedded');
  console.log('PASS: PDF pages rasterized with embedded fonts:',rasterized.map(x=>x.length));
  fs.writeFileSync(path.join(out,'index.html'),page);
  fs.unlinkSync(cssPath);
  if(page.includes('href="./offline.css"'))throw Error('CSS not embedded');
  console.log('PASS: compiled CSS inlined into standalone index.html');
}
if(process.argv.includes('--inline-css'))inlineCompiledStyles();
