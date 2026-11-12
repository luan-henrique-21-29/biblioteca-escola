import React, { useMemo, useState } from 'react'
import { BookOpen, BookOpenText, Search, Heart, CalendarDays, ArrowRight, ArrowLeft, LibraryBig, Clock3, Users, Check, AlertCircle } from 'lucide-react'
import Brand from './Brand.jsx'

const examples = [
  {id:1,title:'Dom Casmurro',author:'Machado de Assis',genre:'Romance',free:3},
  {id:2,title:'O Cortiço',author:'Aluísio Azevedo',genre:'Romance',free:2},
  {id:3,title:'Iracema',author:'José de Alencar',genre:'Romance',free:0},
  {id:4,title:'A Moreninha',author:'Joaquim Manuel de Macedo',genre:'Romance',free:1},
  {id:5,title:'Memórias Póstumas de Brás Cubas',author:'Machado de Assis',genre:'Literatura brasileira',free:4}
]
export default function Demo({onExit}){
  const [role,setRole]=useState('aluno')
  const [tab,setTab]=useState('inicio')
  const [query,setQuery]=useState('')
  const [favoriteIds,setFavoriteIds]=useState([1])
  const [notice,setNotice]=useState('')
  const books=useMemo(()=>examples.filter(book=>[book.title,book.author,book.genre].join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(query.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase())),[query])
  function toggle(id){setFavoriteIds(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id])}
  function announce(){setNotice('Esta é uma demonstração. Para enviar solicitações reais, conecte o Supabase conforme o README do repositório.')}
  function cards(list){return <div className="demo-book-grid">{list.map((book,i)=><div className="demo-book" key={book.id}>
    <div className={'demo-cover demo-cover-'+(book.id%5)}><BookOpenText size={27}/><strong>{book.title}</strong></div>
    <div className="demo-book-main"><small>{book.genre}</small><h3>{book.title}</h3><p>{book.author}</p>
      <div className="demo-book-status">{book.free?'Disponível':'Fila de espera'}</div>
      {role==='aluno'&&<div className="demo-book-actions"><button onClick={announce} className="demo-small-primary">Solicitar</button><button onClick={()=>toggle(book.id)} aria-label={favoriteIds.includes(book.id)?'Remover favorito':'Salvar favorito'} aria-pressed={favoriteIds.includes(book.id)} className="demo-heart"><Heart size={17} fill={favoriteIds.includes(book.id)?'currentColor':'none'}/></button></div>}
    </div>
  </div>)}</div>}
  return <div className="demo-app">
    <div className="demo-notice"><strong>MODO DEMONSTRAÇÃO</strong> · Estes livros são exemplos e não são dados reais da escola. <button onClick={onExit}>Configurar o sistema <ArrowRight size={14}/></button></div>
    <header className="demo-header"><div className="demo-header-top"><Brand compact/><div className="demo-role"><label htmlFor="demo-role">Visualização:</label><select id="demo-role" value={role} onChange={e=>{setRole(e.target.value);setTab('inicio')}}><option value="aluno">Aluno</option><option value="bibliotecario">Bibliotecário</option></select></div></div>
    <nav className="demo-tabs">{[['inicio','Início'],['catalogo','Catálogo'],...(role==='aluno'?[['favoritos','Favoritos'],['meus','Meus livros']]:[['emprestimos','Empréstimos']])].map(([id,label])=><button key={id} onClick={()=>setTab(id)} className={tab===id?'demo-tab-on':''}>{label}</button>)}</nav></header>
    <main className="demo-content">
      {notice&&<p className="demo-warning"><AlertCircle size={16}/>{notice}<button aria-label="Fechar aviso" onClick={()=>setNotice('')}>×</button></p>}
      {tab==='inicio'&&<><section className="demo-welcome"><span>Biblioteca Joaquim</span><h1>{role==='aluno'?'Boas-vindas à biblioteca!':'Painel da biblioteca'}</h1><p>{role==='aluno'?'Descubra livros, acompanhe seus empréstimos e organize suas próximas leituras.':'Organize o acervo, as solicitações e as devoluções da escola.'}</p><button onClick={()=>setTab('catalogo')}>Ver catálogo <ArrowRight size={17}/></button></section>
      <div className="demo-stats"><div><BookOpen size={20}/><strong>{role==='aluno'?'1':'150'}</strong><span>{role==='aluno'?'Livro emprestado':'Livros no acervo (exemplo)'}</span></div><div><CalendarDays size={20}/><strong>{role==='aluno'?'14 dias':'18'}</strong><span>{role==='aluno'?'Prazo de devolução':'Empréstimos ativos (exemplo)'}</span></div><div><Heart size={20}/><strong>{role==='aluno'?favoriteIds.length:'3'}</strong><span>{role==='aluno'?'Meus favoritos':'Pedidos pendentes (exemplo)'}</span></div></div>
      <div className="demo-section-title"><h2>Livros populares</h2><button onClick={()=>setTab('catalogo')}>Ver catálogo <ArrowRight size={15}/></button></div>
      {cards(examples.slice(0,4))}</>}
      {tab==='catalogo'&&<><div className="demo-section-title"><div><small>EXPLORAR</small><h2>Catálogo de livros</h2></div></div><label className="demo-search"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Pesquisar por título, autor ou gênero..."/></label>{books.length?cards(books):<p>Nenhum livro encontrado.</p>}</>}
      {tab==='favoritos'&&<><div className="demo-section-title"><h2>Meus favoritos</h2></div>{favoriteIds.length?cards(examples.filter(b=>favoriteIds.includes(b.id))):<p className="demo-empty">Toque no coração de um livro para adicioná-lo aos favoritos.</p>}</>}
      {(tab==='meus'||tab==='emprestimos')&&<><div className="demo-section-title"><h2>{tab==='meus'?'Meus livros':'Empréstimos da biblioteca'}</h2></div><div className="demo-table"><div><BookOpen size={22}/><div><strong>Dom Casmurro</strong><small>{tab==='meus'?'Devolução em 14 dias':'Aluno demonstrativo · prazo: 14 dias'}</small></div><span>Em dia</span></div><p>Esta tela é apenas uma prévia. Os empréstimos reais aparecerão depois de conectar o banco.</p></div></>}
    </main>
  </div>
}
