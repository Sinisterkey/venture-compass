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
  name: "run_funding_discovery",
  title: "Run AI funding discovery",
  description: "Trigger the AI Funding Intelligence engine to recompute funder matches for one of the user's organizations. Returns match scores, reasons, and gaps.",
  inputSchema: {
    organization_id: z.string().uuid().describe("The organization to score against active funding opportunities."),
  },
  annotations: { readOnlyHint: false, idempotentHint: true, openWorldHint: true },
  handler: async ({ organization_id }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const client = supa(ctx);
    // Verify ownership before invoking the (service-role) edge function
    const { data: org, error: orgErr } = await client
      .from("organizations")
      .select("id, owner_id")
      .eq("id", organization_id)
      .maybeSingle();
    if (orgErr || !org || org.owner_id !== ctx.getUserId()) {
      return { content: [{ type: "text", text: "Organization not found or not owned by this user." }], isError: true };
    }
    const { data, error } = await client.functions.invoke("ai-discover-funders", { body: { organization_id } });
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: data };
  },
});
