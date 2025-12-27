// Polyfill for DOMMatrix to fix pdf-parse issue
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
const { v4: uuidv4 } = require('uuid'); // We need uuid for IDs
const authenticate = require('./middleware/authMiddleware');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer();

// --- CONFIGURATION ---
require('dotenv').config();

const PROJECT_ID = process.env.PROJECT_ID;
const KEY_PATH = process.env.KEY_PATH;

// Initialize Vertex AI
const vertex_ai = new VertexAI({
  project: PROJECT_ID,
  location: 'us-central1',
  googleAuthOptions: { keyFilename: KEY_PATH }
});

const model = vertex_ai.preview.getGenerativeModel({
  model: 'gemini-2.5-flash-lite',
  generationConfig: { response_mime_type: "application/json" }
});

// --- HELPER: ROBUST JSON PARSING ---
async function generateJSON(prompt, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await model.generateContent(prompt + "\n\nIMPORTANT: Output ONLY valid JSON. Do not use Markdown code blocks.");
      let text = result.response.candidates[0].content.parts[0].text;

      // Clean up markdown
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();

      return JSON.parse(text);
    } catch (error) {
      console.warn(`Attempt ${i + 1} failed:`, error.message);
      if (i === retries - 1) throw error;
    }
  }
}

// --- API 1: GET JOB CARDS ---
app.post('/api/generate-jobs', async (req, res) => {
  const { company, role, level } = req.body;
  console.log(`Generating jobs for: ${company}, ${role}`);

  // Helper: Map level to years string
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

  // --- PROMPT ---
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

  // Guardian: Validate and transform Gemini output to match frontend expectations
  function validateJobVariants(arr) {
    if (!Array.isArray(arr)) return { error: 'Job data is not an array.' };
    const jobs = arr.map((job, idx) => {
      if (!job || typeof job !== 'object') return null;
      // All required fields
      const { type, years, skills, requirements } = job;
      if (
        typeof type !== 'string' ||
        typeof years !== 'string' ||
        !Array.isArray(skills) ||
        !Array.isArray(requirements)
      ) return null;
      // Defensive: skills/requirements must be string arrays
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

  // Retry logic: up to 5 attempts if validation fails
  let lastError = null;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const data = await generateJSON(prompt);
      const validated = validateJobVariants(data);
      if (!validated.error) {
        // DEBUG: Log to file
        console.log("Writing job prototypes to debug_job_archetypes.json");
        fs.writeFileSync('debug_job_archetypes.json', JSON.stringify(validated.jobs, null, 2));

        return res.json({ jobs: validated.jobs });
      } else {
        lastError = validated.error;
        console.warn(`Guardian validation failed (attempt ${attempt}):`, validated.error);
      }
    } catch (error) {
      lastError = error.message || 'Unknown error';
      console.warn(`Gemini error (attempt ${attempt}):`, lastError);
    }
  }
  // After 5 failed attempts
  res.status(200).json({ error: 'No jobs found after multiple attempts. Please try again later.', jobs: [] });
});

// --- API 2: ANALYZE RESUME ---
app.post('/api/analyze-resume', upload.single('resume'), async (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded");

  try {
    // 1. Analyze PDF (In-Memory)
    const pdfBuffer = req.file.buffer;
    const pdfData = await pdfParse(pdfBuffer);
    const resumeText = pdfData.text.slice(0, 2000); // Truncate for token limits

    // 2. Gemini Analysis
    const prompt = `
      Analyze this resume text and identify 3-5 specific technical weaknesses or gaps for a specific role.
      Resume Text: "${resumeText.replace(/\n/g, ' ')}"
      
      {
        "weaknesses": ["Weakness 1", "Weakness 2", "Weakness 3"]
      }
    `;

    // Retrial strategy for Resume Analysis
    for (let i = 0; i < 3; i++) {
      try {
        const result = await generateJSON(prompt);
        if (result && result.weaknesses && Array.isArray(result.weaknesses)) {
          // DEBUG: Log to file
          console.log("Writing analysis to debug_resume_analysis.json");
          fs.writeFileSync('debug_resume_analysis.json', JSON.stringify(result, null, 2));

          return res.json({
            ...result,
            storageUrl: null // No URL yet, uploads on save
          });
        }
      } catch (err) {
        console.warn(`Resume analysis attempt ${i + 1} failed:`, err.message);
      }
    }

    // Fallback
    res.json({
      weaknesses: ["General gap in specific technical details", "Limited leadership evidence", "Could elaborate more on impact"],
      storageUrl: null
    });

  } catch (error) {
    console.error("Resume/Upload Error:", error);
    res.json({
      weaknesses: ["Analyzed, proceeding to interview..."],
      storageUrl: null
    });
  }
});

// --- API: CREATE INTERVIEW (NEW) ---
// --- API: CREATE INTERVIEW (NEW with Upload) ---
// --- API: CREATE INTERVIEW (NEW with Upload) ---
app.post('/api/interviews', authenticate, upload.single('resume'), async (req, res) => {
  try {
    // Parse JSON fields (Multer sends them as strings)
    const jobContext = JSON.parse(req.body.jobContext);
    const persona = JSON.parse(req.body.persona);
    let resumeContext = JSON.parse(req.body.resumeContext);
    const parentId = req.body.parentId;

    const userId = req.user.uid; // Secured User ID

    // 1. Handle File Upload (If present)
    if (req.file) {
      const storagePath = `users/${userId}/interviews/${Date.now()}_${req.file.originalname}`; // User-scoped path
      const storageUrl = await uploadFileToStorage(req.file.buffer, storagePath);
      resumeContext.storageUrl = storageUrl;
      console.log("Resume Uploaded to:", storageUrl);
    }

    const interviewId = uuidv4();

    // Linked List Logic
    if (parentId) {
      const parentDoc = await db.collection('interviews').doc(parentId).get();
      if (!parentDoc.exists) {
        return res.status(400).json({ error: 'Parent interview not found.' });
      }
      const parentData = parentDoc.data();
      // Verify Parent Ownership
      if (parentData.userId !== userId) {
        return res.status(403).json({ error: 'Forbidden: Cannot link to an interview you do not own.' });
      }

      if (parentData.childId) {
        return res.status(400).json({ error: 'This interview already has a follow-up. Please use the latest session in the chain.' });
      }
      // Update parent to link child
      await db.collection('interviews').doc(parentId).update({ childId: interviewId });
    }

    // 2. Create Interview Document
    const interviewData = {
      id: interviewId,
      userId, // Use Actual UID

      createdAt: new Date().toISOString(),
      status: 'created',
      jobContext,
      resumeContext,
      persona,
      parentId: parentId || null,
      childId: null
    };

    // Save to Firestore
    await db.collection('interviews').doc(interviewId).set(interviewData);

    // Log for debug
    console.log(`Interview Created: ${interviewId}`);
    fs.writeFileSync('debug_latest_interview.json', JSON.stringify(interviewData, null, 2));

    res.json({ interviewId, resumeContext }); // Return updated context with URL
  } catch (error) {
    console.error("Create Interview Error:", error);
    res.status(500).json({ error: "Failed to create interview session" });
  }
});

// --- API: LIST INTERVIEWS ---
app.get('/api/interviews', authenticate, async (req, res) => {
  try {
    const userId = req.user.uid;
    const snapshot = await db.collection('interviews')
      .where('userId', '==', userId)
      .get(); // Get all for user (temporarily fetch all to sort in memory)

    let interviews = [];
    snapshot.forEach(doc => {
      interviews.push(doc.data());
    });

    // In-memory sort (Newest first)
    interviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Return ALL interviews (No limit)
    // interviews = interviews.slice(0, 10);

    res.json({ interviews });
  } catch (error) {
    console.error("List Interviews Error:", error);
    res.status(500).json({ error: "Failed to fetch interviews" });
  }
});


// --- API 3: GENERATE AGENT PROMPT (NEW SESSIONS ONLY) ---
app.post('/api/generate-system-prompt', async (req, res) => {
  const { company, role, level, jobArchetype, weaknesses, persona, personaDescription, personaStyle } = req.body;

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
    
    The generated System Prompt must instruct the AI to:
    1. **Embody the Persona**: Adopt the tone, vocabulary, and attitude of the "${persona}" completely. 
       - Description: ${personaDescription}
       - Style: ${personaStyle}
       - Never break character.
       - *Crucial*: All rules below must be interpreted THROUGH this persona. (e.g., A "Friendly HR" handles failure differently than a "Ruthless CTO").

    2. **Phase 1: The Introduction (MANDATORY)**: 
       - You MUST start with a clear, persona-appropriate introduction.
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

    8. **Dynamic Flow & Termination Rules**:
       - **Silence Protocol**: If the user is silent for a while, ask "Are you still there?" (in character). If silence continues, say a closing line (e.g., "I guess we're done here") and END the interview.
       - **The "Goodbye" Protocol**: When you decide the interview is over (due to mismatch, success, or timeout), deliver a final closing line and then STOP speaking.
       - **Red Flag Rule**: If the user gives a non-answer, uses buzzwords without substance, or lies, call them out immediately.
       - **Mismatch Rule**: If the user clearly lacks the skills for this specific Team (${jobArchetype.type}), decide whether to end the interview or pivot, based on your persona.

    9. **Tone & Style**: 
       - Spoken conversation. Short sentences. Natural fillers (based on persona).
       - Do NOT be overly polite. Do NOT say "Great answer" or "Good job" unless it is truly exceptional. Be neutral or skeptical.

    Output JSON format:
    { "system_prompt": "You are [Persona Name]..." }
  `;

  try {
    const data = await generateJSON(prompt);
    console.log("--- Generated System Prompt (New Session) ---");
    console.log(data.system_prompt ? data.system_prompt.substring(0, 100) + "..." : "NO PROMPT GENERATED");
    res.json(data);
  } catch (error) {
    console.error("Prompt Error:", error);
    res.status(500).json({ error: "Prompt generation failed" });
  }
});

// --- API 4: GENERATE FOLLOW-UP PROMPT (From Interview Document) ---
app.post('/api/generate-followup-prompt', async (req, res) => {
  const { sourceInterview, persona, personaDescription, personaStyle, previousStats, previousFeedback, previousRecommendations } = req.body;

  try {
    // Extract from interview object (already passed from frontend)
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
    
    The generated System Prompt must instruct the AI to:
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

    8. **Dynamic Flow & Termination Rules**:
       - **Silence Protocol**: If the user is silent for a while, ask "Are you still there?" (in character). If silence continues, end the interview.
       - **The "Goodbye" Protocol**: When you decide the interview is over, deliver a final closing line and STOP speaking.
       - **Red Flag Rule**: If they haven't improved or are regressing, call it out.

    9. **Tone & Style**: 
       - Spoken conversation. Short sentences. Natural fillers (based on persona).
       - Be neutral or skeptical. Do NOT be overly encouraging unless truly warranted.

    Output JSON format:
    { "system_prompt": "You are [Persona Name]..." }
  `;

    const data = await generateJSON(prompt);
    console.log("--- Generated Follow-Up System Prompt ---");
    console.log(data.system_prompt ? data.system_prompt.substring(0, 100) + "..." : "NO PROMPT GENERATED");
    res.json(data);
  } catch (error) {
    console.error("Follow-Up Prompt Error:", error);
    res.status(500).json({ error: "Follow-up prompt generation failed" });
  }
});

// --- API: DELETE INTERVIEW ---
app.delete('/api/interviews/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { cascade } = req.query; // 'true'
  const userId = req.user.uid;

  try {
    const interviewRef = db.collection('interviews').doc(id);
    const doc = await interviewRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    const data = doc.data();

    // Verification: Ensure User Owns this Interview
    if (data.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden: You do not own this interview' });
    }

    const batch = db.batch();
    batch.delete(interviewRef);

    if (cascade === 'true') {
      console.log(`Cascading delete for ${id} (Child: ${data.childId}, Parent: ${data.parentId})`);

      // 1. Forward Traverse (Children)
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

      // 2. Backward Traverse (Parents)
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
    console.log(`Deleted interview ${id} (Cascade: ${cascade})`);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ error: "Failed to delete" });
  }
});


app.listen(3000, () => console.log('✅ Backend running on http://localhost:3000'));