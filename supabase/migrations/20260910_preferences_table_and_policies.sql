-- ================================================
-- Tabela de preferências de leitura separada
-- ================================================
create table if not exists public.preferencias_leitura (
  id uuid primary key default gen_random_uuid(),
  id_usuario uuid not null references auth.users(id) on delete cascade,
  fonte text not null default 'DM Sans',
  tamanho_fonte integer not null default 20,
  espacamento_linha integer not null default 180,
  modo_tema text not null default 'escuro' check (modo_tema in ('escuro', 'alto')),
  modo_foco boolean not null default false,
  velocidade_tts integer not null default 100,
  atualizado_em timestamptz not null default now(),
  unique (id_usuario)
);

-- ================================================
-- RLS
-- ================================================
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

-- ================================================
-- Opcional: amostra de upsert do usuário logado
-- ================================================
-- insert into public.preferencias_leitura (id_usuario, fonte, tamanho_fonte, espacamento_linha, modo_tema, modo_foco, velocidade_tts)
-- values (auth.uid(), 'DM Sans', 20, 180, 'escuro', false, 100)
-- on conflict (id_usuario) do update set
--   fonte = excluded.fonte,
--   tamanho_fonte = excluded.tamanho_fonte,
--   espacamento_linha = excluded.espacamento_linha,
--   modo_tema = excluded.modo_tema,
--   modo_foco = excluded.modo_foco,
--   velocidade_tts = excluded.velocidade_tts,
--   atualizado_em = now();
