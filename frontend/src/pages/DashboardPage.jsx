/**
 * @fileoverview Main Dashboard Page Component
 * 
 * Central hub of the application containing tab-based navigation,
 * interview session management, and voice agent integration.
 * Orchestrates state between sidebar, content tabs, and interview panels.
 * 
 * @module pages/DashboardPage
 */

import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LeftSidebar from '../components/dashboard/LeftSidebar';
import VoiceOrb from '../components/dashboard/VoiceOrb';
import RightPanel from '../components/dashboard/RightPanel';
import ReportsTab from '../components/dashboard/ReportsTab';
import ShimmeringText from '../components/ui/ShimmeringText';
import { motion, AnimatePresence } from 'framer-motion';
import { PERSONAS, FLAG_TO_ELEVENLABS_LANG } from '../data/personas';
import HomeTab from '../components/dashboard/HomeTab';
import SpacesTab from '../components/dashboard/SpacesTab';
import ResumesView from '../components/dashboard/ResumesView';
import ProfileTab from '../components/dashboard/ProfileTab';



const DashboardPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { currentUser, logout } = useAuth(); // Access User and logout

    // --- State: Active Session Data ---
    // We initialize state from location.state (if coming from Landing Page)
    // allowing us to update it later when creating sessions internally.
    const [activeSession, setActiveSession] = useState(() => {
        const state = location.state || {};
        return {
            jobContext: state.jobContext,
            resumeContext: state.resumeContext,
            persona: state.persona,
            resumeFile: state.resumeFile,
            systemPrompt: state.systemPrompt,
            interviewId: state.interviewId,
            language: state.language
        };
    });

    // Extract convenient accessors
    // Robustness: Handle if persona is passed as just a name (Legacy/String fallback)
    const rawPersona = activeSession.persona;
    const persona = typeof rawPersona === 'string'
        ? PERSONAS.find(p => p.name === rawPersona) || { name: rawPersona, avatar: '', role: 'Interviewer' }
        : rawPersona;

    const role = activeSession.jobContext?.role || 'Candidate';
    const company = activeSession.jobContext?.company || 'Company';

    // --- UI State ---
    // Logic: Only auto-open Mock Interview if we have Context BUT NO saved ID (fresh from Landing)
    // If we have an ID, it implies we are returning or reloading (persisted) -> Go Home.
    const isFreshSession = activeSession.jobContext && !activeSession.interviewId;

    const [isLoading, setIsLoading] = useState(isFreshSession);
    const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);

    useEffect(() => {
        if (!isLoading) {
            setLoadingMsgIndex(0);
            return;
        }
        const interval = setInterval(() => {
            setLoadingMsgIndex(prev => (prev + 1) % 2);
        }, 2500);
        return () => clearInterval(interval);
    }, [isLoading]);
    const [activeTab, setActiveTab] = useState(isFreshSession ? 'mock-interview' : 'home');
    const [targetResumeUrl, setTargetResumeUrl] = useState(null);

    // Session duration timer for Interview Coach tips
    const [sessionDuration, setSessionDuration] = useState(0);

    useEffect(() => {
        let interval;
        if (activeTab === 'mock-interview') {
            // Auto-collapse sidebar for immersive experience
            setIsSidebarCollapsed(true);

            interval = setInterval(() => {
                setSessionDuration(prev => prev + 1);
            }, 1000);
        } else {
            setSessionDuration(0); // Reset when leaving interview
        }
        return () => clearInterval(interval);
    }, [activeTab]);

    // Durable Sidebar State
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('sidebarCollapsed');
            if (saved !== null) return JSON.parse(saved);
        }
        return false; // Default Expanded
    });

    // Persist Sidebar State
    useEffect(() => {
        localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed));
    }, [isSidebarCollapsed]);

    // --- State: Central Interview Store ---
    const [allInterviews, setAllInterviews] = useState([]);
    const [isFetchingInterviews, setIsFetchingInterviews] = useState(true);

    // Fetch all interviews once on mount (with debug logging)
    useEffect(() => {
        if (!currentUser) return; // Wait for Auth

        const fetchInterviews = async () => {
            try {
                const token = await currentUser.getIdToken();
                const res = await fetch('/api/interviews', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                const data = await res.json();

                if (data.interviews) {
                    setAllInterviews(data.interviews);
                }
            } catch (error) {
                console.error("Dashboard: Failed to fetch interviews:", error);
            } finally {
                setIsFetchingInterviews(false);
            }
        };

        fetchInterviews();
    }, [currentUser]); // Dep: currentUser

    // Guard against double-firing in StrictMode
    const hasInitiatedSave = useRef(false);

    // --- Effect: Initial Save (Landing Page Flow) ---
    useEffect(() => {
        // Condition: We have context (from Landing) BUT no ID yet. We must save it.
        // Also wait for currentUser to be available
        if (currentUser && activeSession.jobContext && activeSession.resumeContext && !activeSession.interviewId && !hasInitiatedSave.current) {
            console.log("Saving Initial Interview (Landing Page Flow)...");
            hasInitiatedSave.current = true;

            // IMPORTANT: Keep loading state until interview is created
            // This ensures VoiceOrb doesn't start before we have an interviewId

            const saveSession = async () => {
                try {
                    const token = await currentUser.getIdToken();
                    const formData = new FormData();
                    formData.append('jobContext', JSON.stringify(activeSession.jobContext));
                    formData.append('resumeContext', JSON.stringify(activeSession.resumeContext));
                    formData.append('persona', JSON.stringify(persona)); // Use processed persona
                    if (activeSession.resumeFile) {
                        formData.append('resume', activeSession.resumeFile);
                    }

                    const res = await fetch('/api/interviews', {
                        method: 'POST',
                        body: formData,
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await res.json();

                    if (data.interviewId) {
                        console.log("Initial Save Complete. ID:", data.interviewId);
                        // Update state with ID so we don't save again
                        setActiveSession(prev => ({ ...prev, interviewId: data.interviewId }));

                        // Optimistically Helper
                        const newSession = {
                            id: data.interviewId,
                            jobContext: activeSession.jobContext,
                            resumeContext: data.resumeContext || activeSession.resumeContext, // Use backend context (has URL)
                            persona: persona,
                            createdAt: new Date().toISOString()
                        };
                        setAllInterviews(prev => [newSession, ...prev]);

                        // CRITICAL: Replace history state so Reload doesn't re-trigger creation
                        navigate('.', {
                            replace: true,
                            state: {
                                ...location.state,
                                interviewId: data.interviewId
                            }
                        });

                        // NOW it's safe to show the VoiceOrb
                        setIsLoading(false);
                    } else {
                        console.error("No interviewId returned from API");
                        setIsLoading(false);
                    }
                } catch (err) {
                    console.error("Background Save Failed:", err);
                    alert("Failed to initialize session. Please check if 'Anonymous Authentication' is enabled in your Firebase Console.");
                    setIsLoading(false);  // Stop loading even on error
                }
            };
            saveSession();

        } else if (!activeSession.systemPrompt && !activeSession.interviewId) {
            // No context? Just loading home.
            const timer = setTimeout(() => setIsLoading(false), 1000);
            return () => clearTimeout(timer);
        } else {
            // We have everything or are just viewing. Stop loading.
            setIsLoading(false);
        }
    }, [activeSession.jobContext, activeSession.resumeContext, activeSession.interviewId, activeSession.resumeFile, persona, currentUser]);


    // --- Effect: Sidebar Auto-Collapse (REMOVED: User controls persistence) ---
    // User requested peristent state + force collapse on specific actions only.


    // --- Handlers ---
    const handleEndCall = async () => {
        console.log("Call Ended. Generating Report...");

        // Switch to reports tab immediately
        setActiveTab('reports');

        // Refetch function for polling
        const refetchInterviews = async () => {
            try {
                const token = await currentUser?.getIdToken();
                const res = await fetch('/api/interviews', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.interviews) {
                    setAllInterviews(data.interviews);

                    // If any interview is still generating, poll again in 3 seconds
                    const stillGenerating = data.interviews.some(i => i.reportStatus === 'generating');
                    if (stillGenerating) {
                        setTimeout(refetchInterviews, 3000);
                    }
                }
            } catch (error) {
                console.error("Failed to refetch interviews:", error);
            }
        };

        // Start polling after initial delay
        setTimeout(refetchInterviews, 500);
    };

    const handleStartNewSession = async (sessionData) => {
        // Called from HomeTab Wizard
        console.log("Starting New Session from Home...", sessionData);
        setIsLoading(true);

        try {
            if (!currentUser) throw new Error("No user authenticated");
            const token = await currentUser.getIdToken();

            // 1. Persist to Backend Immediately
            const formData = new FormData();
            formData.append('jobContext', JSON.stringify(sessionData.jobContext));
            formData.append('resumeContext', JSON.stringify(sessionData.resumeContext));
            formData.append('persona', JSON.stringify(sessionData.persona));
            if (sessionData.resumeFile) formData.append('resume', sessionData.resumeFile);

            const res = await fetch('/api/interviews', {
                method: 'POST',
                body: formData,
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            console.log("Start Session Backend Response:", data);

            if (data.interviewId) {
                // 2. Update Active Session State
                setActiveSession({
                    ...sessionData,
                    interviewId: data.interviewId,
                    systemPrompt: sessionData.systemPrompt
                });


                // 3. Optimistically Update Recent List
                const newSession = {
                    id: data.interviewId,
                    jobContext: sessionData.jobContext,
                    resumeContext: data.resumeContext || sessionData.resumeContext, // Use backend context
                    persona: sessionData.persona,
                    createdAt: new Date().toISOString()
                };
                setAllInterviews(prev => [newSession, ...prev]);

                // 4. Switch View & Force Collapse Sidebar
                setActiveTab('mock-interview');
                setIsSidebarCollapsed(true);
            }
        } catch (err) {
            console.error("Failed to start session:", err);
            alert("Failed to start session. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartFollowupSession = async (sessionData) => {
        // Called from WorkflowBuilder (follow-up flow)
        console.log("Starting Follow-up Session...", sessionData);
        setIsLoading(true);

        try {
            if (!currentUser) throw new Error("No user authenticated");
            const token = await currentUser.getIdToken();

            // 1. Persist to Backend with parentId (backend handles linked list logic)
            const formData = new FormData();
            formData.append('jobContext', JSON.stringify(sessionData.jobContext));
            formData.append('resumeContext', JSON.stringify(sessionData.resumeContext));
            formData.append('persona', JSON.stringify(sessionData.persona));
            if (sessionData.parentId) {
                formData.append('parentId', sessionData.parentId);  // CRITICAL for linked list
            }

            const res = await fetch('/api/interviews', {
                method: 'POST',
                body: formData,
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.interviewId) {
                // 2. Update Active Session State
                setActiveSession({
                    ...sessionData,
                    interviewId: data.interviewId,
                    systemPrompt: sessionData.systemPrompt
                });

                // 3. CRITICAL: Update React State for Linked List
                const newFollowupInterview = {
                    id: data.interviewId,
                    parentId: sessionData.parentId,  // Links to parent
                    jobContext: sessionData.jobContext,
                    resumeContext: data.resumeContext || sessionData.resumeContext, // Use backend context
                    persona: sessionData.persona,
                    createdAt: new Date().toISOString()
                };

                setAllInterviews(prev => {
                    // Update parent interview to include childId
                    const updated = prev.map(interview =>
                        interview.id === sessionData.parentId
                            ? { ...interview, childId: data.interviewId }  // Add childId to parent
                            : interview
                    );
                    // Add new follow-up to the list
                    return [newFollowupInterview, ...updated];
                });

                // 4. Switch View & Force Collapse Sidebar
                setActiveTab('mock-interview');
                setIsSidebarCollapsed(true);
            }
        } catch (err) {
            console.error("Failed to start follow-up session:", err);
            alert("Failed to start follow-up. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteInterview = async (interviewId, isCascade) => {
        try {
            if (!currentUser) return;
            const token = await currentUser.getIdToken();

            // Optimistic update
            const sessionToDelete = allInterviews.find(s => s.id === interviewId);
            if (!sessionToDelete) return;

            // Remove from local state
            setAllInterviews(prev => {
                if (isCascade) {
                    // Remove session AND all its children (forward chain)
                    const idsToRemove = new Set([interviewId]);

                    // Traverse Down to find all children
                    let currentId = sessionToDelete.childId;
                    let maxDepth = 0;
                    while (currentId && maxDepth < 20) {
                        idsToRemove.add(currentId);
                        const child = prev.find(p => p.id === currentId);
                        if (!child) break;
                        currentId = child.childId;
                        maxDepth++;
                    }

                    // Traverse Up to find all parents - Wait, cascading delete shouldn't delete parents unless explicitly requested?
                    // User requirement was "Linked Interview Warning & Cascade Delete".
                    // Usually "cascade" means delete children. Backend does cascade children AND parents logic?
                    // Let's match existing logic I wrote before:
                    // "Updated handleDeleteInterview... to traverse both down (children) and up (parents)"
                    // So yes, remove the whole chain.

                    let prevId = sessionToDelete.parentId;
                    maxDepth = 0;
                    while (prevId && maxDepth < 20) {
                        idsToRemove.add(prevId);
                        const parent = prev.find(p => p.id === prevId);
                        if (!parent) break;
                        prevId = parent.parentId;
                        maxDepth++;
                    }
                    return prev.filter(s => !idsToRemove.has(s.id));
                }
                return prev.filter(s => s.id !== interviewId);
            });

            // API Call
            await fetch(`http://localhost:3000/api/interviews/${interviewId}?cascade=${isCascade}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

        } catch (error) {
            console.error("Delete failed:", error);
            alert("Failed to delete session.");
        }
    };


    if (isLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-white">
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={loadingMsgIndex}
                        initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
                        transition={{ duration: 0.8 }}
                    >
                        <ShimmeringText
                            text={["Setting up interview...", "Preparing interview window..."][loadingMsgIndex]}
                            className="text-xl font-medium tracking-tight text-gray-900"
                            shimmerColor="#ffffff"
                            spread={3}
                            duration={2.5}
                        />
                    </motion.div>
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full bg-gray-100 p-2 gap-2 overflow-hidden font-sans">
            {/* 1. Left Sidebar */}
            <LeftSidebar
                isCollapsed={isSidebarCollapsed}
                setIsCollapsed={setIsSidebarCollapsed}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />

            {/* 2. Main Content Canvas */}
            <main className="flex-1 relative flex flex-col overflow-hidden">
                {/* Header (Floating) */}
                <AnimatePresence mode='wait'>
                    {activeTab === 'mock-interview' && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="absolute top-8 left-8 z-10 pointer-events-none"
                        >
                            <h1 className="text-2xl font-bold text-gray-800">Mock Interview</h1>
                            <p className="text-sm text-gray-400 font-medium mt-1">
                                {role} <span className="text-gray-300 mx-2">•</span> {typeof company === 'string' ? company : company?.name || 'Company'}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Content Area */}
                <div className="flex-1 flex items-center justify-center relative w-full h-full">
                    {activeTab === 'home' ? (
                        <HomeTab
                            onStartSession={handleStartNewSession}
                            recentSessions={allInterviews}
                            isLoadingRecent={isFetchingInterviews}
                            onNavigateToSpaces={() => setActiveTab('spaces')}
                            onNavigateToResumes={() => setActiveTab('resumes')}
                            onNavigateToReports={() => setActiveTab('reports')}
                        />
                    ) : activeTab === 'mock-interview' ? (
                        <VoiceOrb
                            isActive={true}
                            onEndCall={handleEndCall}
                            onLeaveSession={() => {
                                const interviewIdToRemove = activeSession.interviewId;
                                const parentIdToUpdate = activeSession.parentId;

                                setAllInterviews(prev => {
                                    // First, remove the abandoned interview
                                    let updated = prev.filter(i => i.id !== interviewIdToRemove);

                                    // If this was a followup, update parent's childId to null
                                    if (parentIdToUpdate) {
                                        updated = updated.map(i =>
                                            i.id === parentIdToUpdate
                                                ? { ...i, childId: null }
                                                : i
                                        );
                                    }

                                    return updated;
                                });

                                setActiveTab('home');
                            }}
                            systemPrompt={activeSession.systemPrompt}
                            voiceId={persona?.voiceId}
                            language={FLAG_TO_ELEVENLABS_LANG[activeSession.language] || 'en'}
                            interviewId={activeSession.interviewId}
                            parentId={activeSession.parentId}
                            previousInterview={activeSession.parentId ? allInterviews.find(i => i.id === activeSession.parentId) : null}
                            jobContext={activeSession.jobContext}
                            persona={persona}
                            currentUser={currentUser}
                        />


                    ) : activeTab === 'reports' ? (
                        <ReportsTab
                            interviews={allInterviews}
                            onNavigateToResumes={(context) => {
                                if (context?.storageUrl) setTargetResumeUrl(context.storageUrl);
                                setActiveTab('resumes');
                            }}
                        />
                    ) : activeTab === 'spaces' ? (
                        <SpacesTab
                            allInterviews={allInterviews}
                            onStartSession={handleStartFollowupSession}
                            onOpenWorkflow={() => setIsSidebarCollapsed(true)}
                            onDeleteInterview={handleDeleteInterview}
                            onNavigateToResumes={(context) => {
                                if (context?.storageUrl) setTargetResumeUrl(context.storageUrl);
                                setActiveTab('resumes');
                            }}
                        />
                    ) : activeTab === 'resumes' ? (
                        <ResumesView
                            interviews={allInterviews}
                            initialSelectedUrl={targetResumeUrl}
                        />
                    ) : activeTab === 'profile' ? (
                        <ProfileTab
                            interviews={allInterviews}
                            onSignOut={async () => {
                                try {
                                    await logout();
                                    navigate('/login');
                                } catch (error) {
                                    console.error('Error signing out:', error);
                                    // Still navigate even if there's an error
                                    navigate('/login');
                                }
                            }}
                        />
                    ) : (
                        <div className="text-center text-gray-400">
                            <h2 className="text-xl font-semibold">Section Under Construction</h2>
                            <p>You can go back to Home</p>
                        </div>
                    )}
                </div>
            </main>

            {/* 3. Right Sidebar */}
            <AnimatePresence>
                {activeTab === 'mock-interview' && (
                    <motion.div
                        initial={{ x: 320, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 320, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    >
                        <RightPanel
                            persona={persona}
                            company={company}
                            jobVariant={activeSession.jobContext?.variant}
                            selectedLanguage={activeSession.language}
                            sessionDuration={sessionDuration}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DashboardPage;
