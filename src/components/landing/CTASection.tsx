import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="py-16 bg-primary">
      <div className="container text-center">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-primary-foreground mb-3">
          Start your LaunchPad Africa journey
        </h2>
        <p className="text-primary-foreground/70 max-w-lg mx-auto mb-8">
          Join the fastest growing community of student founders, investors, and mentors driving impact across the continent.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" variant="secondary" className="text-base px-8 h-12" asChild>
            <Link to="/register">
              Create an account <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="text-base px-8 h-12 bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            asChild
          >
            <Link to="/discover">Browse ventures</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
