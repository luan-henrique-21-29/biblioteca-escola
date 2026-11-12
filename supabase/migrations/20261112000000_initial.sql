-- Biblioteca Joaquim | Execute no SQL Editor de um projeto Supabase novo.
-- Permissoes protegidas por RLS. Jamais coloque uma service_role key no navegador.
create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  classroom text not null default '',
  role text not null default 'reader' check (role in ('reader','librarian','admin')),
  created_at timestamptz not null default now()
);
create index profiles_role_idx on public.profiles(role);

create table public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 1 and 200),
  author text not null check (length(trim(author)) between 1 and 200),
  genre text not null check (length(trim(genre)) between 1 and 100),
  synopsis text not null default '',
  published_year integer check (published_year between 0 and 2100),
  cover_url text,
  created_at timestamptz not null default now()
);
create index books_genre_idx on public.books(genre);

create table public.book_copies (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete restrict,
  code text not null unique check (code ~ '^[0-9]+$'),
  created_at timestamptz not null default now()
);
create index copies_book_idx on public.book_copies(book_id);

create table public.library_settings (
  id boolean primary key default true check(id = true),
  max_active_loans integer not null default 2 check (max_active_loans between 1 and 20),
  loan_days integer not null default 14 check (loan_days between 1 and 180)
);
insert into public.library_settings(id,max_active_loans,loan_days) values(true,2,14);

