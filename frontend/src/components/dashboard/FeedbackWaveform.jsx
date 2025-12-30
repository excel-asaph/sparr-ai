import React, { useState, useRef } from 'react';
import { Play, Pause, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FeedbackWaveform = ({ highlights = [], duration = "15:00", agentName = "AI", isExportMode = false, audioUrl = null }) => {
    // Robust duration parser supporting multiple formats
    const parseDuration = (str) => {
        if (!str) return 900; // Default 15 min

        // Handle "MM:SS" format (e.g., "15:30")
        if (str.includes(':')) {
            const parts = str.split(':').map(Number);
            if (parts.length === 2) return parts[0] * 60 + parts[1];
            if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]; // HH:MM:SS
        }

        // Handle "X min" or "X minutes" format (e.g., "4 min", "4 minutes")
        const minMatch = str.match(/(\d+)\s*min/i);
        if (minMatch) return parseInt(minMatch[1]) * 60;

        // Handle "X sec" or "X seconds" format
        const secMatch = str.match(/(\d+)\s*sec/i);
        if (secMatch) return parseInt(secMatch[1]);

        // Handle pure number (assume seconds)
        const num = parseInt(str);
        if (!isNaN(num)) return num;

        return 900; // Fallback to 15 min
    };
    const defaultDuration = parseDuration(duration);

    // Simulated waveform bars
    const BAR_COUNT = 60;
    const bars = Array.from({ length: BAR_COUNT }, () => Math.max(20, Math.random() * 100));

    const [activeHighlight, setActiveHighlight] = useState(null);
    const [hoveredHighlight, setHoveredHighlight] = useState(null);

    // Audio playback state
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [actualDuration, setActualDuration] = useState(null); // Track real duration from metadata

    // Use actual duration if available, otherwise fall back to prop
    const totalSeconds = actualDuration || parseDuration(duration);

    const playbackPercent = totalSeconds > 0 ? (currentTime / totalSeconds) * 100 : 0;

    const togglePlayPause = () => {
        if (!audioRef.current || !audioUrl) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const seekToTime = (seconds) => {
        if (!audioRef.current || !audioUrl) return;
        audioRef.current.currentTime = seconds;
        audioRef.current.play();
        setIsPlaying(true);
    };

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

                {/* Hidden Audio Element */}
                {audioUrl && (
                    <audio
                        ref={audioRef}
                        src={audioUrl}
                        onLoadedMetadata={(e) => {
                            if (e.target.duration && isFinite(e.target.duration)) {
                                console.log("Audio metadata loaded. Actual duration:", e.target.duration);
                                setActualDuration(e.target.duration);
                            }
                        }}
                        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
                        onEnded={() => setIsPlaying(false)}
                        onPause={() => setIsPlaying(false)}
                        onPlay={() => setIsPlaying(true)}
                    />
                )}

                {/* Play/Pause Button */}
                <button
                    onClick={togglePlayPause}
                    disabled={!audioUrl}
                    className={`z-20 w-10 h-10 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-105 transition-transform shrink-0 ${audioUrl ? 'bg-blue-600 cursor-pointer' : 'bg-gray-400 cursor-not-allowed'}`}
                >
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>

                {/* Waveform Track (This is the timeline reference for pins) */}
                <div className="relative flex-1 h-16 ml-4 mr-4">
                    {/* Playback Progress Indicator */}
                    {audioUrl && playbackPercent > 0 && (
                        <div
                            className="absolute top-0 left-0 h-full bg-blue-100/50 rounded-l-lg transition-all duration-100 pointer-events-none z-0"
                            style={{ width: `${playbackPercent}%` }}
                        />
                    )}

                    {/* Bars */}
                    <div className="flex items-center justify-between gap-1 h-full opacity-40 relative z-10">
                        {bars.map((height, i) => (
                            <div
                                key={i}
                                className="bg-gray-400 rounded-full transition-all hover:bg-blue-400 flex-1 min-w-[3px] max-w-[6px]"
                                style={{ height: `${height}%` }}
                            />
                        ))}
                    </div>

                    {/* Pins - Now positioned relative to the waveform track */}
                    {highlights.map((h, i) => {
                        const time = parseDuration(h.timestamp);
                        // Clamp percentage between 2% and 98% to prevent edge clipping
                        const percent = Math.max(2, Math.min(98, (time / totalSeconds) * 100));
                        const isActive = activeHighlight === i;
                        const isHovered = hoveredHighlight === i;

                        return (
                            <div
                                key={i}
                                className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 group cursor-pointer z-20"
                                style={{ left: `${percent}%`, zIndex: isActive ? 40 : 30 }}
                                onClick={() => {
                                    setActiveHighlight(isActive ? null : i);
                                    // Seek audio to this highlight's timestamp
                                    const timeInSeconds = parseDuration(h.timestamp);
                                    seekToTime(timeInSeconds);
                                }}
                                onMouseEnter={() => setHoveredHighlight(i)}
                                onMouseLeave={() => setHoveredHighlight(null)}
                            >
                                {/* Pin Head */}
                                <div className={`
                                    w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center transition-transform hover:scale-110
                                    ${isActive ? 'bg-white scale-125 ring-4 ring-blue-100' : 'bg-gray-50'}
                                `}>
                                    {getIcon(h.type)}
                                </div>

                                {/* Pin Line */}
                                <div className={`absolute top-8 left-1/2 w-0.5 -translate-x-1/2 -z-10 ${isActive ? 'bg-blue-500' : 'bg-gray-300'}`} style={{ height: '30px' }}></div>

                                {/* Scanning Tooltip (Hover Only) */}
                                <AnimatePresence>
                                    {isHovered && !isActive && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.9, x: "-50%" }}
                                            animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
                                            exit={{ opacity: 0, y: 10, scale: 0.9, x: "-50%" }}
                                            className="absolute bottom-full mb-3 left-1/2 whitespace-nowrap bg-gray-900/90 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-xl z-50 flex items-center gap-2"
                                        >
                                            <span className="opacity-75">{h.timestamp}</span>
                                            <span className="w-0.5 h-2 bg-gray-600"></span>
                                            <span className="capitalize text-white">{h.type}</span>
                                            <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900/90 transform rotate-45"></div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Active Highlight Card or Export List */}
            {isExportMode ? (
                <div className="space-y-4">
                    {highlights.map((h, i) => (
                        <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col md:flex-row">
                            {/* Context Column */}
                            <div className="p-5 md:w-2/3 border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50/30">
                                {h.qaContext ? (
                                    <div className="space-y-4">
                                        <div>
                                            <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                                                Context: The Question
                                                <span className="text-gray-400 font-medium normal-case bg-gray-100 px-2 py-0.5 rounded-full">{h.timestamp}</span>
                                            </h5>
                                            <p className="text-sm font-medium text-gray-900 leading-snug">"{h.qaContext.question}"</p>
                                        </div>
                                        <div className="relative">
                                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-200 rounded-full"></div>
                                            <div className="pl-3">
                                                <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">You Said</h5>
                                                <p className="text-xs text-gray-600 italic leading-relaxed">"{h.qaContext.answer}"</p>
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
                                    {getIcon(h.type)}
                                    <span className={`text-xs font-bold uppercase ${h.type === 'success' ? 'text-green-700' : h.type === 'warning' ? 'text-amber-700' : h.type === 'critical' ? 'text-red-700' : 'text-gray-700'}`}>
                                        {h.type} Feedback
                                    </span>
                                </div>
                                <p className="text-sm font-semibold text-gray-900 leading-snug">
                                    {h.text}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : activeHighlight !== null ? (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col md:flex-row relative"
                >
                    <button
                        onClick={() => setActiveHighlight(null)}
                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 md:hidden"
                    >
                        <XCircle className="w-5 h-5" />
                    </button>

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
                    Click a pin to view the transcript and detailed feedback.
                </div>
            )}
        </div>
    );
};

export default FeedbackWaveform;
