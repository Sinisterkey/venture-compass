import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { safeErrorMessage } from "@/lib/errors";
import { Plus, Settings, Sparkles, Loader2, CheckCircle2, XCircle, Eye, Heart, Bookmark, MessageSquare, TrendingUp, Building2 } from "lucide-react";
import { AIScoreBadge } from "@/components/AIScoreBadge";
import { recommendOrgsForInvestor, type RecommendedOrg } from "@/lib/recommendations";
import { stageLabel } from "@/lib/labels";

interface Organization {
  id: string;
  name: string;
  sector: string | null;
  is_published: boolean;
  readiness_score: number | null;
  funding_probability: number | null;
  logo_url: string | null;
  stage: string | null;
}

interface ConnReq {
  id: string;
  organization_id: string;
  initiator_id: string;
  recipient_id: string;
  direction: string;
  status: string;
  message: string | null;
  created_at: string;
}

export default function Dashboard() {
  const { user, profile, roles, loading } = useAuth();
  const { format } = useCurrency();
  const { toast } = useToast();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [incoming, setIncoming] = useState<ConnReq[]>([]);
  const [outgoing, setOutgoing] = useState<ConnReq[]>([]);
  const [recs, setRecs] = useState<RecommendedOrg[]>([]);
  const [stats, setStats] = useState({ views: 0, likes: 0, bookmarks: 0, messages: 0 });
  const [running, setRunning] = useState<string | null>(null);

  const isNgo = roles.includes("ngo");
  const isInvestor = roles.includes("investor");

  useEffect(() => {
    if (!user || loading) return;
    (async () => {
      if (isNgo) {
        const { data: o } = await supabase.from("organizations").select("id,name,sector,is_published,readiness_score,funding_probability,logo_url,stage").eq("owner_id", user.id);
        setOrgs(o || []);
        if (o && o.length > 0) {
          const ids = o.map((x) => x.id);
          const [vs, ls, bs, ms] = await Promise.all([
            supabase.from("org_profile_views").select("id", { count: "exact", head: true }).in("organization_id", ids),
            supabase.from("org_likes").select("id", { count: "exact", head: true }).in("organization_id", ids),
            supabase.from("org_bookmarks").select("id", { count: "exact", head: true }).in("organization_id", ids),
            supabase.from("org_messages").select("id", { count: "exact", head: true }).eq("recipient_id", user.id),
          ]);
          setStats({ views: vs.count || 0, likes: ls.count || 0, bookmarks: bs.count || 0, messages: ms.count || 0 });
        }
      }
      const { data: inc } = await supabase.from("connection_requests").select("*").eq("recipient_id", user.id).order("created_at", { ascending: false });
      setIncoming(inc || []);
      const { data: out } = await supabase.from("connection_requests").select("*").eq("initiator_id", user.id).order("created_at", { ascending: false });
      setOutgoing(out || []);
      if (isInvestor) {
        const r = await recommendOrgsForInvestor(user.id);
        setRecs(r);
      }
    })();
  }, [user, loading, isNgo, isInvestor]);

  const respond = async (id: string, status: "accepted" | "declined") => {
    const { error } = await supabase.from("connection_requests").update({ status }).eq("id", id);
    if (error) toast({ title: "Error", description: safeErrorMessage(error), variant: "destructive" });
    else { toast({ title: `Request ${status}` }); setIncoming((p) => p.map((r) => r.id === id ? { ...r, status } : r)); }
  };

  const runAI = async (orgId: string, fn: "ai-readiness" | "ai-funding-probability") => {
    setRunning(`${orgId}-${fn}`);
    const { error } = await supabase.functions.invoke(fn, { body: { organization_id: orgId } });
    setRunning(null);
    if (error) toast({ title: "AI error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Analysis complete" });
      const { data: o } = await supabase.from("organizations").select("id,name,sector,is_published,readiness_score,funding_probability,logo_url,stage").eq("owner_id", user!.id);
      setOrgs(o || []);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  // Admins manage the platform — they don't have an NGO/investor workspace
  if (roles.includes("admin") && !isNgo && !isInvestor) return <Navigate to="/admin" replace />;

  const primaryRole = isNgo ? "NGO" : isInvestor ? "Funder" : "Member";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="border-b border-border bg-muted/30">
          <div className="container py-6 flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">{primaryRole}</Badge>
                <span className="text-xs text-muted-foreground">{user.email}</span>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild><Link to="/settings" className="gap-2"><Settings className="h-4 w-4" /> Settings</Link></Button>
          </div>
        </div>

        <div className="container py-6 space-y-6">
          {isNgo && orgs.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Profile views", value: stats.views, icon: Eye },
                { label: "Likes", value: stats.likes, icon: Heart },
                { label: "Saves", value: stats.bookmarks, icon: Bookmark },
                { label: "Messages", value: stats.messages, icon: MessageSquare },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border border-border bg-card p-4">
                  <s.icon className="h-4 w-4 text-primary mb-2" />
                  <p className="text-2xl font-display font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {isNgo && (
                <div className="rounded-lg border border-border bg-card">
                  <div className="flex items-center justify-between p-5 border-b border-border">
                    <h2 className="font-display font-semibold flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /> My Organizations</h2>
                    <Button size="sm" asChild className="gap-1"><Link to="/create-organization"><Plus className="h-3.5 w-3.5" /> Add</Link></Button>
                  </div>
                  <div className="p-5 space-y-3">
                    {orgs.length === 0 ? (
                      <div className="text-center py-6">
                        <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-3">No organizations yet</p>
                        <Button size="sm" asChild><Link to="/create-organization">Create your first organization</Link></Button>
                      </div>
                    ) : orgs.map((o) => (
                      <div key={o.id} className="p-3 rounded-lg border border-border">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link to={`/organizations/${o.id}`} className="text-sm font-medium hover:text-primary">{o.name}</Link>
                              <Badge variant={o.is_published ? "default" : "secondary"} className="text-xs">{o.is_published ? "Published" : "Draft"}</Badge>
                              {o.stage && <Badge variant="outline" className="text-xs">{stageLabel(o.stage)}</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{o.sector || "—"}</p>
                          </div>
                          <div className="flex gap-2 items-center">
                            {o.readiness_score !== null && <AIScoreBadge score={o.readiness_score} label="Readiness" size="sm" />}
                            {o.funding_probability !== null && <AIScoreBadge score={o.funding_probability} label="Funding chance" size="sm" />}
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3 flex-wrap">
                          <Button size="sm" variant="outline" disabled={running === `${o.id}-ai-readiness`} onClick={() => runAI(o.id, "ai-readiness")} className="text-xs gap-1">
                            {running === `${o.id}-ai-readiness` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} Run readiness analysis
                          </Button>
                          <Button size="sm" variant="outline" disabled={running === `${o.id}-ai-funding-probability`} onClick={() => runAI(o.id, "ai-funding-probability")} className="text-xs gap-1">
                            {running === `${o.id}-ai-funding-probability` ? <Loader2 className="h-3 w-3 animate-spin" /> : <TrendingUp className="h-3 w-3" />} Funding probability
                          </Button>
                          <Button size="sm" variant="outline" asChild className="text-xs"><Link to={`/organizations/${o.id}`}>View</Link></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isInvestor && (
                <div className="rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-2 p-5 border-b border-border">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h2 className="font-display font-semibold">AI-Recommended Organizations</h2>
                  </div>
                  <div className="p-5 space-y-3">
                    {recs.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4">Set your preferences in <Link to="/settings" className="text-primary">Settings</Link> to see recommendations.</p>
                    ) : recs.map((r) => (
                      <Link key={r.id} to={`/organizations/${r.id}`} className="block p-3 rounded-lg border border-border hover:border-primary/30 transition-colors">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{r.name}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {r.sector && <Badge variant="secondary" className="text-xs">{r.sector}</Badge>}
                              {r.country && <Badge variant="outline" className="text-xs">{r.country}</Badge>}
                            </div>
                            {r.match_reasons.length > 0 && <p className="text-xs text-muted-foreground mt-1.5">{r.match_reasons.join(" · ")}</p>}
                          </div>
                          <AIScoreBadge score={r.match_score} label="Match" size="sm" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {incoming.length > 0 && (
                <div className="rounded-lg border border-border bg-card">
                  <div className="p-5 border-b border-border">
                    <h2 className="font-display font-semibold">Incoming Connection Requests</h2>
                  </div>
                  <div className="p-5 space-y-3">
                    {incoming.map((r) => (
                      <div key={r.id} className="p-3 rounded-lg border border-border">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">{r.direction === "investor_to_ngo" ? "Funder interested" : "NGO outreach"}</Badge>
                            <Badge variant={r.status === "accepted" ? "default" : r.status === "declined" ? "destructive" : "secondary"} className="text-xs capitalize">{r.status}</Badge>
                          </div>
                          {r.status === "pending" && (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => respond(r.id, "accepted")} className="gap-1 text-xs"><CheckCircle2 className="h-3.5 w-3.5" /> Accept</Button>
                              <Button size="sm" variant="outline" onClick={() => respond(r.id, "declined")} className="gap-1 text-xs"><XCircle className="h-3.5 w-3.5" /> Decline</Button>
                            </div>
                          )}
                        </div>
                        {r.message && <p className="text-xs text-muted-foreground mt-2">"{r.message}"</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="font-display font-semibold text-sm mb-3">Quick links</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" size="sm" asChild><Link to="/discover">Browse organizations</Link></Button>
                  <Button variant="outline" className="w-full justify-start" size="sm" asChild><Link to="/investors">Browse funders</Link></Button>
                  {isNgo && <Button variant="outline" className="w-full justify-start" size="sm" asChild><Link to="/create-organization">Create organization</Link></Button>}
                </div>
              </div>

              {outgoing.length > 0 && (
                <div className="rounded-lg border border-border bg-card p-5">
                  <h3 className="font-display font-semibold text-sm mb-3">My requests</h3>
                  <div className="space-y-2">
                    {outgoing.slice(0, 5).map((r) => (
                      <div key={r.id} className="flex items-center justify-between text-xs">
                        <Link to={`/organizations/${r.organization_id}`} className="text-muted-foreground hover:text-foreground truncate">Request</Link>
                        <Badge variant={r.status === "accepted" ? "default" : r.status === "declined" ? "destructive" : "secondary"} className="text-[10px] capitalize">{r.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
