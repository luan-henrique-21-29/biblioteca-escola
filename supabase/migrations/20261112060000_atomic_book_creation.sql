-- Biblioteca Joaquim — cadastro atômico do livro e primeiro exemplar.
-- Execute APÓS a migração 20261112050000_featured_books.sql.
-- Esta função evita títulos sem exemplar caso o código numérico já exista.

create or replace function public.create_book_with_copy(
  p_title text,p_author text,p_genre text,p_synopsis text,
  p_cover_url text,p_published_year integer,p_copy_code text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_book_id uuid;
begin
  if auth.uid() is null or not public.is_staff() then
    raise exception 'Somente bibliotecarios autorizados podem cadastrar livros.';
  end if;
  if p_title is null or length(trim(p_title)) not between 1 and 200 then
    raise exception 'O titulo precisa ter de 1 a 200 caracteres.';
  end if;
  if p_author is null or length(trim(p_author)) not between 1 and 200 then
    raise exception 'O autor precisa ter de 1 a 200 caracteres.';
  end if;
  if p_genre is null or length(trim(p_genre)) not between 1 and 100 then
    raise exception 'O genero precisa ter de 1 a 100 caracteres.';
  end if;
  if length(coalesce(p_synopsis,''))>2000 then
    raise exception 'A sinopse nao pode ultrapassar 2000 caracteres.';
  end if;
  if p_published_year is not null and (p_published_year<0 or p_published_year>2100) then
    raise exception 'Ano de publicacao invalido.';
  end if;
  if p_copy_code is null or p_copy_code !~ '^[0-9]{1,32}$' then
    raise exception 'O codigo do exemplar deve ter entre 1 e 32 digitos.';
  end if;
  if p_cover_url is not null and trim(p_cover_url)<>'' and
      (length(p_cover_url)>2000 or p_cover_url !~* '^https?://[^[:space:]]+$') then
    raise exception 'URL da capa invalida. Use um link http(s).';
  end if;
  -- A chave única de book_copies.code protege contra exemplares repetidos.
  -- Se falhar o INSERT do exemplar, o INSERT do título é desfeito na mesma transação.
  insert into public.books(title,author,genre,synopsis,cover_url,published_year)
    values(trim(p_title),trim(p_author),trim(p_genre),coalesce(trim(p_synopsis),''),
      nullif(trim(p_cover_url),''),p_published_year)
    returning id into v_book_id;
  insert into public.book_copies(book_id,code)
    values(v_book_id,p_copy_code);
  return v_book_id;
end;
$$;

revoke all on function public.create_book_with_copy(text,text,text,text,text,integer,text)
  from public,anon,authenticated;
grant execute on function public.create_book_with_copy(text,text,text,text,text,integer,text)
  to authenticated;
