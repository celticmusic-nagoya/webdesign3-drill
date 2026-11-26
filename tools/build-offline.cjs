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
// Inline the additional 120 questions in the standalone HTML (file:// needs no sibling JS).
const extraQuestions=fs.readFileSync('materials/question-sets-03-04.js','utf8');
if(!extraQuestions.includes('window.ADDITIONAL_LECTURE_QUESTIONS = ['))throw Error('Additional questions not imported');
html=html.replace('<script src="./materials/question-sets-03-04.js"></script>','<script>'+extraQuestions+'</script>');
if(html.includes('cdn.tailwindcss.com')||html.includes('fonts.googleapis.com'))throw Error('Online style dependency remains');
// file:// and Android content:// URLs cannot reliably resolve sibling HTML files.
// Embed the reader in the entrypoint and show it in a sandboxed same-origin iframe.
const swipeCode=fs.readFileSync('reader-swipe.js','utf8');
const readerHtml=fs.readFileSync('textbook.html','utf8').replace('<script src="./reader-swipe.js"></script>',()=>'<script>'+swipeCode+'</script>');
html=html.replace('href="./exam-guide.html"','href="#offline-exam-guide"');
html=html.replace(/<script>if\('serviceWorker' in navigator&&location.protocol!=='file:'\)navigator.serviceWorker.register\('\.\/sw\.js'\).catch\(console.warn\);<\/script>/,'');
if(!html.includes('href="./textbook.html"'))throw Error('Reader navigation link missing');
const linkStart=html.indexOf('<a id="textbook-open-link" href="./textbook.html"');
if(linkStart<0)throw Error('Actual textbook anchor not found');
html=html.slice(0,linkStart)+html.slice(linkStart).replace('<a id="textbook-open-link" href="./textbook.html"','<a id="offline-textbook-link" href="#offline-textbook"');
const embeddedReader=JSON.stringify(Buffer.from(readerHtml,'utf8').toString('base64'));
const offlineUI=`<script>${swipeCode}</script><div id="offline-reader-overlay" hidden style="position:fixed;inset:0;z-index:99999;background:#0f172a;display:none;flex-direction:column">
<div style="display:flex;flex-wrap:wrap;gap:6px;padding:8px;background:#1e293b;color:white"><button id="offline-reader-back" type="button" style="padding:8px;background:#334155;color:white">← 戻る</button><button id="offline-pdf-1" type="button" style="padding:8px;background:#2563eb;color:white">第1回 PDFを開く</button><button id="offline-pdf-2" type="button" style="padding:8px;background:#2563eb;color:white">第2回 PDFを開く</button><button id="offline-pdf-3" type="button" style="padding:8px;background:#2563eb;color:white">第3回 PDFを開く</button><button id="offline-pdf-4" type="button" style="padding:8px;background:#2563eb;color:white">第4回 PDFを開く</button><span id="offline-pdf-help" role="status" aria-live="polite" style="font-size:12px;align-self:center;color:#cbd5e1">原資料をアプリ内で閲覧できます</span></div>
<div id="offline-material-menu" hidden style="display:none;padding:8px;color:white;background:#1e293b"><label for="offline-material-select">教材を選択</label><select id="offline-material-select" style="display:block;width:100%;color:#0f172a;background:white;padding:8px"><option value="2">第3回 講義テキスト</option><option value="3">第4回 講義テキスト</option><option value="4">第3回 自宅学習・穴埋め</option><option value="5">第4回 自宅学習・穴埋め</option><option value="6">第1〜4回 総合復習60問｜問題冊子</option><option value="7">第1〜4回 総合復習60問｜解答・解説</option><option value="8">第3・4回 総合復習60問｜問題冊子</option><option value="9">第3・4回 総合復習60問｜解答・解説</option></select><button id="offline-material-drill" type="button" style="padding:8px">穴埋めドリルへ →</button><button id="offline-material-back" type="button" style="padding:8px">← 教科書へ</button></div>
<iframe id="offline-reader-frame" title="オフライン教科書" style="width:100%;flex:1;border:0;background:white"></iframe>
<div id="offline-pdf-viewer" hidden style="display:none;flex:1;min-height:0;flex-direction:column;background:#334155;color:white">
<div style="display:flex;align-items:center;justify-content:center;gap:10px;padding:7px;flex-wrap:wrap"><button id="offline-pdf-prev" type="button">前へ</button><span id="offline-pdf-page" role="status">PDF読み込み中</span><button id="offline-pdf-next" type="button">次へ</button><button id="offline-pdf-zoom-in" type="button">拡大 ＋</button><button id="offline-pdf-zoom-out" type="button">縮小 −</button><button id="offline-pdf-zoom-reset" type="button">画面幅</button><span id="offline-pdf-zoom-label" role="status">100%</span><button id="offline-pdf-close" type="button">教科書の同じページへ</button></div>
<p style="margin:0;padding:6px 10px;font-size:12px;text-align:center">左へスワイプ：次へ ／ 右へ：前へ ／ 拡大中は画像を移動（画面幅に戻すとページ送り）</p><div id="offline-pdf-scroll" style="overflow:auto;flex:1;text-align:center;padding:12px;touch-action:pan-y pinch-zoom"><canvas id="offline-pdf-canvas" style="max-width:100%;height:auto;background:white"></canvas></div>
</div></div>
<script>
(function(){
const bytes=Uint8Array.from(atob(${embeddedReader}),c=>c.charCodeAt(0));
const readerSource=new TextDecoder('utf-8').decode(bytes)
 .replace('図解・画像・レイアウトはテキスト抽出版では再現していません。','本文は検索可能なテキスト版です。各ページの下に原資料の図表・レイアウトを画像で掲載しています。')
 .replace('図表や元のレイアウトを確認する場合は原PDFを開いてください。','各ページ下部に原資料画像を表示します。全ページの確認は上部の「PDFを開く」を使用してください。')
 .replace('</head>','<style>header{position:static!important}header nav a{display:none!important}</style></head>');
const embeddedPageImages=__EMBEDDED_PDF_PAGE_IMAGES__;
const materialMenu=document.getElementById('offline-material-menu'),materialSelect=document.getElementById('offline-material-select');
function hideMaterials(){materialMenu.hidden=true;materialMenu.style.display='none';}
function showMaterials(i=4){materialMenu.hidden=false;materialMenu.style.display='block';materialSelect.value=String(i);openOfflinePdf(i,1);document.getElementById('offline-pdf-close').textContent='教科書へ戻る';}
materialSelect.addEventListener('change',()=>showMaterials(Number(materialSelect.value)));
document.getElementById('offline-material-back').onclick=()=>document.getElementById('offline-pdf-close').click();
function startHomework(){document.getElementById('offline-reader-back').click();window.openOfflineDrill('homework-drill');}
document.getElementById('offline-material-drill').onclick=startHomework;
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
  scrollArea.style.touchAction=zoom===1?'pan-y pinch-zoom':'pan-x pan-y pinch-zoom';
  canvas.style.width=(zoom*100)+'%';
  canvas.style.maxWidth='none';
  zoomLabel.textContent=Math.round(zoom*100)+'%';
 };
 zoomIn.addEventListener('click',()=>{zoom=Math.min(3,Math.round((zoom+.25)*100)/100);applyZoom();});
 zoomOut.addEventListener('click',()=>{zoom=Math.max(1,Math.round((zoom-.25)*100)/100);applyZoom();});
 zoomReset.addEventListener('click',()=>{zoom=1;applyZoom();});
 canvas.addEventListener('click',()=>{if(swipeJustEnded)return;zoom=zoom===1?2:1;applyZoom();});
 let swipeJustEnded=false;
 const turnFigure=id=>{const btn=doc.getElementById(id);if(!btn||btn.disabled)return;swipeJustEnded=true;setTimeout(()=>{swipeJustEnded=false},350);btn.click();panel.scrollIntoView({block:'start',behavior:'instant'});};
 doc.defaultView.StudySwipe?.bind(scrollArea,{previous:()=>turnFigure('prev'),next:()=>turnFigure('next'),canTurn:()=>zoom===1});
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
function applyPdfZoom(){document.getElementById('offline-pdf-scroll').style.touchAction=pdfZoom===1?'pan-y pinch-zoom':'pan-x pan-y pinch-zoom';pdfImage.style.width=(pdfZoom*100)+'%';document.getElementById('offline-pdf-zoom-label').textContent=Math.round(pdfZoom*100)+'%';}
document.getElementById('offline-pdf-zoom-in').addEventListener('click',()=>{pdfZoom=Math.min(3,Math.round((pdfZoom+.25)*100)/100);applyPdfZoom();});
document.getElementById('offline-pdf-zoom-out').addEventListener('click',()=>{pdfZoom=Math.max(1,Math.round((pdfZoom-.25)*100)/100);applyPdfZoom();});
document.getElementById('offline-pdf-zoom-reset').addEventListener('click',()=>{pdfZoom=1;applyPdfZoom();});
pdfCanvas.replaceWith(pdfImage);
window.StudySwipe.bind(document.getElementById('offline-pdf-scroll'),{previous:()=>document.getElementById('offline-pdf-prev').click(),next:()=>document.getElementById('offline-pdf-next').click(),canTurn:()=>pdfZoom===1});
function renderPdfPage(){
 const pages=embeddedPageImages[pdfBook]||[];
 if(pdfPage<1||pdfPage>pages.length){pdfLabel.textContent='原資料ページがありません';return;}
 pdfImage.src=pages[pdfPage-1];
 pdfLabel.textContent=pdfPage+' / '+pages.length;
 document.getElementById('offline-pdf-prev').disabled=pdfPage<=1;document.getElementById('offline-pdf-next').disabled=pdfPage>=pages.length;document.getElementById('offline-pdf-scroll').scrollTop=0;
 if(pdfBook>=2){try{localStorage.setItem('web3_offline_pdf_page_'+pdfBook,String(pdfPage))}catch(e){}}
}
function openOfflinePdf(i,requestedPage){
 pdfBook=i;pdfPage=1;
 if(i>=2){try{const stored=Number(localStorage.getItem('web3_offline_pdf_page_'+i));if(Number.isInteger(stored)&&stored>=1&&stored<=embeddedPageImages[i].length)pdfPage=stored}catch(e){}}
 document.getElementById('offline-pdf-close').textContent=i>=2?'教科書メニューへ':'教科書の同じページへ';
 try{
  const doc=frame.contentDocument;
  if(Number(doc?.getElementById('book')?.value)===i){
   const label=doc.getElementById('page-label')?.textContent||'';
   const match=label.match(/(\\d+)\\s*\\/\\s*\\d+/);
   if(match)pdfPage=Math.max(1,Math.min(embeddedPageImages[i].length,Number(match[1])));
  }
 }catch(e){}
 if(Number.isInteger(requestedPage)&&requestedPage>=1&&requestedPage<=embeddedPageImages[i].length)pdfPage=requestedPage;
 pdfZoom=1;applyPdfZoom();
 pdfView.hidden=false;pdfView.style.display='flex';pdfFrame.style.display='none';
 renderPdfPage();
}
document.getElementById('offline-pdf-prev').addEventListener('click',()=>{if(pdfPage>1){pdfPage--;renderPdfPage();}});
document.getElementById('offline-pdf-next').addEventListener('click',()=>{if(pdfPage<(embeddedPageImages[pdfBook]||[]).length){pdfPage++;renderPdfPage();}});
document.getElementById('offline-pdf-close').addEventListener('click',()=>{
 hideMaterials();
 try{
  const doc=frame.contentDocument;
  const select=doc?.getElementById('book');
  if(select&&pdfBook<2){
   if(Number(select.value)!==pdfBook){select.value=String(pdfBook);select.dispatchEvent(new Event('change',{bubbles:true}));}
   const button=doc.querySelector('#chapters button[data-page="'+(pdfPage-1)+'"]');
   button?.click();
  }
 }catch(e){console.warn('Reader page sync unavailable',e);}
 pdfView.style.display='none';pdfView.hidden=true;pdfFrame.style.display='block';
});
document.getElementById('offline-pdf-1').addEventListener('click',()=>{hideMaterials();openOfflinePdf(0);});
document.getElementById('offline-pdf-2').addEventListener('click',()=>{hideMaterials();openOfflinePdf(1);});
document.getElementById('offline-pdf-3').addEventListener('click',()=>{hideMaterials();openOfflinePdf(2);});
document.getElementById('offline-pdf-4').addEventListener('click',()=>{hideMaterials();openOfflinePdf(3);});
const overlay=document.getElementById('offline-reader-overlay');
const frame=document.getElementById('offline-reader-frame');
const open=document.getElementById('offline-textbook-link');
const back=document.getElementById('offline-reader-back');
if(!open||!overlay||!frame||!back)return;
frame.addEventListener('load',()=>{
 attachTextbookFigures().catch(e=>console.warn('Original figures unavailable',e));
 const doc=frame.contentDocument;
 if(doc)doc.addEventListener('click',e=>{const a=e.target.closest('a');if(!a)return;const href=a.getAttribute('href')||'';if(href.startsWith('./additional-materials.html')){e.preventDefault();showMaterials(4);}else if(href==='./homework-drill.html'){e.preventDefault();startHomework();}else if(href==='./index.html'){e.preventDefault();back.click();}});
 const select=doc?.getElementById('book');
 if(select)select.addEventListener('change',e=>{
  const n=Number(select.value);
  if(n>=2){e.stopImmediatePropagation();select.value=String(Number((frame.contentDocument.getElementById('original-figure-status')?.textContent||'').includes('第2回')));openOfflinePdf(n);}
 },true);
});
document.querySelectorAll('a[href="#offline-exam-guide"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();overlay.hidden=false;overlay.style.display='flex';document.body.style.overflow='hidden';back.textContent='← トップへ';hideMaterials();openOfflinePdf(10);document.getElementById('offline-pdf-close').hidden=true;}));
open.addEventListener('click',function(e){e.preventDefault();frame.srcdoc=readerSource;overlay.hidden=false;overlay.style.display='flex';document.body.style.overflow='hidden'});
window.openDrillReference=function(book,page){overlay.hidden=false;overlay.style.display='flex';document.body.style.overflow='hidden';back.textContent='← 問題に戻る';openOfflinePdf(book,page);document.getElementById('offline-pdf-close').hidden=true};
back.addEventListener('click',function(){hideMaterials();back.textContent='← 戻る';document.getElementById('offline-pdf-close').hidden=false;pdfView.style.display='none';pdfView.hidden=true;pdfFrame.style.display='block';overlay.style.display='none';overlay.hidden=true;frame.removeAttribute('srcdoc');document.body.style.overflow=document.getElementById('offline-drill-overlay')?.hidden===false?'hidden':''});
})();
</script>`;
// Embed both drills for Android content:// entrypoints, while retaining extracted HTML copies.
const drillSources=Object.fromEntries(['textbook-original','homework-drill'].map(name=>{
 const source=fs.readFileSync(name+'.html','utf8');
 const tag='<script src="./materials/'+name+'.js"></script>';
 if(!source.includes(tag))throw Error('Missing drill bank: '+name);
 const embedded=source.replace(tag,()=>'<script>'+fs.readFileSync('materials/'+name+'.js','utf8')+'</script>');
 return [name,Buffer.from(embedded,'utf8').toString('base64')];
}));
const drillUI=`<div id="offline-drill-overlay" hidden style="position:fixed;inset:0;z-index:99998;background:#0f172a;display:none;flex-direction:column"><button id="offline-drill-back" type="button" style="padding:12px;background:#334155;color:white">← アプリのトップへ</button><iframe id="offline-drill-frame" title="オフライン問題集" style="width:100%;flex:1;min-height:0;border:0"></iframe></div>
<script>
(function(){
 const sources=${JSON.stringify(drillSources)};
 const overlay=document.getElementById('offline-drill-overlay'),frame=document.getElementById('offline-drill-frame');
 function close(){overlay.hidden=true;overlay.style.display='none';frame.removeAttribute('srcdoc');document.body.style.overflow=''}
 document.getElementById('offline-drill-back').onclick=close;
 function open(name){frame.srcdoc=new TextDecoder().decode(Uint8Array.from(atob(sources[name]),c=>c.charCodeAt(0)));overlay.hidden=false;overlay.style.display='flex';document.body.style.overflow='hidden'}
 window.openOfflineDrill=open;
 for(const name of Object.keys(sources))document.querySelectorAll('a[href="./'+name+'.html"]').forEach(a=>{a.addEventListener('click',e=>{e.preventDefault();open(name)})});
 frame.addEventListener('load',()=>{const doc=frame.contentDocument;if(!doc)return;doc.addEventListener('click',e=>{const a=e.target.closest('a[data-lesson][data-page]');if(!a)return;const book=Number(a.dataset.lesson)-1,page=Number(a.dataset.page);if(!Number.isInteger(book)||book<0||book>3||!Number.isInteger(page)||page<1)return;e.preventDefault();window.openDrillReference(book,page)});doc.querySelectorAll('a[href="./index.html"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();close()}));doc.querySelectorAll('a[href="./textbook.html"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();document.getElementById('offline-textbook-link').click()}))});
})();
</script>`;
html=html.replace('</body>',offlineUI+drillUI+'</body>');
// Build first; after Tailwind compilation inline all CSS into this same HTML.
fs.writeFileSync(path.join(out,'index.html'),html);
fs.copyFileSync('textbook.html',path.join(out,'textbook.html'));
for(const name of ["textbook-original.html","homework-drill.html","materials/textbook-original.js","materials/homework-drill.js"])fs.copyFileSync(name,path.join(out,name));
// Inline drill banks so extracted local HTML does not depend on sibling script loading.
for(const name of ['textbook-original','homework-drill']){
 const file=path.join(out,name+'.html');
 const tag='<script src="./materials/'+name+'.js"></script>';
 const source=fs.readFileSync(file,'utf8');
 if(!source.includes(tag))throw Error('Missing drill script: '+name);
 fs.writeFileSync(file,source.replace(tag,()=>'<script>'+fs.readFileSync('materials/'+name+'.js','utf8').replace(/<\/script/gi,'<\\/script')+'</script>'));
}
fs.copyFileSync('additional-materials.html',path.join(out,'additional-materials.html'));
fs.copyFileSync('reader-swipe.js',path.join(out,'reader-swipe.js'));
fs.copyFileSync('exam-guide.html',path.join(out,'exam-guide.html'));
fs.copyFileSync('materials/攻略マニュアル.pdf',path.join(out,'materials/攻略マニュアル.pdf'));
fs.cpSync('materials/exam-guide-pages',path.join(out,'materials/exam-guide-pages'),{recursive:true});
fs.copyFileSync('materials/question-sets-03-04.js',path.join(out,'materials/question-sets-03-04.js'));
for(const name of ['lesson-03.pdf','lesson-04.pdf','homework-03.pdf','homework-04.pdf','review-01-04-questions.pdf','review-01-04-answers.pdf','review-03-04-questions.pdf','review-03-04-answers.pdf'])fs.copyFileSync(path.join('materials',name),path.join(out,'materials',name));
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
  const rasterized=['materials/lesson-01.pdf','materials/lesson-02.pdf','materials/lesson-03.pdf','materials/lesson-04.pdf','materials/homework-03.pdf','materials/homework-04.pdf','materials/review-01-04-questions.pdf','materials/review-01-04-answers.pdf','materials/review-03-04-questions.pdf','materials/review-03-04-answers.pdf','materials/攻略マニュアル.pdf'].map(file=>{
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
