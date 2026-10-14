const { Server } = require('socket.io');
const groq = require('./config/groq');
const SystemPrompt = require('./models/SystemPrompt.model');
const logger = require('./config/logger');

let io = null;

const DEFAULT_INTERVIEW_PROMPT = `You are an expert, conversational technical interviewer.
A candidate just answered an interview question.
Produce a natural, engaging 1 to 3 sentence conversational follow-up response based ONLY on what the candidate stated in their answer.
You may acknowledge their key point, ask a brief clarifying probe, or offer brief commentary grounded in their answer.
Do NOT score or evaluate the answer with numbers at this stage. Keep it natural, concise (under 50 words), and encouraging as an interviewer in a live conversation.`;

/**
 * Retrieve system prompt for live interview or default
 */
async function getInterviewPrompt() {
  try {
    const promptDoc = await SystemPrompt.findOne({ category: 'interview' });
    return promptDoc && promptDoc.content ? promptDoc.content : DEFAULT_INTERVIEW_PROMPT;
  } catch (err) {
    logger.warn(`Could not load SystemPrompt for interview: ${err.message}. Using default.`);
    return DEFAULT_INTERVIEW_PROMPT;
  }
}

/**
 * Initialize Socket.io on the HTTP server per PDF pp. 670-715
 */
const initSocket = (httpServer) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  io = new Server(httpServer, {
    cors: {
      origin: clientUrl,
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    logger.info(`Live interview socket connected: ${socket.id}`);

    /**
     * Handle live candidate answer and stream conversational AI follow-up
     * Event: live_answer
     * Payload: { questionText, answerText, expectedKeywords }
     */
    socket.on('live_answer', async (data) => {
      try {
        const { questionText, answerText, expectedKeywords = [] } = data || {};

        if (!questionText) {
          socket.emit('ai_error', 'Question text is required for live answer follow-up.');
          return;
        }

        logger.info(`Socket [${socket.id}] processing live_answer for question: "${questionText.slice(0, 50)}..."`);

        const systemPrompt = await getInterviewPrompt();
        const expectedKeywordsText = Array.isArray(expectedKeywords)
          ? expectedKeywords.join(', ')
          : String(expectedKeywords || '');

        const userPrompt = `Interview Question:
${questionText}

Expected Concepts / Keywords:
${expectedKeywordsText || 'Standard technical best practices'}

Candidate Answer:
${answerText || '(Candidate did not provide an answer)'}

Respond with a conversational 1-3 sentence interviewer follow-up:`;

        const hasGroqKey =
          process.env.GROQ_API_KEY &&
          process.env.GROQ_API_KEY !== 'your_groq_api_key_here';

        if (hasGroqKey) {
          try {
            // Groq streaming completion with temperature 0.5 and max_tokens 150 per PDF pp. 710, 1765
            const stream = await groq.chat.completions.create({
              model: 'llama-3.3-70b-versatile',
              temperature: 0.5,
              max_tokens: 150,
              stream: true,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
              ],
            });

            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content || '';
              if (content) {
                socket.emit('ai_chunk', content);
              }
            }

            socket.emit('ai_complete');
            logger.info(`Socket [${socket.id}] live follow-up stream complete.`);
            return;
          } catch (groqErr) {
            logger.error(`Groq streaming failed (${groqErr.message}). Streaming fallback response.`);
          }
        }

        // Contextual fallback streamer for offline / test environments
        await streamFallbackResponse(socket, questionText, answerText);
      } catch (err) {
        logger.error(`Error in live_answer handler: ${err.message}`);
        socket.emit('ai_error', err.message || 'Failed to generate live interviewer response.');
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Live interview socket disconnected: ${socket.id}`);
    });
  });

  logger.info('Socket.io attached directly to HTTP server.');
  return io;
};

/**
 * Stream contextual fallback tokens with real-time delays
 */
async function streamFallbackResponse(socket, questionText, answerText) {
  let fallbackMessage = '';
  if (!answerText || answerText.trim().length === 0) {
    fallbackMessage = "I see. Let's move on to the next question, or feel free to share your thoughts on the core concepts whenever you're ready.";
  } else if (answerText.toLowerCase().includes('redis') || answerText.toLowerCase().includes('cache')) {
    fallbackMessage = "That's a solid breakdown of your caching strategy. Balancing TTLs with invalidation on write is always a key trade-off when keeping downstream systems responsive.";
  } else if (answerText.toLowerCase().includes('database') || answerText.toLowerCase().includes('index') || answerText.toLowerCase().includes('sql')) {
    fallbackMessage = "Good practical approach to query optimization. Inspecting execution plans and monitoring latency metrics is exactly what teams look for in high-throughput environments.";
  } else {
    fallbackMessage = "Thank you for explaining that. Your reasoning highlights a structured approach to problem solving, which is critical when navigating trade-offs in production.";
  }

  // Split into small word tokens and emit with micro-delays
  const tokens = fallbackMessage.match(/\S+\s*/g) || [fallbackMessage];
  for (const token of tokens) {
    socket.emit('ai_chunk', token);
    await new Promise((resolve) => setTimeout(resolve, 30));
  }
  socket.emit('ai_complete');
}

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet.');
  }
  return io;
};

module.exports = { initSocket, getIO };
