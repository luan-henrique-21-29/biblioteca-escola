-- Metadados verificáveis da edição ODILO: capa exata, ficha individual e origem.
-- Acesso público permanece read-only sob RLS das recomendações.
alter table public.digital_reading_recommendations
 add column if not exists cover_url text,
 add column if not exists individual_link_verified_at timestamptz,
 add column if not exists cover_verified_at timestamptz,
 add column if not exists isbn text,
 add column if not exists source_catalog_url text;

alter table public.digital_reading_recommendations drop constraint if exists verified_odilo_book_sources;
alter table public.digital_reading_recommendations add constraint verified_odilo_book_sources check(
 individual_link_verified_at is null or (
 platform='Leia Paraná'
 and access_url ~ '^https://leiaparana[.]odilo[.]us/info/[A-Za-z0-9_%.-]+$'
 and cover_url ~ '^https://covers[.]odilo[.]io/'
 and cover_verified_at is not null
 and source_catalog_url='https://leiaparana.odilo.us/'
 ));

create unique index if not exists digital_reading_verified_leia_url_uniq
on public.digital_reading_recommendations(access_url)
where platform='Leia Paraná' and individual_link_verified_at is not null;
