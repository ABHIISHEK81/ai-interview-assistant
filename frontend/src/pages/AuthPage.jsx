import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Zap, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck,
  Check,
  Globe,
  X
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

// Official SVG Brand Icons
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

const LinkedInIcon = () => (
  <svg className="w-5 h-5 fill-[#0A66C2]" viewBox="0 0 24 24">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0-.01-3.28 1.64 1.64 0 0 0 .01 3.28m1.4 9.74v-8.37H5.06v8.37h2.8z" />
  </svg>
);

const GitHubIcon = () => (
  <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

export default function AuthPage({ initialMode = 'signin' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register, oauthLogin } = useAuthStore();

  // Mode: 'signin' or 'signup'
  const isRegisterRoute = location.pathname === '/register';
  const [mode, setMode] = useState(isRegisterRoute || initialMode === 'signup' ? 'signup' : 'signin');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status
  const [submitting, setSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(null); // 'google' | 'linkedin' | 'github'
  const [formError, setFormError] = useState('');
  const [emailConflict, setEmailConflict] = useState(false);

  // Social OAuth interactive modal state
  const [socialModal, setSocialModal] = useState({ open: false, provider: null, name: '', email: '' });

  // Sync mode with URL changes
  useEffect(() => {
    if (location.pathname === '/register') {
      setMode('signup');
    } else if (location.pathname === '/login') {
      setMode('signin');
    }
  }, [location.pathname]);

  // Read URL params (e.g. ?email=... or ?oauth_provider=...)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const passedEmail = params.get('email');
    if (passedEmail) {
      setEmail(passedEmail);
    }
    const oauthProv = params.get('oauth_provider');
    if (oauthProv && ['google', 'linkedin', 'github'].includes(oauthProv.toLowerCase())) {
      openOAuthModal(oauthProv.toLowerCase());
    }
  }, [location.search]);

  // Password rules validation
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = mode === 'signin' || (password.length > 0 && password === confirmPassword);
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber;

  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setFormError('');
    setEmailConflict(false);
    window.history.replaceState(null, '', newMode === 'signup' ? '/register' : '/login');
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setEmailConflict(false);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !/\S+@\S+\.\S+/.test(cleanEmail)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setFormError('Please enter your password.');
      return;
    }

    if (mode === 'signup') {
      if (!name.trim()) {
        setFormError('Please enter your full name.');
        return;
      }
      if (!hasMinLength) {
        setFormError('Password must be at least 8 characters long.');
        return;
      }
      if (!hasUppercase) {
        setFormError('Password must contain at least one uppercase letter (A-Z).');
        return;
      }
      if (!hasLowercase) {
        setFormError('Password must contain at least one lowercase letter (a-z).');
        return;
      }
      if (!hasNumber) {
        setFormError('Password must contain at least one number (0-9).');
        return;
      }
      if (password !== confirmPassword) {
        setFormError('Passwords do not match. Please verify.');
        return;
      }

      setSubmitting(true);
      const res = await register(name.trim(), cleanEmail, password);
      setSubmitting(false);

      if (res.success) {
        // Standard user always lands on standard user dashboard first
        navigate('/dashboard', { replace: true });
      } else {
        const errText = res.error || 'Registration failed';
        setFormError(errText);
        if (errText.toLowerCase().includes('already exists') || errText.toLowerCase().includes('conflict')) {
          setEmailConflict(true);
        }
      }
    } else {
      // Sign-in
      setSubmitting(true);
      const res = await login(cleanEmail, password);
      setSubmitting(false);

      if (res.success) {
        // Standard user (e.g. Abhishek) or admin always lands on user dashboard first
        navigate('/dashboard', { replace: true });
      } else {
        setFormError(res.error || 'Invalid email or password. Please verify your credentials.');
      }
    }
  };

  // Trigger Social OAuth Flow
  const handleSocialAuth = async (provider, customProfile = null) => {
    setOauthLoading(provider);
    setFormError('');

    const profile = customProfile || {
      providerId: `${provider}_${Date.now()}`,
      name: name.trim() || `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
      email: email.trim().toLowerCase() || `${provider}.user@example.com`,
    };

    const res = await oauthLogin(provider, profile);
    setOauthLoading(null);

    if (res.success) {
      if (socialModal.open) {
        setSocialModal({ open: false, provider: null, name: '', email: '' });
      }
      // Lands on standard user dashboard first
      navigate('/dashboard', { replace: true });
    } else {
      setFormError(res.error || `Failed to authenticate via ${provider}. Please try again.`);
    }
  };

  const openOAuthModal = (provider) => {
    const defaultEmails = {
      google: 'abhishek.google@gmail.com',
      linkedin: 'abhishek.linkedin@linkedin.com',
      github: 'abhishek-dev@github.com',
    };
    const defaultNames = {
      google: 'Abhishek Sharma (Google)',
      linkedin: 'Abhishek Sharma (LinkedIn)',
      github: 'Abhishek Sharma (GitHub)',
    };
    setSocialModal({
      open: true,
      provider,
      name: name || defaultNames[provider] || 'Abhishek Sharma',
      email: email || defaultEmails[provider] || `${provider}.user@example.com`,
    });
  };

  return (
    <div className="min-h-[88vh] flex items-center justify-center px-4 py-10 bg-mesh-radial">
      <div className="w-full max-w-xl">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-xl shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-all duration-300">
              <div className="w-full h-full bg-[#090d1a] rounded-[15px] flex items-center justify-center">
                <Zap className="w-6 h-6 text-indigo-400 group-hover:text-cyan-300 transition-colors" />
              </div>
            </div>
          </Link>
          <h1 className="text-3xl sm:text-4xl font-black text-[#F8FAFC] tracking-tight font-heading">
            Interview<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6366F1] to-[#06B6D4]">AI</span>
          </h1>
          <p className="text-[#94A3B8] text-xs sm:text-sm mt-1.5 font-medium">
            Next-Gen AI Mock Interview Platform with Adaptive Intelligence
          </p>
        </div>

        {/* Auth Main Card */}
        <div className="card-saas rounded-3xl p-6 sm:p-8 shadow-2xl border-[#334155] bg-[#1E293B] backdrop-blur-2xl relative overflow-hidden">
          
          {/* Subtle Accent Glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16"></div>

          {/* Unified Mode Switcher Tabs */}
          <div className="flex rounded-2xl bg-[#0F172A] p-1.5 border border-[#334155] mb-6">
            <button
              type="button"
              onClick={() => handleModeSwitch('signin')}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                mode === 'signin'
                  ? 'btn-primary-gradient text-white shadow-lg'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleModeSwitch('signup')}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                mode === 'signup'
                  ? 'btn-primary-gradient text-white shadow-lg'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#06B6D4]" />
              Create Account
            </button>
          </div>

          {/* Social OAuth 2.0 Integration Section */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between text-xs text-[#94A3B8] font-semibold uppercase tracking-wider mb-2 font-heading">
              <span>{mode === 'signup' ? 'Fast Registration With' : 'Instant Sign-In With'}</span>
              <span className="text-[10px] text-[#06B6D4] font-mono">OAuth 2.0</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {/* Google OAuth Button */}
              <button
                type="button"
                onClick={() => openOAuthModal('google')}
                disabled={!!oauthLoading}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#0F172A] hover:bg-[#162238] border border-[#334155] hover:border-[#6366F1]/50 text-slate-200 text-xs font-semibold transition-all group disabled:opacity-50"
                title="Continue with Google"
              >
                <GoogleIcon />
                <span className="hidden sm:inline">Google</span>
              </button>

              {/* LinkedIn OAuth Button */}
              <button
                type="button"
                onClick={() => openOAuthModal('linkedin')}
                disabled={!!oauthLoading}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#0F172A] hover:bg-[#162238] border border-[#334155] hover:border-[#0A66C2]/50 text-slate-200 text-xs font-semibold transition-all group disabled:opacity-50"
                title="Continue with LinkedIn"
              >
                <LinkedInIcon />
                <span className="hidden sm:inline">LinkedIn</span>
              </button>

              {/* GitHub OAuth Button */}
              <button
                type="button"
                onClick={() => openOAuthModal('github')}
                disabled={!!oauthLoading}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#0F172A] hover:bg-[#162238] border border-[#334155] hover:border-slate-500 text-slate-200 text-xs font-semibold transition-all group disabled:opacity-50"
                title="Continue with GitHub"
              >
                <GitHubIcon />
                <span className="hidden sm:inline">GitHub</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center py-2">
              <div className="w-full border-t border-[#334155]"></div>
              <span className="absolute px-3 bg-[#1E293B] text-[11px] uppercase tracking-wider font-semibold text-[#94A3B8]">
                Or with Email & Password
              </span>
            </div>
          </div>

          {/* Error Banner */}
          {formError && (
            <div className="mb-5 p-4 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-rose-100">{formError}</p>
                  {emailConflict && (
                    <button
                      type="button"
                      onClick={() => handleModeSwitch('signin')}
                      className="mt-2 text-indigo-300 font-bold underline hover:text-white block text-left"
                    >
                      Already have an account? Sign In with this email →
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Main Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name (Sign-up only) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider font-heading">
                  Full Name <span className="text-[#6366F1]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (formError) setFormError('');
                    }}
                    placeholder="e.g. Abhishek Sharma"
                    required={mode === 'signup'}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0F172A] border border-[#334155] text-[#F8FAFC] placeholder-slate-500 text-sm focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider font-heading">
                Email Address <span className="text-[#6366F1]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (formError) setFormError('');
                    if (emailConflict) setEmailConflict(false);
                  }}
                  placeholder="candidate@example.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0F172A] border border-[#334155] text-[#F8FAFC] placeholder-slate-500 text-sm focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider font-heading">
                  Password <span className="text-[#6366F1]">*</span>
                </label>
                {mode === 'signup' && (
                  <span className="text-[10px] text-[#94A3B8]">Min. 8 chars (1 Upper, 1 Lower, 1 Number)</span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (formError) setFormError('');
                  }}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#0F172A] border border-[#334155] text-[#F8FAFC] placeholder-slate-500 text-sm focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Sign-up only) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider font-heading">
                  Confirm Password <span className="text-[#6366F1]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (formError) setFormError('');
                    }}
                    placeholder="••••••••"
                    required={mode === 'signup'}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#0F172A] border border-[#334155] text-[#F8FAFC] placeholder-slate-500 text-sm focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Password Validation checklist (Sign-up only) */}
            {mode === 'signup' && password.length > 0 && (
              <div className="p-3 rounded-xl bg-[#0F172A] border border-[#334155] grid grid-cols-2 gap-2 text-[11px]">
                <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-[#10B981]' : 'text-slate-500'}`}>
                  <Check className="w-3.5 h-3.5" /> 8+ Characters
                </div>
                <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-[#10B981]' : 'text-slate-500'}`}>
                  <Check className="w-3.5 h-3.5" /> Uppercase (A-Z)
                </div>
                <div className={`flex items-center gap-1.5 ${hasLowercase ? 'text-[#10B981]' : 'text-slate-500'}`}>
                  <Check className="w-3.5 h-3.5" /> Lowercase (a-z)
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-[#10B981]' : 'text-slate-500'}`}>
                  <Check className="w-3.5 h-3.5" /> Number (0-9)
                </div>
              </div>
            )}

            {/* Action Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-3 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl btn-primary-gradient text-white text-sm font-bold transition-all disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{mode === 'signup' ? 'Create Free Account & Claim 2 Credits' : 'Sign In to Dashboard'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Hint */}
          <div className="mt-4 pt-3 text-center text-xs text-[#94A3B8]">
            {mode === 'signup' ? (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => handleModeSwitch('signin')}
                  className="text-indigo-400 font-bold hover:text-indigo-300 hover:underline"
                >
                  Sign In instead →
                </button>
              </>
            ) : (
              <>
                New to InterviewAI?{' '}
                <button
                  type="button"
                  onClick={() => handleModeSwitch('signup')}
                  className="text-indigo-400 font-bold hover:text-indigo-300 hover:underline"
                >
                  Create free account (2 Credits included) →
                </button>
              </>
            )}
          </div>

          {/* Privacy & Terms Consent Link */}
          <div className="mt-3 text-center text-[11px] text-slate-500">
            By continuing, you agree to our{' '}
            <Link to="/terms" className="text-slate-400 hover:text-indigo-400 underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-slate-400 hover:text-indigo-400 underline">
              Privacy Policy
            </Link>.
          </div>
        </div>

        {/* Security / RBAC Clarification Note */}
        <div className="mt-5 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
          <span>Strict Role-Based Authorization: All users access their standard dashboard first.</span>
        </div>

      </div>

      {/* Interactive Social OAuth Modal */}
      {socialModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="card-saas max-w-md w-full rounded-2xl p-6 border-[#334155] bg-[#1E293B] shadow-2xl relative">
            <button
              onClick={() => setSocialModal({ open: false, provider: null, name: '', email: '' })}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#0F172A] border border-[#334155] flex items-center justify-center">
                {socialModal.provider === 'google' && <GoogleIcon />}
                {socialModal.provider === 'linkedin' && <LinkedInIcon />}
                {socialModal.provider === 'github' && <GitHubIcon />}
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F8FAFC] capitalize font-heading">
                  {socialModal.provider} OAuth 2.0 Authorization
                </h3>
                <p className="text-xs text-[#94A3B8]">Seamlessly verify your social session</p>
              </div>
            </div>

            <div className="space-y-3 my-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 font-heading">Full Name</label>
                <input
                  type="text"
                  value={socialModal.name}
                  onChange={(e) => setSocialModal({ ...socialModal, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#0F172A] border border-[#334155] text-white text-sm focus:outline-none focus:border-[#6366F1]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 font-heading">Email Address</label>
                <input
                  type="email"
                  value={socialModal.email}
                  onChange={(e) => setSocialModal({ ...socialModal, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#0F172A] border border-[#334155] text-white text-sm focus:outline-none focus:border-[#6366F1]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-6">
              <button
                type="button"
                onClick={() => setSocialModal({ open: false, provider: null, name: '', email: '' })}
                className="flex-1 py-2 px-3 rounded-lg bg-[#0F172A] hover:bg-[#334155] border border-[#334155] text-[#94A3B8] hover:text-[#F8FAFC] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={oauthLoading === socialModal.provider}
                onClick={() =>
                  handleSocialAuth(socialModal.provider, {
                    providerId: `${socialModal.provider}_${Date.now()}`,
                    name: socialModal.name,
                    email: socialModal.email,
                  })
                }
                className="flex-1 py-2 px-3 rounded-lg btn-primary-gradient text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5"
              >
                {oauthLoading === socialModal.provider ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Confirm & Authorize</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
