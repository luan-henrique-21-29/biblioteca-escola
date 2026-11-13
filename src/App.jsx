import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, Search, LayoutDashboard, LibraryBig, BookmarkCheck, History, Bell, Users, Settings, Upload, BarChart3, LogOut, Plus, ArrowRight, ArrowLeft, Check, X, Clock3, AlertTriangle, CalendarDays, Star, Heart, Trophy, RefreshCw, Mail, ShieldCheck, Menu, BookMarked, Filter, Send, CheckCircle2, Info, TrendingUp, UserCircle2, LockKeyhole, LoaderCircle, MapPin } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import Brand from './Brand.jsx'
import SetupGuide from './SetupGuide.jsx'
import PublicCatalogPreview from './PublicCatalogPreview.jsx'
import ReadingShelf from './ReadingShelf.jsx'
import {PUBLIC_READINGS,NORMALIZE_TITLE,LEIA_PARANA_URL} from './readingCatalog.js'
import {getAuthRedirectUrl} from './authPaths.js'
import {downloadCsv,loansReport,catalogReport} from './reporting.js'
import ImportBooks from './ImportBooks.jsx'
import {ConditionForm,LoanReceipt} from './Circulation.jsx'
import {ReaderHighlights,StaffDaily} from './Highlights.jsx'
import ReportsPanel from './ReportsPanel.jsx'
import { configured, supabase, must } from './supabase.js'

const initial = { books: [], copies: [], inventory: [], favorites: [], popular: [], holds: [], queue: [], loans: [], events: [], renewals: [], reviews: [], notifications: [], settings: { max_active_loans: 2, loan_days: 14 }, people: [], invites: [] }
const statusLabel = { pending: 'Aguardando aprovação', approved: 'Aprovada', rejected: 'Recusada', cancelled: 'Cancelada', active: 'Emprestado', returned: 'Devolvido' }
const dateText = v => v ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(v)) : '—'
const days = v => { const d=(new Date(v).getTime()-Date.now())/86400000; return d>=0?Math.ceil(d):Math.floor(d) }
const fullDate = v => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(v))
const getErr = e => e?.message || 'Não foi possível concluir. Tente novamente.'
const isStaff = p => p?.role === 'librarian' || p?.role === 'admin'
const isAdmin = p => p?.role === 'admin'
// Confirmação de e-mail e recuperação de senha precisam voltar para /biblioteca-escola/ no GitHub Pages.
const authRedirectUrl = () => getAuthRedirectUrl(import.meta.env.BASE_URL,window.location.origin)
const normalizeSearch = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR')

function Empty({ icon: Icon=BookOpen, title, subtitle }) { return <div className="empty"><Icon size={33}/><strong>{title}</strong><p>{subtitle}</p></div> }
function Pill({children,tone='neutral'}) { return <span className={'pill pill--'+tone}>{children}</span> }
function PanelHead({eyebrow,title,subtitle,action}) { return <div className="panel-head"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</div> }
function Stat({label,value,icon:Icon,tone='blue',sub}) { return <div className="stat"><span className={'stat-icon stat-icon--'+tone}><Icon size={21}/></span><strong>{value}</strong><span>{label}</span>{sub && <small>{sub}</small>}</div> }
function Cover({book,large=false}) { return <div className={'cover '+(large?'cover--large':'')} style={book?.cover_url ? {backgroundImage: 'url("'+book.cover_url.replaceAll('"','%22')+'")'} : {}} aria-label={'Capa de '+book.title}>{!book?.cover_url && <><BookOpen size={31}/><span>{book.title}</span></>}</div> }
function Field({label,children}) { return <label className="field"><span>{label}</span>{children}</label> }
function Modal({title,onClose,children}) { return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><div className="modal" role="dialog" aria-modal="true" aria-label={title}><div className="modal-title"><h2>{title}</h2><button className="icon-btn" aria-label="Fechar" onClick={onClose}><X size={20}/></button></div>{children}</div></div> }
function AuthScreen() {
  const [previewOpen,setPreviewOpen]=useState(false)
  const [register,setRegister]=useState(false),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[name,setName]=useState(''),[classroom,setClassroom]=useState(''),[loading,setLoading]=useState(false),[error,setError]=useState(''),[msg,setMsg]=useState('')
  async function submit(e) {
    e.preventDefault();setLoading(true);setError('');setMsg('')
    try {
      const address=email.trim().toLowerCase()
      if(!address||password.length<8)throw new Error('Preencha o e-mail e uma senha com pelo menos 8 caracteres.')
      if(register){
        if(name.trim().length<3||classroom.trim().length<2)throw new Error('Informe seu nome completo e sua turma.')
        const created=must(await supabase.auth.signUp({email:address,password,options:{data:{full_name:name.trim(),classroom:classroom.trim()},emailRedirectTo:authRedirectUrl()}}))
        if(!created.session)setMsg('Cadastro enviado. Confira seu e-mail para confirmar sua conta e depois entre com sua senha.')
        else setMsg('Conta criada! Sua biblioteca está pronta.')
      }else must(await supabase.auth.signInWithPassword({email:address,password}))
    }catch(e){setError(getErr(e))}finally{setLoading(false)}
  }
  async function reset(){
    if(!email.trim()){setError('Digite seu e-mail antes de pedir uma nova senha.');return}
    setLoading(true);setError('');setMsg('')
    try{must(await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(),{redirectTo:authRedirectUrl()}));setMsg('Se existir uma conta com este e-mail, você receberá instruções para redefinir sua senha.')}
    catch(e){setError(getErr(e))}finally{setLoading(false)}
  }
  if(previewOpen)return <PublicCatalogPreview onBack={()=>setPreviewOpen(false)} backLabel="Voltar ao login"/>
  return <div className="auth-layout auth-layout--school">
    <aside className="auth-intro">
      <div className="auth-intro-top"><Brand/><span className="auth-campus-label">GUARATUBA · PARANÁ</span></div>
      <div className="auth-intro-center">
        <figure className="school-photo">
          <img src="https://litoranea.fm/wp-content/uploads/2024/01/12076847225_b441fe56c6_b.jpg" alt="Quadra do Colégio Estadual Prefeito Joaquim da Silva Mafra, em Guaratuba" loading="eager" onError={e=>{e.currentTarget.style.display='none';e.currentTarget.parentElement.classList.add('school-photo--fallback')}}/>
          <figcaption>Um pedacinho da nossa escola <span>Foto: Rádio Litorânea · 2024</span></figcaption>
        </figure>
        <div className="auth-hero"><span className="eyebrow">UM ESPAÇO DE LEITURA FEITO PARA NÓS</span><h1>Nossa escola.<br/><em>Mil histórias.</em></h1><p>Encontre novas leituras, descubra clássicos brasileiros e acompanhe os livros da biblioteca do Joaquim Mafra.</p>
          <div className="auth-points"><span><BookOpen size={16}/> Leitura digital</span><span><LibraryBig size={16}/> Acervo escolar</span><span><BookmarkCheck size={16}/> Empréstimos</span></div>
        </div>
      </div>
      <div className="auth-school-footer"><span><MapPin size={16}/> Rua José Nicolau Abagge, 1500 · Cohapar</span><span><Mail size={16}/> grujoaquimmafra@seed.pr.gov.br</span><small>Projeto digital da biblioteca · identidade gráfica própria, não oficial.</small></div>
    </aside>
    <main className="auth-right">
      <div className="auth-right-inner">
        <div className="auth-right-label"><span className="auth-right-dot"/> PORTAL DE LEITURA DO JOAQUIM MAFRA</div>
        <section className="auth-card">
          <span className="eyebrow">{register?'PRIMEIRO ACESSO':'ÁREA DO ALUNO E DA BIBLIOTECA'}</span>
          <h2>{register?'Crie sua conta':'Que bom te ver por aqui.'}</h2>
          <p>{register?'Cadastre-se com e-mail e senha para explorar e solicitar os livros da biblioteca.':'Entre com seu e-mail e sua senha. Simples assim.'}</p>
          <form onSubmit={submit} className="form-stack">
            {register&&<><Field label="Nome completo"><input value={name} autoComplete="name" onChange={e=>setName(e.target.value)} minLength={3} placeholder="Como você se chama?" required/></Field><Field label="Turma"><input value={classroom} onChange={e=>setClassroom(e.target.value)} minLength={2} placeholder="Ex.: 1º IA" required/></Field></>}
            <Field label="E-mail"><input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" placeholder="voce@exemplo.com" required/></Field>
            <Field label="Senha"><input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete={register?'new-password':'current-password'} minLength={8} placeholder={register?'Crie uma senha com 8 caracteres':'Digite sua senha'} required/></Field>
            {error&&<p role="alert" className="alert alert--error"><AlertTriangle size={17}/>{error}</p>}
            {msg&&<p role="status" className="alert alert--ok"><CheckCircle2 size={17}/>{msg}</p>}
            <button className="btn btn--primary btn--wide auth-submit" disabled={loading} type="submit">{loading?<LoaderCircle className="spin" size={18}/>:<LockKeyhole size={17}/>} {register?'Criar minha conta':'Entrar na biblioteca'} <ArrowRight size={17}/></button>
          </form>
          <div className="auth-links"><button className="link-btn" type="button" onClick={()=>{setRegister(v=>!v);setPassword('');setError('');setMsg('')}}>{register?'Já tenho conta · Entrar':'Ainda não tenho conta · Cadastrar'}</button>{!register&&<button className="link-btn" type="button" disabled={loading} onClick={reset}>Esqueci a senha</button>}</div>
          <p className="privacy-note">Bibliotecários recebem permissões específicas, autorizadas pela administração. O cadastro de aluno não comprova matrícula na escola.</p>
        </section>
        <section className="auth-read-promo" aria-label="Conheça os livros digitais">
          <div className="auth-promo-head"><div><span className="eyebrow">NÃO PRECISA DE LOGIN PARA LER</span><strong>Sua próxima leitura está aqui</strong></div><button type="button" className="auth-promo-link" onClick={()=>setPreviewOpen(true)}>Ver livros <ArrowRight size={16}/></button></div>
          <div className="auth-promo-books">{PUBLIC_READINGS.slice(0,3).map((b,i)=><button type="button" className={'auth-promo-book auth-promo-book--'+i} key={b.id} onClick={()=>setPreviewOpen(true)}><BookOpen size={19}/><span>{b.title}</span></button>)}</div>
        </section>
      </div>
    </main>
  </div>
}
function SetupScreen(){return <SetupGuide/>}

