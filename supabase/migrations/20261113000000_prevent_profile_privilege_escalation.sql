-- Impede que alunos alterem role/email no próprio perfil via API pública.
-- Alterações de papel são permitidas apenas a funções internas SECURITY DEFINER,
-- que executam como proprietário e verificam permissões.
create or replace function public.prevent_profile_privilege_escalation()
returns trigger language plpgsql set search_path = '' as $$
begin
  if current_user in ('postgres','supabase_admin') then return new; end if;
  if new.id is distinct from old.id or new.role is distinct from old.role or new.email is distinct from old.email then
    raise exception 'Papel, identificador e e-mail não podem ser alterados pelo perfil.';
  end if;
  return new;
end;
$$;
drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role before update on public.profiles
for each row execute function public.prevent_profile_privilege_escalation();
