This is the complete project dossier for Sparr AI. You can use this text for your GitHub README.md, your Devpost submission page, and even your video script.

It is structured to tell a compelling story while hitting every single judging criterion (Innovation, Technical Implementation, Design, and Partner Usage).

⚔️ Sparr AI: The Interview Gauntlet
"Your AI Sparring Partner. It doesn't just ask questions; it interrupts, challenges, and trains you for the reality of high-stakes interviews."

🚨 The Problem
Job interviews are the most stressful part of a career.

Existing tools are robotic: Most "AI Interviewers" are just standard text-to-speech bots. They wait awkwardly for 3 seconds of silence before replying. That’s not how humans talk.

Feedback is too nice: Friends and basic bots give polite feedback. They don't prepare you for the "Bad Interviewer"—the one who cuts you off, doubts your skills, or acts bored.

Lack of Context: Generic bots ask generic questions. They don't know that you are applying for a Staff Engineer role at Uber and that your resume lacks Kubernetes experience.

💡 The Solution
Sparr AI is a hyper-realistic mock interview platform powered by Google Vertex AI (Reasoning) and ElevenLabs (Real-time Voice).

It is designed to simulate the pressure of a real interview. It reads your resume, understands the specific job you want, identifies your weaknesses, and then adopts a specific Persona to grill you.

If you ramble, it interrupts you. If you give a weak answer, it pushes back.

✨ Key Features
1. The "Context Wizard"
We don't just dump you into a chat. Sparr AI builds a mental model of the interview before it starts:

Company Knowledge: You type "Google" or "Airbnb," and Vertex AI instantly generates realistic team archetypes (e.g., "Google Cloud Infrastructure Team") based on its training data.

Resume Reconnaissance: You upload your PDF. The AI scans it against the target job to find your "Kill Zones"—the specific gaps in your skills (e.g., "Claimed expert in React but no TypeScript experience").

2. Dynamic Personas
Users can choose who interviews them:

The Friendly HR: Warm, focuses on culture fit.

The Hustler CTO: Fast-paced, cares about shipping code, hates theory.

The Algorithmic Purist: Obsessed with Big-O notation and efficiency.

3. 💀 Nightmare Mode (The "Gatekeeper")
Our viral feature. This persona is designed to break you.

High Interruption Sensitivity: If you say "um" or pause too long, it cuts you off.

Skeptical Tone: It challenges your assumptions. ("Are you sure that's how a hash map works?")

Stress Testing: It simulates the "Bar Raiser" interviews found at top tech companies.

4. Real-Time "Turn-Taking"
Powered by ElevenLabs Conversational AI, the latency is sub-second. You can interrupt the AI, and the AI can interrupt you. It feels like a phone call, not a walkie-talkie exchange.

🛠️ How We Built It (Technical Stack)
🧠 The Brain: Google Cloud Vertex AI (Gemini 1.5 Pro)
We use Gemini as the reasoning engine for the entire application.

Job Hallucination: We use Gemini to generate realistic job descriptions and team structures for any company the user types in, avoiding the need for illegal web scrapers.

Weakness Detection: Gemini analyzes the PDF text of the resume and compares it to the job description to output a JSON list of "Weaknesses."

System Prompt Generation: This is the core logic. We take the Persona, Job Context, and Weaknesses and have Gemini write a complex System Prompt (e.g., "Act as a rude interviewer...") which is then fed into the voice agent.

🗣️ The Voice: ElevenLabs Conversational AI
We utilize the new React SDK and Conversational Agent API.

Dynamic Overrides: We don't use a static agent. We programmatically inject the Gemini-generated prompt into the ElevenLabs agent at runtime using the overrides object.

Latency Tuning: We tune interruption_sensitivity and turn_eagerness based on the selected experience level (e.g., Senior roles get a more aggressive, fast-paced agent).

💻 The Stack
Frontend: React (Vite) + Tailwind CSS + Lucide Icons.

