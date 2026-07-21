-- Allow edge functions (service role) to read a named secret from the vault
-- without exposing it to anon/authenticated clients.
create or replace function public.vault_decode_secret(secret_name text)
returns text
language plpgsql
security definer
set search_path = public, vault, extensions
as $$
declare
  decoded text;
begin
  select vault.decrypted_secret into decoded
  from vault.secrets
  where name = secret_name
  limit 1;

  if decoded is null then
    return null;
  end if;

  return decoded;
end;
$$;

-- Restrict: only service role can call this (edge functions use service role key)
revoke all on function public.vault_decode_secret(text) from anon, authenticated;
grant execute on function public.vault_decode_secret(text) to service_role;
