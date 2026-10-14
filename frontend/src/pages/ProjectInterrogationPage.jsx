import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Sparkles, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  Play, 
  Cpu, 
  Layers, 
  Send,
  History,
  FileCheck
} from 'lucide-react';
import api from '../services/api';

export default function ProjectInterrogationPage() {
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [targetRole, setTargetRole] = useState('Senior Full Stack Engineer');
  const [extractedProjects, setExtractedProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  // Interrogation Execution States
  const [loading, setLoading] = useState(false);
  const [interrogationSession, setInterrogationSession] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(20 * 60);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [resumesRes, histRes] = await Promise.all([
        api.get('/resumes').catch(() => ({ data: { data: [] } })),
        api.get('/resumes/project-interrogation/history').catch(() => ({ data: { history: [] } })),
      ]);
      const list = resumesRes.data.data || [];
      setResumes(list);
      setHistory(histRes.data.history || []);

      if (list.length > 0) {
        setSelectedResumeId(list[0]._id);
        extractProjectsForResume(list[0]._id);
      }
    } catch (err) {
      console.warn('Failed to load interrogation setup:', err.message);
    }
  };

  const extractProjectsForResume = async (resumeId) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.post('/resumes/extract-projects', { resumeId });
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

  // Timer countdown
  useEffect(() => {
    if (!interrogationSession || evaluationResult || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitAnswers();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [interrogationSession, evaluationResult, timeLeft]);

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
      setAnswers({});
      setTimeLeft((res.data.timeLimitMinutes || 20) * 60);
      setEvaluationResult(null);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to launch interrogation.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswers = async () => {
    if (!interrogationSession) return;
    setEvaluating(true);
    setErrorMsg('');

    const formattedAnswers = (interrogationSession.questions || []).map((q) => ({
      questionId: q.questionId,
      questionText: q.questionText,
      questionType: q.questionType,
      expectedConcepts: q.expectedConcepts || [],
      candidateAnswer: answers[q.questionId] || '',
    }));

    try {
      const res = await api.post('/resumes/project-interrogation/evaluate', {
        projectTitle: interrogationSession.projectTitle,
        technologies: interrogationSession.technologies,
        targetRole,
        timeTakenSeconds: 20 * 60 - timeLeft,
        answers: formattedAnswers,
      });

      setEvaluationResult(res.data.evaluation);
      const histRes = await api.get('/resumes/project-interrogation/history');
      setHistory(histRes.data.history || []);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to evaluate interrogation.');
    } finally {
      setEvaluating(false);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden bg-gradient-to-r from-slate-900/90 via-[#181102]/90 to-amber-950/40 border border-amber-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            <span>Project-Specific Deep Dive Interrogation</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Interactive Project <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-amber-200">Interrogation Chamber</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
            Battle-test the projects mentioned on your resume. The AI interrogates your architectural trade-offs, concurrency handling, database index designs, and production post-mortems to verify practical hands-on authenticity.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* SETUP VIEW */}
      {!interrogationSession && !evaluationResult && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl border-slate-800 space-y-4 bg-slate-900/40">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              1. Select Resume & Target Role
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-semibold">Select Resume:</label>
                <select
                  value={selectedResumeId}
                  onChange={(e) => {
                    setSelectedResumeId(e.target.value);
                    extractProjectsForResume(e.target.value);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  {resumes.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.originalName || r.fileName} {r.isDefault ? '(Default)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1 font-semibold">Target Job Role:</label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Extracted Projects */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                2. Extracted Projects Ready for Deep Dive:
              </h3>
              <button
                onClick={() => extractProjectsForResume(selectedResumeId)}
                disabled={loading}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
              >
                Re-scan Projects
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {extractedProjects.map((p) => {
                const isSelected = selectedProject?.title === p.title;
                return (
                  <div
                    key={p.title}
                    onClick={() => setSelectedProject(p)}
                    className={`cursor-pointer p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-950/30 border-amber-500/60 shadow-xl shadow-amber-950/40'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          {p.complexityLevel || 'Advanced'}
                        </span>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
                      </div>
                      <h4 className="text-sm font-bold text-white leading-snug">{p.title}</h4>
                      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">{p.description}</p>
                      
                      <div className="flex flex-wrap gap-1 pt-1">
                        {p.technologies?.slice(0, 4).map((tech, idx) => (
                          <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[11px] text-amber-400 font-semibold">Select Project</span>
                      <ArrowRight className="w-4 h-4 text-amber-400" />
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedProject && (
              <div className="p-6 rounded-3xl glass-panel border-amber-500/30 bg-gradient-to-r from-amber-950/30 via-slate-900 to-indigo-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] text-amber-400 uppercase font-bold tracking-wider">Ready for Questioning</span>
                  <h4 className="text-base font-bold text-white">{selectedProject.title}</h4>
                  <p className="text-xs text-slate-400 max-w-xl mt-0.5">
                    Launch a 4-question timed examination specifically testing your architecture trade-offs, concurrency handling, database optimizations, and production outages for this project.
                  </p>
                </div>
                <button
                  onClick={() => handleStartInterrogation(selectedProject)}
                  disabled={loading}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-xl shadow-amber-500/25 transition-all flex items-center gap-2 shrink-0 transform active:scale-95"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Enter Interrogation Chamber</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ACTIVE INTERROGATION CHAMBER */}
      {interrogationSession && !evaluationResult && (
        <div className="space-y-6 animate-in fade-in">
          <div className="glass-panel p-6 rounded-3xl border-amber-500/30 bg-[#0d1020] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 mb-1">
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                <span>ACTIVE INTERROGATION SESSION</span>
              </div>
              <h3 className="text-lg font-bold text-white">{interrogationSession.projectTitle}</h3>
              <p className="text-xs text-slate-400">Answer thoroughly with technical metrics, architectural decisions, and production debugging details.</p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-300 font-mono text-sm font-bold">
                <Clock className="w-4 h-4 animate-pulse" />
                <span>{formatTimer(timeLeft)}</span>
              </div>
              <button
                onClick={() => setInterrogationSession(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                Exit
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {interrogationSession.questions?.map((q, idx) => (
              <div key={q.questionId} className="glass-panel p-6 rounded-3xl border-slate-800 space-y-3 bg-slate-900/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 uppercase tracking-wider">
                    Question {idx + 1}: {q.questionType}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {q.probingAngle}
                  </span>
                </div>

                <h4 className="text-sm sm:text-base font-bold text-white leading-relaxed">
                  {q.questionText}
                </h4>

                <div className="pt-2">
                  <textarea
                    rows={4}
                    value={answers[q.questionId] || ''}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [q.questionId]: e.target.value }))}
                    placeholder="Provide your hands-on answer explaining constraints, failure modes, metrics, and technical alternatives..."
                    className="w-full bg-[#080b18] border border-slate-800 rounded-2xl p-4 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-sans leading-relaxed"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500 px-1 pt-1">
                    <span>Word Count: {(answers[q.questionId] || '').trim().split(/\s+/).filter(Boolean).length} words</span>
                    <span>Expected: {q.expectedConcepts?.join(', ')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSubmitAnswers}
              disabled={evaluating}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/30 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 fill-slate-950" />
              <span>{evaluating ? 'Evaluating Authenticity...' : 'Submit Answers for Practical Authenticity Scoring'}</span>
            </button>
          </div>
        </div>
      )}

      {/* EVALUATION RESULTS */}
      {evaluationResult && (
        <div className="space-y-6 animate-in fade-in">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border-amber-500/30 bg-[#0c1024] grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-4 flex flex-col items-center justify-center p-6 rounded-3xl bg-[#090d1c] border border-amber-500/30 text-center">
              <span className="text-[11px] text-amber-300 font-bold uppercase tracking-wider">Practical Mastery Score</span>
              <div className="text-6xl font-black text-white my-3 flex items-baseline justify-center">
                <span>{evaluationResult.practicalScore}</span>
                <span className="text-xl text-slate-500">/100</span>
              </div>
              <span className="text-xs font-black px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {evaluationResult.authenticityRating}
              </span>
            </div>

            <div className="md:col-span-8 space-y-4">
              <div>
                <h3 className="text-base font-bold text-white">Project Authenticity Evaluation: {evaluationResult.projectTitle}</h3>
                <p className="text-xs text-slate-300 leading-relaxed mt-1">
                  Assessed candidate responses to distinguish true experiential engineering battle scars from textbook memorization.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                {Object.entries(evaluationResult.rubricBreakdown || {}).map(([key, score]) => (
                  <div key={key} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="capitalize text-slate-400 font-medium">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </span>
                      <span className="font-bold text-white font-mono">{score}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${score >= 80 ? 'bg-amber-400' : 'bg-cyan-400'}`}
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
            <div className="glass-panel p-6 rounded-2xl border-emerald-500/20 bg-slate-900/60 space-y-3">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Verified Practical Strengths</span>
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {evaluationResult.strengths?.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-panel p-6 rounded-2xl border-amber-500/20 bg-slate-900/60 space-y-3">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>Engineering Blind Spots</span>
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {evaluationResult.blindSpots?.map((b, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Q&A Review */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Detailed Question-by-Question Review
            </h3>

            <div className="space-y-4">
              {evaluationResult.interrogationQnA?.map((item, idx) => (
                <div key={idx} className="glass-panel p-6 rounded-3xl border-slate-800 space-y-3 bg-slate-900/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                      Question {idx + 1}
                    </span>
                    <span className="text-xs font-mono font-bold text-white">
                      Score: {item.score} / 100
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white">{item.questionText}</h4>

                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Your Practical Answer:</span>
                    <p className="text-slate-300 leading-relaxed">{item.candidateAnswer || '(No answer provided)'}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-xs space-y-1">
                    <span className="text-[10px] text-indigo-400 uppercase font-bold block">AI Practical Assessment:</span>
                    <p className="text-slate-200 leading-relaxed">{item.practicalCritique}</p>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed pt-1">
                    <span className="text-slate-300 font-semibold">Recommended Architecture Approach:</span> {item.idealArchitecturalApproach}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <button
              onClick={() => {
                setEvaluationResult(null);
                setInterrogationSession(null);
              }}
              className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Interrogate Another Project</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
