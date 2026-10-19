/* Generated into sw.js by build-sw.mjs. Never caches document imports or APIs. */
const RELEASE='@@RELEASE@@';
const FILES=/*@FILES@*/[];
const SCOPE=self.registration.scope;
const PREFIX='sf-shell:'+SCOPE+':';
const CACHE=PREFIX+RELEASE;
const INDEX=new URL('index.html',SCOPE).href;
self.addEventListener('install',event=>{event.waitUntil((async()=>{try{const cache=await caches.open(CACHE);await cache.addAll(FILES.map(file=>new Request(new URL(file,SCOPE),{cache:'reload'})));}catch(error){await caches.delete(CACHE);throw error;}})());});
self.addEventListener('activate',event=>{event.waitUntil(self.clients.claim());});
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==new URL(SCOPE).origin||!url.href.startsWith(SCOPE))return;
  if(request.mode==='navigate'&&(url.pathname===new URL(SCOPE).pathname||url.pathname===new URL(INDEX).pathname)){
    event.respondWith((async()=>{try{const response=await fetch(request);if(response.ok)return response;}catch{/* offline */}const cached=await (await caches.open(CACHE)).match(INDEX);return cached??Response.error();})());return;
  }
  event.respondWith((async()=>{for(const name of (await caches.keys()).filter(name=>name.startsWith(PREFIX)).sort((a,b)=>a===CACHE?-1:b===CACHE?1:0)){const hit=await (await caches.open(name)).match(request);if(hit)return hit;}return fetch(request);})());
});
let updating=false;
function ask(client){return new Promise(resolve=>{const channel=new MessageChannel();const timer=setTimeout(()=>{channel.port1.close();resolve(false);},1500);channel.port1.onmessage=event=>{clearTimeout(timer);channel.port1.close();resolve(event.data?.safe===true);};client.postMessage({type:'PREPARE_UPDATE'},[channel.port2]);});}
self.addEventListener('message',event=>{
  if(event.data?.type!=='TRY_ACTIVATE')return;
  event.waitUntil((async()=>{
    if(updating){event.ports[0]?.postMessage({activated:false});return;}
    updating=true;
    const clients=(await self.clients.matchAll({type:'window',includeUncontrolled:true})).filter(client=>client.url.startsWith(SCOPE));
    try{const safe=await Promise.all(clients.map(ask));if(!safe.every(Boolean)){for(const client of clients)client.postMessage({type:'ROLLBACK_UPDATE'});event.ports[0]?.postMessage({activated:false});return;}event.ports[0]?.postMessage({activated:true});await self.skipWaiting();}
    catch{for(const client of clients)client.postMessage({type:'ROLLBACK_UPDATE'});event.ports[0]?.postMessage({activated:false});}
    finally{updating=false;}
  })());
});
