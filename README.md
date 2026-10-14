# 🤖 InterviewAI — Enterprise Full-Stack AI Career Intelligence & Adaptive Mock Interview Platform

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18%2B%20%7C%2020%2B-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-4.19%2B-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js" />
  <img src="https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 18" />
  <img src="https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose%208-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/AI%20Engine-Groq%20LLaMA%203.3%2070B-F05A28?style=for-the-badge&logo=fastapi&logoColor=white" alt="Groq LLaMA" />
  <img src="https://img.shields.io/badge/RealTime-Socket.io%204.7-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.io" />
  <img src="https://img.shields.io/badge/Security-Strict%20RBAC%20Admin%20Isolation-indigo?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="Strict RBAC" />
  <img src="https://img.shields.io/badge/Tests-All%20Suites%20Passing-brightgreen?style=for-the-badge&logo=checkmarx&logoColor=white" alt="Passing Tests" />
  <img src="https://img.shields.io/badge/License-MIT-purple?style=for-the-badge" alt="License" />
</p>

---

## 📌 Executive Overview

**InterviewAI** is an enterprise-grade AI career copilot and talent assessment platform engineered to help software engineers, data scientists, and technical candidates master competitive hiring pipelines.

Built with a modern full-stack MERN (MongoDB, Express, React, Node.js) and Retrieval-Augmented Generation (RAG) architecture, InterviewAI combines ultra-fast **Groq LLaMA 3.3 70B** inference, in-process **TF-IDF vector embeddings**, real-time **Socket.io telemetry**, and browser-native **Web Speech STT/TTS** to deliver a zero-friction, production-ready candidate journey with strict administrator isolation:

1. **Resume Studio & Precision ATS Engine**: Multi-format document parser (`.pdf`, `.docx`, `.doc`), 0–100 radial ATS scoring, keyword gap radar, role alignment suggestions, and automated bullet rewrites.
2. **Interactive Mock Interview Chamber**: Bi-directional audio interview simulations with live speech recognition, real-time audio waveforms, dynamic question synthesis, integrated code editor, and adaptive difficulty scaling (Easy ⟷ Medium ⟷ Hard).
3. **Project Interrogation & Deep-Dive Defense**: Automated architectural interrogation evaluating project claims, technology trade-offs, scalability limits, and potential failure modes.
4. **Gamified Quiz Arena & Global Leaderboard**: Rapid-fire technical domain quizzes across React, Node.js, Python, and System Design with live scoring and global competitive ranking.
5. **Strict Administrator Governance Portal**: An isolated, role-protected admin command center (`/admin/login`, `/admin/dashboard`, `/admin/users`, `/admin/templates`, `/admin/prompts`). Requires verified email and password authentication; standard candidates and unauthenticated users are strictly barred.

---

## 📐 System Architecture & Data Flow

### High-Level Architectural Blueprint

