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
app.post('/api/interviews', upload.single('resume'), async (req, res) => {
  try {
    // Parse JSON fields (Multer sends them as strings)
    const jobContext = JSON.parse(req.body.jobContext);
    const persona = JSON.parse(req.body.persona);
    let resumeContext = JSON.parse(req.body.resumeContext);

    // 1. Handle File Upload (If present)
    if (req.file) {
      const storagePath = `users/guest/interviews/${Date.now()}_${req.file.originalname}`;
      const storageUrl = await uploadFileToStorage(req.file.buffer, storagePath);
      resumeContext.storageUrl = storageUrl; // Update context with real URL
      console.log("Resume Uploaded to:", storageUrl);
    }

    // 2. Create Interview Document
    const interviewId = uuidv4();
    const interviewData = {
      id: interviewId,
      userId: 'guest_user', // Placeholder
      createdAt: new Date().toISOString(),
      status: 'created',
      jobContext,    // { role, company, level, variant }
      resumeContext, // { storageUrl, weaknesses }
      persona        // Full persona object snapshot
    };

    // Save to Firestore
    await db.collection('interviews').doc(interviewId).set(interviewData);

    // Log for debug
    console.log(`Interview Created: ${interviewId}`);
    fs.writeFileSync('debug_latest_interview.json', JSON.stringify(interviewData, null, 2));

    res.json({ interviewId });
  } catch (error) {
    console.error("Create Interview Error:", error);
    res.status(500).json({ error: "Failed to create interview session" });
  }
});

// --- API 3: GENERATE AGENT PROMPT ---
app.post('/api/generate-system-prompt', async (req, res) => {
  const { company, role, level, jobArchetype, weaknesses, persona, personaDescription, personaStyle } = req.body;

  const prompt = `
    You are an expert Prompt Engineer. 
    Task: Write a highly detailed and immersive SYSTEM PROMPT for an AI Voice Agent that will act as an interviewer.
    
    Input Data:
    - Company: ${company}
    - Role: ${role} (${level})
    - Team: ${jobArchetype.title}
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
       - Create a short, realistic problem scenario relevant to the ${jobArchetype.title} team.
       - Ask the candidate how they would handle it.

    8. **Dynamic Flow & Termination Rules**:
       - **Silence Protocol**: If the user is silent for a while, ask "Are you still there?" (in character). If silence continues, say a closing line (e.g., "I guess we're done here") and END the interview.
       - **The "Goodbye" Protocol**: When you decide the interview is over (due to mismatch, success, or timeout), deliver a final closing line and then STOP speaking.
       - **Red Flag Rule**: If the user gives a non-answer, uses buzzwords without substance, or lies, call them out immediately.
       - **Mismatch Rule**: If the user clearly lacks the skills for this specific Team (${jobArchetype.title}), decide whether to end the interview or pivot, based on your persona.

    9. **Tone & Style**: 
       - Spoken conversation. Short sentences. Natural fillers (based on persona).
       - Do NOT be overly polite. Do NOT say "Great answer" or "Good job" unless it is truly exceptional. Be neutral or skeptical.

    Output JSON format:
    { "system_prompt": "You are [Persona Name]..." }
  `;

  try {
    const data = await generateJSON(prompt);
    console.log("--- Generated System Prompt ---");
    console.log(data.system_prompt ? data.system_prompt.substring(0, 100) + "..." : "NO PROMPT GENERATED");
    res.json(data);
  } catch (error) {
    console.error("Prompt Error:", error);
    res.status(500).json({ error: "Prompt generation failed" });
  }
});

app.listen(3000, () => console.log('✅ Backend running on http://localhost:3000'));