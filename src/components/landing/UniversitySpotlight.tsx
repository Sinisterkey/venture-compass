import { GraduationCap, Lightbulb, FlaskConical } from "lucide-react";

const INNOVATIONS = [
  {
    title: "Solar-Powered Water Purifier",
    university: "University of Zambia",
    student: "Grace Mulenga",
    category: "CleanTech",
    icon: Lightbulb,
  },
  {
    title: "AI Crop Disease Detector",
    university: "Makerere University",
    student: "Joseph Okello",
    category: "AgriTech",
    icon: FlaskConical,
  },
  {
    title: "Mobile Banking for the Unbanked",
    university: "University of Cape Town",
    student: "Amina Phiri",
    category: "FinTech",
    icon: Lightbulb,
  },
];

export function UniversitySpotlight() {
  return (
    <section className="py-20 bg-background">
      <div className="container">
        <div className="flex items-center gap-3 mb-3">
          <GraduationCap className="h-6 w-6 text-accent" />
          <p className="text-sm font-medium text-accent uppercase tracking-wider">University Innovation</p>
        </div>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
          From campus to market
        </h2>
        <p className="text-muted-foreground max-w-xl mb-10">
          Discover groundbreaking innovations from Africa's top universities ready for commercialization
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {INNOVATIONS.map((item) => (
            <div key={item.title} className="relative p-6 rounded-xl border border-border bg-card group hover:border-accent/40 transition-colors">
              <item.icon className="h-8 w-8 text-accent mb-4" />
              <h3 className="font-display font-semibold text-card-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{item.university}</p>
              <p className="text-xs text-muted-foreground">
                By <span className="text-foreground font-medium">{item.student}</span> · {item.category}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
