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
      .map((g: { id: string; name: string; category: string; color: string; avatar_section?: string | null; season?: string | null; material?: string | null }) => `- id:${g.id} | ${g.name} (${g.category}, colore ${g.color}, stagione ${g.season ?? 'non indicata'}, materiale ${g.material ?? 'non indicato'}, sezione: ${g.avatar_section ?? 'busto'})`)
      .join("\n");

    const prompt =
      "Sei uno stylist personale esperto. Componi un outfit usando SOLO i capi elencati, senza inventarne altri e senza citare capi mancanti. " +
      "Valuta ogni abbinamento per: occasione, coordinamento dei colori (evita accostamenti che stonano), tipologia dei capi (sopra, sotto, eventuale esterno, scarpe, accessori), stagione e materiale coerenti, compatibilità tra gli indumenti. " +
      "Ogni capo va usato al massimo una volta. Se i capi sono pochi, usa quelli disponibili anche se l'outfit è incompleto. " +
      "Occasione: " + (occasion || "tempo libero") + ". Contesto meteo: " + (weather || "non specificato") + ".\n\n" +
      "Capi disponibili:\n" + garmentsText + "\n\n" +
      "Restituisci SOLO un oggetto JSON: " +
      '{"name": nome outfit, "occasion": occasione, "items": [{"garment_id": id, "role": ruolo tra top/bottom/outer/shoes/accessory}], ' +
      '"reason": spiegazione in italiano in 2-4 frasi di come i capi si abbinano per colore, tipologia, stagione e materiale, "tips": consiglio opzionale che usa solo i capi elencati}. ' +
      "Scegli da 1 a 4 capi, quelli che servono davvero.";

    const result = await geminiTextJson(cfg.apiKey!, GEMINI_TEXT_MODEL, prompt, 1024);
    if (!result.ok) {
      return jsonReply({ configured: true, error: result.error }, 502);
    }

    return jsonReply({ configured: true, result: result.json });
  } catch (err) {
    return jsonReply({ configured: true, error: (err as Error).message }, 500);
  }
});
