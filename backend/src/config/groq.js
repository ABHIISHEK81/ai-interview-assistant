const Groq = require('groq-sdk');
const logger = require('./logger');

const apiKey = process.env.GROQ_API_KEY || '';

if (!apiKey || apiKey === 'your_groq_api_key_here') {
  logger.warn('GROQ_API_KEY is not configured. AI completions will fail at runtime.');
}

const groq = new Groq({
  apiKey: apiKey || 'dummy_groq_key_for_initialization',
});

module.exports = groq;
