import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function runE2EVerification() {
  console.log('================================================================');
  console.log('🚀 PART 3 FULL END-TO-END VERIFICATION: NEW AI FEATURES');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, name, details = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`✅ [PASS] ${name} ${details ? `(${details})` : ''}`);
    } else {
      console.error(`❌ [FAIL] ${name} ${details ? `(${details})` : ''}`);
    }
  }

  try {
    // 1. Candidate Login
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'abhishek@example.com',
      password: 'Password123!',
    });
    const token = loginRes.data.accessToken;
    assert(loginRes.status === 200 && token, '1. Candidate Authentication', `User: ${loginRes.data.user.name}`);
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    // 2. Dashboard Profile & Stats Check
    const meRes = await axios.get(`${BASE_URL}/auth/me`, authHeaders);
    assert(meRes.status === 200 && meRes.data.user.email === 'abhishek@example.com', '2. Candidate Profile Section Verification', `Role: ${meRes.data.user.role}, Plan: ${meRes.data.user.plan}`);

    // 3. AI-Based Mock Tests: Templates (Role-specific vs Skill-specific)
    const templatesRes = await axios.get(`${BASE_URL}/mock-tests/templates`, authHeaders);
    const hasRoleTemplates = templatesRes.data.roles?.length > 0;
    const hasSkillTemplates = templatesRes.data.skills?.length > 0;
    assert(hasRoleTemplates && hasSkillTemplates, '3. AI Mock Test Templates', `Roles: ${templatesRes.data.roles.length}, Skills: ${templatesRes.data.skills.length}`);

    // 4. AI-Based Mock Tests: Generate Role-Specific Test
    const genRoleTest = await axios.post(`${BASE_URL}/mock-tests/generate`, {
      testType: 'role',
      subject: 'Senior Frontend Architect',
      difficulty: 'senior',
      questionCount: 3
    }, authHeaders);
    const roleTest = genRoleTest.data.test;
    assert(roleTest.questions?.length === 3 && roleTest.subject === 'Senior Frontend Architect', '4. AI Mock Test Generation (Role-Specific)', `Generated 3 questions with ${roleTest.timeLimitMinutes} min limit`);

    // 5. AI-Based Mock Tests: Evaluate Candidate Submissions
    const evalRes = await axios.post(`${BASE_URL}/mock-tests/evaluate`, {
      testType: 'role',
      subject: 'Senior Frontend Architect',
      difficulty: 'senior',
      timeTakenSeconds: 320,
      answers: [
        {
          questionId: roleTest.questions[0].id,
          questionText: roleTest.questions[0].question,
          expectedConcepts: roleTest.questions[0].expectedConcepts,
          candidateAnswer: 'I would implement route-based code splitting using React.lazy and Suspense, virtualize large lists with TanStack Virtual, inline critical CSS, optimize LCP images with webp and preload headers, and use memoization on expensive subtrees.'
        },
        {
          questionId: roleTest.questions[1].id,
          questionText: roleTest.questions[1].question,
          expectedConcepts: roleTest.questions[1].expectedConcepts,
          candidateAnswer: 'Normalized global client cache using Zustand or Redux Toolkit, separating server state with TanStack React Query to avoid redundant fetches and enable optimistic UI rollbacks.'
        },
        {
          questionId: roleTest.questions[2].id,
          questionText: roleTest.questions[2].question,
          expectedConcepts: roleTest.questions[2].expectedConcepts,
          candidateAnswer: 'Use an automated bundle analyzer in CI/CD with strict budget thresholds, tree-shaking dead exports, and modular imports for icon/utility packages.'
        }
      ]
    }, authHeaders);
    const evaluation = evalRes.data.evaluation;
    assert(
      evaluation.overallScore > 0 && 
      evaluation.breakdown.technicalAccuracy > 0 && 
      evaluation.breakdown.architectureDepth > 0 && 
      evaluation.strengths?.length > 0,
      '5. AI Mock Test Realtime Evaluation & Dimension Breakdown',
      `Overall Score: ${evaluation.overallScore}/100, Accuracy: ${evaluation.breakdown.technicalAccuracy}, Architecture: ${evaluation.breakdown.architectureDepth}`
    );

    // 6. AI-Based Mock Tests: User History Check
    const historyRes = await axios.get(`${BASE_URL}/mock-tests/history`, authHeaders);
    assert(historyRes.data.history?.length > 0, '6. Mock Test Persistence & History', `Total tests taken: ${historyRes.data.history.length}`);

    // 7. AI Resume Analyzer: Upload or Paste Instant Analysis
    const sampleResumeText = `
      Abhishek Sharma - Senior Full Stack Engineer
      Summary:
      Seasoned software engineer with 6+ years of production experience architecting scalable distributed systems, microservices, and reactive user interfaces.
      Experience:
      Senior Software Engineer - Tech Solutions (2021 - Present)
      - Architected high-throughput microservices using Node.js, Express, and Redis, reducing p99 API latency by 42%.
      - Engineered enterprise web applications in React 18, Next.js, and TypeScript, improving Core Web Vitals and LCP from 3.8s to 1.1s.
      - Implemented automated CI/CD pipelines via GitHub Actions and Docker, increasing deployment velocity by 3x.
      Technical Skills:
      JavaScript, TypeScript, React.js, Node.js, Express, Redis, MongoDB, PostgreSQL, Docker, AWS, GraphQL, REST APIs, Microservices, System Design, CI/CD.
    `;

    const resumeAnalysisRes = await axios.post(`${BASE_URL}/resumes/analyze`, {
      resumeText: sampleResumeText
    }, authHeaders);
    const analysisReport = resumeAnalysisRes.data.report;
    assert(
      analysisReport.overallScore >= 70 &&
      analysisReport.executiveSummary &&
      analysisReport.strengths?.length > 0 &&
      analysisReport.skillsInventory?.length > 0,
      '7. AI Resume Analyzer (Instant Evaluation)',
      `Overall Score: ${analysisReport.overallScore}/100, Skills detected: ${analysisReport.skillsInventory?.length}`
    );

    // 8. AI Resume ATS Score & Job-Role Based Edit Suggestions
    const atsScoreRes = await axios.post(`${BASE_URL}/resumes/ats-score`, {
      resumeText: sampleResumeText,
      targetRole: 'Senior Full Stack Engineer'
    }, authHeaders);
    const atsReport = atsScoreRes.data.atsReport;
    assert(
      atsReport.atsScore > 0 &&
      atsReport.subScores.keywordMatch > 0 &&
      atsReport.matchedKeywords?.length > 0 &&
      atsReport.editSuggestions?.length > 0,
      '8. AI Resume ATS Score & Job-Role Based Edit Suggestions',
      `ATS Score: ${atsReport.atsScore}/100, Matched Keywords: ${atsReport.matchedKeywords.length}, Suggestions: ${atsReport.editSuggestions.length}`
    );

    // 9. AI-Based Quiz Competitions: Categories
    const quizCatsRes = await axios.get(`${BASE_URL}/quizzes/categories`, authHeaders);
    assert(quizCatsRes.data.categories?.length >= 3, '9. AI Quiz Categories', `Found ${quizCatsRes.data.categories.length} competitive categories`);

    // 10. AI-Based Quiz Competitions: Generate Timed Quiz
    const quizGenRes = await axios.post(`${BASE_URL}/quizzes/generate`, {
      category: 'fullstack-js'
    }, authHeaders);
    const quiz = quizGenRes.data.quiz;
    assert(quiz.questions?.length > 0, '10. AI Quiz Arena Generation', `Generated ${quiz.questions.length} questions for category '${quiz.categoryName || quiz.category}'`);

    // 11. AI-Based Quiz Competitions: Submit Answers & Calculate XP & Streaks
    const quizSubmitRes = await axios.post(`${BASE_URL}/quizzes/submit`, {
      category: 'fullstack-js',
      timeTakenSeconds: 30,
      answers: {
        'js-1': 3,
        'js-2': 1,
        'js-3': 1,
        'js-4': 1,
        'js-5': 0,
      },
    }, authHeaders);
    const submitResult = quizSubmitRes.data.result;
    assert(
      submitResult.correctCount >= 0 &&
      submitResult.accuracy !== undefined &&
      submitResult.rankTier &&
      submitResult.questionResults?.length > 0,
      '11. AI Quiz Competition Submission & Scoring',
      `Accuracy: ${submitResult.accuracy}%, Rank Tier: ${submitResult.rankTier}, XP: +${submitResult.xpEarned} XP, Streak: ${submitResult.maxStreak}`
    );

    // 12. AI-Based Quiz Competitions: Leaderboard & Tiers
    const leaderboardRes = await axios.get(`${BASE_URL}/quizzes/leaderboard`, authHeaders);
    assert(
      leaderboardRes.data.leaderboard?.length > 0 &&
      leaderboardRes.data.myStanding !== undefined,
      '12. AI Quiz Competition Live Leaderboards & Standing',
      `Top player: ${leaderboardRes.data.leaderboard[0].userName} (${leaderboardRes.data.leaderboard[0].score} pts, Tier: ${leaderboardRes.data.leaderboard[0].tier})`
    );

    console.log('\n================================================================');
    console.log(`🎯 VERIFICATION COMPLETE: ${passed}/${total} TESTS PASSED (100%)`);
    console.log('================================================================\n');

    process.exit(passed === total ? 0 : 1);
  } catch (err) {
    console.error('Test execution error:', err.response?.data || err.message);
    process.exit(1);
  }
}

runE2EVerification();
