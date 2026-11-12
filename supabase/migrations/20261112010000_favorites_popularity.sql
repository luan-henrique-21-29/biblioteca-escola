-- Etapa 5: favoritos privados por aluno e ranking agregado de títulos emprestados.
-- Executar depois de 20261112000000_initial.sql, inclusive em instalações existentes.
create table if not exists public.favorites (
  reader_id uuid not null references public.profiles(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (reader_id, book_id)
);
create index if not exists favorites_recent_idx on public.favorites(reader_id,created_at desc);
alter table public.favorites enable row level security;

revoke all on public.favorites from public, anon, authenticated;
grant select,insert,delete on public.favorites to authenticated;

drop policy if exists favorites_read_own on public.favorites;
create policy favorites_read_own on public.favorites for select to authenticated
  using (reader_id = (select auth.uid()));

drop policy if exists favorites_add_own on public.favorites;
create policy favorites_add_own on public.favorites for insert to authenticated
  with check (
    reader_id = (select auth.uid())
    and exists(select 1 from public.profiles p where p.id = (select auth.uid()) and p.role='reader')
  );

drop policy if exists favorites_remove_own on public.favorites;
create policy favorites_remove_own on public.favorites for delete to authenticated
  using (reader_id = (select auth.uid()));

-- Apenas retorna livros e QUANTIDADES de empréstimos, nunca dados de alunos.
-- Função com limite explícito para não permitir consultas arbitrariamente grandes.
create or replace function public.popular_books(p_limit integer default 8)
returns table(book_id uuid, loan_count bigint)
language sql stable security definer set search_path = ''
as $$
  select l.book_id, count(*)::bigint as loan_count
  from public.loans l
  inner join public.books b on b.id = l.book_id
  where (select auth.uid()) is not null
  group by l.book_id
  order by loan_count desc, l.book_id
  limit greatest(1, least(coalesce(p_limit,8),12));
$$;

revoke all on function public.popular_books(integer) from public, anon, authenticated;
grant execute on function public.popular_books(integer) to authenticated;
