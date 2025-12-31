/**
 * @fileoverview Voicemail Player Component
 * 
 * Audio player for interviewer voice messages with visual waveform,
 * play/pause controls, progress tracking, and message transcript display.
 * 
 * @module components/dashboard/VoicemailPlayer
 */

import { useState, useRef } from 'react';
import { Play, Pause } from 'lucide-react';

const VoicemailPlayer = ({ voicemail, agent, message }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const audioRef = useRef(null);

    // Toggle Play/Pause
    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    // Update progress
    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const current = audioRef.current.currentTime;
            const total = audioRef.current.duration;
            setProgress((current / total) * 100);
        }
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setProgress(0);
    };

    return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl p-6 relative overflow-hidden">
            <audio
                ref={audioRef}
                src={voicemail.url}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
            />

            <div className="flex items-start gap-4 z-10 relative">
                {/* Agent Avatar with Status Dot */}
                <div className="relative flex-shrink-0">
                    <img
                        src={agent.avatar}
                        alt={agent.name}
                        className="w-14 h-14 rounded-full border-4 border-white shadow-sm object-cover"
                    />
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                Voice Message
                                {voicemail.isUnheard && (
                                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                )}
                            </h3>
                            <p className="text-sm text-gray-500">From {agent.name} • Interviewer</p>
                        </div>
                        <span className="text-xs font-mono font-bold text-gray-400 bg-white/50 px-2 py-1 rounded-lg">
                            {voicemail.duration}
                        </span>
                    </div>

                    {/* Player Controls */}
                    <div className="bg-white rounded-2xl p-3 shadow-sm border border-blue-100 flex items-center gap-3">
                        <button
                            onClick={togglePlay}
                            className="w-10 h-10 flex-shrink-0 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all shadow-md active:scale-95"
                        >
                            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                        </button>

                        {/* Simulated Waveform (Visual Only) */}
                        <div className="flex-1 h-8 flex items-center gap-0.5 opacity-50 overflow-hidden">
                            {[...Array(120)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-1 rounded-full bg-blue-500 transition-all duration-300 flex-shrink-0 ${i / 120 * 100 < progress ? 'opacity-100 h-6' : 'opacity-30 h-3'}`}
                                    style={{ height: `${Math.max(20, Math.random() * 100)}%` }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Personalized Message Bubble */}
                    <div className="mt-4 relative group">
                        <div className="absolute -top-1.5 left-6 w-3 h-3 bg-white border-t border-l border-gray-200 transform rotate-45 group-hover:bg-gray-50 transition-colors z-10"></div>
                        <div className="bg-white group-hover:bg-gray-50 transition-colors rounded-xl rounded-tl-none border border-gray-200 p-4 shadow-sm relative">
                            {message ? (
                                <div>
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                        <span className="text-gray-900">{message.greeting}</span>{' '}
                                        {message.context}{' '}
                                        <span className="bg-yellow-100/70 px-1 rounded mx-0.5 text-gray-900 box-decoration-clone">
                                            {message.observation}
                                        </span>{' '}
                                        {message.cta}
                                    </p>
                                    <div className="mt-2 flex items-center justify-end gap-1.5 opacity-60">
                                        <span className="text-[10px] font-medium text-gray-400">
                                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <div className="flex -space-x-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50"></span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-600 italic">"{voicemail.transcript}"</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VoicemailPlayer;
