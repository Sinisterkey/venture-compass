import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { safeErrorMessage } from "@/lib/errors";
import {
  Eye, Users, Rocket, ArrowRight, Plus, Settings, GraduationCap, FileText, Filter, Calendar, Handshake, CheckCircle2, XCircle, Video,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import {
  recommendStartupsForInvestor,
  recommendStartupsForMentor,
  type RecommendedStartup,
} from "@/lib/recommendations";
import { SchedulePitchSessionDialog } from "@/components/SchedulePitchSessionDialog";

type Startup = Database["public"]["Tables"]["startups"]["Row"];

interface CollabRequest {
  id: string;
  startup_id: string;
  requester_id: string;
  requester_role: string;
  request_type: string;
  message: string | null;
  status: string;
  created_at: string;
  founder_id: string;
}

const REQUEST_TYPE_LABELS: Record<string, string> = {
  pitch_session: "Pitch Session",
  meeting: "Meeting",
  prototype_demo: "Prototype Demo",
  additional_info: "Additional Information",
  funding_interest: "Funding Interest",
  offer_mentorship: "Mentorship Offer",
  strategy_discussion: "Strategy Discussion",
  technical_discussion: "Technical Discussion",
};

export default function Dashboard() {
  const { user, profile, roles, loading } = useAuth();
  const [myStartups, setMyStartups] = useState<Startup[]>([]);
  const [recs, setRecs] = useState<RecommendedStartup[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [incomingRequests, setIncomingRequests] = useState<CollabRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<CollabRequest[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [pitchSessions, setPitchSessions] = useState<any[]>([]);
  const [scheduling, setScheduling] = useState<{ requestId: string; startupId: string; startupName: string; investorId: string } | null>(null);
  const { toast } = useToast();

  const primaryRole = roles[0] ?? null;
  const primaryRoleLabel = primaryRole ? primaryRole.charAt(0).toUpperCase() + primaryRole.slice(1) : "Member";

  useEffect(() => {
    if (!user || loading) return;

    (async () => {
      // My startups
      const { data: s } = await supabase.from("startups").select("*").eq("founder_id", user.id);
      setMyStartups(s || []);

      // Incoming collaboration requests (founder)
      const { data: incoming } = await supabase
        .from("collaboration_requests")
        .select("*")
        .eq("founder_id", user.id)
        .order("created_at", { ascending: false });
      setIncomingRequests(incoming || []);

      // Outgoing collaboration requests (investor/mentor)
      const { data: outgoing } = await supabase
        .from("collaboration_requests")
        .select("*")
        .eq("requester_id", user.id)
        .order("created_at", { ascending: false });
      setOutgoingRequests(outgoing || []);

      // Upcoming events
      const { data: events } = await supabase
        .from("innovation_events")
        .select("*")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(3);
      setUpcomingEvents(events || []);

      // Pitch sessions (founder OR investor)
      const { data: sessions } = await supabase
        .from("pitch_sessions")
        .select("*")
        .or(`founder_id.eq.${user.id},investor_id.eq.${user.id}`)
        .gte("scheduled_at", new Date(Date.now() - 24 * 3600 * 1000).toISOString())
        .order("scheduled_at", { ascending: true });
      let withNames: any[] = sessions || [];
      if (withNames.length > 0) {
        const ids = Array.from(new Set(withNames.map((s) => s.startup_id)));
        const { data: ss } = await supabase.from("startups").select("id,name").in("id", ids);
        const byId = new Map((ss || []).map((s: any) => [s.id, s.name]));
        withNames = withNames.map((s) => ({ ...s, startup_name: byId.get(s.startup_id) }));
      }
      setPitchSessions(withNames);
    })();
  }, [user, loading]);

  // Rule-based recommendations
  useEffect(() => {
    if (!user || !primaryRole) return;
    if (primaryRole !== "investor" && primaryRole !== "mentor") return;
    setRecsLoading(true);
    (primaryRole === "investor"
      ? recommendStartupsForInvestor(user.id)
      : recommendStartupsForMentor(user.id)
    ).then((r) => {
      setRecs(r);
      setRecsLoading(false);
    });
  }, [user, primaryRole]);

  const refreshSessions = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("pitch_sessions")
      .select("*")
      .or(`founder_id.eq.${user.id},investor_id.eq.${user.id}`)
      .gte("scheduled_at", new Date(Date.now() - 24 * 3600 * 1000).toISOString())
      .order("scheduled_at", { ascending: true });
    let withNames: any[] = data || [];
    if (withNames.length > 0) {
      const ids = Array.from(new Set(withNames.map((s) => s.startup_id)));
      const { data: ss } = await supabase.from("startups").select("id,name").in("id", ids);
      const byId = new Map((ss || []).map((s: any) => [s.id, s.name]));
      withNames = withNames.map((s) => ({ ...s, startup_name: byId.get(s.startup_id) }));
    }
    setPitchSessions(withNames);
  };

  const respondToRequest = async (req: CollabRequest, status: "accepted" | "declined") => {
    const { error } = await supabase.from("collaboration_requests").update({ status }).eq("id", req.id);
    if (error) {
      toast({ title: "Error", description: safeErrorMessage(error), variant: "destructive" });
      return;
    }
    toast({ title: `Request ${status}` });
    setIncomingRequests((prev) => prev.map((r) => r.id === req.id ? { ...r, status } : r));
    if (status === "accepted" && req.request_type === "pitch_session") {
      setScheduling({ requestId: req.id, startupId: req.startup_id, startupName: "this startup", investorId: req.requester_id });
    }
  };

  const publishStartup = async (id: string) => {
    const { error } = await supabase.from("startups").update({ is_published: true }).eq("id", id);
    if (error) toast({ title: "Error", description: safeErrorMessage(error), variant: "destructive" });
    else { toast({ title: "Startup published!" }); const { data } = await supabase.from("startups").select("*").eq("founder_id", user!.id); setMyStartups(data || []); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const isFounder = primaryRole === "founder";
  const isInvestor = primaryRole === "investor";
  const isMentor = primaryRole === "mentor";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {/* Header */}
        <div className="border-b border-border bg-muted/30">
          <div className="container py-6 flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="capitalize text-xs">{primaryRoleLabel}</Badge>
                <span className="text-xs text-muted-foreground">{user.email}</span>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/settings" className="gap-2"><Settings className="h-4 w-4" /> Settings</Link>
            </Button>
          </div>
        </div>

        <div className="container py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">

              {/* Founder: My Startups */}
              {isFounder && (
                <div className="rounded-lg border border-border bg-card">
                  <div className="flex items-center justify-between p-5 border-b border-border">
                    <h2 className="font-display font-semibold text-foreground">My Startups</h2>
                    <Button size="sm" asChild className="gap-1">
                      <Link to="/create-startup"><Plus className="h-3.5 w-3.5" /> Add Startup</Link>
                    </Button>
                  </div>
                  <div className="p-5">
                    {myStartups.length === 0 ? (
                      <div className="text-center py-6">
                        <Rocket className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-3">No startups yet</p>
                        <Button size="sm" asChild><Link to="/create-startup">Create your first startup</Link></Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {myStartups.map((s) => (
                          <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Link to={`/ventures/${s.id}`} className="text-sm font-medium text-foreground hover:text-primary">{s.name}</Link>
                                <Badge variant={s.is_published ? "default" : "secondary"} className="text-xs">{s.is_published ? "Published" : "Draft"}</Badge>
                                {s.current_stage && <Badge variant="outline" className="text-xs capitalize">{s.current_stage}</Badge>}
                                {s.is_university_project && (
                                  <Badge variant="outline" className="text-xs gap-1 border-primary/30 text-primary">
                                    <GraduationCap className="h-3 w-3" />
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">{s.industry} · {s.innovation_category || "—"}</p>
                            </div>
                            <div className="flex gap-2 ml-3">
                              {s.pitch_deck_url && <Badge variant="outline" className="text-xs gap-1"><FileText className="h-3 w-3" /> Deck</Badge>}
                              {!s.is_published && <Button size="sm" variant="outline" onClick={() => publishStartup(s.id)} className="text-xs">Publish</Button>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Founder: Incoming Collaboration Requests */}
              {isFounder && (
                <div className="rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-2 p-5 border-b border-border">
                    <Handshake className="h-5 w-5 text-primary" />
                    <h2 className="font-display font-semibold text-foreground">Collaboration Requests</h2>
                  </div>
                  <div className="p-5">
                    {incomingRequests.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4">No requests yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {incomingRequests.map((r) => (
                          <div key={r.id} className="p-3 rounded-lg border border-border">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs capitalize">{r.requester_role}</Badge>
                                <Badge variant="outline" className="text-xs">{REQUEST_TYPE_LABELS[r.request_type] || r.request_type}</Badge>
                                <Badge
                                  variant={r.status === "accepted" ? "default" : r.status === "declined" ? "destructive" : "secondary"}
                                  className="text-xs capitalize"
                                >{r.status}</Badge>
                              </div>
                              {r.status === "pending" && (
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" onClick={() => respondToRequest(r, "accepted")} className="gap-1 text-xs">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> {r.request_type === "pitch_session" ? "Accept & Schedule" : "Accept"}
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => respondToRequest(r, "declined")} className="gap-1 text-xs">
                                    <XCircle className="h-3.5 w-3.5" /> Decline
                                  </Button>
                                </div>
                              )}
                            </div>
                            {r.message && <p className="text-xs text-muted-foreground mt-2">{r.message}</p>}
                            <p className="text-xs text-muted-foreground mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Investor / Mentor: Recommended Startups (rule-based) */}
              {(isInvestor || isMentor) && (
                <div className="rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-2 p-5 border-b border-border">
                    <Filter className="h-5 w-5 text-primary" />
                    <h2 className="font-display font-semibold text-foreground">Recommended Startups</h2>
                    <span className="text-xs text-muted-foreground ml-1">via rule-based filtering</span>
                  </div>
                  <div className="p-5">
                    {recsLoading ? (
                      <p className="text-sm text-muted-foreground py-4">Loading recommendations…</p>
                    ) : recs.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-sm text-muted-foreground mb-2">No matching startups yet</p>
                        <p className="text-xs text-muted-foreground">Define your preferences in <Link to="/settings" className="text-primary hover:underline">Settings</Link> to improve recommendations.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {recs.map((s) => (
                          <Link key={s.id} to={`/ventures/${s.id}`} className="block p-3 rounded-lg border border-border hover:border-primary/30 transition-colors">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground">{s.name}</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {s.industry && <Badge variant="secondary" className="text-xs">{s.industry}</Badge>}
                                  {s.current_stage && <Badge variant="outline" className="text-xs capitalize">{s.current_stage}</Badge>}
                                </div>
                                {s.match_reasons.length > 0 && (
                                  <p className="text-xs text-muted-foreground mt-1.5">{s.match_reasons.join(" · ")}</p>
                                )}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Investor / Mentor: My Requests */}
              {(isInvestor || isMentor) && (
                <div className="rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-2 p-5 border-b border-border">
                    <Handshake className="h-5 w-5 text-primary" />
                    <h2 className="font-display font-semibold text-foreground">My Collaboration Requests</h2>
                  </div>
                  <div className="p-5">
                    {outgoingRequests.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4">You haven't sent any requests yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {outgoingRequests.map((r) => (
                          <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">{REQUEST_TYPE_LABELS[r.request_type] || r.request_type}</Badge>
                              <Badge
                                variant={r.status === "accepted" ? "default" : r.status === "declined" ? "destructive" : "secondary"}
                                className="text-xs capitalize"
                              >{r.status}</Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="rounded-lg border border-border bg-card p-5">
                <h2 className="font-display font-semibold text-foreground mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  {isFounder && (
                    <Link to="/create-startup" className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors">
                      <Plus className="h-5 w-5 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">Add Startup</p>
                        <p className="text-xs text-muted-foreground">Create a new venture listing</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </Link>
                  )}
                  <Link to="/settings" className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors">
                    <Settings className="h-5 w-5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{isInvestor || isMentor ? "Update Preferences" : "Edit Profile"}</p>
                      <p className="text-xs text-muted-foreground">{isInvestor || isMentor ? "Improve filtering" : "Update your information"}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </Link>
                  <Link to="/discover" className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors">
                    <Eye className="h-5 w-5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">Explore Ventures</p>
                      <p className="text-xs text-muted-foreground">Discover startups</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </Link>
                  <Link to="/events" className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors">
                    <Calendar className="h-5 w-5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">Innovation Events</p>
                      <p className="text-xs text-muted-foreground">Hackathons, demo days, fairs</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </Link>
                </div>
              </div>

              {upcomingEvents.length > 0 && (
                <div className="rounded-lg border border-border bg-card p-5">
                  <h2 className="font-display font-semibold text-foreground mb-3">Upcoming Events</h2>
                  <div className="space-y-3">
                    {upcomingEvents.map((e) => (
                      <Link key={e.id} to={`/events/${e.id}`} className="block">
                        <p className="text-sm font-medium text-foreground hover:text-primary">{e.title}</p>
                        <p className="text-xs text-muted-foreground">{new Date(e.starts_at).toLocaleDateString()} · {e.university || "—"}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {pitchSessions.length > 0 && (
                <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Video className="h-5 w-5 text-primary" />
                    <h2 className="font-display font-semibold text-foreground">Live Pitch Sessions</h2>
                  </div>
                  <div className="space-y-3">
                    {pitchSessions.map((s) => {
                      const ms = new Date(s.scheduled_at).getTime();
                      const minutesUntil = Math.round((ms - Date.now()) / 60000);
                      const canJoin = minutesUntil <= 10 && minutesUntil > -120;
                      return (
                        <div key={s.id} className="rounded-lg border border-border bg-card p-3">
                          <p className="text-sm font-medium text-foreground">{s.startup_name || "Pitch session"}</p>
                          <p className="text-xs text-muted-foreground mb-2">{new Date(s.scheduled_at).toLocaleString()} · {s.duration_minutes} min</p>
                          <Button asChild size="sm" variant={canJoin ? "default" : "outline"} className="w-full gap-1">
                            <Link to={`/pitch-session/${s.id}`}>
                              <Video className="h-3.5 w-3.5" />
                              {canJoin ? "Join now" : minutesUntil > 0 ? `In ${minutesUntil} min` : "View room"}
                            </Link>
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
      {scheduling && (
        <SchedulePitchSessionDialog
          open={!!scheduling}
          onOpenChange={(v) => { if (!v) setScheduling(null); }}
          collaborationRequestId={scheduling.requestId}
          startupId={scheduling.startupId}
          startupName={scheduling.startupName}
          investorId={scheduling.investorId}
          onScheduled={refreshSessions}
        />
      )}
    </div>
  );
}

