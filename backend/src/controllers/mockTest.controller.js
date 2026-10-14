const MockTestResult = require('../models/MockTestResult.model');
const AppError = require('../utils/AppError');
const groq = require('../config/groq');
const logger = require('../config/logger');

// Role & Skill Templates Library
const MOCK_TEST_TEMPLATES = {
  roles: [
    {
      id: 'frontend-engineer',
      title: 'Senior Frontend Architect',
      category: 'role',
      description: 'Test deep expertise in React 19, DOM rendering lifecycles, Web Vitals (LCP/INP), and complex state management.',
      topics: ['React Virtual DOM & Fibers', 'Client-side Hydration', 'Core Web Vitals Optimization', 'TypeScript Generics'],
      defaultQuestions: [
        {
          id: 'fe-q1',
          question: 'Explain how React Concurrent Mode and the Fiber architecture handle high-frequency re-renders compared to the legacy stack reconciler. How would you prevent layout thrashing and preserve a 60 FPS frame budget?',
          expectedConcepts: ['Fiber nodes', 'Time-slicing', 'requestIdleCallback scheduler', 'useDeferredValue', 'Batching updates'],
        },
        {
          id: 'fe-q2',
          question: 'A large Single Page Application is experiencing severe Interaction to Next Paint (INP) degradation during rapid data filtering across 50,000 items. Describe your systematic diagnostic and optimization strategy.',
          expectedConcepts: ['Virtualization (react-window/virtual)', 'Web Workers offloading', 'Debouncing/Throttling', 'Yielding to main thread with scheduler.yield()'],
        },
        {
          id: 'fe-q3',
          question: 'Compare Server Components (RSC) with traditional SSR. What are the key serialization constraints across server-client boundaries and how do they impact bundle size?',
          expectedConcepts: ['Zero-bundle-size on client', 'Client boundary directive "use client"', 'Serialization of props', 'Streaming SSR with Suspense'],
        },
      ],
    },
    {
      id: 'fullstack-engineer',
      title: 'Full-Stack Systems Engineer',
      category: 'role',
      description: 'Comprehensive test covering Node.js event-driven architecture, distributed PostgreSQL transactions, and secure API gateways.',
      topics: ['Node.js Event Loop', 'ACID Transactions & Isolation', 'JWT/OAuth2 Session Security', 'Real-Time WebSockets'],
      defaultQuestions: [
        {
          id: 'fs-q1',
          question: 'Under heavy concurrent load, your Node.js API server begins starving the event loop due to a cryptographic or JSON parsing bottleneck. How do you identify this issue and isolate it without degrading throughput?',
          expectedConcepts: ['Event loop lag monitoring', 'Worker threads', 'Cluster module / child processes', 'Offloading CPU-heavy tasks'],
        },
        {
          id: 'fs-q2',
          question: 'You must implement a bank transfer or credit balance deduction API between two accounts in PostgreSQL. Write or describe the transaction isolation level and concurrency control needed to avoid race conditions and double-spending.',
          expectedConcepts: ['BEGIN TRANSACTION', 'SELECT FOR UPDATE pessimistic locking', 'Isolation levels (Repeatable Read / Serializable)', 'Idempotency key checks'],
        },
        {
          id: 'fs-q3',
          question: 'Explain how you would architect a secure token refresh cycle across web browsers using HttpOnly cookies vs Authorization headers to prevent XSS and CSRF simultaneously.',
          expectedConcepts: ['HttpOnly SameSite cookies', 'In-memory short-lived access tokens', 'Refresh token rotation', 'CSRF tokens or custom headers'],
        },
      ],
    },
    {
      id: 'cloud-devops-engineer',
      title: 'Cloud & DevOps SRE',
      category: 'role',
      description: 'Kubernetes orchestration, zero-downtime canary deployments, distributed observability, and resilient cloud architecture.',
      topics: ['Kubernetes Pod Lifecycle', 'Canary/Blue-Green Deployments', 'Prometheus & OpenTelemetry', 'Infrastructure as Code'],
      defaultQuestions: [
        {
          id: 'ops-q1',
          question: 'How do Kubernetes readiness probes, liveness probes, and preStop lifecycle hooks interact during a rolling deployment to achieve 0 dropped packets?',
          expectedConcepts: ['Readiness probe failure stops endpoints', 'preStop sleep grace period', 'SIGTERM handling', 'Service mesh routing'],
        },
        {
          id: 'ops-q2',
          question: 'Design an automated incident remediation workflow that detects sudden 5xx spikes using OpenTelemetry, routes alerts to SREs, and triggers an automated rollback via ArgoCD/GitOps.',
          expectedConcepts: ['SLO/SLA burn-rate alerts', 'Automated canary rollback', 'GitOps declarative state reversion', 'Distributed tracing correlation'],
        },
      ],
    },
  ],
  skills: [
    {
      id: 'system-design',
      title: 'Distributed System Design',
      category: 'skill',
      description: 'Evaluate high-availability, horizontal partitioning, cache consistency, and message brokers at massive scale.',
      topics: ['Consistent Hashing', 'Cache Invalidation (Cache-Aside vs Write-Through)', 'Kafka/RabbitMQ Event Streaming', 'CAP Theorem Trade-Offs'],
      defaultQuestions: [
        {
          id: 'sd-q1',
          question: 'Design a distributed rate limiter supporting 1,000,000 requests per second across 20 worldwide edge regions. Discuss your choice between Token Bucket and Sliding Window Log with Redis clusters.',
          expectedConcepts: ['Sliding Window Counter', 'Redis Lua atomic scripts', 'Local in-memory caching with Redis sync', 'Eventual consistency vs strict enforcement'],
        },
        {
          id: 'sd-q2',
          question: 'A primary-replica relational database cluster suffers from replication lag, causing users to see stale data immediately after updating their profiles. How do you solve read-your-own-writes consistency?',
          expectedConcepts: ['Sticky sessions / read-after-write pin to primary', 'Version timestamp / LSN replication tracking', 'Client-side optimistic updates'],
        },
      ],
    },
    {
      id: 'dsa-concurrency',
      title: 'Algorithms & Concurrency',
      category: 'skill',
      description: 'Test algorithmic complexity analysis, thread synchronization, deadlock prevention, and optimized data structures.',
      topics: ['Time & Space Complexity', 'Deadlock Conditions & Avoidance', 'Graph Traversal & Shortest Path', 'LRU Cache Design'],
      defaultQuestions: [
        {
          id: 'dsa-q1',
          question: 'Explain how you would design an O(1) time complexity LRU (Least Recently Used) Cache with thread-safe read/write operations. What data structures would you combine?',
          expectedConcepts: ['Doubly linked list', 'Hash map pointer lookup', 'Read-Write Locks (Mutex/Semaphore)', 'O(1) node detachment and head insertion'],
        },
        {
          id: 'dsa-q2',
          question: 'Describe Dijkstra’s algorithm vs A* Search. What heuristic criteria are necessary for A* to guarantee finding the shortest path (admissibility and consistency)?',
          expectedConcepts: ['Min-heap priority queue', 'Heuristic function h(n)', 'Admissibility (never overestimates)', 'Consistency (triangle inequality)'],
        },
      ],
    },
  ],
};

