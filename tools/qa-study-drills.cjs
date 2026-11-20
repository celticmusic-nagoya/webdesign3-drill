const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
for(const [file,key,count,counts] of [['homework-drill','HOMEWORK_DRILL',200,[65,28,51,56]],['textbook-original','TEXTBOOK_ORIGINAL',72,[18,15,19,20]]]){
 const env={window:{}};vm.runInNewContext(fs.readFileSync('materials/'+file+'.js','utf8'),env);const a=env.window[key];assert.equal(a.length,count);assert.equal(new Set(a.map(q=>q.id)).size,count);
 for(let i=1;i<=4;i++)assert.equal(a.filter(q=>q.lesson===i).length,counts[i-1]);
 for(const q of a){assert.ok(q.question&&q.page>0);assert.equal(q.options.length,q.type==='truefalse'?2:file==='homework-drill'?4:3);assert.equal(new Set(q.options).size,q.options.length);assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<q.options.length)}
 const html=fs.readFileSync(file+'.html','utf8');for(const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);assert.ok(html.includes('./materials/'+file+'.js'));
 assert.ok(fs.readFileSync('index.html','utf8').includes('./'+file+'.html'));
 console.log('PASS',file,count);
}
