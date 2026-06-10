import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, ArrowRight, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { AIScoreBadge } from "@/components/AIScoreBadge";
import { sectorImage } from "@/lib/sectorImages";
import { stageLabel } from "@/lib/labels";

interface Org {
  id: string; name: string; sector: string | null; country: string | null;
  short_description: string | null; logo_url: string | null;
  stage: string | null; readiness_score: number | null;
}

export function FeaturedOrganizations() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  useEffect(() => {
    supabase.from("organizations").select("id,name,sector,country,short_description,logo_url,stage,readiness_score").eq("is_published", true).order("readiness_score", { ascending: false, nullsFirst: false }).limit(6).then(({ data }) => setOrgs(data || []));
  }, []);

  return (
    <section className="py-16 bg-background">
      <div className="container">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Organizations</p>
            <h2 className="font-display text-3xl font-bold">Featured impact organizations</h2>
          </div>
          <Link to="/discover" className="text-sm text-primary font-medium hover:underline inline-flex items-center gap-1">View all <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {orgs.map((o) => (
            <Link key={o.id} to={`/organizations/${o.id}`} className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all">
              <div className="h-28 relative">
                <div className="absolute inset-0 overflow-hidden">
                  <img src={sectorImage(o.sector)} alt={o.sector || "Organization"} loading="lazy" width={832} height={512} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                </div>
                <div className="absolute -bottom-5 left-4 h-12 w-12 rounded-lg bg-card border-2 border-card shadow-md overflow-hidden flex items-center justify-center">
                  {o.logo_url ? <img src={o.logo_url} alt="" className="h-full w-full object-cover" /> : <Building2 className="h-6 w-6 text-primary" />}
                </div>
                {o.readiness_score !== null && <div className="absolute top-3 right-3"><AIScoreBadge score={o.readiness_score} size="sm" /></div>}
              </div>
              <div className="p-4 pt-7">
                <h3 className="font-display font-semibold group-hover:text-primary transition-colors">{o.name}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{o.short_description || "—"}</p>
                <div className="flex gap-1 mt-3 flex-wrap">
                  {o.sector && <Badge variant="secondary" className="text-[10px]">{o.sector}</Badge>}
                  {o.country && <Badge variant="outline" className="text-[10px] gap-1"><MapPin className="h-2.5 w-2.5" />{o.country}</Badge>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
