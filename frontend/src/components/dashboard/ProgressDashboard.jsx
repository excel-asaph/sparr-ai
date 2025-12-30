import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, AreaChart, Area
} from 'recharts';
import { TrendingUp, Award, Zap, Target, ArrowUpRight, Link as LinkIcon } from 'lucide-react';

// Skill Configuration for Chart Lines
const SKILL_CONFIG = [
    { key: 'score', label: 'Overall', color: '#3b82f6' },
    { key: 'technical', label: 'Technical', color: '#10b981' },
    { key: 'communication', label: 'Comm.', color: '#06b6d4' },
    { key: 'problemSolving', label: 'Solving', color: '#8b5cf6' },
    { key: 'confidence', label: 'Confid.', color: '#f59e0b' },
    { key: 'empathy', label: 'Empathy', color: '#ec4899' },
    { key: 'pacing', label: 'Pacing', color: '#ef4444' },
];

const ProgressDashboard = ({ history, onNavigateToResumes, onPointClick }) => {
    // Skill Toggle State (Overall always active by default)
    const [activeSkills, setActiveSkills] = useState(['score']);

    const toggleSkill = (skillKey) => {
        setActiveSkills(prev =>
            prev.includes(skillKey)
                ? prev.filter(k => k !== skillKey)
                : [...prev, skillKey]
        );
    };

    // 1. Prepare Data for Charts
    const trendData = history.map((session, index) => {
        const skills = session.skills || {}; // Safe fallback for missing skills
        return {
            index, // Store original index for navigation
            date: new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            fullDate: new Date(session.date).toLocaleDateString(),
            score: Math.round(session.overallScore || 0),
            technical: skills.technical || 0,
            communication: skills.communication || 0,
            problemSolving: skills.problemSolving || 0,
            confidence: skills.confidence || 0,
            empathy: skills.empathy || 0,
            pacing: skills.pacing || 0,
            sessionName: `Session ${index + 1}`
        };
    });

    // 2. Session References
    const firstSession = history[0]; // Oldest
    const latestSession = history[history.length - 1]; // Current
    const previousSession = history.length > 1 ? history[history.length - 2] : firstSession;
    const bestSession = history.reduce((best, s) => s.overallScore > best.overallScore ? s : best, history[0]);

    // 3. Comparison Mode State
    const [comparisonMode, setComparisonMode] = useState('first'); // 'first', 'last', 'best'

    // 4. Get Comparison Session Based on Mode
    const getComparisonSession = () => {
        switch (comparisonMode) {
            case 'last': return previousSession;
            case 'best': return bestSession;
            default: return firstSession;
        }
    };
    const comparisonSession = getComparisonSession();

    // 5. Get Comparison Label
    const getComparisonLabel = () => {
        const formatDate = (session) => new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        switch (comparisonMode) {
            case 'last':
                return `Previous (${formatDate(previousSession)}) vs. Current`;
            case 'best':
                return `Best (Score: ${Math.round(bestSession.overallScore)}) vs. Current`;
            default:
                return `First (${formatDate(firstSession)}) vs. Current`;
        }
    };

    // 6. Prepare Dynamic Radar Data - with safe fallbacks
    const compSkills = comparisonSession?.skills || {};
    const latestSkills = latestSession?.skills || {};
    const firstSkills = firstSession?.skills || {};

    const radarData = [
        { skill: 'Technical', comparison: compSkills.technical || 0, current: latestSkills.technical || 0, fullMark: 100 },
        { skill: 'Comm.', comparison: compSkills.communication || 0, current: latestSkills.communication || 0, fullMark: 100 },
        { skill: 'Solv.', comparison: compSkills.problemSolving || 0, current: latestSkills.problemSolving || 0, fullMark: 100 },
        { skill: 'Confid.', comparison: compSkills.confidence || 0, current: latestSkills.confidence || 0, fullMark: 100 },
        { skill: 'Empathy', comparison: compSkills.empathy || 0, current: latestSkills.empathy || 0, fullMark: 100 },
        { skill: 'Pacing', comparison: compSkills.pacing || 0, current: latestSkills.pacing || 0, fullMark: 100 },
    ];

    // 3. Calculate Deltas
    const scoreDelta = (latestSession?.overallScore || 0) - (firstSession?.overallScore || 0);

    // 4. Dynamic Best Skill & Focus Area - with safe fallback
    const skillEntries = Object.entries(latestSkills).filter(([key]) =>
        ['technical', 'communication', 'problemSolving', 'confidence', 'empathy', 'pacing'].includes(key)
    );

    // Provide defaults if no skills data
    const defaultEntry = ['technical', 0];
    const bestSkillEntry = skillEntries.length > 0 ? skillEntries.reduce((a, b) => b[1] > a[1] ? b : a) : defaultEntry;
    const worstSkillEntry = skillEntries.length > 0 ? skillEntries.reduce((a, b) => b[1] < a[1] ? b : a) : defaultEntry;

    const bestSkillName = bestSkillEntry[0];
    const bestSkillValue = bestSkillEntry[1];
    const worstSkillName = worstSkillEntry[0];
    const worstSkillValue = worstSkillEntry[1];

    // Calculate delta for best skill
    const bestSkillDelta = bestSkillValue - (firstSkills[bestSkillName] || 0);

    // 5. Personal Best & Previous Score
    const personalBest = Math.max(...history.map(s => s.overallScore));
    const previousScore = history.length > 1 ? Math.round(history[history.length - 2].overallScore) : null;
    const currentScore = Math.round(latestSession.overallScore);
    const isPersonalBest = currentScore >= Math.round(personalBest);

    // 6. Format Skill Name for Display
    const formatSkillName = (name) => {
        const names = {
            technical: 'Technical',
            communication: 'Communication',
            problemSolving: 'Problem Solving',
            confidence: 'Confidence',
            empathy: 'Empathy',
            pacing: 'Pacing'
        };
        return names[name] || name;
    };

    // 7. Space Context from latest session
    const spaceRole = latestSession.jobContext?.role || latestSession.role || 'Interview';
    const spaceCompany = latestSession.jobContext?.company || latestSession.company || '';

    return (
        <div className="w-full p-4 md:p-6 bg-gray-50/30">
            {/* Space Context Header */}
            <div className="mb-4 flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Progress for</span>
                <span className="text-xs font-bold text-gray-900">{spaceRole}</span>
                {spaceCompany && (
                    <>
                        <span className="text-gray-300">•</span>
                        <span className="text-xs text-gray-500">{spaceCompany}</span>
                    </>
                )}
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <MetricItem
                    label="Overall Growth"
                    value={`${scoreDelta >= 0 ? '+' : ''}${Math.round(scoreDelta)}%`}
                    icon={TrendingUp}
                    color="text-green-600"
                    bg="bg-green-50"
                    trend={`${history.length} sessions`}
                    delta={scoreDelta}
                    deltaType={scoreDelta >= 0 ? 'positive' : 'negative'}
                    sparklineData={history.map(s => ({ value: s.overallScore }))}
                />
                <MetricItem
                    label="Current Score"
                    value={currentScore}
                    icon={Award}
                    color="text-blue-700"
                    bg="bg-blue-50"
                    trend={isPersonalBest ? 'Best!' : previousScore ? `from ${previousScore}` : 'latest'}
                    delta={previousScore ? currentScore - previousScore : 0}
                    deltaType={isPersonalBest ? 'best' : (previousScore && currentScore >= previousScore) ? 'positive' : 'neutral'}
                    sparklineData={history.map(s => ({ value: s.overallScore }))}
                    isHero={true}
                />
                <MetricItem
                    label="Best Skill"
                    value={formatSkillName(bestSkillName)}
                    icon={Zap}
                    color="text-purple-600"
                    bg="bg-purple-50"
                    trend={`${bestSkillDelta >= 0 ? '+' : ''}${Math.round(bestSkillDelta)} pts`}
                    delta={bestSkillDelta}
                    deltaType={bestSkillDelta >= 0 ? 'positive' : 'negative'}
                />
                <MetricItem
                    label="Focus Area"
                    value={formatSkillName(worstSkillName)}
                    icon={Target}
                    color="text-orange-600"
                    bg="bg-orange-50"
                    trend={`${Math.round(worstSkillValue)}/100`}
                    deltaType="warning"
                />
            </div>

            {/* Main Content Split: Line Chart | Radar Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Evolution Chart (Left - Wider) */}
                <div className="lg:col-span-2 p-8 bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 border-l-2 border-blue-500 pl-3 uppercase tracking-wide">Skill Evolution</h3>
                            <div className="flex items-center gap-2 mt-2 ml-3.5">
                                <p className="text-xs text-gray-500 font-medium">Progress across {history.length} sessions</p>

                                {latestSession && latestSession.resumeContext && latestSession.resumeContext.storageUrl && (
                                    <>
                                        <span className="text-gray-300">•</span>
                                        <button
                                            onClick={() => onNavigateToResumes && onNavigateToResumes(latestSession.resumeContext)}
                                            className="flex items-center gap-1.5 px-2 py-0.5 rounded pl-1 hover:bg-gray-50 transition-all group"
                                        >
                                            <LinkIcon className="w-3 h-3 text-gray-400 group-hover:text-blue-600" />
                                            <span className="text-[10px] font-bold text-gray-400 group-hover:text-blue-600">Linked Resume</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Skill Toggle Pills */}
                    <div className="flex flex-wrap gap-2 mb-6 ml-3.5">
                        {SKILL_CONFIG.map(skill => (
                            <button
                                key={skill.key}
                                onClick={() => skill.key !== 'score' && toggleSkill(skill.key)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${activeSkills.includes(skill.key)
                                    ? 'bg-white shadow-sm border-gray-200'
                                    : 'bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100'
                                    } ${skill.key === 'score' ? 'cursor-default' : 'cursor-pointer'}`}
                            >
                                <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: activeSkills.includes(skill.key) ? skill.color : '#d1d5db' }}
                                />
                                <span style={{ color: activeSkills.includes(skill.key) ? skill.color : undefined }}>
                                    {skill.label}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={trendData}
                                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                onClick={(data) => {
                                    if (data && data.activePayload && data.activePayload[0]) {
                                        onPointClick && onPointClick(data.activePayload[0].payload.index);
                                    }
                                }}
                            >
                                <defs>
                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="sessionName"
                                    tick={{ fontSize: 11, fill: '#64748b' }}
                                    axisLine={false}
                                    tickLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    domain={[40, 100]}
                                    hide={false}
                                    tick={{ fontSize: 11, fill: '#64748b' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-white text-gray-900 text-xs p-3 rounded-xl shadow-lg border border-gray-200">
                                                    <p className="font-bold mb-2 text-gray-900">{label}</p>
                                                    {payload.map((entry, idx) => (
                                                        <p key={idx} className="flex items-center gap-2 text-gray-700">
                                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                                            {SKILL_CONFIG.find(s => s.key === entry.dataKey)?.label || entry.dataKey}: <span className="font-semibold" style={{ color: entry.color }}>{entry.value}</span>
                                                        </p>
                                                    ))}
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                {/* Overall Score - Always visible as Area */}
                                {activeSkills.includes('score') && (
                                    <Area
                                        type="monotone"
                                        dataKey="score"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorScore)"
                                        activeDot={{ r: 6, strokeWidth: 0, fill: '#2563EB', cursor: 'pointer' }}
                                    />
                                )}
                                {/* Dynamic Skill Lines */}
                                {SKILL_CONFIG.filter(s => s.key !== 'score' && activeSkills.includes(s.key)).map(skill => (
                                    <Line
                                        key={skill.key}
                                        type="monotone"
                                        dataKey={skill.key}
                                        stroke={skill.color}
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        dot={false}
                                        activeDot={{ r: 4, strokeWidth: 0, fill: skill.color }}
                                    />
                                ))}
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Radar Comparison (Right - Narrower) */}
                <div className="lg:col-span-1 p-8 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col">
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-gray-900 border-l-2 border-purple-500 pl-3 uppercase tracking-wide">Growth Map</h3>
                        </div>

                        {/* Segmented Control */}
                        <div className="flex bg-gray-100 p-1 rounded-lg ml-3.5">
                            <button
                                onClick={() => setComparisonMode('first')}
                                disabled={history.length < 2}
                                className={`flex-1 px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${comparisonMode === 'first'
                                    ? 'bg-white shadow text-gray-900'
                                    : 'text-gray-500 hover:text-gray-700'
                                    } ${history.length < 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                First
                            </button>
                            <button
                                onClick={() => setComparisonMode('last')}
                                disabled={history.length < 2}
                                className={`flex-1 px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${comparisonMode === 'last'
                                    ? 'bg-white shadow text-gray-900'
                                    : 'text-gray-500 hover:text-gray-700'
                                    } ${history.length < 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                Last
                            </button>
                            <button
                                onClick={() => setComparisonMode('best')}
                                disabled={history.length < 2}
                                className={`flex-1 px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${comparisonMode === 'best'
                                    ? 'bg-white shadow text-gray-900'
                                    : 'text-gray-500 hover:text-gray-700'
                                    } ${history.length < 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                Best
                            </button>
                        </div>

                        {/* Dynamic Subtitle */}
                        <p className="text-[10px] text-gray-400 font-medium mt-2 ml-3.5">{getComparisonLabel()}</p>
                    </div>

                    <div className="flex-1 min-h-[280px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart outerRadius="70%" data={radarData}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="skill" tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar
                                    name={comparisonMode === 'first' ? 'First' : comparisonMode === 'last' ? 'Previous' : 'Best'}
                                    dataKey="comparison"
                                    stroke={comparisonMode === 'best' ? '#f59e0b' : '#94a3b8'}
                                    strokeWidth={2}
                                    fill={comparisonMode === 'best' ? '#f59e0b' : '#94a3b8'}
                                    fillOpacity={0.2}
                                />
                                <Radar
                                    name="Current"
                                    dataKey="current"
                                    stroke="#8b5cf6"
                                    strokeWidth={3}
                                    fill="#8b5cf6"
                                    fillOpacity={0.4}
                                />
                                <Legend
                                    iconType="circle"
                                    wrapperStyle={{ fontSize: '10px', paddingTop: '15px' }}
                                    formatter={(value) => <span className="text-gray-600 font-medium ml-1">{value}</span>}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="text-center mt-6">
                <p className="text-xs text-gray-400 font-medium">Progress analytics based on {history.length} recorded sessions</p>
            </div>
        </div>
    );
};

// Enhanced Metric Card with Sparkline and Colored Delta
const MetricItem = ({ label, value, icon: Icon, color, bg, trend, isHero, delta, deltaType, sparklineData }) => {
    // Determine if delta is positive, negative, or neutral
    const getDeltaStyle = () => {
        if (deltaType === 'positive' || (typeof delta === 'number' && delta > 0)) {
            return 'bg-green-100 text-green-700 border-green-200';
        } else if (deltaType === 'negative' || (typeof delta === 'number' && delta < 0)) {
            return 'bg-red-100 text-red-700 border-red-200';
        } else if (deltaType === 'warning') {
            return 'bg-orange-100 text-orange-700 border-orange-200';
        } else if (deltaType === 'best') {
            return 'bg-amber-100 text-amber-700 border-amber-200';
        }
        return 'bg-gray-100 text-gray-600 border-gray-200';
    };

    const getDeltaIcon = () => {
        if (deltaType === 'positive' || (typeof delta === 'number' && delta > 0)) {
            return <ArrowUpRight className="w-3 h-3" />;
        } else if (deltaType === 'negative' || (typeof delta === 'number' && delta < 0)) {
            return <ArrowUpRight className="w-3 h-3 rotate-90" />;
        } else if (deltaType === 'best') {
            return <span>🏆</span>;
        }
        return null;
    };

    return (
        <div className={`p-5 rounded-2xl border shadow-sm flex flex-col transition-all hover:shadow-md ${isHero
            ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 ring-1 ring-blue-100'
            : 'bg-white border-gray-200'
            }`}>
            {/* Top Row: Label and Sparkline/Icon */}
            <div className="flex items-center justify-between w-full mb-3">
                <p className={`text-[10px] font-bold uppercase tracking-wider ${isHero ? 'text-blue-600/80' : 'text-gray-400'}`}>{label}</p>

                {/* Sparkline or Icon on Right */}
                {sparklineData && sparklineData.length > 1 ? (
                    <div className="w-16 h-8">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={sparklineData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id={`sparkline-${label.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={isHero ? '#3b82f6' : '#10b981'} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={isHero ? '#3b82f6' : '#10b981'} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke={isHero ? '#3b82f6' : '#10b981'}
                                    strokeWidth={1.5}
                                    fill={`url(#sparkline-${label.replace(/\s/g, '')})`}
                                    dot={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className={`p-1.5 rounded-lg ${bg} ${color}`}>
                        <Icon className="w-4 h-4" />
                    </div>
                )}
            </div>

            {/* Bottom Row: Value and Delta Badge */}
            <div className="flex items-end justify-between">
                <h4 className={`text-2xl font-bold tracking-tight ${isHero ? 'text-blue-900' : 'text-gray-900'}`}>{value}</h4>

                {trend && (
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full border flex items-center gap-1 ${getDeltaStyle()}`}>
                        {getDeltaIcon()}
                        {trend}
                    </span>
                )}
            </div>
        </div>
    );
};

const LegendItem = ({ color, label }) => (
    <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm" style={{ backgroundColor: color }} />
        <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">{label}</span>
    </div>
);

export default ProgressDashboard;
