import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { Play, AlertTriangle, CheckCircle, ThumbsUp, ThumbsDown, Lightbulb, ArrowRight, BookOpen, Link as LinkIcon, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import VoicemailPlayer from './VoicemailPlayer';
import FeedbackWaveform from './FeedbackWaveform';

// --- STABLE CHART COMPONENTS ---

const CustomTick = ({ x, y, cx, cy, payload, setHoveredSkill }) => {
    const skillId = `skill-${payload.value.replace(/\s+/g, '-')}`;
    let tx = x;
    let ty = y;

    if (cx !== undefined && cy !== undefined) {
        const dx = x - cx;
        const dy = y - cy;
        const length = Math.sqrt(dx * dx + dy * dy);
        const scale = (length + 25) / length;
        tx = cx + dx * scale;
        ty = cy + dy * scale;
    }

    return (
        <g
            className="cursor-pointer group"
            onMouseEnter={(e) => setHoveredSkill?.({ name: payload.value, mouseX: e.clientX, mouseY: e.clientY })}
            onMouseMove={(e) => setHoveredSkill?.({ name: payload.value, mouseX: e.clientX, mouseY: e.clientY })}
            id={`tick-${skillId}`}
        >
            <circle cx={tx} cy={ty} r={30} fill="transparent" />
            <text x={tx} y={ty} dy={4} textAnchor="middle" fill="#334155" fontSize={11} fontWeight={700} className="transition-colors duration-200 uppercase select-none pointer-events-none skill-text">
                {payload.value}
            </text>
        </g>
    );
};

const CustomDot = ({ cx, cy, payload, setHoveredSkill }) => {
    const skillId = `skill-${payload.skill.replace(/\s+/g, '-')}`;
    return (
        <g
            className="cursor-pointer"
            onMouseEnter={(e) => setHoveredSkill?.({ name: payload.skill, mouseX: e.clientX, mouseY: e.clientY })}
            onMouseMove={(e) => setHoveredSkill?.({ name: payload.skill, mouseX: e.clientX, mouseY: e.clientY })}
            id={`dot-${skillId}`}
        >
            <circle cx={cx} cy={cy} r={12} fill="transparent" />
            <circle cx={cx} cy={cy} r={5} stroke="transparent" strokeWidth={2} fill="transparent" className="transition-all duration-200 pointer-events-none skill-dot-inner" />
        </g>
    );
};

// Memoized Chart Component
const RadarChartSection = React.memo(({ radarData, setHoveredSkill }) => {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#cbd5e1" strokeDasharray="3 3" />
                <PolarAngleAxis dataKey="skill" tick={(props) => <CustomTick {...props} setHoveredSkill={setHoveredSkill} />} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Skills" dataKey="value" stroke="#2563EB" strokeWidth={3} fill="#3b82f6" fillOpacity={0.15} isAnimationActive={false} dot={(props) => <CustomDot {...props} setHoveredSkill={setHoveredSkill} />} className="skill-radar" />
            </RadarChart>
        </ResponsiveContainer>
    );
});

// --- HELPER FOR SCORE COLOR ---
const getScoreColor = (score) => {
    if (score >= 90) return { color: 'text-emerald-700', fill: '#059669', bg: 'bg-emerald-50', textLight: 'text-emerald-700' };
    if (score >= 80) return { color: 'text-green-700', fill: '#16a34a', bg: 'bg-green-50', textLight: 'text-green-700' };
    if (score >= 60) return { color: 'text-yellow-700', fill: '#ca8a04', bg: 'bg-yellow-50', textLight: 'text-yellow-700' };
    return { color: 'text-red-700', fill: '#dc2626', bg: 'bg-red-50', textLight: 'text-red-700' };
};

