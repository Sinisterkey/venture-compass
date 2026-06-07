// Shared CORS for all AI edge functions
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export async function callLovableAI(messages: any[], schema?: any): Promise<any> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY not configured");

  const body: any = {
    model: "google/gemini-3-flash-preview",
    messages,
  };
  if (schema) {
    body.tools = [{ type: "function", function: { name: "respond", description: "Return the structured response.", parameters: schema } }];
    body.tool_choice = { type: "function", function: { name: "respond" } };
  }

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (resp.status === 429) throw new Error("Rate limit exceeded. Try again shortly.");
  if (resp.status === 402) throw new Error("AI credits exhausted. Please add credits to continue.");
  if (!resp.ok) throw new Error(`AI gateway error ${resp.status}: ${await resp.text()}`);

  const data = await resp.json();
  if (schema) {
    const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("AI returned no structured output");
    return JSON.parse(args);
  }
  return data?.choices?.[0]?.message?.content ?? "";
}
