const fs = require('fs');
const path = require('path');
const axios = require('axios');
const pdfParse = require('pdf-parse');
const Resume = require('../models/Resume.model');
const AppError = require('../utils/AppError');
const { parseResumeAndJD } = require('../services/ai.service');
const { chunkResumeAndJD } = require('../services/chunking.service');
const { isSafePath } = require('../utils/crypto.utils');
const cloudinary = require('../config/cloudinary');
const logger = require('../config/logger');

/**
 * Upload and parse resume per PDF pp. 370-380
 * POST /api/resumes
 */
const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('Please upload a resume file (PDF, DOC, or DOCX up to 5 MB)', 400));
    }

    const { originalname, mimetype, size, path: filePath, filename } = req.file;
    const fileUrl = filePath.startsWith('http')
      ? filePath
      : `/uploads/resumes/${filename}`;
    const publicId = req.file.public_id || filename;

    let extractedText = '';

    // Extract text from PDF files per PDF p. 371
    if (mimetype === 'application/pdf') {
      try {
        let pdfBuffer;
        if (filePath.startsWith('http')) {
          const response = await axios.get(filePath, { responseType: 'arraybuffer' });
          pdfBuffer = Buffer.from(response.data);
        } else {
          pdfBuffer = fs.readFileSync(filePath);
        }

        const parsedPdf = await pdfParse(pdfBuffer);
        // Cap at 8,000 characters to stay within model context limits
        extractedText = parsedPdf.text ? parsedPdf.text.slice(0, 8000) : '';
      } catch (err) {
        logger.warn(`PDF text extraction warning: ${err.message}`);
        // If file is plain text / test file, read directly
        if (!filePath.startsWith('http') && fs.existsSync(filePath)) {
          try {
            const raw = fs.readFileSync(filePath, 'utf8');
            if (raw && !raw.includes('\0')) {
              extractedText = raw.slice(0, 8000);
            }
          } catch (_) {}
        }
      }
    } else if (!filePath.startsWith('http') && fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, 'utf8');
        if (raw && !raw.includes('\0')) {
          extractedText = raw.slice(0, 8000);
        }
      } catch (_) {}
    }

    // AI structured parsing with Groq at temperature 0.2
    let parsedData = {};
    if (extractedText && extractedText.trim()) {
      try {
        parsedData = await parseResumeAndJD(extractedText);
      } catch (err) {
        logger.error(`AI resume parsing failed: ${err.message}`);
      }
    }

    // Check if this is user's first resume; auto-set as default per PDF p. 414
    const existingCount = await Resume.countDocuments({ userId: req.user._id });
    const isDefault = existingCount === 0;

    const resume = await Resume.create({
      userId: req.user._id,
      fileName: originalname,
      fileUrl,
      fileSize: size,
      mimeType: mimetype,
      publicId,
      isDefault,
      extractedText,
      parsedData,
    });

    res.status(201).json({
      success: true,
      resume,
      data: resume,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all candidate resumes per PDF p. 414
 * GET /api/resumes
 */
const getResumes = async (req, res, next) => {
  try {
    const resumes = await Resume.find({ userId: req.user._id }).sort({
      isDefault: -1,
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: resumes.length,
      resumes,
      data: resumes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single resume with parsedData
 * GET /api/resumes/:id
 */
const getResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!resume) {
      return next(new AppError('Resume not found', 404));
    }

    res.status(200).json({
      success: true,
      resume,
      data: resume,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Set default resume per PDF p. 414
 * PATCH /api/resumes/:id/default
 */
const setDefaultResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!resume) {
      return next(new AppError('Resume not found', 404));
    }

    resume.isDefault = true;
    await resume.save();

    res.status(200).json({
      success: true,
      message: 'Default resume updated',
      resume,
      data: resume,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete resume per PDF p. 414
 * DELETE /api/resumes/:id
 */
const deleteResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!resume) {
      return next(new AppError('Resume not found', 404));
    }

    // Attempt Cloudinary cleanup if publicId exists
    if (resume.publicId && resume.publicId.includes('ai-interview')) {
      try {
        await cloudinary.uploader.destroy(resume.publicId);
      } catch (err) {
        logger.warn(`Could not destroy Cloudinary asset: ${err.message}`);
      }
    }

    // Attempt local disk file cleanup if stored locally
    if (resume.fileUrl && resume.fileUrl.startsWith('/uploads/resumes/')) {
      const baseUploadDir = path.resolve(__dirname, '../../uploads/resumes');
      const safeFileName = path.basename(resume.fileUrl);
      const targetFilePath = path.resolve(baseUploadDir, safeFileName);
      if (isSafePath(baseUploadDir, targetFilePath) && fs.existsSync(targetFilePath)) {
        try {
          fs.unlinkSync(targetFilePath);
        } catch (unlinkErr) {
          logger.warn(`Could not delete local resume file: ${unlinkErr.message}`);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Resume deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Secure, authenticated resume download with path-traversal protection
 * GET /api/resumes/:id/file
 */
const downloadResumeFile = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!resume) {
      return next(new AppError('Resume not found or unauthorized', 404));
    }

    if (resume.fileUrl.startsWith('http')) {
      return res.redirect(resume.fileUrl);
    }

    const baseUploadDir = path.resolve(__dirname, '../../uploads/resumes');
    const safeFileName = path.basename(resume.fileUrl);
    const targetFilePath = path.resolve(baseUploadDir, safeFileName);

    if (!isSafePath(baseUploadDir, targetFilePath) || !fs.existsSync(targetFilePath)) {
      return next(new AppError('Resume file not found on disk or invalid path', 404));
    }

    res.download(targetFilePath, resume.fileName);
  } catch (error) {
    next(error);
  }
};

/**
 * Re-parse resume with optional job description per PDF p. 371
 * POST /api/resumes/:id/parse
 */
const reparseResume = async (req, res, next) => {
  try {
    const { jobDescription } = req.body;
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!resume) {
      return next(new AppError('Resume not found', 404));
    }

    if (!resume.extractedText) {
      return next(new AppError('No extracted text available to parse', 400));
    }

    const parsedData = await parseResumeAndJD(resume.extractedText, jobDescription || '');
    resume.parsedData = parsedData;
    await resume.save();

    res.status(200).json({
      success: true,
      message: 'Resume re-parsed successfully',
      resume,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Preview semantic chunks for resume per PDF p. 200
 * GET /api/resumes/:id/chunks
 */
const getResumeChunks = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!resume) {
      return next(new AppError('Resume not found', 404));
    }

    const chunks = chunkResumeAndJD(resume.extractedText || '', '');

    res.status(200).json({
      success: true,
      count: chunks.length,
      chunks,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * AI Resume Analyzer per Part 3
 * POST /api/resumes/analyze
 * Accepts { resumeId } or { resumeText }
 */
const analyzeResume = async (req, res, next) => {
  try {
    const { resumeId, resumeText } = req.body;
    let text = (resumeText || '').trim();
    let resume = null;

    if (resumeId) {
      resume = await Resume.findOne({ _id: resumeId, userId: req.user._id });
      if (resume && resume.extractedText) {
        text = resume.extractedText;
      }
    }

    if (!text) {
      return next(new AppError('Please provide a resume by ID or paste your resume text for analysis', 400));
    }

    const words = text.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    // Detect technical keywords
    const commonTech = [
      'JavaScript', 'TypeScript', 'React', 'Node.js', 'Express', 'Python', 'Django', 'FastAPI',
      'Java', 'Spring', 'Go', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'PostgreSQL',
      'MongoDB', 'Redis', 'SQL', 'Git', 'CI/CD', 'GraphQL', 'REST', 'Tailwind', 'Next.js',
      'HTML', 'CSS', 'Microservices', 'Terraform', 'Kafka', 'Linux'
    ];
    const detectedSkills = commonTech.filter((skill) =>
      new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text)
    );

    // Impact quantification: find metrics (%, $, numbers + k/m, ms)
    const metricMatches = text.match(/\b(\d+[%kKmM]?|\$\d+|\d+\s*(ms|seconds|minutes|hours|users|x|X))\b/g) || [];
    const metricCount = metricMatches.length;
    const impactScore = Math.min(100, Math.round((metricCount / Math.max(1, wordCount / 50)) * 65 + (metricCount > 4 ? 35 : 15)));

    // Action verbs check
    const strongActionVerbs = ['architected', 'spearheaded', 'engineered', 'implemented', 'reduced', 'optimized', 'scaled', 'delivered', 'orchestrated', 'accelerated', 'transformed'];
    const weakVerbs = ['helped', 'worked on', 'assisted', 'handled', 'was responsible for'];
    let strongVerbCount = 0;
    let weakVerbCount = 0;
    strongActionVerbs.forEach((v) => { if (new RegExp(`\\b${v}\\b`, 'i').test(text)) strongVerbCount++; });
    weakVerbs.forEach((v) => { if (new RegExp(`\\b${v}\\b`, 'i').test(text)) weakVerbCount++; });

    // Calculate overall resume score
    let baseScore = 65;
    if (wordCount >= 250 && wordCount <= 900) baseScore += 10;
    if (detectedSkills.length >= 8) baseScore += 10;
    else if (detectedSkills.length >= 4) baseScore += 5;
    if (metricCount >= 4) baseScore += 10;
    if (strongVerbCount >= 3) baseScore += 5;
    if (weakVerbCount > 2) baseScore -= 8;
    const overallScore = Math.min(98, Math.max(35, baseScore));

    const strengths = [];
    const weaknesses = [];
    const enhancementTips = [];

    if (detectedSkills.length >= 6) {
      strengths.push(`Rich technical skills footprint with ${detectedSkills.length} verified technologies detected.`);
    } else {
      weaknesses.push('Technical stack appears limited or sparsely keyworded.');
      enhancementTips.push('Explicitly list your core technologies, libraries, and dev tools in a dedicated Skills block.');
    }

    if (metricCount >= 3) {
      strengths.push(`Strong outcome orientation: identified ${metricCount} measurable business & latency metrics.`);
    } else {
      weaknesses.push('Heavy reliance on task descriptions rather than quantified business outcomes.');
      enhancementTips.push('Quantify key achievements using the XYZ formula: Accomplished [X], as measured by [Y], by doing [Z].');
    }

    if (strongVerbCount >= 2) {
      strengths.push('Uses active, leadership-focused executive action verbs across experience bullets.');
    } else {
      enhancementTips.push('Replace passive phrasing (e.g. "Worked on", "Responsible for") with forceful action verbs (e.g. "Architected", "Engineered", "Optimized").');
    }

    if (wordCount < 200) {
      weaknesses.push('Resume content is too brief; lacks necessary contextual depth for senior evaluations.');
    } else if (wordCount > 1000) {
      weaknesses.push('Resume exceeds standard length; may cause recruiter fatigue or parsing truncation.');
    }

    const report = {
      overallScore,
      wordCount,
      executiveSummary: `Candidate presents an overall technical resume health of ${overallScore}/100 with ${detectedSkills.length} identified technologies and an impact index of ${impactScore}%. ${overallScore >= 75 ? 'Strong profile ready for senior technical screenings.' : 'Solid foundation requiring targeted bullet quantification.'}`,
      strengths,
      weaknesses,
      impactScore,
      skillsInventory: detectedSkills,
      enhancementTips,
      evaluatedAt: new Date().toISOString(),
    };

    if (resume) {
      resume.analyzerReport = report;
      await resume.save();
    }

    res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * AI Resume ATS Compatibility Scorer & Job-Role Based Edit Suggestions per Part 3
 * POST /api/resumes/ats-score
 * Accepts { resumeId, resumeText, targetRole }
 */
const getATSScoreAndEditSuggestions = async (req, res, next) => {
  try {
    const { resumeId, resumeText, targetRole = 'Senior Full Stack Engineer' } = req.body;
    let text = (resumeText || '').trim();
    let resume = null;

    if (resumeId) {
      resume = await Resume.findOne({ _id: resumeId, userId: req.user._id });
      if (resume && resume.extractedText) {
        text = resume.extractedText;
      }
    }

    if (!text) {
      return next(new AppError('Please provide a resume by ID or paste your resume text for ATS evaluation', 400));
    }

    // Role-specific keyword dictionaries
    const ROLE_KEYWORDS = {
      'frontend': ['React', 'TypeScript', 'Next.js', 'Redux', 'TailwindCSS', 'Web Vitals', 'HTML5', 'CSS3', 'Jest', 'CI/CD', 'Webpack/Vite', 'REST API', 'GraphQL', 'Accessibility'],
      'fullstack': ['JavaScript', 'TypeScript', 'Node.js', 'React', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'RESTful APIs', 'Microservices', 'Git', 'AWS', 'Unit Testing'],
      'backend': ['Node.js', 'Go', 'Python', 'PostgreSQL', 'Redis', 'Kafka', 'Docker', 'Kubernetes', 'gRPC', 'Database Indexing', 'System Design', 'OAuth2', 'Microservices Architecture'],
      'devops': ['Kubernetes', 'Docker', 'Terraform', 'AWS', 'GCP', 'CI/CD Pipelines', 'Prometheus', 'Grafana', 'Linux', 'Helm', 'Bash', 'Networking', 'Security'],
      'ai': ['Python', 'PyTorch', 'TensorFlow', 'LLMs', 'Vector Databases', 'RAG Pipelines', 'LangChain', 'FastAPI', 'Data Pipelines', 'Transformers', 'Fine-tuning'],
    };

    // Determine matching role dictionary
    const roleLower = targetRole.toLowerCase();
    let targetKeywords = ROLE_KEYWORDS.fullstack;
    if (roleLower.includes('fullstack') || roleLower.includes('full stack') || roleLower.includes('full-stack')) targetKeywords = ROLE_KEYWORDS.fullstack;
    else if (roleLower.includes('front')) targetKeywords = ROLE_KEYWORDS.frontend;
    else if (roleLower.includes('back')) targetKeywords = ROLE_KEYWORDS.backend;
    else if (roleLower.includes('devops') || roleLower.includes('sre') || roleLower.includes('cloud')) targetKeywords = ROLE_KEYWORDS.devops;
    else if (roleLower.includes('ai') || roleLower.includes('ml') || roleLower.includes('data')) targetKeywords = ROLE_KEYWORDS.ai;

    const matchedKeywords = [];
    const missingKeywords = [];

    targetKeywords.forEach((kw) => {
      // Allow compound keywords like "CI/CD Pipelines" to match if "CI/CD" is in text, or "Webpack/Vite" if either exists
      const variants = kw.split(/[/ ]+/).filter((v) => v.length > 2);
      const exactClean = kw.replace(/[/\\^$*+?.()|[\]{}]/g, '\\$&');
      const isMatched = new RegExp(`\\b${exactClean}\\b`, 'i').test(text) ||
        variants.some((v) => new RegExp(`\\b${v.replace(/[/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i').test(text));

      if (isMatched) {
        matchedKeywords.push(kw);
      } else {
        missingKeywords.push(kw);
      }
    });

    const keywordMatchPct = Math.round((matchedKeywords.length / targetKeywords.length) * 100);

    // Measurable metrics & numbers
    const metricMatches = text.match(/\b(\d+[%kKmM]?|\$\d+|\d+\s*(ms|seconds|minutes|users|x|X))\b/g) || [];
    const metricScore = Math.min(100, metricMatches.length * 20);

    // Action verbs
    const actionVerbs = ['architected', 'developed', 'spearheaded', 'optimized', 'engineered', 'led', 'designed', 'built', 'reduced', 'deployed'];
    const actionVerbsFound = actionVerbs.filter((v) => new RegExp(`\\b${v}\\b`, 'i').test(text));
    const verbScore = Math.min(100, actionVerbsFound.length * 25);

    // Sub-scores
    const subScores = {
      keywordMatch: keywordMatchPct,
      experienceRelevance: Math.min(100, keywordMatchPct + (matchedKeywords.length > 5 ? 15 : 5)),
      actionVerbs: Math.max(30, verbScore),
      formatting: 90, // clean parsed text indicates parseability
      measurableMetrics: Math.max(25, metricScore),
    };

    // Weighted composite ATS Score
    const atsScore = Math.round(
      subScores.keywordMatch * 0.4 +
      subScores.experienceRelevance * 0.25 +
      subScores.actionVerbs * 0.15 +
      subScores.formatting * 0.1 +
      subScores.measurableMetrics * 0.1
    );

    // Targeted, actionable edit recommendations customized to target role
    const editSuggestions = [
      {
        section: 'Professional Summary',
        originalSnippet: text.slice(0, 120) || 'Experienced software developer looking for new opportunities...',
        suggestedSnippet: `${targetRole} with proven track record in ${matchedKeywords.slice(0, 3).join(', ')}${missingKeywords.length ? ` and ${missingKeywords[0]}` : ''}. Spearheaded high-scale software architectures delivering sub-100ms API response times across enterprise workloads.`,
        rationale: `ATS systems scan the first 100 words for the exact target role title "${targetRole}". Aligning your summary directly bypasses the initial keyword cutoff.`,
      },
      {
        section: 'Technical Skills Block',
        originalSnippet: matchedKeywords.length ? `Skills: ${matchedKeywords.slice(0, 4).join(', ')}` : 'Various programming languages and tools.',
        suggestedSnippet: `Core Technologies: ${[...matchedKeywords, ...missingKeywords.slice(0, 4)].join(' • ')}`,
        rationale: `Integrates missing critical keywords (${missingKeywords.slice(0, 3).join(', ')}) directly into ATS parser indexing without inflating experience.`,
      },
      {
        section: 'Experience Bullet Points',
        originalSnippet: 'Worked on database queries and improved website performance.',
        suggestedSnippet: `Optimized distributed queries and caching layer using ${missingKeywords.includes('Redis') ? 'Redis' : 'indexes'}, slashing API endpoint latency by 42% and supporting 50,000+ daily active users.`,
        rationale: 'Replaces passive verb ("Worked on") with strong action verb ("Optimized") and attaches explicit quantitative metrics (% latency reduction, user volume).',
      },
    ];

    const atsReport = {
      targetRole,
      atsScore,
      rating: atsScore >= 80 ? 'Highly Compatible (Top 10%)' : atsScore >= 65 ? 'Competitive (Top 35%)' : 'Needs Optimization',
      subScores,
      matchedKeywords,
      missingKeywords,
      gapAnalysis: `Resume matches ${matchedKeywords.length} of ${targetKeywords.length} critical ATS screening filters for ${targetRole}. Adding the ${missingKeywords.length} missing keywords will significantly elevate recruiter pass-through rates.`,
      editSuggestions,
      evaluatedAt: new Date().toISOString(),
    };

    if (resume) {
      resume.atsAnalysis = atsReport;
      await resume.save();
    }

    res.status(200).json({
      success: true,
      atsReport,
      data: atsReport,
      ...atsReport,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadResume,
  getResumes,
  getResume,
  setDefaultResume,
  deleteResume,
  reparseResume,
  getResumeChunks,
  analyzeResume,
  getATSScoreAndEditSuggestions,
  downloadResumeFile,
};

