import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { safeErrorMessage } from "@/lib/errors";
import {
  Shield, Users, Rocket, GraduationCap, CheckCircle, XCircle,
  Clock, Eye, Loader2, AlertTriangle, FileText, Calendar,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";
import { fundingStageLabel } from "@/lib/labels";

type VerificationRequest = Database["public"]["Tables"]["verification_requests"]["Row"];
type Startup = Database["public"]["Tables"]["startups"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default function Admin() {
  const { user, roles, loading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"verifications" | "startups" | "users">("verifications");
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [startups, setStartups] = useState<Startup[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);
  const [serverAdmin, setServerAdmin] = useState<boolean | null>(null);

  const isAdmin = roles.includes("admin");

  // Server-verified admin check — prevents bypass via client state manipulation.
  useEffect(() => {
    if (!user) { setServerAdmin(false); return; }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      if (!cancelled) setServerAdmin(!error && data === true);
    })();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (serverAdmin) loadData();
  }, [serverAdmin, activeTab]);

  const loadData = async () => {
    setDataLoading(true);
    if (activeTab === "verifications") {
      const { data } = await supabase.from("verification_requests").select("*").order("created_at", { ascending: false });
      setVerifications(data || []);
    } else if (activeTab === "startups") {
      const { data } = await supabase.from("startups").select("*").order("created_at", { ascending: false });
      setStartups(data || []);
    } else {
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      setProfiles(data || []);
    }
    setDataLoading(false);
  };

  const handleVerification = async (id: string, status: "approved" | "rejected") => {
    setProcessing(id);
    const { error } = await supabase
      .from("verification_requests")
      .update({
        status,
        reviewed_by: user!.id,
        admin_notes: adminNotes[id] || null,
      })
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: safeErrorMessage(error), variant: "destructive" });
    } else {
      toast({ title: `Verification ${status}` });
      loadData();
    }
    setProcessing(null);
  };

  const toggleStartupPublish = async (id: string, currentStatus: boolean | null) => {
    setProcessing(id);
    const { error } = await supabase.from("startups").update({ is_published: !currentStatus }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: safeErrorMessage(error), variant: "destructive" });
    } else {
      toast({ title: currentStatus ? "Startup unpublished" : "Startup published" });
      loadData();
    }
    setProcessing(null);
  };

  if (loading || serverAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin || !serverAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">Access Denied</h1>
            <p className="text-muted-foreground">You don't have admin privileges.</p>
          </div>
        </main>
      </div>
    );
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle className="h-4 w-4 text-primary" />;
      case "rejected": return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <Clock className="h-4 w-4 text-accent" />;
    }
  };

  const tabs = [
    { id: "verifications" as const, label: "Verifications", icon: GraduationCap, count: verifications.filter((v) => v.status === "pending").length },
    { id: "startups" as const, label: "Startups", icon: Rocket, count: startups.length },
    { id: "users" as const, label: "Users", icon: Users, count: profiles.length },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="border-b border-border bg-muted/30">
          <div className="container py-6 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-5 w-5 text-primary" />
                <h1 className="font-display text-2xl font-bold text-foreground">Admin Dashboard</h1>
              </div>
              <p className="text-sm text-muted-foreground">Manage verifications, startups, and users</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin/events" className="gap-2"><Calendar className="h-4 w-4" /> Manage Events</Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={processing === "seed"}
                onClick={async () => {
                  setProcessing("seed");
                  const { data, error } = await supabase.functions.invoke("seed-demo-accounts");
                  setProcessing(null);
                  if (error) {
                    toast({ title: "Seeding failed", description: safeErrorMessage(error), variant: "destructive" });
                  } else {
                    toast({ title: "Demo accounts ready", description: `Processed ${data?.results?.length ?? 0} accounts.` });
                  }
                }}
              >
                {processing === "seed" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Seed demo accounts
              </Button>
            </div>
          </div>
        </div>

        <div className="container py-6">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {tab.count > 0 && (
                  <Badge variant={activeTab === tab.id ? "default" : "secondary"} className="text-xs h-5 px-1.5">
                    {tab.count}
                  </Badge>
                )}
              </button>
            ))}
          </div>

          {dataLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Verifications */}
              {activeTab === "verifications" && (
                <div className="space-y-4">
                  {verifications.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">No verification requests</p>
                  ) : (
                    verifications.map((v) => (
                      <div key={v.id} className="rounded-lg border border-border bg-card p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {statusIcon(v.status)}
                              <Badge variant="outline" className="capitalize text-xs">{v.status}</Badge>
                              <Badge variant="secondary" className="capitalize text-xs">{v.founder_type}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">User: {v.user_id}</p>
                            {v.university_name && <p className="text-xs text-muted-foreground">University: {v.university_name}</p>}
                            <p className="text-xs text-muted-foreground">Submitted: {new Date(v.created_at).toLocaleDateString()}</p>
                          </div>
                          {v.student_id_url && (
                            <Button variant="outline" size="sm" className="gap-1 text-xs" asChild>
                              <a href={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/authenticated/verification-docs/${v.student_id_url}`} target="_blank" rel="noopener">
                                <FileText className="h-3.5 w-3.5" /> View ID
                              </a>
                            </Button>
                          )}
                        </div>
                        {v.status === "pending" && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <Textarea
                              placeholder="Admin notes (optional)..."
                              value={adminNotes[v.id] || ""}
                              onChange={(e) => setAdminNotes({ ...adminNotes, [v.id]: e.target.value })}
                              rows={2}
                              className="mb-3"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleVerification(v.id, "approved")} disabled={processing === v.id} className="gap-1">
                                <CheckCircle className="h-3.5 w-3.5" /> Approve
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleVerification(v.id, "rejected")} disabled={processing === v.id} className="gap-1">
                                <XCircle className="h-3.5 w-3.5" /> Reject
                              </Button>
                            </div>
                          </div>
                        )}
                        {v.admin_notes && (
                          <p className="text-xs text-muted-foreground mt-2 italic">Notes: {v.admin_notes}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Startups */}
              {activeTab === "startups" && (
                <div className="rounded-lg border border-border bg-card overflow-hidden">
                  <div className="grid grid-cols-12 gap-4 px-5 py-2.5 bg-muted/60 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border">
                    <div className="col-span-3">Name</div>
                    <div className="col-span-2">Industry</div>
                    <div className="col-span-2">Stage</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-3">Actions</div>
                  </div>
                  {startups.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">No startups yet</p>
                  ) : (
                    startups.map((s, i) => (
                      <div key={s.id} className={`grid grid-cols-12 gap-4 px-5 py-3.5 items-center ${i < startups.length - 1 ? "border-b border-border" : ""}`}>
                        <div className="col-span-3">
                          <p className="text-sm font-medium text-foreground">{s.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{s.description}</p>
                        </div>
                        <div className="col-span-2 text-sm text-muted-foreground">{s.industry || "—"}</div>
                        <div className="col-span-2 text-sm text-muted-foreground">{fundingStageLabel(s.funding_stage)}</div>
                        <div className="col-span-2">
                          <Badge variant={s.is_published ? "default" : "secondary"} className="text-xs">
                            {s.is_published ? "Published" : "Draft"}
                          </Badge>
                        </div>
                        <div className="col-span-3 flex gap-2">
                          <Button
                            size="sm"
                            variant={s.is_published ? "outline" : "default"}
                            onClick={() => toggleStartupPublish(s.id, s.is_published)}
                            disabled={processing === s.id}
                            className="text-xs"
                          >
                            {s.is_published ? "Unpublish" : "Publish"}
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Users */}
              {activeTab === "users" && (
                <div className="rounded-lg border border-border bg-card overflow-hidden">
                  <div className="grid grid-cols-12 gap-4 px-5 py-2.5 bg-muted/60 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border">
                    <div className="col-span-4">Name</div>
                    <div className="col-span-3">Location</div>
                    <div className="col-span-3">Joined</div>
                    <div className="col-span-2">Status</div>
                  </div>
                  {profiles.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">No users yet</p>
                  ) : (
                    profiles.map((p, i) => (
                      <div key={p.id} className={`grid grid-cols-12 gap-4 px-5 py-3.5 items-center ${i < profiles.length - 1 ? "border-b border-border" : ""}`}>
                        <div className="col-span-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                              {p.avatar_url ? (
                                <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-xs font-medium text-muted-foreground">
                                  {p.full_name?.split(" ").map((w) => w[0]).join("").slice(0, 2) || "?"}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{p.full_name || "Unnamed"}</p>
                              <p className="text-xs text-muted-foreground">{p.user_id.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </div>
                        <div className="col-span-3 text-sm text-muted-foreground">{[p.city, p.country].filter(Boolean).join(", ") || "—"}</div>
                        <div className="col-span-3 text-sm text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</div>
                        <div className="col-span-2">
                          <Badge variant="outline" className="text-xs">Active</Badge>
                        </div>
                      </div>
                    ))
                  )}
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
