import React, { useState } from 'react';
import { Play, Pause, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FeedbackWaveform = ({ highlights = [], duration = "15:00", agentName = "AI" }) => {
    const parseDuration = (str) => {
        const [m, s] = str.split(':').map(Number);
        return m * 60 + s;
    };
    const totalSeconds = parseDuration(duration);

    // Simulated waveform bars
    const BAR_COUNT = 60;
    const bars = Array.from({ length: BAR_COUNT }, () => Math.max(20, Math.random() * 100));

    const [activeHighlight, setActiveHighlight] = useState(null);

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-4 h-4 text-green-500 fill-white" />;
            case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500 fill-white" />;
            case 'critical': return <XCircle className="w-4 h-4 text-red-500 fill-white" />;
            default: return <Info className="w-4 h-4 text-gray-400" />;
        }
    };

    const getPinColor = (type) => {
        switch (type) {
            case 'success': return 'bg-green-500';
            case 'warning': return 'bg-yellow-500';
            case 'critical': return 'bg-red-500';
            default: return 'bg-gray-400';
        }
    };

    return (
        <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Session Timeline</h3>
                    <p className="text-sm text-gray-500">Key moments identified by {agentName}</p>
                </div>
                <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div> Strength</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-yellow-500"></div> Suggestion</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div> Critical</div>
                </div>
            </div>

            {/* Waveform Container */}
            <div className="relative h-32 flex items-center bg-gray-50 rounded-2xl px-4 border border-gray-100 mb-6 select-none">

                {/* Play Button Overlay */}
                <button className="absolute left-6 z-20 w-10 h-10 rounded-full bg-blue-600 shadow-lg flex items-center justify-center text-white hover:scale-105 transition-transform">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                </button>

                {/* Bars */}
                <div className="flex-1 flex items-center justify-between gap-1 h-16 ml-16 mr-4 opacity-40 mask-image-gradient">
                    {bars.map((height, i) => (
                        <div
                            key={i}
                            className="w-1.5 bg-gray-400 rounded-full transition-all hover:bg-blue-400"
                            style={{ height: `${height}%` }}
                        />
                    ))}
                </div>

                {/* Pins */}
                {highlights.map((h, i) => {
                    const time = parseDuration(h.timestamp);
                    const percent = (time / totalSeconds) * 100;
                    const isActive = activeHighlight === i;

                    return (
                        <div
                            key={i}
                            className="absolute top-1/2 transform -translate-y-1/2 group"
                            style={{ left: `calc(${percent}% + 60px)`, zIndex: 30 }} // Offset for play button
                            onMouseEnter={() => setActiveHighlight(i)}
                            onMouseLeave={() => setActiveHighlight(null)}
                        >
                            {/* Pin Head */}
                            <div className={`
                                w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center cursor-pointer transition-transform hover:scale-110
                                ${isActive ? 'bg-white scale-125 z-40' : 'bg-gray-50'}
                            `}>
                                {getIcon(h.type)}
                            </div>

                            {/* Pin Line */}
                            <div className={`absolute top-8 left-1/2 w-0.5 h-full bg-gray-300 -translate-x-1/2 -z-10 ${isActive ? 'bg-blue-500' : ''}`} style={{ height: '30px' }}></div>

                            {/* Tooltip */}
                            <AnimatePresence>
                                {isActive && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.9, x: "-50%" }}
                                        animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
                                        exit={{ opacity: 0, y: 10, scale: 0.9, x: "-50%" }}
                                        className="absolute bottom-full mb-3 left-1/2 w-64 bg-gray-900 text-white text-xs p-3 rounded-xl shadow-xl z-50"
                                    >
                                        <div className="font-bold mb-1 flex justify-between">
                                            <span>{h.timestamp}</span>
                                            <span className="opacity-75 capitalize">{h.type}</span>
                                        </div>
                                        <p className="leading-relaxed opacity-90">{h.text}</p>
                                        <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-900 transform rotate-45"></div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>

            {/* Transcript Snippet Area */}
            {activeHighlight !== null ? (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col md:flex-row"
                >
                    {/* Context Column */}
                    <div className="p-5 md:w-2/3 border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50/30">
                        {highlights[activeHighlight].qaContext ? (
                            <div className="space-y-4">
                                <div>
                                    <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Context: The Question</h5>
                                    <p className="text-sm font-medium text-gray-900 leading-snug">"{highlights[activeHighlight].qaContext.question}"</p>
                                </div>
                                <div className="relative">
                                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-200 rounded-full"></div>
                                    <div className="pl-3">
                                        <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">You Said</h5>
                                        <p className="text-xs text-gray-600 italic leading-relaxed">"{highlights[activeHighlight].qaContext.answer}"</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 text-xs italic p-4">
                                No transcript context available for this moment.
                            </div>
                        )}
                    </div>

                    {/* Feedback Column */}
                    <div className="p-5 md:w-1/3 bg-blue-50/30 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-2">
                            {getIcon(highlights[activeHighlight].type)}
                            <span className={`text-xs font-bold uppercase ${highlights[activeHighlight].type === 'success' ? 'text-green-700' : highlights[activeHighlight].type === 'warning' ? 'text-amber-700' : highlights[activeHighlight].type === 'critical' ? 'text-red-700' : 'text-gray-700'}`}>
                                {highlights[activeHighlight].type} Feedback
                            </span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 leading-snug">
                            {highlights[activeHighlight].text}
                        </p>
                    </div>
                </motion.div>
            ) : (
                <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center text-sm text-gray-400">
                    Hover over the pins to view specific feedback moments.
                </div>
            )}
        </div>
    );
};

export default FeedbackWaveform;
