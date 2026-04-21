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
  Eye, Users, TrendingUp, Rocket, Sparkles, ArrowRight, RefreshCw,
  Plus, Settings, GraduationCap, FileText,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Startup = Database["public"]["Tables"]["startups"]["Row"];

interface MatchResult {
  investors?: { name: string; reason: string; match_score: number }[];
  mentors?: { name: string; reason: string; match_score: number }[];
  startups?: { name: string; reason: string; match_score: number }[];
  message?: string;
  error?: string;
}

export default function Dashboard() {
  const { user, profile, roles, loading } = useAuth();
  const [matches, setMatches] = useState<MatchResult | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [myStartups, setMyStartups] = useState<Startup[]>([]);
  const { toast } = useToast();

  const primaryRole = roles[0] || "founder";

  const canMatch = primaryRole === "founder" || primaryRole === "investor";

  const fetchMatches = async () => {
    if (!user || !canMatch) return;
    setMatchLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-match", {
        body: { role: primaryRole },
      });
      if (error) throw error;
      setMatches(data);
    } catch (e: any) {
      console.error("Match error:", e);
    } finally {
      setMatchLoading(false);
    }
  };

  const fetchStartups = async () => {
    if (!user) return;
    const { data } = await supabase.from("startups").select("*").eq("founder_id", user.id);
    setMyStartups(data || []);
  };

  useEffect(() => {
    if (user && !loading) {
      fetchMatches();
      fetchStartups();
    }
  }, [user, loading]);

  const publishStartup = async (id: string) => {
    const { error } = await supabase.from("startups").update({ is_published: true }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: safeErrorMessage(error), variant: "destructive" });
    } else {
      toast({ title: "Startup published!" });
      fetchStartups();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

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
                <Badge variant="secondary" className="capitalize text-xs">{primaryRole}</Badge>
                <span className="text-xs text-muted-foreground">{user.email}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/settings" className="gap-2">
                  <Settings className="h-4 w-4" /> Settings
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="container py-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { icon: Rocket, label: "My Startups", value: String(myStartups.length) },
              { icon: Eye, label: "Published", value: String(myStartups.filter((s) => s.is_published).length) },
              { icon: Users, label: "Role", value: primaryRole.charAt(0).toUpperCase() + primaryRole.slice(1) },
              { icon: TrendingUp, label: "Matches", value: String((matches?.investors?.length || 0) + (matches?.mentors?.length || 0) + (matches?.startups?.length || 0)) },
            ].map((stat) => (
              <div key={stat.label} className="p-4 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
                <p className="font-display text-xl font-bold text-foreground">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* My Startups */}
              {primaryRole === "founder" && (
                <div className="rounded-lg border border-border bg-card">
                  <div className="flex items-center justify-between p-5 border-b border-border">
                    <h2 className="font-display font-semibold text-foreground">My Startups</h2>
                    <Button size="sm" asChild className="gap-1">
                      <Link to="/create-startup">
                        <Plus className="h-3.5 w-3.5" /> Add Startup
                      </Link>
                    </Button>
                  </div>
                  <div className="p-5">
                    {myStartups.length === 0 ? (
                      <div className="text-center py-6">
                        <Rocket className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-3">No startups yet</p>
                        <Button size="sm" asChild>
                          <Link to="/create-startup">Create your first startup</Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {myStartups.map((s) => (
                          <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-foreground">{s.name}</p>
                                <Badge variant={s.is_published ? "default" : "secondary"} className="text-xs">
                                  {s.is_published ? "Published" : "Draft"}
                                </Badge>
                                {s.is_university_project && (
                                  <Badge variant="outline" className="text-xs gap-1 border-primary/30 text-primary">
                                    <GraduationCap className="h-3 w-3" />
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">{s.industry} · {s.funding_stage?.replace("_", " ") || "No stage"}</p>
                            </div>
                            <div className="flex gap-2 ml-3">
                              {s.pitch_deck_url && (
                                <Badge variant="outline" className="text-xs gap-1">
                                  <FileText className="h-3 w-3" /> Deck
                                </Badge>
                              )}
                              {!s.is_published && (
                                <Button size="sm" variant="outline" onClick={() => publishStartup(s.id)} className="text-xs">
                                  Publish
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* AI Matches */}
              <div className="rounded-lg border border-border bg-card">
                <div className="flex items-center justify-between p-5 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-accent" />
                    <h2 className="font-display font-semibold text-foreground">AI Recommendations</h2>
                  </div>
                  <Button variant="ghost" size="sm" onClick={fetchMatches} disabled={matchLoading} className="gap-1 text-xs">
                    <RefreshCw className={`h-3.5 w-3.5 ${matchLoading ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                </div>

                <div className="p-5">
                  {matchLoading && !matches ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="ml-3 text-sm text-muted-foreground">Finding matches...</span>
                    </div>
                  ) : matches?.message ? (
                    <p className="text-sm text-muted-foreground py-4">{matches.message}</p>
                  ) : (
                    <div className="space-y-6">
                      {matches?.investors && matches.investors.length > 0 && (
                        <div>
                          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Recommended Investors</h3>
                          <div className="space-y-3">
                            {matches.investors.map((inv, i) => (
                              <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-xs font-semibold shrink-0">
                                  {inv.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground">{inv.name}</p>
                                  <p className="text-xs text-muted-foreground line-clamp-1">{inv.reason}</p>
                                </div>
                                <Badge variant="outline" className="text-xs shrink-0">{inv.match_score}%</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {matches?.mentors && matches.mentors.length > 0 && (
                        <div>
                          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Recommended Mentors</h3>
                          <div className="space-y-3">
                            {matches.mentors.map((m, i) => (
                              <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold shrink-0">
                                  {m.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground">{m.name}</p>
                                  <p className="text-xs text-muted-foreground line-clamp-1">{m.reason}</p>
                                </div>
                                <Badge variant="outline" className="text-xs shrink-0">{m.match_score}%</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {matches?.startups && matches.startups.length > 0 && (
                        <div>
                          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Recommended Startups</h3>
                          <div className="space-y-3">
                            {matches.startups.map((s, i) => (
                              <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                <div className="h-9 w-9 rounded-full bg-accent/10 flex items-center justify-center text-accent text-xs font-semibold shrink-0">
                                  <Rocket className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground">{s.name}</p>
                                  <p className="text-xs text-muted-foreground line-clamp-1">{s.reason}</p>
                                </div>
                                <Badge variant="outline" className="text-xs shrink-0">{s.match_score}%</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {(!matches?.investors?.length && !matches?.mentors?.length && !matches?.startups?.length) && (
                        <div className="text-center py-6">
                          <p className="text-sm text-muted-foreground mb-2">No matches yet</p>
                          <p className="text-xs text-muted-foreground">Complete your profile and add your startup to get AI-powered recommendations.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick actions sidebar */}
            <div className="space-y-6">
              <div className="rounded-lg border border-border bg-card p-5">
                <h2 className="font-display font-semibold text-foreground mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  {primaryRole === "founder" && (
                    <>
                      <Link to="/create-startup" className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors">
                        <Plus className="h-5 w-5 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">Add Startup</p>
                          <p className="text-xs text-muted-foreground">Create a new venture listing</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </Link>
                      <Link to="/discover" className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors">
                        <Users className="h-5 w-5 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">Browse Investors</p>
                          <p className="text-xs text-muted-foreground">Find funding partners</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </Link>
                    </>
                  )}
                  <Link to="/settings" className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors">
                    <Settings className="h-5 w-5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">Edit Profile</p>
                      <p className="text-xs text-muted-foreground">Update your information</p>
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
                </div>
              </div>

              {/* Profile completion */}
              <div className="rounded-lg border border-border bg-card p-5">
                <h2 className="font-display font-semibold text-foreground mb-3">Profile Completion</h2>
                {(() => {
                  const fields = [profile?.full_name, profile?.bio, profile?.country, profile?.city, profile?.website];
                  const filled = fields.filter(Boolean).length;
                  const pct = Math.round((filled / fields.length) * 100);
                  return (
                    <>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium text-foreground">{pct}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      {pct < 100 && (
                        <Button variant="link" size="sm" asChild className="mt-2 p-0 h-auto text-xs">
                          <Link to="/settings">Complete your profile →</Link>
                        </Button>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
