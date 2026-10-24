-- Quando o último membro sai (ou apaga a conta), o caderno some junto com os treinos.
create function public.drop_empty_tenant()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.tenants t
  where t.id = old.tenant_id
    and not exists (select 1 from public.tenant_members m where m.tenant_id = old.tenant_id);
  return null;
end;
$$;

revoke execute on function public.drop_empty_tenant() from public, anon, authenticated;

create trigger tenant_members_cleanup
  after delete on public.tenant_members
  for each row execute function public.drop_empty_tenant();
