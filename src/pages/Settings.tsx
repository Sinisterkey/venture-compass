import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
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
import { User, Shield, Camera, Save, Loader2, Filter, Globe } from "lucide-react";
import { CurrencySwitcher } from "@/components/CurrencySwitcher";
import { FUNDING_STAGE_OPTIONS } from "@/lib/labels";

const INDUSTRIES = ["AgriTech","FinTech","EdTech","HealthTech","CleanTech","Logistics","E-commerce","AI/ML","PropTech","InsurTech"];
const STAGES = FUNDING_STAGE_OPTIONS.map((o) => o.value);
const CATEGORIES = ["Hardware","Software","Marketplace","Research","Social Impact","Sustainability","Mobile App","Platform"];

function ChipSelect({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 mt-1.5">
      {options.map((o) => {
        const active = selected.includes(o);
        return (
          <button
            type="button"
            key={o}
            onClick={() => onToggle(o)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              active ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/40"
            }`}
          >{o}</button>
        );
      })}
    </div>
  );
}

export default function Settings() {
  const { user, profile, roles, loading } = useAuth();
  const { toast } = useToast();
  const { currency } = useCurrency();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "preferences" | "security">("profile");
  const [investorPrefs, setInvestorPrefs] = useState({ investment_focus: [] as string[], preferred_stages: [] as string[], innovation_categories: [] as string[], min_investment: "", max_investment: "" });
  const [mentorPrefs, setMentorPrefs] = useState({ industries: [] as string[], expertise: [] as string[], preferred_categories: [] as string[], specialization: "", availability: "" });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const isInvestor = roles.includes("investor");
  const isMentor = roles.includes("mentor");
  const showPrefs = isInvestor || isMentor;

  const [form, setForm] = useState({
    full_name: "",
    bio: "",
    country: "",
    city: "",
    phone: "",
    website: "",
    linkedin_url: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || "",
        bio: profile.bio || "",
        country: profile.country || "",
        city: profile.city || "",
        phone: profile.phone || "",
        website: profile.website || "",
        linkedin_url: profile.linkedin_url || "",
      });
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    if (isInvestor) {
      supabase.from("investor_profiles").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
        if (data) setInvestorPrefs({
          investment_focus: data.investment_focus || [],
          preferred_stages: data.preferred_stages || [],
          innovation_categories: data.innovation_categories || [],
          min_investment: data.min_investment?.toString() || "",
          max_investment: data.max_investment?.toString() || "",
        });
      });
    }
    if (isMentor) {
      supabase.from("mentor_profiles").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
        if (data) setMentorPrefs({
          industries: data.industries || [],
          expertise: data.expertise || [],
          preferred_categories: data.preferred_categories || [],
          specialization: data.specialization || "",
          availability: data.availability || "",
        });
      });
    }
  }, [user, isInvestor, isMentor]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const toggleArr = (arr: string[], v: string) => arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const saveInvestorPrefs = async () => {
    setSavingPrefs(true);
    const payload = {
      user_id: user.id,
      investment_focus: investorPrefs.investment_focus,
      preferred_stages: investorPrefs.preferred_stages,
      innovation_categories: investorPrefs.innovation_categories,
      min_investment: investorPrefs.min_investment ? Number(investorPrefs.min_investment) : null,
      max_investment: investorPrefs.max_investment ? Number(investorPrefs.max_investment) : null,
    };
    const { data: existing } = await supabase.from("investor_profiles").select("id").eq("user_id", user.id).maybeSingle();
    const { error } = existing
      ? await supabase.from("investor_profiles").update(payload as any).eq("user_id", user.id)
      : await supabase.from("investor_profiles").insert(payload as any);
    setSavingPrefs(false);
    if (error) toast({ title: "Error", description: safeErrorMessage(error), variant: "destructive" });
    else toast({ title: "Preferences saved" });
  };

  const saveMentorPrefs = async () => {
    setSavingPrefs(true);
    const payload = { user_id: user.id, ...mentorPrefs };
    const { data: existing } = await supabase.from("mentor_profiles").select("id").eq("user_id", user.id).maybeSingle();
    const { error } = existing
      ? await supabase.from("mentor_profiles").update(payload).eq("user_id", user.id)
      : await supabase.from("mentor_profiles").insert(payload);
    setSavingPrefs(false);
    if (error) toast({ title: "Error", description: safeErrorMessage(error), variant: "destructive" });
    else toast({ title: "Preferences saved" });
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update(form)
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Error saving profile", description: safeErrorMessage(error), variant: "destructive" });
    } else {
      toast({ title: "Profile updated successfully" });
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please choose an image (JPG, PNG, WebP).", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 2MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || file.type.split("/")[1] || "jpg")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 5) || "jpg";
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, {
          upsert: true,
          contentType: file.type || "image/jpeg",
          cacheControl: "3600",
        });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const bustedUrl = `${publicUrl}?v=${Date.now()}`;
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ avatar_url: bustedUrl })
        .eq("user_id", user.id);
      if (profileError) throw profileError;
      toast({ title: "Profile photo updated" });
      window.location.reload();
    } catch (err: any) {
      console.error("[avatar upload]", err);
      toast({
        title: "Upload failed",
        description: err?.message || "Could not upload your photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword.length < 6) {
      toast({ title: "Password too short", description: "Min 6 characters", variant: "destructive" });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword });
    if (error) {
      toast({ title: "Error", description: safeErrorMessage(error), variant: "destructive" });
    } else {
      toast({ title: "Password updated" });
      setPasswordForm({ newPassword: "", confirmPassword: "" });
    }
    setSaving(false);
  };

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: User },
    ...(showPrefs ? [{ id: "preferences" as const, label: "Preferences", icon: Filter }] : []),
    { id: "security" as const, label: "Security", icon: Shield },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="border-b border-border bg-muted/30">
          <div className="container py-6">
            <h1 className="font-display text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your profile and account preferences</p>
          </div>
        </div>

        <div className="container py-6">
          <div className="flex gap-8">
            {/* Sidebar */}
            <aside className="hidden md:block w-48 shrink-0">
              <nav className="space-y-1 sticky top-20">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </aside>

            {/* Content */}
            <div className="flex-1 max-w-2xl">
              {/* Mobile tabs */}
              <div className="md:hidden flex gap-2 mb-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-2 text-sm font-medium rounded-md ${
                      activeTab === tab.id ? "bg-primary/10 text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === "profile" && (
                <div className="space-y-6">
                  {/* Avatar */}
                  <div className="rounded-lg border border-border bg-card p-6">
                    <h2 className="font-display font-semibold text-foreground mb-4">Profile Photo</h2>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                          {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <User className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <label className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:bg-primary/90">
                          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                          <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
                        </label>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{profile?.full_name || "Your Name"}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                        <div className="flex gap-1 mt-1">
                          {roles.map((r) => (
                            <Badge key={r} variant="secondary" className="text-xs capitalize">{r}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Display preferences */}
                  <div className="rounded-lg border border-border bg-card p-6">
                    <h2 className="font-display font-semibold text-foreground mb-1 flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary" /> Display preferences
                    </h2>
                    <p className="text-xs text-muted-foreground mb-4">Choose the currency used across the site.</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">Currency</p>
                        <p className="text-xs text-muted-foreground">Funding amounts will show in this currency.</p>
                      </div>
                      <CurrencySwitcher compact />
                    </div>
                  </div>

                  {/* Profile details */}
                  <div className="rounded-lg border border-border bg-card p-6">
                    <h2 className="font-display font-semibold text-foreground mb-4">Personal Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input id="full_name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="mt-1.5" />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1.5" />
                      </div>
                      <div>
                        <Label htmlFor="country">Country</Label>
                        <Input id="country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="mt-1.5" />
                      </div>
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="mt-1.5" />
                      </div>
                      <div>
                        <Label htmlFor="website">Website</Label>
                        <Input id="website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="mt-1.5" />
                      </div>
                      <div>
                        <Label htmlFor="linkedin">LinkedIn</Label>
                        <Input id="linkedin" value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} className="mt-1.5" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea id="bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell us about yourself..." className="mt-1.5" rows={4} />
                    </div>
                    <div className="mt-6 flex justify-end">
                      <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "preferences" && showPrefs && (
                <div className="space-y-6">
                  {isInvestor && (
                    <div className="rounded-lg border border-border bg-card p-6">
                      <h2 className="font-display font-semibold text-foreground mb-4">Investor Preferences</h2>
                      <div className="space-y-5">
                        <div>
                          <Label>Industries of interest</Label>
                          <ChipSelect options={INDUSTRIES} selected={investorPrefs.investment_focus} onToggle={(v) => setInvestorPrefs({ ...investorPrefs, investment_focus: toggleArr(investorPrefs.investment_focus, v) })} />
                        </div>
                        <div>
                          <Label>Preferred startup stages</Label>
                          <ChipSelect options={STAGES} selected={investorPrefs.preferred_stages} onToggle={(v) => setInvestorPrefs({ ...investorPrefs, preferred_stages: toggleArr(investorPrefs.preferred_stages, v) })} />
                        </div>
                        <div>
                          <Label>Innovation categories</Label>
                          <ChipSelect options={CATEGORIES} selected={investorPrefs.innovation_categories} onToggle={(v) => setInvestorPrefs({ ...investorPrefs, innovation_categories: toggleArr(investorPrefs.innovation_categories, v) })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div><Label>Min investment ({currency.symbol})</Label><Input type="number" value={investorPrefs.min_investment} onChange={(e) => setInvestorPrefs({ ...investorPrefs, min_investment: e.target.value })} className="mt-1.5" /></div>
                          <div><Label>Max investment ({currency.symbol})</Label><Input type="number" value={investorPrefs.max_investment} onChange={(e) => setInvestorPrefs({ ...investorPrefs, max_investment: e.target.value })} className="mt-1.5" /></div>
                        </div>
                        <Button onClick={saveInvestorPrefs} disabled={savingPrefs} className="gap-2">
                          {savingPrefs ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Preferences
                        </Button>
                      </div>
                    </div>
                  )}
                  {isMentor && (
                    <div className="rounded-lg border border-border bg-card p-6">
                      <h2 className="font-display font-semibold text-foreground mb-4">Mentor Preferences</h2>
                      <div className="space-y-5">
                        <div>
                          <Label>Industries</Label>
                          <ChipSelect options={INDUSTRIES} selected={mentorPrefs.industries} onToggle={(v) => setMentorPrefs({ ...mentorPrefs, industries: toggleArr(mentorPrefs.industries, v) })} />
                        </div>
                        <div>
                          <Label>Areas of expertise</Label>
                          <ChipSelect options={["Product","Engineering","Go-to-Market","Fundraising","Operations","Design","Legal","Finance"]} selected={mentorPrefs.expertise} onToggle={(v) => setMentorPrefs({ ...mentorPrefs, expertise: toggleArr(mentorPrefs.expertise, v) })} />
                        </div>
                        <div>
                          <Label>Preferred startup categories</Label>
                          <ChipSelect options={CATEGORIES} selected={mentorPrefs.preferred_categories} onToggle={(v) => setMentorPrefs({ ...mentorPrefs, preferred_categories: toggleArr(mentorPrefs.preferred_categories, v) })} />
                        </div>
                        <div>
                          <Label>Specialization</Label>
                          <Input value={mentorPrefs.specialization} onChange={(e) => setMentorPrefs({ ...mentorPrefs, specialization: e.target.value })} placeholder="e.g. Hardware prototyping" className="mt-1.5" />
                        </div>
                        <div>
                          <Label>Availability</Label>
                          <Input value={mentorPrefs.availability} onChange={(e) => setMentorPrefs({ ...mentorPrefs, availability: e.target.value })} placeholder="e.g. 2 hours / week" className="mt-1.5" />
                        </div>
                        <Button onClick={saveMentorPrefs} disabled={savingPrefs} className="gap-2">
                          {savingPrefs ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Preferences
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "security" && (
                <div className="space-y-6">
                  <div className="rounded-lg border border-border bg-card p-6">
                    <h2 className="font-display font-semibold text-foreground mb-4">Change Password</h2>
                    <div className="space-y-4 max-w-sm">
                      <div>
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input id="newPassword" type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} className="mt-1.5" />
                      </div>
                      <div>
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input id="confirmPassword" type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} className="mt-1.5" />
                      </div>
                      <Button onClick={handleChangePassword} disabled={saving}>
                        {saving ? "Updating..." : "Update Password"}
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-card p-6">
                    <h2 className="font-display font-semibold text-foreground mb-4">Account Info</h2>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email</span>
                        <span className="text-foreground">{user.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Roles</span>
                        <div className="flex gap-1">
                          {roles.map((r) => <Badge key={r} variant="outline" className="text-xs capitalize">{r}</Badge>)}
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Member since</span>
                        <span className="text-foreground">{new Date(user.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
