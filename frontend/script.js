const ANALYZE_API_URL = "http://127.0.0.1:8000/analyze-resume";
const EVALUATE_API_URL = "http://127.0.0.1:8000/evaluate-interview";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const menuButton = document.getElementById("menuButton");
const navLinks = document.getElementById("navLinks");
const resumeForm = document.getElementById("resumeForm");
const roleInput = document.getElementById("role");
const jobDescriptionInput = document.getElementById("jobDescription");
const jobDescriptionCount = document.getElementById("jobDescriptionCount");
const uploadArea = document.getElementById("uploadArea");
const resumeFileInput = document.getElementById("resumeFile");
const selectedFileBox = document.getElementById("selectedFile");
const fileName = document.getElementById("fileName");
const fileSize = document.getElementById("fileSize");
const removeFileButton = document.getElementById("removeFile");
const analyzeButton = document.querySelector(".analyze-button");
const resultSection = document.getElementById("resultSection");
const loadingBox = document.getElementById("loadingBox");
const errorBox = document.getElementById("errorBox");
const errorMessage = document.getElementById("errorMessage");
const analysisCard = document.getElementById("analysisCard");
const analysisRole = document.getElementById("analysisRole");
const analysisFileName = document.getElementById("analysisFileName");
const analysisContent = document.getElementById("analysisContent");
const copyResultButton = document.getElementById("copyResultButton");
const startInterviewButton = document.getElementById("startInterviewButton");

const interviewSection = document.getElementById("interviewSection");
const interviewCard = document.getElementById("interviewCard");
const questionCategory = document.getElementById("questionCategory");
const questionCounter = document.getElementById("questionCounter");
const answeredCounter = document.getElementById("answeredCounter");
const questionProgressBar = document.getElementById("questionProgressBar");
const interviewQuestion = document.getElementById("interviewQuestion");
const interviewAnswer = document.getElementById("interviewAnswer");
const answerValidationMessage = document.getElementById("answerValidationMessage");
const answerCharacterCount = document.getElementById("answerCharacterCount");
const previousQuestionButton = document.getElementById("previousQuestionButton");
const nextQuestionButton = document.getElementById("nextQuestionButton");
const interviewLoading = document.getElementById("interviewLoading");
const interviewError = document.getElementById("interviewError");
const interviewErrorMessage = document.getElementById("interviewErrorMessage");
const evaluationCard = document.getElementById("evaluationCard");
const evaluationRole = document.getElementById("evaluationRole");
const evaluationContent = document.getElementById("evaluationContent");
const copyEvaluationButton = document.getElementById("copyEvaluationButton");
const restartInterviewButton = document.getElementById("restartInterviewButton");

let selectedResumeFile = null;
let currentAnalysisText = "";
let currentEvaluationText = "";
let latestAnalysisData = null;
let interviewQuestions = [];
let interviewAnswers = [];
let currentQuestionIndex = 0;

function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function validateResume(file) {
    if (!file) return "Please select a resume PDF.";

    if (!file.name.toLowerCase().endsWith(".pdf")) {
        return "Only PDF resumes are supported.";
    }

    if (file.size === 0) return "The selected PDF is empty.";

    if (file.size > MAX_FILE_SIZE) {
        return "Resume size must be less than 5 MB.";
    }

    return "";
}

function selectResume(file) {
    const validationError = validateResume(file);

    if (validationError) {
        selectedResumeFile = null;
        resumeFileInput.value = "";
        showAnalysisError(validationError);
        return;
    }

    selectedResumeFile = file;
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    selectedFileBox.classList.add("show");
    hideAnalysisStates();
}

function clearSelectedResume() {
    selectedResumeFile = null;
    resumeFileInput.value = "";
    fileName.textContent = "";
    fileSize.textContent = "";
    selectedFileBox.classList.remove("show");
}

function setAnalyzeLoading(isLoading) {
    analyzeButton.disabled = isLoading;
    analyzeButton.innerHTML = isLoading
        ? '<span>Analyzing...</span><i class="fa-solid fa-spinner fa-spin"></i>'
        : '<span>Analyze My Resume</span><i class="fa-solid fa-wand-magic-sparkles"></i>';
}

