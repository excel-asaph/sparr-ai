import React from 'react';
import { motion } from 'framer-motion';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { Play, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const ReportDetail = ({ session }) => {
    // Transform skills data for radar chart (Standard 6-Axis)
    const skills = session.skills || {};
    const radarData = [
        { skill: 'Technical', value: skills.technical || 0, fullMark: 100 },
        { skill: 'Communication', value: skills.communication || 0, fullMark: 100 },
        { skill: 'Problem Solving', value: skills.problemSolving || 0, fullMark: 100 },
        { skill: 'Confidence', value: skills.confidence || 0, fullMark: 100 },
        { skill: 'Empathy', value: skills.empathy || 0, fullMark: 100 },
        { skill: 'Pacing', value: skills.pacing || 0, fullMark: 100 },
    ];

    const getScoreColor = (score) => {
        if (score >= 80) return { color: 'text-green-600', fill: '#16a34a', bg: 'bg-green-100', textLight: 'text-green-600' };
        if (score >= 60) return { color: 'text-yellow-600', fill: '#ca8a04', bg: 'bg-yellow-100', textLight: 'text-yellow-600' };
        return { color: 'text-red-600', fill: '#dc2626', bg: 'bg-red-100', textLight: 'text-red-600' };
    };

    const scoreColors = getScoreColor(session.overallScore);

    const getHighlightIcon = (type) => {
        switch (type) {
            case 'success':
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'warning':
                return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
            case 'critical':
                return <XCircle className="w-5 h-5 text-red-500" />;
            default:
                return null;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col"
        >
            {/* Header */}
            {/* Header */}
            <div className="p-8 border-b border-gray-100 bg-gray-50/10">
                <div className="flex flex-col gap-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{session.role}</h2>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{session.company}</span>
                                <span className="text-gray-300">•</span>
                                <span className="text-sm text-gray-400">
                                    {session.createdAt || session.date ? new Date(session.createdAt || session.date).toLocaleDateString() : 'Date Unknown'}
                                </span>
                            </div>
                        </div>

                        {/* Agent Badge */}
                        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm">
                            <img
                                src={session.agent.avatar}
                                alt={session.agent.name}
                                className="w-10 h-10 rounded-full object-cover"
                            />
                            <div className="text-right">
                                <p className="text-sm font-bold text-gray-800">{session.agent.name}</p>
                                <p className="text-xs font-medium text-gray-500">{session.agent.persona}</p>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Context Area (Collapsible or Grid) */}
                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">

                            {/* Job Context */}
                            <div>
                                <h4 className="font-bold text-gray-700 mb-2 uppercase text-xs tracking-wider flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> Job Context
                                </h4>
                                <div className="space-y-1.5 text-gray-600">
                                    <p><span className="font-medium text-gray-900">Level:</span> {session.jobContext?.level}</p>
                                    <p><span className="font-medium text-gray-900">Role:</span> {session.jobContext?.role}</p>
                                    <p><span className="font-medium text-gray-900">Company:</span> {session.jobContext?.company}</p>
                                    {session.jobContext?.variant?.type && (
                                        <p><span className="font-medium text-gray-900">Type:</span> {session.jobContext.variant.type}</p>
                                    )}
                                    {session.jobContext?.description && (
                                        <div className="mt-2 text-xs italic opacity-80 border-l-2 border-gray-300 pl-2">
                                            "{session.jobContext.description.slice(0, 150)}..."
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Resume & Persona Details */}
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-bold text-gray-700 mb-2 uppercase text-xs tracking-wider flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-purple-500"></span> Resume
                                    </h4>
                                    <p className="text-gray-600 truncate">
                                        <span className="font-medium text-gray-900">File:</span> {
                                            session.resumeContext?.fileName ||
                                            (session.resumeContext?.storageUrl
                                                ? decodeURIComponent(session.resumeContext.storageUrl.split('/').pop().split('?')[0])
                                                : 'No resume attached')
                                        }
                                    </p>
                                </div>

                                {/* Persona Traits (Excluding IDs) */}
                                {session.persona && (
                                    <div>
                                        <h4 className="font-bold text-gray-700 mb-2 uppercase text-xs tracking-wider flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-pink-500"></span> Interviewer
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {/* Safely render traits if they exist in some form */}
                                            {session.persona.traits && Array.isArray(session.persona.traits) && session.persona.traits.map(t => (
                                                <span key={t} className="px-2 py-0.5 bg-white border border-gray-200 rounded text-xs text-gray-600">
                                                    {t}
                                                </span>
                                            ))}
                                            <span className="px-2 py-0.5 bg-white border border-gray-200 rounded text-xs text-gray-600">
                                                {session.persona.voiceId ? 'Voice Active' : 'Text Only'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content - BENTO GRID */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent bg-gray-50/30">

                {/* Top Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Bento Card 1: Overall Score */}
                    <div className="lg:col-span-1 bg-white rounded-3xl p-8 border border-gray-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden group hover:shadow-md transition-shadow duration-300">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-bl-full -mr-8 -mt-8 z-0" />

                        <div className="relative z-10 w-48 h-48">
                            {/* Circular Progress */}
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="96"
                                    cy="96"
                                    r="84"
                                    stroke="#f3f4f6"
                                    strokeWidth="12"
                                    fill="none"
                                />
                                <circle
                                    cx="96"
                                    cy="96"
                                    r="84"
                                    stroke={scoreColors.fill}
                                    strokeWidth="12"
                                    fill="none"
                                    strokeDasharray="527" // 2 * PI * 84
                                    strokeDashoffset={527 - (527 * session.overallScore) / 100}
                                    strokeLinecap="round"
                                    className="drop-shadow-sm transition-all duration-1000 ease-out"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={`text-6xl font-black tracking-tighter ${scoreColors.color}`}>
                                    {session.overallScore}
                                </span>
                                <span className="text-xs font-bold text-gray-400 uppercase mt-1 tracking-widest">Score</span>
                            </div>
                        </div>
                        <div className="mt-6 text-center z-10">
                            <span className={`px-4 py-1.5 rounded-full text-sm font-bold bg-white border border-gray-100 shadow-sm text-gray-700`}>
                                {session.overallScore >= 80 ? 'Excellent Result' : session.overallScore >= 60 ? 'Good Effort' : 'Needs Focus'}
                            </span>
                        </div>
                    </div>

                    {/* Bento Card 2: Radar Chart */}
                    <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Skill Analysis</h3>
                            <button className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors">Details</button>
                        </div>
                        <ResponsiveContainer width="100%" height={260}>
                            <RadarChart data={radarData}>
                                <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                                <PolarAngleAxis
                                    dataKey="skill"
                                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}
                                />
                                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar
                                    name="Skills"
                                    dataKey="value"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    fill="#3b82f6"
                                    fillOpacity={0.1}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Bottom Row: Highlight Reel */}
                <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                            <Play className="w-5 h-5 fill-current" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Session Highlights</h3>
                            <p className="text-sm text-gray-500">Key moments identified by AI</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(session.highlights || []).map((highlight, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="group flex items-start gap-4 p-5 rounded-2xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-200 cursor-pointer"
                            >
                                <div className="flex-shrink-0 mt-0.5">
                                    {getHighlightIcon(highlight.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-mono font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded group-hover:bg-white transition-colors">
                                            {highlight.timestamp}
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-700 leading-relaxed">{highlight.text}</p>
                                </div>
                                {highlight.audioUrl && (
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="w-8 h-8 rounded-full bg-white border border-blue-100 text-blue-500 flex items-center justify-center shadow-sm">
                                            <Play className="w-3 h-3 fill-current" />
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ReportDetail;
