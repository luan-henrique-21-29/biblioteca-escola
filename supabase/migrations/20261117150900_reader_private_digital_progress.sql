-- Guardar listas pessoais de livros digitais sem acesso cruzado entre alunos.
-- Supabase Auth continua por email/senha; aqui não existe nenhum dado público de estudante.
create table if not exists public.digital_reading_progress (
 user_id uuid not null references auth.users(id) on delete cascade,
 book_id bigint not null references public.digital_reading_recommendations(id) on delete cascade,
 status text not null check(status in ('quero_ler','lendo','lido')),
 updated_at timestamptz not null default now(),
 primary key(user_id,book_id)
);
create index if not exists digital_reading_progress_user_status_idx
 on public.digital_reading_progress(user_id,status,updated_at desc);
alter table public.digital_reading_progress enable row level security;
revoke all on public.digital_reading_progress from public,anon;
grant select,insert,update,delete on public.digital_reading_progress to authenticated;
drop policy if exists digital_progress_select_own on public.digital_reading_progress;
create policy digital_progress_select_own on public.digital_reading_progress for select to authenticated
 using ((select auth.uid())=user_id);
drop policy if exists digital_progress_insert_own on public.digital_reading_progress;
create policy digital_progress_insert_own on public.digital_reading_progress for insert to authenticated
 with check ((select auth.uid())=user_id);
drop policy if exists digital_progress_update_own on public.digital_reading_progress;
create policy digital_progress_update_own on public.digital_reading_progress for update to authenticated
 using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
drop policy if exists digital_progress_delete_own on public.digital_reading_progress;
create policy digital_progress_delete_own on public.digital_reading_progress for delete to authenticated
 using ((select auth.uid())=user_id);
