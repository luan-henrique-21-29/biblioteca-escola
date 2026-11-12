-- Etapa 7: proteção de permissões e lembretes de devolução.
-- Execute após 20261112020000_search_queue_import.sql.

-- O aluno não pode solicitar um segundo exemplar do título que já está usando.
create or replace function public.request_book(p_book_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_limit integer; v_count integer;
begin
  if auth.uid() is null or not exists(select 1 from public.profiles where id=auth.uid() and role='reader') then
    raise exception 'Somente alunos podem solicitar livros.';
  end if;
  if not exists(select 1 from public.book_copies where book_id=p_book_id) then
    raise exception 'Este livro nao possui exemplar cadastrado.';
  end if;
  if exists(select 1 from public.loans where reader_id=auth.uid() and status='active' and due_at<now()) then
    raise exception 'Voce possui livro em atraso. Regularize a devolucao primeiro.';
  end if;
  if exists(select 1 from public.loans where reader_id=auth.uid() and book_id=p_book_id and status='active') then
    raise exception 'Voce ja esta com um exemplar deste livro.';
  end if;
  select max_active_loans into v_limit from public.library_settings where id=true;
  select count(*) into v_count from public.loans where reader_id=auth.uid() and status='active';
  if v_count>=v_limit then raise exception 'Limite de emprestimos ativos atingido.'; end if;
  if exists(select 1 from public.holds where book_id=p_book_id and reader_id=auth.uid() and status='pending') then
    raise exception 'Voce ja possui uma solicitacao pendente deste titulo.';
  end if;
  insert into public.holds(reader_id,book_id) values(auth.uid(),p_book_id) returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.request_book(uuid) from public,anon,authenticated;
grant execute on function public.request_book(uuid) to authenticated;

-- Lembretes quando o estudante visita / atualiza a biblioteca, sem dados de outros estudantes.
create or replace function public.sync_due_notifications()
returns integer language plpgsql security definer set search_path = '' as $$
declare v_count integer:=0;
begin
  if auth.uid() is null then return 0; end if;
  with upcoming as (
    select l.reader_id,
      case when l.due_at < now() then 'Livro em atraso: ' else 'Devolucao proxima: ' end
        || left(b.title,120) as title,
      'Data da devolucao: '||to_char(l.due_at at time zone 'America/Sao_Paulo','DD/MM/YYYY')
        || '. Confira Meus livros.' as body
    from public.loans l join public.books b on b.id=l.book_id
    where l.reader_id=auth.uid() and l.status='active'
      and l.due_at < now()+interval '3 days'
  )
  insert into public.notifications(recipient_id,title,body)
  select u.reader_id,u.title,u.body
  from upcoming u where not exists(
    select 1 from public.notifications n
    where n.recipient_id=u.reader_id and n.title=u.title
      and n.body=u.body and n.created_at>now()-interval '24 hours'
  );
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
revoke all on function public.sync_due_notifications() from public,anon,authenticated;
grant execute on function public.sync_due_notifications() to authenticated;

-- Administrador pode cancelar convites e retirar permissões de bibliotecários.
-- A permissão é revogada no banco na mesma transação.
create or replace function public.admin_revoke_librarian(p_invite_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_staff uuid; v_email text;
begin
  if not public.is_admin() then raise exception 'Somente administradores podem revogar acessos.'; end if;
  select claimed_by,email into v_staff,v_email
    from public.staff_invites where id=p_invite_id for update;
  if not found then raise exception 'Convite nao encontrado.'; end if;
  if v_staff is not null then
    update public.profiles set role='reader' where id=v_staff and role='librarian';
    insert into public.notifications(recipient_id,title,body)
      values(v_staff,'Acesso de bibliotecario encerrado','Um administrador encerrou seu acesso de funcionario.');
  end if;
  delete from public.staff_invites where id=p_invite_id;
end;
$$;
revoke all on function public.admin_revoke_librarian(uuid) from public,anon,authenticated;
grant execute on function public.admin_revoke_librarian(uuid) to authenticated;
