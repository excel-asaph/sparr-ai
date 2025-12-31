/**
 * @fileoverview Delete Confirmation Modal Component
 * 
 * Modal dialog for confirming interview session deletion.
 * Requires users to type the interview ID to confirm, with special
 * warnings for linked interview chains (Spaces).
 * 
 * @module components/dashboard/DeleteConfirmationModal
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Trash2 } from 'lucide-react';

const DeleteConfirmationModal = ({ interview, onConfirm, onCancel, isDeleting }) => {
    const [confirmId, setConfirmId] = useState('');
    const isMatched = confirmId === interview.id;

    // Determine context (Space vs Single)
    const isSpace = interview.isSpace || interview.childId; // Space or Parent

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onCancel}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-[#1a1a1a] rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="p-6 pb-0 flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                            <Trash2 className="w-6 h-6 text-red-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Delete Session?</h3>
                            <p className="text-sm text-gray-400">This action cannot be undone.</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Warning for Spaces */}
                    {isSpace && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <div className="text-sm text-amber-200">
                                <strong>Warning:</strong> You are deleting a linked Space. This will permanently delete <strong>all linked interviews</strong> in this chain from the database.
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Type Interview ID to Confirm
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={confirmId}
                                onChange={(e) => setConfirmId(e.target.value)}
                                placeholder={interview.id}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500/50 transition-colors placeholder:text-gray-600 font-mono"
                            />
                        </div>
                        <p className="text-xs text-gray-500">
                            ID: <span className="font-mono select-all text-gray-400">{interview.id}</span>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 pt-0 flex items-center gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-gray-300 hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => isMatched && onConfirm()}
                        disabled={!isMatched || isDeleting}
                        className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2
                            ${isMatched && !isDeleting
                                ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20'
                                : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
                            }`}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete Forever'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default DeleteConfirmationModal;
