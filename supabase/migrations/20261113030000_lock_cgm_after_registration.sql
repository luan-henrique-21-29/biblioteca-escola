create or replace function public.prevent_profile_privilege_escalation()
returns trigger language plpgsql set search_path = '' as $$
begin
 if current_user in ('postgres','supabase_admin') then return new; end if;
 if new.id is distinct from old.id or new.role is distinct from old.role or new.email is distinct from old.email then
   raise exception 'Papel, identificador e e-mail não podem ser alterados pelo perfil.';
 end if;
 if old.enrollment_number is not null and new.enrollment_number is distinct from old.enrollment_number then
   raise exception 'CGM não pode ser alterado pelo aluno. Procure a biblioteca.';
 end if;
 return new;
end;
$$;