function openResultSection() {
    resultSection.classList.add("show");
    resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function hideAnalysisStates() {
    loadingBox.classList.remove("show");
    errorBox.classList.remove("show");
    analysisCard.classList.remove("show");
}

function showAnalysisLoading() {
    hideAnalysisStates();
    openResultSection();
    loadingBox.classList.add("show");
}

function showAnalysisError(message) {
    hideAnalysisStates();
    openResultSection();
    errorMessage.textContent = message;
    errorBox.classList.add("show");
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatInlineMarkdown(value) {
    return escapeHtml(value)
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/`(.+?)`/g, "<code>$1</code>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

function markdownToHtml(markdown) {
    const lines = String(markdown).replace(/\r/g, "").split("\n");
    let html = "";
    let listType = "";

    const closeList = () => {
        if (listType) {
            html += `</${listType}>`;
            listType = "";
        }
    };

    for (const rawLine of lines) {
        const line = rawLine.trim();

        if (!line) {
            closeList();
            continue;
        }

        const heading = line.match(/^(#{2,4})\s+(.+)$/);

        if (heading) {
            closeList();
            const level = heading[1].length === 2 ? 3 : 4;
            html += `<h${level}>${formatInlineMarkdown(heading[2])}</h${level}>`;
            continue;
        }

        const unorderedItem = line.match(/^[-*•]\s+(.+)$/);

        if (unorderedItem) {
            if (listType !== "ul") {
                closeList();
                listType = "ul";
                html += "<ul>";
            }

            html += `<li>${formatInlineMarkdown(unorderedItem[1])}</li>`;
            continue;
        }

        const orderedItem = line.match(/^\d+[.)]\s+(.+)$/);

        if (orderedItem) {
            if (listType !== "ol") {
                closeList();
                listType = "ol";
                html += "<ol>";
            }

            html += `<li>${formatInlineMarkdown(orderedItem[1])}</li>`;
            continue;
        }

        closeList();
        html += `<p>${formatInlineMarkdown(line)}</p>`;
    }

    closeList();
    return html;
}

function getApiErrorMessage(data, status) {
    if (typeof data.detail === "string") return data.detail;

    if (Array.isArray(data.detail)) {
        return data.detail.map((item) => item.msg).filter(Boolean).join(" ");
    }

    return `Request failed with status ${status}.`;
}

async function parseResponse(response) {
    try {
        return await response.json();
    } catch {
        return {};
    }
}

function showAnalysis(data, jobDescription) {
    hideAnalysisStates();
    openResultSection();

    currentAnalysisText = data.analysis || "";
    latestAnalysisData = {
        ...data,
        jobDescription
    };

    analysisRole.textContent = data.role || "Resume Analysis";
    analysisFileName.textContent = data.filename || "Uploaded resume";
    analysisContent.innerHTML = markdownToHtml(currentAnalysisText);
    analysisCard.classList.add("show");
    startInterviewButton.style.display = "inline-flex";
}

function getMarkdownSection(markdown, heading) {
    const headingPattern = new RegExp(`##\\s+${heading}\\s*\\n`, "i");
    const match = headingPattern.exec(markdown);

    if (!match) return "";

    const remainingText = markdown.slice(match.index + match[0].length);
    const nextHeadingIndex = remainingText.search(/\n##\s+/);

    return nextHeadingIndex === -1
        ? remainingText
        : remainingText.slice(0, nextHeadingIndex);
}

function parseQuestions(section, category) {
    return section
        .replace(/\r/g, "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => line
            .replace(/^\s*(?:\d+[.)]|[-*•])\s*/, "")
            .replace(/^question\s*\d*\s*[:.-]\s*/i, "")
            .replace(/\*\*/g, "")
            .trim()
        )
        .filter((line) => line.includes("?"))
        .map((line) => ({
            category,
            question: line.slice(0, line.lastIndexOf("?") + 1)
        }));
}

function uniqueQuestions(items) {
    const seen = new Set();

    return items.filter((item) => {
        const key = item.question.toLowerCase().replace(/\s+/g, " ").trim();

        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function buildInterviewQuestions(analysis, role) {
    const technicalSection = getMarkdownSection(
        analysis,
        "Technical Interview Questions"
    );
    const hrSection = getMarkdownSection(
        analysis,
        "HR Interview Questions"
    );

    const technicalFallbacks = [
        `Walk me through a project that best demonstrates your fit for the ${role} role?`,
        `Which technical tools are you strongest in, and how have you used them?`,
        "Describe a difficult technical problem you faced and how you solved it?",
        "How do you test and verify the quality of your work?",
        `Which skill would you improve first to become stronger in the ${role} role?`
    ].map((question) => ({ category: "Technical", question }));

    const hrFallbacks = [
        `Tell me about yourself and why you are interested in the ${role} role?`,
        "Describe a time you worked with others to complete a difficult task?",
        "What are your strengths, and what are you currently improving?"
    ].map((question) => ({ category: "HR", question }));

    const technical = uniqueQuestions([
        ...parseQuestions(technicalSection, "Technical"),
        ...technicalFallbacks
    ]).slice(0, 5);

    const hr = uniqueQuestions([
        ...parseQuestions(hrSection, "HR"),
        ...hrFallbacks
    ]).slice(0, 3);

    return [...technical, ...hr];
}

function hideInterviewStates() {
    interviewCard.classList.remove("show");
    interviewLoading.classList.remove("show");
    interviewError.classList.remove("show");
    evaluationCard.classList.remove("show");
}

function openInterviewSection() {
    interviewSection.classList.add("show");
    interviewSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderCurrentQuestion() {
    const item = interviewQuestions[currentQuestionIndex];
    const savedAnswer = interviewAnswers[currentQuestionIndex] || "";
    const completedAnswers = interviewAnswers.filter(
        (answer) => answer.trim().length >= 10
    ).length;

    questionCategory.textContent = item.category;
    questionCategory.dataset.category = item.category.toLowerCase();
    questionCounter.textContent =
        `Question ${currentQuestionIndex + 1} of ${interviewQuestions.length}`;
    answeredCounter.textContent = `${completedAnswers} answered`;
    questionProgressBar.style.width =
        `${((currentQuestionIndex + 1) / interviewQuestions.length) * 100}%`;
    interviewQuestion.textContent = item.question;
    interviewAnswer.value = savedAnswer;
    answerCharacterCount.textContent = `${savedAnswer.length} / 5000`;
    answerValidationMessage.textContent = "Minimum 10 characters required.";
    answerValidationMessage.classList.remove("invalid");
    previousQuestionButton.disabled = currentQuestionIndex === 0;

    nextQuestionButton.innerHTML = currentQuestionIndex === interviewQuestions.length - 1
        ? 'Finish & Get Feedback <i class="fa-solid fa-wand-magic-sparkles"></i>'
        : 'Next Question <i class="fa-solid fa-arrow-right"></i>';

    window.setTimeout(() => interviewAnswer.focus(), 250);
}

function startInterview() {
    if (!latestAnalysisData || !currentAnalysisText) return;

    interviewQuestions = buildInterviewQuestions(
        currentAnalysisText,
        latestAnalysisData.role
    );
    interviewAnswers = new Array(interviewQuestions.length).fill("");
    currentQuestionIndex = 0;
    currentEvaluationText = "";

    hideInterviewStates();
    openInterviewSection();
    interviewCard.classList.add("show");
    renderCurrentQuestion();
}

function saveCurrentAnswer() {
    interviewAnswers[currentQuestionIndex] = interviewAnswer.value.trim();
}

function validateCurrentAnswer() {
    saveCurrentAnswer();
    const answer = interviewAnswers[currentQuestionIndex];

    if (answer.length < 10) {
        answerValidationMessage.textContent =
            "Please write at least 10 characters before continuing.";
        answerValidationMessage.classList.add("invalid");
        interviewAnswer.focus();
        return false;
    }

    answerValidationMessage.textContent = "Answer saved.";
    answerValidationMessage.classList.remove("invalid");
    return true;
}

async function evaluateInterview() {
    const answers = interviewQuestions.map((item, index) => ({
        category: item.category,
        question: item.question,
        answer: interviewAnswers[index]
    }));

    interviewCard.classList.remove("show");
    interviewError.classList.remove("show");
    evaluationCard.classList.remove("show");
    interviewLoading.classList.add("show");

    try {
        const response = await fetch(EVALUATE_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                role: latestAnalysisData.role,
                job_description: latestAnalysisData.jobDescription || "",
                answers
            })
        });

        const data = await parseResponse(response);

        if (!response.ok) {
            throw new Error(getApiErrorMessage(data, response.status));
        }

        if (!data.success || !data.evaluation) {
            throw new Error("The server returned incomplete interview feedback.");
        }

        currentEvaluationText = data.evaluation;
        evaluationRole.textContent = `${data.role} Interview Feedback`;
        evaluationContent.innerHTML = markdownToHtml(currentEvaluationText);
        interviewLoading.classList.remove("show");
        evaluationCard.classList.add("show");
        evaluationCard.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
        const message = error instanceof TypeError
            ? "Cannot connect to the backend. Keep the Uvicorn terminal running."
            : error.message;

        interviewLoading.classList.remove("show");
        interviewErrorMessage.textContent = message;
        interviewError.classList.add("show");
        interviewCard.classList.add("show");
    }
}

async function copyText(text, button, defaultHtml) {
    if (!text) return;

    try {
        await navigator.clipboard.writeText(text);
        button.innerHTML = '<i class="fa-solid fa-check"></i> Copied';

        window.setTimeout(() => {
            button.innerHTML = defaultHtml;
        }, 1800);
    } catch {
        button.innerHTML = '<i class="fa-solid fa-xmark"></i> Copy failed';
        window.setTimeout(() => {
            button.innerHTML = defaultHtml;
        }, 1800);
    }
}

menuButton?.addEventListener("click", () => {
    navLinks?.classList.toggle("show");
});

navLinks?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => navLinks.classList.remove("show"));
});

uploadArea.addEventListener("click", () => resumeFileInput.click());

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
    selectResume(event.dataTransfer.files[0]);
});

