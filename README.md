# Sparr AI: The Interview Gauntlet

> **"Your AI Sparring Partner. It doesn't just ask questions; it interrupts, challenges, and trains you for the reality of high-stakes interviews."**

![Sparr AI Banner](frontend/public/logo_icon.png)

## Introduction
**Sparr AI** is a hyper-realistic mock interview platform built for the **AI Partner Catalyst Hackathon (Google Cloud x ElevenLabs)**. 

Unlike traditional "polite" AI interviewers that wait 3 seconds before responding, Sparr AI leverages **ElevenLabs' low-latency Conversational Agents** to simulate the pressure of a real interview. It interrupts you if you ramble, grills you on your resume's weaknesses, and adapts its personality—from a friendly HR manager to a "Nightmare Mode" CTO who hates buzzwords.

Powered by **Google Vertex AI (Gemini 1.5 Pro)** for reasoning and **ElevenLabs** for voice, Sparr AI turns interview prep into a full-contact sport.

---

## Key Features

### 1. The Context Wizard & Resume Reconnaissance
We don't just dump you into a chat. Sparr AI builds a mental model of the interview before it starts:
*   **Job Archetypes**: Type "Google" or "Start-up", and **Vertex AI** instantly hallucinates realistic team structures (e.g., "Google Cloud Infra Team") and technical requirements.
*   **Kill Zones**: Upload your Resume (PDF). The AI scans it against the target job to find your specific gaps (e.g., "Claimed expert in React but no TypeScript experience").

### 2. Dynamic Personas
Choose who interviews you. The system injects a bespoke **System Prompt** into the agent based on your choice:
*   **The Algorithmic Purist**: Obsessed with Big-O notation. Cold, logical, efficient.
*   **The Startup Hustler**: Impatient. Cares about shipping code. Will cut you off if you talk theory.
*   **Nightmare Mode (The Gatekeeper)**: High interruption sensitivity. Challenges every assumption. Designed to break you.

### 3. Real-Time "Turn-Taking"
Powered by **ElevenLabs conversational AI**, the latency is sub-second. 
*   **Interruption**: If you start saying "um... like...", the AI cuts you off: *"You're rambling. Get to the point."*
*   **Natural Flow**: It feels like a phone call, not a walkie-talkie exchange.

### 4. Spaces & Workbooks (The "Golden Rule" Architecture)
Sparr AI introduces **Spaces** to manage your interview loops.
*   **Linked Sessions**: Create a chain of interviews (Screening -> Technical -> Follow-up).
*   **State-FirstSync**: Our "Golden Rule" engineering philosophy ensures that app state is always the single source of truth, synchronizing instantly with the database to prevent data staleness.

### 5. Resume Management
A dedicated hub to manage your tailored resumes.
*   **Smart Selection**: Automatically filters and displays distinctive resumes used across your interview chains, avoiding duplicates from linked sessions.
*   **Instant Preview**: Integrated PDF viewer to review the exact document the AI is analyzing.

---

## Tech Stack

### Frontend
*   **React (Vite)**: Lighting fast UI.
*   **Tailwind CSS**: Modern, responsive styling.
*   **Framer Motion**: Smooth, premium animations.
*   **Lucide Icons**: Clean visual language.

### Backend & AI
*   **Node.js (Express)**: Robust API layer.
*   **Google Vertex AI (Gemini 1.5 Pro)**: The "Brain" – handles reasoning, prompt generation, and resume analysis.
*   **ElevenLabs Conversational AI**: The "Voice" – handles low-latency speech synthesis and active listening/interruption.
*   **Firebase Firestore**: NoSQL database for flexible interview object storage.
*   **Firebase Storage**: Secure hosting for user resumes.

---

## Architecture: The "Golden Rule"

> *"The golden rule is that all interviews... if any changes occur to them, it would be saved in the state of the app first before (or concurrently with) sending to the database. So any interview that is created or updated is always up to date."*

We strictly adhere to a **State-Sync** pattern. When a user creates an interview:
1.  **Optimistic Creation**: The UI prepares the interview object.
2.  **Server Synchronization**: The backend persists the data (including uploading resumes to Cloud Storage) and *immediately returns* the authoritative data properties (like the generated PDF URL).
3.  **Atomic Update**: The local state is updated atomically with the server response, ensuring that features like the Resume Viewer have valid pointers instantly without page reloads.

---

## Installation & Setup

### Prerequisites
*   Node.js (v18+)
*   Google Cloud Service Account (Vertex AI User role)
*   ElevenLabs API Key & Agent ID
*   Firebase Project (Auth, Firestore, Storage enabled)

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/sparr-ai.git
cd sparr-ai
```

### 2. Backend Setup
```bash
cd backend
npm install
```
*   Place your Google Cloud Service Account JSON key in `backend/` (update `.env` or `server.js` path).
*   Start the server:
```bash
node server.js
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```
*   Create a `.env` file with your keys:
    ```env
    VITE_FIREBASE_API_KEY=...
    VITE_ELEVENLABS_AGENT_ID=...
    ```
*   Start the dev server:
```bash
npm run dev
```

---

## Hackathon Challenges
This project specifically targets the **ElevenLabs Challenge** by pushing the boundaries of what is possible with Voice AI:
*   **Multimodal Context**: We feed Gemini (Vertex AI) with rich context (PDFs, Job Cards), which then dynamically programs the ElevenLabs Agent.
*   **Agentic Behavior**: The AI isn't just a chatbot; it has goals (e.g., "Find the weakness," "Stress test the candidate").

---

## License
MIT License.

---