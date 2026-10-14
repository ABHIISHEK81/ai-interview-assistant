# InterviewAI Project Progress

## Sources of Truth
1. `interviewAI_AI_Mock_Interview_Platform_Introduction.pdf` (107 pages)
2. `interviewAI_Paid_Plans_Addendum.pdf` (5 pages)

## Stage Tracker

- [x] **Stage 1 – Setup & Monorepo Bootstrap**
  - Monorepo folder layout matching PDF pp. 4–5
  - Root `package.json` with `concurrently` (`npm run install:all`, `npm run dev`)
  - Complete `backend/.env.example` and `frontend/.env.example`
  - Express backend running on port 5000 with Winston, Helmet, CORS, Rate Limit
  - `GET /api/health` operational
  - In-memory / Atlas MongoDB connection in `backend/src/config/db.js`
  - Admin seeding operational via `backend/src/scripts/seedAdmin.js`
  - React 18 + Vite 5 + Tailwind frontend running on port 5173
  - Free embedding provider switch (`EMBEDDING_PROVIDER=local` / `openai`)

- [x] **Stage 2 – Core Backend**
  - Candidate Auth: JWT access (7d) + refresh (30d), bcrypt, passwordChangedAt invalidation (`/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`, `/api/auth/me`, `/api/auth/logout`)
  - Candidate Profile & Dashboard Stats: `/api/users/profile`, `/api/users/change-password`, `/api/users/stats`
  - Resume Upload & Parsing: Multer 5MB limit, Cloudinary storage + disk fallback, `pdf-parse` text extraction (8k char cap), Groq structured JSON parsing (`ai.service.js` with `llama-3.3-70b-versatile`, temp 0.2), automatic `isDefault: true` on first upload
  - Semantic Chunking & RAG Retrieval: `chunking.service.js` section classification, `optimizer.service.js` dual-query expansion, `rag.service.js` with zero-cost local TF-IDF vectorizer + OpenAI switch, section-boosted cosine similarity ranking (skills 1.25x, experience 1.20x, etc.)
  - Interview Creation & Question Generation: `POST /api/interviews` (draft), `POST /api/interviews/:id/generate` (Groq llama-3.3-70b-versatile, temp 0.7, json mode, enforced ~2/3 technical, ~1/3 behavioral mix)
  - Live Sessions & AI Scoring: `POST /api/sessions/start`, `POST /api/sessions/:id/answer` (with question overwrite support), `POST /api/sessions/:id/complete` (Groq 1-10 per-answer evaluation + holistic 1-100 overall score synthesis + calculateOverallScore fallback)
  - Verified with 100% passing automated test script (`backend/src/scripts/testStage2.js`)

- [x] **Stage 3 – Real-time Streaming**
  - Socket.io live interview server attached directly to Express HTTP server on port 5000 (`backend/src/socket.js`)
  - Configured with CORS credentials matching `CLIENT_URL`
  - Real-time `live_answer` event handler with payload `{ questionText, answerText, expectedKeywords }`
  - Groq streaming completion with `llama-3.3-70b-versatile`, `temperature: 0.5`, `max_tokens: 150`
  - Token-by-token emission via `ai_chunk`, completion signaled via `ai_complete`, errors handled via `ai_error`
  - Database dynamic prompt loading from `SystemPrompt` (`category: 'interview'`) with fallback
  - Verified with 100% passing automated test script (`backend/src/scripts/testStage3.js`)

- [x] **Stage 4 – Jobs & Background Schedulers**
  - Adzuna live search integration with 3-failure circuit breaker and timeout handling (`backend/src/services/adzunaService.js` / alias `adzuna.service.js`)
  - Unified job search with 16-character SHA-256 query parameter hashing, Redis caching (15-min TTL, 7-day stale fallback), and MongoDB database fallback (`backend/src/services/jobSearchService.js`)
  - Database-backed job listings with keyword, location, contractType, category, salary filtering, and pinning (`backend/src/models/Job.model.js`)
  - AI resume-based recommendations matching candidate skills against active jobs with >= 50% overlap (`backend/src/services/jobMatchService.js`)
  - Quick interview question generation for job listings via Groq (`POST /api/jobs/generate-questions`)
  - Background schedulers: 3-hour job synchronization (`0 */3 * * *`, 15-sec boot run) and midnight stale listing cleanup (`0 0 * * *`, 30-sec boot run)
  - Public and authenticated routes mounted at `/api/jobs` (`backend/src/routes/job.routes.js`)
  - Verified with 100% passing automated test script (`backend/src/scripts/testStage4.js`)

