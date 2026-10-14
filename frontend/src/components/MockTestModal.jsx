import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  BarChart3, 
  Code, 
  Layers, 
  Send,
  RotateCcw,
  Zap,
  HelpCircle,
  FileCheck
} from 'lucide-react';
import api from '../services/api';

export default function MockTestModal({ isOpen, onClose, initialSubject = 'Senior Frontend Architect', initialType = 'role' }) {
  const [subject, setSubject] = useState(initialSubject);
  const [testType, setTestType] = useState(initialType);
  const [difficulty, setDifficulty] = useState('senior');
  
  // Test states
  const [loading, setLoading] = useState(false);
  const [activeTest, setActiveTest] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setSubject(initialSubject);
    setTestType(initialType);
  }, [initialSubject, initialType]);

  // Timer countdown
  useEffect(() => {
    if (!activeTest || evaluationResult || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTest, evaluationResult, timeLeft]);

  const handleStartTest = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.post('/mock-tests/generate', {
        testType,
        subject,
        difficulty,
        questionCount: 3,
      });
      const test = res.data.test;
      setActiveTest(test);
      setCurrentQIndex(0);
      setAnswers({});
      setTimeLeft(test.timeLimitMinutes * 60);
      setEvaluationResult(null);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to generate mock test questions.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (qId, text) => {
    setAnswers((prev) => ({ ...prev, [qId]: text }));
  };

  const handleAutoSubmit = () => {
    handleSubmitAnswers();
  };

  const handleSubmitAnswers = async () => {
    if (!activeTest) return;
    setEvaluating(true);
    setErrorMsg('');

    const formattedAnswers = activeTest.questions.map((q) => ({
      questionId: q.id,
      questionText: q.question,
      expectedConcepts: q.expectedConcepts,
      candidateAnswer: answers[q.id] || '',
    }));

    try {
      const res = await api.post('/mock-tests/evaluate', {
        testType: activeTest.testType,
        subject: activeTest.subject,
        difficulty: activeTest.difficulty,
        timeTakenSeconds: activeTest.timeLimitMinutes * 60 - timeLeft,
        answers: formattedAnswers,
      });

      setEvaluationResult(res.data.evaluation);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to evaluate test answers.');
    } finally {
      setEvaluating(false);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="glass-panel w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-indigo-500/30 shadow-2xl overflow-hidden bg-[#0a0d1a]/95">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 p-[1px]">
              <div className="w-full h-full bg-[#0d1224] rounded-[11px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>AI Mock Test Examination Chamber</span>
                {activeTest && (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                    {activeTest.difficulty.toUpperCase()}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">Adaptive AI Evaluation & Architectural Assessment</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {activeTest && !evaluationResult && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 font-mono text-xs">
                <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>{formatTimer(timeLeft)}</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Configure & Launch Test */}
          {!activeTest && !evaluationResult && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2">
                  1. Select Target Domain
                </h3>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => { setTestType('role'); setSubject('Senior Frontend Architect'); }}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      testType === 'role'
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Role-Specific Mock Test
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTestType('skill'); setSubject('Distributed System Design'); }}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      testType === 'skill'
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Skill-Specific Deep Dive
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {testType === 'role' ? (
                    <>
                      {['Senior Frontend Architect', 'Full-Stack Systems Engineer', 'Cloud & DevOps SRE'].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setSubject(r)}
                          className={`p-3 rounded-xl text-left border transition-all text-xs font-semibold ${
                            subject === r
                              ? 'bg-indigo-950/80 border-indigo-500 text-white ring-1 ring-indigo-500'
                              : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-1 text-indigo-400">
                            <Layers className="w-3.5 h-3.5" />
                            <span>Role Track</span>
                          </div>
                          <span>{r}</span>
                        </button>
                      ))}
                    </>
                  ) : (
                    <>
                      {['Distributed System Design', 'Algorithms & Concurrency', 'Database Optimization & Indexing'].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSubject(s)}
                          className={`p-3 rounded-xl text-left border transition-all text-xs font-semibold ${
                            subject === s
                              ? 'bg-indigo-950/80 border-indigo-500 text-white ring-1 ring-indigo-500'
                              : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-1 text-cyan-400">
                            <Code className="w-3.5 h-3.5" />
                            <span>Skill Track</span>
                          </div>
                          <span>{s}</span>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* Difficulty Level */}
              <div>
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2">
                  2. Select Difficulty Level
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {['junior', 'mid', 'senior', 'lead'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setDifficulty(lvl)}
                      className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                        difficulty === lvl
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Launch CTA */}
              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={handleStartTest}
                  disabled={loading}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Start AI Evaluation Test</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Live Test Examination in Progress */}
          {activeTest && !evaluationResult && (
            <div className="space-y-6">
              {/* Question Navigation Tabs */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  {activeTest.questions.map((q, idx) => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentQIndex(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        currentQIndex === idx
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : answers[q.id]?.trim()
                          ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Q{idx + 1} {answers[q.id]?.trim() ? '✓' : ''}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  Question {currentQIndex + 1} of {activeTest.questions.length}
                </span>
              </div>

              {/* Active Question Details */}
              {activeTest.questions[currentQIndex] && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-700/80">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 block mb-1">
                      Problem Statement
                    </span>
                    <p className="text-sm sm:text-base font-medium text-white leading-relaxed">
                      {activeTest.questions[currentQIndex].question}
                    </p>
                    {activeTest.questions[currentQIndex].expectedConcepts && (
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Key Areas to Address:</span>
                        {activeTest.questions[currentQIndex].expectedConcepts.map((c) => (
                          <span key={c} className="px-2 py-0.5 rounded-md bg-indigo-950/60 text-indigo-300 border border-indigo-500/20 text-[10px]">
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Candidate Answer Workspace */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Your Technical Solution & Architecture Explanation
                      </label>
                      <span className="text-[11px] text-slate-500">
                        {(answers[activeTest.questions[currentQIndex].id] || '').split(/\s+/).filter(Boolean).length} words
                      </span>
                    </div>
                    <textarea
                      rows={7}
                      value={answers[activeTest.questions[currentQIndex].id] || ''}
                      onChange={(e) => handleAnswerChange(activeTest.questions[currentQIndex].id, e.target.value)}
                      placeholder="Type your structured solution here. Outline your approach, edge cases, trade-offs, and metrics..."
                      className="w-full p-4 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  disabled={currentQIndex === 0}
                  onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold disabled:opacity-30"
                >
                  ← Previous Question
                </button>

                <div className="flex items-center gap-2">
                  {currentQIndex < activeTest.questions.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentQIndex((prev) => prev + 1)}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
                    >
                      <span>Next Question</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={evaluating}
                      onClick={handleSubmitAnswers}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2"
                    >
                      {evaluating ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit for AI Evaluation</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Comprehensive AI Evaluation Report */}
          {evaluationResult && (
            <div className="space-y-6 animate-in fade-in">
              {/* Score Header */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-[#0a0e1c] border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 font-mono">
                    Evaluation Completed • {evaluationResult.subject}
                  </span>
                  <h3 className="text-2xl font-black text-white mt-1">
                    AI Readiness Score: <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-300">{evaluationResult.overallScore}/100</span>
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Tier: {evaluationResult.performanceTier}
                    </span>
                    <span className="text-xs text-slate-400">
                      Time Elapsed: {Math.round(evaluationResult.timeTakenSeconds / 60)} mins
                    </span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center justify-center gap-2 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-slate-700 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-white">{evaluationResult.overallScore}%</span>
                    <span className="text-[9px] uppercase font-bold text-slate-400">Proficiency</span>
                  </div>
                </div>
              </div>

              {/* Dimension Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(evaluationResult.breakdown || {}).map(([metric, val]) => (
                  <div key={metric} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block capitalize">
                      {metric.replace(/([A-Z])/g, ' $1')}
                    </span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-lg font-bold text-white">{val}%</span>
                      <div className="w-12 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full"
                          style={{ width: `${val}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Strengths & Improvements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/25">
                  <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Verified Strengths
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {evaluationResult.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-400 mt-0.5">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/25">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    Targeted Improvements
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {evaluationResult.improvements.map((imp, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-amber-400 mt-0.5">•</span>
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Question Feedback Accordion */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Itemized Question Evaluation & Model Solutions
                </h4>
                {evaluationResult.evaluatedQuestions.map((eq, i) => (
                  <div key={eq.questionId} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-300">Q{i + 1}: {eq.questionText}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 font-mono">
                        {eq.score}/100
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-black/40 border border-slate-800 text-xs text-slate-300 font-mono">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">Your Submission:</span>
                      {eq.candidateAnswer || <span className="text-slate-600 italic">No answer provided.</span>}
                    </div>
                    <p className="text-xs text-slate-300">{eq.feedback}</p>
                    <div className="text-[11px] text-cyan-300/90 font-mono bg-cyan-950/20 p-2 rounded border border-cyan-500/20">
                      💡 {eq.modelAnswerSnippet}
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => { setActiveTest(null); setEvaluationResult(null); }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Take Another Test
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30"
                >
                  Done
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
