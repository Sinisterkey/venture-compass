import { supabase } from "@/integrations/supabase/client";

export interface RecommendedStartup {
  id: string;
  name: string;
  industry: string | null;
  current_stage: string | null;
  innovation_category: string | null;
  funding_requested: number | null;
  match_reasons: string[];
}

/** Rule-based recommendations for an investor. */
export async function recommendStartupsForInvestor(userId: string): Promise<RecommendedStartup[]> {
  const { data: prefs } = await supabase
    .from("investor_profiles")
    .select("investment_focus, preferred_stages, innovation_categories, min_investment, max_investment")
    .eq("user_id", userId)
    .maybeSingle();

  const { data: startups } = await supabase
    .from("startups")
    .select("id,name,industry,current_stage,innovation_category,funding_requested,funding_stage")
    .eq("is_published", true);

  if (!startups) return [];

  const focus = prefs?.investment_focus ?? [];
  const stages = prefs?.preferred_stages ?? [];
  const cats = prefs?.innovation_categories ?? [];
  const min = prefs?.min_investment ?? null;
  const max = prefs?.max_investment ?? null;

  const scored = startups.map((s) => {
    const reasons: string[] = [];
    if (s.industry && focus.includes(s.industry)) reasons.push(`Industry match: ${s.industry}`);
    if (s.funding_stage && stages.includes(s.funding_stage)) reasons.push(`Stage match: ${s.funding_stage}`);
    if (s.innovation_category && cats.includes(s.innovation_category))
      reasons.push(`Category match: ${s.innovation_category}`);
    if (s.funding_requested && min !== null && max !== null) {
      if (s.funding_requested >= min && s.funding_requested <= max)
        reasons.push("Within investment range");
    }
    return { ...s, match_reasons: reasons } as RecommendedStartup;
  });

  // Filter to only startups with at least one match reason, then sort and limit
  return scored.filter(s => s.match_reasons.length > 0).sort((a, b) => b.match_reasons.length - a.match_reasons.length).slice(0, 10);
}

/** Rule-based recommendations for a mentor. */
export async function recommendStartupsForMentor(userId: string): Promise<RecommendedStartup[]> {
  const { data: prefs } = await supabase
    .from("mentor_profiles")
    .select("industries, expertise, preferred_categories")
    .eq("user_id", userId)
    .maybeSingle();

  const { data: startups } = await supabase
    .from("startups")
    .select("id,name,industry,current_stage,innovation_category,funding_requested")
    .eq("is_published", true);

  if (!startups) return [];

  const industries = prefs?.industries ?? [];
  const cats = prefs?.preferred_categories ?? [];

  const scored = startups.map((s) => {
    const reasons: string[] = [];
    if (s.industry && industries.includes(s.industry)) reasons.push(`Industry match: ${s.industry}`);
    if (s.innovation_category && cats.includes(s.innovation_category))
      reasons.push(`Category match: ${s.innovation_category}`);
    return { ...s, match_reasons: reasons } as RecommendedStartup;
  });

  // Filter to only startups with at least one match reason, then sort and limit
  return scored.filter(s => s.match_reasons.length > 0).sort((a, b) => b.match_reasons.length - a.match_reasons.length).slice(0, 10);
}
