// Edge function: riconosce il colore principale di una foto e genera 8 abbinamenti.
import {
  corsHeaders,
  getGeminiConfig,
  geminiVisionJson,
  jsonReply,
  GEMINI_VISION_MODEL,
} from "../_shared/gemini.ts";

interface ColorEntry {
  name: string;
  hex: string;
}

interface ColorResult {
  detected: ColorEntry;
  matches: ColorEntry[];
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

    const { imageBase64, mimeType } = await req.json();
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return jsonReply({ configured: true, error: "Manca l'immagine da analizzare." }, 400);
    }

    const prompt =
      "Sei un esperto di colore e abbinamenti per la moda. Analizza la foto e identifica il colore dominante dell'oggetto (non lo sfondo). " +
      "Restituisci SOLO un oggetto JSON con questa struttura: " +
      '{"detected": {"name": "nome colore in italiano", "hex": "#rrggbb"}, ' +
      '"matches": [{"name": "nome colore in italiano", "hex": "#rrggbb"}, ...]}. ' +
      "Il campo matches deve contenere ESATTAMENTE 8 colori che si abbinano bene al colore rilevato. " +
      "Scegli accostamenti armonici e pratici per abbigliamento: toni simili, complementari, neutri di contrasto. " +
      "Ogni colore deve avere un nome italiano comune (es. beige, oliva, terracotta, blu notte) e un codice hex accurato.";

    const result = await geminiVisionJson(
      cfg.apiKey!,
      GEMINI_VISION_MODEL,
      prompt,
      imageBase64,
      mimeType ?? "image/jpeg",
      1024,
    );
    if (!result.ok) {
      return jsonReply({ configured: true, error: result.error }, 502);
    }

    const r = result.json as Record<string, unknown>;
    const detected = (r.detected ?? {}) as Record<string, unknown>;
    const matches = Array.isArray(r.matches) ? (r.matches as Record<string, unknown>[]) : [];

    const cleanDetected: ColorEntry = {
      name: String(detected.name ?? "colore"),
      hex: normalizeHex(String(detected.hex ?? "#999999")),
    };
    const cleanMatches: ColorEntry[] = matches
      .map((m) => ({
        name: String(m.name ?? "colore"),
        hex: normalizeHex(String(m.hex ?? "#999999")),
      }))
      .slice(0, 8);

    if (cleanMatches.length === 0) {
      return jsonReply({ configured: true, error: "Nessun abbinamento ricevuto. Riprova." }, 502);
    }

    const out: ColorResult = { detected: cleanDetected, matches: cleanMatches };
    return jsonReply({ configured: true, result: out });
  } catch (err) {
    return jsonReply({ configured: true, error: (err as Error).message }, 500);
  }
});

function normalizeHex(h: string): string {
  const m = h.replace("#", "").trim();
  if (/^[0-9a-fA-F]{6}$/.test(m)) return `#${m.toLowerCase()}`;
  if (/^[0-9a-fA-F]{3}$/.test(m)) {
    const [r, g, b] = m.split("");
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return "#999999";
}
