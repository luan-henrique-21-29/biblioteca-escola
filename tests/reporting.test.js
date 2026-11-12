import {test} from 'node:test'
import assert from 'node:assert/strict'
import {csvCell,csvData,catalogReport,loansReport,loanStatus,filterLoans,classReport,classReportCsv,schoolCalendarDay} from '../src/reporting.js'

test('CSV protege contra injeção de fórmulas, aspas e pontos e vírgulas',()=>{
  assert.equal(csvCell('=HYPERLINK("http://evil.test")'),'"\'=HYPERLINK(""http://evil.test"")"')
  assert.equal(csvCell('  +SUM(1,2)'),'"\'  +SUM(1,2)"')
  assert.equal(csvCell('Livro; raro'),'"Livro; raro"')
  assert.equal(csvCell('Um\nDois'),'"Um\nDois"')
  assert.equal(csvCell('-10'),'"\'-10"')
  assert.ok(csvData(['Titulo'],[['A']]).startsWith('\uFEFF'))
})
test('exporta cada exemplar da biblioteca no catálogo',()=>{
  const books=[{id:'b',title:'Dom Casmurro',author:'Machado',genre:'Romance',published_year:1899}]
  const copies=[{id:'c1',book_id:'b',code:'001'},{id:'c2',book_id:'b',code:'002'}]
  const result=catalogReport(books,copies,[{copy_id:'c1',status:'active',picked_up_at:'2026-11-12T12:00:00Z'}])
  assert.match(result,/"001".*"Emprestado"/)
  assert.match(result,/"002".*"Disponível"/)
})
test('relatório de empréstimo mostra turma e prazo',()=>{
  const r=loansReport([{reader_id:'u',book_id:'b',copy_id:'c',status:'returned',due_at:'2026-12-10T12:00:00Z'}],
    [{id:'b',title:'Título',author:'Autor'}],[{id:'u',full_name:'Aluna',classroom:'1º IA'}],[{id:'c',code:'0001'}])
  assert.match(r,/"1º IA"/)
  assert.match(r,/"Devolvido"/)
  assert.match(r,/"2026-12-10"/)
})

test('relatório diferencia reserva aprovada de retirada física e registra conservação',()=>{
 const l={reader_id:'u',book_id:'b',copy_id:'c',status:'active',
   approved_at:'2026-11-12T10:00:00Z',due_at:'2026-11-26T10:00:00Z'}
 const books=[{id:'b',title:'Um livro',author:'Alguém'}]
 const people=[{id:'u',full_name:'Aluno fictício',classroom:'1º IA'}]
 const copies=[{id:'c',book_id:'b',code:'0005'}]
 assert.match(loansReport([l],books,people,copies),/"Aguardando retirada"/)
 assert.match(catalogReport(books,copies,[l]),/"Aguardando retirada"/)
 const after={...l,picked_up_at:'2026-11-13T10:00:00Z',condition_out:'regular',pickup_notes:'Capa amassada'}
 const res=loansReport([after],books,people,copies)
 assert.match(res,/"Emprestado"/)
 assert.match(res,/"Retirada física"/)
 assert.match(res,/"Estado na retirada"/)
 assert.match(res,/"regular"/)
 assert.match(res,/"Capa amassada"/)
 assert.match(catalogReport(books,copies,[after]),/"Emprestado"/)
})


