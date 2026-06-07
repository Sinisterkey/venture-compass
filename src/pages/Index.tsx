import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { TrustedPartners } from "@/components/landing/TrustedPartners";
import { StatsSection } from "@/components/landing/StatsSection";
import { FeaturedOrganizations } from "@/components/landing/FeaturedOrganizations";
import { FeaturedFunders } from "@/components/landing/FeaturedFunders";
import { CTASection } from "@/components/landing/CTASection";

const Index = () => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-1">
      <HeroSection />
      <TrustedPartners />
      <StatsSection />
      <FeaturedOrganizations />
      <FeaturedFunders />
      <CTASection />
    </main>
    <Footer />
  </div>
);

export default Index;
