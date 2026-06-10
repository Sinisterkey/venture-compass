import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/contexts/CurrencyContext";
import { SECTORS, COUNTRIES, SDGS, ORG_STAGE_OPTIONS, stageLabel } from "@/lib/labels";
import { Search, Filter, Building2, MapPin, Target } from "lucide-react";
import { sectorImage } from "@/lib/sectorImages";
import { AIScoreBadge } from "@/components/AIScoreBadge";

interface Org {
  id: string;
  name: string;
  short_description: string | null;
  mission: string | null;
  sector: string | null;
  country: string | null;
  province: string | null;
  funding_required: number | null;
  stage: string | null;
  logo_url: string | null;
  sdgs: number[] | null;
  readiness_score: number | null;
  is_verified: boolean | null;
}

export default function Discover() {
  const { format } = useCurrency();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [sector, setSector] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [stage, setStage] = useState<string>("");
  const [sdg, setSdg] = useState<string>("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      let query = supabase.from("organizations").select("id,name,short_description,mission,sector,country,province,funding_required,stage,logo_url,sdgs,readiness_score,is_verified").eq("is_published", true);
      if (sector) query = query.eq("sector", sector);
      if (country) query = query.eq("country", country);
      if (stage) query = query.eq("stage", stage as any);
      if (sdg) query = query.contains("sdgs", [Number(sdg)]);
      const { data } = await query.order("readiness_score", { ascending: false, nullsFirst: false }).limit(60);
      setOrgs((data || []).filter((o) => !q || o.name.toLowerCase().includes(q.toLowerCase()) || (o.short_description || "").toLowerCase().includes(q.toLowerCase())));
      setLoading(false);
    })();
  }, [q, sector, country, stage, sdg]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="border-b border-border bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="container py-10">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Discover impact-driven organizations</h1>
            <p className="text-muted-foreground max-w-2xl">Find NGOs, community organizations, and social enterprises seeking funding partners across Africa.</p>
          </div>
        </div>

        <div className="container py-8 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
          <aside className="space-y-5">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><Filter className="h-3.5 w-3.5" /> Filters</p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="pl-9" />
              </div>
            </div>

            {[
              { label: "Sector", value: sector, set: setSector, opts: SECTORS.map((s) => ({ value: s, label: s })) },
              { label: "Country", value: country, set: setCountry, opts: COUNTRIES.map((c) => ({ value: c, label: c })) },
              { label: "Stage", value: stage, set: setStage, opts: ORG_STAGE_OPTIONS },
              { label: "SDG", value: sdg, set: setSdg, opts: SDGS.map((s) => ({ value: String(s.n), label: `${s.n}. ${s.label}` })) },
            ].map((f) => (
              <div key={f.label}>
                <p className="text-xs font-semibold text-foreground mb-1.5">{f.label}</p>
                <select value={f.value} onChange={(e) => f.set(e.target.value)} className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm">
                  <option value="">All</option>
                  {f.opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            ))}

            {(sector || country || stage || sdg || q) && (
              <Button variant="outline" size="sm" className="w-full" onClick={() => { setSector(""); setCountry(""); setStage(""); setSdg(""); setQ(""); }}>Clear filters</Button>
            )}
          </aside>

          <div>
            <p className="text-sm text-muted-foreground mb-4">{loading ? "Loading…" : `${orgs.length} organization${orgs.length === 1 ? "" : "s"}`}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {orgs.map((o) => (
                <Link key={o.id} to={`/organizations/${o.id}`} className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all">
                  <div className="h-32 relative">
                    <div className="absolute inset-0 overflow-hidden">
                      <img src={sectorImage(o.sector)} alt={o.sector || "Organization"} loading="lazy" width={832} height={512} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                    </div>
                    <div className="absolute -bottom-6 left-5 h-14 w-14 rounded-lg bg-card border-2 border-card shadow-md overflow-hidden flex items-center justify-center">
                      {o.logo_url ? <img src={o.logo_url} alt="" className="h-full w-full object-cover" /> : <Building2 className="h-7 w-7 text-primary" />}
                    </div>
                    {o.readiness_score !== null && (
                      <div className="absolute top-3 right-3">
                        <AIScoreBadge score={o.readiness_score} size="sm" />
                      </div>
                    )}
                  </div>
                  <div className="p-5 pt-8">
                    <h3 className="font-display font-semibold text-base group-hover:text-primary transition-colors">{o.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{o.short_description || o.mission || "—"}</p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {o.sector && <Badge variant="secondary" className="text-[10px]">{o.sector}</Badge>}
                      {o.stage && <Badge variant="outline" className="text-[10px]">{stageLabel(o.stage)}</Badge>}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {[o.province, o.country].filter(Boolean).join(", ") || "—"}</span>
                      {o.funding_required && <span className="flex items-center gap-1"><Target className="h-3 w-3" /> {format(o.funding_required)}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
