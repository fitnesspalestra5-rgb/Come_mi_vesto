// Edge function: genera una proposta di outfit a partire dai capi posseduti,
// dall'occasione e dal contesto meteo usando Gemini.

import {
  corsHeaders,
  getGeminiConfig,
  geminiTextJson,
  jsonReply,
  GEMINI_TEXT_MODEL,
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

    const { garments, occasion, weather } = await req.json();
    if (!Array.isArray(garments) || garments.length === 0) {
      return jsonReply({ configured: true, error: "Nessun capo disponibile per comporre l'outfit." }, 400);
    }

    const garmentsText = garments
      .map((g: { id: string; name: string; category: string; color: string }) => `- id:${g.id} | ${g.name} (${g.category}, ${g.color})`)
      .join("\n");

    const prompt =
      "Sei uno stylist personale. Componi un outfit usando SOLO i capi elencati, preferendo le combinazioni reali disponibili. " +
      "Occasione: " + (occasion || "tempo libero") + ". Contesto meteo: " + (weather || "non specificato") + ".\n\n" +
      "Capi disponibili:\n" + garmentsText + "\n\n" +
      "Restituisci SOLO un oggetto JSON: " +
      '{"name": nome outfit, "occasion": occasione, "items": [{"garment_id": id, "role": ruolo tra top/bottom/outer/shoes/accessory}], ' +
      '"reason": breve spiegazione in italiano di perché funziona, "tips": consiglio accessorio opzionale}. ' +
      "Scegli almeno 2-4 capi se disponibili.";

    const result = await geminiTextJson(cfg.apiKey!, GEMINI_TEXT_MODEL, prompt, 600);
    if (!result.ok) {
      return jsonReply({ configured: true, error: result.error }, 502);
    }

    return jsonReply({ configured: true, result: result.json });
  } catch (err) {
    return jsonReply({ configured: true, error: (err as Error).message }, 500);
  }
});
