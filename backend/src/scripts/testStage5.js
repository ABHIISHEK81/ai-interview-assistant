/**
 * Stage 5 Verification Script
 * Validates Admin Auth, RBAC permissions, Admin CRUD (Users, Jobs, Prompts, Templates),
 * System Prompt Versioning & Rollback, Platform Analytics, and Scraper Control.
 */

const axios = require('axios');
const BASE_URL = 'http://localhost:5000/api';

async function runStage5Tests() {
  console.log('--- Starting Stage 5 Admin System Verification ---\n');

  try {
    // 1. Admin Login
    console.log('[1/14] Testing POST /api/admin/auth/login...');
    const adminLoginRes = await axios.post(`${BASE_URL}/admin/auth/login`, {
      email: 'aftab@admin.com',
      password: 'passwore123',
    });
    console.log('✅ Admin login successful! Role:', adminLoginRes.data.admin.role);
    const adminToken = adminLoginRes.data.accessToken;
    const adminHeaders = { headers: { Authorization: `Bearer ${adminToken}` } };

    // 2. Candidate Token Block Test
    console.log('\n[2/14] Testing candidate token rejection on admin route (403 expected)...');
    const candEmail = `candidate_test_${Date.now()}@example.com`;
    const candRegRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Test Candidate',
      email: candEmail,
      password: 'Password123!',
    });
    const candidateToken = candRegRes.data.accessToken;

    try {
      await axios.get(`${BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${candidateToken}` },
      });
      console.error('❌ Candidate token unexpectedly accessed admin route');
      process.exit(1);
    } catch (err403) {
      if (err403.response && err403.response.status === 403) {
        console.log('✅ 403 Forbidden received as expected: Access denied. Admin privileges required.');
      } else {
        throw err403;
      }
    }

    // 3. Platform Analytics
    console.log('\n[3/14] Testing GET /api/admin/analytics...');
    const analyticsRes = await axios.get(`${BASE_URL}/admin/analytics`, adminHeaders);
    console.log('✅ Platform analytics retrieved:');
    console.log('   Users Total:', analyticsRes.data.analytics.users.total);
    console.log('   Interviews Total:', analyticsRes.data.analytics.interviews.total);
    console.log('   Sessions Total:', analyticsRes.data.analytics.sessions.total);
    console.log('   Active Jobs:', analyticsRes.data.analytics.jobs.activeTotal);

    // 4. User Management - List Users
    console.log('\n[4/14] Testing GET /api/admin/users...');
    const usersRes = await axios.get(`${BASE_URL}/admin/users?limit=5`, adminHeaders);
    console.log(`✅ Users listed. Total: ${usersRes.data.total}, Page: ${usersRes.data.page}, Count: ${usersRes.data.users.length}`);

    // 5. User Management - Update User
    console.log('\n[5/14] Testing PATCH /api/admin/users/:id...');
    const targetUserId = candRegRes.data.user._id;
    const updateRes = await axios.patch(
      `${BASE_URL}/admin/users/${targetUserId}`,
      {
        creditsChange: 10,
        isPremium: true,
      },
      adminHeaders
    );
    console.log('✅ User updated! New Credits:', updateRes.data.user.credits, 'isPremium:', updateRes.data.user.isPremium);

    // 6. User Management - Get User Detail
    console.log('\n[6/14] Testing GET /api/admin/users/:id...');
    const userDetailRes = await axios.get(`${BASE_URL}/admin/users/${targetUserId}`, adminHeaders);
    console.log('✅ User details retrieved with aggregate counts:', userDetailRes.data.counts);

    // 7. Job Management - Create Job via Admin
    console.log('\n[7/14] Testing POST /api/admin/jobs...');
    const createJobRes = await axios.post(
      `${BASE_URL}/admin/jobs`,
      {
        title: 'Staff Distributed Systems Architect',
        company: 'Enterprise Core Systems',
        location: 'Remote',
        description: 'Design multi-region active-active cloud architectures using Go, Kubernetes, and Cassandra.',
        contractType: 'full_time',
        salaryMin: 3500000,
        salaryMax: 5000000,
        skills: ['Go', 'Kubernetes', 'Distributed Systems', 'Cassandra'],
        isPinned: true,
        isFeatured: true,
      },
      adminHeaders
    );
    const createdJobId = createJobRes.data.job._id;
    console.log('✅ Admin job created! ID:', createdJobId, 'Title:', createJobRes.data.job.title);

    // 8. Job Management - List Admin Jobs
    console.log('\n[8/14] Testing GET /api/admin/jobs...');
    const adminJobsRes = await axios.get(`${BASE_URL}/admin/jobs?filterType=pinned`, adminHeaders);
    console.log('✅ Pinned admin jobs count:', adminJobsRes.data.jobs.length);

    // 9. System Prompts - List Prompts
    console.log('\n[9/14] Testing GET /api/admin/prompts...');
    const promptsRes = await axios.get(`${BASE_URL}/admin/prompts`, adminHeaders);
    console.log(`✅ System prompts retrieved (${promptsRes.data.prompts.length} categories):`);
    promptsRes.data.prompts.forEach((p) => {
      console.log(`   - [v${p.version}] ${p.category}`);
    });
    const promptToEdit = promptsRes.data.prompts[0];

    // 10. System Prompts - Update Prompt (Version Increment)
    console.log('\n[10/14] Testing PATCH /api/admin/prompts/:id (Version bump)...');
    const updatePromptRes = await axios.patch(
      `${BASE_URL}/admin/prompts/${promptToEdit._id}`,
      { content: promptToEdit.content + '\n# Admin customized note' },
      adminHeaders
    );
    console.log(`✅ Prompt updated! Version bumped from ${promptToEdit.version} to ${updatePromptRes.data.prompt.version}`);
    console.log(`   History items count: ${updatePromptRes.data.prompt.history.length}`);

    // 11. System Prompts - Rollback
    console.log('\n[11/14] Testing POST /api/admin/prompts/:id/rollback (Rollback to v1)...');
    const rollbackRes = await axios.post(
      `${BASE_URL}/admin/prompts/${promptToEdit._id}/rollback`,
      { targetVersion: 1 },
      adminHeaders
    );
    console.log(`✅ Prompt rolled back successfully! Current version: ${rollbackRes.data.prompt.version}`);

    // 12. Interview Templates - Create Template
    console.log('\n[12/14] Testing POST /api/admin/templates...');
    const templateRes = await axios.post(
      `${BASE_URL}/admin/templates`,
      {
        name: 'Senior Full Stack Architecture — Hard',
        difficulty: 'hard',
        duration: 45,
        questionCount: 8,
        systemPrompt: 'You are an architect interviewer. Ask deep architectural trade-off questions.',
        evaluationPrompt: 'Score answers based on system scalability, fault tolerance, and security.',
        feedbackPrompt: 'Provide comprehensive assessment of distributed systems maturity.',
        voiceId: 'onyx',
      },
      adminHeaders
    );
    const templateId = templateRes.data.template._id;
    console.log('✅ Interview template created! ID:', templateId, 'Name:', templateRes.data.template.name);

    // 13. Interview Templates - List Templates
    console.log('\n[13/14] Testing GET /api/admin/templates...');
    const listTemplatesRes = await axios.get(`${BASE_URL}/admin/templates`, adminHeaders);
    console.log(`✅ Templates listed. Total: ${listTemplatesRes.data.total}`);

    // 14. Scraper Controls
    console.log('\n[14/14] Testing Scraper Status & Trigger...');
    const scraperStatusRes = await axios.get(`${BASE_URL}/admin/scraper/status`, adminHeaders);
    console.log('✅ Scraper status:', scraperStatusRes.data.status, 'Total Jobs:', scraperStatusRes.data.totalJobs);

    const scraperRunRes = await axios.post(`${BASE_URL}/admin/scraper/run`, {}, adminHeaders);
    console.log('✅ Scraper manual run response:', scraperRunRes.data.message);

    console.log('\n======================================================');
    console.log('🎉 ALL STAGE 5 TESTS PASSED WITH 100% SUCCESS!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Stage 5 Test failed:', err.response ? err.response.data : err.message);
    process.exit(1);
  }
}

runStage5Tests();
