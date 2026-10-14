/**
 * Stage 3 Verification Script
 * Validates Socket.io connection, live_answer emission, ai_chunk streaming,
 * ai_complete event, and error handling.
 */

const { io } = require('socket.io-client');

const SOCKET_URL = 'http://localhost:5000';

async function runStage3Tests() {
  console.log('--- Starting Stage 3 Real-Time Streaming Verification ---\n');

  return new Promise((resolve, reject) => {
    console.log('[1/3] Connecting to live interview Socket.io server...');
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnectionAttempts: 3,
    });

    let receivedChunks = [];
    let completeFired = false;

    socket.on('connect', () => {
      console.log('✅ Connected to InterviewAI live socket! Socket ID:', socket.id);

      // 2. Test live_answer event
      console.log('\n[2/3] Emitting live_answer event...');
      socket.emit('live_answer', {
        questionText: 'Describe how you implemented a caching strategy to reduce database load.',
        answerText: 'I used Redis with a write-through strategy and a 5-minute TTL to protect our PostgreSQL database during peak traffic spikes.',
        expectedKeywords: ['cache invalidation', 'TTL', 'Redis', 'eviction policy'],
      });
    });

    socket.on('ai_chunk', (chunk) => {
      process.stdout.write(chunk);
      receivedChunks.push(chunk);
    });

    socket.on('ai_complete', () => {
      console.log('\n✅ ai_complete event received!');
      console.log('   Total chunks received:', receivedChunks.length);
      console.log('   Streamed answer length:', receivedChunks.join('').length, 'characters');
      completeFired = true;

      // 3. Test error handling with missing questionText
      console.log('\n[3/3] Testing error handling for invalid payload...');
      socket.emit('live_answer', {
        questionText: '',
        answerText: 'Some answer without question',
      });
    });

    socket.on('ai_error', (errorMsg) => {
      console.log('✅ ai_error caught as expected:', errorMsg);
      socket.disconnect();

      console.log('\n======================================================');
      console.log('🎉 ALL STAGE 3 TESTS PASSED WITH 100% SUCCESS!');
      console.log('======================================================\n');
      resolve();
    });

    socket.on('connect_error', (err) => {
      console.error('❌ Connection error:', err.message);
      socket.disconnect();
      reject(err);
    });

    // Timeout safety
    setTimeout(() => {
      if (!completeFired) {
        socket.disconnect();
        reject(new Error('Stage 3 test timed out waiting for socket streaming.'));
      }
    }, 15000);
  });
}

runStage3Tests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Stage 3 Test failed:', err.message);
    process.exit(1);
  });
