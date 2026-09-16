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

const API_BASE_URL = (window.location.port === "8000" || window.location.port === "")
    ? (window.location.origin || `http://${window.location.hostname || "127.0.0.1"}:8000`)
    : `http://${window.location.hostname || "127.0.0.1"}:8000`;

const ANALYZE_API_URL = `${API_BASE_URL}/analyze-resume`;
const EVALUATE_API_URL = `${API_BASE_URL}/evaluate-interview`;
const ADAPTIVE_API_URL = `${API_BASE_URL}/adaptive-interview`;

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
   2. MOBILE NAVIGATION DRAWER & SIDEBAR TOGGLE
========================================================= */

if (menuButton && navLinks) {
    menuButton.addEventListener("click", () => {
        const isOpen = navLinks.classList.contains("show");
        menuButton.setAttribute("aria-expanded", String(!isOpen));
        navLinks.classList.toggle("show");
    });
}

// Close mobile menu upon link click
document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
        if (window.innerWidth <= 992 && navLinks) {
            navLinks.classList.remove("show");
            if (menuButton) menuButton.setAttribute("aria-expanded", "false");
        }
    });
});

if (topbarSampleBtn && loadSampleBtn) {
    topbarSampleBtn.addEventListener("click", (e) => {
        e.preventDefault();
        loadSampleBtn.click();
        const analyzeEl = document.getElementById("analyze");
        if (analyzeEl) analyzeEl.scrollIntoView({ behavior: "smooth", block: "start" });
    });
}

// ScrollSpy Navigation
window.addEventListener("scroll", () => {
    const targetSections = ["home", "how-it-works", "features", "analyze", "resultSection", "interviewSection"];
    let currentSectionId = "";
    
    for (const id of targetSections) {
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

if (roleInput) {
    roleInput.addEventListener("change", () => {
        hideFormAlert();
        hideError();
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

    const role = roleInput ? roleInput.value.trim() : "";
    const jobDescription = jobDescriptionInput ? jobDescriptionInput.value.trim() : "";

    if (!role && !selectedResumeFile) {
        showFormAlert("Please select your target job role and upload your resume file (PDF, DOCX, or DOC).");
        if (roleInput) roleInput.focus();
        return;
    }

    if (!role) {
        showFormAlert("Please select your target job role from the dropdown.");
        if (roleInput) roleInput.focus();
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
        const response = await fetch(ANALYZE_API_URL, {
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
        if (friendlyMsg.toLowerCase().includes("failed to fetch") || friendlyMsg.toLowerCase().includes("networkerror")) {
            friendlyMsg = `Cannot connect to AI backend at ${API_BASE_URL}. Please ensure the backend server is running on port 8000.`;
        }

        if (loadingBox) {
            loadingBox.classList.remove("show");
        }

        showError(friendlyMsg);
        showFormAlert(friendlyMsg);

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

    if (isLoading) {
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
        return data.detail;
    }
    return `Server responded with error status ${status}.`;
}

async function parseResponse(response) {
    const text = await response.text();
    if (!text) return {};
    try {
        return JSON.parse(text);
    } catch {
        return { detail: text };
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
        latestAnalysisData.role || (roleInput ? roleInput.value : "Software Developer")
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

    if (interviewCard) {
        interviewCard.classList.add("show");
    }

    resetAdaptiveFeedback();
    renderCurrentQuestion();
}

function openInterviewSection() {
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
        const response = await fetch(ADAPTIVE_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                role: latestAnalysisData?.role || (roleInput ? roleInput.value : "Software Developer"),
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
    if (interviewErrorMessage) {
        interviewErrorMessage.textContent = msg;
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

        const response = await fetch(EVALUATE_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                role: latestAnalysisData?.role || (roleInput ? roleInput.value : "Software Developer"),
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
});