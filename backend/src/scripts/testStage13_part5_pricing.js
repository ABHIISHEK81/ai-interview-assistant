const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

const runTest = async () => {
  console.log('================================================================');
  console.log('  Part 5: Credit System & Subscription Pricing Structure Test');
  console.log('================================================================\n');

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
    // ---------------------------------------------------------
    // TEST 1: Verify Subscription Pricing Plans (Visible on Website)
    // ---------------------------------------------------------
    console.log('[Test 1] Verifying public subscription pricing plans structure...');
    const plansRes = await axios.get(`${BASE_URL}/billing/plans`);
    assert(plansRes.status === 200, 'GET /api/billing/plans returns 200 OK');
    const plans = plansRes.data.data;
    assert(Array.isArray(plans) && plans.length === 4, 'Returns 4 active plans: Free, 1-Month, 3-Months, 1-Year');

    const freePlan = plans.find((p) => p.name === 'free');
    const oneMonthPlan = plans.find((p) => p.name === '1-month');
    const threeMonthsPlan = plans.find((p) => p.name === '3-months');
    const oneYearPlan = plans.find((p) => p.name === '1-year');

    // 1 Month Plan: 10 Credits, ₹249, Valid for 1 month; unused credits expire
    assert(
      oneMonthPlan && oneMonthPlan.priceMonthly === 249 && oneMonthPlan.creditQuota === 10,
      '1 Month Plan matches: 10 Credits | ₹249 INR | Valid for 1 month'
    );

    // 3 Months Plan: 30 Credits, ₹449, Distributed over 3 months
    assert(
      threeMonthsPlan && threeMonthsPlan.priceMonthly === 449 && threeMonthsPlan.creditQuota === 30,
      '3 Months Plan matches: 30 Credits | ₹449 INR | Distributed over 3 months'
    );

    // 1 Year Plan: Direct Access / Annual Pool, ₹2500, Full upfront annual payment
    assert(
      oneYearPlan && oneYearPlan.priceMonthly === 2500 && oneYearPlan.priceAnnual === 2500,
      '1 Year Plan matches: Direct Access / Annual Pool | ₹2500 INR | Upfront annual'
    );

    // Free Trial Demo
    assert(
      freePlan && freePlan.priceMonthly === 0 && freePlan.creditQuota === 2,
      'Free Trial Plan matches: 2 Free Demo Credits | ₹0 INR'
    );

    // ---------------------------------------------------------
    // TEST 2: New User Free Trial & Signup Policy (2 Free Credits)
    // ---------------------------------------------------------
    console.log('\n[Test 2] Testing New User Free Trial Policy on registration...');
    const uniqueEmail = `trial_candidate_${Date.now()}@test.com`;
    const regRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Free Trial User',
      email: uniqueEmail,
      password: 'TrialPassword123!',
    });
    assert(regRes.status === 201, 'New user successfully registered');
    const userToken = regRes.data.accessToken || regRes.data.data?.accessToken;
    const userId = regRes.data.user?._id || regRes.data.data?.user?._id;
    const authHeaders = { headers: { Authorization: `Bearer ${userToken}` } };

    const meRes = await axios.get(`${BASE_URL}/auth/me`, authHeaders);
    const me = meRes.data.user || meRes.data.data;
    assert(me.credits === 2, 'New user receives exactly 2 free demo credits on signup');
    assert(me.freeTrialClaimed === true, 'freeTrialClaimed flag is set to true');
    assert(me.creditsExpiresAt !== null, 'creditsExpiresAt timestamp initialized for monthly validity cycle');

    // Check validity duration is ~30 days
    const validityMs = new Date(me.creditsExpiresAt) - new Date();
    const validityDays = Math.round(validityMs / (1000 * 60 * 60 * 24));
    assert(validityDays >= 29 && validityDays <= 31, `Validity period matches 30-day monthly cycle (~${validityDays} days)`);

    // ---------------------------------------------------------
    // TEST 3: Anti-Abuse Restriction (1 claim per unique email)
    // ---------------------------------------------------------
    console.log('\n[Test 3] Verifying anti-abuse restriction (1 claim per unique email)...');
    try {
      await axios.post(`${BASE_URL}/auth/register`, {
        name: 'Duplicate Claim Attempt',
        email: uniqueEmail,
        password: 'TrialPassword123!',
      });
      assert(false, 'Should have blocked duplicate registration with same email');
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data?.error || '';
      assert(
        err.response?.status === 400 && errMsg.includes('already exists'),
        'Duplicate registration blocked with 400 Bad Request'
      );
    }

    // ---------------------------------------------------------
    // Admin Authentication for simulating temporal transitions
    // ---------------------------------------------------------
    const adminLoginRes = await axios.post(`${BASE_URL}/admin/auth/login`, {
      email: 'aftab@admin.com',
      password: 'passwore123',
    });
    const adminToken = adminLoginRes.data.accessToken || adminLoginRes.data.data?.accessToken;
    const adminHeaders = { headers: { Authorization: `Bearer ${adminToken}` } };

    // ---------------------------------------------------------
    // TEST 4: Credit Expiration & Monthly Validity Enforcement
    // ---------------------------------------------------------
    console.log('\n[Test 4] Verifying Credit Expiration: unused credits expire at period end and do not roll over...');
    
    // Simulate expiration of monthly cycle via Admin API
    const pastDate = new Date(Date.now() - 60000).toISOString();
    await axios.patch(
      `${BASE_URL}/admin/users/${userId}`,
      { creditsExpiresAt: pastDate },
      adminHeaders
    );

    // Create a mock interview
    const createInterviewRes = await axios.post(
      `${BASE_URL}/interviews`,
      {
        jobTitle: 'Senior Software Engineer',
        jobDescription: 'Design microservices and maintain high availability systems.',
        targetRole: 'fullstack',
        experienceLevel: 'senior',
      },
      authHeaders
    );
    const interviewId = createInterviewRes.data.data?._id || createInterviewRes.data.interview?._id;

    // Now call generate questions which is protected by requireCredit
    try {
      await axios.post(`${BASE_URL}/interviews/${interviewId}/generate`, {}, authHeaders);
      assert(false, 'Should have rejected request due to expired credits');
    } catch (err) {
      assert(
        err.response?.status === 402,
        'requireCredit returned 402 Payment Required when credits are expired'
      );
      assert(
        err.response?.data?.error?.includes('expired') || err.response?.data?.code === 'INSUFFICIENT_CREDITS',
        'Returned clear credit expiration error: unused credits expire at monthly cycle'
      );
    }

    // Verify credits were expired to 0 in database (strict no-rollover rule)
    const refreshedMe = await axios.get(`${BASE_URL}/auth/me`, authHeaders);
    assert(refreshedMe.data.data.credits === 0, 'Unused credits strictly reset to 0 upon cycle expiration (no rollover)');

    // ---------------------------------------------------------
    // TEST 5: 1 Month Plan Subscription (₹249, 10 Credits)
    // ---------------------------------------------------------
    console.log('\n[Test 5] Testing 1 Month Plan Upgrade (₹249 / 10 Credits / 1 Month validity)...');
    const upgrade1MoRes = await axios.post(
      `${BASE_URL}/billing/test-upgrade`,
      { planName: '1-month', billingCycle: 'monthly' },
      authHeaders
    );
    assert(upgrade1MoRes.status === 200, 'Test upgrade to 1-month plan returned 200 OK');
    const u1 = upgrade1MoRes.data.data.user;
    assert(u1.plan === '1-month', 'User plan set to "1-month"');
    assert(u1.credits === 10, 'Allocated exactly 10 Credits for 1 Month Plan');
    assert(u1.monthsRemainingInPlan === 1, 'monthsRemainingInPlan set to 1');
    assert(upgrade1MoRes.data.data.transaction.amount === 249, 'Transaction billed at ₹249 INR');

    // ---------------------------------------------------------
    // TEST 6: 3 Months Plan Subscription (₹449, 30 Credits over 3 Months)
    // ---------------------------------------------------------
    console.log('\n[Test 6] Testing 3 Months Plan Upgrade (₹449 / 30 Credits distributed over 3 months)...');
    const upgrade3MoRes = await axios.post(
      `${BASE_URL}/billing/test-upgrade`,
      { planName: '3-months', billingCycle: 'quarterly' },
      authHeaders
    );
    assert(upgrade3MoRes.status === 200, 'Test upgrade to 3-months plan returned 200 OK');
    const u3 = upgrade3MoRes.data.data.user;
    assert(u3.plan === '3-months', 'User plan set to "3-months"');
    assert(u3.credits === 10, 'Month 1 allocated 10 Credits (distributed over 3 months)');
    assert(u3.monthsRemainingInPlan === 3, 'monthsRemainingInPlan initialized to 3');
    assert(upgrade3MoRes.data.data.transaction.amount === 449, 'Transaction billed at ₹449 INR');

    // Test transition from Month 1 to Month 2 with strict credit expiration
    console.log('\n[Test 6b] Simulating Month 1 completion on 3-month plan (expire unused, distribute next 10 credits)...');
    await axios.patch(
      `${BASE_URL}/admin/users/${userId}`,
      { 
        creditsExpiresAt: new Date(Date.now() - 1000).toISOString(),
        credits: 4, // 4 unused credits left in Month 1
      },
      adminHeaders
    );

    // Trigger renewal cycle
    await axios.post(`${BASE_URL}/billing/process-renewals`, {}, authHeaders);

    const month2Me = await axios.get(`${BASE_URL}/auth/me`, authHeaders);
    const month2User = month2Me.data.data;
    assert(
      month2User.credits === 10,
      'Old unused credits expired and fresh 10 credits allocated for Month 2 (no rollover accumulation)'
    );
    assert(
      month2User.monthsRemainingInPlan === 2,
      'monthsRemainingInPlan decremented to 2'
    );

    // ---------------------------------------------------------
    // TEST 7: 1 Year Plan Subscription (₹2500, Direct Access / Annual Pool)
    // ---------------------------------------------------------
    console.log('\n[Test 7] Testing 1 Year Plan Upgrade (₹2500 / Direct Access / Annual Pool)...');
    const upgrade1YrRes = await axios.post(
      `${BASE_URL}/billing/test-upgrade`,
      { planName: '1-year', billingCycle: 'annual' },
      authHeaders
    );
    assert(upgrade1YrRes.status === 200, 'Test upgrade to 1-year plan returned 200 OK');
    const uYr = upgrade1YrRes.data.data.user;
    assert(uYr.plan === '1-year', 'User plan set to "1-year"');
    assert(uYr.hasDirectAccess === true, 'hasDirectAccess set to true for continuous platform access');
    assert(uYr.credits >= 100, 'Allocated generous Annual Pool credits (120 credits)');
    assert(upgrade1YrRes.data.data.transaction.amount === 2500, 'Transaction billed at ₹2500 INR upfront');

    const yearExpiryMs = new Date(uYr.planExpiresAt) - new Date();
    const yearDays = Math.round(yearExpiryMs / (1000 * 60 * 60 * 24));
    assert(yearDays >= 360 && yearDays <= 366, `Plan validity set to continuous 365 days (~${yearDays} days)`);

    // ---------------------------------------------------------
    // TEST 8: Candidate Billing Status Endpoint
    // ---------------------------------------------------------
    console.log('\n[Test 8] Checking Candidate Billing Status endpoint...');
    const statusRes = await axios.get(`${BASE_URL}/billing/status`, authHeaders);
    assert(statusRes.status === 200, 'GET /api/billing/status returns 200 OK');
    const statusData = statusRes.data.data;
    assert(statusData.plan === '1-year', 'Billing status reflects active 1-year plan');
    assert(statusData.hasDirectAccess === true, 'hasDirectAccess is reflected in billing status');
    assert(Array.isArray(statusData.transactions) && statusData.transactions.length >= 3, 'Transaction history tracked in billing status');

    // ---------------------------------------------------------
    // TEST 9: OAuth Registration Free Trial Policy
    // ---------------------------------------------------------
    console.log('\n[Test 9] Testing OAuth registration free trial policy (2 free credits, 1 claim per unique email)...');
    const oauthEmail = `oauth_trial_${Date.now()}@google.test`;
    const oauthRes = await axios.post(`${BASE_URL}/auth/oauth`, {
      provider: 'google',
      profile: {
        id: `google_${Date.now()}`,
        name: 'OAuth Trial Candidate',
        email: oauthEmail,
      },
    });
    assert(oauthRes.status === 201, 'New OAuth candidate registered with 201 Created');
    const oauthUser = oauthRes.data.user || oauthRes.data.data?.user;
    assert(oauthUser.credits === 2, 'New OAuth user receives 2 free demo credits');
    assert(oauthUser.freeTrialClaimed === true, 'OAuth user has freeTrialClaimed set to true');

  } catch (error) {
    console.error('Test execution failed with error:', error.response?.data || error.message);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`  Part 5 Verification Complete: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

runTest();
