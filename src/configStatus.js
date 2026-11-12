// Validação compartilhada entre o carregamento da página e o cliente de autenticação.
// Evita tela branca ao publicar variáveis vazias, placeholders ou URLs inválidas.
export function getSupabaseConfigStatus(url,key){
  const u=String(url??'').trim(),k=String(key??'').trim()
  if(!u||!k)return {ready:false,reason:'A conexão com o banco ainda não foi configurada no GitHub.'}
  if(/SEU-PROJETO|EXEMPLO|YOUR-PROJECT/i.test(u)||/SUA_CHAVE|YOUR_KEY|EXEMPLO/i.test(k))
    return {ready:false,reason:'As variáveis da biblioteca ainda contêm valores de exemplo.'}
  let parsed
  try{parsed=new URL(u)}catch{return {ready:false,reason:'A URL do Supabase está inválida. Confira a variável VITE_SUPABASE_URL.'}}
  const local=['localhost','127.0.0.1'].includes(parsed.hostname)
  if((parsed.protocol!=='https:'&&!local)||!parsed.hostname||parsed.username||parsed.password)
    return {ready:false,reason:'Informe uma URL HTTPS válida para conectar o Supabase.'}
  return {ready:true,reason:null}
}
