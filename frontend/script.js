/* =========================================================
   AI Interview Assistant - Frontend Logic
   ========================================================= */

const ANALYZE_API_URL = "http://127.0.0.1:8000/analyze-resume";
const EVALUATE_API_URL = "http://127.0.0.1:8000/evaluate-interview";
const ADAPTIVE_API_URL = "http://127.0.0.1:8000/adaptive-interview";

const MAX_ADAPTIVE_QUESTIONS = 8;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// Navigation Elements
const menuButton = document.getElementById("menuButton");
const navLinks = document.getElementById("navLinks");

// Form & Input Elements
const resumeForm = document.getElementById("resumeForm");
const roleInput = document.getElementById("role");
const jobDescriptionInput = document.getElementById("jobDescription");
const jobDescriptionCount = document.getElementById("jobDescriptionCount");

// File Upload Elements
const uploadArea = document.getElementById("uploadArea");
const resumeFileInput = document.getElementById("resumeFile");
const selectedFileBox = document.getElementById("selectedFile");
const fileName = document.getElementById("fileName");
const fileSize = document.getElementById("fileSize");
const removeFileButton = document.getElementById("removeFile");
const analyzeButton = document.querySelector(".analyze-button");

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

// Analysis Report Elements
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
const interviewAnswer = document.getElementById("interviewAnswer");
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

let interviewQuestions = [];
let interviewAnswers = [];
let currentQuestionIndex = 0;
let currentEvaluationText = "";

let adaptiveDifficulty = "medium";
let adaptiveHistory = [];
let isAdaptiveMode = true;
let isAdaptiveSubmitting = false;


/* =========================================================
   BASIC UI & NAVIGATION
========================================================= */

if (menuButton) {
    menuButton.addEventListener("click", () => {
        if (navLinks) {
            navLinks.classList.toggle("show");
        }
    });
}

if (jobDescriptionInput) {
    jobDescriptionInput.addEventListener("input", () => {
        const count = jobDescriptionInput.value.length;
        if (jobDescriptionCount) {
            jobDescriptionCount.textContent = `${count} / 10000`;
            if (count >= 10000) {
                jobDescriptionCount.classList.add("limit-reached");
            } else {
                jobDescriptionCount.classList.remove("limit-reached");
            }
        }
    });
}


/* =========================================================
   FILE UPLOAD & DRAG-AND-DROP
========================================================= */

if (uploadArea && resumeFileInput) {
    uploadArea.addEventListener("click", () => {
        resumeFileInput.click();
    });

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
}

if (removeFileButton) {
    removeFileButton.addEventListener("click", (event) => {
        event.stopPropagation();
        selectedResumeFile = null;
        if (resumeFileInput) {
            resumeFileInput.value = "";
        }
        if (selectedFileBox) {
            selectedFileBox.classList.remove("show");
        }
    });
}

function handleSelectedFile(file) {
    const parts = file.name.split(".");
    const extension = parts.length > 1 ? parts.pop().toLowerCase() : "";

    if (!["pdf", "doc", "docx"].includes(extension)) {
        showError("Please upload a PDF, DOC, or DOCX resume.");
        return;
    }

    if (file.size > MAX_FILE_SIZE) {
        showError("File size must be less than 5 MB.");
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

    hideError();
}

function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}


/* =========================================================
   RESUME ANALYSIS & DASHBOARD RENDERING
========================================================= */

if (resumeForm) {
    resumeForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        await analyzeResume();
    });
}

async function analyzeResume() {
    hideError();

    if (!selectedResumeFile) {
        showError("Please upload your resume first.");
        return;
    }

    const role = roleInput ? roleInput.value.trim() : "";
    const jobDescription = jobDescriptionInput ? jobDescriptionInput.value.trim() : "";

    if (!role) {
        showError("Please enter or select your target job role.");
        if (roleInput) roleInput.focus();
        return;
    }

    const formData = new FormData();
    // Provide both "resume" and "file" for total backend compatibility
    formData.append("resume", selectedResumeFile);
    formData.append("file", selectedResumeFile);
    formData.append("role", role);
    formData.append("job_description", jobDescription);

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

        displayAnalysis(data);

        if (resultSection) {
            resultSection.classList.add("show");
            resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }

    } catch (error) {
        console.error("Resume analysis error:", error);
        showError(error.message || "Unable to analyze the resume.");
    } finally {
        setAnalyzeLoading(false);
    }
}

function displayAnalysis(data) {
    if (analysisRole) {
        analysisRole.textContent = data.role || (roleInput ? roleInput.value : "Target Role");
    }

    if (analysisFileName) {
        analysisFileName.textContent = data.filename || (selectedResumeFile ? selectedResumeFile.name : "");
    }

    // Render Dashboard if structured data is present
    if (data.dashboard) {
        displayDashboard(data.dashboard);
    }

    // Render Detailed Markdown Analysis
    if (analysisContent) {
        const text = data.analysis || data.result || "No analysis available.";
        analysisContent.innerHTML = formatMarkdownToHtml(text);
    }

    if (analysisCard) {
        analysisCard.classList.add("show");
    }
}

