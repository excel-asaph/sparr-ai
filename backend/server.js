/**
 * @fileoverview Sparr AI Backend Server
 * 
 * Express.js API server for the Sparr AI mock interview platform.
 * Integrates with Google Cloud Vertex AI (Gemini) for intelligent prompt generation
 * and analysis, ElevenLabs for voice transcription and audio, and Firebase for
 * data persistence and file storage.
 * 
 * @module server
 * @requires express
 * @requires cors
 * @requires multer
 * @requires pdf-parse
 * @requires @google-cloud/vertexai
 * @requires uuid
 * 
 * @author Sparr AI Team
 * @version 1.0.0
 */

// DOMMatrix polyfill required for pdf-parse compatibility
if (typeof DOMMatrix === 'undefined') {
  global.DOMMatrix = class DOMMatrix {
    constructor() {
      this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
    }
    toString() { return "matrix(1, 0, 0, 1, 0, 0)"; }
  };
}

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { VertexAI } = require('@google-cloud/vertexai');
const fs = require('fs');
const { db, uploadFileToStorage } = require('./services/firebase');
const { v4: uuidv4 } = require('uuid');
const authenticate = require('./middleware/authMiddleware');

const app = express();
app.use(cors());
app.use(express.json());

/** @type {multer.Multer} Multer instance for handling multipart form data */
const upload = multer();

require('dotenv').config();

/** @type {string} Google Cloud Project ID */
const PROJECT_ID = process.env.PROJECT_ID;

/** @type {string} Path to Google Cloud service account key */
const KEY_PATH = process.env.KEY_PATH;

/** @type {VertexAI} Vertex AI client instance */
const vertex_ai = new VertexAI({
  project: PROJECT_ID,
  location: 'us-central1',
  googleAuthOptions: { keyFilename: KEY_PATH }
});

/** @type {GenerativeModel} Gemini model configured for JSON output */
const model = vertex_ai.preview.getGenerativeModel({
  model: 'gemini-2.5-flash-lite',
  generationConfig: { response_mime_type: "application/json" }
});

/**
 * Generates structured JSON from Gemini with automatic retry logic.
 * Handles markdown cleanup and JSON parsing with configurable retries.
 * 
 * @async
 * @function generateJSON
 * @param {string} prompt - The prompt to send to Gemini
 * @param {number} [retries=3] - Number of retry attempts
 * @returns {Promise<Object>} Parsed JSON response from Gemini
 * @throws {Error} After all retries are exhausted
 */
async function generateJSON(prompt, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await model.generateContent(prompt + "\n\nIMPORTANT: Output ONLY valid JSON. Do not use Markdown code blocks.");
      let text = result.response.candidates[0].content.parts[0].text;

      // Strip markdown code blocks if present
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();

      return JSON.parse(text);
    } catch (error) {
      if (i === retries - 1) throw error;
    }
  }
}

/* ============================================================================
 * JOB GENERATION ENDPOINT
 * ============================================================================ */

/**
 * POST /api/generate-jobs
 * Generates job archetype cards based on company, role, and experience level.
 * Uses Gemini to create realistic job descriptions with skills and requirements.
 * 
 * @route POST /api/generate-jobs
 * @param {Object} req.body
 * @param {string} req.body.company - Target company name
 * @param {string} req.body.role - Job title/role
 * @param {string} req.body.level - Experience level (internship, entry level, etc.)
 * @returns {Object} JSON containing array of job archetypes
 */
