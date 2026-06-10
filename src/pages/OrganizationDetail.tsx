import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { stageLabel, sdgLabel, SDGS } from "@/lib/labels";
import { Loader2, Building2, MapPin, Globe, Mail, Phone, Heart, Bookmark, MessageSquare, Handshake, Sparkles, ShieldCheck, Lock } from "lucide-react";
import { AIInsightCard } from "@/components/AIInsightCard";
import { AIScoreBadge } from "@/components/AIScoreBadge";
import { ConnectionRequestDialog } from "@/components/ConnectionRequestDialog";
import { SendMessageDialog } from "@/components/SendMessageDialog";
import { sectorImage } from "@/lib/sectorImages";

export default function OrganizationDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, roles } = useAuth();
  const { format } = useCurrency();
  const { toast } = useToast();
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [hasConnection, setHasConnection] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase.from("organizations").select("*").eq("id", id).maybeSingle();
      setOrg(data);
      setLoading(false);
      if (user && data) {
        // Track view (only if not owner)
        if (data.owner_id !== user.id) {
          supabase.from("org_profile_views").insert({ organization_id: id, viewer_id: user.id, owner_id: data.owner_id }).then(() => {});
        }
        const [{ data: l }, { data: b }, { data: c }] = await Promise.all([
          supabase.from("org_likes").select("id").eq("organization_id", id).eq("user_id", user.id).maybeSingle(),
          supabase.from("org_bookmarks").select("id").eq("organization_id", id).eq("user_id", user.id).maybeSingle(),
          supabase.from("connection_requests").select("status").eq("organization_id", id).or(`initiator_id.eq.${user.id},recipient_id.eq.${user.id}`).eq("status", "accepted").maybeSingle(),
        ]);
        setLiked(!!l); setSaved(!!b); setHasConnection(!!c);
      }
    })();
  }, [id, user]);

  const toggleLike = async () => {
    if (!user || !org) return;
    if (liked) {
      await supabase.from("org_likes").delete().eq("organization_id", id).eq("user_id", user.id);
      setLiked(false);
    } else {
      await supabase.from("org_likes").insert({ organization_id: id!, user_id: user.id });
      setLiked(true);
      toast({ title: "Liked" });
    }
  };

  const toggleSave = async () => {
    if (!user || !org) return;
    if (saved) {
      await supabase.from("org_bookmarks").delete().eq("organization_id", id).eq("user_id", user.id);
      setSaved(false);
    } else {
      await supabase.from("org_bookmarks").insert({ organization_id: id!, user_id: user.id });
      setSaved(true);
      toast({ title: "Saved" });
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!org) return <Navigate to="/discover" replace />;

  const isOwner = user?.id === org.owner_id;
  const isInvestor = roles.includes("investor");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="relative border-b border-border overflow-hidden">
          <img src={sectorImage(org.sector)} alt="" width={832} height={512} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-background/88 backdrop-blur-[2px]" />
          <div className="container py-10 relative">
            <div className="hidden md:block absolute right-8 top-1/2 -translate-y-1/2 h-28 w-44 rounded-xl overflow-hidden border border-border shadow-lg rotate-1">
              <img src={sectorImage(org.sector)} alt={org.sector || "Field work"} loading="lazy" width={832} height={512} className="h-full w-full object-cover" />
            </div>
            <div className="flex items-start gap-5 flex-wrap">
              <div className="h-24 w-24 rounded-xl bg-card border border-border overflow-hidden flex items-center justify-center shrink-0">
                {org.logo_url ? <img src={org.logo_url} alt="" className="h-full w-full object-cover" /> : <Building2 className="h-12 w-12 text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <h1 className="font-display text-3xl font-bold">{org.name}</h1>
                  {org.is_verified && <Badge variant="default" className="gap-1"><ShieldCheck className="h-3 w-3" /> Verified</Badge>}
                </div>
                <p className="text-muted-foreground max-w-2xl">{org.mission || org.short_description}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {org.sector && <Badge variant="secondary">{org.sector}</Badge>}
                  {org.stage && <Badge variant="outline">{stageLabel(org.stage)}</Badge>}
                  {org.country && <Badge variant="outline" className="gap-1"><MapPin className="h-3 w-3" /> {[org.province, org.country].filter(Boolean).join(", ")}</Badge>}
                </div>
              </div>
              {!isOwner && user && isInvestor && (
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={() => setConnectOpen(true)} className="gap-2"><Handshake className="h-4 w-4" /> Express Interest</Button>
                  <Button variant="outline" onClick={() => setMsgOpen(true)} className="gap-2"><MessageSquare className="h-4 w-4" /> Message</Button>
                  <Button variant="outline" size="icon" onClick={toggleLike} className={liked ? "text-rose-600" : ""}><Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} /></Button>
                  <Button variant="outline" size="icon" onClick={toggleSave} className={saved ? "text-primary" : ""}><Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} /></Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="container py-8 grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {org.short_description && (
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="font-display font-semibold mb-3">About</h2>
                <p className="text-sm leading-relaxed whitespace-pre-line">{org.short_description}</p>
              </div>
            )}

            {(org.ai_strengths?.length > 0 || org.ai_weaknesses?.length > 0 || org.ai_suggestions?.length > 0) && (
              <AIInsightCard
                title="AI Readiness Analysis"
                description="Generated by analyzing this profile against funder expectations."
                score={org.readiness_score}
                scoreLabel="Readiness"
                strengths={org.ai_strengths}
                weaknesses={isOwner ? org.ai_weaknesses : undefined}
                suggestions={isOwner ? org.ai_suggestions : undefined}
              />
            )}

            {!hasConnection && !isOwner && (
              <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
                <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium">Protected information</p>
                <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">Budget breakdowns, project plans, team details, and impact reports are visible only after the NGO accepts your connection request.</p>
              </div>
            )}

            {(org.sdgs ?? []).length > 0 && (
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="font-display font-semibold mb-3">Sustainable Development Goals</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {org.sdgs.map((n: number) => (
                    <div key={n} className="flex items-center gap-2 text-sm">
                      <div className="h-7 w-7 rounded bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{n}</div>
                      <span>{sdgLabel(n)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-4">
            {org.funding_required && (
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs text-muted-foreground">Funding required</p>
                <p className="font-display text-2xl font-bold mt-1">{format(org.funding_required)}</p>
              </div>
            )}
            {org.readiness_score !== null && (
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs text-muted-foreground mb-3">AI scores</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Readiness</span>
                    <AIScoreBadge score={org.readiness_score} size="sm" />
                  </div>
                  {org.funding_probability !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Funding chance</span>
                      <AIScoreBadge score={org.funding_probability} size="sm" />
                    </div>
                  )}
                </div>
              </div>
            )}
            {(org.website || org.email || org.phone || org.target_beneficiaries) && (
              <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                <h3 className="font-display font-semibold text-sm">Details</h3>
                {org.target_beneficiaries && <p className="text-xs"><span className="text-muted-foreground">Beneficiaries:</span> {org.target_beneficiaries}</p>}
                {org.founded_year && <p className="text-xs"><span className="text-muted-foreground">Founded:</span> {org.founded_year}</p>}
                {org.website && <a href={org.website} target="_blank" rel="noopener" className="text-xs text-primary flex items-center gap-1"><Globe className="h-3 w-3" /> {org.website}</a>}
                {org.email && hasConnection && <a href={`mailto:${org.email}`} className="text-xs text-primary flex items-center gap-1"><Mail className="h-3 w-3" /> {org.email}</a>}
                {org.phone && hasConnection && <a href={`tel:${org.phone}`} className="text-xs text-primary flex items-center gap-1"><Phone className="h-3 w-3" /> {org.phone}</a>}
              </div>
            )}
          </aside>
        </div>
      </main>
      <Footer />
      {user && !isOwner && (
        <>
          <ConnectionRequestDialog open={connectOpen} onOpenChange={setConnectOpen} organizationId={id!} recipientId={org.owner_id} direction="investor_to_ngo" organizationName={org.name} />
          <SendMessageDialog open={msgOpen} onOpenChange={setMsgOpen} organizationId={id!} recipientId={org.owner_id} recipientLabel={org.name} />
        </>
      )}
    </div>
  );
}
