import { supabase } from "@/lib/supabase";

export type ReadingThemeMode = "claro" | "escuro" | "alto";

export interface ReadingPreferences {
  fonte: string;
  tamanho_fonte: number;
  espacamento_linha: number;
  modo_tema: ReadingThemeMode;
  modo_foco: boolean;
  velocidade_tts: number;
}

export const readingPreferencesStorageKey = "lire.reading-preferences";

export const defaultReadingPreferences: ReadingPreferences = {
  fonte: "DM Sans",
  tamanho_fonte: 20,
  espacamento_linha: 180,
  modo_tema: "claro",
  modo_foco: false,
  velocidade_tts: 100,
};

function normalizeTheme(mode: unknown): ReadingThemeMode {
  if (mode === "alto" || mode === "escuro" || mode === "claro") return mode;
  return defaultReadingPreferences.modo_tema;
}

function normalizeNumber(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return fallback;
}

function normalizeBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeFont(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

export function readLocalReadingPreferences(): ReadingPreferences {
  try {
    const raw = localStorage.getItem(readingPreferencesStorageKey);
    if (!raw) return { ...defaultReadingPreferences };

    const parsed = JSON.parse(raw) as Partial<ReadingPreferences>;
    return {
      fonte: normalizeFont(parsed.fonte, defaultReadingPreferences.fonte),
      tamanho_fonte: normalizeNumber(parsed.tamanho_fonte, defaultReadingPreferences.tamanho_fonte),
      espacamento_linha: normalizeNumber(parsed.espacamento_linha, defaultReadingPreferences.espacamento_linha),
      modo_tema: normalizeTheme(parsed.modo_tema),
      modo_foco: normalizeBoolean(parsed.modo_foco, defaultReadingPreferences.modo_foco),
      velocidade_tts: normalizeNumber(parsed.velocidade_tts, defaultReadingPreferences.velocidade_tts),
    };
  } catch {
    return { ...defaultReadingPreferences };
  }
}

export function writeLocalReadingPreferences(preferences: ReadingPreferences) {
  localStorage.setItem(readingPreferencesStorageKey, JSON.stringify(preferences));
}

async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.warn("Não foi possível recuperar a sessão do Supabase para preferências de leitura:", error);
      return null;
    }
    return data.session?.user?.id ?? null;
  } catch (error) {
    console.warn("Falha ao consultar a sessão do Supabase para preferências de leitura:", error);
    return null;
  }
}

function normalizeFromRow(row: Record<string, unknown> | null): ReadingPreferences | null {
  if (!row) return null;

  return {
    fonte: normalizeFont(row.fonte, defaultReadingPreferences.fonte),
    tamanho_fonte: normalizeNumber(row.tamanho_fonte, defaultReadingPreferences.tamanho_fonte),
    espacamento_linha: normalizeNumber(row.espacamento_linha, defaultReadingPreferences.espacamento_linha),
    modo_tema: normalizeTheme(row.modo_tema),
    modo_foco: normalizeBoolean(row.modo_foco, defaultReadingPreferences.modo_foco),
    velocidade_tts: normalizeNumber(row.velocidade_tts, defaultReadingPreferences.velocidade_tts),
  };
}

export async function loadReadingPreferencesFromSupabase(): Promise<ReadingPreferences | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const attempts = [
    {
      table: "preferencias_leitura",
      column: "id_usuario",
      select: "fonte, tamanho_fonte, espacamento_linha, modo_tema, modo_foco, velocidade_tts",
    },
    {
      table: "usuario",
      column: "id",
      select: "fonte, tamanho_fonte, espacamento_linha, modo_tema, modo_foco, velocidade_tts",
    },
  ];

  for (const attempt of attempts) {
    try {
      const { data, error } = await supabase
        .from(attempt.table)
        .select(attempt.select)
        .eq(attempt.column, userId)
        .maybeSingle();

      if (!error && data) {
        const normalized = normalizeFromRow(data as Record<string, unknown>);
        if (normalized) return normalized;
      }
    } catch {
      // Ignore table mismatch and continue trying the fallback table.
    }
  }

  return null;
}

export async function saveReadingPreferencesToSupabase(preferences: ReadingPreferences) {
  const userId = await getCurrentUserId();
  if (!userId) {
    writeLocalReadingPreferences(preferences);
    return;
  }

  const directUserPayload = {
    fonte: preferences.fonte,
    tamanho_fonte: preferences.tamanho_fonte,
    espacamento_linha: preferences.espacamento_linha,
    modo_tema: preferences.modo_tema,
    modo_foco: preferences.modo_foco,
    velocidade_tts: preferences.velocidade_tts,
  };

  const preferenceTablePayloads = [
    {
      table: "preferencias_leitura",
      conflict: "id_usuario",
      payload: {
        id_usuario: userId,
        fonte: preferences.fonte,
        tamanho_fonte: preferences.tamanho_fonte,
        espacamento_linha: preferences.espacamento_linha,
        modo_tema: preferences.modo_tema,
        modo_foco: preferences.modo_foco,
        velocidade_tts: preferences.velocidade_tts,
      },
    },
    {
      table: "usuario",
      payload: directUserPayload,
    },
  ];

  for (const target of preferenceTablePayloads) {
    try {
      const query = supabase.from(target.table);
      const { error } = target.table === "usuario"
        ? await query.update(target.payload).eq("id", userId)
        : await query.upsert(target.payload, { onConflict: "id_usuario" });

      if (!error) {
        writeLocalReadingPreferences(preferences);
        return;
      }

      console.warn(`Falha ao salvar preferências em ${target.table}.`, error);
    } catch (error) {
      console.warn(`Falha ao salvar preferências em ${target.table}.`, error);
    }
  }

  console.error("Não foi possível salvar preferências de leitura no Supabase.", { userId, preferences });
  writeLocalReadingPreferences(preferences);
}
