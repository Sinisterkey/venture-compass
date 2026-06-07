import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { safeErrorMessage } from "@/lib/errors";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  organizationId?: string | null;
  recipientId: string;
  recipientLabel: string;
}

export function SendMessageDialog({ open, onOpenChange, organizationId, recipientId, recipientLabel }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!user || !body.trim()) return;
    setSending(true);
    const { error } = await supabase.from("org_messages").insert({
      organization_id: organizationId ?? null,
      sender_id: user.id,
      recipient_id: recipientId,
      subject: subject.trim() || null,
      body: body.trim(),
    });
    setSending(false);
    if (error) {
      toast({ title: "Could not send", description: safeErrorMessage(error), variant: "destructive" });
    } else {
      toast({ title: "Message sent", description: `Delivered to ${recipientLabel}.` });
      setSubject(""); setBody("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Message {recipientLabel}</DialogTitle>
          <DialogDescription>Direct message. They'll get notified instantly.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Subject (optional)</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value.slice(0, 120))} placeholder="What's this about?" className="mt-1.5" />
          </div>
          <div>
            <Label>Message</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value.slice(0, 1500))} rows={5} placeholder="Write your message..." className="mt-1.5" />
            <p className="text-xs text-muted-foreground mt-1">{body.length}/1500</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={send} disabled={!body.trim() || sending}>{sending ? "Sending..." : "Send"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
