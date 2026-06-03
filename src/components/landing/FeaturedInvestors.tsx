import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Investor {
  id: string;
  name: string;
  focus: string;
  investor_type: string;
  initials: string;
}

export function FeaturedInvestors() {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("showcase_investors")
        .select("id, name, focus, investor_type, initials")
        .order("created_at", { ascending: true })
        .limit(6);
      setInvestors((data as Investor[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <section className="py-20 bg-muted/40">
      <div className="container">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary mb-2">
              <TrendingUp className="h-4 w-4" /> Capital partners
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              Investors ready to back African ideas
            </h2>
            <p className="text-muted-foreground text-sm mt-1.5 max-w-xl">
              A growing network of funds, angels and family offices actively reviewing student-led ventures.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))
            : investors.map((investor) => (
                <div
                  key={investor.id}
                  className="group relative rounded-xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="flex items-start gap-4">
                    <div className="relative shrink-0">
                      <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground flex items-center justify-center font-display text-lg font-bold shadow-sm">
                        {investor.initials}
                      </div>
                      <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-card border border-border flex items-center justify-center">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-display font-semibold text-foreground text-base leading-tight truncate group-hover:text-primary transition-colors">
                        {investor.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                        {investor.focus}
                      </p>
                      <Badge variant="outline" className="text-[10px] mt-2.5 border-primary/30 text-primary uppercase tracking-wider">
                        {investor.investor_type}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}
