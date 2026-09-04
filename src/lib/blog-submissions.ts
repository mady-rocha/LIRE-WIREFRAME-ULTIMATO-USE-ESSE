import { supabase } from "@/lib/supabase";
import type { BlogArticle } from "@/lib/blog-articles";

export type SubmissionStatus = "pendente" | "aprovado" | "rejeitado";

export interface ArticleSubmission {
  id: string;
  id_usuario: string;
  titulo: string;
  corpo: string;
  referencias: string | null;
  categoria: string;
  justificativa_recusa: string | null;
  status: SubmissionStatus;
  data_envio: string;
  anonimo: boolean;
}

export interface PublishedArticleRow {
  id: string;
  id_admin: string | null;
  titulo: string;
  corpo: string;
  referencias: string | null;
  categoria: string;
  status: string;
  data_envio: string;
}

export async function createArticleSubmission(input: {
  titulo: string;
  corpo: string;
  referencias: string;
  categoria: string;
  anonimo: boolean;
}) {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) throw new Error("Você precisa estar logado para enviar um artigo.");

  const { error } = await supabase.from("submissao_artigo").insert({
    id_usuario: userId,
    titulo: input.titulo,
    corpo: input.corpo,
    referencias: input.referencias || null,
    categoria: input.categoria,
    anonimo: input.anonimo,
    status: "pendente",
  });

  if (error) throw error;
}

export async function listArticleSubmissions() {
  const { data, error } = await supabase
    .from("submissao_artigo")
    .select("id, id_usuario, titulo, corpo, referencias, categoria, justificativa_recusa, status, data_envio, anonimo")
    .eq("status", "pendente")
    .order("data_envio", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ArticleSubmission[];
}

export async function approveArticleSubmission(submission: ArticleSubmission) {
  const { data: sessionData } = await supabase.auth.getSession();
  const adminId = sessionData.session?.user.id ?? null;

  const { error: publishError } = await supabase.from("artigo_blog").insert({
    id_admin: adminId,
    titulo: submission.titulo,
    corpo: submission.corpo,
    referencias: submission.referencias,
    categoria: submission.categoria,
    status: "publicado",
  });

  if (publishError) throw publishError;

  const { error: updateError } = await supabase
    .from("submissao_artigo")
    .update({ status: "aprovado" })
    .eq("id", submission.id);

  if (updateError) throw updateError;
}

export async function rejectArticleSubmission(id: string) {
  const { error } = await supabase
    .from("submissao_artigo")
    .update({ status: "rejeitado" })
    .eq("id", id);

  if (error) throw error;
}

export async function listPublishedArticleRows() {
  const { data, error } = await supabase
    .from("artigo_blog")
    .select("id, id_admin, titulo, corpo, referencias, categoria, status, data_envio")
    .eq("status", "publicado")
    .order("data_envio", { ascending: false });

  if (error) throw error;
  return (data ?? []) as PublishedArticleRow[];
}

export function publishedRowToBlogArticle(row: PublishedArticleRow): BlogArticle {
  const category = ["Dislexia", "TDAH", "Autismo", "Surdez"].includes(row.categoria)
    ? (row.categoria as BlogArticle["cat"])
    : "Dislexia";
  const paragraphs = row.corpo.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);

  return {
    slug: `community-${row.id}`,
    title: row.titulo,
    cat: category,
    author: "Comunidade Lire",
    date: new Date(row.data_envio).toLocaleDateString("pt-BR"),
    source: row.referencias || "Conteúdo enviado pela comunidade Lire",
    summary: paragraphs[0]?.slice(0, 160) || row.titulo,
    paragraphs: paragraphs.length > 0 ? paragraphs : [row.corpo],
  };
}
