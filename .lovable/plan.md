## Goal
Let NGOs publish a proposal they wrote (using the Proposal & Grant Writer) onto any of their organization pages so investors can read it and download it as a PDF. Add an AI-refine option so the NGO can ask the AI to improve the proposal to their own specifications before publishing.

## Changes

### 1. Database (migration)
Add publishing fields to `proposals`:
- `is_published` boolean default false
- `published_at` timestamp
- `summary` text (short blurb shown on the org page)

Update RLS so that when `is_published = true`, **any authenticated user** can read the proposal row (currently only the owner can). Owner keeps full edit/delete rights.

### 2. Proposal Editor (`src/pages/ProposalEditor.tsx`)
- Add a **"Publish to organization"** toggle in the header. When on, investors visiting that organization see the proposal.
- Add a **"Refine with AI"** button per section AND a global one. Opens a small dialog where the NGO types their own instruction (e.g. "make it more concise", "emphasise women & girls", "add stronger numbers"). The existing `ai-grant-writer` edge function is extended with an optional `instruction` field that's appended to the prompt.
- Keep existing AI draft, save, PDF/DOCX export, delete.

### 3. Organization Detail page (`src/pages/OrganizationDetail.tsx`)
Add a **"Proposals"** section visible to everyone:
- Lists all `is_published = true` proposals for this org.
- Each row shows: title, funder, word count, published date.
- Buttons: **View** (inline reader modal) and **Download PDF** (uses existing `exportProposalPDF`).
- Owner sees an "Unpublish" button inline.

### 4. Proposals dashboard (`src/pages/Proposals.tsx`)
- Show a small "Published" badge on cards that are live.
- Show which organization each proposal belongs to.

### 5. Edge function (`supabase/functions/ai-grant-writer/index.ts`)
- Accept an optional `instruction` field and a `mode: "draft" | "refine"`. In refine mode, the prompt becomes "Rewrite the existing text following the user's instruction, preserving facts". No new secrets needed (uses `LOVABLE_API_KEY` already set).

## Technical notes
- PDF download is fully client-side via existing `exportProposalPDF` — no storage bucket needed.
- Investors do NOT need a connection to view a *published* proposal (publishing is the NGO's explicit choice to make it public). Unpublished proposals stay private to the owner.
- The proposal already has `organization_id`, so the org page just queries `proposals` filtered by org id + `is_published`.

## Out of scope
- Versioning / proposal history.
- Storing a pre-generated PDF in storage (generated on demand instead).
- Investor comments on proposals.
