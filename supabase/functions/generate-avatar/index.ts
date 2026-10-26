// Edge function: genera un'immagine avatar vestita con i capi selezionati,
// usando il modello Gemini per la generazione di immagini.
// Nota: la generazione di immagini richiede un modello Gemini che supporti
// l'output immagini (gemini-2.5-flash-image o equivalente). Se il modello
// non è disponibile, restituisce uno stato chiaro.

import {
  corsHeaders,
  getGeminiConfig,
  describeError,
  jsonReply,
  GEMINI_IMAGE_MODEL,
} from "../_shared/gemini.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const cfg = getGeminiConfig();
    if (!cfg.configured) {
      return jsonReply({ configured: false, error: cfg.error });
    }

    const { garments, occasion, styleNote } = await req.json();
    if (!Array.isArray(garments) || garments.length === 0) {
      return jsonReply({ configured: true, error: "Nessun capo selezionato per la prova virtuale." }, 400);
    }

    const garmentsDesc = garments
      .map((g: { name: string; category: string; color: string }) => `${g.color} ${g.name} (${g.category})`)
      .join(", ");

    const prompt =
      "Genera un'immagine fotorealistica di una persona che indossa questo outfit: " +
      garmentsDesc +
      ". Occasione: " + (occasion || "tempo libero") + ". " +
      (styleNote ? "Nota di stile: " + styleNote + ". " : "") +
      "La persona deve indossare esattamente i capi descritti, con colori fedeli. " +
      "Stile: foto di moda a figura intera, sfondo neutro, illuminazione naturale.";

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent?key=${cfg.apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
          responseModalities: ["IMAGE", "TEXT"],
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return jsonReply({ configured: true, error: describeError(res.status, errText) }, 502);
    }

    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((p: { inlineData?: { data: string; mimeType: string } }) => p.inlineData?.data);

    if (!imagePart) {
      return jsonReply({
        configured: true,
        error:
          "Il modello non ha restituito un'immagine. Verifica che il modello " + GEMINI_IMAGE_MODEL + " sia abilitato per la generazione di immagini nel tuo progetto Google AI.",
      }, 502);
    }

    const imageBase64 = imagePart.inlineData.data;
    const mimeType = imagePart.inlineData.mimeType || "image/png";

    return jsonReply({
      configured: true,
      result: {
        imageBase64: `data:${mimeType};base64,${imageBase64}`,
        mimeType,
      },
    });
  } catch (err) {
    return jsonReply({ configured: true, error: (err as Error).message }, 500);
  }
});
