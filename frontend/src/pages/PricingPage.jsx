import React, { useState } from 'react';
import { 
  Zap, 
  CheckCircle2, 
  CreditCard, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle, 
  Clock, 
  Calendar,
  Lock,
  ArrowRight,
  Info
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';

export default function PricingPage() {
  const { user, fetchMe } = useAuthStore();
  const [selectedPlan, setSelectedPlan] = useState('3-months');
  const [processing, setProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const plans = [
    {
      id: 'free',
      name: 'Free Trial Demo',
      badge: 'Live Platform Demo',
      price: '₹0',
      period: 'signup',
      credits: '2 Free Credits',
      creditsSummary: '2 Demo Credits',
      validity: 'Valid for 1 month demo cycle; unused credits expire.',
      features: [
        '2 Free credits on first successful email registration',
        'Strictly limited to 1 claim per unique email address',
        'Bound to strict 30-day demo validity cycle',
        'Role-specific AI Mock Test generation',
        'Resume ATS Compatibility Score & Suggestions',
        'Live Quiz Arena Competitions & Leaderboards',
      ],
      current: user?.plan === 'free' || !user?.plan,
    },
    {
      id: '1-month',
      name: '1 Month Plan',
      badge: 'Monthly Sprint',
      price: '₹249',
      period: '1 month',
      credits: '10 Credits',
      creditsSummary: '10 Credits Allocated',
      validity: 'Valid for 1 month; unused credits expire.',
      features: [
        '10 Credits allocated immediately upon purchase',
        'Valid for 1 month (30 days cycle)',
        'Strict monthly validity: unused credits expire at period end',
        'Credits do not roll over indefinitely',
        'Resume ATS Score & Role-Based Suggestions',
        'Resume AI Questioning & Project Deep-Dive',
        'Real-Time Socket.io AI streaming feedback',
      ],
      current: user?.plan === '1-month',
    },
    {
      id: '3-months',
      name: '3 Months Plan',
      badge: 'Most Popular / Best Value',
      popular: true,
      price: '₹449',
      period: '3 months',
      credits: '30 Credits',
      creditsSummary: '30 Credits (10 / Month)',
      validity: 'Distributed over 3 months; monthly limits/validity rules apply.',
      features: [
        '30 Total Credits distributed over 3 months (10 credits/month)',
        '₹449 full 3-month upfront payment (save ₹298 vs monthly)',
        'Monthly limits & validity rules apply (unused expire monthly)',
        'Strict no-rollover policy between monthly cycles',
        'Full AI Mock Tests & Interactive Competitions',
        'Deep Project Interrogation Chamber',
        'Priority Groq LLaMA 3.3 70B AI inference',
      ],
      current: user?.plan === '3-months',
    },
    {
      id: '1-year',
      name: '1 Year Plan',
      badge: 'Direct Access / VIP',
      price: '₹2500',
      period: '1 year',
      credits: 'Direct Access / Annual Pool',
      creditsSummary: 'Annual Access Pool',
      validity: 'Full upfront annual payment for continuous platform access.',
      features: [
        'Direct Access / Annual Pool (120+ sessions pool)',
        '₹2500 full upfront annual payment',
        '365 Days continuous, uninterrupted platform access',
        'No monthly expiration interruptions during the year',
        'Fastest priority queue execution for all AI features',
        'Unlimited Resume ATS Scorings & Target Role Edits',
        'Executive & Staff Calibration Deep Dives',
      ],
      current: user?.plan === '1-year',
    },
  ];

  const handleSelectPlan = async (planId) => {
    if (planId === 'free') return;
    setProcessing(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await api.post('/billing/test-upgrade', {
        planName: planId,
        billingCycle: planId === '1-year' ? 'annual' : planId === '3-months' ? 'quarterly' : 'monthly',
      });

      setSuccessMsg(`Payment Successful! Upgraded to ${res.data.data?.plan?.displayName || planId} (${res.data.data?.user?.credits} Credits Available).`);
      await fetchMe();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Upgrade failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const formatExpiry = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <Zap className="w-3.5 h-3.5 text-[#06B6D4]" />
          <span>Transparent INR Pricing & Credit System</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-[#F8FAFC] tracking-tight font-heading">
          Supercharge Your Preparation with Interview Credits
        </h1>
        <p className="text-[#94A3B8] text-xs sm:text-sm leading-relaxed">
          Start with our free platform trial demo, or choose an affordable subscription plan tailored for your interview preparation journey.
        </p>

        {/* Current user balance banner */}
        {user && (
          <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-3 px-5 py-3 rounded-2xl bg-[#1E293B] border border-[#334155] text-xs text-slate-300 shadow-lg">
            <span className="text-[#94A3B8]">Current Balance:</span>
            <span className="font-bold text-[#6366F1] flex items-center gap-1 font-mono text-sm bg-indigo-500/10 px-2.5 py-0.5 rounded-lg border border-indigo-500/30">
              <Zap className="w-3.5 h-3.5 fill-[#6366F1] text-[#6366F1]" /> {user.credits ?? 0} Credits
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-indigo-400 capitalize font-semibold">
              {user.plan === '1-month' ? '1 Month Plan' : user.plan === '3-months' ? '3 Months Plan' : user.plan === '1-year' ? '1 Year Plan' : 'Free Starter'}
            </span>
            {user.creditsExpiresAt && (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-[#94A3B8] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#06B6D4]" />
                  Cycle Expiry: <strong className="text-[#06B6D4] font-mono">{formatExpiry(user.creditsExpiresAt)}</strong>
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="max-w-xl mx-auto p-4 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-[#10B981] text-xs text-center flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40">
          <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="max-w-xl mx-auto p-4 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-300 text-xs text-center flex items-center justify-center gap-2 shadow-lg shadow-rose-950/40">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Policy Highlights Banner Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
        
        {/* Free Trial & Signup Policy */}
        <div className="p-5 rounded-2xl bg-[#1E293B] border border-[#334155] flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[#6366F1] shrink-0">
            <Sparkles className="w-5 h-5 text-[#6366F1]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-1.5 font-heading">
              <span>New User Free Trial & Signup Policy</span>
            </h2>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              <strong className="text-[#6366F1]">Free Credits:</strong> Every new user receives <strong className="text-[#F8FAFC]">2 free credits</strong> upon their first successful email sign-in/registration for a live platform demo.
            </p>
            <p className="text-xs text-[#94A3B8] flex items-center gap-1 pt-1">
              <Lock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span><strong>Restriction:</strong> Strictly limited to 1 registration/credit claim per unique email address to prevent abuse.</span>
            </p>
          </div>
        </div>

        {/* Credit Expiration & Usage Rules */}
        <div className="p-5 rounded-2xl bg-[#1E293B] border border-[#334155] flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-[#06B6D4] shrink-0">
            <Clock className="w-5 h-5 text-[#06B6D4]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-1.5 font-heading">
              <span>Credit Expiration & Usage Rules</span>
            </h2>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              <strong className="text-[#06B6D4]">Monthly Validity:</strong> Credits are bound to a strict monthly cycle. Whether used or unused, credits expire at the end of their respective billing/validity period and do not roll over indefinitely.
            </p>
            <p className="text-xs text-[#94A3B8] flex items-center gap-1 pt-1">
              <Info className="w-3.5 h-3.5 text-[#06B6D4] shrink-0" />
              <span>Unused credits do not accumulate across billing cycles.</span>
            </p>
          </div>
        </div>

      </div>

      {/* Subscription Pricing Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`card-saas rounded-2xl p-6 flex flex-col justify-between transition-all relative bg-[#1E293B] ${
              plan.popular 
                ? 'border-[#6366F1] shadow-xl shadow-indigo-500/15 ring-1 ring-[#6366F1]/50' 
                : plan.id === '1-year'
                ? 'border-[#06B6D4]/60 shadow-xl shadow-cyan-500/10'
                : 'border-[#334155] hover:border-slate-500'
            }`}
          >
            {/* Badge */}
            <div className={`inline-block w-fit text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-3 ${
              plan.popular 
                ? 'bg-gradient-to-r from-[#6366F1] to-[#06B6D4] text-white shadow-md shadow-indigo-500/30'
                : plan.id === '1-year'
                ? 'bg-cyan-500/10 text-[#06B6D4] border border-[#06B6D4]/30'
                : 'bg-[#0F172A] text-[#94A3B8] border border-[#334155]'
            }`}>
              {plan.badge}
            </div>

            <div>
              <h3 className="font-extrabold text-[#F8FAFC] text-lg font-heading">{plan.name}</h3>
              
              {/* Pricing in INR */}
              <div className="flex items-baseline gap-1 my-3">
                <span className="text-3xl sm:text-4xl font-black text-[#F8FAFC] font-heading">{plan.price}</span>
                <span className="text-xs text-[#94A3B8] font-medium">/{plan.period}</span>
              </div>

              {/* Credits & Validity summary */}
              <div className="p-3 rounded-xl bg-[#0F172A] border border-[#334155] space-y-1.5 mb-5">
                <div className="text-xs font-bold text-[#6366F1] flex items-center gap-1.5 font-mono">
                  <Zap className="w-3.5 h-3.5 fill-[#6366F1]/20 text-[#6366F1] shrink-0" />
                  <span>{plan.credits}</span>
                </div>
                <div className="text-[11px] text-[#94A3B8] flex items-start gap-1 leading-snug">
                  <Calendar className="w-3 h-3 text-[#06B6D4] shrink-0 mt-0.5" />
                  <span>{plan.validity}</span>
                </div>
              </div>

              {/* Feature list */}
              <ul className="space-y-2.5 text-xs text-[#94A3B8] border-t border-[#334155] pt-4 mb-6">
                {plan.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
                    <span className="leading-tight text-slate-300">{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Button */}
            <button
              onClick={() => handleSelectPlan(plan.id)}
              disabled={plan.current || processing}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                plan.current
                  ? 'bg-[#0F172A] text-slate-400 cursor-default border border-[#334155]'
                  : plan.popular
                  ? 'btn-primary-gradient text-white shadow-lg shadow-indigo-600/30'
                  : plan.id === '1-year'
                  ? 'bg-[#06B6D4] hover:bg-[#0891B2] text-[#090D16] font-extrabold shadow-lg shadow-cyan-600/20'
                  : 'bg-[#0F172A] hover:bg-[#334155] text-[#F8FAFC] border border-[#334155]'
              }`}
            >
              {plan.current ? (
                <span>Active Plan</span>
              ) : processing ? (
                <span>Processing...</span>
              ) : (
                <>
                  <span>Select {plan.name}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Official Plan Structure Summary Table */}
      <div className="card-saas rounded-2xl p-6 border-[#334155] bg-[#1E293B] max-w-5xl mx-auto space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-bold text-[#F8FAFC] font-heading">Subscription Pricing Plans Summary</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead>
              <tr className="border-b border-[#334155] text-[#94A3B8] uppercase font-mono text-[11px] bg-[#0F172A]/50">
                <th className="py-3 px-4">Plan Duration</th>
                <th className="py-3 px-4">Credits Allocated</th>
                <th className="py-3 px-4">Pricing (INR)</th>
                <th className="py-3 px-4">Validity & Rules</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#334155] font-medium">
              <tr className="hover:bg-[#0F172A]/40">
                <td className="py-3.5 px-4 font-bold text-[#F8FAFC]">Free Trial Demo</td>
                <td className="py-3.5 px-4 text-[#6366F1] font-mono font-bold">2 Free Credits</td>
                <td className="py-3.5 px-4 text-[#10B981] font-bold">₹0</td>
                <td className="py-3.5 px-4 text-[#94A3B8]">Strictly 1 registration/claim per unique email address; 30-day demo cycle.</td>
              </tr>
              <tr className="hover:bg-[#0F172A]/40">
                <td className="py-3.5 px-4 font-bold text-[#F8FAFC]">1 Month Plan</td>
                <td className="py-3.5 px-4 text-[#6366F1] font-mono font-bold">10 Credits</td>
                <td className="py-3.5 px-4 text-[#F8FAFC] font-bold">₹249</td>
                <td className="py-3.5 px-4 text-[#94A3B8]">Valid for 1 month; unused credits expire at cycle end.</td>
              </tr>
              <tr className="hover:bg-[#0F172A]/40 bg-indigo-950/20">
                <td className="py-3.5 px-4 font-bold text-indigo-300">3 Months Plan</td>
                <td className="py-3.5 px-4 text-[#6366F1] font-mono font-bold">30 Credits</td>
                <td className="py-3.5 px-4 text-indigo-300 font-bold">₹449</td>
                <td className="py-3.5 px-4 text-[#94A3B8]">Distributed over 3 months (10 credits/month); monthly limits/validity rules apply.</td>
              </tr>
              <tr className="hover:bg-[#0F172A]/40">
                <td className="py-3.5 px-4 font-bold text-[#06B6D4]">1 Year Plan</td>
                <td className="py-3.5 px-4 text-[#06B6D4] font-mono font-bold">Direct Access / Annual Pool</td>
                <td className="py-3.5 px-4 text-[#06B6D4] font-bold">₹2500</td>
                <td className="py-3.5 px-4 text-[#94A3B8]">Full upfront annual payment for continuous platform access (365 days).</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Security & Zero-Risk Guarantee */}
      <div className="card-saas rounded-2xl p-6 border-[#334155] bg-[#1E293B] max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-[#06B6D4] shrink-0" />
          <div className="text-xs text-[#94A3B8]">
            <strong className="block text-[#F8FAFC] font-semibold">Secure Payment Gateway & Test Mode Active</strong>
            Instant credit provisioning upon payment confirmation. All transactions in INR currency.
          </div>
        </div>
        <div className="text-xs font-mono text-indigo-400 bg-indigo-950/60 px-3 py-1.5 rounded-lg border border-indigo-500/30 shrink-0">
          INR Gateway Connected
        </div>
      </div>

    </div>
  );
}
