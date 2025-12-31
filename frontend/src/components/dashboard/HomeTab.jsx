/**
 * @fileoverview Dashboard Home Tab Component
 * 
 * Main landing view within the dashboard displaying welcome message,
 * quick actions, recent session cards, and session statistics.
 * Provides entry points to start new interviews or continue existing ones.
 * 
 * @module components/dashboard/HomeTab
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Mic, Plus, Clock, Target, ArrowRight, Layers, X, Link2, BarChart3, ScanSearch } from 'lucide-react';

import SessionSetupWizard from './SessionSetupWizard';
import { PERSONAS } from '../../data/personas';

import { useAuth } from '../../contexts/AuthContext';

const HomeTab = ({ onStartSession, recentSessions = [], isLoadingRecent = false, onNavigateToSpaces, onNavigateToResumes, onNavigateToReports }) => {
    // Auth State
    const { currentUser } = useAuth();
    const firstName = currentUser?.displayName?.split(' ')[0] || 'Candidate';

    // UI State
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [wizardMode, setWizardMode] = useState('selection'); // 'selection' | 'wizard'

    // Mock Data for Stats
    const latestSession = recentSessions?.[0];
    const stats = {
        streak: 3,
        readiness: 85,
        upcomingGoal: latestSession
            ? `${latestSession.jobContext.role} @ ${latestSession.jobContext.company}`
            : "Senior Engineer @ Google"
    };

    // Derived State: Filtered Sessions (Unique Chains Only)
    const displaySessions = React.useMemo(() => {
        if (!recentSessions?.length) return [];
        // 1. Identify all IDs that serve as parents to other sessions in this list
        // If Session A is a parent of Session B, we should hide Session A and show Session B (the newer one)
        const parentIds = new Set(recentSessions.map(s => s.parentId).filter(Boolean));

        // 2. Keep only sessions that are NOT parents (i.e. the "heads" of the chains)
        const leaves = recentSessions.filter(s => !parentIds.has(s.id));

        // 3. Limit to 5
        return leaves.slice(0, 5);
    }, [recentSessions]);

    // Helper: Relative Date
    const getRelativeTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return date.toLocaleDateString();
    };

    // Helper: Deterministic Gradient based on string
    const getGradient = (str) => {
        const colors = [
            'from-blue-500 to-indigo-600',
            'from-purple-500 to-pink-600',
            'from-green-500 to-teal-600',
            'from-orange-500 to-red-600',
            'from-cyan-500 to-blue-600'
        ];
        // Simple hash
        let hash = 0;
        for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };

    const handleWizardCompletion = (sessionData) => {
        setIsWizardOpen(false);
        setWizardMode('selection');
        onStartSession(sessionData); // Pass data up to Dashboard
    };

    return (
        <div className="h-full w-full p-8 overflow-y-auto relative">
            {/* Header */}
            <header className="mb-8 flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Welcome back, {firstName}</h1>
                    <p className="text-gray-500 mt-1">Ready to crush your next interview?</p>
                </div>
            </header>

            {/* Main Content Grid */}
            <div className="space-y-12 pb-24">

                {/* 1. Hero / CTA Section */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full bg-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-200 relative overflow-hidden"
                >
                    <div className="relative z-10 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-md mb-6 border border-white/10">
                            <Target className="w-3 h-3" />
                            <span>Current Goal: {stats.upcomingGoal}</span>
                        </div>
                        <h2 className="text-3xl font-bold mb-4 tracking-tight">{latestSession ? "Continue Preparation" : "Start Your Journey"}</h2>
                        <p className="text-blue-100 text-base mb-8 leading-relaxed opacity-90">
                            {latestSession
                                ? `Pick up where you left off. Your last session focused on "${latestSession.jobContext.variant?.skills?.[0] || latestSession.jobContext.role}" and you showed great progress.`
                                : "Ready to start? Begin your first session to unlock personalized interview practice tailored to your goals."
                            }
                        </p>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => {
                                    setIsWizardOpen(true);
                                    setWizardMode('selection');
                                }}
                                className="bg-white text-blue-600 px-6 py-3 rounded-2xl font-bold flex items-center gap-3 shadow-lg hover:shadow-xl hover:scale-105 transition-all text-base"
                            >
                                <Play className="w-4 h-4 fill-current" />
                                Start Session
                            </button>
                            <span className="text-sm font-medium text-blue-200 bg-white/10 px-4 py-2 rounded-xl">~5 mins</span>
                        </div>
                    </div>

                    {/* Abstract Blob Background */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-blue-400/30 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
                    <div className="absolute bottom-0 right-20 w-64 h-64 bg-indigo-500/30 rounded-full blur-2xl pointer-events-none" />

                    {/* Vocal Wave Decoration */}
                    <div className="absolute right-0 bottom-0 top-0 w-1/2 pointer-events-none overflow-hidden flex items-end justify-end opacity-40">
                        <svg width="600" height="300" viewBox="0 0 600 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform translate-x-12 translate-y-12 scale-105 origin-bottom-right">
                            <path d="M50 150C100 150 120 60 180 60C240 60 270 240 330 240C390 240 420 120 480 120C540 120 570 180 630 180" stroke="white" strokeWidth="6" strokeLinecap="round" className="animate-pulse" style={{ animationDuration: '4s' }} />
                            <path d="M50 180C100 180 120 90 180 90C240 90 270 270 330 270C390 270 420 150 480 150C540 150 570 210 630 210" stroke="white" strokeWidth="3" strokeOpacity="0.5" />
                            <path d="M50 210C100 210 120 120 180 120C240 120 270 300 330 300C390 300 420 180 480 180C540 180 570 240 630 240" stroke="white" strokeWidth="2" strokeOpacity="0.3" />
                            {/* Accent Circle */}
                            <circle cx="550" cy="80" r="30" stroke="white" strokeWidth="3" strokeOpacity="0.2" />
                            <circle cx="550" cy="80" r="50" stroke="white" strokeWidth="1" strokeOpacity="0.1" />
                        </svg>
                    </div>
                </motion.div>

                {/* 2. Feature Cards (Spaces, Reports, Resumes) */}
                <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-6">What would you like to choose today?</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Card 1: Spaces (Magic/Sparkle Theme) */}
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="bg-[#1a1a1a] rounded-2xl p-6 relative overflow-hidden group min-h-[200px] flex flex-col justify-between shadow-lg border border-white/5 hover:border-white/20 transition-all duration-300"
                        >
                            <div className="relative z-10 w-[55%]">
                                <h3 className="text-white font-bold text-lg mb-2">Spaces</h3>
                                <p className="text-gray-400 text-xs font-medium mb-6 leading-relaxed">
                                    Your Interviewer remembers past sessions, allowing you to pick up exactly where you left off.
                                </p>
                            </div>

                            <div className="relative z-10 mt-auto w-[55%]">
                                <button
                                    onClick={onNavigateToSpaces}
                                    className="bg-[#333] hover:bg-[#444] text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors border border-white/10 flex items-center gap-2 group/btn w-fit"
                                >
                                    Enter Space
                                    <ArrowRight className="w-3 h-3 text-gray-400 opacity-0 -translate-x-2 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all duration-300" />
                                </button>
                            </div>

                            {/* Visual: Clean Icon Orb */}
                            <div className="absolute top-1/2 -translate-y-1/2 right-6 w-20 h-20 rounded-2xl bg-[#0f0f0f] border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:border-white/30 transition-all duration-300">
                                <Link2 className="w-9 h-9 text-gray-400 group-hover:text-white transition-colors duration-300" />
                            </div>
                        </motion.div>

                        {/* Card 2: Reports (Audio/Analysis Theme) */}
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="bg-[#1a1a1a] rounded-2xl p-6 relative overflow-hidden group min-h-[200px] flex flex-col justify-between shadow-lg border border-white/5 hover:border-white/20 transition-all duration-300"
                        >
                            <div className="relative z-10 w-[55%]">
                                <h3 className="text-white font-bold text-lg mb-2">Reports</h3>
                                <p className="text-gray-400 text-xs font-medium mb-6 leading-relaxed">
                                    Measure your growth over time, highlight strengths and focused areas for improvement.
                                </p>
                            </div>

                            <div className="relative z-10 mt-auto w-[55%]">
                                <button
                                    onClick={onNavigateToReports}
                                    className="bg-[#333] hover:bg-[#444] text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors border border-white/10 flex items-center gap-2 group/btn w-fit"
                                >
                                    View Analysis
                                    <ArrowRight className="w-3 h-3 text-gray-400 opacity-0 -translate-x-2 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all duration-300" />
                                </button>
                            </div>

                            {/* Visual: Clean Icon Orb */}
                            <div className="absolute top-1/2 -translate-y-1/2 right-6 w-20 h-20 rounded-2xl bg-[#0f0f0f] border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:border-white/30 transition-all duration-300">
                                <BarChart3 className="w-9 h-9 text-gray-400 group-hover:text-white transition-colors duration-300" />
                            </div>
                        </motion.div>

                        {/* Card 3: Resumes (Editing Theme) */}
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="bg-[#1a1a1a] rounded-2xl p-6 relative overflow-hidden group min-h-[200px] flex flex-col justify-between shadow-lg border border-white/5 hover:border-white/20 transition-all duration-300"
                        >
                            <div className="relative z-10 w-[55%]">
                                <h3 className="text-white font-bold text-lg mb-2">Resumes</h3>
                                <p className="text-gray-400 text-xs font-medium mb-6 leading-relaxed">
                                    Upload and analyze resumes to tailor every interview scenario to your specific experience level.
                                </p>
                            </div>

                            <div className="relative z-10 mt-auto w-[55%]">
                                <button
                                    onClick={onNavigateToResumes}
                                    className="bg-[#333] hover:bg-[#444] text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors border border-white/10 flex items-center gap-2 group/btn w-fit"
                                >
                                    Check Uploads
                                    <ArrowRight className="w-3 h-3 text-gray-400 opacity-0 -translate-x-2 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all duration-300" />
                                </button>
                            </div>

                            {/* Visual: Clean Icon Orb */}
                            <div className="absolute top-1/2 -translate-y-1/2 right-6 w-20 h-20 rounded-2xl bg-[#0f0f0f] border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:border-white/30 transition-all duration-300">
                                <ScanSearch className="w-9 h-9 text-gray-400 group-hover:text-white transition-colors duration-300" />
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* 3. Recent Activity (Black/Dark Card Style) */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-900">Recent interviews <span className="text-gray-400 text-sm font-normal ml-2">Personal</span></h3>
                        <button className="text-sm font-bold text-gray-400 hover:text-gray-900">View All</button>
                    </div>

                    {isLoadingRecent ? (
                        <div className="flex items-center justify-center py-12 text-gray-400">Loading sessions...</div>
                    ) : displaySessions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            <Mic className="w-10 h-10 mb-3 opacity-30" />
                            <p className="font-semibold">No sessions yet</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {displaySessions.map((session) => {
                                const title = `${session.jobContext.role} - ${session.jobContext.company}`;
                                const gradient = getGradient(session.jobContext.company || 'default');
                                const interviewerName = typeof session.persona === 'string' ? session.persona : (session.persona?.name || 'Sarah');
                                let interviewer = PERSONAS.find(p => p.name === interviewerName);
                                // Fallback/Default
                                if (!interviewer) {
                                    interviewer = { name: interviewerName, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop' };
                                }

                                return (
                                    <div key={session.id} className="group cursor-pointer relative isolate">
                                        {/* Stack Effect for "Spaces" (Follow-ups) */}
                                        {!!session.parentId && (
                                            <div className="absolute inset-0 bg-gray-800 rounded-2xl -z-10 translate-x-2 -translate-y-2 scale-[0.98] border border-white/5 transition-transform duration-300 group-hover:translate-x-3 group-hover:-translate-y-3" />
                                        )}

                                        {/* Image / Preview Area */}
                                        <div className="h-[200px] bg-[#1a1a1a] rounded-2xl relative overflow-hidden shadow-lg border border-white/5 group-hover:border-white/20 transition-all p-5 flex flex-col justify-between z-10">
                                            {/* Background Gradient/Image (Subtle) */}
                                            <div className={`absolute top-0 right-0 w-[80%] h-full bg-gradient-to-l ${gradient} opacity-10 blur-3xl rounded-full pointer-events-none translate-x-1/2`} />

                                            {/* Top Left: Company & Role */}
                                            <div className="relative z-10">
                                                <h4 className="font-bold text-white text-xl tracking-tight leading-none mb-1">{session.jobContext.company}</h4>
                                                <p className="text-xs font-semibold text-gray-400 mb-2 truncate max-w-[120px]">{session.jobContext.role}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] uppercase tracking-wider font-bold text-gray-400 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full">{session.jobContext.level}</span>
                                                    {!!session.parentId && (
                                                        <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400" title="Follow-up Space">
                                                            <Layers className="w-3 h-3" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Top Right: Time Created */}
                                            <div className="absolute top-5 right-5 z-10">
                                                <span className="text-[10px] font-bold text-gray-500">{getRelativeTime(session.createdAt).replace(' ago', '')}</span>
                                            </div>

                                            {/* Center: Floating Voice/Wave Visuals */}
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[60px] flex items-center justify-center pointer-events-none">
                                                {/* Waveform 1 */}
                                                <div className="absolute right-10 top-0 bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 flex items-center gap-1 shadow-xl">
                                                    <div className="w-0.5 h-3 bg-white/80 rounded-full" />
                                                    <div className="w-0.5 h-5 bg-white/80 rounded-full" />
                                                    <div className="w-0.5 h-2 bg-white/80 rounded-full" />
                                                    <div className="w-0.5 h-4 bg-white/80 rounded-full" />
                                                </div>

                                                {/* Play Button Bubble -> Voice Animation Container */}
                                                <div className="absolute left-8 -bottom-6 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl w-10 h-10 flex items-center justify-center gap-0.5 shadow-lg shadow-blue-900/40 animate-float-reverse">
                                                    <div className="w-1 h-3 bg-white rounded-full animate-pulse" />
                                                    <div className="w-1 h-5 bg-white rounded-full animate-pulse delay-75" />
                                                    <div className="w-1 h-3 bg-white rounded-full animate-pulse delay-150" />
                                                </div>
                                            </div>

                                            {/* Bottom: Interviewer Avatar */}
                                            <div className="relative z-10 flex justify-end items-end mt-auto">
                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Interviewer</p>
                                                        <p className="text-xs font-semibold text-white">{interviewer.name}</p>
                                                    </div>
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 p-0.5 ring-2 ring-black relative">
                                                        <img
                                                            src={interviewer.avatar}
                                                            alt="Interviewer"
                                                            className="w-full h-full rounded-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                                                        />
                                                        {/* Status Dot */}
                                                        <div className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#1a1a1a]" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                    }
                </div>

            </div>

            {/* --- WIZARD MODAL --- */}
            <AnimatePresence>
                {isWizardOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] relative"
                        >
                            {wizardMode === 'selection' ? (
                                // MODE SELECTION: New vs Continue
                                <div className="pt-8 px-8 pb-14 flex flex-col items-center justify-center text-center relative">
                                    {/* Close Button */}
                                    <button
                                        onClick={() => setIsWizardOpen(false)}
                                        className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>

                                    <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Start a Session</h2>
                                    <p className="text-gray-500 mb-8 max-w-sm text-sm">Choose how you want to prepare today.</p>

                                    <div className="grid grid-cols-2 gap-4 w-full px-2">
                                        {/* Start New Card */}
                                        <button
                                            onClick={() => setWizardMode('wizard')}
                                            className="group p-6 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 text-left relative overflow-hidden ring-1 ring-gray-100 hover:ring-blue-500/20"
                                        >
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-50 to-transparent rounded-bl-[3rem] opacity-50 group-hover:scale-110 transition-transform duration-500" />

                                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mb-4 text-white shadow-md shadow-blue-200 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                                                <Plus className="w-5 h-5" />
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">Start New</h3>
                                            <p className="text-xs text-gray-500 leading-relaxed group-hover:text-gray-600">Setup a custom interview with new parameters.</p>
                                        </button>

                                        {/* Continue Card */}
                                        <button
                                            onClick={() => {
                                                setIsWizardOpen(false);
                                                onNavigateToSpaces?.();
                                            }}
                                            className="group p-6 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 text-left relative overflow-hidden ring-1 ring-gray-100 hover:ring-gray-300"
                                        >
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-gray-100 to-transparent rounded-bl-[3rem] opacity-50 group-hover:scale-110 transition-transform duration-500" />

                                            <div className="w-10 h-10 bg-white border border-gray-100 rounded-lg flex items-center justify-center mb-4 text-gray-400 shadow-sm group-hover:border-gray-300 group-hover:text-gray-900 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">
                                                <Clock className="w-5 h-5" />
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-black transition-colors">Continue</h3>
                                            <p className="text-xs text-gray-500 leading-relaxed group-hover:text-gray-700">Resume from your existing spaces.</p>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // WIZARD COMPONENT
                                <SessionSetupWizard
                                    onCancel={() => setIsWizardOpen(false)}
                                    onSessionReady={handleWizardCompletion}
                                />
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default HomeTab;
