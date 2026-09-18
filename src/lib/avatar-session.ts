import { supabase, supabaseConfigurado } from "@/lib/supabase";

type SalvarSessaoAvatarResult =
  | { ok: true }
  | {
      ok: false;
      reason: "supabase_unconfigured" | "unauthenticated" | "insert_failed";
      message: string;
      error?: unknown;
    };

export async function salvarSessaoAvatar(texto: string): Promise<SalvarSessaoAvatarResult> {
  const textoNaturalizado = texto.trim();

  if (!supabaseConfigurado) {
    return {
      ok: false,
      reason: "supabase_unconfigured",
      message: "Supabase ainda nao configurado",
    };
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    return {
      ok: false,
      reason: "unauthenticated",
      message: "usuario nao autenticado - sessao nao foi salva",
      error: userError,
    };
  }

  const agora = new Date().toISOString();
  const { error } = await supabase.from("sessao_libras").insert({
    id_usuario: userData.user.id,
    inicio: agora,
    fim: agora,
    tipo: "traducao",
    glosa_original: null,
    texto_naturalizado: textoNaturalizado,
  });

  if (error) {
    return {
      ok: false,
      reason: "insert_failed",
      message: "nao deu pra salvar a sessao, mas o avatar continua funcionando",
      error,
    };
  }

  return { ok: true };
}
