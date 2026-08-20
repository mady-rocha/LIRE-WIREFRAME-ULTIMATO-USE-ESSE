export interface BlogArticle {
  slug: string;
  title: string;
  cat: "Dislexia" | "TDAH" | "Autismo" | "Surdez";
  author: string;
  date: string;
  summary: string;
  paragraphs: string[];
}

export const catColor: Record<BlogArticle["cat"], string> = {
  Dislexia: "bg-primary/15 text-accent",
  TDAH: "bg-secondary/15 text-secondary",
  Autismo: "bg-brand-blue-light/15 text-brand-navy",
  Surdez: "bg-accent/15 text-accent",
};

export const articles: BlogArticle[] = [
  {
    slug: "tipografia-e-leitura-na-dislexia",
    title: "Como a tipografia afeta a leitura na dislexia",
    cat: "Dislexia",
    author: "Dra. Helena Costa",
    date: "12 mai 2025",
    summary: "Espaçamento, fontes e contraste que reduzem o esforço de leitura.",
    paragraphs: [
      "A tipografia pode transformar a experiência de leitura. Para pessoas com dislexia, escolhas como uma fonte bem desenhada, espaçamento generoso e linhas mais curtas ajudam a reduzir o esforço visual.",
      "O contraste também importa. Texto escuro sobre um fundo claro, sem excesso de elementos ao redor, facilita a localização das palavras e torna a leitura mais previsível.",
      "Não existe uma configuração única para todas as pessoas. O mais importante é oferecer opções para que cada leitor encontre o ritmo e a combinação visual que funcionam melhor.",
    ],
  },
  {
    slug: "foco-e-atencao-para-tdah",
    title: "Foco e atenção: estratégias práticas para TDAH",
    cat: "TDAH",
    author: "Anônimo",
    date: "03 mai 2025",
    summary: "Técnicas de leitura por blocos e pausas estruturadas.",
    paragraphs: [
      "Manter a atenção durante uma leitura longa pode ser mais fácil quando o conteúdo é dividido em blocos pequenos e objetivos.",
      "Pausas planejadas, marcadores visuais e um ambiente com menos distrações ajudam a retomar o texto sem perder o contexto.",
      "Experimente alternar períodos curtos de leitura com momentos de descanso. A regularidade costuma ser mais útil do que tentar ler tudo de uma vez.",
    ],
  },
  {
    slug: "comunicacao-previsivel-no-espectro-autista",
    title: "Comunicação previsível e o espectro autista",
    cat: "Autismo",
    author: "Marcos Lima",
    date: "28 abr 2025",
    summary: "Por que a clareza visual importa tanto.",
    paragraphs: [
      "Uma apresentação previsível ajuda o leitor a entender o que esperar de cada parte do conteúdo. Títulos claros e uma hierarquia visual consistente reduzem a carga de interpretação.",
      "Evitar mudanças inesperadas de formato também pode tornar a leitura mais confortável. Elementos repetidos devem manter a mesma posição e aparência sempre que possível.",
      "A acessibilidade funciona melhor quando oferece clareza sem retirar do leitor o controle sobre sua experiência.",
    ],
  },
  {
    slug: "libras-na-pratica",
    title: "Libras na prática: primeiros sinais do dia a dia",
    cat: "Surdez",
    author: "Comunidade Lire",
    date: "20 abr 2025",
    summary: "Um guia introdutório para ouvintes.",
    paragraphs: [
      "Aprender Libras é também aprender uma nova forma de se relacionar com a comunidade surda. O primeiro passo é buscar materiais confiáveis e respeitar a cultura e a identidade de cada pessoa.",
      "Sinais básicos podem ajudar em situações cotidianas, mas a comunicação acessível vai além de memorizar palavras: envolve atenção visual, paciência e disposição para aprender.",
      "A prática constante e o contato com pessoas surdas tornam o aprendizado mais significativo e responsável.",
    ],
  },
];

export function findArticle(slug: string) {
  return articles.find((article) => article.slug === slug);
}
