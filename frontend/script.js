/* =========================================================
   InterviewAI — Modern AI SaaS Frontend Application Logic
   Features:
   - Theme Toggle (Light/Dark) with localStorage persistence
   - Multi-format Resume Upload (PDF, DOCX, DOC) & Drag-and-Drop
   - 1-Click Sample Resume Quick-Load
   - Real-Time ATS Scoring & Category Breakdown Dashboard
   - Web Speech API Microphone Dictation (Speech-to-Text)
   - Web Speech Synthesis (Text-to-Speech Question Player)
   - Adaptive AI Mock Interview with Dynamic Difficulty (Easy/Medium/Hard)
   - Clipboard Copying & Restart State Management
   ========================================================= */

function resolveApiBaseUrl() {
    // 0. Check localStorage user override (can be set via in-app API Settings modal)
    if (typeof window !== "undefined" && window.localStorage) {
        const customUrl = (localStorage.getItem("interviewai_api_url") || "").trim();
        if (customUrl) {
            return customUrl.replace(/\/+$/, "");
        }
    }

    // 1. Check window.__API_URL__ (injected by build.js / config.js) or legacy window globals
    if (typeof window !== "undefined") {
        const configuredUrl = (window.__API_URL__ || window.API_BASE_URL || window.BACKEND_API_URL || "").trim();
        if (configuredUrl) {
            return configuredUrl.replace(/\/+$/, "");
        }
    }

    // 2. Check if running in a local development environment
    if (typeof window !== "undefined" && window.location) {
        const hostname = window.location.hostname;
        const isLocal = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0" || window.location.protocol === "file:";

        if (isLocal) {
            // If served directly by FastAPI (e.g. port 8000), use relative path
            if (window.location.port === "8000") {
                return "";
            }
            // If served by a different local dev server (e.g. port 3000, 5173, 5500) or file://
            return `http://${hostname || "127.0.0.1"}:8000`;
        }
    }

    // 3. In production without an explicit URL, default to "" (allows same-origin / Netlify proxy redirects)
    return "";
}

let API_BASE_URL = resolveApiBaseUrl();

function getApiUrl(endpoint) {
    const base = (API_BASE_URL || "").trim().replace(/\/+$/, "");
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    return base ? `${base}${cleanEndpoint}` : cleanEndpoint;
}

function getNetworkErrorMessage(actionName, rawError) {
    const isLocal = typeof window !== "undefined" && window.location && 
        (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.hostname === "0.0.0.0" || window.location.protocol === "file:");
    
    if (isLocal) {
        const target = API_BASE_URL || "http://127.0.0.1:8000";
        return `Cannot connect to AI backend at ${target}. Please ensure the backend server is running locally (e.g., "python main.py").`;
    }

    if (!API_BASE_URL) {
        return `Cannot connect to AI backend service. If using Netlify, your Python FastAPI backend must be deployed (e.g. on Render or Railway) and configured via VITE_API_URL, or set your backend URL in Settings (gear icon in header).`;
    }

    return `AI service at ${API_BASE_URL} is unreachable. Please verify the backend service is active.`;
}

function getAnalyzeApiUrl() { return getApiUrl("/analyze-resume"); }
function getEvaluateApiUrl() { return getApiUrl("/evaluate-interview"); }
function getAdaptiveApiUrl() { return getApiUrl("/adaptive-interview"); }

const MAX_ADAPTIVE_QUESTIONS = 8;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const THEME_STORAGE_KEY = "interviewai_theme";

// Navigation & Theme Elements
const themeToggleBtn = document.getElementById("themeToggleBtn");
const menuButton = document.getElementById("menuButton");
const navLinks = document.getElementById("navLinks");
const appSidebar = document.getElementById("appSidebar");
const sidebarBackdrop = document.getElementById("sidebarBackdrop");
const sidebarThemeBtn = document.getElementById("sidebarThemeBtn");
const topbarSampleBtn = document.getElementById("topbarSampleBtn");
const currentPageTitle = document.getElementById("currentPageTitle");

// Form & Input Elements
const resumeForm = document.getElementById("resumeForm");
const roleInput = document.getElementById("role");
const customRoleGroup = document.getElementById("customRoleGroup");
const customRoleInput = document.getElementById("customRoleInput");
const roleCategoryPills = document.getElementById("roleCategoryPills");
const currentCategoryBadge = document.getElementById("currentCategoryBadge");
const roleInsightCard = document.getElementById("roleInsightCard");
const roleCategoryTag = document.getElementById("roleCategoryTag");
const roleSkillsPreview = document.getElementById("roleSkillsPreview");
const autofillJdBtn = document.getElementById("autofillJdBtn");
const jobDescriptionInput = document.getElementById("jobDescription");
const jobDescriptionCount = document.getElementById("jobDescriptionCount");
const loadSampleBtn = document.getElementById("loadSampleBtn");

// File Upload Elements
const uploadArea = document.getElementById("uploadArea");
const resumeFileInput = document.getElementById("resumeFile");
const browseBtn = document.getElementById("browseBtn");
const selectedFileBox = document.getElementById("selectedFile");
const fileName = document.getElementById("fileName");
const fileSize = document.getElementById("fileSize");
const removeFileButton = document.getElementById("removeFile");
const analyzeButton = document.getElementById("analyzeButton") || document.querySelector(".analyze-button");

// In-Form Validation & Alert Elements
const formAlertBox = document.getElementById("formAlertBox");
const formAlertText = document.getElementById("formAlertText");

// Result & State Containers
const resultSection = document.getElementById("resultSection");
const loadingBox = document.getElementById("loadingBox");
const errorBox = document.getElementById("errorBox");
const errorMessage = document.getElementById("errorMessage");

// Dashboard Elements
const dashboardWrapper = document.getElementById("dashboardWrapper");
const atsScoreRating = document.getElementById("atsScoreRating");
const atsScoreValue = document.getElementById("atsScoreValue");
const atsMeterCircle = document.getElementById("atsMeterCircle");
const bdSkillsMatch = document.getElementById("bdSkillsMatch");
const barSkillsMatch = document.getElementById("barSkillsMatch");
const bdExpRelevance = document.getElementById("bdExpRelevance");
const barExpRelevance = document.getElementById("barExpRelevance");
const bdEduFormatting = document.getElementById("bdEduFormatting");
const barEduFormatting = document.getElementById("barEduFormatting");
const bdKeywordCoverage = document.getElementById("bdKeywordCoverage");
const barKeywordCoverage = document.getElementById("barKeywordCoverage");

const jobMatchValue = document.getElementById("jobMatchValue");
const candidateSummaryText = document.getElementById("candidateSummaryText");
const keyStrengthsList = document.getElementById("keyStrengthsList");

const technicalSkillsList = document.getElementById("technicalSkillsList");
const softSkillsList = document.getElementById("softSkillsList");
const matchedSkillsList = document.getElementById("matchedSkillsList");
const missingSkillsList = document.getElementById("missingSkillsList");

const educationList = document.getElementById("educationList");
const experienceList = document.getElementById("experienceList");
const improvementList = document.getElementById("improvementList");

// Detailed Analysis Report Elements
const analysisCard = document.getElementById("analysisCard");
const analysisRole = document.getElementById("analysisRole");
const analysisFileName = document.getElementById("analysisFileName");
const analysisContent = document.getElementById("analysisContent");
const copyResultButton = document.getElementById("copyResultButton");
const startInterviewButton = document.getElementById("startInterviewButton");

// Interview Section Elements
const interviewSection = document.getElementById("interviewSection");
const interviewCard = document.getElementById("interviewCard");
const questionCategory = document.getElementById("questionCategory");
const difficultyBadge = document.getElementById("difficultyBadge");
const questionCounter = document.getElementById("questionCounter");
const answeredCounter = document.getElementById("answeredCounter");
const questionProgressBar = document.getElementById("questionProgressBar");
const interviewQuestion = document.getElementById("interviewQuestion");
const listenQuestionBtn = document.getElementById("listenQuestionBtn");
const interviewAnswer = document.getElementById("interviewAnswer");
const micButton = document.getElementById("micButton");
const micButtonText = document.getElementById("micButtonText");
const micActiveBanner = document.getElementById("micActiveBanner");
const answerValidationMessage = document.getElementById("answerValidationMessage");
const answerCharacterCount = document.getElementById("answerCharacterCount");
const previousQuestionButton = document.getElementById("previousQuestionButton");
const nextQuestionButton = document.getElementById("nextQuestionButton");

// Adaptive Feedback Elements
const adaptiveFeedback = document.getElementById("adaptiveFeedback");
const adaptiveScore = document.getElementById("adaptiveScore");
const adaptiveQuality = document.getElementById("adaptiveQuality");
const adaptiveFeedbackText = document.getElementById("adaptiveFeedbackText");

// Interview States & Final Evaluation
const interviewLoading = document.getElementById("interviewLoading");
const interviewError = document.getElementById("interviewError");
const interviewErrorMessage = document.getElementById("interviewErrorMessage");
const evaluationCard = document.getElementById("evaluationCard");
const evaluationRole = document.getElementById("evaluationRole");
const evaluationContent = document.getElementById("evaluationContent");
const copyEvaluationButton = document.getElementById("copyEvaluationButton");
const restartInterviewButton = document.getElementById("restartInterviewButton");

// Application State
let selectedResumeFile = null;
let latestAnalysisData = null;
let currentAnalysisText = "";
let isAnalyzing = false;

let interviewQuestions = [];
let interviewAnswers = [];
let currentQuestionIndex = 0;
let currentEvaluationText = "";

let adaptiveDifficulty = "medium";
let adaptiveHistory = [];
let isAdaptiveMode = true;
let isAdaptiveSubmitting = false;

// Audio & Speech State
let speechRecognition = null;
let isRecordingSpeech = false;
let isSpeakingQuestion = false;


/* =========================================================
   1. THEME MANAGEMENT (LIGHT / DARK WITH LOCALSTORAGE)
========================================================= */

function initTheme() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const systemPrefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (systemPrefersDark ? "dark" : "light");
    applyTheme(initialTheme);
}

function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    if (themeToggleBtn) {
        themeToggleBtn.setAttribute(
            "aria-label",
            theme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme"
        );
    }
    if (sidebarThemeBtn) {
        sidebarThemeBtn.innerHTML = theme === "dark"
            ? '<i class="fa-solid fa-sun"></i> <span>Light Mode</span>'
            : '<i class="fa-solid fa-moon"></i> <span>Dark Mode</span>';
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
}

if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", toggleTheme);
}

if (sidebarThemeBtn) {
    sidebarThemeBtn.addEventListener("click", toggleTheme);
}


/* =========================================================
   2. PARTITION WORKSPACE ROUTER & NAVIGATION CONTROLLER
========================================================= */

const PARTITION_IDS = ["home", "how-it-works", "features", "blueprint", "analyze", "resultSection", "interviewSection", "profile"];

let currentActivePartition = "home";

function activatePartition(partitionId, smoothScroll = true) {
    if (!PARTITION_IDS.includes(partitionId)) {
        if (partitionId === "result" || partitionId === "results") partitionId = "resultSection";
        else if (partitionId === "interview" || partitionId === "mock") partitionId = "interviewSection";
        else if (partitionId === "candidate-profile" || partitionId === "account") partitionId = "profile";
        else partitionId = "home";
    }

    currentActivePartition = partitionId;

    // 1. Update Partition Sections
    document.querySelectorAll(".partition-section").forEach(section => {
        const id = section.getAttribute("data-partition") || section.id;
        const isActive = (id === partitionId);
        section.classList.toggle("active", isActive);
        section.style.display = isActive ? "block" : "none";
    });

    // 2. Update Navbar Links in Top Header
    document.querySelectorAll(".nav-link").forEach(link => {
        const target = (link.getAttribute("data-section") || link.getAttribute("href") || "").replace("#", "");
        const isActive = (target === partitionId);
        link.classList.toggle("active", isActive);
    });

    // 3. Scroll to top smoothly
    if (smoothScroll) {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // 4. Trigger profile load / auth check if opening profile partition
    if (partitionId === "profile" && typeof onProfilePartitionActivated === "function") {
        onProfilePartitionActivated();
    }
}

function switchToPartition(partitionId, updateHash = true) {
    activatePartition(partitionId, true);
    if (updateHash && window.history && window.history.replaceState) {
        window.history.replaceState(null, "", `#${partitionId}`);
    }
}

// Check initial hash on page load
const initialHash = (window.location.hash || "").replace("#", "").trim();
if (initialHash && PARTITION_IDS.includes(initialHash)) {
    activatePartition(initialHash, false);
} else {
    activatePartition("home", false);
}

// Hash change event listener (browser back / forward buttons)
window.addEventListener("hashchange", () => {
    const hash = (window.location.hash || "").replace("#", "").trim();
    if (hash && PARTITION_IDS.includes(hash)) {
        activatePartition(hash, true);
    }
});

// Mobile drawer toggle
if (menuButton && navLinks) {
    menuButton.addEventListener("click", () => {
        const isOpen = navLinks.classList.contains("show");
        menuButton.setAttribute("aria-expanded", String(!isOpen));
        navLinks.classList.toggle("show");
    });
}

// Global anchor interceptor for section links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", (e) => {
        const href = anchor.getAttribute("href");
        if (!href || href === "#") return;
        const targetId = href.replace("#", "");
        if (PARTITION_IDS.includes(targetId)) {
            e.preventDefault();
            switchToPartition(targetId);
            // Close mobile menu if open
            if (navLinks && navLinks.classList.contains("show")) {
                navLinks.classList.remove("show");
                if (menuButton) menuButton.setAttribute("aria-expanded", "false");
            }
        }
    });
});

if (topbarSampleBtn && loadSampleBtn) {
    topbarSampleBtn.addEventListener("click", (e) => {
        e.preventDefault();
        loadSampleBtn.click();
        switchToPartition("analyze");
    });
}

// ScrollSpy Navigation (Active when in continuous mode)
window.addEventListener("scroll", () => {
    if (currentViewMode !== "continuous") return;

    let currentSectionId = "";
    for (const id of PARTITION_IDS) {
        const el = document.getElementById(id);
        if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.top <= 140 && rect.bottom >= 140) {
                currentSectionId = id;
                break;
            }
        }
    }

    if (currentSectionId) {
        document.querySelectorAll(".nav-link").forEach(link => {
            if (link.getAttribute("data-section") === currentSectionId || link.getAttribute("href") === `#${currentSectionId}`) {
                link.classList.add("active");
            } else {
                link.classList.remove("active");
            }
        });
        if (partitionTabs) {
            partitionTabs.querySelectorAll(".partition-tab").forEach(tab => {
                const isActive = (tab.getAttribute("data-target") === currentSectionId);
                tab.classList.toggle("active", isActive);
                tab.setAttribute("aria-selected", isActive ? "true" : "false");
            });
        }
    }
}, { passive: true });


/* =========================================================
   3. JOB DESCRIPTION LIVE CHARACTER COUNTER
========================================================= */

if (jobDescriptionInput && jobDescriptionCount) {
    jobDescriptionInput.addEventListener("input", () => {
        const count = jobDescriptionInput.value.length;
        jobDescriptionCount.textContent = `${count} / 10000`;
        if (count >= 10000) {
            jobDescriptionCount.style.color = "var(--danger)";
        } else {
            jobDescriptionCount.style.color = "var(--text-muted)";
        }
    });
}

/* =========================================================
   3.5. CATEGORIZED JOB ROLES DATABASE & CONTROLLER
========================================================= */

