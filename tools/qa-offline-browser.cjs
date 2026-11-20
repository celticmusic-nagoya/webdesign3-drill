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


 // Search across both books and navigate directly to the matching lesson page.
 await frame.locator('#global-search').fill('Creative Commons License');
 await frame.locator('#search-results [data-result]').first().waitFor({state:'visible'});
 await frame.locator('#search-results [data-result]').first().click();
 assert.match(await frame.locator('#page-label').innerText(),/10 \/ 10/,'Cross-book search should navigate to the matched page');
 assert.match(await frame.locator('#page-title').innerText(),/クリエイティブ・コモンズ/);
 await frame.locator('#global-search').fill('クリエイティブ・コモンズ');
 await frame.locator('#search-results [data-result]').first().waitFor({state:'visible'});
 await frame.locator('#search-results [data-result]').first().click();
 assert.match(await frame.locator('#page-title').innerText(),/クリエイティブ・コモンズ/,'Search should also match textbook page headings');
 // Search controls and results must fit the narrow Android viewport.
 const mobileSearchLayout=await frame.locator('body').evaluate(body=>{
  const doc=body.ownerDocument,view=doc.documentElement.clientWidth;
  const ids=['global-search','search-results'];
  return {view,bodyWidth:body.scrollWidth,controls:ids.map(id=>{
   const el=doc.getElementById(id),r=el.getBoundingClientRect();
   return {id,left:r.left,right:r.right,width:r.width};
  })};
 });
 assert.ok(mobileSearchLayout.bodyWidth<=mobileSearchLayout.view+2,'Textbook search should not cause horizontal page overflow');
 for(const control of mobileSearchLayout.controls){
  assert.ok(control.left>=-2&&control.right<=mobileSearchLayout.view+2,'Search element '+control.id+' must fit mobile viewport');
 }
 await frame.locator('#global-search').fill('');
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
 await page.locator('#offline-textbook-link').click();
 await frame.locator('#book').waitFor({state:'visible'});
 await frame.locator('#book').selectOption('2');
 assert.equal(await page.locator('#offline-pdf-page').innerText(),'1 / 23');
 await page.locator('#offline-pdf-next').click();
 assert.equal(await page.locator('#offline-pdf-page').innerText(),'2 / 23');
 await page.locator('#offline-pdf-4').click();
 assert.equal(await page.locator('#offline-pdf-page').innerText(),'1 / 20');
 await page.locator('#offline-pdf-3').click();
 assert.equal(await page.locator('#offline-pdf-page').innerText(),'2 / 23');
 await page.locator('#offline-pdf-close').click();
 await page.locator('#offline-reader-back').click();
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
 // Exported backup must faithfully contain the current study progress.
 const exportCheck=await page.evaluate(()=>{
  const original=localStorage.getItem('web3_master_data');
  const backup={totalAnswered:34,correctCount:28,examHighScore:21,bookmarks:[1],masteredCards:[2],wrongQuestionIds:[],categoryStats:{},examHistory:[],daily:{date:'',answered:4}};
  const oldClick=HTMLAnchorElement.prototype.click;
  let download=null;
  try{
   localStorage.setItem('web3_master_data',JSON.stringify(backup));
   window.loadUserData();
   HTMLAnchorElement.prototype.click=function(){download={name:this.download,href:this.href};};
   window.exportUserData();
   return {download,expected:backup};
  }finally{
   HTMLAnchorElement.prototype.click=oldClick;
   if(original===null)localStorage.removeItem('web3_master_data');
   else localStorage.setItem('web3_master_data',original);
   window.loadUserData();
  }
 });
 assert.equal(exportCheck.download.name,'web3_study_backup.json','Backup filename must be descriptive');
 assert.ok(exportCheck.download.href.startsWith('data:text/json'),'Backup export should be offline-capable');
 assert.deepEqual(JSON.parse(decodeURIComponent(exportCheck.download.href.split(',').slice(1).join(','))),exportCheck.expected,'Export must preserve progress fields');
 // Round-trip the actual exported payload through the app's import handler.
 const roundTrip=await page.evaluate(async exported=>{
  const original=localStorage.getItem('web3_master_data');
  const oldAlert=window.alert;
  window.alert=()=>{};
  try{
   const payload=decodeURIComponent(exported.href.slice(exported.href.indexOf(',')+1));
   const saved=JSON.parse(payload);
   const file=new File([payload],'roundtrip.json',{type:'application/json'});
   window.importUserData({target:{files:[file]}});
   await new Promise(resolve=>setTimeout(resolve,200));
   const restored=JSON.parse(localStorage.getItem('web3_master_data'));
   return {saved,restored};
  }finally{
   window.alert=oldAlert;
   if(original===null)localStorage.removeItem('web3_master_data');
   else localStorage.setItem('web3_master_data',original);
   window.loadUserData();
  }
 },exportCheck.download);
 assert.deepEqual(roundTrip.restored,roundTrip.saved,'Exported backup must round-trip through import without data loss');
 // Dashboard's primary study actions must open their intended sections.
 await page.locator('#tab-dashboard button[onclick="switchTab(\'practice\')"]').click();
 assert.equal(await page.locator('#tab-practice').isVisible(),true,'Practice CTA should open practice');
 await page.evaluate(()=>switchTab('dashboard'));
 await page.locator('#tab-dashboard button[onclick="switchTab(\'exam\')"]').click();
 assert.equal(await page.locator('#tab-exam').isVisible(),true,'Exam CTA should open exam');
 await page.evaluate(()=>switchTab('dashboard'));
 // Mock exam must select exactly 25 questions and initialize a 45-minute timer.
 const examStart=await page.evaluate(()=>{
  startExam();
  const result={questions:state.exam.questions.length,uniqueIds:new Set(state.exam.questions.map(q=>q.id)).size,seconds:state.exam.timeLeft,visible:!document.getElementById('exam-active').classList.contains('hidden')};
  clearInterval(state.exam.timer);
  state.exam.timer=null;
  return result;
 });
 assert.equal(examStart.questions,25,'Mock exam must contain 25 questions');
 assert.equal(examStart.uniqueIds,25,'Mock exam must not repeat question IDs');
 assert.ok(examStart.seconds>=2698&&examStart.seconds<=2700,'Mock exam timer should begin at 45 minutes');
 assert.equal(examStart.visible,true,'Mock exam should display active question view');
 // Mock-exam grading must persist the score and show the correct result.
 const grading=await page.evaluate(()=>{
  const original=localStorage.getItem('web3_master_data');
  const before=JSON.parse(JSON.stringify(state.userData));
  try{
   state.userData.examHighScore=null;
   state.exam.questions=QUESTIONS.slice(0,25);
   state.exam.answers=Object.fromEntries(state.exam.questions.map(q=>[q.id,q.correct]));
   finishExam();
   const stored=JSON.parse(localStorage.getItem('web3_master_data'));
   return {score:document.getElementById('exam-score-text').textContent,storedHigh:stored.examHighScore,resultVisible:!document.getElementById('exam-result').classList.contains('hidden')};
  }finally{
   state.userData=before;
   if(original===null)localStorage.removeItem('web3_master_data');
   else localStorage.setItem('web3_master_data',original);
   updateDashboardStats();
  }
 });
 assert.equal(grading.score,'25 / 25','All-correct mock exam should score 25/25');
 assert.equal(grading.storedHigh,25,'Exam high score must persist to local storage');
 assert.equal(grading.resultVisible,true,'Exam results must be visible after grading');
 // A lower subsequent score must not overwrite the highest result.
 const highScoreGuard=await page.evaluate(()=>{
  const original=localStorage.getItem('web3_master_data');
  const before=JSON.parse(JSON.stringify(state.userData));
  try{
   state.userData.examHighScore=24;
   state.exam.questions=QUESTIONS.slice(0,25);
   state.exam.answers={};
   finishExam();
   const stored=JSON.parse(localStorage.getItem('web3_master_data'));
   return {score:document.getElementById('exam-score-text').textContent,high:stored.examHighScore,unanswered:document.getElementById('exam-review-list').textContent.includes('未解答')};
  }finally{
   state.userData=before;
   if(original===null)localStorage.removeItem('web3_master_data');
   else localStorage.setItem('web3_master_data',original);
   updateDashboardStats();
  }
 });
 assert.equal(highScoreGuard.score,'0 / 25','Unanswered questions must score zero');
 assert.equal(highScoreGuard.high,24,'Lower scores must not overwrite the existing high score');
 assert.equal(highScoreGuard.unanswered,true,'Review should identify unanswered questions');
 // Real reload of the standalone file must retain saved study progress.
 const reloadBaseline=await page.evaluate(()=>{
  const original=localStorage.getItem('web3_master_data');
  const data=JSON.parse(JSON.stringify(state.userData));
  data.totalAnswered=37;
  data.correctCount=29;
  data.examHighScore=24;
  localStorage.setItem('web3_master_data',JSON.stringify(data));
  return {original};
 });
 try{
  await page.reload();
  await page.locator('#stat-total-answered').waitFor({state:'visible'});
  assert.equal(await page.locator('#stat-total-answered').innerText(),'37','Answered count must survive a standalone HTML reload');
  assert.equal(await page.locator('#stat-exam-high').innerText(),'24 / 25','Exam high score must survive a standalone HTML reload');
 }finally{
  await page.evaluate(original=>{
   if(original===null)localStorage.removeItem('web3_master_data');
   else localStorage.setItem('web3_master_data',original);
   loadUserData();
  },reloadBaseline.original);
 }
 await page.goto(pathToFileURL(path.join(path.dirname(file),'textbook-original.html')).href);
 await context.setOffline(true);
 assert.equal(await page.evaluate(()=>window.TEXTBOOK_ORIGINAL.length),158);
 await page.locator('#exam').click();
 for(let i=0;i<40;i++){
  await page.locator('#choices input[value="'+(i===0?1:0)+'"]').check();
  await page.locator('#submit').click();
 }
 assert.match(await page.locator('#result').innerText(),/39 \/ 40問/);
 await page.getByRole('button',{name:/誤答だけ再演習/}).click();
 await page.locator('#choices input[value="0"]').check();
 await page.locator('#submit').click();
 await page.locator('#next').click();
 assert.match(await page.locator('#result').innerText(),/全問正解/);
 await context.setOffline(false);
 assert.deepEqual(errors,[]);
 console.log('PASS: standalone file HTML CSS and embedded textbook pagination');
 await context.close();
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
