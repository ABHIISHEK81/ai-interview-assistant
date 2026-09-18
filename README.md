# 🤖 InterviewAI — Premium AI Resume Intelligence & Adaptive Mock Interview Platform

**InterviewAI** is an enterprise-grade AI career copilot designed to help candidates land top-tier software and tech roles. It features instant multi-format resume parsing, ATS scoring with category radar diagnostics, job description keyword gap analysis, and an interactive adaptive mock interviewer equipped with **voice microphone dictation** and **text-to-speech audio**.

---

## 🚀 Key Features

* **📄 Multi-Format Document Parsing:** In-memory extraction for PDF, DOCX, and legacy DOC resumes with password detection and table deduplication.
* **📊 Visual ATS Resume Scoring:** Dynamic circular SVG score gauge (0–100) with category breakdowns for *Skills Match*, *Experience Relevance*, *Education & Structure*, and *Keyword Density*.
* **🎯 Job Description Match Radar:** In-depth keyword alignment comparing your profile against specific job listings to surface missing required competencies.
* **🔍 Structured Profile Extraction:** Automatic extraction of technical skills, soft skills, verified education milestones, and career experience timeline cards.
* **💡 Prioritized Improvement Checklist:** Actionable, prioritized recommendations using the Action-Verb + Task + Outcome framework.
* **🎙️ Web Speech Microphone Dictation:** Speak your interview answers aloud using integrated speech-to-text with active audio wave pulse indicators and error handling.
* **🔊 Text-to-Speech Audio Playback:** Listen to interview questions spoken aloud with native browser speech synthesis.
* **🔄 Adaptive Dynamic Mock Interview:** 8-round interactive mock interview where question difficulty adjusts dynamically (*Easy*, *Medium*, *Hard*) based on answer depth and technical precision.
* **📋 Comprehensive Final Evaluation:** End-of-interview report featuring overall performance scoring, communication analysis, model answer comparisons, and next-step study plans.
* **🌓 Dual-Theme System (Light & Dark):** Beautiful, soothing palette (navy, royal blue, indigo, soft slate, crisp white) with `localStorage` theme persistence.
* **✨ Lightweight CSS 3D Neural Visual:** Pure CSS 3D rotating neural core with floating glassmorphic metrics without heavy external 3D libraries.
* **⚡ 1-Click Sample Resume Quick-Load:** Test the full analysis and interview experience instantly with a single click.

---

## 🛠️ Technology Stack

### Frontend
* **Core:** Semantic HTML5, Vanilla CSS3 (Custom Design System with CSS Tokens & 3D Transforms), Modern JavaScript (ES6+ Asynchronous Architecture)
* **APIs:** Web Speech API (`SpeechRecognition`, `speechSynthesis`), Clipboard API, LocalStorage API
* **Typography & Icons:** Inter (Google Fonts), Font Awesome 6.7.2

### Backend
* **Runtime:** Python 3.12+
* **Framework:** FastAPI & Uvicorn (ASGI)
* **Document Parsing:** PyPDF2 & python-docx
* **AI Engine:** Google GenAI SDK (Gemini 2.5 Flash) with automated heuristic fallback
* **Testing:** pytest & HTTPX test client

---

## 📂 Project Structure

```text
ai-interview-assistant/
│
├── frontend/
│   ├── index.html        # Modern SaaS UI with semantic sections & accessibility
│   ├── style.css         # Design tokens, dark/light themes, 3D neural core, responsive grid
│   ├── script.js         # Theme toggle, voice dictation, TTS audio, ATS & adaptive logic
│   └── sample-resumes/   # Built-in sample resumes for instant 1-click testing
│       ├── sample_software_developer_resume.pdf
│       └── sample_software_developer_resume.docx
│
├── backend/
│   ├── main.py           # FastAPI application, routing, CORS, and resilient AI controllers
│   ├── requirements.txt  # Backend dependencies
│   ├── .env              # Gemini API configuration
│   ├── services/
│   │   ├── document_parser.py   # Multi-format document parser (PDF, DOCX, DOC)
│   │   └── resume_extractor.py  # Skills extraction, ATS calculation, and heuristic fallbacks
│   └── tests/
│       └── test_api.py   # Comprehensive automated test suite (11 unit tests)
│
├── requirements.txt      # Root dependencies
└── README.md             # Project documentation & dated changelog
```

---

## ⚙️ Quickstart & Local Setup

### 1. Clone & Activate Environment
```bash
git clone <repository-url>
cd ai-interview-assistant

# Create and activate virtual environment
python -m venv .venv
.\.venv\Scripts\activate  # On Windows
# source .venv/bin/activate  # On Linux/macOS
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables
Ensure `backend/.env` contains your Gemini API key:
```ini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

### 4. Run the Application
Start the unified application (serves both Frontend UI & Backend APIs):
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

Open your browser:
* **Web Application:** [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
* **Interactive API Documentation:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* **API Health Check:** [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

*(Optional) Separate frontend dev server:*
```bash
python -m http.server 3000 --directory frontend
```

---

## 🧪 Running Automated Tests

Run the backend test suite:
```bash
pytest backend/tests
```
All 13 unit tests validate root UI serving, health endpoints, static assets, multi-format text parsers, skill extraction heuristics, and ATS scoring.

---

## 📅 Dated Changelog

### Version 2.0.0 (2026-09-16)
* **UI/UX SaaS Redesign:** Complete visual overhaul featuring soothing navy, royal blue, indigo, and soft gray palette with modern Inter typography.
* **Light / Dark Mode:** Integrated dual-theme support with animated toggle and `localStorage` persistence.
* **Microphone Voice Dictation:** Added Web Speech API microphone dictation with active audio wave recording indicator, status banner, and error handling.
* **Audio Question Player:** Added text-to-speech button to listen to interview questions spoken aloud.
* **CSS 3D AI Visual:** Built a lightweight pure CSS 3D rotating neural scene with orbiting rings, core glow, and floating metric chips.
* **1-Click Sample Resume:** Added quick-test button to automatically load and analyze bundled sample resumes without manual file browsing.
* **Bug Fixes:**
  * Fixed HTML5 hidden file input `required` DOM exception that caused silent form failures in Chromium browsers.
  * Added resilient heuristic fallbacks for Gemini 429 quota exhaustion across resume analysis, adaptive interview, and evaluation endpoints.
  * Cleaned up empty dead directories (`backend/routers/`, `backend/models/`, `backend/uploads/`, `frontend/assets/images/`).
* **Mobile Responsiveness:** Optimized responsive layout across desktop, tablet, and mobile with animated slide-out navigation.

---

## 👩‍💻 Author

**Sonali Rai** — AI Interview Assistant
