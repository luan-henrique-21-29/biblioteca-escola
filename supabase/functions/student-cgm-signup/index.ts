import { createClient } from "npm:@supabase/supabase-js@2";
const url = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(url,serviceKey,{auth:{autoRefreshToken:false,persistSession:false}});
const allowed = new Set(["https://luan-henrique-21-29.github.io","http://localhost:5173","http://127.0.0.1:5173"]);
function response(origin:string,status:number,body:object){return new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json","access-control-allow-origin":allowed.has(origin)?origin:"https://luan-henrique-21-29.github.io","access-control-allow-methods":"POST, OPTIONS","access-control-allow-headers":"authorization, apikey, content-type, x-client-info","vary":"Origin","cache-control":"no-store"}})}
async function hash(s:string){const bytes=new TextEncoder().encode(s);return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes))).map(x=>x.toString(16).padStart(2,"0")).join("")}
Deno.serve(async req=>{
 const origin=req.headers.get("origin")||"";
 if(req.method==="OPTIONS")return response(origin,200,{ok:true});
 if(req.method!=="POST")return response(origin,405,{error:"Método não permitido."});
 if(!allowed.has(origin))return response(origin,403,{error:"Origem não permitida."});
 try{
  if(Number(req.headers.get("content-length")||"0")>4096)return response(origin,413,{error:"Dados muito grandes."});
  const body=await req.json();
  const cgm=String(body.cgm||"").trim(),password=String(body.password||""),fullName=String(body.full_name||"").trim(),classroom=String(body.classroom||"").trim();
  if(!/^\d{6,12}$/.test(cgm)||fullName.length<3||fullName.length>120||classroom.length<2||classroom.length>30||password.length<10||password.length>128)
    return response(origin,400,{error:"Informe nome, turma, CGM de 6 a 12 números e senha de pelo menos 10 caracteres."});
  const ip=req.headers.get("cf-connecting-ip")||req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"unknown";
  for(const key of ["ip:"+ip,"cgm:"+cgm]){
   const {data,error}=await admin.rpc("consume_cgm_signup_limit",{p_fingerprint:await hash(key)});
   if(error)return response(origin,503,{error:"Cadastro indisponível no momento."});
   if(!data)return response(origin,429,{error:"Muitas tentativas. Aguarde uma hora para tentar novamente."});
  }
  // Endereço técnico não entregável: nunca é pedido ao aluno nem usado para enviar mensagens.
  const email="cgm-"+cgm+"@alunos.example.com";
  const {error}=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{full_name:fullName,classroom,enrollment_number:cgm}});
  if(error){if(/already|registered|duplicate|exists|unique/i.test(error.message))return response(origin,409,{error:"Este CGM já tem cadastro. Entre com sua senha ou procure a biblioteca."});return response(origin,400,{error:"Não foi possível criar a conta. Confira os dados e tente novamente."});}
  return response(origin,201,{ok:true});
 }catch{return response(origin,400,{error:"Não foi possível processar o cadastro."});}
});