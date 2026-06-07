import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { safeErrorMessage } from "@/lib/errors";
import { SECTORS, COUNTRIES, SDGS, ORG_STAGE_OPTIONS, BENEFICIARY_TYPES } from "@/lib/labels";
import { Sparkles, Loader2, ArrowRight, ArrowLeft, Camera, Check, Building2 } from "lucide-react";
import { ProposalAssistantDialog } from "@/components/ProposalAssistantDialog";

function Chips<T extends string | number>({ options, selected, onToggle, getLabel }: { options: T[]; selected: T[]; onToggle: (v: T) => void; getLabel?: (v: T) => string }) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {options.map((o) => {
        const active = selected.includes(o);
        return (
          <button type="button" key={String(o)} onClick={() => onToggle(o)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/40"}`}>
            {active && <Check className="inline h-3 w-3 mr-1" />}
            {getLabel ? getLabel(o) : String(o)}
          </button>
        );
      })}
    </div>
  );
}

export default function CreateOrganization() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [proposalOpen, setProposalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", mission: "", short_description: "", sector: "", country: "", province: "",
    target_beneficiaries: "", beneficiary_type: "", impact_area: "",
    funding_required: "", stage: "idea" as string, founded_year: "", website: "", email: "", phone: "",
    sdgs: [] as number[], logo_url: "",
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/login" replace />;

  const toggle = <T,>(arr: T[], v: T) => arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const handleLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5);
    const path = `${user.id}/logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
    if (error) { toast({ title: "Upload failed", description: safeErrorMessage(error), variant: "destructive" }); setUploadingLogo(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    setForm({ ...form, logo_url: `${publicUrl}?v=${Date.now()}` });
    setUploadingLogo(false);
  };

  const submit = async (publish: boolean) => {
    setSaving(true);
    const payload: any = {
      owner_id: user.id,
      name: form.name.trim(),
      mission: form.mission || null,
      short_description: form.short_description || null,
      sector: form.sector || null,
      country: form.country || null,
      province: form.province || null,
      target_beneficiaries: form.target_beneficiaries || null,
      beneficiary_type: form.beneficiary_type || null,
      impact_area: form.impact_area || null,
      funding_required: form.funding_required ? Number(form.funding_required) : null,
      stage: form.stage,
      founded_year: form.founded_year ? Number(form.founded_year) : null,
      website: form.website || null,
      email: form.email || null,
      phone: form.phone || null,
      sdgs: form.sdgs,
      logo_url: form.logo_url || null,
      is_published: publish,
    };
    const { data, error } = await supabase.from("organizations").insert(payload).select().single();
    setSaving(false);
    if (error) { toast({ title: "Could not save", description: safeErrorMessage(error), variant: "destructive" }); return; }
    toast({ title: publish ? "Organization published" : "Draft saved" });
    if (data) {
      // Run AI readiness in the background
      supabase.functions.invoke("ai-readiness", { body: { organization_id: data.id } }).catch(() => {});
      navigate(`/organizations/${data.id}`);
    }
  };

  const total = 4;
  const valid1 = form.name.trim().length > 1;
  const valid2 = !!form.sector && !!form.country;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="border-b border-border bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="container py-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center"><Building2 className="h-5 w-5" /></div>
              <div>
                <h1 className="font-display text-2xl font-bold">Create your organization profile</h1>
                <p className="text-sm text-muted-foreground">Step {step} of {total}</p>
              </div>
            </div>
            <div className="flex gap-1.5 mt-4">
              {Array.from({ length: total }).map((_, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full ${i < step ? "bg-primary" : "bg-muted"}`} />
              ))}
            </div>
          </div>
        </div>

        <div className="container py-8 max-w-3xl">
          {step === 1 && (
            <div className="space-y-5 rounded-xl border border-border bg-card p-8">
              <div>
                <h2 className="font-display text-lg font-semibold">Identity</h2>
                <p className="text-sm text-muted-foreground">Let's start with the basics.</p>
              </div>
              <div className="flex items-start gap-4">
                <div className="relative">
                  <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center overflow-hidden border border-border">
                    {form.logo_url ? <img src={form.logo_url} alt="" className="h-full w-full object-cover" /> : <Building2 className="h-8 w-8 text-muted-foreground" />}
                  </div>
                  <label className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer">
                    {uploadingLogo ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogo} disabled={uploadingLogo} />
                  </label>
                </div>
                <div className="flex-1">
                  <Label>Organization name *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5" placeholder="e.g. Mukuba Youth Empowerment" />
                </div>
              </div>
              <div>
                <Label>Mission statement</Label>
                <Textarea value={form.mission} onChange={(e) => setForm({ ...form, mission: e.target.value })} rows={3} className="mt-1.5" placeholder="A short, powerful statement of why your organization exists." />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label>Short description</Label>
                  <Button type="button" variant="ghost" size="sm" className="text-xs gap-1" onClick={() => setProposalOpen(true)}>
                    <Sparkles className="h-3.5 w-3.5" /> Improve with AI
                  </Button>
                </div>
                <Textarea value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} rows={4} className="mt-1.5" placeholder="What does your organization do? Who do you serve?" />
              </div>
              <div className="flex justify-end pt-2">
                <Button disabled={!valid1} onClick={() => setStep(2)} className="gap-2">Next <ArrowRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 rounded-xl border border-border bg-card p-8">
              <div>
                <h2 className="font-display text-lg font-semibold">Where & what</h2>
                <p className="text-sm text-muted-foreground">Sector, location, and the people you serve.</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Sector *</Label>
                  <select value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} className="mt-1.5 w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                    <option value="">Select…</option>
                    {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Country *</Label>
                  <select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="mt-1.5 w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                    <option value="">Select…</option>
                    {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Province / Region</Label>
                  <Input value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} className="mt-1.5" />
                </div>
                <div>
                  <Label>Stage</Label>
                  <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} className="mt-1.5 w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                    {ORG_STAGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Beneficiary type</Label>
                  <select value={form.beneficiary_type} onChange={(e) => setForm({ ...form, beneficiary_type: e.target.value })} className="mt-1.5 w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                    <option value="">Select…</option>
                    {BENEFICIARY_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Impact area</Label>
                  <Input value={form.impact_area} onChange={(e) => setForm({ ...form, impact_area: e.target.value })} placeholder="e.g. School retention" className="mt-1.5" />
                </div>
              </div>
              <div>
                <Label>Target beneficiaries (description)</Label>
                <Input value={form.target_beneficiaries} onChange={(e) => setForm({ ...form, target_beneficiaries: e.target.value })} placeholder="e.g. 500 girls in rural Copperbelt" className="mt-1.5" />
              </div>
              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(1)} className="gap-2"><ArrowLeft className="h-4 w-4" /> Back</Button>
                <Button disabled={!valid2} onClick={() => setStep(3)} className="gap-2">Next <ArrowRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 rounded-xl border border-border bg-card p-8">
              <div>
                <h2 className="font-display text-lg font-semibold">Impact & funding</h2>
                <p className="text-sm text-muted-foreground">Which SDGs you advance and what you need to grow.</p>
              </div>
              <div>
                <Label>SDGs you contribute to</Label>
                <Chips options={SDGS.map((s) => s.n)} selected={form.sdgs} onToggle={(v) => setForm({ ...form, sdgs: toggle(form.sdgs, v) })} getLabel={(n) => `${n}. ${SDGS.find((s) => s.n === n)?.label ?? ""}`} />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Funding required (ZMW)</Label>
                  <Input type="number" value={form.funding_required} onChange={(e) => setForm({ ...form, funding_required: e.target.value })} className="mt-1.5" />
                </div>
                <div>
                  <Label>Founded year</Label>
                  <Input type="number" value={form.founded_year} onChange={(e) => setForm({ ...form, founded_year: e.target.value })} className="mt-1.5" />
                </div>
              </div>
              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(2)} className="gap-2"><ArrowLeft className="h-4 w-4" /> Back</Button>
                <Button onClick={() => setStep(4)} className="gap-2">Next <ArrowRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5 rounded-xl border border-border bg-card p-8">
              <div>
                <h2 className="font-display text-lg font-semibold">Contact & publish</h2>
                <p className="text-sm text-muted-foreground">Optional. Helps funders reach you.</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div><Label>Website</Label><Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="mt-1.5" /></div>
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1.5" /></div>
                <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1.5" /></div>
              </div>
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 flex gap-3 items-start">
                <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p className="text-xs">After saving, our AI will analyze your profile and generate a readiness score with personalized suggestions to attract funders.</p>
              </div>
              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(3)} className="gap-2"><ArrowLeft className="h-4 w-4" /> Back</Button>
                <div className="flex gap-2">
                  <Button variant="outline" disabled={saving} onClick={() => submit(false)}>Save as draft</Button>
                  <Button disabled={saving} onClick={() => submit(true)} className="gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Publish
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <ProposalAssistantDialog
        open={proposalOpen}
        onOpenChange={setProposalOpen}
        initialText={form.short_description}
        onApply={(improved) => setForm({ ...form, short_description: improved })}
      />
    </div>
  );
}