```mermaid
flowchart TB
    subgraph Client["🖥️ Presentation Layer (React 18 SPA + Vite)"]
        UI["Modern Responsive UI<br/>(Tailwind CSS + Lucide Icons + Dark Theme)"]
        AudioSTT["Web Speech Recognition<br/>(Real-Time Microphone Dictation)"]
        AudioTTS["SpeechSynthesis Audio API<br/>(Voice Delivery of Interview Questions)"]
        SocketClient["Socket.io Client<br/>(Bi-directional Live Telemetry & Code Sync)"]
        ZustandStore["Zustand State Engine<br/>(Candidate Store & Isolated Admin Auth Store)"]
        AdminGate["AdminRoute Protection Guard<br/>(Verifies Role & Dedicated Admin Tokens)"]
    end

    subgraph Gateway["⚡ API Gateway & Backend Services (Node.js & Express 4.19)"]
        ExpressRouter["Express REST Router<br/>(:5000 /api)"]
        SocketServer["Socket.io Server<br/>(WebSocket Rooms & Live Feedback)"]
        AuthGuard["JWT RBAC Authentication Guard<br/>(Candidate Token & Dedicated Admin Token)"]
        RateLimiter["Express Rate Limiter<br/>(1000 req / 15 min window)"]
        DocIngestion["Multer Document Parser<br/>(PDF-Parse & Word Extraction)"]
        HealthProbe["Diagnostic Health Monitor<br/>(/api/health)"]
    end

    subgraph Intelligence["🧠 AI Intelligence, Vector Search & RAG"]
        GroqClient["Groq SDK Client<br/>(LLaMA 3.3 70B Versatile @ 300+ tok/s)"]
        RAGService["Local TF-IDF Embedding Engine<br/>(Vectorization & Cosine Similarity)"]
        ATSHeuristic["Deterministic Heuristic Scorer<br/>(Zero-Cost Fallback Engine)"]
        QuestionGen["Adaptive Question Synthesizer<br/>(Difficulty: Easy ⟷ Med ⟷ Hard)"]
    end

    subgraph Persistence["🗄️ Persistence Layer (MongoDB & Cache)"]
        MongoDB[(MongoDB Database<br/>Local In-Memory / Production Atlas)]
        UserColl["users (Candidate Profiles, Roles, Credits, 2FA)"]
        InterviewColl["interviews & sessions (Transcripts & Telemetry)"]
        ResumeColl["resumes (Parsed Vectors & ATS Scores)"]
        QuizColl["quizscores & mocktestresults (Leaderboard Data)"]
        AdminColl["systemprompts & monthlyreports (Governance Data)"]
    end

    %% Client Interactions
    UI -->|1. REST Requests (Bearer Token)| ExpressRouter
    UI -->|2. Real-Time Telemetry| SocketServer
    AudioSTT -->|Voice Input| UI
    UI -->|Audio Prompts| AudioTTS
    AdminGate -->|Verified Admin Access| ExpressRouter

    %% Gateway Routing
    ExpressRouter --> AuthGuard
    AuthGuard --> DocIngestion
    DocIngestion --> RAGService
    RAGService --> GroqClient
    GroqClient -.->|API Quota / Network Fallback| ATSHeuristic
    ExpressRouter --> QuestionGen
    QuestionGen --> GroqClient

    %% Persistence
    AuthGuard --> MongoDB
    ExpressRouter --> MongoDB
    MongoDB --> UserColl
    MongoDB --> InterviewColl
    MongoDB --> ResumeColl
    MongoDB --> QuizColl
    MongoDB --> AdminColl
```

---

## 📂 Project Directory Structure

