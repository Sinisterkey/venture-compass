

# LaunchPad Africa — Pan-African Innovation Ecosystem Platform

## Phase 1: Foundation & Public Experience

### Brand & Design System
- **Colors**: Green (#16a34a) primary, Dark Navy (#0f172a) foreground, with gold (#d97706) accents for trust
- **Typography**: Clean, professional font stack (Inter)
- **Text logo**: "LaunchPad Africa" with a subtle rocket/arrow icon motif

### Landing Page (Public)
- **Hero section**: "Connecting African Innovation With Global Capital" with animated statistics counter
- **Stats bar**: Total startups, investors, mentors, countries
- **Featured Startups**: Horizontal scrolling cards with logo, name, industry, funding stage
- **Featured Investors**: Grid of investor profiles
- **University Innovation Spotlight**: Showcase section
- **CTA sections**: Join as Founder / Investor / Mentor with role-specific value propositions
- **Footer**: Links, social media, newsletter signup

### Startup Discovery Page (Public)
- Left sidebar with filters: Industry, Funding Stage, Country, Technology Category, University Projects toggle
- Main grid of startup cards showing: logo, name, industry, location, funding stage, description snippet
- Search bar with autocomplete
- Login prompt for full profile access

### Navigation
- Public nav: Home, Discover, About, Login/Register
- Sticky header with platform logo, responsive mobile menu

## Phase 2: Authentication & User Roles

### Registration System (Supabase Auth + Lovable Cloud)
- Role selection during signup: Founder (Student/Independent), Investor, Mentor, University
- Separate roles table with RLS policies (security-first approach)
- Email verification flow
- Profile completion wizard per role

### Founder Verification System
- **Student Founders**: University selection → Student ID upload → Selfie upload → Admin review queue
- **Independent Founders**: Government ID upload → Admin review
- Verified badge display on profiles ("Verified Mukuba University Student Founder")
- Verification status tracking in founder dashboard

## Phase 3: Role-Specific Dashboards

### Founder Dashboard
- **Sidebar nav**: Dashboard, My Startup, Investor Matches, Mentor Matches, Messages, Analytics, Settings
- **Home**: Profile views widget, investor interest count, mentor requests, pitch score summary, recommended investors/mentors
- **My Startup**: Full startup profile editor (name, logo, description, problem/solution, target market, industry, business model, funding stage, funding amount, pitch deck upload, demo video, product images)
- **Analytics**: Profile views chart, investor interest trends, pitch deck download count

### Investor Dashboard
- **Sidebar nav**: Dashboard, Discover Startups, Saved Startups, Investment Pipeline, Messages, Settings
- **Home**: Recommended startups, new startups feed, trends
- **Discover**: Enhanced filters with save/bookmark functionality
- **Pipeline**: Kanban-style board with stages (Interested → Meeting Scheduled → Due Diligence → Invested)

### Mentor Dashboard
- **Sidebar nav**: Dashboard, Mentor Requests, Active Mentorships, Messages, Settings
- **Requests**: Incoming mentorship requests with accept/decline actions
- **Active**: List of startups being mentored with session tracking

### University Dashboard
- **Sidebar nav**: Dashboard, Student Innovations, Research Projects, Startup Programs, Profile
- **Innovations**: Showcase student startups, final year projects, research with title, student creator, description, category

### Admin Dashboard
- **User Management**: View/edit/deactivate users by role
- **Verification Queue**: Review student IDs and founder documents with approve/reject/request-more-info actions
- **Startup Approvals**: Review and publish startup profiles
- **Platform Analytics**: User growth, startup registrations, investor activity charts

## Phase 4: AI Features & Messaging

### AI-Powered Features (via Lovable AI Gateway)
- **Pitch Deck Analyzer**: Upload PDF → AI scores 0-100 across: Problem Clarity, Market Size, Business Model, Competitive Advantage, Financial Readiness → Improvement suggestions
- **Investor Matching**: AI recommends top investors based on startup industry, stage, market, and investor focus
- **Mentor Matching**: AI recommends mentors based on startup needs and mentor expertise

### Internal Messaging System
- Direct messaging between Founders ↔ Investors and Founders ↔ Mentors
- Meeting request functionality with status tracking
- Real-time notifications using Supabase realtime
- Message thread UI similar to professional platforms

## Phase 5: Email Notifications & Polish

### Full Email Notifications
- Verification status updates
- New investor interest / meeting requests
- Mentorship request notifications
- Weekly digest: new startups, platform updates
- Welcome emails per role

### Final Polish
- Mobile-optimized responsive design throughout
- Loading states, empty states, error handling
- SEO meta tags
- Performance optimization

## Database Structure (Supabase)
- **profiles**: User profiles linked to auth.users
- **user_roles**: Role assignments (founder/investor/mentor/university/admin)
- **startups**: Full startup data with verification status
- **verification_requests**: Document uploads and review status
- **investor_profiles**: Investment focus, portfolio, preferences
- **mentor_profiles**: Expertise, availability
- **university_profiles**: University details and programs
- **messages**: Threaded messaging system
- **mentorship_requests**: Mentor-founder connections
- **investment_pipeline**: Investor deal tracking
- **startup_analytics**: View/interaction tracking

## Tech Approach
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui
- **Backend**: Supabase via Lovable Cloud (database, auth, storage, edge functions)
- **AI**: Lovable AI Gateway for pitch analysis and matching
- **Real-time**: Supabase Realtime for messaging
- **Storage**: Supabase Storage for pitch decks, IDs, media

