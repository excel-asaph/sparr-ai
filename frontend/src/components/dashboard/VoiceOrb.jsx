/**
 * @fileoverview Voice Interview Orb Component
 * 
 * Core voice interaction interface for mock interviews. Integrates with
 * ElevenLabs Conversational AI SDK for real-time voice conversations.
 * Features immersive mode, session timer, workbook notes, and visual
 * audio feedback through animated orb visualization.
 * 
 * @module components/dashboard/VoiceOrb
 * @requires @elevenlabs/react
 */

import { useEffect, useRef, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Maximize2, Minimize2, Wifi, Clock, Notebook, X, LogOut } from 'lucide-react';
import { useConversation } from '@elevenlabs/react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import Workbook from './Workbook';
import { Orb } from '../ui/Orb';
import { API_URL } from '../../utils/api';

const VoiceOrb = ({ isActive, onEndCall, onLeaveSession, systemPrompt, voiceId, language, interviewId, parentId, previousInterview, jobContext, persona, currentUser }) => {
    // Local UI State
    const [isMuted, setIsMuted] = useState(false);
    const [isImmersive, setIsImmersive] = useState(false);
    const [isWorkbook, setIsWorkbook] = useState(false); // Workbook Mode State

    // Note State
    const [notes, setNotes] = useState("");

    // Session Timer State (HUD)
    const [durationSeconds, setDurationSeconds] = useState(0);
    const MAX_DURATION = 5 * 60; // 5 Minutes session limit

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

    // Get remaining time styling based on urgency
    const getRemainingTimeStyle = (elapsed) => {
        const remaining = MAX_DURATION - elapsed;
        if (remaining <= 60) {
            // Under 1 minute: Red with pulse
            return { color: 'text-red-600', iconColor: 'text-red-500', pulse: true };
        } else if (remaining <= 120) {
            // Under 2 minutes: Amber warning
            return { color: 'text-amber-600', iconColor: 'text-amber-500', pulse: false };
        }
        // Healthy: Green/Blue
        return { color: 'text-blue-600', iconColor: 'text-blue-500', pulse: false };
    };

    const remainingStyle = getRemainingTimeStyle(durationSeconds);

    // Mute Logic: Ref to hold the active media stream
    const streamRef = useRef(null);

    // Conversation ID ref for report generation
    const conversationIdRef = useRef(null);
    const interviewIdRef = useRef(interviewId);
    const isLeavingRef = useRef(false); // Flag to skip report generation on leave

    // Keep interviewIdRef updated
    useEffect(() => {
        interviewIdRef.current = interviewId;
        console.log("VoiceOrb: interviewId updated to:", interviewId);
    }, [interviewId]);

    const [isGeneratingReport, setIsGeneratingReport] = useState(false);

    // Report generation function
    const generateReport = async (convId) => {
        const activeInterviewId = interviewIdRef.current || interviewId;
        console.log("generateReport called with:", { convId, interviewId: activeInterviewId });

        if (!convId || !activeInterviewId) {
            console.error("generateReport aborted - missing:", { convId, interviewId: activeInterviewId });
            return;
        }

        setIsGeneratingReport(true);
        console.log("Starting report generation...");

        try {
            // Note: reportStatus is already set to 'generating' in stopConversation
            let token = null;
            if (currentUser) {
                token = await currentUser.getIdToken();
                console.log("Got Firebase token for API call");
            } else {
                console.warn("No currentUser - making request without auth token");
            }

            console.log("Making API call to /api/generate-report with:", {
                conversationId: convId,
                interviewId: activeInterviewId,
                jobContext,
                persona: persona?.name
            });

            const response = await fetch(`${API_URL}/api/generate-report`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    conversationId: convId,
                    interviewId: activeInterviewId,
                    jobContext,
                    persona
                })
            });

            console.log("API response status:", response.status);
            const data = await response.json();
            console.log("API response data:", data);

            if (!data.success) {
                console.error('Report generation failed:', data.error);
            } else {
                console.log("Report generation successful!");
            }
        } catch (error) {
            console.error('Report generation error:', error);
        } finally {
            setIsGeneratingReport(false);
        }
    };

    // 1. ElevenLabs Hook
    const conversation = useConversation({
        onConnect: () => console.log("Connected to ElevenLabs"),
        onDisconnect: async () => {
            console.log("Disconnected from ElevenLabs");

            // If user is leaving (emergency exit), skip all report logic
            if (isLeavingRef.current) {
                console.log("Leave mode detected - skipping report generation");
                isLeavingRef.current = false; // Reset flag
                return; // Don't do anything - leaveSession handles cleanup
            }

            console.log("Agent-initiated disconnect - proceeding with report generation");
            console.log("ConversationIdRef at disconnect:", conversationIdRef.current);

            // Set reportStatus to 'generating' so UI shows loader
            const currentInterviewId = interviewIdRef.current;
            if (currentInterviewId) {
                try {
                    const interviewRef = doc(db, 'interviews', currentInterviewId);
                    await updateDoc(interviewRef, { reportStatus: 'generating' });
                    console.log("ReportStatus set to 'generating' via onDisconnect");
                } catch (err) {
                    console.error("Failed to set reportStatus in onDisconnect:", err);
                }
            }

            // Trigger report generation
            if (conversationIdRef.current) {
                console.log("Triggering report generation with conversationId:", conversationIdRef.current);
                generateReport(conversationIdRef.current);
            } else {
                console.error("No conversationId available at disconnect - report generation skipped");
            }

            // Clean up stream
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }

            // Trigger UI transition to reports
            if (onEndCall) onEndCall();
        },
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

    // Generate personalized first message based on context
    const generateFirstMessage = () => {
        const userName = currentUser?.displayName?.split(' ')[0] || 'there';
        const personaName = persona?.name || 'your interviewer';
        const companyName = jobContext?.company || 'the company';
        const roleName = jobContext?.role || 'the position';

        // Followup interview (has previousInterview data)
        if (previousInterview && parentId) {
            const prevPersonaName = typeof previousInterview.persona === 'string'
                ? previousInterview.persona
                : previousInterview.persona?.name || 'your previous interviewer';
            const isSamePersona = prevPersonaName === personaName;

            if (isSamePersona) {
                // Same persona - continuing relationship
                return `Welcome back, ${userName}! It's ${personaName} again. I reviewed our last session and I'm curious to see how you've progressed. Ready to pick up where we left off?`;
            } else {
                // Different persona - handoff context
                return `Hello ${userName}, I'm ${personaName}. I see ${prevPersonaName} conducted your previous interview for ${roleName} at ${companyName}. I've reviewed the notes and recommendations. Let's see how you've improved!`;
            }
        }

        // New interview (no previous context)
        return `Hello ${userName}! I'm ${personaName}, and I'll be conducting your ${roleName} interview today for ${companyName}. I've reviewed your resume and I'm ready to get started. Tell me, what excites you most about this opportunity?`;
    };

    // 3. Start Logic with Interception
    const startConversation = async () => {
        try {
            // A. Request permission first (stop stream immediately to avoid conflicts)
            const testStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            testStream.getTracks().forEach(track => track.stop()); // Release immediately

            // B. Intercept getUserMedia to capture the stream with quality constraints
            const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);

            navigator.mediaDevices.getUserMedia = async (constraints) => {
                // Enhance audio constraints for better quality
                const enhancedConstraints = {
                    ...constraints,
                    audio: constraints.audio === true ? {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    } : constraints.audio
                };

                const stream = await originalGetUserMedia(enhancedConstraints);
                // Capture the stream used by the SDK
                streamRef.current = stream;

                // Apply current mute state immediately
                stream.getAudioTracks().forEach(track => {
                    track.enabled = !isMuted;
                });

                console.log("Stream captured with enhanced audio quality");
                return stream;
            };

            // C. Start Session (SDK calls our intercepted gUM)
            const firstMessage = generateFirstMessage();
            console.log("Using personalized first message:", firstMessage);

            const sessionResult = await conversation.startSession({
                agentId: import.meta.env.VITE_ELEVENLABS_AGENT_ID,
                overrides: {
                    agent: {
                        prompt: {
                            prompt: systemPrompt || "You are a helpful interviewer."
                        },
                        firstMessage: firstMessage,
                        // Language Override: Set conversation language
                        ...(language && { language: language })
                    },
                    // Voice Override: Use persona's voice if provided
                    ...(voiceId && {
                        tts: {
                            voiceId: voiceId
                        }
                    })
                }
            });

            // Capture conversationId for report generation
            // ElevenLabs may return conversationId in different formats
            console.log("Session result from ElevenLabs:", sessionResult);

            const conversationId = typeof sessionResult === 'string'
                ? sessionResult
                : sessionResult?.conversationId || sessionResult?.conversation_id || sessionResult?.id;

            console.log("Extracted conversationId:", conversationId);

            if (conversationId) {
                conversationIdRef.current = conversationId;
                console.log("ConversationId stored in ref:", conversationIdRef.current);
            } else {
                console.error("Failed to extract conversationId from session result");
            }

            // D. Restore original function SAFELY after a short delay
            setTimeout(() => {
                navigator.mediaDevices.getUserMedia = originalGetUserMedia;
            }, 2000);

        } catch (error) {
            console.error("Failed to start conversation:", error);
        }
    };

    const stopConversation = async () => {
        // Set reportStatus FIRST, before ending session
        // This ensures onEndCall's refetch sees 'generating' status
        if (interviewId) {
            try {
                const interviewRef = doc(db, 'interviews', interviewId);
                await updateDoc(interviewRef, { reportStatus: 'generating' });
                console.log("ReportStatus set to 'generating' for interview:", interviewId);
            } catch (err) {
                console.error("Failed to set reportStatus:", err);
            }
        }

        await conversation.endSession();

        // Clean up stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (onEndCall) onEndCall();
    };

    // Leave session without generating report (emergency exit)
    const leaveSession = async () => {
        console.log("Leaving session without generating report...");

        // Set flag so onDisconnect skips report generation
        isLeavingRef.current = true;

        await conversation.endSession();

        // Clean up stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        // Handle Firestore cleanup
        const currentInterviewId = interviewIdRef.current;
        if (currentInterviewId) {
            try {
                // If this interview has a parent (it's a followup), update parent's childId to null
                if (parentId) {
                    console.log("Updating parent interview to remove child reference...");
                    await updateDoc(doc(db, 'interviews', parentId), {
                        childId: null
                    });
                }

                // Delete this interview document
                await deleteDoc(doc(db, 'interviews', currentInterviewId));
                console.log("Deleted abandoned interview:", currentInterviewId);
            } catch (err) {
                console.error("Failed to cleanup interview on leave:", err);
            }
        }

        // Navigate to home (callback handles state updates)
        if (onLeaveSession) {
            onLeaveSession();
        } else if (onEndCall) {
            onEndCall(); // Fallback
        }
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
                            <Clock className={`w-3 h-3 ${remainingStyle.iconColor} ${remainingStyle.pulse ? 'animate-pulse' : ''}`} />
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</span>
                            <span className={`font-mono text-sm font-bold ${remainingStyle.color} ${remainingStyle.pulse ? 'animate-pulse' : ''}`}>
                                {formatTimeLeft(durationSeconds)}
                            </span>
                        </div>

                        {/* Divider */}
                        <div className="w-px h-4 bg-gray-300/50" />

                        {/* Leave Session (subtle exit) */}
                        <button
                            onClick={leaveSession}
                            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
                            title="Leave without saving"
                        >
                            <LogOut className="w-3 h-3" />
                            <span className="font-medium">Leave</span>
                        </button>
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
