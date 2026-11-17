import React,{useEffect,useState} from 'react'
import {ArrowLeft,BookOpen,ShieldCheck,ArrowRight,MapPin,RefreshCw,AlertTriangle} from 'lucide-react'
import Brand from './Brand.jsx'
import ReadingShelf from './ReadingShelf.jsx'
import {PUBLIC_READINGS} from './readingCatalog.js'
import {configured,supabase} from './supabase.js'

const freeReadingFallback=PUBLIC_READINGS.filter(book=>book.platform==='Wikisource')

export default function PublicCatalogPreview({onBack,backLabel='Voltar ao login'}) {
  const [readings,setReadings]=useState([])
  const [status,setStatus]=useState('loading')
  const [errorMessage,setErrorMessage]=useState('')
  const [reload,setReload]=useState(0)

  useEffect(()=>{
    let active=true
    if(!configured){
      setReadings(freeReadingFallback)
      setStatus('error')
      setErrorMessage('A conexão com o catálogo digital não está configurada. Os clássicos gratuitos continuam disponíveis.')
      return ()=>{active=false}
    }
    const load=async()=>{
      setStatus('loading')
      setErrorMessage('')
      try {
        const {data,error}=await supabase.from('digital_reading_recommendations')
          .select('id,title,author,note,genre,published_year,synopsis,platform,access_url,cover_url,cover_verified_at,individual_link_verified_at,isbn,source_catalog_url')
          .eq('is_active',true).order('id')
        if(error)throw error
        if(!data?.length)throw new Error('Nenhuma recomendação digital foi encontrada.')
        if(active){setReadings(data);setStatus('ready')}
      }catch(error){
        if(active){
          setReadings(previous=>previous.length?previous:freeReadingFallback)
          setErrorMessage('Não conseguimos atualizar os livros agora. Confira sua conexão e tente novamente.')
          setStatus('error')
        }
      }
    }
    load()
    return ()=>{active=false}
  },[reload])

  const leiaCount=readings.filter(book=>book.platform==='Leia Paraná'&&book.individual_link_verified_at&&book.cover_verified_at).length
  const freeCount=readings.filter(book=>book.platform==='Wikisource').length

  return <div className="preview-shell">
    <header className="preview-header"><Brand compact/><button type="button" className="btn btn--outline" onClick={onBack}><ArrowLeft size={17}/> {backLabel}</button></header>
    <main className="preview-main">
      <section className="preview-hero">
        <span className="eyebrow">COLÉGIO ESTADUAL PREFEITO JOAQUIM DA SILVA MAFRA</span>
        <h1>Livros para ler agora</h1>
        <p>Explore livros digitais da nossa comunidade escolar de Guaratuba. As capas e fichas verificadas levam ao Leia Paraná; os clássicos gratuitos abrem no Wikisource.</p>
        <span className="preview-location"><MapPin size={15}/> Rua José Nicolau Abagge, 1500 · Guaratuba/PR</span>
      </section>
      {status==='loading'&&readings.length===0&&<div className="catalog-status" role="status"><BookOpen size={21}/><p>Carregando as capas e os livros do catálogo...</p></div>}
      {status==='error'&&<div className="catalog-status catalog-status--error" role="alert"><AlertTriangle size={20}/><div><strong>Catálogo digital temporariamente indisponível</strong><p>{errorMessage}</p></div><button className="btn btn--outline" type="button" onClick={()=>setReload(value=>value+1)}><RefreshCw size={15}/> Tentar novamente</button></div>}
      {readings.length>0&&<><p className="catalog-summary" aria-live="polite">{leiaCount>0?<><strong>{leiaCount}</strong> livros com capas e links verificados no Leia Paraná</>:<strong>Clássicos disponíveis</strong>} {freeCount>0&&<span>· {freeCount} leituras gratuitas</span>}</p><ReadingShelf books={readings}/></>}
      <section className="preview-protected"><ShieldCheck size={26}/><div><strong>Catálogo físico e empréstimos</strong><p>Os exemplares físicos precisam ser registrados pela escola. Para consultar empréstimos e solicitações, entre com sua conta. As leituras digitais acima podem ser exploradas sem login neste site.</p></div><button className="btn btn--primary" type="button" onClick={onBack}>Entrar na biblioteca <ArrowRight size={15}/></button></section>
    </main>
  </div>
}
