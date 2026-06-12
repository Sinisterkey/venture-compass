import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImpactUpdateDialog } from "@/components/ImpactUpdateDialog";
import { Plus, Users, Wallet, Calendar, FileText, ShieldCheck } from "lucide-react";

interface Props {
  organizationId: string;
  isOwner: boolean;
}

export function ImpactLedger({ organizationId, isOwner }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("impact_updates").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false });
    setItems(data || []);
  }, [organizationId]);

  useEffect(() => { load(); }, [load]);

  const totalBeneficiaries = items.reduce((s, x) => s + (x.beneficiaries_count || 0), 0);
  const totalSpent = items.reduce((s, x) => s + (Number(x.amount_spent) || 0), 0);

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display font-semibold">Impact Ledger</h2>
            <Badge variant="outline" className="gap-1 text-[10px]"><ShieldCheck className="h-3 w-3" /> Transparent</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Verified progress reports with photos, beneficiary counts, and financial receipts.</p>
        </div>
        {isOwner && <Button size="sm" onClick={() => setOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Add update</Button>}
      </div>

      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-[10px] text-muted-foreground uppercase">Updates</p>
            <p className="font-display text-xl font-bold">{items.length}</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-[10px] text-muted-foreground uppercase">Beneficiaries</p>
            <p className="font-display text-xl font-bold">{totalBeneficiaries.toLocaleString()}</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-[10px] text-muted-foreground uppercase">Spent (USD)</p>
            <p className="font-display text-xl font-bold">${totalSpent.toLocaleString()}</p>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No updates published yet.</p>
      ) : (
        <ol className="relative border-l-2 border-border ml-2 space-y-6">
          {items.map((u) => (
            <li key={u.id} className="pl-5 relative">
              <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-primary border-2 border-card" />
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <p className="font-display font-semibold text-sm">{u.title}</p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5"><Calendar className="h-3 w-3" /> {new Date(u.created_at).toLocaleDateString()}</p>
                </div>
                {u.milestone_type && <Badge variant="secondary" className="text-[10px] capitalize">{u.milestone_type.replace(/_/g, " ")}</Badge>}
              </div>
              {u.narrative && <p className="text-sm mt-2 whitespace-pre-line leading-relaxed">{u.narrative}</p>}
              <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                {u.beneficiaries_count != null && <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {u.beneficiaries_count.toLocaleString()} beneficiaries</span>}
                {u.amount_spent != null && <span className="flex items-center gap-1"><Wallet className="h-3 w-3" /> ${Number(u.amount_spent).toLocaleString()} spent</span>}
                {(u.receipts ?? []).length > 0 && <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> {u.receipts.length} receipt(s)</span>}
              </div>
              {(u.photos ?? []).length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
                  {u.photos.map((p: string, i: number) => (
                    <a key={i} href={p} target="_blank" rel="noopener" className="aspect-square rounded-md overflow-hidden border border-border">
                      <img src={p} alt="" loading="lazy" className="h-full w-full object-cover hover:scale-105 transition-transform" />
                    </a>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ol>
      )}

      <ImpactUpdateDialog open={open} onOpenChange={setOpen} organizationId={organizationId} onSaved={load} />
    </div>
  );
}
