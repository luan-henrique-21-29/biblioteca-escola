-- Matrícula/CGM declarada pelo aluno, sem comprovação automática de vínculo.
alter table public.profiles add column if not exists enrollment_number text;
alter table public.profiles add constraint profiles_enrollment_format check (enrollment_number is null or enrollment_number ~ '^[0-9]{6,12}$');
create unique index if not exists profiles_enrollment_unique on public.profiles(enrollment_number) where enrollment_number is not null;
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_enrollment text;
begin
  v_enrollment:=nullif(trim(coalesce(new.raw_user_meta_data->>'enrollment_number','')),'');
  if v_enrollment is not null and v_enrollment !~ '^[0-9]{6,12}$' then raise exception 'Numero de matricula invalido.'; end if;
  insert into public.profiles(id,email,full_name,classroom,enrollment_number,role)
  values(new.id,lower(coalesce(new.email,'')),
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'),''),nullif(trim(new.raw_user_meta_data->>'name'),''),split_part(coalesce(new.email,''),'@',1)),
    coalesce(nullif(trim(new.raw_user_meta_data->>'classroom'),''),''),
    v_enrollment,'reader');
  return new;
end;
$$;
create table if not exists public.digital_reading_recommendations (
 id bigint generated always as identity primary key,title text not null,author text not null,
 note text not null default '',platform text not null default 'Leia Paraná',
 access_url text not null default 'https://leiaparana.odilo.us/',
 is_active boolean not null default true,created_at timestamptz not null default now()
);
alter table public.digital_reading_recommendations enable row level security;
create policy digital_reading_select on public.digital_reading_recommendations for select to authenticated using(is_active=true or public.is_staff());
create policy digital_reading_staff_insert on public.digital_reading_recommendations for insert to authenticated with check(public.is_staff());
create policy digital_reading_staff_update on public.digital_reading_recommendations for update to authenticated using(public.is_staff()) with check(public.is_staff());
create policy digital_reading_staff_delete on public.digital_reading_recommendations for delete to authenticated using(public.is_staff());
insert into public.digital_reading_recommendations(title,author,note)
values ('O Mágico de Oz','L. Frank Baum','Entre as obras mais acessadas no Leia Paraná em 2026.'),
 ('A Ilha do Tesouro','Robert Louis Stevenson','Entre as obras mais acessadas no Leia Paraná em 2026.'),
 ('Alice no País das Maravilhas','Lewis Carroll','Apresentada entre as novidades de 2026.'),
 ('Memórias Póstumas de Brás Cubas','Machado de Assis','Título divulgado oficialmente no catálogo do Leia Paraná.'),
 ('Iracema','José de Alencar','Título divulgado oficialmente no catálogo do Leia Paraná.'),
 ('A Volta ao Mundo em 80 Dias','Júlio Verne','Obra citada oficialmente entre os clássicos do Leia Paraná.');
