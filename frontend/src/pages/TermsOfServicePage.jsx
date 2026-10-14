import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileCheck, Shield, AlertTriangle, ArrowLeft, Scale, Award, DollarSign, CheckCircle, Cpu, HelpCircle } from 'lucide-react';

export default function TermsOfServicePage() {
  const [activeSection, setActiveSection] = useState('acceptance');

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
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-cyan-600/10 blur-[130px] rounded-full" />
        <div className="absolute top-2/3 left-10 w-[400px] h-[300px] bg-indigo-600/10 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 text-sm text-slate-400">
          <Link to="/" className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-slate-300">Terms of Service</span>
        </div>

        {/* Hero Header */}
        <div className="border border-white/10 rounded-3xl bg-slate-900/60 backdrop-blur-xl p-8 sm:p-12 mb-10 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-gradient-to-br from-cyan-500/20 to-indigo-500/0 rounded-full blur-2xl" />
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold mb-4 tracking-wide uppercase">
            <Scale className="w-3.5 h-3.5 text-cyan-400" />
            Legal Agreement & User Obligations
          </div>
          
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
            Terms of <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400">Service</span>
          </h1>
          
          <p className="text-slate-400 text-base sm:text-lg max-w-3xl leading-relaxed mb-6">
            Please read these Terms of Service carefully before utilizing InterviewAI. They govern your access to AI-powered mock interviews, coding environments, ATS resume evaluations, credit transactions, and interactive testing features.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 pt-4 border-t border-white/5">
            <span className="px-2.5 py-1 rounded-md bg-white/5 text-slate-300">Effective Date: [October 07, 2026]</span>
            <span className="px-2.5 py-1 rounded-md bg-white/5 text-slate-300">Binding Contract: Candidate & Platform</span>
            <span className="px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span> Standard Consumer Terms
            </span>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-cyan-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-3">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-sm mb-1">Career Prep Purpose</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Designed solely for educational interview simulations, coding practice, and resume optimization.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-indigo-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-3">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-sm mb-1">Clear Credit Rules</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              2 free trial credits per unique user; subscriptions operate with strict monthly validity and non-rollover cycles.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-purple-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-3">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-sm mb-1">100% Resume IP Rights</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              You retain full ownership and copyright of your uploaded resumes, code submissions, and projects.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-amber-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-sm mb-1">Advisory Simulation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              AI feedback and scores are automated mock estimates and do not constitute formal hiring or employment guarantees.
            </p>
          </div>
        </div>

        {/* Content Layout with Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Table of Contents */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 p-5 rounded-2xl bg-slate-900/40 border border-white/5 space-y-2 text-xs">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">Table of Contents</h4>
              {[
                { id: 'acceptance', title: '1. Acceptance & Age' },
                { id: 'accounts', title: '2. User Accounts' },
                { id: 'credits', title: '3. Credits & Pricing' },
                { id: 'simulation', title: '4. AI Simulation Scope' },
                { id: 'content', title: '5. Intellectual Property' },
                { id: 'conduct', title: '6. Prohibited Activities' },
                { id: 'liability', title: '7. Limitation of Liability' },
                { id: 'disputes', title: '8. Governing Law' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className={`w-full text-left py-1.5 px-2.5 rounded-lg transition-all ${
                    activeSection === item.id
                      ? 'bg-cyan-600/20 text-cyan-300 font-semibold border-l-2 border-cyan-400'
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
            <section id="acceptance" className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <h2 className="text-xl font-bold text-white mb-3">1. Acceptance of Terms & Eligibility</h2>
              <p className="mb-3">
                By registering an account, accessing, or using the InterviewAI website and platform, you enter into a legally binding contract with <span className="text-cyan-400 font-semibold">[InterviewAI Inc. / Operating Entity Name]</span> ("Company", "we", "us"). If you do not agree to these Terms, you must immediately discontinue use of the platform.
              </p>
              <p className="mb-3">
                <strong className="text-slate-200">Age Requirement:</strong> You represent and warrant that you are at least <span className="text-cyan-300 font-semibold">[16/18]</span> years of age, or have attained the age of legal majority in your jurisdiction.
              </p>
              <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-cyan-300">
                <span className="font-semibold text-white">Customization Note:</span> Bracketed terms (e.g. <span className="font-mono text-indigo-300">[Company Legal Entity]</span>, <span className="font-mono text-indigo-300">[Jurisdiction]</span>) are placeholders ready for your custom corporate identity.
              </div>
            </section>

            {/* Section 2 */}
            <section id="accounts" className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <h2 className="text-xl font-bold text-white mb-3">2. User Accounts & Security Responsibilities</h2>
              <p className="mb-3">
                To access mock interviews and resume parsing, you must create an account either via direct email registration or verified third-party OAuth 2.0 single sign-on (Google, LinkedIn, or GitHub):
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-400 ml-2">
                <li><strong className="text-slate-200">Credential Confidentiality:</strong> You are solely responsible for maintaining the confidentiality of your login credentials and preventing unauthorized access to your account.</li>
                <li><strong className="text-slate-200">Accurate Information:</strong> You agree to provide true, accurate, and current information when configuring interview parameters, job targets, and resume profiles.</li>
                <li><strong className="text-slate-200">Account Non-Transferability:</strong> Accounts and allocated credits are strictly non-transferable and may not be resold or shared between multiple individuals.</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section id="credits" className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <h2 className="text-xl font-bold text-white mb-3">3. Credit System, Subscriptions & Billing Terms</h2>
              <p className="mb-3">
                Platform usage is governed by our transparent credit ledger and subscription billing structure:
              </p>
              <div className="space-y-3 text-slate-400">
                <p>
                  <strong className="text-slate-200">New User Free Trial Policy:</strong> Each new user receives 2 free credits upon their first successful email registration. Free credit claims are strictly limited to one claim per unique email address to prevent service abuse.
                </p>
                <p>
                  <strong className="text-slate-200">Credit Expiration Rules:</strong> Credits are bound to strict monthly billing cycles. Unused credits expire at the end of their respective monthly validity period and do not roll over indefinitely.
                </p>
                <p>
                  <strong className="text-slate-200">Published Subscription Tiers:</strong>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-2 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <span className="text-white font-bold block">1-Month Plan</span>
                    <span className="text-cyan-400">₹249 INR</span>
                    <span className="text-slate-400 block text-[11px] mt-1">10 credits / 30-day validity</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <span className="text-white font-bold block">3-Months Plan</span>
                    <span className="text-indigo-400">₹449 INR</span>
                    <span className="text-slate-400 block text-[11px] mt-1">30 credits across 3 months</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <span className="text-white font-bold block">1-Year Plan</span>
                    <span className="text-purple-400">₹2500 INR</span>
                    <span className="text-slate-400 block text-[11px] mt-1">Direct annual access pool</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  <strong className="text-slate-300">Payment Processing:</strong> Transactions are routed securely via authorized payment gateways (e.g., Razorpay / Stripe). All fees are non-refundable once digital simulation credits are deployed.
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section id="simulation" className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <h2 className="text-xl font-bold text-white mb-3">4. AI Simulation Scope & Advisory Disclaimers</h2>
              <p className="mb-3">
                InterviewAI utilizes advanced generative AI, natural language parsing, and vector RAG technology:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-400 ml-2">
                <li><strong className="text-slate-200">Educational Simulation Only:</strong> Mock interviews, coding evaluations, and ATS scores are algorithmic estimates designed solely for candidate career preparation.</li>
                <li><strong className="text-slate-200">No Employment Guarantee:</strong> Achieving high scores on our platform does not guarantee job placement, hiring offers, or interview advancement with any employer.</li>
                <li><strong className="text-slate-200">Objective Scoring Heuristics:</strong> While our deterministic and AI evaluation models strive for accuracy, automated evaluation of natural human language may occasionally produce differing scores.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section id="content" className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <h2 className="text-xl font-bold text-white mb-3">5. Intellectual Property & Candidate Ownership</h2>
              <p className="mb-3">
                Ownership boundaries between your submissions and our platform are strictly defined:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-400 ml-2">
                <li><strong className="text-slate-200">Candidate Content Ownership:</strong> You retain complete, unrestricted copyright and intellectual property rights in all resumes, code solutions, and personal project descriptions you upload or write.</li>
                <li><strong className="text-slate-200">Platform Rights:</strong> InterviewAI retains all intellectual property, proprietary software code, prompt engineering designs, UI assets, and architecture relating to the mock interview simulation service.</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section id="conduct" className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <h2 className="text-xl font-bold text-white mb-3">6. Acceptable Use Policy & Prohibited Conduct</h2>
              <p className="mb-3">You agree not to engage in any of the following prohibited activities:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-400 ml-2">
                <li>Reverse engineering, decompiling, or attempting to extract the underlying source code of the platform.</li>
                <li>Conducting automated scraping, crawling, or systematic extraction of questions, prompts, or scoring algorithms.</li>
                <li>Attempting prompt injection, jailbreaking, or deploying malicious payloads to subvert AI safety instructions.</li>
                <li>Uploading corrupted files, malware, or exploiting path traversal vulnerabilities.</li>
                <li>Creating multiple automated accounts to fraudulently farm the 2-credit free trial allowance.</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section id="liability" className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <h2 className="text-xl font-bold text-white mb-3">7. Disclaimers of Warranties & Limitation of Liability</h2>
              <p className="mb-3 text-slate-400">
                THE PLATFORM IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE MAXIMUM EXTENT PERMITTED BY LAW, INTERVIEWAI DISCLAIMS ALL WARRANTIES, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
              <p className="text-slate-400">
                IN NO EVENT SHALL INTERVIEWAI BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING OUT OF YOUR USE OF THE PLATFORM. OUR TOTAL AGGREGATE LIABILITY SHALL NOT EXCEED THE TOTAL AMOUNT PAID BY YOU TO THE PLATFORM IN THE PRECEDING THREE (3) MONTHS.
              </p>
            </section>

            {/* Section 8 */}
            <section id="disputes" className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <h2 className="text-xl font-bold text-white mb-3">8. Governing Law, Dispute Resolution & Contact</h2>
              <p className="mb-3">
                These Terms shall be governed by and construed in accordance with the laws of <span className="text-cyan-400 font-semibold">[Jurisdiction / State, Country, e.g., India / United States]</span>, without regard to its conflict of law principles. Any dispute arising hereunder shall be subject to the exclusive jurisdiction of the competent courts in <span className="text-cyan-400 font-semibold">[City / Jurisdiction, e.g., New Delhi, India]</span>.
              </p>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-white/10 space-y-1 text-xs">
                <p className="font-semibold text-white">Legal & Compliance Department</p>
                <p className="text-slate-400">Email: <span className="text-cyan-400">[legal@interviewai.example.com / support@company.com]</span></p>
                <p className="text-slate-400">Entity: <span className="text-slate-300">[InterviewAI Technologies Pvt. Ltd. / Corporate Name]</span></p>
              </div>
            </section>

          </div>
        </div>

        {/* Footer Navigation Back */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© 2026 InterviewAI Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="text-cyan-400 hover:text-cyan-300 transition-colors">Privacy Policy</Link>
            <Link to="/pricing" className="hover:text-slate-200 transition-colors">Pricing & Plans</Link>
            <Link to="/dashboard" className="hover:text-slate-200 transition-colors">Candidate Workspace</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
