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
 await page.locator('#offline-pdf-1').click();
 await page.locator('#offline-pdf-viewer').waitFor({state:'visible'});
 await page.waitForFunction(()=>document.querySelector('#offline-pdf-page')?.textContent?.startsWith('1 /'),null,{timeout:30000});
 const firstPage=await page.locator('#offline-pdf-page').innerText();
 assert.ok(firstPage.startsWith('1 /'),'PDF first page should render');
 const canvas=await page.locator('#offline-pdf-canvas').evaluate(el=>({width:el.width,height:el.height}));
 assert.ok(canvas.width>100&&canvas.height>100,'PDF page must render to canvas');
 await page.locator('#offline-pdf-next').click();
 await page.waitForFunction(()=>document.querySelector('#offline-pdf-page')?.textContent?.startsWith('2 /'),null,{timeout:30000});
 await page.locator('#offline-pdf-close').click();
 assert.equal(await page.locator('#offline-pdf-viewer').isVisible(),false);
 await page.locator('#offline-reader-back').click();
 assert.equal(await overlay.isVisible(),false);
 assert.deepEqual(errors,[]);
 console.log('PASS: standalone file HTML CSS and embedded textbook pagination');
 await context.close();
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