// --- DEDICATED PRINT TEMPLATE ---
// This component renders the FULL content specifically for PDF capture.
// It is hidden from normal view but used by html2canvas.
const PdfExportTemplate = ({ session, radarData, scoreColors }) => {
    return (
        <div id="pdf-export-container" className="bg-white p-8 w-[800px]"> {/* Fixed Width for A4-ish */}

            {/* Header */}
            <div className="mb-8 border-b border-gray-200 pb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{session.role}</h1>
                        <p className="text-gray-500 uppercase tracking-wider font-semibold text-sm">{session.company} • {session.recording?.duration || "15 min"}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-sm font-bold text-gray-800">{session.agent.name}</p>
                            <p className="text-xs font-medium text-gray-500">Interviewer</p>
                        </div>
                        <img src={session.agent.avatar} alt="Agent" className="w-12 h-12 rounded-full border border-gray-100" />
                    </div>
                </div>
            </div>

            {/* Score & Radar */}
            <div className="flex border border-gray-200 rounded-2xl mb-8 overflow-hidden">
                <div className="w-1/3 p-8 border-r border-gray-100 flex flex-col items-center justify-center bg-gray-50/10">
                    <div className="relative w-40 h-40">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="80" cy="80" r="70" stroke="#f1f5f9" strokeWidth="10" fill="none" />
                            <circle cx="80" cy="80" r="70" stroke={scoreColors.fill} strokeWidth="10" fill="none"
                                strokeDasharray="440" strokeDashoffset={440 - (440 * session.overallScore) / 100} strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-5xl font-black ${scoreColors.color}`}>{session.overallScore}</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase mt-1">Score</span>
                        </div>
                    </div>
                </div>
                <div className="w-2/3 p-6">
                    <h3 className="text-sm font-bold text-gray-900 border-l-2 border-blue-500 pl-2 mb-4">Skill Breakdown</h3>
                    <RadarChartSection radarData={radarData} setHoveredSkill={() => { }} /> {/* No Hover needed */}
                </div>
            </div>

            {/* Timeline */}
            <div className="mb-8 border border-gray-200 rounded-2xl p-6">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Response Timeline • Key moments identified by {session.agent.name}</h4>
                <FeedbackWaveform highlights={session.highlights} duration={session.recording?.duration || "15:00"} agentName={session.agent.name} />
            </div>

            {/* Feedback & Recommendations Grid */}
            <div className="grid grid-cols-2 gap-8 mb-8">
                {/* Feedback */}
                <div className="border border-gray-200 rounded-2xl p-6 bg-gray-50/30">
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2">Key Feedback</h4>
                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2"><ThumbsUp className="w-4 h-4 text-emerald-500" /><span className="text-sm font-bold text-emerald-700">Strengths</span></div>
                            <p className="text-xs text-gray-600 italic">"Excellent handling of the technical objection regarding concurrent users."</p>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-2"><ThumbsDown className="w-4 h-4 text-amber-500" /><span className="text-sm font-bold text-amber-700">Concerns</span></div>
                            <p className="text-xs text-gray-600 italic">"You missed the opportunity to close on the budget timeline."</p>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-2"><div className="w-3.5 h-3.5 bg-blue-100 rounded-full flex items-center justify-center text-[10px] text-blue-600 font-bold">i</div><span className="text-sm font-bold text-blue-700">Suggestion</span></div>
                            <p className="text-xs text-gray-600 italic">"Try pausing after key technical explanations to let the stakeholder digest the information."</p>
                        </div>
                    </div>
                </div>
                {/* Recommendations */}
                <div className="border border-gray-200 rounded-2xl p-6">
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2">Recommended Actions</h4>
                    <div className="space-y-4">
                        <div className="flex gap-3"><Lightbulb className="w-4 h-4 text-gray-900 shrink-0" /> <span className="text-sm text-gray-800 font-medium">Review Objection Handling (Module 4)</span></div>
                        <div className="flex gap-3"><BookOpen className="w-4 h-4 text-gray-900 shrink-0" /> <span className="text-sm text-gray-800 font-medium">Read: "The Art of the Close"</span></div>
                        <div className="flex gap-3"><CheckCircle className="w-4 h-4 text-gray-900 shrink-0" /> <span className="text-sm text-gray-800 font-medium">Practice Pace Control (2-Min Drills)</span></div>
                    </div>
                </div>
            </div>

            {/* DETAILED SKILL BREAKDOWN (The Missing Piece) */}
            <div className="border border-gray-200 rounded-2xl p-6 bg-slate-50">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Detailed Skill Analysis</h4>
                <div className="grid grid-cols-1 gap-4">
                    {Object.entries(session.skillsFeedback || {}).map(([skill, feedback]) => (
                        <div key={skill} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex gap-4">
                            <div className="w-1/4 font-bold text-gray-900 text-sm uppercase">{skill}</div>
                            <div className="w-3/4 text-xs text-gray-600 italic leading-relaxed">"{feedback}"</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center text-xs text-gray-300">
                Generated by Sparr AI • {new Date().toLocaleDateString()}
            </div>
        </div>
    );
};


// --- MAIN COMPONENT ---

const ReportDetail = ({ session, onViewResume }) => {
    const [hoveredSkill, setHoveredSkill] = React.useState(null);
    const [isExporting, setIsExporting] = React.useState(false);

    // Transform skills data
    const radarData = React.useMemo(() => {
        const skills = session.skills || {};
        return [
            { skill: 'Technical', value: skills.technical || 0, fullMark: 100 },
            { skill: 'Communication', value: skills.communication || 0, fullMark: 100 },
            { skill: 'Problem Solving', value: skills.problemSolving || 0, fullMark: 100 },
            { skill: 'Confidence', value: skills.confidence || 0, fullMark: 100 },
            { skill: 'Empathy', value: skills.empathy || 0, fullMark: 100 },
            { skill: 'Pacing', value: skills.pacing || 0, fullMark: 100 },
        ];
    }, [session.skills]);

    const scoreColors = getScoreColor(session.overallScore);

    // DOM-based highlighting
    React.useEffect(() => {
        document.querySelectorAll('.skill-text').forEach(el => {
            el.setAttribute('fill', '#334155');
            el.setAttribute('font-weight', '700');
        });
        document.querySelectorAll('.skill-dot-inner').forEach(el => {
            el.setAttribute('fill', 'transparent');
            el.setAttribute('stroke', 'transparent');
        });
        document.querySelector('.skill-radar path')?.setAttribute('stroke', '#2563EB');

        if (hoveredSkill) {
            const skillId = `skill-${hoveredSkill.name.replace(/\s+/g, '-')}`;
            const textEl = document.querySelector(`#tick-${skillId} text`);
            if (textEl) {
                textEl.setAttribute('fill', '#1e40af');
                textEl.setAttribute('font-weight', '800');
            }
            const dotEl = document.querySelector(`#dot-${skillId} .skill-dot-inner`);
            if (dotEl) {
                dotEl.setAttribute('fill', '#2563EB');
                dotEl.setAttribute('stroke', '#fff');
            }
        }
    }, [hoveredSkill]);

    const handleExport = async () => {
        setIsExporting(true);
        setTimeout(async () => {
            // Target the HIDDEN TEMPLATE container
            const element = document.getElementById('pdf-export-container');
            if (!element) {
                console.error("Export template not found");
                setIsExporting(false);
                return;
            }

            try {
                const canvas = await html2canvas(element, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff'
                });

                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();

                const imgWidth = canvas.width;
                const imgHeight = canvas.height;

                // Calculate the height of the image on the PDF page
                const ratio = pdfWidth / imgWidth;
                const scaledImgHeight = imgHeight * ratio;

                let heightLeft = scaledImgHeight;
                let position = 0;

                // Add First Page
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledImgHeight);
                heightLeft -= pdfHeight;

                // Add subsequent pages if content overflows
                while (heightLeft > 0) {
                    position = heightLeft - scaledImgHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledImgHeight);
                    heightLeft -= pdfHeight;
                }

                pdf.save(`Sparr_Report_${session.role.replace(/\s+/g, '_')}.pdf`);
            } catch (err) {
                console.error("Export failed:", err);
            } finally {
                setIsExporting(false);
            }
        }, 100);
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full bg-white rounded-r-3xl rounded-l-none border border-gray-200 border-l-0 shadow-sm overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-8 border-b border-gray-100 bg-gray-50/10">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{session.role}</h2>
                            <div className="flex items-center gap-2.5 mt-3 text-sm">
                                <span className="font-semibold text-gray-500 uppercase tracking-wider">{session.company}</span>

                                <span className="text-gray-300">•</span>
                                <span className="text-gray-500">Duration: <span className="font-medium text-gray-900">{session.recording?.duration || "15 min"}</span></span>

                                {session.resumeContext?.storageUrl && (
                                    <>
                                        <span className="text-gray-300">•</span>
                                        <button
                                            onClick={() => onViewResume && onViewResume(session.resumeContext)}
                                            className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-all group"
                                        >
                                            <div className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center border border-gray-200 group-hover:bg-gray-200 transition-colors">
                                                <LinkIcon className="w-3 h-3 text-gray-900" />
                                            </div>
                                            <span className="text-xs font-bold text-gray-700 group-hover:text-gray-900">Resume</span>
                                        </button>
                                    </>
                                )}

                                {/* Export Button */}
                                <span className="text-gray-300">•</span>
                                <button
                                    onClick={handleExport}
                                    disabled={isExporting}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                                >
                                    <Download className="w-3.5 h-3.5 group-hover:animate-bounce" />
                                    <span className="text-xs font-bold">{isExporting ? 'Exporting...' : 'PDF'}</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-bold text-gray-800">{session.agent.name}</p>
                                <p className="text-xs font-medium text-gray-500">Interviewer</p>
                            </div>
                            <img
                                src={session.agent.avatar}
                                alt={session.agent.name}
                                className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover"
                            />
                        </div>
                    </div>
                </div>

                {/* Content Container (Scrollable) */}
                <div className="flex-1 overflow-y-auto bg-gray-50/30">

                    {/* Voicemail Section */}
                    {session.voicemail && (
                        <div className="p-8 pb-0">
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                                <VoicemailPlayer voicemail={session.voicemail} agent={session.agent} />
                            </motion.div>
                        </div>
                    )}

                    <div className="p-8 space-y-8">
                        {/* Unified Report Card */}
                        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">

                            {/* Row 1: Score & Radar */}
                            <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
                                <div className="p-8 flex items-center justify-center lg:w-1/3 bg-white relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-bl-full -mr-8 -mt-8 z-0 opacity-50" />
                                    <div className="relative z-10 w-40 h-40">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="80" cy="80" r="70" stroke="#f1f5f9" strokeWidth="10" fill="none" />
                                            <circle cx="80" cy="80" r="70" stroke={scoreColors.fill} strokeWidth="10" fill="none"
                                                strokeDasharray="440" strokeDashoffset={440 - (440 * session.overallScore) / 100} strokeLinecap="round" className="drop-shadow-sm transition-all duration-1000 ease-out" />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className={`text-5xl font-black tracking-tighter ${scoreColors.color}`}>{session.overallScore}</span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase mt-1 tracking-widest">Score</span>
                                        </div>
                                    </div>
                                </div>

                                <div
                                    onMouseLeave={() => setHoveredSkill(null)}
                                    className="p-6 lg:w-2/3 flex flex-col relative group/chart bg-white"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-sm font-bold text-gray-900 border-l-2 border-blue-500 pl-2">Skill Breakdown</h3>
                                    </div>

                                    {/* Tooltip */}
                                    {createPortal(
                                        <AnimatePresence>
                                            {hoveredSkill && session.skillsFeedback && session.skillsFeedback[hoveredSkill.name] && hoveredSkill.mouseX && !isExporting && (
                                                <motion.div
                                                    key="tooltip"
                                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                                    style={{
                                                        position: 'fixed',
                                                        top: hoveredSkill.mouseY - 20,
                                                        left: hoveredSkill.mouseX,
                                                        transform: 'translate(-50%, -100%)',
                                                        pointerEvents: 'none',
                                                        zIndex: 9999
                                                    }}
                                                    className="w-64 bg-slate-900 text-white text-xs p-3 rounded-lg shadow-xl"
                                                >
                                                    <div className="flex items-start gap-2">
                                                        <img src={session.agent.avatar} alt="Agent" className="w-6 h-6 rounded-full border border-gray-600 shrink-0" />
                                                        <div>
                                                            <p className="leading-normal text-gray-200 italic">"{session.skillsFeedback[hoveredSkill.name]}"</p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>,
                                        document.body
                                    )}

                                    <div className="flex-1 flex items-center justify-center">
                                        <RadarChartSection radarData={radarData} setHoveredSkill={setHoveredSkill} />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-100"></div>

                            <div className="p-8 w-full bg-white">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Response Timeline • Key moments identified by {session.agent.name}</h4>
                                <FeedbackWaveform highlights={session.highlights} duration={session.recording?.duration || "15:00"} agentName={session.agent.name} />
                            </div>

                            <div className="border-t border-gray-100"></div>

                            <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
                                {/* Feedback Section (Left) */}
                                <div className="p-8 lg:w-3/5 bg-gray-50/30">
                                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-6">Feedback</h4>
                                    <div className="space-y-6">
                                        {/* Strengths */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <ThumbsUp className="w-4 h-4 text-emerald-500 transform -rotate-12" />
                                                <span className="text-sm font-bold text-emerald-700">Strengths</span>
                                            </div>
                                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-sm text-gray-600 leading-relaxed relative">
                                                <div className="absolute top-4 left-0 w-1 h-8 bg-emerald-500 rounded-r-full"></div>
                                                "Excellent handling of the technical objection regarding concurrent users. You pivoted smoothly to the architecture discussion without getting defensive."
                                            </div>
                                        </div>
                                        {/* Concerns */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <ThumbsDown className="w-4 h-4 text-amber-500 transform rotate-12" />
                                                <span className="text-sm font-bold text-amber-700">Concerns</span>
                                            </div>
                                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-sm text-gray-600 leading-relaxed relative">
                                                <div className="absolute top-4 left-0 w-1 h-8 bg-amber-500 rounded-r-full"></div>
                                                "You missed the opportunity to close on the budget timeline. The prospect dropped a hint about Q4 budget, but you moved to the next topic."
                                            </div>
                                        </div>
                                        {/* Suggestion (New 3rd Item) */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <span className="text-blue-600 font-bold text-[10px]">i</span>
                                                </div>
                                                <span className="text-sm font-bold text-blue-700">Suggestion</span>
                                            </div>
                                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-sm text-gray-600 leading-relaxed relative">
                                                <div className="absolute top-4 left-0 w-1 h-8 bg-blue-500 rounded-r-full"></div>
                                                "Try pausing after key technical explanations to let the stakeholder digest the information. A simple 'Does that make sense?' check-in goes a long way."
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Recommendations Section (Right) */}
                                <div className="p-8 lg:w-2/5 bg-white">
                                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-6">Recommendations</h4>
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3 group cursor-pointer hover:bg-gray-50 p-2 -ml-2 rounded-lg transition-colors">
                                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200 group-hover:bg-gray-200 group-hover:border-gray-300 transition-colors">
                                                <Lightbulb className="w-4 h-4 text-gray-900" />
                                            </div>
                                            <div>
                                                <span className="block text-xs font-bold text-gray-900 mb-0.5 group-hover:text-gray-900">Review Objection Handling</span>
                                                <span className="text-xs text-gray-500 leading-snug">Module 4: Technical Pivots</span>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 group cursor-pointer hover:bg-gray-50 p-2 -ml-2 rounded-lg transition-colors">
                                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200 group-hover:bg-gray-200 group-hover:border-gray-300 transition-colors">
                                                <BookOpen className="w-4 h-4 text-gray-900" />
                                            </div>
                                            <div>
                                                <span className="block text-xs font-bold text-gray-900 mb-0.5 group-hover:text-gray-900">Closing Techniques</span>
                                                <span className="text-xs text-gray-500 leading-snug">Read: "The Art of the Close"</span>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 group cursor-pointer hover:bg-gray-50 p-2 -ml-2 rounded-lg transition-colors">
                                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200 group-hover:bg-gray-200 group-hover:border-gray-300 transition-colors">
                                                <CheckCircle className="w-4 h-4 text-gray-900" />
                                            </div>
                                            <div>
                                                <span className="block text-xs font-bold text-gray-900 mb-0.5 group-hover:text-gray-900">Practice Pace Control</span>
                                                <span className="text-xs text-gray-500 leading-snug">Exercise: 2-Minute Pause Drills</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* OFF-SCREEN PDF TEMPLATE (Always Rendered but Hidden, or Conditionally) */}
            {/* Using absolute -left-9999px ensures it is rendered in DOM for capture */}
            {isExporting && (
                <div style={{ position: 'absolute', top: 0, left: '-9999px' }}>
                    <PdfExportTemplate session={session} radarData={radarData} scoreColors={scoreColors} />
                </div>
            )}
        </>
    );
};

export default ReportDetail;
