import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, GraduationCap, Trophy, Users, Clock } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { safeErrorMessage } from "@/lib/errors";
import { eventCover, EVENT_TYPE_LABEL } from "@/lib/eventCovers";

interface AgendaItem { time?: string; title: string; speaker?: string; }
interface Speaker { name: string; role?: string; avatar_url?: string; }

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, roles } = useAuth();
  const { toast } = useToast();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [myStartups, setMyStartups] = useState<{ id: string; name: string }[]>([]);
  const [selectedStartup, setSelectedStartup] = useState("");
  const [applying, setApplying] = useState(false);
  const isFounder = roles.includes("founder");

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [{ data: ev }, startupsRes] = await Promise.all([
        supabase.from("innovation_events").select("*").eq("id", id).maybeSingle(),
        user ? supabase.from("startups").select("id,name").eq("founder_id", user.id) : Promise.resolve({ data: [] as any }),
      ]);
      setEvent(ev);
      setMyStartups((startupsRes.data as any) || []);
      setLoading(false);
    })();
  }, [id, user]);

  const isPast = event ? new Date(event.starts_at).getTime() < Date.now() : false;
  const agenda: AgendaItem[] = useMemo(() => Array.isArray(event?.agenda) ? event.agenda : [], [event]);
  const speakers: Speaker[] = useMemo(() => Array.isArray(event?.speakers) ? event.speakers : [], [event]);

  const apply = async () => {
    if (!user || !id || !selectedStartup) return;
    setApplying(true);
    const { error } = await supabase.from("event_applications").insert({
      event_id: id,
      startup_id: selectedStartup,
      applicant_id: user.id,
    });
    setApplying(false);
    if (error) toast({ title: "Application failed", description: safeErrorMessage(error), variant: "destructive" });
    else toast({ title: "Application submitted" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container py-10"><Skeleton className="h-96 w-full" /></main>
        <Footer />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container py-20 text-center">
          <p className="text-muted-foreground">Event not found.</p>
          <Button variant="link" onClick={() => navigate(-1)}>Back</Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <div className="relative h-[480px] w-full overflow-hidden">
          <img src={eventCover(event.type, event.cover_image_url)} alt={event.title} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
          <div className="absolute inset-0">
            <div className="container h-full flex flex-col justify-end pb-10">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 gap-2 w-fit bg-background/60 hover:bg-background/80 backdrop-blur">
                <ArrowLeft className="h-4 w-4" /> Back to events
              </Button>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge className="bg-primary text-primary-foreground border-none">{EVENT_TYPE_LABEL[event.type] || event.type}</Badge>
                {event.university && (
                  <Badge variant="outline" className="gap-1 bg-background/70 backdrop-blur"><GraduationCap className="h-3 w-3" /> {event.university}</Badge>
                )}
                {isPast && <Badge variant="secondary">Past event</Badge>}
              </div>
              <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-3 max-w-4xl">{event.title}</h1>
              <div className="flex flex-wrap items-center gap-5 text-sm text-foreground/80">
                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{new Date(event.starts_at).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}{event.ends_at ? ` – ${new Date(event.ends_at).toLocaleDateString(undefined, { month: "long", day: "numeric" })}` : ""}</span>
                {event.location && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{event.location}</span>}
                {event.capacity && <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{event.capacity} spots</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="container py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {event.description && (
              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mb-3">About this event</h2>
                <p className="text-base text-foreground leading-relaxed whitespace-pre-line">{event.description}</p>
              </section>
            )}

            {agenda.length > 0 && (
              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mb-4">Agenda</h2>
                <div className="rounded-lg border border-border bg-card divide-y divide-border">
                  {agenda.map((a, i) => (
                    <div key={i} className="p-4 flex gap-4">
                      <div className="w-20 shrink-0 text-sm font-semibold text-primary flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />{a.time || "—"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{a.title}</p>
                        {a.speaker && <p className="text-xs text-muted-foreground mt-0.5">with {a.speaker}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {speakers.length > 0 && (
              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mb-4">Speakers & Judges</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {speakers.map((s, i) => (
                    <div key={i} className="rounded-lg border border-border bg-card p-4 text-center">
                      <div className="h-16 w-16 rounded-full mx-auto mb-3 bg-primary/10 text-primary flex items-center justify-center font-semibold overflow-hidden">
                        {s.avatar_url ? <img src={s.avatar_url} alt={s.name} className="h-full w-full object-cover" /> : s.name.charAt(0)}
                      </div>
                      <p className="text-sm font-semibold text-foreground">{s.name}</p>
                      {s.role && <p className="text-xs text-muted-foreground">{s.role}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {event.prizes && (
              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mb-3 flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Prizes</h2>
                <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-5">
                  <p className="text-sm text-foreground whitespace-pre-line">{event.prizes}</p>
                </div>
              </section>
            )}
          </div>

          {/* Sticky apply card */}
          <aside className="lg:sticky lg:top-24 h-fit">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              {isPast ? (
                <>
                  <h3 className="font-display font-semibold text-foreground mb-2">Applications closed</h3>
                  <p className="text-sm text-muted-foreground">This event has already taken place.</p>
                </>
              ) : (
                <>
                  <h3 className="font-display font-semibold text-foreground mb-1">Apply to participate</h3>
                  <p className="text-xs text-muted-foreground mb-4">Submit one of your startups for this event.</p>
                  {event.registration_deadline && (
                    <p className="text-xs text-foreground mb-4 p-2 rounded bg-muted/50">
                      <span className="font-semibold">Deadline:</span> {new Date(event.registration_deadline).toLocaleDateString()}
                    </p>
                  )}
                  {!user ? (
                    <Button asChild className="w-full"><Link to="/login">Log in to apply</Link></Button>
                  ) : !isFounder ? (
                    <p className="text-sm text-muted-foreground">Only founders can apply.</p>
                  ) : myStartups.length === 0 ? (
                    <Button asChild variant="outline" className="w-full"><Link to="/create-startup">Create a startup first</Link></Button>
                  ) : (
                    <div className="space-y-3">
                      <Select value={selectedStartup} onValueChange={setSelectedStartup}>
                        <SelectTrigger><SelectValue placeholder="Select a startup" /></SelectTrigger>
                        <SelectContent>
                          {myStartups.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button onClick={apply} disabled={!selectedStartup || applying} className="w-full">
                        {applying ? "Submitting..." : "Submit Application"}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
