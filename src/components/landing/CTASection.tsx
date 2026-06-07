import { Link } from "react-router-dom";
import { ArrowRight, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export function CTASection() {
  const { user, loading } = useAuth();
  const isLoggedIn = !loading && !!user;

  return (
    <section className="py-16 bg-primary">
      <div className="container text-center">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-primary-foreground mb-3">
          {isLoggedIn ? "Welcome back" : "Build trust. Find funding. Drive impact."}
        </h2>
        <p className="text-primary-foreground/70 max-w-lg mx-auto mb-8">
          {isLoggedIn ? "Jump back into your dashboard." : "Join the AI-powered ecosystem connecting Africa's most impactful organizations with the funders who care."}
        </p>
        {!loading && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isLoggedIn ? (
              <Button size="lg" variant="secondary" className="text-base px-8 h-12" asChild>
                <Link to="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> Go to dashboard</Link>
              </Button>
            ) : (
              <Button size="lg" variant="secondary" className="text-base px-8 h-12" asChild>
                <Link to="/register">Create an account <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            )}
            <Button size="lg" variant="outline" className="text-base px-8 h-12 bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" asChild>
              <Link to="/discover">Browse organizations</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
