import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, BarChart3, SlidersHorizontal, LogOut, Camera, Check, Clock, Target, TrendingUp, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PERSONAS } from '../../data/personas';

const ProfileTab = ({ interviews = [], onSignOut }) => {
    const { currentUser } = useAuth();
    const [activeSection, setActiveSection] = useState('overview');

    // Extract user info
    const displayName = currentUser?.displayName || 'User';
    const email = currentUser?.email || 'user@email.com';
    const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const photoURL = currentUser?.photoURL;

    // Calculate real stats from interviews
    const totalInterviews = interviews.length;
    const completedInterviews = interviews.filter(i => i.reportStatus === 'ready').length;
    const avgScore = completedInterviews > 0
        ? Math.round(interviews.filter(i => i.report?.overallScore).reduce((sum, i) => sum + i.report.overallScore, 0) / completedInterviews)
        : 0;

    // Calculate streak (consecutive days with interviews)
    const calculateStreak = () => {
        if (interviews.length === 0) return 0;
        const sortedDates = [...new Set(
            interviews.map(i => new Date(i.createdAt).toDateString())
        )].sort((a, b) => new Date(b) - new Date(a));

        let streak = 0;
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        for (const dateStr of sortedDates) {
            const date = new Date(dateStr);
            date.setHours(0, 0, 0, 0);
            const diffDays = Math.floor((currentDate - date) / (1000 * 60 * 60 * 24));

            if (diffDays <= 1) {
                streak++;
                currentDate = date;
            } else {
                break;
            }
        }
        return streak;
    };
    const streak = calculateStreak();

    // Preferences state (stored in localStorage)
    const [preferences, setPreferences] = useState(() => {
        const saved = localStorage.getItem('sparr-preferences');
        return saved ? JSON.parse(saved) : {
            defaultDuration: '5',
            defaultPersona: 'Ellen',
            defaultLanguage: 'us'
        };
    });

    const savePreference = (key, value) => {
        const newPrefs = { ...preferences, [key]: value };
        setPreferences(newPrefs);
        localStorage.setItem('sparr-preferences', JSON.stringify(newPrefs));
    };

    const sections = [
        { id: 'overview', icon: User, label: 'Overview' },
        { id: 'stats', icon: BarChart3, label: 'Stats' },
        { id: 'preferences', icon: SlidersHorizontal, label: 'Preferences' },
    ];

    return (
        <div className="w-full h-full overflow-y-auto bg-[#f8fafc]">
            <div className="w-full max-w-6xl px-8 py-8">
                {/* Header - Matches other tabs */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage your account and preferences</p>
                </div>

                {/* Section Tabs - Horizontal like SpacesTab */}
                <div className="flex items-center gap-1 mb-8 bg-gray-100 p-1 rounded-xl w-fit">
                    {sections.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeSection === section.id
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <section.icon className="w-4 h-4" />
                            {section.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <AnimatePresence mode="wait">
                    {activeSection === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            {/* Profile Card - Matching HomeTab Blue Design */}
                            <div className="bg-blue-500 rounded-3xl p-8 text-white relative overflow-hidden min-h-[180px]">
                                {/* Gradient Blobs */}
                                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gradient-to-bl from-blue-400/30 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
                                <div className="absolute bottom-0 right-20 w-40 h-40 bg-indigo-500/30 rounded-full blur-2xl pointer-events-none" />

                                {/* Wave SVG Decoration */}
                                <div className="absolute right-0 bottom-0 top-0 w-1/2 pointer-events-none overflow-hidden flex items-end justify-end opacity-40">
                                    <svg width="400" height="200" viewBox="0 0 600 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform translate-x-8 translate-y-8 scale-90 origin-bottom-right">
                                        <path d="M50 150C100 150 120 60 180 60C240 60 270 240 330 240C390 240 420 120 480 120C540 120 570 180 630 180" stroke="white" strokeWidth="6" strokeLinecap="round" className="animate-pulse" style={{ animationDuration: '4s' }} />
                                        <path d="M50 180C100 180 120 90 180 90C240 90 270 270 330 270C390 270 420 150 480 150C540 150 570 210 630 210" stroke="white" strokeWidth="3" strokeOpacity="0.5" />
                                        <path d="M50 210C100 210 120 120 180 120C240 120 270 300 330 300C390 300 420 180 480 180C540 180 570 240 630 240" stroke="white" strokeWidth="2" strokeOpacity="0.3" />
                                        <circle cx="480" cy="60" r="25" stroke="white" strokeWidth="3" strokeOpacity="0.2" />
                                        <circle cx="480" cy="60" r="40" stroke="white" strokeWidth="1" strokeOpacity="0.1" />
                                    </svg>
                                </div>

                                {/* Profile Content */}
                                <div className="relative z-10 flex items-center gap-6">
                                    {photoURL ? (
                                        <img src={photoURL} alt={displayName} className="w-20 h-20 rounded-full border-4 border-white/30 shadow-lg" />
                                    ) : (
                                        <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/30 flex items-center justify-center text-2xl font-bold shadow-lg">
                                            {initials}
                                        </div>
                                    )}
                                    <div>
                                        <h2 className="text-2xl font-bold tracking-tight">{displayName}</h2>
                                        <p className="text-blue-100 text-sm mt-1 opacity-90">{email}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Stats Grid */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                    <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                                        <Target className="w-3.5 h-3.5" />
                                        INTERVIEWS
                                    </div>
                                    <p className="text-3xl font-bold text-gray-900">{totalInterviews}</p>
                                </div>
                                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                    <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                                        <TrendingUp className="w-3.5 h-3.5" />
                                        AVG SCORE
                                    </div>
                                    <p className="text-3xl font-bold text-gray-900">{avgScore || '—'}</p>
                                </div>
                                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                    <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                                        <Zap className="w-3.5 h-3.5" />
                                        STREAK
                                    </div>
                                    <p className="text-3xl font-bold text-gray-900">{streak} day{streak !== 1 ? 's' : ''}</p>
                                </div>
                            </div>

                            {/* Sign Out Button */}
                            <button
                                onClick={onSignOut}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all border border-red-100"
                            >
                                <LogOut className="w-4 h-4" />
                                Sign Out
                            </button>
                        </motion.div>
                    )}

                    {activeSection === 'stats' && (
                        <motion.div
                            key="stats"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            {/* Stats Grid */}
                            <div className="grid grid-cols-4 gap-4">
                                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                    <div className="text-4xl font-black text-gray-900">{totalInterviews}</div>
                                    <div className="text-sm text-gray-500 mt-1">Total Interviews</div>
                                </div>
                                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                    <div className="text-4xl font-black text-gray-900">{completedInterviews}</div>
                                    <div className="text-sm text-gray-500 mt-1">Completed</div>
                                </div>
                                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                    <div className="text-4xl font-black text-gray-900">{avgScore || '—'}</div>
                                    <div className="text-sm text-gray-500 mt-1">Avg Score</div>
                                </div>
                                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                    <div className="text-4xl font-black text-gray-900">{streak}</div>
                                    <div className="text-sm text-gray-500 mt-1">Day Streak</div>
                                </div>
                            </div>

                            {/* Recent Performance */}
                            {completedInterviews > 0 && (
                                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                    <h3 className="text-sm font-bold text-gray-700 mb-4">Recent Scores</h3>
                                    <div className="space-y-3">
                                        {interviews
                                            .filter(i => i.report?.overallScore)
                                            .slice(0, 5)
                                            .map((interview, idx) => (
                                                <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                                    <div className="text-sm text-gray-600">
                                                        {interview.jobContext?.role || 'Interview'} @ {interview.jobContext?.company || 'Company'}
                                                    </div>
                                                    <div className={`text-sm font-bold ${interview.report.overallScore >= 70 ? 'text-green-600' :
                                                        interview.report.overallScore >= 50 ? 'text-yellow-600' : 'text-red-500'
                                                        }`}>
                                                        {interview.report.overallScore}
                                                    </div>
                                                </div>
                                            ))
                                        }
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeSection === 'preferences' && (
                        <motion.div
                            key="preferences"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            {/* Interview Duration - Fixed at 5 mins */}
                            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900">Interview Duration</h3>
                                        <p className="text-xs text-gray-500 mt-0.5">All interviews are focused 5-minute sessions</p>
                                    </div>
                                    <div className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold">
                                        5 min
                                    </div>
                                </div>
                            </div>

                            {/* Most Used Interviewer - Calculated from history */}
                            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900">Most Used Interviewer</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">Your go-to AI interviewer based on session history</p>
                                </div>

                                {(() => {
                                    // Calculate most used persona from interviews
                                    const personaCounts = interviews.reduce((acc, interview) => {
                                        const personaName = typeof interview.persona === 'string'
                                            ? interview.persona
                                            : interview.persona?.name;
                                        if (personaName) {
                                            acc[personaName] = (acc[personaName] || 0) + 1;
                                        }
                                        return acc;
                                    }, {});

                                    const sortedPersonas = Object.entries(personaCounts)
                                        .sort(([, a], [, b]) => b - a);

                                    if (sortedPersonas.length === 0) {
                                        return (
                                            <div className="bg-gray-50 rounded-xl p-4 text-center text-gray-500 text-sm">
                                                Complete your first interview to see your most used interviewer
                                            </div>
                                        );
                                    }

                                    // Get top 3 most used
                                    const topPersonas = sortedPersonas.slice(0, 3);

                                    return (
                                        <div className="space-y-3">
                                            {topPersonas.map(([personaName, count], idx) => {
                                                const persona = PERSONAS.find(p => p.name === personaName);
                                                if (!persona) return null;

                                                return (
                                                    <div
                                                        key={personaName}
                                                        className={`flex items-center gap-4 p-4 rounded-xl transition-all ${idx === 0
                                                            ? 'bg-gray-50 border border-gray-200'
                                                            : 'bg-gray-50 border border-gray-100'
                                                            }`}
                                                    >
                                                        {/* Rank Badge */}
                                                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-gray-900 text-white">
                                                            {idx + 1}
                                                        </div>

                                                        {/* Avatar */}
                                                        {persona.avatar ? (
                                                            <img
                                                                src={persona.avatar}
                                                                alt={persona.name}
                                                                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
                                                            />
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-lg font-bold shrink-0">
                                                                {persona.name[0]}
                                                            </div>
                                                        )}

                                                        {/* Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-sm font-bold text-gray-900">{persona.name}</div>
                                                            <div className="text-xs text-gray-500 truncate">{persona.role}</div>
                                                        </div>

                                                        {/* Count Badge */}
                                                        <div className="text-xs font-medium px-3 py-1.5 rounded-lg shrink-0 bg-gray-900 text-white">
                                                            {count} session{count !== 1 ? 's' : ''}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ProfileTab;