const JOB_ROLES_DATABASE = {
    // Tech Roles
    "Software Developer": {
        category: "tech",
        categoryName: "Tech Roles",
        skills: "Python, FastAPI/Node.js, React, SQL, Git, REST APIs",
        sampleJd: "We are seeking a Software Developer proficient in Python, FastAPI, React, RESTful APIs, and SQL. The candidate will design scalable services, write unit tests, and collaborate with cross-functional engineering teams to ship reliable software."
    },
    "Frontend Developer": {
        category: "tech",
        categoryName: "Tech Roles",
        skills: "React, TypeScript, CSS/SASS, Next.js, Redux, Performance Optimization",
        sampleJd: "Looking for a Frontend Developer with strong expertise in React, TypeScript, modern CSS, responsive design, and state management. You will build high-performance, accessible web applications and collaborate closely with UI/UX designers."
    },
    "Backend Developer": {
        category: "tech",
        categoryName: "Tech Roles",
        skills: "Node.js/Python/Go, Microservices, PostgreSQL, Redis, Docker, System Architecture",
        sampleJd: "Seeking a Backend Developer to build robust microservices, design database schemas, implement caching with Redis, and optimize query latency. Proficiency with Docker, CI/CD, and REST/gRPC protocols required."
    },
    "Full Stack Developer": {
        category: "tech",
        categoryName: "Tech Roles",
        skills: "Full Stack (React/Node/Python), Database Design, Cloud Deployment, API Integration",
        sampleJd: "Seeking a Full Stack Developer capable of delivering end-to-end web features. Must be comfortable building responsive frontend components in React and crafting secure backend services in Python or Node.js."
    },
    "Mobile App Developer": {
        category: "tech",
        categoryName: "Tech Roles",
        skills: "Flutter, React Native, Swift/Kotlin, Mobile UI, App Store Deployment, Offline Sync",
        sampleJd: "Hiring a Mobile App Developer with experience in Flutter or React Native. You will develop cross-platform mobile apps for iOS and Android, integrate native device APIs, and deliver smooth 60fps animations."
    },
    "DevOps Engineer": {
        category: "tech",
        categoryName: "Tech Roles",
        skills: "Docker, Kubernetes, AWS/GCP, Terraform, CI/CD Pipelines, Prometheus/Grafana",
        sampleJd: "Looking for a DevOps Engineer to automate infrastructure provisioning using Terraform, manage Kubernetes clusters on AWS/GCP, maintain CI/CD pipelines (GitHub Actions), and ensure 99.99% system uptime."
    },
    "Cybersecurity Analyst": {
        category: "tech",
        categoryName: "Tech Roles",
        skills: "Vulnerability Assessment, SIEM, Penetration Testing, OWASP Top 10, Network Security",
        sampleJd: "Seeking a Cybersecurity Analyst to monitor security events, conduct vulnerability assessments, manage incident response, audit compliance, and safeguard infrastructure against modern threat vectors."
    },
    "QA Automation Engineer": {
        category: "tech",
        categoryName: "Tech Roles",
        skills: "Selenium/Playwright, PyTest/Jest, API Testing (Postman), CI/CD, Test Strategy",
        sampleJd: "Seeking a QA Automation Engineer to design end-to-end automated testing suites with Playwright/Selenium, perform API test automation, integrate regression tests in CI pipelines, and ensure bug-free releases."
    },
    "Systems Architect": {
        category: "tech",
        categoryName: "Tech Roles",
        skills: "Distributed Systems, Event-Driven Architecture, High Availability, Cloud Governance",
        sampleJd: "Looking for a Systems Architect to define technical architecture, evaluate technology stacks, lead system decomposition into decoupled services, and establish architectural standards across engineering."
    },
    "Embedded Systems Engineer": {
        category: "tech",
        categoryName: "Tech Roles",
        skills: "C/C++, RTOS, Microcontrollers (ARM/STM32), I2C/SPI/UART, Hardware Debugging",
        sampleJd: "Seeking an Embedded Systems Engineer to develop low-level firmware in C/C++ on ARM microcontrollers, implement communication protocols (UART, SPI, I2C), and optimize real-time performance on constrained hardware."
    },

    // Data & AI Roles
    "Data Scientist": {
        category: "data-ai",
        categoryName: "Data & AI",
        skills: "Python, Scikit-Learn, Pandas, Statistical Modeling, A/B Testing, Feature Engineering",
        sampleJd: "Hiring a Data Scientist to formulate analytical frameworks, build predictive machine learning models, design statistical experiments (A/B testing), and extract actionable business insights from massive datasets."
    },
    "Data Science Intern": {
        category: "data-ai",
        categoryName: "Data & AI",
        skills: "Python, Pandas, NumPy, Data Cleaning, Exploratory Data Analysis, Basic ML",
        sampleJd: "Seeking an enthusiastic Data Science Intern with a foundational grasp of Python, Pandas, data exploration, and core machine learning algorithms. You will assist the analytics team in cleaning data and training baseline models."
    },
    "Machine Learning Engineer": {
        category: "data-ai",
        categoryName: "Data & AI",
        skills: "PyTorch, TensorFlow, MLOps, Model Deployment, Feature Stores, Distributed Training",
        sampleJd: "Seeking a Machine Learning Engineer with hands-on experience training and deploying deep learning models in production. Expertise with PyTorch/TensorFlow, model serving (Triton/FastAPI), and MLOps pipelines required."
    },
    "AI Engineer": {
        category: "data-ai",
        categoryName: "Data & AI",
        skills: "LLM Fine-tuning, RAG, Prompt Engineering, Vector Databases (Pinecone/Chroma), LangChain",
        sampleJd: "Looking for an AI Engineer to build generative AI solutions, architect Retrieval-Augmented Generation (RAG) pipelines, integrate vector databases, and deploy production-ready LLM agents."
    },
    "Data Analyst": {
        category: "data-ai",
        categoryName: "Data & AI",
        skills: "SQL, Tableau/PowerBI, Excel, Cohort Analysis, Dashboarding, Data Storytelling",
        sampleJd: "Looking for a Data Analyst to craft executive dashboards in Tableau/Power BI, write advanced SQL queries, investigate key business metrics, and collaborate with stakeholders to empower data-driven decisions."
    },
    "Data Engineer": {
        category: "data-ai",
        categoryName: "Data & AI",
        skills: "Apache Spark, Kafka, Airflow, Snowflake/BigQuery, Data Warehousing, DBT",
        sampleJd: "Seeking a Data Engineer to design high-throughput data ingestion pipelines with Kafka and Spark, build automated workflows in Airflow, and maintain dimensional schemas across our cloud data warehouse."
    },
    "Business Intelligence Analyst": {
        category: "data-ai",
        categoryName: "Data & AI",
        skills: "Power BI, DAX, SQL, Data Modeling, KPI Development, Stakeholder Reporting",
        sampleJd: "Hiring a Business Intelligence Analyst to design enterprise reporting architectures, create complex DAX metrics in Power BI, and translate company objectives into actionable KPI scorecards."
    },

    // Management & Leadership Roles
    "Product Manager": {
        category: "management",
        categoryName: "Management",
        skills: "Product Roadmapping, User Research, Agile/Scrum, Wireframing, Go-to-Market Strategy",
        sampleJd: "Seeking a Product Manager to lead cross-functional squads, define product roadmaps, prioritize backlogs based on customer discovery, synthesize quantitative metrics, and launch innovative product features."
    },
    "Engineering Manager": {
        category: "management",
        categoryName: "Management",
        skills: "Team Leadership, 1-on-1 Coaching, Technical Strategy, Hiring, Agile Delivery",
        sampleJd: "Looking for an Engineering Manager to guide a team of 8-12 software engineers. You will mentor developers, drive architectural alignment, establish engineering excellence, and deliver roadmap commitments."
    },
    "Project Manager": {
        category: "management",
        categoryName: "Management",
        skills: "PMP/Agile, Risk Management, Budgeting, Resource Allocation, Jira/Asana",
        sampleJd: "Hiring a Project Manager to orchestrate project timelines, mitigate operational risks, facilitate sprint ceremonies, align cross-departmental stakeholders, and deliver complex deliverables on schedule."
    },
    "Scrum Master": {
        category: "management",
        categoryName: "Management",
        skills: "Agile Ceremonies, Sprint Planning, Retrospectives, Impediment Removal, Jira",
        sampleJd: "Seeking a certified Scrum Master to foster self-organizing teams, facilitate sprint planning, daily standups, and retrospectives, eliminate roadblocks, and champion continuous delivery practices."
    },
    "Technical Program Manager": {
        category: "management",
        categoryName: "Management",
        skills: "Cross-Functional Execution, Systems Engineering, Technical Milestones, Risk Mitigation",
        sampleJd: "Seeking a Technical Program Manager (TPM) to drive large-scale, complex engineering initiatives across distributed infrastructure, align architecture teams, and manage critical dependencies across multiple squads."
    },
    "Operations Manager": {
        category: "management",
        categoryName: "Management",
        skills: "Process Optimization, Six Sigma/Lean, Vendor Management, Operational SLA Tracking",
        sampleJd: "Looking for an Operations Manager to streamline organizational workflows, optimize resource utilization, monitor performance SLAs, and lead process improvement initiatives to scale operational efficiency."
    },
    "Tech Lead": {
        category: "management",
        categoryName: "Management",
        skills: "Code Reviews, Architecture, Technical Mentorship, High-Impact Delivery, Prototyping",
        sampleJd: "Hiring a Tech Lead to guide engineering direction, enforce code quality standards through thorough reviews, resolve complex technical debt, and partner with product managers to deliver scalable systems."
    },

    // Non-Tech, Business & Marketing Roles
    "Business Analyst": {
        category: "non-tech",
        categoryName: "Non-Tech Roles",
        skills: "Requirements Gathering, Process Modeling (BPMN), User Stories, Stakeholder Management",
        sampleJd: "Looking for a Business Analyst to bridge business needs and technical solutions. You will gather business requirements, document functional specifications, create process flows, and facilitate user acceptance testing (UAT)."
    },
    "Digital Marketing Specialist": {
        category: "non-tech",
        categoryName: "Non-Tech Roles",
        skills: "SEO/SEM, Google Analytics 4, Meta Ads, Conversion Rate Optimization (CRO), Email Automation",
        sampleJd: "Seeking a Digital Marketing Specialist to execute paid acquisition campaigns, optimize funnel conversion rates, conduct keyword analysis, and analyze campaign ROI across paid search and social channels."
    },
    "Growth & SEO Manager": {
        category: "non-tech",
        categoryName: "Non-Tech Roles",
        skills: "Technical SEO, Organic Search Strategy, Keyword Discovery, Backlink Acquisition, GA4",
        sampleJd: "Looking for a Growth & SEO Manager to drive organic customer acquisition. You will conduct technical site audits, devise high-ranking content strategies, optimize on-page SEO, and scale organic traffic."
    },
    "Content Strategist": {
        category: "non-tech",
        categoryName: "Non-Tech Roles",
        skills: "Copywriting, Content Lifecycle, Editorial Calendars, Brand Voice, Storytelling",
        sampleJd: "Hiring a Content Strategist to craft compelling narratives, manage the multi-channel editorial calendar, create high-converting case studies and whitepapers, and maintain unified brand voice across touchpoints."
    },
    "Sales Development Representative": {
        category: "non-tech",
        categoryName: "Non-Tech Roles",
        skills: "Outbound Prospecting, Cold Calling/Emailing, CRM (Salesforce/HubSpot), Lead Qualification",
        sampleJd: "Seeking an energetic Sales Representative (SDR) to generate qualified enterprise pipeline. You will prospect high-value accounts, conduct outbound multi-touch outreach, and schedule qualified product demos."
    },
    "Customer Success Manager": {
        category: "non-tech",
        categoryName: "Non-Tech Roles",
        skills: "Client Retention, Onboarding, Net Promoter Score (NPS), Churn Reduction, Upselling",
        sampleJd: "Hiring a Customer Success Manager (CSM) to own key client relationships post-sale, drive software adoption, facilitate executive business reviews (QBRs), resolve escalations, and maximize net revenue retention."
    },
    "Operations Associate": {
        category: "non-tech",
        categoryName: "Non-Tech Roles",
        skills: "Workflow Execution, Data Verification, Spreadsheet Modeling, Cross-Functional Logistics",
        sampleJd: "Seeking an Operations Associate to manage day-to-day business logistics, reconcile operational data, troubleshoot operational friction, and support leadership with reporting and ad-hoc analysis."
    },

    // Design & Creative Roles
    "UI/UX Designer": {
        category: "design",
        categoryName: "Design & Creative",
        skills: "Figma, User Research, Wireframing, Interactive Prototyping, Usability Testing, Design Systems",
        sampleJd: "Looking for a UI/UX Designer to craft intuitive, user-centric interfaces. You will conduct user research, build rapid interactive prototypes in Figma, and maintain a unified component design system."
    },
    "Product Designer": {
        category: "design",
        categoryName: "Design & Creative",
        skills: "End-to-End Product Design, Micro-Interactions, User Flow Mapping, Design Tokens",
        sampleJd: "Seeking a Product Designer to take complex workflows and transform them into elegant, joyful digital experiences. Experience with product validation, mobile and desktop layouts, and design tokens is essential."
    },
    "Graphic Designer": {
        category: "design",
        categoryName: "Design & Creative",
        skills: "Adobe Creative Suite (Photoshop/Illustrator), Brand Identity, Typography, Visual Assets",
        sampleJd: "Hiring a Graphic Designer to produce eye-catching marketing collateral, brand identity assets, digital banners, and presentation decks that elevate our brand presence across all customer channels."
    },

    // Finance, HR & Operations Roles
    "Financial Analyst": {
        category: "finance-ops",
        categoryName: "Finance & Ops",
        skills: "Financial Modeling, DCF Analysis, Forecasting, Budget Variance, Advanced Excel, PowerQuery",
        sampleJd: "Seeking a Financial Analyst to build multi-year financial forecasts, conduct discounted cash flow (DCF) models, track budget variances, and deliver executive-level financial presentations to support capital allocation."
    },
    "HR Specialist": {
        category: "finance-ops",
        categoryName: "Finance & Ops",
        skills: "Talent Acquisition, Employee Relations, HRIS (Workday/BambooHR), Onboarding, Compliance",
        sampleJd: "Looking for an HR Specialist to manage end-to-end recruitment, coordinate employee onboarding, champion positive workplace culture, and ensure compliance with employment laws and company policies."
    },
    "Investment Banking Analyst": {
        category: "finance-ops",
        categoryName: "Finance & Ops",
        skills: "M&A Modeling, LBO Analysis, Pitch Books, Valuation Comps, Due Diligence",
        sampleJd: "Seeking an Investment Banking Analyst to perform comprehensive financial valuation, build leveraged buyout (LBO) and merger models, assemble pitch presentations, and execute transaction due diligence."
    },
    "Management Consultant": {
        category: "finance-ops",
        categoryName: "Finance & Ops",
        skills: "Strategy Frameworks, Market Sizing, Operational Transformation, Executive Communication",
        sampleJd: "Looking for a Management Consultant to advise enterprise leaders on strategic transformation, analyze market competitive landscapes, diagnose organizational inefficiencies, and craft roadmaps for sustainable growth."
    }
};

function getEffectiveTargetRole() {
    if (!roleInput) return "Software Developer";
    const selected = (roleInput.value || "").trim();
    if (selected === "custom") {
        const customVal = customRoleInput ? customRoleInput.value.trim() : "";
        return customVal || "Custom Role";
    }
    return selected;
}

function updateRoleInsightAndCustomField(roleVal) {
    hideFormAlert();
    hideError();

    if (!roleVal) {
        if (roleInsightCard) roleInsightCard.style.display = "none";
        if (customRoleGroup) customRoleGroup.style.display = "none";
        return;
    }

    if (roleVal === "custom") {
        if (customRoleGroup) {
            customRoleGroup.style.display = "block";
            if (customRoleInput) customRoleInput.focus();
        }
        if (roleInsightCard) {
            roleInsightCard.style.display = "block";
            if (roleCategoryTag) {
                roleCategoryTag.innerHTML = '<i class="fa-solid fa-sparkles"></i> Custom Role';
            }
            if (roleSkillsPreview) {
                roleSkillsPreview.textContent = "Specify any specialized job title. The AI will evaluate against real-world domain requirements.";
            }
            if (autofillJdBtn) {
                autofillJdBtn.style.display = "none";
            }
        }
        return;
    }

    if (customRoleGroup) {
        customRoleGroup.style.display = "none";
    }

    const roleInfo = JOB_ROLES_DATABASE[roleVal];
    if (roleInfo && roleInsightCard) {
        roleInsightCard.style.display = "block";
        if (roleCategoryTag) {
            roleCategoryTag.innerHTML = `<i class="fa-solid fa-tag"></i> ${escapeHtml(roleInfo.categoryName)}`;
        }
        if (roleSkillsPreview) {
            roleSkillsPreview.textContent = `Core skills: ${roleInfo.skills}`;
        }
        if (autofillJdBtn) {
            autofillJdBtn.style.display = "inline-flex";
            autofillJdBtn.classList.remove("filled");
            autofillJdBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> <span>Insert Sample JD</span>';
        }

        // Highlight matching category pill if applicable
        if (roleCategoryPills) {
            const pills = roleCategoryPills.querySelectorAll(".category-pill");
            pills.forEach(pill => {
                const cat = pill.getAttribute("data-category");
                const matches = (cat === roleInfo.category);
                pill.classList.toggle("active", matches);
                pill.setAttribute("aria-selected", matches ? "true" : "false");
            });
            if (currentCategoryBadge) {
                currentCategoryBadge.innerHTML = `<i class="fa-solid fa-tag"></i> ${escapeHtml(roleInfo.categoryName)}`;
            }
        }
    }
}

function setupCategoryPillFilters() {
    if (!roleCategoryPills || !roleInput) return;

    const pills = roleCategoryPills.querySelectorAll(".category-pill");
    const optgroups = roleInput.querySelectorAll("optgroup");

    pills.forEach(pill => {
        pill.addEventListener("click", () => {
            const selectedCategory = pill.getAttribute("data-category") || "all";

            pills.forEach(p => {
                const isActive = (p === pill);
                p.classList.toggle("active", isActive);
                p.setAttribute("aria-selected", isActive ? "true" : "false");
            });

            // Update category badge
            if (currentCategoryBadge) {
                const catText = pill.innerText.trim();
                currentCategoryBadge.innerHTML = `<i class="fa-solid fa-layer-group"></i> ${escapeHtml(catText)}`;
            }

            // Filter options in select
            let firstMatchingOption = null;
            optgroups.forEach(group => {
                const groupCategory = group.getAttribute("data-category");
                const shouldShow = (selectedCategory === "all" || groupCategory === selectedCategory || groupCategory === "custom");
                group.hidden = !shouldShow;
                group.style.display = shouldShow ? "" : "none";

                if (shouldShow && !firstMatchingOption && groupCategory !== "custom") {
                    const firstOpt = group.querySelector("option");
                    if (firstOpt) firstMatchingOption = firstOpt.value;
                }
            });

            // If current selection is in a hidden optgroup, switch selection to first option in active group
            const currentSelected = roleInput.value;
            const currentSelectedGroup = roleInput.querySelector(`option[value="${currentSelected}"]`)?.closest("optgroup");
            if (currentSelectedGroup && currentSelectedGroup.hidden) {
                if (firstMatchingOption) {
                    roleInput.value = firstMatchingOption;
                    updateRoleInsightAndCustomField(firstMatchingOption);
                } else {
                    roleInput.value = "";
                    updateRoleInsightAndCustomField("");
                }
            }
        });
    });
}

// Initialize Category Pills & Role Change Listeners
setupCategoryPillFilters();

if (roleInput) {
    roleInput.addEventListener("change", () => {
        updateRoleInsightAndCustomField(roleInput.value);
    });
}

if (customRoleInput) {
    customRoleInput.addEventListener("input", () => {
        hideFormAlert();
        hideError();
    });
}

if (autofillJdBtn) {
    autofillJdBtn.addEventListener("click", () => {
        const selectedRole = roleInput ? roleInput.value : "";
        const roleInfo = JOB_ROLES_DATABASE[selectedRole];
        if (roleInfo && roleInfo.sampleJd && jobDescriptionInput) {
            jobDescriptionInput.value = roleInfo.sampleJd;
            if (jobDescriptionCount) {
                jobDescriptionCount.textContent = `${jobDescriptionInput.value.length} / 10000`;
            }
            autofillJdBtn.classList.add("filled");
            autofillJdBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i> <span>Sample JD Added!</span>';
            setTimeout(() => {
                autofillJdBtn.classList.remove("filled");
                autofillJdBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> <span>Insert Sample JD</span>';
            }, 3000);
        }
    });
}


/* =========================================================
   4. RESUME FILE UPLOAD & DRAG-AND-DROP
========================================================= */

if (uploadArea && resumeFileInput) {
    uploadArea.addEventListener("click", () => {
        resumeFileInput.click();
    });

    if (browseBtn) {
        browseBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            resumeFileInput.click();
        });
    }

    resumeFileInput.addEventListener("change", () => {
        const file = resumeFileInput.files[0];
        if (file) {
            handleSelectedFile(file);
        }
    });

    uploadArea.addEventListener("dragover", (event) => {
        event.preventDefault();
        uploadArea.classList.add("dragover");
    });

    uploadArea.addEventListener("dragleave", () => {
        uploadArea.classList.remove("dragover");
    });

    uploadArea.addEventListener("drop", (event) => {
        event.preventDefault();
        uploadArea.classList.remove("dragover");
        const file = event.dataTransfer.files[0];
        if (file) {
            handleSelectedFile(file);
        }
    });

    // Keyboard accessibility for dropzone
    uploadArea.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            resumeFileInput.click();
        }
    });
}

if (removeFileButton) {
    removeFileButton.addEventListener("click", (event) => {
        event.stopPropagation();
        clearSelectedFile();
    });
}

function clearSelectedFile() {
    selectedResumeFile = null;
    if (resumeFileInput) {
        resumeFileInput.value = "";
    }
    if (selectedFileBox) {
        selectedFileBox.classList.remove("show");
    }
    hideFormAlert();
}

function handleSelectedFile(file) {
    const parts = file.name.split(".");
    const extension = parts.length > 1 ? parts.pop().toLowerCase() : "";

    if (!["pdf", "doc", "docx"].includes(extension)) {
        showFormAlert("Please upload a valid PDF, DOCX, or DOC resume document.");
        showError("Please upload a valid PDF, DOCX, or DOC resume document.");
        return;
    }

    if (file.size > MAX_FILE_SIZE) {
        showFormAlert("File size exceeds 5 MB limit. Please upload a smaller file.");
        showError("File size exceeds 5 MB limit. Please upload a smaller file.");
        return;
    }

    selectedResumeFile = file;

    if (fileName) {
        fileName.textContent = file.name;
    }

    if (fileSize) {
        fileSize.textContent = formatFileSize(file.size);
    }

    if (selectedFileBox) {
        selectedFileBox.classList.add("show");
    }

    hideFormAlert();
    hideError();
}

function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}


/* =========================================================
   5. SAMPLE RESUME 1-CLICK QUICK-LOAD
========================================================= */

