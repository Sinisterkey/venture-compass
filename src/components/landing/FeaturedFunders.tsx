import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { investorTypeLabel } from "@/lib/labels";

interface Inv {
  user_id: string;
  organization_name: string | null;
  investor_type: string | null;
  bio: string | null;
  investment_focus: string[] | null;
}

export function FeaturedFunders() {
  const [items, setItems] = useState<Inv[]>([]);
  useEffect(() => {
    supabase.from("investor_profiles").select("user_id,organization_name,investor_type,bio,investment_focus").limit(4).then(({ data }) => setItems(data || []));
  }, []);

  return (
    <section className="py-16 bg-muted/30">
      <div className="container">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Funders</p>
            <h2 className="font-display text-3xl font-bold">Backing African impact</h2>
          </div>
          <Link to="/investors" className="text-sm text-primary font-medium hover:underline inline-flex items-center gap-1">View all <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((i) => (
            <Link key={i.user_id} to={`/investors/${i.user_id}`} className="group rounded-xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-md transition-all">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-3">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <p className="font-display font-semibold text-sm group-hover:text-primary transition-colors">{i.organization_name || "Funder"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{investorTypeLabel(i.investor_type)}</p>
              {i.bio && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{i.bio}</p>}
              <div className="flex flex-wrap gap-1 mt-3">
                {(i.investment_focus ?? []).slice(0, 2).map((s) => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
