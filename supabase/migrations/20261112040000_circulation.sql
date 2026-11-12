-- Biblioteca Joaquim — regras de circulação física, conservação e histórico de movimentações.
-- Execute após 20261112030000_security_and_notifications.sql.
-- Nunca use esta migração para criar funcionários pelo navegador.

alter table public.loans
  add column if not exists picked_up_at timestamptz,
  add column if not exists condition_out text,
  add column if not exists condition_in text,
  add column if not exists pickup_notes text not null default '',
  add column if not exists return_notes text not null default '';
-- Compatibilidade com empréstimos anteriores à confirmação de retirada:
update public.loans set picked_up_at=approved_at, condition_out='bom'
  where picked_up_at is null;
alter table public.loans
  add constraint loan_condition_out_valid check(condition_out is null or condition_out in ('novo','bom','regular','danificado')),
  add constraint loan_condition_in_valid check(condition_in is null or condition_in in ('novo','bom','regular','danificado')),
  add constraint loan_pickup_notes_length check(length(pickup_notes)<=500),
  add constraint loan_return_notes_length check(length(return_notes)<=500);

create table public.loan_events (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references public.loans(id) on delete restrict,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null check(event_type in ('approved','pickup','renewed','returned')),
  condition text check(condition is null or condition in ('novo','bom','regular','danificado')),
  notes text not null default '' check(length(notes)<=500),
  created_at timestamptz not null default now()
);
create index loan_events_loan_idx on public.loan_events(loan_id,created_at);
alter table public.loan_events enable row level security;
create policy loan_events_read on public.loan_events for select to authenticated
  using(public.is_staff() or exists(
    select 1 from public.loans where id=loan_id and reader_id=auth.uid()
  ));
revoke all on public.loan_events from public,anon,authenticated;
grant select on public.loan_events to authenticated;
-- Nenhum insert/update/delete direto para o navegador, nem aluno nem funcionário.

-- Histórico automático: inclui quem registrou a movimentação.
create or replace function public.audit_loan_changes()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op='INSERT' then
    insert into public.loan_events(loan_id,actor_id,event_type)
      values(new.id,auth.uid(),'approved');
  elsif old.picked_up_at is null and new.picked_up_at is not null then
    insert into public.loan_events(loan_id,actor_id,event_type,condition,notes)
      values(new.id,auth.uid(),'pickup',new.condition_out,new.pickup_notes);
  elsif old.status='active' and new.status='returned' then
    insert into public.loan_events(loan_id,actor_id,event_type,condition,notes)
      values(new.id,auth.uid(),'returned',new.condition_in,new.return_notes);
  elsif old.renewals_count<new.renewals_count then
    insert into public.loan_events(loan_id,actor_id,event_type)
      values(new.id,auth.uid(),'renewed');
  end if;
  return new;
end;
$$;
revoke all on function public.audit_loan_changes() from public,anon,authenticated;
create trigger loan_insert_audit after insert on public.loans for each row
execute function public.audit_loan_changes();
create trigger loan_update_audit after update on public.loans for each row
execute function public.audit_loan_changes();

-- Registros antigos são identificados como importados, sem fingir quem os aprovou.
insert into public.loan_events(loan_id,event_type,notes,created_at)
select id,'approved','Registro anterior à atualização',approved_at
from public.loans;

create or replace function public.pickup_loan(p_loan_id uuid,p_condition_out text,p_notes text default '')
returns void language plpgsql security definer set search_path = '' as $$
declare v_loan public.loans%rowtype; v_days integer;
begin
  if not public.is_staff() then raise exception 'Somente funcionarios podem confirmar retiradas.'; end if;
  if coalesce(p_condition_out,'') not in ('novo','bom','regular','danificado') then
    raise exception 'Selecione o estado do livro na retirada.'; end if;
  if length(coalesce(p_notes,''))>500 then raise exception 'Observacao muito longa.'; end if;
  select * into v_loan from public.loans where id=p_loan_id for update;
  if not found or v_loan.status<>'active' or v_loan.picked_up_at is not null then
    raise exception 'Esta retirada ja foi registrada ou o emprestimo nao esta ativo.'; end if;
  select loan_days into v_days from public.library_settings where id=true;
  update public.loans set picked_up_at=now(),condition_out=p_condition_out,
    pickup_notes=coalesce(p_notes,''),due_at=now()+make_interval(days=>v_days)
    where id=p_loan_id;
  insert into public.notifications(recipient_id,title,body)
    values(v_loan.reader_id,'Retirada confirmada','O livro foi entregue. Veja a nova data de devolucao em Meus livros.');
