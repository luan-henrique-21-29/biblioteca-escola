import React,{useEffect,useRef,useState} from 'react'
import {Grid2X2,MoreHorizontal,X} from 'lucide-react'

export default function MobileNavigation({tabs,active,onNavigate,staff=false}) {
 const [open,setOpen]=useState(false)
 const moreRef=useRef(null)
 const preferred=staff?['inicio','catalogo','pedidos','emprestimos']:['inicio','digital','lista','meus']
 const pinned=preferred.map(id=>tabs.find(tab=>tab[0]===id)).filter(Boolean)
 const remaining=tabs.filter(item=>!pinned.some(pin=>pin[0]===item[0]))
 useEffect(()=>{
   if(!open)return
   const onEscape=e=>{if(e.key==='Escape')setOpen(false)}
   document.addEventListener('keydown',onEscape)
   return()=>document.removeEventListener('keydown',onEscape)
 },[open])
 const choose=id=>{setOpen(false);onNavigate(id)}
 return <><nav className="mobile-primary-nav" aria-label="Navegação rápida no celular">
   {pinned.map(([id,label,Icon])=><button type="button" className={'mobile-main-tab '+(id===active?'mobile-main-tab--active':'')} aria-current={id===active?'page':undefined} key={id} onClick={()=>choose(id)}><Icon size={21}/><span>{label==='Ler online'?'Ler':label==='Minha lista'?'Minha lista':label==='Meus livros'?'Empréstimos':label}</span></button>)}
   <button className={'mobile-main-tab '+(remaining.some(item=>item[0]===active)?'mobile-main-tab--active':'')} ref={moreRef} type="button" aria-expanded={open} aria-haspopup="dialog" onClick={()=>setOpen(previous=>!previous)}><MoreHorizontal size={22}/><span>Mais</span></button>
 </nav>
 {open&&<div className="mobile-menu-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false)}}><section className="mobile-menu-sheet" role="dialog" aria-label="Mais páginas da biblioteca"><div className="mobile-menu-title"><strong>Outras páginas</strong><button type="button" aria-label="Fechar menu" onClick={()=>{setOpen(false);moreRef.current?.focus()}}><X size={20}/></button></div><div className="mobile-menu-items">{remaining.map(([id,label,Icon])=><button key={id} type="button" className={id===active?'active':''} onClick={()=>choose(id)}><Icon size={21}/>{label}</button>)}</div></section></div>}
 </>}
