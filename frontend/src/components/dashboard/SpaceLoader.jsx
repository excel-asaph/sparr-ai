import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ShimmeringText from '../ui/ShimmeringText';

const SpaceLoader = ({ session, onComplete }) => {
    // Dynamic text sequence based on context
    const getLoadingSequence = () => {
        if (!session) return ["Initializing...", "Preparing your workspace..."];

        const role = session.jobContext?.role || "Interview";
        const company = session.jobContext?.company || "Company";

        return [
            "Loading interview context...",
            "Preparing your space...",
            "Finalizing workspace..."
        ];
    };

    const [messages] = useState(getLoadingSequence());
    const [currentIndex, setCurrentIndex] = useState(0);

    // Cycle through messages
    useEffect(() => {
        const stepDuration = 2000; // ms per message
        const totalSteps = messages.length;

        const interval = setInterval(() => {
            setCurrentIndex(prev => {
                if (prev < totalSteps - 1) return prev + 1;
                return prev;
            });
        }, stepDuration);

        // Complete after all messages are shown + buffer
        const totalTime = (totalSteps * stepDuration) + 500;
        const completeTimer = setTimeout(() => {
            onComplete?.();
        }, totalTime);

        return () => {
            clearInterval(interval);
            clearTimeout(completeTimer);
        };
    }, [messages, onComplete]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-gray-50 flex flex-col items-center justify-center font-sans"
        >
            <div className="h-12 flex items-center justify-center">
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
                        transition={{ duration: 0.8 }}
                    >
                        <ShimmeringText
                            text={messages[currentIndex]}
                            className="text-xl font-medium tracking-tight text-gray-900"
                            shimmerColor="#ffffff"
                            spread={3}
                            duration={2.5}
                        />
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default SpaceLoader;
