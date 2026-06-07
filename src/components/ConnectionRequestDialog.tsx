import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { safeErrorMessage } from "@/lib/errors";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  organizationId: string;
  recipientId: string;
  direction: "ngo_to_investor" | "investor_to_ngo";
  organizationName: string;
}

export function ConnectionRequestDialog({ open, onOpenChange, organizationId, recipientId, direction, organizationName }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!user) return;
    setSending(true);
    const { error } = await supabase.from("connection_requests").insert({
      organization_id: organizationId,
      initiator_id: user.id,
      recipient_id: recipientId,
      direction,
      message: message.trim() || null,
    });
    setSending(false);
    if (error) toast({ title: "Could not send", description: safeErrorMessage(error), variant: "destructive" });
    else {
      toast({ title: "Request sent", description: `Your connection request was delivered.` });
      setMessage("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect with {organizationName}</DialogTitle>
          <DialogDescription>
            {direction === "investor_to_ngo"
              ? "Express your interest. The NGO will be notified and can accept to unlock protected information."
              : "Send a connection request to this funder. They will be notified and can accept to open a conversation."}
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
          rows={5}
          placeholder="Introduce yourself and explain why you'd like to connect..."
        />
        <p className="text-xs text-muted-foreground">{message.length}/1000</p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={send} disabled={sending}>{sending ? "Sending..." : "Send request"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
