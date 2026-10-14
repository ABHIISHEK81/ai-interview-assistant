import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Zap, 
  Sparkles, 
  FileText, 
  BarChart3, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Award,
  AlertCircle,
  ShieldAlert,
  Trophy,
  Target,
  Code,
  Layers,
  Cpu,
  User,
  Flame,
  ChevronRight,
  Play,
  Terminal,
  HelpCircle
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';
import MockTestModal from '../components/MockTestModal';

export default function DashboardPage() {
  const { user, fetchMe } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [deniedMessage, setDeniedMessage] = useState(location.state?.message || '');
  const [stats, setStats] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);

  // AI Mock Test Launcher state (Prominent top feature)
  const [isMockTestOpen, setIsMockTestOpen] = useState(false);
  const [selectedDomainType, setSelectedDomainType] = useState('role'); // 'role' or 'skill'
  const [selectedSubject, setSelectedSubject] = useState('Senior Full-Stack Engineer');
  const [selectedDifficulty, setSelectedDifficulty] = useState('senior');

  // Auto-trigger mock test modal if navigated with query ?action=mock-test
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'mock-test' || location.pathname === '/mock-tests') {
      setIsMockTestOpen(true);
      if (params.get('subject')) setSelectedSubject(params.get('subject'));
      if (params.get('type')) setSelectedDomainType(params.get('type'));
    }
  }, [location]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        await fetchMe();
        const [statsRes, resumesRes] = await Promise.all([
          api.get('/users/stats').catch(() => ({ data: { data: {} } })),
          api.get('/resumes').catch(() => ({ data: { data: [] } })),
        ]);

        setStats(statsRes.data.data);
        setResumes(resumesRes.data.data || []);
      } catch (err) {
        console.warn('Dashboard load error:', err.message);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const defaultResume = resumes.find((r) => r.isDefault) || resumes[0];

  const roleOptions = [
    { id: 'Senior Full-Stack Engineer', label: 'Senior Full-Stack', desc: 'React, Node, DB & Scalability', icon: Layers },
    { id: 'Senior Frontend Architect', label: 'Frontend Architect', desc: 'Core Web Vitals, State & Bundling', icon: Code },
    { id: 'Cloud & DevOps Engineer', label: 'Cloud & DevOps', desc: 'K8s, CI/CD Pipelines & Terraform', icon: Cpu },
  ];

  const skillOptions = [
    { id: 'Distributed System Design', label: 'Distributed Systems', desc: 'Microservices, Sharding & Caching', icon: Layers },
    { id: 'Data Structures & Concurrency', label: 'DSA & Concurrency', desc: 'Trees, Graphs, Workers & Race Conditions', icon: Code },
    { id: 'Database Optimization & Indexing', label: 'Database Optimization', desc: 'Query Execution Plans & B-Trees', icon: Cpu },
  ];

  const currentOptions = selectedDomainType === 'role' ? roleOptions : skillOptions;

  const handleLaunchMockTest = (subjectName, domainType = selectedDomainType) => {
    setSelectedSubject(subjectName || selectedSubject);
    setSelectedDomainType(domainType);
    setIsMockTestOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Access Denied Banner for unauthorized admin attempts */}
      {deniedMessage && (
        <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-sm flex items-center justify-between shadow-xl shadow-rose-950/40 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <p className="font-bold text-[#F8FAFC] text-xs sm:text-sm">{deniedMessage}</p>
              <p className="text-[#94A3B8] text-xs mt-0.5">Your standard candidate dashboard has been preserved.</p>
            </div>
          </div>
          <button 
            onClick={() => setDeniedMessage('')} 
            className="text-[#94A3B8] hover:text-[#F8FAFC] text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#0F172A] border border-[#334155] transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PROMINENT TOP HERO: PROFILE SECTION (LEFT) & AI MOCK TEST ARENA (RIGHT)  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* User Dashboard / Profile Section (Left Column - 5 cols) */}
        <div className="lg:col-span-5 card-saas rounded-3xl p-6 sm:p-7 flex flex-col justify-between border-[#334155] bg-gradient-to-br from-[#1E293B] via-[#172236] to-[#0F172A] relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
          
          <div className="space-y-5 relative z-10">
            {/* Header Tag */}
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                <Sparkles className="w-3.5 h-3.5 text-[#06B6D4]" />
                <span>Candidate Profile Hub</span>
              </div>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-[#10B981] border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
                Active Candidate
              </span>
            </div>

            {/* Profile Info */}
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#6366F1] via-[#4F46E5] to-[#06B6D4] p-[2px] shadow-lg shadow-indigo-500/20 shrink-0">
                <div className="w-full h-full bg-[#090D16] rounded-[14px] flex items-center justify-center text-xl font-black text-[#F8FAFC] uppercase tracking-wider">
                  {user?.name ? user.name.slice(0, 2) : 'EN'}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-black text-[#F8FAFC] tracking-tight truncate font-heading">
                  {user?.name || 'Candidate Engineer'}
                </h1>
                <p className="text-xs text-[#94A3B8] truncate mt-0.5">{user?.email || 'candidate@platform.local'}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#0F172A] text-slate-300 border border-[#334155] capitalize">
                    {user?.plan || 'Free'} Plan
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Role: {user?.targetRole || 'Software Engineer'}
                  </span>
                </div>
              </div>
            </div>

            {/* Resume Connection Status */}
            <div className="p-3.5 rounded-2xl bg-[#0F172A]/80 border border-[#334155] text-xs space-y-1.5">
              <div className="flex items-center justify-between text-[#94A3B8]">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#06B6D4]" />
                  Primary Resume:
                </span>
                <Link to="/resumes" className="text-indigo-400 hover:text-indigo-300 font-semibold hover:underline">
                  {defaultResume ? 'Manage' : 'Upload'}
                </Link>
              </div>
              <div className="font-semibold text-[#F8FAFC] truncate">
                {defaultResume ? defaultResume.originalName : 'No resume uploaded yet (Standard profile in use)'}
              </div>
            </div>
          </div>

          {/* Credits Bar & Action Footer */}
          <div className="pt-5 mt-5 border-t border-[#334155]/80 flex items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-indigo-400 fill-indigo-400/20" />
              </div>
              <div>
                <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider block font-semibold">Balance</span>
                <span className="text-lg font-black text-[#F8FAFC] leading-tight">
                  {user?.credits ?? 2} <span className="text-xs text-indigo-300 font-normal">Credits</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className="px-3.5 py-2 rounded-xl bg-[#0F172A] hover:bg-[#334155] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#334155] text-xs font-semibold transition-colors flex items-center gap-1"
              >
                <User className="w-3.5 h-3.5" />
                Profile
              </Link>
              <Link
                to="/pricing"
                className="px-3.5 py-2 rounded-xl btn-primary-gradient text-white text-xs font-bold transition-all flex items-center gap-1"
              >
                <Zap className="w-3.5 h-3.5" />
                Refill
              </Link>
            </div>
          </div>
        </div>

        {/* AI-Based Mock Tests Feature (Prominently Right Next to Profile - 7 cols) */}
        <div className="lg:col-span-7 card-saas rounded-3xl p-6 sm:p-7 flex flex-col justify-between border-[#334155] bg-gradient-to-br from-[#1E293B] via-[#162137] to-[#0F172A] relative overflow-hidden shadow-xl group">
          <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

          <div className="space-y-4 relative z-10">
            {/* Header with AI Badge */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                <Sparkles className="w-3.5 h-3.5 text-[#06B6D4] animate-spin" style={{ animationDuration: '4s' }} />
                <span>AI-BASED MOCK TEST CHAMBER</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#94A3B8] bg-[#0F172A]/80 px-2.5 py-1 rounded-lg border border-[#334155]">
                <Clock className="w-3 h-3 text-[#06B6D4]" />
                <span>Timed • Deep Rubric Evaluated</span>
              </div>
            </div>

            {/* Title & Description */}
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#F8FAFC] tracking-tight flex items-center gap-2 font-heading">
                <span>Evaluate Your Skills Under Real Pressure</span>
              </h2>
              <p className="text-xs text-[#94A3B8] leading-relaxed max-w-xl mt-1">
                Take role-specific or skill-specific mock tests evaluated through AI. Receive instant 4-dimension scoring, architecture rubrics, and model benchmark solutions.
              </p>
            </div>

            {/* Domain Switcher Tabs */}
            <div className="flex items-center gap-2 p-1 rounded-xl bg-[#0F172A] border border-[#334155] max-w-md">
              <button
                type="button"
                onClick={() => {
                  setSelectedDomainType('role');
                  setSelectedSubject('Senior Full-Stack Engineer');
                }}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  selectedDomainType === 'role'
                    ? 'bg-gradient-to-r from-[#6366F1] to-[#4F46E5] text-white shadow-md'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Role-Specific Tests
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedDomainType('skill');
                  setSelectedSubject('Distributed System Design');
                }}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  selectedDomainType === 'skill'
                    ? 'bg-gradient-to-r from-[#6366F1] to-[#4F46E5] text-white shadow-md'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                Skill-Specific Tests
              </button>
            </div>

            {/* Quick Test Option Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              {currentOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedSubject === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedSubject(opt.id)}
                    className={`p-3 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#06B6D4]/15 border-[#06B6D4]/60 shadow-lg shadow-cyan-950/40'
                        : 'bg-[#0F172A] border-[#334155] hover:border-slate-500 hover:bg-[#1E293B]/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-[#06B6D4]' : 'text-[#94A3B8]'}`} />
                        {isSelected && <span className="w-2 h-2 rounded-full bg-[#06B6D4] shadow-sm shadow-cyan-400" />}
                      </div>
                      <h4 className={`text-xs font-bold line-clamp-1 ${isSelected ? 'text-[#F8FAFC]' : 'text-slate-200'}`}>
                        {opt.label}
                      </h4>
                      <p className="text-[10px] text-[#94A3B8] line-clamp-1 mt-0.5">
                        {opt.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Launch Bar */}
          <div className="pt-4 mt-4 border-t border-[#334155]/80 flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-2 text-[11px] text-[#94A3B8]">
              <span className="text-slate-300 font-semibold">Selected:</span>
              <span className="text-[#06B6D4] font-mono font-medium truncate max-w-[200px]">
                {selectedSubject}
              </span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleLaunchMockTest(selectedSubject, selectedDomainType)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl btn-primary-gradient text-white text-xs font-extrabold shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 transform active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Launch AI Mock Test Now</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* STATS OVERVIEW CARDS                                                      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-saas p-5 rounded-2xl border-[#334155] bg-[#1E293B]">
          <div className="flex items-center justify-between text-[#94A3B8] text-xs mb-2">
            <span>Total Mock Sessions</span>
            <BarChart3 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-black text-[#F8FAFC]">
            {stats?.completedSessionsCount ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Interviews completed</div>
        </div>

        <div className="card-saas p-5 rounded-2xl border-[#334155] bg-[#1E293B]">
          <div className="flex items-center justify-between text-[#94A3B8] text-xs mb-2">
            <span>Average AI Score</span>
            <Award className="w-4 h-4 text-[#06B6D4]" />
          </div>
          <div className="text-3xl font-black text-[#F8FAFC]">
            {stats?.averageScore ? `${Math.round(stats.averageScore)}%` : '92%'}
          </div>
          <div className="text-[11px] text-[#10B981] mt-1 font-medium">Overall readiness index</div>
        </div>

        <div className="card-saas p-5 rounded-2xl border-[#334155] bg-[#1E293B]">
          <div className="flex items-center justify-between text-[#94A3B8] text-xs mb-2">
            <span>Resumes Analyzed</span>
            <FileText className="w-4 h-4 text-[#6366F1]" />
          </div>
          <div className="text-3xl font-black text-[#F8FAFC]">
            {resumes.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {defaultResume ? 'Default profile linked' : 'No resume uploaded'}
          </div>
        </div>

        <div className="card-saas p-5 rounded-2xl border-[#334155] bg-[#1E293B]">
          <div className="flex items-center justify-between text-[#94A3B8] text-xs mb-2">
            <span>Candidate Tier</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-[#F8FAFC] capitalize">
            {user?.plan || 'Free'} Tier
          </div>
          <div className="text-[11px] text-indigo-400 mt-1">
            <Link to="/pricing" className="hover:underline">Upgrade perks →</Link>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* NEW FEATURE QUICK-LAUNCH SUITE (Part 3 Features)                          */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#F8FAFC] flex items-center gap-2 font-heading">
              <Sparkles className="w-4 h-4 text-[#06B6D4]" />
              <span>AI-Powered Career & Skills Suite</span>
            </h3>
            <p className="text-xs text-[#94A3B8]">Advanced AI tools to accelerate candidate evaluation and resume targeting</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Feature 1: Resume ATS Score & Role-Based Edit Suggestions */}
          <Link
            to="/resume-analyzer"
            className="group card-saas card-saas-hover p-6 rounded-3xl flex flex-col justify-between border-[#334155] bg-[#1E293B] relative overflow-hidden transition-all"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none -mr-8 -mt-8" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-[#06B6D4] mb-4 group-hover:scale-110 transition-transform">
                <Target className="w-6 h-6" />
              </div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-[#06B6D4] border border-cyan-500/20 mb-2">
                <span>ATS Compatibility & Edit Radar</span>
              </div>
              <h4 className="text-lg font-bold text-[#F8FAFC] mb-1.5 group-hover:text-[#06B6D4] transition-colors font-heading">
                Resume ATS & Role-Based Edits
              </h4>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Calculates an ATS compatibility score for uploaded resumes and provides tailored, actionable improvement suggestions customized to specific target job roles.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-[#334155] flex items-center justify-between text-xs text-[#06B6D4] font-bold">
              <span>View ATS Score & Role Edits</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </Link>

          {/* Feature 2: Project-Specific Deep Dive: Project Interrogation */}
          <Link
            to="/project-interrogation"
            className="group card-saas card-saas-hover p-6 rounded-3xl flex flex-col justify-between border-[#334155] bg-[#1E293B] relative overflow-hidden transition-all"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none -mr-8 -mt-8" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
                <Terminal className="w-6 h-6" />
              </div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 mb-2">
                <span>Practical Hands-On Authenticity</span>
              </div>
              <h4 className="text-lg font-bold text-[#F8FAFC] mb-1.5 group-hover:text-amber-300 transition-colors font-heading">
                Project Deep Dive Interrogation
              </h4>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Extracts projects mentioned in your resume and conducts targeted interactive questioning to test practical knowledge, trade-offs, and failure post-mortems.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-[#334155] flex items-center justify-between text-xs text-amber-400 font-bold">
              <span>Enter Project Interrogation Chamber</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </Link>

          {/* Feature 3: Resume-Based AI Questioning */}
          <Link
            to="/resume-analyzer"
            className="group card-saas card-saas-hover p-6 rounded-3xl flex flex-col justify-between border-[#334155] bg-[#1E293B] relative overflow-hidden transition-all"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none -mr-8 -mt-8" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mb-2">
                <span>Targeted Interview Questions</span>
              </div>
              <h4 className="text-lg font-bold text-[#F8FAFC] mb-1.5 group-hover:text-indigo-300 transition-colors font-heading">
                Resume-Based AI Questioning
              </h4>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Analyzes your resume and automatically generates targeted interview questions matching your specified job role, background, and framework internals.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-[#334155] flex items-center justify-between text-xs text-indigo-400 font-bold">
              <span>Generate Custom Questions</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </Link>

          {/* Feature 4: AI-Based Quiz Competitions */}
          <Link
            to="/quiz-arena"
            className="group card-saas card-saas-hover p-6 rounded-3xl flex flex-col justify-between border-[#334155] bg-[#1E293B] relative overflow-hidden transition-all"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none -mr-8 -mt-8" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-[#10B981] mb-4 group-hover:scale-110 transition-transform">
                <Trophy className="w-6 h-6" />
              </div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-[#10B981] border border-emerald-500/20 mb-2">
                <span>Live Ranking & XP</span>
              </div>
              <h4 className="text-lg font-bold text-[#F8FAFC] mb-1.5 group-hover:text-[#10B981] transition-colors font-heading">
                AI-Based Quiz Competitions
              </h4>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Host and battle in interactive competitive quizzes. Test technical knowledge across JS, Architecture, and AI with live leaderboards and streaks.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-[#334155] flex items-center justify-between text-xs text-[#10B981] font-bold">
              <span>Enter Competition Arena</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </Link>

          {/* Feature 5: Live AI Voice / Interactive Mock Interview */}
          <Link
            to="/interviews/new"
            className="group card-saas card-saas-hover p-6 rounded-3xl flex flex-col justify-between border-[#334155] bg-[#1E293B] relative overflow-hidden transition-all"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none -mr-8 -mt-8" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mb-2">
                <span>Dynamic RAG Session</span>
              </div>
              <h4 className="text-lg font-bold text-[#F8FAFC] mb-1.5 group-hover:text-indigo-300 transition-colors font-heading">
                Full AI Mock Interview
              </h4>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Simulate a real-time behavioral and technical hiring interview grounded in your resume chunks. Generates comprehensive scoring reports.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-[#334155] flex items-center justify-between text-xs text-indigo-400 font-bold">
              <span>Configure Interview</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </Link>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* ACTIVE RESUME GROUNDING CARD                                              */}
      {/* ========================================================================= */}
      <div className="card-saas rounded-3xl p-6 border-[#334155] bg-[#1E293B]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              Active Grounding Profile & Technical Inventory
            </h3>
            {defaultResume ? (
              <div className="mt-2.5 space-y-1.5">
                <div className="text-sm text-slate-300 flex items-center gap-2">
                  <span className="font-bold text-[#F8FAFC]">{defaultResume.originalName}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/15 text-[#10B981] border border-emerald-500/30 font-mono">
                    Default Active
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {defaultResume.parsedData?.skills?.slice(0, 10).map((skill, idx) => (
                    <span key={idx} className="px-2.5 py-0.5 rounded-lg bg-[#0F172A] text-[11px] text-[#94A3B8] border border-[#334155]">
                      {skill}
                    </span>
                  ))}
                  {(defaultResume.parsedData?.skills?.length || 0) > 10 && (
                    <span className="text-[11px] text-slate-500 py-0.5 font-medium">
                      +{defaultResume.parsedData.skills.length - 10} more skills
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-2 text-xs text-[#94A3B8] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>No resume uploaded yet. Tests will default to standard high-bar technology rubrics.</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/resume-analyzer"
              className="px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-[#06B6D4] border border-[#06B6D4]/30 text-xs font-bold transition-colors"
            >
              Analyze Resume ATS
            </Link>
            <Link
              to="/resumes"
              className="px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-[#334155] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#334155] text-xs font-semibold transition-colors"
            >
              {defaultResume ? 'Manage All' : 'Upload Resume'}
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* INTERACTIVE AI MOCK TEST MODAL                                            */}
      {/* ========================================================================= */}
      {isMockTestOpen && (
        <MockTestModal
          isOpen={isMockTestOpen}
          onClose={() => setIsMockTestOpen(false)}
          initialSubject={selectedSubject}
          initialType={selectedDomainType}
        />
      )}

    </div>
  );
}
