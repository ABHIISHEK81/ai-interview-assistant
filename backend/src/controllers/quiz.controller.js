const QuizScore = require('../models/QuizScore.model');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');

const QUIZ_BANKS = {
  'fullstack-js': {
    title: 'Full-Stack JavaScript & Node.js',
    questions: [
      {
        id: 'js-1',
        question: 'Which phase of the Node.js event loop executes callbacks scheduled by setImmediate()?',
        options: ['Timers phase', 'Pending callbacks phase', 'Poll phase', 'Check phase'],
        correctIndex: 3,
        explanation: 'The "Check" phase executes setImmediate() callbacks immediately after the Poll phase completes I/O events.',
      },
      {
        id: 'js-2',
        question: 'What is the primary difference between Promise.all() and Promise.allSettled()?',
        options: [
          'Promise.all() runs in parallel while allSettled() runs in series',
          'Promise.all() rejects immediately upon any rejection, whereas allSettled() waits for all to resolve or reject',
          'Promise.allSettled() only works with async/await functions',
          'Promise.all() caches results in memory automatically',
        ],
        correctIndex: 1,
        explanation: 'Promise.all() short-circuits on the first rejection, whereas Promise.allSettled() always waits for every promise to settle.',
      },
      {
        id: 'js-3',
        question: 'In React 18/19, how does useTransition() improve input responsiveness during heavy list re-renders?',
        options: [
          'It runs the calculation inside a Web Worker thread',
          'It marks state updates as non-blocking transitions so urgent user clicks can interrupt them',
          'It memoizes all child component DOM nodes into local storage',
          'It converts JSX trees into WebAssembly bytecode',
        ],
        correctIndex: 1,
        explanation: 'useTransition marks state updates as non-blocking transitions, permitting high-priority user interactions (typing/clicking) to interrupt rendering.',
      },
      {
        id: 'js-4',
        question: 'Which HTTP header prevents MIME-type sniffing vulnerabilities in modern browsers?',
        options: [
          'X-Frame-Options: DENY',
          'X-Content-Type-Options: nosniff',
          'Strict-Transport-Security: max-age=31536000',
          'Access-Control-Allow-Origin: *',
        ],
        correctIndex: 1,
        explanation: 'X-Content-Type-Options: nosniff instructs browsers not to override the declared Content-Type header via sniffing.',
      },
      {
        id: 'js-5',
        question: 'What is the time complexity of searching a value in an ES6 Map vs a plain JavaScript Array with 1,000,000 items?',
        options: [
          'Map is O(1) average; Array is O(N)',
          'Map is O(log N); Array is O(1)',
          'Both are O(N)',
          'Map is O(N); Array is O(log N)',
        ],
        correctIndex: 0,
        explanation: 'Map employs hash table bucket indexing offering O(1) average lookup time, whereas Array.find/indexOf performs a linear O(N) scan.',
      },
    ],
  },
  'system-architecture': {
    title: 'System Design & Cloud Architecture',
    questions: [
      {
        id: 'sys-1',
        question: 'Under the CAP theorem, which property does Apache Cassandra prioritize when configured for high availability across network partitions?',
        options: [
          'Consistency and Availability (CA)',
          'Availability and Partition Tolerance (AP)',
          'Consistency and Partition Tolerance (CP)',
          'Linearizability and Strong Durability (LD)',
        ],
        correctIndex: 1,
        explanation: 'Cassandra is fundamentally designed as an AP (Availability and Partition Tolerance) system using tunable eventual consistency and hinted handoffs.',
      },
      {
        id: 'sys-2',
        question: 'Which caching strategy writes data directly to the cache and the primary database simultaneously in a single transaction?',
        options: ['Cache-Aside (Lazy Loading)', 'Write-Through', 'Write-Behind (Write-Back)', 'Refresh-Ahead'],
        correctIndex: 1,
        explanation: 'In Write-Through caching, the application writes data to the cache, and the cache synchronously writes to the primary database before confirming.',
      },
      {
        id: 'sys-3',
        question: 'What mechanism in Redis ensures that multiple commands execute atomically without race conditions without full table locking?',
        options: ['Redis Cluster Rebalancing', 'Lua Scripts (EVAL)', 'RDB Snapshotting', 'AOF fsync=always'],
        correctIndex: 1,
        explanation: 'Redis executes Lua scripts atomically in its single-threaded command loop, guaranteeing that no other script or query can run midway.',
      },
      {
        id: 'sys-4',
        question: 'What is the primary advantage of Consistent Hashing over simple Modulo Hashing when scaling out a distributed cache cluster?',
        options: [
          'It guarantees zero memory usage on edge nodes',
          'Adding or removing a server only remaps k/N keys rather than almost all keys',
          'It replaces TCP sockets with UDP for lower network latency',
          'It eliminates the need for replication across nodes',
        ],
        correctIndex: 1,
        explanation: 'Consistent Hashing places nodes on a virtual ring; adding or removing a node only redistributes approximately 1/N fraction of keys.',
      },
    ],
  },
  'python-ai': {
    title: 'Python, AI & LLM Systems',
    questions: [
      {
        id: 'ai-1',
        question: 'In Retrieval-Augmented Generation (RAG), what metric is most commonly used to measure distance between dense vector embeddings?',
        options: ['Cosine Similarity / Dot Product', 'Levenshtein Distance', 'Hamming Distance', 'Jaro-Winkler Metric'],
        correctIndex: 0,
        explanation: 'Cosine similarity (and normalized inner product) measures the cosine of the angle between two embedding vectors in multi-dimensional semantic space.',
      },
      {
        id: 'ai-2',
        question: 'What does the Global Interpreter Lock (GIL) in standard CPython prevent?',
        options: [
          'Running multi-threaded CPython bytecode in parallel across multiple CPU cores simultaneously',
          'Performing non-blocking asynchronous socket I/O with asyncio',
          'Writing into files on disk concurrently',
          'Importing packages from outside PYTHONPATH',
        ],
        correctIndex: 0,
        explanation: 'The CPython GIL ensures that only one native thread executes Python bytecode at any given moment, restricting CPU-bound multi-threading unless multiprocessing or native extensions are used.',
      },
      {
        id: 'ai-3',
        question: 'What is temperature in LLM sampling parameters, and how does temperature=0.0 affect output?',
        options: [
          'It regulates memory bandwidth; 0.0 frees RAM',
          'It controls entropy/randomness; 0.0 produces greedy, deterministic token selection',
          'It dictates context window size; 0.0 disables attention',
          'It enforces JSON schema validation strictly',
        ],
        correctIndex: 1,
        explanation: 'Lower temperatures sharpen the probability distribution over tokens; temperature=0.0 selects the highest-probability token (greedy deterministic decoding).',
      },
    ],
  },
};

