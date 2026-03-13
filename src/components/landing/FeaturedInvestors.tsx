import { Badge } from "@/components/ui/badge";

const MOCK_INVESTORS = [
  { name: "Venture Capital Partners", focus: "FinTech, AgriTech", type: "VC Fund", initials: "VC" },
  { name: "Amara Osei", focus: "CleanTech, HealthTech", type: "Angel", initials: "AO" },
  { name: "Pan-African Growth Fund", focus: "Series A, B", type: "Growth Fund", initials: "PG" },
  { name: "Kwame Asante", focus: "EdTech, AI/ML", type: "Angel", initials: "KA" },
  { name: "Sahara Ventures", focus: "Logistics, E-commerce", type: "VC Fund", initials: "SV" },
  { name: "Dr. Fatima Diallo", focus: "HealthTech, BioTech", type: "Angel", initials: "FD" },
];

export function FeaturedInvestors() {
  return (
    <section className="py-16 bg-muted/40">
      <div className="container">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
          Active investors
        </h2>
        <p className="text-muted-foreground text-sm mb-8">
          Capital ready to deploy into African innovation
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_INVESTORS.map((investor) => (
            <div
              key={investor.name}
              className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-sm font-semibold shrink-0">
                {investor.initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm text-foreground truncate">{investor.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{investor.focus}</p>
              </div>
              <Badge variant="outline" className="text-xs shrink-0">{investor.type}</Badge>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
