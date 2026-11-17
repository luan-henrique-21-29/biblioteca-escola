import React,{useEffect,useMemo,useState} from 'react'
import {ArrowLeft,ArrowRight,ArrowUpRight,BookOpen,Pause,Play} from 'lucide-react'
import {configured,supabase} from './supabase.js'
import {isVerifiedLeia,urlForBook} from './readingCatalog.js'

const fields='id,title,author,genre,synopsis,note,cover_url,access_url,platform,individual_link_verified_at,cover_verified_at'
export default function FeaturedBooks({books,onBrowse,small=false}) {
 const [loaded,setLoaded]=useState([])
 const [index,setIndex]=useState(0)
 const [paused,setPaused]=useState(false)
 const [broken,setBroken]=useState({})
 useEffect(()=>{
   if(books!==undefined||!configured)return
   let active=true
   supabase.from('digital_reading_recommendations').select(fields).eq('platform','Leia Paraná')
     .eq('is_active',true).not('individual_link_verified_at','is',null)
     .order('id',{ascending:true}).limit(12).then(({data,error})=>{
       if(active&&!error&&data)setLoaded(data)
     })
   return()=>{active=false}
 },[books])
 const items=useMemo(()=>(books===undefined?loaded:books)
   .filter(isVerifiedLeia).slice(0,8),[books,loaded])
 useEffect(()=>{setIndex(0)},[items.length])
 useEffect(()=>{
   if(items.length<2||paused||typeof window==='undefined')return
   if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return
   const timer=window.setInterval(()=>{if(!document.hidden)setIndex(x=>(x+1)%items.length)},6500)
   return()=>clearInterval(timer)
 },[items.length,paused])
 if(!items.length)return null
 const active=items[index%items.length]
 const move=dir=>setIndex(x=>(x+dir+items.length)%items.length)
 return <section className={'featured-books'+(small?' featured-books--small':'')} aria-label="Livros digitais em destaque">
   <div className="featured-books-copy">
     <span className="featured-label">VITRINE DE LEITURA · LEIA PARANÁ</span>
     <div className="featured-pagination">{String(index+1).padStart(2,'0')} <span>/ {String(items.length).padStart(2,'0')}</span></div>
     <h2 key={active.id}>{active.title}</h2>
     <p className="featured-author">{active.author} · {active.genre||'Literatura'}</p>
     <p className="featured-description">{active.synopsis||active.note||'Conheça o livro e sua edição na plataforma Leia Paraná.'}</p>
     <div className="featured-buttons">
       <a href={urlForBook(active)} target="_blank" rel="noopener noreferrer" className="btn btn--primary">Abrir este livro <ArrowUpRight size={16}/></a>
       {onBrowse&&<button type="button" className="btn btn--outline" onClick={onBrowse}>Explorar os 50 livros <ArrowRight size={16}/></button>}
     </div>
     <div className="featured-controls" aria-label="Controles dos livros em destaque">
       <button aria-label="Livro anterior" type="button" onClick={()=>move(-1)}><ArrowLeft size={17}/></button>
       <button aria-label="Próximo livro" type="button" onClick={()=>move(1)}><ArrowRight size={17}/></button>
       <button aria-label={paused?'Retomar troca automática':'Pausar troca automática'} aria-pressed={paused} type="button" onClick={()=>setPaused(x=>!x)}>{paused?<Play size={16}/>:<Pause size={16}/>}</button>
       <span>Capas da edição real · acesso @escola</span>
     </div>
   </div>
   <div className="featured-books-image">
     {!broken[active.id]?<img src={active.cover_url} alt={'Capa da edição de '+active.title} loading={index===0?'eager':'lazy'} decoding="async" onError={()=>setBroken(old=>({...old,[active.id]:true}))}/>:<div className="featured-image-missing"><BookOpen size={40}/><span>Capa indisponível</span></div>}
   </div>
 </section>
}