/**
 * Get competition categories & active leaderboard stats
 * GET /api/quizzes/categories
 */
const getQuizCategories = async (req, res) => {
  const categories = Object.keys(QUIZ_BANKS).map((key) => ({
    id: key,
    title: QUIZ_BANKS[key].title,
    questionCount: QUIZ_BANKS[key].questions.length,
    timePerQuestionSeconds: 25,
    xpReward: 250,
  }));

  res.status(200).json({
    success: true,
    categories,
  });
};

/**
 * Generate competition quiz round
 * POST /api/quizzes/generate
 */
const generateQuiz = async (req, res, next) => {
  try {
    const { category = 'fullstack-js' } = req.body;
    const bank = QUIZ_BANKS[category] || QUIZ_BANKS['fullstack-js'];

    // Obfuscate correctIndex for client-side test security
    const sanitizedQuestions = bank.questions.map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
    }));

    res.status(200).json({
      success: true,
      quiz: {
        quizId: `quiz_${Date.now()}`,
        category,
        title: bank.title,
        timePerQuestionSeconds: 25,
        totalQuestions: sanitizedQuestions.length,
        questions: sanitizedQuestions,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit answers, compute score, and award competitive XP
 * POST /api/quizzes/submit
 */
const submitQuiz = async (req, res, next) => {
  try {
    const {
      category = 'fullstack-js',
      answers = {}, // { 'js-1': 3, 'js-2': 1 }
      timeTakenSeconds = 45,
    } = req.body;

    const bank = QUIZ_BANKS[category] || QUIZ_BANKS['fullstack-js'];
    let correctCount = 0;
    const totalQuestions = bank.questions.length;
    let currentStreak = 0;
    let maxStreak = 0;
    const questionResults = [];

    bank.questions.forEach((q) => {
      const candidateChoice = answers[q.id];
      const isCorrect = candidateChoice !== undefined && candidateChoice === q.correctIndex;

      if (isCorrect) {
        correctCount++;
        currentStreak++;
        if (currentStreak > maxStreak) maxStreak = currentStreak;
      } else {
        currentStreak = 0;
      }

      questionResults.push({
        id: q.id,
        question: q.question,
        options: q.options,
        candidateChoice: candidateChoice !== undefined ? candidateChoice : null,
        correctIndex: q.correctIndex,
        isCorrect,
        explanation: q.explanation,
      });
    });

    const accuracy = Math.round((correctCount / totalQuestions) * 100);

    // Competitive scoring: base points + streak bonus + speed bonus
    const basePoints = correctCount * 100;
    const streakBonus = maxStreak * 25;
    const speedBonus = Math.max(0, (totalQuestions * 25 - timeTakenSeconds) * 2);
    const totalScore = basePoints + streakBonus + speedBonus;
    const xpEarned = totalScore;

    // Record score in database
    let savedScore = null;
    if (req.user?._id) {
      try {
        savedScore = await QuizScore.create({
          userId: req.user._id,
          userName: req.user.name || 'Candidate',
          category: bank.title,
          score: totalScore,
          totalQuestions,
          correctAnswers: correctCount,
          accuracy,
          xpEarned,
          timeTakenSeconds,
          streakMax: maxStreak,
        });
      } catch (err) {
        logger.warn(`Failed to persist quiz score: ${err.message}`);
      }
    }

    res.status(200).json({
      success: true,
      result: {
        scoreId: savedScore?._id || `score_${Date.now()}`,
        category: bank.title,
        totalScore,
        correctCount,
        totalQuestions,
        accuracy,
        xpEarned,
        maxStreak,
        timeTakenSeconds,
        rankTier:
          accuracy >= 90
            ? 'Grandmaster'
            : accuracy >= 75
            ? 'Diamond'
            : accuracy >= 50
            ? 'Platinum'
            : 'Gold',
        questionResults,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Global Live Leaderboard & Ranking System
 * GET /api/quizzes/leaderboard
 */
const getLeaderboard = async (req, res, next) => {
  try {
    const rawScores = await QuizScore.find({})
      .sort({ score: -1 })
      .limit(30)
      .lean();

    // Default seeded leaders to provide instant competitive thrill
    const defaultLeaders = [
      { userName: 'Alexandre M. (Staff SRE)', score: 980, accuracy: 100, category: 'System Architecture', tier: 'Grandmaster' },
      { userName: 'Priya Patel (Full Stack Lead)', score: 910, accuracy: 95, category: 'Full-Stack JavaScript', tier: 'Diamond' },
      { userName: 'Vikram Joshi (AI Specialist)', score: 860, accuracy: 90, category: 'Python, AI & LLM Systems', tier: 'Diamond' },
      { userName: 'Sarah Jenkins (Platform Eng)', score: 790, accuracy: 85, category: 'System Architecture', tier: 'Platinum' },
      { userName: 'David Chen (Frontend Arch)', score: 740, accuracy: 80, category: 'Full-Stack JavaScript', tier: 'Platinum' },
    ];

    const leaderboard = rawScores.length
      ? rawScores.map((s, idx) => ({
          rank: idx + 1,
          userName: s.userName || 'Anonymous',
          score: s.score,
          accuracy: s.accuracy,
          category: s.category,
          tier: s.accuracy >= 90 ? 'Grandmaster' : s.accuracy >= 75 ? 'Diamond' : 'Platinum',
          createdAt: s.createdAt,
        }))
      : defaultLeaders.map((d, idx) => ({
          rank: idx + 1,
          ...d,
          createdAt: new Date().toISOString(),
        }));

    // Find current user position
    let myBest = null;
    if (req.user?._id) {
      myBest = await QuizScore.findOne({ userId: req.user._id }).sort({ score: -1 });
    }

    res.status(200).json({
      success: true,
      leaderboard,
      myStanding: myBest
        ? {
            bestScore: myBest.score,
            accuracy: myBest.accuracy,
            category: myBest.category,
            tier: myBest.accuracy >= 90 ? 'Grandmaster' : myBest.accuracy >= 75 ? 'Diamond' : 'Platinum',
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getQuizCategories,
  generateQuiz,
  submitQuiz,
  getLeaderboard,
};
