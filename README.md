# Sparr AI — Survive The Interview

> **Train with the AI interviewer that challenges you, probes your weaknesses, and prepares you for reality.**

![Sparr AI Banner](frontend/public/logo_icon.png)

---

## 🎥 Demo Video

[![Watch the Demo](https://img.shields.io/badge/YouTube-Watch%20Demo-red?style=for-the-badge&logo=youtube)](https://youtube.com/your-demo-link)

> *3-minute walkthrough showing the full interview experience*

---

## 🌐 Live Demo

**[Try Sparr AI Live →](https://sparr-ai.vercel.app)**

> *Note: Requires microphone access for voice interviews*

---

## 🏆 Challenge

**ElevenLabs Challenge** — *AI Partner Catalyst Hackathon (Google Cloud x ElevenLabs)*

> Use ElevenLabs and Google Cloud AI to make your app conversational, intelligent, and voice-driven.

---

## ✨ What is Sparr AI?

**Sparr AI** is a hyper-realistic mock interview platform that turns interview prep into a full-contact sport.

### The Problem
Traditional interview prep tools are polite, scripted, and predictable. Real interviews are not. Candidates walk into high-stakes situations unprepared for pressure, follow-up questions, and tough personas.

### Our Solution
Unlike passive interview simulators, Sparr AI uses **ElevenLabs Conversational Agents** for low-latency voice interaction and **Google Vertex AI (Gemini 2.0 Flash)** for intelligent reasoning — creating interviews that feel *real*.

---

## 🎯 Key Features

| Feature | Description |
|---------|-------------|
| **5 Distinct Interviewer Personas** | From friendly HR to a ruthless "Nightmare Mode" CTO |
| **Resume-Aware Probing** | AI identifies and challenges your weak points |
| **Company-Specific Job Archetypes** | Generated for FAANG and custom companies |
| **10+ Languages** | Multilingual voice interviews powered by ElevenLabs |
| **Detailed Post-Interview Reports** | AI-generated performance analysis with actionable feedback |
| **Session Spaces** | Continue interviews with context from previous sessions |

### Interviewer Personas

| Persona | Style |
|---------|-------|
| **Ellen** | Warm, empathetic, HR-style behavioral focus |
| **Michael** | Cold, logical, obsessed with Big-O notation |
| **Kelsey** | Deep architectural pressure testing |
| **Alex** | Impatient startup energy, wants to see you ship |
| **The Gatekeeper** | Nightmare Mode — challenges every assumption |

---

## 📸 Screenshots

<!-- Add your screenshots here -->

| Landing Page | Interview in Progress | Report View |
|--------------|----------------------|-------------|
| ![Landing](screenshots/landing.png) | ![Interview](screenshots/interview.png) | ![Report](screenshots/report.png) |

> *Screenshots to be added before final submission*

---

## 🛠 Technology Stack

### Google Cloud Integration
| Service | Usage |
|---------|-------|
| **Vertex AI (Gemini 2.0 Flash)** | Job archetype generation, resume analysis, system prompt crafting, report generation |
| **Firebase Auth** | User authentication (Anonymous + Google Sign-In) |
| **Firebase Firestore** | Interview session storage, user data |
| **Firebase Storage** | Resume PDF storage |

### ElevenLabs Integration
| Feature | Usage |
|---------|-------|
| **Conversational AI Agents** | Real-time voice interviews with sub-second latency |
| **Voice Cloning** | Distinct voices for each interviewer persona |
| **Multilingual TTS** | Support for 10+ languages |
| **Speech-to-Text** | Accurate transcription for reports |
| **React SDK** | `@elevenlabs/react` for seamless frontend integration |

### Frontend
- React (Vite) — Lightning-fast UI
- Tailwind CSS — Modern styling
- Framer Motion — Smooth animations

### Backend
- Node.js (Express) — API server
- pdf-parse — Resume PDF extraction

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│  React + Tailwind + Framer Motion + ElevenLabs SDK          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     NODE.JS BACKEND                         │
│  /api/generate-jobs    → Gemini (Job Archetypes)            │
│  /api/analyze-resume   → Gemini (Weakness Extraction)       │
│  /api/generate-prompt  → Gemini (System Prompt for Agent)   │
│  /api/generate-report  → Gemini (Post-Interview Analysis)   │
│  /api/interviews       → Firestore (CRUD)                   │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌──────────────────────┐         ┌──────────────────────┐
│   GOOGLE VERTEX AI   │         │     ELEVENLABS       │
│   (Gemini 2.0 Flash) │         │  (Conversational AI) │
│                      │         │                      │
│  • Job Generation    │         │  • Voice Synthesis   │
│  • Resume Analysis   │         │  • Real-time STT     │
│  • Prompt Crafting   │         │  • Persona Voices    │
│  • Report Writing    │         │  • Multi-language    │
└──────────────────────┘         └──────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- Google Cloud Account (Vertex AI enabled)
- ElevenLabs Account (API Key + Agent ID)
- Firebase Project (Auth, Firestore, Storage)

### 1. Clone the Repository
```bash
git clone https://github.com/excel-asaph/sparr-ai.git
cd sparr-ai
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file:
```env
GOOGLE_APPLICATION_CREDENTIALS=./your-service-account.json
ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

Place your Google Cloud service account JSON in the `backend/` directory.

Start the server:
```bash
node server.js
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

Create a `.env` file:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_ELEVENLABS_AGENT_ID=your_elevenlabs_agent_id
```

Start the development server:
```bash
npm run dev
```

---

## 📊 Hackathon Alignment

### ElevenLabs Challenge Requirements ✅

| Requirement | Implementation |
|-------------|----------------|
| Use ElevenLabs for voice | ✅ ElevenLabs Conversational AI for real-time voice interviews |
| Use Google Cloud AI | ✅ Vertex AI (Gemini 2.0 Flash) for all reasoning tasks |
| Make app conversational | ✅ Full voice-driven interview experience |
| Natural voice & personality | ✅ 5 distinct personas with unique conversation styles |
| React SDK or server integration | ✅ ElevenLabs React SDK (`@elevenlabs/react`) |

### Judging Criteria

| Criteria | How We Address It |
|----------|-------------------|
| **Technological Implementation** | Deep integration of ElevenLabs + Vertex AI; clean architecture with proper separation of concerns |
| **Design** | Premium UI with animations, responsive layout, intuitive onboarding wizard, immersive interview experience |
| **Potential Impact** | Millions of job seekers can practice realistic interviews affordably — democratizing interview prep |
| **Quality of the Idea** | Unique persona system + resume-aware probing + session continuity is novel in the interview prep space |

---

## 💡 Learnings & Challenges

### What We Learned

1. **ElevenLabs Conversational AI is powerful** — The sub-second latency makes voice interactions feel natural. The `firstMessage` override was key to creating personalized greetings.

2. **Gemini excels at context-aware generation** — From generating realistic job archetypes to crafting persona-specific system prompts, Gemini 2.0 Flash handled complex reasoning tasks efficiently.

3. **State synchronization is critical** — Managing interview state across Firebase, React, and ElevenLabs required careful design to ensure data integrity.

### Challenges Faced

1. **Audio-to-transcript timing** — Aligning feedback pins with audio playback required using actual audio duration rather than estimated values.

2. **Session continuity** — Implementing "Spaces" (linked interview sessions) required robust linked-list management in Firestore.

3. **Persona voice consistency** — Ensuring each persona maintained their character throughout the interview required detailed system prompts.

---

## 📁 Project Structure

```
sparr-ai/
├── backend/
│   ├── server.js          # Express API (Gemini + Firebase)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/         # LandingPage, DashboardPage, LoginPage
│   │   ├── components/    # VoiceOrb, SessionSetupWizard, ReportsTab
│   │   ├── contexts/      # AuthContext (Firebase)
│   │   └── data/          # Personas, Languages
│   └── package.json
├── LICENSE                # MIT License
└── README.md
```

---

## 👥 Team

Built for the **AI Partner Catalyst Hackathon** (Google Cloud x ElevenLabs x Devpost)

| Name | Role |
|------|------|
| **Excel Asaph** | Lead Developer |
| **Emmanuel Obolo** | Developer |
| **Abiodun Kumuyi** | Developer |

---

## 📜 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Survive The Interview. Train with pressure. Perform under less.**

*Built with ❤️ using Google Cloud & ElevenLabs*

</div>