import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supa(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_funding_matches",
  title: "List funding matches for an organization",
  description: "List AI-computed funding opportunity matches (score, reasons, gaps) for one of the signed-in user's organizations.",
  inputSchema: {
    organization_id: z.string().uuid().describe("The organization ID (must belong to the signed-in user)."),
    min_score: z.number().int().min(0).max(100).optional().describe("Only return matches at or above this score."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ organization_id, min_score }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    let q = supa(ctx)
      .from("funding_matches")
      .select("score, reasons, gaps, computed_at, funding_opportunities(id, funder, title, summary, deadline, url, min_amount, max_amount, currency)")
      .eq("organization_id", organization_id)
      .order("score", { ascending: false });
    if (min_score !== undefined) q = q.gte("score", min_score);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { matches: data ?? [] } };
  },
});
