# 🤖 AI Interview Assistant

An AI-powered Interview Assistant that helps candidates prepare for technical and HR interviews through resume analysis, AI-generated interview questions, personalized feedback, and mock interview sessions.

## 🚀 Features

* 📄 Multi-Format Resume Upload (PDF, DOCX, DOC)
* 🧠 Real-Time AI Resume Analysis & Parsing
* 📊 Interactive ATS Resume Scoring with Category Breakdown (Skills, Experience, Education, Keywords)
* 🎯 Job Description Matching & Missing Keywords Detection
* 🔍 Structured Skills, Education & Experience Timeline Extraction
* 📈 Interactive Candidate Dashboard with Visual Gauges and Metric Cards
* 💡 Actionable, Prioritized Resume Improvement Suggestions
* ❓ Contextual Role-Specific Technical and HR Interview Questions
* 🔄 Adaptive Mock Interview with Instant Answer Scoring & Dynamic Difficulty Adjustment (Easy / Medium / Hard)
* 📋 Comprehensive Interview Evaluation & Preparation Plan

## 🛠️ Tech Stack

### Frontend

* HTML5 (Semantic Structure)
* CSS3 (Modern Glassmorphic UI & Responsive Design)
* JavaScript (ES6+ Asynchronous Architecture)

### Backend

* Python 3.12
* FastAPI & Uvicorn
* PyPDF2 & python-docx
* Google GenAI SDK (Gemini API)
* pytest (Automated Test Suite)

## 📂 Project Structure

```text
ai-interview-assistant/
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── backend/
│   ├── main.py
│   ├── resume_extractor.py
│   ├── document_parser.py
│   ├── requirements.txt
│   ├── .env
│   ├── services/
│   │   ├── document_parser.py
│   │   └── resume_extractor.py
│   └── tests/
│       └── test_api.py
│
├── sample-resumes/
│   ├── sample_software_developer_resume.docx
│   └── sample_software_developer_resume.pdf
│
├── requirements.txt
└── README.md
```

## ⚙️ Installation

```bash
git clone <repository-url>
cd ai-interview-assistant

python -m venv venv
venv\Scripts\activate

pip install -r backend/requirements.txt

cd backend
uvicorn main:app --reload
```

Open:

* Backend API: `http://127.0.0.1:8000`
* API Docs: `http://127.0.0.1:8000/docs`

## 🎯 Project Goal

Build an intelligent interview preparation platform that helps students and job seekers improve their interview performance using AI-powered resume analysis and personalized mock interviews.

## 📌 Status

🚧 Currently under development.

More features will be added in upcoming updates.

## 👩‍💻 Author

**Sonali Rai**

## Adaptive AI Interview (Step 2)

The mock interview now supports adaptive questioning through `POST /adaptive-interview`.
After each answer, Gemini scores the response and selects the next question difficulty:
- Strong answer (75-100): harder question
- Average answer (50-74): same difficulty, targeted gap
- Weak answer (0-49): easier/follow-up question

The frontend displays the current difficulty and instant AI feedback. The interview runs for up to 8 questions and then uses the existing final interview evaluation.
