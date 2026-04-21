import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // 1. Require Authorization header (JWT)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // 2. Verify the caller and derive identity from the JWT (NOT from the body)
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    // 3. Validate request body — only accept `role`, ignore any client-supplied user_id
    let body: { role?: string } = {};
    try {
      body = await req.json();
    } catch {
      // empty body is acceptable; role validated below
    }
    const role = body.role;
    if (role !== "founder" && role !== "investor") {
      return new Response(JSON.stringify({ error: "Invalid role. Must be 'founder' or 'investor'." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Verify the caller actually holds the requested role server-side
    const { data: rolesData, error: rolesError } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (rolesError) {
      console.error("role lookup error:", rolesError);
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userRoles = (rolesData ?? []).map((r: { role: string }) => r.role);
    if (!userRoles.includes(role)) {
      return new Response(JSON.stringify({ error: "Forbidden: role mismatch" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5. All data queries use the user-scoped client so RLS applies
    let prompt = "";
    let context = "";

    if (role === "founder") {
      const { data: startups } = await userClient
        .from("startups")
        .select("*")
        .eq("founder_id", userId);

      const [{ data: investors }, { data: mentors }] = await Promise.all([
        userClient.from("investor_profiles").select("*, profiles!inner(full_name, bio, country)"),
        userClient.from("mentor_profiles").select("*, profiles!inner(full_name, bio, country)"),
      ]);

      context = JSON.stringify({ startups, investors, mentors });
      prompt = `You are an AI matching engine for LaunchPad Africa. Given the founder's startup(s) and available investors/mentors, recommend the top 3 most relevant investors and top 3 most relevant mentors. Match based on industry alignment, funding stage preferences, expertise overlap, and geographic proximity. Return JSON with format: { "investors": [{ "user_id": string, "name": string, "reason": string, "match_score": number }], "mentors": [{ "user_id": string, "name": string, "reason": string, "match_score": number }] }. If no startups exist, return empty arrays with a message suggesting the founder create a startup profile first.`;
    } else {
      const { data: investorProfile } = await userClient
        .from("investor_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      const { data: startups } = await userClient
        .from("startups")
        .select("*, profiles!inner(full_name, country)")
        .eq("is_published", true);

      context = JSON.stringify({ investorProfile, startups });
      prompt = `You are an AI matching engine for LaunchPad Africa. Given the investor's profile and preferences, recommend the top 5 most relevant startups. Match based on investment focus, preferred stages, and industry alignment. Return JSON with format: { "startups": [{ "id": string, "name": string, "reason": string, "match_score": number }] }. If no investor profile exists, return empty array with a message suggesting the investor complete their profile.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: `Here is the data to analyze:\n${context}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_matches",
              description: "Return the AI-generated matches",
              parameters: {
                type: "object",
                properties: {
                  investors: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        user_id: { type: "string" },
                        name: { type: "string" },
                        reason: { type: "string" },
                        match_score: { type: "number" },
                      },
                      required: ["name", "reason", "match_score"],
                    },
                  },
                  mentors: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        user_id: { type: "string" },
                        name: { type: "string" },
                        reason: { type: "string" },
                        match_score: { type: "number" },
                      },
                      required: ["name", "reason", "match_score"],
                    },
                  },
                  startups: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        name: { type: "string" },
                        reason: { type: "string" },
                        match_score: { type: "number" },
                      },
                      required: ["name", "reason", "match_score"],
                    },
                  },
                  message: { type: "string" },
                },
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_matches" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let matches = {};

    if (toolCall?.function?.arguments) {
      matches = typeof toolCall.function.arguments === "string"
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
    }

    return new Response(JSON.stringify(matches), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("match error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