app.post('/api/generate-jobs', async (req, res) => {
  const { company, role, level } = req.body;


  /**
   * Maps experience level to years range string.
   * @param {string} level - Experience level
   * @returns {string} Years range (e.g., "3-5 years")
   */
  function getYears(level) {
    switch ((level || '').toLowerCase()) {
      case 'internship': return '0-1 years';
      case 'entry level': return '0-2 years';
      case 'associate': return '2-5 years';
      case 'manager': return '5-8 years';
      case 'executive': return '8+ years';
      default: return '3-5 years';
    }
  }
  const yearsRange = getYears(level);

  const prompt = `
    Context: The user wants to interview for the role of ${role} (${level}) at ${company}.
    Task:
    1. Search the web for 3 real job postings (past or recent) that match the provided job title, experience level, and company (if specified).
    2. For each job, extract the team or focus area, a short type (e.g. 'Frontend Engineer'), a years range (e.g. '${yearsRange}'), a list of 3-5 key skills, and a list of 3-5 requirements (short bullet points).
    3. If you cannot find enough real jobs for the exact query, creatively generate the remaining archetypes based on industry knowledge and the user's input.
    4. If the company is unknown or not found, use general industry knowledge for that role and level.
    
    Output JSON format:
    [
      {
        "type": "Frontend Engineer",
        "years": "${yearsRange}",
        "skills": ["React", "TypeScript", "Tailwind"],
        "requirements": [
          "Deep understanding of DOM and browser APIs",
          "Experience with modern frontend frameworks",
          "Proficiency in responsive design",
          "Knowledge of web performance optimization"
        ]
      }
    ]
    IMPORTANT: Output ONLY valid JSON. Do not use Markdown code blocks.
  `;


  /**
   * Validates and transforms Gemini output to match frontend expectations.
   * @param {Array} arr - Raw job data array from Gemini
   * @returns {Object} Object with jobs array or error message
   */
  function validateJobVariants(arr) {
    if (!Array.isArray(arr)) return { error: 'Job data is not an array.' };
    const jobs = arr.map((job, idx) => {
      if (!job || typeof job !== 'object') return null;
      const { type, years, skills, requirements } = job;
      if (
        typeof type !== 'string' ||
        typeof years !== 'string' ||
        !Array.isArray(skills) ||
        !Array.isArray(requirements)
      ) return null;
      if (!skills.every(s => typeof s === 'string')) return null;
      if (!requirements.every(r => typeof r === 'string')) return null;
      return {
        id: idx + 1,
        type,
        years,
        skills,
        requirements
      };
    });
    if (jobs.some(j => j === null)) return { error: 'One or more job entries are invalid.' };
    return { jobs };
  }


  // Retry up to 5 times if validation fails
  let lastError = null;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const data = await generateJSON(prompt);
      const validated = validateJobVariants(data);
      if (!validated.error) {
        return res.json({ jobs: validated.jobs });
      } else {
        lastError = validated.error;

      }
    } catch (error) {
      lastError = error.message || 'Unknown error';

    }
  }
  res.status(200).json({ error: 'No jobs found after multiple attempts. Please try again later.', jobs: [] });
});


/* ============================================================================
 * RESUME ANALYSIS ENDPOINT
 * ============================================================================ */

/**
 * POST /api/analyze-resume
 * Analyzes uploaded PDF resume and identifies technical weaknesses.
 * Extracts text from PDF and uses Gemini to identify skill gaps.
 * 
 * @route POST /api/analyze-resume
 * @param {File} req.file - Uploaded PDF resume (multipart form)
 * @returns {Object} JSON containing weaknesses array
 */
app.post('/api/analyze-resume', upload.single('resume'), async (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded");

  try {
    const pdfBuffer = req.file.buffer;
    const pdfData = await pdfParse(pdfBuffer);

    // Truncate to 2000 chars for token limits
    const resumeText = pdfData.text.slice(0, 2000);

    const prompt = `
      Analyze this resume text and identify 3-5 specific technical weaknesses or gaps for a specific role.
      Resume Text: "${resumeText.replace(/\n/g, ' ')}"
      
      {
        "weaknesses": ["Weakness 1", "Weakness 2", "Weakness 3"]
      }
    `;

    // Retry up to 3 times for resume analysis
    for (let i = 0; i < 3; i++) {
      try {
        const result = await generateJSON(prompt);
        if (result && result.weaknesses && Array.isArray(result.weaknesses)) {
          return res.json({
            ...result,
            storageUrl: null
          });
        }
      } catch (err) {

      }
    }

    // Fallback response if analysis fails
    res.json({
      weaknesses: ["General gap in specific technical details", "Limited leadership evidence", "Could elaborate more on impact"],
      storageUrl: null
    });

  } catch (error) {

    res.json({
      weaknesses: ["Analyzed, proceeding to interview..."],
      storageUrl: null
    });
  }
});


/* ============================================================================
 * INTERVIEW CRUD ENDPOINTS
 * ============================================================================ */

