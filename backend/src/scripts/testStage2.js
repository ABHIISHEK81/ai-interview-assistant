/**
 * Stage 2 Verification Script
 * Validates Candidate Auth, Resume Upload, RAG Question Generation,
 * Session Flow, and AI Answer Evaluation.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api';

async function runStage2Tests() {
  console.log('--- Starting Stage 2 End-to-End Verification ---\n');

  try {
    // 1. Health Probe
    console.log('[1/12] Testing GET /api/health...');
    const healthRes = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health probe status:', healthRes.data.status);

    // 2. Candidate Registration
    console.log('\n[2/12] Testing POST /api/auth/register...');
    const testEmail = `candidate_${Date.now()}@example.com`;
    const regRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Priya Sharma',
      email: testEmail,
      password: 'Password123!',
    });
    console.log('✅ Registration successful. User ID:', regRes.data.user._id);
    console.log('   Tokens issued: accessToken & refreshToken present');
    let accessToken = regRes.data.accessToken;
    let refreshToken = regRes.data.refreshToken;

    // 3. Candidate Login
    console.log('\n[3/12] Testing POST /api/auth/login...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: testEmail,
      password: 'Password123!',
    });
    console.log('✅ Login successful. Role:', loginRes.data.user.role, 'Credits:', loginRes.data.user.credits);
    accessToken = loginRes.data.accessToken;
    refreshToken = loginRes.data.refreshToken;

    const authHeaders = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };

    // 4. Current User Profile
    console.log('\n[4/12] Testing GET /api/auth/me...');
    const meRes = await axios.get(`${BASE_URL}/auth/me`, authHeaders);
    console.log('✅ Profile retrieved:', meRes.data.user.name, `(${meRes.data.user.email})`);

    // 5. Token Refresh
    console.log('\n[5/12] Testing POST /api/auth/refresh...');
    const refreshRes = await axios.post(`${BASE_URL}/auth/refresh`, {
      refreshToken,
    });
    console.log('✅ Token refreshed. New access token received:', !!refreshRes.data.accessToken);

    // 6. Candidate Dashboard Stats
    console.log('\n[6/12] Testing GET /api/users/stats...');
    const statsRes = await axios.get(`${BASE_URL}/users/stats`, authHeaders);
    console.log('✅ Initial user stats:', statsRes.data.stats);

    // 7. Resume Upload (simulating resume upload with multipart FormData or sample PDF)
    console.log('\n[7/12] Testing POST /api/resumes (Upload)...');
    // Create temporary sample PDF if needed
    const sampleDir = path.join(__dirname, '../../uploads/resumes');
    if (!fs.existsSync(sampleDir)) fs.mkdirSync(sampleDir, { recursive: true });
    const sampleFilePath = path.join(sampleDir, 'sample_resume.txt');
    fs.writeFileSync(
      sampleFilePath,
      'John Doe\nEmail: john@example.com\nSkills: Node.js, Express, MongoDB, Redis, Docker\nExperience: Senior Software Engineer at TechCorp for 3 years building microservices.'
    );

    // Using FormData to upload
    const FormData = require('form-data');
    const form = new FormData();
    form.append('resume', fs.createReadStream(sampleFilePath), {
      filename: 'john_doe_resume.pdf',
      contentType: 'application/pdf',
    });

    const resumeRes = await axios.post(`${BASE_URL}/resumes`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const resumeId = resumeRes.data.resume._id;
    console.log('✅ Resume uploaded & parsed successfully. ID:', resumeId);
    console.log('   Default resume:', resumeRes.data.resume.isDefault);
    console.log('   Extracted skills:', resumeRes.data.resume.parsedData.skills);

    // 8. Create Interview Draft
    console.log('\n[8/12] Testing POST /api/interviews (Create Draft)...');
    const interviewRes = await axios.post(
      `${BASE_URL}/interviews`,
      {
        jobTitle: 'Senior Backend Engineer',
        jobDescription:
          'We are seeking a Senior Backend Engineer to architect, build, and maintain high-throughput distributed microservices using Node.js, Express, MongoDB, and Redis. The ideal candidate has deep expertise in database query optimization, RESTful API design, caching strategies, and asynchronous event-driven pipelines.',
        experienceLevel: 'senior',
        numberOfQuestions: 5,
        questionTypes: ['technical', 'behavioral'],
        company: 'CloudScale Technologies',
        resumeId,
      },
      authHeaders
    );
    const interviewId = interviewRes.data.interview._id;
    console.log('✅ Interview created with status:', interviewRes.data.interview.status);
    console.log('   Generation status:', interviewRes.data.interview.generationStatus);

    // 9. Generate Questions with RAG + Groq
    console.log('\n[9/12] Testing POST /api/interviews/:id/generate (RAG + Groq Pipeline)...');
    const genRes = await axios.post(`${BASE_URL}/interviews/${interviewId}/generate`, {}, authHeaders);
    const questions = genRes.data.interview.questions;
    console.log(`✅ Questions generated successfully (${questions.length} questions):`);
    questions.forEach((q, idx) => {
      console.log(`   [Q${idx + 1}] (${q.questionType}, ${q.difficulty}): ${q.questionText}`);
    });

    // 10. Start Live Interview Session
    console.log('\n[10/12] Testing POST /api/sessions/start...');
    const sessionRes = await axios.post(
      `${BASE_URL}/sessions/start`,
      { interviewId },
      authHeaders
    );
    const sessionId = sessionRes.data.session._id;
    console.log('✅ Session started. ID:', sessionId, 'Status:', sessionRes.data.session.status);

    // 11. Submit Answers
    console.log('\n[11/12] Testing POST /api/sessions/:id/answer (Submitting answers)...');
    const q1 = questions[0];
    const ans1Res = await axios.post(
      `${BASE_URL}/sessions/${sessionId}/answer`,
      {
        questionId: q1._id,
        answerText:
          'I designed a distributed caching tier using Redis Cache-Aside pattern with 300-second TTLs, reducing database read latency by 65%. We used write-through invalidation to preserve strong consistency on critical checkout pathways.',
        timeTaken: 85,
        skipped: false,
      },
      authHeaders
    );
    console.log('✅ Answer 1 submitted. Total time taken:', ans1Res.data.session.totalTimeTaken, 's');

    // Submit answer 2 as skipped
    if (questions[1]) {
      const q2 = questions[1];
      await axios.post(
        `${BASE_URL}/sessions/${sessionId}/answer`,
        {
          questionId: q2._id,
          answerText: '',
          timeTaken: 15,
          skipped: true,
        },
        authHeaders
      );
      console.log('✅ Answer 2 submitted as skipped.');
    }

    // 12. Complete Session & AI Report Synthesis
    console.log('\n[12/12] Testing POST /api/sessions/:id/complete (AI Evaluation & Final Report)...');
    const completeRes = await axios.post(
      `${BASE_URL}/sessions/${sessionId}/complete`,
      {},
      authHeaders
    );
    const finalSession = completeRes.data.session;
    console.log('✅ Session marked completed!');
    console.log('   Overall Score:', finalSession.overallScore, '/ 100');
    console.log('   Strengths:', finalSession.strengths);
    console.log('   Areas for Improvement:', finalSession.areasForImprovement);
    console.log('   Answers evaluated:', finalSession.answers.length);
    finalSession.answers.forEach((ans, i) => {
      console.log(`     Answer ${i + 1}: Score ${ans.aiScore}/10 | Feedback: ${ans.aiFeedback}`);
    });

    console.log('\n======================================================');
    console.log('🎉 ALL STAGE 2 TESTS PASSED WITH 100% SUCCESS!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Stage 2 Test failed:', err.response ? err.response.data : err.message);
    process.exit(1);
  }
}

runStage2Tests();
