
-- Showcase ventures (curated, public-facing only)
CREATE TABLE public.showcase_ventures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  industry text NOT NULL,
  description text NOT NULL,
  problem_statement text,
  solution text,
  target_market text,
  business_model text,
  location text NOT NULL,
  country text NOT NULL,
  stage text NOT NULL,
  university text,
  website text,
  logo_url text,
  funding_requested numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.showcase_ventures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Showcase ventures are viewable by everyone"
ON public.showcase_ventures FOR SELECT USING (true);

CREATE POLICY "Admins can manage showcase ventures"
ON public.showcase_ventures FOR ALL
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Showcase investors
CREATE TABLE public.showcase_investors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  investor_type text NOT NULL,
  focus text NOT NULL,
  initials text NOT NULL,
  country text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.showcase_investors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Showcase investors are viewable by everyone"
ON public.showcase_investors FOR SELECT USING (true);

CREATE POLICY "Admins can manage showcase investors"
ON public.showcase_investors FOR ALL
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Seed ventures (one per industry, plus extras)
INSERT INTO public.showcase_ventures
  (name, industry, description, problem_statement, solution, target_market, business_model, location, country, stage, university, website, funding_requested)
VALUES
  ('AgriFlow', 'AgriTech',
    'Smart irrigation systems powered by IoT sensors for smallholder farmers across sub-Saharan Africa.',
    'Smallholder farmers lose 30% of crops to inefficient water use and unpredictable rainfall.',
    'Solar-powered IoT soil sensors paired with a mobile dashboard that automates drip irrigation.',
    'Smallholder farmers in Zambia, Kenya and Uganda',
    'Hardware + SaaS subscription ($8/month per farm)',
    'Lusaka, Zambia', 'Zambia', 'Seed', 'University of Zambia', 'https://agriflow.example', 250000),
  ('FarmConnect', 'AgriTech',
    'B2B marketplace connecting smallholder farmers directly with retailers, eliminating middlemen.',
    'Farmers lose up to 40% of revenue to middlemen and post-harvest waste.',
    'Mobile-first marketplace with logistics and escrow payments.',
    'Smallholder farmers and urban retailers in Uganda',
    'Transaction commission (4%)',
    'Kampala, Uganda', 'Uganda', 'Seed', NULL, 'https://farmconnect.example', 400000),
  ('PaySwift', 'FinTech',
    'Cross-border payment infrastructure enabling instant, low-cost transactions between African countries.',
    'Sending money across African borders takes 3-5 days and costs up to 12% in fees.',
    'A unified payment API connecting mobile money operators across 14 African countries.',
    'SMEs and remittance senders in West and East Africa',
    'Transaction fee (0.8% per transfer)',
    'Lagos, Nigeria', 'Nigeria', 'Series A', NULL, 'https://payswift.example', 3000000),
  ('EduBridge', 'EdTech',
    'AI-powered adaptive learning platform tailored to African curriculum standards and local languages.',
    'Public school students lack access to personalized learning that matches local curricula.',
    'Adaptive learning engine supporting Swahili, Yoruba, Amharic and English with offline mode.',
    'Secondary school students in Kenya, Nigeria and Ethiopia',
    'B2B sales to schools + B2G partnerships',
    'Nairobi, Kenya', 'Kenya', 'Pre-Seed', 'University of Nairobi', 'https://edubridge.example', 120000),
  ('LearnAfrica', 'EdTech',
    'Offline-first mobile learning app with downloadable content for areas with limited connectivity.',
    'Half of African students cannot reliably access online learning content.',
    'Compressed offline lesson packs synced via SD cards and Bluetooth mesh.',
    'Primary and secondary students in low-connectivity regions',
    'Freemium subscription ($2/month premium)',
    'Lusaka, Zambia', 'Zambia', 'Pre-Seed', 'University of Zambia', 'https://learnafrica.example', 90000),
  ('HealthLink', 'HealthTech',
    'Telemedicine platform connecting patients in remote areas with specialist doctors across the continent.',
    'Rural patients travel 4+ hours to see a specialist; many never do.',
    'Mobile-first telemedicine with multilingual triage and digital prescriptions.',
    'Underserved patients and rural clinics in Rwanda and Burundi',
    'Per-consultation fee + clinic SaaS',
    'Kigali, Rwanda', 'Rwanda', 'Series A', NULL, 'https://healthlink.example', 1500000),
  ('MediTrack', 'HealthTech',
    'Blockchain-based pharmaceutical supply chain tracking to combat counterfeit medicines.',
    'Up to 30% of medicines in some African markets are counterfeit, causing 100k+ deaths a year.',
    'QR-code verification at point of sale with on-chain provenance.',
    'Pharmacies, hospitals and regulators in South Africa and Nigeria',
    'Per-pack verification fee + enterprise SaaS',
    'Cape Town, South Africa', 'South Africa', 'Series A', 'University of Cape Town',
    'https://meditrack.example', 2200000),
  ('SolarGrid', 'CleanTech',
    'Decentralized solar energy marketplace connecting rural communities with affordable clean power.',
    '600M Africans live without reliable electricity, blocking economic growth.',
    'Pay-as-you-go solar microgrids financed through a community ownership model.',
    'Off-grid rural households in Ghana and Côte d''Ivoire',
    'Energy-as-a-service ($5-15 / household / month)',
    'Accra, Ghana', 'Ghana', 'Seed', 'Ashesi University', 'https://solargrid.example', 800000),
  ('LogiTrack', 'Logistics',
    'Last-mile delivery optimization using AI route planning for e-commerce across East Africa.',
    'Last-mile delivery costs in African cities are 3x higher than the global average.',
    'AI-powered routing engine that aggregates riders across multiple e-commerce platforms.',
    'E-commerce sellers and logistics operators in Tanzania and Kenya',
    'SaaS + per-delivery margin',
    'Dar es Salaam, Tanzania', 'Tanzania', 'Pre-Seed', 'University of Dar es Salaam',
    'https://logitrack.example', 180000),
  ('MarketMingo', 'E-commerce',
    'Social commerce platform helping informal traders sell directly to consumers via WhatsApp and TikTok.',
    'Informal traders lack tools to manage online orders, payments and inventory.',
    'Lightweight storefront + WhatsApp Business automation + integrated mobile money.',
    'Informal retailers and micro-entrepreneurs in Nigeria and Ghana',
    'Freemium SaaS + 1.5% transaction fee',
    'Lagos, Nigeria', 'Nigeria', 'Seed', NULL, 'https://marketmingo.example', 600000),
  ('LinguaAI', 'AI/ML',
    'Open large language models fine-tuned on African languages for translation, search and voice assistants.',
    'Major LLMs perform poorly on African languages, locking 1B+ people out of modern AI tools.',
    'Open-source models for Swahili, Hausa, Amharic, Zulu and Yoruba with a hosted API.',
    'African startups, governments and research institutions',
    'API usage (per 1k tokens) + enterprise contracts',
    'Cape Town, South Africa', 'South Africa', 'Pre-Seed', 'University of Cape Town',
    'https://linguaai.example', 350000);

-- Seed investors
INSERT INTO public.showcase_investors (name, investor_type, focus, initials, country) VALUES
  ('Venture Capital Partners', 'VC Fund', 'FinTech, AgriTech', 'VC', 'Kenya'),
  ('Amara Osei', 'Angel', 'CleanTech, HealthTech', 'AO', 'Ghana'),
  ('Pan-African Growth Fund', 'Growth Fund', 'Series A, B', 'PG', 'South Africa'),
  ('Kwame Asante', 'Angel', 'EdTech, AI/ML', 'KA', 'Ghana'),
  ('Sahara Ventures', 'VC Fund', 'Logistics, E-commerce', 'SV', 'Tanzania'),
  ('Dr. Fatima Diallo', 'Angel', 'HealthTech, BioTech', 'FD', 'Senegal');
