import { useState } from 'react';
import axios from 'axios';
import { useConversation } from '@elevenlabs/react';
import { Mic, Upload, Briefcase, Skull } from 'lucide-react';

const API_URL = 'http://localhost:3000/api';
const AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID;

const PERSONAS = [
  {
    id: 'faang',
    name: 'Ellen',
    emoji: '🤖',
    description: 'the "FAANG" Engineer; Cold, logical, obsessed with efficiency (Big O).',
    voiceId: 'BIvP0GN1cAtSRTxNHnWS',
    style: 'Deep, serious, monotone'
  },
  {
    id: 'startup',
    name: 'Mark',
    emoji: '🚀',
    description: 'The Startup Hustler CTO;Impatient, pragmatic, hates theory. Wants to ship.',
    voiceId: 'UgBBYS2sOqTuMpoF3BR0',
    style: 'Fast-paced, energetic'
  },
  {
    id: 'hr',
    name: 'Kelsey',
    emoji: '📋',
    description: 'The "Behavioral" HR Manager, Warm but probing. Obsessed with "Culture Fit".',
    voiceId: 'YY7fzZmDizFQQv8XPAIY',
    style: 'Soft, empathetic'
  },
  {
    id: 'skeptic',
    name: 'James',
    emoji: '🤨',
    description: 'The "Skeptical" Senior Engineer; Detects BS immediately. Drills down on buzzwords.',
    voiceId: 'KiAVAr8isNbPP0s3etPX',
    style: 'Raspy, tired, cynical'
  },
  {
    id: 'vibe',
    name: 'Michael',
    emoji: '🤙',
    description: 'The "Vibe Check" Peer; Casual, unstructured. Wants to see if you are fun.',
    voiceId: 'ljX1ZrXuDIIRVcmiVSyR',
    style: 'Casual, younger'
  }
];

