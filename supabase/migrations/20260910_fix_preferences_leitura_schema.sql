-- =====================================================
-- Recria a tabela de preferências de leitura do Lire
-- no formato já identificado no Supabase do usuário
-- =====================================================

create table if not exists public.preferencias_leitura (
  id uuid primary key default gen_random_uuid(),
  id_usuario uuid not null unique references auth.users(id) on delete cascade,
  fonte text not null default 'DM Sans',
  tamanho_fonte integer not null default 20,
  espacamento_linha integer not null default 180,
  modo_tema text not null default 'escuro' check (modo_tema in ('escuro', 'alto')),
  modo_foco boolean not null default false,
  velocidade_tts integer not null default 100,
  atualizado_em timestamptz not null default now()
);

alter table public.preferencias_leitura enable row level security;

drop policy if exists "preferencias_leitura_select_own" on public.preferencias_leitura;
drop policy if exists "preferencias_leitura_insert_own" on public.preferencias_leitura;
drop policy if exists "preferencias_leitura_update_own" on public.preferencias_leitura;
drop policy if exists "preferencias_leitura_delete_own" on public.preferencias_leitura;

create policy "preferencias_leitura_select_own"
  on public.preferencias_leitura
  for select
  using (auth.uid() = id_usuario);

create policy "preferencias_leitura_insert_own"
  on public.preferencias_leitura
  for insert
  with check (auth.uid() = id_usuario);

create policy "preferencias_leitura_update_own"
  on public.preferencias_leitura
  for update
  using (auth.uid() = id_usuario)
  with check (auth.uid() = id_usuario);

create policy "preferencias_leitura_delete_own"
  on public.preferencias_leitura
  for delete
  using (auth.uid() = id_usuario);

-- Avisa ao cliente que o campo de data de atualização precisa ser do tipo “agora”.
create or replace function public.touch_preferencias_leitura_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_preferencias_leitura_updated_at on public.preferencias_leitura;
create trigger trg_touch_preferencias_leitura_updated_at
before update on public.preferencias_leitura
for each row execute procedure public.touch_preferencias_leitura_updated_at();
