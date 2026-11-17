#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8');
const app=read('index.html'),reader=read('textbook.html');
const scripts=html=>[...html.matchAll(/<script(?:\\s[^>]*)?>([\\s\\S]*?)<\\/script>/g)].map(m=>m[1]).filter(Boolean);
for(const [name,html] of [['index.html',app],['textbook.html',reader]]){
  const js=scripts(html);
  assert.ok(js.length>0,name+' missing inline JS');
  js.forEach((src,i)=>new vm.Script(src,{filename:name+':inline-'+i}));
}
const m=reader.match(/const BOOKS=(\\[[\\s\\S]*?\\]);\\s*const el=/);
assert.ok(m,'reader data missing');
const books=JSON.parse(m[1]);
assert.deepEqual(books.map(b=>b.pages.length),[13,10]);
for(const book of books){assert.ok(book.title&&book.source);book.pages.forEach((p,i)=>{assert.equal(p.number,i+1);assert.ok(p.text.length>0);assert.ok(p.title.length>0)})}
assert.ok(app.includes('href="./textbook.html"'),'dashboard link missing');
assert.ok(app.includes('textbook-resume-label'),'resume UI missing');
assert.ok(reader.includes('function searchAll()'),'cross-book search missing');
assert.ok(reader.includes('function updatePdfLink()'),'PDF fallback missing');
assert.ok(reader.includes('web3_textbook_position'),'resume persistence missing');
const manifest=JSON.parse(read('materials/SOURCE_MANIFEST.json'));
assert.equal(manifest.status,'SOURCE_VERIFIED_NOT_PUBLISHED');
assert.deepEqual(manifest.source_files.map(x=>x.pages),[13,10]);
for(const source of manifest.source_files)assert.match(source.sha256,/^[a-f0-9]{64}$/);
console.log('PASS: inline JS syntax, 23 textbook pages, dashboard link, navigation/search/persistence, source manifest');
console.log('NOT_RUN: real browser, Android, PDF rendering, source rights review');
