// Friendly labels for NGO domain.

export const ORG_STAGE_LABELS: Record<string, string> = {
  idea: "Idea stage",
  early: "Early stage",
  established: "Established",
  scaling: "Scaling impact",
  mature: "Mature organization",
};

export const ORG_STAGE_OPTIONS = [
  { value: "idea", label: "Idea stage" },
  { value: "early", label: "Early stage" },
  { value: "established", label: "Established" },
  { value: "scaling", label: "Scaling impact" },
  { value: "mature", label: "Mature organization" },
];

export const SECTORS = [
  "Education", "Health", "Agriculture", "Climate & Environment",
  "Gender Equality", "Youth Empowerment", "Water & Sanitation",
  "Poverty Alleviation", "Economic Empowerment", "Human Rights",
  "Disability Inclusion", "Refugees & Migration", "Technology for Good",
];

export const BENEFICIARY_TYPES = [
  "Children", "Youth", "Women", "Elderly", "Smallholder farmers",
  "Refugees", "People with disabilities", "Rural communities",
  "Urban poor", "General public",
];

export const INVESTOR_TYPES = [
  { value: "individual", label: "Individual Philanthropist" },
  { value: "foundation", label: "Foundation" },
  { value: "grant_maker", label: "Grant Maker" },
  { value: "development_partner", label: "Development Partner" },
  { value: "corporate", label: "Corporate Donor" },
  { value: "impact_fund", label: "Impact Investment Fund" },
];

export function investorTypeLabel(v?: string | null): string {
  if (!v) return "Donor";
  return INVESTOR_TYPES.find((t) => t.value === v)?.label ?? v;
}

export function stageLabel(v?: string | null): string {
  if (!v) return "—";
  return ORG_STAGE_LABELS[v] ?? v;
}

export const SDGS = [
  { n: 1, label: "No Poverty" },
  { n: 2, label: "Zero Hunger" },
  { n: 3, label: "Good Health & Well-being" },
  { n: 4, label: "Quality Education" },
  { n: 5, label: "Gender Equality" },
  { n: 6, label: "Clean Water & Sanitation" },
  { n: 7, label: "Affordable & Clean Energy" },
  { n: 8, label: "Decent Work & Economic Growth" },
  { n: 9, label: "Industry, Innovation & Infrastructure" },
  { n: 10, label: "Reduced Inequalities" },
  { n: 11, label: "Sustainable Cities" },
  { n: 12, label: "Responsible Consumption" },
  { n: 13, label: "Climate Action" },
  { n: 14, label: "Life Below Water" },
  { n: 15, label: "Life on Land" },
  { n: 16, label: "Peace, Justice & Strong Institutions" },
  { n: 17, label: "Partnerships for the Goals" },
];

export function sdgLabel(n: number): string {
  return SDGS.find((s) => s.n === n)?.label ?? `SDG ${n}`;
}

export const COUNTRIES = [
  "Zambia", "Zimbabwe", "Malawi", "Mozambique", "Tanzania",
  "Kenya", "Uganda", "Rwanda", "Ghana", "Nigeria",
  "South Africa", "Botswana", "Namibia", "Ethiopia", "DRC",
];
