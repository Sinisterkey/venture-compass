// Shared CORS for all AI edge functions
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// @ts-ignore
import { createClient } from "npm:@supabase/supabase-js@2";

let cachedKey: string | null = null;
let keyFetchedAt = 0;

async function getGeminiApiKey(): Promise<string> {
  const now = Date.now();
  if (cachedKey && now - keyFetchedAt < 5 * 60 * 1000) return cachedKey;

  const deno = (globalThis as any).Deno;
  const supaUrl = deno?.env?.get?.("SUPABASE_URL");
  const serviceKey = deno?.env?.get?.("SUPABASE_SERVICE_ROLE_KEY");

  if (!supaUrl || !serviceKey) throw new Error("SUPABASE_URL/SERVICE_ROLE_KEY not configured");

  const supa = createClient(supaUrl, serviceKey);
  const { data, error } = await supa.rpc("vault_decode_secret", { secret_name: "GEMINI_API_KEY" });

  if (error || !data) {
    throw new Error("GEMINI_API_KEY not found in vault. Add it via Supabase Vault.");
  }

  cachedKey = typeof data === "string" ? data : String(data);
  keyFetchedAt = now;
  return cachedKey;
}

const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_ENDPOINT = (apiKey: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

function toGeminiContents(messages: any[]) {
  return messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: typeof m.content === "string" ? m.content : JSON.stringify(m.content) }],
  }));
}

function extractText(data: any): string {
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  return parts.map((p: any) => p.text ?? "").join("").trim();
}

function extractToolCallArgs(data: any): any | null {
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  for (const p of parts) {
    if (p.functionCall) {
      return p.functionCall.args ?? {};
    }
  }
  const text = extractText(data);
  if (text) {
    try {
      const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  }
  return null;
}

export async function callLovableAI(messages: any[], schema?: any): Promise<any> {
  const apiKey = await getGeminiApiKey();

  const contents = toGeminiContents(messages);

  const body: any = {
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
    },
  };

  if (schema) {
    const functionDeclarations = [{
      name: "respond",
      description: "Return the structured response.",
      parameters: schema,
    }];
    body.tools = [{ functionDeclarations }];
    body.toolConfig = {
      functionCallingConfig: {
        mode: "ANY",
        allowedFunctionNames: ["respond"],
      },
    };
  }

  const resp = await fetch(GEMINI_ENDPOINT(apiKey), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (resp.status === 429) throw new Error("Rate limit exceeded. Try again shortly.");
  if (resp.status === 402 || resp.status === 403) throw new Error("AI credits exhausted or key invalid. Check your Gemini API key.");
  if (!resp.ok) throw new Error(`Gemini API error ${resp.status}: ${await resp.text()}`);

  const data = await resp.json();

  if (schema) {
    const args = extractToolCallArgs(data);
    if (!args) throw new Error("AI returned no structured output");
    return args;
  }

  const text = extractText(data);
  if (!text) throw new Error("AI returned no content");
  return text;
}
