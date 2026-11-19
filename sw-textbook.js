'use strict';
// Only same-origin files are precached. PDF.js is vendored under Apache-2.0.
const CACHE='webdesign3-textbook-offline-v1';
const ASSETS=['./textbook.html','./materials/lesson-01.pdf','./materials/lesson-02.pdf','./vendor/pdfjs/pdf.min.js','./vendor/pdfjs/pdf.worker.min.js'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('webdesign3-textbook-offline-')&&k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()])));
self.addEventListener('fetch',event=>{const request=event.request;if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;event.respondWith(caches.match(request).then(hit=>hit||fetch(request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>{});}return response;})));});
