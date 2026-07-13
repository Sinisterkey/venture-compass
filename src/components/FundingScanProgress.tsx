import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export type ScanStep = {
  key: string;
  label: string;
  status: "pending" | "running" | "done" | "error";
  source?: string;
};

export function FundingScanProgress({
  visible,
  steps,
  resultSubtitle,
}: {
  visible: boolean;
  steps: ScanStep[];
  resultSubtitle?: string;
}) {
  const [local, setLocal] = useState(steps);

  useEffect(() => {
    setLocal(steps);
  }, [steps]);

  const { percent, current } = useMemo(() => {
    if (!local.length) return { percent: 0, current: null as ScanStep | null };
    const doneCount = local.filter((s) => s.status === "done").length;
    const running = local.find((s) => s.status === "running") ?? null;
    const percent = Math.round((doneCount / local.length) * 80 + (running ? 10 : 0));
    return { percent: Math.min(95, Math.max(5, percent)), current: running };
  }, [local]);

  if (!visible) return null;

  return (
    <Card className="p-4 md:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <h2 className="font-display font-semibold">AI Scan running</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {resultSubtitle ?? "Streaming progress while we ingest + score opportunities."}
          </p>
        </div>
        {current?.source ? <Badge variant="secondary" className="whitespace-nowrap">Source: {current.source}</Badge> : null}
      </div>

      <div className="mt-4">
        <Progress value={percent} />
        <div className="mt-3 grid gap-2">
          {local.map((s) => (
            <div key={s.key} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={cn(
                    "inline-flex h-2.5 w-2.5 rounded-full",
                    s.status === "done" && "bg-emerald-500",
                    s.status === "running" && "bg-primary",
                    s.status === "error" && "bg-destructive",
                    s.status === "pending" && "bg-muted-foreground/40",
                  )}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{s.label}</p>
                  {s.source ? <p className="text-xs text-muted-foreground truncate">{s.source}</p> : null}
                </div>
              </div>
              <Badge
                variant={
                  s.status === "done"
                    ? "default"
                    : s.status === "running"
                      ? "secondary"
                      : s.status === "error"
                        ? "destructive"
                        : "outline"
                }
                className="text-[11px]"
              >
                {s.status}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

