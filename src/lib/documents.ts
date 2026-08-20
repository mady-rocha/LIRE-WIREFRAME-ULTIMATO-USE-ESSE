export type DocumentType = "pdf" | "txt";

export interface SavedDocument {
  id: string;
  name: string;
  type: DocumentType;
  content: string;
  updatedAt: number;
  progress: number;
}

const databaseName = "lire-documents-v2";
const databaseVersion = 1;
const storeName = "documents";

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
    transaction.oncomplete = () => {
      database.close();
      resolve(savedDocument);
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  });
}

export async function updateDocumentProgress(id: string, progress: number) {
  const database = await openDatabase();

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
  const database = await openDatabase();

  return new Promise<SavedDocument[]>((resolve, reject) => {
    const request = database.transaction(storeName, "readonly").objectStore(storeName).getAll();
    request.onsuccess = () => {
      database.close();
      resolve((request.result as SavedDocument[]).sort((a, b) => b.updatedAt - a.updatedAt));
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
      resolve(request.result as SavedDocument | undefined);
    };
    request.onerror = () => {
      database.close();
      reject(request.error);
    };
  });
}
