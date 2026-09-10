-- Remove legacy field no longer used by the reader.
ALTER TABLE public.usuario
  DROP COLUMN IF EXISTS espacamento_letra;

-- Ensure the profile table participates in Supabase RLS.
ALTER TABLE public.usuario
  ENABLE ROW LEVEL SECURITY;

-- Keep the migration idempotent when re-applied from the SQL editor.
DROP POLICY IF EXISTS "usuario_read_own_profile" ON public.usuario;
DROP POLICY IF EXISTS "usuario_insert_own_profile" ON public.usuario;
DROP POLICY IF EXISTS "usuario_update_own_profile" ON public.usuario;

-- Allow the logged-in user to read only their own profile row.
CREATE POLICY "usuario_read_own_profile"
  ON public.usuario
  FOR SELECT
  USING (auth.uid() = id);

-- Allow the logged-in user to create their own profile row.
CREATE POLICY "usuario_insert_own_profile"
  ON public.usuario
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow the logged-in user to update only their own profile row.
CREATE POLICY "usuario_update_own_profile"
  ON public.usuario
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
