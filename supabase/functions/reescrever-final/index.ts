const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { glosa } = await req.json();
    const groqApiKey = Deno.env.get("GROQ_API_KEY");
    const groqModel = Deno.env.get("GROQ_MODEL") ?? "openai/gpt-oss-120b";

    if (!glosa || typeof glosa !== "string") {
      return new Response(JSON.stringify({ erro: "campo 'glosa' obrigatorio" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!groqApiKey) {
      return new Response(JSON.stringify({ erro: "GROQ_API_KEY nao configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resposta = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: groqModel,
        messages: [
          {
            role: "system",
            content:
              "Voce transforma glosas de Libras (palavras soltas na ordem gramatical da Libras) " +
              "em portugues natural, mantendo o sentido original. Responda apenas com a frase natural, sem explicacao.",
          },
          { role: "user", content: `Glosa: ${glosa}` },
        ],
      }),
    });

    if (!resposta.ok) {
      const detalhe = await resposta.text();
      return new Response(JSON.stringify({ erro: "falha na API do Groq", detalhe }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resposta.json();
    const texto = data.choices?.[0]?.message?.content?.trim() ?? "";

    return new Response(JSON.stringify({ texto }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ erro: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
