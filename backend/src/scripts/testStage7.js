const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

const runTest = async () => {
  console.log('====================================================');
  console.log('  Stage 7: Paid Plans & Monetization Verification');
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
    // 1. Test GET /api/billing/plans
    console.log('[Test 1] Checking active subscription plans...');
    const plansRes = await axios.get(`${BASE_URL}/billing/plans`);
    assert(plansRes.status === 200, 'GET /api/billing/plans returns 200 OK');
    const plans = plansRes.data.data;
    assert(Array.isArray(plans) && plans.length === 4, 'All 4 default plans (Free, Basic, Medium, Advanced) auto-seeded');

    const freePlan = plans.find((p) => p.name === 'free');
    const basicPlan = plans.find((p) => p.name === 'basic');
    const mediumPlan = plans.find((p) => p.name === 'medium');
    const advancedPlan = plans.find((p) => p.name === 'advanced');

    assert(freePlan && freePlan.priceMonthly === 0 && freePlan.creditQuota === 2, 'Free plan configured (₹0, 2 quota)');
    assert(basicPlan && basicPlan.priceMonthly === 99 && basicPlan.creditQuota === 5, 'Basic plan configured (₹99, 5 quota)');
    assert(mediumPlan && mediumPlan.priceMonthly === 149 && mediumPlan.creditQuota === 10, 'Medium plan configured (₹149, 10 quota)');
    assert(advancedPlan && advancedPlan.priceMonthly === 199 && advancedPlan.creditQuota === 20, 'Advanced plan configured (₹199, 20 quota)');

    // 2. Test candidate registration & default free tier credits
    console.log('\n[Test 2] Registering candidate & verifying free tier quota...');
    const testEmail = `candidate_stage7_${Date.now()}@test.com`;
    const regRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Stage7 Candidate',
      email: testEmail,
      password: 'Password123',
    });
    assert(regRes.status === 201, 'Candidate registration returns 201 Created');
    const candidateToken = regRes.data.accessToken || regRes.data.data?.accessToken;
    const candidateUser = regRes.data.user || regRes.data.data?.user;

    const authHeaders = { headers: { Authorization: `Bearer ${candidateToken}` } };

    const meRes = await axios.get(`${BASE_URL}/auth/me`, authHeaders);
    const meData = meRes.data.user || meRes.data.data;
    assert(meData.credits === 2, 'New candidate initialized with 2 free interview credits');
    assert(meData.plan === 'free', 'New candidate initialized on "free" plan');

    // 3. Test interview creation and credit deduction on generation
    console.log('\n[Test 3] Creating interview & testing credit deduction...');
    const sampleJD = 'We are seeking an experienced Backend Platform Engineer to build high-concurrency microservices, distributed caching layers, and real-time APIs.';

    const interviewRes = await axios.post(
      `${BASE_URL}/interviews`,
      {
        jobTitle: 'Backend Platform Engineer',
        jobDescription: sampleJD,
        experienceLevel: 'senior',
        numberOfQuestions: 3,
      },
      authHeaders
    );
    assert(interviewRes.status === 201, 'Draft interview created');
    const interviewId = interviewRes.data.interview._id;

    const genRes = await axios.post(
      `${BASE_URL}/interviews/${interviewId}/generate`,
      {},
      authHeaders
    );
    assert(genRes.status === 200, 'Question generation succeeded');
    assert(genRes.data.remainingCredits === 1, 'Remaining credits decremented from 2 to 1');

    // 4. Test planGuard blocking when credits are depleted
    console.log('\n[Test 4] Depleting credits and testing planGuard 402 rejection...');
    // Create and generate another interview to drop to 0 credits
    const interview2Res = await axios.post(
      `${BASE_URL}/interviews`,
      { 
        jobTitle: 'Full Stack Engineer', 
        jobDescription: sampleJD,
        numberOfQuestions: 3 
      },
      authHeaders
    );
    const gen2Res = await axios.post(
      `${BASE_URL}/interviews/${interview2Res.data.interview._id}/generate`,
      {},
      authHeaders
    );
    assert(gen2Res.data.remainingCredits === 0, 'Second interview dropped credit balance to 0');

    // Now attempt a third generation with 0 credits
    const interview3Res = await axios.post(
      `${BASE_URL}/interviews`,
      { 
        jobTitle: 'DevOps Engineer', 
        jobDescription: sampleJD,
        numberOfQuestions: 3 
      },
      authHeaders
    );

    let planGuardBlocked = false;
    try {
      await axios.post(
        `${BASE_URL}/interviews/${interview3Res.data.interview._id}/generate`,
        {},
        authHeaders
      );
    } catch (err) {
      if (err.response?.status === 402 && err.response?.data?.code === 'INSUFFICIENT_CREDITS') {
        planGuardBlocked = true;
      }
    }
    assert(planGuardBlocked, 'planGuard blocked generation with HTTP 402 INSUFFICIENT_CREDITS');

    // 5. Test Checkout Session Creation
    console.log('\n[Test 5] Testing Stripe Checkout Session creation...');
    const checkoutRes = await axios.post(
      `${BASE_URL}/billing/checkout`,
      {
        planId: mediumPlan._id,
        billingCycle: 'monthly',
      },
      authHeaders
    );
    assert(checkoutRes.status === 200, 'POST /api/billing/checkout returns 200 OK');
    assert(checkoutRes.data.data.sessionId && checkoutRes.data.data.checkoutUrl, 'Checkout session ID and checkout URL returned');

    // 6. Test Instant Upgrade / Simulated Payment
    console.log('\n[Test 6] Testing plan upgrade to Medium Tier (₹149 / 10 credits)...');
    const upgradeRes = await axios.post(
      `${BASE_URL}/billing/test-upgrade`,
      {
        planName: 'medium',
        billingCycle: 'monthly',
      },
      authHeaders
    );
    assert(upgradeRes.status === 200, 'POST /api/billing/test-upgrade returns 200 OK');
    assert(upgradeRes.data.data.user.plan === 'medium', 'User plan upgraded to "medium"');
    assert(upgradeRes.data.data.user.credits === 10, 'User received 10 credit refill for Medium tier');
    assert(upgradeRes.data.data.user.isPremium === true, 'User isPremium flag enabled');

    // 7. Test Billing Status
    console.log('\n[Test 7] Checking candidate billing status & transaction history...');
    const statusRes = await axios.get(`${BASE_URL}/billing/status`, authHeaders);
    assert(statusRes.status === 200, 'GET /api/billing/status returns 200 OK');
    assert(statusRes.data.data.plan === 'medium', 'Billing status reflects medium plan');
    assert(statusRes.data.data.transactions?.length > 0, 'Completed transaction recorded in ledger');

    // 8. Test Subscription Cancellation
    console.log('\n[Test 8] Testing subscription auto-renewal cancellation...');
    const cancelRes = await axios.post(`${BASE_URL}/billing/cancel`, {}, authHeaders);
    assert(cancelRes.status === 200, 'POST /api/billing/cancel returns 200 OK');
    assert(cancelRes.data.data.billingCycle === null, 'User billingCycle set to null (will not auto-renew)');

    // 9. Verify Question Generation with newly upgraded balance
    console.log('\n[Test 9] Re-verifying question generation with upgraded credits...');
    const interview4Res = await axios.post(
      `${BASE_URL}/interviews`,
      { 
        jobTitle: 'Principal Architect', 
        jobDescription: sampleJD,
        numberOfQuestions: 3 
      },
      authHeaders
    );
    const gen4Res = await axios.post(
      `${BASE_URL}/interviews/${interview4Res.data.interview._id}/generate`,
      {},
      authHeaders
    );
    assert(gen4Res.status === 200, 'Question generation succeeds with upgraded balance');
    assert(gen4Res.data.remainingCredits === 9, 'Credit decremented from 10 to 9');

  } catch (error) {
    console.error('Test execution exception:', error.response?.data || error.message);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`  Stage 7 Results: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
};

runTest();
