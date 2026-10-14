import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Sparkles, 
  FileText, 
  CreditCard, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Shield, 
  Zap,
  BarChart3,
  Trophy,
  Target,
  Terminal
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export default function Navbar() {
  const { user, adminUser, isAuthenticated, logout, isAdminAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isVerifiedAdmin = Boolean(
    isAdminAuthenticated &&
    adminUser?.role &&
    ['admin', 'super_admin', 'content_manager', 'support'].includes(adminUser.role)
  );

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: BarChart3, authRequired: true },
    { name: 'Mock Interview', path: '/interviews/new', icon: Zap, authRequired: true },
    { name: 'Resume & ATS', path: '/resumes/analyzer', icon: Target, authRequired: true },
    { name: 'Project Interrogation', path: '/resumes/project-interrogation', icon: Terminal, authRequired: true },
    { name: 'Quiz Arena', path: '/quizzes', icon: Trophy, authRequired: true },
    { name: 'Pricing & Plans', path: '/pricing', icon: CreditCard },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 border-b border-[#334155] bg-[#090D16]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all duration-300">
              <div className="w-full h-full bg-[#1E293B] rounded-[11px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-indigo-400 group-hover:text-cyan-300 transition-colors" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-[#F8FAFC] flex items-center font-heading">
                Interview<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-300 to-cyan-400">AI</span>
              </span>
              <span className="hidden sm:block text-[10px] uppercase tracking-wider font-semibold text-[#64748B] -mt-1">
                Mock Platform
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              if (link.authRequired && !isAuthenticated) return null;
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-indigo-600/20 text-[#F8FAFC] border border-indigo-500/40 shadow-inner'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-indigo-400' : 'text-[#64748B]'}`} />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Area: Profile / Actions / Admin */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Credits Badge (Primary Brand Indigo / Electric Violet) */}
                <Link
                  to="/pricing"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-950/70 border border-indigo-500/40 text-indigo-300 text-xs font-semibold hover:border-indigo-400 shadow-sm transition-all group"
                  title="Remaining AI Mock Interview Credits"
                >
                  <Zap className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <span>{user?.credits ?? 2} Credits</span>
                </Link>

                {/* Profile Pill */}
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1E293B] border border-[#334155] text-[#F8FAFC] text-sm hover:border-indigo-500/40 transition-all"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white uppercase">
                    {user?.name ? user.name[0] : 'U'}
                  </div>
                  <span className="font-medium max-w-[120px] truncate">{user?.name || 'Account'}</span>
                </Link>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-[#94A3B8] hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-semibold text-[#94A3B8] hover:text-[#F8FAFC] px-3.5 py-2 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn-primary-gradient px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-md shadow-indigo-600/30 hover:shadow-indigo-500/50 transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Get Started</span>
                </Link>
              </>
            )}

            {/* Admin Switcher: Only displayed if verified admin credentials */}
            {isVerifiedAdmin && (
              <Link
                to="/admin/dashboard"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25 hover:border-rose-400 text-xs font-bold transition-all shadow-sm shadow-rose-950/40"
                title="Switch into Administrator Governance Panel"
              >
                <Shield className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden lg:inline">Switch to </span>Admin Panel
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#334155] bg-[#090D16] px-4 pt-3 pb-5 space-y-2">
          {navLinks.map((link) => {
            if (link.authRequired && !isAuthenticated) return null;
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]"
              >
                <Icon className="w-4 h-4 text-indigo-400" />
                {link.name}
              </Link>
            );
          })}

          <div className="pt-3 border-t border-[#334155] space-y-2">
            {isAuthenticated ? (
              <div className="flex flex-col gap-2">
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#1E293B] border border-[#334155] text-sm text-[#F8FAFC]"
                >
                  <span className="font-medium">{user?.name}</span>
                  <span className="text-xs text-indigo-400 font-semibold">{user?.credits} Credits</span>
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 rounded-lg text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-sm font-medium text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B] rounded-lg"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-sm font-semibold text-white btn-primary-gradient rounded-xl"
                >
                  Get Started Free
                </Link>
              </div>
            )}
            {isVerifiedAdmin && (
              <Link
                to="/admin/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-300 bg-rose-500/10 border border-rose-500/25 rounded-lg"
              >
                <Shield className="w-3.5 h-3.5 text-rose-400" /> Switch to Admin Panel
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
