import React from 'react';
import { motion } from 'framer-motion';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, AreaChart, Area
} from 'recharts';
import { TrendingUp, Award, Zap, Target, ArrowUpRight } from 'lucide-react';

const ProgressDashboard = ({ history }) => {
    // 1. Prepare Data for Charts
    const trendData = history.map((session, index) => ({
        date: new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        fullDate: new Date(session.date).toLocaleDateString(),
        score: Math.round(session.overallScore),
        technical: session.skills.technical,
        communication: session.skills.communication,
        confidence: session.skills.confidence,
        pacing: session.skills.pacing,
        sessionName: `Session ${index + 1}`
    }));

    // 2. Prepare Radar Comparison (First vs Latest)
    const firstSession = history[0]; // Oldest
    const latestSession = history[history.length - 1]; // Current

    const radarData = [
        { skill: 'Technical', first: firstSession.skills.technical, current: latestSession.skills.technical, fullMark: 100 },
        { skill: 'Comm.', first: firstSession.skills.communication, current: latestSession.skills.communication, fullMark: 100 },
        { skill: 'Solv.', first: firstSession.skills.problemSolving, current: latestSession.skills.problemSolving, fullMark: 100 },
        { skill: 'Confid.', first: firstSession.skills.confidence, current: latestSession.skills.confidence, fullMark: 100 },
        { skill: 'Empathy', first: firstSession.skills.empathy, current: latestSession.skills.empathy, fullMark: 100 },
        { skill: 'Pacing', first: firstSession.skills.pacing, current: latestSession.skills.pacing, fullMark: 100 },
    ];

    // 3. Calculate Deltas
    const scoreDelta = latestSession.overallScore - firstSession.overallScore;
    const techDelta = latestSession.skills.technical - firstSession.skills.technical;

    return (
        <div className="h-full flex flex-col space-y-6 overflow-y-auto p-4 md:p-8 bg-gray-50/50 scrollbar-thin scrollbar-thumb-gray-200">

            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard
                    label="Overall Growth"
                    value={`+${Math.round(scoreDelta)}%`}
                    icon={TrendingUp}
                    color="text-green-600"
                    bg="bg-green-50"
                    trend="since start"
                />
                <MetricCard
                    label="Current Score"
                    value={Math.round(latestSession.overallScore)}
                    icon={Award}
                    color="text-blue-600"
                    bg="bg-blue-50"
                    trend="top 15%"
                />
                <MetricCard
                    label="Best Skill"
                    value="Technical"
                    icon={Zap}
                    color="text-purple-600"
                    bg="bg-purple-50"
                    trend="+12 pts"
                />
                <MetricCard
                    label="Focus Area"
                    value="Pacing"
                    icon={Target}
                    color="text-orange-600"
                    bg="bg-orange-50"
                    trend="needs work"
                />
            </div>

            {/* Main Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* 1. Skill Evolution (Line Chart) */}
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Skill Evolution</h3>
                            <p className="text-sm text-gray-500">Track your progress across {history.length} sessions</p>
                        </div>
                        <div className="flex gap-2">
                            <LegendItem color="#3b82f6" label="Overall" />
                            <LegendItem color="#10b981" label="Technical" />
                        </div>
                    </div>

                    <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis
                                    dataKey="sessionName"
                                    tick={{ fontSize: 12, fill: '#9ca3af' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    domain={[40, 100]}
                                    hide={false}
                                    tick={{ fontSize: 12, fill: '#9ca3af' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="score"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorScore)"
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="technical"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    dot={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Growth Radar (Comparison) */}
                <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-gray-900">Growth Map</h3>
                        <p className="text-sm text-gray-500">First vs. Current Session</p>
                    </div>

                    <div className="h-[280px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart outerRadius={90} data={radarData}>
                                <PolarGrid stroke="#f1f5f9" />
                                <PolarAngleAxis dataKey="skill" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar
                                    name="First Session"
                                    dataKey="first"
                                    stroke="#94a3b8"
                                    strokeWidth={2}
                                    fill="#94a3b8"
                                    fillOpacity={0.3}
                                />
                                <Radar
                                    name="Current"
                                    dataKey="current"
                                    stroke="#8b5cf6"
                                    strokeWidth={3}
                                    fill="#8b5cf6"
                                    fillOpacity={0.5}
                                />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', marginTop: '10px' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper Components
const MetricCard = ({ label, value, icon: Icon, color, bg, trend }) => (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-start justify-between mb-2">
            <div className={`p-2.5 rounded-xl ${bg} ${color}`}>
                <Icon className="w-5 h-5" />
            </div>
            {trend && (
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full bg-gray-50 text-gray-500 flex items-center gap-1`}>
                    {trend.includes('+') && <ArrowUpRight className="w-3 h-3" />}
                    {trend}
                </span>
            )}
        </div>
        <div className="mt-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
            <h4 className="text-2xl font-black text-gray-900 tracking-tight mt-0.5">{value}</h4>
        </div>
    </div>
);

const LegendItem = ({ color, label }) => (
    <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-xs font-semibold text-gray-600">{label}</span>
    </div>
);

export default ProgressDashboard;
