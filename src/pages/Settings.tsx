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
import { User, Shield, Camera, Save, Loader2 } from "lucide-react";

export default function Settings() {
  const { user, profile, roles, loading } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "account" | "security">("profile");

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

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
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 2MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadError) {
      toast({ title: "Upload failed", description: safeErrorMessage(uploadError), variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("user_id", user.id);
    toast({ title: "Avatar updated" });
    setUploading(false);
    window.location.reload();
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