- [x] **Stage 5 – Admin System**
  - Admin Authentication: `POST /api/admin/auth/login`, dedicated admin bearer JWT tokens, `protectAdmin` middleware rejecting candidate tokens with 403 Forbidden (`backend/src/middleware/adminAuth.middleware.js`)
  - Granular RBAC: 19 permissions mapped across `super_admin`, `admin`, `content_manager`, and `support` with wildcard `*` for `super_admin` (`backend/src/middleware/rbac.js`)
  - User Administration: `GET /api/admin/users`, `GET /api/admin/users/:id` with aggregate counts, `PATCH /api/admin/users/:id` (credits / role / ban status), `DELETE /api/admin/users/:id` (super_admin cascade delete), and `POST /api/admin/users/bulk` (all with protected super_admin account safeguards)
  - Content & Entity CRUD: interviews & sessions cascade deletion, resumes management, admin job posting and pinning
  - System Prompts & Governance: all 6 categories populated (`resume_parser`, `ats_scorer`, `feedback_report`, `interview`, `career_coach`, `job_recommendation`), version bumping on update, and history rollback (`POST /api/admin/prompts/:id/rollback`)
  - Reusable Interview Templates: `InterviewTemplate.model.js` with TTS voice configuration (`POST /api/admin/templates`, `GET /api/admin/templates`, `DELETE /api/admin/templates/:id`)
  - Platform Analytics: `GET /api/admin/analytics` and `GET /api/admin/stats` with user, interview, session, and job metrics
  - Scraper Control: `GET /api/admin/scraper/status` and `POST /api/admin/scraper/run`
  - Routes mounted under `/api/admin` (`backend/src/routes/admin.routes.js`)
  - Verified with 100% passing automated test script (`backend/src/scripts/testStage5.js`)

- [x] **Stage 6 – Frontend SPA**
  - Modern, dark glassmorphic design system (`Plus Jakarta Sans`, `Inter`, `JetBrains Mono`, gradient glows, custom scrollbars)
  - Isolated Zustand Auth Store (`src/store/useAuthStore.js`) maintaining decoupled Candidate JWT tokens and Admin JWT tokens with auto-refresh interceptors in `src/services/api.js`
  - Real-time Socket.io client service (`src/services/socket.js`) handling bidirectional `live_answer` and `ai_chunk` streaming
  - State store for interview progression (`src/store/useInterviewStore.js`) tracking active session, question indices, answer submissions, and scoring reports
  - Responsive Navigation Header with dynamic candidate credits pill (`2 Free Credits`), user profile selector, quick actions, and dedicated Admin portal access
  - Candidate Pages:
    - `LandingPage.jsx`: Hero, value stats, 4 Masterclass Video previews, RAG architecture visualizer, and Addendum plan pricing cards
    - `LoginPage.jsx` & `RegisterPage.jsx`: Professional glassmorphic auth cards with validation, password visibility toggles, and instant 2-credit free tier onboarding
    - `DashboardPage.jsx`: Candidate workspace with real-time credit balance, aggregate interview stats, quick action launchers, and active default resume indicator
    - `ResumeManagerPage.jsx`: PDF drag-and-drop uploader with 5MB check, Groq LLaMA 3.3 skill extraction viewer, default profile selector, and deletion controls
    - `InterviewSetupPage.jsx`: Multi-step simulation wizard for role, seniority level, question count, and resume RAG grounding
    - `LiveSessionPage.jsx`: Real-time mock interview chamber featuring question progression, text / simulated mic inputs, Socket.io token-by-token interviewer streaming, and session timer
    - `SessionReportPage.jsx`: Circular score badge (1-100), hire verdict, executive strengths, areas for improvement, and per-question score breakdown
    - `JobBoardPage.jsx`: Unified Adzuna search with 15-minute Redis caching indicator and "Instant Mock Prep for this Job" launcher
    - `VideoHubPage.jsx`: Curated Masterclass video center with interactive video modals, chapter takeaways, and one-click practice mock tests
    - `PricingPage.jsx`: Transparent Addendum tiers (Free ₹0, Basic ₹99, Medium ₹149, Advanced ₹199) with test mode checkout simulation
    - `ProfilePage.jsx`: Bio, target role editor, and secure password modification
  - Admin Governance Portal (`/admin/*`):
    - `AdminLoginPage.jsx`: Dedicated admin portal sign-in with seeded credential helpers
    - `AdminDashboardPage.jsx`: Platform analytics metrics (users, interviews, sessions, average score) and on-demand scraper sync trigger
    - `AdminUsersPage.jsx`: Candidate directory table with role switcher, credit modifier, and cascade deletion
    - `AdminPromptsPage.jsx`: System prompts manager with template editor, version incrementation, and instant rollback
    - `AdminTemplatesPage.jsx`: Reusable interview blueprint creator with voice speed and pitch configuration
  - Verified 100% clean production build (`vite build` -> 1654 modules bundled with 0 errors) and HTTP status 200 OK serving via Vite dev server.

