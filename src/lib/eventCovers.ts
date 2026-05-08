import hackathon from "@/assets/events/hackathon.jpg";
import demoDay from "@/assets/events/demo_day.jpg";
import fair from "@/assets/events/fair.jpg";
import competition from "@/assets/events/competition.jpg";
import pitchEvent from "@/assets/events/pitch_event.jpg";

export const EVENT_COVERS: Record<string, string> = {
  hackathon,
  demo_day: demoDay,
  fair,
  competition,
  pitch_event: pitchEvent,
};

export function eventCover(type: string, customUrl?: string | null): string {
  if (customUrl) return customUrl;
  return EVENT_COVERS[type] || pitchEvent;
}

export const EVENT_TYPE_LABEL: Record<string, string> = {
  hackathon: "Hackathon",
  demo_day: "Demo Day",
  fair: "Innovation Fair",
  competition: "Pitch Competition",
  pitch_event: "Pitch Event",
};
