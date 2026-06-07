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
  Shield, Users, Building2, CheckCircle, XCircle,
  Clock, Loader2, AlertTriangle, FileText,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { stageLabel } from "@/lib/labels";

type VerificationRequest = Database["public"]["Tables"]["verification_requests"]["Row"];
type Org = Database["public"]["Tables"]["organizations"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default function Admin() {
  const { user, roles, loading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"verifications" | "organizations" | "users">("organizations");
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
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

  useEffect(() => { if (serverAdmin) loadData(); }, [serverAdmin, activeTab]);

  const loadData = async () => {
    setDataLoading(true);
    if (activeTab === "verifications") {
      const { data } = await supabase.from("verification_requests").select("*").order("created_at", { ascending: false });
      setVerifications(data || []);
    } else if (activeTab === "organizations") {
      const { data } = await supabase.from("organizations").select("*").order("created_at", { ascending: false });
      setOrgs(data || []);
    } else {
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      setProfiles(data || []);
    }
    setDataLoading(false);
  };

  const togglePublish = async (id: string, current: boolean | null) => {
    setProcessing(id);
    const { error } = await supabase.from("organizations").update({ is_published: !current }).eq("id", id);
    if (error) toast({ title: "Error", description: safeErrorMessage(error), variant: "destructive" });
    else { toast({ title: current ? "Unpublished" : "Published" }); loadData(); }
    setProcessing(null);
  };

  const toggleVerify = async (id: string, current: boolean | null) => {
    setProcessing(id);
    const { error } = await supabase.from("organizations").update({ is_verified: !current }).eq("id", id);
    if (error) toast({ title: "Error", description: safeErrorMessage(error), variant: "destructive" });
    else { toast({ title: current ? "Removed verification" : "Marked verified" }); loadData(); }
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

  const tabs = [
    { id: "organizations" as const, label: "Organizations", icon: Building2, count: orgs.length },
    { id: "verifications" as const, label: "Verifications", icon: Shield, count: verifications.filter((v) => v.status === "pending").length },
    { id: "users" as const, label: "Users", icon: Users, count: profiles.length },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="border-b border-border bg-muted/30">
          <div className="container py-6 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h1 className="font-display text-2xl font-bold">Admin Dashboard</h1>
            </div>
            <Button
              variant="outline" size="sm"
              disabled={processing === "seed"}
              onClick={async () => {
                setProcessing("seed");
                const { data, error } = await supabase.functions.invoke("seed-demo-accounts");
                setProcessing(null);
                if (error) toast({ title: "Seeding failed", description: safeErrorMessage(error), variant: "destructive" });
                else toast({ title: "Demo accounts ready", description: `Processed ${data?.results?.length ?? 0} accounts.` });
              }}
            >
              {processing === "seed" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Seed demo accounts
            </Button>
          </div>
        </div>

        <div className="container py-6">
          <div className="flex gap-2 mb-6 border-b border-border">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {tab.count > 0 && <Badge variant={activeTab === tab.id ? "default" : "secondary"} className="text-xs h-5 px-1.5">{tab.count}</Badge>}
              </button>
            ))}
          </div>

          {dataLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : activeTab === "organizations" ? (
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="grid grid-cols-12 gap-4 px-5 py-2.5 bg-muted/60 text-xs font-medium text-muted-foreground uppercase border-b border-border">
                <div className="col-span-3">Name</div>
                <div className="col-span-2">Sector</div>
                <div className="col-span-2">Stage</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-3">Actions</div>
              </div>
              {orgs.length === 0 ? <p className="text-sm text-muted-foreground py-8 text-center">No organizations yet</p> : orgs.map((o, i) => (
                <div key={o.id} className={`grid grid-cols-12 gap-4 px-5 py-3.5 items-center ${i < orgs.length - 1 ? "border-b border-border" : ""}`}>
                  <div className="col-span-3"><p className="text-sm font-medium">{o.name}</p></div>
                  <div className="col-span-2 text-sm text-muted-foreground">{o.sector || "—"}</div>
                  <div className="col-span-2 text-sm text-muted-foreground">{stageLabel(o.stage)}</div>
                  <div className="col-span-2 flex gap-1">
                    <Badge variant={o.is_published ? "default" : "secondary"} className="text-xs">{o.is_published ? "Live" : "Draft"}</Badge>
                    {o.is_verified && <Badge variant="outline" className="text-xs">Verified</Badge>}
                  </div>
                  <div className="col-span-3 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => togglePublish(o.id, o.is_published)} disabled={processing === o.id} className="text-xs">{o.is_published ? "Unpublish" : "Publish"}</Button>
                    <Button size="sm" variant="outline" onClick={() => toggleVerify(o.id, o.is_verified)} disabled={processing === o.id} className="text-xs">{o.is_verified ? "Unverify" : "Verify"}</Button>
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
                  <p className="text-xs text-muted-foreground">User: {v.user_id}</p>
                  {v.admin_notes && <p className="text-xs italic mt-2">Notes: {v.admin_notes}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              {profiles.length === 0 ? <p className="text-sm text-muted-foreground py-8 text-center">No users</p> : profiles.map((p, i) => (
                <div key={p.id} className={`flex items-center gap-3 px-5 py-3.5 ${i < profiles.length - 1 ? "border-b border-border" : ""}`}>
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {p.avatar_url ? <img src={p.avatar_url} alt="" className="h-full w-full object-cover" /> : <span className="text-xs">{p.full_name?.[0] ?? "?"}</span>}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{p.full_name || "Unnamed"}</p>
                    <p className="text-xs text-muted-foreground">{p.user_id.slice(0, 8)}…</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</p>
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
