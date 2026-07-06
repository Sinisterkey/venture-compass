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
  name: "search_organizations",
  title: "Search organizations",
  description: "Search public/verified organizations on LaunchPad Africa by name, sector, or country.",
  inputSchema: {
    search: z.string().optional().describe("Free-text search over name and mission."),
    sector: z.string().optional(),
    country: z.string().optional(),
    limit: z.number().int().min(1).max(50).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, sector, country, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    let q = supa(ctx)
      .from("organizations")
      .select("id, name, mission, sector, country, stage, sdgs, funding_required, readiness_score, is_verified")
      .limit(limit ?? 20);
    if (sector) q = q.eq("sector", sector);
    if (country) q = q.eq("country", country);
    if (search) q = q.or(`name.ilike.%${search}%,mission.ilike.%${search}%`);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { organizations: data ?? [] } };
  },
});
