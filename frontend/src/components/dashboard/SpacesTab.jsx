import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Layers, LayoutGrid, Calendar, Clock, ArrowRight, User } from 'lucide-react';
import { PERSONAS } from '../../data/personas';
import WorkflowBuilder from './WorkflowBuilder';
import SpaceLoader from './SpaceLoader';
import { Trash2 } from 'lucide-react';
import DeleteConfirmationModal from './DeleteConfirmationModal';

const SpacesTab = ({ allInterviews = [], onStartSession, onOpenWorkflow, onDeleteInterview, onNavigateToResumes }) => { // Expecting allInterviews passed from Dashboard
    // State
    const [searchQuery, setSearchQuery] = useState('');
    const [groupBy, setGroupBy] = useState('none'); // 'none', 'company', 'role'

    const [selectedInterview, setSelectedInterview] = useState(null); // For Workflow
    const [pendingSession, setPendingSession] = useState(null); // For Loader
    const [interviewToDelete, setInterviewToDelete] = useState(null); // Deletion Modal State
    const [isLoadingSpace, setIsLoadingSpace] = useState(false); // Loader State


    // --- Helpers ---
    const getGradient = (str) => {
        const colors = [
            'from-blue-500 to-indigo-600',
            'from-purple-500 to-pink-600',
            'from-green-500 to-teal-600',
            'from-orange-500 to-red-600',
            'from-cyan-500 to-blue-600'
        ];
        let hash = 0;
        for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };

    const getRelativeTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}h`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
        return date.toLocaleDateString();
    };



    // --- Chain Logic ---
    // Identify the "Active" card for each conversation thread (the latest one)
    const activeChains = useMemo(() => {
        const sessionMap = new Map(allInterviews.map(s => [s.id, s]));
        const parentIds = new Set(allInterviews.map(s => s.parentId).filter(Boolean));

        // Leaves are sessions that are NOT parents -> The latest in their chain
        const leaves = allInterviews.filter(s => !parentIds.has(s.id));

        return leaves.map(leaf => {
            let depth = 1;
            let curr = leaf;
            while (curr.parentId && sessionMap.get(curr.parentId)) {
                depth++;
                curr = sessionMap.get(curr.parentId);
            }
            return {
                ...leaf,
                stage: depth,
                isSpace: depth > 1,
                rootId: curr.id
            };
        });
    }, [allInterviews]);

    // --- Filter Logic ---
    const [viewFilter, setViewFilter] = useState('all'); // 'all', 'spaces', 'single'

    const filteredInterviews = useMemo(() => {
        return activeChains.filter(session => {
            const matchesSearch = !searchQuery || [
                session.jobContext?.company,
                session.jobContext?.role,
                session.jobContext?.level,
                (typeof session.persona === 'string' ? session.persona : session.persona?.name)
            ].some(field => field?.toLowerCase().includes(searchQuery.toLowerCase()));

            // View Filter
            const matchesView = viewFilter === 'all'
                ? true
                : viewFilter === 'spaces'
                    ? session.isSpace
                    : !session.isSpace; // single

            return matchesSearch && matchesView;
        });
    }, [activeChains, searchQuery, viewFilter]);

    // --- Grouping Logic ---
    const groupedInterviews = useMemo(() => {
        if (groupBy === 'none') return { 'All Sessions': filteredInterviews };

        return filteredInterviews.reduce((acc, session) => {
            const key = groupBy === 'company'
                ? (session.jobContext?.company || 'Other')
                : (session.jobContext?.role || 'Other');

            if (!acc[key]) acc[key] = [];
            acc[key].push(session);
            return acc;
        }, {});
    }, [filteredInterviews, groupBy]);

    // --- Render Card ---
    const renderCard = (session) => {
        const gradient = getGradient(session.jobContext?.company || 'default');
        const interviewerName = typeof session.persona === 'string' ? session.persona : (session.persona?.name || 'Sarah');
        let interviewer = PERSONAS.find(p => p.name === interviewerName);
        if (!interviewer) interviewer = { name: interviewerName, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' };

        const isChainHead = session.parentId && !session.childId; // Latest in chain
        const isChainMiddle = session.childId; // Has follow-up

        return (
            <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                key={session.id}
                onClick={() => {
                    if (!isChainMiddle) {
                        setPendingSession(session);
                        setIsLoadingSpace(true);
                        // Original logic moved to onComplete of loader
                    }
                }}
                className={`group min-h-[200px] bg-[#1a1a1a] rounded-2xl relative overflow-hidden mb-3 shadow-lg border transition-all p-6 flex flex-col justify-between 
                    ${isChainMiddle ? 'border-dashed border-gray-700 opacity-60 cursor-not-allowed grayscale-[0.5]' : 'border-white/5 hover:border-white/20 cursor-pointer'}`}
            >
                {/* Background Gradient */}
                <div className={`absolute top-0 right-0 w-[80%] h-full bg-gradient-to-l ${gradient} opacity-10 blur-3xl rounded-full pointer-events-none translate-x-1/2`} />

                {/* Top: Metadata */}
                <div className="relative z-10 w-full">
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="font-bold text-white text-xl tracking-tight leading-none mb-1">{session.jobContext?.company}</h4>
                            <p className="text-xs font-semibold text-gray-400 mb-2 truncate max-w-[150px]">{session.jobContext?.role}</p>
                        </div>
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                setInterviewToDelete(session);
                            }}
                            className="group/time relative overflow-hidden"
                            title="Delete Session"
                        >
                            <span className="text-[10px] font-bold text-gray-500 bg-white/5 px-2 py-1 rounded-lg group-hover/time:opacity-0 transition-opacity">
                                {getRelativeTime(session.createdAt)}
                            </span>
                            <div className="absolute inset-0 flex items-center justify-center bg-red-500/10 rounded-lg opacity-0 group-hover/time:opacity-100 transition-opacity cursor-pointer border border-red-500/20">
                                <Trash2 className="w-3 h-3 text-red-500" />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] uppercase tracking-wider font-bold text-gray-400 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full">
                            {session.jobContext?.level}
                        </span>
                        {session.isSpace && (
                            <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Layers className="w-2 h-2" /> Stage {session.stage}
                            </span>
                        )}
                        {!session.isSpace && (
                            <span className="text-[9px] uppercase tracking-wider font-bold text-gray-500 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full">
                                Single
                            </span>
                        )}
                    </div>
                </div>

                {/* Center Visuals (Simplified for Spaces) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full flex items-center justify-center opacity-40 group-hover:opacity-60 transition-opacity">
                    <div className="w-24 h-12 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12" />
                </div>

                {/* Bottom: Interviewer & Status */}
                <div className="relative z-10 flex justify-between items-end mt-auto w-full">
                    <div className="flex items-center gap-2 pointer-events-none">
                        <div className="flex items-center gap-2">
                            <div className="bg-white/5 p-1.5 rounded-lg border border-white/5">
                                <ArrowRight className="w-3 h-3 text-white opacity-50 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <span className="text-[10px] text-gray-500 font-medium group-hover:text-gray-300 transition-colors">
                                {session.isSpace ? 'Continue Space' : 'Open Interview'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-right hidden group-hover:block transition-all duration-300">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Interviewer</p>
                            <p className="text-xs font-semibold text-white">{interviewer.name}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 p-0.5 ring-2 ring-black relative">
                            <img src={interviewer.avatar} alt={interviewer.name} className="w-full h-full rounded-full object-cover" />
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    };



    // --- Main View ---

    // 1. Transition Loader
    if (isLoadingSpace && pendingSession) {
        return (
            <AnimatePresence>
                <SpaceLoader
                    session={pendingSession}
                    onComplete={() => {
                        setIsLoadingSpace(false);
                        setSelectedInterview(pendingSession);
                        setPendingSession(null);
                        onOpenWorkflow?.();
                    }}
                />
            </AnimatePresence>
        );
    }

    // 2. Workflow View
    if (selectedInterview) {
        return (
            <WorkflowBuilder
                sourceInterview={selectedInterview}
                onClose={() => setSelectedInterview(null)}
                onStartSession={onStartSession}
                allInterviews={allInterviews}
                onNavigateToResumes={onNavigateToResumes}
            />
        );
    }

    return (
        <div className="h-full w-full p-8 overflow-y-auto relative">
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Spaces</h1>
                    <p className="text-gray-500 mt-1">Manage and continue your interview sessions.</p>

                    {/* Primary View Filters */}
                    <div className="flex items-center gap-1 mt-6 bg-gray-100 p-1 rounded-xl w-fit">
                        {['all', 'spaces', 'single'].map(filter => (
                            <button
                                key={filter}
                                onClick={() => setViewFilter(filter)}
                                className={`px-4 py-1.5 rounded-lg text-sm font-bold capitalize transition-all ${viewFilter === filter
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                                    }`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="flex items-center gap-3">

                    {/* Filters */}
                    <div className="flex items-center gap-2">
                        {/* Filters Removed */}
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white border border-gray-200 pl-10 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-[180px] transition-all shadow-sm"
                        />
                    </div>

                    {/* View Toggles */}
                    <div className="bg-white border border-gray-200 p-1 rounded-xl flex items-center shadow-sm">
                        <button
                            onClick={() => setGroupBy('none')}
                            className={`p-1.5 rounded-lg transition-all ${groupBy === 'none' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Grid View"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setGroupBy('company')}
                            className={`p-1.5 rounded-lg transition-all ${groupBy === 'company' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Group by Company"
                        >
                            <Layers className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setGroupBy('role')}
                            className={`p-1.5 rounded-lg transition-all ${groupBy === 'role' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Group by Role"
                        >
                            <User className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Content Grid */}
            <div className="space-y-8 pb-24">
                {Object.entries(groupedInterviews).map(([groupTitle, sessions]) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={groupTitle}
                    >
                        {groupBy !== 'none' && (
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                {groupBy === 'company' ? <Layers className="w-4 h-4 text-gray-400" /> : <User className="w-4 h-4 text-gray-400" />}
                                {groupTitle}
                                <span className="text-xs font-normal text-gray-400 ml-2">({sessions.length})</span>
                            </h3>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {sessions.map(renderCard)}
                        </div>
                    </motion.div>
                ))}

                {filteredInterviews.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <Search className="w-12 h-12 mb-4 opacity-20" />
                        <p className="text-lg font-medium">No spaces found</p>
                        <p className="text-sm">Try adjusting your search filters.</p>
                    </div>
                )}
            </div>


            {/* Delete Confirmation Modal (Overlay) */}
            <AnimatePresence>
                {interviewToDelete && (
                    <DeleteConfirmationModal
                        interview={interviewToDelete}
                        isDeleting={false} // Loading state can be added if needed
                        onConfirm={() => {
                            const isSpace = interviewToDelete.isSpace || interviewToDelete.childId || interviewToDelete.parentId;
                            onDeleteInterview(interviewToDelete.id, isSpace);
                            setInterviewToDelete(null);
                        }}
                        onCancel={() => setInterviewToDelete(null)}
                    />
                )}
            </AnimatePresence>
        </div >
    );
};

export default SpacesTab;