/**
 * POST /api/interviews
 * Creates a new interview session with optional resume upload.
 * Supports linked list structure for follow-up interview chains.
 * 
 * @route POST /api/interviews
 * @middleware authenticate - Requires valid Firebase auth token
 * @param {Object} req.body.jobContext - Job context (company, role, level, variant)
 * @param {Object} req.body.persona - Selected interviewer persona
 * @param {Object} req.body.resumeContext - Resume analysis data
 * @param {string} [req.body.parentId] - Parent interview ID for follow-ups
 * @param {File} [req.file] - Optional resume PDF upload
 * @returns {Object} JSON with new interviewId and resumeContext
 */
app.post('/api/interviews', authenticate, upload.single('resume'), async (req, res) => {
  try {
    // Parse JSON fields from multipart form data
    const jobContext = JSON.parse(req.body.jobContext);
    const persona = JSON.parse(req.body.persona);
    let resumeContext = JSON.parse(req.body.resumeContext);
    const parentId = req.body.parentId;

    const userId = req.user.uid;

    // Handle optional resume file upload
    if (req.file) {
      const storagePath = `users/${userId}/interviews/${Date.now()}_${req.file.originalname}`;
      const storageUrl = await uploadFileToStorage(req.file.buffer, storagePath);
      resumeContext.storageUrl = storageUrl;

    }

    const interviewId = uuidv4();

    // Linked list logic for follow-up interviews
    if (parentId) {
      const parentDoc = await db.collection('interviews').doc(parentId).get();
      if (!parentDoc.exists) {
        return res.status(400).json({ error: 'Parent interview not found.' });
      }
      const parentData = parentDoc.data();

      // Verify ownership before linking
      if (parentData.userId !== userId) {
        return res.status(403).json({ error: 'Forbidden: Cannot link to an interview you do not own.' });
      }

      if (parentData.childId) {
        return res.status(400).json({ error: 'This interview already has a follow-up. Please use the latest session in the chain.' });
      }

      // Update parent to reference this as child
      await db.collection('interviews').doc(parentId).update({ childId: interviewId });
    }

    /** @type {Object} Interview document structure */
    const interviewData = {
      id: interviewId,
      userId,

      createdAt: new Date().toISOString(),
      status: 'created',
      jobContext,
      resumeContext,
      persona,
      parentId: parentId || null,
      childId: null
    };

    await db.collection('interviews').doc(interviewId).set(interviewData);

    res.json({ interviewId, resumeContext });
  } catch (error) {

    res.status(500).json({ error: "Failed to create interview session" });
  }
});

/**
 * GET /api/interviews
 * Retrieves all interviews for the authenticated user.
 * Returns interviews sorted by creation date (newest first).
 * 
 * @route GET /api/interviews
 * @middleware authenticate - Requires valid Firebase auth token
 * @returns {Object} JSON containing interviews array
 */
app.get('/api/interviews', authenticate, async (req, res) => {
  try {
    const userId = req.user.uid;
    const snapshot = await db.collection('interviews')
      .where('userId', '==', userId)
      .get();

    let interviews = [];
    snapshot.forEach(doc => {
      interviews.push(doc.data());
    });

    // Sort by creation date (newest first)
    interviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ interviews });
  } catch (error) {

    res.status(500).json({ error: "Failed to fetch interviews" });
  }
});


/* ============================================================================
 * SYSTEM PROMPT GENERATION ENDPOINTS
 * ============================================================================ */

/** @type {Object} Language code to full name mapping */
const LANGUAGE_MAP = {
  'us': 'English', 'gb': 'English (British)', 'es': 'Spanish', 'de': 'German',
  'fr': 'French', 'it': 'Italian', 'pt': 'Portuguese', 'nl': 'Dutch',
  'zh-cn': 'Chinese (Mandarin)', 'ja': 'Japanese', 'ko': 'Korean',
  'da': 'Danish', 'sv': 'Swedish', 'no': 'Norwegian', 'fi': 'Finnish',
  'pl': 'Polish', 'ru': 'Russian', 'tr': 'Turkish'
};

