/**
 * RAG Service per PDF pp. 520, 1790-1810
 * Builds embeddings for resume and job description chunks,
 * performs dual-query cosine-similarity retrieval with section-boosted ranking,
 * and formats context for Groq question generation.
 *
 * Hard Constraint: Supports EMBEDDING_PROVIDER switch ('local' vs 'openai')
 * so the platform operates with zero paid API keys by default.
 */

const { chunkResumeAndJD } = require('./chunking.service');
const { optimizeQuery } = require('./optimizer.service');
const logger = require('../config/logger');

// Section Boost Weights per PDF p. 1805
const SECTION_BOOST_WEIGHTS = {
  skills: 1.25,
  experience: 1.20,
  responsibility: 1.20,
  requirements: 1.15,
  required_skills: 1.15,
  project: 1.10,
  experience_requirement: 1.10,
  preferred_skills: 1.05,
  summary: 1.00,
  certification: 0.90,
  education: 0.90,
  general: 0.85,
  overview: 0.85,
  publication: 0.80,
  languages: 0.70,
  benefits: 0.70,
  interests: 0.60,
};

/**
 * Local zero-cost TF-IDF Vectorizer
 * Creates normalized term-frequency vectors for text chunks and queries.
 */
class LocalVectorizer {
  constructor() {
    this.vocabulary = new Map();
    this.idf = new Map();
  }

  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2);
  }

  fit(documents) {
    const docCount = documents.length;
    const docFreq = new Map();

    documents.forEach((doc) => {
      const tokens = new Set(this.tokenize(doc));
      tokens.forEach((t) => {
        docFreq.set(t, (docFreq.get(t) || 0) + 1);
      });
    });

    let index = 0;
    docFreq.forEach((count, token) => {
      this.vocabulary.set(token, index++);
      this.idf.set(token, Math.log((docCount + 1) / (count + 1)) + 1);
    });
  }

  transform(text) {
    const tokens = this.tokenize(text);
    const vector = new Float32Array(this.vocabulary.size);

    tokens.forEach((t) => {
      if (this.vocabulary.has(t)) {
        const idx = this.vocabulary.get(t);
        const idfVal = this.idf.get(t) || 1;
        vector[idx] += idfVal;
      }
    });

    // L2 Normalize
    let norm = 0;
    for (let i = 0; i < vector.length; i++) {
      norm += vector[i] * vector[i];
    }
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= norm;
      }
    }

    return Array.from(vector);
  }
}

/**
 * Cosine similarity between two vectors
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Embed an array of text documents using either OpenAI or Local provider
 */
async function embedTexts(texts, provider) {
  if (provider === 'openai' && process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
    try {
      const { OpenAIEmbeddings } = require('@langchain/openai');
      const embeddingsClient = new OpenAIEmbeddings({
        modelName: 'text-embedding-3-small',
        openAIApiKey: process.env.OPENAI_API_KEY,
      });
      return await embeddingsClient.embedDocuments(texts);
    } catch (err) {
      logger.warn(`OpenAI embedding failed (${err.message}). Falling back to local vectorizer.`);
    }
  }

  // Local zero-cost fallback
  const vectorizer = new LocalVectorizer();
  vectorizer.fit(texts);
  return texts.map((t) => vectorizer.transform(t));
}

/**
 * Embed a single query using either OpenAI or Local provider
 */
async function embedQuery(query, textsForContext, provider) {
  if (provider === 'openai' && process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
    try {
      const { OpenAIEmbeddings } = require('@langchain/openai');
      const embeddingsClient = new OpenAIEmbeddings({
        modelName: 'text-embedding-3-small',
        openAIApiKey: process.env.OPENAI_API_KEY,
      });
      return await embeddingsClient.embedQuery(query);
    } catch (err) {
      logger.warn(`OpenAI embedQuery failed (${err.message}). Falling back to local vectorizer.`);
    }
  }

  const vectorizer = new LocalVectorizer();
  vectorizer.fit([...textsForContext, query]);
  return vectorizer.transform(query);
}

/**
 * Full RAG context retrieval pipeline
 * 1. Chunk resume and JD
 * 2. Embed chunks in memory
 * 3. Optimize dual queries (technical skills goal + role responsibilities goal)
 * 4. Cosine similarity matching
 * 5. Section-boosted ranking
 * 6. Top 6 chunks formatted as context
 */
async function retrieveRAGContext({ resumeText, jobDescription, jobTitle, experienceLevel }) {
  // Step 1: Chunking
  const chunks = chunkResumeAndJD(resumeText, jobDescription);
  if (!chunks || chunks.length === 0) {
    return {
      context: jobDescription || '',
      retrievedChunks: [],
    };
  }

  const provider = (process.env.EMBEDDING_PROVIDER || 'local').toLowerCase();
  const chunkTexts = chunks.map((c) => c.text);

  // Step 2: Embed chunks in memory
  let chunkVectors;
  let queryVector1;
  let queryVector2;

  // Step 3: Dual-query optimization
  const query1 = optimizeQuery('extracting technical skills and frameworks from candidate projects', jobTitle, experienceLevel);
  const query2 = optimizeQuery('identifying role responsibilities and qualifications', jobTitle, experienceLevel);

  if (provider === 'openai' && process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
    chunkVectors = await embedTexts(chunkTexts, 'openai');
    queryVector1 = await embedQuery(query1, chunkTexts, 'openai');
    queryVector2 = await embedQuery(query2, chunkTexts, 'openai');
  } else {
    // Local vectorizer fitted on all chunks + queries together
    const vectorizer = new LocalVectorizer();
    vectorizer.fit([...chunkTexts, query1, query2]);
    chunkVectors = chunkTexts.map((t) => vectorizer.transform(t));
    queryVector1 = vectorizer.transform(query1);
    queryVector2 = vectorizer.transform(query2);
  }

  // Step 4 & 5: Cosine similarity + Section Boost
  const scoredChunks = chunks.map((chunk, idx) => {
    const vec = chunkVectors[idx];
    const sim1 = cosineSimilarity(queryVector1, vec);
    const sim2 = cosineSimilarity(queryVector2, vec);
    const rawScore = Math.max(sim1, sim2);

    const section = (chunk.metadata && chunk.metadata.section) || 'general';
    const boost = SECTION_BOOST_WEIGHTS[section] || 0.85;
    const finalScore = rawScore * boost;

    return {
      chunk,
      rawScore,
      boost,
      finalScore,
    };
  });

  // Sort descending by finalScore and select top 6 chunks per PDF p. 520
  scoredChunks.sort((a, b) => b.finalScore - a.finalScore);
  const topChunks = scoredChunks.slice(0, 6);

  // Step 6: Format context
  const formattedContext = topChunks
    .map((item) => {
      const typeStr = (item.chunk.metadata.type || 'context').toUpperCase();
      const sectionStr = item.chunk.metadata.section || 'general';
      return `[${typeStr} › ${sectionStr}]\n${item.chunk.text}`;
    })
    .join('\n\n---\n\n');

  return {
    context: formattedContext,
    retrievedChunks: topChunks.map((item) => item.chunk),
  };
}

module.exports = {
  retrieveRAGContext,
  SECTION_BOOST_WEIGHTS,
  cosineSimilarity,
};
