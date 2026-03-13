import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { TrustedPartners } from "@/components/landing/TrustedPartners";
import { StatsSection } from "@/components/landing/StatsSection";
import { FeaturedStartups } from "@/components/landing/FeaturedStartups";
import { FeaturedInvestors } from "@/components/landing/FeaturedInvestors";
import { UniversitySpotlight } from "@/components/landing/UniversitySpotlight";
import { CTASection } from "@/components/landing/CTASection";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <TrustedPartners />
        <StatsSection />
        <FeaturedStartups />
        <FeaturedInvestors />
        <UniversitySpotlight />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
