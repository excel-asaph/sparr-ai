import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Notebook } from 'lucide-react';

const Workbook = ({ isOpen, content, onContentChange }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }} // smooth cubic-bezier
                    className="absolute inset-0 z-10 flex flex-col pt-32 pb-40 px-12"
                >
                    <div className="w-full h-full bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                        <div className="bg-gray-50 border-b border-gray-100 px-6 py-3 flex items-center justify-between">
                            <span className="font-semibold text-gray-600 text-sm flex items-center gap-2">
                                <Notebook className="w-4 h-4" />
                                Candidate Workbook
                            </span>
                            <span className="text-xs text-gray-400">Markdown Supported</span>
                        </div>
                        <textarea
                            value={content}
                            onChange={(e) => onContentChange(e.target.value)}
                            placeholder="# Notes & Scratchpad\n\nUse this space to:\n- Dot down system specifications\n- Structure your STAR method answers\n- Write pseudo-code..."
                            className="flex-1 w-full p-8 resize-none focus:outline-none text-gray-700 font-mono leading-relaxed overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent"
                            spellCheck={false}
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Workbook;