create table public.holds (
  id uuid primary key default gen_random_uuid(),
  reader_id uuid not null references public.profiles(id) on delete restrict,
  book_id uuid not null references public.books(id) on delete restrict,
  status text not null default 'pending' check(status in ('pending','approved','rejected','cancelled')),
  requested_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index holds_book_queue_idx on public.holds(book_id,requested_at) where status='pending';
create unique index holds_one_pending_idx on public.holds(reader_id,book_id) where status='pending';

create table public.loans (
  id uuid primary key default gen_random_uuid(),
  hold_id uuid unique references public.holds(id) on delete restrict,
  reader_id uuid not null references public.profiles(id) on delete restrict,
  book_id uuid not null references public.books(id) on delete restrict,
  copy_id uuid not null references public.book_copies(id) on delete restrict,
  status text not null default 'active' check(status in ('active','returned')),
  approved_at timestamptz not null default now(),
  due_at timestamptz not null,
  returned_at timestamptz,
  renewals_count integer not null default 0
);
create unique index loans_one_active_copy_idx on public.loans(copy_id) where status='active';
create index loans_reader_idx on public.loans(reader_id,status);
create index loans_due_idx on public.loans(due_at) where status='active';

create table public.renewal_requests (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references public.loans(id) on delete restrict,
  reader_id uuid not null references public.profiles(id) on delete restrict,
  status text not null default 'pending' check(status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create unique index renewals_one_pending_idx on public.renewal_requests(loan_id) where status='pending';

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete restrict,
  reader_id uuid not null references public.profiles(id) on delete restrict,
  rating integer not null check(rating between 1 and 5),
  comment text not null default '' check(length(comment) <= 500),
  created_at timestamptz not null default now(),
  unique(book_id,reader_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index notifications_recipient_idx on public.notifications(recipient_id,created_at desc);

create table public.staff_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check(email = lower(email)),
  role text not null default 'librarian' check(role = 'librarian'),
  claimed_by uuid unique references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Criacao de perfis: toda conta inicia como aluno. O cliente nunca atribui seu cargo.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id,email,full_name,classroom,role)
  values(
    new.id, lower(coalesce(new.email,'')),
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'),''), nullif(trim(new.raw_user_meta_data->>'name'),''), split_part(coalesce(new.email,''),'@',1)),
    coalesce(nullif(trim(new.raw_user_meta_data->>'classroom'),''),''),
    'reader'
  );
  return new;
end;
$$;
create trigger auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id=auth.uid() and role in ('librarian','admin'));
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id=auth.uid() and role='admin');
$$;

alter table public.profiles enable row level security;
alter table public.books enable row level security;
alter table public.book_copies enable row level security;
alter table public.library_settings enable row level security;
alter table public.holds enable row level security;
alter table public.loans enable row level security;
alter table public.renewal_requests enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;
alter table public.staff_invites enable row level security;

create policy profiles_read on public.profiles for select to authenticated using(id=auth.uid() or public.is_staff());
create policy profiles_edit_self on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy books_read on public.books for select to authenticated using(true);
create policy books_create on public.books for insert to authenticated with check(public.is_staff());
create policy books_edit on public.books for update to authenticated using(public.is_staff()) with check(public.is_staff());
create policy books_remove on public.books for delete to authenticated using(public.is_staff());
create policy copies_read on public.book_copies for select to authenticated using(true);
create policy copies_create on public.book_copies for insert to authenticated with check(public.is_staff());
create policy copies_edit on public.book_copies for update to authenticated using(public.is_staff()) with check(public.is_staff());
create policy copies_remove on public.book_copies for delete to authenticated using(public.is_staff());
create policy settings_read on public.library_settings for select to authenticated using(true);
create policy settings_edit on public.library_settings for update to authenticated using(public.is_staff()) with check(public.is_staff());
create policy holds_read on public.holds for select to authenticated using(reader_id=auth.uid() or public.is_staff());
create policy loans_read on public.loans for select to authenticated using(reader_id=auth.uid() or public.is_staff());
create policy renewals_read on public.renewal_requests for select to authenticated using(reader_id=auth.uid() or public.is_staff());
create policy reviews_read on public.reviews for select to authenticated using(true);
create policy reviews_create on public.reviews for insert to authenticated
  with check(reader_id=auth.uid() and exists(select 1 from public.loans l where l.book_id=reviews.book_id and l.reader_id=auth.uid()));
create policy reviews_edit on public.reviews for update to authenticated
  using(reader_id=auth.uid()) with check(reader_id=auth.uid() and exists(select 1 from public.loans l where l.book_id=reviews.book_id and l.reader_id=auth.uid()));
create policy notifications_read on public.notifications for select to authenticated using(recipient_id=auth.uid());
create policy notifications_mark_read on public.notifications for update to authenticated using(recipient_id=auth.uid()) with check(recipient_id=auth.uid());
create policy invites_read on public.staff_invites for select to authenticated using(public.is_admin());
create policy invites_create on public.staff_invites for insert to authenticated with check(public.is_admin());

-- RLS nao basta para proteger o campo role: restrinja as COLUNAS editaveis.
revoke all on public.profiles, public.books, public.book_copies, public.library_settings, public.holds, public.loans, public.renewal_requests, public.reviews, public.notifications, public.staff_invites from anon, authenticated;
grant usage on schema public to authenticated;
grant select on public.profiles, public.books, public.book_copies, public.library_settings, public.holds, public.loans, public.renewal_requests, public.reviews, public.notifications, public.staff_invites to authenticated;
grant update(full_name,classroom) on public.profiles to authenticated;
grant insert,update,delete on public.books,public.book_copies to authenticated;
grant update(max_active_loans,loan_days) on public.library_settings to authenticated;
grant insert,update(book_id,reader_id,rating,comment) on public.reviews to authenticated;
grant update(read_at) on public.notifications to authenticated;
grant insert on public.staff_invites to authenticated;

-- Visao agregada: disponibilidade sem expor os emprestimos de outros alunos.
create view public.book_inventory with (security_barrier = true) as
select b.id as book_id,
       count(c.id)::integer as total,
       (count(c.id) - count(l.id))::integer as free
from public.books b
left join public.book_copies c on c.book_id=b.id
left join public.loans l on l.copy_id=c.id and l.status='active'
group by b.id;
revoke all on public.book_inventory from anon,authenticated;
grant select on public.book_inventory to authenticated;

-- Apenas e-mail confirmado pode reivindicar convite criado pelo administrador.
create or replace function public.claim_staff_invite()
returns void language plpgsql security definer set search_path = '' as $$
declare v_email text;
begin
  if auth.uid() is null then return; end if;
  select lower(email) into v_email from auth.users
    where id=auth.uid() and email_confirmed_at is not null;
  if v_email is null then return; end if;
  update public.staff_invites set claimed_by=auth.uid()
    where email=v_email and claimed_by is null;
  if found then
    update public.profiles set role='librarian' where id=auth.uid() and role='reader';
  end if;
end;
$$;

create or replace function public.request_book(p_book_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_limit integer; v_count integer;
begin
  if auth.uid() is null or not exists(select 1 from public.profiles where id=auth.uid() and role='reader') then
    raise exception 'Somente alunos podem solicitar livros.';
  end if;
  if not exists(select 1 from public.book_copies where book_id=p_book_id) then
    raise exception 'Este livro ainda nao possui exemplar cadastrado.';
  end if;
  if exists(select 1 from public.loans where reader_id=auth.uid() and status='active' and due_at < now()) then
    raise exception 'Ha livro(s) em atraso. Regularize a devolucao antes de solicitar novos emprestimos.';
  end if;
  select max_active_loans into v_limit from public.library_settings where id=true;
  select count(*) into v_count from public.loans where reader_id=auth.uid() and status='active';
  if v_count >= v_limit then raise exception 'Limite de emprestimos ativos atingido.'; end if;
  if exists(select 1 from public.holds where book_id=p_book_id and reader_id=auth.uid() and status='pending') then
    raise exception 'Voce ja possui solicitacao pendente deste livro.';
  end if;
  insert into public.holds(reader_id,book_id) values(auth.uid(),p_book_id) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.cancel_hold(p_hold_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.holds set status='cancelled',resolved_at=now()
    where id=p_hold_id and reader_id=auth.uid() and status='pending';
  if not found then raise exception 'Solicitacao pendente nao encontrada.'; end if;
end;
$$;

create or replace function public.approve_hold(p_hold_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_hold public.holds%rowtype; v_first uuid; v_copy uuid; v_limit integer; v_days integer; v_loan_id uuid;
begin
  if not public.is_staff() then raise exception 'Acesso restrito a biblioteca.'; end if;
  select * into v_hold from public.holds where id=p_hold_id for update;
  if not found or v_hold.status<>'pending' then raise exception 'Solicitacao ja resolvida.'; end if;
  select id into v_first from public.holds where book_id=v_hold.book_id and status='pending'
    order by requested_at,id limit 1;
  if v_first <> p_hold_id then raise exception 'Atenda primeiro a fila de espera deste livro.'; end if;
  if exists(select 1 from public.loans where reader_id=v_hold.reader_id and status='active' and due_at<now()) then
    raise exception 'O aluno possui livro em atraso.'; end if;
  select max_active_loans,loan_days into v_limit,v_days from public.library_settings where id=true;
  if (select count(*) from public.loans where reader_id=v_hold.reader_id and status='active')>=v_limit then
    raise exception 'Este aluno atingiu o limite de emprestimos.';
  end if;
  select c.id into v_copy from public.book_copies c
    where c.book_id=v_hold.book_id
      and not exists(select 1 from public.loans l where l.copy_id=c.id and l.status='active')
    order by c.created_at,c.id for update of c skip locked limit 1;
  if v_copy is null then raise exception 'Nenhum exemplar livre. Mantenha o aluno na fila de espera.'; end if;
  update public.holds set status='approved',resolved_at=now() where id=p_hold_id;
  insert into public.loans(hold_id,reader_id,book_id,copy_id,due_at)
    values(v_hold.id,v_hold.reader_id,v_hold.book_id,v_copy,now()+make_interval(days=>v_days))
    returning id into v_loan_id;
  insert into public.notifications(recipient_id,title,body)
    values(v_hold.reader_id,'Emprestimo aprovado','Seu pedido foi aprovado. Confira a data de devolucao em Meus livros.');
  return v_loan_id;
end;
$$;

create or replace function public.reject_hold(p_hold_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_reader uuid;
begin
  if not public.is_staff() then raise exception 'Acesso restrito a biblioteca.'; end if;
  update public.holds set status='rejected',resolved_at=now()
    where id=p_hold_id and status='pending' returning reader_id into v_reader;
  if v_reader is null then raise exception 'Solicitacao pendente nao encontrada.'; end if;
  insert into public.notifications(recipient_id,title,body)
    values(v_reader,'Solicitacao nao aprovada','Consulte a biblioteca para saber mais detalhes.');
end;
$$;

create or replace function public.return_loan(p_loan_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_reader uuid;
begin
  if not public.is_staff() then raise exception 'Acesso restrito a biblioteca.'; end if;
  update public.loans set status='returned',returned_at=now()
    where id=p_loan_id and status='active' returning reader_id into v_reader;
  if v_reader is null then raise exception 'Emprestimo ativo nao encontrado.'; end if;
  insert into public.notifications(recipient_id,title,body)
    values(v_reader,'Devolucao registrada','O livro foi devolvido. Obrigado por cuidar do acervo!');
end;
$$;

create or replace function public.request_renewal(p_loan_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_loan public.loans%rowtype; v_id uuid;
begin
  select * into v_loan from public.loans where id=p_loan_id and reader_id=auth.uid() and status='active';
  if not found then raise exception 'Emprestimo ativo nao encontrado.'; end if;
  if v_loan.due_at<now() then raise exception 'Livros atrasados nao podem ser renovados online.'; end if;
  if exists(select 1 from public.renewal_requests where loan_id=p_loan_id and status='pending') then
    raise exception 'Ja existe um pedido de renovacao pendente.';
  end if;
  insert into public.renewal_requests(loan_id,reader_id) values(p_loan_id,auth.uid()) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.resolve_renewal(p_request_id uuid,p_approve boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare v_req public.renewal_requests%rowtype; v_loan public.loans%rowtype; v_days integer;
begin
  if not public.is_staff() then raise exception 'Acesso restrito a biblioteca.'; end if;
  select * into v_req from public.renewal_requests where id=p_request_id for update;
  if not found or v_req.status<>'pending' then raise exception 'Renovacao ja resolvida.'; end if;
  select * into v_loan from public.loans where id=v_req.loan_id for update;
  if p_approve then
    if v_loan.status<>'active' or v_loan.due_at<now() then
      raise exception 'Nao e possivel renovar emprestimo devolvido ou atrasado.';
    end if;
    if exists(select 1 from public.holds where book_id=v_loan.book_id and status='pending' and reader_id<>v_loan.reader_id) then
      raise exception 'Ha alunos na fila de espera. Recuse a renovacao para atender a fila.';
    end if;
    select loan_days into v_days from public.library_settings where id=true;
    update public.loans set due_at=due_at+make_interval(days=>v_days),renewals_count=renewals_count+1 where id=v_loan.id;
  end if;
  update public.renewal_requests set status=case when p_approve then 'approved' else 'rejected' end,resolved_at=now()
    where id=p_request_id;
  insert into public.notifications(recipient_id,title,body)
    values(v_req.reader_id,case when p_approve then 'Renovacao aprovada' else 'Renovacao recusada' end,
           case when p_approve then 'Veja a nova data em Meus livros.' else 'Entregue o livro na data prevista.' end);
end;
$$;

-- Restrinja funcao de privilegios e RPCs a usuarios autenticados.
revoke all on function public.handle_new_user() from public,anon,authenticated;
revoke all on function public.is_staff() from public,anon;
revoke all on function public.is_admin() from public,anon;
revoke all on function public.claim_staff_invite() from public,anon;
revoke all on function public.request_book(uuid) from public,anon;
revoke all on function public.cancel_hold(uuid) from public,anon;
revoke all on function public.approve_hold(uuid) from public,anon;
revoke all on function public.reject_hold(uuid) from public,anon;
revoke all on function public.return_loan(uuid) from public,anon;
revoke all on function public.request_renewal(uuid) from public,anon;
revoke all on function public.resolve_renewal(uuid,boolean) from public,anon;
grant execute on function public.is_staff(),public.is_admin(),public.claim_staff_invite(),public.request_book(uuid),public.cancel_hold(uuid),public.approve_hold(uuid),public.reject_hold(uuid),public.return_loan(uuid),public.request_renewal(uuid),public.resolve_renewal(uuid,boolean) to authenticated;
