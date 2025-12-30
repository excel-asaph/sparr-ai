import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ShimmeringText from '../ui/ShimmeringText';
import { Sparkles } from 'lucide-react';

const ReportLoader = ({ session, onComplete }) => {
    // Dynamic text sequence for report generation
    const getLoadingSequence = () => {
        const role = session?.jobContext?.role || session?.role || "the role";
        const agentName = session?.agent?.name || session?.persona?.name || "your interviewer";

        return [
            "Analyzing your interview performance...",
            `Evaluating responses for ${role}...`,
            "Identifying key moments and highlights...",
            "Generating personalized feedback...",
            `${agentName} is preparing your insights...`,
            "Almost ready..."
        ];
    };

    const [messages] = useState(getLoadingSequence());
    const [currentIndex, setCurrentIndex] = useState(0);

    // Cycle through messages every 2.5 seconds
    useEffect(() => {
        const stepDuration = 2500;
        const totalSteps = messages.length;

        const interval = setInterval(() => {
            setCurrentIndex(prev => {
                if (prev < totalSteps - 1) return prev + 1;
                // Loop back to keep animating while waiting
                return 0;
            });
        }, stepDuration);

        return () => clearInterval(interval);
    }, [messages]);

    // Listen for when report becomes available (passed via onComplete)
    // This is a visual-only loader - the actual completion is handled by parent

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center py-20 px-8"
        >
            {/* Shimmer Text */}
            <div className="h-8 flex items-center justify-center">
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -15, filter: 'blur(8px)' }}
                        transition={{ duration: 0.6 }}
                    >
                        <ShimmeringText
                            text={messages[currentIndex]}
                            className="text-lg font-medium tracking-tight text-gray-700"
                            shimmerColor="#ffffff"
                            spread={3}
                            duration={2}
                        />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Progress Dots */}
            <div className="flex gap-1.5 mt-6">
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.4, 1, 0.4]
                        }}
                        transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            delay: i * 0.2
                        }}
                        className="w-1.5 h-1.5 rounded-full bg-gray-400"
                    />
                ))}
            </div>
        </motion.div>
    );
};

export default ReportLoader;