Backend: Node.js (Express) on Google Cloud Run (planned).

Storage: Multer (Memory Storage for PDF parsing).

🚀 How to Run Locally
Prerequisites
Google Cloud Service Account with Vertex AI User role.

ElevenLabs API Key and Agent ID.

Installation
Clone the Repo

Bash

git clone https://github.com/YOUR_USERNAME/sparr-ai.git
cd sparr-ai
Backend Setup

Bash

cd backend
npm install
# Place your Google Cloud 'key.json' in this folder
node server.js
Frontend Setup

Bash

cd ../frontend
npm install
# Open src/App.jsx and paste your ElevenLabs Agent ID
npm run dev
🌍 Challenges & Learnings
The "Polite AI" Problem: Initially, Gemini wanted to be too helpful. We had to use "Prompt Engineering" to force it to be rude and skeptical for the "Nightmare Mode."

Latency Balancing: Connecting the Resume Analysis (Vertex AI) to the Voice Agent (ElevenLabs) had to happen in seconds. We optimized the prompts to return JSON only, reducing the token count and processing time.

This is a very solid, user-centric flow. By breaking it down into steps, you are building Context layer by layer. The more context you feed the AI, the more realistic the interview becomes.

Here is the reasoning on how to architect this, specifically focusing on how Experience Level and Job Cards dictate the behavior of the AI.

1. The UX Architecture (Refined)
We will use a "Wizard" pattern (Multi-step form). This keeps the user focused.

Step 1: Role & Experience Level
The List: Your list is good, but for Tech/Startups (which is your demo audience), I would add two specific nuances:

Internship

Entry Level (Junior)

Associate / Mid-Level

Senior

Staff / Principal (Crucial distinction in tech—these are technical leaders, not managers)

Manager / Director

Executive (C-Suite/VP)

The Logic: This input changes the Vocabulary and Pacing of the AI.

Junior: AI asks "How" questions (implementation).

Executive: AI asks "Why" questions (strategy) and speaks faster.

Step 2: Company & Job "Archetypes" (The Card View)
The Problem: A "Product Manager at Google" is vague. It could be technical, growth-focused, or design-focused.

The Solution (Your Card View): When the user selects "Google" + "Product Manager," you don't just show generic requirements. You use Vertex AI to generate 3 distinct Archetypes (5 is too slow to generate live; 3 is faster and sufficient).

Gemini Prompt for Cards:

"User wants to interview for [Role] at [Company]. Generate 3 distinct 'Job Archetypes' for this position based on real-world team structures. Output JSON: { title: 'Technical PM', focus: 'APIs & Cloud Infrastructure', key_skills: ['SQL', 'System Design'] }..."

Step 3: Resume & Weakness Extraction
Standard upload. Gemini scans PDF vs. the Selected Job Card to find gaps.

Step 4: Persona & Launch
User picks the "Vibe" (e.g., The Nightmare Gatekeeper).

2. How "Experience Level" Fine-Tunes ElevenLabs
This is the "Secret Sauce." You don't just tell the AI "You are interviewing an executive." You actually tweak the ElevenLabs Agent Settings programmatically based on the level.

Here is a mapping strategy you can use in your code:

Experience Level	AI Interruption Sensitivity	AI Turn Eagerness	Prompt Instruction
Intern / Junior	Low (0.5)	Relaxed	"Be encouraging. If they struggle, offer a small hint. Speak at a moderate pace."
Mid / Senior	Medium (0.7)	Normal	"Be professional. Expect competence. Do not give hints. Move to the next question if they stall."
Executive / Staff	High (0.9)	Eager	"Be succinct. Value time. Interrupt if they get into the weeds. Demand high-level strategy, not tactics."

Export to Sheets

3. The "Grand Unified Prompt" (Technical Implementation)
When the user hits "Start Interview," you need to bundle all that data into one massive instruction for Gemini (which drives the ElevenLabs agent).

