import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, GraduationCap } from "lucide-react";
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="container py-8 max-w-3xl">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>

          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : !event ? (
            <p className="text-muted-foreground">Event not found.</p>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="capitalize">{event.type.replace("_", " ")}</Badge>
                {event.university && (
                  <Badge variant="outline" className="gap-1 border-primary/30 text-primary">
                    <GraduationCap className="h-3 w-3" /> {event.university}
                  </Badge>
                )}
              </div>
              <h1 className="font-display text-3xl font-bold text-foreground mb-3">{event.title}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{new Date(event.starts_at).toLocaleDateString()}{event.ends_at ? ` – ${new Date(event.ends_at).toLocaleDateString()}` : ""}</span>
                {event.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{event.location}</span>}
              </div>
              {event.description && (
                <p className="text-base text-foreground leading-relaxed mb-8">{event.description}</p>
              )}

              {user && isFounder && (
                <div className="rounded-lg border border-border bg-card p-5">
                  <h2 className="font-display font-semibold text-foreground mb-3">Apply with your startup</h2>
                  {myStartups.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      You need a startup to apply. <Link to="/create-startup" className="text-primary hover:underline">Create one</Link>.
                    </p>
                  ) : (
                    <div className="flex gap-3 items-end">
                      <div className="flex-1">
                        <Select value={selectedStartup} onValueChange={setSelectedStartup}>
                          <SelectTrigger><SelectValue placeholder="Select a startup" /></SelectTrigger>
                          <SelectContent>
                            {myStartups.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={apply} disabled={!selectedStartup || applying}>
                        {applying ? "Submitting..." : "Submit Application"}
                      </Button>
                    </div>
                  )}
                </div>
              )}
              {!user && (
                <p className="text-sm text-muted-foreground">
                  <Link to="/login" className="text-primary hover:underline">Log in</Link> as a founder to apply.
                </p>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