function ResetPasswordScreen({onDone}) {
  const [password,setPassword]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false)
  async function submit(e) {
    e.preventDefault();setBusy(true);setError('')
    try {must(await supabase.auth.updateUser({password}));onDone()}
    catch(e){setError(getErr(e))}finally{setBusy(false)}
  }
  return <div className="auth-right" style={{minHeight:'100vh'}}><form className="auth-card form-stack" onSubmit={submit}><Brand/><h2>Definir nova senha</h2><p>Crie sua nova senha para concluir a recuperação da conta.</p><Field label="Nova senha"><input type="password" minLength={8} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} required/></Field>{error&&<p className="alert alert--error">{error}</p>}<button className="btn btn--primary" disabled={busy}>Salvar nova senha</button></form></div>
}
function App() {
  const [session,setSession]=useState(undefined), [recovery,setRecovery]=useState(false), [profile,setProfile]=useState(null), [data,setData]=useState(initial), [loading,setLoading]=useState(false), [busy,setBusy]=useState(false), [error,setError]=useState(''), [toast,setToast]=useState(''), [tab,setTab]=useState('inicio'), [selected,setSelected]=useState(null), [query,setQuery]=useState(''), [authorQuery,setAuthorQuery]=useState(''), [genre,setGenre]=useState('Todos'), [availabilityFilter,setAvailabilityFilter]=useState('todos'), [sortBy,setSortBy]=useState('favoritos'), [modal,setModal]=useState(''), [editForm,setEditForm]=useState({})
  const [digitalRecommendations,setDigitalRecommendations]=useState([])
  const activeRequestRef=useRef(0)
  const authenticatedUserRef=useRef(null)
  useEffect(()=>{
    if(!configured)return
    let mounted=true
    supabase.auth.getSession().then(({data,error})=>{
      if(!mounted)return
      if(error)throw error
      setSession(data.session)
    }).catch(e=>{if(mounted){setSession(null);setError(getErr(e))}})
    const {data:{subscription}}=supabase.auth.onAuthStateChange((event,nextSession)=>{
      const nextId=nextSession?.user?.id||null
      if(authenticatedUserRef.current!==nextId){
        authenticatedUserRef.current=nextId
        activeRequestRef.current++
        setProfile(null)
        setData(initial)
        setDigitalRecommendations([])
        setTab('inicio')
        setModal('')
        setSelected(null)
        setError('')
      }
      if(event==='PASSWORD_RECOVERY')setRecovery(true)
      setSession(nextSession)
    })
    return ()=>{mounted=false;subscription.unsubscribe()}
  },[])
  const load = useCallback(async(userId)=>{
    const requestId=++activeRequestRef.current
    setLoading(true);setError('')
    try{
      must(await supabase.rpc('claim_staff_invite'))
      const p=must(await supabase.from('profiles').select('*').eq('id',userId).single())
      const staff=isStaff(p)
      if(!staff)must(await supabase.rpc('sync_due_notifications'))
      const results=await Promise.all([
        supabase.from('books').select('*').order('created_at',{ascending:false}),
        supabase.from('book_copies').select('id,book_id,code').order('created_at'),
        supabase.from('book_inventory').select('book_id,total,free'),
        staff ? Promise.resolve({data:[]}) : supabase.from('favorites').select('book_id,created_at').order('created_at',{ascending:false}),
        supabase.rpc('popular_books',{p_limit:8}),
        supabase.from('holds').select('*').order('requested_at',{ascending:false}),
        staff ? Promise.resolve({data:[]}) : supabase.rpc('my_hold_queue'),
        supabase.from('loans').select('*').order('approved_at',{ascending:false}),
        supabase.from('loan_events').select('id,loan_id,actor_id,event_type,condition,notes,created_at').order('created_at',{ascending:true}),
        supabase.from('renewal_requests').select('*').order('created_at',{ascending:false}),
        supabase.from('reviews').select('*').order('created_at',{ascending:false}),
        supabase.from('notifications').select('*').order('created_at',{ascending:false}),
        supabase.from('library_settings').select('*').eq('id',true).single(),
        staff ? supabase.from('profiles').select('id,full_name,email,classroom,role').order('full_name') : Promise.resolve({data:[]}),
        isAdmin(p) ? supabase.from('staff_invites').select('*').order('created_at',{ascending:false}) : Promise.resolve({data:[]})
      ])
      const keys=['books','copies','inventory','favorites','popular','holds','queue','loans','events','renewals','reviews','notifications','settings','people','invites']
      results.forEach((r,i)=>{if(r.error)throw new Error(keys[i]+': '+r.error.message)})
      const digital=await supabase.from('digital_reading_recommendations').select('id,title,author,note,genre,published_year,synopsis,access_url,platform').eq('is_active',true).order('id')
      if(digital.error)throw digital.error
      if(requestId===activeRequestRef.current){
        setDigitalRecommendations(digital.data||[])
        setProfile(p)
        setData(Object.fromEntries(results.map((r,i)=>[keys[i],r.data])))
      }
    }catch(e){if(requestId===activeRequestRef.current)setError(getErr(e))}
    finally{if(requestId===activeRequestRef.current)setLoading(false)}
  },[])
  useEffect(()=>{if(session?.user?.id)load(session.user.id)},[session?.user?.id,load])
  // Atualiza avisos e disponibilidade enquanto a página estiver em uso; também ao voltar à aba.
  useEffect(()=>{
    const uid=session?.user?.id
    if(!uid||busy)return
    const refresh=()=>{if(document.visibilityState==='visible')load(uid)}
    const timer=window.setInterval(refresh,60000)
    document.addEventListener('visibilitychange',refresh)
    return ()=>{clearInterval(timer);document.removeEventListener('visibilitychange',refresh)}
  },[session?.user?.id,load,busy])
  const reload=()=>session?.user?.id&&load(session.user.id)
  async function action(work,success='Alteração salva com sucesso!'){
    if(busy)return false;setBusy(true);setError('')
    try{const result=await work();setToast(typeof success==='function'?success(result):success);await reload();setTimeout(()=>setToast(''),4000);return true}catch(e){setError(getErr(e));return false}finally{setBusy(false)}
  }
  const queueByHold=Object.fromEntries(data.queue.map(item=>[item.hold_id,item]))
  const findBook=id=>data.books.find(b=>b.id===id)
  const findUser=id=>data.people.find(p=>p.id===id)
  const activeLoans=data.loans.filter(l=>l.status==='active')
  const overdueLoans=activeLoans.filter(l=>l.picked_up_at&&days(l.due_at)<0)
  const myPending=data.holds.filter(h=>h.status==='pending')
  const latestGenre=data.loans.map(l=>findBook(l.book_id)?.genre).find(Boolean)
  const recommended=data.books.filter(b=>b.genre===latestGenre && !data.loans.some(l=>l.book_id===b.id)).slice(0,4)
  const favoriteIds=new Set(data.favorites.map(f=>f.book_id))
  const favoriteBooks=data.favorites.map(f=>data.books.find(b=>b.id===f.book_id)).filter(Boolean)
  const popularBooks=data.popular.map(item=>data.books.find(b=>b.id===item.book_id)).filter(Boolean)
  const popularCounts=Object.fromEntries(data.popular.map(item=>[item.book_id,Number(item.loan_count)]))
  const availability=useMemo(()=>Object.fromEntries(data.inventory.map(row=>[row.book_id,{total:row.total,free:row.free}])),[data.inventory])
  const genres=['Todos',...new Set(data.books.map(b=>b.genre).filter(Boolean))]
  const filtered=data.books.filter(b=>(genre==='Todos'||b.genre===genre)&&normalizeSearch(b.author).includes(normalizeSearch(authorQuery.trim()))&&normalizeSearch([b.title,b.author,b.genre,b.synopsis].filter(Boolean).join(' ')).includes(normalizeSearch(query.trim()))&&(availabilityFilter==='todos'||(availabilityFilter==='disponivel'?availability[b.id]?.free>0:availability[b.id]?.free===0)))
  const sortedFiltered=[...filtered].sort((a,b)=>{
    const collator=new Intl.Collator('pt-BR',{sensitivity:'base'})
    if(sortBy==='titulo')return collator.compare(a.title,b.title)
    if(sortBy==='autor')return collator.compare(a.author,b.author)||collator.compare(a.title,b.title)
    if(sortBy==='ano')return (b.published_year||0)-(a.published_year||0)||collator.compare(a.title,b.title)
    if(sortBy==='popular')return (popularCounts[b.id]||0)-(popularCounts[a.id]||0)||collator.compare(a.title,b.title)
    if(sortBy==='novos')return new Date(b.created_at)-new Date(a.created_at)
    if(sortBy==='favoritos'){
      const diff=Number(favoriteIds.has(b.id))-Number(favoriteIds.has(a.id))
      return diff||collator.compare(a.title,b.title)
    }
    return 0
  })
  function submitRequest(book){action(async()=>must(await supabase.rpc('request_book',{p_book_id:book.id})),'Solicitação enviada para o bibliotecário.')}
  function submitRenewal(loan){action(async()=>must(await supabase.rpc('request_renewal',{p_loan_id:loan.id})),'Pedido de renovação enviado.')}
  function toggleFavorite(book) {
    if (!profile || isStaff(profile) || busy) return
    const saved = favoriteIds.has(book.id)
    action(async()=>{
      if(saved) must(await supabase.from('favorites').delete().eq('reader_id',profile.id).eq('book_id',book.id))
      else must(await supabase.from('favorites').insert({reader_id:profile.id,book_id:book.id}))
    },saved?'Livro removido dos favoritos.':'Livro salvo nos favoritos.')
  }
  const tabs=isStaff(profile)?[['inicio','Visão geral',LayoutDashboard],['catalogo','Acervo',LibraryBig],['digital','Ler online',BookOpen],['pedidos','Solicitações',BookmarkCheck],['emprestimos','Empréstimos',BookOpen],['leitores','Alunos',Users],['relatorios','Relatórios',BarChart3],['ajustes','Configurações',Settings]]:[['inicio','Início',LayoutDashboard],['catalogo','Catálogo',LibraryBig],['digital','Ler online',BookOpen],['favoritos','Favoritos',Heart],['meus','Meus livros',BookMarked],['avisos','Avisos',Bell],['perfil','Meu perfil',UserCircle2]]
  if(!configured)return <SetupScreen/>
  if(session===undefined)return <div className="page-loading"><LoaderCircle className="spin"/><span>Carregando Biblioteca Joaquim...</span></div>
  if(!session)return <AuthScreen/>
  if(recovery)return <ResetPasswordScreen onDone={()=>setRecovery(false)}/>
  if(!profile)return error
    ? <div className="setup setup-error"><Brand/><div className="setup-card"><AlertTriangle size={33}/><h1>Banco ainda não configurado</h1><p>O login foi reconhecido, mas o aplicativo não conseguiu acessar as tabelas ou as permissões do Supabase. Confira se as migrações SQL foram aplicadas na ordem correta (incluindo a 60000).</p><p className="alert alert--error">{error}</p><a href="https://github.com/luan-henrique-21-29/biblioteca-escola#readme" target="_blank" rel="noreferrer" className="btn btn--outline">Ver instruções do banco</a><button onClick={reload} className="btn btn--primary">Tentar novamente</button><button onClick={()=>supabase.auth.signOut()} className="btn btn--outline">Sair da conta</button></div></div>
    : <div className="page-loading"><LoaderCircle className="spin"/><span>Preparando sua biblioteca...</span></div>
  // Para contas antigas sem turma, solicitamos apenas os dados escolares necessários.
  if(!isStaff(profile) && !profile.classroom?.trim())return <div className="profile-onboarding">
    <header className="onboarding-header"><Brand compact/><button className="btn btn--outline" onClick={()=>supabase.auth.signOut()}><LogOut size={16}/> Sair</button></header>
    <div className="onboarding-card"><span className="eyebrow">SÓ MAIS UM PASSO</span><h1>Complete seu cadastro escolar</h1>
    <p>Seu login foi realizado. Antes de usar os empréstimos, informe seu nome e turma. Nenhum CGM é exigido.</p>
    <form className="form-stack" onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);action(async()=>must(await supabase.from('profiles').update({full_name:String(f.get('name')).trim(),classroom:String(f.get('classroom')).trim()}).eq('id',profile.id)),'Cadastro concluído.')}}>
      <Field label="Nome completo"><input name="name" defaultValue={profile.full_name} minLength={3} maxLength={120} required/></Field>
      <Field label="Turma"><input name="classroom" defaultValue={profile.classroom||""} placeholder="Ex.: 1º IA" minLength={2} maxLength={30} required/></Field>
      <p className="auth-hint">Para entrar na sua conta, use o e-mail informado no cadastro.</p>
      {error&&<div className="alert alert--error">{error}</div>}
      <button className="btn btn--primary" disabled={busy} type="submit"><Check size={17}/> Salvar e entrar na biblioteca</button>
    </form></div></div>
  const openBook=b=>setSelected(b)
  const btn=(label,fn,Icon=ArrowRight,outline=false,disabled=false)=><button disabled={busy||disabled} className={'btn '+(outline?'btn--outline':'btn--primary')} onClick={fn}><Icon size={16}/>{label}</button>
  const listLoans=(list,staff=false)=>list.length?<div className="table-wrap">
    <table><thead><tr><th>Livro</th>{staff&&<th>Aluno</th>}<th>Situação</th><th>Devolução</th><th>Ações</th></tr></thead>
    <tbody>{list.map(l=>{
      const picked=Boolean(l.picked_up_at)
      const returned=l.status==='returned'
      const late=!returned&&picked&&days(l.due_at)<0
      return <tr key={l.id}>
        <td><strong>{findBook(l.book_id)?.title||'Livro removido'}</strong><small>{findBook(l.book_id)?.author}{staff?' · Exemplar '+(data.copies.find(c=>c.id===l.copy_id)?.code||'—'):''}</small></td>
        {staff&&<td>{findUser(l.reader_id)?.full_name||'Aluno'}<small>{findUser(l.reader_id)?.classroom}</small></td>}
        <td><Pill tone={returned?'neutral':late?'red':!picked?'orange':'blue'}>{returned?'Devolvido':!picked?'Aguardando retirada':late?'Atrasado':'Emprestado'}</Pill></td>
        <td>{!picked?'A definir na retirada':dateText(l.due_at)}
          {!picked&&!returned&&<small>Sem prazo automático para retirar</small>}
          {!returned&&picked&&<small>{late?Math.abs(days(l.due_at))+' dia(s) de atraso':days(l.due_at)+' dia(s) restantes'}</small>}
        </td>
        <td><div className="loan-actions">
          {staff&&!returned&&!picked&&btn('Confirmar retirada',()=>{setEditForm(l);setModal('pickup')},Check,true)}
          {staff&&!returned&&picked&&btn('Registrar devolução',()=>{setEditForm(l);setModal('return')},Check,true)}
          {!staff&&!returned&&picked&&btn('Pedir renovação',()=>submitRenewal(l),RefreshCw,true,data.renewals.some(r=>r.loan_id===l.id&&r.status==='pending'))}
          {btn('Comprovante',()=>{setEditForm(l);setModal('receipt')},BookMarked,true)}
        </div></td>
      </tr>
    })}</tbody></table>
  </div>:<Empty icon={BookOpen} title="Nenhum empréstimo ainda" subtitle="Os empréstimos e comprovantes aparecerão aqui."/>
  const bookGrid=(books,showPopular=false)=><div className="book-grid">{books.map(book=><div className="book-tile" key={book.id}>
    <button type="button" className="book-card" onClick={()=>openBook(book)}>
      <Cover book={book}/>
      <span className="book-meta">{book.genre||'Literatura'}</span>
      <strong>{book.title}</strong><small>{book.author}</small>
      {showPopular&&<span className="borrow-count"><Trophy size={13}/> {popularCounts[book.id]} {popularCounts[book.id]===1?'empréstimo':'empréstimos'}</span>}
      <span className={'availability '+(availability[book.id]?.free?'availability--yes':'availability--no')}>{!availability[book.id]?.total?'Sem exemplares cadastrados':availability[book.id]?.free?availability[book.id].free+' disponível(is)':'Todos emprestados · fila de espera'}</span>
      <span className="book-link">Ver detalhes <ArrowRight size={14}/></span>
    </button>
    {!isStaff(profile)&&<button type="button"
      className={'favorite-toggle '+(favoriteIds.has(book.id)?'favorite-toggle--active':'')}
      onClick={()=>toggleFavorite(book)}
      disabled={busy}
      aria-label={(favoriteIds.has(book.id)?'Remover dos favoritos: ':'Adicionar aos favoritos: ')+book.title}
      aria-pressed={favoriteIds.has(book.id)}
      title={favoriteIds.has(book.id)?'Remover dos favoritos':'Adicionar aos favoritos'}>
      <Heart size={18} fill={favoriteIds.has(book.id)?'currentColor':'none'}/>
    </button>}
  </div>)}</div>
  const catalogue=()=><>
    <div className="advanced-search">
      <label className="field"><span>Pesquisar livros</span><div className="search-field"><Search size={19}/><input aria-label="Pesquisar livros" placeholder="Título, assunto ou palavra-chave..." value={query} onChange={e=>setQuery(e.target.value)}/></div></label>
      <div className="advanced-filter-grid">
        <label className="field"><span>Autor</span><input aria-label="Filtrar por autor" value={authorQuery} onChange={e=>setAuthorQuery(e.target.value)} placeholder="Digite o nome do autor..."/></label>
        <label className="field"><span>Gênero</span><select aria-label="Filtrar por gênero" value={genre} onChange={e=>setGenre(e.target.value)}>{genres.map(g=><option key={g}>{g}</option>)}</select></label>
        <label className="field"><span>Disponibilidade</span><select aria-label="Filtrar por disponibilidade" value={availabilityFilter} onChange={e=>setAvailabilityFilter(e.target.value)}><option value="todos">Todos os livros</option><option value="disponivel">Disponíveis</option><option value="indisponivel">Indisponíveis</option></select></label>
        <label className="field"><span>Ordenar por</span><select aria-label="Ordenar catálogo" value={sortBy} onChange={e=>setSortBy(e.target.value)}>
          <option value="favoritos">Meus favoritos primeiro</option>
          <option value="titulo">Título (A–Z)</option>
          <option value="autor">Autor (A–Z)</option>
          <option value="ano">Ano de publicação (mais recente)</option>
          <option value="popular">Mais emprestados</option>
          <option value="novos">Adicionados recentemente</option>
        </select></label>
        <button className="btn btn--outline advanced-clear" type="button" onClick={()=>{setQuery('');setAuthorQuery('');setGenre('Todos');setAvailabilityFilter('todos')}} disabled={!query&&!authorQuery&&genre==='Todos'&&availabilityFilter==='todos'}><X size={16}/> Limpar filtros</button>
      </div>
    </div>
    <div className="catalog-count">{filtered.length} livro(s) encontrado(s) · combine os filtros para refinar sua busca</div>
    {filtered.length?bookGrid(sortedFiltered):<Empty icon={Search} title="Nenhum livro encontrado" subtitle="Experimente limpar os filtros ou pesquisar outro autor, gênero ou título."/>}
  </>
  return <div className="app-shell"><header className="topbar"><div className="header-main"><Brand compact/><div className="header-user"><span className="user-avatar">{(profile.full_name||profile.email||'A').charAt(0).toUpperCase()}</span><span><strong>{profile.full_name||'Leitor'}</strong><small>{isStaff(profile)?(isAdmin(profile)?'Administrador':'Bibliotecário'):profile.classroom||'Aluno'}</small></span><button className="icon-btn" onClick={()=>supabase.auth.signOut()} aria-label="Sair" title="Sair da conta"><LogOut size={19}/></button></div></div><nav aria-label="Navegação principal" className="tabs">{tabs.map(([id,label,Icon])=><button key={id} className={'tab '+(tab===id?'tab--active':'')} onClick={()=>{setTab(id);setQuery('')}}><Icon size={17}/>{label}{id==='avisos'&&data.notifications.filter(n=>!n.read_at).length>0&&<i>{data.notifications.filter(n=>!n.read_at).length}</i>}</button>)}</nav></header>
  <main className="main-container">{error&&<div className="alert alert--error"><AlertTriangle size={18}/><span>{error}</span><button aria-label="Dispensar erro" onClick={()=>setError('')}><X size={16}/></button></div>}{toast&&<div className="alert alert--ok"><CheckCircle2 size={18}/>{toast}</div>}{loading&&<p className="loading-inline"><LoaderCircle className="spin" size={16}/> Atualizando dados...</p>}
  {tab==='inicio'&&(isStaff(profile)?<><div className="welcome"><div><span className="eyebrow">PAINEL DA BIBLIOTECA</span><h1>Bom trabalho, {profile.full_name?.split(' ')[0]||'bibliotecário'}! <span>👋</span></h1><p>Acompanhe o acervo e as solicitações da escola em tempo real.</p></div>{btn('Cadastrar livro',()=>setModal('book'),Plus)}</div><div className="stats-grid"><Stat label="Livros no acervo" value={data.copies.length} icon={LibraryBig}/><Stat label="Empréstimos ativos" value={activeLoans.length} icon={BookOpen} tone="violet"/><Stat label="Aguardando aprovação" value={myPending.length} icon={Clock3} tone="orange"/><Stat label="Atrasados" value={overdueLoans.length} icon={AlertTriangle} tone="red"/></div><div className="two-col"><section className="surface"><PanelHead eyebrow="FILA DE ATENDIMENTO" title="Solicitações recentes" action={<button className="link-btn" onClick={()=>setTab('pedidos')}>Ver todas <ArrowRight size={15}/></button>}/>{myPending.length?myPending.slice(0,5).map(h=><div className="activity-row" key={h.id}><span className="activity-symbol"><BookOpen size={19}/></span><div><strong>{findBook(h.book_id)?.title}</strong><small>{findUser(h.reader_id)?.full_name||'Aluno'} · {dateText(h.requested_at)}</small></div><Pill tone="orange">Pendente</Pill></div>):<Empty icon={CheckCircle2} title="Tudo em dia" subtitle="Nenhuma solicitação aguardando aprovação."/>}</section><section className="surface"><PanelHead eyebrow="ATENÇÃO" title="Devoluções em atraso" action={<button className="link-btn" onClick={()=>setTab('emprestimos')}>Ver empréstimos <ArrowRight size={15}/></button>}/>{overdueLoans.length?overdueLoans.slice(0,5).map(l=><div className="activity-row" key={l.id}><span className="activity-symbol activity-symbol--red"><AlertTriangle size={19}/></span><div><strong>{findBook(l.book_id)?.title}</strong><small>{findUser(l.reader_id)?.full_name||'Aluno'}</small></div><Pill tone="red">{Math.abs(days(l.due_at))} dia(s)</Pill></div>):<Empty icon={CheckCircle2} title="Nenhum atraso" subtitle="Os empréstimos estão em dia."/>}</section></div><StaffDaily loans={data.loans} holds={data.holds} books={data.books} people={data.people} onNavigate={setTab}/></>:<><div className="welcome welcome--reader"><div><span className="eyebrow">BIBLIOTECA DO JOAQUIM MAFRA</span><h1>Olá, {profile.full_name?.split(' ')[0]||'leitor'}! <span>👋</span></h1><p>Descubra sua próxima leitura e acompanhe seus empréstimos.</p></div>{btn('Explorar livros',()=>setTab('catalogo'),ArrowRight)}</div><div className="reader-home-reading"><div><span className="eyebrow">ESTANTE DIGITAL</span><strong>Quer começar a ler agora?</strong><p>Obras de domínio público com leitura gratuita e acesso ao Leia Paraná.</p></div><button className="btn btn--primary" type="button" onClick={()=>setTab('digital')}>Ver livros digitais <ArrowRight size={16}/></button></div><ReaderHighlights books={data.books} notifications={data.notifications} onSelect={openBook} onNotices={()=>setTab('avisos')}/>{overdueLoans.length>0&&<div className="notice"><AlertTriangle size={22}/><div><strong>Você tem {overdueLoans.length} livro(s) atrasado(s).</strong><p>Novas solicitações ficam bloqueadas até regularizar as devoluções com a biblioteca.</p></div></div>}<div className="stats-grid"><Stat label="Livros comigo" value={activeLoans.length} icon={BookOpen}/><Stat label="Aguardando aprovação" value={myPending.length} icon={Clock3} tone="orange"/><Stat label="Leituras concluídas" value={data.loans.filter(l=>l.status==='returned').length} icon={CheckCircle2} tone="violet"/><Stat label="Meus favoritos" value={data.favorites.length} icon={Heart}/></div>
  <section className="popular-section">
    <PanelHead eyebrow="EM ALTA NA ESCOLA" title="Livros mais emprestados" subtitle="Os títulos que mais circularam entre os leitores da biblioteca." action={<button className="link-btn" onClick={()=>setTab('catalogo')}>Explorar catálogo <ArrowRight size={15}/></button>}/>
    {popularBooks.length?bookGrid(popularBooks.slice(0,4),true):<div className="surface"><Empty icon={Trophy} title="Ainda não há empréstimos registrados" subtitle="Quando os primeiros livros forem emprestados, os mais populares aparecerão aqui."/></div>}
  </section>
  <div className="two-col"><section className="surface"><PanelHead eyebrow="MEUS EMPRÉSTIMOS" title="Próximas devoluções" action={<button className="link-btn" onClick={()=>setTab('meus')}>Ver meus livros <ArrowRight size={15}/></button>}/>{activeLoans.length?activeLoans.slice().sort((a,b)=>new Date(a.due_at)-new Date(b.due_at)).map(l=><div className="activity-row" key={l.id}><span className="activity-symbol"><CalendarDays size={19}/></span><div><strong>{findBook(l.book_id)?.title}</strong><small>Devolução: {dateText(l.due_at)}</small></div><Pill tone={days(l.due_at)<0?'red':days(l.due_at)<=3?'orange':'blue'}>{days(l.due_at)<0?'Atrasado':days(l.due_at)+' dias'}</Pill></div>):<Empty title="Nenhum livro emprestado" subtitle="Comece explorando o catálogo da biblioteca."/>}</section><section className="surface"><PanelHead eyebrow="PARA VOCÊ" title="Recomendações" subtitle={latestGenre?'Com base nas suas leituras de '+latestGenre:'Baseadas nos gêneros que você lê'}/>{recommended.length?recommended.map(b=><button className="recommend" key={b.id} onClick={()=>openBook(b)}><span className="recommend-icon"><BookOpen size={22}/></span><span><strong>{b.title}</strong><small>{b.author}</small></span><ArrowRight size={17}/></button>):<Empty icon={BookMarked} title="Suas próximas descobertas" subtitle="Quando você pegar livros, indicaremos títulos do mesmo gênero."/>}</section></div></>)}
  {tab==='catalogo'&&<section className="page-section"><PanelHead eyebrow="EXPLORE A BIBLIOTECA" title="Acervo físico da biblioteca" subtitle="Consulte os exemplares registrados pela escola. Para ler clássicos gratuitamente, visite Ler online." action={isStaff(profile)?<div className="row-actions">{btn('Importar planilha',()=>setModal('import'),Upload,true)}{btn('Imprimir etiquetas',()=>setModal('labels'),BookMarked,true)}{btn('Novo livro',()=>setModal('book'),Plus)}</div>:null}/>{catalogue()}</section>}
  {tab==='digital'&&<section className="page-section"><ReadingShelf books={digitalRecommendations} physicalBooks={data.books} inventory={data.inventory} onChoosePhysical={book=>{setTab("catalogo");setSelected(book)}}/></section>}
    {tab==='favoritos'&&!isStaff(profile)&&<section className="page-section">
    <PanelHead eyebrow="MINHA ESTANTE" title="Livros favoritos" subtitle="Seus livros salvos para ler depois." action={btn('Explorar catálogo',()=>setTab('catalogo'),Search,true)}/>
    {favoriteBooks.length?bookGrid(favoriteBooks):<div className="surface"><Empty icon={Heart} title="Você ainda não tem favoritos" subtitle="Toque no coração de um livro do catálogo para guardá-lo aqui."/></div>}
  </section>}
  {tab==='meus'&&!isStaff(profile)&&<section className="page-section"><PanelHead eyebrow="ACOMPANHAMENTO" title="Meus empréstimos" subtitle={'Limite atual: '+data.settings.max_active_loans+' empréstimo(s). Prazo: '+data.settings.loan_days+' dias.'}/>{listLoans(data.loans)}<div className="surface space-top"><PanelHead eyebrow="SOLICITAÇÕES" title="Reservas e fila de espera" action={btn('Atualizar fila',reload,RefreshCw,true)}/>{data.holds.length?data.holds.map(h=><div className="activity-row" key={h.id}><span className="activity-symbol"><BookmarkCheck size={19}/></span><div><strong>{findBook(h.book_id)?.title}</strong><small>Solicitado em {dateText(h.requested_at)}</small>{h.status==='pending'&&queueByHold[h.id]&&<span className="queue-detail"><strong>Posição {queueByHold[h.id].position} de {queueByHold[h.id].total_waiting} na fila</strong><small>{queueByHold[h.id].position<=queueByHold[h.id].available_copies?'Exemplar disponível. Aguarde a aprovação do bibliotecário.':'Aguardando liberação de exemplar.'}</small></span>}</div><Pill tone={h.status==='pending'?'orange':'neutral'}>{statusLabel[h.status]||h.status}</Pill>{h.status==='pending'&&btn('Cancelar',()=>action(async()=>must(await supabase.rpc('cancel_hold',{p_hold_id:h.id})),'Solicitação cancelada.'),X,true)}</div>):<Empty icon={BookmarkCheck} title="Sem solicitações" subtitle="Você ainda não solicitou nenhum livro."/>}</div><div className="surface space-top"><PanelHead eyebrow="RENOVAÇÕES" title="Pedidos de renovação"/>{data.renewals.length?data.renewals.map(r=><div className="activity-row" key={r.id}><span className="activity-symbol"><RefreshCw size={19}/></span><div><strong>{findBook(data.loans.find(l=>l.id===r.loan_id)?.book_id)?.title||'Livro'}</strong><small>{dateText(r.created_at)}</small></div><Pill tone={r.status==='pending'?'orange':'neutral'}>{statusLabel[r.status]||r.status}</Pill></div>):<Empty icon={RefreshCw} title="Nenhum pedido" subtitle="Você pode solicitar renovação em um empréstimo ativo."/>}</div></section>}
  {tab==='avisos'&&!isStaff(profile)&&<section className="page-section"><PanelHead eyebrow="SUA CAIXA DE ENTRADA" title="Avisos da biblioteca" subtitle="Notificações e lembretes sobre seus empréstimos. Atualize para conferir novas liberações." action={<div className="row-actions">{btn('Atualizar avisos',reload,RefreshCw,true)}{data.notifications.some(n=>!n.read_at)?btn('Marcar lidos',()=>action(async()=>{for(const n of data.notifications.filter(n=>!n.read_at))must(await supabase.from('notifications').update({read_at:new Date().toISOString()}).eq('id',n.id))},'Avisos marcados como lidos.'),Check,true):null}</div>}/>{activeLoans.filter(l=>days(l.due_at)<=3).map(l=><div className="notice" key={l.id}><AlertTriangle size={20}/><div><strong>{days(l.due_at)<0?'Devolução em atraso':'Devolução se aproximando'} — {findBook(l.book_id)?.title}</strong><p>Data prevista: {dateText(l.due_at)}. {days(l.due_at)<0?'Procure a biblioteca para regularizar.':'Programe sua devolução.'}</p></div></div>)}<div className="surface">{data.notifications.length?data.notifications.map(n=><div className="activity-row" key={n.id}><span className="activity-symbol"><Bell size={19}/></span><div><strong>{n.title}</strong><small>{n.body} · {fullDate(n.created_at)}</small></div>{!n.read_at&&<Pill tone="blue">Novo</Pill>}</div>):<Empty icon={Bell} title="Nenhum aviso" subtitle="Suas notificações aparecerão aqui."/>}</div></section>}
  {tab==='perfil'&&!isStaff(profile)&&<section className="page-section page-narrow"><PanelHead eyebrow="MINHA CONTA" title="Meu perfil" subtitle="Seus dados para uso da biblioteca."/><form className="surface form-stack" onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);action(async()=>must(await supabase.from('profiles').update({full_name:String(f.get('full_name')).trim(),classroom:String(f.get('classroom')).trim()}).eq('id',profile.id)),'Perfil atualizado.')}}><Field label="Nome completo"><input name="full_name" defaultValue={profile.full_name} required/></Field><Field label="Turma"><input name="classroom" defaultValue={profile.classroom||""} required/></Field><button type="submit" disabled={busy} className="btn btn--primary">Salvar alterações</button></form></section>}
  {tab==='pedidos'&&isStaff(profile)&&<section className="page-section"><PanelHead eyebrow="EMPRÉSTIMOS E FILAS" title="Solicitações de livros" subtitle="Analise os pedidos por ordem de chegada. Se não houver exemplar livre, o aluno permanece na fila."/><div className="surface">{data.holds.filter(h=>h.status==='pending').length?data.holds.filter(h=>h.status==='pending').sort((a,b)=>new Date(a.requested_at)-new Date(b.requested_at)).map(h=><div className="approval-row" key={h.id}><div className="approval-info"><span className="activity-symbol"><BookOpen size={20}/></span><div><strong>{findBook(h.book_id)?.title}</strong><small>{findUser(h.reader_id)?.full_name||'Aluno'} · {findUser(h.reader_id)?.classroom||''} · {dateText(h.requested_at)}</small><span className="subtle">{availability[h.book_id]?.free||0} exemplar(es) livre(s)</span></div></div><div className="row-actions">{btn('Aprovar',()=>action(async()=>must(await supabase.rpc('approve_hold',{p_hold_id:h.id})),'Empréstimo aprovado.'),Check,false,!availability[h.book_id]?.free)}{btn('Recusar',()=>action(async()=>must(await supabase.rpc('reject_hold',{p_hold_id:h.id})),'Solicitação recusada.'),X,true)}</div></div>):<Empty icon={CheckCircle2} title="Nenhuma solicitação pendente" subtitle="Os novos pedidos de livros aparecerão aqui."/>}</div><div className="surface space-top"><PanelHead eyebrow="PEDIDOS" title="Renovações pendentes"/>{data.renewals.filter(r=>r.status==='pending').length?data.renewals.filter(r=>r.status==='pending').map(r=>{const l=data.loans.find(l=>l.id===r.loan_id);return <div className="approval-row" key={r.id}><div className="approval-info"><span className="activity-symbol"><RefreshCw size={19}/></span><div><strong>{findBook(l?.book_id)?.title}</strong><small>{findUser(l?.reader_id)?.full_name} · vencimento {dateText(l?.due_at)}</small></div></div><div className="row-actions">{btn('Aprovar',()=>action(async()=>must(await supabase.rpc('resolve_renewal',{p_request_id:r.id,p_approve:true})),'Renovação aprovada.'),Check)}{btn('Recusar',()=>action(async()=>must(await supabase.rpc('resolve_renewal',{p_request_id:r.id,p_approve:false})),'Renovação recusada.'),X,true)}</div></div>}):<Empty title="Sem renovações pendentes" subtitle="Não há pedidos de renovação para analisar."/>}</div></section>}
  {tab==='emprestimos'&&isStaff(profile)&&<section className="page-section"><PanelHead eyebrow="CIRCULAÇÃO" title="Controle de empréstimos" subtitle="Confirme a retirada física, registre devoluções e acompanhe prazos. Pedidos aprovados não expiram automaticamente."/>{listLoans(data.loans,true)}</section>}
  {tab==='leitores'&&isStaff(profile)&&<section className="page-section"><PanelHead eyebrow="COMUNIDADE ESCOLAR" title="Alunos cadastrados" subtitle="As contas são criadas com nome, e-mail e turma, sem CGM obrigatório."/><div className="table-wrap"><table><thead><tr><th>Nome</th><th>E-mail</th><th>Turma</th><th>Empréstimos ativos</th></tr></thead><tbody>{data.people.filter(p=>p.role==='reader').map(p=><tr key={p.id}><td><strong>{p.full_name}</strong></td><td>{p.email}</td><td>{p.classroom||'—'}</td><td>{data.loans.filter(l=>l.reader_id===p.id&&l.status==='active').length}</td></tr>)}</tbody></table></div></section>}
  {tab==='relatorios'&&isStaff(profile)&&<ReportsPanel loans={data.loans} books={data.books} people={data.people} copies={data.copies} listLoans={listLoans}/>} 
  {tab==='ajustes'&&isStaff(profile)&&<section className="page-section page-narrow"><PanelHead eyebrow="ADMINISTRAÇÃO" title="Configurações da biblioteca" subtitle="Defina as regras de empréstimo para todos os alunos."/><form className="surface form-stack" onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);action(async()=>must(await supabase.from('library_settings').update({max_active_loans:Number(f.get('limit')),loan_days:Number(f.get('days'))}).eq('id',true)),'Regras atualizadas.')}} key={data.settings.loan_days+'-'+data.settings.max_active_loans}><Field label="Máximo de livros ativos por aluno"><input type="number" min="1" max="20" name="limit" defaultValue={data.settings.max_active_loans} required/></Field><Field label="Prazo padrão de devolução (dias)"><input type="number" min="1" max="180" name="days" defaultValue={data.settings.loan_days} required/></Field><p className="helper-text">Novos empréstimos usarão o prazo vigente. Empréstimos antigos mantêm sua data.</p><button className="btn btn--primary" disabled={busy} type="submit">Salvar regras</button></form>{isAdmin(profile)&&<div className="surface space-top"><h3>Cadastro de bibliotecários</h3><p className="helper-text">Convide um endereço de e-mail. Depois que o funcionário criar uma conta e confirmar o e-mail, receberá permissão de bibliotecário automaticamente ao entrar.</p><form className="inline-form" onSubmit={e=>{e.preventDefault();const email=e.currentTarget.elements.namedItem('staff_email').value.trim().toLowerCase();action(async()=>must(await supabase.from('staff_invites').insert({email,role:'librarian'})),'Bibliotecário autorizado. Informe que ele deve criar uma conta usando este e-mail.')}}><input name="staff_email" type="email" aria-label="E-mail do funcionário" placeholder="bibliotecario@escola.pr.gov.br" required/><button type="submit" disabled={busy} className="btn btn--primary"><Plus size={16}/> Autorizar</button></form>{data.invites.map(v=><div className="activity-row" key={v.id}><span className="activity-symbol"><ShieldCheck size={19}/></span><div><strong>{v.email}</strong><small>{v.claimed_by?'Bibliotecário ativo':'Aguardando cadastro'}</small></div><button className="btn btn--outline" disabled={busy} onClick={()=>{if(window.confirm('Revogar o acesso de '+v.email+'? Se a pessoa já for bibliotecária, voltará a ter apenas acesso de aluno.'))action(async()=>must(await supabase.rpc('admin_revoke_librarian',{p_invite_id:v.id})),'Acesso revogado com sucesso.')}}><X size={16}/> Revogar</button></div>)}</div>}</section>}
  </main>
  <footer className="footer"><span>Biblioteca Joaquim · Colégio Estadual Prefeito Joaquim da Silva Mafra · Guaratuba/PR</span><span>Projeto de biblioteca escolar · identidade gráfica própria</span></footer>
  {selected&&<Modal title="Detalhes do livro" onClose={()=>setSelected(null)}><div className="book-detail"><Cover book={selected} large/><div><span className="eyebrow">{selected.genre||'LIVRO'}</span><h2>{selected.title}</h2><p className="muted">{selected.author} {selected.published_year?'· '+selected.published_year:''}</p><Pill tone={availability[selected.id]?.free?'blue':'orange'}>{!availability[selected.id]?.total?'Nenhum exemplar físico cadastrado':availability[selected.id]?.free?availability[selected.id]?.free+' exemplar(es) disponível(is)':'Todos emprestados — fila de espera'}</Pill><h3>Sinopse</h3><p>{selected.synopsis||'Sinopse ainda não cadastrada.'}</p><h3>Escolha o formato</h3><div className="book-sheet-choices physical-book-choices">{!isStaff(profile)&&<button type="button" className="book-format-option" disabled={!availability[selected.id]?.total||busy||data.holds.some(h=>h.book_id===selected.id&&h.status==='pending')||overdueLoans.length>0} onClick={()=>{submitRequest(selected);setSelected(null)}}><LibraryBig size={20}/><strong>{availability[selected.id]?.free?'Solicitar livro físico':'Entrar na fila do físico'}</strong><small>{!availability[selected.id]?.total?'Nenhum exemplar físico cadastrado':availability[selected.id]?.free?availability[selected.id]?.free+' disponível(is)':'Todos emprestados; há fila de espera'}</small></button>}<a className="book-format-option book-format-option--digital" href={LEIA_PARANA_URL} target="_blank" rel="noopener noreferrer"><BookOpen size={20}/><strong>{digitalRecommendations.some(b=>b.platform==='Leia Paraná'&&NORMALIZE_TITLE(b.title)===NORMALIZE_TITLE(selected.title))?'Ler no Leia Paraná':'Consultar no Leia Paraná'}</strong><small>Entre com @escola e procure a obra no Clube de Leitura; acesso não garantido</small></a></div>{!isStaff(profile)&&btn(favoriteIds.has(selected.id)?'Remover dos favoritos':'Salvar nos favoritos',()=>toggleFavorite(selected),Heart,true)}{isStaff(profile)&&btn(selected.featured?'Retirar destaque':'Destacar na página inicial',()=>action(async()=>must(await supabase.from('books').update({featured:!selected.featured}).eq('id',selected.id)),'Destaque atualizado.').then(ok=>{if(ok)setSelected(null)}),Star,true)}
{isStaff(profile)&&btn('Editar informações',()=>{setEditForm(selected);setModal('editbook');setSelected(null)},BookMarked,true)}{isStaff(profile)&&btn('Adicionar exemplar',()=>{setModal('copy');setEditForm({book_id:selected.id,code:''});setSelected(null)},Plus,true)}{isStaff(profile)&&<div className="copy-list"><strong>Códigos dos exemplares</strong><p>{data.copies.filter(c=>c.book_id===selected.id).map(c=>c.code).join(' · ')||'Nenhum exemplar cadastrado'}</p></div>}</div></div><div className="detail-section"><h3>Avaliações dos leitores</h3>{data.reviews.filter(r=>r.book_id===selected.id).length?data.reviews.filter(r=>r.book_id===selected.id).map(r=><div className="review" key={r.id}><div><strong>{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</strong><small>{dateText(r.created_at)}</small></div><p>{r.comment||'Avaliação sem comentário.'}</p></div>):<p className="muted">Este livro ainda não recebeu avaliações.</p>}{!isStaff(profile)&&data.loans.some(l=>l.book_id===selected.id)&&<form className="review-form" onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);action(async()=>must(await supabase.from('reviews').upsert({book_id:selected.id,reader_id:profile.id,rating:Number(f.get('rating')),comment:String(f.get('comment')||'').trim()},{onConflict:'book_id,reader_id'})),'Avaliação registrada.')}}><Field label="Sua nota"><select name="rating" defaultValue="5">{[5,4,3,2,1].map(i=><option value={i} key={i}>{i} estrela(s)</option>)}</select></Field><Field label="Comentário (opcional)"><textarea name="comment" maxLength={500} placeholder="O que achou deste livro?"/></Field><button className="btn btn--outline" disabled={busy}>Publicar avaliação</button></form>}</div><div className="detail-section"><h3>Livros relacionados</h3><div className="related">{data.books.filter(b=>b.id!==selected.id&&b.genre===selected.genre).slice(0,3).map(b=><button key={b.id} onClick={()=>setSelected(b)}><BookOpen size={18}/>{b.title}<ArrowRight size={15}/></button>)}{!data.books.some(b=>b.id!==selected.id&&b.genre===selected.genre)&&<p className="muted">Sem títulos do mesmo gênero por enquanto.</p>}</div></div></Modal>}
  {modal==='pickup'&&isStaff(profile)&&<Modal title="Confirmar retirada física" onClose={()=>setModal('')}>
    <ConditionForm mode="pickup" loan={editForm} title={findBook(editForm.book_id)?.title} copyCode={data.copies.find(c=>c.id===editForm.copy_id)?.code} busy={busy}
      onSubmit={async(condition,notes)=>{const ok=await action(async()=>must(await supabase.rpc('pickup_loan',{p_loan_id:editForm.id,p_condition_out:condition,p_notes:notes})),'Retirada confirmada e prazo atualizado.');if(ok)setModal('')}}/>
  </Modal>}
  {modal==='return'&&isStaff(profile)&&<Modal title="Registrar devolução e conservação" onClose={()=>setModal('')}>
    <ConditionForm mode="return" loan={editForm} title={findBook(editForm.book_id)?.title} copyCode={data.copies.find(c=>c.id===editForm.copy_id)?.code} busy={busy}
      onSubmit={async(condition,notes)=>{const ok=await action(async()=>must(await supabase.rpc('return_loan',{p_loan_id:editForm.id,p_condition_in:condition,p_notes:notes})),'Devolução registrada no histórico.');if(ok)setModal('')}}/>
  </Modal>}
  {modal==='receipt'&&<Modal title="Comprovante de empréstimo" onClose={()=>setModal('')}>
    <LoanReceipt loan={data.loans.find(l=>l.id===editForm.id)||editForm} book={findBook(editForm.book_id)}
      reader={isStaff(profile)?findUser(editForm.reader_id):profile}
      copyCode={data.copies.find(c=>c.id===editForm.copy_id)?.code}
      events={data.events.filter(event=>event.loan_id===editForm.id)}/>
  </Modal>}
  {modal==='labels'&&isStaff(profile)&&<Modal title="Etiquetas para exemplares" onClose={()=>setModal('')}>
    <p className="helper-text">Etiquetas prontas para imprimir. Use a impressora da escola e recorte nas linhas indicadas; os códigos são numéricos, como você escolheu.</p>
    <div className="print-actions"><button className="btn btn--primary" onClick={()=>window.print()}><BookMarked size={17}/> Imprimir etiquetas</button><span>{data.copies.length} exemplar(es)</span></div>
    <div className="print-labels">{data.copies.map(copy=><div className="print-label" key={copy.id}><strong>Biblioteca Joaquim</strong><span>{findBook(copy.book_id)?.title||'Livro'}</span><small>Exemplar nº <b>{copy.code}</b></small></div>)}</div>
  </Modal>}
  {modal==='import'&&isStaff(profile)&&<Modal title="Importar livros por planilha" onClose={()=>setModal('')}><ImportBooks busy={busy} onImport={rows=>action(async()=>must(await supabase.rpc('bulk_import_books',{p_rows:rows})),result=>'Importação concluída: '+result.added_copies+' exemplar(es), '+result.created_books+' título(s) novo(s).')}/></Modal>}
  {modal==='book'&&isStaff(profile)&&<Modal title="Cadastrar novo livro" onClose={()=>setModal('')}><form className="form-stack" onSubmit={async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const ok=await action(async()=>must(await supabase.rpc('create_book_with_copy',{p_title:String(f.get('title')).trim(),p_author:String(f.get('author')).trim(),p_genre:String(f.get('genre')).trim(),p_synopsis:String(f.get('synopsis')).trim(),p_cover_url:String(f.get('cover_url')).trim()||null,p_published_year:f.get('year')?Number(f.get('year')):null,p_copy_code:String(f.get('code')).trim()})),'Livro e exemplar cadastrados juntos.');if(ok)setModal('')}}><Field label="Título"><input name="title" required maxLength={200}/></Field><Field label="Autor"><input name="author" required maxLength={200}/></Field><Field label="Gênero"><input name="genre" required placeholder="Ex.: Romance, Aventura, História" maxLength={100}/></Field><Field label="Sinopse"><textarea name="synopsis" rows={4} maxLength={2000}/></Field><div className="form-two"><Field label="Ano de publicação"><input name="year" type="number" min="0" max="2100"/></Field><Field label="Código numérico do exemplar"><input name="code" inputMode="numeric" pattern="[0-9]+" title="Use somente números" required/></Field></div><Field label="URL da capa (opcional)"><input name="cover_url" type="url" placeholder="https://..."/></Field><button className="btn btn--primary" disabled={busy} type="submit"><Plus size={16}/>Cadastrar livro</button></form></Modal>}
  {modal==='editbook'&&isStaff(profile)&&<Modal title="Editar informações do livro" onClose={()=>setModal('')}><form className="form-stack" onSubmit={async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const ok=await action(async()=>must(await supabase.from('books').update({title:String(f.get('title')).trim(),author:String(f.get('author')).trim(),genre:String(f.get('genre')).trim(),synopsis:String(f.get('synopsis')).trim(),cover_url:String(f.get('cover_url')).trim()||null,published_year:f.get('year')?Number(f.get('year')):null}).eq('id',editForm.id)),'Livro atualizado.');if(ok)setModal('')}}><Field label="Título"><input name="title" defaultValue={editForm.title} required/></Field><Field label="Autor"><input name="author" defaultValue={editForm.author} required/></Field><Field label="Gênero"><input name="genre" defaultValue={editForm.genre} required/></Field><Field label="Sinopse"><textarea name="synopsis" rows={4} maxLength={2000} defaultValue={editForm.synopsis||''}/></Field><div className="form-two"><Field label="Ano de publicação"><input name="year" type="number" min="0" max="2100" defaultValue={editForm.published_year||''}/></Field><Field label="URL da capa"><input name="cover_url" type="url" defaultValue={editForm.cover_url||''}/></Field></div><button className="btn btn--primary" type="submit" disabled={busy}>Salvar livro</button></form></Modal>}
  {modal==='copy'&&isStaff(profile)&&<Modal title="Adicionar exemplar" onClose={()=>setModal('')}><form className="form-stack" onSubmit={async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const ok=await action(async()=>must(await supabase.from('book_copies').insert({book_id:editForm.book_id,code:String(f.get('code')).trim()})),'Exemplar adicionado ao acervo.');if(ok)setModal('')}}><p>Livro: <strong>{findBook(editForm.book_id)?.title}</strong></p><Field label="Novo código numérico"><input name="code" inputMode="numeric" pattern="[0-9]+" required/></Field><button disabled={busy} className="btn btn--primary">Adicionar exemplar</button></form></Modal>}
  </div>
}
export default App
