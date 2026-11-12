// Trabalhador mínimo para permitir a instalação do site, sem guardar dados privados.
// Não oferece modo offline: empréstimos, login e disponibilidade requerem a conexão real.
self.addEventListener('install',event=>self.skipWaiting())
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()))
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return
  const url=new URL(event.request.url)
  if(url.origin!==self.location.origin)return
  event.respondWith(fetch(event.request))
})
