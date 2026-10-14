/**
 * testStage15_part7_concurrency_load.js
 * Verification script for Part 7: Performance, Scalability & Stability
 * Tests High Concurrency, In-Memory Caching, Process Crash Prevention, and Fast UX.
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
const CLIENT_BASE = 'http://localhost:5173';

let passCount = 0;
let failCount = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${testName} ${details ? `(${details})` : ''}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${details ? `(${details})` : ''}`);
    failCount++;
  }
}

async function runPart7PerformanceTests() {
  console.log('\n===============================================================');
  console.log('   PART 7: PERFORMANCE, SCALABILITY & STABILITY VERIFICATION');
  console.log('===============================================================\n');

  // --- Step 1: System Telemetry & Health Probe ---
  console.log('--- Step 1: Health Probe & System Telemetry ---');
  try {
    const healthRes = await axios.get(`${API_BASE}/health`);
    assert(healthRes.status === 200, 'Health check returns HTTP 200');
    assert(healthRes.data?.status === 'ok', 'Service reports status ok');
    assert(healthRes.data?.database === 'connected', 'Database connection verified');
    assert(typeof healthRes.data?.systemMetrics?.heapUsedMB === 'number', 'System telemetry reports heapUsedMB');
    assert(typeof healthRes.data?.systemMetrics?.cacheEntries === 'number', 'System telemetry reports cacheEntries count');
    console.log(`    System Telemetry: Heap ${healthRes.data.systemMetrics.heapUsedMB} MB, Cache entries: ${healthRes.data.systemMetrics.cacheEntries}`);
  } catch (err) {
    assert(false, 'Health probe check failed', err.message);
  }

  // --- Step 2: In-Memory TTL Caching Sub-Millisecond Latency ---
  console.log('\n--- Step 2: In-Memory TTL Caching & Response Time ---');
  try {
    // 1st request (Cache MISS)
    const t0 = Date.now();
    const res1 = await axios.get(`${API_BASE}/billing/plans`);
    const lat1 = Date.now() - t0;
    assert(res1.status === 200, 'GET /api/billing/plans returns HTTP 200');

    // 2nd request (Cache HIT)
    const t1 = Date.now();
    const res2 = await axios.get(`${API_BASE}/billing/plans`);
    const lat2 = Date.now() - t1;
    const cacheHeader = res2.headers['x-cache-status'];
    assert(res2.status === 200, 'GET /api/billing/plans subsequent request succeeds');
    assert(cacheHeader === 'HIT', 'Second request returns X-Cache-Status: HIT');
    assert(lat2 <= lat1 || lat2 < 30, 'Cached response has ultra-fast turnaround', `${lat2}ms vs original ${lat1}ms`);
    console.log(`    Cache Performance: 1st Call ${lat1}ms (MISS), 2nd Call ${lat2}ms (HIT)`);
  } catch (err) {
    assert(false, 'In-memory cache test failed', err.message);
  }

  // --- Step 3: High Concurrency Burst (60 Simultaneous Requests) ---
  console.log('\n--- Step 3: High Concurrency Burst (60 Parallel Requests) ---');
  try {
    const burstStart = Date.now();
    const tasks = [];

    // 25 concurrent cached plan queries
    for (let i = 0; i < 25; i++) {
      tasks.push(
        axios.get(`${API_BASE}/billing/plans`).then(r => ({ type: 'plans', status: r.status }))
      );
    }

    // 15 concurrent health probes
    for (let i = 0; i < 15; i++) {
      tasks.push(
        axios.get(`${API_BASE}/health`).then(r => ({ type: 'health', status: r.status }))
      );
    }

    // 10 concurrent visitor tracking events
    for (let i = 0; i < 10; i++) {
      tasks.push(
        axios.post(`${API_BASE}/analytics/track-visit`, {
          sessionId: `concurrency_session_${i}_${Date.now()}`,
          path: `/concurrent-page-${i % 3}`,
        }).then(r => ({ type: 'visitor', status: r.status }))
      );
    }

    // 10 concurrent OAuth authentication requests with distinct candidate profiles
    for (let i = 0; i < 10; i++) {
      tasks.push(
        axios.post(`${API_BASE}/auth/oauth`, {
          provider: 'google',
          profile: {
            providerId: `concurrency_google_${i}_${Date.now()}`,
            name: `Concurrent Candidate ${i}`,
            email: `concurrent_${i}_${Date.now()}@test.com`,
          },
        }).then(r => ({ type: 'oauth', status: r.status }))
      );
    }

    const results = await Promise.all(tasks);
    const burstDuration = Date.now() - burstStart;
    const avgLatency = Math.round(burstDuration / tasks.length);

    const allSuccessful = results.every(r => r.status >= 200 && r.status < 300);
    assert(allSuccessful, 'All 60 concurrent requests resolved with 2xx HTTP success');
    assert(results.length === 60, 'Completed exactly 60 parallel operations');
    assert(burstDuration < 5000, '60-request concurrent burst finished within 5s', `Total time: ${burstDuration}ms, Avg: ${avgLatency}ms/req`);
    console.log(`    Concurrency Summary: 60 parallel requests handled in ${burstDuration}ms with 0 crashes or drops!`);
  } catch (err) {
    assert(false, 'High concurrency burst test failed', err.message);
  }

  // --- Step 4: Process Crash Prevention & Exception Resilience ---
  console.log('\n--- Step 4: Process Crash Prevention & Error Handling ---');
  try {
    // 1. Invalid route 404 handling without crash
    try {
      await axios.get(`${API_BASE}/non-existent-glitch-route-404`);
      assert(false, 'Should return 404 for nonexistent route');
    } catch (err404) {
      assert(err404.response?.status === 404, 'Nonexistent route safely returns HTTP 404 JSON', `Got ${err404.response?.status}`);
      assert(err404.response?.data?.success === false, 'Returns structured error JSON');
    }

    // 2. Invalid CastError ID without server crash
    try {
      await axios.get(`${API_BASE}/users/invalid-non-object-id-glitch`);
      assert(false, 'Should reject invalid cast ID');
    } catch (castErr) {
      assert(castErr.response?.status === 401 || castErr.response?.status === 404 || castErr.response?.status === 400,
        'Malformed resource ID handled safely without server crash', `Got ${castErr.response?.status}`);
    }

    // 3. Confirm server is still alive and healthy after errors
    const postHealth = await axios.get(`${API_BASE}/health`);
    assert(postHealth.status === 200 && postHealth.data?.status === 'ok', 'Server process remains healthy and stable after anomalous payloads');
  } catch (err) {
    assert(false, 'Crash prevention test failed', err.message);
  }

  // --- Step 5: Rate Limiter Health Exemption ---
  console.log('\n--- Step 5: Rate Limiter Probe Exemption ---');
  try {
    const healthProbes = [];
    for (let i = 0; i < 20; i++) {
      healthProbes.push(axios.get(`${API_BASE}/health`));
    }
    const healthResults = await Promise.all(healthProbes);
    const all200 = healthResults.every(r => r.status === 200);
    assert(all200, '20 rapid health probes are never throttled by rate limiter');
  } catch (err) {
    assert(false, 'Health rate-limiter exemption failed', err.message);
  }

  // --- Step 6: Frontend Zero-Glitch Dynamic Chunk Loading ---
  console.log('\n--- Step 6: Frontend Route Delivery & Zero-Glitch Assets ---');
  try {
    const landingRes = await axios.get(`${CLIENT_BASE}/`);
    assert(landingRes.status === 200, 'Landing page loads with HTTP 200');

    const loginRes = await axios.get(`${CLIENT_BASE}/login`);
    assert(loginRes.status === 200, 'Login page loads with HTTP 200');

    const adminRes = await axios.get(`${CLIENT_BASE}/admin/dashboard`);
    assert(adminRes.status === 200, 'Admin dashboard loads with HTTP 200');
  } catch (err) {
    assert(false, 'Frontend asset delivery failed', err.message);
  }

  // --- Final Summary ---
  console.log('\n===============================================================');
  console.log(`  PART 7 PERFORMANCE & SCALABILITY VERIFICATION COMPLETE`);
  console.log(`  Total Passed: ${passCount}`);
  console.log(`  Total Failed: ${failCount}`);
  console.log('===============================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runPart7PerformanceTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
