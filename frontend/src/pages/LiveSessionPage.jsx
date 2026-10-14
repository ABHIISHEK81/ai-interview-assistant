import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowLeft, 
  ArrowRight, 
  Clock, 
  CheckCircle, 
  Send, 
  Cpu, 
  Mic, 
  MicOff, 
  AlertCircle, 
  CheckCircle2, 
  Zap,
  BarChart3,
  Square,
  Code
} from 'lucide-react';
import { useInterviewStore } from '../store/useInterviewStore';
import { getSocket } from '../services/socket';
import HardwareProctorFeed from '../components/HardwareProctorFeed';

export default function LiveSessionPage() {
  const navigate = useNavigate();
  const {
    currentInterview,
    currentSession,
    questions,
    currentQuestionIndex,
    answers,
    setAnswer,
    nextQuestion,
    prevQuestion,
    jumpToQuestion,
    submitAnswer,
    completeSession,
  } = useInterviewStore();

  const [activeAnswer, setActiveAnswer] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [questionTimeSeconds, setQuestionTimeSeconds] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);
  const [codeMode, setCodeMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Socket streaming state
  const [streamedTokens, setStreamedTokens] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const socketRef = useRef(null);
  const timerRef = useRef(null);

  // Sync active answer when question changes
  useEffect(() => {
    const nextAns = answers[currentQuestionIndex] || '';
    setActiveAnswer(nextAns);
    setQuestionTimeSeconds(0);
    setStreamedTokens('');
    setIsStreaming(false);
    const isCodingQ = questions[currentQuestionIndex]?.questionType === 'coding' || questions[currentQuestionIndex]?.type === 'coding';
    setCodeMode(isCodingQ);
  }, [currentQuestionIndex, answers, questions]);

  const handleSpeechTranscript = (transcriptText) => {
    setActiveAnswer((prev) => {
      const updated = prev ? `${prev} ${transcriptText}` : transcriptText;
      setAnswer(currentQuestionIndex, updated);
      return updated;
    });
  };

  const handleInsertStarterCode = () => {
    const starter = currentQ?.starterCode || currentQ?.codeSnippet || '';
    if (starter) {
      setActiveAnswer(starter);
      setAnswer(currentQuestionIndex, starter);
      setCodeMode(true);
    }
  };

  // Guard: if no active session, redirect to setup
  useEffect(() => {
    if (!currentSession || !questions || questions.length === 0) {
      navigate('/interviews/new');
      return;
    }

    // Connect socket
    const socket = getSocket();
    socketRef.current = socket;

    socket.on('ai_chunk', (data) => {
      setStreamedTokens((prev) => prev + (data.chunk || ''));
    });

    socket.on('ai_complete', () => {
      setIsStreaming(false);
    });

    socket.on('ai_error', (data) => {
      console.warn('Socket AI error:', data.error);
      setIsStreaming(false);
    });

    // Start timer
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
      setQuestionTimeSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (socket) {
        socket.off('ai_chunk');
        socket.off('ai_complete');
        socket.off('ai_error');
      }
    };
  }, [currentSession, questions, navigate]);

  const currentQ = questions[currentQuestionIndex] || {};

  const handleAnswerChange = (val) => {
    setActiveAnswer(val);
    setAnswer(currentQuestionIndex, val);
  };

  const handleSendLiveAnswer = async () => {
    if (!activeAnswer.trim()) {
      setErrorMsg('Please enter an answer before requesting real-time feedback.');
      return;
    }
    setErrorMsg('');

    // Save answer to backend
    await submitAnswer(
      currentSession._id,
      currentQuestionIndex,
      activeAnswer,
      questionTimeSeconds
    );

    // Stream real-time evaluation probe via socket
    if (socketRef.current) {
      setStreamedTokens('');
      setIsStreaming(true);
      socketRef.current.emit('live_answer', {
        sessionId: currentSession._id,
        questionIndex: currentQuestionIndex,
        answer: activeAnswer,
        role: currentInterview?.role || 'Software Engineer',
      });
    }
  };

  const handleFinishInterview = async () => {
    if (!window.confirm('Are you ready to submit your interview and receive your detailed performance report?')) {
      return;
    }

    // Save current answer first if any
    if (activeAnswer.trim()) {
      await submitAnswer(
        currentSession._id,
        currentQuestionIndex,
        activeAnswer,
        questionTimeSeconds
      );
    }

    setIsFinishing(true);
    const res = await completeSession(currentSession._id);
    setIsFinishing(false);

    if (res.success) {
      navigate(`/sessions/${currentSession._id}/report`);
    } else {
      setErrorMsg(res.error || 'Failed to complete session.');
    }
  };

  const formatTime = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-[#94A3B8] font-sans flex flex-col justify-between">
      
      {/* Top Session Bar */}
      <header className="border-b border-[#334155] bg-[#090D16]/90 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#6366F1]/20 border border-[#6366F1]/40 flex items-center justify-center text-[#818CF8]">
            <Zap className="w-4 h-4 text-[#6366F1]" />
          </div>
          <div>
            <div className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
              <span>{currentInterview?.role || 'Mock Interview'}</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-[#6366F1]/15 text-[#818CF8] border border-[#6366F1]/30 font-mono">
                {currentInterview?.level || 'Senior'}
              </span>
            </div>
            <div className="text-[11px] text-[#94A3B8] flex items-center gap-2">
              <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
              <span>•</span>
              <span className="capitalize">{currentQ.type || 'technical'}</span>
            </div>
          </div>
        </div>

        {/* Timers & Controls */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F172A] border border-[#334155] text-xs font-mono text-[#F8FAFC]">
            <Clock className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span>Session: {formatTime(elapsedSeconds)}</span>
          </div>

          <button
            onClick={handleFinishInterview}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-all"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Finish Test</span>
          </button>
        </div>
      </header>

      {/* Main Chamber Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Question & Answer (8 cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          
          {/* Question Card */}
          <div className="card-saas p-6 relative border-[#6366F1]/40">
            <div className="flex items-center justify-between mb-3">
              <span className="badge-indigo text-[11px] font-bold uppercase tracking-wider">
                {currentQ.type || 'Technical'} Probe
              </span>
              <span className="text-xs font-mono text-[#94A3B8]">
                Question Time: {formatTime(questionTimeSeconds)}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-[#F8FAFC] leading-relaxed">
              {currentQ.text || 'Loading question...'}
            </h2>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

            {/* Answer Area */}
            <div className="card-saas p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC] flex items-center gap-2">
                    <span>{codeMode ? 'Your Code Implementation' : 'Your Structured Response'}</span>
                    <span className="text-[10px] font-normal text-[#94A3B8] font-mono">
                      ({activeAnswer.trim().split(/\s+/).filter(Boolean).length} {codeMode ? 'tokens' : 'words'})
                    </span>
                  </label>

                  {/* Code Mode & Starter Code Actions */}
                  <div className="flex items-center gap-2">
                    {(currentQ?.starterCode || currentQ?.codeSnippet) && !activeAnswer && (
                      <button
                        type="button"
                        onClick={handleInsertStarterCode}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#6366F1]/15 hover:bg-[#6366F1]/25 border border-[#6366F1]/30 text-[#818CF8] transition-colors"
                      >
                        <Code className="w-3.5 h-3.5" />
                        <span>Insert Starter Code</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setCodeMode(!codeMode)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        codeMode 
                          ? 'bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/40' 
                          : 'bg-[#0F172A] border border-[#334155] text-[#94A3B8] hover:text-[#F8FAFC]'
                      }`}
                    >
                      <Code className="w-3.5 h-3.5" />
                      <span>{codeMode ? 'Code Mode (Monospace)' : 'Text Mode'}</span>
                    </button>
                  </div>
                </div>

                <textarea
                  value={activeAnswer}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  placeholder={
                    codeMode
                      ? '// Write your algorithmic solution or code implementation here...\nfunction solution() {\n  \n}'
                      : 'Type your structured answer here. State the situation, the architectural decisions, trade-offs, and final result...'
                  }
                  rows={10}
                  className={`w-full p-4 rounded-xl border text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#6366F1] transition-all resize-none ${
                    codeMode
                      ? 'bg-[#090D16] font-mono text-[#10B981] border-[#6366F1]/40 placeholder-[#64748B]'
                      : 'bg-[#0F172A] font-sans text-[#F8FAFC] border-[#334155] placeholder-[#64748B]'
                  }`}
                />
              </div>

              {/* Answer Control Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#334155]">
                <span className="text-[11px] text-[#94A3B8]">
                  Responses are automatically saved when navigating. Use microphone dictation or keyboard.
                </span>
                <button
                  onClick={handleSendLiveAnswer}
                  disabled={isStreaming || !activeAnswer.trim()}
                  className="w-full sm:w-auto btn-primary-gradient px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {isStreaming ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Interviewer is Thinking...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Get Live AI Follow-up Probe</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>

          {/* Right Side: Live Hardware Proctor Feed, Feedback Stream & Navigator (4 cols) */}
          <div className="lg:col-span-4 flex flex-col space-y-6">
            
            {/* Live Camera & Mic Proctor Feed */}
            <HardwareProctorFeed onSpeechTranscript={handleSpeechTranscript} />

            {/* Question Index Navigator */}
          <div className="card-saas p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC] mb-3 flex items-center justify-between">
              <span>Question Progression</span>
              <span className="font-mono text-[#818CF8]">
                {Object.keys(answers).length} / {questions.length} Answered
              </span>
            </h4>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentQuestionIndex;
                const isAnswered = !!answers[idx]?.trim();
                return (
                  <button
                    key={idx}
                    onClick={() => jumpToQuestion(idx)}
                    className={`h-10 rounded-xl font-bold text-xs flex items-center justify-center transition-all ${
                      isCurrent
                        ? 'bg-[#6366F1] text-white ring-2 ring-[#6366F1] ring-offset-2 ring-offset-[#090D16]'
                        : isAnswered
                        ? 'bg-[#10B981]/15 border border-[#10B981]/40 text-[#10B981]'
                        : 'bg-[#0F172A] border border-[#334155] text-[#94A3B8] hover:border-[#6366F1]/50'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Real-Time Streaming Feedback Card */}
          <div className="card-saas p-5 flex-1 flex flex-col border-[#6366F1]/30">
            <div className="flex items-center justify-between pb-3 border-b border-[#334155] mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#818CF8] flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-[#06B6D4]" />
                Interviewer Observation
              </span>
              {isStreaming && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/30 animate-pulse">
                  Streaming
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto max-h-[350px] space-y-2 text-xs text-[#94A3B8] leading-relaxed font-sans">
              {streamedTokens ? (
                <div className="p-3.5 rounded-xl bg-[#0F172A] border border-[#6366F1]/30 space-y-2">
                  <div className="font-semibold text-[#06B6D4] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Real-Time Feedback / Probe:</span>
                  </div>
                  <p className="whitespace-pre-wrap text-[#F8FAFC]">{streamedTokens}</p>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-[#94A3B8] py-10 px-4 space-y-2">
                  <Sparkles className="w-8 h-8 text-[#475569] animate-pulse" />
                  <p className="text-xs">
                    Type your answer and click <strong>Get Live AI Follow-up Probe</strong> to stream instantaneous feedback from the interviewer.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>

      </main>

      {/* Bottom Floating Navigation Bar */}
      <footer className="border-t border-[#334155] bg-[#090D16]/95 backdrop-blur-md px-4 sm:px-8 py-3.5 sticky bottom-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={prevQuestion}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1E293B] hover:bg-[#334155] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#334155] text-xs font-semibold transition-colors disabled:opacity-30"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs text-[#94A3B8]">
            <span>Use navigation to review or revise answers at any time</span>
          </div>

          {currentQuestionIndex < questions.length - 1 ? (
            <button
              onClick={nextQuestion}
              className="btn-primary-gradient flex items-center gap-1.5 px-5 py-2 rounded-xl text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all"
            >
              <span>Next Question</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinishInterview}
              disabled={isFinishing}
              className="flex items-center gap-1.5 px-6 py-2 rounded-xl bg-gradient-to-r from-[#10B981] to-[#06B6D4] hover:brightness-110 text-[#090D16] text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
            >
              {isFinishing ? (
                <span>Generating Report...</span>
              ) : (
                <>
                  <span>Complete Interview & View Scorecard</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </footer>

      {/* Finishing / Evaluating Full Screen Modal */}
      {isFinishing && (
        <div className="fixed inset-0 z-50 bg-[#090D16]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
          <div className="w-20 h-20 rounded-full border-4 border-[#10B981]/20 border-t-[#10B981] animate-spin mb-6"></div>
          <h3 className="text-2xl font-bold text-[#F8FAFC] mb-2">
            Synthesizing Comprehensive Scorecard
          </h3>
          <p className="text-[#94A3B8] text-sm max-w-md">
            Groq LLaMA 3.3 70B is analyzing technical precision, communication clarity, problem-solving depth, and generating actionable improvement recommendations...
          </p>
        </div>
      )}

    </div>
  );
}
