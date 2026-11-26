#!/usr/bin/env node
'use strict';
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const http=require('node:http');
const assert = require('node:assert/strict');
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const facsimilePath='materials/textbook-pages/manifest.json';
if(fs.existsSync(facsimilePath)){
 const manifest=JSON.parse(fs.readFileSync(facsimilePath,'utf8'));
 for(const [lesson,count] of [[3,23],[4,20]]){
  const pages=manifest[String(lesson)].pages;
  assert.equal(pages.length,count);
  const pdf=fs.readFileSync('materials/lesson-0'+lesson+'.pdf');
  assert.equal(crypto.createHash('sha1').update('blob '+pdf.length+'\0').update(pdf).digest('hex'),manifest[String(lesson)].source_git_sha);
  for(const [i,item] of pages.entries()){
   assert.equal(item.file,'lesson-0'+lesson+'-'+String(i+1).padStart(2,'0')+'.webp');
   const image=fs.readFileSync(path.join('materials/textbook-pages',item.file));
   assert.equal(image.toString('ascii',0,4),'RIFF');
   assert.equal(image.toString('ascii',8,12),'WEBP');
   assert.equal(crypto.createHash('sha256').update(image).digest('hex'),item.sha256);
  }
 }
 console.log('PASS: 43 facsimile images, original PDF Git SHA and image SHA-256');
}
const port = 18937;
const server = spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});
const base = 'http://127.0.0.1:'+port;
const sleep = ms => new Promise(resolve=>setTimeout(resolve,ms));
async function waitServer(){
  for(let i=0;i<40;i++){
    try { const ok=await new Promise(resolve=>{const req=http.get(base+'/textbook.html',res=>{res.resume();resolve(res.statusCode===200)});req.on('error',()=>resolve(false));req.setTimeout(1000,()=>{req.destroy();resolve(false)})});if(ok)return; } catch(e){}
    await sleep(250);
  }
  throw Error('HTTP test server unavailable');
}
async function run(){
  await waitServer();
  const browser=await chromium.launch({headless:true});
  try{
    const context=await browser.newContext({viewport:{width:390,height:844}});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    // Real mouse events in desktop layout, independently from touch tests.
    const desktop=await browser.newContext({viewport:{width:1280,height:900}});
    const pc=await desktop.newPage();
    const edge=async(locator,side)=>{
      // Tall PDF surfaces may extend behind the sticky navigation. Use an actual
      // visible, unobstructed point, not a fixed offset near the top of the image.
      await locator.evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));
      let point;
      await pc.waitForFunction(({id,side})=>{
        const el=document.getElementById(id);if(!el)return false;
        const rect=el.getBoundingClientRect(),w=el.clientWidth;
        const x=rect.left+el.clientLeft+(side==='left'?10:side==='right'?w-10:Math.floor(w/2));
        const top=Math.max(0,rect.top+el.clientTop),bottom=Math.min(innerHeight,rect.top+el.clientTop+el.clientHeight);
        for(let y=top+16;y<bottom-8;y+=16)if(el.contains(document.elementFromPoint(x,y)))return true;
        return false;
      },{id:await locator.getAttribute('id'),side});
      point=await locator.evaluate((el,side)=>{
        const rect=el.getBoundingClientRect(),w=el.clientWidth;
        const x=rect.left+el.clientLeft+(side==='left'?10:side==='right'?w-10:Math.floor(w/2));
        const top=Math.max(0,rect.top+el.clientTop),bottom=Math.min(innerHeight,rect.top+el.clientTop+el.clientHeight);
        for(let y=top+16;y<bottom-8;y+=16)if(el.contains(document.elementFromPoint(x,y)))return {x,y};
        return null;
      },side);
      assert.ok(point,'Reader edge must have a visible mouse target');
      await pc.mouse.click(point.x,point.y);
    };
    try{
      await pc.goto(base+'/exam-guide.html');
      const original=pc.locator('#pdf-scroll');
      await original.locator('img').waitFor({state:'visible'});
      await edge(original,'right');assert.equal(await pc.locator('#count').innerText(),'2 / 11');
      await original.locator('img').evaluate(el=>el.decode());
      await edge(original,'left');assert.equal(await pc.locator('#count').innerText(),'1 / 11');
      await edge(original,'left');assert.equal(await pc.locator('#count').innerText(),'1 / 11');
      await edge(original,'center');assert.equal(await pc.locator('#count').innerText(),'1 / 11');
      await pc.locator('#zoom-in').click();
      await edge(original,'right');assert.equal(await pc.locator('#count').innerText(),'1 / 11');
      await pc.locator('#zoom-fit').click();
      await pc.locator('#mode-text').click();
      const text=pc.locator('#page');
      await edge(text,'right');assert.equal(await pc.locator('#count').innerText(),'2 / 11');
      await edge(text,'left');assert.equal(await pc.locator('#count').innerText(),'1 / 11');
      await pc.goto(base+'/textbook.html');
      const body=pc.locator('#page-text');
      await edge(body,'right');assert.match(await pc.locator('#page-label').innerText(),/2 \/ 13/);
      await edge(body,'left');assert.match(await pc.locator('#page-label').innerText(),/1 \/ 13/);
      for(const [book,total] of [[0,23],[1,20]]){
        await pc.goto(base+'/additional-materials.html?book='+book);
        const surface=pc.locator('#lecture-image');
        await surface.locator('img').waitFor({state:'visible',timeout:30000});
        await edge(surface,'right');assert.equal(await pc.locator('#progress').innerText(),'2 / '+total);
        await edge(surface,'left');assert.equal(await pc.locator('#progress').innerText(),'1 / '+total);
      }
      console.log('PASS: desktop edge navigation, center and zoom guard across guide and textbooks');
    }finally{await desktop.close()}
    await page.goto(base+'/index.html');
    // Both new review categories must be available and their questions loaded in the live app.
    assert.equal(await page.locator('#practice-category-select option[value="LECTURE_1_4_REVIEW"]').count(),1);
    assert.equal(await page.locator('#practice-category-select option[value="LECTURE_3_4_REVIEW"]').count(),1);
    const imported=await page.evaluate(()=>({
      total:QUESTIONS.length,
      a:QUESTIONS.filter(q=>q.category==='LECTURE_1_4_REVIEW').length,
      b:QUESTIONS.filter(q=>q.category==='LECTURE_3_4_REVIEW').length
    }));
    assert.equal(imported.a,60);assert.equal(imported.b,60);
    const hubLink=page.locator('a[href="./textbook.html"]').first();
    assert.ok(await hubLink.count()>0,'Unified textbook hub link missing');
    await page.goto(base+'/textbook.html');
    assert.equal(await page.locator('#book option').count(),4);
    assert.equal(await page.locator('#book').inputValue(),'0');
    await page.locator('#book').selectOption('3');
    await page.waitForURL('**/additional-materials.html?book=1');
    assert.equal(await page.locator('#source').inputValue(),'1');
    await page.goto(base+'/additional-materials.html?book=1');
    assert.equal(await page.locator('#source option').count(),8);
    assert.equal(await page.locator('#source').inputValue(),'1');
    if(fs.existsSync(facsimilePath)){
      for(const [book,total] of [[0,23],[1,20]]){
        await page.goto(base+'/additional-materials.html?book='+book);
        const image=page.locator('#lecture-image img');
        await image.waitFor({state:'visible',timeout:30000});
        await image.evaluate(el=>el.decode());
        assert.equal(await page.locator('#progress').innerText(),'1 / '+total);
        const swipe=async(dx,dy=0)=>image.evaluate((el,{dx,dy})=>{
          const t=(x,y)=>new Touch({identifier:1,target:el,clientX:x,clientY:y});
          el.dispatchEvent(new TouchEvent('touchstart',{bubbles:true,touches:[t(195,150)],changedTouches:[t(195,150)]}));
          el.dispatchEvent(new TouchEvent('touchend',{bubbles:true,touches:[],changedTouches:[t(195+dx,150+dy)]}));
        },{dx,dy});
        await swipe(-100);assert.equal(await page.locator('#progress').innerText(),'2 / '+total);
        await image.evaluate(el=>el.decode());
        await swipe(100);assert.equal(await page.locator('#progress').innerText(),'1 / '+total);
        await page.locator('#plus').click();
        await swipe(-100);assert.equal(await page.locator('#progress').innerText(),'1 / '+total);
        await page.locator('#fit').click();
        await page.locator('#page-select').selectOption(String(total-1));
        await image.evaluate(el=>el.decode());
        assert.equal(await page.locator('#progress').innerText(),total+' / '+total);
        assert.equal(await page.locator('#next').isDisabled(),true);
        await page.locator('#page-select').selectOption('0');
        await image.evaluate(el=>el.decode());
        await page.locator('#save-lecture').click();
        await page.waitForFunction(()=>document.querySelector('#lecture-offline')?.textContent==='この教材は保存済み',null,{timeout:90000});
        await page.evaluate(()=>navigator.serviceWorker.ready.then(()=>true));
        await page.reload();
        await image.waitFor({state:'visible',timeout:30000});
        await page.waitForFunction(()=>!!navigator.serviceWorker.controller,null,{timeout:30000});
        await context.setOffline(true);
        try{
          await page.reload();
          await image.waitFor({state:'visible',timeout:30000});
          await image.evaluate(el=>el.decode());
          await swipe(-100);
          await image.evaluate(el=>el.decode());
          assert.equal(await page.locator('#progress').innerText(),'2 / '+total);
        }finally{await context.setOffline(false)}
        await page.locator('#page-select').selectOption('0');
      }
    }
    await page.locator('#source').selectOption('7');
    assert.match(await page.locator('#open').getAttribute('href'),/review-03-04-answers\.pdf$/);
    await page.goto(base+'/index.html');
    const link=page.getByRole('link',{name:/教科書を開く/});
    assert.equal(await link.count(),1,'dashboard textbook link');
    await link.click();
    await page.waitForURL('**/textbook.html');
    assert.match(await page.locator('#page-label').innerText(),/1 \/ 13/);
    await page.locator('#source-page-canvas').waitFor({state:'visible',timeout:30000});
    const firstCanvas=await page.locator('#source-page-canvas').evaluate(c=>({width:c.width,height:c.height}));
    assert.ok(firstCanvas.width>200&&firstCanvas.height>200,'Source PDF page must render into visible canvas');
    await page.locator('#next').click();
    assert.match(await page.locator('#page-label').innerText(),/2 \/ 13/);
    await page.waitForFunction(()=>document.querySelector('#source-render-status')?.textContent?.includes('2ページ'),null,{timeout:30000});
    await page.locator('#source-zoom-in').click();
    assert.equal(await page.locator('#source-zoom-label').innerText(),'125%');
    await page.waitForFunction(()=>document.querySelector('#source-render-status')?.textContent?.includes('2ページ'),null,{timeout:30000});
    assert.equal(await page.locator('#source-page-canvas').isVisible(),true,'Zoomed original PDF page must remain visible');
    await page.locator('#search').fill('web');
    await page.locator('#next').click();
    assert.equal(await page.locator('#search').inputValue(),'web','search persists');
    await page.locator('#global-search').fill('ブラウザ');
    assert.match(await page.locator('#search-results').innerText(),/ページで見つかりました/);
    await page.locator('#book').selectOption('1');
    assert.match(await page.locator('#page-label').innerText(),/1 \/ 10/);
    await page.reload();
    assert.match(await page.locator('#page-label').innerText(),/1 \/ 10/);
    await page.goto(base+'/index.html');
    assert.match(await page.locator('#textbook-resume-label').innerText(),/第2回・1ページ/);
    // Study sessions must survive reload without reordering or double-counting answers.
    for(const [file,key] of [['homework-drill','web3_homework_session_v1'],['textbook-original','web3_original_session_v1']]){
      await page.goto(base+'/'+file+'.html');
      await page.evaluate(key=>localStorage.removeItem(key),key);await page.reload();
      await page.locator('#scope').selectOption('1');
      await page.locator('#practice').click();
      await page.locator('#auto').uncheck();
      const q=await page.locator('#question').innerText();
      const choices=await page.locator('#choices input').evaluateAll(els=>els.map(x=>x.value));
      await page.locator('#choices input').first().check();
      const feedback=await page.locator('#feedback').innerText();
      await page.locator('#leave').click();
      await page.locator('#resume').waitFor({state:'visible'});
      await page.reload();
      await page.locator('#resume').click();
      assert.equal(await page.locator('#question').innerText(),q);
      assert.deepEqual(await page.locator('#choices input').evaluateAll(els=>els.map(x=>x.value)),choices);
      assert.equal(await page.locator('#feedback').innerText(),feedback);
      assert.equal(await page.locator('#choices input').first().isChecked(),true);
      assert.equal(await page.locator('#auto').isChecked(),false);
      await page.locator('#next').click();
      assert.match(await page.locator('#position').innerText(),/^2 \/ /);
      await page.reload();await page.locator('#resume').click();
      assert.match(await page.locator('#position').innerText(),/^2 \/ /);
      assert.equal(await page.locator('#choices input:checked').count(),0);
      await page.evaluate(key=>localStorage.removeItem(key),key);
      await page.locator('#leave').click();
      await page.evaluate(key=>localStorage.removeItem(key),key);
    }
    await page.goto(base+'/index.html');
    // Ordinary question bank: exact variant, answer and index persist on reload.
    const ordinary=await page.evaluate(()=>{
      localStorage.removeItem('web3_practice_session_v1');
      switchTab('practice');startPracticeSession('normal');
      document.getElementById('practice-auto-next-toggle').checked=false;
      const q=state.practice.questions[0];answerPractice(q.correct);
      return {question:q.question,options:q.options,answer:q.correct,total:state.userData.totalAnswered};
    });
    await page.reload();
    const restored=await page.evaluate(()=>{
      switchTab('practice');const q=state.practice.questions[0];
      const answer=state.practice.answers[q.id];answerPractice(q.correct);
      return {question:q.question,options:q.options,answer,total:state.userData.totalAnswered};
    });
    assert.deepEqual(restored,ordinary,'Reload must preserve the question and not double-count a graded answer');
    await page.evaluate(()=>{nextPracticeQuestion();});
    await page.reload();
    assert.equal(await page.evaluate(()=>{switchTab('practice');return state.practice.currentIndex}),1);
    await page.evaluate(()=>{localStorage.removeItem('web3_practice_session_v1');});
    // Interrupted mock exam retains answer/index and absolute deadline across reload.
    const savedExam=await page.evaluate(()=>{
      switchTab('exam');startExam();const q=state.exam.questions[0];answerExam(q.correct);navigateExamQuestion(1);
      return {deadline:state.exam.deadline,index:state.exam.currentIndex,answers:state.exam.answers,ids:state.exam.questions.map(x=>x.id),options:state.exam.questions.map(x=>x.options)};
    });
    await page.reload();await page.evaluate(()=>switchTab('exam'));
    await page.locator('#exam-resume-btn').click();
    const resumedExam=await page.evaluate(()=>({deadline:state.exam.deadline,index:state.exam.currentIndex,answers:state.exam.answers,ids:state.exam.questions.map(x=>x.id),options:state.exam.questions.map(x=>x.options)}));
    assert.deepEqual(resumedExam,savedExam);
    await page.evaluate(()=>{const key='web3_mock_exam_session_v1',v=JSON.parse(localStorage.getItem(key));v.deadline=Date.now()-1000;localStorage.setItem(key,JSON.stringify(v));});
    await page.reload();await page.evaluate(()=>switchTab('exam'));
    assert.equal(await page.locator('#exam-resume-btn').innerText(),'前回の模擬試験を採点');
    await page.locator('#exam-resume-btn').click();
    assert.equal(await page.locator('#exam-score-text').innerText(),'1 / 25');
    assert.equal(await page.evaluate(()=>localStorage.getItem('web3_mock_exam_session_v1')),null);
    const clock=await page.evaluate(()=>{
      startExam();clearInterval(state.exam.timer);
      state.exam.deadline=Date.now()+60000;updateExamTimer();
      const left=state.exam.timeLeft;
      state.exam.deadline=null;return left;
    });
    assert.ok(clock>=59&&clock<=60,'Mock timer must follow deadline instead of interval count');
    await page.goto(base+'/homework-drill.html');
    await page.locator('#scope').selectOption('3');
    await page.locator('#practice').click();
    assert.match(await page.locator('#position').innerText(),/1 \/ 51/);
    assert.equal(await page.locator('#choices input').count(),4);
    await page.locator('#choices label').first().click();
    assert.equal(await page.locator('#feedback').isVisible(),true);
    await page.waitForFunction(()=>document.querySelector('#position').textContent.includes('2 / 51'),null,{timeout:12000});
    await page.locator('#leave').click({trial:true});
    await page.goto(base+'/textbook-original.html');
    await page.locator('#exam').click();
    assert.match(await page.locator('#position').innerText(),/1 \/ 40/);
    for(let i=0;i<40;i++){
      await page.locator('#choices input[value="0"]').check();
      await page.locator('#submit').click();
    }
    assert.match(await page.locator('#result').innerText(),/40 \/ 40問（100点）/);
    await page.getByRole('button',{name:'学習メニューへ'}).click();
    assert.match(await page.locator('#last').innerText(),/40 \/ 40問/);
    await page.reload();
    assert.match(await page.locator('#last').innerText(),/40 \/ 40問/);
    await page.locator('#exam').click();
    const distribution=await page.evaluate(()=>[1,2,3,4].map(n=>list.filter(q=>q.lesson===n).length));
    assert.deepEqual(distribution,[10,10,10,10]);
    const missedId=await page.evaluate(()=>list[0].id);
    for(let i=0;i<40;i++){
      await page.locator('#choices input[value="'+(i===0?1:0)+'"]').check();
      await page.locator('#submit').click();
    }
    assert.match(await page.locator('#result').innerText(),/39 \/ 40問/);
    assert.equal(await page.locator('#result .correct-answer').count(),1);
    await page.getByRole('button',{name:/誤答だけ再演習/}).click();
    assert.match(await page.locator('#position').innerText(),/1 \/ 1問/);
    assert.equal(await page.evaluate(()=>list[0].id),missedId);
    await page.locator('#choices input[value="1"]').check();
    await page.locator('#explain').click();
    assert.match(await page.locator('#feedback').innerText(),/不正解/);
    assert.equal(await page.locator('#explanation .correct-answer').isVisible(),true);
    assert.ok(await page.locator('#explanation a').getAttribute('href'));
    await page.locator('#next').click();
    await page.getByRole('button',{name:/誤答だけ再演習/}).click();
    await page.locator('#choices input[value="0"]').check();
    await page.locator('#next').click();
    assert.match(await page.locator('#result').innerText(),/全問正解/);
    await page.getByRole('button',{name:'学習メニューへ'}).click();
    await page.locator('#scope').selectOption('3');
    await page.locator('#practice').click();
    assert.match(await page.locator('#position').innerText(),/1 \/ 43問/);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await context.setOffline(true);
    await page.locator('#auto').uncheck();
    await page.locator('#choices input[value="0"]').check();
    assert.match(await page.locator('#feedback').innerText(),/正解/);
    await page.locator('#next').click();
    assert.match(await page.locator('#position').innerText(),/2 \/ 43問/);
    await context.setOffline(false);
    assert.deepEqual(errors,[],'browser runtime errors');
    console.log('PASS: mobile viewport, dashboard navigation, pagination, search persistence, cross-book search, lesson switch, reload resume, dashboard resume, no runtime errors');
    await context.close();
  }finally{await browser.close()}
}
run().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.kill());
