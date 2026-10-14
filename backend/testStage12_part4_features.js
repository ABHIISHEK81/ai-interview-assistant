const axios = require('axios');
const assert = require('assert');

const BASE_URL = 'http://localhost:5000/api';

async function runPart4Tests() {
  console.log('====================================================');
  console.log('  RUNNING PART 4 NEW FEATURES VERIFICATION SUITE');
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

  // 1. Authentication
  let userToken = null;
  await test('Authenticate candidate for Part 4 testing', async () => {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'abhishek@example.com',
      password: 'Password123!',
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.accessToken);
    userToken = res.data.accessToken;
  });

  const headers = () => ({ Authorization: `Bearer ${userToken}` });

  const sampleResume = `
    Abhishek Sharma - Senior Full Stack & Cloud Architect
    Summary:
    Principal-track engineer with 6+ years designing high-throughput distributed microservices, React single-page architectures, and automated cloud infrastructure.
    
    Technical Projects:
    1. Distributed Real-Time Financial Ledger
    Engineered a high-concurrency ledger service with Node.js, Redis, and PostgreSQL, processing 15,000 transactions per second with optimistic locking.
    Technologies: Node.js, Express, Redis, PostgreSQL, Docker, AWS.
    
    2. Cloud-Native Scalable Video Analytics Pipeline
    Architected an asynchronous worker queue utilizing Kafka, Docker, and Kubernetes to transcode and analyze video feeds with sub-second latency.
    Technologies: Python, Kafka, Docker, Kubernetes, AWS S3.
    
    3. Enterprise Reactive Dashboard Suite
    Built a modular component system in React 18, TypeScript, and Next.js with state virtualization, reducing LCP to 1.1s.
    Technologies: React, Next.js, TypeScript, TailwindCSS, REST APIs.
  `;

  // 2. ATS Score & Role-Based Editing Suggestions (Part 4 requirement 1)
  await test('POST /api/resumes/ats-score returns ATS score and tailored role edit recommendations', async () => {
    const res = await axios.post(
      `${BASE_URL}/resumes/ats-score`,
      {
        resumeText: sampleResume,
        targetRole: 'Senior Full Stack & Cloud Architect',
      },
      { headers: headers() }
    );
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.atsReport);
    assert.ok(res.data.atsReport.atsScore > 0);
    assert.ok(res.data.atsReport.matchedKeywords.length >= 5);
    assert.ok(Array.isArray(res.data.atsReport.editSuggestions));
    assert.ok(res.data.atsReport.editSuggestions.length >= 3);
  });

  // 3. Resume Analysis & Custom Question Generation (Part 4 requirement 2a)
  await test('POST /api/resumes/custom-questions analyzes resume and generates targeted role questions', async () => {
    const res = await axios.post(
      `${BASE_URL}/resumes/custom-questions`,
      {
        resumeText: sampleResume,
        targetRole: 'Senior Full Stack & Cloud Architect',
        experienceLevel: 'senior',
      },
      { headers: headers() }
    );
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data.questions));
    assert.ok(res.data.questions.length >= 4);
    assert.ok(res.data.questions[0].question);
    assert.ok(res.data.questions[0].resumeContext);
    assert.ok(res.data.questions[0].expectedKeyPoints.length >= 2);
    assert.ok(res.data.questions[0].modelAnswer);
  });

  // 4. Project Extraction from Resume (Part 4 requirement 2b)
  let extractedProjects = [];
  await test('POST /api/resumes/extract-projects extracts projects mentioned in resume', async () => {
    const res = await axios.post(
      `${BASE_URL}/resumes/extract-projects`,
      {
        resumeText: sampleResume,
      },
      { headers: headers() }
    );
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data.projects));
    assert.ok(res.data.projects.length >= 2);
    assert.ok(res.data.projects[0].title);
    assert.ok(res.data.projects[0].technologies.length > 0);
    extractedProjects = res.data.projects;
  });

  // 5. Project-Specific Deep Dive: Start Interrogation
  let interrogationQuestions = [];
  await test('POST /api/resumes/project-interrogation/start creates interactive probing questions', async () => {
    const targetProject = extractedProjects[0];
    const res = await axios.post(
      `${BASE_URL}/resumes/project-interrogation/start`,
      {
        projectTitle: targetProject.title,
        technologies: targetProject.technologies,
        description: targetProject.description,
        targetRole: 'Senior Full Stack & Cloud Architect',
      },
      { headers: headers() }
    );
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data.questions));
    assert.strictEqual(res.data.questions.length, 4);
    assert.ok(res.data.questions[0].questionText);
    assert.ok(res.data.questions[0].expectedConcepts.length > 0);
    interrogationQuestions = res.data.questions;
  });

  // 6. Project-Specific Deep Dive: Evaluate Interrogation Answers
  await test('POST /api/resumes/project-interrogation/evaluate scores practical hands-on authenticity', async () => {
    const res = await axios.post(
      `${BASE_URL}/resumes/project-interrogation/evaluate`,
      {
        projectTitle: extractedProjects[0].title,
        technologies: extractedProjects[0].technologies,
        targetRole: 'Senior Full Stack & Cloud Architect',
        timeTakenSeconds: 360,
        answers: [
          {
            questionId: interrogationQuestions[0].questionId,
            questionText: interrogationQuestions[0].questionText,
            expectedConcepts: interrogationQuestions[0].expectedConcepts,
            candidateAnswer: 'We selected Node.js with TypeScript and PostgreSQL over MongoDB because strict relational integrity and transactional ACID guarantees were mandatory for financial ledgers. We decoupled read hotspots using Redis caching with a 60s TTL, which slashed database connection contention by 55%.',
          },
          {
            questionId: interrogationQuestions[1].questionId,
            questionText: interrogationQuestions[1].questionText,
            expectedConcepts: interrogationQuestions[1].expectedConcepts,
            candidateAnswer: 'Under concurrent write bursts, we implemented optimistic concurrency control with row version timestamps. In cases of concurrent debiting on the same balance, we leveraged Redis atomic Lua scripts for token allocation before writing to PostgreSQL with connection pooling via PgBouncer.',
          },
          {
            questionId: interrogationQuestions[2].questionId,
            questionText: interrogationQuestions[2].questionText,
            expectedConcepts: interrogationQuestions[2].expectedConcepts,
            candidateAnswer: 'We created composite indexes on (account_id, created_at DESC) and partitioned the ledger tables by month. Using EXPLAIN ANALYZE, we validated that sequential table scans were replaced by index range scans, maintaining p99 query latency under 18ms across 10 million rows.',
          },
          {
            questionId: interrogationQuestions[3].questionId,
            questionText: interrogationQuestions[3].questionText,
            expectedConcepts: interrogationQuestions[3].expectedConcepts,
            candidateAnswer: 'The most severe production incident was connection pool exhaustion caused by unhandled unclosed transactions in an edge-case retry block. We identified the leak via Datadog APM connection metrics, released an emergency hotfix adding explicit timeouts, and added automated integration tests asserting pool reclamation.',
          },
        ],
      },
      { headers: headers() }
    );
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.evaluation);
    assert.ok(res.data.evaluation.practicalScore >= 75);
    assert.ok(res.data.evaluation.authenticityRating);
    assert.ok(res.data.evaluation.rubricBreakdown.technicalDepth > 0);
    assert.ok(res.data.evaluation.rubricBreakdown.incidentHandling > 0);
    assert.ok(res.data.evaluation.strengths.length > 0);
    assert.strictEqual(res.data.evaluation.interrogationQnA.length, 4);
  });

  // 7. Project Interrogation History
  await test('GET /api/resumes/project-interrogation/history returns past interrogation attempts', async () => {
    const res = await axios.get(
      `${BASE_URL}/resumes/project-interrogation/history`,
      { headers: headers() }
    );
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data.history));
    assert.ok(res.data.history.length >= 1);
    assert.strictEqual(res.data.history[0].projectTitle, extractedProjects[0].title);
  });

  console.log(`\n====================================================`);
  console.log(`  PART 4 BACKEND SUITE: ${passed} / ${total} TESTS PASSED (100%)`);
  console.log(`====================================================\n`);

  if (passed !== total) process.exit(1);
}

runPart4Tests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
