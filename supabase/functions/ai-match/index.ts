import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { user_id, role } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let prompt = "";
    let context = "";

    if (role === "founder") {
      // Get founder's startup info
      const { data: startups } = await supabase
        .from("startups")
        .select("*")
        .eq("founder_id", user_id);

      // Get all investors and mentors
      const [{ data: investors }, { data: mentors }] = await Promise.all([
        supabase.from("investor_profiles").select("*, profiles!inner(full_name, bio, country)"),
        supabase.from("mentor_profiles").select("*, profiles!inner(full_name, bio, country)"),
      ]);

      context = JSON.stringify({ startups, investors, mentors });
      prompt = `You are an AI matching engine for LaunchPad Africa. Given the founder's startup(s) and available investors/mentors, recommend the top 3 most relevant investors and top 3 most relevant mentors. Match based on industry alignment, funding stage preferences, expertise overlap, and geographic proximity. Return JSON with format: { "investors": [{ "user_id": string, "name": string, "reason": string, "match_score": number }], "mentors": [{ "user_id": string, "name": string, "reason": string, "match_score": number }] }. If no startups exist, return empty arrays with a message suggesting the founder create a startup profile first.`;

    } else if (role === "investor") {
      // Get investor preferences
      const { data: investorProfile } = await supabase
        .from("investor_profiles")
        .select("*")
        .eq("user_id", user_id)
        .single();

      // Get published startups
      const { data: startups } = await supabase
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
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