The Variable Assembly:

JavaScript

// This happens in your Backend (Node/Python)
const systemPrompt = `
CONTEXT:
You are interviewing a candidate for the role of ${userRole} (${experienceLevel}) at ${companyName}.
Specific Job Focus: ${selectedJobCard.title} (${selectedJobCard.focus}).

INTERVIEWER PERSONA:
You are "${selectedPersona}". 
Behavior: ${personaInstructions}.

CANDIDATE WEAKNESSES (From Resume):
${resumeWeaknesses}

RULES OF ENGAGEMENT:
1. Since the candidate is ${experienceLevel}, adjust your complexity: ${complexityInstruction}.
2. Focus your questions on ${selectedJobCard.key_skills}.
3. Drill into the resume weaknesses listed above.
`;
4. Step-by-Step Implementation Plan
Phase A: The Data Collection (Frontend)
Search Bar: Use a simple local list for top 20 tech companies (Google, Microsoft, Amazon, etc.) for instant click. If they type "Other," just accept the text string.

Job Card Generation:

Loader: When they click "Next" after Company, show a skeleton loader: "Gemini is analyzing Google's hiring patterns..."

API Call: Send Company + Role to Vertex AI.

Return: Receive 3 JSON objects. Render them as selectable Cards.

Phase B: The Resume Analyzer
Upload PDF.

Send PDF text + Selected Job Card to Gemini.

Prompt: "Compare this resume to this specific job description. Find 3 missing skills or weak points."

Phase C: The "Agent Configurator" (The Glue)
This is where you meet the rules of the Hackathon (using ElevenLabs Agents).

When initializing the useConversation hook in React:

JavaScript

// React Component
const startInterview = async () => {
  // 1. Determine settings based on experience level
  const sensitivity = experienceLevel === 'Executive' ? 'high' : 'low';
  
  await conversation.startSession({
    agentId: 'YOUR_AGENT_ID',
    overrides: {
      agent: {
        prompt: { prompt: generatedSystemPrompt }, // The Grand Unified Prompt
        language: 'en', // Or dynamic based on user preference
        firstMessage: `Hello. Thanks for coming in for the ${selectedJobCard.title} role. Let's get started.`,
      },
      // Note: Some agent settings like "Interruption" might need to be set 
      // via the ElevenLabs REST API updating the agent config before the call, 
      // or check SDK docs if dynamic interruption setting is supported in your version.
      // If not, use the prompt to enforce behavior: "INTERRUPT OFTEN."
    }
  });
};
5. Are you missing anything? (Refinement)
The "Company Not Found" Fallback: You mentioned: "If we don't find the company, we populate... closely related searches."

Better Approach: If the user types a small startup (e.g., "Rwandan Coffee Tech Ltd"), Gemini won't know it.

Fallback Logic: If Gemini returns "I don't know this company," your code should automatically prompt Gemini to Hallucinate a Generic Equivalent.

Prompt: "User entered 'Rwandan Coffee Tech'. I don't have data. Generate job cards for a 'Generic Ag-Tech Startup' instead."

🎭 The Real-World Personas (Use These 5)
You asked for realistic behaviors. Here are 5 distinct archetypes that cover 90% of tech interviews.

1. The "FAANG" Algorithmic Purist

Behavior: Cold, logical, obsessed with efficiency (Big O notation). Doesn't care about your personality; cares if your code handles edge cases.

Catchphrase: "That solution works, but can you optimize it to O(n)?"

ElevenLabs Voice: "Clyde" (Deep, serious, monotone).

Best for: Users applying to Google, Meta, Netflix.

2. The "Startup Hustler" CTO

Behavior: Impatient, pragmatic, hates "theory." Wants to know if you can ship code today. Will interrupt you if you talk about "process."

Catchphrase: "Okay, skip the academic stuff. If the server crashes on Black Friday, what do you do?"

ElevenLabs Voice: "Fin" (Fast-paced, energetic, slightly aggressive).

