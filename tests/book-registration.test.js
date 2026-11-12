import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const file=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8')
const sql=file('supabase/migrations/20261112060000_atomic_book_creation.sql')
const ui=file('src/App.jsx')
test('Cadastro do livro e seu primeiro exemplar usa uma única operação transacional',()=>{
 assert.match(sql,/create or replace function public\.create_book_with_copy/)
 assert.match(sql,/if auth\.uid\(\) is null or not public\.is_staff\(\)/)
 assert.match(sql,/insert into public\.books\(/)
 assert.match(sql,/insert into public\.book_copies\(/)
 assert.match(ui,/supabase\.rpc\('create_book_with_copy'/)
})
test('O navegador não cadastra o livro e exemplar em duas requisições separadas',()=>{
 assert.doesNotMatch(ui,/supabase\.from\('books'\)\.insert\(/)
})
test('Todos os formulários de acervo só fecham se a gravação for bem sucedida',()=>{
 assert.match(ui,/if\(ok\)setModal\(''\)/)
 assert.match(sql,/revoke all on function public\.create_book_with_copy/)
 assert.match(sql,/grant execute on function public\.create_book_with_copy/)
})
