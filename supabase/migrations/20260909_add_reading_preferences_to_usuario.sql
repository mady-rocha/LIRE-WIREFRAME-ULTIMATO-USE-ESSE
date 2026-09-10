ALTER TABLE public.usuario
  ADD COLUMN IF NOT EXISTS fonte text NOT NULL DEFAULT 'DM Sans',
  ADD COLUMN IF NOT EXISTS tamanho_fonte integer NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS espacamento_linha integer NOT NULL DEFAULT 180,
  ADD COLUMN IF NOT EXISTS modo_tema text NOT NULL DEFAULT 'escuro' CHECK (modo_tema IN ('escuro', 'alto')),
  ADD COLUMN IF NOT EXISTS modo_foco boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS velocidade_tts integer NOT NULL DEFAULT 100;