resumeFileInput.addEventListener("change", () => {
    selectResume(resumeFileInput.files[0]);
});

removeFileButton.addEventListener("click", clearSelectedResume);

jobDescriptionInput.addEventListener("input", () => {
    const length = jobDescriptionInput.value.length;
    jobDescriptionCount.textContent = `${length} / 10000`;
    jobDescriptionCount.classList.toggle("limit-reached", length >= 10000);
});

resumeForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const role = roleInput.value.trim();
    const jobDescription = jobDescriptionInput.value.trim();
    const validationError = validateResume(selectedResumeFile);

    if (!role) {
        showAnalysisError("Please select your target job role.");
        return;
    }

    if (validationError) {
        showAnalysisError(validationError);
        return;
    }

    const formData = new FormData();
    formData.append("role", role);
    formData.append("resume", selectedResumeFile);
    formData.append("job_description", jobDescription);

    setAnalyzeLoading(true);
    showAnalysisLoading();
    interviewSection.classList.remove("show");

    try {
        const response = await fetch(ANALYZE_API_URL, {
            method: "POST",
            body: formData
        });

        const data = await parseResponse(response);

        if (!response.ok) {
            throw new Error(getApiErrorMessage(data, response.status));
        }

        if (!data.success || !data.analysis) {
            throw new Error("The server returned an incomplete analysis.");
        }

        showAnalysis(data, jobDescription);
    } catch (error) {
        const message = error instanceof TypeError
            ? "Cannot connect to the backend. Keep the Uvicorn terminal running."
            : error.message;

        showAnalysisError(message);
    } finally {
        setAnalyzeLoading(false);
    }
});

