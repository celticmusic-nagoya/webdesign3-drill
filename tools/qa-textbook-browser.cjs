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
    const catalogLink=page.locator('a[href="./additional-materials.html"]').first();
    assert.ok(await catalogLink.count()>0,'Additional materials link missing');
    await page.goto(base+'/additional-materials.html');
    assert.equal(await page.locator('#source option').count(),8);
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
    assert.deepEqual(errors,[],'browser runtime errors');
    console.log('PASS: mobile viewport, dashboard navigation, pagination, search persistence, cross-book search, lesson switch, reload resume, dashboard resume, no runtime errors');
    await context.close();
  }finally{await browser.close()}
}
run().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.kill());
