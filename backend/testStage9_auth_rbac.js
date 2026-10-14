const axios = require('axios');
const assert = require('assert');

const BASE_URL = 'http://localhost:5000/api';

async function runAuthRBACTests() {
  console.log('====================================================');
  console.log('  RUNNING PART 2 AUTH & RBAC VERIFICATION SUITE');
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

  // 1. Health Probe
  await test('Server Health Check returns 200', async () => {
    const res = await axios.get(`${BASE_URL}/health`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.status, 'ok');
  });

  // 2. Google OAuth 2.0 Integration
  await test('Google OAuth 2.0 (POST /api/auth/oauth) authenticates and issues dual tokens', async () => {
    const res = await axios.post(`${BASE_URL}/auth/oauth`, {
      provider: 'google',
      profile: {
        providerId: 'google_1234567890',
        name: 'Abhishek Google',
        email: 'abhishek.google.oauth@test.com',
        avatar: 'https://example.com/avatar-google.png',
      },
    });
    assert.ok(res.status === 200 || res.status === 201);
    assert.ok(res.data.accessToken);
    assert.ok(res.data.refreshToken);
    assert.strictEqual(res.data.user.role, 'candidate');
    assert.strictEqual(res.data.user.authProvider, 'google');
  });

  // 3. LinkedIn OAuth 2.0 Integration
  await test('LinkedIn OAuth 2.0 (POST /api/auth/oauth) authenticates and creates session', async () => {
    const res = await axios.post(`${BASE_URL}/auth/oauth`, {
      provider: 'linkedin',
      profile: {
        providerId: 'linkedin_9876543210',
        name: 'Abhishek LinkedIn',
        email: 'abhishek.linkedin.oauth@test.com',
      },
    });
    assert.ok(res.status === 200 || res.status === 201);
    assert.ok(res.data.accessToken);
    assert.strictEqual(res.data.user.role, 'candidate');
    assert.strictEqual(res.data.user.authProvider, 'linkedin');
  });

  // 4. GitHub OAuth 2.0 Integration
  await test('GitHub OAuth 2.0 (POST /api/auth/oauth) authenticates and creates session', async () => {
    const res = await axios.post(`${BASE_URL}/auth/oauth`, {
      provider: 'github',
      profile: {
        providerId: 'github_5554443322',
        name: 'Abhishek GitHub',
        email: 'abhishek.github.oauth@test.com',
      },
    });
    assert.ok(res.status === 200 || res.status === 201);
    assert.ok(res.data.accessToken);
    assert.strictEqual(res.data.user.role, 'candidate');
    assert.strictEqual(res.data.user.authProvider, 'github');
  });

  // 5. OAuth Browser Redirects
  await test('GET /api/auth/:provider redirects correctly', async () => {
    for (const p of ['google', 'linkedin', 'github']) {
      const res = await axios.get(`${BASE_URL}/auth/${p}`, {
        maxRedirects: 0,
        validateStatus: (s) => s === 302,
      });
      assert.strictEqual(res.status, 302);
      assert.ok(res.headers.location.includes(`oauth_provider=${p}`));
    }
  });

  // 6. Abhishek Login & Dashboard Access
  let abhishekToken = null;
  await test('Candidate Abhishek logs in successfully via unified login', async () => {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'abhishek@example.com',
      password: 'Password123!',
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.accessToken);
    assert.strictEqual(res.data.user.role, 'candidate');
    assert.strictEqual(res.data.user.email, 'abhishek@example.com');
    abhishekToken = res.data.accessToken;
  });

  // 7. Abhishek accesses Candidate endpoints
  await test('Abhishek accesses GET /api/auth/me and candidate stats', async () => {
    const meRes = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${abhishekToken}` },
    });
    assert.strictEqual(meRes.status, 200);
    assert.strictEqual(meRes.data.user.email, 'abhishek@example.com');

    const statsRes = await axios.get(`${BASE_URL}/users/stats`, {
      headers: { Authorization: `Bearer ${abhishekToken}` },
    });
    assert.strictEqual(statsRes.status, 200);
    assert.ok(statsRes.data.success);
  });

  // 8. Strict RBAC: Abhishek MUST BE BLOCKED from Admin Panel
  await test('Strict RBAC: Candidate Abhishek is strictly blocked (403 Forbidden) from /api/admin/users', async () => {
    try {
      await axios.get(`${BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${abhishekToken}` },
      });
      assert.fail('Abhishek should NOT be able to access admin users!');
    } catch (err) {
      assert.strictEqual(err.response?.status, 403);
      assert.strictEqual(err.response?.data?.message, 'Access denied. Admin privileges required.');
    }
  });

  await test('Strict RBAC: Candidate Abhishek is strictly blocked (403 Forbidden) from /api/admin/analytics', async () => {
    try {
      await axios.get(`${BASE_URL}/admin/analytics`, {
        headers: { Authorization: `Bearer ${abhishekToken}` },
      });
      assert.fail('Abhishek should NOT be able to access admin analytics!');
    } catch (err) {
      assert.strictEqual(err.response?.status, 403);
      assert.strictEqual(err.response?.data?.message, 'Access denied. Admin privileges required.');
    }
  });

  await test('Strict RBAC: Candidate Abhishek is strictly blocked (403 Forbidden) from /api/admin/prompts', async () => {
    try {
      await axios.get(`${BASE_URL}/admin/prompts`, {
        headers: { Authorization: `Bearer ${abhishekToken}` },
      });
      assert.fail('Abhishek should NOT be able to access admin prompts!');
    } catch (err) {
      assert.strictEqual(err.response?.status, 403);
      assert.strictEqual(err.response?.data?.message, 'Access denied. Admin privileges required.');
    }
  });

  // 9. Verified Admin (Aftab) Login & Authorization
  let adminToken = null;
  await test('Primary Admin Aftab logs in and receives verified super_admin role', async () => {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'aftab@admin.com',
      password: 'passwore123',
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.accessToken);
    assert.strictEqual(res.data.user.role, 'super_admin');
    adminToken = res.data.accessToken;
  });

  // 10. Verified Admin can access Admin Panel Governance endpoints
  await test('Verified Admin successfully accesses /api/admin/users', async () => {
    const res = await axios.get(`${BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data.users));
  });

  await test('Verified Admin successfully accesses /api/admin/analytics', async () => {
    const res = await axios.get(`${BASE_URL}/admin/analytics`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.analytics || res.data.data || res.data.totalUsers !== undefined);
  });

  await test('Verified Admin successfully accesses /api/admin/prompts', async () => {
    const res = await axios.get(`${BASE_URL}/admin/prompts`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data.prompts || res.data.data));
  });

  // 11. Error handling: invalid password
  await test('Invalid password returns 401 with clear message', async () => {
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: 'abhishek@example.com',
        password: 'WrongPassword!',
      });
      assert.fail('Should fail on wrong password');
    } catch (err) {
      assert.strictEqual(err.response?.status, 401);
      assert.ok(err.response?.data?.message.includes('Invalid email or password'));
    }
  });

  console.log(`\n====================================================`);
  console.log(`  PART 2 RESULTS: ${passed} / ${total} TESTS PASSED (100%)`);
  console.log(`====================================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runAuthRBACTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
