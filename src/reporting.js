// Exportação dos dados que o bibliotecário já pode consultar, sem expor o cadastro publicamente.
const clean = value => String(value ?? '').replace(/\r\n?/g,'\n')
export function csvCell(value){
  let s=clean(value)
  // Evita execução de fórmulas quando o arquivo for aberto no Excel / Sheets.
  if(/^\s*[=+\-@\t\r]/.test(s))s="'"+s
  return '"'+s.replace(/"/g,'""')+'"'
}
export function csvData(headers,rows){
  return '\uFEFF'+[headers,...rows].map(row=>row.map(csvCell).join(';')).join('\r\n')+'\r\n'
}
// O prazo de retirada NÃO expira automaticamente. O vencimento de devolução
// só vale depois da confirmação presencial da retirada.
export const REPORT_STATUSES = Object.freeze({
  pending_pickup:'Aguardando retirada',
  on_time:'Em dia',
  overdue:'Atrasado',
  returned:'Devolvido'
})

export function loanStatus(loan,now=Date.now()){
  if(loan.status==='returned')return 'returned'
  if(loan.status!=='active')return 'pending_pickup'
  if(!loan.picked_up_at)return 'pending_pickup'
  return loan.due_at && Number.isFinite(new Date(loan.due_at).getTime()) &&
    new Date(loan.due_at).getTime()<new Date(now).getTime()?'overdue':'on_time'
}

const reportDates=new Set(['approved_at','picked_up_at','due_at','returned_at'])
const calendarDay=value=>typeof value==='string' && /^\d{4}-\d{2}-\d{2}/.test(value)?value.slice(0,10):null

export function filterLoans(loans,people,filters={}){
  const {classroom='todos',status='todos',from='',to='',dateField='approved_at',now=Date.now()}=filters
  const dateColumn=reportDates.has(dateField)?dateField:'approved_at'
  const users=new Map(people.map(p=>[p.id,p]))
  return loans.filter(loan=>{
    const room=(users.get(loan.reader_id)?.classroom||'').trim()
    if(classroom!=='todos' && (classroom==='__sem_turma__'?room!=='':room!==classroom))return false
    if(status!=='todos'&&loanStatus(loan,now)!==status)return false
    if(from||to){
      const date=calendarDay(loan[dateColumn])
      if(!date || (from&&date<from) || (to&&date>to))return false
    }
    return true
  })
}

export function classReport(loans,people,now=Date.now()){
  const users=new Map(people.map(p=>[p.id,p]))
  const grouped=new Map()
  for(const loan of loans){
    const classroom=(users.get(loan.reader_id)?.classroom||'').trim()||'Sem turma'
    if(!grouped.has(classroom))grouped.set(classroom,{classroom,total:0,pending_pickup:0,on_time:0,overdue:0,returned:0})
    const row=grouped.get(classroom)
    row.total+=1
    row[loanStatus(loan,now)]+=1
  }
  return [...grouped.values()].sort((a,b)=>a.classroom.localeCompare(b.classroom,'pt-BR'))
}

export function classReportCsv(loans,people,now=Date.now()){
  return csvData(
    ['Turma','Total','Aguardando retirada','Em dia','Atrasados','Devolvidos'],
    classReport(loans,people,now).map(r=>[r.classroom,r.total,r.pending_pickup,r.on_time,r.overdue,r.returned])
  )
}

export function loansReport(loans,books,people,copies){
  const booksById=Object.fromEntries(books.map(b=>[b.id,b]))
  const peopleById=Object.fromEntries(people.map(p=>[p.id,p]))
  const copiesById=Object.fromEntries(copies.map(c=>[c.id,c]))
  const cols=['Código do exemplar','Título','Autor','Aluno','Turma','Situação','Aprovação','Retirada física','Prazo','Devolução','Estado na retirada','Estado na devolução','Observação da retirada','Observação da devolução']
  const data=loans.map(l=>{
    const b=booksById[l.book_id],p=peopleById[l.reader_id]
    return [copiesById[l.copy_id]?.code??'',b?.title??'',b?.author??'',p?.full_name??'',p?.classroom??'',
      loanStatus(l)==='on_time'?'Emprestado':REPORT_STATUSES[loanStatus(l)],
      l.approved_at?.slice(0,10)??'',l.picked_up_at?.slice(0,10)??'',l.due_at?.slice(0,10)??'',l.returned_at?.slice(0,10)??'',
      l.condition_out??'',l.condition_in??'',l.pickup_notes??'',l.return_notes??'']
  })
  return csvData(cols,data)
}
export function catalogReport(books,copies,loans){
  const booksById=Object.fromEntries(books.map(b=>[b.id,b]))
  const activeByCopy=new Map(loans.filter(l=>l.status==='active').map(l=>[l.copy_id,l]))
  const rows=copies.map(c=>{
    const b=booksById[c.book_id]
    return [c.code,b?.title??'',b?.author??'',b?.genre??'',b?.published_year??'',activeByCopy.has(c.id)?(activeByCopy.get(c.id).picked_up_at?'Emprestado':'Aguardando retirada'):'Disponível']
  })
  return csvData(['Código','Livro','Autor','Gênero','Ano','Disponibilidade'],rows)
}
export function downloadCsv(filename,content){
  const blob=new Blob([content],{type:'text/csv;charset=utf-8'})
  const url=URL.createObjectURL(blob)
  const a=document.createElement('a')
  a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove()
  setTimeout(()=>URL.revokeObjectURL(url),3000)
}