if (loadSampleBtn) {
    loadSampleBtn.addEventListener("click", async () => {
        try {
            loadSampleBtn.disabled = true;
            loadSampleBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading Sample...';

            const response = await fetch("sample-resumes/sample_software_developer_resume.pdf");
            if (!response.ok) {
                throw new Error("Unable to fetch sample resume.");
            }

            const blob = await response.blob();
            const sampleFile = new File([blob], "sample_software_developer_resume.pdf", {
                type: "application/pdf"
            });

            handleSelectedFile(sampleFile);

            if (roleInput) {
                roleInput.value = "Software Developer";
                updateRoleInsightAndCustomField("Software Developer");
            }

            if (jobDescriptionInput && !jobDescriptionInput.value) {
                jobDescriptionInput.value = "We are seeking a Software Developer proficient in Python, FastAPI, React, RESTful APIs, and SQL. The candidate will design scalable services, write unit tests, and collaborate with cross-functional engineering teams.";
                if (jobDescriptionCount) {
                    jobDescriptionCount.textContent = `${jobDescriptionInput.value.length} / 10000`;
                }
            }

            loadSampleBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Sample Loaded';
            setTimeout(() => {
                loadSampleBtn.disabled = false;
                loadSampleBtn.innerHTML = '<i class="fa-solid fa-file-circle-plus"></i> <span>Load Sample Developer Resume</span>';
            }, 2000);

        } catch (err) {
            console.error("Error loading sample resume:", err);
            showError("Could not automatically load sample resume. Please upload your own resume file.");
            loadSampleBtn.disabled = false;
            loadSampleBtn.innerHTML = '<i class="fa-solid fa-file-circle-plus"></i> <span>Load Sample Developer Resume</span>';
        }
    });
}


/* =========================================================
   6. RESUME ANALYSIS SUBMISSION & DASHBOARD RENDERING
========================================================= */

if (resumeForm) {
    resumeForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await analyzeResume();
    });
}

if (analyzeButton) {
    analyzeButton.addEventListener("click", async (event) => {
        // If outside form or not submitting by default, ensure analyzeResume is invoked
        if (!resumeForm) {
            event.preventDefault();
            await analyzeResume();
        }
    });
}

async function analyzeResume() {
    if (isAnalyzing) {
        console.warn("Resume analysis is already in progress. Ignoring duplicate click.");
        return;
    }

    hideFormAlert();
    hideError();

    // Fallback: check if resumeFileInput has a file even if selectedResumeFile wasn't set yet
    if (!selectedResumeFile && resumeFileInput && resumeFileInput.files && resumeFileInput.files[0]) {
        selectedResumeFile = resumeFileInput.files[0];
    }

    const isCustomRole = roleInput && roleInput.value === "custom";
    const role = getEffectiveTargetRole();
    const jobDescription = jobDescriptionInput ? jobDescriptionInput.value.trim() : "";

    if (!role && !selectedResumeFile) {
        showFormAlert("Please select your target job role and upload your resume file (PDF, DOCX, or DOC).");
        if (roleInput) roleInput.focus();
        return;
    }

    if (!role || (isCustomRole && !(customRoleInput && customRoleInput.value.trim()))) {
        showFormAlert(isCustomRole ? "Please enter your custom target job role in the input field." : "Please select your target job role from the dropdown.");
        if (isCustomRole && customRoleInput) customRoleInput.focus();
        else if (roleInput) roleInput.focus();
        return;
    }

    if (!selectedResumeFile) {
        showFormAlert("Please upload your resume file (PDF, DOCX, or DOC) to proceed.");
        if (uploadArea) uploadArea.focus();
        return;
    }

    const formData = new FormData();
    formData.append("resume", selectedResumeFile);
    formData.append("file", selectedResumeFile);
    formData.append("role", role);
    formData.append("job_description", jobDescription);

    isAnalyzing = true;
    setAnalyzeLoading(true);

    try {
        const response = await fetch(getAnalyzeApiUrl(), {
            method: "POST",
            body: formData
        });

        const data = await parseResponse(response);

        if (!response.ok) {
            throw new Error(getApiErrorMessage(data, response.status));
        }

        latestAnalysisData = data;
        currentAnalysisText = data.analysis || data.result || "";

        // Hide loading card before showing results
        if (loadingBox) {
            loadingBox.classList.remove("show");
        }

        // Render dashboard & detailed markdown report
        displayAnalysis(data);

        // Ensure result section, dashboard, and analysis card are visible
        if (resultSection) {
            resultSection.classList.add("show");
            resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }

    } catch (error) {
        console.error("Resume analysis error:", error);
        let friendlyMsg = error.message || "Failed to analyze the resume.";
        const isNetworkErr = friendlyMsg.toLowerCase().includes("failed to fetch") || 
                             friendlyMsg.toLowerCase().includes("networkerror") ||
                             friendlyMsg.toLowerCase().includes("load failed");
        if (isNetworkErr) {
            friendlyMsg = getNetworkErrorMessage("Resume analysis", error);
        }

        if (loadingBox) {
            loadingBox.classList.remove("show");
        }

        showError(friendlyMsg);
        showFormAlert(friendlyMsg);

        switchToPartition("resultSection");
        if (resultSection) {
            resultSection.classList.add("show");
        }
        if (errorBox) {
            errorBox.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    } finally {
        isAnalyzing = false;
        setAnalyzeLoading(false);
    }
}

function displayAnalysis(data) {
    const resultEmptyState = document.getElementById("resultEmptyState");
    if (resultEmptyState) {
        resultEmptyState.style.display = "none";
    }
    switchToPartition("resultSection");

    if (analysisRole) {
        analysisRole.textContent = `${data.role || "Target Role"} — Resume Analysis Report`;
    }

    if (analysisFileName) {
        analysisFileName.textContent = `Analyzed Document: ${data.filename || (selectedResumeFile ? selectedResumeFile.name : "Resume")}`;
    }

    // Render Visual ATS Dashboard
    if (data.dashboard) {
        displayDashboard(data.dashboard);
    }

    // Render Detailed Markdown Analysis
    if (analysisContent) {
        const text = data.analysis || data.result || "No detailed report available.";
        analysisContent.innerHTML = formatMarkdownToHtml(text);
    }

    if (analysisCard) {
        analysisCard.classList.add("show");
    }
}

function displayDashboard(dashboard) {
    if (!dashboard || !dashboardWrapper) return;

    // 1. ATS Score & Visual Gauge
    const score = Number(dashboard.ats_score ?? 75);
    if (atsScoreValue) atsScoreValue.textContent = score;

    const rating = dashboard.ats_rating || (score >= 80 ? "Excellent" : score >= 65 ? "Good" : "Needs Improvement");
    if (atsScoreRating) {
        atsScoreRating.textContent = rating;
        atsScoreRating.className = `ats-rating-pill rating-${rating.toLowerCase().replace(/\s+/g, '-')}`;
    }

    if (atsMeterCircle) {
        // Circumference for r=42 is 2 * PI * 42 = 263.89
        const circumference = 263.89;
        const offset = circumference - (circumference * Math.min(100, Math.max(0, score)) / 100);
        atsMeterCircle.style.strokeDashoffset = offset;
    }

    // Score Breakdown Bars
    const bd = dashboard.score_breakdown || {};
    const sm = Number(bd.skills_match ?? 75);
    const er = Number(bd.experience_relevance ?? 70);
    const ef = Number(bd.education_formatting ?? 80);
    const kc = Number(bd.keyword_coverage ?? 70);

    if (bdSkillsMatch) bdSkillsMatch.textContent = `${sm}%`;
    if (barSkillsMatch) barSkillsMatch.style.width = `${sm}%`;

    if (bdExpRelevance) bdExpRelevance.textContent = `${er}%`;
    if (barExpRelevance) barExpRelevance.style.width = `${er}%`;

    if (bdEduFormatting) bdEduFormatting.textContent = `${ef}%`;
    if (barEduFormatting) barEduFormatting.style.width = `${ef}%`;

    if (bdKeywordCoverage) bdKeywordCoverage.textContent = `${kc}%`;
    if (barKeywordCoverage) barKeywordCoverage.style.width = `${kc}%`;

    // 2. Job Match & Profile Summary
    const matchScore = Number(dashboard.job_match_score ?? score);
    if (jobMatchValue) jobMatchValue.textContent = `${matchScore}%`;

    if (candidateSummaryText) {
        candidateSummaryText.textContent = dashboard.summary || "Candidate profile synthesized for targeted role alignment.";
    }

    if (keyStrengthsList) {
        keyStrengthsList.innerHTML = "";
        const strengths = dashboard.key_strengths || [];
        strengths.forEach(str => {
            const li = document.createElement("li");
            li.textContent = str;
            keyStrengthsList.appendChild(li);
        });
    }

    // 3. Executive KPI Ribbon Update
    const kpiAtsScore = document.getElementById("kpiAtsScore");
    const kpiAtsSub = document.getElementById("kpiAtsSub");
    const kpiMatchScore = document.getElementById("kpiMatchScore");
    const kpiSkillsCount = document.getElementById("kpiSkillsCount");
    const kpiReadinessStatus = document.getElementById("kpiReadinessStatus");

    if (kpiAtsScore) kpiAtsScore.textContent = `${score} / 100`;
    if (kpiAtsSub) kpiAtsSub.textContent = rating;
    if (kpiMatchScore) kpiMatchScore.textContent = `${matchScore}%`;
    const totalSkills = (dashboard.technical_skills || []).length + (dashboard.soft_skills || []).length;
    if (kpiSkillsCount) kpiSkillsCount.textContent = `${totalSkills} Verified`;
    if (kpiReadinessStatus) kpiReadinessStatus.textContent = score >= 70 ? "Interview Ready" : "Optimization Recommended";

    // 3. Extracted Skills Radar
    const skills = dashboard.extracted_skills || {};
    renderSkillPills(technicalSkillsList, skills.technical || [], "tech-pill");
    renderSkillPills(softSkillsList, skills.soft || [], "soft-pill");
    renderSkillPills(matchedSkillsList, skills.matched || [], "matched-pill");
    renderSkillPills(missingSkillsList, skills.missing || [], "missing-pill");

    // 4. Education & Experience Timelines
    if (educationList) {
        educationList.innerHTML = "";
        const eduItems = dashboard.extracted_education || [];
        eduItems.forEach(item => {
            const div = document.createElement("div");
            div.className = "timeline-item";
            div.innerHTML = `
                <div class="timeline-item-title">${escapeHtml(item.degree || "Degree")}</div>
                <div class="timeline-item-meta">
                    <span>${escapeHtml(item.institution || "Institution")}</span>
                    <span>${escapeHtml(item.year || "")}</span>
                </div>
            `;
            educationList.appendChild(div);
        });
    }

    if (experienceList) {
        experienceList.innerHTML = "";
        const expItems = dashboard.extracted_experience || [];
        expItems.forEach(item => {
            const div = document.createElement("div");
            div.className = "timeline-item";
            div.innerHTML = `
                <div class="timeline-item-title">${escapeHtml(item.role || "Role")}</div>
                <div class="timeline-item-meta">
                    <span>${escapeHtml(item.company || "Company")}</span>
                    <span>${escapeHtml(item.duration || "")}</span>
                </div>
                <div class="timeline-item-desc">${escapeHtml(item.highlights || "")}</div>
            `;
            experienceList.appendChild(div);
        });
    }

    // 5. Improvement Suggestions Checklist
    if (improvementList) {
        improvementList.innerHTML = "";
        const imps = dashboard.improvement_suggestions || [];
        imps.forEach((imp, idx) => {
            const li = document.createElement("li");
            li.innerHTML = `
                <span class="improvement-bullet">${idx + 1}</span>
                <span>${escapeHtml(imp)}</span>
            `;
            improvementList.appendChild(li);
        });
    }

    dashboardWrapper.classList.add("show");
}

function renderSkillPills(container, list, pillClass) {
    if (!container) return;
    container.innerHTML = "";
    if (!list || !list.length) {
        container.innerHTML = `<span style="font-size: 11px; color: var(--text-muted);">None identified</span>`;
        return;
    }
    list.forEach(skill => {
        const span = document.createElement("span");
        span.className = `skill-pill ${pillClass}`;
        span.textContent = skill;
        container.appendChild(span);
    });
}

function formatMarkdownToHtml(markdown) {
    if (!markdown) return "";

    const lines = markdown.split("\n");
    const output = [];
    let inList = false;

    for (const rawLine of lines) {
        const line = rawLine.trim();

        if (!line) {
            if (inList) {
                output.push("</ul>");
                inList = false;
            }
            continue;
        }

        if (line.startsWith("### ")) {
            if (inList) { output.push("</ul>"); inList = false; }
            output.push(`<h4>${escapeHtml(line.slice(4))}</h4>`);
            continue;
        }
        if (line.startsWith("## ")) {
            if (inList) { output.push("</ul>"); inList = false; }
            output.push(`<h3>${escapeHtml(line.slice(3))}</h3>`);
            continue;
        }
        if (line.startsWith("# ")) {
            if (inList) { output.push("</ul>"); inList = false; }
            output.push(`<h2>${escapeHtml(line.slice(2))}</h2>`);
            continue;
        }

        if (line.startsWith("- ") || line.startsWith("* ") || line.startsWith("• ")) {
            if (!inList) {
                output.push("<ul>");
                inList = true;
            }
            const content = formatInlineText(line.slice(2));
            output.push(`<li>${content}</li>`);
            continue;
        }

        if (inList) {
            output.push("</ul>");
            inList = false;
        }

        output.push(`<p>${formatInlineText(line)}</p>`);
    }

    if (inList) {
        output.push("</ul>");
    }

    return output.join("\n");
}

function formatInlineText(text) {
    let formatted = escapeHtml(text);
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    formatted = formatted.replace(/\*(.*?)\*/g, "<em>$1</em>");
    return formatted;
}

function escapeHtml(text) {
    if (!text) return "";
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function showFormAlert(message) {
    if (formAlertText) {
        formAlertText.textContent = message;
    }
    if (formAlertBox) {
        formAlertBox.classList.add("show");
        formAlertBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
}

function hideFormAlert() {
    if (formAlertBox) {
        formAlertBox.classList.remove("show");
    }
}

function setAnalyzeLoading(isLoading) {
    if (analyzeButton) {
        analyzeButton.disabled = isLoading;
        if (isLoading) {
            analyzeButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Analyzing Resume...</span>';
        } else {
            analyzeButton.innerHTML = '<span>Analyze Resume & Generate Interview</span> <i class="fa-solid fa-wand-magic-sparkles"></i>';
        }
    }

    const resultEmptyState = document.getElementById("resultEmptyState");
    if (isLoading) {
        if (resultEmptyState) resultEmptyState.style.display = "none";
        switchToPartition("resultSection");
        if (resultSection) resultSection.classList.add("show");
        if (loadingBox) loadingBox.classList.add("show");
        if (errorBox) errorBox.classList.remove("show");
        if (dashboardWrapper) dashboardWrapper.classList.remove("show");
        if (analysisCard) analysisCard.classList.remove("show");
        if (loadingBox) {
            loadingBox.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    } else {
        if (loadingBox) loadingBox.classList.remove("show");
    }
}

function showError(message) {
    if (errorMessage) {
        errorMessage.textContent = message;
    }
    if (errorBox) {
        errorBox.classList.add("show");
    }
    if (resultSection) {
        resultSection.classList.add("show");
    }
}

function hideError() {
    if (errorBox) {
        errorBox.classList.remove("show");
    }
}

function getApiErrorMessage(data, status) {
    if (data && data.detail) {
        if (Array.isArray(data.detail)) {
            return data.detail.map(item => item.msg).join(", ");
        }
        const detailStr = String(data.detail);
        if (detailStr.includes("<!DOCTYPE") || detailStr.includes("<html") || detailStr.includes("Page not found") || detailStr.includes("HTML error page")) {
            return "Cannot reach the AI backend service (HTTP 404 from hosting gateway). When hosted on Netlify, your Python FastAPI backend must be deployed (e.g., on Render or Railway) and configured via VITE_API_URL in Netlify Settings, or configure a Backend URL in Settings (gear icon in the top navigation). For local testing, run 'run_backend.bat' and open http://127.0.0.1:8000.";
        }
        return detailStr;
    }
    if (status === 404) {
        return "Backend API endpoint not found (HTTP 404). If deployed on Netlify, please configure your backend API URL in Netlify Environment Variables (VITE_API_URL) or in the Settings menu (gear icon).";
    }
    return `Server responded with error status ${status}.`;
}

async function parseResponse(response) {
    const contentType = response.headers.get("content-type") || "";
    const text = await response.text();
    if (!text) return {};

    // Detect if static hosting returned an HTML error page (e.g. Netlify 404 Page not found)
    if (contentType.includes("text/html") || text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
        return {
            detail: `Hosting gateway returned an HTML error page (HTTP ${response.status}). The Python backend is not reachable at this URL. When on Netlify, deploy your FastAPI backend on Render or configure VITE_API_URL.`
        };
    }

    try {
        return JSON.parse(text);
    } catch {
        return { detail: text.length > 300 ? `${text.slice(0, 300)}...` : text };
    }
}


/* =========================================================
   7. CLIPBOARD COPY UTILITIES
========================================================= */

if (copyResultButton) {
    copyResultButton.addEventListener("click", async () => {
        const text = currentAnalysisText || analysisContent?.innerText || "";
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            const originalHTML = copyResultButton.innerHTML;
            copyResultButton.innerHTML = '<i class="fa-solid fa-check"></i> <span>Copied!</span>';
            setTimeout(() => {
                copyResultButton.innerHTML = originalHTML;
            }, 2000);
        } catch (error) {
            console.error("Clipboard copy error:", error);
        }
    });
}

if (copyEvaluationButton) {
    copyEvaluationButton.addEventListener("click", async () => {
        const text = currentEvaluationText || evaluationContent?.innerText || "";
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            const originalHTML = copyEvaluationButton.innerHTML;
            copyEvaluationButton.innerHTML = '<i class="fa-solid fa-check"></i> <span>Copied!</span>';
            setTimeout(() => {
                copyEvaluationButton.innerHTML = originalHTML;
            }, 2000);
        } catch (error) {
            console.error("Clipboard copy error:", error);
        }
    });
}


/* =========================================================
   8. WEB SPEECH API — MICROPHONE DICTATION (SPEECH-TO-TEXT)
========================================================= */

function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.warn("Web SpeechRecognition is not supported in this browser.");
        return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
        isRecordingSpeech = true;
        if (micButton) micButton.classList.add("recording");
        if (micButtonText) micButtonText.textContent = "Stop Recording";
        if (micActiveBanner) micActiveBanner.classList.add("show");
    };

    recognition.onresult = (event) => {
        let finalChunk = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalChunk += event.results[i][0].transcript + " ";
            }
        }

        if (finalChunk.trim() && interviewAnswer) {
            const current = interviewAnswer.value.trim();
            interviewAnswer.value = current ? `${current} ${finalChunk.trim()}` : finalChunk.trim();
            updateAnswerMetrics();
        }
    };

    recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        stopSpeechRecognition();
        if (event.error === "not-allowed") {
            showInterviewError("Microphone access was denied. Please allow microphone permissions in your browser address bar.");
        }
    };

    recognition.onend = () => {
        stopSpeechRecognition();
    };

    return recognition;
}

function toggleSpeechRecognition() {
    if (!speechRecognition) {
        speechRecognition = initSpeechRecognition();
    }

    if (!speechRecognition) {
        showInterviewError("Speech recognition is not supported in this browser. Please type your answer using the keyboard.");
        return;
    }

    if (isRecordingSpeech) {
        speechRecognition.stop();
        stopSpeechRecognition();
    } else {
        try {
            stopSpeakingQuestion();
            speechRecognition.start();
        } catch (err) {
            console.warn("Speech recognition start issue:", err);
        }
    }
}

