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
const pdf = require('pdf-parse');
const { VertexAI } = require('@google-cloud/vertexai');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer();

// --- CONFIGURATION ---
const PROJECT_ID = ''; 
const KEY_PATH = './key.json';

// Initialize Vertex AI
const vertex_ai = new VertexAI({
  project: PROJECT_ID,
  location: 'us-central1',
  googleAuthOptions: { keyFilename: KEY_PATH }
});

const model = vertex_ai.preview.getGenerativeModel({
  model: 'gemini-1.5-pro',
  generationConfig: { response_mime_type: "application/json" }
});

// --- API 1: GET JOB CARDS ---
app.post('/api/generate-jobs', async (req, res) => {
  const { company, role, level } = req.body;
  console.log(`Generating jobs for: ${company}, ${role}`);

  const prompt = `
    Context: User wants to interview for ${role} (${level}) at ${company}.
    Task: Generate 3 distinct "Job Archetypes" (Teams/Focus Areas) for this role.
    If the company is unknown, use general industry knowledge.
    
    Output JSON format:
    [
      { 
        "title": "Short Title", 
        "focus": "1 sentence focus", 
        "skills": ["Skill1", "Skill2"],
        "description": "Short summary."
      }
    ]
  `;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.candidates[0].content.parts[0].text;
    res.json(JSON.parse(responseText));
  } catch (error) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: "Failed to generate jobs" });
  }
});

// --- API 2: ANALYZE RESUME ---
app.post('/api/analyze-resume', upload.single('resume'), async (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded");
  
  try {
    const data = await pdf(req.file.buffer);
    const resumeText = data.text;
    const { jobContext } = req.body; 

    const prompt = `
      Resume: ${resumeText.substring(0, 5000)}
      Target Job: ${jobContext}
      
      Task: Find 3 specific weaknesses in the resume for this job.
      Output JSON:
      {
        "weaknesses": ["Weakness 1", "Weakness 2", "Weakness 3"]
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.candidates[0].content.parts[0].text;
    res.json(JSON.parse(responseText));
  } catch (error) {
    console.error("Resume Error:", error);
    res.status(500).json({ error: "Analysis failed" });
  }
});

// --- API 3: GENERATE AGENT PROMPT ---
app.post('/api/generate-system-prompt', async (req, res) => {
  const { company, role, level, jobArchetype, weaknesses, persona } = req.body;

  const prompt = `
    Task: Write a SYSTEM PROMPT for an AI Voice Agent.
    
    Data:
    - Company: ${company}
    - Role: ${role} (${level})
    - Team: ${jobArchetype.title}
    - Persona: ${persona}
    - Candidate Weaknesses: ${JSON.stringify(weaknesses)}
    
    Instructions:
    1. Act exactly like the persona.
    2. Ask hard questions about the weaknesses.
    3. Be conversational but strict.

    Output JSON:
    { "system_prompt": "The prompt string..." }
  `;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.candidates[0].content.parts[0].text;
    res.json(JSON.parse(responseText));
  } catch (error) {
    console.error("Prompt Error:", error);
    res.status(500).json({ error: "Prompt generation failed" });
  }
});

app.listen(3000, () => console.log('✅ Backend running on http://localhost:3000'));