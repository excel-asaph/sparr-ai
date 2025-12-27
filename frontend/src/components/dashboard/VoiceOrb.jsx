import React, { useEffect, useRef, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, PhoneOff, Settings2, Maximize2, Minimize2, Wifi, Clock, Battery, Notebook, X } from 'lucide-react';
import { useConversation } from '@elevenlabs/react';
import Workbook from './Workbook';
import { Orb } from '../ui/Orb';

const VoiceOrb = ({ isActive, onEndCall, systemPrompt }) => {
    // Local UI State
    const [isMuted, setIsMuted] = useState(false);
    const [isImmersive, setIsImmersive] = useState(false);
    const [isWorkbook, setIsWorkbook] = useState(false); // Workbook Mode State

    // Note State
    const [notes, setNotes] = useState("");

    // Session Timer State (HUD)
    const [durationSeconds, setDurationSeconds] = useState(0);
    const MAX_DURATION = 30 * 60; // 30 Minutes default limit

    useEffect(() => {
        let interval;
        if (isActive) {
            interval = setInterval(() => {
                setDurationSeconds(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isActive]);

    const formatTime = (secs) => {
        const mins = Math.floor(secs / 60);
        const remainingSecs = secs % 60;
        return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
    };

    const formatTimeLeft = (elapsed) => {
        const remaining = Math.max(0, MAX_DURATION - elapsed);
        return formatTime(remaining);
    };

    // Mute Logic: Ref to hold the active media stream
    const streamRef = useRef(null);

    // 1. ElevenLabs Hook
    const conversation = useConversation({
        onConnect: () => console.log("Connected to ElevenLabs"),
        onDisconnect: () => console.log("Disconnected from ElevenLabs"),
        onMessage: (message) => console.log("Agent Message:", message),
        onError: (error) => console.error("ElevenLabs Error:", error),
    });

    const { status, isSpeaking } = conversation;
    const isConnected = status === 'connected';
    const isConnecting = status === 'connecting';

    // 2. Mute Toggle Effect
    // When isMuted changes, finding the track and enabling/disabling it
    useEffect(() => {
        if (streamRef.current) {
            streamRef.current.getAudioTracks().forEach(track => {
                track.enabled = !isMuted;
            });
            console.log("Microphone muted:", isMuted);
        }
    }, [isMuted]);

    // 3. Start Logic with Interception
    const startConversation = async () => {
        try {
            // A. Standard permission request
            await navigator.mediaDevices.getUserMedia({ audio: true });

            // B. Intercept getUserMedia to capture the stream
            const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);

            navigator.mediaDevices.getUserMedia = async (constraints) => {
                const stream = await originalGetUserMedia(constraints);
                // Capture the stream used by the SDK
                streamRef.current = stream;

                // Apply current mute state immediately
                stream.getAudioTracks().forEach(track => {
                    track.enabled = !isMuted;
                });

                console.log("Stream captured via interception");
                return stream;
            };

            // C. Start Session (SDK calls our intercepted gUM)
            await conversation.startSession({
                agentId: import.meta.env.VITE_ELEVENLABS_AGENT_ID,
                overrides: {
                    agent: {
                        prompt: {
                            prompt: systemPrompt || "You are a helpful interviewer."
                        },
                        firstMessage: "Hello! I've reviewed your application. Ready to begin?"
                    }
                }
            });

            // D. Restore original function SAFELY after a short delay
            // (SDK calls it asynchronously during connection)
            setTimeout(() => {
                navigator.mediaDevices.getUserMedia = originalGetUserMedia;
            }, 2000);

        } catch (error) {
            console.error("Failed to start conversation:", error);
            // Ensure restore
            if (navigator.mediaDevices.getUserMedia.name !== 'getUserMedia') {
                // Hard reset if needed, though bind keeps it safe usually
            }
        }
    };

    const stopConversation = async () => {
        await conversation.endSession();
        // Clean up stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (onEndCall) onEndCall();
    };

    // Auto-start Guard
    const hasStartedRef = useRef(false);
    useEffect(() => {
        if (isActive && systemPrompt && status === 'disconnected' && !hasStartedRef.current) {
            hasStartedRef.current = true;
            startConversation();
        }
    }, [isActive, systemPrompt, status]);

    // 4. Map State to Orb AgentState
    const agentState = useMemo(() => {
        if (isConnecting) return 'thinking';
        if (isConnected) return isSpeaking ? 'talking' : 'listening';
        return null; // Idle
    }, [isConnecting, isConnected, isSpeaking]);

    return (
        <div className="w-full h-full relative overflow-hidden bg-transparent">

            {/* 0. Session HUD (Heads-Up Display) */}
            <AnimatePresence>
                {!isImmersive && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-6 left-0 right-0 mx-auto w-max z-30 flex items-center gap-3 p-2 pr-6 bg-white/50 backdrop-blur-xl border border-white/40 shadow-sm rounded-full"
                    >
                        {/* Status Indicator */}
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${isConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            <Wifi className="w-3 h-3" />
                            <span className="text-xs font-bold tracking-wide">{isConnected ? 'EXCELLENT' : 'OFFLINE'}</span>
                        </div>

                        {/* Divider */}
                        <div className="w-px h-4 bg-gray-300/50" />

                        {/* Duration */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Elapsed</span>
                            <span className="font-mono text-sm font-bold text-gray-700">{formatTime(durationSeconds)}</span>
                        </div>

                        {/* Divider */}
                        <div className="w-px h-4 bg-gray-300/50" />

                        {/* Time Remaining */}
                        <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-blue-500" />
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</span>
                            <span className="font-mono text-sm font-bold text-blue-600">{formatTimeLeft(durationSeconds)}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 0.5 Scratchpad (Workbook View) */}
            <Workbook isOpen={isWorkbook} content={notes} onContentChange={setNotes} />

            {/* 1. Orb Section (Stable Layout Transition) */}
            <div className={`absolute inset-0 pointer-events-none overflow-hidden ${isWorkbook ? 'z-20' : 'z-10'}`}>
                <motion.div
                    layout
                    initial={false}
                    animate={{
                        // Scale logic
                        scale: isWorkbook ? 0.35 : (isImmersive ? 1.4 : 1),

                        // Positioning Logic (Explicit "Top-Left" Coordinates)
                        // This avoids the ambiguity of mixed transforms (x/y) vs layout props
                        // Orb Size = 256px

                        top: isWorkbook ? '32px' : 'calc(50% - 128px)', // 32px (2rem) vs Center
                        left: isWorkbook ? 'calc(100% - 288px)' : 'calc(50% - 128px)', // Right-aligned (256+32) vs Center

                        // Clear conflicting properties
                        right: 'auto',
                        y: 0,
                        x: 0,

                        opacity: isWorkbook ? 0.9 : 1
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 180,
                        damping: 25,
                        mass: 0.8
                    }}

                    // Pure Size Lock
                    className="absolute flex-none"
                    style={{
                        width: '256px',
                        height: '256px',
                    }}
                >
                    <div className="absolute inset-0 z-10 transition-opacity duration-300" style={{ width: '256px', height: '256px' }}>
                        <Orb
                            agentState={agentState}
                            colors={["#66a9d8", "#9ce6e6"]}
                            // Visual Mute: also forces orb to be quiet
                            manualInput={isMuted ? 0 : undefined}
                            className="w-full h-full"
                        />
                    </div>

                    {/* Connection Spinner */}
                    <AnimatePresence>
                        {isConnecting && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
                            >
                                <div className="w-16 h-16 border-4 border-white/50 border-t-white rounded-full animate-spin" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* 2. Status Text (Hidden in Immersive & Workbook) */}
            <AnimatePresence>
                {!isImmersive && !isWorkbook && (
                    <motion.div
                        // Absolute positioning prevents layout shifts when hiding (Anti-Jitter)
                        // top-[calc(50%+160px)] places it exactly 32px below the Orb (128px radius + 32px gap)
                        className="absolute left-0 right-0 top-[calc(50%+160px)] text-center z-10 pointer-events-none"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                    >
                        <h2 className="text-xl font-medium text-gray-600 tracking-wider uppercase">
                            {isConnecting ? "Connecting..." : (isConnected ? (isSpeaking ? "Speaking..." : "Listening...") : "Ready")}
                        </h2>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 3. Controls */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="absolute bottom-12 left-0 right-0 flex items-center justify-center gap-6 z-20 pointer-events-auto"
            >
                {/* Workbook Toggle */}
                <button
                    onClick={() => setIsWorkbook(!isWorkbook)}
                    className={`p-4 rounded-full transition-all duration-300 shadow-sm ${isWorkbook ? 'bg-indigo-50 text-indigo-500 hover:bg-indigo-100' : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                    title={isWorkbook ? "Close Workbook" : "Open Workbook"}
                >
                    {isWorkbook ? <X className="w-6 h-6" /> : <Notebook className="w-6 h-6" />}
                </button>

                {/* Mute Toggle */}
                <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-4 rounded-full transition-all duration-300 shadow-sm ${isMuted ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                    title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
                >
                    {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>

                {/* End Call */}
                <button
                    onClick={stopConversation}
                    className="w-20 h-20 rounded-full bg-red-500 text-white flex items-center justify-center shadow-2xl hover:bg-red-600 hover:scale-110 transition-all active:scale-95 duration-300"
                    title="End Conversation"
                >
                    <PhoneOff className="w-8 h-8 fill-current" />
                </button>

                {/* Immersive / Focus Mode Toggle */}
                <button
                    onClick={() => setIsImmersive(!isImmersive)}
                    className={`p-4 rounded-full transition-all duration-300 shadow-sm ${isImmersive ? 'bg-blue-50 text-blue-500 hover:bg-blue-100' : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                    title={isImmersive ? "Exit Focus Mode" : "Enter Focus Mode"}
                >
                    {isImmersive ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
                </button>
            </motion.div>
        </div>
    );
};

export default VoiceOrb;