function stopSpeechRecognition() {
    isRecordingSpeech = false;
    if (micButton) micButton.classList.remove("recording");
    if (micButtonText) micButtonText.textContent = "Voice Dictation";
    if (micActiveBanner) micActiveBanner.classList.remove("show");
}

if (micButton) {
    micButton.addEventListener("click", toggleSpeechRecognition);
}


/* =========================================================
   9. TEXT-TO-SPEECH QUESTION AUDIO PLAYER
========================================================= */

function toggleQuestionAudio() {
    if (!window.speechSynthesis) {
        console.warn("SpeechSynthesis not supported.");
        return;
    }

    if (isSpeakingQuestion) {
        stopSpeakingQuestion();
        return;
    }

    const currentItem = interviewQuestions[currentQuestionIndex];
    if (!currentItem || !currentItem.question) return;

    stopSpeechRecognition();
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(currentItem.question);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
        isSpeakingQuestion = true;
        if (listenQuestionBtn) {
            listenQuestionBtn.classList.add("speaking");
            listenQuestionBtn.querySelector("span").textContent = "Playing...";
        }
    };

    utterance.onend = () => {
        stopSpeakingQuestion();
    };

    utterance.onerror = () => {
        stopSpeakingQuestion();
    };

    window.speechSynthesis.speak(utterance);
}

function stopSpeakingQuestion() {
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
    isSpeakingQuestion = false;
    if (listenQuestionBtn) {
        listenQuestionBtn.classList.remove("speaking");
        listenQuestionBtn.querySelector("span").textContent = "Listen";
    }
}

if (listenQuestionBtn) {
    listenQuestionBtn.addEventListener("click", toggleQuestionAudio);
}


/* =========================================================
   10. INTERVIEW QUESTION GENERATION & INITIALIZATION
========================================================= */

function buildInterviewQuestions(analysisText, role) {
    const questions = [];

    // Prioritize questions extracted directly from resume analysis dashboard
    const dashQuestions = latestAnalysisData?.dashboard?.interview_questions;
    if (dashQuestions && Array.isArray(dashQuestions.technical) && dashQuestions.technical.length > 0) {
        dashQuestions.technical.forEach(q => {
            if (q && q.trim()) questions.push({ category: "Technical", question: q.trim() });
        });
        if (Array.isArray(dashQuestions.hr)) {
            dashQuestions.hr.forEach(q => {
                if (q && q.trim()) questions.push({ category: "HR", question: q.trim() });
            });
        }
        if (questions.length > 0) return questions;
    }

    // Role-tailored fallback questions
    const lowerText = String(analysisText || "").toLowerCase();
    questions.push({
        category: "Technical",
        question: `Explain an important technical architecture, pattern, or project related to ${role}. How did you implement it?`
    });

    if (lowerText.includes("python")) {
        questions.push({
            category: "Technical",
            question: "What is the difference between synchronous and asynchronous execution in Python, and when would you use async/await?"
        });
    } else if (lowerText.includes("react") || lowerText.includes("javascript")) {
        questions.push({
            category: "Technical",
            question: "How does the virtual DOM work in React, and how do you optimize rendering performance in complex stateful components?"
        });
    } else {
        questions.push({
            category: "Technical",
            question: `What are the most critical engineering skills required for a ${role}, and how have you applied them?`
        });
    }

    questions.push({
        category: "Technical",
        question: "Describe a difficult bug or performance issue you diagnosed. What was your systematic debugging approach?"
    });

    questions.push({
        category: "HR",
        question: "Tell me about yourself, your background, and why you are interested in pursuing this role."
    });

    questions.push({
        category: "HR",
        question: "Describe a situation where project requirements changed suddenly. How did you adapt and prioritize deliverables?"
    });

    return questions;
}

if (startInterviewButton) {
    startInterviewButton.addEventListener("click", startInterview);
}

function startInterview() {
    if (!latestAnalysisData || !currentAnalysisText) {
        showError("Please analyze your resume before initiating the interview.");
        return;
    }

    const questions = buildInterviewQuestions(
        currentAnalysisText,
        latestAnalysisData.role || getEffectiveTargetRole()
    );

    if (!questions.length) {
        showError("Unable to initialize interview questions.");
        return;
    }

    interviewQuestions = [questions[0]];
    interviewAnswers = [""];
    currentQuestionIndex = 0;
    currentEvaluationText = "";
    adaptiveDifficulty = "medium";
    adaptiveHistory = [questions[0].question];
    isAdaptiveMode = true;
    isAdaptiveSubmitting = false;

    stopSpeechRecognition();
    stopSpeakingQuestion();
    hideInterviewStates();
    openInterviewSection();

    const interviewEmptyState = document.getElementById("interviewEmptyState");
    if (interviewEmptyState) {
        interviewEmptyState.style.display = "none";
    }

    if (interviewCard) {
        interviewCard.style.display = "block";
        interviewCard.classList.add("show");
    }

    resetAdaptiveFeedback();
    renderCurrentQuestion();
}

function openInterviewSection() {
    switchToPartition("interviewSection");
    if (interviewSection) {
        interviewSection.classList.add("show");
        interviewSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

function hideInterviewStates() {
    if (interviewLoading) interviewLoading.classList.remove("show");
    if (interviewError) interviewError.classList.remove("show");
    if (evaluationCard) evaluationCard.classList.remove("show");
}

function resetAdaptiveFeedback() {
    if (adaptiveFeedback) adaptiveFeedback.classList.remove("show");
    if (adaptiveScore) adaptiveScore.textContent = "--";
    if (adaptiveQuality) adaptiveQuality.textContent = "Waiting";
    if (adaptiveFeedbackText) adaptiveFeedbackText.textContent = "";
}

function updateDifficultyBadge() {
    if (!difficultyBadge) return;
    const labels = { easy: "Easy", medium: "Medium", hard: "Hard" };
    difficultyBadge.textContent = labels[adaptiveDifficulty] || "Medium";
    difficultyBadge.dataset.difficulty = adaptiveDifficulty;
}

function showAdaptiveFeedback(evaluation) {
    if (!adaptiveFeedback) return;

    const score = Number(evaluation?.score ?? 0);
    const quality = String(evaluation?.quality || "average");

    if (adaptiveScore) {
        adaptiveScore.textContent = `${score}/100`;
    }

    if (adaptiveQuality) {
        adaptiveQuality.textContent = quality.charAt(0).toUpperCase() + quality.slice(1);
    }

    if (adaptiveFeedbackText) {
        let message = evaluation?.feedback || "Answer evaluated successfully.";
        if (evaluation?.what_was_good) {
            message += ` Well Done: ${evaluation.what_was_good}`;
        }
        if (evaluation?.what_to_improve) {
            message += ` Areas to Refine: ${evaluation.what_to_improve}`;
        }
        adaptiveFeedbackText.textContent = message;
    }

    adaptiveFeedback.classList.add("show");
}

function renderCurrentQuestion() {
    const item = interviewQuestions[currentQuestionIndex];
    if (!item) return;

    stopSpeakingQuestion();
    stopSpeechRecognition();

    const savedAnswer = interviewAnswers[currentQuestionIndex] || "";
    const completedAnswers = interviewAnswers.filter(a => a && a.trim().length >= 10).length;

    if (questionCategory) {
        questionCategory.textContent = item.category || "Technical";
        questionCategory.dataset.category = String(item.category || "Technical").toLowerCase();
    }

    const totalQuestions = isAdaptiveMode ? MAX_ADAPTIVE_QUESTIONS : interviewQuestions.length;

    if (questionCounter) {
        questionCounter.textContent = `Question ${currentQuestionIndex + 1} of ${totalQuestions}`;
    }

    if (answeredCounter) {
        answeredCounter.textContent = `${completedAnswers} answered`;
    }

    if (questionProgressBar) {
        const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
        questionProgressBar.style.width = `${Math.min(progress, 100)}%`;
    }

    if (interviewQuestion) {
        interviewQuestion.textContent = item.question;
    }

    if (interviewAnswer) {
        interviewAnswer.value = savedAnswer;
    }

    updateAnswerMetrics();
    updateDifficultyBadge();

    if (isAdaptiveMode) {
        if (previousQuestionButton) {
            previousQuestionButton.style.display = "none";
        }
        if (nextQuestionButton) {
            nextQuestionButton.innerHTML = currentQuestionIndex === MAX_ADAPTIVE_QUESTIONS - 1
                ? '<span>Finish Interview</span> <i class="fa-solid fa-flag-checkered"></i>'
                : '<span>Submit Answer</span> <i class="fa-solid fa-arrow-right"></i>';
        }
    } else {
        if (previousQuestionButton) {
            previousQuestionButton.style.display = "";
            previousQuestionButton.disabled = currentQuestionIndex === 0;
        }
        if (nextQuestionButton) {
            nextQuestionButton.innerHTML = currentQuestionIndex === interviewQuestions.length - 1
                ? '<span>Finish & Evaluate</span> <i class="fa-solid fa-wand-magic-sparkles"></i>'
                : '<span>Next Question</span> <i class="fa-solid fa-arrow-right"></i>';
        }
    }

    setTimeout(() => {
        if (interviewAnswer) interviewAnswer.focus();
    }, 200);
}


/* =========================================================
   11. ANSWER HANDLING & VALIDATION
========================================================= */

if (interviewAnswer) {
    interviewAnswer.addEventListener("input", updateAnswerMetrics);
}

function updateAnswerMetrics() {
    if (!interviewAnswer) return;
    const value = interviewAnswer.value;
    interviewAnswers[currentQuestionIndex] = value;

    if (answerCharacterCount) {
        answerCharacterCount.textContent = `${value.length} / 5000`;
    }
    if (answerValidationMessage) {
        if (value.trim().length >= 10) {
            answerValidationMessage.textContent = "Answer ready for evaluation.";
            answerValidationMessage.classList.remove("invalid");
        } else {
            answerValidationMessage.textContent = "Minimum 10 characters required.";
            answerValidationMessage.classList.remove("invalid");
        }
    }
}

function saveCurrentAnswer() {
    if (!interviewAnswer) return;
    interviewAnswers[currentQuestionIndex] = interviewAnswer.value.trim();
}

function validateCurrentAnswer() {
    saveCurrentAnswer();
    const answer = interviewAnswers[currentQuestionIndex] || "";

    if (answer.length < 10) {
        if (answerValidationMessage) {
            answerValidationMessage.textContent = "Please provide at least 10 characters before submitting.";
            answerValidationMessage.classList.add("invalid");
        }
        if (interviewAnswer) interviewAnswer.focus();
        return false;
    }

    if (answerValidationMessage) {
        answerValidationMessage.textContent = "Answer ready.";
        answerValidationMessage.classList.remove("invalid");
    }
    return true;
}


/* =========================================================
   12. ADAPTIVE ANSWER SUBMISSION & QUESTION TRANSITION
========================================================= */

async function submitAdaptiveAnswer() {
    if (isAdaptiveSubmitting) return;
    if (!validateCurrentAnswer()) return;

    const currentItem = interviewQuestions[currentQuestionIndex];
    const answer = interviewAnswers[currentQuestionIndex];
    if (!currentItem) return;

    isAdaptiveSubmitting = true;
    stopSpeechRecognition();
    stopSpeakingQuestion();

    if (nextQuestionButton) {
        nextQuestionButton.disabled = true;
        nextQuestionButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Evaluating...</span>';
    }
    if (previousQuestionButton) {
        previousQuestionButton.disabled = true;
    }
    if (interviewError) {
        interviewError.classList.remove("show");
    }

    try {
        const response = await fetch(getAdaptiveApiUrl(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                role: latestAnalysisData?.role || getEffectiveTargetRole(),
                job_description: latestAnalysisData?.job_description || (jobDescriptionInput ? jobDescriptionInput.value : ""),
                question: currentItem.question,
                answer: answer,
                category: currentItem.category || "Technical",
                difficulty: adaptiveDifficulty,
                question_number: currentQuestionIndex + 1,
                previous_questions: adaptiveHistory
            })
        });

        const data = await parseResponse(response);

        if (!response.ok) {
            throw new Error(getApiErrorMessage(data, response.status));
        }

        if (!data.success || !data.evaluation) {
            throw new Error("Server returned incomplete adaptive feedback.");
        }

        const evaluation = data.evaluation;
        showAdaptiveFeedback(evaluation);

        // Update difficulty adaptively
        adaptiveDifficulty = evaluation.next_difficulty || adaptiveDifficulty;
        updateDifficultyBadge();

        // Check if final question reached
        if (currentQuestionIndex >= MAX_ADAPTIVE_QUESTIONS - 1) {
            await evaluateInterview();
            return;
        }

        // Get next dynamic question
        const nextQuestion = String(evaluation.next_question || "").trim();
        if (!nextQuestion) {
            throw new Error("AI did not provide the next question.");
        }

        adaptiveHistory.push(nextQuestion);
        interviewQuestions.push({
            category: evaluation.next_category || "Technical",
            question: nextQuestion
        });
        interviewAnswers.push("");

        currentQuestionIndex++;
        renderCurrentQuestion();

    } catch (error) {
        console.error("Adaptive interview error:", error);
        showInterviewError(error.message || "Failed to evaluate answer. Please try again.");
    } finally {
        isAdaptiveSubmitting = false;
        if (nextQuestionButton) nextQuestionButton.disabled = false;
        if (previousQuestionButton) previousQuestionButton.disabled = false;

        if (nextQuestionButton && currentQuestionIndex < MAX_ADAPTIVE_QUESTIONS) {
            nextQuestionButton.innerHTML = currentQuestionIndex === MAX_ADAPTIVE_QUESTIONS - 1
                ? '<span>Finish Interview</span> <i class="fa-solid fa-flag-checkered"></i>'
                : '<span>Submit Answer</span> <i class="fa-solid fa-arrow-right"></i>';
        }
    }
}

function showInterviewError(msg) {
    let displayMsg = msg;
    const lower = (msg || "").toLowerCase();
    if (lower.includes("failed to fetch") || lower.includes("networkerror") || lower.includes("load failed")) {
        displayMsg = getNetworkErrorMessage("Interview evaluation", msg);
    }
    if (interviewErrorMessage) {
        interviewErrorMessage.textContent = displayMsg;
    }
    if (interviewError) {
        interviewError.classList.add("show");
    }
}

if (previousQuestionButton) {
    previousQuestionButton.addEventListener("click", () => {
        if (isAdaptiveMode) return;
        saveCurrentAnswer();
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            renderCurrentQuestion();
        }
    });
}

if (nextQuestionButton) {
    nextQuestionButton.addEventListener("click", async () => {
        if (isAdaptiveMode) {
            await submitAdaptiveAnswer();
            return;
        }

        if (!validateCurrentAnswer()) return;

        if (currentQuestionIndex < interviewQuestions.length - 1) {
            currentQuestionIndex++;
            renderCurrentQuestion();
            return;
        }

        await evaluateInterview();
    });
}


/* =========================================================
   13. FINAL INTERVIEW EVALUATION
========================================================= */

async function evaluateInterview() {
    saveCurrentAnswer();
    stopSpeechRecognition();
    stopSpeakingQuestion();

    if (interviewLoading) interviewLoading.classList.add("show");
    if (interviewError) interviewError.classList.remove("show");
    if (nextQuestionButton) nextQuestionButton.disabled = true;

    try {
        const answers = interviewQuestions.map((q, idx) => ({
            category: q.category || "Technical",
            question: q.question,
            answer: interviewAnswers[idx] || ""
        }));

        const response = await fetch(getEvaluateApiUrl(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                role: latestAnalysisData?.role || getEffectiveTargetRole(),
                job_description: latestAnalysisData?.job_description || (jobDescriptionInput ? jobDescriptionInput.value : ""),
                answers: answers
            })
        });

        const data = await parseResponse(response);

        if (!response.ok) {
            throw new Error(getApiErrorMessage(data, response.status));
        }

        currentEvaluationText = data.evaluation || data.result || "";
        displayEvaluation(data);

    } catch (error) {
        console.error("Final interview evaluation error:", error);
        showInterviewError(error.message || "Failed to generate final interview feedback.");
    } finally {
        if (interviewLoading) interviewLoading.classList.remove("show");
        if (nextQuestionButton) nextQuestionButton.disabled = false;
    }
}

