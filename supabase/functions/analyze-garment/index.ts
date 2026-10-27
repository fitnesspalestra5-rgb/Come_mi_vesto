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
      "Sei un assistente di moda. Analizza la foto del capo. Se nell'immagine è visibile una didascalia, un titolo o testo descrittivo sotto la foto, usalo come riferimento principale per nome e categoria invece di fare inferenze non necessarie. " +
      "Restituisci esclusivamente JSON valido con esattamente questi campi e nessun altro: " +
      '{"nome":"nome del capo ricavato prima dalla didascalia visibile e poi dall\'immagine",' +
      '"categoria":"una tra Maglia / T-shirt, Camicia, Giacca / Blazer, Felpa / Maglione, Pantalone, Jeans, Shorts, Scarpe / Sneakers, Accessorio",' +
      '"colore":"colore primario in italiano",' +
      '"stagione":"una tra Primavera/Estate, Autunno/Inverno, Quattro stagioni",' +
      '"materiale":"uno tra Cotone, Lino, Denim, Lana, Poliestere, Misto, Pelle / Camoscio",' +
      '"sezione_avatar":"busto", "gambe" oppure "scarpe"}.';

    const result = await geminiVisionJson(cfg.apiKey!, GEMINI_VISION_MODEL, prompt, imageBase64, "image/jpeg", 400);
    if (!result.ok) {
      return jsonReply({ configured: true, error: result.error }, 502);
    }

    return jsonReply({ configured: true, result: result.json });
  } catch (err) {
    return jsonReply({ configured: true, error: (err as Error).message }, 500);
  }
});
