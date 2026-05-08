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
import { Trash2, ImageIcon } from "lucide-react";
import { eventCover } from "@/lib/eventCovers";

const TYPES = [
  { value: "hackathon", label: "Hackathon" },
  { value: "fair", label: "Innovation Fair" },
  { value: "competition", label: "Startup Competition" },
  { value: "demo_day", label: "Demo Day" },
  { value: "pitch_event", label: "Pitch Event" },
];

const initial = {
  title: "",
  type: "hackathon",
  description: "",
  university: "Mukuba University",
  location: "",
  starts_at: "",
  ends_at: "",
  registration_deadline: "",
  capacity: "",
  prizes: "",
  agenda: "",
  speakers: "",
};

export default function AdminEvents() {
  const { user, roles, loading } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [form, setForm] = useState(initial);
  const [coverFile, setCoverFile] = useState<File | null>(null);
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

  const parseJsonOrEmpty = (s: string) => {
    if (!s.trim()) return [];
    try { const p = JSON.parse(s); return Array.isArray(p) ? p : []; } catch { return null; }
  };

  const create = async () => {
    if (!form.title || !form.starts_at) { toast({ title: "Title and start date required", variant: "destructive" }); return; }
    const agenda = parseJsonOrEmpty(form.agenda);
    const speakers = parseJsonOrEmpty(form.speakers);
    if (agenda === null || speakers === null) { toast({ title: "Agenda/Speakers must be valid JSON arrays", variant: "destructive" }); return; }
    setSaving(true);
    let cover_image_url: string | null = null;
    if (coverFile) {
      const path = `events/${Date.now()}-${coverFile.name.replace(/[^a-z0-9.\-]/gi, "_")}`;
      const up = await supabase.storage.from("startup-media").upload(path, coverFile, { upsert: true });
      if (up.error) { setSaving(false); toast({ title: "Cover upload failed", description: up.error.message, variant: "destructive" }); return; }
      cover_image_url = supabase.storage.from("startup-media").getPublicUrl(path).data.publicUrl;
    }
    const { error } = await supabase.from("innovation_events").insert({
      title: form.title,
      type: form.type as any,
      description: form.description || null,
      university: form.university || null,
      location: form.location || null,
      starts_at: new Date(form.starts_at).toISOString(),
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      registration_deadline: form.registration_deadline ? new Date(form.registration_deadline).toISOString() : null,
      capacity: form.capacity ? parseInt(form.capacity, 10) : null,
      prizes: form.prizes || null,
      agenda,
      speakers,
      cover_image_url,
      created_by: user.id,
    });
    setSaving(false);
    if (error) toast({ title: "Error", description: safeErrorMessage(error), variant: "destructive" });
    else { toast({ title: "Event created" }); setForm(initial); setCoverFile(null); load(); }
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
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Registration deadline</Label><Input type="datetime-local" value={form.registration_deadline} onChange={(e) => setForm({ ...form, registration_deadline: e.target.value })} className="mt-1.5" /></div>
                <div><Label>Capacity</Label><Input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="mt-1.5" /></div>
              </div>
              <div>
                <Label className="flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Cover image (optional — defaults to type-based image)</Label>
                <Input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} className="mt-1.5" />
              </div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="mt-1.5" /></div>
              <div><Label>Prizes</Label><Textarea value={form.prizes} onChange={(e) => setForm({ ...form, prizes: e.target.value })} rows={2} className="mt-1.5" placeholder="1st: $5,000 · 2nd: Mentorship · 3rd: ..." /></div>
              <div>
                <Label>Agenda (JSON array)</Label>
                <Textarea value={form.agenda} onChange={(e) => setForm({ ...form, agenda: e.target.value })} rows={3} className="mt-1.5 font-mono text-xs" placeholder='[{"time":"09:00","title":"Opening keynote","speaker":"Dr. Mwale"}]' />
              </div>
              <div>
                <Label>Speakers (JSON array)</Label>
                <Textarea value={form.speakers} onChange={(e) => setForm({ ...form, speakers: e.target.value })} rows={3} className="mt-1.5 font-mono text-xs" placeholder='[{"name":"Jane Doe","role":"Partner, ABC Ventures","avatar_url":"https://..."}]' />
              </div>
              <Button onClick={create} disabled={saving}>{saving ? "Creating..." : "Create Event"}</Button>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="font-display font-semibold mb-4">All Events</h2>
            <div className="space-y-2">
              {events.length === 0 && <p className="text-sm text-muted-foreground">No events yet.</p>}
              {events.map((e) => (
                <div key={e.id} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                  <img src={eventCover(e.type, e.cover_image_url)} alt="" className="h-12 w-16 object-cover rounded shrink-0" />
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
