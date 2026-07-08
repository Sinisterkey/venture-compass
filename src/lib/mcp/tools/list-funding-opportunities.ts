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
  name: "list_funding_opportunities",
  title: "List funding opportunities",
  description: "List active funding opportunities on NGO Bridge. Optionally filter by sector, country, or search text in title/summary.",
  inputSchema: {
    sector: z.string().optional().describe("Filter by sector (e.g. 'WASH', 'Agriculture', 'Health')."),
    country: z.string().optional().describe("Filter by eligible country (ISO name)."),
    search: z.string().optional().describe("Free-text search over title and summary."),
    limit: z.number().int().min(1).max(50).optional().describe("Max results (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ sector, country, search, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    let q = supa(ctx).from("funding_opportunities").select("id, funder, title, summary, sectors, countries, sdgs, min_amount, max_amount, currency, deadline, url").eq("is_active", true).limit(limit ?? 20);
    if (sector) q = q.contains("sectors", [sector]);
    if (country) q = q.contains("countries", [country]);
    if (search) q = q.or(`title.ilike.%${search}%,summary.ilike.%${search}%`);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { opportunities: data ?? [] } };
  },
});
