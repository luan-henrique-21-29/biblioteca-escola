import React,{useMemo} from 'react'
import {ArrowRight,ArrowUpRight,BookMarked,BookmarkCheck,BookOpen,CheckCircle2,Heart,LibraryBig} from 'lucide-react'
import {recommendForReader} from './readingDiscovery.js'
import {isVerifiedLeia,urlForBook} from './readingCatalog.js'

export const READING_STATUSES=[
 {id:'quero_ler',label:'Quero ler',icon:Heart},
 {id:'lendo',label:'Estou lendo',icon:BookOpen},
 {id:'lido',label:'Já li',icon:CheckCircle2}
]
function BookCover({book}) {
 return isVerifiedLeia(book)?<img src={book.cover_url} alt={'Capa de '+book.title} loading="lazy" decoding="async" className="reading-progress-cover"/>:<div className="reading-progress-placeholder"><BookOpen size={23}/><span>{book.title}</span></div>
}

export function RecommendedBooks({books=[],progress=[],onExplore}) {
 const picks=useMemo(()=>recommendForReader(books,progress,5),[books,progress])
 if(!picks.books.length)return null
 return <section className="reader-recommended" aria-label="Recomendações digitais">
   <div className="reader-recommended-head"><div><span className="eyebrow">{picks.personalized?'RECOMENDAÇÕES PARA VOCÊ':'EXPLORE NOVAS HISTÓRIAS'}</span><h2>{picks.personalized?'Livros que combinam com suas leituras':'Uma história para começar'}</h2><p>{picks.personalized?'Sugestões pelos gêneros que você marcou na sua lista, sem usar dados de outros alunos.':'Escolha alguns livros para sua lista e as recomendações passam a seguir seus gêneros preferidos.'}</p></div><button className="btn btn--outline" type="button" onClick={onExplore}>Ver todos <ArrowRight size={15}/></button></div>
   <div className="reader-recommended-scroll">{picks.books.map(book=><a className="reader-recommended-book" href={urlForBook(book)} target="_blank" rel="noopener noreferrer" key={book.id}><BookCover book={book}/><strong>{book.title}</strong><span>{book.genre||'Literatura'}</span><small>Ver no Leia Paraná <ArrowUpRight size={13}/></small></a>)}</div>
 </section>
}

export default function ReadingListPage({books=[],progress=[],onChange,busy=false,onExplore}) {
 const bookMap=useMemo(()=>new Map(books.map(book=>[Number(book.id),book])),[books])
 const groups=READING_STATUSES.map(status=>({...status,items:progress.filter(item=>item.status===status.id).map(item=>({entry:item,book:bookMap.get(Number(item.book_id))})).filter(row=>Boolean(row.book))}))
 const total=groups.reduce((sum,item)=>sum+item.items.length,0)
 return <section className="reading-list-page" aria-label="Minha lista de leitura">
   <div className="reading-list-top"><span className="eyebrow">MINHA ESTANTE PESSOAL</span><h1>Minha lista de leitura</h1><p>Organize as suas leituras digitais. O progresso é marcado por você e fica salvo apenas na sua conta — não significa que o livro foi emprestado no Leia Paraná.</p></div>
   <div className="reading-list-stats">{groups.map(item=><div key={item.id}><item.icon size={20}/><strong>{item.items.length}</strong><span>{item.label}</span></div>)}</div>
   {total===0?<div className="reading-list-empty"><BookMarked size={35}/><h2>Vamos começar sua estante?</h2><p>Abra a ficha de um livro em “Ler online” e marque “Quero ler”, “Estou lendo” ou “Já li”. Depois ele aparecerá aqui.</p><button type="button" className="btn btn--primary" onClick={onExplore}>Escolher um livro <ArrowRight size={16}/></button></div>:groups.map(group=><section className="reading-list-group" key={group.id}><h2><group.icon size={21}/>{group.label} <span>{group.items.length}</span></h2>{group.items.length?<div className="reading-list-grid">{group.items.map(({entry,book})=><article className="reading-list-card" key={book.id}><BookCover book={book}/><div><h3>{book.title}</h3><p>{book.author} · {book.genre||'Literatura'}</p><label className="reading-list-select-label">Situação de leitura<select aria-label={'Situação de leitura de '+book.title} value={entry.status} disabled={busy} onChange={e=>onChange(book,e.target.value)}>{READING_STATUSES.map(status=><option value={status.id} key={status.id}>{status.label}</option>)}<option value="">Remover da lista</option></select></label><a href={urlForBook(book)} target="_blank" rel="noopener noreferrer">Abrir livro <ArrowUpRight size={14}/></a></div></article>)}</div>:<p className="reading-list-none">Nenhum livro nesta etapa ainda.</p>}</section>)}
 </section>
}
