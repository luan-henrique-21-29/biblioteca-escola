import React,{useMemo,useState} from 'react'
import {ArrowLeft,BookOpen,Search,ShieldCheck,ArrowRight} from 'lucide-react'
import Brand from './Brand.jsx'
const books=[
 {title:'Dom Casmurro',author:'Machado de Assis',genre:'Romance'},
 {title:'O Cortiço',author:'Aluísio Azevedo',genre:'Romance'},
 {title:'Iracema',author:'José de Alencar',genre:'Romance'},
 {title:'A Moreninha',author:'Joaquim Manuel de Macedo',genre:'Romance'},
 {title:'O Alienista',author:'Machado de Assis',genre:'Conto'},
 {title:'Memórias Póstumas de Brás Cubas',author:'Machado de Assis',genre:'Literatura brasileira'}
]
const normalize=x=>String(x).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
export default function PublicCatalogPreview({onBack,backLabel='Voltar para configuração'}){
 const [search,setSearch]=useState(''),[genre,setGenre]=useState('Todos')
 const list=useMemo(()=>books.filter(b=>(genre==='Todos'||b.genre===genre)&&normalize(b.title+' '+b.author+' '+b.genre).includes(normalize(search))),[search,genre])
 return <div className="preview-shell"><header className="preview-header"><Brand compact/><button className="btn btn--outline" onClick={onBack}><ArrowLeft size={17}/> {backLabel}</button></header>
  <main className="preview-main">
   <section className="preview-hero"><span className="eyebrow">ACERVO FICTÍCIO — APENAS EXEMPLO VISUAL</span><h1>Prévia do catálogo</h1><p>Esta tela é pública e mostra livros de exemplo. Não é a área de aluno nem de bibliotecário; reservas, histórico e administração só funcionam com login e permissões reais.</p></section>
   <div className="preview-filters"><label><Search size={18}/><input aria-label="Pesquisar livros de exemplo" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Pesquisar título, autor ou gênero..."/></label><select aria-label="Gênero na prévia" value={genre} onChange={e=>setGenre(e.target.value)}>{['Todos',...new Set(books.map(b=>b.genre))].map(x=><option key={x}>{x}</option>)}</select></div>
   <div className="preview-grid">{list.map((b,i)=><article className="preview-book" key={b.title}><div className={'preview-book-cover preview-cover-'+(i%4)}><BookOpen size={29}/><strong>{b.title}</strong></div><small>{b.genre}</small><h2>{b.title}</h2><p>{b.author}</p></article>)}</div>
   {!list.length&&<p>Nenhum livro de exemplo encontrado.</p>}
   <section className="preview-protected"><ShieldCheck size={26}/><div><strong>Áreas protegidas</strong><p>Para usar empréstimos de verdade, cada pessoa deve entrar em sua conta. O cargo de bibliotecário não é escolhido pelo usuário: somente o administrador da escola pode autorizar.</p></div><button className="btn btn--primary" onClick={onBack}>Ativar login <ArrowRight size={15}/></button></section>
  </main>
 </div>
}
