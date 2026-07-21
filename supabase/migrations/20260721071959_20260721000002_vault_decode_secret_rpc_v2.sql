-- Allow edge functions (service role) to read a named secret from the vault.
-- Uses the same pgsodium decryption the vault.create_secret function uses.
create or replace function public.vault_decode_secret(secret_name text)
returns text
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  rec record;
  decrypted bytea;
begin
  select * into rec from vault.secrets where name = secret_name limit 1;
  if not found then
    return null;
  end if;

  decrypted := vault._crypto_aead_det_decrypt(
    message := decode(rec.secret, 'base64'),
    additional := convert_to(rec.id::text, 'utf8'),
    key_id := 0,
    context := 'pgsodium'::bytea,
    nonce := rec.nonce
  );

  return convert_from(decrypted, 'utf8');
end;
$$;

revoke all on function public.vault_decode_secret(text) from anon, authenticated;
grant execute on function public.vault_decode_secret(text) to service_role;
