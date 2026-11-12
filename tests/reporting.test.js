import {test} from 'node:test'
import assert from 'node:assert/strict'
import {csvCell,csvData,catalogReport,loansReport} from '../src/reporting.js'

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
  const r=loansReport([{reader_id:'u',book_id:'b',copy_id:'c',status:'returned',due_at:'2026-12-10T00:00:00Z'}],
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
 assert.match(loansReport([l],books,people,copies),/'Aguardando retirada'/)
 assert.match(catalogReport(books,copies,[l]),/'Aguardando retirada'/)
 const after={...l,picked_up_at:'2026-11-13T10:00:00Z',condition_out:'regular',pickup_notes:'Capa amassada'}
 const res=loansReport([after],books,people,copies)
 assert.match(res,/'Emprestado'/)
 assert.match(res,/'Retirada física'/)
 assert.match(res,/'Estado na retirada'/)
 assert.match(res,/'regular'/)
 assert.match(res,/'Capa amassada'/)
 assert.match(catalogReport(books,copies,[after]),/'Emprestado'/)
})
