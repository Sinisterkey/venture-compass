import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { investorTypeLabel, sdgLabel } from "@/lib/labels";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Briefcase, MapPin, Mail, Loader2 } from "lucide-react";
import { SendMessageDialog } from "@/components/SendMessageDialog";
import { sectorImage, funderImage } from "@/lib/sectorImages";

export default function InvestorDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, roles } = useAuth();
  const { format } = useCurrency();
  const [inv, setInv] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [msgOpen, setMsgOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [{ data: i }, { data: p }] = await Promise.all([
        supabase.from("investor_profiles").select("*").eq("user_id", id).maybeSingle(),
        supabase.from("profiles").select("*").eq("user_id", id).maybeSingle(),
      ]);
      setInv(i); setProfile(p);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!inv && !profile) return <Navigate to="/investors" replace />;

  const name = inv?.organization_name || profile?.full_name || "Funder";
  const isNgo = roles.includes("ngo");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="border-b border-border bg-gradient-to-br from-accent/10 via-background to-background">
          <div className="container py-10">
            <div className="flex items-start gap-5 flex-wrap">
              <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover rounded-xl" /> : <Briefcase className="h-10 w-10 text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-display text-3xl font-bold">{name}</h1>
                <p className="text-muted-foreground text-sm mt-1">{investorTypeLabel(inv?.investor_type)}</p>
                {inv?.is_verified && <Badge className="mt-2">Verified Funder</Badge>}
              </div>
              {user && user.id !== id && isNgo && (
                <Button onClick={() => setMsgOpen(true)} className="gap-2"><Mail className="h-4 w-4" /> Send Message</Button>
              )}
            </div>
          </div>
        </div>

        <div className="container py-8 grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {inv?.bio && (
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="font-display font-semibold mb-3">About</h2>
                <p className="text-sm leading-relaxed">{inv.bio}</p>
              </div>
            )}
            {(inv?.investment_focus ?? []).length > 0 && (
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="font-display font-semibold mb-3">Sectors funded</h2>
                <div className="flex flex-wrap gap-2">{inv.investment_focus.map((s: string) => <Badge key={s} variant="secondary">{s}</Badge>)}</div>
              </div>
            )}
            {(inv?.preferred_sdgs ?? []).length > 0 && (
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="font-display font-semibold mb-3">SDGs supported</h2>
                <div className="flex flex-wrap gap-2">{inv.preferred_sdgs.map((n: number) => <Badge key={n} variant="outline">SDG {n}: {sdgLabel(n)}</Badge>)}</div>
              </div>
            )}
          </div>
          <aside className="space-y-4">
            {inv?.min_investment !== null && inv?.max_investment !== null && (
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs text-muted-foreground mb-1">Funding range</p>
                <p className="font-display text-lg font-semibold">{format(inv.min_investment)} – {format(inv.max_investment)}</p>
              </div>
            )}
            {(inv?.preferred_countries ?? []).length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><MapPin className="h-3 w-3" /> Countries</p>
                <div className="flex flex-wrap gap-1">{inv.preferred_countries.map((c: string) => <Badge key={c} variant="outline" className="text-xs">{c}</Badge>)}</div>
              </div>
            )}
          </aside>
        </div>
      </main>
      <Footer />
      {user && (
        <SendMessageDialog open={msgOpen} onOpenChange={setMsgOpen} organizationId={null} recipientId={id!} recipientLabel={name} />
      )}
    </div>
  );
}
