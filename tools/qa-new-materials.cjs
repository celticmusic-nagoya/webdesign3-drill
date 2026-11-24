#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),crypto=require('node:crypto'),vm=require('node:vm'),assert=require('node:assert/strict');
const manifest=JSON.parse(fs.readFileSync('materials/NEW_MATERIALS_MANIFEST.json','utf8'));
const expected=['lesson-03.pdf','lesson-04.pdf','homework-03.pdf','homework-04.pdf','review-01-04-questions.pdf','review-01-04-answers.pdf','review-03-04-questions.pdf','review-03-04-answers.pdf'];
assert.equal(Object.keys(manifest).length,8);
const originalNames=['テキスト3回目.pdf','テキスト4回目.pdf','第3回_自宅学習_穴埋め.pdf','第4回_自宅学習_穴埋め.pdf','第1〜4回_総合復習60問_過去問収録.pdf','第1〜4回_総合復習60問_解答・解説.pdf','第3・4回_総合復習60問_問題冊子.pdf','第3・4回_総合復習60問_解答・解説.pdf'];
originalNames.forEach((name,i)=>{const item=manifest[name];assert.ok(item);assert.equal(item.filename,name);const bytes=fs.readFileSync('materials/'+expected[i]);assert.equal(bytes.subarray(0,5).toString(),'%PDF-');assert.equal(bytes.length,item.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),item.sha256)});
const sandbox={window:{}};vm.runInNewContext(fs.readFileSync('materials/question-sets-03-04.js','utf8'),sandbox);
const qs=sandbox.window.ADDITIONAL_LECTURE_QUESTIONS;
assert.equal(qs.length,120);
assert.equal(new Set(qs.map(x=>x.id)).size,120);
for(const [cat,start] of [['LECTURE_1_4_REVIEW',2001],['LECTURE_3_4_REVIEW',2101]]){
 const set=qs.filter(q=>q.category===cat);assert.equal(set.length,60);
 set.forEach((q,i)=>{assert.equal(q.id,start+i);assert.ok(['choice','tf'].includes(q.type));if(q.type==='tf'){assert.equal(q.options.length,2);assert.deepEqual(Array.from(q.options),['○','×']);assert.doesNotMatch(q.question,/○\s*／\s*×/);assert.match(q.question,/。(?:\s*［[^］]+］)?$/)}assert.ok(q.question&&q.explanation);assert.ok(q.options.length>=2);assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<q.options.length)});
}
const app=fs.readFileSync('index.html','utf8');
assert.ok(app.includes('<script src="./materials/question-sets-03-04.js"></script>'));
assert.ok(app.includes('QUESTIONS.push(...window.ADDITIONAL_LECTURE_QUESTIONS)'));
assert.ok(app.includes('value="LECTURE_1_4_REVIEW"')&&app.includes('value="LECTURE_3_4_REVIEW"'));
const catalogue=fs.readFileSync('additional-materials.html','utf8');
expected.forEach(p=>assert.ok(catalogue.includes(p)));
console.log('PASS: 8 PDF originals SHA-256, 120 questions, IDs, answers, categories and catalogue links');
