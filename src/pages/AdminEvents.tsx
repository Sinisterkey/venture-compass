import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { safeErrorMessage } from "@/lib/errors";
import { Trash2 } from "lucide-react";

const TYPES = [
  { value: "hackathon", label: "Hackathon" },
  { value: "fair", label: "Innovation Fair" },
  { value: "competition", label: "Startup Competition" },
  { value: "demo_day", label: "Demo Day" },
  { value: "pitch_event", label: "Pitch Event" },
];

export default function AdminEvents() {
  const { user, roles, loading } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: "",
    type: "hackathon",
    description: "",
    university: "Mukuba University",
    location: "",
    starts_at: "",
    ends_at: "",
  });
  const [saving, setSaving] = useState(false);

  const isAdmin = roles.includes("admin");

  const load = async () => {
    const { data } = await supabase.from("innovation_events").select("*").order("starts_at", { ascending: true });
    setEvents(data || []);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const create = async () => {
    if (!form.title || !form.starts_at) { toast({ title: "Title and start date required", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("innovation_events").insert({
      title: form.title,
      type: form.type as any,
      description: form.description || null,
      university: form.university || null,
      location: form.location || null,
      starts_at: new Date(form.starts_at).toISOString(),
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      created_by: user.id,
    });
    setSaving(false);
    if (error) toast({ title: "Error", description: safeErrorMessage(error), variant: "destructive" });
    else { toast({ title: "Event created" }); setForm({ ...form, title: "", description: "", location: "", starts_at: "", ends_at: "" }); load(); }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("innovation_events").delete().eq("id", id);
    if (error) toast({ title: "Delete failed", description: safeErrorMessage(error), variant: "destructive" });
    else load();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="border-b border-border bg-muted/30">
          <div className="container py-6">
            <h1 className="font-display text-2xl font-bold text-foreground">Manage Innovation Events</h1>
            <p className="text-sm text-muted-foreground mt-1">Create and manage campus innovation events.</p>
          </div>
        </div>
        <div className="container py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="font-display font-semibold mb-4">Create Event</h2>
            <div className="space-y-3">
              <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1.5" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>{TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>University</Label><Input value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })} className="mt-1.5" /></div>
              </div>
              <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="mt-1.5" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Starts</Label><Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} className="mt-1.5" /></div>
                <div><Label>Ends</Label><Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} className="mt-1.5" /></div>
              </div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="mt-1.5" /></div>
              <Button onClick={create} disabled={saving}>{saving ? "Creating..." : "Create Event"}</Button>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="font-display font-semibold mb-4">All Events</h2>
            <div className="space-y-2">
              {events.length === 0 && <p className="text-sm text-muted-foreground">No events yet.</p>}
              {events.map((e) => (
                <div key={e.id} className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{e.title}</p>
                      <Badge variant="secondary" className="text-xs capitalize">{e.type.replace("_", " ")}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{new Date(e.starts_at).toLocaleString()} · {e.university || "—"}</p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => remove(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
