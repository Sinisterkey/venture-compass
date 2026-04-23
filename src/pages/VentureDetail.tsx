import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, GraduationCap, Globe, Target, Briefcase, TrendingUp, DollarSign, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Venture {
  id: string;
  name: string;
  industry: string;
  description: string;
  problem_statement: string | null;
  solution: string | null;
  target_market: string | null;
  business_model: string | null;
  location: string;
  country: string;
  stage: string;
  university: string | null;
  website: string | null;
  funding_requested: number | null;
}

export default function VentureDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [venture, setVenture] = useState<Venture | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from("showcase_ventures")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      setVenture(data as Venture | null);
      setLoading(false);
    })();
  }, [id]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-background">
        <div className="container py-8 max-w-4xl">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : !venture ? (
            <div className="text-center py-20">
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">Venture not found</h1>
              <p className="text-muted-foreground mb-6">This venture may have been removed.</p>
              <Button asChild>
                <Link to="/discover">Back to discover</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">{venture.name}</h1>
                {venture.university && (
                  <Badge variant="outline" className="gap-1 border-primary/30 text-primary shrink-0 mt-2">
                    <GraduationCap className="h-3 w-3" /> Verified student
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-6">
                <Badge variant="secondary">{venture.industry}</Badge>
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{venture.location}</span>
                <span>·</span>
                <span>{venture.stage}</span>
                {venture.website && (
                  <>
                    <span>·</span>
                    <a href={venture.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                      <Globe className="h-3.5 w-3.5" /> Website
                    </a>
                  </>
                )}
              </div>

              <p className="text-base text-foreground leading-relaxed mb-8">{venture.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {venture.problem_statement && (
                  <DetailCard icon={<Target className="h-5 w-5 text-primary" />} title="Problem">
                    {venture.problem_statement}
                  </DetailCard>
                )}
                {venture.solution && (
                  <DetailCard icon={<Lightbulb className="h-5 w-5 text-primary" />} title="Solution">
                    {venture.solution}
                  </DetailCard>
                )}
                {venture.target_market && (
                  <DetailCard icon={<TrendingUp className="h-5 w-5 text-primary" />} title="Target market">
                    {venture.target_market}
                  </DetailCard>
                )}
                {venture.business_model && (
                  <DetailCard icon={<Briefcase className="h-5 w-5 text-primary" />} title="Business model">
                    {venture.business_model}
                  </DetailCard>
                )}
              </div>

              {venture.funding_requested && (
                <div className="flex items-center gap-3 p-5 rounded-lg border border-border bg-muted/40 mb-8">
                  <DollarSign className="h-6 w-6 text-primary" />
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Funding requested</p>
                    <p className="font-display text-xl font-bold text-foreground">
                      ${venture.funding_requested.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {venture.university && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  Built at <span className="font-medium text-foreground">{venture.university}</span>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function DetailCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="p-5 rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h3 className="font-display font-semibold text-sm text-foreground">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{children}</p>
    </div>
  );
}
