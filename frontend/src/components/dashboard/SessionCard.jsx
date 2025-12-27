import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, TrendingUp } from 'lucide-react';

const SessionCard = ({ session, isActive, onClick }) => {
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-500 bg-green-50';
        if (score >= 60) return 'text-yellow-500 bg-yellow-50';
        return 'text-red-500 bg-red-50';
    };

    const getScoreBorderColor = (score) => {
        if (score >= 80) return 'border-green-200';
        if (score >= 60) return 'border-yellow-200';
        return 'border-red-200';
    };

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`
                relative p-4 rounded-2xl cursor-pointer transition-all duration-200
                ${isActive
                    ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-md'
                    : 'bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm'
                }
            `}
        >
            {/* Active Indicator */}
            {isActive && (
                <div className="absolute top-3 right-3 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            )}

            {/* Company Badge */}
            <div className="flex items-center gap-2 mb-3">
                <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: session.companyColor }}
                >
                    {session.company.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-800 truncate">{session.role}</h3>
                    <p className="text-xs text-gray-500">{session.company}</p>
                </div>
            </div>

            {/* Score */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold mb-3 ${getScoreColor(session.overallScore)}`}>
                <TrendingUp className="w-3.5 h-3.5" />
                {session.overallScore}/100
            </div>

            {/* Date */}
            <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(session.date)}
                </span>
            </div>
        </motion.div>
    );
};

export default SessionCard;
