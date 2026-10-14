/**
 * Chunking Service per PDF pp. 380, 508, 1790
 * Splits resume text and job descriptions into semantically tagged chunks
 * with metadata { type: 'resume' | 'job_description', section: string }
 */

// Heuristics for classifying text sections
const RESUME_SECTION_PATTERNS = [
  { section: 'skills', regex: /(skills|technical skills|technologies|stack|core competencies|tools)/i },
  { section: 'experience', regex: /(work experience|professional experience|employment history|experience|work history)/i },
  { section: 'project', regex: /(projects|key projects|personal projects|portfolio)/i },
  { section: 'education', regex: /(education|academic background|academics|university|college|degrees)/i },
  { section: 'certification', regex: /(certifications|certificates|licenses|courses)/i },
  { section: 'publication', regex: /(publications|papers|patents)/i },
  { section: 'languages', regex: /(languages|spoken languages)/i },
  { section: 'interests', regex: /(interests|hobbies|activities)/i },
  { section: 'summary', regex: /(summary|professional summary|executive summary|profile|objective|about me)/i },
];

const JD_SECTION_PATTERNS = [
  { section: 'requirements', regex: /(requirements|qualifications|what you bring|must have|what we look for)/i },
  { section: 'required_skills', regex: /(required skills|technical requirements|core requirements)/i },
  { section: 'preferred_skills', regex: /(preferred skills|nice to have|bonus points|preferred qualifications)/i },
  { section: 'responsibility', regex: /(responsibilities|what you will do|duties|the role|your mission|key responsibilities)/i },
  { section: 'experience_requirement', regex: /(years of experience|seniority level|experience required)/i },
  { section: 'benefits', regex: /(benefits|perks|compensation|what we offer)/i },
  { section: 'overview', regex: /(about the company|about us|role overview|job overview|who we are)/i },
];

/**
 * Split text into rough sections based on headers or paragraphs
 */
function splitIntoSections(rawText, patterns, defaultSection = 'general') {
  if (!rawText) return [];
  const lines = rawText.split('\n');
  const sections = [];
  let currentSection = defaultSection;
  let currentLines = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      currentLines.push('');
      continue;
    }

    // Check if line looks like a header (short and matches pattern)
    let matchedSection = null;
    if (trimmed.length < 60) {
      for (const p of patterns) {
        if (p.regex.test(trimmed)) {
          matchedSection = p.section;
          break;
        }
      }
    }

    if (matchedSection) {
      if (currentLines.join('\n').trim().length > 0) {
        sections.push({
          section: currentSection,
          text: currentLines.join('\n').trim(),
        });
        currentLines = [];
      }
      currentSection = matchedSection;
    } else {
      currentLines.push(line);
    }
  }

  if (currentLines.join('\n').trim().length > 0) {
    sections.push({
      section: currentSection,
      text: currentLines.join('\n').trim(),
    });
  }

  return sections;
}

/**
 * Split a large section text into sliding chunks
 */
function chunkText(text, chunkSize = 500, chunkOverlap = 50) {
  if (!text) return [];
  const words = text.split(/\s+/);
  const chunks = [];
  let i = 0;

  // Approximate words per chunk: ~80 words is roughly 400-500 chars
  const wordsPerChunk = Math.floor(chunkSize / 6);
  const wordsOverlap = Math.floor(chunkOverlap / 6);

  while (i < words.length) {
    const chunkWords = words.slice(i, i + wordsPerChunk);
    const chunkStr = chunkWords.join(' ').trim();
    if (chunkStr.length > 20) {
      chunks.push(chunkStr);
    }
    i += Math.max(1, wordsPerChunk - wordsOverlap);
    if (i >= words.length && chunks.length > 0) break;
  }

  if (chunks.length === 0 && text.trim().length > 0) {
    chunks.push(text.trim());
  }

  return chunks;
}

/**
 * Normalize and clean chunk text
 */
function normalizeChunks(chunks) {
  return chunks.map((c) => ({
    ...c,
    text: c.text.replace(/\s+/g, ' ').trim(),
  }));
}

/**
 * Builds semantic chunks from Resume text and Job Description text
 * JD chunks placed first per PDF p. 508
 */
function chunkResumeAndJD(resumeText, jobDescription) {
  const allChunks = [];

  // 1. Process Job Description first
  if (jobDescription && jobDescription.trim()) {
    const jdSections = splitIntoSections(jobDescription, JD_SECTION_PATTERNS, 'overview');
    for (const sec of jdSections) {
      const subChunks = chunkText(sec.text, 500, 50);
      for (const sc of subChunks) {
        allChunks.push({
          text: sc,
          metadata: {
            type: 'job_description',
            section: sec.section,
          },
        });
      }
    }
  }

  // 2. Process Resume text
  if (resumeText && resumeText.trim()) {
    const resumeSections = splitIntoSections(resumeText, RESUME_SECTION_PATTERNS, 'general');
    for (const sec of resumeSections) {
      const subChunks = chunkText(sec.text, 500, 50);
      for (const sc of subChunks) {
        allChunks.push({
          text: sc,
          metadata: {
            type: 'resume',
            section: sec.section,
          },
        });
      }
    }
  }

  return normalizeChunks(allChunks);
}

module.exports = {
  chunkResumeAndJD,
  normalizeChunks,
  chunkText,
};
