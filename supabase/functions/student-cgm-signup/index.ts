// Cadastro via CGM desativado em 13/11/2026.
// A biblioteca usa Supabase Auth com e-mail e senha e confirmação pelo e-mail.
Deno.serve(()=>new Response(JSON.stringify({error:'Cadastro por CGM desativado. Use e-mail e senha no site.'}),{
 status:410,headers:{'content-type':'application/json','cache-control':'no-store'}
}))
