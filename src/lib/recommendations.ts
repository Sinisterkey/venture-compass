import { supabase } from "@/integrations/supabase/client";

export interface RecommendedOrg {
  id: string;
  name: string;
  sector: string | null;
  country: string | null;
  stage: string | null;
  funding_required: number | null;
  short_description: string | null;
  logo_url: string | null;
  sdgs: number[] | null;
  readiness_score: number | null;
  match_score: number;
  match_reasons: string[];
}

export interface RecommendedInvestor {
  user_id: string;
  organization_name: string | null;
  investor_type: string | null;
  bio: string | null;
  preferred_sdgs: number[] | null;
  investment_focus: string[] | null;
  preferred_countries: string[] | null;
  min_investment: number | null;
  max_investment: number | null;
  match_score: number;
  match_reasons: string[];
}

/** Rule-based fallback (instant). AI matching enriches this server-side. */
export async function recommendOrgsForInvestor(userId: string): Promise<RecommendedOrg[]> {
  const { data: prefs } = await supabase
    .from("investor_profiles")
    .select("investment_focus, preferred_sdgs, preferred_countries, min_investment, max_investment")
    .eq("user_id", userId)
    .maybeSingle();

  const { data: orgs } = await supabase
    .from("organizations")
    .select("id,name,sector,country,stage,funding_required,short_description,logo_url,sdgs,readiness_score")
    .eq("is_published", true);

  if (!orgs) return [];
  const focus = prefs?.investment_focus ?? [];
  const sdgs = prefs?.preferred_sdgs ?? [];
  const countries = prefs?.preferred_countries ?? [];
  const min = prefs?.min_investment ?? null;
  const max = prefs?.max_investment ?? null;

  return orgs.map((o) => {
    const reasons: string[] = [];
    let score = 40;
    if (o.sector && focus.includes(o.sector)) { reasons.push(`Sector match: ${o.sector}`); score += 20; }
    if (o.country && countries.includes(o.country)) { reasons.push(`Country match: ${o.country}`); score += 15; }
    const sdgOverlap = (o.sdgs ?? []).filter((s: number) => sdgs.includes(s));
    if (sdgOverlap.length > 0) { reasons.push(`${sdgOverlap.length} shared SDG${sdgOverlap.length > 1 ? "s" : ""}`); score += sdgOverlap.length * 5; }
    if (o.funding_required && min !== null && max !== null && o.funding_required >= min && o.funding_required <= max) {
      reasons.push("Funding within your range"); score += 15;
    }
    if (o.readiness_score && o.readiness_score >= 70) { reasons.push("High readiness score"); score += 5; }
    return { ...o, match_score: Math.min(99, score), match_reasons: reasons } as RecommendedOrg;
  }).sort((a, b) => b.match_score - a.match_score).slice(0, 12);
}

export async function recommendInvestorsForOrg(orgId: string): Promise<RecommendedInvestor[]> {
  const { data: org } = await supabase
    .from("organizations")
    .select("sector,country,sdgs,funding_required")
    .eq("id", orgId)
    .maybeSingle();
  if (!org) return [];

  const { data: investors } = await supabase
    .from("investor_profiles")
    .select("user_id,organization_name,investor_type,bio,preferred_sdgs,investment_focus,preferred_countries,min_investment,max_investment");
  if (!investors) return [];

  return investors.map((i) => {
    const reasons: string[] = [];
    let score = 40;
    if (org.sector && (i.investment_focus ?? []).includes(org.sector)) { reasons.push(`Funds ${org.sector}`); score += 20; }
    if (org.country && (i.preferred_countries ?? []).includes(org.country)) { reasons.push(`Works in ${org.country}`); score += 15; }
    const sdgOverlap = (org.sdgs ?? []).filter((s: number) => (i.preferred_sdgs ?? []).includes(s));
    if (sdgOverlap.length > 0) { reasons.push(`${sdgOverlap.length} shared SDG${sdgOverlap.length > 1 ? "s" : ""}`); score += sdgOverlap.length * 5; }
    if (org.funding_required && i.min_investment !== null && i.max_investment !== null && org.funding_required >= i.min_investment! && org.funding_required <= i.max_investment!) {
      reasons.push("Funding fits range"); score += 15;
    }
    return { ...i, match_score: Math.min(99, score), match_reasons: reasons } as RecommendedInvestor;
  }).sort((a, b) => b.match_score - a.match_score).slice(0, 12);
}
