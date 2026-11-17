#!/usr/bin/env node
'use strict';
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const port = 18937;
const server = spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});
const base = 'http://127.0.0.1:'+port;
const sleep = ms => new Promise(resolve=>setTimeout(resolve,ms));
async function waitServer(){
  for(let i=0;i<40;i++){
    try { const r=await fetch(base+'/textbook.html'); if(r.ok)return; } catch(e){}
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
    const link=page.getByRole('link',{name:/教科書を開く/});
    assert.equal(await link.count(),1,'dashboard textbook link');
    await link.click();
    await page.waitForURL('**/textbook.html');
    assert.match(await page.locator('#page-label').innerText(),/1 \/ 13/);
    await page.locator('#next').click();
    assert.match(await page.locator('#page-label').innerText(),/2 \/ 13/);
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
