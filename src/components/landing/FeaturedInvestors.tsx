import { Badge } from "@/components/ui/badge";

const MOCK_INVESTORS = [
  { name: "Venture Capital Partners", focus: "FinTech, AgriTech", type: "VC Fund", avatar: "🏛️" },
  { name: "Amara Osei", focus: "CleanTech, HealthTech", type: "Angel Investor", avatar: "👤" },
  { name: "Pan-African Growth Fund", focus: "Series A, B", type: "Growth Fund", avatar: "📈" },
  { name: "Kwame Asante", focus: "EdTech, AI/ML", type: "Angel Investor", avatar: "👤" },
  { name: "Sahara Ventures", focus: "Logistics, E-commerce", type: "VC Fund", avatar: "🏛️" },
  { name: "Dr. Fatima Diallo", focus: "HealthTech, BioTech", type: "Angel Investor", avatar: "👤" },
];

export function FeaturedInvestors() {
  return (
    <section className="py-20 bg-muted/50">
      <div className="container">
        <div className="text-center mb-12">
          <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">Featured Investors</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            Capital ready to deploy
          </h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Connect with investors actively seeking innovative African startups
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {MOCK_INVESTORS.map((investor) => (
            <div
              key={investor.name}
              className="flex items-center gap-4 p-5 rounded-xl border border-border bg-card hover:shadow-md transition-shadow"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-2xl shrink-0">
                {investor.avatar}
              </div>
              <div className="min-w-0">
                <h3 className="font-display font-semibold text-sm text-card-foreground truncate">{investor.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{investor.focus}</p>
                <Badge variant="outline" className="mt-2 text-xs">{investor.type}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