- [x] **Stage 7 – Paid Plans & Monetization (Addendum)**
  - Auto-seeded 4 official tiers in `Plan.model.js`: Free (₹0, 2 quota), Basic (₹99, 5 quota), Medium (₹149, 10 quota), and Advanced (₹199, 20 quota)
  - `planGuard.middleware.js` enforcing minimum credit balance (blocks 0-credit candidates with HTTP 402 `INSUFFICIENT_CREDITS`)
  - Automatic credit deduction (1 credit per simulation) and auto-refund on AI generation pipeline failure in `interview.controller.js`
  - Zero-cost Stripe Test Mode integration in `billing.service.js` with checkout session creation, webhook listener, and test upgrade simulator
  - Transaction ledger in `Transaction.model.js` tracking amounts, billing cycles, stripe session IDs, and credit refills
  - Candidate billing routes mounted at `/api/billing` (`GET /plans`, `GET /status`, `POST /checkout`, `POST /webhook`, `POST /test-upgrade`, `POST /cancel`)
  - Subscription Renewal & Monthly Credit Refill scheduler in `planRenewalScheduler.js` (daily cron `0 0 * * *` with 45-second boot pass)
  - Frontend `PricingPage.jsx` integrated directly with live billing endpoints and real-time candidate balance update
  - Verified with 100% passing automated test suite (`backend/src/scripts/testStage7.js` — 27 assertions passed)

- [x] **Stage 8 – Testing & Hardening**
  - Security audit & headers verification: Helmet nosniff, SAMEORIGIN clickjacking guard, rate limiter, and `/api/health` probe
  - Zero-cost local embedding engine verified operational without requiring external paid API keys
  - Candidate Auth & Information Leakage: password hash and refresh token stripped from all responses including registration and `/api/auth/me`
  - RBAC & Permission Boundaries: Candidate bearer token strictly rejected with 403 Forbidden from admin routes; unauthenticated rejected with 401 Unauthorized
  - Express-Validator Input Hardening: malformed email addresses and weak passwords (<8 chars / missing uppercase) rejected with 400/422 Bad Request
  - Full Mock Interview Lifecycle E2E: draft creation -> RAG question generation -> credit deduction -> session start -> candidate answer submission with timing metadata -> session completion with holistic 1-100 overall score calculation
  - Monetization & Quota Security: all 4 Addendum plans discoverable, test upgrade simulator refilling 10 credits, billing status verified
  - Admin Governance & Platform Analytics: super admin authentication, platform aggregate metrics computation, and all 5 system prompt categories verified
  - Verified with 100% passing automated test suite (`backend/src/scripts/testStage8.js` — 31 assertions passed)

- [x] **Part 1 – Feature Removals (Frontend, Backend, and Database)**
  - **Smart Board Job Board / Dashboard Removed**:
    - Deleted backend files: `Job.model.js`, `job.routes.js`, `job.controller.js`, `adzunaService.js`, `adzuna.service.js`, `jobSearchService.js`, `jobMatchService.js`, `jobSyncService.js`, `jobSyncScheduler.js`, `jobCleanupService.js`, `testStage4.js`.
    - Removed `/api/jobs` mount from `app.js` and job schedulers from `server.js`.
    - Removed Job CRUD (`getAdminJobs`, `createJob`, `updateJob`, `deleteJob`) and scraper controls (`runScraper`, `getScraperStatus`) from `admin.controller.js` and `admin.routes.js`.
    - Removed `totalJobs` metric from admin analytics and `job_recommendation` category from `SystemPrompt.model.js`.
    - Deleted frontend files: `JobBoardPage.jsx`.
    - Removed `/jobs` route from `App.jsx`, Job Board navigation from `Navbar.jsx`, `Footer.jsx`, `DashboardPage.jsx`, `LandingPage.jsx`, and `SessionReportPage.jsx`.
  - **Smart Classes Video Hub Removed**:
    - Deleted frontend files: `VideoHubPage.jsx`, `VideoModal.jsx`, and thumbnail media assets.
    - Removed `/videos` route from `App.jsx`, Video Hub links from `Navbar.jsx` and `Footer.jsx`.
    - Removed entire Video Masterclass section and video modal state from `LandingPage.jsx`.
  - **AI Resume Fresher Module Removed**:
    - Verified complete absence of any fresher-specific resume builder modules in backend services and client-side views.
    - Retained core PDF upload and RAG extraction engine strictly for mock interview configuration.
  - **Verification**: Vite production bundle compiled cleanly with 0 errors (`npm run build`); `testStage8.js` completed with 31/31 passed assertions.