test('sem expiração para retirada: só há atraso após o recebimento físico',()=>{
 const approved={id:'a',status:'active',due_at:'2025-01-01T12:00:00Z'}
 assert.equal(loanStatus(approved,new Date('2026-11-12T12:00:00Z')),'pending_pickup')
 assert.equal(loanStatus({...approved,picked_up_at:'2024-12-01T12:00:00Z'},new Date('2026-11-12T12:00:00Z')),'overdue')
 assert.equal(loanStatus({...approved,status:'returned',picked_up_at:'2024-12-01T12:00:00Z'},new Date('2026-11-12T12:00:00Z')),'returned')
})
test('relatório filtra turma, situação e datas inclusivas com campo selecionado',()=>{
 const people=[{id:'a',classroom:'1º IA'},{id:'b',classroom:'2º B'},{id:'c',classroom:''}]
 const loans=[
  {id:'1',reader_id:'a',status:'active',approved_at:'2026-11-01T23:30:00Z',picked_up_at:'2026-11-02T13:00:00Z',due_at:'2026-11-15T13:00:00Z'},
  {id:'2',reader_id:'a',status:'returned',approved_at:'2026-10-31T13:00:00Z',picked_up_at:'2026-11-01T13:00:00Z',returned_at:'2026-11-03T13:00:00Z'},
  {id:'3',reader_id:'b',status:'active',approved_at:'2026-11-01T14:00:00Z',due_at:'2026-11-05T00:00:00Z'},
  {id:'4',reader_id:'c',status:'active',approved_at:'2026-11-01T08:00:00Z',picked_up_at:'2026-11-01T10:00:00Z',due_at:'2026-11-08T10:00:00Z'}
 ]
 const now=new Date('2026-11-12T15:00:00Z')
 assert.deepEqual(filterLoans(loans,people,{classroom:'1º IA',now}).map(l=>l.id),['1','2'])
 assert.deepEqual(filterLoans(loans,people,{status:'overdue',now}).map(l=>l.id),['4'])
 assert.deepEqual(filterLoans(loans,people,{status:'pending_pickup',now}).map(l=>l.id),['3'])
 assert.deepEqual(filterLoans(loans,people,{from:'2026-11-01',to:'2026-11-01',now}).map(l=>l.id),['1','3','4'])
 assert.deepEqual(filterLoans(loans,people,{from:'2026-11-03',to:'2026-11-03',dateField:'returned_at',now}).map(l=>l.id),['2'])
 assert.deepEqual(filterLoans(loans,people,{classroom:'__sem_turma__',now}).map(l=>l.id),['4'])
 assert.deepEqual(filterLoans(loans,people,{classroom:'1º IA',status:'on_time',from:'2026-11-01',to:'2026-11-01',now}).map(l=>l.id),['1'])
 const summary=classReport(filterLoans(loans,people,{from:'2026-11-01',now}),people,now)
 assert.equal(summary.find(r=>r.classroom==='1º IA').on_time,1)
 assert.match(classReportCsv(loans,people,now),/"Sem turma"/)
 assert.deepEqual(filterLoans(loans,people,{from:'2026-11-20',to:'2026-11-01',now}),[])
})
test('filtros não alteram empréstimos originais, nem expõem alunos extras no resumo',()=>{
 const people=[{id:'1',classroom:'1º IA'},{id:'2',classroom:'2º A'}]
 const loans=[{id:'1',reader_id:'1',status:'returned',approved_at:'2026-01-01T00:00:00Z'},
   {id:'2',reader_id:'2',status:'returned',approved_at:'2026-01-02T00:00:00Z'}]
 const filtered=filterLoans(loans,people,{classroom:'1º IA'})
 assert.equal(filtered.length,1)
 assert.equal(loans.length,2)
 assert.deepEqual(classReport(filtered,people).map(r=>r.classroom),['1º IA'])
 assert.doesNotMatch(classReportCsv(filtered,people),/2º A/)
})

test('datas de exportação e filtros usam calendário da escola no Paraná',()=>{
  assert.equal(schoolCalendarDay('2026-11-13T01:00:00Z'),'2026-11-12')
  assert.equal(schoolCalendarDay('2026-11-13T03:00:00Z'),'2026-11-13')
  assert.equal(schoolCalendarDay('2026-11-13'),'2026-11-13')
  assert.equal(schoolCalendarDay('data-invalida'),null)
  const loans=[{reader_id:'u',book_id:'b',copy_id:'c',status:'returned',
   approved_at:'2026-11-13T01:00:00Z',returned_at:'2026-11-13T04:00:00Z'}]
  const students=[{id:'u',full_name:'Aluno',classroom:'1º IA'}]
  assert.equal(filterLoans(loans,students,{from:'2026-11-12',to:'2026-11-12'}).length,1)
  assert.equal(filterLoans(loans,students,{from:'2026-11-13',to:'2026-11-13'}).length,0)
  assert.match(loansReport(loans,[{id:'b',title:'Livro'}],students,[{id:'c',code:'001'}]),/"2026-11-12";"";"";"2026-11-13"/)
})
