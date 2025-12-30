import React, { useState, useEffect } from 'react';
import { Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LANGUAGE_NAMES } from '../../data/personas';

// Coaching tips organized by interview phase
const COACHING_TIPS = {
    early: [
        { text: "Start with a confident, brief self-introduction. Keep it under 60 seconds.", color: "purple" },
        { text: "Listen carefully to the full question before formulating your answer.", color: "blue" },
        { text: "It's okay to pause and think. A thoughtful answer beats a rushed one.", color: "purple" },
        { text: "Speak clearly and at a steady pace — avoid rushing through your answers.", color: "blue" },
    ],
    mid: [
        { text: "Use the STAR method: Situation, Task, Action, Result.", color: "amber" },
        { text: "Give specific examples from your experience, not hypotheticals.", color: "blue" },
        { text: "If you don't know something, say so honestly — then explain how you'd learn.", color: "purple" },
        { text: "Connect your answers back to the role's requirements.", color: "amber" },
        { text: "Quantify your impact when possible: numbers, percentages, scale.", color: "blue" },
    ],
    closing: [
        { text: "Prepare to ask 1-2 thoughtful questions about the role or team.", color: "green" },
        { text: "Summarize your key strengths and enthusiasm for the position.", color: "green" },
        { text: "Thank the interviewer for their time and insights.", color: "blue" },
        { text: "End on a confident note — reiterate your interest.", color: "green" },
    ]
};

const getColorClasses = (color) => {
    const colors = {
        purple: { bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-800' },
        blue: { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-800' },
        amber: { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-800' },
        green: { bg: 'bg-green-50', border: 'border-green-100', text: 'text-green-800' },
    };
    return colors[color] || colors.blue;
};

const RightPanel = ({ persona, company, jobVariant, selectedLanguage, sessionDuration = 0 }) => {
    // Use selectedLanguage from props, fallback to 'us'
    const currentLang = selectedLanguage || 'us';

    // Determine interview phase based on duration
    const getPhase = (seconds) => {
        if (seconds < 180) return 'early';      // First 3 minutes
        if (seconds < 600) return 'mid';         // 3-10 minutes
        return 'closing';                         // After 10 minutes
    };

    const [currentTipIndex, setCurrentTipIndex] = useState(0);
    const phase = getPhase(sessionDuration);
    const tips = COACHING_TIPS[phase];

    // Rotate tips every 12 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTipIndex(prev => (prev + 1) % tips.length);
        }, 12000);
        return () => clearInterval(interval);
    }, [tips.length, phase]);

    // Reset tip index when phase changes
    useEffect(() => {
        setCurrentTipIndex(0);
    }, [phase]);

    const currentTip = tips[currentTipIndex];
    const colors = getColorClasses(currentTip.color);

    // Helper for flags
    const getFlagUrl = (code) => `https://flagcdn.com/w40/${code}.png`;

    return (
        <div className="w-80 h-full bg-white flex flex-col rounded-2xl shadow-sm border border-white/50 relative z-10 flex-shrink-0">

            {/* 1. Persona Card (Top) */}
            <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-gray-400 tracking-wider uppercase">Interviewer</h3>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">LIVE</span>
                </div>

                <div className="flex items-start gap-4">
                    <div className="relative">
                        <div className="w-14 h-14 rounded-xl overflow-hidden shadow-md ring-2 ring-gray-100">
                            <img
                                src={persona?.avatar || 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop'}
                                alt={persona?.name || "Interviewer"}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900">{persona?.name || "Michael"}</h4>
                        <p className="text-xs text-gray-500">{persona?.role || "Senior Reviewer"}</p>
                        <div className="mt-2 flex items-center gap-1.5 p-1.5 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="w-5 h-5 rounded overflow-hidden">
                                {company?.icon ? <company.icon /> : <div className="w-full h-full bg-blue-500" />}
                            </div>
                            <span className="text-xs font-semibold text-gray-700">{typeof company === 'string' ? company : company?.name || "Company"}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Interview Coach Tips (Middle) */}
            <div className="flex-1 p-6 overflow-y-auto">
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="flex items-center gap-2 text-sm font-bold text-gray-800">
                            <Lightbulb className="w-4 h-4 text-amber-500" />
                            Interview Coach
                        </h3>
                        <span className="text-[10px] font-medium text-gray-400 capitalize">{phase} phase</span>
                    </div>

                    {/* Animated Tip Card */}
                    <div className="relative min-h-[80px]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`${phase}-${currentTipIndex}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className={`p-4 rounded-xl border ${colors.bg} ${colors.border}`}
                            >
                                <p className={`text-xs font-medium leading-relaxed ${colors.text}`}>
                                    {currentTip.text}
                                </p>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Progress Dots */}
                    <div className="flex justify-center gap-1.5 mt-3">
                        {tips.map((_, idx) => (
                            <div
                                key={idx}
                                className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${idx === currentTipIndex ? 'bg-gray-600' : 'bg-gray-200'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Job Context */}
                <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-3">Target Role</h3>
                    <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50">
                        <h4 className="text-sm font-bold text-gray-900">{jobVariant?.type || "Software Engineer"}</h4>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {(jobVariant?.skills || ['System Design', 'Communication']).slice(0, 5).map(skill => (
                                <span key={skill} className="px-2 py-0.5 bg-white border border-gray-200 rounded-md text-[10px] text-gray-600 font-medium">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Language Display (Bottom) - Read Only */}
            <div className="p-6 border-t border-gray-200">
                <h3 className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-3">Speaking Language</h3>
                <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <img
                        src={getFlagUrl(currentLang)}
                        alt="flag"
                        className="w-6 h-6 rounded-full object-cover border border-gray-100"
                    />
                    <span className="text-sm font-bold text-gray-700">
                        {LANGUAGE_NAMES[currentLang] || currentLang}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default RightPanel;
