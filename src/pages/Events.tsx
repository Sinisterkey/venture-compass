import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, GraduationCap } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

interface Event {
  id: string;
  title: string;
  type: string;
  description: string | null;
  university: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
}

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("innovation_events")
        .select("*")
        .order("starts_at", { ascending: true });
      setEvents(data || []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="border-b border-border bg-muted/30">
          <div className="container py-8">
            <h1 className="font-display text-3xl font-bold text-foreground">Campus Innovation Events</h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Hackathons, demo days, fairs, and pitch competitions hosted by African universities — anchored by Mukuba University as our primary case study.
            </p>
          </div>
        </div>

        <div className="container py-8">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming events.</p>
          ) : (
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              {events.map((e, i) => (
                <Link
                  key={e.id}
                  to={`/events/${e.id}`}
                  className={`block p-5 hover:bg-muted/40 transition-colors ${i < events.length - 1 ? "border-b border-border" : ""}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs capitalize">{e.type.replace("_", " ")}</Badge>
                        {e.university && (
                          <Badge variant="outline" className="text-xs gap-1 border-primary/30 text-primary">
                            <GraduationCap className="h-3 w-3" /> {e.university}
                          </Badge>
                        )}
                      </div>
                      <h2 className="font-display text-lg font-semibold text-foreground">{e.title}</h2>
                      {e.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{e.description}</p>}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mt-3">
                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(e.starts_at).toLocaleDateString()}</span>
                        {e.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{e.location}</span>}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
