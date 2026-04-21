import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { TrustedPartners } from "@/components/landing/TrustedPartners";
import { StatsSection } from "@/components/landing/StatsSection";
import { FeaturedStartups } from "@/components/landing/FeaturedStartups";
import { FeaturedInvestors } from "@/components/landing/FeaturedInvestors";
import { UniversitySpotlight } from "@/components/landing/UniversitySpotlight";
import { CTASection } from "@/components/landing/CTASection";
import { OnboardingTour } from "@/components/OnboardingTour";

const sectionAnim = "animate-fade-in";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <div className={sectionAnim} style={{ animationDelay: "100ms", animationFillMode: "backwards" }}>
          <TrustedPartners />
        </div>
        <div className={sectionAnim} style={{ animationDelay: "150ms", animationFillMode: "backwards" }}>
          <StatsSection />
        </div>
        <div className={sectionAnim} style={{ animationDelay: "200ms", animationFillMode: "backwards" }}>
          <FeaturedStartups />
        </div>
        <div className={sectionAnim} style={{ animationDelay: "250ms", animationFillMode: "backwards" }}>
          <FeaturedInvestors />
        </div>
        <div className={sectionAnim} style={{ animationDelay: "300ms", animationFillMode: "backwards" }}>
          <UniversitySpotlight />
        </div>
        <div className={sectionAnim} style={{ animationDelay: "350ms", animationFillMode: "backwards" }}>
          <CTASection />
        </div>
      </main>
      <Footer />
      <OnboardingTour />
    </div>
  );
};

export default Index;
