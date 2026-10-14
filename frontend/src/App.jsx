import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

// Layout Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import ErrorBoundary from './components/ErrorBoundary';
import PageLoader from './components/PageLoader';

// Dynamic Code-Splitting: Lazy-load all page modules for sub-100ms initial load
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ResumeManagerPage = lazy(() => import('./pages/ResumeManagerPage'));
const InterviewSetupPage = lazy(() => import('./pages/InterviewSetupPage'));
const LiveSessionPage = lazy(() => import('./pages/LiveSessionPage'));
const SessionReportPage = lazy(() => import('./pages/SessionReportPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ResumeAnalyzerPage = lazy(() => import('./pages/ResumeAnalyzerPage'));
const QuizCompetitionPage = lazy(() => import('./pages/QuizCompetitionPage'));
const ProjectInterrogationPage = lazy(() => import('./pages/ProjectInterrogationPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage'));

// Admin Pages
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminPromptsPage = lazy(() => import('./pages/admin/AdminPromptsPage'));
const AdminTemplatesPage = lazy(() => import('./pages/admin/AdminTemplatesPage'));

import { useAuthStore } from './store/useAuthStore';

export default function App() {
  const location = useLocation();
  const { fetchMe, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchMe();
    }
  }, [isAuthenticated]);

  const isLiveSession = location.pathname === '/interviews/live';
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#090D16] text-[#94A3B8] flex flex-col justify-between selection:bg-indigo-500/30 selection:text-indigo-200 font-sans">
        
        {/* Candidate Navbar (hidden in live chamber and admin portal) */}
        {!isLiveSession && !isAdminPage && <Navbar />}

        {/* Main Routed Content wrapped in Suspense for zero-lag dynamic loading */}
        <main className="flex-1">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Candidate Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/terms" element={<TermsOfServicePage />} />
              <Route path="/terms-of-service" element={<TermsOfServicePage />} />

              {/* Protected Candidate Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/resumes"
                element={
                  <ProtectedRoute>
                    <ResumeManagerPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/interviews/new"
                element={
                  <ProtectedRoute>
                    <InterviewSetupPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/interviews/live"
                element={
                  <ProtectedRoute>
                    <LiveSessionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sessions/:id/report"
                element={
                  <ProtectedRoute>
                    <SessionReportPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/resumes/analyzer"
                element={
                  <ProtectedRoute>
                    <ResumeAnalyzerPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/resume-analyzer"
                element={
                  <ProtectedRoute>
                    <ResumeAnalyzerPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quizzes"
                element={
                  <ProtectedRoute>
                    <QuizCompetitionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quiz-arena"
                element={
                  <ProtectedRoute>
                    <QuizCompetitionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/resumes/project-interrogation"
                element={
                  <ProtectedRoute>
                    <ProjectInterrogationPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/project-interrogation"
                element={
                  <ProtectedRoute>
                    <ProjectInterrogationPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mock-tests"
                element={
                  <ProtectedRoute>
                    <InterviewSetupPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/interview-setup"
                element={
                  <ProtectedRoute>
                    <InterviewSetupPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route
                path="/admin/dashboard"
                element={
                  <AdminRoute>
                    <AdminDashboardPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <AdminRoute>
                    <AdminUsersPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/prompts"
                element={
                  <AdminRoute>
                    <AdminPromptsPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/templates"
                element={
                  <AdminRoute>
                    <AdminTemplatesPage />
                  </AdminRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<LandingPage />} />
            </Routes>
          </Suspense>
        </main>

        {/* Candidate Footer (hidden in live chamber and admin portal) */}
        {!isLiveSession && !isAdminPage && <Footer />}
      </div>
    </ErrorBoundary>
  );
}
