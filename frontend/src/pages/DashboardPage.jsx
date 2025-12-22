import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import LeftSidebar from '../components/dashboard/LeftSidebar';
import VoiceOrb from '../components/dashboard/VoiceOrb';
import RightPanel from '../components/dashboard/RightPanel';
import SparrLoader from '../components/SparrLoader';
import { motion, AnimatePresence } from 'framer-motion';
import { PERSONAS } from '../data/personas';

const DashboardPage = () => {
    const location = useLocation();
    const {
        // Context from LandingPage
        jobContext,
        resumeContext,
        persona: rawPersona, // Rename to raw to handle processing
        resumeFile, // Parsed from State

        // Agent Brain
        systemPrompt,

        // If coming from history
        interviewId: existingInterviewId
    } = location.state || {};

    // Robustness: Handle if persona is passed as just a name (Legacy/String fallback)
    const persona = typeof rawPersona === 'string'
        ? PERSONAS.find(p => p.name === rawPersona) || { name: rawPersona, avatar: '', role: 'Interviewer' }
        : rawPersona;

    // DEBUG: Verify Data Flow
    console.log("Dashboard Loaded. Context:", {
        jobContext,
        resumeContext,
        persona,
        systemPrompt: systemPrompt ? "Loaded" : "Missing",
        resumeFile: resumeFile ? "Present" : "Missing"
    });

    // Extract primitive values for UI rendering
    const role = jobContext?.role || 'Candidate';
    const company = jobContext?.company || 'Company';

    const [interviewId, setInterviewId] = useState(existingInterviewId || null);
    const [isLoading, setIsLoading] = useState(!systemPrompt && !existingInterviewId); // Load if no data
    const [activeTab, setActiveTab] = useState('mock-interview');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

    // Guard against double-firing in StrictMode
    const hasInitiatedSave = useRef(false);

    // Initial Load & Background Persistence
    useEffect(() => {
        // If we have an ID, we are just viewing.
        if (existingInterviewId) {
            setIsLoading(false);
            return;
        }

        // If no ID but we have Context, we need to SAVE (Background Process)
        if (jobContext && resumeContext && persona && !interviewId && !hasInitiatedSave.current) {
            console.log("Saving Interview in Background...");
            hasInitiatedSave.current = true; // Mark as started

            // Note: We don't block UI here. VoiceOrb can start if systemPrompt exists.
            setIsLoading(false);

            // Construct FormData for File Upload + Data
            const formData = new FormData();
            formData.append('jobContext', JSON.stringify(jobContext));
            formData.append('resumeContext', JSON.stringify(resumeContext));
            formData.append('persona', JSON.stringify(persona));

            // Append file if present in state
            if (resumeFile) {
                formData.append('resume', resumeFile);
            }

            fetch('/api/interviews', {
                method: 'POST',
                // No Content-Type header needed; fetch sets it for FormData automatically
                body: formData
            })
                .then(res => res.json())
                .then(data => {
                    if (data.interviewId) {
                        console.log("Background Save & Upload Complete. ID:", data.interviewId);
                        setInterviewId(data.interviewId);
                    }
                })
                .catch(err => console.error("Background Save Failed:", err));
        } else {
            // Fallback if accessed directly without state
            const timer = setTimeout(() => setIsLoading(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [existingInterviewId, jobContext, resumeContext, persona, resumeFile, interviewId]);

    // Initial Load Effect
    useEffect(() => {
        // Simulate AI gathering content
        const timer = setTimeout(() => {
            setIsLoading(false);
            // Default to collapsed sidebar for mock interview view
            setIsSidebarCollapsed(true);
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    // Effect to auto-collapse/expand sidebar based on tab
    useEffect(() => {
        if (activeTab === 'mock-interview') {
            setIsSidebarCollapsed(true);
        } else {
            setIsSidebarCollapsed(false); // Open for other tabs usually
        }
    }, [activeTab]);

    if (isLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-white">
                <SparrLoader text="AI is gathering interview context..." subtext="Analyzing persona, role, and requirements" />
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full bg-white overflow-hidden font-sans">
            {/* 1. Left Sidebar */}
            <LeftSidebar
                isCollapsed={isSidebarCollapsed}
                setIsCollapsed={setIsSidebarCollapsed}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />

            {/* 2. Main Content Canvas */}
            <main className="flex-1 relative flex flex-col bg-gray-50/30">
                {/* Header / Top Bar (Optional, can be added later) */}
                <div className="absolute top-6 left-6 z-10">
                    <h1 className="text-2xl font-bold text-gray-800">Mock Interview</h1>
                    <p className="text-sm text-gray-500">
                        {role || 'Software Engineer'} @ {typeof company === 'string' ? company : company?.name || 'Company'}
                    </p>
                </div>

                {/* Content switching based on activeTab */}
                <div className="flex-1 flex items-center justify-center relative">
                    {activeTab === 'mock-interview' ? (
                        <VoiceOrb
                            isActive={true}
                            onEndCall={() => console.log('End Call')}
                            systemPrompt={systemPrompt} // Wire the Brain
                        />
                    ) : (
                        <div className="text-center text-gray-400">
                            <h2 className="text-xl font-semibold">Section Under Construction</h2>
                            <p>You can go back to Mock Interview</p>
                        </div>
                    )}
                </div>
            </main>

            {/* 3. Right Sidebar (Only visible in Mock Interview for now) */}
            <AnimatePresence>
                {activeTab === 'mock-interview' && (
                    <motion.div
                        initial={{ x: 320, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 320, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    >
                        {/* 3. Right Stats Panel */}
                        <RightPanel
                            persona={persona}
                            company={company}
                            jobVariant={jobContext?.variant}
                            languages={['us', 'es', 'de']} // Placeholder for now
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DashboardPage;
