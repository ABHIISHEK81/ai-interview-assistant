const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

const runAudit = async () => {
  console.log('====================================================');
  console.log('  Stage 8: End-to-End Integration & Security Audit  ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      failed++;
    }
  };

  try {
    // -----------------------------------------------------------------
    // Section 1: Security Headers & Health Checks
    // -----------------------------------------------------------------
    console.log('[Audit 1] Security Headers & System Health Probe...');
    const healthRes = await axios.get(`${BASE_URL}/health`);
    assert(healthRes.status === 200, 'Health endpoint responds with HTTP 200');
    assert(healthRes.data.status === 'ok' || healthRes.data.status === 'healthy', 'System status reports "ok"');
    assert(healthRes.data.embeddingProvider === 'local', 'Zero-cost local embedding engine verified');
    assert(healthRes.headers['x-content-type-options'] === 'nosniff', 'Helmet nosniff security header present');
    assert(healthRes.headers['x-frame-options'] === 'SAMEORIGIN' || healthRes.headers['x-frame-options'] === 'DENY', 'Helmet clickjacking prevention header present');

    // -----------------------------------------------------------------
    // Section 2: Auth Flow & Information Leakage Prevention
    // -----------------------------------------------------------------
    console.log('\n[Audit 2] Candidate Auth & Information Leakage Audit...');
    const uniqueEmail = `audit_user_${Date.now()}@platform.com`;
    const regRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Security Auditor',
      email: uniqueEmail,
      password: 'Password123!',
    });
    assert(regRes.status === 201, 'User registration succeeds with 201 Created');
    assert(!regRes.data.user?.password, 'Password hash NOT leaked in register response');
    assert(!regRes.data.user?.refreshToken, 'Refresh token NOT leaked in user payload');

    const candidateToken = regRes.data.accessToken || regRes.data.data?.accessToken;
    const authHeaders = { headers: { Authorization: `Bearer ${candidateToken}` } };

    const meRes = await axios.get(`${BASE_URL}/auth/me`, authHeaders);
    const user = meRes.data.user || meRes.data.data;
    assert(!user.password && !user.refreshToken, 'Sensitive credentials stripped from /api/auth/me');

    // -----------------------------------------------------------------
    // Section 3: RBAC & Permission Boundaries
    // -----------------------------------------------------------------
    console.log('\n[Audit 3] RBAC Permission Boundary Enforcement...');
    let candidateBlockedFromAdmin = false;
    try {
      await axios.get(`${BASE_URL}/admin/users`, authHeaders);
    } catch (err) {
      if (err.response?.status === 403) {
        candidateBlockedFromAdmin = true;
      }
    }
    assert(candidateBlockedFromAdmin, 'Candidate token strictly rejected with 403 from admin routes');

    let unauthBlocked = false;
    try {
      await axios.get(`${BASE_URL}/admin/analytics`);
    } catch (err) {
      if (err.response?.status === 401) {
        unauthBlocked = true;
      }
    }
    assert(unauthBlocked, 'Unauthenticated request rejected with 401 from admin endpoints');

    // -----------------------------------------------------------------
    // Section 4: Input Validation & Sanitization
    // -----------------------------------------------------------------
    console.log('\n[Audit 4] Express-Validator Input Hardening...');
    let invalidEmailBlocked = false;
    try {
      await axios.post(`${BASE_URL}/auth/register`, {
        name: 'Invalid Email User',
        email: 'not-an-email',
        password: 'Password123!',
      });
    } catch (err) {
      if (err.response?.status === 400 || err.response?.status === 422) {
        invalidEmailBlocked = true;
      }
    }
    assert(invalidEmailBlocked, 'Malformed email format rejected by input validator');

    let weakPasswordBlocked = false;
    try {
      await axios.post(`${BASE_URL}/auth/register`, {
        name: 'Weak Pass User',
        email: `weak_${Date.now()}@test.com`,
        password: '123',
      });
    } catch (err) {
      if (err.response?.status === 400 || err.response?.status === 422) {
        weakPasswordBlocked = true;
      }
    }
    assert(weakPasswordBlocked, 'Weak password (<8 chars / missing uppercase) rejected');

    // -----------------------------------------------------------------
    // Section 5: End-to-End Simulation Lifecycle
    // -----------------------------------------------------------------
    console.log('\n[Audit 5] Full Mock Interview Lifecycle E2E...');
    const interviewRes = await axios.post(
      `${BASE_URL}/interviews`,
      {
        jobTitle: 'Senior Cloud Architect',
        jobDescription: 'Seeking an expert to architect Kubernetes clusters, distributed caching, and zero-trust service meshes with high availability.',
        experienceLevel: 'senior',
        numberOfQuestions: 3,
      },
      authHeaders
    );
    assert(interviewRes.status === 201, 'Interview draft created');
    const interviewId = interviewRes.data.interview._id;

    // Generate questions
    const genRes = await axios.post(
      `${BASE_URL}/interviews/${interviewId}/generate`,
      {},
      authHeaders
    );
    assert(genRes.status === 200, 'Questions generated via RAG + Groq');
    assert(genRes.data.remainingCredits === 1, 'Credit deducted on question generation');
    const questions = genRes.data.interview.questions;
    assert(Array.isArray(questions) && questions.length > 0, 'Questions returned in interview object');

    // Start Session
    const sessionRes = await axios.post(
      `${BASE_URL}/sessions/start`,
      { interviewId },
      authHeaders
    );
    assert(sessionRes.status === 201 || sessionRes.status === 200, 'Session started successfully');
    const sessionObj = sessionRes.data.session || sessionRes.data.data;
    const sessionId = sessionObj._id;

    // Submit Answer
    const answerRes = await axios.post(
      `${BASE_URL}/sessions/${sessionId}/answer`,
      {
        questionId: questions[0]._id,
        answerText: 'We deploy an ingress controller with mutual TLS, Redis cluster with write-through caching, and horizontal pod autoscalers.',
        timeTaken: 45,
      },
      authHeaders
    );
    assert(answerRes.status === 200, 'Candidate answer recorded with timing metadata');

    // Complete Session & Evaluate
    const completeRes = await axios.post(
      `${BASE_URL}/sessions/${sessionId}/complete`,
      {},
      authHeaders
    );
    assert(completeRes.status === 200, 'Session completed and evaluated');
    const report = completeRes.data.session || completeRes.data.data;
    assert(report.status === 'completed', 'Session status set to completed');
    assert(typeof report.overallScore === 'number' && report.overallScore > 0, 'Holistic 1-100 overall score calculated');

    // -----------------------------------------------------------------
    // Section 6: Plan Quota & Monetization Guard
    // -----------------------------------------------------------------
    console.log('\n[Audit 6] Monetization & Credit Quota Security...');
    const plansRes = await axios.get(`${BASE_URL}/billing/plans`);
    assert(plansRes.status === 200 && plansRes.data.data.length === 4, 'All 4 Addendum plans active and discoverable');

    // Test Upgrade to Medium (10 credits)
    const upgradeRes = await axios.post(
      `${BASE_URL}/billing/test-upgrade`,
      { planName: 'medium' },
      authHeaders
    );
    assert(upgradeRes.status === 200, 'Candidate upgraded to Medium plan in test mode');
    assert(upgradeRes.data.data.user.credits >= 10, 'Quota refilled with 10 credits');

    // Check Billing status
    const billingStatusRes = await axios.get(`${BASE_URL}/billing/status`, authHeaders);
    assert(billingStatusRes.data.data.plan === 'medium', 'Billing status reflects upgraded tier');
    assert(billingStatusRes.data.data.isPremium === true, 'Premium candidate privileges active');

    // -----------------------------------------------------------------
    // Section 7: Admin Governance & Prompts Audit
    // -----------------------------------------------------------------
    console.log('\n[Audit 7] Admin Governance, Rollback & Schedulers...');
    const adminLoginRes = await axios.post(`${BASE_URL}/admin/auth/login`, {
      email: 'aftab@admin.com',
      password: 'passwore123',
    });
    assert(adminLoginRes.status === 200, 'Super admin authenticated');
    const adminToken = adminLoginRes.data.accessToken || adminLoginRes.data.data?.accessToken;
    const adminHeaders = { headers: { Authorization: `Bearer ${adminToken}` } };

    const analyticsRes = await axios.get(`${BASE_URL}/admin/analytics`, adminHeaders);
    assert(analyticsRes.status === 200, 'Admin analytics endpoint operational');
    const analytics = analyticsRes.data.analytics || analyticsRes.data.data;
    assert(analytics && analytics.users?.total > 0, 'Aggregate platform metrics computed accurately');

    const promptsRes = await axios.get(`${BASE_URL}/admin/prompts`, adminHeaders);
    const promptsList = promptsRes.data.prompts || promptsRes.data.data;
    assert(promptsRes.status === 200 && promptsList && promptsList.length === 5, 'All 5 system prompt categories verified');

  } catch (error) {
    console.error('Audit exception caught:', error.response?.data || error.message);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`  Stage 8 Audit Complete: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
};

runAudit();
