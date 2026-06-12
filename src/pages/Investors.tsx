import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Search, Briefcase, MapPin } from "lucide-react";
import { investorTypeLabel } from "@/lib/labels";
import { useCurrency } from "@/contexts/CurrencyContext";
import { funderImage, sectorImage } from "@/lib/sectorImages";

interface Inv {
  user_id: string;
  organization_name: string | null;
  investor_type: string | null;
  bio: string | null;
  investment_focus: string[] | null;
  preferred_countries: string[] | null;
  preferred_sdgs: number[] | null;
  min_investment: number | null;
  max_investment: number | null;
  is_verified: boolean | null;
}

export default function Investors() {
  const { format } = useCurrency();
  const [items, setItems] = useState<Inv[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("investor_profiles").select("user_id,organization_name,investor_type,bio,investment_focus,preferred_countries,preferred_sdgs,min_investment,max_investment,is_verified");
      setItems(data || []);
      if (data && data.length > 0) {
        const ids = data.map((d) => d.user_id);
        const { data: ps } = await supabase.from("profiles").select("user_id,full_name,avatar_url").in("user_id", ids);
        setProfiles(Object.fromEntries((ps || []).map((p) => [p.user_id, p])));
      }
    })();
  }, []);

  const filtered = items.filter((i) => {
    if (!q) return true;
    const hay = `${i.organization_name ?? ""} ${i.bio ?? ""} ${(i.investment_focus ?? []).join(" ")}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="border-b border-border bg-gradient-to-br from-accent/10 via-background to-background">
          <div className="container py-10">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Funders & Investors</h1>
            <p className="text-muted-foreground max-w-2xl">Discover foundations, donors, grant makers, and impact investors active across Africa.</p>
          </div>
        </div>
        <div className="container py-8">
          <div className="max-w-md mb-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search funders…" className="pl-9" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((i, idx) => {
              const p = profiles[i.user_id];
              const name = i.organization_name || p?.full_name || "Funder";
              const cover = (i.investment_focus && i.investment_focus[0]) ? sectorImage(i.investment_focus[0]) : funderImage(idx);
              return (
                <Link key={i.user_id} to={`/investors/${i.user_id}`} className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-md transition-all">
                  <div className="h-32 relative overflow-hidden">
                    <img src={cover} alt={name} loading="lazy" width={832} height={512} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    <div className="absolute -bottom-5 left-4 h-12 w-12 rounded-lg bg-card border-2 border-card shadow-md overflow-hidden flex items-center justify-center">
                      {p?.avatar_url ? <img src={p.avatar_url} alt="" className="h-full w-full object-cover" /> : <Briefcase className="h-6 w-6 text-primary" />}
                    </div>
                  </div>
                  <div className="p-5 pt-7">
                    <p className="font-display font-semibold text-sm group-hover:text-primary transition-colors truncate">{name}</p>
                    <p className="text-xs text-muted-foreground">{investorTypeLabel(i.investor_type)}</p>
                    {i.bio && <p className="text-xs text-muted-foreground line-clamp-2 mt-2">{i.bio}</p>}
                    <div className="flex flex-wrap gap-1 mt-3">
                      {(i.investment_focus ?? []).slice(0, 3).map((s) => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}
                    </div>
                    {(i.min_investment !== null && i.max_investment !== null) && (
                      <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">{format(i.min_investment!)} – {format(i.max_investment!)}</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
