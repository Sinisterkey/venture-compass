import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Upload, X } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  organizationId: string;
  onSaved?: () => void;
}

const MILESTONES = ["beneficiaries_reached", "project_launched", "funds_disbursed", "training_completed", "report_published", "partnership_signed", "other"];

export function ImpactUpdateDialog({ open, onOpenChange, organizationId, onSaved }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [narrative, setNarrative] = useState("");
  const [milestone, setMilestone] = useState("beneficiaries_reached");
  const [beneficiaries, setBeneficiaries] = useState("");
  const [amount, setAmount] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [receipts, setReceipts] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (file: File, bucket: string) => {
    const path = `${user!.id}/${organizationId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) throw error;
    if (bucket === "startup-media") return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    return path; // for private bucket, store the path
  };

  const handlePhotos = async (files: FileList | null) => {
    if (!files) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) urls.push(await uploadFile(f, "startup-media"));
      setPhotos((p) => [...p, ...urls]);
    } catch (e: any) { toast({ title: "Upload failed", description: e.message, variant: "destructive" }); }
    setUploading(false);
  };

  const handleReceipts = async (files: FileList | null) => {
    if (!files) return;
    setUploading(true);
    try {
      const paths: string[] = [];
      for (const f of Array.from(files)) paths.push(await uploadFile(f, "org-documents"));
      setReceipts((p) => [...p, ...paths]);
    } catch (e: any) { toast({ title: "Upload failed", description: e.message, variant: "destructive" }); }
    setUploading(false);
  };

  const save = async () => {
    if (!user || !title) return;
    setSaving(true);
    const { error } = await supabase.from("impact_updates").insert({
      organization_id: organizationId, author_id: user.id, title, narrative,
      milestone_type: milestone,
      beneficiaries_count: beneficiaries ? parseInt(beneficiaries) : null,
      amount_spent: amount ? parseFloat(amount) : null,
      period_start: periodStart || null, period_end: periodEnd || null,
      photos, receipts,
    });
    setSaving(false);
    if (error) { toast({ title: "Could not save", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Impact update published" });
    setTitle(""); setNarrative(""); setBeneficiaries(""); setAmount(""); setPhotos([]); setReceipts([]);
    onOpenChange(false);
    onSaved?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Publish impact update</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Title *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="500 women trained in financial literacy" /></div>
          <div><Label>Milestone type</Label>
            <Select value={milestone} onValueChange={setMilestone}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{MILESTONES.map((m) => <SelectItem key={m} value={m}>{m.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Narrative</Label><Textarea value={narrative} onChange={(e) => setNarrative(e.target.value)} rows={4} placeholder="What was accomplished, who benefited, and what comes next..." /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Beneficiaries reached</Label><Input type="number" value={beneficiaries} onChange={(e) => setBeneficiaries(e.target.value)} /></div>
            <div><Label>Amount spent (USD)</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Period start</Label><Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} /></div>
            <div><Label>Period end</Label><Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} /></div>
          </div>
          <div>
            <Label>Photos (public)</Label>
            <Input type="file" accept="image/*" multiple onChange={(e) => handlePhotos(e.target.files)} />
            {photos.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {photos.map((u, i) => (
                  <div key={i} className="relative h-16 w-16 rounded overflow-hidden border">
                    <img src={u} alt="" className="h-full w-full object-cover" />
                    <button onClick={() => setPhotos((p) => p.filter((_, x) => x !== i))} className="absolute top-0 right-0 bg-background/80 p-0.5"><X className="h-3 w-3" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <Label>Receipts / financial docs (private)</Label>
            <Input type="file" multiple onChange={(e) => handleReceipts(e.target.files)} />
            {receipts.length > 0 && <p className="text-xs text-muted-foreground mt-1">{receipts.length} file(s) attached</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving || uploading || !title}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Publish</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
