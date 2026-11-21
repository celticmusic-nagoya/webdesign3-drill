#!/usr/bin/env node
'use strict';
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const http=require('node:http');
const assert = require('node:assert/strict');
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
