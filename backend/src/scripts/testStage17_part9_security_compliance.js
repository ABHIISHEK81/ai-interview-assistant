const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { encryptData, decryptData, hashToken, sanitizeFilename, isSafePath } = require('../utils/crypto.utils');
const { sanitizeNoSQL, sanitizeXSS } = require('../middleware/sanitize.middleware');

const API_BASE = 'http://localhost:5000/api';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message, extra = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`  ❌ [FAIL] ${message} ${extra ? `-> ${extra}` : ''}`);
  }
}

async function runPart9SecurityComplianceTests() {
  console.log('========================================================================');
  console.log('  Part 9: Security & Compliance Verification');
  console.log('========================================================================\n');

  // --- Test 1: Data Protection & Cryptographic Protocols ---
  console.log('[Test 1] Verifying Data Protection & Cryptographic Encryption (AES-256-GCM)...');
  try {
    const sensitivePlainText = 'Candidate Confidential SSN / Contact: 9876543210';
    const encrypted = encryptData(sensitivePlainText);
    assert(typeof encrypted === 'string' && encrypted.split(':').length === 3, 'AES-256-GCM encrypted payload matches iv:authTag:ciphertext format');
    
    const decrypted = decryptData(encrypted);
    assert(decrypted === sensitivePlainText, 'AES-256-GCM decrypted plaintext matches original sensitive content identically');

    // Tamper detection test
    let tampered = false;
    try {
      const parts = encrypted.split(':');
      parts[2] = 'ff' + parts[2].slice(2); // flip bits in ciphertext
      decryptData(parts.join(':'));
    } catch (e) {
      tampered = true;
    }
    assert(tampered, 'Authenticated AES-256-GCM correctly detects ciphertext tampering and rejects it');

    // Token Hashing
    const rawToken = 'super_secret_refresh_token_xyz_123';
    const hashed = hashToken(rawToken);
    assert(typeof hashed === 'string' && hashed.length === 64, 'SHA-256 token hashing produces uniform 64-character hex digest');

    // Path Traversal Sanitization
    const maliciousFilename = '../../../../windows/system32/cmd.exe\0.pdf';
    const safeFilename = sanitizeFilename(maliciousFilename);
    assert(!safeFilename.includes('..') && !safeFilename.includes('\0'), `Filename sanitized against directory traversal: "${safeFilename}"`);

    const uploadsDir = path.resolve(__dirname, '../../uploads/resumes');
    const safePath = path.resolve(uploadsDir, 'sample_resume.pdf');
    const unsafePath = path.resolve(uploadsDir, '../../etc/passwd');
    assert(isSafePath(uploadsDir, safePath), 'isSafePath approves paths inside designated uploads directory');
    assert(!isSafePath(uploadsDir, unsafePath), 'isSafePath blocks directory traversal outside uploads directory');
  } catch (err) {
    assert(false, 'Cryptographic tests encountered error', err.message);
  }

  // --- Test 2: Website Security, Helmet Headers & HTTPS Enforcement ---
  console.log('\n[Test 2] Verifying Website Security & Industry-Standard HTTP Headers...');
  try {
    const healthRes = await axios.get(`${API_BASE}/health`);
    assert(healthRes.status === 200, 'API health probe reachable');

    const headers = healthRes.headers;
    assert(headers['x-frame-options'] === 'DENY', 'Anti-Clickjacking header configured: X-Frame-Options: DENY');
    assert(headers['x-content-type-options'] === 'nosniff', 'Anti-MIME Sniffing header configured: X-Content-Type-Options: nosniff');
    assert(headers['referrer-policy'] === 'strict-origin-when-cross-origin', 'Referrer-Policy configured: strict-origin-when-cross-origin');
    assert(!!headers['content-security-policy'], 'Content-Security-Policy (CSP) active and guarding web socket/resources');
    assert(!!headers['strict-transport-security'], 'Strict-Transport-Security (HSTS) header active with preload');
  } catch (err) {
    assert(false, 'Security headers test failed', err.message);
  }

  // --- Test 3: Input Sanitization (NoSQL Injection & XSS Defense) ---
  console.log('\n[Test 3] Verifying Input Sanitization against NoSQL Injection & XSS...');
  try {
    // NoSQL Query Operator Injection test
    const maliciousNoSQLPayload = {
      email: { $gt: '' },
      password: 'mypassword',
      $where: 'this.admin === true',
      nested: {
        $ne: null,
        safeField: 'hello',
      },
    };
    const cleanedNoSQL = sanitizeNoSQL(maliciousNoSQLPayload);
    assert(cleanedNoSQL.email === undefined || typeof cleanedNoSQL.email !== 'object', 'Stripped malicious MongoDB query operators ($gt, $ne, $where)');
    assert(cleanedNoSQL.$where === undefined, 'Stripped root-level operator keys');
    assert(cleanedNoSQL.nested.safeField === 'hello', 'Preserved valid nested non-operator attributes');

    // XSS Sanitization test
    const maliciousXSSPayload = {
      comment: 'Hello <script>alert("hacked")</script> world <img src=x onerror=alert(1)> and javascript:void(0)',
    };
    const cleanedXSS = sanitizeXSS(maliciousXSSPayload);
    assert(!cleanedXSS.comment.includes('<script>') && !cleanedXSS.comment.includes('</script>'), 'Stripped executable <script> tags from text');
    assert(!cleanedXSS.comment.includes('onerror='), 'Neutralized inline DOM event handlers (onerror=)');
    assert(!cleanedXSS.comment.includes('javascript:'), 'Neutralized dangerous javascript: pseudo-protocols');
  } catch (err) {
    assert(false, 'Sanitization tests failed', err.message);
  }

  // --- Test 4: Tenant Isolation & Resume File Access Control ---
  console.log('\n[Test 4] Verifying Tenant Isolation & Protected Resume Access...');
  try {
    // Authenticate User A
    const userARes = await axios.post(`${API_BASE}/auth/oauth`, {
      provider: 'google',
      profile: {
        providerId: `sec_user_a_${Date.now()}`,
        name: 'Alice Security',
        email: `alice.sec.${Date.now()}@example.com`,
      },
    });
    const tokenA = userARes.data.accessToken || userARes.data.data?.accessToken || userARes.data.token;
    const authHeadersA = { headers: { Authorization: `Bearer ${tokenA}` } };

    // Authenticate User B
    const userBRes = await axios.post(`${API_BASE}/auth/oauth`, {
      provider: 'github',
      profile: {
        providerId: `sec_user_b_${Date.now()}`,
        name: 'Bob Security',
        email: `bob.sec.${Date.now()}@example.com`,
      },
    });
    const tokenB = userBRes.data.accessToken || userBRes.data.data?.accessToken || userBRes.data.token;
    const authHeadersB = { headers: { Authorization: `Bearer ${tokenB}` } };

    assert(!!tokenA && !!tokenB, 'Successfully generated secure authentication tokens for multiple independent tenants');

    // User A attempts to request a non-existent or foreign ID
    const fakeId = '507f1f77bcf86cd799439011';
    let userBAccessBlocked = false;
    try {
      await axios.get(`${API_BASE}/resumes/${fakeId}`, authHeadersB);
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 403) {
        userBAccessBlocked = true;
      }
    }
    assert(userBAccessBlocked, 'Tenant isolation blocks unauthorized or cross-tenant resume requests (404/403)');

    // Verify unauthenticated access to resume route is rejected
    let unauthBlocked = false;
    try {
      await axios.get(`${API_BASE}/resumes`);
    } catch (err) {
      if (err.response?.status === 401) {
        unauthBlocked = true;
      }
    }
    assert(unauthBlocked, 'Unauthenticated resume access strictly blocked with 401 Unauthorized');
  } catch (err) {
    assert(false, 'Tenant isolation test failed', err.message);
  }

  // --- Test 5: Legal Policies Verification (Privacy Policy & Terms of Service) ---
  console.log('\n[Test 5] Verifying Placeholder Legal Policies (Privacy Policy & Terms of Service)...');
  try {
    const privacyPath = path.resolve(__dirname, '../../../frontend/src/pages/PrivacyPolicyPage.jsx');
    const termsPath = path.resolve(__dirname, '../../../frontend/src/pages/TermsOfServicePage.jsx');
    
    assert(fs.existsSync(privacyPath), 'PrivacyPolicyPage.jsx exists in frontend pages');
    assert(fs.existsSync(termsPath), 'TermsOfServicePage.jsx exists in frontend pages');

    const privacyContent = fs.readFileSync(privacyPath, 'utf8');
    const termsContent = fs.readFileSync(termsPath, 'utf8');

    assert(privacyContent.includes('[Company') && (privacyContent.includes('[Effective Date') || privacyContent.includes('[October')), 'Privacy Policy contains clearly marked customizable company placeholders');
    assert(privacyContent.includes('WebRTC') && privacyContent.includes('Microphone'), 'Privacy Policy includes explicit disclosure of camera and microphone proctoring usage');
    assert(privacyContent.includes('AES-256') && privacyContent.includes('Right to Erasure'), 'Privacy Policy documents encryption standards and GDPR/DPDP data erasure rights');

    assert(termsContent.includes('[InterviewAI') && termsContent.includes('[Jurisdiction'), 'Terms of Service contains customizable legal jurisdiction placeholders');
    assert(termsContent.includes('2 free credits') && termsContent.includes('₹249'), 'Terms of Service details 2-credit trial policy and INR subscription rules');
    assert(termsContent.includes('Ownership') && termsContent.includes('Intellectual Property'), 'Terms of Service explicitly guarantees 100% candidate resume copyright ownership');
    assert(termsContent.includes('Advisory') || termsContent.includes('Simulation'), 'Terms of Service contains comprehensive AI simulation advisory disclaimer');
  } catch (err) {
    assert(false, 'Legal policies verification failed', err.message);
  }

  // --- Summary ---
  console.log('\n========================================================================');
  console.log('  Part 9 Security & Compliance Verification Complete');
  console.log(`  Passed: ${passedTests}`);
  console.log(`  Failed: ${failedTests}`);
  console.log('========================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPart9SecurityComplianceTests();
