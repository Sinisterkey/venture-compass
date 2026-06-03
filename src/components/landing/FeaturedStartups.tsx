import { useEffect, useState } from "react";
import { ArrowRight, MapPin, GraduationCap, Rocket } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { stageLabel } from "@/lib/labels";

interface Venture {
  id: string;
  name: string;
  industry: string;
  location: string;
  stage: string;
  university: string | null;
  description: string;
}

export function FeaturedStartups() {
  const [startups, setStartups] = useState<Venture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("showcase_ventures")
        .select("id, name, industry, location, stage, university, description")
        .order("created_at", { ascending: true })
        .limit(6);
      setStartups((data as Venture[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <section className="py-20 bg-background">
      <div className="container">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary mb-2">
              <Rocket className="h-4 w-4" /> Featured ventures
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              Startups solving real African problems
            </h2>
            <p className="text-muted-foreground text-sm mt-1.5">Discover innovative ideas from student and independent founders</p>
          </div>
          <Button variant="ghost" className="hidden md:flex items-center gap-2 text-sm" asChild>
            <Link to="/discover">View all <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {startups.map((s) => (
              <Link
                to={`/ventures/${s.id}`}
                key={s.id}
                className="group relative flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="relative h-14 bg-gradient-to-br from-primary/90 via-primary to-accent">
                  <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white_1px,transparent_1px)] [background-size:14px_14px]" />
                </div>
                <div className="px-5 -mt-6 relative">
                  <div className="h-12 w-12 rounded-xl bg-card ring-4 ring-card shadow-sm flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-display font-bold text-xl">
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="p-5 pt-3 flex flex-col flex-1">
                  <p className="font-display font-semibold text-foreground text-base truncate group-hover:text-primary transition-colors">{s.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 mb-2">
                    <MapPin className="h-3 w-3" />{s.location}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1 leading-relaxed">{s.description}</p>
                  <div className="flex flex-wrap gap-1.5 pt-3 border-t border-border/60">
                    <Badge variant="secondary" className="text-[10px] font-medium">{s.industry}</Badge>
                    <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">{stageLabel(s.stage)}</Badge>
                    {s.university && (
                      <Badge variant="outline" className="text-[10px] gap-1 border-accent/40 text-accent">
                        <GraduationCap className="h-2.5 w-2.5" /> University
                      </Badge>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-6 md:hidden">
          <Button variant="outline" className="w-full text-sm" asChild>
            <Link to="/discover">View all ventures <ArrowRight className="h-4 w-4 ml-2" /></Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
