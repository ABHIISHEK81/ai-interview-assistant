import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Sparkles, 
  RotateCcw, 
  Clock, 
  BarChart3,
  BookOpen
} from 'lucide-react';
import api from '../services/api';
import { useInterviewStore } from '../store/useInterviewStore';

export default function SessionReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { sessionReport } = useInterviewStore();

  const [session, setSession] = useState(sessionReport);
  const [loading, setLoading] = useState(!sessionReport);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await api.get(`/sessions/${id}`);
        setSession(res.data.data);
      } catch (err) {
        setError('Failed to load session report.');
      } finally {
        setLoading(false);
      }
    };

    if (!session || session._id !== id) {
      fetchSession();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
        <p className="text-sm text-slate-400">Loading performance report...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-md mx-auto my-16 text-center glass-panel p-8 rounded-2xl">
        <h3 className="text-lg font-bold text-white mb-2">Report Not Found</h3>
        <p className="text-xs text-slate-400 mb-6">{error || 'Session details are unavailable.'}</p>
        <Link to="/dashboard" className="px-5 py-2.5 rounded-xl bg-indigo-600 text-xs font-bold text-white">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const score = session.overallScore ?? 75;
  const evaluation = session.evaluation || {};
  const questions = session.interviewId?.questions || [];

  const getVerdict = (val) => {
    if (val >= 85) return { label: 'Strong Hire', color: 'emerald' };
    if (val >= 70) return { label: 'Hire', color: 'cyan' };
    if (val >= 50) return { label: 'Lean Hire', color: 'amber' };
    return { label: 'Needs Preparation', color: 'rose' };
  };

  const verdict = getVerdict(score);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Simulation Evaluated by Groq AI</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Performance Scorecard
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Target Role: <strong className="text-white">{session.interviewId?.role || 'Software Engineer'}</strong> ({session.interviewId?.level || 'Senior'})
          </p>
        </div>

        {/* Retake & Actions */}
        <div className="flex items-center gap-3">
          <Link
            to="/interviews/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retake / New Test</span>
          </Link>
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Main Score & Executive Verdict Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Score Badge */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col items-center justify-center text-center border-indigo-500/30 glow-indigo">
          <span className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-2">Overall Score</span>
          <div className="relative my-2">
            <div className="w-32 h-32 rounded-full border-4 border-indigo-500/20 flex flex-col items-center justify-center bg-slate-900/90 shadow-2xl">
              <span className="text-4xl font-black text-white">{score}</span>
              <span className="text-[11px] text-slate-400 font-mono">/ 100</span>
            </div>
          </div>
          <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            verdict.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
            verdict.color === 'cyan' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
            verdict.color === 'amber' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
            'bg-rose-500/20 text-rose-300 border border-rose-500/30'
          }`}>
            {verdict.label}
          </div>
        </div>

        {/* Strengths Card */}
        <div className="glass-panel rounded-2xl p-6 border-emerald-500/20 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Key Strengths
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              {evaluation.strengths && evaluation.strengths.length > 0 ? (
                evaluation.strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{str}</span>
                  </li>
                ))
              ) : (
                <li className="text-slate-400">Clear structured thought process across technical questions.</li>
              )}
            </ul>
          </div>
          <div className="pt-3 text-[11px] text-slate-500 border-t border-slate-800">
            High alignment with industry technical expectations.
          </div>
        </div>

        {/* Areas for Improvement */}
        <div className="glass-panel rounded-2xl p-6 border-amber-500/20 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Actionable Improvements
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              {evaluation.areasForImprovement && evaluation.areasForImprovement.length > 0 ? (
                evaluation.areasForImprovement.map((area, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{area}</span>
                  </li>
                ))
              ) : (
                <li className="text-slate-400">Elaborate more deeply on edge case resilience and cache eviction policies.</li>
              )}
            </ul>
          </div>
          <div className="pt-3 text-[11px] text-slate-500 border-t border-slate-800">
            Practice recommended masterclass videos to refine these areas.
          </div>
        </div>

      </div>

      {/* Summary Narrative */}
      {evaluation.summary && (
        <div className="glass-panel rounded-2xl p-6 border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-cyan-400" /> Executive AI Evaluation Summary
          </h3>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            {evaluation.summary}
          </p>
        </div>
      )}

      {/* Question by Question Detailed Breakdown */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 space-y-6">
        <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-400" />
          Per-Question Deep Dive Analysis
        </h3>

        <div className="space-y-6">
          {(session.answers || []).map((ans, idx) => {
            const questionData = questions[idx] || {};
            return (
              <div key={idx} className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <span className="font-bold text-sm text-indigo-300">
                    Question {idx + 1}: {questionData.text || `Interview Probe #${idx + 1}`}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 uppercase font-mono">
                      {questionData.type || 'Technical'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 font-mono">
                      Score: {ans.score ?? 8} / 10
                    </span>
                  </div>
                </div>

                {/* Candidate Answer */}
                <div>
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Your Response:
                  </h5>
                  <p className="text-xs text-slate-200 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 whitespace-pre-wrap leading-relaxed">
                    {ans.answer || '(No answer recorded)'}
                  </p>
                </div>

                {/* AI Feedback */}
                {ans.feedback && (
                  <div className="pt-2">
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 mb-1 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Evaluator Feedback:
                    </h5>
                    <p className="text-xs text-slate-300 leading-relaxed bg-cyan-950/20 border border-cyan-500/20 p-3 rounded-lg">
                      {ans.feedback}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
