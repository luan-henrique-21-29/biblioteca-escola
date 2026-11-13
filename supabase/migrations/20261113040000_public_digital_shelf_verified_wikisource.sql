-- Metadados bibliográficos públicos sem acesso a dados pessoais.
alter table public.digital_reading_recommendations enable row level security;
revoke all on public.digital_reading_recommendations from anon;
grant select on public.digital_reading_recommendations to anon;
drop policy if exists digital_reading_public_select on public.digital_reading_recommendations;
create policy digital_reading_public_select on public.digital_reading_recommendations
for select to anon using (is_active = true);

-- Obras em domínio público. Links verificados em 13/11/2026.
insert into public.digital_reading_recommendations(id,title,author,note,platform,access_url,is_active)
overriding system value
values
(101,'Dom Casmurro','Machado de Assis','Romance brasileiro · 1899. Texto integral disponível para leitura gratuita no Wikisource.','Wikisource','https://pt.wikisource.org/wiki/Anexo:Imprimir/Dom_Casmurro',true),
(102,'Iracema','José de Alencar','Romance indianista · 1865. Edição em domínio público com capítulos no Wikisource.','Wikisource','https://pt.wikisource.org/wiki/Iracema',true),
(103,'O Alienista','Machado de Assis','Novela clássica · 1882. Leia os capítulos gratuitamente no Wikisource.','Wikisource','https://pt.wikisource.org/wiki/O_Alienista',true),
(104,'A Cartomante','Machado de Assis','Conto brasileiro · 1884. Texto integral disponível gratuitamente.','Wikisource','https://pt.wikisource.org/wiki/A_Cartomante',true),
(105,'A Moreninha','Joaquim Manuel de Macedo','Romance brasileiro · edição de 1860. Texto digital em domínio público.','Wikisource','https://pt.wikisource.org/wiki/A_Moreninha_(1860)',true),
(106,'Memórias Póstumas de Brás Cubas','Machado de Assis','Romance brasileiro · 1881. Leitura integral disponível no Wikisource.','Wikisource','https://pt.wikisource.org/wiki/Anexo:Imprimir/Mem%C3%B3rias_P%C3%B3stumas_de_Br%C3%A1s_Cubas',true)
on conflict(id) do update set title=excluded.title,author=excluded.author,note=excluded.note,
platform=excluded.platform,access_url=excluded.access_url,is_active=excluded.is_active;
