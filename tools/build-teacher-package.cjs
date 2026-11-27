#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.join(__dirname,'..'),dest=path.join(root,'dist','teacher-handoff');
const built=path.join(root,'dist','webdesign3-offline');
const assert=require('node:assert/strict');
assert.ok(fs.readFileSync(path.join(built,'index.html'),'utf8').includes('id="offline-tailwind"'),'Run tools/build-local.cjs first');
fs.rmSync(dest,{recursive:true,force:true});fs.mkdirSync(dest,{recursive:true});
fs.cpSync(built,path.join(dest,'app'),{recursive:true});
const source=path.join(dest,'source');fs.mkdirSync(source);
const files=['index.html','textbook.html','textbook-original.html','homework-drill.html','additional-materials.html','exam-guide.html','reader-swipe.js','js-exam-prep.js','sw.js','manifest.webmanifest','README.md','AGENTS.md'];
for(const file of files)fs.copyFileSync(path.join(root,file),path.join(source,file));
for(const dir of ['materials','tools','docs'])fs.cpSync(path.join(root,dir),path.join(source,dir),{recursive:true});
fs.copyFileSync(path.join(root,'docs','TEACHER_START.md'),path.join(dest,'00_はじめに.md'));
fs.copyFileSync(path.join(root,'docs','MAINTENANCE.md'),path.join(dest,'01_更新とサーバー掲載.md'));
fs.copyFileSync(path.join(root,'docs','RELEASE_CHECKLIST.md'),path.join(dest,'02_配布チェックリスト.md'));
fs.copyFileSync(path.join(root,'docs','AI_START.txt'),path.join(dest,'AI_START.txt'));
const records=[];
function walk(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,item.name);if(item.isDirectory())walk(p);else if(item.isFile()){const b=fs.readFileSync(p);records.push({path:path.relative(dest,p).split(path.sep).join('/'),size:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')});}}}
walk(dest);records.sort((a,b)=>a.path.localeCompare(b.path));
fs.writeFileSync(path.join(dest,'PACKAGE_MANIFEST.json'),JSON.stringify({schema:1,created_at:new Date().toISOString(),source_revision:process.env.HANDOFF_SOURCE_REVISION||null,files:records},null,2)+'\n');
console.log('Teacher handoff:',dest,records.length,'files');

require('node:child_process').execFileSync('python3',[path.join(root,'tools','build-teacher-delivery.py')],{stdio:'inherit'});
