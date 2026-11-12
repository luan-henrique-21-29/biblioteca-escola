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
  const result=catalogReport(books,copies,[{copy_id:'c1',status:'active'}])
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
