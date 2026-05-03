import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, GraduationCap, Globe, Target, Briefcase, TrendingUp, DollarSign, Lightbulb, Handshake, FileText, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StageProgress } from "@/components/StageProgress";
import { RequestCollaborationDialog } from "@/components/RequestCollaborationDialog";
import { useAuth } from "@/contexts/AuthContext";

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

interface Startup {
  id: string;
  founder_id: string;
  name: string;
  description: string | null;
  industry: string | null;
  problem_statement: string | null;
  solution: string | null;
  target_market: string | null;
  business_model: string | null;
  funding_requested: number | null;
  funding_stage: string | null;
  current_stage: string | null;
  innovation_category: string | null;
  milestones: string[] | null;
  university_name: string | null;
  website: string | null;
  demo_video_url: string | null;
}

export default function VentureDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, roles } = useAuth();
  const [venture, setVenture] = useState<Venture | null>(null);
  const [startup, setStartup] = useState<Startup | null>(null);
  const [loading, setLoading] = useState(true);
  const [collabOpen, setCollabOpen] = useState(false);

  const canRequest = !!user && (roles.includes("investor") || roles.includes("mentor"));

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [showcaseRes, startupRes] = await Promise.all([
        supabase.from("showcase_ventures").select("*").eq("id", id).maybeSingle(),
        supabase.from("startups").select("*").eq("id", id).eq("is_published", true).maybeSingle(),
      ]);
      setVenture(showcaseRes.data as Venture | null);
      setStartup(startupRes.data as Startup | null);
      setLoading(false);
    })();
  }, [id]);

  const v = startup
    ? {
        name: startup.name,
        industry: startup.industry || "",
        description: startup.description || "",
        problem_statement: startup.problem_statement,
        solution: startup.solution,
        target_market: startup.target_market,
        business_model: startup.business_model,
        location: "",
        stage: startup.current_stage || startup.funding_stage || "idea",
        university: startup.university_name,
        website: startup.website,
        funding_requested: startup.funding_requested,
        innovation_category: startup.innovation_category,
        milestones: startup.milestones,
        demo_video_url: startup.demo_video_url,
        currentStageEnum: startup.current_stage,
      }
    : venture
    ? { ...venture, currentStageEnum: null, innovation_category: null, milestones: null, demo_video_url: null }
    : null;

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
          ) : !v ? (
            <div className="text-center py-20">
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">Venture not found</h1>
              <p className="text-muted-foreground mb-6">This venture may have been removed.</p>
              <Button asChild><Link to="/discover">Back to discover</Link></Button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="border-b border-border pb-6 mb-8">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Pitch Room</p>
                    <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">{v.name}</h1>
                  </div>
                  {v.university && (
                    <Badge variant="outline" className="gap-1 border-primary/30 text-primary shrink-0 mt-2">
                      <GraduationCap className="h-3 w-3" /> Verified student
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-5">
                  {v.industry && <Badge variant="secondary">{v.industry}</Badge>}
                  {(v as any).innovation_category && <Badge variant="outline">{(v as any).innovation_category}</Badge>}
                  {(v as any).location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{(v as any).location}</span>}
                  {v.website && (
                    <a href={v.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                      <Globe className="h-3.5 w-3.5" /> Website
                    </a>
                  )}
                </div>

                {/* Stage indicator */}
                {(v as any).currentStageEnum && (
                  <div className="mb-5">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Startup maturity</p>
                    <StageProgress stage={(v as any).currentStageEnum} />
                  </div>
                )}

                {startup && canRequest && (
                  <Button onClick={() => setCollabOpen(true)} className="gap-2">
                    <Handshake className="h-4 w-4" /> Request Collaboration
                  </Button>
                )}
              </div>

              <p className="text-base text-foreground leading-relaxed mb-8">{v.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {v.problem_statement && (
                  <DetailCard icon={<Target className="h-5 w-5 text-primary" />} title="Problem statement">
                    {v.problem_statement}
                  </DetailCard>
                )}
                {v.solution && (
                  <DetailCard icon={<Lightbulb className="h-5 w-5 text-primary" />} title="Proposed solution">
                    {v.solution}
                  </DetailCard>
                )}
                {v.target_market && (
                  <DetailCard icon={<TrendingUp className="h-5 w-5 text-primary" />} title="Target market">
                    {v.target_market}
                  </DetailCard>
                )}
                {v.business_model && (
                  <DetailCard icon={<Briefcase className="h-5 w-5 text-primary" />} title="Business model">
                    {v.business_model}
                  </DetailCard>
                )}
              </div>

              {v.funding_requested && (
                <div className="flex items-center gap-3 p-5 rounded-lg border border-border bg-muted/40 mb-8">
                  <DollarSign className="h-6 w-6 text-primary" />
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Funding required</p>
                    <p className="font-display text-xl font-bold text-foreground">${v.funding_requested.toLocaleString()}</p>
                  </div>
                </div>
              )}

              {(v as any).milestones?.length > 0 && (
                <div className="mb-8">
                  <h3 className="font-display font-semibold text-foreground mb-3">Milestones achieved</h3>
                  <ul className="space-y-2">
                    {(v as any).milestones.map((m: string, i: number) => (
                      <li key={i} className="flex gap-2 text-sm text-foreground">
                        <span className="text-primary">•</span>{m}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(v as any).demo_video_url && (
                <a href={(v as any).demo_video_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline mb-4">
                  <Video className="h-4 w-4" /> Watch demo video
                </a>
              )}

              {v.university && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  Built at <span className="font-medium text-foreground">{v.university}</span>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
      {startup && (
        <RequestCollaborationDialog
          open={collabOpen}
          onOpenChange={setCollabOpen}
          startupId={startup.id}
          founderId={startup.founder_id}
          startupName={startup.name}
        />
      )}
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
      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{children}</p>
    </div>
  );
}
