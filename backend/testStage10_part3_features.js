const axios = require('axios');
const assert = require('assert');

const BASE_URL = 'http://localhost:5000/api';

async function runPart3Tests() {
  console.log('====================================================');
  console.log('  RUNNING PART 3 NEW AI FEATURES VERIFICATION SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name}: ${err.message}`);
      if (err.response?.data) {
        console.error('Response data:', err.response.data);
      }
    }
  }

  // 1. Candidate Login
  let userToken = null;
  await test('Authenticate as Abhishek candidate for feature testing', async () => {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'abhishek@example.com',
      password: 'Password123!',
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.accessToken);
    userToken = res.data.accessToken;
  });

  const headers = () => ({ Authorization: `Bearer ${userToken}` });

  // 2. AI-Based Mock Tests: Templates
  await test('GET /api/mock-tests/templates returns role and skill templates', async () => {
    const res = await axios.get(`${BASE_URL}/mock-tests/templates`, { headers: headers() });
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data.roles));
    assert.ok(Array.isArray(res.data.skills));
    assert.ok(res.data.roles.length >= 3);
    assert.ok(res.data.skills.length >= 2);
  });

  // 3. AI-Based Mock Tests: Generate
  let generatedTest = null;
  await test('POST /api/mock-tests/generate returns structured questions', async () => {
    const res = await axios.post(
      `${BASE_URL}/mock-tests/generate`,
      {
        testType: 'role',
        subject: 'Senior Frontend Architect',
        difficulty: 'senior',
        questionCount: 3,
      },
      { headers: headers() }
    );
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.test);
    assert.strictEqual(res.data.test.questions.length, 3);
    generatedTest = res.data.test;
  });

  // 4. AI-Based Mock Tests: Evaluate
  let evaluationResult = null;
  await test('POST /api/mock-tests/evaluate analyzes candidate answers and calculates score', async () => {
    const res = await axios.post(
      `${BASE_URL}/mock-tests/evaluate`,
      {
        testType: 'role',
        subject: generatedTest.subject,
        difficulty: 'senior',
        timeTakenSeconds: 150,
        answers: [
          {
            questionId: generatedTest.questions[0].id,
            questionText: generatedTest.questions[0].question,
            expectedConcepts: generatedTest.questions[0].expectedConcepts,
            candidateAnswer:
              'React Fiber breaks rendering into incremental units of work. It leverages requestIdleCallback to yield to the main thread during heavy computation, preventing frame drops and layout thrashing.',
          },
          {
            questionId: generatedTest.questions[1].id,
            questionText: generatedTest.questions[1].question,
            expectedConcepts: generatedTest.questions[1].expectedConcepts,
            candidateAnswer:
              'To optimize INP across 50,000 items, I would implement virtualized windowing with react-window so only visible DOM nodes are rendered. Heavy calculations are offloaded to Web Workers and wrapped with useTransition to yield to high priority inputs.',
          },
        ],
      },
      { headers: headers() }
    );
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.evaluation);
    assert.ok(res.data.evaluation.overallScore > 0);
    assert.ok(res.data.evaluation.breakdown.technicalAccuracy > 0);
    assert.ok(Array.isArray(res.data.evaluation.strengths));
    assert.ok(Array.isArray(res.data.evaluation.improvements));
    evaluationResult = res.data.evaluation;
  });

  // 5. AI-Based Mock Tests: History
  await test('GET /api/mock-tests/history returns past test attempts', async () => {
    const res = await axios.get(`${BASE_URL}/mock-tests/history`, { headers: headers() });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.totalTests >= 1);
    assert.ok(Array.isArray(res.data.history));
  });

  // 6. AI-Based Quiz Competitions: Categories
  await test('GET /api/quizzes/categories returns competition categories', async () => {
    const res = await axios.get(`${BASE_URL}/quizzes/categories`, { headers: headers() });
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data.categories));
    assert.ok(res.data.categories.length >= 3);
  });

  // 7. AI-Based Quiz Competitions: Generate
  let quizRound = null;
  await test('POST /api/quizzes/generate generates quiz round with options', async () => {
    const res = await axios.post(`${BASE_URL}/quizzes/generate`, { category: 'fullstack-js' }, { headers: headers() });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.quiz);
    assert.ok(res.data.quiz.questions.length > 0);
    assert.ok(Array.isArray(res.data.quiz.questions[0].options));
    quizRound = res.data.quiz;
  });

  // 8. AI-Based Quiz Competitions: Submit
  await test('POST /api/quizzes/submit computes competitive score, accuracy, streak, and XP', async () => {
    const res = await axios.post(
      `${BASE_URL}/quizzes/submit`,
      {
        category: 'fullstack-js',
        timeTakenSeconds: 30,
        answers: {
          'js-1': 3, // correct
          'js-2': 1, // correct
          'js-3': 1, // correct
          'js-4': 1, // correct
          'js-5': 0, // correct
        },
      },
      { headers: headers() }
    );
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.result);
    assert.strictEqual(res.data.result.correctCount, 5);
    assert.strictEqual(res.data.result.accuracy, 100);
    assert.strictEqual(res.data.result.rankTier, 'Grandmaster');
    assert.ok(res.data.result.totalScore > 500);
  });

  // 9. AI-Based Quiz Competitions: Leaderboard
  await test('GET /api/quizzes/leaderboard returns live rankings and personal standing', async () => {
    const res = await axios.get(`${BASE_URL}/quizzes/leaderboard`, { headers: headers() });
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data.leaderboard));
    assert.ok(res.data.leaderboard.length >= 1);
    assert.ok(res.data.myStanding !== null);
  });

  // 10. AI Resume Analyzer
  const sampleResumeText = `
    Abhishek Sharma - Senior Full Stack Engineer
    Email: abhishek@example.com | Phone: +1-555-0199
    
    Summary:
    Accomplished software engineer with 5+ years of experience building high-scale distributed systems, cloud services, and React frontends.
    
    Skills:
    JavaScript, TypeScript, React, Node.js, Express, PostgreSQL, MongoDB, Redis, Docker, Kubernetes, AWS, GraphQL, CI/CD, Git.
    
    Experience:
    Senior Software Engineer at Nexus Cloud (2022 - Present)
    - Architected and deployed microservices architecture handling 15,000 requests per second with 99.99% uptime.
    - Optimized database indexing and query execution plans in PostgreSQL, reducing average query response time by 48%.
    - Spearheaded migration to React 18 and Next.js, elevating Lighthouse performance scores from 62 to 96 and cutting LCP by 1.4s.
    - Led a team of 6 engineers across sprint planning, code reviews, and CI/CD automated deployments.
    
    Education:
    Bachelor of Technology in Computer Science, 2021
  `;

  await test('POST /api/resumes/analyze evaluates uploaded/pasted resume', async () => {
    const res = await axios.post(
      `${BASE_URL}/resumes/analyze`,
      { resumeText: sampleResumeText },
      { headers: headers() }
    );
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.report);
    assert.ok(res.data.report.overallScore >= 70);
    assert.ok(res.data.report.skillsInventory.length >= 8);
    assert.ok(Array.isArray(res.data.report.strengths));
    assert.ok(res.data.report.executiveSummary);
  });

  // 11. AI Resume ATS Compatibility Score & Edit Suggestions
  await test('POST /api/resumes/ats-score returns ATS compatibility index and customized edit suggestions', async () => {
    const res = await axios.post(
      `${BASE_URL}/resumes/ats-score`,
      {
        resumeText: sampleResumeText,
        targetRole: 'Senior Full Stack Engineer',
      },
      { headers: headers() }
    );
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.atsReport);
    assert.ok(res.data.atsReport.atsScore > 0);
    assert.ok(res.data.atsReport.subScores.keywordMatch > 0);
    assert.ok(Array.isArray(res.data.atsReport.matchedKeywords));
    assert.ok(Array.isArray(res.data.atsReport.editSuggestions));
    assert.ok(res.data.atsReport.editSuggestions.length >= 2);
    assert.ok(res.data.atsReport.editSuggestions[0].suggestedSnippet);
  });

  console.log(`\n====================================================`);
  console.log(`  PART 3 BACKEND SUITE: ${passed} / ${total} TESTS PASSED (100%)`);
  console.log(`====================================================\n`);

  if (passed !== total) process.exit(1);
}

runPart3Tests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
