#!/usr/bin/env node
'use strict';
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
const file=path.resolve('dist/webdesign3-offline/index.html');
const html=fs.readFileSync(file,'utf8');
assert.match(html,/<style id="offline-tailwind">/);
assert.match(html,/id="offline-textbook-link"/);
assert.doesNotMatch(html,/cdn\.tailwindcss\.com|fonts\.googleapis\.com|href="\.\/offline\.css"/);
const browser=await chromium.launch({headless:true});
try{
 const context=await browser.newContext({viewport:{width:390,height:844}});
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(file).href);
 const styles=await page.evaluate(()=>{
  const a=document.querySelector('#offline-textbook-link');
  const card=document.querySelector('#tab-dashboard .rounded-2xl');
  return {styleSize:document.querySelector('#offline-tailwind')?.textContent.length,
    cssRules:[...document.styleSheets].map(x=>{try{return x.cssRules.length}catch(e){return -1}}),
    linkDisplay:a?getComputedStyle(a).display:null,linkBackground:a?getComputedStyle(a).backgroundColor:null,
    cardBackground:card?getComputedStyle(card).backgroundColor:null,
    viewport:document.documentElement.clientWidth,bodyScroll:document.body.scrollWidth,
    linkMarkup:a?.outerHTML,bodyText:document.body.innerText.slice(0,250)}
 });
 console.log('OFFLINE_STYLE_DIAGNOSTIC',JSON.stringify(styles));
 assert.ok(styles.styleSize>10000,'compiled styles should be embedded');
 assert.ok(['flex','inline-flex'].includes(styles.linkDisplay),'textbook link must retain flex styling');
 assert.notEqual(styles.linkBackground,'rgba(0, 0, 0, 0)','textbook link must have styled background');
 const button=page.locator('#offline-textbook-link');
 if(await button.count()!==1){console.error('OFFLINE_DIAGNOSTIC',JSON.stringify({url:page.url(),title:await page.title(),body:(await page.locator('body').innerText()).slice(0,600),sourceLink:html.includes('id="offline-textbook-link"'),errors}));throw Error('offline textbook link missing in rendered DOM')}
 await button.click();
 const overlay=page.locator('#offline-reader-overlay');
 await overlay.waitFor({state:'visible'});
 const frame=page.frameLocator('#offline-reader-frame');
 await frame.locator('#page-label').waitFor({state:'visible'});
 assert.match(await frame.locator('#page-label').innerText(),/1 \/ 13/);
 await frame.locator('#next').click();
 assert.match(await frame.locator('#page-label').innerText(),/2 \/ 13/);
 await frame.locator('#original-figure-canvas').waitFor({state:'visible',timeout:30000});
 await page.waitForFunction(()=>{
  const doc=document.querySelector('#offline-reader-frame')?.contentDocument;
  return doc?.querySelector('#original-figure-status')?.textContent?.includes('原資料 第1回・2ページ');
 },null,{timeout:30000});
 const embeddedCanvas=await frame.locator('#original-figure-canvas').evaluate(el=>({width:el.naturalWidth,height:el.naturalHeight,source:el.currentSrc}));
 assert.ok(embeddedCanvas.width>100&&embeddedCanvas.height>100,'Original figure page should render within textbook');
 assert.ok(embeddedCanvas.source.startsWith('data:image/png;base64,'),'Japanese text should be preserved in pre-rendered PNG');
 await frame.locator('#original-figure-zoom-in').click();
 assert.equal(await frame.locator('#original-figure-zoom-label').innerText(),'125%');
 await frame.locator('#original-figure-zoom-reset').click();
 assert.equal(await frame.locator('#original-figure-zoom-label').innerText(),'100%');
 await frame.locator('#original-figure-canvas').click();
 assert.equal(await frame.locator('#original-figure-zoom-label').innerText(),'200%');
 await frame.locator('#original-figure-zoom-reset').click();


 await frame.locator('#book').selectOption('1');
 await frame.locator('#chapters button[data-page="5"]').click();
 await frame.locator('#original-figure-focus-image').waitFor({state:'visible',timeout:30000});
 const focus6=await frame.locator('#original-figure-focus-image').evaluate(el=>({width:el.naturalWidth,height:el.naturalHeight,src:el.currentSrc}));
 assert.ok(focus6.width>200&&focus6.height>200&&focus6.src.startsWith('data:image/png;base64,'),'Lesson 2 page 6 should show a source-derived detail');
 await frame.locator('#chapters button[data-page="6"]').click();
 await page.waitForFunction(()=>document.querySelector('#offline-reader-frame')?.contentDocument?.querySelector('#original-figure-status')?.textContent?.includes('第2回・7ページ'),null,{timeout:30000});
 await page.waitForFunction(()=>document.querySelector('#offline-reader-frame')?.contentDocument?.querySelector('#original-figure-focus-image')?.naturalWidth>200,null,{timeout:30000});
 assert.equal(await frame.locator('#original-figure-focus-panel').isVisible(),true,'Lesson 2 page 7 detail should display');
 await frame.locator('#chapters button[data-page="7"]').click();
 await page.waitForFunction(()=>document.querySelector('#offline-reader-frame')?.contentDocument?.querySelector('#original-figure-status')?.textContent?.includes('第2回・8ページ'),null,{timeout:30000});
 assert.equal(await frame.locator('#original-figure-focus-panel').isVisible(),false,'Unreviewed pages must not show cropped detail');
 await page.locator('#offline-pdf-1').click();
 await page.locator('#offline-pdf-viewer').waitFor({state:'visible'});
 await page.waitForFunction(()=>document.querySelector('#offline-pdf-page')?.textContent?.startsWith('1 /'),null,{timeout:30000});
 const firstPage=await page.locator('#offline-pdf-page').innerText();
 assert.ok(firstPage.startsWith('1 /'),'PDF first page should render');
 const canvas=await page.locator('#offline-pdf-image').evaluate(el=>({width:el.naturalWidth,height:el.naturalHeight,source:el.currentSrc}));
 assert.ok(canvas.width>100&&canvas.height>100,'PDF page must render to image');
 assert.ok(canvas.source.startsWith('data:image/png;base64,'),'Full PDF viewer must use Japanese-safe page images');
 await page.locator('#offline-pdf-zoom-in').click();
 assert.equal(await page.locator('#offline-pdf-zoom-label').innerText(),'125%');
 assert.equal(await page.locator('#offline-pdf-image').evaluate(el=>el.style.width),'125%');
 await page.locator('#offline-pdf-zoom-reset').click();
 assert.equal(await page.locator('#offline-pdf-zoom-label').innerText(),'100%');
 for(let i=0;i<12;i++)await page.locator('#offline-pdf-zoom-in').click();
 assert.equal(await page.locator('#offline-pdf-zoom-label').innerText(),'300%','PDF zoom must cap at 300%');
 const zoomedLayout=await page.locator('#offline-pdf-scroll').evaluate(el=>({scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,scrollHeight:el.scrollHeight,clientHeight:el.clientHeight}));
 assert.ok(zoomedLayout.scrollWidth>zoomedLayout.clientWidth,'300% PDF must allow horizontal scrolling on mobile');
 await page.locator('#offline-pdf-scroll').evaluate(el=>{el.scrollLeft=el.scrollWidth;});
 assert.ok(await page.locator('#offline-pdf-scroll').evaluate(el=>el.scrollLeft)>0,'PDF horizontal scroll should be operable');

 await page.locator('#offline-pdf-zoom-in').click();
 assert.equal(await page.locator('#offline-pdf-zoom-label').innerText(),'300%');
 await page.locator('#offline-pdf-zoom-out').click();
 assert.equal(await page.locator('#offline-pdf-zoom-label').innerText(),'275%');
 await page.locator('#offline-pdf-zoom-reset').click();
 assert.equal(await page.locator('#offline-pdf-zoom-label').innerText(),'100%');

 await page.locator('#offline-pdf-next').click();
 await page.waitForFunction(()=>document.querySelector('#offline-pdf-page')?.textContent?.startsWith('2 /'),null,{timeout:30000});
 await page.locator('#offline-pdf-zoom-in').click();
 assert.equal(await page.locator('#offline-pdf-zoom-label').innerText(),'125%');
 await page.locator('#offline-pdf-2').click();
 assert.equal(await page.locator('#offline-pdf-zoom-label').innerText(),'100%','Changing source PDFs resets zoom');

 await page.waitForFunction(()=>document.querySelector('#offline-pdf-page')?.textContent==='8 / 10',null,{timeout:30000});
 const secondBookImage=await page.locator('#offline-pdf-image').evaluate(el=>({width:el.naturalWidth,height:el.naturalHeight,source:el.currentSrc}));
 assert.ok(secondBookImage.width>100&&secondBookImage.height>100,'Second source PDF page image should load');
 assert.ok(secondBookImage.source.startsWith('data:image/png;base64,'),'Second source PDF must preserve Japanese in raster image');
 await page.locator('#offline-pdf-next').click();
 assert.equal(await page.locator('#offline-pdf-page').innerText(),'9 / 10');
 await page.locator('#offline-pdf-close').click();
 assert.equal(await page.locator('#offline-pdf-viewer').isVisible(),false);
 assert.match(await frame.locator('#page-label').innerText(),/9 \/ 10/,'Returning from source should open matching textbook page');
 await page.locator('#offline-pdf-2').click();
 assert.equal(await page.locator('#offline-pdf-page').innerText(),'9 / 10','Opening source should preserve current textbook page');
 await page.locator('#offline-pdf-close').click();
 await page.locator('#offline-reader-back').click();
 assert.equal(await overlay.isVisible(),false);
 await page.locator('#offline-textbook-link').click();
 await frame.locator('#page-label').waitFor({state:'visible'});
 assert.match(await frame.locator('#page-label').innerText(),/9 \/ 10/,'Textbook should resume its last reading position');
 await page.locator('#offline-reader-back').click();
 assert.equal(await overlay.isVisible(),false);
 // Backup validation: malformed data must never replace a student's existing progress.
 const backupCheck=await page.evaluate(async()=>{
  const original=localStorage.getItem('web3_master_data');
  const baseline={totalAnswered:12,correctCount:9,examHighScore:null,bookmarks:[],masteredCards:[],wrongQuestionIds:[],categoryStats:{},examHistory:[],daily:{date:'',answered:0}};
  const alerts=[];
  const oldAlert=window.alert;
  window.alert=message=>alerts.push(message);
  try{
   localStorage.setItem('web3_master_data',JSON.stringify(baseline));
   const invalid=new File([JSON.stringify({totalAnswered:'bad'})],'invalid.json',{type:'application/json'});
   window.importUserData({target:{files:[invalid]}});
   await new Promise(resolve=>setTimeout(resolve,150));
   const afterInvalid=localStorage.getItem('web3_master_data');
   const valid=new File([JSON.stringify({...baseline,totalAnswered:20,correctCount:17})],'valid.json',{type:'application/json'});
   window.importUserData({target:{files:[valid]}});
   await new Promise(resolve=>setTimeout(resolve,150));
   const afterValid=JSON.parse(localStorage.getItem('web3_master_data'));
   return {afterInvalid,expected:JSON.stringify(baseline),afterValid,alerts};
  }finally{
   window.alert=oldAlert;
   if(original===null)localStorage.removeItem('web3_master_data');
   else localStorage.setItem('web3_master_data',original);
  }
 });
 assert.equal(backupCheck.afterInvalid,backupCheck.expected,'Invalid backup must preserve existing progress');
 assert.equal(backupCheck.afterValid.totalAnswered,20,'Valid backup must restore progress');
 assert.equal(backupCheck.afterValid.correctCount,17,'Valid backup must restore correct answer count');
 assert.ok(backupCheck.alerts.some(x=>x.includes('失敗')),'Invalid backup should explain failure');
 assert.ok(backupCheck.alerts.some(x=>x.includes('復元しました')),'Valid backup should confirm restoration');
 // Cancelling the destructive reset must retain all saved progress.
 const resetCheck=await page.evaluate(()=>{
  const original=localStorage.getItem('web3_master_data');
  const sentinel=JSON.stringify({totalAnswered:27,correctCount:20});
  const oldConfirm=window.confirm;
  try{
   localStorage.setItem('web3_master_data',sentinel);
   window.confirm=()=>false;
   window.resetUserData();
   return {afterCancel:localStorage.getItem('web3_master_data'),sentinel};
  }finally{
   window.confirm=oldConfirm;
   if(original===null)localStorage.removeItem('web3_master_data');
   else localStorage.setItem('web3_master_data',original);
  }
 });
 assert.equal(resetCheck.afterCancel,resetCheck.sentinel,'Cancelling reset must preserve progress');
 assert.deepEqual(errors,[]);
 console.log('PASS: standalone file HTML CSS and embedded textbook pagination');
 await context.close();
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
