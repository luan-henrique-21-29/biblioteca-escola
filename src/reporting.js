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
export function loansReport(loans,books,people,copies){
  const booksById=Object.fromEntries(books.map(b=>[b.id,b]))
  const peopleById=Object.fromEntries(people.map(p=>[p.id,p]))
  const copiesById=Object.fromEntries(copies.map(c=>[c.id,c]))
  const cols=['Código do exemplar','Título','Autor','Aluno','Turma','Situação','Aprovação','Retirada física','Prazo','Devolução','Estado na retirada','Estado na devolução','Observação da retirada','Observação da devolução']
  const data=loans.map(l=>{
    const b=booksById[l.book_id],p=peopleById[l.reader_id]
    return [copiesById[l.copy_id]?.code??'',b?.title??'',b?.author??'',p?.full_name??'',p?.classroom??'',
      l.status==='returned'?'Devolvido':!l.picked_up_at?'Aguardando retirada':new Date(l.due_at)<new Date()?'Atrasado':'Emprestado',
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
