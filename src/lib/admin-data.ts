export interface GestureSuggestion {
  id: string;
  name: string;
  description: string;
  submittedBy: string;
  status: "pendente" | "aprovado" | "rejeitado";
  submittedAt: number;
}

export interface ImplementedGesture {
  id: string;
  name: string;
  description: string;
  category: string;
  createdAt: number;
}

export interface AdminBlogPost {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  source: string;
  createdAt: number;
}

const gestureKey = "lire.admin.gesture-suggestions";
const implementedGestureKey = "lire.admin.implemented-gestures";
const blogKey = "lire.admin.blog-posts";

const initialSuggestions: GestureSuggestion[] = [
  {
    id: "gesture-suggestion-1",
    name: "Obrigado",
    description: "Movimento para expressar agradecimento em situações do dia a dia.",
    submittedBy: "Comunidade Lire",
    status: "pendente",
    submittedAt: Date.now(),
  },
  {
    id: "gesture-suggestion-2",
    name: "Biblioteca",
    description: "Sinal para facilitar conversas sobre espaços de leitura.",
    submittedBy: "Rafael Santos",
    status: "pendente",
    submittedAt: Date.now(),
  },
];

function read<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event("lire:admin-data-changed"));
}

export function listGestureSuggestions() {
  return read(gestureKey, initialSuggestions);
}

export function updateGestureSuggestion(id: string, status: GestureSuggestion["status"]) {
  write(gestureKey, listGestureSuggestions().map((item) => item.id === id ? { ...item, status } : item));
}

export function listImplementedGestures() {
  return read<ImplementedGesture[]>(implementedGestureKey, []);
}

export function saveImplementedGesture(gesture: Omit<ImplementedGesture, "id" | "createdAt">) {
  const item = { ...gesture, id: crypto.randomUUID(), createdAt: Date.now() };
  write(implementedGestureKey, [...listImplementedGestures(), item]);
  return item;
}

export function listAdminBlogPosts() {
  return read<AdminBlogPost[]>(blogKey, []);
}

export function saveAdminBlogPost(post: Omit<AdminBlogPost, "id" | "createdAt">) {
  const item = { ...post, id: crypto.randomUUID(), createdAt: Date.now() };
  write(blogKey, [...listAdminBlogPosts(), item]);
  return item;
}