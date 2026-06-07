import { cn } from "@/lib/utils";

export function AIScoreBadge({ score, label, size = "md" }: { score: number; label?: string; size?: "sm" | "md" | "lg" }) {
  const color = score >= 80 ? "text-emerald-600 border-emerald-500/30 bg-emerald-500/10"
    : score >= 60 ? "text-amber-600 border-amber-500/30 bg-amber-500/10"
    : "text-rose-600 border-rose-500/30 bg-rose-500/10";
  const sz = size === "lg" ? "h-16 w-16 text-xl" : size === "sm" ? "h-9 w-9 text-xs" : "h-12 w-12 text-sm";
  return (
    <div className="inline-flex items-center gap-2">
      <div className={cn("rounded-full border-2 flex items-center justify-center font-bold font-display", color, sz)}>
        {score}
      </div>
      {label && <span className="text-xs font-medium text-muted-foreground">{label}</span>}
    </div>
  );
}
