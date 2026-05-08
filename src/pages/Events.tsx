import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, GraduationCap, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { eventCover, EVENT_TYPE_LABEL } from "@/lib/eventCovers";

interface Event {
  id: string;
  title: string;
  type: string;
  description: string | null;
  university: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  cover_image_url: string | null;
}

const FILTERS = [
  { value: "all", label: "All" },
  { value: "hackathon", label: "Hackathons" },
  { value: "demo_day", label: "Demo Days" },
  { value: "fair", label: "Fairs" },
  { value: "competition", label: "Competitions" },
  { value: "pitch_event", label: "Pitch Events" },
];

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("innovation_events")
        .select("*")
        .order("starts_at", { ascending: true });
      setEvents((data as any) || []);
      setLoading(false);
    })();
  }, []);

  const now = Date.now();
  const filtered = useMemo(() => {
    return events
      .filter((e) => (tab === "upcoming" ? new Date(e.starts_at).getTime() >= now : new Date(e.starts_at).getTime() < now))
      .filter((e) => typeFilter === "all" || e.type === typeFilter);
  }, [events, tab, typeFilter, now]);

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {/* Top header */}
        <div className="border-b border-border bg-muted/30">
          <div className="container py-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-1">Campus Innovation</p>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Events & Showcases</h1>
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                Hackathons, demo days, fairs and pitch competitions across African universities — anchored by Mukuba University.
              </p>
            </div>
            <div className="flex gap-1 rounded-full border border-border bg-card p-1">
              {(["upcoming", "past"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-full capitalize transition-colors ${
                    tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filter chips */}
        <div className="container py-5 flex flex-wrap gap-2 border-b border-border">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                typeFilter === f.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/30"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="container py-8 space-y-10">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-72 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-border rounded-lg">
              <p className="text-sm text-muted-foreground">No {tab} events in this category.</p>
            </div>
          ) : (
            <>
              {/* Featured hero */}
              {featured && (
                <Link to={`/events/${featured.id}`} className="group block relative h-[420px] rounded-2xl overflow-hidden border border-border">
                  <img
                    src={eventCover(featured.type, featured.cover_image_url)}
                    alt={featured.title}
                    className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-end text-white">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className="bg-primary text-primary-foreground border-none">Featured</Badge>
                      <Badge variant="outline" className="text-white border-white/40 bg-black/20">{EVENT_TYPE_LABEL[featured.type] || featured.type}</Badge>
                      {featured.university && (
                        <Badge variant="outline" className="text-white border-white/40 bg-black/20 gap-1">
                          <GraduationCap className="h-3 w-3" /> {featured.university}
                        </Badge>
                      )}
                    </div>
                    <h2 className="font-display text-2xl md:text-4xl font-bold mb-2 max-w-3xl">{featured.title}</h2>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-white/80 mb-4">
                      <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{new Date(featured.starts_at).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</span>
                      {featured.location && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{featured.location}</span>}
                    </div>
                    <Button variant="secondary" size="sm" className="w-fit gap-2">
                      View event <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </Link>
              )}

              {/* Grid */}
              {rest.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {rest.map((e) => (
                    <Link
                      key={e.id}
                      to={`/events/${e.id}`}
                      className="group rounded-xl overflow-hidden border border-border bg-card hover:border-primary/40 transition-all hover:-translate-y-1"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                        <img
                          src={eventCover(e.type, e.cover_image_url)}
                          alt={e.title}
                          loading="lazy"
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-background/95 text-foreground border-none">{EVENT_TYPE_LABEL[e.type] || e.type}</Badge>
                        </div>
                      </div>
                      <div className="p-5">
                        <h3 className="font-display text-lg font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">{e.title}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(e.starts_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                          {e.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{e.location}</span>}
                          {e.university && <span className="flex items-center gap-1 text-primary"><GraduationCap className="h-3.5 w-3.5" />{e.university}</span>}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
