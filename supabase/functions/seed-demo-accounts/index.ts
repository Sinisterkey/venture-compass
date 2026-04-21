// Seed demo accounts into Supabase Auth + assign roles + create profiles.
// Idempotent: safe to call many times. Admin-only.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Role = "founder" | "investor" | "mentor" | "admin";

const DEMO_ACCOUNTS: Array<{
  email: string;
  password: string;
  full_name: string;
  role: Role;
  bio: string;
  country: string;
  city: string;
}> = [
  {
    email: "founder@demo.com",
    password: "demo1234",
    full_name: "Amina Founder (Demo)",
    role: "founder",
    bio: "Computer Science student building an agritech platform for smallholder farmers.",
    country: "Kenya",
    city: "Nairobi",
  },
  {
    email: "investor@demo.com",
    password: "demo1234",
    full_name: "Kwame Investor (Demo)",
    role: "investor",
    bio: "Early-stage VC backing African student founders. Cheque size $25k-$250k.",
    country: "Ghana",
    city: "Accra",
  },
  {
    email: "mentor@demo.com",
    password: "demo1234",
    full_name: "Zanele Mentor (Demo)",
    role: "mentor",
    bio: "2x founder turned operator. Mentoring on GTM, fundraising, and product.",
    country: "South Africa",
    city: "Cape Town",
  },
  {
    email: "admin@launchpad.com",
    password: "admin1234",
    full_name: "Platform Admin",
    role: "admin",
    bio: "LaunchPad Africa platform administrator.",
    country: "Nigeria",
    city: "Lagos",
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is an admin
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: isAdmin } = await admin.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: admin role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: Array<{ email: string; status: string; user_id?: string }> = [];

    for (const acc of DEMO_ACCOUNTS) {
      // Try to find existing user by listing (page through).
      let userId: string | null = null;
      let page = 1;
      while (page <= 10) {
        const { data: list, error: listErr } = await admin.auth.admin.listUsers({
          page,
          perPage: 200,
        });
        if (listErr) break;
        const found = list.users.find((u) => u.email?.toLowerCase() === acc.email.toLowerCase());
        if (found) { userId = found.id; break; }
        if (list.users.length < 200) break;
        page++;
      }

      if (!userId) {
        const { data: created, error: createErr } = await admin.auth.admin.createUser({
          email: acc.email,
          password: acc.password,
          email_confirm: true,
          user_metadata: { full_name: acc.full_name, role: acc.role },
        });
        if (createErr || !created.user) {
          results.push({ email: acc.email, status: `error: ${createErr?.message ?? "unknown"}` });
          continue;
        }
        userId = created.user.id;
        results.push({ email: acc.email, status: "created", user_id: userId });
      } else {
        // Reset password to known demo value so testers can always log in.
        await admin.auth.admin.updateUserById(userId, {
          password: acc.password,
          email_confirm: true,
        });
        results.push({ email: acc.email, status: "reset", user_id: userId });
      }

      // Profile (upsert by user_id)
      await admin.from("profiles").upsert(
        {
          user_id: userId,
          full_name: acc.full_name,
          bio: acc.bio,
          country: acc.country,
          city: acc.city,
        },
        { onConflict: "user_id" },
      );

      // Role (insert if missing)
      const { data: existingRole } = await admin
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", acc.role)
        .maybeSingle();
      if (!existingRole) {
        await admin.from("user_roles").insert({ user_id: userId, role: acc.role });
      }
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