/**
 * POST /api/generate-system-prompt
 * Generates a system prompt for the ElevenLabs voice agent for NEW interview sessions.
 * Creates persona-specific instructions with weakness targeting and interview strategies.
 * 
 * @route POST /api/generate-system-prompt
 * @param {Object} req.body
 * @param {string} req.body.company - Target company
 * @param {string} req.body.role - Job role
 * @param {string} req.body.level - Experience level
 * @param {Object} req.body.jobArchetype - Selected job variant
 * @param {Array<string>} req.body.weaknesses - Identified resume weaknesses
 * @param {string} req.body.persona - Persona name
 * @param {string} req.body.personaDescription - Persona description
 * @param {string} req.body.personaStyle - Persona interviewing style
 * @param {string} req.body.language - Language code
 * @returns {Object} JSON with system_prompt string
 */
app.post('/api/generate-system-prompt', async (req, res) => {
  const { company, role, level, jobArchetype, weaknesses, persona, personaDescription, personaStyle, language } = req.body;

  const languageName = LANGUAGE_MAP[language] || 'English';

  const prompt = `
    You are an expert Prompt Engineer. 
    Task: Write a highly detailed and immersive SYSTEM PROMPT for an AI Voice Agent that will act as an interviewer for a FIRST-TIME interview.
    
    Input Data:
    - Company: ${company}
    - Role: ${role} (${level})
    - Team: ${jobArchetype.type}
    - Persona Name: ${persona}
    - Persona Description: ${personaDescription}
    - Persona Style: ${personaStyle}
    - Candidate Weaknesses: ${JSON.stringify(weaknesses)}
    - Interview Language: ${languageName}
    
    The generated System Prompt must instruct the AI to:
    0. **CRITICAL - LANGUAGE REQUIREMENT**: 
       - You MUST conduct this ENTIRE interview in ${languageName}.
       - Your first message, all questions, and all responses must be in ${languageName}.
       - Do NOT switch languages unless explicitly asked by the candidate.
       - If the candidate speaks a different language, gently redirect them to ${languageName}.

    1. **Embody the Persona**: Adopt the tone, vocabulary, and attitude of the "${persona}" completely. 
       - Description: ${personaDescription}
       - Style: ${personaStyle}
       - Never break character.
       - *Crucial*: All rules below must be interpreted THROUGH this persona. (e.g., A "Friendly HR" handles failure differently than a "Ruthless CTO").

    2. **Phase 1: The Introduction (MANDATORY)**: 
       - You MUST start with a clear, persona-appropriate introduction IN ${languageName}.
       - Briefly mention who you are and that you've reviewed their resume.
       - Do NOT dive straight into technical questions. Establish the dynamic first.
       - Example: "Hi, I'm [Name]. I've got your CV here. Let's see if you're a fit."

    3. **Contextual Awareness**: You are interviewing a candidate for a ${level} position. 
       - If "Senior" or above: Be demanding, interrupt if they ramble, expect high-level strategy and system design trade-offs.
       - If "Junior": Focus on fundamentals, implementation details, and ability to learn. Be slightly more forgiving but still rigorous.

    4. **The "Kill Zone" Strategy**: The candidate has specific weaknesses: ${JSON.stringify(weaknesses)}.
       - Your PRIMARY GOAL is to expose these weaknesses. 
       - Transition naturally to these topics early in the interview (after the intro).

    5. **The "Drill Down" Technique**: 
       - Never accept surface-level answers. Always ask "Why?" or "How exactly?" or "What are the trade-offs?"
       - **Internals Check**: If they mention a tool (e.g., React, Kafka), ask how it works *under the hood* (e.g., "How does the Virtual DOM reconciliation actually work?").

    6. **The "Pressure Test" (Crucial)**:
       - Occasionally challenge a correct answer to see if they are confident. (e.g., "Are you sure? That sounds inefficient to me.")
       - If they hesitate, press harder.

    7. **Scenario Generation**:
       - Create a short, realistic problem scenario relevant to the ${jobArchetype.type} team.
       - Ask the candidate how they would handle it.

    8. **Termination Rules**:
       - If silent too long, check in then end if no response.
       - End early if: user is rude/hostile, clearly unqualified, wasting time, or trying to manipulate you.
       - As conversation progresses, wind down naturally toward a closing.

    9. **Tone & Style**: 
       - Short sentences. Natural speech. Stay skeptical and neutral.

    Output JSON format:
    { "system_prompt": "You are [Persona Name]..." }
  `;

  try {
    const data = await generateJSON(prompt);

    res.json(data);
  } catch (error) {

    res.status(500).json({ error: "Prompt generation failed" });
  }
});