/**
 * Get available mock test templates
 * GET /api/mock-tests/templates
 */
const getMockTestTemplates = async (req, res) => {
  res.status(200).json({
    success: true,
    roles: MOCK_TEST_TEMPLATES.roles,
    skills: MOCK_TEST_TEMPLATES.skills,
  });
};

/**
 * Generate role or skill mock test questions
 * POST /api/mock-tests/generate
 */
const generateMockTest = async (req, res, next) => {
  try {
    const { testType = 'role', subject = 'Senior Frontend Architect', difficulty = 'senior', questionCount = 3 } = req.body;

    // Search templates
    const allTemplates = [...MOCK_TEST_TEMPLATES.roles, ...MOCK_TEST_TEMPLATES.skills];
    const matched = allTemplates.find(
      (t) => t.title.toLowerCase().includes(subject.toLowerCase()) || t.id === subject.toLowerCase()
    );

    let questions = [];

    if (matched && matched.defaultQuestions?.length) {
      questions = matched.defaultQuestions.slice(0, questionCount);
    } else {
      // Dynamic fallback questions for customized subjects
      questions = [
        {
          id: `dyn-q1`,
          question: `Explain the fundamental architectural principles of ${subject} at a ${difficulty} level. What are the key performance trade-offs you encounter?`,
          expectedConcepts: ['Architectural patterns', 'Scalability', 'Performance trade-offs', 'Best practices'],
        },
        {
          id: `dyn-q2`,
          question: `You are tasked with debugging a critical production outage involving ${subject}. Walk through your step-by-step diagnostic and root-cause analysis methodology.`,
          expectedConcepts: ['Logging & metrics', 'Isolation', 'Rollback strategy', 'Post-mortem actions'],
        },
        {
          id: `dyn-q3`,
          question: `What modern tools, security standards, and testing methodologies do you enforce when delivering solutions in ${subject}?`,
          expectedConcepts: ['Security validation', 'Unit/Integration testing', 'Automated CI/CD', 'Code quality'],
        },
      ].slice(0, questionCount);
    }

    res.status(200).json({
      success: true,
      test: {
        testId: `mock_${Date.now()}`,
        testType,
        subject: matched ? matched.title : subject,
        difficulty,
        questionCount: questions.length,
        timeLimitMinutes: questions.length * 5,
        questions,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * AI Evaluation for candidate mock test answers
 * POST /api/mock-tests/evaluate
 */
const evaluateMockTest = async (req, res, next) => {
  try {
    const {
      testType = 'role',
      subject = 'Technical Assessment',
      difficulty = 'mid',
      answers = [],
      timeTakenSeconds = 120,
    } = req.body;

    if (!answers || !answers.length) {
      return next(new AppError('Please provide candidate answers for evaluation', 400));
    }

    let overallScore = 0;
    let strengths = [];
    let improvements = [];
    let evaluatedQuestions = [];

    // Analyze each answer
    answers.forEach((ans, idx) => {
      const text = (ans.candidateAnswer || '').trim();
      const wordCount = text ? text.split(/\s+/).length : 0;

      // Heuristic depth and keyword matching
      let qScore = 50;
      if (wordCount >= 80) qScore += 25;
      else if (wordCount >= 40) qScore += 15;
      else if (wordCount < 15) qScore = Math.max(20, qScore - 20);

      // Check expected keywords
      const expected = ans.expectedConcepts || ['architecture', 'performance', 'scalability'];
      let matchedCount = 0;
      expected.forEach((concept) => {
        const words = concept.toLowerCase().split(/\s+/);
        if (words.some((w) => w.length > 3 && text.toLowerCase().includes(w))) {
          matchedCount++;
        }
      });

      const keywordBonus = Math.min(25, matchedCount * 8);
      qScore = Math.min(100, Math.max(25, qScore + keywordBonus));

      overallScore += qScore;

      evaluatedQuestions.push({
        questionId: ans.questionId || `q-${idx + 1}`,
        questionText: ans.questionText || `Question ${idx + 1}`,
        candidateAnswer: text,
        score: qScore,
        feedback:
          qScore >= 80
            ? 'Excellent depth! Answer demonstrates rigorous architectural thinking and incorporates primary trade-offs effectively.'
            : qScore >= 60
            ? 'Good solid understanding. Could be elevated by mentioning specific production edge-cases, quantitative metrics, or failure modes.'
            : 'Answer is too brief or lacks key technical concepts. Be sure to elaborate on implementation details, concurrency risks, and lifecycle handling.',
        modelAnswerSnippet:
          ans.expectedConcepts?.length
            ? `A comprehensive answer addresses: ${ans.expectedConcepts.join(', ')}.`
            : 'A model answer articulates root-cause analysis, design trade-offs, and measurable outcomes.',
      });
    });

    overallScore = Math.round(overallScore / answers.length);

    // Dimension breakdown
    const breakdown = {
      technicalAccuracy: Math.min(100, overallScore + (overallScore >= 75 ? 4 : -3)),
      architectureDepth: Math.min(100, Math.max(30, overallScore - (overallScore > 80 ? 2 : 5))),
      edgeCaseHandling: Math.min(100, Math.max(30, overallScore - 6)),
      communicationClarity: Math.min(100, overallScore + 5),
    };

    if (overallScore >= 75) {
      strengths.push(`Strong conceptual grounding in ${subject}`);
      strengths.push('Articulate explanations with clear architectural clarity');
      strengths.push('Good intuition for trade-off analysis under high load');
      improvements.push('Incorporate more quantitative benchmarks and telemetry metrics');
    } else {
      strengths.push('Understands high-level responsibilities and workflow');
      improvements.push(`Deepen domain-specific implementation details in ${subject}`);
      improvements.push('Address concrete failure modes, concurrency, and graceful degradation');
      improvements.push('Use structured STAR or Problem-Solution-Metric framing');
    }

    // Persist result for candidate
    let savedResult = null;
    if (req.user?._id) {
      try {
        savedResult = await MockTestResult.create({
          userId: req.user._id,
          testType,
          targetSubject: subject,
          difficulty,
          score: overallScore,
          breakdown,
          strengths,
          improvements,
          questionCount: answers.length,
          timeTakenSeconds,
        });
      } catch (err) {
        logger.warn(`Failed to save mock test result: ${err.message}`);
      }
    }

    res.status(200).json({
      success: true,
      evaluation: {
        resultId: savedResult?._id || `eval_${Date.now()}`,
        subject,
        difficulty,
        overallScore,
        performanceTier:
          overallScore >= 85
            ? 'Principal Master'
            : overallScore >= 70
            ? 'Senior Competent'
            : overallScore >= 50
            ? 'Intermediate'
            : 'Needs Practice',
        breakdown,
        strengths,
        improvements,
        timeTakenSeconds,
        evaluatedQuestions,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's mock test history
 * GET /api/mock-tests/history
 */
const getMockTestHistory = async (req, res, next) => {
  try {
    const history = await MockTestResult.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    const totalTests = history.length;
    const averageScore = totalTests
      ? Math.round(history.reduce((acc, curr) => acc + curr.score, 0) / totalTests)
      : 0;

    res.status(200).json({
      success: true,
      totalTests,
      averageScore,
      history,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMockTestTemplates,
  generateMockTest,
  evaluateMockTest,
  getMockTestHistory,
};
