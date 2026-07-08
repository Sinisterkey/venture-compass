// Seed demo accounts + a few demo NGOs. Admin-only, idempotent.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Role = "ngo" | "investor" | "admin";

const DEMO_ACCOUNTS: Array<{ email: string; password: string; full_name: string; role: Role; bio: string; country: string; city: string }> = [
  { email: "ngo@demo.com", password: "demo1234", full_name: "Chanda Banda (NGO Demo)", role: "ngo", bio: "Director of a youth empowerment NGO in Copperbelt.", country: "Zambia", city: "Kitwe" },
  { email: "investor@demo.com", password: "demo1234", full_name: "Aisha Chitundu (Funder Demo)", role: "investor", bio: "Program officer at an East African impact foundation. ZMW 100k-500k grants.", country: "Kenya", city: "Nairobi" },
  { email: "admin@ngo-bridge.com", password: "admin1234", full_name: "Platform Admin", role: "admin", bio: "NGO Bridge platform administrator.", country: "Zambia", city: "Lusaka" },
];

const DEMO_ORGS = [
  { name: "Mukuba Girls in STEM", sector: "Education", country: "Zambia", province: "Copperbelt", mission: "Equip 500+ rural girls with practical STEM skills.", short_description: "After-school coding, robotics, and mentorship for girls aged 12-18 across Copperbelt Province, anchored at Mukuba University.", funding_required: 250000, stage: "early", sdgs: [4, 5, 10], beneficiary_type: "Children", impact_area: "STEM education for girls" },
  { name: "Kafue Smallholder Resilience", sector: "Agriculture", country: "Zambia", province: "Lusaka", mission: "Build climate-resilient farms for smallholder families.", short_description: "Training, drought-tolerant seed access, and digital market linkages for 1,200 smallholder farmers in the Kafue basin.", funding_required: 480000, stage: "established", sdgs: [1, 2, 13], beneficiary_type: "Smallholder farmers", impact_area: "Climate-smart agriculture" },
  { name: "Lusaka Maternal Health Network", sector: "Health", country: "Zambia", province: "Lusaka", mission: "Reduce maternal mortality in peri-urban Lusaka.", short_description: "Community health workers, mobile clinics, and SMS reminders supporting 8 peri-urban wards.", funding_required: 320000, stage: "scaling", sdgs: [3, 5], beneficiary_type: "Women", impact_area: "Maternal & child health" },
  { name: "Clean Water for Eastern Province", sector: "Water & Sanitation", country: "Zambia", province: "Eastern", mission: "Bring safe water to 30 rural schools.", short_description: "Boreholes, hand-washing stations, and WASH training in 30 primary schools across Eastern Province.", funding_required: 180000, stage: "early", sdgs: [6, 4], beneficiary_type: "Children", impact_area: "WASH in schools" },
  { name: "Copperbelt Youth Entrepreneurship", sector: "Youth Empowerment", country: "Zambia", province: "Copperbelt", mission: "Turn 300 unemployed youth into job creators.", short_description: "12-week entrepreneurship bootcamps, microgrants, and ongoing mentorship for youth aged 18-30.", funding_required: 410000, stage: "established", sdgs: [4, 8, 10], beneficiary_type: "Youth", impact_area: "Youth employment" },
  { name: "Refugee Skills Bridge", sector: "Refugees & Migration", country: "Zambia", province: "Western", mission: "Connect refugees with livelihood opportunities.", short_description: "Vocational training, language support, and job-placement for refugees and host community members in Meheba.", funding_required: 220000, stage: "idea", sdgs: [8, 10, 16], beneficiary_type: "Refugees", impact_area: "Livelihoods" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
    if (!isAdmin) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const results: any[] = [];
    const ngoUserIds: Record<string, string> = {};

    for (const acc of DEMO_ACCOUNTS) {
      let userId: string | null = null;
      let page = 1;
      while (page <= 10) {
        const { data: list, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
        if (error) break;
        const f = list.users.find((u) => u.email?.toLowerCase() === acc.email.toLowerCase());
        if (f) { userId = f.id; break; }
        if (list.users.length < 200) break;
        page++;
      }
      if (!userId) {
        const { data: created, error } = await admin.auth.admin.createUser({ email: acc.email, password: acc.password, email_confirm: true, user_metadata: { full_name: acc.full_name, role: acc.role } });
        if (error || !created.user) { results.push({ email: acc.email, status: `error: ${error?.message}` }); continue; }
        userId = created.user.id;
        results.push({ email: acc.email, status: "created", user_id: userId });
      } else {
        await admin.auth.admin.updateUserById(userId, { password: acc.password, email_confirm: true });
        results.push({ email: acc.email, status: "reset", user_id: userId });
      }
      await admin.from("profiles").upsert({ user_id: userId, full_name: acc.full_name, bio: acc.bio, country: acc.country, city: acc.city }, { onConflict: "user_id" });
      const { data: existingRole } = await admin.from("user_roles").select("id").eq("user_id", userId).eq("role", acc.role).maybeSingle();
      if (!existingRole) await admin.from("user_roles").insert({ user_id: userId, role: acc.role });
      ngoUserIds[acc.email] = userId;
    }

    // Seed investor profile for the demo funder
    const investorId = ngoUserIds["investor@demo.com"];
    if (investorId) {
      const { data: ex } = await admin.from("investor_profiles").select("id").eq("user_id", investorId).maybeSingle();
      const payload = {
        user_id: investorId, organization_name: "Ubuntu Impact Foundation", investor_type: "foundation",
        bio: "We support grassroots organizations advancing education, gender equality, and climate resilience across Southern Africa.",
        investment_focus: ["Education", "Gender Equality", "Climate & Environment", "Health"],
        preferred_countries: ["Zambia", "Malawi", "Zimbabwe"],
        preferred_sdgs: [3, 4, 5, 13],
        min_investment: 50000, max_investment: 750000, is_verified: true,
      };
      if (ex) await admin.from("investor_profiles").update(payload).eq("user_id", investorId);
      else await admin.from("investor_profiles").insert(payload);
    }

    // Seed organizations for the demo NGO
    const ngoId = ngoUserIds["ngo@demo.com"];
    if (ngoId) {
      for (const o of DEMO_ORGS) {
        const { data: ex } = await admin.from("organizations").select("id").eq("owner_id", ngoId).eq("name", o.name).maybeSingle();
        if (ex) continue;
        await admin.from("organizations").insert({
          owner_id: ngoId, ...o, is_published: true, is_verified: true, currency: "ZMW",
        });
      }
    }

    return new Response(JSON.stringify({ ok: true, results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
