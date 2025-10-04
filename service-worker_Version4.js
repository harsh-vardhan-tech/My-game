const CACHE_NAME='battlehub-v1';
const CORE=[
  'index.html',
  'manifest.json',
  'src/style/base.css',
  'src/style/animations.css',
  'src/core/app.js',
  'src/core/ui.js',
  'src/core/state.js',
  'src/core/soundManager.js',
  'src/games/tictactoe.js',
  'src/games/snake.js',
  'src/games/dotbox.js'
];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(CORE)));
});
self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(
      keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))
    ))
  );
});
self.addEventListener('fetch',e=>{
  const req=e.request;
  e.respondWith(
    caches.match(req).then(res=>res||
      fetch(req).then(fetchRes=>{
        if(req.method==='GET' && fetchRes.status===200 && fetchRes.type==='basic'){
          const copy = fetchRes.clone();
          caches.open(CACHE_NAME).then(c=>c.put(req,copy));
        }
        return fetchRes;
      }).catch(()=>caches.match('index.html'))
    )
  );
});