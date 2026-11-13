import React,{useEffect,useState} from 'react'
import {ArrowLeft,BookOpen,ShieldCheck,ArrowRight,MapPin} from 'lucide-react'
import Brand from './Brand.jsx'
import ReadingShelf from './ReadingShelf.jsx'
import {PUBLIC_READINGS} from './readingCatalog.js'
import {configured,supabase} from './supabase.js'

export default function PublicCatalogPreview({onBack,backLabel='Voltar ao login'}) {
  const [readings,setReadings]=useState(PUBLIC_READINGS)
  useEffect(()=>{
    if(!configured)return
    let live=true
    supabase.from('digital_reading_recommendations').select('id,title,author,note,genre,published_year,synopsis,platform,access_url').eq('is_active',true).order('id').then(({data,error})=>{if(live&&!error&&data?.length)setReadings(data)})
    return()=>{live=false}
  },[])
  return <div className="preview-shell"><header className="preview-header"><Brand compact/><button className="btn btn--outline" onClick={onBack}><ArrowLeft size={17}/> {backLabel}</button></header>
    <main className="preview-main">
      <section className="preview-hero"><span className="eyebrow">COLÉGIO ESTADUAL PREFEITO JOAQUIM DA SILVA MAFRA</span><h1>Livros para ler agora</h1><p>Uma pequena estante digital para toda a comunidade escolar de Guaratuba. Os links levam a textos de domínio público ou ao Leia Paraná.</p><span className="preview-location"><MapPin size={15}/> Rua José Nicolau Abagge, 1500 · Guaratuba/PR</span></section>
      <ReadingShelf books={readings}/>
      <section className="preview-protected"><ShieldCheck size={26}/><div><strong>Catálogo físico e empréstimos</strong><p>O acervo físico ainda está sendo cadastrado. Para pedir empréstimos ou consultar seus registros, entre na sua conta. Os livros digitais acima podem ser explorados sem login neste site.</p></div><button className="btn btn--primary" type="button" onClick={onBack}>Entrar na biblioteca <ArrowRight size={15}/></button></section>
    </main>
  </div>
}
