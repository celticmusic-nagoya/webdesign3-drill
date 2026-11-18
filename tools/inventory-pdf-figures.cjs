#!/usr/bin/env node
'use strict';
// Read-only figure inventory: source PDFs remain untouched.
// Counts embedded raster images and vector drawing operations by page.
// These counts are candidates, not verified diagram crops.
const fs=require('node:fs'),path=require('node:path');
const pdfjs=require('pdfjs-dist/legacy/build/pdf.js');
const inputs=['materials/lesson-01.pdf','materials/lesson-02.pdf'];
(async()=>{
 const inventory=[];
 for(let book=0;book<inputs.length;book++){
  const file=inputs[book];
  const data=new Uint8Array(fs.readFileSync(file));
  const doc=await pdfjs.getDocument({data,disableFontFace:true,useSystemFonts:true}).promise;
  const pages=[];
  for(let n=1;n<=doc.numPages;n++){
   const page=await doc.getPage(n);
   const ops=await page.getOperatorList();
   const raster=ops.fnArray.filter(op=>[pdfjs.OPS.paintImageXObject,pdfjs.OPS.paintInlineImageXObject,pdfjs.OPS.paintJpegXObject].includes(op)).length;
   const vectors=ops.fnArray.filter(op=>[pdfjs.OPS.constructPath,pdfjs.OPS.fill,pdfjs.OPS.stroke,pdfjs.OPS.fillStroke].includes(op)).length;
   const content=await page.getTextContent();
   const text=content.items.map(i=>i.str).join(' ').replace(/\\s+/g,' ').trim();
   pages.push({page:n,reader_page:n,raster_image_ops:raster,vector_drawing_ops:vectors,text_chars:text.length,text_sample:text.slice(0,140),review_status:'NOT_REVIEWED'});
   page.cleanup();
  }
  inventory.push({source:file,book_index:book,page_count:doc.numPages,pages});
  await doc.destroy();
 }
 const output=path.resolve('dist/figure-inventory.json');
 fs.mkdirSync(path.dirname(output),{recursive:true});
 fs.writeFileSync(output,JSON.stringify({schema_version:1,scope:'PDF visual candidate inventory; no crops or placement approved',books:inventory},null,2));
 console.log('PASS figure inventory',inventory.map(b=>({source:b.source,pages:b.page_count,raster_candidate_pages:b.pages.filter(p=>p.raster_image_ops>0).length,vector_candidate_pages:b.pages.filter(p=>p.vector_drawing_ops>0).length})));
})().catch(e=>{console.error(e);process.exitCode=1});