```text
ai-interview-assistant/
│
├── frontend/                          # Client-side presentation layer (React 18 + Vite)
│   ├── public/                        # Static assets (favicons, robots.txt)
│   ├── src/
│   │   ├── components/                # Reusable UI & Security components
│   │   │   ├── AdminRoute.jsx         # Strict RBAC Guard: Requires verified admin credentials
│   │   │   ├── ProtectedRoute.jsx     # Candidate session route guard
│   │   │   ├── Navbar.jsx             # Top navigation with role-aware buttons & theme toggles
│   │   │   ├── Footer.jsx             # Platform footer with legal & product links
│   │   │   ├── HardwareProctorFeed.jsx# WebCam and microphone proctoring chamber
│   │   │   ├── MockTestModal.jsx      # Timed mock test configuration modal
│   │   │   ├── PageLoader.jsx         # Animated glassmorphism loading state
│   │   │   └── ErrorBoundary.jsx      # React production error boundary
│   │   │
│   │   ├── pages/                     # Full-page candidate views
│   │   │   ├── LandingPage.jsx        # High-conversion hero, features & interactive demo
│   │   │   ├── AuthPage.jsx           # Unified candidate sign-in / registration
│   │   │   ├── DashboardPage.jsx      # Candidate career command center & statistics
│   │   │   ├── ResumeAnalyzerPage.jsx # Multi-format ATS scoring & keyword gap studio
│   │   │   ├── ResumeManagerPage.jsx  # Resume versioning, storage & 1-click downloads
│   │   │   ├── InterviewSetupPage.jsx # Role, seniority, and question track configuration
│   │   │   ├── LiveSessionPage.jsx    # Real-time interview chamber with STT/TTS & code editor
│   │   │   ├── SessionReportPage.jsx  # Detailed post-interview scorecards & analytics
│   │   │   ├── ProjectInterrogationPage.jsx # Architectural interrogation & technical defense
│   │   │   ├── QuizCompetitionPage.jsx# Gamified rapid-fire quiz arena with leaderboard
│   │   │   ├── PricingPage.jsx        # Subscription tiers, credit packs & daily reward claims
│   │   │   ├── ProfilePage.jsx        # 5-Section profile, credentials & security settings
│   │   │   ├── TermsOfServicePage.jsx # Legal terms and conditions
│   │   │   ├── PrivacyPolicyPage.jsx  # Data privacy policy & candidate rights
│   │   │   │
│   │   │   └── admin/                 # STRICTLY ISOLATED ADMIN PORTAL
│   │   │       ├── AdminLoginPage.jsx # Dedicated admin login: Requires email & password
│   │   │       ├── AdminDashboardPage.jsx # High-level platform KPIs, revenue & traffic telemetry
│   │   │       ├── AdminUsersPage.jsx # User management, role elevation & credit grants
│   │   │       ├── AdminTemplatesPage.jsx # System interview templates & seniority matrices
│   │   │       └── AdminPromptsPage.jsx # Live prompt engineering & temperature controls
│   │   │
│   │   ├── services/                  # Network API clients
│   │   │   ├── api.js                 # Axios instance with auth interceptors & admin separation
│   │   │   └── socket.js              # Socket.io connection manager
│   │   │
│   │   ├── store/                     # Global Zustand state stores
│   │   │   ├── useAuthStore.js        # Decoupled candidate & admin authentication state
│   │   │   └── useInterviewStore.js   # Live interview session & question state
│   │   │
│   │   ├── App.jsx                    # Root route hierarchy & aliases
│   │   ├── main.jsx                   # React 18 DOM mount point
│   │   └── index.css                  # Tailored CSS custom tokens & dark SaaS theme
│   │
│   ├── .env                           # Frontend environment variables
│   ├── index.html                     # HTML5 root template
│   ├── package.json                   # Frontend dependencies & build scripts
│   ├── tailwind.config.js             # Tailwind CSS tokens & color configurations
│   └── vite.config.js                 # Vite bundler configuration & code splitting
│
├── backend/                           # Server-side REST API & AI Orchestration (Node.js + Express)
│   ├── src/
│   │   ├── config/                    # Infrastructure configuration
│   │   │   └── db.js                  # MongoDB Mongoose connection with resilient in-memory fallback
│   │   │
│   │   ├── controllers/               # Express request handlers
│   │   │   ├── auth.controller.js     # Candidate registration, JWT login, OAuth & refresh
│   │   │   ├── admin.controller.js    # Admin login, analytics, user governance & report generation
│   │   │   ├── interview.controller.js# Interview lifecycle, dynamic questions & evaluations
│   │   │   ├── resume.controller.js   # Resume upload, parsing & ATS gap calculation
│   │   │   ├── quiz.controller.js     # Quiz generation, submission & global leaderboard
│   │   │   ├── mockTest.controller.js # Timed full-length technical assessments
│   │   │   ├── session.controller.js  # Live session room management & transcripts
│   │   │   ├── billing.controller.js  # Subscription plans, checkout & credit claims
│   │   │   └── user.controller.js     # Candidate profile CRUD & password changes
│   │   │
│   │   ├── middleware/                # Express middleware layers
│   │   │   ├── auth.js                # JWT verification & strict RBAC authorization
│   │   │   └── validation.js          # Express-validator schemas & auto-synthesis fallbacks
│   │   │
│   │   ├── models/                    # Mongoose database schemas
│   │   │   ├── User.model.js          # User schema with credentials, roles & refresh tokens
│   │   │   ├── Interview.model.js     # Interview configuration & questions
│   │   │   ├── Session.model.js       # Live interview transcripts, durations & ratings
│   │   │   ├── Resume.model.js        # Parsed resume text, extracted skills & ATS scores
│   │   │   ├── QuizScore.model.js     # Quiz arena results & competitive timestamps
│   │   │   ├── MockTestResult.model.js# Technical test scores & feedback
│   │   │   ├── Plan.model.js          # Subscription plans & feature gates
│   │   │   ├── Transaction.model.js   # Credit purchases & payment logs
│   │   │   ├── MonthlyReport.model.js # Historical monthly executive summaries
│   │   │   └── SystemPrompt.model.js  # Configurable AI system prompts
│   │   │
│   │   ├── routes/                    # Express REST route definitions
│   │   │   ├── auth.routes.js         # /api/auth/* endpoints
│   │   │   ├── admin.routes.js        # /api/admin/* strictly isolated admin endpoints
│   │   │   ├── interview.routes.js    # /api/interviews/* endpoints
│   │   │   ├── resume.routes.js       # /api/resumes/* endpoints
│   │   │   ├── quiz.routes.js         # /api/quiz/* and /api/quizzes/* endpoints
│   │   │   ├── mockTest.routes.js     # /api/mock-tests/* endpoints
│   │   │   ├── session.routes.js      # /api/sessions/* endpoints
│   │   │   ├── billing.routes.js      # /api/billing/* endpoints
│   │   │   ├── user.routes.js         # /api/user/* endpoints
│   │   │   └── health.routes.js       # /api/health diagnostic probe
│   │   │
│   │   ├── services/                  # Core domain logic
│   │   │   ├── ai.service.js          # Groq LLaMA 3.3 70B integration & deterministic fallback
│   │   │   ├── rag.service.js         # TF-IDF vector embeddings & cosine similarity
│   │   │   ├── report.service.js      # Automated Excel (.xlsx) report generator
│   │   │   ├── chunking.service.js    # Document chunking & token optimization
│   │   │   ├── billing.service.js     # Stripe payment workflows & plan seeds
│   │   │   └── cache.service.js       # In-memory / Redis cache service
│   │   │
│   │   ├── schedulers/                # Cron schedulers
│   │   │   └── report.scheduler.js    # Monthly cron generating executive Excel reports
│   │   │
│   │   ├── scripts/                   # Automated verification & seeding scripts
│   │   │   ├── seedAdmin.js           # Seeds default admin & candidate accounts
│   │   │   ├── verifyPlatformSecurity.js # 8-step security & admin isolation audit
│   │   │   └── verifyCandidateFlows.js   # 7-step candidate user journey verification
│   │   │
│   │   ├── socket.js                  # Socket.io connection handler & telemetry broadcaster
│   │   ├── app.js                     # Express application configuration & middleware mounts
│   │   └── server.js                  # HTTP & WebSocket server entrypoint
│   │
│   ├── .env                           # Backend environment variables
│   ├── nodemon.json                   # Nodemon watcher configuration (ignores reports & logs)
│   └── package.json                   # Backend dependencies & run scripts
│
├── sample-resumes/                    # Bundled test resumes for instant 1-click testing
│   ├── sample_software_developer_resume.pdf
│   └── sample_software_developer_resume.docx
│
├── _legacy_python_backup/             # Preserved original Python FastAPI prototype
├── package.json                       # Root monorepo manifest (concurrent dev scripts)
├── run_dev.bat                        # 1-Click Windows Full-Stack batch launcher
├── Dockerfile                         # Production multi-stage Docker container specification
├── render.yaml                        # Render cloud backend blueprint configuration
├── netlify.toml                       # Netlify cloud frontend SPA build & proxy configuration
├── .env.example                       # Unified environment variables reference template
└── README.md                          # Comprehensive architectural documentation & user manual
```

