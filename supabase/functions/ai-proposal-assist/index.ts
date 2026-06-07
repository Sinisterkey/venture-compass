import { corsHeaders, callLovableAI } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { text } = await req.json();
    if (!text || text.length < 20) throw new Error("Provide at least 20 characters");
    const improved = await callLovableAI([
      { role: "system", content: "You are an expert NGO proposal writer. Rewrite the user's draft to be more clear, measurable, and professional. Add SMART objectives (Specific, Measurable, Achievable, Relevant, Time-bound). Keep the original intent. Output only the improved text, no preamble." },
      { role: "user", content: text },
    ]);
    return Response.json({ improved }, { headers: corsHeaders });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500, headers: corsHeaders });
  }
});
