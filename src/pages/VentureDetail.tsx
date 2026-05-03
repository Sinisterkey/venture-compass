import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, GraduationCap, Globe, Target, Briefcase, TrendingUp, DollarSign, Lightbulb, Handshake, FileText, Video, X, Play, Users } from "lucide-react";
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

interface TeamMember {
  name: string;
  role: string;
  bio?: string;
  image_url?: string;
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
  logo_url: string | null;
  pitch_deck_url: string | null;
  currency: string | null;
  team_members: TeamMember[] | null;
}

export default function VentureDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, roles } = useAuth();
  const [venture, setVenture] = useState<Venture | null>(null);
  const [startup, setStartup] = useState<Startup | null>(null);
  const [loading, setLoading] = useState(true);
  const [collabOpen, setCollabOpen] = useState(false);
  const [deckOpen, setDeckOpen] = useState(false);
  const [deckUrl, setDeckUrl] = useState<string | null>(null);
  const [deckLoading, setDeckLoading] = useState(false);

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

  const handleViewDeck = async () => {
    if (!startup?.pitch_deck_url) return;
    setDeckLoading(true);
    try {
      const { data } = await supabase.storage
        .from("pitch-decks")
        .createSignedUrl(startup.pitch_deck_url, 3600);
      if (data?.signedUrl) {
        setDeckUrl(data.signedUrl);
        setDeckOpen(true);
      }
    } catch (err) {
      console.error("Error generating deck URL:", err);
    } finally {
      setDeckLoading(false);
    }
  };

  const getVideoEmbedUrl = (url: string): string => {
    // Convert YouTube URLs to embed format
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const videoId = url.includes("youtu.be") 
        ? url.split("youtu.be/")[1]?.split("?")[0]
        : new URLSearchParams(new URL(url).search).get("v");
      return `https://www.youtube.com/embed/${videoId}`;
    }
    // Vimeo
    if (url.includes("vimeo.com")) {
      const videoId = url.split("vimeo.com/")[1];
      return `https://player.vimeo.com/video/${videoId}`;
    }
    return url;
  };

  const getCurrencySymbol = (currency: string | null): string => {
    const symbols: Record<string, string> = {
      ZMK: "ZMK",
      USD: "$",
      EUR: "€",
      GBP: "£",
      ZAR: "R",
    };
    return symbols[currency || "ZMK"] || currency || "$";
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
        currentStageEnum: startup.current_stage,
        logo_url: startup.logo_url,
        pitch_deck_url: startup.pitch_deck_url,
        currency: startup.currency,
        team_members: startup.team_members,
      }
    : venture
    ? { 
        ...venture, 
        currentStageEnum: null, 
        innovation_category: null, 
        milestones: null, 
        demo_video_url: null,
        logo_url: null,
        pitch_deck_url: null,
        currency: null,
        team_members: null,
      }
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
              {/* Hero Banner */}
              {startup?.logo_url && (
                <div className="mb-8 rounded-lg overflow-hidden animate-in fade-in duration-500">
                  <img 
                    src={startup.logo_url} 
                    alt={v.name} 
                    className="w-full h-48 object-cover bg-gradient-to-br from-primary/10 to-secondary/10"
                  />
                </div>
              )}

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

                {/* Call-to-Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  {startup && canRequest && (
                    <Button onClick={() => setCollabOpen(true)} className="gap-2">
                      <Handshake className="h-4 w-4" /> Request Collaboration
                    </Button>
                  )}
                  {startup?.pitch_deck_url && (
                    <Button 
                      onClick={handleViewDeck} 
                      disabled={deckLoading}
                      variant="outline"
                      className="gap-2"
                    >
                      <FileText className="h-4 w-4" /> 
                      {deckLoading ? "Loading..." : "View Pitch Deck"}
                    </Button>
                  )}
                </div>
              </div>

              <p className="text-base text-foreground leading-relaxed mb-8">{v.description}</p>

              {/* Demo Video Section */}
              {(v as any).demo_video_url && (
                <div className="mb-8 rounded-lg overflow-hidden border border-border bg-muted/30 animate-in fade-in duration-500">
                  <div className="aspect-video bg-black/5 relative">
                    <iframe
                      width="100%"
                      height="100%"
                      src={getVideoEmbedUrl((v as any).demo_video_url)}
                      title={`${v.name} demo`}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>
                </div>
              )}

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
                <div className="flex items-center gap-3 p-5 rounded-lg border border-border bg-gradient-to-r from-primary/5 to-secondary/5 mb-8 hover:shadow-md transition-shadow">
                  <DollarSign className="h-6 w-6 text-primary shrink-0" />
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Funding required</p>
                    <p className="font-display text-xl font-bold text-foreground">
                      {getCurrencySymbol(startup?.currency)} {v.funding_requested.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Team Members Section */}
              {startup?.team_members && startup.team_members.length > 0 && (
                <div className="mb-8">
                  <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" /> Team Members
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {startup.team_members.map((member, i) => (
                      <div key={i} className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-shadow animate-in fade-in duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                        {member.image_url && (
                          <img 
                            src={member.image_url} 
                            alt={member.name} 
                            className="w-full h-40 object-cover rounded-lg mb-3 bg-muted"
                          />
                        )}
                        <p className="font-medium text-foreground text-sm">{member.name}</p>
                        <p className="text-xs text-primary font-medium mb-2">{member.role}</p>
                        {member.bio && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{member.bio}</p>
                        )}
                      </div>
                    ))}
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

      {/* Deck Preview Modal */}
      {deckOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col animate-in zoom-in duration-300">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-semibold text-foreground">Pitch Deck - {startup?.name}</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { setDeckOpen(false); setDeckUrl(null); }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-auto">
              {deckUrl && (
                <iframe
                  src={`${deckUrl}#toolbar=1`}
                  className="w-full h-full min-h-96"
                  title="Pitch Deck"
                />
              )}
            </div>
            <div className="p-4 border-t border-border flex gap-3 justify-between">
              <Button 
                variant="outline" 
                onClick={() => { setDeckOpen(false); setDeckUrl(null); }}
              >
                Close
              </Button>
              {deckUrl && (
                <a href={deckUrl} download target="_blank" rel="noopener noreferrer">
                  <Button className="gap-2">
                    <FileText className="h-4 w-4" /> Download
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

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
    <div className="p-5 rounded-lg border border-border bg-card hover:shadow-md hover:border-primary/30 transition-all duration-300 animate-in fade-in duration-500">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h3 className="font-display font-semibold text-sm text-foreground">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{children}</p>
    </div>
  );
}
