#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync('materials/js-exam-prep.js','utf8'),ctx);
const data=ctx.window.JS_EXAM_PREP,bank=data.questions;
assert.equal(data.pages.length,4);assert.equal(bank.length,40);
assert.equal(new Set(bank.map(q=>q.id)).size,bank.length);
assert.equal(new Set(bank.map(q=>q.topic)).size,10);
for(const q of bank){assert.ok(q.page>=1&&q.page<=4);assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<q.options.length);assert.ok(q.explanation.length>=20);assert.equal(new Set(q.options).size,q.options.length)}
assert.deepEqual(Array.from({length:4},(_,i)=>bank.filter(q=>q.page===i+1).length),[11,7,12,10]);
console.log('PASS: JS data 40 questions, all 10 source topics, valid answers/references');
(async()=>{
const browser=await chromium.launch({headless:true});
try{
 const context=await browser.newContext({viewport:{width:390,height:844},offline:true});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve('dist/webdesign3-offline/index.html')).href);
 await page.locator('#js-prep-reader-link').click();
 await page.locator('#js-prep-dialog').waitFor({state:'visible'});
 assert.equal(await page.locator('#jsp-page-select').inputValue(),'1');
 await page.locator('#jsp-reader-next').click();assert.equal(await page.locator('#jsp-page-select').inputValue(),'2');
 await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#jsp-page-select').inputValue(),'3');
 await page.locator('#jsp-page-select').selectOption('4');assert.equal(await page.locator('#jsp-reader-next').isDisabled(),true);
 await page.locator('#jsp-quiz-tab').click();await page.locator('#jsp-start-all').click();
 const question=await page.locator('#jsp-question').innerText();
 const firstOrder=await page.locator('#jsp-choices button').evaluateAll(bs=>bs.map(b=>b.dataset.choice));
 await page.locator('#jsp-choices button[data-choice="1"]').click();assert.equal(await page.locator('#jsp-feedback').getAttribute('data-result'),'wrong');
 await page.locator('#jsp-reference').click();assert.equal(await page.locator('#jsp-page-select').inputValue(),'1');
 await page.locator('#jsp-back-question').click();assert.equal(await page.locator('#jsp-question').innerText(),question);assert.equal(await page.locator('#jsp-feedback').getAttribute('data-result'),'wrong');
 await page.locator('#jsp-close').click();await page.reload();
 await page.locator('#js-prep-quiz-link').click();assert.equal(await page.locator('#jsp-question').innerText(),question);
 assert.deepEqual(await page.locator('#jsp-choices button').evaluateAll(bs=>bs.map(b=>b.dataset.choice)),firstOrder);
 await page.locator('#jsp-quiz-next').click();assert.match(await page.locator('#jsp-question').innerText(),/ECMAScript/);
 await page.locator('#jsp-choices button[data-choice="1"]').click();assert.equal(await page.locator('#jsp-feedback').getAttribute('data-result'),'correct');
 // Complete the course, verify exactly 39 correct and one wrong, retry only that item.
 for(let i=2;i<bank.length;i++){
  await page.locator('#jsp-quiz-next').click();await page.locator('#jsp-choices button[data-choice="'+bank[i].correct+'"]').click();
 }
 await page.locator('#jsp-quiz-next').click();
 assert.match(await page.locator('#js-prep-dialog').innerText(),/39 \/ 40問 正解/);
 await page.locator('#jsp-retry').click();assert.equal(await page.locator('#jsp-question').innerText(),question);
 await page.locator('#jsp-choices button[data-choice="0"]').click();await page.locator('#jsp-quiz-next').click();
 assert.match(await page.locator('#js-prep-dialog').innerText(),/1 \/ 1問 正解/);
 assert.deepEqual(errors,[]);
 console.log('PASS: offline JS reader, keyboard, question explanation, reference return, resume, all 40 answers, wrong-only retry');
 await context.close();
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
