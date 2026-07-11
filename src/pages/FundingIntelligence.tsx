import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AIScoreBadge } from "@/components/AIScoreBadge";
import { toast } from "@/hooks/use-toast";
import { Loader2, ExternalLink, Bookmark, BookmarkCheck, X } from "lucide-react";
import { MagnifyingGlass, Sparkle, Compass, Buildings, Target, CalendarBlank, DownloadSimple } from "@phosphor-icons/react";
import { Link, Navigate } from "react-router-dom";

type Org = { id: string; name: string; sector: string | null; country: string | null };
type Match = {
  id: string;
  score: number;
  reasons: string[];
  gaps: string[];
  is_saved: boolean;
  is_dismissed: boolean;
  computed_at: string;
  opportunity: {
    id: string; funder: string; title: string; summary: string | null; url: string | null;
    min_amount: number | null; max_amount: number | null; currency: string | null;
    deadline: string | null; sectors: string[]; countries: string[]; sdgs: number[];
  };
};

export default function FundingIntelligence() {
  const { user, loading } = useAuth();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [orgId, setOrgId] = useState<string>("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [busy, setBusy] = useState(false);
  const [running, setRunning] = useState(false);
  const [ingesting, setIngesting] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("organizations").select("id,name,sector,country").eq("owner_id", user.id).then(({ data }) => {
      setOrgs(data ?? []);
      if (data?.length && !orgId) setOrgId(data[0].id);
    });
  }, [user]);

  useEffect(() => {
    if (!orgId) return;
    loadMatches();
  }, [orgId]);

  async function loadMatches() {
    setBusy(true);
    const { data } = await supabase
      .from("funding_matches")
      .select("*, opportunity:funding_opportunities(*)")
      .eq("organization_id", orgId)
      .order("score", { ascending: false });
    setMatches((data as any) ?? []);
    setBusy(false);
  }

  async function discover() {
    if (!orgId) return;
    setRunning(true);
    const { error } = await supabase.functions.invoke("ai-discover-funders", { body: { organization_id: orgId } });
    setRunning(false);
    if (error) return toast({ title: "Discovery failed", description: error.message, variant: "destructive" });
    toast({ title: "New matches ready", description: "AI has scored the top funders for this organization." });
    loadMatches();
  }

  async function toggleSave(m: Match) {
    await supabase.from("funding_matches").update({ is_saved: !m.is_saved }).eq("id", m.id);
    loadMatches();
  }
  async function dismiss(m: Match) {
    await supabase.from("funding_matches").update({ is_dismissed: true }).eq("id", m.id);
    loadMatches();
  }
  async function refreshSources() {
    setIngesting(true);
    const { data, error } = await supabase.functions.invoke("ingest-funding-sources");
    setIngesting(false);
    if (error) return toast({ title: "Refresh failed", description: error.message, variant: "destructive" });
    toast({ title: "Live sources refreshed", description: `Added ${data?.inserted ?? 0}, updated ${data?.updated ?? 0} opportunities from ReliefWeb.` });
  }

  if (loading) return <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;

  const visible = matches.filter((m) => !m.is_dismissed);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container py-10 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-primary mb-2">
              <Compass weight="duotone" className="h-4 w-4" /> Funding Intelligence
            </div>
            <h1 className="font-display text-4xl font-bold">Live funding matches for your organization</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              We continuously scan verified funders (USAID, Gates, GIZ, EU, World Bank, Mastercard Foundation, UN OCHA ReliefWeb and more) and score every opportunity against your organization's mission, sector, SDGs and country.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Select value={orgId} onValueChange={setOrgId}>
              <SelectTrigger className="min-w-[220px]"><SelectValue placeholder="Choose an organization" /></SelectTrigger>
              <SelectContent>
                {orgs.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={refreshSources} disabled={ingesting} className="gap-2">
              {ingesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <DownloadSimple weight="duotone" className="h-4 w-4" />}
              {ingesting ? "Fetching…" : "Refresh live sources"}
            </Button>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={async () => {
                if (!orgId) return;
                setRunning(true);

                // 1) Clear the user-facing scored results for this org
                const { error: clearMatchesErr } = await supabase.functions.invoke(
                  "clear-funding-results",
                  { body: { organization_id: orgId } },
                );

                // 2) Clear opportunities across all sources so a new AI scan cannot reuse the same dataset
                if (!clearMatchesErr) {
                  const { error: clearOppsErr } = await supabase.functions.invoke(
                    "clear-funding-opportunities",
                    { body: { confirm: true } },
                  );
                  if (clearOppsErr) {
                    setRunning(false);
                    return toast({ title: "Clear failed", description: clearOppsErr.message, variant: "destructive" });
                  }
                } else {
                  setRunning(false);
                  return toast({ title: "Clear failed", description: clearMatchesErr.message, variant: "destructive" });
                }

                setRunning(false);
                toast({ title: "Cleared", description: "Removed matches for this org and cleared all funding opportunities." });
                loadMatches();
              }} disabled={!orgId || running} className="gap-2">
                <X className="h-4 w-4" /> Clear + reset
              </Button>

              <Button onClick={discover} disabled={!orgId || running} className="gap-2">
                {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <MagnifyingGlass weight="duotone" className="h-4 w-4" />}
                {running ? "Scanning…" : "Run AI Scan"}
              </Button>

            </div>

          </div>
        </div>

        {orgs.length === 0 && (
          <Card className="p-10 text-center">
            <Buildings weight="duotone" className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="font-semibold mb-2">You don't have an organization yet</p>
            <p className="text-sm text-muted-foreground mb-4">Create one so we can start matching you with funders.</p>
            <Button asChild><Link to="/create-organization">Create organization</Link></Button>
          </Card>
        )}

        {orgs.length > 0 && visible.length === 0 && !busy && (
          <Card className="p-10 text-center border-dashed">
            <Target weight="duotone" className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="font-semibold mb-2">No matches computed yet</p>
            <p className="text-sm text-muted-foreground mb-4">Click <b>Run AI Scan</b> to score your organization against the funder database.</p>
          </Card>
        )}

        <div className="grid gap-4">
          {visible.map((m) => (
            <Card key={m.id} className="p-6 hover:border-primary/40 transition-colors">
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                <div className="flex-shrink-0"><AIScoreBadge score={m.score} label="fit" size="lg" /></div>
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold tracking-wider uppercase text-primary">{m.opportunity.funder}</div>
                      <h3 className="font-display text-xl font-bold leading-tight">{m.opportunity.title}</h3>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => toggleSave(m)} className="gap-1">
                        {m.is_saved ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
                        {m.is_saved ? "Saved" : "Save"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => dismiss(m)} className="gap-1 text-muted-foreground">
                        <X className="h-4 w-4" /> Dismiss
                      </Button>
                    </div>
                  </div>
                  {m.opportunity.summary && <p className="text-sm text-muted-foreground">{m.opportunity.summary}</p>}
                  <div className="flex flex-wrap gap-2 text-xs">
                    {m.opportunity.min_amount && m.opportunity.max_amount && (
                      <Badge variant="secondary">{m.opportunity.currency ?? "USD"} {m.opportunity.min_amount.toLocaleString()}–{m.opportunity.max_amount.toLocaleString()}</Badge>
                    )}
                    {m.opportunity.deadline && (
                      <Badge variant="outline" className="gap-1"><CalendarBlank weight="duotone" className="h-3 w-3" /> Deadline {new Date(m.opportunity.deadline).toLocaleDateString()}</Badge>
                    )}
                    {m.opportunity.sectors?.slice(0, 4).map((s) => <Badge key={s} variant="outline">{s}</Badge>)}
                  </div>
                  {m.reasons?.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-1">Why this fits</div>
                      <ul className="text-sm space-y-1">
                        {m.reasons.slice(0, 5).map((r, i) => <li key={i} className="flex gap-2"><span className="text-emerald-600">✓</span>{r}</li>)}
                      </ul>
                    </div>
                  )}
                  {m.gaps?.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-amber-700 mb-1">Strengthen before applying</div>
                      <ul className="text-sm space-y-1">
                        {m.gaps.slice(0, 4).map((g, i) => <li key={i} className="flex gap-2"><span className="text-amber-600">!</span>{g}</li>)}
                      </ul>
                    </div>
                  )}
                  {(() => {
                    const normalizeUrl = (raw: string | null | undefined) => {
                      if (!raw) return null;
                      const s = String(raw).trim();
                      if (!s) return null;
                      // If someone stored a URL without scheme (e.g. "www.example.com"), add https://
                      if (/^www\./i.test(s)) return `https://${s}`;
                      if (!/^https?:\/\//i.test(s)) return `https://${s}`;
                      return s;
                    };

                    const raw = m.opportunity.url;
                    const normalized = normalizeUrl(raw);
                    if (!normalized) return null;

                    try {
                      const u = new URL(normalized);
                      // Be permissive: some sources may use / as a redirect landing page.
                      if (!u.hostname) return null;
                      return (
                        <div className="pt-2">
                          <Button variant="outline" size="sm" asChild className="gap-2">
                            <a href={u.toString()} target="_blank" rel="noreferrer">
                              Open funding call <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        </div>
                      );
                    } catch {
                      return null;
                    }
                  })()}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
