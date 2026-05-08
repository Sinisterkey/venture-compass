import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { safeErrorMessage } from "@/lib/errors";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  collaborationRequestId: string;
  startupId: string;
  startupName: string;
  investorId: string;
  onScheduled?: () => void;
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30);

export function SchedulePitchSessionDialog({ open, onOpenChange, collaborationRequestId, startupId, startupName, investorId, onScheduled }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [scheduledAt, setScheduledAt] = useState("");
  const [duration, setDuration] = useState("30");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      const d = new Date(Date.now() + 24 * 3600 * 1000);
      d.setMinutes(0, 0, 0);
      setScheduledAt(d.toISOString().slice(0, 16));
    }
  }, [open]);

  const submit = async () => {
    if (!user || !scheduledAt) return;
    setSaving(true);
    const room = `launchpad-${slug(startupName)}-${Math.random().toString(36).slice(2, 8)}`;
    const { error } = await supabase.from("pitch_sessions").insert({
      collaboration_request_id: collaborationRequestId,
      startup_id: startupId,
      founder_id: user.id,
      investor_id: investorId,
      room_name: room,
      scheduled_at: new Date(scheduledAt).toISOString(),
      duration_minutes: parseInt(duration, 10),
    });
    setSaving(false);
    if (error) {
      toast({ title: "Could not schedule", description: safeErrorMessage(error), variant: "destructive" });
      return;
    }
    toast({ title: "Pitch session scheduled", description: "Both parties can join from their dashboard." });
    onOpenChange(false);
    onScheduled?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule live pitch session</DialogTitle>
          <DialogDescription>
            A private video room will be created. Both you and the investor can join with screen-share at the chosen time.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Date & time</Label>
            <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!scheduledAt || saving}>{saving ? "Scheduling..." : "Create Pitch Room"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