function displayDashboard(dashboard) {
    if (!dashboard || !dashboardWrapper) return;

    // 1. ATS Score & Rating
    const score = Number(dashboard.ats_score ?? 75);
    if (atsScoreValue) atsScoreValue.textContent = score;

    const rating = dashboard.ats_rating || (score >= 80 ? "Excellent" : score >= 65 ? "Good" : "Needs Improvement");
    if (atsScoreRating) {
        atsScoreRating.textContent = rating;
        atsScoreRating.className = `ats-rating-badge rating-${rating.toLowerCase().replace(/\s+/g, '-')}`;
    }

    if (atsMeterCircle) {
        // Circumference for r=42 is ~263.89
        const circumference = 263.89;
        const offset = circumference - (circumference * Math.min(100, Math.max(0, score)) / 100);
        atsMeterCircle.style.strokeDashoffset = offset;
    }

    // Breakdown Meters
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

    // 2. Job Match & Summary
    const matchScore = Number(dashboard.job_match_score ?? score);
    if (jobMatchValue) jobMatchValue.textContent = `${matchScore}%`;

    if (candidateSummaryText) {
        candidateSummaryText.textContent = dashboard.summary || "Candidate profile evaluated for target role.";
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

    // 3. Extracted Skills
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

    // 5. Improvements Checklist
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
        container.innerHTML = `<span style="font-size: 11px; color: var(--text-secondary);">None identified</span>`;
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

        // Headers
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

        // Bullet lists
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

        // Paragraphs
        output.push(`<p>${formatInlineText(line)}</p>`);
    }

    if (inList) {
        output.push("</ul>");
    }

    return output.join("\n");
}

function formatInlineText(text) {
    let formatted = escapeHtml(text);
    // Bold: **text**
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    // Italic: *text*
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

function setAnalyzeLoading(isLoading) {
    if (!analyzeButton) return;
    analyzeButton.disabled = isLoading;

    if (isLoading) {
        analyzeButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Analyzing Resume...';
        if (loadingBox) loadingBox.classList.add("show");
    } else {
        analyzeButton.innerHTML = '<span>Analyze My Resume</span> <i class="fa-solid fa-wand-magic-sparkles"></i>';
        if (loadingBox) loadingBox.classList.remove("show");
    }
}


/* =========================================================
   ERROR & RESPONSE HELPERS
========================================================= */

function showError(message) {
    if (errorMessage) {
        errorMessage.textContent = message;
    }
    if (errorBox) {
        errorBox.classList.add("show");
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
    return `Request failed with status ${status}.`;
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
   COPY RESULTS TO CLIPBOARD
========================================================= */

if (copyResultButton) {
    copyResultButton.addEventListener("click", async () => {
        const text = currentAnalysisText || analysisContent?.innerText || "";
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            const original = copyResultButton.innerHTML;
            copyResultButton.innerHTML = '<i class="fa-solid fa-check"></i> Copied';
            setTimeout(() => {
                copyResultButton.innerHTML = original;
            }, 1500);
        } catch (error) {
            console.error("Clipboard error:", error);
        }
    });
}

if (copyEvaluationButton) {
    copyEvaluationButton.addEventListener("click", async () => {
        const text = currentEvaluationText || evaluationContent?.innerText || "";
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            const original = copyEvaluationButton.innerHTML;
            copyEvaluationButton.innerHTML = '<i class="fa-solid fa-check"></i> Copied';
            setTimeout(() => {
                copyEvaluationButton.innerHTML = original;
            }, 1500);
        } catch (error) {
            console.error("Clipboard error:", error);
        }
    });
}


/* =========================================================
   INTERVIEW QUESTION GENERATION
========================================================= */

function buildInterviewQuestions(analysisText, role) {
    const questions = [];

    // Prioritize questions extracted directly from the candidate's resume analysis
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
        question: `Explain an important technical concept or project related to ${role}. How would you implement it in a real project?`
    });

    if (lowerText.includes("java")) {
        questions.push({
            category: "Technical",
            question: "What is the difference between an interface and an abstract class in Java?"
        });
    } else if (lowerText.includes("python")) {
        questions.push({
            category: "Technical",
            question: "What is the difference between a list, tuple, and set in Python, and when would you use each?"
        });
    } else {
        questions.push({
            category: "Technical",
            question: `What are the most critical technical skills required for a ${role}, and how have you used them?`
        });
    }

    questions.push({
        category: "Technical",
        question: "Describe a difficult technical bug or challenge you solved. What was your systematic approach?"
    });

    questions.push({
        category: "HR",
        question: "Tell me about yourself and why you are interested in pursuing this role."
    });

    questions.push({
        category: "HR",
        question: "Describe a situation where you had to work under a tight deadline. How did you manage it?"
    });

    return questions;
}


/* =========================================================
   ADAPTIVE INTERVIEW WORKFLOW
========================================================= */

if (startInterviewButton) {
    startInterviewButton.addEventListener("click", startInterview);
}

function startInterview() {
    if (!latestAnalysisData || !currentAnalysisText) {
        showError("Please analyze your resume before starting the interview.");
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
            message += ` Good: ${evaluation.what_was_good}`;
        }
        if (evaluation?.what_to_improve) {
            message += ` Improve: ${evaluation.what_to_improve}`;
        }
        adaptiveFeedbackText.textContent = message;
    }

    adaptiveFeedback.classList.add("show");
}