---

## 🛠️ Technology Stack

| Domain | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 18.2** | Concurrent rendering, hooks, and responsive component tree |
| **Frontend Tooling** | **Vite 5.4** | Ultra-fast HMR and optimized production Rollup bundling |
| **Styling & Icons** | **Tailwind CSS 3.4** + **Lucide React** | Sleek SaaS dark palette (`#090D16`, `#1E293B`, `#6366F1`, `#06B6D4`) |
| **Client State** | **Zustand 4.5** | High-performance state stores with candidate/admin separation |
| **Voice Streaming** | **Web Speech API** | Browser-native `SpeechRecognition` (STT) and `SpeechSynthesis` (TTS) |
| **Backend Framework** | **Express.js 4.19** (Node 18+/20+) | High-throughput asynchronous REST API architecture |
| **Real-Time WebSockets**| **Socket.io 4.7** | Real-time candidate telemetry, code synchronization & interview timer |
| **Database & ODM** | **MongoDB** + **Mongoose 8** | Flexible schema validation with automatic in-memory fallback |
| **AI Intelligence Engine**| **Groq LLaMA 3.3 70B** | Ultra-low-latency (300+ tok/s) technical evaluation and dynamic Q&A |
| **Semantic Search / RAG**| **Local TF-IDF Vector Embeddings**| Zero-cost local vectorization, token weighting, and cosine similarity |
| **Document Parsing** | **pdf-parse** & custom XML streams | Multi-format extraction for `.pdf`, `.docx`, and `.doc` files |
| **Security & Governance**| **JWT (HS256)** + **Bcrypt** + **Helmet** | Strict 2-tier RBAC, dual refresh token validation, and password hashing |
| **Automated Testing** | **Node.js Automated Test Scripts** | Comprehensive test runners validating security and candidate workflows |

