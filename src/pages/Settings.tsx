import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { safeErrorMessage } from "@/lib/errors";
import { User, Shield, Camera, Save, Loader2, Filter, Globe, Check } from "lucide-react";
import { CurrencySwitcher } from "@/components/CurrencySwitcher";
import { SECTORS, COUNTRIES, SDGS, INVESTOR_TYPES } from "@/lib/labels";

function Chips<T extends string | number>({ options, selected, onToggle, getLabel }: { options: T[]; selected: T[]; onToggle: (v: T) => void; getLabel?: (v: T) => string }) {
  return (
    <div className="flex flex-wrap gap-2 mt-1.5">
      {options.map((o) => {
        const active = selected.includes(o);
        return (
          <button type="button" key={String(o)} onClick={() => onToggle(o)} className={`px-3 py-1.5 rounded-full text-xs font-medium border ${active ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/40"}`}>
            {active && <Check className="inline h-3 w-3 mr-1" />}
            {getLabel ? getLabel(o) : String(o)}
          </button>
        );
      })}
    </div>
  );
}

export default function Settings() {
  const { user, profile, roles, loading } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "preferences" | "security">("profile");
  const [savingPrefs, setSavingPrefs] = useState(false);
  const isInvestor = roles.includes("investor");

  const [investorPrefs, setInvestorPrefs] = useState({
    organization_name: "", investor_type: "", bio: "",
    investment_focus: [] as string[],
    preferred_countries: [] as string[],
    preferred_sdgs: [] as number[],
    min_investment: "", max_investment: "",
  });

  const [form, setForm] = useState({
    full_name: "", bio: "", country: "", city: "", phone: "", website: "", linkedin_url: "",
  });
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });

  useEffect(() => {
    if (profile) setForm({
      full_name: profile.full_name || "", bio: profile.bio || "",
      country: profile.country || "", city: profile.city || "",
      phone: profile.phone || "", website: profile.website || "",
      linkedin_url: profile.linkedin_url || "",
    });
  }, [profile]);

  useEffect(() => {
    if (!user || !isInvestor) return;
    supabase.from("investor_profiles").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) setInvestorPrefs({
        organization_name: data.organization_name || "",
        investor_type: data.investor_type || "",
        bio: data.bio || "",
        investment_focus: data.investment_focus || [],
        preferred_countries: data.preferred_countries || [],
        preferred_sdgs: data.preferred_sdgs || [],
        min_investment: data.min_investment?.toString() || "",
        max_investment: data.max_investment?.toString() || "",
      });
    });
  }, [user, isInvestor]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/login" replace />;

  const toggle = <T,>(arr: T[], v: T) => arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const saveInvestorPrefs = async () => {
    setSavingPrefs(true);
    const payload: any = {
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
      ? await supabase.from("investor_profiles").update(payload).eq("user_id", user.id)
      : await supabase.from("investor_profiles").insert(payload);
    setSavingPrefs(false);
    if (error) toast({ title: "Error", description: safeErrorMessage(error), variant: "destructive" });
    else toast({ title: "Preferences saved" });
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const { error } = await supabase.from("profiles").update(form).eq("user_id", user.id);
    setSaving(false);
    if (error) toast({ title: "Error", description: safeErrorMessage(error), variant: "destructive" });
    else toast({ title: "Profile updated" });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast({ title: "Too large", description: "Max 2MB", variant: "destructive" });
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5);
      const path = `${user.id}/avatar.${ext}`;
      const { error: ue } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });
      if (ue) throw ue;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      await supabase.from("profiles").update({ avatar_url: `${publicUrl}?v=${Date.now()}` }).eq("user_id", user.id);
      toast({ title: "Photo updated" });
      window.location.reload();
    } catch (err: any) {
      toast({ title: "Upload failed", description: err?.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword.length < 6) return toast({ title: "Min 6 characters", variant: "destructive" });
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return toast({ title: "Passwords don't match", variant: "destructive" });
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword });
    setSaving(false);
    if (error) toast({ title: "Error", description: safeErrorMessage(error), variant: "destructive" });
    else { toast({ title: "Password updated" }); setPasswordForm({ newPassword: "", confirmPassword: "" }); }
  };

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: User },
    ...(isInvestor ? [{ id: "preferences" as const, label: "Funding interests", icon: Filter }] : []),
    { id: "security" as const, label: "Security", icon: Shield },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="border-b border-border bg-muted/30">
          <div className="container py-6">
            <h1 className="font-display text-2xl font-bold">Settings</h1>
          </div>
        </div>

        <div className="container py-6 flex gap-8">
          <aside className="hidden md:block w-48 shrink-0">
            <nav className="space-y-1 sticky top-20">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${activeTab === tab.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                  <tab.icon className="h-4 w-4" />{tab.label}
                </button>
              ))}
            </nav>
          </aside>

          <div className="flex-1 max-w-2xl">
            <div className="md:hidden flex gap-2 mb-6">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 py-2 text-sm font-medium rounded-md ${activeTab === tab.id ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>{tab.label}</button>
              ))}
            </div>

            {activeTab === "profile" && (
              <div className="space-y-6">
                <div className="rounded-lg border border-border bg-card p-6">
                  <h2 className="font-display font-semibold mb-4">Profile Photo</h2>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : <User className="h-6 w-6 text-muted-foreground" />}
                      </div>
                      <label className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer">
                        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
                      </label>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{profile?.full_name || "Your Name"}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <div className="flex gap-1 mt-1">
                        {roles.map((r) => <Badge key={r} variant="secondary" className="text-xs">{r}</Badge>)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-6">
                  <h2 className="font-display font-semibold mb-1 flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> Display preferences</h2>
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <p className="text-sm font-medium">Currency</p>
                      <p className="text-xs text-muted-foreground">Used across the site.</p>
                    </div>
                    <CurrencySwitcher compact />
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-6">
                  <h2 className="font-display font-semibold mb-4">Personal Information</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div><Label>Full Name</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="mt-1.5" /></div>
                    <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1.5" /></div>
                    <div><Label>Country</Label><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="mt-1.5" /></div>
                    <div><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="mt-1.5" /></div>
                    <div><Label>Website</Label><Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="mt-1.5" /></div>
                    <div><Label>LinkedIn</Label><Input value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} className="mt-1.5" /></div>
                  </div>
                  <div className="mt-4"><Label>Bio</Label><Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={4} className="mt-1.5" /></div>
                  <div className="mt-6 flex justify-end">
                    <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "preferences" && isInvestor && (
              <div className="rounded-lg border border-border bg-card p-6 space-y-5">
                <h2 className="font-display font-semibold">Funding interests</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Organization / Fund</Label>
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
                  <Label>Bio</Label>
                  <Textarea value={investorPrefs.bio} onChange={(e) => setInvestorPrefs({ ...investorPrefs, bio: e.target.value })} rows={3} className="mt-1.5" />
                </div>
                <div>
                  <Label>Sectors</Label>
                  <Chips options={SECTORS} selected={investorPrefs.investment_focus} onToggle={(v) => setInvestorPrefs({ ...investorPrefs, investment_focus: toggle(investorPrefs.investment_focus, v) })} />
                </div>
                <div>
                  <Label>Countries</Label>
                  <Chips options={COUNTRIES} selected={investorPrefs.preferred_countries} onToggle={(v) => setInvestorPrefs({ ...investorPrefs, preferred_countries: toggle(investorPrefs.preferred_countries, v) })} />
                </div>
                <div>
                  <Label>SDGs</Label>
                  <Chips options={SDGS.map((s) => s.n)} selected={investorPrefs.preferred_sdgs} onToggle={(v) => setInvestorPrefs({ ...investorPrefs, preferred_sdgs: toggle(investorPrefs.preferred_sdgs, v) })} getLabel={(n) => `${n}`} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Min funding (ZMW)</Label><Input type="number" value={investorPrefs.min_investment} onChange={(e) => setInvestorPrefs({ ...investorPrefs, min_investment: e.target.value })} className="mt-1.5" /></div>
                  <div><Label>Max funding (ZMW)</Label><Input type="number" value={investorPrefs.max_investment} onChange={(e) => setInvestorPrefs({ ...investorPrefs, max_investment: e.target.value })} className="mt-1.5" /></div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={saveInvestorPrefs} disabled={savingPrefs} className="gap-2">
                    {savingPrefs ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="rounded-lg border border-border bg-card p-6 space-y-4 max-w-md">
                <h2 className="font-display font-semibold">Change password</h2>
                <div><Label>New password</Label><Input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} className="mt-1.5" /></div>
                <div><Label>Confirm password</Label><Input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} className="mt-1.5" /></div>
                <Button onClick={handleChangePassword} disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Update password
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
