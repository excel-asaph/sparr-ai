import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Calendar, FileText, BarChart2, GitCommit, PlayCircle } from 'lucide-react';
import { buildHistoryChain } from '../../utils/historyUtils';
import ReportDetail from './ReportDetail';
import ProgressDashboard from './ProgressDashboard';

const HistoryExplorer = ({ currentSessionId, onClose, allInterviews }) => {
    const [history, setHistory] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [jumpValue, setJumpValue] = useState('1'); // Local state for input

    // Initialize Real History Chain
    useEffect(() => {
        if (currentSessionId && allInterviews?.length > 0) {
            const data = buildHistoryChain(currentSessionId, allInterviews);
            setHistory(data);

            // Default to the Current (Latest) session
            setSelectedIndex(data.length - 1);
            setSelectedSession(data[data.length - 1]);
        }
    }, [currentSessionId, allInterviews]);

    const handleSelect = (index) => {
        if (index >= 0 && index < history.length) {
            setSelectedIndex(index);
            setSelectedSession(history[index]);
            setJumpValue(String(index + 1)); // Sync input
        }
    };

    // Update jumpValue when selectedIndex changes externally (e.g. Next/Prev buttons)
    useEffect(() => {
        setJumpValue(String(selectedIndex + 1));
    }, [selectedIndex]);

    const handleJumpInput = (e) => {
        setJumpValue(e.target.value);
    };

    const handleJumpCommit = (e) => {
        if (e.key === 'Enter') {
            const val = parseInt(jumpValue);
            if (!isNaN(val) && val >= 1 && val <= history.length) {
                handleSelect(val - 1);
            } else {
                setJumpValue(String(selectedIndex + 1)); // Reset on invalid
            }
        }
    };

    // Also commit on blur
    const handleJumpBlur = () => {
        const val = parseInt(jumpValue);
        if (!isNaN(val) && val >= 1 && val <= history.length) {
            handleSelect(val - 1);
        } else {
            setJumpValue(String(selectedIndex + 1));
        }
    };

    const isCurrent = selectedIndex === history.length - 1;
    const [viewMode, setViewMode] = useState('progress'); // 'progress' or 'report'

    // Reset view mode when selection changes
    useEffect(() => {
        if (isCurrent) setViewMode('progress');
        else setViewMode('report');
    }, [selectedIndex, isCurrent]);

    if (!selectedSession) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-4 z-[9999] bg-white rounded-3xl shadow-2xl flex border border-gray-200 overflow-hidden"
        >
            {/* LEFT SIDEBAR: Timeline Navigation */}
            <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <GitCommit className="text-blue-600 w-5 h-5" />
                            History
                        </h2>
                        <input
                            type="text"
                            placeholder="#"
                            className="w-16 px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-mono"
                            onChange={handleJumpInput}
                            onKeyDown={handleJumpCommit}
                            onBlur={handleJumpBlur}
                            value={jumpValue}
                        />
                    </div>
                    <p className="text-xs text-gray-500">
                        Chain of {history.length} interviews linked.
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {history.map((session, idx) => {
                        const isSelected = selectedIndex === idx;
                        const isHead = idx === history.length - 1;

                        return (
                            <div key={session.id} className="relative">
                                {/* Vertical Line Connector */}
                                {idx < history.length - 1 && (
                                    <div className="absolute left-6 top-10 bottom-[-18px] w-0.5 bg-gray-200 z-0" />
                                )}

                                <button
                                    onClick={() => handleSelect(idx)}
                                    className={`relative z-10 w-full flex items-start gap-4 p-3 rounded-xl transition-all text-left border ${isSelected
                                        ? 'bg-white border-blue-200 shadow-md ring-1 ring-blue-100'
                                        : 'border-transparent hover:bg-gray-100'
                                        }`}
                                >
                                    {/* Timeline Dot */}
                                    <div className={`
                                        w-6 h-6 rounded-full flex items-center justify-center border-2 flex-shrink-0 mt-0.5
                                        ${isHead
                                            ? 'bg-blue-600 border-blue-600 text-white'
                                            : isSelected
                                                ? 'bg-blue-50 border-blue-500 text-blue-600'
                                                : 'bg-white border-gray-300 text-gray-400'
                                        }
                                    `}>
                                        <span className="text-[10px] font-bold">{idx + 1}</span>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className={`text-sm font-bold truncate ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                                                {session.role}
                                            </span>
                                            {isHead && (
                                                <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded">
                                                    CURRENT
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(session.date).toLocaleDateString()}
                                        </p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <img src={session.agent.avatar} className="w-5 h-5 rounded-full border border-gray-100" />
                                            <span className="text-[10px] text-gray-500 truncate">{session.agent.name}</span>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* Navigation Controls */}
                <div className="p-4 border-t border-gray-200 bg-white">
                    <div className="flex items-center justify-between gap-3">
                        <button
                            onClick={() => handleSelect(selectedIndex - 1)}
                            disabled={selectedIndex === 0}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" /> Prev
                        </button>
                        <button
                            onClick={() => handleSelect(selectedIndex + 1)}
                            disabled={selectedIndex === history.length - 1}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50/50">
                {/* Header for Detail View */}
                <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between flex-shrink-0">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {isCurrent ? 'Progress Dashboard' : 'Interview Inspector'}
                            </h2>
                            {!isCurrent && (
                                <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wider">
                                    Historical Snapshot
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                            {isCurrent
                                ? 'Analyzing your growth trajectory and current readiness.'
                                : `Detailed report for Session #${selectedIndex + 1} on ${new Date(selectedSession.date).toLocaleDateString()}.`
                            }
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {isCurrent && (
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setViewMode('progress')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'progress' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Progress
                                </button>
                                <button
                                    onClick={() => setViewMode('report')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'report' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Report
                                </button>
                            </div>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-hidden relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedSession.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0"
                        >
                            {isCurrent && viewMode === 'progress' ? (
                                <ProgressDashboard history={history} />
                            ) : (
                                <div className="h-full overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-gray-200">
                                    <ReportDetail session={selectedSession} />
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
};

export default HistoryExplorer;