end;
$$;
revoke all on function public.pickup_loan(uuid,text,text) from public,anon,authenticated;
grant execute on function public.pickup_loan(uuid,text,text) to authenticated;

-- Substitui retorno sem avaliação por devolução registrada com estado obrigatório.
drop function public.return_loan(uuid);
create or replace function public.return_loan(p_loan_id uuid,p_condition_in text,p_notes text default '')
returns void language plpgsql security definer set search_path = '' as $$
declare v_reader uuid;v_book uuid;v_pickup timestamptz;
begin
  if not public.is_staff() then raise exception 'Somente funcionarios podem registrar devolucoes.'; end if;
  if coalesce(p_condition_in,'') not in ('novo','bom','regular','danificado') then
    raise exception 'Selecione o estado do livro na devolucao.'; end if;
  if length(coalesce(p_notes,''))>500 then raise exception 'Observacao muito longa.'; end if;
  update public.loans set status='returned',returned_at=now(),
    condition_in=p_condition_in,return_notes=coalesce(p_notes,'')
    where id=p_loan_id and status='active' and picked_up_at is not null
    returning reader_id,book_id,picked_up_at into v_reader,v_book,v_pickup;
  if v_reader is null then
    raise exception 'Emprestimo nao retirado ou ja devolvido.'; end if;
  insert into public.notifications(recipient_id,title,body)
    values(v_reader,'Devolucao registrada','O livro foi devolvido. Obrigado por cuidar do acervo!');
  perform public.notify_waitlist_available(v_book);
end;
$$;
revoke all on function public.return_loan(uuid,text,text) from public,anon,authenticated;
grant execute on function public.return_loan(uuid,text,text) to authenticated;

