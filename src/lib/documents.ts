import { supabase } from "@/lib/supabase";

export type DocumentType = "pdf" | "txt";

export interface SavedDocument {
  id: string;
  name: string;
  type: DocumentType;
  content: string;
  updatedAt: number;
  progress: number;
}

export interface SupabaseDocumentRow {
  id: string;
  id_usuario: string;
  nome_arquivo: string;
  caminho_local: string | null;
  data_importacao: string;
  formato: string;
}

const databaseName = "lire-documents-v2";
const databaseVersion = 1;
const storeName = "documents";
const progressStorageKey = "lire.document-progress";

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(storeName)) {
        database.createObjectStore(storeName, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function normalizeType(value: string | null | undefined): DocumentType {
  return value?.toLowerCase() === "pdf" ? "pdf" : "txt";
}

function readProgressMap(): Record<string, number> {
  try {
    const raw = localStorage.getItem(progressStorageKey);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function writeProgressMap(progressMap: Record<string, number>) {
  localStorage.setItem(progressStorageKey, JSON.stringify(progressMap));
}

function getStoredProgress(id: string) {
  return readProgressMap()[id] ?? 0;
}

function setStoredProgress(id: string, progress: number) {
  const progressMap = readProgressMap();
  progressMap[id] = Math.max(0, Math.min(100, progress));
  writeProgressMap(progressMap);
}

async function getCurrentUserId() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

async function syncDocumentToSupabase(savedDocument: SavedDocument) {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const { error } = await supabase.from("documento").upsert(
    {
      id: savedDocument.id,
      id_usuario: userId,
      nome_arquivo: savedDocument.name,
      caminho_local: savedDocument.id,
      formato: savedDocument.type,
      data_importacao: new Date(savedDocument.updatedAt).toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) {
    console.error("Não foi possível sincronizar o documento com o Supabase.", error);
  }
}

export async function saveDocument(document: Omit<SavedDocument, "id" | "updatedAt">) {
  const savedDocument: SavedDocument = {
    ...document,
    id: crypto.randomUUID(),
    updatedAt: Date.now(),
    progress: 0,
  };

  const database = await openDatabase();

  return new Promise<SavedDocument>((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).put(savedDocument);
    transaction.oncomplete = async () => {
      database.close();
      try {
        await syncDocumentToSupabase(savedDocument);
        resolve(savedDocument);
      } catch (error) {
        reject(error);
      }
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  });
}

export async function updateDocumentProgress(id: string, progress: number) {
  const database = await openDatabase();
  setStoredProgress(id, progress);

  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    const request = transaction.objectStore(storeName).get(id);
    request.onsuccess = () => {
      const document = request.result as SavedDocument | undefined;
      if (document) transaction.objectStore(storeName).put({ ...document, progress });
    };
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  });
}

export async function listDocuments() {
  const userId = await getCurrentUserId();

  if (!userId) {
    const localDocuments = await listLocalDocuments();
    return localDocuments;
  }

  const { data, error } = await supabase
    .from("documento")
    .select("*")
    .eq("id_usuario", userId)
    .order("data_importacao", { ascending: false });

  if (error) {
    console.error("Não foi possível listar documentos do Supabase.", error);
    return listLocalDocuments();
  }

  const rows = (data ?? []) as SupabaseDocumentRow[];

  const documents = await Promise.all(
    rows.map(async (row) => {
      const localDocument = await getDocument(row.id);
      return {
        id: row.id,
        name: row.nome_arquivo,
        type: normalizeType(row.formato),
        content: localDocument?.content ?? "",
        updatedAt: new Date(row.data_importacao).getTime(),
        progress: localDocument?.progress ?? getStoredProgress(row.id),
      } satisfies SavedDocument;
    }),
  );

  return documents.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function listLocalDocuments() {
  const database = await openDatabase();

  return new Promise<SavedDocument[]>((resolve, reject) => {
    const request = database.transaction(storeName, "readonly").objectStore(storeName).getAll();
    request.onsuccess = () => {
      database.close();
      resolve(
        (request.result as SavedDocument[])
          .map((row) => ({ ...row, progress: row.progress ?? getStoredProgress(row.id) }))
          .sort((a, b) => b.updatedAt - a.updatedAt),
      );
    };
    request.onerror = () => {
      database.close();
      reject(request.error);
    };
  });
}

export async function getDocument(id: string) {
  const database = await openDatabase();

  return new Promise<SavedDocument | undefined>((resolve, reject) => {
    const request = database.transaction(storeName, "readonly").objectStore(storeName).get(id);
    request.onsuccess = () => {
      database.close();
      const result = request.result as SavedDocument | undefined;
      if (!result) {
        resolve(undefined);
        return;
      }

      resolve({ ...result, progress: result.progress ?? getStoredProgress(id) });
    };
    request.onerror = () => {
      database.close();
      reject(request.error);
    };
  });
}

export async function deleteDocument(id: string) {
  const database = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).delete(id);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  });

  const progressMap = readProgressMap();
  delete progressMap[id];
  writeProgressMap(progressMap);

  const userId = await getCurrentUserId();
  if (!userId) return;

  const { error } = await supabase.from("documento").delete().eq("id", id).eq("id_usuario", userId);
  if (error) {
    console.error("Não foi possível remover o documento do Supabase.", error);
    throw error;
  }
}
