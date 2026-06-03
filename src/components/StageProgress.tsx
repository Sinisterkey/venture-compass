import { STARTUP_MATURITY_OPTIONS } from "@/lib/labels";

const STAGES = STARTUP_MATURITY_OPTIONS;

export function StageProgress({ stage }: { stage?: string | null }) {
  const idx = Math.max(0, STAGES.findIndex((s) => s.value === stage));
  return (
    <div className="w-full">
      <div className="flex items-center gap-1.5">
        {STAGES.map((s, i) => {
          const reached = i <= idx;
          return (
            <div key={s.value} className="flex-1 flex items-center gap-1.5">
              <div
                className={`flex-1 h-1.5 rounded-full transition-colors ${
                  reached ? "bg-primary" : "bg-muted"
                }`}
              />
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-5 gap-1.5 mt-2">
        {STAGES.map((s, i) => (
          <div key={s.value} className="text-[10px] text-center leading-tight">
            <span className={i <= idx ? "text-foreground font-medium" : "text-muted-foreground"}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const STARTUP_STAGES = STAGES;
