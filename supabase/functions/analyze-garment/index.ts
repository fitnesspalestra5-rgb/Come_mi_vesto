// Edge function: riconosce tipo di capo e colori da una foto usando Gemini.
// Backend sicuro: la chiave GEMINI_API_KEY resta lato server.

import {
  corsHeaders,
  getGeminiConfig,
  geminiVisionJson,
  jsonReply,
  GEMINI_VISION_MODEL,
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

    const { imageBase64 } = await req.json();
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return jsonReply({ configured: true, error: "Immagine mancante nel corpo della richiesta." }, 400);
    }

    const prompt =
      "Sei un assistente di moda. Analizza la foto di un capo di abbigliamento e restituisci SOLO un oggetto JSON con questi campi: " +
      '{"name": breve nome del capo in italiano, "category": una tra ["maglia","maglione","camicia","felpa","giacca","cappotto","pantalone","jeans","gonna","vestito","scarpe","accessorio"], ' +
      '"colors": array di 1-3 nomi di colore in italiano, "color_hex": esadecimale del colore dominante, "notes": breve nota stylist in italiano}.';

    const result = await geminiVisionJson(cfg.apiKey!, GEMINI_VISION_MODEL, prompt, imageBase64, "image/jpeg", 400);
    if (!result.ok) {
      return jsonReply({ configured: true, error: result.error }, 502);
    }

    return jsonReply({ configured: true, result: result.json });
  } catch (err) {
    return jsonReply({ configured: true, error: (err as Error).message }, 500);
  }
});
