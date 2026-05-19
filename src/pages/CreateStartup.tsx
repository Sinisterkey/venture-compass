import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { safeErrorMessage } from "@/lib/errors";
import { Loader2, Upload, FileCheck, ArrowLeft, Rocket, Lightbulb, Coins, TrendingUp, ImageIcon, GraduationCap, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";
import { useCurrency } from "@/contexts/CurrencyContext";

type FundingStage = Database["public"]["Enums"]["funding_stage"];

const INDUSTRIES = ["AgriTech", "FinTech", "EdTech", "HealthTech", "CleanTech", "Logistics", "E-commerce", "AI/ML", "PropTech", "InsurTech", "Other"];

export default function CreateStartup() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const { currency } = useCurrency();
  const [pitchDeck, setPitchDeck] = useState<File | null>(null);
  const [logo, setLogo] = useState<File | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    problem_statement: "",
    solution: "",
    target_market: "",
    business_model: "",
    industry: "",
    funding_stage: "" as FundingStage | "",
    funding_requested: "",
    website: "",
    demo_video_url: "",
    is_university_project: false,
    university_name: "",
    current_stage: "idea",
    innovation_category: "",
    milestones: "",
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    setSaving(true);

    try {
      let logo_url: string | null = null;
      let pitch_deck_url: string | null = null;

      // Upload logo
      if (logo) {
        const ext = logo.name.split(".").pop();
        const path = `${user.id}/${Date.now()}-logo.${ext}`;
        const { error } = await supabase.storage.from("startup-media").upload(path, logo);
        if (!error) {
          const { data } = supabase.storage.from("startup-media").getPublicUrl(path);
          logo_url = data.publicUrl;
        }
      }

      // Upload pitch deck
      if (pitchDeck) {
        const ext = pitchDeck.name.split(".").pop();
        const path = `${user.id}/${Date.now()}-pitch.${ext}`;
        const { error } = await supabase.storage.from("pitch-decks").upload(path, pitchDeck);
        if (!error) {
          pitch_deck_url = path;
        }
      }

      const { error } = await supabase.from("startups").insert({
        founder_id: user.id,
        name: form.name,
        description: form.description || null,
        problem_statement: form.problem_statement || null,
        solution: form.solution || null,
        target_market: form.target_market || null,
        business_model: form.business_model || null,
        industry: form.industry || null,
        funding_stage: (form.funding_stage as FundingStage) || null,
        funding_requested: form.funding_requested ? Number(form.funding_requested) : null,
        website: form.website || null,
        demo_video_url: form.demo_video_url || null,
        is_university_project: form.is_university_project,
        university_name: form.is_university_project ? form.university_name : null,
        current_stage: form.current_stage as any,
        innovation_category: form.innovation_category || null,
        milestones: form.milestones ? form.milestones.split("\n").map((m) => m.trim()).filter(Boolean) : [],
        logo_url,
        pitch_deck_url,
        is_published: false,
      });

      if (error) throw error;

      toast({ title: "Startup created!", description: "You can publish it when ready." });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Error", description: safeErrorMessage(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const update = (key: string, value: any) => setForm({ ...form, [key]: value });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {/* Hero header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-accent text-primary-foreground">
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_30%,white_1px,transparent_1px),radial-gradient(circle_at_80%_70%,white_1px,transparent_1px)] [background-size:32px_32px,40px_40px]" />
          <div className="container relative py-10">
            <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-primary-foreground/80 hover:text-primary-foreground mb-4">
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Link>
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-2xl bg-primary-foreground/15 backdrop-blur flex items-center justify-center shrink-0">
                <Rocket className="h-7 w-7" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-medium bg-primary-foreground/15 backdrop-blur rounded-full px-3 py-1 mb-2">
                  <Sparkles className="h-3 w-3" /> Launch your venture
                </div>
                <h1 className="font-display text-3xl md:text-4xl font-bold mb-1">Tell us about your startup</h1>
                <p className="text-sm text-primary-foreground/80 max-w-xl">
                  Shape your story so investors and mentors can find you. You can save and come back anytime.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container py-8">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-5">
            {/* Basic Info */}
            <SectionCard icon={Rocket} title="The basics" subtitle="A name and a one-liner is enough to start." tone="primary">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Startup Name *</Label>
                  <Input id="name" value={form.name} onChange={(e) => update("name", e.target.value)} required className="mt-1.5" placeholder="e.g. Kalulu AgriTech" />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="What does your startup do?" className="mt-1.5" rows={3} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Industry</Label>
                    <Select value={form.industry} onValueChange={(v) => update("industry", v)}>
                      <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select industry" /></SelectTrigger>
                      <SelectContent>
                        {INDUSTRIES.map((ind) => <SelectItem key={ind} value={ind}>{ind}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Website</Label>
                    <Input value={form.website} onChange={(e) => update("website", e.target.value)} placeholder="https://..." className="mt-1.5" />
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Problem & Solution */}
            <SectionCard icon={Lightbulb} title="Problem & solution" subtitle="The two paragraphs investors care about most." tone="accent">
              <div className="space-y-4">
                <div>
                  <Label>Problem Statement</Label>
                  <Textarea value={form.problem_statement} onChange={(e) => update("problem_statement", e.target.value)} placeholder="What problem are you solving?" className="mt-1.5" rows={3} />
                </div>
                <div>
                  <Label>Solution</Label>
                  <Textarea value={form.solution} onChange={(e) => update("solution", e.target.value)} placeholder="How are you solving it?" className="mt-1.5" rows={3} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Target Market</Label>
                    <Input value={form.target_market} onChange={(e) => update("target_market", e.target.value)} className="mt-1.5" placeholder="Smallholder farmers in Zambia" />
                  </div>
                  <div>
                    <Label>Business Model</Label>
                    <Input value={form.business_model} onChange={(e) => update("business_model", e.target.value)} placeholder="SaaS, Marketplace, etc." className="mt-1.5" />
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Funding */}
            <SectionCard icon={Coins} title="Funding" subtitle="What you're raising — leave blank if not raising yet." tone="primary">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Funding Stage</Label>
                  <Select value={form.funding_stage} onValueChange={(v) => update("funding_stage", v)}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select stage" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pre_seed">Pre-Seed</SelectItem>
                      <SelectItem value="seed">Seed</SelectItem>
                      <SelectItem value="series_a">Series A</SelectItem>
                      <SelectItem value="series_b_plus">Series B+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Funding Requested ({currency.symbol})</Label>
                  <Input type="number" value={form.funding_requested} onChange={(e) => update("funding_requested", e.target.value)} placeholder="50000" className="mt-1.5" />
                </div>
              </div>
            </SectionCard>

            {/* Maturity */}
            <SectionCard icon={TrendingUp} title="Innovation & maturity" subtitle="Where you are on the journey." tone="accent">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Current Stage</Label>
                  <Select value={form.current_stage} onValueChange={(v) => update("current_stage", v)}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="idea">Idea Stage</SelectItem>
                      <SelectItem value="prototype">Prototype Stage</SelectItem>
                      <SelectItem value="mvp">MVP Stage</SelectItem>
                      <SelectItem value="pilot">Pilot Testing</SelectItem>
                      <SelectItem value="revenue">Revenue Generating</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Innovation Category</Label>
                  <Input value={form.innovation_category} onChange={(e) => update("innovation_category", e.target.value)} placeholder="Hardware, Software, Marketplace..." className="mt-1.5" />
                </div>
              </div>
              <div className="mt-4">
                <Label>Milestones achieved (one per line)</Label>
                <Textarea value={form.milestones} onChange={(e) => update("milestones", e.target.value)} rows={3} className="mt-1.5" placeholder={"Won campus pitch competition\nReached 100 pilot users"} />
              </div>
            </SectionCard>

            {/* Files */}
            <SectionCard icon={ImageIcon} title="Media & documents" subtitle="A great logo and deck do a lot of heavy lifting." tone="primary">
              <div className="space-y-4">
                <div>
                  <Label>Logo</Label>
                  <div className="mt-1.5">
                    {logo ? (
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
                        <FileCheck className="h-5 w-5 text-primary shrink-0" />
                        <span className="text-sm truncate flex-1">{logo.name}</span>
                        <Button variant="ghost" size="sm" onClick={() => setLogo(null)} className="text-xs">Remove</Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center gap-2 p-5 rounded-lg border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/[0.02] cursor-pointer transition-colors">
                        <Upload className="h-6 w-6 text-primary" />
                        <span className="text-sm font-medium text-foreground">Upload logo</span>
                        <span className="text-xs text-muted-foreground">PNG or JPG</span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) setLogo(f); }} />
                      </label>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Pitch Deck</Label>
                  <div className="mt-1.5">
                    {pitchDeck ? (
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
                        <FileCheck className="h-5 w-5 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{pitchDeck.name}</p>
                          <p className="text-xs text-muted-foreground">{(pitchDeck.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setPitchDeck(null)} className="text-xs">Remove</Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center gap-2 p-5 rounded-lg border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/[0.02] cursor-pointer transition-colors">
                        <Upload className="h-6 w-6 text-primary" />
                        <span className="text-sm font-medium text-foreground">Upload pitch deck</span>
                        <span className="text-xs text-muted-foreground">PDF · max 10MB</span>
                        <input type="file" className="hidden" accept=".pdf" onChange={(e) => { const f = e.target.files?.[0]; if (f) setPitchDeck(f); }} />
                      </label>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Demo Video URL</Label>
                  <Input value={form.demo_video_url} onChange={(e) => update("demo_video_url", e.target.value)} placeholder="https://youtube.com/..." className="mt-1.5" />
                </div>
              </div>
            </SectionCard>

            {/* University */}
            <SectionCard icon={GraduationCap} title="University affiliation" subtitle="University-backed projects get a verified badge." tone="accent">
              <label className="flex items-center gap-2 mb-4 cursor-pointer">
                <Checkbox checked={form.is_university_project} onCheckedChange={(v) => update("is_university_project", v === true)} />
                <span className="text-sm text-foreground">This is a university project</span>
              </label>
              {form.is_university_project && (
                <div>
                  <Label>University Name</Label>
                  <Input value={form.university_name} onChange={(e) => update("university_name", e.target.value)} className="mt-1.5" placeholder="e.g. Mukuba University" />
                </div>
              )}
            </SectionCard>

            <div className="sticky bottom-4 z-10 rounded-xl bg-card/95 backdrop-blur border border-border shadow-lg p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">You can publish your startup later from the dashboard.</p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => navigate("/dashboard")}>Cancel</Button>
                <Button type="submit" disabled={saving} className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-95">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                  {saving ? "Creating..." : "Create Startup"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  subtitle,
  tone,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  tone: "primary" | "accent";
  children: React.ReactNode;
}) {
  const toneClass = tone === "primary"
    ? "from-primary/15 to-primary/[0.02] text-primary"
    : "from-accent/15 to-accent/[0.02] text-accent";
  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className={`flex items-start gap-3 p-5 bg-gradient-to-br ${toneClass} border-b border-border`}>
        <div className={`h-10 w-10 rounded-lg bg-background flex items-center justify-center shrink-0 shadow-sm`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display font-bold text-foreground">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

