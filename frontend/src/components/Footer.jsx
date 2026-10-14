import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Github, ShieldCheck, Cpu } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-[#334155] bg-[#090D16] text-[#94A3B8] text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Brand Col */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/20">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-lg tracking-tight text-[#F8FAFC] font-heading">
                Interview<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">AI</span>
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Empowering engineers and tech professionals to master technical, behavioral, and system design interviews through autonomous, RAG-grounded AI simulations.
            </p>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              All Systems Operational
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="font-semibold text-[#F8FAFC] text-xs uppercase tracking-wider mb-3 font-heading">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/interviews/new" className="hover:text-indigo-400 transition-colors">Start Mock Interview</Link></li>
              <li><Link to="/resumes/analyzer" className="hover:text-indigo-400 transition-colors">ATS Resume Analyzer</Link></li>
              <li><Link to="/quizzes" className="hover:text-indigo-400 transition-colors">Quiz Competition Arena</Link></li>
              <li><Link to="/resumes/project-interrogation" className="hover:text-indigo-400 transition-colors">Project Deep Interrogation</Link></li>
              <li><Link to="/dashboard" className="hover:text-indigo-400 transition-colors">Candidate Workspace</Link></li>
              <li><Link to="/pricing" className="hover:text-indigo-400 transition-colors">Pricing & Plans</Link></li>
            </ul>
          </div>

          {/* Architecture & AI Specs */}
          <div>
            <h4 className="font-semibold text-[#F8FAFC] text-xs uppercase tracking-wider mb-3 font-heading">Zero-Cost Architecture</h4>
            <ul className="space-y-2 text-xs text-[#94A3B8]">
              <li className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>TF-IDF Vector RAG Engine</span>
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Groq LLaMA 3.3 70B Versatile</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Socket.io Real-Time Streaming</span>
              </li>
              <li>Dual Query Optimizer (Technical + Cultural)</li>
            </ul>
          </div>

          {/* Administration & Governance */}
          <div>
            <h4 className="font-semibold text-[#F8FAFC] text-xs uppercase tracking-wider mb-3 font-heading">Governance & Legal</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/privacy" className="hover:text-indigo-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-indigo-400 transition-colors">Terms of Service</Link></li>
              <li><Link to="/admin/login" className="hover:text-indigo-400 transition-colors">Admin Portal Sign In</Link></li>
              <li><span className="text-[#64748B]">AES-256 Encryption & Helmet Guards</span></li>
              <li><span className="text-[#64748B]">19-Permission RBAC Engine</span></li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-[#334155] flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748B] gap-4">
          <p>© 2026 InterviewAI Platform. Built strictly according to the 107-page architectural specifications.</p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="hover:text-[#F8FAFC] transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-[#F8FAFC] transition-colors">Terms of Service</Link>
            <span className="font-mono text-[11px] text-[#94A3B8]">v1.0.0 (Zero Cost Active)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
