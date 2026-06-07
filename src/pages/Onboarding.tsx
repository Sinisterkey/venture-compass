import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { safeErrorMessage } from "@/lib/errors";
import { Camera, Loader2, ArrowRight, User, Check, Sparkles } from "lucide-react";
import { SECTORS, COUNTRIES, SDGS, INVESTOR_TYPES } from "@/lib/labels";

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

export default function Onboarding() {
  const { user, profile, roles, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [investorPrefs, setInvestorPrefs] = useState({
    organization_name: "",
    investor_type: "" as string,
    bio: "",
    investment_focus: [] as string[],
    preferred_countries: [] as string[],
    preferred_sdgs: [] as number[],
    min_investment: "",
    max_investment: "",
  });

  const isInvestor = roles.includes("investor");
  const isNgo = roles.includes("ngo");
  const totalSteps = isInvestor ? 2 : 1;

  useEffect(() => { if (profile?.avatar_url) setAvatarPreview(profile.avatar_url); }, [profile]);
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/login" replace />;

  const toggle = <T,>(arr: T[], v: T) => arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast({ title: "File too large", description: "Max 2MB", variant: "destructive" });
    setUploading(true);
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5);
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
    if (error) { toast({ title: "Upload failed", description: safeErrorMessage(error), variant: "destructive" }); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    const busted = `${publicUrl}?v=${Date.now()}`;
    await supabase.from("profiles").update({ avatar_url: busted }).eq("user_id", user.id);
    setAvatarPreview(busted);
    setUploading(false);
    toast({ title: "Profile photo updated" });
  };

  const finishInvestor = async () => {
    setSaving(true);
    const payload = {
      user_id: user.id,
      organization_name: investorPrefs.organization_name || null,
      investor_type: investorPrefs.investor_type || null,
      bio: investorPrefs.bio || null,
      investment_focus: investorPrefs.investment_focus,
      preferred_countries: investorPrefs.preferred_countries,
      preferred_sdgs: investorPrefs.preferred_sdgs,
      min_investment: investorPrefs.min_investment ? Number(investorPrefs.min_investment) : null,
      max_investment: investorPrefs.max_investment ? Number(investorPrefs.max_investment) : null,
    };
    const { data: existing } = await supabase.from("investor_profiles").select("id").eq("user_id", user.id).maybeSingle();
    const { error } = existing
      ? await supabase.from("investor_profiles").update(payload as any).eq("user_id", user.id)
      : await supabase.from("investor_profiles").insert(payload as any);
    setSaving(false);
    if (error) toast({ title: "Save failed", description: safeErrorMessage(error), variant: "destructive" });
    else { toast({ title: "All set!" }); navigate("/dashboard"); }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="container py-4 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Sparkles className="h-5 w-5" /></div>
          <span className="font-display text-xl font-bold">Launch<span className="text-primary">Pad</span> Africa</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
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
              <p className="text-sm text-muted-foreground mb-6">Help others recognize you.</p>
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="relative">
                  <div className="h-32 w-32 rounded-full bg-muted flex items-center justify-center overflow-hidden border-4 border-background ring-2 ring-border">
                    {avatarPreview ? <img src={avatarPreview} alt="" className="h-full w-full object-cover" /> : <User className="h-12 w-12 text-muted-foreground" />}
                  </div>
                  <label className="absolute bottom-1 right-1 h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:bg-primary/90 shadow-md">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatar} disabled={uploading} />
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">PNG or JPG · Max 2MB</p>
              </div>
              <div className="flex justify-between mt-6">
                <Button variant="ghost" onClick={() => isInvestor ? setStep(2) : navigate(isNgo ? "/create-organization" : "/dashboard")}>Skip</Button>
                <Button onClick={() => isInvestor ? setStep(2) : navigate(isNgo ? "/create-organization" : "/dashboard")} className="gap-2">
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && isInvestor && (
            <div className="rounded-lg border border-border bg-card p-8 space-y-5">
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground mb-2">Your funding interests</h1>
                <p className="text-sm text-muted-foreground">Help our AI find NGOs aligned with your mission.</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Organization / Fund name (optional)</Label>
                  <Input value={investorPrefs.organization_name} onChange={(e) => setInvestorPrefs({ ...investorPrefs, organization_name: e.target.value })} className="mt-1.5" />
                </div>
                <div>
                  <Label>Funder type</Label>
                  <select value={investorPrefs.investor_type} onChange={(e) => setInvestorPrefs({ ...investorPrefs, investor_type: e.target.value })} className="mt-1.5 w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                    <option value="">Select…</option>
                    {INVESTOR_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <Label>Short bio</Label>
                <Textarea value={investorPrefs.bio} onChange={(e) => setInvestorPrefs({ ...investorPrefs, bio: e.target.value })} rows={3} className="mt-1.5" />
              </div>
              <div>
                <Label>Sectors you fund</Label>
                <Chips options={SECTORS} selected={investorPrefs.investment_focus} onToggle={(v) => setInvestorPrefs({ ...investorPrefs, investment_focus: toggle(investorPrefs.investment_focus, v) })} />
              </div>
              <div>
                <Label>Countries you fund in</Label>
                <Chips options={COUNTRIES} selected={investorPrefs.preferred_countries} onToggle={(v) => setInvestorPrefs({ ...investorPrefs, preferred_countries: toggle(investorPrefs.preferred_countries, v) })} />
              </div>
              <div>
                <Label>SDGs you support</Label>
                <Chips options={SDGS.map((s) => s.n)} selected={investorPrefs.preferred_sdgs} onToggle={(v) => setInvestorPrefs({ ...investorPrefs, preferred_sdgs: toggle(investorPrefs.preferred_sdgs, v) })} getLabel={(n) => `${n}. ${SDGS.find((s) => s.n === n)?.label ?? ""}`} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Min funding (ZMW)</Label><Input type="number" value={investorPrefs.min_investment} onChange={(e) => setInvestorPrefs({ ...investorPrefs, min_investment: e.target.value })} className="mt-1.5" /></div>
                <div><Label>Max funding (ZMW)</Label><Input type="number" value={investorPrefs.max_investment} onChange={(e) => setInvestorPrefs({ ...investorPrefs, max_investment: e.target.value })} className="mt-1.5" /></div>
              </div>
              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => navigate("/dashboard")}>Skip</Button>
                <Button onClick={finishInvestor} disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Finish <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
