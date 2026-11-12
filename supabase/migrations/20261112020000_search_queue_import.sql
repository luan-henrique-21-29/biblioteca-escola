-- Etapa 6: posição pessoal na fila, avisos de disponibilidade e importação de livros.
-- Execute APÓS 20261112010000_favorites_popularity.sql.

-- O aluno só vê a posição de seus próprios pedidos, sem dados dos outros leitores.
create or replace function public.my_hold_queue()
returns table(hold_id uuid, position integer, total_waiting integer, available_copies integer)
language sql stable security definer set search_path = ''
as $$
  with queue as (
    select h.id, h.reader_id, h.book_id,
      row_number() over(partition by h.book_id order by h.requested_at, h.id)::integer as place,
      count(*) over(partition by h.book_id)::integer as people_waiting
    from public.holds h
    where h.status = 'pending'
  )
  select q.id, q.place, q.people_waiting, coalesce(inv.free,0)::integer
  from queue q
  left join public.book_inventory inv on inv.book_id = q.book_id
  where q.reader_id = (select auth.uid());
$$;
revoke all on function public.my_hold_queue() from public,anon,authenticated;
grant execute on function public.my_hold_queue() to authenticated;

-- Notifica apenas as primeiras pessoas da fila alcançadas pelos exemplares livres.
-- Evita alertas repetidos do mesmo título no período de 24 horas.
create or replace function public.notify_waitlist_available(p_book_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  v_free integer;
  v_title text;
begin
  select coalesce(inv.free,0) into v_free
  from public.book_inventory inv where inv.book_id=p_book_id;
  if coalesce(v_free,0)<1 then return; end if;
  select b.title into v_title from public.books b where b.id=p_book_id;
  if v_title is null then return; end if;

  insert into public.notifications(recipient_id,title,body)
  select ranked.reader_id, 'Livro disponível: '||left(v_title,130),
    'Há exemplar disponível para sua posição na fila. A retirada depende da aprovação do bibliotecário.'
  from (
    select h.reader_id,
      row_number() over(order by h.requested_at,h.id) as place
    from public.holds h
    where h.book_id=p_book_id and h.status='pending'
  ) ranked
  where ranked.place<=v_free
    and not exists (
      select 1 from public.notifications n
      where n.recipient_id=ranked.reader_id
        and n.title='Livro disponível: '||left(v_title,130)
        and n.created_at>now()-interval '24 hours'
    );
end;
$$;
revoke all on function public.notify_waitlist_available(uuid) from public,anon,authenticated;

-- Aviso ao receber novos exemplares (cadastro manual ou por planilha).
create or replace function public.on_copy_added_notify_waitlist()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  perform public.notify_waitlist_available(new.book_id);
  return new;
end;
$$;
drop trigger if exists copy_added_notify_waitlist on public.book_copies;
create trigger copy_added_notify_waitlist
after insert on public.book_copies
for each row execute function public.on_copy_added_notify_waitlist();
revoke all on function public.on_copy_added_notify_waitlist() from public,anon,authenticated;

-- Sobrescreve a função de devolução para avisar a fila assim que um exemplar for liberado.
create or replace function public.return_loan(p_loan_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  v_reader uuid;
  v_book uuid;
begin
  if not public.is_staff() then raise exception 'Acesso restrito a biblioteca.'; end if;
  update public.loans set status='returned',returned_at=now()
    where id=p_loan_id and status='active'
    returning reader_id,book_id into v_reader,v_book;
  if v_reader is null then raise exception 'Emprestimo ativo nao encontrado.'; end if;
  insert into public.notifications(recipient_id,title,body)
    values(v_reader,'Devolucao registrada','O livro foi devolvido. Obrigado por cuidar do acervo!');
  perform public.notify_waitlist_available(v_book);
end;
$$;
revoke all on function public.return_loan(uuid) from public,anon,authenticated;
grant execute on function public.return_loan(uuid) to authenticated;

-- Importação atômica em uma única transação. Cada linha é um exemplar.
-- Permissão reforçada no servidor, limite de 200 e validação independente do navegador.
create or replace function public.bulk_import_books(p_rows jsonb)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_row jsonb;
  v_code text;
  v_title text;
  v_author text;
  v_genre text;
  v_synopsis text;
  v_year_str text;
  v_year integer;
  v_cover text;
  v_book_id uuid;
  v_created integer := 0;
  v_added integer := 0;
begin
  if not public.is_staff() then raise exception 'Somente bibliotecarios podem importar livros.'; end if;
  if p_rows is null or jsonb_typeof(p_rows)<>'array' then
    raise exception 'Arquivo deve conter uma lista de livros.';
  end if;
  if jsonb_array_length(p_rows)<1 or jsonb_array_length(p_rows)>200 then
    raise exception 'Informe entre 1 e 200 exemplares por importacao.';
  end if;

  -- Serializa importações concorrentes para evitar duplicações de títulos.
  perform pg_catalog.pg_advisory_xact_lock(659001);

  for v_row in select value from jsonb_array_elements(p_rows)
  loop
    if jsonb_typeof(v_row)<>'object' then raise exception 'Linha de importacao invalida.'; end if;
    v_code:=trim(coalesce(v_row->>'codigo',''));
    v_title:=trim(coalesce(v_row->>'titulo',''));
    v_author:=trim(coalesce(v_row->>'autor',''));
    v_genre:=trim(coalesce(v_row->>'genero',''));
    v_synopsis:=trim(coalesce(v_row->>'sinopse',''));
    v_year_str:=trim(coalesce(v_row->>'ano',''));
    v_cover:=nullif(trim(coalesce(v_row->>'capa','')),'');
    v_year:=null;
    if v_code !~ '^[0-9]{1,32}$' then raise exception 'Codigo do exemplar invalido: %',v_code; end if;
    if length(v_title)<1 or length(v_title)>200 then raise exception 'Titulo invalido para o codigo %.',v_code; end if;
    if length(v_author)<1 or length(v_author)>200 then raise exception 'Autor invalido para o codigo %.',v_code; end if;
    if length(v_genre)<1 or length(v_genre)>100 then raise exception 'Genero invalido para o codigo %.',v_code; end if;
    if length(v_synopsis)>2000 then raise exception 'Sinopse excede 2000 caracteres: %',v_code; end if;
    if v_year_str<>'' then
      if v_year_str !~ '^[0-9]{1,4}$' then raise exception 'Ano invalido: %',v_year_str; end if;
      v_year:=v_year_str::integer;
      if v_year>2100 then raise exception 'Ano invalido: %',v_year; end if;
    end if;
    if v_cover is not null and (length(v_cover)>2000 or v_cover !~* '^https?://[^[:space:]]+$') then
      raise exception 'URL da capa invalida para o codigo %.',v_code;
    end if;
    if exists(select 1 from public.book_copies where code=v_code) then
      raise exception 'Codigo de exemplar ja cadastrado: %',v_code;
    end if;

    select b.id into v_book_id
    from public.books b
    where lower(b.title)=lower(v_title) and lower(b.author)=lower(v_author)
    order by b.created_at,b.id limit 1;
    if v_book_id is null then
      insert into public.books(title,author,genre,synopsis,published_year,cover_url)
      values(v_title,v_author,v_genre,v_synopsis,v_year,v_cover)
      returning id into v_book_id;
      v_created:=v_created+1;
    end if;
    insert into public.book_copies(book_id,code)
    values(v_book_id,v_code);
    v_added:=v_added+1;
  end loop;
  return jsonb_build_object('created_books',v_created,'added_copies',v_added);
end;
$$;
revoke all on function public.bulk_import_books(jsonb) from public,anon,authenticated;
grant execute on function public.bulk_import_books(jsonb) to authenticated;
