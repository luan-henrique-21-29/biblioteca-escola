import React, {useState} from 'react'
import {BookOpen,ArrowRight,CloudCog,Database,KeyRound,ShieldCheck,Copy,CheckCircle2, ExternalLink, ListChecks} from 'lucide-react'
import Brand from './Brand.jsx'
import PublicCatalogPreview from './PublicCatalogPreview.jsx'

const repo='https://github.com/luan-henrique-21-29/biblioteca-escola'
const steps=[
  {title:'Criar o banco de dados',icon:Database,body:'Crie um projeto no Supabase. No SQL Editor, execute os seis arquivos SQL na ordem indicada no README; isso ativa cadastro de livros, empréstimos, favoritos, filas e permissões.',link:'https://supabase.com/dashboard/projects',linkText:'Abrir Supabase'},
  {title:'Ligar o banco ao site',icon:CloudCog,body:'No GitHub, abra Settings → Secrets and variables → Actions → Variables. Crie VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY com os valores públicos do projeto Supabase. Não use a chave service_role.',link:repo+'/settings/variables/actions',linkText:'Configurar variáveis'},
  {title:'Ativar login com Google',icon:KeyRound,body:'No Google Cloud, crie credenciais OAuth para web. No Supabase, habilite o provedor Google e configure o callback e o endereço do GitHub Pages. Contas @escola dependem da autorização da administração do Google Workspace escolar.',link:'https://console.cloud.google.com/apis/credentials',linkText:'Abrir Google Cloud'},
  {title:'Publicar novamente',icon:CheckCircle2,body:'Após configurar as duas variáveis, execute o fluxo “Publicar Biblioteca Joaquim no GitHub Pages”. Para criar o primeiro administrador, siga o procedimento seguro documentado no README.',link:repo+'/actions/workflows/deploy-pages.yml',linkText:'Abrir publicação'}
]
export default function SetupGuide(){
 const [view,setView]=useState('welcome')
 const [open,setOpen]=useState(0)
 if(view==='preview')return <PublicCatalogPreview onBack={()=>setView('welcome')}/>
 return <div className="setup-wizard">
  <header className="setup-wizard-header"><Brand compact/><span className="setup-wizard-status"><ShieldCheck size={16}/> Aguardando configuração do banco</span></header>
  <main className="setup-wizard-main">
   <div className="setup-wizard-hero"><div className="setup-wizard-label"><BookOpen size={16}/> BIBLIOTECA JOAQUIM</div><h1>Uma biblioteca melhor para a escola.</h1><p>O site está disponível. Você pode consultar uma prévia pública dos livros. As áreas de aluno e bibliotecário só ficam disponíveis depois do login.</p>
    <div className="setup-wizard-actions"><button className="btn btn--primary" onClick={()=>setView('preview')}><BookOpen size={17}/> Ver prévia do catálogo <ArrowRight size={17}/></button><button className="btn btn--outline" onClick={()=>document.getElementById('setup-steps')?.scrollIntoView({behavior:'smooth'})}><ListChecks size={17}/> Ativar login real</button></div>
   </div>
   <section className="setup-wizard-features">
    <div><BookOpen size={23}/><strong>Catálogo organizado</strong><span>Capas, pesquisa, filtros e favoritos</span></div>
    <div><KeyRound size={23}/><strong>Contas protegidas</strong><span>Alunos, funcionários e Google</span></div>
    <div><Database size={23}/><strong>Empréstimos reais</strong><span>Reservas, renovações e devoluções</span></div>
   </section>
   <section id="setup-steps" className="setup-wizard-steps"><span className="eyebrow">CONFIGURAÇÃO INICIAL</span><h2>Como ativar o aplicativo de verdade</h2><p>Essa conexão é feita uma vez pela administração. Alunos nunca precisam configurar credenciais.</p>
    {steps.map((step,i)=><div className="setup-wizard-step" key={i}>
      <button aria-expanded={open===i} onClick={()=>setOpen(open===i?-1:i)}><span className="setup-wizard-step-number">{i+1}</span><step.icon size={20}/><strong>{step.title}</strong><ArrowRight style={{transform:open===i?'rotate(90deg)':'none'}} size={17}/></button>
      {open===i&&<div className="setup-wizard-step-body"><p>{step.body}</p><a className="btn btn--outline" href={step.link} target="_blank" rel="noreferrer"><ExternalLink size={15}/>{step.linkText}</a></div>}
    </div>)}
    <p className="helper-text">As credenciais são configuradas no GitHub e no Supabase, não em um formulário público. Isso protege o acesso administrativo da escola.</p>
    <a href={repo+'#readme'} target="_blank" rel="noreferrer" className="setup-wizard-readme">Manual completo de instalação <ArrowRight size={16}/></a>
   </section>
  </main>
  <footer className="footer">Biblioteca Joaquim · Colégio Prefeito Joaquim da Silva Mafra · Guaratuba, PR</footer>
 </div>
}
