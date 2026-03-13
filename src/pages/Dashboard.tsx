import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Eye, Users, MessageSquare, TrendingUp, Rocket, LogOut,
  Sparkles, GraduationCap, ArrowRight, RefreshCw,
} from "lucide-react";

interface MatchResult {
  investors?: { name: string; reason: string; match_score: number }[];
  mentors?: { name: string; reason: string; match_score: number }[];
  startups?: { name: string; reason: string; match_score: number }[];
  message?: string;
  error?: string;
}

export default function Dashboard() {
  const { user, profile, roles, loading, signOut } = useAuth();
  const [matches, setMatches] = useState<MatchResult | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const { toast } = useToast();

  const primaryRole = roles[0] || "founder";

  const fetchMatches = async () => {
    if (!user) return;
    setMatchLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-match", {
        body: { user_id: user.id, role: primaryRole },
      });
      if (error) throw error;
      setMatches(data);
    } catch (e: any) {
      console.error("Match error:", e);
      if (e?.status === 429) {
        toast({ title: "Rate limited", description: "Please try again in a moment.", variant: "destructive" });
      } else if (e?.status === 402) {
        toast({ title: "AI credits exhausted", description: "Please try again later.", variant: "destructive" });
      }
    } finally {
      setMatchLoading(false);
    }
  };

  useEffect(() => {
    if (user && !loading) {
      fetchMatches();
    }
  }, [user, loading]);

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
            <Button variant="outline" size="sm" onClick={signOut} className="gap-2">
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>

        <div className="container py-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { icon: Eye, label: "Profile Views", value: "0" },
              { icon: Users, label: "Connections", value: "0" },
              { icon: MessageSquare, label: "Messages", value: "0" },
              { icon: TrendingUp, label: "Engagement", value: "0%" },
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
            {/* AI Matches */}
            <div className="lg:col-span-2">
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
                  ) : matches?.error ? (
                    <p className="text-sm text-muted-foreground py-4">{matches.error}</p>
                  ) : matches?.message ? (
                    <p className="text-sm text-muted-foreground py-4">{matches.message}</p>
                  ) : (
                    <div className="space-y-6">
                      {/* Investor matches */}
                      {matches?.investors && matches.investors.length > 0 && (
                        <div>
                          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Recommended Investors</h3>
                          <div className="space-y-3">
                            {matches.investors.map((inv, i) => (
                              <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-xs font-semibold shrink-0">
                                  {inv.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
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

                      {/* Mentor matches */}
                      {matches?.mentors && matches.mentors.length > 0 && (
                        <div>
                          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Recommended Mentors</h3>
                          <div className="space-y-3">
                            {matches.mentors.map((m, i) => (
                              <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold shrink-0">
                                  {m.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
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

                      {/* Startup matches (for investors) */}
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
            <div>
              <div className="rounded-lg border border-border bg-card p-5">
                <h2 className="font-display font-semibold text-foreground mb-4">Quick actions</h2>
                <div className="space-y-3">
                  {primaryRole === "founder" && (
                    <>
                      <ActionItem icon={Rocket} title="Create your startup" desc="Add your startup to get discovered" />
                      <ActionItem icon={TrendingUp} title="Upload pitch deck" desc="Get AI-powered feedback" />
                      <ActionItem icon={Users} title="Browse investors" desc="Find potential funding partners" to="/discover" />
                    </>
                  )}
                  {primaryRole === "investor" && (
                    <>
                      <ActionItem icon={Eye} title="Browse ventures" desc="Discover startups" to="/discover" />
                      <ActionItem icon={TrendingUp} title="Set preferences" desc="Configure investment focus" />
                      <ActionItem icon={Users} title="Complete profile" desc="Help founders find you" />
                    </>
                  )}
                  {(primaryRole === "mentor" || primaryRole === "university" || primaryRole === "admin") && (
                    <>
                      <ActionItem icon={Users} title="Complete profile" desc="Share your expertise" />
                      <ActionItem icon={Eye} title="Explore ventures" desc="Discover startups" to="/discover" />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ActionItem({ icon: Icon, title, desc, to }: { icon: any; title: string; desc: string; to?: string }) {
  const content = (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors cursor-pointer">
      <Icon className="h-5 w-5 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}
