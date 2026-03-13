export function TrustedPartners() {
  const partners = [
    "University of Zambia",
    "Makerere University",
    "BongoHive",
    "University of Cape Town",
    "Ashesi University",
    "MEST Africa",
    "Kigali Innovation City",
    "CcHUB",
  ];

  return (
    <section className="py-10 border-b border-border bg-background">
      <div className="container">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-center mb-6">
          Trusted by leading African institutions
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {partners.map((name) => (
            <span
              key={name}
              className="text-sm font-medium text-muted-foreground/60 hover:text-foreground transition-colors whitespace-nowrap"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