Best for: Users applying to Seed/Series A startups.

3. The "Behavioral" HR Manager

Behavior: Warm but probing. Obsessed with "Culture Fit" and "Soft Skills." Uses the STAR method (Situation, Task, Action, Result). Digs into conflict resolution.

Catchphrase: "Tell me about a time you disagreed with a coworker. How did that make you feel?"

ElevenLabs Voice: "Bella" (Soft, empathetic, but insistent).

Best for: First-round screens at large corporations.

4. The "Skeptical" Senior Engineer

Behavior: Detects BS immediately. If you mention a buzzword (e.g., "Kubernetes"), they drill down until you admit you don't know it. Hates polished answers.

Catchphrase: "Wait, you said you 'architected' the database. Did you actually write the schema, or did you just use the ORM?"

ElevenLabs Voice: "Charlie" (Raspy, tired, cynical).

Best for: Technical deep dives.

5. The "Vibe Check" Peer

Behavior: Casual, unstructured. Wants to see if you are fun to work with. Asks random questions.

Catchphrase: "So, what's the coolest thing you've built recently? Just nerd out with me."

ElevenLabs Voice: "Josh" (Casual, younger sounding).

Best for: Final team-match interviews.

Most "Mock Interview" apps are just text-to-speech bots that wait for you to finish talking. They feel robotic. Your "Winning Angle" here is Latency and Interruption. A real interviewer doesn't wait 3 seconds of silence to speak; they cut you off if you are boring.

Here is the "Winning" Blueprint for the Mock Interview Coach.

The "Tough Love" Architecture
To win, this needs to be more than a chatbot. It needs to be a multimodal feedback loop.

The Workflow (Technical & Compliant)
The Context Injection (Google Cloud Storage + Vertex AI):

User uploads resume.pdf.

Stored in Google Cloud Storage.

Vertex AI (Gemini 1.5 Pro) reads the PDF.

The Twist: Gemini doesn't just "summarize" it. It generates a System Prompt for the ElevenLabs Agent based on the resume's weak points.

Gemini Output Example: "You are a skeptical CTO. The candidate lists 'Expert Python' but has no GitHub link. Grill them on Python memory management. If they hesitate, push harder."

The Conversation (ElevenLabs React SDK):

The Web App initializes the ElevenLabs Conversational Agent.

You inject the "Skeptical CTO" prompt dynamically.

The Feature to Highlight: Turn-Taking. Use the ElevenLabs settings to set interruption_sensitivity to High.

Result: If the user starts rambling ("Well, um, I think, uh..."), the AI cuts in: "You're avoiding the question. How do you handle garbage collection? Answer briefly."

The Analysis (Post-Game Report):

Once the call ends, you take the transcript.

Feed it back to Vertex AI.

Gemini generates a JSON Report Card:

confidence_score: 65/100

filler_words: ["um", "like", "sort of"]

missed_technical_concepts: ["GIL", "Memory Leaks"]

Strategic Advice for the Video (The "Before & After")
This video needs to show emotional stress.

0:00 - 0:30: The Setup.

Show the user uploading a resume.

Show a selector: "Choose Difficulty."

Options: Friendly HR (Easy) vs. The "10x Engineer" (Nightmare Mode).

User clicks "Nightmare Mode."

0:30 - 1:30: The "Interruption" (The Money Shot).

User starts talking: "So, in my last project, I managed a team of, you know, like, 5 people and we..."

AI (Cutting in sharply): "I don't care about the team size. What was the ROI? Give me a number."

User (Visibly flustered): "Uh, well, it was..."

AI: "If you don't know the number, just say you don't know."

Note: This demonstrates the low latency and "human-like" rudeness that impresses judges.

1:30 - 2:00: The Feedback.

The call ends.

Screen fades to a Dashboard generated by Datadog (if you want to squeeze in the Datadog challenge too for extra points) or just a nice UI.

