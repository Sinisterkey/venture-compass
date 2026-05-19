import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { safeErrorMessage } from "@/lib/errors";
import { Camera, Loader2, ArrowRight, User, Check, SkipForward } from "lucide-react";
import { Rocket } from "lucide-react";

const INDUSTRIES = ["AgriTech", "FinTech", "EdTech", "HealthTech", "CleanTech", "Logistics", "E-commerce", "AI/ML", "PropTech", "InsurTech"];
const STAGES = ["idea", "prototype", "mvp", "pilot", "revenue"];
const CATEGORIES = ["Hardware", "Software", "Marketplace", "Research", "Social Impact", "Sustainability", "Mobile App", "Platform"];

function Chips({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {options.map((o) => {
        const active = selected.includes(o);
        return (
          <button
            type="button"
            key={o}
            onClick={() => onToggle(o)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${
              active ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            {active && <Check className="inline h-3 w-3 mr-1" />}
            {o}
          </button>
        );
      })}
    </div>
  );
}

export default function Onboarding() {
  const { user, profile, roles, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [investorPrefs, setInvestorPrefs] = useState({
    investment_focus: [] as string[],
    preferred_stages: [] as string[],
    innovation_categories: [] as string[],
    min_investment: "",
    max_investment: "",
  });
  const [mentorPrefs, setMentorPrefs] = useState({
    industries: [] as string[],
    preferred_categories: [] as string[],
    expertise: [] as string[],
    specialization: "",
  });

  const isInvestor = roles.includes("investor");
  const isMentor = roles.includes("mentor");
  const showPrefs = isInvestor || isMentor;
  const totalSteps = showPrefs ? 2 : 1;

  useEffect(() => {
    if (profile?.avatar_url) setAvatarPreview(profile.avatar_url);
  }, [profile]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/login" replace />;

  const toggle = (arr: string[], v: string) => arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 2MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Upload failed", description: safeErrorMessage(error), variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("user_id", user.id);
    setAvatarPreview(publicUrl);
    setUploading(false);
    toast({ title: "Profile photo updated" });
  };

  const savePrefsAndFinish = async () => {
    setSaving(true);
    if (isInvestor) {
      const payload = {
        user_id: user.id,
        investment_focus: investorPrefs.investment_focus,
        preferred_stages: investorPrefs.preferred_stages,
        innovation_categories: investorPrefs.innovation_categories,
        min_investment: investorPrefs.min_investment ? Number(investorPrefs.min_investment) : null,
        max_investment: investorPrefs.max_investment ? Number(investorPrefs.max_investment) : null,
      };
      const { data: existing } = await supabase.from("investor_profiles").select("id").eq("user_id", user.id).maybeSingle();
      if (existing) await supabase.from("investor_profiles").update(payload as any).eq("user_id", user.id);
      else await supabase.from("investor_profiles").insert(payload as any);
    }
    if (isMentor) {
      const payload = { user_id: user.id, ...mentorPrefs };
      const { data: existing } = await supabase.from("mentor_profiles").select("id").eq("user_id", user.id).maybeSingle();
      if (existing) await supabase.from("mentor_profiles").update(payload).eq("user_id", user.id);
      else await supabase.from("mentor_profiles").insert(payload);
    }
    setSaving(false);
    toast({ title: "All set!", description: "Welcome to LaunchPad Africa." });
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="container py-4 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Rocket className="h-5 w-5" /></div>
          <span className="font-display text-xl font-bold">Launch<span className="text-primary">Pad</span> Africa</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Stepper */}
          <div className="flex items-center gap-2 mb-8">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-medium ${step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {step > s ? <Check className="h-3.5 w-3.5" /> : s}
                </div>
                {s < totalSteps && <div className={`h-px flex-1 ${step > s ? "bg-primary" : "bg-border"}`} />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="rounded-lg border border-border bg-card p-8">
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">Add a profile photo</h1>
              <p className="text-sm text-muted-foreground mb-6">Help others recognize you. You can change it anytime in Settings.</p>

              <div className="flex flex-col items-center gap-4 py-4">
                <div className="relative">
                  <div className="h-32 w-32 rounded-full bg-muted flex items-center justify-center overflow-hidden border-4 border-background ring-2 ring-border">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                  <label className="absolute bottom-1 right-1 h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:bg-primary/90 shadow-md">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatar} disabled={uploading} />
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">PNG or JPG · Max 2MB</p>
              </div>

              <div className="flex justify-between mt-6">
                <Button variant="ghost" onClick={() => showPrefs ? setStep(2) : navigate("/dashboard")} className="gap-2">
                  <SkipForward className="h-4 w-4" /> Skip for now
                </Button>
                <Button onClick={() => showPrefs ? setStep(2) : navigate("/dashboard")} className="gap-2">
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && showPrefs && (
            <div className="rounded-lg border border-border bg-card p-8">
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">Set your preferences</h1>
              <p className="text-sm text-muted-foreground mb-6">
                {isInvestor ? "Tell us what kind of startups you'd like to discover." : "Tell us what kind of founders you'd like to mentor."}
              </p>

              {isInvestor && (
                <div className="space-y-5">
                  <div>
                    <Label>Industries of interest</Label>
                    <Chips options={INDUSTRIES} selected={investorPrefs.investment_focus} onToggle={(v) => setInvestorPrefs({ ...investorPrefs, investment_focus: toggle(investorPrefs.investment_focus, v) })} />
                  </div>
                  <div>
                    <Label>Preferred startup stages</Label>
                    <Chips options={STAGES} selected={investorPrefs.preferred_stages} onToggle={(v) => setInvestorPrefs({ ...investorPrefs, preferred_stages: toggle(investorPrefs.preferred_stages, v) })} />
                  </div>
                  <div>
                    <Label>Innovation categories</Label>
                    <Chips options={CATEGORIES} selected={investorPrefs.innovation_categories} onToggle={(v) => setInvestorPrefs({ ...investorPrefs, innovation_categories: toggle(investorPrefs.innovation_categories, v) })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Min investment ({currency.symbol})</Label><Input type="number" value={investorPrefs.min_investment} onChange={(e) => setInvestorPrefs({ ...investorPrefs, min_investment: e.target.value })} className="mt-1.5" /></div>
                    <div><Label>Max investment ({currency.symbol})</Label><Input type="number" value={investorPrefs.max_investment} onChange={(e) => setInvestorPrefs({ ...investorPrefs, max_investment: e.target.value })} className="mt-1.5" /></div>
                  </div>
                </div>
              )}

              {isMentor && (
                <div className="space-y-5">
                  <div>
                    <Label>Industries you can mentor in</Label>
                    <Chips options={INDUSTRIES} selected={mentorPrefs.industries} onToggle={(v) => setMentorPrefs({ ...mentorPrefs, industries: toggle(mentorPrefs.industries, v) })} />
                  </div>
                  <div>
                    <Label>Preferred startup categories</Label>
                    <Chips options={CATEGORIES} selected={mentorPrefs.preferred_categories} onToggle={(v) => setMentorPrefs({ ...mentorPrefs, preferred_categories: toggle(mentorPrefs.preferred_categories, v) })} />
                  </div>
                  <div>
                    <Label htmlFor="spec">Specialization</Label>
                    <Input id="spec" value={mentorPrefs.specialization} onChange={(e) => setMentorPrefs({ ...mentorPrefs, specialization: e.target.value })} placeholder="e.g. Product strategy, Go-to-market" className="mt-1.5" />
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-8">
                <Button variant="ghost" onClick={() => navigate("/dashboard")}>Skip for now</Button>
                <Button onClick={savePrefsAndFinish} disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Finish & Continue <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