function renderCurrentQuestion() {
    const item = interviewQuestions[currentQuestionIndex];
    if (!item) return;

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

    if (answerCharacterCount) {
        answerCharacterCount.textContent = `${savedAnswer.length} / 5000`;
    }

    if (answerValidationMessage) {
        answerValidationMessage.textContent = "Minimum 10 characters required.";
        answerValidationMessage.classList.remove("invalid");
    }

    updateDifficultyBadge();

    if (isAdaptiveMode) {
        if (previousQuestionButton) {
            previousQuestionButton.style.display = "none";
        }
        if (nextQuestionButton) {
            nextQuestionButton.innerHTML = currentQuestionIndex === MAX_ADAPTIVE_QUESTIONS - 1
                ? 'Finish Interview <i class="fa-solid fa-flag-checkered"></i>'
                : 'Submit Answer <i class="fa-solid fa-arrow-right"></i>';
        }
    } else {
        if (previousQuestionButton) {
            previousQuestionButton.style.display = "";
            previousQuestionButton.disabled = currentQuestionIndex === 0;
        }
        if (nextQuestionButton) {
            nextQuestionButton.innerHTML = currentQuestionIndex === interviewQuestions.length - 1
                ? 'Finish & Get Feedback <i class="fa-solid fa-wand-magic-sparkles"></i>'
                : 'Next Question <i class="fa-solid fa-arrow-right"></i>';
        }
    }

    setTimeout(() => {
        if (interviewAnswer) interviewAnswer.focus();
    }, 200);
}


/* =========================================================
   ANSWER HANDLING & VALIDATION
========================================================= */

if (interviewAnswer) {
    interviewAnswer.addEventListener("input", () => {
        const value = interviewAnswer.value;
        interviewAnswers[currentQuestionIndex] = value;

        if (answerCharacterCount) {
            answerCharacterCount.textContent = `${value.length} / 5000`;
        }
        if (answerValidationMessage) {
            answerValidationMessage.classList.remove("invalid");
        }
    });
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
            answerValidationMessage.textContent = "Please write at least 10 characters before continuing.";
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
   ADAPTIVE ANSWER SUBMISSION & QUESTION TRANSITION
========================================================= */

async function submitAdaptiveAnswer() {
    if (isAdaptiveSubmitting) return;
    if (!validateCurrentAnswer()) return;

    const currentItem = interviewQuestions[currentQuestionIndex];
    const answer = interviewAnswers[currentQuestionIndex];
    if (!currentItem) return;

    isAdaptiveSubmitting = true;

    if (nextQuestionButton) {
        nextQuestionButton.disabled = true;
        nextQuestionButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> AI Evaluating...';
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

        // Check if finished final question
        if (currentQuestionIndex >= MAX_ADAPTIVE_QUESTIONS - 1) {
            await evaluateInterview();
            return;
        }

        // Get next question
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
        if (interviewErrorMessage) {
            interviewErrorMessage.textContent = error.message || "Something went wrong while evaluating your answer.";
        }
        if (interviewError) {
            interviewError.classList.add("show");
        }
    } finally {
        isAdaptiveSubmitting = false;
        if (nextQuestionButton) nextQuestionButton.disabled = false;
        if (previousQuestionButton) previousQuestionButton.disabled = false;

        if (nextQuestionButton && currentQuestionIndex < MAX_ADAPTIVE_QUESTIONS) {
            nextQuestionButton.innerHTML = currentQuestionIndex === MAX_ADAPTIVE_QUESTIONS - 1
                ? 'Finish Interview <i class="fa-solid fa-flag-checkered"></i>'
                : 'Submit Answer <i class="fa-solid fa-arrow-right"></i>';
        }
    }
}


/* =========================================================
   NAVIGATION BUTTONS
========================================================= */

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
   FINAL INTERVIEW EVALUATION
========================================================= */

async function evaluateInterview() {
    saveCurrentAnswer();

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
        if (interviewErrorMessage) {
            interviewErrorMessage.textContent = error.message || "Unable to generate interview feedback.";
        }
        if (interviewError) {
            interviewError.classList.add("show");
        }
    } finally {
        if (interviewLoading) interviewLoading.classList.remove("show");
        if (nextQuestionButton) nextQuestionButton.disabled = false;
    }
}

function displayEvaluation(data) {
    if (evaluationRole) {
        evaluationRole.textContent = data.role || (latestAnalysisData ? latestAnalysisData.role : "Interview Evaluation");
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
   RESTART INTERVIEW
========================================================= */

if (restartInterviewButton) {
    restartInterviewButton.addEventListener("click", () => {
        if (latestAnalysisData && currentAnalysisText) {
            startInterview();
        } else {
            hideInterviewStates();
        }
    });
}


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    updateDifficultyBadge();

    if (jobDescriptionInput && jobDescriptionCount) {
        jobDescriptionCount.textContent = `${jobDescriptionInput.value.length} / 10000`;
    }
});