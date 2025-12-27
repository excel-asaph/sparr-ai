import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Globe, Sparkles, User } from 'lucide-react';

const RightPanel = ({ persona, languages, company, jobVariant }) => {
    const [isLangOpen, setIsLangOpen] = useState(false);
    const [selectedLang, setSelectedLang] = useState('us');

    // Helper for flags (from LandingPage logic - ideally shared, but inline for now)
    const getFlagUrl = (code) => `https://flagcdn.com/w40/${code}.png`;

    const LANGUAGE_NAMES = {
        'us': 'English', 'es': 'Spanish', 'ru': 'Russian', 'ro': 'Romanian',
        'sk': 'Slovak', 'hr': 'Croatian', 'it': 'Italian', 'de': 'German',
        'pl': 'Polish', 'dk': 'Danish'
    };

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
                                {/* Note: Icon rendering depends on if 'company' is object or string. Handling simple first */}
                            </div>
                            <span className="text-xs font-semibold text-gray-700">{typeof company === 'string' ? company : company?.name || "Company"}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Live Context / Tips (Middle) */}
            <div className="flex-1 p-6 overflow-y-auto">
                <div className="mb-6">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        Live Analysis
                    </h3>
                    <div className="space-y-3">
                        <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                            <p className="text-xs text-purple-800 font-medium leading-relaxed">
                                Wait for the interviewer to finish the question before answering. Take a deep breath.
                            </p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <p className="text-xs text-blue-800 font-medium leading-relaxed">
                                Don't forget to mention the **STAR method** for this behavioral question.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Job Context */}
                <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-3">Target Role</h3>
                    <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50">
                        {/* Display specific Job Type (e.g. "Senior React Engineer") */}
                        <h4 className="text-sm font-bold text-gray-900">{jobVariant?.type || "Software Engineer"}</h4>

                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {/* Display real skills from context, or fallback */}
                            {(jobVariant?.skills || ['System Design', 'Communication']).slice(0, 5).map(skill => (
                                <span key={skill} className="px-2 py-0.5 bg-white border border-gray-200 rounded-md text-[10px] text-gray-600 font-medium">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Language Selector (Bottom) */}
            <div className="p-6 border-t border-gray-200">
                <h3 className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-3">Speaking Language</h3>

                <div className="relative">
                    <button
                        onClick={() => setIsLangOpen(!isLangOpen)}
                        className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-sm transition-all text-left group"
                    >
                        <div className="flex items-center gap-3">
                            <img
                                src={getFlagUrl(selectedLang)}
                                alt="flag"
                                className="w-6 h-6 rounded-full object-cover border border-gray-100"
                            />
                            <span className="text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors">
                                {LANGUAGE_NAMES[selectedLang] || selectedLang}
                            </span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {isLangOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50 max-h-48 overflow-y-auto"
                            >
                                {(languages || ['us', 'es', 'de']).map((code) => (
                                    <button
                                        key={code}
                                        onClick={() => {
                                            setSelectedLang(code);
                                            setIsLangOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
                                    >
                                        <img src={getFlagUrl(code)} alt={code} className="w-5 h-5 rounded-full object-cover" />
                                        <span className={`text-sm ${selectedLang === code ? 'font-bold text-blue-600' : 'text-gray-700'}`}>
                                            {LANGUAGE_NAMES[code] || code}
                                        </span>
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default RightPanel;
