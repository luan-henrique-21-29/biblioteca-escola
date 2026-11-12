import React from 'react'
import {ArrowRight,BookOpen,CalendarClock,Bell,Bookmark,Star,Clock3,AlertTriangle} from 'lucide-react'

function HighlightCard({book,onSelect,tag='NOVO NO ACERVO'}){
 return <button className="highlight-card" onClick={()=>onSelect(book)}>
  <span className="highlight-cover"><BookOpen size={25}/></span>
  <span className="highlight-desc"><small>{tag}</small><strong>{book.title}</strong><span>{book.author}</span></span><ArrowRight size={17}/>
 </button>
}
export function ReaderHighlights({books=[],notifications=[],onSelect,onNotices}){
 const newest=[...books].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,4)
 const featured=books.filter(b=>b.featured).slice(0,4)
 const unread=notifications.filter(n=>!n.read_at).slice(0,3)
 return <>
  {unread.length>0&&<section className="home-alerts" aria-label="Avisos importantes"><div className="home-alerts-title"><Bell size={19}/><strong>{unread.length} aviso(s) importante(s)</strong><button onClick={onNotices}>Abrir avisos <ArrowRight size={15}/></button></div>
   {unread.map(n=><div className="home-alert" key={n.id}><div><strong>{n.title}</strong><span>{n.body}</span></div></div>)}
  </section>}
  {(featured.length>0||newest.length>0)&&<section className="home-featured">
    <div className="home-featured-header"><div><small>DESCUBRA NOVAS HISTÓRIAS</small><h2>Livros em destaque e novidades</h2></div></div>
    {featured.length>0&&<><h3><Star size={17}/> Escolhas da biblioteca</h3><div className="highlight-grid">{featured.map(book=><HighlightCard key={book.id} book={book} onSelect={onSelect} tag="EM DESTAQUE"/>)}</div></>}
    <h3><Bookmark size={17}/> Recém-chegados</h3>
    <div className="highlight-grid">{newest.map(book=><HighlightCard key={book.id} book={book} onSelect={onSelect}/>)}</div>
  </section>}
 </>
}
export function StaffDaily({loans=[],holds=[],books=[],people=[],onNavigate}){
 const due=loans.filter(l=>l.status==='active'&&l.picked_up_at&&
  new Date(l.due_at).getTime()>=Date.now()&&new Date(l.due_at).getTime()<=Date.now()+7*86400000)
  .sort((a,b)=>new Date(a.due_at)-new Date(b.due_at)).slice(0,5)
 const pendingPickup=loans.filter(l=>l.status==='active'&&!l.picked_up_at)
 const pendingRenewals=holds.filter(h=>h.status==='pending')
 const title=id=>books.find(b=>b.id===id)?.title||'Livro'
 const reader=id=>people.find(p=>p.id===id)?.full_name||'Aluno'
 return <div className="staff-day"><section className="surface">
  <div className="staff-day-title"><div><small>AGENDA DA SEMANA</small><h3><CalendarClock size={18}/> Próximas devoluções</h3></div><button className="link-btn" onClick={()=>onNavigate('emprestimos')}>Ver empréstimos <ArrowRight size={15}/></button></div>
  {due.length?due.map(l=><div className="staff-day-row" key={l.id}><CalendarClock size={18}/><div><strong>{title(l.book_id)}</strong><span>{reader(l.reader_id)} · {new Date(l.due_at).toLocaleDateString('pt-BR')}</span></div></div>):<p className="helper-text">Nenhuma devolução prevista para os próximos sete dias.</p>}
 </section><section className="surface">
  <div className="staff-day-title"><div><small>ATENDIMENTO</small><h3><Clock3 size={18}/> Pendências da biblioteca</h3></div></div>
  <div className="staff-day-metrics"><button onClick={()=>onNavigate('emprestimos')}><strong>{pendingPickup.length}</strong><span>aguardando retirada física</span><ArrowRight size={17}/></button><button onClick={()=>onNavigate('pedidos')}><strong>{pendingRenewals.length}</strong><span>solicitações para analisar</span><ArrowRight size={17}/></button></div>
 </section></div>
}
