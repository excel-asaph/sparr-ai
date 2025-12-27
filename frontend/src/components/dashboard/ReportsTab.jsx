import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart2, Calendar } from 'lucide-react';
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
        <div className="h-full w-full flex bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200">
            {/* LEFT PANE: Session List */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col bg-gray-50">
                <div className="p-4 border-b border-gray-200 bg-white">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <BarChart2 className="w-5 h-5 text-gray-600" />
                        Interview Reports
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                        Select a session to view detailed performance metrics.
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {MOCK_SESSIONS.map((session) => {
                        const isSelected = selectedSession.id === session.id;
                        return (
                            <button
                                key={session.id}
                                onClick={() => setSelectedSession(session)}
                                className={`w-full text-left p-3 rounded-xl transition-all duration-200 border ${isSelected
                                    ? 'bg-white border-blue-500 shadow-md ring-1 ring-blue-100'
                                    : 'bg-white border-gray-100 hover:border-blue-300 hover:shadow-sm'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Avatar / Icon */}
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm"
                                        style={{ backgroundColor: session.companyColor }}
                                    >
                                        {session.company.charAt(0)}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className={`font-semibold text-sm truncate ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                                                {session.role}
                                            </h3>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${session.overallScore >= 80 ? 'bg-green-50 text-green-600' :
                                                session.overallScore >= 60 ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'
                                                }`}>
                                                {session.overallScore}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                            <span className="text-[10px] text-gray-400">@ {session.company}</span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* RIGHT PANE: Report Detail */}
            <div className="flex-1 bg-gray-50/50 flex flex-col relative overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={selectedSession.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="h-full w-full overflow-y-auto"
                    >
                        {/* Pass session prop correctly */}
                        <ReportDetail session={selectedSession} />
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ReportsTab;
