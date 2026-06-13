import { useEffect, useMemo, useState } from "react";
import { useParams, Link, Navigate, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getTemplate, countWords } from "@/lib/grantTemplates";
import { exportProposalPDF, exportProposalDOCX } from "@/lib/exportProposal";
import { Loader2, Sparkles, Save, FileDown, ArrowLeft, Trash2, Wand2, Globe } from "lucide-react";

export default function ProposalEditor() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [p, setP] = useState<any>(null);
  const [org, setOrg] = useState<any>(null);
  const [sections, setSections] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [refineOpen, setRefineOpen] = useState<string | null>(null);
  const [refineInstr, setRefineInstr] = useState("");
  const [refining, setRefining] = useState(false);

  useEffect(() => {
    if (!id || !user) return;
    (async () => {
      const { data } = await supabase.from("proposals").select("*").eq("id", id).maybeSingle();
      if (!data) return;
      setP(data);
      setSections((data.sections as Record<string, string>) || {});
      const { data: o } = await supabase.from("organizations").select("*").eq("id", data.organization_id).maybeSingle();
      setOrg(o);
    })();
  }, [id, user]);

  const template = useMemo(() => (p ? getTemplate(p.template_key) : null), [p]);
  const totalWords = useMemo(() => Object.values(sections).reduce((s, v) => s + countWords(v || ""), 0), [sections]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!p || !template) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("proposals").update({ sections, total_words: totalWords }).eq("id", p.id);
    setSaving(false);
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    else toast({ title: "Saved" });
  };

  const aiFill = async (sectionKey: string) => {
    const s = template.sections.find((x) => x.key === sectionKey)!;
    setBusy(sectionKey);
    const { data, error } = await supabase.functions.invoke("ai-grant-writer", {
      body: { org, template: { funder: template.funder }, section: { title: s.title, guidance: s.guidance }, wordLimit: s.wordLimit, existing: sections[sectionKey] || "" },
    });
    setBusy(null);
    if (error) { toast({ title: "AI error", description: error.message, variant: "destructive" }); return; }
    setSections((prev) => ({ ...prev, [sectionKey]: data?.text ?? "" }));
    toast({ title: `Drafted "${s.title}"` });
  };

  const fillAll = async () => {
    for (const s of template.sections) {
      if ((sections[s.key] || "").trim()) continue;
      await aiFill(s.key);
    }
  };

  const refine = async () => {
    if (!refineOpen) return;
    const s = template.sections.find((x) => x.key === refineOpen)!;
    setRefining(true);
    const { data, error } = await supabase.functions.invoke("ai-grant-writer", {
      body: { org, template: { funder: template.funder }, section: { title: s.title, guidance: s.guidance }, wordLimit: s.wordLimit, existing: sections[refineOpen] || "", mode: "refine", instruction: refineInstr },
    });
    setRefining(false);
    if (error) { toast({ title: "AI error", description: error.message, variant: "destructive" }); return; }
    setSections((prev) => ({ ...prev, [refineOpen]: data?.text ?? prev[refineOpen] }));
    setRefineOpen(null);
    setRefineInstr("");
    toast({ title: "Refined" });
  };

  const togglePublish = async (v: boolean) => {
    await save();
    const { error } = await supabase.from("proposals").update({ is_published: v, published_at: v ? new Date().toISOString() : null, status: v ? "published" : "draft" }).eq("id", p.id);
    if (error) { toast({ title: "Could not publish", description: error.message, variant: "destructive" }); return; }
    setP({ ...p, is_published: v, published_at: v ? new Date().toISOString() : null });
    toast({ title: v ? "Published to organization" : "Unpublished" });
  };

  const remove = async () => {
    if (!confirm("Delete this proposal?")) return;
    await supabase.from("proposals").delete().eq("id", p.id);
    navigate("/proposals");
  };

  const proposalForExport = { title: p.title, funder_name: p.funder_name, sections, organization: { name: org?.name } };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="border-b border-border">
          <div className="container py-6">
            <Link to="/proposals" className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-3"><ArrowLeft className="h-3 w-3" /> Back to proposals</Link>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-primary font-semibold uppercase">{template.funder}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-display text-2xl font-bold truncate">{p.title}</h1>
                  {p.is_published && <Badge className="gap-1"><Globe className="h-3 w-3" /> Published</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{template.name} · {org?.name}</p>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <div className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="pub" className="text-xs cursor-pointer">Publish to organization</Label>
                  <Switch id="pub" checked={!!p.is_published} onCheckedChange={togglePublish} />
                </div>
                <Button variant="outline" size="sm" onClick={fillAll} className="gap-2"><Sparkles className="h-4 w-4" /> AI fill empty</Button>
                <Button variant="outline" size="sm" onClick={() => exportProposalPDF(proposalForExport, template)} className="gap-2"><FileDown className="h-4 w-4" /> PDF</Button>
                <Button variant="outline" size="sm" onClick={() => exportProposalDOCX(proposalForExport, template)} className="gap-2"><FileDown className="h-4 w-4" /> DOCX</Button>
                <Button size="sm" onClick={save} disabled={saving} className="gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save</Button>
                <Button variant="ghost" size="icon" onClick={remove}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
              <span>{totalWords} / {template.sections.reduce((s, x) => s + x.wordLimit, 0)} words</span>
              {p.deadline && <span>Deadline: {new Date(p.deadline).toLocaleDateString()}</span>}
              <Input type="date" defaultValue={p.deadline ?? ""} onChange={async (e) => { await supabase.from("proposals").update({ deadline: e.target.value || null }).eq("id", p.id); }} className="w-auto h-7 text-xs" />
            </div>
          </div>
        </div>

        <div className="container py-8 space-y-6 max-w-4xl">
          {template.sections.map((s) => {
            const value = sections[s.key] || "";
            const wc = countWords(value);
            const pct = Math.min(100, (wc / s.wordLimit) * 100);
            const over = wc > s.wordLimit;
            return (
              <div key={s.key} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <h2 className="font-display font-semibold">{s.title}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.guidance}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => aiFill(s.key)} disabled={busy === s.key} className="gap-1">
                      {busy === s.key ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} AI draft
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setRefineOpen(s.key); setRefineInstr(""); }} disabled={!value.trim()} className="gap-1">
                      <Wand2 className="h-3 w-3" /> Refine
                    </Button>
                  </div>
                </div>
                <Textarea value={value} onChange={(e) => setSections((prev) => ({ ...prev, [s.key]: e.target.value }))} rows={8} className="mt-3 font-sans text-sm leading-relaxed" placeholder="Write here, or click AI draft to generate from your organization profile..." />
                <div className="flex items-center gap-3 mt-2">
                  <Progress value={pct} className={`h-1.5 flex-1 ${over ? "[&>div]:bg-destructive" : ""}`} />
                  <span className={`text-xs ${over ? "text-destructive font-medium" : "text-muted-foreground"}`}>{wc} / {s.wordLimit}</span>
                </div>
              </div>
            );
          })}
        </div>
      </main>
      <Footer />

      <Dialog open={!!refineOpen} onOpenChange={(v) => !v && setRefineOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Wand2 className="h-5 w-5 text-primary" /> Refine with AI</DialogTitle>
            <DialogDescription>Tell the AI how to rewrite this section. Facts are preserved.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-xs">Your instruction</Label>
            <Textarea rows={4} value={refineInstr} onChange={(e) => setRefineInstr(e.target.value)} placeholder="e.g. Make it more concise, emphasise women & girls, add stronger numbers, more donor-friendly tone..." />
            <div className="flex flex-wrap gap-1.5">
              {["Make it more concise", "Stronger outcomes & numbers", "More donor-friendly tone", "Emphasise women & girls", "Simplify language"].map((q) => (
                <Button key={q} type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => setRefineInstr(q)}>{q}</Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefineOpen(null)}>Cancel</Button>
            <Button onClick={refine} disabled={refining || !refineInstr.trim()}>{refining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Refine</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
