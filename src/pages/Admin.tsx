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
  Shield, Users, Building2, CheckCircle, XCircle, Clock, Loader2, AlertTriangle,
  LayoutDashboard, Eye, Heart, Handshake, Trash2, ShieldCheck, Briefcase, Activity,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { stageLabel } from "@/lib/labels";

type VerificationRequest = Database["public"]["Tables"]["verification_requests"]["Row"];
type Org = Database["public"]["Tables"]["organizations"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type ConnReq = Database["public"]["Tables"]["connection_requests"]["Row"];

type Tab = "overview" | "organizations" | "verifications" | "users";

export default function Admin() {
  const { user, roles, loading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [rolesMap, setRolesMap] = useState<Record<string, string[]>>({});
  const [connReqs, setConnReqs] = useState<ConnReq[]>([]);
  const [counts, setCounts] = useState({ views: 0, likes: 0, investors: 0 });
  const [dataLoading, setDataLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [serverAdmin, setServerAdmin] = useState<boolean | null>(null);

  const isAdmin = roles.includes("admin");

  useEffect(() => {
    if (!user) { setServerAdmin(false); return; }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!cancelled) setServerAdmin(!error && data === true);
    })();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => { if (serverAdmin) loadAll(); }, [serverAdmin]);

  const loadAll = async () => {
    setDataLoading(true);
    const [orgsRes, profRes, verRes, rolesRes, connRes, viewsRes, likesRes, invRes] = await Promise.all([
      supabase.from("organizations").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("verification_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id,role"),
      supabase.from("connection_requests").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("org_profile_views").select("id", { count: "exact", head: true }),
      supabase.from("org_likes").select("id", { count: "exact", head: true }),
      supabase.from("investor_profiles").select("id", { count: "exact", head: true }),
    ]);
    setOrgs(orgsRes.data || []);
    setProfiles(profRes.data || []);
    setVerifications(verRes.data || []);
    const rm: Record<string, string[]> = {};
    (rolesRes.data || []).forEach((r) => { (rm[r.user_id] ||= []).push(r.role); });
    setRolesMap(rm);
    setConnReqs(connRes.data || []);
    setCounts({ views: viewsRes.count || 0, likes: likesRes.count || 0, investors: invRes.count || 0 });
    setDataLoading(false);
  };

  const togglePublish = async (id: string, current: boolean | null) => {
    setProcessing(id);
    const { error } = await supabase.from("organizations").update({ is_published: !current }).eq("id", id);
    if (error) toast({ title: "Error", description: safeErrorMessage(error), variant: "destructive" });
    else { toast({ title: current ? "Unpublished" : "Published" }); loadAll(); }
    setProcessing(null);
  };

  const toggleVerify = async (id: string, current: boolean | null) => {
    setProcessing(id);
    const { error } = await supabase.from("organizations").update({ is_verified: !current }).eq("id", id);
    if (error) toast({ title: "Error", description: safeErrorMessage(error), variant: "destructive" });
    else { toast({ title: current ? "Removed verification" : "Marked verified" }); loadAll(); }
    setProcessing(null);
  };

  const removeOrg = async (id: string, name: string) => {
    if (!window.confirm(`Remove "${name}" from the platform? This cannot be undone.`)) return;
    setProcessing(id);
    const { error } = await supabase.from("organizations").delete().eq("id", id);
    if (error) toast({ title: "Error", description: safeErrorMessage(error), variant: "destructive" });
    else { toast({ title: "Organization removed" }); loadAll(); }
    setProcessing(null);
  };

  if (loading || serverAdmin === null) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin || !serverAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground">You don't have admin privileges.</p>
          </div>
        </main>
      </div>
    );
  }

  const pendingVerifs = verifications.filter((v) => v.status === "pending").length;
  const pendingConns = connReqs.filter((c) => c.status === "pending").length;
  const published = orgs.filter((o) => o.is_published).length;
  const verified = orgs.filter((o) => o.is_verified).length;
  const awaitingVerification = orgs.filter((o) => o.is_published && !o.is_verified);

  const tabs: { id: Tab; label: string; icon: typeof Shield; count?: number }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "organizations", label: "Organizations", icon: Building2, count: orgs.length },
    { id: "verifications", label: "Verifications", icon: Shield, count: pendingVerifs },
    { id: "users", label: "Users", icon: Users, count: profiles.length },
  ];

  const statCards = [
    { label: "Registered users", value: profiles.length, icon: Users },
    { label: "Organizations", value: orgs.length, sub: `${published} live · ${verified} verified`, icon: Building2 },
    { label: "Funders", value: counts.investors, icon: Briefcase },
    { label: "Connection requests", value: connReqs.length, sub: `${pendingConns} pending`, icon: Handshake },
    { label: "Profile views", value: counts.views, icon: Eye },
    { label: "Likes given", value: counts.likes, icon: Heart },
  ];

  const roleBadge = (uid: string) => (rolesMap[uid] || []).map((r) => (
    <Badge key={r} variant={r === "admin" ? "default" : "secondary"} className="text-[10px] capitalize">{r === "ngo" ? "NGO" : r}</Badge>
  ));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="border-b border-border bg-muted/30">
          <div className="container py-6 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <h1 className="font-display text-2xl font-bold">Platform Administration</h1>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Monitor activity, review organizations, and manage users.</p>
            </div>
            <Button
              variant="outline" size="sm"
              disabled={processing === "seed"}
              onClick={async () => {
                setProcessing("seed");
                const { data, error } = await supabase.functions.invoke("seed-demo-accounts");
                setProcessing(null);
                if (error) toast({ title: "Seeding failed", description: safeErrorMessage(error), variant: "destructive" });
                else { toast({ title: "Demo accounts ready", description: `Processed ${data?.results?.length ?? 0} accounts.` }); loadAll(); }
              }}
            >
              {processing === "seed" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Seed demo accounts
            </Button>
          </div>
        </div>

        <div className="container py-6">
          <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {(tab.count ?? 0) > 0 && <Badge variant={activeTab === tab.id ? "default" : "secondary"} className="text-xs h-5 px-1.5">{tab.count}</Badge>}
              </button>
            ))}
          </div>

          {dataLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : activeTab === "overview" ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {statCards.map((s) => (
                  <div key={s.label} className="rounded-xl border border-border bg-card p-4">
                    <s.icon className="h-4 w-4 text-primary mb-2" />
                    <p className="font-display text-2xl font-bold leading-none">{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-1.5">{s.label}</p>
                    {s.sub && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{s.sub}</p>}
                  </div>
                ))}
              </div>

              {(awaitingVerification.length > 0 || pendingVerifs > 0) && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <h2 className="font-display font-semibold text-sm">Needs your attention</h2>
                  </div>
                  <ul className="space-y-2 text-sm">
                    {awaitingVerification.slice(0, 5).map((o) => (
                      <li key={o.id} className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground"><span className="font-medium text-foreground">{o.name}</span> is live but not yet verified</span>
                        <Button size="sm" variant="outline" className="text-xs h-7" disabled={processing === o.id} onClick={() => toggleVerify(o.id, o.is_verified)}>Verify</Button>
                      </li>
                    ))}
                    {pendingVerifs > 0 && (
                      <li className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">{pendingVerifs} verification request{pendingVerifs === 1 ? "" : "s"} awaiting review</span>
                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setActiveTab("verifications")}>Review</Button>
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <div className="grid lg:grid-cols-2 gap-4">
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-muted/40">
                    <Building2 className="h-4 w-4 text-primary" />
                    <h2 className="font-display font-semibold text-sm">Newest organizations</h2>
                  </div>
                  {orgs.slice(0, 6).map((o, i) => (
                    <div key={o.id} className={`flex items-center justify-between gap-3 px-5 py-3 ${i < Math.min(orgs.length, 6) - 1 ? "border-b border-border" : ""}`}>
                      <div className="min-w-0">
                        <Link to={`/organizations/${o.id}`} className="text-sm font-medium hover:text-primary truncate block">{o.name}</Link>
                        <p className="text-xs text-muted-foreground">{o.sector || "—"} · {new Date(o.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Badge variant={o.is_published ? "default" : "secondary"} className="text-[10px]">{o.is_published ? "Live" : "Draft"}</Badge>
                        {o.is_verified && <Badge variant="outline" className="text-[10px] gap-0.5"><ShieldCheck className="h-2.5 w-2.5" /> Verified</Badge>}
                      </div>
                    </div>
                  ))}
                  {orgs.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">No organizations yet</p>}
                </div>

                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-muted/40">
                    <Activity className="h-4 w-4 text-primary" />
                    <h2 className="font-display font-semibold text-sm">Recent connection activity</h2>
                  </div>
                  {connReqs.slice(0, 6).map((c, i) => {
                    const orgName = orgs.find((o) => o.id === c.organization_id)?.name || "an organization";
                    return (
                      <div key={c.id} className={`flex items-center justify-between gap-3 px-5 py-3 ${i < Math.min(connReqs.length, 6) - 1 ? "border-b border-border" : ""}`}>
                        <div className="min-w-0">
                          <p className="text-sm truncate">Request about <span className="font-medium">{orgName}</span></p>
                          <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</p>
                        </div>
                        <Badge variant={c.status === "accepted" ? "default" : c.status === "declined" ? "destructive" : "secondary"} className="text-[10px] capitalize shrink-0">{c.status}</Badge>
                      </div>
                    );
                  })}
                  {connReqs.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">No connection requests yet</p>}
                </div>
              </div>
            </div>
          ) : activeTab === "organizations" ? (
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-2.5 bg-muted/60 text-xs font-medium text-muted-foreground uppercase border-b border-border">
                <div className="col-span-3">Name</div>
                <div className="col-span-2">Sector</div>
                <div className="col-span-2">Stage</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-3">Actions</div>
              </div>
              {orgs.length === 0 ? <p className="text-sm text-muted-foreground py-8 text-center">No organizations yet</p> : orgs.map((o, i) => (
                <div key={o.id} className={`grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-5 py-3.5 md:items-center ${i < orgs.length - 1 ? "border-b border-border" : ""}`}>
                  <div className="md:col-span-3"><Link to={`/organizations/${o.id}`} className="text-sm font-medium hover:text-primary">{o.name}</Link></div>
                  <div className="md:col-span-2 text-sm text-muted-foreground">{o.sector || "—"}</div>
                  <div className="md:col-span-2 text-sm text-muted-foreground">{stageLabel(o.stage)}</div>
                  <div className="md:col-span-2 flex gap-1">
                    <Badge variant={o.is_published ? "default" : "secondary"} className="text-xs">{o.is_published ? "Live" : "Draft"}</Badge>
                    {o.is_verified && <Badge variant="outline" className="text-xs">Verified</Badge>}
                  </div>
                  <div className="md:col-span-3 flex gap-2 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => togglePublish(o.id, o.is_published)} disabled={processing === o.id} className="text-xs">{o.is_published ? "Unpublish" : "Publish"}</Button>
                    <Button size="sm" variant="outline" onClick={() => toggleVerify(o.id, o.is_verified)} disabled={processing === o.id} className="text-xs">{o.is_verified ? "Unverify" : "Verify"}</Button>
                    <Button size="sm" variant="outline" onClick={() => removeOrg(o.id, o.name)} disabled={processing === o.id} className="text-xs text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          ) : activeTab === "verifications" ? (
            <div className="space-y-3">
              {verifications.length === 0 ? <p className="text-sm text-muted-foreground py-8 text-center">No verification requests</p> : verifications.map((v) => (
                <div key={v.id} className="rounded-lg border border-border bg-card p-5">
                  <div className="flex items-center gap-2 mb-1">
                    {v.status === "approved" ? <CheckCircle className="h-4 w-4 text-primary" /> : v.status === "rejected" ? <XCircle className="h-4 w-4 text-destructive" /> : <Clock className="h-4 w-4 text-amber-500" />}
                    <Badge variant="outline" className="text-xs capitalize">{v.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">User: {profiles.find((p) => p.user_id === v.user_id)?.full_name || v.user_id}</p>
                  {v.admin_notes && <p className="text-xs italic mt-2">Notes: {v.admin_notes}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              {profiles.length === 0 ? <p className="text-sm text-muted-foreground py-8 text-center">No users</p> : profiles.map((p, i) => (
                <div key={p.id} className={`flex items-center gap-3 px-5 py-3.5 ${i < profiles.length - 1 ? "border-b border-border" : ""}`}>
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {p.avatar_url ? <img src={p.avatar_url} alt={p.full_name || "User"} loading="lazy" className="h-full w-full object-cover" /> : <span className="text-xs font-medium">{p.full_name?.[0] ?? "?"}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.full_name || "Unnamed"}</p>
                    <p className="text-xs text-muted-foreground">Joined {new Date(p.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-1">{roleBadge(p.user_id)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
