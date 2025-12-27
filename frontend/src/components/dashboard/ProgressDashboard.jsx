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
        <div className="h-full overflow-y-auto p-4 md:p-8 bg-gray-50/30">
            {/* Unified Dashboard Card */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">

                {/* Header / Metric Row (Divided) */}
                <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-100 bg-white">
                    <MetricItem
                        label="Overall Growth"
                        value={`+${Math.round(scoreDelta)}%`}
                        icon={TrendingUp}
                        color="text-green-600"
                        bg="bg-green-50"
                        trend="since start"
                    />
                    <MetricItem
                        label="Current Score"
                        value={Math.round(latestSession.overallScore)}
                        icon={Award}
                        color="text-blue-600"
                        bg="bg-blue-50"
                        trend="top 15%"
                    />
                    <MetricItem
                        label="Best Skill"
                        value="Technical"
                        icon={Zap}
                        color="text-purple-600"
                        bg="bg-purple-50"
                        trend="+12 pts"
                    />
                    <MetricItem
                        label="Focus Area"
                        value="Pacing"
                        icon={Target}
                        color="text-orange-600"
                        bg="bg-orange-50"
                        trend="needs work"
                    />
                </div>

                {/* Divider Line */}
                <div className="border-t border-gray-100"></div>

                {/* Main Content Split: Line Chart | Radar Chart */}
                <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-gray-100">

                    {/* Evolution Chart (Left - Wider) */}
                    <div className="lg:w-2/3 p-8 bg-white">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 tracking-tight">Skill Evolution</h3>
                                <p className="text-sm text-gray-500 mt-1">Track your progress across {history.length} sessions</p>
                            </div>
                            <div className="flex gap-3">
                                <LegendItem color="#3b82f6" label="Overall" />
                                <LegendItem color="#10b981" label="Technical" />
                            </div>
                        </div>

                        <div className="h-[320px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                        cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="score"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorScore)"
                                        activeDot={{ r: 6, strokeWidth: 0, fill: '#2563EB' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="technical"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        dot={false}
                                        activeDot={{ r: 4, strokeWidth: 0, fill: '#10b981' }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Radar Comparison (Right - Narrower) */}
                    <div className="lg:w-1/3 p-8 bg-gray-50/30 flex flex-col">
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-gray-900 tracking-tight">Growth Map</h3>
                            <p className="text-sm text-gray-500 mt-1">First vs. Current Session</p>
                        </div>

                        <div className="flex-1 min-h-[300px] relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart outerRadius="70%" data={radarData}>
                                    <PolarGrid stroke="#e2e8f0" />
                                    <PolarAngleAxis dataKey="skill" tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar
                                        name="First Session"
                                        dataKey="first"
                                        stroke="#94a3b8"
                                        strokeWidth={2}
                                        fill="#94a3b8"
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
                                        wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }}
                                        formatter={(value) => <span className="text-gray-600 font-medium ml-1">{value}</span>}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            <div className="text-center mt-6">
                <p className="text-xs text-gray-400 font-medium">Progress analytics based on {history.length} recorded sessions</p>
            </div>
        </div>
    );
};

// Simplified Metric Component for Grid
const MetricItem = ({ label, value, icon: Icon, color, bg, trend }) => (
    <div className="p-6 flex flex-col items-start hover:bg-gray-50/50 transition-colors">
        <div className="flex items-center justify-between w-full mb-3">
            <div className={`p-2 rounded-lg ${bg} ${color}`}>
                <Icon className="w-5 h-5" />
            </div>
            {trend && (
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full bg-gray-100 text-gray-500 uppercase tracking-wide flex items-center gap-1`}>
                    {trend.includes('+') && <ArrowUpRight className="w-3 h-3" />}
                    {trend}
                </span>
            )}
        </div>
        <div>
            <h4 className="text-3xl font-bold text-gray-900 tracking-tight">{value}</h4>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">{label}</p>
        </div>
    </div>
);

const LegendItem = ({ color, label }) => (
    <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm" style={{ backgroundColor: color }} />
        <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">{label}</span>
    </div>
);

export default ProgressDashboard;