interviewAnswer.addEventListener("input", () => {
    const length = interviewAnswer.value.length;
    interviewAnswers[currentQuestionIndex] = interviewAnswer.value;
    answerCharacterCount.textContent = `${length} / 5000`;

    if (length >= 10) {
        answerValidationMessage.textContent = "Answer ready.";
        answerValidationMessage.classList.remove("invalid");
    }
});

startInterviewButton.addEventListener("click", startInterview);

previousQuestionButton.addEventListener("click", () => {
    saveCurrentAnswer();

    if (currentQuestionIndex > 0) {
        currentQuestionIndex -= 1;
        renderCurrentQuestion();
    }
});

nextQuestionButton.addEventListener("click", async () => {
    if (!validateCurrentAnswer()) return;

    if (currentQuestionIndex < interviewQuestions.length - 1) {
        currentQuestionIndex += 1;
        renderCurrentQuestion();
        return;
    }

    await evaluateInterview();
});

restartInterviewButton.addEventListener("click", startInterview);

copyResultButton.addEventListener("click", () => copyText(
    currentAnalysisText,
    copyResultButton,
    '<i class="fa-regular fa-copy"></i> Copy Result'
));

copyEvaluationButton.addEventListener("click", () => copyText(
    currentEvaluationText,
    copyEvaluationButton,
    '<i class="fa-regular fa-copy"></i> Copy Feedback'
));

hideAnalysisStates();
hideInterviewStates();
startInterviewButton.style.display = "none";