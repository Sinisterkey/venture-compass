export function StatsSection() {
  const stats = [
    { value: "250+", label: "Startups" },
    { value: "80+", label: "Investors" },
    { value: "120+", label: "Mentors" },
    { value: "15", label: "Countries" },
    { value: "30+", label: "Universities" },
  ];

  return (
    <section className="py-14 bg-muted/50">
      <div className="container">
        <div className="flex flex-wrap items-center justify-between gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center flex-1 min-w-[100px]">
              <p className="font-display text-3xl md:text-4xl font-bold text-foreground">{s.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