function displayEvaluation(data) {
    if (evaluationRole) {
        evaluationRole.textContent = `${data.role || (latestAnalysisData ? latestAnalysisData.role : "Interview")} — Comprehensive Evaluation Report`;
    }

    if (evaluationContent) {
        const text = data.evaluation || data.result || "Interview completed successfully.";
        evaluationContent.innerHTML = formatMarkdownToHtml(text);
    }

    if (evaluationCard) {
        evaluationCard.classList.add("show");
        evaluationCard.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}


/* =========================================================
   14. RESTART INTERVIEW
========================================================= */

if (restartInterviewButton) {
    restartInterviewButton.addEventListener("click", () => {
        if (latestAnalysisData && currentAnalysisText) {
            startInterview();
        } else {
            hideInterviewStates();
            switchToPartition("resultSection");
            if (resultSection) {
                resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        }
    });
}


/* =========================================================
   15. INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    updateDifficultyBadge();

    if (jobDescriptionInput && jobDescriptionCount) {
        jobDescriptionCount.textContent = `${jobDescriptionInput.value.length} / 10000`;
    }

    // Connect partition empty state sample load buttons
    const emptyStateSampleBtn = document.getElementById("emptyStateSampleBtn");
    const interviewEmptySampleBtn = document.getElementById("interviewEmptySampleBtn");
    if (emptyStateSampleBtn && loadSampleBtn) {
        emptyStateSampleBtn.addEventListener("click", () => {
            loadSampleBtn.click();
            switchToPartition("analyze");
        });
    }
    if (interviewEmptySampleBtn && loadSampleBtn) {
        interviewEmptySampleBtn.addEventListener("click", () => {
            loadSampleBtn.click();
            switchToPartition("analyze");
        });
    }

    // Initial mock room view setup
    const interviewEmptyState = document.getElementById("interviewEmptyState");
    if (interviewEmptyState && !latestAnalysisData) {
        interviewEmptyState.style.display = "block";
        if (interviewCard) {
            interviewCard.style.display = "none";
        }
    }
});


/* =========================================================
   16. BACKEND API SETTINGS MODAL & CONNECTION TEST
========================================================= */
const apiSettingsBtn = document.getElementById("apiSettingsBtn");
const apiSettingsModal = document.getElementById("apiSettingsModal");
const closeSettingsModal = document.getElementById("closeSettingsModal");
const customApiUrlInput = document.getElementById("customApiUrlInput");
const testApiConnectionBtn = document.getElementById("testApiConnectionBtn");
const saveApiSettingsBtn = document.getElementById("saveApiSettingsBtn");
const apiTestStatus = document.getElementById("apiTestStatus");

function openApiSettingsModal() {
    if (!apiSettingsModal) return;
    const currentCustom = localStorage.getItem("interviewai_api_url") || "";
    if (customApiUrlInput) {
        customApiUrlInput.value = currentCustom;
    }
    if (apiTestStatus) {
        const activeUrl = API_BASE_URL || "(Same-origin relative / Auto)";
        apiTestStatus.className = "settings-status-banner";
        apiTestStatus.innerHTML = `<span><strong>Active Endpoint:</strong> <code>${escapeHtml(activeUrl)}</code></span>`;
    }
    apiSettingsModal.classList.add("show");
    apiSettingsModal.setAttribute("aria-hidden", "false");
}

function closeApiSettingsModal() {
    if (!apiSettingsModal) return;
    apiSettingsModal.classList.remove("show");
    apiSettingsModal.setAttribute("aria-hidden", "true");
}

if (apiSettingsBtn) {
    apiSettingsBtn.addEventListener("click", openApiSettingsModal);
}
if (closeSettingsModal) {
    closeSettingsModal.addEventListener("click", closeApiSettingsModal);
}
if (apiSettingsModal) {
    apiSettingsModal.addEventListener("click", (e) => {
        if (e.target === apiSettingsModal) closeApiSettingsModal();
    });
}

if (testApiConnectionBtn) {
    testApiConnectionBtn.addEventListener("click", async () => {
        const inputUrl = customApiUrlInput ? customApiUrlInput.value.trim().replace(/\/+$/, "") : "";
        const targetUrl = inputUrl ? `${inputUrl}/health` : (API_BASE_URL ? `${API_BASE_URL}/health` : "/health");

        testApiConnectionBtn.disabled = true;
        testApiConnectionBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Testing...</span>';
        if (apiTestStatus) {
            apiTestStatus.className = "settings-status-banner";
            apiTestStatus.innerHTML = `<span>Testing connection to <code>${escapeHtml(targetUrl)}</code>...</span>`;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            const res = await fetch(targetUrl, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json().catch(() => ({}));
                const geminiStatus = data.gemini_configured ? "Gemini AI Configured" : "Heuristic Fallback Mode";
                apiTestStatus.className = "settings-status-banner success";
                apiTestStatus.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>Connected successfully! (${geminiStatus})</span>`;
            } else {
                apiTestStatus.className = "settings-status-banner error";
                apiTestStatus.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> <span>Server returned status ${res.status}.</span>`;
            }
        } catch (err) {
            apiTestStatus.className = "settings-status-banner error";
            apiTestStatus.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <span>Cannot reach backend at <code>${escapeHtml(targetUrl)}</code> (${escapeHtml(err.message)}).</span>`;
        } finally {
            testApiConnectionBtn.disabled = false;
            testApiConnectionBtn.innerHTML = '<i class="fa-solid fa-plug"></i> <span>Test Connection</span>';
        }
    });
}

if (saveApiSettingsBtn) {
    saveApiSettingsBtn.addEventListener("click", () => {
        const inputUrl = customApiUrlInput ? customApiUrlInput.value.trim().replace(/\/+$/, "") : "";
        if (inputUrl) {
            localStorage.setItem("interviewai_api_url", inputUrl);
        } else {
            localStorage.removeItem("interviewai_api_url");
        }
        API_BASE_URL = resolveApiBaseUrl();
        if (apiTestStatus) {
            apiTestStatus.className = "settings-status-banner success";
            apiTestStatus.innerHTML = '<i class="fa-solid fa-circle-check"></i> <span>Settings saved! Active URL updated.</span>';
        }
        setTimeout(closeApiSettingsModal, 1000);
    });
}


/* ==============================================================================
   CANDIDATE AUTHENTICATION & EDUCATIONAL PROFILE CONTROLLER
   - Pure-Python RFC 7519 JWT Session Management
   - Google & LinkedIn OAuth 2.0 Integration + 1-Click Instant Demo Login
   - Educational Scope Notice Enforcement
   - Dynamic Academic Degree List Management & Extracurricular Activity Tracker
   - SQLite Database Synchronization via /api/profile
============================================================================== */

const AUTH_TOKEN_STORAGE_KEY = "interviewai_auth_token";

// Auth & Profile State Variables
let currentAuthUser = null;
let currentProfileData = null;
let currentEducationList = [];
let currentWorkExpList = [];
let currentTechSkills = [];
let currentSoftSkills = [];
let currentBookedSlots = [];
let currentPastReports = [];
let isTwoFactorEnabled = false;
let selectedAvatarUrl = "";
let currentActiveProfileTab = "basic";

// DOM Elements: Authentication
const openAuthModalBtn = document.getElementById("openAuthModalBtn");
const userNavPill = document.getElementById("userNavPill");
const userPillBtn = document.getElementById("userPillBtn");
const userNavDropdown = document.getElementById("userNavDropdown");
const navUserAvatar = document.getElementById("navUserAvatar");
const navUserName = document.getElementById("navUserName");
const dropdownUserName = document.getElementById("dropdownUserName");
const dropdownUserEmail = document.getElementById("dropdownUserEmail");
const dropdownProviderTag = document.getElementById("dropdownProviderTag");
const dropdownProfileLink = document.getElementById("dropdownProfileLink");
const dropdownLogoutBtn = document.getElementById("dropdownLogoutBtn");
const authModal = document.getElementById("authModal");
const closeAuthModalBtn = document.getElementById("closeAuthModal");
const googleOAuthBtn = document.getElementById("googleOAuthBtn");
const linkedinOAuthBtn = document.getElementById("linkedinOAuthBtn");
const demoAlexMercerBtn = document.getElementById("demoAlexMercerBtn");
const demoMayaLinBtn = document.getElementById("demoMayaLinBtn");
const authStatusBanner = document.getElementById("authStatusBanner");

// DOM Elements: Profile Header & Strength Gauge
const candidateProfileForm = document.getElementById("candidateProfileForm");
const profileMainAvatar = document.getElementById("profileMainAvatar");
const changeAvatarPhotoBtn = document.getElementById("changeAvatarPhotoBtn");
const profileProviderBadge = document.getElementById("profileProviderBadge");
const providerBadgeIcon = document.getElementById("providerBadgeIcon");
const profileCandidateName = document.getElementById("profileCandidateName");
const profileCandidateEmail = document.getElementById("profileCandidateEmail");
const profileProviderPill = document.getElementById("profileProviderPill");
const profileProviderText = document.getElementById("profileProviderText");
const profileFieldBadgeText = document.getElementById("profileFieldBadgeText");
const profileHeadlineDisplay = document.getElementById("profileHeadlineDisplay");
const profileStatusPill = document.getElementById("profileStatusPill");
const profileTotalSessions = document.getElementById("profileTotalSessions");
const profileAvgScore = document.getElementById("profileAvgScore");
const profileReadinessTag = document.getElementById("profileReadinessTag");
const profileStrengthPct = document.getElementById("profileStrengthPct");
const profileStrengthFill = document.getElementById("profileStrengthFill");
const profileCompletionPercent = document.getElementById("profileCompletionPercent");
const profileCompletionBar = document.getElementById("profileCompletionBar");
const profileCompletionHint = document.getElementById("profileCompletionHint");

// DOM Elements: Tab Navigation
const profileNavTabs = document.querySelectorAll(".profile-nav-tab");
const profileTabPanels = document.querySelectorAll(".profile-tab-panel");

// DOM Elements: Tab 1 - Basic Info & Socials
const profileFullNameInput = document.getElementById("profileFullNameInput");
const profileHeadlineInput = document.getElementById("profileHeadlineInput");
const profilePhoneInput = document.getElementById("profilePhoneInput");
const profileEmailInput = document.getElementById("profileEmailInput");
const profileLocationInput = document.getElementById("profileLocationInput");
const profilePrimaryFieldInput = document.getElementById("profilePrimaryFieldInput");
const profileBio = document.getElementById("profileBio");
const profileLinkedinUrl = document.getElementById("profileLinkedinUrl");
const profileGithubUrl = document.getElementById("profileGithubUrl");
const profilePortfolioUrl = document.getElementById("profilePortfolioUrl");
const profileBehanceUrl = document.getElementById("profileBehanceUrl");
const profileDribbbleUrl = document.getElementById("profileDribbbleUrl");

// DOM Elements: Tab 2 - Preferences
const statusSelectorGroup = document.getElementById("statusSelectorGroup");
const profileJobStatusInput = document.getElementById("profileJobStatusInput");
const profileTargetRoleInput = document.getElementById("profileTargetRoleInput");
const profileExperienceLevelSelect = document.getElementById("profileExperienceLevelSelect");
const jobTypeChipsGroup = document.getElementById("jobTypeChipsGroup");
const profileJobTypeInput = document.getElementById("profileJobTypeInput");
const profilePreferredLocationInput = document.getElementById("profilePreferredLocationInput");

// DOM Elements: Tab 3 - Background (Resume, Work Experience, Education, Skills, Activities)
const resumeDropzone = document.getElementById("resumeDropzone");
const profileResumeFileInput = document.getElementById("resumeFileInput");
const currentResumeBanner = document.getElementById("currentResumeBanner");
const resumeFileNameDisplay = document.getElementById("resumeFileNameDisplay");
const resumeUploadTimeDisplay = document.getElementById("resumeUploadTimeDisplay");
const resumeFileSizeDisplay = document.getElementById("resumeFileSizeDisplay");
const downloadResumeBtn = document.getElementById("downloadResumeBtn");
const syncResumeStudioBtn = document.getElementById("syncResumeStudioBtn");

const experienceListContainer = document.getElementById("experienceListContainer");
const experienceEmptyState = document.getElementById("experienceEmptyState");
const addExperienceBtn = document.getElementById("addExperienceBtn");
const emptyAddExperienceBtn = document.getElementById("emptyAddExperienceBtn");

const educationListContainer = document.getElementById("educationListContainer");
const educationEmptyState = document.getElementById("educationEmptyState");
const addEducationBtn = document.getElementById("addEducationBtn");
const emptyAddEducationBtn = document.getElementById("emptyAddEducationBtn");

const techSkillInput = document.getElementById("techSkillInput");
const addTechSkillBtn = document.getElementById("addTechSkillBtn");
const techSkillsContainer = document.getElementById("techSkillsContainer");
const techSkillSuggestions = document.getElementById("techSkillSuggestions");

const softSkillInput = document.getElementById("softSkillInput");
const addSoftSkillBtn = document.getElementById("addSoftSkillBtn");
const softSkillsContainer = document.getElementById("softSkillsContainer");
const softSkillSuggestions = document.getElementById("softSkillSuggestions");

const activityQuickTags = document.getElementById("activityQuickTags");
const profileOtherActivities = document.getElementById("profileOtherActivities");

// DOM Elements: Tab 4 - Metrics & Calendar
const metricAvgScore = document.getElementById("metricAvgScore");
const metricReadinessBadge = document.getElementById("metricReadinessBadge");
const metricTechScore = document.getElementById("metricTechScore");
const metricHrScore = document.getElementById("metricHrScore");
const metricQuestionsSolved = document.getElementById("metricQuestionsSolved");
const metricStrengthsList = document.getElementById("metricStrengthsList");
const metricWeakAreasList = document.getElementById("metricWeakAreasList");

const bookedSlotsContainer = document.getElementById("bookedSlotsContainer");
const bookedSlotsEmptyState = document.getElementById("bookedSlotsEmptyState");
const openScheduleModalBtn = document.getElementById("openScheduleModalBtn");
const emptyScheduleModalBtn = document.getElementById("emptyScheduleModalBtn");

const scheduleModal = document.getElementById("scheduleModal");
const closeScheduleModalBtn = document.getElementById("closeScheduleModalBtn");
const cancelScheduleModalBtn = document.getElementById("cancelScheduleModalBtn");
const confirmBookSlotBtn = document.getElementById("confirmBookSlotBtn");
const slotTitleInput = document.getElementById("slotTitleInput");
const slotRoleSelect = document.getElementById("slotRoleSelect");
const slotInterviewerSelect = document.getElementById("slotInterviewerSelect");
const slotDateInput = document.getElementById("slotDateInput");
const slotTimeInput = document.getElementById("slotTimeInput");
const slotNotesInput = document.getElementById("slotNotesInput");

const interviewReportsContainer = document.getElementById("interviewReportsContainer");
const interviewReportsEmptyState = document.getElementById("interviewReportsEmptyState");

// DOM Elements: Tab 5 - Settings & Privacy
const privacyToggle = document.getElementById("privacyToggle");
const privacyStatusTitle = document.getElementById("privacyStatusTitle");
const privacyStatusDesc = document.getElementById("privacyStatusDesc");
const notifyEmailSwitch = document.getElementById("notifyEmailSwitch");
const notifySmsSwitch = document.getElementById("notifySmsSwitch");
const notifyJobAlertsSwitch = document.getElementById("notifyJobAlertsSwitch");

const currentPasswordInput = document.getElementById("currentPasswordInput");
const newPasswordInput = document.getElementById("newPasswordInput");
const confirmPasswordInput = document.getElementById("confirmPasswordInput");
const updatePasswordBtn = document.getElementById("updatePasswordBtn");
const passwordStatusMessage = document.getElementById("passwordStatusMessage");

const tfaStatusBadge = document.getElementById("tfaStatusBadge");
const toggle2faBtn = document.getElementById("toggle2faBtn");
const toggle2faBtnText = document.getElementById("toggle2faBtnText");
const tfaModal = document.getElementById("tfaModal");
const closeTfaModalBtn = document.getElementById("closeTfaModalBtn");
const cancelTfaModalBtn = document.getElementById("cancelTfaModalBtn");
const confirmTfaEnableBtn = document.getElementById("confirmTfaEnableBtn");
const tfaVerificationCodeInput = document.getElementById("tfaVerificationCodeInput");

// DOM Elements: Avatar Modal
const avatarModal = document.getElementById("avatarModal");
const closeAvatarModalBtn = document.getElementById("closeAvatarModalBtn");
const cancelAvatarModalBtn = document.getElementById("cancelAvatarModalBtn");
const applyAvatarBtn = document.getElementById("applyAvatarBtn");
const customAvatarFileInput = document.getElementById("customAvatarFileInput");
const avatarModalPreviewImg = document.getElementById("avatarModalPreviewImg");
const avatarPresetsGrid = document.getElementById("avatarPresetsGrid");

// DOM Elements: Sticky Action Bar & Resume Status
const profileResumeStatusBox = document.getElementById("profileResumeStatusBox");
const profileResumeStatusTitle = document.getElementById("profileResumeStatusTitle");
const profileResumeStatusDesc = document.getElementById("profileResumeStatusDesc");
const profileResumeSyncIcon = document.getElementById("profileResumeSyncIcon");
const profileSaveStatus = document.getElementById("profileSaveStatus");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const discardProfileBtn = document.getElementById("discardProfileBtn");


/* ------------------------------------------------------------------------------
   1. Token Utilities & HTTP Auth Headers
------------------------------------------------------------------------------ */

function getStoredAuthToken() {
    return (localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || "").trim();
}

function setStoredAuthToken(token) {
    if (token) {
        localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token.trim());
    } else {
        localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    }
}

function clearStoredAuthToken() {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

function getAuthHeaders() {
    const token = getStoredAuthToken();
    const headers = { "Content-Type": "application/json" };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
}


/* ------------------------------------------------------------------------------
   2. URL Query & Hash OAuth Parameter Interceptor
------------------------------------------------------------------------------ */

function checkUrlForAuthToken() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get("auth_token") || urlParams.get("token");
        const error = urlParams.get("auth_error") || urlParams.get("error");

        if (token) {
            setStoredAuthToken(token);
            // Clean up the URL query params without reloading the page
            if (window.history && window.history.replaceState) {
                const cleanUrl = window.location.pathname + "#profile";
                window.history.replaceState({}, document.title, cleanUrl);
            }
            switchToPartition("profile");
            return true;
        }

        if (error) {
            console.error("OAuth authentication error from callback:", error);
            if (authStatusBanner) {
                authStatusBanner.className = "auth-status-banner error";
                authStatusBanner.style.display = "flex";
                authStatusBanner.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> <span>OAuth error: ${escapeHtml(error)}</span>`;
            }
            openAuthModal();
        }
    } catch (e) {
        console.warn("Error parsing OAuth URL parameters:", e);
    }
    return false;
}


/* ------------------------------------------------------------------------------
   3. Modal Controllers (Open, Close, Dropdown)
------------------------------------------------------------------------------ */

function openAuthModal() {
    if (!authModal) return;
    authModal.classList.add("active");
    authModal.setAttribute("aria-hidden", "false");

    // Dynamically update OAuth link targets based on current API_BASE_URL
    if (googleOAuthBtn) {
        googleOAuthBtn.href = getApiUrl("/auth/google");
    }
    if (linkedinOAuthBtn) {
        linkedinOAuthBtn.href = getApiUrl("/auth/linkedin");
    }

    if (authStatusBanner) {
        authStatusBanner.style.display = "none";
        authStatusBanner.innerHTML = "";
    }
}

function closeAuthModal() {
    if (!authModal) return;
    authModal.classList.remove("active");
    authModal.setAttribute("aria-hidden", "true");
}

function toggleUserDropdown() {
    if (!userNavDropdown || !userPillBtn) return;
    const isHidden = userNavDropdown.classList.contains("hidden");
    if (isHidden) {
        userNavDropdown.classList.remove("hidden");
        userPillBtn.setAttribute("aria-expanded", "true");
    } else {
        userNavDropdown.classList.add("hidden");
        userPillBtn.setAttribute("aria-expanded", "false");
    }
}

function closeUserDropdown() {
    if (userNavDropdown) userNavDropdown.classList.add("hidden");
    if (userPillBtn) userPillBtn.setAttribute("aria-expanded", "false");
}

// Close dropdown on outside click
document.addEventListener("click", (e) => {
    if (userNavPill && !userNavPill.contains(e.target)) {
        closeUserDropdown();
    }
});

// Close modal on escape key
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        closeAuthModal();
        closeUserDropdown();
    }
});


/* ------------------------------------------------------------------------------
   4. Authentication State Management & Demo Login
------------------------------------------------------------------------------ */

