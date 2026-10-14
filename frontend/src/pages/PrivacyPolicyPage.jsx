import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Eye, FileText, CheckCircle, ArrowLeft, Download, RefreshCw, Key, Server, Mail, ExternalLink } from 'lucide-react';

export default function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState('overview');

  const scrollTo = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      {/* Background glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-indigo-600/10 blur-[130px] rounded-full" />
        <div className="absolute top-2/3 right-10 w-[400px] h-[300px] bg-cyan-600/10 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 text-sm text-slate-400">
          <Link to="/" className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-slate-300">Privacy Policy</span>
        </div>

        {/* Hero Header */}
        <div className="border border-white/10 rounded-3xl bg-slate-900/60 backdrop-blur-xl p-8 sm:p-12 mb-10 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-gradient-to-br from-indigo-500/20 to-cyan-500/0 rounded-full blur-2xl" />
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-4 tracking-wide uppercase">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            Security & Compliance Framework
          </div>
          
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
            Privacy <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-teal-300">Policy</span>
          </h1>
          
          <p className="text-slate-400 text-base sm:text-lg max-w-3xl leading-relaxed mb-6">
            We value your personal trust and career data. This Privacy Policy details how InterviewAI safeguards your resumes, hardware permissions, evaluation scores, and authentication credentials using state-of-the-art encryption and privacy-by-design standards.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 pt-4 border-t border-white/5">
            <span className="px-2.5 py-1 rounded-md bg-white/5 text-slate-300">Effective Date: [October 07, 2026]</span>
            <span className="px-2.5 py-1 rounded-md bg-white/5 text-slate-300">Policy Version: 2.1 (GDPR & DPDP Aligned)</span>
            <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Verified Zero-Data-Selling
            </span>
          </div>
        </div>

        {/* 4 Privacy Pillars Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-indigo-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-sm mb-1">AES-256 Encryption</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Resumes and session records are protected with authenticated AES-256-GCM encryption at rest and TLS 1.3 in transit.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-cyan-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-3">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-sm mb-1">Private Hardware Feeds</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Camera & microphone feeds are processed client-side in your browser via WebRTC. Feeds are never recorded or monetized.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-teal-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 mb-3">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-sm mb-1">Strict Zero-Data Selling</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your resume, contact info, and interview responses are strictly isolated and never shared with third-party advertisers.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-amber-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-3">
              <CheckCircle className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-sm mb-1">Right to Erasure</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Full control over your data. Delete resumes or account history at any time with instantaneous irreversible disk unlinking.
            </p>
          </div>
        </div>

        {/* Content Layout with Sticky Table of Contents */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Table of Contents (Sidebar) */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 p-5 rounded-2xl bg-slate-900/40 border border-white/5 space-y-2 text-xs">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">Table of Contents</h4>
              {[
                { id: 'overview', title: '1. Overview & Scope' },
                { id: 'collection', title: '2. Information We Collect' },
                { id: 'hardware', title: '3. Hardware Permissions' },
                { id: 'ai-processing', title: '4. AI & Resume Analysis' },
                { id: 'security', title: '5. Security Protocols' },
                { id: 'retention', title: '6. Retention & Erasure' },
                { id: 'third-parties', title: '7. Third-Party Integrations' },
                { id: 'contact', title: '8. DPO & Contact' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className={`w-full text-left py-1.5 px-2.5 rounded-lg transition-all ${
                    activeSection === item.id
                      ? 'bg-indigo-600/20 text-indigo-300 font-semibold border-l-2 border-indigo-400'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  {item.title}
                </button>
              ))}
            </div>
          </div>

          {/* Legal Text Sections */}
          <div className="lg:col-span-3 space-y-10 text-sm leading-relaxed text-slate-300">
            
            {/* Section 1 */}
            <section id="overview" className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <h2 className="text-xl font-bold text-white mb-3">1. Overview & Data Controller</h2>
              <p className="mb-3">
                This Privacy Policy is issued by <span className="text-indigo-400 font-semibold">[InterviewAI Inc. / Operating Entity Name]</span> ("we", "us", or "our"), having its registered office at <span className="text-slate-400">[Company Address / Registered Office, City, State, Country]</span>.
              </p>
              <p className="mb-3">
                We operate the AI-driven mock interview and resume evaluation platform accessible at <span className="text-indigo-400">[https://interviewai.example.com]</span>. In our capacity as the Data Controller under applicable data protection regulations (including the EU General Data Protection Regulation (GDPR) and the Digital Personal Data Protection Act (DPDP)), we are committed to safeguarding candidate data integrity.
              </p>
              <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-300">
                <span className="font-semibold text-white">Customization Note:</span> This document contains configurable placeholders marked in brackets (e.g. <span className="font-mono text-cyan-300">[Company Name]</span>) that can be readily tailored to your company's formal corporate identity.
              </div>
            </section>

            {/* Section 2 */}
            <section id="collection" className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <h2 className="text-xl font-bold text-white mb-3">2. Information We Collect</h2>
              <p className="mb-3">We collect personal data strictly necessary to facilitate real-time AI mock interview sessions and resume parsing:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-400 ml-2">
                <li><strong className="text-slate-200">Account Credentials:</strong> Full name, verified email address, hashed passwords (via bcrypt with 12 salt rounds), and OAuth 2.0 identifiers from Google, LinkedIn, or GitHub.</li>
                <li><strong className="text-slate-200">Resume & Professional Content:</strong> Uploaded resume files (PDF, DOC, DOCX up to 5 MB), parsed educational history, work experience, technical skills, and project summaries.</li>
                <li><strong className="text-slate-200">Session Evaluation Records:</strong> Recorded spoken answer transcripts (converted client-side via Web Speech API), AI-generated scores (1-10 scale), and constructive behavioral feedback reports.</li>
                <li><strong className="text-slate-200">Billing & Credit Ledger:</strong> Subscription plan tier (1-Month ₹249, 3-Month ₹449, 1-Year ₹2500), allocated credit balances, and expiration timestamps. We do not store raw credit card numbers.</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section id="hardware" className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <h2 className="text-xl font-bold text-white mb-3">3. Hardware Access (Camera & Microphone Permissions)</h2>
              <p className="mb-3">
                During live mock interview sessions, our platform requests explicit browser permission to access your microphone and camera:
              </p>
              <div className="space-y-3 text-slate-400">
                <p>
                  <strong className="text-slate-200">Live Video Proctoring Feed:</strong> Video frames rendered via HTML5 WebRTC &lt;video&gt; elements remain on your local device. Feeds serve purely as candidate self-monitoring proctor mirrors. Video is not streamed to remote surveillance servers or stored permanently.
                </p>
                <p>
                  <strong className="text-slate-200">Microphone & Audio Processing:</strong> Candidate speech is transcribed using browser-native Web Speech recognition (`SpeechRecognition` / `webkitSpeechRecognition`) at $0 cost and zero cloud egress. Real-time microphone volume levels are computed locally via Web Audio API `AudioContext` without audio retention.
                </p>
                <p>
                  <strong className="text-slate-200">Audio-Only Graceful Fallback:</strong> If camera hardware is absent or blocked, our system automatically falls back to audio-only mode, guaranteeing uninterrupted practice sessions without blocking platform access.
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section id="ai-processing" className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <h2 className="text-xl font-bold text-white mb-3">4. Artificial Intelligence & Resume Parsing Logic</h2>
              <p className="mb-3">
                Our AI mock tests and ATS scoring engines generate objective evaluations. Here is how your data interacts with AI pipelines:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-400 ml-2">
                <li><strong className="text-slate-200">Zero Commercial Data Leakage:</strong> We strictly operate under privacy-preserving configurations. No candidate resume or interview transcript is ever utilized to train external public LLM foundation models.</li>
                <li><strong className="text-slate-200">Local Vector Embeddings:</strong> RAG retrieval and question synthesis operate locally via TF-IDF vector embeddings without sending candidate career history to third-party vector databases.</li>
                <li><strong className="text-slate-200">Deterministic Fallback:</strong> If external AI inference services are unavailable or rate-limited, answers are evaluated deterministically using open-source heuristic algorithms at zero external cost.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section id="security" className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <h2 className="text-xl font-bold text-white mb-3">5. Data Protection & Security Protocols</h2>
              <p className="mb-3">
                We implement robust defense-in-depth security measures to protect candidate records from unauthorized access, breach, or disclosure:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="font-semibold text-white block mb-1">Cryptographic Protection</span>
                  <span className="text-xs text-slate-400">AES-256-GCM authenticated encryption for sensitive payloads; SHA-256 for token hashing.</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="font-semibold text-white block mb-1">Input Sanitization</span>
                  <span className="text-xs text-slate-400">Strict filtering against NoSQL query operator injection ($gt, $ne) and Cross-Site Scripting (XSS).</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="font-semibold text-white block mb-1">Path Traversal Defense</span>
                  <span className="text-xs text-slate-400">Uploaded resume filenames are randomized with unique hashes; downloads verify strict base directory confinement.</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="font-semibold text-white block mb-1">Tiered Rate Limiting</span>
                  <span className="text-xs text-slate-400">Brute-force protection on authentication (50 req/15 min), resume parsing (30 req/15 min), and billing endpoints.</span>
                </div>
              </div>
            </section>

            {/* Section 6 */}
            <section id="retention" className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <h2 className="text-xl font-bold text-white mb-3">6. Data Retention, Portability & Right to Erasure</h2>
              <p className="mb-3">
                You maintain sovereign ownership of your data at all times:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-400 ml-2">
                <li><strong className="text-slate-200">Instant File Deletion:</strong> Clicking "Delete Resume" in the Resume Manager instantly purges the file record and executes an unrecoverable unlink of the physical file on disk.</li>
                <li><strong className="text-slate-200">Account Erasure:</strong> You may submit an erasure request at any time to permanently wipe your profile, interview transcripts, and performance analytics.</li>
                <li><strong className="text-slate-200">Retention Horizon:</strong> Inactive account data is routinely purged after 24 months of total inactivity unless required otherwise by financial record-keeping laws.</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section id="third-parties" className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <h2 className="text-xl font-bold text-white mb-3">7. Third-Party Service Providers</h2>
              <p className="mb-3">
                We partner only with reputable, privacy-compliant providers:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-400 ml-2">
                <li><strong className="text-slate-200">OAuth Identity Providers:</strong> Google Identity, LinkedIn Sign-In, and GitHub OAuth for streamlined single-sign-on without storing plaintext passwords.</li>
                <li><strong className="text-slate-200">Payment Processors:</strong> Pluggable payment gateways (e.g. Razorpay / Stripe) operating under PCI-DSS Level 1 compliance for INR subscription processing.</li>
              </ul>
            </section>

            {/* Section 8 */}
            <section id="contact" className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <h2 className="text-xl font-bold text-white mb-3">8. Data Protection Officer (DPO) & Contact Inquiries</h2>
              <p className="mb-4">
                If you have questions regarding this Privacy Policy, your data rights, or our security protocols, please contact our Data Protection Officer:
              </p>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-white/10 space-y-1 text-xs">
                <p className="font-semibold text-white">Data Protection Office</p>
                <p className="text-slate-400">Attention: <span className="text-indigo-400">[Data Protection Officer Name / Legal Counsel]</span></p>
                <p className="text-slate-400">Email: <span className="text-indigo-400">[privacy@interviewai.example.com / support@company.com]</span></p>
                <p className="text-slate-400">Physical Address: <span className="text-slate-300">[Legal Headquarters Address, City, Country]</span></p>
              </div>
            </section>

          </div>
        </div>

        {/* Footer Navigation Back */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© 2026 InterviewAI Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/terms" className="text-indigo-400 hover:text-indigo-300 transition-colors">Terms of Service</Link>
            <Link to="/pricing" className="hover:text-slate-200 transition-colors">Pricing & Plans</Link>
            <Link to="/dashboard" className="hover:text-slate-200 transition-colors">Candidate Workspace</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
