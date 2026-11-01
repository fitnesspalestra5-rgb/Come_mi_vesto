// Edge function: riconosce tipo di capo e colori da una foto usando Gemini.
// Backend sicuro: la chiave GEMINI_API_KEY resta lato server.

import {
  corsHeaders,
  getGeminiConfig,
  geminiVisionJson,
  jsonReply,
  GEMINI_VISION_MODEL,
  type VisionExample,
} from "../_shared/gemini.ts";
import { REFERENCE_CATEGORIES, REFERENCES } from "./references.ts";

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

// Un solo esempio per categoria: abbastanza per guidare il riconoscimento senza inviare tutta la libreria.
async function loadExamples(): Promise<VisionExample[]> {
  const baseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const refs = REFERENCE_CATEGORIES.map((category) => REFERENCES.find((r) => r.category === category)!);

  return Promise.all(
    refs.map(async (ref) => {
      const res = await fetch(`${baseUrl}/storage/v1/object/ai-references/${ref.file}`, {
        headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey },
      });
      if (!res.ok) throw new Error(`Esempio di riferimento non disponibile: ${ref.file} (${res.status})`);
      return {
        label: `Esempio di riferimento: ${ref.category}`,
        data: toBase64(new Uint8Array(await res.arrayBuffer())),
      };
    })
  );
}

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
      "Sei un assistente di moda. Prima della foto da analizzare ricevi alcuni esempi di riferimento, ciascuno introdotto da un'etichetta con la categoria corretta: usali solo per riconoscere il tipo di capo, non come capi dell'utente. " +
      "Analizza la foto del capo. Se nell'immagine è visibile una didascalia, un titolo o testo descrittivo sotto la foto, usalo come riferimento principale per nome e categoria invece di fare inferenze non necessarie. " +
      "Restituisci esclusivamente JSON valido con esattamente questi campi e nessun altro: " +
      '{"nome":"nome del capo ricavato prima dalla didascalia visibile e poi dall\'immagine",' +
      '"categoria":"una tra Maglia / T-shirt, Camicia, Giacca / Blazer, Felpa / Maglione, Pantalone, Jeans, Shorts, Scarpe / Sneakers, Accessorio",' +
      '"colore":"colore primario in italiano",' +
      '"stagione":"una tra Primavera/Estate, Autunno/Inverno, Quattro stagioni",' +
      '"materiale":"uno tra Cotone, Lino, Denim, Lana, Poliestere, Misto, Pelle / Camoscio",' +
      '"sezione_avatar":"busto", "gambe" oppure "scarpe"}.';

    const examples = await loadExamples();
    const result = await geminiVisionJson(
      cfg.apiKey!,
      GEMINI_VISION_MODEL,
      prompt,
      imageBase64,
      "image/jpeg",
      1024,
      examples
    );
    if (!result.ok) {
      return jsonReply({ configured: true, error: result.error }, 502);
    }

    return jsonReply({ configured: true, result: result.json });
  } catch (err) {
    return jsonReply({ configured: true, error: (err as Error).message }, 500);
  }
});
