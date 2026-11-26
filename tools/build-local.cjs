#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{execFileSync}=require('node:child_process');
const root=path.join(__dirname,'..');process.chdir(root);
const run=args=>execFileSync(process.execPath,args,{stdio:'inherit'});
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'web3-css-'));
try{
 const input=path.join(tmp,'input.css');fs.writeFileSync(input,'@tailwind base;\n@tailwind components;\n@tailwind utilities;\n');
 const cli=path.join(root,'node_modules','tailwindcss','lib','cli.js');
 if(!fs.existsSync(cli))throw Error('Install tailwindcss@3.4.17 first (see docs/MAINTENANCE.md)');
 run(['tools/build-offline.cjs']);
 run([cli,'-i',input,'-o','dist/webdesign3-offline/offline.css','--content','./index.html','--minify']);
 run(['tools/build-offline.cjs','--inline-css']);
}finally{fs.rmSync(tmp,{recursive:true,force:true})}
