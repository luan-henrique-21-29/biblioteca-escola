import React, {useMemo,useState} from 'react'
import {Filter,Download,BookOpen,Clock3,AlertTriangle,RotateCcw,CalendarDays,BarChart3,Users} from 'lucide-react'
import {ResponsiveContainer,BarChart,Bar,XAxis,YAxis,Tooltip,CartesianGrid} from 'recharts'
import {filterLoans,loanStatus,classReport,classReportCsv,catalogReport,loansReport,downloadCsv,REPORT_STATUSES} from './reporting.js'

const TYPES=[
 ['approved_at','Data da aprovação'],
 ['picked_up_at','Data da retirada'],
 ['due_at','Prazo de devolução'],
 ['returned_at','Data da devolução']
]
const STATUS_OPTIONS=[
 ['todos','Todas as situações'],
 ['pending_pickup','Aguardando retirada'],
 ['on_time','Em dia'],
 ['overdue','Atrasado'],
 ['returned','Devolvido']
]
const STATUS_CHART=[
 ['pending_pickup','Aguardando retirada'],
 ['on_time','Em dia'],
 ['overdue','Atrasados'],
 ['returned','Devolvidos']
]
function Metric({label,value,Icon}){
 return <div className="report-metric"><span><Icon size={19}/></span><strong>{value}</strong><small>{label}</small></div>
}
export default function ReportsPanel({loans=[],books=[],people=[],copies=[],listLoans}){
 const [classroom,setClassroom]=useState('todos')
 const [status,setStatus]=useState('todos')
 const [dateField,setDateField]=useState('approved_at')
 const [from,setFrom]=useState('')
 const [to,setTo]=useState('')
 const now=Date.now()
 const rangeInvalid=Boolean(from&&to&&from>to)
 const classrooms=useMemo(()=>[...new Set(people.filter(p=>p.role==='reader'||!p.role).map(p=>(p.classroom||'').trim()))].sort((a,b)=>a.localeCompare(b,'pt-BR')),[people])
 const selected=useMemo(()=>rangeInvalid?[]:filterLoans(loans,people,{classroom,status,dateField,from,to,now}),
  [loans,people,classroom,status,dateField,from,to,rangeInvalid])
 const groups=useMemo(()=>classReport(selected,people,now),[selected,people])
 const counts=Object.fromEntries(STATUS_CHART.map(([key])=>[key,selected.filter(l=>loanStatus(l,now)===key).length]))
 const chartData=STATUS_CHART.map(([key,name])=>({name,quantidade:counts[key]}))
 const reset=()=>{setClassroom('todos');setStatus('todos');setDateField('approved_at');setFrom('');setTo('')}
 const exportLoans=()=>downloadCsv('biblioteca-joaquim-emprestimos-filtrados.csv',loansReport(selected,books,people,copies))
 const exportClasses=()=>downloadCsv('biblioteca-joaquim-relatorio-por-turma.csv',classReportCsv(selected,people,now))
 return <section className="page-section report-page" aria-label="Relatórios da biblioteca">
   <div className="panel-head">
    <div><span className="eyebrow">RELATÓRIOS · EQUIPE AUTORIZADA</span>
     <h2>Relatórios da biblioteca</h2>
     <p>Filtre por turma, período e situação. Os gráficos, as listas e os arquivos CSV acompanham os filtros escolhidos.</p>
    </div>
   </div>
   <div className="surface report-filter-panel">
    <div className="report-filter-title"><Filter size={19}/><div><h3>Filtrar empréstimos</h3><p>Datas inicial e final inclusivas. Escolha qual data será usada para o período.</p></div></div>
    <div className="report-filter-grid">
     <label className="field"><span>Turma</span><select aria-label="Filtrar turma do relatório" value={classroom} onChange={e=>setClassroom(e.target.value)}>
       <option value="todos">Todas as turmas</option>
       {classrooms.map(room=><option key={room||'__sem_turma__'} value={room||'__sem_turma__'}>{room||'Sem turma'}</option>)}
     </select></label>
     <label className="field"><span>Situação</span><select aria-label="Filtrar situação do relatório" value={status} onChange={e=>setStatus(e.target.value)}>
       {STATUS_OPTIONS.map(([v,label])=><option key={v} value={v}>{label}</option>)}
     </select></label>
     <label className="field"><span>Tipo de data</span><select aria-label="Selecionar data do relatório" value={dateField} onChange={e=>setDateField(e.target.value)}>
       {TYPES.map(([v,label])=><option key={v} value={v}>{label}</option>)}
     </select></label>
     <label className="field"><span>Data inicial</span><input aria-label="Data inicial do relatório" type="date" value={from} max={to||undefined} onChange={e=>setFrom(e.target.value)}/></label>
     <label className="field"><span>Data final</span><input aria-label="Data final do relatório" type="date" value={to} min={from||undefined} onChange={e=>setTo(e.target.value)}/></label>
    </div>
    <div className="report-filter-footer">
      <button type="button" className="btn btn--outline" onClick={reset}><RotateCcw size={15}/> Limpar filtros</button>
      <span aria-live="polite"><strong>{selected.length}</strong> de {loans.length} empréstimo(s) no resultado</span>
    </div>
    {rangeInvalid&&<p role="alert" className="alert alert--error">A data inicial precisa ser anterior ou igual à data final.</p>}
   </div>

   <div className="report-actions">
     <button className="btn btn--primary" disabled={rangeInvalid||!selected.length} onClick={exportLoans}><Download size={16}/> Exportar empréstimos filtrados</button>
     <button className="btn btn--outline" disabled={rangeInvalid||!selected.length} onClick={exportClasses}><Users size={16}/> Exportar resumo por turma</button>
     <button className="btn btn--outline" onClick={()=>downloadCsv('biblioteca-joaquim-acervo.csv',catalogReport(books,copies,loans))}><BookOpen size={16}/> Exportar acervo completo</button>
   </div>

   <div className="report-metrics">
     <Metric label="Empréstimos encontrados" value={selected.length} Icon={BookOpen}/>
     <Metric label="Aguardando retirada" value={counts.pending_pickup} Icon={Clock3}/>
     <Metric label="Atrasados" value={counts.overdue} Icon={AlertTriangle}/>
     <Metric label="Devolvidos" value={counts.returned} Icon={CalendarDays}/>
   </div>

   <div className="surface chart-panel">
    <h3><BarChart3 size={18}/> Empréstimos por situação</h3>
    {selected.length?<div className="chart"><ResponsiveContainer width="100%" height="100%">
     <BarChart data={chartData} margin={{top:15,right:10,left:-20,bottom:2}}>
      <CartesianGrid strokeDasharray="3 3" vertical={false}/>
      <XAxis dataKey="name" tick={{fontSize:11}} interval={0}/>
      <YAxis allowDecimals={false}/><Tooltip/>
      <Bar dataKey="quantidade" name="Empréstimos" fill="#214b7c" radius={[6,6,0,0]}/>
     </BarChart>
    </ResponsiveContainer></div>:<p className="report-empty">Nenhum empréstimo corresponde aos filtros selecionados.</p>}
   </div>

   <div className="surface report-class-panel">
    <div className="report-section-heading"><div><span className="eyebrow">ORGANIZAÇÃO ESCOLAR</span><h3>Resumo por turma</h3></div><small>{groups.length} turma(s) no resultado</small></div>
    {groups.length?<div className="table-wrap"><table>
      <thead><tr><th>Turma</th><th>Total</th><th>Aguardando retirada</th><th>Em dia</th><th>Atrasados</th><th>Devolvidos</th></tr></thead>
      <tbody>{groups.map(row=><tr key={row.classroom}><td><strong>{row.classroom}</strong></td><td>{row.total}</td><td>{row.pending_pickup}</td><td>{row.on_time}</td><td>{row.overdue}</td><td>{row.returned}</td></tr>)}</tbody>
    </table></div>:<p className="report-empty">Sem turmas para esses filtros.</p>}
   </div>
   <div className="surface report-loan-panel">
    <div className="report-section-heading"><div><span className="eyebrow">REGISTROS</span><h3>Empréstimos encontrados</h3></div><small>{selected.length} registro(s)</small></div>
    {listLoans(selected,true)}
   </div>
   <p className="helper-text">A retirada não vence automaticamente: o prazo de devolução começa quando o bibliotecário confirma a entrega física. Relatórios contêm dados pessoais; exporte apenas para uso autorizado da escola. A seleção de período filtra a data indicada, e não cancela empréstimos.</p>
 </section>
}
