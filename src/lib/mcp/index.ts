import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listFundingOpportunities from "./tools/list-funding-opportunities";
import listMyOrganizations from "./tools/list-my-organizations";
import listFundingMatches from "./tools/list-funding-matches";
import runFundingDiscovery from "./tools/discover-funders";
import searchOrganizations from "./tools/search-organizations";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "launchpad-africa-mcp",
  title: "LaunchPad Africa",
  version: "0.1.0",
  instructions:
    "Tools for LaunchPad Africa — a platform connecting African NGOs and startups with investors and funding opportunities. Use `search_organizations` and `list_funding_opportunities` to explore the public catalog, `list_my_organizations` to see the signed-in user's organizations, `list_funding_matches` to view AI-scored funder matches for one of their organizations, and `run_funding_discovery` to recompute matches.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    searchOrganizations,
    listFundingOpportunities,
    listMyOrganizations,
    listFundingMatches,
    runFundingDiscovery,
  ],
});
