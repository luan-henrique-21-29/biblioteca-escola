import React, {useEffect,useMemo,useState} from 'react'
import {BookOpen,BookOpenText,Search,Heart,CalendarDays,ArrowRight,Clock3,Users,Check,AlertCircle,RefreshCw,Bell,LibraryBig,BarChart3,Plus,LogOut,Filter,BookmarkCheck,CheckCircle2,FileSpreadsheet,Download,ShieldCheck,Trash2} from 'lucide-react'
import Brand from './Brand.jsx'
import ImportBooks from './ImportBooks.jsx'
import {downloadCsv,csvData} from './reporting.js'

const KEY='biblioteca-joaquim-local-demo-v3'
const today=()=>new Date().toISOString()
const id=()=>String(Date.now())+'-'+Math.random().toString(36).slice(2,9)
const starter={
  books:[
    {id:'b1',title:'Dom Casmurro',author:'Machado de Assis',genre:'Romance',synopsis:'Um clássico da literatura brasileira, narrado por Bentinho.',year:1899,copies:['1001','1002','1003']},
    {id:'b2',title:'O Cortiço',author:'Aluísio Azevedo',genre:'Romance',synopsis:'Retrato da vida coletiva no Rio de Janeiro do século XIX.',year:1890,copies:['1004','1005']},
    {id:'b3',title:'Iracema',author:'José de Alencar',genre:'Romance',synopsis:'Narrativa romântica ambientada no Ceará.',year:1865,copies:['1006']},
    {id:'b4',title:'A Moreninha',author:'Joaquim Manuel de Macedo',genre:'Romance',synopsis:'Um dos marcos do romance brasileiro.',year:1844,copies:['1007']},
    {id:'b5',title:'Memórias Póstumas de Brás Cubas',author:'Machado de Assis',genre:'Literatura brasileira',synopsis:'Um narrador descreve sua vida com ironia.',year:1881,copies:['1008','1009']},
    {id:'b6',title:'O Alienista',author:'Machado de Assis',genre:'Conto',synopsis:'Uma sátira sobre ciência, loucura e poder.',year:1882,copies:['1010']}
  ],
  readers:[{id:'a1',name:'Ana Souza (exemplo)',classroom:'1º IA'},{id:'a2',name:'Pedro Lima (exemplo)',classroom:'2º A'}],
  holds:[],loans:[],renewals:[],notifications:[],
  favorites:{a1:['b1'],a2:[]},settings:{limit:2,days:14}
}
const clone=o=>JSON.parse(JSON.stringify(o))
const load=()=>{
  try{
    const value=JSON.parse(window.localStorage.getItem(KEY))
    return value?.books && value?.loans && value?.settings ? value : clone(starter)
  }catch{return clone(starter)}
}
const showDate=d=>d?new Date(d).toLocaleDateString('pt-BR'):'—'
const daysLeft=d=>Math.ceil((new Date(d).getTime()-Date.now())/86400000)
export default function Demo({onExit}){
  const [db,setDb]=useState(load)
  const [role,setRole]=useState('a1')
  const [tab,setTab]=useState('inicio')
  const [query,setQuery]=useState('')
  const [genre,setGenre]=useState('Todos')
  const [author,setAuthor]=useState('')
  const [avail,setAvail]=useState('todos')
  const [notice,setNotice]=useState('')
  const [selected,setSelected]=useState(null)
  const [add,setAdd]=useState(false)
  const [importing,setImporting]=useState(false)
  const [busy,setBusy]=useState(false)
  const staff=role==='staff'
  const reader=db.readers.find(r=>r.id===role)
  const active=db.loans.filter(l=>l.status==='active')
  const mine=db.loans.filter(l=>l.readerId===role)
  const overdue=mine.some(l=>l.status==='active'&&daysLeft(l.dueAt)<0)
  const dueDates=db.settings.days
  const remaining=book=>book.copies.length-active.filter(l=>l.bookId===book.id).length
  const book=id=>db.books.find(b=>b.id===id)
  const readerName=id=>db.readers.find(r=>r.id===id)?.name||'Leitor'
  const inbox=db.notifications.filter(n=>n.readerId===role)
  const favorites=db.favorites[role]||[]
  const genres=['Todos',...new Set(db.books.map(b=>b.genre))]
  const normalize=t=>String(t??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
  const filtered=db.books.filter(b=>(genre==='Todos'||b.genre===genre)&&normalize(b.author).includes(normalize(author))&&normalize([b.title,b.author,b.genre,b.synopsis].join(' ')).includes(normalize(query))&&(avail==='todos'||(avail==='disponivel'?remaining(b)>0:remaining(b)===0)))
  const popular=useMemo(()=>db.books.map(b=>({...b,borrows:db.loans.filter(l=>l.bookId===b.id).length})).sort((a,b)=>b.borrows-a.borrows),[db])
  useEffect(()=>{try{window.localStorage.setItem(KEY,JSON.stringify(db))}catch{}},[db])
  function update(fn){setDb(prev=>fn(clone(prev)))}
  function toast(message){setNotice(message)}
  function addNotice(data,readerId,title,body){data.notifications.unshift({id:id(),readerId,title,body,createdAt:today(),read:false})}
  function queue(bookId){return db.holds.filter(h=>h.bookId===bookId&&h.status==='pending').sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt))}
  function request(bookId){
    if(staff)return
    if(overdue){toast('Regularize seus livros atrasados antes de solicitar outro.');return}
    if(mine.filter(l=>l.status==='active').length>=db.settings.limit){toast('Você atingiu o limite de livros emprestados.');return}
    if(mine.some(l=>l.bookId===bookId&&l.status==='active')||db.holds.some(h=>h.bookId===bookId&&h.readerId===role&&h.status==='pending')){toast('Você já tem este livro ou uma solicitação dele.');return}
    update(d=>{d.holds.push({id:id(),bookId,readerId:role,status:'pending',createdAt:today()});return d})
    setSelected(null);toast('Pedido enviado! O bibliotecário precisa aprovar.')
  }
  function resolveHold(holdId,approve){
    const hold=db.holds.find(h=>h.id===holdId)
    if(!hold)return
    const b=book(hold.bookId)
    if(approve && queue(b.id)[0]?.id!==hold.id){toast('Atenda primeiro a solicitação mais antiga deste livro.');return}
    const copy=approve?b.copies.find(c=>!active.some(l=>l.copyCode===c)):null
    if(approve&&!copy){toast('Não existe exemplar disponível. O pedido continua na fila.');return}
    if(approve && db.loans.filter(l=>l.readerId===hold.readerId&&l.status==='active').length>=db.settings.limit){toast('Este aluno já atingiu o limite de empréstimos.');return}
    const due=new Date();due.setDate(due.getDate()+db.settings.days)
    update(d=>{
      const h=d.holds.find(x=>x.id===holdId);h.status=approve?'approved':'rejected'
      if(approve)d.loans.unshift({id:id(),readerId:h.readerId,bookId:h.bookId,copyCode:copy,status:'active',approvedAt:today(),dueAt:due.toISOString()})
      addNotice(d,h.readerId,approve?'Empréstimo aprovado':'Solicitação não aprovada',approve?'Livro: '+b.title+'. Devolução em '+showDate(due.toISOString()):'Livro: '+b.title)
      return d
    });toast(approve?'Empréstimo aprovado.':'Solicitação recusada.')
  }
  function finishLoan(loanId){
    const l=db.loans.find(x=>x.id===loanId)
    if(!l)return
    update(d=>{
      const loan=d.loans.find(x=>x.id===loanId);loan.status='returned';loan.returnedAt=today()
      addNotice(d,loan.readerId,'Devolução registrada','Obrigado por devolver '+book(loan.bookId)?.title+'.')
      const next=d.holds.filter(h=>h.bookId===loan.bookId&&h.status==='pending').sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt))[0]
      if(next)addNotice(d,next.readerId,'Livro disponível','Há um exemplar de '+book(loan.bookId)?.title+' para sua posição na fila. Aguarde a aprovação.')
      return d
    });toast('Devolução registrada e fila atualizada.')
  }
  function renewal(loanId){update(d=>{d.renewals.push({id:id(),loanId,readerId:role,status:'pending'});return d});toast('Pedido de renovação enviado.')}
  function resolveRenewal(reqId,approve){
    const r=db.renewals.find(x=>x.id===reqId);const l=db.loans.find(x=>x.id===r?.loanId)
    if(!r||!l)return
    if(approve&&queue(l.bookId).some(h=>h.readerId!==l.readerId)){toast('Há pessoas aguardando este título; não é possível renovar agora.');return}
    if(approve&&(l.status!=='active'||daysLeft(l.dueAt)<0)){toast('Esse empréstimo não pode ser renovado.');return}
    update(d=>{
      const req=d.renewals.find(x=>x.id===reqId);req.status=approve?'approved':'rejected'
      if(approve){const loan=d.loans.find(x=>x.id===req.loanId);const due=new Date(loan.dueAt);due.setDate(due.getDate()+d.settings.days);loan.dueAt=due.toISOString()}
      addNotice(d,r.readerId,approve?'Renovação aprovada':'Renovação recusada',book(l.bookId)?.title||'Livro')
      return d
    });toast(approve?'Renovação aprovada.':'Renovação recusada.')
  }
  function toggleFavorite(bookId){update(d=>{const list=d.favorites[role]||[];d.favorites[role]=list.includes(bookId)?list.filter(x=>x!==bookId):[...list,bookId];return d})}
  function addBook(e){e.preventDefault();const form=new FormData(e.currentTarget);const code=String(form.get('code')||'').trim()
    if(!/^\d+$/.test(code)||db.books.some(b=>b.copies.includes(code))){toast('Código numérico inválido ou repetido.');return}
    update(d=>{d.books.push({id:id(),title:String(form.get('title')),author:String(form.get('author')),genre:String(form.get('genre')),synopsis:String(form.get('synopsis')),year:Number(form.get('year'))||null,copies:[code]});return d})
    setAdd(false);toast('Livro cadastrado na demonstração.')
  }
  async function importRows(rows){
    if(busy)return false
    const existing=new Set(db.books.flatMap(b=>b.copies))
    if(rows.some(r=>existing.has(r.codigo))){toast('Há um código duplicado com o acervo existente. Nada foi gravado.');return false}
    setBusy(true)
    try{
      update(d=>{
        for(const r of rows){
          let b=d.books.find(x=>normalize(x.title)===normalize(r.titulo)&&normalize(x.author)===normalize(r.autor))
          if(!b){b={id:id(),title:r.titulo,author:r.autor,genre:r.genero,synopsis:r.sinopse,year:r.ano?Number(r.ano):null,copies:[]};d.books.push(b)}
          b.copies.push(r.codigo)
        }return d
      });toast(rows.length+' exemplar(es) importado(s) nesta demonstração.');return true
    }finally{setBusy(false)}
  }
  function switchRole(v){setRole(v);setTab('inicio');setSelected(null);setNotice('')}
  function reset(){if(window.confirm('Apagar os dados desta demonstração neste navegador?')){setDb(clone(starter));setNotice('Demonstração reiniciada.');setTab('inicio')}}
  function panel(title,subtitle,children){return <section className="demo-surface"><h3>{title}</h3>{subtitle&&<p className="demo-caption">{subtitle}</p>}{children}</section>}
  function empty(message){return <p className="demo-empty">{message}</p>}
  function cards(list){return list.length?<div className="demo-book-grid">{list.map((b)=><div className="demo-book" key={b.id}>
    <div className={'demo-cover demo-cover-'+(db.books.findIndex(x=>x.id===b.id)%5)}><BookOpenText size={27}/><strong>{b.title}</strong></div>
    <div className="demo-book-main"><small>{b.genre}</small><h3>{b.title}</h3><p>{b.author}</p>
      <div className="demo-book-status">{remaining(b)>0?remaining(b)+' disponível(is)':'Fila de espera'}</div>
      <div className="demo-book-actions">
        <button className="demo-small-primary" onClick={()=>setSelected(b)}>Ver detalhes</button>
        {!staff&&<button onClick={()=>toggleFavorite(b.id)} aria-label={favorites.includes(b.id)?'Remover favorito':'Salvar favorito'} aria-pressed={favorites.includes(b.id)} className="demo-heart"><Heart size={17} fill={favorites.includes(b.id)?'currentColor':'none'}/></button>}
      </div>
    </div>
  </div>)}</div>:empty('Nenhum livro encontrado.')}
  const tabs=staff?[['inicio','Início'],['catalogo','Acervo'],['solicitacoes','Solicitações'],['emprestimos','Empréstimos'],['relatorios','Relatórios']]:[['inicio','Início'],['catalogo','Catálogo'],['favoritos','Favoritos'],['meus','Meus livros'],['avisos','Avisos']]
  return <div className="demo-app">
    <div className="demo-notice"><strong>MODO DEMONSTRAÇÃO</strong> · Dados locais fictícios, salvos somente neste navegador. Não é um login nem um banco compartilhado. <button onClick={onExit}>Ativar sistema real <ArrowRight size={14}/></button></div>
    <header className="demo-header"><div className="demo-header-top"><Brand compact/><div className="demo-role"><label htmlFor="demo-role">Testar como:</label><select id="demo-role" value={role} onChange={e=>switchRole(e.target.value)}>
      {db.readers.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}<option value="staff">Bibliotecário (exemplo)</option></select></div></div>
      <nav className="demo-tabs">{tabs.map(([key,label])=><button key={key} onClick={()=>setTab(key)} className={tab===key?'demo-tab-on':''}>{label}{key==='avisos'&&inbox.some(n=>!n.read)&&' •'}</button>)}</nav>
    </header>
    <main className="demo-content">
      {notice&&<p className="demo-warning" role="status"><AlertCircle size={16}/>{notice}<button aria-label="Fechar aviso" onClick={()=>setNotice('')}>×</button></p>}
      {tab==='inicio'&&<><section className="demo-welcome"><span>Biblioteca Joaquim · Modo de teste</span><h1>{staff?'Painel do bibliotecário':'Olá, '+reader?.name.split(' ')[0]+'!'}</h1><p>{staff?'Acompanhe o acervo e aprove as solicitações fictícias para entender o sistema.':'Explore o acervo, faça pedidos de teste e acompanhe suas devoluções.'}</p><button onClick={()=>setTab('catalogo')}>Explorar catálogo <ArrowRight size={17}/></button></section>
        <div className="demo-stats"><div><BookOpen size={20}/><strong>{staff?db.books.reduce((s,b)=>s+b.copies.length,0):mine.filter(l=>l.status==='active').length}</strong><span>{staff?'Exemplares no acervo':'Meus empréstimos ativos'}</span></div><div><Clock3 size={20}/><strong>{staff?db.holds.filter(h=>h.status==='pending').length:db.holds.filter(h=>h.readerId===role&&h.status==='pending').length}</strong><span>Solicitações pendentes</span></div><div><Heart size={20}/><strong>{staff?active.length:favorites.length}</strong><span>{staff?'Empréstimos ativos':'Meus favoritos'}</span></div></div>
        <div className="demo-section-title"><h2>Livros mais emprestados</h2><button onClick={()=>setTab('catalogo')}>Ver catálogo <ArrowRight size={15}/></button></div>{cards(popular.slice(0,4))}
        {!staff&&inbox.filter(n=>!n.read).length>0&&panel('Seus avisos','Novidades que precisam da sua atenção',inbox.filter(n=>!n.read).slice(0,3).map(n=><div className="demo-line" key={n.id}><Bell size={18}/><div><strong>{n.title}</strong><small>{n.body}</small></div></div>))}
      </>}
      {tab==='catalogo'&&<><div className="demo-section-title"><div><small>EXPLORE O ACERVO</small><h2>Catálogo de livros</h2></div>{staff&&<div className="demo-button-row"><button onClick={()=>{setAdd(!add);setImporting(false)}}><Plus size={15}/> Novo livro</button><button onClick={()=>{setImporting(!importing);setAdd(false)}}><FileSpreadsheet size={15}/> Importar planilha</button></div>}</div>
        {staff&&add&&panel('Cadastrar um livro','Cada título precisa de um exemplar com código único.',<form className="demo-form" onSubmit={addBook}>
          <input name="title" placeholder="Título" required/><input name="author" placeholder="Autor" required/><input name="genre" placeholder="Gênero" required/><input name="code" placeholder="Código numérico" pattern="[0-9]+" required/><input name="year" type="number" min="0" max="2100" placeholder="Ano"/><textarea name="synopsis" placeholder="Sinopse"/><button className="demo-small-primary">Cadastrar livro</button></form>)}
        {staff&&importing&&panel('Importar planilha','Prévia e validação do arquivo Excel ou CSV.',<ImportBooks onImport={importRows} busy={busy}/>)}
        <div className="demo-search-row"><label className="demo-search"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Pesquisar título, autor e assunto..."/></label>
        <input aria-label="Filtrar por autor" value={author} onChange={e=>setAuthor(e.target.value)} placeholder="Filtrar autor"/>
        <select aria-label="Filtrar por gênero" value={genre} onChange={e=>setGenre(e.target.value)}>{genres.map(g=><option key={g}>{g}</option>)}</select>
        <select aria-label="Filtrar por disponibilidade" value={avail} onChange={e=>setAvail(e.target.value)}><option value="todos">Todos</option><option value="disponivel">Disponíveis</option><option value="indisponivel">Indisponíveis</option></select></div>
        <p className="demo-caption">{filtered.length} título(s) encontrado(s)</p>{cards(filtered)}
      </>}
      {tab==='favoritos'&&!staff&&<><div className="demo-section-title"><h2>Meus favoritos</h2></div>{cards(db.books.filter(b=>favorites.includes(b.id)))}</>}
      {tab==='meus'&&!staff&&<><div className="demo-section-title"><h2>Meus livros</h2></div>
        {panel('Empréstimos e histórico','Prazo: '+dueDates+' dias. Limite: '+db.settings.limit+' livro(s) ativos.',mine.length?mine.map(l=><div className="demo-line" key={l.id}><BookOpen size={20}/><div><strong>{book(l.bookId)?.title}</strong><small>Exemplar {l.copyCode} · Devolução: {showDate(l.dueAt)} · {l.status==='returned'?'Devolvido':daysLeft(l.dueAt)+' dia(s) restantes'}</small></div>{l.status==='active'&&!db.renewals.some(r=>r.loanId===l.id&&r.status==='pending')&&<button onClick={()=>renewal(l.id)}>Pedir renovação</button>}</div>):empty('Você ainda não tem empréstimos.'))}
        {panel('Minhas solicitações e fila de espera',null,db.holds.filter(h=>h.readerId===role).slice().reverse().map(h=>{
          const pos=queue(h.bookId).findIndex(x=>x.id===h.id)+1
          return <div className="demo-line" key={h.id}><BookmarkCheck size={20}/><div><strong>{book(h.bookId)?.title}</strong><small>{h.status==='pending'?'Posição '+pos+' de '+queue(h.bookId).length+' na fila':'Situação: '+(h.status==='approved'?'Aprovado':h.status==='cancelled'?'Cancelado':'Recusado')}</small></div>{h.status==='pending'&&<button onClick={()=>{update(d=>{d.holds.find(x=>x.id===h.id).status='cancelled';return d});toast('Solicitação cancelada.')}}>Cancelar</button>}</div>
        }))}
        {panel('Pedidos de renovação',null,db.renewals.filter(r=>r.readerId===role).map(r=><div className="demo-line" key={r.id}><RefreshCw size={20}/><div><strong>{book(db.loans.find(l=>l.id===r.loanId)?.bookId)?.title}</strong><small>{r.status==='pending'?'Aguardando bibliotecário':r.status==='approved'?'Aprovada':'Recusada'}</small></div></div>))}
      </>}
      {tab==='avisos'&&!staff&&<><div className="demo-section-title"><h2>Avisos da biblioteca</h2><button onClick={()=>update(d=>{d.notifications.filter(n=>n.readerId===role).forEach(n=>n.read=true);return d})}>Marcar lidos</button></div>
        {panel('Mensagens internas',null,inbox.length?inbox.map(n=><div className="demo-line" key={n.id}><Bell size={20}/><div><strong>{n.title}</strong><small>{n.body}</small></div>{!n.read&&<span className="demo-pill">Novo</span>}</div>):empty('Nenhum aviso por enquanto.'))}</>}
      {tab==='solicitacoes'&&staff&&<><div className="demo-section-title"><h2>Solicitações para aprovação</h2></div>
        {panel('Empréstimos pendentes',null,db.holds.filter(h=>h.status==='pending').length?db.holds.filter(h=>h.status==='pending').map(h=><div className="demo-line" key={h.id}><BookmarkCheck size={20}/><div><strong>{book(h.bookId)?.title}</strong><small>{readerName(h.readerId)} · posição {queue(h.bookId).findIndex(x=>x.id===h.id)+1} de {queue(h.bookId).length} · {remaining(book(h.bookId))} livre(s)</small></div><div className="demo-row-actions"><button onClick={()=>resolveHold(h.id,true)}>Aprovar</button><button onClick={()=>resolveHold(h.id,false)}>Recusar</button></div></div>):empty('Nenhuma solicitação pendente.'))}
        {panel('Renovações pendentes',null,db.renewals.filter(r=>r.status==='pending').map(r=><div className="demo-line" key={r.id}><RefreshCw size={20}/><div><strong>{book(db.loans.find(l=>l.id===r.loanId)?.bookId)?.title}</strong><small>{readerName(r.readerId)}</small></div><div className="demo-row-actions"><button onClick={()=>resolveRenewal(r.id,true)}>Aprovar</button><button onClick={()=>resolveRenewal(r.id,false)}>Recusar</button></div></div>))}
      </>}
      {tab==='emprestimos'&&staff&&<><div className="demo-section-title"><h2>Empréstimos da biblioteca</h2></div>{panel('Controle de devoluções',null,db.loans.length?db.loans.map(l=><div className="demo-line" key={l.id}><BookOpen size={20}/><div><strong>{book(l.bookId)?.title}</strong><small>{readerName(l.readerId)} · Exemplar {l.copyCode} · Prazo: {showDate(l.dueAt)} · {l.status==='active'?'Emprestado':'Devolvido'}</small></div>{l.status==='active'&&<button onClick={()=>finishLoan(l.id)}>Registrar devolução</button>}</div>):empty('Sem empréstimos na demonstração.'))}</>}
      {tab==='relatorios'&&staff&&<><div className="demo-section-title"><h2>Relatórios e configurações</h2></div>
        {panel('Regras da biblioteca','Alterações valem para novas solicitações e renovações.',<div className="demo-form"><label>Limite de livros por aluno<input type="number" min="1" max="20" value={db.settings.limit} onChange={e=>update(d=>{d.settings.limit=Number(e.target.value);return d})}/></label><label>Prazo padrão (dias)<input type="number" min="1" max="180" value={db.settings.days} onChange={e=>update(d=>{d.settings.days=Number(e.target.value);return d})}/></label></div>)}
        {panel('Exportar dados de teste','Os arquivos contêm apenas nomes fictícios.',<button className="demo-small-primary" onClick={()=>downloadCsv('biblioteca-joaquim-demo.csv',csvData(['Exemplar','Livro','Aluno','Status','Prazo'],db.loans.map(l=>[l.copyCode,book(l.bookId)?.title,readerName(l.readerId),l.status,showDate(l.dueAt)])))}><Download size={16}/> Baixar empréstimos CSV</button>)}
        {panel('Reiniciar demonstração','Remove todos os livros e empréstimos criados apenas neste navegador.',<button className="btn btn--outline" onClick={reset}><Trash2 size={16}/> Apagar dados de teste</button>)}
      </>}
    </main>
    {selected&&<div className="demo-modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setSelected(null)}}><div className="demo-modal" role="dialog" aria-modal="true" aria-label="Detalhes do livro">
      <button className="demo-modal-close" aria-label="Fechar detalhes" onClick={()=>setSelected(null)}>×</button><span>{selected.genre}</span><h2>{selected.title}</h2><p>{selected.author} · {selected.year||'Ano não informado'}</p><p>{selected.synopsis}</p><p><strong>Disponibilidade:</strong> {remaining(selected)} de {selected.copies.length} exemplar(es) livre(s).</p>
      {!staff&&<div className="demo-row-actions"><button className="demo-small-primary" onClick={()=>request(selected.id)}>{remaining(selected)>0?'Solicitar empréstimo':'Entrar na fila de espera'}</button><button onClick={()=>toggleFavorite(selected.id)}><Heart size={16}/> {favorites.includes(selected.id)?'Remover favorito':'Salvar favorito'}</button></div>}
      {staff&&<p className="demo-caption">Códigos: {selected.copies.join(', ')}</p>}
    </div></div>}
    <footer className="footer"><span>Biblioteca Joaquim · Demonstração local</span><button className="link-btn" onClick={onExit}>Ativar login e banco real <ArrowRight size={16}/></button></footer>
  </div>
}
