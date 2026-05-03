import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { safeErrorMessage } from "@/lib/errors";

const INVESTOR_TYPES = [
  { value: "pitch_session", label: "Request Pitch Session" },
  { value: "meeting", label: "Request Meeting" },
  { value: "prototype_demo", label: "Request Prototype Demo" },
  { value: "additional_info", label: "Request Additional Information" },
  { value: "funding_interest", label: "Express Funding Interest" },
];
const MENTOR_TYPES = [
  { value: "offer_mentorship", label: "Offer Mentorship" },
  { value: "strategy_discussion", label: "Request Strategy Discussion" },
  { value: "technical_discussion", label: "Request Technical Discussion" },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  startupId: string;
  founderId: string;
  startupName: string;
}

export function RequestCollaborationDialog({ open, onOpenChange, startupId, founderId, startupName }: Props) {
  const { user, roles } = useAuth();
  const { toast } = useToast();
  const isInvestor = roles.includes("investor");
  const isMentor = roles.includes("mentor");
  const role: "investor" | "mentor" | null = isInvestor ? "investor" : isMentor ? "mentor" : null;
  const types = role === "investor" ? INVESTOR_TYPES : MENTOR_TYPES;

  const [requestType, setRequestType] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!user || !role || !requestType) return;
    setSubmitting(true);
    const { error } = await supabase.from("collaboration_requests").insert({
      startup_id: startupId,
      founder_id: founderId,
      requester_id: user.id,
      requester_role: role,
      request_type: requestType as any,
      message: message || null,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Could not send request", description: safeErrorMessage(error), variant: "destructive" });
    } else {
      toast({ title: "Collaboration request sent", description: `Sent to the ${startupName} team.` });
      setMessage("");
      setRequestType("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Collaboration</DialogTitle>
          <DialogDescription>
            Send a structured, professional request to the {startupName} team.
          </DialogDescription>
        </DialogHeader>

        {!role ? (
          <p className="text-sm text-muted-foreground">
            Only investors or mentors can initiate collaboration requests.
          </p>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>Request type</Label>
              <Select value={requestType} onValueChange={setRequestType}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select request type" /></SelectTrigger>
                <SelectContent>
                  {types.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Message (optional)</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 500))}
                placeholder="Add a short professional note (max 500 characters)..."
                rows={4}
                className="mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1">{message.length}/500</p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!role || !requestType || submitting}>
            {submitting ? "Sending..." : "Send Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
