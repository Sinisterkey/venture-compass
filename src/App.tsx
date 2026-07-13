import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import Index from "./pages/Index";
import Discover from "./pages/Discover";
import Investors from "./pages/Investors";
import About from "./pages/About";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import CreateOrganization from "./pages/CreateOrganization";
import OrganizationDetail from "./pages/OrganizationDetail";
import InvestorDetail from "./pages/InvestorDetail";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding";
import Proposals from "./pages/Proposals";
import ProposalEditor from "./pages/ProposalEditor";
import FundingIntelligence from "./pages/FundingIntelligence";
import OAuthConsent from "./pages/OAuthConsent";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CurrencyProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/investors" element={<Investors />} />
              <Route path="/investors/:id" element={<InvestorDetail />} />
              <Route path="/organizations/:id" element={<OrganizationDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/create-organization" element={<CreateOrganization />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/proposals" element={<Proposals />} />
              <Route path="/proposals/:id" element={<ProposalEditor />} />
              <Route path="/funding-intelligence" element={<FundingIntelligence />} />
              <Route path="/funding-intelligence/" element={<FundingIntelligence />} />

              <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </CurrencyProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
