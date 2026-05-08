import { useEffect, useState } from "react";
import { useParams, useNavigate, Link, Navigate } from "react-router-dom";
import { JitsiMeeting } from "@jitsi/react-sdk";
import { ArrowLeft, Calendar, Clock, FileText, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function PitchSession() {
  const { id } = useParams<{ id: string }>();
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [startup, setStartup] = useState<any>(null);
  const [joining, setJoining] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!id || !user) return;
    (async () => {
      const { data: s } = await supabase.from("pitch_sessions").select("*").eq("id", id).maybeSingle();
      setSession(s);
      if (s) {
        const { data: st } = await supabase.from("startups").select("id,name,industry,logo_url,pitch_deck_url,description,current_stage").eq("id", s.startup_id).maybeSingle();
        setStartup(st);
      }
      setLoaded(true);
    })();
  }, [id, user]);

  const openDeck = async () => {
    if (!startup?.pitch_deck_url) return;
    const { data } = await supabase.storage.from("pitch-decks").createSignedUrl(startup.pitch_deck_url, 600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
    else toast({ title: "Cannot open pitch deck", variant: "destructive" });
  };

  if (loading || !loaded) {
    return <div className="min-h-screen flex flex-col"><Navbar /><div className="container py-10"><Skeleton className="h-96 w-full" /></div></div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!session) {
    return (
      <div className="min-h-screen flex flex-col"><Navbar />
        <div className="container py-20 text-center">
          <p className="text-muted-foreground mb-4">Pitch session not found or you don't have access.</p>
          <Button asChild><Link to="/dashboard">Back to dashboard</Link></Button>
        </div>
      </div>
    );
  }

  const scheduledMs = new Date(session.scheduled_at).getTime();
  const now = Date.now();
  const minutesUntil = Math.round((scheduledMs - now) / 60000);
  const canJoin = minutesUntil <= 10; // can join 10 min before
  const isFounder = user.id === session.founder_id;

  if (joining) {
    return (
      <div className="h-screen flex flex-col bg-black">
        <div className="flex items-center justify-between px-4 py-2 bg-background border-b border-border">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setJoining(false)} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Leave
            </Button>
            <span className="text-sm font-semibold">{startup?.name} · Live Pitch Room</span>
          </div>
          <Badge variant="default">Live</Badge>
        </div>
        <div className="flex-1">
          <JitsiMeeting
            roomName={session.room_name}
            userInfo={{
              displayName: profile?.full_name || user.email || "Participant",
              email: user.email || "",
            }}
            configOverwrite={{
              prejoinPageEnabled: false,
              startWithAudioMuted: !isFounder,
              startWithVideoMuted: false,
              disableModeratorIndicator: true,
              enableEmailInStats: false,
            }}
            interfaceConfigOverwrite={{
              MOBILE_APP_PROMO: false,
              DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
              SHOW_JITSI_WATERMARK: false,
            }}
            getIFrameRef={(iframe) => { iframe.style.height = "100%"; iframe.style.width = "100%"; }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container py-8 max-w-5xl">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Button>

        <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-muted/30 p-8 mb-6">
          <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-2">Live Pitch Session</p>
          <h1 className="font-display text-3xl font-bold text-foreground mb-3">{startup?.name}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
            <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{new Date(session.scheduled_at).toLocaleString()}</span>
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{session.duration_minutes} min</span>
            <Badge variant="outline" className="capitalize">{session.status}</Badge>
          </div>

          {canJoin ? (
            <Button size="lg" onClick={() => setJoining(true)} className="gap-2">
              <Video className="h-5 w-5" /> Join Pitch Room
            </Button>
          ) : (
            <div className="rounded-lg bg-muted/60 p-4 text-sm text-foreground">
              Pitch room opens 10 minutes before the scheduled time.
              {minutesUntil > 0 && <span className="block text-muted-foreground mt-1">Starts in {minutesUntil} minute{minutesUntil === 1 ? "" : "s"}.</span>}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="font-display font-semibold mb-2">About the startup</h3>
            <p className="text-sm text-muted-foreground line-clamp-5">{startup?.description || "No description provided."}</p>
            <Button asChild variant="link" className="px-0 mt-2"><Link to={`/ventures/${startup?.id}`}>Open Pitch Room →</Link></Button>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="font-display font-semibold mb-2">Pitch materials</h3>
            <div className="space-y-2">
              {startup?.pitch_deck_url ? (
                <Button onClick={openDeck} variant="outline" className="w-full gap-2 justify-start"><FileText className="h-4 w-4" /> Open Pitch Deck</Button>
              ) : (
                <p className="text-sm text-muted-foreground">No pitch deck uploaded.</p>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-4">During the call, founders can share their screen to walk through the deck or a live demo.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