---

## 🔒 Security Architecture & Admin Isolation Protocol

```
                               ┌────────────────────────┐
                               │     Incoming Request   │
                               └───────────┬────────────┘
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    ▼                                             ▼
         Standard Candidate Route                       Admin Portal Route
            (/api/interviews, etc.)                     (/api/admin/*)
                    │                                             │
      ┌─────────────┴─────────────┐                 ┌─────────────┴─────────────┐
      ▼                           ▼                 ▼                           ▼
Candidate JWT Token          Missing Token     Dedicated Admin Token       Candidate Token
      │                           │                 │                           │
  HTTP 200                     HTTP 401          HTTP 200                    HTTP 403
(Access Granted)             (Unauthorized)   (Access Granted)         (Access Forbidden)
```

To guarantee enterprise data security and protect candidates' personal evaluation data, InterviewAI employs a **strictly isolated two-tier security model**:

1. **Authentication Separation**:
   - Standard candidates authenticate via `POST /api/auth/login` and receive a standard `accessToken`.
   - Administrators must explicitly authenticate via `POST /api/admin/auth/login` by submitting **both verified email and password**.
2. **Access Control (RBAC)**:
   - Candidates are **strictly blocked** from accessing `/api/admin/*` endpoints and `/admin/*` frontend routes. Any attempt returns an immediate `403 Forbidden: Access denied. Admin privileges required.`
   - In `frontend/src/components/AdminRoute.jsx`, navigation is locked. Unauthenticated users and standard candidates are redirected to `/admin/login` with an explicit security alert.
3. **Decoupled Client State**:
   - In `frontend/src/store/useAuthStore.js`, `candidateToken` and `adminToken` are stored in separate keys (`token` vs `admin_token`). Logging in as a candidate never grants admin access.
4. **Token Refresh Security**:
   - Admin access tokens are short-lived. `POST /api/admin/auth/refresh` independently verifies the admin refresh token using `.select('+refreshToken')` before issuing a fresh token.

---

## 📡 Complete REST API Specification

### 1. Authentication & Session Endpoints
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Create a new candidate student account | None |
| `POST` | `/api/auth/login` | Authenticate candidate with email & password | None |
| `POST` | `/api/auth/refresh` | Refresh expired candidate access token | Refresh Token |
| `GET` | `/api/auth/me` | Fetch active candidate profile, roles & remaining credits | Candidate Token |
| `POST` | `/api/auth/demo-login` | 1-Click candidate demo login | None |

