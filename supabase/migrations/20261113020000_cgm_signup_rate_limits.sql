create table if not exists public.cgm_signup_limits(fingerprint text primary key,window_started timestamptz not null default now(),attempts integer not null default 0);
alter table public.cgm_signup_limits enable row level security;
revoke all on public.cgm_signup_limits from anon,authenticated;
create or replace function public.consume_cgm_signup_limit(p_fingerprint text)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare v_count integer;
begin
 if p_fingerprint is null or length(p_fingerprint)<>64 then return false; end if;
 insert into public.cgm_signup_limits(fingerprint,window_started,attempts) values(p_fingerprint,now(),1)
 on conflict(fingerprint) do update
 set attempts=case when public.cgm_signup_limits.window_started<now()-interval '1 hour' then 1 else public.cgm_signup_limits.attempts+1 end,
 window_started=case when public.cgm_signup_limits.window_started<now()-interval '1 hour' then now() else public.cgm_signup_limits.window_started end
 returning attempts into v_count;
 return v_count<=5;
end;
$$;
revoke all on function public.consume_cgm_signup_limit(text) from public,anon,authenticated;
grant execute on function public.consume_cgm_signup_limit(text) to service_role;