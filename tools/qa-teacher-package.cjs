#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../dist/teacher-handoff'),manifest=JSON.parse(fs.readFileSync(path.join(root,'PACKAGE_MANIFEST.json'),'utf8'));
for(const f of manifest.files){const b=fs.readFileSync(path.join(root,f.path));assert.equal(b.length,f.size,f.path);assert.equal(crypto.createHash('sha256').update(b).digest('hex'),f.sha256,f.path)}
require('node:child_process').execFileSync('python3',[path.resolve(__dirname,'build-teacher-delivery.py'),'--verify-only'],{stdio:'inherit'});
const app=path.resolve(__dirname,'../dist/teacher-delivery/app');
assert.ok(fs.existsSync(path.join(root,'source','tools','build-local.cjs')));
assert.ok(fs.existsSync(path.join(root,'source','AGENTS.md')));
assert.ok(fs.existsSync(path.join(root,'00_はじめに.md')));
assert.ok(fs.existsSync(path.join(root,'AI_START.txt')));
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1');
 if(!url.pathname.startsWith('/school/')){res.writeHead(404);return res.end()}
 const rel=decodeURIComponent(url.pathname.slice('/school/'.length))||'index.html';
 const file=path.resolve(app,rel);
 if(!file.startsWith(app+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end()}
 const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.pdf':'application/pdf','.webp':'image/webp','.json':'application/json'};
 res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
});
(async()=>{
 let browser;
 try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:1280,height:900}});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await context.route('**/*',route=>{const u=route.request().url();return u.startsWith(base)||u.startsWith('data:')||u.startsWith('blob:')?route.continue():route.abort()});
  await page.goto(base+'/school/');
  await page.locator('a[href="#offline-exam-guide"]').click();
  await page.locator('#offline-pdf-image').evaluate(el=>el.decode());
  assert.equal(await page.locator('#offline-pdf-page').innerText(),'1 / 11');
  const imageEdge=async(side)=>{
   const image=page.locator('#offline-pdf-image');await image.evaluate(el=>el.decode());
   const b=await image.boundingBox();assert.ok(b&&b.width>20);
   await page.mouse.click(b.x+(side==='right'?b.width-8:8),b.y+Math.min(24,b.height/2));
  };
  await imageEdge('right');
  assert.equal(await page.locator('#offline-pdf-page').innerText(),'2 / 11');
  await imageEdge('left');
  assert.equal(await page.locator('#offline-pdf-page').innerText(),'1 / 11');
  await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#offline-pdf-page').innerText(),'2 / 11');
  await page.keyboard.press('ArrowLeft');assert.equal(await page.locator('#offline-pdf-page').innerText(),'1 / 11');
  await page.locator('#offline-reader-back').click();
  await page.locator('#offline-textbook-link').click();
  await page.frameLocator('#offline-reader-frame').locator('#page-label').waitFor();
  await page.locator('#offline-reader-back').click();
  assert.deepEqual(errors,[]);
  console.log('PASS: package checksums, school subdirectory deployment, guide and textbook, no external network');
 }finally{if(browser)await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
