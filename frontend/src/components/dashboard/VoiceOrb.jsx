import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, PhoneOff, Settings2 } from 'lucide-react';

// ElevenLabs Integration
import { useConversation } from '@elevenlabs/react';

const VoiceOrb = ({ isActive, onEndCall, systemPrompt }) => {
    // 1. ElevenLabs Hook
    const conversation = useConversation({
        onConnect: () => console.log("Connected to ElevenLabs"),
        onDisconnect: () => console.log("Disconnected from ElevenLabs"),
        onMessage: (message) => console.log("Agent Message:", message),
        onError: (error) => console.error("ElevenLabs Error:", error),
    });

    const { status, isSpeaking } = conversation;

    // Mapped status for UI
    const isConnected = status === 'connected';
    const isConnecting = status === 'connecting';

    // 2. Start/End Logic
    const startConversation = async () => {
        try {
            // Request microphone permission
            await navigator.mediaDevices.getUserMedia({ audio: true });

            // Start the session with overrides
            await conversation.startSession({
                agentId: import.meta.env.VITE_ELEVENLABS_AGENT_ID, // Must be set in .env
                // authorization: {}, // Removed: Use Public Agent or Proxy if needed, empty object might cause issues
                overrides: {
                    agent: {
                        prompt: {
                            prompt: systemPrompt || "You are a helpful interviewer."
                        },
                        firstMessage: "Hello! I've reviewed your application. Ready to begin?"
                    }
                }
            });
        } catch (error) {
            console.error("Failed to start conversation:", error);
            alert("Microphone access denied or connection failed.");
        }
    };

    const stopConversation = async () => {
        await conversation.endSession();
        if (onEndCall) onEndCall();
    };

    // Auto-start conversation when component mounts and prompt is ready
    useEffect(() => {
        if (isActive && systemPrompt && status === 'disconnected') {
            startConversation();
        }
    }, [isActive, systemPrompt, status]);

    return (
        <div className="flex-1 flex flex-col items-center justify-center relative p-8">
            {/* Orb Container */}
            <div className="relative w-64 h-64 flex items-center justify-center">
                {/* Outer Glows - Pulse when speaking */}
                {[1, 2, 3].map((layer) => (
                    <motion.div
                        key={layer}
                        animate={{
                            scale: isSpeaking ? [1, 1 + (0.5 * layer), 1] : 1,
                            opacity: isSpeaking ? [0.3, 0.1, 0.3] : 0.1,
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: layer * 0.2
                        }}
                        className={`absolute inset-0 rounded-full blur-2xl z-0 ${isConnected ? 'bg-blue-500' : 'bg-gray-400'}`}
                    />
                ))}

                {/* Core Orb */}
                <div
                    onClick={isConnected ? null : startConversation}
                    className={`z-10 w-48 h-48 rounded-full shadow-2xl flex items-center justify-center relative overflow-hidden group cursor-pointer transition-all duration-500 ${isConnected
                        ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700'
                        : 'bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 hover:scale-105'}`}
                >
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 animate-spin-slow"></div>

                    {/* Inner Mic Icon / Spinner */}
                    {isConnecting ? (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                            className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full"
                        />
                    ) : (
                        <Mic className={`w-16 h-16 text-white/90 drop-shadow-lg ${!isConnected && 'opacity-50'}`} />
                    )}

                    {/* Active State Ring */}
                    {isConnected && (
                        <motion.div
                            className="absolute inset-0 border-4 border-white/20 rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        />
                    )}
                </div>
            </div>

            {/* Status Text */}
            <motion.div
                className="mt-12 text-center space-y-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <h2 className="text-2xl font-bold text-gray-800">
                    {isConnecting ? "Connecting..." : (isConnected ? "Listening..." : "Tap Orb to Start")}
                </h2>
                <p className="text-gray-500">
                    {isConnected ? "Speak clearly to answer the question" : "System Ready. Initializing connection..."}
                </p>
            </motion.div>

            {/* Controls */}
            <div className="absolute bottom-12 flex items-center gap-6">
                <button className="p-4 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all shadow-sm">
                    <MicOff className="w-6 h-6" />
                </button>

                <button
                    onClick={stopConversation}
                    className="p-6 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all shadow-lg hover:shadow-red-500/40 transform hover:scale-105"
                >
                    <PhoneOff className="w-8 h-8" />
                </button>

                <button className="p-4 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all shadow-sm">
                    <Settings2 className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};

export default VoiceOrb;
