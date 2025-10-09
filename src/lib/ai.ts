import OpenAI from "openai";

export const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
export const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);

let client: OpenAI | null = null;
export function getOpenAI() {
  if (!hasOpenAI) return null;
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  return client;
}

/**
 * Devuelve JSON de intención para la búsqueda NL.
 * Si falla o no hay clave, retorna null.
 */
export async function parseQueryWithAI(userText: string) {
  const ai = getOpenAI();
  if (!ai) return null;

  const system = `
Eres un parser. Devuelve SOLO JSON válido:
{
  "terms": string[],
  "category": "comida"|"postres"|"minimarket"|"bebidas"|"alcohol"|"servicios"|null,
  "delivery": boolean|null,
  "onlineOnly": boolean|null,
  "budgetMax": number|null,
  "topK": number|null
}
Si no hay dato, usa null.
`;

  const res = await ai.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: `Consulta: "${userText}"` }
    ],
  });

  const txt = res.choices?.[0]?.message?.content ?? "{}";
  try { return JSON.parse(txt); } catch { return null; }
}










