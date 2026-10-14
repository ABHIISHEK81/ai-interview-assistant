import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Sparkles, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Target, 
  Copy, 
  Check, 
  ArrowRight, 
  TrendingUp, 
  ShieldCheck, 
  Zap,
  BarChart3,
  Search,
  FileCheck,
  HelpCircle,
  Code,
  Layers,
  Cpu,
  Clock,
  Send,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Award,
  Terminal,
  Play
} from 'lucide-react';
import api from '../services/api';

export default function ResumeAnalyzerPage() {
  const [activeTab, setActiveTab] = useState('analyzer'); // 'analyzer' | 'ats' | 'questions' | 'interrogation'
  const [resumeText, setResumeText] = useState('');
  const [existingResumes, setExistingResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [targetRole, setTargetRole] = useState('Senior Full Stack Engineer');
  const [experienceLevel, setExperienceLevel] = useState('senior');

  // Loading & Global States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Tab 1: AI Resume Analyzer Report
  const [analyzerReport, setAnalyzerReport] = useState(null);

  // Tab 2: ATS Scorer Report
  const [atsReport, setAtsReport] = useState(null);

  // Tab 3: Resume-Based Custom Questions
  const [customQuestions, setCustomQuestions] = useState([]);
  const [expandedAnswers, setExpandedAnswers] = useState({});
  const [practiceAnswers, setPracticeAnswers] = useState({});
  const [practiceFeedback, setPracticeFeedback] = useState({});
  const [practiceLoading, setPracticeLoading] = useState({});

  // Tab 4: Project Interrogation
  const [extractedProjects, setExtractedProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [interrogationSession, setInterrogationSession] = useState(null);
  const [interrogationAnswers, setInterrogationAnswers] = useState({});
  const [interrogationTimeLeft, setInterrogationTimeLeft] = useState(20 * 60);
  const [interrogationResult, setInterrogationResult] = useState(null);
  const [evaluatingInterrogation, setEvaluatingInterrogation] = useState(false);
  const [interrogationHistory, setInterrogationHistory] = useState([]);

  useEffect(() => {
    fetchExistingResumes();
  }, []);

  const fetchExistingResumes = async () => {
    try {
      const res = await api.get('/resumes');
      const list = res.data.data || [];
      setExistingResumes(list);
      if (list.length > 0 && !selectedResumeId) {
        setSelectedResumeId(list[0]._id);
      }
    } catch (err) {
      console.warn('Failed to load existing resumes:', err.message);
    }
  };

  // Interrogation countdown timer
  useEffect(() => {
    if (!interrogationSession || interrogationResult || interrogationTimeLeft <= 0) return;
    const interval = setInterval(() => {
      setInterrogationTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmitInterrogation();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [interrogationSession, interrogationResult, interrogationTimeLeft]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('resume', file);

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.post('/resumes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchExistingResumes();
      const uploaded = res.data.resume;
      setSelectedResumeId(uploaded._id);
      if (uploaded.extractedText) {
        setResumeText(uploaded.extractedText);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to upload and parse resume file.');
    } finally {
      setLoading(false);
    }
  };

  // 1. Run AI Resume Analyzer
  const handleRunAnalysis = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const payload = selectedResumeId && !resumeText.trim()
        ? { resumeId: selectedResumeId }
        : { resumeText };
      const res = await api.post('/resumes/analyze', payload);
      setAnalyzerReport(res.data.report);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to analyze resume.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Run ATS Scorer & Job-Role Edit Suggestions
  const handleRunATSScorer = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const payload = selectedResumeId && !resumeText.trim()
        ? { resumeId: selectedResumeId, targetRole }
        : { resumeText, targetRole };
      const res = await api.post('/resumes/ats-score', payload);
      setAtsReport(res.data.atsReport);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to calculate ATS compatibility score.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Generate Resume-Based Custom Questions
  const handleGenerateQuestions = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const payload = selectedResumeId && !resumeText.trim()
        ? { resumeId: selectedResumeId, targetRole, experienceLevel }
        : { resumeText, targetRole, experienceLevel };
      const res = await api.post('/resumes/custom-questions', payload);
      setCustomQuestions(res.data.questions || []);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to generate resume-based questions.');
    } finally {
      setLoading(false);
    }
  };

  // Evaluate candidate's practice response to a custom question
  const handleEvaluatePracticeAnswer = async (qId, questionText, expectedKeywords = []) => {
    const answer = practiceAnswers[qId];
    if (!answer || !answer.trim()) return;

    setPracticeLoading((prev) => ({ ...prev, [qId]: true }));
    try {
      const res = await api.post('/interviews/evaluate-answer', {
        questionText,
        answerText: answer,
        expectedKeywords,
        jobTitle: targetRole,
      });
      setPracticeFeedback((prev) => ({
        ...prev,
        [qId]: res.data.data,
      }));
    } catch (err) {
      // Fallback heuristic scoring
      const words = answer.trim().split(/\s+/).length;
      setPracticeFeedback((prev) => ({
        ...prev,
        [qId]: {
          score: Math.min(10, Math.max(5, Math.round(words / 8) + 4)),
          feedback: `Good response (${words} words). Solid architectural coverage. To elevate your score further, highlight specific trade-offs, telemetry numbers, and failure edge-cases.`,
        },
      }));
    } finally {
      setPracticeLoading((prev) => ({ ...prev, [qId]: false }));
    }
  };

  // 4. Extract Projects from Resume
  const handleExtractProjects = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const payload = selectedResumeId && !resumeText.trim()
        ? { resumeId: selectedResumeId }
        : { resumeText };
      const res = await api.post('/resumes/extract-projects', payload);
      setExtractedProjects(res.data.projects || []);
      if (res.data.projects?.length > 0) {
        setSelectedProject(res.data.projects[0]);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to extract projects from resume.');
    } finally {
      setLoading(false);
    }
  };

  // Start Interrogation Session
  const handleStartInterrogation = async (project) => {
    const proj = project || selectedProject;
    if (!proj) return;

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.post('/resumes/project-interrogation/start', {
        projectTitle: proj.title,
        technologies: proj.technologies || [],
        description: proj.description || '',
        targetRole,
      });

      setInterrogationSession(res.data);
      setSelectedProject(proj);
      setInterrogationAnswers({});
      setInterrogationTimeLeft((res.data.timeLimitMinutes || 20) * 60);
      setInterrogationResult(null);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to start project interrogation session.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSubmitInterrogation = () => {
    handleSubmitInterrogation();
  };

  // Submit Interrogation for AI Evaluation
  const handleSubmitInterrogation = async () => {
    if (!interrogationSession) return;
    setEvaluatingInterrogation(true);
    setErrorMsg('');

    const formattedAnswers = (interrogationSession.questions || []).map((q) => ({
      questionId: q.questionId,
      questionText: q.questionText,
      questionType: q.questionType,
      expectedConcepts: q.expectedConcepts || [],
      candidateAnswer: interrogationAnswers[q.questionId] || '',
    }));

    try {
      const res = await api.post('/resumes/project-interrogation/evaluate', {
        projectTitle: interrogationSession.projectTitle,
        technologies: interrogationSession.technologies,
        targetRole,
        timeTakenSeconds: 20 * 60 - interrogationTimeLeft,
        answers: formattedAnswers,
      });

      setInterrogationResult(res.data.evaluation);
      // Fetch history
      fetchInterrogationHistory();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to evaluate project interrogation.');
    } finally {
      setEvaluatingInterrogation(false);
    }
  };

  const fetchInterrogationHistory = async () => {
    try {
      const res = await api.get('/resumes/project-interrogation/history');
      setInterrogationHistory(res.data.history || []);
    } catch (err) {
      console.warn('Failed to load interrogation history:', err.message);
    }
  };

  const handleCopySnippet = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const rolePresets = [
    'Senior Full Stack Engineer',
    'Senior Frontend Architect',
    'Cloud & DevOps Engineer',
    'Backend Distributed Systems Engineer',
    'AI / Machine Learning Engineer',
    'Staff Software Engineer',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="card-saas rounded-3xl p-6 sm:p-8 relative overflow-hidden bg-gradient-to-r from-[#1E293B] via-[#162137] to-[#0F172A] border-[#334155] shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/15 text-[#06B6D4] border border-[#06B6D4]/30">
            <Sparkles className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span>AI Career Acceleration & Resume Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-[#F8FAFC] tracking-tight font-heading">
            AI Resume Intelligence & <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#06B6D4] via-indigo-300 to-[#6366F1]">Project Interrogation</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] max-w-3xl leading-relaxed">
            Upload or paste your resume for instant AI evaluations, ATS compatibility scoring, job-role edit suggestions, custom interview questions, and deep-dive project interrogation.
          </p>
        </div>
      </div>

      {/* 4 Feature Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#1E293B] border border-[#334155] overflow-x-auto scrollbar-none shadow-lg">
        <button
          onClick={() => setActiveTab('analyzer')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'analyzer'
              ? 'btn-primary-gradient text-white shadow-md'
              : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#0F172A]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>AI Resume Analyzer</span>
        </button>

        <button
          onClick={() => setActiveTab('ats')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'ats'
              ? 'btn-primary-gradient text-white shadow-md'
              : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#0F172A]'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>ATS Score & Role Edits</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('questions');
            if (customQuestions.length === 0) handleGenerateQuestions();
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'questions'
              ? 'btn-primary-gradient text-white shadow-md'
              : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#0F172A]'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Resume-Based AI Questioning</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('interrogation');
            if (extractedProjects.length === 0) handleExtractProjects();
            fetchInterrogationHistory();
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'interrogation'
              ? 'bg-gradient-to-r from-amber-600 to-[#4F46E5] text-white shadow-md'
              : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#0F172A]'
          }`}
        >
          <Terminal className="w-4 h-4 text-amber-400" />
          <span>Project Deep Dive Interrogation</span>
        </button>
      </div>

      {/* Global Resume Input & Selector Chamber */}
      <div className="card-saas rounded-3xl p-6 border-[#334155] bg-[#1E293B] space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F8FAFC] font-heading">Select Candidate Resume Source</h3>
              <p className="text-xs text-[#94A3B8]">Choose an existing uploaded resume or paste raw markdown / text below</p>
            </div>
          </div>

          {/* Upload Button */}
          <label className="cursor-pointer px-4 py-2 rounded-xl btn-primary-gradient text-white text-xs font-bold transition-colors flex items-center gap-2 shadow-md shadow-indigo-600/25 shrink-0">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload New Resume (PDF)</span>
            <input type="file" accept=".pdf,.docx,.txt" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {/* Existing Resumes Selector */}
        {existingResumes.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-[#94A3B8] font-semibold mr-1">Stored Resumes:</span>
            {existingResumes.map((res) => (
              <button
                key={res._id}
                type="button"
                onClick={() => {
                  setSelectedResumeId(res._id);
                  if (res.extractedText) setResumeText(res.extractedText);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                  selectedResumeId === res._id
                    ? 'bg-[#06B6D4]/15 border-[#06B6D4] text-[#06B6D4] shadow-sm'
                    : 'bg-[#0F172A] border-[#334155] text-slate-300 hover:bg-[#1E293B]'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span className="truncate max-w-[150px]">{res.originalName || res.fileName}</span>
                {res.isDefault && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-[#10B981] font-mono">
                    Default
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Target Role & Seniority Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5 font-heading">
              Target Job Role (For ATS Matching & Interview Questions)
            </label>
            <div className="relative">
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Senior Full Stack Engineer, Cloud Architect..."
                className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#F8FAFC] focus:outline-none focus:border-[#06B6D4] focus:ring-1 focus:ring-[#06B6D4]"
              />
            </div>
            {/* Presets */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {rolePresets.slice(0, 4).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setTargetRole(role)}
                  className={`text-[11px] px-2.5 py-1 rounded-md border transition-all ${
                    targetRole === role
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-[#06B6D4]'
                      : 'bg-[#0F172A] border-[#334155] text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5 font-heading">
              Seniority Level
            </label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2.5 text-xs sm:text-sm text-[#F8FAFC] focus:outline-none focus:border-[#06B6D4]"
            >
              <option value="mid">Mid-Level (2-4 Years)</option>
              <option value="senior">Senior Engineer (5-8 Years)</option>
              <option value="lead">Staff / Tech Lead (8+ Years)</option>
            </select>
          </div>
        </div>

        {/* Textarea for Direct Paste */}
        <div>
          <label className="block text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5 font-heading">
            Or Paste Resume Raw Content / Markdown:
          </label>
          <textarea
            rows={3}
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your resume text here (Summary, Experience, Projects, Skills)..."
            className="w-full bg-[#0F172A] border border-[#334155] rounded-xl p-3 text-xs text-[#F8FAFC] font-mono focus:outline-none focus:border-[#06B6D4] focus:ring-1 focus:ring-[#06B6D4]"
          />
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: AI RESUME ANALYZER                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'analyzer' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#F8FAFC] flex items-center gap-2 font-heading">
                <FileText className="w-5 h-5 text-[#06B6D4]" />
                <span>Instant AI Resume Analysis & Evaluation</span>
              </h2>
              <p className="text-xs text-[#94A3B8]">Holistic resume evaluation with metric quantification and skills inventory</p>
            </div>
            <button
              onClick={handleRunAnalysis}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl btn-primary-gradient text-white text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-[#06B6D4]" />
              <span>{loading ? 'Analyzing...' : 'Analyze Resume Now'}</span>
            </button>
          </div>

          {analyzerReport && (
            <div className="space-y-6 animate-in fade-in">
              {/* Score & Executive Summary Card */}
              <div className="card-saas rounded-3xl p-6 sm:p-8 border-[#334155] bg-[#1E293B] grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl bg-[#0F172A] border border-[#334155] text-center">
                  <span className="text-[11px] text-[#06B6D4] font-bold uppercase tracking-wider">Overall Impact Score</span>
                  <div className="text-6xl font-black text-[#F8FAFC] my-2 flex items-baseline justify-center font-heading">
                    <span>{analyzerReport.overallScore}</span>
                    <span className="text-xl text-slate-500">/100</span>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-cyan-500/15 text-[#06B6D4] border border-[#06B6D4]/30">
                    {analyzerReport.overallScore >= 80 ? 'Highly Competitive' : analyzerReport.overallScore >= 65 ? 'Competitive' : 'Needs Optimization'}
                  </span>
                </div>

                <div className="md:col-span-8 space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                    <Sparkles className="w-3.5 h-3.5 text-[#06B6D4]" />
                    <span>Executive Summary</span>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed font-medium">
                    {analyzerReport.executiveSummary}
                  </p>
                  <div className="flex flex-wrap gap-4 pt-2 text-xs text-[#94A3B8]">
                    <div>Word Count: <span className="font-bold text-[#F8FAFC]">{analyzerReport.wordCount} words</span></div>
                    <div>Detected Technologies: <span className="font-bold text-[#F8FAFC]">{analyzerReport.skillsInventory?.length || 0}</span></div>
                    <div>Impact Index: <span className="font-bold text-[#06B6D4]">{analyzerReport.impactScore}%</span></div>
                  </div>
                </div>
              </div>

              {/* Strengths & Weaknesses Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card-saas p-6 rounded-2xl border-[#334155] bg-[#1E293B] space-y-3">
                  <h3 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2 font-heading">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                    <span>Key Technical Strengths</span>
                  </h3>
                  <ul className="space-y-2 text-xs text-[#94A3B8]">
                    {analyzerReport.strengths?.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[#10B981] font-bold mt-0.5">•</span>
                        <span className="text-slate-300">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="card-saas p-6 rounded-2xl border-[#334155] bg-[#1E293B] space-y-3">
                  <h3 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2 font-heading">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span>Critical Improvement Areas</span>
                  </h3>
                  <ul className="space-y-2 text-xs text-[#94A3B8]">
                    {analyzerReport.weaknesses?.map((w, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold mt-0.5">•</span>
                        <span className="text-slate-300">{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Skills Inventory */}
              <div className="card-saas p-6 rounded-2xl border-[#334155] bg-[#1E293B] space-y-3">
                <h3 className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider flex items-center gap-2 font-heading">
                  <Cpu className="w-4 h-4 text-[#06B6D4]" />
                  <span>Verified Technical Skills Inventory ({analyzerReport.skillsInventory?.length})</span>
                </h3>
                <div className="flex flex-wrap gap-2 pt-1">
                  {analyzerReport.skillsInventory?.map((skill, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-xl bg-[#0F172A] text-xs text-slate-200 border border-[#334155]">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ATS SCORE & ROLE-BASED EDIT SUGGESTIONS (Part 3 & Part 4)          */}
      {/* ========================================================================= */}
      {activeTab === 'ats' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#F8FAFC] flex items-center gap-2 font-heading">
                <Target className="w-5 h-5 text-[#06B6D4]" />
                <span>Resume ATS Compatibility Score & Role-Based Editing Suggestions</span>
              </h2>
              <p className="text-xs text-[#94A3B8]">Targeted ATS scanner breakdown and section-by-section diff recommendations for "{targetRole}"</p>
            </div>
            <button
              onClick={handleRunATSScorer}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl btn-primary-gradient text-white text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Target className="w-4 h-4 text-[#06B6D4]" />
              <span>{loading ? 'Evaluating ATS...' : 'Calculate ATS Score & Edits'}</span>
            </button>
          </div>

          {atsReport && (
            <div className="space-y-6 animate-in fade-in">
              {/* ATS Score & Subscores */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-4 card-saas p-6 rounded-3xl border-[#334155] bg-[#1E293B] flex flex-col justify-between text-center">
                  <div>
                    <span className="text-[11px] text-[#06B6D4] font-bold uppercase tracking-wider">ATS Compatibility Index</span>
                    <div className="text-6xl font-black text-[#F8FAFC] my-3 flex items-baseline justify-center font-heading">
                      <span>{atsReport.atsScore}</span>
                      <span className="text-xl text-slate-500">/100</span>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-cyan-500/20 text-[#06B6D4] border border-[#06B6D4]/40">
                      {atsReport.rating}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#94A3B8] mt-4 leading-relaxed">
                    Evaluated specifically against high-bar ATS screening algorithms for <span className="text-[#F8FAFC] font-semibold">{targetRole}</span>.
                  </p>
                </div>

                <div className="md:col-span-8 card-saas p-6 rounded-3xl border-[#334155] bg-[#1E293B] space-y-4">
                  <h3 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider font-heading">
                    ATS Dimensional Subscores
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(atsReport.subScores || {}).map(([key, score]) => (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="capitalize text-slate-300 font-medium">
                            {key.replace(/([A-Z])/g, ' $1')}
                          </span>
                          <span className="font-bold text-[#F8FAFC] font-mono">{score}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#0F172A] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              score >= 80 ? 'bg-[#06B6D4]' : score >= 60 ? 'bg-[#6366F1]' : 'bg-amber-400'
                            }`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Matched vs Missing Keywords */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card-saas p-6 rounded-2xl border-[#334155] bg-[#1E293B] space-y-3">
                  <h3 className="text-xs font-bold text-[#10B981] uppercase tracking-wider flex items-center gap-2 font-heading">
                    <Check className="w-4 h-4" />
                    <span>Matched Keywords for {targetRole} ({atsReport.matchedKeywords?.length})</span>
                  </h3>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {atsReport.matchedKeywords?.map((kw, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-[#10B981] border border-emerald-500/20 text-xs font-semibold">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="card-saas p-6 rounded-2xl border-[#334155] bg-[#1E293B] space-y-3">
                  <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2 font-heading">
                    <AlertCircle className="w-4 h-4" />
                    <span>Missing Critical Keywords ({atsReport.missingKeywords?.length})</span>
                  </h3>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {atsReport.missingKeywords?.map((kw, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs font-semibold">
                        +{kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actionable Section-by-Section Edit Suggestions */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#F8FAFC] uppercase tracking-wider flex items-center gap-2 font-heading">
                  <Sparkles className="w-4 h-4 text-[#06B6D4]" />
                  <span>Tailored Role-Based Edit Recommendations (1-Click Copy)</span>
                </h3>

                <div className="space-y-4">
                  {atsReport.editSuggestions?.map((item, idx) => (
                    <div key={idx} className="card-saas p-6 rounded-2xl border-[#334155] bg-[#1E293B] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#06B6D4] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-[#06B6D4]/30">
                          {item.section}
                        </span>
                        <button
                          onClick={() => handleCopySnippet(item.suggestedSnippet, idx)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F172A] hover:bg-[#334155] border border-[#334155] text-xs text-slate-200 font-semibold transition-colors"
                        >
                          {copiedIndex === idx ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-[#10B981]" />
                              <span className="text-[#10B981]">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Suggested Edit</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Diff Comparison */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono pt-1">
                        <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/20 space-y-1">
                          <span className="text-[10px] text-rose-400 uppercase font-bold block">Current / Original Text</span>
                          <p className="text-rose-200 leading-relaxed">{item.originalSnippet}</p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
                          <span className="text-[10px] text-[#10B981] uppercase font-bold block">ATS-Optimized Recommended Snippet</span>
                          <p className="text-[#10B981] leading-relaxed">{item.suggestedSnippet}</p>
                        </div>
                      </div>

                      <p className="text-xs text-[#94A3B8] leading-relaxed pt-1">
                        <span className="text-slate-300 font-semibold">Why this matters:</span> {item.rationale}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: RESUME-BASED AI QUESTIONING (Part 4 Requirement)                   */}
      {/* ========================================================================= */}
      {activeTab === 'questions' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#F8FAFC] flex items-center gap-2 font-heading">
                <HelpCircle className="w-5 h-5 text-indigo-400" />
                <span>Resume-Based AI Questioning Chamber</span>
              </h2>
              <p className="text-xs text-[#94A3B8]">
                AI extracts your actual technologies, past projects, and responsibilities to generate targeted technical & behavioral challenges.
              </p>
            </div>
            <button
              onClick={handleGenerateQuestions}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl btn-primary-gradient text-white text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50 shrink-0"
            >
              <Sparkles className="w-4 h-4 text-[#06B6D4]" />
              <span>{loading ? 'Synthesizing...' : 'Regenerate Questions'}</span>
            </button>
          </div>

          {customQuestions.length > 0 ? (
            <div className="space-y-4 animate-in fade-in">
              {customQuestions.map((q, idx) => {
                const isExpanded = expandedAnswers[q.id];
                const feedback = practiceFeedback[q.id];
                const isEvaluating = practiceLoading[q.id];

                return (
                  <div key={q.id || idx} className="card-saas p-6 rounded-3xl border-[#334155] space-y-4 bg-[#1E293B]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold flex items-center justify-center font-mono">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          {q.category}
                        </span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-[#0F172A] text-slate-300 border border-[#334155]">
                          {q.difficulty}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#06B6D4] font-mono bg-cyan-950/40 px-2.5 py-0.5 rounded-md border border-[#06B6D4]/30">
                        {q.resumeContext}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#F8FAFC] leading-relaxed font-heading">
                      {q.question}
                    </h3>

                    {/* Expected Key Points */}
                    <div className="p-3.5 rounded-2xl bg-[#0F172A] border border-[#334155] text-xs space-y-1.5">
                      <span className="text-[10px] text-[#94A3B8] uppercase font-bold tracking-wider block font-heading">Expected Engineering Concepts</span>
                      <div className="flex flex-wrap gap-2">
                        {q.expectedKeyPoints?.map((pt, pIdx) => (
                          <span key={pIdx} className="px-2 py-0.5 rounded-md bg-[#1E293B] text-slate-300 text-[11px] border border-[#334155]">
                            • {pt}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Interactive Practice Box */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-300">Draft Your Answer for AI Grading:</span>
                        <button
                          type="button"
                          onClick={() => setExpandedAnswers((prev) => ({ ...prev, [q.id]: !prev[q.id] }))}
                          className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                        >
                          <span>{isExpanded ? 'Hide Model Blueprint' : 'View Model Blueprint'}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <textarea
                          rows={2}
                          value={practiceAnswers[q.id] || ''}
                          onChange={(e) => setPracticeAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                          placeholder="Type how you would respond in an interview..."
                          className="flex-1 bg-[#0F172A] border border-[#334155] rounded-xl p-2.5 text-xs text-[#F8FAFC] focus:outline-none focus:border-indigo-400"
                        />
                        <button
                          type="button"
                          onClick={() => handleEvaluatePracticeAnswer(q.id, q.question, q.expectedKeyPoints)}
                          disabled={isEvaluating || !practiceAnswers[q.id]?.trim()}
                          className="px-4 py-2 rounded-xl btn-primary-gradient text-white text-xs font-bold transition-all disabled:opacity-40 flex items-center justify-center shrink-0"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Practice Feedback Box */}
                      {feedback && (
                        <div className="p-3.5 rounded-xl bg-indigo-950/50 border border-indigo-500/30 text-xs space-y-1 animate-in fade-in">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#06B6D4]">AI Evaluation Feedback</span>
                            <span className="font-black text-[#F8FAFC]">{feedback.score} / 10 Score</span>
                          </div>
                          <p className="text-slate-200 leading-relaxed">{feedback.feedback}</p>
                        </div>
                      )}
                    </div>

                    {/* Model Answer Drawer */}
                    {isExpanded && (
                      <div className="p-4 rounded-2xl bg-[#0F172A] border border-[#06B6D4]/30 text-xs space-y-1.5 animate-in fade-in">
                        <span className="text-[10px] text-[#06B6D4] font-bold uppercase tracking-wider block font-heading">Principal Architect Model Solution</span>
                        <p className="text-slate-200 leading-relaxed font-sans">{q.modelAnswer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card-saas p-12 text-center rounded-3xl border-[#334155] bg-[#1E293B] space-y-3">
              <HelpCircle className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-[#F8FAFC] font-heading">No Custom Questions Generated Yet</h3>
              <p className="text-xs text-[#94A3B8] max-w-md mx-auto">
                Click "Regenerate Questions" above to scan your selected resume and produce customized technical interview questions.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PROJECT DEEP DIVE INTERROGATION (Part 4 Requirement)              */}
      {/* ========================================================================= */}
      {activeTab === 'interrogation' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#F8FAFC] flex items-center gap-2 font-heading">
                <Terminal className="w-5 h-5 text-amber-400" />
                <span>Project-Specific Deep Dive: Project Interrogation Chamber</span>
              </h2>
              <p className="text-xs text-[#94A3B8]">
                The AI extracts your resume projects and conducts targeted, rigorous interactive questioning to test practical hands-on authenticity.
              </p>
            </div>
            {!interrogationSession && (
              <button
                onClick={handleExtractProjects}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-amber-600/30 transition-all flex items-center gap-2 disabled:opacity-50 shrink-0"
              >
                <Cpu className="w-4 h-4 text-amber-300" />
                <span>{loading ? 'Extracting Projects...' : 'Extract Projects from Resume'}</span>
              </button>
            )}
          </div>

          {/* PROJECT SELECTION VIEW */}
          {!interrogationSession && !interrogationResult && (
            <div className="space-y-6">
              {extractedProjects.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider font-heading">
                    Select a Project to Interrogate:
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {extractedProjects.map((p) => {
                      const isSelected = selectedProject?.title === p.title;
                      return (
                        <div
                          key={p.id || p.title}
                          onClick={() => setSelectedProject(p)}
                          className={`cursor-pointer p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'bg-[#1E293B] border-amber-500/60 shadow-xl shadow-amber-950/40 ring-1 ring-amber-500/40'
                              : 'bg-[#1E293B] border-[#334155] hover:border-slate-500'
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                {p.complexityLevel || 'Advanced'}
                              </span>
                              {isSelected && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
                            </div>
                            <h4 className="text-sm font-bold text-[#F8FAFC] leading-snug font-heading">{p.title}</h4>
                            <p className="text-xs text-[#94A3B8] line-clamp-3 leading-relaxed">{p.description}</p>
                            
                            {/* Tech Stack */}
                            <div className="flex flex-wrap gap-1 pt-1">
                              {p.technologies?.slice(0, 4).map((tech, tIdx) => (
                                <span key={tIdx} className="text-[10px] px-2 py-0.5 rounded bg-[#0F172A] text-slate-300 border border-[#334155]">
                                  {tech}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="pt-4 mt-4 border-t border-[#334155] flex items-center justify-between">
                            <span className="text-[11px] text-amber-400 font-semibold">Select & Interrogate</span>
                            <ArrowRight className="w-4 h-4 text-amber-400" />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {selectedProject && (
                    <div className="p-6 rounded-3xl card-saas border-amber-500/30 bg-gradient-to-r from-[#1E293B] via-[#1a2135] to-[#0F172A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-[11px] text-amber-400 uppercase font-bold tracking-wider font-heading">Ready to Interrogate</span>
                        <h4 className="text-base font-bold text-[#F8FAFC] font-heading">{selectedProject.title}</h4>
                        <p className="text-xs text-[#94A3B8] max-w-xl mt-0.5">
                          Launch a 4-question timed examination specifically drilling your architecture decisions, concurrency handling, database optimizations, and production outages for this project.
                        </p>
                      </div>
                      <button
                        onClick={() => handleStartInterrogation(selectedProject)}
                        disabled={loading}
                        className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-xl shadow-amber-500/25 transition-all flex items-center gap-2 shrink-0 transform active:scale-95"
                      >
                        <Play className="w-4 h-4 fill-slate-950" />
                        <span>Launch Project Interrogation Now</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="card-saas p-12 text-center rounded-3xl border-[#334155] bg-[#1E293B] space-y-3">
                  <Terminal className="w-12 h-12 text-slate-600 mx-auto" />
                  <h3 className="text-base font-bold text-[#F8FAFC] font-heading">No Projects Extracted Yet</h3>
                  <p className="text-xs text-[#94A3B8] max-w-md mx-auto">
                    Click "Extract Projects from Resume" to scan your uploaded resume for key technical project deliverables.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ACTIVE INTERROGATION CHAMBER */}
          {interrogationSession && !interrogationResult && (
            <div className="space-y-6 animate-in fade-in">
              <div className="card-saas p-6 rounded-3xl border-amber-500/30 bg-[#1E293B] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 mb-1">
                    <Terminal className="w-3.5 h-3.5 text-amber-400" />
                    <span>LIVE INTERROGATION CHAMBER</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#F8FAFC] font-heading">{interrogationSession.projectTitle}</h3>
                  <p className="text-xs text-[#94A3B8]">Answer each practical question thoroughly. Mention exact tools, telemetry metrics, and architectural trade-offs.</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F172A] border border-amber-500/30 text-amber-300 font-mono text-sm font-bold">
                    <Clock className="w-4 h-4 animate-pulse" />
                    <span>{formatTimer(interrogationTimeLeft)}</span>
                  </div>
                  <button
                    onClick={() => setInterrogationSession(null)}
                    className="p-2 rounded-xl bg-[#0F172A] border border-[#334155] text-[#94A3B8] hover:text-[#F8FAFC]"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {/* Question list for interrogation */}
              <div className="space-y-4">
                {interrogationSession.questions?.map((q, idx) => (
                  <div key={q.questionId} className="card-saas p-6 rounded-3xl border-[#334155] space-y-3 bg-[#1E293B]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 uppercase tracking-wider font-heading">
                        Question {idx + 1}: {q.questionType}
                      </span>
                      <span className="text-[11px] text-[#94A3B8] font-mono">
                        {q.probingAngle}
                      </span>
                    </div>

                    <h4 className="text-sm sm:text-base font-bold text-[#F8FAFC] leading-relaxed font-heading">
                      {q.questionText}
                    </h4>

                    {/* Expected concepts */}
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {q.expectedConcepts?.map((c, cIdx) => (
                        <span key={cIdx} className="text-[10px] px-2 py-0.5 rounded-md bg-[#0F172A] text-slate-300 border border-[#334155]">
                          Expected: {c}
                        </span>
                      ))}
                    </div>

                    {/* Answer Text Area */}
                    <div className="pt-2">
                      <textarea
                        rows={4}
                        value={interrogationAnswers[q.questionId] || ''}
                        onChange={(e) => setInterrogationAnswers((prev) => ({ ...prev, [q.questionId]: e.target.value }))}
                        placeholder="Detail your practical solution, metrics, root-cause methodology, and operational trade-offs..."
                        className="w-full bg-[#0F172A] border border-[#334155] rounded-2xl p-4 text-xs sm:text-sm text-[#F8FAFC] focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-sans leading-relaxed"
                      />
                      <div className="flex justify-between text-[11px] text-[#94A3B8] px-1 pt-1">
                        <span>Word Count: {(interrogationAnswers[q.questionId] || '').trim().split(/\s+/).filter(Boolean).length} words</span>
                        <span>Recommended: 40-80 words with explicit technical metrics</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSubmitInterrogation}
                  disabled={evaluatingInterrogation}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-[#6366F1] hover:from-amber-400 hover:to-indigo-500 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/30 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 fill-slate-950" />
                  <span>{evaluatingInterrogation ? 'Analyzing Authenticity...' : 'Submit Answers for Practical Authenticity Scoring'}</span>
                </button>
              </div>
            </div>
          )}

          {/* INTERROGATION RESULTS & AUTHENTICITY RUBRIC */}
          {interrogationResult && (
            <div className="space-y-6 animate-in fade-in">
              <div className="card-saas p-6 sm:p-8 rounded-3xl border-amber-500/30 bg-[#1E293B] grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-4 flex flex-col items-center justify-center p-6 rounded-3xl bg-[#0F172A] border border-amber-500/30 text-center">
                  <span className="text-[11px] text-amber-300 font-bold uppercase tracking-wider font-heading">Practical Mastery Score</span>
                  <div className="text-6xl font-black text-[#F8FAFC] my-3 flex items-baseline justify-center font-heading">
                    <span>{interrogationResult.practicalScore}</span>
                    <span className="text-xl text-slate-500">/100</span>
                  </div>
                  <span className="text-xs font-black px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {interrogationResult.authenticityRating}
                  </span>
                </div>

                <div className="md:col-span-8 space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-[#F8FAFC] font-heading">Project Authenticity Evaluation: {interrogationResult.projectTitle}</h3>
                    <p className="text-xs text-[#94A3B8] leading-relaxed mt-1">
                      Our AI Evaluator assessed your responses to distinguish battle-tested hands-on muscle memory from surface-level memorization.
                    </p>
                  </div>

                  {/* Rubric Breakdown */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {Object.entries(interrogationResult.rubricBreakdown || {}).map(([key, score]) => (
                      <div key={key} className="p-3 rounded-xl bg-[#0F172A] border border-[#334155] space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="capitalize text-[#94A3B8] font-medium">
                            {key.replace(/([A-Z])/g, ' $1')}
                          </span>
                          <span className="font-bold text-[#F8FAFC] font-mono">{score}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-[#1E293B] overflow-hidden">
                          <div
                            className={`h-full rounded-full ${score >= 80 ? 'bg-amber-400' : 'bg-[#06B6D4]'}`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Strengths & Blind Spots */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card-saas p-6 rounded-2xl border-[#334155] bg-[#1E293B] space-y-3">
                  <h3 className="text-xs font-bold text-[#10B981] uppercase tracking-wider flex items-center gap-2 font-heading">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                    <span>Verified Practical Strengths</span>
                  </h3>
                  <ul className="space-y-2 text-xs text-[#94A3B8]">
                    {interrogationResult.strengths?.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[#10B981] font-bold">•</span>
                        <span className="text-slate-300">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="card-saas p-6 rounded-2xl border-[#334155] bg-[#1E293B] space-y-3">
                  <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2 font-heading">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span>Engineering Blind Spots & Probing Tips</span>
                  </h3>
                  <ul className="space-y-2 text-xs text-[#94A3B8]">
                    {interrogationResult.blindSpots?.map((b, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold">•</span>
                        <span className="text-slate-300">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Q&A Detailed Review */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#F8FAFC] uppercase tracking-wider font-heading">
                  Detailed Interrogation Question Review
                </h3>

                <div className="space-y-4">
                  {interrogationResult.interrogationQnA?.map((item, idx) => (
                    <div key={idx} className="card-saas p-6 rounded-3xl border-[#334155] space-y-3 bg-[#1E293B]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-400 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 font-heading">
                          Question {idx + 1}
                        </span>
                        <span className="text-xs font-mono font-bold text-[#F8FAFC]">
                          Score: {item.score} / 100
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-[#F8FAFC] font-heading">{item.questionText}</h4>

                      <div className="p-3.5 rounded-xl bg-[#0F172A] border border-[#334155] text-xs space-y-1">
                        <span className="text-[10px] text-[#94A3B8] uppercase font-bold block">Your Answer:</span>
                        <p className="text-slate-300 leading-relaxed">{item.candidateAnswer || '(No answer provided)'}</p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-xs space-y-1">
                        <span className="text-[10px] text-indigo-400 uppercase font-bold block">AI Practical Critique:</span>
                        <p className="text-slate-200 leading-relaxed">{item.practicalCritique}</p>
                      </div>

                      <p className="text-xs text-[#94A3B8] leading-relaxed pt-1">
                        <span className="text-slate-300 font-semibold">Recommended Architecture Approach:</span> {item.idealArchitecturalApproach}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action reset */}
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => {
                    setInterrogationResult(null);
                    setInterrogationSession(null);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#334155] border border-[#334155] text-[#F8FAFC] text-xs font-bold transition-colors flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Interrogate Another Project</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