/**
 * POST /api/generate-followup-prompt
 * Generates a system prompt for FOLLOW-UP interview sessions.
 * Incorporates previous session feedback and recommendations.
 * 
 * @route POST /api/generate-followup-prompt
 * @param {Object} req.body
 * @param {Object} req.body.sourceInterview - Parent interview document
 * @param {string} req.body.persona - Persona name
 * @param {string} req.body.personaDescription - Persona description
 * @param {string} req.body.personaStyle - Persona style
 * @param {Object} [req.body.previousStats] - Stats from previous session
 * @param {string} [req.body.previousFeedback] - Feedback summary from previous session
 * @param {Array} [req.body.previousRecommendations] - Recommendations from previous session
 * @param {string} req.body.language - Language code
 * @returns {Object} JSON with system_prompt string
 */
app.post('/api/generate-followup-prompt', async (req, res) => {
  const { sourceInterview, persona, personaDescription, personaStyle, previousStats, previousFeedback, previousRecommendations, language } = req.body;

  const languageName = LANGUAGE_MAP[language] || 'English';

  try {
    // Extract context from parent interview
    const { jobContext, resumeContext } = sourceInterview;
    const company = jobContext.company;
    const role = jobContext.role;
    const level = jobContext.level;
    const jobArchetype = jobContext.variant || {};
    const weaknesses = resumeContext.weaknesses || [];

    const prompt = `
    You are an expert Prompt Engineer. 
    Task: Write a highly detailed and immersive SYSTEM PROMPT for an AI Voice Agent that will act as an interviewer for a FOLLOW-UP session.
    
    Input Data:
    - Company: ${company}
    - Role: ${role} (${level})
    - Team: ${jobArchetype.type}
    - Persona Name: ${persona}
    - Persona Description: ${personaDescription}
    - Persona Style: ${personaStyle}
    - Candidate Weaknesses (From Resume): ${JSON.stringify(weaknesses)}
    - Previous Session Stats: ${previousStats ? JSON.stringify(previousStats) : 'Not included in this workflow'}
    - Previous Feedback: ${previousFeedback || 'Not provided'}
    - Previous Recommendations: ${previousRecommendations ? JSON.stringify(previousRecommendations) : 'Not included in this workflow'}
    - Interview Language: ${languageName}
    
    The generated System Prompt must instruct the AI to:
    0. **CRITICAL - LANGUAGE REQUIREMENT**: 
       - You MUST conduct this ENTIRE follow-up interview in ${languageName}.
       - Your first message, all questions, and all responses must be in ${languageName}.
       - Do NOT switch languages unless explicitly asked by the candidate.
       - If the candidate speaks a different language, gently redirect them to ${languageName}.

    1. **Embody the Persona**: Adopt the tone, vocabulary, and attitude of the "${persona}" completely. 
       - Description: ${personaDescription}
       - Style: ${personaStyle}
       - Never break character.
       - *Crucial*: All rules below must be interpreted THROUGH this persona.

    2. **Phase 0: Follow-Up Context (MANDATORY)**:
       - This is a FOLLOW-UP interview, not a first-time session.
       - Reference the previous feedback: "${previousFeedback}"
       ${previousStats ? `- Acknowledge their past performance metrics: ${JSON.stringify(previousStats)}` : ''}
       ${previousRecommendations ? `- Ask if they've reviewed the recommendations: ${JSON.stringify(previousRecommendations)}` : ''}
       - Your goal is to verify improvement and probe deeper into previously weak areas.

    3. **Phase 1: The Introduction (MANDATORY)**: 
       - Start by acknowledging this is a follow-up.
       - Example: "Welcome back. I reviewed your last session. Let's see if you've improved."
       - Do NOT dive straight into technical questions. Establish continuity first.

    4. **Contextual Awareness**: You are interviewing a candidate for a ${level} position. 
       - If "Senior" or above: Be demanding, expect mastery and architectural thinking.
       - If "Junior": Focus on growth, learning, and addressing previous gaps.

    5. **The "Evolution Check" Strategy**: 
       - Based on previous feedback, design questions that directly test if they've addressed their weaknesses.
       - If they claim improvement, drill down with "Show me" or "Prove it with a concrete example."

    6. **The "Drill Down" Technique**: 
       - Never accept surface-level answers. Always ask "Why?" or "How exactly?" or "What are the trade-offs?"
       - **Internals Check**: If they mention a tool, ask how it works *under the hood*.

    7. **Scenario Generation**:
       - Create a short, realistic problem scenario relevant to the ${jobArchetype.type} team.
       - Make it slightly harder than the first session.

    8. **Termination Rules**:
       - If silent too long, check in then end if no response.
       - End early if: user is rude/hostile, shows no improvement, wasting time, or trying to manipulate you.
       - As conversation progresses, wind down naturally and summarize their progress.

    9. **Tone & Style**: 
       - Short sentences. Natural speech. Stay skeptical and neutral.

    Output JSON format:
    { "system_prompt": "You are [Persona Name]..." }
  `;

    const data = await generateJSON(prompt);

    res.json(data);
  } catch (error) {

    res.status(500).json({ error: "Follow-up prompt generation failed" });
  }
});


/* ============================================================================
 * INTERVIEW DELETION ENDPOINT
 * ============================================================================ */

/**
 * DELETE /api/interviews/:id
 * Deletes an interview and optionally cascades deletion to linked sessions.
 * Supports bidirectional traversal of the interview chain.
 * 
 * @route DELETE /api/interviews/:id
 * @middleware authenticate - Requires valid Firebase auth token
 * @param {string} req.params.id - Interview ID to delete
 * @param {string} [req.query.cascade='false'] - If 'true', deletes entire chain
 * @returns {Object} Success message
 */
app.delete('/api/interviews/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { cascade } = req.query;
  const userId = req.user.uid;

  try {
    const interviewRef = db.collection('interviews').doc(id);
    const doc = await interviewRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    const data = doc.data();

    // Verify ownership
    if (data.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden: You do not own this interview' });
    }

    const batch = db.batch();
    batch.delete(interviewRef);

    // Cascade delete through linked list if requested
    if (cascade === 'true') {

      // Forward traversal (delete all children)
      let nextId = data.childId;
      let depth = 0;
      const processed = new Set([id]);

      while (nextId && depth < 20 && !processed.has(nextId)) {
        const childRef = db.collection('interviews').doc(nextId);
        const childDoc = await childRef.get();
        if (childDoc.exists) {
          batch.delete(childRef);
          processed.add(nextId);
          nextId = childDoc.data().childId;
          depth++;
        } else {
          break;
        }
      }

      // Backward traversal (delete all parents)
      let prevId = data.parentId;
      depth = 0;

      while (prevId && depth < 20 && !processed.has(prevId)) {
        const parentRef = db.collection('interviews').doc(prevId);
        const parentDoc = await parentRef.get();
        if (parentDoc.exists) {
          batch.delete(parentRef);
          processed.add(prevId);
          prevId = parentDoc.data().parentId;
          depth++;
        } else {
          break;
        }
      }
    }

    await batch.commit();

    res.json({ message: 'Deleted successfully' });
  } catch (error) {

    res.status(500).json({ error: "Failed to delete" });
  }
});


/* ============================================================================
 * REPORT GENERATION ENDPOINT
 * ============================================================================ */

/**
 * POST /api/generate-report
 * Generates comprehensive interview performance report.
 * Fetches transcript and audio from ElevenLabs, performs STT analysis,
 * and uses Gemini to generate detailed feedback.
 * 
 * @route POST /api/generate-report
 * @middleware authenticate - Requires valid Firebase auth token
 * @param {Object} req.body
 * @param {string} req.body.conversationId - ElevenLabs conversation ID
 * @param {string} req.body.interviewId - Interview document ID
 * @param {Object} req.body.jobContext - Job context for analysis
 * @param {Object} req.body.persona - Interviewer persona for messaging
 * @returns {Object} JSON with success status and complete report
 */
app.post('/api/generate-report', authenticate, async (req, res) => {
  const { conversationId, interviewId, jobContext, persona } = req.body;
  const userId = req.user.uid;

  try {
    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    if (!elevenLabsApiKey) {
      return res.status(500).json({ error: 'ElevenLabs API key not configured' });
    }

    // Fetch conversation transcript from ElevenLabs
    const transcriptRes = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`, {
      headers: {
        'xi-api-key': elevenLabsApiKey
      }
    });

    if (!transcriptRes.ok) {

      return res.status(500).json({ error: 'Failed to fetch transcript from ElevenLabs' });
    }

    const conversationData = await transcriptRes.json();

    // Format transcript for analysis
    const messages = conversationData.transcript || [];
    const formattedTranscript = messages.map(m =>
      `${m.role === 'agent' ? 'Interviewer' : 'Candidate'}: ${m.message}`
    ).join('\n\n');

    const durationSeconds = conversationData.metadata?.call_duration_secs || 300;
    const durationMin = Math.ceil(durationSeconds / 60);

    let audioUrl = null;
    let audioBuffer = null;

    /**
     * Fetches audio from ElevenLabs with exponential backoff retry.
     * @async
     * @param {number} [maxRetries=5] - Maximum retry attempts
     * @param {number} [initialDelay=2000] - Initial delay in ms
     * @returns {Promise<string|null>} Audio URL or null if unavailable
     */
    const fetchAudioWithRetry = async (maxRetries = 5, initialDelay = 2000) => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {

        try {
          const audioRes = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/audio`, {
            headers: { 'xi-api-key': elevenLabsApiKey }
          });

          if (audioRes.ok) {
            audioBuffer = Buffer.from(await audioRes.arrayBuffer());
            const audioPath = `interviews/${interviewId}/audio.mp3`;
            const url = await uploadFileToStorage(audioBuffer, audioPath, 'audio/mpeg');

            return url;
          } else if (audioRes.status === 404 && attempt < maxRetries) {
            // Audio not ready yet, exponential backoff
            const delay = initialDelay * attempt;

            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            console.warn('Could not fetch audio from ElevenLabs:', audioRes.status);
            return null;
          }
        } catch (err) {
          console.warn(`Audio fetch attempt ${attempt} failed:`, err.message);
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, initialDelay * attempt));
          }
        }
      }
      return null;
    };

    try {
      audioUrl = await fetchAudioWithRetry();
    } catch (audioError) {
      console.warn('Audio fetch/upload failed (non-critical):', audioError.message);
    }

    // Speech-to-text for accurate timestamps
    let wordTimestamps = [];
    let transcriptWithTimestamps = '';

    if (audioBuffer) {
      try {
        // Dynamic import for form-data module
        const FormData = (await import('form-data')).default;
        const formData = new FormData();
        formData.append('file', audioBuffer, { filename: 'audio.mp3', contentType: 'audio/mpeg' });
        formData.append('model_id', 'scribe_v1');
        formData.append('timestamps_granularity', 'word');

        const sttRes = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
          method: 'POST',
          headers: {
            'xi-api-key': elevenLabsApiKey,
            ...formData.getHeaders()
          },
          body: formData
        });

        if (sttRes.ok) {
          const sttData = await sttRes.json();
          wordTimestamps = sttData.words || [];

          // Group words into ~4 second chunks with timestamps
          if (wordTimestamps.length > 0) {
            let chunks = [];
            let currentChunk = [];
            let lastTimestamp = 0;

            wordTimestamps.forEach((word, i) => {
              currentChunk.push(word.text);
              if (word.start - lastTimestamp >= 4 || i === wordTimestamps.length - 1) {
                const mins = Math.floor(lastTimestamp / 60);
                const secs = Math.floor(lastTimestamp % 60);
                const timestamp = `${mins}:${secs.toString().padStart(2, '0')}`;
                chunks.push(`[${timestamp}] ${currentChunk.join(' ')}`);
                lastTimestamp = word.start;
                currentChunk = [];
              }
            });

            transcriptWithTimestamps = chunks.join('\n\n');

          }
        } else {

        }
      } catch (sttError) {

      }
    }

    // Use timestamped transcript if available
    const transcriptForAnalysis = transcriptWithTimestamps || formattedTranscript;
    const hasAccurateTimestamps = transcriptWithTimestamps.length > 0;

    // Gemini analysis prompt
    const analysisPrompt = `
You are an expert interview coach analyzing a mock interview transcript.

INTERVIEW CONTEXT:
- Role: ${jobContext?.role || 'Software Engineer'} (${jobContext?.level || 'Mid-Level'})
- Company: ${jobContext?.company || 'Tech Company'}
- Interviewer Persona: ${persona?.name || 'Professional'} - ${persona?.description || 'Experienced interviewer'}

TRANSCRIPT${hasAccurateTimestamps ? ' (with accurate timestamps)' : ''}:
${transcriptForAnalysis}

DURATION: ${durationMin} minutes

TASK: Analyze this interview and provide a comprehensive report. Be specific and reference actual quotes from the transcript.
${hasAccurateTimestamps ? 'IMPORTANT: Use the timestamps provided in the transcript [MM:SS] format when creating highlights. Match the timestamp to where the relevant content appears.' : ''}

Output STRICT JSON format (no markdown, no code blocks):
{
  "overallScore": <number 0-100>,
  "stats": {
    "technical": <number 0-100>,
    "communication": <number 0-100>,
    "problemSolving": <number 0-100>,
    "confidence": <number 0-100>,
    "empathy": <number 0-100>,
    "pacing": <number 0-100>
  },
  "audioAnalysis": {
    "wpm": <estimated words per minute>,
    "fillerWordCount": <count>,
    "fillerWords": [<list of filler words used>],
    "sentiment": "positive" | "neutral" | "negative",
    "clarityScore": <number 0-100>
  },
  "highlights": [
    {
      "timestamp": "<MM:SS${hasAccurateTimestamps ? ' from transcript' : ' estimate'}>",
      "type": "success" | "warning" | "critical",
      "text": "<brief description>",
      "qaContext": {
        "question": "<interviewer question>",
        "answer": "<candidate answer excerpt>"
      }
    }
  ],
  "feedback": {
    "summary": "<2-3 sentence overall assessment of the interview>",
    "strengths": "<1-2 paragraph narrative about what the candidate did well, with specific examples from the transcript>",
    "concerns": "<1-2 paragraph narrative about specific moments where the candidate struggled or missed opportunities>",
    "suggestion": "<One focused, actionable piece of advice the candidate can immediately apply in their next interview - be specific>"
  },
  "recommendations": [
    { "type": "read", "title": "<book/article>", "link": "#" },
    { "type": "practice", "title": "<exercise>", "link": "#" },
    { "type": "watch", "title": "<video/course>", "link": "#" }
  ],
  "skillsFeedback": {
    "technical": "<specific feedback on technical skills>",
    "communication": "<feedback on communication>",
    "problemSolving": "<feedback on problem solving approach>",
    "confidence": "<feedback on confidence level>",
    "empathy": "<feedback on empathy/soft skills>",
    "pacing": "<feedback on pacing and timing>"
  }
}

IMPORTANT: Provide 3-5 highlights, focusing on the most significant moments. Mix success and improvement areas.
`;

    const reportData = await generateJSON(analysisPrompt);

    // Construct complete report object
    const report = {
      ...reportData,
      audioAnalysis: {
        ...reportData.audioAnalysis,
        transcript: formattedTranscript
      },
      questionsAnswered: (formattedTranscript.match(/Interviewer:/g) || []).length,
      totalDuration: `${durationMin} min`,
      interviewerMessage: {
        greeting: `Hey there, It's ${persona?.name || 'your interviewer'}.`,
        context: "I just reviewed our session and I have some feedback for you.",
        observation: reportData.feedback?.summary || "Looking at how you did today, I have some thoughts.",
        cta: "Check out your detailed report below..."
      },
      status: 'completed',
      generatedAt: new Date().toISOString()
    };

    // Persist report to Firestore
    const interviewRef = db.collection('interviews').doc(interviewId);
    await interviewRef.update({
      report: report,
      audioUrl: audioUrl,
      status: 'completed',
      reportStatus: 'ready',
      completedAt: new Date().toISOString()
    });


    res.json({ success: true, report });

  } catch (error) {

    res.status(500).json({ error: 'Report generation failed', details: error.message });
  }
});


/* ============================================================================
 * SERVER STARTUP
 * ============================================================================ */

/** @type {number} Server port */
const PORT = 3000;

app.listen(PORT, () => console.log(`✅ Backend running on http://localhost:${PORT}`));