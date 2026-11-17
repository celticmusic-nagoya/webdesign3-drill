#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const out=path.resolve('dist/webdesign3-offline');
fs.mkdirSync(path.join(out,'materials'),{recursive:true});
const source=fs.readFileSync('index.html','utf8');
if(!source.includes('https://cdn.tailwindcss.com'))throw Error('Tailwind CDN script not found');
let html=source.replace(/<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>/,'<link rel="stylesheet" href="./offline.css">');
html=html.replace(/<script>\s*tailwind\.config\s*=\s*\{[\s\S]*?<\/script>/,'');
html=html.replace(/<link href="https:\/\/fonts\.googleapis\.com[^"]*" rel="stylesheet">/,'');
if(html.includes('cdn.tailwindcss.com')||html.includes('fonts.googleapis.com'))throw Error('Online style dependency remains');
fs.writeFileSync(path.join(out,'index.html'),html);
fs.copyFileSync('textbook.html',path.join(out,'textbook.html'));
const manifest=JSON.parse(fs.readFileSync('materials/SOURCE_MANIFEST.json','utf8'));
for(const item of manifest.source_files){
  const p=item.expected_repository_path;
  const bytes=fs.readFileSync(p);
  const actual=crypto.createHash('sha256').update(bytes).digest('hex');
  if(actual!==item.sha256)throw Error('PDF checksum mismatch: '+p);
  fs.copyFileSync(p,path.join(out,p));
}
console.log('Offline HTML and original PDFs staged:',out);
