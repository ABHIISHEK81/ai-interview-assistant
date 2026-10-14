import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Cpu, 
  FileText, 
  Zap, 
  TrendingUp, 
  BarChart3,
  Target,
  ShieldCheck,
  Check
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="bg-mesh-radial min-h-screen text-[#94A3B8]">
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Subtle decorative glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full badge-indigo text-xs font-semibold mb-8 animate-pulse-glow">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Next-Generation AI Mock Interview Chamber</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#F8FAFC] mb-6 leading-[1.1] font-heading">
          Ace Your Dream Tech Role with <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-300 to-cyan-300">
            Real-Time AI Mock Interviews
          </span>
        </h1>

        {/* Subheading */}
        <p className="max-w-2xl mx-auto text-[#94A3B8] text-base sm:text-lg mb-10 leading-relaxed">
          Ground your preparation with autonomous AI simulations. Upload your resume, target any job role, and practice dynamic technical, coding, and behavioral interviews with instant objective scoring and actionable advice.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16">
          <Link
            to="/register"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl btn-primary-gradient text-white font-bold text-base shadow-xl shadow-indigo-600/30 hover:shadow-indigo-500/50 transition-all group"
          >
            <span>Start Free Mock Test</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/pricing"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl card-saas hover:bg-[#24344D] text-[#F8FAFC] font-semibold text-base transition-all"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>View Pricing & Plans</span>
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-6 border-t border-[#334155] text-left">
          <div className="p-4 rounded-xl card-saas">
            <div className="text-2xl font-extrabold text-[#F8FAFC] flex items-center gap-1.5 font-heading">
              <span>94.8%</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xs text-[#94A3B8] mt-1">Offer Conversion Rate</div>
          </div>
          <div className="p-4 rounded-xl card-saas">
            <div className="text-2xl font-extrabold text-[#F8FAFC] flex items-center gap-1.5 font-heading">
              <span>Zero-Cost</span>
              <Zap className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xs text-[#94A3B8] mt-1">Free Tier Guarantee</div>
          </div>
          <div className="p-4 rounded-xl card-saas">
            <div className="text-2xl font-extrabold text-[#F8FAFC] flex items-center gap-1.5 font-heading">
              <span>100% RAG</span>
              <Cpu className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xs text-[#94A3B8] mt-1">Resume-Grounded Questions</div>
          </div>
          <div className="p-4 rounded-xl card-saas">
            <div className="text-2xl font-extrabold text-[#F8FAFC] flex items-center gap-1.5 font-heading">
              <span>Real-Time</span>
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-xs text-[#94A3B8] mt-1">WebRTC Live Proctor Feed</div>
          </div>
        </div>
      </section>

      {/* RAG Platform Architecture Showcase */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#334155]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="px-3 py-1 rounded-full text-xs font-semibold badge-cyan">
            Intelligent Engine
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#F8FAFC] mt-4 mb-4 tracking-tight font-heading">
            How InterviewAI Delivers Flawless Simulations
          </h2>
          <p className="text-[#94A3B8] text-sm sm:text-base leading-relaxed">
            Our platform does not use generic question banks. It analyzes your unique engineering background and targets exact job descriptions through a multi-stage RAG pipeline.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1 */}
          <div className="card-saas-hover rounded-2xl p-8 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[#F8FAFC] font-heading">1. Smart Resume Ingestion</h3>
            <p className="text-[#94A3B8] text-xs sm:text-sm leading-relaxed">
              Upload your PDF resume. Our RAG parser extracts structured skills, employment timelines, projects, and educational credentials with zero hallucination.
            </p>
            <div className="pt-2 text-xs font-mono text-indigo-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Automated Section Chunking
            </div>
          </div>

          {/* Card 2 */}
          <div className="card-saas-hover rounded-2xl p-8 space-y-4 border-indigo-500/30 glow-indigo">
            <div className="w-12 h-12 rounded-xl bg-cyan-600/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[#F8FAFC] font-heading">2. Dual-Query RAG Synthesis</h3>
            <p className="text-[#94A3B8] text-xs sm:text-sm leading-relaxed">
              Expands your target role into technical competency and cultural queries. Section-boosted TF-IDF vector ranking ensures questions probe your true skills.
            </p>
            <div className="pt-2 text-xs font-mono text-cyan-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Skills 1.25x & Experience 1.20x Weights
            </div>
          </div>

          {/* Card 3 */}
          <div className="card-saas-hover rounded-2xl p-8 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[#F8FAFC] font-heading">3. Real-Time Streaming & Scoring</h3>
            <p className="text-[#94A3B8] text-xs sm:text-sm leading-relaxed">
              Answer via text or voice. Web Speech streams live speech. Upon finishing, receive a comprehensive 1-100 evaluation with actionable improvement points.
            </p>
            <div className="pt-2 text-xs font-mono text-indigo-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              1-10 Per-Answer Granular Score
            </div>
          </div>

        </div>
      </section>

      {/* Pricing Overview Preview */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#334155]">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="px-3 py-1 rounded-full text-xs font-semibold badge-mint">
            Fair & Transparent
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#F8FAFC] mt-4 mb-4 tracking-tight font-heading">
            Plans for Every Career Stage
          </h2>
          <p className="text-[#94A3B8] text-sm sm:text-base">
            Every candidate receives 2 complimentary interview credits on signup. Upgrade whenever you need deeper practice rounds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* Free Tier */}
          <div className="card-saas rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="text-[#94A3B8] text-xs font-bold uppercase tracking-wider mb-2">Free Trial Demo</div>
              <div className="text-3xl font-extrabold text-[#F8FAFC] mb-1 font-heading">₹0</div>
              <div className="text-xs text-cyan-400 font-semibold mb-4">2 Free Demo Credits</div>
              <ul className="space-y-2.5 text-xs text-[#94A3B8] mb-6">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 2 Free Demo Credits</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 1 Claim per unique email</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 30-Day trial validity</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Full AI Mock Tests & ATS Score</li>
              </ul>
            </div>
            <Link
              to="/register"
              className="w-full py-2.5 rounded-lg bg-[#24344D] hover:bg-slate-700 text-center text-xs font-semibold text-[#F8FAFC] transition-colors"
            >
              Sign Up Free (2 Credits)
            </Link>
          </div>

          {/* 1 Month Plan */}
          <div className="card-saas rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">1 Month Plan</div>
              <div className="text-3xl font-extrabold text-[#F8FAFC] mb-1 font-heading">₹249</div>
              <div className="text-xs text-indigo-300 font-semibold mb-4">10 Credits / 1 Month</div>
              <ul className="space-y-2.5 text-xs text-[#94A3B8] mb-6">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 10 Credits allocated</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Valid for 1 month</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Unused credits expire (no rollover)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Resume AI Questioning</li>
              </ul>
            </div>
            <Link
              to="/pricing"
              className="w-full py-2.5 rounded-lg bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-500/30 text-center text-xs font-semibold text-indigo-200 transition-colors"
            >
              Choose 1 Month (₹249)
            </Link>
          </div>

          {/* 3 Months Plan */}
          <div className="card-saas rounded-2xl p-6 flex flex-col justify-between border-indigo-500/40 glow-indigo relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
              Most Popular
            </div>
            <div>
              <div className="text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">3 Months Plan</div>
              <div className="text-3xl font-extrabold text-[#F8FAFC] mb-1 font-heading">₹449</div>
              <div className="text-xs text-cyan-300 font-semibold mb-4">30 Credits (10 / Mo)</div>
              <ul className="space-y-2.5 text-xs text-[#94A3B8] mb-6">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> 30 Credits over 3 months</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Monthly limits & rules apply</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Project Interrogation Chamber</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Priority AI Response</li>
              </ul>
            </div>
            <Link
              to="/pricing"
              className="w-full py-2.5 rounded-lg btn-primary-gradient text-center text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all"
            >
              Get 3 Months (₹449)
            </Link>
          </div>

          {/* 1 Year Plan */}
          <div className="card-saas rounded-2xl p-6 flex flex-col justify-between border-cyan-500/30">
            <div>
              <div className="text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">1 Year Plan</div>
              <div className="text-3xl font-extrabold text-[#F8FAFC] mb-1 font-heading">₹2500</div>
              <div className="text-xs text-cyan-400 font-semibold mb-4">Direct Access / Annual Pool</div>
              <ul className="space-y-2.5 text-xs text-[#94A3B8] mb-6">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Full continuous platform access</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Upfront annual payment</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Annual Pool allocation</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> VIP Queue & Deep Dives</li>
              </ul>
            </div>
            <Link
              to="/pricing"
              className="w-full py-2.5 rounded-lg btn-accent-cyan text-center text-xs font-bold text-white shadow-lg shadow-cyan-700/30 transition-all"
            >
              Choose 1 Year (₹2500)
            </Link>
          </div>

        </div>
      </section>

    </div>
  );
}