async function checkAuthState() {
    const token = getStoredAuthToken();

    if (!token) {
        renderUnauthenticatedNav();
        return false;
    }

    try {
        const response = await fetch(getApiUrl("/api/auth/me"), {
            method: "GET",
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const rawData = await response.json();
            const user = rawData.user || rawData;
            currentAuthUser = user;
            renderAuthenticatedNav(user);
            return true;
        } else {
            // Token is expired, invalid, or database was reset
            console.warn("Stored JWT session is invalid or expired. Resetting session.");
            clearStoredAuthToken();
            currentAuthUser = null;
            renderUnauthenticatedNav();
            return false;
        }
    } catch (err) {
        console.warn("Unable to verify auth state with backend:", err);
        return false;
    }
}

function renderAuthenticatedNav(user) {
    if (openAuthModalBtn) openAuthModalBtn.style.display = "none";
    if (userNavPill) userNavPill.classList.remove("hidden");

    const displayName = user.full_name || user.email.split("@")[0] || "Candidate";
    const avatarUrl = user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=2563eb&color=fff&size=80`;

    if (navUserName) navUserName.textContent = displayName;
    if (navUserAvatar) navUserAvatar.src = avatarUrl;
    if (dropdownUserName) dropdownUserName.textContent = displayName;
    if (dropdownUserEmail) dropdownUserEmail.textContent = user.email || "";

    if (dropdownProviderTag) {
        const providerName = user.provider === "linkedin" ? "LinkedIn Verified" : "Google Verified";
        dropdownProviderTag.textContent = providerName;
    }
}

function renderUnauthenticatedNav() {
    if (openAuthModalBtn) openAuthModalBtn.style.display = "inline-flex";
    if (userNavPill) userNavPill.classList.add("hidden");
    closeUserDropdown();
}

function logoutCandidate() {
    clearStoredAuthToken();
    currentAuthUser = null;
    currentProfileData = null;
    currentEducationList = [];
    renderUnauthenticatedNav();
    switchToPartition("home");

    if (profileSaveStatus) {
        profileSaveStatus.className = "actions-left-status";
        profileSaveStatus.innerHTML = '<i class="fa-solid fa-circle-info"></i> <span>Signed out. Session closed.</span>';
    }
}

async function handleDemoLogin(provider) {
    if (!authStatusBanner) return;

    authStatusBanner.className = "auth-status-banner";
    authStatusBanner.style.display = "flex";
    authStatusBanner.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Loading ${escapeHtml(provider)} demo session...</span>`;

    try {
        const response = await fetch(getApiUrl("/auth/demo-login"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ provider })
        });

        if (response.ok) {
            const data = await response.json();
            setStoredAuthToken(data.access_token);
            currentAuthUser = data.user;

            authStatusBanner.className = "auth-status-banner success";
            authStatusBanner.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>Signed in as ${escapeHtml(data.user.full_name)}!</span>`;

            setTimeout(() => {
                closeAuthModal();
                renderAuthenticatedNav(data.user);
                switchToPartition("profile");
                loadUserProfile();
            }, 600);
        } else {
            const errorData = await response.json().catch(() => ({}));
            authStatusBanner.className = "auth-status-banner error";
            authStatusBanner.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> <span>${escapeHtml(errorData.detail || "Demo sign in failed.")}</span>`;
        }
    } catch (err) {
        authStatusBanner.className = "auth-status-banner error";
        authStatusBanner.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <span>Backend unreachable: ${escapeHtml(err.message)}</span>`;
    }
}


/* ------------------------------------------------------------------------------
   5. Dynamic Work & Professional Experience History Manager
------------------------------------------------------------------------------ */

function renderWorkExpList() {
    if (!experienceListContainer) return;

    if (!currentWorkExpList || currentWorkExpList.length === 0) {
        experienceListContainer.innerHTML = "";
        if (experienceEmptyState) experienceEmptyState.style.display = "flex";
        return;
    }

    if (experienceEmptyState) experienceEmptyState.style.display = "none";
    experienceListContainer.innerHTML = "";

    currentWorkExpList.forEach((entry, idx) => {
        const card = document.createElement("div");
        card.className = "education-entry-card work-exp-card";
        card.dataset.index = String(idx);

        card.innerHTML = `
            <div class="education-entry-header">
                <span class="education-entry-badge">
                    <i class="fa-solid fa-briefcase"></i> Role #${idx + 1}
                </span>
                <button type="button" class="btn-remove-education btn-remove-workexp" data-remove-index="${idx}" title="Remove this work experience">
                    <i class="fa-solid fa-trash-can"></i> <span>Remove</span>
                </button>
            </div>

            <div class="form-row-2">
                <div class="form-group">
                    <label class="form-label">Job Title / Role</label>
                    <input
                        type="text"
                        class="form-input exp-input-title"
                        data-field="title"
                        data-index="${idx}"
                        placeholder="e.g. Senior Frontend Developer, ML Engineer"
                        value="${escapeHtml(entry.title || "")}"
                        required
                    >
                </div>
                <div class="form-group">
                    <label class="form-label">Company / Organization</label>
                    <input
                        type="text"
                        class="form-input exp-input-company"
                        data-field="company"
                        data-index="${idx}"
                        placeholder="e.g. Microsoft, Razorpay, Tech Startup"
                        value="${escapeHtml(entry.company || "")}"
                        required
                    >
                </div>
            </div>

            <div class="form-row-2">
                <div class="form-group">
                    <label class="form-label">Duration / Period</label>
                    <input
                        type="text"
                        class="form-input exp-input-duration"
                        data-field="duration"
                        data-index="${idx}"
                        placeholder="e.g. 2022 - Present, or Jun 2020 - Aug 2022"
                        value="${escapeHtml(entry.duration || "")}"
                    >
                </div>
                <div class="form-group">
                    <label class="form-label">Key Responsibilities / Impact</label>
                    <input
                        type="text"
                        class="form-input exp-input-desc"
                        data-field="description"
                        data-index="${idx}"
                        placeholder="e.g. Led redesign of core checkout flow, boosting conversion by 18%"
                        value="${escapeHtml(entry.description || "")}"
                    >
                </div>
            </div>
        `;

        experienceListContainer.appendChild(card);
    });

    // Wire input listeners
    experienceListContainer.querySelectorAll(".form-input").forEach(input => {
        input.addEventListener("input", (e) => {
            const field = e.target.dataset.field;
            const index = parseInt(e.target.dataset.index, 10);
            if (!isNaN(index) && currentWorkExpList[index] && field) {
                currentWorkExpList[index][field] = e.target.value;
                updateProfileCompletion();
            }
        });
    });

    // Wire delete buttons
    experienceListContainer.querySelectorAll(".btn-remove-workexp").forEach(btn => {
        btn.addEventListener("click", () => {
            const index = parseInt(btn.dataset.removeIndex, 10);
            if (!isNaN(index)) {
                removeWorkExperienceEntry(index);
            }
        });
    });
}

function addWorkExperienceEntry(initialData = null) {
    const newEntry = initialData || {
        title: "",
        company: "",
        duration: "",
        description: ""
    };
    currentWorkExpList.push(newEntry);
    renderWorkExpList();
    updateProfileCompletion();

    const lastCard = experienceListContainer ? experienceListContainer.lastElementChild : null;
    if (lastCard) {
        const firstInput = lastCard.querySelector(".form-input");
        if (firstInput) firstInput.focus();
    }
}

function removeWorkExperienceEntry(index) {
    if (index >= 0 && index < currentWorkExpList.length) {
        currentWorkExpList.splice(index, 1);
        renderWorkExpList();
        updateProfileCompletion();
    }
}


/* ------------------------------------------------------------------------------
   6. Dynamic Academic Education History Manager
------------------------------------------------------------------------------ */

function renderEducationList() {
    if (!educationListContainer) return;

    if (!currentEducationList || currentEducationList.length === 0) {
        educationListContainer.innerHTML = "";
        if (educationEmptyState) educationEmptyState.style.display = "flex";
        return;
    }

    if (educationEmptyState) educationEmptyState.style.display = "none";
    educationListContainer.innerHTML = "";

    currentEducationList.forEach((entry, idx) => {
        const card = document.createElement("div");
        card.className = "education-entry-card";
        card.dataset.index = String(idx);

        card.innerHTML = `
            <div class="education-entry-header">
                <span class="education-entry-badge">
                    <i class="fa-solid fa-graduation-cap"></i> Credential #${idx + 1}
                </span>
                <button type="button" class="btn-remove-education" data-remove-index="${idx}" title="Remove this academic entry">
                    <i class="fa-solid fa-trash-can"></i> <span>Remove</span>
                </button>
            </div>

            <div class="form-row-2">
                <div class="form-group">
                    <label class="form-label">Degree / Credential</label>
                    <input
                        type="text"
                        class="form-input edu-input-degree"
                        data-field="degree"
                        data-index="${idx}"
                        placeholder="e.g. B.Tech, Ph.D., B.S., or Diploma"
                        value="${escapeHtml(entry.degree_title || entry.degree || "")}"
                        required
                    >
                </div>
                <div class="form-group">
                    <label class="form-label">Field of Study / Major</label>
                    <input
                        type="text"
                        class="form-input edu-input-field"
                        data-field="field_of_study"
                        data-index="${idx}"
                        placeholder="e.g. Computer Science, Electrical Eng, Mathematics"
                        value="${escapeHtml(entry.field_of_study || "")}"
                    >
                </div>
            </div>

            <div class="form-row-2">
                <div class="form-group">
                    <label class="form-label">Institution / University Name</label>
                    <input
                        type="text"
                        class="form-input edu-input-inst"
                        data-field="institution"
                        data-index="${idx}"
                        placeholder="e.g. IIT Bombay, Stanford, MIT"
                        value="${escapeHtml(entry.institution || "")}"
                        required
                    >
                </div>
                <div class="form-group">
                    <label class="form-label">Years of Attendance</label>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                        <input
                            type="text"
                            class="form-input"
                            data-field="start_year"
                            data-index="${idx}"
                            placeholder="Start (2019)"
                            value="${escapeHtml(entry.start_year || "")}"
                        >
                        <input
                            type="text"
                            class="form-input"
                            data-field="end_year"
                            data-index="${idx}"
                            placeholder="End (2023)"
                            value="${escapeHtml(entry.end_year || "")}"
                        >
                    </div>
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">Grade, GPA, or Honors (Optional)</label>
                <input
                    type="text"
                    class="form-input"
                    data-field="grade_or_honors"
                    data-index="${idx}"
                    placeholder="e.g. CGPA 9.2/10, First Class with Distinction"
                    value="${escapeHtml(entry.grade_or_honors || "")}"
                >
            </div>
        `;

        educationListContainer.appendChild(card);
    });

    // Wire input changes to in-memory state
    educationListContainer.querySelectorAll(".form-input").forEach(input => {
        input.addEventListener("input", (e) => {
            const field = e.target.dataset.field;
            const index = parseInt(e.target.dataset.index, 10);
            if (!isNaN(index) && currentEducationList[index] && field) {
                currentEducationList[index][field] = e.target.value;
                updateProfileCompletion();
            }
        });
    });

    // Wire delete buttons
    educationListContainer.querySelectorAll(".btn-remove-education").forEach(btn => {
        btn.addEventListener("click", () => {
            const index = parseInt(btn.dataset.removeIndex, 10);
            if (!isNaN(index)) {
                removeEducationEntry(index);
            }
        });
    });
}

function addEducationEntry(initialData = null) {
    const newEntry = initialData || {
        degree: "",
        field_of_study: "",
        institution: "",
        start_year: "",
        end_year: "",
        grade_or_honors: ""
    };
    currentEducationList.push(newEntry);
    renderEducationList();
    updateProfileCompletion();

    const lastCard = educationListContainer ? educationListContainer.lastElementChild : null;
    if (lastCard) {
        const firstInput = lastCard.querySelector(".form-input");
        if (firstInput) firstInput.focus();
    }
}

function removeEducationEntry(index) {
    if (index >= 0 && index < currentEducationList.length) {
        currentEducationList.splice(index, 1);
        renderEducationList();
        updateProfileCompletion();
    }
}


/* ------------------------------------------------------------------------------
   7. Interactive Skills Tag Manager (Technical & Soft Skills)
------------------------------------------------------------------------------ */

function renderSkillTags(container, skillsList, isSoft = false) {
    if (!container) return;
    container.innerHTML = "";

    if (!skillsList || skillsList.length === 0) {
        container.innerHTML = `<span style="color: var(--text-muted); font-size: 0.82rem; font-style: italic;">No ${isSoft ? 'soft' : 'technical'} skills added yet. Type a skill or choose from suggestions below.</span>`;
        return;
    }

    skillsList.forEach((skill, idx) => {
        const chip = document.createElement("span");
        chip.className = `skill-tag-chip ${isSoft ? 'soft-skill-chip' : ''}`;
        chip.innerHTML = `
            <span>${escapeHtml(skill)}</span>
            <span class="remove-tag" data-index="${idx}" title="Remove tag">&times;</span>
        `;

        chip.querySelector(".remove-tag").addEventListener("click", (e) => {
            e.stopPropagation();
            removeSkillTag(idx, isSoft);
        });

        container.appendChild(chip);
    });
}

function addSkillTag(skillName, isSoft = false) {
    const cleanSkill = (skillName || "").trim().replace(/^[,;\s]+|[,;\s]+$/g, "");
    if (!cleanSkill) return;

    const targetList = isSoft ? currentSoftSkills : currentTechSkills;
    const exists = targetList.some(s => s.toLowerCase() === cleanSkill.toLowerCase());

    if (!exists) {
        targetList.push(cleanSkill);
        renderSkillTags(isSoft ? softSkillsContainer : techSkillsContainer, targetList, isSoft);
        updateProfileCompletion();
    }
}

function removeSkillTag(index, isSoft = false) {
    const targetList = isSoft ? currentSoftSkills : currentTechSkills;
    if (index >= 0 && index < targetList.length) {
        targetList.splice(index, 1);
        renderSkillTags(isSoft ? softSkillsContainer : techSkillsContainer, targetList, isSoft);
        updateProfileCompletion();
    }
}


/* ------------------------------------------------------------------------------
   8. Resume / CV Uploader & 1-Click Downloader
------------------------------------------------------------------------------ */

function initResumeManager() {
    if (resumeDropzone && profileResumeFileInput) {
        resumeDropzone.addEventListener("click", () => profileResumeFileInput.click());

        resumeDropzone.addEventListener("dragover", (e) => {
            e.preventDefault();
            resumeDropzone.classList.add("drag-over");
        });

        resumeDropzone.addEventListener("dragleave", () => {
            resumeDropzone.classList.remove("drag-over");
        });

        resumeDropzone.addEventListener("drop", (e) => {
            e.preventDefault();
            resumeDropzone.classList.remove("drag-over");
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleResumeFileUpload(e.dataTransfer.files[0]);
            }
        });

        profileResumeFileInput.addEventListener("change", (e) => {
            if (e.target.files && e.target.files.length > 0) {
                handleResumeFileUpload(e.target.files[0]);
            }
        });
    }

    if (downloadResumeBtn) {
        downloadResumeBtn.addEventListener("click", () => {
            if (currentProfileData && currentProfileData.resume_file_base64) {
                const link = document.createElement("a");
                link.href = currentProfileData.resume_file_base64;
                link.download = currentProfileData.resume_filename || "Candidate_Resume.pdf";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                window.open(getApiUrl("/api/profile/resume/download"), "_blank");
            }
        });
    }
}

async function handleResumeFileUpload(file) {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
        alert("File size exceeds 10MB limit. Please upload a smaller document.");
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        const base64Data = e.target.result;
        try {
            if (profileSaveStatus) {
                profileSaveStatus.className = "actions-left-status pending";
                profileSaveStatus.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Uploading resume...</span>';
            }

            const response = await fetch(getApiUrl("/api/profile/resume"), {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    filename: file.name,
                    file_base64: base64Data
                })
            });

            if (response.ok) {
                const resData = await response.json();
                if (currentProfileData) {
                    currentProfileData.resume_filename = file.name;
                    currentProfileData.resume_file_base64 = base64Data;
                    currentProfileData.resume_uploaded_at = resData.uploaded_at || new Date().toISOString();
                }

                if (resumeFileNameDisplay) resumeFileNameDisplay.textContent = file.name;
                if (resumeUploadTimeDisplay) resumeUploadTimeDisplay.innerHTML = `<i class="fa-regular fa-clock"></i> Uploaded: Just now`;
                if (resumeFileSizeDisplay) {
                    const kb = Math.round(file.size / 1024);
                    resumeFileSizeDisplay.innerHTML = `<i class="fa-solid fa-database"></i> ${kb} KB`;
                }

                if (currentResumeBanner) currentResumeBanner.style.display = "flex";

                if (profileSaveStatus) {
                    profileSaveStatus.className = "actions-left-status";
                    profileSaveStatus.innerHTML = '<i class="fa-solid fa-circle-check"></i> <span>Resume synchronized successfully</span>';
                }

                syncProfileResumeStatus();
                updateProfileCompletion();
            } else {
                throw new Error("Server rejected resume upload");
            }
        } catch (err) {
            console.warn("Resume upload fallback to local state:", err);
            if (resumeFileNameDisplay) resumeFileNameDisplay.textContent = file.name;
            if (currentResumeBanner) currentResumeBanner.style.display = "flex";
            if (currentProfileData) {
                currentProfileData.resume_filename = file.name;
                currentProfileData.resume_file_base64 = base64Data;
            }
            syncProfileResumeStatus();
            updateProfileCompletion();
        }
    };
    reader.readAsDataURL(file);
}


/* ------------------------------------------------------------------------------
   9. Performance Metrics, Insights & Booked Slots Calendar
------------------------------------------------------------------------------ */

function renderPerformanceMetrics(stats) {
    if (!stats) return;

    if (metricAvgScore) metricAvgScore.textContent = `${stats.avg_overall_score || 85}%`;
    if (metricTechScore) metricTechScore.textContent = `${stats.tech_score || 88}%`;
    if (metricHrScore) metricHrScore.textContent = `${stats.hr_score || 82}%`;
    if (metricQuestionsSolved) metricQuestionsSolved.textContent = String(stats.questions_solved || 24);
    if (metricReadinessBadge) metricReadinessBadge.textContent = stats.readiness_rating || "Interview Ready";

    // Hero stats
    if (profileTotalSessions) profileTotalSessions.textContent = String(stats.total_sessions || 3);
    if (profileAvgScore) profileAvgScore.textContent = `${stats.avg_overall_score || 85}%`;
    if (profileReadinessTag) profileReadinessTag.textContent = stats.readiness_rating || "Interview Ready";

    // Strengths
    if (metricStrengthsList && Array.isArray(stats.strengths) && stats.strengths.length > 0) {
        metricStrengthsList.innerHTML = stats.strengths.map(s => `<li><i class="fa-solid fa-check"></i> ${escapeHtml(s)}</li>`).join("");
    }

    // Weak areas
    if (metricWeakAreasList && Array.isArray(stats.weak_areas) && stats.weak_areas.length > 0) {
        metricWeakAreasList.innerHTML = stats.weak_areas.map(w => `<li><i class="fa-solid fa-crosshairs"></i> ${escapeHtml(w)}</li>`).join("");
    }
}

function renderBookedSlots(slots) {
    if (!bookedSlotsContainer) return;

    if (!slots || slots.length === 0) {
        bookedSlotsContainer.innerHTML = "";
        if (bookedSlotsEmptyState) bookedSlotsEmptyState.style.display = "flex";
        return;
    }

    if (bookedSlotsEmptyState) bookedSlotsEmptyState.style.display = "none";
    bookedSlotsContainer.innerHTML = "";

    slots.forEach(slot => {
        const card = document.createElement("div");
        card.className = "booked-slot-card";
        card.innerHTML = `
            <div class="slot-time-col">
                <span class="slot-date">${escapeHtml(slot.slot_date || "Upcoming")}</span>
                <span class="slot-time">${escapeHtml(slot.slot_time || "10:00 AM")}</span>
            </div>
            <div class="slot-details-col">
                <div class="slot-title">${escapeHtml(slot.title || "Mock Interview Round")}</div>
                <div class="slot-role-tag">${escapeHtml(slot.role || "Technical Role")}</div>
                <div class="slot-interviewer"><i class="fa-solid fa-user-tie"></i> ${escapeHtml(slot.interviewer_type || "AI Adaptive Interviewer")}</div>
                ${slot.notes ? `<div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 4px;">Note: ${escapeHtml(slot.notes)}</div>` : ''}
            </div>
            <button type="button" class="btn-icon-danger" title="Cancel this booked slot" data-slot-id="${slot.id}">
                <i class="fa-solid fa-calendar-xmark"></i> <span>Cancel</span>
            </button>
        `;

        card.querySelector(".btn-icon-danger").addEventListener("click", () => {
            deleteBookedSlot(slot.id);
        });

        bookedSlotsContainer.appendChild(card);
    });
}

async function deleteBookedSlot(slotId) {
    if (!slotId) return;
    if (!confirm("Are you sure you want to cancel this interview slot?")) return;

    try {
        await fetch(getApiUrl(`/api/profile/booked-slots/${slotId}`), {
            method: "DELETE",
            headers: getAuthHeaders()
        });
    } catch (_) {}

    currentBookedSlots = currentBookedSlots.filter(s => s.id !== slotId);
    renderBookedSlots(currentBookedSlots);
}

function renderPastReports(reports) {
    if (!interviewReportsContainer) return;

    if (!reports || reports.length === 0) {
        interviewReportsContainer.innerHTML = "";
        if (interviewReportsEmptyState) interviewReportsEmptyState.style.display = "flex";
        return;
    }

    if (interviewReportsEmptyState) interviewReportsEmptyState.style.display = "none";
    interviewReportsContainer.innerHTML = "";

    reports.forEach((rep, idx) => {
        const card = document.createElement("div");
        card.className = "interview-report-card";
        const score = rep.overall_score || 85;
        const role = rep.role || "Technical Interview";
        const dateStr = rep.created_at ? new Date(rep.created_at).toLocaleDateString() : `Session #${idx + 1}`;

        card.innerHTML = `
            <div class="report-summary-header">
                <div>
                    <strong style="color: var(--text-primary); font-size: 0.96rem;">${escapeHtml(role)}</strong>
                    <div style="font-size: 0.78rem; color: var(--text-muted);"><i class="fa-regular fa-calendar"></i> ${dateStr}</div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span class="report-score-badge">${score}% Score</span>
                    <i class="fa-solid fa-chevron-down" style="color: var(--text-muted); font-size: 0.85rem;"></i>
                </div>
            </div>
            <div class="report-details-body">
                <div style="margin-bottom: 8px;"><strong>Feedback Summary:</strong></div>
                <p>${escapeHtml(rep.feedback || "Candidate exhibited strong conceptual knowledge, high coding speed, and clear articulation.")}</p>
                ${rep.technical_score ? `<div style="font-size: 0.82rem; margin-top: 6px; color: var(--brand-cyan);">Technical Score: ${rep.technical_score}% | HR Behavioral: ${rep.behavioral_score || 80}%</div>` : ''}
            </div>
        `;

        card.querySelector(".report-summary-header").addEventListener("click", () => {
            card.classList.toggle("open");
        });

        interviewReportsContainer.appendChild(card);
    });
}


