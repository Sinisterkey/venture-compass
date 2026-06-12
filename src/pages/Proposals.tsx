import { useEffect, useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { GRANT_TEMPLATES, getTemplate } from "@/lib/grantTemplates";
import { Plus, FileText, Calendar, Loader2 } from "lucide-react";

export default function Proposals() {
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [tplKey, setTplKey] = useState("usaid");
  const [title, setTitle] = useState("");
  const [orgId, setOrgId] = useState("");
  const [deadline, setDeadline] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { data: o }] = await Promise.all([
        supabase.from("proposals").select("*").order("updated_at", { ascending: false }),
        supabase.from("organizations").select("id,name").eq("owner_id", user.id),
      ]);
      setItems(p || []);
      setOrgs(o || []);
      if (o && o.length > 0) setOrgId(o[0].id);
    })();
  }, [user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes("ngo")) return <Navigate to="/dashboard" replace />;

  const create = async () => {
    if (!orgId || !title) return;
    setCreating(true);
    const tpl = getTemplate(tplKey)!;
    const sections: Record<string, string> = {};
    tpl.sections.forEach((s) => (sections[s.key] = ""));
    const { data, error } = await supabase.from("proposals").insert({
      organization_id: orgId, owner_id: user.id, template_key: tplKey, funder_name: tpl.funder,
      title, sections, deadline: deadline || null, status: "draft",
    }).select().single();
    setCreating(false);
    if (error) { toast({ title: "Could not create", description: error.message, variant: "destructive" }); return; }
    setOpen(false);
    navigate(`/proposals/${data.id}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="border-b border-border">
          <div className="container py-8 flex items-end justify-between flex-wrap gap-3">
            <div>
              <h1 className="font-display text-3xl font-bold">Proposals & Grant Writer</h1>
              <p className="text-sm text-muted-foreground mt-1">AI-assisted templates from USAID, GIZ, Gates and EU.</p>
            </div>
            <Button onClick={() => setOpen(true)} disabled={orgs.length === 0} className="gap-2"><Plus className="h-4 w-4" /> New proposal</Button>
          </div>
        </div>
        <div className="container py-8">
          {orgs.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-10 text-center">
              <p className="text-sm text-muted-foreground mb-3">You need an organization profile first.</p>
              <Link to="/create-organization" className="text-primary text-sm font-medium hover:underline">Create your organization →</Link>
            </div>
          )}

          {items.length === 0 && orgs.length > 0 && (
            <div className="rounded-xl border border-dashed border-border p-10 text-center">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium">No proposals yet</p>
              <p className="text-xs text-muted-foreground mt-1">Pick a funder template to start.</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4 mb-10">
            {items.map((p) => {
              const tpl = getTemplate(p.template_key);
              return (
                <Link key={p.id} to={`/proposals/${p.id}`} className="rounded-xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-display font-semibold">{p.title}</p>
                    <Badge variant={p.status === "draft" ? "secondary" : "default"} className="capitalize text-[10px]">{p.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{tpl?.funder ?? p.funder_name}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                    <span>{p.total_words ?? 0} words</span>
                    {p.deadline && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(p.deadline).toLocaleDateString()}</span>}
                  </div>
                </Link>
              );
            })}
          </div>

          <h2 className="font-display text-xl font-semibold mb-4">Available templates</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {GRANT_TEMPLATES.map((t) => (
              <div key={t.key} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-primary font-semibold uppercase">{t.funder}</p>
                    <p className="font-display font-semibold mt-1">{t.name}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{t.averageGrant}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{t.description}</p>
                <p className="text-xs text-muted-foreground mt-3">{t.sections.length} sections · ~{t.sections.reduce((s, x) => s + x.wordLimit, 0)} words</p>
                <Button variant="outline" size="sm" className="mt-3" disabled={orgs.length === 0} onClick={() => { setTplKey(t.key); setTitle(t.name); setOpen(true); }}>Use this template</Button>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New proposal</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Organization</Label>
              <Select value={orgId} onValueChange={setOrgId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{orgs.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Funder template</Label>
              <Select value={tplKey} onValueChange={setTplKey}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{GRANT_TEMPLATES.map((t) => <SelectItem key={t.key} value={t.key}>{t.funder} — {t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Proposal title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Improving maternal health in Copperbelt" /></div>
            <div><Label>Deadline (optional)</Label><Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create} disabled={creating || !title || !orgId}>{creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