export default function InterviewWizard() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ company: '', role: '', level: 'Mid-Level' });
  const [jobCards, setJobCards] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [weaknesses, setWeaknesses] = useState([]);
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [loading, setLoading] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);

  // ElevenLabs Hook
  const conversation = useConversation({
    onMessage: (msg) => console.log("AI:", msg),
    onError: (err) => console.error(err),
  });

  const { status, isSpeaking } = conversation;

  // STEP 1: GET JOBS
  const handleJobSearch = async () => {
    setLoading(true);
    const res = await axios.post(`${API_URL}/generate-jobs`, formData);
    setJobCards(res.data);
    setLoading(false);
    setStep(2);
  };

  // STEP 2: ANALYZE RESUME
  const handleFileUpload = async (e) => {
    setLoading(true);
    const file = e.target.files[0];
    const data = new FormData();
    data.append('resume', file);
    data.append('jobContext', JSON.stringify(selectedJob));

    const res = await axios.post(`${API_URL}/analyze-resume`, data);
    setWeaknesses(res.data.weaknesses);
    setLoading(false);
    setStep(3);
  };

  // STEP 3: START INTERVIEW
  const startInterview = async (persona) => {
    setSelectedPersona(persona.name);
    setLoading(true);

    // 1. Get System Prompt from Backend
    const res = await axios.post(`${API_URL}/generate-system-prompt`, {
      ...formData,
      jobArchetype: selectedJob,
      weaknesses,
      persona: persona.name,
      personaDescription: persona.description,
      personaStyle: persona.style
    });

    const systemPrompt = res.data.system_prompt;

    // 2. Request Microphone Access
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      console.error("Microphone access denied:", err);
      alert("Microphone access is required for the interview.");
      setLoading(false);
      return;
    }

    // 3. Connect to ElevenLabs with Override
    await conversation.startSession({
      agentId: AGENT_ID,
      overrides: {
        agent: {
          prompt: {
            prompt: systemPrompt,
          },
          firstMessage: `I am ${persona.name}. I see you have some gaps in your resume. Let's talk.`,
        },
        tts: {
          voiceId: persona.voiceId
        }
      },
    });

    setLoading(false);
    setInterviewStarted(true);
  };

  if (interviewStarted) {
    return (
      <div className="h-screen bg-black text-white flex flex-col items-center justify-center">
        <div className={`w-64 h-64 rounded-full flex items-center justify-center transition-all duration-200 ${status === 'connected'
            ? (isSpeaking ? 'bg-red-600 scale-110' : 'bg-red-900')
            : 'bg-gray-700 animate-pulse'
          }`}>
          <Mic size={64} className={isSpeaking ? 'animate-bounce' : ''} />
        </div>

        <h1 className="text-4xl font-bold mb-4 mt-8">
          {status === 'connected' ? 'Interview in Progress' : 'Connecting to Agent...'}
        </h1>

        <p className="text-gray-400 mb-8">Persona: {selectedPersona}</p>

        <button
          onClick={() => { conversation.endSession(); window.location.reload(); }}
          className="px-8 py-4 bg-gray-800 rounded-lg hover:bg-gray-700 border border-gray-600"
        >
          End Call
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-xl p-8">
        {/* HEADER */}
        <h1 className="text-3xl font-bold text-gray-800 mb-2">TalentFlow AI</h1>
        <div className="h-2 bg-gray-100 rounded mb-8">
          <div className="h-full bg-blue-600 rounded transition-all" style={{ width: `${step * 33}%` }}></div>
        </div>

        {/* STEP 1: INPUTS */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Target Role</h2>
            <input
              className="w-full p-3 border rounded"
              placeholder="Company (e.g. Google)"
              value={formData.company}
              onChange={e => setFormData({ ...formData, company: e.target.value })}
            />
            <input
              className="w-full p-3 border rounded"
              placeholder="Role (e.g. Senior Product Manager)"
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value })}
            />
            <select
              className="w-full p-3 border rounded bg-white"
              value={formData.level}
              onChange={e => setFormData({ ...formData, level: e.target.value })}
            >
              <option value="Intern">Intern</option>
              <option value="Junior">Junior (Entry Level)</option>
              <option value="Mid-Level">Mid-Level</option>
              <option value="Senior">Senior</option>
              <option value="Staff">Staff / Principal</option>
              <option value="Manager">Engineering Manager</option>
              <option value="Executive">Executive (CTO/VP)</option>
            </select>
            <button
              onClick={handleJobSearch}
              disabled={loading}
              className="w-full bg-blue-600 text-white p-4 rounded-lg font-bold"
            >
              {loading ? "Consulting AI..." : "Find Job Matches"}
            </button>
          </div>
        )}

        {/* STEP 2: SELECT CARD */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Select Team Archetype</h2>
            <div className="grid gap-4">
              {jobCards.map((job, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedJob(job)}
                  className={`p-4 border-2 rounded-lg cursor-pointer hover:bg-blue-50 ${selectedJob === job ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}
                >
                  <h3 className="font-bold">{job.title}</h3>
                  <p className="text-sm text-gray-600">{job.focus}</p>
                </div>
              ))}
            </div>
            {selectedJob && (
              <div className="mt-4 border-t pt-4">
                <h3 className="font-semibold mb-2">Upload Resume (PDF)</h3>
                <input type="file" onChange={handleFileUpload} className="block w-full text-sm text-gray-500" />
                {loading && <p className="text-blue-600 mt-2 animate-pulse">Analyzing Weaknesses...</p>}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: PERSONA */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Select Interviewer</h2>

            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <h4 className="font-bold text-red-700">Weaknesses Detected:</h4>
              <ul className="list-disc ml-5 text-red-600">
                {weaknesses.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PERSONAS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => startInterview(p)}
                  className="p-4 border rounded-lg hover:bg-blue-50 text-left transition-all hover:shadow-md"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{p.emoji}</span>
                    <div>
                      <div className="font-bold text-gray-800">{p.name}</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider">{p.style}</div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{p.description}</p>
                </button>
              ))}
            </div>
            {loading && <p className="text-center mt-4 animate-pulse text-blue-600">Configuring Agent & Voice...</p>}
          </div>
        )}
      </div>
    </div>
  );
}
