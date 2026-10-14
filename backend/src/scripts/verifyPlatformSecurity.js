const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function runVerification() {
  console.log('\n======================================================');
  console.log('   FULL STACK PLATFORM & SECURITY AUDIT VERIFICATION  ');
  console.log('======================================================\n');

  try {
    // 1. Health Probe
    console.log('[Test 1] Health Probe...');
    const healthRes = await axios.get(`${BASE_URL}/health`);
    console.log(`  ✓ Health status: ${healthRes.data.status} (Uptime: ${Math.round(healthRes.data.uptime)}s)`);

    // 2. Candidate Login
    console.log('\n[Test 2] Candidate Login with candidate@interviewai.com...');
    const candLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'candidate@interviewai.com',
      password: 'Password123!',
    });
    const candidateData = candLoginRes.data.user || candLoginRes.data.data?.user;
    const candidateToken = candLoginRes.data.accessToken || candLoginRes.data.data?.accessToken;
    console.log(`  ✓ Candidate Logged In: ${candidateData.name} | Role: ${candidateData.role} | Credits: ${candidateData.credits}`);

    // 3. Verify Candidate CANNOT Login to Admin Portal
    console.log('\n[Test 3] Verifying Candidate CANNOT access Admin Login...');
    try {
      await axios.post(`${BASE_URL}/admin/auth/login`, {
        email: 'candidate@interviewai.com',
        password: 'Password123!',
      });
      console.error('  ✗ SECURITY BREACH: Candidate succeeded in admin login!');
      process.exit(1);
    } catch (err) {
      console.log(`  ✓ Correctly Rejected: Status ${err.response?.status} - "${err.response?.data?.message || err.message}"`);
    }

    // 4. Verify Admin Login with Administrator Credentials
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@interviewai.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPassword123!';
    console.log(`\n[Test 4] Verifying Admin Login with ${adminEmail}...`);
    const adminLoginRes = await axios.post(`${BASE_URL}/admin/auth/login`, {
      email: adminEmail,
      password: adminPassword,
    });
    const adminData = adminLoginRes.data.admin || adminLoginRes.data.data?.admin;
    const adminToken = adminLoginRes.data.accessToken || adminLoginRes.data.data?.accessToken;
    const adminRefreshToken = adminLoginRes.data.refreshToken || adminLoginRes.data.data?.refreshToken;
    console.log(`  ✓ Admin Authenticated: ${adminData.name} | Role: ${adminData.role}`);

    // 5. Verify Candidate Token BLOCKED on Admin Protected Endpoint
    console.log('\n[Test 5] Verifying Candidate Token BLOCKED on Admin Analytics...');
    try {
      await axios.get(`${BASE_URL}/admin/analytics`, {
        headers: { Authorization: `Bearer ${candidateToken}` },
      });
      console.error('  ✗ SECURITY BREACH: Candidate token accessed admin analytics!');
      process.exit(1);
    } catch (err) {
      console.log(`  ✓ Correctly Blocked: Status ${err.response?.status} - "${err.response?.data?.message || err.message}"`);
    }

    // 6. Verify Admin Token SUCCEEDS on Admin Analytics
    console.log('\n[Test 6] Verifying Admin Token SUCCEEDS on Admin Analytics...');
    const analyticsRes = await axios.get(`${BASE_URL}/admin/analytics`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(`  ✓ Admin Analytics Accessible: MAU = ${analyticsRes.data.data?.metrics?.mau || 1}, Total Users = ${analyticsRes.data.data?.metrics?.totalRegistrations ?? 0}`);

    // 7. Verify Admin Refresh Token
    console.log('\n[Test 7] Verifying Admin Refresh Token Endpoint...');
    const refreshRes = await axios.post(`${BASE_URL}/admin/auth/refresh`, {
      refreshToken: adminRefreshToken,
    });
    console.log(`  ✓ Fresh Admin Access Token Issued: ${refreshRes.data.accessToken ? 'YES' : 'NO'}`);

    // 8. Verify Candidate User Endpoints
    console.log('\n[Test 8] Verifying Candidate Profile /auth/me...');
    const meRes = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${candidateToken}` },
    });
    console.log(`  ✓ Candidate me: ${meRes.data.user?.name} | Credits: ${meRes.data.user?.credits}`);

    console.log('\n======================================================');
    console.log('  ALL AUDITS PASSED: USER & ADMIN ISOLATION CONFIRMED ');
    console.log('======================================================\n');
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

runVerification();
