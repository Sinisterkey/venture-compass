import { corsHeaders, callLovableAI } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { org, template, section, wordLimit, existing, mode, instruction } = await req.json();
    if (!org || !section) return new Response(JSON.stringify({ error: "missing fields" }), { status: 400, headers: corsHeaders });

    const isRefine = mode === "refine" && existing;

    const system = isRefine
      ? `You are an expert grant editor. Rewrite the provided proposal section following the user's instruction exactly. Preserve all factual claims, numbers, and references. Stay within ${wordLimit ?? 300} words. Return only the rewritten text.`
      : `You are an expert grant writer for African NGOs. Write a single section of a ${template?.funder ?? "funder"} proposal. Use clear, donor-ready language. Be specific, evidence-based, and outcomes-focused. Stay within ${wordLimit ?? 300} words.`;

    const orgBlock = `ORGANIZATION:
Name: ${org.name}
Mission: ${org.mission ?? ""}
Sector: ${org.sector ?? ""}
Country: ${org.country ?? ""}
Beneficiaries: ${org.target_beneficiaries ?? ""}
Funding required: ${org.funding_required ?? ""}
SDGs: ${(org.sdgs ?? []).join(", ")}
Description: ${org.short_description ?? ""}`;

    const user = isRefine
      ? `${orgBlock}

SECTION: ${section.title}
USER INSTRUCTION: ${instruction ?? "Improve clarity, sharpen outcomes, tighten language."}

EXISTING TEXT:
${existing}

Respond with the rewritten section text only — no headings, no preamble.`
      : `${orgBlock}

SECTION TO WRITE: ${section.title}
GUIDANCE: ${section.guidance}
${existing ? `\nEXISTING DRAFT (improve, do not duplicate):\n${existing}` : ""}

Respond with the section text only — no headings, no preamble.`;

    const text = await callLovableAI([
      { role: "system", content: system },
      { role: "user", content: user },
    ]);
    return new Response(JSON.stringify({ text }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