Highlight the "Filler Word Counter: 42 'Ums' detected."

2:00 - 3:00: Tech Explanation.

"We used Vertex AI to analyze the resume and create the persona, and ElevenLabs for the real-time, interruptible voice agent."

Why this beats other "Interview Bots"
Dynamic Personas: Most bots are generic. Yours reads the resume first, so the questions are scary accurate. (e.g., "I see a gap in 2023. What were you doing?")

Latency: Standard Speech-to-Text -> LLM -> Text-to-Speech pipelines take 3-5 seconds. ElevenLabs Agent API is sub-second. This makes the "Interruption" possible.

The "Ouch" Factor: Feedback is useless if it's too nice. By building a "Nightmare Mode," you make the app fun and viral.

Rwanda Context Tip: You could add a "Localization" toggle.

Prompt to Gemini: "Act as a strict Rwandan Bank Manager. Use local context and business etiquette expected in Kigali."

This adds a nice touch of "Cultural AI" that judges appreciate.

Next Steps to consider:

Yes! You can absolutely integrate Datadog and Confluent into the "Mock Interview Coach." In fact, adding them transforms the project from a "fun app" into an "Enterprise HR Platform" (which judges love).

Here is how to seamlessly weave them in without it feeling forced.

1. Adding Datadog (The "Examiner's Console")
Recommended: YES (High Priority). It fits the challenge perfectly.

The Logic: Even AI employees need a manager. Datadog acts as the "Manager" watching the AI Interviewer to ensure it isn't breaking or burning money.

What it monitors:

Token Usage/Cost: "This interview cost $0.42 in Gemini credits."

Latency: "The AI took 2.5 seconds to reply (Too slow!)."

Sentiment Drift: Track the user's stress levels over time.

Hallucinations: If the AI asks a question about a skill not on the resume, flag it as an error.

How to implement (Datadog Challenge):

Use the Datadog LLM Observability SDK.

Wrap your ElevenLabs/Gemini calls with Datadog spans.

The Demo Moment: Show a dashboard called "HR Admin View." While the user is sweating in the interview, switch tabs to show Datadog graphing their "Nervousness Score" in real-time.

2. Adding Confluent (The "Live Classroom" Feature)
Recommended: ONLY if you want to target Schools/Job Fairs.

The Logic: If you just have one user, Confluent (streaming) is overkill. But if you frame this as a tool for a University Job Fair where 100 students are interviewing simultaneously, Confluent becomes essential.

What it does:

It treats every "spoken word" in every interview as a Real-Time Data Stream.

It aggregates the data to answer: "What skills are students struggling with right now?"

The Implementation (Confluent Challenge):

Producer: Your React App sends interview transcripts to a Confluent Topic (interview_stream) every 5 seconds.

Consumer: A Google Cloud Function reads the stream, uses Gemini to categorize the topic (e.g., "Python Question"), and updates a live "Skill Gap" chart.

The Demo Moment: "We are simulating a job fair. Here are 5 active interviews. Confluent tells us instantly that 80% of candidates are failing the 'React Hooks' question, so we should change the curriculum."

The "Grand Unification" Architecture (Interview Edition)
If you combine all three, your project becomes "TalentFlow: The AI Recruitment Suite."

Updated Workflow
User (React): Uploads Resume -> Google Cloud Storage.

Interview (ElevenLabs): The AI grills the user (Interruption/Voice).

Observability (Datadog): Monitors the AI's performance (Latency/Cost) so the company doesn't go broke.

Analytics (Confluent): Streams the user's answers to a live dashboard for the "Hiring Manager" to see instantly without listening to the whole audio.

My Recommendation
Add Datadog. It is easy to implement (just API wrappers) and makes the project look professional. Skip Confluent unless you are comfortable simulating "fake traffic" (generating dummy interview data) to show off the streaming capabilities. If you focus on just one user, Confluent adds too much complexity for too little gain.