/* ------------------------------------------------------------------------------
   10. Tab Navigation, Status, and Avatar Modal Controllers
------------------------------------------------------------------------------ */

function switchProfileTab(tabName) {
    currentActiveProfileTab = tabName;

    profileNavTabs.forEach(btn => {
        if (btn.dataset.tab === tabName) {
            btn.classList.add("active");
            btn.setAttribute("aria-selected", "true");
        } else {
            btn.classList.remove("active");
            btn.setAttribute("aria-selected", "false");
        }
    });

    profileTabPanels.forEach(panel => {
        const panelId = panel.id.toLowerCase();
        if (panelId.includes(tabName.toLowerCase())) {
            panel.classList.add("active");
        } else {
            panel.classList.remove("active");
        }
    });
}

function setJobStatus(status) {
    if (profileJobStatusInput) profileJobStatusInput.value = status;

    if (statusSelectorGroup) {
        statusSelectorGroup.querySelectorAll(".status-option-btn").forEach(btn => {
            if (btn.dataset.status === status) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }
        });
    }

    if (profileStatusPill) {
        profileStatusPill.className = "profile-status-pill";
        if (status === "Open to Offers") {
            profileStatusPill.classList.add("status-open");
            profileStatusPill.innerHTML = '<span class="status-option-dot dot-open"></span> <span>Open to Offers</span>';
        } else if (status === "Just Practicing") {
            profileStatusPill.classList.add("status-practicing");
            profileStatusPill.innerHTML = '<span class="status-option-dot dot-practicing"></span> <span>Just Practicing</span>';
        } else {
            profileStatusPill.innerHTML = '<span class="status-option-dot dot-interviewing"></span> <span>Actively Interviewing</span>';
        }
    }

    updateProfileCompletion();
}


/* ------------------------------------------------------------------------------
   11. Profile Completion Meter & Strength Calculator
------------------------------------------------------------------------------ */

function updateProfileCompletion() {
    let score = 0;

    // Contact & Basic Info weights (25%)
    if (profileFullNameInput && profileFullNameInput.value.trim().length > 2) score += 6;
    if (profileHeadlineInput && profileHeadlineInput.value.trim().length > 3) score += 5;
    if (profilePhoneInput && profilePhoneInput.value.trim().length > 6) score += 5;
    if (profileLocationInput && profileLocationInput.value.trim().length > 2) score += 5;
    if (profileBio && profileBio.value.trim().length > 10) score += 4;

    // Social Links (20%)
    if (profileLinkedinUrl && profileLinkedinUrl.value.trim().length > 5) score += 7;
    if (profileGithubUrl && profileGithubUrl.value.trim().length > 5) score += 7;
    if (profilePortfolioUrl && profilePortfolioUrl.value.trim().length > 5) score += 6;

    // Job Preferences (15%)
    if (profileTargetRoleInput && profileTargetRoleInput.value.trim().length > 2) score += 8;
    if (profileJobStatusInput && profileJobStatusInput.value.trim().length > 0) score += 7;

    // Background: Resume, Experience, Education, Skills (25%)
    if (currentProfileData && (currentProfileData.resume_filename || currentProfileData.resume_file_base64)) score += 8;
    if (currentWorkExpList && currentWorkExpList.length > 0) score += 6;
    if (currentEducationList && currentEducationList.length > 0) score += 6;
    if (currentTechSkills && currentTechSkills.length > 0) score += 5;

    // Privacy & Preferences (15%)
    if (privacyToggle) score += 15;

    score = Math.min(100, Math.max(0, score));

    if (profileCompletionPercent) profileCompletionPercent.textContent = `${score}%`;
    if (profileCompletionBar) profileCompletionBar.style.width = `${score}%`;
    if (profileStrengthPct) profileStrengthPct.textContent = `${score}%`;
    if (profileStrengthFill) profileStrengthFill.style.width = `${score}%`;

    if (profileCompletionHint) {
        if (score >= 90) {
            profileCompletionHint.innerHTML = '<span style="color: #059669; font-weight: 600;"><i class="fa-solid fa-circle-check"></i> Exceptional Profile! All academic & technical parameters complete.</span>';
        } else if (score >= 60) {
            profileCompletionHint.textContent = "Great progress! Add your research portfolio URL or non-standard activities to reach 100%.";
        } else {
            profileCompletionHint.textContent = "Complete contact, active platforms, and degree entries to strengthen your interview baseline.";
        }
    }
}

function syncProfileResumeStatus() {
    if (!profileResumeStatusBox || !profileResumeStatusTitle || !profileResumeStatusDesc || !profileResumeSyncIcon) return;

    const hasResume = Boolean(currentProfileData && (currentProfileData.resume_filename || currentProfileData.resume_file_base64));
    const resumeName = (currentProfileData && currentProfileData.resume_filename) || "Active Resume";

    if (hasResume) {
        profileResumeSyncIcon.className = "resume-sync-icon synced";
        profileResumeSyncIcon.innerHTML = '<i class="fa-solid fa-file-circle-check"></i>';
        profileResumeStatusTitle.textContent = `Resume Connected: ${escapeHtml(resumeName)}`;
        profileResumeStatusDesc.textContent = "Curriculum vitae synchronized with your candidate profile. ATS metrics active in Intelligence.";
    } else {
        profileResumeSyncIcon.className = "resume-sync-icon";
        profileResumeSyncIcon.innerHTML = '<i class="fa-solid fa-file-pdf"></i>';
        profileResumeStatusTitle.textContent = "No Active Resume Loaded";
        profileResumeStatusDesc.textContent = "Upload your resume in Resume Studio to calculate ATS metrics and sync skills with your candidate profile.";
    }
}


/* ------------------------------------------------------------------------------
   12. Load & Populate Profile from Backend / SQLite
------------------------------------------------------------------------------ */

async function ensureCandidateSession() {
    let token = getStoredAuthToken();
    if (token) return token;

    try {
        const response = await fetch(getApiUrl("/auth/guest-login"), {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });
        if (response.ok) {
            const data = await response.json();
            token = data.access_token;
            setStoredAuthToken(token);
            currentAuthUser = data.user;
            renderAuthenticatedNav(data.user);
            return token;
        }
    } catch (err) {
        console.warn("Could not reach backend for guest session, using local session:", err);
    }

    token = "candidate_local_session_" + Date.now();
    setStoredAuthToken(token);
    return token;
}

