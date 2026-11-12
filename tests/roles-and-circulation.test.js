import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const initial=readFileSync(new URL('../supabase/migrations/20261112000000_initial.sql',import.meta.url),'utf8')
const current=readFileSync(new URL('../supabase/migrations/20261112040000_circulation.sql',import.meta.url),'utf8')

test('um cadastro público inicia sempre como aluno',()=>{
 assert.match(initial,/insert into public\.profiles\(id,email,full_name,classroom,role\)/)
 assert.match(initial,/'reader'/)
 assert.match(initial,/grant update\(full_name,classroom\) on public\.profiles to authenticated;/)
 assert.doesNotMatch(initial,/grant update\(role\)/)
})
test('somente funcionário pode confirmar retirada e devolução',()=>{
 assert.match(current,/function public\.pickup_loan\(/)
 assert.match(current,/function public\.return_loan\(p_loan_id uuid,p_condition_in text/)
 assert.match(current,/if not public\.is_staff\(\) then raise exception 'Somente funcionarios/)
})
test('condição do exemplar precisa ser preenchida na retirada e na devolução',()=>{
 assert.match(current,/coalesce\(p_condition_out,''\) not in \('novo','bom','regular','danificado'\)/)
 assert.match(current,/coalesce\(p_condition_in,''\) not in \('novo','bom','regular','danificado'\)/)
})
test('eventos de empréstimos são de leitura restrita e escrita somente pelo servidor',()=>{
 assert.match(current,/alter table public\.loan_events enable row level security/)
 assert.match(current,/grant select on public\.loan_events to authenticated/)
 assert.doesNotMatch(current,/grant insert on public\.loan_events to authenticated/)
})
