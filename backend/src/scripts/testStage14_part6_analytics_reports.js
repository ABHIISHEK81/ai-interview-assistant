const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

const runTest = async () => {
  console.log('========================================================================');
  console.log('  Part 6: Admin Panel Analytics & Monthly Excel Reporting Test');
  console.log('========================================================================\n');

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
    // TEST 1: Admin Authentication
    // ---------------------------------------------------------
    console.log('[Test 1] Authenticating super admin for analytics & reporting access...');
    const loginRes = await axios.post(`${BASE_URL}/admin/auth/login`, {
      email: 'aftab@admin.com',
      password: 'passwore123',
    });
    assert(loginRes.status === 200, 'Admin login succeeded');
    const adminToken = loginRes.data.accessToken || loginRes.data.data?.accessToken;
    const adminHeaders = { headers: { Authorization: `Bearer ${adminToken}` } };

    // ---------------------------------------------------------
    // TEST 2: Platform Visitor Tracking Telemetry
    // ---------------------------------------------------------
    console.log('\n[Test 2] Testing platform visitor telemetry tracking endpoint...');
    const visitorSessionId = `test_visitor_${Date.now()}`;
    const visitRes = await axios.post(`${BASE_URL}/analytics/track-visit`, {
      sessionId: visitorSessionId,
      path: '/pricing',
      referrer: 'https://google.com',
    });
    assert(visitRes.status === 200, 'POST /api/analytics/track-visit returned 200 OK');
    assert(visitRes.data.success === true, 'Visitor hit successfully logged');

    // ---------------------------------------------------------
    // TEST 3: Active User Tracking & Monthly Insights (Required Metrics)
    // ---------------------------------------------------------
    console.log('\n[Test 3] Verifying Active User Tracking & Monthly Insights in Admin Analytics...');
    const analyticsRes = await axios.get(`${BASE_URL}/admin/analytics`, adminHeaders);
    assert(analyticsRes.status === 200, 'GET /api/admin/analytics returned 200 OK');
    const analytics = analyticsRes.data.analytics || analyticsRes.data.data;

    // Check Monthly Active Users (MAU)
    assert(
      analytics.mau !== undefined && typeof analytics.mau === 'number' && analytics.mau >= 1,
      `Monthly Active Users (MAU) tracked and displayed: ${analytics.mau}`
    );

    // Check Total Platform Visitors
    assert(
      analytics.totalVisitors !== undefined && typeof analytics.totalVisitors === 'number' && analytics.totalVisitors >= 1,
      `Total Platform Visitors tracked and displayed: ${analytics.totalVisitors}`
    );

    // Check Users who visited but dropped off without completing actions
    assert(
      analytics.droppedOffUsers !== undefined && typeof analytics.droppedOffUsers === 'number',
      `Dropped-off users (visited/registered without completing actions) tracked: ${analytics.droppedOffUsers}`
    );

    // Check Drop-Off Rate
    assert(
      analytics.dropOffRate !== undefined,
      `Drop-off rate calculated and displayed: ${analytics.dropOffRate}%`
    );

    // Check Monthly Insights Breakdown
    assert(
      analytics.monthlyInsights !== undefined && analytics.monthlyInsights.completedSessions !== undefined,
      'Monthly insights breakdown structure populated'
    );

    // Check Dropped-Off Candidates List
    assert(
      Array.isArray(analytics.droppedOffUsersList),
      `Dropped-off candidate directory list available for inspection (found ${analytics.droppedOffUsersList?.length} records)`
    );

    // ---------------------------------------------------------
    // TEST 4: Automated Monthly Excel Exports - Listing Available Reports
    // ---------------------------------------------------------
    console.log('\n[Test 4] Checking list of compiled monthly performance reports...');
    const reportsRes = await axios.get(`${BASE_URL}/admin/reports`, adminHeaders);
    assert(reportsRes.status === 200, 'GET /api/admin/reports returned 200 OK');
    assert(Array.isArray(reportsRes.data.data), 'Returns an array of monthly reports');

    // ---------------------------------------------------------
    // TEST 5: Compilation of Specific Monthly Reports (e.g., January & February Reports)
    // ---------------------------------------------------------
    console.log('\n[Test 5] Testing automated compilation of specific monthly reports (January & February)...');
    
    // Compile January Report
    const compileJanRes = await axios.post(
      `${BASE_URL}/admin/reports/compile`,
      { year: 2026, month: 1, force: true },
      adminHeaders
    );
    assert(compileJanRes.status === 200, 'Compiled January 2026 Report returned 200 OK');
    const janReport = compileJanRes.data.data;
    assert(janReport.title === 'January 2026 Report', 'Generated report title: "January 2026 Report"');
    assert(janReport.fileName.endsWith('.xlsx'), 'Generated file format is .xlsx Excel');
    assert(janReport.metrics.mau !== undefined, 'Compiled metrics include MAU');
    assert(janReport.metrics.totalVisitors !== undefined, 'Compiled metrics include totalVisitors');
    assert(janReport.metrics.droppedOffUsers !== undefined, 'Compiled metrics include droppedOffUsers');

    // Compile February Report
    const compileFebRes = await axios.post(
      `${BASE_URL}/admin/reports/compile`,
      { year: 2026, month: 2, force: true },
      adminHeaders
    );
    assert(compileFebRes.status === 200, 'Compiled February 2026 Report returned 200 OK');
    const febReport = compileFebRes.data.data;
    assert(febReport.title === 'February 2026 Report', 'Generated report title: "February 2026 Report"');

    // ---------------------------------------------------------
    // TEST 6: Excel File Download & Spreadsheet Integrity Verification
    // ---------------------------------------------------------
    console.log('\n[Test 6] Testing direct file download of clean .xlsx spreadsheet report...');
    const downloadRes = await axios.get(
      `${BASE_URL}/admin/reports/${janReport._id}/download`,
      {
        ...adminHeaders,
        responseType: 'arraybuffer',
      }
    );
    assert(downloadRes.status === 200, 'Download endpoint returned HTTP 200');

    // Verify Content-Type is valid Excel MIME
    const contentType = downloadRes.headers['content-type'];
    assert(
      contentType.includes('spreadsheetml') || contentType.includes('excel'),
      `Content-Type header set to Excel: ${contentType}`
    );

    // Verify Content-Disposition header
    const disposition = downloadRes.headers['content-disposition'];
    assert(
      disposition && disposition.includes('attachment') && disposition.includes('.xlsx'),
      `Content-Disposition configured as downloadable attachment: ${disposition}`
    );

    // Verify Excel File Magic Bytes (PK\x03\x04 for ZIP-based Office Open XML format)
    const buffer = Buffer.from(downloadRes.data);
    const isZipOfficeOpenXml = buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
    assert(isZipOfficeOpenXml, 'File payload is a valid Office Open XML (.xlsx) binary spreadsheet');
    assert(buffer.length > 2000, `Excel file has substantial size (${buffer.length} bytes) containing multiple sheets`);

    // ---------------------------------------------------------
    // TEST 7: On-Demand Month Export Streaming Endpoint
    // ---------------------------------------------------------
    console.log('\n[Test 7] Testing on-demand monthly Excel stream export (GET /api/admin/reports/export/:year/:month)...');
    const exportStreamRes = await axios.get(
      `${BASE_URL}/admin/reports/export/2026/2`,
      {
        ...adminHeaders,
        responseType: 'arraybuffer',
      }
    );
    assert(exportStreamRes.status === 200, 'On-demand stream export returned HTTP 200');
    const streamBuffer = Buffer.from(exportStreamRes.data);
    const isStreamZip = streamBuffer[0] === 0x50 && streamBuffer[1] === 0x4b;
    assert(isStreamZip, 'On-demand stream payload verified as valid .xlsx file');

  } catch (error) {
    console.error('Test execution failed with error:', error.response?.data || error.message);
    failed++;
  }

  console.log('\n========================================================================');
  console.log(`  Part 6 Verification Complete: ${passed} Passed, ${failed} Failed`);
  console.log('========================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

runTest();
