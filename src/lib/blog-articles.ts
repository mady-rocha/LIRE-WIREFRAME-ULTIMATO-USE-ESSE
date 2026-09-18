export interface BlogArticle {
  slug: string;
  title: string;
  cat: "Dislexia" | "TDAH" | "Autismo" | "Surdez";
  author: string;
  date: string;
  source: string;
  summary: string;
  paragraphs: string[];
}

export const catColor: Record<BlogArticle["cat"], string> = {
  Dislexia: "bg-primary/15 text-accent",
  TDAH: "bg-secondary/15 text-secondary",
  Autismo: "bg-brand-blue-light/15 text-brand-navy",
  Surdez: "bg-accent/15 text-accent",
};

export const articles: BlogArticle[] = [];

export function findArticle(slug: string) {
  return articles.find((article) => article.slug === slug);
}