-- Livros aprovados, mas não entregues, não contam como atrasados
-- e não podem ser renovados antes da retirada.
create or replace function public.request_renewal(p_loan_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_loan public.loans%rowtype;v_id uuid;
begin
  select * into v_loan from public.loans where id=p_loan_id and reader_id=auth.uid() and status='active';
  if not found then raise exception 'Emprestimo ativo nao encontrado.'; end if;
  if v_loan.picked_up_at is null then raise exception 'Retire o livro antes de solicitar renovacao.'; end if;
  if v_loan.due_at<now() then raise exception 'Livros atrasados nao podem ser renovados online.'; end if;
  if exists(select 1 from public.renewal_requests where loan_id=p_loan_id and status='pending') then
    raise exception 'Ja existe pedido de renovacao pendente.'; end if;
  insert into public.renewal_requests(loan_id,reader_id)
    values(p_loan_id,auth.uid()) returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.request_renewal(uuid) from public,anon,authenticated;
grant execute on function public.request_renewal(uuid) to authenticated;

-- Evita alertas de atraso antes de um livro ser efetivamente entregue.
create or replace function public.sync_due_notifications()
returns integer language plpgsql security definer set search_path = '' as $$
declare v_count integer:=0;
begin
  if auth.uid() is null then return 0; end if;
  with upcoming as (
    select l.reader_id,
      case when l.due_at<now() then 'Livro em atraso: ' else 'Devolucao proxima: ' end || left(b.title,120) as title,
      'Data da devolucao: '||to_char(l.due_at at time zone 'America/Sao_Paulo','DD/MM/YYYY')||'. Confira Meus livros.' as body
    from public.loans l join public.books b on b.id=l.book_id
    where l.reader_id=auth.uid() and l.status='active' and l.picked_up_at is not null
      and l.due_at<now()+interval '3 days'
  )
  insert into public.notifications(recipient_id,title,body)
  select u.reader_id,u.title,u.body from upcoming u where not exists(
    select 1 from public.notifications n
    where n.recipient_id=u.reader_id and n.title=u.title and n.body=u.body
      and n.created_at>now()-interval '24 hours'
  );
  get diagnostics v_count=row_count;
  return v_count;
end;
$$;
revoke all on function public.sync_due_notifications() from public,anon,authenticated;
grant execute on function public.sync_due_notifications() to authenticated;

-- O bibliotecário aprova pedidos, mas a entrega ocorre em uma etapa posterior.
-- Ajusta mensagem sem alterar os controles de fila e de concorrência já existentes.
create or replace function public.approve_hold(p_hold_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_hold public.holds%rowtype;v_first uuid;v_copy uuid;
  v_limit integer;v_days integer;v_loan_id uuid;
begin
  if not public.is_staff() then raise exception 'Acesso restrito a biblioteca.'; end if;
  select * into v_hold from public.holds where id=p_hold_id for update;
  if not found or v_hold.status<>'pending' then raise exception 'Solicitacao ja resolvida.'; end if;
  select id into v_first from public.holds where book_id=v_hold.book_id and status='pending'
    order by requested_at,id limit 1;
  if v_first<>p_hold_id then raise exception 'Atenda primeiro a fila de espera deste livro.'; end if;
  perform 1 from public.profiles where id=v_hold.reader_id for update;
  if exists(select 1 from public.loans where reader_id=v_hold.reader_id and status='active'
    and picked_up_at is not null and due_at<now()) then raise exception 'Aluno tem livro em atraso.'; end if;
  if exists(select 1 from public.loans where reader_id=v_hold.reader_id and status='active'
    and book_id=v_hold.book_id) then raise exception 'Aluno ja possui este titulo.'; end if;
  select max_active_loans,loan_days into v_limit,v_days from public.library_settings where id=true;
  if (select count(*) from public.loans where reader_id=v_hold.reader_id and status='active')>=v_limit then
    raise exception 'Aluno atingiu limite de emprestimos.';end if;
  select c.id into v_copy from public.book_copies c where c.book_id=v_hold.book_id
    and not exists(select 1 from public.loans l where l.copy_id=c.id and l.status='active')
    order by c.created_at,c.id for update of c skip locked limit 1;
  if v_copy is null then raise exception 'Sem exemplar disponivel.';end if;
  update public.holds set status='approved',resolved_at=now() where id=p_hold_id;
  insert into public.loans(hold_id,reader_id,book_id,copy_id,due_at)
    values(v_hold.id,v_hold.reader_id,v_hold.book_id,v_copy,now()+make_interval(days=>v_days))
    returning id into v_loan_id;
  insert into public.notifications(recipient_id,title,body)
    values(v_hold.reader_id,'Emprestimo aprovado','Pedido aprovado! Procure a biblioteca para confirmar a retirada do exemplar.');
  return v_loan_id;
end;
$$;
revoke all on function public.approve_hold(uuid) from public,anon,authenticated;
grant execute on function public.approve_hold(uuid) to authenticated;

-- Novos pedidos só ficam bloqueados por livros realmente retirados e vencidos.
create or replace function public.request_book(p_book_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;v_limit integer;v_count integer;
begin
  if auth.uid() is null or not exists(
    select 1 from public.profiles where id=auth.uid() and role='reader'
  ) then raise exception 'Somente alunos podem solicitar livros.';end if;
  if not exists(select 1 from public.book_copies where book_id=p_book_id) then
    raise exception 'O titulo nao tem exemplares cadastrados.';end if;
  if exists(select 1 from public.loans where reader_id=auth.uid() and status='active'
    and picked_up_at is not null and due_at<now()) then raise exception 'Ha livro atrasado.';end if;
  if exists(select 1 from public.loans where reader_id=auth.uid() and status='active'
    and book_id=p_book_id) then raise exception 'Voce ja possui este titulo.';end if;
  select max_active_loans into v_limit from public.library_settings where id=true;
  select count(*) into v_count from public.loans where reader_id=auth.uid() and status='active';
  if v_count>=v_limit then raise exception 'Limite de emprestimos atingido.';end if;
  if exists(select 1 from public.holds where reader_id=auth.uid() and book_id=p_book_id
    and status='pending') then raise exception 'Voce ja esta na fila deste livro.';end if;
  insert into public.holds(reader_id,book_id) values(auth.uid(),p_book_id) returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.request_book(uuid) from public,anon,authenticated;
grant execute on function public.request_book(uuid) to authenticated;

-- Corrige os links do comprovante ao estabelecer leitura privada do histórico.
-- Nota: a verificação de cargo SEMPRE é feita com auth.uid() dentro do banco.
