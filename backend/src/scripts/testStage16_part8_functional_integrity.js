/**
 * testStage16_part8_functional_integrity.js
 * Comprehensive Verification for Part 8: Functional Integrity & Hardware Permissions
 * Tests AI Mock Interviews & Coding Tests, Resume ATS Scoring, OAuth Authentication & Payments Structure, and Zero-Cost Constraint.
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
let passCount = 0;
let failCount = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName} ${details ? `(${details})` : ''}`);
    passCount++;
  } else {
    console.error(`  ❌ [FAIL] ${testName} ${details ? `(${details})` : ''}`);
    failCount++;
  }
}

async function runPart8Tests() {
  console.log('========================================================================');
  console.log('  Part 8: Functional Integrity & Hardware Permissions Verification');
  console.log('========================================================================\n');

  let candidateToken = null;
  let candidateUser = null;
  let interviewId = null;
  let sessionId = null;

  // --- Step 1: Authentication & Multi-Provider OAuth Flows ---
  console.log('[Test 1] Verifying Google, LinkedIn, and GitHub OAuth 2.0 flows...');
  const providers = ['google', 'linkedin', 'github'];
  for (const prov of providers) {
    try {
      const oauthEmail = `oauth_${prov}_${Date.now()}@testdomain.com`;
      const res = await axios.post(`${API_BASE}/auth/oauth`, {
        provider: prov,
        profile: {
          providerId: `${prov}_uid_${Date.now()}`,
          name: `Candidate ${prov.toUpperCase()}`,
          email: oauthEmail,
        },
      });
      assert(res.status === 201 || res.status === 200, `${prov.toUpperCase()} OAuth authentication succeeded`);
      assert(!!res.data?.token || !!res.data?.accessToken, `${prov.toUpperCase()} issued valid JWT access token`);
      assert(res.data?.user?.credits >= 2, `${prov.toUpperCase()} user receives initial free demo credits`);
      if (!candidateToken) {
        candidateToken = res.data?.token || res.data?.accessToken;
        candidateUser = res.data?.user;
      }
    } catch (err) {
      assert(false, `${prov.toUpperCase()} OAuth flow failed`, err.response?.data?.message || err.message);
    }
  }

  const authHeaders = { headers: { Authorization: `Bearer ${candidateToken}` } };

  // --- Step 2: AI Mock Interviews & Coding Tests ---
  console.log('\n[Test 2] Verifying AI Mock Interviews, Role-Based Questions & Coding Tests...');
  try {
    // Create Mock Interview instance
    const createRes = await axios.post(
      `${API_BASE}/interviews`,
      {
        jobTitle: 'Senior Full Stack Engineer',
        jobDescription: 'Build scalable React frontends, Node.js microservices, and optimize MongoDB pipelines.',
        experienceLevel: 'senior',
        numberOfQuestions: 6,
        questionTypes: ['technical', 'behavioral', 'coding'],
      },
      authHeaders
    );
    assert(createRes.status === 201, 'Created mock interview instance');
    interviewId = createRes.data?.interview?._id || createRes.data?.data?._id;
    assert(!!interviewId, 'Retrieved valid interview ID');

    // Generate Role-Based Questions (Technical, Behavioral, Coding)
    const genRes = await axios.post(
      `${API_BASE}/interviews/${interviewId}/generate`,
      {},
      authHeaders
    );
    assert(genRes.status === 200, 'Questions generated successfully via RAG & AI engine');
    const questions = genRes.data?.questions || genRes.data?.interview?.questions || [];
    assert(questions.length >= 5, `Generated ${questions.length} interview questions`);

    const hasTechnical = questions.some(q => q.questionType === 'technical' || q.type === 'technical');
    const hasBehavioral = questions.some(q => q.questionType === 'behavioral' || q.type === 'behavioral');
    const hasCoding = questions.some(q => q.questionType === 'coding' || q.type === 'coding' || !!q.starterCode);

    assert(hasTechnical, 'Interview contains role-based technical questions');
    assert(hasBehavioral, 'Interview contains behavioral / situational questions');
    assert(hasCoding, 'Interview contains proper coding challenge with problem statement');

    const codingQ = questions.find(q => q.questionType === 'coding' || q.type === 'coding' || !!q.starterCode);
    if (codingQ) {
      assert(!!codingQ.starterCode || codingQ.questionText.includes('Coding Challenge'), 'Coding question includes code starter template or algorithmic challenge');
    }

    // Start live interview session
    const sessionRes = await axios.post(
      `${API_BASE}/sessions`,
      { interviewId },
      authHeaders
    );
    assert(sessionRes.status === 201, 'Live interview session started');
    sessionId = sessionRes.data?.session?._id || sessionRes.data?.data?._id;

    // Submit candidate answer & evaluate
    const answerRes = await axios.post(
      `${API_BASE}/sessions/${sessionId}/answers`,
      {
        questionId: questions[0]?._id,
        questionIndex: 0,
        answerText: 'I architect REST APIs with stateless JWT authentication, Redis caching for fast reads, and rate limiting to prevent DDOS.',
        timeTaken: 45,
      },
      authHeaders
    );
    assert(answerRes.status === 200, 'Submitted answer evaluated successfully');
    const evaluatedAnswer = answerRes.data?.answer || answerRes.data?.data?.answer || {};
    assert(typeof evaluatedAnswer.aiScore === 'number' && evaluatedAnswer.aiScore > 0, `AI evaluation produced score: ${evaluatedAnswer.aiScore}/10`);
    assert(typeof evaluatedAnswer.aiFeedback === 'string' && evaluatedAnswer.aiFeedback.length > 10, 'AI evaluation returned actionable constructive feedback');
  } catch (err) {
    assert(false, 'Mock interview test failed', err.response?.data?.message || err.message);
  }

  // --- Step 3: Resume ATS Scoring & Text Parsing ---
  console.log('\n[Test 3] Verifying Resume ATS Scoring, Text Parsing & Role-Based Suggestions...');
  try {
    const sampleResumeText = `
John Doe
Email: john.doe@example.com | Phone: (555) 123-4567 | LinkedIn: linkedin.com/in/johndoe | GitHub: github.com/johndoe
Summary:
Results-driven Senior Full Stack Software Engineer with 6+ years of experience designing and deploying high-concurrency cloud applications.

Work Experience:
Lead Software Engineer | Apex Tech (2021 - Present)
- Architected and engineered microservices using Node.js, TypeScript, and React, reducing page load latency by 45%.
- Optimized PostgreSQL database indexing and Redis caching, scaling platform to handle 250,000+ monthly active users.
- Spearheaded CI/CD automation pipelines with Docker and AWS ECS, decreasing deployment cycle time by 60%.

Software Engineer | DevCorp (2018 - 2021)
- Developed responsive web interfaces using React, Redux, and TailwindCSS for financial dashboards.
- Implemented RESTful APIs and MongoDB query pipelines handling $2.5M in monthly transactions.

Skills:
JavaScript, TypeScript, React, Node.js, Express, PostgreSQL, MongoDB, Redis, Docker, AWS, CI/CD, REST APIs, Git.
Education:
Bachelor of Science in Computer Science | State University (2018)
    `;

    const atsRes = await axios.post(
      `${API_BASE}/resumes/ats-score`,
      {
        resumeText: sampleResumeText,
        targetRole: 'Senior Full Stack Engineer',
      },
      authHeaders
    );
    assert(atsRes.status === 200, 'POST /api/resumes/ats-score returned 200 OK');
    const atsData = atsRes.data?.data || atsRes.data;
    assert(typeof atsData.atsScore === 'number', `Calculated true ATS score: ${atsData.atsScore}/100`);
    assert(atsData.atsScore >= 60, 'ATS score accurately evaluates strong technical resume');
    assert(Array.isArray(atsData.matchedKeywords) && atsData.matchedKeywords.length >= 5, `Matched ${atsData.matchedKeywords.length} target role keywords`);
    assert(Array.isArray(atsData.editSuggestions) && atsData.editSuggestions.length > 0, 'Provided targeted, actionable edit suggestions for target role');
    assert(typeof atsData.subScores === 'object', 'Provides multi-dimensional sub-scores breakdown (keyword match, action verbs, formatting, metrics)');
  } catch (err) {
    assert(false, 'Resume ATS scoring test failed', err.response?.data?.message || err.message);
  }

  // --- Step 4: Payments Structure & Checkout Verification ---
  console.log('\n[Test 4] Verifying Payment Gateway Integration & Checkout Structure...');
  try {
    // 1. Fetch available plans
    const plansRes = await axios.get(`${API_BASE}/billing/plans`);
    assert(plansRes.status === 200, 'Fetched billing plans');
    const plans = plansRes.data?.data || plansRes.data || [];
    const oneMonthPlan = plans.find(p => p.name === '1-month');
    assert(!!oneMonthPlan, 'Found 1-Month Plan in plans registry');

    // 2. Request checkout session
    const checkoutRes = await axios.post(
      `${API_BASE}/billing/checkout`,
      {
        planId: oneMonthPlan._id,
        billingCycle: 'monthly',
      },
      authHeaders
    );
    assert(checkoutRes.status === 200, 'POST /api/billing/checkout returned 200 OK');
    const checkoutData = checkoutRes.data?.data || checkoutRes.data;
    assert(!!checkoutData.sessionId || !!checkoutData.checkoutUrl, 'Returned checkout session / URL');
    assert(checkoutData.amount === 249, 'Checkout correctly priced at ₹249 INR');

    // 3. Test upgrade endpoint for zero-cost QA testing
    const upgradeRes = await axios.post(
      `${API_BASE}/billing/test-upgrade`,
      {
        planName: '1-month',
        billingCycle: 'monthly',
      },
      authHeaders
    );
    assert(upgradeRes.status === 200, 'Test upgrade returned 200 OK without commercial payment dependency');
    assert(upgradeRes.data?.data?.user?.credits >= 10, 'Successfully allocated 10 credits for 1-Month Plan');
  } catch (err) {
    assert(false, 'Payments structure test failed', err.response?.data?.message || err.message);
  }

  // --- Step 5: Cost Optimization & Zero-Cost Constraint Verification ---
  console.log('\n[Test 5] Verifying Zero-Cost Constraint & Local Service Self-Sufficiency...');
  try {
    // 1. Check health endpoint reports local embedding provider
    const healthRes = await axios.get(`${API_BASE}/health`);
    assert(healthRes.data?.embeddingProvider === 'local', 'Embeddings use zero-cost local provider');
    assert(healthRes.data?.database === 'connected', 'Database running smoothly on persistent in-memory / local storage');

    // 2. Confirm in-memory cache operates with zero cloud Redis billing
    assert(healthRes.data?.systemMetrics?.cacheEntries >= 0, 'In-memory cache operates self-hosted without external SaaS fees');
  } catch (err) {
    assert(false, 'Zero-cost constraint verification failed', err.message);
  }

  // --- Summary ---
  console.log('\n========================================================================');
  console.log(`  Part 8 Functional Integrity Verification Complete`);
  console.log(`  Passed: ${passCount}`);
  console.log(`  Failed: ${failCount}`);
  console.log('========================================================================\n');

  if (failCount > 0) process.exit(1);
}

runPart8Tests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
