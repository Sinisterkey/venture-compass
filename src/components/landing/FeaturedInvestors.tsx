import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
    <section className="py-16 bg-muted/40">
      <div className="container">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
          Active investors
        </h2>
        <p className="text-muted-foreground text-sm mb-8">
          Capital ready to deploy into African innovation
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))
            : investors.map((investor) => (
                <div
                  key={investor.id}
                  className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-sm font-semibold shrink-0">
                    {investor.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-foreground truncate">{investor.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{investor.focus}</p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">{investor.investor_type}</Badge>
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}
