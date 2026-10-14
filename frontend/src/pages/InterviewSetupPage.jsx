import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Sparkles, 
  FileText, 
  Briefcase, 
  Sliders, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Cpu, 
  Zap 
} from 'lucide-react';
import api from '../services/api';
import { useInterviewStore } from '../store/useInterviewStore';
import { useAuthStore } from '../store/useAuthStore';

export default function InterviewSetupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { createInterview, generateQuestions, startSession } = useInterviewStore();

  const [role, setRole] = useState(location.state?.role || 'Full Stack Engineer');
  const [level, setLevel] = useState('Senior');
  const [jobDescription, setJobDescription] = useState(location.state?.jobDescription || '');
  const [questionCount, setQuestionCount] = useState(5);
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const res = await api.get('/resumes');
        const list = res.data.data || [];
        setResumes(list);
        const def = list.find((r) => r.isDefault) || list[0];
        if (def) setSelectedResumeId(def._id);
      } catch (err) {
        console.warn('Failed to fetch resumes:', err.message);
      } finally {
        setLoadingResumes(false);
      }
    };
    fetchResumes();
  }, []);

  const handleStart = async (e) => {
    e.preventDefault();
    if (!role) {
      setError('Please specify a target role.');
      return;
    }

    if (user && user.credits <= 0) {
      setError('You have 0 mock interview credits remaining. Please upgrade your plan.');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      // Step 1: Create Interview
      setGenerationStep('Creating mock interview instance...');
      const createRes = await createInterview({
        role,
        level,
        jobDescription,
        questionCount: Number(questionCount),
        resumeId: selectedResumeId || undefined,
      });

      if (!createRes.success) throw new Error(createRes.error);
      const interviewId = createRes.interview._id;

      // Step 2: Generate Questions via RAG
      setGenerationStep('Synthesizing questions with Dual-Query RAG & Groq AI...');
      const genRes = await generateQuestions(interviewId);
      if (!genRes.success) throw new Error(genRes.error);

      // Step 3: Start Active Session
      setGenerationStep('Initializing real-time interview chamber...');
      const sessionRes = await startSession(interviewId);
      if (!sessionRes.success) throw new Error(sessionRes.error);

      // Navigate to live session
      navigate('/interviews/live');
    } catch (err) {
      setError(err.message || 'Failed to start interview.');
      setGenerating(false);
    }
  };

  const rolesSuggestions = [
    'Full Stack Engineer',
    'Senior Backend Engineer (Node/Python)',
    'Frontend Architect (React/Next.js)',
    'DevOps / Cloud Platform Engineer',
    'Engineering Manager',
    'AI / Machine Learning Engineer',
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Title */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Interactive Interview Chamber</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Configure Your Mock Test
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-2 max-w-xl mx-auto">
          Tailor every dimension of your simulation. Questions will dynamically blend technical architecture, algorithms, and behavioral competencies.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Configuration Card */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border-indigo-500/20 relative shadow-2xl">
        
        {generating ? (
          <div className="py-16 flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
              <Cpu className="w-8 h-8 text-cyan-400 absolute inset-0 m-auto animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">
                Simulating AI Interviewer
              </h3>
              <p className="text-sm font-mono text-indigo-300 animate-pulse">
                {generationStep}
              </p>
            </div>
            <div className="max-w-md bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 text-left space-y-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Resume vectorized with TF-IDF engine</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Dual technical & cultural query expansion active</span>
              </div>
              <div className="flex items-center gap-2 text-cyan-400 animate-pulse">
                <Zap className="w-3.5 h-3.5" />
                <span>Calibrating difficulty and real-time streaming sockets</span>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleStart} className="space-y-6">
            
            {/* Target Role */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Target Role / Job Title
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Senior Backend Engineer"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
              {/* Quick suggestions */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {rolesSuggestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setRole(item)}
                    className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-[11px] text-slate-300 border border-slate-700/60 transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Seniority & Questions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Seniority Level
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="Junior">Junior (0-2 years)</option>
                  <option value="Mid">Mid-Level (3-5 years)</option>
                  <option value="Senior">Senior (5-8 years)</option>
                  <option value="Lead">Lead / Architect (8+ years)</option>
                  <option value="Staff">Staff / Principal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Number of Questions
                </label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="3">3 Questions (Speed Round ~10 mins)</option>
                  <option value="5">5 Questions (Standard Simulation ~20 mins)</option>
                  <option value="8">8 Questions (Comprehensive Round ~35 mins)</option>
                  <option value="10">10 Questions (Deep Dive Master ~45 mins)</option>
                </select>
              </div>
            </div>

            {/* Linked Resume */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Ground with Resume
              </label>
              {loadingResumes ? (
                <div className="text-xs text-slate-500">Checking uploaded resumes...</div>
              ) : resumes.length === 0 ? (
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                  <span>No resume uploaded. Standard industry questions will be used.</span>
                  <a href="/resumes" className="text-indigo-400 font-semibold hover:underline">
                    Upload Resume
                  </a>
                </div>
              ) : (
                <select
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  {resumes.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.originalName} {r.isDefault ? '(Default Active)' : ''}
                    </option>
                  ))}
                  <option value="">No Resume (Generic Role Questions)</option>
                </select>
              )}
            </div>

            {/* Optional Job Description */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Target Job Description (Optional)
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the target job description or requirements to target company-specific competencies..."
                rows={4}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs leading-relaxed focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all group"
            >
              <span>Launch AI Mock Interview Chamber</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

          </form>
        )}

      </div>

    </div>
  );
}