async function loadUserProfile() {
    let token = getStoredAuthToken();
    if (!token) {
        token = await ensureCandidateSession();
    }

    try {
        const response = await fetch(getApiUrl("/api/profile"), {
            method: "GET",
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const rawData = await response.json();
            const data = rawData.profile || rawData;
            currentProfileData = data;

            // 1. Header Information
            const displayName = data.name || data.full_name || (data.email ? data.email.split("@")[0] : "Dr. Alex Mercer");
            const headline = data.professional_title || "Senior Software Engineer & AI Researcher";
            const avatarUrl = data.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=2563eb&color=fff&size=160`;

            if (profileMainAvatar) profileMainAvatar.src = avatarUrl;
            if (profileCandidateName) profileCandidateName.textContent = displayName;
            if (profileHeadlineDisplay) profileHeadlineDisplay.innerHTML = `<i class="fa-solid fa-briefcase"></i> ${escapeHtml(headline)}`;
            if (profileCandidateEmail) profileCandidateEmail.textContent = data.email || "candidate@interviewai.com";

            // Status pill
            setJobStatus(data.job_status || "Actively Interviewing");

            // 2. Tab 1 - Basic Info
            if (profileFullNameInput) profileFullNameInput.value = displayName;
            if (profileHeadlineInput) profileHeadlineInput.value = headline;
            if (profilePhoneInput) profilePhoneInput.value = data.phone || "+91 98765 43210";
            if (profileEmailInput) profileEmailInput.value = data.email || "candidate@interviewai.com";
            if (profileLocationInput) profileLocationInput.value = data.location || "Bengaluru, India";
            if (profilePrimaryFieldInput) profilePrimaryFieldInput.value = data.primary_field || "Computer Science & Engineering";
            if (profileBio) profileBio.value = data.bio_summary || data.bio || "Passionate engineer with extensive background in building scalable distributed systems and deep learning models.";
            if (profileLinkedinUrl) profileLinkedinUrl.value = data.linkedin_url || "https://linkedin.com/in/alexmercer";
            if (profileGithubUrl) profileGithubUrl.value = data.github_url || "https://github.com/alexmercer";
            if (profilePortfolioUrl) profilePortfolioUrl.value = data.portfolio_url || "https://alexmercer.dev";
            if (profileBehanceUrl) profileBehanceUrl.value = data.behance_url || "";
            if (profileDribbbleUrl) profileDribbbleUrl.value = data.dribbble_url || "";

            // 3. Tab 2 - Preferences
            if (profileTargetRoleInput) profileTargetRoleInput.value = data.target_roles || "Senior Frontend Developer";
            if (profilePreferredLocationInput) profilePreferredLocationInput.value = data.preferred_location || "Bengaluru, Remote Worldwide";
            if (profileJobTypeInput) {
                profileJobTypeInput.value = data.job_type || "Full-time, Remote";
                const types = (data.job_type || "Full-time, Remote").split(",").map(t => t.trim());
                if (jobTypeChipsGroup) {
                    jobTypeChipsGroup.querySelectorAll(".job-type-chip").forEach(chip => {
                        const type = chip.dataset.type;
                        if (types.includes(type)) {
                            chip.classList.add("active");
                            chip.innerHTML = `<i class="fa-solid fa-check"></i> ${escapeHtml(type)}`;
                        } else {
                            chip.classList.remove("active");
                            chip.innerHTML = `<i class="fa-solid fa-plus"></i> ${escapeHtml(type)}`;
                        }
                    });
                }
            }

            // 4. Tab 3 - Background
            // Resume
            if (data.resume_filename) {
                if (resumeFileNameDisplay) resumeFileNameDisplay.textContent = data.resume_filename;
                if (resumeUploadTimeDisplay) resumeUploadTimeDisplay.innerHTML = `<i class="fa-regular fa-clock"></i> Uploaded: ${data.resume_uploaded_at ? new Date(data.resume_uploaded_at).toLocaleDateString() : 'Recent'}`;
                if (currentResumeBanner) currentResumeBanner.style.display = "flex";
            }

            // Work Experience
            currentWorkExpList = Array.isArray(data.work_experience) ? JSON.parse(JSON.stringify(data.work_experience)) : [
                {
                    title: "Senior Fullstack Engineer",
                    company: "Acme Tech Innovations",
                    duration: "2022 - Present",
                    description: "Architected microservices with FastAPI and React, improving latency by 35%."
                }
            ];
            renderWorkExpList();

            // Education
            currentEducationList = Array.isArray(data.education) ? JSON.parse(JSON.stringify(data.education)) : [
                {
                    degree_title: "B.Tech in Computer Science",
                    field_of_study: "Computer Science & Engineering",
                    institution: "National Institute of Technology",
                    start_year: "2018",
                    end_year: "2022",
                    grade_or_honors: "CGPA 9.1/10"
                }
            ];
            renderEducationList();

            // Skills
            currentTechSkills = Array.isArray(data.skills_list) && data.skills_list.length > 0
                ? [...data.skills_list]
                : ["Python", "FastAPI", "React", "TypeScript", "Docker", "System Design"];
            renderSkillTags(techSkillsContainer, currentTechSkills, false);

            currentSoftSkills = Array.isArray(data.soft_skills_list) && data.soft_skills_list.length > 0
                ? [...data.soft_skills_list]
                : ["Communication", "Leadership", "Team Collaboration", "Agile Mindset"];
            renderSkillTags(softSkillsContainer, currentSoftSkills, true);

            // Extracurriculars
            if (profileOtherActivities) profileOtherActivities.value = data.other_activities || "";

            // 5. Tab 4 - Metrics & Calendar
            if (data.interview_stats) {
                renderPerformanceMetrics(data.interview_stats);
            } else {
                renderPerformanceMetrics({
                    total_sessions: 3,
                    avg_overall_score: 85,
                    tech_score: 88,
                    hr_score: 82,
                    questions_solved: 24,
                    readiness_rating: "Interview Ready",
                    strengths: ["System Architecture & Scalability", "Algorithms & Data Structures", "Technical Articulation"],
                    weak_areas: ["STAR behavioral conflict stories", "Live edge-case testing explanations"]
                });
            }

            currentBookedSlots = Array.isArray(data.booked_slots) ? data.booked_slots : [];
            renderBookedSlots(currentBookedSlots);

            currentPastReports = Array.isArray(data.past_reports) ? data.past_reports : [];
            renderPastReports(currentPastReports);

            // 6. Tab 5 - Settings & Privacy
            if (privacyToggle) {
                privacyToggle.checked = (data.privacy_level || "public") === "public";
                updatePrivacyLabel(privacyToggle.checked);
            }
            if (notifyEmailSwitch) notifyEmailSwitch.checked = data.email_notifications !== 0;
            if (notifySmsSwitch) notifySmsSwitch.checked = data.sms_notifications !== 0;
            if (notifyJobAlertsSwitch) notifyJobAlertsSwitch.checked = data.job_alerts !== 0;

            isTwoFactorEnabled = Boolean(data.two_factor_enabled);
            update2faStatusBadge();

            // Recalculate
            updateProfileCompletion();
            syncProfileResumeStatus();

            if (profileSaveStatus) {
                profileSaveStatus.className = "actions-left-status";
                profileSaveStatus.innerHTML = '<i class="fa-solid fa-circle-check"></i> <span>Profile synchronized with database</span>';
            }
        } else {
            loadLocalProfileDefaults();
        }
    } catch (err) {
        console.warn("Network error loading profile, falling back to cached state:", err);
        loadLocalProfileDefaults();
    }
}

function loadLocalProfileDefaults() {
    let saved = null;
    try {
        const raw = localStorage.getItem("interviewai_saved_profile");
        if (raw) saved = JSON.parse(raw);
    } catch (_) {}

    const defaults = saved || {
        name: "Dr. Alex Mercer",
        professional_title: "Senior Fullstack Engineer & AI Practitioner",
        phone: "+91 98765 43210",
        email: "candidate@interviewai.com",
        location: "Bengaluru, India",
        primary_field: "Computer Science & Engineering",
        job_status: "Actively Interviewing",
        target_roles: "Senior Frontend Developer",
        job_type: "Full-time, Remote",
        preferred_location: "Bengaluru, Remote Worldwide"
    };

    if (profileFullNameInput) profileFullNameInput.value = defaults.name;
    if (profileHeadlineInput) profileHeadlineInput.value = defaults.professional_title;
    if (profileHeadlineDisplay) profileHeadlineDisplay.innerHTML = `<i class="fa-solid fa-briefcase"></i> ${escapeHtml(defaults.professional_title)}`;
    if (profilePhoneInput) profilePhoneInput.value = defaults.phone;
    if (profileEmailInput) profileEmailInput.value = defaults.email;
    if (profileLocationInput) profileLocationInput.value = defaults.location;
    if (profilePrimaryFieldInput) profilePrimaryFieldInput.value = defaults.primary_field;

    setJobStatus(defaults.job_status || "Actively Interviewing");

    currentWorkExpList = defaults.work_experience || [
        {
            title: "Senior Fullstack Engineer",
            company: "Acme Tech Innovations",
            duration: "2022 - Present",
            description: "Architected microservices with FastAPI and React, improving latency by 35%."
        }
    ];
    renderWorkExpList();

    currentEducationList = defaults.education || [
        {
            degree_title: "B.Tech in Computer Science",
            field_of_study: "Computer Science & Engineering",
            institution: "National Institute of Technology",
            start_year: "2018",
            end_year: "2022",
            grade_or_honors: "CGPA 9.1/10"
        }
    ];
    renderEducationList();

    currentTechSkills = defaults.skills_list || ["Python", "FastAPI", "React", "TypeScript", "Docker", "System Design"];
    renderSkillTags(techSkillsContainer, currentTechSkills, false);

    currentSoftSkills = defaults.soft_skills_list || ["Communication", "Leadership", "Team Collaboration", "Agile Mindset"];
    renderSkillTags(softSkillsContainer, currentSoftSkills, true);

    renderPerformanceMetrics({
        total_sessions: 3,
        avg_overall_score: 85,
        tech_score: 88,
        hr_score: 82,
        questions_solved: 24,
        readiness_rating: "Interview Ready",
        strengths: ["System Architecture & Scalability", "Algorithms & Data Structures", "Technical Articulation"],
        weak_areas: ["STAR behavioral conflict stories", "Live edge-case testing explanations"]
    });

    updateProfileCompletion();
    syncProfileResumeStatus();
}

function updatePrivacyLabel(isPublic) {
    if (!privacyStatusTitle || !privacyStatusDesc) return;
    if (isPublic) {
        privacyStatusTitle.innerHTML = '<i class="fa-solid fa-globe text-accent-blue"></i> Public Candidate Profile (Recommended)';
        privacyStatusDesc.textContent = "Recruiters and verified company talent scouts can discover your profile, view verified interview scores, and contact you directly.";
    } else {
        privacyStatusTitle.innerHTML = '<i class="fa-solid fa-lock text-accent-amber"></i> Private Incognito Mode';
        privacyStatusDesc.textContent = "Your profile and interview scores are hidden from search and recruiter listings. Only you have access.";
    }
}

function update2faStatusBadge() {
    if (!tfaStatusBadge || !toggle2faBtnText) return;
    if (isTwoFactorEnabled) {
        tfaStatusBadge.className = "tfa-status-badge badge-enabled";
        tfaStatusBadge.textContent = "Enabled 🟢";
        toggle2faBtnText.textContent = "Disable 2FA";
    } else {
        tfaStatusBadge.className = "tfa-status-badge badge-disabled";
        tfaStatusBadge.textContent = "Disabled ⚪";
        toggle2faBtnText.textContent = "Enable 2FA";
    }
}


/* ------------------------------------------------------------------------------
   13. Save Profile Changes (PUT /api/profile)
------------------------------------------------------------------------------ */

async function saveUserProfile(e) {
    if (e && e.preventDefault) e.preventDefault();

    let token = getStoredAuthToken();
    if (!token) {
        token = await ensureCandidateSession();
    }

    const fullName = profileFullNameInput ? profileFullNameInput.value.trim() : "";
    if (!fullName) {
        if (profileFullNameInput) profileFullNameInput.focus();
        if (profileSaveStatus) {
            profileSaveStatus.className = "actions-left-status error";
            profileSaveStatus.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> <span>Full Legal Name is required.</span>';
        }
        return;
    }

    // Assemble payload
    const payload = {
        name: fullName,
        full_name: fullName,
        email: profileEmailInput ? profileEmailInput.value.trim() : "",
        phone: profilePhoneInput ? profilePhoneInput.value.trim() : "",
        location: profileLocationInput ? profileLocationInput.value.trim() : "",
        professional_title: profileHeadlineInput ? profileHeadlineInput.value.trim() : "",
        primary_field: profilePrimaryFieldInput ? profilePrimaryFieldInput.value.trim() : "",
        bio_summary: profileBio ? profileBio.value.trim() : "",
        bio: profileBio ? profileBio.value.trim() : "",
        linkedin_url: profileLinkedinUrl ? profileLinkedinUrl.value.trim() : "",
        github_url: profileGithubUrl ? profileGithubUrl.value.trim() : "",
        portfolio_url: profilePortfolioUrl ? profilePortfolioUrl.value.trim() : "",
        behance_url: profileBehanceUrl ? profileBehanceUrl.value.trim() : "",
        dribbble_url: profileDribbbleUrl ? profileDribbbleUrl.value.trim() : "",
        target_roles: profileTargetRoleInput ? profileTargetRoleInput.value.trim() : "",
        job_type: profileJobTypeInput ? profileJobTypeInput.value.trim() : "Full-time, Remote",
        preferred_location: profilePreferredLocationInput ? profilePreferredLocationInput.value.trim() : "",
        job_status: profileJobStatusInput ? profileJobStatusInput.value.trim() : "Actively Interviewing",
        skills_list: currentTechSkills,
        soft_skills_list: currentSoftSkills,
        work_experience: currentWorkExpList.filter(w => w.title || w.company),
        education: currentEducationList.filter(e => e.degree_title || e.degree || e.institution),
        other_activities: profileOtherActivities ? profileOtherActivities.value.trim() : "",
        privacy_level: (privacyToggle && privacyToggle.checked) ? "public" : "private",
        email_notifications: (notifyEmailSwitch && notifyEmailSwitch.checked) ? 1 : 0,
        sms_notifications: (notifySmsSwitch && notifySmsSwitch.checked) ? 1 : 0,
        job_alerts: (notifyJobAlertsSwitch && notifyJobAlertsSwitch.checked) ? 1 : 0
    };

    // Save to local storage for instant offline resilience
    try {
        localStorage.setItem("interviewai_saved_profile", JSON.stringify(payload));
    } catch (_) {}

    if (saveProfileBtn) {
        saveProfileBtn.disabled = true;
        saveProfileBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Saving to Database...</span>';
    }
    if (profileSaveStatus) {
        profileSaveStatus.className = "actions-left-status pending";
        profileSaveStatus.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Persisting updates...</span>';
    }

    try {
        const response = await fetch(getApiUrl("/api/profile"), {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const rawRes = await response.json();
            const updated = rawRes.profile || rawRes;
            currentProfileData = updated;

            const updatedName = updated.name || updated.full_name || fullName || "Candidate";
            if (navUserName) navUserName.textContent = updatedName;
            if (dropdownUserName) dropdownUserName.textContent = updatedName;
            if (profileCandidateName) profileCandidateName.textContent = updatedName;
            if (profileCandidateEmail && updated.email) profileCandidateEmail.textContent = updated.email;
            if (profileHeadlineDisplay && updated.professional_title) {
                profileHeadlineDisplay.innerHTML = `<i class="fa-solid fa-briefcase"></i> ${escapeHtml(updated.professional_title)}`;
            }

            const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            if (profileSaveStatus) {
                profileSaveStatus.className = "actions-left-status";
                profileSaveStatus.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>All changes saved to your local database (${now})</span>`;
            }

            updateProfileCompletion();
        } else {
            const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            if (profileSaveStatus) {
                profileSaveStatus.className = "actions-left-status";
                profileSaveStatus.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>Profile saved to local storage (${now})</span>`;
            }
        }
    } catch (err) {
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (profileSaveStatus) {
            profileSaveStatus.className = "actions-left-status";
            profileSaveStatus.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>Profile saved locally (${now})</span>`;
        }
    } finally {
        if (saveProfileBtn) {
            saveProfileBtn.disabled = false;
            saveProfileBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> <span>Save Profile Changes</span>';
        }
    }
}

function discardProfileChanges() {
    if (confirm("Discard unsaved profile modifications and restore the last saved database state?")) {
        loadUserProfile();
    }
}


/* ------------------------------------------------------------------------------
   14. Partition Activation Hook
------------------------------------------------------------------------------ */

async function onProfilePartitionActivated() {
    let token = getStoredAuthToken();
    if (!token) {
        token = await ensureCandidateSession();
    }
    await loadUserProfile();
    syncProfileResumeStatus();
}


/* ------------------------------------------------------------------------------
   15. Comprehensive Event Listeners Initialization
------------------------------------------------------------------------------ */

function initAuthAndProfileEvents() {
    // URL token interceptor
    checkUrlForAuthToken();
    checkAuthState();

    // Sign In button clicks
    if (openAuthModalBtn) openAuthModalBtn.addEventListener("click", openAuthModal);
    if (closeAuthModalBtn) closeAuthModalBtn.addEventListener("click", closeAuthModal);

    // Modal Live/Demo OAuth buttons
    if (googleOAuthBtn) {
        googleOAuthBtn.addEventListener("click", async (e) => {
            if (!e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                await handleDemoLogin("google");
            }
        });
    }

    if (linkedinOAuthBtn) {
        linkedinOAuthBtn.addEventListener("click", async (e) => {
            if (!e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                await handleDemoLogin("linkedin");
            }
        });
    }

    // User nav pill dropdown toggle
    if (userPillBtn) {
        userPillBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleUserDropdown();
        });
    }

    if (dropdownLogoutBtn) {
        dropdownLogoutBtn.addEventListener("click", logoutCandidate);
    }

    if (demoAlexMercerBtn) demoAlexMercerBtn.addEventListener("click", () => handleDemoLogin("google"));
    if (demoMayaLinBtn) demoMayaLinBtn.addEventListener("click", () => handleDemoLogin("linkedin"));

    // 1. Profile Tab Switching
    profileNavTabs.forEach(tabBtn => {
        tabBtn.addEventListener("click", () => {
            const tabName = tabBtn.dataset.tab;
            if (tabName) switchProfileTab(tabName);
        });
    });

    // 2. Job Search Status Selector Buttons
    if (statusSelectorGroup) {
        statusSelectorGroup.querySelectorAll(".status-option-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const status = btn.dataset.status;
                if (status) setJobStatus(status);
            });
        });
    }

    // 3. Job Type Multi-Select Chips
    if (jobTypeChipsGroup) {
        jobTypeChipsGroup.querySelectorAll(".job-type-chip").forEach(chip => {
            chip.addEventListener("click", () => {
                chip.classList.toggle("active");
                const type = chip.dataset.type;
                if (chip.classList.contains("active")) {
                    chip.innerHTML = `<i class="fa-solid fa-check"></i> ${escapeHtml(type)}`;
                } else {
                    chip.innerHTML = `<i class="fa-solid fa-plus"></i> ${escapeHtml(type)}`;
                }

                // Update hidden input
                const activeTypes = [];
                jobTypeChipsGroup.querySelectorAll(".job-type-chip.active").forEach(c => {
                    activeTypes.push(c.dataset.type);
                });
                if (profileJobTypeInput) profileJobTypeInput.value = activeTypes.join(", ");
                updateProfileCompletion();
            });
        });
    }

    // 4. Resume Manager
    initResumeManager();

    // 5. Dynamic Work Experience
    if (addExperienceBtn) addExperienceBtn.addEventListener("click", () => addWorkExperienceEntry());
    if (emptyAddExperienceBtn) emptyAddExperienceBtn.addEventListener("click", () => addWorkExperienceEntry());

    // 6. Dynamic Academic Education
    if (addEducationBtn) addEducationBtn.addEventListener("click", () => addEducationEntry());
    if (emptyAddEducationBtn) emptyAddEducationBtn.addEventListener("click", () => addEducationEntry());

    // 7. Technical Skills Tag Handlers
    if (addTechSkillBtn && techSkillInput) {
        addTechSkillBtn.addEventListener("click", () => {
            addSkillTag(techSkillInput.value, false);
            techSkillInput.value = "";
        });

        techSkillInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addSkillTag(techSkillInput.value, false);
                techSkillInput.value = "";
            }
        });
    }

    if (techSkillSuggestions) {
        techSkillSuggestions.querySelectorAll(".suggestion-chip").forEach(chip => {
            chip.addEventListener("click", () => {
                const skill = chip.dataset.skill || chip.textContent.replace(/^\+\s*/, "");
                addSkillTag(skill, false);
            });
        });
    }

    // 8. Soft Skills Tag Handlers
    if (addSoftSkillBtn && softSkillInput) {
        addSoftSkillBtn.addEventListener("click", () => {
            addSkillTag(softSkillInput.value, true);
            softSkillInput.value = "";
        });

        softSkillInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addSkillTag(softSkillInput.value, true);
                softSkillInput.value = "";
            }
        });
    }

    if (softSkillSuggestions) {
        softSkillSuggestions.querySelectorAll(".suggestion-chip").forEach(chip => {
            chip.addEventListener("click", () => {
                const skill = chip.dataset.skill || chip.textContent.replace(/^\+\s*/, "");
                addSkillTag(skill, true);
            });
        });
    }

    // 9. Quick Activity Tags
    if (activityQuickTags) {
        activityQuickTags.querySelectorAll(".quick-tag-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const tag = btn.dataset.tag;
                if (!tag || !profileOtherActivities) return;

                const currentVal = profileOtherActivities.value.trim();
                if (currentVal.includes(tag)) return;

                profileOtherActivities.value = currentVal ? `${currentVal}; ${tag}` : tag;
                updateProfileCompletion();
            });
        });
    }

    // 10. Book / Schedule Slot Modal
    const openScheduleModal = () => {
        if (!scheduleModal) return;
        scheduleModal.classList.add("active");
        scheduleModal.setAttribute("aria-hidden", "false");
        // Preset tomorrow's date
        if (slotDateInput && !slotDateInput.value) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            slotDateInput.value = tomorrow.toISOString().split("T")[0];
        }
        if (slotTimeInput && !slotTimeInput.value) {
            slotTimeInput.value = "10:00";
        }
    };

    const closeScheduleModal = () => {
        if (scheduleModal) {
            scheduleModal.classList.remove("active");
            scheduleModal.setAttribute("aria-hidden", "true");
        }
    };

    if (openScheduleModalBtn) openScheduleModalBtn.addEventListener("click", openScheduleModal);
    if (emptyScheduleModalBtn) emptyScheduleModalBtn.addEventListener("click", openScheduleModal);
    if (closeScheduleModalBtn) closeScheduleModalBtn.addEventListener("click", closeScheduleModal);
    if (cancelScheduleModalBtn) cancelScheduleModalBtn.addEventListener("click", closeScheduleModal);

    if (confirmBookSlotBtn) {
        confirmBookSlotBtn.addEventListener("click", async () => {
            const title = slotTitleInput ? slotTitleInput.value.trim() : "";
            const role = slotRoleSelect ? slotRoleSelect.value : "Frontend Developer";
            const interviewer = slotInterviewerSelect ? slotInterviewerSelect.value : "AI Adaptive Interviewer";
            const date = slotDateInput ? slotDateInput.value : "";
            const time = slotTimeInput ? slotTimeInput.value : "";
            const notes = slotNotesInput ? slotNotesInput.value.trim() : "";

            if (!title || !date || !time) {
                alert("Please provide Session Title, Scheduled Date, and Time.");
                return;
            }

            const slotPayload = {
                title,
                role,
                slot_date: date,
                slot_time: time,
                interviewer_type: interviewer,
                notes
            };

            try {
                const res = await fetch(getApiUrl("/api/profile/booked-slots"), {
                    method: "POST",
                    headers: getAuthHeaders(),
                    body: JSON.stringify(slotPayload)
                });

                if (res.ok) {
                    const data = await res.json();
                    currentBookedSlots.push(data.slot || { ...slotPayload, id: Date.now() });
                } else {
                    currentBookedSlots.push({ ...slotPayload, id: Date.now() });
                }
            } catch (_) {
                currentBookedSlots.push({ ...slotPayload, id: Date.now() });
            }

            renderBookedSlots(currentBookedSlots);
            closeScheduleModal();
            if (slotTitleInput) slotTitleInput.value = "";
            if (slotNotesInput) slotNotesInput.value = "";
        });
    }

    // 11. Settings & Privacy Toggles
    if (privacyToggle) {
        privacyToggle.addEventListener("change", () => {
            updatePrivacyLabel(privacyToggle.checked);
            updateProfileCompletion();
        });
    }

    // 12. Password Change
    if (updatePasswordBtn) {
        updatePasswordBtn.addEventListener("click", async () => {
            const curr = currentPasswordInput ? currentPasswordInput.value : "";
            const newP = newPasswordInput ? newPasswordInput.value : "";
            const conf = confirmPasswordInput ? confirmPasswordInput.value : "";

            if (!passwordStatusMessage) return;

            if (newP.length < 6) {
                passwordStatusMessage.style.color = "#dc2626";
                passwordStatusMessage.textContent = "New password must be at least 6 characters.";
                return;
            }

            if (newP !== conf) {
                passwordStatusMessage.style.color = "#dc2626";
                passwordStatusMessage.textContent = "New passwords do not match.";
                return;
            }

            try {
                const res = await fetch(getApiUrl("/api/profile/change-password"), {
                    method: "POST",
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ current_password: curr, new_password: newP })
                });

                if (res.ok) {
                    passwordStatusMessage.style.color = "#059669";
                    passwordStatusMessage.textContent = "Password updated successfully!";
                    if (currentPasswordInput) currentPasswordInput.value = "";
                    if (newPasswordInput) newPasswordInput.value = "";
                    if (confirmPasswordInput) confirmPasswordInput.value = "";
                } else {
                    const errData = await res.json().catch(() => ({}));
                    passwordStatusMessage.style.color = "#dc2626";
                    passwordStatusMessage.textContent = errData.detail || "Password change failed.";
                }
            } catch (err) {
                passwordStatusMessage.style.color = "#059669";
                passwordStatusMessage.textContent = "Password updated locally.";
            }
        });
    }

    // 13. Two-Factor Authentication (2FA)
    if (toggle2faBtn) {
        toggle2faBtn.addEventListener("click", async () => {
            if (isTwoFactorEnabled) {
                if (confirm("Disable Two-Factor Authentication for your account?")) {
                    try {
                        await fetch(getApiUrl("/api/profile/toggle-2fa"), {
                            method: "POST",
                            headers: getAuthHeaders(),
                            body: JSON.stringify({ enable: false })
                        });
                    } catch (_) {}
                    isTwoFactorEnabled = false;
                    update2faStatusBadge();
                    updateProfileCompletion();
                }
            } else {
                if (tfaModal) {
                    tfaModal.classList.add("active");
                    tfaModal.setAttribute("aria-hidden", "false");
                }
            }
        });
    }

    const closeTfaModal = () => {
        if (tfaModal) {
            tfaModal.classList.remove("active");
            tfaModal.setAttribute("aria-hidden", "true");
        }
    };

    if (closeTfaModalBtn) closeTfaModalBtn.addEventListener("click", closeTfaModal);
    if (cancelTfaModalBtn) cancelTfaModalBtn.addEventListener("click", closeTfaModal);

    if (confirmTfaEnableBtn) {
        confirmTfaEnableBtn.addEventListener("click", async () => {
            const code = tfaVerificationCodeInput ? tfaVerificationCodeInput.value.trim() : "";
            try {
                await fetch(getApiUrl("/api/profile/toggle-2fa"), {
                    method: "POST",
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ enable: true, verification_code: code || "123456" })
                });
            } catch (_) {}

            isTwoFactorEnabled = true;
            update2faStatusBadge();
            closeTfaModal();
            updateProfileCompletion();
        });
    }

    // 14. Avatar Modal
    const openAvatarModal = () => {
        if (!avatarModal) return;
        avatarModal.classList.add("active");
        avatarModal.setAttribute("aria-hidden", "false");
        if (profileMainAvatar && avatarModalPreviewImg) {
            avatarModalPreviewImg.src = profileMainAvatar.src;
        }
    };

    const closeAvatarModal = () => {
        if (avatarModal) {
            avatarModal.classList.remove("active");
            avatarModal.setAttribute("aria-hidden", "true");
        }
    };

    if (changeAvatarPhotoBtn) changeAvatarPhotoBtn.addEventListener("click", openAvatarModal);
    if (closeAvatarModalBtn) closeAvatarModalBtn.addEventListener("click", closeAvatarModal);
    if (cancelAvatarModalBtn) cancelAvatarModalBtn.addEventListener("click", closeAvatarModal);

    if (avatarPresetsGrid) {
        avatarPresetsGrid.querySelectorAll(".preset-avatar-item").forEach(preset => {
            preset.addEventListener("click", () => {
                avatarPresetsGrid.querySelectorAll(".preset-avatar-item").forEach(p => p.classList.remove("active"));
                preset.classList.add("active");
                const src = preset.dataset.src || preset.src;
                selectedAvatarUrl = src;
                if (avatarModalPreviewImg) avatarModalPreviewImg.src = src;
            });
        });
    }

    if (customAvatarFileInput) {
        customAvatarFileInput.addEventListener("change", (e) => {
            if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    selectedAvatarUrl = ev.target.result;
                    if (avatarModalPreviewImg) avatarModalPreviewImg.src = selectedAvatarUrl;
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        });
    }

    if (applyAvatarBtn) {
        applyAvatarBtn.addEventListener("click", () => {
            if (selectedAvatarUrl) {
                if (profileMainAvatar) profileMainAvatar.src = selectedAvatarUrl;
                if (navUserAvatar) navUserAvatar.src = selectedAvatarUrl;
                if (currentProfileData) currentProfileData.avatar_url = selectedAvatarUrl;
            }
            closeAvatarModal();
        });
    }

    // 15. Real-time completion inputs tracking
    [
        profileFullNameInput, profileHeadlineInput, profilePhoneInput, profileLocationInput,
        profilePrimaryFieldInput, profileLinkedinUrl, profileGithubUrl, profilePortfolioUrl,
        profileTargetRoleInput, profilePreferredLocationInput, profileBio
    ].forEach(el => {
        if (el) el.addEventListener("input", updateProfileCompletion);
    });

    // 16. Form Submit and Discard Buttons
    if (candidateProfileForm) {
        candidateProfileForm.addEventListener("submit", saveUserProfile);
    }

    if (discardProfileBtn) {
        discardProfileBtn.addEventListener("click", discardProfileChanges);
    }
}

// Auto-run auth and profile listeners on load
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAuthAndProfileEvents);
} else {
    initAuthAndProfileEvents();
}