### 2. Strictly Isolated Admin Governance Endpoints
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/admin/auth/login` | **Verify administrator email & password** to open admin session | None |
| `POST` | `/api/admin/auth/refresh` | Issue fresh admin access token | Admin Refresh Token |
| `GET` | `/api/admin/analytics` | Retrieve platform KPIs: MAU, revenue, registrations, active sessions | **Admin Token (Role: admin / super_admin)** |
| `GET` | `/api/admin/users` | List registered candidates, filter by role, adjust credits | **Admin Token** |
| `PUT` | `/api/admin/users/:id/role`| Elevate user permissions or revoke access | **Admin Token (Super Admin)** |
| `GET` | `/api/admin/prompts` | List and edit dynamic AI system prompts & temperature settings | **Admin Token** |
| `POST` | `/api/admin/reports/monthly` | Trigger on-demand generation of monthly Excel (.xlsx) audit report | **Admin Token** |

### 3. Resume Studio & ATS Precision Endpoints
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/resumes/analyze` | Parse resume document (`.pdf`, `.docx`, `.doc`) & compute ATS score | Candidate Token |
| `POST` | `/api/resumes/project-interrogate`| Audit project architecture and generate defense questions | Candidate Token |
| `GET` | `/api/resumes/history` | List previous resume analysis versions and score progressions | Candidate Token |
| `DELETE` | `/api/resumes/:id` | Remove a stored resume record from candidate history | Candidate Token |

### 4. Mock Interview Chamber & Live Sessions
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/interviews/custom` | Create custom interview configuration (role, seniority, focus) | Candidate Token |
| `POST` | `/api/interviews/:id/start` | Synthesize questions and initialize live session chamber | Candidate Token |
| `POST` | `/api/interviews/sessions/:id/submit-answer` | Submit single round answer for real-time AI evaluation | Candidate Token |
| `POST` | `/api/interviews/sessions/:id/finish` | Conclude interview session and generate final scorecard report | Candidate Token |

### 5. Quiz Arena, Mock Tests & Billing
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/quiz/generate` | Generate rapid-fire quiz questions for chosen domain | Candidate Token |
| `POST` | `/api/quiz/submit` | Submit quiz answers and compute score against timer | Candidate Token |
| `GET` | `/api/quiz/leaderboard` | Retrieve global student leaderboard rankings | Candidate Token |
| `GET` | `/api/billing/plans` | Fetch available subscription tiers and feature matrices | None |
| `POST` | `/api/billing/claim-daily` | Claim free daily candidate interview credits | Candidate Token |
| `GET` | `/api/health` | Diagnostic server health check & AI provider status | None |

---

## ⚡ Real-Time Socket.io Telemetry Protocol

The live interview chamber connects to the backend over WebSocket using Socket.io:

```javascript
// Candidate connects to live interview room:
socket.emit('join-interview', { sessionId, interviewId });

// Bi-directional event listeners:
socket.on('transcription-chunk', (data) => {
  // Real-time voice transcript stream
});

socket.on('interview-feedback', (data) => {
  // Intermediate AI feedback, rating (1-10), and pacing critique
});

socket.on('code-execute', (codePayload) => {
  // Code editor execution broadcast
});
```

---

## 🚀 Getting Started & Local Setup

