# TODO — Enforce one NGO organization per user (remove duplicate org creation)

## Plan (high level)
1. Add frontend guard to block creating a second organization for an NGO user.
2. Update dashboard/quick links to stop routing to `/create-organization` when an org already exists.
3. Update demo seeding to create only one organization for the NGO demo user.
4. (Optional) Add DB uniqueness constraint on `organizations.owner_id`.
5. Sanity-check compilation (TypeScript) and run tests/lint.

## Progress
- [x] Step 1: Update `src/pages/CreateOrganization.tsx`
- [x] Step 2: Update `src/pages/Dashboard.tsx`
- [x] Step 3: Update `supabase/functions/seed-demo-accounts/index.ts`
- [ ] Step 4 (optional): DB constraint
- [ ] Step 5: Build/lint/test

