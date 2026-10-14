import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Sparkles, 
  Timer, 
  CheckCircle2, 
  XCircle, 
  Flame, 
  Zap, 
  Award, 
  RotateCcw, 
  ArrowRight, 
  ChevronRight,
  Shield,
  Users,
  Star
} from 'lucide-react';
import api from '../services/api';

export default function QuizCompetitionPage() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('fullstack-js');
  const [leaderboard, setLeaderboard] = useState([]);
  const [myStanding, setMyStanding] = useState(null);
  
  // Active quiz state
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(25);
  const [streak, setStreak] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategoriesAndLeaderboard();
  }, []);

  const loadCategoriesAndLeaderboard = async () => {
    try {
      const [catRes, leadRes] = await Promise.all([
        api.get('/quizzes/categories'),
        api.get('/quizzes/leaderboard'),
      ]);
      setCategories(catRes.data.categories || []);
      setLeaderboard(leadRes.data.leaderboard || []);
      setMyStanding(leadRes.data.myStanding);
    } catch (err) {
      console.warn('Failed to load competition data:', err.message);
    }
  };

  // Question timer
  useEffect(() => {
    if (!activeQuiz || quizResult) return;
    if (timeLeft <= 0) {
      // Auto move next on timeout
      handleSelectOption(null);
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [activeQuiz, quizResult, timeLeft]);

  const handleStartCompetition = async (catId) => {
    setLoading(true);
    try {
      const res = await api.post('/quizzes/generate', { category: catId || selectedCategory });
      setActiveQuiz(res.data.quiz);
      setCurrentIdx(0);
      setAnswers({});
      setTimeLeft(25);
      setStreak(0);
      setQuizResult(null);
    } catch (err) {
      console.warn('Failed to start quiz:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (optionIndex) => {
    if (!activeQuiz) return;
    const currentQ = activeQuiz.questions[currentIdx];
    const newAnswers = { ...answers, [currentQ.id]: optionIndex };
    setAnswers(newAnswers);

    if (currentIdx < activeQuiz.questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setTimeLeft(25);
    } else {
      // Complete quiz
      handleSubmitQuiz(newAnswers);
    }
  };

  const handleSubmitQuiz = async (finalAnswers) => {
    setSubmitting(true);
    try {
      const res = await api.post('/quizzes/submit', {
        category: activeQuiz.category,
        answers: finalAnswers,
        timeTakenSeconds: 45,
      });
      setQuizResult(res.data.result);
      await loadCategoriesAndLeaderboard(); // refresh leaderboard
    } catch (err) {
      console.warn('Failed to submit quiz:', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-2">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Competitive Arena & Global Leaderboard</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            AI-Based Quiz Competitions
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Test and rank your technical proficiency in high-stakes, timed AI challenge rounds.
          </p>
        </div>

        {myStanding && (
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800">
            <Award className="w-5 h-5 text-amber-400" />
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Your Best Performance</span>
              <span className="text-xs font-black text-white">
                {myStanding.bestScore} XP • Tier: <span className="text-amber-300">{myStanding.tier}</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Quiz Arena on Left / Center, Live Leaderboard on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Arena Left / Center Column */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* STATE 1: Select Category & Launch Competition */}
          {!activeQuiz && !quizResult && (
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border-slate-800 space-y-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <span>Choose Your Competition Category</span>
              </h2>

              <div className="space-y-3">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${
                      selectedCategory === cat.id
                        ? 'bg-gradient-to-r from-indigo-950/80 to-slate-900 border-indigo-500/60 ring-1 ring-indigo-500/40 shadow-lg shadow-indigo-950/40'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                          {cat.title}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          +{cat.xpReward} XP
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {cat.questionCount} timed questions • {cat.timePerQuestionSeconds}s per round
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartCompetition(cat.id);
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 shrink-0"
                    >
                      <span>Compete</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-slate-300 flex items-center gap-3">
                <Zap className="w-5 h-5 text-amber-400 shrink-0" />
                <span>
                  <strong>Scoring Mechanics:</strong> Earn +100 XP per correct answer, with escalating streak multipliers (+25 per consecutive answer) and speed efficiency points.
                </span>
              </div>
            </div>
          )}

          {/* STATE 2: Active Timed Quiz Round */}
          {activeQuiz && !quizResult && activeQuiz.questions[currentIdx] && (
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border-indigo-500/40 space-y-6 animate-in fade-in shadow-2xl">
              
              {/* Status Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                    Question {currentIdx + 1} / {activeQuiz.questions.length}
                  </span>
                  <span className="text-xs text-slate-400 hidden sm:inline">{activeQuiz.title}</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-400 font-mono">
                    <Timer className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span>{timeLeft}s</span>
                  </div>
                  <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-rose-500 transition-all duration-1000"
                      style={{ width: `${(timeLeft / 25) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Question Statement */}
              <div className="space-y-3">
                <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                  {activeQuiz.questions[currentIdx].question}
                </h3>
              </div>

              {/* 4 Interactive Options */}
              <div className="space-y-2.5">
                {activeQuiz.questions[currentIdx].options.map((opt, oIdx) => (
                  <button
                    key={oIdx}
                    type="button"
                    onClick={() => handleSelectOption(oIdx)}
                    className="w-full p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-indigo-500 text-left text-xs sm:text-sm text-slate-200 font-medium transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-slate-800 group-hover:bg-indigo-600 text-slate-400 group-hover:text-white flex items-center justify-center text-xs font-bold transition-colors">
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span>{opt}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                  </button>
                ))}
              </div>

              {/* Skip Option */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => handleSelectOption(null)}
                  className="text-xs text-slate-500 hover:text-slate-300 font-medium"
                >
                  Skip Question →
                </button>
              </div>

            </div>
          )}

          {/* STATE 3: Quiz Results & Explanations */}
          {quizResult && (
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border-slate-800 space-y-6 animate-in fade-in">
              
              {/* Score Showcase */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950/50 via-slate-900 to-[#0a0d18] border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono">
                    Round Finished • {quizResult.category}
                  </span>
                  <h3 className="text-3xl font-black text-white mt-1">
                    +{quizResult.totalScore} <span className="text-amber-400">XP</span>
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Rank Tier: {quizResult.rankTier}
                    </span>
                    <span className="text-xs text-slate-400">
                      Accuracy: {quizResult.accuracy}% ({quizResult.correctCount}/{quizResult.totalQuestions})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                    <span className="text-lg font-black text-emerald-400">{quizResult.correctCount}</span>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Correct</span>
                  </div>
                  <div className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                    <span className="text-lg font-black text-amber-400">{quizResult.maxStreak}x</span>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Streak</span>
                  </div>
                </div>
              </div>

              {/* Explanations List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Detailed Answer Key & AI Conceptual Explanations
                </h4>
                {quizResult.questionResults.map((qr, idx) => (
                  <div
                    key={qr.id}
                    className={`p-4 rounded-xl border text-xs space-y-2 ${
                      qr.isCorrect
                        ? 'bg-emerald-950/20 border-emerald-500/30'
                        : 'bg-rose-950/20 border-rose-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-slate-200">
                        Q{idx + 1}: {qr.question}
                      </span>
                      {qr.isCorrect ? (
                        <span className="flex items-center gap-1 text-emerald-400 font-bold shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Correct (+100)
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-rose-400 font-bold shrink-0">
                          <XCircle className="w-3.5 h-3.5" /> Incorrect
                        </span>
                      )}
                    </div>

                    <div className="text-slate-300 font-mono text-[11px]">
                      Correct Answer: <strong className="text-white">{qr.options[qr.correctIndex]}</strong>
                    </div>

                    <p className="text-[11px] text-slate-400 italic">
                      💡 {qr.explanation}
                    </p>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => { setActiveQuiz(null); setQuizResult(null); }}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Play Another Round</span>
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Global Live Leaderboard Right Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 rounded-3xl border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Global Live Leaderboard</span>
              </h2>
              <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                LIVE
              </span>
            </div>

            <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
              {leaderboard.map((user, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    idx === 0
                      ? 'bg-gradient-to-r from-amber-950/40 to-slate-900 border-amber-500/40 text-amber-200'
                      : idx === 1
                      ? 'bg-slate-900 border-slate-700 text-slate-200'
                      : idx === 2
                      ? 'bg-slate-900 border-amber-700/30 text-amber-300'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0
                          ? 'bg-amber-500 text-black'
                          : idx === 1
                          ? 'bg-slate-300 text-black'
                          : idx === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-white block max-w-[170px] truncate">
                        {user.userName}
                      </span>
                      <span className="text-[10px] text-slate-500 block">{user.category}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black text-amber-300 block">{user.score} XP</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                      {user.tier}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800 text-center">
              <span className="text-[11px] text-slate-500">
                Ranks update dynamically after each AI challenge round.
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
