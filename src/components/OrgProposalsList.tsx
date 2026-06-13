import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getTemplate } from "@/lib/grantTemplates";
import { exportProposalPDF } from "@/lib/exportProposal";
import { FileText, FileDown, Eye, EyeOff, Pencil } from "lucide-react";

interface Props {
  organizationId: string;
  organizationName: string;
  isOwner: boolean;
}

export function OrgProposalsList({ organizationId, organizationName, isOwner }: Props) {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [viewing, setViewing] = useState<any>(null);

  const load = async () => {
    const q = supabase.from("proposals").select("*").eq("organization_id", organizationId).order("published_at", { ascending: false });
    const { data } = isOwner ? await q : await q.eq("is_published", true);
    setItems(data || []);
  };

  useEffect(() => { load(); }, [organizationId, isOwner]);

  const download = (p: any) => {
    const tpl = getTemplate(p.template_key);
    if (!tpl) return;
    exportProposalPDF({ title: p.title, funder_name: p.funder_name, sections: p.sections || {}, organization: { name: organizationName } }, tpl);
  };

  const unpublish = async (p: any) => {
    await supabase.from("proposals").update({ is_published: false, published_at: null, status: "draft" }).eq("id", p.id);
    toast({ title: "Unpublished" });
    load();
  };

  if (items.length === 0 && !isOwner) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-semibold flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Proposals & grant applications</h2>
        {isOwner && <Link to="/proposals" className="text-xs text-primary hover:underline">Manage →</Link>}
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">No published proposals yet. Open the Proposals page to publish one here.</p>
      ) : (
        <div className="space-y-2">
          {items.map((p) => {
            const tpl = getTemplate(p.template_key);
            return (
              <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 hover:border-primary/40 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm truncate">{p.title}</p>
                    {!p.is_published && <Badge variant="outline" className="text-[10px]">Draft</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {tpl?.funder ?? p.funder_name} · {p.total_words ?? 0} words
                    {p.published_at && <> · Published {new Date(p.published_at).toLocaleDateString()}</>}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => setViewing(p)} className="gap-1"><Eye className="h-3 w-3" /> View</Button>
                  <Button variant="outline" size="sm" onClick={() => download(p)} className="gap-1"><FileDown className="h-3 w-3" /> PDF</Button>
                  {isOwner && (
                    <>
                      <Button asChild variant="ghost" size="icon"><Link to={`/proposals/${p.id}`}><Pencil className="h-3 w-3" /></Link></Button>
                      {p.is_published && <Button variant="ghost" size="icon" onClick={() => unpublish(p)}><EyeOff className="h-3 w-3" /></Button>}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!viewing} onOpenChange={(v) => !v && setViewing(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {viewing && (() => {
            const tpl = getTemplate(viewing.template_key);
            return (
              <>
                <DialogHeader>
                  <p className="text-xs text-primary font-semibold uppercase">{tpl?.funder ?? viewing.funder_name}</p>
                  <DialogTitle>{viewing.title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-5">
                  {tpl?.sections.map((s) => (
                    <div key={s.key}>
                      <h3 className="font-display font-semibold text-sm mb-1.5">{s.title}</h3>
                      <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                        {(viewing.sections as Record<string, string>)?.[s.key]?.trim() || <em className="text-xs">No content.</em>}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end pt-2 border-t border-border">
                  <Button onClick={() => download(viewing)} className="gap-2"><FileDown className="h-4 w-4" /> Download PDF</Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
