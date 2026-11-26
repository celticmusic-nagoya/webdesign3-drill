#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const crypto=require('node:crypto');
const root=path.join(__dirname,'..');
const material=name=>path.join(root,'materials',name);
const context={window:{}};
vm.runInNewContext(fs.readFileSync(material('question-sets-03-04.js'),'utf8'),context);
const bank=context.window.ADDITIONAL_LECTURE_QUESTIONS;
const sources=[
 ['LECTURE_1_4_REVIEW','review-01-04-answers.pdf'],
 ['LECTURE_3_4_REVIEW','review-03-04-answers.pdf']
];
const result=[];
for(const [category,file] of sources){
 const pdf=material(file);
 const expectedSha={
  'review-01-04-answers.pdf':'a61b21640ba39daea040f0a9197d15a3d3d90f635a1d40c328d7d8144e8fc82e',
  'review-03-04-answers.pdf':'db843b6e8295f4c3a388d69c20d936255f2f1df2580e3bd8d0810d6ca9efc92e'
 }[file];
 const actualSha=crypto.createHash('sha256').update(fs.readFileSync(pdf)).digest('hex');
 assert.equal(actualSha,expectedSha,file+' must match the independently inspected uploaded PDF');
 // MuPDF reads the embedded text even when Poppler cannot resolve the PDF font tags.
 const raw=execFileSync('python3',['-c','import pymupdf,sys; d=pymupdf.open(sys.argv[1]); print("\\n".join(p.get_text() for p in d))',pdf],{encoding:'utf8'}).normalize('NFKC');
 const matches=[...raw.matchAll(/第\s*(\d+)\s*問\s*正解\s*:\s*([1-4○×])/g)];
 assert.equal(matches.length,60,category+' source answer count');
 const keys=new Map(matches.map(m=>[Number(m[1]),m[2]]));
 assert.equal(keys.size,60,category+' source answer uniqueness');
 const rows=bank.filter(q=>q.category===category);
 assert.equal(rows.length,60,category+' bank count');
 assert.equal(new Set(rows.map(q=>q.source_question)).size,60,category+' bank source numbers');
 for(const q of rows){
  assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<q.options.length,'Invalid answer index '+q.id);
  const key=q.type==='tf'?q.options[q.correct]:String(q.correct+1);
  assert.equal(key,keys.get(q.source_question),category+' question '+q.source_question+' (id '+q.id+')');
 }
 result.push({category,source:file,sha256:crypto.createHash('sha256').update(fs.readFileSync(pdf)).digest('hex'),matched:rows.length});
}
assert.equal(bank.length,120);
console.log(JSON.stringify({status:'PASS',matched:120,results:result},null,2));
