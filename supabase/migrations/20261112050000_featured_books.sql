-- Destaques editoriais de livros escolhidos pelo bibliotecário.
-- Execute depois de 20261112040000_circulation.sql.
alter table public.books add column if not exists featured boolean not null default false;
create index if not exists books_featured_idx on public.books(featured,created_at desc) where featured = true;
