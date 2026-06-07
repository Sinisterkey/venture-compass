import { Sparkles, CheckCircle2, AlertTriangle, Lightbulb } from "lucide-react";
import { AIScoreBadge } from "@/components/AIScoreBadge";

interface Props {
  title: string;
  description?: string;
  score?: number | null;
  scoreLabel?: string;
  strengths?: string[] | null;
  weaknesses?: string[] | null;
  suggestions?: string[] | null;
}

export function AIInsightCard({ title, description, score, scoreLabel, strengths, weaknesses, suggestions }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> {title}
          </h3>
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </div>
        {typeof score === "number" && <AIScoreBadge score={score} label={scoreLabel} />}
      </div>

      {strengths && strengths.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-emerald-600 mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" /> Strengths
          </p>
          <ul className="space-y-1">
            {strengths.map((s, i) => (
              <li key={i} className="text-sm text-foreground flex gap-2"><span className="text-emerald-600">·</span>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {weaknesses && weaknesses.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-amber-600 mb-2 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" /> Areas to improve
          </p>
          <ul className="space-y-1">
            {weaknesses.map((s, i) => (
              <li key={i} className="text-sm text-foreground flex gap-2"><span className="text-amber-600">·</span>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {suggestions && suggestions.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-primary mb-2 flex items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5" /> Suggestions
          </p>
          <ul className="space-y-1">
            {suggestions.map((s, i) => (
              <li key={i} className="text-sm text-foreground flex gap-2"><span className="text-primary">·</span>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
