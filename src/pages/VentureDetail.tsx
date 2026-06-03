import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, GraduationCap, Globe, Target, Briefcase, TrendingUp, DollarSign, Lightbulb, Handshake, FileText, Video, CheckCircle2, Download, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StageProgress } from "@/components/StageProgress";
import { RequestCollaborationDialog } from "@/components/RequestCollaborationDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useToast } from "@/hooks/use-toast";
import { stageLabel } from "@/lib/labels";

export default function VentureDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, roles } = useAuth();
  const { toast } = useToast();
  const { format } = useCurrency();
  const [venture, setVenture] = useState<any>(null);
  const [startup, setStartup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [collabOpen, setCollabOpen] = useState(false);
  const [collabDefault, setCollabDefault] = useState<string | undefined>(undefined);
  const [openingDeck, setOpeningDeck] = useState(false);

  const canRequest = !!user && (roles.includes("investor") || roles.includes("mentor"));

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [showcaseRes, startupRes] = await Promise.all([
        supabase.from("showcase_ventures").select("*").eq("id", id).maybeSingle(),
        supabase.from("startups").select("*").eq("id", id).maybeSingle(),
      ]);
      setVenture(showcaseRes.data);
      setStartup(startupRes.data);
      setLoading(false);
    })();
  }, [id]);

  const openPitchDeck = async () => {
    if (!startup?.pitch_deck_url) return;
    setOpeningDeck(true);
    const { data, error } = await supabase.storage
      .from("pitch-decks")
      .createSignedUrl(startup.pitch_deck_url, 60 * 10);
    setOpeningDeck(false);
    if (error || !data?.signedUrl) {
      toast({ title: "Cannot open pitch deck", description: "You may not have access to this file.", variant: "destructive" });
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

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
        logo_url: startup.logo_url,
        currentStageEnum: startup.current_stage,
        hasPitchDeck: !!startup.pitch_deck_url,
        isDraft: !startup.is_published,
      }
    : venture
    ? { ...venture, currentStageEnum: null, innovation_category: null, milestones: null, demo_video_url: null, hasPitchDeck: false, isDraft: false }
    : null;

  const isOwner = user && startup && startup.founder_id === user.id;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-background">
        <div className="container py-8 max-w-5xl">
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
              {/* Hero */}
              <div className="rounded-xl border border-border bg-gradient-to-br from-card via-card to-muted/40 p-6 md:p-8 mb-8">
                <div className="flex items-start gap-5">
                  {v.logo_url ? (
                    <img src={v.logo_url} alt={v.name} className="h-20 w-20 rounded-lg object-cover border border-border shrink-0" />
                  ) : (
                    <div className="h-20 w-20 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-display text-2xl font-bold shrink-0">
                      {v.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Pitch Room</p>
                    <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">{v.name}</h1>
                    <div className="flex flex-wrap items-center gap-2">
                      {v.industry && <Badge variant="secondary">{v.industry}</Badge>}
                      {v.innovation_category && <Badge variant="outline">{v.innovation_category}</Badge>}
                      <Badge variant="outline">{stageLabel(v.stage)}</Badge>
                      {v.isDraft && isOwner && <Badge variant="destructive">Draft (only you can see this)</Badge>}
                      {v.university && (
                        <Badge variant="outline" className="gap-1 border-primary/30 text-primary">
                          <GraduationCap className="h-3 w-3" /> {v.university}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-5">
                  {v.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{v.location}</span>}
                  {v.website && (
                    <a href={v.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                      <Globe className="h-3.5 w-3.5" /> Website <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mt-5">
                  {v.hasPitchDeck && (
                    <Button onClick={openPitchDeck} disabled={openingDeck} variant="outline" className="gap-2">
                      <FileText className="h-4 w-4" /> {openingDeck ? "Opening..." : "View Pitch Deck"}
                    </Button>
                  )}
                  {v.demo_video_url && (
                    <Button variant="outline" asChild className="gap-2">
                      <a href={v.demo_video_url} target="_blank" rel="noopener noreferrer"><Video className="h-4 w-4" /> Watch Demo</a>
                    </Button>
                  )}
                  {startup && canRequest && roles.includes("investor") && (
                    <Button onClick={() => { setCollabDefault("pitch_session"); setCollabOpen(true); }} className="gap-2">
                      <Video className="h-4 w-4" /> Request Live Pitch
                    </Button>
                  )}
                  {startup && canRequest && (
                    <Button onClick={() => { setCollabDefault(undefined); setCollabOpen(true); }} variant={roles.includes("investor") ? "outline" : "default"} className="gap-2">
                      <Handshake className="h-4 w-4" /> Request Collaboration
                    </Button>
                  )}
                </div>
              </div>

              {/* Stage progress */}
              {v.currentStageEnum && (
                <div className="rounded-lg border border-border bg-card p-5 mb-8">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-semibold">Startup Maturity</p>
                  <StageProgress stage={v.currentStageEnum} />
                </div>
              )}

              {/* Description */}
              {v.description && (
                <div className="mb-8">
                  <h2 className="font-display text-lg font-semibold text-foreground mb-3">About</h2>
                  <p className="text-base text-foreground leading-relaxed">{v.description}</p>
                </div>
              )}

              {/* Problem/Solution Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {v.problem_statement && (
                  <DetailCard icon={<Target className="h-5 w-5 text-destructive" />} title="The Problem">{v.problem_statement}</DetailCard>
                )}
                {v.solution && (
                  <DetailCard icon={<Lightbulb className="h-5 w-5 text-primary" />} title="Our Solution">{v.solution}</DetailCard>
                )}
                {v.target_market && (
                  <DetailCard icon={<TrendingUp className="h-5 w-5 text-primary" />} title="Target Market">{v.target_market}</DetailCard>
                )}
                {v.business_model && (
                  <DetailCard icon={<Briefcase className="h-5 w-5 text-primary" />} title="Business Model">{v.business_model}</DetailCard>
                )}
              </div>

              {/* Funding */}
              {v.funding_requested && (
                <div className="flex items-center gap-4 p-6 rounded-lg border-2 border-primary/20 bg-primary/5 mb-8">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Funding required</p>
                    <p className="font-display text-2xl font-bold text-foreground">{format(v.funding_requested)}</p>
                  </div>
                </div>
              )}

              {/* Milestones */}
              {v.milestones?.length > 0 && (
                <div className="rounded-lg border border-border bg-card p-6 mb-8">
                  <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" /> Milestones Achieved
                  </h3>
                  <ul className="space-y-2.5">
                    {v.milestones.map((m: string, i: number) => (
                      <li key={i} className="flex gap-3 text-sm text-foreground">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
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
          defaultRequestType={collabDefault}
        />
      )}
    </div>
  );
}

function DetailCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="p-5 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="font-display font-semibold text-sm text-foreground">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{children}</p>
    </div>
  );
}
