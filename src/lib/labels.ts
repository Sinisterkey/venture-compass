// Friendly, non-jargon labels so non-technical users understand stages.

export const FUNDING_STAGE_LABELS: Record<string, string> = {
  pre_seed: "Just starting out",
  seed: "Early funding",
  series_a: "Growing fast",
  series_b_plus: "Scaling up",
};

export const STARTUP_MATURITY_LABELS: Record<string, string> = {
  idea: "Just an idea",
  prototype: "Building a prototype",
  mvp: "Working product",
  pilot: "Testing with real users",
  revenue: "Earning income",
};

export function fundingStageLabel(v?: string | null): string {
  if (!v) return "—";
  return FUNDING_STAGE_LABELS[v] ?? v.replace(/_/g, " ");
}

export function maturityLabel(v?: string | null): string {
  if (!v) return "—";
  return STARTUP_MATURITY_LABELS[v] ?? v;
}

// Used when a value could be either enum.
export function stageLabel(v?: string | null): string {
  if (!v) return "—";
  if (v in STARTUP_MATURITY_LABELS) return STARTUP_MATURITY_LABELS[v];
  if (v in FUNDING_STAGE_LABELS) return FUNDING_STAGE_LABELS[v];
  return v.replace(/_/g, " ");
}

export const FUNDING_STAGE_OPTIONS: { value: string; label: string }[] = [
  { value: "pre_seed", label: "Just starting out" },
  { value: "seed", label: "Early funding" },
  { value: "series_a", label: "Growing fast" },
  { value: "series_b_plus", label: "Scaling up" },
];

export const STARTUP_MATURITY_OPTIONS: { value: string; label: string }[] = [
  { value: "idea", label: "Just an idea" },
  { value: "prototype", label: "Building a prototype" },
  { value: "mvp", label: "Working product" },
  { value: "pilot", label: "Testing with real users" },
  { value: "revenue", label: "Earning income" },
];
