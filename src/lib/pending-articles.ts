export interface PendingArticle {
  id: string;
  title: string;
  status: "em-avaliacao" | "aprovado" | "rejeitado";
  submittedAt: number;
}

const storageKey = "lire.pending-articles";
const legacyStorageKey = "lire.pending-article";

export function listPendingArticles() {
  try {
    const stored = localStorage.getItem(storageKey);
    const parsed = stored ? JSON.parse(stored) : [];
    const articles = Array.isArray(parsed) ? parsed : [];
    const legacy = localStorage.getItem(legacyStorageKey);

    if (legacy && articles.length === 0) {
      const legacyArticle = JSON.parse(legacy);
      if (legacyArticle?.title) {
        return [normalizeArticle(legacyArticle)];
      }
    }

    return articles.filter((article) => article?.status !== "aprovado" && article?.status !== "rejeitado")
      .map(normalizeArticle);
  } catch {
    return [];
  }
}

export function savePendingArticle(title: string) {
  const articles = listPendingArticles();
  const article: PendingArticle = {
    id: crypto.randomUUID(),
    title,
    status: "em-avaliacao",
    submittedAt: Date.now(),
  };
  localStorage.setItem(storageKey, JSON.stringify([...articles, article]));
  window.dispatchEvent(new Event("lire:pending-articles-changed"));
  return article;
}

function normalizeArticle(article: Partial<PendingArticle>): PendingArticle {
  return {
    id: article.id ?? crypto.randomUUID(),
    title: article.title ?? "Artigo sem título",
    status: article.status ?? "em-avaliacao",
    submittedAt: article.submittedAt ?? Date.now(),
  };
}
