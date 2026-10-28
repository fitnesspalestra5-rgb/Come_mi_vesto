// Modulo condiviso per l'integrazione Google Gemini.
// Punto unico di configurazione: la chiave API viene letta dalla secret
// GEMINI_API_KEY lato server (Supabase Edge Functions) e non è mai esposta
// al frontend. Tutte le funzioni AI del progetto usano questo modulo.

export const GEMINI_TEXT_MODEL = "gemini-2.5-flash";
export const GEMINI_VISION_MODEL = "gemini-2.5-flash";
export const GEMINI_IMAGE_MODEL = "gemini-2.5-flash-image";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

export interface GeminiConfig {
  configured: boolean;
  apiKey: string | undefined;
  error?: string;
}

export function getGeminiConfig(): GeminiConfig {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    return {
      configured: false,
      apiKey: undefined,
      error:
        "Servizio AI non configurato. Imposta la secret GEMINI_API_KEY nel progetto Supabase (Dashboard → Edge Functions → Secrets) per attivare le funzioni AI.",
    };
  }
  return { configured: true, apiKey };
}

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
  error?: { code?: number; message?: string; status?: string };
}

// Estrae in modo robusto un oggetto JSON dal testo restituito dal modello.
export function extractJson<T = Record<string, unknown>>(raw: string): T | null {
  if (!raw) return null;
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    return (match ? JSON.parse(match[0]) : JSON.parse(raw)) as T;
  } catch {
    return null;
  }
}

// Traduce gli errori API in messaggi comprensibili per l'utente.
export function describeError(status: number, body: string): string {
  if (status === 429) {
    return "Limite di utilizzo di Gemini raggiunto. Riprova tra qualche minuto.";
  }
  if (status === 400) {
    return "Richiesta non valida verso Gemini. Verifica che la chiave API sia corretta e abilitata.";
  }
  if (status === 403) {
    return "Chiave Gemini non autorizzata o non abilitata per i modelli richiesti. Controlla la console Google AI.";
  }
  return `Errore servizio Gemini (${status}): ${body.slice(0, 200)}`;
}

// Chiamata testuale con risposta JSON strutturata.
export async function geminiTextJson(
  apiKey: string,
  model: string,
  prompt: string,
  maxTokens = 800
): Promise<{ ok: true; json: Record<string, unknown> } | { ok: false; error: string }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: maxTokens,
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    return { ok: false, error: describeError(res.status, errText) };
  }

  const data: GeminiResponse = await res.json();
  if (data.error) {
    return { ok: false, error: describeError(data.error.code ?? 0, data.error.message ?? "") };
  }
  if (data.promptFeedback?.blockReason) {
    return { ok: false, error: "La richiesta è stata bloccata dai filtri di sicurezza di Gemini." };
  }

  const raw = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
  const parsed = extractJson(raw);
  if (!parsed) {
    return { ok: false, error: "Risposta di Gemini non interpretabile come JSON." };
  }
  return { ok: true, json: parsed };
}

// Chiamata con visione (immagine + testo) e risposta JSON.
export async function geminiVisionJson(
  apiKey: string,
  model: string,
  prompt: string,
  imageBase64: string,
  mimeType = "image/jpeg",
  maxTokens = 800
): Promise<{ ok: true; json: Record<string, unknown> } | { ok: false; error: string }> {
  const cleanBase64 = imageBase64.startsWith("data:") ? imageBase64.split(",")[1] : imageBase64;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const parts: GeminiPart[] = [
    { text: prompt },
    { inlineData: { mimeType, data: cleanBase64 } },
  ];

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: maxTokens,
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    return { ok: false, error: describeError(res.status, errText) };
  }

  const data: GeminiResponse = await res.json();
  if (data.error) {
    return { ok: false, error: describeError(data.error.code ?? 0, data.error.message ?? "") };
  }
  if (data.promptFeedback?.blockReason) {
    return { ok: false, error: "La richiesta è stata bloccata dai filtri di sicurezza di Gemini." };
  }

  const raw = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
  const parsed = extractJson(raw);
  if (!parsed) {
    return { ok: false, error: "Risposta di Gemini non interpretabile come JSON." };
  }
  return { ok: true, json: parsed };
}

// Risposta JSON standard con stato configurazione.
export function jsonReply(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