### 1. Prerequisites
* **Node.js:** v18.0.0 or v20.x installed ([nodejs.org](https://nodejs.org/))
* **Git:** Version control client ([git-scm.com](https://git-scm.com/))
* **Groq API Key:** Free API key from [Groq Console](https://console.groq.com/) *(Optional: local heuristic rule engine works offline even without an external API key)*

---

### 2. Fast Launch (Windows 1-Click)

Simply double-click the included Windows batch launcher:
```text
run_dev.bat
```
This automatically verifies Node.js, installs any missing dependencies across root, backend, and frontend, and launches the full stack concurrently:
* **Frontend SPA:** `http://localhost:5173`
* **Backend REST API:** `http://localhost:5000`
* **Admin Portal Login:** `http://localhost:5173/admin/login`

---

### 3. Manual Step-by-Step Setup

#### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/ai-interview-assistant.git
cd ai-interview-assistant
```

#### Step 2: Install All Dependencies
```bash
# Installs root, backend, and frontend dependencies in one command:
npm run install:all
```

#### Step 3: Configure Environment Variables
Copy `.env.example` into both `backend/.env` and `frontend/.env`:
```bash
# Windows:
copy .env.example backend\.env
copy frontend\.env.example frontend\.env

# macOS / Linux:
cp .env.example backend/.env
cp frontend/.env.example frontend/.env
```

#### Step 4: Seed Default Users and Administrators
```bash
npm run seed:admin
```
This initializes the database with pre-configured candidate and administrator accounts.

#### Step 5: Start the Development Servers
```bash
# Run both Backend (:5000) and Frontend (:5173) concurrently:
npm run dev
```

---

## 🔐 Authentication & Authorization System

InterviewAI enforces a production-grade, two-tier authentication and Role-Based Access Control (RBAC) architecture separating candidate user flows from platform governance:

### 1. Candidate Authentication Lifecycle
* **Registration (`POST /api/auth/register`)**:
  - Validates full name, unique email address, and strong password.
  - Automatically hashes the password using **Bcrypt** (salt factor: 10) before persisting to the database.
  - Provisions the candidate with the standard `candidate` role and an initial free trial credit allowance.
  - Returns a signed JWT Access Token and HttpOnly Refresh Token.
* **Login (`POST /api/auth/login`)**:
  - Compares submitted credentials using Bcrypt (`user.comparePassword`).
  - Rejects inactive or banned accounts.
  - Issues signed session tokens.
* **Identity Handshake (`GET /api/auth/me`)**:
  - Protected by JWT Bearer middleware (`protect`), returning the authenticated candidate profile, active plan, and remaining interview credits.
* **Token Refresh (`POST /api/auth/refresh`)**:
  - Seamlessly re-issues access tokens using the cryptographically verified candidate refresh token.

---

### 2. Administrator Authentication & Strict Isolation
* **Access Gatekeeper (`/admin/*`)**:
  - All admin routes and dashboards are strictly isolated. Standard candidates or unauthenticated users attempting to access `/admin/*` are immediately redirected to `/admin/login` with an explicit security alert.
* **Admin Verification (`POST /api/admin/auth/login`)**:
  - Requires explicit verification of both **administrator email and password**.
  - Restricts access exclusively to accounts possessing elevated roles (`admin` or `super_admin`). Standard `candidate` accounts are strictly rejected with `403 Forbidden`.
* **Cryptographic Token Separation**:
  - Administrator access tokens are signed using a distinct, isolated secret (`ADMIN_JWT_SECRET`).
  - Admin refresh tokens are verified against `ADMIN_JWT_REFRESH_SECRET` via `POST /api/admin/auth/refresh`.
  - Candidate tokens can never be used to query administrative governance APIs (`/api/admin/*`).

---

### 3. Provisioning the Initial Administrator Account
For security, administrator credentials are **never hardcoded in documentation or exposed in client bundles**. They are provisioned dynamically through your local environment configuration:

In `backend/.env`:
```ini
ADMIN_EMAIL=your_admin_email@example.com
ADMIN_PASSWORD=YourSecureAdminPassword123!
```

When the backend boots up, it automatically seeds the initial system administrator using these environment variables, allowing the administrator to verify credentials and log in at `http://localhost:5173/admin/login`.

---

## 🧪 Automated Testing & Verification Suite

The repository includes comprehensive automated test runners that validate platform health, security isolation, and candidate user flows:

### 1. Platform Security & Admin Isolation Audit
Validates that candidate accounts cannot access admin routes and verifies admin email/password verification:
```bash
node backend/src/scripts/verifyPlatformSecurity.js
```
```text
======================================================
   FULL STACK PLATFORM & SECURITY AUDIT VERIFICATION  
======================================================

[Test 1] Health Probe...
  ✓ Health status: ok (Uptime: 745s)

[Test 2] Candidate Login with candidate@interviewai.com...
  ✓ Candidate Logged In: Demo Candidate | Role: candidate | Credits: 1

[Test 3] Verifying Candidate CANNOT access Admin Login...
  ✓ Correctly Rejected: Status 403 - "Access denied. Admin privileges required."

[Test 4] Verifying Admin Login with admin@interviewai.com...
  ✓ Admin Authenticated: System Administrator | Role: super_admin

[Test 5] Verifying Candidate Token BLOCKED on Admin Analytics...
  ✓ Correctly Blocked: Status 403 - "Access denied. Admin privileges required."

[Test 6] Verifying Admin Token SUCCEEDS on Admin Analytics...
  ✓ Admin Analytics Accessible: MAU = 1, Total Users = 0

[Test 7] Verifying Admin Refresh Token Endpoint...
  ✓ Fresh Admin Access Token Issued: YES

[Test 8] Verifying Candidate Profile /auth/me...
  ✓ Candidate me: Demo Candidate | Credits: 1

======================================================
  ALL AUDITS PASSED: USER & ADMIN ISOLATION CONFIRMED 
======================================================
```

### 2. Candidate User Journey Verification
Validates the complete candidate user lifecycle from subscription plans to ATS analysis, interview synthesis, and global leaderboard:
```bash
node backend/src/scripts/verifyCandidateFlows.js
```
```text
======================================================
   FULL END-TO-END CANDIDATE USER JOURNEY AUDIT       
======================================================

[Step 1] Fetching Subscription Plans & Pricing...
  ✓ Available Plans: 4

[Step 2] Candidate Login with candidate@interviewai.com...
  ✓ Candidate Authenticated! Credits remaining: 1

[Step 3] Running Resume ATS Compatibility Analysis...
  ✓ ATS Analysis Complete: Overall Match Score: 85/100

[Step 4] Creating Role-Based Mock Interview Configuration...
  ✓ Interview Configured: ID 6acfa4fa2a0f6b9753aea955

[Step 4b] Synthesizing Interview Questions with AI & RAG...
  ✓ Questions Synthesized: 10 role-based questions generated

[Step 5] Initializing Live Interview Session Chamber...
  ✓ Session Chamber Created: Session ID 6acfa4fc2a0f6b9753aea974

[Step 6] Generating Quiz Arena Questions (React/Node track)...
  ✓ Quiz Questions Generated: 5 items

[Step 7] Fetching Global Student Leaderboard...
  ✓ Global Leaderboard Loaded: Top ranks available (5 ranked candidates)

======================================================
   ALL USER FEATURES VERIFIED & OPERATIONAL!          
======================================================
```

### 3. Production Frontend Build
```bash
cd frontend && npm run build
```
```text
✓ 1662 modules transformed.
dist/index.html                                     1.39 kB │ gzip:  0.73 kB
dist/assets/index-cxYH9IcY.css                     66.58 kB │ gzip: 10.92 kB
dist/assets/vendor-framework-DbMFDuLk.js          165.68 kB │ gzip: 54.15 kB
✓ built in 11.08s (0 errors)
```

---

## 💡 Troubleshooting & FAQs

<details>
<summary><b>1. "Access Denied: Admin privileges required" when accessing /admin</b></summary>

* **Cause:** Attempting to navigate to the admin portal while logged in with a standard candidate account, or without logging in through `/admin/login`.
* **Fix:** Log out of the candidate session, navigate to [http://localhost:5173/admin/login](http://localhost:5173/admin/login), and enter verified administrator credentials (as configured via `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `backend/.env`).
</details>

<details>
<summary><b>2. "Port 5000 is already in use"</b></summary>

* **Cause:** A previous Node.js server instance is still bound to port 5000.
* **Fix (Windows):** Open PowerShell or CMD and run:
  ```powershell
  Stop-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess -Force
  ```
  Then restart with `npm run dev`.
</details>

<details>
<summary><b>3. Microphone Voice Dictation Not Responding in Live Session</b></summary>

* **Cause:** Browser permissions are blocked, or the application is being accessed over an insecure remote HTTP origin.
* **Fix:** Modern browsers require `localhost`, `127.0.0.1`, or `HTTPS` to enable the Web Speech API. Click the lock/info icon in the browser address bar and grant microphone permissions.
</details>

<details>
<summary><b>4. Does the app require a paid Groq or OpenAI API key?</b></summary>

* **Cause:** Developers wanting to test without spending money or signing up for paid APIs.
* **Fix:** InterviewAI is built with a zero-cost architecture constraint. If `GROQ_API_KEY` is not provided or quota is exceeded, the server automatically falls back to its deterministic heuristic evaluation engine, generating realistic interview questions and ATS scores with zero downtime.
</details>

---

## 📄 License

This project is licensed under the **MIT License** — open and accessible for personal career development or commercial talent assessments.
