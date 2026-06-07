import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2, Copy } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialText?: string;
  onApply?: (improved: string) => void;
}

export function ProposalAssistantDialog({ open, onOpenChange, initialText = "", onApply }: Props) {
  const { toast } = useToast();
  const [draft, setDraft] = useState(initialText);
  const [improved, setImproved] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!draft.trim()) return;
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("ai-proposal-assist", { body: { text: draft } });
    setLoading(false);
    if (error) {
      toast({ title: "AI error", description: error.message, variant: "destructive" });
      return;
    }
    setImproved(data?.improved ?? "");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> AI Proposal Assistant</DialogTitle>
          <DialogDescription>Paste your project description. The assistant will sharpen objectives, add measurable outcomes, and improve clarity.</DialogDescription>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Your draft</p>
            <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={12} />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Improved version</p>
            <Textarea value={improved} readOnly rows={12} placeholder="Generated proposal will appear here..." className="bg-muted/30" />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          {improved && (
            <Button variant="outline" onClick={() => { navigator.clipboard.writeText(improved); toast({ title: "Copied" }); }}>
              <Copy className="h-4 w-4" /> Copy
            </Button>
          )}
          {improved && onApply && (
            <Button variant="secondary" onClick={() => { onApply(improved); onOpenChange(false); }}>Use this version</Button>
          )}
          <Button onClick={run} disabled={loading || !draft.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Improving..." : "Improve with AI"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
