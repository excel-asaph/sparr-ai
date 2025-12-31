/**
 * @fileoverview Reports Tab Container Component
 * 
 * Main container for browsing and viewing interview reports.
 * Features session list with score previews and detailed report view.
 * Handles report generation states (generating, ready, unavailable).
 * 
 * @module components/dashboard/ReportsTab
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart2, Calendar } from 'lucide-react';
import ReportDetail from './ReportDetail';
import ReportLoader from './ReportLoader';

// Process interview data - NO mock data fallback
// Only returns real data or marks as "generating"
const processInterview = (interview) => {
    // 1. Base: The Real Interview Data
    const baseData = {
        id: interview.id,
        role: interview.jobContext?.role || 'Software Engineer',
        company: interview.jobContext?.company || 'Company',
        date: interview.createdAt || interview.date || new Date().toISOString(),
        agent: interview.agent || interview.persona || { name: 'Interviewer', avatar: '' },
        recording: interview.recording || null,
        resumeContext: interview.resumeContext,
        companyColor: "#111827",
        jobContext: interview.jobContext,
        reportStatus: interview.reportStatus, // 'generating' | 'ready' | undefined
    };

    // 2. If Real Report exists (from Gemini) - use it
    if (interview.report && interview.report.stats) {
        return {
            ...baseData,
            ...interview.report,
            skills: interview.report.stats,
            recording: {
                ...baseData.recording,
                duration: interview.report.totalDuration || baseData.recording?.duration
            },
            audioUrl: interview.audioUrl || null, // Audio URL from Firebase Storage
            hasRealReport: true, // Flag to know this is real data
        };
    }

    // 3. No real report yet - just return base data
    // The UI will check reportStatus to decide what to show
    return {
        ...baseData,
        hasRealReport: false,
    };
};

const ReportsTab = ({ interviews = [], onNavigateToResumes }) => {
    // Process interviews without mock data fallback
    const processedSessions = React.useMemo(() => {
        if (!interviews || interviews.length === 0) return [];
        return interviews.map(processInterview).filter(Boolean);
    }, [interviews]);

    const [selectedSession, setSelectedSession] = useState(null);

    // Update selection when sessions change (including when report becomes ready)
    React.useEffect(() => {
        if (processedSessions.length > 0) {
            if (!selectedSession) {
                // No selection yet - select first
                setSelectedSession(processedSessions[0]);
            } else {
                // Always update selected session with fresh data
                const updatedSession = processedSessions.find(s => s.id === selectedSession.id);
                if (updatedSession) {
                    // Always sync to get latest reportStatus and hasRealReport
                    setSelectedSession(updatedSession);
                } else {
                    // Session no longer exists, select first
                    setSelectedSession(processedSessions[0]);
                }
            }
        }
    }, [processedSessions]);

    // Safety check if no sessions
    if (processedSessions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <BarChart2 className="w-16 h-16 mb-4 opacity-20" />
                <h3 className="text-lg font-medium">No Reports Yet</h3>
                <p className="text-sm">Complete an interview to see your analysis.</p>
            </div>
        );
    }

    // Guard: selectedSession might be null initially
    const activeSession = selectedSession || processedSessions[0];

    const handleViewResume = (resumeContext) => {
        if (onNavigateToResumes) {
            onNavigateToResumes(resumeContext);
        }
    };

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
                    {processedSessions.map((session) => {
                        const isSelected = activeSession && activeSession.id === session.id;
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
                                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm bg-gray-900"
                                    >
                                        {(typeof session.company === 'string' ? session.company : 'C').charAt(0)}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className={`font-semibold text-sm truncate ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                                                {session.role}
                                            </h3>
                                            {session.reportStatus === 'generating' ? (
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 animate-pulse">
                                                    Generating...
                                                </span>
                                            ) : session.hasRealReport ? (
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${session.overallScore >= 80 ? 'bg-green-50 text-green-600' :
                                                    session.overallScore >= 60 ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'
                                                    }`}>
                                                    {session.overallScore}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-400">
                                                    —
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                            <span className="text-[10px] text-gray-400">@ {typeof session.company === 'string' ? session.company : 'Company'}</span>
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
                    {activeSession && (
                        <motion.div
                            key={activeSession.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="h-full w-full"
                        >
                            {/* Three states: generating (loader), has report (detail), no report (message) */}
                            {activeSession.reportStatus === 'generating' ? (
                                <div className="h-full flex items-center justify-center bg-gray-50">
                                    <ReportLoader session={activeSession} />
                                </div>
                            ) : activeSession.hasRealReport ? (
                                <ReportDetail session={activeSession} onViewResume={handleViewResume} />
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400">
                                    <BarChart2 className="w-12 h-12 mb-3 opacity-30" />
                                    <p className="text-sm">Report not available for this interview.</p>
                                    <p className="text-xs mt-1 opacity-70">This may be a legacy interview or the report failed to generate.</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ReportsTab;
