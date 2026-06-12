export interface GrantSection {
  key: string;
  title: string;
  guidance: string;
  wordLimit: number;
}

export interface GrantTemplate {
  key: string;
  funder: string;
  name: string;
  description: string;
  averageGrant: string;
  sections: GrantSection[];
}

export const GRANT_TEMPLATES: GrantTemplate[] = [
  {
    key: "usaid",
    funder: "USAID",
    name: "USAID Development Grants Program",
    description: "Concept paper for USAID development grants supporting US and non-US NGOs delivering measurable development outcomes.",
    averageGrant: "$100K – $2M",
    sections: [
      { key: "summary", title: "Executive Summary", guidance: "1-page overview of the project, target beneficiaries, expected outcomes, total budget, and duration.", wordLimit: 250 },
      { key: "problem", title: "Problem Statement", guidance: "The development problem you address, with evidence, scale, and why USAID priorities align.", wordLimit: 400 },
      { key: "approach", title: "Technical Approach", guidance: "Activities, methods, and theory of change. How interventions will produce outcomes.", wordLimit: 600 },
      { key: "results", title: "Expected Results & Indicators", guidance: "SMART outcomes with measurable indicators, targets, and disaggregation (gender, age).", wordLimit: 300 },
      { key: "capacity", title: "Organizational Capacity", guidance: "Past performance, key staff, financial systems, and ability to manage USAID funds.", wordLimit: 300 },
      { key: "sustainability", title: "Sustainability Plan", guidance: "How results will continue after USAID funding ends.", wordLimit: 200 },
    ],
  },
  {
    key: "giz",
    funder: "GIZ (German Development Cooperation)",
    name: "GIZ Project Funding Application",
    description: "Standard GIZ partnership application focused on capacity building, governance, and sustainable economic development.",
    averageGrant: "€50K – €500K",
    sections: [
      { key: "context", title: "Country & Sector Context", guidance: "Political, economic and sector situation. Link to BMZ / German cooperation priorities.", wordLimit: 350 },
      { key: "objective", title: "Project Objective", guidance: "Overall objective and 2-4 specific outcomes. Link to SDGs.", wordLimit: 250 },
      { key: "activities", title: "Activities & Work Plan", guidance: "Bullet list of main activities, phased over the project period with milestones.", wordLimit: 500 },
      { key: "partners", title: "Partner Structure", guidance: "Implementing partners, government counterparts, target groups. Roles and responsibilities.", wordLimit: 250 },
      { key: "monitoring", title: "Monitoring & Evaluation", guidance: "Indicators, baseline, data sources, reporting cycle.", wordLimit: 250 },
      { key: "risk", title: "Risk Analysis", guidance: "Top 3-5 risks with mitigation measures.", wordLimit: 200 },
    ],
  },
  {
    key: "gates",
    funder: "Bill & Melinda Gates Foundation",
    name: "Gates Foundation Letter of Inquiry",
    description: "2-page LOI for Gates Foundation strategic initiatives in health, agriculture, education, and gender equality.",
    averageGrant: "$200K – $5M",
    sections: [
      { key: "summary", title: "Project Summary", guidance: "What you propose, who benefits, the change you expect, total funding requested.", wordLimit: 200 },
      { key: "evidence", title: "Evidence & Innovation", guidance: "What evidence supports the approach? What is innovative or catalytic about it?", wordLimit: 350 },
      { key: "outcomes", title: "Measurable Outcomes", guidance: "Specific numeric outcomes within the grant period and how they will be measured.", wordLimit: 250 },
      { key: "team", title: "Team & Track Record", guidance: "Leadership, partners, prior results that prove capacity to deliver.", wordLimit: 250 },
      { key: "budget", title: "Budget Justification", guidance: "Headline budget categories and rationale. Total amount.", wordLimit: 200 },
    ],
  },
  {
    key: "eu",
    funder: "European Union (EuropeAid / NDICI)",
    name: "EU Concept Note",
    description: "EU concept note for NDICI-Global Europe calls focused on human development, governance, and green transition.",
    averageGrant: "€500K – €5M",
    sections: [
      { key: "relevance", title: "Relevance of the Action", guidance: "How the action addresses the call priorities, needs, and EU strategy in the country.", wordLimit: 500 },
      { key: "description", title: "Description & Effectiveness", guidance: "Specific objective, expected results, main activities, target groups.", wordLimit: 600 },
      { key: "sustainability", title: "Sustainability", guidance: "Financial, institutional, environmental, and policy-level sustainability.", wordLimit: 300 },
      { key: "logframe", title: "Logical Framework Summary", guidance: "Overall objective → specific objectives → outputs → activities, with indicators.", wordLimit: 400 },
      { key: "capacity", title: "Operational & Financial Capacity", guidance: "Annual budget, staff numbers, past EU-funded projects if any.", wordLimit: 250 },
    ],
  },
];

export function getTemplate(key: string) {
  return GRANT_TEMPLATES.find((t) => t.key === key);
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
