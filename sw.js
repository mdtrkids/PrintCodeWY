const PREFIX='wy-code-'+self.registration.scope;
const CACHE=PREFIX+'v1';
const FILES=['./','./index.html','./styles.css','./app.js','./core.js','./pwa.js','./manifest.webmanifest','./vendor/xlsx.full.min.js','./icons/icon-192.png','./icons/icon-512.png','./icons/maskable-512.png','./icons/apple-touch-icon.png'];
const ASSETS=new Set(FILES.map(path=>new URL(path,self.registration.scope).href));
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES))));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET'||!ASSETS.has(request.url))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    try{
      const response=await fetch(request);
      if(response.ok){await cache.put(request,response.clone());return response;}
      return await cache.match(request)||response;
    }catch{
      return await cache.match(request)||Response.error();
    }
  })());
});
