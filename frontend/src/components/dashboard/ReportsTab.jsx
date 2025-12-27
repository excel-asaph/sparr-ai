import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SessionCard from './SessionCard';
import ReportDetail from './ReportDetail';

// Mock data for MVP
const MOCK_SESSIONS = [
    {
        id: "interview_001",
        role: "Senior React Developer",
        company: "Google",
        companyColor: "#4285F4",
        date: "2024-12-21T14:30:00",
        overallScore: 85,
        skills: {
            technical: 90,
            communication: 80,
            confidence: 85,
            pacing: 75,
            empathy: 88,
            problemSolving: 92
        },
        highlights: [
            {
                timestamp: "02:14",
                type: "warning",
                text: "You hesitated on the CAP Theorem question",
                audioUrl: null
            },
            {
                timestamp: "05:30",
                type: "success",
                text: "Great use of the STAR method!",
                audioUrl: null
            },
            {
                timestamp: "08:45",
                type: "success",
                text: "Excellent explanation of React hooks lifecycle",
                audioUrl: null
            },
            {
                timestamp: "12:20",
                type: "critical",
                text: "Missed opportunity to discuss performance optimization",
                audioUrl: null
            }
        ],
        agent: {
            name: "Michael",
            avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop",
            persona: "Senior Reviewer"
        }
    },
    {
        id: "interview_002",
        role: "Full Stack Engineer",
        company: "Meta",
        companyColor: "#0668E1",
        date: "2024-12-20T10:15:00",
        overallScore: 72,
        skills: {
            technical: 75,
            communication: 70,
            confidence: 68,
            pacing: 72,
            empathy: 75,
            problemSolving: 78
        },
        highlights: [
            {
                timestamp: "01:30",
                type: "success",
                text: "Strong opening with clear communication",
                audioUrl: null
            },
            {
                timestamp: "06:15",
                type: "warning",
                text: "Could improve explanation of database indexing",
                audioUrl: null
            },
            {
                timestamp: "10:00",
                type: "critical",
                text: "Struggled with system design scalability question",
                audioUrl: null
            }
        ],
        agent: {
            name: "Sarah",
            avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
            persona: "Tech Lead"
        }
    },
    {
        id: "interview_003",
        role: "Software Engineer",
        company: "Amazon",
        companyColor: "#FF9900",
        date: "2024-12-19T16:00:00",
        overallScore: 91,
        skills: {
            technical: 95,
            communication: 88,
            confidence: 90,
            pacing: 89,
            empathy: 92,
            problemSolving: 94
        },
        highlights: [
            {
                timestamp: "03:20",
                type: "success",
                text: "Outstanding problem decomposition",
                audioUrl: null
            },
            {
                timestamp: "07:45",
                type: "success",
                text: "Perfect use of leadership principles",
                audioUrl: null
            },
            {
                timestamp: "11:30",
                type: "success",
                text: "Exceptional handling of follow-up questions",
                audioUrl: null
            }
        ],
        agent: {
            name: "David",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
            persona: "Principal Engineer"
        }
    }
];

const ReportsTab = () => {
    const [selectedSession, setSelectedSession] = useState(MOCK_SESSIONS[0]);

    return (
        <div className="w-full h-full flex gap-4 p-8">
            {/* Left Panel: Session Log */}
            <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}
                // Bento Card Style: White, High Radius, Subtle Border, No Blur needed if opaque
                className="w-[30%] h-full bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-bold text-gray-800 tracking-tight">Interview History</h2>
                    <p className="text-xs font-medium text-gray-500 mt-1 uppercase tracking-wide">{MOCK_SESSIONS.length} sessions recorded</p>
                </div>

                {/* Session List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                    {MOCK_SESSIONS.map((session) => (
                        <SessionCard
                            key={session.id}
                            session={session}
                            isActive={selectedSession.id === session.id}
                            onClick={() => setSelectedSession(session)}
                        />
                    ))}
                </div>
            </motion.div>

            {/* Right Panel: Deep Dive */}
            <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="flex-1 h-full"
            >
                <AnimatePresence mode="wait">
                    <ReportDetail key={selectedSession.id} session={selectedSession} />
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default ReportsTab;
